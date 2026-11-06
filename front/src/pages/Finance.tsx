import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { financeApi, downloadBlob } from "@/api/finance";
import { studentsApi } from "@/api/students";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, FileDown, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function FinancePage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("analytics");
  const [period, setPeriod] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const invFormState = { show: false, student_id: "", description: "", quantity: 1, unit_price: 0, discount_amount: 0, promo_code: "" };
  const payFormState = { show: false, invoice_id: "", amount: 0, method: "CASH" as "CASH" | "BANK_TRANSFER" | "EASYKASH", reference: "" };
  const promoFormState = { show: false, code: "", type: "percentage" as "percentage" | "fixed", value: 0, expiry_date: "" };
  const refundFormState = { show: false, payment_id: "", amount: 0, reason_code: "", reason_note: "" };

  const financeQ = useQuery({
    queryKey: ["finance-dashboard", period, from, to],
    queryFn: () => financeApi.getFinanceDashboard({ period, from: from || undefined, to: to || undefined }),
    enabled: tab === "analytics",
  });
  const invQ = useQuery({ queryKey: ["invoices"], queryFn: () => financeApi.listInvoices({ limit: 50 }), enabled: tab === "invoices" });
  const payQ = useQuery({ queryKey: ["payments"], queryFn: () => financeApi.listPayments(), enabled: tab === "payments" });
  const promoQ = useQuery({ queryKey: ["promos"], queryFn: () => financeApi.listPromos(), enabled: tab === "promos" });
  const refundQ = useQuery({ queryKey: ["refunds"], queryFn: () => financeApi.listRefunds(), enabled: tab === "refunds" });
  const ledgerQ = useQuery({ queryKey: ["ledger"], queryFn: () => financeApi.ledger(), enabled: tab === "ledger" });
  const recvQ = useQuery({ queryKey: ["receivables"], queryFn: () => financeApi.receivables(), enabled: tab === "ledger" });
  const { data: students } = useQuery({ queryKey: ["students"], queryFn: () => studentsApi.findAll() });

  const invM = useMutation({
    mutationFn: () => financeApi.createInvoice({
      student_id: invFormState.student_id,
      items: [{ description: invFormState.description, quantity: Number(invFormState.quantity), unit_price: Number(invFormState.unit_price) }],
      discount_amount: Number(invFormState.discount_amount) || undefined,
      promo_code: invFormState.promo_code || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); setInvFormShow(false); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const payM = useMutation({
    mutationFn: () => financeApi.recordPayment({
      invoice_id: payFormState.invoice_id, amount: Number(payFormState.amount),
      method: payFormState.method, reference: payFormState.reference || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payments"] }); queryClient.invalidateQueries({ queryKey: ["invoices"] }); setPayFormShow(false); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const promoM = useMutation({
    mutationFn: () => financeApi.createPromo({
      code: promoFormState.code, type: promoFormState.type, value: Number(promoFormState.value), expiry_date: promoFormState.expiry_date,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["promos"] }); setPromoFormShow(false); toast({ title: t("common.success") }); },
    onError: (e: any) => toast({ variant: "destructive", title: t("common.error"), description: e.message }),
  });
  const refundM = useMutation({
    mutationFn: () => financeApi.createRefund({
      payment_id: refundFormState.payment_id, amount: Number(refundFormState.amount),
      reason_code: refundFormState.reason_code, reason_note: refundFormState.reason_note || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["refunds"] }); setRefundFormShow(false); toast({ title: t("common.success") }); },
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

  const [invFormShow, setInvFormShow] = useState(invFormState.show);
  const [payFormShow, setPayFormShow] = useState(payFormState.show);
  const [promoFormShow, setPromoFormShow] = useState(promoFormState.show);
  const [refundFormShow, setRefundFormShow] = useState(refundFormState.show);

  const data = financeQ.data ?? {};
  const kpis: Record<string, any> = data.kpis ?? {};
  const timeSeries: Record<string, any[]> = data.time_series ?? {};
  const pipeline: Record<string, any> = data.pipeline ?? {};
  const latestPayments: any[] = data.recent_items?.latest_payments ?? [];
  const invoiceRows = Array.isArray(invQ.data) ? invQ.data : invQ.data?.items ?? [];

  const revenueTrendData = timeSeries.revenue ?? [];
  const incomeData = timeSeries.income ?? [];
  const expenseData = timeSeries.expense ?? [];
  const revenueByMethod = pipeline.revenue_by_method ?? [];
  const invoicesByStatus = pipeline.invoices_by_status ?? [];
  const agingBuckets = pipeline.aging_buckets ?? [];
  const installmentsDue = pipeline.installments_due ?? { count: 0, amount: 0, rows: [] };
  const pendingRefunds = pipeline.pending_refunds ?? { count: 0, amount: 0, rows: [] };
  const failedPayments = pipeline.failed_payments ?? { count: 0, amount: 0, rows: [] };

  const formatMoney = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v ?? 0));

  const KpiCard = ({ title, value, change, trend }: { title: string; value: string | number; change?: number; trend?: 'up' | 'down' }) => (
    <Card className="bg-background border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        {trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-600" /> : trend === 'down' ? <TrendingDown className="h-4 w-4 text-red-600" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatMoney(Number(value))}</div>
        {change !== undefined && <p className="text-xs text-muted-foreground">{change >= 0 ? '+' : ''}{change.toFixed(2)}% vs previous period</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.finance")}</h1>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Period</Label>
          <select value={period} onChange={(e) => { setPeriod(e.target.value); setFrom(""); setTo(""); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          {period === 'custom' && (
            <>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-32 text-sm" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-32 text-sm" />
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["finance-dashboard", period, from, to] })}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="analytics">Financial Analytics</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="promos">Promo codes</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {/* KPI Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <KpiCard title="Total Revenue" value={kpis.total_revenue?.value ?? 0} change={kpis.total_revenue?.change_pct} trend={kpis.total_revenue?.change_pct ?? 0 >= 0 ? 'up' : 'down'} />
            <KpiCard title="Net Profit" value={kpis.net_profit?.value ?? 0} change={kpis.net_profit?.change_pct} trend={kpis.net_profit?.change_pct ?? 0 >= 0 ? 'up' : 'down'} />
            <KpiCard title="Total Invoiced" value={kpis.total_invoiced?.value ?? 0} />
            <KpiCard title="Outstanding" value={kpis.outstanding_payments?.value ?? 0} change={kpis.outstanding_payments?.change_pct} trend={kpis.outstanding_payments?.value > 0 ? 'down' : 'up'} />
            <KpiCard title="Overdue" value={kpis.overdue_amount?.value ?? 0} change={kpis.overdue_amount?.change_pct} trend={kpis.overdue_amount?.value > 0 ? 'down' : 'up'} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 mt-4">
            <KpiCard title="Total Refunds" value={kpis.total_refunds?.value ?? 0} />
            <KpiCard title="Refund Count" value={kpis.refund_count?.value ?? 0} />
            <KpiCard title="Discounts Given" value={kpis.total_discounts?.value ?? 0} />
            <KpiCard title="Avg Order Value" value={kpis.average_order_value?.value ?? 0} />
            <KpiCard title="Avg Days to Pay" value={kpis.avg_days_to_pay?.value ?? 0} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Income vs Expenses</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeData.map((d, i) => ({ ...d, expense: expenseData[i]?.expense ?? 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="income" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue by Payment Method</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={revenueByMethod} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
{revenueByMethod.map((_entry: any, index: number) => (
  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Invoices by Status</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={invoicesByStatus} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
{invoicesByStatus.map((_entry: any, index: number) => (
  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Aging Buckets */}
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Aging Buckets (Outstanding by Days Overdue)</CardTitle></CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: 'label', header: 'Days Overdue' },
                  { key: 'amount', header: 'Amount', render: (r: any) => formatMoney(r.amount) },
                ]}
                data={agingBuckets}
                isLoading={false}
                isError={false}
                keyExtractor={(r: any) => r.label}
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Installments Due */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Installments Due (Next 7 Days)</CardTitle>
              <Badge className={`bg-${installmentsDue.count > 0 ? 'red' : 'green'}-100 text-${installmentsDue.count > 0 ? 'red' : 'green'}-800`}>
                {installmentsDue.count} due
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">{formatMoney(installmentsDue.amount)}</div>
                <span className="text-muted-foreground">{installmentsDue.count} installment(s) due</span>
              </div>
              {installmentsDue.rows.length > 0 && (
                <DataTable
                  columns={[
                    { key: 'id', header: 'ID', render: (r: any) => r.id.slice(0, 8) },
                    { key: 'amount', header: 'Amount', render: (r: any) => formatMoney(r.amount) },
                    { key: 'due_date', header: 'Due Date' },
                  ]}
                  data={installmentsDue.rows}
                  isLoading={false}
                  isError={false}
                  keyExtractor={(r: any) => r.id}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>

          {/* Pending Refunds */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Pending Refunds</CardTitle>
              <Badge className={`bg-${pendingRefunds.count > 0 ? 'yellow' : 'green'}-100 text-${pendingRefunds.count > 0 ? 'yellow' : 'green'}-800`}>
                {pendingRefunds.count} pending
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">{formatMoney(pendingRefunds.amount)}</div>
                <span className="text-muted-foreground">{pendingRefunds.count} refund(s) awaiting approval</span>
              </div>
            </CardContent>
          </Card>

          {/* Failed Payments */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Failed / Pending Payments</CardTitle>
              <Badge className={`bg-${failedPayments.count > 0 ? 'red' : 'green'}-100 text-${failedPayments.count > 0 ? 'red' : 'green'}-800`}>
                {failedPayments.count} issues
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">{formatMoney(failedPayments.amount)}</div>
                <span className="text-muted-foreground">{failedPayments.count} payment(s) with issues</span>
              </div>
            </CardContent>
          </Card>

          {/* Latest Payments */}
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Latest Payments</CardTitle></CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: 'id', header: 'ID', render: (r: any) => r.id.slice(0, 8) },
                  { key: 'amount', header: 'Amount', render: (r: any) => formatMoney(r.amount) },
                  { key: 'method', header: 'Method' },
                  { key: 'paid_at', header: 'Paid At' },
                  { key: 'recorder', header: 'Recorded By' },
                ]}
                data={latestPayments}
                isLoading={false}
                isError={false}
                keyExtractor={(r: any) => r.id}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setInvFormShow(!invFormShow)}>
              {invFormShow ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Invoice
            </Button>
          </div>
          {invFormShow && (
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-base">New invoice</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <select value={invFormState.student_id} onChange={() => setInvFormShow(true)}
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
                  <Label>Item description *</Label>
                  <Input value={invFormState.description} onChange={() => setInvFormShow(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" value={invFormState.quantity} onChange={() => setInvFormShow(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Unit price</Label>
                  <Input type="number" value={invFormState.unit_price} onChange={() => setInvFormShow(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Promo code</Label>
                  <Input value={invFormState.promo_code} onChange={() => setInvFormShow(true)} />
                </div>
                <div className="md:col-span-3">
                  <Button disabled={invM.isPending || !invFormState.student_id || !invFormState.description} onClick={() => invM.mutate()}>{t("common.save")}</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <DataTable
            columns={[
              { key: "invoice_number", header: "Number" },
              { key: "status", header: t("common.status"), render: (r: any) => <Badge className="bg-blue-100 text-blue-800">{r.status}</Badge> },
              { key: "total_amount", header: "Total", render: (r: any) => formatMoney(r.total_amount) },
              { key: "balance_due", header: "Balance", render: (r: any) => formatMoney(r.balance_due) },
            ]}
            data={invoiceRows}
            isLoading={invQ.isLoading}
            isError={invQ.isError}
            errorMessage={(invQ.error as Error)?.message}
            onRetry={invQ.refetch}
            keyExtractor={(r: any) => r.id}
            pageSize={10}
          />
        </TabsContent>

        <TabsContent value="payments">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setPayFormShow(!payFormShow)}>
              {payFormShow ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Payment
            </Button>
          </div>
          {payFormShow && (
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-base">Record payment</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Invoice ID *</Label>
                  <Input value={payFormState.invoice_id} onChange={() => setPayFormShow(true)} placeholder="invoice uuid" />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" value={payFormState.amount} onChange={() => setPayFormShow(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <select value={payFormState.method} onChange={() => setPayFormShow(true)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {["CASH", "BANK_TRANSFER", "EASYKASH"].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input value={payFormState.reference} onChange={() => setPayFormShow(true)} />
                </div>
                <div className="md:col-span-4">
                  <Button disabled={payM.isPending || !payFormState.invoice_id || !payFormState.amount} onClick={() => payM.mutate()}>{t("common.save")}</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <DataTable
            columns={[
              { key: "receipt_number", header: "Receipt" },
              { key: "amount", header: "Amount", render: (r: any) => formatMoney(r.amount) },
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

        <TabsContent value="promos">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setPromoFormShow(!promoFormShow)}>
              {promoFormShow ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Promo
            </Button>
          </div>
          {promoFormShow && (
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-base">New promo code</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input value={promoFormState.code} onChange={() => setPromoFormShow(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select value={promoFormState.type} onChange={() => setPromoFormShow(true)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="percentage">percentage</option>
                    <option value="fixed">fixed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input type="number" value={promoFormState.value} onChange={() => setPromoFormShow(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Expiry *</Label>
                  <Input type="date" value={promoFormState.expiry_date} onChange={() => setPromoFormShow(true)} />
                </div>
                <div className="md:col-span-4">
                  <Button disabled={promoM.isPending || !promoFormState.code || !promoFormState.expiry_date} onClick={() => promoM.mutate()}>{t("common.save")}</Button>
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
            <Button size="sm" onClick={() => setRefundFormShow(!refundFormShow)}>
              {refundFormShow ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Refund
            </Button>
          </div>
          {refundFormShow && (
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-base">Request refund</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Payment ID *</Label>
                  <Input value={refundFormState.payment_id} onChange={() => setRefundFormShow(true)} placeholder="payment uuid" />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" value={refundFormState.amount} onChange={() => setRefundFormShow(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Reason code *</Label>
                  <Input value={refundFormState.reason_code} onChange={() => setRefundFormShow(true)} placeholder="duplicate_payment" />
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Input value={refundFormState.reason_note} onChange={() => setRefundFormShow(true)} />
                </div>
                <div className="md:col-span-4">
                  <Button disabled={refundM.isPending || !refundFormState.payment_id || !refundFormState.amount || !refundFormState.reason_code} onClick={() => refundM.mutate()}>{t("common.save")}</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <DataTable
            columns={[
              { key: "amount", header: "Amount", render: (r: any) => formatMoney(r.amount) },
              { key: "status", header: t("common.status"), render: (r: any) => <Badge className="bg-yellow-100 text-yellow-800">{r.status}</Badge> },
              {
                key: "decision",
                header: t("common.actions"),
                render: (r: any) => (
                  <span className="flex gap-1" onClick={(e) => { e.stopPropagation(); }}>
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
