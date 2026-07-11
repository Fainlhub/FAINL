import { FC, useState } from 'react';
import { Brain, Check, ChevronDown, CircleAlert, Loader2 } from 'lucide-react';
import { NodeTrace, PeerReview } from '../../types';
import { NodeStatus } from '../../contexts/ChatContext';

// The Thinking UX: while nodes run, a live "Thinking… (N nodes)" strip; after
// completion an expandable panel with each node's reasoning and the merge step.
// Deliberately neutral — no personas, no council jargon, no scores on the
// foreground. Verification of the answer lives in the consensus module.

interface ThinkingBlockProps {
  pending?: NodeStatus[] | null;
  traces?: NodeTrace[];
  reviews?: PeerReview[];
  durationMs?: number;
}

export const ThinkingBlock: FC<ThinkingBlockProps> = ({ pending, traces, reviews, durationMs }) => {
  const [expanded, setExpanded] = useState(false);
  const isRunning = !!pending?.length;
  const nodeCount = pending?.length ?? traces?.length ?? 0;
  if (!isRunning && !traces?.length) return null;

  return (
    <div className={`thinking-block${isRunning ? ' running' : ''}`}>
      <button
        type="button"
        className="thinking-header"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        {isRunning
          ? <Loader2 className="thinking-icon spinning" />
          : <Brain className="thinking-icon" />}
        <span className="thinking-label">
          {isRunning
            ? `Thinking… (${nodeCount} nodes)`
            : `Thinking — ${nodeCount} nodes${durationMs ? ` · ${(durationMs / 1000).toFixed(1)}s` : ''}`}
        </span>
        {isRunning && (
          <span className="thinking-progress">
            {pending!.map(n => (
              <span key={n.memberId} className={`thinking-dot ${n.status}`} title={n.name}>
                {n.status === 'done' ? <Check /> : n.status === 'error' ? <CircleAlert /> : null}
              </span>
            ))}
          </span>
        )}
        <ChevronDown className={`thinking-chevron${expanded ? ' open' : ''}`} />
      </button>

      {expanded && (
        <div className="thinking-body">
          {isRunning && !traces?.length && (
            <p className="thinking-wait">De nodes analyseren je vraag onafhankelijk van elkaar. Hun beredenering verschijnt hier zodra ze klaar zijn.</p>
          )}
          {traces?.map((t, i) => (
            <div key={t.memberId} className="thinking-trace">
              <p className="thinking-trace-title">Node {i + 1} · {t.modelId}</p>
              <p className="thinking-trace-content">{t.content}</p>
            </div>
          ))}
          {!!reviews?.length && (
            <div className="thinking-trace">
              <p className="thinking-trace-title">Onderlinge toetsing · {reviews.length} beoordelingen</p>
              <p className="thinking-trace-content">
                Gemiddelde score {(reviews.reduce((s, r) => s + r.score, 0) / reviews.length).toFixed(1)}/10 — de nodes hebben elkaars antwoorden beoordeeld vóór de samenvoeging.
              </p>
            </div>
          )}
          {!!traces?.length && (
            <p className="thinking-merge-note">Deze {traces.length} analyses zijn samengevoegd tot het antwoord hieronder.</p>
          )}
        </div>
      )}
    </div>
  );
};
