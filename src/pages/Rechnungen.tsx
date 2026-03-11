import { Link, useNavigate } from "react-router-dom";
import { Plus, FileText, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { useApp } from "../store/AppContext";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/common/Button";
import { formatDate } from "../utils/dateFormat";
import { formatEuro } from "../utils/currency";
import { RechnungPdf } from "../pdf/RechnungPdf";
import type { Invoice, InvoiceStatus } from "../store/types";

const statusColors: Record<string, string> = {
  Entwurf: "bg-stone-100 text-stone-700",
  Gesendet: "bg-blue-100 text-blue-700",
  Bezahlt: "bg-green-100 text-green-700",
};

const statusFlow: InvoiceStatus[] = ["Entwurf", "Gesendet", "Bezahlt"];

export function Rechnungen() {
  const { state, dispatch } = useApp();
  const invoices = [...state.invoices].sort((a, b) => b.number - a.number);
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const getClient = (clientId: string) =>
    state.clients.find((c) => c.id === clientId);

  const getProject = (projectId: string) =>
    state.projects.find((p) => p.id === projectId);

  const getTotal = (invoice: Invoice) => {
    const net = invoice.positions.reduce((s, p) => s + p.netAmount, 0);
    return net * (1 + invoice.vatRate);
  };

  const cycleStatus = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    const currentIdx = statusFlow.indexOf(invoice.status);
    const nextStatus = statusFlow[(currentIdx + 1) % statusFlow.length];
    dispatch({
      type: "UPDATE_INVOICE",
      invoice: { ...invoice, status: nextStatus },
    });
  };

  const handleDownload = async (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    setDownloadingId(invoice.id);
    try {
      const client = getClient(invoice.clientId) || state.clients[0];
      const project = getProject(invoice.projectId) || state.projects[0];
      const blob = await pdf(
        <RechnungPdf
          invoice={invoice}
          client={client}
          project={project}
          settings={state.settings}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rechnung_${invoice.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Rechnungen">
        <Link to="/rechnungen/neu">
          <Button>
            <Plus size={16} />
            Neue Rechnung
          </Button>
        </Link>
      </PageHeader>

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          <FileText size={48} className="mx-auto mb-4 text-stone-300" />
          <p className="text-lg font-medium">Noch keine Rechnungen</p>
          <p className="text-sm mt-1">Erstelle deine erste Rechnung</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">
                  Nr.
                </th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">
                  Datum
                </th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">
                  Kunde
                </th>
                <th className="text-left px-5 py-3 text-sm font-semibold text-stone-700">
                  Projekt
                </th>
                <th className="text-right px-5 py-3 text-sm font-semibold text-stone-700">
                  Betrag
                </th>
                <th className="text-center px-5 py-3 text-sm font-semibold text-stone-700">
                  Status
                </th>
                <th className="px-5 py-3 text-sm font-semibold text-stone-700" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-stone-50 hover:bg-stone-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/rechnungen/${inv.id}`)}
                >
                  <td className="px-5 py-3 text-sm font-medium text-stone-800">
                    {inv.number}
                  </td>
                  <td className="px-5 py-3 text-sm text-stone-600">
                    {formatDate(inv.date)}
                  </td>
                  <td className="px-5 py-3 text-sm text-stone-600">
                    {getClient(inv.clientId)?.name || "Unbekannt"}
                  </td>
                  <td className="px-5 py-3 text-sm text-stone-600">
                    {getProject(inv.projectId)?.name || ""}
                  </td>
                  <td className="px-5 py-3 text-sm text-right font-medium text-stone-800">
                    {formatEuro(getTotal(inv))}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={(e) => cycleStatus(e, inv)}
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusColors[inv.status]}`}
                      title="Klicken um Status zu ändern"
                    >
                      {inv.status}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={(e) => handleDownload(e, inv)}
                      disabled={downloadingId === inv.id}
                      className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors disabled:opacity-50"
                      title="PDF herunterladen"
                    >
                      {downloadingId === inv.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
