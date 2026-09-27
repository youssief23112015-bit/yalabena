import apiClient from "./client";
import type { AppNotification, PaginatedNotifications } from "@/types";

export interface NotificationQuery {
  page?: number;
  limit?: number;
  unread_only?: boolean;
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
};
