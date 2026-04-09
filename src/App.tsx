import { useState } from 'react';
import { PhaserGame } from './components/PhaserGame';
import { IntroOverlay } from './components/IntroOverlay';
import { GameUI } from './components/GameUI';

type SceneState = 'intro' | 'game';

export default function App() {
  const [scene, setScene] = useState<SceneState>('intro');

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <PhaserGame onSceneChange={setScene} />
      {scene === 'intro' && (
        <IntroOverlay onStart={() => setScene('game')} />
      )}
      {scene === 'game' && <GameUI />}
    </div>
  );
}
