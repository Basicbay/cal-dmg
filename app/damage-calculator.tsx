"use client";
 
import { useEffect, useMemo, useState } from "react";
 
import {
  attackerFields,
  defenderFields,
  ZERO_STATS,
  ATTACKER_KEYS,
  DEFENDER_KEYS,
} from "./damage-calculator/constants";
import { DamageFlow } from "./damage-calculator/damage-flow";
import { InputPanel } from "./damage-calculator/form-panels";
import { calculate } from "./damage-calculator/math";
import { OcrImportPanel } from "./damage-calculator/ocr-import-panel";
import { HitResults, Probabilities } from "./damage-calculator/result-panels";
import type { Stats, AttackerProfile, DefenderProfile } from "./damage-calculator/types";

export default function DamageCalculator() {
  const [stats, setStats] = useState<Stats>(ZERO_STATS);
  const [showFormulas, setShowFormulas] = useState(false);
  const result = useMemo(() => calculate(stats), [stats]);

  const [profiles, setProfiles] = useState<AttackerProfile[]>([
    {
      id: "default",
      name: "โจมตีเริ่มต้น / Default",
      stats: {
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
      }
    }
  ]);
  const [activeProfileId, setActiveProfileId] = useState<string>("default");

  const [defenderProfiles, setDefenderProfiles] = useState<DefenderProfile[]>([
    {
      id: "preset-dps",
      name: "ตัวอย่าง DPS",
      isFixed: true,
      stats: {
        hp: 100000,
        defense: 3677,
        qiShield: 1332,
        classDefense: 1203,
        classDefensePct: 8.0,
        elementalResist: 34,
        critResist: 452,
        critDefense: 20,
        block: 707,
        dmgReduction: 1,
        skillDmgReduction: 0,
      }
    },
    {
      id: "preset-tank",
      name: "ตัวอย่าง Tank",
      isFixed: true,
      stats: {
        hp: 143000,
        defense: 4592,
        qiShield: 3545,
        classDefense: 3045,
        classDefensePct: 10.0,
        elementalResist: 1001,
        critResist: 1132,
        critDefense: 25.0,
        block: 648,
        dmgReduction: 6.0,
        skillDmgReduction: 0,
      }
    }
  ]);
  const [activeDefenderProfileId, setActiveDefenderProfileId] = useState<string>("preset-dps");

  // Load profiles from local storage on mount
  useEffect(() => {
    const savedAttacker = localStorage.getItem("cal-dps-attacker-profiles");
    const savedActiveId = localStorage.getItem("cal-dps-active-profile-id");
    const savedDefender = localStorage.getItem("cal-dps-defender-profiles");
    const savedDefenderActiveId = localStorage.getItem("cal-dps-active-defender-profile-id");

    let currentStats = { ...ZERO_STATS };

    // 1. Load attacker profiles
    if (savedAttacker) {
      try {
        const parsed = JSON.parse(savedAttacker);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProfiles(parsed);
          const activeId = (savedActiveId && parsed.some(p => p.id === savedActiveId))
            ? savedActiveId
            : parsed[0].id;
          setActiveProfileId(activeId);
          
          const activeProfile = parsed.find(p => p.id === activeId);
          if (activeProfile) {
            currentStats = {
              ...currentStats,
              ...activeProfile.stats
            };
          }
        }
      } catch (e) {
        console.error("Error loading attacker profiles from localStorage", e);
      }
    } else {
      // Fallback: use default attacker profile stats
      currentStats = {
        ...currentStats,
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
      };
    }

    // 2. Load defender profiles
    if (savedDefender) {
      try {
        const parsed = JSON.parse(savedDefender);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customProfiles = parsed.filter(p => !p.isFixed);
          const mergedDefenderProfiles = [
            {
              id: "preset-dps",
              name: "ตัวอย่าง DPS / Preset: DPS",
              isFixed: true,
              stats: {
                hp: 100000,
                defense: 3677,
                qiShield: 1332,
                classDefense: 1203,
                classDefensePct: 8.0,
                elementalResist: 34,
                critResist: 452,
                critDefense: 20,
                block: 707,
                dmgReduction: 1,
                skillDmgReduction: 0,
              }
            },
            {
              id: "preset-tank",
              name: "ตัวอย่าง Tank / Preset: Tank",
              isFixed: true,
              stats: {
                hp: 143000,
                defense: 4592,
                qiShield: 3545,
                classDefense: 3045,
                classDefensePct: 10.0,
                elementalResist: 1001,
                critResist: 1132,
                critDefense: 25.0,
                block: 648,
                dmgReduction: 6.0,
                skillDmgReduction: 0,
              }
            },
            ...customProfiles
          ];
          setDefenderProfiles(mergedDefenderProfiles);
          
          const activeId = (savedDefenderActiveId && mergedDefenderProfiles.some(p => p.id === savedDefenderActiveId))
            ? savedDefenderActiveId
            : "preset-dps";
          setActiveDefenderProfileId(activeId);
          
          const activeProfile = mergedDefenderProfiles.find(p => p.id === activeId);
          if (activeProfile) {
            currentStats = {
              ...currentStats,
              ...activeProfile.stats
            };
          }
        }
      } catch (e) {
        console.error("Error loading defender profiles from localStorage", e);
      }
    } else {
      // Fallback: use active default defender profile (preset-dps)
      currentStats = {
        ...currentStats,
        hp: 100000,
        defense: 3677,
        qiShield: 1332,
        classDefense: 1203,
        classDefensePct: 8.0,
        elementalResist: 34,
        critResist: 452,
        critDefense: 20,
        block: 707,
        dmgReduction: 1,
        skillDmgReduction: 0,
      };
    }

    setStats(currentStats);
  }, []);

  // Attacker Handlers
  function handleSelectTab(id: string) {
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      setActiveProfileId(id);
      localStorage.setItem("cal-dps-active-profile-id", id);
      setStats(prev => ({
        ...prev,
        ...profile.stats
      }));
    }
  }

  function handleAddTab() {
    setProfiles((currentProfiles) => {
      const nextNumber = currentProfiles.length + 1;
      const newId = `profile-${Date.now()}`;
      const newName = `โปรไฟล์โจมตี ${nextNumber} / Build ${nextNumber}`;
      const currentAttackerStats = {
        atk: stats.atk,
        skillMult: stats.skillMult,
        hits: stats.hits,
        armorPierce: stats.armorPierce,
        shieldBreak: stats.shieldBreak,
        accuracy: stats.accuracy,
        classRestraint: stats.classRestraint,
        classRestraintPct: stats.classRestraintPct,
        elementalAtk: stats.elementalAtk,
        elementalPierce: stats.elementalPierce,
        critical: stats.critical,
        critDmg: stats.critDmg,
        skillEnhance: stats.skillEnhance,
      };
      
      const newProfile: AttackerProfile = {
        id: newId,
        name: newName,
        stats: currentAttackerStats
      };

      const updated = [...currentProfiles, newProfile];
      localStorage.setItem("cal-dps-attacker-profiles", JSON.stringify(updated));
      setActiveProfileId(newId);
      localStorage.setItem("cal-dps-active-profile-id", newId);
      return updated;
    });
  }

  function handleRenameTab(id: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setProfiles((currentProfiles) => {
      const updated = currentProfiles.map(p => {
        if (p.id === id) {
          return { ...p, name: trimmed };
        }
        return p;
      });
      localStorage.setItem("cal-dps-attacker-profiles", JSON.stringify(updated));
      return updated;
    });
  }

  function handleDeleteTab(id: string) {
    setProfiles((currentProfiles) => {
      if (currentProfiles.length <= 1) return currentProfiles;
      
      const updated = currentProfiles.filter(p => p.id !== id);
      let nextActiveId = activeProfileId;
      if (activeProfileId === id) {
        nextActiveId = updated[0].id;
      }
      
      localStorage.setItem("cal-dps-attacker-profiles", JSON.stringify(updated));
      setActiveProfileId(nextActiveId);
      localStorage.setItem("cal-dps-active-profile-id", nextActiveId);
      
      const activeProfile = updated.find(p => p.id === nextActiveId);
      if (activeProfile) {
        setStats(prev => ({
          ...prev,
          ...activeProfile.stats
        }));
      }
      return updated;
    });
  }

  // Defender Handlers
  function handleSelectDefenderTab(id: string) {
    const profile = defenderProfiles.find(p => p.id === id);
    if (profile) {
      setActiveDefenderProfileId(id);
      localStorage.setItem("cal-dps-active-defender-profile-id", id);
      setStats(prev => ({
        ...prev,
        ...profile.stats
      }));
    }
  }

  function handleAddDefenderTab() {
    setDefenderProfiles((currentProfiles) => {
      const customCount = currentProfiles.filter(p => !p.isFixed).length + 1;
      const newId = `defender-profile-${Date.now()}`;
      const newName = `โปรไฟล์ป้องกัน ${customCount} / Def Build ${customCount}`;
      const currentDefenderStats = {
        hp: stats.hp,
        defense: stats.defense,
        qiShield: stats.qiShield,
        classDefense: stats.classDefense,
        classDefensePct: stats.classDefensePct,
        elementalResist: stats.elementalResist,
        critResist: stats.critResist,
        critDefense: stats.critDefense,
        block: stats.block,
        dmgReduction: stats.dmgReduction,
        skillDmgReduction: stats.skillDmgReduction,
      };
      
      const newProfile: DefenderProfile = {
        id: newId,
        name: newName,
        stats: currentDefenderStats
      };

      const updated = [...currentProfiles, newProfile];
      localStorage.setItem("cal-dps-defender-profiles", JSON.stringify(updated));
      setActiveDefenderProfileId(newId);
      localStorage.setItem("cal-dps-active-defender-profile-id", newId);
      return updated;
    });
  }

  function handleRenameDefenderTab(id: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setDefenderProfiles((currentProfiles) => {
      const updated = currentProfiles.map(p => {
        if (p.id === id && !p.isFixed) {
          return { ...p, name: trimmed };
        }
        return p;
      });
      localStorage.setItem("cal-dps-defender-profiles", JSON.stringify(updated));
      return updated;
    });
  }

  function handleDeleteDefenderTab(id: string) {
    setDefenderProfiles((currentProfiles) => {
      const target = currentProfiles.find(p => p.id === id);
      if (!target || target.isFixed) return currentProfiles;
      
      const updated = currentProfiles.filter(p => p.id !== id);
      let nextActiveId = activeDefenderProfileId;
      if (activeDefenderProfileId === id) {
        nextActiveId = updated[0].id;
      }
      
      localStorage.setItem("cal-dps-defender-profiles", JSON.stringify(updated));
      setActiveDefenderProfileId(nextActiveId);
      localStorage.setItem("cal-dps-active-defender-profile-id", nextActiveId);
      
      const activeProfile = updated.find(p => p.id === nextActiveId);
      if (activeProfile) {
        setStats(prev => ({
          ...prev,
          ...activeProfile.stats
        }));
      }
      return updated;
    });
  }

  function handleClear() {
    setStats(ZERO_STATS);
    setProfiles((currentProfiles) => {
      const updated = currentProfiles.map(p => {
        if (p.id === activeProfileId) {
          const zeroAttackerStats = {
            atk: 0,
            skillMult: 0,
            hits: 1,
            armorPierce: 0,
            shieldBreak: 0,
            accuracy: 0,
            classRestraint: 0,
            classRestraintPct: 0,
            elementalAtk: 0,
            elementalPierce: 0,
            critical: 0,
            critDmg: 0,
            skillEnhance: 0,
          };
          return {
            ...p,
            stats: zeroAttackerStats
          };
        }
        return p;
      });
      localStorage.setItem("cal-dps-attacker-profiles", JSON.stringify(updated));
      return updated;
    });

    setDefenderProfiles((currentProfiles) => {
      const updated = currentProfiles.map(p => {
        if (p.id === activeDefenderProfileId) {
          const zeroDefenderStats = {
            hp: 0,
            defense: 0,
            qiShield: 0,
            classDefense: 0,
            classDefensePct: 0,
            elementalResist: 0,
            critResist: 0,
            critDefense: 0,
            block: 0,
            dmgReduction: 0,
            skillDmgReduction: 0,
          };
          return {
            ...p,
            stats: zeroDefenderStats
          };
        }
        return p;
      });
      localStorage.setItem("cal-dps-defender-profiles", JSON.stringify(updated));
      return updated;
    });
  }

  function updateStat(key: keyof Stats, value: number) {
    const finalValue = Number.isFinite(value) ? value : 0;
    setStats((current) => ({
      ...current,
      [key]: finalValue,
    }));

    if (ATTACKER_KEYS.includes(key as any)) {
      setProfiles((currentProfiles) => {
        const updated = currentProfiles.map(p => {
          if (p.id === activeProfileId) {
            return {
              ...p,
              stats: {
                ...p.stats,
                [key]: finalValue
              }
            };
          }
          return p;
        });
        localStorage.setItem("cal-dps-attacker-profiles", JSON.stringify(updated));
        return updated;
      });
    }

    if (DEFENDER_KEYS.includes(key as any)) {
      setDefenderProfiles((currentProfiles) => {
        const updated = currentProfiles.map(p => {
          if (p.id === activeDefenderProfileId) {
            return {
              ...p,
              stats: {
                ...p.stats,
                [key]: finalValue
              }
            };
          }
          return p;
        });
        localStorage.setItem("cal-dps-defender-profiles", JSON.stringify(updated));
        return updated;
      });
    }
  }

  function applyStats(updates: Partial<Stats>) {
    setStats((current) => ({
      ...current,
      ...updates,
    }));

    const hasAttackerUpdates = Object.keys(updates).some(key => ATTACKER_KEYS.includes(key as any));
    if (hasAttackerUpdates) {
      setProfiles((currentProfiles) => {
        const updated = currentProfiles.map(p => {
          if (p.id === activeProfileId) {
            const newStats = { ...p.stats };
            ATTACKER_KEYS.forEach(key => {
              if (key in updates) {
                newStats[key] = updates[key]!;
              }
            });
            return {
              ...p,
              stats: newStats
            };
          }
          return p;
        });
        localStorage.setItem("cal-dps-attacker-profiles", JSON.stringify(updated));
        return updated;
      });
    }

    const hasDefenderUpdates = Object.keys(updates).some(key => DEFENDER_KEYS.includes(key as any));
    if (hasDefenderUpdates) {
      setDefenderProfiles((currentProfiles) => {
        const updated = currentProfiles.map(p => {
          if (p.id === activeDefenderProfileId) {
            const newStats = { ...p.stats };
            DEFENDER_KEYS.forEach(key => {
              if (key in updates) {
                newStats[key] = updates[key]!;
              }
            });
            return {
              ...p,
              stats: newStats
            };
          }
          return p;
        });
        localStorage.setItem("cal-dps-defender-profiles", JSON.stringify(updated));
        return updated;
      });
    }
  }

  return (
    <main className="min-h-dvh bg-[#0f0f12] text-slate-100">
      <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-4 border-b border-white/7 bg-[#111116]/95 p-1 backdrop-blur sm:px-7">
        <div>
          <h1 className="text-base font-black uppercase tracking-[0.02em] text-slate-100">
            Sword of Justice : Damage Calculator
          </h1>
          {/* <p className="text-[11px] font-semibold text-slate-600">
            Reference formula model
          </p> */}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            className="h-9 rounded-md border border-white/15 px-4 text-xs font-bold text-slate-200 transition hover:border-white/40 hover:bg-white/5 hover:text-white cursor-pointer"
            type="button"
            onClick={handleClear}
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
            tabs={profiles}
            activeTabId={activeProfileId}
            onSelectTab={handleSelectTab}
            onAddTab={handleAddTab}
            onRenameTab={handleRenameTab}
            onDeleteTab={handleDeleteTab}
          />
          <InputPanel
            tone="defender"
            title="ฝ่ายป้องกัน / Defender"
            fields={defenderFields}
            stats={stats}
            onChange={updateStat}
            onApplyStats={applyStats}
            tabs={defenderProfiles}
            activeTabId={activeDefenderProfileId}
            onSelectTab={handleSelectDefenderTab}
            onAddTab={handleAddDefenderTab}
            onRenameTab={handleRenameDefenderTab}
            onDeleteTab={handleDeleteDefenderTab}
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
