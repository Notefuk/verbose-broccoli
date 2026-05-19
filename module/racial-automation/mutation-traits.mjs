/**
 * Mutation Trait Automation
 * Applies passive trait bonuses from the selected Mutation Trait (part of the Mutation
 * Manifested Power). Each character with Mutation selects ONE Mutation Trait from the
 * catalog at CONFIG.DBU.transformationsCatalog.mutation.mutationTraits.
 *
 * Called from manifested-powers.mjs inside the "mutation" case of applyBonusesForKey().
 *
 * Pattern:
 *   entry.bonuses.push(...)       — passive stat modifications (description string)
 *   entry.conditionals.push(...)  — reference-only notes (manual tracking)
 *   entry.triggered.push({...})   — triggered effects with usage limits
 *   totals.X += amount            — stat totals for summary display
 *   system.field = value          — direct mutation of actor system data
 */
import { getBestialTraitName, normalizeBestialTraitId } from "./bestial-traits.mjs";

// ============================================================
// Main export
// ============================================================

/**
 * Look up the selected Mutation Trait and dispatch to its handler.
 * @param {object} system   - The actor's system data (mutated in place)
 * @param {number} tier     - Current Tier of Power
 * @param {number} baseTier - ceil(tier / 2)
 * @param {number} level    - Character's Power Level
 * @param {object} options  - Transformation option selections for this Mutation index
 * @param {object} entry    - { bonuses, conditionals, triggered } arrays to push into
 * @param {object} totals   - Accumulated stat totals object
 */
