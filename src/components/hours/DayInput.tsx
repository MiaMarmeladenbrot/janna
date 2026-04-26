import { useState } from "react";
import { format, isWeekend, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
import { TimeInput } from "./TimeInput";

interface DayInputProps {
  date: Date;
  hours: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  checkedTasks: string[];
  commonTasks: string[];
  onChange: (data: {
    startTime: string;
    endTime: string;
    breakMinutes: number;
    hours: number;
    checkedTasks: string[];
  }) => void;
}

function calcHours(start: string, end: string, breakMin: number): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em - (sh * 60 + sm) - breakMin) / 60;
  return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}

export function DayInput({
  date,
  hours,
  startTime,
  endTime,
  breakMinutes,
  checkedTasks,
  commonTasks,
  onChange,
}: DayInputProps) {
  const [expanded, setExpanded] = useState(false);
  const dayName = format(date, "EEE", { locale: de });
  const dayNum = format(date, "d");
  const weekend = isWeekend(date);
  const today = isToday(date);
  const hasContent = checkedTasks.length > 0;
  const hasAnyData =
    startTime !== "" ||
    endTime !== "" ||
    breakMinutes > 0 ||
    checkedTasks.length > 0;
  const timeError = startTime !== "" && endTime !== "" && startTime >= endTime;

  const handleClear = () => {
    onChange({
      startTime: "",
      endTime: "",
      breakMinutes: 0,
      hours: 0,
      checkedTasks: [],
    });
    setExpanded(false);
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
    onChange({
      startTime: s,
      endTime: e,
      breakMinutes: b,
      hours: calcHours(s, e, b),
      checkedTasks: patch.checkedTasks ?? checkedTasks,
    });
  };

  const handleTimeChange = (
    field: "start" | "end" | "break",
    value: string,
  ) => {
    if (field === "break") emit({ breakMinutes: parseInt(value) || 0 });
    else emit({ [field === "start" ? "startTime" : "endTime"]: value });
  };

  const handleToggleTask = (task: string) => {
    emit({
      checkedTasks: checkedTasks.includes(task)
        ? checkedTasks.filter((t) => t !== task)
        : [...checkedTasks, task],
    });
  };

  const [inputText, setInputText] = useState("");
  const customTasks = checkedTasks.filter((t) => !commonTasks.includes(t));

  const handleAddCustomTask = () => {
    const trimmed = inputText.trim();
    if (!trimmed || checkedTasks.includes(trimmed)) return;
    emit({ checkedTasks: [...checkedTasks, trimmed] });
    setInputText("");
  };

  return (
    <div
      className={`rounded-lg ${
        today
          ? "bg-amber-50 border border-amber-200"
          : weekend
            ? "bg-stone-50"
            : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-16 flex items-center gap-2">
          <span
            className={`text-sm font-medium ${weekend ? "text-stone-400" : "text-stone-600"}`}
          >
            {dayName}
          </span>
          <span
            className={`text-sm ${weekend ? "text-stone-400" : "text-stone-500"}`}
          >
            {dayNum}.
          </span>
        </div>
        <TimeInput
          value={startTime}
          onChange={(v) => handleTimeChange("start", v)}
          onFocus={() => setExpanded(true)}
          error={timeError}
          placeholder="Von"
        />
        <span className="text-xs text-stone-400">–</span>
        <TimeInput
          value={endTime}
          onChange={(v) => handleTimeChange("end", v)}
          onFocus={() => setExpanded(true)}
          error={timeError}
          placeholder="Bis"
        />
        <input
          type="number"
          min="0"
          step="5"
          value={breakMinutes || ""}
          onChange={(e) => handleTimeChange("break", e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Pause"
          className="w-16 rounded-lg border border-stone-300 py-1.5 px-2 text-sm text-right text-stone-800 placeholder:text-center focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-stone-400 shrink-0">min</span>
        {hours > 0 && (
          <span className="text-sm text-stone-500 shrink-0">{hours} Std.</span>
        )}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`ml-auto p-1 rounded transition-colors ${
            hasContent
              ? "text-amber-600 hover:bg-amber-100"
              : "text-stone-400 hover:bg-stone-100"
          }`}
          title="Arbeiten beschreiben"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-stone-100 ml-16">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {commonTasks.map((task) => {
              const checked = checkedTasks.includes(task);
              return (
                <button
                  key={task}
                  type="button"
                  onClick={() => handleToggleTask(task)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    checked
                      ? "bg-stone-800 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
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
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-800 text-white transition-colors hover:bg-red-700"
              >
                {task}
                <X size={12} />
              </button>
            ))}
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomTask();
              }
            }}
            placeholder="Weitere Arbeit eingeben + Enter"
            className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
          {hasAnyData && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-stone-500 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 size={12} />
                Eintrag löschen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
