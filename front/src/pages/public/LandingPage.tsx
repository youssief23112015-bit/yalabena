import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Star, Users, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicLayout } from "@/components/public/PublicLayout";
import { LeadCaptureForm } from "@/components/public/LeadCaptureForm";
import { fetchPublicCourses, fetchPublicTestimonials } from "@/api/public";
import type { Course } from "@/types";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-blue-100 text-blue-800",
  B1: "bg-yellow-100 text-yellow-800",
  B2: "bg-orange-100 text-orange-800",
  C1: "bg-red-100 text-red-800",
  C2: "bg-purple-100 text-purple-800",
};

export default function LandingPage() {
  const { t } = useTranslation();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["public-courses"],
    queryFn: fetchPublicCourses,
  });

  const { data: testimonials } = useQuery({
    queryKey: ["public-testimonials"],
    queryFn: fetchPublicTestimonials,
  });

  const features = [
    { icon: Users, title: t("public.features.experienced", "Expert Teachers"), desc: t("public.features.experiencedDesc", "Certified native and fluent instructors") },
    { icon: Clock, title: t("public.features.flexible", "Flexible Schedule"), desc: t("public.features.flexibleDesc", "Morning, evening & weekend classes") },
    { icon: Award, title: t("public.features.certified", "Certified Courses"), desc: t("public.features.certifiedDesc", "Internationally recognized certificates") },
  ];

  return (
    <PublicLayout>
      {/* SEO meta */}
      <title>{t("public.seo.homeTitle", "Speak Up Academy — Learn English with Confidence")}</title>
      <meta name="description" content={t("public.seo.homeDesc", "Join Speak Up Academy. English courses from A1 to C2, placement tests, certified teachers.")} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <Badge className="mb-4" variant="secondary">
                {t("public.hero.badge", "Enrolling Now — All Levels")}
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
                {t("public.hero.title", "Master English with")}
                <span className="text-primary"> {t("public.hero.titleHighlight", "Confidence")}</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                {t("public.hero.subtitle", "From beginner to advanced, our certified teachers help you speak fluently. Join thousands of successful students.")}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild size="lg">
                  <Link to="/register-online">
                    {t("public.hero.ctaRegister", "Register Now")}
                    <ArrowRight className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/placement-booking">{t("public.hero.ctaTest", "Book Free Placement Test")}</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="/hero-illustration.svg"
                alt=""
                className="w-full max-w-lg rounded-2xl shadow-2xl"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Courses preview */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">{t("public.courses.title", "Our Courses")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("public.courses.subtitle", "Find the perfect level for your journey")}
            </p>
          </div>

          {coursesLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {(courses ?? []).slice(0, 6).map((course: Course) => (
                <Card key={course.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <Badge className={LEVEL_COLORS[course.level] ?? "bg-gray-100 text-gray-800"}>
                        {course.level}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {course.duration_hours} {t("public.courses.hours", "hrs")}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold">{course.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {course.description ?? course.syllabus}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {course.default_price} {t("public.courses.egp", "EGP")}
                      </span>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/courses/${course.id}`}>{t("public.courses.viewDetails", "Details")}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/courses">{t("public.courses.viewAll", "View All Courses")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="mb-10 text-center text-3xl font-bold">
            {t("public.testimonials.title", "What Our Students Say")}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.slice(0, 3).map((tm) => (
              <Card key={tm.id}>
                <CardContent className="pt-6">
                  <div className="mb-3 flex gap-1">
                    {[...Array(tm.rating ?? 5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">"{tm.content}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {tm.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tm.name}</p>
                      {tm.role && <p className="text-xs text-muted-foreground">{tm.role}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Lead capture */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold">{t("public.leadForm.title", "Get Started Today")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("public.leadForm.subtitle", "Leave your details and our team will contact you within 24 hours.")}
            </p>
          </div>
          <LeadCaptureForm />
        </div>
      </section>
    </PublicLayout>
  );
}