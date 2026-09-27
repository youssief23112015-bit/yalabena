import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { notificationsApi } from "@/api/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const q = useQuery({
    queryKey: ["notifications-page", unreadOnly],
    queryFn: () => notificationsApi.list({ limit: 50, unread_only: unreadOnly || undefined }),
  });

  const readOne = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const readAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("notifications.title")}</h1>
        <div className="flex items-center gap-2">
          <Button variant={unreadOnly ? "default" : "outline"} size="sm" onClick={() => setUnreadOnly(!unreadOnly)}>
            Unread only
          </Button>
          <Button variant="outline" size="sm" onClick={() => readAll.mutate()} disabled={readAll.isPending}>
            <CheckCheck className="mr-2 h-4 w-4" /> {t("notifications.markAllRead")}
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="pt-4">
          {q.isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
          {!q.isLoading && (q.data?.items?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
          )}
          <div className="divide-y">
            {(q.data?.items ?? []).map((n) => (
              <div key={n.id} className={cn("flex items-start gap-3 py-3", !n.read_at && "bg-primary/5 -mx-2 px-2 rounded")}>
                {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.read_at && <Badge>new</Badge>}
                  {!n.read_at && (
                    <Button size="sm" variant="outline" onClick={() => readOne.mutate(n.id)}>Mark read</Button>
                  )}
                  {n.action_url && (
                    <Button size="sm" variant="ghost" onClick={() => window.open(n.action_url!, "_blank", "noopener")}>Open</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
