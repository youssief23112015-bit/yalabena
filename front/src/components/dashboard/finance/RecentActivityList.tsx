import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { TopList } from '../TopList';

interface RecentActivityItem {
  id: string;
  label: string;
  amount?: number;
  method?: string;
  paid_at?: string;
  recorder?: string;
  description?: string;
}

interface RecentActivityListProps {
  items: RecentActivityItem[];
  title?: string;
}

export const RecentActivityList: FC<RecentActivityListProps> = ({ items, title }) => {
  const { t } = useTranslation();

  const typeLabel = (item: RecentActivityItem) => {
    if (item.method && item.amount) {
      if (item.paid_at) {
        return t('finance:latest_payments');
      }
      if (item.recorder) {
        return t('finance:failed_payments');
      }
    }
    return t('finance:recent_activity');
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">{title ?? t('finance:recent_activity')}</h3>
      <TopList
        title={t('finance:recent_activity')}
        rows={items.map((item) => ({
          label: item.label,
          value: item.amount != null ? `EGP ${item.amount.toLocaleString()}` : '—',
          detail: typeLabel(item),
        }))}
      />
    </div>
  );
};
