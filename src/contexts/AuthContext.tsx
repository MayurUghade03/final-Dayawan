import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Database, UserProfile, UserRole } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  isAdmin: boolean;
  role: UserRole;
  profile: UserProfile | null;
  isSuspended: boolean;
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
  const [role, setRole] = useState<UserRole>("citizen");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const activeSignInRequestRef = useRef<Promise<AuthError | null> | null>(null);
  const activeSignInCredentialsRef = useRef<{ email: string; password: string } | null>(null);
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const lastSessionTokenRef = useRef<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);
  const lastStatusRef = useRef<AuthStatus>("loading");
  const renderCountRef = useRef(0);

  const logDev = useCallback((message: string, meta?: Record<string, unknown>) => {
    if (!import.meta.env.DEV) return;
    if (meta) {
      console.debug(`[auth] ${message}`, meta);
      return;
    }
    console.debug(`[auth] ${message}`);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    renderCountRef.current += 1;
    if (renderCountRef.current > 1) {
      console.debug("[auth] AuthProvider re-render", {
        count: renderCountRef.current,
        status,
        userId: user?.id ?? null,
      });
    }
  });

  const applySessionState = useCallback(
    (newSession: Session | null, source: string) => {
      const nextToken = newSession?.access_token ?? null;
      const nextUser = newSession?.user ?? null;
      const nextUserId = nextUser?.id ?? null;
      const nextStatus: AuthStatus = newSession ? "authenticated" : "unauthenticated";

      const unchanged =
        lastSessionTokenRef.current === nextToken && lastUserIdRef.current === nextUserId;
      const canSkipStateWrite = unchanged && lastStatusRef.current === nextStatus && nextUserId !== null;
      if (canSkipStateWrite) {
        logDev("Skipping duplicate auth state update", { source, status: nextStatus, userId: nextUserId });
        return;
      }

      lastSessionTokenRef.current = nextToken;
      lastUserIdRef.current = nextUserId;
      lastStatusRef.current = nextStatus;
      setSession(newSession);
      setUser(nextUser);
      setIsAdmin(computeAdminFlag(nextUser));
      setStatus(nextStatus);
      if (!nextUser) {
        setProfile(null);
        setRole("citizen");
        setIsSuspended(false);
      }
      logDev("Auth state updated", { source, status: nextStatus, userId: nextUserId });
    },
    [logDev],
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // No backend — skip loading, stay unauthenticated.
      lastSessionTokenRef.current = null;
      lastUserIdRef.current = null;
      lastStatusRef.current = "unauthenticated";
      setStatus("unauthenticated");
      setIsAdmin(false);
      setRole("citizen");
      setProfile(null);
      setIsSuspended(false);
      return;
    }

    let mounted = true;

    const hydrateSession = async () => {
      logDev("Fetching initial session via getSession");
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error("Failed to get auth session:", error);
        applySessionState(null, "getSession:error");
        return;
      }

      applySessionState(data.session, "getSession");
    };

    void hydrateSession();

    authSubscriptionRef.current?.unsubscribe();
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "TOKEN_REFRESHED") {
        logDev("Session refresh event observed", { event });
      } else {
        logDev("Auth state change event observed", { event });
      }
      applySessionState(newSession, `onAuthStateChange:${event}`);
    });
    authSubscriptionRef.current = listener.subscription;

    return () => {
      mounted = false;
      authSubscriptionRef.current?.unsubscribe();
      authSubscriptionRef.current = null;
    };
  }, [applySessionState, logDev]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setProfile(null);
      setRole(computeAdminFlag(user) ? "admin" : "citizen");
      setIsAdmin(computeAdminFlag(user));
      setIsSuspended(false);
      return;
    }

    let cancelled = false;

    const loadUserProfile = async () => {
      const fallbackRole: UserRole = computeAdminFlag(user) ? "admin" : "citizen";

      const { data: existing, error: selectError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (selectError) {
        console.error("Failed to load user profile:", selectError);
        setProfile(null);
        setRole(fallbackRole);
        setIsAdmin(fallbackRole === "admin");
        setIsSuspended(false);
        return;
      }

      let profileRow = existing;
      if (!profileRow) {
        const { data: inserted, error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            email: user.email ?? "",
            full_name: String(user.user_metadata?.full_name ?? user.email ?? "User"),
            role: fallbackRole,
            status: "active",
          })
          .select("*")
          .single();

        if (cancelled) return;

        if (insertError) {
          console.error("Failed to create user profile:", insertError);
          setProfile(null);
          setRole(fallbackRole);
          setIsAdmin(fallbackRole === "admin");
          setIsSuspended(false);
          return;
        }

        profileRow = inserted;
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (error) {
        console.error("Failed to load user profile:", error);
        setProfile(null);
        setRole(fallbackRole);
        setIsAdmin(fallbackRole === "admin");
        setIsSuspended(false);
        return;
      }

      const nextProfile = normalizeProfile(data ?? profileRow);
      const nextRole: UserRole = nextProfile?.role ?? fallbackRole;
      const suspended = nextProfile?.status === "suspended";

      setProfile(nextProfile);
      setRole(nextRole);
      setIsAdmin(nextRole === "admin");
      setIsSuspended(suspended);
    };

    void loadUserProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ─── signIn ───────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthError | null> => {
      if (!isSupabaseConfigured || !supabase) return notConfiguredError();
      if (activeSignInRequestRef.current) {
        const inFlight = activeSignInCredentialsRef.current;
        if (inFlight && (inFlight.email !== email || inFlight.password !== password)) {
          logDev("Rejected new sign-in request because another credential attempt is in progress");
          return authRequestInProgressError();
        }
        logDev("Ignoring duplicate sign-in request while one is in progress");
        return activeSignInRequestRef.current;
      }

      logDev("signInWithPassword request started");
      activeSignInCredentialsRef.current = { email, password };
      const request = (async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        logDev("signInWithPassword request finished", {
          status: error?.status ?? 200,
          hasError: Boolean(error),
        });
        return error;
      })();

      activeSignInRequestRef.current = request;
      try {
        return await request;
      } finally {
        activeSignInRequestRef.current = null;
        activeSignInCredentialsRef.current = null;
      }
    },
    [logDev],
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
      value={{
        user,
        session,
        status,
        isAdmin,
        role,
        profile,
        isSuspended,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
      }}
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

function authRequestInProgressError(): AuthError {
  return {
    name: "AuthError",
    message: "AUTH_REQUEST_IN_PROGRESS",
    status: 409,
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

function normalizeProfile(row: Database["public"]["Tables"]["user_profiles"]["Row"]): UserProfile {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone ?? undefined,
    role: row.role,
    status: row.status,
    suspended_at: row.suspended_at ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
