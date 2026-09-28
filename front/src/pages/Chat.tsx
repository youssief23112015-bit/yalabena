import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatLayout } from '../components/chat/ChatLayout';
import { ModeratorDashboard } from '../components/chat/ModeratorDashboard';
import { disconnectChatSocket } from '../lib/chatSocket';

// ─── Auth store integration ───
// ASSUMPTION: the project uses a Zustand auth store at front/src/store/authStore.ts
// (referenced in FIXES.md from the RBAC patch). Adjust the import path and
// getter shape to match the real store if it differs.
//
// If your auth store is NOT Zustand, replace `useAuthStore` below with
// however the app exposes the current user + token (Context, Redux, etc.).
// The critical contract is: { user, accessToken } where user has at least
// { id, first_name, last_name, role }.

interface CurrentUser {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  // Set once POST /chat/consent succeeds and the profile is refetched, or
  // seeded from an existing `chat_consent_accepted_at` column if/when the
  // backend adds one (CHAT-BE-09). Until then, localStorage is the fallback.
  chat_consent_accepted_at?: string | null;
}

// Placeholder — swap for the real store hook.
// Example for Zustand:
//   import { useAuthStore } from '../store/authStore';
//   const { user, accessToken } = useAuthStore();
function useAuthStore(): { user: CurrentUser | null; accessToken: string | null } {
  // Minimal localStorage fallback so this page works standalone.
  // Replace with the real store integration.
  const raw = localStorage.getItem('auth_user');
  const user = raw ? (JSON.parse(raw) as CurrentUser) : null;
  const accessToken = localStorage.getItem('access_token');
  return { user, accessToken };
}

// ─── Role helpers ───

const MODERATOR_ROLES = new Set(['moderator', 'super_admin']);
const TEACHER_ROLES = new Set(['teacher', 'trainer', 'academic_coordinator']);
const STUDENT_ROLES = new Set(['student']);

function isModeratorRole(role: string): boolean {
  return MODERATOR_ROLES.has(role);
}

// ─── Consent persistence ───
// CHAT-BE-09 (POST /chat/consent) is not yet implemented. The backend also
// has no GET endpoint to read consent status, so ChatLayout takes
// `consentAccepted` as a prop. Until the backend ships:
//   - We seed from user.chat_consent_accepted_at if the profile already has it.
//   - We mirror to localStorage so the modal doesn't re-prompt on every mount.
//   - The POST will 404; ChatConsentModal shows the error and lets the user
//     retry. Once the endpoint exists, the flow works end-to-end with no
//     frontend changes.

const CONSENT_KEY = 'chat:consent-accepted';

function readConsent(user: CurrentUser | null): boolean {
  if (user?.chat_consent_accepted_at) return true;
  return localStorage.getItem(CONSENT_KEY) === '1';
}

// ─── API base ───

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

// ─── Page component ───

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();

  const [consentAccepted, setConsentAccepted] = useState<boolean>(() => readConsent(user));
  const [activeView, setActiveView] = useState<'chat' | 'moderation'>('chat');

  // Redirect unauthenticated users to login.
  useEffect(() => {
    if (!user || !accessToken) {
      navigate('/login', { replace: true });
    }
  }, [user, accessToken, navigate]);

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

  const handleConsentAccepted = useCallback(() => {
    // Mirror to localStorage so a refresh doesn't re-prompt while the
    // backend endpoint is still being built (CHAT-BE-09).
    localStorage.setItem(CONSENT_KEY, '1');
    setConsentAccepted(true);
  }, []);

  // Show a minimal loading state while auth resolves.
  if (!user || !accessToken) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  const moderator = isModeratorRole(user.role);

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
            consentAccepted={consentAccepted}
            onConsentAccepted={handleConsentAccepted}
          />
        )}
      </div>
    </div>
  );
}