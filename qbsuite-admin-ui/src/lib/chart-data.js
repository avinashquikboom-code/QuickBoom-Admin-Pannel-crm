export function filterChartRows(data, { period = 'all', from = '', to = '' } = {}) {
  const dated = data.filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date || '') && Number.isFinite(Date.parse(row.date))).sort((a,b) => a.date.localeCompare(b.date));
  const end = to || dated.at(-1)?.date;
  const cutoff = from || (period === 'all' || !end ? '' : new Date(Date.parse(end) - (Number(period) - 1) * 86400000).toISOString().slice(0,10));
  return dated.filter((row) => (!cutoff || row.date >= cutoff) && (!end || row.date <= end));
}
export function pieTotals(data, series) {
  return series.map((item) => ({ key: item.key, name: item.label, value: data.reduce((total, row) => total + (Number(row[item.key]) || 0), 0), fill: `var(--color-${item.key})` }));
}
