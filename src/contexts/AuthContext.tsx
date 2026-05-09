import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  isAdmin: boolean;
  /** True when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are present. */
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthError | null>;
  signUp: (email: string, password: string, name: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthCtx | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // No backend — skip loading, stay unauthenticated.
      setStatus("unauthenticated");
      setIsAdmin(false);
      return;
    }

    // Hydrate from stored session.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsAdmin(computeAdminFlag(data.session?.user ?? null));
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    // Listen for auth changes (login, logout, token refresh).
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsAdmin(computeAdminFlag(newSession?.user ?? null));
      setStatus(newSession ? "authenticated" : "unauthenticated");
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ─── signIn ───────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthError | null> => {
      if (!isSupabaseConfigured || !supabase) return notConfiguredError();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error;
    },
    [],
  );

  // ─── signUp ───────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string, name: string): Promise<AuthError | null> => {
      if (!isSupabaseConfigured || !supabase) return notConfiguredError();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      return error;
    },
    [],
  );

  // ─── signOut ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, status, isAdmin, isConfigured: isSupabaseConfigured, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a synthetic AuthError-shaped object when Supabase is not configured.
 * This keeps call-sites consistent — they always check `if (error) { ... }`.
 */
function notConfiguredError(): AuthError {
  return {
    name: "AuthError",
    message: "AUTH_NOT_CONFIGURED",
    status: 503,
  } as AuthError;
}

function computeAdminFlag(user: User | null): boolean {
  if (!user) return false;

  const userRole = typeof user.user_metadata?.role === "string" ? user.user_metadata.role : "";
  const appRole = typeof user.app_metadata?.role === "string" ? user.app_metadata.role : "";
  if (userRole.toLowerCase() === "admin" || appRole.toLowerCase() === "admin") return true;

  const rawAdminEmails = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
  if (!rawAdminEmails || !user.email) return false;
  const adminEmails = rawAdminEmails
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(user.email.toLowerCase());
}
