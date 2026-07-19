import { FC, useEffect } from "react";

const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7584438343948866";

interface AdSenseLoaderProps {
  disabled: boolean;
}

export const AdSenseLoader: FC<AdSenseLoaderProps> = ({ disabled }) => {
  useEffect(() => {
    const consentKey = "fainl_cookie_consent";
    const hasAdvertisingConsent = () => {
      try {
        const saved = localStorage.getItem(consentKey);
        if (!saved) return false;
        const parsed = JSON.parse(saved) as { decided?: boolean; advertising?: boolean };
        return parsed.decided === true && parsed.advertising === true;
      } catch {
        return false;
      }
    };

    const syncScript = () => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${ADSENSE_SRC}"]`
      );

      if (disabled || !hasAdvertisingConsent()) {
        existingScript?.remove();
        return;
      }

      if (existingScript) return;
      const script = document.createElement("script");
      script.async = true;
      script.src = ADSENSE_SRC;
      script.crossOrigin = "anonymous";
      script.dataset.fainlAdsense = "true";
      document.head.appendChild(script);
    };

    syncScript();
    window.addEventListener("fainl:cookie-consent", syncScript);
    return () => window.removeEventListener("fainl:cookie-consent", syncScript);
  }, [disabled]);

  return null;
};
