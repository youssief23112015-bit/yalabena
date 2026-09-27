import apiClient from "@/api/client";

/* =========================================================
   Question Types
========================================================= */

export type PlacementQuestionType =
  | "mcq"
  | "true_false"
  | "fill_blank"
  | "matching"
  | "ordering"
  | "short_answer"
  | string;

export type PlacementQuestionOption =
  | string
  | {
      value?: string;
      label?: string;
      text?: string;
      id?: string;
    };

export interface PlacementQuestion {
  id: string;
  type: PlacementQuestionType;
  /** Backend field. */
  question_text: string;
  /** Compatibility field used by older frontend components. */
  prompt: string;
  options: PlacementQuestionOption[];
  points: number;
}

/* =========================================================
   Written Paper
========================================================= */

export interface WrittenPaper {
  testId: string;
  totalPoints: number;
  questions: PlacementQuestion[];
  level?: string;
  percentage?: number;
  /** Backend does not send this yet; defaults to 30 for compatibility. */
  durationMinutes: number;
}

export type WrittenPaperResponse = WrittenPaper;

/* =========================================================
   Written Answer
========================================================= */

export interface WrittenAnswer {
  questionId?: string;
  question_id?: string;
  answer: unknown;
}

export type WrittenAnswerInput = WrittenAnswer;

export interface SubmitWrittenPayload {
  answers: Array<{
    question_id: string;
    answer: unknown;
  }>;
}

/* =========================================================
   Written Result (per question)
========================================================= */

export interface WrittenResult {
  level?: string;
  percentage?: number;
  questionId?: string;
  question_id?: string;
  answer?: unknown;
  isCorrect?: boolean | null;
  is_correct?: boolean | null;
  score?: number;
  maxScore?: number;
  max_score?: number;
}

export type ScoredAnswer = WrittenResult;

/* =========================================================
   Submit Response (whole test)
========================================================= */

export interface SubmitWrittenResponse {
  testId: string;
  writtenScore: number;
  writtenMax: number;
  earnedPoints: number;
  possiblePoints: number;
  results: WrittenResult[];
  level?: string;
  percentage?: number;
}

/* =========================================================
   Summary shown to the student after submitting
========================================================= */

export interface WrittenSummary {
  score: number;
  maxScore: number;
  percentage: number | null;
  level: string | null;
}

/* =========================================================
   Helpers
========================================================= */

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Tolerate a `{ data: {...} }` envelope from an interceptor. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(raw: any): any {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    raw.data &&
    typeof raw.data === "object"
  ) {
    return raw.data;
  }
  return raw;
}

