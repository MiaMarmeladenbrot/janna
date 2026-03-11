import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths } from 'date-fns';
import { formatMonthYear } from '../../utils/dateFormat';

interface MonthSelectorProps {
  currentMonth: Date;
  onChange: (date: Date) => void;
}

export function MonthSelector({ currentMonth, onChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(subMonths(currentMonth, 1))}
        className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
      >
        <ChevronLeft size={20} className="text-stone-600" />
      </button>
      <span className="text-lg font-semibold text-stone-800 min-w-[180px] text-center capitalize">
        {formatMonthYear(currentMonth)}
      </span>
      <button
        onClick={() => onChange(addMonths(currentMonth, 1))}
        className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
      >
        <ChevronRight size={20} className="text-stone-600" />
      </button>
    </div>
  );
}
