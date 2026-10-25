import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Download, Plus } from "lucide-react";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { useUserRoles, hasAnyRole } from "@/lib/rbac";
import { branchesApi } from "@/api/branches";
import {
  inventoryApi, downloadCsv, INVENTORY_CATEGORIES,
  type InventoryItem, type ItemIssue, type StockMove, type LowStockRow, type ItemCondition,
} from "@/api/inventory";
import { ItemFormDialog } from "@/components/inventory/ItemFormDialog";
import { StockActionDialog, type StockMode } from "@/components/inventory/StockActionDialog";

const sel = "rounded-md border bg-background p-2 text-sm";
const money = (n: number) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const when = (s?: string | null) => (s ? new Date(s).toLocaleString() : "—");
const personName = (i: ItemIssue) =>
  i.student ? `${i.student.user?.first_name ?? ""} ${i.student.user?.last_name ?? ""}`.trim() || i.student.student_number || i.student_id.slice(0, 8) : i.student_id.slice(0, 8);

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const h = setTimeout(() => setV(value), ms); return () => clearTimeout(h); }, [value, ms]);
  return v;
}

export default function InventoryPage() {
  const { t: tc } = useTranslation("common");
  const { t } = useTranslation("inventory");
  const { toast } = useToast();
  const qc = useQueryClient();
  const roles = useUserRoles();
  const user = useAuthStore((s) => s.user) as any;
  const canManage = hasAnyRole(roles, ["super_admin", "branch_manager"]);
  const canIssue = hasAnyRole(roles, ["super_admin", "branch_manager", "sales"]);
  const ownBranch: string | undefined = user?.branchId ?? user?.branch_id ?? undefined;
  const isGlobal = hasAnyRole(roles, ["super_admin", "finance", "auditor"]);

  const [tab, setTab] = useState("items");
  const [branchId, setBranchId] = useState<string>(isGlobal ? "" : ownBranch ?? "");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("active");
  const [lowOnly, setLowOnly] = useState(false);
  const [moveType, setMoveType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openIssuesOnly, setOpenIssuesOnly] = useState(false);
  const [formItem, setFormItem] = useState<InventoryItem | null | undefined>(undefined); // undefined=closed, null=create
  const [action, setAction] = useState<{ mode: StockMode; item: InventoryItem } | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<InventoryItem | null>(null);
  const q = useDebounced(search);
  const scopedBranch = branchId || undefined;

  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => branchesApi.findAll() });

  const itemsQ = useQuery({
    queryKey: ["inventory", "items", { scopedBranch, q, category, status, lowOnly }],
    queryFn: () => inventoryApi.items({ branch_id: scopedBranch, search: q, category, status, low_stock_only: lowOnly || undefined, limit: 200 }),
    enabled: tab === "items",
  });
  const movesQ = useQuery({
    queryKey: ["inventory", "moves", { scopedBranch, moveType, from, to }],
    queryFn: () => inventoryApi.moves({ branch_id: scopedBranch, type: moveType, from, to, limit: 200 }),
    enabled: tab === "moves",
  });
  const issuesQ = useQuery({
    queryKey: ["inventory", "issues", { scopedBranch, openIssuesOnly }],
    queryFn: () => inventoryApi.issues({ branch_id: scopedBranch, open_only: openIssuesOnly || undefined, limit: 200 }),
    enabled: tab === "issues",
  });
  const lowQ = useQuery({ queryKey: ["inventory", "low", scopedBranch], queryFn: () => inventoryApi.lowStock(scopedBranch), enabled: tab === "alerts" });
  const valQ = useQuery({ queryKey: ["inventory", "valuation", scopedBranch], queryFn: () => inventoryApi.valuation(scopedBranch), enabled: tab === "valuation" });
  const repQ = useQuery({
    queryKey: ["inventory", "movement-report", { scopedBranch, from, to }],
    queryFn: () => inventoryApi.movementReport({ branch_id: scopedBranch, from, to }),
    enabled: tab === "valuation",
  });
  const detailsQ = useQuery({
    queryKey: ["inventory", "item", detailsId, scopedBranch],
    queryFn: () => inventoryApi.item(detailsId!, scopedBranch),
    enabled: !!detailsId,
  });

  const deactivate = useMutation({
    mutationFn: (it: InventoryItem) => inventoryApi.removeItem(it.id),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: r.deleted ? t("itemDeleted") : t("itemArchived"), description: r.message });
      setConfirmDeactivate(null);
    },
    onError: (e: Error) => { toast({ variant: "destructive", title: tc("common.error"), description: e.message }); setConfirmDeactivate(null); },
  });

  const returnM = useMutation({
    mutationFn: ({ id, condition }: { id: string; condition: ItemCondition }) => inventoryApi.returnIssue(id, condition),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); toast({ title: t("returnRecorded") }); },
    onError: (e: Error) => toast({ variant: "destructive", title: tc("common.error"), description: e.message }),
  });

  const branchSelect = (
    <select className={sel} value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={!isGlobal && !!ownBranch} aria-label={t("branch")}>
      {isGlobal && <option value="">{t("allBranches")}</option>}
      {branches.filter((b) => isGlobal || b.id === ownBranch).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
    </select>
  );

  const itemCols: Column<InventoryItem>[] = useMemo(() => [
    { key: "name", header: t("colItem"), sortable: true, render: (r) => (
      <button className="text-left font-medium text-primary hover:underline" onClick={() => setDetailsId(r.id)}>
        {r.name}<div className="text-xs font-normal text-muted-foreground">{r.sku ?? t("noCode")}</div>
      </button>) },
    { key: "category", header: t("colCategory"), sortable: true },
    { key: "quantity", header: scopedBranch ? t("colOnHandBranch") : t("colOnHandAll"), sortable: true, render: (r) => (
      <span className="flex items-center gap-2">{r.quantity} {r.unit_of_measure}
        {r.is_low_stock && <Badge variant="destructive">{t("low")}</Badge>}</span>) },
    { key: "reorder_level", header: t("colReorder") },
    { key: "unit_cost", header: t("colCost"), render: (r) => money(r.unit_cost) },
    { key: "sale_price", header: t("colPrice"), render: (r) => money(r.sale_price) },
    { key: "status", header: t("colStatus"), render: (r) => <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge> },
    { key: "actions", header: "", render: (r) => (
      <div className="flex flex-wrap justify-end gap-1">
        {canManage && r.status === "active" && <Button size="sm" variant="ghost" onClick={() => setAction({ mode: "receive", item: r })}>{t("receive")}</Button>}
        {canIssue && r.status === "active" && <Button size="sm" variant="ghost" onClick={() => setAction({ mode: "issue", item: r })}>{t("issue")}</Button>}
        {canManage && <Button size="sm" variant="ghost" onClick={() => setAction({ mode: "adjust", item: r })}>{t("adjust")}</Button>}
        {canManage && r.status === "active" && <Button size="sm" variant="ghost" onClick={() => setAction({ mode: "transfer", item: r })}>{t("transfer")}</Button>}
        {canManage && <Button size="sm" variant="ghost" onClick={() => setFormItem(r)}>{t("edit")}</Button>}
        {canManage && r.status === "active" && <Button size="sm" variant="ghost" onClick={() => setConfirmDeactivate(r)}>{t("deactivate")}</Button>}
      </div>) },
  ], [canManage, canIssue, scopedBranch, t]);

  const moveCols: Column<StockMove>[] = [
    { key: "created_at", header: t("colDate"), render: (r) => when(r.created_at) },
    { key: "item", header: t("colItem"), render: (r) => r.item?.name ?? r.item_id.slice(0, 8) },
    { key: "branch", header: t("colBranch"), render: (r) => r.branch?.name ?? "—" },
    { key: "type", header: t("colType"), render: (r) => <Badge variant="secondary">{r.type}</Badge> },
    { key: "quantity", header: t("colQty"), render: (r) => (r.quantity > 0 && r.type === "adjustment" ? `+${r.quantity}` : r.quantity) },
    { key: "reason", header: t("colReason") },
    { key: "by", header: t("colBy"), render: (r) => `${r.creator?.first_name ?? ""} ${r.creator?.last_name ?? ""}`.trim() || "—" },
  ];

  const issueCols: Column<ItemIssue>[] = [
    { key: "issued_at", header: t("colIssued"), render: (r) => when(r.issued_at) },
    { key: "student", header: t("colStudent"), render: (r) => personName(r) },
    { key: "item", header: t("colItem"), render: (r) => r.item?.name ?? "—" },
    { key: "quantity", header: t("colQty") },
    { key: "cost", header: t("colCharge"), render: (r) => money(r.cost) },
    { key: "returned", header: t("colStatus"), render: (r) => r.returned_at ? <Badge variant="secondary">{t("returned")} ({r.condition_on_return})</Badge> : <Badge>{t("withStudent")}</Badge> },
    { key: "actions", header: "", render: (r) => !r.returned_at && canIssue ? (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" disabled={returnM.isPending} onClick={() => returnM.mutate({ id: r.id, condition: "good" })}>{t("returnGood")}</Button>
        <Button size="sm" variant="ghost" disabled={returnM.isPending} onClick={() => returnM.mutate({ id: r.id, condition: "damaged" })}>{t("damaged")}</Button>
        <Button size="sm" variant="ghost" disabled={returnM.isPending} onClick={() => returnM.mutate({ id: r.id, condition: "lost" })}>{t("lost")}</Button>
      </div>) : null },
  ];

  const lowCols: Column<LowStockRow>[] = [
    { key: "name", header: t("colItem"), render: (r) => <>{r.name}<div className="text-xs text-muted-foreground">{r.sku ?? ""}</div></> },
    { key: "branch_name", header: t("colBranch") },
    { key: "quantity", header: t("colOnHand") },
    { key: "reorder_level", header: t("colReorderLevel") },
    { key: "shortage", header: t("colShortage"), render: (r) => <Badge variant="destructive">{r.shortage}</Badge> },
  ];

  const err = (e: unknown) => (e instanceof Error ? e.message : undefined);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{tc("nav.inventory")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {branchSelect}
          {canManage && <Button onClick={() => setFormItem(null)}><Plus className="me-1 h-4 w-4" />{t("newItem")}</Button>}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="items">{t("tabItems")}</TabsTrigger>
          <TabsTrigger value="moves">{t("tabMoves")}</TabsTrigger>
          <TabsTrigger value="issues">{t("tabIssues")}</TabsTrigger>
          <TabsTrigger value="alerts">{t("tabAlerts")}</TabsTrigger>
          <TabsTrigger value="valuation">{t("tabReports")}</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${sel} w-64`} placeholder={t("searchPh")} value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className={sel} value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t("category")}>
              <option value="">{t("allCategories")}</option>
              {INVENTORY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t("status")}>
              <option value="active">{t("statusActive")}</option><option value="discontinued">{t("statusDiscontinued")}</option>
              <option value="archived">{t("statusArchived")}</option><option value="">{t("allStatuses")}</option>
            </select>
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />{t("lowOnly")}</label>
            <Button variant="outline" size="sm" disabled={!itemsQ.data?.data.length} onClick={() => downloadCsv("inventory-items.csv", [
              ["Name", "SKU", "Category", "On hand", "Unit", "Reorder level", "Unit cost", "Sale price", "Status"],
              ...(itemsQ.data?.data ?? []).map((i) => [i.name, i.sku, i.category, i.quantity, i.unit_of_measure, i.reorder_level, i.unit_cost, i.sale_price, i.status]),
            ])}><Download className="me-1 h-4 w-4" />{t("csv")}</Button>
          </div>
          <DataTable columns={itemCols} data={itemsQ.data?.data ?? []} isLoading={itemsQ.isLoading} isError={itemsQ.isError}
            errorMessage={err(itemsQ.error)} onRetry={() => itemsQ.refetch()} emptyMessage={t("emptyItems")} keyExtractor={(r) => r.id} />
          {itemsQ.data && itemsQ.data.total > itemsQ.data.data.length && (
            <p className="text-xs text-muted-foreground">{t("showingFirst", { shown: itemsQ.data.data.length, total: itemsQ.data.total })}</p>
          )}
        </TabsContent>

        <TabsContent value="moves" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select className={sel} value={moveType} onChange={(e) => setMoveType(e.target.value)} aria-label={t("type")}>
              <option value="">{t("allTypes")}</option>
              {["in", "out", "adjustment", "return", "transfer_in", "transfer_out"].map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <label className="text-sm">{t("from")} <input type="date" className={sel} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="text-sm">{t("to")} <input type="date" className={sel} value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
          <DataTable columns={moveCols} data={movesQ.data?.data ?? []} isLoading={movesQ.isLoading} isError={movesQ.isError}
            errorMessage={err(movesQ.error)} onRetry={() => movesQ.refetch()} emptyMessage={t("emptyMoves")} keyExtractor={(r) => r.id} />
        </TabsContent>

        <TabsContent value="issues" className="space-y-3">
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={openIssuesOnly} onChange={(e) => setOpenIssuesOnly(e.target.checked)} />{t("notReturned")}</label>
          <DataTable columns={issueCols} data={issuesQ.data?.data ?? []} isLoading={issuesQ.isLoading} isError={issuesQ.isError}
            errorMessage={err(issuesQ.error)} onRetry={() => issuesQ.refetch()} emptyMessage={t("emptyIssues")} keyExtractor={(r) => r.id} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-3">
          <DataTable columns={lowCols} data={lowQ.data ?? []} isLoading={lowQ.isLoading} isError={lowQ.isError}
            errorMessage={err(lowQ.error)} onRetry={() => lowQ.refetch()} emptyMessage={t("emptyAlerts")}
            keyExtractor={(r) => `${r.item_id}-${r.branch_id}`} />
        </TabsContent>

        <TabsContent value="valuation" className="space-y-6">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("valuationTitle")}</h2>
              <Button variant="outline" size="sm" disabled={!valQ.data?.branches.length} onClick={() => downloadCsv("inventory-valuation.csv", [
                ["Branch", "Item", "SKU", "Quantity", "Unit cost", "Total"],
                ...(valQ.data?.branches ?? []).flatMap((b) => b.items.map((i) => [b.branch_name, i.item_name, i.sku, i.quantity, i.unit_cost, i.total_cost])),
              ])}><Download className="me-1 h-4 w-4" />{t("csv")}</Button>
            </div>
            {valQ.isLoading && <p className="text-sm">{t("loading")}</p>}
            {valQ.isError && <p className="text-sm text-destructive">{err(valQ.error)} <Button size="sm" variant="outline" onClick={() => valQ.refetch()}>{t("retry")}</Button></p>}
            {valQ.data && (valQ.data.branches.length === 0 ? <p className="text-sm text-muted-foreground">{t("noStock")}</p> : (
              <div className="space-y-3">
                {valQ.data.branches.map((b) => (
                  <div key={b.branch_id} className="rounded-lg border p-4">
                    <div className="flex justify-between font-medium"><span>{b.branch_name}</span><span>{b.total_quantity} {t("units")} · {money(b.total_cost)}</span></div>
                    <div className="mt-2 overflow-x-auto"><table className="w-full text-sm"><tbody>
                      {b.items.map((i) => <tr key={i.item_id} className="border-t"><td className="py-1">{i.item_name}</td><td>{i.quantity} × {money(i.unit_cost)}</td><td className="text-right">{money(i.total_cost)}</td></tr>)}
                    </tbody></table></div>
                  </div>
                ))}
                <p className="text-end font-semibold">{t("grandTotal")}: {money(valQ.data.grand_total_cost)}</p>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{t("movementSummary")}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm">{t("from")} <input type="date" className={sel} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
                <label className="text-sm">{t("to")} <input type="date" className={sel} value={to} onChange={(e) => setTo(e.target.value)} /></label>
                <Button variant="outline" size="sm" disabled={!repQ.data?.length} onClick={() => downloadCsv("inventory-movements.csv", [
                  ["Item", "SKU", "Type", "Moves", "Total quantity"],
                  ...(repQ.data ?? []).map((r) => [r.item_name, r.sku, r.type, r.moves, r.total_quantity]),
                ])}><Download className="me-1 h-4 w-4" />{t("csv")}</Button>
              </div>
            </div>
            {repQ.isLoading && <p className="text-sm">{t("loading")}</p>}
            {repQ.isError && <p className="text-sm text-destructive">{err(repQ.error)}</p>}
            {repQ.data && (repQ.data.length === 0 ? <p className="text-sm text-muted-foreground">{t("noMovesRange")}</p> : (
              <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm">
                <thead className="bg-muted"><tr>{[t("colItem"), t("colType"), t("colMoves"), t("colTotalQty")].map((h) => <th key={h} className="p-2 text-start">{h}</th>)}</tr></thead>
                <tbody>{repQ.data.map((r) => <tr key={`${r.item_id}-${r.type}`} className="border-t"><td className="p-2">{r.item_name}</td><td className="p-2">{r.type}</td><td className="p-2">{r.moves}</td><td className="p-2">{r.total_quantity}</td></tr>)}</tbody>
              </table></div>
            ))}
          </section>
        </TabsContent>
      </Tabs>

      <ItemFormDialog open={formItem !== undefined} item={formItem ?? null} branches={branches} defaultBranchId={scopedBranch ?? ownBranch} onClose={() => setFormItem(undefined)} />
      <StockActionDialog mode={action?.mode ?? null} item={action?.item ?? null} branches={branches} defaultBranchId={scopedBranch ?? ownBranch} onClose={() => setAction(null)} />

      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-lg border bg-background p-6">
            <h2 className="text-lg font-semibold">{t("deactivateTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("deactivateBody", { name: confirmDeactivate.name })}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDeactivate(null)} disabled={deactivate.isPending}>{t("cancel")}</Button>
              <Button onClick={() => deactivate.mutate(confirmDeactivate)} disabled={deactivate.isPending}>{deactivate.isPending ? t("working") : t("deactivate")}</Button>
            </div>
          </div>
        </div>
      )}

      {detailsId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border bg-background p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{detailsQ.data?.name ?? "Item"}</h2>
              <Button variant="outline" size="sm" onClick={() => setDetailsId(null)}>{t("close")}</Button>
            </div>
            {detailsQ.isLoading && <p className="mt-4 text-sm">{t("loading")}</p>}
            {detailsQ.isError && <p className="mt-4 text-sm text-destructive">{err(detailsQ.error)}</p>}
            {detailsQ.data && (
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div><p className="text-xs text-muted-foreground">{t("detailsCode")}</p>{detailsQ.data.sku ?? "—"}</div>
                  <div><p className="text-xs text-muted-foreground">{t("category")}</p>{detailsQ.data.category}</div>
                  <div><p className="text-xs text-muted-foreground">{t("status")}</p>{detailsQ.data.status}</div>
                  <div><p className="text-xs text-muted-foreground">{t("detailsCostPrice")}</p>{money(detailsQ.data.unit_cost)} / {money(detailsQ.data.sale_price)}</div>
                  <div><p className="text-xs text-muted-foreground">{t("colReorderLevel")}</p>{detailsQ.data.reorder_level}</div>
                  <div><p className="text-xs text-muted-foreground">{t("detailsTotal")}</p>{detailsQ.data.total_quantity} {detailsQ.data.unit_of_measure}</div>
                </div>
                {detailsQ.data.description && <p>{detailsQ.data.description}</p>}
                <div>
                  <h3 className="mb-1 font-semibold">{t("stockByBranch")}</h3>
                  {detailsQ.data.stock.length === 0 ? <p className="text-muted-foreground">{t("noStockRecords")}</p> : (
                    <ul className="divide-y rounded border">{detailsQ.data.stock.map((s) => (
                      <li key={s.branch_id} className="flex justify-between p-2"><span>{s.branch_name ?? s.branch_id.slice(0, 8)}</span><span>{s.quantity}</span></li>))}</ul>)}
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{t("recentMoves")}</h3>
                  {detailsQ.data.moves.length === 0 ? <p className="text-muted-foreground">{t("noMovesYet")}</p> : (
                    <div className="overflow-x-auto rounded border"><table className="w-full">
                      <tbody>{detailsQ.data.moves.map((m) => (
                        <tr key={m.id} className="border-t first:border-0"><td className="p-2">{when(m.created_at)}</td><td className="p-2">{m.type}</td><td className="p-2">{m.quantity}</td><td className="p-2">{m.reason}</td></tr>))}</tbody>
                    </table></div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
