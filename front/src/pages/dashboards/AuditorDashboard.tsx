import LegacyAdminDashboard from "./LegacyAdminDashboard";

/**
 * Auditor dashboard (read-only audit view).
 * Phase 0: renders the legacy admin dashboard until Phase 9 metrics are wired.
 */
export default function AuditorDashboard() {
  return <LegacyAdminDashboard />;
}