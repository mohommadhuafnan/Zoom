import { X } from 'lucide-react';

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between py-3 px-4 hover:bg-white/5 cursor-pointer">
      <span className="text-white text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-zoom-blue' : 'bg-zinc-600'}`}
      >
        <span
          className={`block w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

export default function HostToolsPanel({ onClose, onEndMeeting }) {
  return (
    <aside className="w-80 bg-zoom-panel border-l border-white/10 flex flex-col shrink-0">
      <header className="h-12 flex items-center justify-between px-4 border-b border-white/10">
        <span className="text-white text-sm font-medium">Host tools</span>
        <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white rounded">
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <Toggle label="Lock meeting" checked={false} onChange={() => {}} />
        <Toggle label="Enable waiting room" checked={false} onChange={() => {}} />
        <Toggle label="Hide profile pictures" checked={false} onChange={() => {}} />

        <div className="border-t border-white/10 mt-2 pt-2">
          <button
            onClick={onEndMeeting}
            className="w-full text-left px-4 py-3 text-red-400 text-sm hover:bg-white/5"
          >
            End meeting for all
          </button>
        </div>
      </div>
    </aside>
  );
}
