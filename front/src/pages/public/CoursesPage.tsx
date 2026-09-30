import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/components/public/PublicLayout";
import { fetchPublicCourses } from "@/api/public";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@/types";

export default function CoursesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["public-courses"],
    queryFn: fetchPublicCourses,
  });

  const filtered = (courses ?? []).filter((c: Course) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesLevel = selectedLevel === "all" || c.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold">{t("public.coursesPage.title", "Explore Our English Courses")}</h1>
          <p className="mt-2 text-muted-foreground">{t("public.coursesPage.subtitle", "Certified structured courses designed for fluency.")}</p>
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder={t("public.coursesPage.search", "Search courses...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            {["all", "A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
              <Button
                key={lvl}
                variant={selectedLevel === lvl ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel(lvl)}
              >
                {lvl === "all" ? t("public.coursesPage.allLevels", "All Levels") : lvl}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-64" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            {t("public.coursesPage.noCourses", "No courses found matching your filters.")}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {filtered.map((course: Course) => (
              <Card key={course.id} className="flex flex-col justify-between transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="secondary">{course.level}</Badge>
                    <span className="text-sm text-muted-foreground">{course.duration_hours} {t("public.courses.hours", "hrs")}</span>
                  </div>
                  <h3 className="text-xl font-semibold">{course.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.description ?? course.syllabus}</p>
                </CardContent>
                <div className="border-t p-6 pt-4 flex items-center justify-between bg-muted/20">
                  <span className="text-xl font-bold text-primary">{course.default_price} {t("public.courses.egp", "EGP")}</span>
                  <Button asChild size="sm">
                    <Link to={`/courses/${course.id}`}>{t("public.courses.viewDetails", "Details")}</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}