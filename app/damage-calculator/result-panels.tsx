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
    expected: "border-amber-400/30 bg-amber-400/5 text-amber-300",
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
