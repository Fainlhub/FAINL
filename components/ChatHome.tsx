import { FC, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { ImageCouncilModeSwitch } from './image-council/ImageCouncilModeSwitch';

interface ChatHomeProps {
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
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
  'Welke marktstrategie past bij onze situatie?',
  "Wat zijn de belangrijkste risico's in dit contract?",
  'Moet ik investeren of juist kosten verlagen?',
  'Welke keuze is rationeel het sterkst onder onzekerheid?',
  'Hoe beoordeel ik deze sollicitant objectief?',
  'Wat zijn de zwakke aannames in mijn plan?',
  'Welke positionering maakt mijn aanbod scherper?',
  'Hoe bescherm ik mijn startup tegen kopieergedrag?',
];

const pickRandom = (arr: string[], n: number): string[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

export const ChatHome: FC<ChatHomeProps> = ({
  input,
  onInputChange,
  onSubmit,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chips = useMemo(() => pickRandom(EXAMPLE_QUESTIONS, 3), []);

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
      <ImageCouncilModeSwitch />
      <div className="chathome-input-card">
        <textarea
          ref={textareaRef}
          className="chathome-textarea"
          value={input}
          onChange={e => { onInputChange(e.target.value.slice(0, MAX_LENGTH)); }}
          onKeyDown={handleKeyDown}
          placeholder="Leg je vraag voor aan de Raad..."
          rows={MIN_ROWS}
          aria-label="Stel je vraag aan de FAINL Raad"
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
