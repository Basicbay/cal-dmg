import { useEffect, useRef, useState } from "react";

import type { Stats } from "./types";

type OcrSide = "attacker" | "defender";

type OcrStatus = "idle" | "reading" | "done" | "error";

type StatMatch = {
  key: keyof Stats;
  value: number;
};

type ImagePreview = {
  id: string;
  name: string;
  url: string;
};

type StatSpec = {
  key: keyof Stats;
  aliases: string[];
  excludes?: string[];
  lineExcludes?: string[];
  valueMode?: "first" | "percent";
};

type OcrWorker = {
  recognize: (image: Blob | File) => Promise<{ data: { text: string } }>;
  setParameters: (params: Record<string, string | number>) => Promise<unknown>;
};

type PositionRegion = {
  key: keyof Stats;
  rect: [number, number, number, number];
  side: OcrSide;
  valueMode?: StatSpec["valueMode"];
};

type PositionTemplate = {
  maxAspect: number;
  minAspect: number;
  name: string;
  regions: PositionRegion[];
  requiredKeys?: Array<keyof Stats>;
};

const MAX_FILES = 3;
const POSITION_OCR_CHARS = "0123456789.,-/%";

const attackerSpecs: StatSpec[] = [
  { key: "elementalPierce", aliases: ["ELEMENTAL RES PEN", "RES PEN", "เพิกเฉยต้านทานธาตุ", "เพิกเฉยตานทานธาต", "เพิกเฉยต้านทาน"] },
  { key: "classRestraintPct", aliases: ["SCHOOL COUNTER", "ข่มสำนัก", "ขมสํานัก", "ขมสำนัก"], valueMode: "percent" },
  { key: "skillEnhance", aliases: ["SKILL ENHANCEMENT", "เสริมพลังสกิล"], valueMode: "percent" },
  { key: "armorPierce", aliases: ["DEF BREAK", "เจาะเกราะ"] },
  { key: "armorPierce", aliases: ["เจาะเกราะ"] },
  { key: "shieldBreak", aliases: ["SHIELD BREAK", "ทำลายโล่", "ทําลายโล", "ทำลายโล"] },
  { key: "elementalAtk", aliases: ["ELEMENTAL ATK", "โจมตีธาตุ"] },
  { key: "classRestraint", aliases: ["SCHOOL COUNTER", "ข่มสำนัก", "ขมสํานัก", "ขมสำนัก"] },
  { key: "critDmg", aliases: ["CRIT DMG", "ดาเมจคริติคอล", "เมจคริติคอล", "เจคริติคอล"], valueMode: "percent" },
  { key: "skillMult", aliases: ["DAMAGE SKILL", "ดาเมจสกิล"] },
  {
    key: "critical",
    aliases: ["CRIT", "คริติคอล"],
    excludes: ["DMG", "RES", "DEF", "ดาเมจ", "เมจ", "ต้านทาน", "ป้องกัน"],
    lineExcludes: ["DMG", "RES", "DEF", "ดาเมจ", "เมจ", "ต้านทาน", "ป้องกัน", "%"],
  },
  { key: "accuracy", aliases: ["HIT", "ความแม่นยำ", "ความแม่นยํา"], excludes: ["COUNT"] },
  {
    key: "atk",
    aliases: ["MIGHT ATK", "ATK", "โจมตี", "โจมตีกำลัง"],
    excludes: ["ELEMENTAL", "ธาตุ"],
    lineExcludes: ["ELEMENTAL", "ธาตุ"],
  },
  { key: "hits", aliases: ["HIT COUNT", "จำนวนครั้งโจมตี"] },
];

