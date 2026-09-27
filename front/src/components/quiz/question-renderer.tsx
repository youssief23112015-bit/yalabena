import type { QuizQuestion } from "@/lib/types";
import { QuestionType } from "@/lib/types";
import { MatchingDnd } from "./matching-dnd";
import { OrderingDnd } from "./ordering-dnd";
import { cn } from "@/lib/utils";

interface Props {
  question: QuizQuestion;
  answer: unknown;
  onAnswer: (value: unknown) => void;
  disabled?: boolean;
}

export function QuestionRenderer({ question, answer, onAnswer, disabled }: Props) {
  switch (question.type) {
    case QuestionType.MCQ: {
      const options = question.options ?? [];
      return (
        <div className="space-y-2">
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(opt)}
              className={cn(
                "flex w-full items-center rounded-lg border p-3 text-left text-sm transition-colors",
                answer === opt ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted",
                disabled && "pointer-events-none opacity-70",
              )}
            >
              <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      );
    }

    case QuestionType.TRUE_FALSE: {
      const choices = ["true", "false"];
      return (
        <div className="flex gap-3">
          {choices.map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(c)}
              className={cn(
                "flex-1 rounded-lg border p-4 text-sm font-medium capitalize transition-colors",
                String(answer).toLowerCase() === c ? "border-primary bg-primary/5" : "hover:bg-muted",
                disabled && "pointer-events-none opacity-70",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      );
    }

    case QuestionType.SHORT_ANSWER:
      return (
        <textarea
          value={(answer as string) ?? ""}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder="Type your answer…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      );

    case QuestionType.MATCHING: {
      const correct = (question.correct_answer ?? {}) as Record<string, string>;
      const leftItems = Object.keys(correct);
      // Shuffle deterministically per question id so it doesn't jump on re-render
      const rightOptions = [...new Set(Object.values(correct))].sort(
        () => (question.id.charCodeAt(0) % 7) - 3.5,
      );
      return (
        <MatchingDnd
          leftItems={leftItems}
          rightOptions={rightOptions}
          value={(answer as Record<string, string>) ?? {}}
          onChange={onAnswer}
        />
      );
    }

    case QuestionType.ORDERING: {
      const correct = (question.correct_answer ?? []) as string[];
      const items =
        Array.isArray(answer) && answer.length === correct.length
          ? (answer as string[])
          : [...correct].sort(() => (question.id.charCodeAt(0) % 7) - 3.5);
      return <OrderingDnd items={items} onChange={onAnswer} />;
    }

    default:
      return <p className="text-sm text-muted-foreground">Unsupported question type.</p>;
  }
}