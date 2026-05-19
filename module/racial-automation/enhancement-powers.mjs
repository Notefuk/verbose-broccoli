/**
 * Enhancement Power Trait Automation
 * Applies passive trait bonuses from active Enhancement Power transformations.
 *
 * Attribute Modifier Bonuses (attrBonuses) are already handled by _calculateAttributeModifiers.
 * This module handles the ADDITIONAL passive effects from Trait Groups while the EP is active.
 *
 * Called from actor.mjs after applyManifestedPowerBonuses().
 */

// ============================================================
// Known Enhancement Power catalog keys (non-manifested)
// ============================================================
const ENHANCEMENT_KEYS = new Set([
  "absorbed_power", "agile_style", "all_out_kaioken", "all_range_combat",
  "autonomous_ultra_instinct", "awoken", "boiling_rage", "breaking_point",
  "burst_attack", "compressed_power", "controlled_wrathful", "copy_eye",
  "crusher_form", "divine_halo", "doping", "dragon_force",
  "drunken_fist", "effortless", "elemental_burst", "embers_of_ultra_instinct",
  "enhanced_aura", "enraged", "environmental_style", "evil_aura",
  "evil_saiyan", "explosive_power", "eye_of_the_storm", "feral_fist",
  "future_hero", "giant_form", "god_aura", "great_namekian",
  "great_wrathful", "hero", "hi_tension", "inner_phantom",
  "juggernaut", "kaioken", "kaleidoscope_eye", "kamen_rider",
  "lightspeed_mode", "magic_awakening", "martial_focus", "martial_mastery",
  "mighty_namekian", "miniature_might", "mushin", "nimbus_pro",
  "no_ego_zone", "ocular_awakening", "overdrive", "performer",
  "power_of_destruction", "powerhouse", "red_eyed_namekian", "relaxed_warrior",
  "sage_power", "saiyan_pride", "scholar", "seething_fury",
  "shining_sword", "son_of_namek", "spirit_absorption", "spirit_empowerment",
  "stylish", "super_kaioken", "super_powerhouse", "super_saiyan_power",
  "tactician", "time_power", "transformative_mimicry", "transplanted_copy_eye",
  "tuffleization", "twin_dragon_mode", "ultra_supervillain", "unburdened",
  "unlimited_construction", "warrior_projection", "weapon_of_hope",
  "whimsical_majin", "wrathful"
]);

function addSpeed(system, amount) {
  system.status = system.status || {};
  system.status.normalSpeed = (system.status.normalSpeed || 0) + amount;
  system.status.boostedSpeed = (system.status.boostedSpeed || 0) + amount;
}

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
 * Parse grade (G) from gradeOrStacks for Enhancement Powers.
 * Format is "grade/max" (e.g. "3/5") or just a number.
 * @param {string} gradeOrStacks
 * @returns {number} G (current grade), minimum 1 for active enhancements
 */
function parseGrade(gradeOrStacks) {
  if (!gradeOrStacks) return 1;
  const str = String(gradeOrStacks).trim();
  const slashIdx = str.indexOf("/");
  const num = parseInt(slashIdx >= 0 ? str.substring(0, slashIdx) : str, 10);
  return isNaN(num) || num <= 0 ? 1 : num;
}

