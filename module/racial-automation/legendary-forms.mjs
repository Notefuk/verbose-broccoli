/**
 * Legendary Form Trait Automation
 * Applies passive trait bonuses from active Legendary Form transformations.
 *
 * Attribute Modifier Bonuses (attrBonuses) are already handled by _calculateAttributeModifiers.
 * This module handles the ADDITIONAL passive effects from Trait Groups while the form is active.
 *
 * G = Grade (from gradeOrStacks "current/max" format).
 * S = Stage number within a transformation line.
 *
 * Called from actor.mjs after applyAlternateFormBonuses().
 */

// ============================================================
// Known Legendary Form catalog keys (54 entries)
// ============================================================
const LEGENDARY_FORM_KEYS = new Set([
  "ajisa_namekian", "ancestral_super_saiyan_3", "beast",
  "condensed_legendary_super_saiyan", "dark_demon_god", "dark_king",
  "initial_demon_god", "true_demon_god", "destroyer_form",
  "divinity_unleashed", "empowered", "z_empowered", "super_empowered",
  "enhanced_transformation", "feral_demonic_lord", "god_of_martial_arts",
  "godly_powers", "empowered_evolution", "brilliant_evolution",
  "hyper_mega_form", "legendary_monster", "legendary_super_saiyan_4",
  "liquid_metal", "mightiest_majin", "perfected_super_saiyan",
  "potential_unleashed", "full_power_boost", "super_full_power_boost",
  "pure_form", "splendid_evolution", "super_evolution",
  "super_grudge_amplification", "super_perfect_form",
  "super_saiyan_4", "super_saiyan_5", "super_saiyan_god",
  "super_saiyan_blue", "super_saiyan_rose", "super_star_dragon",
  "superior_namekian", "superior_super_saiyan", "supreme_form",
  "ultimate_android", "ultimate_super_saiyan", "ultra_ego",
  "ultra_instinct_sign", "ultra_instinct_complete",
  "ultimate_form", "godslayer", "xeno_super_saiyan_rose",
  "legendary_oozaru", "legendary_super_saiyan_1",
  "legendary_super_saiyan_2", "legendary_super_saiyan_3"
]);

/**
 * Parse grade/stacks from gradeOrStacks.
 * Format "current/max" (e.g. "3/5") or just a number.
 * @returns {number} minimum 1
 */
function parseGradeOrStacks(gradeOrStacks) {
  if (!gradeOrStacks) return 1;
  const str = String(gradeOrStacks).trim();
  const slashIdx = str.indexOf("/");
  const num = parseInt(slashIdx >= 0 ? str.substring(0, slashIdx) : str, 10);
  return isNaN(num) || num <= 0 ? 1 : num;
}

/**
 * Find the first non-"none" option value from transformation option selections.
 */
function _findOptionValue(options) {
  if (!options) return null;
  for (const key of Object.keys(options)) {
    const val = options[key];
    if (val && typeof val === "string" && val !== "none") return val;
    if (Array.isArray(val) && val.length > 0) return val[0]; // back-compat: return first
  }
  return null;
}

function _findAllOptionValues(options) {
  if (!options) return [];
  const out = [];
  for (const key of Object.keys(options)) {
    const val = options[key];
    if (Array.isArray(val)) {
      for (const v of val) {
        if (v && typeof v === "string" && v !== "none") out.push(v);
      }
    } else if (val && typeof val === "string" && val !== "none") {
      out.push(val);
    }
  }
  return out;
}

function addSoak(system, amount) {
  system.status.soak = (system.status.soak || 0) + amount;
}

