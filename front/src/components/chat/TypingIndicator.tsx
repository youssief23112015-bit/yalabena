export interface TypingUser {
  id: string;
  name: string;
}

export function TypingIndicator({ users }: { users: TypingUser[] }) {
  if (users.length === 0) return <div className="h-5" aria-hidden />;

  const label =
    users.length === 1
      ? `${users[0].name} is typing`
      : users.length === 2
        ? `${users[0].name} and ${users[1].name} are typing`
        : `${users.length} people are typing`;

  return (
    <div className="flex h-5 items-center gap-1.5 px-3 text-xs text-slate-400">
      <span className="flex items-center gap-0.5">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </span>
      <span>{label}…</span>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
      style={{ animationDelay: delay, animationDuration: '900ms' }}
    />
  );
}

/** Small colored dot for a room-list entry or avatar, indicating online/offline. */
export function PresenceDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
        online ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
      aria-label={online ? 'Online' : 'Offline'}
    />
  );
}
