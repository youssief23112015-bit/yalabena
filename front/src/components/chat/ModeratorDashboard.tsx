import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertOctagon, Ban, MessageSquareWarning, VolumeX, Radio } from 'lucide-react';
import { connectChatSocket } from '../../lib/chatSocket';
import { apiFetch } from '../../lib/apiFetch';
import type { ChatViolation, ChatViolationPushEvent, ModerationAction } from '../../types/chat';

export interface ModeratorDashboardProps {
  apiBase: string; // e.g. '/api'
  authHeader: () => Record<string, string>;
  pollIntervalMs?: number;
}

/**
 * DATA SOURCES
 * - Push: listens for `chat_violations` on the chat socket (CHAT-BE-02).
 *   The backend does NOT emit this event yet, and the gateway has no
 *   handler that puts moderators into a `moderators` room. Until that
 *   ships, the push path is inert.
 * - Pull: polls GET /chat/violations so the dashboard works today. Once
 *   CHAT-BE-02 lands, a push event triggers an immediate refetch instead
 *   of waiting for the next poll.
 *
 * STRIKE COUNTER
 * GET /chat/strikes only returns the *current* user's strikes, so it can't
 * supply per-offender counts. The counter shown here is derived from the
 * loaded violations (non-false-positive, per sender) and is a lower bound
 * limited to the loaded page. A dedicated endpoint would make it exact.
 */
export function ModeratorDashboard({ apiBase, authHeader, pollIntervalMs = 15000 }: ModeratorDashboardProps) {
  const [violations, setViolations] = useState<ChatViolation[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const body = await apiFetch<{ data: ChatViolation[] }>(`${apiBase}/chat/violations?limit=50`, {
        headers: authHeader(),
      });
      setViolations(body.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load violations');
    }
  }, [apiBase, authHeader]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), pollIntervalMs);
    return () => clearInterval(timer);
  }, [load, pollIntervalMs]);

  useEffect(() => {
    const socket = connectChatSocket();
    const onViolation = (_event: ChatViolationPushEvent) => {
      setLive(true);
      void load();
    };
    socket.on('chat_violations', onViolation);
    return () => {
      socket.off('chat_violations', onViolation);
    };
  }, [load]);

  const strikeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of violations) {
      if (v.is_false_positive) continue;
      counts.set(v.sender_id, (counts.get(v.sender_id) ?? 0) + 1);
    }
    return counts;
  }, [violations]);

  const moderate = async (v: ChatViolation, action: ModerationAction, durationMinutes?: number) => {
    const key = `${v.id}:${action}:${durationMinutes ?? ''}`;
    setBusyKey(key);
    try {
      const res = await fetch(`${apiBase}/chat/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          room_id: v.room_id,
          user_id: v.sender_id,
          action,
          duration_minutes: durationMinutes,
          reason: action === 'ban' ? `Moderator action on violation ${v.id}` : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Action failed (${res.status})`);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyKey(null);
    }
  };

  const resolve = async (v: ChatViolation, isFalsePositive: boolean) => {
    try {
      const res = await fetch(`${apiBase}/chat/violations/${v.id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ is_false_positive: isFalsePositive, note: isFalsePositive ? 'Marked false positive' : 'Reviewed' }),
      });
      if (!res.ok) throw new Error(`Resolve failed (${res.status})`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resolve failed');
    }
  };

  return (
    <section className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-900">Chat violations</h2>
        <span className={`flex items-center gap-1 text-xs ${live ? 'text-emerald-600' : 'text-slate-400'}`}>
          <Radio className="h-3.5 w-3.5" />
          {live ? 'Live' : 'Refreshing every few seconds'}
        </span>
      </header>

      {error && <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
        {violations.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-slate-400">No violations recorded.</li>
        )}
        {violations.map((v) => {
          const strikes = strikeCounts.get(v.sender_id) ?? 0;
          const senderName = v.sender ? `${v.sender.first_name} ${v.sender.last_name}` : v.sender_id;
          return (
            <li key={v.id} className={`px-4 py-3 ${v.resolved_at ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                    <AlertOctagon className="h-4 w-4 text-amber-500" />
                    {senderName}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-600">
                      {v.rule_matched}
                    </span>
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-normal text-red-700">
                      {strikes} strike{strikes === 1 ? '' : 's'}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {v.room?.name ?? v.room_id} · {new Date(v.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 break-words rounded bg-slate-50 px-2 py-1 text-sm text-slate-700">
                    {v.original_message}
                  </p>
                </div>
              </div>

              {!v.resolved_at && (
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <ActionButton icon={<MessageSquareWarning className="h-3.5 w-3.5" />} onClick={() => moderate(v, 'warn')} busy={busyKey === `${v.id}:warn:`}>
                    Warn
                  </ActionButton>
                  <ActionButton icon={<VolumeX className="h-3.5 w-3.5" />} onClick={() => moderate(v, 'mute', 60)} busy={busyKey === `${v.id}:mute:60`}>
                    Mute 1h
                  </ActionButton>
                  <ActionButton icon={<VolumeX className="h-3.5 w-3.5" />} onClick={() => moderate(v, 'mute', 1440)} busy={busyKey === `${v.id}:mute:1440`}>
                    Mute 24h
                  </ActionButton>
                  <ActionButton icon={<Ban className="h-3.5 w-3.5" />} danger onClick={() => moderate(v, 'ban')} busy={busyKey === `${v.id}:ban:`}>
                    Ban
                  </ActionButton>
                  <span className="mx-1 self-center text-slate-300">|</span>
                  <ActionButton onClick={() => resolve(v, true)}>False positive</ActionButton>
                  <ActionButton onClick={() => resolve(v, false)}>Mark reviewed</ActionButton>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ActionButton({
  children,
  icon,
  onClick,
  busy,
  danger,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50 ${
        danger
          ? 'border-red-200 text-red-700 hover:bg-red-50'
          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
