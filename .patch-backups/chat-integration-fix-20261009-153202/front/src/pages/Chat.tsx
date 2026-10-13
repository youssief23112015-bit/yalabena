import { useCallback, useEffect, useState } from 'react';
import { ChatLayout } from '../components/chat/ChatLayout';
import { ModeratorDashboard } from '../components/chat/ModeratorDashboard';
import { disconnectChatSocket } from '../lib/chatSocket';
import { useAuthStore } from '../store/authStore';

// ─── API base ───

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

// ─── Role helpers ───

const MODERATOR_ROLES = new Set(['moderator', 'super_admin']);

function isModeratorRole(roles?: string[], role?: string): boolean {
  if (roles?.includes('super_admin')) return true;
  if (role && MODERATOR_ROLES.has(role)) return true;
  return roles?.some((r) => MODERATOR_ROLES.has(r)) ?? false;
}

// ─── Page component ───

export default function ChatPage() {
  const { user, accessToken, isAuthenticated, isHydrated } = useAuthStore();

  const [activeView, setActiveView] = useState<'chat' | 'moderation'>('chat');

  // Disconnect socket on unmount to avoid ghost presence.
  useEffect(() => {
    return () => {
      disconnectChatSocket();
    };
  }, []);

  const authHeader = useCallback((): Record<string, string> => {
    if (!accessToken) return {};
    return { Authorization: `Bearer ${accessToken}` };
  }, [accessToken]);

  // Wait for Zustand persist to rehydrate before deciding auth state.
  if (!isHydrated) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  // Don't render chat UI if not authenticated.
  if (!isAuthenticated || !user || !accessToken) {
    return null;
  }

  const moderator = isModeratorRole(user.roles, user.role);

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl flex-col px-4 py-4">
      {/* View switcher: moderators see both their own chats and the dashboard */}
      {moderator && (
        <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm w-fit">
          <button
            type="button"
            onClick={() => setActiveView('chat')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              activeView === 'chat'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My chats
          </button>
          <button
            type="button"
            onClick={() => setActiveView('moderation')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              activeView === 'moderation'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Moderation
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="min-h-0 flex-1">
        {moderator && activeView === 'moderation' ? (
          <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white">
            <ModeratorDashboard apiBase={API_BASE} authHeader={authHeader} />
          </div>
        ) : (
          <ChatLayout
            apiBase={API_BASE}
            currentUserId={user.id}
            isModerator={moderator}
            authHeader={authHeader}
          />
        )}
      </div>
    </div>
  );
}