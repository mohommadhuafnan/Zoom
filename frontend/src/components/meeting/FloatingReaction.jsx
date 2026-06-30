import { useEffect } from 'react';

export function FloatingReaction({ emoji, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-5xl animate-bounce z-50 pointer-events-none">
      {emoji}
    </div>
  );
}
