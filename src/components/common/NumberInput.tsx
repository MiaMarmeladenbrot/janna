import type { InputHTMLAttributes } from 'react';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  value: number | string;
  onValueChange: (val: number) => void;
  decimals?: number;
}

export function NumberInput({ label, value, onValueChange, decimals = 1, className = '', id, ...props }: NumberInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-stone-600">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="number"
        step={Math.pow(10, -decimals)}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onValueChange(v);
          else if (e.target.value === '') onValueChange(0);
        }}
        className={`w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 ${className}`}
        {...props}
      />
    </div>
  );
}
