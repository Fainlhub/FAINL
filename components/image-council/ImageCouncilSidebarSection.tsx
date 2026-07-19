import { FC } from 'react';
import { Image, LoaderCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useImageCouncil } from '../../contexts/ImageCouncilContext';
import './imageCouncil.css';

interface ImageCouncilSidebarSectionProps {
  onNavigate?: () => void;
}

export const ImageCouncilSidebarSection: FC<ImageCouncilSidebarSectionProps> = ({
  onNavigate,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, isLoadingProjects } = useImageCouncil();
  const recentProjects = projects.slice(0, 5);

  const open = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <section className="ic-sidebar" aria-labelledby="ic-sidebar-heading">
      <div className="ic-sidebar__head">
        <p id="ic-sidebar-heading" className="sidebar-section-label">Beeldraad</p>
        <button
          type="button"
          className="sidebar-mini-btn"
          onClick={() => open('/beeldraad')}
          title="Nieuw beeldproject"
          aria-label="Nieuw beeldproject"
        >
          <Image aria-hidden="true" />
        </button>
      </div>

      {isLoadingProjects && recentProjects.length === 0 && (
        <p className="ic-sidebar__state" role="status">
          <LoaderCircle className="ic-spin" aria-hidden="true" />
          Laden
        </p>
      )}

      {!isLoadingProjects && recentProjects.length === 0 && (
        <p className="ic-sidebar__state">Nog geen beeldprojecten</p>
      )}

      {recentProjects.map((project) => {
        const path = `/beeldraad/${project.id}`;
        const active = location.pathname === path;
        return (
          <button
            key={project.id}
            type="button"
            className={`ic-sidebar__project${active ? ' is-active' : ''}`}
            onClick={() => open(path)}
            title={project.title}
            aria-current={active ? 'page' : undefined}
          >
            <span
              className={`ic-sidebar__dot ic-sidebar__dot--${project.pipelineStatus ?? 'queued'}`}
              aria-hidden="true"
            />
            <span className="ic-sidebar__label">{project.title}</span>
          </button>
        );
      })}
    </section>
  );
};
