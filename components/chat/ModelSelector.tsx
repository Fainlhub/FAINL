import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Cpu, Lock } from 'lucide-react';
import { CouncilMember } from '../../types';

interface ModelSelectorProps {
  models: CouncilMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  isLoggedIn: boolean;
  byokEnabled: boolean;
  disabled?: boolean;
}

const creditLabel = (count: number, byokEnabled: boolean, isLoggedIn: boolean) => {
  if (!isLoggedIn && count === 1) return 'Gratis';
  if (byokEnabled) return '0 credits';
  return count === 1 ? '1 credit' : `${count} credits`;
};

export const ModelSelector: FC<ModelSelectorProps> = ({
  models,
  selectedIds,
  onChange,
  isLoggedIn,
  byokEnabled,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const selectedModels = useMemo(
    () => models.filter(model => selectedIds.includes(model.id)),
    [models, selectedIds]
  );
  const selectedCount = Math.max(1, selectedModels.length);
  const locked = !isLoggedIn && selectedCount > 1;

  const toggleModel = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    onChange(next.length ? next : [id]);
  };

  return (
    <div className="model-selector" ref={wrapRef}>
      <button
        type="button"
        className="model-trigger"
        onClick={() => setOpen(value => !value)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Kies welke AI-modellen antwoord geven"
      >
        <Cpu className="model-trigger-icon" />
        <span>{selectedCount === 1 ? selectedModels[0]?.name ?? 'Model' : `${selectedCount} modellen`}</span>
        <span className="model-trigger-cost">{creditLabel(selectedCount, byokEnabled, isLoggedIn)}</span>
        <ChevronDown className={`model-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="model-menu" role="listbox" aria-label="AI-modellen selecteren">
          <div className="model-menu-head">
            <span>Kies model(len)</span>
            <span>{creditLabel(selectedCount, byokEnabled, isLoggedIn)}</span>
          </div>
          {!isLoggedIn && (
            <p className="model-menu-note">
              Log in om meerdere modellen tegelijk te gebruiken.
            </p>
          )}
          {models.map(model => {
            const checked = selectedIds.includes(model.id);
            const optionLocked = !isLoggedIn && !checked && selectedIds.length >= 1;
            return (
              <button
                key={model.id}
                type="button"
                role="option"
                aria-selected={checked}
                className={`model-option${checked ? ' selected' : ''}${optionLocked ? ' locked' : ''}`}
                onClick={() => {
                  if (optionLocked) return;
                  toggleModel(model.id);
                }}
              >
                <span className="model-check">{checked ? <Check /> : null}</span>
                <span className="model-option-main">
                  <span className="model-option-label">{model.name}</span>
                  <span className="model-option-desc">{model.provider} · {model.description}</span>
                </span>
                {optionLocked && (
                  <span className="model-option-lock"><Lock /> Login</span>
                )}
              </button>
            );
          })}
          {locked && (
            <p className="model-menu-note">
              Meerdere modellen zijn alleen beschikbaar na login.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
