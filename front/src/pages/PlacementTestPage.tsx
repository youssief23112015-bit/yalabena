import { useCallback, useState } from 'react';
import WrittenTestPlayer from '../components/placement/WrittenTestPlayer';
import type { WrittenSummary } from '../services/placement.api';

interface PlacementTestPageProps {
  /** Pass from your router; falls back to `?testId=` in the URL. */
  testId?: string;
}

function resolveTestId(prop?: string): string | null {
  if (prop && prop.trim() !== '') return prop.trim();
  const fromQuery = new URLSearchParams(window.location.search).get('testId');
  return fromQuery && fromQuery.trim() !== '' ? fromQuery.trim() : null;
}

function ResultCard({ summary }: { summary: WrittenSummary }) {
  return (
    <section
      aria-live="polite"
      className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
        ✓
      </div>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">Written test submitted</h2>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Score</dt>
          <dd className="mt-1 text-2xl font-bold text-gray-900">
            {summary.maxScore > 0 ? `${summary.score} / ${summary.maxScore}` : summary.score}
          </dd>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Percentage</dt>
          <dd className="mt-1 text-2xl font-bold text-gray-900">
            {summary.percentage !== null ? `${summary.percentage}%` : '—'}
          </dd>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Level</dt>
          <dd className="mt-1 text-2xl font-bold text-indigo-700">{summary.level ?? 'Pending'}</dd>
        </div>
      </dl>

      <p className="mt-6 text-sm text-gray-600">
        {summary.level
          ? 'Your recommended level is shown above. Your oral assessment will follow.'
          : 'Your level will be confirmed after your oral assessment.'}
      </p>
    </section>
  );
}

export function PlacementTestPage({ testId: testIdProp }: PlacementTestPageProps) {
  const testId = resolveTestId(testIdProp);
  const [summary, setSummary] = useState<WrittenSummary | null>(null);
  const handleSubmitted = useCallback((s: WrittenSummary) => setSummary(s), []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Placement Test — Written</h1>
        {!summary && (
          <p className="mt-1 text-sm text-gray-600">
            Answer each question. You can move between questions before submitting.
          </p>
        )}
      </header>

      {!testId ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900"
        >
          No placement test was specified. Open this page from your test invitation link.
        </div>
      ) : summary ? (
        <ResultCard summary={summary} />
      ) : (
        <WrittenTestPlayer testId={testId} onSubmitted={handleSubmitted} />
      )}
    </main>
  );
}

export default PlacementTestPage;