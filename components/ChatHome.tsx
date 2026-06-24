import { FC, useState, useEffect, useMemo } from 'react';
import { Send, Loader2 } from 'lucide-react';
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

const placeholders = [
  "Moet ik Rust of Go leren voor backend development?",
  "Is het beter om een huis te kopen of te huren?",
  "Wat zijn de voor- en nadelen van een vierdaagse werkweek?",
  "Is thuiswerken beter voor productiviteit dan op kantoor?",
  "Welke programmeertaal kies ik voor mijn volgende project?",
  "Wat is het sterkste argument voor een basisinkomen?",
];

const FadingPlaceholder: FC<{ isFocused: boolean }> = ({ isFocused }) => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (isFocused) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % placeholders.length);
        setFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, [isFocused]);

  if (isFocused) return null;
  return (
    <span className={`transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
      {placeholders[index]}
    </span>
  );
};

const ExampleChips: FC<{ onSelect: (q: string) => void }> = ({ onSelect }) => {
  const chips = useMemo(() => pickRandom(EXAMPLE_QUESTIONS, 3), []);
  return (
    <div className="flex flex-wrap gap-2 mt-4 justify-center">
      {chips.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onSelect(q)}
          className="border border-black/15 dark:border-white/15 px-3 py-1.5 text-sm font-bold text-black/70 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/30 dark:hover:border-white/30 cursor-pointer transition-all rounded-full"
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export const ChatHome: FC<ChatHomeProps> = ({
  input,
  onInputChange,
  onSubmit,
  isInputFocused,
  onFocus,
  onBlur,
  turnsUsed = 0,
  totalTurnsAllowed = 2,
  creditsRemaining = 0,
  isLifetime = false,
}) => {
  const { authSession } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const base = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
    const name =
      authSession?.user?.user_metadata?.name?.split(' ')[0] ||
      authSession?.user?.user_metadata?.full_name?.split(' ')[0];
    return name ? `${base}, ${name}.` : `${base}.`;
  };

  return (
    <div className="hero-center animate-up">
      <h1 className="hero-heading">{getGreeting()}</h1>
      <p className="hero-sub">
        Stel je vraag — meerdere AI-modellen debatteren en leveren één gefundeerde conclusie. Niet één mening, maar een echt antwoord.
      </p>

      {/* Contextual session indicator */}
      {!isLifetime && (
        <p className="text-xs font-bold text-black/60 dark:text-white/50 mb-4 flex items-center gap-1.5">
          {(() => {
            if (authSession && creditsRemaining > 0) return `${creditsRemaining} credit${creditsRemaining === 1 ? '' : 's'} beschikbaar`;
            if (authSession && creditsRemaining <= 0) return 'Credits nodig — bekijk pakketten';
            if (turnsUsed === 0) return 'Eerste sessie gratis — ontdek de kracht van AI-consensus';
            if (turnsUsed === 1 && totalTurnsAllowed > 1) return 'Nog 1 gratis sessie beschikbaar';
            return 'Maak een gratis account aan om verder te gaan';
          })()}
        </p>
      )}

      <div className="chat-input-wrap chat-input-full">
        <div style={{ position: 'relative' }}>
          {!input && !isInputFocused && (
            <div className="placeholder-fade">
              <FadingPlaceholder isFocused={isInputFocused} />
            </div>
          )}
          <textarea
            className="chat-textarea"
            value={input}
            onChange={e => onInputChange(e.target.value.slice(0, MAX_LENGTH))}
            onFocus={onFocus}
            onBlur={onBlur}
            aria-label="Stel je vraag aan de FAINL AI-raad van experts"
          />
        </div>
        <div className="chat-input-bar">
          <span className={`chat-counter${input.length >= MAX_LENGTH ? ' warn' : ''}`}>
            {input.length > 0 ? `${input.length} / ${MAX_LENGTH}` : ''}
          </span>
          <button
            className="btn-send"
            onClick={onSubmit}
            disabled={!input.trim()}
          >
            <Send className="send-icon" />
            Vraag het aan de Raad
          </button>
        </div>
      </div>

      <ExampleChips onSelect={(q) => { onInputChange(q); onFocus(); }} />
    </div>
  );
};
