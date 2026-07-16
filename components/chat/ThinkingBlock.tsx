import { FC, useState } from 'react';
import { Brain, Check, ChevronDown, CircleAlert, Loader2 } from 'lucide-react';
import { NodeTrace, PeerReview } from '../../types';
import { NodeStatus } from '../../contexts/ChatContext';

interface ThinkingBlockProps {
  pending?: NodeStatus[] | null;
  traces?: NodeTrace[];
  reviews?: PeerReview[];
  durationMs?: number;
}

export const ThinkingBlock: FC<ThinkingBlockProps> = ({ pending, traces, reviews, durationMs }) => {
  const [expanded, setExpanded] = useState(false);
  const isRunning = !!pending?.length;
  const modelCount = pending?.length ?? traces?.length ?? 0;
  if (!isRunning && !traces?.length) return null;

  return (
    <div className={`thinking-block${isRunning ? ' running' : ''}`}>
      <button
        type="button"
        className="thinking-header"
        onClick={() => setExpanded(value => !value)}
        aria-expanded={expanded}
      >
        {isRunning
          ? <Loader2 className="thinking-icon spinning" />
          : <Brain className="thinking-icon" />}
        <span className="thinking-label">
          {isRunning
            ? `De Raad toetst je vraag... (${modelCount})`
            : `${modelCount} modellen gewogen${durationMs ? ` - ${(durationMs / 1000).toFixed(1)}s` : ''}`}
        </span>
        {isRunning && (
          <span className="thinking-progress">
            {pending!.map(model => (
              <span key={model.memberId} className={`thinking-dot ${model.status}`} title={model.name}>
                {model.status === 'done' ? <Check /> : model.status === 'error' ? <CircleAlert /> : null}
              </span>
            ))}
          </span>
        )}
        <ChevronDown className={`thinking-chevron${expanded ? ' open' : ''}`} />
      </button>

      {expanded && (
        <div className="thinking-body">
          {isRunning && !traces?.length && (
            <p className="thinking-wait">
              De geselecteerde modellen analyseren onafhankelijk, markeren aannames en zoeken naar consensus.
            </p>
          )}
          {traces?.map((trace, index) => (
            <div key={trace.memberId} className="thinking-trace">
              <p className="thinking-trace-title">{trace.name || `Model ${index + 1}`} - {trace.modelId}</p>
              <p className="thinking-trace-content">{trace.content}</p>
            </div>
          ))}
          {!!reviews?.length && (
            <div className="thinking-trace">
              <p className="thinking-trace-title">Onderlinge toetsing - {reviews.length} beoordelingen</p>
              <p className="thinking-trace-content">
                Gemiddelde score {(reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length).toFixed(1)}/10.
              </p>
            </div>
          )}
          {!!traces?.length && (
            <p className="thinking-merge-note">
              Deze {traces.length} modelantwoorden zijn gewogen tot de conclusie hieronder.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
