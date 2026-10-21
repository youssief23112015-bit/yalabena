import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen, Clock, Loader2 } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { fetchPublicCourse } from "@/api/public";
import { studentsApi } from "@/api/students";
import { enrollmentsApi } from "@/api/enrollments";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { isCourseLevelEligible, levelIneligibilityMessage } from "@/lib/levels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-blue-100 text-blue-800",
  B1: "bg-yellow-100 text-yellow-800",
  B2: "bg-orange-100 text-orange-800",
  C1: "bg-red-100 text-red-800",
  C2: "bg-purple-100 text-purple-800",
};

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const userRoles: string[] = Array.isArray(user?.roles)
    ? (user?.roles as string[])
    : user?.role
      ? [user.role]
      : [];
  const isStudent = userRoles.includes("student");

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ["public-course", id],
    queryFn: () => fetchPublicCourse(id as string),
    enabled: Boolean(id),
    retry: false,
  });

  // Student booking context: own profile (current_level) + own enrollment requests
  const { data: myProfile } = useQuery({
    queryKey: ["student-me"],
    queryFn: () => studentsApi.me(),
    enabled: isAuthenticated && isStudent,
    retry: false,
  });
  const { data: myEnrollments } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentsApi.my(),
    enabled: isAuthenticated && isStudent,
  });

  const currentLevel: string | undefined = myProfile?.current_level;
  const levelEligible = isCourseLevelEligible(currentLevel, course?.level);
  const levelBlockedMessage =
    currentLevel && course?.level
      ? levelIneligibilityMessage(currentLevel, course.level)
      : t(
          "public.courseDetail.ineligibleGeneric",
          "Ineligible Level: this course does not match your assigned level.",
        );

  const existingEnrollment = (myEnrollments ?? []).find(
    (e: any) =>
      e?.group?.course_id === course?.id &&
      ["pending", "active"].includes(String(e?.status ?? "").toLowerCase()),
  );
  const existingStatus = String(existingEnrollment?.status ?? "").toLowerCase();

  const bookMutation = useMutation({
    mutationFn: () => enrollmentsApi.book({ course_id: course!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      toast({
        title: t("public.courseDetail.bookedTitle", "Booking Submitted"),
        description: t(
          "public.courseDetail.bookedDesc",
          "Enrollment request submitted for admin approval.",
        ),
      });
    },
    onError: (e: any) =>
      toast({
        variant: "destructive",
        title: t("public.courseDetail.bookErrorTitle", "Booking Failed"),
        description: e?.message,
      }),
  });

  return (
    <PublicLayout>
      <title>{course?.name ?? t("public.seo.courseTitle", "Course — Speak Up Academy")}</title>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/catalog">
            <ArrowLeft className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
            {t("public.courseDetail.back", "Back to Courses")}
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-64" />
          </div>
        ) : isError || !course ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">
              {t("public.courseDetail.notFound", "This course was not found or is no longer available.")}
            </p>
            <Button asChild className="mt-6">
              <Link to="/catalog">{t("public.courseDetail.browseAll", "Browse All Courses")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={LEVEL_COLORS[course.level] ?? "bg-gray-100 text-gray-800"}>
                {course.level}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {course.duration_hours} {t("public.courses.hours", "hrs")}
              </span>
              {course.min_age != null && course.max_age != null && (
                <span className="text-sm text-muted-foreground">
                  {t("public.courseDetail.age", "Ages")} {course.min_age}–{course.max_age}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              {course.name}
            </h1>

            <p className="mt-4 text-2xl font-bold text-primary">
              {course.default_price} {t("public.courses.egp", "EGP")}
            </p>

            {(course.description || course.syllabus) && (
              <Card className="mt-8">
                <CardContent className="p-6">
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <BookOpen className="h-5 w-5" />
                    {t("public.courseDetail.about", "About This Course")}
                  </h2>
                  <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
                    {course.description || course.syllabus}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="mt-10 flex flex-wrap gap-4">
              {!isAuthenticated || !isStudent ? (
                // Guests & staff keep the online registration flow
                <Button asChild size="lg">
                  <Link to={`/register-online?course=${course.id}`}>
                    {isAuthenticated
                      ? t("public.courseDetail.book", "Book this Course")
                      : t("public.courseDetail.register", "Register for This Course")}
                  </Link>
                </Button>
              ) : existingStatus === "active" ? (
                // Already approved -> straight to the LMS dashboard
                <Button asChild size="lg">
                  <Link to="/lms">
                    {t("public.courseDetail.goToLms", "Go to My Courses (LMS)")}
                  </Link>
                </Button>
              ) : existingStatus === "pending" ? (
                <Button size="lg" disabled>
                  {t("public.courseDetail.pendingApproval", "Request Pending Approval")}
                </Button>
              ) : !levelEligible ? (
                // Ineligible level -> disabled with an explanatory tooltip
                // (wrapped in a span: disabled buttons swallow pointer events,
                //  which would prevent the tooltip from ever opening)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-block" aria-disabled="true">
                      <Button size="lg" disabled>
                        {t("public.courseDetail.book", "Book this Course")}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {levelBlockedMessage}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  size="lg"
                  disabled={bookMutation.isPending || !course}
                  onClick={() => bookMutation.mutate()}
                >
                  {bookMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:mr-0 rtl:ml-2" />
                  )}
                  {t("public.courseDetail.book", "Book this Course")}
                </Button>
              )}
              <Button asChild variant="outline" size="lg">
                <Link
                  to={`/placement-booking?courseId=${course.id}`}
                >
                  {t("public.hero.ctaPlacement", "Book a Placement Test")}
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}