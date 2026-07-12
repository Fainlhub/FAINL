import { FC, ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { LegalFooter } from './LegalFooter';
import { useAuth } from '../../contexts/AuthContext';
import { ThemePref, getStoredThemePref, storeThemePref, resolveDark } from './theme';

interface AppShellProps {
  children: ReactNode;
}

const SIDEBAR_WIDTH_KEY = 'fainl_sidebar_width';
const DEFAULT_SIDEBAR_WIDTH = 280;
const MIN_SIDEBAR_WIDTH = 232;
const MAX_SIDEBAR_WIDTH = 420;

const clampSidebarWidth = (width: number) =>
  Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, Math.round(width)));

export const AppShell: FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const { authSession, handleLogout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('fainl_sidebar_collapsed') === 'true'
  );
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(stored) && stored > 0
      ? clampSidebarWidth(stored)
      : DEFAULT_SIDEBAR_WIDTH;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [themePref, setThemePref] = useState<ThemePref>(getStoredThemePref);
  const [darkMode, setDarkMode] = useState(() => resolveDark(getStoredThemePref()));

  useEffect(() => {
    storeThemePref(themePref);
    setDarkMode(resolveDark(themePref));
    if (themePref !== 'system') return;
    // Follow the OS while the preference is 'system'.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setDarkMode(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themePref]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('fainl_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleSidebarResize = (width: number) => {
    const next = clampSidebarWidth(width);
    setSidebarWidth(next);
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(next));
  };

  const userEmail = authSession?.user?.email;
  const userName =
    authSession?.user?.user_metadata?.full_name ||
    authSession?.user?.user_metadata?.name ||
    userEmail?.split('@')[0] ||
    undefined;

  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:font-black focus:text-sm focus:uppercase focus:tracking-widest"
      >
        Direct naar inhoud
      </a>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${mobileMenuOpen ? ' visible' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        width={sidebarWidth}
        onToggle={toggleSidebar}
        onResize={handleSidebarResize}
        darkMode={darkMode}
        onToggleTheme={() => setThemePref(darkMode ? 'light' : 'dark')}
        themePref={themePref}
        onThemePrefChange={setThemePref}
        userEmail={userEmail}
        userName={userName}
        isLoggedIn={!!authSession}
        onLogout={handleLogout}
        onNavigate={() => setMobileMenuOpen(false)}
      />

      <div
        className={`main-canvas${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}
        style={{ '--sb-w': `${sidebarWidth}px` } as React.CSSProperties}
      >
        <TopBar onMenuOpen={() => setMobileMenuOpen(true)} />
        <div id="main-content" role="main" aria-live="polite">
          {children}
        </div>
        <LegalFooter />
      </div>

      <BottomNav />
    </div>
  );
};
