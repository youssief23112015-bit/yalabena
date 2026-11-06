import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '../StatCard';

interface FinanceOverviewProps {
  kpis: Record<string, { value: number; previous_value: number; change_pct: number }>;
}

export const FinanceOverview: FC<FinanceOverviewProps> = ({ kpis }) => {
  const { t } = useTranslation();

  const kpiItems = [
    { key: 'revenue_collected', label: t('finance:kpis.revenue_collected'), formatter: (v: number) => 'EGP ' + v.toLocaleString() },
    { key: 'invoiced_amount', label: t('finance:kpis.invoiced_amount'), formatter: (v: number) => 'EGP ' + v.toLocaleString() },
    { key: 'collection_rate', label: t('finance:kpis.collection_rate'), formatter: (v: number) => v.toFixed(1) + '%' },
    { key: 'outstanding_balance', label: t('finance:kpis.outstanding_balance'), formatter: (v: number) => 'EGP ' + v.toLocaleString() },
    { key: 'overdue_amount', label: t('finance:kpis.overdue_amount'), formatter: (v: number) => 'EGP ' + v.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpiItems.map((item) => (
        <StatCard
          key={item.key}
          title={item.label}
          value={item.formatter(kpis[item.key]?.value ?? 0)}
          subtitle={`Previous: ${item.formatter(kpis[item.key]?.previous_value ?? 0)}`}
          trend={kpis[item.key]?.change_pct ?? 0}
        />
      ))}
    </div>
  );
};
