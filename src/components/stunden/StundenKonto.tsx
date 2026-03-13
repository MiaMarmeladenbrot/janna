import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { useApp } from "../../store/AppContext";
import { getStundenKontoBalance } from "../../utils/calculations";
import { formatNumber, formatEuro } from "../../utils/currency";

const SOURCE_LABELS: Record<string, string> = {
  invoice: "Rechnung",
  manual: "Manuell",
};

interface StundenKontoProps {
  hourlyRate: number;
  weeklyTarget: number;
  projectId: string;
  hoursByKW: Map<number, number>;
}

export function StundenKonto({ hourlyRate, weeklyTarget, projectId, hoursByKW }: StundenKontoProps) {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formMonth, setFormMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  );
  const [formHours, setFormHours] = useState("");
  const [formNote, setFormNote] = useState("");
  const [hoursError, setHoursError] = useState(false);

  const balance = getStundenKontoBalance(state.stundenKonto, state.timeEntries, projectId, weeklyTarget);
  const adjustmentEntries = state.stundenKonto
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => a.month.localeCompare(b.month) || a.id.localeCompare(b.id));

  const sortedWeeks = Array.from(hoursByKW.entries()).sort(([a], [b]) => a - b);

  const handleAdd = () => {
    const hours = parseFloat(formHours.replace(",", "."));
    if (isNaN(hours) || hours === 0) {
      setHoursError(true);
      return;
    }
    setHoursError(false);
    dispatch({
      type: "ADD_STUNDEN_KONTO_ENTRIES",
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

        {/* Unified table: KW rows + manual entries */}
        {(sortedWeeks.length > 0 || adjustmentEntries.length > 0) && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left pb-2 text-xs font-medium text-stone-500">Zeitraum</th>
                <th className="text-right pb-2 text-xs font-medium text-stone-500">Stunden</th>
                <th className="text-right pb-2 text-xs font-medium text-stone-500">+/–</th>
              </tr>
            </thead>
            <tbody>
              {sortedWeeks.map(([kw, hours]) => {
                const diff = hours - weeklyTarget;
                return (
                  <tr key={`kw-${kw}`} className="border-b border-stone-50">
                    <td className="py-2 text-sm text-stone-600">KW {kw}</td>
                    <td className="py-2 text-sm text-right text-stone-800 font-medium">
                      {formatNumber(hours)}
                    </td>
                    <td className={`py-2 text-sm text-right font-medium ${
                      diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-stone-300"
                    }`}>
                      {diff > 0 ? "+" : ""}{formatNumber(diff)}
                    </td>
                  </tr>
                );
              })}
              {adjustmentEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-stone-50 group">
                  <td className="py-2">
                    <div className="text-sm font-medium text-stone-700">
                      {format(parse(entry.month, "yyyy-MM", new Date()), "MMMM yyyy", { locale: de })}
                    </div>
                    <div className="text-xs text-stone-400">
                      {entry.note || SOURCE_LABELS[entry.source]}
                    </div>
                  </td>
                  <td />
                  <td className="py-2 text-right align-top">
                    <div className="relative inline-flex items-center">
                      <span className={`text-sm font-medium ${
                        entry.hours > 0 ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {entry.hours > 0 ? "+" : ""}{formatNumber(entry.hours)}
                      </span>
                      {entry.source === "manual" && (
                        <button
                          onClick={() =>
                            dispatch({
                              type: "DELETE_STUNDEN_KONTO_ENTRY",
                              id: entry.id,
                            })
                          }
                          className="absolute -right-5 p-0.5 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Löschen"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
