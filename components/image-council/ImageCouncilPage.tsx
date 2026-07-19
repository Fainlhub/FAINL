import { FC, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useImageCouncil } from '../../contexts/ImageCouncilContext';
import {
  ImageCouncilArtifact,
  StartImageCouncilInput,
  TERMINAL_IMAGE_COUNCIL_STATUSES,
} from '../../types/imageCouncil';
import { ImageArtifactCard } from './ImageArtifactCard';
import { ImageCouncilBriefing } from './ImageCouncilBriefing';
import { ImageCouncilLineageInspector } from './ImageCouncilLineageInspector';
import { ImageCouncilModeSwitch } from './ImageCouncilModeSwitch';
import { ImageCouncilProgress } from './ImageCouncilProgress';
import { ImageCouncilStatusNotice } from './ImageCouncilStatusNotice';
import { ImageCouncilViewer } from './ImageCouncilViewer';
import './imageCouncil.css';

export const ImageCouncilPage: FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const {
    activeProject,
    activeRun,
    artifacts,
    selectedArtifactId,
    isLoadingProject,
    isStarting,
    pendingCommand,
    error,
    openProject,
    clearActiveProject,
    startProject,
    cancelRun,
    retryStep,
    selectArtifact,
    refineArtifact,
    deleteProject,
    downloadArtifact,
    clearError,
  } = useImageCouncil();
  const [viewerArtifact, setViewerArtifact] = useState<ImageCouncilArtifact | null>(null);
  const [inspectorArtifact, setInspectorArtifact] = useState<ImageCouncilArtifact | null>(null);

  useEffect(() => {
    setViewerArtifact(null);
    setInspectorArtifact(null);
    if (!authSession?.user?.id) return;
    if (projectId) void openProject(projectId);
    else clearActiveProject();
  }, [authSession?.user?.id, clearActiveProject, openProject, projectId]);

  const designs = useMemo(
    () => artifacts.filter((artifact) => artifact.kind !== 'thumbnail'),
    [artifacts],
  );
  const topThree = useMemo(() => {
    const ranked = designs
      .filter((artifact) => artifact.rank !== null)
      .sort((left, right) => (left.rank ?? 99) - (right.rank ?? 99));
    const finalists = designs
      .filter((artifact) => artifact.kind === 'finalist' && !ranked.some((item) => item.id === artifact.id))
      .sort((left, right) => right.version - left.version);
    return [...ranked, ...finalists].slice(0, 3);
  }, [designs]);

  if (!authSession) {
    const next = projectId ? `/beeldraad/${projectId}` : '/beeldraad';
    return (
      <main className="ic-page ic-page--gate">
        <ImageCouncilModeSwitch />
        <section className="ic-login-gate" aria-labelledby="ic-login-title">
          <ImageIcon aria-hidden="true" />
          <h1 id="ic-login-title">Log in voor Beeldraad</h1>
          <p>Beeldprojecten en afbeeldingen zijn privé en alleen zichtbaar binnen je account.</p>
          <button
            type="button"
            className="ic-button ic-button--primary"
            onClick={() => navigate(`/login?next=${encodeURIComponent(next)}`)}
          >
            Inloggen
          </button>
        </section>
      </main>
    );
  }

  const start = async (input: StartImageCouncilInput) => {
    const response = await startProject(input);
    navigate(`/beeldraad/${response.projectId}`);
  };

  const runArtifactAction = (
    artifact: ImageCouncilArtifact,
    action: 'select' | 'refine',
    prompt?: string,
  ) => {
    if (!activeProject || !activeRun) return Promise.resolve();
    return action === 'select'
      ? selectArtifact(activeProject.id, activeRun.id, artifact.id)
      : refineArtifact(activeProject.id, activeRun.id, artifact.id, prompt);
  };

  const renderArtifact = (artifact: ImageCouncilArtifact, featured = false) => (
    <ImageArtifactCard
      key={artifact.id}
      artifact={artifact}
      featured={featured}
      selected={selectedArtifactId === artifact.id}
      disabled={pendingCommand !== null}
      refinable={
        artifact.kind === 'finalist' &&
        artifact.version <= 3 &&
        TERMINAL_IMAGE_COUNCIL_STATUSES.has(activeRun?.status ?? 'queued')
      }
      onView={() => setViewerArtifact(artifact)}
      onInspect={() => setInspectorArtifact(artifact)}
      onDownload={() => void downloadArtifact(artifact)}
      onSelect={() => void runArtifactAction(artifact, 'select')}
      onRefine={() => setInspectorArtifact(artifact)}
    />
  );

  if (!projectId) {
    return (
      <main className="ic-page">
        <div className="ic-page__mode"><ImageCouncilModeSwitch /></div>
        {error && (
          <div className="ic-global-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={clearError}>Sluiten</button>
          </div>
        )}
        <ImageCouncilBriefing onStart={start} isStarting={isStarting} />
      </main>
    );
  }

  if (isLoadingProject && !activeProject) {
    return (
      <main className="ic-page ic-page--loading" aria-busy="true">
        <LoaderCircle className="ic-spin" />
        <p>Beeldproject laden…</p>
      </main>
    );
  }

  if (!activeProject || !activeRun) {
    return (
      <main className="ic-page ic-page--missing">
        <button type="button" className="ic-back" onClick={() => navigate('/beeldraad')}>
          <ArrowLeft /> Terug naar Beeldraad
        </button>
        <section role="alert">
          <h1>Project niet beschikbaar</h1>
          <p>{error || 'Dit project kon niet worden geladen.'}</p>
        </section>
      </main>
    );
  }

  const terminal = TERMINAL_IMAGE_COUNCIL_STATUSES.has(activeRun.status);

  return (
    <main className="ic-page">
      <header className="ic-project-header">
        <div className="ic-project-header__top">
          <button type="button" className="ic-back" onClick={() => navigate('/beeldraad')}>
            <ArrowLeft /> Nieuw project
          </button>
          <ImageCouncilModeSwitch />
          <div className="ic-project-header__actions">
            <button type="button" onClick={() => navigate('/beeldraad')} title="Nieuw project" aria-label="Nieuw beeldproject">
              <Plus />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`"${activeProject.title}" verwijderen? Het project wordt binnen 24 uur gewist.`)) {
                  void deleteProject(activeProject.id).then(() => navigate('/beeldraad'));
                }
              }}
              disabled={pendingCommand !== null}
              title="Project verwijderen"
              aria-label="Project verwijderen"
            >
              <Trash2 />
            </button>
          </div>
        </div>
        <p className="ic-eyebrow">Beeldproject</p>
        <h1>{activeProject.title}</h1>
        <p className="ic-project-header__brief">{activeRun.prompt}</p>
        <div className="ic-project-header__meta">
          <span>{activeRun.aspectRatio}</span>
          <span>{activeRun.stylePreset}</span>
          <span>{activeRun.reservedCredits ?? 9} credits gereserveerd</span>
        </div>
      </header>

      {error && <div className="ic-global-error" role="alert"><span>{error}</span><button onClick={clearError}>Sluiten</button></div>}

      <ImageCouncilProgress
        run={activeRun}
        cancelling={pendingCommand === 'cancel_run'}
        onCancel={() => void cancelRun(activeProject.id, activeRun.id)}
      />

      <ImageCouncilStatusNotice
        run={activeRun}
        artifactCount={designs.length}
        retrying={pendingCommand === 'retry_step'}
        onRetry={() => void retryStep(activeProject.id, activeRun.id, activeRun.status)}
      />

      {!terminal && designs.length > 0 && (
        <section className="ic-incoming" aria-live="polite">
          <h2>Eerste ontwerpen</h2>
          <p>Ontwerpen verschijnen zodra ze veilig zijn opgeslagen. De ranking volgt later.</p>
          <div className="ic-gallery">{designs.map((artifact) => renderArtifact(artifact))}</div>
        </section>
      )}

      {terminal && topThree.length > 0 && (
        <section className="ic-top-three" aria-labelledby="ic-top-title">
          <div className="ic-section-head">
            <div><p className="ic-eyebrow">Advies van de raad</p><h2 id="ic-top-title">Top 3</h2></div>
            <p>Je kunt altijd een ander ontwerp kiezen.</p>
          </div>
          <div className="ic-top-three__grid">
            {topThree.map((artifact, index) => renderArtifact(artifact, index === 0))}
          </div>
        </section>
      )}

      {terminal && designs.length > 0 && (
        <section className="ic-all-designs" aria-labelledby="ic-all-title">
          <div className="ic-section-head">
            <div><p className="ic-eyebrow">{designs.length} versies</p><h2 id="ic-all-title">Alle ontwerpen</h2></div>
          </div>
          <div className="ic-gallery">{designs.map((artifact) => renderArtifact(artifact))}</div>
        </section>
      )}

      {viewerArtifact && (
        <ImageCouncilViewer
          artifact={viewerArtifact}
          onClose={() => setViewerArtifact(null)}
          onDownload={() => void downloadArtifact(viewerArtifact)}
        />
      )}
      {inspectorArtifact && (
        <ImageCouncilLineageInspector
          artifact={inspectorArtifact}
          artifacts={artifacts}
          refining={pendingCommand === 'refine_artifact'}
          canRefine={
            inspectorArtifact.kind === 'finalist' &&
            inspectorArtifact.version <= 3 &&
            terminal
          }
          onClose={() => setInspectorArtifact(null)}
          onView={(artifact) => setViewerArtifact(artifact)}
          onRefine={(prompt) => runArtifactAction(inspectorArtifact, 'refine', prompt)}
        />
      )}
    </main>
  );
};
