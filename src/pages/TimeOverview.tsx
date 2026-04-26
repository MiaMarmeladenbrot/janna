import { useState } from "react";
import { Link } from "react-router-dom";
import { FolderPlus } from "lucide-react";
import { useApp } from "../store/AppContext";
import { PageHeader } from "../components/layout/PageHeader";
import { OvertimeAccount } from "../components/hours/OvertimeAccount";
import { getHoursByKW } from "../utils/calculations";

export function TimeOverview() {
  const { state } = useApp();
  const activeProjects = state.projects.filter((p) => p.active);
  const [selectedProjectId, setSelectedProjectId] = useState(
    activeProjects[0]?.id || "",
  );

  const selectedProject = state.projects.find(
    (p) => p.id === selectedProjectId,
  );
  const projectEntries = state.timeEntries.filter(
    (e) => e.projectId === selectedProjectId,
  );
  const hoursByKW = getHoursByKW(projectEntries);

  if (activeProjects.length === 0) {
    return (
      <div>
        <PageHeader title="Stundenübersicht" />
        <div className="max-w-xl rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <FolderPlus size={32} className="mx-auto text-stone-400 mb-3" />
          <h3 className="font-semibold text-stone-700 mb-1">
            Noch kein Projekt
          </h3>
          <p className="text-sm text-stone-500 mb-4">
            Leg zuerst ein Projekt an, um Stunden und Überstunden zu erfassen.
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-stone-800 text-white hover:bg-stone-700 transition-colors"
          >
            <FolderPlus size={14} />
            Projekt anlegen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Stundenübersicht" />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-blue-50 rounded-xl border border-blue-200 shadow-sm px-4 py-2">
          <span className="text-sm font-medium text-blue-600">Projekt:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-sm font-semibold text-blue-800 bg-transparent focus:outline-none cursor-pointer"
          >
            {activeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-xl">
        <OvertimeAccount
          hourlyRate={selectedProject?.hourlyRate ?? 35}
          weeklyTarget={selectedProject?.weeklyTarget ?? 28.5}
          projectId={selectedProjectId}
          hoursByKW={hoursByKW}
        />
      </div>
    </div>
  );
}
