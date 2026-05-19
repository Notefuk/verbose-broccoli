/**
 * Saiyan Racial Trait Automation
 * Applies Battle Born stack bonuses and passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "saiyan".
 */

// Saiyan trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  battleBorn: "908d85ede236e3ce",
  saiyanHeritage: "41c68475bc754d8d",
  warriorsPride: "0e77ef7abcc3238f",
  bloodOfTheWarrior: "c3a6e753a1718faa",
  powerfulPhysique: "789eddac35ea858f",
  thrillOfTheFight: "7ef1f8429ed49fbe",      // Full-Blooded subrace
  warriorOfTwoWorlds: "c75c656ca80bf9da",    // Half-Blood subrace
  greaterPotential: "c8d597262f8e9ef5",
  primitiveDurability: "eb2130ec6b01c350",   // Ancient subrace
  primordialResolve: "b507c64377256044"      // Ancient subrace
};

/**
 * Apply all automatable Saiyan racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applySaiyanBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];
  const bb = system.battleBorn || { strike: 0, dodge: 0, wound: 0, undying: false };

  // Enforce per-roll cap: 2 normally, 3 with undying
  const cap = bb.undying ? 3 : 2;
  // Legendary Mutation Trait: +2 max Battle Born wound stacks
  const legendaryWoundBonus = system.transformationMeta?.mutationState?.legendaryWoundCapBonus || 0;
  const woundCap = cap + legendaryWoundBonus;
  bb.strike = Math.min(bb.strike, cap);
  bb.dodge = Math.min(bb.dodge, cap);
  bb.wound = Math.min(bb.wound, woundCap);

  // Derived totals
  bb.total = bb.strike + bb.dodge + bb.wound;
  bb.woundCap = woundCap;
  bb.maxTotal = cap * 2 + woundCap;
  bb.cap = cap;
  bb.strikeBonus = bb.strike * tier;
  bb.dodgeBonus = bb.dodge * tier;
  bb.woundBonus = bb.wound * tier;

  // Track which traits are present (for UI flags)
  const has = {
    battleBorn: traitIds.includes(TRAIT_IDS.battleBorn),
    saiyanHeritage: traitIds.includes(TRAIT_IDS.saiyanHeritage),
    warriorsPride: traitIds.includes(TRAIT_IDS.warriorsPride),
    bloodOfTheWarrior: traitIds.includes(TRAIT_IDS.bloodOfTheWarrior),
    powerfulPhysique: traitIds.includes(TRAIT_IDS.powerfulPhysique),
    thrillOfTheFight: traitIds.includes(TRAIT_IDS.thrillOfTheFight),
    warriorOfTwoWorlds: traitIds.includes(TRAIT_IDS.warriorOfTwoWorlds),
    greaterPotential: traitIds.includes(TRAIT_IDS.greaterPotential),
    primitiveDurability: traitIds.includes(TRAIT_IDS.primitiveDurability),
    primordialResolve: traitIds.includes(TRAIT_IDS.primordialResolve)
  };

  // Respect effect-panel passive toggles
  const disabled = system._disabledRacialPassives || new Set();

  // ---- Saiyan Heritage L1 Option ----
  let heritageTailedStressBonus = 0;
  let heritageTaillessBonus = 0;
  if (has.saiyanHeritage && !disabled.has(TRAIT_IDS.saiyanHeritage)) {
    const optSel = system.racialOptionSelections || {};
    const heritageSel = optSel[TRAIT_IDS.saiyanHeritage];
    const chosenOption = heritageSel?.["1"] ?? heritageSel?.[1] ?? "";
    if (chosenOption === "Tailed") {
      // Tailed: +1 Stress Bonus (doubled at bT 5+)
      heritageTailedStressBonus = baseTier >= 5 ? 2 : 1;
      system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + heritageTailedStressBonus;
    } else if (chosenOption === "Tailless") {
      // Tailless: +1(T) to FO/MA Attribute Modifiers of any active Core Transformations
      // Core = Alternate Forms, Legendary Forms, Transcendent Enhancements (transformation-rules.txt:68)
      const CORE_TYPES = ["form_alternate", "form_legendary", "enhancement_transcendent"];
      const allTrans = [...(system.transformations || []), ...(system._gainedActiveTransformations || [])];
      const hasActiveCoreTransformation = allTrans.some(t => t.active && CORE_TYPES.includes(t.transformationType));
      if (hasActiveCoreTransformation) {
        heritageTaillessBonus = tier;
        system.attributes.fo.modifier += heritageTaillessBonus;
        system.attributes.fo.totalScore = system.attributes.fo.score + system.attributes.fo.modifier;
        system.attributes.ma.modifier += heritageTaillessBonus;
        system.attributes.ma.totalScore = system.attributes.ma.score + system.attributes.ma.modifier;
      }
    }
  }

  // ---- Primitive Durability L1: +1(T) Soak per 2 stacks, max 3(T) ----
  let primitiveDurabilitySoak = 0;
  if (has.primitiveDurability && !disabled.has(TRAIT_IDS.primitiveDurability)) {
    primitiveDurabilitySoak = Math.min(Math.floor(bb.total / 2), 3) * tier;
    system.status.soak = (system.status.soak || 0) + primitiveDurabilitySoak;
  }

  // ---- Greater Potential L1: +1(T) Wound when 4+ total stacks ----
  // "Double this bonus for any Attacking Maneuver made through the Signature Technique Maneuver"
  let greaterPotentialWound = 0;
  let greaterPotentialSigTechWound = 0;
  if (has.greaterPotential && !disabled.has(TRAIT_IDS.greaterPotential) && bb.total >= 4) {
    greaterPotentialWound = tier;
    greaterPotentialSigTechWound = 2 * tier;
    bb.woundBonus += greaterPotentialWound;
  }

  // ---- Warrior's Pride L1: +1(bT) Cognitive Save ----
  let warriorsPrideBonus = 0;
  if (has.warriorsPride && !disabled.has(TRAIT_IDS.warriorsPride) && system.savingThrows?.cognitive !== undefined) {
    warriorsPrideBonus = baseTier;
    system.savingThrows.cognitive.bonus += warriorsPrideBonus;
  }

  // ---- Powerful Physique L1: +ceil(FO mod / 4) Soak, min +1 ----
  let powerfulPhysiqueSoak = 0;
  if (has.powerfulPhysique && !disabled.has(TRAIT_IDS.powerfulPhysique)) {
    const foTotal = system.attributes.fo?.totalScore ?? system.attributes.fo?.score ?? 0;
    powerfulPhysiqueSoak = Math.max(1, Math.ceil(foTotal / 4));
    system.status.soak = (system.status.soak || 0) + powerfulPhysiqueSoak;
  }

  // ---- Blood of the Warrior L1: +2(T) Wound on Attacks with Ki Wager >= 1/4 Max Capacity ----
  let bloodOfWarriorWound = 0;
  if (has.bloodOfTheWarrior && !disabled.has(TRAIT_IDS.bloodOfTheWarrior)) {
    bloodOfWarriorWound = 2 * tier;
    system.aptitudes.bloodOfWarriorWoundBonus = (system.aptitudes.bloodOfWarriorWoundBonus || 0) + bloodOfWarriorWound;
    system.aptitudes.bloodOfWarriorKiWagerThreshold = Math.ceil((system.capacity?.max || 0) / 4);
  }

  // ---- Warrior of Two Worlds L1 Option (Half-Blood) ----
  let inheritedFuryWound = 0;        // Raging: +1(bT) Wound per threshold below
  let inheritedAggressionWound = 0;  // vs opponent: +1(bT) Wound per opponent threshold below
  let inheritedResolveDR = 0;        // below Injured: +1(bT) DR
  let inheritedWillSSTReduce = 0;    // Tailless: -1 (or -2 at base ToP 5+) Super Saiyan ST Req
  let inheritedWillSSAttrBonus = 0;  // Tailed: +1(T) Super Saiyan FO/MA
  if (has.warriorOfTwoWorlds && !disabled.has(TRAIT_IDS.warriorOfTwoWorlds)) {
    const optSel = system.racialOptionSelections || {};
    const w2wSel = optSel[TRAIT_IDS.warriorOfTwoWorlds];
    const chosen = w2wSel?.["1"] ?? w2wSel?.[1] ?? "";

    if (chosen === "Inherited Fury") {
      if (system.combatStates?.raging) {
        // Per rules: thresholds below for self OR ally with lowest (whichever higher).
        // We only know self's count here; combat automation can supply ally count.
        const ownCrossed = system.thresholds?.crossedCount ?? 0;
        const allyCrossed = system._inheritedFuryAllyCrossed ?? 0;
        const xCount = Math.max(ownCrossed, allyCrossed);
        inheritedFuryWound = baseTier * xCount;
        system.aptitudes.inheritedFuryWoundBonus = (system.aptitudes.inheritedFuryWoundBonus || 0) + inheritedFuryWound;
      } else {
        system.aptitudes.inheritedFuryPotentialPerThreshold = baseTier;
      }
    } else if (chosen === "Inherited Bloodlust") {
      system.aptitudes.inheritedBloodlustEnabled = true;
    } else if (chosen === "Inherited Will") {
      const heritageSel = optSel[TRAIT_IDS.saiyanHeritage];
      const tail = heritageSel?.["1"] ?? heritageSel?.[1] ?? "";
      const baseTopForReduce = (system._baseTop ?? tier);
      if (tail === "Tailless") {
        inheritedWillSSTReduce = baseTopForReduce >= 5 ? 2 : 1;
        system.aptitudes.inheritedWillSuperSaiyanSTReduce = (system.aptitudes.inheritedWillSuperSaiyanSTReduce || 0) + inheritedWillSSTReduce;
      } else if (tail === "Tailed") {
        inheritedWillSSAttrBonus = tier;
        system.aptitudes.inheritedWillSuperSaiyanAttrBonus = (system.aptitudes.inheritedWillSuperSaiyanAttrBonus || 0) + inheritedWillSSAttrBonus;
      }
    } else if (chosen === "Inherited Aggression") {
      inheritedAggressionWound = baseTier;
      system.aptitudes.inheritedAggressionWoundPerOpponentThreshold = (system.aptitudes.inheritedAggressionWoundPerOpponentThreshold || 0) + inheritedAggressionWound;
    } else if (chosen === "Inherited Resolve") {
      const hs = system.status?.healthStatus || "healthy";
      if (hs === "injured" || hs === "critical") {
        inheritedResolveDR = baseTier;
        system.status.dr = (system.status.dr || 0) + inheritedResolveDR;
      } else {
        system.aptitudes.inheritedResolvePotentialDR = baseTier;
      }
    }
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Battle Born L2: Triggered/Threshold
  if (has.battleBorn) {
    triggered.push({
      id: "bb_threshold_stack",
      name: "Battle Born (Threshold)",
      description: "Gain a stack of Battle Born.",
      usageLimit: null,
      maxUses: null
    });
    // Battle Born L3: Triggered/Undying
    triggered.push({
      id: "bb_undying_max",
      name: "Battle Born (Undying)",
      description: "Set the number of Battle Born stacks on each Combat Roll to 3, regardless of the limit. This effect cannot decrease the number of Battle Born stacks on any Combat Roll.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Saiyan Heritage L3: Tail regrowth
  if (has.saiyanHeritage) {
    triggered.push({
      id: "heritage_tail_regrowth",
      name: "Saiyan Heritage (Tail Regrowth)",
      description: "When you lose your tail, you may roll 1d4 and increase your Dice Score by +1. If you do, you regrow your tail after participating in a number of Combat Encounters equal to your Dice Score. If you do not use this effect, your Option effect becomes Tailless and you never regrow your tail.",
      usageLimit: null,
      maxUses: null
    });
    // Saiyan Heritage L4: 1/Encounter Karma Point spend
    triggered.push({
      id: "heritage_karma_regrowth",
      name: "Saiyan Heritage (Instant Regrowth)",
      description: "During the last of the Combat Encounters you must participate in, as an Instant Maneuver, you may spend 1 Karma Point to immediately regrow your tail instead of waiting until the Combat Encounter has ended.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Warrior's Pride L2: 1/Encounter, Triggered/Power
  if (has.warriorsPride) {
    triggered.push({
      id: "wp_superior_state",
      name: "Warrior's Pride (Superior State)",
      description: "Enter the Superior State until the end of your next turn.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Blood of the Warrior L2: Triggered/Threshold
  if (has.bloodOfTheWarrior) {
    triggered.push({
      id: "botw_power_surge",
      name: "Blood of the Warrior (Power Surge)",
      description: "You may immediately use a Power Surge as an Out-of-Sequence Maneuver.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Powerful Physique L3: Triggered/Defeated
  if (has.powerfulPhysique) {
    triggered.push({
      id: "pp_undying_attempt",
      name: "Powerful Physique (Undying Attempt)",
      description: "You may make a Steadfast Check (if you do, reduce your Dice Score by 2). If you succeed, you enter the Undying State until the end of your next turn.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Thrill of the Fight L1: Triggered/Start of Combat Encounter (Full-Blooded)
  if (has.thrillOfTheFight) {
    triggered.push({
      id: "totf_start_stack",
      name: "Thrill of the Fight (Combat Start)",
      description: "Gain a stack of Battle Born.",
      usageLimit: null,
      maxUses: null
    });
    // L2: Triggered/Start of Turn, 1/Encounter
    triggered.push({
      id: "totf_tier_increase",
      name: "Thrill of the Fight (Tier Increase)",
      description: "If you have 6+ stacks of Battle Born or you are below the Injured Health Threshold, you may increase your Tier of Power by +1 (Breakthrough) until the end of your turn.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Warrior of Two Worlds L2: Option-based (Half-Blood)
  // All 5 options listed — player uses only their chosen option
  if (has.warriorOfTwoWorlds) {
    triggered.push({
      id: "w2w_inherited_fury",
      name: "Inherited Fury",
      description: "If you trigger the second effect of Greater Potential, enter the Raging State until the end of your next turn. If you were already in the Raging State, enter the Surging State for this effect instead.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
    triggered.push({
      id: "w2w_inherited_bloodlust",
      name: "Inherited Bloodlust",
      description: "If you trigger the second effect of Greater Potential, increase your Tier of Power by 1 (Breakthrough) until the end of your turn.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
    triggered.push({
      id: "w2w_inherited_will",
      name: "Inherited Will",
      description: "If you would make a Stress Test roll while in a Transformation of the Super Saiyan Transformation Line, you may automatically succeed that roll. If you do, reduce your Stress Bonus by 2 until the end of your next turn.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
    triggered.push({
      id: "w2w_inherited_aggression",
      name: "Inherited Aggression",
      description: "You may spend 1 Counter Action to use the Power Up Maneuver, Energy Charge Maneuver or Basic Attack Maneuver as an Out-of-Sequence Maneuver. If you do, you cannot use any Counter Maneuvers until the start of your next turn.",
      usageLimit: null,
      maxUses: null
    });
    triggered.push({
      id: "w2w_inherited_resolve",
      name: "Inherited Resolve",
      description: `Regain x×${baseTier} Life and Ki Points, where x is equal to the number of Health Thresholds you are below.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Greater Potential L2: 1/Encounter (Half-Blood)
  if (has.greaterPotential) {
    triggered.push({
      id: "gp_ally_threshold",
      name: "Greater Potential (Ally Threshold/Defeat)",
      description: "If you or an Ally is knocked through the Injured Health Threshold, you may gain a stack of Battle Born. If an Ally is Defeated, you may instead gain 2 stacks of Battle Born.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Primitive Durability L2: Triggered/Undying (Ancient)
  if (has.primitiveDurability) {
    triggered.push({
      id: "pd_undying_surge",
      name: "Primitive Durability (Undying Surge)",
      description: "Use a Healing Surge as an Out-of-Sequence Maneuver.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Primordial Resolve L1: 1/Encounter, Triggered/Threshold (Ancient)
  if (has.primordialResolve) {
    triggered.push({
      id: "pr_threshold_stack",
      name: "Primordial Resolve (Threshold Stack)",
      description: "Gain an additional stack of Battle Born.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
    // L2: 1/Encounter
    triggered.push({
      id: "pr_auto_steadfast",
      name: "Primordial Resolve (Auto Steadfast)",
      description: "When you would make a Steadfast Check, you can pass it automatically.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Store derived data for UI display
  system.battleBorn = bb;
  system.racialBonuses = {
    has,
    heritageTailedStressBonus,
    heritageTaillessBonus,
    primitiveDurabilitySoak,
    greaterPotentialWound,
    greaterPotentialSigTechWound,
    warriorsPrideBonus,
    powerfulPhysiqueSoak,
    bloodOfWarriorWound,
    inheritedFuryWound,
    inheritedAggressionWound,
    inheritedResolveDR,
    inheritedWillSSTReduce,
    inheritedWillSSAttrBonus,
    triggered
  };
}
