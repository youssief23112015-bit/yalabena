import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAttemptResults, useQuizzes, useStartAttempt, useSubmitAttempt } from "@/hooks/use-lms";
import { useAuth } from "@/lib/auth-context";
import type { QuizAttempt, QuizQuestion } from "@/lib/types";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Flag, Send, Timer } from "lucide-react";

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "taking"; attempt: QuizAttempt; quizQuestions: QuizQuestion[]; secondsLeft: number }
  | { kind: "results"; attempt: QuizAttempt };

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("group_id") ?? "";
  const navigate = useNavigate();
  const { user } = useAuth();

  const quizzes = useQuizzes(groupId);
  const quiz = useMemo(
    () => quizzes.data?.find((q) => q.id === quizId),
    [quizzes.data, quizId],
  );

  const startAttempt = useStartAttempt();
  const submitAttempt = useSubmitAttempt();

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const startTimeRef = useRef(Date.now());

  // Auto-start attempt when quiz data arrives
  useEffect(() => {
    if (!quiz || !quizId || phase.kind !== "loading") return;
    startAttempt
      .mutateAsync(quizId)
      .then((attempt) =>
        setPhase({
          kind: "taking",
          attempt,
          quizQuestions: quiz.questions ?? [],
          secondsLeft: (quiz.time_limit_minutes ?? 0) * 60,
        }),
      )
      .catch((e: Error) => setPhase({ kind: "error", message: e.message }));
  }, [quiz, quizId, phase.kind]);

  // Countdown timer; auto-submit on expiry
  useEffect(() => {
    if (phase.kind !== "taking") return;
    if (phase.secondsLeft <= 0) {
      void doSubmit(true);
      return;
    }
    const t = setTimeout(
      () => setPhase((p) => (p.kind === "taking" ? { ...p, secondsLeft: p.secondsLeft - 1 } : p)),
      1000,
    );
    return () => clearTimeout(t);
  }, [phase]);

  const doSubmit = async (timedOut = false) => {
    if (phase.kind !== "taking") return;
    const attemptId = phase.attempt.id;
    try {
      const result = await submitAttempt.mutateAsync({
        attemptId,
        answers,
        time_spent_seconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      });
      setPhase({ kind: "results", attempt: result });
    } catch (e) {
      if (timedOut) {
        setPhase({ kind: "results", attempt: { ...phase.attempt, status: "EXPIRED" } as QuizAttempt });
      } else {
        setPhase({ kind: "error", message: (e as Error).message });
      }
    }
  };

  const results = useAttemptResults(
    phase.kind === "results" && phase.attempt.status === "GRADED" ? phase.attempt.id : null,
  );

  if (phase.kind === "loading" || quizzes.isLoading)
    return <div className="p-10 text-center text-muted-foreground">Preparing your quiz…</div>;

  if (phase.kind === "error")
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <p className="mb-4 text-destructive">{phase.message}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );

  if (!quiz) return <div className="p-10 text-center text-muted-foreground">Quiz not found.</div>;

  // ── Results screen ──────────────────────────────────────
  if (phase.kind === "results") {
    const released = results.data as { score?: number | null; percentage?: number | null; message?: string } | undefined;
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {quiz.title}
              <Badge variant={phase.attempt.is_passed ? "default" : "destructive"}>
                {phase.attempt.status === "PENDING_REVIEW" ? "Pending review" : phase.attempt.is_passed ? "Passed" : "Not passed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {phase.attempt.needs_manual_review && (
              <p className="flex items-center gap-2 text-sm text-amber-700">
                <Flag className="h-4 w-4" /> Short-answer questions require teacher review before final scoring.
              </p>
            )}
            {released?.score != null ? (
              <>
                <p className="text-3xl font-bold">{released.percentage}%</p>
                <p className="text-sm text-muted-foreground">
                  Your score: {released.score} — {phase.attempt.is_passed ? "congratulations!" : "keep practicing."}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {released?.message ?? "Results will be available after teacher review."}
              </p>
            )}
            <Button className="mt-4" onClick={() => navigate(`/student/courses/${groupId}`)}>
              Back to course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Taking screen ───────────────────────────────────────
  const { quizQuestions, secondsLeft } = phase;
  const question = quizQuestions[index];
  const answeredCount = quizQuestions.filter((q) => answers[q.id] !== undefined).length;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {index + 1} of {quizQuestions.length} · {question.points} pts
          </p>
        </div>
        {secondsLeft > 0 && (
          <Badge variant={secondsLeft < 60 ? "destructive" : "secondary"}>
            <Timer className="mr-1 h-3.5 w-3.5" /> {mm}:{ss}
          </Badge>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {quizQuestions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setIndex(i)}
            className={`h-2 flex-1 rounded-full ${i === index ? "bg-primary" : answers[q.id] !== undefined ? "bg-primary/40" : "bg-muted"}`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base leading-relaxed">{question.question_text}</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionRenderer
            key={question.id}
            question={question}
            answer={answers[question.id]}
            onAnswer={(v) => setAnswers((prev) => ({ ...prev, [question.id]: v }))}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <span className="text-xs text-muted-foreground">{answeredCount}/{quizQuestions.length} answered</span>
        {index < quizQuestions.length - 1 ? (
          <Button onClick={() => setIndex((i) => i + 1)}>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => doSubmit()}
            disabled={submitAttempt.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="mr-1 h-4 w-4" /> Submit quiz
          </Button>
        )}
      </div>

      {user && (
        <p className="text-center text-xs text-muted-foreground">
          Attempts are tracked per student · quiz {quiz.max_attempts ? `limited to ${quiz.max_attempts}` : "unlimited"}
        </p>
      )}
    </div>
  );
}