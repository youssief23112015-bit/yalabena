import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Megaphone } from "lucide-react";
import { notificationsApi } from "@/api/notifications";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TARGET_ROLES = ["all", "student", "teacher", "hr"] as const;
type TargetRole = (typeof TARGET_ROLES)[number];

const ROLE_LABEL_KEYS: Record<TargetRole, string> = {
  all: "notifications.allUsers",
  student: "notifications.studentsOnly",
  teacher: "notifications.teachersOnly",
  hr: "notifications.staffOnly",
};

const buildBroadcastSchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().min(3, t("notifications.titleMin")),
    message: z.string().min(5, t("notifications.messageMin")),
    target_role: z.enum(TARGET_ROLES),
  });

type BroadcastForm = z.infer<ReturnType<typeof buildBroadcastSchema>>;

interface SendNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendNotificationModal({ open, onOpenChange }: SendNotificationModalProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Rebuilt when the language changes so validation messages stay localized.
  const schema = useMemo(() => buildBroadcastSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BroadcastForm>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", message: "", target_role: "all" },
  });

  const targetRole = watch("target_role");

  const sendMutation = useMutation({
    mutationFn: (payload: { title: string; message: string; target_role?: string }) =>
      notificationsApi.sendBroadcast(payload),
    onSuccess: (result) => {
      toast({
        title: t("notifications.sendSuccess"),
        description: t("notifications.sendSuccessDescription", { count: result.sent }),
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-page"] });
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: t("notifications.sendError"),
        description: err?.message,
      });
    },
  });

  const onSubmit = (values: BroadcastForm) => {
    sendMutation.mutate({
      title: values.title.trim(),
      message: values.message.trim(),
      target_role: values.target_role,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("notifications.modalTitle")}</DialogTitle>
          <DialogDescription>{t("notifications.modalDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="broadcast-title">{t("notifications.titleLabel")}</Label>
            <Input
              id="broadcast-title"
              {...register("title")}
              placeholder={t("notifications.titlePlaceholder")}
              disabled={sendMutation.isPending}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-message">{t("notifications.messageLabel")}</Label>
            <Textarea
              id="broadcast-message"
              rows={4}
              {...register("message")}
              placeholder={t("notifications.messagePlaceholder")}
              disabled={sendMutation.isPending}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("notifications.targetAudience")}</Label>
            <Select
              value={targetRole}
              onValueChange={(value) => setValue("target_role", value as TargetRole)}
              disabled={sendMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("notifications.targetAudience")} />
              </SelectTrigger>
              <SelectContent>
                {TARGET_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {t(ROLE_LABEL_KEYS[role])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sendMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={sendMutation.isPending}>
              <Megaphone className="mr-2 h-4 w-4" />
              {sendMutation.isPending
                ? t("notifications.sending")
                : t("notifications.sendBroadcast")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}