/**
 * Bestial Traits automation module.
 *
 * Aggregates active bestial traits from all sources (Dark Vassal, Were-creature,
 * Crusher Form, Dragon Force, Monster Form) and applies passive stat bonuses.
 *
 * Called from actor.mjs after enhancement/legendary form automation.
 *
 * Bestial Limit: max 4 traits active at any time.
 */

// ============================================================
// Name ↔ ID mapping (backward compat for string-based storage)
// ============================================================

const NAME_TO_ID = {
  "Alternate Sight": "bestial_alternate_sight",
  "Bestial Build": "bestial_build",
  "Bestial Movement": "bestial_movement",
  "Camouflage": "bestial_camouflage",
  "Claws": "bestial_claws",
  "Extra Limbs": "bestial_extra_limbs",
  "Fangs": "bestial_fangs",
  "Feast": "bestial_feast",
  "Impaling Horns": "bestial_impaling_horns",
  "Environmental Adaptability": "bestial_environmental_adaptability",
  "Return to Heritage": "bestial_return_to_heritage",
  "Tail": "bestial_tail",
  "Treacherous Spikes": "bestial_treacherous_spikes",
  "Weather Resilient": "bestial_weather_resilient"
};

const ID_TO_NAME = Object.fromEntries(
  Object.entries(NAME_TO_ID).map(([name, id]) => [id, name])
);

/** Normalize a trait identifier (name or ID) → catalog ID. */
export function normalizeBestialTraitId(identifier) {
  if (!identifier) return null;
  if (identifier.startsWith("bestial_")) return identifier;
  return NAME_TO_ID[identifier] || null;
}

/** Get display name for a catalog ID. */
export function getBestialTraitName(id) {
  return ID_TO_NAME[id] || id;
}

// ============================================================
// Trait aggregation
// ============================================================

/**
 * Collect all active bestial traits from every source on a character.
 * @returns {Array<{id:string, source:string, level:number, option:string|null}>}
 * Enforces 4-trait Bestial Limit.
 */
export function getActiveBestialTraits(system) {
  const mutState = system.transformationMeta?.mutationState || {};
  const config = mutState.bestialTraitConfig || {};
  const collected = [];
  const seen = new Set();

  function addTraits(arr, source) {
    if (!Array.isArray(arr)) return;
    for (const raw of arr) {
      const id = normalizeBestialTraitId(raw);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const traitCfg = config[id] || {};
      collected.push({
        id,
        source,
        level: traitCfg.level || 1,
        option: traitCfg.option || null
      });
    }
  }

  // Dark Vassal — always active while mutation trait is Dark Vassal
  addTraits(mutState.darkVassalBestialTraits, "darkVassal");

  // Were-creature — only when transformed
  if (mutState.wereCreatureActive) {
    addTraits(mutState.wereCreatureBestialTraits, "wereCreature");
  }

  // Crusher Form / Dragon Force / Monster Form bestial traits
  addTraits(mutState.crusherFormBestialTraits, "crusherForm");
  addTraits(mutState.dragonForceBestialTraits, "dragonForce");
  addTraits(mutState.monsterFormBestialTraits, "monsterForm");

  // Enforce Bestial Limit (max 4)
  return collected.slice(0, 4);
}

// ============================================================
// Main automation entry point
// ============================================================

/**
 * Apply all passive bestial trait bonuses to the character.
 * Stat bonuses are additive on top of already-computed values.
 *
 * Unconditional passives are applied directly.
 * Conditional bonuses (environment, charging, ranged) are stored
 * as `system._bestial*` for display/roll-time use.
 */
