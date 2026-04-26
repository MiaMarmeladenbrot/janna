import { useState, useRef } from "react";
import {
  format,
  isToday,
  isSameDay,
  addDays,
  startOfISOWeek,
  getISOWeek,
  isWeekend,
} from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import type { TimeEntry, Settings, Project } from "../../store/types";
import { formatNumber } from "../../utils/currency";
import { PdfDownloadButton } from "../../pdf/PdfDownloadButton";
import { TimeInput } from "./TimeInput";

function calcHours(start: string, end: string, breakMin: number): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em - (sh * 60 + sm) - breakMin) / 60;
  return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}

interface MobileDayViewProps {
  date: Date;
  onDateChange: (d: Date) => void;
  entries: TimeEntry[];
  projectId: string;
  commonTasks: string[];
  project?: Project;
  settings?: Settings;
  onUpdateEntry: (
    date: string,
    data: {
      startTime: string;
      endTime: string;
      breakMinutes: number;
      hours: number;
      checkedTasks: string[];
    },
  ) => void;
}

export function MobileDayView({
  date,
  onDateChange,
  entries,
  projectId,
  commonTasks,
  project,
  settings,
  onUpdateEntry,
}: MobileDayViewProps) {
  const dateStr = format(date, "yyyy-MM-dd");
  const entry = entries.find(
    (e) => e.date === dateStr && e.projectId === projectId,
  );
  const startTime = entry?.startTime ?? "";
  const endTime = entry?.endTime ?? "";
  const breakMinutes = entry?.breakMinutes ?? 0;
  const checkedTasks = entry?.checkedTasks ?? [];
  const hours = entry?.hours ?? 0;
  const timeError = startTime !== "" && endTime !== "" && startTime >= endTime;

  const weekStart = startOfISOWeek(date);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const kw = getISOWeek(date);
  const weekHours = weekDays.reduce((sum, d) => {
    const ds = format(d, "yyyy-MM-dd");
    const e = entries.find((x) => x.date === ds && x.projectId === projectId);
    return sum + (e?.hours ?? 0);
  }, 0);
  const weekEntries = weekDays
    .map((d) => {
      const ds = format(d, "yyyy-MM-dd");
      return entries.find((x) => x.date === ds && x.projectId === projectId);
    })
    .filter((e): e is TimeEntry => !!e);
  const weeklyTarget = project?.weeklyTarget ?? 28.5;

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    const target = e.target as HTMLElement;
    // Don't navigate if swipe started inside an input/button (avoid stealing focus/scroll)
    if (target.closest("input, textarea, button, select, label")) return;
    if (Math.abs(dy) > 50) return;
    if (dx < -60) onDateChange(addDays(date, 1));
    else if (dx > 60) onDateChange(addDays(date, -1));
  };

  const emit = (
    patch: Partial<{
      startTime: string;
      endTime: string;
      breakMinutes: number;
      checkedTasks: string[];
    }>,
  ) => {
    const s = patch.startTime ?? startTime;
    const e = patch.endTime ?? endTime;
    const b = patch.breakMinutes ?? breakMinutes;
    onUpdateEntry(dateStr, {
      startTime: s,
      endTime: e,
      breakMinutes: b,
      hours: calcHours(s, e, b),
      checkedTasks: patch.checkedTasks ?? checkedTasks,
    });
  };

  const handleClear = () => {
    onUpdateEntry(dateStr, {
      startTime: "",
      endTime: "",
      breakMinutes: 0,
      hours: 0,
      checkedTasks: [],
    });
  };

  const [taskInput, setTaskInput] = useState("");
  const customTasks = checkedTasks.filter((t) => !commonTasks.includes(t));

  const handleToggleTask = (task: string) => {
    emit({
      checkedTasks: checkedTasks.includes(task)
        ? checkedTasks.filter((t) => t !== task)
        : [...checkedTasks, task],
    });
  };

  const handleAddCustomTask = () => {
    const trimmed = taskInput.trim();
    if (!trimmed || checkedTasks.includes(trimmed)) return;
    emit({ checkedTasks: [...checkedTasks, trimmed] });
    setTaskInput("");
  };

  const hasAnyData =
    startTime !== "" ||
    endTime !== "" ||
    breakMinutes > 0 ||
    checkedTasks.length > 0;

  const today = new Date();
  const isOnToday = isSameDay(date, today);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="select-none"
    >
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => onDateChange(addDays(date, -1))}
          className="p-2 -ml-2 rounded-lg hover:bg-stone-100 active:bg-stone-200"
          aria-label="Vorheriger Tag"
        >
          <ChevronLeft size={24} className="text-stone-600" />
        </button>
        <div className="flex flex-col items-center">
          <div className="text-lg font-semibold text-stone-800 capitalize">
            {format(date, "EEEE, d. MMM", { locale: de })}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            KW {kw} · {formatNumber(weekHours)} / {formatNumber(weeklyTarget)}{" "}
            Std.
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDateChange(addDays(date, 1))}
          className="p-2 -mr-2 rounded-lg hover:bg-stone-100 active:bg-stone-200"
          aria-label="Nächster Tag"
        >
          <ChevronRight size={24} className="text-stone-600" />
        </button>
      </div>

      <div className="flex justify-center mb-4 h-7">
        {!isOnToday && (
          <button
            type="button"
            onClick={() => onDateChange(today)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-colors"
          >
            Zu Heute springen
          </button>
        )}
      </div>

      <div
        className={`bg-white rounded-2xl border ${
          isOnToday ? "border-amber-300" : "border-stone-200"
        } shadow-sm p-4`}
      >
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <TimeInput
            value={startTime}
            onChange={(v) => emit({ startTime: v })}
            error={timeError}
            placeholder="Von"
          />
          <span className="text-xs text-stone-400">–</span>
          <TimeInput
            value={endTime}
            onChange={(v) => emit({ endTime: v })}
            error={timeError}
            placeholder="Bis"
          />
          <input
            type="number"
            min="0"
            step="5"
            value={breakMinutes || ""}
            onChange={(e) =>
              emit({ breakMinutes: parseInt(e.target.value) || 0 })
            }
            placeholder="Pause"
            className="w-16 rounded-lg border border-stone-300 py-1.5 px-2 text-sm text-right text-stone-800 placeholder:text-center focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-stone-400 shrink-0">min</span>
        </div>

        {hours > 0 && (
          <div className="flex items-baseline justify-center gap-2 pt-3 mt-3 border-t border-stone-100">
            <span className="text-3xl font-bold text-stone-800">
              {formatNumber(hours, 2)}
            </span>
            <span className="text-sm text-stone-500">Std.</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-2">
          Arbeiten
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {commonTasks.map((task) => {
            const checked = checkedTasks.includes(task);
            return (
              <button
                key={task}
                type="button"
                onClick={() => handleToggleTask(task)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  checked
                    ? "bg-stone-800 text-white"
                    : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
                }`}
              >
                {task}
              </button>
            );
          })}
          {customTasks.map((task) => (
            <button
              key={task}
              type="button"
              onClick={() => handleToggleTask(task)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-stone-800 text-white hover:bg-red-700 transition-colors"
            >
              {task}
              <X size={14} />
            </button>
          ))}
        </div>
        <input
          type="text"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCustomTask();
            }
          }}
          placeholder="Eigene Arbeit eingeben + Enter"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
      </div>

      {hasAnyData && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-500 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 size={14} />
            Eintrag löschen
          </button>
        </div>
      )}

      <div className="mt-6 bg-white rounded-2xl border border-stone-200 shadow-sm p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
            KW {kw}
          </span>
          {weekEntries.length > 0 && project && settings && (
            <PdfDownloadButton
              label="Stundennachweis"
              buildDocument={async () => {
                const { TimesheetPdf } = await import("../../pdf/TimesheetPdf");
                return (
                  <TimesheetPdf
                    kw={kw}
                    entries={weekEntries}
                    projectName={project.name}
                    settings={settings}
                  />
                );
              }}
              fileName={`Stundennachweis_KW${kw}_${project.name.replace(
                /\s+/g,
                "_",
              )}.pdf`}
            />
          )}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const ds = format(d, "yyyy-MM-dd");
            const e = entries.find(
              (x) => x.date === ds && x.projectId === projectId,
            );
            const isSel = isSameDay(d, date);
            const isWE = isWeekend(d);
            const td = isToday(d);
            return (
              <button
                key={ds}
                type="button"
                onClick={() => onDateChange(d)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                  isSel
                    ? "bg-stone-100 ring-1 ring-stone-300"
                    : "hover:bg-stone-50"
                }`}
              >
                <span
                  className={`text-[10px] font-medium uppercase ${
                    isWE ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  {format(d, "EEEEEE", { locale: de })}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    td
                      ? "text-amber-600"
                      : isSel
                        ? "text-stone-800"
                        : isWE
                          ? "text-stone-400"
                          : "text-stone-700"
                  }`}
                >
                  {format(d, "d")}
                </span>
                <span
                  className={`block w-2 h-2 rounded-full ${
                    e?.hours
                      ? isSel
                        ? "bg-stone-800"
                        : "bg-stone-500"
                      : "border border-stone-300"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

