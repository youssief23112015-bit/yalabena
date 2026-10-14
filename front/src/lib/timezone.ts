/**
 * Time-zone helpers shared by the role dashboards.
 *
 * Sessions store academy WALL-TIME (`date` = YYYY-MM-DD,
 * `start_time` / `end_time` = HH:mm:ss) in the business calendar zone
 * (backend `APP_TIME_ZONE`, default `Africa/Cairo`). These helpers turn that
 * wall-time into a real instant and render it in the signed-in user's display
 * zone (localStorage override, defaulting to Africa/Cairo).
 */

export const ACADEMY_TIME_ZONE = "Africa/Cairo";

const TZ_STORAGE_KEY = "speakup-timezone";

/** User's display time zone: explicit override → academy default. */
export function getUserTimeZone(): string {
  try {
    const stored = window.localStorage.getItem(TZ_STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // localStorage can throw in private/restricted contexts — fall through.
  }
  return ACADEMY_TIME_ZONE;
}

/** Persist a display time-zone override (settings/tests). */
export function setUserTimeZone(timeZone: string): void {
  try {
    window.localStorage.setItem(TZ_STORAGE_KEY, timeZone);
  } catch {
    // Ignore quota/private-mode failures — the default still applies.
  }
}

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function timeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, number> = {};
  for (const part of dtf.formatToParts(new Date(utcMs))) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(
    parts.year,
    (parts.month || 1) - 1,
    parts.day || 1,
    (parts.hour || 0) % 24,
    parts.minute || 0,
    parts.second || 0,
  );
  return asUtc - utcMs;
}

/**
 * The instant that renders as `date` + `time` (academy wall-clock) when
 * displayed in `timeZone`. Two-pass offset guess keeps DST boundaries safe.
 * Accepts full ISO date strings for `date` (only YYYY-MM-DD is used).
 */
export function zonedWallTimeToDate(
  date: string,
  time: string,
  timeZone: string = ACADEMY_TIME_ZONE,
): Date {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = time.split(":").map(Number);
  const utcGuess = Date.UTC(
    year || 1970,
    (month || 1) - 1,
    day || 1,
    hour || 0,
    minute || 0,
    second || 0,
  );
  const offset1 = timeZoneOffsetMs(utcGuess, timeZone);
  const firstPass = utcGuess - offset1;
  const offset2 = timeZoneOffsetMs(firstPass, timeZone);
  return new Date(offset2 === offset1 ? firstPass : utcGuess - offset2);
}

/** `YYYY-MM-DD` for `at` in the given zone (lexicographically sortable). */
export function dateKeyIn(timeZone: string = getUserTimeZone(), at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** `HH:mm:ss` 24h clock for `at` in the given zone. */
export function timeKeyIn(timeZone: string = getUserTimeZone(), at: Date = new Date()): string {
  const parts: Record<string, number> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad((parts.hour || 0) % 24)}:${pad(parts.minute || 0)}:${pad(parts.second || 0)}`;
}

const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function formatter(
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let fmt = FORMATTERS.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    FORMATTERS.set(key, fmt);
  }
  return fmt;
}

/** Localized date label, e.g. "Wed, 14 Oct 2026". */
export function formatDateIn(date: Date, locale: string, timeZone: string = getUserTimeZone()): string {
  return formatter(locale, timeZone, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Localized time label, e.g. "04:00 PM" / "٠٤:٠٠ م". */
export function formatTimeIn(date: Date, locale: string, timeZone: string = getUserTimeZone()): string {
  return formatter(locale, timeZone, { hour: "2-digit", minute: "2-digit" }).format(date);
}

/** Combined label: "Wed, 14 Oct 2026 · 04:00 PM". */
export function formatDateTimeIn(date: Date, locale: string, timeZone: string = getUserTimeZone()): string {
  return `${formatDateIn(date, locale, timeZone)} · ${formatTimeIn(date, locale, timeZone)}`;
}
