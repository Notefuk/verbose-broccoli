/**
 * Shinjin Racial Trait Automation
 * Applies passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "shinjin".
 *
 * Option-based traits use tracked fields:
 *   system.lightMagicOption, system.darkMagicOption
 * Also reads from system.racialOptionSelections (Traits tab) as fallback.
 */

// Map catalog option names → internal short keys
const LIGHT_OPTION_MAP = {
  "God of Peace": "peace",
  "God of Judgment": "judgment",
  "God of Power": "power",
  "God of Speed": "speed",
  "God of War": "war",
  "God of Magic": "magic",
  "God of Time": "time"
};
const DARK_OPTION_MAP = {
  "Kiri Drain": "kiriDrain",
  "Powerful Demon": "powerful",
  "Eternal Demon": "eternal",
  "Manipulative Demon": "manipulative",
  "Transforming Demon": "transforming",
  "Elemental Demon": "elemental",
  "Commanding Demon": "commanding"
};

// Shinjin trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  skillOfTheWatcher: "9da7132a0b84c1de",
  cosmicEfficiency: "1846faa710aba23b",
  celestialPotential: "66d18f28f3c609ef",
  arcaneAffinity: "8d3462414f48349d",
  farSeeing: "f503c65cab8f5217",
  lightMagic: "6242c77e7003574f",
  heavenlyAdvantage: "181248c7aa02ced6",
  darkMagic: "1306942c7951ed64",
  demonicAdvantage: "1ae965018457d2fe"
};

