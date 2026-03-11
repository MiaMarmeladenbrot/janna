import { format } from 'date-fns';
import type { TimeEntry, Settings, Project } from '../../store/types';
import { getDaysInWeekForMonth } from '../../utils/kw';
import { DayInput } from './DayInput';
import { formatNumber } from '../../utils/currency';
import { PdfDownloadButton } from '../../pdf/PdfDownloadButton';
import { StundenzettelPdf } from '../../pdf/StundenzettelPdf';

interface WeekViewProps {
  kw: number;
  year: number;
  month: number;
  entries: TimeEntry[];
  projectId: string;
  commonTasks: string[];
  project?: Project;
  settings?: Settings;
  onUpdateEntry: (date: string, data: {
    startTime: string;
    endTime: string;
    breakMinutes: number;
    hours: number;
    checkedTasks: string[];
    note: string;
  }) => void;
}

export function WeekView({ kw, year, month, entries, projectId, commonTasks, project, settings, onUpdateEntry }: WeekViewProps) {
  const days = getDaysInWeekForMonth(kw, year, month);

  const getEntryForDay = (date: Date): TimeEntry | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.find((e) => e.date === dateStr && e.projectId === projectId);
  };

  const weekTotal = days.reduce((sum, d) => sum + (getEntryForDay(d)?.hours || 0), 0);

  // Collect entries for this week for PDF
  const weekEntries = days
    .map((d) => getEntryForDay(d))
    .filter((e): e is TimeEntry => !!e);

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <span className="text-sm font-semibold text-stone-700">KW {kw}</span>
        <div className="flex items-center gap-3">
          {weekEntries.length > 0 && settings && project && (
            <PdfDownloadButton
              document={
                <StundenzettelPdf
                  kw={kw}
                  entries={weekEntries}
                  projectName={project.name}
                  settings={settings}
                />
              }
              fileName={`Stundenzettel_KW${kw}_${project.name.replace(/\s+/g, '_')}.pdf`}
            />
          )}
          <span className={`text-sm font-semibold ${weekTotal > 0 ? 'text-stone-800' : 'text-stone-400'}`}>
            {formatNumber(weekTotal)} Std.
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1">
        {days.map((date) => {
          const entry = getEntryForDay(date);
          return (
            <DayInput
              key={date.toISOString()}
              date={date}
              hours={entry?.hours || 0}
              startTime={entry?.startTime || ''}
              endTime={entry?.endTime || ''}
              breakMinutes={entry?.breakMinutes || 0}
              checkedTasks={entry?.checkedTasks || []}
              note={entry?.note || ''}
              commonTasks={commonTasks}
              onChange={(data) => onUpdateEntry(format(date, 'yyyy-MM-dd'), data)}
            />
          );
        })}
      </div>
    </div>
  );
}
