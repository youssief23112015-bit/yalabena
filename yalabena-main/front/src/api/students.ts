import apiClient from "./client";
import type { Student, Attendance, Group, Certificate, Payment, LevelHistory } from "@/types";

export interface StudentFilters {
  search?: string;
  status?: string;
  level?: string;
  groupId?: string;
}

export interface UpdateStudentDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  national_id?: string;
  date_of_birth?: string;
  status?: string;
  current_level?: string;
}

export const studentsApi = {
  /** The logged-in student's own profile (incl. current_level). */
  me: async (): Promise<Student | null> => {
    const { data } = await apiClient.get<Student>("/students/me");
    return data ?? null;
  },
  findAll: async (params?: StudentFilters): Promise<Student[]> => {
    const { data } = await apiClient.get<Student[]>("/students", { params });
    return data;
  },
  findOne: async (id: string): Promise<Student> => {
    const { data } = await apiClient.get<Student>(`/students/${id}`);
    return data;
  },
  update: async (id: string, dto: UpdateStudentDto): Promise<Student> => {
    const { data } = await apiClient.patch<Student>(`/students/${id}`, dto);
    return data;
  },
  getAttendance: async (id: string, params?: { groupId?: string; from?: string; to?: string }): Promise<Attendance[]> => {
    const { data } = await apiClient.get<Attendance[]>(`/students/${id}/attendance`, { params });
    return data;
  },
  getGroups: async (id: string): Promise<Group[]> => {
    const { data } = await apiClient.get<Group[]>(`/students/${id}/groups`);
    return data;
  },
  getCertificates: async (id: string): Promise<Certificate[]> => {
    const { data } = await apiClient.get<Certificate[]>(`/students/${id}/certificates`);
    return data;
  },
  getPayments: async (id: string): Promise<Payment[]> => {
    const { data } = await apiClient.get<Payment[]>(`/students/${id}/payments`);
    return data;
  },
  getLevelHistory: async (id: string): Promise<LevelHistory[]> => {
    const { data } = await apiClient.get<LevelHistory[]>(`/students/${id}/level-history`);
    return data;
  },
  // NOTE: enrollInGroup (POST /students/:id/enroll) was removed — it was never
  // called anywhere and the backend has no such route. Enrollment creation goes
  // through enrollmentsApi.create (POST /enrollments), which the Enrollments page uses.
};
