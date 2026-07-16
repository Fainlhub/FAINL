import { FC, useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import {
  Plus,
  Search,
  MessageSquare,
  Moon,
  Sun,
  LogOut,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  CreditCard,
  Mail,
  LayoutDashboard,
  Heart,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  FolderPlus,
  Folder,
  FolderInput,
  Settings2,
  Palette,
  Puzzle,
  Newspaper,
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { ChatThread } from '../../types';
import { NodeConfigPanel } from '../chat/NodeConfigPanel';
import { DesignsPanel } from '../chat/DesignsPanel';
import { ThemePref } from './theme';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen?: boolean;
  width: number;
  onToggle: () => void;
  onResize: (width: number) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  themePref: ThemePref;
  onThemePrefChange: (pref: ThemePref) => void;
  userEmail?: string;
  userName?: string;
  isLoggedIn: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}

const groupByDate = (items: ChatThread[]) => {
  const now = Date.now();
  const day = 86400000;
  const buckets: Record<string, ChatThread[]> = {
    Vandaag: [], Gisteren: [], 'Deze week': [], 'Deze maand': [], Ouder: [],
  };
  for (const item of items) {
    const age = now - new Date(item.updated_at).getTime();
    if (age < day) buckets.Vandaag.push(item);
    else if (age < 2 * day) buckets.Gisteren.push(item);
    else if (age < 7 * day) buckets['Deze week'].push(item);
    else if (age < 30 * day) buckets['Deze maand'].push(item);
    else buckets.Ouder.push(item);
  }
  return Object.entries(buckets)
    .filter(([, v]) => v.length)
    .map(([label, v]) => ({ label, items: v }));
};

type PanelName = 'nodes' | 'designs' | 'plugins' | null;

export const Sidebar: FC<SidebarProps> = ({
  collapsed,
  mobileOpen,
  width,
  onToggle,
  onResize,
  darkMode,
  onToggleTheme,
  themePref,
  onThemePrefChange,
  userEmail,
  userName,
  isLoggedIn,
  onLogout,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    threads,
    projects,
    activeThreadId,
    newThread,
    openThread,
    renameThread,
    pinThread,
    removeThread,
    moveThreadToProject,
    addProject,
  } = useChat();

  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuThreadId, setMenuThreadId] = useState<string | null>(null);
  const [moveMenuId, setMoveMenuId] = useState<string | null>(null);
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<PanelName>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Content matches from the search_threads RPC (title matching stays instant
  // and client-side; the RPC also finds hits inside old answers).
  const [contentHits, setContentHits] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = search.trim();
    if (!isLoggedIn || q.length < 2) {
      setContentHits(new Set());
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc('search_threads', { p_query: q });
      setContentHits(new Set((data ?? []).map((r: { thread_id: string }) => r.thread_id)));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, isLoggedIn]);

  const filtered = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.toLowerCase();
    return threads.filter(t => t.title.toLowerCase().includes(q) || contentHits.has(t.id));
  }, [threads, search, contentHits]);

  const pinned = useMemo(() => filtered.filter(t => t.pinned), [filtered]);
  const byProject = useMemo(() => {
    const map = new Map<string, ChatThread[]>();
    for (const t of filtered) {
      if (t.pinned || !t.project_id) continue;
      map.set(t.project_id, [...(map.get(t.project_id) ?? []), t]);
    }
    return map;
  }, [filtered]);
  const ungrouped = useMemo(
    () => filtered.filter(t => !t.pinned && !t.project_id),
    [filtered]
  );
  const groups = useMemo(() => groupByDate(ungrouped), [ungrouped]);

  const go = (fn: () => void) => { fn(); onNavigate?.(); };
  const newsActive = location.pathname === '/nieuws' || location.pathname.startsWith('/nieuws/');

  const handleOpenThread = (id: string) => go(() => { openThread(id); navigate('/'); });

  const handleRename = (thread: ChatThread) => {
    const title = window.prompt('Nieuwe naam voor dit gesprek:', thread.title);
    if (title?.trim()) renameThread(thread.id, title.trim());
    setMenuThreadId(null);
  };

  const handleDelete = (thread: ChatThread) => {
    if (window.confirm(`"${thread.title}" definitief verwijderen?`)) removeThread(thread.id);
    setMenuThreadId(null);
  };

  const handleNewProject = () => {
    const name = window.prompt('Naam van het nieuwe project:');
    if (name?.trim()) addProject(name.trim());
  };

  const toggleProject = (id: string) => {
    setOpenProjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const ThreadRow: FC<{ thread: ChatThread }> = ({ thread }) => (
    <div className={`sidebar-thread-row${thread.id === activeThreadId ? ' active' : ''}`}>
      <button
        className="sidebar-history-item"
        onClick={() => handleOpenThread(thread.id)}
        title={thread.title}
      >
        <MessageSquare />
        <span className="sidebar-history-label">{thread.title || 'Naamloos'}</span>
      </button>
      <button
        className="sidebar-thread-menu-btn"
        onClick={() => { setMenuThreadId(id => (id === thread.id ? null : thread.id)); setMoveMenuId(null); }}
        aria-label="Opties voor dit gesprek"
      >
        <MoreHorizontal />
      </button>
      {menuThreadId === thread.id && (
        <>
          <div className="flyout-backdrop" onClick={() => { setMenuThreadId(null); setMoveMenuId(null); }} />
          <div className="thread-menu">
            <button className="flyout-item" onClick={() => { pinThread(thread.id, !thread.pinned); setMenuThreadId(null); }}>
              {thread.pinned ? <PinOff className="flyout-icon" /> : <Pin className="flyout-icon" />}
              {thread.pinned ? 'Losmaken' : 'Vastzetten'}
            </button>
            <button className="flyout-item" onClick={() => handleRename(thread)}>
              <Pencil className="flyout-icon" /> Naam wijzigen
            </button>
            {projects.length > 0 && (
              <button className="flyout-item" onClick={() => setMoveMenuId(id => (id === thread.id ? null : thread.id))}>
                <FolderInput className="flyout-icon" /> Verplaatsen…
              </button>
            )}
            {moveMenuId === thread.id && (
              <div className="thread-menu-submenu">
                {thread.project_id && (
                  <button className="flyout-item" onClick={() => { moveThreadToProject(thread.id, null); setMenuThreadId(null); setMoveMenuId(null); }}>
                    Uit project halen
                  </button>
                )}
                {projects.filter(p => p.id !== thread.project_id).map(p => (
                  <button key={p.id} className="flyout-item" onClick={() => { moveThreadToProject(thread.id, p.id); setMenuThreadId(null); setMoveMenuId(null); }}>
                    <Folder className="flyout-icon" /> {p.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flyout-divider" />
            <button className="flyout-item flyout-item--danger" onClick={() => handleDelete(thread)}>
              <Trash2 className="flyout-icon" /> Verwijderen
            </button>
          </div>
        </>
      )}
    </div>
  );

  const handleResizePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (collapsed || window.innerWidth < 1024) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    setIsResizing(true);

    const handleMove = (moveEvent: PointerEvent) => {
      onResize(startWidth + moveEvent.clientX - startX);
    };

    const handleUp = () => {
      setIsResizing(false);
      document.body.classList.remove('sidebar-resizing');
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    document.body.classList.add('sidebar-resizing');
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  return (
    <aside
      className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}${isResizing ? ' resizing' : ''}`}
      style={{ '--sb-w': `${width}px` } as React.CSSProperties}
    >
      <button
        className="sidebar-toggle-btn"
        onClick={onToggle}
        title={collapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen'}
        aria-label={collapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen'}
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        className="sidebar-resize-handle"
        onPointerDown={handleResizePointerDown}
        aria-label="Sidebar breedte aanpassen"
        title="Sleep om de sidebar breder of smaller te maken"
      />

      {/* Logo */}
      <button className="sidebar-logo" onClick={() => go(() => navigate('/'))} aria-label="FAINL — naar startpagina">
        <img
          src="/fainllogo_new_ui.png"
          alt="FAINL"
          className="sidebar-logo-video"
        />
      </button>

      {/* New chat */}
      <button className="btn-new-chat" onClick={() => go(() => { newThread(); navigate('/'); })}>
        <Plus />
        <span>Nieuwe chat</span>
      </button>

      {/* Search */}
      <div className="sidebar-search">
        <Search className="sidebar-search-icon" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoeken…"
          className="sidebar-search-input"
        />
      </div>

      <nav className="sidebar-nav">
        {!isLoggedIn && (
          <p className="sidebar-empty">
            <a href="/login?next=/" className="sidebar-login-link">Log in</a> om chats te bewaren
          </p>
        )}

        {isLoggedIn && (
          <>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div className="sidebar-section">
                <p className="sidebar-section-label">Vastgezet</p>
                {pinned.map(t => <ThreadRow key={t.id} thread={t} />)}
              </div>
            )}

            {/* Projects */}
            <div className="sidebar-section">
              <div className="sidebar-section-head">
                <p className="sidebar-section-label">Projecten</p>
                <button className="sidebar-mini-btn" onClick={handleNewProject} title="Nieuw project" aria-label="Nieuw project">
                  <FolderPlus />
                </button>
              </div>
              {projects.map(p => {
                const items = byProject.get(p.id) ?? [];
                const open = openProjects.has(p.id);
                return (
                  <div key={p.id} className="sidebar-project">
                    <button className="sidebar-history-item" onClick={() => toggleProject(p.id)}>
                      {open ? <ChevronLeft className="rotate-[-90deg]" /> : <ChevronRight />}
                      <Folder />
                      <span className="sidebar-history-label">{p.name}</span>
                      <span className="sidebar-count">{items.length}</span>
                    </button>
                    {open && items.map(t => <ThreadRow key={t.id} thread={t} />)}
                  </div>
                );
              })}
            </div>

            {/* History by date */}
            {groups.length === 0 && threads.length > 0 && search && (
              <p className="sidebar-empty">Geen resultaten</p>
            )}
            {threads.length === 0 && (
              <p className="sidebar-empty">Nog geen chats</p>
            )}
            {groups.map(group => (
              <div key={group.label} className="sidebar-section">
                <p className="sidebar-section-label">{group.label}</p>
                {group.items.map(t => <ThreadRow key={t.id} thread={t} />)}
              </div>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className={`flyout-btn flyout-btn--spread${newsActive ? ' active' : ''}`}
          onClick={() => go(() => navigate('/nieuws'))}
          aria-current={newsActive ? 'page' : undefined}
        >
          <span className="flyout-btn__icon-label">
            <Newspaper className="flyout-icon" />
            <span>AI nieuws</span>
            {newsActive && <span className="sidebar-badge">Actief</span>}
          </span>
        </button>
        <button className="flyout-btn flyout-btn--spread" onClick={() => setPanel('nodes')}>
          <span className="flyout-btn__icon-label">
            <Settings2 className="flyout-icon" />
            <span>Modelinstellingen</span>
          </span>
        </button>
        <button className="flyout-btn flyout-btn--spread" onClick={() => setPanel('designs')}>
          <span className="flyout-btn__icon-label">
            <Palette className="flyout-icon" />
            <span>Designs</span>
          </span>
        </button>
        <button className="flyout-btn flyout-btn--spread" onClick={() => setPanel('plugins')}>
          <span className="flyout-btn__icon-label">
            <Puzzle className="flyout-icon" />
            <span>Plug-ins</span>
            <span className="sidebar-badge">Binnenkort</span>
          </span>
        </button>

        {/* Theme quick toggle */}
        <div className="sidebar-tooltip-wrap">
          <button className="flyout-btn flyout-btn--spread" onClick={onToggleTheme}>
            <span className="flyout-btn__icon-label">
              {darkMode ? <Sun className="flyout-icon" /> : <Moon className="flyout-icon" />}
              <span>{darkMode ? 'Lichte modus' : 'Donkere modus'}</span>
            </span>
          </button>
        </div>

        {/* User */}
        <div className="flyout-trigger">
          <button className="flyout-btn flyout-btn--user" onClick={() => setFlyoutOpen(o => !o)}>
            <span className="user-avatar">
              {userEmail?.charAt(0).toUpperCase() ?? 'G'}
            </span>
            <span className="user-name-wrap">
              <span className="user-display-name">{userName || 'Gast'}</span>
              <span className="user-subtitle">Mijn account</span>
            </span>
            <MoreHorizontal className="flyout-more-icon" />
          </button>

          {flyoutOpen && (
            <>
              <div className="flyout-backdrop" onClick={() => setFlyoutOpen(false)} />
              <div className="flyout-menu">
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); go(() => navigate('/tokens')); }}>
                  <CreditCard className="flyout-icon" /> Prijzen
                </button>
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); go(() => navigate('/dashboard')); }}>
                  <LayoutDashboard className="flyout-icon" /> Mijn FAINL's
                </button>
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); go(() => navigate('/cookbook')); }}>
                  <BookOpen className="flyout-icon" /> Voorbeeldvragen
                </button>
                <div className="flyout-divider" />
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); go(() => navigate('/faq')); }}>
                  <HelpCircle className="flyout-icon" /> FAQ
                </button>
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); go(() => navigate('/contact')); }}>
                  <Mail className="flyout-icon" /> Contact
                </button>
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); go(() => navigate('/inclusie')); }}>
                  <Heart className="flyout-icon" /> Inclusieprogramma
                </button>
                {isLoggedIn && (
                  <>
                    <div className="flyout-divider" />
                    <button className="flyout-item" onClick={() => { setFlyoutOpen(false); onLogout(); }}>
                      <LogOut className="flyout-icon" /> Uitloggen
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Panels */}
      {panel === 'nodes' && <NodeConfigPanel onClose={() => setPanel(null)} />}
      {panel === 'designs' && (
        <DesignsPanel
          themePref={themePref}
          onThemePrefChange={onThemePrefChange}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'plugins' && (
        <div className="panel-backdrop" onClick={() => setPanel(null)}>
          <div className="panel-card" onClick={e => e.stopPropagation()}>
            <h2 className="panel-title">Plug-ins</h2>
            <p className="panel-text">Plug-ins komen binnenkort. Hiermee koppel je straks externe tools en databronnen aan je chats.</p>
            <button className="btn-send" onClick={() => setPanel(null)}>Sluiten</button>
          </div>
        </div>
      )}
    </aside>
  );
};
