import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { fetchPublicCourse } from "@/api/public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ["public-course", id],
    queryFn: () => fetchPublicCourse(id as string),
    enabled: Boolean(id),
    retry: false,
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

            {course.branch_pricing && course.branch_pricing.length > 0 && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h2 className="mb-3 text-lg font-semibold">
                    {t("public.courseDetail.branchPricing", "Branch Pricing")}
                  </h2>
                  <ul className="space-y-2 text-sm">
                    {course.branch_pricing.map((bp) => (
                      <li key={bp.id} className="flex items-center justify-between border-b pb-2">
                        <span>{bp.branch?.name ?? bp.branch_id}</span>
                        <span className="font-semibold text-primary">
                          {bp.price} {t("public.courses.egp", "EGP")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link to={`/register-online?course=${course.id}`}>
                  {t("public.courseDetail.register", "Register for This Course")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/placement-booking">
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