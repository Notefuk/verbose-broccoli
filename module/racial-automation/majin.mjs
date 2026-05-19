/**
 * Majin Racial Trait Automation
 * Applies passive and calculated trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "majin".
 */

// Majin trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  rubberyBody: "3058f94a6c911274",        // Primary - Bouncy at L5
  fromGoop: "d12e93b84d4af193",           // Primary
  assimilation: "8fca55fce774af95",        // Secondary
  bouncyPhysique: "07cb182759347109",      // Secondary
  superRegeneration: "19061ba2dd882996",   // Secondary
  majinMassShift: "e5c8d1630d6ddc8a",     // Secondary
  transfigurationBeam: "4cf7c87134eae24c", // Secondary
  roomyBiology: "6bb70d2136b0ec3a",        // Secondary
  burrowedStrike: "d1c56084d492a719",      // Secondary
  detachedLimbs: "cd898cbc89426178",       // Secondary
  disarmingDemeanor: "ab0412c0c22a9199",   // Secondary
  elasticTentacle: "4dbaa89f8de16e87",     // Secondary
  goopThrow: "f9a6b865a089276b",           // Secondary
  majinMalice: "e42eb5f38af78925",         // Secondary
  majinSeeMajinDo: "5349cf3a064836be",     // Secondary
  majinStyle: "e30c268f801f1ea9",          // Secondary
  quickSleep: "ac3e9442e23a0206",          // Secondary
  revengeBomber: "b4956284112d9ade",       // Secondary
  steamingFury: "909af39631187b06"         // Secondary
};

