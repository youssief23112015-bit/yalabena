import { X, GraduationCap, VolumeX, Ban } from 'lucide-react';
import type { ChatRoomMember } from '../../types/chat';

export interface MembersPanelProps {
  members: ChatRoomMember[];
  onlineIds: Set<string>;
  currentUserId: string;
  /** 'group' rooms label plain members as "Student" (peers in the same section). */
  roomType?: 'one_on_one' | 'group' | 'announcement';
  onClose: () => void;
}

function initials(first?: string, last?: string) {
  return `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?';
}

function roleBadge(role: ChatRoomMember['role'], roomType?: MembersPanelProps['roomType']) {
  if (role === 'teacher' || role === 'admin') {
    return { label: 'Teacher', className: 'bg-amber-100 text-amber-700' };
  }
  if (role === 'moderator') {
    return { label: 'Mod', className: 'bg-purple-100 text-purple-700' };
  }
  if (roomType === 'group') {
    return { label: 'Student', className: 'bg-sky-100 text-sky-700' };
  }
  return { label: 'Member', className: 'bg-slate-100 text-slate-600' };
}

/**
 * Right-hand panel listing everyone in the active conversation. In group/section
 * rooms this shows the full roster: the teacher sees every student of the
 * section, and students see all of their peers in the same group.
 */
export function MembersPanel({ members, onlineIds, currentUserId, roomType, onClose }: MembersPanelProps) {
  // Teachers/moderators first, then alphabetical by first name.
  const rank: Record<ChatRoomMember['role'], number> = { admin: 0, teacher: 0, moderator: 1, member: 2 };
  const sorted = [...members].sort((a, b) => {
    const r = (rank[a.role] ?? 3) - (rank[b.role] ?? 3);
    if (r !== 0) return r;
    return (a.user?.first_name ?? '').localeCompare(b.user?.first_name ?? '');
  });

  return (
    <aside className="w-60 shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Members ({members.length})
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          aria-label="Close members panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <ul className="space-y-0.5 pb-3">
        {sorted.map((m) => {
          const u = m.user;
          const badge = roleBadge(m.role, roomType);
          const online = onlineIds.has(m.user_id);
          const isMe = m.user_id === currentUserId;
          return (
            <li
              key={m.id}
              className={`flex items-center gap-2 px-3 py-1.5 ${isMe ? 'bg-indigo-50' : ''}`}
              title={m.is_banned ? 'Banned from this conversation' : m.is_muted ? 'Muted' : undefined}
            >
              <span
                className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  m.role === 'teacher' || m.role === 'admin'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {initials(u?.first_name, u?.last_name)}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${
                    online ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-800">
                  {u ? `${u.first_name} ${u.last_name}`.trim() : 'Unknown user'}
                  {isMe && <span className="ml-1 font-normal text-slate-400">(you)</span>}
                </p>
                <span className={`mt-0.5 inline-block rounded px-1 py-px text-[10px] font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </div>

              {(m.role === 'teacher' || m.role === 'admin') && (
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              )}
              {m.is_muted && <VolumeX className="h-3.5 w-3.5 shrink-0 text-rose-400" />}
              {m.is_banned && <Ban className="h-3.5 w-3.5 shrink-0 text-rose-600" />}
            </li>
          );
        })}
        {members.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-slate-400">No members yet.</li>
        )}
      </ul>
    </aside>
  );
}