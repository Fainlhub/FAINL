import { FC, useState, useEffect } from "react";
import { Shield, X, ChevronDown, ChevronUp } from "lucide-react";

const CONSENT_KEY = "fainl_cookie_consent";

interface ConsentState {
  decided: boolean;
  analytics: boolean;
  advertising: boolean;
}

function fireConsentEvent(analytics: boolean, advertising: boolean) {
  // Keep analytics and advertising denied until the visitor explicitly accepts.
  const g = (window as typeof window & { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof g === 'function') {
    g('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: advertising ? 'granted' : 'denied',
      ad_user_data: advertising ? 'granted' : 'denied',
      ad_personalization: advertising ? 'granted' : 'denied',
    });
    if (analytics) g('event', 'page_view'); // send the deferred first page view
  }
  window.dispatchEvent(
    new CustomEvent("fainl:cookie-consent", { detail: { analytics, advertising } }),
  );
}

export const CookieConsent: FC = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (saved) {
      const parsed: ConsentState = JSON.parse(saved);
      if (parsed.decided && typeof parsed.advertising === "boolean") {
        fireConsentEvent(parsed.analytics, parsed.advertising);
        return;
      }
      // Existing consent predates advertising consent and must be renewed.
    }
    // First visit — show banner after short delay
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    const state: ConsentState = { decided: true, analytics: true, advertising: true };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    fireConsentEvent(true, true);
    setVisible(false);
  };

  const decline = () => {
    const state: ConsentState = { decided: true, analytics: false, advertising: false };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    fireConsentEvent(false, false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie toestemming"
      className="cookie-consent fixed bottom-3 left-3 right-3 md:left-auto md:right-8 md:bottom-8 md:max-w-lg z-[200] animate-in slide-in-from-bottom-4 fade-in duration-500"
    >
      <div className="cookie-consent__panel bg-white dark:bg-black border-4 border-black dark:border-[var(--line)] rounded-none shadow-lg dark:shadow-lg overflow-hidden">
        {/* Header */}
        <div className="cookie-consent__header flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black dark:bg-[var(--action)] text-white dark:text-black">
              <Shield className="w-5 h-5" />
            </div>
            <span className="cookie-consent__title font-black text-lg md:text-xl uppercase tracking-widest text-black dark:text-white">
              Privacy & Cookies
            </span>
          </div>
          <button
            onClick={decline}
            aria-label="Sluit en weiger cookies"
            className="cookie-consent__close p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-black dark:text-white/50" />
          </button>
        </div>

        {/* Body */}
        <div className="cookie-consent__body px-6 pb-4">
          <p className="cookie-consent__text text-lg md:text-xl text-black dark:text-white/80 leading-relaxed">
            Wij gebruiken{" "}
            <strong className="text-black dark:text-white">
              noodzakelijke cookies
            </strong>{" "}
            voor een correcte werking van deze site. Met jouw toestemming
            plaatsen we ook{" "}
            <strong className="text-black dark:text-white">
              analytische en advertentiecookies
            </strong>{" "}
            voor Google Analytics en advertenties op publieke nieuwspagina's.
          </p>

          {/* Expandable details */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="cookie-consent__details mt-3 flex items-center gap-1 text-lg font-black uppercase tracking-widest text-black/40 dark:text-[var(--ink)] hover:text-black transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {expanded ? "Verberg details" : "Meer details"}
          </button>

          {expanded && (
            <div className="cookie-consent__expanded mt-4 space-y-4 text-lg text-black dark:text-white/70 leading-relaxed border-t-2 border-black/10 dark:border-[var(--line)]/20 pt-4">
              <div>
                <span className="font-black text-black dark:text-white uppercase">
                  Noodzakelijk (altijd actief)
                </span>
                <p className="mt-1">
                  Sessie-instellingen, thema-voorkeur, trial-toestand. Geen
                  persoonsgegevens naar derden.
                </p>
              </div>
              <div>
                <span className="font-black text-black dark:text-white uppercase">
                  Analytisch (alleen met toestemming)
                </span>
                <p className="mt-1">
                  Google Analytics 4 — anoniem paginagebruik. Rechtsgrond:
                  toestemming (Art. 6.1.a AVG). Bewaartermijn: 14 maanden.
                </p>
              </div>
              <div>
                <span className="font-black text-black dark:text-white uppercase">
                  Advertenties (alleen met toestemming)
                </span>
                <p className="mt-1">
                  Google AdSense op publieke nieuwspagina's. Reclamevrije
                  accounts krijgen geen advertentie-units.
                </p>
              </div>
              <a
                href="/privacy"
                className="underline text-black dark:text-[var(--ink)] font-black"
              >
                Volledige privacyverklaring →
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="cookie-consent__actions flex gap-4 px-6 pb-6">
          <button
            onClick={decline}
            className="cookie-consent__button flex-1 px-4 py-4 border-4 border-black dark:border-white/20 text-black dark:text-white font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Noodzakelijk
          </button>
          <button
            onClick={accept}
            className="cookie-consent__button flex-1 px-4 py-4 bg-black dark:bg-[var(--action)] text-white dark:text-black font-black text-lg md:text-xl uppercase tracking-widest rounded-none hover:bg-[var(--action)] hover:text-black dark:hover:bg-white transition-all shadow-lg"
          >
            Accepteer
          </button>
        </div>
      </div>
    </div>
  );
};
