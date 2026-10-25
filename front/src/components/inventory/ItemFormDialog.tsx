import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  inventoryApi, INVENTORY_CATEGORIES,
  type InventoryCategory, type InventoryItem, type InventoryStatus,
} from "@/api/inventory";
import type { Branch } from "@/types";

const field = "mt-1 w-full rounded-md border bg-background p-2";

interface Props {
  open: boolean;
  item: InventoryItem | null; // null => create
  branches: Branch[];
  defaultBranchId?: string;
  onClose: () => void;
}

export function ItemFormDialog({ open, item, branches, defaultBranchId, onClose }: Props) {
  const { t } = useTranslation("inventory");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [f, setF] = useState({
    name: "", sku: "", description: "", category: "book" as InventoryCategory,
    unit_cost: "0", sale_price: "0", unit_of_measure: "piece", reorder_level: "10",
    branch_id: "", initial_quantity: "0", status: "active" as InventoryStatus,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setF({
      name: item?.name ?? "", sku: item?.sku ?? "", description: item?.description ?? "",
      category: item?.category ?? "book",
      unit_cost: String(item?.unit_cost ?? 0), sale_price: String(item?.sale_price ?? 0),
      unit_of_measure: item?.unit_of_measure ?? "piece", reorder_level: String(item?.reorder_level ?? 10),
      branch_id: defaultBranchId ?? "", initial_quantity: "0", status: item?.status ?? "active",
    });
  }, [open, item, defaultBranchId]);

  const save = useMutation({
    mutationFn: async () => {
      const unit_cost = Number(f.unit_cost), sale_price = Number(f.sale_price);
      const reorder_level = Number(f.reorder_level), qty = Number(f.initial_quantity);
      if (!f.name.trim()) throw new Error(t("errName"));
      if (!(unit_cost >= 0) || !(sale_price >= 0)) throw new Error(t("errPrices"));
      if (!Number.isInteger(reorder_level) || reorder_level < 0) throw new Error(t("errReorder"));
      if (!item) {
        if (!Number.isInteger(qty) || qty < 0) throw new Error(t("errOpeningQty"));
        if (qty > 0 && !f.branch_id) throw new Error(t("errOpeningBranch"));
      }
      const base = {
        name: f.name.trim(), sku: f.sku.trim() || undefined, description: f.description.trim() || undefined,
        category: f.category, unit_cost, sale_price, unit_of_measure: f.unit_of_measure.trim() || "piece", reorder_level,
      };
      return item
        ? inventoryApi.updateItem(item.id, { ...base, status: f.status })
        : inventoryApi.createItem({ ...base, branch_id: f.branch_id || undefined, initial_quantity: qty || undefined });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: item ? t("itemUpdated") : t("itemCreated") });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!open) return null;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background p-6">
        <h2 className="text-lg font-semibold">{item ? t("editItem") : t("newInventoryItem")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">{t("fName")}<input className={field} value={f.name} onChange={set("name")} maxLength={200} /></label>
          <label className="text-sm">{t("fSku")}<input className={field} value={f.sku} onChange={set("sku")} maxLength={50} /></label>
          <label className="text-sm">{t("category")} *
            <select className={field} value={f.category} onChange={set("category")}>
              {INVENTORY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">{t("fDescription")}<textarea className={field} value={f.description} onChange={set("description")} rows={2} /></label>
          <label className="text-sm">{t("fUnitCost")}<input type="number" min="0" step="0.01" className={field} value={f.unit_cost} onChange={set("unit_cost")} /></label>
          <label className="text-sm">{t("fSalePrice")}<input type="number" min="0" step="0.01" className={field} value={f.sale_price} onChange={set("sale_price")} /></label>
          <label className="text-sm">{t("fUom")}<input className={field} value={f.unit_of_measure} onChange={set("unit_of_measure")} maxLength={20} /></label>
          <label className="text-sm">{t("fReorder")}<input type="number" min="0" step="1" className={field} value={f.reorder_level} onChange={set("reorder_level")} /></label>
          {item ? (
            <label className="text-sm">{t("status")}
              <select className={field} value={f.status} onChange={set("status")}>
                <option value="active">{t("statusActive")}</option>
                <option value="discontinued">{t("fStatusDiscontinued")}</option>
                <option value="archived">{t("statusArchived")}</option>
              </select>
            </label>
          ) : (
            <>
              <label className="text-sm">{t("fOpeningBranch")}
                <select className={field} value={f.branch_id} onChange={set("branch_id")}>
                  <option value="">—</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <label className="text-sm">{t("fOpeningQty")}<input type="number" min="0" step="1" className={field} value={f.initial_quantity} onChange={set("initial_quantity")} /></label>
            </>
          )}
        </div>
        {item && <p className="mt-3 text-xs text-muted-foreground">{t("qtyNotEditable")}</p>}
        {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>{t("cancel")}</Button>
          <Button onClick={() => { setError(""); save.mutate(); }} disabled={save.isPending}>{save.isPending ? t("saving") : t("save")}</Button>
        </div>
      </div>
    </div>
  );
}
