import { useState } from 'react';
import { Check, CheckCheck, Download, Pencil, Trash2, MoreVertical } from 'lucide-react';
import type { ChatMessage } from '../../types/chat';

const EDIT_WINDOW_MS = 5 * 60 * 1000;

export interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  /** true once every other room member's last_read_at >= this message's created_at */
  isReadByAll: boolean;
  onEdit?: (messageId: string, newBody: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, isOwn, isReadByAll, onEdit, onDelete }: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);

  const isDeleted = !!message.deleted_at;
  const isEdited = message.edited_count > 0;
  const withinEditWindow = Date.now() - new Date(message.created_at).getTime() < EDIT_WINDOW_MS;
  const canModify = isOwn && !isDeleted;

  const submitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.body) onEdit?.(message.id, trimmed);
    setEditing(false);
  };

  return (
    <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[75%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && message.sender && (
          <span className="mb-0.5 px-1 text-xs font-medium text-slate-500">
            {message.sender.first_name} {message.sender.last_name}
          </span>
        )}

        <div className="relative flex items-end gap-1">
          {canModify && !isDeleted && !editing && (
            <div className="order-first hidden self-center group-hover:block">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Message actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute bottom-full mb-1 flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white text-sm shadow-md">
                  {withinEditWindow && message.type === 'text' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onDelete?.(message.id);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-left text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            className={`rounded-2xl px-3 py-2 text-sm ${
              isDeleted
                ? 'border border-dashed border-slate-300 bg-slate-50 italic text-slate-400'
                : isOwn
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-900'
            }`}
          >
            {isDeleted ? (
              <span>[deleted]</span>
            ) : editing ? (
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-w-[16rem] resize-none rounded border border-white/30 bg-white/10 p-1.5 text-sm outline-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button type="button" onClick={() => setEditing(false)} className="opacity-80 hover:opacity-100">
                    Cancel
                  </button>
                  <button type="button" onClick={submitEdit} className="font-medium opacity-80 hover:opacity-100">
                    Save
                  </button>
                </div>
              </div>
            ) : message.type === 'image' && message.file_url ? (
              <a href={message.file_url} target="_blank" rel="noreferrer">
                <img
                  src={message.file_url}
                  alt={message.file_name || 'Shared image'}
                  className="max-h-64 max-w-full rounded-lg object-cover"
                />
              </a>
            ) : message.type === 'file' && message.file_url ? (
              <a
                href={message.file_url}
                download={message.file_name || undefined}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                  isOwn ? 'border-white/30' : 'border-slate-300'
                }`}
              >
                <Download className="h-4 w-4 shrink-0" />
                <span className="truncate">{message.file_name || 'Download attachment'}</span>
              </a>
            ) : (
              <span className="whitespace-pre-wrap break-words">{message.body}</span>
            )}
          </div>
        </div>

        <div className="mt-0.5 flex items-center gap-1 px-1 text-[11px] text-slate-400">
          <time dateTime={message.created_at}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
          {isEdited && !isDeleted && <span>· edited</span>}
          {isOwn && !isDeleted && (
            <span className="ml-0.5" aria-label={isReadByAll ? 'Read' : 'Sent'}>
              {isReadByAll ? (
                <CheckCheck className="h-3.5 w-3.5 text-indigo-500" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
