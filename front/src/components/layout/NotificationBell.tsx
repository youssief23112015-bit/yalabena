import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { notificationsApi } from "@/api/notifications";
import { getNotificationsSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppNotification, PaginatedNotifications } from "@/types";

/** Bell with unread badge + dropdown; realtime updates via the notifications socket (SRS 4.18). */
export function NotificationBell() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsApi.unreadCount,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const { data: page } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsApi.list({ limit: 10 }),
    enabled: isAuthenticated && open,
  });

  // Realtime: bump unread count, refresh list, and toast on each push.
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getNotificationsSocket();
    if (!socket) return;
    const onNotification = (n: AppNotification) => {
      queryClient.setQueryData<number>(["notifications", "unread-count"], (old = 0) => old + 1);
      queryClient.setQueryData<PaginatedNotifications | undefined>(
        ["notifications", "list"],
        (old) =>
          old ? { ...old, items: [n, ...old.items].slice(0, 10), unread_count: old.unread_count + 1 } : old,
      );
      toast({ title: n.title, description: n.body });
    };
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [isAuthenticated, queryClient, toast]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAll = async () => {
    await notificationsApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markOne = async (n: AppNotification) => {
    if (!n.read_at) {
      await notificationsApi.markRead(n.id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (n.action_url) window.open(n.action_url, "_blank", "noopener");
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((o) => !o)}
        title={t("notifications.title")}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-md border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-semibold">{t("notifications.title")}</p>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!page?.items?.length ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t("notifications.empty")}
              </p>
            ) : (
              page.items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markOne(n)}
                  className={cn(
                    "block w-full border-b px-3 py-2.5 text-start last:border-b-0 hover:bg-accent",
                    !n.read_at && "bg-primary/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <div className={cn("min-w-0", n.read_at && "ps-4")}>
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
