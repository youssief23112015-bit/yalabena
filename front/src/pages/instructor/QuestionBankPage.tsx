import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateQuestion, useQuestionBank } from "@/hooks/use-lms";
import { QuestionType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  type: z.nativeEnum(QuestionType),
  question_text: z.string().min(3, "Question text is required"),
  points: z.coerce.number().min(1).default(10),
  topic_tag: z.string().optional(),
  difficulty: z.string().optional(),
  options: z.string().optional(),
  correct_answer: z.string().min(1, "Correct answer is required"),
  pairs: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function parseCorrectAnswer(values: FormValues): unknown {
  switch (values.type) {
    case QuestionType.MCQ:
    case QuestionType.TRUE_FALSE:
    case QuestionType.SHORT_ANSWER:
      return values.correct_answer;
    case QuestionType.MATCHING:
      return Object.fromEntries(
        (values.pairs ?? "")
          .split("\n")
          .map((line) => line.split("="))
          .filter((p) => p.length === 2)
          .map(([k, v]) => [k.trim(), v.trim()]),
      );
    case QuestionType.ORDERING:
      return values.correct_answer.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

export default function QuestionBankPage() {
  const [filters, setFilters] = useState<{ topic_tag?: string; difficulty?: string }>({});
  const bank = useQuestionBank(filters);
  const create = useCreateQuestion();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: QuestionType.MCQ, points: 10 },
  });
  const qType = form.watch("type");

  const onSubmit = form.handleSubmit(async (values) => {
    await create.mutateAsync({
      type: values.type,
      question_text: values.question_text,
      points: values.points,
      topic_tag: values.topic_tag || undefined,
      difficulty: values.difficulty || undefined,
      options:
        values.type === QuestionType.MCQ
          ? (values.options ?? "").split("\n").map((s) => s.trim()).filter(Boolean)
          : undefined,
      correct_answer: parseCorrectAnswer(values),
      quiz_id: null,
    });
    form.reset({ type: values.type, points: 10 });
    setShowForm(false);
  });

  const selectStyle =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Question Bank</h1>
          <p className="text-sm text-muted-foreground">
            Reusable questions — pull into any quiz by topic or difficulty
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "New question"}
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Filter by topic tag…"
          onChange={(e) =>
            setFilters((f) => ({ ...f, topic_tag: e.target.value || undefined }))
          }
          className="max-w-xs"
        />
        <select
          className={`${selectStyle} max-w-[160px]`}
          onChange={(e) =>
            setFilters((f) => ({ ...f, difficulty: e.target.value || undefined }))
          }
        >
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create question</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <select className={selectStyle} {...form.register("type")}>
                  {Object.values(QuestionType).map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <Input type="number" placeholder="Points" {...form.register("points")} />
                <Input
                  placeholder="Difficulty (easy/medium/hard)"
                  {...form.register("difficulty")}
                />
              </div>
              <Textarea placeholder="Question text…" {...form.register("question_text")} />
              {qType === QuestionType.MCQ && (
                <Textarea
                  placeholder={`Options, one per line:\nParis\nLondon\nBerlin`}
                  {...form.register("options")}
                />
              )}
              {qType === QuestionType.MATCHING ? (
                <Textarea
                  placeholder={`Pairs, one per line:\ncat = feline\ndog = canine`}
                  {...form.register("pairs")}
                />
              ) : qType === QuestionType.ORDERING ? (
                <Input
                  placeholder="Correct order, comma separated: first, second, third"
                  {...form.register("correct_answer")}
                />
              ) : (
                <Input
                  placeholder={
                    qType === QuestionType.TRUE_FALSE
                      ? "Correct: true or false"
                      : "Correct answer"
                  }
                  {...form.register("correct_answer")}
                />
              )}
              <Input placeholder="Topic tag (optional)" {...form.register("topic_tag")} />
              {form.formState.errors.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Saving…" : "Save to bank"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(bank.data ?? []).map((q) => (
          <Card key={q.id}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">{q.question_text}</p>
                <div className="flex gap-1.5">
                  <Badge variant="secondary">{q.type.replace(/_/g, " ")}</Badge>
                  <Badge variant="outline">{q.points} pts</Badge>
                  {q.topic_tag && <Badge variant="outline">{q.topic_tag}</Badge>}
                  {q.difficulty && <Badge variant="default">{q.difficulty}</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(bank.data ?? []).length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No questions match your filters.
          </p>
        )}
      </div>
    </div>
  );
}