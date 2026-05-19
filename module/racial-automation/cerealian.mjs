/**
 * Cerealian Racial Trait Automation
 * Applies passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "cerealian".
 */

// Cerealian trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  evolvedRightEye: "6f30d6f788e0ab39",   // Primary
  crimsonGlare: "928e4dc0aa07187c",       // Primary
  pinpointCombat: "19a8af5fe5728e12",     // Secondary
  vitalPointAttack: "0694e60e98afeb2b",   // Secondary
  patientSniper: "b55b58685d0c399f",      // Secondary
  scarletSpotter: "da4b966bd48e53f0"      // Secondary
};

/**
 * Apply all automatable Cerealian racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyCerealianBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  const has = {
    evolvedRightEye: traitIds.includes(TRAIT_IDS.evolvedRightEye),
    crimsonGlare: traitIds.includes(TRAIT_IDS.crimsonGlare),
    pinpointCombat: traitIds.includes(TRAIT_IDS.pinpointCombat),
    vitalPointAttack: traitIds.includes(TRAIT_IDS.vitalPointAttack),
    patientSniper: traitIds.includes(TRAIT_IDS.patientSniper),
    scarletSpotter: traitIds.includes(TRAIT_IDS.scarletSpotter)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // ---- Evolved Right Eye L1: +2 Perception, -1 Crit Target ----
  let eyePerception = 0;
  let eyeCritReduction = 0;
  if (has.evolvedRightEye && !disabled.has(TRAIT_IDS.evolvedRightEye)) {
    eyePerception = 2;
    eyeCritReduction = 1;
    system.aptitudes.perceptionBonus = (system.aptitudes.perceptionBonus || 0) + eyePerception;
    system.aptitudes.critTargetReduction = (system.aptitudes.critTargetReduction || 0) + eyeCritReduction;
  }

  // ---- Evolved Right Eye L2: -1 Crit Target Strike/Wound Sig Tech ----
  let eyeSigTechCritReduction = 0;
  if (has.evolvedRightEye && !disabled.has(TRAIT_IDS.evolvedRightEye)) {
    eyeSigTechCritReduction = 1;
    system.aptitudes.sigTechCritTargetReduction = (system.aptitudes.sigTechCritTargetReduction || 0) + eyeSigTechCritReduction;
  }

  // ---- Pinpoint Combat L1: -1 Crit Target (range-dependent) ----
  let pinpointCritReduction = 0;
  if (has.pinpointCombat && !disabled.has(TRAIT_IDS.pinpointCombat)) {
    pinpointCritReduction = 1;
    system.aptitudes.pinpointRangeCritReduction = (system.aptitudes.pinpointRangeCritReduction || 0) + pinpointCritReduction;
  }

  // ---- Vital Point Attack L1: Called Shots ignore DR ----
  let vitalPointIgnoreDR = false;
  if (has.vitalPointAttack && !disabled.has(TRAIT_IDS.vitalPointAttack)) {
    vitalPointIgnoreDR = true;
    system.aptitudes.calledShotIgnoreDR = true;
  }

  // ---- Scarlet Spotter L1: +2(T) Wound on Exploit ----
  let scarletSpotterWound = 0;
  if (has.scarletSpotter && !disabled.has(TRAIT_IDS.scarletSpotter)) {
    scarletSpotterWound = 2 * tier;
    system.aptitudes.scarletSpotterExploitWound = (system.aptitudes.scarletSpotterExploitWound || 0) + scarletSpotterWound;
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Evolved Right Eye L3: 1/Round, 2/Encounter — force Crit
  if (has.evolvedRightEye && !disabled.has(TRAIT_IDS.evolvedRightEye)) {
    triggered.push({
      id: "ere_force_crit",
      name: "Evolved Right Eye (Force Critical)",
      description: "After rolling your Strike Roll for an Attacking Maneuver, you may declare that it is a Critical Result regardless of the Natural Result. If your result would have been a Botch Result, it is also no longer a Botch Result.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Crimson Glare L1: Triggered/Power — Strike boost
  if (has.crimsonGlare && !disabled.has(TRAIT_IDS.crimsonGlare)) {
    triggered.push({
      id: "cg_strike_boost",
      name: "Crimson Glare (Strike Boost)",
      description: `Pay ${4 * baseTier} [4(bT)] Ki Points. Your next Attacking Maneuver has its Strike Roll increased by ${2 * baseTier} [2(bT)]. This effect does not stack.`,
      usageLimit: null,
      maxUses: null
    });
    // L2: Triggered/Start of Combat Round, Resource — Observation stacks
    triggered.push({
      id: "cg_observation",
      name: "Crimson Glare (Observation Stacks)",
      description: `Place a stack of Observation (max. 2) on an Opponent you are not Oblivious of. When making an Attacking Maneuver, you may remove any number of Observation stacks from that Opponent to increase your Wound Roll by ${2 * tier} [2(T)] for each stack removed.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Pinpoint Combat L3: 1/Round — Crit damage category increase
  if (has.pinpointCombat && !disabled.has(TRAIT_IDS.pinpointCombat)) {
    triggered.push({
      id: "pc_crit_damage_cat",
      name: "Pinpoint Combat (Crit Damage Category)",
      description: `If you score a Critical Result on your Strike Roll for a Signature Technique, spend ${3 * baseTier} [3(bT)] Ki Points to increase the Damage Category of that Attacking Maneuver by 1.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Vital Point Attack L2: 1/Round — Observation for Called Shot
  if (has.vitalPointAttack && !disabled.has(TRAIT_IDS.vitalPointAttack)) {
    triggered.push({
      id: "vpa_called_shot",
      name: "Vital Point Attack (Free Called Shot)",
      description: "When you target an Opponent with 2+ stacks of Observation with an Attacking Maneuver, you may remove 2 stacks of Observation to turn this Attacking Maneuver into a Called Shot without paying an additional Action.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Patient Sniper L1: 1/Round — Exploit in ally's stead
  if (has.patientSniper && !disabled.has(TRAIT_IDS.patientSniper)) {
    triggered.push({
      id: "ps_ally_exploit",
      name: "Patient Sniper (Ally Exploit)",
      description: "If an Opponent uses an effect that would allow an Ally to use the Exploit Maneuver, you may use the Exploit Maneuver in your Ally's stead regardless of distance. You spend your Ally's Counter Action (requires their permission).",
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: 3/Encounter — Initiative swap
    triggered.push({
      id: "ps_initiative_swap",
      name: "Patient Sniper (Initiative Swap)",
      description: "Target an Ally with a lower Initiative than you. During this Combat Round, take your turn immediately after they end their turn instead of your usual place in the Initiative Order.",
      usageLimit: "3/Encounter",
      maxUses: 3
    });
  }

  // Scarlet Spotter L2: 1/Round — Exploit on avoided damage
  if (has.scarletSpotter && !disabled.has(TRAIT_IDS.scarletSpotter)) {
    triggered.push({
      id: "ss_exploit_on_avoid",
      name: "Scarlet Spotter (Exploit on Avoid)",
      description: "If you suffer no damage from an Opponent's Attacking Maneuver that targets you due to any reason, you may use the Exploit Maneuver as if they triggered its effects.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Store derived data for UI display
  system.cerealianBonuses = {
    has,
    eyePerception,
    eyeCritReduction,
    eyeSigTechCritReduction,
    pinpointCritReduction,
    vitalPointIgnoreDR,
    scarletSpotterWound,
    triggered
  };
}
