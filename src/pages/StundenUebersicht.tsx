import { useState } from "react";
import { getMonth, getYear } from "date-fns";
import { useApp } from "../store/AppContext";
import { PageHeader } from "../components/layout/PageHeader";
import { MonthSelector } from "../components/stunden/MonthSelector";
import { KWSummaryTable } from "../components/stunden/KWSummaryTable";
import { StundenKonto } from "../components/stunden/StundenKonto";
import {
  getEntriesForMonth,
  getHoursByKW,
  getTotalHours,
  getSollHours,
} from "../utils/calculations";
import { PdfDownloadButton } from "../pdf/PdfDownloadButton";
import { StundenPdf } from "../pdf/StundenPdf";

export function StundenUebersicht() {
  const { state } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState(
    state.projects[0]?.id || "",
  );

  const year = getYear(currentMonth);
  const month = getMonth(currentMonth);
  const selectedProject = state.projects.find((p) => p.id === selectedProjectId);
  const monthEntries = getEntriesForMonth(state.timeEntries, year, month, selectedProjectId);
  const hoursByKW = getHoursByKW(monthEntries);
  const istHours = getTotalHours(monthEntries);
  const sollHours = getSollHours(state.settings, year, month);

  return (
    <div>
      <PageHeader title="Stundenübersicht">
        <PdfDownloadButton
          document={
            <StundenPdf
              month={month}
              year={year}
              hoursByKW={hoursByKW}
              sollHours={sollHours}
              istHours={istHours}
              settings={state.settings}
              stundenKonto={state.stundenKonto}
            />
          }
          fileName={`Stunden_Uebersicht_${year}_${String(month + 1).padStart(2, "0")}.pdf`}
        />
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />
        <div className="flex items-center gap-2 bg-blue-50 rounded-xl border border-blue-200 shadow-sm px-4 py-2">
          <span className="text-sm font-medium text-blue-600">Projekt:</span>
          {state.projects.filter((p) => p.active).length <= 1 ? (
            <span className="text-sm font-semibold text-blue-800">
              {selectedProject?.name || "–"}
            </span>
          ) : (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-sm font-semibold text-blue-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {state.projects
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KWSummaryTable
          hoursByKW={hoursByKW}
          sollHours={sollHours}
          istHours={istHours}
        />
        <StundenKonto />
      </div>
    </div>
  );
}
