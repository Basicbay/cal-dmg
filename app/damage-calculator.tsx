"use client";

import { useMemo, useState } from "react";

type Stats = {
  atk: number;
  skillMult: number;
  hits: number;
  armorPierce: number;
  shieldBreak: number;
  accuracy: number;
  classRestraint: number;
  classRestraintPct: number;
  elementalAtk: number;
  elementalPierce: number;
  critical: number;
  critDmg: number;
  skillEnhance: number;
  defense: number;
  qiShield: number;
  classDefense: number;
  classDefensePct: number;
  elementalResist: number;
  critResist: number;
  block: number;
  dmgReduction: number;
};

type Field = {
  key: keyof Stats;
  label: string;
  hint: string;
  suffix?: string;
};

const DEFAULT_STATS: Stats = {
  atk: 7000,
  skillMult: 283,
  hits: 1,
  armorPierce: 2300,
  shieldBreak: 900,
  accuracy: 900,
  classRestraint: 450,
  classRestraintPct: 15,
  elementalAtk: 2500,
  elementalPierce: 125,
  critical: 1800,
  critDmg: 183,
  skillEnhance: 25,
  defense: 5300,
  qiShield: 3500,
  classDefense: 3400,
  classDefensePct: 83,
  elementalResist: 400,
  critResist: 0,
  block: 1000,
  dmgReduction: 20,
};

const ZERO_STATS = Object.fromEntries(
  Object.keys(DEFAULT_STATS).map((key) => [key, 0]),
) as Stats;

const DEFENSE_CONSTANT = 2850;
const CLASS_CONSTANT = 4905;
const ELEMENTAL_CONSTANT = 800;
const CRIT_CONSTANT = 1527;
const BLOCK_CONSTANT = 3233;
const BLOCKED_HIT_MULT = 0.5;

const attackerFields: Field[] = [
  { key: "atk", label: "พลังโจมตี / ATK", hint: "ค่าโจมตีเฉลี่ย / Average ATK" },
  { key: "skillMult", label: "ตัวคูณสกิล / Skill Mult", hint: "เช่น 150 = 1.5x / e.g. 150 = 1.5x", suffix: "%" },
  { key: "hits", label: "จำนวนฮิต / Hits", hint: "จำนวนครั้งที่โจมตี / Number of hits" },
  { key: "armorPierce", label: "เจาะเกราะ / Armor Pierce", hint: "ลดพลังป้องกันแบบคงที่ / Flat defense pierce" },
  { key: "shieldBreak", label: "ทำลายโล่ / Shield Break", hint: "ลดโล่ชี่แบบคงที่ / Flat shield break" },
  { key: "accuracy", label: "ความแม่นยำ / Accuracy", hint: "ลดโอกาสบล็อก / Reduces block chance" },
  { key: "classRestraint", label: "ข่มสายอาชีพ / Class Restraint", hint: "ค่าสเตตัสคงที่ / Flat stat" },
  { key: "classRestraintPct", label: "ข่มสายอาชีพ % / Class Restraint %", hint: "โบนัสเปอร์เซ็นต์ / Bonus %", suffix: "%" },
  { key: "elementalAtk", label: "โจมตีธาตุ / Elemental ATK", hint: "แหล่งดาเมจธาตุ / Elemental damage source" },
  { key: "elementalPierce", label: "เจาะต้านธาตุ / Elemental Pierce", hint: "ลดต้านทานธาตุแบบคงที่ / Flat resist pierce" },
  { key: "critical", label: "คริติคอล / Critical", hint: "ซอฟต์แคป 1800 / Softcap 1800" },
  { key: "critDmg", label: "ดาเมจคริติคอล / Crit DMG", hint: "เช่น 183 = 183% / e.g. 183 = 183%", suffix: "%" },
  { key: "skillEnhance", label: "เสริมสกิล / Skill Enhance", hint: "โบนัสบวกเพิ่ม / Additive bonus", suffix: "%" },
];

const defenderFields: Field[] = [
  { key: "defense", label: "พลังป้องกัน / Defense", hint: "ค่าป้องกันดิบ / Raw defense" },
  { key: "qiShield", label: "โล่ชี่ / Qi Shield", hint: "ดูดซับคงที่ต่อฮิต / Flat absorb per hit" },
  { key: "classDefense", label: "ป้องกันสายอาชีพ / Class Defense", hint: "ค่าสเตตัสคงที่ / Flat stat" },
  { key: "classDefensePct", label: "ป้องกันสายอาชีพ % / Class Defense %", hint: "โบนัสเปอร์เซ็นต์ / Bonus %", suffix: "%" },
  { key: "elementalResist", label: "ต้านทานธาตุ / Elemental Resist", hint: "ค่าต้านทานธาตุดิบ / Raw elemental resist" },
  { key: "critResist", label: "ต้านคริติคอล / Crit Resist", hint: "ลดคริติคอลแบบคงที่ / Flat critical resist" },
  { key: "block", label: "บล็อก / Block", hint: "ค่าสเตตัสบล็อก / Block stat" },
  { key: "dmgReduction", label: "ลดดาเมจ / DMG Reduction", hint: "ลดดาเมจแบบบวกเพิ่ม / Additive reduction", suffix: "%" },
];

