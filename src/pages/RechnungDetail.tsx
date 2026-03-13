import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Trash2, AlertTriangle, Wallet } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { de } from "date-fns/locale";
import { useApp } from "../store/AppContext";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { NumberInput } from "../components/common/NumberInput";
import { Card } from "../components/common/Card";
import { PdfDownloadButton } from "../pdf/PdfDownloadButton";
import { RechnungPdf } from "../pdf/RechnungPdf";
import { formatEuro, formatNumber } from "../utils/currency";
import {
  getCapAdjustedHours,
  getStundenKontoBalance,
} from "../utils/calculations";
import type {
  Invoice,
  InvoicePosition,
  InvoiceStatus,
  InvoiceBillingType,
} from "../store/types";

function emptyPosition(
  billingType: InvoiceBillingType = "flatrate",
): InvoicePosition {
  return {
    id: crypto.randomUUID(),
    description: "",
    billingType,
    kwRange: "",
    totalHours: 0,
    hourlyRate: 35,
    flatAmount: 0,
    netAmount: 0,
  };
}

export function RechnungDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const isNew = id === "neu";

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
      positions: [emptyPosition()],
      status: "Entwurf" as InvoiceStatus,
      vatRate: state.projects[0]?.vatRate ?? 0.19,
      notes: "",
    };
  });

  // Track which position is a Überstunden position
  const [ueberstundenPositionId, setUeberstundenPositionId] = useState<
    string | null
  >(null);

  const client = state.clients.find((c) => c.id === invoice.clientId);
  const clientProjects = useMemo(
    () => state.projects.filter((p) => p.clientId === invoice.clientId),
    [state.projects, invoice.clientId],
  );
  const project = state.projects.find((p) => p.id === invoice.projectId);

  // Date range state for "Stunden übernehmen"
  const now = new Date();
  const [rangeFrom, setRangeFrom] = useState(
    format(startOfMonth(now), "yyyy-MM-dd"),
  );
  const [rangeTo, setRangeTo] = useState(format(endOfMonth(now), "yyyy-MM-dd"));

  const capResult = useMemo(
    () =>
      invoice.projectId
        ? getCapAdjustedHours(
            state.timeEntries,
            invoice.projectId,
            rangeFrom,
            rangeTo,
            project?.weeklyTarget ?? 28.5,
          )
        : {
            kwNumbers: [],
            totalBillableHours: 0,
            totalExcessHours: 0,
            entries: [],
            kwDetails: [],
          },
    [state.timeEntries, invoice.projectId, rangeFrom, rangeTo, project?.weeklyTarget],
  );

  const kontoBalance = getStundenKontoBalance(
    state.stundenKonto,
    state.timeEntries,
    invoice.projectId,
    project?.weeklyTarget ?? 28.5,
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
    if (capResult.totalBillableHours === 0 && capResult.totalExcessHours === 0)
      return;

    const desc = project?.description || "";
    const uncapped = capResult.kwDetails.filter((d) => d.excess === 0);
    const capped = capResult.kwDetails.filter((d) => d.excess > 0);

    const formatKwRange = (kws: number[]) =>
      kws.length === 1
        ? String(kws[0])
        : kws.length === 2
          ? `${kws[0]} und ${kws[1]}`
          : `${kws[0]} bis ${kws[kws.length - 1]}`;

    const positions: InvoicePosition[] = [];

    const pHourlyRate = project?.hourlyRate ?? 35;
    const pWeeklyCap = project?.weeklyCap ?? 1000;

    // Uncapped weeks: combined hours position
    if (uncapped.length > 0) {
      const totalHours = uncapped.reduce((s, d) => s + d.actual, 0);
      positions.push({
        id: crypto.randomUUID(),
        description: desc,
        billingType: "hours",
        kwRange: formatKwRange(uncapped.map((d) => d.kw)),
        totalHours,
        hourlyRate: pHourlyRate,
        flatAmount: 0,
        netAmount: totalHours * pHourlyRate,
      });
    }

    // Capped weeks: combined flatrate position
    if (capped.length > 0) {
      positions.push({
        id: crypto.randomUUID(),
        description: desc,
        billingType: "flatrate",
        kwRange: formatKwRange(capped.map((d) => d.kw)),
        totalHours: 0,
        hourlyRate: pHourlyRate,
        flatAmount: pWeeklyCap * capped.length,
        netAmount: pWeeklyCap * capped.length,
      });
    }

    // Reset Überstunden position if importing fresh hours
    setUeberstundenPositionId(null);
    setInvoice((prev) => ({ ...prev, positions }));
  };

  const handleUeberstundenAbrechnen = () => {
    if (kontoBalance <= 0) return;

    const pHourlyRate = project?.hourlyRate ?? 35;
    const posId = crypto.randomUUID();
    const pos: InvoicePosition = {
      id: posId,
      description: "Stunden aus Überstunden-Konto",
      billingType: "hours",
      kwRange: "Überstunden",
      totalHours: Math.round(kontoBalance * 100) / 100,
      hourlyRate: pHourlyRate,
      flatAmount: 0,
      netAmount:
        (Math.round(kontoBalance * 100) / 100) * pHourlyRate,
    };

    setUeberstundenPositionId(posId);
    setInvoice((prev) => ({ ...prev, positions: [...prev.positions, pos] }));
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
    if (posId === ueberstundenPositionId) {
      setUeberstundenPositionId(null);
    }
    setInvoice((p) => ({
      ...p,
      positions: p.positions.filter((pp) => pp.id !== posId),
    }));
  };

  const netTotal = invoice.positions.reduce((s, p) => s + p.netAmount, 0);
  const vatAmount = netTotal * invoice.vatRate;
  const grossTotal = netTotal + vatAmount;

  const handleSave = () => {
    // Create debit entry for Überstunden position
    const ueberstundenPos = ueberstundenPositionId
      ? invoice.positions.find((p) => p.id === ueberstundenPositionId)
      : null;

    if (isNew) {
      dispatch({ type: "ADD_INVOICE", invoice });
    } else {
      dispatch({ type: "UPDATE_INVOICE", invoice });
    }

    if (ueberstundenPos && ueberstundenPos.totalHours > 0) {
      dispatch({
        type: "ADD_STUNDEN_KONTO_ENTRIES",
        entries: [
          {
            id: crypto.randomUUID(),
            projectId: invoice.projectId,
            month: invoice.date.slice(0, 7),
            hours: -ueberstundenPos.totalHours,
            source: "invoice",
            invoiceId: invoice.id,
            note: `Rechnung ${invoice.number}`,
          },
        ],
      });
    }

    navigate("/rechnungen");
  };

  const handleDelete = () => {
    if (existing && confirm("Rechnung wirklich löschen?")) {
      dispatch({ type: "DELETE_INVOICE", id: existing.id });
      navigate("/rechnungen");
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
                document={
                  <RechnungPdf
                    invoice={invoice}
                    client={client || state.clients[0]}
                    project={project || state.projects[0]}
                    settings={state.settings}
                  />
                }
                fileName={`Rechnung_${invoice.number}.pdf`}
              />
              <Button variant="danger" size="sm" onClick={handleDelete}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <button
        onClick={() => navigate("/rechnungen")}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6"
      >
        <ArrowLeft size={16} />
        Zurück
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card title="Grunddaten">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="Rechnungsnummer"
                  value={invoice.number}
                  onValueChange={(v) =>
                    setInvoice((p) => ({ ...p, number: v }))
                  }
                  decimals={0}
                />
                <Input
                  label="Rechnungsdatum"
                  type="date"
                  value={invoice.date}
                  onChange={(e) =>
                    setInvoice((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-stone-600">
                  Kunde
                </label>
                <select
                  value={invoice.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                >
                  {state.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-stone-600">
                  Projekt
                </label>
                <select
                  value={invoice.projectId}
                  onChange={(e) => {
                    const newProj = state.projects.find((p) => p.id === e.target.value);
                    setInvoice((p) => ({ ...p, projectId: e.target.value, vatRate: newProj?.vatRate ?? 0.19 }));
                  }
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                >
                  {clientProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-stone-600">
                  Status
                </label>
                <select
                  value={invoice.status}
                  onChange={(e) =>
                    setInvoice((p) => ({
                      ...p,
                      status: e.target.value as InvoiceStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                >
                  <option value="Entwurf">Entwurf</option>
                  <option value="Gesendet">Gesendet</option>
                  <option value="Bezahlt">Bezahlt</option>
                </select>
              </div>
            </div>
          </Card>

          <Card title="Positionen">
            <div className="space-y-4">
              {/* Stunden übernehmen */}
              <div className="p-4 border border-dashed border-stone-300 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <Clock size={14} />
                  Stunden übernehmen
                </div>
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

                    {/* Cap warning */}
                    {cappedWeeks.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1.5">
                          <AlertTriangle size={12} />
                          Wochenlimit erreicht
                        </div>
                        {cappedWeeks.map((d) => (
                          <div
                            key={d.kw}
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

              {/* Überstunden abrechnen */}
              {kontoBalance > 0 && !ueberstundenPositionId && (
                <button
                  onClick={handleUeberstundenAbrechnen}
                  className="w-full p-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 flex items-center justify-between hover:bg-emerald-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <Wallet size={14} />
                    Überstunden abrechnen
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatNumber(kontoBalance)} Std. verfügbar
                  </span>
                </button>
              )}

              {invoice.positions.map((pos, idx) => (
                <div
                  key={pos.id}
                  className={`p-4 rounded-lg space-y-3 ${
                    pos.id === ueberstundenPositionId
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-stone-700">
                      Position {idx + 1}
                      {pos.id === ueberstundenPositionId && (
                        <span className="ml-2 text-xs font-normal text-emerald-600">
                          (Überstunden)
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={pos.billingType}
                        onChange={(e) =>
                          updatePosition(pos.id, {
                            billingType: e.target.value as InvoiceBillingType,
                          })
                        }
                        className="rounded border border-stone-300 px-2 py-1 text-xs"
                      >
                        <option value="flatrate">Pauschal</option>
                        <option value="hours">Nach Stunden</option>
                      </select>
                      {invoice.positions.length > 1 && (
                        <button
                          onClick={() => removePosition(pos.id)}
                          className="p-1 text-stone-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-stone-500">
                      Beschreibung
                    </label>
                    <textarea
                      value={pos.description}
                      onChange={(e) =>
                        updatePosition(pos.id, { description: e.target.value })
                      }
                      rows={2}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:border-stone-500 focus:outline-none"
                      placeholder={
                        project?.description || "Leistungsbeschreibung..."
                      }
                    />
                  </div>

                  <Input
                    label="Zeitraum (KW)"
                    value={pos.kwRange}
                    onChange={(e) =>
                      updatePosition(pos.id, { kwRange: e.target.value })
                    }
                    placeholder="z.B. 14 und 15"
                  />

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
              ))}

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setInvoice((p) => ({
                    ...p,
                    positions: [...p.positions, emptyPosition()],
                  }))
                }
              >
                Position hinzufügen
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Vorschau">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Netto</span>
                <span className="font-medium text-stone-800">
                  {formatEuro(netTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">19% USt.</span>
                <span className="font-medium text-stone-800">
                  {formatEuro(vatAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-stone-200">
                <span className="font-semibold text-stone-800">
                  Gesamtbetrag
                </span>
                <span className="font-bold text-stone-800">
                  {formatEuro(grossTotal)}
                </span>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              {isNew ? "Rechnung erstellen" : "Speichern"}
            </Button>
            {isNew && (
              <PdfDownloadButton
                document={
                  <RechnungPdf
                    invoice={invoice}
                    client={client || state.clients[0]}
                    project={project || state.projects[0]}
                    settings={state.settings}
                  />
                }
                fileName={`Rechnung_${invoice.number}.pdf`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
