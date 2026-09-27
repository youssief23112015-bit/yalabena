// Location: src/pages/student/CoursePage.tsx

import { useState, type MouseEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useAssignments, useModules, useQuizzes } from "@/hooks/use-lms";
import { downloadProtected } from "@/lib/axios";
import type { LmsResource } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Paperclip,
  ClipboardList,
  ListChecks,
} from "lucide-react";

function ResourceRow({ resource }: { resource: LmsResource }) {
  const isPdf = resource.type === "pdf";
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    void downloadProtected(
      isPdf
        ? `/lms/resources/${resource.id}/watermarked-pdf`
        : `/lms/resources/${resource.id}/download`,
      resource.name,
    );
  };
  return (
    <a
      href="#"
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {isPdf ? <FileText className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
      <span className="flex-1">{resource.name}</span>
      <Badge variant={isPdf ? "secondary" : "outline"}>
        {isPdf ? "Watermarked PDF" : resource.type}
      </Badge>
    </a>
  );
}

export default function CoursePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const validGroupId = groupId ?? "";

  const modules = useModules(validGroupId);
  const assignments = useAssignments(validGroupId);
  const quizzes = useQuizzes(validGroupId);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Course Content</h1>
        <p className="text-sm text-muted-foreground">
          Modules, lessons, resources, assignments and quizzes
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="h-5 w-5" /> Modules
        </h2>
        {(modules.data ?? []).map((mod) => (
          <Card key={mod.id}>
            <button
              onClick={() => toggle(mod.id)}
              className="flex w-full items-center gap-2 p-4 text-left font-medium"
            >
              {open.has(mod.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="flex-1">{mod.name}</span>
              <Badge variant="secondary">{mod.lessons?.length ?? 0} lessons</Badge>
            </button>
            {open.has(mod.id) && (
              <CardContent className="space-y-2 border-t pt-4">
                {(mod.lessons ?? [])
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((lesson) => (
                    <div key={lesson.id} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{lesson.name}</p>
                      {lesson.content && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                          {lesson.content}
                        </p>
                      )}
                      <div className="mt-2 space-y-0.5">
                        {(lesson.resources ?? []).map((r) => (
                          <ResourceRow key={r.id} resource={r} />
                        ))}
                      </div>
                    </div>
                  ))}
                {(!mod.lessons || mod.lessons.length === 0) && (
                  <p className="text-sm text-muted-foreground">No lessons yet.</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ClipboardList className="h-5 w-5" /> Assignments
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(assignments.data ?? []).map((a) => {
            const overdue = a.due_at ? new Date(a.due_at) < new Date() : false;
            const isDisabled = overdue && !a.allow_late_submission;
            return (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {a.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {a.due_at ? new Date(a.due_at).toLocaleString() : "No deadline"}
                    {overdue && <Badge variant="destructive">Closed</Badge>}
                    {a.allow_late_submission && (
                      <Badge variant="outline">Late allowed</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDisabled}
                    asChild={!isDisabled}
                  >
                    {isDisabled ? (
                      <span>Open</span>
                    ) : (
                      <Link to={`/student/assignments/${a.id}?group_id=${validGroupId}`}>
                        Open
                      </Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ListChecks className="h-5 w-5" /> Quizzes
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(quizzes.data ?? []).map((q) => (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{q.title}</CardTitle>
                <CardDescription>
                  {q.questions?.length ?? 0} questions · pass {q.passing_score ?? 60}%
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {q.time_limit_minutes ? `${q.time_limit_minutes} min` : "Untimed"}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/student/quiz/${q.id}?group_id=${validGroupId}`}>
                    Start quiz
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}