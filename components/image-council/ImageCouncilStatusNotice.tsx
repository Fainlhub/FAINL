import { FC } from 'react';
import { AlertTriangle, CircleCheck, LoaderCircle, RotateCcw, ShieldAlert } from 'lucide-react';
import { ImageCouncilRun } from '../../types/imageCouncil';

export const ImageCouncilStatusNotice: FC<{
  run: ImageCouncilRun;
  artifactCount: number;
  onRetry: () => void;
  retrying: boolean;
}> = ({ run, artifactCount, onRetry, retrying }) => {
  if (run.status === 'completed') {
    return (
      <div className="ic-notice ic-notice--success" role="status">
        <CircleCheck aria-hidden="true" />
        <div><strong>Selectie gereed</strong><span>De raad heeft alle ontwerpen gerangschikt.</span></div>
      </div>
    );
  }
  if (run.status === 'partial') {
    return (
      <div className="ic-notice ic-notice--warning" role="status">
        <AlertTriangle aria-hidden="true" />
        <div>
          <strong>Gedeeltelijk afgerond</strong>
          <span>{artifactCount} bruikbare ontwerpen zijn behouden. Een of meer stappen mislukten.</span>
        </div>
        <button type="button" className="ic-button ic-button--secondary" onClick={onRetry} disabled={retrying}>
          {retrying ? <LoaderCircle className="ic-spin" /> : <RotateCcw />}
          Mislukte stap opnieuw
        </button>
      </div>
    );
  }
  if (run.status === 'failed') {
    return (
      <div className="ic-notice ic-notice--error" role="alert">
        <AlertTriangle aria-hidden="true" />
        <div>
          <strong>Beeldraad kon niet afronden</strong>
          <span>{run.failureDetail || 'De gereserveerde credits worden volgens het verbruik afgerekend.'}</span>
        </div>
        <button type="button" className="ic-button ic-button--secondary" onClick={onRetry} disabled={retrying}>
          {retrying ? <LoaderCircle className="ic-spin" /> : <RotateCcw />}
          Opnieuw proberen
        </button>
      </div>
    );
  }
  if (run.status === 'quarantined') {
    return (
      <div className="ic-notice ic-notice--error" role="alert">
        <ShieldAlert aria-hidden="true" />
        <div><strong>Project in controle</strong><span>De inhoud is apart gezet voor veiligheidscontrole.</span></div>
      </div>
    );
  }
  if (run.status === 'cancelled') {
    return (
      <div className="ic-notice" role="status">
        <AlertTriangle aria-hidden="true" />
        <div><strong>Run geannuleerd</strong><span>Bruikbare ontwerpen blijven beschikbaar.</span></div>
      </div>
    );
  }
  return null;
};
