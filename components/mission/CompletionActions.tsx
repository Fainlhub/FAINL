import { FC, useState } from 'react';
import { ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

/* ---- Feedback Widget ---------------------------------------------------- */
const FeedbackWidget: FC<{ sessionId: string }> = ({ sessionId }) => {
  const [state, setState] = useState<'idle' | 'negative' | 'submitted'>('idle');
  const [comment, setComment] = useState('');

  const submit = async (positive: boolean, text?: string) => {
    setState('submitted');
    try {
      await supabase.from('session_feedback').insert({
        session_id: sessionId,
        positive,
        comment: text || null,
      });
    } catch {
      /* non-critical */
    }
  };

  if (state === 'submitted') {
    return (
      <p className="completion-actions__thanks">
        Bedankt voor je feedback!
      </p>
    );
  }

  if (state === 'negative') {
    return (
      <div className="completion-actions__feedback-form">
        <p className="completion-actions__feedback-prompt">Wat kan er beter?</p>
        <div className="completion-actions__feedback-row">
          <input
            type="text"
            maxLength={200}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optioneel..."
            className="completion-actions__feedback-input"
            aria-label="Feedback over het eindoordeel"
          />
          <button
            type="button"
            onClick={() => submit(false, comment)}
            className="btn-send completion-actions__feedback-send"
          >
            Verstuur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="completion-actions__feedback">
      <span className="completion-actions__feedback-label">Was dit oordeel nuttig?</span>
      <button
        type="button"
        onClick={() => submit(true)}
        className="completion-actions__thumb completion-actions__thumb--up"
        aria-label="Nuttig"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setState('negative')}
        className="completion-actions__thumb completion-actions__thumb--down"
        aria-label="Niet nuttig"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ---- Completion Actions ------------------------------------------------- */
interface CompletionActionsProps {
  sessionId: string;
  query: string;
  synthesis: string;
  isLoggedIn: boolean;
  turnsUsed: number;
  onNewQuestion: () => void;
  onCookbook: () => void;
  onLogin: () => void;
}

export const CompletionActions: FC<CompletionActionsProps> = ({
  sessionId,
  query,
  synthesis,
  isLoggedIn,
  turnsUsed,
  onNewQuestion,
  onCookbook,
  onLogin,
}) => {
  return (
    <div className="completion-actions">
      {/* Copy & share */}
      <div className="completion-actions__share-row">
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(synthesis || '')}
          className="btn-ghost"
        >
          Kopieer eindoordeel
        </button>
        {typeof navigator.share === 'function' && (
          <button
            type="button"
            onClick={() => {
              const title = `FAINL Eindoordeel: ${query.slice(0, 50)}...`;
              const text =
                (synthesis || '').slice(0, 200) +
                '... Lees het volledige oordeel op fainl.com';
              navigator.share({ title, text, url: 'https://www.fainl.com' }).catch(() => {});
            }}
            className="btn-ghost"
          >
            Deel
          </button>
        )}
      </div>

      <FeedbackWidget sessionId={sessionId} />

      {/* Account conversion banner */}
      {!isLoggedIn && turnsUsed <= 2 && (
        <div className="completion-actions__convert">
          <p className="completion-actions__convert-title">Je eerste AI-raadsoordeel!</p>
          <p className="completion-actions__convert-sub">
            Maak een gratis account aan om dit op te slaan en meer sessies te ontgrendelen.
          </p>
          <button type="button" onClick={onLogin} className="btn-send">
            Gratis account aanmaken
          </button>
        </div>
      )}

      <p className="completion-actions__saved">Sessie opgeslagen in Mijn FAINL's</p>

      {/* Navigation */}
      <div className="completion-actions__nav">
        <button type="button" onClick={onNewQuestion} className="btn-send">
          <ArrowRight className="w-4 h-4" />
          Nieuwe vraag stellen
        </button>
        <button type="button" onClick={onCookbook} className="btn-ghost">
          Voorbeeldvragen bekijken
        </button>
      </div>
    </div>
  );
};