/**
 * Apply all automatable Majin racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyMajinBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  // Track which traits are present
  const has = {
    rubberyBody: traitIds.includes(TRAIT_IDS.rubberyBody),
    fromGoop: traitIds.includes(TRAIT_IDS.fromGoop),
    assimilation: traitIds.includes(TRAIT_IDS.assimilation),
    bouncyPhysique: traitIds.includes(TRAIT_IDS.bouncyPhysique),
    superRegeneration: traitIds.includes(TRAIT_IDS.superRegeneration),
    majinMassShift: traitIds.includes(TRAIT_IDS.majinMassShift),
    transfigurationBeam: traitIds.includes(TRAIT_IDS.transfigurationBeam),
    roomyBiology: traitIds.includes(TRAIT_IDS.roomyBiology),
    burrowedStrike: traitIds.includes(TRAIT_IDS.burrowedStrike),
    detachedLimbs: traitIds.includes(TRAIT_IDS.detachedLimbs),
    disarmingDemeanor: traitIds.includes(TRAIT_IDS.disarmingDemeanor),
    elasticTentacle: traitIds.includes(TRAIT_IDS.elasticTentacle),
    goopThrow: traitIds.includes(TRAIT_IDS.goopThrow),
    majinMalice: traitIds.includes(TRAIT_IDS.majinMalice),
    majinSeeMajinDo: traitIds.includes(TRAIT_IDS.majinSeeMajinDo),
    majinStyle: traitIds.includes(TRAIT_IDS.majinStyle),
    quickSleep: traitIds.includes(TRAIT_IDS.quickSleep),
    revengeBomber: traitIds.includes(TRAIT_IDS.revengeBomber),
    steamingFury: traitIds.includes(TRAIT_IDS.steamingFury)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // ---- Rubbery Body L5 (Bouncy): +2(T) Soak, +1(T) Defense, +5(bT) extra Direct+ damage ----
  let bouncySoak = 0;
  let bouncyDefense = 0;
  let bouncyDirectVulnerability = 0;
  if (has.rubberyBody && !disabled.has(TRAIT_IDS.rubberyBody)) {
    bouncySoak = 2 * tier;
    bouncyDefense = tier;
    bouncyDirectVulnerability = 5 * baseTier;
    system.status.soak = (system.status.soak || 0) + bouncySoak;
    system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + bouncyDefense;
  }

  // ---- Assimilation L1: +1(T) Corporeal Save ----
  let assimilationCorporeal = 0;
  if (has.assimilation && !disabled.has(TRAIT_IDS.assimilation) && system.savingThrows?.corporeal !== undefined) {
    assimilationCorporeal = tier;
    system.savingThrows.corporeal.bonus += assimilationCorporeal;
  }

  // ---- Bouncy Physique L1: +2(T) Strike (Reflect only) ----
  let bouncyPhysiqueStrike = 0;
  if (has.bouncyPhysique && !disabled.has(TRAIT_IDS.bouncyPhysique)) {
    bouncyPhysiqueStrike = 2 * tier;
    system.aptitudes.reflectStrikeBonus = (system.aptitudes.reflectStrikeBonus || 0) + bouncyPhysiqueStrike;
  }

  // ---- Super Regeneration L1: +floor(Magic Mod / 2) Surgency ----
  // ---- Super Regeneration L2: +3(bT) LP at start of combat round ----
  let superRegenSurgency = 0;
  let superRegenLP = 0;
  if (has.superRegeneration && !disabled.has(TRAIT_IDS.superRegeneration)) {
    const maTotal = system.attributes.ma?.totalScore ?? system.attributes.ma?.score ?? 0;
    superRegenSurgency = Math.floor(maTotal / 2);
    superRegenLP = 3 * baseTier;

    // Update healing surge display string and power surge Ki
    if (superRegenSurgency !== 0) {
      const foTotal = (system.attributes.fo?.score ?? 0) + (system.attributes.fo?.modifier ?? 0);
      const totalSurgency = foTotal + superRegenSurgency;
      const surgStr = totalSurgency >= 0 ? `+${totalSurgency}` : `${totalSurgency}`;
      system.status.healingSurge = `${2 * tier}d10${surgStr}`;
      system.status.powerSurgeKi = Math.floor(system.kiPool.max / 4) + totalSurgency;
    }
  }

  // ---- Majin Mass-Shift L2: +1 Bluff, Persuasion, Intimidation ----
  // ---- Majin Mass-Shift L3: Size-dependent bonus ----
  let massShiftSkillBonus = 0;
  let massShiftSizeBonus = 0;
  let massShiftSizeEffect = "";
  if (has.majinMassShift && !disabled.has(TRAIT_IDS.majinMassShift)) {
    massShiftSkillBonus = 1; // +1 to Bluff/Persuasion/Intimidation dice score
    system.aptitudes.bluffPersuasionIntimidationBonus = (system.aptitudes.bluffPersuasionIntimidationBonus || 0) + massShiftSkillBonus;

    // Size-dependent bonus (L3)
    const size = (system.status?.currentSize || "medium").toLowerCase();
    const sizeOrder = ["tiny", "small", "medium", "large", "giant", "enormous", "colossal", "super_colossal"];
    const sizeIndex = sizeOrder.indexOf(size);
    const mediumIndex = sizeOrder.indexOf("medium");

    if (sizeIndex < mediumIndex && sizeIndex >= 0) {
      // Smaller than Medium: +1(bT) Soak
      massShiftSizeBonus = baseTier;
      massShiftSizeEffect = "soak";
      system.status.soak = (system.status.soak || 0) + massShiftSizeBonus;
    } else if (sizeIndex === mediumIndex) {
      // Medium: -1(T) Ki cost for Unique Abilities (display only)
      massShiftSizeBonus = tier;
      massShiftSizeEffect = "kiReduction";
    } else if (sizeIndex > mediumIndex) {
      // Larger than Medium: +1(bT) Defense
      massShiftSizeBonus = baseTier;
      massShiftSizeEffect = "defense";
      system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + massShiftSizeBonus;
    }
  }

  // ---- Transfiguration Beam L1: -1 Critical Target (Energy/Magic Strike) ----
  let transfigCritReduction = 0;
  if (has.transfigurationBeam && !disabled.has(TRAIT_IDS.transfigurationBeam)) {
    transfigCritReduction = 1;
    system.aptitudes.energyMagicStrikeCritReduction = (system.aptitudes.energyMagicStrikeCritReduction || 0) + transfigCritReduction;
  }

  // ---- Roomy Biology L1: +2 Racial Life Modifier ----
  // RLM is factored into LP earlier; re-apply the increase after the fact:
  // LP delta = level * roomyBiologyLifeMod (per LP formula in _calculateResources).
  let roomyBiologyLifeMod = 0;
  if (has.roomyBiology && !disabled.has(TRAIT_IDS.roomyBiology)) {
    roomyBiologyLifeMod = 2;
    const level = system.level || 1;
    system.lifePoints.max = (system.lifePoints.max || 0) + (level * roomyBiologyLifeMod);
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Rubbery Body L1: 1/Round — Healing Surge
  if (has.rubberyBody && !disabled.has(TRAIT_IDS.rubberyBody)) {
    triggered.push({
      id: "rb_healing_surge",
      name: "Rubbery Body (Healing Surge)",
      description: `Spend 1 Action and ${4 * baseTier} [4(bT)] Ki Points to use a Healing Surge.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L3: Triggered/Threshold — enhanced Healing Surge
    triggered.push({
      id: "rb_threshold_surge",
      name: "Rubbery Body (Threshold Surge)",
      description: `Use a Healing Surge as an Out-of-Sequence Maneuver and increase the Life Points recovered by ${3 * baseTier} [3(bT)]. Increase by an additional ${2 * baseTier} [2(bT)] for each Health Threshold you are below.`,
      usageLimit: null,
      maxUses: null
    });
    // L4: Triggered — Stretching Limb
    triggered.push({
      id: "rb_stretching_limb",
      name: "Rubbery Body (Stretching Limb)",
      description: "When making a Physical Attacking Maneuver or Grapple, you may increase your Melee Range by +3 Squares. Upon hitting or initiating a Grapple, you may move that Character up to your Melee Range in any direction. If initiating a Grapple, you can forgo this to increase your Grapple Checks by 1(bT).",
      usageLimit: null,
      maxUses: null
    });
  }

  // From Goop L1: 3/Round — create Goop
  if (has.fromGoop && !disabled.has(TRAIT_IDS.fromGoop)) {
    triggered.push({
      id: "fg_create_goop",
      name: "From Goop (Create Goop)",
      description: `Spend 1 Action and ${4 * baseTier} [4(bT)] Ki Points to create a Goop in an unoccupied adjacent Square. A Goop is a Duplicate Minion that can only use the Movement Maneuver (always has at least 1 Action).`,
      usageLimit: "3/Round",
      maxUses: 3
    });
    // L2: Triggered/Threshold — free Goop
    triggered.push({
      id: "fg_threshold_goop",
      name: "From Goop (Threshold Goop)",
      description: "Create a Goop for free in an unoccupied Square within a Large Sphere AoE (centered on you), as an Out-of-Sequence Maneuver.",
      usageLimit: null,
      maxUses: null
    });
    // L3: 1/Round — defeat Goop for heal
    triggered.push({
      id: "fg_absorb_goop",
      name: "From Goop (Absorb Goop)",
      description: "You may spend 1 Action to instantly Defeat a Goop that's not at Long Range. If you do, regain Life Points equal to 1/2 of the Life Points they had remaining.",
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L4: Triggered/Defeated — all Goops heal
    triggered.push({
      id: "fg_defeat_heal",
      name: "From Goop (Defeat Heal)",
      description: "All of your Goops are instantly Defeated and you regain Life Points equal to 1/2 of the total Life Points all Goops possessed. Then use a Healing Surge as an Out-of-Sequence Maneuver.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Bouncy Physique L2: 1/Round — move after hit
  if (has.bouncyPhysique && !disabled.has(TRAIT_IDS.bouncyPhysique)) {
    triggered.push({
      id: "bp_move_after_hit",
      name: "Bouncy Physique (Bounce Away)",
      description: "If you are hit by an Attacking Maneuver, after calculating Damage, you may move any number of Squares away from your Opponent in a straight line up to your Tenacity Modifier. This movement does not provoke the Exploit Maneuver.",
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L3: 1/Round — collision counter
    triggered.push({
      id: "bp_collision_counter",
      name: "Bouncy Physique (Collision Counter)",
      description: "If you receive Damage from Collision, you may end any movement you would normally suffer and immediately use the Movement Maneuver as an Out-of-Sequence Maneuver.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Super Regeneration L2: Triggered/Start of Combat Round (LP regen)
  if (has.superRegeneration && !disabled.has(TRAIT_IDS.superRegeneration)) {
    triggered.push({
      id: "sr_lp_regen",
      name: "Super Regeneration (LP Regen)",
      description: `Regain ${superRegenLP} [3(bT)] Life Points at the start of each Combat Round. This effect does not activate if you are Defeated or if you have 0 Ki Points.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Burrowed Strike L1: Triggered — ranged physical attack
  if (has.burrowedStrike && !disabled.has(TRAIT_IDS.burrowedStrike)) {
    triggered.push({
      id: "bs_ranged_physical",
      name: "Burrowed Strike (Ranged Physical)",
      description: "When making a Physical Attack, you may target any Opponent within the Standard Environment who is not at Long Range, ignoring Cover. This triggers the Exploit Maneuver for any Opponent on an adjacent Square.",
      usageLimit: null,
      maxUses: null
    });
    // L2: 1/Round — double Diminishing Defense
    triggered.push({
      id: "bs_double_diminishing",
      name: "Burrowed Strike (Double Diminishing)",
      description: `When making a Simple Profile Attacking Maneuver, you may spend ${2 * baseTier} [2(bT)] Ki Points to double the amount of Diminishing Defense your Opponent suffers.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Detached Limbs L2: 1/Round — attack from Goop
  if (has.detachedLimbs && !disabled.has(TRAIT_IDS.detachedLimbs)) {
    triggered.push({
      id: "dl_goop_attack",
      name: "Detached Limbs (Goop Attack)",
      description: `When making an Attacking Maneuver, you may spend ${2 * baseTier} [2(bT)] Ki Points to originate it from one of your Goops. Make an Impulsive Clash against the target(s). If you win, they have Guard Down against this Attacking Maneuver.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Disarming Demeanor L1: 1/Round — miss counter
  if (has.disarmingDemeanor && !disabled.has(TRAIT_IDS.disarmingDemeanor)) {
    triggered.push({
      id: "dd_miss_counter",
      name: "Disarming Demeanor (Miss Counter)",
      description: "If you fail to hit an Opponent with an Attacking Maneuver, make a Clash (Bluff vs Perception/Intuition). If you win, you may use the Basic Attack Maneuver against them as an Out-of-Sequence Maneuver.",
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: 1/Round — redirect attack
    triggered.push({
      id: "dd_redirect_attack",
      name: "Disarming Demeanor (Redirect Attack)",
      description: "If you are hit by an Opponent's Attacking Maneuver, make a Clash (Bluff vs Perception/Intuition). If you win, instead of taking Damage, the attack returns to Defense Declaration and you may dodge or counter again.",
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L3: 1/Encounter — cancel and redirect
    triggered.push({
      id: "dd_cancel_redirect",
      name: "Disarming Demeanor (Cancel & Redirect)",
      description: "If an Opponent uses a Counter Maneuver in response to your Attacking Maneuver, you may cancel your attack (regaining Ki spent) and use the Basic Attack or Signature Technique Maneuver instead. You may apply any Energy Charges to the new attack.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Elastic Tentacle L2: Triggered — tail attack strike
  if (has.elasticTentacle && !disabled.has(TRAIT_IDS.elasticTentacle)) {
    triggered.push({
      id: "et_tail_strike",
      name: "Elastic Tentacle (Tail Strike Boost)",
      description: `If you hit an Opponent with the Tail Attack Maneuver, your next Attacking Maneuver against them during this Combat Round has its Strike Roll increased by ${tier} [1(T)].`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Goop Throw L2: Triggered — place Goop at range
  if (has.goopThrow && !disabled.has(TRAIT_IDS.goopThrow)) {
    triggered.push({
      id: "gt_range_place",
      name: "Goop Throw (Range Placement)",
      description: "When making a Goop, rather than placing them adjacent to you, you can place that Goop on any unoccupied Square within a Destructive Sphere AoE (centered on you).",
      usageLimit: null,
      maxUses: null
    });
    // L3: 1/Round, 3/Encounter — Goop Grapple
    triggered.push({
      id: "gt_goop_grapple",
      name: "Goop Throw (Goop Grapple)",
      description: "If a Goop is placed adjacent to an Opponent through Goop Throw, the Goop may make the Grapple Maneuver as an Out-of-Sequence Maneuver.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Majin Malice L1: 1/Round, 3/Encounter — spend LP for OoS attack
  if (has.majinMalice && !disabled.has(TRAIT_IDS.majinMalice)) {
    triggered.push({
      id: "mm_lp_oos_attack",
      name: "Majin Malice (LP for OoS Attack)",
      description: `You may spend ${5 * baseTier} [5(bT)] Life Points to use the Basic Attack, Signature Technique or Energy Charge Maneuver as an Out-of-Sequence Maneuver.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: 1/Round, 3/Encounter — spend LP for Capacity
    triggered.push({
      id: "mm_lp_capacity",
      name: "Majin Malice (LP for Capacity)",
      description: `As an Instant Maneuver, you can spend up to ${20 * baseTier} [20(bT)] Life Points to increase your Capacity by half the amount lost. This can allow Capacity to exceed Max Capacity.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L3: 1/Encounter — Backlash for Wound on Ultimate
    triggered.push({
      id: "mm_backlash_wound",
      name: "Majin Malice (Backlash Wound)",
      description: `If you would use an Ultimate Signature Technique, you may apply up to 5 ranks of Backlash. For each rank, increase the Wound Roll by ${2 * tier} [2(T)].`,
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Majin See, Majin Do L3: 1/Encounter
  if (has.majinSeeMajinDo && !disabled.has(TRAIT_IDS.majinSeeMajinDo)) {
    triggered.push({
      id: "msmd_morale_guard_down",
      name: "Majin See, Majin Do (Morale Guard Down)",
      description: "When you target an Opponent with a Copied Technique, make a Morale Clash against them. If you win, they have Guard Down against this Attacking Maneuver.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Majin Style L2: 1/Round
  if (has.majinStyle && !disabled.has(TRAIT_IDS.majinStyle)) {
    triggered.push({
      id: "ms_costume_repair",
      name: "Majin Style (Costume Repair)",
      description: "If you use a Healing Surge while wearing your Default Costume, that piece of Apparel regains 1 Break Value. If it was broken, it stops being broken (0 → 1).",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Quick Sleep L2: 2/Encounter — Combat Recovery cost reduction
  if (has.quickSleep && !disabled.has(TRAIT_IDS.quickSleep)) {
    triggered.push({
      id: "qs_recovery_discount",
      name: "Quick Sleep (Recovery Discount)",
      description: "When using the Combat Recovery Maneuver, reduce the Action Cost by 1.",
      usageLimit: "2/Encounter",
      maxUses: 2
    });
    // L3: 1/Encounter — Sleeping heal
    triggered.push({
      id: "qs_sleeping_heal",
      name: "Quick Sleep (Sleeping Heal)",
      description: "At the end of your turn, you may gain the Sleeping Combat Condition until the start of your next turn. If you lose it through this effect, regain 1/4 of your Maximum Life Points and 1/4 of your Maximum Ki Points.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Revenge Bomber L2: 1/Encounter — Self-Explosion + Final Chance
  if (has.revengeBomber && !disabled.has(TRAIT_IDS.revengeBomber)) {
    triggered.push({
      id: "revb_self_explosion",
      name: "Revenge Bomber (Self-Explosion)",
      description: "When using an Explosion Profile Attacking Maneuver, you may apply the Self-Explosion Disadvantage to apply the Final Chance Advantage (even if it is not an Ultimate Signature Technique).",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
    // L3: Triggered/Defeated — self-heal on self-defeat
    triggered.push({
      id: "revb_defeated_heal",
      name: "Revenge Bomber (Defeated Heal)",
      description: `If you are Defeated by one of your effects reducing your Life Points to 0, immediately use a Healing Surge and increase the Dice Score by ${tier}d6 [1d6(T)].`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Steaming Fury L1: Triggered/Raging — Battle Weather
  if (has.steamingFury && !disabled.has(TRAIT_IDS.steamingFury)) {
    triggered.push({
      id: "stf_fog_weather",
      name: "Steaming Fury (Fog Weather)",
      description: "Within a Standard Sphere AoE centered on you, apply the Fog Battle Weather and the Obscuring Fog Weather Effect.",
      usageLimit: null,
      maxUses: null
    });
    // L2: 3/Encounter — enter Raging
    triggered.push({
      id: "stf_enter_raging",
      name: "Steaming Fury (Enter Raging)",
      description: "Enter the Raging State until the end of your next turn.",
      usageLimit: "3/Encounter",
      maxUses: 3
    });
  }

  // Store derived data for UI display
  system.majinBonuses = {
    has,
    bouncySoak,
    bouncyDefense,
    bouncyDirectVulnerability,
    assimilationCorporeal,
    bouncyPhysiqueStrike,
    superRegenSurgency,
    superRegenLP,
    massShiftSkillBonus,
    massShiftSizeBonus,
    massShiftSizeEffect,
    transfigCritReduction,
    roomyBiologyLifeMod,
    triggered
  };
}