const defenderSpecs: StatSpec[] = [
  { key: "classDefensePct", aliases: ["SCHOOL DEF", "ป้องกันสำนัก"], valueMode: "percent" },
  { key: "skillDmgReduction", aliases: ["SKILL DMG REDUCTION", "ลดดาเมจจากสกิล"], valueMode: "percent" },
  { key: "dmgReduction", aliases: ["DMG REDUCTION", "ลดดาเมจ"], lineExcludes: ["SKILL", "สกิล"], valueMode: "percent" },
  { key: "elementalResist", aliases: ["ELEMENTAL RES", "ต้านทานธาตุ"] },
  { key: "critResist", aliases: ["CRIT RES", "ต้านทานคริติคอล"] },
  { key: "classDefense", aliases: ["SCHOOL DEF", "ป้องกันสำนัก"] },
  { key: "qiShield", aliases: ["QI SHIELD", "โล่พลังชี่"] },
  { key: "defense", aliases: ["DEF", "ป้องกัน"], excludes: ["SCHOOL", "CRIT", "BREAK", "สำนัก", "คริติคอล"] },
  { key: "block", aliases: ["BLOCK", "บล็อก"] },
];

const sideTheme = {
  attacker: {
    border: "border-sky-400/45",
    button: "border-sky-400/40 text-sky-200 hover:border-sky-300 hover:bg-sky-400/10",
    chip: "border-sky-400/30 text-sky-300",
  },
  defender: {
    border: "border-red-500/45",
    button: "border-red-500/40 text-red-200 hover:border-red-400 hover:bg-red-500/10",
    chip: "border-red-500/30 text-red-300",
  },
};

const detailTopRows = {
  row1: 0.12,
  row2: 0.215,
  row3: 0.305,
  row4: 0.4,
  row5: 0.49,
  row6: 0.585,
  row7: 0.675,
  row8: 0.765,
  row9: 0.86,
  row10: 0.95,
};

const detailScrolledRows = {
  row1: 0.055,
  row2: 0.145,
  row3: 0.235,
  row4: 0.325,
  row5: 0.415,
  row6: 0.505,
  row7: 0.595,
  row8: 0.685,
  row9: 0.775,
  row10: 0.865,
};

const fullDetailRows = {
  row1: 0.255,
  row2: 0.32,
  row3: 0.385,
  row4: 0.455,
  row5: 0.52,
  row6: 0.585,
  row7: 0.65,
  row8: 0.715,
  row9: 0.78,
  row10: 0.845,
};

function summaryRegions(rows: {
  atk: number;
  elementalAtk: number;
  accuracy: number;
  classRestraint: number;
  defense: number;
  block: number;
  critResist: number;
  elementalResist: number;
}): PositionRegion[] {
  const leftX = 0.31;
  const leftWidth = 0.18;
  const rightX = 0.73;
  const rightWidth = 0.23;
  const height = 0.07;

  return [
    { key: "atk", rect: [leftX, rows.atk, leftWidth, height], side: "attacker" },
    { key: "armorPierce", rect: [rightX, rows.atk, rightWidth, height], side: "attacker" },
    { key: "elementalAtk", rect: [leftX, rows.elementalAtk, leftWidth, height], side: "attacker" },
    { key: "elementalPierce", rect: [rightX, rows.elementalAtk, rightWidth, height], side: "attacker" },
    { key: "accuracy", rect: [leftX, rows.accuracy, leftWidth, height], side: "attacker" },
    { key: "critical", rect: [rightX, rows.accuracy, rightWidth, height], side: "attacker" },
    { key: "classRestraint", rect: [rightX, rows.classRestraint, rightWidth, height], side: "attacker" },
    { key: "defense", rect: [leftX, rows.defense, leftWidth, height], side: "defender" },
    { key: "block", rect: [leftX, rows.block, leftWidth, height], side: "defender" },
    { key: "critResist", rect: [leftX, rows.critResist, leftWidth, height], side: "defender" },
    { key: "elementalResist", rect: [leftX, rows.elementalResist, leftWidth, 0.055], side: "defender" },
    { key: "classDefense", rect: [rightX, rows.elementalResist, rightWidth, 0.055], side: "defender" },
  ];
}

