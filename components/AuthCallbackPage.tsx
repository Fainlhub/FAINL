import { FC, useEffect, useRef, useState } from 'react';
import { Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPostAuthDestination, getPostAuthDestinationLabel } from '../services/authRedirect';
import { supabase } from '../services/supabaseClient';

const getCallbackParams = () => {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  if (hash) {
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }

  return params;
};

const waitForSession = async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    if (session) return session;

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return null;
};

export const AuthCallbackPage: FC = () => {
  const navigate = useNavigate();
  const [routeSearchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const finishSignInRef = useRef<Promise<string> | null>(null);
  const destinationPath = getPostAuthDestination(getCallbackParams());
  const destinationLabel = getPostAuthDestinationLabel(destinationPath);

  useEffect(() => {
    let isActive = true;

    const finishSignIn = async () => {
      const searchParams = getCallbackParams();
      const providerError =
        searchParams.get('error_description') ||
        searchParams.get('error_code') ||
        searchParams.get('error');

      if (providerError) {
        throw new Error(providerError);
      }

      const destination = getPostAuthDestination(searchParams);
      const {
        data: { session: existingSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (existingSession) {
        window.dispatchEvent(new CustomEvent('fainl-auth-updated'));
        return destination;
      }

      const authCode = searchParams.get('code');
      if (!authCode) {
        throw new Error('No auth code was returned by Supabase.');
      }

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
      if (exchangeError) throw exchangeError;

      const session = data.session ?? (await waitForSession());

      if (!session) {
        throw new Error('No auth session was returned by Supabase.');
      }

      window.dispatchEvent(new CustomEvent('fainl-auth-updated'));
      return destination;
    };

    if (!finishSignInRef.current) {
      finishSignInRef.current = finishSignIn();
    }

    finishSignInRef.current.then((destination) => {
      if (isActive) {
        navigate(destination, { replace: true });
      }
    }).catch((err: unknown) => {
      if (!isActive) return;
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setError(message);
    });

    return () => {
      isActive = false;
    };
  }, [navigate, routeSearchParams]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md border-4 border-black dark:border-[var(--ink)] bg-white dark:bg-black p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center bg-black text-white dark:bg-[var(--ink)] dark:text-black">
          {error ? <TriangleAlert className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
        </div>
        <h1 className="mb-4 text-3xl font-black uppercase tracking-tight text-black dark:text-white">
          {error ? 'Inloggen mislukt' : 'FAINL opent je account'}
        </h1>
        <p className="mx-auto mb-6 max-w-xs text-base font-black uppercase leading-relaxed tracking-widest text-black/50 dark:text-white/50">
          {error || `Je wordt doorgestuurd naar ${destinationLabel}.`}
        </p>
        {error ? (
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="bg-black px-6 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--ink)] hover:text-black dark:bg-[var(--ink)] dark:text-black dark:hover:bg-white"
          >
            Terug naar inloggen
          </button>
        ) : (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-black dark:text-[var(--ink)]" />
        )}
      </div>
    </div>
  );
};
