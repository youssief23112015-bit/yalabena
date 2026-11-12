import apiClient from "./client";

export type TicketStatus = "open" | "in_progress" | "resolved";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface SupportTicketReply {
  id: string;
  ticket_id: string;
  body: string;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id?: string | null;
  subject: string;
  category: string;
  message: string;
  priority: TicketPriority;
  status: TicketStatus;
  user_name?: string | null;
  user_email?: string | null;
  assigned_to?: string | null;
  assignee?: { first_name?: string; last_name?: string } | null;
  admin_reply?: string | null;
  replied_by?: string | null;
  replied_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  replies?: SupportTicketReply[];
}

export interface SupportTicketInput {
  subject: string;
  category: string;
  message: string;
  priority?: TicketPriority;
}

export interface PaginatedSupportTickets {
  items: SupportTicket[];
  total: number;
  page: number;
  limit: number;
}

export const supportApi = {
  createTicket: async (input: SupportTicketInput): Promise<SupportTicket> => {
    const { data } = await apiClient.post<SupportTicket>(
      "/support/tickets",
      input,
    );
    return data;
  },

  getMyTickets: async (): Promise<SupportTicket[]> => {
    const { data } = await apiClient.get<SupportTicket[]>(
      "/support/tickets/me",
    );
    return Array.isArray(data) ? data : [];
  },

  getTickets: async (
    params?: {
      status?: TicketStatus;
      category?: string;
      priority?: TicketPriority;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedSupportTickets> => {
    const { data } = await apiClient.get<PaginatedSupportTickets>(
      "/support/tickets",
      { params },
    );
    return (
      data ?? {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      }
    );
  },

  getTicket: async (id: string): Promise<SupportTicket> => {
    const { data } = await apiClient.get<SupportTicket>(
      `/support/tickets/${id}`,
    );
    return data;
  },

  updateTicketStatus: async (
    id: string,
    status: TicketStatus,
  ): Promise<SupportTicket> => {
    const { data } = await apiClient.patch<SupportTicket>(
      `/support/tickets/${id}/status`,
      { status },
    );
    return data;
  },

  replyTicket: async (
    id: string,
    body: string,
  ): Promise<SupportTicketReply> => {
    const { data } = await apiClient.post<SupportTicketReply>(
      `/support/tickets/${id}/reply`,
      { body },
    );
    return data;
  },

  assignTicket: async (
    id: string,
    assignedTo: string,
  ): Promise<SupportTicket> => {
    const { data } = await apiClient.patch<SupportTicket>(
      `/support/tickets/${id}/assign`,
      { assigned_to: assignedTo },
    );
    return data;
  },
};