function detailAttackRegions(
  rows: typeof detailTopRows,
  rect: [number, number],
  includeAtk: boolean,
): PositionRegion[] {
  const [x, width] = rect;
  const height = 0.065;

  return [
    ...(includeAtk ? [{ key: "atk" as const, rect: [x, rows.row1, width, height] as PositionRegion["rect"], side: "attacker" as const }] : []),
    { key: "accuracy", rect: [x, rows.row2, width, height] as PositionRegion["rect"], side: "attacker" },
    { key: "critical", rect: [x, rows.row3, width, height] as PositionRegion["rect"], side: "attacker" },
    { key: "critDmg", rect: [x, rows.row4, width, height] as PositionRegion["rect"], side: "attacker", valueMode: "percent" },
    { key: "shieldBreak", rect: [x, rows.row5, width, height] as PositionRegion["rect"], side: "attacker" },
    { key: "elementalAtk", rect: [x, rows.row6, width, height] as PositionRegion["rect"], side: "attacker" },
    { key: "classRestraint", rect: [x, rows.row8, width, height] as PositionRegion["rect"], side: "attacker" },
    { key: "classRestraintPct", rect: [x, rows.row8, width, height] as PositionRegion["rect"], side: "attacker", valueMode: "percent" },
    { key: "elementalPierce", rect: [x, rows.row10, width, height] as PositionRegion["rect"], side: "attacker" },
  ];
}

function detailScrolledAttackRegions(rows: typeof detailScrolledRows, rect: [number, number]): PositionRegion[] {
  const [x, width] = rect;
  const height = 0.065;

  return [
    { key: "armorPierce", rect: [x, rows.row9, width, height], side: "attacker" },
    { key: "skillEnhance", rect: [x, rows.row10, width, height], side: "attacker", valueMode: "percent" },
  ];
}

function detailDefenseRegions(rows: typeof detailTopRows, rect: [number, number]): PositionRegion[] {
  const [x, width] = rect;
  const height = 0.065;

  return [
    { key: "defense", rect: [x, rows.row1, width, height], side: "defender" },
    { key: "block", rect: [x, rows.row2, width, height], side: "defender" },
    { key: "critResist", rect: [x, rows.row3, width, height], side: "defender" },
    { key: "qiShield", rect: [x, rows.row5, width, height], side: "defender" },
    { key: "elementalResist", rect: [x, rows.row6, width, height], side: "defender" },
    { key: "classDefense", rect: [x, rows.row8, width, height], side: "defender" },
    { key: "classDefensePct", rect: [x, rows.row8, width, height], side: "defender", valueMode: "percent" },
    { key: "dmgReduction", rect: [x, rows.row10, width, height], side: "defender", valueMode: "percent" },
  ];
}

function detailScrolledDefenseRegions(rows: typeof detailScrolledRows, rect: [number, number]): PositionRegion[] {
  const [x, width] = rect;
  const height = 0.065;

  return [
    { key: "dmgReduction", rect: [x, rows.row9, width, height], side: "defender", valueMode: "percent" },
    { key: "skillDmgReduction", rect: [x, rows.row10, width, height], side: "defender", valueMode: "percent" },
  ];
}

