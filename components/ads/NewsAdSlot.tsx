import { FC, useEffect, useRef, useState } from "react";

const CONSENT_KEY = "fainl_cookie_consent";
const ADSENSE_CLIENT = "ca-pub-7584438343948866";

interface NewsAdSlotProps {
  enabled: boolean;
  placement: "feed" | "article";
}

function hasAdvertisingConsent(): boolean {
  try {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) return false;
    const parsed = JSON.parse(saved) as { decided?: boolean; advertising?: boolean };
    return parsed.decided === true && parsed.advertising === true;
  } catch {
    return false;
  }
}

export const NewsAdSlot: FC<NewsAdSlotProps> = ({ enabled, placement }) => {
  const slotId = import.meta.env.VITE_ADSENSE_NEWS_SLOT?.trim();
  const adRef = useRef<HTMLModElement>(null);
  const initializedRef = useRef(false);
  const [consented, setConsented] = useState(hasAdvertisingConsent);
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<{ advertising?: boolean }>).detail;
      setConsented(detail?.advertising === true);
    };
    window.addEventListener("fainl:cookie-consent", update);
    return () => window.removeEventListener("fainl:cookie-consent", update);
  }, []);

  useEffect(() => {
    if (!enabled || !consented || !slotId || initializedRef.current) return;
    initializedRef.current = true;
    try {
      const adsWindow = window as typeof window & { adsbygoogle?: unknown[] };
      (adsWindow.adsbygoogle ||= []).push({});
    } catch {
      initializedRef.current = false;
    }
  }, [consented, enabled, slotId]);

  useEffect(() => {
    const element = adRef.current;
    if (!element) return;
    const observer = new MutationObserver(() => {
      setUnfilled(element.dataset.adStatus === "unfilled");
    });
    observer.observe(element, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => observer.disconnect();
  }, [consented, enabled, slotId]);

  if (!enabled || !consented || !slotId || unfilled) return null;

  return (
    <aside
      className={`news-ad-slot news-ad-slot--${placement}`}
      aria-label="Advertentie"
      data-ad-placement={placement}
    >
      <span className="news-ad-slot__label">Advertentie</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};
