import apiClient from "./client";

export type InventoryCategory = "book" | "workbook" | "merchandise" | "stationery" | "equipment" | "other";
export type InventoryStatus = "active" | "discontinued" | "archived";
export type StockMoveType = "in" | "out" | "adjustment" | "return" | "transfer_in" | "transfer_out";
export type ItemCondition = "good" | "damaged" | "lost";

export const INVENTORY_CATEGORIES: InventoryCategory[] = ["book", "workbook", "merchandise", "stationery", "equipment", "other"];

export interface InventoryItem {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  category: InventoryCategory;
  unit_cost: number;
  sale_price: number;
  unit_of_measure: string;
  reorder_level: number;
  status: InventoryStatus;
  quantity: number;
  is_low_stock: boolean;
}

export interface BranchStock { branch_id: string; branch_name: string | null; quantity: number; last_counted_at: string | null }

export interface StockMove {
  id: string; item_id: string; branch_id: string; type: StockMoveType; quantity: number;
  unit_cost: number | null; reason: string; reference_type: string | null; created_at: string;
  item?: { id: string; name: string; sku: string | null };
  branch?: { id: string; name: string };
  creator?: { id: string; first_name?: string; last_name?: string } | null;
}

export interface InventoryItemDetails extends Omit<InventoryItem, "quantity" | "is_low_stock"> {
  total_quantity: number; stock: BranchStock[]; moves: StockMove[];
}

export interface ItemIssue {
  id: string; student_id: string; item_id: string; branch_id: string; quantity: number; cost: number;
  issued_at: string; returned_at: string | null; condition_on_return: ItemCondition | null;
  item?: { id: string; name: string; sku: string | null };
  student?: { id: string; student_number?: string; user?: { first_name?: string; last_name?: string } | null } | null;
}

export interface Paged<T> { data: T[]; total: number; page: number; limit: number }
export interface LowStockRow { item_id: string; name: string; sku: string | null; branch_id: string; branch_name: string; quantity: number; reorder_level: number; shortage: number }
export interface ValuationLine { item_id: string; item_name: string; sku: string | null; quantity: number; unit_cost: number; total_cost: number }
export interface ValuationBranch { branch_id: string; branch_name: string; total_quantity: number; total_cost: number; items: ValuationLine[] }
export interface Valuation { branches: ValuationBranch[]; grand_total_cost: number }
export interface MovementSummaryRow { item_id: string; item_name: string; sku: string | null; type: StockMoveType; moves: number; total_quantity: number }

export interface ItemInput {
  name: string; sku?: string; description?: string; category: InventoryCategory;
  unit_cost?: number; sale_price?: number; unit_of_measure?: string; reorder_level?: number;
  branch_id?: string; initial_quantity?: number;
}

const clean = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "" && v !== null)) as Partial<T>;

export const inventoryApi = {
  items: async (params?: {
    branch_id?: string; search?: string; category?: string; status?: string; low_stock_only?: boolean;
    sort?: string; order?: "ASC" | "DESC"; page?: number; limit?: number;
  }) => (await apiClient.get<Paged<InventoryItem>>("/inventory", { params: clean(params ?? {}) })).data,
  item: async (id: string, branch_id?: string) =>
    (await apiClient.get<InventoryItemDetails>(`/inventory/${id}`, { params: clean({ branch_id }) })).data,
  createItem: async (input: ItemInput) => (await apiClient.post<InventoryItemDetails>("/inventory", clean(input))).data,
  updateItem: async (id: string, input: Partial<ItemInput> & { status?: InventoryStatus }) => {
    const { branch_id: _b, initial_quantity: _q, ...rest } = input;
    return (await apiClient.put<InventoryItemDetails>(`/inventory/${id}`, clean(rest))).data;
  },
  removeItem: async (id: string) =>
    (await apiClient.delete<{ deleted: boolean; archived: boolean; message?: string }>(`/inventory/${id}`)).data,

  receive: async (id: string, b: { branch_id: string; quantity: number; unit_cost?: number; reason?: string }) =>
    (await apiClient.post(`/inventory/${id}/receive`, clean(b))).data,
  adjust: async (id: string, b: { branch_id: string; quantity: number; reason: string }) =>
    (await apiClient.post(`/inventory/${id}/adjust`, b)).data,
  transfer: async (id: string, b: { from_branch_id: string; to_branch_id: string; quantity: number; reason?: string }) =>
    (await apiClient.post(`/inventory/${id}/transfer`, clean(b))).data,

  moves: async (params?: { item_id?: string; branch_id?: string; type?: string; from?: string; to?: string; page?: number; limit?: number }) =>
    (await apiClient.get<Paged<StockMove>>("/inventory/moves", { params: clean(params ?? {}) })).data,
  issues: async (params?: { student_id?: string; branch_id?: string; open_only?: boolean; page?: number; limit?: number }) =>
    (await apiClient.get<Paged<ItemIssue>>("/inventory/issues", { params: clean(params ?? {}) })).data,
  issue: async (b: { item_id: string; student_id: string; branch_id: string; quantity?: number; cost?: number }) =>
    (await apiClient.post<ItemIssue>("/inventory/issues", clean(b))).data,
  returnIssue: async (id: string, condition: ItemCondition) =>
    (await apiClient.patch<ItemIssue>(`/inventory/issues/${id}/return`, { condition })).data,

  lowStock: async (branch_id?: string) =>
    (await apiClient.get<LowStockRow[]>("/inventory/low-stock-alerts", { params: clean({ branch_id }) })).data,
  valuation: async (branch_id?: string) =>
    (await apiClient.get<Valuation>("/inventory/valuation-report", { params: clean({ branch_id }) })).data,
  movementReport: async (params?: { branch_id?: string; from?: string; to?: string }) =>
    (await apiClient.get<MovementSummaryRow[]>("/inventory/movement-report", { params: clean(params ?? {}) })).data,
};

/** Client-side CSV (UTF-8 BOM so Excel shows Arabic correctly). */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
