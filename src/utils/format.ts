/**
 * Shared formatting utilities — single source of truth for number/date display.
 */

/**
 * Format a value as Zambian Kwacha (ZMW).
 * Handles both number and string inputs (backend may return numeric strings).
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'K 0.00';
  return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(num);
}

/**
 * Format a date string as full datetime: "14 Mar 2026, 09:30".
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date string as a short datetime (no year): "14 Mar, 09:30".
 * Used in live-updating views where the year is implicit.
 */
export function formatDateTimeShort(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date string as date only: "14 Mar 2026".
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
