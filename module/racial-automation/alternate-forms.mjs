/**
 * Alternate Form Trait Automation
 * Applies passive trait bonuses from active Alternate Form transformations.
 *
 * Attribute Modifier Bonuses (attrBonuses) are already handled by _calculateAttributeModifiers.
 * This module handles the ADDITIONAL passive effects from Trait Groups while the form is active.
 *
 * S = Stage number within a transformation line (e.g. SS1=1, SS2=2, SS3=3; Hero Mode=1, Super Mode=2, Ultimate Mode=3).
 *     Parsed from gradeOrStacks or derived from known line position.
 * G = Grade (from gradeOrStacks "current/max" format).
 *
 * Called from actor.mjs after applyEnhancementPowerBonuses().
 */

// ============================================================
// Known Alternate Form catalog keys
// ============================================================
const ALTERNATE_FORM_KEYS = new Set([
  "all_out_form", "ascended_super_saiyan", "beyond_god", "dark_demon",
  "descended_super_saiyan", "magical_formation", "super_magical_formation",
  "lovely_magical_formation", "future_super_saiyan", "genetic_power",
  "oozaru", "golden_oozaru",
  "full_suppression", "limited_suppression", "partial_suppression", "true_form",
  "hero_mode", "super_mode", "ultimate_mode",
  "monster_form",
  "initial_power_boost", "high_power_boost", "maximum_power_boost",
  "pseudo_super_saiyan", "shattered_shell",
  "super_form", "super_incredible_guy", "super_saiyan_rage",
  "super_saiyan_1", "super_saiyan_2", "super_saiyan_3",
  "super_tuffle", "united_android"
]);

/**
 * Map of catalog keys to their known S (stage) value within a transformation line.
 * Used for formulas that reference S(T).
 */
const STAGE_MAP = {
  // Super Saiyan line
  super_saiyan_1: 1, super_saiyan_2: 2, super_saiyan_3: 3,
  ascended_super_saiyan: 1, super_saiyan_rage: 3,
  // Mode Change line
  hero_mode: 1, super_mode: 2, ultimate_mode: 3,
  // Oozaru line
  oozaru: 1, golden_oozaru: 2,
  // Metamorphosis line
  full_suppression: 0, limited_suppression: 1, partial_suppression: 2, true_form: 3,
  // Power Boost line
  initial_power_boost: 1, high_power_boost: 2, maximum_power_boost: 3,
  // Magical Formation line
  magical_formation: 1, super_magical_formation: 2, lovely_magical_formation: 3,
};

/**
 * Parse grade/stacks (G or S) from gradeOrStacks.
 * Format is "current/max" (e.g. "3/5") or just a number.
 * @param {string} gradeOrStacks
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
  }
  return null;
}

/**
 * Find a specific option value by effect level key.
 */
