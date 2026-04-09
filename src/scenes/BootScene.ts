import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.audio('theme', 'music/theme.mp3');
  }

  create(): void {
    // game.sound is global — music survives all scene transitions
    this.sound.add('theme', { loop: true, volume: 0.5 }).play();
    this.scene.start('IntroScene');
  }
}
