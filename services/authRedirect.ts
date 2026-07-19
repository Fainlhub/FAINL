const AUTH_CALLBACK_PATH = '/auth/callback';
const DEFAULT_POST_AUTH_PATH = '/dashboard';
const CANONICAL_HOSTS = new Set(['fainl.com', 'www.fainl.com']);
const SUPABASE_HOST_SUFFIX = '.supabase.co';
const POST_AUTH_DESTINATION_LABELS: Record<string, string> = {
  '/': 'FAINL chat',
  '/dashboard': 'je FAINL dashboard',
  '/mission': 'je nieuwe FAINL sessie',
  '/tokens': 'credits en abonnementen',
  '/inclusie': 'voucher inwisselen',
};

const configuredSiteOrigin = () => {
  const configuredUrl =
    import.meta.env.VITE_SITE_URL ||
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    import.meta.env.VITE_APP_URL;

  if (!configuredUrl) return null;

  try {
    const origin = new URL(configuredUrl).origin;
    const hostname = new URL(origin).hostname;

    if (hostname.endsWith(SUPABASE_HOST_SUFFIX)) {
      return null;
    }

    return origin;
  } catch {
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
  if (typeof window === 'undefined') return 'https://www.fainl.com';

  if (CANONICAL_HOSTS.has(window.location.hostname)) {
    return window.location.origin;
  }

  const configuredOrigin = configuredSiteOrigin();
  if (configuredOrigin) return configuredOrigin;

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

export const getPostAuthDestinationLabel = (nextPath: string | null | undefined) => {
  const destination = normalizePostAuthPath(nextPath);
  return POST_AUTH_DESTINATION_LABELS[destination] ?? destination;
};
