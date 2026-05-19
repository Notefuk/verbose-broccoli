/**
 * Undead Racial Trait Automation
 * Applies passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "undead".
 */

// Undead trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  undeadSurvival: "fff60ceb27ae04d1",
  rebornWarrior: "b3a0392ee2e0a3c2"
};

/**
 * Apply all automatable Undead racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyUndeadBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  const has = {
    undeadSurvival: traitIds.includes(TRAIT_IDS.undeadSurvival),
    rebornWarrior: traitIds.includes(TRAIT_IDS.rebornWarrior)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // ---- Undead Survival L2: +2 Steadfast Check dice score ----
  let survivalSteadfast = 0;
  if (has.undeadSurvival && !disabled.has(TRAIT_IDS.undeadSurvival)) {
    survivalSteadfast = 2;
    system.aptitudes.steadfastBonus = (system.aptitudes.steadfastBonus || 0) + survivalSteadfast;
  }

  // ---- Undead Survival L3: +3(T) Wound in Undying State ----
  let undyingWound = 0;
  if (has.undeadSurvival && !disabled.has(TRAIT_IDS.undeadSurvival)) {
    undyingWound = 3 * tier;
    if (system.combatStates?.undying) {
      system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + undyingWound;
    }
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Undead Survival L3: Triggered/Undying State — Wound bonus (display already tracked)
  if (has.undeadSurvival && !disabled.has(TRAIT_IDS.undeadSurvival)) {
    triggered.push({
      id: "us_undying_wound",
      name: "Undead Survival (Undying Wound)",
      description: `While in the Undying State, increase your Wound Rolls by ${undyingWound} [3(T)].`,
      usageLimit: null,
      maxUses: null
    });
    // L4: Triggered/Defeated — enter Undying State
    triggered.push({
      id: "us_auto_undying",
      name: "Undead Survival (Auto Undying)",
      description: "Enter the Undying State until the end of the Combat Encounter.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Store derived data for UI display
  system.undeadBonuses = {
    has,
    survivalSteadfast,
    undyingWound,
    triggered
  };
}
