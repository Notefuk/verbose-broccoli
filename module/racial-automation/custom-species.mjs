/**
 * Custom Species Racial Trait Automation
 * Applies passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "customSpecies".
 */

const TRAIT_IDS = {
  // Primary
  abnormalAnatomy:        "cs00000000000001",
  arcaneAdept:            "cs00000000000002",
  bigPersonality:         "cs00000000000003",
  bruteForce:             "cs00000000000004",
  deathDefier:            "cs00000000000005",
  forgedInBattle:         "cs00000000000006",
  gloriousTactics:        "cs00000000000007",
  inherentTransformation: "cs00000000000008",
  innateWeaponry:         "cs00000000000009",
  invulnerable:           "cs0000000000000a",
  lightConsumption:       "cs0000000000000b",
  minionMaker:            "cs0000000000000c",
  naturalFusion:          "cs0000000000000d",
  raceOfScholars:         "cs0000000000000e",
  regenerativeAnatomy:    "cs0000000000000f",
  // Secondary
  armedAffinity:          "cs00000000000010",
  alternateScale:         "cs00000000000011",
  blazingSpeed:           "cs00000000000012",
  combativeOrganism:      "cs00000000000013",
  defendersTactics:       "cs00000000000014",
  denseBody:              "cs00000000000015",
  dissipatingDodge:       "cs00000000000016",
  elementalAssault:       "cs00000000000017",
  enhancedEyes:           "cs00000000000018",
  fluidPhysique:          "cs00000000000019",
  kiControl:              "cs0000000000001a",
  killerInstinct:         "cs0000000000001b",
  magicalMastery:         "cs0000000000001c",
  monstrous:              "cs0000000000001d",
  mysticAttack:           "cs0000000000001e",
  pilotingProwess:        "cs0000000000001f",
  racialCopy:             "cs00000000000020",
  racialState:            "cs00000000000021",
  racialTechnique:        "cs00000000000022",
  skilledSpecies:         "cs00000000000023",
  slimyConsistency:       "cs00000000000024",
  solidGuard:             "cs00000000000025",
  techniqueCrafter:       "cs00000000000026",
  // Flaw
  awkwardAnatomy:         "cs00000000000027",
  abnormalSeparation:     "cs00000000000028",
  brittle:                "cs00000000000029",
  compulsiveThirst:       "cs0000000000002a",
  cursed:                 "cs0000000000002b",
  elementalVulnerability: "cs0000000000002c",
  environmentalPreference:"cs0000000000002d",
  forbiddenPower:         "cs0000000000002e",
  fragileHeart:           "cs0000000000002f",
  heavy:                  "cs00000000000030",
  hivemind:               "cs00000000000031",
  limitedForm:            "cs00000000000032",
  limitedRecovery:        "cs00000000000033",
  lowResilience:          "cs00000000000034",
  magicalDependency:      "cs00000000000035",
  oneTrickPony:           "cs00000000000036",
  poorEyesight:           "cs00000000000037",
  racialDrawback:         "cs00000000000038",
  reclusiveForm:          "cs00000000000039",
  sickly:                 "cs0000000000003a",
  smallAndFragile:        "cs0000000000003b",
  temporaryFusion:        "cs0000000000003c",
  wasteful:               "cs0000000000003d",
  weakSpot:               "cs0000000000003e",
  weatherVulnerability:   "cs0000000000003f"
};

