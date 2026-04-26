import { useMemo } from "react";
import { Check, Plus } from "lucide-react";
import type {
  InvoicePosition,
  OvertimeEntry,
  PositionWeek,
  Project,
  TimeEntry,
} from "../../store/types";
import {
  getOvertimeBalance,
  getProjectExcessHours,
} from "../../utils/calculations";
import { buildOvertimePosition } from "../../utils/invoiceBuilders";
import { formatEuro, formatNumber } from "../../utils/currency";
import { formatMonthLabel } from "../../utils/dateFormat";

interface OvertimeRow {
  key: string;
  label: string;
  sublabel?: string;
  actualHours?: number;
  overtimeHours: number;
  description: string;
  weeks: PositionWeek[];
  periodLabel?: string;
}

interface OvertimeTabProps {
  projectId: string;
  project: Project | undefined;
  timeEntries: TimeEntry[];
  overtimeEntries: OvertimeEntry[];
  addedKeys: ReadonlySet<string>;
  onAdd: (pos: InvoicePosition, rowKey: string) => void;
}

const DEFAULT_HOURLY_RATE = 35;

export function OvertimeTab({
  projectId,
  project,
  timeEntries,
  overtimeEntries,
  addedKeys,
  onAdd,
}: OvertimeTabProps) {
  const weeklyTarget = project?.weeklyTarget ?? 28.5;

  const overtimeBalance = getOvertimeBalance(
    overtimeEntries,
    timeEntries,
    projectId,
    weeklyTarget,
  );

  const projectExcess = useMemo(
    () =>
      projectId
        ? getProjectExcessHours(timeEntries, projectId, weeklyTarget)
        : { total: 0, byKW: new Map<string, number>() },
    [timeEntries, projectId, weeklyTarget],
  );

  const redeemedKeys = useMemo(
    () =>
      new Set(
        overtimeEntries
          .filter(
            (e) =>
              e.projectId === projectId &&
              e.source === "invoice" &&
              e.hours < 0 &&
              e.redeemedKey,
          )
          .map((e) => e.redeemedKey!),
      ),
    [overtimeEntries, projectId],
  );

  const overtimeRows = useMemo<OvertimeRow[]>(() => {
    const rows: OvertimeRow[] = [];
    const sortedKws = Array.from(projectExcess.byKW.entries())
      .filter(([, diff]) => diff > 0)
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [yearWeek, diff] of sortedKws) {
      const key = `kw-${yearWeek}`;
      if (redeemedKeys.has(key)) continue;
      const [yearStr, weekStr] = yearWeek.split("-");
      const year = parseInt(yearStr, 10);
      const week = parseInt(weekStr, 10);
      const label = `${year} / KW ${week}`;
      rows.push({
        key,
        label,
        actualHours: diff + weeklyTarget,
        overtimeHours: diff,
        description: `Überstunden aus ${label}`,
        weeks: [],
        periodLabel: label,
      });
    }
    const manualRows = overtimeEntries
      .filter(
        (e) =>
          e.projectId === projectId &&
          e.source === "manual" &&
          e.hours > 0,
      )
      .sort(
        (a, b) => a.month.localeCompare(b.month) || a.id.localeCompare(b.id),
      );
    for (const e of manualRows) {
      const key = `manual-${e.id}`;
      if (redeemedKeys.has(key)) continue;
      const monthLabel = formatMonthLabel(e.month);
      rows.push({
        key,
        label: monthLabel,
        sublabel: e.note,
        overtimeHours: e.hours,
        description: e.note
          ? `Überstunden — ${e.note}`
          : `Überstunden ${monthLabel}`,
        weeks: [],
        periodLabel: monthLabel,
      });
    }
    return rows;
  }, [projectExcess, overtimeEntries, projectId, weeklyTarget, redeemedKeys]);

  const handleAdd = (row: OvertimeRow) => {
    if (addedKeys.has(row.key)) return;
    const pos = buildOvertimePosition(
      {
        description: row.description,
        weeks: row.weeks,
        periodLabel: row.periodLabel,
        overtimeHours: row.overtimeHours,
      },
      project,
    );
    onAdd(pos, row.key);
  };

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Saldo</span>
          <span className="font-semibold text-emerald-700">
            {formatNumber(overtimeBalance)} Std.
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Stundensatz</span>
          <span className="font-medium">
            {formatEuro(project?.hourlyRate ?? DEFAULT_HOURLY_RATE)}
          </span>
        </div>
      </div>
      {overtimeRows.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="text-left pb-2 text-xs font-medium text-stone-500">
                Zeitraum
              </th>
              <th className="text-right pb-2 text-xs font-medium text-stone-500">
                Stunden
              </th>
              <th className="text-right pb-2 text-xs font-medium text-stone-500">
                +/–
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {overtimeRows.map((row) => {
              const added = addedKeys.has(row.key);
              return (
                <tr key={row.key} className="border-b border-stone-50">
                  <td className="py-2 text-sm">
                    <div className="text-stone-600">{row.label}</div>
                    {row.sublabel && (
                      <div className="text-xs text-stone-400">
                        {row.sublabel}
                      </div>
                    )}
                  </td>
                  <td className="py-2 text-sm text-right text-stone-800 font-medium">
                    {row.actualHours !== undefined
                      ? formatNumber(row.actualHours)
                      : "—"}
                  </td>
                  <td className="py-2 text-sm text-right font-medium text-emerald-600">
                    +{formatNumber(row.overtimeHours)}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleAdd(row)}
                      disabled={added}
                      className={`p-1 rounded ${
                        added
                          ? "text-emerald-500 cursor-not-allowed"
                          : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                      }`}
                      title={
                        added
                          ? "Bereits hinzugefügt"
                          : "Als Position hinzufügen"
                      }
                    >
                      {added ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-sm text-stone-400 italic">
          Keine Überstunden verfügbar.
        </div>
      )}
    </div>
  );
}
