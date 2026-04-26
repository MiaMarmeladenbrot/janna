import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Trash2,
  AlertTriangle,
  Wallet,
  Banknote,
  Plus,
  Check,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parse } from "date-fns";
import { de } from "date-fns/locale";
import { useApp } from "../../store/useApp";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { NumberInput } from "../../components/common/NumberInput";
import { Card } from "../../components/common/Card";
import { PdfDownloadButton } from "../../pdf/PdfDownloadButton";
import { formatEuro, formatNumber } from "../../utils/currency";
import {
  getCapAdjustedHours,
  getOvertimeBalance,
  getProjectExcessHours,
} from "../../utils/calculations";
import {
  buildHoursPositions,
  buildOvertimePosition,
  buildFlatratePosition,
} from "../../utils/invoiceBuilders";
import { formatPeriod } from "../../utils/period";
import type {
  Invoice,
  InvoicePosition,
  InvoiceStatus,
  OvertimeEntry,
  PositionWeek,
} from "../../store/types";
import { InvoiceTotals } from "./InvoiceTotals";
import { InvoiceBasicsCard } from "./InvoiceBasicsCard";

export function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const isNew = id === "new";

  const existing = !isNew ? state.invoices.find((i) => i.id === id) : null;

  const [invoice, setInvoice] = useState<Invoice>(() => {
    if (existing)
      return {
        ...existing,
        positions: existing.positions.map((p) => ({ ...p })),
      };
    return {
      id: crypto.randomUUID(),
      number: state.settings.nextInvoiceNumber,
      date: format(new Date(), "yyyy-MM-dd"),
      clientId: state.clients[0]?.id || "",
      projectId: state.projects[0]?.id || "",
      positions: [],
      status: "Entwurf" as InvoiceStatus,
      vatRate: state.projects[0]?.vatRate ?? 0.19,
      notes: "",
    };
  });

  // Track overtime positions added in this session: positionId → row key
  // (e.g. "kw-14" or "manual-<entryId>"). Used to emit debit entries on save
  // and to disable already-added rows in the overtime table.
  const [overtimePositions, setOvertimePositions] = useState<
    Map<string, string>
  >(new Map());

  // Active tab for position creation
  const [activeTab, setActiveTab] = useState<"hours" | "flatrate" | "overtime">(
    "hours",
  );

  // Local form state for flatrate tab
  const [flatDescription, setFlatDescription] = useState("");
  const [flatKwRange, setFlatKwRange] = useState("");
  const [flatAmount, setFlatAmount] = useState(0);

  const client = state.clients.find((c) => c.id === invoice.clientId);
  const clientProjects = useMemo(
    () => state.projects.filter((p) => p.clientId === invoice.clientId),
    [state.projects, invoice.clientId],
  );
  const project = state.projects.find((p) => p.id === invoice.projectId);

  // Date range state for "import hours"
  const now = new Date();
  const [rangeFrom, setRangeFrom] = useState(
    format(startOfMonth(now), "yyyy-MM-dd"),
  );
  const [rangeTo, setRangeTo] = useState(format(endOfMonth(now), "yyyy-MM-dd"));

  // Weeks already booked in other invoices of the same project. Exclude them
  // from the import preview so the same week can't be billed twice.
  const billedWeeksOnOtherInvoices = useMemo(() => {
    const set = new Set<string>();
    for (const inv of state.invoices) {
      if (inv.id === invoice.id) continue;
      if (inv.projectId !== invoice.projectId) continue;
      for (const pos of inv.positions) {
        for (const w of pos.weeks ?? []) {
          set.add(`${w.year}-${String(w.week).padStart(2, '0')}`);
        }
      }
    }
    return set;
  }, [state.invoices, invoice.id, invoice.projectId]);

  const capResult = useMemo(
    () =>
      invoice.projectId
        ? getCapAdjustedHours(
            state.timeEntries,
            invoice.projectId,
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
      state.timeEntries,
      invoice.projectId,
      rangeFrom,
      rangeTo,
      project?.weeklyTarget,
      billedWeeksOnOtherInvoices,
    ],
  );

  const overtimeBalance = getOvertimeBalance(
    state.overtimeEntries,
    state.timeEntries,
    invoice.projectId,
    project?.weeklyTarget ?? 28.5,
  );

  const weeklyTarget = project?.weeklyTarget ?? 28.5;
  const projectExcess = useMemo(
    () =>
      invoice.projectId
        ? getProjectExcessHours(
            state.timeEntries,
            invoice.projectId,
            weeklyTarget,
          )
        : { total: 0, byKW: new Map<string, number>() },
    [state.timeEntries, invoice.projectId, weeklyTarget],
  );

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

  const redeemedKeys = useMemo(
    () =>
      new Set(
        state.overtimeEntries
          .filter(
            (e) =>
              e.projectId === invoice.projectId &&
              e.source === "invoice" &&
              e.hours < 0 &&
              e.redeemedKey,
          )
          .map((e) => e.redeemedKey!),
      ),
    [state.overtimeEntries, invoice.projectId],
  );

  const overtimeRows = useMemo<OvertimeRow[]>(() => {
    const rows: OvertimeRow[] = [];
    const sortedKws = Array.from(projectExcess.byKW.entries())
      .filter(([, diff]) => diff > 0)
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [yearWeek, diff] of sortedKws) {
      const key = `kw-${yearWeek}`;
      if (redeemedKeys.has(key)) continue;
      const [yearStr, weekStr] = yearWeek.split('-');
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
    const manualRows = state.overtimeEntries
      .filter(
        (e) =>
          e.projectId === invoice.projectId &&
          e.source === "manual" &&
          e.hours > 0,
      )
      .sort((a, b) => a.month.localeCompare(b.month) || a.id.localeCompare(b.id));
    for (const e of manualRows) {
      const key = `manual-${e.id}`;
      if (redeemedKeys.has(key)) continue;
      const monthLabel = format(
        parse(e.month, "yyyy-MM", new Date()),
        "MMMM yyyy",
        { locale: de },
      );
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
  }, [
    projectExcess,
    state.overtimeEntries,
    invoice.projectId,
    weeklyTarget,
    redeemedKeys,
  ]);

  const addedOvertimeKeys = useMemo(
    () => new Set(overtimePositions.values()),
    [overtimePositions],
  );

  const applyMonthShortcut = (monthIdx: number, year: number) => {
    const d = new Date(year, monthIdx, 1);
    setRangeFrom(format(startOfMonth(d), "yyyy-MM-dd"));
    setRangeTo(format(endOfMonth(d), "yyyy-MM-dd"));
  };

  const handleClientChange = (clientId: string) => {
    const matching = state.projects.filter((p) => p.clientId === clientId);
    const newProject = matching[0];
    setInvoice((prev) => ({
      ...prev,
      clientId,
      projectId: newProject?.id || "",
      vatRate: newProject?.vatRate ?? 0.19,
    }));
  };

  const handleImportHours = () => {
    const positions = buildHoursPositions(capResult, project);
    if (positions.length === 0) return;
    setInvoice((prev) => ({
      ...prev,
      positions: [...prev.positions, ...positions],
    }));
  };

  const handleAddOvertimeRow = (row: OvertimeRow) => {
    if (addedOvertimeKeys.has(row.key)) return;
    const pos = buildOvertimePosition(
      {
        description: row.description,
        weeks: row.weeks,
        periodLabel: row.periodLabel,
        overtimeHours: row.overtimeHours,
      },
      project,
    );
    setOvertimePositions((prev) => {
      const next = new Map(prev);
      next.set(pos.id, row.key);
      return next;
    });
    setInvoice((prev) => ({ ...prev, positions: [...prev.positions, pos] }));
  };

  const handleAddFlatrate = () => {
    const pos = buildFlatratePosition(flatDescription, flatKwRange, flatAmount);
    if (!pos) return;
    setInvoice((prev) => ({ ...prev, positions: [...prev.positions, pos] }));
    setFlatDescription("");
    setFlatKwRange("");
    setFlatAmount(0);
  };

  const updatePosition = (posId: string, updates: Partial<InvoicePosition>) => {
    setInvoice((prev) => ({
      ...prev,
      positions: prev.positions.map((p) => {
        if (p.id !== posId) return p;
        const updated = { ...p, ...updates };
        if (updated.billingType === "hours") {
          updated.netAmount = updated.totalHours * updated.hourlyRate;
        } else {
          updated.netAmount = updated.flatAmount;
        }
        return updated;
      }),
    }));
  };

  const removePosition = (posId: string) => {
    setOvertimePositions((prev) => {
      if (!prev.has(posId)) return prev;
      const next = new Map(prev);
      next.delete(posId);
      return next;
    });
    setInvoice((p) => ({
      ...p,
      positions: p.positions.filter((pp) => pp.id !== posId),
    }));
  };

  const hasPositions = invoice.positions.length > 0;
  const hasTimesheetWeeks = invoice.positions.some(
    (p) => (p.weeks?.length ?? 0) > 0,
  );

  const handleSave = () => {
    if (isNew) {
      dispatch({ type: "ADD_INVOICE", invoice });
    } else {
      dispatch({ type: "UPDATE_INVOICE", invoice });
    }

    const debitEntries: OvertimeEntry[] = [];
    for (const [posId, rowKey] of overtimePositions) {
      const pos = invoice.positions.find((p) => p.id === posId);
      if (!pos || pos.totalHours <= 0) continue;
      debitEntries.push({
        id: crypto.randomUUID(),
        projectId: invoice.projectId,
        month: invoice.date.slice(0, 7),
        hours: -pos.totalHours,
        source: "invoice",
        invoiceId: invoice.id,
        note: `Rechnung ${invoice.number} — ${formatPeriod(pos)}`,
        redeemedKey: rowKey,
      });
    }
    if (debitEntries.length > 0) {
      dispatch({ type: "ADD_OVERTIME_ENTRIES", entries: debitEntries });
    }

    navigate("/invoices");
  };

  const handleDelete = () => {
    if (existing && confirm("Rechnung wirklich löschen?")) {
      dispatch({ type: "DELETE_INVOICE", id: existing.id });
      navigate("/invoices");
    }
  };

  const cappedWeeks = capResult.kwDetails.filter((d) => d.excess > 0);

  return (
    <div>
      <PageHeader
        title={isNew ? "Neue Rechnung" : `Rechnung ${invoice.number}`}
      >
        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <PdfDownloadButton
                label="Stundennachweise"
                buildDocument={async () => {
                  const { TimesheetsPdf } = await import("../../pdf/TimesheetsPdf");
                  return (
                    <TimesheetsPdf
                      invoice={invoice}
                      project={project || state.projects[0]}
                      settings={state.settings}
                      timeEntries={state.timeEntries}
                    />
                  );
                }}
                fileName={`Stundennachweise_Rechnung_${invoice.number}.pdf`}
                disabled={!hasTimesheetWeeks}
              />
              <PdfDownloadButton
                label="Rechnungs-PDF"
                buildDocument={async () => {
                  const { InvoicePdf } = await import("../../pdf/InvoicePdf");
                  return (
                    <InvoicePdf
                      invoice={invoice}
                      client={client || state.clients[0]}
                      project={project || state.projects[0]}
                      settings={state.settings}
                    />
                  );
                }}
                fileName={`Rechnung_${invoice.number}.pdf`}
                disabled={!hasPositions}
              />
              <Button variant="danger" size="sm" onClick={handleDelete}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <button
        onClick={() => navigate("/invoices")}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6"
      >
        <ArrowLeft size={16} />
        Zurück
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <InvoiceBasicsCard
            invoice={invoice}
            clients={state.clients}
            clientProjects={clientProjects}
            onChange={(updates) => setInvoice((p) => ({ ...p, ...updates }))}
            onClientChange={handleClientChange}
          />

          <Card title="Position hinzufügen">
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex border-b border-stone-200">
                {(
                  [
                    {
                      key: "hours",
                      label: "Stunden",
                      icon: <Clock size={14} />,
                    },
                    {
                      key: "flatrate",
                      label: "Pauschale",
                      icon: <Banknote size={14} />,
                    },
                    {
                      key: "overtime",
                      label: "Überstunden",
                      icon: <Wallet size={14} />,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-stone-800 text-stone-800"
                        : "border-transparent text-stone-400 hover:text-stone-600"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Hours tab */}
              {activeTab === "hours" && (
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
                          onClick={() =>
                            applyMonthShortcut(i, now.getFullYear())
                          }
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
                  {capResult.totalBillableHours > 0 ||
                  capResult.totalExcessHours > 0 ? (
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
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleImportHours}
                        >
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
              )}

              {/* Flatrate tab */}
              {activeTab === "flatrate" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-stone-500">
                      Beschreibung
                    </label>
                    <textarea
                      value={flatDescription}
                      onChange={(e) => setFlatDescription(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:border-stone-500 focus:outline-none"
                      placeholder={
                        project?.description || "Leistungsbeschreibung..."
                      }
                    />
                  </div>
                  <Input
                    label="Zeitraum (KW)"
                    value={flatKwRange}
                    onChange={(e) => setFlatKwRange(e.target.value)}
                    placeholder="z.B. 14 und 15"
                  />
                  <NumberInput
                    label="Pauschalbetrag (€)"
                    value={flatAmount}
                    onValueChange={setFlatAmount}
                    decimals={2}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-stone-700">
                      Netto: {formatEuro(flatAmount)}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddFlatrate}
                    >
                      Übernehmen
                    </Button>
                  </div>
                </div>
              )}

              {/* Overtime tab */}
              {activeTab === "overtime" && (
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
                        {formatEuro(project?.hourlyRate ?? 35)}
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
                          const added = addedOvertimeKeys.has(row.key);
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
                                  onClick={() => handleAddOvertimeRow(row)}
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
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Position list – always visible on the right */}
          <Card title={`Positionen (${invoice.positions.length})`}>
            {invoice.positions.length === 0 ? (
              <div className="text-sm text-stone-400 italic text-center py-4">
                Noch keine Positionen.
              </div>
            ) : (
              <div className="space-y-3">
                {invoice.positions.map((pos, idx) => {
                  const isOvertime = overtimePositions.has(pos.id);
                  return (
                  <div
                    key={pos.id}
                    className={`p-3 rounded-lg space-y-2 ${
                      isOvertime
                        ? "bg-emerald-50 border border-emerald-200"
                        : "bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-stone-700">
                          Position {idx + 1}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                            isOvertime
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {isOvertime
                            ? "Überstunden"
                            : pos.billingType === "hours"
                              ? "Stunden"
                              : "Pauschal"}
                        </span>
                      </div>
                      <button
                        onClick={() => removePosition(pos.id)}
                        className="p-1 text-stone-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-stone-500">
                        Beschreibung
                      </label>
                      <textarea
                        value={pos.description}
                        onChange={(e) =>
                          updatePosition(pos.id, {
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:border-stone-500 focus:outline-none"
                        placeholder={
                          project?.description || "Leistungsbeschreibung..."
                        }
                      />
                    </div>

                    {(pos.weeks?.length ?? 0) > 0 ? (
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-stone-500">
                          Zeitraum (KW)
                        </label>
                        <div className="px-3 py-2 text-sm text-stone-700 bg-stone-100 rounded-lg border border-stone-200">
                          {formatPeriod(pos)}
                        </div>
                      </div>
                    ) : (
                      <Input
                        label="Zeitraum (KW)"
                        value={pos.periodLabel ?? ""}
                        onChange={(e) =>
                          updatePosition(pos.id, { periodLabel: e.target.value })
                        }
                        placeholder="z.B. 14 und 15"
                      />
                    )}

                    {pos.billingType === "hours" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <NumberInput
                          label="Stunden"
                          value={pos.totalHours}
                          onValueChange={(v) =>
                            updatePosition(pos.id, { totalHours: v })
                          }
                        />
                        <NumberInput
                          label="Stundensatz (€)"
                          value={pos.hourlyRate}
                          onValueChange={(v) =>
                            updatePosition(pos.id, { hourlyRate: v })
                          }
                          decimals={2}
                        />
                      </div>
                    ) : (
                      <NumberInput
                        label="Pauschalbetrag (€)"
                        value={pos.flatAmount}
                        onValueChange={(v) =>
                          updatePosition(pos.id, { flatAmount: v })
                        }
                        decimals={2}
                      />
                    )}

                    <div className="text-right text-sm font-medium text-stone-700">
                      Netto: {formatEuro(pos.netAmount)}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </Card>

          <InvoiceTotals
            positions={invoice.positions}
            vatRate={invoice.vatRate}
          />


          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1" disabled={!hasPositions}>
              {isNew ? "Rechnung erstellen" : "Speichern"}
            </Button>
            {isNew && (
              <PdfDownloadButton
                label="Rechnungs-PDF"
                buildDocument={async () => {
                  const { InvoicePdf } = await import("../../pdf/InvoicePdf");
                  return (
                    <InvoicePdf
                      invoice={invoice}
                      client={client || state.clients[0]}
                      project={project || state.projects[0]}
                      settings={state.settings}
                    />
                  );
                }}
                fileName={`Rechnung_${invoice.number}.pdf`}
                disabled={!hasPositions}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
