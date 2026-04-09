import Phaser from 'phaser';
import { StarField } from './StarField';

// ROYGBIV as [r, g, b] triplets for smooth lerping
const RAINBOW: [number, number, number][] = [
  [0xff, 0x22, 0x22],
  [0xff, 0x88, 0x00],
  [0xff, 0xee, 0x00],
  [0x22, 0xcc, 0x44],
  [0x22, 0x66, 0xff],
  [0x44, 0x00, 0xcc],
  [0xaa, 0x44, 0xff],
];

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

const CIRCLE_RADII = [20, 30, 40, 50, 60, 70, 80];

const JOINT_DISTANCE = 17;
const MOVE_SPEED = 8;
const COLOR_DRIFT_SPEED = 4;

// Collision categories
// Worm segments don't collide with each other, but do push shapes.
// Shapes collide with worm AND with each other.
const CHAIN_CATEGORY = 0x0002;
const SHAPE_CATEGORY = 0x0004;
const CHAIN_MASK = SHAPE_CATEGORY;                    // hits shapes only
const SHAPE_MASK = SHAPE_CATEGORY | CHAIN_CATEGORY;  // hits shapes + worm


interface ShapeData {
  body: MatterJS.BodyType;
  gfx: Phaser.GameObjects.Graphics;
  color: number;
  isCircle: boolean;
  radius: number; // used when isCircle=true
}

export class GameScene extends Phaser.Scene {
  private starField!: StarField;
  private bodies: MatterJS.BodyType[] = [];
  private graphics: Phaser.GameObjects.Graphics[] = [];
  private shapes: ShapeData[] = [];
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
    this.shapes = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.bodies = [];
    this.graphics = [];

    for (let i = 0; i < CIRCLE_RADII.length; i++) {
      const radius = CIRCLE_RADII[i];
      const body = this.matter.add.circle(cx, cy, radius, {
        frictionAir: 0.12,
        restitution: 0.2,
        mass: radius * 0.5,
        label: `circle_${i}`,
        collisionFilter: { category: CHAIN_CATEGORY, mask: CHAIN_MASK },
      });
      this.bodies[i] = body;

      const gfx = this.add.graphics();
      gfx.setDepth(CIRCLE_RADII.length - i);
      this.graphics[i] = gfx;
    }

    this.spawnShapes(width, height, cx, cy);

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

  private spawnShapes(width: number, height: number, cx: number, cy: number): void {
    // One frictionless circle — once hit it glides forever and wraps at edges
    let x: number, y: number;
    do {
      x = Phaser.Math.FloatBetween(80, width - 80);
      y = Phaser.Math.FloatBetween(80, height - 80);
    } while (Math.hypot(x - cx, y - cy) < 160);

    const radius = 22;
    const body = this.matter.add.circle(x, y, radius, {
      frictionAir: 0,
      friction: 0,
      restitution: 1,
      mass: 3,
      collisionFilter: { category: SHAPE_CATEGORY, mask: SHAPE_MASK },
    });

    const gfx = this.add.graphics();
    gfx.setDepth(0);

    this.shapes.push({ body, gfx, color: 0xffffff, isCircle: true, radius });
  }

  update(time: number, delta: number): void {
    this.starField.update(time);
    this.colorOffset += (delta / 1000) * COLOR_DRIFT_SPEED;
    this.handleInput();
    this.enforceChain();
    this.drawCircles();
    this.drawShapes();
    this.wrapBounds();
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

  // Pull-only rope: only activates when a pair is stretched beyond JOINT_DISTANCE.
  private enforceChain(): void {
    for (let i = 0; i < this.bodies.length - 1; i++) {
      const leader = this.bodies[i];
      const follower = this.bodies[i + 1];
      if (!leader || !follower) continue;

      const dx = follower.position.x - leader.position.x;
      const dy = follower.position.y - leader.position.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= JOINT_DISTANCE * JOINT_DISTANCE) continue;

      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      this.matter.body.setPosition(follower, {
        x: leader.position.x + nx * JOINT_DISTANCE,
        y: leader.position.y + ny * JOINT_DISTANCE,
      });

      const vDot = follower.velocity.x * nx + follower.velocity.y * ny;
      if (vDot > 0) {
        this.matter.body.setVelocity(follower, {
          x: follower.velocity.x - vDot * nx,
          y: follower.velocity.y - vDot * ny,
        });
      }
    }
  }

  private drawCircles(): void {
    for (let i = 0; i < this.bodies.length; i++) {
      const body = this.bodies[i];
      const gfx = this.graphics[i];
      if (!body || !gfx) continue;

      const { x, y } = body.position;
      const radius = CIRCLE_RADII[i];
      const color = sampleRainbow(this.colorOffset - i);

      gfx.clear();
      gfx.fillStyle(color, 1);
      gfx.fillCircle(x, y, radius);
      gfx.lineStyle(1, 0xffffff, 0.15);
      gfx.strokeCircle(x, y, radius);
    }
  }

  private drawShapes(): void {
    for (const s of this.shapes) {
      s.gfx.clear();
      s.gfx.fillStyle(s.color, 0.85);
      s.gfx.lineStyle(1, 0xffffff, 0.25);

      if (s.isCircle) {
        const { x, y } = s.body.position;
        s.gfx.fillCircle(x, y, s.radius);
        s.gfx.strokeCircle(x, y, s.radius);
      } else {
        const verts = s.body.vertices;
        if (!verts || verts.length === 0) continue;
        s.gfx.beginPath();
        s.gfx.moveTo(verts[0]!.x, verts[0]!.y);
        for (let i = 1; i < verts.length; i++) {
          s.gfx.lineTo(verts[i]!.x, verts[i]!.y);
        }
        s.gfx.closePath();
        s.gfx.fillPath();
        s.gfx.strokePath();
      }
    }
  }

  private wrapBounds(): void {
    const { width, height } = this.scale;
    const pad = 100;

    // Wrap worm bodies
    for (const body of this.bodies) {
      if (!body) continue;
      const { x, y } = body.position;
      const nx = x < -pad ? width + pad : x > width + pad ? -pad : x;
      const ny = y < -pad ? height + pad : y > height + pad ? -pad : y;
      if (nx !== x || ny !== y) this.matter.body.setPosition(body, { x: nx, y: ny });
    }

    // Wrap shape bodies
    for (const s of this.shapes) {
      const { x, y } = s.body.position;
      const nx = x < -pad ? width + pad : x > width + pad ? -pad : x;
      const ny = y < -pad ? height + pad : y > height + pad ? -pad : y;
      if (nx !== x || ny !== y) this.matter.body.setPosition(s.body, { x: nx, y: ny });
    }
  }

  shutdown(): void {
    this.starField?.destroy();
    this.graphics.forEach(g => g?.destroy());
    this.shapes.forEach(s => s.gfx.destroy());
    this.graphics = [];
    this.bodies = [];
    this.shapes = [];
  }
}
