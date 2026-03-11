import { formatNumber } from '../../utils/currency';

interface KWSummaryTableProps {
  hoursByKW: Map<number, number>;
  sollHours: number;
  istHours: number;
}

export function KWSummaryTable({ hoursByKW, sollHours, istHours }: KWSummaryTableProps) {
  const sortedWeeks = Array.from(hoursByKW.entries()).sort(([a], [b]) => a - b);
  const diff = istHours - sollHours;

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
          <tr>
            <td className="px-5 py-3">
              <span className="inline-block px-3 py-1 rounded text-sm font-semibold bg-green-100 text-green-800">
                Soll {formatNumber(sollHours)}
              </span>
            </td>
            <td className="px-5 py-3 text-right">
              <span
                className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                  diff >= 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                Ist {formatNumber(istHours)}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
