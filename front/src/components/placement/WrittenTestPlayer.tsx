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
    const responseMessage = (err as { response?: { data?: { message?: unknown } } }).response?.data
      ?.message;

    if (Array.isArray(responseMessage) && responseMessage.length > 0) {
      return responseMessage.map(String).join(', ');
    }
    if (typeof responseMessage === 'string' && responseMessage !== '') {
      return responseMessage;
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
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /* ------------------------------ Load paper ------------------------------ */
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setPaper(null);

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

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? '').trim() !== '').length,
    [answers, questions],
  );

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: answer }));
  };

  const goPrevious = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));

  /* -------------------------------- Submit -------------------------------- */
  const handleSubmit = async () => {
    if (!paper || submitting) return;

    if (answeredCount !== questions.length) {
      const confirmed = window.confirm(
        `You answered ${answeredCount} of ${questions.length} questions. Submit anyway?`,
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
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

  /* --------------------------------- Views -------------------------------- */
  if (loading) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
        </div>
        <p className="text-center text-sm text-gray-600">Loading written placement test...</p>
      </section>
    );
  }

  if (error && !paper) {
    return (
      <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-900">Unable to load the test</h2>
        <p className="mt-2 text-sm text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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
        className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900"
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
  const isLast = currentIndex === questions.length - 1;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Written Placement Test</h2>
            <p className="mt-1 text-sm text-gray-500">
              Question {currentIndex + 1} of {questions.length} · {answeredCount} answered
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {paper.totalPoints} total point{paper.totalPoints === 1 ? '' : 's'}
          </div>
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={currentIndex + 1}
        >
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Error (submit failures) */}
      {error && (
        <div
          role="alert"
          className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {/* Question */}
      <div className="p-6">
        <div className="mb-6">
          <div className="mb-3 text-sm font-medium text-indigo-600">
            Question {currentIndex + 1}
          </div>
          <h3 className="text-xl font-semibold leading-relaxed text-gray-900">
            {getQuestionText(currentQuestion)}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {currentQuestion.points} point{currentQuestion.points === 1 ? '' : 's'}
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
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition',
                    selected
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                    submitting ? 'cursor-not-allowed opacity-60' : '',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={choice.value}
                    checked={selected}
                    disabled={submitting}
                    onChange={() => setAnswer(currentQuestion.id, choice.value)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-800">{choice.label}</span>
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
            <input
              id={`answer-${currentQuestion.id}`}
              type="text"
              value={currentAnswer}
              disabled={submitting}
              onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
              placeholder="Type your answer..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}

        {!isChoiceQuestion && !isShortText && (
          <div>
            <label
              htmlFor={`answer-${currentQuestion.id}`}
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Your answer
            </label>
            <textarea
              id={`answer-${currentQuestion.id}`}
              value={currentAnswer}
              disabled={submitting}
              onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
              rows={4}
              placeholder="Type your answer..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-3 border-t border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goPrevious}
          disabled={currentIndex === 0 || submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit test'}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </section>
  );
}