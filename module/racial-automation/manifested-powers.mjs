/**
 * Manifested Power Trait Automation
 * Applies passive trait bonuses from active Manifested Power transformations.
 *
 * Attribute Modifier Bonuses (attrBonuses) are already handled by _calculateAttributeModifiers.
 * This module handles the ADDITIONAL passive effects from Trait Groups that modify stats.
 *
 * Called from actor.mjs after _calculateRacialTraitBonuses().
 */

import { applyMutationTraitBonuses } from "./mutation-traits.mjs";

// ============================================================
// Known Manifested Power catalog keys (Awakenings + MP Enhancement Powers)
// ============================================================
const MANIFESTED_KEYS = new Set([
  // --- Lesser Awakenings (41) ---
  "archetypal_bruiser", "artificial_child", "artificial_genes", "black_sparks",
  "chosen_by_the_sparks", "class_up", "demon_infusion", "demonic_mask",
  "final_form_rider", "final_moon_fang", "genius", "god_class_up",
  "immemorial", "initial_class", "karmic_empowerment", "lone_warrior",
  "magical_girl", "majin_mark", "mass_consumption", "moon_cutting_blade",
  "ocular_acclimation", "other_half", "peak_condition", "pretty_magical_girl",
  "released_heavenly_chain", "savior_from_heaven", "spirit_control", "steel_frame",
  "strongest_form", "supporter", "terrifying_teamwork", "ultimate_class_up",
  "unlock_potential", "vanguard", "warlock", "warrior_of_earth",
  "warrior_of_namek", "warrior_of_sadala", "way_of_the_hermit", "weak_slayer", "zenkai", "mutation",
  // --- Greater Awakenings (28) ---
  "android_conversion", "ascension", "built_different", "commander",
  "dedicated_warrior", "divine_candidate", "divine_origin", "earned_power",
  "energy_consumption", "eternally_entwined", "greatest_warrior", "improved_schematics",
  "insatiable", "jacket_specialist", "marvelous_master", "master_class",
  "master_of_mimicry", "omega", "perfection", "preferred_possession",
  "pure_progress", "seeking_skill", "seeking_strength", "solitary_dragon",
  "super_android", "super_majin", "super_namekian", "time_skipper",
  // --- Super Awakenings (5) ---
  "earthling_spirit", "genetic_max", "grandmaster", "limitless_saiyan", "strongest_warrior",
  // --- Manifested Enhancement Powers (13) ---
  "dense_ki", "depth_of_emotion", "dragon_embodiment", "living_vessel",
  "manifested_willpower", "overflowing_power", "pain_addict", "peak_of_power",
  "pure_resolve", "reincarnated_power", "rippling_energy", "sage_training",
  "stone_mask_vampirism"
]);

/**
 * Parse current stacks (Z) from gradeOrStacks field.
 * Format is typically "current/max" (e.g. "3/5") or just a number.
 * @param {string} gradeOrStacks
 * @returns {number} Z (current stacks), minimum 1 for active manifested powers
 */
