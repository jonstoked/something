import Phaser from 'phaser';

// Singleton event emitter for Phaser <-> React communication
export const EventBus = new Phaser.Events.EventEmitter();

export const EVENTS = {
  INTRO_COMPLETE: 'intro-complete',
  START_GAME: 'start-game',
} as const;
