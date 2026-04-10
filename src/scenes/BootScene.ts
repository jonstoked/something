import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.audio('theme', 'music/theme.mp3');
  }

  create(): void {
    this.sound.add('theme', { loop: true, volume: 0.5 }).play();

    // Render an off-screen dummy text with the game font so the canvas
    // context caches the glyph atlas before IntroScene draws its first line.
    const warmup = this.add.text(-9999, -9999, 'warmup', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
    });

    // Wait one frame for the warmup text to paint, then start the intro.
    this.time.delayedCall(0, () => {
      warmup.destroy();
      this.scene.start('IntroScene');
    });
  }
}
