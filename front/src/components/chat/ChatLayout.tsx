import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { connectChatSocket } from '../../lib/chatSocket';
import { apiFetch } from '../../lib/apiFetch';
import type { ChatMessage, ChatRoom, ChatRoomMember, SendMessagePayload } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator, PresenceDot, type TypingUser } from './TypingIndicator';
import { ChatConsentModal } from './ChatConsentModal';
import { RoomActions } from './RoomActions';
import { ChatToastProvider, useChatToast } from '../../hooks/useChatToast';

export interface ChatLayoutProps {
  apiBase: string;
  currentUserId: string;
  isModerator: boolean;
  authHeader: () => Record<string, string>;
}

export function ChatLayout(props: ChatLayoutProps) {
  return (
    <ChatToastProvider>
      <ChatLayoutInner {...props} />
    </ChatToastProvider>
  );
}

function ChatLayoutInner({ apiBase, currentUserId, isModerator, authHeader }: ChatLayoutProps) {
  const { pushViolationToast, pushToast } = useChatToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [members, setMembers] = useState<ChatRoomMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState<Record<string, TypingUser>>({});
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeRoomId = activeRoom?.id;

  const [consentAccepted, setConsentAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ accepted: boolean }>(`${apiBase}/chat/consent`, { headers: authHeader() })
      .then((body) => {
        if (!cancelled) setConsentAccepted(body.accepted);
      })
      .catch(() => {
        if (!cancelled) setConsentAccepted(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase, authHeader]);

  // Rooms list fetch
  useEffect(() => {
    if (!consentAccepted) return;
    apiFetch<ChatRoom[]>(`${apiBase}/chat/rooms`, { headers: authHeader() })
      .then(setRooms)
      .catch(() => pushToast({ kind: 'error', message: 'Could not load conversations.' }));
  }, [consentAccepted, apiBase, authHeader, pushToast]);

  // Active room: history + members + socket join
  useEffect(() => {
    if (!activeRoomId || !consentAccepted) return;
    
    const socket = connectChatSocket();
    if (!socket.connected) {
      socket.connect();
    }

    setMessages([]);
    setTyping({});
    setOnlineIds(new Set());

    // جلب أعضاء الغرفة والرسائل مرة واحدة فقط
    apiFetch<ChatRoom>(`${apiBase}/chat/rooms/${activeRoomId}`, { headers: authHeader() })
      .then((r) => setMembers(r.members ?? []))
      .catch(() => undefined);
      
    apiFetch<{ data: ChatMessage[] }>(`${apiBase}/chat/rooms/${activeRoomId}/messages`, { headers: authHeader() })
      .then((r) => setMessages(r.data))
      .catch(() => pushToast({ kind: 'error', message: 'Could not load messages.' }));

    // الانضمام للغرفة عبر السوكيت
    socket.emit('join_room', { room_id: activeRoomId });

    const onNew = (m: ChatMessage) => {
      if (m.room_id !== activeRoomId) return;
      
      setMessages((prev) => {
        // Check if this is the real version of an optimistic message
        const tempIndex = prev.findIndex(
          (x) => x.id.startsWith('temp-') && 
                   x.sender_id === m.sender_id && 
                   x.body === m.body &&
                   Math.abs(new Date(x.created_at).getTime() - new Date(m.created_at).getTime()) < 5000
        );
        
        if (tempIndex !== -1) {
          // Replace temp with real message
          const next = [...prev];
          next[tempIndex] = m;
          return next;
        }
        
        // Otherwise just add if not duplicate
        return prev.some((x) => x.id === m.id) ? prev : [...prev, m];
      });
      
      if (m.sender_id !== currentUserId) socket.emit('mark_read', { room_id: activeRoomId });
    };

    const onTyping = (e: { user_id: string; is_typing: boolean }) => {
      if (e.user_id === currentUserId) return;
      setTyping((prev) => {
        const next = { ...prev };
        if (e.is_typing) {
          next[e.user_id] = { id: e.user_id, name: 'Someone' };
        } else delete next[e.user_id];
        return next;
      });
    };

    const onJoined = (e: { user_id: string }) => {
      setOnlineIds((s) => new Set(s).add(e.user_id));
    };

    const onLeft = (e: { user_id: string }) => {
      setOnlineIds((s) => {
        const n = new Set(s);
        n.delete(e.user_id);
        return n;
      });
    };

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
  }, [activeRoomId, consentAccepted, currentUserId, apiBase, authHeader, pushToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (payload: Omit<SendMessagePayload, 'room_id'>) => {
    if (!activeRoomId) return;
    
    const socket = connectChatSocket();
    
    socket.emit('send_message', { ...payload, room_id: activeRoomId }, (ack: any) => {
      if (ack?.error) {
        // Remove the optimistic message on failure
        setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
        if (ack.rule) pushViolationToast(ack.rule);
        else pushToast({ kind: 'error', message: ack.error });
      }
    });

    // Optimistic update with temp ID
    const tempId = 'temp-' + Date.now();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      room_id: activeRoomId,
      sender_id: currentUserId,
      body: payload.body ?? '',
      file_url: payload.file_url,
      file_name: payload.file_name,
      type: payload.type || 'text',
      created_at: new Date().toISOString(),
      edited_count: 0,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
  };

  const editMessage = async (id: string, body: string) => {
    try {
      const updated = await apiFetch<ChatMessage>(`${apiBase}/chat/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ body }),
      });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
    } catch {
      pushToast({ kind: 'error', message: 'Could not edit message (edit window may have expired).' });
    }
  };

  const deleteMessage = async (id: string) => {
    const res = await fetch(`${apiBase}/chat/messages/${id}/delete`, { method: 'PUT', headers: authHeader() });
    if (!res.ok) {
      pushToast({ kind: 'error', message: 'Could not delete message.' });
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m)));
  };

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

  if (consentAccepted === null) return null;

  return (
    <div className="flex h-full min-h-[32rem] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <ChatConsentModal
        open={!consentAccepted}
        consentEndpoint={`${apiBase}/chat/consent`}
        authHeader={authHeader}
        onAccepted={() => setConsentAccepted(true)}
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