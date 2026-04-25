import { Document } from "@react-pdf/renderer";
import { format } from "date-fns";
import type { Invoice, Project, Settings, TimeEntry } from "../store/types";
import { isoWeekDateRange, uniqueWeeks } from "../utils/period";
import { TimesheetPage } from "./TimesheetPdf";

interface TimesheetsPdfProps {
  invoice: Invoice;
  project: Project;
  settings: Settings;
  timeEntries: TimeEntry[];
}

export function TimesheetsPdf({
  invoice,
  project,
  settings,
  timeEntries,
}: TimesheetsPdfProps) {
  const weeks = uniqueWeeks(invoice.positions);

  return (
    <Document>
      {weeks.map(({ year, week }) => {
        const { start, end } = isoWeekDateRange(year, week);
        const startStr = format(start, "yyyy-MM-dd");
        const endStr = format(end, "yyyy-MM-dd");
        const weekEntries = timeEntries.filter(
          (e) =>
            e.projectId === invoice.projectId &&
            e.date >= startStr &&
            e.date <= endStr,
        );
        return (
          <TimesheetPage
            key={`${year}-${week}`}
            kw={week}
            entries={weekEntries}
            projectName={project.name}
            settings={settings}
          />
        );
      })}
    </Document>
  );
}
