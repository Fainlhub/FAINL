
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
} from 'lucide-react';
import { useState } from 'react';
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
  const itemsPerPage = 6;

  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNode, setNewNode] = useState({ name: '', role: '', systemPrompt: '' });

  // Stats
  const creditsRemaining = config.isLifetime ? '∞' : config.creditsRemaining;
  const freeSessiesResterend = config.isLifetime ? '∞' : Math.max(0, config.totalTurnsAllowed - config.turnsUsed);
  const totalSessies = history.length;

  // Pagination Logic
  const activeHistory = history.filter(s => !s.isArchived);
  const totalPages = Math.ceil(activeHistory.length / itemsPerPage);
  const currentHistory = activeHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // A custom node is "active in council" if its id is in config.activeCouncil
  const isNodeActiveInCouncil = (nodeId: string) =>
    config.activeCouncil.some(m => m.id === nodeId);

  const handleToggleNodeInCouncil = (node: CouncilMember) => {
    if (isNodeActiveInCouncil(node.id)) {
      // Remove from council — never remove DEFAULT_COUNCIL members
      onUpdateConfig({
        ...config,
        activeCouncil: config.activeCouncil.filter(m => m.id !== node.id),
      });
    } else {
      onUpdateConfig({
        ...config,
        activeCouncil: [...config.activeCouncil, node],
      });
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
    onUpdateConfig({
      ...config,
      customNodes: [...(config.customNodes || []), node],
    });
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
    onUpdateConfig({ 
      ...config, 
      activeCouncil: DEFAULT_COUNCIL,
      modelCount: 3
    });
  };

  const handleSetProtocol = (count: 3 | 5) => {
    const preset = PRESETS.find(p => p.members.length === count);
    if (!preset) return;
    
    onUpdateConfig({
      ...config,
      modelCount: count,
      activeCouncil: preset.members
    });
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
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentHistory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentHistory.map(s => s.id));
    }
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
    return new Date(ts).toLocaleString('nl-NL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-16 md:mb-24">
        <div>
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-6 text-black">
            Mijn FAINL's
          </h2>
          <p className="text-black font-bold text-xl md:text-3xl leading-tight">
            Beheer je credits, nodes, datakluis en je gestelde vragen.
          </p>
        </div>
        <button
          onClick={() => navigate('/tokens')}
          className="flex items-center gap-3 px-8 py-5 bg-black border-4 border-black shadow-md font-black text-white text-xl uppercase tracking-widest hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-lg transition-all"
        >
          <CreditCard className="w-6 h-6 text-[var(--ink)]" />
          Credits Kopen
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 md:mb-24">
        <div className="p-8 bg-black text-white border-4 border-black shadow-[8px_8px_0_0_black] hover:scale-105 transition-all flex flex-col gap-2">
          <Zap className="w-8 h-8 mb-2 text-[var(--ink)]" />
          <div className="text-6xl font-black">{creditsRemaining}</div>
          <div className="text-xl font-black uppercase tracking-[0.2em] opacity-60">Credits</div>
        </div>
        <div className="p-8 bg-white border-4 border-black shadow-[8px_8px_0_0_black] hover:scale-105 transition-all flex flex-col gap-2">
          <MessageSquare className="w-8 h-8 mb-2 text-[var(--ink)]" />
          <div className="text-6xl font-black text-black">{freeSessiesResterend}</div>
          <div className="text-xl font-black uppercase tracking-[0.2em] text-black">Gratis</div>
        </div>
        <div className="p-8 bg-white border-4 border-black shadow-[8px_8px_0_0_black] hover:scale-105 transition-all flex flex-col gap-2">
          <History className="w-8 h-8 mb-2 text-[var(--ink)]" />
          <div className="text-6xl font-black text-black">{totalSessies}</div>
          <div className="text-xl font-black uppercase tracking-[0.2em] text-black">Sessies</div>
        </div>
        <div className="p-8 bg-white border-4 border-black shadow-[8px_8px_0_0_black] hover:scale-105 transition-all flex flex-col gap-2">
          <Users className="w-8 h-8 mb-2 text-[var(--ink)]" />
          <div className="text-6xl font-black text-black">{config.activeCouncil.length}</div>
          <div className="text-xl font-black uppercase tracking-[0.2em] text-black">Nodes</div>
        </div>
      </div>

      {/* Protocol Selector */}
      <div className="mb-16 md:mb-24 p-10 md:p-16 bg-white border-4 border-black shadow-[12px_12px_0_0_black]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="text-center md:text-left">
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 text-black">Protocol Selectie</h3>
            <p className="text-xl font-bold text-black uppercase tracking-widest">
              Kies het aantal AI-modellen dat tegelijkertijd jouw vragen analyseert.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleSetProtocol(3)}
              className={`px-10 py-6 border-4 border-black font-black uppercase tracking-widest text-xl transition-all ${
                config.modelCount === 3 
                ? 'bg-[var(--action)] text-black shadow-none' 
                : 'bg-white text-black hover:bg-[var(--action)]/10'
              }`}
            >
              3 Nodes
            </button>
            <button
              onClick={() => handleSetProtocol(5)}
              className={`px-10 py-6 border-4 border-black font-black uppercase tracking-widest text-xl transition-all ${
                config.modelCount === 5 
                ? 'bg-[var(--action)] text-black shadow-none' 
                : 'bg-white text-black hover:bg-[var(--action)]/10'
              }`}
            >
              5 Nodes
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">

        {/* LEFT COLUMN */}
        <div className="space-y-12">

          {/* Custom Nodes Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-4 border-black pb-4">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Users className="w-6 h-6" />
                Persoonlijke Nodes
              </h2>
              <div className="flex items-center gap-2">
                {config.activeCouncil.length !== DEFAULT_COUNCIL.length && (
                  <button
                    onClick={handleResetCouncil}
                    className="px-3 py-1.5 bg-zinc-100 text-black font-black text-sm uppercase tracking-widest border-2 border-black hover:bg-zinc-200 transition-all"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setIsAddingNode(!isAddingNode)}
                  className="px-4 py-2 bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-[var(--action)] transition-all"
                >
                  {isAddingNode ? 'Annuleren' : '+ Nieuwe Node'}
                </button>
              </div>
            </div>

            {/* Default Council Members (always visible) */}
            <div className="space-y-2">
              <p className="text-lg font-black uppercase tracking-widest text-black/50">Standaard Raad</p>
              {DEFAULT_COUNCIL.map(node => (
                  <div key={node.id} className="p-3 bg-zinc-50 border-2 border-black flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-black rounded-full" />
                    <div>
                      <h4 className="font-black uppercase text-lg text-black">{node.name}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Node Form */}
            {isAddingNode && (
              <div className="p-6 bg-white border-4 border-black space-y-4 animate-in slide-in-from-top-2 duration-300 shadow-lg">
                <p className="text-base font-black uppercase tracking-widest text-black">Nieuwe Node</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Naam (bijv. Juridisch Expert)"
                    value={newNode.name}
                    onChange={e => setNewNode({ ...newNode, name: e.target.value })}
                    className="bg-white border-2 border-black p-3 font-bold text-base w-full"
                  />
                  <input
                    type="text"
                    placeholder="Rol (bijv. Advocaat)"
                    value={newNode.role}
                    onChange={e => setNewNode({ ...newNode, role: e.target.value })}
                    className="bg-white border-2 border-black p-3 font-bold text-base w-full"
                  />
                </div>
                <textarea
                  placeholder="Systeem prompt / Instructies (optioneel)..."
                  value={newNode.systemPrompt}
                  onChange={e => setNewNode({ ...newNode, systemPrompt: e.target.value })}
                  className="w-full bg-white border-2 border-black p-3 font-bold text-base h-28 resize-none"
                />
                <button
                  onClick={handleAddNode}
                  disabled={!newNode.name || !newNode.role}
                  className="w-full py-3 bg-black text-white font-black uppercase tracking-widest text-sm border-2 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black] active:shadow-none active:translate-y-1 transition-all disabled:opacity-40"
                >
                  Node Activeren
                </button>
              </div>
            )}

            {/* Custom Nodes List */}
            {config.customNodes?.length > 0 && (
              <div className="space-y-2">
                <p className="text-base font-black uppercase tracking-widest text-black/50">Jouw Nodes</p>
                {config.customNodes.map(node => {
                  const isActive = isNodeActiveInCouncil(node.id);
                  return (
                    <div key={node.id} className={`p-4 bg-white border-2 border-black flex items-center justify-between group shadow-[2px_2px_0_0_black] hover:border-black hover:shadow-[4px_4px_0_0_black] transition-all ${isActive ? 'border-black shadow-[4px_4px_0_0_black]' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-black' : 'bg-black/20'}`} />
                        <div>
                          <h4 className="font-black uppercase text-sm text-black">{node.name}</h4>
                          <p className="text-base font-bold text-black">{node.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleNodeInCouncil(node)}
                          title={isActive ? 'Deactiveer in raad' : 'Activeer in raad'}
                          className={`flex items-center gap-1.5 px-3 py-1.5 font-black text-base uppercase tracking-widest border transition-all ${isActive ? 'bg-[var(--action)] border-[var(--line)] text-black' : 'bg-white border-black/20 text-black hover:border-[var(--line)] hover:text-[var(--ink)]'}`}
                        >
                          {isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          {isActive ? 'Actief' : 'Inactief'}
                        </button>
                        <button
                          onClick={() => handleRemoveNode(node.id)}
                          className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                          title="Node Verwijderen"
                          aria-label="Node Verwijderen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(!config.customNodes || config.customNodes.length === 0) && !isAddingNode && (
              <p className="text-center py-10 text-xl font-black uppercase tracking-[0.2em] text-black/40 italic border-4 border-dashed border-black/15">
                Nog geen persoonlijke nodes
              </p>
            )}
          </div>

          {/* Data Vault Section */}
          <div className="space-y-8">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-4 border-b-8 border-black pb-6">
              <Database className="w-8 h-8" />
              Datakluis
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <button
                onClick={handleExportData}
                className="flex items-center justify-center gap-6 p-10 bg-white border-4 border-black hover:bg-[var(--action)] hover:text-black transition-all group shadow-md hover:shadow-none translate-x-1 translate-y-1"
              >
                <Download className="w-8 h-8 group-hover:animate-bounce" />
                <div className="text-left">
                  <span className="block font-black uppercase text-xl tracking-widest">Export Backup</span>
                  <span className="text-lg font-bold opacity-40">Download je dataverslag</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Mission History */}
        <div className="space-y-10">
          <div className="flex items-center justify-between border-b-8 border-black pb-8 text-black">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter flex items-center gap-4">
              <History className="w-10 h-10" />
              Geschiedenis
            </h2>
            <div className="flex items-center gap-4">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in duration-300">
                  <button
                    onClick={handleArchive}
                    className="p-3 bg-zinc-100 border-2 border-black hover:bg-[var(--action)] transition-colors"
                    title="Archiveer geselecteerde"
                  >
                    <Archive className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-3 bg-red-100 border-2 border-black text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                    title="Verwijder geselecteerde"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              )}
              <span className="px-6 py-2 bg-black text-white text-xl font-black rounded-none uppercase tracking-widest border-4 border-black shadow-sm">
                {activeHistory.length}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {activeHistory.length > 0 && (
              <div className="flex items-center justify-between px-2 pb-4">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-3 text-lg font-black uppercase tracking-widest text-[var(--ink)] hover:text-black transition-colors"
                >
                  {selectedIds.length === currentHistory.length && currentHistory.length > 0 ? (
                    <CheckSquare className="w-6 h-6" />
                  ) : (
                    <Square className="w-6 h-6" />
                  )}
                  Selecteer Pagina
                </button>
                {totalPages > 1 && (
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="disabled:opacity-20 text-black border-2 border-black p-2"
                      aria-label="Vorige pagina"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-lg font-black uppercase tracking-widest text-black">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="disabled:opacity-20 text-black border-2 border-black p-2"
                      aria-label="Volgende pagina"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeHistory.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-black border-2 md:border-4 border-dashed border-black/20 dark:border-white/20 rounded-none">
                <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-black/30 dark:text-white/30" />
                </div>
                <p className="font-black uppercase tracking-widest text-black dark:text-white text-xl mb-2">Nog geen sessies</p>
                <p className="text-base font-bold text-black/60 dark:text-white/50 text-center px-6 mb-8 max-w-md mx-auto">
                  Stel je eerste vraag aan de Raad en vind hier straks al je eerdere sessies en eindoordelen terug.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-8 py-4 bg-black dark:bg-[var(--action)] text-white dark:text-black border-2 border-black font-black text-sm uppercase tracking-widest hover:bg-[var(--action)] hover:text-black transition-all"
                >
                  Vraag het aan de Raad
                </button>
              </div>
            ) : (
              currentHistory.map((session) => (
                <div key={session.id} className="relative group/row pl-12 mb-6">
                  <button
                    onClick={(e) => toggleSelect(session.id, e)}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 p-2 transition-all ${selectedIds.includes(session.id) ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'}`}
                  >
                    {selectedIds.includes(session.id) ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                  </button>

                  <button
                    onClick={() => onLoadSession(session)}
                    className="w-full flex items-center justify-between p-8 bg-white border-4 border-black shadow-md hover:border-[var(--line)] hover:shadow-lg hover:-translate-x-1 hover:-translate-y-1 transition-all"
                  >
                    <div className="flex items-center gap-6 overflow-hidden">
                      <div className="p-4 bg-zinc-100 rounded-none flex-shrink-0 border-2 border-black">
                        <MessageSquare className="w-8 h-8 text-[var(--ink)]" />
                      </div>
                      <div className="text-left overflow-hidden">
                        <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight truncate max-w-[200px] sm:max-w-md text-black mb-1">
                          "{session.query}"
                        </h4>
                        <span className="text-lg font-bold text-black uppercase tracking-widest">
                          {formatDate(session.timestamp)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-8 h-8 flex-shrink-0 opacity-0 group-hover/row:opacity-100 transition-all text-[var(--ink)]" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Archived sessions count */}
          {history.filter(s => s.isArchived).length > 0 && (
            <p className="text-base font-black uppercase tracking-widest text-black/50 text-center">
              {history.filter(s => s.isArchived).length} gearchiveerde sessie(s) verborgen
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
