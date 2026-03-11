import { useRef } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { useApp } from "../store/AppContext";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { exportData, importData } from "../store/storage";
import { defaultState } from "../store/defaults";

export function DatenExport() {
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportData(state);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stundentracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = importData(ev.target?.result as string);
        dispatch({ type: "IMPORT_STATE", state: imported });
        alert("Daten erfolgreich importiert!");
      } catch {
        alert("Fehler beim Import: Ungültige Datei");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    if (
      confirm(
        "Alle Daten wirklich zurücksetzen? Das kann nicht rückgängig gemacht werden!",
      )
    ) {
      dispatch({ type: "RESET_STATE", state: defaultState });
    }
  };

  const stats = {
    entries: state.timeEntries.length,
    invoices: state.invoices.length,
    clients: state.clients.length,
    projects: state.projects.length,
  };

  return (
    <div>
      <PageHeader title="Daten" />

      <div className="space-y-6 max-w-2xl">
        <Card title="Statistik">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-800">
                {stats.entries}
              </p>
              <p className="text-xs text-stone-500">Einträge</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-800">
                {stats.invoices}
              </p>
              <p className="text-xs text-stone-500">Rechnungen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-800">
                {stats.clients}
              </p>
              <p className="text-xs text-stone-500">Kunden</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-800">
                {stats.projects}
              </p>
              <p className="text-xs text-stone-500">Projekte</p>
            </div>
          </div>
        </Card>

        <Card title="Export / Import">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-stone-600 mb-3">
                Exportiere alle Daten als JSON-Datei. Du kannst diese Datei
                später wieder importieren.
              </p>
              <Button variant="secondary" onClick={handleExport}>
                <Download size={16} />
                Daten exportieren
              </Button>
            </div>

            <div className="border-t border-stone-100 pt-4">
              <p className="text-sm text-stone-600 mb-3">
                Importiere eine zuvor exportierte JSON-Datei. Die aktuellen
                Daten werden überschrieben.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                Daten importieren
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Gefahrenzone">
          <div>
            <p className="text-sm text-stone-600 mb-3">
              Setze alle Daten auf die Standardwerte zurück. Diese Aktion kann
              nicht rückgängig gemacht werden.
            </p>
            <Button variant="danger" onClick={handleReset}>
              <AlertTriangle size={16} />
              Alle Daten zurücksetzen
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
