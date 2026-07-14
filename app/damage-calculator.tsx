"use client";

import { useMemo, useState } from "react";

import {
  attackerFields,
  defenderFields,
  ZERO_STATS,
} from "./damage-calculator/constants";
import { DamageFlow } from "./damage-calculator/damage-flow";
import { InputPanel } from "./damage-calculator/form-panels";
import { calculate } from "./damage-calculator/math";
import { OcrImportPanel } from "./damage-calculator/ocr-import-panel";
import { HitResults, Probabilities } from "./damage-calculator/result-panels";
import type { Stats } from "./damage-calculator/types";

export default function DamageCalculator() {
  const [stats, setStats] = useState<Stats>(ZERO_STATS);
  const [showFormulas, setShowFormulas] = useState(false);
  const result = useMemo(() => calculate(stats), [stats]);

  function updateStat(key: keyof Stats, value: number) {
    let finalValue = Number.isFinite(value) ? value : 0;
    if ((key === "dmgReduction" || key === "skillDmgReduction") && finalValue < 0) {
      finalValue = Math.abs(finalValue);
    }
    setStats((current) => ({
      ...current,
      [key]: finalValue,
    }));
  }

  function applyStats(updates: Partial<Stats>) {
    const processedUpdates = { ...updates };
    if (processedUpdates.dmgReduction !== undefined && processedUpdates.dmgReduction < 0) {
      processedUpdates.dmgReduction = Math.abs(processedUpdates.dmgReduction);
    }
    if (processedUpdates.skillDmgReduction !== undefined && processedUpdates.skillDmgReduction < 0) {
      processedUpdates.skillDmgReduction = Math.abs(processedUpdates.skillDmgReduction);
    }
    setStats((current) => ({
      ...current,
      ...processedUpdates,
    }));
  }

  return (
    <main className="min-h-dvh bg-[#0f0f12] text-slate-100">
      <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-4 border-b border-white/7 bg-[#111116]/95 px-4 py-3 backdrop-blur sm:px-7">
        <div>
          <h1 className="text-base font-black uppercase tracking-[0.02em] text-slate-100">
            Sword of Justice Test 
          </h1>
          <p className="text-[11px] font-semibold text-slate-600">
            Reference formula model
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            className="h-9 rounded-md border border-white/15 px-4 text-xs font-bold text-slate-200 transition hover:border-white/40 hover:bg-white/5 hover:text-white"
            type="button"
            onClick={() => setStats(ZERO_STATS)}
          >
            ล้างค่า / Clear
          </button>
        </div>
      </header>

      <div className="grid gap-5 p-4 sm:p-7 xl:grid-cols-[minmax(0,2fr)_minmax(360px,0.95fr)]">
        <div className="grid gap-5 xl:grid-cols-2 xl:grid-rows-[auto_1fr] xl:items-stretch">
          <OcrImportPanel
            side="attacker"
            title="OCR ฝ่ายโจมตี / Attacker OCR"
            onApply={applyStats}
          />
          <OcrImportPanel
            side="defender"
            title="OCR ฝ่ายป้องกัน / Defender OCR"
            onApply={applyStats}
          />
          <InputPanel
            tone="attacker"
            title="ฝ่ายโจมตี / Attacker"
            fields={attackerFields}
            stats={stats}
            onChange={updateStat}
          />
          <InputPanel
            tone="defender"
            title="ฝ่ายป้องกัน / Defender"
            fields={defenderFields}
            stats={stats}
            onChange={updateStat}
          />
        </div>

        <aside className="grid content-start gap-5">
          <HitResults result={result} stats={stats} />
          <DamageFlow
            result={result}
            stats={stats}
            showFormulas={showFormulas}
            onToggleFormulas={() => setShowFormulas((current) => !current)}
          />
          <Probabilities result={result} stats={stats} />
        </aside>
      </div>
    </main>
  );
}
