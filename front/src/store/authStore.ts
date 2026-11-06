import { create } from 'zustand';
import type { User } from '@/types';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user';

/** Legacy keys cleared on logout so no stale credentials linger. */
const LEGACY_KEYS = ['speakup-auth', 'lms_token', 'lms_user', 'tms_user'];

/** Pick only the non-sensitive fields safe to store in frontend state / storage. */
export function sanitizeUser(user: Partial<User> | null): User | null {
  if (!user) return null;
  return {
    id: user.id ?? '',
    email: user.email ?? '',
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    language: user.language ?? '',
    avatar_url: user.avatar_url,
    phone: user.phone,
    status: user.status,
    role: user.role,
    roles: user.roles,
    permissions: user.permissions,
    role_id: user.role_id,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function readFromStorage(storage: Storage) {
  try {
    const rawUser = storage.getItem(USER_KEY);
    return {
      accessToken: storage.getItem(ACCESS_TOKEN_KEY) ?? null,
      refreshToken: storage.getItem(REFRESH_TOKEN_KEY) ?? null,
      user: rawUser ? (JSON.parse(rawUser) as User | null) : null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

/** Hydrate from storage: localStorage ("remember me") wins over sessionStorage. */
function hydrateFromStorage() {
  const local = readFromStorage(localStorage);
  if (local.accessToken || local.user) {
    return { ...local, rememberMe: true, isAuthenticated: !!local.accessToken };
  }
  const session = readFromStorage(sessionStorage);
  return { ...session, rememberMe: false, isAuthenticated: !!session.accessToken };
}

function clearStorageKeys() {
  try {
    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, ...LEGACY_KEYS].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  rememberMe: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  permissions: string[];
  /** Store a validated auth session, persisting to localStorage when rememberMe
   *  is true (extended persistence) or sessionStorage otherwise (cleared on tab/
   *  browser close). The *other* storage is wiped so no stale token survives. */
  setAuth: (
    user: User,
    accessToken: string,
    refreshToken: string,
    rememberMe?: boolean,
  ) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setPermissions: (permissions: string[]) => void;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
  /** Access token resolved from localStorage first, falling back to
   *  sessionStorage — mirrors the client-side request interceptor. */
  getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const hydrated = hydrateFromStorage();

  return {
    ...hydrated,
    isLoading: false,
    isHydrated: true,

    setAuth: (user, accessToken, refreshToken, rememberMe = false) => {
      const safeUser = sanitizeUser(user);
      const storage = rememberMe ? localStorage : sessionStorage;
      const other = rememberMe ? sessionStorage : localStorage;

      try {
        [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY].forEach((key) => {
          other.removeItem(key);
        });
        storage.setItem(ACCESS_TOKEN_KEY, accessToken);
        storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        storage.setItem(USER_KEY, JSON.stringify(safeUser));
      } catch {
        // Storage unavailable — keep in-memory state only.
      }

      set({
        user: safeUser,
        accessToken,
        refreshToken,
        rememberMe,
        isAuthenticated: true,
        isLoading: false,
        permissions: safeUser?.permissions ?? [],
      });
    },

    clearAuth: () => {
      clearStorageKeys();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        rememberMe: false,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
      });
    },

    setLoading: (loading) => set({ isLoading: loading }),
    setPermissions: (permissions) => set({ permissions }),

    hasPermission: (permission) => {
      const { permissions, user } = get();
      const roles = user?.roles ?? (user?.role ? [user.role] : []);

      if (roles.includes('super_admin')) return true;
      if (permissions.includes('*')) return true;
      if (permissions.includes(permission)) return true;

      const [module, action] = permission.split(':');
      if (!module || !action) return false;

      return permissions.includes(`${module}:*`) || permissions.includes('*:*');
    },

    logout: () => {
      clearStorageKeys();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        rememberMe: false,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
      });
    },

    getAccessToken: () => {
      try {
        return (
          localStorage.getItem(ACCESS_TOKEN_KEY) ??
          sessionStorage.getItem(ACCESS_TOKEN_KEY) ??
          get().accessToken
        );
      } catch {
        return get().accessToken;
      }
    },
  };
});
