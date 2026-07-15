import { useState } from "react";
import type { Field, Stats, AttackerProfile, DefenderProfile } from "./types";
import { defenderPresets } from "./constants";


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
  onApplyStats,
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onDeleteTab,
}: {
  tone: "attacker" | "defender";
  title: string;
  fields: Field[];
  stats: Stats;
  onChange: (key: keyof Stats, value: number) => void;
  onApplyStats?: (updates: Partial<Stats>) => void;
  tabs?: { id: string; name: string; isFixed?: boolean }[];
  activeTabId?: string;
  onSelectTab?: (id: string) => void;
  onAddTab?: () => void;
  onRenameTab?: (id: string, name: string) => void;
  onDeleteTab?: (id: string) => void;
}) {
  const theme =
    tone === "attacker"
      ? {
          panel: "border-sky-400/70 bg-[#1c1c21]",
          header: "border-sky-400/45 bg-sky-500/20 text-sky-200",
          tabBorder: "border-sky-400/20 bg-black/20",
          tabTitle: "text-sky-400",
          tabActive: "bg-sky-500/20 text-sky-200 border-sky-400/50 shadow-sky-500/5",
          tabHover: "bg-black/35 text-slate-400 border-white/5 hover:bg-black/55 hover:text-slate-200 hover:border-white/10",
          tabBtnBorder: "border-sky-400/40 hover:border-sky-400 bg-sky-500/5 hover:bg-sky-500/10 text-sky-300",
          label: "เซฟโปรไฟล์โจมตี / Save Profiles",
          sublabel: "เซฟลง localhost อัตโนมัติ / Autosaved",
          inputFocus: "border-sky-400",
          editBtn: "hover:text-sky-300",
        }
      : {
          panel: "border-red-500/70 bg-[#1c1c21]",
          header: "border-red-500/45 bg-red-500/20 text-red-200",
          tabBorder: "border-red-500/20 bg-black/20",
          tabTitle: "text-red-400",
          tabActive: "bg-red-500/20 text-red-200 border-red-400/50 shadow-red-500/5",
          tabHover: "bg-black/35 text-slate-400 border-white/5 hover:bg-black/55 hover:text-slate-200 hover:border-white/10",
          tabBtnBorder: "border-red-400/40 hover:border-red-400 bg-red-500/5 hover:bg-red-500/10 text-red-300",
          label: "เซฟโปรไฟล์ป้องกัน / Save Profiles",
          sublabel: "เซฟลง localhost อัตโนมัติ / Autosaved",
          inputFocus: "border-red-400",
          editBtn: "hover:text-red-300",
        };

  const [isEditingTabId, setIsEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleStartRename = (id: string, currentName: string) => {
    setIsEditingTabId(id);
    setEditingName(currentName);
  };

  const handleFinishRename = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onRenameTab?.(id, trimmed);
    }
    setIsEditingTabId(null);
  };

  return (
    <section className={`h-full overflow-hidden rounded-lg border ${theme.panel}`}>
      <h2
        className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 text-sm font-black uppercase tracking-[0.02em] ${theme.header}`}
      >
        <span>{title}</span>
        {tone === "defender" && !tabs && onApplyStats && (
          <div className="flex items-center gap-1.5 normal-case font-bold text-red-300/80">
            <span className="text-[10px] tracking-wide">ตัวอย่าง / Presets:</span>
            <button
              type="button"
              onClick={() => onApplyStats(defenderPresets.dps)}
              className="rounded bg-red-500/20 px-2.5 py-1 text-xs font-black text-red-300 transition-all duration-200 hover:bg-red-500/40 hover:text-white active:scale-95 border border-red-500/30 cursor-pointer"
            >
              DPS
            </button>
            <button
              type="button"
              onClick={() => onApplyStats(defenderPresets.tank)}
              className="rounded bg-red-500/20 px-2.5 py-1 text-xs font-black text-red-300 transition-all duration-200 hover:bg-red-500/40 hover:text-white active:scale-95 border border-red-500/30 cursor-pointer"
            >
              Tank
            </button>
          </div>
        )}
      </h2>

      {tabs && (
        <div className={`flex flex-col border-b ${theme.tabBorder}`}>
          {/* <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/5 bg-white/5">
            <span className={`text-[10px] font-black uppercase tracking-[0.05em] ${theme.tabTitle}`}>
              {theme.label}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold italic">
              {theme.sublabel}
            </span>  
          </div> */}
          <div className="flex items-center gap-2 overflow-x-auto p-3 scrollbar-thin">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  className={`group relative flex items-center gap-2 rounded px-3 py-1.5 text-xs font-black transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? theme.tabActive
                      : theme.tabHover
                  }`}
                  onClick={() => onSelectTab?.(tab.id)}
                >
                  {isEditingTabId === tab.id ? (
                    <input
                      type="text"
                      className={`bg-black/80 text-white px-2 py-0.5 rounded border focus:outline-none w-32 text-xs font-black ${theme.inputFocus}`}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleFinishRename(tab.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFinishRename(tab.id);
                        if (e.key === "Escape") setIsEditingTabId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span 
                      onDoubleClick={(e) => {
                        if (tab.isFixed) return;
                        e.stopPropagation();
                        handleStartRename(tab.id, tab.name);
                      }}
                      className="truncate max-w-[120px]"
                      title={tab.isFixed ? undefined : "ดับเบิ้ลคลิกเพื่อแก้ไขชื่อ / Double click to edit name"}
                    >
                      {tab.name}
                    </span>
                  )}

                  {/* Edit Icon */}
                  {isActive && !tab.isFixed && isEditingTabId !== tab.id && (
                    <button
                      type="button"
                      className={`text-slate-500 transition-colors p-0.5 cursor-pointer ${theme.editBtn}`}
                      title="เปลี่ยนชื่อ / Rename"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(tab.id, tab.name);
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}

                  {/* Delete Icon */}
                  {!tab.isFixed && (
                    <button
                      type="button"
                      className="text-slate-500 hover:text-red-400 transition-colors p-0.5 cursor-pointer ml-0.5 opacity-60 group-hover:opacity-100"
                      title="ลบโปรไฟล์ / Delete profile"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`ต้องการลบโปรไฟล์ "${tab.name}" หรือไม่?`)) {
                          onDeleteTab?.(tab.id);
                        }
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add Tab Button */}
            <button
              type="button"
              className={`flex items-center justify-center rounded border border-dashed px-3 py-1.5 text-xs font-black transition-all duration-200 cursor-pointer shrink-0 ${theme.tabBtnBorder}`}
              onClick={onAddTab}
              title="เพิ่มโปรไฟล์ / Add Profile"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              เพิ่ม / Add
            </button>
          </div>
        </div>
      )}

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
