import {
  BLOCK_CONSTANT,
  BLOCKED_HIT_MULT,
  CRIT_CONSTANT,
  DEFENSE_CONSTANT,
  ELEMENTAL_CONSTANT,
} from "./constants";
import type { Stats } from "./types";

export function clamp(value: number, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(max, Math.max(min, value));
}

export function compact(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

export function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function calculateRemainingQiShield(qiShield: number, shieldBreak: number) {
  const shield = clamp(qiShield);
  const pierce = clamp(shieldBreak);

  if (pierce >= shield) return 0;
  if (pierce * 3 >= shield) return (shield - pierce) * 0.5;
  return clamp(shield - pierce * 2);
}

export function calculate(stats: Stats) {
  const netDefense = clamp(stats.defense - stats.armorPierce);
  const defenseReduction = netDefense / (netDefense + DEFENSE_CONSTANT);

  const remainingQiShield = calculateRemainingQiShield(stats.qiShield, stats.shieldBreak);
  const restraintTotal = stats.classRestraint * (1 + stats.classRestraintPct / 100);
  const classDefenseTotal = stats.classDefense * (1 + stats.classDefensePct / 100);
  const physicalStatTerm = stats.atk - remainingQiShield + restraintTotal - classDefenseTotal;
  const physicalDamage = clamp(physicalStatTerm) * (1 - defenseReduction);

  const netElementalResist = clamp(stats.elementalResist - stats.elementalPierce);
  const elementalReduction = netElementalResist / (netElementalResist + ELEMENTAL_CONSTANT);
  const elementalDamage = stats.elementalAtk * (1 - elementalReduction);
  const afterElemental = (physicalDamage + elementalDamage) * (stats.skillMult / 100);

  const finalMultiplier = clamp(
    1 + (stats.skillEnhance - stats.dmgReduction - stats.skillDmgReduction) / 100,
  );
  const normalHit = afterElemental * finalMultiplier;
  const criticalHit = normalHit * (stats.critDmg / 100);
  const blockedHit = normalHit * BLOCKED_HIT_MULT;

  const effectiveCrit = clamp(stats.critical - stats.critResist);
  const critChance = effectiveCrit / (effectiveCrit + CRIT_CONSTANT);
  const netBlock = clamp(stats.block - stats.accuracy);
  const blockChance = netBlock / (netBlock + BLOCK_CONSTANT);
  const expectedPerHit =
    normalHit * (1 - critChance) * (1 - blockChance) +
    criticalHit * critChance * (1 - blockChance) +
    blockedHit * blockChance;
  const expectedTotal = expectedPerHit * Math.max(1, stats.hits);

  return {
    netDefense,
    defenseReduction,
    remainingQiShield,
    restraintTotal,
    classDefenseTotal,
    physicalStatTerm,
    physicalDamage,
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

export type CalculationResult = ReturnType<typeof calculate>;
