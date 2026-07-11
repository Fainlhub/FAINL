import { FC, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, Trash2, X, CircleAlert } from 'lucide-react';
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

// Persist the node order into the shared config (the same key /mission reads),
// preserving all other saved fields.
function saveCouncilOrder(council: CouncilMember[]): void {
  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
  } catch { /* corrupt config: rebuild */ }
  config.activeCouncil = council;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

type VerifyState = 'idle' | 'busy' | 'ok' | 'fail';

export const NodeConfigPanel: FC<NodeConfigPanelProps> = ({ onClose }) => {
  const { byokEnabled, setByokEnabled } = useChat();
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
    setByokKey(provider, value.trim());
    setKeys(getByokKeys());
    setVerifyState(prev => ({ ...prev, [provider]: 'idle' }));
  };

  const handleVerify = async (provider: ByokProvider) => {
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
          <h2 className="panel-title">Node-configuratie</h2>
          <button className="panel-close" onClick={onClose} aria-label="Sluiten"><X /></button>
        </div>

        {/* Node order */}
        <p className="panel-section-label">Volgorde van nodes</p>
        <p className="panel-text">
          De volgorde bepaalt wie meedoet per thinking-niveau: de eerste 3 nodes vormen Moderate, de eerste 5 Complex, alle 7 Max en Ultra.
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

        {/* BYOK */}
        <div className="panel-divider" />
        <p className="panel-section-label"><KeyRound className="panel-inline-icon" /> Eigen sleutels (BYOK)</p>
        <p className="panel-text">
          <ShieldCheck className="panel-inline-icon" /> Sleutels blijven op dit apparaat en gaan alléén rechtstreeks van je browser naar de AI-provider — nooit via FAINL-servers. Met eigen sleutels betaal je 0 credits per antwoord.
        </p>

        <label className="nodeconfig-toggle">
          <input
            type="checkbox"
            checked={byokEnabled}
            onChange={e => setByokEnabled(e.target.checked)}
          />
          <span>Eigen sleutels gebruiken — 0 credits per antwoord</span>
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
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className="byok-verify"
                  onClick={() => handleVerify(provider)}
                  disabled={!keys[provider] || state === 'busy'}
                  title="Sleutel testen (1 minimale testaanvraag, rechtstreeks naar de provider)"
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
          Providers zonder browser-toegang (OpenAI, DeepSeek, Mistral, Perplexity) zijn niet beschikbaar met eigen sleutels; die nodes slaan we in BYOK-modus over.
        </p>

        <div className="byok-actions">
          <button className="panel-link-btn" onClick={() => setShowKeys(s => !s)}>
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
