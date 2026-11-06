import { useTranslation } from "react-i18next";

/** Format a number using the current i18n locale. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined).format(value);
}

/** Format a currency value (EGP by default) using the current i18n locale. */
export function formatCurrency(value: number, currency = "EGP"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a percentage value. */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/** Format a relative date/time using the current i18n locale. */
export function formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string {
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(value, unit);
}

/** Format a date string using the current i18n locale. */
export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}