const positionTemplates: PositionTemplate[] = [
  {
    maxAspect: 1.05,
    minAspect: 0.65,
    name: "summary-panel-th",
    requiredKeys: ["atk"],
    regions: summaryRegions({
      atk: 0.425,
      elementalAtk: 0.505,
      accuracy: 0.585,
      classRestraint: 0.665,
      defense: 0.74,
      block: 0.82,
      critResist: 0.895,
      elementalResist: 0.955,
    }),
  },
  {
    maxAspect: 1.05,
    minAspect: 0.65,
    name: "summary-panel-en",
    requiredKeys: ["atk"],
    regions: summaryRegions({
      atk: 0.375,
      elementalAtk: 0.455,
      accuracy: 0.535,
      classRestraint: 0.615,
      defense: 0.7,
      block: 0.78,
      critResist: 0.855,
      elementalResist: 0.93,
    }),
  },
  {
    maxAspect: 1.75,
    minAspect: 1.25,
    name: "detail-top",
    requiredKeys: ["atk", "defense"],
    regions: [
      ...detailAttackRegions(detailTopRows, [0.52, 0.15], true),
      ...detailDefenseRegions(detailTopRows, [0.86, 0.13]),
    ],
  },
  {
    maxAspect: 1.75,
    minAspect: 1.25,
    name: "detail-scrolled",
    regions: [
      ...detailScrolledAttackRegions(detailScrolledRows, [0.58, 0.14]),
      ...detailScrolledDefenseRegions(detailScrolledRows, [0.86, 0.13]),
    ],
  },
  {
    maxAspect: 1.95,
    minAspect: 1.65,
    name: "full-detail",
    regions: [
      ...detailAttackRegions(fullDetailRows, [0.685, 0.08], true),
      ...detailDefenseRegions(fullDetailRows, [0.88, 0.08]),
    ],
  },
];

