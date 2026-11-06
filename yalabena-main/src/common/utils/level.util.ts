/**
 * CEFR level hierarchy helpers (Enrollment eligibility, SRS §4.4).
 *
 * Levels are ordered A1 < A2 < B1 < B2 < C1 < C2. Legacy descriptive
 * levels stored in old rows are mapped onto the same scale so comparisons
 * never silently pass for unknown data.
 */
export const LEVEL_ORDER: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
  // Legacy descriptive values (still allowed by the students table CHECK).
  BEGINNER: 1,
  ELEMENTARY: 2,
  INTERMEDIATE: 3,
  UPPER_INTERMEDIATE: 4,
  ADVANCED: 5,
  PROFICIENCY: 6,
};

/** 1-based hierarchy index for a level label, or null when unknown. */
export function levelIndex(level?: string | null): number | null {
  if (!level) return null;
  const idx = LEVEL_ORDER[String(level).trim().toUpperCase()];
  return typeof idx === 'number' ? idx : null;
}

/**
 * A student may take a course when the course level is AT MOST one level
 * below their own and NEVER above it:
 *   studentLevel >= courseLevel >= studentLevel - 1
 * Students without an assigned level cannot be checked, so they pass.
 */
export function isLevelEligible(
  studentLevel?: string | null,
  courseLevel?: string | null,
): boolean {
  const s = levelIndex(studentLevel);
  const c = levelIndex(courseLevel);
  if (s === null || c === null) return true; // unassigned/unknown — nothing to enforce
  return c <= s && s - c <= 1;
}

/** Human-readable explanation used in 400 Business exceptions. */
export function describeLevelIneligibility(
  studentLevel?: string | null,
  courseLevel?: string | null,
): string {
  const s = levelIndex(studentLevel);
  const c = levelIndex(courseLevel);
  if (s === null || c === null) return 'Course level does not match the student level';
  if (c > s) {
    return `Course level ${courseLevel} is above the student's level ${studentLevel}`;
  }
  return `Course level ${courseLevel} is more than one level below the student's level ${studentLevel}`;
}

/**
 * Placement-test scoring matrix: percentage of achieved degree -> CEFR level.
 *   < 40%   -> A1   40–54%  -> A2   55–69% -> B1
 *   70–84%  -> B2   85–94%  -> C1   >= 95% -> C2
 * Returns null when the percentage is missing or non-finite.
 */
export function levelFromScorePercentage(percentage?: number | null): string | null {
  if (percentage === null || percentage === undefined) return null;
  const pct = Number(percentage);
  if (!Number.isFinite(pct)) return null;
  if (pct < 40) return 'A1';
  if (pct < 55) return 'A2';
  if (pct < 70) return 'B1';
  if (pct < 85) return 'B2';
  if (pct < 95) return 'C1';
  return 'C2';
}

/** True for the six canonical CEFR labels (guards DB CHECK constraints). */
export function isCefrLevel(level?: string | null): boolean {
  if (!level) return false;
  const idx = levelIndex(level);
  return idx !== null && idx >= 1 && idx <= 6 && /^[A-C][12]$/i.test(String(level).trim());
}
