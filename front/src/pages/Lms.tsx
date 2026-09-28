import  { useState, useEffect, useMemo, useCallback } from 'react';
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
  FileSpreadsheet,
  Layers,
} from 'lucide-react';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type ResourceType = 'pdf' | 'video' | 'audio' | 'link' | 'doc';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
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

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const getToken = (): string | null => {
    const authData = localStorage.getItem('speakup-auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed?.state?.accessToken || null;
      } catch {
        return null;
      }
    }
    return localStorage.getItem('lms_token');
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
      localStorage.removeItem('speakup-auth');
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_user');
      
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
    ['super_admin', 'academic', 'branch_manager', 'teacher'].includes(r)
  );

  // Active UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'assignments' | 'quizzes' | 'gradebook' | 'evaluations'>('overview');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // Data States (All dynamic from Backend)
  const [groups, setGroups] = useState<EnrolledGroup[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
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

  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionTextInput, setSubmissionTextInput] = useState('');

  const [evaluatingSurvey, setEvaluatingSurvey] = useState<EvaluationSurvey | null>(null);
  const [evalRating, setEvalRating] = useState<number>(5);
  const [evalComment, setEvalComment] = useState('');

  const [newResourceModal, setNewResourceModal] = useState<{ moduleId: string; lessonId: string } | null>(null);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState<ResourceType>('pdf');

  // 1. Fetch Enrolled Groups on Load
  useEffect(() => {
    async function fetchUserGroups() {
      try {
        setIsLoading(true);
        setError(null);
        const rawRes = await apiFetch<any>('/lms/groups');
        const fetchedGroups = ensureArray<EnrolledGroup>(rawRes);
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

      // Fetch all dynamic tabs in parallel
      const [rawModules, rawAssignments, rawQuizzes, rawGrades, rawEvals] = await Promise.all([
        apiFetch<any>(`/lms/groups/${groupId}/modules`),
        apiFetch<any>(`/lms/groups/${groupId}/assignments`),
        apiFetch<any>(`/lms/groups/${groupId}/quizzes`),
        apiFetch<any>(`/lms/groups/${groupId}/grades`),
        apiFetch<any>(`/lms/groups/${groupId}/evaluations`),
      ]);

      const modulesRes = ensureArray<Module>(rawModules);
      const assignmentsRes = ensureArray<Assignment>(rawAssignments);
      const quizzesRes = ensureArray<Quiz>(rawQuizzes);
      const gradeItemsRes = ensureArray<GradeItem>(rawGrades);
      const evaluationsRes = ensureArray<EvaluationSurvey>(rawEvals);

      setModules(modulesRes);
      setAssignments(assignmentsRes);
      setQuizzes(quizzesRes);
      setGradeItems(gradeItemsRes);
      setEvaluations(evaluationsRes);

      // Auto expand first module
      if (modulesRes.length > 0) {
        setExpandedModules({ [modulesRes[0].id]: true });
      }
    } catch (err: any) {
      setModules([]);
      setAssignments([]);
      setQuizzes([]);
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
      const createdResource = await apiFetch<Resource>(
        `/lms/modules/${newResourceModal.moduleId}/lessons/${newResourceModal.lessonId}/resources`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: newResourceTitle,
            type: newResourceType,
          }),
        }
      );

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
      setNewResourceModal(null);
    } catch (err: any) {
      alert('خطأ أثناء إضافة الملف: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!submittingAssignment || !submissionTextInput.trim()) return;

    try {
      setIsSubmitting(true);
      const updatedAssignment = await apiFetch<Assignment>(
        `/lms/assignments/${submittingAssignment.id}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ textResponse: submissionTextInput }),
        }
      );

      setAssignments((prev) =>
        ensureArray<Assignment>(prev).map((a) => (a.id === submittingAssignment.id ? updatedAssignment : a))
      );

      setSubmittingAssignment(null);
      setSubmissionTextInput('');
    } catch (err: any) {
      alert('حدث خطأ أثناء تسليم الواجب: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!activeQuiz) return;

    try {
      setIsSubmitting(true);
      const result = await apiFetch<{ score: number; passed: boolean }>(
        `/lms/quizzes/${activeQuiz.id}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answers: quizAnswers }),
        }
      );

      setQuizScoreResult(result.score);
      setQuizzes((prev) =>
        ensureArray<Quiz>(prev).map((q) =>
          q.id === activeQuiz.id
            ? { ...q, status: 'completed', score: result.score }
            : q
        )
      );
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
  const safeAssignments = ensureArray<Assignment>(assignments);
  const safeQuizzes = ensureArray<Quiz>(quizzes);
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
            {selectedGroup ? selectedGroup.courseTitle : 'لا توجد دورة محددة'}
          </h1>
          {selectedGroup && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span><strong>Group Code:</strong> {selectedGroup.code}</span>
              <span>•</span>
              <span><strong>Instructor:</strong> {selectedGroup.teacherName}</span>
              <span>•</span>
              <span><strong>Schedule:</strong> {selectedGroup.schedule}</span>
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
              {safeAssignments.filter((a) => !a.submitted).length + safeQuizzes.filter((q) => q.status === 'available').length}
            </span>
            <span className="text-xs text-amber-600 font-medium">Attention Required</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {safeAssignments.filter((a) => !a.submitted).length} Homework, {safeQuizzes.filter((q) => q.status === 'available').length} Quizzes
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
                    onClick={async () => {
                      const title = prompt('Enter Module Title:');
                      if (!title) return;
                      try {
                        const newMod = await apiFetch<Module>(`/lms/groups/${selectedGroupId}/modules`, {
                          method: 'POST',
                          body: JSON.stringify({ title, description: 'New Module' }),
                        });
                        setModules([...safeModules, newMod]);
                      } catch (err: any) {
                        alert('Error adding module: ' + err.message);
                      }
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
                                            {res.type === 'doc' && <FileSpreadsheet className="h-4 w-4 text-amber-500" />}
                                            <span className="font-medium">{res.title}</span>
                                            {res.watermarked && (
                                              <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                                                <Lock className="h-2.5 w-2.5" /> Protected
                                              </span>
                                            )}
                                          </div>
                                          <a
                                            href={res.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                                          >
                                            <Download className="h-3.5 w-3.5" /> Open / Download
                                          </a>
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
              <h2 className="text-xl font-bold">Group Assignments</h2>
              {safeAssignments.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-border p-8">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No assignments pending for this course.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {safeAssignments.map((asg) => (
                    <div key={asg.id} className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            asg.status === 'graded' ? 'bg-emerald-500/10 text-emerald-600' : asg.status === 'submitted' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {asg.status}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> Due: {asg.dueDate}
                          </span>
                        </div>

                        <h3 className="mt-3 font-semibold text-base">{asg.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{asg.description}</p>

                        {asg.feedback && (
                          <div className="mt-3 rounded-lg bg-emerald-500/5 p-3 text-xs border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                            <p className="font-semibold flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" /> Feedback ({asg.score} / {asg.maxScore}):
                            </p>
                            <p className="mt-1">{asg.feedback}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Max Score: {asg.maxScore}</span>
                        {!asg.submitted ? (
                          <button
                            onClick={() => {
                              setSubmittingAssignment(asg);
                              setSubmissionTextInput('');
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Upload className="h-3.5 w-3.5" /> Submit Homework
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Submitted
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUIZZES */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Course Quizzes & Exams</h2>
              {safeQuizzes.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-border p-8">
                  <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No quizzes currently active.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {safeQuizzes.map((quiz) => (
                    <div key={quiz.id} className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            quiz.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'
                          }`}>
                            {quiz.status}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {quiz.timeLimitMinutes} Mins
                          </span>
                        </div>

                        <h3 className="mt-3 font-semibold text-base">{quiz.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{quiz.description}</p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                        {quiz.status === 'completed' ? (
                          <div className="text-xs font-semibold text-emerald-600">
                            Score Achieved: {quiz.score} / {quiz.totalPoints}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveQuiz(quiz);
                              setQuizAnswers({});
                              setQuizScoreResult(null);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
                          >
                            <PlayCircle className="h-4 w-4" /> Start Assessment
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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

      {/* MODAL: QUIZ PLAYER */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold">{activeQuiz.title}</h3>
              <button onClick={() => setActiveQuiz(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {quizScoreResult === null ? (
              <div className="space-y-6">
                {ensureArray<Question>(activeQuiz.questions).map((q, idx) => (
                  <div key={q.id} className="space-y-3 rounded-lg border border-border p-4 bg-muted/20">
                    <p className="font-semibold text-sm">
                      Question {idx + 1} ({q.points} pts): {q.text}
                    </p>
                    {q.options && (
                      <div className="space-y-2 pt-1">
                        {ensureArray<string>(q.options).map((opt) => (
                          <label key={opt} className="flex items-center gap-2 text-xs p-2.5 rounded-md border border-border cursor-pointer hover:bg-muted/50">
                            <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={quizAnswers[q.id] === opt}
                              onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
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
            ) : (
              <div className="text-center py-8 space-y-4">
                <Award className="h-12 w-12 text-emerald-500 mx-auto" />
                <h4 className="text-xl font-bold">Quiz Processed by Backend!</h4>
                <p className="text-sm text-muted-foreground">Score: {quizScoreResult} Points</p>
                <button onClick={() => setActiveQuiz(null)} className="px-6 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground">
                  Close
                </button>
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
              <button onClick={() => setNewResourceModal(null)} className="text-muted-foreground hover:text-foreground">
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
              <option value="doc">Document</option>
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setNewResourceModal(null)} className="px-4 py-2 text-xs font-semibold rounded-lg border border-input">
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
    </div>
  );
}