function normalizeText(value: string) {
  return value
    .replace(/\u0E4D\u0E32/g, "\u0E33")
    .replace(/[：]/g, ":")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function findAliasIndex(line: string, alias: string) {
  const normalizedAlias = normalizeText(alias);

  if (/^[A-Z0-9 .%]+$/.test(normalizedAlias)) {
    const escapedAlias = normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = line.match(new RegExp(`(^|[^A-Z0-9])(${escapedAlias})(?=[^A-Z0-9]|$)`));

    return match?.index === undefined ? -1 : match.index + match[1].length;
  }

  return line.indexOf(normalizedAlias);
}

function parseNumber(value: string, mode: StatSpec["valueMode"] = "first") {
  const normalized = value
    .replace(/(\d),(\d)(?!\d)/g, "$1.$2")
    .replace(/,/g, "")
    .replace(/[Oo]/g, "0");
  const rangeMatch = normalized.match(/(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);

  if (rangeMatch && mode !== "percent") {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);

    if (Number.isFinite(min) && Number.isFinite(max)) {
      return Math.round((min + max) / 2);
    }
  }

  if (mode === "percent") {
    const percentMatches = Array.from(normalized.matchAll(/-?\d+(?:\.\d+)?\s*%/g));
    const percentMatch = percentMatches[0];

    if (percentMatch) {
      const parsed = Number(percentMatch[0].replace("%", "").trim());
      return Number.isFinite(parsed) ? parsed : null;
    }

    const slashMatch = normalized.match(/\/\s*(-?\d+(?:\.\d+)?)/);

    if (slashMatch) {
      const parsed = Number(slashMatch[1]);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }

  const match = normalized.match(/-?\d+(?:\.\d+)?\s*[Kk]?/);

  if (!match) {
    return null;
  }

  const raw = match[0].trim();
  const multiplier = /K$/i.test(raw) ? 1000 : 1;
  const parsed = Number(raw.replace(/[Kk]/g, ""));

  return Number.isFinite(parsed) ? Math.round(parsed * multiplier) : null;
}

function findNumberAfterAlias(line: string, spec: StatSpec) {
  for (const alias of spec.aliases) {
    const normalizedAlias = normalizeText(alias);
    const aliasIndex = findAliasIndex(line, alias);

    if (aliasIndex === -1) {
      continue;
    }

    const valueSegment = line.slice(aliasIndex + normalizedAlias.length);
    const hasExcludedWordBeforeValue =
      spec.excludes?.some((word) => {
        const excludedIndex = valueSegment.indexOf(normalizeText(word));
        const firstNumberIndex = valueSegment.search(/-?\d/);

        return excludedIndex !== -1 && (firstNumberIndex === -1 || excludedIndex < firstNumberIndex);
      }) ?? false;

    if (hasExcludedWordBeforeValue) {
      continue;
    }

    const value = parseNumber(valueSegment, spec.valueMode);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function findNumberNearLine(lines: string[], index: number, spec: StatSpec) {
  const currentLineNumber = findNumberAfterAlias(lines[index], spec);

  if (currentLineNumber !== null) {
    return currentLineNumber;
  }

  for (let offset = 1; offset <= 3; offset += 1) {
    const nextLine = lines[index + offset];
    const nextLineValue = nextLine ? parseNumber(nextLine, spec.valueMode) : null;

    if (nextLineValue !== null) {
      return nextLineValue;
    }
  }

  return null;
}

function parseStatsFromText(text: string, side: OcrSide) {
  const specs = side === "attacker" ? attackerSpecs : defenderSpecs;
  const lines = text
    .split(/\r?\n/)
    .map(normalizeText)
    .filter(Boolean);
  const updates: Partial<Stats> = {};
  const matches: StatMatch[] = [];

  for (const spec of specs) {
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const hasAlias = spec.aliases.some((alias) => findAliasIndex(line, alias) !== -1);
      const hasExcludedLine =
        spec.lineExcludes?.some((word) => line.includes(normalizeText(word))) ?? false;

      if (!hasAlias || hasExcludedLine) {
        continue;
      }

      const value = findNumberNearLine(lines, index, spec);

      if (value !== null) {
        updates[spec.key] = value;
        matches.push({ key: spec.key, value });
        break;
      }
    }
  }

  if (side === "attacker") {
    const attackerFallbacks: Array<[keyof Stats, string[], StatSpec["valueMode"]?]> = [
      ["atk", ["MIGHT ATK", "โจมตีกําลัง", "โจมตีกำลัง"], "first"],
      ["shieldBreak", ["SHIELD BREAK", "ทำลายโล่", "ทําลายโล"], "first"],
      ["accuracy", ["HIT", "ความแม่นยำ", "ความแม่นยํา"], "first"],
      ["classRestraint", ["SCHOOL COUNTER", "ข่มสำนัก", "ขมสํานัก"], "first"],
      ["classRestraintPct", ["SCHOOL COUNTER", "ข่มสำนัก", "ขมสํานัก"], "percent"],
      ["critDmg", ["CRIT DMG", "ดาเมจคริติคอล", "เมจคริติคอล"], "percent"],
      ["skillEnhance", ["SKILL ENHANCEMENT", "เสริมพลังสกิล"], "percent"],
    ];

    for (const [key, aliases, valueMode] of attackerFallbacks) {
      const value = findAttackerFallbackValue(lines, aliases, valueMode);

      if (value !== null) {
        updates[key] = value;
        matches.push({ key, value });
      }
    }

    const criticalFallback = findCriticalFallbackValue(lines);

    if (criticalFallback !== null) {
      updates.critical = criticalFallback;
      matches.push({ key: "critical", value: criticalFallback });
    }
  }

  return { matches, updates };
}

function includesAny(line: string, words: string[]) {
  return words.some((word) => line.includes(normalizeText(word)));
}

function findCriticalFallbackValue(lines: string[]) {
  const directRejectWords = [
    "DMG",
    "RES",
    "DEF",
    "ดาเมจ",
    "เมจ",
    "ต้าน",
    "ป้องกัน",
    "%",
  ];
  const directValue = findAttackerFallbackValue(
    lines.filter((line) => !includesAny(line, directRejectWords)),
    ["CRIT", "คริติคอล"],
  );

  if (directValue !== null && directValue >= 500 && directValue <= 5000) {
    return directValue;
  }

  const accuracyIndex = lines.findIndex((line) =>
    ["HIT", "ความแม่นยำ", "ความแม่นยํา"].some((alias) => findAliasIndex(line, alias) !== -1),
  );

  if (accuracyIndex === -1) {
    return null;
  }

  for (let offset = 1; offset <= 10; offset += 1) {
    const line = lines[accuracyIndex + offset];

    if (!line || includesAny(line, ["CRIT DMG", "ดาเมจ", "เมจ", "SHIELD BREAK", "ทำลายโล่"])) {
      break;
    }

    if (includesAny(line, ["BLOCK", "RES", "DEF", "บล็อก", "ต้าน", "ป้องกัน"])) {
      continue;
    }

    const value = parseNumber(line);

    if (value !== null && value >= 1000 && value <= 3000) {
      return value;
    }
  }

  return null;
}

function getPositionTemplates(width: number, height: number) {
  const aspect = width / height;
  return positionTemplates.filter((template) => aspect >= template.minAspect && aspect <= template.maxAspect);
}

function isValidPositionValue(key: keyof Stats, value: number, mode: StatSpec["valueMode"] = "first") {
  if (!Number.isFinite(value)) {
    return false;
  }

  if (mode === "percent") {
    return value >= -100 && value <= 500;
  }

  switch (key) {
    case "atk":
      return value >= 3000 && value <= 100000;
    case "accuracy":
    case "armorPierce":
    case "shieldBreak":
    case "elementalAtk":
    case "elementalPierce":
    case "classRestraint":
    case "classDefense":
    case "block":
    case "qiShield":
    case "elementalResist":
      return value >= 0 && value <= 100000;
    case "defense":
      return value >= 1000 && value <= 100000;
    case "critical":
    case "critResist":
      return value >= 100 && value <= 10000;
    case "classRestraintPct":
    case "classDefensePct":
    case "critDmg":
    case "dmgReduction":
    case "skillDmgReduction":
    case "skillEnhance":
      return value >= -100 && value <= 500;
    default:
      return value >= -10000 && value <= 100000;
  }
}

function parsePositionValue(text: string, region: PositionRegion) {
  if (
    region.valueMode === "percent" &&
    !/[/%]/.test(text) &&
    !["critDmg", "dmgReduction"].includes(region.key)
  ) {
    return null;
  }

  const value = parseNumber(text, region.valueMode);

  if (value === null || !isValidPositionValue(region.key, value, region.valueMode)) {
    return null;
  }

  return value;
}

function scorePositionTemplate(
  template: PositionTemplate,
  updates: Partial<Stats>,
  matches: StatMatch[],
  side: OcrSide,
) {
  let score = matches.length;

  for (const key of template.requiredKeys ?? []) {
    const requiredForSide = template.regions.some((region) => region.side === side && region.key === key);

    if (!requiredForSide) {
      continue;
    }

    score += updates[key] === undefined ? -50 : 8;
  }

  if (updates.atk !== undefined) {
    score += 3;
  }

  if (updates.skillEnhance !== undefined) {
    score += 2;
  }

  return score;
}

async function createNumberCrop(image: ImageBitmap, rect: PositionRegion["rect"]) {
  const [x, y, width, height] = rect;
  const paddingX = 0.01;
  const paddingY = 0.01;
  const sourceX = Math.max(0, Math.round((x - paddingX) * image.width));
  const sourceY = Math.max(0, Math.round((y - paddingY) * image.height));
  const sourceWidth = Math.min(image.width - sourceX, Math.round((width + paddingX * 2) * image.width));
  const sourceHeight = Math.min(image.height - sourceY, Math.round((height + paddingY * 2) * image.height));
  const scale = 5;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, sourceWidth * scale);
  canvas.height = Math.max(1, sourceHeight * scale);

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const luminance = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
    const threshold = luminance > 115 ? 0 : 255;
    pixels[index] = threshold;
    pixels[index + 1] = threshold;
    pixels[index + 2] = threshold;
  }

  context.putImageData(imageData, 0, 0);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}

async function recognizeStatsByPosition(
  worker: OcrWorker,
  file: File,
  side: OcrSide,
  psmSingleLine: string | number,
) {
  const image = await createImageBitmap(file);
  const templates = getPositionTemplates(image.width, image.height);
  let bestResult: { matches: StatMatch[]; score: number; updates: Partial<Stats> } = {
    matches: [],
    score: Number.NEGATIVE_INFINITY,
    updates: {},
  };

  await worker.setParameters({
    tessedit_char_whitelist: POSITION_OCR_CHARS,
    tessedit_pageseg_mode: psmSingleLine,
  });

  for (const template of templates) {
    const templateUpdates: Partial<Stats> = {};
    const templateMatches: StatMatch[] = [];
    const regions = template.regions.filter((region) => region.side === side);

    for (const region of regions) {
      if (templateUpdates[region.key] !== undefined) {
        continue;
      }

      const crop = await createNumberCrop(image, region.rect);

      if (!crop) {
        continue;
      }

      const result = await worker.recognize(crop);
      const value = parsePositionValue(result.data.text, region);

      if (value !== null) {
        templateUpdates[region.key] = value;
        templateMatches.push({ key: region.key, value });
      }
    }

    const score = scorePositionTemplate(template, templateUpdates, templateMatches, side);

    if (score > bestResult.score) {
      bestResult = { matches: templateMatches, score, updates: templateUpdates };
    }
  }

  image.close();
  return bestResult.score > 0 ? bestResult : { matches: [], updates: {} };
}

function findAttackerFallbackValue(
  lines: string[],
  aliases: string[],
  valueMode: StatSpec["valueMode"] = "first",
) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matchedAlias = aliases.find((alias) => findAliasIndex(line, alias) !== -1);

    if (!matchedAlias) {
      continue;
    }

    const aliasIndex = findAliasIndex(line, matchedAlias);
    const segment = aliasIndex >= 0 ? line.slice(aliasIndex + normalizeText(matchedAlias).length) : line;
    const sameLineValue = parseNumber(segment, valueMode);

    if (sameLineValue !== null) {
      return sameLineValue;
    }

    for (let offset = 1; offset <= 3; offset += 1) {
      const nextLine = lines[index + offset];
      const nextLineValue = nextLine ? parseNumber(nextLine, valueMode) : null;

      if (nextLineValue !== null) {
        return nextLineValue;
      }
    }
  }

  return null;
}

