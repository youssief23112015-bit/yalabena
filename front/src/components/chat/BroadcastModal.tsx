import { useEffect, useMemo, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { apiFetch } from '../../lib/apiFetch';
import { useChatToast } from '../../hooks/useChatToast';
import type { BroadcastResult, ChatGroupOption } from '../../types/chat';

export interface BroadcastModalProps {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  authHeader: () => Record<string, string>;
  /** Called after a successful broadcast so the caller can refresh rooms/messages. */
  onSent?: (result: BroadcastResult) => void;
}

/**
 * Teacher/staff "broadcast to everyone at once" dialog: pick any subset of the
 * groups/sections you teach (or all of them) and send a single message that is
 * delivered to every member of each selected section's chat room.
 */
export function BroadcastModal({ open, onClose, apiBase, authHeader, onSent }: BroadcastModalProps) {
  const { pushToast } = useChatToast();
  const [groups, setGroups] = useState<ChatGroupOption[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load my groups each time the dialog opens (member counts stay fresh).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setGroups(null);
    setLoadError(null);
    setSelected(new Set());
    setBody('');
    apiFetch<ChatGroupOption[]>(`${apiBase}/chat/my-groups`, { headers: authHeader() })
      .then((rows) => {
        if (cancelled) return;
        const broadcastable = rows.filter((r) => r.my_role !== 'student');
        setGroups(broadcastable);
        // Preselect every group the caller teaches — one click to reach all.
        setSelected(new Set(broadcastable.map((r) => r.id)));
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load your groups.');
      });
    return () => {
      cancelled = true;
    };
  }, [open, apiBase, authHeader]);

  const memberTotal = useMemo(
    () => groups?.filter((g) => selected.has(g.id)).reduce((sum, g) => sum + g.member_count, 0) ?? 0,
    [groups, selected],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!groups) return;
    setSelected((prev) => (prev.size === groups.length ? new Set() : new Set(groups.map((g) => g.id))));
  };

  const handleSend = async () => {
    if (!body.trim() || selected.size === 0 || sending) return;
    setSending(true);
    try {
      const result = await apiFetch<BroadcastResult>(`${apiBase}/chat/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ group_ids: [...selected], body: body.trim() }),
      });
      pushToast({
        kind: 'info',
        message: `Announcement sent to ${result.sent} group${result.sent === 1 ? '' : 's'} (${memberTotal} member${memberTotal === 1 ? '' : 's'}).`,
      });
      onSent?.(result);
      onClose();
    } catch (err: any) {
      pushToast({ kind: 'error', message: err?.message || 'Broadcast failed. Nothing was sent.' });
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Megaphone className="h-4 w-4 text-indigo-600" />
            Broadcast to groups
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-3 px-4 py-3">
          {loadError && <p className="text-xs text-rose-600">{loadError}</p>}

          {groups === null && !loadError && (
            <p className="text-sm text-slate-400">Loading your groups…</p>
          )}

          {groups !== null && groups.length === 0 && (
            <p className="text-sm text-slate-500">
              You don&apos;t teach any groups yet. Broadcast is available to teachers and staff.
            </p>
          )}

          {groups !== null && groups.length > 0 && (
            <>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={selected.size === groups.length}
                  onChange={toggleAll}
                  className="rounded border-slate-300"
                />
                Select all ({groups.length})
              </label>

              <ul className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {groups.map((g) => (
                  <li key={g.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selected.has(g.id)}
                        onChange={() => toggle(g.id)}
                        className="rounded border-slate-300"
                      />
                      <span className="min-w-0 flex-1 truncate text-slate-800">{g.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {g.member_count} member{g.member_count === 1 ? '' : 's'}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="Message every member of the selected groups…"
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />

              <p className="text-xs text-slate-400">
                Sending to {selected.size} group{selected.size === 1 ? '' : 's'} · {memberTotal} member
                {memberTotal === 1 ? '' : 's'} total
              </p>
            </>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !body.trim() || selected.size === 0}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Megaphone className="h-3.5 w-3.5" />
            {sending ? 'Sending…' : 'Send broadcast'}
          </button>
        </footer>
      </div>
    </div>
  );
}