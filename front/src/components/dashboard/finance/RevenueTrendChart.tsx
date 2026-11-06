import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChartCard } from '../AreaChartCard';

interface RevenueTrendChartProps {
  data: { date: string; value: number }[];
  title?: string;
}

export const RevenueTrendChart: FC<RevenueTrendChartProps> = ({ data, title }) => {
  const { t } = useTranslation();

  const chartData = data.map((d) => ({
    date: d.date,
    value: d.value,
  }));

  return (
    <AreaChartCard
      title={title ?? t('finance:revenue_trend')}
      points={chartData}
    />
  );
};
