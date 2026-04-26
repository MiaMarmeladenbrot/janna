import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Trash2,
  Wallet,
  Banknote,
} from "lucide-react";
import { format } from "date-fns";
import { useApp } from "../../store/useApp";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { PdfDownloadButton } from "../../pdf/PdfDownloadButton";
import { formatPeriod } from "../../utils/period";
import type {
  Invoice,
  InvoicePosition,
  InvoiceStatus,
  OvertimeEntry,
} from "../../store/types";
import { InvoiceTotals } from "./InvoiceTotals";
import { InvoiceBasicsCard } from "./InvoiceBasicsCard";
import { PositionList } from "./PositionList";
import { FlatrateTab } from "./FlatrateTab";
import { OvertimeTab } from "./OvertimeTab";
import { HoursTab } from "./HoursTab";

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

  const client = state.clients.find((c) => c.id === invoice.clientId);
  const clientProjects = useMemo(
    () => state.projects.filter((p) => p.clientId === invoice.clientId),
    [state.projects, invoice.clientId],
  );
  const project = state.projects.find((p) => p.id === invoice.projectId);

  const addedOvertimeKeys = useMemo(
    () => new Set(overtimePositions.values()),
    [overtimePositions],
  );

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

  const addPosition = (pos: InvoicePosition) => {
    setInvoice((prev) => ({ ...prev, positions: [...prev.positions, pos] }));
  };

  const addPositions = (positions: InvoicePosition[]) => {
    if (positions.length === 0) return;
    setInvoice((prev) => ({
      ...prev,
      positions: [...prev.positions, ...positions],
    }));
  };

  const addOvertimePosition = (pos: InvoicePosition, rowKey: string) => {
    setOvertimePositions((prev) => {
      const next = new Map(prev);
      next.set(pos.id, rowKey);
      return next;
    });
    addPosition(pos);
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
                <HoursTab
                  project={project}
                  timeEntries={state.timeEntries}
                  invoices={state.invoices}
                  currentInvoiceId={invoice.id}
                  currentProjectId={invoice.projectId}
                  onAdd={addPositions}
                />
              )}

              {/* Flatrate tab */}
              {activeTab === "flatrate" && (
                <FlatrateTab
                  descriptionPlaceholder={project?.description}
                  onAdd={addPosition}
                />
              )}

              {activeTab === "overtime" && (
                <OvertimeTab
                  projectId={invoice.projectId}
                  project={project}
                  timeEntries={state.timeEntries}
                  overtimeEntries={state.overtimeEntries}
                  addedKeys={addedOvertimeKeys}
                  onAdd={addOvertimePosition}
                />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <PositionList
            positions={invoice.positions}
            overtimePositionIds={
              new Set(overtimePositions.keys())
            }
            descriptionPlaceholder={project?.description}
            onUpdate={updatePosition}
            onRemove={removePosition}
          />

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
