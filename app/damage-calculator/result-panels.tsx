import { BLOCKED_HIT_MULT } from "./constants";
import type { CalculationResult } from "./math";
import { clamp, compact, pct } from "./math";
import { SectionTitle } from "./section-title";
import type { Stats } from "./types";

function ResultCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: "normal" | "critical" | "blocked" | "expected";
}) {
  const toneClass = {
    normal: "border-white/10 text-slate-100",
    critical: "border-amber-400/25 text-amber-300",
    blocked: "border-purple-500/45 bg-purple-500/10 text-purple-400",
    expected: "border-orange-500/30 bg-orange-500/5 text-orange-400",
  }[tone];

  return (
    <article className={`rounded-lg border bg-[#1c1c21] p-4 text-center ${toneClass}`}>
      <h3 className="text-xs font-black uppercase tracking-[0.02em] text-slate-400">{title}</h3>
      <p className="mt-1 text-3xl font-black leading-none">{value}</p>
      <p className="mt-2 text-[11px] font-medium text-slate-600">{detail}</p>
    </article>
  );
}

function ProbabilityBar({
  title,
  value,
  detail,
  color,
}: {
  title: string;
  value: number;
  detail: string;
  color: "amber" | "purple";
}) {
  const colorClass =
    color === "amber" ? "bg-amber-400 text-amber-300" : "bg-purple-500 text-purple-400";

  return (
    <article className="rounded-lg border border-white/9 bg-[#1c1c21] p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-xs font-black uppercase tracking-[0.02em] text-slate-400">{title}</h3>
        <p className={`text-lg font-black ${colorClass.split(" ")[1]}`}>{pct(value)}</p>
      </div>
      <div className="h-2 rounded-full bg-black/55">
        <div
          className={`h-full rounded-full ${colorClass.split(" ")[0]}`}
          style={{ width: `${clamp(value * 100, 0, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-600">{detail}</p>
    </article>
  );
}

function HpDamageSimulator({
  result,
  stats,
}: {
  result: CalculationResult;
  stats: Stats;
}) {
  const hp = stats.hp;

  if (hp <= 0) {
    return (
      <article className="mt-4 rounded-lg border border-white/5 bg-[#17171a] p-4 text-center">
        <p className="text-xs font-bold text-slate-400">
          จำลองความเสียหายต่อหลอดเลือด
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          {"กรุณากรอกค่า \"พลังชีวิต / HP\" ฝ่ายป้องกันเพื่อแสดงแถบพลังชีวิตและหลอดดาเมจทับซ้อน"}
        </p>
      </article>
    );
  }

  // Calculate percentages relative to HP
  const pctNormal = (result.normalHit / hp) * 100;
  const pctBlocked = (result.blockedHit / hp) * 100;
  const pctCrit = (result.criticalHit / hp) * 100;
  const pctExpected = (result.expectedTotal / hp) * 100;

  const rawBars = [
    {
      key: "blocked",
      label: "โดนบล็อก",
      value: result.blockedHit,
      pct: pctBlocked,
      clampedPct: Math.min(100, Math.max(0, pctBlocked)),
      bgClass: "bg-purple-500/80 border-r border-purple-300/30",
      textClass: "text-purple-400",
      dotClass: "bg-purple-500",
    },
    {
      key: "normal",
      label: "ตีปกติ",
      value: result.normalHit,
      pct: pctNormal,
      clampedPct: Math.min(100, Math.max(0, pctNormal)),
      bgClass: "bg-slate-400/80 border-r border-slate-200/30",
      textClass: "text-slate-300",
      dotClass: "bg-slate-400",
    },
    {
      key: "critical",
      label: "ติดคริติคอล",
      value: result.criticalHit,
      pct: pctCrit,
      clampedPct: Math.min(100, Math.max(0, pctCrit)),
      bgClass: "bg-amber-400/80 border-r border-amber-300/30",
      textClass: "text-amber-300",
      dotClass: "bg-amber-400",
    },
    {
      key: "expected",
      label: "ดาเมจคาดหวัง",
      value: result.expectedTotal,
      pct: pctExpected,
      clampedPct: Math.min(100, Math.max(0, pctExpected)),
      bgClass: "bg-orange-600/80 border-r border-orange-500/30",
      textClass: "text-orange-400",
      dotClass: "bg-orange-600",
    },
  ];

  // Sort by percentage descending so that smaller widths render on top of larger ones
  const sortedBars = [...rawBars].sort((a, b) => b.clampedPct - a.clampedPct);

  return (
    <article className="mt-4 rounded-lg border border-white/10 bg-[#1c1c21] p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-xs font-black uppercase tracking-[0.02em] text-slate-400">
          จำลองความเสียหายต่อหลอดเลือด
        </h3>
        <span className="text-xs font-bold text-slate-300">
          HP: {hp.toLocaleString()}
        </span>
      </div>

      {/* Health Bar Container */}
      <div className="relative h-7 w-full rounded-md bg-red-950/20 border border-red-900/30 overflow-hidden shadow-inner flex items-center">
        {/* Empty HP bar background pattern or text */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/20 to-red-900/10" />
        
        {/* Overlay damage bars */}
        {sortedBars.map((bar, index) => {
          if (bar.clampedPct <= 0) return null;
          return (
            <div
              key={bar.key}
              className={`absolute left-0 top-0 h-full rounded-l transition-all duration-500 ${bar.bgClass} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`}
              style={{
                width: `${bar.clampedPct}%`,
                zIndex: 10 + index,
              }}
            />
          );
        })}

        {/* Text inside the bar */}
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            หลอดพลังชีวิตเป้าหมาย
          </span>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="mt-4 grid grid-cols-4 gap-1.5 sm:gap-2">
        {rawBars.map((bar) => {
          const isOver = bar.value > hp;
          return (
            <div key={bar.key} className="flex flex-col items-start gap-1 text-[10px] sm:text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${bar.dotClass}`} />
                <span className="text-slate-400 truncate max-w-[70px] sm:max-w-none">{bar.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-0.5 leading-tight">
                <span className={bar.textClass}>
                  {compact(bar.value)} ({bar.pct.toFixed(0)}%)
                </span>
                {isOver && (
                  <span className="text-[8px] font-black uppercase text-red-400 bg-red-950/40 px-1 py-0.5 rounded leading-none border border-red-500/20">
                    เกินหลอด
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function HitResults({
  result,
  stats,
}: {
  result: CalculationResult;
  stats: Stats;
}) {
  return (
    <section>
      <SectionTitle>การคำนวณ / Calculation</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <ResultCard
          title="ตีปกติ / Normal Hit"
          value={compact(result.normalHit)}
          detail="Base damage per hit"
          tone="normal"
        />
        <ResultCard
          title="ติดคริติคอล / CRIT Hit"
          value={compact(result.criticalHit)}
          detail={`CRIT DMG ${Math.round(stats.critDmg)}%`}
          tone="critical"
        />
        <ResultCard
          title="โดนบล็อก / Blocked Hit"
          value={compact(result.blockedHit)}
          detail={`Block ลด ${Math.round((1 - BLOCKED_HIT_MULT) * 100)}%`}
          tone="blocked"
        />
        <ResultCard
          title="ดาเมจคาดหวัง / Expected Total"
          value={compact(result.expectedTotal)}
          detail={`${Math.max(1, stats.hits)} hits · crit weighted`}
          tone="expected"
        />
      </div>

      <HpDamageSimulator result={result} stats={stats} />
    </section>
  );
}

export function Probabilities({
  result,
  stats,
}: {
  result: CalculationResult;
  stats: Stats;
}) {
  return (
    <section>
      <SectionTitle>โอกาสเกิดผล / Probabilities</SectionTitle>
      <div className="grid gap-3">
        <ProbabilityBar
          title="โอกาสคริติคอล / CRIT Chance"
          value={result.critChance}
          detail={`CRIT สุทธิ ${compact(result.effectiveCrit)} · CRIT RES ${compact(stats.critResist)}`}
          color="amber"
        />
        <ProbabilityBar
          title="โอกาสบล็อก / Block Chance"
          value={result.blockChance}
          detail={`Block สุทธิ ${compact(result.netBlock)} · Hit ${compact(stats.accuracy)}`}
          color="purple"
        />
      </div>
    </section>
  );
}
