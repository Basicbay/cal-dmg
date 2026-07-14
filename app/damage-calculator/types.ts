export type Stats = {
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
  critDefense: number;
  block: number;
  dmgReduction: number;
  skillDmgReduction: number;
  hp: number;
};

export type Field = {
  key: keyof Stats;
  label: string;
  hint: string;
  suffix?: string;
  highlighted?: boolean;
};
