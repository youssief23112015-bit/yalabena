import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import WrittenTestPlayer from '../components/placement/WrittenTestPlayer';
import { fetchPublicPlacementTest } from '@/api/public';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

/**
 * Polished completion screen (Business Rule 3): score/level up front and a
 * clear next step — register now or expect a sales call within 24 hours.
 */
function ResultCard({ summary }: { summary: WrittenSummary }) {
  return (
    <section
      aria-live="polite"
      className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-950">
        🎉
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Your Placement Test is complete!
      </h2>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Score</dt>
          <dd className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {summary.maxScore > 0 ? `${summary.score} / ${summary.maxScore}` : summary.score}
          </dd>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Percentage</dt>
          <dd className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {summary.percentage !== null ? `${summary.percentage}%` : '—'}
          </dd>
        </div>

        <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/50">
          <dt className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
            Recommended Level
          </dt>
          <dd className="mt-1 text-3xl font-extrabold text-indigo-700 dark:text-indigo-200">
            {summary.level ?? '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-6 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
        <p className="font-semibold">
          {summary.level
            ? `Based on your result, we recommend starting at level ${summary.level}.`
            : 'Your level will be confirmed by our academic team.'}
        </p>
        <p className="mt-1">
          A member of our team will call you within 24 hours to help you get
          started — or register now to secure your seat.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/register-online">Register Now</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </section>
  );
}

export function PlacementTestPage({ testId: testIdProp }: PlacementTestPageProps) {
  const testId = resolveTestId(testIdProp);
  const [summary, setSummary] = useState<WrittenSummary | null>(null);
  const handleSubmitted = useCallback((s: WrittenSummary) => setSummary(s), []);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Guests: validate the testId capability link up-front and short-circuit
  // straight to the completion screen when the session is already graded
  // (e.g. reloading the page after submitting).
  const sessionQ = useQuery({
    queryKey: ["guest-placement-test", testId],
    queryFn: () => fetchPublicPlacementTest(testId as string),
    enabled: Boolean(testId) && !isAuthenticated,
    retry: false,
  });

  const storedResult = sessionQ.data?.result;
  const guestCompleted =
    !isAuthenticated && sessionQ.data?.completed === true && Boolean(storedResult);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Placement Test — Written</h1>
        {!summary && !guestCompleted && (
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
      ) : !isAuthenticated && sessionQ.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64" />
        </div>
      ) : !isAuthenticated && sessionQ.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900"
        >
          <p className="font-semibold">This test link is not valid or has expired.</p>
          <p className="mt-1 text-sm">
            Please contact us or book a new free placement test to get a fresh link.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/placement-booking">Book a Placement Test</Link>
          </Button>
        </div>
      ) : guestCompleted && storedResult ? (
        <ResultCard
          summary={{
            score: storedResult.score,
            maxScore: storedResult.maxScore,
            percentage: storedResult.percentage,
            level: storedResult.level ?? null,
          }}
        />
      ) : (
        <WrittenTestPlayer testId={testId} onSubmitted={handleSubmitted} />
      )}
    </main>
  );
}

export default PlacementTestPage;