export function applyBestialTraitBonuses(system, tier, baseTier) {
  const level = system.level || 1;
  const traits = getActiveBestialTraits(system);
  if (traits.length === 0) return;

  // Store on system for UI display
  system._activeBestialTraits = traits;

  for (const trait of traits) {
    switch (trait.id) {
      case "bestial_build":
        _applyBestialBuild(system, tier, trait.option);
        break;
      case "bestial_movement":
        _applyBestialMovement(system, tier, trait.option);
        break;
      case "bestial_alternate_sight":
        _applyAlternateSight(system);
        break;
      case "bestial_environmental_adaptability":
        _applyEnvironmentalAdaptability(system, tier, level, trait.option);
        break;
      case "bestial_return_to_heritage":
        _applyReturnToHeritage(system);
        break;
      case "bestial_treacherous_spikes":
        _applyTreacherousSpikes(system, tier);
        break;
      case "bestial_impaling_horns":
        _applyImpalingHorns(system, tier);
        break;
      // Traits that are rules text / maneuver access only (no stat automation):
      // bestial_claws, bestial_extra_limbs, bestial_fangs,
      // bestial_feast, bestial_tail, bestial_camouflage, bestial_weather_resilient
      default:
        break;
    }
  }
}

// ============================================================
// Individual trait automation
// ============================================================

/** Bestial Build: Thick Hide (+2T Soak, +1T Corp Save) or Slender (+1T DV, +1T Imp Save). */
function _applyBestialBuild(system, tier, option) {
  if (option === "thick_hide") {
    system.aptitudes.soakValue = (system.aptitudes.soakValue || 0) + 2 * tier;
    system.savingThrows.corporeal.total = (system.savingThrows.corporeal.total || 0) + tier;
  } else if (option === "slender") {
    system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + tier;
    system.savingThrows.impulsive.total = (system.savingThrows.impulsive.total || 0) + tier;
  }
}

/** Bestial Movement: +1(T) Speed in chosen environment. */
function _applyBestialMovement(system, tier, option) {
  // Speed bonus applied for non-Burrowing options
  // Environment condition is situational — player/GM tracks active environment
  if (option === "feral_agility" || option === "swimming" || option === "wings") {
    system.status.normalSpeed = (system.status.normalSpeed || 0) + tier;
    system.status.boostedSpeed = (system.status.boostedSpeed || 0) + tier;
  }
  // Store option for display
  system._bestialMovementOption = option || null;
}

/** Alternate Sight: +1 Perception dice score, +1 Dodge natural result. */
function _applyAlternateSight(system) {
  // Effect 1: improved sight rules (text only)
  // Effect 2: +1 Perception dice score
  system._bestialPerceptionBonus = (system._bestialPerceptionBonus || 0) + 1;
  // Effect 3: +1 Dodge natural result
  system._bestialDodgeNaturalBonus = (system._bestialDodgeNaturalBonus || 0) + 1;
}

/** Environmental Adaptability: +2 RLM (→ +2×PL LP), conditional DV, Aquatic Empowerment. */
function _applyEnvironmentalAdaptability(system, tier, level, option) {
  // Effect 1: +2 RLM → translates to +2*level LP (applied post-hoc since LP already calculated)
  system.lifePoints.max = (system.lifePoints.max || 0) + 2 * level;

  // Effect 2: +1(T) DV in chosen environment — stored as conditional
  if (option) {
    system._bestialEnvDVBonus = { environment: option, bonus: tier };
  }

  // Effect 3: Aquatic Empowerment — stored as flag (only for Underwater choice)
  if (option === "underwater_environment") {
    system._bestialAquaticEmpowerment = true;
  }
}

/** Return to Heritage: −1 Dodge crit target. Feral Fist access (text). */
function _applyReturnToHeritage(system) {
  system._bestialDodgeCritReduction = (system._bestialDodgeCritReduction || 0) + 1;
}

/** Treacherous Spikes: +2(T) DR vs ranged. */
function _applyTreacherousSpikes(system, tier) {
  system._bestialRangedDR = (system._bestialRangedDR || 0) + 2 * tier;
}

/** Impaling Horns: +2(T) Wound on Charging Assault. */
function _applyImpalingHorns(system, tier) {
  system._bestialChargingWoundBonus = (system._bestialChargingWoundBonus || 0) + 2 * tier;
}
