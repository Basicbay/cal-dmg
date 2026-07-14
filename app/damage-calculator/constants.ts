import type { Field, Stats } from "./types";

export const DEFAULT_STATS: Stats = {
  atk: 7000,
  skillMult: 283,
  hits: 1,
  armorPierce: 2300,
  shieldBreak: 900,
  accuracy: 0,
  classRestraint: 450,
  classRestraintPct: 15,
  elementalAtk: 2500,
  elementalPierce: 125,
  critical: 1800,
  critDmg: 183,
  skillEnhance: 25,
  defense: 3000,
  qiShield: 3500,
  classDefense: 3400,
  classDefensePct: 83,
  elementalResist: 400,
  critResist: 0,
  block: 1000,
  dmgReduction: 20,
  skillDmgReduction: 0,
  hp: 0,
};

export const ZERO_STATS = {
  ...Object.fromEntries(Object.keys(DEFAULT_STATS).map((key) => [key, 0])),
  hits: 1,
} as Stats;

export const DEFENSE_CONSTANT = 2860;
export const ELEMENTAL_CONSTANT = 530;
export const CRIT_CONSTANT = 1527;
export const BLOCK_CONSTANT = 3233;
export const BLOCKED_HIT_MULT = 0.5;

export const attackerFields: Field[] = [
  { key: "hits", label: "จำนวนครั้งโจมตี / Hit Count", hint: "จำนวนครั้งที่โจมตี / Number of hits", highlighted: true },
  { key: "skillMult", label: "ดาเมจสกิล / Damage Skill", hint: "เช่น 150 = 1.5x / e.g. 150 = 1.5x", suffix: "%", highlighted: true },
  { key: "atk", label: "โจมตี / ATK", hint: "ค่าโจมตีหลัก / Main attack stat" },
  { key: "armorPierce", label: "เจาะเกราะ / DEF Break", hint: "ลดค่าป้องกันแบบคงที่ / Flat DEF break" },
  { key: "shieldBreak", label: "ทำลายโล่ / Shield Break", hint: "ลดโล่พลังชี่แบบคงที่ / Flat shield break" },
  { key: "accuracy", label: "ความแม่นยำ / Hit", hint: "ลดโอกาสบล็อก / Reduces block chance" },
  { key: "classRestraint", label: "ข่มสำนัก / School Counter", hint: "ค่าสเตตัสคงที่ / Flat stat" },
  { key: "classRestraintPct", label: "ข่มสำนัก % / School Counter %", hint: "โบนัสเปอร์เซ็นต์ / Bonus %", suffix: "%" },
  { key: "elementalAtk", label: "โจมตีธาตุ / Elemental ATK", hint: "แหล่งดาเมจธาตุ / Elemental damage source" },
  { key: "elementalPierce", label: "เพิกเฉยต้านทานธาตุ / Elemental RES Pen.", hint: "ลดต้านทานธาตุแบบคงที่ / Flat elemental RES pen." },
  { key: "critical", label: "คริติคอล / CRIT", hint: "ซอฟต์แคป 1800 / Softcap 1800" },
  { key: "critDmg", label: "ดาเมจคริติคอล / CRIT DMG", hint: "เช่น 183 = 183% / e.g. 183 = 183%", suffix: "%" },
  { key: "skillEnhance", label: "เสริมพลังสกิล / Skill Enhancement", hint: "โบนัสบวกเพิ่ม / Additive bonus", suffix: "%" },
];

export const defenderFields: Field[] = [
  { key: "hp", label: "พลังชีวิต / HP", hint: "ค่าพลังชีวิตฝ่ายป้องกัน / Defender HP" },
  { key: "defense", label: "ป้องกัน / DEF", hint: "ค่าป้องกันดิบ / Raw DEF" },
  { key: "qiShield", label: "โล่พลังชี่ / Qi Shield", hint: "ดูดซับคงที่ต่อฮิต / Flat absorb per hit" },
  { key: "classDefense", label: "ป้องกันสำนัก / School DEF", hint: "ค่าสเตตัสคงที่ / Flat stat" },
  { key: "classDefensePct", label: "ป้องกันสำนัก % / School DEF %", hint: "โบนัสเปอร์เซ็นต์ / Bonus %", suffix: "%" },
  { key: "elementalResist", label: "ต้านทานธาตุ / Elemental RES", hint: "ค่าต้านทานธาตุดิบ / Raw elemental RES" },
  { key: "critResist", label: "ต้านทานคริติคอล / CRIT RES", hint: "ลดคริติคอลแบบคงที่ / Flat CRIT RES" },
  { key: "block", label: "บล็อก / Block", hint: "ค่าสเตตัสบล็อก / Block stat" },
  { key: "dmgReduction", label: "ลดดาเมจ / DMG Reduction", hint: "ลดดาเมจแบบบวกเพิ่ม / Additive reduction", suffix: "%" },
  { key: "skillDmgReduction", label: "ลดดาเมจจากสกิล / Skill DMG Reduction", hint: "ลดดาเมจสกิลแบบบวกเพิ่ม / Additive skill reduction", suffix: "%" },
];
