import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/chat';

type TokenProvider = () => string | null;

// ✅ FIXED: Read from the actual Zustand persist store with localStorage fallback
let tokenProvider: TokenProvider = () => {
  try {
    // Preferred: pull from the app's real auth store
    return useAuthStore.getState().accessToken ?? null;
  } catch {
    // Fallback: try the nested persist structure or raw keys
    try {
      const raw = localStorage.getItem('speakup-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.accessToken) return parsed.state.accessToken;
      }
    } catch {
      // ignore
    }
    try {
      return localStorage.getItem('access_token');
    } catch {
      return null;
    }
  }
};

export function setChatAuthTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

function resolveChatNamespaceUrl(): string {
  const env = (import.meta as any).env ?? {};
  if (env.VITE_CHAT_WS_URL) return env.VITE_CHAT_WS_URL;

  if (env.VITE_API_URL) {
    try {
      const origin = new URL(env.VITE_API_URL).origin; // e.g. http://localhost:3000
      return `${origin}/chat`;
    } catch {
      // Fall through
    }
  }

  return '/chat';
}

const CHAT_NAMESPACE = resolveChatNamespaceUrl();

// eslint-disable-next-line no-console
console.info('[chat] socket namespace resolved to:', CHAT_NAMESPACE);

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;

export function getChatSocket(): ChatSocket {
  if (socket) return socket;

  socket = io(CHAT_NAMESPACE, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    // ابدأ بـ polling لتجاوز مشاكل الـ Handshake ثم تحول إلى websocket تلقائياً
    transports: ['polling', 'websocket'],
    auth: (cb) => {
      const token = tokenProvider();
      cb({ token });
    },
  });

  socket.on('connect_error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('[chat] connection error:', err.message);
  });

  return socket;
}

export function connectChatSocket(): ChatSocket {
  const s = getChatSocket();
  if (!s.connected) s.connect();
  return s;
}

export function reconnectChatSocket(): ChatSocket {
  const s = getChatSocket();
  if (s.connected) s.disconnect();
  s.connect();
  return s;
}

export function disconnectChatSocket(): void {
  socket?.disconnect();
}