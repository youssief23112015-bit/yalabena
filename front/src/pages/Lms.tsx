import { useState, useEffect, useMemo, useCallback } from 'react';
import { unwrapApiResponse } from '@/lib/apiFetch';
import { downloadProtected, api } from '@/lib/axios';
import { Link } from 'react-router-dom';
import { useAssignments, useQuizzes, useCreateQuiz, useStartAttempt, useSubmitAttempt } from '@/hooks/use-lms';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import {
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  Award,
  Upload,
  PlayCircle,
  Download,
  Plus,
  BarChart3,
  Star,
  MessageSquare,
  Folder,
  File,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Lock,
  ExternalLink,
  ShieldCheck,
  X,
  Check,
  Loader2,
  RefreshCw,
  Users,
  Sparkles,
  HelpCircle,
  Layers,
  Trash2,
  MoreHorizontal,
  Send,
} from 'lucide-react';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type ResourceType = 'pdf' | 'video' | 'audio' | 'link' | 'file';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  downloadPath?: string;
  size?: string;
  duration?: string;
  watermarked?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  completed?: boolean;
  resources: Resource[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  groupName: string;
  submitted?: boolean;
  submissionDate?: string;
  submittedText?: string;
  score?: number;
  feedback?: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
}

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer?: string | boolean;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  totalPoints: number;
  questionsCount: number;
  status: 'available' | 'completed' | 'expired';
  score?: number;
  questions: Question[];
}

export interface GradeItem {
  id: string;
  category: 'Attendance' | 'Assignments' | 'Midterm' | 'Final Exam';
  name: string;
  weight: number;
  score: number;
  maxScore: number;
}

export interface EvaluationSurvey {
  id: string;
  title: string;
  type: 'student_to_teacher' | 'teacher_to_student';
  targetName: string;
  status: 'pending' | 'completed';
  rating?: number;
  comments?: string;
}

export interface EnrolledGroup {
  id: string;
  code: string;
  courseTitle: string;
  level: string;
  teacherName: string;
  schedule: string;
  progressPercent: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Human-readable schedule from the group's group_schedules rows. */
const formatSchedule = (g: any): string => {
  const schedules = Array.isArray(g?.schedules) ? g.schedules : [];
  if (schedules.length > 0) {
    return schedules
      .map((s: any) => {
        const day = DAY_NAMES[Number(s?.day_of_week)] ?? s?.day_of_week;
        const start = String(s?.start_time ?? '').slice(0, 5);
        const end = String(s?.end_time ?? '').slice(0, 5);
        return `${day} ${start}–${end}`;
      })
      .join(' • ');
  }
  if (g?.start_date && g?.end_date) return `${g.start_date} → ${g.end_date}`;
  return 'TBA';
};

/**
 * Maps the raw backend Group entity (snake_case, nested course/teacher)
 * into the view model this page renders. Without this, fields like
 * courseTitle/teacherName/schedule were always undefined.
 */
const mapGroupToView = (g: any): EnrolledGroup => ({
  id: g?.id,
  code: g?.name ?? '—',
  courseTitle: g?.course?.name ?? 'Course',
  level: g?.course?.level ?? '—',
  teacherName:
    [g?.teacher?.first_name, g?.teacher?.last_name].filter(Boolean).join(' ') ||
    'TBA',
  schedule: formatSchedule(g),
  progressPercent: 0,
});

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Helper Function: Safe Array Extraction to prevent runtime crashes
const ensureArray = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.groups)) return data.groups;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.modules)) return data.modules;
  if (Array.isArray(data?.assignments)) return data.assignments;
  if (Array.isArray(data?.quizzes)) return data.quizzes;
  if (Array.isArray(data?.grades)) return data.grades;
  if (Array.isArray(data?.evaluations)) return data.evaluations;
  return [];
};

/** Map backend LMS entities (snake_case `name`/`file_url`/`external_url`) to the
 *  frontend view model (`title`/`url`), prefixing relative file URLs with the
 *  API base so links open correctly. */
const mapBackendResourceToView = (r: any): Resource => {
  if (!r) {
    return { id: '', title: '', type: 'file', url: '', watermarked: false };
  }
  // Backend wraps JSON responses as { success, data }. Unwrap defensively in
  // case the raw entity is nested under .data.
  const raw = r.data ?? r;
  // Prefer `file_url` (the canonical backend property). Do NOT fall back to
  // `raw.path` — that can pick up the request path from the global
  // TransformInterceptor instead of a real file URL.
  const rawUrl =
    raw.file_url ?? raw.filePath ?? raw.url ?? raw.external_url ?? '';
  const fullUrl =
    rawUrl && String(rawUrl).startsWith('/')
      ? `${API_BASE_URL}${String(rawUrl)}`
      : rawUrl || '';
  const downloadPath =
    rawUrl && String(rawUrl).startsWith('/') ? String(rawUrl) : undefined;
  return {
    id: raw.id ?? r.id,
    title: raw.name ?? raw.title ?? r.title ?? '',
    type: raw.type ?? r.type,
    url: fullUrl,
    downloadPath,
    size: raw.file_size ?? undefined,
    duration: raw.duration ?? undefined,
    watermarked: Boolean(raw.watermarked ?? r.watermarked),
  };
};

const mapBackendLessonToView = (l: any): Lesson => ({
  id: l.id,
  title: l?.name ?? l?.title,
  description: l.description,
  durationMinutes: l?.duration_minutes ?? l?.durationMinutes,
  completed: l.completed,
  resources: ensureArray<Resource>(l?.resources).map(mapBackendResourceToView),
});

const mapBackendModuleToView = (m: any): Module => ({
  id: m.id,
  title: m?.name ?? m?.title,
  description: m.description,
  order: m.order,
  lessons: ensureArray<Lesson>(m?.lessons).map(mapBackendLessonToView),
});

const mapBackendQuestionToView = (q: any): Question => ({
  id: q.id,
  text: q.question_text ?? q.text,
  type: (() => {
    switch (String(q.type ?? '').toUpperCase()) {
      case 'MCQ':
        return 'mcq';
      case 'TRUE_FALSE':
        return 'true_false';
      default:
        return 'short_answer';
    }
  })(),
  options: q.options,
  correctAnswer: q.correct_answer,
  points: Number(q.points ?? 0),
});

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const getToken = (): string | null => {
    return useAuthStore.getState().getAccessToken();
  };

  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    
    if (res.status === 401) {
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    throw new Error(errorData.message || `API Error: ${res.statusText}`);
  }

  return res.json();
}

// ==========================================
// MAIN LMS COMPONENT
// ==========================================

