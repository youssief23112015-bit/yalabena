// Mirrors the backend enums in src/common/enums/{violation-action,strike-action}.enum.ts
// Keep these in sync manually unless/until the DTOs are shared via a workspace package.

export type ViolationAction = 'BLOCKED' | 'WARNED';
export type StrikeActionType = 'WARNING' | 'MUTE_24H' | 'BAN_PERMANENT';
export type ChatMessageType = 'text' | 'image' | 'file' | 'emoji';
export type ModerationAction = 'mute' | 'unmute' | 'ban' | 'unban' | 'warn';

export interface ChatUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
}

export interface ChatRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'teacher' | 'member';
  is_muted: boolean;
  muted_until: string | null;
  is_banned: boolean;
  banned_until: string | null;
  ban_reason: string | null;
  last_read_at: string | null;
  user?: ChatUser;
}

export interface ChatRoom {
  id: string;
  name: string;
  created_by: string;
  members?: ChatRoomMember[];
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender?: ChatUser;
  type: ChatMessageType;
  body: string;
  file_url?: string | null;
  file_name?: string | null;
  created_at: string;
  edited_at?: string | null;
  edited_count: number;
  deleted_at?: string | null;
}

export interface ChatViolation {
  id: string;
  message_id: string | null;
  room_id: string;
  sender_id: string;
  sender?: ChatUser;
  room?: ChatRoom;
  rule_matched: string;
  original_message: string;
  action_taken: ViolationAction;
  detection_method: string;
  is_false_positive: boolean;
  resolved_at: string | null;
  moderator_id: string | null;
  moderator_note: string | null;
  created_at: string;
}

export interface ChatStrike {
  id: string;
  user_id: string;
  violation_id: string;
  strike_number: number;
  action: StrikeActionType;
  expires_at: string | null;
  is_active: boolean;
  violation?: ChatViolation;
}

// ─── Socket.IO event contracts ───

export interface SendMessagePayload {
  room_id: string;
  body?: string;
  type?: ChatMessageType;
  file_url?: string;
  file_name?: string;
  reply_to_id?: string;
}

export interface ViolationBlockedResponse {
  error: string;
  rule: string;
}

export interface SendMessageAck {
  success?: true;
  message?: ChatMessage;
  error?: string;
  rule?: string;
}

export interface TypingPayload {
  room_id: string;
  is_typing: boolean;
}

export interface TypingEvent {
  user_id: string;
  is_typing: boolean;
}

export interface PresenceEvent {
  user_id: string;
  room_id: string;
}

/** Payload for the live moderator feed (CHAT-BE-02 — not yet emitted by the
 * backend as of this delivery; see ModeratorDashboard.tsx for how the UI
 * degrades gracefully until that gap is closed). */
export interface ChatViolationPushEvent {
  messageId: string | null;
  senderId: string;
  roomId: string;
  violationType: string;
  snippet: string;
  severity: ViolationAction;
  timestamp: string;
}

export interface ServerToClientEvents {
  new_message: (message: ChatMessage) => void;
  user_joined: (event: PresenceEvent) => void;
  user_left: (event: PresenceEvent) => void;
  typing: (event: TypingEvent) => void;
  chat_violations: (event: ChatViolationPushEvent) => void;
}

export interface ClientToServerEvents {
  join_room: (payload: { room_id: string }, ack?: (res: { success?: true; error?: string }) => void) => void;
  leave_room: (payload: { room_id: string }, ack?: (res: { success?: true; error?: string }) => void) => void;
  send_message: (payload: SendMessagePayload, ack?: (res: SendMessageAck) => void) => void;
  typing: (payload: TypingPayload) => void;
  mark_read: (payload: { room_id: string }, ack?: (res: { success?: true; error?: string }) => void) => void;
}
