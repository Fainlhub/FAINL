import { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Images,
  LayoutDashboard,
  CreditCard,
} from 'lucide-react';

const items = [
  { path: '/', label: 'Chat', icon: MessageSquare },
  { path: '/beeldraad', label: 'Beeld', icon: Images },
  { path: '/dashboard', label: 'Dossier', icon: LayoutDashboard },
  { path: '/tokens', label: 'Credits', icon: CreditCard },
];

export const BottomNav: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="mobile-nav" aria-label="Hoofdnavigatie">
      {items.map(item => (
        <button
          key={item.path}
          className={`mobile-nav-item${item.path === '/beeldraad'
            ? location.pathname.startsWith('/beeldraad') ? ' active' : ''
            : location.pathname === item.path ? ' active' : ''}`}
          onClick={() => navigate(item.path)}
          aria-current={(item.path === '/beeldraad'
            ? location.pathname.startsWith('/beeldraad')
            : location.pathname === item.path) ? 'page' : undefined}
        >
          <item.icon />
          {item.label}
        </button>
      ))}
    </nav>
  );
};
