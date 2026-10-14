import apiClient from "./client";
import type { Group } from "@/types";

/**
 * GET /lms/groups — the groups that belong to the CURRENT user:
 *   - students get their actively enrolled groups (with `course` loaded),
 *   - teachers / academic / admins get the groups they can act on.
 * This is the role-safe source for dashboard "my courses" widgets.
 */
export const lmsApi = {
  myGroups: async (): Promise<Group[]> => {
    const { data } = await apiClient.get<Group[]>("/lms/groups");
    return Array.isArray(data) ? data : [];
  },
};
