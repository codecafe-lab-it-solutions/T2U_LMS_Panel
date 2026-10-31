/**
 * Centralized date formatting utilities.
 * Ensures consistent DD/MM/YYYY formatting across the entire website.
 */

export function formatDate(val: string | number | Date | null | undefined, fallback = '—'): string {
  if (!val) return fallback;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Fast path for YYYY-MM-DD to avoid timezone shifting
    const matchYMD = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
    if (matchYMD && !trimmed.includes('T')) {
      const [, y, m, d] = matchYMD;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }

  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return typeof val === 'string' && val.length > 0 ? val : fallback;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(val: string | number | Date | null | undefined, fallback = '—'): string {
  if (!val) return fallback;
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return typeof val === 'string' && val.length > 0 ? val : fallback;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${day}/${month}/${year}, ${time}`;
}

