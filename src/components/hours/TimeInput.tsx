import { useState } from "react";

interface TimeInputProps {
  value: string;
  onChange: (time: string) => void;
  onFocus?: () => void;
  error?: boolean;
  placeholder?: string;
}

export function TimeInput({
  value,
  onChange,
  onFocus,
  error,
  placeholder,
}: TimeInputProps) {
  const [focused, setFocused] = useState(false);
  const [h = "", m = ""] = value ? value.split(":") : [];
  const empty = !h && !m;
  const showPlaceholder = empty && !focused && !!placeholder;

  const handleChange = (part: "h" | "m", raw: string) => {
    const num = parseInt(raw) || 0;
    const clamped = part === "h" ? Math.min(num, 23) : Math.min(num, 59);
    const padded = String(clamped).padStart(2, "0");
    onChange(
      part === "h" ? `${padded}:${m || "00"}` : `${h || "00"}:${padded}`,
    );
  };

  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };

  const inputClass =
    "w-7 bg-transparent text-sm text-center text-stone-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div
      className={`relative flex items-center rounded-lg border px-2 py-1.5 ${error ? "border-red-400 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500" : "border-stone-300 focus-within:border-stone-500 focus-within:ring-1 focus-within:ring-stone-500"}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      {showPlaceholder && (
        <span className="absolute inset-0 flex items-center px-2 text-sm text-stone-400 pointer-events-none">
          {placeholder}
        </span>
      )}
      <input
        type="number"
        min={0}
        max={23}
        value={h}
        onChange={(e) => handleChange("h", e.target.value)}
        onFocus={handleFocus}
        placeholder="00"
        className={`${inputClass} ${showPlaceholder ? "opacity-0" : ""}`}
      />
      <span
        className={`text-sm text-stone-400 ${showPlaceholder ? "opacity-0" : ""}`}
      >
        :
      </span>
      <input
        type="number"
        min={0}
        max={59}
        value={m}
        onChange={(e) => handleChange("m", e.target.value)}
        onFocus={handleFocus}
        placeholder="00"
        className={`${inputClass} ${showPlaceholder ? "opacity-0" : ""}`}
      />
    </div>
  );
}
