import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChartCard } from '../BarChartCard';

interface AgingBucketsBarProps {
  data: { label: string; amount: number }[];
  title?: string;
}

export const AgingBucketsBar: FC<AgingBucketsBarProps> = ({ data, title }) => {
  const { t } = useTranslation();

  const chartData = data.map((d) => ({
    label: d.label,
    value: d.amount,
  }));

  return (
    <BarChartCard
      title={title ?? t('finance:aging_buckets')}
      series={chartData}
    />
  );
};
