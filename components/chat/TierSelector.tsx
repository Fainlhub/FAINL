import { FC, useState, useRef, useEffect } from 'react';
import { ChevronDown, Lock, Zap } from 'lucide-react';
import { ChatTier } from '../../types';
import { CHAT_TIERS, CHAT_TIER_ORDER } from '../../constants';

interface TierSelectorProps {
  tier: ChatTier;
  onChange: (t: ChatTier) => void;
  isLoggedIn: boolean;
  byokEnabled: boolean;
  disabled?: boolean;
}

const costLabel = (t: ChatTier, byok: boolean): string => {
  const def = CHAT_TIERS[t];
  if (def.credits === 0) return 'Gratis';
  if (byok) return '0 credits — eigen sleutels';
  return def.credits === 1 ? '1 credit' : `${def.credits} credits`;
};

export const TierSelector: FC<TierSelectorProps> = ({ tier, onChange, isLoggedIn, byokEnabled, disabled }) => {
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

  const active = CHAT_TIERS[tier];

  return (
    <div className="tier-selector" ref={wrapRef}>
      <button
        type="button"
        className="tier-trigger"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={active.omschrijving}
      >
        <Zap className="tier-trigger-icon" />
        <span>{active.label}</span>
        <ChevronDown className={`tier-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="tier-menu" role="listbox" aria-label="Thinking-niveau">
          {CHAT_TIER_ORDER.map(t => {
            const def = CHAT_TIERS[t];
            const locked = !isLoggedIn && def.credits > 0;
            return (
              <button
                key={t}
                type="button"
                role="option"
                aria-selected={t === tier}
                className={`tier-option${t === tier ? ' selected' : ''}${locked ? ' locked' : ''}`}
                onClick={() => {
                  if (locked) return;
                  onChange(t);
                  setOpen(false);
                }}
              >
                <span className="tier-option-main">
                  <span className="tier-option-label">{def.label}</span>
                  <span className="tier-option-desc">{def.omschrijving}</span>
                </span>
                <span className="tier-option-cost">
                  {locked ? (<><Lock className="tier-lock-icon" /> Inloggen vereist</>) : costLabel(t, byokEnabled)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
