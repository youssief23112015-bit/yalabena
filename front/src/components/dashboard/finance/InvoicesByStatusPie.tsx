import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { DonutChartCard } from '../DonutChartCard';

interface InvoicesByStatusPieProps {
  data: { label: string; count: number; amount: number }[];
  title?: string;
}

export const InvoicesByStatusPie: FC<InvoicesByStatusPieProps> = ({ data, title }) => {
  const { t } = useTranslation();

  const chartData = data.map((d) => ({
    label: d.label,
    value: d.amount,
    count: d.count,
  }));

  return (
    <DonutChartCard
      title={title ?? t('finance:invoices_by_status')}
      segments={chartData}
    />
  );
};
