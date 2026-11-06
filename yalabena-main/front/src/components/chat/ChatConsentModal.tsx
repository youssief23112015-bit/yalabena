import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export interface ChatConsentModalProps {
  open: boolean;
  consentEndpoint: string;
  authHeader: () => Record<string, string>;
  onAccepted: () => void;
}

/**
 * SRS §6.6: "Display chat policy notice on first login: chats are
 * monitored, contact-info exchange prohibited. Consent checkbox required
 * before chat [access]." This is intentionally non-dismissable (no
 * backdrop-click-to-close, no Escape handler) — it's a compliance gate,
 * not a dismissible tip.
 */
export function ChatConsentModal({ open, consentEndpoint, authHeader, onAccepted }: ChatConsentModalProps) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleAccept = async () => {
    if (!checked || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(consentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record consent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-consent-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-2 text-amber-600">
          <ShieldAlert className="h-5 w-5" />
          <h2 id="chat-consent-title" className="text-base font-semibold text-slate-900">
            Before you start chatting
          </h2>
        </div>

        <ul className="mb-4 space-y-2 text-sm text-slate-600">
          <li>All chats are monitored for compliance with academy policy.</li>
          <li>Sharing phone numbers, emails, or links to external messaging apps is not allowed.</li>
          <li>Blocked attempts are logged, and repeat attempts may result in a chat suspension.</li>
        </ul>

        <label className="mb-4 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          I understand and agree to these terms.
        </label>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleAccept}
          disabled={!checked || submitting}
          className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          {submitting ? 'Saving…' : 'Continue to chat'}
        </button>
      </div>
    </div>
  );
}
