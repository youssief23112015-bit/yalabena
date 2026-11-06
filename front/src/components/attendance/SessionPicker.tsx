import { useQuery } from "@tanstack/react-query";
import { sessionsApi } from "@/api/sessions";

type SessionOption = {
  id: string;
  topic?: string | null;
  title?: string | null;
  date?: string | Date | null;
  start_time?: string | null;
  groupId?: string;
  group_id?: string;
  group?: { id?: string };
  cancelled_at?: string | Date | null;
};

function dateLabel(value?: string | Date | null): string {
  if (!value) return "";
  // Preserve PostgreSQL DATE strings as calendar dates instead of parsing through UTC.
  if (typeof value === "string") return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function SessionPicker(p: {
  value: string;
  groupFilter: string;
  onChange: (v: string) => void;
}) {
  const { data: sessions, isLoading, isError } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.findAll(),
  });

  const list = ((sessions ?? []) as SessionOption[])
    .filter((s) => !s.cancelled_at)
    .filter((s) => !p.groupFilter || (s.groupId ?? s.group_id ?? s.group?.id) === p.groupFilter)
    .sort((a, b) => {
      const aKey = `${dateLabel(a.date)} ${a.start_time ?? ""}`;
      const bKey = `${dateLabel(b.date)} ${b.start_time ?? ""}`;
      return bKey.localeCompare(aKey);
    });

  return (
    <div className="space-y-1">
      <select
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        disabled={isLoading || isError}
        aria-label="Select session"
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">
          {isLoading ? "Loading sessions…" : isError ? "Could not load sessions" : "Select session"}
        </option>
        {list.map((s) => {
          const label = [
            s.topic?.trim() || s.title?.trim() || "Session",
            dateLabel(s.date),
            s.start_time?.slice(0, 5),
          ].filter(Boolean).join(" — ");
          return <option key={s.id} value={s.id}>{label}</option>;
        })}
      </select>
      {!isLoading && !isError && list.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {p.groupFilter ? "No active sessions found for this group." : "No active sessions found."}
        </p>
      )}
    </div>
  );
}
