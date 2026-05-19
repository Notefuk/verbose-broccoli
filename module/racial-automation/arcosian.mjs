/**
 * Arcosian Racial Trait Automation
 * Applies passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "arcosian".
 *
 * Option-based traits use tracked field:
 *   system.keratinousPlatingOption
 */

// Arcosian trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  divergentEvolution: "b252198d4bafa7c6",
  cruelIntentions: "db303ead803660ff",
  brutalAssault: "5ceb34c3f395e78c",
  prehensileTail: "bd980bd281177497",
  survivor: "c4178c86cbd7864d",
  keratinousPlating: "04608f3cb55d47a1"
};

/**
 * Apply all automatable Arcosian racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyArcosianBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  const has = {
    divergentEvolution: traitIds.includes(TRAIT_IDS.divergentEvolution),
    cruelIntentions: traitIds.includes(TRAIT_IDS.cruelIntentions),
    brutalAssault: traitIds.includes(TRAIT_IDS.brutalAssault),
    prehensileTail: traitIds.includes(TRAIT_IDS.prehensileTail),
    survivor: traitIds.includes(TRAIT_IDS.survivor),
    keratinousPlating: traitIds.includes(TRAIT_IDS.keratinousPlating)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // ---- Survivor L1: +1 Steadfast Check dice score ----
  let survivorSteadfast = 0;
  if (has.survivor && !disabled.has(TRAIT_IDS.survivor)) {
    survivorSteadfast = 1;
    system.aptitudes.steadfastBonus = (system.aptitudes.steadfastBonus || 0) + survivorSteadfast;
  }

  // ---- Keratinous Plating L3: +1(bT) Soak ----
  let platingBaseSoak = 0;
  if (has.keratinousPlating && !disabled.has(TRAIT_IDS.keratinousPlating)) {
    platingBaseSoak = baseTier;
    system.status.soak = (system.status.soak || 0) + platingBaseSoak;
  }

  // ---- Keratinous Plating L4 Option ----
  // UI writes selection to `racialOptionSelections[traitId][effectLevel]` as the catalog option name.
  // Legacy `system.keratinousPlatingOption` is kept as a fallback for older saves.
  const platRaw = (system.racialOptionSelections?.[TRAIT_IDS.keratinousPlating]?.["4"]
                ?? system.racialOptionSelections?.[TRAIT_IDS.keratinousPlating]?.[4]
                ?? system.keratinousPlatingOption
                ?? "none");
  const platingOpt = String(platRaw).toLowerCase();
  let platingDenseDR = 0;
  let platingSleekDefense = 0;
  let platingRoyalStress = 0;
  let platingCombatWound = 0;
  if (has.keratinousPlating && !disabled.has(TRAIT_IDS.keratinousPlating) && platingOpt !== "none") {
    if (platingOpt.includes("dense")) {
      platingDenseDR = baseTier;
      system.status.dr = (system.status.dr || 0) + platingDenseDR;
    } else if (platingOpt.includes("sleek")) {
      platingSleekDefense = baseTier;
      system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + platingSleekDefense;
    } else if (platingOpt.includes("royal")) {
      platingRoyalStress = tier >= 5 ? 2 : 1;
      system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + platingRoyalStress;
    } else if (platingOpt.includes("combat")) {
      platingCombatWound = 2 * baseTier;
      system.aptitudes.combatPlatingWoundBonus = (system.aptitudes.combatPlatingWoundBonus || 0) + platingCombatWound;
    }
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Cruel Intentions L1: Resource — Cruelty Stack system
  if (has.cruelIntentions && !disabled.has(TRAIT_IDS.cruelIntentions)) {
    triggered.push({
      id: "ci_cruelty_stack",
      name: "Cruel Intentions (Cruelty Stacks)",
      description: `If you hit any number of Opponents with an Attacking Maneuver, gain 1 Cruelty Stack (max. 3). For each Cruelty Stack, increase your Wound Rolls by ${tier} [1(T)]. You lose all Cruelty Stacks at the end of each of your turns.`,
      usageLimit: null,
      maxUses: null
    });
    // L2: Triggered — Superior State on threshold/defeat
    triggered.push({
      id: "ci_superior_state",
      name: "Cruel Intentions (Superior State)",
      description: "If you knock an Opponent through a Health Threshold or Defeat them with an Attacking Maneuver, enter the Superior State until the end of your turn.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Brutal Assault L1: 1/Round
  if (has.brutalAssault && !disabled.has(TRAIT_IDS.brutalAssault)) {
    triggered.push({
      id: "ba_wound_bonus",
      name: "Brutal Assault (Triple Hit)",
      description: `At Attack Declaration, if you have previously hit an Opponent with an Attacking Maneuver twice in this Combat Round, you may increase the Wound Roll of your chosen Attacking Maneuver by ${tier}d6 [1d6(T)].`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: 1/Round — Energy Charge shortcut
    triggered.push({
      id: "ba_energy_charge",
      name: "Brutal Assault (Energy Charge Shortcut)",
      description: "If you have used the Energy Charge Maneuver twice in a row during this Combat Round, you may use Brutal Assault as if you had met the requirements, but only for the Attacking Maneuver declared by the Energy Charge Maneuver.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Prehensile Tail L2: Triggered
  if (has.prehensileTail && !disabled.has(TRAIT_IDS.prehensileTail)) {
    triggered.push({
      id: "pt_tail_push",
      name: "Prehensile Tail (Tail Push)",
      description: "If you hit an Opponent with the Tail Attack Maneuver, you may move them a Square in any direction (except vertical). This effect applies immediately after they receive the Damage and before any other effects.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Survivor L3: Triggered/Threshold
  if (has.survivor && !disabled.has(TRAIT_IDS.survivor)) {
    triggered.push({
      id: "surv_max_cruelty",
      name: "Survivor (Maximize Cruelty)",
      description: "If you succeed at the Steadfast Check for this Health Threshold, maximize your Cruelty Stacks.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Store derived data for UI display
  system.arcosianBonuses = {
    has,
    platingOpt,
    survivorSteadfast,
    platingBaseSoak,
    platingDenseDR,
    platingSleekDefense,
    platingRoyalStress,
    platingCombatWound,
    triggered
  };
}
