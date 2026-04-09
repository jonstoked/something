import Phaser from 'phaser';
import { StarField } from './StarField';
import { EventBus, EVENTS } from '../game/EventBus';

const INTRO_TEXT = [
  'the basement creeper society',
  'met last thursday to determine',
  'the whereabouts of the lost',
  '[redacted].',
  '',
  'it has been missing since our',
  'maintenance man, [redacted]',
  'found that the [redacted]',
  'no longer [redacted]',
  'unless you reboot it',
  'and kick it a few times.',
  '',
  'as soon as we find [redacted]',
  'we can continue',
  'with our vital mission.',
  '',
  'please help creeperabcdefghijkl1,',
  "you're our only hope",
];

export class IntroScene extends Phaser.Scene {
  private starField!: StarField;
  private textObjects: Phaser.GameObjects.Text[] = [];
  private lineIndex = 0;
  private revealTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    this.starField = new StarField(this);
    this.textObjects = [];
    this.lineIndex = 0;
    this.scheduleNextLine();
  }

  private scheduleNextLine(): void {
    const delay = this.lineIndex === 0 ? 800 : 700;

    this.revealTimer = this.time.addEvent({
      delay,
      callback: this.revealLine,
      callbackScope: this,
    });
  }

  private revealLine(): void {
    if (this.lineIndex >= INTRO_TEXT.length) {
      // All lines revealed — signal React to show the button
      this.time.delayedCall(600, () => {
        EventBus.emit(EVENTS.INTRO_COMPLETE);
      });
      return;
    }

    const line = INTRO_TEXT[this.lineIndex];
    const { width, height } = this.scale;

    // Determine y position based on how many text objects are already placed
    const totalLines = INTRO_TEXT.length;
    const lineHeight = 28;
    const totalTextHeight = totalLines * lineHeight;
    const startY = (height - totalTextHeight) / 2;
    const y = startY + this.lineIndex * lineHeight;

    if (line !== '') {
      const txt = this.add.text(width / 2, y, line, {
        fontFamily: '"Press Start 2P"',
        fontSize: '11px',
        color: '#cccccc',
        align: 'center',
      });
      txt.setOrigin(0.5, 0);
      txt.setAlpha(0);
      txt.setDepth(1);

      this.tweens.add({
        targets: txt,
        alpha: 1,
        duration: 500,
        ease: 'Sine.easeIn',
      });

      this.textObjects.push(txt);
    }

    this.lineIndex++;
    this.scheduleNextLine();
  }

  update(time: number): void {
    this.starField.update(time);
  }

  shutdown(): void {
    this.revealTimer?.remove();
    this.starField?.destroy();
    this.textObjects.forEach(t => t.destroy());
    this.textObjects = [];
  }
}
