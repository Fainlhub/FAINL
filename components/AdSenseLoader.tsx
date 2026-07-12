import { FC, useEffect } from "react";

const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7584438343948866";

interface AdSenseLoaderProps {
  disabled: boolean;
}

export const AdSenseLoader: FC<AdSenseLoaderProps> = ({ disabled }) => {
  useEffect(() => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${ADSENSE_SRC}"]`
    );

    if (disabled) {
      existingScript?.remove();
      return;
    }

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = ADSENSE_SRC;
    script.crossOrigin = "anonymous";
    script.dataset.fainlAdsense = "true";
    document.head.appendChild(script);
  }, [disabled]);

  return null;
};
