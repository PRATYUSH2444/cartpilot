import { useState } from 'react';
import { Send } from 'lucide-react';

interface ComposerProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({ onSendMessage, isLoading = false }) => {
  const [input, setInput] = useState('');

  const suggestions = [
    {
      label: '🧀 Add Paneer & Green Peas',
      prompt: 'Add 2 fresh malai paneer and green peas to my cart',
    },
    {
      label: '🍚 Basmati Rice & Desi Ghee',
      prompt: 'Add royal aged basmati rice and pure desi cow ghee',
    },
    { label: '🛡️ Spending Rules', prompt: 'Show my current spending limits and mandate rules' },
    {
      label: '🛒 View Active Cart',
      prompt: 'Show my current cart and authoritative price breakdown',
    },
    { label: '⚡ Initiate Checkout', prompt: 'Proceed to checkout and reserve inventory' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleSuggestionClick = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  return (
    <div className="w-full bg-card/80 dark:bg-card-top/80 backdrop-blur-xl border border-brd rounded-2xl p-3 shadow-xl shadow-black/5 transition-all">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 no-scrollbar">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSuggestionClick(s.prompt)}
            disabled={isLoading}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-brd bg-paper/60 hover:bg-card hover:border-acc/40 text-ink transition-all flex items-center gap-1 font-medium disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask CartPilot to find vegetarian groceries, build a cart, or verify limits..."
          disabled={isLoading}
          className="w-full pl-4 pr-12 py-3 rounded-xl bg-paper/80 border border-brd focus:border-acc focus:outline-none text-xs sm:text-sm text-ink placeholder:text-mut font-sans transition-all"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 p-2 rounded-lg bg-acc text-white hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-acc transition-all shadow-md shadow-blue-500/20"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