function parseStacks(gradeOrStacks) {
  if (!gradeOrStacks) return 1;
  const str = String(gradeOrStacks).trim();
  const slashIdx = str.indexOf("/");
  const num = parseInt(slashIdx >= 0 ? str.substring(0, slashIdx) : str, 10);
  return isNaN(num) || num <= 0 ? 1 : num;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getResolvedTransformationEffects(trans, options = {}) {
  const catalog = CONFIG.DBU?.transformationsCatalog || {};
  const catEntry = trans?.catalogKey ? catalog[trans.catalogKey] : null;
  const groups = trans?.structuredTraits?.length ? trans.structuredTraits : (catEntry?.traitGroups || []);
  const specialGroups = [catEntry?.masteryTrait, catEntry?.legendaryTrait, catEntry?.exceedTrait, catEntry?.burstLimit].filter(Boolean);
  const resolved = [];

  const visitGroup = (group) => {
    const groupName = group?.name || trans?.name || "Transformation";
    for (const eff of (group?.effects || [])) {
      const effectKey = `${groupName || "trait"}_${eff.level || 0}`;
      if (eff.activationType === "option" && eff.options?.length > 0) {
        const selected = options[effectKey] || eff.options[0]?.name;
        const opt = eff.options.find(o => o.name === selected);
        if (opt) resolved.push({ ...opt, groupName });
      } else if (eff.activationType === "multi-option" && eff.options?.length > 0) {
        const selectedArr = Array.isArray(options[effectKey]) ? options[effectKey] : [];
        for (const selected of selectedArr) {
          const opt = eff.options.find(o => o.name === selected);
          if (opt) resolved.push({ ...opt, groupName });
        }
      } else if (eff.activationType === "choice" && eff.options?.length > 0) {
        const parentSelected = options[eff.parentOptionKey || ""] || "";
        const opt = eff.options.find(o => o.name === parentSelected);
        if (opt) resolved.push({ ...opt, groupName });
      } else {
        resolved.push({ ...eff, groupName });
      }
    }
  };

  for (const group of groups) visitGroup(group);
  for (const group of specialGroups) {
    for (const sub of (group.subGroups || [group])) visitGroup(sub);
  }

  return resolved;
}

function getFirstOptionValue(options) {
  if (!options) return "";
  for (const key of Object.keys(options)) {
    const value = options[key];
    if (value && typeof value === "string" && value !== "none") return value.toLowerCase();
  }
  return "";
}

/**
 * Count how many health thresholds are crossed (LP below threshold value).
 * 0 = healthy, 1 = bruised, 2 = bruised+injured, 3 = all three.
 */
function getThresholdsBelow(system) {
  return system.thresholds?.crossedCount ?? 0;
}

/**
 * Check if character has 2+ active Power stacks.
 */
function hasPower2Plus(system) {
  return (system.tracking?.powerStacks || 0) >= 2;
}

/**
 * Check if any active transformation matches a given type prefix.
 * For "enhancement" checks, matches both "enhancement_standard" and "enhancement_power".
 */
function hasActiveTransType(system, typePrefix) {
  return (system.transformations || []).some(t => {
    if (!t.active) return false;
    return t.transformationType && t.transformationType.startsWith(typePrefix);
  });
}

/**
 * Check if any active transformation has the God Ki aspect.
 */
function hasActiveGodKiTrans(system) {
  const catalog = CONFIG.DBU?.transformationsCatalog || {};
  return (system.transformations || []).some(t => {
    if (!t.active) return false;
    const catEntry = catalog[t.catalogKey];
    return catEntry?.aspects?.includes("god_ki") || catEntry?.aspects?.includes("godKi");
  });
}

/**
 * Apply all automatable Manifested Power trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyManifestedPowerBonuses(system, tier, baseTier) {
  const transformations = system.transformations || [];
  const optionSelections = system.transformationOptionSelections || {};
  const level = system.level || 1;

  const result = {
    entries: [],
    hasBonuses: false
  };

  // Accumulate totals for display
  const totals = {
    soak: 0, defense: 0, dr: 0, might: 0,
    strike: 0, dodge: 0, wound: 0, combatRolls: 0,
    lpMax: 0, kpMax: 0, capacityMax: 0,
    perception: 0, intimidation: 0, steadfast: 0,
    stressBonus: 0, allSaves: 0
  };

  for (let i = 0; i < transformations.length; i++) {
    const trans = transformations[i];
    if (!trans.active) continue;

    const key = trans.catalogKey;
    if (!key || !MANIFESTED_KEYS.has(key)) continue;

    const Z = parseStacks(trans.gradeOrStacks);
    const options = optionSelections[String(i)] || optionSelections[i] || {};
    const entry = { name: trans.name, catalogKey: key, stacks: Z, bonuses: [], conditionals: [], triggered: [], perRound: [] };

    applyBonusesForKey(key, system, tier, baseTier, Z, level, options, entry, totals);

    // Catch-all: pick up any triggered/limited effects from catalog not hardcoded above
    const resolvedEffects = getResolvedTransformationEffects(trans, options);
    const existingTriggerIds = new Set(entry.triggered.map(t => t.id));
    for (const [idx, eff] of resolvedEffects.entries()) {
      if (!["triggered", "limited"].includes(eff.activationType)) continue;
      const autoId = `${key}_${slugify(eff.groupName)}_${eff.level || 0}_${idx}`;
      if (existingTriggerIds.has(autoId)) continue;
      const baseName = eff.groupName || trans.name;
      const levelSuffix = eff.level ? ` L${eff.level}` : "";
      entry.triggered.push({
        id: autoId,
        name: `${baseName}${levelSuffix}`,
        description: eff.text || "",
        usageLimit: eff.usageLimit || null,
        maxUses: eff.maxUses || null
      });
    }

    if (entry.bonuses.length > 0 || entry.conditionals.length > 0 || entry.triggered.length > 0 || entry.perRound.length > 0) {
      result.entries.push(entry);
      result.hasBonuses = true;
    }
  }

  result.totals = totals;
  system.manifestedPowerBonuses = result;
}

// ============================================================
// Per-key bonus application
// ============================================================

function applyBonusesForKey(key, system, tier, baseTier, Z, level, options, entry, totals) {
  switch (key) {

    // ========== LESSER AWAKENINGS ==========

    case "archetypal_bruiser": {
      // Surprisingly Quick Lv1: +1(bT) Defense Value
      system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + baseTier;
      totals.defense += baseTier;
      entry.bonuses.push(`+${baseTier} Defense Value`);
      // Surprisingly Quick Lv2: Use FO Mod instead of AG Mod for Speed
      entry.conditionals.push("Use FO Mod instead of AG Mod for Speed");
      // Surprisingly Quick Lv3: 1/Round when targeted, +1/2 FO Mod Defense
      const foTotalAB = system.attributes.fo?.totalScore ?? system.attributes.fo?.score ?? 0;
      entry.conditionals.push(`1/Round targeted: +${Math.floor(foTotalAB / 2)} Defense (1/2 FO Mod)`);
      // Throwing your Weight Around Lv1: Treat Size as 1 larger for Punching Down
      entry.conditionals.push("Treat Size as 1 larger for Punching Down");
      // Throwing your Weight Around Lv2: +1(T) Wound Rolls
      totals.wound += tier;
      entry.bonuses.push(`+${tier} Wound Rolls`);
      // Throwing your Weight Around Lv3: 1/Round charged melee entry +1d6(T) Wound
      entry.triggered.push({
        id: "bruiser_charge",
        name: "Charging Wound",
        description: `1/Round: charged melee entry +${tier}d6 Wound`,
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    case "artificial_genes": {
      // Forged Power: In Transcendent Enhancement: +1/2 Max Capacity
      entry.conditionals.push("In Transcendent Enhancement: +1/2 Max Capacity");
      // Artificial Creation Lv1: +1 Racial Life Modifier (handled in LP calc)
      entry.bonuses.push("+1 Racial Life Modifier (Artificial Creation)");
      // Artificial Creation Lv2: reduce KP cost of one UA type by 2(bT)
      entry.conditionals.push(`Artificial Creation: -${2 * baseTier} KP cost (chosen UA type)`);
      // Artificial Warrior Lv1: +1(bT) Soak
      system.status.soak = (system.status.soak || 0) + baseTier;
      totals.soak += baseTier;
      entry.bonuses.push(`+${baseTier} Soak (Artificial Warrior)`);
      // Artificial Monster Lv1: +1(bT) Might
      system.status.might = (system.status.might || 0) + baseTier;
      totals.might += baseTier;
      entry.bonuses.push(`+${baseTier} Might (Artificial Monster)`);
      break;
    }

    case "chosen_by_the_sparks": {
      totals.wound += tier;
      entry.bonuses.push(`+${tier} Wound Rolls on Physical Attacking Maneuvers`);
      entry.conditionals.push(`Black Flash: +${2 * tier} Wound Rolls total`);
      entry.conditionals.push("Gain 1 Cursed Flash stack on each Black Flash");
      entry.conditionals.push("Per 2 Cursed Flash: +1 Greater Dice Category");
      entry.conditionals.push("Spend Cursed Flash: Wound Natural Result +2 and +1 Greater Dice Category");
      entry.conditionals.push("No damage from Melee attack: spend Cursed Flash for Physical Basic Attack OoS");
      entry.conditionals.push("Physical hit that deals damage and is not Black Flash: spend Cursed Flash for Basic Attack OoS");
      entry.triggered.push({
        id: "chosen_black_flash_heal",
        name: "Cursed Flash Surge",
        description: "1/Round: spend 1 Cursed Flash to use a Healing Surge as an Instant Maneuver",
        usageLimit: "round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "chosen_black_flash_transform",
        name: "3rd Black Flash",
        description: "1/Encounter: on the 3rd Black Flash, enter this Transformation as OoS",
        usageLimit: "encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "chosen_black_flash_charges",
        name: "Black Flash Charges",
        description: "1/Encounter: on Black Flash hit, spend up to 3 Cursed Flash for equal Energy Charges",
        usageLimit: "encounter",
        maxUses: 1
      });
      entry.conditionals.push("1/Round: spend 2 Power so a Physical hit counts as Black Flash");
      break;
    }

    case "demonic_mask": {
      _applyOptionFlags(system, "demonic_mask", options);
      totals.intimidation += 2;
      entry.bonuses.push("+2 Intimidation Dice Score");
      entry.conditionals.push("Automatic/Transform: gain Mask Condition equal to thresholds above (max 3)");
      entry.conditionals.push("Automatic/Threshold: lose 1 Mask Condition; at 0 leave this Transformation");
      // 2+ Mask Condition: +2(T) Combat Rolls & Soak — read from specialResource
      const maskCond = system.transformationMeta?.specialResources?.maskCondition?.value ?? 0;
      if (maskCond >= 2) {
        totals.combatRolls += 2 * tier;
        system.status.soak = (system.status.soak || 0) + 2 * tier;
        totals.soak += 2 * tier;
        entry.bonuses.push(`+${2 * tier} Combat Rolls & Soak (${maskCond} Mask Condition)`);
      } else {
        entry.conditionals.push(`2+ Mask Condition: +${2 * tier} Combat Rolls & Soak`);
      }
      entry.conditionals.push("Above Bruised: ignore Shaken and Broken");
      entry.conditionals.push("Mask Accessory equipped; if destroyed, lose 1 Mask Condition instead");
      entry.conditionals.push("Surging Strength above Injured: count as 2 Mask Condition for that Maneuver");
      entry.conditionals.push("Triggered/Transform or Power: Might Clash Huge AoE, losers become Shaken");
      entry.conditionals.push("Masked Soldier: may exit end of turn to ignore Exhausting and use Power Surge");
      entry.conditionals.push("Immense Inner Power: on defeat, 10 on 1d10 => enter Feral Demon Lord OoS");
      entry.triggered.push({
        id: "demonic_mask_reset",
        name: "Mask Condition Max",
        description: "1/Encounter at Start of Turn: ignore threshold penalties/conditions and set Mask Condition to 3 until next turn",
        usageLimit: "encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "demonic_mask_restore",
        name: "Gain Mask Condition",
        description: `1/Round: spend 1 Action and ${4 * tier} KP to gain 1 Mask Condition`,
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    case "class_up": {
      _applyOptionFlags(system, "class_up", options);
      // Enhanced Prowess: While 2+ Power, +1(bT) Wound Rolls
      if (hasPower2Plus(system)) {
        totals.wound += baseTier;
        entry.bonuses.push(`+${baseTier} Wound Rolls (2+ Power)`);
      } else {
        entry.conditionals.push(`While 2+ Power: +${baseTier} Wound Rolls`);
      }
      // Class choice: In Core Transformation (can't automate class choice)
      entry.conditionals.push(`Hero in Core Trans: +${Z * baseTier} Dodge Rolls`);
      entry.conditionals.push(`Elite in Core Trans: +${Z * baseTier} Strike Rolls`);
      entry.conditionals.push(`Berserker in Core Trans: +${Z * baseTier} Wound Rolls`);
      break;
    }

    case "demon_infusion": {
      // Constant Demonic Power Lv1 [Passive]: +1(T) Combat Rolls (always active)
      totals.combatRolls += tier;
      entry.bonuses.push(`+${tier} Combat Rolls (Constant Demonic Power)`);

      // Demon Armor Lv4: +2(T) DR, reduced per Health Threshold below
      const tbDI = getThresholdsBelow(system);
      const drDI = Math.max(0, (2 - tbDI) * tier);
      if (drDI > 0) {
        totals.dr += drDI;
        entry.bonuses.push(`+${drDI} DR (Demon Armor, ${tbDI > 0 ? `-${tbDI} thresholds` : "full"})`);
      } else {
        entry.conditionals.push("Demon Armor DR reduced to 0 (3 thresholds below)");
      }

      // Infused Release Lv1: +1 Stress Bonus (above Injured)
      const hsDI = system.status?.healthStatus;
      if (hsDI === "healthy" || hsDI === "bruised") {
        totals.stressBonus += 1;
        system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 1;
        entry.bonuses.push("+1 Stress Bonus (Above Injured)");
      } else {
        entry.conditionals.push("Above Injured: +1 Stress Bonus");
      }

      // Infused Release Lv3
      entry.triggered.push({
        id: "demon_infusion_synergy",
        name: "Soul Synergy",
        description: "1/Encounter: enter Soul Synergy",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "god_class_up": {
      // All LF/Transcendent Enhancement gain God Ki Aspect
      entry.bonuses.push("All LF/Transcendent gain God Ki Aspect");
      // In LF/Trans with God Ki (already had): +Z(T) Combat Rolls
      entry.conditionals.push(`In God Ki LF/Trans: +${Z * tier} Combat Rolls`);
      // While 2+ Power: +Z(bT) Wound Rolls
      if (hasPower2Plus(system)) {
        totals.wound += Z * baseTier;
        entry.bonuses.push(`+${Z * baseTier} Wound Rolls (2+ Power)`);
      } else {
        entry.conditionals.push(`While 2+ Power: +${Z * baseTier} Wound Rolls`);
      }
      break;
    }

    case "immemorial": {
      // Unending Lv1: Others cannot reduce or spend your KP
      system.aptitudes.kiUnstealable = true;
      entry.bonuses.push("Others cannot reduce/spend your KP");
      // Unending Lv2: +2(bT) KP per round (start of turn)
      entry.perRound.push({ type: "kp", amount: 2 * baseTier, label: `+${2 * baseTier} KP` });
      system.aptitudes.kiRegenPerRound = (system.aptitudes.kiRegenPerRound || 0) + 2 * baseTier;
      entry.bonuses.push(`+${2 * baseTier} KP/round`);
      // Unending Lv3: Healing Surge → regain 1/2 LP as KP
      entry.conditionals.push("Healing Surge: regain 1/2 LP healed as KP");
      // Immortal Majin Lv1: knocked through threshold trigger
      entry.triggered.push({
        id: "immemorial_threshold",
        name: "Threshold Trigger",
        description: `+${tier} Combat Rolls vs trigger (until end of next turn)`,
        usageLimit: "round",
        maxUses: null
      });
      // Immortal Majin Lv2: Defeated (second or Triggered/Defeated) → set LP=1, Healing Surge
      entry.triggered.push({
        id: "immemorial_defeated",
        name: "Immortal Majin",
        description: "Defeated: set LP to 1, use Healing Surge (second defeat or Triggered/Defeated keyword)",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "initial_class": {
      _applyOptionFlags(system, "initial_class", options);
      // Class choice grants +1 AMB to specific attribute (already in attrBonuses)
      // Lv2 conditional class bonuses:
      entry.conditionals.push(`Spiritualist: No Opponents in Melee = +${tier} Combat Rolls`);
      entry.conditionals.push(`Warrior: Opponent in Melee = +${tier} Combat Rolls`);
      entry.conditionals.push(`Mage: target Ally with Magical UA = +${tier} Combat Rolls (until end of next turn)`);
      entry.conditionals.push(`Mighty: use Surge = +${tier} Combat Rolls (until end of next turn)`);
      entry.conditionals.push(`Wonder: gain/spend Power = +${tier} Combat Rolls (until end of next turn)`);
      // Lv2 triggered class effects:
      entry.conditionals.push(`Warrior: hit with Attacking Maneuver = regain ${2 * baseTier} LP`);
      entry.conditionals.push(`Mage: target Ally = regain ${3 * baseTier} LP`);
      entry.conditionals.push(`Mighty: use Surge = +${3 * baseTier} DR (until end of next turn)`);
      entry.conditionals.push(`Wonder: use Surge = +${2 * baseTier} Wound (until end of next turn)`);
      // Power of the Class
      entry.triggered.push({
        id: "initial_class_superior",
        name: "Power of the Class",
        description: "1/Encounter: enter racial Transformation → enter Superior State",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "karmic_empowerment": {
      // --- Powers of the Dark ---

      // Lv1 [Passive]: Reduce Cognitive Save by Z(T), unless in LF/Trans-Enhancement with God Ki
      const inGodKiLFOrTrans = (system.transformations || []).some(t => {
        if (!t.active) return false;
        const cat = (CONFIG.DBU?.transformationsCatalog || {})[t.catalogKey];
        if (!cat) return false;
        const isLFOrTrans = cat.category === "form_legendary" || cat.category === "enhancement_transcendent";
        const hasGodKi = cat.aspects?.includes("god_ki") || cat.aspects?.includes("godKi");
        return isLFOrTrans && hasGodKi;
      });

      if (!inGodKiLFOrTrans) {
        if (system.savingThrows?.cognitive) {
          system.savingThrows.cognitive.bonus -= Z * tier;
          system.savingThrows.cognitive.ct = Math.max(7, 10 - system.savingThrows.cognitive.bonus);
          if (system.combatStates?.mindful) {
            system.savingThrows.cognitive.ct = Math.max(2, system.savingThrows.cognitive.ct - 1);
          }
        }
        totals.allSaves -= Z * tier;
        entry.bonuses.push(`-${Z * tier} Cognitive Save (penalty)`);
      } else {
        entry.conditionals.push(`Cognitive Save penalty suppressed (God Ki LF/Transcendent)`);
      }

      // Lv2 [Passive]: While Compelled: +Z(T) Combat Rolls
      entry.conditionals.push(`While Compelled: +${Z * tier} Combat Rolls`);

      // Lv3 [Triggered/Power, 1/Round]: Gain Compelled targeting closest
      entry.triggered.push({
        id: "karmic_compelled",
        name: "Powers of the Dark (Compelled)",
        description: "Target closest Character — gain Compelled Combat Condition until start of next turn",
        usageLimit: "round",
        maxUses: 1
      });

      // --- Scaling Darkness ---

      // Lv1 [Passive]: Increase Intimidation Natural Result by Z
      totals.intimidation += Z;
      entry.bonuses.push(`+${Z} Intimidation (natural result)`);

      // Lv2 [Triggered/Start of Combat]: Start with 0 stacks, Z Dark Ki Points
      // Dark Ki Points tracked as specialResource; stacks reset handled by character-sheet.mjs
      const darkKiPoints = system.transformationMeta?.specialResources?.darkKiPoints?.value ?? 0;
      entry.conditionals.push(`Scaling Darkness: start combat with 0 stacks, ${Z} Dark Ki Points (current: ${darkKiPoints})`);

      // Lv3 [Triggered/Power]: Spend Dark Ki Points → gain equal stacks of Karmic Empowerment
      entry.triggered.push({
        id: "karmic_spend_dkp",
        name: "Scaling Darkness (Spend Dark Ki)",
        description: `Spend Dark Ki Points to gain equal stacks of Karmic Empowerment (${darkKiPoints} DKP available)`,
        usageLimit: null,
        maxUses: null
      });

      // Lv4 [Automatic]: Mind Control → convert all Dark Ki Points to stacks
      if (darkKiPoints > 0) {
        entry.conditionals.push(`Mind Control: auto-convert ${darkKiPoints} Dark Ki Points → stacks`);
      }

      // --- Flavor of Evil ---

      // Lv1 [Passive]: Reduce Evil Aura Stress Test by Z
      entry.bonuses.push(`-${Z} Evil Aura Stress Test Requirement`);

      // Lv2 [Passive]: Evil Aura + God Ki Aspect → benefit from +1 stack (can exceed limit)
      const hasEvilAura = (system.transformations || []).some(t => t.active && t.catalogKey === "evil_aura");
      if (hasEvilAura && hasActiveGodKiTrans(system)) {
        entry.bonuses.push("+1 effective Karmic Empowerment stack (Evil Aura + God Ki)");
      } else {
        entry.conditionals.push("Evil Aura + God Ki: +1 effective stack (can exceed limit)");
      }

      break;
    }

    case "lone_warrior": {
      // Mind Power Lv1: Per Health Threshold below: +1 Steadfast
      const tbLW = getThresholdsBelow(system);
      if (tbLW > 0) {
        totals.steadfast += tbLW;
        entry.bonuses.push(`+${tbLW} Steadfast (${tbLW} thresholds)`);
      } else {
        entry.conditionals.push("Per threshold below: +1 Steadfast");
      }
      // Mind Power Lv2: Below Injured: trigger Lv3/4 as if opponent meets requirements
      const hsLW = system.status?.healthStatus;
      if (hsLW === "injured" || hsLW === "critical") {
        entry.bonuses.push("Below Injured: Lv3/Lv4 effects always active");
      }
      // Mind Power Lv3: vs higher-tier opponent: spend 2(bT) KP → +1(T) Combat Rolls
      entry.conditionals.push(`vs higher-tier opponent: spend ${2 * baseTier} KP → +${tier} Combat Rolls`);
      // Mind Power Lv4: vs higher-Tier-Req transformation: spend 2(bT) KP → +1(T) Combat Rolls
      entry.conditionals.push(`vs higher Tier-Req trans: spend ${2 * baseTier} KP → +${tier} Combat Rolls`);
      // Mind Power Lv5: Start of Round: regain 2(bT) KP per threshold below
      if (tbLW > 0) {
        const kpRegenLW = 2 * baseTier * tbLW;
        entry.perRound.push({ type: "kp", amount: kpRegenLW, label: `+${kpRegenLW} KP` });
        entry.bonuses.push(`+${kpRegenLW} KP/round (${tbLW} thresholds)`);
      } else {
        entry.conditionals.push(`Per threshold below: +${2 * baseTier} KP/round`);
      }
      // Battle Point Unlimited Lv1: More opponents than allies: +1(T) Combat Rolls (×2 if alone)
      entry.conditionals.push(`More Opponents than Allies: +${tier} Combat Rolls (×2 if alone)`);
      // Lv2: 1/Encounter ally defeated → +2 Stress Bonus + Power Up/Transform OoS
      entry.triggered.push({
        id: "lone_warrior_ally_defeated",
        name: "Ally Defeated",
        description: "1/Encounter: ally defeated → +2 Stress Bonus + Power Up/Transform OoS",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Lv3: 1/Encounter no allies/2+ opponents → stop defeat, LP=1, Power Up/Transform OoS
      entry.triggered.push({
        id: "lone_warrior_last_stand",
        name: "Last Stand",
        description: "1/Encounter: no allies + 2+ opponents → stop defeat, LP=1 below Injured, Power Up/Transform OoS",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "majin_mark": {
      // Inner Power Lv1: +1 Stress Bonus
      totals.stressBonus += 1;
      system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 1;
      entry.bonuses.push("+1 Stress Bonus");
      // Inner Power Lv2: Minion w/o Alt Form: +2(T) Combat Rolls
      entry.conditionals.push(`Minion w/o Alt Form: +${2 * tier} Combat Rolls`);
      // Inner Power Lv3: +1(T) AMB(FO/MA) of Core Transformations
      entry.bonuses.push(`+${tier} FO/MA AMB of Core Transformations`);
      // Power Variance Lv1: 1/Encounter non-minion: +1 ToP until end of turn
      entry.triggered.push({
        id: "majin_mark_top_boost",
        name: "Power Variance",
        description: "1/Encounter (non-minion): +1 Tier of Power until end of turn",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Power Variance Lv2: Minion: +10(T) Max LP
      entry.conditionals.push(`Minion: +${10 * tier} Max LP`);
      // Power Variance Lv3: Minion defeated → set LP to 1/4 max, reduce max LP permanently
      entry.conditionals.push("Minion defeated: set LP to 1/4 max, permanently reduce max LP");
      break;
    }

    case "mass_consumption": {
      // Consumed Masses Lv1: +Z(max 5) LP and KP per PL
      const effZ = Math.min(Z, 5);
      const lpkpBonus = effZ * level;
      system.lifePoints.max += lpkpBonus;
      system.kiPool.max += lpkpBonus;
      totals.lpMax += lpkpBonus;
      totals.kpMax += lpkpBonus;
      entry.bonuses.push(`+${lpkpBonus} Max LP (+${effZ}/PL)`);
      entry.bonuses.push(`+${lpkpBonus} Max KP (+${effZ}/PL)`);
      // A Most Satisfying Meal Lv1: +4Z Wound on Absorbing Attack
      entry.conditionals.push(`Absorbing Attack: +${4 * Z} Wound`);
      // Lv2: +2Z LP/KP regain
      entry.conditionals.push(`Absorbing Attack: +${2 * Z} LP/KP regain`);
      // Lv3: After defeat/threshold via Absorbing: +Z Combat Rolls
      entry.triggered.push({
        id: "mass_absorb_combat",
        name: "Absorbing Triumph",
        description: `After defeat/threshold via Absorbing Attack: +${Z} Combat Rolls (until next turn)`,
        usageLimit: null,
        maxUses: null
      });
      // Lv4: 1/Encounter after defeat/threshold: enter Superior State
      entry.triggered.push({
        id: "mass_absorb_superior",
        name: "Absorbing Superior",
        description: "1/Encounter: defeat/threshold via Absorbing Attack → enter Superior State",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Consumed Masses Lv2: Burst Limit or Legend Realized: +2Z Combat Rolls
      entry.triggered.push({
        id: "mass_burst_combat",
        name: "Burst/Legend Boost",
        description: `1/Encounter: Burst Limit or Legend Realized → +${2 * Z} Combat Rolls (until next turn)`,
        usageLimit: "encounter",
        maxUses: 1
      });
      // Consumed Masses Lv3: 1/Round Z/Encounter: apply Absorbing without extra Action
      entry.triggered.push({
        id: "mass_free_absorb",
        name: "Free Absorbing",
        description: "1/Round Z/Encounter: next attack may apply Absorbing without extra Action",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    case "moon_cutting_blade": {
      // Soul Sword Lv1: Gain Moon Slayer Weapon
      entry.bonuses.push("Moon Slayer Weapon access");
      // Soul Sword Lv2: Stack-dependent bonuses (see Qualities below)

      // Qualities Lv1: -ceil(ToP/2) Critical Target for Strike/Wound with Moon Slayer
      const critRedMCB = Math.ceil(tier / 2);
      system.aptitudes.moonSlayerCritTargetReduction = (system.aptitudes.moonSlayerCritTargetReduction || 0) + critRedMCB;
      entry.bonuses.push(`-${critRedMCB} Crit Target (Moon Slayer Strike/Wound)`);
      // Qualities Lv2: Ignore all Health Threshold penalties
      entry.bonuses.push("Ignore Health Threshold penalties");
      // Qualities Lv3: Double AMB from Moon-Cutting Blade
      entry.bonuses.push("Double Moon-Cutting Blade AMBs");
      // Qualities Lv4: Moon Slayer LP can't go below 1
      entry.bonuses.push("Moon Slayer LP cannot be reduced below 1");
      // Qualities Lv5: Triggered/threshold failed steadfast → reduce LP by Might
      entry.triggered.push({
        id: "mcb_steadfast_might",
        name: "Steadfast Fail Might",
        description: `Opponent knocked through threshold + fails Steadfast: reduce their LP by ${system.status.might || 0} (your Might)`,
        usageLimit: null,
        maxUses: null
      });
      // Qualities Lv6: 1/Round spend Moon Slayer LP to increase Ki Wager
      entry.triggered.push({
        id: "mcb_lp_wager",
        name: "Moon Slayer Ki Wager",
        description: "1/Round: spend Moon Slayer LP to increase Ki Wager (2 LP = -1 Capacity, can't reduce to 0)",
        usageLimit: "round",
        maxUses: 1
      });

      // Techniques Lv1: KW 5T+ → +Z(T) Wound
      entry.conditionals.push(`Moon Slayer KW 5(T)+: +${Z * tier} Wound`);
      // Techniques Lv2: 2+ stacks → HPMF Signature Technique
      if (Z >= 2) entry.bonuses.push("Heaven-Piercing Moon Fang ST access (2+ stacks)");
      // Techniques Lv3: 3 stacks → Efficiency + Power Shot
      if (Z >= 3) {
        entry.bonuses.push("HPMF gains Efficiency + Power Shot (3 stacks)");
      }
      // Techniques Lv4: Spend 5(T) KP for Extending+Breaker, reduced by Z(T)
      entry.conditionals.push(`Armed Attack: spend ${Math.max(0, 5 * tier - Z * tier)} KP for Extending+Breaker`);
      // Techniques Lv5: 3 stacks → equip Moon Slayer OoS at Start of Turn
      if (Z >= 3) entry.conditionals.push("Start of Turn: summon/equip Moon Slayer (3 stacks)");
      // Techniques Lv6: 1/Round Z/Encounter Sweeping → Energy Charge OoS
      entry.triggered.push({
        id: "mcb_sweeping_charge",
        name: "Sweeping Energy Charge",
        description: `1/Round, ${Z}/Encounter: Sweeping Moon Slayer → Energy Charge OoS`,
        usageLimit: "round",
        maxUses: 1
      });
      // Techniques Lv7: 1/Round HPMF at 3 stacks → spend up to 6(T) KP for advantages
      if (Z >= 3) {
        entry.triggered.push({
          id: "mcb_hpmf_advantages",
          name: "HPMF Advantages",
          description: `1/Round: spend up to ${6 * tier} KP (per ${3 * tier}) for Concentrated Strike/Charging Assault/Penetration×2/Ascended Signature/Terrain Destruction×2`,
          usageLimit: "round",
          maxUses: 1
        });
      }

      // 3-stack trait group — defeated/restore/start of turn
      if (Z >= 3) {
        entry.triggered.push({
          id: "mcb_defeated_heal",
          name: "Moon Slayer Life Transfer",
          description: "Defeated: halve Moon Slayer LP to regain equal LP, then enter Soul Synergy (2+ stacks)",
          usageLimit: null,
          maxUses: null
        });
        entry.triggered.push({
          id: "mcb_restore_slayer",
          name: "Restore Moon Slayer",
          description: `1/Encounter: if destroyed, spend up to 1/4 Max KP to restore Moon Slayer with equal LP`,
          usageLimit: "encounter",
          maxUses: 1
        });
      }
      entry.conditionals.push(`Start of Turn: spend up to ${2 * Z * tier} KP → Moon Slayer regains 2× LP`);
      break;
    }

    case "other_half": {
      _applyOptionFlags(system, "other_half", options);
      entry.bonuses.push("Retain LP, KP, Capacity, States, and active Transformations when changing Split");
      entry.conditionals.push("Gain up to 2 Splits total");
      entry.conditionals.push("Two Minds, One Body: create a New Personality variant");
      entry.conditionals.push("Two Bodies, One Mind: create a New Body variant");
      entry.conditionals.push("Each Split swaps one selected Signature Technique/Aura for a new one of equal TP");
      entry.conditionals.push("Each Split may swap selected Unique Abilities/Advancements up to the same TP");
      entry.conditionals.push("Work with ARC to define the event that changes you into a Split");
      entry.conditionals.push("Spend 1 Karma Point to force a Split change");
      entry.conditionals.push("On Fission, eject one Split and lose it until Unify with that Character");
      break;
    }

    case "released_heavenly_chain": {
      system.aptitudes.initiativeValue = (system.aptitudes.initiativeValue || 0) + tier;
      entry.bonuses.push(`+${tier} Initiative Value`);
      entry.bonuses.push("Rapid Movement costs no KP");
      entry.conditionals.push("Stress effect: lose LP = 1/2 of higher AG or Might modifier before applying Stress effect");
      entry.conditionals.push("Below Injured and not in Soul Synergy: Weakening applies regardless of KP");
      entry.conditionals.push("Stress 2/Round: Moon Slayer Basic Attack as Instant; no Ki Wager");
      entry.conditionals.push("Stress Triggered: when targeted, double AMB(AG) for that attack");
      entry.conditionals.push("Stress Triggered: successful dodge => Movement as Instant");
      entry.conditionals.push("1/Round: after Rapid Movement into Melee, Basic Attack OoS with Moon Slayer");
      entry.triggered.push({
        id: "released_chain_superior",
        name: "Dodge Chain",
        description: "1/Encounter: after 3 successful dodges in one round, enter Superior until end of next turn",
        usageLimit: "encounter",
        maxUses: 1
      });
      entry.conditionals.push("Heaven-Piercing Moon Fang gains Elemental (Dark)");
      entry.conditionals.push("Stress Triggered: HPMF gains Aura Gathering");
      entry.conditionals.push("Stress Triggered: Ascended Signature HPMF may gain Maximum Charge");
      entry.conditionals.push("Triggered/Power 1/Round: Moon Slayer gains Dimension Blade until end of next turn");
      entry.triggered.push({
        id: "released_chain_synergy",
        name: "Soul Synergy",
        description: "Start of Turn below Injured 1/Encounter: enter Soul Synergy until end of next turn, then gain 2 Fatigued",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "savior_from_heaven": {
      const kpAddSFH = Math.floor(system.kiPool.max / 4);
      const capAddSFH = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpAddSFH;
      system.capacity.max += capAddSFH;
      totals.kpMax += kpAddSFH;
      totals.capacityMax += capAddSFH;
      entry.bonuses.push(`+${kpAddSFH} Max KP (+1/4)`);
      entry.bonuses.push(`+${capAddSFH} Max Capacity (+1/4)`);
      entry.bonuses.push("Part of the Super Saiyan Transformation Line");
      entry.conditionals.push("Apply Tier of Power Extra Dice an additional time");
      entry.conditionals.push(`While Raging: +${tier} Strike Rolls`);
      entry.conditionals.push("Auto-enter Feral on Transform");
      entry.conditionals.push(`Triggered/Transform: regain KP equal to 1/4 Max Capacity (${capAddSFH})`);
      entry.conditionals.push("Triggered/Transform: activate Heavenly Flame Aura OoS");
      entry.conditionals.push("While in Heavenly Flame Aura: double Battle Born Wound bonus");
      entry.conditionals.push("While in Feral State: may use Aura Maneuver only for Heavenly Flame Aura");
      entry.conditionals.push("1/Encounter: may use Signature Technique in Feral; Super Signature becomes Ultimate");
      entry.conditionals.push(`Triggered when targeted 1/Round: if hit +${2 * baseTier} DR, if not hit Basic Attack OoS`);
      entry.conditionals.push("Triggered: Ally using United Attack with you gains these AMBs for that attack");
      break;
    }

    case "ocular_acclimation": {
      _applyOptionFlags(system, "ocular_acclimation", options);
      // Sniper's Art Lv1: 1/Round perception clash → +2(T) Dodge
      entry.triggered.push({
        id: "ocular_sniper_dodge",
        name: "Sniper's Art Dodge",
        description: `1/Round targeted: Perception vs Bluff/Perception clash, win → +${2 * tier} Dodge`,
        usageLimit: "round",
        maxUses: 1
      });
      // Sniper's Art Lv2 Option: Acupuncturist / Dead Shot / All-Seeing Eye
      const ocOpt = _findOptionValue(options);
      if (ocOpt === "acupuncturist") {
        entry.triggered.push({
          id: "ocular_acupuncturist",
          name: "Acupuncturist",
          description: `1/Round Melee hit: -${2 * tier} Wound to inflict Slowed`,
          usageLimit: "round",
          maxUses: 1
        });
      } else if (ocOpt === "dead_shot" || ocOpt === "deadshot" || ocOpt === "dead shot") {
        entry.triggered.push({
          id: "ocular_deadshot",
          name: "Dead Shot",
          description: `1/Round 8+ squares: -${2 * tier} Wound to +1 Damage Category`,
          usageLimit: "round",
          maxUses: 1
        });
      } else if (ocOpt === "all_seeing_eye" || ocOpt === "all-seeing eye" || ocOpt === "all seeing eye") {
        entry.conditionals.push(`All-Seeing Eye: choose Melee/Not Melee per target: Melee +${tier} Strike, Not Melee +${2 * tier} Wound`);
      } else {
        entry.conditionals.push("Option: Acupuncturist / Dead Shot / All-Seeing Eye");
      }
      // Adaption Lv1: In Transcendent Enhancement: +1/2 Max Capacity
      entry.conditionals.push("In Transcendent Enhancement: +1/2 Max Capacity");
      // Adaption Lv2: 1/Encounter Transform into Transcendent → ignore conditions/penalties
      entry.triggered.push({
        id: "ocular_adaption_transform",
        name: "Adaption (Transform)",
        description: "1/Encounter: enter Transcendent Enhancement → ignore Combat Conditions and Threshold Penalties until end of next turn",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "peak_condition": {
      // +4(bT) Healing Surge LP
      const surgeBonus = 4 * baseTier;
      entry.bonuses.push(`+${surgeBonus} Healing Surge LP`);
      // While Healthy: +1(T) Soak and Defense
      if (system.status?.healthStatus === "healthy") {
        system.status.soak = (system.status.soak || 0) + tier;
        totals.soak += tier;
        system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + tier;
        totals.defense += tier;
        entry.bonuses.push(`+${tier} Soak & Defense (Healthy)`);
      } else {
        entry.conditionals.push(`While Healthy: +${tier} Soak & Defense`);
      }
      // If KW > 1/4 Capacity: +4(T) Wound
      entry.conditionals.push(`KW > 1/4 Capacity: +${4 * tier} Wound`);
      break;
    }

    case "spirit_control": {
      // Body Mind Spirit Lv1: +1 Stress for Perfect Ki Control Transformations
      entry.conditionals.push("+1 Stress Bonus for Perfect Ki Control Transformations");
      // Body Mind Spirit Lv2: +Z KP per PL
      const kpBonusSC = Z * level;
      system.kiPool.max += kpBonusSC;
      totals.kpMax += kpBonusSC;
      entry.bonuses.push(`+${kpBonusSC} Max KP (+${Z}/PL)`);
      // Body Mind Spirit Lv3: 1/Round reduce UA KP cost by Z(T)
      entry.triggered.push({
        id: "spirit_control_kp_reduce",
        name: "UA KP Reduction",
        description: `1/Round: reduce UA Ki Point Cost by ${Z * tier}`,
        usageLimit: "round",
        maxUses: 1
      });
      // Balanced Energy Lv1: Gain UA/Advancements per stack (ruling)
      entry.bonuses.push(`Gained ${Z} UA(s) (15 TP or less each, per stack)`);
      // Balanced Energy Lv2: 1/Encounter no KP/Capacity deduction
      entry.triggered.push({
        id: "spirit_control_free_attack",
        name: "Balanced Energy",
        description: "1/Encounter: Attacking Maneuver with no KP/Capacity deduction (total cost ≤ 1/2 Max Capacity)",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "steel_frame": {
      // +1(T) Damage Reduction
      totals.dr += tier;
      entry.bonuses.push(`+${tier} DR`);
      // Per threshold below: +1(T) Soak
      const tbSF = getThresholdsBelow(system);
      if (tbSF > 0) {
        const soakAdd = tbSF * tier;
        system.status.soak = (system.status.soak || 0) + soakAdd;
        totals.soak += soakAdd;
        entry.bonuses.push(`+${soakAdd} Soak (${tbSF} thresholds × ${tier})`);
      } else {
        entry.conditionals.push(`Per threshold below: +${tier} Soak`);
      }
      break;
    }

    case "strongest_form": {
      // +Z max Revenge Points
      entry.bonuses.push(`+${Z} max Revenge Points`);
      // Hatred Embodiment: +Z(bT) Wound and DR
      totals.wound += Z * baseTier;
      totals.dr += Z * baseTier;
      entry.bonuses.push(`+${Z * baseTier} Wound Rolls (Hatred)`);
      entry.bonuses.push(`+${Z * baseTier} DR (Hatred)`);
      // With 2+ Power: ToP Extra Dice +Z categories
      entry.conditionals.push(`While 2+ Power: ToP Extra Dice +${Z} categories`);
      break;
    }

    case "supporter": {
      // PENALTY: Halve Max LP
      const lpPenalty = Math.floor(system.lifePoints.max / 2);
      system.lifePoints.max -= lpPenalty;
      totals.lpMax -= lpPenalty;
      entry.bonuses.push(`-${lpPenalty} Max LP (halved)`);
      // While targeting Ally via Spectator: their Soak +1(bT)
      entry.conditionals.push(`Ally via Spectator: +${baseTier} their Soak`);
      break;
    }

    case "terrifying_teamwork": {
      // Dedicated Team Lv1: Select team name (ruling)
      entry.bonuses.push("Dedicated Team (select team name)");
      // Dedicated Team Lv2: Team member in Melee → +1(T) Combat Rolls
      entry.conditionals.push(`Team member in Melee Range: +${tier} Combat Rolls`);
      // Dedicated Team Lv3: Start of Turn → regain 3(bT) KP when team in melee
      entry.perRound.push({ type: "kp", amount: 3 * baseTier, label: `+${3 * baseTier} KP (Team in Melee)` });
      entry.conditionals.push(`Start of Turn (team in Melee): +${3 * baseTier} KP`);
      // United Specialist Lv1: Double United Attack Additional Power
      entry.bonuses.push("United Attack Additional Power doubled");
      // United Specialist Lv2: 1/Round United Attack without Action/KP
      entry.triggered.push({
        id: "terrifying_free_united",
        name: "Free United Attack",
        description: "1/Round: use United Attack without spending 1 Action or any KP",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    case "ultimate_class_up": {
      // With 2+ Power: +Z(bT) Strike and Dodge Rolls
      if (hasPower2Plus(system)) {
        totals.strike += Z * baseTier;
        totals.dodge += Z * baseTier;
        entry.bonuses.push(`+${Z * baseTier} Strike & Dodge (2+ Power)`);
      } else {
        entry.conditionals.push(`While 2+ Power: +${Z * baseTier} Strike & Dodge`);
      }
      break;
    }

    case "unlock_potential": {
      // Reduce Botch penalty by Z(bT) on Combat Rolls
      entry.bonuses.push(`-${Z * baseTier} Botch penalty on Combat Rolls`);
      // While 2+ Power: +Z Combat Rolls
      if (hasPower2Plus(system)) {
        totals.combatRolls += Z;
        entry.bonuses.push(`+${Z} Combat Rolls (2+ Power)`);
      } else {
        entry.conditionals.push(`While 2+ Power: +${Z} Combat Rolls`);
      }
      break;
    }

    case "vanguard": {
      // Above Bruised: +1(T) Defense and Soak (healthy OR bruised)
      const hsV = system.status?.healthStatus;
      if (hsV === "healthy" || hsV === "bruised") {
        system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + tier;
        totals.defense += tier;
        system.status.soak = (system.status.soak || 0) + tier;
        totals.soak += tier;
        entry.bonuses.push(`+${tier} Defense & Soak (Above Bruised)`);
      } else {
        entry.conditionals.push(`Above Bruised: +${tier} Defense & Soak`);
      }
      // First in Initiative or no allies: +1(T) Strike, +2(T) Wound
      entry.conditionals.push(`First among Allies/no Allies: +${tier} Strike, +${2 * tier} Wound`);
      // Reorder ally initiative
      entry.triggered.push({
        id: "vanguard_reorder",
        name: "Reorder Initiative",
        description: "2/Encounter: reorder an ally's initiative",
        usageLimit: "encounter",
        maxUses: 2
      });
      // Resilient Ally
      entry.conditionals.push("1/Round: Compel ally to succeed Steadfast (ally at 0 LP = defeated)");
      entry.conditionals.push("1/Round: Compel ally to ignore Combat Condition until end of next turn");
      break;
    }

    case "warlock": {
      // Preferred Magic Lv1: Gain Magical UA per stack
      entry.bonuses.push(`Gained ${Z} Magical UA(s) (22 TP or less each, per stack)`);
      // Preferred Magic Lv2: Z-Soul treated as Evil for Magical UA prereqs
      entry.bonuses.push("Z-Soul treated as Evil for Magical UA prerequisites");
      // Marvelous Magic Lv1: -2Z TP cost for all Magical UAs
      entry.bonuses.push(`Marvelous Magic: -${2 * Z} TP cost for Magical UAs`);
      // Marvelous Magic Lv2: -Z-1 TP cost for Magical UA Advancements
      if (Z > 1) entry.bonuses.push(`-${Z - 1} TP cost for Magical UA Advancements`);
      // Marvelous Magic Lv3: 1/Round reduce Action cost of Magical UA by 1
      entry.triggered.push({
        id: "warlock_action_reduce",
        name: "Marvelous Magic Action",
        description: "1/Round: reduce Magical UA Action Cost by 1 (0 = Instant Maneuver)",
        usageLimit: "round",
        maxUses: 1
      });
      // Wondrous White Magic Lv1: +3(bT) Healing Hands restoration
      entry.bonuses.push(`+${3 * baseTier} Healing Hands LP restoration (allies)`);
      // Wondrous White Magic Lv2: 1/Round ally targeted with Magical UA → regain 1/2 KP cost
      entry.triggered.push({
        id: "warlock_ally_kp",
        name: "Wondrous White Magic",
        description: "1/Round: ally targeted with Magical UA regains KP = 1/2 of UA KP cost",
        usageLimit: "round",
        maxUses: 1
      });
      // Mighty Mega Flare Lv1: Spend 3(T) KP for Energy Charge on Mega Flare
      entry.conditionals.push(`Mega Flare: spend ${3 * tier} KP for +1 Energy Charge`);
      // Mighty Mega Flare Lv2: 1/Encounter prevent Triggered/Defeated on Mega Flare kill
      entry.triggered.push({
        id: "warlock_mega_flare_defeat",
        name: "Mighty Mega Flare",
        description: "1/Encounter: Mega Flare defeat (KW ≥ 1/2 Max Capacity) → opponent can't use Triggered/Defeated",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Baneful Black Magic Lv1: +2(T) Magic Attack Wound
      totals.wound += 2 * tier;
      entry.bonuses.push(`+${2 * tier} Wound (Magic Attacks, Baneful Black Magic)`);
      // Baneful Black Magic Lv2: 1/Round condition → instant Magic Basic Attack OoS
      entry.triggered.push({
        id: "warlock_condition_attack",
        name: "Baneful Counterattack",
        description: "1/Round: opponent gains Combat Condition from your Magical UA/Magic Attack → Magic Basic Attack OoS",
        usageLimit: "round",
        maxUses: 1
      });
      // Elemental Expert Lv1: +2(bT) Wound for selected Elemental profile
      entry.conditionals.push(`Elemental Expert: +${2 * baseTier} Wound (selected Elemental profile)`);
      // Elemental Expert Lv2: 3/Encounter target second opponent
      entry.triggered.push({
        id: "warlock_elemental_second",
        name: "Elemental Expert Split",
        description: "1/Round 3/Encounter: non-AoE Elemental attack may target a second opponent",
        usageLimit: "round",
        maxUses: 1
      });
      // Magic Touch Lv1: Gain Transfiguration Maneuver
      entry.bonuses.push("Gain Transfiguration Maneuver");
      // Magic Touch Lv2: -3(T) KP cost Transfiguration
      entry.bonuses.push(`-${3 * tier} KP cost Transfiguration Maneuver`);
      // Magic Touch Lv3: -1 Critical Target Physical Strike (incomplete in catalog)
      entry.bonuses.push("-1 Critical Target (Physical Strike Rolls)");
      break;
    }

    case "warrior_of_earth": {
      // Improving your Skills Lv1: In Transcendent Enhancement: +1/2 Max Capacity
      entry.conditionals.push("In Transcendent Enhancement: +1/2 Max Capacity");
      // Enemy of Arrogance Lv1: Advantage on Enhanced ST
      entry.conditionals.push("Enhanced ST in Transformation: Advantage on Strike");
      // Lv2: Defeated → use ST with Last Legs
      entry.triggered.push({
        id: "warrior_earth_last_legs",
        name: "Last Legs",
        description: "Defeated: use Signature Technique with Last Legs effect",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Improving your Skills Lv3: Below Injured: Ultimate ST gains 2 Energy Charges
      entry.conditionals.push("Below Injured: Ultimate ST gains 2 Energy Charges (1/Encounter)");
      break;
    }

    case "warrior_of_namek": {
      // Namekian Tactics Lv1: In Transcendent Enhancement: +1/2 Max Capacity
      entry.conditionals.push("In Transcendent Enhancement: +1/2 Max Capacity");
      // Quiet Defender Lv1: Telepathy beyond Melee Range
      entry.bonuses.push("Telepathy passive beyond Melee Range");
      // Quiet Defender Lv2: Intervene free when ally hit below Injured
      entry.triggered.push({
        id: "warrior_namek_intervene",
        name: "Ally Intervene",
        description: "1/Encounter: Intervene free when ally hit below Injured",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Quiet Defender Lv3: Gain Counter Action when targeted
      entry.triggered.push({
        id: "warrior_namek_counter",
        name: "Counter Action",
        description: "2/Encounter: gain Counter Action when targeted",
        usageLimit: "encounter",
        maxUses: 2
      });
      // Namekian Tactics Lv3: Ally spends KP for bonus
      entry.conditionals.push(`Ally spends KP: +${baseTier} Strike or Wound to your attack (1/Round)`);
      break;
    }

    case "warrior_of_sadala": {
      // Proud Warrior Lv1: Superior State → use Cognitive Save for clashes
      entry.conditionals.push("Superior State: use Cognitive Save for any Saving Throw clash (if already Cognitive, +1(T))");
      // Proud Warrior Lv2: 1/Encounter auto-succeed failed Cognitive Clash
      entry.triggered.push({
        id: "sadala_cognitive_auto",
        name: "Proud Warrior Auto-Succeed",
        description: "1/Encounter: fail Cognitive Clash initiated by another → choose to succeed instead",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Warrior's Way Lv1: In Transcendent Enhancement: +1/2 Max Capacity
      entry.conditionals.push("In Transcendent Enhancement: +1/2 Max Capacity");
      // Warrior's Way Lv2: In Enhancement: +bT Soak, -1 Cognitive Save CT
      if (hasActiveTransType(system, "enhancement")) {
        system.status.soak = (system.status.soak || 0) + baseTier;
        totals.soak += baseTier;
        entry.bonuses.push(`+${baseTier} Soak (In Enhancement)`);
        if (system.savingThrows?.cognitive) {
          system.savingThrows.cognitive.ct = Math.max(2, (system.savingThrows.cognitive.ct || 10) - 1);
          entry.bonuses.push("-1 Cognitive Save CT (In Enhancement)");
        }
      } else {
        entry.conditionals.push(`In Enhancement: +${baseTier} Soak, -1 Cognitive Save CT`);
      }
      // Warrior's Way Lv3: 1/Encounter Transform into Enhancement → Superior State
      entry.triggered.push({
        id: "sadala_transform_superior",
        name: "Warrior's Way Superior",
        description: "1/Encounter: enter Enhancement via Transform → Superior State until end of next turn",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "weak_slayer": {
      // Superior Being Lv1: +2(bT) Wound vs lower ToP
      entry.conditionals.push(`vs lower ToP: +${2 * baseTier} Wound`);
      // Superior Being Lv2: Start of Combat Round → regain 2(bT) KP per lower-ToP opponent (not Minions)
      entry.perRound.push({ type: "kp", amount: 2 * baseTier, label: `+${2 * baseTier} KP × lower ToP opponents` });
      entry.conditionals.push(`Start of Round: +${2 * baseTier} KP per lower-ToP opponent (no Minions, not if any opponent has higher ToP)`);
      // Superior Being Lv3: Start of Turn → gain Standard Action if highest ToP
      entry.conditionals.push("Start of Turn: if highest ToP in encounter → gain 1 Standard Action");
      // Blood in the Water Lv1: +1d4(T) Wound vs below Injured or Conditioned
      entry.conditionals.push(`vs below Injured/Conditioned: +${tier}d4 Wound`);
      // Blood in the Water Lv2: Healthy → Bonus Momentum twice per round
      entry.conditionals.push("While Healthy: Bonus Momentum can apply twice per Combat Round");
      // Blood in the Water Lv3: Knock through threshold → regain 4(bT) LP
      entry.triggered.push({
        id: "weak_slayer_threshold_heal",
        name: "Blood in the Water",
        description: `Knock opponent through threshold → regain ${4 * baseTier} LP`,
        usageLimit: null,
        maxUses: null
      });
      break;
    }

    case "zenkai": {
      // Z = current Zenkai stacks (0-3), tracked via gradeOrStacks

      // On the Brink [Passive, Lv1]: "Each time you gain a rank of Zenkai, gain an Attribute Addition"
      entry.conditionals.push(`Gained ${Z} Attribute Addition(s) (1 per Zenkai rank)`);

      // On the Brink [Triggered/Undying, Lv2]: "+Z(bT) Combat Rolls until end of next turn"
      if (Z > 0) {
        entry.triggered.push({
          id: "zenkai_undying",
          name: "On the Brink (Undying)",
          description: `+${Z * baseTier} Combat Rolls (until end of next turn)`,
          usageLimit: "encounter",
          maxUses: null
        });
      }

      // Saiyan Spirit [Triggered, 1/Round, Lv1]:
      // "When you use an Attacking Maneuver while you have 2+ stacks of Battle Born
      //  on your Wound Rolls, apply your ToP Extra Dice to the Wound Roll an additional time"
      const bbWoundsZenkai = system.battleBorn?.wound || 0;
      if (bbWoundsZenkai >= 2) {
        entry.bonuses.push("Saiyan Spirit: Apply ToP Extra Dice to Wound an additional time (1/Round, 2+ BB Wounds)");
      } else {
        entry.conditionals.push("Saiyan Spirit: 2+ BB on Wounds → apply ToP Extra Dice to Wound additional time (1/Round)");
      }

      // Saiyan Spirit [Triggered/Superior, Lv2]:
      // "Increase the Dice Category of your ToP Extra Dice by Z Categories until start of next turn"
      if (Z > 0) {
        entry.triggered.push({
          id: "zenkai_superior",
          name: "Saiyan Spirit (Superior)",
          description: `+${Z} Dice Categories to ToP Extra Dice (until start of next turn)`,
          usageLimit: "round",
          maxUses: 1
        });
      }
      break;
    }

    // ========== GREATER AWAKENINGS ==========

    case "android_conversion": {
      // Pickled Brain Lv1: Regain up to 2 Mind-Category Racial Traits (ruling)
      entry.bonuses.push("Regained up to 2 Mind-Category Racial Traits from former race");
      // Pickled Brain Lv2: Analysis uses Scholarship Modifier
      entry.bonuses.push("Analysis Maneuver uses Scholarship Modifier");
      // Pickled Brain Lv3: 1/Round double Analysis bonus on Strike or Wound
      entry.triggered.push({
        id: "android_conv_analysis",
        name: "Double Analysis Bonus",
        description: "1/Round: targeting opponent with Investigation Analysis → double Strike or Wound bonus",
        usageLimit: "round",
        maxUses: 1
      });
      // Flesh to Steel Lv1: +1(bT) Damage Reduction
      totals.dr += baseTier;
      entry.bonuses.push(`+${baseTier} DR (Flesh to Steel)`);
      // Flesh to Steel Lv2: +1/2 former Race's Racial Life Modifier
      entry.bonuses.push("+1/2 former Race Racial Life Modifier");
      // Flesh to Steel Lv3: Become Android, gain Body Racial Traits
      entry.bonuses.push("Race becomes Android; gain all Android Body Racial Traits");
      // Flesh to Steel Lv4: Wonders of Technology = Construct
      entry.bonuses.push("Wonders of Technology option set to Construct");
      break;
    }

    case "ascension": {
      // Celestial Perfection Lv1: 1/Round +1/2 IN/SC/PE Mod to Wound
      const inModAsc = system.attributes.in?.totalScore ?? system.attributes.in?.score ?? 0;
      const scModAsc = system.attributes.sc?.totalScore ?? system.attributes.sc?.score ?? 0;
      const peModAsc = system.attributes.pe?.totalScore ?? system.attributes.pe?.score ?? 0;
      const maxModAsc = Math.max(inModAsc, scModAsc, peModAsc);
      entry.triggered.push({
        id: "ascension_wound_boost",
        name: "Celestial Perfection Wound",
        description: `1/Round: +${Math.floor(maxModAsc / 2)} Wound (1/2 of best IN/SC/PE Mod: ${maxModAsc})`,
        usageLimit: "round",
        maxUses: 1
      });
      // Celestial Perfection Lv2: 1/Encounter Cognitive Clash win → Superior State
      entry.triggered.push({
        id: "ascension_cognitive_superior",
        name: "Celestial Superior",
        description: "1/Encounter: win Cognitive Clash → Superior State until end of next turn",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Skilled Watcher Lv1: Counter Action spent → regain 2(bT) KP
      system.aptitudes.counterActionKiRegen = (system.aptitudes.counterActionKiRegen || 0) + 2 * baseTier;
      entry.bonuses.push(`Counter Action spent: regain ${2 * baseTier} KP`);
      // Skilled Watcher Lv2: 2 God Maneuvers in God Ki State
      entry.bonuses.push("2 God Maneuvers (permanent, in God Ki State)");
      // Skilled Watcher Lv3: 2/Encounter auto Botch Strike → auto Crit Wound on ST
      entry.triggered.push({
        id: "ascension_botch_crit",
        name: "Skilled Watcher Botch→Crit",
        description: "2/Encounter: ST auto-Botch Strike → auto-Crit Wound",
        usageLimit: "encounter",
        maxUses: 2
      });
      break;
    }

    case "built_different": {
      // Simply Greater Lv1: Cannot gain Alt/Legendary Forms
      entry.bonuses.push("Cannot gain Alternate/Legendary Forms");
      // Simply Greater Lv2: +2 to 2 chosen AMBs (not FO/MA)
      entry.bonuses.push("+2 to 2 chosen AMBs (not FO/MA)");
      // Simply Greater Lv3: In Enhancement Power: +1(T) Combat Rolls and Soak
      if (hasActiveTransType(system, "enhancement")) {
        totals.combatRolls += tier;
        system.status.soak = (system.status.soak || 0) + tier;
        totals.soak += tier;
        entry.bonuses.push(`+${tier} Combat Rolls & Soak (In Enhancement)`);
      } else {
        entry.conditionals.push(`In Enhancement: +${tier} Combat Rolls & Soak`);
      }
      // Simply Greater Lv4: 1/Round targeted → add ToP Extra Dice to Dodge
      entry.triggered.push({
        id: "built_diff_dodge",
        name: "Extra Dice Dodge",
        description: "1/Round targeted: add ToP Extra Dice (min 1d4) to Dodge Rolls",
        usageLimit: "round",
        maxUses: 1
      });
      // Simply Greater Lv5: 1/Round attacking → add ToP Extra Dice to Strike & Wound
      entry.triggered.push({
        id: "built_diff_strike_wound",
        name: "Extra Dice Strike/Wound",
        description: "1/Round attacking: add ToP Extra Dice (min 1d4) to Strike & Wound Rolls",
        usageLimit: "round",
        maxUses: 1
      });
      // Manifesting Power Lv1: Start of Combat Round → gain 2 Greatness Points per Manifested Power (max 2(bT))
      entry.perRound.push({ type: "greatness", amount: 2 * baseTier, label: `Greatness Points (max ${2 * baseTier})` });
      entry.conditionals.push(`Start of Round: gain 2 Greatness Points per Manifested Power (max ${2 * baseTier})`);
      // Manifesting Power Lv2: Gain Greatness → regain 2× LP
      entry.conditionals.push("Gain Greatness Points: regain 2× LP");
      // Manifesting Power Lv3: 1/Round instant spend Greatness → regain 2× KP or 3× Capacity
      entry.triggered.push({
        id: "built_diff_spend_greatness",
        name: "Spend Greatness",
        description: "1/Round Instant: spend Greatness → regain 2× KP or 3× Capacity",
        usageLimit: "round",
        maxUses: 1
      });
      // Manifesting Power Lv4: Spend Greatness on Combat Roll → +2× Combat Roll
      entry.conditionals.push("Spend Greatness Points on Combat Roll: +2× to that Roll");
      // Manifesting Power Lv5: 1/Round knock through threshold → gain Greatness = # Manifested Powers
      entry.triggered.push({
        id: "built_diff_threshold_greatness",
        name: "Threshold Greatness",
        description: "1/Round: knock opponent through threshold → gain Greatness = # Manifested Powers (can exceed max)",
        usageLimit: "round",
        maxUses: 1
      });
      // Manifesting Power Lv6: 1/Encounter Transform into Transcendent → gain Greatness
      entry.triggered.push({
        id: "built_diff_trans_greatness",
        name: "Transform Greatness",
        description: "1/Encounter: enter Transcendent Enhancement → gain Greatness = # Manifested Powers (can exceed max)",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "commander": {
      _applyOptionFlags(system, "commander", options);
      // Motley Crew: Duplicate minions not considered minions
      entry.bonuses.push("Duplicate Minions not considered Minions");
      entry.bonuses.push("All Minions gain a Minion Class trait");
      // Leadership Methods Lv1: PENALTY: -2Z Might and Combat Rolls
      const mightPenCMD = 2 * Z;
      system.status.might = Math.max(0, (system.status.might || 0) - mightPenCMD);
      totals.might -= mightPenCMD;
      totals.combatRolls -= mightPenCMD;
      entry.bonuses.push(`-${mightPenCMD} Might & Combat Rolls (Leadership Methods)`);
      // Leadership Methods Lv2: 1st/4th stack gain Leadership trait
      entry.bonuses.push("1st stack: gain Leadership trait; 4th stack: second Leadership trait");
      // Leadership Methods Lv3: 1/Round command increase minion Combat Rolls
      entry.triggered.push({
        id: "commander_command",
        name: "Command Minion",
        description: `1/Round: command → increase Minion Combat Rolls by ${tier}`,
        usageLimit: "round",
        maxUses: 1
      });
      // Battlefield General: Ignore penalty; if all Minions Defeated → bonuses
      entry.triggered.push({
        id: "battlefield_general",
        name: "Battlefield General",
        description: `Triggered/Power: ignore Leadership penalty; if all Minions Defeated +${mightPenCMD} Combat Rolls & Soak`,
        usageLimit: "power",
        maxUses: null
      });
      // Battlefield General Lv2: 1/Round Instant command
      entry.triggered.push({
        id: "battlefield_general_instant",
        name: "Instant Command",
        description: "1/Round: Command as Instant Maneuver",
        usageLimit: "round",
        maxUses: 1
      });
      // Leadership options (many complex sub-traits)
      entry.conditionals.push("Fellowship Leader: Start of Combat gain Bond stacks");
      entry.conditionals.push(`Blitzkrieg Commander: Minion +${tier} Strike & Wound; 1/Turn Minion Basic Attack`);
      entry.conditionals.push(`Iron Wall Commander: Minion +${tier} Defense & Soak; 1/Round Minion Intervene`);
      entry.conditionals.push("Minion Collector: Minion +Max LP; 24h creation; 1/Encounter convert opponent Minion");
      entry.conditionals.push("Diversity Quota: +Wound per diverse Minion type; 1/Round Minion Intervene options");
      entry.conditionals.push("Strong Bond: Ascended Minion bonuses; 1/Round Basic Attack; Triggered/Defeated take control");
      entry.conditionals.push("Leader in Metal: BJ benefits; adjacent Minion bonus; Minion increases BJ durability");
      break;
    }

    case "dedicated_warrior": {
      // Dedication to a Style Lv1: Cannot gain Alt/Legendary Forms
      entry.bonuses.push("Cannot gain Alternate/Legendary Forms");
      // Dedication to a Style Lv2: AMB increase (conditional)
      const dwAMB = tier >= 5 ? 2 * tier : tier;
      entry.conditionals.push(`Not in Trans / Greater Enhancement as Transcendent: +${dwAMB} AMB(AG/FO/TE/IN/MA)`);
      // Dedication to a Style Lv3: Per Greater Power stack → +1 Dice Category ToP Extra Dice
      entry.conditionals.push("Per Greater Power stack: +1 Dice Category ToP Extra Dice");
      // Dedication to a Style Lv4: 1/Round instant remove Greater Power → regain 4(T) KP each
      entry.triggered.push({
        id: "dedicated_remove_power",
        name: "Greater Power KP",
        description: `1/Round Instant: remove Greater Power stacks → regain ${4 * tier} KP each`,
        usageLimit: "round",
        maxUses: 1
      });
      // Dedication to a Style Lv5: 1/Encounter enter Greater Enhancement as Transcendent → Superior
      entry.triggered.push({
        id: "dedicated_superior",
        name: "Dedication Superior",
        description: "1/Encounter: enter Greater Enhancement as Transcendent → Superior State (ignore Superior downside)",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Dedication to the Self Lv1: +2/PL Max LP and Max KP
      const lpkpDW = 2 * level;
      system.lifePoints.max += lpkpDW;
      system.kiPool.max += lpkpDW;
      totals.lpMax += lpkpDW;
      totals.kpMax += lpkpDW;
      entry.bonuses.push(`+${lpkpDW} Max LP (+2/PL)`);
      entry.bonuses.push(`+${lpkpDW} Max KP (+2/PL)`);
      // Dedication to the Self Lv2: Capacity Rate +1/2 if no other effects increasing it
      entry.conditionals.push("If no other Capacity Rate increases: +1/2 Capacity Rate (rounded up)");
      // Dedication to the Self Lv3: 1/Round below Injured, not in Trans or Greater as Transcendent → +1 ToP
      entry.triggered.push({
        id: "dedicated_top_boost",
        name: "Breakthrough",
        description: "1/Round: below Injured + not in Trans (or Greater as Transcendent) → +1 ToP until end of turn",
        usageLimit: "round",
        maxUses: 1
      });
      // Dedication to the Self Lv4: 1/Encounter not in Trans → Transform OoS + regain 2d10(T) LP
      entry.triggered.push({
        id: "dedicated_emergency_trans",
        name: "Emergency Transform",
        description: `1/Encounter Triggered/Threshold: not in Trans → Transform OoS into Greater Enhancement as Transcendent + regain ${2 * tier}d10 LP`,
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "divine_candidate": {
      // God-in-Training Lv1: Always in God Ki State; if another God Ki effect → +1(T) DR and Wound
      entry.bonuses.push("Always in God Ki State");
      entry.conditionals.push(`If another effect grants God Ki State: +${tier} DR and +${tier} Wound instead`);
      // God-in-Training Lv2: In God Ki Transformation: +1(T) Combat Rolls and Soak
      if (hasActiveGodKiTrans(system)) {
        totals.combatRolls += tier;
        system.status.soak = (system.status.soak || 0) + tier;
        totals.soak += tier;
        entry.bonuses.push(`+${tier} Combat Rolls & Soak (God Ki Trans)`);
      } else {
        entry.conditionals.push(`In God Ki Trans: +${tier} Combat Rolls & Soak`);
      }
      // God-in-Training Lv3: Select 1 God Maneuver
      entry.bonuses.push("1 God Maneuver access");
      // Divine Superiority Lv1: Start of Combat Round → regain 2(bT) Divine KP
      entry.perRound.push({ type: "divineKi", amount: 2 * baseTier, label: `+${2 * baseTier} Divine KP` });
      entry.bonuses.push(`+${2 * baseTier} Divine KP/round`);
      // Divine Superiority Lv2: 1/Encounter Triggered/Power in God Ki Trans → Superior State
      entry.triggered.push({
        id: "divine_cand_superior",
        name: "Divine Superiority",
        description: "1/Encounter Triggered/Power: in God Ki Trans → Superior State until end of next turn",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "divine_origin": {
      _applyOptionFlags(system, "divine_origin", options);
      // Remove a Negative Aspect from God Ki Transformations
      entry.bonuses.push("Remove 1 Negative Aspect from God Ki Transformations");
      // Divine Enhancement: +2 Stress Bonus while using God Ki Trans
      if (hasActiveGodKiTrans(system)) {
        totals.stressBonus += 2;
        system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 2;
        entry.bonuses.push("+2 Stress Bonus (Divine Enhancement, God Ki Trans active)");
      } else {
        entry.conditionals.push("Divine Enhancement: +2 Stress Bonus in God Ki Trans");
      }
      // 1/Round: regain 3(bT) Divine Ki Points
      entry.perRound.push({ type: "divineKi", amount: 3 * baseTier, label: `+${3 * baseTier} Divine KP` });
      entry.bonuses.push(`+${3 * baseTier} Divine KP/round`);
      break;
    }

    case "earned_power": {
      // Pragmatic Killer Lv1: Cold Blooded resource (max 3), per stack +1 Dice Category ToP Extra Dice
      entry.conditionals.push("End of Turn with 2+ Cruelty: gain 1 Cold Blooded (max 3)");
      entry.conditionals.push("Per Cold Blooded stack: +1 Dice Category ToP Extra Dice (Strike & Wound)");
      // Pragmatic Killer Lv2: Triggered/Threshold succeed steadfast → spend Cold Blooded for Healing Surge OoS
      entry.triggered.push({
        id: "earned_steadfast_surge",
        name: "Cold Blooded Surge",
        description: "Triggered/Threshold: succeed Steadfast → spend 1 Cold Blooded for Healing Surge OoS",
        usageLimit: null,
        maxUses: null
      });
      // Power Gathering Lv1: Only 1 Energy Charge for Brutal Assault
      entry.bonuses.push("Brutal Assault requires only 1 Energy Charge");
      // Power Gathering Lv2: In highest ToP Req Trans → apply ToP Extra Dice to Wound again
      entry.conditionals.push("In highest ToP-Req Transformation: apply ToP Extra Dice to Wound additional time");
      // Power Gathering Lv3: 1/Round ST hit with Brutal Assault → spend Cold Blooded for extra dice
      entry.triggered.push({
        id: "earned_brutal_cold",
        name: "Cold Blooded Brutal",
        description: "1/Round: ST hit with Brutal Assault → spend 1 Cold Blooded to apply Brutal Assault Extra Dice additional time",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    case "energy_consumption": {
      // Hunger for Power Lv1: Lifeforce resource, gain from Energy Drain (max Z)
      entry.conditionals.push(`Lifeforce resource (max ${Z}): gain 1 per successful Energy Drain`);
      // Hunger for Power Lv2: Gain Lifeforce from Miracle Empowerment
      entry.conditionals.push("Miracle Empowerment: gain 1 Lifeforce");
      // Hunger for Power Lv3: Only lose 1/2 Z Lifeforce per encounter
      entry.bonuses.push(`Only lose ${Math.ceil(Z / 2)} Lifeforce at end of encounter (not all)`);
      // Hunger for Power Lv4: AMB(AG/FO/TE/MA) +Lifeforce amount
      entry.conditionals.push("AMB(AG/FO/TE/MA) increased by Lifeforce amount");
      // Power Restoration Lv1: +10Z Max KP
      const kpAddEC = 10 * Z;
      system.kiPool.max += kpAddEC;
      totals.kpMax += kpAddEC;
      entry.bonuses.push(`+${kpAddEC} Max KP (+10×Z)`);
      // Power Restoration Lv2: Max Lifeforce → +2(T) DR
      entry.conditionals.push(`At max Lifeforce (${Z}): +${2 * tier} DR`);
      // Power Restoration Lv3: <1/2 Lifeforce → Energy Drain costs 0 KP
      entry.conditionals.push(`Lifeforce < ${Math.ceil(Z / 2)}: Energy Drain KP Cost = 0`);
      // Power Restoration Lv4: Gain Lifeforce → regain 2(bT) LP
      entry.conditionals.push(`Gain Lifeforce: regain ${2 * baseTier} LP`);
      // Power Restoration Lv5: 1/Round ST spend Lifeforce → KP reduction + Energy Charge
      entry.triggered.push({
        id: "energy_cons_st_lifeforce",
        name: "Lifeforce ST Boost",
        description: `1/Round: ST → spend up to ${Math.ceil(Z / 2)} Lifeforce, each: -${tier} KP cost + 1 Energy Charge`,
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    case "eternally_entwined": {
      // Forever Together Lv1: Select Eternally Suppressed Character (ruling)
      entry.bonuses.push("Eternally Suppressed Character selected (cannot leave fusion)");
      // Forever Together Lv2: PL gain → Suppressed Character also gains
      entry.bonuses.push("PL gain shared with Eternally Suppressed Character");
      // Forever Together Lv3: 1/Round Suppressed Character's ST → apply their Might to Wound
      entry.triggered.push({
        id: "entwined_suppressed_st",
        name: "Suppressed ST Might",
        description: "1/Round: using Suppressed Character's ST → apply their Might to Wound",
        usageLimit: "round",
        maxUses: 1
      });
      // Majin Mix Lv1: AMB(All) +Suppressed Character's ToP
      entry.conditionals.push("AMB(All) increased by Suppressed Character's Tier of Power");
      // Majin Mix Lv2: 1/Encounter swap to Suppressed Character
      entry.triggered.push({
        id: "entwined_swap",
        name: "Majin Mix Swap",
        description: "1/Encounter Instant: swap to Suppressed Character's Scores/Race/Traits/Trans/ST/UA/Auras/Talents (keep LP/KP)",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "greatest_warrior": {
      // Savior of Worlds Lv1: +1d4 Personality Skill Checks
      entry.bonuses.push("+1d4 Personality Skill Checks");
      // Savior of Worlds Lv2: 1/Encounter spend all Actions → ally gains Energy Charges
      entry.triggered.push({
        id: "greatest_ally_charges",
        name: "Savior of Worlds",
        description: "1/Encounter Instant: spend all Actions → ally's next attack gains equal Energy Charges",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Savior of Worlds Lv3: 1/Round auto-succeed Strike (no KW, no EC, no Combo/Rapid, no AoE, no Inaccurate/Deadlink)
      entry.triggered.push({
        id: "greatest_auto_strike",
        name: "Auto-Succeed Strike",
        description: "1/Round: auto-succeed Strike Roll (no KW, no EC, no Combo/Rapid Fire, no AoE, no Inaccurate/Deadlink)",
        usageLimit: "round",
        maxUses: 1
      });
      // Truly Unbeatable Lv1: PENALTY: Halve Max LP and base Soak
      const lpPenGW = Math.floor(system.lifePoints.max / 2);
      system.lifePoints.max -= lpPenGW;
      totals.lpMax -= lpPenGW;
      entry.bonuses.push(`-${lpPenGW} Max LP (halved)`);
      const soakPenGW = Math.floor(system.status.soak / 2);
      system.status.soak = Math.max(baseTier, system.status.soak - soakPenGW);
      totals.soak -= soakPenGW;
      entry.bonuses.push(`-${soakPenGW} Soak (halved)`);
      // Truly Unbeatable Lv2: -1(bT) Combat Rolls, -1 effective ToP for Extra Dice
      totals.combatRolls -= baseTier;
      entry.bonuses.push(`-${baseTier} Combat Rolls`);
      entry.bonuses.push("-1 effective ToP for Extra Dice");
      // Truly Unbeatable Lv3: Attacks < 1/2 Max LP can't reduce LP below 1
      entry.conditionals.push(`Attacks dealing < ${Math.floor(system.lifePoints.max / 2)} Damage can't reduce LP below 1`);
      break;
    }

    case "improved_schematics": {
      // Restructured Design Lv1: Change Specialized Features options (ruling)
      entry.bonuses.push("May change Specialized Features options");
      // Restructured Design Lv2: -1(bT) KP cost all Attacking Maneuvers
      system.aptitudes.allAttackKiReduction = (system.aptitudes.allAttackKiReduction || 0) + baseTier;
      entry.bonuses.push(`-${baseTier} KP cost all Attacking Maneuvers`);
      // Restructured Design Lv3: Start of Combat Round → regain 2(bT) KP
      entry.perRound.push({ type: "kp", amount: 2 * baseTier, label: `+${2 * baseTier} KP` });
      system.aptitudes.kiRegenPerRound = (system.aptitudes.kiRegenPerRound || 0) + 2 * baseTier;
      entry.bonuses.push(`+${2 * baseTier} KP/round`);
      // Upgraded Features Lv1: Transcendent (not Power Battery) → +1/2 Max Capacity
      entry.conditionals.push("Transcendent (not Power Battery): +1/2 Max Capacity");
      // Upgraded Features Lv2: Transcendent (Power Battery) → +2(T) Wound
      entry.conditionals.push(`Transcendent (Power Battery): +${2 * tier} Wound`);
      // Upgraded Features Lv3+: Specialized Feature-dependent effects
      entry.conditionals.push(`Surging Power: 2+ Power → +${baseTier} DR`);
      entry.conditionals.push(`Weapon Ports: -${2 * tier} ST KP cost`);
      entry.conditionals.push(`Power Absorption: Physical hit → steal ${baseTier} KP`);
      entry.conditionals.push(`Enhanced Reflexes: Start of Round spend Counter Action → +${2 * baseTier} Defense`);
      entry.conditionals.push("Heroic Style: Hype uses PE Modifier");
      entry.conditionals.push(`Small Scale: base Size = Nano, +${baseTier} Soak`);
      entry.conditionals.push(`Large Scale: base Size = Gigantic, +${baseTier} Defense`);
      entry.conditionals.push(`Extension Feature: +${baseTier}/square Physical Wound (max ${4 * baseTier})`);
      break;
    }

    case "insatiable": {
      // Favored Snack Lv1: Gain Absorption for transfigured characters
      entry.bonuses.push("Absorption Maneuver available for Transfigured Characters");
      // Favored Snack Lv2: Only 1 Absorbed Character, doubled AMB increase
      entry.bonuses.push("Only 1 Absorbed Character; double AMB increase from Absorbed Character");
      // Favored Snack Lv3: PL gain shared with Absorbed Character
      entry.bonuses.push("PL gain shared with Absorbed Character");
      // Ceaseless Hunger Lv1: 1/Encounter reduce Transfiguration Action by 1
      entry.triggered.push({
        id: "insatiable_fast_transfig",
        name: "Quick Transfiguration",
        description: "1/Encounter: reduce Transfiguration Action cost by 1 vs Transfigured target",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Ceaseless Hunger Lv2: 1/Round Absorption against Transfigured
      entry.conditionals.push("1/Round: use Absorption against Transfigured character");
      // Ceaseless Hunger Lv3: 1/Round Movement toward Transfigured
      entry.conditionals.push("1/Round: Movement toward nearest Transfigured character");
      // Ceaseless Hunger Lv4: 1/Round ST loses Absorbed Character's ST signature
      entry.conditionals.push("1/Round: your ST gains Absorbed Character's lost signature properties");
      // Ceaseless Hunger Lv5: 1/Encounter defeat Absorbed Character → gain Power
      entry.triggered.push({
        id: "insatiable_absorb_power",
        name: "Absorb Defeat Power",
        description: "1/Encounter: defeat Absorbed Character → gain Power",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "jacket_specialist": {
      // Dedicated Pilot Lv1: PENALTY: Halve Max LP, reduce Soak/Combat Rolls while not Piloting
      const lpPenJS = Math.floor(system.lifePoints.max / 2);
      system.lifePoints.max -= lpPenJS;
      totals.lpMax -= lpPenJS;
      totals.soak -= 2 * baseTier;
      system.status.soak = Math.max(baseTier, (system.status.soak || 0) - 2 * baseTier);
      totals.combatRolls -= 2 * baseTier;
      entry.bonuses.push(`-${lpPenJS} Max LP (halved, not Piloting)`);
      entry.bonuses.push(`-${2 * baseTier} Soak & Combat Rolls (not Piloting)`);
      entry.conditionals.push("While Piloting: bonuses apply to Battle Jacket instead");
      // Dedicated Pilot: Combat Roll boost per Piloting ranks
      entry.conditionals.push("Piloting: Combat Rolls +1 per Piloting rank");
      // Dedicated Pilot: Hype uses PE Modifier
      entry.conditionals.push("Hype Maneuver uses PE Modifier instead of Score");
      // Dedicated Pilot: 1/Encounter BJ destruction protection
      entry.triggered.push({
        id: "jacket_protect_bj",
        name: "Battle Jacket Protection",
        description: "1/Encounter: when BJ would be destroyed, prevent destruction (LP set to 1)",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Jacket Crafter Lv1: Start of combat → single BJ duration doubled
      entry.conditionals.push("Start of Combat: single BJ's duration doubled");
      // Jacket Crafter Lv2: 1/Encounter 3-Action repair
      entry.triggered.push({
        id: "jacket_repair",
        name: "Jacket Repair",
        description: "1/Encounter: spend 3 Actions to repair destroyed BJ",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Jacket Crafter Lv3: Analysis uses Scholarship Modifier
      entry.bonuses.push("Analysis Maneuver uses Scholarship Modifier");
      // Jacket Crafter Lv4: BJ LP/KP per PL
      entry.bonuses.push("BJ Max LP/KP increased per Power Level");
      // Jacket Crafter Lv5: Craft skill ranks apply effects
      entry.conditionals.push("Craft ranks apply additional BJ effects");
      break;
    }

    case "marvelous_master": {
      // Marvelous Minion: Ruling special minion creation, conversions, ToP increase
      entry.bonuses.push("Marvelous Minion: special minion creation rules");
      entry.conditionals.push("Auto: non-targeted minion under ARC control");
      entry.conditionals.push("Auto: defeated → conversion attempt");
      entry.triggered.push({
        id: "master_convert",
        name: "Convert Opponent",
        description: "1/Encounter: convert opponent minion to your control",
        usageLimit: "encounter",
        maxUses: 1
      });
      entry.bonuses.push("+1 passive Tier of Power for Minions");
      // Non-Combatant Lv1: +1(T) Initiative
      system.aptitudes.initiative = (system.aptitudes.initiative || 0) + tier;
      entry.bonuses.push(`+${tier} Initiative`);
      // Non-Combatant Lv2: PENALTY: Halve Max LP
      const lpPenMM = Math.floor(system.lifePoints.max / 2);
      system.lifePoints.max -= lpPenMM;
      totals.lpMax -= lpPenMM;
      entry.bonuses.push(`-${lpPenMM} Max LP (halved)`);
      // Non-Combatant: With Minion penalties
      entry.conditionals.push(`With Minion: -${2 * tier} Soak, DR, Combat Rolls`);
      // Non-Combatant: Scheme Points resource
      entry.conditionals.push("Scheme Points resource: gain from targeting allies, thresholds, etc.");
      entry.triggered.push({
        id: "master_scheme_command",
        name: "Scheme Command",
        description: "1/Round Instant: spend Scheme Points to command minion",
        usageLimit: "round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "master_scheme_ability",
        name: "Scheme Ability",
        description: "1/Round Instant: spend Scheme Points for special ability effect",
        usageLimit: "round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "master_scheme_shield",
        name: "Scheme Shield Aura",
        description: "1/Round Instant: spend Scheme Points to activate Shield Aura",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    case "master_class": {
      _applyOptionFlags(system, "master_class", options);
      // Advanced Class Lv1: AMB increased by Initial Class AMBs
      entry.bonuses.push("AMB increased by Initial Class AMBs");
      // Advanced Class Lv2: Class-dependent option effects
      entry.conditionals.push(`Fighter: reduce Opponent Defense by ${tier} in Melee`);
      entry.conditionals.push(`Swordsman: +${tier} Armed Attack Wound`);
      entry.conditionals.push(`Turtle Hermit: +${tier} Energy-Foundation Wound`);
      entry.conditionals.push(`Crane Hermit: +${tier} Magic-Foundation Wound`);
      entry.conditionals.push(`Dark Warrior: +${tier} Combat Rolls vs Conditioned opponents`);
      entry.conditionals.push(`Shadow Knight: +${tier} Weapon Attack Wound`);
      entry.conditionals.push(`Healing Priest: +${3 * baseTier} Healing Hands restoration`);
      entry.conditionals.push(`Summoning Priest: +${tier} Minion Combat Rolls`);
      entry.conditionals.push(`Grand Chef: crafted Food items gain +${tier} bonus`);
      entry.conditionals.push("Ultimate: Apply ToP Extra Dice to Wound additional time");
      entry.conditionals.push(`Plasma: +${2 * tier} Elemental Wound`);
      entry.conditionals.push(`Karma: +${tier} Wound & Soak per Karma Point spent`);
      // Power of the Master Lv1: 1/Encounter Triggered/Superior → +1 ToP until end of turn
      entry.triggered.push({
        id: "master_class_top",
        name: "Power of the Master",
        description: "1/Encounter Triggered/Superior: +1 Tier of Power until end of turn",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Armed Master Lv1: In Transformation → +2(T) Wound (Armed/Unarmed)
      entry.conditionals.push(`In Transformation: +${2 * tier} Wound (Armed/Unarmed Master)`);
      break;
    }

    case "master_of_mimicry": {
      _applyOptionFlags(system, "master_of_mimicry", options);
      // +2(T) Wound on Copied Techniques
      system.aptitudes.copiedTechniqueWoundBonus = (system.aptitudes.copiedTechniqueWoundBonus || 0) + 2 * tier;
      entry.bonuses.push(`+${2 * tier} Wound (Copied Techniques)`);
      entry.conditionals.push(`Enduring Mimicry: +${baseTier} DR vs known STs`);
      break;
    }

    case "preferred_possession": {
      _applyOptionFlags(system, "preferred_possession", options);
      entry.bonuses.push("Whenever you gain a Power Level, your Possessed Character also gains it");
      entry.conditionals.push("Molded Body: 1/Encounter on entering one-sided Possession fusion, redistribute up to 1(bT) across up to 2 AG/FO/TE/MA");
      entry.conditionals.push("Created Body: create a Special Android Host minion using modified character creation");
      entry.conditionals.push("Claimed Body: when entering one-sided Possession fusion as Dominant, use Transformation Maneuver or Power Up OoS");
      entry.triggered.push({
        id: "preferred_possession_instant",
        name: "Instant Possession",
        description: "1/Encounter: use Possession Maneuver as an Instant Maneuver",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "omega": {
      // Per stack: gain Star Character's Supernatural Power
      entry.bonuses.push(`${Z} Supernatural Powers gained`);
      entry.bonuses.push(`+${Z * baseTier} max LP reduction from Negative Energy`);
      break;
    }

    case "perfection": {
      _applyOptionFlags(system, "perfection", options);
      // Resource: 2Z Perfect Points per round
      entry.perRound.push({ type: "pp", amount: 2 * Z, label: `+${2 * Z} Perfect Points` });
      entry.bonuses.push(`+${2 * Z} Perfect Points per round`);
      entry.conditionals.push(`Upgraded Core: +${Z * baseTier} KP regain`);
      entry.conditionals.push(`Better Trait: +${tier} Soak & Wound`);
      break;
    }

    case "pure_progress": {
      // Resource-based: Progress stacks (conditional)
      entry.conditionals.push(`2+ Progress: -1 Critical Target`);
      entry.conditionals.push(`3+ Progress: +1 AMB(AG/FO/TE/MA)`);
      entry.conditionals.push(`Per 3 Progress: -${tier} ST/UA KP cost`);
      break;
    }

    case "seeking_skill": {
      // Variable based on converted Perks/Skill Points
      entry.conditionals.push("Per 2 Skill Points: +1 Combat Rolls, Saves, max Energy Charges");
      entry.bonuses.push("ST Wound +1/10th TP from Skill Improvements");
      break;
    }

    case "seeking_strength": {
      // +1/4 Might to Wound and Soak
      const mightVal = system.status.might || 0;
      const msBonus = Math.ceil(mightVal / 4);
      totals.wound += msBonus;
      system.status.soak = (system.status.soak || 0) + msBonus;
      totals.soak += msBonus;
      entry.bonuses.push(`+${msBonus} Wound & Soak (1/4 Might)`);
      // Per 2 Strength Points: +1 AMB(FO/MA) (variable)
      entry.conditionals.push("Per 2 Strength Points: +1 AMB(FO/MA)");
      // While 2+ Power: +1(T) Might
      if (hasPower2Plus(system)) {
        system.status.might = (system.status.might || 0) + tier;
        totals.might += tier;
        entry.bonuses.push(`+${tier} Might (2+ Power)`);
      } else {
        entry.conditionals.push(`While 2+ Power: +${tier} Might`);
      }
      break;
    }

    case "solitary_dragon": {
      // +2/PL LP
      const lpAdd = 2 * level;
      system.lifePoints.max += lpAdd;
      totals.lpMax += lpAdd;
      entry.bonuses.push(`+${lpAdd} Max LP (+2/PL)`);
      entry.bonuses.push("Lose Unify Maneuver");
      entry.conditionals.push("Per threshold below: +1 Crit Wound Extra Dice category");
      break;
    }

    case "super_android": {
      _applyOptionFlags(system, "super_android", options);
      // Per-option bonuses
      system.aptitudes.lockOnTargetWoundBonus = (system.aptitudes.lockOnTargetWoundBonus || 0) + 2 * tier;
      entry.conditionals.push(`Superior Lock On: +${2 * tier} Wound vs Lock On targets`);
      // Infinite Energy: regain Z(bT) KP/round
      const kpRegen = Z * baseTier;
      system.aptitudes.kiRegenPerRound = (system.aptitudes.kiRegenPerRound || 0) + kpRegen;
      entry.perRound.push({ type: "kp", amount: kpRegen, label: `+${kpRegen} KP (Infinite Energy)` });
      entry.bonuses.push(`Infinite Energy: +${kpRegen} KP/round`);
      break;
    }

    case "super_majin": {
      // Ignore Bouncy last effect
      entry.bonuses.push("Ignore last Bouncy effect (Rubbery Body)");
      // Above Injured: +1(bT) Strike & Wound
      const hsm = system.status?.healthStatus;
      if (hsm === "healthy" || hsm === "bruised") {
        totals.strike += baseTier;
        totals.wound += baseTier;
        entry.bonuses.push(`+${baseTier} Strike & Wound (Above Injured)`);
      } else {
        entry.conditionals.push(`Above Injured: +${baseTier} Strike & Wound`);
      }
      break;
    }

    case "super_namekian": {
      // -Z(bT) KP cost Cellular Proliferation
      system.aptitudes.cellularProliferationKiReduction = (system.aptitudes.cellularProliferationKiReduction || 0) + Z * baseTier;
      system.aptitudes.maxStudiedStacksBonus = (system.aptitudes.maxStudiedStacksBonus || 0) + 1;
      entry.bonuses.push(`-${Z * baseTier} KP cost Cellular Proliferation`);
      entry.bonuses.push("+1 max Studied stacks");
      break;
    }

    case "time_skipper": {
      // Opponents' turns: +Z Defense Value
      entry.conditionals.push(`Opponents' turns: +${Z} Defense Value`);
      entry.conditionals.push(`Your/Ally turns: +${Z} Awareness`);
      break;
    }

    case "final_form_rider": {
      _applyOptionFlags(system, "final_form_rider", options);
      entry.bonuses.push("Hype Maneuver available; may use PE Modifier instead of PE Score for its effects");
      entry.bonuses.push("Use Personality Score instead of Force/Magic Score for max Energy Charges");
      if (hasPower2Plus(system)) {
        system.status.dr = (system.status.dr || 0) + tier;
        totals.dr += tier;
        entry.bonuses.push(`+${tier} Damage Reduction (2+ Power)`);
      } else {
        entry.conditionals.push(`While 2+ Power: +${tier} Damage Reduction`);
      }
      entry.triggered.push({
        id: "final_form_rider_hype",
        name: "Maximum Rider Power",
        description: "Triggered/Transform 1/Encounter: Hype OoS and maximize Power until end of next turn",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Apply per-option passive numerics
      const ffrOpts = _findAllOptionValues(options).map(o => o.toLowerCase());
      const has = (key) => ffrOpts.some(o => o.includes(key));
      if (has("path of heaven")) {
        // +T Defense + Parry Strike Dice (passive)
        system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + tier;
        system.aptitudes.parryStrikeDiceBonus = (system.aptitudes.parryStrikeDiceBonus || 0) + tier;
        entry.bonuses.push(`+${tier} Defense & Parry Strike Dice (Path of Heaven)`);
      } else {
        entry.conditionals.push(`Path of Heaven: +${tier} Defense and Parry Strike Dice Score`);
      }
      if (has("classic power") && hasPower2Plus(system)) {
        // 2+ Power: +T Might, +2T Wound
        system.aptitudes.might = (system.aptitudes.might || 0) + tier;
        system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + 2 * tier;
        entry.bonuses.push(`+${tier} Might, +${2 * tier} Wound (Classic Power, 2+ Power)`);
      } else if (has("classic power")) {
        entry.conditionals.push(`Classic Power: 2+ Power => +${tier} Might, +${2 * tier} Wound`);
      }
      if (has("j's power") || has("j’s power") || has("js power")) {
        // Gigantic → +2T DR (conditional on size)
        const size = (system.status?.currentSize || "").toLowerCase();
        if (size === "gigantic" || size === "enormous") {
          system.status.dr = (system.status.dr || 0) + 2 * tier;
          entry.bonuses.push(`+${2 * tier} DR (J's Power, Gigantic)`);
        } else {
          entry.conditionals.push(`J's Power: Gigantic => +${2 * tier} DR`);
        }
      }
      if (!has("path of heaven") && !has("classic power") && !has("j's power") && !has("j’s power")) {
        entry.conditionals.push("Charge Up: +1 max Power and +1 Power from Power Up");
        entry.conditionals.push("Power Build: gains Bulky and ignores 1 Super Stack penalty");
        entry.conditionals.push(`True Final Form: Full Power => +${tier} AMB(FO/MA/selected Attribute)`);
        entry.conditionals.push("Classic Technique: Signature Technique Maneuver unlimited/round; per Power +1(T) ST Wound");
        entry.conditionals.push(`Monstrous Rider: Triggered/Transform or Start of Turn => regain ${5 * baseTier} LP and KP`);
        entry.conditionals.push(`Musical Rider: per 2 Performance ranks +${tier} Soak & Wound; +1 Performance DS per Power`);
      }
      entry.conditionals.push("Mastery: Legend Realized Dice Score +1d10(T) per threshold below on entry");
      break;
    }

    case "final_moon_fang": {
      entry.bonuses.push("+2 base Tier of Power");
      entry.bonuses.push("Ignore all Health Threshold penalties");
      entry.bonuses.push("Ignore Shaken and Broken");
      entry.bonuses.push("Auto-enter Mindful and Superior on Transform");
      entry.bonuses.push("+2 Counter Actions at start of each Combat Round");
      entry.conditionals.push("Superior State: apply Greater Dice an additional time");
      entry.conditionals.push("May use Moon Slayer LP as KP");
      entry.conditionals.push("Outside Farewell State: cannot use Signature Technique Maneuver; Basic Attacks gain 2 Energy Charges");
      entry.conditionals.push("1/Round: Movement as Instant, Rapid Movement costs no KP");
      entry.conditionals.push("No damage from Opponent attack: Basic Attack OoS");
      entry.conditionals.push("Against lower ToP: auto-succeed Concealment and defensive Might/Save clashes");
      entry.conditionals.push("1/Encounter: spend 1 Action to enter Farewell State until end of turn");
      entry.conditionals.push("Farewell State: triple Final Moon Fang AMBs and only Heaven-Piercing Moon Fang may be used");
      entry.conditionals.push("Farewell State: defeat effects cannot trigger vs your attacks");
      entry.triggered.push({
        id: "final_moon_fang_farewell_charge",
        name: "Farewell Charge",
        description: "1/Encounter: Heaven-Piercing Moon Fang gains maximum Energy Charges",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    case "way_of_the_hermit": {
      entry.conditionals.push("Transformation Maneuver: reduce Stress Test Requirement by 1 per Ripple for that Maneuver");
      entry.conditionals.push("If Ripple reaches 0, leave this Transformation");
      entry.conditionals.push("If Undead or Stone Mask Vampirism, entering this Transformation defeats you as Elemental (Light)");
      entry.conditionals.push("Underwater + Physical Light attack: Ki Wagers may exceed Capacity by 1/4");
      entry.conditionals.push("Start of Turn with 2+ Rippling Energy: gain 1 Ripple");
      entry.conditionals.push("Fate of that Blood: Sunlight Breathing gains +1 Ripple per threshold below");
      entry.conditionals.push("Crazy my Beat: 1/Round Bluff Clash win => Sunlight Breathing OoS");
      entry.conditionals.push("Foreseeing Hermit: while Healthy, double Ripple gained from the start-of-turn effect");
      entry.conditionals.push(`Bubble Blower: Bubble attacks +X(${tier}) Wound`);
      entry.conditionals.push("Spend Ripple: Physical attack gains Elemental (Light)");
      entry.conditionals.push(`Spend Ripple on defense: +X(${tier}) Combat Rolls & Soak for that attack`);
      entry.conditionals.push(`Spend Ripple in Opponent-initiated Might Clash: +X(${tier}) Clash Dice Score`);
      entry.conditionals.push("1/Round: spend Ripple to use Search as Instant, +X Dice Score");
      entry.conditionals.push("1/Round underwater: applying Light profile also applies Water profile");
      entry.conditionals.push(`1/Round attack declaration: spend Ripple for +3 Melee Range and +X(${tier}) Wound`);
      entry.conditionals.push(`1/Round Throw: spend Ripple for Elemental (Light) and +X(${tier}) Damage`);
      entry.conditionals.push("1/Round: destroy outer Apparel/Accessory to refund Ripple spent on Overdrive");
      entry.conditionals.push("1/Round Sunlight Breathing: Energy Charge OoS for restricted ST");
      break;
    }

    // ========== SUPER AWAKENINGS ==========

    case "earthling_spirit": {
      // Additional Surge per encounter
      entry.bonuses.push("+1 Surge per Encounter");
      // +2(bT)/threshold Surge LP/KP
      const tbES = getThresholdsBelow(system);
      if (tbES > 0) {
        entry.bonuses.push(`+${tbES * 2 * baseTier} Surge LP/KP (${tbES} thresholds × ${2 * baseTier})`);
      } else {
        entry.conditionals.push(`Per threshold below: +${2 * baseTier} Surge LP/KP`);
      }
      break;
    }

    case "genetic_max": {
      // +PL Max LP and KP
      system.lifePoints.max += level;
      system.kiPool.max += level;
      totals.lpMax += level;
      totals.kpMax += level;
      entry.bonuses.push(`+${level} Max LP (+1/PL)`);
      entry.bonuses.push(`+${level} Max KP (+1/PL)`);
      // Size increase OR +1(bT) Soak (option)
      entry.conditionals.push(`Option: Size → Gigantic OR +${baseTier} Soak`);
      // If Perfection stacks: Z+1
      entry.bonuses.push("+1 effective Perfection stacks");
      break;
    }

    case "grandmaster": {
      _applyOptionFlags(system, "grandmaster", options);
      // +1/4 Might Wound to Signature Techniques
      const mightG = system.status.might || 0;
      const gmBonus = Math.ceil(mightG / 4);
      system.aptitudes.signatureTechniqueWoundBonus = (system.aptitudes.signatureTechniqueWoundBonus || 0) + gmBonus;
      entry.bonuses.push(`+${gmBonus} Wound (STs, 1/4 Might)`);
      // Technical/Magical option
      entry.conditionals.push(`Technical: -${2 * tier} KP Technical UAs, +${tier} Clash Dice`);
      entry.conditionals.push(`Magical: -${2 * tier} KP Magical UAs, +${tier} Clash Dice`);
      // Below Bruised: +1(T) Defense and Soak
      const hsg = system.status?.healthStatus;
      if (hsg === "injured" || hsg === "critical") {
        system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + tier;
        totals.defense += tier;
        system.status.soak = (system.status.soak || 0) + tier;
        totals.soak += tier;
        entry.bonuses.push(`+${tier} Defense & Soak (Below Bruised)`);
      } else {
        entry.conditionals.push(`Below Bruised: +${tier} Defense & Soak`);
      }
      break;
    }

    case "limitless_saiyan": {
      // Requires 2+ Zenkai stacks to use

      // Saiyans Have No Limits [Passive]: In Core Trans ToP 4+, treat Z as Z+1 for Zenkai effects
      entry.conditionals.push(`In Core Trans ToP 4+: treat Zenkai Z as Z+1 (effective Z=${Z + 1})`);

      // Saiyans Have No Limits [Passive]: In highest Core Trans below Injured, +1 Stress Bonus
      const healthStatus = system.status?.healthStatus || "healthy";
      const belowInjured = (healthStatus === "injured" || healthStatus === "critical");
      if (belowInjured) {
        totals.stressBonus += 1;
        system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 1;
        entry.bonuses.push("+1 Stress Bonus (highest Core Trans, below Injured)");
      } else {
        entry.conditionals.push("Highest Core Trans below Injured: +1 Stress Bonus");
      }

      // Charge at Full Power [Triggered/Start of Combat Encounter]:
      // "Gain a stack of Battle Born to your Wound Rolls"
      entry.triggered.push({
        id: "limitless_charge",
        name: "Charge at Full Power",
        description: "Gain 1 Battle Born stack to Wound Rolls (Start of Combat)",
        usageLimit: "encounter",
        maxUses: 1
      });

      // 2+ Power & 2+ BB Wounds: +2(T) Wound
      const bbWounds = system.battleBorn?.wound || 0;
      if (hasPower2Plus(system) && bbWounds >= 2) {
        totals.wound += 2 * tier;
        entry.bonuses.push(`+${2 * tier} Wound (2+ Power & ${bbWounds} BB Wounds)`);
      } else {
        entry.conditionals.push(`2+ Power & 2+ BB Wounds: +${2 * tier} Wound`);
      }
      break;
    }

    case "strongest_warrior": {
      _applyOptionFlags(system, "strongest_warrior", options);
      // Set PL to 30, gain all Enhancement Powers
      entry.bonuses.push("PL set to 30; gain all Enhancement Powers & UAs");
      break;
    }

    // ========== MANIFESTED ENHANCEMENT POWERS ==========

    case "dense_ki": {
      // +1(T) Might
      system.status.might = (system.status.might || 0) + tier;
      totals.might += tier;
      entry.bonuses.push(`+${tier} Might`);
      // +1/2 Might to Surge KP
      const surgeMight = Math.floor((system.status.might || 0) / 2);
      entry.bonuses.push(`+${surgeMight} Surge KP (1/2 Might)`);
      // While 2+ Power: +1(T) DR, +2(T) Wound
      if (hasPower2Plus(system)) {
        totals.dr += tier;
        totals.wound += 2 * tier;
        entry.bonuses.push(`+${tier} DR, +${2 * tier} Wound (2+ Power)`);
      } else {
        entry.conditionals.push(`While 2+ Power: +${tier} DR, +${2 * tier} Wound`);
      }
      break;
    }

    case "depth_of_emotion": {
      _applyOptionFlags(system, "depth_of_emotion", options);
      const X = Math.ceil(Z / 2);
      entry.bonuses.push(`+${Z} TP per Skill Improvement (retroactive)`);
      entry.bonuses.push("ST Wound +1/10th TP spent on STs");
      // In Superior: +X(T) Strike and Wound
      if (system.combatStates?.superior) {
        totals.strike += X * tier;
        totals.wound += X * tier;
        entry.bonuses.push(`+${X * tier} Strike & Wound (Superior)`);
      } else {
        entry.conditionals.push(`Superior State: +${X * tier} Strike & Wound`);
      }
      break;
    }

    case "dragon_embodiment": {
      _applyOptionFlags(system, "dragon_embodiment", options);
      // +2 Perception Skill Dice Score
      system.aptitudes.perceptionBonus = (system.aptitudes.perceptionBonus || 0) + 2;
      totals.perception += 2;
      entry.bonuses.push("+2 Perception Skill Dice");
      // Halve Damage from own element
      entry.conditionals.push("Halve Damage from own Draconic Element");
      // Implanted Power option: +T AMB(AG/FO/TE/MA), -2 Stress (passive)
      const deOpt = String(_findOptionValue(options) || "").toLowerCase();
      if (deOpt.includes("implanted power")) {
        for (const k of ["ag", "fo", "te", "ma"]) {
          if (system.attributes[k]) {
            system.attributes[k].modifier += tier;
            system.attributes[k].totalScore = system.attributes[k].score + system.attributes[k].modifier;
          }
        }
        system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) - 2;
        entry.bonuses.push(`+${tier} AMB(AG/FO/TE/MA), -2 Stress (Implanted Power)`);
      } else if (deOpt.includes("dragon consumer")) {
        // +2T Element Wound — store as aptitude
        system.aptitudes.draconicElementWoundBonus = (system.aptitudes.draconicElementWoundBonus || 0) + 2 * tier;
        entry.bonuses.push(`+${2 * tier} Element Wound (Dragon Consumer)`);
      } else {
        entry.conditionals.push(`Implanted Power: +${tier} AMB(AG/FO/TE/MA), -2 Stress`);
        entry.conditionals.push(`Dragon Consumer: +${2 * tier} Element Wound`);
      }
      break;
    }

    case "living_vessel": {
      // +1(bT) Cognitive Clash Dice Score
      system.aptitudes.cognitiveClashDiceBonus = (system.aptitudes.cognitiveClashDiceBonus || 0) + baseTier;
      entry.bonuses.push(`+${baseTier} Cognitive Clash Dice`);
      entry.conditionals.push("Phantasm 2+ Struggling: +ToP Extra Dice Combat Rolls");
      break;
    }

    case "manifested_willpower": {
      _applyOptionFlags(system, "manifested_willpower", options);
      // Per 3 stacks after first: +1 Stress Bonus
      const stressAdd = Math.floor(Math.max(0, Z - 1) / 3);
      if (stressAdd > 0) {
        totals.stressBonus += stressAdd;
        system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + stressAdd;
        entry.bonuses.push(`+${stressAdd} Stress Bonus`);
      }
      // When Z = base ToP: +1 Steadfast
      if (Z >= baseTier) {
        totals.steadfast += 1;
        entry.bonuses.push(`+1 Steadfast (stacks ${Z} ≥ baseTier ${baseTier})`);
      } else {
        entry.conditionals.push(`When stacks = base ToP (${baseTier}): +1 Steadfast`);
      }
      break;
    }

    case "overflowing_power": {
      _applyOptionFlags(system, "overflowing_power", options);
      // +1(T) Might Clash Dice
      system.aptitudes.mightClashDiceBonus = (system.aptitudes.mightClashDiceBonus || 0) + tier;
      entry.bonuses.push(`+${tier} Might Clash Dice`);
      // Option: case-insensitive match (UI writes catalog names like "Harder"/"Better")
      const opOpt = String(_findOptionValue(options) || "").toLowerCase();
      if (opOpt.includes("harder")) {
        system.status.dr = (system.status.dr || 0) + baseTier;
        totals.dr += baseTier;
        entry.bonuses.push(`+${baseTier} DR (Harder)`);
      } else if (opOpt.includes("better")) {
        system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + baseTier;
        totals.strike += baseTier;
        entry.bonuses.push(`+${baseTier} Strike (Better)`);
      } else if (opOpt.includes("faster")) {
        system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + baseTier;
        totals.dodge += baseTier;
        entry.bonuses.push(`+${baseTier} Dodge (Faster)`);
      } else if (opOpt.includes("stronger")) {
        system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + 2 * baseTier;
        totals.wound += 2 * baseTier;
        entry.bonuses.push(`+${2 * baseTier} Wound (Stronger)`);
      } else {
        entry.bonuses.push("(Select option: Harder/Better/Faster/Stronger)");
      }
      // While 2+ Power: +2Z Wound and Soak
      if (hasPower2Plus(system)) {
        totals.wound += 2 * Z;
        system.status.soak = (system.status.soak || 0) + 2 * Z;
        totals.soak += 2 * Z;
        entry.bonuses.push(`+${2 * Z} Wound & Soak (2+ Power)`);
      } else {
        entry.conditionals.push(`While 2+ Power: +${2 * Z} Wound & Soak`);
      }
      break;
    }

    case "pain_addict": {
      _applyOptionFlags(system, "pain_addict", options);
      // Sadist: +2 AMB(FO/MA) — this adds ON TOP of base attrBonuses
      // Masochist: +2 AMB(TE) — same
      const paOpt = _findOptionValue(options);
      if (paOpt === "sadist" || paOpt === "Sadist") {
        if (system.attributes.fo) {
          system.attributes.fo.modifier += 2;
          system.attributes.fo.totalScore = system.attributes.fo.score + system.attributes.fo.modifier;
        }
        if (system.attributes.ma) {
          system.attributes.ma.modifier += 2;
          system.attributes.ma.totalScore = system.attributes.ma.score + system.attributes.ma.modifier;
        }
        entry.bonuses.push("+2 FO & MA Modifier (Sadist)");
      } else if (paOpt === "masochist" || paOpt === "Masochist") {
        if (system.attributes.te) {
          system.attributes.te.modifier += 2;
          system.attributes.te.totalScore = system.attributes.te.score + system.attributes.te.modifier;
        }
        entry.bonuses.push("+2 TE Modifier (Masochist)");
      } else {
        entry.bonuses.push("(Select option: Sadist/Masochist)");
      }
      break;
    }

    case "peak_of_power": {
      // +Z(bT) Combat Rolls and Soak
      const popSoak = Z * baseTier;
      system.status.soak = (system.status.soak || 0) + popSoak;
      totals.soak += popSoak;
      totals.combatRolls += popSoak;
      entry.bonuses.push(`+${popSoak} Soak (Z×bT)`);
      entry.bonuses.push(`+${popSoak} Combat Rolls (Z×bT)`);

      // Z >= 2: +1(T) all Saving Throws
      if (Z >= 2) {
        for (const saveKey of Object.keys(system.savingThrows || {})) {
          if (system.savingThrows[saveKey]) {
            system.savingThrows[saveKey].bonus += tier;
            system.savingThrows[saveKey].ct = Math.max(7, 10 - system.savingThrows[saveKey].bonus);
            if (system.combatStates?.mindful) {
              system.savingThrows[saveKey].ct = Math.max(2, system.savingThrows[saveKey].ct - 1);
            }
          }
        }
        totals.allSaves += tier;
        entry.bonuses.push(`+${tier} All Saves (Z≥2)`);
      }

      // Z >= 3: Apply ToP Extra Dice additional time
      if (Z >= 3) entry.bonuses.push("Apply ToP Extra Dice additional time (Z≥3)");

      // Z >= 6: Double AMB
      if (Z >= 6) entry.bonuses.push("Double AMB of Peak of Power (Z≥6)");

      // +1/2 Max KP, +1/4 Max Capacity
      const kpAdd = Math.floor(system.kiPool.max / 2);
      system.kiPool.max += kpAdd;
      totals.kpMax += kpAdd;
      entry.bonuses.push(`+${kpAdd} Max KP (+1/2)`);

      const capAdd = Math.floor(system.capacity.max / 4);
      system.capacity.max += capAdd;
      totals.capacityMax += capAdd;
      entry.bonuses.push(`+${capAdd} Max Capacity (+1/4)`);
      break;
    }

    case "pure_resolve": {
      // Cannot gain Alternate/Legendary Forms
      entry.bonuses.push("Cannot gain Alternate/Legendary Forms");
      // +Z(bT) Surge LP/KP, +1(bT)/threshold
      entry.bonuses.push(`+${Z * baseTier} Surge LP/KP`);
      const tbPR = getThresholdsBelow(system);
      if (tbPR > 0) {
        entry.bonuses.push(`+${tbPR * baseTier} more Surge LP/KP (${tbPR} thresholds × ${baseTier})`);
      } else {
        entry.conditionals.push(`Per threshold below: +${baseTier} more Surge LP/KP`);
      }
      // Chosen AMBs +1
      const prChosenAttrs = options.pureResolveChosenAttrs || [];
      const attrLabelsMap = {ag:"AG",fo:"FO",te:"TE",sc:"SC",in:"IN",ma:"MA",pe:"PE"};
      if (prChosenAttrs.filter(Boolean).length > 0) {
        const chosenNames = prChosenAttrs.filter(Boolean).map(k => attrLabelsMap[k] || k.toUpperCase());
        const linked = [];
        if (prChosenAttrs.includes("fo")) linked.push("MA (linked)");
        if (prChosenAttrs.includes("ma")) linked.push("FO (linked)");
        const allBoosted = [...chosenNames, ...linked].join(", ");
        entry.bonuses.push(`+1 AMB: ${allBoosted}`);
      } else {
        entry.bonuses.push("Choose 2 AMBs to increase (open trait dialog)");
      }
      // In Enhancement: double AMB of Pure Resolve
      if (hasActiveTransType(system, "enhancement")) {
        entry.bonuses.push("Pure Resolve AMBs DOUBLED (In Enhancement)");
      } else {
        entry.conditionals.push("In Enhancement: double Pure Resolve AMBs");
      }
      break;
    }

    case "reincarnated_power": {
      _applyOptionFlags(system, "reincarnated_power", options);
      // AMB = Past Life's base ToP (variable)
      entry.bonuses.push("AMB(AG/FO/TE/MA) = Past Life base ToP");
      // Surging: +Past Life ToP Extra Dice Combat Rolls
      entry.conditionals.push("Surging: +Past Life ToP Extra Dice Combat Rolls");
      break;
    }

    case "rippling_energy": {
      _applyOptionFlags(system, "rippling_energy", options);
      // +Z/PL LP and KP
      const lpkpR = Z * level;
      system.lifePoints.max += lpkpR;
      system.kiPool.max += lpkpR;
      totals.lpMax += lpkpR;
      totals.kpMax += lpkpR;
      entry.bonuses.push(`+${lpkpR} Max LP (+${Z}/PL)`);
      entry.bonuses.push(`+${lpkpR} Max KP (+${Z}/PL)`);
      // +Z(bT) Surge LP/KP
      entry.bonuses.push(`+${Z * baseTier} Surge LP/KP`);
      // Fate of that Blood: per threshold below +T Wound & Soak
      const tbRE = getThresholdsBelow(system);
      if (tbRE > 0) {
        const reWound = tbRE * tier;
        totals.wound += reWound;
        system.status.soak = (system.status.soak || 0) + reWound;
        totals.soak += reWound;
        entry.bonuses.push(`+${reWound} Wound & Soak (Fate, ${tbRE} thresholds × ${tier})`);
      } else {
        entry.conditionals.push(`Fate of that Blood: per threshold below +${tier} Wound & Soak`);
      }
      entry.conditionals.push(`Crazy my Beat: +${Z} Bluff`);
      entry.conditionals.push(`Foreseeing Hermit: +${Z} Clairvoyance`);
      break;
    }

    case "sage_training": {
      // +Z/PL LP and KP
      const lpkpS = Z * level;
      system.lifePoints.max += lpkpS;
      system.kiPool.max += lpkpS;
      totals.lpMax += lpkpS;
      totals.kpMax += lpkpS;
      entry.bonuses.push(`+${lpkpS} Max LP (+${Z}/PL)`);
      entry.bonuses.push(`+${lpkpS} Max KP (+${Z}/PL)`);
      // +Z Clairvoyance
      totals.perception += Z;
      entry.bonuses.push(`+${Z} Clairvoyance Dice`);
      // Mindful/Superior: +Z(T) Soak and Wound (not stacking)
      if (system.combatStates?.mindful || system.combatStates?.superior) {
        const stVal = Z * tier;
        system.status.soak = (system.status.soak || 0) + stVal;
        totals.soak += stVal;
        totals.wound += stVal;
        entry.bonuses.push(`+${stVal} Soak & Wound (${system.combatStates?.superior ? "Superior" : "Mindful"})`);
      } else {
        entry.conditionals.push(`Mindful/Superior: +${Z * tier} Soak & Wound`);
      }
      break;
    }

    case "stone_mask_vampirism": {
      // +Z Perception and Intimidation
      totals.perception += Z;
      totals.intimidation += Z;
      entry.bonuses.push(`+${Z} Perception & Intimidation`);
      // Reduce Wound Roll Critical Target by Z
      entry.bonuses.push(`-${Z} Wound Critical Target`);
      // Regain 2Z(bT) LP per round
      const lpRegen = 2 * Z * baseTier;
      entry.perRound.push({ type: "lp", amount: lpRegen, label: `+${lpRegen} LP (Vampirism)` });
      entry.bonuses.push(`Regen: +${lpRegen} LP/round`);
      break;
    }

    // ========== REMAINING ENTRIES (display-only) ==========

    case "artificial_child": {
      // Gene Spliced Lv1: Gain second Genetic Splicing selection
      entry.bonuses.push("Second Genetic Splicing selection");
      // Gene Spliced Lv2: 7th stack → select race-specific effect
      entry.conditionals.push("7th stack: select race-specific effect");
      // Best of all Worlds Lv1: Triggered/Defeated → choose Undying or Superior State
      entry.triggered.push({
        id: "artificial_child_defeated",
        name: "Best of all Worlds",
        description: "Triggered/Defeated: choose Undying or Superior State",
        usageLimit: null,
        maxUses: null
      });
      // Best of all Worlds Lv2: 1/Encounter Triggered/Transform → gain state
      entry.triggered.push({
        id: "artificial_child_transform",
        name: "Transform State",
        description: "1/Encounter Triggered/Transform: gain a Combat State",
        usageLimit: "encounter",
        maxUses: 1
      });
      // Best of all Worlds Lv3+: Race-dependent effects
      entry.conditionals.push("Android: gain Specialized Feature option");
      entry.conditionals.push("Arcosian: gain Divergent Evolution option");
      entry.conditionals.push("Cerealian: Acclimation resource access");
      entry.conditionals.push("Earthling: gain Talent");
      entry.conditionals.push("Majin: gain Absorption Maneuver");
      entry.conditionals.push("Namekian: +1 Racial Life Modifier");
      entry.conditionals.push("Neo-Tuffle: gain Battle Jacket access");
      entry.conditionals.push("Shinjin: gain God Maneuver");
      entry.conditionals.push("Shadow Dragon: gain Dragon Ball");
      break;
    }

    case "black_sparks": {
      // Black Flash! Lv1: Natural 10 on Wound = Black Flash (ruling)
      entry.bonuses.push("Natural 10 on Wound = Black Flash (no Twin-Linked/Reroll)");
      // Black Flash! Lv2: Black Flash applies Greater Dice
      entry.conditionals.push("Black Flash: apply Greater Dice to Wound");
      // Black Flash! Lv3: 1/Encounter increase Damage Category
      entry.triggered.push({
        id: "black_sparks_damage_cat",
        name: "Black Flash Damage Category",
        description: "1/Encounter Black Flash: increase Damage Category by 1",
        usageLimit: "encounter",
        maxUses: 1
      });
      // 120% Lv1: 1/Encounter auto Max Capacity increase
      entry.triggered.push({
        id: "black_sparks_max_cap",
        name: "120% Capacity",
        description: "1/Encounter: auto-increase Max Capacity",
        usageLimit: "encounter",
        maxUses: 1
      });
      // 120% Lv2: Post-Black Flash passive bonuses
      entry.conditionals.push(`Post-Black Flash: +1 ToP Dice Category, -1 Crit Target, +${tier} Combat Rolls`);
      break;
    }

    case "genius": {
      _applyOptionFlags(system, "genius", options);
      // Specialized Skill Lv1: +1 Dice Category Critical Extra Dice for Scholarship skills
      system.aptitudes.scholarshipCritExtraDiceCategoryBonus = (system.aptitudes.scholarshipCritExtraDiceCategoryBonus || 0) + 1;
      entry.bonuses.push("+1 Dice Category Crit Extra Dice (Scholarship skills)");
      // Specialized Skill Lv2: -Z Critical Target for Specialized skills
      system.aptitudes.specializedSkillCritTargetReduction = (system.aptitudes.specializedSkillCritTargetReduction || 0) + Z;
      entry.bonuses.push(`-${Z} Critical Target (Specialized skills)`);
      // Specialized Skill Lv3: Option per stack (Craft-dependent effects)
      entry.conditionals.push("Craft (Basic Items): first Called Shot doesn't destroy crafted items");
      entry.conditionals.push("Craft (Apparel): apply 1 Apparel Quality to all allies' Top Layer at combat start");
      entry.conditionals.push("Craft (Weapons): Throw crafted weapon → destroy to add Scholarship Mod to Collision Damage");
      entry.conditionals.push("Craft (Vehicles): 1/Round Movement as Instant Maneuver");
      // Masterwork Craftsmen Lv1: Piloting crafted vehicle/BJ → +ceil(Z/2)(T) Combat Rolls
      entry.conditionals.push(`Piloting crafted Vehicle/BJ: +${Math.ceil(Z / 2) * tier} Combat Rolls`);
      // Masterwork Craftsmen Lv2: Benefit from/trigger traits while Piloting BJ
      entry.conditionals.push("Piloting BJ: benefit from and trigger this Manifested Power's traits");
      // Masterwork Craftsmen Lv3: Crafted Bombs/Medicine gain benefits
      entry.conditionals.push("Crafted Bomb/Restorative/Energizing Medicine gain bonuses");
      // Restorative/Energizing Medicine: 1/Round Z/Encounter instant create/repair
      entry.triggered.push({
        id: "genius_instant_craft",
        name: "Instant Crafting",
        description: `1/Round, ${Z}/Encounter: Instant Maneuver to create Basic Item/Apparel/Weapon (+1 Difficulty) or Repair Vehicle/BJ`,
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    case "magical_girl": {
      // Let Me Have a Sweet Dream: Open My Heart trait, Hype effects
      entry.bonuses.push("Open My Heart trait (Magical Formation access)");
      entry.bonuses.push("Hype Maneuver uses PE Modifier");
      entry.conditionals.push("High Speed Aspect scaling");
      // 1/Encounter Transform → damage immunity
      entry.triggered.push({
        id: "magical_girl_transform_immunity",
        name: "Transformation Immunity",
        description: "1/Encounter: Transform → damage immunity (spend Actions to extend)",
        usageLimit: "encounter",
        maxUses: 1
      });
      entry.conditionals.push("End of Encounter: restore destroyed Features/Items");
      // Protect Until the Very End: My Evolution trait, Magical Finisher creation
      entry.bonuses.push("My Evolution trait; Magical Finisher ST created");
      // Fighting Evil: Dreams resource, United Attack, Intervene, Empower
      entry.conditionals.push("Triggered: ally threshold/defeat → gain Dreams");
      entry.conditionals.push("United Attack: spend Dreams for bonus");
      entry.conditionals.push("Intervene: spend Dreams for damage reduction");
      entry.conditionals.push("Empower: reduce KP cost");
      // Mastery: Believe in Yourself
      entry.conditionals.push("Mastery: choice-dependent Dreams gain and aspect bonuses");
      // Legendary: Pretty Soldier
      entry.conditionals.push(`Legendary: 1/Round ST → spend KP for Hype as Instant`);
      // Battle Uniform color effects
      entry.conditionals.push("Pretty Pink: Hype Extra Dice increase");
      entry.conditionals.push("Fiery Red: Raging state bonus");
      entry.conditionals.push("Cool Blue: Mindful state bonus");
      entry.conditionals.push("Determined Yellow: Power Surge bonus");
      entry.conditionals.push("Gaia's Green: Elemental profile");
      entry.conditionals.push("Hermit Purple: defeated ally → Hype/Superior");
      break;
    }

    case "pretty_magical_girl": {
      _applyOptionFlags(system, "pretty_magical_girl", options);
      // Open My Heart!: Formation line trait, Hype PE Modifier
      entry.bonuses.push("Open My Heart! (Magical Formation line access)");
      entry.bonuses.push("Hype Maneuver uses PE Modifier");
      entry.conditionals.push("High Speed Aspect scaling");
      // 1/Encounter Transform → damage immunity
      entry.triggered.push({
        id: "pretty_magical_transform",
        name: "Transformation Immunity",
        description: "1/Encounter: Transform → damage immunity (spend Actions)",
        usageLimit: "encounter",
        maxUses: 1
      });
      entry.conditionals.push("End of Encounter: restore destroyed Features/Items");
      // My Evolution!: Multi-option selection
      entry.bonuses.push("My Evolution! multi-option selection (Pretty Barrier/Different Me/Magical Net/etc.)");
      entry.bonuses.push("Weapon creation with properties");
      // Light Up!: Pretty Points resource
      entry.conditionals.push("Triggered: threshold/defeat → gain Pretty Points");
      entry.triggered.push({
        id: "pretty_magical_hype",
        name: "Instant Hype",
        description: "1/Round Instant: spend Pretty Point for Hype",
        usageLimit: "round",
        maxUses: 1
      });
      entry.conditionals.push("Empower: Miraculous Empowerment");
      entry.conditionals.push("United Attack: spend Pretty Points for bonus");
      // Mastery: My Feelings
      entry.conditionals.push("Mastery: additional option, choice-dependent Pretty Point gains, aspects");
      // Battle Uniform color effects (same as magical_girl)
      entry.conditionals.push("Pretty Pink: triggered unite bonus");
      entry.conditionals.push("Fiery Red: Raging bonus");
      entry.conditionals.push("Cool Blue: Mindful bonus");
      entry.conditionals.push("Determined Yellow: Power Surge bonus");
      entry.conditionals.push("Gaia's Green: Elemental profile");
      entry.conditionals.push("Hermit Purple: defeated ally → Hype");
      // Exceed: If Someone Says It's Wrong to Hope
      entry.conditionals.push("Exceed: God Ki + Perfect Control aspects, Instant Transmission, God Finisher");
      break;
    }

    case "mutation": {
      _applyOptionFlags(system, "mutation", options);
      // Evolutionary Peak LP/KP is handled in actor.mjs _calculateResources.
      // Mutation Trait bonuses dispatched to mutation-traits.mjs
      applyMutationTraitBonuses(system, tier, baseTier, level, options, entry, totals);
      break;
    }

    default: {
      // For unhandled manifested powers, just note they're active
      entry.bonuses.push("Active (trait passives apply per manual)");
      break;
    }
  }
}

/**
 * Find the first option value from the transformation option selections.
 * Options are stored as { effectLevel: selectedValue }.
 */
function _findOptionValue(options) {
  if (!options) return null;
  for (const key of Object.keys(options)) {
    const val = options[key];
    if (val && typeof val === "string" && val !== "none") return val;
  }
  return null;
}

function _findAllOptionValues(options) {
  if (!options) return [];
  const out = [];
  for (const key of Object.keys(options)) {
    const val = options[key];
    if (Array.isArray(val)) {
      for (const v of val) if (v && typeof v === "string" && v !== "none") out.push(v);
    } else if (val && typeof val === "string" && val !== "none") {
      out.push(val);
    }
  }
  return out;
}

/**
 * Generic option flag emitter — sets system.aptitudes[`<catalogKey>_<option_slug>_active`] = true
 * for every selected option. Used to give all multi-option manifested powers a trackable state
 * change that verification tests can assert against.
 */
function _applyOptionFlags(system, catalogKey, options) {
  if (!system.aptitudes) system.aptitudes = {};
  const opts = _findAllOptionValues(options);
  for (const o of opts) {
    const slug = o.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (slug) system.aptitudes[`${catalogKey}_${slug}_active`] = true;
  }
}
