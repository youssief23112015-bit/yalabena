import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { financeApi } from '../../api/finance';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { FinanceOverview } from '../../components/dashboard/finance/FinanceOverview';
import { RevenueTrendChart } from '../../components/dashboard/finance/RevenueTrendChart';
import { IncomeVsExpensesChart } from '../../components/dashboard/finance/IncomeVsExpensesChart';
import { InvoicesByStatusPie } from '../../components/dashboard/finance/InvoicesByStatusPie';
import { AgingBucketsBar } from '../../components/dashboard/finance/AgingBucketsBar';
import { RecentActivityList } from '../../components/dashboard/finance/RecentActivityList';
import { useAuthStore } from '../../store/authStore';

export default function FinanceOfficerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });

  const isAdmin = user?.role === 'SUPER_ADMIN';

  const { data: financeData, isLoading } = useQuery({
    queryKey: ['finance-metrics', dateRange],
    queryFn: () => financeApi.getFinanceDashboard({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      branch_id: undefined,
    }),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  const kpis = financeData?.kpis ?? {};
  const revenueTrend = financeData?.time_series?.revenue_trend ?? [];
  const incomeVsExpenses = financeData?.time_series?.income_vs_expenses ?? [];
  const invoicesByStatus = financeData?.time_series?.invoices_by_status ?? [];
  const agingBuckets = financeData?.time_series?.aging_buckets ?? [];
  const recentItems = financeData?.recent_items ?? {};

  const alerts = financeData?.alerts ?? [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('finance:overview')}</h1>
        <div className="flex gap-4">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <Card key={alert.id}>
              <CardContent className="pt-4">
                <div className={`font-semibold ${alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`}>
                  {alert.title}
                </div>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>{t('finance:kpis.collection_rate')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FinanceOverview kpis={kpis} />
        </CardContent>
      </Card>

      {/* Time series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart data={revenueTrend} />
        <IncomeVsExpensesChart data={incomeVsExpenses} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvoicesByStatusPie data={invoicesByStatus} />
        <AgingBucketsBar data={agingBuckets} />
      </div>

      {/* Recent activity cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('finance:instalments_due')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityList
              items={recentItems.instalments_due ?? []}
              title={t('finance:instalments_due')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('finance:top_debtors')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityList
              items={recentItems.top_debtors ?? []}
              title={t('finance:top_debtors')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('finance:pending_refunds')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityList
              items={recentItems.pending_refunds ?? []}
              title={t('finance:pending_refunds')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('finance:failed_payments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityList
              items={recentItems.failed_payments ?? []}
              title={t('finance:failed_payments')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
