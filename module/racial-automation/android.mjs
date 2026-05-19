/**
 * Android Racial Trait Automation
 * Applies passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "android".
 *
 * Option-based traits use tracked fields:
 *   system.wondersOption, system.energyCoreOption,
 *   system.specializedOption, system.functionalPurposeOption
 */

// Android trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  wondersOfTechnology: "136ffa01ae1c06a2",
  energyCore: "4c9dbe98023ec645",
  damageInhibitor: "35b1ed35b06816c4",
  lockOn: "cfcd563b936bcbdb",
  specializedFeatures: "73680f0be97a0c84",
  functionalPurpose: "91cff61e5d5a22d9"
};

/**
 * Apply all automatable Android racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyAndroidBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  // Track which traits are present
  const has = {
    wondersOfTechnology: traitIds.includes(TRAIT_IDS.wondersOfTechnology),
    energyCore: traitIds.includes(TRAIT_IDS.energyCore),
    damageInhibitor: traitIds.includes(TRAIT_IDS.damageInhibitor),
    lockOn: traitIds.includes(TRAIT_IDS.lockOn),
    specializedFeatures: traitIds.includes(TRAIT_IDS.specializedFeatures),
    functionalPurpose: traitIds.includes(TRAIT_IDS.functionalPurpose)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // Read option selections — UI writes to racialOptionSelections[traitId][effectLevel].
  // Legacy fields (system.wondersOption etc.) are kept as fallback for older saves.
  const rs = system.racialOptionSelections || {};
  const _opt = (tid, lvl, legacy) => {
    const v = rs[tid]?.[String(lvl)] ?? rs[tid]?.[lvl] ?? legacy ?? "none";
    return String(v).toLowerCase();
  };
  const wondersOpt    = _opt(TRAIT_IDS.wondersOfTechnology, 1, system.wondersOption);
  const energyCoreOpt = _opt(TRAIT_IDS.energyCore, 2, system.energyCoreOption);
  const specializedOpt = _opt(TRAIT_IDS.specializedFeatures, 1, system.specializedOption);
  const functionalOpt = _opt(TRAIT_IDS.functionalPurpose, 2, system.functionalPurposeOption);

  // ---- Damage Inhibitor L2: +2(T) DR, halve Collision ----
  let damageInhibitorDR = 0;
  if (has.damageInhibitor && !disabled.has(TRAIT_IDS.damageInhibitor)) {
    damageInhibitorDR = 2 * tier;
    system.status.dr = (system.status.dr || 0) + damageInhibitorDR;
    system.aptitudes.collisionDamageMultiplier = 0.5;
  }

  // ---- Lock On L2: +2 Perception ----
  let lockOnPerception = 0;
  if (has.lockOn && !disabled.has(TRAIT_IDS.lockOn)) {
    lockOnPerception = 2;
    system.aptitudes.perceptionBonus = (system.aptitudes.perceptionBonus || 0) + lockOnPerception;
  }

  // ---- Wonders of Technology Option ----
  let wondersMachineMutantCorporeal = 0;
  if (has.wondersOfTechnology && !disabled.has(TRAIT_IDS.wondersOfTechnology)
      && (wondersOpt.includes("machine mutant") || wondersOpt === "machinemutant")) {
    // Machine Mutant: +1(T) Corporeal Save
    wondersMachineMutantCorporeal = tier;
    if (system.savingThrows?.corporeal !== undefined) {
      system.savingThrows.corporeal.bonus += wondersMachineMutantCorporeal;
    }
  }

  // ---- Energy Core Options ----
  let energyCoreKiPerRound = 0;   // Infinite Energy: +3(bT) Ki/round
  let energyCoreSoakBonus = 0;    // Power Battery L3: +1(bT) Soak when Ki > Capacity
  let energyCoreCombatBonus = 0;  // Power Battery L3: +1(bT) Combat Rolls when Ki > Capacity
  let powerBatteryKiReduction = 0;// Power Battery: -2(T) Ki cost attacking
  if (has.energyCore && !disabled.has(TRAIT_IDS.energyCore)) {
    if (energyCoreOpt.includes("infinite energy") || energyCoreOpt === "infiniteenergy") {
      energyCoreKiPerRound = 3 * baseTier;
    } else if (energyCoreOpt.includes("power battery") || energyCoreOpt === "powerbattery") {
      powerBatteryKiReduction = 2 * tier;
      // L3: +1(bT) Soak and Combat Rolls while Ki > Capacity
      const currentKi = system.kiPool?.value ?? 0;
      const maxCapacity = system.capacity?.max ?? 0;
      if (currentKi > maxCapacity) {
        energyCoreSoakBonus = baseTier;
        energyCoreCombatBonus = baseTier;
        system.status.soak = (system.status.soak || 0) + energyCoreSoakBonus;
      }
    }
    // mutant core = manual
  }

  // ---- Specialized Features Options ----
  let specEnhancedReflexesImpulsive = 0;
  let specEnhancedReflexesDefense = 0;
  let specWeaponPortsWound = 0;
  let specSurgingPowerSoak = 0;
  let specExtensionGrapple = 0;
  if (has.specializedFeatures && !disabled.has(TRAIT_IDS.specializedFeatures) && specializedOpt !== "none") {
    if (specializedOpt.includes("enhanced reflexes") || specializedOpt === "enhancedreflexes") {
      // L2: +1(T) Impulsive Save, +1(T) Defense
      specEnhancedReflexesImpulsive = tier;
      specEnhancedReflexesDefense = tier;
      if (system.savingThrows?.impulsive !== undefined) {
        system.savingThrows.impulsive.bonus += specEnhancedReflexesImpulsive;
      }
      system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + specEnhancedReflexesDefense;
    } else if (specializedOpt.includes("weapon ports") || specializedOpt === "weaponports") {
      // L2: +2(T) Wound (Sig Tech)
      specWeaponPortsWound = 2 * tier;
      system.aptitudes.signatureTechniqueWoundBonus = (system.aptitudes.signatureTechniqueWoundBonus || 0) + specWeaponPortsWound;
    } else if (specializedOpt.includes("surging power") || specializedOpt === "surgingpower") {
      // L2: +1(bT) Soak while 2+ Power stacks
      const powerStacks = system.tracking?.powerStacks ?? 0;
      if (powerStacks >= 2) {
        specSurgingPowerSoak = baseTier;
        system.status.soak = (system.status.soak || 0) + specSurgingPowerSoak;
      }
    } else if (specializedOpt.includes("extension feature") || specializedOpt === "extensionfeature") {
      // L2: +1(T) Grapple as Grappler
      specExtensionGrapple = tier;
    }
    // hyperResilience: damage < 5(bT) = 0 (display only)
    // heroicStyle L2: conditional on PE being highest (display)
    // smallScale/largeScale/androidFusion/powerAbsorption: display only
  }

  // ---- Functional Purpose Options ----
  let funcDestroyerWound = 0;
  let funcLeaderMinionCombat = 0;
  let funcLeaderMinionLP = 0;
  if (has.functionalPurpose && !disabled.has(TRAIT_IDS.functionalPurpose) && functionalOpt !== "none") {
    if (functionalOpt.includes("destroyer")) {
      // +2(T) Wound vs Lock-On target
      funcDestroyerWound = 2 * tier;
      system.aptitudes.destroyerWoundVsLockOn = (system.aptitudes.destroyerWoundVsLockOn || 0) + funcDestroyerWound;
    } else if (functionalOpt.includes("leader")) {
      // +1(T) Minion Combat Rolls, +5(bT) Minion LP
      funcLeaderMinionCombat = tier;
      funcLeaderMinionLP = 5 * baseTier;
      system.aptitudes.leaderMinionCombatBonus = (system.aptitudes.leaderMinionCombatBonus || 0) + funcLeaderMinionCombat;
      system.aptitudes.leaderMinionLPBonus = (system.aptitudes.leaderMinionLPBonus || 0) + funcLeaderMinionLP;
    }
    // protector, companion, researcher = conditional/triggered
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Damage Inhibitor L1: 1/Encounter
  if (has.damageInhibitor && !disabled.has(TRAIT_IDS.damageInhibitor)) {
    triggered.push({
      id: "di_superior_state",
      name: "Damage Inhibitor (Superior State)",
      description: "If you use the Direct Hit option of the Defend Maneuver and inflict the Shaken Combat Condition on an Opponent, enter the Superior State until the end of your next turn.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Lock On L1: Triggered/Start of Turn, Resource
  if (has.lockOn && !disabled.has(TRAIT_IDS.lockOn)) {
    triggered.push({
      id: "lo_target_stack",
      name: "Lock On (Target)",
      description: `Target an Opponent and give them a stack of Lock On (max. 1). Increase your Strike Rolls against that Opponent by ${2 * tier} [2(T)] but reduce your Dodge Rolls against all other Opponents by ${tier} [1(T)]. If you would give Lock On to a new Opponent, all other Lock On stacks are removed.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Energy Core: option-dependent triggered effects
  if (has.energyCore && !disabled.has(TRAIT_IDS.energyCore)) {
    if (energyCoreOpt === "infiniteEnergy") {
      // L3: 1/Round — Power Surge
      triggered.push({
        id: "ec_ie_power_surge",
        name: "Infinite Energy (Power Surge)",
        description: "You may spend 1 Action to use a Power Surge.",
        usageLimit: "1/Round",
        maxUses: 1
      });
    } else if (energyCoreOpt === "mutantCore") {
      // L2: 1/Round — Integrate Item
      triggered.push({
        id: "ec_mc_integrate",
        name: "Mutant Core (Integrate Item)",
        description: `You can spend 1 Action to Integrate any Item you can hold in your hands or currently have Equipped. You may Integrate up to ${baseTier + 1} [1(bT)+1] Items this way. This effect triggers the Exploit Maneuver.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
      // L3: 1/Round, 3/Encounter — Break Points
      triggered.push({
        id: "ec_mc_break_points",
        name: "Mutant Core (Break Points)",
        description: `You may destroy an Integrated Item as an Instant Maneuver to gain 1 Break Point (max. 2). At any point, you may spend any number of Break Points as an Instant Maneuver to regain ${baseTier}d8 [1d8(bT)] Life and Ki Points for each Break Point spent. Durable Items give 2 Break Points instead.`,
        usageLimit: "1/Round",
        maxUses: 1
      });
    }
  }

  // Specialized Features: option-dependent triggered effects
  if (has.specializedFeatures && !disabled.has(TRAIT_IDS.specializedFeatures) && specializedOpt !== "none") {
    if (specializedOpt === "surgingPower") {
      triggered.push({
        id: "sf_sp_extra_power",
        name: "Surging Power (Extra Stack)",
        description: `Spend ${4 * baseTier} [4(bT)] Ki Points to gain an additional stack of Power.`,
        usageLimit: null,
        maxUses: null
      });
    } else if (specializedOpt === "powerAbsorption") {
      triggered.push({
        id: "sf_pa_absorb",
        name: "Power Absorption (Parry Absorb)",
        description: "If you use the Parry option of the Defend Maneuver to successfully avoid harm from an Energy or Magic Attacking Maneuver, you may absorb it. Your Opponent makes an Urgent Wound Roll, and you regain Ki Points equal to 1/2 of the Dice Score. If Ki regained >= 1/5 of your Max Ki, you may Power Up as an Out-of-Sequence Maneuver.",
        usageLimit: null,
        maxUses: null
      });
    } else if (specializedOpt === "enhancedReflexes") {
      triggered.push({
        id: "sf_er_ignore_diminishing",
        name: "Enhanced Reflexes (Ignore Diminishing)",
        description: "When you are the target of an Attacking Maneuver, you may choose to ignore all penalties from Diminishing Defense for your next Dodge Roll.",
        usageLimit: "1/Round",
        maxUses: 1
      });
    } else if (specializedOpt === "heroicStyle") {
      triggered.push({
        id: "sf_hs_hype_combat",
        name: "Heroic Style (Hype Bonus)",
        description: `Increase your Combat Rolls by ${tier} [1(T)] until the end of your turn when you use the Hype Maneuver.`,
        usageLimit: null,
        maxUses: null
      });
    } else if (specializedOpt === "smallScale") {
      triggered.push({
        id: "sf_ss_size_wound",
        name: "Small Scale Structure (Size Wound)",
        description: `When making an Attacking Maneuver against an Opponent that is 2+ Size Categories larger than you, increase your Wound Roll by ${2 * tier} [2(T)].`,
        usageLimit: null,
        maxUses: null
      });
    } else if (specializedOpt === "largeScale") {
      triggered.push({
        id: "sf_ls_size_strike",
        name: "Large Scale Structure (Size Strike)",
        description: `When making an Attacking Maneuver against an Opponent that is 2+ Size Categories smaller than you, increase your Strike Roll by ${tier} [1(T)].`,
        usageLimit: null,
        maxUses: null
      });
    } else if (specializedOpt === "androidFusion") {
      triggered.push({
        id: "sf_af_multi_unify",
        name: "Android Fusion (Multi-Unify)",
        description: "If you use the Unify Maneuver, you may target up to 2 Androids that are up to 8 Squares away from you if they also possess this option of Specialized Features, instead of only targeting 1 Android and requiring them to be on an adjacent Square.",
        usageLimit: null,
        maxUses: null
      });
    }
  }

  // Functional Purpose: option-dependent triggered effects
  if (has.functionalPurpose && !disabled.has(TRAIT_IDS.functionalPurpose) && functionalOpt !== "none") {
    if (functionalOpt === "protector") {
      triggered.push({
        id: "fp_protector_intervene",
        name: "Protector (Free Intervene)",
        description: "If an Opponent with a stack of Lock On would make an Attacking Maneuver that targets one of your Allies, you may use the Intervene Maneuver without spending a Counter Action.",
        usageLimit: "1/Round",
        maxUses: 1
      });
    }
  }

  // Store derived data for UI display
  system.androidBonuses = {
    has,
    wondersOpt,
    energyCoreOpt,
    specializedOpt,
    functionalOpt,
    damageInhibitorDR,
    lockOnPerception,
    wondersMachineMutantCorporeal,
    energyCoreKiPerRound,
    energyCoreSoakBonus,
    energyCoreCombatBonus,
    powerBatteryKiReduction,
    specEnhancedReflexesImpulsive,
    specEnhancedReflexesDefense,
    specWeaponPortsWound,
    specSurgingPowerSoak,
    specExtensionGrapple,
    funcDestroyerWound,
    funcLeaderMinionCombat,
    funcLeaderMinionLP,
    triggered
  };
}
