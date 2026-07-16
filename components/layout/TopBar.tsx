import { FC } from 'react';
import { Menu } from 'lucide-react';

interface TopBarProps {
  onMenuOpen?: () => void;
}

export const TopBar: FC<TopBarProps> = ({ onMenuOpen }) => {
  return (
    <div className="mobile-topbar">
      <img
        src="/fainllogo_new_ui.png"
        alt="FAINL"
        className="mobile-topbar-logo"
      />
      {onMenuOpen && (
        <button onClick={onMenuOpen} className="mobile-topbar-btn" aria-label="Menu openen">
          <Menu className="mobile-topbar-icon" />
        </button>
      )}
    </div>
  );
};
