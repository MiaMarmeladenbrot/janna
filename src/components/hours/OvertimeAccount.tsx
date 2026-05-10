import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useApp } from "../../store/useApp";
import { getOvertimeBalance } from "../../utils/calculations";
import { formatNumber, formatEuro } from "../../utils/currency";
import { formatMonthLabel, getMonthKey } from "../../utils/dateFormat";
import { getISOWeekKey } from "../../utils/kw";

const SOURCE_LABELS: Record<string, string> = {
  invoice: "Rechnung",
  manual: "Manuell",
};

interface OvertimeAccountProps {
  hourlyRate: number;
  weeklyTarget: number;
  projectId: string;
  hoursByKW: Map<string, number>;
}

export function OvertimeAccount({ hourlyRate, weeklyTarget, projectId, hoursByKW }: OvertimeAccountProps) {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formMonth, setFormMonth] = useState(getMonthKey(new Date()));
  const [formHours, setFormHours] = useState("");
  const [formNote, setFormNote] = useState("");
  const [hoursError, setHoursError] = useState(false);

  const balance = getOvertimeBalance(state.overtimeEntries, state.timeEntries, projectId, weeklyTarget);

  const projectOvertime = state.overtimeEntries.filter((e) => e.projectId === projectId);

  // Redemption map: redeemedKey → invoice debit entry
  const redemptionByKey = new Map<string, typeof projectOvertime[number]>();
  for (const e of projectOvertime) {
    if (e.source === "invoice" && e.redeemedKey) {
      redemptionByKey.set(e.redeemedKey, e);
    }
  }

  const invoiceById = new Map(state.invoices.map((i) => [i.id, i]));
  const getRedemptionLabel = (key: string): string | null => {
    const debit = redemptionByKey.get(key);
    if (!debit) return null;
    const inv = debit.invoiceId ? invoiceById.get(debit.invoiceId) : null;
    return inv ? `Rechnung ${inv.number}` : "Abgerechnet";
  };

  const currentKey = getISOWeekKey(new Date());
  // Only positive excess weeks: those are real overtime sources.
  const positiveWeeks = Array.from(hoursByKW.entries())
    .filter(([key, hours]) => key !== currentKey && hours - weeklyTarget > 0.01)
    .sort(([a], [b]) => a.localeCompare(b));

  // Manual entries (both signs); positive ones are billable overtime sources,
  // negative ones are corrections that just adjust the balance.
  const manualEntries = projectOvertime
    .filter((e) => e.source === "manual")
    .sort((a, b) => a.month.localeCompare(b.month) || a.id.localeCompare(b.id));

  const hasRows = positiveWeeks.length > 0 || manualEntries.length > 0;

  const handleAdd = () => {
    const hours = parseFloat(formHours.replace(",", "."));
    if (isNaN(hours) || hours === 0) {
      setHoursError(true);
      return;
    }
    setHoursError(false);
    dispatch({
      type: "ADD_OVERTIME_ENTRIES",
      entries: [
        {
          id: crypto.randomUUID(),
          projectId,
          month: formMonth,
          hours,
          source: "manual",
          note: formNote || "Manuelle Buchung",
        },
      ],
    });
    setFormHours("");
    setFormNote("");
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-stone-500" />
          <h3 className="font-semibold text-stone-800">Überstunden-Konto</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 text-white hover:bg-stone-700 transition-colors"
        >
          <Plus size={14} />
          Überstunden nachtragen
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Balance */}
        <div className="p-4 rounded-lg bg-stone-50 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Überstunden
            </div>
            <div
              className={`text-2xl font-bold ${balance > 0 ? "text-emerald-600" : balance < 0 ? "text-red-600" : "text-stone-400"}`}
            >
              {formatNumber(balance)} Std.
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-400">Wert</div>
            <div className="text-lg font-semibold text-stone-700">
              {formatEuro(balance * hourlyRate)}
            </div>
          </div>
        </div>

        {/* Manual entry form */}
        {showForm && (
          <div className="p-3 rounded-lg border border-dashed border-stone-300 space-y-2">
            <div className="text-xs font-semibold text-stone-600">
              Manuelle Buchung
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="month"
                value={formMonth}
                onChange={(e) => setFormMonth(e.target.value)}
                className="rounded border border-stone-300 px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                value={formHours}
                onChange={(e) => { setFormHours(e.target.value); setHoursError(false); }}
                placeholder="Stunden (z.B. 5 oder -3)"
                className={`rounded border px-2 py-1.5 text-sm ${hoursError ? "border-red-400 bg-red-50" : "border-stone-300"}`}
              />
            </div>
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="Notiz (optional)"
              className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-3 py-1 text-xs font-medium rounded bg-stone-800 text-white hover:bg-stone-700"
              >
                Buchen
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1 text-xs text-stone-500 hover:text-stone-700"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Unified table: positive-excess KW rows + manual entries */}
        {hasRows && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left pb-2 text-xs font-medium text-stone-500">Zeitraum</th>
                <th className="text-right pb-2 text-xs font-medium text-stone-500">Stunden</th>
                <th className="text-right pb-2 text-xs font-medium text-stone-500">Überstunden</th>
                <th className="text-left pb-2 pl-3 text-xs font-medium text-stone-500">Abgerechnet</th>
              </tr>
            </thead>
            <tbody>
              {positiveWeeks.map(([key, hours]) => {
                const diff = hours - weeklyTarget;
                const [year, week] = key.split('-');
                const redemption = getRedemptionLabel(`kw-${key}`);
                const struck = redemption !== null;
                return (
                  <tr key={`kw-${key}`} className="border-b border-stone-50">
                    <td className={`py-2 text-sm ${struck ? "text-stone-400 line-through" : "text-stone-600"}`}>
                      {year} / KW {parseInt(week, 10)}
                    </td>
                    <td className={`py-2 text-sm text-right font-medium ${struck ? "text-stone-400 line-through" : "text-stone-800"}`}>
                      {formatNumber(hours)}
                    </td>
                    <td className={`py-2 text-sm text-right font-medium ${struck ? "text-stone-400 line-through" : "text-emerald-600"}`}>
                      +{formatNumber(diff)}
                    </td>
                    <td className="py-2 pl-3 text-sm text-stone-500">
                      {redemption ?? <span className="text-stone-300">—</span>}
                    </td>
                  </tr>
                );
              })}
              {manualEntries.map((entry) => {
                const redemption = entry.hours > 0 ? getRedemptionLabel(`manual-${entry.id}`) : null;
                const struck = redemption !== null;
                const isCorrection = entry.hours < 0;
                return (
                  <tr key={entry.id} className="border-b border-stone-50 group">
                    <td className={`py-2 ${struck ? "line-through text-stone-400" : ""}`}>
                      <div className={`text-sm font-medium ${struck ? "text-stone-400" : "text-stone-700"}`}>
                        {formatMonthLabel(entry.month)}
                      </div>
                      <div className={`text-xs ${struck ? "text-stone-300" : "text-stone-400"}`}>
                        {entry.note || SOURCE_LABELS[entry.source]}
                      </div>
                    </td>
                    <td className="py-2 text-sm text-right text-stone-300">
                      —
                    </td>
                    <td className={`py-2 text-sm text-right font-medium ${
                      struck
                        ? "text-stone-400 line-through"
                        : isCorrection
                          ? "text-red-600"
                          : "text-emerald-600"
                    }`}>
                      {entry.hours > 0 ? "+" : ""}{formatNumber(entry.hours)}
                    </td>
                    <td className="py-2 pl-3 text-sm text-stone-500 relative">
                      {redemption ?? (isCorrection ? <span className="text-stone-400 italic text-xs">Korrektur</span> : <span className="text-stone-300">—</span>)}
                      <button
                        onClick={() =>
                          dispatch({
                            type: "DELETE_OVERTIME_ENTRY",
                            id: entry.id,
                          })
                        }
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Löschen"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
