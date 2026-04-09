import Phaser from 'phaser';
import { StarField } from './StarField';

// ROYGBIV as [r, g, b] triplets for smooth lerping
const RAINBOW: [number, number, number][] = [
  [0xff, 0x22, 0x22],  // red
  [0xff, 0x88, 0x00],  // orange
  [0xff, 0xee, 0x00],  // yellow
  [0x22, 0xcc, 0x44],  // green
  [0x22, 0x66, 0xff],  // blue
  [0x44, 0x00, 0xcc],  // indigo
  [0xaa, 0x44, 0xff],  // violet
];

// Sample a smoothly interpolated rainbow color at position t (wraps at 7)
function sampleRainbow(t: number): number {
  const n = RAINBOW.length;
  const wrapped = ((t % n) + n) % n;
  const lo = Math.floor(wrapped);
  const hi = (lo + 1) % n;
  const f = wrapped - lo;
  const [r0, g0, b0] = RAINBOW[lo];
  const [r1, g1, b1] = RAINBOW[hi];
  const r = Math.round(r0 + (r1 - r0) * f);
  const g = Math.round(g0 + (g1 - g0) * f);
  const b = Math.round(b0 + (b1 - b0) * f);
  return (r << 16) | (g << 8) | b;
}

const CIRCLE_RADII = [20, 30, 40, 50, 60, 70, 80]; // index 0 = innermost (player)

const JOINT_DISTANCE = 17;
const MOVE_SPEED = 8;

// Circles don't collide with each other
const CHAIN_CATEGORY = 0x0002;
const CHAIN_MASK = 0x0001;

// How fast the color wave drifts from head toward tail (units: rainbow positions per second)
const COLOR_DRIFT_SPEED = 4;

export class GameScene extends Phaser.Scene {
  private starField!: StarField;
  private bodies: MatterJS.BodyType[] = [];
  private graphics: Phaser.GameObjects.Graphics[] = [];
  private colorOffset = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.starField = new StarField(this);
    this.colorOffset = 0;

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.bodies = [];
    this.graphics = [];

    for (let i = 0; i < CIRCLE_RADII.length; i++) {
      const radius = CIRCLE_RADII[i];

      const body = this.matter.add.circle(cx, cy, radius, {
        frictionAir: 0.12,
        restitution: 0.1,
        mass: radius * 0.5,
        label: `circle_${i}`,
        collisionFilter: { category: CHAIN_CATEGORY, mask: CHAIN_MASK },
      });
      this.bodies[i] = body;

      const gfx = this.add.graphics();
      // Smaller index = smaller circle = renders on top
      // Depth: invert so i=0 (innermost) has highest depth
      gfx.setDepth(CIRCLE_RADII.length - i);
      this.graphics[i] = gfx;
    }

    // HUD
    this.add.text(12, 12, '{{null | void}}', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#ffffff',
    }).setAlpha(0.85).setDepth(100).setScrollFactor(0);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(time: number, delta: number): void {
    this.starField.update(time);
    this.colorOffset += (delta / 1000) * COLOR_DRIFT_SPEED;
    this.handleInput();
    this.enforceChain();
    this.drawCircles();
    this.wrapBounds();
  }

  // Pull-only rope constraint: only activates when a pair is stretched beyond
  // JOINT_DISTANCE. When within range, neighbours are left completely alone
  // so turning tightly doesn't push later circles out of the way.
  private enforceChain(): void {
    for (let i = 0; i < this.bodies.length - 1; i++) {
      const leader = this.bodies[i];
      const follower = this.bodies[i + 1];
      if (!leader || !follower) continue;

      const dx = follower.position.x - leader.position.x;
      const dy = follower.position.y - leader.position.y;
      const distSq = dx * dx + dy * dy;

      // Within the slack zone — do nothing
      if (distSq <= JOINT_DISTANCE * JOINT_DISTANCE) continue;

      const dist = Math.sqrt(distSq);
      const nx = dx / dist; // unit vector: leader → follower
      const ny = dy / dist;

      // Hard-snap follower to exactly JOINT_DISTANCE behind leader
      this.matter.body.setPosition(follower, {
        x: leader.position.x + nx * JOINT_DISTANCE,
        y: leader.position.y + ny * JOINT_DISTANCE,
      });

      // Cancel the velocity component that would stretch the joint further
      const vDot = follower.velocity.x * nx + follower.velocity.y * ny;
      if (vDot > 0) {
        this.matter.body.setVelocity(follower, {
          x: follower.velocity.x - vDot * nx,
          y: follower.velocity.y - vDot * ny,
        });
      }
    }
  }

  private handleInput(): void {
    const body = this.bodies[0];
    if (!body) return;

    let vx = 0;
    let vy = 0;

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    if (left) vx -= MOVE_SPEED;
    if (right) vx += MOVE_SPEED;
    if (up) vy -= MOVE_SPEED;
    if (down) vy += MOVE_SPEED;

    if (vx !== 0 || vy !== 0) {
      if (vx !== 0 && vy !== 0) {
        const factor = 1 / Math.sqrt(2);
        vx *= factor;
        vy *= factor;
      }
      this.matter.body.setVelocity(body, { x: vx, y: vy });
    }
  }

  // Redraw each circle each frame with its current interpolated color and physics position
  private drawCircles(): void {
    for (let i = 0; i < this.bodies.length; i++) {
      const body = this.bodies[i];
      const gfx = this.graphics[i];
      if (!body || !gfx) continue;

      const { x, y } = body.position;
      const radius = CIRCLE_RADII[i];
      // i=0 (head) samples colorOffset; each step back is -1 so head color leads the wave
      const color = sampleRainbow(this.colorOffset - i);

      gfx.clear();
      gfx.fillStyle(color, 1);
      gfx.fillCircle(x, y, radius);
      gfx.lineStyle(1, 0xffffff, 0.15);
      gfx.strokeCircle(x, y, radius);
    }
  }

  private wrapBounds(): void {
    const { width, height } = this.scale;
    const pad = 100;

    for (const body of this.bodies) {
      if (!body) continue;
      const { x, y } = body.position;
      let nx = x;
      let ny = y;

      if (x < -pad) nx = width + pad;
      else if (x > width + pad) nx = -pad;
      if (y < -pad) ny = height + pad;
      else if (y > height + pad) ny = -pad;

      if (nx !== x || ny !== y) {
        this.matter.body.setPosition(body, { x: nx, y: ny });
      }
    }
  }

  shutdown(): void {
    this.starField?.destroy();
    this.graphics.forEach(g => g?.destroy());
    this.graphics = [];
    this.bodies = [];
  }
}
