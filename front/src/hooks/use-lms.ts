import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  Assignment,
  GradebookEntry,
  LmsModule,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  Submission,
  WeightedGradeResult,
} from "@/lib/types";

const qk = {
  modules: (groupId: string) => ["modules", groupId] as const,
  assignments: (groupId: string) => ["assignments", groupId] as const,
  quizzes: (groupId: string) => ["quizzes", groupId] as const,
  questionBank: (filters: object) => ["question-bank", filters] as const,
  gradebook: (groupId: string) => ["gradebook", groupId] as const,
  attemptResults: (attemptId: string) => ["attempt-results", attemptId] as const,
};

// ── Modules / Lessons ─────────────────────────────────────────
export function useModules(groupId: string) {
  return useQuery({
    queryKey: qk.modules(groupId),
    queryFn: async () =>
      (await api.get<LmsModule[]>("/lms/modules", { params: { group_id: groupId } })).data,
    enabled: !!groupId,
  });
}

// ── Assignments ───────────────────────────────────────────────
export function useAssignments(groupId: string) {
  return useQuery({
    queryKey: qk.assignments(groupId),
    queryFn: async () =>
      (await api.get<Assignment[]>("/lms/assignments", { params: { group_id: groupId } })).data,
    enabled: !!groupId,
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      assignment_id: string;
      content?: string;
      file_url?: string;
      file_name?: string;
    }) => (await api.post<Submission>("/lms/submissions", dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["submissions"] }),
  });
}

// ── Quizzes ───────────────────────────────────────────────────
export function useQuizzes(groupId: string) {
  return useQuery({
    queryKey: qk.quizzes(groupId),
    queryFn: async () =>
      (await api.get<Quiz[]>("/lms/quizzes", { params: { group_id: groupId } })).data,
    enabled: !!groupId,
  });
}

export function useStartAttempt() {
  return useMutation({
    mutationFn: async (quizId: string) =>
      (await api.post<QuizAttempt>(`/lms/quizzes/${quizId}/start`)).data,
  });
}

export function useSubmitAttempt() {
  return useMutation({
    mutationFn: async (dto: {
      attemptId: string;
      answers: Record<string, unknown>;
      time_spent_seconds: number;
    }) =>
      (
        await api.put<QuizAttempt>(`/lms/attempts/${dto.attemptId}/submit`, {
          answers: dto.answers,
          time_spent_seconds: dto.time_spent_seconds,
        })
      ).data,
  });
}

export function useAttemptResults(attemptId: string | null) {
  return useQuery({
    queryKey: qk.attemptResults(attemptId ?? ""),
    queryFn: async () =>
      (await api.get<Record<string, unknown>>(`/lms/attempts/${attemptId}/results`)).data,
    enabled: !!attemptId,
    refetchInterval: (query) =>
      (query.state.data as { score?: number | null })?.score == null ? false : false,
  });
}

// ── Question Bank (Instructor) ────────────────────────────────
export function useQuestionBank(filters: { topic_tag?: string; difficulty?: string }) {
  return useQuery({
    queryKey: qk.questionBank(filters),
    queryFn: async () =>
      (await api.get<QuizQuestion[]>("/lms/questions/bank", { params: filters })).data,
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<QuizQuestion>) =>
      (await api.post<QuizQuestion>("/lms/questions", dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["question-bank"] }),
  });
}

export function usePullQuestions(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { topic_tag?: string; difficulty?: string; limit?: number }) =>
      (await api.post<QuizQuestion[]>(`/lms/quizzes/${quizId}/pull-questions`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quizzes"] }),
  });
}

export function useSetReleaseMode(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (release_mode: "INSTANT" | "AFTER_REVIEW") =>
      (await api.put(`/lms/quizzes/${quizId}/release-mode`, { release_mode })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quizzes"] }),
  });
}

export function useReleaseAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: string) =>
      (await api.put<QuizAttempt>(`/lms/attempts/${attemptId}/release`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attempt-results"] }),
  });
}

// ── Gradebook ─────────────────────────────────────────────────
export function useGradebook(groupId: string) {
  return useQuery({
    queryKey: qk.gradebook(groupId),
    queryFn: async () =>
      (await api.get<GradebookEntry[]>("/lms/gradebook", { params: { group_id: groupId } })).data,
    enabled: !!groupId,
  });
}

export function useWeightedGrade(groupId: string, studentId: string) {
  return useQuery({
    queryKey: ["weighted-grade", groupId, studentId],
    queryFn: async () =>
      (
        await api.get<WeightedGradeResult>("/lms/gradebook/calculate", {
          params: { group_id: groupId, student_id: studentId },
        })
      ).data,
    enabled: !!groupId && !!studentId,
  });
}

export function useCreateGradebookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      student_id: string;
      category_id: string;
      score: number;
      note?: string;
    }) => (await api.post<GradebookEntry>("/lms/gradebook/entries", dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gradebook"] });
      qc.invalidateQueries({ queryKey: ["weighted-grade"] });
    },
  });
}