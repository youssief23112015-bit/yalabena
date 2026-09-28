import { useEffect, useState } from 'react';
import { Bell, BellOff, Download, Loader2 } from 'lucide-react';

export interface RoomActionsProps {
  roomId: string;
  roomName: string;
  exportUrl: string; // e.g. `${API_BASE}/chat/rooms/${roomId}/export`
  authHeader: () => Record<string, string>;
  /** True if the current user is a moderator/admin — export is a moderator tool per SRS §6.5. */
  canExport: boolean;
}

/**
 * The "mute" here is a PERSONAL NOTIFICATION preference ("stop pinging me
 * about this conversation"), which is distinct from the moderation
 * `ChatRoomMember.is_muted` flag the backend uses to block a sanctioned
 * user from sending messages. Conflating the two would let a user "mute"
 * their way out of a moderation sanction's UI state, so this is stored as
 * a local, per-user, per-room preference (localStorage) rather than piggy-
 * backing on the same backend field. If you want this to sync across
 * devices, it needs its own column (e.g. `notifications_muted`) on
 * ChatRoomMember or a separate user-preferences table — not `is_muted`.
 */
function notificationMuteKey(roomId: string) {
  return `chat:notif-mute:${roomId}`;
}

export function RoomActions({ roomId, roomName, exportUrl, authHeader, canExport }: RoomActionsProps) {
  const [muted, setMuted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMuted(localStorage.getItem(notificationMuteKey(roomId)) === '1');
  }, [roomId]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(notificationMuteKey(roomId), next ? '1' : '0');
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    setExportError(null);
    setMenuOpen(false);
    try {
      const res = await fetch(`${exportUrl}?format=${format}`, { headers: authHeader() });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-audit-${roomName.replace(/\s+/g, '-').toLowerCase()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggleMute}
        className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label={muted ? 'Unmute notifications for this conversation' : 'Mute notifications for this conversation'}
        title={muted ? 'Notifications muted' : 'Mute notifications'}
      >
        {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      </button>

      {canExport && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={exporting}
            className="flex items-center gap-1 rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Export audit log"
            title="Export audit log"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white text-sm shadow-md">
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="px-3 py-1.5 text-left hover:bg-slate-50"
              >
                Export as CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="px-3 py-1.5 text-left hover:bg-slate-50"
              >
                Export as PDF
              </button>
            </div>
          )}
        </div>
      )}
      {exportError && <span className="text-xs text-red-600">{exportError}</span>}
    </div>
  );
}
