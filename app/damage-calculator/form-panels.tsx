import { useState } from "react";
import type { Field, Stats } from "./types";

function NumberInput({
  field,
  value,
  onChange,
  tone,
}: {
  field: Field;
  value: number;
  onChange: (value: number) => void;
  tone: "attacker" | "defender";
}) {
  const hasInputSuffix = field.suffix === "%";
  const [prevValue, setPrevValue] = useState(value);
  const [inputValue, setInputValue] = useState(value.toString());

  if (value !== prevValue) {
    setPrevValue(value);
    const currentParsed = Number(inputValue);
    const isTempTypingState = (inputValue === "-" || inputValue === "" || inputValue === ".") && value === 0;
    if (currentParsed !== value && !isTempTypingState) {
      setInputValue(value.toString());
    }
  }

  function handleChange(rawValue: string) {
    setInputValue(rawValue);

    if (rawValue === "" || rawValue === "-" || rawValue === ".") {
      onChange(0);
      return;
    }

    const parsedValue = Number(rawValue);
    if (Number.isFinite(parsedValue)) {
      onChange(parsedValue);
    }
  }

  function handleBlur() {
    const parsedValue = Number(inputValue);
    if (Number.isFinite(parsedValue)) {
      setInputValue(parsedValue.toString());
    } else {
      setInputValue("0");
      onChange(0);
    }
  }

  // Visual enhancements for highlighted fields
  let labelColor = "text-slate-300";
  let inputBorder = "border-white/10 bg-black/25";
  let inputFocus = "focus:border-amber-400/60 focus:bg-black/35";

  if (field.highlighted) {
    if (tone === "attacker") {
      labelColor = "text-sky-300 font-extrabold";
      inputBorder = "border-sky-400/40 bg-sky-950/20";
      inputFocus = "focus:border-sky-400 focus:bg-sky-950/40 focus:ring-1 focus:ring-sky-400/30";
    } else {
      labelColor = "text-red-300 font-extrabold";
      inputBorder = "border-red-400/40 bg-red-950/20";
      inputFocus = "focus:border-red-400 focus:bg-red-950/40 focus:ring-1 focus:ring-red-400/30";
    }
  }

  return (
    <label className="grid gap-1.5">
      <span className="flex items-center justify-between gap-3 text-xs font-bold">
        <span className={labelColor}>{field.label}</span>
      </span>
      <span className="relative">
        <input
          className={`h-10 w-full rounded-md border px-3 text-sm font-bold text-slate-100 outline-none transition ${inputBorder} ${inputFocus} ${
            hasInputSuffix ? "pr-8" : ""
          }`}
          inputMode="decimal"
          type="text"
          value={inputValue}
          onBlur={handleBlur}
          onFocus={(event) => event.target.select()}
          onChange={(event) => handleChange(event.target.value)}
          onDragStart={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
        />
        {hasInputSuffix ? (
          <span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-black ${
            field.highlighted 
              ? (tone === "attacker" ? "text-sky-400" : "text-red-400")
              : "text-slate-500"
          }`}>
            %
          </span>
        ) : null}
      </span>
      <span className={`text-[11px] font-medium ${field.highlighted ? "text-slate-500" : "text-slate-600"}`}>{field.hint}</span>
    </label>
  );
}

export function InputPanel({
  tone,
  title,
  fields,
  stats,
  onChange,
}: {
  tone: "attacker" | "defender";
  title: string;
  fields: Field[];
  stats: Stats;
  onChange: (key: keyof Stats, value: number) => void;
}) {
  const theme =
    tone === "attacker"
      ? {
          panel: "border-sky-400/70 bg-[#1c1c21]",
          header: "border-sky-400/45 bg-sky-500/20 text-sky-200",
        }
      : {
          panel: "border-red-500/70 bg-[#1c1c21]",
          header: "border-red-500/45 bg-red-500/20 text-red-200",
        };

  return (
    <section className={`h-full overflow-hidden rounded-lg border ${theme.panel}`}>
      <h2
        className={`border-b px-4 py-4 text-sm font-black uppercase tracking-[0.02em] ${theme.header}`}
      >
        {title}
      </h2>
      <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {fields.map((field) => (
          <NumberInput
            field={field}
            key={field.key}
            value={stats[field.key]}
            onChange={(value) => onChange(field.key, value)}
            tone={tone}
          />
        ))}
      </div>
    </section>
  );
}
