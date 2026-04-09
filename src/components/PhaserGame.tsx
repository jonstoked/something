import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config';
import { EventBus, EVENTS } from '../game/EventBus';

interface PhaserGameProps {
  onSceneChange?: (scene: 'intro' | 'game') => void;
}

export function PhaserGame({ onSceneChange }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = createGameConfig(containerRef.current);
    gameRef.current = new Phaser.Game(config);

    const handleStartGame = () => {
      const game = gameRef.current;
      if (!game) return;
      game.scene.stop('IntroScene');
      game.scene.start('GameScene');
      onSceneChange?.('game');
    };

    EventBus.on(EVENTS.START_GAME, handleStartGame);

    return () => {
      EventBus.off(EVENTS.START_GAME, handleStartGame);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}
