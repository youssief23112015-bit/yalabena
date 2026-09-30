import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useChatToast } from "@/hooks/useChatToast";
import { capturePublicLead, fetchPublicBranches } from "@/api/public";

const schema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  phone: z.string().min(8, "Valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  level_interest: z.string().optional(),
  branch_id: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function LeadCaptureForm() {
  const { t } = useTranslation();
  const { pushToast } = useChatToast();

  const { data: branches } = useQuery({
    queryKey: ["public-branches"],
    queryFn: fetchPublicBranches,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: capturePublicLead,
    onSuccess: () => {
      pushToast({ kind: "info", message: t("public.leadForm.success", "Thank you! We will contact you soon.") });
      reset();
    },
    onError: () => {
      pushToast({ kind: "error", message: t("public.leadForm.error", "Something went wrong. Please try again.") });
    },
  });
  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      email: data.email || undefined,
      level_interest: data.level_interest || undefined,
      branch_id: data.branch_id || undefined,
      notes: data.notes || undefined,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Input placeholder={t("public.leadForm.firstName", "First Name")} {...register("first_name")} />
              {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div>
              <Input placeholder={t("public.leadForm.lastName", "Last Name")} {...register("last_name")} />
              {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Input placeholder={t("public.leadForm.phone", "Phone Number")} {...register("phone")} />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div>
              <Input type="email" placeholder={t("public.leadForm.email", "Email (Optional)")} {...register("email")} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select onValueChange={(val) => setValue("level_interest", val)}>
              <SelectTrigger>
                <SelectValue placeholder={t("public.leadForm.level", "Target Level")} />
              </SelectTrigger>
              <SelectContent>
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(val) => setValue("branch_id", val)}>
              <SelectTrigger>
                <SelectValue placeholder={t("public.leadForm.branch", "Preferred Branch")} />
              </SelectTrigger>
              <SelectContent>
                {(branches ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea placeholder={t("public.leadForm.notes", "Any additional notes or questions?")} {...register("notes")} />

          <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? t("public.leadForm.submitting", "Submitting...") : t("public.leadForm.submit", "Submit Request")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}