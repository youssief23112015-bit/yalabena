import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ExternalLink, Receipt } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChatToast } from "@/hooks/useChatToast";
import {
  fetchPublicCourses,
  registerPublicStudent,
  type PublicRegistrationResult,
} from "@/api/public";

const schema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  phone: z.string().min(8, "Valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  course_id: z.string().min(1, "Course is required"),
  level_interest: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterOnlinePage() {
  const { t } = useTranslation();
  const { pushToast } = useChatToast();
  const [searchParams] = useSearchParams();
  const preselectedCourse = searchParams.get("course") ?? "";
  const [result, setResult] = useState<PublicRegistrationResult | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["public-courses"],
    queryFn: fetchPublicCourses,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { course_id: preselectedCourse },
    });

  const watchedCourse = watch("course_id");

  const mutation = useMutation({
    mutationFn: registerPublicStudent,
    onSuccess: (data) => {
      setResult(data);
      reset();
      pushToast({
        kind: "info",
        message: t("public.registerOnline.success", "Registration received! Complete payment to confirm your seat."),
      });
    },
    onError: () => {
      pushToast({
        kind: "error",
        message: t("public.registerOnline.error", "Registration failed. Please try again."),
      });
    },
  });

  const onSubmit = (data: FormData) => {
    setResult(null);
    mutation.mutate({
      ...data,
      email: data.email || undefined,
      level_interest: data.level_interest || undefined,
    });
  };

  const selectedCourse = (courses ?? []).find((c) => c.id === watchedCourse);

  return (
    <PublicLayout>
      <title>{t("public.seo.registerTitle", "Register Online — Speak Up Academy")}</title>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold">
            {t("public.registerOnline.title", "Register Online")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("public.registerOnline.subtitle", "Pick a course, and we will create your invoice instantly.")}
          </p>
        </div>
        {result && (
          <Card className="mb-8 border-green-300 bg-green-50">
            <CardContent className="p-6 text-green-900">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Receipt className="h-5 w-5" />
                {t("public.registerOnline.invoiceTitle", "Invoice Created")}
              </h2>
              <p className="mt-2 text-sm">
                {t("public.registerOnline.invoiceNumber", "Invoice")}:{" "}
                <span className="font-mono font-semibold">{result.invoice_number}</span>
              </p>
              <p className="text-sm">
                {t("public.registerOnline.amount", "Amount")}:{" "}
                <span className="font-semibold">
                  {result.amount} {result.currency}
                </span>
              </p>
              {result.student_id && (
                <p className="text-sm">
                  {t("public.registerOnline.studentCreated", "A student account has been created for you.")}
                </p>
              )}
              {result.easykash_payment_url && (
                <Button asChild className="mt-4">
                  <a href={result.easykash_payment_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("public.registerOnline.payNow", "Pay Online Now")}
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Input
                    placeholder={t("public.leadForm.firstName", "First Name")}
                    {...register("first_name")}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder={t("public.leadForm.lastName", "Last Name")}
                    {...register("last_name")}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Input
                    placeholder={t("public.leadForm.phone", "Phone Number")}
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                  )}
                </div>
                <Input
                  type="email"
                  placeholder={t("public.leadForm.email", "Email (Optional)")}
                  {...register("email")}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Select value={watchedCourse} onValueChange={(val) => setValue("course_id", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("public.registerOnline.course", "Course")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(courses ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.course_id && (
                    <p className="mt-1 text-xs text-red-500">{errors.course_id.message}</p>
                  )}
                </div>
              </div>

              {selectedCourse && (
                <p className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {selectedCourse.duration_hours} {t("public.courses.hours", "hrs")} ·{" "}
                  {selectedCourse.default_price} {t("public.courses.egp", "EGP")}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending
                  ? t("public.registerOnline.submitting", "Submitting...")
                  : t("public.registerOnline.submit", "Complete Registration")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}