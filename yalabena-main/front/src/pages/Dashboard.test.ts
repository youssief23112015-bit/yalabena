import { resolveDashboardKind, eligibleDashboardKinds } from "./Dashboard";

describe("resolveDashboardKind", () => {
  it("maps super_admin to super_admin", () => {
    expect(resolveDashboardKind(["super_admin"])).toBe("super_admin");
  });

  it("maps branch_manager to branch_manager", () => {
    expect(resolveDashboardKind(["branch_manager"])).toBe("branch_manager");
  });

  it("maps sales to sales", () => {
    expect(resolveDashboardKind(["sales"])).toBe("sales");
  });

  it("maps finance to finance", () => {
    expect(resolveDashboardKind(["finance"])).toBe("finance");
  });

  it("maps academic to academic", () => {
    expect(resolveDashboardKind(["academic"])).toBe("academic");
  });

  it("maps teacher to teacher", () => {
    expect(resolveDashboardKind(["teacher"])).toBe("teacher");
  });

  it("maps student to student", () => {
    expect(resolveDashboardKind(["student"])).toBe("student");
  });

  it("maps hr to hr", () => {
    expect(resolveDashboardKind(["hr"])).toBe("hr");
  });

  it("maps moderator to moderator", () => {
    expect(resolveDashboardKind(["moderator"])).toBe("moderator");
  });

  it("maps auditor to auditor", () => {
    expect(resolveDashboardKind(["auditor"])).toBe("auditor");
  });

  it("uses precedence: super_admin > branch_manager > finance > sales > academic > hr > teacher > moderator > auditor > student", () => {
    expect(resolveDashboardKind(["student", "super_admin"])).toBe("super_admin");
    expect(resolveDashboardKind(["teacher", "branch_manager"])).toBe("branch_manager");
    expect(resolveDashboardKind(["student", "finance"])).toBe("finance");
    expect(resolveDashboardKind(["hr", "teacher"])).toBe("hr");
    expect(resolveDashboardKind(["teacher", "moderator"])).toBe("teacher");
    expect(resolveDashboardKind(["student", "auditor"])).toBe("auditor");
    expect(resolveDashboardKind(["student", "hr"])).toBe("hr");
    expect(resolveDashboardKind(["moderator", "student"])).toBe("moderator");
    expect(resolveDashboardKind(["sales", "academic"])).toBe("sales");
  });

  it("unknown/custom role falls back to generic", () => {
    expect(resolveDashboardKind(["custom_role"])).toBe("generic");
    expect(resolveDashboardKind([])).toBe("generic");
    expect(resolveDashboardKind(["student", "custom_role"])).toBe("student");
    expect(resolveDashboardKind(["custom_role", "another_custom"])).toBe("generic");
  });

  it("single eligible role returns just that kind", () => {
    expect(eligibleDashboardKinds(["teacher"])).toEqual(["teacher"]);
    expect(eligibleDashboardKinds(["super_admin"])).toEqual(["super_admin"]);
  });

  it("multi-role returns all eligible kinds ordered by precedence", () => {
    expect(eligibleDashboardKinds(["student", "super_admin", "teacher"])).toEqual([
      "super_admin",
      "teacher",
      "student",
    ]);
    expect(eligibleDashboardKinds(["auditor", "moderator", "hr"])).toEqual([
      "hr",
      "moderator",
      "auditor",
    ]);
  });

  it("empty roles returns empty list", () => {
    expect(eligibleDashboardKinds([])).toEqual([]);
  });
});