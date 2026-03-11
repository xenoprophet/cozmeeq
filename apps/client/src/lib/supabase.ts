type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

const AUTH_SESSION_STORAGE_KEY = 'pulse-auth-session';

const initSupabase = (_url?: string, _anonKey?: string) => {
  // no-op: kept for backward compatibility with existing call sites
};

const setSession = async (session: AuthSession) => {
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
};

const getSession = (): AuthSession | null => {
  const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

const getAccessToken = async (): Promise<string | null> => {
  return getSession()?.accessToken ?? null;
};

const signOut = async () => {
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
};

const supabase = {
  auth: {
    setSession: async ({ access_token, refresh_token }: { access_token: string; refresh_token: string; }) =>
      setSession({ accessToken: access_token, refreshToken: refresh_token }),
    signOut: async (_opts?: { scope?: 'local' | 'global' }) => signOut(),
    signInWithOAuth: async () => {
      throw new Error('OAuth login is no longer supported without Supabase.');
    }
  }
};

export { getAccessToken, initSupabase, supabase };
