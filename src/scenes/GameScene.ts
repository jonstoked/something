import Phaser from 'phaser';
import { StarField } from './StarField';

const CIRCLE_DEFS = [
  { radius: 20, color: 0xff2222 },  // red     - player (innermost)
  { radius: 30, color: 0xff8800 },  // orange
  { radius: 40, color: 0xffee00 },  // yellow
  { radius: 50, color: 0x22cc44 },  // green
  { radius: 60, color: 0x2266ff },  // blue
  { radius: 70, color: 0x4400cc },  // indigo
  { radius: 80, color: 0xaa44ff },  // violet
];

const JOINT_DISTANCE = 17;         // slightly less than smallest radius (20)
const MOVE_SPEED = 4;
const CONSTRAINT_STIFFNESS = 0.08;
const CONSTRAINT_DAMPING = 0.05;

// All chain circles share this category and mask each other out — no inter-circle collisions
const CHAIN_CATEGORY = 0x0002;
const CHAIN_MASK = 0x0001;

export class GameScene extends Phaser.Scene {
  private starField!: StarField;
  private bodies: MatterJS.BodyType[] = [];
  private graphics: Phaser.GameObjects.Graphics[] = [];
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

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.bodies = [];
    this.graphics = [];

    // Create circles from outermost to innermost so innermost renders on top
    for (let i = CIRCLE_DEFS.length - 1; i >= 0; i--) {
      const def = CIRCLE_DEFS[i];
      const body = this.matter.add.circle(cx, cy, def.radius, {
        frictionAir: 0.12,
        restitution: 0.1,
        mass: def.radius * 0.5,
        label: `circle_${i}`,
        collisionFilter: {
          category: CHAIN_CATEGORY,
          mask: CHAIN_MASK,
        },
      });
      this.bodies[i] = body;

      const gfx = this.add.graphics();
      gfx.fillStyle(def.color, 1);
      gfx.fillCircle(0, 0, def.radius);
      gfx.lineStyle(1, 0xffffff, 0.15);
      gfx.strokeCircle(0, 0, def.radius);
      gfx.setDepth(i);
      this.graphics[i] = gfx;
    }

    // Connect each circle to the next via a constraint (chain: 0→1→2...→6)
    for (let i = 0; i < CIRCLE_DEFS.length - 1; i++) {
      this.matter.add.constraint(
        this.bodies[i],
        this.bodies[i + 1],
        JOINT_DISTANCE,
        CONSTRAINT_STIFFNESS,
        { damping: CONSTRAINT_DAMPING }
      );
    }

    // HUD: top-left status text
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

  update(time: number): void {
    this.starField.update(time);
    this.handleInput();
    this.syncGraphics();
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

  private syncGraphics(): void {
    for (let i = 0; i < this.bodies.length; i++) {
      const body = this.bodies[i];
      const gfx = this.graphics[i];
      if (body && gfx) {
        gfx.setPosition(body.position.x, body.position.y);
      }
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
