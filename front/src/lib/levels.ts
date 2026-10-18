/**
 * CEFR level hierarchy (mirror of src/common/utils/level.util.ts).
 * A student may book a course when: Current Level >= Course Level >= Current Level - 1
 */
export const LEVEL_ORDER: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
  BEGINNER: 1,
  ELEMENTARY: 2,
  INTERMEDIATE: 3,
  UPPER_INTERMEDIATE: 4,
  ADVANCED: 5,
  PROFICIENCY: 6,
};

export function levelIndex(level?: string | null): number | null {
  if (!level) return null;
  const idx = LEVEL_ORDER[String(level).trim().toUpperCase()];
  return typeof idx === "number" ? idx : null;
}

/**
 * Client-side mirror of the server rule — used only to pre-disable the
 * "Book this Course" button and show the tooltip; the server re-validates.
 */
export function isCourseLevelEligible(
  currentLevel?: string | null,
  courseLevel?: string | null,
): boolean {
  const s = levelIndex(currentLevel);
  const c = levelIndex(courseLevel);
  if (s === null || c === null) return true; // unassigned level — server decides
  return c <= s && s - c <= 1;
}

/** Tooltip copy explaining why a course level is out of range. */
export function levelIneligibilityMessage(
  currentLevel: string,
  courseLevel: string,
): string {
  const s = levelIndex(currentLevel);
  const c = levelIndex(courseLevel);
  if (s !== null && c !== null && c > s) {
    return `Ineligible Level: ${courseLevel} is above your current level (${currentLevel}).`;
  }
  return `Ineligible Level: ${courseLevel} is more than one level below your current level (${currentLevel}).`;
}