export function applyCustomSpeciesBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];
  const has = {};
  for (const [key, id] of Object.entries(TRAIT_IDS)) has[key] = traitIds.includes(id);
  const disabled = system._disabledRacialPassives || new Set();
  const isActive = (key) => has[key] && !disabled.has(TRAIT_IDS[key]);

  const bonuses = { has };

  // Helpers
  const apt = system.aptitudes;
  const status = system.status;
  const addLP = (n) => { system.lifePoints.max = (system.lifePoints.max || 0) + (system.level || 1) * n; };

  // ============ PRIMARY ============

  // Abnormal Anatomy L1 reduce damage cat, L3 +2(bT) DR
  if (isActive("abnormalAnatomy")) {
    apt.incomingDamageCategoryReduction = (apt.incomingDamageCategoryReduction || 0) + 1;
    apt.abnormalAnatomyUnnatural = true;
    const dr = 2 * baseTier;
    status.dr = (status.dr || 0) + dr;
    bonuses.abnormalAnatomyDR = dr;
  }

  // Arcane Adept L2 -2 TP Magical UA, L3 -2(T) Ki Magical UA, +1(T) UA Clash Dice
  if (isActive("arcaneAdept")) {
    apt.magicalUATPReduction = (apt.magicalUATPReduction || 0) + 2;
    const kiR = 2 * tier;
    apt.magicalUAKiReduction = (apt.magicalUAKiReduction || 0) + kiR;
    apt.uniqueAbilityClashBonus = (apt.uniqueAbilityClashBonus || 0) + tier;
    bonuses.arcaneAdeptKi = kiR;
    bonuses.arcaneAdeptClash = tier;
  }

  // Big Personality L2 +1(bT) Combat Rolls + Initiative if PE highest
  if (isActive("bigPersonality")) {
    const scores = system.attributes;
    const pe = scores.pe?.score ?? 0;
    const maxOther = Math.max(
      scores.ag?.score ?? 0, scores.fo?.score ?? 0, scores.te?.score ?? 0,
      scores.ma?.score ?? 0, scores.in?.score ?? 0, scores.sc?.score ?? 0
    );
    if (pe > maxOther) {
      apt.strikeBuffTotal = (apt.strikeBuffTotal || 0) + baseTier;
      apt.dodgeBuffTotal = (apt.dodgeBuffTotal || 0) + baseTier;
      apt.woundBuffTotal = (apt.woundBuffTotal || 0) + baseTier;
      apt.initiativeRollBonus = (apt.initiativeRollBonus || 0) + baseTier;
      bonuses.bigPersonalityBonus = baseTier;
    } else {
      bonuses.bigPersonalityBonus = 0;
    }
  }

  // Brute Force L1 -2(T) Basic Attack Ki, -1 Basic Attack Crit Target; L2 +6(T) Sig Ki, +1d10(T) Sig Wound
  if (isActive("bruteForce")) {
    apt.basicAttackKiReduction = (apt.basicAttackKiReduction || 0) + 2 * tier;
    apt.basicAttackCritTargetReduction = (apt.basicAttackCritTargetReduction || 0) + 1;
    apt.signatureTechniqueKiIncrease = (apt.signatureTechniqueKiIncrease || 0) + 6 * tier;
    apt.signatureTechniqueExtraWoundDice = `1d10(${tier})`;
    bonuses.bruteForceBasicKi = 2 * tier;
    bonuses.bruteForceSigKi = 6 * tier;
  }

  // Death Defier L2 +2(T) Combat Rolls in Undying
  if (isActive("deathDefier")) {
    if (system.combatStates?.undying) {
      apt.strikeBuffTotal = (apt.strikeBuffTotal || 0) + 2 * tier;
      apt.dodgeBuffTotal = (apt.dodgeBuffTotal || 0) + 2 * tier;
      apt.woundBuffTotal = (apt.woundBuffTotal || 0) + 2 * tier;
      bonuses.deathDefierCombat = 2 * tier;
    } else {
      bonuses.deathDefierCombat = 0;
    }
  }

  // Glorious Tactics L4 +1 Tactic Points gained
  if (isActive("gloriousTactics")) {
    apt.tacticPointsGainBonus = (apt.tacticPointsGainBonus || 0) + 1;
    bonuses.gloriousTacticsBonus = 1;
  }

  // Inherent Transformation L3 +2 Stress Test, L4 +1(T) FO/MA selected transformation
  if (isActive("inherentTransformation")) {
    apt.inherentTransformationStressBonus = (apt.inherentTransformationStressBonus || 0) + 2;
    apt.inherentTransformationAttrBonus = (apt.inherentTransformationAttrBonus || 0) + tier;
    bonuses.inherentTransformationAttr = tier;
  }

  // Invulnerable L1 +2(bT) DR
  if (isActive("invulnerable")) {
    const dr = 2 * baseTier;
    status.dr = (status.dr || 0) + dr;
    bonuses.invulnerableDR = dr;
  }

  // Natural Fusion L1 +1 RLM (= +level LP)
  if (isActive("naturalFusion")) {
    addLP(1);
    bonuses.naturalFusionRLM = 1;
  }

  // Race of Scholars L2 +1(bT) Combat Rolls + Initiative if SC highest
  if (isActive("raceOfScholars")) {
    const scores = system.attributes;
    const sc = scores.sc?.score ?? 0;
    const maxOther = Math.max(
      scores.ag?.score ?? 0, scores.fo?.score ?? 0, scores.te?.score ?? 0,
      scores.ma?.score ?? 0, scores.in?.score ?? 0, scores.pe?.score ?? 0
    );
    if (sc > maxOther) {
      apt.strikeBuffTotal = (apt.strikeBuffTotal || 0) + baseTier;
      apt.dodgeBuffTotal = (apt.dodgeBuffTotal || 0) + baseTier;
      apt.woundBuffTotal = (apt.woundBuffTotal || 0) + baseTier;
      apt.initiativeRollBonus = (apt.initiativeRollBonus || 0) + baseTier;
      bonuses.raceOfScholarsBonus = baseTier;
    } else {
      bonuses.raceOfScholarsBonus = 0;
    }
  }

  // ============ SECONDARY ============

  // Armed Affinity L2 +2(T) Wound Armed
  if (isActive("armedAffinity")) {
    apt.armedAttackWoundBonus = (apt.armedAttackWoundBonus || 0) + 2 * tier;
    bonuses.armedAffinityWound = 2 * tier;
  }

  // Blazing Speed L2 +1(T) Speed and Defense
  if (isActive("blazingSpeed")) {
    status.normalSpeed = (status.normalSpeed || 0) + tier;
    status.boostedSpeed = (status.boostedSpeed || 0) + tier;
    apt.defenseValue = (apt.defenseValue || 0) + tier;
    bonuses.blazingSpeedBonus = tier;
  }

  // Dense Body L1 +1 RLM, L4 reduce Collision to 0 + Pin Might bonus
  if (isActive("denseBody")) {
    addLP(1);
    apt.collisionDamageMultiplier = 0;
    apt.pinMightBonus = (apt.pinMightBonus || 0) + 2 * tier;
    bonuses.denseBodyLP = 1;
    bonuses.denseBodyPinMight = 2 * tier;
  }

  // Elemental Assault L2 +1d4(T) Wound elemental profile
  if (isActive("elementalAssault")) {
    apt.elementalProfileWoundBonus = `1d4(${tier})`;
    bonuses.elementalAssaultWound = `1d4(${tier})`;
  }

  // Enhanced Eyes L1 -1 Crit Target Sig Tech Strike/Wound, L3 +1(T) per 3 sq up to 4(T) Sig Tech Wound, L4 Energy Charge on Called Shots
  if (isActive("enhancedEyes")) {
    apt.sigTechCritTargetReduction = (apt.sigTechCritTargetReduction || 0) + 1;
    apt.enhancedEyesSigTechRangeBonus = (apt.enhancedEyesSigTechRangeBonus || 0) + tier;
    apt.calledShotEnergyCharge = true;
    bonuses.enhancedEyesCritReduction = 1;
  }

  // Ki Control L1 -2(T) Ki Physical/Energy Sig Tech, L4 +2(T) Wound Physical/Energy Sig Tech
  if (isActive("kiControl")) {
    apt.physicalEnergySigTechKiReduction = (apt.physicalEnergySigTechKiReduction || 0) + 2 * tier;
    apt.physicalEnergySigTechWoundBonus = (apt.physicalEnergySigTechWoundBonus || 0) + 2 * tier;
    bonuses.kiControlKi = 2 * tier;
    bonuses.kiControlWound = 2 * tier;
  }

  // Mystic Attack L3 +2(T) Wound Physical 3+ sq away
  if (isActive("mysticAttack")) {
    apt.physicalAttack3SqWoundBonus = (apt.physicalAttack3SqWoundBonus || 0) + 2 * tier;
    bonuses.mysticAttackWound = 2 * tier;
  }

  // Piloting Prowess L2 +2(T) Battle Jacket Wound (BJ specific) + +6 BJ TP per ToP
  if (isActive("pilotingProwess")) {
    apt.battleJacketWoundBonus = (apt.battleJacketWoundBonus || 0) + 2 * tier;
    apt.battleJacketBonusTP = (apt.battleJacketBonusTP || 0) + 6;
    bonuses.pilotingProwessWound = 2 * tier;
  }

  // Racial State L2 +1(T) Soak while in any State
  if (isActive("racialState")) {
    const states = system.combatStates || {};
    const inState = states.raging || states.surging || states.mindful || states.superior || states.undying;
    if (inState) {
      status.soak = (status.soak || 0) + tier;
      bonuses.racialStateSoak = tier;
    } else {
      bonuses.racialStateSoak = 0;
    }
  }

  // Racial Technique L2 -2(T) Ki cost Racial Tech
  if (isActive("racialTechnique")) {
    apt.racialTechniqueKiReduction = (apt.racialTechniqueKiReduction || 0) + 2 * tier;
    bonuses.racialTechniqueKi = 2 * tier;
  }

  // Skilled Species L2 +3 TP per Skill Improvement
  if (isActive("skilledSpecies")) {
    apt.techniquePointsPerSkillImprovement = (apt.techniquePointsPerSkillImprovement || 0) + 3;
    bonuses.skilledSpeciesTP = 3;
  }

  // Slimy Consistency L4 +2(bT) DR vs Physical
  if (isActive("slimyConsistency")) {
    apt.physicalAttackDR = (apt.physicalAttackDR || 0) + 2 * baseTier;
    bonuses.slimyConsistencyDR = 2 * baseTier;
  }

  // Technique Crafter L1 -3 TP per Skill Improvement, L2 +10 STP at creation + +5 STP per SI
  if (isActive("techniqueCrafter")) {
    apt.techniquePointsPerSkillImprovement = (apt.techniquePointsPerSkillImprovement || 0) - 3;
    apt.spontaneousTechniquePointsCreation = (apt.spontaneousTechniquePointsCreation || 0) + 10;
    apt.spontaneousTechniquePointsPerSI = (apt.spontaneousTechniquePointsPerSI || 0) + 5;
    bonuses.techniqueCrafterPenalty = -3;
    bonuses.techniqueCrafterSTP = 10;
  }

  // ============ FLAW (PENALTIES) ============

  // Brittle: +2(bT) Damage taken
  if (isActive("brittle")) {
    apt.incomingDamageBonus = (apt.incomingDamageBonus || 0) + 2 * baseTier;
    bonuses.brittlePenalty = 2 * baseTier;
  }

  // Compulsive Thirst L2 -2(bT) Dodge
  if (isActive("compulsiveThirst")) {
    apt.dodgeBuffTotal = (apt.dodgeBuffTotal || 0) - 2 * baseTier;
    bonuses.compulsiveThirstPenalty = 2 * baseTier;
  }

  // Elemental Vulnerability +2(bT) damage from selected profile
  if (isActive("elementalVulnerability")) {
    apt.elementalVulnerabilityDamageBonus = (apt.elementalVulnerabilityDamageBonus || 0) + 2 * baseTier;
    bonuses.elementalVulnerability = 2 * baseTier;
  }

  // Environmental Preference -1(bT) outside selected env (conditional, store flag)
  if (isActive("environmentalPreference")) {
    apt.environmentalPreferencePenalty = (apt.environmentalPreferencePenalty || 0) + baseTier;
    bonuses.environmentalPreferencePenalty = baseTier;
  }

  // Fragile Heart L1 -1(bT) Morale Save
  if (isActive("fragileHeart")) {
    if (system.savingThrows?.morale !== undefined) {
      system.savingThrows.morale.bonus -= baseTier;
    }
    bonuses.fragileHeartPenalty = baseTier;
  }

  // Heavy: -1/4 Speed, +1 Size for DV calc penalty
  if (isActive("heavy")) {
    const spdReduction = Math.ceil((status.normalSpeed || 0) / 4);
    status.normalSpeed = (status.normalSpeed || 0) - spdReduction;
    status.boostedSpeed = (status.boostedSpeed || 0) - spdReduction;
    apt.heavyPenaltyEffectiveSize = 1;
    bonuses.heavySpeedReduction = spdReduction;
  }

  // Hivemind L2 -1(bT) Combat Rolls + Saves if no Minion in Sphere (assume false by default → penalty applies)
  if (isActive("hivemind")) {
    const noMinionInSphere = system._hiveindMinionInSphere !== true;
    if (noMinionInSphere) {
      apt.strikeBuffTotal = (apt.strikeBuffTotal || 0) - baseTier;
      apt.dodgeBuffTotal = (apt.dodgeBuffTotal || 0) - baseTier;
      apt.woundBuffTotal = (apt.woundBuffTotal || 0) - baseTier;
      for (const sv of ["corporeal", "impulsive", "cognitive", "morale"]) {
        if (system.savingThrows?.[sv] !== undefined) {
          system.savingThrows[sv].bonus -= baseTier;
        }
      }
      bonuses.hivemindPenalty = baseTier;
    } else {
      bonuses.hivemindPenalty = 0;
    }
  }

  // Limited Recovery -1d10(bT) Combat Recovery/Healing Surge
  if (isActive("limitedRecovery")) {
    apt.recoveryRollPenalty = `1d10(${baseTier})`;
    bonuses.limitedRecoveryPenalty = `1d10(${baseTier})`;
  }

  // Low Resilience -1(bT) Combat Rolls below Injured
  if (isActive("lowResilience")) {
    const hs = status.healthStatus || "healthy";
    if (hs === "injured" || hs === "critical") {
      apt.strikeBuffTotal = (apt.strikeBuffTotal || 0) - baseTier;
      apt.dodgeBuffTotal = (apt.dodgeBuffTotal || 0) - baseTier;
      apt.woundBuffTotal = (apt.woundBuffTotal || 0) - baseTier;
      bonuses.lowResiliencePenalty = baseTier;
    } else {
      bonuses.lowResiliencePenalty = 0;
    }
  }

  // Magical Dependency +3(T) Ki cost non-Magic attacks
  if (isActive("magicalDependency")) {
    apt.nonMagicAttackKiPenalty = (apt.nonMagicAttackKiPenalty || 0) + 3 * tier;
    bonuses.magicalDependencyKiPenalty = 3 * tier;
  }

  // Poor Eyesight: -1 Natural Perception, L2 -1(T) Combat Rolls vs Long Range
  if (isActive("poorEyesight")) {
    apt.perceptionNaturalResultPenalty = (apt.perceptionNaturalResultPenalty || 0) + 1;
    apt.longRangeCombatRollPenalty = (apt.longRangeCombatRollPenalty || 0) + tier;
    bonuses.poorEyesightLongRange = tier;
  }

  // Sickly -2 RLM (= -2 × level LP)
  if (isActive("sickly")) {
    addLP(-2);
    bonuses.sicklyRLM = -2;
  }

  // Wasteful +2(T) Ki all attacks, +1(T) Wound all attacks
  if (isActive("wasteful")) {
    apt.allAttackKiPenalty = (apt.allAttackKiPenalty || 0) + 2 * tier;
    apt.woundBuffTotal = (apt.woundBuffTotal || 0) + tier;
    bonuses.wastefulKi = 2 * tier;
    bonuses.wastefulWound = tier;
  }

  // Weather Vulnerability -1(bT) Combat Rolls in selected weather (conditional)
  if (isActive("weatherVulnerability")) {
    apt.weatherVulnerabilityPenalty = (apt.weatherVulnerabilityPenalty || 0) + baseTier;
    bonuses.weatherVulnerabilityPenalty = baseTier;
  }

  // ============ Triggered abilities (display in UI) ============
  const triggered = [];
  if (isActive("regenerativeAnatomy")) {
    triggered.push({ id: "ra_regen", name: "Regenerative Anatomy", description: "Spend Ki to regrow limbs.", usageLimit: null, maxUses: null });
  }
  if (isActive("innateWeaponry")) {
    apt.innateWeaponryStrikeBonus = (apt.innateWeaponryStrikeBonus || 0) + tier;
    apt.innateWeaponryWoundBonus = (apt.innateWeaponryWoundBonus || 0) + tier;
    triggered.push({ id: "iw_create", name: "Innate Weaponry (Create Weapon)", description: `2/Round: spend 1 Action to create designed Weapon. +${tier} [1(T)] Strike & Wound with it.`, usageLimit: "round", maxUses: 2 });
    bonuses.innateWeaponryBonus = tier;
  }
  if (isActive("solidGuard")) {
    apt.parryStrikeBonus = (apt.parryStrikeBonus || 0) + tier;
    apt.powerFlareWoundBonus = (apt.powerFlareWoundBonus || 0) + 2 * tier;
    apt.directHitSoakBonus = (apt.directHitSoakBonus || 0) + 2 * tier;
    apt.crossCounterDVReduction = (apt.crossCounterDVReduction || 0) + 2 * tier;
    triggered.push({ id: "sg_defend", name: "Solid Guard", description: `Defend Maneuver bonuses: Parry +${tier} Strike, Power Flare +${2 * tier} Wound, Guard +1/4 Might Soak, Direct Hit +${2 * tier} Soak, Cross Counter -${2 * tier} DV (instead of halve).`, usageLimit: null, maxUses: null });
    bonuses.solidGuardParryStrike = tier;
  }
  if (isActive("dissipatingDodge")) {
    triggered.push({ id: "dd_dodge", name: "Dissipating Dodge", description: "Spend Ki to gain Mass-based Dodge.", usageLimit: null, maxUses: null });
  }
  if (isActive("forgedInBattle")) {
    triggered.push({ id: "fib_focus", name: "Forged in Battle", description: "Trade Combat Roll dice score for Wound bonus.", usageLimit: null, maxUses: null });
  }
  if (isActive("lightConsumption")) {
    triggered.push({ id: "lc_consume", name: "Light Consumption", description: "Consume light/Ki as resource.", usageLimit: null, maxUses: null });
  }
  if (isActive("minionMaker")) {
    triggered.push({ id: "mm_summon", name: "Minion Maker", description: "Spend Ki to summon minions.", usageLimit: null, maxUses: null });
  }
  if (isActive("defendersTactics")) {
    triggered.push({ id: "dt_spend", name: "Defender's Tactics", description: "Spend Tactic Points for Dodge.", usageLimit: null, maxUses: null });
  }
  if (isActive("monstrous")) {
    triggered.push({ id: "monst_trait", name: "Monstrous", description: "Gain Monster Trait via Alt/Legendary Form.", usageLimit: null, maxUses: null });
  }
  if (isActive("magicalMastery")) {
    triggered.push({ id: "mm_uas", name: "Magical Mastery", description: "Access to Magical Materialization, Telekinesis, +1 magical UA.", usageLimit: null, maxUses: null });
  }
  if (isActive("racialCopy")) {
    triggered.push({ id: "rc_copy", name: "Racial Copy", description: "Copy a racial trait from another race.", usageLimit: null, maxUses: null });
  }
  if (isActive("alternateScale")) {
    triggered.push({ id: "as_size", name: "Alternate Scale", description: "Size shift (Tiny or Large).", usageLimit: null, maxUses: null });
  }

  bonuses.triggered = triggered;
  system.customSpeciesBonuses = bonuses;
}
