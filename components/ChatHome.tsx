import { FC, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ChatHomeProps {
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  isInputFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  turnsUsed?: number;
  totalTurnsAllowed?: number;
  creditsRemaining?: number;
  isLifetime?: boolean;
}

const MAX_LENGTH = 4000;
const MIN_ROWS = 1;
const MAX_ROWS = 12;
const LINE_HEIGHT = 24;

const EXAMPLE_QUESTIONS = [
  "Moet ik van baan wisselen?",
  "Is kernenergie de oplossing voor de energiecrisis?",
  "Welke programmeertaal leer ik het best in 2026?",
  "Is thuiswerken beter voor productiviteit?",
  "Wat zijn de risico's van AI-regulering in Europa?",
  "Moet ik een eigen bedrijf starten of in loondienst blijven?",
  "Is een vegan dieet gezonder?",
  "Hoe bescherm ik mijn startup tegen kopieergedrag?",
];

const pickRandom = (arr: string[], n: number): string[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

export const ChatHome: FC<ChatHomeProps> = ({
  input,
  onInputChange,
  onSubmit,
  isInputFocused,
  onFocus,
  onBlur,
}) => {
  const { authSession } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chips = useMemo(() => pickRandom(EXAMPLE_QUESTIONS, 3), []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const base = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
    const name =
      authSession?.user?.user_metadata?.name?.split(' ')[0] ||
      authSession?.user?.user_metadata?.full_name?.split(' ')[0];
    return name ? `${base}, ${name}.` : `${base}.`;
  };

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const scrollH = el.scrollHeight;
    const maxH = MAX_ROWS * LINE_HEIGHT;
    el.style.height = `${Math.min(scrollH, maxH)}px`;
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) onSubmit();
    }
  };

  return (
    <div className="chathome">
      {/* Greeting — centered above input */}
      <h1 className="chathome-greeting">{getGreeting()}</h1>

      {/* Input card */}
      <div className="chathome-input-card">
        <textarea
          ref={textareaRef}
          className="chathome-textarea"
          value={input}
          onChange={e => { onInputChange(e.target.value.slice(0, MAX_LENGTH)); }}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder="Stel een vraag aan het AI-consort…"
          rows={MIN_ROWS}
          aria-label="Stel je vraag aan het FAINL AI-consort"
        />
        <div className="chathome-bar">
          {input.length > 0 && (
            <span className="chathome-counter">{input.length}/{MAX_LENGTH}</span>
          )}
          <button
            className="chathome-send"
            onClick={onSubmit}
            disabled={!input.trim()}
            aria-label="Verstuur"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Example chips */}
      <div className="chathome-chips">
        {chips.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => { onInputChange(q); textareaRef.current?.focus(); }}
            className="chathome-chip"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
