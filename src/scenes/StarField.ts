import Phaser from 'phaser';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  graphics: Phaser.GameObjects.Graphics;
}

export class StarField {
  private scene: Phaser.Scene;
  private stars: Star[] = [];
  private readonly STAR_COUNT = 120;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createStars();
  }

  private createStars(): void {
    const { width, height } = this.scene.scale;

    for (let i = 0; i < this.STAR_COUNT; i++) {
      const radius = Phaser.Math.FloatBetween(0.5, 1.8);
      const baseAlpha = Phaser.Math.FloatBetween(0.3, 0.9);
      const star: Star = {
        x: Phaser.Math.FloatBetween(0, width),
        y: Phaser.Math.FloatBetween(0, height),
        radius,
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: Phaser.Math.FloatBetween(0.0003, 0.0012),
        twinkleOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
        graphics: this.scene.add.graphics(),
      };

      star.graphics.fillStyle(0xffffff, star.alpha);
      star.graphics.fillCircle(star.x, star.y, star.radius);
      star.graphics.setDepth(-10);

      this.stars.push(star);
    }
  }

  update(time: number): void {
    for (const star of this.stars) {
      const newAlpha =
        star.baseAlpha * 0.5 +
        star.baseAlpha * 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);

      if (Math.abs(newAlpha - star.alpha) > 0.005) {
        star.alpha = newAlpha;
        star.graphics.clear();
        star.graphics.fillStyle(0xffffff, star.alpha);
        star.graphics.fillCircle(star.x, star.y, star.radius);
      }
    }
  }

  destroy(): void {
    for (const star of this.stars) {
      star.graphics.destroy();
    }
    this.stars = [];
  }
}