/* =========================================================
   Normalizers
========================================================= */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOptions(rawOptions: any): PlacementQuestionOption[] {
  if (rawOptions === null || rawOptions === undefined) return [];

  let options = rawOptions;

  // JSON/JSONB can arrive as a string.
  if (typeof options === "string") {
    try {
      options = JSON.parse(options);
    } catch {
      return options.trim() === "" ? [] : [options];
    }
  }

  return Array.isArray(options) ? (options as PlacementQuestionOption[]) : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeQuestion(raw: any): PlacementQuestion {
  const questionText = String(
    raw?.question_text ?? raw?.questionText ?? raw?.question ?? raw?.prompt ?? "",
  );

  return {
    id: String(raw?.id ?? ""),
    type: String(raw?.type ?? "").toLowerCase(),
    question_text: questionText,
    prompt: questionText,
    options: normalizeOptions(raw?.options),
    points: toNumber(raw?.points),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePaper(rawResponse: any): WrittenPaper {
  const raw = unwrap(rawResponse);

  const questions: PlacementQuestion[] = Array.isArray(raw?.questions)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw.questions.map((q: any) => normalizeQuestion(q)).filter((q: PlacementQuestion) => q.id !== "")
    : [];

  return {
    testId: String(raw?.testId ?? raw?.test_id ?? ""),
    totalPoints: toNumber(raw?.totalPoints ?? raw?.total_points),
    questions,
    level: raw?.level ?? raw?.suggested_level ?? raw?.final_level ?? undefined,
    percentage: raw?.percentage ?? undefined,
    durationMinutes: toNumber(raw?.durationMinutes ?? raw?.duration_minutes, 30),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeWrittenResult(item: any): WrittenResult {
  const maxScoreRaw = item?.maxScore ?? item?.max_score;
  return {
    level: item?.level ?? item?.suggested_level ?? item?.final_level ?? undefined,
    percentage: item?.percentage ?? undefined,
    questionId: item?.questionId ?? item?.question_id ?? undefined,
    question_id: item?.question_id ?? item?.questionId ?? undefined,
    answer: item?.answer,
    isCorrect: item?.isCorrect ?? item?.is_correct ?? null,
    is_correct: item?.is_correct ?? item?.isCorrect ?? null,
    score: item?.score !== undefined ? toNumber(item.score) : undefined,
    maxScore: maxScoreRaw !== undefined ? toNumber(maxScoreRaw) : undefined,
    max_score: maxScoreRaw !== undefined ? toNumber(maxScoreRaw) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSubmitResponse(rawResponse: any): SubmitWrittenResponse {
  const raw = unwrap(rawResponse);

  const results: WrittenResult[] = Array.isArray(raw?.results)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw.results.map((item: any) => normalizeWrittenResult(item))
    : [];

  return {
    testId: String(raw?.testId ?? raw?.test_id ?? ""),
    writtenScore: toNumber(raw?.writtenScore ?? raw?.written_score),
    writtenMax: toNumber(raw?.writtenMax ?? raw?.written_max),
    earnedPoints: toNumber(raw?.earnedPoints ?? raw?.earned_points),
    possiblePoints: toNumber(raw?.possiblePoints ?? raw?.possible_points),
    results,
    level: raw?.level ?? raw?.suggested_level ?? raw?.final_level ?? undefined,
    percentage: raw?.percentage !== undefined ? toNumber(raw.percentage) : undefined,
  };
}

/** Turns the backend submit response into what the result card shows. */
export function toWrittenSummary(response: SubmitWrittenResponse): WrittenSummary {
  // Prefer raw points; fall back to the normalized written score.
  const hasPoints = response.possiblePoints > 0;
  const score = hasPoints ? response.earnedPoints : response.writtenScore;
  const maxScore = hasPoints ? response.possiblePoints : response.writtenMax;

  const percentage =
    response.percentage !== undefined
      ? response.percentage
      : maxScore > 0
        ? Math.round((score / maxScore) * 100)
        : null;

  return {
    score,
    maxScore,
    percentage,
    level: response.level ?? null,
  };
}

/* =========================================================
   Get Written Paper
   POST /placement-tests/:id/written/paper
========================================================= */

// React StrictMode mounts effects twice in dev. Share the in-flight request so
// the backend doesn't generate two randomized papers.
const inflightPapers = new Map<string, Promise<WrittenPaper>>();

export function getWrittenPaper(
  testId: string,
  level = "A1",
  count?: number,
  categories?: string[],
  seed?: number,
): Promise<WrittenPaper> {
  if (!testId) {
    return Promise.reject(new Error("Placement test ID is required"));
  }
  if (!level) {
    return Promise.reject(new Error("Placement test level is required"));
  }

  const key = [testId, level, count ?? "", (categories ?? []).join(","), seed ?? ""].join("|");

  const existing = inflightPapers.get(key);
  if (existing) return existing;

  const promise = apiClient
    .post(`/placement-tests/${encodeURIComponent(testId)}/written/paper`, {
      level,
      ...(count !== undefined ? { count } : {}),
      ...(categories?.length ? { categories } : {}),
      ...(seed !== undefined ? { seed } : {}),
    })
    .then((response) => normalizePaper(response.data))
    .finally(() => {
      inflightPapers.delete(key);
    });

  inflightPapers.set(key, promise);
  return promise;
}

/** Backward-compatible alias. */
export function fetchWrittenPaper(
  testId: string,
  level = "A1",
  count?: number,
  categories?: string[],
  seed?: number,
): Promise<WrittenPaper> {
  return getWrittenPaper(testId, level, count, categories, seed);
}

/* =========================================================
   Submit Written
   POST /placement-tests/:id/written/submit
========================================================= */

export async function submitWritten(
  testId: string,
  answers: WrittenAnswer[],
): Promise<SubmitWrittenResponse> {
  if (!testId) {
    throw new Error("Placement test ID is required");
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new Error("At least one answer is required");
  }

  // Last value wins if the same question appears twice.
  const byQuestion = new Map<string, { question_id: string; answer: unknown }>();

  for (const answer of answers) {
    const questionId = answer.question_id ?? answer.questionId;
    if (!questionId) {
      throw new Error("Each answer must contain questionId");
    }
    byQuestion.set(questionId, { question_id: questionId, answer: answer.answer });
  }

  const payload: SubmitWrittenPayload = {
    answers: Array.from(byQuestion.values()),
  };

  const response = await apiClient.post(
    `/placement-tests/${encodeURIComponent(testId)}/written/submit`,
    payload,
  );

  return normalizeSubmitResponse(response.data);
}

/** Backward-compatible alias. */
export async function submitWrittenTest(
  testId: string,
  answers: WrittenAnswer[],
): Promise<SubmitWrittenResponse> {
  return submitWritten(testId, answers);
}

/* =========================================================
   API Object
========================================================= */

export const placementApi = {
  getWrittenPaper,
  fetchWrittenPaper,
  submitWritten,
  submitWrittenTest,
};

export default placementApi;