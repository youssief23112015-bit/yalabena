import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChartCard } from '../BarChartCard';

interface IncomeVsExpensesChartProps {
  data: { label: string; income: number; expense: number }[];
  title?: string;
}

export const IncomeVsExpensesChart: FC<IncomeVsExpensesChartProps> = ({ data, title }) => {
  const { t } = useTranslation();

  const chartData = data.map((d) => ({
    label: d.label,
    value: d.income,
  }));

  return (
    <BarChartCard
      title={title ?? t('finance:income_vs_expenses')}
      series={chartData}
    />
  );
};
