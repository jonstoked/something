export function GameUI() {
  return (
    <div className="absolute top-4 left-4 z-10 pointer-events-none">
      <span
        className="font-pixel text-white"
        style={{ fontSize: '10px', lineHeight: 1.6, opacity: 0.85 }}
      >
        {'{{null | void}}'}
      </span>
    </div>
  );
}
