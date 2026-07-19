import { FC } from 'react';
import { Image, MessageSquare } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './imageCouncil.css';

export const ImageCouncilModeSwitch: FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const imageMode = location.pathname === '/beeldraad' ||
    location.pathname.startsWith('/beeldraad/');

  return (
    <div
      className={`ic-mode-switch ${className}`.trim()}
      role="group"
      aria-label="FAINL modus"
    >
      <button
        type="button"
        className={`ic-mode-switch__option${!imageMode ? ' is-active' : ''}`}
        aria-pressed={!imageMode}
        onClick={() => navigate('/')}
      >
        <MessageSquare aria-hidden="true" />
        <span>Chat</span>
      </button>
      <button
        type="button"
        className={`ic-mode-switch__option${imageMode ? ' is-active' : ''}`}
        aria-pressed={imageMode}
        onClick={() => navigate('/beeldraad')}
      >
        <Image aria-hidden="true" />
        <span>Beeldraad</span>
      </button>
    </div>
  );
};

