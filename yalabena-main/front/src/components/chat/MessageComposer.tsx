import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, Smile, X } from 'lucide-react';
import { unwrapApiResponse } from '../../lib/apiFetch';

// Small, dependency-free emoji set. Swap for a full picker library later if
// the product wants one — kept minimal here since none was listed as an
// available dependency for this project.
const QUICK_EMOJI = ['😀', '😂', '👍', '🙏', '🎉', '❤️', '👏', '📚', '✅', '❓'];

const TYPING_DEBOUNCE_MS = 350;
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB — matches "file (with size limit)" in SRS §4.7.1

export interface PendingAttachment {
  file: File;
  previewUrl?: string;
}

export interface MessageComposerProps {
  disabled?: boolean;
  disabledReason?: string;
  uploadUrl: string;
  authHeader: () => Record<string, string>;
  onSend: (payload: { body?: string; file_url?: string; file_name?: string; type?: 'text' | 'image' | 'file' }) => void;
  onTyping: (isTyping: boolean) => void;
}

export function MessageComposer({
  disabled,
  disabledReason,
  uploadUrl,
  authHeader,
  onSend,
  onTyping,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasTyping = useRef(false);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (wasTyping.current) onTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);
    if (!wasTyping.current) {
      wasTyping.current = true;
      onTyping(true);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      wasTyping.current = false;
      onTyping(false);
    }, TYPING_DEBOUNCE_MS);
  };

  const pickFile = () => fileInputRef.current?.click();

  const onFileSelected = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setUploadError('File is too large (max 15MB).');
      return;
    }
    setUploadError(null);
    setPending({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    });
  };

  const clearPending = () => {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadPending = async (): Promise<{ url: string; name: string; isImage: boolean } | null> => {
    if (!pending) return null;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('file', pending.file);
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: authHeader(),
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // HttpExceptionFilter returns { message }; keep .error as a fallback.
        throw new Error(body?.message || body?.error || `Upload failed (${res.status})`);
      }
      // Every REST response is wrapped as { success, data: {...} } by the
      // global TransformInterceptor — unwrap before reading `url`, otherwise
      // attachments were always sent with file_url: undefined.
      const data = unwrapApiResponse<{ url?: string }>(await res.json());
      if (!data?.url) throw new Error('Upload failed: no URL returned by the server');
      return { url: data.url, name: pending.file.name, isImage: pending.file.type.startsWith('image/') };
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (disabled || uploading) return;
    const trimmed = text.trim();
    if (!trimmed && !pending) return;

    if (pending) {
      const uploaded = await uploadPending();
      if (!uploaded) return; // error already shown; keep the draft in place
      onSend({ file_url: uploaded.url, file_name: uploaded.name, type: uploaded.isImage ? 'image' : 'file' });
      clearPending();
    }

    if (trimmed) {
      onSend({ body: trimmed, type: 'text' });
    }

    setText('');
    wasTyping.current = false;
    onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      {disabled && disabledReason && (
        <div className="mb-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-800">{disabledReason}</div>
      )}

      {pending && (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs">
          {pending.previewUrl ? (
            <img src={pending.previewUrl} alt="Attachment preview" className="h-10 w-10 rounded object-cover" />
          ) : (
            <Paperclip className="h-4 w-4 text-slate-500" />
          )}
          <span className="flex-1 truncate text-slate-700">{pending.file.name}</span>
          <button type="button" onClick={clearPending} className="rounded p-0.5 hover:bg-slate-200" aria-label="Remove attachment">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {uploadError && <p className="mb-2 text-xs text-red-600">{uploadError}</p>}

      <div className="flex items-end gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            disabled={disabled}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            aria-label="Insert emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
          {showEmoji && (
            <div className="absolute bottom-full left-0 mb-2 grid grid-cols-5 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              {QUICK_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    handleTextChange(text + emoji);
                    setShowEmoji(false);
                  }}
                  className="rounded p-1 text-lg hover:bg-slate-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={pickFile}
          disabled={disabled || uploading}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => onFileSelected(e.target.files?.[0])}
        />

        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'You cannot send messages right now' : 'Type a message…'}
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-400 disabled:bg-slate-50"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || uploading || (!text.trim() && !pending)}
          className="rounded-full bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
