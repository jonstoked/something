import Phaser from 'phaser';
import { StarField } from './StarField';

// Each line is an array of segments; [redacted] tokens get a different color.
type Segment = { text: string; yellow: boolean };

function parseLine(raw: string): Segment[] {
  const parts = raw.split(/(\[redacted\])/);
  return parts
    .filter(p => p.length > 0)
    .map(p => ({ text: p, yellow: p === '[redacted]' }));
}

// '' entries become blank spacer lines.
const INTRO_LINES = [
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

const FONT = '"Press Start 2P"';
const FONT_SIZE = '11px';
const LINE_HEIGHT = 28;
const TEXT_COLOR = '#cccccc';
const REDACTED_COLOR = '#ffee44';

export class IntroScene extends Phaser.Scene {
  private starField!: StarField;
  private allTextObjects: Phaser.GameObjects.Text[] = [];
  private lineIndex = 0;
  private startY = 0;

  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    this.starField = new StarField(this);
    this.allTextObjects = [];
    this.lineIndex = 0;

    const { height } = this.scale;
    const totalBlockHeight = INTRO_LINES.length * LINE_HEIGHT;
    // Centre the text block; leave 80px below for the button
    this.startY = Math.max(20, (height - totalBlockHeight - 80) / 2);

    this.scheduleNextLine();
  }

  private scheduleNextLine(): void {
    this.time.addEvent({
      delay: this.lineIndex === 0 ? 800 : 700,
      callback: this.revealLine,
      callbackScope: this,
    });
  }

  private revealLine(): void {
    if (this.lineIndex >= INTRO_LINES.length) {
      // All lines done — show the button after a short pause
      this.time.delayedCall(600, this.showButton, [], this);
      return;
    }

    const raw = INTRO_LINES[this.lineIndex];
    const y = this.startY + this.lineIndex * LINE_HEIGHT;

    if (raw !== '') {
      this.renderSegmentedLine(raw, y);
    }

    this.lineIndex++;
    this.scheduleNextLine();
  }

  // Splits a line on [redacted], creates one Text per segment,
  // measures total width, then centres the group horizontally.
  private renderSegmentedLine(raw: string, y: number): void {
    const { width } = this.scale;
    const segments = parseLine(raw);

    // Create text objects at a temp position to measure them
    const txts = segments.map(seg =>
      this.add.text(0, 0, seg.text, {
        fontFamily: FONT,
        fontSize: FONT_SIZE,
        color: seg.yellow ? REDACTED_COLOR : TEXT_COLOR,
      })
    );

    const totalWidth = txts.reduce((sum, t) => sum + t.width, 0);
    let x = (width - totalWidth) / 2;

    for (const txt of txts) {
      txt.setPosition(x, y);
      txt.setAlpha(0);
      txt.setDepth(1);
      this.tweens.add({ targets: txt, alpha: 1, duration: 500, ease: 'Sine.easeIn' });
      x += txt.width;
      this.allTextObjects.push(txt);
    }
  }

  private showButton(): void {
    const { width } = this.scale;
    const buttonY = this.startY + INTRO_LINES.length * LINE_HEIGHT + 32;

    const label = this.add.text(0, 0, "let's go", {
      fontFamily: FONT,
      fontSize: FONT_SIZE,
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 },
    });

    // Centre the button horizontally under the text block
    label.setPosition(width / 2 - label.width / 2, buttonY);
    label.setAlpha(0);
    label.setDepth(2);
    label.setInteractive({ useHandCursor: true });

    label.on('pointerover', () => label.setStyle({ color: '#ffffff', backgroundColor: '#333333' }));
    label.on('pointerout',  () => label.setStyle({ color: '#000000', backgroundColor: '#ffffff' }));
    label.on('pointerdown', () => this.scene.start('GameScene'));

    this.tweens.add({ targets: label, alpha: 1, duration: 600, ease: 'Sine.easeIn' });
    this.allTextObjects.push(label);
  }

  update(time: number): void {
    this.starField.update(time);
  }

  shutdown(): void {
    this.starField?.destroy();
    this.allTextObjects.forEach(t => t.destroy());
    this.allTextObjects = [];
  }
}