/**
 * Apply all automatable Shinjin racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyShinjinBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  const has = {
    skillOfTheWatcher: traitIds.includes(TRAIT_IDS.skillOfTheWatcher),
    cosmicEfficiency: traitIds.includes(TRAIT_IDS.cosmicEfficiency),
    celestialPotential: traitIds.includes(TRAIT_IDS.celestialPotential),
    arcaneAffinity: traitIds.includes(TRAIT_IDS.arcaneAffinity),
    farSeeing: traitIds.includes(TRAIT_IDS.farSeeing),
    lightMagic: traitIds.includes(TRAIT_IDS.lightMagic),
    heavenlyAdvantage: traitIds.includes(TRAIT_IDS.heavenlyAdvantage),
    darkMagic: traitIds.includes(TRAIT_IDS.darkMagic),
    demonicAdvantage: traitIds.includes(TRAIT_IDS.demonicAdvantage)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // ---- Cosmic Efficiency L2: +ceil(IN mod / 4) Defense ----
  let cosmicDefense = 0;
  if (has.cosmicEfficiency && !disabled.has(TRAIT_IDS.cosmicEfficiency)) {
    const inTotal = system.attributes.in?.totalScore ?? system.attributes.in?.score ?? 0;
    cosmicDefense = Math.ceil(inTotal / 4);
    if (cosmicDefense > 0) {
      system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + cosmicDefense;
    }
  }

  // ---- Cosmic Efficiency L3: -2(T) Ki Point Cost attacking ----
  let cosmicKiReduction = 0;
  if (has.cosmicEfficiency && !disabled.has(TRAIT_IDS.cosmicEfficiency)) {
    cosmicKiReduction = 2 * tier;
    system.aptitudes.attackKiCostReduction = (system.aptitudes.attackKiCostReduction || 0) + cosmicKiReduction;
  }

  // ---- Arcane Affinity L2: -1 Crit Target Clairvoyance/Perception ----
  let arcaneCritReduction = 0;
  if (has.arcaneAffinity && !disabled.has(TRAIT_IDS.arcaneAffinity)) {
    arcaneCritReduction = 1;
    system.aptitudes.perceptionCritReduction = (system.aptitudes.perceptionCritReduction || 0) + arcaneCritReduction;
    system.aptitudes.clairvoyanceCritReduction = (system.aptitudes.clairvoyanceCritReduction || 0) + arcaneCritReduction;
  }

  // ---- Resolve options from Combat tab field OR Traits tab racialOptionSelections ----
  const optSel = system.racialOptionSelections || {};

  // ---- Light Magic L1 Option (Kaio) ----
  let lightOpt = system.lightMagicOption || "none";
  if (lightOpt === "none" && has.lightMagic && !disabled.has(TRAIT_IDS.lightMagic)) {
    const sel = optSel[TRAIT_IDS.lightMagic];
    const catalogName = sel?.["1"] ?? sel?.[1] ?? "";
    if (catalogName) lightOpt = LIGHT_OPTION_MAP[catalogName] || "none";
  }
  let lightPeaceMoraleSave = 0;
  let lightPowerDodge = 0;
  let lightSpeedWound = 0;
  let lightWarWound = 0;
  let lightWarWeaponSpecialist = false;
  let lightMagicKiReduction = 0;
  let lightMagicClashBonus = 0;
  const aboveInjured = !system.thresholds?.injured?.crossed;
  if (has.lightMagic && !disabled.has(TRAIT_IDS.lightMagic) && lightOpt !== "none") {
    if (lightOpt === "peace") {
      lightPeaceMoraleSave = tier;
      if (system.savingThrows?.morale !== undefined) {
        system.savingThrows.morale.bonus += lightPeaceMoraleSave;
      }
    } else if (lightOpt === "power") {
      // +2(T) Dodge if FO 4+ > AG, above Injured
      const foScore = system.attributes.fo?.score ?? 0;
      const agScore = system.attributes.ag?.score ?? 0;
      if (foScore >= agScore + 4 && aboveInjured) {
        lightPowerDodge = 2 * tier;
        system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + lightPowerDodge;
      }
    } else if (lightOpt === "speed") {
      // +2(T) Wound if AG 4+ > FO and MA, above Injured
      const agScore = system.attributes.ag?.score ?? 0;
      const foScore = system.attributes.fo?.score ?? 0;
      const maScore = system.attributes.ma?.score ?? 0;
      if (agScore >= foScore + 4 && agScore >= maScore + 4 && aboveInjured) {
        lightSpeedWound = 2 * tier;
        system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + lightSpeedWound;
      }
    } else if (lightOpt === "war") {
      // +1(T) Wound with Armed Attacks + Weapon Specialist (conditional)
      lightWarWound = tier;
      lightWarWeaponSpecialist = true;
      system.aptitudes.armedAttackWoundBonus = (system.aptitudes.armedAttackWoundBonus || 0) + lightWarWound;
    } else if (lightOpt === "magic") {
      // +1(T) Clash with Magical UA, -3(bT) Ki Cost Magical UA
      lightMagicKiReduction = 3 * baseTier;
      lightMagicClashBonus = tier;
      system.aptitudes.magicalUAKiReduction = (system.aptitudes.magicalUAKiReduction || 0) + lightMagicKiReduction;
      system.aptitudes.magicalUAClashBonus = (system.aptitudes.magicalUAClashBonus || 0) + lightMagicClashBonus;
    }
    // judgment, time = display/triggered
  }

  // ---- Dark Magic L1 Option (Makaio) ----
  let darkOpt = system.darkMagicOption || "none";
  if (darkOpt === "none" && has.darkMagic && !disabled.has(TRAIT_IDS.darkMagic)) {
    const sel = optSel[TRAIT_IDS.darkMagic];
    const catalogName = sel?.["1"] ?? sel?.[1] ?? "";
    if (catalogName) darkOpt = DARK_OPTION_MAP[catalogName] || "none";
  }
  let darkPowerfulSoak = 0;
  let darkEternalWound = 0;
  let darkManipulativeCombat = 0;
  let darkCommandingMinion = 0;
  if (has.darkMagic && !disabled.has(TRAIT_IDS.darkMagic) && darkOpt !== "none") {
    if (darkOpt === "powerful") {
      // +3(T) Soak if FO/MA highest, -1(T) per Health Threshold below
      const foScore = system.attributes.fo?.score ?? 0;
      const maScore = system.attributes.ma?.score ?? 0;
      const agScore = system.attributes.ag?.score ?? 0;
      const inScore = system.attributes.in?.score ?? 0;
      const teScore = system.attributes.te?.score ?? 0;
      const peScore = system.attributes.pe?.score ?? 0;
      const maxOther = Math.max(agScore, inScore, teScore, peScore);
      if (foScore >= maxOther || maScore >= maxOther) {
        const thresholdsBelow = system.thresholds?.crossedCount ?? 0;
        darkPowerfulSoak = Math.max(0, (3 - thresholdsBelow) * tier);
        system.status.soak = (system.status.soak || 0) + darkPowerfulSoak;
      }
    } else if (darkOpt === "eternal") {
      // +3(T) Wound if AG/TE highest, -1(T) per Health Threshold below
      const agScore = system.attributes.ag?.score ?? 0;
      const teScore = system.attributes.te?.score ?? 0;
      const foScore = system.attributes.fo?.score ?? 0;
      const maScore = system.attributes.ma?.score ?? 0;
      const inScore = system.attributes.in?.score ?? 0;
      const peScore = system.attributes.pe?.score ?? 0;
      const maxOther = Math.max(foScore, maScore, inScore, peScore);
      if (agScore >= maxOther || teScore >= maxOther) {
        const thresholdsBelow = system.thresholds?.crossedCount ?? 0;
        darkEternalWound = Math.max(0, (3 - thresholdsBelow) * tier);
        if (darkEternalWound > 0) {
          system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + darkEternalWound;
        }
      }
    } else if (darkOpt === "manipulative") {
      // +1(bT) Combat Rolls if IN/PE highest
      const inScore = system.attributes.in?.score ?? 0;
      const peScore = system.attributes.pe?.score ?? 0;
      const foScore = system.attributes.fo?.score ?? 0;
      const maScore = system.attributes.ma?.score ?? 0;
      const agScore = system.attributes.ag?.score ?? 0;
      const teScore = system.attributes.te?.score ?? 0;
      const maxOther = Math.max(foScore, maScore, agScore, teScore);
      if (inScore >= maxOther || peScore >= maxOther) {
        darkManipulativeCombat = baseTier;
        system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + darkManipulativeCombat;
        system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + darkManipulativeCombat;
        system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + darkManipulativeCombat;
      }
    } else if (darkOpt === "commanding") {
      darkCommandingMinion = tier;
      system.aptitudes.commandingMinionBonus = (system.aptitudes.commandingMinionBonus || 0) + darkCommandingMinion;
    }
    // kiriDrain, transforming, elemental = display/access
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Skill of the Watcher L1: Triggered/Start of Combat Round
  if (has.skillOfTheWatcher && !disabled.has(TRAIT_IDS.skillOfTheWatcher)) {
    triggered.push({
      id: "sotw_counter_actions",
      name: "Skill of the Watcher (Counter Actions)",
      description: `You may spend 1 Action and ${4 * baseTier} [4(bT)] Ki Points to gain 2 Counter Actions.`,
      usageLimit: null,
      maxUses: null
    });
    // L2: Triggered/Start of Turn — Impediment via Cognitive Clash
    triggered.push({
      id: "sotw_impediment",
      name: "Skill of the Watcher (Impediment)",
      description: `Spend ${6 * baseTier} [6(bT)] Ki Points to target an Opponent not at Long Range. That Opponent must make a Cognitive Clash against you. If you win, they suffer from the Impediment Combat Condition for the duration of either your or their turn (you decide).`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Celestial Potential L1: 1/Round — Botch mitigation
  if (has.celestialPotential && !disabled.has(TRAIT_IDS.celestialPotential)) {
    triggered.push({
      id: "cp_botch_to_bonus",
      name: "Celestial Potential (Botch Mitigation)",
      description: `When you score a Botch Result, increase your Dice Score by ${2 * tier} [2(T)] instead of suffering the penalty.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: 1/Round — Crit bonus
    triggered.push({
      id: "cp_crit_bonus",
      name: "Celestial Potential (Crit Bonus)",
      description: `When you score a Critical Dice Result, increase your Dice Score by an additional ${2 * tier} [2(T)].`,
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Far-Seeing L2: 1/Round — counter-attack on avoided damage
  if (has.farSeeing && !disabled.has(TRAIT_IDS.farSeeing)) {
    triggered.push({
      id: "fs_counter_attack",
      name: "Far-Seeing (Counter-Attack)",
      description: "If you suffer no Damage from an Opponent's Attacking Maneuver that targets you due to any reason (including simply avoiding it), you may use the Basic Attack Maneuver against the attacking Opponent as an Out-of-Sequence Maneuver.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Light Magic L2: Triggered/Threshold
  if (has.lightMagic && !disabled.has(TRAIT_IDS.lightMagic)) {
    triggered.push({
      id: "lm_threshold_choice",
      name: "Light Magic (Threshold Choice)",
      description: `If you succeed at your Steadfast Check, you may either: Remove a stack of a Combat Condition (except Suffocating or Oblivious), or regain ${8 * baseTier} [8(bT)] Ki Points.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Dark Magic L2: 1/Round — knock Prone on threshold
  if (has.darkMagic && !disabled.has(TRAIT_IDS.darkMagic)) {
    triggered.push({
      id: "dm_prone_threshold",
      name: "Dark Magic (Prone on Threshold)",
      description: "If you knock an Opponent through a Health Threshold with an Attacking Maneuver, immediately make a Might Clash against them. If you win, they are knocked Prone.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Sync resolved options back so Combat tab dropdown reflects Traits tab choice
  system.lightMagicOption = lightOpt;
  system.darkMagicOption = darkOpt;

  // Store derived data for UI display
  system.shinjinBonuses = {
    has,
    lightOpt,
    darkOpt,
    cosmicDefense,
    cosmicKiReduction,
    arcaneCritReduction,
    lightPeaceMoraleSave,
    lightPowerDodge,
    lightSpeedWound,
    lightWarWound,
    lightWarWeaponSpecialist,
    lightMagicKiReduction,
    lightMagicClashBonus,
    darkPowerfulSoak,
    darkEternalWound,
    darkManipulativeCombat,
    darkCommandingMinion,
    triggered
  };
}
