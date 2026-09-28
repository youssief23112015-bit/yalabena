import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, X, Info } from 'lucide-react';

export interface ChatToastItem {
  id: string;
  kind: 'violation' | 'info' | 'error';
  message: string;
}

interface ChatToastContextValue {
  toasts: ChatToastItem[];
  pushToast: (toast: Omit<ChatToastItem, 'id'>) => void;
  pushViolationToast: (rule?: string) => void;
  dismissToast: (id: string) => void;
}

const ChatToastContext = createContext<ChatToastContextValue | null>(null);

const VIOLATION_MESSAGE = 'Contact info sharing and external links are prohibited.';
const AUTO_DISMISS_MS = 5000;

export function ChatToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ChatToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ChatToastItem, 'id'>) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...toast, id }]);
      timers.current[id] = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast],
  );

  const pushViolationToast = useCallback(
    (_rule?: string) => {
      // The rule name is intentionally not surfaced to the sender — showing
      // which specific pattern tripped would help someone iterate their way
      // around detection (SRS §6.4 only specifies the generic warning text).
      pushToast({ kind: 'violation', message: VIOLATION_MESSAGE });
    },
    [pushToast],
  );

  return (
    <ChatToastContext.Provider value={{ toasts, pushToast, pushViolationToast, dismissToast }}>
      {children}
      <ChatToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ChatToastContext.Provider>
  );
}

export function useChatToast(): ChatToastContextValue {
  const ctx = useContext(ChatToastContext);
  if (!ctx) throw new Error('useChatToast must be used within a ChatToastProvider');
  return ctx;
}

function ChatToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ChatToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur-sm ${
            toast.kind === 'violation'
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : toast.kind === 'error'
                ? 'border-red-300 bg-red-50 text-red-900'
                : 'border-slate-200 bg-white text-slate-800'
          }`}
        >
          {toast.kind === 'violation' || toast.kind === 'error' ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p className="flex-1 text-sm leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 rounded p-0.5 text-current/60 hover:bg-black/5"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
