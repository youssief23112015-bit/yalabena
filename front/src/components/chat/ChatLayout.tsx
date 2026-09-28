import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { connectChatSocket } from '../../lib/chatSocket';
import type { ChatMessage, ChatRoom, ChatRoomMember, SendMessagePayload } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator, PresenceDot, type TypingUser } from './TypingIndicator';
import { ChatConsentModal } from './ChatConsentModal';
import { RoomActions } from './RoomActions';
import { ChatToastProvider, useChatToast } from '../../hooks/useChatToast';

export interface ChatLayoutProps {
  apiBase: string; // e.g. '/api'
  currentUserId: string;
  isModerator: boolean;
  authHeader: () => Record<string, string>;
  /**
   * Whether the user has already consented. There is no "get consent status"
   * endpoint in the current backend (CHAT-BE-09 — POST /chat/consent — is not
   * part of this delivery), so the caller decides; pass the value from the
   * user profile once `chat_consent_accepted_at` exists.
   */
  consentAccepted: boolean;
  onConsentAccepted: () => void;
}

export function ChatLayout(props: ChatLayoutProps) {
  return (
    <ChatToastProvider>
      <ChatLayoutInner {...props} />
    </ChatToastProvider>
  );
}

function ChatLayoutInner({
  apiBase,
  currentUserId,
  isModerator,
  authHeader,
  consentAccepted,
  onConsentAccepted,
}: ChatLayoutProps) {
  const { pushViolationToast, pushToast } = useChatToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [members, setMembers] = useState<ChatRoomMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState<Record<string, TypingUser>>({});
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeRoomId = activeRoom?.id;

  const getJson = useCallback(
    async <T,>(path: string): Promise<T> => {
      const res = await fetch(`${apiBase}${path}`, { headers: authHeader() });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json() as Promise<T>;
    },
    [apiBase, authHeader],
  );

  // Rooms
  useEffect(() => {
    if (!consentAccepted) return;
    getJson<ChatRoom[]>('/chat/rooms').then(setRooms).catch(() => pushToast({ kind: 'error', message: 'Could not load conversations.' }));
  }, [consentAccepted, getJson, pushToast]);

  // Active room: history + members + socket join
  useEffect(() => {
    if (!activeRoomId || !consentAccepted) return;
    const socket = connectChatSocket();
    setMessages([]);
    setTyping({});

    getJson<ChatRoom>(`/chat/rooms/${activeRoomId}`).then((r) => setMembers(r.members ?? [])).catch(() => undefined);
    getJson<{ data: ChatMessage[] }>(`/chat/rooms/${activeRoomId}/messages`)
      .then((r) => setMessages(r.data))
      .catch(() => pushToast({ kind: 'error', message: 'Could not load messages.' }));

    socket.emit('join_room', { room_id: activeRoomId });

    const onNew = (m: ChatMessage) => {
      if (m.room_id !== activeRoomId) return;
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      if (m.sender_id !== currentUserId) socket.emit('mark_read', { room_id: activeRoomId });
    };
    const onTyping = (e: { user_id: string; is_typing: boolean }) => {
      if (e.user_id === currentUserId) return;
      setTyping((prev) => {
        const next = { ...prev };
        if (e.is_typing) {
          const member = members.find((mm) => mm.user_id === e.user_id);
          next[e.user_id] = { id: e.user_id, name: member?.user ? member.user.first_name : 'Someone' };
        } else delete next[e.user_id];
        return next;
      });
    };
    // Presence is approximated from join/leave events in the current room;
    // the gateway has no dedicated presence broadcast yet.
    const onJoined = (e: { user_id: string }) => setOnlineIds((s) => new Set(s).add(e.user_id));
    const onLeft = (e: { user_id: string }) =>
      setOnlineIds((s) => {
        const n = new Set(s);
        n.delete(e.user_id);
        return n;
      });

    socket.on('new_message', onNew);
    socket.on('typing', onTyping);
    socket.on('user_joined', onJoined);
    socket.on('user_left', onLeft);
    socket.emit('mark_read', { room_id: activeRoomId });

    return () => {
      socket.off('new_message', onNew);
      socket.off('typing', onTyping);
      socket.off('user_joined', onJoined);
      socket.off('user_left', onLeft);
      socket.emit('leave_room', { room_id: activeRoomId });
    };
    // members intentionally excluded: only used for display names in typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, consentAccepted, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (payload: Omit<SendMessagePayload, 'room_id'>) => {
    if (!activeRoomId) return;
    connectChatSocket().emit('send_message', { ...payload, room_id: activeRoomId }, (ack) => {
      if (ack?.error) {
        if (ack.rule) pushViolationToast(ack.rule);
        else pushToast({ kind: 'error', message: ack.error });
      }
    });
  };

  const editMessage = async (id: string, body: string) => {
    const res = await fetch(`${apiBase}/chat/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      pushToast({ kind: 'error', message: 'Could not edit message (edit window may have expired).' });
      return;
    }
    const updated = (await res.json()) as ChatMessage;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  };

  const deleteMessage = async (id: string) => {
    const res = await fetch(`${apiBase}/chat/messages/${id}/delete`, { method: 'PUT', headers: authHeader() });
    if (!res.ok) {
      pushToast({ kind: 'error', message: 'Could not delete message.' });
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m)));
  };

  // Read receipt: double-check turns blue when every OTHER member has read past this message.
  const isReadByAll = useCallback(
    (m: ChatMessage) => {
      const others = members.filter((mm) => mm.user_id !== m.sender_id);
      return (
        others.length > 0 &&
        others.every((mm) => mm.last_read_at && new Date(mm.last_read_at) >= new Date(m.created_at))
      );
    },
    [members],
  );

  const me = useMemo(() => members.find((m) => m.user_id === currentUserId), [members, currentUserId]);
  const muteActive = !!me?.is_muted && (!me.muted_until || new Date(me.muted_until) > new Date());
  const banned = !!me?.is_banned;
  const disabled = muteActive || banned;
  const disabledReason = banned
    ? 'You have been removed from this conversation.'
    : muteActive
      ? 'You are temporarily muted in this conversation.'
      : undefined;

  return (
    <div className="flex h-full min-h-[32rem] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <ChatConsentModal
        open={!consentAccepted}
        consentEndpoint={`${apiBase}/chat/consent`}
        authHeader={authHeader}
        onAccepted={onConsentAccepted}
      />

      <aside className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50">
        <h2 className="px-4 py-3 text-sm font-semibold text-slate-700">Conversations</h2>
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => setActiveRoom(room)}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-100 ${
                  room.id === activeRoomId ? 'bg-white font-medium text-indigo-700' : 'text-slate-700'
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">{room.name}</span>
              </button>
            </li>
          ))}
          {rooms.length === 0 && <li className="px-4 py-6 text-sm text-slate-400">No conversations yet.</li>}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {!activeRoom ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            Select a conversation to start chatting.
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{activeRoom.name}</h3>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <PresenceDot online={onlineIds.size > 0} />
                  {onlineIds.size > 0 ? `${onlineIds.size} online` : 'No one else online'}
                </span>
              </div>
              <RoomActions
                roomId={activeRoom.id}
                roomName={activeRoom.name}
                exportUrl={`${apiBase}/chat/rooms/${activeRoom.id}/export`}
                authHeader={authHeader}
                canExport={isModerator}
              />
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isOwn={m.sender_id === currentUserId}
                  isReadByAll={isReadByAll(m)}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            <TypingIndicator users={Object.values(typing)} />
            <MessageComposer
              disabled={disabled}
              disabledReason={disabledReason}
              uploadUrl={`${apiBase}/chat/upload`}
              authHeader={authHeader}
              onSend={handleSend}
              onTyping={(isTyping) =>
                connectChatSocket().emit('typing', { room_id: activeRoom.id, is_typing: isTyping })
              }
            />
          </>
        )}
      </section>
    </div>
  );
}
