import {
  describeLevelIneligibility,
  isCefrLevel,
  isLevelEligible,
  levelFromScorePercentage,
  levelIndex,
} from './level.util';

describe('level.util', () => {
  describe('levelIndex', () => {
    it('maps CEFR levels onto the A1=1..C2=6 hierarchy', () => {
      expect(levelIndex('A1')).toBe(1);
      expect(levelIndex('a2')).toBe(2);
      expect(levelIndex('B1')).toBe(3);
      expect(levelIndex('B2')).toBe(4);
      expect(levelIndex('C1')).toBe(5);
      expect(levelIndex('C2')).toBe(6);
    });

    it('maps legacy descriptive levels and rejects unknown values', () => {
      expect(levelIndex('Beginner')).toBe(1);
      expect(levelIndex('Intermediate')).toBe(3);
      expect(levelIndex('Advanced')).toBe(5);
      expect(levelIndex('Klingon')).toBeNull();
      expect(levelIndex(null)).toBeNull();
      expect(levelIndex(undefined)).toBeNull();
      expect(levelIndex('')).toBeNull();
    });
  });

  describe('isLevelEligible (Current >= Course >= Current - 1)', () => {
    it('allows the SAME level', () => {
      expect(isLevelEligible('B1', 'B1')).toBe(true);
    });

    it('allows ONE level below the student level', () => {
      expect(isLevelEligible('B1', 'A2')).toBe(true);
      expect(isLevelEligible('C2', 'C1')).toBe(true);
    });

    it('blocks courses ABOVE the student level', () => {
      expect(isLevelEligible('B1', 'B2')).toBe(false);
      expect(isLevelEligible('A1', 'C2')).toBe(false);
    });

    it('blocks courses MORE than one level below', () => {
      expect(isLevelEligible('B1', 'A1')).toBe(false);
      expect(isLevelEligible('C2', 'B2')).toBe(false);
    });

    it('passes when either level is unassigned/unknown (nothing to enforce)', () => {
      expect(isLevelEligible(null, 'B1')).toBe(true);
      expect(isLevelEligible('B1', null)).toBe(true);
      expect(isLevelEligible(undefined, undefined)).toBe(true);
    });
  });

  describe('describeLevelIneligibility', () => {
    it('explains above-level attempts', () => {
      expect(describeLevelIneligibility('B1', 'B2')).toContain('above');
    });

    it('explains too-far-below attempts', () => {
      expect(describeLevelIneligibility('B1', 'A1')).toContain('more than one level below');
    });
  });

  describe('levelFromScorePercentage (placement scoring matrix)', () => {
    it('maps boundary degrees onto CEFR levels', () => {
      expect(levelFromScorePercentage(0)).toBe('A1');
      expect(levelFromScorePercentage(39)).toBe('A1');
      expect(levelFromScorePercentage(40)).toBe('A2');
      expect(levelFromScorePercentage(54)).toBe('A2');
      expect(levelFromScorePercentage(55)).toBe('B1');
      expect(levelFromScorePercentage(69)).toBe('B1');
      expect(levelFromScorePercentage(70)).toBe('B2');
      expect(levelFromScorePercentage(84)).toBe('B2');
      expect(levelFromScorePercentage(85)).toBe('C1');
      expect(levelFromScorePercentage(94)).toBe('C1');
      expect(levelFromScorePercentage(95)).toBe('C2');
      expect(levelFromScorePercentage(100)).toBe('C2');
    });

    it('returns null for missing/non-finite values', () => {
      expect(levelFromScorePercentage(null)).toBeNull();
      expect(levelFromScorePercentage(undefined)).toBeNull();
      expect(levelFromScorePercentage(NaN)).toBeNull();
    });
  });

  describe('isCefrLevel', () => {
    it('accepts only A1–C2', () => {
      expect(isCefrLevel('B1')).toBe(true);
      expect(isCefrLevel('c2')).toBe(true);
      expect(isCefrLevel('Z9')).toBe(false);
      expect(isCefrLevel('Intermediate')).toBe(false);
      expect(isCefrLevel(null)).toBe(false);
      expect(isCefrLevel('')).toBe(false);
    });
  });
});
