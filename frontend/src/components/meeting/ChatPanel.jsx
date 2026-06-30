import { useState, useRef, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function ChatPanel({ messages, onSend, onClose, meetingTitle }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <aside className="w-80 bg-zoom-panel border-l border-white/10 flex flex-col shrink-0">
      <header className="h-12 flex items-center justify-between px-4 border-b border-white/10">
        <span className="text-white text-sm font-medium truncate">{meetingTitle || 'Chat'}</span>
        <div className="flex gap-1">
          <button className="p-1.5 text-white/60 hover:text-white rounded"><ExternalLink className="w-4 h-4" /></button>
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white rounded"><X className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex border-b border-white/10">
        <button className="flex-1 py-2 text-sm text-zoom-blue border-b-2 border-zoom-blue">Everyone</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-white/40 text-sm text-center mt-8">No messages yet</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id || msg.createdAt} className="text-sm">
            <span className="text-zoom-blue font-medium">{msg.senderName}</span>
            <span className="text-white/40 text-xs ml-2">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <p className="text-white/90 mt-0.5">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-white/10">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message everyone"
          className="w-full bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-zoom-blue placeholder:text-white/40"
        />
      </form>
    </aside>
  );
}
