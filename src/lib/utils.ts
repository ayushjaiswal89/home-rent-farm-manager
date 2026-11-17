export interface MonthPeriod {
  key: string;
  label: string;
  shortLabel: string;
}

export function getRecentMonths(count: number, lang: 'hi' | 'en', fromDate = new Date()): MonthPeriod[] {
  const total = Math.max(0, Math.floor(count));
  const locale = lang === 'hi' ? 'hi-IN' : 'en-US';
  const currentMonth = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);

  return Array.from({ length: total }, (_, index) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - total + index + 1, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      key,
      label: date.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
      shortLabel: date.toLocaleDateString(locale, { month: 'short' }),
    };
  });
}

export function getLocalDateString(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function fmt(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '₹0';
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  const formatted = absVal.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
