import { useEffect, useMemo, useState } from 'react';
import {
  getWrittenPaper,
  submitWrittenTest,
  toWrittenSummary,
  type PlacementQuestion,
  type WrittenPaper,
  type WrittenSummary,
} from '../../services/placement.api';

/*
 * Backend requires an explicit level; A1 is the only level seeded with
 * active written questions in the current database.
 */
const PLACEMENT_LEVEL = 'A1';

interface WrittenTestPlayerProps {
  testId: string;
  onSubmitted: (summary: WrittenSummary) => void;
}

type Answers = Record<string, string>;

interface Choice {
  value: string;
  label: string;
}

const TRUE_FALSE_FALLBACK: Choice[] = [
  { value: 'true', label: 'True' },
  { value: 'false', label: 'False' },
];

const TEXT_INPUT_CLASS =
  'w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60';

function toChoice(option: unknown): Choice | null {
  if (typeof option === 'string' || typeof option === 'number') {
    const text = String(option);
    return text.trim() === '' ? null : { value: text, label: text };
  }

  if (typeof option !== 'object' || option === null) return null;

  const o = option as {
    value?: unknown;
    id?: unknown;
    key?: unknown;
    label?: unknown;
    text?: unknown;
  };

  const raw = o.value ?? o.key ?? o.id ?? o.label ?? o.text;
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;

  const value = String(raw);
  return { value, label: String(o.text ?? o.label ?? value) };
}

function getChoices(question: PlacementQuestion): Choice[] {
  const choices = (Array.isArray(question.options) ? question.options : [])
    .map(toChoice)
    .filter((c): c is Choice => c !== null);

  if (choices.length === 0 && question.type === 'true_false') {
    return TRUE_FALSE_FALLBACK;
  }
  return choices;
}

function getQuestionText(question: PlacementQuestion): string {
  return question.question_text || question.prompt || 'Question';
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null) {
    const response = (
      err as { response?: { status?: number; data?: { message?: unknown } } }
    ).response;

    const serverMessage = response?.data?.message;

    if (Array.isArray(serverMessage) && serverMessage.length > 0) {
      return serverMessage.map(String).join(', ');
    }
    if (typeof serverMessage === 'string' && serverMessage !== '') {
      return serverMessage;
    }
    if (response?.status === 409) {
      return 'This test has already been submitted.';
    }

    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && message !== '') return message;
  }
  return fallback;
}

