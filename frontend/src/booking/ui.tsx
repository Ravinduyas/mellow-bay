import React from 'react';
import { Minus, Plus } from 'lucide-react';

/** Shared controls for the booking and admin screens. */

export const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <label className="block space-y-2">
    <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
      {label}
    </span>
    {children}
    {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
  </label>
);

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-ink ' +
  'outline-none transition-colors focus:border-ink placeholder:text-slate-300';

/** The chart's "+ / − / 0" counter, used for people, seats and admin prices. */
export const Counter: React.FC<{
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Rendered after the number — "€" or "%" on the admin screen. */
  suffix?: string;
  label: string;
}> = ({ value, onChange, min = 0, max = 99, step = 1, suffix, label }) => {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <span className="min-w-[3ch] text-center text-xs font-medium tabular-nums text-ink">
        {value}
        {suffix}
      </span>

      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

/** A row of mutually exclusive cards. */
export function ChoiceGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: T; title: string; detail?: string }[];
  value: T;
  onChange: (next: T) => void;
  columns?: 1 | 2 | 3 | 4;
}) {
  const cols = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' };
  return (
    <div role="radiogroup" className={`grid grid-cols-1 gap-2.5 ${cols[columns]}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-[16px] border p-4 text-left transition-colors cursor-pointer ${
              active
                ? 'border-ink bg-ink text-white'
                : 'border-slate-200 bg-white text-ink hover:border-slate-300'
            }`}
          >
            <span className="block text-[13px] font-medium leading-snug">{opt.title}</span>
            {opt.detail && (
              <span
                className={`mt-1 block text-[10.5px] leading-relaxed ${
                  active ? 'text-white/60' : 'text-slate-500'
                }`}
              >
                {opt.detail}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Small inline segmented control, for two or three tight options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-slate-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
            opt.value === value ? 'bg-ink text-white' : 'text-slate-600 hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
