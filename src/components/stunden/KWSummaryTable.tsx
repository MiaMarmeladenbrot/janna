import { formatNumber } from '../../utils/currency';

interface KWSummaryTableProps {
  hoursByKW: Map<number, number>;
  istHours: number;
}

export function KWSummaryTable({ hoursByKW, istHours }: KWSummaryTableProps) {
  const sortedWeeks = Array.from(hoursByKW.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-200">
            <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">KW</th>
            <th className="text-right px-5 py-3 text-sm font-semibold text-stone-700">Stunden</th>
          </tr>
        </thead>
        <tbody>
          {sortedWeeks.map(([kw, hours]) => (
            <tr key={kw} className="border-b border-stone-50">
              <td className="px-5 py-2.5 text-sm text-stone-600">{kw}</td>
              <td className="px-5 py-2.5 text-sm text-right text-stone-800 font-medium">
                {formatNumber(hours)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-stone-200">
            <td className="px-5 py-3 text-sm font-semibold text-stone-700">Gesamt</td>
            <td className="px-5 py-3 text-right text-sm font-semibold text-stone-800">
              {formatNumber(istHours)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
