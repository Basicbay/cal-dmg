import type { CalculationResult } from "./math";
import { compact, pct } from "./math";
import { SectionTitle } from "./section-title";
import type { Stats } from "./types";

function FlowCard({
  step,
  title,
  value,
  detail,
  showDetail = false,
}: {
  step: string;
  title: string;
  value: string;
  detail?: React.ReactNode;
  showDetail?: boolean;
}) {
  const accentClass = "bg-white text-black";

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
      {showDetail ? (
        <div className="mt-2 space-y-1 break-words text-[11px] font-medium leading-5 text-slate-600">
          {detail}
        </div>
      ) : null}
    </article>
  );
}

export function DamageFlow({
  result,
  showFormulas,
  stats,
  onToggleFormulas,
}: {
  result: CalculationResult;
  showFormulas: boolean;
  stats: Stats;
  onToggleFormulas: () => void;
}) {
  const qiShieldRule =
    stats.shieldBreak >= stats.qiShield
      ? "ทำลายโล่ถึงค่าโล่พลังชี่ จึงเหลือ 0"
      : stats.shieldBreak * 3 >= stats.qiShield
        ? "ทำลายโล่เข้าเงื่อนไขกลาง จึงคิดโล่พลังชี่หลังหักครึ่งหนึ่ง"
        : "ทำลายโล่น้อย จึงหักโล่แบบ 2 เท่า";

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle>ลำดับคำนวณดาเมจ / Damage Flow</SectionTitle>
        <button
          aria-pressed={showFormulas}
          className="h-9 rounded-md border border-white/10 px-4 text-xs font-bold text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
          type="button"
          onClick={onToggleFormulas}
        >
          {showFormulas ? "ซ่อนสูตร / Hide Formula" : "แสดงสูตร / Show Formula"}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <FlowCard
          step="1"
          title="โล่พลังชี่คงเหลือ / Qi Shield"
          value={compact(result.remainingQiShield)}
          showDetail={showFormulas}
          detail={
            <>
              <p>โล่พลังชี่ {compact(stats.qiShield)} - ทำลายโล่ {compact(stats.shieldBreak)}</p>
              <p>{qiShieldRule}</p>
              <p>
                <span className="font-bold text-slate-400">= โล่พลังชี่คงเหลือ {compact(result.remainingQiShield)}</span>
              </p>
            </>
          }
        />
        <FlowCard
          step="2"
          title="โจมตีสุทธิ / Net ATK"
          value={compact(result.physicalStatTerm)}
          showDetail={showFormulas}
          detail={
            <>
              <p>ข่มสำนัก {compact(stats.classRestraint)} + โบนัส {stats.classRestraintPct}% = ข่มสำนักสุทธิ {compact(result.restraintTotal)}</p>
              <p>ป้องกันสำนัก {compact(stats.classDefense)} + โบนัส {stats.classDefensePct}% = ป้องกันสำนักสุทธิ {compact(result.classDefenseTotal)}</p>
              <p>โจมตี {compact(stats.atk)} - โล่พลังชี่คงเหลือ {compact(result.remainingQiShield)} + ข่มสำนักสุทธิ {compact(result.restraintTotal)} - ป้องกันสำนักสุทธิ {compact(result.classDefenseTotal)}</p>
              <p>
                <span className="font-bold text-slate-400">= โจมตีสุทธิ {compact(result.physicalStatTerm)}</span>
              </p>
            </>
          }
        />
        <FlowCard
          step="3"
          title="ดาเมจหลัง DEF / After DEF"
          value={compact(result.physicalDamage)}
          showDetail={showFormulas}
          detail={
            <>
              <p>ป้องกัน {compact(stats.defense)} - เจาะเกราะ {compact(stats.armorPierce)} = DEF สุทธิ {compact(result.netDefense)}</p>
              <p>DEF สุทธิ {compact(result.netDefense)} ทำให้ดาเมจผ่านได้ {pct(1 - result.defenseReduction)}</p>
              <p>โจมตีสุทธิ {compact(result.physicalStatTerm)} x {pct(1 - result.defenseReduction)}</p>
              <p>
                <span className="font-bold text-slate-400">= ดาเมจหลัง DEF {compact(result.physicalDamage)}</span>
              </p>
            </>
          }
        />
        <FlowCard
          step="4"
          title="รวมโจมตีธาตุ และสกิล / Element + Skill"
          value={compact(result.afterElemental)}
          showDetail={showFormulas}
          detail={
            <>
              <p>ต้านทานธาตุ {compact(stats.elementalResist)} - เพิกเฉยต้านทานธาตุ {compact(stats.elementalPierce)} = ต้านทานธาตุสุทธิ {compact(result.netElementalResist)}</p>
              <p>โจมตีธาตุ {compact(stats.elementalAtk)} x ผ่านต้าน {pct(1 - result.elementalReduction)} = ดาเมจธาตุสุทธิ {compact(result.elementalDamage)}</p>
              <p>ดาเมจ DEF {compact(result.physicalDamage)} + ดาเมจธาตุสุทธิ {compact(result.elementalDamage)} x ดาเมจสกิล {stats.skillMult}%</p>
              <p>
                <span className="font-bold text-slate-400">= ดาเมจก่อนโบนัส {compact(result.afterElemental)}</span>
              </p>
            </>
          }
        />
        <FlowCard
          step="5"
          title="ดาเมจตีปกติ / Normal Hit"
          value={compact(result.normalHit)}
          showDetail={showFormulas}
          detail={
            <>
              <p>
                โบนัสรวม 100% + เสริมพลังสกิล {stats.skillEnhance}% - ลดดาเมจ {stats.dmgReduction}% -
                ลดดาเมจจากสกิล {stats.skillDmgReduction}% = {pct(result.finalMultiplier)}
              </p>
              <p>ดาเมจก่อนโบนัส {compact(result.afterElemental)} x โบนัสรวม {pct(result.finalMultiplier)}</p>
              <p>
                <span className="font-bold text-slate-400">= ดาเมจตีปกติ {compact(result.normalHit)}</span>
              </p>
            </>
          }
        />
      </div>
    </section>
  );
}
