import { useState } from 'react';
import { format, isWeekend, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DayInputProps {
  date: Date;
  hours: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  checkedTasks: string[];
  note: string;
  commonTasks: string[];
  onChange: (data: {
    startTime: string;
    endTime: string;
    breakMinutes: number;
    hours: number;
    checkedTasks: string[];
    note: string;
  }) => void;
}

function calcHours(start: string, end: string, breakMin: number): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
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
  note,
  commonTasks,
  onChange,
}: DayInputProps) {
  const [expanded, setExpanded] = useState(false);
  const dayName = format(date, 'EEE', { locale: de });
  const dayNum = format(date, 'd');
  const weekend = isWeekend(date);
  const today = isToday(date);
  const hasContent = checkedTasks.length > 0 || note.length > 0;

  const handleTimeChange = (field: 'start' | 'end' | 'break', value: string) => {
    const newStart = field === 'start' ? value : startTime;
    const newEnd = field === 'end' ? value : endTime;
    const newBreak = field === 'break' ? (parseInt(value) || 0) : breakMinutes;
    const newHours = calcHours(newStart, newEnd, newBreak);
    onChange({ startTime: newStart, endTime: newEnd, breakMinutes: newBreak, hours: newHours, checkedTasks, note });
  };

  const handleToggleTask = (task: string) => {
    const next = checkedTasks.includes(task)
      ? checkedTasks.filter((t) => t !== task)
      : [...checkedTasks, task];
    onChange({ startTime, endTime, breakMinutes, hours, checkedTasks: next, note });
  };

  const handleNoteChange = (value: string) => {
    onChange({ startTime, endTime, breakMinutes, hours, checkedTasks, note: value });
  };

  return (
    <div
      className={`rounded-lg ${
        today ? 'bg-amber-50 border border-amber-200' : weekend ? 'bg-stone-50' : ''
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-16 flex items-center gap-2">
          <span className={`text-sm font-medium ${weekend ? 'text-stone-400' : 'text-stone-600'}`}>
            {dayName}
          </span>
          <span className={`text-sm ${weekend ? 'text-stone-400' : 'text-stone-500'}`}>{dayNum}.</span>
        </div>
        <input
          type="time"
          value={startTime}
          onChange={(e) => handleTimeChange('start', e.target.value)}
          className="w-24 rounded-lg border border-stone-300 px-2 py-1.5 text-sm text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        <span className="text-xs text-stone-400">–</span>
        <input
          type="time"
          value={endTime}
          onChange={(e) => handleTimeChange('end', e.target.value)}
          className="w-24 rounded-lg border border-stone-300 px-2 py-1.5 text-sm text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        <input
          type="number"
          min="0"
          step="5"
          value={breakMinutes || ''}
          onChange={(e) => handleTimeChange('break', e.target.value)}
          placeholder="0"
          className="w-14 rounded-lg border border-stone-300 px-2 py-1.5 text-sm text-right text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        <span className="text-xs text-stone-400 shrink-0">min</span>
        {hours > 0 && (
          <span className="text-sm text-stone-500 shrink-0">{hours} Std.</span>
        )}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`ml-auto p-1 rounded transition-colors ${
            hasContent ? 'text-amber-600 hover:bg-amber-100' : 'text-stone-400 hover:bg-stone-100'
          }`}
          title="Arbeiten beschreiben"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-stone-100 ml-16">
          {commonTasks.length > 0 && (
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
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {task}
                  </button>
                );
              })}
            </div>
          )}
          <textarea
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Weitere Arbeiten / Details..."
            rows={2}
            className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm text-stone-800 resize-none focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
      )}
    </div>
  );
}
