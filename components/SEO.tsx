import { FC } from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType?: string;
  jsonLd?: object;
  noIndex?: boolean;
}

const SITE_URL = "https://www.fainl.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/fainl-logo.png`;

export const SEO: FC<SEOProps> = ({
  title,
  description,
  canonical,
  keywords,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = "FAINL AI Consensus Engine",
  ogImageWidth,
  ogImageHeight,
  ogType = "website",
  jsonLd,
  noIndex = false,
}) => {
  const fullTitle = title.includes("FAINL") ? title : `${title} | FAINL`;
  const canonicalUrl = `${SITE_URL}${canonical || ""}`;

  return (
    <Helmet>
      {/* ── Basis ───────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large"} />
      {canonical && <link rel="canonical" href={canonicalUrl} />}

      {/* ── Open Graph ──────────────────────────── */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="FAINL" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      {ogImageWidth && <meta property="og:image:width" content={String(ogImageWidth)} />}
      {ogImageHeight && <meta property="og:image:height" content={String(ogImageHeight)} />}
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:locale" content="nl_NL" />

      {/* ── Twitter Card ────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || fullTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={ogImage} />

      {/* ── JSON-LD Structured Data ─────────────── */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Helmet>
  );
};
