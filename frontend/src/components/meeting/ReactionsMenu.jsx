const REACTIONS = ['👏', '👍', '❤️', '😂', '😮', '🎉'];
const STATUS = ['✅', '❌', '⏪', '⏩', '☕'];

export default function ReactionsMenu({ onReaction, onRaiseHand, onClose }) {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-zinc-800 rounded-xl p-4 shadow-xl border border-white/10 z-50 min-w-[280px]">
      <div className="flex gap-2 justify-center mb-3">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onReaction(emoji); onClose(); }}
            className="text-2xl hover:scale-125 transition-transform p-1"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-center mb-4">
        {STATUS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onReaction(emoji); onClose(); }}
            className="text-xl hover:scale-125 transition-transform p-1"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { onRaiseHand(); onClose(); }}
          className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-full"
        >
          ✋ Raise hand
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-full"
        >
          ⌛ Be right back
        </button>
      </div>
    </div>
  );
}

