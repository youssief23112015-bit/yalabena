import { User } from '../../../shared/entities/user.entity';

/**
 * Public projection of a User for every chat payload (REST + WebSocket).
 *
 * The chat module joins `sender` / `members.user` relations from the shared
 * `users` table. Serializing those rows raw leaked `password_hash`,
 * `two_factor_secret`, `phone`, `last_login_ip`, … to every participant of a
 * conversation (and to the moderator dashboard). This whitelist is therefore
 * a security control, not cosmetic trimming: anything not listed here never
 * leaves the chat module. Add new *safe* display fields here deliberately —
 * never remove the whitelist approach in favour of deleting known-bad keys.
 */
export type ChatPublicUser = Pick<
  User,
  'id' | 'email' | 'first_name' | 'last_name' | 'avatar_url' | 'language' | 'status'
>;

export function toPublicUser(user?: User | null): ChatPublicUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url ?? null,
    language: user.language,
    status: user.status,
  };
}

/** Strips a message's `sender` (and nested `reply_to.sender`) in place-safe fashion. */
export function sanitizeMessage<T extends { sender?: User | null; reply_to?: T | null }>(
  message: T | null | undefined,
): T | null | undefined {
  if (!message) return message;
  if (message.sender) {
    (message as { sender?: User | null }).sender = toPublicUser(message.sender) as unknown as User;
  }
  if (message.reply_to) sanitizeMessage(message.reply_to);
  return message;
}

/** Strips every `member.user` of a room in place and returns the room. */
export function sanitizeRoomMembers<T extends { members?: Array<{ user?: User | null }> }>(
  room: T | null | undefined,
): T | null | undefined {
  if (!room?.members) return room;
  for (const member of room.members) {
    if (member.user) {
      (member as { user?: User | null }).user = toPublicUser(member.user) as unknown as User;
    }
  }
  return room;
}
