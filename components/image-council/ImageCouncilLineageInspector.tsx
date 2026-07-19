import { FC, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { GitBranch, LoaderCircle, Sparkles, X } from 'lucide-react';
import { ImageCouncilArtifact } from '../../types/imageCouncil';
import { PrivateCouncilImage } from './PrivateCouncilImage';

function lineageFor(
  selected: ImageCouncilArtifact,
  artifacts: ImageCouncilArtifact[],
): ImageCouncilArtifact[] {
  const byId = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
  const ancestors: ImageCouncilArtifact[] = [];
  let cursor: ImageCouncilArtifact | undefined = selected;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    ancestors.unshift(cursor);
    cursor = cursor.parentArtifactId ? byId.get(cursor.parentArtifactId) : undefined;
  }
  const descendants = artifacts
    .filter((artifact) => {
      let parentId = artifact.parentArtifactId;
      const visited = new Set<string>();
      while (parentId && !visited.has(parentId)) {
        if (parentId === selected.id) return true;
        visited.add(parentId);
        parentId = byId.get(parentId)?.parentArtifactId ?? null;
      }
      return false;
    })
    .sort((left, right) => left.version - right.version);
  return [...ancestors, ...descendants];
}

export const ImageCouncilLineageInspector: FC<{
  artifact: ImageCouncilArtifact;
  artifacts: ImageCouncilArtifact[];
  onClose: () => void;
  onView: (artifact: ImageCouncilArtifact) => void;
  onRefine: (prompt?: string) => Promise<void>;
  refining: boolean;
  canRefine: boolean;
}> = ({ artifact, artifacts, onClose, onView, onRefine, refining, canRefine }) => {
  const [prompt, setPrompt] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const lineage = useMemo(() => lineageFor(artifact, artifacts), [artifact, artifacts]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onRefine(prompt.trim() || undefined);
  };

  return (
    <div className="ic-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="ic-inspector" role="dialog" aria-modal="true" aria-labelledby="ic-inspector-title">
        <header>
          <div>
            <p className="ic-eyebrow"><GitBranch /> Herkomst</p>
            <h2 id="ic-inspector-title">Ontwikkeling van dit beeld</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} title="Sluiten" aria-label="Inspector sluiten"><X /></button>
        </header>

        <ol className="ic-lineage">
          {lineage.map((item, index) => (
            <li key={item.id} className={item.id === artifact.id ? 'is-current' : ''}>
              <button type="button" onClick={() => onView(item)}>
                <span className="ic-lineage__thumb">
                  <PrivateCouncilImage artifact={item} alt="" />
                </span>
                <span>
                  <strong>{item.kind} · v{item.version}</strong>
                  <small>{item.modelCatalogId}</small>
                </span>
              </button>
              {index < lineage.length - 1 && <span className="ic-lineage__connector" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        {lineage[0] && lineage[0].id !== artifact.id && (
          <section className="ic-compare" aria-labelledby="ic-compare-title">
            <h3 id="ic-compare-title">Vergelijk met origineel</h3>
            <div className="ic-compare__grid">
              <figure>
                <PrivateCouncilImage
                  artifact={lineage[0]}
                  alt="Originele versie"
                  onClick={() => onView(lineage[0])}
                />
                <figcaption>Origineel</figcaption>
              </figure>
              <figure>
                <PrivateCouncilImage
                  artifact={artifact}
                  alt="Huidige versie"
                  onClick={() => onView(artifact)}
                />
                <figcaption>Deze versie</figcaption>
              </figure>
            </div>
          </section>
        )}

        {(artifact.critique || artifact.rankingRationale) && (
          <section className="ic-inspector__critique">
            <h3>Waarom deze versie?</h3>
            <p>{artifact.rankingRationale || artifact.critique}</p>
          </section>
        )}

        {canRefine && (
          <form className="ic-refine" onSubmit={submit}>
            <label htmlFor="ic-refine-prompt">Gerichte herstelpoging <span>(optioneel)</span></label>
            <textarea
              id="ic-refine-prompt"
              rows={3}
              maxLength={1_000}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Bijvoorbeeld: corrigeer alleen de hand en behoud de compositie"
              disabled={refining}
            />
            <button type="submit" className="ic-button ic-button--primary" disabled={refining}>
              {refining ? <LoaderCircle className="ic-spin" /> : <Sparkles />}
              Herstel finalist
            </button>
          </form>
        )}
      </aside>
    </div>
  );
};
