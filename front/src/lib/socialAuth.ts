/**
 * Shared social (OAuth 2.0) authentication helpers used by LoginPage and
 * RegisterPage.
 *
 * Security model (best practice for SPAs delegating to a backend Passport
 * strategy):
 * - The browser is redirected to the backend authorization endpoint
 *   (`${BACKEND_URL}/auth/google` or `${BACKEND_URL}/auth/facebook`), where a
 *   server-side Passport OAuth 2.0 strategy performs the actual provider
 *   handshake. Client secrets never touch the frontend.
 * - A cryptographically random `state` parameter is generated client-side,
 *   persisted in `sessionStorage`, and appended to the authorization URL.
 *   The backend is expected to echo it back on the `/auth/callback`
 *   redirect; `consumeOAuthState()` then validates it (CSRF / login-CSRF
 *   protection) and clears it so it cannot be replayed.
 */

export type SocialProvider = 'google' | 'facebook';

const OAUTH_STATE_KEY = 'speakup_oauth_state';
const OAUTH_PROVIDER_KEY = 'speakup_oauth_provider';

/**
 * Resolve the backend base URL using the same environment priority as
 * `@/api/client` so the OAuth endpoints line up with the REST endpoints
 * (e.g. `http://localhost:3000/api/v1/auth/google`).
 */
export function getBackendBaseUrl(): string {
  const raw =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3000/api/v1';
  return raw.replace(/\/+$/, '');
}

/** Generate an unguessable CSRF `state` value (256 bits of entropy). */
function generateState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Begin the social login flow: persist the CSRF `state` (and the provider,
 * for the callback page) in sessionStorage, then redirect the current tab to
 * the backend OAuth authorization endpoint.
 */
export function beginSocialAuth(provider: SocialProvider): void {
  const state = generateState();
  try {
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
    sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider);
  } catch {
    // Storage unavailable (e.g. private mode quota): proceed without client
    // state; the backend Passport strategy still enforces its own CSRF
    // protections server-side.
  }
  window.location.href = `${getBackendBaseUrl()}/auth/${provider}?state=${encodeURIComponent(state)}`;
}

/**
 * Validate and consume the `state` parameter returned on the OAuth callback
 * redirect. Returns the provider that initiated the flow, or `null` when the
 * state is missing or does not match (possible CSRF / login-CSRF attack).
 *
 * The stored state is always cleared, even on mismatch, so a single-use
 * state can never be replayed.
 */
export function consumeOAuthState(returnedState: string | null): SocialProvider | null {
  let storedState: string | null = null;
  let provider: string | null = null;
  try {
    storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    provider = sessionStorage.getItem(OAUTH_PROVIDER_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_PROVIDER_KEY);
  } catch {
    return null;
  }
  if (!storedState || !returnedState || storedState !== returnedState) return null;
  return provider === 'facebook' ? 'facebook' : 'google';
}