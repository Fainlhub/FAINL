import { FC, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { ImageCouncilArtifact } from '../../types/imageCouncil';
import { PrivateCouncilImage } from './PrivateCouncilImage';

export const ImageCouncilViewer: FC<{
  artifact: ImageCouncilArtifact;
  onClose: () => void;
  onDownload: () => void;
}> = ({ artifact, onClose, onDownload }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="ic-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="ic-viewer" role="dialog" aria-modal="true" aria-labelledby="ic-viewer-title">
        <header>
          <div>
            <p className="ic-eyebrow">{artifact.kind} · versie {artifact.version}</p>
            <h2 id="ic-viewer-title">{artifact.modelCatalogId}</h2>
          </div>
          <div className="ic-dialog-actions">
            <button type="button" onClick={onDownload} title="Downloaden" aria-label="Afbeelding downloaden">
              <Download />
            </button>
            <button ref={closeRef} type="button" onClick={onClose} title="Sluiten" aria-label="Viewer sluiten">
              <X />
            </button>
          </div>
        </header>
        <div className="ic-viewer__canvas">
          <PrivateCouncilImage
            artifact={artifact}
            alt={`Vergrote weergave van ${artifact.modelCatalogId}`}
            eager
            fullResolution
          />
        </div>
        <footer>
          <span>{artifact.width} × {artifact.height}px</span>
          <span>Checksum {artifact.checksumSha256.slice(0, 12)}…</span>
        </footer>
      </section>
    </div>
  );
};
