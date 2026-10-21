import apiClient from "./client";

/** Exact match to backend: src/modules/finance/finance.controller.ts */
export interface InvoiceItemInput {
  description: string;
  course_id?: string;
  quantity: number;
  unit_price: number;
}

/** Normalized revenue summary consumed by FinanceDashboard. */
export interface RevenueReport {
  totalRevenue: number;
  timeline: { total?: string | number; type?: string; month?: string }[];
  byMethod: Record<string, number>;
}

/** Raw invoice entity fields used by the receivables adapter. */
interface RawInvoice {
  id: string;
  invoice_number?: string;
  total_amount?: number;
  balance_due?: number;
  due_date?: string;
  student?: {
    first_name?: string;
    last_name?: string;
    user?: { first_name?: string; last_name?: string };
  };
}

/** One outstanding-invoice row rendered by FinanceDashboard's DataTable. */
export interface OutstandingInvoiceRow {
  id: string;
  invoiceNumber: string;
  studentName: string;
  amount: number;
  remaining: number;
  dueDate: string;
  daysOverdue: number;
}

/** Normalized receivables summary consumed by FinanceDashboard. */
export interface OutstandingReceivables {
  totalOutstanding: number;
  byAging: { days30: number; days90: number };
  invoices: OutstandingInvoiceRow[];
}


export const financeApi = {
  createInvoice: async (dto: {
    student_id: string; enrollment_id?: string;
    items: InvoiceItemInput[]; discount_amount?: number; promo_code?: string;
    installments_count?: number; due_days?: number; notes?: string;
  }): Promise<any> => {
    const { data } = await apiClient.post("/finance/invoices", dto);
    return data;
  },
  listInvoices: async (params?: {
    student_id?: string; status?: string;
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
    applicable_courses?: string[];
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
  listPayments: async (params?: { invoice_id?: string; from?: string; to?: string }): Promise<any[]> => {
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
  listRefunds: async (params?: { status?: string }): Promise<any[]> => {
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
  ledger: async (params?: { from?: string; to?: string }): Promise<any> => {
    const { data } = await apiClient.get("/finance/ledger", { params });
    return data;
  },
  receivables: async (): Promise<any> => {
    const { data } = await apiClient.get("/finance/receivables");
    return data;
  },
  /**
   * GET /finance/ledger adapter (backend returns raw {total,type,month} rows).
   * Normalized to the shape FinanceDashboard renders.
   */
  getRevenueReport: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }): Promise<RevenueReport> => {
    const { data } = await apiClient.get("/finance/ledger", {
      params: {
        from: params?.startDate,
        to: params?.endDate,
      },
    });
    const rows: { total?: string | number; type?: string; month?: string }[] = Array.isArray(data)
      ? data
      : [];
    const byType: Record<string, number> = {};
    let totalRevenue = 0;
    for (const row of rows) {
      const amount = Number(row.total ?? 0) || 0;
      totalRevenue += amount;
      const type = row.type ?? "other";
      byType[type] = (byType[type] ?? 0) + amount;
    }
    return {
      totalRevenue,
      timeline: rows,
      byMethod: byType,
    };
  },
  /**
   * GET /finance/receivables adapter (backend returns Invoice entities).
   * Normalized to the shape FinanceDashboard renders (aging buckets + rows).
   */
  getOutstandingReceivables: async (): Promise<OutstandingReceivables> => {
    const { data } = await apiClient.get("/finance/receivables");
    const invoices: RawInvoice[] = Array.isArray(data) ? data : [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let totalOutstanding = 0;
    let days30 = 0;
    let days90 = 0;
    const rows: OutstandingInvoiceRow[] = invoices.map((invoice) => {
      const remaining = Number(invoice.balance_due ?? invoice.total_amount ?? 0) || 0;
      totalOutstanding += remaining;
      const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
      const overdueDays = dueDate ? Math.floor((now - dueDate.getTime()) / dayMs) : 0;
      if (overdueDays > 0 && overdueDays <= 30) days30 += remaining;
      else if (overdueDays > 30 && overdueDays <= 90) days90 += remaining;
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number ?? "—",
        studentName: [invoice.student?.user?.first_name, invoice.student?.user?.last_name]
          .filter(Boolean)
          .join(" ") ||
          invoice.student?.first_name ||
          "—",
        amount: Number(invoice.total_amount ?? 0) || 0,
        remaining,
        dueDate: invoice.due_date ?? "",
        daysOverdue: overdueDays > 0 ? overdueDays : 0,
      };
    });
    return {
      totalOutstanding,
      byAging: { days30, days90 },
      invoices: rows,
    };
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