function addSpeed(system, amount) {
  system.status.normalSpeed = Math.max(0, (system.status.normalSpeed || 0) + amount);
  system.status.boostedSpeed = Math.max(0, (system.status.boostedSpeed || 0) + amount);
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

/**
 * Apply all automatable Legendary Form trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyLegendaryFormBonuses(system, tier, baseTier) {
  const transformations = system.transformations || [];
  const optionSelections = system.transformationOptionSelections || {};

  const result = {
    entries: [],
    hasBonuses: false
  };

  const totals = {
    soak: 0, defense: 0, dr: 0, might: 0,
    strike: 0, dodge: 0, wound: 0, combatRolls: 0,
    lpMax: 0, kpMax: 0, capacityMax: 0,
    speed: 0, initiative: 0, initiativeValue: 0, steadfast: 0,
    allSaves: 0
  };

  for (let i = 0; i < transformations.length; i++) {
    const trans = transformations[i];
    if (!trans.active) continue;

    const key = trans.catalogKey;
    if (!key || !LEGENDARY_FORM_KEYS.has(key)) continue;

    const G = parseGradeOrStacks(trans.gradeOrStacks);
    const options = optionSelections[String(i)] || optionSelections[i] || {};
    const entry = { name: trans.name, catalogKey: key, grade: G, bonuses: [], conditionals: [], triggered: [], perRound: [] };

    applyBonusesForKey(key, system, tier, baseTier, G, options, entry, totals);

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
  system.legendaryFormBonuses = result;
}

// ============================================================
// Per-key bonus application
// ============================================================

function applyBonusesForKey(key, system, tier, baseTier, G, options, entry, totals) {
  switch (key) {

    // ========== SUPER SAIYAN GOD LINE ==========

    case "super_saiyan_god": {
      // Divine Acclimation: tracked as specialResource (0-4 max, +1/round in character-sheet.mjs)
      const acclimation = system.transformationMeta?.specialResources?.acclimation?.value ?? 0;

      // Per Acclimation stack: +1 Dice Category to ToP Extra Dice
      if (acclimation > 0) {
        system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + acclimation;
        entry.bonuses.push(`+${acclimation} Dice Categories to ToP Extra Dice (${acclimation} Acclimation)`);
      }
      entry.conditionals.push(`Acclimation (${acclimation}/4): +1 DC per stack to ToP Extra Dice`);

      // Start of Combat Round: +1 additional Counter Action
      system.aptitudes.additionalCounterActionsPerRound = (system.aptitudes.additionalCounterActionsPerRound || 0) + 1;
      entry.conditionals.push("+1 Counter Action per Combat Round");

      // Battle Born: gain 1 Battle Born stack when gaining Acclimation
      entry.conditionals.push("Gain 1 Battle Born stack when gaining Acclimation");

      // Leave through Temporary: +15 Stress on Alternate Forms, +4(T) AMB, God Ki Aspect
      entry.conditionals.push(`Leave via Temporary: +15 Stress on Alternate Forms, +${4 * tier} All Mod Bonus, God Ki`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "ssg_divine_acclimation_5",
        name: "Divine Acclimation (Ki Shield)",
        description: `If you are hit by an Attacking Maneuver, you may spend up to ${8 * tier} Ki Points to reduce any Damage you receive by an equal amount. If this reduces the Damage to 0, regain Divine Ki Points equal to 1/2 (rounded up) of the Ki Points spent.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssg_divine_acclimation_6",
        name: "Divine Acclimation (Healing Surge)",
        description: `Spend ${3 * baseTier} Divine Ki Points to use a Healing Surge as an Instant Maneuver.`,
        usageLimit: "3/Encounter",
        maxUses: 3
      });
      // Legendary: Song of Hope
      entry.triggered.push({
        id: "ssg_song_of_hope_1",
        name: "// Legendary: Song of Hope",
        description: `[Triggered/Power] Select a Combat Roll at max BB stacks. Spend ${2 * baseTier} DKP to increase that Combat Roll by ${2 * tier} until end of next turn (cannot stack). Works outside God Ki State.`,
        usageLimit: null,
        maxUses: null
      });
      // Exceed: Scarlet Flames
      entry.triggered.push({
        id: "ssg_scarlet_flames_3",
        name: "// Exceed: Scarlet Flames (BB→Charges)",
        description: "If you hit an Opponent with an Attacking Maneuver, you may spend any number of Battle Born stacks from your Combat Rolls to gain an Energy Charge for each stack spent.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssg_scarlet_flames_4",
        name: "// Exceed: Scarlet Flames (Gain BB)",
        description: "Gain a stack of Battle Born.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "super_saiyan_blue": {
      // Super Saiyan Heritage: +1/4 Max KP and Capacity
      const kpAdd = Math.floor(system.kiPool.max / 4);
      const capAdd = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpAdd;
      system.capacity.max += capAdd;
      totals.kpMax += kpAdd;
      totals.capacityMax += capAdd;
      entry.bonuses.push(`+${kpAdd} Max KP (+1/4)`);
      entry.bonuses.push(`+${capAdd} Max Capacity (+1/4)`);
      // Deific Saiyan: +2(T) KP cost for attacks
      system.aptitudes.allAttackKiPenalty = (system.aptitudes.allAttackKiPenalty || 0) + 2 * tier;
      entry.conditionals.push(`+${2 * tier} KP cost on Attacking Maneuvers`);
      // Apply ToP Extra Dice additional time
      system.aptitudes.topExtraDiceExtraApplications = (system.aptitudes.topExtraDiceExtraApplications || 0) + 1;
      entry.conditionals.push("Apply ToP Extra Dice additional time");

      // -- Triggered entries --
      entry.triggered.push({
        id: "ssb_deific_saiyan_5",
        name: "Deific Saiyan (Extra Wound)",
        description: "If you hit an Opponent with an Attacking Maneuver, apply your Tier of Power Extra Dice an additional time to the Wound Roll.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssb_flame_of_power_2",
        name: "Flame of Power (Ki Spike)",
        description: `If you hit an Opponent with an Attacking Maneuver, you may spend up to ${8 * tier} Ki Points to increase the Damage they receive by an equal amount. If this knocks them through a Health Threshold, regain DKP equal to 1/2 (rounded up) of Ki Points spent.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssb_flame_of_power_3",
        name: "Flame of Power (DKP Charge)",
        description: `If you use the Energy Charge Maneuver, you may spend ${baseTier} DKP to gain an additional Energy Charge from that instance.`,
        usageLimit: "3/Encounter",
        maxUses: 3
      });
      // Legendary: Blue Saiyan
      entry.triggered.push({
        id: "ssb_blue_saiyan_1",
        name: "// Legendary: Blue Saiyan",
        description: `Spend ${2 * baseTier} DKP to use the Power Up or Energy Charge Maneuver as an Instant Maneuver. Works outside God Ki State.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Azure Evolution
      entry.triggered.push({
        id: "ssb_azure_evolution_2",
        name: "// Exceed: Azure Evolution (BB→Charges)",
        description: "If you hit an Opponent with an Attacking Maneuver, spend any number of BB stacks for an Energy Charge each. You do not lose these BB stacks until after completing that Attacking Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssb_azure_evolution_4",
        name: "// Exceed: Azure Evolution (Gain BB)",
        description: "Gain a stack of Battle Born.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "super_saiyan_rose": {
      // Super Saiyan Heritage: +1/4 Max KP and Capacity
      const kpR = Math.floor(system.kiPool.max / 4);
      const capR = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpR;
      system.capacity.max += capR;
      totals.kpMax += kpR;
      totals.capacityMax += capR;
      entry.bonuses.push(`+${kpR} Max KP (+1/4)`);
      entry.bonuses.push(`+${capR} Max Capacity (+1/4)`);
      // Flame of Divinity: DKP cost halved
      system.aptitudes.dkpHalfRateForKi = true;
      entry.conditionals.push("DKP pays KP Cost at 1/2 rate");

      // -- Triggered entries --
      entry.triggered.push({
        id: "ssr_flame_of_divinity_4",
        name: "Flame of Divinity (Strike+DKP)",
        description: `If you make an Attacking Maneuver, you may spend up to ${4 * tier} Ki Points to increase your Strike Roll by 1/2 of the amount spent. If you hit, regain DKP equal to 1/4 (rounded up) of the Ki Points spent.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssr_flame_of_divinity_5",
        name: "Flame of Divinity (Aura Power)",
        description: `If you use the Aura Maneuver, you may spend up to ${8 * baseTier} DKP. For every ${4 * baseTier} DKP spent, gain a stack of Power until you leave that Aura.`,
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      // Legendary: Isn't this color beautiful?
      entry.triggered.push({
        id: "ssr_beautiful_color_1",
        name: "// Legendary: Isn't this color beautiful?",
        description: `Spend ${2 * baseTier} DKP to use the Aura or Energy Charge Maneuver as an Instant Maneuver.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Carnation Evolution
      entry.triggered.push({
        id: "ssr_carnation_evolution_5",
        name: "// Exceed: Carnation Evolution",
        description: `Spend 1 Battle Born to regain ${12 * baseTier} DKP.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "xeno_super_saiyan_rose": {
      // God of Another World: +G(T) AMB(AG/FO/TE/MA)
      for (const attr of ["ag", "fo", "te", "ma"]) {
        if (system.attributes[attr]) {
          system.attributes[attr].modifier += G * tier;
          system.attributes[attr].totalScore = system.attributes[attr].score + system.attributes[attr].modifier;
        }
      }
      entry.bonuses.push(`+${G * tier} AMB(AG/FO/TE/MA) (G×T)`);
      // Grade 2+: +G(T) Initiative Value
      if (G >= 2) {
        system.aptitudes.initiativeValue = (system.aptitudes.initiativeValue || 0) + G * tier;
        totals.initiativeValue += G * tier;
        entry.bonuses.push(`+${G * tier} Initiative Value (G×T)`);
      }
      // Grade 3+: double Golden Power KP/Capacity
      if (G >= 3) {
        const kpX = Math.floor(system.kiPool.max / 4);
        const capX = Math.floor(system.capacity.max / 4);
        system.kiPool.max += kpX;
        system.capacity.max += capX;
        totals.kpMax += kpX;
        totals.capacityMax += capX;
        entry.bonuses.push(`+${kpX} Max KP (doubles Heritage)`);
        entry.bonuses.push(`+${capX} Max Capacity (doubles Heritage)`);
      }
      // Grade 4+: max BB +1 per Combat Roll
      if (G >= 4) {
        system.aptitudes.battleBornMaxStackBonus = (system.aptitudes.battleBornMaxStackBonus || 0) + 1;
        entry.bonuses.push("+1 max BB per Combat Roll (Grade 4)");
      }
      // ToP Extra Dice +G Categories
      system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + G;
      entry.conditionals.push(`ToP Extra Dice +${G} Categories`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "xssr_grade1_1",
        name: "Xeno Rosé Grade 1 (Extra ToP)",
        description: `If you would make a Combat Roll, pay ${baseTier} DKP to apply your Tier of Power Extra Dice an additional time.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "xssr_grade1_2",
        name: "Xeno Rosé Grade 1 (DKP Regain)",
        description: `Regain ${G * baseTier} DKP.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      if (G >= 2) {
        entry.triggered.push({
          id: "xssr_grade2_2",
          name: "Xeno Rosé Grade 2 (+1 DC)",
          description: `If you hit an Opponent with an Attacking Maneuver that possesses a Ki Wager of ${5 * baseTier} or more, increase the Damage Category by 1. Also applies if you paid the KP Cost with DKP.`,
          usageLimit: "1/Round",
          maxUses: 1
        });
      }
      if (G >= 3) {
        entry.triggered.push({
          id: "xssr_grade3_2",
          name: "Xeno Rosé Grade 3 (ToP+BB Double)",
          description: `When making an Attacking Maneuver that triggers Grade 2's second effect, increase your ToP Extra Dice by 2 Dice Categories and double the bonus from your Battle Born stacks for that Wound Roll.`,
          usageLimit: "1/Round",
          maxUses: 1
        });
      }
      break;
    }

    // ========== SUPER SAIYAN 4 LINE ==========

    case "super_saiyan_4": {
      // Super Saiyan Heritage: +1/4 Max KP and Capacity
      const kp4 = Math.floor(system.kiPool.max / 4);
      const cap4 = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kp4;
      system.capacity.max += cap4;
      totals.kpMax += kp4;
      totals.capacityMax += cap4;
      entry.bonuses.push(`+${kp4} Max KP (+1/4)`);
      entry.bonuses.push(`+${cap4} Max Capacity (+1/4)`);
      // Utmost Saiyan Power: max BB +1
      system.aptitudes.battleBornMaxStackBonus = (system.aptitudes.battleBornMaxStackBonus || 0) + 1;
      entry.bonuses.push("+1 max BB per Combat Roll");
      // Per BB on Combat Roll: +1 DC ToP Extra Dice
      const bbTotal4 = system.battleBorn?.total ?? 0;
      if (bbTotal4 > 0) {
        system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + bbTotal4;
      }
      entry.conditionals.push("Per BB stack: +1 DC ToP Extra Dice");
      // Apply ToP Extra Dice additional time
      system.aptitudes.topExtraDiceExtraApplications = (system.aptitudes.topExtraDiceExtraApplications || 0) + 1;
      entry.conditionals.push("Apply ToP Extra Dice additional time");

      // -- Triggered entries --
      entry.triggered.push({
        id: "ss4_primal_power_5",
        name: "Primal Power (Primal Surge)",
        description: "Use a Primal Surge.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ss4_primal_power_6",
        name: "Primal Power (Superior on Surge)",
        description: "If you would use a Primal Surge, enter the Superior State until the end of your next turn.",
        usageLimit: "2/Encounter",
        maxUses: 2
      });
      // Mastery: Super Full Power Saiyan 4
      entry.triggered.push({
        id: "ss4_mastery_2",
        name: "// Mastery: Full Power Counter ST",
        description: "While in the Full Power State, if you are hit by an Attacking Maneuver, you may (after completion) use the Signature Technique Maneuver as Out-of-Sequence using your Multiplicative Technique. Wound Roll increased by 1/2 (rounded up) of Damage suffered.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      // Exceed: Limit Breaker
      entry.triggered.push({
        id: "ss4_limit_breaker_2",
        name: "// Exceed: Limit Breaker (Instant Charge)",
        description: "Use the Energy Charge Maneuver as an Instant Maneuver. You must select your Multiplicative Technique for that Energy Charge.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "super_saiyan_5": {
      // Primal Fury: Gigantic for Punching Down
      entry.conditionals.push("Gigantic for Punching Down");
      // While Raging: +1(T) Strike
      entry.conditionals.push(`Raging: +${tier} Strike`);
      // Mastery: while Mindful, Wound +dodgeBB×bT
      entry.conditionals.push(`Mindful: +dodgeBB×${baseTier} Wound`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "ss5_primal_fury_5",
        name: "Primal Fury (Raging on Surge)",
        description: "If you use a Primal Surge, enter the Raging State until the end of your turn.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ss5_bloodthirst_3",
        name: "Intense Bloodthirst (BB on Threshold)",
        description: "If you knock an Opponent through a Health Threshold, gain a stack of Battle Born.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ss5_bloodthirst_4",
        name: "Intense Bloodthirst (Spend BB)",
        description: "As an Instant Maneuver, you may spend any number of Battle Born stacks to apply various effects (see manual).",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ss5_saiyan_tendency_1",
        name: "Primal Saiyan Tendency (LP for Power)",
        description: `If you would use an Attacking Maneuver, you may reduce your LP by up to ${10 * baseTier} to increase Strike by 1/5 and Wound by the LP lost. If this would Defeat you, you survive until after the Attacking Maneuver.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Primal Limit Breaker
      entry.triggered.push({
        id: "ss5_exceed_2",
        name: "// Exceed: Primal Limit Breaker (Extra Bloodthirst)",
        description: "You may use the 4th effect of Intense Bloodthirst. This does not count towards that effect's 1/Encounter limit.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    case "legendary_super_saiyan_4": {
      // Max BB on Strike/Dodge +1, on Wound +3
      entry.bonuses.push("+1 max BB (Strike/Dodge), +3 max BB (Wound)");
      // Per 2 BB on Wound: +1(T) Soak
      entry.conditionals.push(`Per 2 Wound BB: +${tier} Soak`);
      // 5+ BB on Wound: +1(T) FO/TE/MA
      entry.conditionals.push(`5+ Wound BB: +${tier} AMB(FO/TE/MA)`);
      // Per Power: +1 DC ToP Extra Dice
      entry.conditionals.push("Per Power: +1 DC ToP Extra Dice");

      // -- Triggered entries --
      // Mastery: LSS Full Power S4
      entry.triggered.push({
        id: "lss4_mastery_4",
        name: "// Mastery: Full Power Direct Hit",
        description: "While in the Full Power Special State, you may use the Direct Hit option of the Defend Maneuver without spending a Counter Action.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Legendary: Legend of GT
      entry.triggered.push({
        id: "lss4_legend_gt_2",
        name: "// Legendary: Legend of GT (Primal Surge)",
        description: `If you knock an Opponent through a Health Threshold with an Attacking Maneuver that you spent ${10 * baseTier} or more KP on the Ki Wager, use a Primal Surge.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Limit Breaker
      entry.triggered.push({
        id: "lss4_exceed_2",
        name: "// Exceed: Limit Breaker (Instant Charge)",
        description: "Use the Energy Charge Maneuver as an Instant Maneuver. You must select your Multiplicative Technique for that Energy Charge.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "condensed_legendary_super_saiyan": {
      // Power Redefined: +1 max BB per Combat Roll
      system.aptitudes.battleBornMaxStackBonus = (system.aptitudes.battleBornMaxStackBonus || 0) + 1;
      entry.bonuses.push("+1 max BB per Combat Roll");
      // +G(T) AMB(AG/FO/TE/MA)
      for (const attr of ["ag", "fo", "te", "ma"]) {
        if (system.attributes[attr]) {
          system.attributes[attr].modifier += G * tier;
          system.attributes[attr].totalScore = system.attributes[attr].score + system.attributes[attr].modifier;
        }
      }
      entry.bonuses.push(`+${G * tier} AMB(AG/FO/TE/MA) (G×T)`);
      // Grade 2+: +G(T) Initiative Value
      if (G >= 2) {
        system.aptitudes.initiativeValue = (system.aptitudes.initiativeValue || 0) + G * tier;
        totals.initiativeValue += G * tier;
        entry.bonuses.push(`+${G * tier} Initiative Value (G×T)`);
      }
      // Grade 3+: double Golden Power KP/Capacity
      if (G >= 3) {
        const kpC = Math.floor(system.kiPool.max / 4);
        const capC = Math.floor(system.capacity.max / 4);
        system.kiPool.max += kpC;
        system.capacity.max += capC;
        totals.kpMax += kpC;
        totals.capacityMax += capC;
        entry.bonuses.push(`+${kpC} Max KP (doubles Heritage)`);
        entry.bonuses.push(`+${capC} Max Capacity (doubles Heritage)`);
      }
      // Legendary: +2 Steadfast (while in SS line)
      totals.steadfast += 2;
      entry.bonuses.push("+2 Steadfast Dice Score (in SS line)");

      // -- Triggered entries --
      entry.triggered.push({
        id: "clss_power_redefined_4",
        name: "Power Redefined (LP Surge)",
        description: `Spend ${5 * baseTier} Life Points to use a Power Surge as an Out-of-Sequence Maneuver.`,
        usageLimit: "3/Encounter",
        maxUses: 3
      });
      entry.triggered.push({
        id: "clss_unstable_demon_2",
        name: "Focused Power (Clash LP)",
        description: "If you enter into a Clash, you may spend LP equal to 1/2 of your Might to increase your Clash Checks by 1/4 (rounded up) of your Might.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "clss_unstable_demon_3",
        name: "Focused Power (Wound LP)",
        description: "When making an Attacking Maneuver, spend LP equal to your Might to increase Wound Roll by your Might. Then apply up to 3 ranks Power Burst OR up to 2 Energy Charges.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "clss_your_ss1_1",
        name: "Your SS1 (Wound on Hit)",
        description: `If you hit an Opponent with an Attacking Maneuver, increase your Wound Roll by ${G * tier} for the duration of that Attacking Maneuver.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "clss_your_ss1_2",
        name: "Your SS1 (Defense on Targeted)",
        description: `If you are targeted by an Opponent's Attacking Maneuver, increase your Defense Value by ${G * tier} for the duration of that Attacking Maneuver.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      if (G >= 2) {
        entry.triggered.push({
          id: "clss_your_ss2_2",
          name: "Your SS2 (Counter on Dodge)",
          description: "If you successfully dodge an Opponent's Attacking Maneuver, you may use the Basic Attack Maneuver targeting that Opponent as an Out-of-Sequence Maneuver.",
          usageLimit: "1/Round",
          maxUses: 1
        });
        entry.triggered.push({
          id: "clss_your_ss2_3",
          name: "Your SS2 (+1 DC on Ki Wager)",
          description: `If you hit an Opponent with an Attacking Maneuver that possesses a Ki Wager of ${5 * baseTier} or more, increase the Damage Category by 1.`,
          usageLimit: "2/Round",
          maxUses: 2
        });
      }
      if (G >= 3) {
        entry.triggered.push({
          id: "clss_your_ss3_3",
          name: "Your SS3 (Double BB Wound)",
          description: `If you hit an Opponent with an Attacking Maneuver that possesses a Ki Wager of ${5 * baseTier} or more, double the bonus to your Wound Rolls from your Battle Born stacks for that Attacking Maneuver.`,
          usageLimit: "2/Round",
          maxUses: 2
        });
      }
      // Legendary: Sparks of Super Saiyan
      entry.triggered.push({
        id: "clss_sparks_2",
        name: "// Legendary: Sparks of SS",
        description: "If you use Transformation Maneuver from SS line to Legendary Saiyan line, increase your Stress Bonus by 2 for that Stress Test.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    case "perfected_super_saiyan": {
      // Super Saiyan Heritage: +1/4 Max KP and Capacity
      const kpP = Math.floor(system.kiPool.max / 4);
      const capP = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpP;
      system.capacity.max += capP;
      totals.kpMax += kpP;
      totals.capacityMax += capP;
      entry.bonuses.push(`+${kpP} Max KP (+1/4)`);
      entry.bonuses.push(`+${capP} Max Capacity (+1/4)`);
      // Apply ToP Extra Dice additional time
      system.aptitudes.topExtraDiceExtraApplications = (system.aptitudes.topExtraDiceExtraApplications || 0) + 1;
      entry.conditionals.push("Apply ToP Extra Dice additional time");
      // Per Power: +1 DC ToP Extra Dice
      const psP = system.tracking?.powerStacks || 0;
      if (psP > 0) {
        system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + psP;
      }
      entry.conditionals.push("Per Power: +1 DC ToP Extra Dice");
      // Legendary: 2+ Power in SS line, +1(T) FO/MA
      if (psP >= 2) {
        system.attributes.fo.modifier += tier;
        system.attributes.fo.totalScore = system.attributes.fo.score + system.attributes.fo.modifier;
        system.attributes.ma.modifier += tier;
        system.attributes.ma.totalScore = system.attributes.ma.score + system.attributes.ma.modifier;
      }
      entry.conditionals.push(`2+ Power in SS line: +${tier} AMB(FO/MA)`);
      // Exceed: The Pinnacle of Super Saiyan
      // L1: +1 max Power Stacks
      system.aptitudes.maxPowerStacksBonus = (system.aptitudes.maxPowerStacksBonus || 0) + 1;
      entry.bonuses.push("// Exceed: +1 max Power Stacks");
      // L2: Triggered/Power (max stacks → Breakthrough)
      entry.conditionals.push("// Exceed: [Triggered/Power] At max Power Stacks → +1 ToP Breakthrough until end of turn");
      // L3: Triggered/Exceed (choose state: Raging/Mindful/Superior)
      entry.conditionals.push("// Exceed: [Triggered/Exceed] Enter Raging/Mindful/Superior until end of next turn");
      // L4 Option: Divine Saiyan / Primal Saiyan
      const psOpt = _findOptionValue(options);
      if (psOpt) {
        const psLo = psOpt.toLowerCase();
        if (psLo.includes("divine")) {
          system.aptitudes.perfectedDivineSaiyanGodKi = true;
          system.aptitudes.perfectedDivineSaiyanFlameOfPower = true;
          entry.bonuses.push("// Exceed: Divine Saiyan (God Ki + Flame of Power in Exceed State)");
        } else if (psLo.includes("primal")) {
          system.aptitudes.perfectedPrimalSaiyanGrowth = true;
          system.aptitudes.perfectedPrimalSaiyanPower = true;
          entry.bonuses.push("// Exceed: Primal Saiyan (Growth LV1 + Primal Power in Exceed State)");
        }
      } else {
        entry.conditionals.push("// Exceed Option: Divine Saiyan / Primal Saiyan");
      }
      break;
    }

    case "superior_super_saiyan": {
      // Apply ToP Extra Dice additional time
      system.aptitudes.topExtraDiceExtraApplications = (system.aptitudes.topExtraDiceExtraApplications || 0) + 1;
      entry.conditionals.push("Apply ToP Extra Dice additional time");
      // Per Zenkai after first: +1 max BB per Combat Roll
      const zenkaiStack = (system.transformations || []).find(t => t.active && t.catalogKey === "zenkai");
      const zenkaiZ = zenkaiStack ? parseInt(String(zenkaiStack.gradeOrStacks).split("/")[0]) || 0 : 0;
      if (zenkaiZ > 1) {
        system.aptitudes.battleBornMaxStackBonus = (system.aptitudes.battleBornMaxStackBonus || 0) + (zenkaiZ - 1);
      }
      entry.conditionals.push("Per Zenkai after 1st: +1 max BB per Combat Roll");
      // 6+ BB + Aura: +2 DC ToP Extra Dice
      const bbTotal = (system.battleBorn?.total ?? 0);
      const auraActive = system.activeAura || false;
      if (bbTotal >= 6 && auraActive) {
        system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + 2;
      }
      entry.conditionals.push("6+ BB + Aura: +2 DC ToP Extra Dice");
      // (No triggered/limited effects in catalog for superior_super_saiyan — effects are triggered/passive with no usage limits)
      break;
    }

    case "ancestral_super_saiyan_3": {
      // 2+ BB on Wound: +2(T) Soak
      entry.conditionals.push(`2+ Wound BB: +${2 * tier} Soak`);
      // Double Golden Power KP/Capacity
      const kpA = Math.floor(system.kiPool.max / 4);
      const capA = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpA;
      system.capacity.max += capA;
      totals.kpMax += kpA;
      totals.capacityMax += capA;
      entry.bonuses.push(`+${kpA} Max KP (doubles Golden Power)`);
      entry.bonuses.push(`+${capA} Max Capacity (doubles Golden Power)`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "ass3_reliable_3",
        name: "Reliable SS3 (Surge on Primitive Durability)",
        description: "If you trigger the second effect of Primitive Durability, you may use a Power Surge immediately after your Healing Surge as an Out-of-Sequence Maneuver.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    case "ultimate_super_saiyan": {
      // Per Power: +1(T) AMB(AG/FO/TE/MA)
      const psU = system.tracking?.powerStacks || 0;
      if (psU > 0) {
        for (const attr of ["ag", "fo", "te", "ma"]) {
          if (system.attributes[attr]) {
            system.attributes[attr].modifier += psU * tier;
            system.attributes[attr].totalScore = system.attributes[attr].score + system.attributes[attr].modifier;
          }
        }
      }
      entry.conditionals.push(`Per Power: +${tier} AMB(AG/FO/TE/MA)`);
      // Super Saiyan Heritage: +1/4 Max KP and Capacity
      const kpU = Math.floor(system.kiPool.max / 4);
      const capU = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpU;
      system.capacity.max += capU;
      totals.kpMax += kpU;
      totals.capacityMax += capU;
      entry.bonuses.push(`+${kpU} Max KP (+1/4)`);
      entry.bonuses.push(`+${capU} Max Capacity (+1/4)`);
      // Apply ToP Extra Dice additional time
      system.aptitudes.topExtraDiceExtraApplications = (system.aptitudes.topExtraDiceExtraApplications || 0) + 1;
      entry.conditionals.push("Apply ToP Extra Dice additional time");
      break;
    }

    // ========== ULTRA INSTINCT / EGO LINE ==========

    case "ultra_instinct_sign": {
      // == Secret of the Self-Centered ==
      // [Permanent, Passive]: Select 2 God Maneuvers for this form
      entry.bonuses.push("Select 2 God Maneuvers for this form");
      // [Automatic/Transform]: Enter Autonomous Ultra Instinct (cannot leave while in this form)
      entry.conditionals.push("[Automatic/Transform] Enter Autonomous Ultra Instinct (no Stress Test, cannot leave)");
      // [Automatic/Transform]: Enter the Mindful State until leaving UI line
      entry.conditionals.push("[Automatic/Transform] Enter Mindful State until leaving UI line");
      // [Passive]: Access to Autonomous Ultra Instinct
      entry.bonuses.push("Access to Autonomous Ultra Instinct Enhancement Power");
      // [Passive]: Apply ToP Extra Dice an additional time
      system.aptitudes.topExtraDiceExtraApplications = (system.aptitudes.topExtraDiceExtraApplications || 0) + 1;
      entry.conditionals.push("Apply ToP Extra Dice an additional time");
      // [Passive]: Ignore all Combat Roll penalties (above Injured, no Weakening)
      entry.conditionals.push("Above Injured & no Weakening: ignore all Combat Roll penalties");

      // == Overwhelming Heat ==
      // [Triggered, Resource]: End of Combat Round, gain Instinct stack (max 3); per stack +1 DC ToP Extra Dice
      entry.conditionals.push("[Triggered/End of Round] Gain 1 Instinct stack (max 3); per stack +1 DC ToP Extra Dice");
      // [Passive]: 3 Instinct stacks: immune to Combat Conditions
      entry.conditionals.push("3 Instinct: immune to all Combat Conditions");
      // [1/Encounter]: 3 Instinct: may enter Instinctual State until end of next turn (Instant)
      entry.conditionals.push("[1/Encounter] 3 Instinct: enter Instinctual State (Instant Maneuver)");
      // [Automatic]: If Weakening Aspect begins, set Instinct to 0
      entry.conditionals.push("[Automatic] Weakening begins: set Instinct stacks to 0");
      // [Passive]: Cannot gain Instinct while suffering Weakening
      entry.conditionals.push("Cannot gain Instinct stacks while Weakening active");

      // == Beyond the Shell ==
      // [Permanent]: Can gain Unique Path even with higher stage access
      entry.bonuses.push("Can gain Unique Path even with higher stage access");
      // [Permanent]: Racial Requirement also considered your Race
      entry.bonuses.push("Racial Requirement also considered your Race");
      // [Permanent, Option]: Race-specific option
      const uisOpt = _findOptionValue(options);
      if (uisOpt) {
        const uisLo = uisOpt.toLowerCase();
        if (uisLo.includes("any race") || uisLo.includes("any_race") || uisLo.includes("universal")) {
          entry.conditionals.push("[Triggered, 1/Round, 2/Encounter] 3 Instinct: choose to not be hit by non-Ultimate ST Attacking Maneuver");
        } else if (uisLo.includes("android")) {
          entry.conditionals.push("[Passive] All Opponents have Lock On stack; no Dodge penalties from them; Surge/Racial KP regain also restores 2(bT) DKP");
        } else if (uisLo.includes("arcosian")) {
          entry.conditionals.push("[Triggered/Transform, Start of Round] Above Injured & no Weakening: maximize Cruelty & may Power Up as Out-of-Sequence");
        } else if (uisLo.includes("bio")) {
          entry.conditionals.push("[Permanent, Passive] Select Super Genetic Trait matching Genetic Traits race; gain it in this form");
        } else if (uisLo.includes("cerealian")) {
          entry.conditionals.push("[Triggered/Transform, Start of Round] Place 1 Observation on all or 2 on one Opponent; double Observation max; attacks are Called Shots");
        } else if (uisLo.includes("earthling")) {
          entry.conditionals.push("[Passive] Treated as above Injured for this form's effects regardless of LP; below additional threshold for other effects");
        } else if (uisLo.includes("majin")) {
          entry.conditionals.push("[Triggered] Targeted by attack: regain LP = 1/4 Might (rounded up); Surge/Racial LP regain also restores 2(bT) DKP");
        } else if (uisLo.includes("namekian")) {
          entry.conditionals.push("[Triggered/Transform, Start of Round] Place 1 Studied on all or 2 on one Opponent; vs 2+ Studied: +2 DC ToP Extra Dice");
        } else if (uisLo.includes("neo") || uisLo.includes("tuffle")) {
          entry.conditionals.push("[Triggered/Transform, Start of Round] Above Injured & no Weakening: maximize Revenge Points & may Power Up as Out-of-Sequence");
        } else if (uisLo.includes("saiyan")) {
          entry.conditionals.push("[Passive] DKP-paid Attacking Maneuvers: +1 Damage Category");
        } else if (uisLo.includes("shadow") || uisLo.includes("dragon")) {
          entry.conditionals.push("[Passive] Gains Supernatural Calamity trait (Super Star Dragon)");
        } else if (uisLo.includes("shinjin")) {
          entry.conditionals.push("[Passive] Attacking Maneuver KP cost <= 5(T): spend 1 DKP to pay cost; treat all Opponents as having a Combat Condition");
        } else if (uisLo.includes("custom")) {
          entry.conditionals.push("[Passive] Above Injured & no Weakening: possess Greater Dice");
        } else {
          entry.conditionals.push(`Beyond the Shell Option: ${uisOpt}`);
        }
      } else {
        entry.conditionals.push("Beyond the Shell: select race-specific option");
      }

      // Mastery: Overcoming the Heat
      // [Permanent]: Loses 1 level Draining, Exhausting, Weakening, Temporary Form; gains Strainless
      entry.conditionals.push("// Mastery: Loses 1 LV Draining, Exhausting, Weakening, Temporary Form; gains Strainless");
      // [Passive]: Ignore 4th and 5th effects of Overwhelming Heat (Weakening reset & cannot gain)
      entry.conditionals.push("// Mastery: Ignore Instinct-reset & Instinct-block from Weakening");
      // [Passive]: All Attacking Maneuvers +1 Damage Category
      entry.conditionals.push("// Mastery: All Attacking Maneuvers +1 Damage Category");

      // Legendary: Instinctual Movement
      // [Triggered/Power, 1/Round]: +1 DC ToP Extra Dice for Dodge until start of next turn
      entry.conditionals.push("// Legendary: [1/Round] +1 DC ToP Extra Dice for Dodge Rolls until next turn");
      // [1/Round]: Movement Maneuver or God Maneuver (AC 1) as Instant Maneuver
      entry.conditionals.push("// Legendary: [1/Round] Use Movement or God Maneuver (AC 1) as Instant Maneuver");

      // Exceed: Unique Instinct
      // [Permanent, Passive]: Select a State (Raging/Superior/Undying/Surging) for bonuses
      entry.conditionals.push("// Exceed: Select State (Raging/Superior/Undying/Surging) for bonuses:");
      entry.conditionals.push(`// Exceed Raging: [2/Round] Apply Raging Extra Dice to Strike Roll`);
      entry.conditionals.push(`// Exceed Superior: +${2 * tier} Soak, Greater Dice +3 DC`);
      entry.conditionals.push("// Exceed Undying: [Triggered/Undying] Regain LP = 1/4 Max LP");
      entry.conditionals.push("// Exceed Surging: [1/Round] ST Wound Roll: apply Surging Extra Dice 2 additional times");
      // [Triggered/Instinctual]: Enter Superior State until end of next turn
      entry.conditionals.push("// Exceed: [Triggered/Instinctual] Enter Superior State until end of next turn");

      // -- Triggered entries --
      entry.triggered.push({
        id: "uis_overwhelming_heat_3",
        name: "Overwhelming Heat (Instinctual State)",
        description: "If you possess 3 stacks of Instinct, you may enter the Instinctual State until the end of your next turn as an Instant Maneuver.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "uis_beyond_shell_4",
        name: "Beyond the Shell (Evade Non-Ultimate)",
        description: "When targeted by a non-Ultimate ST Attacking Maneuver while you have 3 Instinct, you may choose to not be hit regardless of the Strike Roll or Furious State.",
        usageLimit: "2/Encounter",
        maxUses: 2
      });
      // Legendary: Instinctual Movement
      entry.triggered.push({
        id: "uis_instinctual_movement_1",
        name: "// Legendary: Instinctual Movement (Dodge DC)",
        description: "Increase your ToP Extra Dice for Dodge Rolls by 1 Dice Category until the start of your next turn.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "uis_instinctual_movement_2",
        name: "// Legendary: Instinctual Movement (Instant Move/God)",
        description: "Use the Movement Maneuver or a God Maneuver with AC 1 as an Instant Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Unique Instinct
      entry.triggered.push({
        id: "uis_exceed_raging_2",
        name: "// Exceed: Unique Instinct (Raging Strike)",
        description: "When making an Attacking Maneuver, apply the Extra Dice from Raging State to your Strike Roll.",
        usageLimit: "2/Round",
        maxUses: 2
      });
      entry.triggered.push({
        id: "uis_exceed_surging_5",
        name: "// Exceed: Unique Instinct (Surging Wound)",
        description: "If you would use the Signature Technique Maneuver, apply the Surging State Extra Dice to the Wound Roll an additional two times.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "ultra_instinct_complete": {
      // == Beyond Heat (replaces Overwhelming Heat) ==
      // [Passive]: +3 DC ToP Extra Dice
      system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + 3;
      entry.conditionals.push("+3 Dice Categories to ToP Extra Dice");
      // [Passive]: Above Injured & no Weakening: cannot gain Negative Combat Conditions
      entry.conditionals.push("Above Injured & no Weakening: immune to Negative Combat Conditions");
      // [1/Encounter]: Enter Instinctual State until end of next turn (Instant)
      entry.conditionals.push("[1/Encounter] Enter Instinctual State until end of next turn (Instant Maneuver)");
      // [Triggered]: Dodge Opponent attack: spend 1 Counter Action to Basic Attack that Opponent
      entry.conditionals.push("[Triggered] Dodge attack: spend 1 Counter Action to Basic Attack that Opponent");

      // == Pinnacle of Martial Arts ==
      // [Permanent, Passive]: Select 2 God Maneuvers for this form
      entry.bonuses.push("Select 2 God Maneuvers for this form");
      // [Passive]: Immune to Diminishing Defense
      entry.bonuses.push("Immune to Diminishing Defense");
      // [Passive]: Critical Result Extra Dice treated as ToP Extra Dice for DC modifiers
      entry.conditionals.push("Critical Result Extra Dice treated as ToP Extra Dice for DC modifiers");

      // Mastery: Surpassing the Gods
      // [Passive]: Strike & Dodge Critical Target = 7
      entry.conditionals.push("// Mastery: Strike & Dodge Critical Target = 7");
      // [Passive]: May use Signature Technique instead of Basic Attack via Beyond Heat 4th effect
      entry.conditionals.push("// Mastery: Beyond Heat counter-attack may use Signature Technique instead of Basic Attack");
      // [Permanent]: Loses 1 level Draining
      entry.conditionals.push("// Mastery: Loses 1 level Draining Aspect");
      // [Permanent]: Loses 1 level Draining, gains Natural Aspect; AUI does not count for Natural
      entry.conditionals.push("// Mastery: Loses 1 level Draining, gains Natural Aspect (AUI exempt from Natural count)");

      // Legendary: Instinctual Combat
      // [Triggered/Power, 1/Round]: +1 DC ToP Extra Dice for Strike Rolls until next turn
      entry.conditionals.push("// Legendary: [1/Round] +1 DC ToP Extra Dice for Strike Rolls until next turn");
      // [1/Round]: Use Basic Attack as Instant Maneuver
      entry.conditionals.push("// Legendary: [1/Round] Basic Attack as Instant Maneuver");

      // Exceed: Tranquil Instinct
      // [Passive]: Reduce Damage Category of all attacks targeting you by 1; Dodge +1(T)
      entry.conditionals.push(`// Exceed: -1 Damage Category on all attacks targeting you; Dodge +${tier}`);
      // [Triggered/Instinctual]: Enter Superior State until end of next turn
      entry.conditionals.push("// Exceed: [Triggered/Instinctual] Enter Superior State until end of next turn");

      // -- Triggered entries --
      // Legendary: Instinctual Combat
      entry.triggered.push({
        id: "uic_instinctual_combat_1",
        name: "// Legendary: Instinctual Combat (Strike DC)",
        description: "Increase your ToP Extra Dice for Strike Rolls by 1 Dice Category until the start of your next turn.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "uic_instinctual_combat_2",
        name: "// Legendary: Instinctual Combat (Instant Basic)",
        description: "Use the Basic Attack Maneuver as an Instant Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "ultra_ego": {
      // == Secret of the Self-Indulgent ==
      // [Permanent, Passive]: Select 3 God Maneuvers for this form
      entry.bonuses.push("Select 3 God Maneuvers for this form");
      // [Automatic/Transform]: Enter Power of Destruction (no Stress Test, cannot leave)
      entry.conditionals.push("[Automatic/Transform] Enter Power of Destruction (no Stress Test, cannot leave)");
      // [Automatic/Transform]: Enter Superior State until leaving Ultra Ego
      entry.conditionals.push("[Automatic/Transform] Enter Superior State until leaving Ultra Ego");
      // [1/Round]: Power Flare without spending Counter Action
      entry.conditionals.push("[1/Round] Power Flare (Defend) without spending Counter Action");
      // [Passive]: Access to Power of Destruction
      entry.bonuses.push("Access to Power of Destruction Enhancement Power");
      // [Passive]: Apply ToP Extra Dice an additional time to Wound Rolls
      system.aptitudes.topExtraDiceExtraApplicationsWound = (system.aptitudes.topExtraDiceExtraApplicationsWound || 0) + 1;
      entry.conditionals.push("Apply ToP Extra Dice an additional time to Wound Rolls");
      // [Passive]: Ignore all Combat Roll penalties (above Injured)
      entry.conditionals.push("Above Injured: ignore all Combat Roll penalties");
      // [Passive]: Destruction Profile: +6(T) Wound
      entry.conditionals.push(`Destruction Profile: +${6 * tier} Wound Roll`);

      // == Thoughts of Destruction ==
      // [Triggered, 2/Round, Resource]: Hit by attack: gain Ego stack (max 6); per stack +1 DC ToP Extra Dice for Wound; per 2 stacks +1 DC Greater Dice
      entry.conditionals.push("[Triggered, 2/Round] Hit by attack: +1 Ego (max 6); per Ego +1 DC ToP Extra Dice (Wound); per 2 Ego +1 DC Greater Dice");
      // [1/Encounter]: 6 Ego: enter Egotistical State until end of turn (Instant)
      entry.conditionals.push("[1/Encounter] 6 Ego: enter Egotistical State (Instant Maneuver)");
      // [Triggered]: Damaged by attack: regain KP = 1/2 Damage received (rounded up)
      entry.conditionals.push("[Triggered] Damaged: regain KP = 1/2 Damage received (rounded up)");
      // [Triggered]: Damaged by attack: spend 4(bT) DKP to reduce Damage by Might
      entry.conditionals.push(`[Triggered] Damaged: spend ${4 * baseTier} DKP to reduce Damage by Might`);
      // [Triggered/Threshold]: Power Up as Out-of-Sequence; regain DKP = 2x Power Level
      entry.conditionals.push("[Triggered/Threshold] Power Up as Out-of-Sequence; regain DKP = 2x Power Level");
      // [Passive]: Above Injured: immune to Combat Conditions
      entry.conditionals.push("Above Injured: immune to Combat Conditions");

      // == Beyond the Self ==
      // [Permanent]: Racial Requirement also considered your Race
      entry.bonuses.push("Racial Requirement also considered your Race");
      // [Permanent, Option]: Race-specific option
      const ueOpt = _findOptionValue(options);
      if (ueOpt) {
        const ueLo = ueOpt.toLowerCase();
        if (ueLo.includes("any race") || ueLo.includes("any_race") || ueLo.includes("universal")) {
          entry.conditionals.push("[Triggered, 1/Round, 2/Encounter] 6 Ego: choose to take no Damage from non-Ultimate ST (Opponent effects not triggered)");
        } else if (ueLo.includes("android")) {
          entry.conditionals.push("[Passive] All Opponents have Lock On stack; no Dodge penalties; Surge/Racial KP regain also restores 2(bT) DKP");
        } else if (ueLo.includes("arcosian")) {
          entry.conditionals.push("[Triggered/Transform, Start of Round] Above Injured & no Weakening: maximize Cruelty & may Power Up as Out-of-Sequence");
        } else if (ueLo.includes("bio")) {
          entry.conditionals.push("[Permanent, Passive] Select Super Genetic Trait matching Genetic Traits race; gain it in this form");
        } else if (ueLo.includes("cerealian")) {
          entry.conditionals.push("[Triggered/Transform, Start of Round] Place 1 Observation on all or 2 on one; double Observation max; attacks are Called Shots");
        } else if (ueLo.includes("earthling")) {
          entry.conditionals.push("[Passive] Treated as above Injured for this form's effects regardless of LP; below additional threshold for other effects");
        } else if (ueLo.includes("majin")) {
          entry.conditionals.push("[Triggered] Targeted by attack: regain LP = 1/4 Might (rounded up); Surge/Racial LP regain also restores 2(bT) DKP");
        } else if (ueLo.includes("namekian")) {
          entry.conditionals.push("[Triggered/Transform, Start of Round] Place 1 Studied on all or 2 on one; vs 2+ Studied: +2 DC ToP Extra Dice");
        } else if (ueLo.includes("neo") || ueLo.includes("tuffle")) {
          entry.conditionals.push("[Triggered/Transform, Start of Round] Above Injured & no Weakening: maximize Revenge Points & may Power Up as Out-of-Sequence");
        } else if (ueLo.includes("saiyan")) {
          entry.conditionals.push("[Passive] DKP-paid Attacking Maneuvers: +1 Damage Category");
        } else if (ueLo.includes("shadow") || ueLo.includes("dragon")) {
          entry.conditionals.push("[Passive] Gains Supernatural Calamity trait (Super Star Dragon)");
        } else if (ueLo.includes("shinjin")) {
          entry.conditionals.push("[Passive] Attacking Maneuver KP cost <= 5(T): spend 1 DKP to pay cost; treat all Opponents as having a Combat Condition");
        } else if (ueLo.includes("custom")) {
          entry.conditionals.push("[Passive] Above Injured & no Weakening: possess Greater Dice");
        } else {
          entry.conditionals.push(`Beyond the Self Option: ${ueOpt}`);
        }
      } else {
        entry.conditionals.push("Beyond the Self: select race-specific option");
      }

      // Mastery: Overcoming the Self
      // [Permanent]: Loses Power High & Exhausting Aspects; gains Strainless
      entry.conditionals.push("// Mastery: Loses Power High & Exhausting; gains Strainless");
      // [Passive]: Ignore second effect of Superior State
      entry.conditionals.push("// Mastery: Ignore 2nd effect of Superior State");
      // [Passive]: 2+ Power: gains Armored Aspect
      entry.conditionals.push("// Mastery: 2+ Power stacks: gains Armored Aspect");
      // [Triggered, 1/Round]: Per Energy Charge on Destruction Signature Technique: +1(T) Wound
      entry.conditionals.push(`// Mastery: [1/Round] Per Energy Charge on Destruction ST: +${tier} Wound`);
      // [Permanent]: Loses Draining, gains Natural (Power of Destruction exempt from Natural count)
      entry.conditionals.push("// Mastery: Loses Draining, gains Natural (Power of Destruction exempt)");

      // Legendary: Rampant Ego
      // [Triggered/Power, 1/Round]: +1 DC ToP Extra Dice for Strike & Wound until next turn
      entry.conditionals.push("// Legendary: [1/Round] +1 DC ToP Extra Dice for Strike & Wound until next turn");
      // [1/Round]: Power Up or Energy Charge as Instant Maneuver
      entry.conditionals.push("// Legendary: [1/Round] Power Up or Energy Charge as Instant Maneuver");
      // [Passive]: +1 Steadfast Dice Score
      totals.steadfast += 1;
      entry.bonuses.push("// Legendary: +1 Steadfast Dice Score");

      // Exceed: Destructive Egoist
      // [Passive]: 6+ Ego: Destruction Profile attacks +1 Damage Category, min Direct
      entry.conditionals.push("// Exceed: 6+ Ego: Destruction attacks +1 Damage Category (min Direct)");
      // [Triggered/Exceed, Triggered/Power]: Gain 1 Ego stack
      entry.conditionals.push("// Exceed: [Triggered/Exceed, Triggered/Power] Gain 1 Ego stack");

      // -- Triggered entries --
      entry.triggered.push({
        id: "ue_self_indulgent_4",
        name: "Secret of the Self-Indulgent (Power Flare)",
        description: "You may use the Power Flare effect of the Defend Maneuver without spending a Counter Action.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ue_thoughts_1",
        name: "Thoughts of Destruction (Ego Stack)",
        description: "If you are hit by an Opponent's Attacking Maneuver, gain a stack of Ego (max 6). Per Ego: +1 DC ToP Extra Dice for Wound. Per 2 Ego: +1 DC Greater Dice.",
        usageLimit: "2/Round",
        maxUses: 2
      });
      entry.triggered.push({
        id: "ue_thoughts_2",
        name: "Thoughts of Destruction (Egotistical State)",
        description: "If you possess 6 stacks of Ego, you may enter the Egotistical State until the end of your turn as an Instant Maneuver.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ue_beyond_self_3",
        name: "Beyond the Self (Ignore Damage)",
        description: "When targeted by a non-Ultimate ST Attacking Maneuver while you have 6 Ego, you may choose to take no Damage. None of your Opponents' effects are activated from that hit.",
        usageLimit: "2/Encounter",
        maxUses: 2
      });
      // Legendary: Rampant Ego
      entry.triggered.push({
        id: "ue_rampant_ego_1",
        name: "// Legendary: Rampant Ego (ToP DC)",
        description: "Increase your ToP Extra Dice for Strike and Wound Rolls by 1 Dice Category until the start of your next turn.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ue_rampant_ego_2",
        name: "// Legendary: Rampant Ego (Instant Power/Charge)",
        description: "Use the Power Up or Energy Charge Maneuver as an Instant Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    // ========== POTENTIAL UNLEASHED / BEAST ==========

    case "potential_unleashed": {
      // == Actualized Potential ==
      // [Triggered/Transform, Resource]: Gain Peak stacks = Unlocked Potential stacks
      entry.conditionals.push("[Triggered/Transform] Gain Peak stacks = Unlocked Potential stacks (until leaving form)");
      // [Triggered]: When using Potential first effect, spend 1 Peak to set Natural Result to 10
      entry.conditionals.push("[Triggered] Potential trigger: spend 1 Peak to set Natural Result to 10");
      // [Triggered/Power]: Spend 1 Peak to gain additional Power stack via Power Up
      entry.conditionals.push("[Triggered/Power] Spend 1 Peak: gain additional Power stack");
      // [Triggered]: Signature Technique: spend up to 3 Peak for equal Energy Charges
      entry.conditionals.push("[Triggered] Signature Technique: spend up to 3 Peak for equal Energy Charges");

      // == Latent Power ==
      // [Passive]: Per Power: +1(T) AMB(AG/FO/TE/MA)
      entry.conditionals.push(`Per Power: +${tier} AMB(AG/FO/TE/MA)`);
      // [Passive]: Cannot lose Power stacks (except via 4th effect)
      system.aptitudes.cannotLosePowerStacks = true;
      entry.bonuses.push("Cannot lose Power stacks (except via Latent Power 4th effect)");
      // Per Power AMB and Draining aspects
      const psPU = system.tracking?.powerStacks || 0;
      if (psPU > 0) {
        for (const attr of ["ag", "fo", "te", "ma"]) {
          if (system.attributes[attr]) {
            system.attributes[attr].modifier += psPU * tier;
            system.attributes[attr].totalScore = system.attributes[attr].score + system.attributes[attr].modifier;
          }
        }
      }
      // [Passive]: Per Power: +1 Draining level
      entry.conditionals.push("Per Power: +1 level Draining Aspect");
      // [1/Round]: Lose any number of Power stacks as Instant Maneuver
      entry.conditionals.push("[1/Round] Lose any number of Power stacks (Instant Maneuver)");

      // == Power Awakening ==
      // [Permanent]: Racial Requirement also considered your Race
      entry.bonuses.push("Racial Requirement also considered your Race");
      // [Permanent, Option]: Race-specific option
      const puOpt = _findOptionValue(options);
      if (puOpt) {
        const puLo = puOpt.toLowerCase();
        if (puLo.includes("any race") || puLo.includes("any_race") || puLo.includes("universal")) {
          entry.conditionals.push("[Passive] Per Power: +2 DC ToP Extra Dice");
        } else if (puLo.includes("android")) {
          entry.conditionals.push("[Passive] Treat Super Android stacks as Unlocked Potential; Wound Rolls gain Greater Dice vs Lock-On Opponent");
        } else if (puLo.includes("arcosian")) {
          entry.conditionals.push("[Passive] Gains Coup de Grace trait (Metamorphosis)");
        } else if (puLo.includes("bio")) {
          entry.conditionals.push("[Permanent, Passive] Treat Perfection stacks as Unlocked Potential; gains a Genetic Trait of choice (matching Multi-Option race)");
        } else if (puLo.includes("cerealian")) {
          entry.conditionals.push("[Triggered, 1/Round] Critical on Strike: apply Actualized Potential 2nd effect to Wound Roll (no Peak cost)");
        } else if (puLo.includes("earthling")) {
          entry.conditionals.push("[Passive] Per Power: treat Health Threshold as 1 lower; below Critical: Wound gains Greater Dice");
        } else if (puLo.includes("majin")) {
          entry.conditionals.push(`[Passive] Per Power: +${3 * baseTier} LP from any recovery effect; above Bruised: Wound gains Greater Dice`);
        } else if (puLo.includes("namekian")) {
          entry.conditionals.push("[Passive] Treat Super Namekian stacks as Unlocked Potential; Wound gains Greater Dice vs Studied Opponent");
        } else if (puLo.includes("neo") || puLo.includes("tuffle")) {
          entry.conditionals.push("[Passive] Gains Revenge Amplification trait (Super Tuffle)");
        } else if (puLo.includes("saiyan")) {
          entry.conditionals.push("[Passive] Gains S-Cells trait (Super Saiyan)");
        } else if (puLo.includes("shadow") || puLo.includes("dragon")) {
          entry.conditionals.push("[Passive] Gains Supernatural Dominance trait (Shattered Shell)");
        } else if (puLo.includes("shinjin")) {
          entry.conditionals.push("[Permanent, Passive] Gain additional Light Magic (Kaio) or Dark Magic (Makaio) option");
        } else if (puLo.includes("custom")) {
          entry.conditionals.push("[Passive] 2+ Power: Combat Rolls gain Greater Dice");
        } else {
          entry.conditionals.push(`Power Awakening Option: ${puOpt}`);
        }
      } else {
        entry.conditionals.push("Power Awakening: select race-specific option");
      }

      // Mastery: Neverending Potential
      // [Passive]: Not in Full Power: ignore 3rd Latent Power effect (Draining per Power); replace Strainless with Natural
      entry.conditionals.push("// Mastery: Not in Full Power: ignore Draining-per-Power; Strainless becomes Natural");
      // [Passive]: In Full Power: max Power +1 beyond cap; -1 Draining level; excess removed on leaving Full Power
      entry.conditionals.push("// Mastery: Full Power: max Power +1 beyond cap; -1 Draining level");
      // [Triggered/Transform]: Gain 1 Unlocked Potential stack (until leaving form)
      entry.conditionals.push("// Mastery: [Triggered/Transform] +1 Unlocked Potential stack (temporary)");

      // Legendary: Brought to the Limit
      // [Passive]: Double Unlocked Potential AMB
      entry.conditionals.push("// Legendary: Double Unlocked Potential AMB");
      // [Triggered, 1/Round]: 2+ Power + Attacking Maneuver: apply ToP Extra Dice additional time to that attack's Combat Rolls
      entry.conditionals.push("// Legendary: [1/Round] 2+ Power: apply ToP Extra Dice additional time to attack Combat Rolls");

      // Exceed: Endless Potential
      // [Passive]: Per 2 Unlocked Potential stacks: +1 DC ToP Extra Dice
      entry.conditionals.push("// Exceed: Per 2 Unlocked Potential: +1 DC ToP Extra Dice");
      // [Passive]: 2+ Power: +2(T) Combat Rolls, gains Armored Aspect
      entry.conditionals.push(`// Exceed: 2+ Power: +${2 * tier} Combat Rolls, gains Armored`);
      // [1/Encounter]: Instant Maneuver: increase Tier of Power by 2 (Breakthrough) until end of turn
      entry.conditionals.push("// Exceed: [1/Encounter] Instant: +2 Tier of Power (Breakthrough) until end of turn");
      // (No triggered/limited catalog effects for potential_unleashed — all effects are passive/triggered without usage limits)
      break;
    }

    case "beast": {
      // == Furious Potential (replaces Actualized Potential) ==
      // [Passive]: Per Unlocked Potential: +1(T) Wound Rolls
      entry.conditionals.push(`Per Unlocked Potential: +${tier} Wound Rolls`);
      // [Triggered/Power]: In Raging State: gain additional Power stack via Power Up
      entry.conditionals.push("[Triggered/Power] Raging State: gain additional Power stack");
      // [Triggered, 1/Encounter]: In Raging & Surging States + Signature Technique: apply Energy Charges = 1/2 Unlocked Potential stacks
      entry.conditionals.push("[Triggered, 1/Encounter] Raging + Surging + ST: apply Energy Charges = 1/2 Unlocked Potential stacks");

      // == Wrathful Power (replaces Latent Power) ==
      // [Passive]: Per Power: +1(T) AMB(AG/FO/TE/MA)
      entry.conditionals.push(`Per Power: +${tier} AMB(AG/FO/TE/MA)`);
      // [Triggered/Surging]: Until leaving Surging: +1(T) AMB(AG/FO/TE/MA) and +1 Rampaging level
      entry.conditionals.push(`[Triggered/Surging] Until leaving Surging: +${tier} AMB(AG/FO/TE/MA) & +1 Rampaging level`);
      // [Triggered/Power, x/Encounter]: Enter Surging State until end of next turn (x = 1/2 Unlocked Potential, rounded up)
      entry.conditionals.push("[Triggered/Power, x/Encounter] Enter Surging State (x = ceil(Unlocked Potential / 2))");

      // == Bestial Fury ==
      // [Triggered/Transform]: Enter Enraged Enhancement Power as Out-of-Sequence
      entry.conditionals.push("[Triggered/Transform] Enter Enraged Enhancement Power as Out-of-Sequence");
      // [Passive]: Beast + Enraged: may use another Enhancement Power in conjunction
      entry.bonuses.push("Beast + Enraged: may use an additional Enhancement Power");
      // [Passive]: No other Enhancement Powers with Beast: Enraged Stress Test = 0
      entry.conditionals.push("No other EP with Beast: Enraged Stress Test Requirement = 0");

      // Mastery: Overwhelming Potential
      // [Passive]: Remove Power High Aspect
      entry.conditionals.push("// Mastery: Remove Power High Aspect");
      // [Passive]: Do not gain Rampaging from Wrathful Power 2nd effect
      entry.conditionals.push("// Mastery: No Rampaging from Wrathful Power 2nd effect");
      // [Passive]: Max Raging Aspect level becomes 4
      entry.conditionals.push("// Mastery: Max Raging Aspect level = 4");

      // Legendary: Caged Beast
      // [Triggered, 1/Encounter]: Non-Minion Ally Defeated: may Transform into Beast as Out-of-Sequence; if already in Beast, may Exceed instead; apply New Level of Power
      entry.conditionals.push("// Legendary: [1/Encounter] Ally Defeated: Transform into Beast (or Exceed if already in) as Out-of-Sequence + New Level of Power");

      // Exceed: My Turn
      // [Passive]: Surging State Extra Dice +2 DC
      entry.conditionals.push("// Exceed: Surging State Extra Dice +2 Dice Categories");
      // [Passive]: Ignore 2nd effect of Surging State
      entry.conditionals.push("// Exceed: Ignore 2nd effect of Surging State");
      // [Triggered/Start of Turn, 1/Round, 2/Encounter]: +1 Tier of Power (Breakthrough) until end of turn
      entry.conditionals.push("// Exceed: [1/Round, 2/Encounter] Start of Turn: +1 Tier of Power (Breakthrough) until end of turn");

      // -- Triggered entries --
      entry.triggered.push({
        id: "beast_furious_potential_3",
        name: "Furious Potential (ST Energy Charges)",
        description: "If you are in the Raging and Surging States and use the Signature Technique Maneuver, apply Energy Charges equal to 1/2 of your Unlocked Potential stacks.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      // Legendary: Caged Beast
      entry.triggered.push({
        id: "beast_caged_beast_1",
        name: "// Legendary: Caged Beast",
        description: "When a non-Minion Ally is Defeated, you may Transform into Beast as Out-of-Sequence. If already in Beast, you may Exceed instead. Apply New Level of Power effects.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      // Exceed: My Turn
      entry.triggered.push({
        id: "beast_my_turn_3",
        name: "// Exceed: My Turn (Breakthrough)",
        description: "Increase your Tier of Power by 1 (Breakthrough) until the end of your turn.",
        usageLimit: "2/Encounter",
        maxUses: 2
      });
      break;
    }

    case "ajisa_namekian": {
      // == Orange Potential (replaces Actualized Potential) ==
      // [Passive]: Per Unlocked Potential: +1(T) Soak Value
      entry.conditionals.push(`Per Unlocked Potential: +${tier} Soak Value`);
      // [Passive]: In Undying and/or Superior State: gains Armored Aspect
      entry.conditionals.push("Undying and/or Superior State: gains Armored Aspect");
      // [Triggered/Power]: In Undying and/or Superior State: gain additional Power stack via Power Up
      entry.conditionals.push("[Triggered/Power] Undying/Superior State: gain additional Power stack");

      // == Prideful Power (replaces Latent Power) ==
      // [Passive]: Per Power: +1(T) AMB(AG/FO/TE/MA) and +1(T) LP regained via Namekian Biology 2nd effect
      entry.conditionals.push(`Per Power: +${tier} AMB(AG/FO/TE/MA) & +${tier} LP from Namekian Biology`);
      // [Triggered]: If losing a Power stack, may instead remove 1 Studied stack from an Opponent
      entry.conditionals.push("[Triggered] Losing Power: may instead remove 1 Studied from an Opponent");
      // [Triggered/Power, x/Encounter]: Enter Superior State until end of next turn (x = ceil(Unlocked Potential / 2))
      entry.conditionals.push("[Triggered/Power, x/Encounter] Enter Superior State (x = ceil(Unlocked Potential / 2))");

      // == Mark of Ajisa ==
      // [Automatic/Transform]: Top Apparel gains Ajisa Mark Special Quality until leaving form
      entry.conditionals.push("[Automatic/Transform] Top Apparel gains Ajisa Mark Special Quality");
      // [Triggered, 1/Encounter]: Ajisa Mark Apparel destroyed/Doffed: Healing Surge as Out-of-Sequence, then enter Superior State
      entry.conditionals.push("[1/Encounter] Ajisa Mark destroyed/Doffed: Healing Surge (Out-of-Sequence) + enter Superior State");
      // [Passive]: If no Apparel for Ajisa Mark, trigger the 2nd effect instead
      entry.conditionals.push("No Apparel: auto-trigger Ajisa Mark 2nd effect (Healing Surge + Superior)");
      // Ajisa Mark Quality: Wound +x(T) where x = 1/2(Unlocked Potential + Super Namekian stacks);
      //   if knocked through Health Threshold, set LP to max of that threshold, destroy Apparel
      entry.conditionals.push("Ajisa Mark: Wound +x(T) (x = floor((Unlocked Potential + Super Namekian) / 2)); on threshold knock: set LP to threshold max, destroy Apparel");

      // Mastery: Resilient Potential
      // [Passive]: Ignore 3rd effect of Undying and 2nd effect of Superior
      entry.conditionals.push("// Mastery: Ignore 3rd effect of Undying & 2nd effect of Superior");
      // [Passive]: Ignore penalties of a single Super Stack
      entry.conditionals.push("// Mastery: Ignore penalties of 1 Super Stack");
      // [Passive]: +2 Dice Score on Stress Tests with Namekian-requirement Transformations
      entry.conditionals.push("// Mastery: +2 Stress Test Dice Score with Namekian-requirement Transformations");

      // Legendary: Pride of Namek
      // [Triggered/Defeated]: Enter Undying State for 3 Combat Rounds
      entry.conditionals.push("// Legendary: [Triggered/Defeated] Enter Undying State for 3 Combat Rounds");

      // Exceed: Amber Potential
      // [Triggered]: In Superior + Direct Hit Defend: -1 Damage Category on targeting attack
      entry.conditionals.push("// Exceed: Superior + Direct Hit Defend: -1 Damage Category on incoming attack");
      // [Triggered, 1/Round]: Hit by 0-Damage attack: inflict Shaken on attacker; may Basic Attack as Out-of-Sequence
      entry.conditionals.push("// Exceed: [1/Round] Hit for 0 Damage: inflict Shaken on attacker + Basic Attack Out-of-Sequence");
      // [Triggered/Start of Combat Round]: In Undying State: regain 1d8(T) LP and KP
      entry.conditionals.push("// Exceed: [Start of Round] Undying: regain 1d8(T) LP and KP");

      // -- Triggered entries --
      entry.triggered.push({
        id: "ajisa_mark_2",
        name: "Mark of Ajisa (Healing Surge)",
        description: "If a piece of Apparel with the Ajisa Mark is destroyed or Doffed, use a Healing Surge as an Out-of-Sequence Maneuver, then enter the Superior State until end of next turn.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      // Exceed: Amber Potential
      entry.triggered.push({
        id: "ajisa_exceed_2",
        name: "// Exceed: Amber Potential (0 Damage Counter)",
        description: "If you are hit by an Attacking Maneuver that deals 0 Damage, inflict Shaken on the attacker. If you do, you may use Basic Attack as Out-of-Sequence.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    // ========== ARCOSIAN LEGENDARY ==========

    case "empowered_evolution": {
      // -- Beyond Final --
      // [Permanent]: Considered part of Metamorphosis line
      entry.bonuses.push("Considered part of Metamorphosis line");
      // [Passive]: Gains Meta Traits from True Form
      entry.bonuses.push("Gains Meta Traits from True Form");
      // [Passive]: Gains Death Strike, Bursting Power, Coup de Grace, Unending Cruelty
      entry.bonuses.push("Gains Death Strike, Bursting Power, Coup de Grace, Unending Cruelty");

      // -- Refined Brutality --
      // [Passive]: Per Cruelty stack, +1 DC ToP Extra Dice for Wound Rolls
      entry.conditionals.push("Per Cruelty stack: +1 DC ToP Extra Dice for Wound Rolls");
      // [Passive]: Increase Brutal Assault first effect Extra Dice by S DC
      entry.conditionals.push("Brutal Assault Extra Dice +S Dice Categories");
      // [1/Round]: Spend 1 Counter Action to use Basic Attack as Instant Maneuver
      entry.conditionals.push("[1/Round] Spend 1 Counter Action to use Basic Attack as Instant Maneuver");
      // [Triggered/Start of Turn]: Movement or Energy Charge as Out-of-Sequence
      entry.conditionals.push("[Triggered/Start of Turn] May use Movement or Energy Charge as Out-of-Sequence Maneuver");

      // Mastery: Empowered Mutation
      // [Permanent]: Loses Draining and Strainless, gains Natural
      entry.conditionals.push("// Mastery: Loses Draining & Strainless, gains Natural");
      // [Triggered, 1/Round]: Lethal Attacking Maneuver triggers Brutal Assault first effect
      entry.conditionals.push("// Mastery: [Triggered, 1/Round] Lethal Attacking Maneuver triggers Brutal Assault");

      // Legendary: Deadly Finish
      // [Triggered, 1/Round]: Signature Technique with 3+ Cruelty gains an Energy Charge
      entry.conditionals.push("// Legendary: [Triggered, 1/Round] Signature Technique with 3+ Cruelty gains an Energy Charge");

      // Exceed: Pinnacle of Evolution
      // [Passive]: Gains Perfect Ki Control
      entry.conditionals.push("// Exceed: Gains Perfect Ki Control");
      // [Passive]: 3 Refinement stacks = immune to Impediment
      entry.conditionals.push("// Exceed: 3 Refinement stacks = immune to Impediment");
      // [Triggered, Resource]: Each Brutal Assault trigger gains Refinement (max 3); per Refinement +1(T) Combat Rolls
      entry.conditionals.push(`// Exceed: [Triggered] Per Refinement stack (max 3): +${tier} Combat Rolls`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "ee_refined_brutality_3",
        name: "Refined Brutality (Instant Basic)",
        description: "You may spend 1 Counter Action to use the Basic Attack Maneuver as an Instant Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ee_mastery_2",
        name: "// Mastery: Empowered Mutation (Lethal Brutal)",
        description: "If you make an Attacking Maneuver whose Damage Category is Lethal, you may trigger the first effect of Brutal Assault for that Attacking Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ee_legendary_1",
        name: "// Legendary: Deadly Finish",
        description: "If you would use the Signature Technique Maneuver while you have 3+ stacks of Cruelty, that Attacking Maneuver gains an Energy Charge.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "brilliant_evolution": {
      // -- Brilliant Plating --
      // [Passive]: +2(T) KP cost on all Attacking Maneuvers
      system.aptitudes.allAttackKiPenalty = (system.aptitudes.allAttackKiPenalty || 0) + 2 * tier;
      entry.conditionals.push(`+${2 * tier} KP cost on all Attacking Maneuvers`);
      // [Passive]: If you already hit an Opponent this round, +1 Damage Category vs that Opponent
      entry.conditionals.push("[Passive] If already hit Opponent this round: +1 Damage Category vs them");
      // [Passive/Choice]: Depends on previous Stage
      entry.conditionals.push("[Passive] If from Empowered Evolution: gains Perfect Ki Control Aspect");
      entry.conditionals.push("[Passive] If from Super Evolution: gains Growth (LV1) and Armored Aspects");

      // -- Shining Evolution --
      // [Passive]: Apply ToP Extra Dice an additional time
      system.aptitudes.topExtraDiceExtraApplications = (system.aptitudes.topExtraDiceExtraApplications || 0) + 1;
      entry.conditionals.push("Apply ToP Extra Dice additional time");
      // [Triggered/Transform]: Maximize Cruelty stacks
      entry.conditionals.push("[Triggered/Transform] Maximize Cruelty stacks");
      // [Triggered, 1/Round]: If Cruelty maximized, use Signature Technique as Out-of-Sequence
      entry.conditionals.push("[Triggered, 1/Round] Cruelty maximized: Signature Technique as Out-of-Sequence");

      // Mastery: Truly Brilliant
      // [Permanent]: Draining reduced by 2, loses Long Transformation
      entry.conditionals.push("// Mastery: Draining reduced by 2, loses Long Transformation");
      // [Passive]: Ignore first effect of Brilliant Plating (KP cost increase)
      entry.conditionals.push("// Mastery: Ignore +KP cost from Brilliant Plating");
      // [Triggered, 1/Round]: Brutal Assault attack gains +1(T) Strike
      entry.conditionals.push(`// Mastery: [Triggered, 1/Round] Brutal Assault attack: +${tier} Strike`);
      // [Permanent]: Loses Draining & Weakening, gains Strainless
      entry.conditionals.push("// Mastery: Loses Draining & Weakening, gains Strainless");

      // Legendary: Deadly Glimmer
      // [Triggered]: Power Up or Energy Charge grants 1 Cruelty stack
      entry.conditionals.push("// Legendary: [Triggered] Power Up or Energy Charge grants 1 Cruelty stack");

      // Exceed: Strongest Evolution
      // [Passive]: Halve Diminishing Offense penalties
      entry.conditionals.push("// Exceed: Halve Diminishing Offense penalties");
      // [1/Round]: Sacrifice Tail Attack to use Basic Attack OoS; Strike +1(T), Wound +2(T), no Diminishing Offense
      entry.conditionals.push(`// Exceed: [1/Round] Sacrifice Tail Attack for Basic Attack OoS: Strike +${tier}, Wound +${2 * tier}, ignores Diminishing Offense`);
      // [Triggered, 1/Round]: Hit triggers Brutal Assault (extra, doesn't count toward limit)
      entry.conditionals.push("// Exceed: [Triggered, 1/Round] Hit triggers extra Brutal Assault (ignores per-round limit)");

      // -- Triggered entries --
      entry.triggered.push({
        id: "be_shining_evolution_3",
        name: "Shining Evolution (Max Cruelty ST)",
        description: "If you maximize your Cruelty stacks, you may use the Signature Technique Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "be_mastery_3",
        name: "// Mastery: Truly Brilliant (Brutal Strike)",
        description: `If one of your Attacking Maneuvers would benefit from Brutal Assault, increase the Strike Roll by ${tier}.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "be_exceed_2",
        name: "// Exceed: Strongest Evolution (Tail Sacrifice)",
        description: `Sacrifice Tail Attack this round to use Basic Attack OoS. Strike +${tier}, Wound +${2 * tier}, ignores Diminishing Offense.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "be_exceed_3",
        name: "// Exceed: Strongest Evolution (Extra Brutal)",
        description: "If you hit an Opponent, trigger Brutal Assault (does not count toward per-round limit).",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "splendid_evolution": {
      // -- Splendid Plating --
      // [Permanent, Passive]: Select additional Keratinous Plating option
      entry.bonuses.push("Select additional Keratinous Plating option for this form");
      // [Passive]: Unlimited Powered/Beam/Mega Flare via Basic Attack (normally 1/round)
      entry.bonuses.push("Unlimited Powered/Beam/Mega Flare profiles through Basic Attack");
      // [1/Round]: 2+ Cruelty: reduce Soak by 2(T) to increase Strike +1(T) and Wound +2(T) until next turn
      entry.conditionals.push(`[1/Round] 2+ Cruelty: -${2 * tier} Soak to gain +${tier} Strike & +${2 * tier} Wound until next turn`);

      // -- Golden Sheen --
      // [Triggered, 1/Round]: Cruelty reaches 3: +1(T) Combat Rolls until next turn
      entry.conditionals.push(`[Triggered, 1/Round] Cruelty reaches 3: +${tier} Combat Rolls until next turn`);
      // [Triggered/Power, 1/Round]: Gain additional stack of Power through Power Up
      entry.conditionals.push("[Triggered/Power, 1/Round] Gain additional Power stack through Power Up");
      // [Triggered, 3/Round]: Hit grants +1 DC ToP Extra Dice & Brutal Assault Extra Dice until end of turn
      entry.conditionals.push("[Triggered, 3/Round] Hit: +1 DC ToP Extra Dice & Brutal Assault Extra Dice until end of turn");

      // -- Repeating Blows --
      // [Triggered, 1/Round]: Hit allows Signature Technique or Energy Charge as OoS
      entry.conditionals.push("[Triggered, 1/Round] Hit: use Signature Technique or Energy Charge as Out-of-Sequence");
      // [Triggered, 1/Encounter]: Brutal Assault hit: next attack also benefits from Brutal Assault
      entry.conditionals.push("[Triggered, 1/Encounter] Brutal Assault hit: next Attacking Maneuver this round also benefits from Brutal Assault");

      // Mastery: Truly Splendid
      // [Permanent]: Loses Draining, gains Scaling (LV2)
      entry.conditionals.push("// Mastery: Loses Draining, gains Scaling (LV2)");
      // [Passive]: Brutal Assault attack gains +1(T) Strike
      entry.conditionals.push(`// Mastery: [Passive] Brutal Assault attack: +${tier} Strike`);
      // [Triggered, 1/Round]: Hit allows Power Up as OoS
      entry.conditionals.push("// Mastery: [Triggered, 1/Round] Hit: Power Up as Out-of-Sequence");
      // [Permanent]: Loses Dedicated, gains Strainless
      entry.conditionals.push("// Mastery: Loses Dedicated, gains Strainless");

      // Legendary: Turn Brilliant
      // [Triggered/Transform, 1/Encounter]: Maximize Cruelty stacks and enter Superior State until end of next turn
      entry.conditionals.push("// Legendary: [Triggered/Transform, 1/Encounter] Maximize Cruelty & enter Superior State until end of next turn");

      // Exceed: Strongest Evolution
      // [Passive]: Halve Diminishing Offense penalties
      entry.conditionals.push("// Exceed: Halve Diminishing Offense penalties");
      // [1/Round]: Sacrifice Tail Attack for Basic Attack OoS; Strike +1(T), Wound +2(T), no Diminishing Offense
      entry.conditionals.push(`// Exceed: [1/Round] Sacrifice Tail Attack for Basic Attack OoS: Strike +${tier}, Wound +${2 * tier}, ignores Diminishing Offense`);
      // [Triggered, 1/Round]: Hit triggers extra Brutal Assault (doesn't count toward limit)
      entry.conditionals.push("// Exceed: [Triggered, 1/Round] Hit triggers extra Brutal Assault (ignores per-round limit)");
      // (Splendid evolution: no triggered/limited in catalog beyond what's in conditionals — Legendary and Exceed share with brilliant_evolution IDs)
      break;
    }

    case "super_evolution": {
      // -- Apex Mutation --
      // [Permanent, Passive]: Select 4 Meta Traits for this form
      entry.bonuses.push("Select 4 Meta Traits for this form");
      // [Permanent, Passive]: Select Keratinous Plating option (replaces base choice)
      entry.bonuses.push("Select Keratinous Plating option (replaces base choice in this form)");
      // [Choice]: Divergent Evolution dependent
      const seOpt = _findOptionValue(options);
      if (seOpt) {
        const seLo = seOpt.toLowerCase();
        if (seLo.includes("standard")) {
          entry.bonuses.push("Standard: Double Cruelty stacks from Cruel Intentions");
        } else if (seLo.includes("mutant")) {
          entry.conditionals.push("[Triggered/Start of Combat Round] Gain 1 stack of Cruelty");
        }
      } else {
        entry.conditionals.push("Option: Standard (double Cruel Intentions Cruelty) or Mutant (gain 1 Cruelty/round)");
      }

      // -- Unstoppable Plating --
      // [Passive]: Soak +1/4 (rounded up) of Defense Value
      const defVal = system.aptitudes.defenseValue || 0;
      const soakAdd = Math.ceil(defVal / 4);
      if (soakAdd > 0) {
        addSoak(system, soakAdd);
        totals.soak += soakAdd;
        entry.bonuses.push(`+${soakAdd} Soak (1/4 Defense Value)`);
      }
      // [Triggered, 1/Round]: Spend Cruelty stacks to reduce Wound Roll by 1(T) per stack
      entry.conditionals.push(`[Triggered, 1/Round] Spend Cruelty stacks: reduce incoming Wound by ${tier}/stack`);
      // [Triggered, 1/Round]: Take no Damage: Movement OoS to attacker; if in Melee, Basic Attack OoS
      entry.conditionals.push("[Triggered, 1/Round] Take no Damage: Movement OoS toward attacker; if Melee, Basic Attack OoS");
      // [1/Encounter]: Ignore all Combat Conditions (except Oblivious) and Health Threshold Penalties until end of next turn
      entry.conditionals.push("[1/Encounter] Ignore all Combat Conditions (except Oblivious) & Health Threshold Penalties until end of next turn");

      // -- Ferocious Brutality --
      // [Passive]: Max Cruelty stacks = 6
      system.aptitudes.maxCrueltyStacks = Math.max(system.aptitudes.maxCrueltyStacks || 0, 6);
      entry.bonuses.push("Max Cruelty stacks = 6");
      // [Triggered, 1/Round]: On Cruelty gain, spend 2(T) KP for +1 additional Cruelty
      entry.conditionals.push(`[Triggered, 1/Round] On Cruelty gain: spend ${2 * tier} KP for +1 additional Cruelty`);
      // [Triggered, 1/Round]: On Energy Charge, spend 2 Cruelty to Energy Charge again OoS
      entry.conditionals.push("[Triggered, 1/Round] On Energy Charge: spend 2 Cruelty for another Energy Charge OoS");
      // [1/Round]: Spend 2 Cruelty to use Basic Attack or Signature Technique as Instant
      entry.conditionals.push("[1/Round] Spend 2 Cruelty: Basic Attack or Signature Technique as Instant Maneuver");
      // [Triggered, 1/Round]: Maximize Cruelty: next attack treats Cruelty as 6 for Wound calculation
      entry.conditionals.push("[Triggered, 1/Round] Maximize Cruelty: next attack treats Cruelty as 6 for Wound");

      // Mastery: Superior Evolution
      // [Permanent]: Loses Power High & Strainless, gains Natural
      entry.conditionals.push("// Mastery: Loses Power High & Strainless, gains Natural");
      // [Passive]: Double Keratinous Plating third effect bonus
      entry.conditionals.push("// Mastery: Double Keratinous Plating third effect bonus");

      // Legendary: Domination
      // [Triggered, 1/Round]: Maximize Cruelty: next Signature Technique doubles Cruelty Wound bonus
      entry.conditionals.push("// Legendary: [Triggered, 1/Round] Maximize Cruelty: next Signature Technique doubles Cruelty Wound bonus");

      // Exceed: Superior Evolution
      // [Passive]: Halve Diminishing Offense penalties
      entry.conditionals.push("// Exceed: Halve Diminishing Offense penalties");
      // [Passive]: 1+ Power stack: gains Armored Aspect
      entry.conditionals.push("// Exceed: 1+ Power: gains Armored Aspect");
      // [Passive]: 4+ Cruelty: +1 Damage Category on Attacking Maneuvers
      entry.conditionals.push("// Exceed: 4+ Cruelty: +1 Damage Category on Attacking Maneuvers");
      // [Triggered, 1/Round]: Hit by attack: reduce Damage by Might
      entry.conditionals.push("// Exceed: [Triggered, 1/Round] Hit by attack: reduce Damage by Might");
      // [Triggered, 1/Round]: On Attacking Maneuver: Energy Charge OoS
      entry.conditionals.push("// Exceed: [Triggered, 1/Round] On Attacking Maneuver: Energy Charge as Out-of-Sequence");

      // -- Triggered entries --
      entry.triggered.push({
        id: "se_unstoppable_2",
        name: "Unstoppable Plating (Spend Cruelty DR)",
        description: `Spend Cruelty stacks to reduce incoming Wound by ${tier}/stack.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "se_ferocious_2",
        name: "Ferocious Brutality (Extra Cruelty)",
        description: `On Cruelty gain, spend ${2 * tier} KP for +1 additional Cruelty.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "se_ferocious_3",
        name: "Ferocious Brutality (Double Charge)",
        description: "On Energy Charge, spend 2 Cruelty to Energy Charge again as Out-of-Sequence.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "se_ferocious_4",
        name: "Ferocious Brutality (Cruelty Instant)",
        description: "Spend 2 Cruelty to use Basic Attack or Signature Technique as Instant Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "se_ferocious_5",
        name: "Ferocious Brutality (Max Cruelty Wound)",
        description: "If you maximize your Cruelty stacks, the next Attacking Maneuver this round treats Cruelty as 6 for Wound calculation.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Legendary: Domination
      entry.triggered.push({
        id: "se_domination_1",
        name: "// Legendary: Domination",
        description: "If you maximize Cruelty stacks, the next Signature Technique this round doubles the Cruelty Wound bonus.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Superior Evolution
      entry.triggered.push({
        id: "se_exceed_4",
        name: "// Exceed: Superior Evolution (Might DR)",
        description: "If you are hit by an Attacking Maneuver, reduce the Damage you receive by your Might.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "se_exceed_5",
        name: "// Exceed: Superior Evolution (Attack Charge)",
        description: "When making an Attacking Maneuver, you may use Energy Charge as Out-of-Sequence.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    // ========== DEMON GOD LINE ==========

    case "initial_demon_god": {
      // -- Divine Dark Magic --
      // [Passive]: KP Cost of non-Attacking Maneuvers must use DKP
      entry.conditionals.push("Non-Attacking Maneuver KP Cost must use DKP");
      // [Passive]: Ignore second effect of Surging State
      entry.bonuses.push("Ignore second effect of Surging State");
      // [Triggered/Power]: Spend 4(bT) DKP to enter Surging State until end of turn
      entry.conditionals.push(`[Triggered/Power] Spend ${4 * baseTier} DKP to enter Surging State until end of turn`);
      // [Choice]: Dark Magic option-dependent
      const idgOpt = _findOptionValue(options);
      if (idgOpt) {
        const lo = idgOpt.toLowerCase();
        if (lo.includes("kiri") || lo.includes("drain")) {
          system.aptitudes.energyDrainClashWinBroken = true;
          entry.conditionals.push("[Triggered, 1/Round] Win Energy Drain Clash: target gains Broken until end of next turn");
        } else if (lo.includes("powerful")) {
          system.aptitudes.darkMagicAlwaysAboveInjured = true;
          // FO/MA highest check
          const foS = system.attributes.fo?.score ?? 0, maS = system.attributes.ma?.score ?? 0;
          const otherScores = ["ag", "te", "in", "pe", "sc"].map(k => system.attributes[k]?.score ?? 0);
          const maxOther = Math.max(...otherScores);
          if (foS >= maxOther || maS >= maxOther) {
            system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + tier;
            system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + tier;
            system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + tier;
            totals.combatRolls += tier;
            entry.bonuses.push(`+${tier} Combat Rolls (Powerful Demon, FO/MA highest)`);
          }
          entry.bonuses.push("Always above Injured for Dark Magic effects");
        } else if (lo.includes("eternal")) {
          system.aptitudes.darkMagicAlwaysAboveInjured = true;
          // AG/TE highest check
          const agE = system.attributes.ag?.score ?? 0, teE = system.attributes.te?.score ?? 0;
          const otherE = ["fo", "ma", "in", "pe", "sc"].map(k => system.attributes[k]?.score ?? 0);
          const maxOtherE = Math.max(...otherE);
          if (agE >= maxOtherE || teE >= maxOtherE) {
            system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + tier;
            system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + tier;
            system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + tier;
            totals.combatRolls += tier;
            entry.bonuses.push(`+${tier} Combat Rolls (Eternal Demon, AG/TE highest)`);
          }
          entry.bonuses.push("Always above Injured for Dark Magic effects");
        } else if (lo.includes("manipulative")) {
          system.aptitudes.manipulativeDemonInstantCost = 2 * baseTier;
          entry.conditionals.push(`[1/Round] Spend ${2 * baseTier} DKP: Analysis or Hype as Instant Maneuver`);
        } else if (lo.includes("transforming")) {
          // +2 Stress Bonus when used with Enhancement Power active
          const hasEnh = (system.transformations || []).some(t => t.active && (t.transformationType === "enhancement_power" || t.transformationType === "enhancement_standard"));
          if (hasEnh) {
            system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 2;
            totals.stressBonus += 2;
            entry.bonuses.push("+2 Stress Bonus (Transforming Demon, w/ Enhancement Power active)");
          } else {
            entry.bonuses.push("+2 Stress Bonus when used with Enhancement Power");
          }
        } else if (lo.includes("elemental")) {
          system.aptitudes.elementalDemonProfileExtraCharges = (system.aptitudes.elementalDemonProfileExtraCharges || 0) + 2;
          entry.conditionals.push("[Triggered, 1/Round] Attacking Maneuver of selected Profile: gains 2 Energy Charges");
        } else if (lo.includes("commanding")) {
          system.aptitudes.commandingDemonMinionAttrBonus = (system.aptitudes.commandingDemonMinionAttrBonus || 0) + 2 * tier;
          entry.conditionals.push(`Minions: +${2 * tier} AMB(AG/FO/TE/MA)`);
        }
      } else {
        entry.conditionals.push("Option: Dark Magic choice (Kiri Drain/Powerful/Eternal/Manipulative/Transforming/Elemental/Commanding)");
      }

      // -- Demonic Branding --
      // [Triggered/Transform, Triggered/Start of Round]: Clash (Cognitive) to Brand an Opponent
      entry.conditionals.push("[Triggered/Transform, Start of Round] Clash (Cognitive) to Brand an Opponent until end of Combat Round");
      // [Triggered, 1/Round]: Defeat or threshold-knock Branded: regain 6(bT) DKP
      entry.conditionals.push(`[Triggered, 1/Round] Defeat/threshold-knock Branded: regain ${6 * baseTier} DKP`);
      // [Automatic/Surging]: Must target Branded for Surging State
      entry.conditionals.push("[Automatic/Surging] Must select Branded Character for Surging target");
      // [Passive]: +1 Damage Category vs Branded
      entry.conditionals.push("[Passive] +1 Damage Category vs Branded Characters");
      // [Passive]: -3(T) Wound vs non-Branded if a Branded exists
      entry.conditionals.push(`[Passive] -${3 * tier} Wound vs non-Branded (while Branded exists)`);
      // [Passive]: Branded treated as having Combat Condition for your effects
      entry.conditionals.push("[Passive] Branded Characters count as having a Combat Condition");
      // [Passive]: Double Wound bonus from Demonic Advantage second effect vs Branded
      entry.conditionals.push("[Passive] Double Wound bonus from Demonic Advantage vs Branded");

      // Mastery: Divine Demon
      // [Permanent]: Loses Strainless, gains Natural
      entry.conditionals.push("// Mastery: Loses Strainless, gains Natural");
      // [Passive]: Ignore first effect of Divine Dark Magic (DKP cost for non-attacks)
      entry.conditionals.push("// Mastery: Ignore DKP cost requirement for non-Attacking Maneuvers");
      // [Passive]: May Brand up to 3 Opponents; 1(bT) DKP per extra
      entry.conditionals.push(`// Mastery: May Brand up to 3 Opponents; ${baseTier} DKP per extra`);

      // Legendary: Fiendish Sorcery
      // [Passive]: Create Fiendish Weapon (3 Qualities + Unbreakable + Pondering Orb)
      entry.conditionals.push("// Legendary: Fiendish Weapon (3 Qualities + Unbreakable + Pondering Orb)");
      // [Passive]: Ignore Weapon Penalties with Fiendish Weapon; treat as Unarmed for your effects
      entry.conditionals.push("// Legendary: Ignore Weapon Penalties; Fiendish Weapon counts as Unarmed for your effects");
      // [1/Round]: Warp Fiendish Weapon to your grip as Instant Maneuver
      entry.conditionals.push("// Legendary: [1/Round] Warp Fiendish Weapon to grip as Instant Maneuver");

      // Exceed: Evolved Demon God
      // [Passive]: Attacking Maneuvers vs Opponents with Combat Condition ignore Diminishing Offense
      entry.conditionals.push("// Exceed: Attacks vs Combat Condition Opponents ignore Diminishing Offense");
      // [Passive]: Halve DKP spent on Divine Dark Magic 3rd effect
      entry.conditionals.push("// Exceed: Halve DKP cost for Surging State entry");
      // [Triggered, 1/Round]: Opponent becomes Branded: Basic Attack OoS vs them
      entry.conditionals.push("// Exceed: [Triggered, 1/Round] Opponent becomes Branded: Basic Attack OoS");

      // -- Triggered entries --
      entry.triggered.push({
        id: "idg_demonic_branding_2",
        name: "Demonic Branding (DKP on Defeat/Threshold)",
        description: `If you Defeat a Branded Character or knock them through a Health Threshold, regain ${6 * baseTier} DKP.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Legendary: Fiendish Sorcery
      entry.triggered.push({
        id: "idg_fiendish_sorcery_3",
        name: "// Legendary: Fiendish Sorcery (Warp Weapon)",
        description: "As an Instant Maneuver, warp your Fiendish Weapon into your grip and equip it, regardless of previous location. If another Character was holding it, it is unequipped from them.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Evolved Demon God
      entry.triggered.push({
        id: "idg_exceed_3",
        name: "// Exceed: Evolved Demon God (Branded Basic)",
        description: "When an Opponent becomes Branded, use the Basic Attack Maneuver against that Opponent as an Out-of-Sequence Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "true_demon_god": {
      // -- Demonic Fury --
      // [Triggered/Transform]: Integrate Fiendish Weapon
      entry.conditionals.push("[Triggered/Transform] Integrate Fiendish Weapon");
      // [Permanent, Passive]: Select 2 Bestial Traits for this form
      entry.bonuses.push("Select 2 Bestial Traits for this form");
      // [Passive]: Soak +1/2 of Insight Modifier
      const insMod = system.attributes.in ? system.attributes.in.modifier : 0;
      const soakIns = Math.floor(insMod / 2);
      if (soakIns > 0) {
        addSoak(system, soakIns);
        totals.soak += soakIns;
        entry.bonuses.push(`+${soakIns} Soak (1/2 IN Modifier)`);
      }
      // [Permanent, Option]: Demonic God Beast or Demonic God Style
      const tdgOpt = _findOptionValue(options);
      if (tdgOpt) {
        const tdgLo = tdgOpt.toLowerCase();
        if (tdgLo.includes("beast")) {
          // Gains Growth (LV2), +1(T) AMB(TE/FO/MA), +1 DC Punching Down Extra Dice
          for (const attr of ["te", "fo", "ma"]) {
            if (system.attributes[attr]) {
              system.attributes[attr].modifier += tier;
              system.attributes[attr].totalScore = system.attributes[attr].score + system.attributes[attr].modifier;
            }
          }
          entry.bonuses.push(`+${tier} AMB(TE/FO/MA) (Demonic God Beast)`);
          entry.bonuses.push("Gains Growth (LV2) Aspect");
          entry.conditionals.push("+1 DC Punching Down Extra Dice (Demonic God Beast)");
        } else if (tdgLo.includes("style")) {
          // Gains Battle Uniform Aspect (same as Initial Demon God)
          system.aptitudes.demonicGodStyleBattleUniform = true;
          entry.bonuses.push("Gains Battle Uniform Aspect (Initial Demon God uniform)");
        }
      } else {
        entry.conditionals.push("Option: Demonic God Beast (Growth LV2, +AMB, Punching Down) or Demonic God Style (Battle Uniform)");
      }

      // -- Unholy Smite (Demonic Branding) --
      // [Passive]: Surging target treated as having Combat Condition for all your effects
      entry.conditionals.push("[Passive] Surging target treated as having Combat Condition");
      // [Triggered]: Spend 2(bT) DKP to increase Damage Category by 1 on an Attacking Maneuver
      entry.conditionals.push(`[Triggered] Spend ${2 * baseTier} DKP: +1 Damage Category on Attacking Maneuver`);
      // [1/Round]: Melee Instant: Clash (Cognitive/Might) to apply Broken until end of turn
      entry.conditionals.push("[1/Round] Melee Instant: Clash (Cognitive/Might) to apply Broken until end of turn");
      // [1/Round]: Power Up as Instant Maneuver
      entry.conditionals.push("[1/Round] Power Up as Instant Maneuver");
      // [Triggered, 1/Round]: Defeat/threshold-knock: regain 8(bT) DKP
      entry.conditionals.push(`[Triggered, 1/Round] Defeat/threshold-knock: regain ${8 * baseTier} DKP`);

      // Mastery: True Demon
      // [Permanent]: Loses Exhausting
      entry.conditionals.push("// Mastery: Loses Exhausting Aspect");
      // [Choice]: Depends on Demonic Fury option
      entry.conditionals.push("// Mastery: Beast: Ignore Defense penalty from Size, treat Size as 1 smaller for Punching Up");
      entry.conditionals.push(`// Mastery: Style: +${tier} Strike vs Opponents with Combat Condition`);

      // Legendary: Diabolic Destruction
      // [Passive]: +2(T) Wound with Fiendish Weapon vs Combat Condition Opponents
      entry.conditionals.push(`// Legendary: +${2 * tier} Wound with Fiendish Weapon vs Combat Condition Opponents`);
      // [Triggered, 1/Encounter]: Hit with Fiendish Weapon vs CC Opponent: force Critical Wound Result
      entry.conditionals.push("// Legendary: [1/Encounter] Fiendish Weapon hit vs CC Opponent: force Critical Wound Result");

      // Exceed: Transcended Demon God
      // [Passive]: Lose Option effect of Demonic Fury
      entry.conditionals.push("// Exceed: Lose Demonic Fury Option effect");
      // [Passive]: +1(T) Combat Rolls and Soak
      entry.conditionals.push(`// Exceed: +${tier} Combat Rolls & +${tier} Soak`);
      // [Passive]: Size becomes base, but all Wound Rolls +1d8(T)
      entry.conditionals.push(`// Exceed: Size becomes base; all Wound Rolls +1d8(${tier})`);
      // [Automatic/Exceed]: Destroy Apparel, gain Doff Bonus until leaving Exceed
      entry.conditionals.push("// Exceed: [Automatic] Destroy Apparel, gain Doff Bonus until leaving Exceed");

      // -- Triggered entries --
      entry.triggered.push({
        id: "tdg_unholy_smite_3",
        name: "Unholy Smite (Broken on Melee)",
        description: "Target an Opponent within Melee Range as an Instant Maneuver. Make a Clash (Cognitive or Might). If you win, they gain Broken until end of your turn.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "tdg_unholy_smite_4",
        name: "Unholy Smite (Instant Power Up)",
        description: "Use the Power Up Maneuver as an Instant Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "tdg_unholy_smite_5",
        name: "Unholy Smite (DKP on Defeat/Threshold)",
        description: `If you Defeat an Opponent or knock them through a Health Threshold, regain ${8 * baseTier} DKP.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Legendary: Diabolic Destruction
      entry.triggered.push({
        id: "tdg_diabolic_2",
        name: "// Legendary: Diabolic Destruction (Forced Crit)",
        description: "If you hit an Opponent with a Fiendish Weapon Attacking Maneuver while they suffer from a Combat Condition, you may choose to score a Critical Result for the Wound Roll regardless of Natural Result.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    case "dark_demon_god": {
      // -- Fraction of the Dark Factor (Demonic Fury) --
      // [Triggered, 1/Round]: Signature Technique Damage: spend 3(bT) DKP to apply Guard Down
      entry.conditionals.push(`[Triggered, 1/Round] Signature Technique Damage: spend ${3 * baseTier} DKP to apply Guard Down until target's turn`);
      // [Triggered, 1/Round]: Enter/maintain Aura near Opponent: spend 2(bT) DKP to use Opponent's KP for Aura cost
      entry.conditionals.push(`[Triggered, 1/Round] Aura near Opponent: spend ${2 * baseTier} DKP to use Opponent's KP for Aura cost`);
      // [Triggered, 1/Round]: Magical Unique Ability: spend 2(bT) DKP, all Opponents in Melee lose LP = 1/2 Might
      entry.conditionals.push(`[Triggered, 1/Round] Magical Unique Ability: spend ${2 * baseTier} DKP, Melee Opponents lose LP = 1/2 Might`);
      // [Triggered, 1/Encounter]: Attacking Maneuver gains 2 Energy Charges
      entry.conditionals.push("[Triggered, 1/Encounter] Attacking Maneuver gains 2 Energy Charges");
      // [Triggered/Power, 1/Encounter]: Regain DKP = 2x Power Level
      entry.conditionals.push("[Triggered/Power, 1/Encounter] Regain DKP = 2x Power Level");
      // [Permanent, Option]: Dark Factor sub-option
      const ddgOpt = _findOptionValue(options);
      if (ddgOpt) {
        const ddgLo = ddgOpt.toLowerCase();
        if (ddgLo.includes("liberation")) {
          system.aptitudes.darkFactorLiberationCost = 2 * baseTier;
          entry.conditionals.push(`[Triggered, 1/Round] Targeted by attack: spend ${2 * baseTier} DKP to Defend without Counter Action`);
        } else if (ddgLo.includes("empower")) {
          system.aptitudes.darkFactorEmpowerCostMax = 4 * baseTier;
          system.aptitudes.darkFactorEmpowerMultiplier = 3;
          entry.conditionals.push(`[Triggered] Attack: spend up to ${4 * baseTier} DKP, Wound +3x DKP spent`);
        } else if (ddgLo.includes("enhance")) {
          system.aptitudes.darkFactorEnhanceCostMax = 4 * baseTier;
          system.aptitudes.darkFactorEnhanceDRMultiplier = 2;
          entry.conditionals.push(`[Triggered] Targeted by attack: spend up to ${4 * baseTier} DKP, DR +2x DKP spent`);
        }
      } else {
        entry.conditionals.push("Option: Dark Factor Liberation (Defend) / Empower (Wound) / Enhance (DR)");
      }

      // Mastery: Depths of Darkness
      // [Permanent]: Loses Exhausting
      entry.conditionals.push("// Mastery: Loses Exhausting Aspect");
      // [Passive]: Full Power State grants access to all Dark Factor options
      entry.conditionals.push("// Mastery: Full Power State: access all Dark Factor options");
      // [Permanent]: Loses Draining, gains Strainless
      entry.conditionals.push("// Mastery: Loses Draining, gains Strainless");

      // Exceed: Limitless Darkness
      // [Passive]: May use KP instead of DKP for Dark Factor effects
      entry.conditionals.push("// Exceed: May use KP instead of DKP for Dark Factor effects");
      // [Triggered]: Standard Maneuver (1 Action cost): gain 1(bT) DKP
      entry.conditionals.push(`// Exceed: [Triggered] Standard Maneuver (1 Action): gain ${baseTier} DKP`);
      // [Triggered]: Spending DKP: regain KP = 1/2 DKP spent
      entry.conditionals.push("// Exceed: [Triggered] Spend DKP: regain KP = 1/2 DKP spent");

      // -- Triggered entries --
      entry.triggered.push({
        id: "ddg_fraction_1",
        name: "Fraction of Dark Factor (Guard Down)",
        description: `If you deal Damage with a Signature Technique, spend ${3 * baseTier} DKP to apply Guard Down to that Opponent until start of their turn.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ddg_fraction_2",
        name: "Fraction of Dark Factor (Steal Aura KP)",
        description: `When entering/maintaining Aura near an Opponent, spend ${2 * baseTier} DKP to use that Opponent's KP for the Aura cost.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ddg_fraction_3",
        name: "Fraction of Dark Factor (Magical LP Drain)",
        description: `If you use a Magical Unique Ability, spend ${2 * baseTier} DKP. All Opponents in Melee lose LP = 1/2 of your Might.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ddg_fraction_4",
        name: "Fraction of Dark Factor (2 Energy Charges)",
        description: "When you use an Attacking Maneuver, gain 2 Energy Charges on that Attacking Maneuver.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ddg_fraction_5",
        name: "Fraction of Dark Factor (DKP on Power)",
        description: "Regain DKP equal to twice your Power Level.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    case "dark_king": {
      // -- Dark Lineage --
      // [Passive]: DKP > 1/2 starting DKP: possess Greater Dice
      entry.conditionals.push("DKP > 1/2 starting DKP: possess Greater Dice");
      // [Passive]: DKP-paid attacks: reduce KP Cost by 2(T), can go below minimum (if cost <=2T, spend 1 DKP)
      entry.conditionals.push(`DKP-paid attacks: KP Cost reduced by ${2 * tier} (can go below min; if cost <=${2 * tier}, spend 1 DKP)`);
      // [Passive]: Gains 4th effect of Divine Dark Magic (Surging entry for DKP)
      entry.conditionals.push(`Gains Divine Dark Magic 4th effect: spend ${4 * baseTier} DKP to enter Surging State`);
      // [Triggered, 1/Round]: DKP-paid attack: +1 Damage Category
      entry.conditionals.push("[Triggered, 1/Round] DKP-paid Attacking Maneuver: +1 Damage Category");

      // -- Dark Factor --
      // [Passive]: Opponents below Injured treated as having Combat Condition for your effects
      entry.conditionals.push("[Passive] Opponents below Injured threshold: treated as having Combat Condition");
      // [Passive]: Skill of the Watcher: KP Cost -2(T), Clash Dice Score +1(T)
      entry.conditionals.push(`Skill of the Watcher: KP Cost -${2 * tier}, Clash +${tier}`);
      // [Permanent, Multi-Option/2]: Select 2 from options
      const dkOpts = _findAllOptionValues(options);
      if (dkOpts.length > 0) {
        for (const dkOpt of dkOpts) {
          const dkLo = dkOpt.toLowerCase();
          if (dkLo.includes("gauntlet")) {
            totals.dr += tier;
            system.status.dr = (system.status.dr || 0) + tier;
            system.aptitudes.kingsGauntletsWoundDie = `1d4(${tier})`;
            entry.bonuses.push(`+${tier} DR (King's Gauntlets)`);
            entry.conditionals.push(`+1d4(${tier}) Wound (King's Gauntlets)`);
          }
          if (dkLo.includes("finisher")) {
            system.aptitudes.kingsFinisherSelected = true;
            entry.conditionals.push("[Triggered/Transform] Selected Signature Technique: gains Energy Charge, Wound +1/2 Ki Wager (must pay DKP)");
          }
          if (dkLo.includes("wild")) {
            totals.soak += tier;
            addSoak(system, tier);
            entry.bonuses.push(`+${tier} Soak (King's Wild Side)`);
            entry.bonuses.push("Select a Bestial Trait for this form (King's Wild Side)");
          }
          if (dkLo.includes("cloak")) {
            system.aptitudes.kingsCloakFreeAura = true;
            entry.conditionals.push("King's Cloak: Custom Aura (TP Cost 50, Restricted to Dark King, free entry)");
          }
          if (dkLo.includes("shadow")) {
            system.aptitudes.kingsShadowMinionAvailable = true;
            entry.conditionals.push("[1/Encounter] Create Gigantic Duplicate Minion");
          }
          if (dkLo.includes("liberation")) {
            system.aptitudes.darkFactorLiberationCost = 2 * baseTier;
            entry.conditionals.push(`[Triggered, 1/Round] Targeted: spend ${2 * baseTier} DKP to Defend without Counter Action`);
          }
          if (dkLo.includes("empower")) {
            system.aptitudes.darkFactorEmpowerCostMax = 4 * baseTier;
            system.aptitudes.darkFactorEmpowerMultiplier = 3;
            entry.conditionals.push(`[Triggered] Attack: spend up to ${4 * baseTier} DKP, Wound +3x DKP spent`);
          }
          if (dkLo.includes("enhance")) {
            system.aptitudes.darkFactorEnhanceCostMax = 4 * baseTier;
            system.aptitudes.darkFactorEnhanceDRMultiplier = 2;
            entry.conditionals.push(`[Triggered] Targeted: spend up to ${4 * baseTier} DKP, DR +2x DKP spent`);
          }
        }
      } else {
        entry.conditionals.push("Multi-Option/2: King's Gauntlets(DR+Wound) / Finisher(ST) / Wild Side(Soak+Bestial) / Cloak(Aura) / Shadow(Minion) / Liberation(Defend) / Empower(Wound) / Enhance(DR)");
      }

      // Mastery: Lord of Demons
      // [Permanent]: Loses Strainless, gains Natural
      entry.conditionals.push("// Mastery: Loses Strainless, gains Natural");
      // [Passive]: DKP < 1/2 starting: Wound +Insight Modifier
      entry.conditionals.push("// Mastery: DKP < 1/2 starting: Wound +IN Modifier");
      // [Permanent, Passive]: Select 2 additional Dark Factor options (Full Power State only)
      entry.conditionals.push("// Mastery: Select 2 additional Dark Factor options (Full Power State only)");

      // Legendary: Bow to the King
      // [Passive]: +1(T) Combat Rolls vs Combat Condition Opponents
      entry.conditionals.push(`// Legendary: +${tier} Combat Rolls vs Combat Condition Opponents`);

      // Exceed: Winged King
      // [Passive]: Gains Graded Aspect
      entry.conditionals.push("// Exceed: Gains Graded Aspect (3 Grades)");
      // [Passive]: +G(T) Wound vs Opponents with Combat Condition
      entry.conditionals.push(`// Exceed: +G(${tier}) Wound vs Combat Condition Opponents`);
      // Grade 1 (No Wings): Gain 3rd effect of Demonic Fury (Soak +1/2 IN Modifier)
      entry.conditionals.push("// Exceed Grade 1 (No Wings): Gain Demonic Fury 3rd effect (Soak +1/2 IN Mod), +1 DC ToP Extra Dice");
      // Grade 2 (One Wing): Bestial Movement (Wings), +1(T) AMB(FO/MA), +2 DC ToP Extra Dice
      entry.conditionals.push(`// Exceed Grade 2 (One Wing): Bestial Movement (Wings), +${tier} AMB(FO/MA), +2 DC ToP Extra Dice`);
      // Grade 3 (Two Wings): Regain 3(bT) DKP/round, +2(T) AMB(FO/MA), +3 DC ToP Extra Dice
      entry.conditionals.push(`// Exceed Grade 3 (Two Wings): Regain ${3 * baseTier} DKP/round, +${2 * tier} AMB(FO/MA), +3 DC ToP Extra Dice`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "dk_dark_lineage_4",
        name: "Dark Lineage (DKP +1 DC)",
        description: "If you use an Attacking Maneuver paid with DKP, increase the Damage Category by 1.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "dk_king_shadow_8",
        name: "King's Shadow (Duplicate Minion)",
        description: "Create a Duplicate Minion of Gigantic Size Category (does not benefit from Dark Factor 3rd effect while in Dark King).",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    case "feral_demonic_lord": {
      // -- Unleashed Inner Power --
      // [Permanent]: Can only enter via Immense Inner Power choice of Masked Feelings
      entry.bonuses.push("Entry: Immense Inner Power (Masked Feelings) only");
      // [Automatic/Transform]: Enter Undying, Feral, Superior, and Surging States
      entry.bonuses.push("Auto-enter Undying, Feral, Superior, and Surging States on Transform");
      // [Automatic]: Defeating Surging target leaves this form
      entry.conditionals.push("[Automatic] Defeat Surging target: leave this Transformation");
      // [Passive]: Increase Tier of Power by 1 (Breakthrough)
      entry.bonuses.push("+1 Tier of Power (Breakthrough)");
      // [Passive]: No Stress Tests while in this form
      entry.bonuses.push("No Stress Tests in this form");
      // [Triggered]: On leaving via defeat condition: regain LP & KP = 1/4 (rounded up) of max
      entry.conditionals.push("[Triggered] On leaving (defeat condition): regain LP & KP = 1/4 of max");

      // -- Dominating Demon --
      // [Passive]: Intimidation Dice Score +3
      entry.conditionals.push("+3 Intimidation Dice Score");
      // [Passive]: Ignore Shaken and Broken effects
      entry.bonuses.push("Immune to Shaken and Broken");
      // [Passive]: Duel Clash Dice Score +2(T)
      entry.conditionals.push(`+${2 * tier} Duel Clash Dice Score`);
      // [Passive]: Mask Condition = 4 for Masked Power
      entry.bonuses.push("Mask Condition = 4 for Masked Power");
      // [Passive]: Access to Zero Flash Signature Technique, ignoring Feral State
      entry.bonuses.push("Access to Zero Flash Signature Technique (ignores Feral State)");
      // [Triggered]: Defend with no Damage: Movement or Basic Attack OoS
      entry.conditionals.push("[Triggered] Defend with no Damage: Movement or Basic Attack as Out-of-Sequence");
      // [Triggered]: Dodge an attack: triggers Exploit Maneuver vs that Opponent
      entry.conditionals.push("[Triggered] Successful Dodge: triggers Exploit Maneuver vs attacker");
      // [Triggered/Start of Combat Round]: Gain 2 additional Counter Actions
      entry.conditionals.push("[Triggered/Start of Round] Gain 2 additional Counter Actions");
      // [Triggered, 1/Round]: Zero Flash: spend 3(T) KP for Penetration or Broad Beam+Terrain Destruction
      entry.conditionals.push(`[Triggered, 1/Round] Zero Flash: spend ${3 * tier} KP for Penetration(2 ranks) OR Broad Beam + Terrain Destruction(2 stacks)`);

      // -- Burst Limit: I will protect them! --
      // [Triggered/Transform]: Might Clash vs all Opponents in Destructive AoE; win = Shaken & Broken until leaving form
      entry.conditionals.push("[Triggered/Transform] Might Clash vs all Opponents (Destructive AoE): win = Shaken & Broken until leaving form");

      // -- Triggered entries --
      entry.triggered.push({
        id: "fdl_dominating_9",
        name: "Dominating Demon (Zero Flash Enhancement)",
        description: `When using Zero Flash Signature Technique, spend ${3 * tier} KP to apply: Penetration (2 ranks) OR Broad Beam + 2 stacks Terrain Destruction.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    // ========== DESTROYER / DIVINITY ==========

    case "destroyer_form": {
      // -- Successor of Destruction --
      // [Permanent, Passive]: Select 3 God Maneuvers for this form
      entry.bonuses.push("Select 3 God Maneuvers for this form");
      // [Automatic/Transform]: Enter Power of Destruction Enhancement Power (cannot leave while in this form)
      entry.conditionals.push("[Automatic/Transform] Enter Power of Destruction (cannot leave while in this form)");
      // [Passive]: Wound Critical Target = 7
      entry.bonuses.push("Wound Critical Target = 7");
      // [Passive]: Ignore all Soak reduction (except Damage Categories & Exceed effects)
      entry.bonuses.push("Soak cannot be reduced (except Damage Categories & Exceed effects)");
      // [Passive]: Destruction Profile: +1(T) Strike, gains Energy Charge
      entry.conditionals.push(`Destruction Profile: +${tier} Strike & gains Energy Charge`);
      // [Passive]: Access to Hakai Unique Ability
      entry.bonuses.push("Access to Hakai Unique Ability");
      // [Passive]: Double LP reduction from Hakai on Opponents
      entry.bonuses.push("Double Hakai LP reduction on Opponents");
      // [Passive]: Gains Realm of the Gods trait
      entry.bonuses.push("Gains Realm of the Gods trait");

      // -- Armor of Destruction --
      // [Triggered/Start of Combat Round]: Spend 6(bT) DKP, roll Wound (Energy/Magic), DR = 1/4 of roll until end of round
      entry.conditionals.push(`[Triggered/Start of Round] Spend ${6 * baseTier} DKP: roll Wound (Energy/Magic), reduce all Damage by 1/4 of roll until end of round`);
      // [Triggered, 1/Round]: Hit by attack: spend 4(bT) DKP, roll Wound, reduce Damage by 1/2 of roll
      entry.conditionals.push(`[Triggered, 1/Round] Hit: spend ${4 * baseTier} DKP, roll Wound (Energy/Magic), reduce Damage by 1/2 of roll`);

      // Mastery: God of Destruction
      // [Passive]: Ignore penalties for 1 Super Stack
      entry.conditionals.push("// Mastery: Ignore penalties for 1 Super Stack");
      // [Triggered/Transform]: May remove Growth & Bulky; if so, +1(T) Strike & Dodge
      entry.conditionals.push(`// Mastery: [Triggered/Transform] Remove Growth & Bulky: +${tier} Strike & +${tier} Dodge`);
      // [Triggered, 1/Round]: Per Energy Charge on Destruction Signature Technique: Wound +1(T)
      entry.conditionals.push(`// Mastery: [1/Round] Per Energy Charge on Destruction ST: Wound +${tier}`);
      // [Permanent]: Gains Armored & Natural Aspects
      entry.conditionals.push("// Mastery: Gains Armored & Natural Aspects");

      // Legendary: Before Creation Comes Destruction
      // [Passive]: DKP-paid attacks: Wound +1/4 (rounded up) of Soak
      entry.conditionals.push("// Legendary: DKP-paid attacks: Wound +1/4 Soak (rounded up)");
      // [Triggered/Transform, 1/Encounter]: Entering Power of Destruction: regain DKP = 3x Power Level
      entry.conditionals.push("// Legendary: [1/Encounter] Enter Power of Destruction: regain DKP = 3x Power Level");

      // Exceed: Only Destruction
      // [Passive]: Apply Might to Wound of Destruction Profile attacks
      entry.conditionals.push("// Exceed: Apply Might to Wound of Destruction Profile attacks");
      // [Passive]: Reduce DKP spent on Armor of Destruction by 2(bT)
      entry.conditionals.push(`// Exceed: Armor of Destruction DKP cost reduced by ${2 * baseTier}`);
      // (Destroyer form: all catalog effects are triggered-passive without usageLimits — display handled by conditionals)
      break;
    }

    case "divinity_unleashed": {
      // -- Divine Light Magic --
      // [Permanent]: Select Size Category (Small/Medium/Large) for this form
      entry.bonuses.push("Select Size Category (Small/Medium/Large) for this form");
      // [Passive]: Attacking Maneuver KP Cost must use DKP
      entry.conditionals.push("Attacking Maneuver KP Cost must use DKP");
      // [Passive]: In Superior State: attacking KP cost reduced by 2(T) if paying DKP
      entry.conditionals.push(`Superior State: Attacking KP Cost -${2 * tier} (if DKP)`);
      // [Choice]: Light Magic option-dependent
      const duOpt = _findOptionValue(options);
      if (duOpt) {
        const duLo = duOpt.toLowerCase();
        if (duLo.includes("peace")) {
          system.aptitudes.godOfPeaceAutoMindful = true;
          entry.conditionals.push("[Automatic/Transform] Enter Mindful State; gains Mindful (LV2) Aspect");
        } else if (duLo.includes("judgment")) {
          // +3 DC ToP Extra Dice while in Aura — apply conditional on aura
          if (system.activeAura) {
            system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + 3;
          } else {
            system.aptitudes.godOfJudgmentAuraDCBonus = 3;
          }
          entry.conditionals.push("+3 DC ToP Extra Dice while in an Aura");
        } else if (duLo.includes("power") && !duLo.includes("time")) {
          system.aptitudes.lightMagicAlwaysAboveInjured = true;
          // FO highest check
          const foS = system.attributes.fo?.score ?? 0;
          const otherS = ["ag", "te", "ma", "in", "pe", "sc"].map(k => system.attributes[k]?.score ?? 0);
          if (foS >= Math.max(...otherS)) {
            system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + tier;
            system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + tier;
            system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + tier;
            totals.combatRolls += tier;
            entry.bonuses.push(`+${tier} Combat Rolls (God of Power, FO highest)`);
          }
          entry.bonuses.push("Always above Injured for Light Magic effects");
        } else if (duLo.includes("speed")) {
          system.aptitudes.lightMagicAlwaysAboveInjured = true;
          // AG highest check
          const agS = system.attributes.ag?.score ?? 0;
          const otherS = ["fo", "te", "ma", "in", "pe", "sc"].map(k => system.attributes[k]?.score ?? 0);
          if (agS >= Math.max(...otherS)) {
            system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + tier;
            system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + tier;
            system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + tier;
            totals.combatRolls += tier;
            entry.bonuses.push(`+${tier} Combat Rolls (God of Speed, AG highest)`);
          }
          entry.bonuses.push("Always above Injured for Light Magic effects");
        } else if (duLo.includes("war")) {
          system.aptitudes.godOfWarInstantBasicArmed = true;
          entry.conditionals.push("[1/Round] Basic Attack as Instant Maneuver (must be Armed Attack)");
        } else if (duLo.includes("magic")) {
          system.aptitudes.godOfMagicAccess = true;
          system.aptitudes.magicAwakeningSTReduction = 4;
          entry.bonuses.push("Access to Magic Awakening Enhancement Power; Stress Test -4");
        } else if (duLo.includes("time")) {
          system.aptitudes.godOfTimeAccess = true;
          system.aptitudes.timePowerSTReduction = 4;
          entry.bonuses.push("Access to Time Power Enhancement Power; Stress Test -4");
        }
      } else {
        entry.conditionals.push("Option: God of Peace/Judgment/Power/Speed/War/Magic/Time");
      }

      // -- Cosmic Flow --
      // [Triggered/Transform, Start of Round]: No Combat Conditions = enter Superior State until end of round
      entry.conditionals.push("[Triggered/Transform, Start of Round] No Combat Conditions: enter Superior State until end of round");
      // [Triggered, 1/Round]: Request 2(bT) KP from Allies in Destructive Sphere AoE; convert to DKP
      entry.conditionals.push(`[Triggered, 1/Round] End of round: request ${2 * baseTier} KP from Allies (Sphere AoE); convert to DKP`);
      // [Triggered, 1/Round]: All Allies agree: Power Up as OoS
      entry.conditionals.push("[Triggered, 1/Round] All Allies agree: Power Up as Out-of-Sequence");
      // [1/Round, 2/Encounter]: Spend 6(bT) DKP to remove a Combat Condition (not Oblivious/Pinned)
      entry.conditionals.push(`[1/Round, 2/Encounter] Spend ${6 * baseTier} DKP: remove a Combat Condition (not Oblivious/Pinned)`);
      // [1/Round]: Empower as Instant Maneuver; target gains Power until end of next turn
      entry.conditionals.push("[1/Round] Empower as Instant Maneuver; target gains Power until end of next turn");

      // ── Battle Uniform (Combat Clothing, Grade: High) ──
      // Shining God: Increase Combat Rolls of all Allies within Sphere AoE (centered on you) by 1(T)
      entry.conditionals.push(`Battle Uniform - Shining God: Allies in Sphere AoE gain +${tier} Combat Rolls`);
      // Rejuvenating Light: Each Power Surge or Combat Recovery, regain 2(bT) DKP
      entry.conditionals.push(`Battle Uniform - Rejuvenating Light: Power Surge/Combat Recovery: regain ${2 * baseTier} DKP`);

      // Mastery: True Divinity
      // [Permanent]: Gains Scaling (LV2) Aspect
      entry.conditionals.push("// Mastery: Gains Scaling (LV2) Aspect");
      // [Permanent, Passive]: Select a God Maneuver for this form
      entry.conditionals.push("// Mastery: Select a God Maneuver for this form");
      // [Passive]: Ignore DKP-only cost requirement and Superior State second effect
      entry.conditionals.push("// Mastery: Ignore DKP cost requirement & Superior State second effect");
      // [Permanent]: Gains Natural Aspect
      entry.conditionals.push("// Mastery: Gains Natural Aspect");
      // [Passive]: Divine Halo: may use one more Enhancement Power in conjunction
      entry.conditionals.push("// Mastery: Divine Halo: may use one additional Enhancement Power");

      // Legendary: Divine Ascension
      // [Passive, Ruling]: Select a Unique Ability as Domain; Domain grants one of three 1/Round effects
      entry.conditionals.push(`// Legendary: Domain (select Unique Ability): [1/Round] regain ${2 * baseTier} DKP, OR Allies gain Power, OR Empower/Power Up OoS`);

      // Exceed: Limit-Shattering Divinity
      // [Passive]: In Superior State: cannot gain Combat Conditions
      entry.conditionals.push("// Exceed: Superior State: immune to Combat Conditions");
      // [Triggered/Exceed, Start of Round]: Regain 2(bT) DKP
      entry.conditionals.push(`// Exceed: [Start of Round] Regain ${2 * baseTier} DKP`);
      // [Triggered, 6/Encounter]: Regain DKP through an effect: Greater Dice +1 DC until leaving Exceed
      entry.conditionals.push("// Exceed: [6/Encounter] Regain DKP: Greater Dice +1 DC until leaving Exceed");
      // (Divinity unleashed: catalog effects are all triggered-passive without per-round limits)
      break;
    }

    case "godly_powers": {
      // -- Godly Training --
      // [Permanent, Passive]: Select 3 God Maneuvers (usable in any God Ki Legendary Form)
      entry.bonuses.push("Select 3 God Maneuvers (usable in any God Ki Legendary Form)");
      // [Triggered, 1/Round]: Spend up to 4(bT) DKP to increase Strike or Dodge by equal amount
      entry.conditionals.push(`[Triggered, 1/Round] Spend up to ${4 * baseTier} DKP: +equal amount to Strike or Dodge Roll`);
      // [Triggered]: Power Surge or Combat Recovery: regain 3(bT) DKP
      entry.conditionals.push(`[Triggered] Power Surge or Combat Recovery: regain ${3 * baseTier} DKP`);

      // -- Realm of the Gods --
      // [Passive]: Double Wound bonus from Ki Wager using DKP
      entry.conditionals.push("Double Wound bonus from DKP Ki Wager");
      // [Automatic/Transform]: Enter Superior State until leaving this form
      entry.bonuses.push("Auto-enter Superior State on Transform");
      // [Triggered/Transform, Start of Round]: Select a Combat Roll; apply Greater Dice from Superior State twice on it
      entry.conditionals.push("[Triggered/Transform, Start of Round] Select Combat Roll: apply Superior State Greater Dice twice");

      // Mastery: Among Gods
      // [Permanent]: Gains Strainless, loses 1 Draining level
      entry.conditionals.push("// Mastery: Gains Strainless, loses 1 Draining level");
      // [Passive]: Ignore Superior State second effect
      entry.conditionals.push("// Mastery: Ignore Superior State second effect");
      // [Permanent]: Gains Scaling (LV2), loses 1 Draining level
      entry.conditionals.push("// Mastery: Gains Scaling (LV2), loses 1 Draining level");
      // [Triggered, 1/Round]: Regain 1/2 DKP spent on Maneuver KP Cost
      entry.conditionals.push("// Mastery: [1/Round] Regain 1/2 DKP spent on Maneuver KP Cost");

      // Legendary: Divine Energy
      // [Triggered/Power]: Spend 4(bT) DKP to use any 1-Action Maneuver OoS (even outside God Ki State)
      entry.conditionals.push(`// Legendary: [Triggered/Power] Spend ${4 * baseTier} DKP: any 1-Action Maneuver as Out-of-Sequence (works outside God Ki State)`);

      // Exceed: Divine Style
      // [Passive]: Access to all God Maneuvers in Exceed State
      entry.conditionals.push("// Exceed: Access to all God Maneuvers");
      // [Triggered]: Spending DKP: regain KP = 1/2 (rounded up) DKP spent
      entry.conditionals.push("// Exceed: [Triggered] Spend DKP: regain KP = 1/2 DKP spent (rounded up)");
      // [Triggered/Power, 1/Round]: Convert up to 10(bT) KP into DKP
      entry.conditionals.push(`// Exceed: [Triggered/Power, 1/Round] Convert up to ${10 * baseTier} KP into DKP`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "gp_godly_training_2",
        name: "Godly Training (DKP Strike/Dodge)",
        description: `Spend up to ${4 * baseTier} DKP to increase one Strike or Dodge Roll by an equal amount (must be part of or in response to an Attacking Maneuver).`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Mastery: Among Gods
      entry.triggered.push({
        id: "gp_mastery_4",
        name: "// Mastery: Among Gods (DKP Refund)",
        description: "Regain 1/2 of the DKP spent to pay the KP Cost of a Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Divine Style
      entry.triggered.push({
        id: "gp_exceed_3",
        name: "// Exceed: Divine Style (KP→DKP)",
        description: `Convert up to ${10 * baseTier} KP into DKP.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    // ========== EMPOWERED LINE ==========

    case "empowered": {
      // Mystical Adventure: +S DC ToP Extra Dice and Greater Dice
      entry.conditionals.push(`+${G} DC ToP Extra Dice & Greater Dice`);
      // If Empowered has uncovered Attr, gain (3+S)(T) bonus
      entry.conditionals.push(`Missing Attr: +${(3 + G) * tier} AMB`);

      // -- Triggered entries --
      // Legendary: Blaze Up!
      entry.triggered.push({
        id: "emp_blaze_up_1",
        name: "// Legendary: Blaze Up!",
        description: `Gain Greater Dice until end of next turn. If below Injured before Transform, increase Legend Realized by 1d8(${tier}).`,
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      // Exceed: Battle of Omega
      entry.triggered.push({
        id: "emp_exceed_3",
        name: "// Exceed: Battle of Omega (ST Charges)",
        description: "When using Signature Technique while in an Enhancement Power, add 3 Energy Charges at Attack Declaration. If you do, leave that Enhancement Power immediately after.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    case "z_empowered": {
      // In Legendary Form: +2(T) Wound
      entry.conditionals.push(`In Legendary Form: +${2 * tier} Wound`);
      // In Alternate Form: -1(T) KP cost
      entry.conditionals.push(`In Alternate Form: -${tier} KP cost`);

      // -- Triggered entries --
      // Exceed: Fight It Out
      entry.triggered.push({
        id: "zemp_exceed_4",
        name: "// Exceed: Fight It Out",
        description: `Increase your Combat Rolls by ${tier} until the end of your turn.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "super_empowered": {
      // In Alternate Form per threshold below: +1(T) Soak, +1 Steadfast
      entry.conditionals.push(`Alternate + per threshold: +${tier} Soak, +1 Steadfast`);
      // In Legendary Form per threshold: +1(T) Soak & Wound
      entry.conditionals.push(`Legendary + per threshold: +${tier} Soak & Wound`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "semp_dan_dan_1",
        name: "Dan Dan Kokoro (+1 DC)",
        description: "Increase the Damage Category of your Attacking Maneuvers by 1 until the end of your turn.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Mastery: Super Survivor
      entry.triggered.push({
        id: "semp_mastery_1",
        name: "// Mastery: Super Survivor (AMB Boost)",
        description: `Increase this Transformation's AMB(AG/FO/TE/MA) by ${tier} until the end of your next turn.`,
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    // ========== ENHANCED TRANSFORMATION ==========

    case "enhanced_transformation": {
      // Let it Burn: LP/KP from Surges +3(bT)
      entry.conditionals.push(`Surges: +${3 * baseTier} LP & KP`);
      // Option: 6 sub-options of Let it Burn
      const etOpt = _findOptionValue(options);
      if (etOpt) {
        const etLo = etOpt.toLowerCase();
        if (etLo.includes("control of your emotions") || etLo.startsWith("control")) {
          system.aptitudes.controlOfEmotionsAutoState = true;
          entry.bonuses.push("Permanent: Select Raging or Mindful; +2 Aspect levels; auto-enter on Transform");
        } else if (etLo.includes("dyed")) {
          system.aptitudes.dyedInEmotionsSurgingCost = 5 * baseTier;
          entry.conditionals.push(`[Triggered/Power, 1/Round] Spend ${5 * baseTier} KP: enter Surging State (not while Fatigued)`);
        } else if (etLo.includes("superior warrior") || (etLo.includes("superior") && !etLo.includes("pushing"))) {
          system.aptitudes.superiorWarriorCost = 3 * baseTier;
          entry.conditionals.push(`[Triggered/Power, 1/Round] Spend ${3 * baseTier} KP: enter Superior State`);
        } else if (etLo.includes("pushing") || (etLo.includes("power") && !etLo.includes("deep"))) {
          addSoak(system, tier);
          totals.soak += tier;
          system.aptitudes.superStackExtraDiceCategoryBonus = (system.aptitudes.superStackExtraDiceCategoryBonus || 0) + 2;
          system.aptitudes.pushingForPowerBulky = true;
          entry.bonuses.push(`+${tier} Soak + Bulky + Super Stack DC+2 (Pushing for Power)`);
        } else if (etLo.includes("deep") || etLo.includes("control")) {
          system.aptitudes.allManeuverKiReduction = (system.aptitudes.allManeuverKiReduction || 0) + 2 * tier;
          system.aptitudes.deepControlPerfectKi = true;
          entry.conditionals.push(`-${2 * tier} KP cost all Maneuvers (+Perfect Ki Control Aspect)`);
        } else if (etLo.includes("survivor") || etLo.includes("resilience")) {
          if (system.attributes.te) {
            system.attributes.te.modifier += tier;
            system.attributes.te.totalScore = system.attributes.te.score + system.attributes.te.modifier;
          }
          system.aptitudes.survivorsResilienceArmored = true;
          entry.bonuses.push(`+${tier} AMB(TE) + Armored Aspect (Survivor's Resilience)`);
        }
      } else {
        entry.conditionals.push("Option: Dyed(Surging)/Superior Warrior/Control of Emotions/Pushing(Soak)/Deep Control(KP)/Survivor(TE)");
      }

      // -- Triggered entries --
      entry.triggered.push({
        id: "et_dyed_emotions",
        name: "Dyed in your Emotions (Surging)",
        description: `Spend ${5 * baseTier} KP to enter the Surging State until start of next turn. Cannot trigger while Fatigued.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "et_superior_warrior",
        name: "Superior Warrior (Superior State)",
        description: `Spend ${3 * baseTier} KP to enter the Superior State until start of next turn. Cannot trigger if used last Combat Round.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Mastery: Yeah! Break! Care! Break!
      entry.triggered.push({
        id: "et_mastery_3",
        name: "// Mastery: Yeah! Break! Care! Break! (Healing)",
        description: "Use a Healing Surge. Then, regain KP equal to half the LP you regained.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    // ========== GOD OF MARTIAL ARTS ==========

    case "god_of_martial_arts": {
      // Max KP +1/4 of Skill TP — complex, display only
      entry.conditionals.push("Max KP +1/4 of Skill Improvement TP");
      // Below Injured: +2(bT) Might and Defense
      entry.conditionals.push(`Below Injured: +${2 * baseTier} Might & Defense`);
      // Greater Dice to all STs
      entry.conditionals.push("Greater Dice apply to all Signature Techniques");

      // -- Triggered entries --
      entry.triggered.push({
        id: "gma_wizened_3",
        name: "Wizened Warrior (Basic on KP Regain)",
        description: "When you regain Ki Points, you may use the Basic Attack Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "gma_wizened_5",
        name: "Wizened Warrior (AP on ST)",
        description: `If you use the Signature Technique, spend any number of Advantage Points to: +${tier}/AP to Wound, or 1 Energy Charge per 4 AP (counts for Mandatory Charge).`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "gma_wizened_6",
        name: "Wizened Warrior (12 AP Superior)",
        description: "If you possess 12 Advantage Points, spend 4 to enter the Superior State until end of next turn as an Instant Maneuver.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "gma_master_3",
        name: "Master of Techniques (Basic as ST)",
        description: "When using the Basic Attack Maneuver, you may treat it as a Signature Technique for your effects.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "gma_master_4",
        name: "Master of Techniques (Power Shot ST)",
        description: "When using Signature Technique below Injured, apply 3 ranks of Power Shot (may exceed maximum).",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    // ========== NAMEKIAN LEGENDARY ==========

    case "superior_namekian": {
      // == Namekian Power (replaces Improved Power) ==
      // [Permanent]: Does not possess Natural Power Trait
      entry.bonuses.push("Does not possess Natural Power trait");
      // [Passive]: Per Power: +1(bT) Combat Rolls vs Opponents with 1+ Studied
      entry.conditionals.push(`Per Power vs 1+ Studied Opponent: +${baseTier} Combat Rolls`);
      // [Triggered, 1/Round]: Signature Technique vs 1+ Studied: double Strike bonus, triple Wound bonus from Namekian Power 2nd effect
      entry.conditionals.push("[1/Round] ST vs Studied: double Strike bonus, triple Wound bonus from Namekian Power");
      // [Triggered, 1/Round]: Succeed Steadfast Check: Power Up as Out-of-Sequence
      entry.conditionals.push("[1/Round] Succeed Steadfast Check: Power Up as Out-of-Sequence");

      // == Emerald Power (replaces Superior Power) ==
      // [Passive]: 1+ Power: apply ToP Extra Dice an additional time
      entry.conditionals.push("1+ Power: apply ToP Extra Dice additional time");
      // [Triggered/Start of Turn]: Make Steadfast Check; succeed: regain KP = 1/2 LP from Namekian Biology 2nd effect
      entry.conditionals.push("[Triggered/Start of Turn] Steadfast Check; succeed: regain KP = 1/2 LP from Namekian Biology");
      // [Triggered/Power, 1/Round]: Target an Opponent; next Maneuver: they have additional Studied stacks = Power stacks
      entry.conditionals.push("[Triggered/Power, 1/Round] Target Opponent: they have additional Studied stacks = Power stacks for next Maneuver");

      // Mastery: True Super Namekian
      // [Permanent]: Loses Draining, gains 1 level High Speed
      entry.conditionals.push("// Mastery: Loses Draining Aspect, gains +1 High Speed level");
      // [Passive]: Per Super Namekian stack: +1(bT) LP from Namekian Biology 2nd effect
      entry.conditionals.push(`// Mastery: Per Super Namekian: +${baseTier} LP from Namekian Biology`);
      // [Triggered, 1/Round]: Remove 2+ Studied from Opponent: next attack vs them +1 Damage Category
      entry.conditionals.push("// Mastery: [1/Round] Remove 2+ Studied: next attack vs them +1 Damage Category");
      // [Permanent]: Gains Natural and Perfect Ki Control Aspects
      entry.conditionals.push("// Mastery: Gains Natural & Perfect Ki Control Aspects");

      // -- Triggered entries --
      entry.triggered.push({
        id: "sn_namekian_power_3",
        name: "Namekian Power (ST vs Studied)",
        description: "If you target an Opponent with a Signature Technique while they have 1+ Studied, double the Strike bonus and triple the Wound bonus from Namekian Power 2nd effect.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sn_namekian_power_4",
        name: "Namekian Power (Power Up on Steadfast)",
        description: "If you succeed at a Steadfast Check, you may use Power Up as Out-of-Sequence.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sn_emerald_power_3",
        name: "Emerald Power (Studied on Power)",
        description: "Target an Opponent. For your next Maneuver this Turn, they possess additional Studied Stacks equal to your Power stacks.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Mastery: True Super Namekian
      entry.triggered.push({
        id: "sn_mastery_3",
        name: "// Mastery: True Super Namekian (+1 DC)",
        description: "If you remove 2+ stacks of Studied from an Opponent, your next Attacking Maneuver to hit them has +1 Damage Category.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    // ========== MONSTER LEGENDARY ==========

    case "legendary_monster": {
      // Size and defense modifications
      const lmOpt = _findOptionValue(options);
      if (lmOpt) {
        const lmLo = lmOpt.toLowerCase();
        if (lmLo.includes("gigantic")) {
          // Gigantic Monster: Defense -1(T) + base Size Gigantic + Punching Down DC +2
          system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) - tier;
          totals.defense -= tier;
          system.aptitudes.gigantcMonsterBaseSize = "gigantic";
          system.aptitudes.punchingDownExtraDiceCategoryBonus = (system.aptitudes.punchingDownExtraDiceCategoryBonus || 0) + 2;
          entry.bonuses.push(`-${tier} Defense + Base Size Gigantic (Gigantic Monster)`);
          entry.bonuses.push("+2 DC Punching Down Extra Dice");
        } else if (lmLo.includes("enormous") || lmLo.includes("tremendous")) {
          // Tremendous: ignore Defense penalties from Size + base Size Enormous
          system.aptitudes.tremendousMonsterBaseSize = "enormous";
          system.aptitudes.tremendousMonsterIgnoreSizeDefensePenalty = true;
          entry.bonuses.push("Ignore Defense penalties from Size + Base Size Enormous (Tremendous Monster)");
        } else if (lmLo.includes("resilient")) {
          // Resilient: +2 LP per Power Level, +1(bT) Soak & Defense
          const plLevel = system.level || 1;
          const lpAdd = 2 * plLevel;
          system.lifePoints.max = (system.lifePoints.max || 0) + lpAdd;
          totals.lpMax += lpAdd;
          entry.bonuses.push(`+${lpAdd} Max LP (2/PL)`);
          addSoak(system, baseTier);
          system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + baseTier;
          totals.soak += baseTier;
          totals.defense += baseTier;
          entry.bonuses.push(`+${baseTier} Soak & Defense (Resilient)`);
        }
      } else {
        entry.conditionals.push("Size option: Gigantic/Tremendous/Resilient bonuses");
      }

      // -- Triggered entries --
      entry.triggered.push({
        id: "lm_embodiment_4",
        name: "Embodiment of Disaster (Feral/Raging OoS)",
        description: "Use any Standard Maneuver with an Action Cost of 1 Action as an Out-of-Sequence Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    // ========== POWER BOOST LEGENDARY ==========

    case "full_power_boost": {
      // Max Power stacks +S (S from Power Boost line position)
      entry.conditionals.push("Max Power stacks increased");
      // Per Power: +1(T) Soak, +1 DC ToP/Greater Dice, +1 Draining
      entry.conditionals.push(`Per Power: +${tier} Soak, +1 DC, +1 Draining`);
      // Legendary: 2+ Power, +1(T) Might
      entry.conditionals.push(`2+ Power: +${tier} Might`);
      // Legendary: all Power Boost line +1(T) FO/MA
      entry.conditionals.push(`Power Boost line: +${tier} AMB(FO/MA)`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "fpb_invincible_1",
        name: "Invincible Power (Breakthrough)",
        description: "If you have no stacks of Holding Back, increase your Tier of Power by 1 (Breakthrough) until you leave a Transformation of this line.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "fpb_invincible_2",
        name: "Invincible Power (Resist CC)",
        description: "If an Opponent would inflict a Combat Condition on you, make a Might Clash. If you win, you do not gain that Combat Condition.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "fpb_invincible_3",
        name: "Invincible Power (Resist Clash Loss)",
        description: "If an Opponent would win a Clash using Saving Throws, make a Might Clash. If you win, treat as if you won the original Clash.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Centered Power
      entry.triggered.push({
        id: "fpb_exceed_4",
        name: "// Exceed: Centered Power (Power Surge)",
        description: "Use a Power Surge.",
        usageLimit: "2/Encounter",
        maxUses: 2
      });
      break;
    }

    case "super_full_power_boost": {
      // Max Power: +1(T) Might
      entry.conditionals.push(`At max Power: +${tier} Might`);
      // Mastery: per Power, +1(T) Wound
      entry.conditionals.push(`Per Power: +${tier} Wound`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "sfpb_surpass_2",
        name: "Surpass the Strong (Maximize Power)",
        description: `Spend 2x(bT) KP to maximize your Power stacks until end of next turn, where x = number of stacks needed.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sfpb_surpass_3",
        name: "Surpass the Strong (Breakthrough)",
        description: "Increase your Tier of Power by 1 (Breakthrough) until end of next turn.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sfpb_surpass_4",
        name: "Surpass the Strong (Retain Power)",
        description: "If you would lose Power stacks, spend up to x(bT) KP — for every 2(bT) KP, retain 1 stack. x = twice the stacks you would lose.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Legendary: Exploding Power
      entry.triggered.push({
        id: "sfpb_legendary_2",
        name: "// Legendary: Exploding Power",
        description: "If you would use or be targeted by an Attacking Maneuver, increase your Tier of Power by 1 (Breakthrough) for the duration.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Shatter the Limit
      entry.triggered.push({
        id: "sfpb_exceed_3",
        name: "// Exceed: Shatter the Limit (3 Charges)",
        description: "Your next Attacking Maneuver gains 3 Energy Charges.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    // ========== MAJIN LEGENDARY ==========

    case "mightiest_majin": {
      // Big Eater: +min(absorbed,3)×T or +4T if only Source of Might Combat Rolls
      entry.conditionals.push(`+x(${tier}) Combat Rolls (x = min(absorbed, 3) or 4)`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "mm_big_eater_2",
        name: "Big Eater (Auto-Win Fusion Clash)",
        description: "If you lose the Clash to maintain a One-Sided Fusion against an Absorbed Character, you can choose to automatically win instead.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      // Mastery: Combined Power
      entry.triggered.push({
        id: "mm_mastery_3",
        name: "// Mastery: Combined Power (State on Power)",
        description: "If your Source of Might has equal or higher base Tier of Power, enter Superior or Surging State (your choice) until end of next turn.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    case "pure_form": {
      // Size: Small
      entry.bonuses.push("Size Category: Small");
      // Unpredictable: Chaos Die random buffs
      entry.conditionals.push("Chaos Die: random combat buffs each round");
      // Legendary: no absorbed, +1(T) Defense & Strike
      entry.conditionals.push(`No absorbed: +${tier} Defense & Strike`);
      break;
    }

    // ========== ANDROID LEGENDARY ==========

    case "ultimate_android": {
      // Per Power: +1(T) AMB(AG/FO/TE/MA)
      entry.conditionals.push(`Per Power: +${tier} AMB(AG/FO/TE/MA)`);
      // Cannot lose Power while KP > Max Capacity
      entry.conditionals.push("Keep Power while KP > Max Capacity");

      // -- Triggered entries --
      entry.triggered.push({
        id: "ua_strongest_3",
        name: "Strongest Android (Reserved Energy)",
        description: "As an Instant Maneuver, spend 2 Reserved Energy to: enter Superior State (or extend it); use Power Surge OoS; or use Energy Charge OoS (tripled).",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Legendary: Pinnacle of Technology
      entry.triggered.push({
        id: "ua_legendary_1",
        name: "// Legendary: Pinnacle of Technology",
        description: "If you use Power Surge or gain KP exceeding 1/5 Max KP through an effect, you may use Energy Charge as Out-of-Sequence.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Limitless Android
      entry.triggered.push({
        id: "ua_exceed_2",
        name: "// Exceed: Limitless Android (Lock-On Basic)",
        description: "When you apply a Lock-On stack to an Opponent, use Basic Attack against them as OoS. That Attacking Maneuver gains an Energy Charge.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "liquid_metal": {
      // While Integrated Apparel: DR +2(T)
      entry.conditionals.push(`Integrated Apparel: +${2 * tier} DR`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "lm_body_metal_5",
        name: "Body of Metal (Metal Teleport)",
        description: "While on a Metal Square, as an Instant Maneuver, move to any connected Metal Square.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "lm_body_metal_6",
        name: "Body of Metal (Destroy Metal)",
        description: "As an Instant Maneuver, destroy 9 Metal Squares or 1 Metal Feature within Melee Range. Gain Break Point effects from Mutant Core.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "lm_body_metal_7",
        name: "Body of Metal (Liquid Exit Basic)",
        description: "If you leave Liquid State on a Metal Square or with an Opponent on adjacent Metal Square, use Basic Attack as OoS.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "lm_master_metal_2",
        name: "Master of Metal (Create Metal)",
        description: `As an Instant Maneuver, spend ${3 * baseTier} KP to turn all adjacent Squares or a Feature within Melee Range into Metal.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "lm_master_metal_3",
        name: "Master of Metal (Metal Feature)",
        description: "As an Instant Maneuver, remove Metal from 9 connected Squares to create a Metal Feature. Clash (Cognitive vs Impulsive) against occupants.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "lm_master_metal_4",
        name: "Master of Metal (Throw Feature)",
        description: "As an Instant Maneuver, target a Metal Feature and use Throw Maneuver effects as if holding it.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "lm_master_metal_6",
        name: "Master of Metal (Break Point Metal)",
        description: "If you gain a Break Point, all Squares and Features within a Large Sphere AoE (centered on you) become Metal.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "lm_master_metal_7",
        name: "Master of Metal (Metal Shield)",
        description: "Metal Shield Maneuver — manipulate metal to intercept attacks for you and companions.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "lm_world_metal_5",
        name: "World of Metal (Remove All Metal)",
        description: `Remove Metal from everything on Battlefield. Per 9 Squares: Wound +${tier} (max ${10 * tier}). Per Feature: regain ${tier} KP (max ${10 * tier}). If Avatar of Living Base: +1 Power beyond cap.`,
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      // Legendary: Metal Takeover
      entry.triggered.push({
        id: "lm_legendary_2",
        name: "// Legendary: Metal Takeover (Breakthrough)",
        description: "If you and all adjacent Squares are Metal, increase Tier of Power by 1 (Breakthrough) until end of next turn.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    // ========== BIO-ANDROID LEGENDARY ==========

    case "super_perfect_form": {
      // Per Power: +1 DC ToP Extra Dice for Combat Rolls
      const psSPF = system.tracking?.powerStacks || 0;
      if (psSPF > 0) {
        system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + psSPF;
      }
      entry.conditionals.push("Per Power: +1 DC ToP Extra Dice");
      // Genetic option bonuses — actual catalog: Genetic Potential / God Ki / Super Powerful Genes
      // + legacy options for backward compat
      const spfOpt = _findOptionValue(options);
      if (spfOpt) {
        const spfLo = spfOpt.toLowerCase();
        if (spfLo.includes("genetic potential")) {
          system.aptitudes.cannotLosePowerStacks = true;
          system.aptitudes.geneticPotentialPowerInstant = true;
          entry.bonuses.push("Cannot lose Power stacks (Genetic Potential)");
        } else if (spfLo.includes("god ki") || spfLo.includes("godki")) {
          system.aptitudes.superPerfectGodKi = true;
          system.aptitudes.superPerfectGodManeuverAccess = true;
          entry.bonuses.push("Gain God Ki Aspect + God Maneuver selection");
        } else if (spfLo.includes("super powerful") || spfLo.includes("powerful genes")) {
          if (psSPF > 0) {
            system.status.might = (system.status.might || 0) + psSPF * tier;
            system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + psSPF * tier;
            system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + psSPF;
          }
          entry.bonuses.push(`Per Power: +${tier} Might & Wound + 1 DC ToP Extra Dice (Super Powerful Genes)`);
        } else if (spfLo.includes("orange") || spfLo.includes("namekian")) {
          addSoak(system, tier);
          totals.soak += tier;
          entry.bonuses.push(`+${tier} Soak (Orange Hide base)`);
          entry.conditionals.push(`Per Power: +${tier} additional Soak`);
        } else if (spfLo.includes("brilliant") || spfLo.includes("arcosian")) {
          totals.dr += tier;
          system.status.dr = (system.status.dr || 0) + tier;
          entry.bonuses.push(`+${tier} DR (Brilliant Shell)`);
        } else if (spfLo.includes("gleaming") || spfLo.includes("saiyan")) {
          const kpSPF = Math.floor(system.kiPool.max / 4);
          const capSPF = Math.floor(system.capacity.max / 4);
          system.kiPool.max += kpSPF;
          system.capacity.max += capSPF;
          totals.kpMax += kpSPF;
          totals.capacityMax += capSPF;
          entry.bonuses.push(`+${kpSPF} Max KP (+1/4)`);
          entry.bonuses.push(`+${capSPF} Max Capacity (+1/4)`);
        } else if (spfLo.includes("earthling")) {
          system.aptitudes.allAttackKiReduction = (system.aptitudes.allAttackKiReduction || 0) + 2 * tier;
          entry.conditionals.push(`-${2 * tier} KP cost Attacking Maneuvers`);
        }
      } else {
        entry.conditionals.push("Genetic option: Genetic Potential / God Ki / Super Powerful Genes / Orange Hide / Brilliant Shell / Gleaming Legend / Earthling KP");
      }
      break;
    }

    // ========== NEO-TUFFLE / SHADOW DRAGON ==========

    case "super_grudge_amplification": {
      // Considered Super Tuffle
      entry.bonuses.push("Treated as Super Tuffle");
      // Per Disdain: +1 DC ToP Extra Dice
      entry.conditionals.push("Per Disdain: +1 DC ToP Extra Dice");

      // -- Triggered entries --
      entry.triggered.push({
        id: "sga_all_consuming_4",
        name: "All-Consuming Grievance (Extra UST)",
        description: "If below Injured, use an Ultimate Signature Technique that you already used an additional time this Encounter.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sga_all_consuming_5",
        name: "All-Consuming Grievance (Raging/Surging Wound)",
        description: `If you hit an Opponent in Raging or Surging State, increase Wound bonus by ${tier} for every 2 Revenge Points spent.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sga_all_consuming_6",
        name: "All-Consuming Grievance (Enter State)",
        description: "Enter the Raging or Surging State until end of your turn.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sga_endless_hate_3",
        name: "Endless Hate (Extra ToP Wound)",
        description: "If you hit an Opponent with a Hatred Attack, apply your ToP Extra Dice an additional time to the Wound Roll.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sga_endless_hate_4",
        name: "Endless Hate (Resource Drain)",
        description: "If you hit with a Hatred Attack, spend 2 Revenge Points to reduce all of their Resources by 1.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Mastery: An Unending Grudge
      entry.triggered.push({
        id: "sga_mastery_3",
        name: "// Mastery: An Unending Grudge (Counter ST)",
        description: "If you or an Ally in Sphere AoE is hit by an Opponent's ST while you have 2+ Revenge Points, use Basic Attack or ST as OoS against that Opponent (must spend 2+ Revenge Points).",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      // Legendary: Terrifying Vengeance
      entry.triggered.push({
        id: "sga_legendary_1",
        name: "// Legendary: Terrifying Vengeance",
        description: "If you hit with an Attacking Maneuver spending 2+ Revenge Points, make a Clash (Morale). Win = Opponent gains Broken until end of your turn.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Purge the Inferior
      entry.triggered.push({
        id: "sga_exceed_1",
        name: "// Exceed: Purge the Inferior (UST Treatment)",
        description: "If your Attacking Maneuver is a Hatred Attack, you may treat it as an Ultimate Signature Technique for all your effects.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sga_exceed_2",
        name: "// Exceed: Purge the Inferior (Revenge Charges)",
        description: "If you use an Ultimate Signature Technique, gain an Energy Charge for every Revenge Point spent.",
        usageLimit: "2/Encounter",
        maxUses: 2
      });
      break;
    }

    case "super_star_dragon": {
      // Per Negative Energy: +1 DC ToP Extra Dice
      const negEnergy = system.tracking?.negativeEnergy || 0;
      if (negEnergy > 0) {
        system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + negEnergy;
      }
      entry.conditionals.push("Per Negative Energy: +1 DC ToP Extra Dice");
      // Supernatural Calamity: option-dependent (7 options)
      const ssdOpt = _findOptionValue(options);
      if (ssdOpt) {
        const ssdLo = ssdOpt.toLowerCase();
        if (ssdLo.includes("sinister")) {
          system.aptitudes.sinisterDragonLPWoundCostMax = 4 * baseTier;
          entry.conditionals.push(`[Triggered/Power, 1/Round] Reduce LP by up to ${4 * baseTier} for +equal Wound until end of turn`);
        } else if (ssdLo.includes("hazy")) {
          system.aptitudes.hazyDragonWeatherDR = 2 * tier;
          entry.conditionals.push(`Battle Weather: +${2 * tier} DR`);
        } else if (ssdLo.includes("elemental")) {
          system.aptitudes.elementalDragonProfileOverride = true;
          entry.bonuses.push("Non-Elemental Profiles count as selected Elemental Profile (Elemental Dragon)");
        } else if (ssdLo.includes("noble")) {
          system.aptitudes.nobleDragonCompelledBonus = tier;
          entry.conditionals.push(`Compelled: +${tier} Combat Rolls`);
        } else if (ssdLo.includes("regenerative")) {
          system.aptitudes.regenerativeDragonSlimeMaxLPBonus = 2 * (system.level || 1);
          system.aptitudes.regenerativeDragonSlimeCanBasicAttack = true;
          entry.bonuses.push("Dragon Slimes: Basic Attack + Max LP +2×PL");
        } else if (ssdLo.includes("ominous")) {
          system.aptitudes.ominousDragonTerrifyInstant = true;
          system.aptitudes.ominousDragonTerrifyClashBonus = 2;
          entry.conditionals.push("[1/Round] Terrify as Instant Maneuver + Clash Dice +2");
        } else if (ssdLo.includes("natural")) {
          system.aptitudes.naturalDragonDominantBonus = tier;
          entry.conditionals.push(`Dominant Absorption: +${tier} Combat Rolls & Soak`);
        }
      } else {
        entry.conditionals.push("Supernatural Calamity option-dependent (Sinister/Hazy/Elemental/Noble/Regenerative/Ominous/Natural)");
      }

      // -- Triggered entries --
      entry.triggered.push({
        id: "ssd_superior_neg_2",
        name: "Superior Negative Energy (Power Up on Gain)",
        description: "When you gain Negative Energy through Negative Energy trait's first effect, you may use Power Up as OoS.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssd_superior_neg_3",
        name: "Superior Negative Energy (Trigger Neg Energy)",
        description: "Trigger the first effect of the Negative Energy trait.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssd_superior_neg_4",
        name: "Superior Negative Energy (LP for Superior)",
        description: "Reduce LP by 1/5 Max LP to enter Superior State until end of next turn.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssd_karma_2",
        name: "Eternal Karma (Botch→Critical)",
        description: `If you or an Ally in Sphere AoE scores a Botch, spend 2 Negative Karma to score a Critical Result instead.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssd_karma_3",
        name: "Eternal Karma (Double Crit Wound)",
        description: "If you hit with an attack where you scored a Critical Wound Result, spend 1 Negative Karma to apply the Crit Extra Dice an additional time.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssd_karma_4",
        name: "Eternal Karma (Neg Energy→Charges)",
        description: "When making an Attacking Maneuver, spend 1 Negative Karma to spend all Negative Energy. Gain 1 Energy Charge per Negative Energy spent.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      // Legendary: Negative Spiral
      entry.triggered.push({
        id: "ssd_legendary_1",
        name: "// Legendary: Negative Spiral",
        description: `When you or an Ally in Sphere AoE makes a Combat Roll, you may force a Botch Result regardless of Natural Result. Then, regain 1d8(${tier}) KP.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      // Exceed: Dragon Ascension
      entry.triggered.push({
        id: "ssd_exceed_2",
        name: "// Exceed: Dragon Ascension (Karma Power/Charge)",
        description: "When you gain a Negative Karma, you may use Power Up or Energy Charge as Out-of-Sequence.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "ssd_exceed_3",
        name: "// Exceed: Dragon Ascension (LP for Ki Wager)",
        description: "When using a Signature Technique, you may spend LP instead of KP for the Ki Wager. Reduce Capacity Rate by 1/2 LP spent.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    // ========== SUPREME FORM ==========

    case "supreme_form": {
      // Per Power: +1(T) AMB(AG/FO/TE/MA), +1 Draining per stack after first
      const psSF = system.tracking?.powerStacks || 0;
      if (psSF > 0) {
        for (const attr of ["ag", "fo", "te", "ma"]) {
          if (system.attributes[attr]) {
            system.attributes[attr].modifier += psSF * tier;
            system.attributes[attr].totalScore = system.attributes[attr].score + system.attributes[attr].modifier;
          }
        }
      }
      entry.conditionals.push(`Per Power: +${tier} AMB(AG/FO/TE/MA), +1 Draining after 1st`);
      // +1 Power beyond max
      system.aptitudes.maxPowerStacksBonus = (system.aptitudes.maxPowerStacksBonus || 0) + 1;
      entry.bonuses.push("+1 Power beyond max");
      // Max LP +1/2
      const lpAdd = Math.floor((system.lifePoints.max || 0) / 2);
      system.lifePoints.max = (system.lifePoints.max || 0) + lpAdd;
      totals.lpMax += lpAdd;
      entry.bonuses.push(`+${lpAdd} Max LP (+1/2)`);
      // Non-ToP7 opponents: -1 Damage Category
      system.aptitudes.supremeFormVsLowerToPDmgCatReduction = 1;
      entry.conditionals.push("-1 Damage Category from non-ToP7 opponents");
      // Per Power: +1 DC ToP Extra Dice & Greater Dice
      if (psSF > 0) {
        system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + psSF;
        system.aptitudes.greaterDiceCategoryBonus = (system.aptitudes.greaterDiceCategoryBonus || 0) + psSF;
      }
      entry.conditionals.push("Per Power: +1 DC ToP & Greater Dice");
      // Supreme Potential option (Beast) — Limits of Potential / Unbound Fury
      const sfOpt = _findOptionValue(options);
      if (sfOpt) {
        const sfLo = sfOpt.toLowerCase();
        if (sfLo.includes("limits") || sfLo.includes("potential")) {
          system.aptitudes.supremeFormStrainless = true;
          entry.bonuses.push("Limits of Potential: Supreme Form gains Strainless Aspect");
        } else if (sfLo.includes("unbound") || sfLo.includes("fury")) {
          system.aptitudes.supremeFormAutoRaging = true;
          system.aptitudes.supremeFormRagingLV5 = true;
          entry.bonuses.push("Unbound Fury: Auto-Raging + Raging (LV5) Aspect");
        }
      } else {
        entry.conditionals.push("Supreme Potential Option: Limits of Potential (Strainless) / Unbound Fury (Auto-Raging LV5)");
      }

      // -- Triggered entries --
      entry.triggered.push({
        id: "sf_supreme_power_4",
        name: "Supreme Power (Surging Strength Charges)",
        description: "If you enter Supreme Form via Surging Strength while attacking, gain Energy Charges = Power stacks.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sf_supreme_presence_5",
        name: "Supreme Presence (Surging State)",
        description: "Enter the Surging State until end of turn. Ignore 2nd and 3rd effects of Surging State if entered this way.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sf_supreme_presence_6",
        name: "Supreme Presence (LP Recovery)",
        description: "Regain LP equal to 1/2 of your Max LP prior to entering this Transformation.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      entry.triggered.push({
        id: "sf_supreme_power_boost_5",
        name: "Supreme Power Boost (Breakthrough per Attack)",
        description: "While 2+ Power, when making or targeted by an Attacking Maneuver, increase Tier of Power by 1 for that Attacking Maneuver.",
        usageLimit: "3/Round",
        maxUses: 3
      });
      break;
    }

    // ========== HYPER MEGA FORM ==========

    case "hyper_mega_form": {
      // Per Secondary Soldier after first: +1(T) AMB(AG/FO/TE/MA)
      entry.conditionals.push(`Per Soldier after 1st: +${tier} AMB(AG/FO/TE/MA)`);
      // Support Booster: Speed +2(T)
      addSpeed(system, 2 * tier);
      totals.speed += 2 * tier;
      entry.bonuses.push(`+${2 * tier} Speed (Support Booster)`);
      // Wound +1/10th squares moved (max 5T)
      entry.conditionals.push(`+1/10th squares moved to Wound (max ${5 * tier})`);

      // -- Triggered entries --
      entry.triggered.push({
        id: "hmf_uninhibited_2",
        name: "Uninhibited Processor (Soldier Wound)",
        description: "If you hit an Opponent, increase Wound Roll by the Might of one of your Secondary Soldier Characters.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "hmf_uninhibited_3",
        name: "Uninhibited Processor (Soldier Soak)",
        description: "If you are hit by an Opponent's attack, increase your Soak by the Soak Value of one of your Secondary Soldier Characters for that Attacking Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    // ========== ULTIMATE / GODSLAYER ==========

    case "ultimate_form": {
      const universalPowerUF = system.universeSeed?.universalPower || 0;
      const upScaleUF = Math.min(Math.ceil(universalPowerUF / 20), 4);
      if (upScaleUF > 0) {
        const combatBonusUF = upScaleUF * tier;
        totals.combatRolls += combatBonusUF;
        entry.bonuses.push(`+${combatBonusUF} Combat Rolls (Universal Power)`);
        addSoak(system, combatBonusUF);
        totals.soak += combatBonusUF;
        entry.bonuses.push(`+${combatBonusUF} Soak (Universal Power)`);
      }
      if (universalPowerUF > 0) {
        const kpAddUF = universalPowerUF * 2;
        system.kiPool.max += kpAddUF;
        totals.kpMax += kpAddUF;
        entry.bonuses.push(`+${kpAddUF} Max KP (2x Universal Power)`);
      }
      // Combat Rolls +x(T), x = min(ceil(UP/20), 4)
      entry.conditionals.push("Combat Rolls + min(ceil(UP/20), 4)×T");
      // Soak +x(T), x = min(ceil(UP/20), 4)
      entry.conditionals.push("Soak + min(ceil(UP/20), 4)×T");
      // Max KP +2× Universal Power
      entry.conditionals.push("Max KP + 2× Universal Power");

      // -- Triggered entries --
      entry.triggered.push({
        id: "uf_universe_4",
        name: "Universe-Shaking Might (Instant Attack)",
        description: "Spend 10 Universal Power to use Basic Attack or Signature Technique as an Instant Maneuver. That Attacking Maneuver gains 2 Energy Charges.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "uf_universe_5",
        name: "Universe-Shaking Might (Free Unique)",
        description: "If you would use a Unique Ability, spend 5 Universal Power to not pay the KP Cost.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "uf_universe_6",
        name: "Universe-Shaking Might (Free Defend)",
        description: "If targeted by an Attacking Maneuver, spend 5 Universal Power to use Defend without a Counter Action.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      break;
    }

    case "godslayer": {
      const universalPowerGS = system.universeSeed?.universalPower || 0;
      const upScaleGS = Math.min(Math.ceil(universalPowerGS / 20), 4);
      if (upScaleGS > 0) {
        const drAddGS = upScaleGS * tier;
        totals.dr += drAddGS;
        entry.bonuses.push(`+${drAddGS} DR (Universal Power)`);
      }
      if (universalPowerGS > 0) {
        const capAddGS = Math.min(universalPowerGS, Math.floor(system.capacity.max / 2));
        if (capAddGS > 0) {
          system.capacity.max += capAddGS;
          totals.capacityMax += capAddGS;
          entry.bonuses.push(`+${capAddGS} Max Capacity (Universal Power)`);
        }
      }
      // Wound +1d8(T)
      entry.conditionals.push(`+1d8(${tier}) Wound`);
      // DR +min(ceil(UP/20), 4)×T
      entry.conditionals.push("DR + min(ceil(UP/20), 4)×T");
      // vs God Ki: +2(T) Wound
      entry.conditionals.push(`vs God Ki: +${2 * tier} Wound`);
      // Capacity +UP (max 1/2 increase)
      entry.conditionals.push("Max Capacity + UP (max 1/2 increase)");

      // -- Triggered entries --
      entry.triggered.push({
        id: "gs_god_slaying_3",
        name: "God-Slaying Spheres (Sphere Basic)",
        description: "Spend 1 God Sphere to use Basic Attack as Instant Maneuver (Sphere/Spell Profile). Gains Energy Charge, 3 ranks Homing, and Splitting (no Wound reduction).",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "gs_unmatched_4",
        name: "Unmatched in Creation (Cancel Attack)",
        description: "When targeted, spend 5 Universal Power + 2x KP Cost to cancel the Attacking Maneuver. The attacker regains KP but not Actions.",
        usageLimit: "2/Round",
        maxUses: 2
      });
      entry.triggered.push({
        id: "gs_unmatched_5",
        name: "Unmatched in Creation (Counter Clash)",
        description: "If you cancel an attack, Clash (any Saving Throw). Win = Basic Attack OoS. Lose = they re-use canceled attack as OoS.",
        usageLimit: "1/Round",
        maxUses: 1
      });
      entry.triggered.push({
        id: "gs_erase_4",
        name: "Godslayer (Erase)",
        description: "As a 2-Action Maneuver, spend 20 Universal Power to target a Character in Melee Range with lower base and current Tier of Power. Erase them from existence.",
        usageLimit: "1/Encounter",
        maxUses: 1
      });
      break;
    }

    // ========== LEGENDARY OOZARU (moved from Alternate Forms) ==========

    case "legendary_oozaru": {
      // Super Saiyan Heritage: +1/4 Max KP and Capacity
      const kpLO = Math.floor(system.kiPool.max / 4);
      const capLO = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpLO;
      system.capacity.max += capLO;
      totals.kpMax += kpLO;
      totals.capacityMax += capLO;
      entry.bonuses.push(`+${kpLO} Max KP (+1/4)`);
      entry.bonuses.push(`+${capLO} Max Capacity (+1/4)`);
      // Legendary Rampage: conditional on Raging/Compelled
      entry.conditionals.push("Raging/Compelled: double Wound from Battle Born, double Soak from Size");
      // Apply ToP Extra Dice additional time
      system.aptitudes.topExtraDiceExtraApplications = (system.aptitudes.topExtraDiceExtraApplications || 0) + 1;
      entry.conditionals.push("Apply ToP Extra Dice additional time");
      // Legend: +1(T) FO/TE AMB per Great Ape transformation in line
      entry.conditionals.push(`Legend: +${tier} FO/TE AMB per Great Ape form`);
      break;
    }

    // ========== LEGENDARY SUPER SAIYAN LINE ==========

    case "legendary_super_saiyan_1": {
      // Super Saiyan Heritage: +1/4 Max KP and Capacity
      const kpLSS1 = Math.floor(system.kiPool.max / 4);
      const capLSS1 = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpLSS1;
      system.capacity.max += capLSS1;
      totals.kpMax += kpLSS1;
      totals.capacityMax += capLSS1;
      entry.bonuses.push(`+${kpLSS1} Max KP (+1/4)`);
      entry.bonuses.push(`+${capLSS1} Max Capacity (+1/4)`);
      // Unlimited Power: +1 BB Wound max
      entry.bonuses.push("+1 Battle Born Wound max stacks");
      // Unlimited Power: +1(T) AMB (FO/TE/MA) while 5+ BB Wound stacks
      entry.conditionals.push(`5+ BB Wound stacks: +${tier} AMB (FO/TE/MA)`);
      // Unstoppable Legend: +1/4 Might to Soak
      const mightLSS1 = system.aptitudes?.might || 0;
      const soakFromMight = Math.ceil(mightLSS1 / 4);
      addSoak(system, soakFromMight);
      totals.soak += soakFromMight;
      entry.bonuses.push(`+${soakFromMight} Soak (1/4 Might)`);
      // Unstoppable Legend: +1 ToP Extra Dice Category per threshold above
      entry.conditionals.push("+1 ToP Extra Dice Category per threshold above");
      // Legend of Z: +1(T) Might
      system.aptitudes.might = (system.aptitudes.might || 0) + tier;
      totals.might += tier;
      entry.bonuses.push(`+${tier} Might (Legend of Z)`);
      // Legend of Z: +1(T) AMB FO/TE/MA for all SS line
      entry.conditionals.push(`+${tier} AMB (FO/TE/MA) for all SS line transforms`);
      // Legend of Super: +1(T) AMB FO/TE/MA for Wrathful
      entry.conditionals.push(`+${tier} AMB (FO/TE/MA) for Wrathful`);
      // Apply ToP Extra Dice additional time
      entry.conditionals.push("Apply ToP Extra Dice additional time");
      // Unstable Demon: LP loss per round
      entry.conditionals.push("Unstable Demon: LP loss per BB Wound stacks and Ki usage");
      break;
    }

    case "legendary_super_saiyan_2": {
      // Inherits Super Saiyan Heritage from LSS1
      // Sparking Legend: +1(T) Soak while 2+ BB Wound stacks, double at 5+
      entry.conditionals.push(`2+ BB Wound stacks: +${tier} Soak, 5+ stacks: +${2 * tier} Soak`);
      // Mastery: +S-1 BB Wound max
      entry.bonuses.push("+S-1 Battle Born Wound max stacks");
      // Exceed: Infinite Initiative
      entry.conditionals.push("Exceed: Infinite Initiative");
      // Exceed: Scaling (LV1)
      entry.conditionals.push("Exceed: Scaling (LV1)");
      break;
    }

    case "legendary_super_saiyan_3": {
      // Limitless Legend: Double +1/4 KP/Cap from SS Heritage
      const kpLSS3 = Math.floor(system.kiPool.max / 4);
      const capLSS3 = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpLSS3;
      system.capacity.max += capLSS3;
      totals.kpMax += kpLSS3;
      totals.capacityMax += capLSS3;
      entry.bonuses.push(`+${kpLSS3} Max KP (doubled SS Heritage +1/4)`);
      entry.bonuses.push(`+${capLSS3} Max Capacity (doubled SS Heritage +1/4)`);
      // Limitless Legend: Double LP loss from Unstable Demon
      entry.conditionals.push("Unstable Demon LP loss doubled");
      // Mastery: +1/2 Ki Wager to Wound
      entry.conditionals.push("+1/2 Ki Wager added to Wound Rolls");
      // Exceed: +1(T) Wound per 2 BB Wound stacks
      entry.conditionals.push(`Exceed: +${tier} Wound per 2 BB Wound stacks`);
      break;
    }

    default: {
      entry.bonuses.push("Active (trait passives apply per manual)");
      break;
    }
  }
}
