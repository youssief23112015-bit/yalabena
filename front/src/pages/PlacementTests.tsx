import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPlacementTests, type PlacementTestListItem } from '@/services/placement.api';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function formatStatus(status: string): string {
  return status === '' ? '—' : status.replace(/_/g, ' ');
}

export default function PlacementTestsPage() {
  const [tests, setTests] = useState<PlacementTestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    listPlacementTests()
      .then((result) => {
        if (!active) return;
        setTests(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load placement tests.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Placement Tests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start the written test for a scheduled candidate. Each test can be submitted once
          per attempt.
        </p>
      </header>

      {loading && (
        <div role="status" className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
          Loading placement tests...
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-3 rounded-lg bg-destructive px-4 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && tests.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No placement tests have been scheduled yet.
        </div>
      )}

      {!loading && !error && tests.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Examiner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Written</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{test.personName}</div>
                    {test.phone && (
                      <div className="text-xs text-muted-foreground">{test.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(test.scheduledAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{test.examinerName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                      {formatStatus(test.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {test.writtenScore !== null
                      ? `${test.writtenScore} / ${test.writtenMax}`
                      : 'Not taken'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {test.writtenScore !== null ? (
                      <span className="text-xs text-muted-foreground">Submitted</span>
                    ) : (
                      <Link
                        to={`/placement-test?testId=${encodeURIComponent(test.id)}`}
                        className="inline-block rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Start written test
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}