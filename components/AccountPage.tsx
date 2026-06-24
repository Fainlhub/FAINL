
import { FC } from 'react';
import {
  Users,
  MessageSquare,
  Zap,
  Database,
  History,
  ChevronRight,
  CreditCard,
  Trash2,
  Archive,
  ChevronLeft,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
  Download,
  Search,
  Plus,
  Shield,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { SessionState, AppConfig, ModelProvider, CouncilMember } from '../types';
import { DEFAULT_COUNCIL, PRESETS } from '../constants';
import { useNavigate } from 'react-router-dom';

interface AccountPageProps {
  config: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  history: SessionState[];
  onLoadSession: (session: SessionState) => void;
  onDeleteSessions: (ids: string[]) => void;
  onArchiveSessions: (ids: string[]) => void;
}

export const AccountPage: FC<AccountPageProps> = ({
  config,
  onUpdateConfig,
  history,
  onLoadSession,
  onDeleteSessions,
  onArchiveSessions
}) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNode, setNewNode] = useState({ name: '', role: '', systemPrompt: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const creditsRemaining = config.isLifetime ? '∞' : config.creditsRemaining;
  const freeSessiesResterend = config.isLifetime ? '∞' : Math.max(0, config.totalTurnsAllowed - config.turnsUsed);
  const totalSessies = history.length;

  const activeHistory = useMemo(() => {
    const base = history.filter(s => !s.isArchived);
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(s => s.query.toLowerCase().includes(q));
  }, [history, searchQuery]);
  const totalPages = Math.ceil(activeHistory.length / itemsPerPage);
  const currentHistory = activeHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isNodeActiveInCouncil = (nodeId: string) =>
    config.activeCouncil.some(m => m.id === nodeId);

  const handleToggleNodeInCouncil = (node: CouncilMember) => {
    if (isNodeActiveInCouncil(node.id)) {
      onUpdateConfig({ ...config, activeCouncil: config.activeCouncil.filter(m => m.id !== node.id) });
    } else {
      onUpdateConfig({ ...config, activeCouncil: [...config.activeCouncil, node] });
    }
  };

  const handleAddNode = () => {
    if (!newNode.name || !newNode.role) return;
    const node: CouncilMember = {
      id: `custom-${Date.now()}`,
      name: newNode.name,
      role: newNode.role,
      provider: ModelProvider.GOOGLE,
      modelId: 'gemini-2.5-flash',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newNode.name)}`,
      color: 'bg-[var(--action)]',
      description: newNode.role || 'Custom AI Node',
      systemPrompt: newNode.systemPrompt || `Jij bent ${newNode.name}. Jouw rol: ${newNode.role}. Analyseer de vraag vanuit jouw specifieke perspectief.`,
    };
    onUpdateConfig({ ...config, customNodes: [...(config.customNodes || []), node] });
    setNewNode({ name: '', role: '', systemPrompt: '' });
    setIsAddingNode(false);
  };

  const handleRemoveNode = (id: string) => {
    onUpdateConfig({
      ...config,
      customNodes: config.customNodes.filter(n => n.id !== id),
      activeCouncil: config.activeCouncil.filter(m => m.id !== id),
    });
  };

  const handleResetCouncil = () => {
    onUpdateConfig({ ...config, activeCouncil: DEFAULT_COUNCIL, modelCount: 3 });
  };

  const handleSetProtocol = (count: 3 | 5) => {
    const preset = PRESETS.find(p => p.members.length === count);
    if (!preset) return;
    onUpdateConfig({ ...config, modelCount: count, activeCouncil: preset.members });
  };

  const handleExportData = () => {
    const data = JSON.stringify({ config, history }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fainl_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === currentHistory.length ? [] : currentHistory.map(s => s.id));
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Weet je zeker dat je ${selectedIds.length} sessie(s) wilt verwijderen?`)) return;
    onDeleteSessions(selectedIds);
    setSelectedIds([]);
  };

  const handleArchive = () => {
    if (selectedIds.length === 0) return;
    onArchiveSessions(selectedIds);
    setSelectedIds([]);
  };

  const formatDate = (ts?: number) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full bg-white dark:bg-black pt-8 md:pt-16 pb-16 md:pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-6xl mx-auto px-4 md:px-6">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="text-center mb-12 md:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white mb-4">
            Mijn FAINL's
          </h1>
          <p className="text-lg md:text-2xl text-black/60 dark:text-white/60 font-bold max-w-2xl mx-auto leading-relaxed">
            Je sessies, raadsconfiguratie en credits op één plek.
          </p>
        </div>

        {/* ── Stats ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-20">
          {[
            { icon: Zap, value: creditsRemaining, label: 'Credits', accent: true },
            { icon: MessageSquare, value: freeSessiesResterend, label: 'Gratis' },
            { icon: History, value: totalSessies, label: 'Sessies' },
            { icon: Users, value: config.activeCouncil.length, label: 'Raadsleden' },
          ].map(({ icon: Icon, value, label, accent }) => (
            <div
              key={label}
              className={`p-5 md:p-6 border-2 rounded-none transition-all duration-300 hover:shadow-md ${
                accent
                  ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                  : 'bg-white dark:bg-black border-black/10 dark:border-white/10 text-black dark:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 mb-3 ${accent ? 'text-[var(--action)]' : 'text-black/30 dark:text-white/30'}`} />
              <div className="text-3xl md:text-4xl font-black leading-none mb-1">{value}</div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-50">{label}</div>
            </div>
          ))}
        </div>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 md:mb-20">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-widest border-2 border-black dark:border-white hover:bg-[var(--action)] hover:text-black hover:border-[var(--action)] transition-all"
          >
            Nieuwe sessie starten
          </button>
          <button
            onClick={() => navigate('/tokens')}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-black text-black dark:text-white font-black text-sm uppercase tracking-widest border-2 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white transition-all"
          >
            <CreditCard className="w-4 h-4" /> Credits kopen
          </button>
        </div>

        {/* ── Two-column layout ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10 md:gap-16">

          {/* LEFT: Raad & Data */}
          <div className="space-y-10">

            {/* Protocol selector */}
            <div className="bg-white dark:bg-black border-2 border-black/10 dark:border-white/10 p-6 md:p-8 hover:border-black/20 dark:hover:border-white/20 transition-all">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-black dark:text-white mb-2">Raadsformatie</h3>
              <p className="text-sm text-black/50 dark:text-white/40 font-bold mb-5">Kies het aantal AI-raadsleden dat jouw vragen analyseert.</p>
              <div className="flex gap-3">
                {([3, 5] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => handleSetProtocol(n)}
                    className={`flex-1 py-3 border-2 font-black text-sm uppercase tracking-widest transition-all ${
                      config.modelCount === n
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {n} Experts
                  </button>
                ))}
              </div>
            </div>

            {/* Raadsleden */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-black dark:text-white">Raadsleden</h3>
                <div className="flex items-center gap-2">
                  {config.activeCouncil.length !== DEFAULT_COUNCIL.length && (
                    <button onClick={handleResetCouncil} className="text-xs font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors underline underline-offset-2">
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => setIsAddingNode(!isAddingNode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black hover:bg-[var(--action)] hover:text-black transition-all"
                  >
                    <Plus className="w-3 h-3" /> {isAddingNode ? 'Annuleren' : 'Nieuw'}
                  </button>
                </div>
              </div>

              {/* Default members */}
              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/30">Standaard</p>
                {DEFAULT_COUNCIL.map(node => (
                  <div key={node.id} className="flex items-center gap-3 p-3 bg-white dark:bg-black border border-black/10 dark:border-white/10">
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shrink-0">
                      <img src={node.avatar} alt={node.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-black text-black dark:text-white">{node.name}</span>
                      <span className="text-[10px] text-black/40 dark:text-white/30 ml-2">{node.provider}</span>
                    </div>
                    <Shield className="w-3 h-3 text-black/20 dark:text-white/15 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Add node form */}
              {isAddingNode && (
                <div className="p-5 bg-white dark:bg-zinc-900 border-2 border-black/10 dark:border-white/10 space-y-3 mb-4 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-xs font-black uppercase tracking-widest text-black dark:text-white">Nieuw raadslid</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text" placeholder="Naam"
                      value={newNode.name} onChange={e => setNewNode({ ...newNode, name: e.target.value })}
                      className="px-3 py-2 text-sm bg-white dark:bg-black border border-black/15 dark:border-white/15 text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
                    />
                    <input
                      type="text" placeholder="Rol"
                      value={newNode.role} onChange={e => setNewNode({ ...newNode, role: e.target.value })}
                      className="px-3 py-2 text-sm bg-white dark:bg-black border border-black/15 dark:border-white/15 text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
                    />
                  </div>
                  <textarea
                    placeholder="Instructies (optioneel)…"
                    value={newNode.systemPrompt} onChange={e => setNewNode({ ...newNode, systemPrompt: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-black border border-black/15 dark:border-white/15 text-black dark:text-white h-20 resize-none outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                  <button
                    onClick={handleAddNode} disabled={!newNode.name || !newNode.role}
                    className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest hover:bg-[var(--action)] hover:text-black transition-all disabled:opacity-30"
                  >
                    Toevoegen
                  </button>
                </div>
              )}

              {/* Custom nodes */}
              {config.customNodes?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/30">Persoonlijk</p>
                  {config.customNodes.map(node => {
                    const isActive = isNodeActiveInCouncil(node.id);
                    return (
                      <div key={node.id} className="flex items-center gap-3 p-3 bg-white dark:bg-black border border-black/10 dark:border-white/10 group hover:border-black/20 dark:hover:border-white/20 transition-all">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-green-500' : 'bg-black/15 dark:bg-white/15'}`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-black text-black dark:text-white">{node.name}</span>
                          <span className="text-[10px] text-black/40 dark:text-white/30 ml-2">{node.role}</span>
                        </div>
                        <button
                          onClick={() => handleToggleNodeInCouncil(node)}
                          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 transition-all ${
                            isActive ? 'text-green-600 dark:text-green-400' : 'text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleRemoveNode(node.id)}
                          className="text-black/20 dark:text-white/15 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {(!config.customNodes || config.customNodes.length === 0) && !isAddingNode && (
                <p className="text-center py-8 text-sm font-bold text-black/30 dark:text-white/20 border border-dashed border-black/10 dark:border-white/10">
                  Nog geen persoonlijke raadsleden
                </p>
              )}
            </div>

            {/* Export */}
            <button
              onClick={handleExportData}
              className="w-full flex items-center gap-4 p-5 bg-white dark:bg-black border-2 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 bg-black dark:bg-white flex items-center justify-center shrink-0 group-hover:bg-[var(--action)] transition-colors">
                <Download className="w-5 h-5 text-white dark:text-black" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black uppercase tracking-widest text-black dark:text-white">Exporteer data</span>
                <span className="text-xs text-black/40 dark:text-white/30 font-bold">Download je configuratie en sessiegeschiedenis</span>
              </div>
            </button>
          </div>

          {/* RIGHT: Sessiegeschiedenis */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-black dark:text-white flex items-center gap-2">
                <History className="w-5 h-5" /> Sessies
                <span className="text-xs font-bold text-black/30 dark:text-white/20 ml-1">{activeHistory.length}</span>
              </h3>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                    <button onClick={handleArchive} className="p-1.5 text-black/40 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors" title="Archiveren">
                      <Archive className="w-4 h-4" />
                    </button>
                    <button onClick={handleDelete} className="p-1.5 text-red-400 hover:text-red-600 transition-colors" title="Verwijderen">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search */}
            {history.filter(s => !s.isArchived).length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 dark:text-white/20 pointer-events-none" />
                <input
                  type="text" value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Zoek in sessies…"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-bold bg-white dark:bg-black border border-black/10 dark:border-white/10 text-black dark:text-white rounded-none outline-none focus:border-black dark:focus:border-white transition-colors placeholder:text-black/25 dark:placeholder:text-white/20"
                />
              </div>
            )}

            {/* Select all + pagination */}
            {activeHistory.length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-bold text-black/40 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
                  {selectedIds.length === currentHistory.length && currentHistory.length > 0 ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  Selecteer
                </button>
                {totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 disabled:opacity-20 text-black dark:text-white" aria-label="Vorige">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-black/40 dark:text-white/30">{currentPage}/{totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 disabled:opacity-20 text-black dark:text-white" aria-label="Volgende">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Session list */}
            {activeHistory.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-black/10 dark:border-white/10">
                <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  {searchQuery ? <Search className="w-5 h-5 text-black/25 dark:text-white/20" /> : <MessageSquare className="w-5 h-5 text-black/25 dark:text-white/20" />}
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-black dark:text-white mb-1">
                  {searchQuery ? 'Geen resultaten' : 'Nog geen sessies'}
                </p>
                <p className="text-xs font-bold text-black/40 dark:text-white/30 max-w-xs mx-auto mb-6">
                  {searchQuery
                    ? `Geen sessies gevonden met "${searchQuery}".`
                    : 'Stel je eerste vraag aan de Raad.'}
                </p>
                {!searchQuery && (
                  <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest hover:bg-[var(--action)] hover:text-black transition-all">
                    Nieuwe sessie starten
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {currentHistory.map(session => (
                  <div key={session.id} className="group flex items-center gap-3">
                    <button
                      onClick={(e) => toggleSelect(session.id, e)}
                      className={`p-1 shrink-0 transition-opacity ${selectedIds.includes(session.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      {selectedIds.includes(session.id) ? <CheckSquare className="w-4 h-4 text-black dark:text-white" /> : <Square className="w-4 h-4 text-black/25 dark:text-white/20" />}
                    </button>
                    <button
                      onClick={() => onLoadSession(session)}
                      className="flex-1 flex items-center gap-3 p-4 bg-white dark:bg-black border border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 hover:shadow-sm transition-all text-left"
                    >
                      <div className="w-8 h-8 bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-black/30 dark:text-white/25" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-black dark:text-white truncate leading-tight">{session.query}</p>
                        <p className="text-[10px] text-black/35 dark:text-white/25 font-bold mt-0.5">{formatDate(session.timestamp)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-black/15 dark:text-white/10 group-hover:text-black/40 dark:group-hover:text-white/30 transition-colors shrink-0" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Archived count */}
            {history.filter(s => s.isArchived).length > 0 && (
              <p className="text-xs font-bold text-black/30 dark:text-white/20 text-center mt-6">
                {history.filter(s => s.isArchived).length} gearchiveerde sessie(s) verborgen
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
