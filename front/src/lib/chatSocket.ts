import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/chat';

// ASSUMPTION: token storage. FIXES.md (from the RBAC patch) references
// front/src/store/authStore.ts as the existing auth source of truth. If
// that store is a Zustand store, `authStore.getState().accessToken` works
// outside React components; adjust the import/getter below to match its
// real shape. Falling back to localStorage so this file is still usable
// standing alone.
function getAccessToken(): string | null {
  try {
    // Preferred: pull from the app's real auth store if it exposes a
    // non-hook getter (e.g. a Zustand vanilla store).
    // import { authStore } from '../store/authStore';
    // return authStore.getState().accessToken ?? null;
    return localStorage.getItem('access_token');
  } catch {
    return null;
  }
}

const CHAT_NAMESPACE = (import.meta as any).env?.VITE_CHAT_WS_URL || '/chat';

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;

/**
 * Returns the singleton chat socket, creating it on first call. The token
 * is re-read on every (re)connect attempt via the `auth` callback form, so
 * a refreshed JWT is picked up automatically without recreating the socket.
 */
export function getChatSocket(): ChatSocket {
  if (socket) return socket;

  socket = io(CHAT_NAMESPACE, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    transports: ['websocket', 'polling'],
    auth: (cb) => cb({ token: getAccessToken() }),
  });

  socket.on('connect_error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('[chat] connection error:', err.message);
  });

  return socket;
}

/** Connects the shared socket if it isn't already connected. Safe to call repeatedly. */
export function connectChatSocket(): ChatSocket {
  const s = getChatSocket();
  if (!s.connected) s.connect();
  return s;
}

/** Disconnects the shared socket (e.g. on logout). */
export function disconnectChatSocket(): void {
  socket?.disconnect();
}
