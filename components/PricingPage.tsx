
import { FC } from 'react';
import {
  Shield,
  Zap,
  ArrowRight,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { PRICING } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO } from './SEO';

interface PricingPageProps {
  hasOwnKeys: boolean;
  onPurchaseTurns: (count: number) => void;
  onPurchaseCredits?: (count: number) => void;
}

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
    <path fill="currentColor" d="M21.5821 5.54289C21.9726 5.93342 21.9726 6.56658 21.5821 6.95711L10.2526 18.2867C9.86452 18.6747 9.23627 18.6775 8.84475 18.293L2.29929 11.8644C1.90527 11.4774 1.89956 10.8443 2.28655 10.4503C2.67354 10.0562 3.30668 10.0505 3.70071 10.4375L9.53911 16.1717L20.1679 5.54289C20.5584 5.15237 21.1916 5.15237 21.5821 5.54289Z" clipRule="evenodd" fillRule="evenodd" />
  </svg>
);

export const PricingPage: FC<PricingPageProps> = ({
  onPurchaseCredits,
}) => {
  const { language } = useLanguage();

  const handlePurchase = (count: number) => {
    if (onPurchaseCredits) {
      onPurchaseCredits(count);
    }
  };

  return (
    <>
    <SEO
      title="Prijzen & Credits — FAINL AI Consensus"
      description="Betaal per credit of kies een maandelijks abonnement. Gebruik meerdere AI-modellen tegelijk voor één gewogen antwoord."
      canonical="/tokens"
      keywords="FAINL prijzen, AI credits kopen, AI abonnement Nederland, meerdere AI modellen prijs"
    />
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-16 md:mb-24">
        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-6 text-black dark:text-white leading-none">
          {language === 'nl' ? 'Prijzen & Credits' : 'Pricing & Credits'}
        </h1>
        <p className="max-w-2xl mx-auto text-black dark:text-white/70 font-bold text-xl md:text-3xl leading-tight">
          {language === 'nl'
            ? 'Betaal per credit of kies een maandelijks abonnement voor onbeperkte mogelijkheden.'
            : 'Pay per credit or choose a monthly subscription for unlimited possibilities.'}
        </p>
      </div>

      {/* One-time credits */}
      <div className="mb-32">
        <div className="flex items-center gap-6 mb-12 justify-center sm:justify-start">
          <div className="bg-[var(--action)] p-5 border-4 border-black shadow-[8px_8px_0_0_black] transition-all">
            <Shield className="w-10 h-10 text-black" />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black dark:text-white">
              {language === 'nl' ? 'Credits Kopen' : 'Buy Credits'}
            </h2>
            <p className="text-xl font-black uppercase tracking-[0.2em] text-[var(--ink)]">
              {language === 'nl' ? 'Eenmalige credits, verlopen nooit.' : 'One-time credits, never expire.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {PRICING.CREDITS.map((pkg, idx) => {
            const perSession = (pkg.price / pkg.count).toFixed(2);
            const isMostChosen = pkg.count === 10;
            return (
            <div key={idx} className={`card-fainl bg-white dark:bg-black border-4 rounded-none p-5 shadow-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all relative ${isMostChosen ? 'border-[var(--action)] ring-2 ring-[var(--action)]' : 'border-black dark:border-[var(--line)]'}`}>
              {isMostChosen && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--action)] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 whitespace-nowrap">
                  Meest gekozen
                </div>
              )}
              <div className="bg-black text-[var(--ink)] text-sm font-black px-3 py-1.5 uppercase tracking-widest inline-block mb-3">{pkg.count} {pkg.count === 1 ? 'CREDIT' : 'CREDITS'}</div>
              <div className="text-4xl xl:text-5xl font-black text-black dark:text-white mb-1">€{pkg.price}</div>
              <p className="text-sm font-bold text-black/60 dark:text-white/40 mb-4 lowercase tracking-widest">€{perSession} per sessie</p>

              <ul className="space-y-2 mb-5">
                <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white"><CheckIcon /> <span>Standaard</span></li>
                <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white"><CheckIcon /> <span>{pkg.count} {pkg.count === 1 ? 'credit = één vraag' : `credits = ${pkg.count} vragen`}</span></li>
                <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white"><CheckIcon /> <span>Complete analyse</span></li>
                <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white"><CheckIcon /> <span>Multi AI inzet</span></li>
                <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white"><CheckIcon /> <span>Opslaan &amp; delen</span></li>
              </ul>

              <button onClick={() => handlePurchase(pkg.count)} className="w-full bg-black text-white hover:bg-[var(--action)] hover:text-black p-3 font-black text-sm uppercase tracking-widest transition-all border-4 border-black shadow-md hover:shadow-none hover:translate-x-1 hover:translate-y-1">
                {language === 'nl' ? `Koop ${pkg.count}` : `Buy ${pkg.count}`}
              </button>
            </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-base font-black uppercase tracking-widest text-black dark:text-white/30">
          {language === 'nl'
            ? 'Alle pakketten worden direct verwerkt via Stripe.'
            : 'All packages processed instantly via Stripe.'}
        </p>
        <p className="mt-3 text-center text-sm font-bold text-black/40 dark:text-white/30 max-w-lg mx-auto">
          {language === 'nl'
            ? 'Credits verlopen nooit · Geen automatische verlenging bij losse pakketten · Vragen? contact@fainl.com'
            : 'Credits never expire · No auto-renewal on one-time packs · Questions? contact@fainl.com'}
        </p>
      </div>


      {/* Subscriptions */}
      <div>
        <div className="flex items-center gap-6 mb-12 justify-center sm:justify-start">
          <div className="bg-black p-5 border-4 border-[var(--line)] shadow-md transition-all text-[var(--ink)]">
            <Zap className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black dark:text-white">
              {language === 'nl' ? 'Maandelijks Abonnement' : 'Monthly Subscription'}
            </h2>
            <p className="text-xl font-black uppercase tracking-[0.2em] text-[var(--ink)]">
              {language === 'nl' ? 'Automatisch hernieuwd elke maand.' : 'Automatically renewed each month.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl items-start">
          {PRICING.SUBSCRIPTIONS.map((pkg, idx) => (
            <div key={idx} className="bg-white dark:bg-black border-4 border-black dark:border-[var(--line)] rounded-none p-5 shadow-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              <div className="bg-black text-[var(--ink)] text-sm font-black px-3 py-1.5 uppercase tracking-widest inline-block mb-3">{pkg.label}</div>
              <div className="text-4xl xl:text-5xl font-black text-black dark:text-white mb-1">
                €{pkg.price}
                <span className="text-base font-bold lowercase text-black/40 dark:text-white/40 ml-2">/{pkg.period}</span>
              </div>

              <ul className="space-y-2 mb-5 mt-4">
                <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white"><CheckIcon /> <span>{pkg.count} {language === 'nl' ? 'Vragen p/m' : 'Queries p/m'}</span></li>
                <li className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]"><CheckIcon /> <span>{language === 'nl' ? 'Onbeperkt archief' : 'Unlimited archive'}</span></li>
                <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white"><CheckIcon /> <span>{language === 'nl' ? 'Hogere prioriteit' : 'Higher priority'}</span></li>
                <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white"><CheckIcon /> <span>{language === 'nl' ? 'Directe beraadslaging' : 'Instant deliberation'}</span></li>
                <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white"><CheckIcon /> <span>Multi AI inzet</span></li>
                <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white"><CheckIcon /> <span>{language === 'nl' ? 'Exclusieve modellen' : 'Exclusive models'}</span></li>
              </ul>

              <a
                href={pkg.stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-black text-white hover:bg-[var(--action)] hover:text-black p-3 font-black text-sm uppercase tracking-widest transition-all border-4 border-black shadow-md hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-center"
              >
                {language === 'nl' ? `Start ${pkg.label}` : `Start ${pkg.label}`}
              </a>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-16 text-center text-base font-black uppercase tracking-widest text-black dark:text-white/30">
        {language === 'nl'
          ? 'Binnenkort meer niveaus · Veilig afrekenen via Stripe'
          : 'More tiers coming soon · Secure checkout via Stripe'}
      </p>
    </div>
    </>
  );
};
