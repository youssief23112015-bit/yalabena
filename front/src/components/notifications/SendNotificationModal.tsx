import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Megaphone, Search, X } from "lucide-react";
import { notificationsApi } from "@/api/notifications";
import { usersApi } from "@/api/users";
import { groupsApi } from "@/api/groups";
import { useAuthStore } from "@/store/authStore";
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

/** Full audience list (Business Rule 1 — admin capability). */
const TARGET_TYPES = ["all", "students", "teachers", "specific_user", "group"] as const;
type TargetType = (typeof TARGET_TYPES)[number];

/** Roles that keep full targeting power even if they also hold `teacher`. */
const ADMIN_TARGETING_ROLES = ["super_admin", "admin", "hr", "academic"];

const targetLabelKey: Record<TargetType, string> = {
  all: "notifications.targetAllUsers",
  students: "notifications.targetAllStudents",
  teachers: "notifications.targetAllTeachers",
  specific_user: "notifications.targetSpecificPerson",
  group: "notifications.targetGroupStudents",
};

const buildBroadcastSchema = (t: (key: string) => string) =>
  z
    .object({
      title: z.string().min(3, t("notifications.titleMin")),
      message: z.string().min(5, t("notifications.messageMin")),
      target_type: z.enum(TARGET_TYPES),
      target_user_id: z.string().optional(),
      group_id: z.string().optional(),
    })
    .superRefine((value, ctx) => {
      if (value.target_type === "specific_user" && !value.target_user_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["target_user_id"],
          message: t("notifications.selectPerson"),
        });
      }
      if (value.target_type === "group" && !value.group_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["group_id"],
          message: t("notifications.selectGroup"),
        });
      }
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
  const user = useAuthStore((s) => s.user);

  const userRoles = user?.roles ?? (user?.role ? [user.role] : []);
  const isAdminLike = userRoles.some((role) => ADMIN_TARGETING_ROLES.includes(role));
  /** Business Rule 2 — teachers are locked to their own groups. */
  const restrictToGroups = userRoles.includes("teacher") && !isAdminLike;
  const audienceOptions: readonly TargetType[] = restrictToGroups ? ["group"] : TARGET_TYPES;

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
    defaultValues: {
      title: "",
      message: "",
      target_type: restrictToGroups ? "group" : "all",
      target_user_id: undefined,
      group_id: undefined,
    },
  });

  const targetType = watch("target_type");
  const targetUserId = watch("target_user_id");
  const targetGroupId = watch("group_id");

  // ── "Specific Person" picker: full (branch-scoped) user list, filtered
  //    client-side by the search box (GET /users ignores a search param). ──
  const [userSearch, setUserSearch] = useState("");
  const [pickedUserName, setPickedUserName] = useState("");
  const { data: allUsers } = useQuery({
    queryKey: ["users", "notify-picker"],
    queryFn: () => usersApi.findAll(),
    enabled: open && targetType === "specific_user" && !restrictToGroups,
  });
  const userMatches = (allUsers ?? [])
    .filter((u) => u.id !== user?.id)
    .filter((u) => {
      const q = userSearch.trim().toLowerCase();
      if (!q) return true;
      const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
      return name.includes(q) || (u.email ?? "").toLowerCase().includes(q);
    })
    .slice(0, 8);

  // ── Group picker: teachers only ever see THEIR groups (the backend also
  //    re-verifies teacher_id ownership — defense in depth). ──
  const { data: allGroups } = useQuery({
    queryKey: ["groups", "notify-picker"],
    queryFn: () => groupsApi.findAll(),
    enabled: open && targetType === "group",
  });
  const availableGroups = (allGroups ?? []).filter((g) =>
    restrictToGroups ? g.teacher_id === user?.id : true,
  );

  const sendMutation = useMutation({
    mutationFn: (payload: Parameters<typeof notificationsApi.sendBroadcast>[0]) =>
      notificationsApi.sendBroadcast(payload),
    onSuccess: (result) => {
      toast({
        title: t("notifications.sendSuccess"),
        description: t("notifications.sendSuccessDescription", { count: result.sent }),
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-page"] });
      reset();
      setUserSearch("");
      setPickedUserName("");
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
    const payload: Parameters<typeof notificationsApi.sendBroadcast>[0] = {
      title: values.title.trim(),
      message: values.message.trim(),
      target_type: values.target_type,
    };
    if (values.target_type === "specific_user") payload.target_user_id = values.target_user_id;
    if (values.target_type === "group") payload.group_id = values.group_id;
    sendMutation.mutate(payload);
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
              value={targetType}
              onValueChange={(value) => {
                setValue("target_type", value as TargetType);
                setValue("target_user_id", undefined);
                setValue("group_id", undefined);
                setUserSearch("");
                setPickedUserName("");
              }}
              disabled={sendMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("notifications.targetAudience")} />
              </SelectTrigger>
              <SelectContent>
                {/* Global broadcasts are hidden for teachers (Business Rule 2) */}
                {audienceOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "group" && restrictToGroups
                      ? t("notifications.targetMyGroupStudents", "My Group Students")
                      : t(targetLabelKey[type])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {restrictToGroups && (
              <p className="text-xs text-muted-foreground">
                {t(
                  "notifications.teacherRestrictionHint",
                  "Teachers can only notify the students of their own groups.",
                )}
              </p>
            )}
          </div>

          {/* ── Specific Person: searchable combobox ── */}
          {targetType === "specific_user" && !restrictToGroups && (
            <div className="space-y-2">
              <Label htmlFor="broadcast-user-search">
                {t("notifications.targetSpecificPerson")}
              </Label>
              {targetUserId ? (
                <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
                  <span className="truncate">{pickedUserName || targetUserId}</span>
                  <button
                    type="button"
                    className="ml-2 rounded p-1 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setValue("target_user_id", undefined);
                      setPickedUserName("");
                    }}
                    disabled={sendMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="broadcast-user-search"
                      className="pl-9"
                      placeholder={t("notifications.searchPeople", "Search by name or email…")}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      disabled={sendMutation.isPending}
                    />
                  </div>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-1">
                    {userMatches.length === 0 && (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        {t("notifications.noPeople", "No matching people")}
                      </p>
                    )}
                    {userMatches.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          setValue("target_user_id", u.id, { shouldValidate: true });
                          setPickedUserName(
                            `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ||
                              u.email ||
                              u.id,
                          );
                        }}
                        disabled={sendMutation.isPending}
                      >
                        <span className="truncate font-medium">
                          {u.first_name} {u.last_name}
                        </span>
                        <span className="truncate pl-2 text-xs text-muted-foreground">
                          {u.email}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {errors.target_user_id && (
                <p className="text-sm text-destructive">{errors.target_user_id.message}</p>
              )}
            </div>
          )}

          {/* ── Group students: teachers only ever see their own groups ── */}
          {targetType === "group" && (
            <div className="space-y-2">
              <Label>{t("notifications.targetGroupStudents")}</Label>
              <Select
                value={targetGroupId ?? ""}
                onValueChange={(value) => setValue("group_id", value, { shouldValidate: true })}
                disabled={sendMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("notifications.selectGroup", "Select a group…")} />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.length === 0 && (
                    <SelectItem value="none" disabled>
                      {restrictToGroups
                        ? t("notifications.noMyGroups", "You have no assigned groups")
                        : t("notifications.noGroups", "No groups available")}
                    </SelectItem>
                  )}
                  {availableGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                      {g.course?.name ? ` — ${g.course.name}` : ""}
                      {` (${g.student_count ?? 0}/${g.capacity ?? "—"})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.group_id && (
                <p className="text-sm text-destructive">{errors.group_id.message}</p>
              )}
            </div>
          )}

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