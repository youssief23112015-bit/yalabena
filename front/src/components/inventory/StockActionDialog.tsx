import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { inventoryApi, type InventoryItem } from "@/api/inventory";
import { studentsApi } from "@/api/students";
import type { Branch } from "@/types";

export type StockMode = "receive" | "adjust" | "transfer" | "issue";

const field = "mt-1 w-full rounded-md border bg-background p-2";
const TITLE_KEYS: Record<StockMode, string> = {
  receive: "titleReceive", adjust: "titleAdjust", transfer: "titleTransfer", issue: "titleIssue",
};

interface Props {
  mode: StockMode | null;
  item: InventoryItem | null;
  branches: Branch[];
  defaultBranchId?: string;
  onClose: () => void;
}

export function StockActionDialog({ mode, item, branches, defaultBranchId, onClose }: Props) {
  const { t } = useTranslation("inventory");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [branch, setBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");
  const [student, setStudent] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [charge, setCharge] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mode) return;
    setBranch(defaultBranchId ?? ""); setToBranch(""); setQty(mode === "adjust" ? "" : "1");
    setUnitCost(""); setReason(""); setStudent(""); setStudentFilter(""); setError("");
    setCharge(mode === "issue" && item ? String(item.sale_price) : "");
  }, [mode, item, defaultBranchId]);

  const { data: students } = useQuery({
    queryKey: ["students", "for-inventory"],
    queryFn: () => studentsApi.findAll(),
    enabled: mode === "issue",
  });
  const visibleStudents = useMemo(() => {
    const q = studentFilter.trim().toLowerCase();
    return (students ?? []).filter((s: any) => {
      const name = `${s.user?.first_name ?? s.first_name ?? ""} ${s.user?.last_name ?? s.last_name ?? ""} ${s.student_number ?? ""}`.toLowerCase();
      return !q || name.includes(q);
    }).slice(0, 100);
  }, [students, studentFilter]);

  const run = useMutation({
    mutationFn: async () => {
      if (!item || !mode) return;
      const n = Number(qty);
      if (!Number.isInteger(n) || n === 0) throw new Error(t("errQty"));
      if (mode !== "adjust" && n < 0) throw new Error(t("errQtyPos"));
      if (!branch) throw new Error(t("errBranch"));
      if (mode === "receive") {
        const c = unitCost === "" ? undefined : Number(unitCost);
        if (c !== undefined && !(c >= 0)) throw new Error(t("errCostNeg"));
        return inventoryApi.receive(item.id, { branch_id: branch, quantity: n, unit_cost: c, reason: reason.trim() || undefined });
      }
      if (mode === "adjust") {
        if (!reason.trim()) throw new Error(t("errReasonAdj"));
        return inventoryApi.adjust(item.id, { branch_id: branch, quantity: n, reason: reason.trim() });
      }
      if (mode === "transfer") {
        if (!toBranch) throw new Error(t("errDest"));
        if (toBranch === branch) throw new Error(t("errSame"));
        return inventoryApi.transfer(item.id, { from_branch_id: branch, to_branch_id: toBranch, quantity: n, reason: reason.trim() || undefined });
      }
      if (!student) throw new Error(t("errStudent"));
      const cost = charge === "" ? undefined : Number(charge);
      if (cost !== undefined && !(cost >= 0)) throw new Error(t("errChargeNeg"));
      return inventoryApi.issue({ item_id: item.id, student_id: student, branch_id: branch, quantity: n, cost });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: t("saved") });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!mode || !item) return null;
  const branchSelect = (label: string, value: string, onChange: (v: string) => void) => (
    <label className="block text-sm">{label}
      <select className={field} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t("selectBranch")}</option>
        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border bg-background p-6">
        <h2 className="text-lg font-semibold">{t(TITLE_KEYS[mode])}</h2>
        <p className="text-sm text-muted-foreground">{item.name}{item.sku ? ` · ${item.sku}` : ""}</p>
        <div className="mt-4 space-y-3">
          {branchSelect(mode === "transfer" ? t("fromBranch") : t("branch"), branch, setBranch)}
          {mode === "transfer" && branchSelect(t("toBranch"), toBranch, setToBranch)}
          {mode === "issue" && (
            <>
              <label className="block text-sm">{t("colStudent")}
                <input className={field} placeholder={t("filterStudent")} value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} />
                <select className={field} value={student} onChange={(e) => setStudent(e.target.value)} size={4}>
                  {visibleStudents.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {(s.user?.first_name ?? s.first_name ?? "")} {(s.user?.last_name ?? s.last_name ?? "")} — {s.student_number}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="block text-sm">
            {mode === "adjust" ? t("changeQty") : t("quantity")}
            <input type="number" step="1" className={field} value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          {mode === "receive" && (
            <label className="block text-sm">{t("unitCostOpt")}
              <input type="number" min="0" step="0.01" className={field} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </label>
          )}
          {mode === "issue" && (
            <label className="block text-sm">{t("chargeOpt")}
              <input type="number" min="0" step="0.01" className={field} value={charge} onChange={(e) => setCharge(e.target.value)} />
            </label>
          )}
          {mode !== "issue" && (
            <label className="block text-sm">{mode === "adjust" ? t("reasonReq") : t("reasonLbl")}
              <input className={field} value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
            </label>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={run.isPending}>{t("cancel")}</Button>
          <Button onClick={() => { setError(""); run.mutate(); }} disabled={run.isPending}>{run.isPending ? t("saving") : t("confirm")}</Button>
        </div>
      </div>
    </div>
  );
}