function _findOptionByLevel(options, levelKey) {
  if (!options) return null;
  const val = options[String(levelKey)];
  if (val && typeof val === "string" && val !== "none") return val;
  return null;
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
 * Apply all automatable Alternate Form trait bonuses.
 * Only processes active transformations with known alternate form catalog keys.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyAlternateFormBonuses(system, tier, baseTier) {
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
    if (!key || !ALTERNATE_FORM_KEYS.has(key)) continue;

    const S = STAGE_MAP[key] ?? parseGradeOrStacks(trans.gradeOrStacks);
    const G = parseGradeOrStacks(trans.gradeOrStacks);
    const options = optionSelections[String(i)] || optionSelections[i] || {};
    const entry = { name: trans.name, catalogKey: key, stage: S, grade: G, bonuses: [], conditionals: [], triggered: [], perRound: [] };

    applyBonusesForKey(key, system, tier, baseTier, S, G, options, entry, totals, transformations);

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
  system.alternateFormBonuses = result;
}

// ============================================================
// Per-key bonus application
// ============================================================

function applyBonusesForKey(key, system, tier, baseTier, S, G, options, entry, totals, transformations) {
  switch (key) {

    // ========== SUPER SAIYAN LINE ==========

    case "pseudo_super_saiyan": {
      // Slumbering S-Cells L1 [Passive]: +1(T) all Combat Rolls
      totals.combatRolls += tier;
      entry.bonuses.push(`+${tier} Combat Rolls (Slumbering S-Cells)`);
      // Golden Charge L1 [Passive]: +1(T) Initiative Value
      system.aptitudes.initiativeValue = (system.aptitudes.initiativeValue || 0) + tier;
      totals.initiativeValue += tier;
      entry.bonuses.push(`+${tier} Initiative Value (Golden Charge)`);
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "pseudo_ss_slumbering_s_cells_2", name: "Slumbering S-Cells (1/Round)",
        description: "If you hit an Opponent with an Attacking Maneuver, you can increase the Wound Roll by your Tier of Power Extra Dice (min. 1d4).",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "pseudo_ss_golden_charge_2", name: "Golden Charge (1/Round)",
        description: `When you target an Opponent with an Attacking Maneuver, increase your Strike and Wound Rolls by ${tier} (1×T).`,
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "pseudo_ss_golden_spark_1", name: "Golden Spark (Transform)",
        description: "Enter the Raging State until the end of your next turn.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "pseudo_ss_golden_spark_2", name: "Golden Spark (1/Encounter)",
        description: "Regain Ki Points equal to 1/4 of your Max Capacity.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    case "super_saiyan_1": {
      // Lightning Reflexes L1 [Passive]: +S(T) Initiative Value (S=1)
      const initBonus = S * tier;
      system.aptitudes.initiativeValue = (system.aptitudes.initiativeValue || 0) + initBonus;
      totals.initiativeValue += initBonus;
      entry.bonuses.push(`+${initBonus} Initiative Value (Lightning Reflexes, S×T)`);
      // Golden Power L1 [Passive]: +1/4 Max KP and Capacity
      const kpAdd = Math.floor(system.kiPool.max / 4);
      const capAdd = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpAdd;
      system.capacity.max += capAdd;
      totals.kpMax += kpAdd;
      totals.capacityMax += capAdd;
      entry.bonuses.push(`+${kpAdd} Max KP (+1/4, Golden Power)`);
      entry.bonuses.push(`+${capAdd} Max Capacity (+1/4, Golden Power)`);
      // S-Cells L1 [Passive]: apply ToP Extra Dice additional time
      entry.conditionals.push("Apply ToP Extra Dice additional time (S-Cells)");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "ss1_s_cells_2", name: "S-Cells (1/Round)",
        description: "If you hit an Opponent with an Attacking Maneuver, apply your Tier of Power Extra Dice an additional time to the Wound Roll.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "ss1_s_cells_3", name: "S-Cells (1/Encounter)",
        description: `When making a Duel Clash, after you become aware of the result, you may increase your Dice Score by ${S * tier} (S×T). This can cause you to win a Clash you would have otherwise lost.`,
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "ss1_lightning_reflexes_2", name: "Lightning Reflexes (1/Round)",
        description: `If targeted by an Attacking Maneuver, increase Strike and Dodge Rolls by ${S * tier} (S×T) OR increase Damage Reduction by ${2 * S * tier} (2S×T) for that Attacking Maneuver.`,
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "ss1_golden_power_2", name: "Golden Power (Transform)",
        description: "Enter the Raging State until the end of your next turn.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "ss1_golden_power_3", name: "Golden Power (Transform)",
        description: "Regain Ki Points equal to 1/4 of your Max Capacity.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "ss1_mastery_2", name: "Golden Mastery I (Transform)",
        description: "When entering a Mastered Stage, you may enter the Superior State instead of the Raging State. Raging Aspect Dice Category increase applies to Greater Dice instead.",
        usageLimit: "Triggered", maxUses: null
      });
      break;
    }

    case "super_saiyan_2": {
      // Aggressive Momentum L1 [Passive]: treat ToP as 1 higher for all Initiative effects
      entry.conditionals.push("Aggressive Momentum: treat ToP as 1 higher for all Initiative effects");
      // Sparking Ascension L1 [Passive]: Raging/Superior → ToP Extra Dice +1 Dice Category
      entry.conditionals.push("Raging/Superior: ToP Extra Dice +1 Dice Category (Sparking Ascension)");
      // Mastery (Golden Mastery II) [Passive]: Sparking Ascension 2nd loses 1/Round keyword
      entry.conditionals.push("Mastery: Sparking Ascension 2nd loses 1/Round keyword");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "ss2_aggressive_momentum_2", name: "Aggressive Momentum (Transform)",
        description: "If you have Initiative Advantage, gain 1 Standard Action.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "ss2_aggressive_momentum_3", name: "Aggressive Momentum (1/Encounter)",
        description: "If you knock an Opponent through a Health Threshold, they suffer from the Impediment Combat Condition until the end of their next turn.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "ss2_sparking_ascension_2", name: "Sparking Ascension (1/Round)",
        description: `If you hit an Opponent with an Attacking Maneuver with a Ki Wager of ${5 * baseTier}+ (5bT), increase the Damage Category by 1.`,
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    case "super_saiyan_3": {
      // Limitless L1 [Passive]: doubles Golden Power KP/Capacity (+1/4 → +1/2 total, so additional +1/4)
      const kpAdd = Math.floor(system.kiPool.max / 4);
      const capAdd = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpAdd;
      system.capacity.max += capAdd;
      totals.kpMax += kpAdd;
      totals.capacityMax += capAdd;
      entry.bonuses.push(`+${kpAdd} Max KP (Limitless doubles Golden Power)`);
      entry.bonuses.push(`+${capAdd} Max Capacity (Limitless doubles Golden Power)`);
      // Limitless L2 [Passive]: Ki Wager → +1/2 Ki spent to Wound
      entry.conditionals.push("Ki Wager attacks: +1/2 Ki Wager spent to Wound (Limitless)");
      // Limitless L3 [Passive]: halved KP from Power Surges & Combat Recovery
      entry.conditionals.push("Halved KP from Power Surges & Combat Recovery (Limitless)");
      // Mastery (Golden Mastery III) [Passive]: removes halved KP penalty; Full Power → halve Draining loss
      entry.conditionals.push("Mastery: removes halved KP penalty; Full Power → halve Draining KP loss (gains Exhausting)");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "ss3_limitless_4", name: "Limitless (1/Round)",
        description: `When making an Attacking Maneuver with a Ki Wager of ${5 * baseTier}+ (5bT), increase your ToP Extra Dice by 2 Dice Categories and double the bonus from Battle Born stacks for that Wound Roll.`,
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    case "ascended_super_saiyan": {
      // Ascended S-Cells L1 [Passive]: apply ToP Extra Dice additional time
      entry.conditionals.push("Apply ToP Extra Dice additional time (Ascended S-Cells)");
      // Ascended S-Cells L2 [Passive]: +G Dice Categories to Wound Roll Extra Dice
      entry.conditionals.push(`+${G} Wound Dice Categories (Ascended S-Cells, G=${G})`);
      // Golden Muscle L1 (Lightning Reflexes) [Passive]: +1(T) Damage Reduction
      totals.dr += tier;
      entry.bonuses.push(`+${tier} Damage Reduction (Golden Muscle)`);

      // Super Stack penalty-free: Grade 1 = 1 penalty-free, Grade 2 = 0 penalty-free
      // Mastery (Tactical Muscle): Grade 2 ignores 1 Super Stack penalty
      const currentSS = system.status?.superStacks ?? 0;
      let penaltyFree = G >= 2 ? 0 : 1;
      if (trans.mastered && G >= 2) {
        penaltyFree += 1;
        entry.bonuses.push("Mastery: +1 penalty-free Super Stack (Tactical Muscle)");
      } else if (!trans.mastered) {
        entry.conditionals.push("Mastery: Grade 2 ignores 1 Super Stack penalty");
      }

      // Apply penalty-free reduction to already-computed Super Stack penalties
      if (penaltyFree > 0 && currentSS > 0) {
        const penaltyReduction = Math.min(penaltyFree, currentSS) * tier;
        system.aptitudes.superStackStrikePenalty = Math.max(0,
          (system.aptitudes.superStackStrikePenalty || 0) - penaltyReduction);
        system.aptitudes.superStackDodgePenalty = Math.max(0,
          (system.aptitudes.superStackDodgePenalty || 0) - penaltyReduction);
        entry.bonuses.push(`${penaltyFree} penalty-free Super Stack(s): -${penaltyReduction} Strike/Dodge penalty`);
      }
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "asc_ss_golden_muscle_2", name: "Golden Muscle (1/Round)",
        description: "If you knock an Opponent through a Health Threshold, they suffer from the Impediment Combat Condition until the start of your next turn.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "asc_ss_golden_muscle_3", name: "Golden Muscle (1/Encounter)",
        description: "When using an Attacking Maneuver with 3+ Energy Charges, increase the Extra Dice gained from Energy Charges by 2 Dice Categories.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "asc_ss_mastery_3", name: "Tactical Muscle (Transform)",
        description: "When using Golden Power, you may enter the Superior State instead of Raging. Raging Aspect Dice Category increase applies to Greater Dice instead.",
        usageLimit: "Triggered", maxUses: null
      });
      break;
    }

    case "super_saiyan_rage": {
      // Azure Rage L1 [Passive]: all Raging effects redirect to Surging
      entry.conditionals.push("All Raging effects redirect to Surging (Azure Rage)");
      // Azure Rage L2 [Passive]: with Enhancement Power → +1(T) Strike, +1(T) Dodge, +2(T) Wound
      entry.conditionals.push(`With Enhancement Power: +${tier} Strike, +${tier} Dodge, +${2 * tier} Wound (Azure Rage)`);
      // Azure Rage L3 [Passive]: Raging effects apply additional time per Raging trigger
      entry.conditionals.push("Raging effects apply additional time per Raging trigger (Azure Rage)");
      // Mastery (Fury becomes Hope) [Passive]: Defense not lowered by Raging 2nd effect
      entry.conditionals.push("Mastery: Defense not reduced by Raging 2nd effect");
      // Mastery [Passive]: Full Power → apply Raging Extra Dice additional time
      entry.conditionals.push("Mastery + Full Power: Raging Extra Dice additional time");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "ss_rage_azure_rage_1", name: "Azure Rage (Transform)",
        description: "Enter the Raging State until you leave this Transformation.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "ss_rage_azure_rage_4", name: "Azure Rage (1/Round)",
        description: `When making an Attacking Maneuver with a Ki Wager of ${5 * baseTier}+ (5bT), ignore all Damage Reduction and apply Raging State Extra Dice an additional time for that Wound Roll.`,
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    // ========== OOZARU LINE ==========

    case "oozaru": {
      // Furious Beast L1 [Passive]: Compelled/Raging → +2S(T) Wound
      entry.conditionals.push(`Compelled/Raging: +${2 * S * tier} Wound (Furious Beast)`);
      // Furious Beast L2 [Passive]: Ignore S Super Stack Strike penalties
      entry.conditionals.push(`Ignore ${S} Super Stack Strike penalties (Furious Beast)`);
      // Rampaging Assault L1 [Passive]: -2(T) Beam Profile Ki cost
      entry.conditionals.push(`-${2 * tier} KP cost Beam Profile (Rampaging Assault)`);
      // Rampaging Assault L3 [Passive]: +1(T) Wound per Size Category larger
      entry.conditionals.push(`Per Size Category larger: +${tier} Wound (Rampaging Assault)`);
      // Rampaging Assault L4 [Passive]: gain Tail Attack (Heavy, 1/Encounter)
      entry.conditionals.push("Gain Tail Attack Special Maneuver (Heavy, 1/Encounter)");
      // Mastery (Primal Control I) [Permanent]: +1(T) AMB(IN), loses Rampaging
      entry.conditionals.push(`Mastery: +${tier} AMB(IN), loses Rampaging`);
      // Mastery [Passive]: halve Defense Value penalties from Size Category
      entry.conditionals.push("Mastery: halve Defense Value penalties from Size Category");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "oozaru_rampaging_assault_6", name: "Rampaging Assault (1/Round)",
        description: "If you use the Terrain Lift Maneuver, you may use the Throw Maneuver as an Out-of-Sequence Action. You must throw the Feature.",
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    case "golden_oozaru": {
      // Hulking Mass L1 [Passive]: treat opponents as 1 Size Category smaller for Punching Down
      entry.conditionals.push("Treat opponents as 1 Size Category smaller for Punching Down (Hulking Mass)");
      // Hulking Mass L2 [Passive]: +1(T) Wound per Size Category larger (stacks with Rampaging Assault)
      entry.conditionals.push(`Per Size Category larger: +${tier} Wound (Hulking Mass, stacks with Rampaging Assault)`);
      // Super Saiyan Heritage L1 [Passive]: +1/4 Max KP and Capacity
      const kpAdd = Math.floor(system.kiPool.max / 4);
      const capAdd = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpAdd;
      system.capacity.max += capAdd;
      totals.kpMax += kpAdd;
      totals.capacityMax += capAdd;
      entry.bonuses.push(`+${kpAdd} Max KP (+1/4, SS Heritage)`);
      entry.bonuses.push(`+${capAdd} Max Capacity (+1/4, SS Heritage)`);
      // Super Saiyan Heritage L2 [Passive]: apply ToP Extra Dice additional time
      entry.conditionals.push("Apply ToP Extra Dice additional time (SS Heritage)");
      // Mastery (Primal Control II) [Permanent]: +2(T) AMB(AG), loses Rampaging
      entry.conditionals.push(`Mastery: +${2 * tier} AMB(AG), loses Rampaging`);
      // Mastery [Passive]: Superior → Punching Down regardless of Size
      entry.conditionals.push("Mastery + Superior: Punching Down regardless of Size Category");
      // Mastery [Passive]: Full Power → gains 1 level Scaling Aspect
      entry.conditionals.push("Mastery + Full Power: gains 1 level Scaling Aspect");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "golden_oozaru_hulking_mass_3", name: "Hulking Mass (2/Round)",
        description: "If you hit an Opponent with an Attacking Maneuver, they gain a stack of the Broken Combat Condition until the end of your turn.",
        usageLimit: "2/Round", maxUses: 2
      });
      break;
    }

    // ========== METAMORPHOSIS LINE (ARCOSIAN) ==========

    case "full_suppression": {
      // Weakest State L1: if bT < tier requirement, AMBs reduced
      entry.conditionals.push("Under-tier: AMBs -1(T) each, +1 Draining");
      // Weakest State L3: Full Suppression does NOT benefit from Legend Realized or Ki Multiplier
      system.aptitudes.blocksLegendRealized = true;
      system.aptitudes.blocksKiMultiplier = true;
      entry.conditionals.push("Legend Realized BLOCKED (Weakest State)");
      // Transforming Physique L5: applies to other Metamorphosis stages (+Sd6(bT) LP)
      system.aptitudes.transformingPhysiqueAppliesAcrossStages = true;
      entry.conditionals.push("Transforming Physique applies to other Metamorphosis stages");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "full_supp_transforming_physique_6", name: "Transforming Physique (1/Encounter)",
        description: "Set your Initiative to 1 higher than the highest Initiative in the Combat Encounter until the end of the Combat Round. This does not influence your Initiative Value.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    case "limited_suppression": {
      // True Terror L1 [Passive]: +S(T) Wound vs Shaken opponents
      entry.conditionals.push(`Wound vs Shaken: +${1 * tier} (True Terror)`);
      // Transforming Physique L5: +1d6(bT) LP on Legend Realized
      entry.conditionals.push(`Legend Realized LP +1d6(${baseTier}) (Transforming Physique)`);
      // Mastery (Complete Control I) [Permanent]: loses Draining/Power High, gains Natural Form
      entry.conditionals.push("Mastery: loses Draining/Power High, gains Natural Form");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "limited_supp_death_strike_1", name: "Death Strike (1/Round)",
        description: "If you use the Basic Attack Maneuver, you may increase the Damage Category of that Attacking Maneuver to Lethal.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "limited_supp_true_terror_2", name: "True Terror (1/Round)",
        description: "When you benefit from Legend Realized, target all Opponents within a Large Sphere AoE (centered on you). Make a Might Clash against those targets. If you win, those Opponents gain the Shaken Combat Condition until the end of their next turn.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "limited_supp_mastery_2", name: "Complete Control I (2/Round)",
        description: "When you gain a stack(s) of Cruelty, reduce your Critical Target for your Strike Rolls by 1 until the end of this Combat Round.",
        usageLimit: "2/Round", maxUses: 2
      });
      break;
    }

    case "partial_suppression": {
      // Coup de Grace L1 [Passive]: 2+ Cruelty gained this round → ST Strike + ToP Extra Dice (min 1d4)
      entry.conditionals.push("2+ Cruelty gained: ST Strike + ToP Extra Dice, min 1d4 (Coup de Grace)");
      // Mastery (Complete Control II) [Passive]: 2+ Power → ST Wound Cruelty bonus +1/2 (rounded up)
      entry.conditionals.push("Mastery + 2+ Power: ST Wound Cruelty bonus +1/2 rounded up");
      // Transforming Physique L5: +2d6(bT) LP on Legend Realized
      entry.conditionals.push(`Legend Realized LP +2d6(${baseTier}) (Transforming Physique)`);
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "partial_supp_bursting_power_1", name: "Bursting Power (1/Round)",
        description: "On gaining Power, gain an additional stack of Power.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "partial_supp_coup_de_grace_2", name: "Coup de Grace (1/Round)",
        description: "Reduce your Cruelty Stacks by 2 to use the Basic Attack Maneuver as an Instant Maneuver.",
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    case "true_form": {
      // True Form has selectable Meta Traits — check options
      const opt = _findOptionValue(options);

      // Bio-Suit is mandatory (required by 100% Power), so always apply
      totals.dr += 2 * tier;
      totals.steadfast += 1;
      entry.bonuses.push(`+${2 * tier} DR (Bio-Suit)`);
      entry.bonuses.push("+1 Steadfast Dice Score (Bio-Suit)");

      // Check structuredTraits for known meta trait names
      const metaTraits = _getMetaTraitNames(system, key);

      if (metaTraits.has("aerodynamic")) {
        const speedAdd = tier;
        addSpeed(system, speedAdd);
        totals.speed += speedAdd;
        entry.bonuses.push(`+${speedAdd} Speed (Aerodynamic)`);
      }

      if (metaTraits.has("variable-weight plating") || metaTraits.has("variable_weight_plating")) {
        if (opt && (opt.toLowerCase().includes("heavy"))) {
          const soakAdd = 2 * tier;
          const defPen = tier;
          addSoak(system, soakAdd);
          system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) - defPen;
          totals.soak += soakAdd;
          totals.defense -= defPen;
          entry.bonuses.push(`+${soakAdd} Soak, -${defPen} Defense (Heavy Plating)`);
        } else if (opt && (opt.toLowerCase().includes("light"))) {
          const defAdd = 2 * tier;
          const soakPen = tier;
          system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + defAdd;
          addSoak(system, -soakPen);
          totals.defense += defAdd;
          totals.soak -= soakPen;
          entry.bonuses.push(`+${defAdd} Defense, -${soakPen} Soak (Light Plating)`);
        }
      }

      // Last Resource: Wound +1(T) per threshold below — conditional
      if (metaTraits.has("last resource") || metaTraits.has("last_resource")) {
        entry.conditionals.push(`Per threshold below: +${tier} Wound (Last Resource)`);
      }

      // Burning Hatred: while Compelled, Wound +1d6(T)
      if (metaTraits.has("burning hatred") || metaTraits.has("burning_hatred")) {
        entry.conditionals.push(`Compelled: +1d6(${tier}) Wound (Burning Hatred)`);
      }

      // Pressure L1: 2+ Cruelty, ST Strike +1(T)
      if (metaTraits.has("pressure")) {
        entry.conditionals.push(`2+ Cruelty: +${tier} ST Strike (Pressure)`);
      }

      // No Quarter L1 [Passive]: Brutal Assault Extra Dice +2 Dice Categories
      if (metaTraits.has("no quarter") || metaTraits.has("no_quarter")) {
        entry.conditionals.push("Brutal Assault Extra Dice +2 Dice Categories (No Quarter)");
      }

      // King's Stature L1 [Passive]: Size = Enormous
      if (metaTraits.has("king's stature") || metaTraits.has("kings_stature") || metaTraits.has("king stature")) {
        entry.conditionals.push("Size Category set to Enormous (King's Stature)");
      }

      // Redirected Energy L1 [Passive]: after Attacking Maneuver, regain 1(bT) KP
      if (metaTraits.has("redirected energy") || metaTraits.has("redirected_energy")) {
        entry.conditionals.push(`After Attacking Maneuver: regain ${baseTier} KP (Redirected Energy)`);
      }

      // Frozen Magician [Passive]: on gaining Cruelty, reduce UA KP cost by 1(T)
      if (metaTraits.has("frozen magician") || metaTraits.has("frozen_magician")) {
        entry.conditionals.push(`On gaining Cruelty: UA KP cost -${tier} (Frozen Magician)`);
      }

      // Transforming Physique L5: +3d6(bT) LP on Legend Realized
      entry.conditionals.push(`Legend Realized LP +3d6(${baseTier}) (Transforming Physique)`);
      // Mastery (Complete Control III): loses Exhausting/Long Transformation
      entry.conditionals.push("Mastery: loses Exhausting/Long Transformation; True Form on failed Stress Test");

      // -- Triggered/Limited --
      entry.triggered.push({
        id: "true_form_100_power_2", name: "100% Power (1/Encounter)",
        description: "On gaining Power, trigger the True Terror AoE Might Clash effect.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "true_form_100_power_3", name: "100% Power — Power Stressed (1/Encounter)",
        description: "On gaining Power, enter the Power Stressed Special State until you are Defeated or leave this Transformation.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "true_form_unending_cruelty_1", name: "Unending Cruelty (1/Round)",
        description: "If you hit an Opponent with a Basic Attack from Coup de Grace, increase the Cruelty stacks gained from that attack by 1.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "true_form_unending_cruelty_2", name: "Unending Cruelty (3/Round)",
        description: `Sequential on gaining Cruelty: 1st→+${tier} Strike, 2nd→+${2 * tier} Wound, 3rd→double ST Cruelty Wound bonus.`,
        usageLimit: "3/Round", maxUses: 3
      });
      entry.triggered.push({
        id: "true_form_mastery_3", name: "Complete Control III (1/Encounter)",
        description: "You may exit the Power Stressed Special State as an Instant Maneuver.",
        usageLimit: "1/Encounter", maxUses: 1
      });

      // Meta trait triggered entries
      if (metaTraits.has("aerodynamic")) {
        entry.triggered.push({
          id: "true_form_aerodynamic_3", name: "Aerodynamic (1/Round)",
          description: "If you hit an Opponent with an Attacking Maneuver and deal Damage, you may use the Movement Maneuver as an Out-of-Sequence Maneuver.",
          usageLimit: "1/Round", maxUses: 1
        });
      }
      if (metaTraits.has("elongated tail") || metaTraits.has("elongated_tail")) {
        entry.triggered.push({
          id: "true_form_elongated_tail_2", name: "Elongated Tail (1/Round)",
          description: "If you hit an Opponent with your Tail Attack Maneuver, you may use the Grapple Maneuver against that Opponent as an Out-of-Sequence Maneuver.",
          usageLimit: "1/Round", maxUses: 1
        });
      }
      if (metaTraits.has("frozen magician") || metaTraits.has("frozen_magician")) {
        entry.triggered.push({
          id: "true_form_frozen_magician_1", name: "Frozen Magician (2/Round)",
          description: `On gaining Cruelty, reduce KP cost of all Unique Abilities by ${tier} (1×T) until end of Combat Round.`,
          usageLimit: "2/Round", maxUses: 2
        });
        entry.triggered.push({
          id: "true_form_frozen_magician_2", name: "Frozen Magician — Cruelty (1/Round)",
          description: "If you use a Unique Ability or Magic Attack, gain 1 Cruelty.",
          usageLimit: "1/Round", maxUses: 1
        });
      }
      if (metaTraits.has("furious onslaught") || metaTraits.has("furious_onslaught")) {
        entry.triggered.push({
          id: "true_form_furious_onslaught_1", name: "Furious Onslaught (1/Round)",
          description: "Reduce your Cruelty Stacks by 2 to use the Signature Technique Maneuver as an Instant Maneuver.",
          usageLimit: "1/Round", maxUses: 1
        });
      }
      if (metaTraits.has("king's stature") || metaTraits.has("kings_stature") || metaTraits.has("king stature")) {
        entry.triggered.push({
          id: "true_form_kings_stature_2", name: "King's Stature (1/Encounter)",
          description: "If you have 2+ Cruelty, treat your Size Category as Gigantic for Punching Down until end of your next turn.",
          usageLimit: "1/Encounter", maxUses: 1
        });
      }
      if (metaTraits.has("last resource") || metaTraits.has("last_resource")) {
        entry.triggered.push({
          id: "true_form_last_resource_2", name: "Last Resource (1/Encounter)",
          description: `For each Health Threshold you are below, spend ${2 * baseTier} KP to apply an Energy Charge to your Attacking Maneuver.`,
          usageLimit: "1/Encounter", maxUses: 1
        });
      }
      if (metaTraits.has("pressure")) {
        entry.triggered.push({
          id: "true_form_pressure_2", name: "Pressure (1/Round)",
          description: "If you hit an Opponent with a Signature Technique, double the Diminishing Defense they receive.",
          usageLimit: "1/Round", maxUses: 1
        });
      }
      if (metaTraits.has("redirected energy") || metaTraits.has("redirected_energy")) {
        entry.triggered.push({
          id: "true_form_redirected_energy_2", name: "Redirected Energy (1/Round)",
          description: "If you use an Attacking Maneuver, increase the Wound Roll by 1/2 (rounded up) of its Ki Point Cost.",
          usageLimit: "1/Round", maxUses: 1
        });
      }
      if (metaTraits.has("ruler")) {
        entry.triggered.push({
          id: "true_form_ruler_1", name: "Ruler (1/Round)",
          description: "Reduce Cruelty by 2 to target all Allies within a Large Sphere AoE. Targeted Allies apply your ToP Extra Dice (min. 1d4) to Combat Rolls until start of your next turn.",
          usageLimit: "1/Round", maxUses: 1
        });
      }
      if (metaTraits.has("no quarter") || metaTraits.has("no_quarter")) {
        entry.triggered.push({
          id: "true_form_no_quarter_2", name: "No Quarter (1/Round)",
          description: "If you hit an Opponent for the 2nd time this round, apply Guard Down to that Opponent for your next Attacking Maneuver or until end of turn.",
          usageLimit: "1/Round", maxUses: 1
        });
      }
      if (metaTraits.has("variable-weight plating") || metaTraits.has("variable_weight_plating")) {
        if (opt && opt.toLowerCase().includes("heavy")) {
          entry.triggered.push({
            id: "true_form_heavy_plating_5", name: "Heavy Plating (1/Round)",
            description: "Reduce the Damage you would receive from an Attacking Maneuver by 1/2 (rounded up) of your Soak Value.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (opt && opt.toLowerCase().includes("light")) {
          entry.triggered.push({
            id: "true_form_light_plating_6", name: "Light Plating (1/Round)",
            description: "Increase your Dodge Roll by 1/4 (rounded up) of your Defense Value.",
            usageLimit: "1/Round", maxUses: 1
          });
        }
      }
      break;
    }

    // ========== MODE CHANGE LINE ==========

    case "hero_mode": {
      // Form Change L1: depends on which form is active
      const hmOpt = _findOptionValue(options);
      if (hmOpt) {
        const formLower = hmOpt.toLowerCase();
        if (formLower.includes("speed")) {
          const spBonus = S * tier;
          const dodgeBonus = S * tier;
          addSpeed(system, spBonus);
          totals.speed += spBonus;
          totals.dodge += dodgeBonus;
          entry.bonuses.push(`+${spBonus} Speed, +${dodgeBonus} Dodge (Speed Form)`);
        } else if (formLower.includes("battle")) {
          const soakBonus = tier;
          const woundBonus = S * tier;
          addSoak(system, soakBonus);
          totals.soak += soakBonus;
          totals.wound += woundBonus;
          entry.bonuses.push(`+${soakBonus} Soak, +${woundBonus} Wound (Battle Form)`);
        } else if (formLower.includes("focus")) {
          const strikeBonus = S * tier;
          totals.strike += strikeBonus;
          entry.bonuses.push(`+${strikeBonus} Strike, +2 Skill Checks (Focus Form)`);
        } else if (formLower.includes("stylish")) {
          entry.conditionals.push("Hype uses PE Modifier (Stylish Form)");
          entry.conditionals.push(`If already using PE for Hype: +${tier} AMB(PE) (Stylish Form)`);
        }
      } else {
        entry.conditionals.push("Form: Speed(+S(T) Speed/Dodge) / Battle(+1(T) Soak, +S(T) Wound) / Focus(+S(T) Strike, +2 Skill) / Stylish(PE Hype)");
      }
      // New Hero, New Legend L1 [Passive]: reduce Health Threshold Penalties by S(T)
      entry.conditionals.push(`Threshold penalties reduced by ${S * tier} (New Hero, New Legend)`);
      // Mastery (Super Transformation I): removes Long Transformation
      entry.conditionals.push("Mastery: loses Long Transformation");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "hero_mode_form_change_2", name: "Form Change (Triggered)",
        description: "If you use the Power Up Maneuver or Hype Maneuver, you may change your current Form to another Form of your choice.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "hero_mode_new_hero_2", name: "New Hero, New Legend (1/Round)",
        description: `If you change your Form to a different Form, regain 2d6(${baseTier}) Life Points or Ki Points.`,
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "hero_mode_new_hero_3", name: "New Hero, New Legend (Threshold)",
        description: "When knocked through a Health Threshold, you may use the Power Up Maneuver or Hype Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "hero_mode_yfm_1", name: "Your Finishing Move Pt.1 (1/Encounter)",
        description: `If you use an Ultimate Signature Technique, you may gain ${S} Energy Charges that do not count towards your limit.`,
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "hero_mode_yfm_2", name: "Your Finishing Move Pt.1 (1/Round)",
        description: "If you hit an Opponent with a non-AoE Signature Technique, increase the Wound Roll by an Attribute Modifier decided by your current Form.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "hero_mode_mastery_2", name: "Super Transformation I (1/Round)",
        description: "Use the Power Up Maneuver or Hype Maneuver as an Instant Maneuver.",
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    case "super_mode": {
      // Extreme Dream L1 [Passive]: below Bruised → +1(T) all Saving Throws
      entry.conditionals.push(`Below Bruised: +${tier} all Saving Throws (Extreme Dream)`);
      // Level Up L1 [Passive]: Hazard Form = Battle + Focus simultaneously + Rampaging LV2
      entry.conditionals.push("Hazard Form: Battle + Focus simultaneously + Rampaging LV2 (Level Up)");
      // Level Up L2 [Passive]: per-form effects
      entry.conditionals.push("Speed Form: Movement as Instant (Rapid Movement) | Battle Form: Basic Attack as Instant (Simple/Sphere/Spell)");
      // Your Finishing Move Pt.2 — Hazard Form [Passive]: Wound +Might
      entry.conditionals.push("Hazard Form: +Might to Wound Roll (Your Finishing Move)");
      // Mastery (Super Transformation II): Hazard → Rampaging LV1, can change Form in Hazard
      entry.conditionals.push("Mastery: Hazard → Rampaging LV1 instead of LV2; can change Form in Hazard");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "super_mode_level_up_3", name: "Level Up — Speed Form (1/Round)",
        description: "Use the Movement Maneuver as an Instant Maneuver. You must use the effects of Rapid Movement.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "super_mode_level_up_4", name: "Level Up — Battle Form (1/Round)",
        description: "Use the Basic Attack Maneuver as an Instant Maneuver. You must use either the Simple, Sphere or Spell Profiles.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "super_mode_level_up_5", name: "Level Up — Focus Form (1/Round)",
        description: `Target an Opponent. Until the start of your next turn, increase your Wound Rolls against that Opponent by ${2 * tier} (2×T).`,
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "super_mode_level_up_6", name: "Level Up — Stylish Form (1/Round)",
        description: `Target an Ally. While in their Melee Range, increase your Combat Rolls by ${tier} (1×T) until start of your next turn.`,
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "super_mode_extreme_dream_2", name: "Extreme Dream (1/Encounter)",
        description: "As an Instant Maneuver, ignore the effects of all Combat Conditions currently affecting you until the end of your next turn.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "super_mode_yfm2_1", name: "Your Finishing Move Pt.2 (1/Round)",
        description: "If you use a non-AoE Signature Technique, apply a Form-dependent effect to it.",
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    case "ultimate_mode": {
      // Ultimate Rising Power L1 [Passive]: Hazard Form → +1d4(T) Wound & Might Clash
      entry.conditionals.push(`Hazard Form: +1d4(${tier}) Wound & Might Clash (Ultimate Rising Power)`);
      // Ultimate Form L1 [Passive]: all 4 Forms simultaneously + Draining LV3/Weakening/Exhausting
      entry.conditionals.push("Ultimate Form: all 4 Forms simultaneously + Draining LV3/Weakening/Exhausting");
      // It's Never Over L1 [Passive]: per threshold below → +1(T) DR
      entry.conditionals.push(`Per threshold below: +${tier} DR (It's Never Over)`);
      // Mastery (Super Transformation III): Ultimate Form loses Weakening/Exhausting
      entry.conditionals.push("Mastery: Ultimate Form loses Weakening/Exhausting");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "ultimate_mode_its_never_over_2", name: "It's Never Over (Defeated)",
        description: "If Defeated by an Attacking Maneuver, make a Morale Clash against your Opponent. If you win, set your Life Points to 1/4 of your Maximum Life Points.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "ultimate_mode_yfm_climax_1", name: "Your Finishing Move — Climax (1/Encounter)",
        description: "If you hit an Opponent with an Ultimate Signature Technique, double the bonus to your Wound Roll from Your Finishing Move, Part 1.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    // ========== POWER BOOST LINE ==========

    case "initial_power_boost": {
      // Superior Power L1 [Passive]: ToP Extra Dice & Superior State Extra Dice +S Dice Categories
      entry.conditionals.push(`ToP Extra Dice & Superior Dice +${S} Dice Categories (Superior Power)`);
      // Keen Power L1 [Passive]: per Power → Wound Critical Target -1
      entry.conditionals.push("Per Power: Wound Critical Target -1 (Keen Power)");
      // Natural Power — race-specific options
      const ipbOpt = _findOptionValue(options);
      if (ipbOpt) {
        const ipbLower = ipbOpt.toLowerCase();
        if (ipbLower.includes("any race") || ipbLower.includes("any_race") || ipbLower.includes("universal")) {
          system.aptitudes.maxPowerStacksBonus = (system.aptitudes.maxPowerStacksBonus || 0) + 1;
          entry.bonuses.push("+1 Power stack beyond max (Any Race)");
        } else if (ipbLower.includes("earthling")) {
          system.aptitudes.healthThresholdShiftPerPower = 1;
          entry.conditionals.push("Per Power: treat Health Threshold as 1 lower for your effects (Earthling)");
        } else if (ipbLower.includes("majin")) {
          system.aptitudes.lpRecoveryBonusPerPower = (system.aptitudes.lpRecoveryBonusPerPower || 0) + 3 * baseTier;
          entry.conditionals.push(`Per Power: LP recovery +${3 * baseTier} (Majin)`);
        } else if (ipbLower.includes("custom")) {
          const psIPB = system.tracking?.powerStacks || 0;
          if (psIPB >= 2) {
            system.aptitudes.topExtraDiceCategoryBonus = (system.aptitudes.topExtraDiceCategoryBonus || 0) + 2;
          }
          entry.conditionals.push("2+ Power: ToP Extra Dice +2 Dice Categories (Custom Species)");
        } else if (ipbLower.includes("saiyan")) {
          // Catalog L14: lose Power → lose BB instead (3/Encounter)
          system.aptitudes.saiyanLosePowerToBB = true;
          entry.conditionals.push("[Triggered, 3/Encounter] Lose Power: lose Battle Born stack instead (Saiyan)");
        } else if (ipbLower.includes("bio")) {
          system.aptitudes.bioAndroidPerfectionZBonus = true;
          entry.conditionals.push("[Triggered/Power, 1/Round] On Power Up: Z for Perfection +1 (Bio-Android)");
        } else if (ipbLower.includes("android")) {
          system.aptitudes.androidLockOnWoundPerPower = 2 * tier;
          entry.conditionals.push(`Per Power + Lock On: +${2 * tier} Wound (Android)`);
        } else if (ipbLower.includes("arcosian")) {
          system.aptitudes.arcosianPowerUpCruelty = true;
          entry.conditionals.push("Per Power Up: gain 1 Cruelty (Arcosian)");
        } else if (ipbLower.includes("cerealian")) {
          system.aptitudes.cerealianCritWoundNatPerPower = 2;
          entry.conditionals.push("Critical Strike: +2 Wound Natural Result per Power stack (Cerealian)");
        } else if (ipbLower.includes("namekian")) {
          system.aptitudes.namekianStudiedWoundPerPower = 2 * tier;
          entry.conditionals.push(`Per Power + Studied: +${2 * tier} Wound (Namekian)`);
        } else if (ipbLower.includes("neo") || ipbLower.includes("tuffle")) {
          system.aptitudes.neoTuffleOnPowerExtraDice = true;
          entry.conditionals.push("[Triggered/Power, 1/Round] On Power Up: apply ToP Extra Dice additional time (Neo-Tuffle)");
        } else if (ipbLower.includes("shadow")) {
          system.aptitudes.shadowDragonPowerToNegEnergy = true;
          entry.conditionals.push("On gain Power: gain 1 Negative Energy (Shadow Dragon)");
        } else if (ipbLower.includes("shinjin")) {
          system.aptitudes.shinjinPowerCognitiveClash = true;
          entry.conditionals.push("[Triggered/Power, 1/Round] Cognitive Clash → transfer Combat Condition (Shinjin)");
        }
      } else {
        entry.conditionals.push("Natural Power Option: Any Race / Android / Arcosian / Bio-Android / Cerealian / Earthling / Majin / Namekian / Neo-Tuffle / Saiyan / Shadow Dragon / Shinjin / Custom Species");
      }
      // Mastery (Controlled Power I): loses Draining/Exhausting
      entry.conditionals.push("Mastery: loses Draining/Exhausting");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "ipb_improved_power_1", name: "Improved Power (Start of Round)",
        description: `For each stack of Power, increase a Combat Roll of your choice by ${S * tier} (S×T) until end of Combat Round. Cannot select same Combat Roll twice.`,
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "ipb_improved_power_2", name: "Improved Power (On Power)",
        description: "Trigger Improved Power if you haven't already this Combat Round.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "ipb_superior_power_2", name: "Superior Power (On Power)",
        description: "Enter the Superior State until the end of your turn.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "ipb_keen_power_2", name: "Keen Power (S/Encounter)",
        description: "If you lose a stack of Power, you can instead delay losing that stack until the end of your next turn.",
        usageLimit: `${S}/Encounter`, maxUses: S
      });
      entry.triggered.push({
        id: "ipb_mastery_2", name: "Controlled Power I (1/Encounter)",
        description: "If you would gain the Impediment Combat Condition, you can choose not to.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // Race-specific triggered entries
      if (ipbOpt) {
        const ipbLower = ipbOpt.toLowerCase();
        if (ipbLower.includes("android")) {
          entry.triggered.push({
            id: "ipb_natural_power_android", name: "Natural Power — Android (1/Round)",
            description: `If you hit an Opponent with Lock On, increase Wound Roll by ${2 * tier} (2×T) per Power stack.`,
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (ipbLower.includes("bio")) {
          entry.triggered.push({
            id: "ipb_natural_power_bio", name: "Natural Power — Bio-Android (1/Round)",
            description: "On gaining Power, increase Z for Perfection's Traits by 1 until start of your next turn.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (ipbLower.includes("namekian")) {
          entry.triggered.push({
            id: "ipb_natural_power_namekian", name: "Natural Power — Namekian (1/Round)",
            description: `If you hit an Opponent with Studied, increase Wound Roll by ${2 * tier} (2×T) per Power stack.`,
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (ipbLower.includes("neo") || ipbLower.includes("tuffle")) {
          entry.triggered.push({
            id: "ipb_natural_power_tuffle", name: "Natural Power — Neo-Tuffle (1/Round)",
            description: "On gaining Power, apply ToP Extra Dice additional time on your next Attacking Maneuver this round.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (ipbLower.includes("saiyan")) {
          entry.triggered.push({
            id: "ipb_natural_power_saiyan", name: "Natural Power — Saiyan (3/Encounter)",
            description: "If you would lose a stack of Power, you can instead lose a stack of Battle Born.",
            usageLimit: "3/Encounter", maxUses: 3
          });
        } else if (ipbLower.includes("shinjin")) {
          entry.triggered.push({
            id: "ipb_natural_power_shinjin", name: "Natural Power — Shinjin (1/Round)",
            description: "On gaining Power, make a Cognitive Clash vs Opponent in Sphere AoE. Win → transfer a Combat Condition to them.",
            usageLimit: "1/Round", maxUses: 1
          });
        }
      }
      break;
    }

    case "high_power_boost": {
      // Boosting Power L1 [Triggered]: 0 Power → gain Power until end of turn
      entry.conditionals.push("0 Power at start of round: gain a stack of Power until end of turn (Boosting Power)");
      // Mastery (Controlled Power II): loses Exhausting, -1 Draining level
      entry.conditionals.push("Mastery: loses Exhausting, -1 Draining level");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "hpb_boosting_power_1", name: "Boosting Power (Start of Round)",
        description: "If you have 0 stacks of Power, gain a stack of Power until the end of your turn. Applies before Improved Power.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "hpb_boosting_power_2", name: "Boosting Power — Breakthrough (1/Encounter)",
        description: "If you have 2 stacks of Power, you may increase your Tier of Power by 1 (Breakthrough) until the end of your next turn.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "hpb_attacking_power_1", name: "Attacking Power (1/Round)",
        description: "On gaining Power, use the Basic Attack Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "hpb_attacking_power_2", name: "Attacking Power — Ki Wound (1/Round)",
        description: "If you hit an Opponent with an Attacking Maneuver, you may spend up to 2 stacks of Power to increase your Wound Roll by your Might for each Power stack spent.",
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    case "maximum_power_boost": {
      // Overflowing Power L1 [Passive]: Superior State → Combat Rolls +ToP Extra Dice value
      entry.conditionals.push("Superior: Combat Rolls + ToP Extra Dice (Overflowing Power)");
      // Mastery (Controlled Power III): loses Exhausting, -1 Draining level
      entry.conditionals.push("Mastery: loses Exhausting, -1 Draining level");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "mpb_overflowing_power_2", name: "Overflowing Power (1/Round)",
        description: "Use the Power Up Maneuver as an Instant Maneuver.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "mpb_overflowing_power_3", name: "Overflowing Power (1/Round)",
        description: "On gaining Power, gain an additional stack of Power.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "mpb_mastery_3", name: "Controlled Power III (1/Encounter)",
        description: "If your ToP was increased by Boosting Power's Breakthrough, when it would end, you may prolong it until the end of your next turn.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    // ========== BEYOND GOD ==========

    case "beyond_god": {
      // Touch of Divinity L1 [Passive]: Realm of Gods trait access
      entry.bonuses.push("Realm of Gods Trait (Touch of Divinity)");
      // Brilliant Aura L2 [Passive]: per Power → DR +1(bT)
      entry.conditionals.push(`Per Power: +${baseTier} DR (Brilliant Aura)`);
      // Mastery (Assimilated Divinity) L1 [Permanent]: loses Strainless, gains Natural
      entry.conditionals.push("Mastery: loses Strainless, gains Natural Aspect");
      // Mastery L2 [Passive]: 2+ Power → AMB(FO/MA) +1(T)
      entry.conditionals.push(`Mastery + 2+ Power: +${tier} AMB(FO/MA)`);
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "beyond_god_touch_of_divinity_2", name: "Touch of Divinity (Triggered)",
        description: "If you enter a Legendary Form with God Ki Aspect via Transformation Maneuver while in Beyond God, it benefits from Step-by-Step Transformation until you leave.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "beyond_god_brilliant_aura_1", name: "Brilliant Aura (Start of Round)",
        description: `For each stack of Power, regain ${baseTier} (1bT) Divine Ki Points.`,
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "beyond_god_brilliant_aura_3", name: "Brilliant Aura (3/Encounter)",
        description: "If you would lose Power stacks due to Power Up, you can choose not to lose them until end of your next turn. Cannot activate if used at end of your last turn.",
        usageLimit: "3/Encounter", maxUses: 3
      });
      break;
    }

    // ========== DARK DEMON (SHINJIN) ==========

    case "dark_demon": {
      // Shadow Magic option choices
      const ddOpt = _findOptionValue(options);
      const darkness = system.transformationMeta?.specialResources?.darkness?.value || 0;
      if (ddOpt) {
        const ddLower = ddOpt.toLowerCase();
        if (ddLower.includes("powerful")) {
          if (system.attributes.fo) {
            system.attributes.fo.modifier += tier;
            system.attributes.fo.totalScore = system.attributes.fo.score + system.attributes.fo.modifier;
          }
          if (system.attributes.ma) {
            system.attributes.ma.modifier += tier;
            system.attributes.ma.totalScore = system.attributes.ma.score + system.attributes.ma.modifier;
          }
          entry.bonuses.push(`+${tier} AMB(FO/MA) (Powerful Demon)`);
        } else if (ddLower.includes("eternal")) {
          if (darkness > 0) {
            const soakAdd = darkness * tier;
            addSoak(system, soakAdd);
            totals.soak += soakAdd;
            entry.bonuses.push(`+${soakAdd} Soak (Eternal Demon, ${darkness} Darkness)`);
          } else {
            entry.conditionals.push(`Per Darkness: +${tier} Soak (Eternal Demon)`);
          }
        } else if (ddLower.includes("kiri")) {
          system.aptitudes.shadowMagicKiriDrainGrantsDarkness = true;
          entry.conditionals.push("Energy Drain grants Darkness (Kiri Drain)");
        } else if (ddLower.includes("manipulative")) {
          system.aptitudes.shadowMagicManipulativeGrantsDarkness = true;
          entry.conditionals.push("Hype/Analysis grants Darkness (Manipulative)");
        } else if (ddLower.includes("transforming")) {
          system.aptitudes.shadowMagicTransformingGrantsDarkness = true;
          system.aptitudes.shadowMagicMaxDarkness = 4;
          entry.bonuses.push("Gain 1 Darkness on transform; max 4 (Transforming Demon)");
        } else if (ddLower.includes("elemental")) {
          system.aptitudes.shadowMagicElementalOoSBasic = true;
          entry.conditionals.push("Basic Attack as Out-of-Sequence (Elemental)");
        } else if (ddLower.includes("commanding")) {
          system.aptitudes.shadowMagicCommandingMinionDarkness = true;
          entry.conditionals.push("Minion Empower grants Darkness (Commanding)");
        }
      } else {
        entry.conditionals.push("Shadow Magic: choice-dependent Darkness effects");
      }
      // Shadow Magic L1 [Triggered]: gaining Darkness → +1(T) Combat Rolls until next turn
      entry.conditionals.push(`Gaining Darkness: +${tier} Combat Rolls (temp)`);
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "dark_demon_dark_energy_2", name: "Dark Energy (2/Round)",
        description: "If you pay KP to enter/maintain an Aura while an Opponent is in Melee Range, spend 1 Darkness to use the Opponent's KP instead for that Aura's cost.",
        usageLimit: "2/Round", maxUses: 2
      });
      entry.triggered.push({
        id: "dark_demon_dark_energy_3", name: "Dark Energy (1/Round)",
        description: "If you use a Magical Unique Ability, spend 1 Darkness. All Opponents in Melee Range have their LP reduced by 1/2 of your Might.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "dark_demon_swelling_darkness_2", name: "Swelling Darkness (1/Round)",
        description: "Spend 1 Darkness. The target of your Attacking Maneuver or Special Maneuver has their LP reduced by Might and gains Shaken until start of their turn or end of your next Ally's turn.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "dark_demon_swelling_darkness_3", name: "Swelling Darkness (1/Round)",
        description: "Spend 1 Darkness. All Opponents in Melee Range have their LP reduced by 1/2 Might when you use a Magical UA.",
        usageLimit: "1/Round", maxUses: 1
      });
      // Shadow Magic option-dependent triggered entries
      if (ddOpt) {
        const ddLower = ddOpt.toLowerCase();
        if (ddLower.includes("manipulative")) {
          entry.triggered.push({
            id: "dark_demon_manipulative_6", name: "Manipulative Demon (1/Round)",
            description: "If you use the Hype Maneuver or the investigation effect of Analysis, gain 1 Darkness.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (ddLower.includes("elemental")) {
          entry.triggered.push({
            id: "dark_demon_elemental_8", name: "Elemental Demon (1/Round)",
            description: "On gaining Power, use Basic Attack as an Out-of-Sequence Maneuver (chosen Profile only).",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (ddLower.includes("commanding")) {
          entry.triggered.push({
            id: "dark_demon_commanding_9", name: "Commanding Demon (1/Round)",
            description: "When your Minion uses the Empower Maneuver targeting you, gain 1 Darkness.",
            usageLimit: "1/Round", maxUses: 1
          });
        }
      }
      // Mastery (Darkest Demon)
      entry.triggered.push({
        id: "dark_demon_mastery_2", name: "Darkest Demon (1/Round)",
        description: "If you would spend Darkness as part of an effect, gain 1 Darkness.",
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    // ========== DESCENDED SUPER SAIYAN (EARTHLING) ==========

    case "descended_super_saiyan": {
      // Diluted S-Cells L1 [Passive]: apply ToP Extra Dice additional time
      entry.conditionals.push("Apply ToP Extra Dice additional time (Diluted S-Cells)");
      // Mastery (Bloodline Mastery) [Passive]: below Injured → +1 DC ToP Extra Dice
      entry.conditionals.push("Mastery + below Injured: +1 Dice Category ToP Extra Dice (Bloodline Mastery)");
      // Mastery [Passive]: Earthling Resolve extends to Dodge & Soak
      entry.conditionals.push("Mastery: Earthling Resolve bonus extends to Dodge & Soak");
      // Mastery [Permanent]: loses Draining/Exhausting, gains High Speed levels
      entry.conditionals.push("Mastery: loses Draining/Exhausting, +High Speed levels");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "desc_ss_diluted_s_cells_2", name: "Diluted S-Cells (Triggered)",
        description: `If you target an Opponent with Experienced Fighter, increase your Combat Rolls by ${tier} (1×T) against that Opponent until start of your next turn.`,
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "desc_ss_diluted_s_cells_3", name: "Diluted S-Cells (1/Encounter)",
        description: "When you use Last Resort, increase your ToP Extra Dice by 1 Dice Category for that Attacking Maneuver.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "desc_ss_dormant_saiya_1", name: "Dormant Saiya Power (1/Round)",
        description: "If you apply Quick to Master to a Signature Technique, apply your ToP Extra Dice an additional time to Strike and Wound Rolls.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "desc_ss_dormant_saiya_2", name: "Dormant Saiya Power (1/Encounter)",
        description: "On gaining Power, double the bonus to Combat Rolls from Earthling Resolve until start of your next turn.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    // ========== MAGICAL FORMATION LINE ==========

    case "magical_formation": {
      // Forms of Love L1 [Passive]: Beloved in Melee → +1(T) Combat Rolls
      entry.conditionals.push(`Beloved in melee: +${tier} Combat Rolls (Forms of Love)`);
      // Forms of Love L2 [Passive]: gain Hype Maneuver, may use PE Modifier
      entry.conditionals.push("Gain Hype Maneuver, may use PE Modifier (Forms of Love)");
      // Choice-dependent passives
      const mfOpt = _findOptionValue(options);
      if (mfOpt) {
        const mfLower = mfOpt.toLowerCase();
        if (mfLower.includes("powerful")) {
          system.aptitudes.formsOfLoveBelovedSoakBonus = 2 * tier;
          entry.conditionals.push(`+${2 * tier} Soak vs Beloved attacks (Powerful Love)`);
        } else if (mfLower.includes("wild")) {
          system.aptitudes.formsOfLoveBelovedDefenseBonus = tier;
          entry.conditionals.push(`+${tier} Defense vs Beloved attacks (Wild Love)`);
        } else if (mfLower.includes("striking")) {
          system.aptitudes.formsOfLoveBelovedWoundBonus = 2 * tier;
          entry.conditionals.push(`+${2 * tier} Wound vs Beloved (Striking Love)`);
        }
      } else {
        entry.conditionals.push("Choice: Powerful(+2(T) Soak vs Beloved) / Wild(+1(T) Defense) / Striking(+2(T) Wound)");
      }
      // Collection of Love L1 [Passive]: Empower Ki → also gain LP = 1/4 of KP
      entry.conditionals.push("Empower Ki regain: also gain LP = 1/4 of KP gained (Collection of Love)");
      // Mastery (Lovely Love I) — Opponent Beloved: -1(T) Morale Saves
      entry.conditionals.push(`Mastery + Opponent Beloved: -${tier} Morale Saves (Lovely Love I)`);
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "mf_power_of_love_1", name: "Power of Love (Start of Round)",
        description: "Target a Character. They become your Beloved until end of the Combat Round.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "mf_power_of_love_2", name: "Power of Love — Movement (1/Round)",
        description: "Use the Movement Maneuver as an Instant Maneuver. You must end in your Beloved's Melee Range.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "mf_power_of_love_3", name: "Power of Love — Morale Clash (1/Round)",
        description: "If your Beloved is in Melee Range, make a Morale Clash against them as an Instant Maneuver. If you win, they Empower you (Ki transfer, reduced Capacity loss).",
        usageLimit: "1/Round", maxUses: 1
      });
      // Forms of Love choice-dependent triggered
      if (mfOpt) {
        const mfLower = mfOpt.toLowerCase();
        if (mfLower.includes("powerful")) {
          entry.triggered.push({
            id: "mf_powerful_love_4", name: "Powerful Love (1/Round)",
            description: `If you use the Hype Maneuver, increase your Wound Rolls by ${2 * tier} (2×T) until end of your next turn.`,
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (mfLower.includes("wild")) {
          entry.triggered.push({
            id: "mf_wild_love_5", name: "Wild Love (1/Round)",
            description: `If you use the Hype Maneuver, increase your Dodge Rolls by ${tier} (1×T) until end of your next turn.`,
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (mfLower.includes("striking")) {
          entry.triggered.push({
            id: "mf_striking_love_6", name: "Striking Love (1/Round)",
            description: `If you use the Hype Maneuver, increase your Strike Rolls by ${tier} (1×T) until end of your next turn.`,
            usageLimit: "1/Round", maxUses: 1
          });
        }
      }
      entry.triggered.push({
        id: "mf_collection_of_love_2", name: "Collection of Love (Resource)",
        description: `If targeted by Empower, gain 1 Love (max ${S}). Spend Love on Attacking Maneuvers for equal Energy Charges.`,
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "mf_mastery_3", name: "Lovely Love I — Ally (1/Round)",
        description: "If your Ally targets you with Empower, increase their Combat Rolls by 1/4 of your Personality Modifier.",
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    case "super_magical_formation": {
      // Ascending Love L1 [Passive]: gain Wings; if already had Wings → +1(T) Dodge in Sky
      entry.conditionals.push("Gain Wings; if already had Wings: +1(T) Dodge in Sky (Ascending Love)");
      // Building Love L1 [Passive]: Beloved's Empower Ki regain ×1.5
      entry.conditionals.push("Beloved's Empower: Ki regain ×1.5 (Building Love)");
      // -- Triggered/Limited --
      const smfOpt = _findOptionValue(options);
      if (smfOpt) {
        const smfLower = smfOpt.toLowerCase();
        if (smfLower.includes("powerful")) {
          system.aptitudes.smfPowerfulLoveActive = true;
          entry.triggered.push({
            id: "smf_powerful_love_3", name: "Ascending Love — Powerful (1/Round)",
            description: "If your Beloved targets you with an Attacking Maneuver, increase DR by 1/2 PE Modifier. Opponents also count if Beloved Ally is in Melee Range.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (smfLower.includes("wild")) {
          system.aptitudes.smfWildLoveActive = true;
          entry.triggered.push({
            id: "smf_wild_love_3", name: "Ascending Love — Wild (1/Round)",
            description: "If your Beloved targets you with an Attacking Maneuver, increase Defense by 1/4 (round up) PE Modifier. Opponents also count if Beloved Ally is in Melee Range.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (smfLower.includes("striking")) {
          system.aptitudes.smfStrikingLoveActive = true;
          entry.triggered.push({
            id: "smf_striking_love_4", name: "Ascending Love — Striking (1/Round)",
            description: "If you target your Beloved with an Attacking Maneuver, increase Wound Roll by 1/2 PE Modifier. Opponents also count if Beloved Ally is in Melee Range.",
            usageLimit: "1/Round", maxUses: 1
          });
        }
      }
      entry.triggered.push({
        id: "smf_building_love_2", name: "Building Love (1/Round)",
        description: "As an Instant Maneuver, spend any number of Love to remove an equal number of Combat Condition stacks.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "smf_mastery_2", name: "Lovely Love II (1/Encounter)",
        description: "If you hit an Opponent Beloved (or while Beloved Ally used United Attack), increase Wound Roll by your Personality Modifier.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    case "lovely_magical_formation": {
      // All Characters are Beloved
      entry.bonuses.push("All characters are Beloved");
      // Choice: Powerful → ES(Corp)+Growth/Armored; Wild Love → AG +1(T); Striking Love → IN +1(T)
      const lmfOpt = _findOptionValue(options);
      if (lmfOpt) {
        const lmfLower = lmfOpt.toLowerCase();
        if (lmfLower.includes("powerful")) {
          system.aptitudes.lmfPowerfulLoveActive = true;
          system.savingThrows.corporeal.bonus = (system.savingThrows.corporeal.bonus || 0) + tier;
          entry.bonuses.push(`+${tier} Corporeal Save (Powerful Love — Enhanced Save)`);
        } else if (lmfLower.includes("wild")) {
          system.aptitudes.lmfWildLoveActive = true;
          if (system.attributes.ag) {
            system.attributes.ag.modifier += tier;
            system.attributes.ag.totalScore = system.attributes.ag.score + system.attributes.ag.modifier;
          }
          system.savingThrows.impulsive.bonus = (system.savingThrows.impulsive.bonus || 0) + tier;
          entry.bonuses.push(`+${tier} AMB(AG), +${tier} Impulsive Save (Wild Love)`);
        } else if (lmfLower.includes("striking")) {
          system.aptitudes.lmfStrikingLoveActive = true;
          if (system.attributes.in) {
            system.attributes.in.modifier += tier;
            system.attributes.in.totalScore = system.attributes.in.score + system.attributes.in.modifier;
          }
          system.savingThrows.cognitive.bonus = (system.savingThrows.cognitive.bonus || 0) + tier;
          entry.bonuses.push(`+${tier} AMB(IN), +${tier} Cognitive Save (Striking Love)`);
        }
      } else {
        entry.conditionals.push("Wild Love: +AMB(AG) + Enhanced Save (Impulsive); Striking Love: +AMB(IN) + Enhanced Save (Cognitive)");
      }
      // Mastery (Lovely Love III) [Permanent]: loses Long Transformation/Exhausting, gains Perfect Ki Control
      entry.conditionals.push("Mastery: loses Long Transformation/Exhausting, gains Perfect Ki Control");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "lmf_fist_of_love_2", name: "Fist of Love (1/Encounter)",
        description: "When using a Signature Technique, make a Morale Clash vs all Characters in Large Sphere AoE. If you win, they must Empower you (max KP transfer).",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    // ========== FUTURE SUPER SAIYAN ==========

    case "future_super_saiyan": {
      // Resilient S-Cells L1 [Passive]: apply ToP Extra Dice additional time
      entry.conditionals.push("Apply ToP Extra Dice additional time (Resilient S-Cells)");
      // Resilient S-Cells L2 [Passive]: per threshold below → LP/KP regain +1(bT)
      entry.conditionals.push(`Per threshold below: LP/KP regain +${baseTier} (Resilient S-Cells)`);
      // Stand against Evil L1 [Passive]: below Injured → +1(T) Combat Rolls
      entry.conditionals.push(`Below Injured: +${tier} Combat Rolls (Stand against Evil)`);
      // Mastery (Change the Future) [Passive]: outnumbered or below Injured → +1 DC ToP Extra Dice
      entry.conditionals.push("Mastery + outnumbered/below Injured: +1 DC ToP Extra Dice (Change the Future)");
      // Mastery [Permanent]: loses Draining, +High Speed level
      entry.conditionals.push("Mastery: loses Draining, +1 High Speed level");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "future_ss_resilient_s_cells_3", name: "Resilient S-Cells (1/Round)",
        description: `Reduce your LP by up to ${4 * baseTier} (4bT) to regain KP equal to twice the LP lost. If knocked through a Health Threshold, do not suffer its negative effects.`,
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "future_ss_stand_against_evil_2", name: "Stand against Evil (1/Round)",
        description: "If outnumbered or below Injured, use the Power Up Maneuver as an Instant Maneuver.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "future_ss_mastery_2", name: "Change the Future (Transform)",
        description: "When entering Future Super Saiyan, you may enter the Superior State instead of Raging. Raging Aspect Dice Category increase applies to Greater Dice instead.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "future_ss_mastery_4", name: "Change the Future (1/Encounter)",
        description: "If an Attacking Maneuver would knock you through a Health Threshold, reduce the Damage until you are exactly 1 LP below the lowest threshold you would have crossed.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    // ========== GENETIC POWER (BIO-ANDROID) ==========

    case "genetic_power": {
      // Cellular Power L1 [Passive]: per base ToP past 2 → High Speed +1 level
      entry.conditionals.push(`High Speed +${Math.max(0, baseTier - 2)} levels (Cellular Power)`);
      // Cellular Power L2 [Passive]: per Power → ToP Extra Dice +1 Dice Category
      entry.conditionals.push("Per Power: ToP Extra Dice +1 Dice Category (Cellular Power)");
      // Genetic Trait (race-dependent)
      const gpOpt = _findOptionValue(options);
      if (gpOpt) {
        const gpLower = gpOpt.toLowerCase();
        if (gpLower.includes("gleaming") || gpLower.includes("saiyan")) {
          system.aptitudes.gpGleamingMightActive = true;
          system.aptitudes.initiativeValue = (system.aptitudes.initiativeValue || 0) + tier;
          totals.initiativeValue += tier;
          entry.bonuses.push(`+${tier} Initiative Value (Gleaming Might)`);
          entry.conditionals.push("Apply base ToP Extra Dice to Combat Rolls (Gleaming Might)");
        } else if (gpLower.includes("overcharge") || gpLower.includes("android")) {
          system.aptitudes.gpOverchargeActive = true;
          entry.conditionals.push(`KP regain +${2 * baseTier} from effects (Overcharge)`);
        } else if (gpLower.includes("battle") || gpLower.includes("custom")) {
          system.aptitudes.gpSuperBattleActive = true;
          entry.conditionals.push(`No Flaw: +${tier} AMB(FO/MA) + Perfect Ki Control; Below Bruised: +1/4 Capacity (Super Battle)`);
        } else if (gpLower.includes("spiteful") || gpLower.includes("tuffle")) {
          system.aptitudes.gpSpitefulAnnihilationActive = true;
          entry.conditionals.push("2+ Power: ToP Extra Dice +2 Dice Categories (Spiteful Annihilation)");
        } else if (gpLower.includes("bio-tension") || gpLower.includes("earthling")) {
          system.aptitudes.gpBioTensionActive = true;
          entry.conditionals.push("+1 Signature Technique use per round (Bio-Tension)");
        } else if (gpLower.includes("draconic") || gpLower.includes("shadow")) {
          system.aptitudes.gpDraconicPerfectionActive = true;
        } else if (gpLower.includes("perfect cells") || gpLower.includes("namekian")) {
          system.aptitudes.gpPerfectCellsActive = true;
          entry.conditionals.push("Above Bruised: ToP Extra Dice +1 Dice Category vs Opponents (Perfect Cells)");
        } else if (gpLower.includes("cosmic") || gpLower.includes("shinjin")) {
          system.aptitudes.gpCosmicEnergyActive = true;
          entry.conditionals.push(`Per Counter Action: regain ${2 * baseTier} KP (Cosmic Energy)`);
        } else if (gpLower.includes("stroke") || gpLower.includes("arcosian")) {
          system.aptitudes.gpStrokeOfDeathActive = true;
          entry.conditionals.push(`Legend Realized LP +1d10(${baseTier}) (Stroke of Death)`);
        } else if (gpLower.includes("spellbound") || gpLower.includes("majin")) {
          system.aptitudes.gpSpellboundActive = true;
          entry.conditionals.push("Gain additional Majin Secondary Trait (Spellbound)");
        } else if (gpLower.includes("evolved") || gpLower.includes("sniper") || gpLower.includes("cerealian")) {
          system.aptitudes.gpEvolvedSniperActive = true;
        }
      } else {
        entry.conditionals.push("Genetic Trait: Saiyan(Init)/Android(KP)/Custom(FO/MA)/Tuffle(ToP)/Earthling(ST)/Namekian(ToP)/Shinjin(KP)/Arcosian(LP)/Majin(Trait)");
      }
      // Mastery (Further Perfection) [Permanent]: gain 2 additional Aspects
      entry.conditionals.push("Mastery: gain 2 additional Aspects (Further Perfection)");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "gp_cellular_power_3", name: "Cellular Power — Power Stressed (1/Encounter)",
        description: "On gaining Power, enter the Power Stressed Special State until Defeated or leaving this Transformation.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "gp_mastery_2", name: "Further Perfection (1/Encounter)",
        description: "You may exit the Power Stressed Special State as an Instant Maneuver.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // Race-specific triggered entries
      if (gpOpt) {
        const gpLower = gpOpt.toLowerCase();
        if (gpLower.includes("overcharge") || gpLower.includes("android")) {
          entry.triggered.push({
            id: "gp_overcharge_3", name: "Overcharge (1/Round)",
            description: `If you regain ${4 * baseTier}+ KP, reduce KP by ${2 * baseTier} to use Energy Charge as Out-of-Sequence Maneuver.`,
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (gpLower.includes("stroke") || gpLower.includes("arcosian")) {
          entry.triggered.push({
            id: "gp_stroke_of_death_2", name: "Stroke of Death (1/Round)",
            description: "Use the Basic Attack Maneuver as an Instant Maneuver.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (gpLower.includes("evolved") || gpLower.includes("cerealian")) {
          entry.triggered.push({
            id: "gp_evolved_sniper_2", name: "Evolved Sniper (Triggered)",
            description: "If you score a Critical Result on the Strike Roll of a Signature Technique, that Attacking Maneuver gains an Energy Charge.",
            usageLimit: "Triggered", maxUses: null
          });
        } else if (gpLower.includes("battle") || gpLower.includes("custom")) {
          entry.triggered.push({
            id: "gp_super_battle_5", name: "Heroic Finish (1/Round)",
            description: "If you use a non-AoE Signature Technique, apply your highest Attribute Modifier to the Wound Roll.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (gpLower.includes("bio-tension") || gpLower.includes("earthling")) {
          entry.triggered.push({
            id: "gp_bio_tension_2", name: "Bio-Tension (2/Round)",
            description: "When using a Signature Technique, spend LP as if KP to pay for it (max 1/2 of ST's KP cost).",
            usageLimit: "2/Round", maxUses: 2
          });
        } else if (gpLower.includes("spellbound") || gpLower.includes("majin")) {
          entry.triggered.push({
            id: "gp_spellbound_2", name: "Spellbound (Threshold)",
            description: `When knocked through a Health Threshold, regain 1d6(${tier}) Life and Ki Points.`,
            usageLimit: "Triggered", maxUses: null
          });
        } else if (gpLower.includes("perfect") || gpLower.includes("namekian")) {
          entry.triggered.push({
            id: "gp_perfect_cells_1", name: "Perfect Cells (1/Round)",
            description: `If you have 2+ Power, target an Opponent. Increase Wound Rolls vs them by 1d4(${tier}) until start of your next turn.`,
            usageLimit: "1/Round", maxUses: 1
          });
          entry.triggered.push({
            id: "gp_perfect_cells_3", name: "Perfect Cells (1/Encounter)",
            description: "If you use a Healing Surge, enter the Surging State until end of your next turn.",
            usageLimit: "1/Encounter", maxUses: 1
          });
        } else if (gpLower.includes("spiteful") || gpLower.includes("tuffle")) {
          entry.triggered.push({
            id: "gp_spiteful_2", name: "Spiteful Annihilation (1/Round)",
            description: `If you hit an Opponent with an Attacking Maneuver with Energy Charges, increase Wound Roll by ${tier} (1×T) per Energy Charge.`,
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (gpLower.includes("cosmic") || gpLower.includes("shinjin")) {
          entry.triggered.push({
            id: "gp_cosmic_energy_2", name: "Cosmic Energy (2/Encounter)",
            description: "At start of Combat Round, gain an additional Counter Action this round.",
            usageLimit: "2/Encounter", maxUses: 2
          });
        } else if (gpLower.includes("draconic") || gpLower.includes("shadow")) {
          entry.triggered.push({
            id: "gp_draconic_perfection_1", name: "Draconic Perfection (1/Round)",
            description: `If you lose ${8 * baseTier}+ LP from a single effect, gain a stack of Power until end of Combat Round.`,
            usageLimit: "1/Round", maxUses: 1
          });
        }
      }
      break;
    }

    // ========== MONSTER FORM ==========

    case "monster_form": {
      // Monstrous Ascension L1 [Permanent]: 2 chosen Attributes (not FO/MA/IN) get AMB +1(T)
      entry.conditionals.push(`2 chosen Attributes: +${tier} AMB each (Monstrous Ascension)`);
      // Monster Traits — check options (player selects 2)
      const moOpt = _findOptionValue(options);
      if (moOpt) {
        const moLower = moOpt.toLowerCase();
        if (moLower.includes("ravaging") || moLower.includes("charger")) {
          system.aptitudes.monsterRavagingChargerActive = true;
          addSpeed(system, tier);
          totals.speed += tier;
          entry.bonuses.push(`+${tier} Speed (Ravaging Charger)`);
        }
        if (moLower.includes("unrelenting")) {
          system.aptitudes.monsterUnrelentingActive = true;
          system.aptitudes.steadfastBonus = (system.aptitudes.steadfastBonus || 0) + 2;
          totals.steadfast += 2;
          entry.bonuses.push("+2 Steadfast Dice Score (Unrelenting)");
          entry.conditionals.push(`Below Injured: +${2 * baseTier} Soak (Unrelenting)`);
        }
        if (moLower.includes("adaptive") || moLower.includes("toughness")) {
          system.aptitudes.monsterAdaptiveToughnessActive = true;
          entry.conditionals.push(`Per threshold below: +${tier} Soak (Adaptive Toughness)`);
        }
        if (moLower.includes("limber")) {
          system.aptitudes.monsterLimberActive = true;
          entry.conditionals.push(`Above Injured: +${baseTier} Dodge (Limber)`);
        }
        if (moLower.includes("evolving")) {
          system.aptitudes.monsterEvolvingBeastActive = true;
          entry.conditionals.push("2+ Evolution: +1 Steadfast DS (Evolving Beast)");
          entry.conditionals.push(`4 Evolution: +${tier} Clash DS for Might/Saves (Evolving Beast)`);
        }
        if (moLower.includes("bloodlust")) {
          system.aptitudes.monsterBloodlustActive = true;
          entry.conditionals.push(`Per Bloodlust: +${tier} Strike & Wound (Bloodlust)`);
        }
        if (moLower.includes("petrification")) {
          system.aptitudes.monsterPetrificationActive = true;
          entry.conditionals.push(`Per Plate: +${baseTier} DR, -${baseTier} movement (Petrification)`);
        }
        if (moLower.includes("shedding")) {
          system.aptitudes.monsterSheddingActive = true;
          entry.conditionals.push(`Legend Realized LP +1d6(${tier}) (Shedding Transformation)`);
        }
        if (moLower.includes("terrifying")) {
          system.aptitudes.monsterTerrifyingActive = true;
          entry.conditionals.push("Intimidation Natural Result +1, gain Terrify Maneuver (Terrifying Visage)");
        }
        if (moLower.includes("unique") || moLower.includes("monstrosity")) {
          system.aptitudes.monsterUniqueMonstrosityActive = true;
          entry.conditionals.push(`Unique Ability KP cost -${2 * tier} (Unique Monstrosity)`);
        }
        if (moLower.includes("weather") || moLower.includes("battle weather") || moLower.includes("light") || moLower.includes("low gravity")) {
          system.aptitudes.monsterWeatherEnvironmentActive = true;
          if (moLower.includes("battle weather")) {
            system.aptitudes.monsterWeatherBattleWeatherActive = true;
          } else if (moLower.includes("light")) {
            system.aptitudes.monsterWeatherLightActive = true;
          } else if (moLower.includes("low gravity")) {
            system.aptitudes.monsterWeatherLowGravityActive = true;
          }
          entry.conditionals.push(`In Battle Weather: +${tier} Combat Rolls (Weather Environment)`);
          entry.conditionals.push("Light option: enemy abnormal Visibility → +1d6(T) Wound");
        }
        if (moLower.includes("bestial")) {
          system.aptitudes.monsterBestialMonsterActive = true;
          entry.conditionals.push("Gain a Bestial Trait (Bestial Monster)");
        }
      } else {
        entry.conditionals.push("2 Monster Traits: Ravaging/Unrelenting/Adaptive/Limber/Evolving/Bloodlust/Petrification/Shedding/Terrifying/Unique/Weather/Bestial");
      }
      // Beast of Wrath [Passive]: optional Rampaging LV2 → +1(T) AMB(FO/TE/MA) + Armored
      entry.conditionals.push(`Beast of Wrath (optional): +${tier} AMB(FO/TE/MA) + Armored while Rampaging`);
      // Mastery (Controlled Monster) [Passive]: +1(T) AMB(IN); Beast of Wrath stable; +1 Monster Trait in Full Power
      entry.conditionals.push(`Mastery: +${tier} AMB(IN); Beast of Wrath stable; +1 Monster Trait in Full Power`);
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "monster_monstrous_ascension_2", name: "Monstrous Ascension (1/Round)",
        description: "When you use Legend Realized, enter the Superior State until the end of your turn.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "monster_vile_technique_2", name: "Vile Technique (1/Encounter)",
        description: "When using your Vile Technique (Super or Ultimate ST), apply a special Advantage depending on its type.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "monster_beast_of_wrath_2", name: "Beast of Wrath (1/Encounter)",
        description: `On Transform or by spending 1 Action, add Rampaging LV2 to Monster Form. AMB(FO/TE/MA) +${tier}, gains Armored. Lasts until leaving or Defeated.`,
        usageLimit: "1/Encounter", maxUses: 1
      });
      // Monster trait-specific triggered entries
      if (moOpt) {
        const moLower = moOpt.toLowerCase();
        if (moLower.includes("adaptive") || moLower.includes("toughness")) {
          entry.triggered.push({
            id: "monster_adaptive_toughness_2", name: "Adaptive Toughness (1/Round)",
            description: "When targeted by an Attacking Maneuver, double the Soak bonus from Adaptive Toughness for that attack.",
            usageLimit: "1/Round", maxUses: 1
          });
        }
        if (moLower.includes("bloodlust")) {
          entry.triggered.push({
            id: "monster_bloodlust_1", name: "Bloodlust (Resource)",
            description: "When you knock an Opponent through a Health Threshold or Defeat a Minion, gain 1 Bloodlust (max 3). Defeating an Opponent → gain 3 Bloodlust.",
            usageLimit: "Triggered", maxUses: null
          });
        }
        if (moLower.includes("brood")) {
          entry.triggered.push({
            id: "monster_brood_parent_1", name: "Brood Parent (1/Round)",
            description: `Spend 1 Action and ${5 * baseTier} KP to create a Duplicate Minion (1 Size smaller).`,
            usageLimit: "1/Round", maxUses: 1
          });
        }
        if (moLower.includes("limber")) {
          entry.triggered.push({
            id: "monster_limber_2", name: "Limber (1/Round)",
            description: "Use the Movement Maneuver as an Instant Maneuver.",
            usageLimit: "1/Round", maxUses: 1
          });
        }
        if (moLower.includes("petrification")) {
          entry.triggered.push({
            id: "monster_petrification_2", name: "Petrification Plating (1/Round)",
            description: `If hit by an Attacking Maneuver, spend 1 Plate to increase DR by ${6 * baseTier} for that attack.`,
            usageLimit: "1/Round", maxUses: 1
          });
          entry.triggered.push({
            id: "monster_petrification_3", name: "Petrification — Shed Plates (1/Encounter)",
            description: `Spend 1 Action to remove up to 2 Plates. Per Plate removed: +${tier} Combat Rolls until end of your next turn.`,
            usageLimit: "1/Encounter", maxUses: 1
          });
        }
        if (moLower.includes("ravaging") || moLower.includes("charger")) {
          entry.triggered.push({
            id: "monster_ravaging_charger_2", name: "Ravaging Charger (1/Round)",
            description: "If you hit an Opponent after moving into their Melee Range this round, make a Morale Clash. Win → +1/2 max Boosted Speed to Wound Roll.",
            usageLimit: "1/Round", maxUses: 1
          });
        }
        if (moLower.includes("shedding")) {
          entry.triggered.push({
            id: "monster_shedding_3", name: "Shedding Transformation (Defeated)",
            description: "Set LP to 1. If not in Monster Form, enter it as Out-of-Sequence Maneuver.",
            usageLimit: "Triggered", maxUses: null
          });
        }
        if (moLower.includes("terrifying")) {
          entry.triggered.push({
            id: "monster_terrifying_3", name: "Terrifying Visage (1/Round)",
            description: "If you win a Terrify Clash, use the Power Up Maneuver as an Out-of-Sequence Maneuver.",
            usageLimit: "1/Round", maxUses: 1
          });
        }
      }
      // Mastery: Vile Aura
      entry.triggered.push({
        id: "monster_vile_aura_2", name: "Vile Aura (1/Encounter)",
        description: "While in Vile Aura, use Power Up as Instant Maneuver. Apply Beast of Wrath without spending an Action if able.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    // ========== SUPER FORM ==========

    case "super_form": {
      // My Ideal Transformation — Desire choice
      const sfOpt = _findOptionValue(options);
      if (sfOpt) {
        const sfLower = sfOpt.toLowerCase();
        if (sfLower.includes("survival")) {
          system.aptitudes.sfDesireSurvivalActive = true;
          addSoak(system, tier);
          system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + tier;
          totals.soak += tier;
          totals.defense += tier;
          entry.bonuses.push(`+${tier} Soak, +${tier} Defense (Desire Survival)`);
          entry.conditionals.push("Legend Realized LP +1/2 (Desire Survival)");
        } else if (sfLower.includes("combat")) {
          system.aptitudes.sfDesireCombatActive = true;
          entry.conditionals.push(`-${2 * tier} KP cost Physical/Energy Foundation STs (Desire Combat)`);
        } else if (sfLower.includes("magic")) {
          system.aptitudes.sfDesireMagicActive = true;
          entry.conditionals.push(`-${2 * tier} KP cost Magic Foundation STs (Desire Magic)`);
        } else if (sfLower.includes("power")) {
          system.aptitudes.sfDesirePowerActive = true;
          entry.conditionals.push("+1 Power stack beyond max (Desire Power)");
        } else if (sfLower.includes("balance")) {
          system.aptitudes.sfDesireBalanceActive = true;
          entry.conditionals.push(`Unused Foundation attack: +${2 * tier} Wound (Desire Balance)`);
        } else if (sfLower.includes("control")) {
          system.aptitudes.sfDesireControlActive = true;
          entry.conditionals.push("-2 Critical Target for Racial/Special/Unique Clashes (Desire Control)");
        }
      } else {
        entry.conditionals.push("Desire: Survival(Soak+Def)/Combat(-KP Phys/Energy)/Magic(-KP Magic)/Power(+1 Power)/Balance(Wound)/Control(Crit)");
      }
      // Super Power [Passive]: USTs gain Transformation Boost; if already have it, Wound +4(T)
      entry.conditionals.push(`USTs gain Transformation Boost; if already have it: +${4 * tier} Wound (Super Power)`);
      // Super Power options — Super Determined / Super Confident
      const sfOpt2 = _findOptionByLevel(options, "superPower") || _findOptionByLevel(options, "super_power");
      if (sfOpt2) {
        const spLower = sfOpt2.toLowerCase();
        if (spLower.includes("determined")) {
          system.aptitudes.sfSuperDeterminedActive = true;
          entry.conditionals.push(`Below Bruised: +${tier} Strike, +${tier} Wound, ToP Extra Dice additional time (Super Determined)`);
        } else if (spLower.includes("confident")) {
          system.aptitudes.sfSuperConfidentActive = true;
          entry.conditionals.push(`Healthy: +${tier} Soak, +${tier} Defense, ToP Extra Dice additional time (Super Confident)`);
        }
      } else {
        entry.conditionals.push(`Super Determined (below Bruised): +${tier} Strike/Wound, ToP Extra Dice | Super Confident (Healthy): +${tier} Soak/Defense, ToP Extra Dice`);
      }
      // Example of Awakening — race-specific
      const sfOpt3 = _findOptionByLevel(options, "awakening") || _findOptionByLevel(options, "example_of_awakening");
      if (sfOpt3) {
        const awLower = sfOpt3.toLowerCase();
        if (awLower.includes("bio")) {
          system.aptitudes.sfAwakeningBioAndroidActive = true;
        } else if (awLower.includes("android")) {
          system.aptitudes.sfAwakeningAndroidActive = true;
          entry.conditionals.push(`KP > 1/2 max: +${tier} Combat Rolls (Android)`);
        } else if (awLower.includes("earthling")) {
          system.aptitudes.sfAwakeningEarthlingActive = true;
          entry.conditionals.push(`Below Bruised: +${tier} Combat Rolls (Earthling)`);
        } else if (awLower.includes("majin")) {
          system.aptitudes.sfAwakeningMajinActive = true;
          entry.conditionals.push(`Healthy: +${tier} Combat Rolls (Majin)`);
        } else if (awLower.includes("saiyan")) {
          system.aptitudes.sfAwakeningSaiyanActive = true;
          entry.conditionals.push(`Per threshold below: +${tier} Wound, +1 DC ToP Extra Dice (Saiyan)`);
        } else if (awLower.includes("neo") || awLower.includes("tuffle")) {
          system.aptitudes.sfAwakeningNeoTuffleActive = true;
          entry.conditionals.push(`USTs gain Last Legs/Final Chance; if already: +${2 * tier} Wound each (Neo-Tuffle)`);
        } else if (awLower.includes("custom")) {
          system.aptitudes.sfAwakeningCustomSpeciesActive = true;
          entry.conditionals.push("ToP Extra Dice +2 Dice Categories (Custom Species)");
        } else if (awLower.includes("arcosian")) {
          system.aptitudes.sfAwakeningArcosianActive = true;
        } else if (awLower.includes("cerealian")) {
          system.aptitudes.sfAwakeningCerealianActive = true;
        } else if (awLower.includes("namekian")) {
          system.aptitudes.sfAwakeningNamekianActive = true;
        } else if (awLower.includes("shadow")) {
          system.aptitudes.sfAwakeningShadowDragonActive = true;
        } else if (awLower.includes("shinjin")) {
          system.aptitudes.sfAwakeningShinjinActive = true;
        } else if (awLower.includes("any")) {
          system.aptitudes.sfAwakeningAnyRaceActive = true;
          entry.conditionals.push(`Legend Realized Dice Score +${4 * baseTier} (Any Race)`);
        }
      }
      // Mastery (Super Warrior) [Permanent]: loses Draining, +High Speed, gains Natural
      entry.conditionals.push("Mastery: loses Draining, +High Speed, gains Natural, additional Desire/Awakening");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "sf_my_ideal_2", name: "My Ideal Transformation (Transform)",
        description: "Increase the amount of Ki Points regained through this instance of Legend Realized by 1/2.",
        usageLimit: "Triggered", maxUses: null
      });
      // Desire-specific triggered entries
      if (sfOpt) {
        const sfLower = sfOpt.toLowerCase();
        if (sfLower.includes("survival")) {
          entry.triggered.push({
            id: "sf_desire_survival_6", name: "Desire Survival (Start of Round)",
            description: `Regain ${3 * baseTier} LP and KP per threshold below. Below Injured: gain an additional Counter Action.`,
            usageLimit: "Triggered", maxUses: null
          });
        } else if (sfLower.includes("power")) {
          entry.triggered.push({
            id: "sf_desire_power_4", name: "Desire Power (Start of Turn)",
            description: "You may use the Power Up Maneuver as an Out-of-Sequence Maneuver.",
            usageLimit: "Triggered", maxUses: null
          });
        } else if (sfLower.includes("combat")) {
          entry.triggered.push({
            id: "sf_desire_combat_7", name: "Desire Combat (1/Round)",
            description: "If you use a Physical/Energy Foundation ST, apply an Energy Charge that doesn't count towards your max.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (sfLower.includes("magic")) {
          entry.triggered.push({
            id: "sf_desire_magic_8", name: "Desire Magic (1/Round)",
            description: "If you use a Magic Foundation ST, apply an Energy Charge that doesn't count towards your max.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (sfLower.includes("balance")) {
          entry.triggered.push({
            id: "sf_desire_balance_9", name: "Desire Balance — OoS (1/Round)",
            description: "If you hit and deal Damage, use Basic Attack as OoS Maneuver (must use unused Foundation).",
            usageLimit: "1/Round", maxUses: 1
          });
          entry.triggered.push({
            id: "sf_desire_balance_16", name: "Desire Balance — Wound (3/Round)",
            description: `If using an unused Foundation's Attacking Maneuver this round, increase Wound Roll by ${2 * tier} (2×T).`,
            usageLimit: "3/Round", maxUses: 3
          });
        } else if (sfLower.includes("control")) {
          entry.triggered.push({
            id: "sf_desire_control_5", name: "Desire Control (1/Round)",
            description: `If making a non-Skill Clash for Special Maneuver/UA/Racial Trait, increase Dice Score by ${tier} (1×T).`,
            usageLimit: "1/Round", maxUses: 1
          });
        }
      }
      // Awakening race-specific triggered entries
      if (sfOpt3) {
        const awLower = sfOpt3.toLowerCase();
        if (awLower.includes("arcosian")) {
          entry.triggered.push({
            id: "sf_awakening_arcosian", name: "Awakening — Arcosian (1/Round)",
            description: `If you hit an Opponent 3 times this round, spend ${4 * baseTier} KP to use a 1-Action Maneuver as OoS.`,
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (awLower.includes("bio")) {
          entry.triggered.push({
            id: "sf_awakening_bio", name: "Awakening — Bio-Android (1/Round)",
            description: `If you have 1 Action after a Maneuver, spend ${2 * baseTier} KP to Energy Charge as OoS. Next Maneuver must be ST.`,
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (awLower.includes("cerealian")) {
          entry.triggered.push({
            id: "sf_awakening_cerealian", name: "Awakening — Cerealian (1/Round)",
            description: "If you score a Critical Result on a Combat Roll, gain a stack of Power until end of your next turn.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (awLower.includes("namekian")) {
          entry.triggered.push({
            id: "sf_awakening_namekian", name: "Awakening — Namekian (1/Round)",
            description: `If you remove Studied Stacks from an Opponent, regain ${3 * baseTier} KP and Capacity per stack removed.`,
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (awLower.includes("shadow")) {
          entry.triggered.push({
            id: "sf_awakening_shadow", name: "Awakening — Shadow Dragon (1/Round)",
            description: `If you lose ${4 * baseTier}+ LP from your own effect, spend ${4 * baseTier} LP to use a 1-Action Maneuver as OoS.`,
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (awLower.includes("shinjin")) {
          entry.triggered.push({
            id: "sf_awakening_shinjin", name: "Awakening — Shinjin (1/Round)",
            description: `If you beat an Opponent in a Racial/Special/UA Clash, spend ${4 * baseTier} KP to use a 1-Action Maneuver as OoS.`,
            usageLimit: "1/Round", maxUses: 1
          });
        }
      }
      break;
    }

    // ========== SUPER INCREDIBLE GUY ==========

    case "super_incredible_guy": {
      // The World's Strongest Guy L1 [Passive]: all Extra Dice (ToP/States) +1 Dice Category
      entry.conditionals.push("All Extra Dice (ToP/States) +1 Dice Category (World's Strongest Guy)");
      // World's Strongest Guy L2 [Permanent/Passive]: Enhanced Save (chosen) + Custom Species Racial Trait
      entry.conditionals.push("Enhanced Save (chosen) + Custom Species Racial Trait (World's Strongest Guy)");
      // World's Strongest Guy L3 [Passive]: no Flaw → +1(T) AMB(FO/MA)
      entry.conditionals.push(`No Flaw traits: +${tier} AMB(FO/MA) (World's Strongest Guy)`);
      // A Red-Hot Fight L1 [Passive]: below Bruised → +1/4 Max Capacity
      entry.conditionals.push("Below Bruised: +1/4 Max Capacity (A Red-Hot Fight)");
      // Mastery (Super Warriors Can't Rest) [Passive]: +1(T) AMB(IN)
      entry.conditionals.push(`Mastery: +${tier} AMB(IN)`);
      // Mastery [Passive]: Extra Dice bonus → +2 Dice Categories (instead of +1)
      entry.conditionals.push("Mastery: Extra Dice bonus → +2 Dice Categories (instead of +1)");
      // Mastery [Passive]: removes Flaw penalties, gains all Flaw effects
      entry.conditionals.push("Mastery: removes Flaw penalties, gains all Flaw effects");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "sig_red_hot_fight_2", name: "A Red-Hot Fight (Triggered)",
        description: "When you benefit from Legend Realized, you may enter the Superior State until the end of your next turn.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "sig_red_hot_fight_3", name: "A Red-Hot Fight (1/Encounter)",
        description: "If you knock an Opponent through a Health Threshold, apply the effects of Legend Realized.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    // ========== SHATTERED SHELL (SHADOW DRAGON) ==========

    case "shattered_shell": {
      // Ultimate Fighting Form L1 [Passive]: High Speed +1 level per base ToP past 2
      entry.conditionals.push(`High Speed +${Math.max(0, baseTier - 2)} levels (Ultimate Fighting Form)`);
      // Intense Presence L1 [Passive]: per Power → opponents in Minor Sphere Wound NR -1
      entry.conditionals.push("Per Power: opponents' Wound Natural Results -1 in Minor Sphere (Intense Presence)");
      // Supernatural Dominance — choice-dependent
      const ssOpt = _findOptionValue(options);
      if (ssOpt) {
        const ssLower = ssOpt.toLowerCase();
        if (ssLower.includes("sinister")) {
          system.aptitudes.ssSinisterDragonActive = true;
          entry.conditionals.push("Per Power: your Wound Natural Result +1 (Sinister Dragon)");
        } else if (ssLower.includes("hazy")) {
          system.aptitudes.ssHazyDragonActive = true;
          entry.conditionals.push("Battle Weather: Power stacks can't drop below 1 (Hazy Dragon)");
        } else if (ssLower.includes("noble")) {
          system.aptitudes.ssNobleDragonActive = true;
          entry.conditionals.push("Per Power: your Wound NR +1; Compelled target Wound NR -1 (Noble Dragon)");
        } else if (ssLower.includes("elemental")) {
          system.aptitudes.ssElementalDragonActive = true;
          entry.conditionals.push("Elemental Dragon effects (Supernatural Dominance)");
        } else if (ssLower.includes("regenerative")) {
          system.aptitudes.ssRegenerativeDragonActive = true;
          entry.conditionals.push("Regenerative Dragon effects (Supernatural Dominance)");
        } else if (ssLower.includes("ominous")) {
          system.aptitudes.ssOminousDragonActive = true;
          entry.conditionals.push("Ominous Dragon effects (Supernatural Dominance)");
        } else if (ssLower.includes("natural")) {
          system.aptitudes.ssNaturalDragonActive = true;
          entry.conditionals.push("Natural Dragon effects (Supernatural Dominance)");
        }
      } else {
        entry.conditionals.push("Supernatural Dominance: Sinister/Hazy/Elemental/Noble/Regenerative/Ominous/Natural Dragon");
      }
      // Mastery (Draconic Ascension) L1 [Passive]: with Aura → treated as +1 Power stack
      entry.conditionals.push("Mastery + Aura: treated as +1 Power stack for all effects");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "shattered_shell_uff_2", name: "Ultimate Fighting Form (Triggered)",
        description: "If you spend any Negative Energy, target an Opponent in Sphere AoE. Reduce their LP by 1/4 (rounded up) of your Might.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "shattered_shell_uff_3", name: "Ultimate Fighting Form (1/Round)",
        description: `If you lose ${8 * baseTier}+ LP from a single effect, gain a stack of Power until end of Combat Round.`,
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "shattered_shell_uff_4", name: "Ultimate Fighting Form (1/Round)",
        description: "On gaining Power, gain 2 Negative Energy until start of your next turn.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "shattered_shell_intense_presence_2", name: "Intense Presence (Start of Round)",
        description: `For each Power stack, Opponents in Sphere AoE have LP reduced by ${3 * baseTier} (3bT).`,
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "shattered_shell_intense_presence_3", name: "Intense Presence (Transform)",
        description: "Use the Power Up Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: "Triggered", maxUses: null
      });
      // Supernatural Dominance choice-dependent triggered
      if (ssOpt) {
        const ssLower = ssOpt.toLowerCase();
        if (ssLower.includes("elemental")) {
          entry.triggered.push({
            id: "shattered_shell_elemental_4", name: "Elemental Dragon (1/Round)",
            description: "On gaining Power, pay 1 Negative Energy to use Basic Attack as OoS Maneuver (chosen Profile only).",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (ssLower.includes("regenerative")) {
          entry.triggered.push({
            id: "shattered_shell_regenerative_6", name: "Regenerative Dragon (1/Round)",
            description: "On gaining Power, regain Life Points equal to twice your Might.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (ssLower.includes("ominous")) {
          entry.triggered.push({
            id: "shattered_shell_ominous_7", name: "Ominous Dragon (1/Round)",
            description: "On gaining Power, make a Morale Clash vs all Opponents in Sphere AoE. Win → Shaken until start of your next turn.",
            usageLimit: "1/Round", maxUses: 1
          });
        } else if (ssLower.includes("natural")) {
          entry.triggered.push({
            id: "shattered_shell_natural_8", name: "Natural Dragon (1/Round)",
            description: "While benefiting from Absorption, use Power Up as Instant Maneuver.",
            usageLimit: "1/Round", maxUses: 1
          });
        }
      }
      entry.triggered.push({
        id: "shattered_shell_mastery_2", name: "Draconic Ascension (1/Encounter)",
        description: `Reduce your LP by ${8 * baseTier} (8bT). All Opponents in Large Sphere AoE lose equal LP. If knocked through a threshold, they auto-fail Steadfast.`,
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    // ========== SUPER TUFFLE ==========

    case "super_tuffle": {
      // Vengeful Driveby L1 [Passive]: High Speed +1 level per base ToP past 2
      entry.conditionals.push(`High Speed +${Math.max(0, baseTier - 2)} levels (Vengeful Driveby)`);
      // Tuffle Supremacy L1 [Passive]: Tuffle Superiority 2nd effect +2/Encounter
      entry.conditionals.push("Tuffle Superiority 2nd effect +2/Encounter (Tuffle Supremacy)");
      // Revenge Amplification: mostly Triggered
      entry.conditionals.push("3+ Revenge Points: access Hatred Embodiment/Parasite effects (Revenge Amplification)");
      // Mastery (Long-Lasting Hatred): trigger extensions
      entry.conditionals.push("Mastery: Vengeful Driveby 3rd also triggers on Legendary Form Transform");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "super_tuffle_revenge_amp_1", name: "Revenge Amplification (Transform)",
        description: "Gain 1 Revenge Point and 1 Disdain.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "super_tuffle_revenge_amp_2", name: "Revenge Amplification (Start of Round)",
        description: "Gain 1 Revenge Point.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "super_tuffle_revenge_amp_3", name: "Revenge Amplification (1/Round, 3/Encounter)",
        description: "If you would spend up to 2 Revenge Points for an effect, apply it without losing those Revenge Points.",
        usageLimit: "3/Encounter", maxUses: 3
      });
      entry.triggered.push({
        id: "super_tuffle_hatred_embodiment_5", name: "Hatred Embodiment (1/Round)",
        description: "If you knock an Opponent through a Health Threshold, use Power Up or Energy Charge as OoS Maneuver.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "super_tuffle_parasite_6", name: "Parasite (1/Round)",
        description: "If you knock an Opponent through a Health Threshold, use Possession as OoS Maneuver (even outside Liquid State). If already in Possession Fusion, Power Up as OoS instead.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "super_tuffle_tuffle_supremacy_2", name: "Tuffle Supremacy (1/Round)",
        description: `If you hit an Opponent with an Attacking Maneuver while Surging, increase Wound bonus by ${tier} per 2 Revenge Points spent.`,
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "super_tuffle_tuffle_supremacy_3", name: "Tuffle Supremacy (1/Encounter)",
        description: "On gaining Power, enter the Surging State until end of your next turn.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "super_tuffle_vengeful_driveby_2", name: "Vengeful Driveby (1/Round)",
        description: "If you use Movement to enter an Opponent's Melee Range, use Basic Attack as OoS Action.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "super_tuffle_mastery_3", name: "Long-Lasting Hatred (1/Encounter)",
        description: "If you would leave the Surging State, instead remain in it until end of your next turn.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      break;
    }

    // ========== UNITED ANDROID ==========

    case "united_android": {
      // Reinforced Frame L1 [Passive]: opponents can't trigger on Bruised threshold
      entry.conditionals.push("Opponents can't trigger on Bruised threshold (Reinforced Frame)");
      // Reinforced Frame — Wonders of Technology choice
      const uaOpt = _findOptionValue(options);
      if (uaOpt) {
        const uaLower = uaOpt.toLowerCase();
        if (uaLower.includes("construct")) {
          entry.conditionals.push("Gains Armored Aspect (Construct)");
        } else if (uaLower.includes("zombie")) {
          entry.conditionals.push("Gain Damage Inhibitor (or Armored if already have it) (Zombie)");
        } else if (uaLower.includes("machine") || uaLower.includes("mutant")) {
          entry.conditionals.push("Double LP/KP from Break Points; 1st free of 3/Encounter limit (Machine Mutant)");
        }
      } else {
        entry.conditionals.push("Wonders of Technology: Construct(Armored)/Zombie(Damage Inhibitor)/Machine Mutant(Break Points)");
      }
      // Murder Machine L1 [Passive]: per Power + Lock On → +1(T) Wound
      entry.conditionals.push(`Per Power + Lock On target: +${tier} Wound (Murder Machine)`);
      // Superior Design L1 [Passive]: Energy Charge Dice Category +1
      entry.conditionals.push("+1 Energy Charge Dice Category (Superior Design)");
      // Mastery (Robotic Perfection) [Passive]: no KP cost on Reinforced Frame 2nd; ignore 1 Super Stack
      entry.conditionals.push("Mastery: Reinforced Frame 2nd no KP cost; ignore 1 Super Stack penalties");
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "ua_reinforced_frame_2", name: "Reinforced Frame (Start of Round)",
        description: `Reduce your KP by ${6 * baseTier} (6bT) to increase DR by ${2 * baseTier} (2bT) until end of Combat Round.`,
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "ua_reinforced_frame_4", name: "Enhanced Organism (1/Round)",
        description: "If hit by an Attacking Maneuver and you did not use a Counter Maneuver, double your Soak Value for that Attacking Maneuver.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "ua_murder_machine_3", name: "Murder Machine (1/Round)",
        description: "If you target an Opponent with Lock On, increase the Damage Category of your Attacking Maneuver by 1.",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "ua_superior_design_2", name: "Superior Design (Triggered)",
        description: "If you gain a stack of Super Android through Unify, you can use the Transformation Maneuver to enter this Transformation as an OoS Maneuver.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "ua_superior_design_3", name: "Superior Design (1/Round)",
        description: "If you gain a stack of Reserved Energy, also gain a stack of Power until end of your next turn.",
        usageLimit: "1/Round", maxUses: 1
      });
      break;
    }

    // ========== ALL OUT FORM ==========

    case "all_out_form": {
      // Percentage of Power L1 [Passive]: cannot gain Holding Back stacks
      entry.bonuses.push("Cannot gain Holding Back stacks (Percentage of Power)");
      // Percentage of Power L2 [Passive]: Draining levels reduced by Holding Back stacks
      entry.conditionals.push("Draining levels reduced by Holding Back stacks (Percentage of Power)");
      // Percentage of Power L3 [Passive]: -1(T) Ki cost per Holding Back (max 2(T))
      entry.conditionals.push(`Per Holding Back: -${tier} Ki cost, max ${2 * tier} (Percentage of Power)`);
      // Superior Might L1 [Passive]: Superior State → +1(T) Might
      entry.conditionals.push(`Superior: +${tier} Might (Superior Might)`);
      // Superior Might L2 [Passive]: per 2 Focused Power → Greater Dice +1 Dice Category
      entry.conditionals.push("Per 2 Focused Power: Greater Dice +1 Dice Category (Superior Might)");
      // True Power Unleashed L1/L2 [Passive/Resource]: per 2 Focused Power → +1(T) Combat Rolls & Might
      entry.conditionals.push(`Per 2 Focused Power: +${tier} Combat Rolls & Might (True Power Unleashed)`);
      // Mastery L3 [Passive]: 0 Holding Back + 1+ Focused Power → +2(T) Wound
      entry.conditionals.push(`Mastery + 0 Holding Back + 1+ Focused: +${2 * tier} Wound`);
      // -- Triggered/Limited --
      entry.triggered.push({
        id: "aof_true_power_unleashed_3", name: "True Power Unleashed (Resource)",
        description: "If you would gain a stack of Power, you may instead gain a stack of Focused Power (max 4). Per 2 Focused Power: +1(T) Combat Rolls and Might.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "aof_true_power_unleashed_4", name: "True Power Unleashed (1/Round)",
        description: `If you gain a stack of Focused Power, regain Capacity equal to 1/4 (rounded up) of your Max Capacity and increase Combat Rolls by ${tier} (1×T) until end of your turn.`,
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "aof_true_power_unleashed_5", name: "True Power Unleashed — Energy Charge (1/Round)",
        description: "If you use Energy Charge, spend a Focused Power to gain an additional Energy Charge (counts towards Mandatory Charge).",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "aof_true_power_unleashed_6", name: "True Power Unleashed (1/Encounter)",
        description: "On Transform, use Power Up as OoS Maneuver. Make a Might Clash vs all Opponents — win → Impediment until end of your turn.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "aof_percentage_of_power_4", name: "Percentage of Power — LP Recovery (1/Round)",
        description: `If you remove any Holding Back stacks, regain ${5 * tier} (5×T) LP per stack removed.`,
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "aof_percentage_of_power_5", name: "Percentage of Power (1/Encounter)",
        description: "If you reduce Holding Back to 0, trigger True Power Unleashed 6th effect again (even if already used).",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "aof_percentage_of_power_6", name: "Percentage of Power (Transform)",
        description: "If you enter this Transformation with 0 Holding Back, enter the Superior State until end of your next turn.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "aof_superior_might_3", name: "Superior Might (Start of Turn)",
        description: "Spend 1 Focused Power to enter the Superior State until end of your turn.",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "aof_superior_might_4", name: "Superior Might (1/Encounter)",
        description: "If you would leave the Superior State, spend 2 Focused Power to remain in it until end of your next turn.",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "aof_mastery_4", name: "The Truth of your Power (1/Round, 2/Encounter)",
        description: "If you gain a stack of Focused Power, gain an additional stack of Focused Power.",
        usageLimit: "2/Encounter", maxUses: 2
      });
      break;
    }

    default: {
      entry.bonuses.push("Active (trait passives apply per manual)");
      break;
    }
  }
}

// ============================================================
// Helper: extract meta trait names from structuredTraits
// ============================================================

/**
 * Check the actor's transformation structuredTraits for known meta trait names.
 * Returns a Set of lowercase trait names found.
 */
function _getMetaTraitNames(system, catalogKey) {
  const names = new Set();
  const transformations = system.transformations || [];
  for (const trans of transformations) {
    if (trans.catalogKey !== catalogKey) continue;
    const st = trans.structuredTraits || [];
    for (const trait of st) {
      if (trait && trait.name) {
        names.add(trait.name.toLowerCase());
      }
    }
  }
  return names;
}
