/**
 * Bio-Android Racial Trait Automation
 * Applies passive and calculated trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "bioAndroid".
 */

// Bio-Android trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  cellularMemory: "897ec9bd0ae2cc72",
  geneticSplicing: "535d352a96774d48",
  powerCore: "1b93f1aee11ac7a4",
  cruelGenetics: "41263a8edf32725a",
  redEye: "15974371b1ec17f6",
  geneticResolve: "f784eff004c1ad51",
  namekianCells: "5231762addd264f4",
  vengeful: "5df8f60489c75470",
  battleThirst: "c56d0092a5e7f084",
  negativePower: "5124c2c7c6d28b26",
  geneticEfficiency: "246d2d91157fce1c",
  geneticFocus: "039f2f30cf4752df",
  rapidLearner: "52f48b6365dbe026",
  geneticModification: "307a88f5424a7c2e",
  organicConsumption: "4b2463b5bb3616c5"
};

/**
 * Apply all automatable Bio-Android racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyBioAndroidBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  // Track which traits are present
  const has = {
    cellularMemory: traitIds.includes(TRAIT_IDS.cellularMemory),
    geneticSplicing: traitIds.includes(TRAIT_IDS.geneticSplicing),
    powerCore: traitIds.includes(TRAIT_IDS.powerCore),
    cruelGenetics: traitIds.includes(TRAIT_IDS.cruelGenetics),
    redEye: traitIds.includes(TRAIT_IDS.redEye),
    geneticResolve: traitIds.includes(TRAIT_IDS.geneticResolve),
    namekianCells: traitIds.includes(TRAIT_IDS.namekianCells),
    vengeful: traitIds.includes(TRAIT_IDS.vengeful),
    battleThirst: traitIds.includes(TRAIT_IDS.battleThirst),
    negativePower: traitIds.includes(TRAIT_IDS.negativePower),
    geneticEfficiency: traitIds.includes(TRAIT_IDS.geneticEfficiency),
    geneticFocus: traitIds.includes(TRAIT_IDS.geneticFocus),
    rapidLearner: traitIds.includes(TRAIT_IDS.rapidLearner),
    geneticModification: traitIds.includes(TRAIT_IDS.geneticModification),
    organicConsumption: traitIds.includes(TRAIT_IDS.organicConsumption)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // ---- Genetic Splicing L1 Option ----
  // UI writes to racialOptionSelections[traitId][effectLevel].
  const splicingRaw = (system.racialOptionSelections?.[TRAIT_IDS.geneticSplicing]?.["1"]
                    ?? system.racialOptionSelections?.[TRAIT_IDS.geneticSplicing]?.[1]
                    ?? system.geneticSplicingOption ?? "none");
  const splicingOption = String(splicingRaw).toLowerCase();
  let geneticResilienceLifeMod = 0;
  let geneticGeniusCritReduction = 0;
  if (has.geneticSplicing && !disabled.has(TRAIT_IDS.geneticSplicing) && splicingOption !== "none") {
    if (splicingOption.includes("resilience")) {
      geneticResilienceLifeMod = 2;
      const level = system.level || 1;
      system.lifePoints.max = (system.lifePoints.max || 0) + (level * geneticResilienceLifeMod);
    } else if (splicingOption.includes("genius")) {
      geneticGeniusCritReduction = 1;
      system.aptitudes.critTargetReduction = (system.aptitudes.critTargetReduction || 0) + geneticGeniusCritReduction;
    }
    // "perfection" / "pursuit of perfection" = Absorption access (display only)
  }

  // ---- Power Core L2: +1/4 Power Surge Ki (rounded up) ----
  // ---- Power Core L3: +4(bT) Ki at start of combat round (display) ----
  let powerCoreSurgeBonus = 0;
  let powerCoreKiPerRound = 0;
  if (has.powerCore && !disabled.has(TRAIT_IDS.powerCore)) {
    const baseSurge = system.status?.powerSurgeKi || 0;
    powerCoreSurgeBonus = Math.ceil(baseSurge / 4);
    system.status.powerSurgeKi = baseSurge + powerCoreSurgeBonus;
    powerCoreKiPerRound = 4 * baseTier;
  }

  // ---- Red Eye L1: +2 Perception Skill Checks ----
  // ---- Red Eye L2: -1 Critical Target for Strike/Wound (Sig Tech only) ----
  let redEyePerception = 0;
  let redEyeCritReduction = 0;
  if (has.redEye && !disabled.has(TRAIT_IDS.redEye)) {
    redEyePerception = 2;
    redEyeCritReduction = 1;
    system.aptitudes.perceptionBonus = (system.aptitudes.perceptionBonus || 0) + redEyePerception;
    system.aptitudes.sigTechCritTargetReduction = (system.aptitudes.sigTechCritTargetReduction || 0) + redEyeCritReduction;
  }

  // ---- Namekian Cells L1: +3(bT) LP at start of combat round ----
  let namekianCellsLP = 0;
  if (has.namekianCells && !disabled.has(TRAIT_IDS.namekianCells)) {
    namekianCellsLP = 3 * baseTier;
    system.aptitudes.namekianCellsLPRegen = (system.aptitudes.namekianCellsLPRegen || 0) + namekianCellsLP;
  }

  // ---- Genetic Efficiency L1: +floor(Insight Score / 2) Wound Rolls ----
  let geneticEfficiencyWound = 0;
  if (has.geneticEfficiency && !disabled.has(TRAIT_IDS.geneticEfficiency)) {
    const inScore = system.attributes.in?.score ?? 0;
    geneticEfficiencyWound = Math.floor(inScore / 2);
    if (geneticEfficiencyWound > 0) {
      system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + geneticEfficiencyWound;
    }
  }

  // ---- Genetic Modification L1: +2 Intimidation Skill Checks ----
  let geneticModIntimidation = 0;
  if (has.geneticModification && !disabled.has(TRAIT_IDS.geneticModification)) {
    geneticModIntimidation = 2;
    system.aptitudes.intimidationBonus = (system.aptitudes.intimidationBonus || 0) + geneticModIntimidation;
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Cellular Memory L2: Triggered — bonus Wound on first-use Sig Tech below Injured
  if (has.cellularMemory && !disabled.has(TRAIT_IDS.cellularMemory)) {
    triggered.push({
      id: "cm_first_sig_wound",
      name: "Cellular Memory (First Sig Tech Wound)",
      description: `While below the Injured Health Threshold, if you use a Signature Technique that you have not previously used during this Combat Encounter, increase the Wound Roll by ${tier}d4 [1d4(T)].`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Power Core L3: Triggered/Start of Combat Round (Ki regain, already tracked as display)
  if (has.powerCore && !disabled.has(TRAIT_IDS.powerCore)) {
    triggered.push({
      id: "pc_ki_per_round",
      name: "Power Core (Ki Per Round)",
      description: `Regain ${powerCoreKiPerRound} [4(bT)] Ki Points at the start of each Combat Round.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Cruel Genetics L2: Triggered — sequential hit Wound bonus
  if (has.cruelGenetics && !disabled.has(TRAIT_IDS.cruelGenetics)) {
    triggered.push({
      id: "cg_sequential_wound",
      name: "Cruel Genetics (Sequential Wound)",
      description: `If you hit an Opponent with an Attacking Maneuver, increase the Wound Roll of your next Attacking Maneuver against that Opponent during this Combat Round by ${2 * tier} [2(T)].`,
      usageLimit: null,
      maxUses: null
    });
    // L3: Triggered — Defeat/Threshold Strike bonus
    triggered.push({
      id: "cg_defeat_strike",
      name: "Cruel Genetics (Defeat Strike)",
      description: `If you Defeat an Opponent or knock them through a Health Threshold, increase your Strike Rolls by ${tier} [1(T)] until the end of your turn.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Red Eye L3: 1/Round — set Critical Target to 5
  if (has.redEye && !disabled.has(TRAIT_IDS.redEye)) {
    triggered.push({
      id: "re_force_crit5",
      name: "Red Eye (Force Crit 5)",
      description: "When making an Attacking Maneuver, you can set the Critical Target for that Attacking Maneuver's Strike Roll to 5, ignoring all effects that increase or reduce the Critical Target.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Genetic Resolve L1: 1/Round — spend LP for Wound
  if (has.geneticResolve && !disabled.has(TRAIT_IDS.geneticResolve)) {
    triggered.push({
      id: "gr_lp_wound",
      name: "Genetic Resolve (LP for Wound)",
      description: `If you use the Signature Technique Maneuver, you may spend up to ${5 * baseTier} [5(bT)] Life Points to increase the Wound Roll of that Attacking Maneuver by an equal amount.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: 1/Round — Botch to Crit
    triggered.push({
      id: "gr_botch_to_crit",
      name: "Genetic Resolve (Botch to Crit)",
      description: "If you would score a Botch Result on a Combat Roll, instead score a Critical Result.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Namekian Cells L1: Triggered/Start of Combat Round (LP regain)
  if (has.namekianCells && !disabled.has(TRAIT_IDS.namekianCells)) {
    triggered.push({
      id: "nc_lp_regen",
      name: "Namekian Cells (LP Regen)",
      description: `Regain ${namekianCellsLP} [3(bT)] Life Points at the start of each Combat Round. This effect does not activate if you are Defeated or if you have 0 Ki Points.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Vengeful L1: 1/Round — Energy Charge on hit
  if (has.vengeful && !disabled.has(TRAIT_IDS.vengeful)) {
    triggered.push({
      id: "vg_energy_charge",
      name: "Vengeful (Energy Charge on Hit)",
      description: "If an Opponent hits you with an Attacking Maneuver, gain an Energy Charge on your next Attacking Maneuver before the end of your next turn.",
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: 1/Encounter — target for Wound bonus
    triggered.push({
      id: "vg_vendetta_target",
      name: "Vengeful (Vendetta)",
      description: `If an Opponent knocks you through the Injured Health Threshold or Defeats one of your allies, you may target that Opponent. For the remainder of the Combat Encounter, increase your Wound Rolls against that Opponent by ${3 * tier} [3(T)].`,
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Battle Thirst L1: 3/Encounter — choose Combat Roll to increase
  if (has.battleThirst && !disabled.has(TRAIT_IDS.battleThirst)) {
    triggered.push({
      id: "bt_combat_roll_increase",
      name: "Battle Thirst (Combat Roll Increase)",
      description: `At the end of each Combat Round, select one of your Combat Rolls and increase it by ${tier} [1(T)] for the remainder of the Combat Encounter. You cannot target the same Combat Roll you increased last Combat Round.`,
      usageLimit: "3/Encounter",
      maxUses: 3
    });
    // L2: Triggered/Undefeated
    triggered.push({
      id: "bt_double_apply",
      name: "Battle Thirst (Double Apply)",
      description: `Apply Battle Thirst two more times, but the bonus from Battle Thirst cannot exceed ${2 * tier} [2(T)] on any Combat Roll.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Negative Power L1: Triggered/Start of Combat Round
  if (has.negativePower && !disabled.has(TRAIT_IDS.negativePower)) {
    triggered.push({
      id: "np_lp_crit_reduction",
      name: "Negative Power (LP for Crit Reduction)",
      description: `Reduce your Life Points by up to ${8 * baseTier} [8(bT)]. For every ${4 * baseTier} [4(bT)] you reduce your Life Points by, reduce your Critical Target for all Combat Rolls by 1 until the end of this Combat Round.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Genetic Efficiency L2: Triggered — Ki reduction for Sig Tech
  if (has.geneticEfficiency && !disabled.has(TRAIT_IDS.geneticEfficiency)) {
    triggered.push({
      id: "ge_ki_reduction",
      name: "Genetic Efficiency (Ki Reduction)",
      description: `When using a Signature Technique, reduce the Ki Point Cost by ${2 * tier} [2(T)].`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Rapid Learner L2: Triggered/End of Combat Round
  if (has.rapidLearner && !disabled.has(TRAIT_IDS.rapidLearner)) {
    triggered.push({
      id: "rl_study_opponent",
      name: "Rapid Learner (Study Opponent)",
      description: `Select an Opponent. Increase your Combat Rolls against your selected Opponent by ${baseTier} [1(bT)] until the end of the next Combat Round.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Organic Consumption L2: Triggered — Power Up after large Absorb
  if (has.organicConsumption && !disabled.has(TRAIT_IDS.organicConsumption)) {
    triggered.push({
      id: "oc_absorb_powerup",
      name: "Organic Consumption (Absorb Power Up)",
      description: `If you recovered more than ${7 * baseTier} [7(bT)] Life Points through the Absorbing Attack Maneuver on an Opponent of equal or higher ToP, you may use the Power Up Maneuver as an Out-of-Sequence Maneuver.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Store derived data for UI display
  system.bioAndroidBonuses = {
    has,
    splicingOption,
    geneticResilienceLifeMod,
    geneticGeniusCritReduction,
    powerCoreSurgeBonus,
    powerCoreKiPerRound,
    redEyePerception,
    redEyeCritReduction,
    namekianCellsLP,
    geneticEfficiencyWound,
    geneticModIntimidation,
    triggered
  };
}
