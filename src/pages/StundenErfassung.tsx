import { useState } from "react";
import { getMonth, getYear } from "date-fns";
import { useApp } from "../store/AppContext";
import { PageHeader } from "../components/layout/PageHeader";
import { MonthSelector } from "../components/stunden/MonthSelector";
import { WeekView } from "../components/stunden/WeekView";
import { getWeeksInMonth } from "../utils/kw";
import { formatNumber } from "../utils/currency";
import { getEntriesForMonth, getTotalHours } from "../utils/calculations";

export function StundenErfassung() {
  const { state, dispatch } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState(
    state.projects[0]?.id || "",
  );

  const year = getYear(currentMonth);
  const month = getMonth(currentMonth);
  const weeks = getWeeksInMonth(year, month);
  const monthEntries = getEntriesForMonth(state.timeEntries, year, month);
  const monthTotal = getTotalHours(monthEntries);

  const selectedProject = state.projects.find((p) => p.id === selectedProjectId);
  const commonTasks = selectedProject?.commonTasks || [];

  const handleUpdateEntry = (
    date: string,
    data: {
      startTime: string;
      endTime: string;
      breakMinutes: number;
      hours: number;
      checkedTasks: string[];
      note: string;
    },
  ) => {
    const existing = state.timeEntries.find(
      (e) => e.date === date && e.projectId === selectedProjectId,
    );

    const isEmpty = !data.startTime && !data.endTime && data.checkedTasks.length === 0 && !data.note;

    if (isEmpty && existing) {
      dispatch({ type: "DELETE_TIME_ENTRY", id: existing.id });
      return;
    }

    if (existing) {
      dispatch({
        type: "UPDATE_TIME_ENTRY",
        entry: { ...existing, ...data },
      });
    } else if (!isEmpty) {
      dispatch({
        type: "ADD_TIME_ENTRY",
        entry: {
          id: crypto.randomUUID(),
          date,
          projectId: selectedProjectId,
          ...data,
        },
      });
    }
  };

  return (
    <div>
      <PageHeader title="Stundenerfassung">
        <div className="text-sm text-stone-500">
          Gesamt:{" "}
          <span className="font-semibold text-stone-800">
            {formatNumber(monthTotal)} Std.
          </span>
        </div>
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

      <div className="space-y-4">
        {weeks.map((kw) => (
          <WeekView
            key={kw}
            kw={kw}
            year={year}
            month={month}
            entries={state.timeEntries}
            projectId={selectedProjectId}
            commonTasks={commonTasks}
            project={selectedProject}
            settings={state.settings}
            onUpdateEntry={handleUpdateEntry}
          />
        ))}
      </div>
    </div>
  );
}
