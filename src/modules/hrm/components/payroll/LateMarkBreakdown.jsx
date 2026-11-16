import { formatCurrency } from '@/lib/currency';

export function LateMarkBreakdown({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[11px]">
        <thead className="text-slate-500"><tr><th>Date</th><th>Check-in</th><th>Late minutes</th><th>Deduction</th></tr></thead>
        <tbody>{rows.map((row, index) => (
          <tr key={`${row.date}-${index}`} className="border-t border-slate-200">
            <td className="py-1">{row.date || '—'}</td><td>{row.checkInTime || '—'}</td>
            <td>{row.eligibleLateMinutes ?? 0}</td><td>{formatCurrency(row.deduction ?? 0)}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