function clamp(value: number, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(max, Math.max(min, value));
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function compact(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);

  if (absolute >= 1000) {
    return `${sign}${(absolute / 1000).toFixed(1)}K`;
  }

  return `${sign}${Math.round(absolute).toLocaleString("en-US")}`;
}

function bilingualDetail(detail: string) {
  return detail
    .replaceAll("Â·", "·")
    .replaceAll("DEF Reduce", "ลดด้วย DEF / DEF Reduce")
    .replaceAll("Net DEF", "DEF สุทธิ / Net DEF")
    .replaceAll("Net Qi", "โล่สุทธิ / Net Qi")
    .replaceAll("Per Hit", "ต่อฮิต / Per Hit")
    .replaceAll("Mult", "ตัวคูณ / Mult")
    .replaceAll("Flat", "หักคงที่ / Flat")
    .replaceAll("+Ele ATK", "+โจมตีธาตุ / Ele ATK")
    .replaceAll("Ele Reduce", "ลดธาตุ / Ele Reduce")
    .replaceAll("Effective Crit", "คริติคอลสุทธิ / Effective Crit")
    .replaceAll("Resist", "ต้าน / Resist")
    .replaceAll("Conv", "แปลงค่า / Conv")
    .replaceAll("Net Block", "บล็อกสุทธิ / Net Block")
    .replaceAll("Accuracy", "แม่นยำ / Accuracy")
    .replaceAll("Base damage per hit", "ดาเมจพื้นฐานต่อฮิต / Base damage per hit")
    .replaceAll("crit mult", "ตัวคูณคริติคอล / crit mult")
    .replaceAll("block mult", "ตัวคูณบล็อก / block mult")
    .replaceAll("hits", "ฮิต / hits")
    .replaceAll("crit weighted", "ถ่วงน้ำหนักคริติคอล / crit weighted");
}

function calculate(stats: Stats) {
  const baseSkillDamage = stats.atk * (stats.skillMult / 100);
  const netDefense = clamp(stats.defense - stats.armorPierce);
  const defenseReduction = netDefense / (netDefense + DEFENSE_CONSTANT);
  const afterDefense = baseSkillDamage * (1 - defenseReduction);

  const netQiShield = clamp(stats.qiShield - stats.shieldBreak);
  const afterQiShield = clamp(afterDefense - netQiShield);

  const netClassDefense = clamp(stats.classDefense - stats.classRestraint);
  const classMultiplier = 1 - netClassDefense / (netClassDefense + CLASS_CONSTANT);
  const afterClass = afterQiShield * classMultiplier;

  const netElementalResist = clamp(stats.elementalResist - stats.elementalPierce);
  const elementalReduction = netElementalResist / (netElementalResist + ELEMENTAL_CONSTANT);
  const elementalDamage = stats.elementalAtk * (1 - elementalReduction);
  const afterElemental = afterClass + elementalDamage;

  const finalMultiplier = clamp(1 + (stats.skillEnhance - stats.dmgReduction) / 100);
  const normalHit = afterElemental * finalMultiplier;
  const criticalHit = normalHit * (stats.critDmg / 100);
  const blockedHit = normalHit * BLOCKED_HIT_MULT;

  const effectiveCrit = clamp(stats.critical - stats.critResist);
  const critChance = effectiveCrit / (effectiveCrit + CRIT_CONSTANT);
  const netBlock = clamp(stats.block - stats.accuracy);
  const blockChance = netBlock / (netBlock + BLOCK_CONSTANT);
  const expectedPerHit = normalHit * (1 - critChance) + criticalHit * critChance;
  const expectedTotal = expectedPerHit * clamp(stats.hits, 1);

  return {
    baseSkillDamage,
    netDefense,
    defenseReduction,
    afterDefense,
    netQiShield,
    afterQiShield,
    netClassDefense,
    classMultiplier,
    afterClass,
    netElementalResist,
    elementalReduction,
    elementalDamage,
    afterElemental,
    finalMultiplier,
    normalHit,
    criticalHit,
    blockedHit,
    effectiveCrit,
    critChance,
    netBlock,
    blockChance,
    expectedTotal,
  };
}

function StatInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: number;
  onChange: (key: keyof Stats, value: number) => void;
}) {
  return (
    <label className="group grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.02em] text-slate-400">
        {field.label}
      </span>
      <span className="relative">
        <input
          className="h-9 w-full rounded-md border border-white/8 bg-black/45 px-3 pr-8 text-sm font-bold text-slate-100 outline-none transition focus:border-amber-400/70 focus:bg-black/65 focus:ring-2 focus:ring-amber-400/15"
          inputMode="decimal"
          type="number"
          value={value}
          onChange={(event) => onChange(field.key, Number(event.target.value))}
        />
        {field.suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
            {field.suffix}
          </span>
        ) : null}
      </span>
      <span className="text-[10px] font-medium text-slate-600">{field.hint}</span>
    </label>
  );
}

function InputPanel({
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
  const toneClasses =
    tone === "attacker"
      ? "border-amber-400/10 from-amber-400/10 text-amber-400"
      : "border-red-400/10 from-red-500/10 text-red-400";

  return (
    <section
      className={`overflow-hidden rounded-lg border bg-[#1c1c21] shadow-2xl shadow-black/20 ${toneClasses}`}
    >
      <header className={`border-b border-white/7 bg-gradient-to-r to-transparent px-5 py-4 ${toneClasses}`}>
        <h2 className="text-xs font-black uppercase tracking-[0.04em]">{title}</h2>
      </header>
      <div className="grid gap-x-4 gap-y-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <StatInput
            field={field}
            key={field.key}
            value={stats[field.key]}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.04em] text-slate-400">
      <span className="text-slate-500">+</span>
      {children}
    </h2>
  );
}

function FlowCard({
  step,
  title,
  value,
  detail,
  accent = "amber",
}: {
  step: string;
  title: string;
  value: string;
  detail: string;
  accent?: "amber" | "blue" | "slate";
}) {
  const accentClass =
    accent === "blue"
      ? "text-sky-400 bg-sky-400/10"
      : accent === "slate"
        ? "text-slate-300 bg-slate-400/10"
        : "text-amber-400 bg-amber-400/10";

  return (
    <article className="rounded-lg border border-white/9 bg-[#121216] p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${accentClass}`}>
          {step}
        </span>
        <h3 className="text-[11px] font-black uppercase tracking-[0.02em] text-slate-400">
          {title}
        </h3>
      </div>
      <p className="text-2xl font-black leading-none text-slate-100">{value}</p>
      <p className="mt-2 text-[11px] font-medium text-slate-600">
        {bilingualDetail(detail)}
      </p>
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
  color: "amber" | "sky";
}) {
  const colorClass = color === "amber" ? "bg-amber-400 text-amber-300" : "bg-sky-400 text-sky-300";

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
      <p className="mt-2 text-[11px] font-medium text-slate-600">
        {bilingualDetail(detail)}
      </p>
    </article>
  );
}

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
    blocked: "border-sky-400/25 text-sky-400",
    expected: "border-amber-400/30 bg-amber-400/5 text-amber-400",
  }[tone];

  return (
    <article className={`rounded-lg border bg-[#1c1c21] p-6 text-center ${toneClass}`}>
      <h3 className="text-xs font-black uppercase tracking-[0.02em] text-slate-400">{title}</h3>
      <p className="mt-1 text-3xl font-black leading-none">{value}</p>
      <p className="mt-2 text-[11px] font-medium text-slate-600">
        {bilingualDetail(detail)}
      </p>
    </article>
  );
}

