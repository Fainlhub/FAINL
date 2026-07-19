import { FC } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { ImageCouncilRun } from '../../types/imageCouncil';

const STEPS = ['Briefing', 'Maken', 'Beoordelen', 'Verfijnen', 'Selectie'] as const;

function activeStep(run: ImageCouncilRun): number {
  const stage = run.status;
  if (['queued', 'moderating', 'generating'].includes(stage)) return 1;
  if (['evaluating', 'debating'].includes(stage)) return 2;
  if (stage === 'refining') return 3;
  return 4;
}

export const ImageCouncilProgress: FC<{
  run: ImageCouncilRun;
  onCancel: () => void;
  cancelling: boolean;
}> = ({ run, onCancel, cancelling }) => {
  const current = activeStep(run);
  const canCancel = ![
    'completed',
    'partial',
    'failed',
    'cancelled',
    'quarantined',
  ].includes(run.status);
  const progress = {
    queued: 4,
    moderating: 12,
    generating: 28,
    evaluating: 47,
    debating: 58,
    refining: 70,
    ranking: 82,
    polishing: 92,
    completed: 100,
    partial: 100,
    failed: 100,
    cancel_requested: 96,
    cancelled: 100,
    quarantined: 100,
  }[run.status];

  return (
    <section className="ic-progress" aria-labelledby="ic-progress-title">
      <div className="ic-progress__summary">
        <div>
          <p className="ic-eyebrow">Live voortgang</p>
          <h2 id="ic-progress-title">{STEPS[current]}</h2>
        </div>
        <span className="ic-progress__percentage">{progress}%</span>
      </div>

      <div
        className="ic-progress__track"
        role="progressbar"
        aria-label="Voortgang beeldproject"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className="ic-progress__steps" aria-label="Stappen van Beeldraad">
        {STEPS.map((step, index) => {
          const done = index < current ||
            (index === current && ['completed', 'partial'].includes(run.status));
          const active = index === current && !done;
          return (
            <li
              key={step}
              className={`${done ? 'is-done' : ''}${active ? ' is-active' : ''}`}
              aria-current={active ? 'step' : undefined}
            >
              <span className="ic-progress__step-icon" aria-hidden="true">
                {done ? <Check /> : active ? <LoaderCircle className="ic-spin" /> : index + 1}
              </span>
              <span>{step}</span>
            </li>
          );
        })}
      </ol>

      <div className="ic-progress__footer">
        <p aria-live="polite">
          Je kunt deze pagina veilig verlaten. Beeldraad werkt op de achtergrond verder.
        </p>
        {canCancel && (
          <button
            type="button"
            className="ic-button ic-button--quiet"
            onClick={onCancel}
            disabled={cancelling}
          >
            {cancelling ? <LoaderCircle className="ic-spin" /> : null}
            Annuleren
          </button>
        )}
      </div>
    </section>
  );
};
