import { useState } from "react";
import { getMonth, getYear } from "date-fns";
import { useApp } from "../store/AppContext";
import { PageHeader } from "../components/layout/PageHeader";
import { MonthSelector } from "../components/stunden/MonthSelector";
import { StundenKonto } from "../components/stunden/StundenKonto";
import {
  getEntriesForMonth,
  getHoursByKW,
} from "../utils/calculations";

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

  return (
    <div>
      <PageHeader title="Stundenübersicht" />

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

      <div className="max-w-xl">
        <StundenKonto
          hourlyRate={selectedProject?.hourlyRate ?? 35}
          weeklyTarget={selectedProject?.weeklyTarget ?? 28.5}
          projectId={selectedProjectId}
          hoursByKW={hoursByKW}
        />
      </div>
    </div>
  );
}
