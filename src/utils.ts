/**
 * Formats an ISO date string (YYYY-MM-DD) or Date to DD/MM/YYYY Israeli format.
 * Passes through already-formatted strings, empty values, and non-date strings.
 */
export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '';
  const s = typeof dateStr === 'string' ? dateStr : dateStr.toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
  return s;
}

/**
 * Formats a full ISO datetime string to Hebrew locale DD/MM/YYYY HH:MM.
 */
export function formatDateTime(isoStr: string | undefined | null): string {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleString('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

/**
 * Returns today in DD/MM/YYYY format.
 */
export function todayFormatted(): string {
  return formatDate(new Date());
}
