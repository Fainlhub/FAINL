import { FC } from 'react';
import { Link } from 'react-router-dom';

const links = [
  { to: '/privacy', label: 'Privacy statement' },
  { to: '/terms', label: 'Algemene voorwaarden' },
  { to: '/cookies', label: 'Cookieverklaring' },
  { to: '/verwerkersovereenkomst', label: 'Verwerkersovereenkomst' },
];

export const LegalFooter: FC = () => (
  <footer className="legal-footer" aria-label="Juridische links">
    <nav className="legal-footer__nav">
      {links.map(link => (
        <Link key={link.to} to={link.to} className="legal-footer__link">
          {link.label}
        </Link>
      ))}
    </nav>
  </footer>
);
