import apiClient from "./client";

/** Exact match to backend: src/modules/finance/finance.controller.ts */
export interface InvoiceItemInput {
  description: string;
  course_id?: string;
  quantity: number;
  unit_price: number;
}

export const financeApi = {
  createInvoice: async (dto: {
    student_id: string; branch_id: string; enrollment_id?: string;
    items: InvoiceItemInput[]; discount_amount?: number; promo_code?: string;
    installments_count?: number; due_days?: number; notes?: string;
  }): Promise<any> => {
    const { data } = await apiClient.post("/finance/invoices", dto);
    return data;
  },
  listInvoices: async (params?: {
    student_id?: string; branch_id?: string; status?: string;
    from?: string; to?: string; due_from?: string; due_to?: string; offset?: number; limit?: number;
  }): Promise<any> => {
    const { data } = await apiClient.get("/finance/invoices", { params });
    return data;
  },
  getInvoice: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/finance/invoices/${id}`);
    return data;
  },
  createPromo: async (dto: {
    code: string; type: "percentage" | "fixed"; value: number;
    max_discount?: number; expiry_date: string; usage_limit?: number;
    applicable_courses?: string[]; applicable_branches?: string[];
  }): Promise<any> => {
    const { data } = await apiClient.post("/finance/promo-codes", dto);
    return data;
  },
  listPromos: async (): Promise<any[]> => {
    const { data } = await apiClient.get("/finance/promo-codes");
    return Array.isArray(data) ? data : [];
  },
  setPromoStatus: async (id: string, status: "active" | "inactive"): Promise<any> => {
    const { data } = await apiClient.post(`/finance/promo-codes/${id}/status`, { status });
    return data;
  },
  recordPayment: async (dto: {
    invoice_id: string; amount: number; method: "CASH" | "BANK_TRANSFER" | "EASYKASH";
    reference?: string; notes?: string;
  }): Promise<any> => {
    const { data } = await apiClient.post("/finance/payments", dto);
    return data;
  },
  listPayments: async (params?: { invoice_id?: string; branch_id?: string; from?: string; to?: string }): Promise<any[]> => {
    const { data } = await apiClient.get("/finance/payments", { params });
    return Array.isArray(data) ? data : data?.items ?? [];
  },
  getPayment: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/finance/payments/${id}`);
    return data;
  },
  receiptPdf: async (id: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/finance/payments/${id}/receipt.pdf`, { responseType: "blob" });
    return data as Blob;
  },
  createRefund: async (dto: { payment_id: string; amount: number; reason_code: string; reason_note?: string }): Promise<any> => {
    const { data } = await apiClient.post("/finance/refunds", dto);
    return data;
  },
  listRefunds: async (params?: { status?: string; branch_id?: string }): Promise<any[]> => {
    const { data } = await apiClient.get("/finance/refunds", { params });
    return Array.isArray(data) ? data : [];
  },
  decideRefund: async (id: string, action: "approve" | "reject", note?: string): Promise<any> => {
    const { data } = await apiClient.post(`/finance/refunds/${id}/decision`, { action, note });
    return data;
  },
  processRefund: async (id: string): Promise<any> => {
    const { data } = await apiClient.post(`/finance/refunds/${id}/process`);
    return data;
  },
  ledger: async (params?: { from?: string; to?: string; branch_id?: string }): Promise<any> => {
    const { data } = await apiClient.get("/finance/ledger", { params });
    return data;
  },
  receivables: async (branch_id?: string): Promise<any> => {
    const { data } = await apiClient.get("/finance/receivables", { params: branch_id ? { branch_id } : {} });
    return data;
  },
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
