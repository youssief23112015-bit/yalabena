import apiClient from "./client";
import type { StoredFileInfo } from "@/types";

export type UploadKind = "chat" | "lms" | "submission" | "hr" | "avatar" | "activity" | "general";

export const filesApi = {
  /** Upload a file (multipart). Per-kind MIME/size rules are enforced server-side (SRS 7.2). */
  upload: async (file: File, kind: UploadKind = "general"): Promise<StoredFileInfo> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<StoredFileInfo>("/files/upload", form, {
      params: { kind },
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
