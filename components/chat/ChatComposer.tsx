import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { ChatTier } from '../../types';
import { TierSelector } from './TierSelector';

interface ChatComposerProps {
  onSend: (content: string) => void;
  disabled: boolean;
  tier: ChatTier;
  onTierChange: (t: ChatTier) => void;
  isLoggedIn: boolean;
  byokEnabled: boolean;
  autoFocus?: boolean;
}

const MAX_LENGTH = 4000;
const MAX_ROWS = 12;
const LINE_HEIGHT = 24;

export const ChatComposer: FC<ChatComposerProps> = ({
  onSend,
  disabled,
  tier,
  onTierChange,
  isLoggedIn,
  byokEnabled,
  autoFocus,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS * LINE_HEIGHT)}px`;
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);
  useEffect(() => { if (autoFocus) textareaRef.current?.focus(); }, [autoFocus]);

  const submit = () => {
    const value = input.trim();
    if (!value || disabled) return;
    setInput('');
    onSend(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="chathome-input-card chat-composer">
      <textarea
        ref={textareaRef}
        className="chathome-textarea"
        value={input}
        onChange={e => setInput(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={handleKeyDown}
        placeholder="Stel een vraag…"
        rows={1}
        aria-label="Stel je vraag"
      />
      <div className="chathome-bar">
        <TierSelector
          tier={tier}
          onChange={onTierChange}
          isLoggedIn={isLoggedIn}
          byokEnabled={byokEnabled}
          disabled={disabled}
        />
        {input.length > 0 && (
          <span className="chathome-counter">{input.length}/{MAX_LENGTH}</span>
        )}
        <button
          className="chathome-send"
          onClick={submit}
          disabled={!input.trim() || disabled}
          aria-label="Verstuur"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
