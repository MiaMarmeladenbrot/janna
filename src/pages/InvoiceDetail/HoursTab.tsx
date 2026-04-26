import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { de } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import type {
  Invoice,
  InvoicePosition,
  Project,
  TimeEntry,
} from "../../store/types";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { formatNumber } from "../../utils/currency";
import { getCapAdjustedHours } from "../../utils/calculations";
import { buildHoursPositions } from "../../utils/invoiceBuilders";

interface HoursTabProps {
  project: Project | undefined;
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  currentInvoiceId: string;
  currentProjectId: string;
  onAdd: (positions: InvoicePosition[]) => void;
}

export function HoursTab({
  project,
  timeEntries,
  invoices,
  currentInvoiceId,
  currentProjectId,
  onAdd,
}: HoursTabProps) {
  const now = new Date();
  const [rangeFrom, setRangeFrom] = useState(
    format(startOfMonth(now), "yyyy-MM-dd"),
  );
  const [rangeTo, setRangeTo] = useState(
    format(endOfMonth(now), "yyyy-MM-dd"),
  );

  const billedWeeksOnOtherInvoices = useMemo(() => {
    const set = new Set<string>();
    for (const inv of invoices) {
      if (inv.id === currentInvoiceId) continue;
      if (inv.projectId !== currentProjectId) continue;
      for (const pos of inv.positions) {
        for (const w of pos.weeks ?? []) {
          set.add(`${w.year}-${String(w.week).padStart(2, "0")}`);
        }
      }
    }
    return set;
  }, [invoices, currentInvoiceId, currentProjectId]);

  const capResult = useMemo(
    () =>
      currentProjectId
        ? getCapAdjustedHours(
            timeEntries,
            currentProjectId,
            rangeFrom,
            rangeTo,
            project?.weeklyTarget ?? 28.5,
            billedWeeksOnOtherInvoices,
          )
        : {
            kwNumbers: [],
            totalBillableHours: 0,
            totalExcessHours: 0,
            entries: [],
            kwDetails: [],
          },
    [
      timeEntries,
      currentProjectId,
      rangeFrom,
      rangeTo,
      project?.weeklyTarget,
      billedWeeksOnOtherInvoices,
    ],
  );

  const cappedWeeks = capResult.kwDetails.filter((d) => d.excess > 0);

  const applyMonthShortcut = (monthIdx: number, year: number) => {
    const d = new Date(year, monthIdx, 1);
    setRangeFrom(format(startOfMonth(d), "yyyy-MM-dd"));
    setRangeTo(format(endOfMonth(d), "yyyy-MM-dd"));
  };

  const handleImport = () => {
    const positions = buildHoursPositions(capResult, project);
    if (positions.length === 0) return;
    onAdd(positions);
  };

  const hasResult =
    capResult.totalBillableHours > 0 || capResult.totalExcessHours > 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 12 }, (_, i) => {
          const mStart = format(
            startOfMonth(new Date(now.getFullYear(), i, 1)),
            "yyyy-MM-dd",
          );
          const mEnd = format(
            endOfMonth(new Date(now.getFullYear(), i, 1)),
            "yyyy-MM-dd",
          );
          const isActive = rangeFrom === mStart && rangeTo === mEnd;
          return (
            <button
              key={i}
              type="button"
              onClick={() => applyMonthShortcut(i, now.getFullYear())}
              className={`px-2 py-1 text-xs rounded-md border ${
                isActive
                  ? "bg-stone-800 text-white border-stone-800"
                  : "border-stone-300 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {format(new Date(2025, i, 1), "MMM", { locale: de })}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Von"
          type="date"
          value={rangeFrom}
          onChange={(e) => setRangeFrom(e.target.value)}
        />
        <Input
          label="Bis"
          type="date"
          value={rangeTo}
          onChange={(e) => setRangeTo(e.target.value)}
        />
      </div>
      {hasResult ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-stone-600">
              KW{" "}
              {capResult.kwNumbers.length === 1
                ? capResult.kwNumbers[0]
                : `${Math.min(...capResult.kwNumbers)}–${Math.max(...capResult.kwNumbers)}`}
              :{" "}
              <span className="font-semibold">
                {formatNumber(capResult.totalBillableHours)} Std.
              </span>
              {capResult.totalExcessHours > 0 && (
                <span className="text-stone-400 ml-1">
                  (von{" "}
                  {formatNumber(
                    capResult.totalBillableHours +
                      capResult.totalExcessHours,
                  )}
                  )
                </span>
              )}
            </div>
            <Button variant="primary" size="sm" onClick={handleImport}>
              Übernehmen
            </Button>
          </div>

          {cappedWeeks.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1.5">
                <AlertTriangle size={12} />
                Wochenlimit erreicht
              </div>
              {cappedWeeks.map((d) => (
                <div
                  key={`${d.year}-${d.kw}`}
                  className="text-xs text-amber-600 flex justify-between"
                >
                  <span>
                    KW {d.kw}: {formatNumber(d.actual)} Std.
                  </span>
                  <span>
                    {formatNumber(d.billable)} werden abgerechnet, +
                    {formatNumber(d.excess)} Überstunden
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-stone-400 italic">
          Keine Stunden im gewählten Zeitraum
        </div>
      )}
    </div>
  );
}
