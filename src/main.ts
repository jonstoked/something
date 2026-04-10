import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { IntroScene } from './scenes/IntroScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, IntroScene, GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Explicitly load the exact font + size used by Phaser text objects.
// document.fonts.ready only signals the fetch is done; fonts.load() blocks
// until the specific glyph set is built and ready to paint.
document.fonts.load('11px "Press Start 2P"').then(() => {
  new Phaser.Game(config);
});
