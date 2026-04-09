import { useEffect, useState } from 'react';
import { EventBus, EVENTS } from '../game/EventBus';

interface IntroOverlayProps {
  onStart: () => void;
}

export function IntroOverlay({ onStart }: IntroOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleIntroComplete = () => setVisible(true);
    EventBus.on(EVENTS.INTRO_COMPLETE, handleIntroComplete);
    return () => {
      EventBus.off(EVENTS.INTRO_COMPLETE, handleIntroComplete);
    };
  }, []);

  const handleClick = () => {
    EventBus.emit(EVENTS.START_GAME);
    onStart();
  };

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none z-10">
      <button
        onClick={handleClick}
        className="
          pointer-events-auto
          font-pixel
          text-xs
          text-black
          bg-white
          px-6
          py-3
          border-2
          border-white
          hover:bg-transparent
          hover:text-white
          transition-colors
          duration-200
          animate-fade-in
          tracking-wide
        "
        style={{ animation: 'fadeIn 0.6s ease-in forwards' }}
      >
        let's go
      </button>
    </div>
  );
}