export default function WrittenTestPlayer({ testId, onSubmitted }: WrittenTestPlayerProps) {
  const [paper, setPaper] = useState<WrittenPaper | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /* ------------------------------ Load paper ------------------------------ */
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setPaper(null);
    setConfirming(false);

    getWrittenPaper(testId, PLACEMENT_LEVEL)
      .then((result) => {
        if (!active) return;
        setPaper(result);
        setAnswers({});
        setCurrentIndex(0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error('Failed to load written placement test:', err);
        setError(getErrorMessage(err, 'Failed to load the written placement test.'));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [testId, reloadKey]);

  const questions = useMemo(() => paper?.questions ?? [], [paper]);
  const currentQuestion = questions[currentIndex];

  const isAnswered = (question: PlacementQuestion): boolean =>
    (answers[question.id] ?? '').trim() !== '';

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? '').trim() !== '').length,
    [answers, questions],
  );
  const unansweredCount = questions.length - answeredCount;

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: answer }));
    setConfirming(false);
  };

  const goPrevious = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));

  /* -------------------------------- Submit -------------------------------- */
  const submit = async () => {
    if (!paper || submitting) return;

    setSubmitting(true);
    setConfirming(false);
    setError(null);

    try {
      // Send every question so unanswered ones are scored against the full paper.
      const payload = questions.map((question) => ({
        questionId: question.id,
        answer: answers[question.id] ?? '',
      }));

      const response = await submitWrittenTest(testId, payload);
      onSubmitted(toWrittenSummary(response));
      // Stay in "submitting" on success: the parent swaps this view out, and
      // this prevents a second submit in the meantime.
    } catch (err: unknown) {
      console.error('Failed to submit written placement test:', err);
      setError(getErrorMessage(err, 'Failed to submit the written placement test.'));
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    if (unansweredCount > 0) {
      setConfirming(true);
    } else {
      void submit();
    }
  };

  /* --------------------------------- Views -------------------------------- */
  if (loading) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Loading written placement test...
        </p>
      </section>
    );
  }

  if (error && !paper) {
    return (
      <section
        role="alert"
        className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6"
      >
        <h2 className="font-semibold text-destructive">Unable to load the test</h2>
        <p className="mt-2 text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-4 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!paper || !currentQuestion) {
    return (
      <section
        role="alert"
        className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-800 dark:text-amber-300"
      >
        No questions are available for this written placement test.
      </section>
    );
  }

  const choices = getChoices(currentQuestion);
  const currentAnswer = answers[currentQuestion.id] ?? '';
  const isChoiceQuestion =
    (currentQuestion.type === 'mcq' || currentQuestion.type === 'true_false') &&
    choices.length > 0;
  const isShortText =
    currentQuestion.type === 'fill_blank' || currentQuestion.type === 'short_answer';
  const isManualGraded = currentQuestion.type === 'short_answer';
  const isLast = currentIndex === questions.length - 1;

  return (
    <section className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Written Placement Test</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length} · {answeredCount} answered
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {paper.totalPoints} total point{paper.totalPoints === 1 ? '' : 's'}
          </div>
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={answeredCount}
          aria-label="Questions answered"
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Error (submit failures) */}
      {error && (
        <div
          role="alert"
          className="mx-6 mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Question */}
      <div className="p-6">
        <div className="mb-6">
          <div className="mb-3 text-sm font-medium text-primary">
            Question {currentIndex + 1}
          </div>
          <h3 className="text-xl font-semibold leading-relaxed text-foreground">
            {getQuestionText(currentQuestion)}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentQuestion.points} point{currentQuestion.points === 1 ? '' : 's'}
            {isManualGraded ? ' · graded by your examiner' : ''}
          </p>
        </div>

        {isChoiceQuestion && (
          <div
            role="radiogroup"
            aria-label={`Answers for question ${currentIndex + 1}`}
            className="space-y-3"
          >
            {choices.map((choice, index) => {
              const selected = currentAnswer === choice.value;
              return (
                <label
                  key={`${choice.value}-${index}`}
                  className={[
                    'flex items-center gap-3 rounded-xl border p-4 transition',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted',
                    submitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={choice.value}
                    checked={selected}
                    disabled={submitting}
                    onChange={() => setAnswer(currentQuestion.id, choice.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">{choice.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {!isChoiceQuestion && isShortText && (
          <div>
            <label htmlFor={`answer-${currentQuestion.id}`} className="sr-only">
              Your answer
            </label>
            {isManualGraded ? (
              <textarea
                id={`answer-${currentQuestion.id}`}
                value={currentAnswer}
                disabled={submitting}
                onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
                rows={4}
                placeholder="Type your answer..."
                className={TEXT_INPUT_CLASS}
              />
            ) : (
              <input
                id={`answer-${currentQuestion.id}`}
                type="text"
                value={currentAnswer}
                disabled={submitting}
                onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
                placeholder="Type your answer..."
                autoComplete="off"
                className={TEXT_INPUT_CLASS}
              />
            )}
          </div>
        )}

        {!isChoiceQuestion && !isShortText && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              This question type is not fully supported yet. You can type an answer, but it
              may not be scored automatically.
            </p>
            <label htmlFor={`answer-${currentQuestion.id}`} className="sr-only">
              Your answer
            </label>
            <textarea
              id={`answer-${currentQuestion.id}`}
              value={currentAnswer}
              disabled={submitting}
              onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
              rows={4}
              placeholder="Type your answer..."
              className={TEXT_INPUT_CLASS}
            />
          </div>
        )}
      </div>

      {/* Unanswered confirmation */}
      {confirming && !submitting && (
        <div
          role="alertdialog"
          aria-live="assertive"
          className="mx-6 mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"
        >
          <p className="text-sm text-amber-800 dark:text-amber-300">
            You have {unansweredCount} unanswered question{unansweredCount === 1 ? '' : 's'}.
            Submit anyway?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void submit()}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Submit anyway
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                const firstBlank = questions.findIndex((q) => (answers[q.id] ?? '').trim() === '');
                if (firstBlank >= 0) setCurrentIndex(firstBlank);
              }}
              className="rounded-lg border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Go to first unanswered
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col gap-3 border-t border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goPrevious}
          disabled={currentIndex === 0 || submitting}
          className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <div className="flex gap-3">
          {!isLast && unansweredCount === 0 && (
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={submitting}
              className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit now
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={submitting}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit test'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Question navigator */}
      {questions.length > 1 && (
        <nav aria-label="Question navigator" className="border-t border-border p-6">
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const isCurrent = i === currentIndex;
              const answered = isAnswered(q);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  disabled={submitting}
                  aria-label={`Question ${i + 1}, ${answered ? 'answered' : 'not answered'}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={[
                    'h-9 w-9 rounded-md border text-sm font-medium transition disabled:opacity-50',
                    isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : answered
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </section>
  );
}