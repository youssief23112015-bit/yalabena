import apiClient from "./client";
import type { AppNotification, PaginatedNotifications } from "@/types";

export interface NotificationQuery {
  page?: number;
  limit?: number;
  unread_only?: boolean;
}

export interface BroadcastPayload {
  title: string;
  message: string;
  /** Admin: all | students | teachers | specific_user | group. Teachers: group only. */
  target_type?: "all" | "students" | "teachers" | "specific_user" | "group";
  /** Required when target_type = specific_user. */
  target_user_id?: string;
  /** Required when target_type = group. */
  group_id?: string;
  /** @deprecated legacy audience — prefer target_type. */
  target_role?: string;
}

export interface BroadcastResult {
  sent: number;
  target_type: string;
  target_role?: string;
}

export const notificationsApi = {
  list: async (query: NotificationQuery = {}): Promise<PaginatedNotifications> => {
    const { data } = await apiClient.get<PaginatedNotifications>("/notifications", {
      params: query,
    });
    return data;
  },

  unreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ count: number }>("/notifications/unread-count");
    return data.count;
  },

  markRead: async (id: string): Promise<AppNotification> => {
    const { data } = await apiClient.patch<AppNotification>(`/notifications/${id}/read`);
    return data;
  },

  markAllRead: async (): Promise<{ marked: number }> => {
    const { data } = await apiClient.post<{ marked: number }>("/notifications/read-all");
    return data;
  },

  sendBroadcast: async (payload: BroadcastPayload): Promise<BroadcastResult> => {
    const { data } = await apiClient.post<BroadcastResult>("/notifications/broadcast", payload);
    return data;
  },
};
