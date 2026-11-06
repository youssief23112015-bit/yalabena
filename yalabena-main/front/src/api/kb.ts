import apiClient from "./client";

export type KbVisibility = "staff" | "manager" | "admin" | "teacher" | "public";

export interface KbCategory {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  parent_id?: string | null;
  visibility?: KbVisibility;
  sort_order?: number;
  children?: KbCategory[];
}

export interface KbArticle {
  id: string;
  category_id: string;
  category?: KbCategory;
  title: string;
  slug?: string | null;
  body: string;
  excerpt?: string | null;
  tags?: string[] | null;
  version: number;
  visibility: KbVisibility;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  creator?: { first_name?: string; last_name?: string } | null;
}

export interface KbArticleInput {
  category_id: string;
  title: string;
  body: string;
  excerpt?: string;
  visibility?: KbVisibility;
  tags?: string[];
  is_pinned?: boolean;
}

export const kbApi = {
  categories: async (): Promise<KbCategory[]> =>
    (await apiClient.get<KbCategory[]>("/kb/categories")).data,
  createCategory: async (input: { name: string; description?: string }) =>
    (await apiClient.post<KbCategory>("/kb/categories", input)).data,
  articles: async (params?: { search?: string; category_id?: string; visibility?: KbVisibility }) =>
    (await apiClient.get<KbArticle[]>("/kb/articles", { params })).data,
  article: async (id: string) =>
    (await apiClient.get<KbArticle>(`/kb/articles/${id}`)).data,
  createArticle: async (input: KbArticleInput) =>
    (await apiClient.post<KbArticle>("/kb/articles", input)).data,
  updateArticle: async (id: string, input: Partial<Pick<KbArticleInput, "title" | "body" | "visibility" | "excerpt" | "tags" | "is_pinned">>) =>
    (await apiClient.put<KbArticle>(`/kb/articles/${id}`, input)).data,
};
