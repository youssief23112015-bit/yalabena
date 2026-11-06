import {
  ACADEMY_TIME_ZONE,
  dateKeyIn,
  formatDateIn,
  formatTimeIn,
  getUserTimeZone,
  zonedWallTimeToDate,
} from "./timezone";

/**
 * Session helpers shared by the role dashboards.
 *
 * The backend stores sessions as `date` (YYYY-MM-DD) + `start_time` /
 * `end_time` (HH:mm:ss) academy wall-time (see
 * src/shared/entities/session.entity.ts), while some payloads expose an ISO
 * `start_time`. Both shapes are normalized here, plus a derived UI status:
 *   done         → already finished (and not cancelled)
 *   scheduled    → starts in the future
 *   unscheduled  → no usable date/time
 *   cancelled    → cancelled_at / status says so
 */

export type SessionUiStatus = "done" | "scheduled" | "unscheduled" | "cancelled";

/** Loose shape covering the typed SessionItem and raw backend rows. */
export interface SessionLike {
  id?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  title?: string;
  topic?: string;
  status?: string;
  cancelled_at?: string | null;
  group_id?: string;
  group?: { id?: string; name?: string } | null;
}

/** Best-effort start instant (academy wall-time anchored in Africa/Cairo). */
export function sessionStart(s: SessionLike): Date | null {
  const st = s.start_time ?? "";
  if (s.date && st && !st.includes("T")) {
    return zonedWallTimeToDate(s.date, st, ACADEMY_TIME_ZONE);
  }
  if (st.includes("T")) {
    if (st.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(st)) {
      const parsed = new Date(st);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const [isoDate, isoTime] = st.split("T");
    return zonedWallTimeToDate(isoDate, isoTime, ACADEMY_TIME_ZONE);
  }
  if (s.date) return zonedWallTimeToDate(s.date, "00:00:00", ACADEMY_TIME_ZONE);
  return null;
}

/** Best-effort end instant; falls back to start + 1h when only a start exists. */
export function sessionEnd(s: SessionLike): Date | null {
  const et = s.end_time ?? "";
  if (s.date && et && !et.includes("T")) return zonedWallTimeToDate(s.date, et, ACADEMY_TIME_ZONE);
  if (et.includes("T")) {
    const parsed = new Date(et);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const start = sessionStart(s);
  return start ? new Date(start.getTime() + 60 * 60 * 1000) : null;
}

/** Derived UI status for a session at `now`. */
export function sessionUiStatus(s: SessionLike, now: Date = new Date()): SessionUiStatus {
  if (s.cancelled_at || s.status === "cancelled" || s.status === "canceled") return "cancelled";
  const start = sessionStart(s);
  if (!start) return "unscheduled";
  const end = sessionEnd(s) ?? start;
  return end.getTime() <= now.getTime() ? "done" : "scheduled";
}

/** Ascending sort key (ms epoch); sessions without schedule sink to the end. */
export function sessionSortMs(s: SessionLike): number {
  const start = sessionStart(s);
  return start ? start.getTime() : Number.MAX_SAFE_INTEGER;
}

/** Calendar date key of the session in the display zone (YYYY-MM-DD). */
export function sessionDateKey(s: SessionLike, timeZone: string = getUserTimeZone()): string | null {
  const start = sessionStart(s);
  return start ? dateKeyIn(timeZone, start) : null;
}

/** Display labels for a session, or null when it has no schedule. */
export function sessionWhen(
  s: SessionLike,
  locale: string,
  timeZone: string = getUserTimeZone(),
): { date: string; time: string } | null {
  const start = sessionStart(s);
  if (!start) return null;
  return {
    date: formatDateIn(start, locale, timeZone),
    time: formatTimeIn(start, locale, timeZone),
  };
}

/** Human title: explicit title → topic → empty (caller applies a fallback). */
export function sessionTitle(s: SessionLike): string {
  return s.title || s.topic || "";
}

/** Group id of a session across payload shapes. */
export function sessionGroupId(s: SessionLike): string | null {
  return s.group_id ?? s.group?.id ?? null;
}
