/**
 * Namekian Racial Trait Automation
 * Applies passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "namekian".
 *
 * Option-based traits use tracked fields:
 *   system.refinedCombatOption, system.spiritOfNamekOption
 */

// Namekian trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  namekianBiology: "33f9e9581a830c23",    // Primary
  intelligentFighter: "57aee2759d783983",  // Primary
  namekianTechniques: "a359034777150c53",  // Secondary
  telepathicWarning: "efba71c1a1831243",   // Secondary
  namekianResilience: "b40813884d50c097",  // Secondary
  refinedCombat: "623d5466880783be",       // Secondary (Warrior Clan)
  namekianProtector: "472bc29e0123fef6",   // Secondary
  spiritOfNamek: "a7855fd558b2ff72",       // Secondary (Dragon Clan)
  pacifisticTeachings: "6e733a24a3798094", // Secondary
  soulDenier: "14c058ac7504e6bf",          // Secondary (Demon Clan)
  demonicPower: "6a8e7c522f93f000"         // Secondary (Demon Clan)
};

/**
 * Apply all automatable Namekian racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyNamekianBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  const has = {
    namekianBiology: traitIds.includes(TRAIT_IDS.namekianBiology),
    intelligentFighter: traitIds.includes(TRAIT_IDS.intelligentFighter),
    namekianTechniques: traitIds.includes(TRAIT_IDS.namekianTechniques),
    telepathicWarning: traitIds.includes(TRAIT_IDS.telepathicWarning),
    namekianResilience: traitIds.includes(TRAIT_IDS.namekianResilience),
    refinedCombat: traitIds.includes(TRAIT_IDS.refinedCombat),
    namekianProtector: traitIds.includes(TRAIT_IDS.namekianProtector),
    spiritOfNamek: traitIds.includes(TRAIT_IDS.spiritOfNamek),
    pacifisticTeachings: traitIds.includes(TRAIT_IDS.pacifisticTeachings),
    soulDenier: traitIds.includes(TRAIT_IDS.soulDenier),
    demonicPower: traitIds.includes(TRAIT_IDS.demonicPower)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // ---- Namekian Biology L2: +3(bT) LP at start of combat round ----
  let biologyLPPerRound = 0;
  if (has.namekianBiology && !disabled.has(TRAIT_IDS.namekianBiology)) {
    biologyLPPerRound = 3 * baseTier;
    system.aptitudes.namekianBiologyLPRegen = (system.aptitudes.namekianBiologyLPRegen || 0) + biologyLPPerRound;
  }

  // ---- Namekian Biology L4: -1 Crit Target Clairvoyance/Perception ----
  let biologyCritReduction = 0;
  if (has.namekianBiology && !disabled.has(TRAIT_IDS.namekianBiology)) {
    biologyCritReduction = 1;
    system.aptitudes.perceptionCritReduction = (system.aptitudes.perceptionCritReduction || 0) + biologyCritReduction;
    system.aptitudes.clairvoyanceCritReduction = (system.aptitudes.clairvoyanceCritReduction || 0) + biologyCritReduction;
  }

  // ---- Intelligent Fighter L1: +1 Dice Score Insight/Scholarship skills ----
  let intelligentFighterSkillDice = 0;
  if (has.intelligentFighter && !disabled.has(TRAIT_IDS.intelligentFighter)) {
    intelligentFighterSkillDice = 1;
    system.aptitudes.insightScholarshipSkillBonus = (system.aptitudes.insightScholarshipSkillBonus || 0) + intelligentFighterSkillDice;
  }

  // ---- Namekian Techniques L3: +3 Technique Points from Skill Improvements ----
  let techniquesTP = 0;
  if (has.namekianTechniques && !disabled.has(TRAIT_IDS.namekianTechniques)) {
    techniquesTP = 3;
    system.aptitudes.techniquePointsPerSkillImprovement = (system.aptitudes.techniquePointsPerSkillImprovement || 0) + techniquesTP;
  }

  // ---- Namekian Resilience L1: +1 Steadfast Check dice score ----
  let resilienceSteadfast = 0;
  if (has.namekianResilience && !disabled.has(TRAIT_IDS.namekianResilience)) {
    resilienceSteadfast = 1;
    system.aptitudes.steadfastBonus = (system.aptitudes.steadfastBonus || 0) + resilienceSteadfast;
  }

  // ---- Refined Combat L2 Option (Warrior Clan) ----
  // UI writes to racialOptionSelections[traitId][effectLevel] — catalog L2 effect.
  const refinedRaw = (system.racialOptionSelections?.[TRAIT_IDS.refinedCombat]?.["2"]
                   ?? system.racialOptionSelections?.[TRAIT_IDS.refinedCombat]?.[2]
                   ?? system.refinedCombatOption ?? "none");
  const refinedOpt = String(refinedRaw).toLowerCase();
  let refinedGrapple = 0;
  let refinedSoak = 0;
  let refinedDefense = 0;
  let refinedWoundPhysical = 0;
  let refinedWoundEnergy = 0;
  let refinedWoundSigTech = 0;
  if (has.refinedCombat && !disabled.has(TRAIT_IDS.refinedCombat) && refinedOpt !== "none") {
    if (refinedOpt.includes("hand to hand") || refinedOpt === "handtohand") {
      refinedWoundPhysical = tier;
      system.aptitudes.refinedPhysicalWoundBonus = (system.aptitudes.refinedPhysicalWoundBonus || 0) + refinedWoundPhysical;
    } else if (refinedOpt.includes("blaster")) {
      refinedWoundEnergy = tier;
      system.aptitudes.refinedEnergyWoundBonus = (system.aptitudes.refinedEnergyWoundBonus || 0) + refinedWoundEnergy;
    } else if (refinedOpt.includes("grappler")) {
      refinedGrapple = tier;
      system.aptitudes.refinedGrappleBonus = (system.aptitudes.refinedGrappleBonus || 0) + refinedGrapple;
    } else if (refinedOpt.includes("defender")) {
      refinedSoak = tier;
      system.status.soak = (system.status.soak || 0) + refinedSoak;
    } else if (refinedOpt.includes("power channeler") || refinedOpt === "powerchanneler") {
      refinedWoundSigTech = 2 * tier;
      system.aptitudes.signatureTechniqueWoundBonus = (system.aptitudes.signatureTechniqueWoundBonus || 0) + refinedWoundSigTech;
    } else if (refinedOpt.includes("high-speed") || refinedOpt.includes("high speed") || refinedOpt === "highspeed") {
      refinedDefense = baseTier;
      system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + refinedDefense;
    }
  }

  // ---- Spirit of Namek L2 Option (Dragon Clan) ----
  const spiritRaw = (system.racialOptionSelections?.[TRAIT_IDS.spiritOfNamek]?.["2"]
                  ?? system.racialOptionSelections?.[TRAIT_IDS.spiritOfNamek]?.[2]
                  ?? system.spiritOfNamekOption ?? "none");
  const spiritOpt = String(spiritRaw).toLowerCase();
  let spiritWoundMagical = 0;
  if (has.spiritOfNamek && !disabled.has(TRAIT_IDS.spiritOfNamek) && spiritOpt !== "none") {
    if (spiritOpt.includes("caster")) {
      spiritWoundMagical = tier;
      system.aptitudes.spiritMagicalWoundBonus = (system.aptitudes.spiritMagicalWoundBonus || 0) + spiritWoundMagical;
    }
    // healer/supporter = display only or triggered
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Namekian Biology L1: 1/Round — Healing Surge (with escalating cost)
  if (has.namekianBiology && !disabled.has(TRAIT_IDS.namekianBiology)) {
    triggered.push({
      id: "nb_healing_surge",
      name: "Namekian Biology (Healing Surge)",
      description: `Spend 1 Action and ${4 * baseTier} [4(bT)] Ki Points to use a Healing Surge. Each time you use this effect after the first, increase the Ki Point Cost by an additional ${2 * baseTier} [2(bT)] Ki Points for the remainder of the Combat Encounter.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: Triggered/Start of Combat Round — LP regen (display)
    triggered.push({
      id: "nb_lp_regen",
      name: "Namekian Biology (LP Regen)",
      description: `Regain ${biologyLPPerRound} [3(bT)] Life Points at the start of each Combat Round. This effect does not activate if you have 0 Ki Points.`,
      usageLimit: null,
      maxUses: null
    });
    // L3: Triggered — Stretching Limb
    triggered.push({
      id: "nb_stretching_limb",
      name: "Namekian Biology (Stretching Limb)",
      description: "When making any type of Physical Attacking Maneuver or Grapple Maneuver, you may increase your Melee Range by +3 Squares. Upon hitting or initiating a Grapple, you may move that Character any number of Squares up to your current Melee Range in any direction. If you initiate a Grapple, you can forgo this to increase your Grapple Checks by 1(bT).",
      usageLimit: null,
      maxUses: null
    });
  }

  // Intelligent Fighter L2: Resource — Studied stacks
  if (has.intelligentFighter && !disabled.has(TRAIT_IDS.intelligentFighter)) {
    triggered.push({
      id: "if_studied_stacks",
      name: "Intelligent Fighter (Studied Stacks)",
      description: `At the end of each Combat Round, all Opponents that have used at least 1 Attacking Maneuver gain a stack of Studied (max. 2 per Opponent). For each stack of Studied, increase your Strike Rolls against that Opponent by ${tier} [1(T)].`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Telepathic Warning L2: 2/Round
  if (has.telepathicWarning && !disabled.has(TRAIT_IDS.telepathicWarning)) {
    triggered.push({
      id: "tw_dodge_boost",
      name: "Telepathic Warning (Dodge Boost)",
      description: `If an Opponent targets you and/or an Ally with an Attacking Maneuver, you may increase the Dodge Roll of yourself and any Allies targeted by ${tier} [1(T)] for that Attacking Maneuver.`,
      usageLimit: "2/Round",
      maxUses: 2
    });
    // L3: 1/Round — spend Counter Action for extra dodge
    triggered.push({
      id: "tw_counter_dodge",
      name: "Telepathic Warning (Counter Dodge)",
      description: `When you trigger Telepathic Warning, you may spend a Counter Action to increase the bonus to Dodge Rolls by an additional ${2 * tier} [2(T)].`,
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Namekian Resilience L2: 1/Encounter
  if (has.namekianResilience && !disabled.has(TRAIT_IDS.namekianResilience)) {
    triggered.push({
      id: "nr_steadfast_transform",
      name: "Namekian Resilience (Steadfast Transform)",
      description: "When you pass a Steadfast Check, you may use the Power Up Maneuver or Transformation Maneuver as an Out-of-Sequence Maneuver.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Refined Combat options: Triggered effects that interact with Studied stacks
  if (has.refinedCombat && !disabled.has(TRAIT_IDS.refinedCombat) && refinedOpt !== "none") {
    if (refinedOpt === "handToHand") {
      triggered.push({
        id: "rc_hth_studied",
        name: "Refined Combat: Hand to Hand (Studied Spend)",
        description: `When you hit an Opponent with a Physical Attack, you may spend any number of Studied stacks on that Opponent to increase the Wound Roll by ${2 * tier} [2(T)] for each stack spent.`,
        usageLimit: null,
        maxUses: null
      });
    } else if (refinedOpt === "blaster") {
      triggered.push({
        id: "rc_blaster_studied",
        name: "Refined Combat: Blaster (Studied Spend)",
        description: `When you hit an Opponent with an Energy Attack, you may spend any number of Studied stacks on that Opponent to increase the Wound Roll by ${2 * tier} [2(T)] for each stack spent.`,
        usageLimit: null,
        maxUses: null
      });
    } else if (refinedOpt === "grappler") {
      triggered.push({
        id: "rc_grappler_pin",
        name: "Refined Combat: Grappler (Studied Pin)",
        description: "If you successfully initiate a Grapple with an Opponent outside of your base Melee Range, you may remove 2 stacks of Studied to use the Pin Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: null,
        maxUses: null
      });
    } else if (refinedOpt === "defender") {
      triggered.push({
        id: "rc_defender_studied",
        name: "Refined Combat: Defender (Studied Soak)",
        description: `When you are hit by an attack, you can remove any number of Studied stacks from the attacker to reduce the damage by ${3 * tier} [3(T)] for each stack removed.`,
        usageLimit: null,
        maxUses: null
      });
    } else if (refinedOpt === "powerChanneler") {
      triggered.push({
        id: "rc_channeler_charge",
        name: "Refined Combat: Power Channeler (Free Charge)",
        description: "If you target an Opponent with the Signature Technique Maneuver, you may remove 2 Studied stacks to gain a free Energy Charge (counts toward Mandatory Charge Disadvantage).",
        usageLimit: null,
        maxUses: null
      });
    } else if (refinedOpt === "highSpeed") {
      triggered.push({
        id: "rc_highspeed_dodge",
        name: "Refined Combat: High-Speed (Studied Dodge)",
        description: `When using Telepathic Warning against an attacker with 2+ Studied stacks, you may remove any number of Studied Stacks. For every stack removed after the first, increase the Dodge bonus by ${tier} [1(T)].`,
        usageLimit: null,
        maxUses: null
      });
    }
  }

  // Spirit of Namek options: triggered effects
  if (has.spiritOfNamek && !disabled.has(TRAIT_IDS.spiritOfNamek) && spiritOpt !== "none") {
    if (spiritOpt === "caster") {
      triggered.push({
        id: "son_caster_studied",
        name: "Spirit of Namek: Caster (Studied Spend)",
        description: `When you hit an Opponent with a Magical Attack, you may spend any number of Studied stacks to increase the Wound Roll by ${2 * tier} [2(T)] for each stack spent.`,
        usageLimit: null,
        maxUses: null
      });
    } else if (spiritOpt === "supporter") {
      triggered.push({
        id: "son_supporter_cleanse",
        name: "Spirit of Namek: Supporter (Cleanse)",
        description: `You may spend 1 Action and ${4 * tier} [4(T)] Ki Points to remove a Combat Condition from yourself or an Ally within your Melee Range.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
    }
  }

  // Namekian Protector L2: 2/Encounter
  if (has.namekianProtector && !disabled.has(TRAIT_IDS.namekianProtector)) {
    triggered.push({
      id: "np_steadfast_studied",
      name: "Namekian Protector (Steadfast Studied)",
      description: "When you pass a Steadfast Check, you may immediately place a stack of Studied on an Opponent of your choice.",
      usageLimit: "2/Encounter",
      maxUses: 2
    });
  }

  // Pacifistic Teachings L2: 2/Encounter
  if (has.pacifisticTeachings && !disabled.has(TRAIT_IDS.pacifisticTeachings)) {
    triggered.push({
      id: "pt_steadfast_heal",
      name: "Pacifistic Teachings (Steadfast Heal)",
      description: `When you pass a Steadfast Check, regain ${9 * baseTier} [9(bT)] Life Points.`,
      usageLimit: "2/Encounter",
      maxUses: 2
    });
  }

  // Soul Denier L1: 2/Encounter
  if (has.soulDenier && !disabled.has(TRAIT_IDS.soulDenier)) {
    triggered.push({
      id: "sd_threshold_surge",
      name: "Soul Denier (Threshold Power Surge)",
      description: "If you or one of your Minions knocks an Opponent through a Health Threshold or Defeats them with an Attacking Maneuver, you may immediately use a Power Surge as an Out-of-Sequence Maneuver.",
      usageLimit: "2/Encounter",
      maxUses: 2
    });
  }

  // Demonic Power L1: 2/Encounter
  if (has.demonicPower && !disabled.has(TRAIT_IDS.demonicPower)) {
    triggered.push({
      id: "demonic_steadfast_attack",
      name: "Demonic Power (Steadfast Attack)",
      description: "When you pass a Steadfast Check, you may remove 1 stack of Studied from an Opponent to make a Basic Attack or Signature Attack Maneuver as an Out-of-Sequence Maneuver against that Opponent.",
      usageLimit: "2/Encounter",
      maxUses: 2
    });
  }

  // Store derived data for UI display
  system.namekianBonuses = {
    has,
    refinedOpt,
    spiritOpt,
    biologyLPPerRound,
    biologyCritReduction,
    intelligentFighterSkillDice,
    techniquesTP,
    resilienceSteadfast,
    refinedGrapple,
    refinedSoak,
    refinedDefense,
    refinedWoundPhysical,
    refinedWoundEnergy,
    refinedWoundSigTech,
    spiritWoundMagical,
    triggered
  };
}
