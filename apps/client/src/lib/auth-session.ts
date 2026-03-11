type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

const AUTH_SESSION_STORAGE_KEY = 'pulse-auth-session';

const setAuthSession = async (session: AuthSession) => {
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
};

const getAuthSession = (): AuthSession | null => {
  const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

const getAccessToken = async (): Promise<string | null> => {
  return getAuthSession()?.accessToken ?? null;
};

const clearAuthSession = async () => {
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
};

export { clearAuthSession, getAccessToken, setAuthSession };
