import apiClient from "./client";
import type {
  Activity,
  ActivityAttendanceResponse,
  ActivityEventType,
  ActivityPhoto,
  ActivityRegistration,
  ActivityRegistrationStatus,
  ActivityStatusValue,
} from "@/types";

export interface ActivityFilters {
  type?: ActivityEventType;
  status?: ActivityStatusValue;
  level?: string;
  branch_id?: string;
  search?: string;
}

export interface CreateActivityDto {
  title: string;
  description?: string;
  type: ActivityEventType;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  branch_id: string;
  capacity: number;
  fee?: number;
  target_levels?: string[];
  target_groups?: string[];
  is_open_to_all?: boolean;
  status?: ActivityStatusValue;
}

export type UpdateActivityDto = Partial<CreateActivityDto>;

export interface RegisterActivityDto {
  student_id?: string;
  mark_paid?: boolean;
}

export interface AttendanceRecord {
  student_id: string;
  status: ActivityRegistrationStatus;
}

export const activitiesApi = {
  findAll: async (filters?: ActivityFilters): Promise<Activity[]> => {
    const { data } = await apiClient.get<Activity[]>("/activities", {
      params: Object.fromEntries(
        Object.entries(filters ?? {}).filter(([, v]) => v !== undefined && v !== ""),
      ),
    });
    return data;
  },
  findOne: async (id: string): Promise<Activity> => {
    const { data } = await apiClient.get<Activity>(`/activities/${id}`);
    return data;
  },
  create: async (dto: CreateActivityDto): Promise<Activity> => {
    const { data } = await apiClient.post<Activity>("/activities", dto);
    return data;
  },
  update: async (id: string, dto: UpdateActivityDto): Promise<Activity> => {
    const { data } = await apiClient.put<Activity>(`/activities/${id}`, dto);
    return data;
  },
  remove: async (id: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/activities/${id}`);
    return data;
  },

  // ─── Registration ───
  register: async (activityId: string, dto: RegisterActivityDto = {}): Promise<Activity> => {
    const { data } = await apiClient.post<Activity>(
      `/activities/${activityId}/registrations`,
      dto,
    );
    return data;
  },
  cancelRegistration: async (registrationId: string): Promise<ActivityRegistration> => {
    const { data } = await apiClient.delete<ActivityRegistration>(
      `/activities/registrations/${registrationId}`,
    );
    return data;
  },
  payRegistration: async (
    registrationId: string,
    dto: { amount?: number } = {},
  ): Promise<ActivityRegistration> => {
    const { data } = await apiClient.post<ActivityRegistration>(
      `/activities/registrations/${registrationId}/pay`,
      dto,
    );
    return data;
  },

  // ─── Attendance ───
  getAttendance: async (activityId: string): Promise<ActivityAttendanceResponse> => {
    const { data } = await apiClient.get<ActivityAttendanceResponse>(
      `/activities/${activityId}/attendance`,
    );
    return data;
  },
  markAttendance: async (
    activityId: string,
    dto: { records: AttendanceRecord[] } | { student_id: string; status: ActivityRegistrationStatus },
  ): Promise<ActivityAttendanceResponse> => {
    const { data } = await apiClient.post<ActivityAttendanceResponse>(
      `/activities/${activityId}/attendance`,
      dto,
    );
    return data;
  },

  // ─── Photo gallery ───
  addPhoto: async (
    activityId: string,
    dto: { file_url: string; caption?: string },
  ): Promise<ActivityPhoto> => {
    const { data } = await apiClient.post<ActivityPhoto>(`/activities/${activityId}/photos`, dto);
    return data;
  },
  removePhoto: async (photoId: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/activities/photos/${photoId}`);
    return data;
  },
};
