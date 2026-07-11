import { FC } from 'react';
import { Monitor, Moon, Sun, X } from 'lucide-react';
import { ThemePref } from '../layout/theme';

interface DesignsPanelProps {
  themePref: ThemePref;
  onThemePrefChange: (pref: ThemePref) => void;
  onClose: () => void;
}

const OPTIONS: { value: ThemePref; label: string; icon: FC<{ className?: string }> }[] = [
  { value: 'light', label: 'Licht', icon: Sun },
  { value: 'dark', label: 'Donker', icon: Moon },
  { value: 'system', label: 'Systeem', icon: Monitor },
];

export const DesignsPanel: FC<DesignsPanelProps> = ({ themePref, onThemePrefChange, onClose }) => (
  <div className="panel-backdrop" onClick={onClose}>
    <div className="panel-card" onClick={e => e.stopPropagation()}>
      <div className="panel-head">
        <h2 className="panel-title">Designs</h2>
        <button className="panel-close" onClick={onClose} aria-label="Sluiten"><X /></button>
      </div>

      <p className="panel-section-label">Thema</p>
      <div className="designs-theme-row" role="radiogroup" aria-label="Thema">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={themePref === value}
            className={`designs-theme-option${themePref === value ? ' selected' : ''}`}
            onClick={() => onThemePrefChange(value)}
          >
            <Icon className="designs-theme-icon" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <p className="panel-text">Systeem volgt automatisch de licht/donker-instelling van je apparaat.</p>
    </div>
  </div>
);
