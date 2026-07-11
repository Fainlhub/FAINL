import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  FC,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  credits_remaining: number;
  total_turns_used: number;
  is_lifetime: boolean;
}

interface AuthContextValue {
  authSession: Session | null;
  profile: UserProfile | null;
  fetchProfile: (userId?: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const profileRequests = useRef(new Map<string, Promise<void>>());

  const fetchProfile = useCallback(async (userId?: string) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const existingRequest = profileRequests.current.get(userId);
    if (existingRequest) {
      await existingRequest;
      return;
    }

    const request = (async () => {
      const selectProfile = () =>
        supabase
          .from("user_profiles")
          .select("credits_remaining,total_turns_used,is_lifetime")
          .eq("id", userId)
          .maybeSingle();

      const fallbackProfile: UserProfile = {
        credits_remaining: 0,
        total_turns_used: 0,
        is_lifetime: false,
      };

      const { data, error } = await selectProfile();
      if (error) {
        console.error("Profiel ophalen mislukt:", error);
        return;
      }

      if (data) {
        setProfile(data);
        return;
      }

      const { error: upsertError } = await supabase
        .from("user_profiles")
        .upsert(
          {
            id: userId,
            credits_remaining: 0,
            total_turns_used: 0,
            is_lifetime: false,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );

      if (upsertError) {
        console.error("Profiel aanmaken mislukt:", upsertError);
        return;
      }

      const { data: ensuredProfile, error: ensureError } = await selectProfile();
      if (ensureError) {
        console.error("Aangemaakt profiel ophalen mislukt:", ensureError);
        setProfile(fallbackProfile);
        return;
      }

      setProfile(ensuredProfile ?? fallbackProfile);
    })();

    profileRequests.current.set(userId, request);
    try {
      await request;
    } finally {
      profileRequests.current.delete(userId);
    }
  }, []);

  const applySession = useCallback((session: Session | null) => {
    setAuthSession(session);
    window.setTimeout(() => {
      fetchProfile(session?.user?.id);
    }, 0);
  }, [fetchProfile]);

  const refreshSession = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Supabase sessie ophalen mislukt:", error);
      applySession(null);
      return;
    }

    applySession(session);
  }, [applySession]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    refreshSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });
    window.addEventListener('fainl-auth-updated', refreshSession);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('fainl-auth-updated', refreshSession);
    };
  }, [applySession, refreshSession]);

  return (
    <AuthContext.Provider
      value={{ authSession, profile, fetchProfile, handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
