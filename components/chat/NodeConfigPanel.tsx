import { FC, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { CouncilMember } from '../../types';
import { DEFAULT_COUNCIL } from '../../constants';
import { useChat } from '../../contexts/ChatContext';
import {
  BYOK_PROVIDERS,
  ByokProvider,
  clearByokKeys,
  getByokKeys,
  setByokKey,
  verifyByokKey,
} from '../../services/byokService';
import { getActiveCouncil } from '../../services/chatService';

interface NodeConfigPanelProps {
  onClose: () => void;
}

const CONFIG_KEY = 'fainl_config_v2';

function saveCouncilOrder(council: CouncilMember[]): void {
  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
  } catch {
    // Rebuild corrupt local config.
  }
  config.activeCouncil = council;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

type VerifyState = 'idle' | 'busy' | 'ok' | 'fail';

export const NodeConfigPanel: FC<NodeConfigPanelProps> = ({ onClose }) => {
  const { byokEnabled, byokAllowed, setByokEnabled } = useChat();
  const [council, setCouncil] = useState<CouncilMember[]>(() => getActiveCouncil());
  const [keys, setKeys] = useState(() => getByokKeys());
  const [showKeys, setShowKeys] = useState(false);
  const [verifyState, setVerifyState] = useState<Partial<Record<ByokProvider, VerifyState>>>({});

  const move = (index: number, dir: -1 | 1) => {
    const next = [...council];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCouncil(next);
    saveCouncilOrder(next);
  };

  const resetOrder = () => {
    setCouncil(DEFAULT_COUNCIL);
    saveCouncilOrder(DEFAULT_COUNCIL);
  };

  const handleKeyChange = (provider: ByokProvider, value: string) => {
    if (!byokAllowed) return;
    setByokKey(provider, value.trim());
    setKeys(getByokKeys());
    setVerifyState(prev => ({ ...prev, [provider]: 'idle' }));
  };

  const handleVerify = async (provider: ByokProvider) => {
    if (!byokAllowed) return;
    const key = keys[provider];
    if (!key) return;
    setVerifyState(prev => ({ ...prev, [provider]: 'busy' }));
    const ok = await verifyByokKey(provider, key);
    setVerifyState(prev => ({ ...prev, [provider]: ok ? 'ok' : 'fail' }));
  };

  const handleClearAll = () => {
    if (!window.confirm('Alle eigen sleutels van dit apparaat wissen?')) return;
    clearByokKeys();
    setKeys({});
    setVerifyState({});
    setByokEnabled(false);
  };

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div className="panel-card panel-card--wide" onClick={e => e.stopPropagation()}>
        <div className="panel-head">
          <h2 className="panel-title">Modelinstellingen</h2>
          <button className="panel-close" onClick={onClose} aria-label="Sluiten"><X /></button>
        </div>

        <p className="panel-section-label">Volgorde Hoge Raad</p>
        <p className="panel-text">
          Deze volgorde geldt voor de multiconsensus-tool met Victor. In de gewone chat kies je modellen direct in de invoerbalk.
        </p>
        <div className="nodeconfig-list">
          {council.map((member, i) => (
            <div key={member.id} className="nodeconfig-row">
              <span className="nodeconfig-index">{i + 1}</span>
              <span className="nodeconfig-name">{member.name}</span>
              <span className="nodeconfig-model">{member.modelId}</span>
              <span className="nodeconfig-actions">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${member.name} omhoog`}><ArrowUp /></button>
                <button onClick={() => move(i, 1)} disabled={i === council.length - 1} aria-label={`${member.name} omlaag`}><ArrowDown /></button>
              </span>
            </div>
          ))}
        </div>
        <button className="panel-link-btn" onClick={resetOrder}>Standaardvolgorde herstellen</button>

        <div className="panel-divider" />
        <p className="panel-section-label"><KeyRound className="panel-inline-icon" /> Eigen sleutels (BYOK)</p>
        <p className="panel-text">
          <ShieldCheck className="panel-inline-icon" /> Sleutels blijven op dit apparaat en gaan rechtstreeks van je browser naar de AI-provider. BYOK is beschikbaar voor Pro- en lifetime-gebruikers.
        </p>
        {!byokAllowed && (
          <p className="panel-lock-note">
            <Lock className="panel-inline-icon" /> Upgrade naar Pro om eigen sleutels te gebruiken binnen FAINL.
          </p>
        )}

        <label className={`nodeconfig-toggle${!byokAllowed ? ' nodeconfig-toggle--locked' : ''}`}>
          <input
            type="checkbox"
            checked={byokAllowed && byokEnabled}
            disabled={!byokAllowed}
            onChange={e => setByokEnabled(e.target.checked)}
          />
          <span>Eigen sleutels gebruiken - 0 FAINL credits per antwoord</span>
        </label>

        <div className="byok-list">
          {(Object.keys(BYOK_PROVIDERS) as ByokProvider[]).map(provider => {
            const state = verifyState[provider] ?? 'idle';
            return (
              <div key={provider} className="byok-row">
                <span className="byok-label">{BYOK_PROVIDERS[provider].label}</span>
                <input
                  type={showKeys ? 'text' : 'password'}
                  className="byok-input"
                  value={keys[provider] ?? ''}
                  placeholder={BYOK_PROVIDERS[provider].keyHint}
                  onChange={e => handleKeyChange(provider, e.target.value)}
                  disabled={!byokAllowed}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className="byok-verify"
                  onClick={() => handleVerify(provider)}
                  disabled={!byokAllowed || !keys[provider] || state === 'busy'}
                  title="Sleutel testen met een minimale aanvraag rechtstreeks naar de provider"
                >
                  {state === 'busy' ? <Loader2 className="spinning" />
                    : state === 'ok' ? <Check className="byok-ok" />
                    : state === 'fail' ? <CircleAlert className="byok-fail" />
                    : 'Test'}
                </button>
              </div>
            );
          })}
        </div>
        <p className="panel-text panel-text--muted">
          Providers zonder browser-toegang (OpenAI, DeepSeek, Mistral, Perplexity) zijn niet beschikbaar met eigen sleutels; die modellen slaan we in BYOK-modus over.
        </p>

        <div className="byok-actions">
          <button className="panel-link-btn" onClick={() => setShowKeys(value => !value)} disabled={!byokAllowed}>
            {showKeys ? <><EyeOff className="panel-inline-icon" /> Verberg sleutels</> : <><Eye className="panel-inline-icon" /> Toon sleutels</>}
          </button>
          <button className="panel-link-btn panel-link-btn--danger" onClick={handleClearAll}>
            <Trash2 className="panel-inline-icon" /> Wis alle sleutels
          </button>
        </div>
      </div>
    </div>
  );
};
