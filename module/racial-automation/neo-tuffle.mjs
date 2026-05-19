/**
 * Neo-Tuffle Racial Trait Automation
 * Applies passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "neoTuffle".
 */

// Neo-Tuffle trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  energyOfRevenge: "a83e407c476f57ba",
  tuffleSuperiority: "8f68eaed0157b011",
  legacyOfTheScholars: "a4b797ad22b4e2c6",
  violentRebuke: "b4c5b7c6cd2ce34c",
  manufacturedPhysique: "242d17645bc7b9f9",
  hateEmpowerment: "f6d0761ef25d8d1c",
  aggressiveDestruction: "84bf08a971dedcb5",
  powerHungry: "0ceb3546a1449c77",
  liquidForm: "0dda96aa0a5a229f"
};

/**
 * Apply all automatable Neo-Tuffle racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyNeoTuffleBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  const has = {
    energyOfRevenge: traitIds.includes(TRAIT_IDS.energyOfRevenge),
    tuffleSuperiority: traitIds.includes(TRAIT_IDS.tuffleSuperiority),
    legacyOfTheScholars: traitIds.includes(TRAIT_IDS.legacyOfTheScholars),
    violentRebuke: traitIds.includes(TRAIT_IDS.violentRebuke),
    manufacturedPhysique: traitIds.includes(TRAIT_IDS.manufacturedPhysique),
    hateEmpowerment: traitIds.includes(TRAIT_IDS.hateEmpowerment),
    aggressiveDestruction: traitIds.includes(TRAIT_IDS.aggressiveDestruction),
    powerHungry: traitIds.includes(TRAIT_IDS.powerHungry),
    liquidForm: traitIds.includes(TRAIT_IDS.liquidForm)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // Read Revenge Points tracking
  const revengePoints = system.tracking?.revengePoints ?? 0;

  // ---- Energy of Revenge L1: +1(T) Wound while 4+ Revenge Points ----
  let revengeWound = 0;
  if (has.energyOfRevenge && !disabled.has(TRAIT_IDS.energyOfRevenge) && revengePoints >= 4) {
    revengeWound = tier;
    system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + revengeWound;
  }

  // ---- Manufactured Physique L3: +1(bT) Soak ----
  let manufacturedSoak = 0;
  if (has.manufacturedPhysique && !disabled.has(TRAIT_IDS.manufacturedPhysique)) {
    manufacturedSoak = baseTier;
    system.status.soak = (system.status.soak || 0) + manufacturedSoak;
  }

  // ---- Hate Empowerment L1 (Hatred Embodiment): +1(T) Soak per 2 Revenge Points ----
  let hateSoak = 0;
  if (has.hateEmpowerment && !disabled.has(TRAIT_IDS.hateEmpowerment) && revengePoints >= 2) {
    hateSoak = Math.floor(revengePoints / 2) * tier;
    system.status.soak = (system.status.soak || 0) + hateSoak;
  }

  // ---- Power Hungry L1 (Parasite): +1(T) Defense per 2 Revenge Points ----
  let powerHungryDefense = 0;
  if (has.powerHungry && !disabled.has(TRAIT_IDS.powerHungry) && revengePoints >= 2) {
    powerHungryDefense = Math.floor(revengePoints / 2) * tier;
    system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + powerHungryDefense;
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Energy of Revenge L2: Resource — spend Revenge Points for Wound
  if (has.energyOfRevenge && !disabled.has(TRAIT_IDS.energyOfRevenge)) {
    triggered.push({
      id: "eor_revenge_wound",
      name: "Energy of Revenge (Spend for Wound)",
      description: `When making an Attacking Maneuver, you may spend any number of Revenge Points to increase your Wound Roll by ${tier} [1(T)] for each point spent. Double this effect if your Attacking Maneuver is an Ultimate Signature Technique.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Tuffle Superiority L1: 1/Round, Resource — Disdain stacks
  if (has.tuffleSuperiority && !disabled.has(TRAIT_IDS.tuffleSuperiority)) {
    triggered.push({
      id: "ts_disdain_stack",
      name: "Tuffle Superiority (Disdain Stack)",
      description: `If you knock an Opponent through a Health Threshold or Defeat them, gain 1 stack of Disdain (max. 2). For each stack, increase your Strike Rolls by ${tier} [1(T)].`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: 1/Encounter — Surging State on Disdain
    triggered.push({
      id: "ts_surging_state",
      name: "Tuffle Superiority (Surging State)",
      description: "When you gain a stack of Disdain, enter the Surging State until the end of next turn.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
    // L3: Start of Turn — Disdain for Revenge
    triggered.push({
      id: "ts_disdain_revenge",
      name: "Tuffle Superiority (Disdain for Revenge)",
      description: "You may remove 1 Disdain Stack to maximize your amount of Revenge Points.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Legacy of the Scholars L2: Triggered — Ascended Signature
  if (has.legacyOfTheScholars && !disabled.has(TRAIT_IDS.legacyOfTheScholars)) {
    triggered.push({
      id: "lots_ascended_sig",
      name: "Legacy of the Scholars (Ascended Signature)",
      description: "If you would use a Super Signature, you may spend 2 Revenge Points to apply the Ascended Signature Advantage to that Attacking Maneuver.",
      usageLimit: null,
      maxUses: null
    });
    // L3: 1/Encounter — free Defend on 3+ charges
    triggered.push({
      id: "lots_free_defend",
      name: "Legacy of the Scholars (Free Defend)",
      description: "When you are targeted by an Attacking Maneuver with 3+ Energy Charges, you may use the Defend Maneuver without spending a Counter Action.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Violent Rebuke L1: Triggered/Threshold
  if (has.violentRebuke && !disabled.has(TRAIT_IDS.violentRebuke)) {
    triggered.push({
      id: "vr_threshold_heal",
      name: "Violent Rebuke (Threshold Heal)",
      description: `Regain ${2 * baseTier}d6 [2d6(bT)] Life or Ki Points (you decide), increasing the Dice Score by either your Scholarship Modifier or Personality Modifier (whichever is higher).`,
      usageLimit: null,
      maxUses: null
    });
    // L2: 1/Round, 2/Encounter — counter-attack
    triggered.push({
      id: "vr_counter_attack",
      name: "Violent Rebuke (Counter-Attack)",
      description: "After completing an Opponent's Attacking Maneuver that targeted you, regardless of if it hits, you may make a Basic Attack Maneuver against them as an Out-of-Sequence Maneuver.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Hate Empowerment L3: Triggered — Revenge on Power Up/Charge
  if (has.hateEmpowerment && !disabled.has(TRAIT_IDS.hateEmpowerment)) {
    triggered.push({
      id: "he_powerup_revenge",
      name: "Hate Empowerment (Power Up Revenge)",
      description: "Gain 1 Revenge Point when you use the Power Up or Energy Charge Maneuver.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Aggressive Destruction L1: 1/Round
  if (has.aggressiveDestruction && !disabled.has(TRAIT_IDS.aggressiveDestruction)) {
    triggered.push({
      id: "ad_disdain_charge",
      name: "Aggressive Destruction (Disdain Charge)",
      description: "If you spend 2+ Revenge Points on an Attacking Maneuver and reduce your Revenge Points to 0, you may remove 1 stack of Disdain to gain a free Energy Charge on that Attacking Maneuver. You still possess the Disdain bonus for that Attacking Maneuver.",
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: 1/Round — spend Revenge for OoS attack
    triggered.push({
      id: "ad_revenge_attack",
      name: "Aggressive Destruction (Revenge Attack)",
      description: "You may spend 2 Revenge Points to make a Basic Attack Maneuver as an Out-of-Sequence Maneuver.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Power Hungry L2: 1/Round — Ki regain on Revenge spend
  if (has.powerHungry && !disabled.has(TRAIT_IDS.powerHungry)) {
    triggered.push({
      id: "ph_revenge_ki",
      name: "Power Hungry (Revenge Ki Regain)",
      description: `If you spend 2+ Revenge Points on an Attacking Maneuver and reduce your Revenge Points to 0, regain ${tier}d6 [1d6(T)] Ki Points after that Attacking Maneuver is completed.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L3: Triggered — Revenge on dodge
    triggered.push({
      id: "ph_dodge_revenge",
      name: "Power Hungry (Dodge Revenge)",
      description: "Gain 1 Revenge Point if you dodge an Opponent's Attacking Maneuver.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Store derived data for UI display
  system.neoTuffleBonuses = {
    has,
    revengePoints,
    revengeWound,
    manufacturedSoak,
    hateSoak,
    powerHungryDefense,
    triggered
  };
}