export function applyMutationTraitBonuses(system, tier, baseTier, level, options, entry, totals) {
  const traitId = options?.mutationTrait;
  if (!traitId) return;

  // Resolve catalog entry for display name
  const catalog = CONFIG.DBU?.transformationsCatalog?.mutation?.mutationTraits;
  const catalogEntry = Array.isArray(catalog)
    ? catalog.find(t => t.id === traitId)
    : null;
  const traitName = catalogEntry?.name || traitId;

  // Tag the entry so the sheet knows which mutation trait is active
  entry.mutationTraitId = traitId;
  entry.mutationTraitName = traitName;

  switch (traitId) {
    case "brute":           _applyBrute(system, tier, baseTier, entry, totals); break;
    case "captain":         _applyCaptain(system, tier, baseTier, entry, totals); break;
    case "dark_evolution":  _applyDarkEvolution(system, tier, baseTier, entry, totals); break;
    case "giant_gene":      _applyGiantGene(system, tier, baseTier, entry, totals); break;
    case "psychic":         _applyPsychic(system, tier, baseTier, entry, totals); break;
    case "speedster":       _applySpeedster(system, tier, baseTier, entry, totals); break;
    case "tactician":       _applyTactician(system, tier, baseTier, entry, totals); break;
    case "technician":      _applyTechnician(system, tier, baseTier, entry, totals); break;
    case "biodiversity":    _applyBiodiversity(system, tier, baseTier, entry, totals); break;
    case "dark_vassal":     _applyDarkVassal(system, tier, baseTier, level, entry, totals); break;
    case "dna_absorption":  _applyDnaAbsorption(system, tier, baseTier, entry, totals); break;
    case "emperor":         _applyEmperor(system, tier, baseTier, entry, totals); break;
    case "golden_fruit":    _applyGoldenFruit(system, tier, baseTier, entry, totals); break;
    case "legendary":       _applyLegendary(system, tier, baseTier, entry, totals); break;
    case "og_soldier":      _applyOgSoldier(system, tier, baseTier, entry, totals); break;
    case "spreading_shadow": _applySpreadingShadow(system, tier, baseTier, entry, totals); break;
    case "were_creature":   _applyWereCreature(system, tier, baseTier, entry, totals); break;
    case "custom_mutation": _applyCustomMutation(system, tier, baseTier, entry, totals); break;
    default:
      entry.conditionals.push(`Unknown Mutation Trait: ${traitId}`);
      break;
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Safely read mutationState from the system, returning a mutable copy-safe reference.
 * @param {object} system
 * @returns {object}
 */
function _getMutState(system) {
  return system.transformationMeta?.mutationState || {};
}

/**
 * Write mutationState back to the system if the path exists.
 * @param {object} system
 * @param {object} mutState
 */
function _setMutState(system, mutState) {
  if (system.transformationMeta) system.transformationMeta.mutationState = mutState;
}

// ============================================================
// 1. Brute (Any)
// ============================================================

function _applyBrute(system, tier, baseTier, entry, totals) {
  // Lv1 [Passive]: +1(bT) Damage Reduction
  system.status.damageReduction = (system.status.damageReduction || 0) + baseTier;
  totals.dr += baseTier;
  entry.bonuses.push(`+${baseTier} Damage Reduction (Brute)`);

  // Lv2 [Triggered, 1/Round]: +2(T) Soak on Guard/Direct Hit
  entry.triggered.push({
    id: "brute_guard_soak",
    name: "Brute — Guard/Direct Hit Soak",
    description: `1/Round: +${2 * tier} Soak when using Guard or Direct Hit effect of Defend Maneuver`,
    usageLimit: "round",
    maxUses: 1
  });
}

// ============================================================
// 2. Captain (Any)
// ============================================================

function _applyCaptain(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  // Lv1 [Passive]: Hype Maneuver can use Personality Modifier instead of Score
  mutState.captainHypeOverride = true;
  entry.bonuses.push("Hype Maneuver: use Personality Modifier instead of Score (Captain)");

  // Lv2 [Triggered, 1/Encounter]: Superior State on Hype
  entry.triggered.push({
    id: "captain_superior_hype",
    name: "Captain — Superior on Hype",
    description: "1/Encounter: when you use the Hype Maneuver, enter the Superior State until end of your next turn",
    usageLimit: "encounter",
    maxUses: 1
  });

  _setMutState(system, mutState);
}

// ============================================================
// 3. Dark Evolution (Any)
// ============================================================

function _applyDarkEvolution(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  // Lv1 [Passive]: Gain 2 Monster Traits. Cannot select Mutating Beast.
  // The user's selected traits are stored in mutationState.darkEvolutionMonsterTraits
  const selected = Array.isArray(mutState.darkEvolutionMonsterTraits)
    ? mutState.darkEvolutionMonsterTraits
    : [];

  if (selected.length > 0) {
    entry.conditionals.push(`Monster Traits: ${selected.join(", ")}`);
  } else {
    entry.conditionals.push("Select 2 Monster Traits (cannot select Mutating Beast)");
  }
  entry.conditionals.push("Treat any Alternate/Legendary Form name as 'Monster Form' for Monster Trait effects");

  _setMutState(system, mutState);
}

// ============================================================
// 4. Giant Gene (Any)
// ============================================================

function _applyGiantGene(system, tier, baseTier, entry, totals) {
  // Lv1 [Passive]: Size Category becomes Enormous
  system.baseSize = "enormous";
  entry.bonuses.push("Size Category set to Enormous (Giant Gene)");

  // Lv2 [Triggered, 1/Round]: Reduce Damage by x(bT) where x = 2 * size categories larger
  entry.triggered.push({
    id: "giant_gene_damage_reduction",
    name: "Giant Gene — Size Damage Reduction",
    description: `1/Round: when hit by an Attacking Maneuver, reduce Damage by x*${baseTier} where x = 2 * size categories you are larger than the attacker`,
    usageLimit: "round",
    maxUses: 1
  });
}

// ============================================================
// 5. Psychic (Any)
// ============================================================

function _applyPsychic(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  // Lv1 [Passive]: +1 Energy Charge Dice Category for Magic Attacks
  mutState.psychicECDiceBonus = 1;
  entry.conditionals.push("+1 Energy Charge Dice Category for Magic Attacks (Psychic)");

  // Lv2 [Triggered, 1/Round, 2/Encounter]: Magic ST gains 1 Energy Charge
  entry.triggered.push({
    id: "psychic_magic_ec",
    name: "Psychic — Magic EC",
    description: "1/Round, 2/Encounter: when using a Magic Attack Signature Technique, it gains 1 Energy Charge",
    usageLimit: "round",
    maxUses: 1,
    encounterLimit: 2
  });

  _setMutState(system, mutState);
}

// ============================================================
// 6. Speedster (Any)
// ============================================================

function _applySpeedster(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  // Lv1 [Passive]: +1(bT) Speed
  system.status.normalSpeed = (system.status.normalSpeed || 0) + baseTier;
  entry.bonuses.push(`+${baseTier} Speed (Speedster)`);

  // Lv2 [Passive]: Reduce Blitz KP cost by 2(T)
  mutState.speedsterBlitzReduction = 2 * tier;
  entry.conditionals.push(`Reduce Blitz Profile KP cost by ${2 * tier} (Speedster)`);

  // Lv3 [Triggered, 1/Round]: Basic Attack after Rapid Movement
  entry.triggered.push({
    id: "speedster_rapid_attack",
    name: "Speedster — Rapid Movement Attack",
    description: "1/Round: after using Rapid Movement, make a Basic Attack as an Out-of-Sequence Maneuver",
    usageLimit: "round",
    maxUses: 1
  });

  _setMutState(system, mutState);
}

// ============================================================
// 7. Tactician (Any)
// ============================================================

function _applyTactician(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  // Lv1 [Passive]: Analysis Maneuver can use Scholarship Modifier instead of Score
  mutState.tacticianAnalysisOverride = true;
  entry.bonuses.push("Analysis Maneuver: use Scholarship Modifier instead of Score (Tactician)");

  // Lv2 [Triggered, 1/Encounter]: Superior State on Analysis
  entry.triggered.push({
    id: "tactician_superior_analysis",
    name: "Tactician — Superior on Analysis",
    description: "1/Encounter: when you use the Analysis Maneuver, enter the Superior State until end of your next turn",
    usageLimit: "encounter",
    maxUses: 1
  });

  _setMutState(system, mutState);
}

// ============================================================
// 8. Technician (Any)
// ============================================================

function _applyTechnician(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  // Lv1 [Passive]: +1 Energy Charge Dice Category for Physical/Energy Attacks
  mutState.technicianECDiceBonus = 1;
  entry.conditionals.push("+1 Energy Charge Dice Category for Physical/Energy Attacks (Technician)");

  // Lv2 [Triggered, 1/Round, 2/Encounter]: Physical/Energy ST gains 1 Energy Charge
  entry.triggered.push({
    id: "technician_pe_ec",
    name: "Technician — Physical/Energy EC",
    description: "1/Round, 2/Encounter: when using a Physical or Energy Attack Signature Technique, it gains 1 Energy Charge",
    usageLimit: "round",
    maxUses: 1,
    encounterLimit: 2
  });

  _setMutState(system, mutState);
}

// ============================================================
// 9. Biodiversity (Bio-Android)
// ============================================================

function _applyBiodiversity(system, tier, baseTier, entry, totals) {
  // Reference only — an additional Genetic Splicing trait is stored in
  // additionalTraitSelections.biodiversity on the transformation options.
  entry.conditionals.push("Gain an additional Secondary Racial Trait from Genetic Splicing (Biodiversity)");

  const mutState = _getMutState(system);
  const additionalTraits = mutState.additionalTraitSelections || {};
  if (additionalTraits.biodiversity) {
    entry.conditionals.push(`Biodiversity trait: ${additionalTraits.biodiversity}`);
  }
  _setMutState(system, mutState);
}

// ============================================================
// 10. Dark Vassal (Namekian — Demon Clan)
// ============================================================

function _applyDarkVassal(system, tier, baseTier, level, entry, totals) {
  const mutState = _getMutState(system);

  // Read and normalize selected bestial traits (filter invalid legacy values)
  const bestialTraitsRaw = Array.isArray(mutState.darkVassalBestialTraits)
    ? mutState.darkVassalBestialTraits
    : [];
  const validBestialTraits = bestialTraitsRaw
    .map(t => normalizeBestialTraitId(t))
    .filter(Boolean);
  const numBestialTraits = validBestialTraits.length;

  // Gain Killer Instinct Racial Trait
  mutState.hasKillerInstinct = true;
  entry.bonuses.push("Gain Killer Instinct Racial Trait (Dark Vassal)");

  // LP reduction is applied in actor.mjs _calculateResources (before thresholds)
  // Display the reduction in the bonuses list for UI
  if (numBestialTraits > 0) {
    const lpReduction = numBestialTraits * level;
    entry.bonuses.push(`-${lpReduction} Max LP (${numBestialTraits} Bestial Traits x ${level} PL)`);
  }

  // Conditionals for bestial traits (resolve IDs to display names)
  if (validBestialTraits.length > 0) {
    const displayNames = validBestialTraits.map(t => getBestialTraitName(t));
    entry.conditionals.push(`Bestial Traits: ${displayNames.join(", ")}`);
  } else {
    entry.conditionals.push("Select up to 2 Bestial Traits (Dark Vassal)");
  }

  _setMutState(system, mutState);
}

// ============================================================
// 11. DNA Absorption (Majin)
// ============================================================

function _applyDnaAbsorption(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  // dnaStacks: array of { name, attributes: { ag, fo, te, sc, in, ma, pe }, ... }
  const dnaStacks = Array.isArray(mutState.dnaStacks) ? mutState.dnaStacks : [];
  const activeIdx = typeof mutState.activeDnaStackIndex === "number"
    ? mutState.activeDnaStackIndex
    : -1;

  // Show stack count
  entry.conditionals.push(`DNA Stacks: ${dnaStacks.length}/3`);

  // If an active stack is selected and valid, apply attribute bonuses
  if (activeIdx >= 0 && activeIdx < dnaStacks.length) {
    const activeStack = dnaStacks[activeIdx];
    const stackName = activeStack?.name || `Stack ${activeIdx + 1}`;
    entry.bonuses.push(`Active DNA Stack: ${stackName}`);

    // Per attribute: ceil(suppScore / 4), capped at baseTier
    // Actual score bonuses applied in _applyEarlyMutationEffects (actor.mjs) for chain ordering.
    // Display-only entries here.
    const attrKeys = ["ag", "fo", "te", "sc", "in", "ma", "pe"];
    for (const key of attrKeys) {
      const suppScore = activeStack?.attributes?.[key] ?? 0;
      if (suppScore <= 0) continue;
      const bonus = Math.min(Math.ceil(suppScore / 4), baseTier);
      if (bonus > 0) {
        entry.bonuses.push(`+${bonus} ${key.toUpperCase()} (DNA: ceil(${suppScore}/4), cap ${baseTier})`);
      }
    }
  } else if (dnaStacks.length > 0) {
    entry.conditionals.push("No DNA Stack currently active — spend 1 Action to activate");
  }

  // Triggered reference: activation cost
  entry.triggered.push({
    id: "dna_absorption_activate",
    name: "DNA Absorption — Activate Stack",
    description: `Spend 1 Action and ${10 * baseTier} KP to benefit from a DNA Stack for the remainder of the Combat Encounter`,
    usageLimit: null,
    maxUses: null
  });

  _setMutState(system, mutState);
}

// ============================================================
// 12. Emperor (Arcosian)
// ============================================================

function _applyEmperor(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  // Lv1 [Passive]: Divergent Evolution becomes 'Mutant', gain +1 Meta Trait
  mutState.emperorExtraMetaTrait = true;
  entry.conditionals.push("Divergent Evolution choice becomes 'Mutant' (Emperor)");
  entry.conditionals.push("+1 Meta Trait (Emperor)");

  // Lv2 [Triggered/Start of Combat Round]: Gain 2 Cruelty stacks
  mutState.emperorCrueltyPerRound = 2;
  entry.triggered.push({
    id: "emperor_cruelty",
    name: "Emperor — Cruelty",
    description: "Start of Combat Round: gain 2 stacks of Cruelty",
    usageLimit: null,
    maxUses: null
  });

  _setMutState(system, mutState);
}

// ============================================================
// 13. Golden Fruit (Shinjin)
// ============================================================

function _applyGoldenFruit(system, tier, baseTier, entry, totals) {
  // Lv1 [Passive]: Always in God Ki Special State
  if (system.godKi) {
    system.godKi.permanent = true;
  }
  entry.bonuses.push("Permanently in God Ki Special State (Golden Fruit)");

  // Lv2 [Triggered, 1/Encounter]: Set DKP to 25(bT) on God Ki transformation entry
  entry.triggered.push({
    id: "golden_fruit_dkp",
    name: "Golden Fruit — DKP Set",
    description: `1/Encounter: when entering a Transformation with God Ki Aspect, set Divine Ki Points to ${25 * baseTier}`,
    usageLimit: "encounter",
    maxUses: 1
  });
}

// ============================================================
// 14. Legendary (Saiyan)
// ============================================================

function _applyLegendary(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  // Lv1 [Passive]: Increase max Battle Born Wound stacks by 2
  // The actual cap enforcement is in saiyan.mjs via mutationState.legendaryWoundCapBonus
  mutState.legendaryWoundCapBonus = 2;
  entry.bonuses.push("+2 Battle Born Wound Roll stack cap (Legendary)");

  // LSS1 and Legendary Oozaru gain Prelude Aspect + access to Legendary Traits
  entry.conditionals.push("Legendary Super Saiyan 1 and Legendary Oozaru gain Prelude Aspect (Legendary)");
  entry.conditionals.push("Gain access to Legendary Traits for LSS1 (select 1) and Legendary Oozaru (Legendary)");
  entry.conditionals.push("No Legendary Traits are gained upon accessing these Transformations");

  _setMutState(system, mutState);
}

// ============================================================
// 15. OG Soldier (Android)
// ============================================================

function _applyOgSoldier(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  // Read stored copies
  const copies = Array.isArray(mutState.ogSoldierCopies) ? mutState.ogSoldierCopies : [];
  const activeIdx = typeof mutState.ogSoldierActiveCopyIndex === "number"
    ? mutState.ogSoldierActiveCopyIndex
    : -1;

  // Show copy count
  entry.conditionals.push(`OG Soldier Copies: ${copies.length}/3`);

  // If an active copy is selected and valid, show info
  if (activeIdx >= 0 && activeIdx < copies.length) {
    const activeCopy = copies[activeIdx];
    const copyName = activeCopy?.name || `Copy ${activeIdx + 1}`;
    const actionsSpent = activeCopy?.actionsSpent ?? 0;
    entry.bonuses.push(`Active Copy: ${copyName} (${actionsSpent}/9 Actions spent)`);

    // Store active overrides so other systems can reference the copy's data
    mutState.ogSoldierActiveOverrides = activeCopy;

    if (actionsSpent >= 9) {
      entry.conditionals.push(`WARNING: Copy "${copyName}" has reached 9 Actions — access lost permanently`);
    }
  } else if (copies.length > 0) {
    entry.conditionals.push("No Copy currently active — spend 1 Action to activate");
  }

  // Triggered: Grab Neck (Copy creation via Grapple)
  entry.triggered.push({
    id: "og_soldier_grab_neck",
    name: "OG Soldier — Grab Neck",
    description: "When entering a Grapple as Grappler, grab their neck as Instant Maneuver to gain a Copy (max 3). Records: STs, UAs, Auras, Transformations, ToP, up to 3 Body-Category Racial Traits",
    usageLimit: null,
    maxUses: null
  });

  // Triggered: Activate Copy (1/Round)
  entry.triggered.push({
    id: "og_soldier_activate",
    name: "OG Soldier — Activate Copy",
    description: "1/Round: spend 1 Action to select a Copy. Replace STs, UAs, Auras, Transformations, ToP, and chosen Racial Traits with the Copy's. After 9 Actions total, lose that Copy permanently",
    usageLimit: "round",
    maxUses: 1
  });

  _setMutState(system, mutState);
}

// ============================================================
// 16. Spreading Shadow (Shadow Dragon)
// ============================================================

function _applySpreadingShadow(system, tier, baseTier, entry, totals) {
  // Reference only — additional Supernatural Powers option stored in
  // additionalTraitSelections.spreadingShadow
  entry.conditionals.push("Gain an additional Option effect of Supernatural Powers (Spreading Shadow)");

  const mutState = _getMutState(system);
  const additionalTraits = mutState.additionalTraitSelections || {};
  if (additionalTraits.spreadingShadow) {
    entry.conditionals.push(`Spreading Shadow option: ${additionalTraits.spreadingShadow}`);
  }
  _setMutState(system, mutState);
}

// ============================================================
// 17. Were-creature (Earthling — Human)
// ============================================================

function _applyWereCreature(system, tier, baseTier, entry, totals) {
  const mutState = _getMutState(system);

  const isActive = !!mutState.wereCreatureActive;
  const bestialTraitsRaw = Array.isArray(mutState.wereCreatureBestialTraits)
    ? mutState.wereCreatureBestialTraits
    : [];
  const validBestialTraits = bestialTraitsRaw
    .map(t => normalizeBestialTraitId(t))
    .filter(Boolean);
  const option = mutState.wereCreatureOption || ""; // "free_control" or "traditional"
  // For Traditional: 2 selected attribute keys (e.g. ["ag", "fo"])
  const selectedAttrs = Array.isArray(mutState.wereCreatureAttributes)
    ? mutState.wereCreatureAttributes
    : [];

  // Show selected bestial traits (resolve IDs to display names)
  if (validBestialTraits.length > 0) {
    const displayNames = validBestialTraits.map(t => getBestialTraitName(t));
    entry.conditionals.push(`Were-creature Bestial Traits: ${displayNames.join(", ")}`);
  } else {
    entry.conditionals.push("Select 2 Bestial Traits (Were-creature)");
  }

  // Show selected option
  if (option === "free_control") {
    entry.conditionals.push("Option: Free Control — spend 1 Action to trade Earthling Secondary Trait for Bestial Traits, end as Instant Maneuver");
  } else if (option === "traditional") {
    entry.conditionals.push("Option: Traditional — stimulus triggers involuntary transformation");
    if (selectedAttrs.length > 0) {
      entry.conditionals.push(`Selected Attributes for +1(T) bonus: ${selectedAttrs.map(a => a.toUpperCase()).join(", ")}`);
    }
  } else {
    entry.conditionals.push("Select option: Free Control or Traditional (Were-creature)");
  }

  // If currently active (transformed)
  if (isActive) {
    // Set subrace to Beast-Man
    system.subrace = "beast-man";
    entry.bonuses.push("Subrace set to Beast-Man (Were-creature active)");

    // For Traditional option: +1(T) to 2 selected attributes (must be AG/FO/TE/MA)
    // Actual modifier bonuses applied in _applyEarlyMutationEffects (actor.mjs) for chain ordering.
    // Display-only entries here.
    const validTraditionalAttrs = ["ag", "fo", "te", "ma"];
    if (option === "traditional" && selectedAttrs.length > 0) {
      for (const key of selectedAttrs) {
        if (!validTraditionalAttrs.includes(key)) continue;
        entry.bonuses.push(`+${tier} ${key.toUpperCase()} (Traditional Were-creature)`);
      }
    }
  }

  _setMutState(system, mutState);
}

// ============================================================
// 18. Custom Mutation (Custom Species)
// ============================================================

function _applyCustomMutation(system, tier, baseTier, entry, totals) {
  // Reference only — additional Secondary Racial Trait stored in
  // additionalTraitSelections.customMutation, with optional Flaw flag
  entry.conditionals.push("Gain an additional Secondary Racial Trait (Custom Mutation)");

  const mutState = _getMutState(system);
  const additionalTraits = mutState.additionalTraitSelections || {};
  if (additionalTraits.customMutation) {
    entry.conditionals.push(`Custom Mutation trait: ${additionalTraits.customMutation}`);
  }
  if (additionalTraits.customMutationFlaw) {
    entry.conditionals.push("Flaw Trait gained — Flaw Effect from that Secondary Racial Trait applies");
  }
  _setMutState(system, mutState);
}
