const AUTH_CALLBACK_PATH = '/auth/callback';
const DEFAULT_POST_AUTH_PATH = '/dashboard';
const CANONICAL_HOSTS = new Set(['fainl.com', 'www.fainl.com']);

const configuredSiteOrigin = () => {
  const configuredUrl =
    import.meta.env.VITE_SITE_URL ||
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    import.meta.env.VITE_APP_URL;

  if (!configuredUrl) return null;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    console.error('Configured site URL is invalid:', configuredUrl);
    return null;
  }
};

export const normalizePostAuthPath = (
  value: string | null | undefined,
  fallback = DEFAULT_POST_AUTH_PATH,
) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
};

export const getSiteOrigin = () => {
  const configuredOrigin = configuredSiteOrigin();
  if (configuredOrigin) return configuredOrigin;

  if (typeof window === 'undefined') return 'https://fainl.com';

  if (CANONICAL_HOSTS.has(window.location.hostname)) {
    return 'https://fainl.com';
  }

  return window.location.origin;
};

export const getAuthRedirectUrl = (nextPath = DEFAULT_POST_AUTH_PATH) => {
  const callbackUrl = new URL(AUTH_CALLBACK_PATH, getSiteOrigin());
  callbackUrl.searchParams.set('next', normalizePostAuthPath(nextPath));
  return callbackUrl.toString();
};

export const getPostAuthDestination = (searchParams: URLSearchParams) => {
  return normalizePostAuthPath(searchParams.get('next'));
};
