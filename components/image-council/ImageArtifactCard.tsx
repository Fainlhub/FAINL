import { FC } from 'react';
import {
  Check,
  Download,
  Eye,
  GitBranch,
  Sparkles,
} from 'lucide-react';
import { ImageCouncilArtifact } from '../../types/imageCouncil';
import { PrivateCouncilImage } from './PrivateCouncilImage';

export const ImageArtifactCard: FC<{
  artifact: ImageCouncilArtifact;
  selected: boolean;
  featured?: boolean;
  onView: () => void;
  onInspect: () => void;
  onDownload: () => void;
  onSelect: () => void;
  onRefine: () => void;
  refinable?: boolean;
  disabled?: boolean;
}> = ({
  artifact,
  selected,
  featured = false,
  onView,
  onInspect,
  onDownload,
  onSelect,
  onRefine,
  refinable = false,
  disabled = false,
}) => (
  <article className={`ic-artifact${featured ? ' ic-artifact--featured' : ''}${selected ? ' is-selected' : ''}`}>
    <div className="ic-artifact__media">
      <PrivateCouncilImage
        artifact={artifact}
        alt={`Ontwerp van ${artifact.modelCatalogId}${artifact.rank ? `, positie ${artifact.rank}` : ''}`}
        eager={featured}
        onClick={onView}
      />
      {artifact.rank !== null && (
        <span className="ic-artifact__rank" aria-label={`Positie ${artifact.rank}`}>
          {artifact.rank}
        </span>
      )}
      {selected && <span className="ic-artifact__selected"><Check /> Gekozen</span>}
    </div>

    <div className="ic-artifact__info">
      <div>
        <p className="ic-artifact__model">{artifact.modelCatalogId}</p>
        <p className="ic-artifact__meta">
          {artifact.kind} · versie {artifact.version}
          {artifact.confidence !== null ? ` · zekerheid ${Math.round(artifact.confidence * 100)}%` : ''}
        </p>
      </div>
      <div className="ic-artifact__actions" aria-label="Acties voor ontwerp">
        <button type="button" onClick={onView} title="Bekijken" aria-label="Ontwerp bekijken">
          <Eye aria-hidden="true" />
        </button>
        <button type="button" onClick={onInspect} title="Herkomst" aria-label="Herkomst bekijken">
          <GitBranch aria-hidden="true" />
        </button>
        <button type="button" onClick={onDownload} title="Downloaden" aria-label="Ontwerp downloaden">
          <Download aria-hidden="true" />
        </button>
        {refinable && (
          <button type="button" onClick={onRefine} title="Herstellen" aria-label="Finalist gericht herstellen" disabled={disabled}>
            <Sparkles aria-hidden="true" />
          </button>
        )}
      </div>
      <button
        type="button"
        className={`ic-button ${selected ? 'ic-button--selected' : 'ic-button--secondary'}`}
        onClick={onSelect}
        disabled={selected || disabled}
      >
        <Check aria-hidden="true" />
        {selected ? 'Geselecteerd' : 'Dit ontwerp kiezen'}
      </button>
    </div>
  </article>
);