/**
 * Apply all automatable Enhancement Power trait bonuses.
 * Only processes active transformations with known EP catalog keys.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyEnhancementPowerBonuses(system, tier, baseTier) {
  const transformations = system.transformations || [];
  const optionSelections = system.transformationOptionSelections || {};
  const level = system.level || 1;

  const result = {
    entries: [],
    hasBonuses: false
  };

  const totals = {
    soak: 0, defense: 0, dr: 0, might: 0,
    strike: 0, dodge: 0, wound: 0, combatRolls: 0,
    lpMax: 0, kpMax: 0, capacityMax: 0,
    perception: 0, intimidation: 0, steadfast: 0,
    stressBonus: 0, allSaves: 0, speed: 0
  };

  for (let i = 0; i < transformations.length; i++) {
    const trans = transformations[i];
    if (!trans.active) continue;

    const key = trans.catalogKey;
    if (!key || !ENHANCEMENT_KEYS.has(key)) continue;

    const G = parseGrade(trans.gradeOrStacks);
    const options = optionSelections[String(i)] || optionSelections[i] || {};
    const entry = { name: trans.name, catalogKey: key, grade: G, bonuses: [], conditionals: [], triggered: [], perRound: [] };

    applyBonusesForKey(key, system, tier, baseTier, G, level, options, entry, totals);

    // Catch-all: pick up any triggered/limited effects from catalog not hardcoded above
    const resolvedEffects = getResolvedTransformationEffects(trans, options);
    const existingTriggerIds = new Set(entry.triggered.map(t => t.id));
    const existingCatalogRefs = new Set(
      entry.triggered
        .filter(t => t._catalogGroup)
        .map(t => `${t._catalogGroup}::${t._catalogLevel || 0}`)
    );
    for (const [idx, eff] of resolvedEffects.entries()) {
      if (!["triggered", "limited"].includes(eff.activationType)) continue;
      const autoId = `${key}_${slugify(eff.groupName)}_${eff.level || 0}_${idx}`;
      if (existingTriggerIds.has(autoId)) continue;
      if (existingCatalogRefs.has(`${eff.groupName}::${eff.level || 0}`)) continue;
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
  system.enhancementPowerBonuses = result;
}

// ============================================================
// Per-key bonus application
// ============================================================

function applyBonusesForKey(key, system, tier, baseTier, G, level, options, entry, totals) {
  switch (key) {

    // ---- CORE ENHANCEMENT POWERS ----

    case "kaioken": {
      // ---- Exponential Power: Cannot regain LP, Graded (5 grades ×2–×20) ----
      entry.bonuses.push("Cannot regain Life Points while active");
      entry.conditionals.push("Graded: 5 grades (×2–×20) with increasing LP cost/round");
      // ---- Surge of Strength ----
      entry.triggered.push({
        id: "kaioken_surge_1", name: "Surge of Strength",
        description: "Attempt a higher grade (auto-fail next Stress Test)",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.conditionals.push("Wound Roll increased by Life Point cost paid");
      // ---- Crimson Acclimation ----
      entry.conditionals.push("Without Perfect Ki Control: +Stress Test, +LP cost");
      entry.triggered.push({
        id: "kaioken_crimson_3", name: "Crimson Acclimation",
        description: "Treat threshold LP loss as opponent damage",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Scarlet Multiplier (Burst Limit) ----
      entry.triggered.push({
        id: "kaioken_scarlet_1", name: "Scarlet Multiplier",
        description: "Power Up as Out-of-Sequence, regain 5× Ki cost",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "super_kaioken": {
      // ---- Multiplied Power: Graded (3 grades ×2/×10/×20), requires Super Saiyan ----
      entry.bonuses.push("Cannot regain Life Points while active");
      entry.conditionals.push("Must be used with Super Saiyan Transformation");
      entry.conditionals.push("Graded: 3 grades (×2/×10/×20)");
      // ---- Power of a Heartbeat ----
      entry.triggered.push({
        id: "super_kaioken_heartbeat_1", name: "Power of a Heartbeat",
        description: "Increase grade as Out-of-Sequence (auto-fail next Stress Test)",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.conditionals.push("Wound Roll increased by Life Point cost paid");
      // ---- Vermilion Explosion (Burst Limit) ----
      entry.triggered.push({
        id: "super_kaioken_vermilion_1", name: "Vermilion Explosion",
        description: "Power Up as Out-of-Sequence, regain 5× Ki cost",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "all_out_kaioken": {
      // ---- Red Power Multiplier: Cannot regain LP, Graded (6 grades ×2–×50) ----
      entry.bonuses.push("Cannot regain Life Points while active");
      entry.conditionals.push("Graded: 6 grades (×2–×50) with increasing LP cost/round");
      entry.conditionals.push("Cannot enter via Surging Strength unless already active");
      // ---- Don't Fail Me Now! ----
      entry.conditionals.push("+1 Stress Bonus per Health Threshold below");
      entry.conditionals.push("Spend LP to auto-succeed Steadfast Check");
      entry.triggered.push({
        id: "all_out_kaioken_dfmn_6", name: "Emergency Grade Upgrade",
        description: "Increase grade as Out-of-Sequence (consequences apply)",
        usageLimit: "Triggered", maxUses: null
      });
      // ---- Crimson Wager (Red Trait, Grade 2+) ----
      entry.conditionals.push("Grade 2+: Extra Dice increase, spend LP for Wound/Clash bonus");
      entry.conditionals.push("Grade 2+: LP regen from Attacking Maneuvers");
      // ---- Cardinal Strike (Red Trait, Grade 4+) ----
      entry.conditionals.push(`Grade 4+: +${tier} Wound, Movement as Instant, Basic Attack after Movement OoS`);
      // ---- Burning Carmine (Red Trait, Grade 6) ----
      entry.conditionals.push("Grade 6: Extra Dice below Injured; KP from LP loss; Power stacking");
      // ---- Deep Ruby (Burst Limit) ----
      entry.triggered.push({
        id: "all_out_kaioken_deep_ruby_1", name: "Deep Ruby",
        description: "Enter 6th Grade; return to previous Grade end of turn",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    // ---- SPEED / AGILITY ENHANCEMENTS ----

    case "agile_style": {
      // ---- Weightless ----
      entry.bonuses.push("Cannot lose Doff Bonus in this Transformation");
      entry.bonuses.push("+1/4 Capacity Rate");
      entry.triggered.push({
        id: "agile_style_weightless_1", name: "Weightless Entry",
        description: "Enter as Out-of-Sequence when doffing Weights",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Free and Fast ----
      entry.triggered.push({
        id: "agile_style_free_1", name: "Free and Fast (Strike/Wound)",
        description: "Increase Strike/Wound Rolls by Doff Bonus",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "agile_style_free_2", name: "Free and Fast (Defense/Soak)",
        description: "Increase Defense/Soak by Doff Bonus",
        usageLimit: "2/Round", maxUses: 2
      });
      // ---- Full of Surprises (Burst Limit) ----
      entry.triggered.push({
        id: "agile_style_surprise_1", name: "Full of Surprises",
        description: "Increase Doff Bonus by ½ until end of next turn",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "lightspeed_mode": {
      // ---- Gear Shift: Graded (2–4 grades) ----
      const initBonus = G * tier;
      system.aptitudes.initiative = (system.aptitudes.initiative || 0) + initBonus;
      entry.bonuses.push(`+${initBonus} Initiative (G×T)`);
      entry.conditionals.push(`Graded: ${G <= 2 ? "2 grades" : G <= 3 ? "3 grades" : "4 grades"} with increasing AMB/damage`);
      // ---- Speed Star ----
      entry.triggered.push({
        id: "lightspeed_star_1", name: "Speed Star (Strike/Dodge)",
        description: "Increase Strike/Dodge on Movement",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.conditionals.push("If not hit since last turn: Wound Roll bonus");
      entry.triggered.push({
        id: "lightspeed_star_3", name: "Speed Star (Wound from Speed)",
        description: "Increase Wound Roll by Boosted Speed difference",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Lightspeed Assault (Burst Limit) ----
      entry.triggered.push({
        id: "lightspeed_assault_1", name: "Lightspeed Assault",
        description: "Damaging movement through opponents",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Super Maximum Lightspeed Mode (Mastery, grades 3-4) ----
      entry.conditionals.push("Mastery: Grades 3 & 4 unlocked with increased Speed bonuses");
      break;
    }

    case "environmental_style": {
      // ---- Chosen Environment ----
      addSpeed(system, tier);
      totals.speed += tier;
      entry.bonuses.push(`+${tier} Boosted Speed (Chosen Environment)`);
      entry.conditionals.push("Out-of-Sequence entry in Favored Environment, auto-exit on leaving");
      entry.conditionals.push("Environment-specific bonus (Sky/Underwater/Space)");
      // ---- Environmental Combat ----
      entry.bonuses.push("+1 Category ToP Extra Dice & Greater Dice");
      entry.conditionals.push("Defense bonus vs Exploit");
      entry.conditionals.push("Movement as Instant Maneuver");
      entry.conditionals.push("Gain Bewildered stacks on movement; spend for Clash/Wound bonus");
      entry.triggered.push({
        id: "env_style_bewildered_wound", name: "Bewildered Wound Boost",
        description: "Spend Bewildered stacks for increased Wound Roll",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Dash through Nature (Unlimited) ----
      entry.triggered.push({
        id: "env_style_dash_1", name: "Dash through Nature",
        description: "Out-of-Sequence Movement without Exploit, gain 5 Bewildered",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "unburdened": {
      // ---- Burden of Training ----
      entry.bonuses.push(`High Speed Aspect level = Grade ${G}`);
      entry.conditionals.push("Increase Doff Bonus by applicable grade");
      entry.conditionals.push("Opponents gain Impediment on Mighty melee hit");
      entry.triggered.push({
        id: "unburdened_burden_4", name: "Burden of Training (OoS Entry)",
        description: "Enter as Out-of-Sequence if Weights are Doffed or Destroyed",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Proof of Effort ----
      entry.conditionals.push(`Strainless level = applicable grade`);
      entry.conditionals.push("Ignore Super Stack penalties (up to applicable grade)");
      entry.conditionals.push("Increase Wound Roll from Super Stack Extra Dice");
      entry.triggered.push({
        id: "unburdened_proof_4", name: "Proof of Effort (Wound Boost)",
        description: "Increase Wound Roll by Doff Bonus on Energy Charge hit",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Round 2 starts now! (Burst Limit) ----
      entry.triggered.push({
        id: "unburdened_round2_1", name: "Round 2 starts now!",
        description: "Enter Enhancement Power as Out-of-Sequence while not transformed",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    // ---- SOAK / DEFENSE / DR ENHANCEMENTS ----

    case "juggernaut": {
      // ---- Unstoppable Force ----
      entry.conditionals.push("Compelled Combat: Strike/Wound bonus");
      entry.conditionals.push("Compelled Combat: increased Might");
      entry.triggered.push({
        id: "juggernaut_force_3", name: "Unstoppable Force (Ki Wager)",
        description: "Increase Ki Wager in Compelled Combat",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.conditionals.push("Gain Compelled Combat condition on Transform/Start of Turn");
      // ---- Immovable Object ----
      entry.bonuses.push("Movement reduced by half");
      entry.triggered.push({
        id: "juggernaut_immov_2", name: "Immovable Object (DR)",
        description: "Gain Damage Reduction on leaving Compelled Combat",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "juggernaut_immov_3", name: "Immovable Object (Soak)",
        description: "Increase Soak when hit",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "juggernaut_immov_4", name: "Immovable Object (Negate)",
        description: "Negate minor damage completely",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Unending Vigor (Burst Limit) ----
      entry.triggered.push({
        id: "juggernaut_vigor_1", name: "Unending Vigor",
        description: "Halve damage taken, gain Wound Roll boost",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "super_powerhouse": {
      // ---- Combat Powerhouse ----
      entry.conditionals.push("Mighty Maneuvers cannot be Clashed against");
      entry.conditionals.push("Punching Down applies to all maneuver types");
      entry.conditionals.push(`Collision damage +Might, +${tier} Wound`);
      entry.triggered.push({
        id: "super_power_combat_4", name: "Combat Powerhouse (Soak)",
        description: "Reduce incoming Physical damage when Slowed",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Pain Train ----
      entry.conditionals.push("Ignore Size-based Defense Value penalty");
      entry.conditionals.push("Knockback/Prone on Mighty wins");
      entry.triggered.push({
        id: "super_power_pain_3", name: "Pain Train (Charge)",
        description: "Movement as Instant + Basic Attack at destination",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "super_power_pain_4", name: "Pain Train (Crush)",
        description: "Crush Prone opponent for bonus Wound damage",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Surprising Speed (Unlimited) ----
      entry.triggered.push({
        id: "super_power_speed_1", name: "Surprising Speed",
        description: "Movement as Out-of-Sequence, gain Slowed",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "powerhouse": {
      // ---- Muscular Proportions: Graded ----
      entry.bonuses.push(`Size: Large+ (Graded, Grade ${G})`);
      entry.conditionals.push("Graded: Grade 1 (Large/FO), Grade 2 (Giant/FO+MA)");
      // ---- Uninhibited Strength ----
      entry.conditionals.push("Collision damage: +Might");
      entry.conditionals.push("Mighty Clash bonus when Compelled");
      entry.triggered.push({
        id: "powerhouse_strength_3", name: "Uninhibited Strength (Basic Attack)",
        description: "Basic Attack as Out-of-Sequence on Mighty Clash win",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Thick Muscle (Burst Limit) ----
      entry.triggered.push({
        id: "powerhouse_thick_1", name: "Thick Muscle",
        description: "Halve incoming damage, gain Wound Roll boost",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "miniature_might": {
      // ---- Float Like a Butterfly ----
      entry.bonuses.push("Size: Nano (reduced Stress Test for Nano)");
      entry.conditionals.push("Cannot be targeted at Long Range");
      entry.conditionals.push("Cannot use Grapple Maneuvers while Nano");
      entry.conditionals.push("Double movement from Speed bonuses");
      entry.triggered.push({
        id: "mini_butterfly_5", name: "Float Like a Butterfly (Dodge)",
        description: "Dodge as Out-of-Sequence after successful dodge",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Sting Like a Bee ----
      entry.conditionals.push("Wound/Strike bonus based on Size difference");
      entry.conditionals.push("Punching Up: bonus Extra Dice vs larger opponents");
      entry.triggered.push({
        id: "mini_sting_3", name: "Sting Like a Bee (Climb)",
        description: "Grapple as Instant after successful melee hit",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Pint-Sized Power (Burst Limit) ----
      entry.triggered.push({
        id: "mini_pint_1", name: "Pint-Sized Power",
        description: "Enter Invisible State, apply Greater Dice to next attack",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "giant_form": {
      // ---- Accelerated Growth: Graded (3 grades) ----
      entry.bonuses.push(`Punching Down Extra Dice +${G} Categories`);
      entry.bonuses.push(`Size increase by Grade (Growth LV ${G})`);
      entry.conditionals.push(`Graded: 3 grades with Growth/AMB progression`);
      // ---- Battlefield Titan ----
      entry.triggered.push({
        id: "giant_titan_1", name: "Battlefield Titan (Punching Down)",
        description: "Bonus Punching Down qualification vs target",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.conditionals.push("Strike/Wound bonus based on targets in melee range");
      // ---- Unyielding Colossus (Burst Limit) ----
      entry.triggered.push({
        id: "giant_colossus_1", name: "Unyielding Colossus",
        description: "Gain Armored Aspect + Wound Roll boost on Transform",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    // ---- WOUND / STRIKE / COMBAT ROLL ENHANCEMENTS ----

    case "compressed_power": {
      // ---- Withdrawn Aura ----
      entry.bonuses.push("Cannot use Aura Maneuver; remove Glowing/Light Dependent");
      entry.bonuses.push("May use an extra Enhancement Power");
      entry.bonuses.push(`-${2 * tier} Ki cost (Attacking Maneuvers)`);
      entry.conditionals.push("Spend Ki to ignore Botch result");
      entry.conditionals.push("Gain Power stack on Critical Strike");
      // ---- Difficult to Contain ----
      entry.conditionals.push("Draining affects LP instead of Ki");
      entry.conditionals.push("Spend LP to increase Natural Result");
      entry.conditionals.push("Critical grants additional Wound bonus");
      entry.triggered.push({
        id: "compressed_contain_4", name: "Power Stressed State",
        description: "Enter Power Stressed State (Burst Limit)",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Deep Breath (Unlimited) ----
      entry.triggered.push({
        id: "compressed_breath_1", name: "Deep Breath",
        description: "Enter Superior State, ignore Draining",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "effortless": {
      // ---- Stamina Battle ----
      entry.bonuses.push(`-${tier} Ki cost (all Maneuvers)`);
      entry.conditionals.push(`Opponents: +${tier} Ki cost on Maneuvers against you`);
      entry.conditionals.push("Reduce defender's Ki when defending against your attacks");
      // ---- Disinterested Combatant ----
      entry.conditionals.push(`Above Bruised: +${tier} Strike/Dodge, -${2 * tier} Wound`);
      entry.conditionals.push(`Below Bruised: +${2 * tier} Wound`);
      entry.conditionals.push("Fatigued/Shaken/Compelled remove above bonuses");
      entry.triggered.push({
        id: "effortless_disinterested_6", name: "Low Effort / Tiresome Fight",
        description: "PKC alone: Low Effort; with Transformation: Surging State entry",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- So Little (Unlimited) ----
      entry.triggered.push({
        id: "effortless_so_little_1", name: "So Little",
        description: "Basic Attack + Called Shot as Out-of-Sequence, apply Impediment",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "no_ego_zone": {
      // ---- Perfected Self ----
      entry.bonuses.push("Ki-dependent AMB/Energy Charge/Power Up effects");
      entry.triggered.push({
        id: "no_ego_perfected_2", name: "Perfected Self (Option)",
        description: "Select Advantage/Last Resort/Experienced Fighter effect",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Supreme Mortal Ki ----
      entry.bonuses.push(`-${2 * tier} Ki cost (all Maneuvers)`);
      entry.conditionals.push("Earthling Resolve multiplier enhanced");
      entry.conditionals.push("Power Surge access");
      // ---- Serene Heart ----
      entry.conditionals.push("Enter Mindful State with Ki threshold");
      entry.triggered.push({
        id: "no_ego_serene_2", name: "Serene Heart (Surging)",
        description: "Enter Surging State as alternative",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Raging Fist (Burst Limit) ----
      entry.triggered.push({
        id: "no_ego_raging_1", name: "Raging Fist",
        description: "Trigger Serene Heart effect",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Mind over Matter (Mastery) ----
      entry.conditionals.push("Mastery: Power stack increase, Critical extra dice, Ki regain");
      entry.conditionals.push("Mastery: Energy Charge and Counter Action access");
      break;
    }

    case "relaxed_warrior": {
      // ---- Constant 100% ----
      entry.bonuses.push(`-${tier} Ki cost (all Maneuvers)`);
      entry.conditionals.push("Ignore Stress Test bonuses from Mastered Transformations");
      entry.conditionals.push("Treat all Transformations as if Mastered for Ki costs");
      entry.conditionals.push("Power Improvement: Surpass always active");
      entry.conditionals.push(`1/Round: Reduce opponent's Combat Roll by ${tier}`);
      // ---- Absolute Ki Control ----
      entry.conditionals.push("Perfect Ki Control enhanced: Ki recovery bonuses");
      entry.conditionals.push("Auto-succeed Steadfast Checks");
      entry.triggered.push({
        id: "relaxed_absolute_3", name: "Absolute Ki Control",
        description: "Regain Ki equal to opponent's wasted Ki on miss",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Nothing Wasted (Burst Limit) ----
      entry.triggered.push({
        id: "relaxed_nothing_1", name: "Nothing Wasted",
        description: "Reduce all Ki costs to 0 for 1 round",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "nimbus_pro": {
      // ---- Weapon Pro ----
      totals.strike += tier;
      entry.bonuses.push(`+${tier} Strike (Armed Attacks with Nimbus)`);
      entry.bonuses.push("Access: Cloud Travel, Flurry Combo, High-Stakes Attack");
      entry.conditionals.push("Signature Technique options with Nimbus weapon");
      entry.triggered.push({
        id: "nimbus_weapon_4", name: "Nimbus Weapon Redirect",
        description: "Redirect weapon damage to Nimbus instead of self",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Cloud Combat ----
      entry.conditionals.push("Movement-based Combat Roll boost");
      entry.conditionals.push("Ki Wager bonus during cloud movement");
      entry.conditionals.push("Exit condition on taking damage");
      // ---- Pure of Heart Driveby (Burst Limit) ----
      entry.triggered.push({
        id: "nimbus_driveby_1", name: "Pure of Heart Driveby",
        description: "Damaging movement through opponents",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "shining_sword": {
      // ---- Disciple of the Blade ----
      entry.conditionals.push(`Armed: +${tier} Wound, ignore ${tier} DR`);
      entry.conditionals.push("Weapon Specialist: treat weapon as Unbreakable");
      entry.conditionals.push("Reduce Critical Target by 1 with Armed Attacks");
      entry.triggered.push({
        id: "shining_blade_4", name: "Disciple of the Blade (Counter)",
        description: "Parry as Out-of-Sequence after successful armed dodge",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Miracle Bladework ----
      entry.conditionals.push("Critical armed attack: apply Superiority");
      entry.triggered.push({
        id: "shining_miracle_2", name: "Miracle Bladework (Extra Attack)",
        description: "Additional armed Basic Attack as Out-of-Sequence",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- No Quarter (Burst Limit) ----
      entry.triggered.push({
        id: "shining_noquarter_1", name: "No Quarter",
        description: "Triple armed attack with escalating Wound bonuses",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Master of War (Mastery) ----
      entry.conditionals.push(`Mastery: +${tier} AMB(IN), enhanced armed combat options`);
      break;
    }

    case "ocular_awakening": {
      // ---- Evolved Left Eye ----
      entry.bonuses.push("+1 Strike Natural Result");
      entry.bonuses.push("+1 Wound Natural Result");
      entry.conditionals.push("Studied targets: additional +1 Natural Results (Strike/Wound)");
      entry.conditionals.push("Sniper's Art enhanced: additional Perception bonus");
      // ---- Dangerous Exploitation ----
      entry.conditionals.push("Apply Advantage to attacks vs Studied targets");
      entry.triggered.push({
        id: "ocular_exploit_2", name: "Dangerous Exploitation (Counter)",
        description: "Counter Attack as Out-of-Sequence vs Studied target",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- One Shot Kill ----
      entry.triggered.push({
        id: "ocular_oneshot_1", name: "One Shot Kill",
        description: "Maximize Wound Roll against Studied target (next attack only)",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- World in Red (Burst Limit) ----
      entry.triggered.push({
        id: "ocular_world_1", name: "World in Red",
        description: "All targets become Studied, enhanced Natural Results for 1 round",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Pressure Point Sniper (Mastery) ----
      entry.conditionals.push("Mastery: Enhanced condition application vs Studied targets");
      break;
    }

    case "burst_attack": {
      // ---- High-Stake Gamble ----
      entry.bonuses.push("Auto Burst Limit on entry; Fatigued on exit");
      entry.bonuses.push("Ignore all Health Threshold penalties");
      entry.conditionals.push("Wound bonus per Health Threshold difference vs opponent");
      // ---- Unleash it All ----
      entry.conditionals.push("Signature Techniques gain Wound bonus and All or Nothing");
      entry.triggered.push({
        id: "burst_unleash_2", name: "Exceed Ki Wager",
        description: "Exceed maximum Ki Wager on Signature Technique",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Power Eruption (Unlimited) ----
      entry.triggered.push({
        id: "burst_eruption_1", name: "Power Eruption",
        description: "Enter Superior/Surging States simultaneously",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "crusher_form": {
      // ---- Bestial Vengeance: Graded (4 grades) ----
      entry.bonuses.push(`Crusher Points: max ${G + 2}`);
      entry.conditionals.push("Direct Hit without Counter Action on larger targets");
      entry.conditionals.push("Reduce incoming Damage → gain Crusher Points");
      entry.conditionals.push(`Graded: 4 grades with Growth Aspect (current Grade ${G})`);
      // ---- Vengeful Kaiju ----
      entry.conditionals.push(`+${tier} Wound vs smaller opponents per Crusher Point`);
      entry.conditionals.push("Damage reduction vs smaller opponents per Crusher Point");
      entry.conditionals.push("Bestial Trait bonuses: passives per Bestial Trait possessed");
      // ---- Warrior the Crusher (Unlimited) ----
      entry.triggered.push({
        id: "crusher_warrior_1", name: "Warrior the Crusher",
        description: "Gain 2 Crusher Points, treat opponents as 2 sizes smaller",
        usageLimit: "Unlimited", maxUses: 1
      });
      // ---- Dangerous Crusher (Mastery) ----
      entry.conditionals.push("Mastery: Armored, bonuses at 3+/6+ Points, auto-upgrade Grade");
      break;
    }

    case "performer": {
      // ---- Rhythm Planet ----
      entry.bonuses.push("Rhythm system: gain Rhythm stacks via Performance");
      entry.conditionals.push("Per Rhythm stack: increased Combat Roll bonus");
      entry.conditionals.push("Lose Rhythm on failed Dodge or taking damage");
      entry.triggered.push({
        id: "performer_rhythm_4", name: "Rhythm Gain",
        description: "Gain Rhythm stack on successful Performance check",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Moves like Ginyu ----
      entry.conditionals.push(`+${tier} Strike/Dodge per Rhythm stack`);
      entry.conditionals.push("Movement bonuses per Rhythm stack");
      entry.triggered.push({
        id: "performer_moves_3", name: "Dramatic Finish",
        description: "Spend all Rhythm for massive Wound bonus",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Just Perform ----
      entry.triggered.push({
        id: "performer_just_1", name: "Just Perform",
        description: "Performance as Out-of-Sequence, allies gain benefits",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Power Up Funk (Burst Limit) ----
      entry.triggered.push({
        id: "performer_funk_1", name: "Power Up Funk",
        description: "Maximize Rhythm stacks, gain Power stack",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "doping": {
      // ---- Enhanced Physique ----
      entry.bonuses.push("+5 Stress Test when combined with other Transformations");
      entry.conditionals.push("Enter Superior State on Transform");
      entry.conditionals.push("Fatigued on exit");
      entry.conditionals.push("Knockback/Prone on Might Clash win");
      // ---- Aggressive Mentality ----
      entry.conditionals.push(`+${2 * tier} Wound vs Prone targets`);
      entry.triggered.push({
        id: "doping_aggro_2", name: "Charging Assault",
        description: "Basic Attack gains Charging Assault on Might win",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Supercharged Muscles (Unlimited) ----
      entry.triggered.push({
        id: "doping_muscles_1", name: "Supercharged Muscles",
        description: "Gain Super Stack without penalties",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    // ---- STATE-DEPENDENT ENHANCEMENTS ----

    case "boiling_rage": {
      // ---- Unnerving Demeanor / Unending Beatdown ----
      entry.conditionals.push("Allow Surging State");
      entry.conditionals.push("Increase Damage Category in Fog Weather (gain Fatigued)");
      // ---- Unfeeling Blob / Unstoppable Anger ----
      entry.bonuses.push("Ignore Health Threshold penalties on Wound Rolls");
      entry.conditionals.push("Defense/Soak bonus while Fatigued");
      entry.triggered.push({
        id: "boiling_unfeel_3", name: "Unfeeling Blob (Extra Dice)",
        description: "Apply Extra Dice to Wound Roll",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Unchained Wrath (Unlimited) ----
      entry.triggered.push({
        id: "boiling_unchained_1", name: "Unchained Wrath",
        description: "Use Signature Technique as Out-of-Sequence",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "enraged": {
      // ---- Unchecked Fury ----
      entry.bonuses.push("Auto-enter Raging State on Transform");
      entry.conditionals.push("Enter Furious State (gain Slowed on exit)");
      // ---- Unending Beatdown ----
      entry.conditionals.push("On Power: choose Extra Dice, Surging State, or ignore Conditions");
      entry.conditionals.push("Auto-gain Slowed after using Power benefit");
      // ---- Unstoppable Anger ----
      entry.bonuses.push("Ignore Health Threshold penalties on Strike Rolls");
      entry.conditionals.push(`While Slowed: +${tier} Soak and +${tier} Wound`);
      entry.triggered.push({
        id: "enraged_unstop_3", name: "Undying State",
        description: "Enter Undying State on defeat (avoid being defeated)",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Unchained Wrath (Unlimited) ----
      entry.triggered.push({
        id: "enraged_unchained_1", name: "Unchained Wrath",
        description: "Cannot gain Slowed; treat as if suffering from it for bonuses",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "mushin": {
      // ---- Unfettered Clarity ----
      entry.bonuses.push("Auto-enter Mindful State on Transform");
      entry.triggered.push({
        id: "mushin_clarity_2", name: "Instinctual State",
        description: "Enter Instinctual State (gain Slowed penalty)",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Unmatched Grace ----
      entry.triggered.push({
        id: "mushin_grace_1", name: "Unmatched Grace (Superior)",
        description: "Enter Superior State for Counter Action cost",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.conditionals.push("Auto-gain Slowed Condition");
      // ---- Untouched Calm ----
      entry.bonuses.push("Ignore Health Threshold penalties on Dodge Rolls");
      entry.conditionals.push(`While Slowed: +${tier} Soak`);
      entry.conditionals.push("Reactive Defend boost when targeted");
      // ---- Undeterred Warrior (Burst Limit) ----
      entry.triggered.push({
        id: "mushin_undeterred_1", name: "Undeterred Warrior",
        description: "Prevent Slowed while benefiting from Slowed effects",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "breaking_point": {
      // ---- Power for a Price ----
      entry.conditionals.push(`Per Health Threshold below: +${tier} Wound Rolls`);
      entry.conditionals.push("Convert LP to Ki Points");
      entry.conditionals.push("Spend Ki to reduce opponent Defense/Soak");
      // ---- High Risk ----
      entry.conditionals.push("Broken Condition doesn't count as Combat Condition");
      entry.conditionals.push("Gain Power stack at each threshold");
      entry.conditionals.push("Gain Broken stacks for Energy Charges");
      entry.triggered.push({
        id: "breaking_risk_4", name: "High Risk (Burst Limit)",
        description: "Apply Broken effects to threshold damage",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- High Reward (Unlimited) ----
      entry.triggered.push({
        id: "breaking_reward_1", name: "High Reward",
        description: "Gain Broken stack with Energy Charges on all attacks",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "seething_fury": {
      // ---- That Actually Hurt! ----
      entry.conditionals.push("Auto-enter Raging State");
      entry.conditionals.push(`Per Health Threshold below: +${tier} Strike or Wound`);
      entry.conditionals.push("Raging: ignore Guard Down penalty from Raging");
      entry.triggered.push({
        id: "seething_hurt_4", name: "That Actually Hurt! (Counter)",
        description: "Counter Attack as Out-of-Sequence when damaged",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- You Must Die by My Hand! ----
      entry.conditionals.push("Select target: bonus Strike/Wound against them");
      entry.conditionals.push("Cannot target anyone else with Attacking Maneuvers");
      entry.triggered.push({
        id: "seething_die_3", name: "You Must Die! (Charge)",
        description: "Movement toward target as Instant, Basic Attack on arrival",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Start Begging! (Burst Limit) ----
      entry.triggered.push({
        id: "seething_beg_1", name: "Start Begging for your Life!",
        description: "Double all threshold bonuses for 1 round",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "overdrive": {
      // ---- Overclock ----
      entry.conditionals.push(`Per Health Threshold below: +${baseTier} Combat Rolls`);
      entry.conditionals.push("Cannot regain Life Points while active");
      entry.conditionals.push("Gain Energy Charge per threshold below");
      entry.triggered.push({
        id: "overdrive_overclock_4", name: "Overclock (Self-Destruct Warning)",
        description: "Below Critical: begin countdown to self-destruct",
        usageLimit: "Triggered", maxUses: null
      });
      // ---- Over Productive ----
      entry.conditionals.push("Surging: increased Energy Charges per round");
      entry.conditionals.push("Ignore Impediment and Slowed conditions");
      entry.triggered.push({
        id: "overdrive_productive_3", name: "Over Productive (Ki Regen)",
        description: "Regain Ki on successful Strike Roll",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Full Power Engine ----
      entry.triggered.push({
        id: "overdrive_fullpower_1", name: "Full Power Engine",
        description: "Gain Surging State and additional Energy Charge",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- O-O-Overdrive (Unlimited) ----
      entry.triggered.push({
        id: "overdrive_unlimited_1", name: "O-O-Overdrive",
        description: "Self-Destruct as empowered attack (remove from combat)",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "future_hero": {
      // ---- Weapon of Justice ----
      entry.bonuses.push("Design Heroic Weapon: 3 Qualities + Justice Edge");
      entry.conditionals.push("Combat Roll Dice Score bonus with Heroic Weapon");
      entry.conditionals.push("Energy Charge boosts Wound Roll with Heroic Weapon");
      entry.triggered.push({
        id: "future_weapon_3", name: "Weapon of Justice (Energy Charge OoS)",
        description: "Energy Charge as Out-of-Sequence",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Fists of Justice (unarmed alternative) ----
      entry.conditionals.push("Without weapon: Strike/Dodge/Wound bonuses");
      entry.triggered.push({
        id: "future_fists_2", name: "Fists of Justice (Wound)",
        description: "Signature Technique Wound bonus (unarmed)",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- End Justifies the Means ----
      entry.conditionals.push("Justice Charges: gain on Transform/Start of Turn (max based on grade)");
      entry.conditionals.push("Stress Test and AMB bonuses per Justice Charge");
      entry.conditionals.push(`Damage Reduction: ${tier} per Justice Charge`);
      entry.triggered.push({
        id: "future_end_5", name: "Spend Justice Charges (Energy Charges)",
        description: "Spend Justice Charges for Energy Charges",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "future_end_6", name: "Hype after Defeat",
        description: "Hype as Out-of-Sequence after defeating opponent",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Battle Uniform ----
      entry.conditionals.push("Battle Uniform: Armor with Flow/Helmet accessories");
      entry.conditionals.push("Ki regain per Justice Charge; Apparel bonuses per threshold");
      // ---- Hero with No Name (Burst Limit) ----
      entry.triggered.push({
        id: "future_hero_noname_1", name: "Hero with No Name",
        description: "Gain 3 Justice Charges + Energy Charge boost on Transform",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Dead or Alive (Mastery) ----
      entry.conditionals.push("Mastery: Max 5 Justice Charges, Combat Roll boost per threshold");
      entry.triggered.push({
        id: "future_hero_dead_4", name: "Dead or Alive (Avoid Defeat)",
        description: "Spend Justice Charges to avoid defeat",
        usageLimit: "Triggered", maxUses: null
      });
      break;
    }

    // ---- SAIYAN-LINE ENHANCEMENTS ----

    case "super_saiyan_power": {
      // ---- Developing S-Cells ----
      entry.conditionals.push("Must be used with Super Saiyan Transformation");
      entry.conditionals.push("Extra Dice to Strike/Wound in Super Saiyan");
      entry.conditionals.push(`Raging: +${tier} Strike & Wound (Flare High)`);
      entry.conditionals.push("Super Saiyan Transformation treated as 1 Stage higher");
      entry.conditionals.push("Gain Battle Born stack on entering Raging State");
      entry.triggered.push({
        id: "ssp_scells_6", name: "S-Cell Surge (Energy Charge)",
        description: "Free Energy Charge after Critical Strike in Super Saiyan",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Flare High ----
      entry.conditionals.push("Raging State grants golden aura combat bonuses");
      // ---- Golden Surge (Burst Limit) ----
      entry.triggered.push({
        id: "ssp_golden_1", name: "Golden Surge",
        description: "Enter Surging State, gain Power stack and Battle Born stack",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "saiyan_pride": {
      // ---- Saiya Power ----
      entry.conditionals.push("Per Combat Round: growing Combat Roll bonuses");
      entry.conditionals.push("Battle Born stacks grant additional benefits");
      entry.conditionals.push(`Raging: +${tier} Strike & Wound`);
      // ---- Furious Heart ----
      entry.conditionals.push("Cannot be forced out of Raging State");
      entry.triggered.push({
        id: "saiyan_pride_furious_2", name: "Furious Heart (Raging)",
        description: "Enter Raging State on taking threshold damage",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Pride on the Line (Burst Limit) ----
      entry.triggered.push({
        id: "saiyan_pride_line_1", name: "Pride on the Line",
        description: "Gain Raging + Superior States, +Battle Born stack",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "evil_saiyan": {
      // ---- Dark Saiya Power (Villainous Form) ----
      entry.conditionals.push("Used with Saiyan Transformation: Extra Dice by G categories");
      entry.conditionals.push(`Graded: 2 grades with Evil Points (max ${10 * baseTier})`);
      // ---- Corrupting Aura ----
      entry.conditionals.push("Grade 2: enhanced Evil Point bonuses");
      entry.conditionals.push("Stress reduction with Power Improvement: Surpass");
      entry.conditionals.push("Cannot use Grade 2 with Legendary Transformation");
      entry.triggered.push({
        id: "evil_saiyan_corrupt_5", name: "Corrupting Aura",
        description: "Corrupting effect vs other Saiyans in melee range",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Aura Expansion (Evil Techniques) ----
      entry.conditionals.push("Create/coat aura tail for combat");
      entry.conditionals.push("Spend Evil Points for Ki Extension/Size bonus");
      // ---- Peak Evil Saiyan (Mastery) ----
      entry.conditionals.push("Mastery: Exceed Evil Point max, double Wound/DR from Evil Points");
      entry.conditionals.push("Mastery: Use additional Enhancement Power, regain LP from Surges");
      break;
    }

    case "wrathful": {
      // ---- Compressed Oozaru: Graded (2 grades) ----
      entry.bonuses.push(`Punching Down: +${G} Size Categories`);
      entry.conditionals.push(`Graded: 2 grades (current ${G}), Raging/Rampaging/High Speed LV G`);
      entry.conditionals.push("Cannot use with Great Ape Transformation Line");
      // ---- Empowering Fury ----
      entry.conditionals.push(`Below Injured: +${G} ToP Extra Dice Categories`);
      entry.conditionals.push(`While Compelled: +${2 * tier} Wound`);
      entry.conditionals.push("Battle Born stacks grant additional size bonuses");
      // ---- Bestial Berserker ----
      entry.conditionals.push("Feral State grants enhanced Physical attacks");
      entry.conditionals.push("Cannot use Signature Techniques while Feral");
      // ---- Saiyan Ferocity (Burst Limit) ----
      entry.triggered.push({
        id: "wrathful_ferocity_1", name: "Saiyan Ferocity",
        description: "Enter Feral State with doubled combat bonuses",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "controlled_wrathful": {
      // ---- Oozaru Power ----
      entry.bonuses.push(`Size Category: Gigantic`);
      entry.conditionals.push("Cannot use with Great Ape Transformation Line");
      entry.conditionals.push(`TE bonus in Core Transformation: +${tier}`);
      entry.conditionals.push("Battle Born stack bonuses enhanced");
      // ---- Contained Fury ----
      entry.conditionals.push("Out-of-Sequence entry with Core Transformation");
      entry.conditionals.push("Enter Mindful State on Transform");
      entry.conditionals.push(`Mindful: Ki cost reduction, +${tier} AG, Battle Born Ki regen`);
      entry.conditionals.push(`Raging: +${2 * tier} Wound, +${tier} FO/MA, Broken condition`);
      entry.triggered.push({
        id: "controlled_fury_raging", name: "Contained Fury (Raging Trigger)",
        description: "Enter Raging State (triggered by damage/threshold)",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "controlled_fury_burst", name: "Super Signature Upgrade",
        description: "Upgrade Signature Technique to Super Signature in Raging",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Saiyan Focus (Unlimited) ----
      entry.triggered.push({
        id: "controlled_focus_1", name: "Saiyan Focus",
        description: "Power Up as Out-of-Sequence, enter Raging State",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "great_wrathful": {
      // ---- Ferocity of the Great Ape ----
      entry.bonuses.push("Enter Feral and Raging States on Transform");
      entry.conditionals.push("Cannot enter another Enhancement Power in Feral State");
      entry.conditionals.push("Ignore 1 Super Stack penalty");
      entry.conditionals.push("Apply Greater Dice to Wound on Critical Strike");
      entry.triggered.push({
        id: "great_wrathful_sig", name: "Signature in Feral State",
        description: "Use Signature Technique while in Feral State",
        usageLimit: "3/Encounter", maxUses: 3
      });
      // ---- Human-sized Great Ape ----
      entry.bonuses.push("Punching Down: treated as Enormous/Gigantic (+2 categories)");
      entry.conditionals.push("Apply Punching Down in Superior State");
      // ---- Berserker's Ki ----
      const kpAdd = Math.floor(system.kiPool.max / 4);
      const capAdd = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpAdd;
      system.capacity.max += capAdd;
      totals.kpMax += kpAdd;
      totals.capacityMax += capAdd;
      entry.bonuses.push(`+${kpAdd} Max KP (+1/4)`);
      entry.bonuses.push(`+${capAdd} Max Capacity (+1/4)`);
      entry.conditionals.push("Apply Tier Extra Dice additional time in Full Power");
      entry.conditionals.push("Mandatory AoE Basic Attack on Start of Turn");
      entry.triggered.push({
        id: "great_wrathful_explode", name: "Self-Explosion",
        description: "Self-Explosion with Punching Down on defeat",
        usageLimit: "Triggered", maxUses: null
      });
      // ---- Mastery: Caging the Beast ----
      entry.conditionals.push("Mastery: Lose Rampaging, gain Armored in Full Power");
      entry.conditionals.push("Mastery: Superior State instead of Feral on Transform");
      break;
    }

    // ---- COPY EYE LINE ----

    case "copy_eye": {
      // ---- Revolving Gaze: Graded (3 grades) ----
      entry.bonuses.push(`+${G} ToP Extra Dice Categories (Revolving Gaze)`);
      entry.conditionals.push(`Graded: 3 grades based on Depth of Emotion stacks`);
      entry.conditionals.push(`Superior: +${tier} FO/MA bonus`);
      entry.conditionals.push("Gain Revolving Eye stacks; Power of Emotion choice effects");
      // ---- Eye of Insight ----
      entry.bonuses.push("Cannot gain Oblivious from Invisible/Limited Sight");
      entry.bonuses.push("+1d4 Perception Dice Score");
      entry.conditionals.push("Spend Revolving Eye to identify Ki signatures");
      entry.conditionals.push("Copy Signature Techniques/Unique Abilities from studied targets");
      // ---- Eye of Hypnotism ----
      entry.conditionals.push("Defense not reduced in Illusion State");
      entry.conditionals.push("Cannot gain Oblivious from Illusion");
      entry.triggered.push({
        id: "copy_eye_hypno_3", name: "Eye of Hypnotism",
        description: "Spend Revolving Eye for mind control effects (multiple options)",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Gaze Revolution (Unlimited) ----
      entry.triggered.push({
        id: "copy_eye_revolution_1", name: "Gaze Revolution",
        description: "Double Revolving Eye gain; may enter Superior State",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "kaleidoscope_eye": {
      // ---- Ascended Copy Eye (Revolving Gaze) ----
      entry.bonuses.push("Apply ToP Extra Dice additional time");
      entry.conditionals.push("Heavenly Eye resource management");
      entry.conditionals.push("Ocular Deterioration mechanic on overuse");
      // ---- Gaze Trait Selection (Eyes that Reveal the Truth) ----
      entry.conditionals.push("Select Gaze Trait: Black Flame / Illusionary / Spatial / Telekinetic / Gravitational / Warrior's");
      // ---- Black Flame Gaze ----
      entry.conditionals.push("Black Flame: Aflame/Ignited mechanics with damage over time");
      // ---- Illusionary Gaze ----
      entry.conditionals.push("Illusionary: Hypnotic effects and mind control");
      // ---- Spatial Gaze ----
      entry.conditionals.push("Spatial: Eye Dimension teleportation and redirection");
      // ---- Telekinetic Gaze ----
      entry.conditionals.push("Telekinetic: Marked weapon/feature manipulation");
      // ---- Gravitational Gaze ----
      entry.conditionals.push("Gravitational: Black Sun gravity effects");
      // ---- Warrior's Gaze ----
      entry.conditionals.push("Warrior's: Superior State combat bonuses");
      break;
    }

    case "transplanted_copy_eye": {
      // ---- Stolen Gaze (Revolving Gaze) ----
      entry.bonuses.push("Apply ToP Extra Dice additional time");
      entry.conditionals.push("Transplanted eye: enhanced Revolving Eye gain");
      entry.conditionals.push("Quick Learner integration: Copy abilities faster");
      entry.conditionals.push("Ocular Deterioration: accelerated drain mechanic");
      // ---- Eye Reveal ----
      entry.triggered.push({
        id: "transplant_reveal_1", name: "Eye Reveal",
        description: "Reveal transplanted eye for enhanced effects",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Awoken Kaleidoscope ----
      entry.conditionals.push("Access Kaleidoscope Gaze Traits through transplanted eye");
      entry.conditionals.push("Enhanced Gaze Trait effects with increased Ocular Deterioration cost");
      break;
    }

    // ---- ULTRA INSTINCT / EGO LINE ----

    case "embers_of_ultra_instinct": {
      // ---- Early Signs of Ultra Instinct ----
      entry.bonuses.push("Enter Mindful State on Transform");
      entry.bonuses.push("Select 1 God Maneuver");
      totals.steadfast += 2;
      entry.bonuses.push("+2 Steadfast Dice Score");
      entry.conditionals.push("Double Mindful Critical Target reduction");
      entry.conditionals.push("No Exploit triggering above threshold");
      entry.triggered.push({
        id: "embers_signs_3", name: "Critical Dodge Entry",
        description: "Enter as Out-of-Sequence on Critical Dodge",
        usageLimit: "1/Encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "embers_signs_8", name: "Counter Attack (Critical Dodge/Parry)",
        description: "Basic Attack as Out-of-Sequence after Critical Dodge/Parry",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- The Sparks of Divinity ----
      entry.conditionals.push("Gain Embers resource on Critical hits");
      entry.conditionals.push("Extra Dice increase per 2 Embers (+Stress Test)");
      entry.conditionals.push("Regain Divine Ki on Ember gain");
      entry.conditionals.push("Spend Embers: Energy Charges, auto-win Grapple, resist Conditions");
      entry.triggered.push({
        id: "embers_sparks_7", name: "Instinctual State",
        description: "Spend 6 Embers to enter Instinctual State",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- An Overflowing Heat (Unlimited) ----
      entry.triggered.push({
        id: "embers_heat_1", name: "An Overflowing Heat",
        description: "Auto-Critical on all Combat Rolls (Attacking Maneuvers) until next turn",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "autonomous_ultra_instinct": {
      // ---- Angelic Technique ----
      entry.bonuses.push("Reduce Stress Test for this Transformation");
      entry.bonuses.push("Set Natural Result to 6 on Dodge Rolls");
      entry.bonuses.push("Maximize Extra Dice on Dodge Rolls");
      entry.conditionals.push("Critical Strike on Natural 6+ Strike");
      entry.triggered.push({
        id: "aui_angelic_5", name: "Angelic Counter Attack",
        description: "Out-of-Sequence Basic Attack after successful dodge",
        usageLimit: "1/Round", maxUses: 1,
        _catalogGroup: "Angelic Technique", _catalogLevel: 5
      });
      entry.bonuses.push("Gain Counter Actions");
      // ---- In the Realm of Angels ----
      entry.bonuses.push("+2 Categories ToP Extra Dice (Strike/Dodge)");
      entry.conditionals.push("No Exploit triggering above Health Threshold");
      entry.conditionals.push("Divine Ki scaling: penalties increase per tier below max");
      // ---- Angelic Trumpets (Burst Limit) ----
      entry.triggered.push({
        id: "aui_trumpets_1", name: "Angelic Trumpets",
        description: "Enter Mindful/Instinctual States simultaneously",
        usageLimit: "Burst Limit", maxUses: 1,
        _catalogGroup: "Angelic Trumpets", _catalogLevel: 1
      });
      break;
    }

    case "power_of_destruction": {
      // ---- Destroyer's Technique ----
      entry.bonuses.push("+2 Categories ToP Extra Dice (Strike/Wound)");
      entry.conditionals.push("Hakai effect: destroy defeated opponents completely");
      entry.conditionals.push("Reduce opponent's Damage Reduction by destruction");
      entry.conditionals.push("Energy Charge gains Hakai property");
      entry.triggered.push({
        id: "pod_destroyer_5", name: "Destroyer's Strike",
        description: "Apply Hakai to next Attacking Maneuver (bonus Wound)",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- In the Realm of Destroyers ----
      entry.conditionals.push("No Exploit triggering above Health Threshold");
      entry.conditionals.push("Divine Ki scaling: penalties increase per tier below max");
      // ---- Destructive Cacophony (Burst Limit) ----
      entry.triggered.push({
        id: "pod_cacophony_1", name: "Destructive Cacophony",
        description: "Enter Raging State, Hakai all attacks this round",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    // ---- GOD KI / DIVINE ENHANCEMENTS ----

    case "god_aura": {
      // ---- Godly Warrior ----
      entry.bonuses.push("Gain selected God Maneuver");
      entry.conditionals.push("AMB bonus when used without Core Transformation");
      entry.conditionals.push("Spend Divine Ki each turn or exit Transformation");
      entry.conditionals.push("Regain Divine Ki on Health Threshold damage");
      entry.triggered.push({
        id: "god_aura_warrior_5", name: "Godly Warrior (Superior)",
        description: "Enter Superior State for Divine Ki cost",
        usageLimit: "Triggered", maxUses: null
      });
      // ---- Divine Assault ----
      entry.conditionals.push("Wound boost from Divine Ki wager");
      entry.triggered.push({
        id: "god_aura_assault_2", name: "Divine Assault (Ki Regain)",
        description: "Regain Divine Ki on missed attack",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "god_aura_assault_3", name: "Divine Assault (Energy Charges)",
        description: "Energy Charges on Signature Technique",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Godly Confidence (Burst Limit) ----
      entry.triggered.push({
        id: "god_aura_confidence_1", name: "Godly Confidence",
        description: "Ignore God Ki State vs non-God Ki opponent",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Divine Cycle (Mastery/Exceed) ----
      entry.conditionals.push("Mastery: Access all God Maneuvers");
      entry.conditionals.push("Mastery: Regain Ki from Divine Ki spending; Wound boost");
      break;
    }

    case "divine_halo": {
      // ---- Circle of Light ----
      entry.conditionals.push("Additional targets/AoE placements with Signature Maneuver");
      entry.conditionals.push("Energy Charge or Out-of-Sequence Signature Technique option");
      entry.conditionals.push("Unique Ability: additional targets or Advancements or Action reduction");
      // ---- Holy Light (Burst Limit) ----
      entry.triggered.push({
        id: "divine_halo_holy_1", name: "Holy Light",
        description: "AoE Extra Dice damage + Might, affects sphere of allies/opponents",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Brilliant Light (Unlimited) ----
      entry.triggered.push({
        id: "divine_halo_brilliant_1", name: "Brilliant Light",
        description: "Use Energy Charge Maneuver twice as Out-of-Sequence",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    // ---- DRAGON FORCE / SAGE ----

    case "dragon_force": {
      // ---- Draconization ----
      entry.bonuses.push("Select Bestial Trait on Transform");
      entry.conditionals.push("Scaling stress increase per tier");
      entry.bonuses.push("Cannot gain Fatigued while active");
      entry.conditionals.push("Free 6th element use of Dragon Trait");
      entry.conditionals.push("Dragon Trained/Implanted/Consumer choice effects");
      // ---- Epitome of Dragons ----
      entry.conditionals.push("Cannot enter except via Legendary Transform");
      entry.conditionals.push("Gain Draconic Force stacks; spend for various effects");
      entry.conditionals.push("Effects: 6th element use, Energy Charges, Clash wins, DR, Movement");
      entry.conditionals.push("Auto-exit at 0 Draconic Force stacks");
      // ---- Roar of the Dragon ----
      entry.bonuses.push("Apply ToP Extra Dice additional time");
      const kpDF = Math.floor(system.kiPool.max / 4);
      const capDF = Math.floor(system.capacity.max / 4);
      system.kiPool.max += kpDF;
      system.capacity.max += capDF;
      totals.kpMax += kpDF;
      totals.capacityMax += capDF;
      entry.bonuses.push(`+${kpDF} Max KP (+1/4)`);
      entry.bonuses.push(`+${capDF} Max Capacity (+1/4)`);
      entry.conditionals.push("Gain Draconic Force on 7th element trigger");
      entry.triggered.push({
        id: "dragon_force_roar_4", name: "Dragon's Roar",
        description: "Bonus Wound Roll by spent Draconic Force stacks",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Mastery: Mastery of Dragon Embodiment ----
      entry.conditionals.push("Mastery: Draconic Force from Empower, IN bonus, Extra Scaling");
      // ---- Legendary: The Final Dragon Form ----
      entry.conditionals.push("Legendary: Ki exceeding, conditional entry, Miracle Empowerment");
      break;
    }

    case "sage_power": {
      // ---- Nature's Power ----
      entry.bonuses.push("Enter Mindful State on Transform");
      entry.bonuses.push(`+${G} ToP Extra Dice Categories`);
      entry.conditionals.push("Nature Energy resource: gain per round, spend for effects");
      entry.conditionals.push("Petrification risk on overuse of Nature Energy");
      entry.conditionals.push("Enhanced Ki sensing in Sage Mode");
      // ---- Manner of Sage ----
      const spOpts = _findAllOptionValues(options);
      for (const opt of spOpts) {
        const o = opt.toLowerCase();
        if (o.includes("bestial sage")) {
          system.aptitudes.sagePowerBestialSageActive = true;
        } else if (o.includes("perfect sage")) {
          system.aptitudes.sagePowerPerfectSageActive = true;
          if (system.attributes.fo) {
            system.attributes.fo.modifier += tier;
            system.attributes.fo.totalScore = system.attributes.fo.score + system.attributes.fo.modifier;
          }
          if (system.attributes.ma) {
            system.attributes.ma.modifier += tier;
            system.attributes.ma.totalScore = system.attributes.ma.score + system.attributes.ma.modifier;
          }
          entry.bonuses.push(`+${tier} AMB(FO/MA) (Perfect Sage)`);
        } else if (o.includes("reckless sage")) {
          system.aptitudes.sagePowerRecklessSageActive = true;
        } else if (o.includes("style of the sage")) {
          system.aptitudes.sagePowerStyleOfSageActive = true;
        } else if (o.includes("power of the sage")) {
          system.aptitudes.sagePowerPowerOfSageActive = true;
        } else if (o.includes("breath of the sage")) {
          system.aptitudes.sagePowerBreathOfSageActive = true;
        }
      }
      entry.conditionals.push("Select Sage Style: affects combat bonuses and Nature Energy use");
      entry.conditionals.push("Sage Arts: enhanced Signature Techniques/Unique Abilities");
      entry.triggered.push({
        id: "sage_manner_6", name: "Sage Art Enhancement",
        description: "Apply Nature Energy to Signature Technique for bonus effects",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Arrival of the Sage (Burst Limit) ----
      entry.triggered.push({
        id: "sage_arrival_1", name: "Arrival of the Sage",
        description: "Maximize Nature Energy, enter Perfect Sage Mode",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Sage Awakening (Mastery) ----
      entry.conditionals.push("Mastery: Enhanced Nature Energy gain, reduced petrification risk");
      entry.conditionals.push("Mastery: Sage Art improvements, additional combat bonuses");
      break;
    }

    // ---- NAMEKIAN ENHANCEMENTS ----

    case "great_namekian": {
      // ---- Namekian Titan (Variant: Giant Form, Graded) ----
      entry.bonuses.push(`Size: Growth LV ${G} (Graded, Grade ${G})`);
      entry.bonuses.push(`Punching Down Extra Dice +${G} Categories`);
      // ---- Battlefield Titan ----
      entry.conditionals.push(`+${tier} Wound vs Studied opponents`);
      entry.triggered.push({
        id: "great_namek_titan_2", name: "Namekian Titan (Basic Attack)",
        description: "Remove Studied for Basic Attack as Out-of-Sequence",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Super Giant Form ----
      entry.conditionals.push("Access to additional Grade (4th Grade with Bulky)");
      break;
    }

    case "mighty_namekian": {
      // ---- Might of the Namekian ----
      entry.conditionals.push("Might Clash bonus vs Studied opponents");
      entry.conditionals.push("Super Stack Extra Dice boost");
      entry.triggered.push({
        id: "mighty_namek_might_3", name: "Mighty Signature Attack",
        description: "Signature Attack using Studied stacks as Energy Charges",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Greater Muscles ----
      entry.conditionals.push("Ignore 1 Super Stack penalty");
      entry.conditionals.push("Super Stack Extra Dice on Healing Surges");
      entry.conditionals.push("Ki cost effects converting healing to weapon bonus");
      // ---- Green Giant (Burst Limit) ----
      entry.triggered.push({
        id: "mighty_namek_green_1", name: "Green Giant",
        description: "Healing Surge applies Studied stacks to opponents",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "red_eyed_namekian": {
      // ---- Tri-Solar Glare ----
      entry.conditionals.push("Enhanced Tri-Solar Glare: AoE application");
      entry.conditionals.push("Targets suffer combat penalties from Glare");
      // ---- Empowered Namekian ----
      entry.conditionals.push("Enhanced Namekian racial trait effects");
      entry.conditionals.push("Cellular Proliferation bonuses enhanced");
      // ---- Glint of a Super Namekian (Burst Limit) ----
      entry.triggered.push({
        id: "red_eye_glint_1", name: "Glint of a Super Namekian",
        description: "Enhanced combat bonuses for 1 round, enter Superior State",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Blue-Eyed Namekian (Mastery) ----
      entry.conditionals.push("Mastery: Enhanced Namekian abilities, reduced Stress Test");
      break;
    }

    case "son_of_namek": {
      // ---- Honored Training ----
      entry.conditionals.push("Pure Resolve stack bonuses enhanced");
      entry.conditionals.push("Extra Dice bonus per Pure Resolve stack");
      entry.conditionals.push("Ki recovery from Pure Resolve");
      entry.triggered.push({
        id: "son_namek_honor_4", name: "Honored Training (Counter)",
        description: "Counter Attack vs opponent who damaged ally",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- High-Speed Regeneration ----
      entry.bonuses.push("Enhanced Cellular Proliferation");
      entry.conditionals.push("Regenerate limbs as Instant Maneuver");
      entry.conditionals.push("Healing Surge bonus from Pure Resolve stacks");
      entry.triggered.push({
        id: "son_namek_regen_4", name: "Emergency Regeneration",
        description: "Regenerate as Out-of-Sequence when below threshold",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Namekian Focus (Burst Limit) ----
      entry.triggered.push({
        id: "son_namek_focus_1", name: "Namekian Focus",
        description: "Enter Perfect Ki Control state, maximize Pure Resolve benefits",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Namekian Sage (Mastery) ----
      entry.conditionals.push("Mastery: Sage-like Nature Energy integration");
      break;
    }

    // ---- MAJIN ENHANCEMENTS ----

    case "awoken": {
      // ---- A Welcome Challenge ----
      entry.conditionals.push("Select Challenger: apply Extra Dice vs Challenger");
      entry.conditionals.push("Enter Superior State on defeating Challenger");
      // ---- A Show of Skill ----
      entry.conditionals.push("Energy Charge on Signature vs Challenger");
      entry.conditionals.push("Advantage on Basic Attack vs Challenger");
      entry.conditionals.push("Increased Clashes; Natural Result on Skill Clash");
      // ---- A Great Determination ----
      entry.bonuses.push("Apply Power Improvement: Control");
      entry.conditionals.push("Increased Surge/Recovery LP/Ki");
      entry.triggered.push({
        id: "awoken_determination_3", name: "Healing Surge on Defeat",
        description: "Healing Surge when defeated by Challenger",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- An Uphill Battle (Unlimited) ----
      entry.triggered.push({
        id: "awoken_uphill_1", name: "An Uphill Battle",
        description: "All opponents treated as Challengers",
        usageLimit: "Unlimited", maxUses: 1
      });
      // ---- Awaken the Instinct (Mastery) ----
      entry.conditionals.push(`Mastery: +${tier} Strike/Wound vs Challenger`);
      entry.conditionals.push("Mastery: Extra/Greater Dice increase, additional Enhancement Power");
      entry.conditionals.push("Mastery: Surge as Instant Maneuver");
      break;
    }

    case "whimsical_majin": {
      // ---- Wild and Wondrous ----
      entry.bonuses.push("Select 3 Wild Card Secondary Racial Traits");
      entry.conditionals.push("Wild Cards change effects each encounter");
      entry.conditionals.push("Absorption enhanced: absorb multiple targets");
      // ---- Majin Mishaps ----
      entry.conditionals.push("Random bonus/penalty each round from Mishap table");
      entry.conditionals.push("Mishap can grant Extra Dice, Conditions, or Special Effects");
      entry.triggered.push({
        id: "whimsical_mishap_3", name: "Lucky Mishap",
        description: "Reroll Mishap result and choose which to keep",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Wild Round (Burst Limit) ----
      entry.triggered.push({
        id: "whimsical_wild_1", name: "Wild Round",
        description: "Gain all positive Mishap effects for 1 round",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Wild Fun (Mastery) ----
      entry.conditionals.push("Mastery: Enhanced Wild Card effects, additional traits");
      break;
    }

    // ---- MISC COMBAT ENHANCEMENTS ----

    case "hi_tension": {
      // ---- Earthling Pride ----
      entry.bonuses.push("Extra Signature Technique use per round");
      entry.bonuses.push("Reduced Capacity penalty for Signature Techniques");
      entry.conditionals.push("Way choice: Warrior/Serene/Mystic/Weaponmaster/Pilot");
      entry.conditionals.push("Way of the Warrior: Regain Ki from life spent");
      entry.conditionals.push("Way of the Serene: Enter Mindful State on Transform");
      entry.triggered.push({
        id: "hi_tension_mystic", name: "Way of the Mystic",
        description: "Out-of-Sequence maneuver after Unique Ability",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "hi_tension_weapon", name: "Way of the Weaponmaster",
        description: "Out-of-Sequence attack on successful armed hit",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.conditionals.push("Way of the Pilot: Combat Roll boost piloting damaged vehicle");
      // ---- Desperate Attack ----
      entry.triggered.push({
        id: "hi_tension_desperate_1", name: "Desperate Attack (Threshold)",
        description: "Non-attack maneuver as Out-of-Sequence on threshold damage",
        usageLimit: "Triggered", maxUses: null
      });
      entry.conditionals.push("Critical: ignore threshold penalties, enter Surging");
      // ---- Maximum Tension (Burst Limit) ----
      entry.triggered.push({
        id: "hi_tension_max_1", name: "Maximum Tension",
        description: "Trigger Desperate Attack effect on Transform",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Full Tension (Mastery) ----
      entry.conditionals.push("Mastery: Reduce ST Ki cost, auto-succeed Steadfast");
      entry.conditionals.push("Mastery: Determination stacks, spend for OoS maneuvers");
      break;
    }

    case "all_range_combat": {
      // ---- All-Range Attacks ----
      entry.conditionals.push("Enhanced Sniper's Art effects (range-based)");
      entry.conditionals.push("Apply Condition/Penetration based on range");
      entry.conditionals.push("Passive bonuses for Acupuncturist/Dead Shot/All-Seeing Eye");
      // ---- Ace Combat ----
      entry.conditionals.push("Reduce Critical Target with ranged attacks");
      entry.conditionals.push("Gain Ace stacks on Critical hits");
      entry.conditionals.push(`+${tier} Extra Dice per Ace stack`);
      entry.conditionals.push("Spend Ace stacks for various effects");
      entry.triggered.push({
        id: "all_range_ace_burst", name: "Ace Combat (Burst Limit)",
        description: "Spend Ace stacks for empowered attack",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Legendary Ace (Mastery) ----
      entry.triggered.push({
        id: "all_range_legendary_1", name: "Legendary Ace",
        description: "Maximize Ace stacks, set Critical Target to 5",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "explosive_power": {
      // ---- Zero Warning ----
      entry.conditionals.push("Strike/Wound bonus for Out-of-Sequence attacks");
      entry.conditionals.push("Basic Attack as Out-of-Sequence after Energy Charge-only turn");
      entry.triggered.push({
        id: "explosive_zero_3", name: "Zero Warning (OoS Attack)",
        description: "Use declared Attacking Maneuver as Out-of-Sequence",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Efficiency is Power ----
      entry.conditionals.push("Ignore Tier Requirement for other Transformations");
      entry.conditionals.push("Use base Tier for Defend/Special Maneuver/Grapple/Attacking while Holding Back");
      entry.triggered.push({
        id: "explosive_efficiency_4", name: "Efficiency is Power (Burst Limit)",
        description: "Maximum Holding Back benefits applied",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Faster than Lightning (Unlimited) ----
      entry.triggered.push({
        id: "explosive_faster_1", name: "Faster than Lightning",
        description: "Basic Attack twice as Out-of-Sequence",
        usageLimit: "Unlimited", maxUses: 1
      });
      // ---- Volcanic Power (Mastery) ----
      entry.conditionals.push("Mastery: Remove 2/Round limit, Instant Basic Attack/ST");
      entry.conditionals.push("Mastery: Defend without Counter Action");
      break;
    }

    case "spirit_empowerment": {
      // ---- Genki Power ----
      entry.conditionals.push("Lifeforce-based Attribute Modifier Bonuses");
      entry.conditionals.push("Allies can donate Lifeforce to enhance");
      entry.conditionals.push("Spirit Empowerment Ki cost reduction");
      entry.conditionals.push("AMB scales with donated Lifeforce");
      // ---- Miraculous Finish ----
      entry.conditionals.push("Signature Technique gains Wound bonus from Lifeforce");
      entry.triggered.push({
        id: "spirit_emp_miracle_2", name: "Miraculous Finish",
        description: "Maximize Wound Roll with all remaining Lifeforce",
        usageLimit: "1/Encounter", maxUses: 1
      });
      // ---- Final Strike (Burst Limit) ----
      entry.triggered.push({
        id: "spirit_emp_final_1", name: "Final Strike",
        description: "All-in attack spending all Lifeforce for massive Wound bonus",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "spirit_absorption": {
      // ---- Consuming Life ----
      entry.conditionals.push("Enhanced Lifeforce resource: increased drain rate");
      entry.conditionals.push("Lifeforce gain from defeated opponents");
      entry.conditionals.push("AMB scales with total Lifeforce consumed");
      entry.conditionals.push("Ki recovery from Lifeforce spending");
      // ---- Lifeforce Feasting ----
      entry.conditionals.push("Enhanced Energy Drain: AoE drain, increased range");
      entry.conditionals.push("Lifeforce-based combat bonuses");
      entry.conditionals.push("Spend Lifeforce for Extra Dice/Wound/DR effects");
      entry.triggered.push({
        id: "spirit_abs_feast_5", name: "Lifeforce Feasting (Burst Limit)",
        description: "Drain all nearby targets, massive Lifeforce gain",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- World Eater (Unlimited) ----
      entry.triggered.push({
        id: "spirit_abs_world_1", name: "World Eater",
        description: "Drain the planet itself for Lifeforce",
        usageLimit: "Unlimited", maxUses: 1
      });
      // ---- Endless Hunger (Mastery) ----
      entry.conditionals.push("Mastery: Exceed Lifeforce maximum, enhanced drain, LP recovery");
      break;
    }

    case "absorbed_power": {
      // ---- Stolen Talents ----
      entry.conditionals.push("OoS Transformation after successful Absorption");
      entry.triggered.push({
        id: "absorbed_stolen_2", name: "Stolen Talents (Advantage)",
        description: "Apply Advantage from Absorbed Character's Signature Technique",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.conditionals.push("Select 2 Absorbed Characters: gain 2 of their Talents");
      // ---- Power Made Mine ----
      entry.conditionals.push("Combat Rolls Extra Dice = highest ToP of Absorbed Characters");
      entry.triggered.push({
        id: "absorbed_power_2", name: "Power Made Mine (Power stack)",
        description: "Gain Power stack using Absorbed Character's Signature/Aura",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.conditionals.push("Select Absorbed Character: increase highest AMB by +1(T)");
      // ---- Internal Control (Burst Limit) ----
      entry.triggered.push({
        id: "absorbed_internal_1", name: "Internal Control",
        description: "Double AMB until end of next turn; prevent Absorbed escape for 2 turns",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "tuffleization": {
      // ---- Tuffle Hybrid ----
      entry.conditionals.push("Possession-type Fusion enhanced: AMB bonuses");
      entry.conditionals.push("Gain access to host's Racial Traits");
      entry.conditionals.push("Analysis Maneuver enhanced: gain Studied faster");
      entry.conditionals.push("Revenge Points (RP) resource system");
      // ---- Accumulated Power ----
      entry.conditionals.push("Spend RP for Combat Roll bonuses");
      entry.conditionals.push("Gain RP per round and on dealing damage");
      entry.conditionals.push("RP-based Ki recovery");
      entry.triggered.push({
        id: "tuffle_accum_4", name: "Accumulated Power (Spend RP)",
        description: "Spend all RP for massive Combat Roll bonus for 1 round",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Realized Vengeance (Unlimited) ----
      entry.triggered.push({
        id: "tuffle_realized_1", name: "Realized Vengeance",
        description: "Double RP gain, enhanced host body exploitation",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "eye_of_the_storm": {
      // ---- Elemental Aptitude ----
      entry.conditionals.push("Might Clash vs movement into Melee Range");
      entry.conditionals.push("Choice-based trigger effects on turn start in Melee Range");
      // ---- Element choice (Rain of Ash / Thunderstorm / Frozen Eye / Wall Cloud) ----
      const eotsOpt = _findOptionValue(options);
      if (eotsOpt) {
        const o = eotsOpt.toLowerCase();
        if (o.includes("rain") || o.includes("ash")) {
          system.aptitudes.eyeOfStormRainOfAshActive = true;
        } else if (o.includes("thunder")) {
          system.aptitudes.eyeOfStormThunderstormActive = true;
        } else if (o.includes("frozen") || o.includes("ice")) {
          system.aptitudes.eyeOfStormFrozenEyeActive = true;
        } else if (o.includes("wall") || o.includes("wind")) {
          system.aptitudes.eyeOfStormWallCloudActive = true;
        }
      }
      // ---- Primal Storm ----
      entry.conditionals.push("Option-based passive: Wound increase / Crit reduction / life reduction / DV/Soak reduction");
      entry.conditionals.push("Option-based Advantage: Sustained / Condition / Staggering / Long Shot");
      entry.conditionals.push("Bonus Wound if attack already has Advantage");
      // ---- Storm Caller ----
      entry.conditionals.push("Apply Weather Effects based on chosen element");
      entry.conditionals.push("Apply elemental Profiles to all Attacking Maneuvers");
      break;
    }

    case "enhanced_aura": {
      // ---- Aura beyond Limits ----
      entry.bonuses.push("Select Ascended Aura without Infusion");
      entry.conditionals.push("Auto-exit on Aura exit; Auto-enter Ascended Aura");
      entry.conditionals.push("Free Ki Wager for Aura cost; Spend Shield as Ki Wager");
      // ---- Aura Breakthrough ----
      entry.conditionals.push("Aura Type passive effects (Sparking/Burning/Hazardous/Avatar/Energy Focus/Shield)");
      // ---- Aura Burst (Unlimited) ----
      entry.triggered.push({
        id: "enhanced_aura_burst_1", name: "Aura Burst",
        description: "Free Aura entry, no cost for 2 rounds",
        usageLimit: "Unlimited", maxUses: 1
      });
      // ---- Perfected Aura (Mastery) ----
      entry.conditionals.push("Mastery: Perfect Ki Control, doubled Aura Type effects");
      break;
    }

    case "evil_aura": {
      // ---- Villainous Form: Graded (2 grades) ----
      entry.conditionals.push(`Graded: Villainous (+${tier} FO/MA, ${10 * baseTier} Evil Points) or Supervillain (+${3 * tier} FO/MA, ${15 * baseTier} Evil Points)`);
      entry.conditionals.push("Supervillain Grade: Compelled condition with Ki/LP effects");
      // ---- Power of Evil ----
      entry.perRound.push({ type: "evil_points", amount: tier, label: "Evil Points gain per round" });
      entry.conditionals.push("Spend Evil Points for Wound/Damage Reduction bonuses");
      entry.conditionals.push("Regain Ki when spending Evil Points");
      // ---- Evil Techniques ----
      entry.conditionals.push("Darkness Mixer, Rage Saucer special maneuvers");
      entry.conditionals.push("Access 5 Signature Techniques: Baked Sphere, Bloody Sauce, Gigantic Ki Blast, Marbling Drop, Peeler Storm");
      entry.triggered.push({
        id: "evil_aura_techniques_burst", name: "Evil Techniques",
        description: "Unlock all 5 Evil Signature Techniques",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Dark Power Rising (Unlimited) ----
      entry.triggered.push({
        id: "evil_aura_dark_1", name: "Dark Power Rising",
        description: "Maximize Evil Points immediately",
        usageLimit: "Unlimited", maxUses: 1
      });
      // ---- Overflowing Evil Power (Mastery) ----
      entry.conditionals.push("Mastery: Exceed Evil Point max, increased gain, Instant effects");
      break;
    }

    case "martial_focus": {
      // ---- Honed Skill: 4 Martial Styles ----
      const mfOpt = _findOptionValue(options);
      if (mfOpt) {
        const o = mfOpt.toLowerCase();
        if (o.includes("turtle")) {
          system.aptitudes.martialFocusTurtleStyleActive = true;
          if (system.attributes.te) {
            system.attributes.te.modifier += tier;
            system.attributes.te.totalScore = system.attributes.te.score + system.attributes.te.modifier;
          }
          entry.bonuses.push(`+${tier} AMB(TE) (Turtle Style)`);
          entry.conditionals.push(`Per threshold below: +${2 * tier} Soak (Turtle Style)`);
        } else if (o.includes("crane")) {
          system.aptitudes.martialFocusCraneStyleActive = true;
          if (system.attributes.in) {
            system.attributes.in.modifier += tier;
            system.attributes.in.totalScore = system.attributes.in.score + system.attributes.in.modifier;
          }
          entry.bonuses.push(`+${tier} AMB(IN) (Crane Style)`);
          entry.conditionals.push(`Per threshold below: +${tier} Strike (Crane Style)`);
        } else if (o.includes("wolf")) {
          system.aptitudes.martialFocusWolfStyleActive = true;
          if (system.attributes.ag) {
            system.attributes.ag.modifier += tier;
            system.attributes.ag.totalScore = system.attributes.ag.score + system.attributes.ag.modifier;
          }
          entry.bonuses.push(`+${tier} AMB(AG) (Wolf Style)`);
          entry.conditionals.push(`Per threshold below: +${tier} Dodge (Wolf Style)`);
        } else if (o.includes("dragon")) {
          system.aptitudes.martialFocusDragonStyleActive = true;
          if (system.attributes.fo) {
            system.attributes.fo.modifier += tier;
            system.attributes.fo.totalScore = system.attributes.fo.score + system.attributes.fo.modifier;
          }
          if (system.attributes.ma) {
            system.attributes.ma.modifier += tier;
            system.attributes.ma.totalScore = system.attributes.ma.score + system.attributes.ma.modifier;
          }
          entry.bonuses.push(`+${tier} AMB(FO/MA) (Dragon Style)`);
          entry.conditionals.push(`Per threshold below: +${2 * tier} Wound (Dragon Style)`);
        }
      } else {
        entry.conditionals.push("Select Style: Turtle (defense/soak) / Crane (ki/range) / Wolf (speed/dodge) / Dragon (strike/wound)");
      }
      entry.conditionals.push("Style-dependent passive bonuses");
      // ---- Blood, Sweat and Tears ----
      entry.triggered.push({
        id: "martial_focus_blood_1", name: "Blood, Sweat and Tears (Energy Charge)",
        description: "Spend LP for Energy Charge",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "martial_focus_blood_2", name: "Blood, Sweat and Tears (Defense/Soak)",
        description: "Defense/Soak boost when targeted",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.triggered.push({
        id: "martial_focus_blood_3", name: "Blood, Sweat and Tears (Avoid Defeat)",
        description: "Avoid defeat condition (spend LP)",
        usageLimit: "Triggered", maxUses: null
      });
      // ---- Prepared Stance (Burst Limit) ----
      entry.triggered.push({
        id: "martial_focus_stance_1", name: "Prepared Stance",
        description: "Gain second Style effect benefit on Transform",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Expanding Focus (Mastery) ----
      entry.conditionals.push("Mastery: Additional Energy Charge, select additional Honed Skill");
      entry.conditionals.push("Mastery: Switch Honed Skill effects on Power gain");
      break;
    }

    case "martial_mastery": {
      // ---- Mastery of Martial Arts ----
      entry.conditionals.push("Counter Action mechanics with various triggered effects");
      entry.conditionals.push("Enhanced Counter Attack/Parry/Deflect options");
      entry.triggered.push({
        id: "martial_mastery_counter_3", name: "Mastery Counter (Enhanced)",
        description: "Enhanced Counter Action with bonus effects",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Honed Weapon ----
      entry.conditionals.push("Counter maneuver bonuses per weapon type");
      const mmOpt = _findOptionValue(options);
      if (mmOpt) {
        const o = mmOpt.toLowerCase();
        if (o.includes("weapon master")) {
          system.aptitudes.martialMasteryWeaponMasterActive = true;
          entry.conditionals.push(`Armed: +${tier} Strike, +${2 * tier} Wound (Weapon Master)`);
        } else if (o.includes("unarmed master")) {
          system.aptitudes.martialMasteryUnarmedMasterActive = true;
          entry.conditionals.push(`Unarmed: +${tier} Strike, +${tier} Dodge (Unarmed Master)`);
        }
      } else {
        entry.conditionals.push("Option: Weapon Master or Unarmed Master effects");
      }
      entry.triggered.push({
        id: "martial_mastery_weapon_5", name: "Honed Weapon (Critical Counter)",
        description: "Critical result on Counter Action",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Master of Finishing Blows (Burst Limit) ----
      entry.triggered.push({
        id: "martial_mastery_finish_1", name: "Master of Finishing Blows",
        description: "Gain Counter Actions + guaranteed Critical Results on Transform",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "drunken_fist": {
      // ---- Power of the Bottle ----
      entry.bonuses.push("Enter Drunk State on Transform");
      entry.conditionals.push("Drunk State: bonuses increase with Drink level");
      entry.conditionals.push("Gain Toppling stacks on successful dodges");
      entry.conditionals.push("Spend Toppling for Strike/Wound bonus");
      // ---- Unpredictable Combat ----
      entry.conditionals.push("No Defense reduction via Cross Counter");
      entry.conditionals.push("Botch becomes Critical on Dodge");
      entry.conditionals.push("Critical Dodge grants next Critical Strike");
      entry.conditionals.push("Cross Counter without Counter Action");
      entry.conditionals.push("Skip Exploit");
      entry.triggered.push({
        id: "drunken_unpredictable_6", name: "Unpredictable Combat (Natural Result shift)",
        description: "Reduce Dodge Natural Result, increase Strike/Wound Natural Result",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Calculated Stumbling (Unlimited) ----
      entry.triggered.push({
        id: "drunken_calculated_1", name: "Calculated Stumbling",
        description: "Gain 3 Toppling, remove 1/Round limits",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "feral_fist": {
      // ---- Mad Dog Attack ----
      entry.bonuses.push("Enter Feral Special State on Transform");
      entry.conditionals.push("Counter/Out-of-Sequence maneuver access in Feral");
      entry.triggered.push({
        id: "feral_mad_4", name: "Mad Dog Attack (Movement)",
        description: "Movement as Instant Maneuver",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.conditionals.push("Gain Ferocity stacks; spend to increase Natural Result");
      entry.triggered.push({
        id: "feral_mad_7", name: "Mad Dog Attack (Crit on Movement)",
        description: "Reduce Critical Target on Movement",
        usageLimit: "2/Round", maxUses: 2
      });
      entry.triggered.push({
        id: "feral_mad_8", name: "Mad Dog Attack (Critical Wound)",
        description: "Wound Roll increase on Critical",
        usageLimit: "3/Round", maxUses: 3
      });
      // ---- Unforeseen Ferocity (Burst Limit) ----
      entry.triggered.push({
        id: "feral_unforeseen_1", name: "Unforeseen Ferocity",
        description: "Gain 3 Ferocity stacks, set Critical Target to 6",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "scholar": {
      // ---- Unmitigated Genius ----
      entry.bonuses.push("Enhanced Analysis Maneuver");
      entry.conditionals.push("Studied targets: additional Weakness exploitation");
      entry.conditionals.push("Gain Power stack on successful Analysis");
      // ---- Zero Tolerance for Failure ----
      entry.conditionals.push("Extra Dice bonus vs Studied targets");
      entry.conditionals.push("Wound bonus per Studied stack");
      entry.triggered.push({
        id: "scholar_zero_3", name: "Zero Tolerance (Counter Analysis)",
        description: "Analysis as Out-of-Sequence Counter Action",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Analytical Scan (Burst Limit) ----
      entry.triggered.push({
        id: "scholar_scan_1", name: "Analytical Scan",
        description: "Instantly Study all targets, gain combat bonuses for 1 round",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Combat Scholar (Mastery) ----
      entry.conditionals.push("Mastery: Enhanced Studied bonuses, permanent Analysis effects");
      break;
    }

    case "tactician": {
      // ---- Man with a Plan ----
      entry.conditionals.push("AMB penalty (AG/FO/TE -1(T), MA -1(T)) but SC/PE +1(T)");
      entry.conditionals.push("Gain Order Points resource");
      entry.conditionals.push("Spend Order Points to buff allies' Combat Rolls");
      entry.conditionals.push("Allies in range gain tactical bonuses");
      // ---- Power Sharing ----
      entry.conditionals.push("Share Power stacks with allies");
      entry.conditionals.push("Allies gain Extra Dice from your tactics");
      // ---- Order Maneuver (Burst Limit) ----
      entry.triggered.push({
        id: "tactician_order_1", name: "Order Maneuver",
        description: "Issue complex Order affecting multiple allies",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- New Tactics (Mastery) ----
      entry.triggered.push({
        id: "tactician_new_1", name: "New Tactics",
        description: "Gain additional Order effects and enhanced ally bonuses",
        usageLimit: "Unlimited", maxUses: 1
      });
      break;
    }

    case "stylish": {
      // ---- Drip or Drown ----
      const stOpt = _findOptionValue(options);
      if (stOpt) {
        const o = stOpt.toLowerCase();
        if (o.includes("armored fabric")) {
          system.aptitudes.stylishArmoredFabricActive = true;
        } else if (o.includes("light cloth")) {
          system.aptitudes.stylishLightClothActive = true;
        }
      }
      entry.conditionals.push("Standard Clothing required as Top Layer Apparel");
      entry.conditionals.push("Swaggering Wager enhanced: Style Points resource");
      entry.conditionals.push("Gain Style Points on Swaggering Wager success");
      entry.conditionals.push(`Per Style Point: +${tier} Combat Roll bonus`);
      entry.conditionals.push("Spend Style Points for various effects");
      // ---- Aura Farm ----
      entry.conditionals.push("Crowd-based bonuses: Intimidation/Performance enhanced");
      entry.conditionals.push("Gain Style Points from crowd reactions");
      entry.conditionals.push("Allies gain morale from your Style");
      // ---- Peep the Fit (Burst Limit) ----
      entry.triggered.push({
        id: "stylish_peep_1", name: "Peep the Fit",
        description: "Maximize Style Points, gain Superior State",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Special Apparel (Mastery) ----
      entry.conditionals.push("Mastery: Special Apparel Qualities, enhanced Style bonuses");
      break;
    }

    case "elemental_burst": {
      // ---- Elemental Aptitude ----
      entry.bonuses.push("Select Elemental Profile (Fire/Ice/Water/Lightning/Earth/Wind/Dark/Light)");
      entry.bonuses.push("Gain access to related Elemental Trait");
      // ---- Focused Elemental ----
      entry.conditionals.push("Apply Advantage to Signature Technique of chosen element");
      entry.triggered.push({
        id: "elemental_focused_2", name: "Focused Elemental (Double Crit)",
        description: "Score Critical on both Strike and Wound rolls",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Burst Mode ----
      entry.conditionals.push("Add AoE/increase Damage Category for chosen element Maneuvers");
      // ---- Element Master ----
      entry.conditionals.push("Earth: Cover, move Features, Earthquake Weather");
      entry.conditionals.push("Wind: Defense in Sky, move opponents, Galeforce Weather");
      entry.conditionals.push("Dark: Permanent Normal Sight, Ki for Energy Charge, Limited Sight to opponents");
      entry.conditionals.push("Light: Permanent Normal Sight, Instant Power Up, AoE LP reduction");
      entry.conditionals.push("Fire: Wound vs Broken, AoE Broken, High Temperatures Weather");
      entry.conditionals.push("Ice: Wound vs Slowed, melee Slowed, Freezing Weather");
      entry.conditionals.push("Water: Strike vs Prone, melee Prone, Storm Weather");
      entry.conditionals.push("Lightning: Strike vs Impediment, AoE Impediment, Lightning Weather");
      break;
    }

    case "transformative_mimicry": {
      // ---- Super Neko Majin ----
      entry.bonuses.push("Copy target's Enhancement Power AMB and Aspects");
      entry.conditionals.push("Mimicry adapts to observed transformation");
      // ---- My Own Power ----
      entry.conditionals.push("Gain unique Neko Majin bonuses on top of copied effects");
      entry.conditionals.push("Cannot copy Legendary or Exceed traits");
      // ---- Mastery: Favored Forms ----
      entry.conditionals.push("Mastery: Save 3 favorite forms, switch between them freely");
      break;
    }

    // ---- VEHICLE / TECH ENHANCEMENTS ----

    case "kamen_rider": {
      // ---- Henshin! ----
      entry.bonuses.push("Rider System: vehicle integration combat");
      entry.conditionals.push("Scaling: Rider Form progression with increasing bonuses");
      entry.conditionals.push("Battle Uniform: armor with Rider-specific accessories");
      // ---- Rider System! ----
      entry.conditionals.push("Vehicle-based maneuvers and special attacks");
      entry.conditionals.push("Rider Form upgrades with Scaling levels");
      // ---- Rider System options (multi-option) ----
      const krOpts = _findAllOptionValues(options);
      for (const opt of krOpts) {
        const o = opt.toLowerCase();
        // L3 options
        if (o.includes("rider martial arts")) {
          system.aptitudes.kamenRiderRiderMartialArtsActive = true;
        } else if (o.includes("rider weapon")) {
          system.aptitudes.kamenRiderRiderWeaponActive = true;
        }
        // L6 options
        else if (o.includes("classic technique")) {
          system.aptitudes.kamenRiderClassicTechniqueActive = true;
        } else if (o.includes("classic power")) {
          system.aptitudes.kamenRiderClassicPowerActive = true;
          system.aptitudes.might = (system.aptitudes.might || 0) + tier;
        } else if (o.includes("sky rider")) {
          system.aptitudes.kamenRiderSkyRiderActive = true;
        } else if (o.includes("j's power") || o.includes("js power") || o.includes("j’s power")) {
          system.aptitudes.kamenRiderJsPowerActive = true;
        } else if (o.includes("monstrous rider")) {
          system.aptitudes.kamenRiderMonstrousRiderActive = true;
        } else if (o.includes("metamorphing rider")) {
          system.aptitudes.kamenRiderMetamorphingRiderActive = true;
        } else if (o.includes("card rider")) {
          system.aptitudes.kamenRiderCardRiderActive = true;
        } else if (o.includes("high-speed rider") || o.includes("high speed rider")) {
          system.aptitudes.kamenRiderHighSpeedRiderActive = true;
        } else if (o.includes("musical rider")) {
          system.aptitudes.kamenRiderMusicalRiderActive = true;
        } else if (o.includes("anniversary rider")) {
          system.aptitudes.kamenRiderAnniversaryRiderActive = true;
        }
        // Metamorphing Rider forms
        else if (o.includes("mighty form")) {
          system.aptitudes.kamenRiderMightyFormActive = true;
          if (system.attributes.pe) {
            system.attributes.pe.modifier += tier;
            system.attributes.pe.totalScore = system.attributes.pe.score + system.attributes.pe.modifier;
          }
          entry.bonuses.push(`+${tier} AMB(PE) (Mighty Form)`);
        } else if (o.includes("dragon form")) {
          system.aptitudes.kamenRiderDragonFormActive = true;
          if (system.attributes.fo) {
            system.attributes.fo.modifier -= tier;
            system.attributes.fo.totalScore = system.attributes.fo.score + system.attributes.fo.modifier;
          }
          if (system.attributes.ma) {
            system.attributes.ma.modifier -= tier;
            system.attributes.ma.totalScore = system.attributes.ma.score + system.attributes.ma.modifier;
          }
          if (system.attributes.ag) {
            system.attributes.ag.modifier += tier;
            system.attributes.ag.totalScore = system.attributes.ag.score + system.attributes.ag.modifier;
          }
          entry.bonuses.push(`-${tier} AMB(FO/MA), +${tier} AMB(AG) (Dragon Form)`);
        } else if (o.includes("pegasus form")) {
          system.aptitudes.kamenRiderPegasusFormActive = true;
          if (system.attributes.te) {
            system.attributes.te.modifier -= tier;
            system.attributes.te.totalScore = system.attributes.te.score + system.attributes.te.modifier;
          }
          if (system.attributes.in) {
            system.attributes.in.modifier += tier;
            system.attributes.in.totalScore = system.attributes.in.score + system.attributes.in.modifier;
          }
          entry.bonuses.push(`-${tier} AMB(TE), +${tier} AMB(IN) (Pegasus Form)`);
        } else if (o.includes("titan form")) {
          system.aptitudes.kamenRiderTitanFormActive = true;
          if (system.attributes.ag) {
            system.attributes.ag.modifier -= tier;
            system.attributes.ag.totalScore = system.attributes.ag.score + system.attributes.ag.modifier;
          }
          if (system.attributes.te) {
            system.attributes.te.modifier += tier;
            system.attributes.te.totalScore = system.attributes.te.score + system.attributes.te.modifier;
          }
          entry.bonuses.push(`-${tier} AMB(AG), +${tier} AMB(TE) (Titan Form)`);
        }
      }
      // ---- Rider Finish! ----
      entry.triggered.push({
        id: "kamen_finish_1", name: "Rider Finish!",
        description: "Massive finisher attack with Rider bonuses",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Evolution! (Mastery) ----
      entry.conditionals.push("Mastery: Evolution form, enhanced Rider abilities");
      break;
    }

    case "unlimited_construction": {
      // ---- Construct Builder ----
      entry.bonuses.push("3× Magical Materialization per round");
      entry.conditionals.push("Enhanced construct creation (weapons/features/terrain)");
      entry.conditionals.push("Constructs gain combat bonuses");
      // ---- Weaponsmith ----
      entry.conditionals.push("Create enhanced weapons with Magical Materialization");
      entry.conditionals.push("Weapon Quality bonuses from Weaponsmith");
      // ---- Landsmith ----
      entry.conditionals.push("Create terrain features and barriers");
      entry.conditionals.push("Landsmith constructions provide cover and zone control");
      entry.conditionals.push("Features persist and can be enhanced");
      // ---- Creation Burst (Burst Limit) ----
      entry.triggered.push({
        id: "unlimited_burst_1", name: "Creation Burst",
        description: "Create multiple constructs simultaneously as Out-of-Sequence",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    // ---- RACIAL SPECIFIC ----

    case "magic_awakening": {
      // ---- Abracadabra ----
      entry.conditionals.push("Gain Alakazam Points resource via magical effects");
      entry.triggered.push({
        id: "magic_awaken_abra_1", name: "Abracadabra (Alakazam Points)",
        description: "Gain Alakazam Point on magical effect use",
        usageLimit: "2/Round", maxUses: 2
      });
      entry.triggered.push({
        id: "magic_awaken_abra_2", name: "Abracadabra (OoS Basic Attack)",
        description: "Basic Attack as Out-of-Sequence after magical effect",
        usageLimit: "1/Round", maxUses: 1
      });
      entry.conditionals.push("Talent-dependent: Magic Warrior or Magic Blaster bonuses");
      // ---- Hocus Pocus ----
      entry.conditionals.push("Spend Alakazam Points: various magical combat effects");
      entry.conditionals.push("Effects: Extra Dice, Condition application, Ki recovery, Enhanced Maneuvers");
      // ---- Presto Change-o (Burst Limit) ----
      entry.triggered.push({
        id: "magic_awaken_presto_1", name: "Presto Change-o",
        description: "Gain Alakazam Points + double their effects for 1 round",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "inner_phantom": {
      // ---- Monster Within ----
      entry.conditionals.push("Phantasm no longer deeply suppressed");
      entry.conditionals.push("AMB and Stress boost from Phantasm's tier");
      entry.conditionals.push("Phantasm maintains Struggling stacks");
      entry.triggered.push({
        id: "inner_phantom_monster_4", name: "Monster Within (Defeat)",
        description: "Use Phantasm ability as Out-of-Sequence on defeat",
        usageLimit: "Triggered", maxUses: null
      });
      // ---- Echoes of the Phantom ----
      entry.conditionals.push("Select 1 secondary racial trait from Phantasm's race");
      entry.conditionals.push("Select abilities equal to tier from Phantasm");
      entry.conditionals.push("Clash against Phantasm for Struggling stacks (capped at Phantasm's tier)");
      // ---- Chained Malice (Burst Limit) ----
      entry.triggered.push({
        id: "inner_phantom_chained_1", name: "Chained Malice",
        description: "Roll 1d4+1, restrict Phantasm Escape for that many turns",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "ultra_supervillain": {
      // ---- Ultra Villainous (Villainous Form) ----
      entry.conditionals.push("Enhanced Evil Aura: increased AMB and Evil Point generation");
      entry.conditionals.push(`Enhanced Combat Rolls: +${2 * tier} in Villainous form`);
      entry.conditionals.push("Enhanced Villainous Traits: doubled effects");
      entry.triggered.push({
        id: "ultra_villain_crystal_2", name: "Crystalline Darkness",
        description: "Create crystalline constructs for combat/defense",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Crystalline Darkness (Evil Techniques) ----
      entry.conditionals.push("Crystal-enhanced Evil Techniques: bonus effects");
      break;
    }

    case "time_power": {
      // ---- Time Control ----
      entry.conditionals.push("Enhanced Time Freeze: increased duration and effects");
      entry.conditionals.push("Time manipulation: speed/slow effects on targets");
      // ---- Time Profile ----
      entry.conditionals.push("Design Time Profile affecting combat and maneuvers");
      // ---- Time Seal Unique Ability ----
      entry.conditionals.push("Access Time Seal: seal opponents in time stasis");
      // ---- The Frozen Time ----
      entry.conditionals.push("Enhanced Time Freeze: additional actions during freeze");
      entry.conditionals.push("Opponents cannot react during Time Freeze");
      // ---- Time has Stopped (Burst Limit) ----
      entry.triggered.push({
        id: "time_power_stopped_1", name: "Time has Stopped",
        description: "Extended Time Freeze with enhanced effects",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "twin_dragon_mode": {
      // ---- Twin Draconic Element ----
      entry.conditionals.push("Combine 2 Draconic Elements for dual effects");
      entry.conditionals.push("8 elemental options: Fire/Ice/Water/Lightning/Earth/Wind/Dark/Light");
      entry.conditionals.push("Dual element attacks apply both elemental effects");
      // ---- Twin Dragon Attack ----
      entry.conditionals.push("Combined Wound Roll bonus from dual elements");
      entry.conditionals.push("Split attacks between two elements");
      entry.triggered.push({
        id: "twin_dragon_attack_3", name: "Twin Dragon Attack (Dual Strike)",
        description: "Attack with both elements simultaneously",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Twin Dragon Roaring (Burst Limit) ----
      entry.triggered.push({
        id: "twin_dragon_roar_1", name: "Twin Dragon Roaring",
        description: "Massive dual-element attack with combined bonuses",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "warrior_projection": {
      // ---- Form of the Warrior: Graded (5 grades) ----
      entry.bonuses.push(`Grade ${G}: Spectral Form active (Growth LV ${G})`);
      entry.conditionals.push(`Graded: 5 grades with increasing Size/DR/combat bonuses`);
      // ---- Spectral Weapons ----
      entry.conditionals.push("Spectral weapons: enhanced Armed combat");
      entry.conditionals.push("Ki constructs for various weapon types");
      // ---- Magatama & Perfect Katana ----
      entry.conditionals.push("Access Magatama Signature Technique");
      entry.conditionals.push("Perfect Katana weapon with enhanced Qualities");
      // ---- Spectral Armor ----
      entry.conditionals.push("Spectral Armor: DR and defensive bonuses");
      entry.conditionals.push("Armor scales with Grade for increased protection");
      // ---- Perfect Armor (Burst Limit) ----
      entry.triggered.push({
        id: "warrior_proj_perfect_1", name: "Perfect Armor",
        description: "Maximize Spectral Armor effects for 1 round",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "weapon_of_hope": {
      // ---- Shining Beacon ----
      entry.bonuses.push("-2 Spirit Empowerment Stress Test");
      entry.conditionals.push("Armed (Hope Weapon): +1 Damage Category");
      entry.conditionals.push("Hope Weapon: allies gain morale bonuses in range");
      // ---- Everyone's Hope ----
      entry.conditionals.push("Allies gain Combat Roll bonus per your Hope stacks");
      entry.conditionals.push("Hope stacks gained from ally support and positive actions");
      entry.triggered.push({
        id: "weapon_hope_everyone_3", name: "Everyone's Hope (Healing)",
        description: "Spend Hope stacks to heal allies",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- For the Future (Burst Limit) ----
      entry.triggered.push({
        id: "weapon_hope_future_1", name: "For the Future",
        description: "Massive Hope-empowered attack, spend all Hope stacks",
        usageLimit: "Burst Limit", maxUses: 1
      });
      break;
    }

    case "hero": {
      // ---- Unmitigated Champion of Justice ----
      entry.conditionals.push("Stress Test increase when combined with other Transformation");
      entry.bonuses.push("Gain Hype Maneuver access (uses Personality Modifier)");
      // ---- Zero Tolerance for Evil ----
      entry.conditionals.push("Justice Points: gain on Hype (max 3)");
      entry.conditionals.push(`Damage Reduction: ${tier} per Justice Point`);
      entry.triggered.push({
        id: "hero_zero_3", name: "Zero Tolerance (Revive)",
        description: "Spend 2 Justice Points to revive from defeat",
        usageLimit: "Triggered", maxUses: null
      });
      entry.triggered.push({
        id: "hero_zero_4", name: "Zero Tolerance (Wound)",
        description: "Signature Technique Wound bonus",
        usageLimit: "1/Round", maxUses: 1
      });
      // ---- Transformation Pose (Burst Limit) ----
      entry.triggered.push({
        id: "hero_pose_1", name: "Transformation Pose",
        description: "Hype as Out-of-Sequence, maximize Justice Points",
        usageLimit: "Burst Limit", maxUses: 1
      });
      // ---- Battle Uniform ----
      entry.conditionals.push("Combat Clothing with Flow + accessory");
      entry.conditionals.push("Ki regain per Justice Point; Apparel bonuses per threshold");
      // ---- Legendary Savior (Mastery) ----
      entry.conditionals.push("Mastery: High Grade Battle Uniform, Power on Justice gain, Extra Wound per JP");
      break;
    }

    case "black_sparks":
    case "chosen_by_the_sparks": {
      // Black Flash system (display-only, complex resource management)
      entry.conditionals.push("Black Flash: enhanced Critical effects with dark energy");
      entry.conditionals.push("120% Capacity threshold for enhanced damage");
      entry.conditionals.push("Post-flash bonuses: increased Wound/Critical effects");
      break;
    }

    default: {
      // Generic: just note it's active
      entry.bonuses.push("Active (trait passives apply per manual)");
      break;
    }
  }
}
