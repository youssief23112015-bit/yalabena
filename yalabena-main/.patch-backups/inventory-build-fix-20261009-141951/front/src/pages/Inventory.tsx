import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Boxes, History, Plus, RefreshCw, Search } from "lucide-react";
import { inventoryApi, type InventoryCategory, type InventoryItem } from "@/api/inventory";
import { branchesApi } from "@/api/branches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type FormState = {
  name: string; sku: string; description: string; category: InventoryCategory;
  unit_cost: string; sale_price: string; unit_of_measure: string; reorder_level: string;
  initial_quantity: string; branch_id: string;
};
const emptyForm: FormState = {
  name: "", sku: "", description: "", category: "book", unit_cost: "0", sale_price: "0",
  unit_of_measure: "piece", reorder_level: "10", initial_quantity: "0", branch_id: "",
};

function quantityOf(item: InventoryItem): number {
  if (Array.isArray(item.stock)) return item.stock.reduce((sum, stock) => sum + Number(stock.quantity || 0), 0);
  return Number(item.stock?.quantity ?? 0);
}

export default function InventoryPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [branchId, setBranchId] = useState("");
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [moveItem, setMoveItem] = useState<InventoryItem | null>(null);
  const [moveType, setMoveType] = useState<"in" | "out" | "adjustment">("in");
  const [moveQuantity, setMoveQuantity] = useState("1");
  const [moveReason, setMoveReason] = useState("");

  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: branchesApi.findAll });
  const itemsQuery = useQuery({
    queryKey: ["inventory", branchId, lowOnly],
    queryFn: () => inventoryApi.list({ branch_id: branchId || undefined, low_stock_only: lowOnly }),
  });
  const movesQuery = useQuery({
    queryKey: ["inventory-moves", branchId],
    queryFn: () => inventoryApi.moves({ branch_id: branchId || undefined }),
  });
  const valuationQuery = useQuery({
    queryKey: ["inventory-valuation", branchId],
    queryFn: () => inventoryApi.valuation(branchId || undefined),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-moves"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-valuation"] });
  };
  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; dto: any }) => payload.id ? inventoryApi.update(payload.id, payload.dto) : inventoryApi.create(payload.dto),
    onSuccess: () => { refresh(); setShowForm(false); setEditing(null); setForm(emptyForm); toast({ title: t("inventory.saved") }); },
    onError: (error: any) => toast({ variant: "destructive", title: t("inventory.error"), description: error?.response?.data?.message || error.message }),
  });
  const moveMutation = useMutation({
    mutationFn: () => {
      if (!moveItem || !branchId) throw new Error(t("inventory.chooseBranch"));
      const quantity = Number(moveQuantity);
      if (!Number.isInteger(quantity) || quantity === 0 || (moveType !== "adjustment" && quantity < 1)) throw new Error(t("inventory.invalidQuantity"));
      return inventoryApi.adjust(moveItem.id, { branch_id: branchId, type: moveType, quantity, reason: moveReason.trim() });
    },
    onSuccess: () => { refresh(); setMoveItem(null); setMoveQuantity("1"); setMoveReason(""); toast({ title: t("inventory.movementSaved") }); },
    onError: (error: any) => toast({ variant: "destructive", title: t("inventory.error"), description: error?.response?.data?.message || error.message }),
  });

  const items = useMemo(() => (itemsQuery.data ?? []).filter((item) => {
    const query = search.trim().toLowerCase();
    return !query || item.name.toLowerCase().includes(query) || (item.sku ?? "").toLowerCase().includes(query);
  }), [itemsQuery.data, search]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, branch_id: branchId }); setShowForm(true); };
  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({ name: item.name, sku: item.sku ?? "", description: item.description ?? "", category: item.category,
      unit_cost: String(item.unit_cost ?? 0), sale_price: String(item.sale_price ?? 0), unit_of_measure: item.unit_of_measure ?? "piece",
      reorder_level: String(item.reorder_level ?? 10), initial_quantity: "0", branch_id: branchId });
    setShowForm(true);
  };
  const submitItem = (event: FormEvent) => {
    event.preventDefault();
    if (!editing && Number(form.initial_quantity) > 0 && !form.branch_id) {
      toast({ variant: "destructive", title: t("inventory.error"), description: t("inventory.chooseBranch") }); return;
    }
    const dto = {
      name: form.name.trim(), sku: form.sku.trim() || undefined, description: form.description.trim() || undefined,
      category: form.category, unit_cost: Number(form.unit_cost), sale_price: Number(form.sale_price),
      unit_of_measure: form.unit_of_measure.trim() || "piece", reorder_level: Number(form.reorder_level),
      ...(!editing ? { branch_id: form.branch_id || undefined, initial_quantity: Number(form.initial_quantity) } : {}),
    };
    saveMutation.mutate({ id: editing?.id, dto });
  };

  const money = (value: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "EGP", maximumFractionDigits: 2 }).format(Number(value || 0));
  const stockMoves = (movesQuery.data ?? []).slice(0, 12);

  return <div className="space-y-6 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">{t("inventory.title")}</h1><p className="text-sm text-muted-foreground">{t("inventory.subtitle")}</p></div>
      <Button onClick={openCreate}><Plus className="me-2 h-4 w-4" />{t("inventory.addItem")}</Button>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">{t("inventory.catalogItems")}</CardTitle><Boxes className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{itemsQuery.data?.length ?? "—"}</div></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">{t("inventory.lowStock")}</CardTitle><AlertTriangle className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{(itemsQuery.data ?? []).filter((i) => quantityOf(i) <= i.reorder_level).length}</div></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">{t("inventory.stockUnits")}</CardTitle><Boxes className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{(itemsQuery.data ?? []).reduce((sum, i) => sum + quantityOf(i), 0)}</div></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">{t("inventory.valuation")}</CardTitle><RefreshCw className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{money(valuationQuery.data?.grand_total_cost ?? 0)}</div></CardContent></Card>
    </div>

    <Card>
      <CardHeader><CardTitle>{t("inventory.catalog")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_auto]">
          <div className="relative"><Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="ps-9" placeholder={t("inventory.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)}><option value="">{t("inventory.allBranches")}</option>{(branchesQuery.data ?? []).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
          <Button variant={lowOnly ? "default" : "outline"} onClick={() => setLowOnly((value) => !value)}><AlertTriangle className="me-2 h-4 w-4" />{t("inventory.lowStockOnly")}</Button>
        </div>
        {itemsQuery.isLoading ? <p className="py-8 text-center text-muted-foreground">{t("loading")}</p> : itemsQuery.isError ? <div className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">{t("inventory.loadError")} <Button variant="outline" size="sm" className="ms-2" onClick={() => itemsQuery.refetch()}>{t("retry")}</Button></div> : items.length === 0 ? <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">{t("inventory.empty")}</div> :
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-start text-muted-foreground"><th className="p-3 text-start">{t("inventory.item")}</th><th className="p-3 text-start">{t("inventory.category")}</th><th className="p-3 text-end">{t("inventory.quantity")}</th><th className="p-3 text-end">{t("inventory.reorderLevel")}</th><th className="p-3 text-end">{t("inventory.unitCost")}</th><th className="p-3 text-start">{t("inventory.status")}</th><th className="p-3 text-end">{t("inventory.actions")}</th></tr></thead>
            <tbody>{items.map((item) => { const quantity = quantityOf(item); const low = quantity <= item.reorder_level; return <tr key={item.id} className="border-b last:border-0"><td className="p-3"><div className="font-medium">{item.name}</div><div className="text-xs text-muted-foreground">{item.sku || item.id.slice(0, 8)}</div></td><td className="p-3 capitalize">{item.category}</td><td className="p-3 text-end font-medium">{quantity} {item.unit_of_measure}</td><td className="p-3 text-end">{item.reorder_level}</td><td className="p-3 text-end">{money(item.unit_cost)}</td><td className="p-3"><Badge variant={low ? "destructive" : item.status === "active" ? "secondary" : "outline"}>{low ? t("inventory.low") : item.status}</Badge></td><td className="p-3"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(item)}>{t("inventory.edit")}</Button><Button variant="outline" size="sm" disabled={!branchId || item.status !== "active"} onClick={() => { setMoveItem(item); setMoveType("in"); }}>{t("inventory.moveStock")}</Button></div></td></tr>; })}</tbody></table></div>}
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />{t("inventory.recentMovements")}</CardTitle></CardHeader><CardContent>
      {movesQuery.isLoading ? <p className="text-muted-foreground">{t("loading")}</p> : movesQuery.isError ? <p className="text-sm text-destructive">{t("inventory.movesError")}</p> : stockMoves.length === 0 ? <p className="text-sm text-muted-foreground">{t("inventory.noMovements")}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b text-muted-foreground"><th className="p-2 text-start">{t("inventory.date")}</th><th className="p-2 text-start">{t("inventory.item")}</th><th className="p-2 text-start">{t("inventory.movement")}</th><th className="p-2 text-end">{t("inventory.quantity")}</th><th className="p-2 text-start">{t("inventory.reason")}</th></tr></thead><tbody>{stockMoves.map((move) => <tr key={move.id} className="border-b last:border-0"><td className="p-2">{new Date(move.created_at).toLocaleString()}</td><td className="p-2">{move.item?.name ?? move.item_id.slice(0, 8)}</td><td className="p-2 capitalize">{move.type.replace(/_/g, " ")}</td><td className="p-2 text-end">{move.quantity}</td><td className="p-2">{move.reason}</td></tr>)}</tbody></table></div>}
    </CardContent></Card>

    {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"><form onSubmit={submitItem} className="my-6 max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-background p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{editing ? t("inventory.editItem") : t("inventory.addItem")}</h2><Button type="button" variant="ghost" onClick={() => setShowForm(false)}>×</Button></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><Label>{t("inventory.name")}</Label><Input required maxLength={200} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-1"><Label>{t("inventory.sku")}</Label><Input maxLength={50} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div><div className="space-y-1"><Label>{t("inventory.category")}</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as InventoryCategory })}>{["book", "workbook", "merchandise", "stationery", "equipment", "other"].map((category) => <option key={category} value={category}>{category}</option>)}</select></div><div className="space-y-1"><Label>{t("inventory.unit")}</Label><Input required maxLength={20} value={form.unit_of_measure} onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })} /></div><div className="space-y-1"><Label>{t("inventory.unitCost")}</Label><Input required type="number" min="0" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /></div><div className="space-y-1"><Label>{t("inventory.salePrice")}</Label><Input required type="number" min="0" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} /></div><div className="space-y-1"><Label>{t("inventory.reorderLevel")}</Label><Input required type="number" min="0" step="1" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></div>{!editing && <><div className="space-y-1"><Label>{t("inventory.branch")}</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}><option value="">{t("inventory.selectBranch")}</option>{(branchesQuery.data ?? []).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div><div className="space-y-1"><Label>{t("inventory.openingStock")}</Label><Input type="number" min="0" step="1" value={form.initial_quantity} onChange={(e) => setForm({ ...form, initial_quantity: e.target.value })} /></div></>}<div className="space-y-1 sm:col-span-2"><Label>{t("inventory.description")}</Label><textarea className="min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t("cancel")}</Button><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? t("common.loading", "Saving...") : t("save")}</Button></div>
    </form></div>}

    {moveItem && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={(e) => { e.preventDefault(); moveMutation.mutate(); }} className="w-full max-w-md space-y-4 rounded-xl bg-background p-6 shadow-xl"><h2 className="text-xl font-semibold">{t("inventory.moveStock")}: {moveItem.name}</h2><div className="space-y-1"><Label>{t("inventory.movementType")}</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={moveType} onChange={(e) => setMoveType(e.target.value as "in" | "out" | "adjustment")}><option value="in">{t("inventory.receive")}</option><option value="out">{t("inventory.issue")}</option><option value="adjustment">{t("inventory.adjustment")}</option></select></div><div className="space-y-1"><Label>{t("inventory.quantity")}{moveType === "adjustment" ? ` (${t("inventory.adjustmentHint")})` : ""}</Label><Input required type="number" step="1" value={moveQuantity} onChange={(e) => setMoveQuantity(e.target.value)} /></div><div className="space-y-1"><Label>{t("inventory.reason")}</Label><Input required maxLength={255} value={moveReason} onChange={(e) => setMoveReason(e.target.value)} /></div><p className="text-xs text-muted-foreground">{t("inventory.branch")}: {(branchesQuery.data ?? []).find((b) => b.id === branchId)?.name ?? t("inventory.selectBranch")}</p><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setMoveItem(null)}>{t("cancel")}</Button><Button type="submit" disabled={moveMutation.isPending}>{moveMutation.isPending ? t("common.loading", "Saving...") : t("inventory.saveMovement")}</Button></div></form></div>}
  </div>;
}