async function preprocessImage(file: File) {
  const image = await createImageBitmap(file);
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return file;
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const luminance = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
    const adjusted = Math.max(0, Math.min(255, (luminance - 45) * 2.1));
    pixels[index] = adjusted;
    pixels[index + 1] = adjusted;
    pixels[index + 2] = adjusted;
  }

  context.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  image.close();
  return blob ?? file;
}

export function OcrImportPanel({
  onApply,
  side,
  title,
}: {
  onApply: (updates: Partial<Stats>) => void;
  side: OcrSide;
  title: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<ImagePreview[]>([]);
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [viewingImage, setViewingImage] = useState<ImagePreview | null>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [message, setMessage] = useState("อัปโหลดได้สูงสุด 3 รูป / Up to 3 images");
  const theme = sideTheme[side];

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, []);

  useEffect(() => {
    if (!viewingImage) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setViewingImage(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingImage]);

  function removePreview(id: string) {
    setPreviews((current) => {
      const removedPreview = current.find((preview) => preview.id === id);

      if (removedPreview) {
        URL.revokeObjectURL(removedPreview.url);
      }

      return current.filter((preview) => preview.id !== id);
    });
    setViewingImage((current) => (current?.id === id ? null : current));
  }

  async function handleFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []).slice(0, MAX_FILES);

    if (selectedFiles.length === 0) {
      return;
    }

    setPreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url));
      return selectedFiles.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
      }));
    });
    setViewingImage(null);
    setStatus("reading");
    setFileNames(selectedFiles.map((file) => file.name));
    setMatchCount(0);
    setMessage("กำลังอ่านรูปภาพ / Reading images...");

    try {
      const { PSM, createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng+tha", undefined, {
        logger: () => undefined,
      });
      const updates: Partial<Stats> = {};
      let totalMatches = 0;

      await worker.setParameters({
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      });

      for (const file of selectedFiles) {
        const positionParsed = await recognizeStatsByPosition(worker, file, side, PSM.SINGLE_LINE);
        Object.assign(updates, positionParsed.updates);
        totalMatches += positionParsed.matches.length;

        await worker.setParameters({
          preserve_interword_spaces: "1",
          tessedit_char_whitelist: "",
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        });

        const focusedImage = await preprocessImage(file);
        const result = await worker.recognize(focusedImage);
        const parsed = parseStatsFromText(result.data.text, side);
        const fallbackUpdates = Object.fromEntries(
          Object.entries(parsed.updates).filter(([key]) => updates[key as keyof Stats] === undefined),
        ) as Partial<Stats>;

        Object.assign(updates, fallbackUpdates);
        totalMatches += Object.keys(fallbackUpdates).length;
      }

      await worker.terminate();
      onApply(updates);
      setMatchCount(totalMatches);
      setStatus("done");
      setMessage(
        totalMatches > 0
          ? `พบ ${totalMatches} ค่า และใส่เข้า input แล้ว / Imported ${totalMatches} stats`
          : "ยังไม่พบชื่อ stat ที่อ่านได้ชัด / No matching stats found",
      );
    } catch {
      setStatus("error");
      setMessage("อ่านรูปไม่สำเร็จ ลองใช้รูปที่ชัดขึ้น / OCR failed, try a clearer image");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <section className={`rounded-lg border bg-[#1c1c21] p-4 ${theme.border}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.02em] text-slate-200">{title}</h3>
          {/* <p className="mt-1 text-[11px] font-medium text-slate-600">{message}</p> */}
        </div>
        <span className={`rounded border px-2 py-1 text-[10px] font-black ${theme.chip}`}>
          OCR
        </span>
      </div>

      <input
        accept="image/*"
        className="sr-only"
        multiple
        ref={inputRef}
        type="file"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <button
        className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border px-4 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.button}`}
        disabled={status === "reading"}
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        {status === "reading" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>กำลัง OCR... / Reading...</span>
          </>
        ) : (
          "อัปโหลดรูป / Upload Images"
        )}
      </button>

      {fileNames.length > 0 ? (
        <div className="mt-3 grid gap-2 text-[11px] font-medium text-slate-500">
          <div className="grid grid-cols-3 gap-2">
            {previews.map((preview) => (
              <div className="relative overflow-hidden rounded-md border border-white/10 bg-black/25" key={preview.id}>
                <button
                  aria-label={`Delete ${preview.name}`}
                  className="absolute right-1 top-1 z-10 grid h-6 min-w-6 place-items-center rounded-full border border-red-300/40 bg-black/75 px-1.5 text-[10px] font-black text-red-200 transition hover:border-red-200 hover:bg-red-500/35"
                  type="button"
                  onClick={() => removePreview(preview.id)}
                >
                  X
                </button>
                <button
                  aria-label={`View ${preview.name}`}
                  className="block aspect-square w-full overflow-hidden bg-black/40"
                  type="button"
                  onClick={() => setViewingImage(preview)}
                >
                  <img
                    alt={preview.name}
                    className="h-full w-full object-cover"
                    src={preview.url}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {viewingImage ? (
        <div
          className="fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)] bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={viewingImage.name}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="truncate text-xs font-bold text-slate-200">{viewingImage.name}</p>
            <button
              className="h-10 rounded-md border border-white/15 px-4 text-xs font-bold text-slate-200 transition hover:bg-white/10"
              type="button"
              onClick={() => setViewingImage(null)}
            >
              Close
            </button>
          </div>
          <div className="grid min-h-0 place-items-center overflow-hidden">
            <img
              alt={viewingImage.name}
              className="max-h-[calc(100dvh-6rem)] max-w-[min(100%,72rem)] rounded-lg object-contain"
              src={viewingImage.url}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