export default function DamageCalculator() {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const result = useMemo(() => calculate(stats), [stats]);

  function updateStat(key: keyof Stats, value: number) {
    setStats((current) => ({
      ...current,
      [key]: Number.isFinite(value) ? value : 0,
    }));
  }

  return (
    <main className="min-h-dvh bg-[#0f0f12] text-slate-100">
      <div className="flex min-h-dvh">
        <aside className="hidden w-64 shrink-0 border-r border-white/7 bg-[#1b1b20] lg:block">
          <div className="border-b border-white/7 px-6 py-5 text-lg font-black uppercase tracking-[0.04em] text-amber-400">
            TEST
          </div>
          <nav className="grid gap-2 p-4 text-sm font-bold text-slate-400">
            {[
              // "ภาพรวมกิลด์ / Guild Overview",
              // "ผลงาน / Performance",
              // "สงครามและปาร์ตี้ / Wars & Party",
              // "รายชื่อผู้เล่น / Player List",
            ].map((item) => (
              <span className="rounded-md px-4 py-3" key={item}>
                {item}
              </span>
            ))}
            <span className="rounded-md border border-amber-400/10 bg-amber-400/10 px-4 py-3 text-amber-400">
              เครื่องคิดดาเมจ / Calculator
            </span>
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-4 border-b border-white/7 bg-[#111116]/95 px-4 py-3 backdrop-blur sm:px-7">
            <div className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-md border border-amber-400/25 bg-amber-400/10 text-xs font-black text-amber-400">
                DC
              </span>
              <div>
                <h1 className="text-base font-black uppercase tracking-[0.02em] text-slate-100">
                  เครื่องคิดดาเมจ / Damage Calculator
                </h1>
                <p className="text-[11px] font-semibold text-slate-600">
                  โมเดลแพตช์ 12.3 / Patch 12.3 model
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className="h-9 rounded-md border border-red-400/20 px-4 text-xs font-bold text-red-300 transition hover:border-red-400/50 hover:bg-red-400/10"
                type="button"
                onClick={() => setStats(ZERO_STATS)}
              >
                ล้างค่า / Clear
              </button>
              <button
                className="h-9 rounded-md border border-white/10 px-4 text-xs font-bold text-slate-400 transition hover:border-amber-400/40 hover:text-amber-300"
                type="button"
                onClick={() => setStats(DEFAULT_STATS)}
              >
                รีเซ็ต / Reset
              </button>
            </div>
          </header>

          <div className="grid gap-6 p-4 sm:p-7">
            <div className="grid gap-5 xl:grid-cols-[1fr_1.03fr]">
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

            <section>
              <SectionTitle>ลำดับคำนวณดาเมจ / Damage Flow</SectionTitle>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <FlowCard
                  step="L1"
                  title="เทียบป้องกัน / VS Defense"
                  value={compact(result.afterDefense)}
                  detail={`DEF Reduce ${pct(result.defenseReduction)} · Net DEF ${compact(result.netDefense)}`}
                />
                <FlowCard
                  step="L2"
                  title="โล่ชี่ / Qi Shield"
                  value={compact(result.afterQiShield)}
                  detail={`Net Qi ${compact(result.netQiShield)} · Per Hit ${compact(result.afterQiShield)}`}
                />
                <FlowCard
                  step="L3"
                  title="สายอาชีพ / Class"
                  value={compact(result.afterClass)}
                  detail={`Mult ${result.classMultiplier.toFixed(4)} · Flat -${compact(result.netClassDefense)}`}
                />
                <FlowCard
                  step="L4"
                  title="ธาตุ / Elemental"
                  value={compact(result.afterElemental)}
                  detail={`+Ele ATK ${compact(result.elementalDamage)} · Ele Reduce ${pct(result.elementalReduction)}`}
                  accent="blue"
                />
                <FlowCard
                  step="L5"
                  title="สุดท้าย / Final"
                  value={compact(result.normalHit)}
                  detail={`Mult +${result.finalMultiplier.toFixed(3)} · Per Hit ${compact(result.normalHit)}`}
                />
              </div>
            </section>

            <section>
              <SectionTitle>โอกาสเกิดผล / Probabilities</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-2">
                <ProbabilityBar
                  title="โอกาสคริติคอล / Crit Chance"
                  value={result.critChance}
                  detail={`Effective Crit ${compact(result.effectiveCrit)} · Resist ${compact(stats.critResist)} · Conv 33.3%`}
                  color="amber"
                />
                <ProbabilityBar
                  title="โอกาสบล็อก / Block Chance"
                  value={result.blockChance}
                  detail={`Net Block ${compact(result.netBlock)} · Accuracy ${compact(stats.accuracy)} · Conv 33.3%`}
                  color="sky"
                />
              </div>
            </section>

            <section>
              <SectionTitle>ผลลัพธ์ต่อฮิต / Hit Results (Per Hit)</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ResultCard
                  title="ตีปกติ / Normal Hit"
                  value={compact(result.normalHit)}
                  detail="Base damage per hit"
                  tone="normal"
                />
                <ResultCard
                  title="ติดคริติคอล / Critical Hit"
                  value={compact(result.criticalHit)}
                  detail={`+${Math.round(stats.critDmg)}% crit mult`}
                  tone="critical"
                />
                <ResultCard
                  title="โดนบล็อก / Blocked Hit"
                  value={compact(result.blockedHit)}
                  detail={`-${Math.round((1 - BLOCKED_HIT_MULT) * 100)}% block mult`}
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
          </div>
        </section>
      </div>
    </main>
  );
}
