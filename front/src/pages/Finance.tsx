import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { financeApi, downloadBlob } from "@/api/finance";
import { studentsApi } from "@/api/students";
import { branchesApi } from "@/api/branches";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, FileDown } from "lucide-react";

export default function FinancePage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("invoices");
  const [invForm, setInvForm] = useState({
    show: false, student_id: "", branch_id: "",
    description: "", quantity: 1, unit_price: 0,
    discount_amount: 0, promo_code: "",
  });
  const [payForm, setPayForm] = useState({ show: false, invoice_id: "", amount: 0, method: "CASH", reference: "" });
  const [promoForm, setPromoForm] = useState({ show: false, code: "", type: "percentage", value: 0, expiry_date: "" });
  const [refundForm, setRefundForm] = useState({ show: false, payment_id: "", amount: 0, reason_code: "", reason_note: "" });

  const invQ = useQuery({ queryKey: ["invoices"], queryFn: () => financeApi.listInvoices({ limit: 50 }), enabled: tab === "invoices" });
  const payQ = useQuery({ queryKey: ["payments"], queryFn: () => financeApi.listPayments(), enabled: tab === "payments" });
  const promoQ = useQuery({ queryKey: ["promos"], queryFn: () => financeApi.listPromos(), enabled: tab === "promos" });
  const refundQ = useQuery({ queryKey: ["refunds"], queryFn: () => financeApi.listRefunds(), enabled: tab === "refunds" });
  const ledgerQ = useQuery({ queryKey: ["ledger"], queryFn: () => financeApi.ledger(), enabled: tab === "ledger" });
  const recvQ = useQuery({ queryKey: ["receivables"], queryFn: () => financeApi.receivables(), enabled: tab === "ledger" });
  const { data: students } = useQuery({ queryKey: ["students"], queryFn: () => studentsApi.findAll() });
  const { data: branches } = useQuery({ queryKey: ["branches"], queryFn: () => branchesApi.findAll() });

  const invM = useMutation({
    mutationFn: () => financeApi.createInvoice({
      student_id: invForm.student_id, branch_id: invForm.branch_id,
      items: [{ description: invForm.description, quantity: Number(invForm.quantity), unit_price: Number(invForm.unit_price) }],
      discount_amount: Number(invForm.discount_amount) || undefined,
      promo_code: invForm.promo_code || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); setInvForm({ ...invForm, show: false }); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const payM = useMutation({
    mutationFn: () => financeApi.recordPayment({
      invoice_id: payForm.invoice_id, amount: Number(payForm.amount),
      method: payForm.method as "CASH" | "BANK_TRANSFER" | "EASYKASH", reference: payForm.reference || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payments"] }); queryClient.invalidateQueries({ queryKey: ["invoices"] }); setPayForm({ ...payForm, show: false }); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const promoM = useMutation({
    mutationFn: () => financeApi.createPromo({
      code: promoForm.code, type: promoForm.type as "percentage" | "fixed",
      value: Number(promoForm.value), expiry_date: promoForm.expiry_date,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["promos"] }); setPromoForm({ ...promoForm, show: false }); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const refundM = useMutation({
    mutationFn: () => financeApi.createRefund({
      payment_id: refundForm.payment_id, amount: Number(refundForm.amount),
      reason_code: refundForm.reason_code, reason_note: refundForm.reason_note || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["refunds"] }); setRefundForm({ ...refundForm, show: false }); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });

  const decideM = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) => financeApi.decideRefund(id, action),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["refunds"] }); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const processM = useMutation({
    mutationFn: (id: string) => financeApi.processRefund(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["refunds"] }); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const invoiceRows = Array.isArray(invQ.data) ? invQ.data : invQ.data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("nav.finance")}</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="promos">Promo codes</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>


        <TabsContent value="invoices">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setInvForm({ ...invForm, show: !invForm.show })}>
              {invForm.show ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Invoice
            </Button>
          </div>
          {invForm.show && (
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-base">New invoice</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <select value={invForm.student_id} onChange={(e) => setInvForm({ ...invForm, student_id: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select</option>
                    {(students ?? []).map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.user ? `${s.user.first_name} ${s.user.last_name}` : s.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <select value={invForm.branch_id} onChange={(e) => setInvForm({ ...invForm, branch_id: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select</option>
                    {(branches ?? []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Item description *</Label>
                  <Input value={invForm.description} onChange={(e) => setInvForm({ ...invForm, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" value={invForm.quantity} onChange={(e) => setInvForm({ ...invForm, quantity: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Unit price</Label>
                  <Input type="number" value={invForm.unit_price} onChange={(e) => setInvForm({ ...invForm, unit_price: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Promo code</Label>
                  <Input value={invForm.promo_code} onChange={(e) => setInvForm({ ...invForm, promo_code: e.target.value })} />
                </div>
                <div className="md:col-span-3">
                  <Button
                    disabled={invM.isPending || !invForm.student_id || !invForm.branch_id || !invForm.description}
                    onClick={() => invM.mutate()}
                  >{t("common.save")}</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <DataTable
            columns={[
              { key: "invoice_number", header: "Number" },
              { key: "status", header: t("common.status"), render: (r: any) => <Badge className="bg-blue-100 text-blue-800">{r.status}</Badge> },
              { key: "total_amount", header: "Total" },
              { key: "balance_due", header: "Balance" },
            ]}
            data={invoiceRows}
            isLoading={invQ.isLoading}
            isError={invQ.isError}
            errorMessage={(invQ.error as Error)?.message}
            onRetry={invQ.refetch}
            keyExtractor={(r: any) => r.id}
            pageSize={10}
          />

        <TabsContent value="payments">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setPayForm({ ...payForm, show: !payForm.show })}>
              {payForm.show ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Payment
            </Button>
          </div>
          {payForm.show && (
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-base">Record payment</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Invoice ID *</Label>
                  <Input value={payForm.invoice_id} onChange={(e) => setPayForm({ ...payForm, invoice_id: e.target.value })} placeholder="invoice uuid" />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {["CASH", "BANK_TRANSFER", "EASYKASH"].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
                </div>
                <div className="md:col-span-4">
                  <Button disabled={payM.isPending || !payForm.invoice_id || !payForm.amount} onClick={() => payM.mutate()}>{t("common.save")}</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <DataTable
            columns={[
              { key: "receipt_number", header: "Receipt" },
              { key: "amount", header: "Amount" },
              { key: "method", header: "Method" },
              { key: "status", header: t("common.status") },
              {
                key: "pdf",
                header: "PDF",
                render: (r: any) => (
                  <Button size="sm" variant="outline" onClick={async (e) => {
                    e.stopPropagation();
                    const blob = await financeApi.receiptPdf(r.id);
                    downloadBlob(blob, `receipt-${r.receipt_number ?? r.id}.pdf`);
                  }}><FileDown className="h-3 w-3" /></Button>
                ),
              },
            ]}
            data={payQ.data ?? []}
            isLoading={payQ.isLoading}
            isError={payQ.isError}
            errorMessage={(payQ.error as Error)?.message}
            onRetry={payQ.refetch}
            keyExtractor={(r: any) => r.id}
            pageSize={10}
          />
        </TabsContent>

        </TabsContent>

        <TabsContent value="promos">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setPromoForm({ ...promoForm, show: !promoForm.show })}>
              {promoForm.show ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Promo
            </Button>
          </div>
          {promoForm.show && (
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-base">New promo code</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select value={promoForm.type} onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="percentage">percentage</option>
                    <option value="fixed">fixed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input type="number" value={promoForm.value} onChange={(e) => setPromoForm({ ...promoForm, value: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Expiry *</Label>
                  <Input type="date" value={promoForm.expiry_date} onChange={(e) => setPromoForm({ ...promoForm, expiry_date: e.target.value })} />
                </div>
                <div className="md:col-span-4">
                  <Button disabled={promoM.isPending || !promoForm.code || !promoForm.expiry_date} onClick={() => promoM.mutate()}>{t("common.save")}</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <DataTable
            columns={[
              { key: "code", header: "Code" },
              { key: "type", header: "Type" },
              { key: "value", header: "Value" },
              { key: "status", header: t("common.status") },
              {
                key: "toggle",
                header: t("common.actions"),
                render: (r: any) => (
                  <Button size="sm" variant="outline" onClick={async (e) => {
                    e.stopPropagation();
                    await financeApi.setPromoStatus(r.id, r.status === "active" ? "inactive" : "active");
                    queryClient.invalidateQueries({ queryKey: ["promos"] });
                  }}>{r.status === "active" ? "Deactivate" : "Activate"}</Button>
                ),
              },
            ]}
            data={promoQ.data ?? []}
            isLoading={promoQ.isLoading}
            isError={promoQ.isError}
            errorMessage={(promoQ.error as Error)?.message}
            onRetry={promoQ.refetch}
            keyExtractor={(r: any) => r.id}
            pageSize={10}
          />
        </TabsContent>
        <TabsContent value="refunds">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setRefundForm({ ...refundForm, show: !refundForm.show })}>
              {refundForm.show ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Refund
            </Button>
          </div>
          {refundForm.show && (
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-base">Request refund</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Payment ID *</Label>
                  <Input value={refundForm.payment_id} onChange={(e) => setRefundForm({ ...refundForm, payment_id: e.target.value })} placeholder="payment uuid" />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" value={refundForm.amount} onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Reason code *</Label>
                  <Input value={refundForm.reason_code} onChange={(e) => setRefundForm({ ...refundForm, reason_code: e.target.value })} placeholder="duplicate_payment" />
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Input value={refundForm.reason_note} onChange={(e) => setRefundForm({ ...refundForm, reason_note: e.target.value })} />
                </div>
                <div className="md:col-span-4">
                  <Button
                    disabled={refundM.isPending || !refundForm.payment_id || !refundForm.amount || !refundForm.reason_code}
                    onClick={() => refundM.mutate()}
                  >{t("common.save")}</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <DataTable
            columns={[
              { key: "amount", header: "Amount" },
              { key: "status", header: t("common.status"), render: (r: any) => <Badge className="bg-yellow-100 text-yellow-800">{r.status}</Badge> },
              {
                key: "decision",
                header: t("common.actions"),
                render: (r: any) => (
                  <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => decideM.mutate({ id: r.id, action: "approve" })}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => decideM.mutate({ id: r.id, action: "reject" })}>Reject</Button>
                    <Button size="sm" onClick={() => processM.mutate(r.id)}>Process</Button>
                  </span>
                ),
              },
            ]}
            data={refundQ.data ?? []}
            isLoading={refundQ.isLoading}
            isError={refundQ.isError}
            errorMessage={(refundQ.error as Error)?.message}
            onRetry={refundQ.refetch}
            keyExtractor={(r: any) => r.id}
            pageSize={10}
          />
        </TabsContent>
        <TabsContent value="ledger">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Ledger</CardTitle></CardHeader>
              <CardContent>
                {ledgerQ.isLoading
                  ? <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                  : <pre className="max-h-96 overflow-auto text-xs">{JSON.stringify(ledgerQ.data ?? [], null, 2)}</pre>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Receivables</CardTitle></CardHeader>
              <CardContent>
                {recvQ.isLoading
                  ? <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                  : <pre className="max-h-96 overflow-auto text-xs">{JSON.stringify(recvQ.data ?? [], null, 2)}</pre>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
