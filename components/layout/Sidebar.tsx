import { FC, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  MessageSquare,
  Moon,
  Sun,
  LogOut,
  MoreHorizontal,
  ChevronLeft,
  BookOpen,
  HelpCircle,
  CreditCard,
  Mail,
  LayoutDashboard,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  history: { id: string; query: string; timestamp?: number }[];
  onLoadSession: (s: any) => void;
  onNewChat: () => void;
  userEmail?: string;
  userName?: string;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const groupByDate = (items: { id: string; query: string; timestamp?: number }[]) => {
  const now = Date.now();
  const day = 86400000;
  const groups: { label: string; items: typeof items }[] = [];
  const today: typeof items = [];
  const yesterday: typeof items = [];
  const week: typeof items = [];
  const month: typeof items = [];
  const older: typeof items = [];

  for (const item of items) {
    const age = now - (item.timestamp || 0);
    if (!item.timestamp) older.push(item);
    else if (age < day) today.push(item);
    else if (age < 2 * day) yesterday.push(item);
    else if (age < 7 * day) week.push(item);
    else if (age < 30 * day) month.push(item);
    else older.push(item);
  }

  if (today.length) groups.push({ label: 'Vandaag', items: today });
  if (yesterday.length) groups.push({ label: 'Gisteren', items: yesterday });
  if (week.length) groups.push({ label: 'Deze week', items: week });
  if (month.length) groups.push({ label: 'Deze maand', items: month });
  if (older.length) groups.push({ label: 'Ouder', items: older });
  return groups;
};

export const Sidebar: FC<SidebarProps> = ({
  collapsed,
  onToggle,
  darkMode,
  onToggleTheme,
  history,
  onLoadSession,
  onNewChat,
  userEmail,
  userName,
  isLoggedIn,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter(s => s.query.toLowerCase().includes(q));
  }, [history, search]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <button
        className="sidebar-toggle-btn"
        onClick={onToggle}
        title={collapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen'}
        aria-label={collapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen'}
      >
        <ChevronLeft />
      </button>

      {/* Logo */}
      <button className="sidebar-logo" onClick={() => navigate('/')}>
        <video
          src="/FAINLANI.mp4"
          autoPlay muted loop playsInline
          className="sidebar-logo-video"
        />
      </button>

      {/* New chat */}
      <button className="btn-new-chat" onClick={onNewChat}>
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

      {/* Chat history — grouped by date */}
      <nav className="sidebar-nav">
        {groups.length === 0 && history.length > 0 && search && (
          <p className="sidebar-empty">Geen resultaten</p>
        )}
        {groups.length === 0 && history.length === 0 && (
          <p className="sidebar-empty">Nog geen chats</p>
        )}
        {groups.map(group => (
          <div key={group.label} className="sidebar-section">
            <p className="sidebar-section-label">{group.label}</p>
            {group.items.map(s => (
              <button
                key={s.id}
                className="sidebar-history-item"
                onClick={() => onLoadSession(s)}
                title={s.query}
              >
                <MessageSquare />
                <span className="sidebar-history-label">{s.query || 'Naamloos'}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Theme toggle */}
        <div className="sidebar-tooltip-wrap">
          <button className="flyout-btn" onClick={onToggleTheme} style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {darkMode ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
              <span>{darkMode ? 'Lichte modus' : 'Donkere modus'}</span>
            </span>
          </button>
        </div>

        {/* User */}
        <div className="flyout-trigger">
          <button className="flyout-btn" onClick={() => setFlyoutOpen(o => !o)} style={{ paddingLeft: 8 }}>
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
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); navigate('/tokens'); }}>
                  <CreditCard style={{ width: 14, height: 14 }} /> Prijzen
                </button>
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); navigate('/dashboard'); }}>
                  <LayoutDashboard style={{ width: 14, height: 14 }} /> Mijn FAINL's
                </button>
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); navigate('/cookbook'); }}>
                  <BookOpen style={{ width: 14, height: 14 }} /> Voorbeeldvragen
                </button>
                <div className="flyout-divider" />
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); navigate('/faq'); }}>
                  <HelpCircle style={{ width: 14, height: 14 }} /> FAQ
                </button>
                <button className="flyout-item" onClick={() => { setFlyoutOpen(false); navigate('/contact'); }}>
                  <Mail style={{ width: 14, height: 14 }} /> Contact
                </button>
                {isLoggedIn && (
                  <>
                    <div className="flyout-divider" />
                    <button className="flyout-item" onClick={() => { setFlyoutOpen(false); onLogout(); }}>
                      <LogOut style={{ width: 14, height: 14 }} /> Uitloggen
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
