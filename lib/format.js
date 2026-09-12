// lib/format.js
export function formatKip(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('lo-LA', { maximumFractionDigits: 0 }) + ' ກີບ';
}

export function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('lo-LA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
