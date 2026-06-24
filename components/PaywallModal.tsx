
import { FC } from 'react';
import {
  Shield,
  CheckCircle,
  X,
  Star,
  Zap
} from 'lucide-react';
import { PRICING } from '../constants';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  isOpen: boolean;
  hasOwnKeys: boolean;
  authSession?: any;
  isLoading?: boolean;
  onPurchaseTurns: (count: number) => void;
  onPurchaseCredits?: (count: number) => void;
  onClose: () => void;
}

import { useLanguage } from '../contexts/LanguageContext';

export const PaywallModal: FC<PaywallModalProps> = ({
  isOpen,
  isLoading,
  authSession,
  onPurchaseTurns,
  onClose
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
      <div className="bg-[#c3cdde] dark:bg-zinc-900 border-4 border-black dark:border-white/20 rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[32px_32px_0px_0px_rgba(0,0,0,1)] dark:shadow-[32px_32px_0px_1px_rgba(255,255,255,0.1)] overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex justify-between items-center p-6 md:p-8 border-b-4 border-black dark:border-white/20 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="bg-black dark:bg-white p-3 rounded-xl shadow-lg text-white dark:text-black">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none text-black dark:text-white" title="FAINL — Meerdere AI's. Één Eindoordeel.">
                {language === 'nl' ? 'Ontgrendel de Raad' : 'Unlock the Council'}
              </h2>
              <p className="text-sm md:text-sm font-black text-black/40 dark:text-white/40 uppercase mt-1 tracking-widest flex items-center gap-2">
                <Star className="w-3 h-3 text-white fill-white" />
                {language === 'nl' ? 'Jouw persoonlijke AI-raad wacht' : 'Your personal AI council awaits'}
              </p>
            </div>
          </div>
          <button onClick={onClose} title="Close Paywall" aria-label="Close Paywall" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all text-black dark:text-white">
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">

          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black dark:text-white text-center">
               {!authSession
                  ? (language === 'nl' ? 'Ga verder met de Raad' : 'Continue with the Council')
                  : (language === 'nl' ? 'Kies je pakket' : 'Choose your package')}
            </h3>
            <p className="text-sm font-bold text-black/60 dark:text-white/60 leading-relaxed text-center max-w-md mx-auto">
              {!authSession
                 ? (language === 'nl' ? 'Maak een gratis account aan om je sessies te bewaren en meer eindoordelen te ontgrendelen.' : 'Create a free account to save your sessions and unlock more verdicts.')
                 : (language === 'nl' ? "Elke credit geeft je één volledige raadssessie met eindoordeel. Geen abonnement nodig." : "Each credit gives you one full council session with verdict. No subscription required.")}
            </p>
          </div>

          {/* New Card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4">
            {!authSession ? (
                <div className="col-span-1 sm:col-span-2 flex justify-center py-6">
                   <button
                     onClick={() => { onClose(); navigate('/login'); }}
                     className="px-10 py-5 bg-black text-white font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                   >
                     {language === 'nl' ? 'Inloggen / Registreren' : 'Sign in / Register'}
                   </button>
                </div>
            ) : PRICING.CREDITS.map((pkg, idx) => (
              <div
                key={idx}
                className={`card-fainl !min-height-[auto] !p-5 ${isLoading ? 'loading' : ''}`}
              >
                <Zap className="w-5 h-5 text-black/30 dark:text-white/30 mb-3 group-hover:text-black dark:group-hover:text-white transition-colors" />
                <div className="text-3xl font-black mb-1 text-black dark:text-white">{pkg.count}</div>
                <div className="text-sm font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-3">
                  {language === 'nl' ? 'Credits' : 'Credits'}
                </div>
                <div className="flex justify-between items-end mb-4">
                  <span className="card__title !text-2xl !mb-0 !border-b-2">€{pkg.price}</span>
                  <span className="text-sm font-black uppercase text-black/40 dark:text-white/40 mb-1">{pkg.label}</span>
                </div>

                <ul className="card__lists !mb-6 !gap-2">
                  <li className="card__list !gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0">
                      <path fill="currentColor" d="M21.5821 5.54289C21.9726 5.93342 21.9726 6.56658 21.5821 6.95711L10.2526 18.2867C9.86452 18.6747 9.23627 18.6775 8.84475 18.293L2.29929 11.8644C1.90527 11.4774 1.89956 10.8443 2.28655 10.4503C2.67354 10.0562 3.30668 10.0505 3.70071 10.4375L9.53911 16.1717L20.1679 5.54289C20.5584 5.15237 21.1916 5.15237 21.5821 5.54289Z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                    <span className="!text-sm">Directe Beraadslaging</span>
                  </li>
                  <li className="card__list !gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0">
                      <path fill="currentColor" d="M21.5821 5.54289C21.9726 5.93342 21.9726 6.56658 21.5821 6.95711L10.2526 18.2867C9.86452 18.6747 9.23627 18.6775 8.84475 18.293L2.29929 11.8644C1.90527 11.4774 1.89956 10.8443 2.28655 10.4503C2.67354 10.0562 3.30668 10.0505 3.70071 10.4375L9.53911 16.1717L20.1679 5.54289C20.5584 5.15237 21.1916 5.15237 21.5821 5.54289Z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                    <span className="!text-sm">Multi-AI Eindoordeel</span>
                  </li>
                </ul>

                <button
                  onClick={() => onPurchaseTurns(pkg.count)}
                  disabled={isLoading}
                  className="card__cta !py-3 !text-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <> {language === 'nl' ? 'Selecteren' : 'Select'} </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-white/50 dark:bg-zinc-950/50 border-4 border-black dark:border-white/20 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-black dark:text-white">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-black uppercase tracking-widest">{language === 'nl' ? 'Gezamenlijk Oordeel' : 'Joint Verdict'}</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-black uppercase tracking-widest">{language === 'nl' ? 'Versleutelde Logica' : 'Encrypted Local Logic'}</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-black uppercase tracking-widest">{language === 'nl' ? 'Zonder Data Training' : 'Zero Data Training'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 border-t-4 border-black dark:border-white/20 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-black text-black/50 dark:text-white/40 uppercase tracking-[0.2em]">
            {language === 'nl' ? 'Veilig Afrekenen via Stripe • Versleuteld Protocol 2.5.1' : 'Secure Checkout via Stripe • Encrypted Protocol 2.5.1'}
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-4 bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            {language === 'nl' ? 'Later beslissen' : "Decide later"}
          </button>
        </div>
      </div>
    </div>
  );
};
