import { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  LayoutDashboard,
  CreditCard,
  Heart,
} from 'lucide-react';

const items = [
  { path: '/', label: 'Arena', icon: MessageSquare },
  { path: '/dashboard', label: 'Dossier', icon: LayoutDashboard },
  { path: '/tokens', label: 'Credits', icon: CreditCard },
  { path: '/inclusie', label: 'Inclusie', icon: Heart },
];

export const BottomNav: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="mobile-nav" aria-label="Hoofdnavigatie">
      {items.map(item => (
        <button
          key={item.path}
          className={`mobile-nav-item${location.pathname === item.path ? ' active' : ''}`}
          onClick={() => navigate(item.path)}
          aria-current={location.pathname === item.path ? 'page' : undefined}
        >
          <item.icon />
          {item.label}
        </button>
      ))}
    </nav>
  );
};