export default function LmsPage() {
  const user = useAuthStore((s) => s.user);

  // Role Logic
  const userRoles: string[] = Array.isArray((user as any)?.roles)
    ? (user as any).roles
    : (user as any)?.role
    ? [(user as any).role]
    : ['student'];

  const isTeacherOrAdmin = userRoles.some((r) =>
    ['super_admin', 'academic',  'teacher'].includes(r)
  );

  // Student id used to eager-load the current student's submission per assignment
  // so the frontend can compute Pending / Submitted / Graded / Overdue status.
  const studentId = isTeacherOrAdmin ? undefined : (user as any)?.id || undefined;

  // Active UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'assignments' | 'quizzes' | 'gradebook' | 'evaluations'>('overview');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // TanStack Query: group assignments for the selected cohort.
  const assignmentsQuery = useAssignments(selectedGroupId, studentId);
  const rawAssignments = useMemo(() => {
    const d = (assignmentsQuery.data ?? {}) as any;
    return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
  }, [assignmentsQuery.data]);

  // TanStack Query: group quizzes for the selected cohort.
  const quizzesQuery = useQuizzes(selectedGroupId);
  const rawQuizzes = useMemo(() => {
    const d = (quizzesQuery.data ?? {}) as any;
    return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
  }, [quizzesQuery.data]);

  // Quiz mutations (teacher create / student start-submit-results).
  const createQuizMutation = useCreateQuiz();
  const startAttemptMutation = useStartAttempt();
  const submitAttemptMutation = useSubmitAttempt();

  // View model: backend snake_case Assignment (+ optional submissions) → camelCase.
  const viewAssignments = useMemo(() => {
    const now = new Date();
    return rawAssignments.map((a: any) => {
      const subs = Array.isArray(a?.submissions) ? a.submissions : [];
      const mySub = subs[0];
      const isGraded = mySub?.status === 'graded';
      const isSubmitted = Boolean(mySub && !isGraded);
      const due = a.due_at ? new Date(a.due_at) : null;
      const overdue = Boolean(due && due < now && !isGraded);
      let status: 'pending' | 'submitted' | 'graded' | 'overdue' = 'pending';
      if (isGraded) status = 'graded';
      else if (isSubmitted) status = 'submitted';
      else if (overdue) status = 'overdue';
      return {
        id: a.id,
        title: a.title,
        description: a.description || '',
        dueDate: a.due_at || '',
        maxScore: Number(a.max_grade ?? 100),
        submitted: Boolean(mySub),
        submissionDate: mySub?.submitted_at || '',
        submittedText: mySub?.content || '',
        score: mySub?.grade ?? undefined,
        feedback: mySub?.feedback || '',
        status,
        submissionId: mySub?.id || '',
        submissionStatus: mySub?.status || '',
        allowLate: Boolean(a.allow_late_submission),
      };
    });
  }, [rawAssignments]);

  // Per-session quiz results for the current student (completes the
  // Available → Completed status without a dedicated list-attempts endpoint).
  const [quizResults, setQuizResults] = useState<Record<
    string,
    { score: number; percentage: number; isPassed: boolean }
  >>({});

  // View model: backend Quiz → camelCase with computed status.
  const viewQuizzes = useMemo(() => {
    return rawQuizzes.map((q: any) => {
      const questions = ensureArray<Question>(q?.questions).map(
        mapBackendQuestionToView,
      );
      const totalPoints = questions.reduce((sum, qq) => sum + (qq.points || 0), 0);
      const result = quizResults[q.id];
      return {
        id: q.id,
        title: q.title ?? q.name,
        description: q.description || '',
        timeLimitMinutes: q.time_limit_minutes ?? q.timeLimitMinutes ?? 0,
        totalPoints,
        questionsCount: questions.length,
        status: result ? 'completed' : ('available' as const),
        score: result?.score ?? q.score ?? undefined,
        questions,
      };
    });
  }, [rawQuizzes, quizResults]);


  // Data States (All dynamic from Backend)
  const [groups, setGroups] = useState<EnrolledGroup[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationSurvey[]>([]);

  // Async States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Accordion & Modals
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizScoreResult, setQuizScoreResult] = useState<number | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState<'take' | 'view'>('take');
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionTextInput, setSubmissionTextInput] = useState('');

  // Submissions / grading modal (teacher view)
  const [submissionsModal, setSubmissionsModal] = useState<{
    assignmentId: string;
    assignmentTitle: string;
  } | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Create Assignment modal (teacher view)
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDescription, setNewAssignmentDescription] = useState('');
  const [newAssignmentMaxScore, setNewAssignmentMaxScore] = useState(100);
  const [newAssignmentDueAt, setNewAssignmentDueAt] = useState('');
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  // Create Quiz modal (teacher view)
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [newQuizTimeLimit, setNewQuizTimeLimit] = useState(30);
  const [newQuizPassingScore, setNewQuizPassingScore] = useState(60);
  const [newQuizMaxAttempts, setNewQuizMaxAttempts] = useState(1);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  // Add Module modal state
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');

  const [evaluatingSurvey, setEvaluatingSurvey] = useState<EvaluationSurvey | null>(null);
  const [evalRating, setEvalRating] = useState<number>(5);
  const [evalComment, setEvalComment] = useState('');

  const [newResourceModal, setNewResourceModal] = useState<{ moduleId: string; lessonId: string } | null>(null);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState<ResourceType>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Add Lesson modal state
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [addLessonModuleId, setAddLessonModuleId] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState(30);

  // 1. Fetch My Courses on Load — GET /lms/my-courses returns the groups of
  //    the student's ACTIVE enrollments (approved bookings) with full course
  //    specs, teacher and schedules; staff receive their broad group list.
  useEffect(() => {
    async function fetchUserGroups() {
      try {
        setIsLoading(true);
        setError(null);
        const rawRes = await apiFetch<any>('/lms/groups');
        // GET /lms/groups returns only the groups the current user is
        // assigned to (teachers: instructed groups; students: enrolled groups;
        // admins/academic: all groups) — so unassigned groups never reach the UI.
        const fetchedGroups = ensureArray<any>(rawRes)
          .map((item: any) => (item?.group ?? item))
          .filter((g: any) => Boolean(g?.id))
          .map(mapGroupToView);
        setGroups(fetchedGroups);
        
        if (fetchedGroups.length > 0) {
          setSelectedGroupId(fetchedGroups[0].id);
        } else {
          setSelectedGroupId('');
        }
      } catch (err: any) {
        setGroups([]);
        setError(err.message || 'فشل في تحميل المجموعات المسجلة');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserGroups();
  }, []);

  // 2. Fetch Group-Specific Data when selectedGroupId changes
  const loadGroupData = useCallback(async (groupId: string) => {
    if (!groupId) return;
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all dynamic tabs in parallel (assignments & quizzes are loaded via
      // TanStack Query's useAssignments / useQuizzes so those tabs stay in sync
      // with submissions and attempts without refetching on every group change).
      const [rawModules, rawGrades, rawEvals] = await Promise.all([
        apiFetch<any>(`/lms/groups/${groupId}/modules`),
        apiFetch<any>(`/lms/groups/${groupId}/grades`),
        apiFetch<any>(`/lms/groups/${groupId}/evaluations`),
      ]);

      const modulesRes = ensureArray<Module>(rawModules).map(mapBackendModuleToView);
      const gradeItemsRes = ensureArray<GradeItem>(rawGrades);
      const evaluationsRes = ensureArray<EvaluationSurvey>(rawEvals);

      setModules(modulesRes);
      setGradeItems(gradeItemsRes);
      setEvaluations(evaluationsRes);

      // Auto expand first module
      if (modulesRes.length > 0) {
        setExpandedModules({ [modulesRes[0].id]: true });
      }
    } catch (err: any) {
      setModules([]);
      setGradeItems([]);
      setEvaluations([]);
      setError(err.message || 'حدث خطأ أثناء جلب بيانات الدورة من السيرفر');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupData(selectedGroupId);
    }
  }, [selectedGroupId, loadGroupData]);

  // Safe Current Selected Group Object
  const selectedGroup = useMemo(() => {
    const safeGroups = ensureArray<EnrolledGroup>(groups);
    return safeGroups.find((g) => g.id === selectedGroupId);
  }, [groups, selectedGroupId]);

  // Safe Calculations
  const completedLessonsCount = useMemo(() => {
    let count = 0;
    const safeModules = ensureArray<Module>(modules);
    safeModules.forEach((m) => {
      const safeLessons = ensureArray<Lesson>(m?.lessons);
      safeLessons.forEach((l) => l.completed && count++);
    });
    return count;
  }, [modules]);

  const totalLessonsCount = useMemo(() => {
    let count = 0;
    const safeModules = ensureArray<Module>(modules);
    safeModules.forEach((m) => {
      const safeLessons = ensureArray<Lesson>(m?.lessons);
      count += safeLessons.length;
    });
    return count;
  }, [modules]);

  const calculatedProgress = useMemo(() => {
    if (totalLessonsCount === 0) return 0;
    return Math.round((completedLessonsCount / totalLessonsCount) * 100);
  }, [completedLessonsCount, totalLessonsCount]);

  const weightedTotalGrade = useMemo(() => {
    let earnedWeight = 0;
    let totalAssessedWeight = 0;
    const safeGrades = ensureArray<GradeItem>(gradeItems);

    safeGrades.forEach((item) => {
      if (item.score > 0) {
        earnedWeight += (item.score / item.maxScore) * item.weight;
        totalAssessedWeight += item.weight;
      }
    });

    if (totalAssessedWeight === 0) return 0;
    return Math.round((earnedWeight / totalAssessedWeight) * 100);
  }, [gradeItems]);

  // Handlers for Backend Mutations
  const toggleModuleAccordion = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const toggleLessonComplete = async (moduleId: string, lessonId: string, currentStatus: boolean) => {
    try {
      // Optimistic Update
      setModules((prev) =>
        ensureArray<Module>(prev).map((mod) =>
          mod.id === moduleId
            ? {
                ...mod,
                lessons: ensureArray<Lesson>(mod.lessons).map((les) =>
                  les.id === lessonId ? { ...les, completed: !currentStatus } : les
                ),
              }
            : mod
        )
      );

      await apiFetch(`/lms/lessons/${lessonId}/toggle-completion`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !currentStatus }),
      });
    } catch (err: any) {
      loadGroupData(selectedGroupId);
      alert('تعذر تحديث حالة الدرس: ' + err.message);
    }
  };

  const handleAddResource = async () => {
    if (!newResourceModal || !newResourceTitle.trim()) return;
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('lesson_id', newResourceModal.lessonId);
      formData.append('title', newResourceTitle.trim());
      formData.append('type', newResourceType);
      if (selectedFile) formData.append('file', selectedFile);

      const token = useAuthStore.getState().getAccessToken();
      const res = await fetch(`${API_BASE_URL}/lms/resources/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${res.statusText}`);
      }

      const createdResourceRaw = unwrapApiResponse<Resource>(await res.json());
      const createdResource = mapBackendResourceToView(createdResourceRaw);

      setModules((prev) =>
        ensureArray<Module>(prev).map((m) =>
          m.id === newResourceModal.moduleId
            ? {
                ...m,
                lessons: ensureArray<Lesson>(m.lessons).map((l) =>
                  l.id === newResourceModal.lessonId
                    ? { ...l, resources: [...ensureArray<Resource>(l.resources), createdResource] }
                    : l
                ),
              }
            : m
        )
      );

      setNewResourceTitle('');
      setNewResourceType('pdf');
      setSelectedFile(null);
      setNewResourceModal(null);
    } catch (err: any) {
      alert('خطأ أثناء إضافة الملف: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResourceDownload = async (path: string, title: string) => {
    try {
      await downloadProtected(path, title);
    } catch (err: any) {
      alert('تعذر تحميل الملف: ' + err.message);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;
    try {
      await api.delete(`/lms/resources/${resourceId}`);
      setModules((prev) =>
        ensureArray<Module>(prev).map((m) =>
          m.lessons ? {
            ...m,
            lessons: ensureArray<Lesson>(m.lessons).map((l) =>
              l.resources
                ? {
                    ...l,
                    resources: ensureArray<Resource>(l.resources).filter((r) => r.id !== resourceId),
                  }
                : l
            ),
          }
          : m
        )
      );
    } catch (err: any) {
      alert('تعذر حذف المرفق: ' + err.message);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (
      !window.confirm(
        'هل أنت متأكد من حذف هذا القسم وكل الدروس والمرفقات المرتبطة به؟',
      )
    )
      return;
    try {
      await apiFetch(`/lms/modules/${moduleId}`, {
        method: 'DELETE',
      });
      setModules((prev) =>
        ensureArray<Module>(prev).filter((m) => m.id !== moduleId),
      );
    } catch (err: any) {
      alert('تعذر حذف القسم: ' + err.message);
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    try {
      await apiFetch(`/lms/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      setModules((prev) =>
        ensureArray<Module>(prev).map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: ensureArray<Lesson>(m.lessons).filter(
                  (l) => l.id !== lessonId,
                ),
              }
            : m,
        ),
      );
    } catch (err: any) {
      alert('تعذر حذف الدرس: ' + err.message);
    }
  };

  const handleAddLesson = async () => {
    if (!addLessonModuleId || !newLessonTitle.trim()) return;
    try {
      setIsSubmitting(true);
      const targetModule = ensureArray<Module>(modules).find((m) => m.id === addLessonModuleId);
      const orderIndex = (ensureArray<Lesson>(targetModule?.lessons).length || 0) + 1;
      const createdLesson = await apiFetch<Lesson>(
        '/lms/lessons',
        {
          method: 'POST',
          body: JSON.stringify({
            module_id: addLessonModuleId,
            title: newLessonTitle.trim(),
            order_index: orderIndex,
          }),
        }
      );

      const normalizedLesson = mapBackendLessonToView(createdLesson);

      setModules((prev) =>
        ensureArray<Module>(prev).map((m) =>
          m.id === addLessonModuleId
            ? {
                ...m,
                lessons: [...ensureArray<Lesson>(m.lessons), normalizedLesson],
              }
            : m
        )
      );

      setNewLessonTitle('');
      setNewLessonDuration(30);
      setShowAddLessonModal(false);
      setAddLessonModuleId('');
    } catch (err: any) {
      alert('خطأ أثناء إضافة الدرس: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedGroupId || !newAssignmentTitle.trim()) return;

    try {
      setIsCreatingAssignment(true);
      const dueAt = newAssignmentDueAt.trim() || undefined;
      await apiFetch(`/lms/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          group_id: selectedGroupId,
          title: newAssignmentTitle.trim(),
          instructions: newAssignmentDescription.trim() || '',
          max_score: Number(newAssignmentMaxScore) || 100,
          ...(dueAt ? { due_at: dueAt } : {}),
          allow_late: false,
        }),
      });

      setIsCreateAssignmentOpen(false);
      setNewAssignmentTitle('');
      setNewAssignmentDescription('');
      setNewAssignmentMaxScore(100);
      setNewAssignmentDueAt('');
      await assignmentsQuery.refetch();
    } catch (err: any) {
      alert('حدث خطأ أثناء إنشاء الواجب: ' + err.message);
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!selectedGroupId || !newQuizTitle.trim()) return;

    try {
      setIsCreatingQuiz(true);
      await createQuizMutation.mutateAsync({
        group_id: selectedGroupId,
        title: newQuizTitle.trim(),
        description: newQuizDescription.trim() || '',
        time_limit_minutes: Number(newQuizTimeLimit) || 30,
        passing_score: Number(newQuizPassingScore) || 60,
        max_attempts: Number(newQuizMaxAttempts) || 1,
      });

      setIsCreateQuizOpen(false);
      setNewQuizTitle('');
      setNewQuizDescription('');
      setNewQuizTimeLimit(30);
      setNewQuizPassingScore(60);
      setNewQuizMaxAttempts(1);
      await quizzesQuery.refetch();
    } catch (err: any) {
      alert('حدث خطأ أثناء إنشاء الكويز: ' + err.message);
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const handleStartQuiz = async (quiz: Quiz) => {
    try {
      setIsSubmitting(true);
      const attempt = await startAttemptMutation.mutateAsync(quiz.id);
      setCurrentAttemptId(attempt.id);
      setActiveQuiz(quiz);
      setQuizMode('take');
      setQuizAnswers({});
      setQuizScoreResult(null);
      setQuizStartTime(Date.now());
    } catch (err: any) {
      alert('تعذر بدء الكويز: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!submittingAssignment || !submissionTextInput.trim()) return;

    try {
      setIsSubmitting(true);
      await apiFetch(`/lms/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          assignment_id: submittingAssignment.id,
          content: submissionTextInput.trim(),
        }),
      });

      setSubmittingAssignment(null);
      setSubmissionTextInput('');
      await assignmentsQuery.refetch();
    } catch (err: any) {
      alert('حدث خطأ أثناء تسليم الواجب: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSubmissionsModal = (
    assignmentId: string,
    assignmentTitle: string
  ) => {
    setSubmissionsModal({ assignmentId, assignmentTitle });
    setSubmissions([]);
    setGradingSubmissionId(null);
    setGradeScore('');
    setGradeFeedback('');
    loadSubmissions(assignmentId);
  };

  const loadSubmissions = async (assignmentId: string) => {
    setIsLoadingSubmissions(true);
    try {
      const res = await apiFetch<any>(
        `/lms/submissions?assignment_id=${assignmentId}`
      );
      const data = res?.data ?? res ?? [];
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setSubmissions([]);
      alert('تعذر تحميل التسليمات: ' + err.message);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!gradingSubmissionId || !gradeScore.trim()) return;
    try {
      setIsSubmitting(true);
      await apiFetch(`/lms/submissions/${gradingSubmissionId}/grade`, {
        method: 'PUT',
        body: JSON.stringify({
          score: Number(gradeScore),
          feedback: gradeFeedback.trim(),
        }),
      });
      setGradingSubmissionId(null);
      setGradeScore('');
      setGradeFeedback('');
      if (submissionsModal) {
        await loadSubmissions(submissionsModal.assignmentId);
      }
      await assignmentsQuery.refetch();
    } catch (err: any) {
      alert('حدث خطأ أثناء تقييم التسليم: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!activeQuiz || !currentAttemptId) return;

    try {
      setIsSubmitting(true);
      const timeSpent = quizStartTime
        ? Math.floor((Date.now() - quizStartTime) / 1000)
        : 0;
      const attempt = await submitAttemptMutation.mutateAsync({
        attemptId: currentAttemptId,
        answers: quizAnswers,
        time_spent_seconds: timeSpent,
      });

      const score = Number(attempt.score ?? 0);
      setQuizScoreResult(score);
      setQuizResults((prev) => ({
        ...prev,
        [activeQuiz.id]: {
          score,
          percentage: Number(attempt.percentage ?? 0),
          isPassed: Boolean(attempt.is_passed),
        },
      }));
    } catch (err: any) {
      alert('خطأ أثناء إرسال الكويز: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEvaluationSubmit = async () => {
    if (!evaluatingSurvey) return;

    try {
      setIsSubmitting(true);
      await apiFetch(`/lms/evaluations/${evaluatingSurvey.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ rating: evalRating, comments: evalComment }),
      });

      setEvaluations((prev) =>
        ensureArray<EvaluationSurvey>(prev).map((e) =>
          e.id === evaluatingSurvey.id
            ? { ...e, status: 'completed', rating: evalRating, comments: evalComment }
            : e
        )
      );

      setEvaluatingSurvey(null);
      setEvalComment('');
    } catch (err: any) {
      alert('خطأ أثناء تقديم التقييم: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe Arrays for JSX Rendering
  const safeGroups = ensureArray<EnrolledGroup>(groups);
  const safeModules = ensureArray<Module>(modules);
  const safeAssignments = viewAssignments;
  const safeQuizzes = viewQuizzes;
  const safeGrades = ensureArray<GradeItem>(gradeItems);
  const safeEvaluations = ensureArray<EvaluationSurvey>(evaluations);

  // Render Initial Loader
  if (isLoading && safeGroups.length === 0) {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">جاري تحميل منصة التعلم والبيانات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-background p-4 md:p-8 text-foreground">
      {/* ERROR ALERT */}
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-4 text-destructive border border-destructive/20 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadGroupData(selectedGroupId)}
            className="inline-flex items-center gap-1 font-semibold underline hover:no-underline"
          >
            <RefreshCw className="h-4 w-4" /> إعادة المحاولة
          </button>
        </div>
      )}

      {/* HEADER & GROUP SELECTOR */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
              LMS Portal
            </span>
            {isTeacherOrAdmin && (
              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 border border-amber-500/20">
                Instructor Mode
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            {selectedGroup?.courseTitle ?? 'No specific course'}
          </h1>
          {selectedGroup && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span><strong>Group Code:</strong> {selectedGroup?.code}</span>
              <span>•</span>
              <span><strong>Instructor:</strong> {selectedGroup?.teacherName}</span>
              <span>•</span>
              <span><strong>Schedule:</strong> {selectedGroup?.schedule}</span>
            </p>
          )}
        </div>

        {/* Dynamic Group Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium whitespace-nowrap text-muted-foreground">Select Cohort:</label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            aria-label="Select Enrolled Group"
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {safeGroups.length === 0 ? (
              <option value="">No Groups Found</option>
            ) : (
              safeGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code} - {g.courseTitle}
                </option>
              ))
            )}
          </select>

          {/* Entry points to the dedicated course-content & question-bank pages */}
          {selectedGroupId && (
            <Link
              to={`/student/courses/${selectedGroupId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Folder className="h-4 w-4" />
              Course content
            </Link>
          )}
          {isTeacherOrAdmin && (
            <Link
              to="/instructor/question-bank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <HelpCircle className="h-4 w-4" />
              Question Bank
            </Link>
          )}
        </div>
      </div>

      {/* OVERALL METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Course Progress</span>
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold">{calculatedProgress}%</span>
            <span className="text-xs text-muted-foreground">
              {completedLessonsCount} / {totalLessonsCount} Lessons
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${calculatedProgress}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Weighted Grade</span>
            <Award className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold">{weightedTotalGrade}%</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
              Standing: Pass
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Calculated dynamically from gradebook</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Pending Action Items</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold">
              {safeAssignments.filter((a: any) => !a.submitted).length}
            </span>
            <span className="text-xs text-amber-600 font-medium">Attention Required</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {safeAssignments.filter((a: any) => !a.submitted).length} Homework
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Content Security</span>
            <ShieldCheck className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Dynamic Watermark</span>
            <span className="text-xs rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-indigo-600">Active</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Files protected for user ID #{user?.id || 'Student'}</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="border-b border-border">
        <nav className="flex space-x-6 overflow-x-auto pb-px" aria-label="LMS Sections">
          {[
            { id: 'overview', label: 'Overview & Stats', icon: BarChart3 },
            { id: 'content', label: 'Modules & Lessons', icon: Layers },
            { id: 'assignments', label: 'Assignments', icon: FileText },
            { id: 'quizzes', label: 'Quizzes & Tests', icon: HelpCircle },
            { id: 'gradebook', label: 'Gradebook', icon: GraduationCap },
            { id: 'evaluations', label: 'Evaluations', icon: Star },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* LOADING OVERLAY WHEN SWITCHING COHORTS */}
      {isLoading && safeGroups.length > 0 && (
        <div className="flex h-40 w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading course data...</span>
        </div>
      )}

      {!isLoading && (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-amber-500" /> Course Overview & Highlights
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Welcome to <strong>{selectedGroup?.courseTitle || 'Your Course'}</strong>. Select modules from the tabs above to access study materials, complete pending homework assignments, and submit required course evaluations.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Up Next in Syllabus</h2>
                  {safeModules.flatMap((m) => ensureArray<Lesson>(m.lessons)).filter((l) => !l.completed).length === 0 ? (
                    <p className="text-xs text-muted-foreground">All available lessons completed!</p>
                  ) : (
                    <div className="space-y-3">
                      {safeModules
                        .flatMap((m) => ensureArray<Lesson>(m.lessons))
                        .filter((l) => !l.completed)
                        .slice(0, 3)
                        .map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                            <div className="flex items-center gap-3">
                              <PlayCircle className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium text-sm">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">{lesson.durationMinutes} mins • {ensureArray(lesson.resources).length} resources</p>
                              </div>
                            </div>
                            <button onClick={() => setActiveTab('content')} className="text-xs font-semibold text-primary hover:underline">
                              Open Lesson
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Instructor Info
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-lg">
                      {selectedGroup?.teacherName?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{selectedGroup?.teacherName || 'Not Assigned'}</h3>
                      <p className="text-xs text-muted-foreground">Academic Instructor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODULES & LESSONS */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Course Content & Curriculum</h2>
                  <p className="text-sm text-muted-foreground">Structured learning units fetched live from backend.</p>
                </div>
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewModuleTitle('');
                      setNewModuleDescription('');
                      setShowAddModuleModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" /> Add Module
                  </button>
                )}
              </div>

              {safeModules.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-border p-8">
                  <Folder className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No modules published for this group yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {safeModules.map((module) => {
                    const isExpanded = expandedModules[module.id];
                    const moduleLessons = ensureArray<Lesson>(module.lessons);
                    return (
                      <div key={module.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div
                          onClick={() => toggleModuleAccordion(module.id)}
                          className="flex items-center justify-between p-4 md:p-5 bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                            <Folder className="h-5 w-5 text-primary" />
                            <div>
                              <h3 className="font-semibold text-base">{module.title}</h3>
                              <p className="text-xs text-muted-foreground">{module.description}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">{moduleLessons.length} Lessons</span>
                          {isTeacherOrAdmin && (
                            <button
                              onClick={() => {
                                setAddLessonModuleId(module.id);
                                setNewLessonTitle('');
                                setNewLessonDuration(30);
                                setShowAddLessonModal(true);
                              }}
                              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline ml-2"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Lesson
                            </button>
                          )}
                          {isTeacherOrAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void handleDeleteModule(module.id);
                              }}
                              className="text-destructive hover:text-destructive/90 ml-2"
                              title="Delete module"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="divide-y divide-border border-t border-border">
                            {moduleLessons.map((lesson) => {
                              const lessonResources = ensureArray<Resource>(lesson.resources);
                              return (
                                <div key={lesson.id} className="p-4 md:p-5 space-y-3 bg-card">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => toggleLessonComplete(module.id, lesson.id, !!lesson.completed)}
                                        className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                          lesson.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-input hover:border-primary'
                                        }`}
                                      >
                                        {lesson.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                      </button>
                                      <span className={`font-medium text-sm ${lesson.completed ? 'line-through text-muted-foreground' : ''}`}>
                                        {lesson.title}
                                      </span>
                                      {isTeacherOrAdmin && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            void handleDeleteLesson(
                                              module.id,
                                              lesson.id,
                                            );
                                          }}
                                          className="text-destructive hover:text-destructive/90"
                                          title="Delete lesson"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-muted-foreground">{lesson.durationMinutes} min</span>
                                      {isTeacherOrAdmin && (
                                        <button
                                          onClick={() => setNewResourceModal({ moduleId: module.id, lessonId: lesson.id })}
                                          className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                                        >
                                          <Plus className="h-3.5 w-3.5" /> Attach File
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {lessonResources.length > 0 && (
                                    <div className="pl-8 pt-1 space-y-2">
                                      {lessonResources.map((res) => (
                                        <div key={res.id} className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 border border-border text-xs">
                                          <div className="flex items-center gap-2">
                                            {res.type === 'pdf' && <FileText className="h-4 w-4 text-red-500" />}
                                            {res.type === 'video' && <PlayCircle className="h-4 w-4 text-blue-500" />}
                                            {res.type === 'audio' && <File className="h-4 w-4 text-purple-500" />}
                                            {res.type === 'link' && <ExternalLink className="h-4 w-4 text-emerald-500" />}
                                            {res.type === 'file' && <File className="h-4 w-4 text-amber-500" />}
                                            <span className="font-medium">{res.title}</span>
                                            {res.watermarked && (
                                              <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                                                <Lock className="h-2.5 w-2.5" /> Protected
                                              </span>
                                            )}
                                          </div>
                                          {res.url && (
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  void handleResourceDownload(
                                                    res.downloadPath ?? res.url,
                                                    res.title,
                                                  );
                                                }}
                                                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                                              >
                                                <Download className="h-3.5 w-3.5" /> Open / Download
                                              </button>
                                              {isTeacherOrAdmin && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    void handleDeleteResource(
                                                      res.id,
                                                    );
                                                  }}
                                                  className="text-destructive hover:text-destructive/90"
                                                  title="Delete attachment"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Group Assignments</h2>
                {isTeacherOrAdmin && (
                  <button
                    onClick={() => {
                      setSubmittingAssignment(null);
                      setSubmissionTextInput('');
                      setNewAssignmentTitle('');
                      setNewAssignmentDescription('');
                      setNewAssignmentMaxScore(100);
                      setNewAssignmentDueAt('');
                      setIsCreateAssignmentOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Assignment
                  </button>
                )}
              </div>

              {assignmentsQuery.isLoading ? (
                <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading group assignments...</p>
                </div>
              ) : safeAssignments.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-border p-8">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No assignments for this group yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {safeAssignments.map((asg: any) => {
                    const overdue =
                      asg.status === 'overdue' ||
                      (asg.status === 'pending' &&
                        asg.dueDate &&
                        new Date(asg.dueDate) < new Date() &&
                        !asg.allowLate);
                    const statusVariant =
                      asg.status === 'graded'
                        ? 'success'
                        : asg.status === 'submitted'
                        ? 'info'
                        : asg.status === 'overdue'
                        ? 'destructive'
                        : 'warning';
                    return (
                      <div
                        key={asg.id}
                        className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant={statusVariant}>
                              {asg.status.charAt(0).toUpperCase() + asg.status.slice(1)}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Due:{' '}
                              {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : '—'}
                              {overdue && !asg.submitted && (
                                <span className="text-destructive font-semibold">
                                  • Overdue
                                </span>
                              )}
                            </span>
                          </div>

                          <h3 className="mt-3 font-semibold text-base">
                            {asg.title}
                          </h3>
                          {asg.description && (
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {asg.description}
                            </p>
                          )}

                          {asg.feedback && (
                            <div className="mt-3 rounded-lg bg-emerald-500/5 p-3 text-xs border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                              <p className="font-semibold flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" /> Feedback ({asg.score ?? 0} / {asg.maxScore}):
                              </p>
                              <p className="mt-1">{asg.feedback}</p>
                            </div>
                          )}

                          {asg.submissionDate && !isTeacherOrAdmin && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Submitted:{' '}
                              {new Date(asg.submissionDate).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Max Score: {asg.maxScore}
                          </span>

                          {isTeacherOrAdmin ? (
                            <button
                              onClick={() => openSubmissionsModal(asg.id, asg.title)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" /> Submissions
                            </button>
                          ) : asg.status === 'graded' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" /> Graded
                            </span>
                          ) : asg.submitted ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSubmittingAssignment(asg);
                                setSubmissionTextInput(asg.submittedText || '');
                              }}
                              disabled={overdue && !asg.allowLate}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors ${
                                overdue && !asg.allowLate
                                  ? 'text-muted-foreground bg-muted/50 cursor-not-allowed'
                                  : 'text-primary bg-primary/10 hover:bg-primary/20'
                              }"
                            >
                              <Send className="h-3.5 w-3.5" /> Submit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUIZZES */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Group Quizzes & Tests</h2>
                {isTeacherOrAdmin && (
                  <button
                    onClick={() => {
                      setNewQuizTitle('');
                      setNewQuizDescription('');
                      setNewQuizTimeLimit(30);
                      setNewQuizPassingScore(60);
                      setNewQuizMaxAttempts(1);
                      setIsCreateQuizOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Quiz
                  </button>
                )}
              </div>

              {quizzesQuery.isLoading ? (
                <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading group quizzes...
                  </p>
                </div>
              ) : safeQuizzes.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-border p-8">
                  <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No quizzes for this group yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {safeQuizzes.map((quiz: any) => {
                    const result = quizResults[quiz.id];
                    const statusVariant =
                      quiz.status === 'completed'
                        ? 'success'
                        : 'warning';
                    return (
                      <div
                        key={quiz.id}
                        className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant={statusVariant}>
                              {quiz.status.charAt(0).toUpperCase() +
                                quiz.status.slice(1)}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {quiz.timeLimitMinutes} min
                            </span>
                          </div>

                          <h3 className="mt-3 font-semibold text-base">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {quiz.description}
                            </p>
                          )}

                          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{quiz.questionsCount} Questions</span>
                            <span>•</span>
                            <span>{quiz.totalPoints} Points</span>
                            {result && (
                              <>
                                <span>•</span>
                                <span
                                  className={`font-semibold ${
                                    result.isPassed
                                      ? 'text-emerald-600'
                                      : 'text-amber-600'
                                  }`}
                                >
                                  {result.score} / {quiz.totalPoints}
                                </span>
                              </>
                            )}
                          </div>

                          {result && !isTeacherOrAdmin && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Completed {result.isPassed ? '(Passed)' : '(Pending review)'}
                            </p>
                          )}
                        </div>

                        <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {isTeacherOrAdmin ? (
                            <button
                              onClick={() => {
                                setQuizMode('view');
                                setActiveQuiz(quiz);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <PlayCircle className="h-3.5 w-3.5" /> View
                            </button>
                          ) : result ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" /> Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleStartQuiz(quiz)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors text-primary bg-primary/10 hover:bg-primary/20"
                            >
                              <PlayCircle className="h-3.5 w-3.5" /> Take Quiz
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GRADEBOOK */}
          {activeTab === 'gradebook' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Gradebook</h2>
              {safeGrades.length === 0 ? (
                <p className="text-sm text-muted-foreground">No grades recorded yet.</p>
              ) : (
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                    <span className="font-semibold text-sm">Category Weighting Scheme</span>
                    <span className="text-xs font-bold text-primary">Cumulative Average: {weightedTotalGrade}%</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                        <tr>
                          <th className="p-3.5 pl-5">Category</th>
                          <th className="p-3.5">Component</th>
                          <th className="p-3.5">Weight</th>
                          <th className="p-3.5">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {safeGrades.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/20">
                            <td className="p-3.5 pl-5 font-semibold text-xs">{item.category}</td>
                            <td className="p-3.5 text-muted-foreground">{item.name}</td>
                            <td className="p-3.5 font-medium">{item.weight}%</td>
                            <td className="p-3.5 font-bold">{item.score} / {item.maxScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: EVALUATIONS */}
          {activeTab === 'evaluations' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Course Surveys & Teacher Evaluations</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {safeEvaluations.map((ev) => (
                  <div key={ev.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ev.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {ev.status}
                      </span>
                      <span className="text-xs text-muted-foreground">Target: {ev.targetName}</span>
                    </div>

                    <h3 className="font-semibold text-base">{ev.title}</h3>

                    {ev.status === 'completed' ? (
                      <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1 border border-border">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < (ev.rating || 0) ? 'fill-amber-400' : 'text-muted'}`} />
                          ))}
                        </div>
                        {ev.comments && <p className="text-muted-foreground italic mt-1">"{ev.comments}"</p>}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEvaluatingSurvey(ev);
                          setEvalRating(5);
                          setEvalComment('');
                        }}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors mt-2"
                      >
                        <Star className="h-4 w-4" /> Start Evaluation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: CREATE ASSIGNMENT (teacher) */}
      {isCreateAssignmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Create Assignment</h3>
              <button
                onClick={() => setIsCreateAssignmentOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateAssignment(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newAssignmentTitle}
                  onChange={(e) => setNewAssignmentTitle(e.target.value)}
                  placeholder="Assignment title"
                  required
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={3}
                  value={newAssignmentDescription}
                  onChange={(e) => setNewAssignmentDescription(e.target.value)}
                  placeholder="Describe the assignment..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Max Score
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newAssignmentMaxScore}
                    onChange={(e) => setNewAssignmentMaxScore(Number(e.target.value) || 100)}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newAssignmentDueAt}
                    onChange={(e) => setNewAssignmentDueAt(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateAssignmentOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-input"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAssignment || !newAssignmentTitle.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
                >
                  {isCreatingAssignment && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE QUIZ (teacher) */}
      {isCreateQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Create Quiz</h3>
              <button
                onClick={() => setIsCreateQuizOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateQuiz(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  placeholder="Quiz title"
                  required
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newQuizDescription}
                  onChange={(e) => setNewQuizDescription(e.target.value)}
                  placeholder="Describe the quiz..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newQuizTimeLimit}
                    onChange={(e) => setNewQuizTimeLimit(Number(e.target.value) || 30)}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Passing Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newQuizPassingScore}
                    onChange={(e) => setNewQuizPassingScore(Number(e.target.value) || 60)}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newQuizMaxAttempts}
                    onChange={(e) => setNewQuizMaxAttempts(Number(e.target.value) || 1)}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateQuizOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-input"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingQuiz || !newQuizTitle.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
                >
                  {isCreatingQuiz && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT ASSIGNMENT */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Submit Solution</h3>
              <button onClick={() => setSubmittingAssignment(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              rows={5}
              value={submissionTextInput}
              onChange={(e) => setSubmissionTextInput(e.target.value)}
              placeholder="Type your response to send to backend API..."
              className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setSubmittingAssignment(null)} className="px-4 py-2 text-xs font-semibold rounded-lg border border-input">
                Cancel
              </button>
              <button
                onClick={handleAssignmentSubmit}
                disabled={isSubmitting || !submissionTextInput.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW SUBMISSIONS & GRADE (teacher) */}
      {submissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 my-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Submissions</h3>
                <p className="text-sm text-muted-foreground">
                  {submissionsModal.assignmentTitle}
                </p>
              </div>
              <button
                onClick={() => setSubmissionsModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingSubmissions ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No submissions yet.
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => {
                  const graded = sub.status === 'graded';
                  return (
                    <div
                      key={sub.id}
                      className="rounded-lg border border-border p-4 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {sub.content || '(no text response)'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sub.file_name || sub.file_url || '—'}
                          {sub.submitted_at && (
                            <>
                              {' '}
                              • {new Date(sub.submitted_at).toLocaleString()}
                            </>
                          )}
                          {sub.is_late && (
                            <span className="text-destructive font-bold"> (late)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            graded
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}
                        >
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </span>
                        {graded ? (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {sub.grade ?? 0} / {sub.max_score ?? 100}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setGradingSubmissionId(sub.id);
                              setGradeScore(String(sub.grade ?? ''));
                              setGradeFeedback(sub.feedback || '');
                            }}
                            disabled={gradingSubmissionId === sub.id && isSubmitting}
                            className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg px-2.5 py-1 transition-colors"
                          >
                            Grade
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {gradingSubmissionId && (
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold">Grade Submission</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Score
                    </label>
                    <input
                      type="number"
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                      min="0"
                      className="w-full rounded-lg border border-input bg-background p-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Feedback
                    </label>
                    <textarea
                      rows={2}
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background p-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setGradingSubmissionId(null);
                      setGradeScore('');
                      setGradeFeedback('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-input"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGradeSubmission}
                    disabled={isSubmitting || !gradeScore.trim()}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSubmitting && gradingSubmissionId && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Save Grade
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: QUIZ PLAYER */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold">{activeQuiz.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {activeQuiz.timeLimitMinutes} min • {activeQuiz.questionsCount} questions • {activeQuiz.totalPoints} pts
                </p>
              </div>
              <button onClick={() => setActiveQuiz(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {quizScoreResult !== null ? (
              <div className="text-center py-8 space-y-4">
                <Award className="h-12 w-12 text-emerald-500 mx-auto" />
                <h4 className="text-xl font-bold">
                  {quizMode === 'take' ? 'Quiz Submitted' : 'Quiz Results'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Score: {quizScoreResult} / {activeQuiz.totalPoints} Points
                </p>
                <button onClick={() => setActiveQuiz(null)} className="px-6 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground">
                  Close
                </button>
              </div>
            ) : quizMode === 'view' ? (
              <div className="space-y-6">
                <p className="text-xs text-muted-foreground">Instructor view — questions and correct answers.</p>
                {ensureArray<Question>(activeQuiz?.questions).map((q, idx) => (
                  <div key={q.id} className="space-y-3 rounded-lg border border-border p-4 bg-muted/20">
                    <p className="font-semibold text-sm">
                      Question {idx + 1} ({q.points} pts): {q.text}
                    </p>
                    {q.options && (
                      <div className="space-y-2 pt-1">
                        {ensureArray<string>(q.options).map((opt, optIdx) => (
                          <div
                            key={`${q.id}-${opt}-${optIdx}`}
                            className={`flex items-center gap-2 text-xs p-2.5 rounded-md border ${
                              String(opt) === String(q.correctAnswer)
                                ? 'border-emerald-500 bg-emerald-500/5'
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            {String(opt) === String(q.correctAnswer) && (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'short_answer' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Correct answer: {String(q.correctAnswer ?? '—')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {ensureArray<Question>(activeQuiz?.questions).map((q, idx) => (
                  <div key={q.id} className="space-y-3 rounded-lg border border-border p-4 bg-muted/20">
                    <p className="font-semibold text-sm">
                      Question {idx + 1} ({q.points} pts): {q.text}
                    </p>
                    {q.options && (
                      <div className="space-y-2 pt-1">
                        {ensureArray<string>(q.options).map((opt, optIdx) => (
                          <label key={`${q.id}-${opt}-${optIdx}`} className="flex items-center gap-2 text-xs p-2.5 rounded-md border border-border cursor-pointer hover:bg-muted/50">
                            <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={quizAnswers[q.id] === opt}
                              onChange={() =>
                                setQuizAnswers({ ...quizAnswers, [q.id]: opt })
                            }
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === 'short_answer' && (
                      <div className="pt-1">
                        <input
                          type="text"
                          value={quizAnswers[q.id] ?? ''}
                          onChange={(e) =>
                            setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })
                          }
                          placeholder="Type your answer..."
                          className="w-full rounded-lg border border-input bg-background p-2 text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleQuizSubmit}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit Answers
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EVALUATION SURVEY */}
      {evaluatingSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{evaluatingSurvey.title}</h3>
              <button onClick={() => setEvaluatingSurvey(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2 text-amber-400 cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} onClick={() => setEvalRating(star)} className={`h-7 w-7 ${star <= evalRating ? 'fill-amber-400' : 'text-muted'}`} />
              ))}
            </div>
            <textarea
              rows={4}
              value={evalComment}
              onChange={(e) => setEvalComment(e.target.value)}
              placeholder="Feedback comments..."
              className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setEvaluatingSurvey(null)} className="px-4 py-2 text-xs font-semibold rounded-lg border border-input">
                Cancel
              </button>
              <button
                onClick={handleEvaluationSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground flex items-center gap-1"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit Evaluation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ATTACH RESOURCE */}
      {newResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Attach Resource</h3>
              <button onClick={() => { setSelectedFile(null); setNewResourceModal(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="File title"
              value={newResourceTitle}
              onChange={(e) => setNewResourceTitle(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
            />
            <select
              value={newResourceType}
              onChange={(e) => setNewResourceType(e.target.value as ResourceType)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="pdf">PDF Document</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="link">Link</option>
              <option value="file">File</option>
            </select>
            <label className="block text-sm font-medium">File</label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
                if (file && !newResourceTitle.trim()) setNewResourceTitle(file.name);
              }}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="h-3 w-3" />
                <span className="truncate">{selectedFile.name}</span>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setSelectedFile(null); setNewResourceModal(null); }} className="px-4 py-2 text-xs font-semibold rounded-lg border border-input">
                Cancel
              </button>
              <button
                onClick={handleAddResource}
                disabled={isSubmitting || !newResourceTitle.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground flex items-center gap-1"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Resource
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MODULE */}
      {showAddModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Module</h3>
              <button onClick={() => setShowAddModuleModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newModuleTitle.trim()) return;
              setIsSubmitting(true);
              apiFetch<Module>('/lms/modules', {
                method: 'POST',
                body: JSON.stringify({
                  title: newModuleTitle.trim(),
                  description: newModuleDescription.trim() || '',
                  group_id: selectedGroupId,
                  order_index: safeModules.length + 1,
                }),
              })
                .then((newMod) => {
                  setModules([...safeModules, newMod]);
                  setShowAddModuleModal(false);
                  setNewModuleTitle('');
                  setNewModuleDescription('');
                })
                .catch((err: any) => {
                  alert('Error adding module: ' + err.message);
                })
                .finally(() => {
                  setIsSubmitting(false);
                });
            }}
            className="space-y-4"
          >
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                placeholder="Module title"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                required
              />
              <label className="block text-sm font-medium">Description</label>
              <textarea
                placeholder="Module description"
                value={newModuleDescription}
                onChange={(e) => setNewModuleDescription(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModuleModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-input"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newModuleTitle.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground flex items-center gap-1"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Add Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LESSON */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Lesson</h3>
              <button onClick={() => setShowAddLessonModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Lesson title"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={newLessonDuration}
              onChange={(e) => setNewLessonDuration(Number(e.target.value) || 30)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddLessonModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg border border-input">
                Cancel
              </button>
              <button
                onClick={handleAddLesson}
                disabled={isSubmitting || !newLessonTitle.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground flex items-center gap-1"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Add Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}