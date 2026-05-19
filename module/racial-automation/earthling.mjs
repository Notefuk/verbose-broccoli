/**
 * Earthling Racial Trait Automation
 * Applies passive and activated trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "earthling".
 */

// Earthling trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  earthlingResolve: "25181f616f393434",     // Primary
  experiencedFighter: "aeb42774d74cd701",   // Primary
  eyeOfTheDragon: "c60ab5342c4c148c",      // Secondary (option-based)
  threeEyes: "8dc1f5dccaa32645",            // Secondary
  quickToMaster: "88540705a686b987",        // Secondary
  lastResort: "621c1056b0beb98a",           // Secondary
  partBeast: "979b43c2cb80c474"             // Secondary
};

/**
 * Count how many health thresholds the character is currently below.
 * @param {object} system
 * @returns {number} 0-3
 */
function countThresholdsBelow(system) {
  return system.thresholds?.crossedCount ?? 0;
}

/**
 * Apply all automatable Earthling racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyEarthlingBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  // Track which traits are present (for UI flags)
  const has = {
    earthlingResolve: traitIds.includes(TRAIT_IDS.earthlingResolve),
    experiencedFighter: traitIds.includes(TRAIT_IDS.experiencedFighter),
    eyeOfTheDragon: traitIds.includes(TRAIT_IDS.eyeOfTheDragon),
    threeEyes: traitIds.includes(TRAIT_IDS.threeEyes),
    quickToMaster: traitIds.includes(TRAIT_IDS.quickToMaster),
    lastResort: traitIds.includes(TRAIT_IDS.lastResort),
    partBeast: traitIds.includes(TRAIT_IDS.partBeast)
  };

  const disabled = system._disabledRacialPassives || new Set();

  const thresholdsBelow = countThresholdsBelow(system);

  // ---- Earthling Resolve L1: +1(T) Strike and Wound per threshold below ----
  let earthlingResolveStrike = 0;
  let earthlingResolveWound = 0;
  if (has.earthlingResolve && !disabled.has(TRAIT_IDS.earthlingResolve) && thresholdsBelow > 0) {
    earthlingResolveStrike = thresholdsBelow * tier;
    earthlingResolveWound = thresholdsBelow * tier;
    system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + earthlingResolveStrike;
    system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + earthlingResolveWound;
  }

  // ---- Experienced Fighter: mode-based bonus (1/Round, 4(bT) Ki) ----
  const ef = system.experiencedFighter || { mode: "none", usedThisRound: false };
  let efStrikeBonus = 0;
  let efDodgeBonus = 0;
  let efWoundBonus = 0;
  let efDamageCategoryBonus = 0;
  let efKiCost = 4 * baseTier;

  if (has.experiencedFighter && !disabled.has(TRAIT_IDS.experiencedFighter) && ef.usedThisRound && ef.mode !== "none") {
    if (ef.mode === "strike") {
      efStrikeBonus = 2 * tier;
      system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + efStrikeBonus;
    } else if (ef.mode === "dodge") {
      efDodgeBonus = 2 * tier;
      system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + efDodgeBonus;
    } else if (ef.mode === "wound") {
      efWoundBonus = 3 * tier;
      efDamageCategoryBonus = 1;
      system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + efWoundBonus;
      system.aptitudes.bonusDamageCategory = (system.aptitudes.bonusDamageCategory || 0) + efDamageCategoryBonus;
    }
  }

  // ---- Three-Eyes L1: +1(T) Wound (Signature Technique) per threshold below ----
  let threeEyesWound = 0;
  if (has.threeEyes && !disabled.has(TRAIT_IDS.threeEyes) && thresholdsBelow > 0) {
    threeEyesWound = thresholdsBelow * tier;
    system.aptitudes.signatureTechniqueWoundBonus = (system.aptitudes.signatureTechniqueWoundBonus || 0) + threeEyesWound;
  }

  // ---- Part Beast L2: +2 Perception Skill Checks ----
  let partBeastPerception = 0;
  if (has.partBeast && !disabled.has(TRAIT_IDS.partBeast)) {
    partBeastPerception = 2;
    system.aptitudes.perceptionBonus = (system.aptitudes.perceptionBonus || 0) + partBeastPerception;
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Earthling Resolve L2: 1/Round — reroll low Natural Result
  if (has.earthlingResolve && !disabled.has(TRAIT_IDS.earthlingResolve)) {
    triggered.push({
      id: "er_reroll",
      name: "Earthling Resolve (Reroll)",
      description: "When you score a Natural Result of 2 or less, you may reroll your Base Dice. You must take the second result.",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Experienced Fighter L1: 1/Round — mode selection (already tracked via ef system)
  if (has.experiencedFighter && !disabled.has(TRAIT_IDS.experiencedFighter)) {
    triggered.push({
      id: "ef_mode_select",
      name: "Experienced Fighter (Mode Select)",
      description: `As an Instant Maneuver, spend ${efKiCost} [4(bT)] Ki Points to target an Opponent and apply one of: Exploitation Strike (+${2 * tier} Strike, doubled Diminishing Defense), Instinct-Driven Dodge (+${2 * tier} Dodge, ignore Diminishing), or Punishing Blow (+${3 * tier} Wound, +1 Damage Category).`,
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Eye of the Dragon: option-based effects (all listed)
  if (has.eyeOfTheDragon && !disabled.has(TRAIT_IDS.eyeOfTheDragon)) {
    triggered.push({
      id: "eotd_warrior_lp_wager",
      name: "Eye of the Dragon: Warrior (LP Ki Wager)",
      description: `When you use the Signature Technique Maneuver, you may reduce your Life Points by up to ${10 * baseTier} [10(bT)] to gain a free Ki Wager equal to the reduction. At L2, this also grants an Energy Charge.`,
      usageLimit: null,
      maxUses: null
    });
    triggered.push({
      id: "eotd_serene_dodge",
      name: "Eye of the Dragon: Serene (Mindful Dodge)",
      description: "While in the Mindful State, your Dodge Rolls have their Critical Target reduced by 1 and you increase the Natural Result by 1.",
      usageLimit: null,
      maxUses: null
    });
    triggered.push({
      id: "eotd_serene_mindful",
      name: "Eye of the Dragon: Serene (Enter Mindful)",
      description: `Spend ${6 * baseTier} [6(bT)] Ki Points. Enter the Mindful State until the end of your next turn. If already Mindful, gain an additional stack of Power instead.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    triggered.push({
      id: "eotd_weaponmaster",
      name: "Eye of the Dragon: Weaponmaster (Armed Strike)",
      description: `When targeting an Opponent with an Armed Attack, you may reduce your Defense Value by ${tier} [1(T)] until the start of your next turn to increase Strike by ${tier} [1(T)] and Wound by ${2 * tier} [2(T)].`,
      usageLimit: "1/Round",
      maxUses: 1
    });
    triggered.push({
      id: "eotd_pilot",
      name: "Eye of the Dragon: Pilot (Vehicle Wound)",
      description: `While piloting a Battle Jacket or Vehicle, you may spend up to ${10 * baseTier} [10(bT)] of its Life Points to increase the Wound Roll by an equal amount.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Quick to Master L2: Triggered — Sig Tech enhancement
  if (has.quickToMaster && !disabled.has(TRAIT_IDS.quickToMaster)) {
    triggered.push({
      id: "qtm_sig_enhance",
      name: "Quick to Master (Sig Tech Enhance)",
      description: "When you use the Signature Technique Maneuver, you may either: Apply an Energy Charge to that Attacking Maneuver, or add a single Advantage with a TP cost of up to 10 TP.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Last Resort L2: Triggered — bonus Wound below Injured
  if (has.lastResort && !disabled.has(TRAIT_IDS.lastResort)) {
    triggered.push({
      id: "lr_injured_wound",
      name: "Last Resort (Injured Wound)",
      description: `If you use a Signature Technique while below the Injured Health Threshold, increase the Wound Roll by ${tier}d4 [1d4(T)].`,
      usageLimit: null,
      maxUses: null
    });
    // L3: 1/Encounter — free Ultimate below Injured
    triggered.push({
      id: "lr_free_ultimate",
      name: "Last Resort (Free Ultimate)",
      description: "When you use an Ultimate Signature Technique while below the Injured Health Threshold, you do not have to pay the Ki Point Cost.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Store derived data for UI display
  system.earthlingBonuses = {
    has,
    thresholdsBelow,
    earthlingResolveStrike,
    earthlingResolveWound,
    efMode: ef.mode,
    efUsedThisRound: ef.usedThisRound,
    efStrikeBonus,
    efDodgeBonus,
    efWoundBonus,
    efDamageCategoryBonus,
    efKiCost,
    threeEyesWound,
    partBeastPerception,
    triggered
  };
}
