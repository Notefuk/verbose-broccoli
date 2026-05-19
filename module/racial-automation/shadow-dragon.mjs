/**
 * Shadow Dragon Racial Trait Automation
 * Applies passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "shadowDragon".
 *
 * Option-based traits use tracked field:
 *   system.supernaturalPowersOption
 */

// Shadow Dragon trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  negativeEnergy: "806cd400236a36f4",
  personifiedDragonBall: "0b4055f5823fe927",
  dragonicPhysique: "7905e38dd077bed8",
  karmicReflection: "6f36dd7c19eb8f46",
  wrathOfTheDragon: "b8b8464354ef6fc6",
  supernaturalPowers: "f4c712e6b1200dcb"
};

/**
 * Apply all automatable Shadow Dragon racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyShadowDragonBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  const has = {
    negativeEnergy: traitIds.includes(TRAIT_IDS.negativeEnergy),
    personifiedDragonBall: traitIds.includes(TRAIT_IDS.personifiedDragonBall),
    dragonicPhysique: traitIds.includes(TRAIT_IDS.dragonicPhysique),
    karmicReflection: traitIds.includes(TRAIT_IDS.karmicReflection),
    wrathOfTheDragon: traitIds.includes(TRAIT_IDS.wrathOfTheDragon),
    supernaturalPowers: traitIds.includes(TRAIT_IDS.supernaturalPowers)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // ---- Wrath of the Dragon L1: +2(T) Wound Dice on Crit Result ----
  let wrathCritWound = 0;
  if (has.wrathOfTheDragon && !disabled.has(TRAIT_IDS.wrathOfTheDragon)) {
    wrathCritWound = 2 * tier;
    system.aptitudes.critWoundDiceBonus = (system.aptitudes.critWoundDiceBonus || 0) + wrathCritWound;
  }

  // ---- Supernatural Powers Option ----
  const supernaturalRaw = (system.racialOptionSelections?.[TRAIT_IDS.supernaturalPowers]?.["1"]
                        ?? system.racialOptionSelections?.[TRAIT_IDS.supernaturalPowers]?.[1]
                        ?? system.supernaturalPowersOption ?? "none");
  const supernaturalOpt = String(supernaturalRaw).toLowerCase();
  let sinisterNaturalWound = 0;
  let sinisterNaturalDefend = 0;
  let ominousCombatBonus = 0;
  if (has.supernaturalPowers && !disabled.has(TRAIT_IDS.supernaturalPowers) && supernaturalOpt !== "none") {
    if (supernaturalOpt.includes("sinister")) {
      // +1 Natural Result Wound Rolls, -1 Natural Result Wound against
      sinisterNaturalWound = 1;
      sinisterNaturalDefend = 1;
      system.aptitudes.woundNaturalResultBonus = (system.aptitudes.woundNaturalResultBonus || 0) + sinisterNaturalWound;
      system.aptitudes.woundDefendNaturalResultPenalty = (system.aptitudes.woundDefendNaturalResultPenalty || 0) + sinisterNaturalDefend;
    } else if (supernaturalOpt.includes("ominous")) {
      // L2: +1(bT) Combat Rolls if Personality highest Attribute Score
      const peScore = system.attributes.pe?.score ?? 0;
      const foScore = system.attributes.fo?.score ?? 0;
      const maScore = system.attributes.ma?.score ?? 0;
      const agScore = system.attributes.ag?.score ?? 0;
      const inScore = system.attributes.in?.score ?? 0;
      const teScore = system.attributes.te?.score ?? 0;
      const maxOther = Math.max(foScore, maScore, agScore, inScore, teScore);
      if (peScore > maxOther) {
        ominousCombatBonus = baseTier;
        system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + ominousCombatBonus;
        system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + ominousCombatBonus;
        system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + ominousCombatBonus;
      }
    }
    // Other options are triggered/limited/display
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Negative Energy L1: Triggered/Start of Combat Round, Resource
  if (has.negativeEnergy && !disabled.has(TRAIT_IDS.negativeEnergy)) {
    triggered.push({
      id: "ne_gain_energy",
      name: "Negative Energy (Gain)",
      description: `Reduce your Life Points by up to ${8 * baseTier} [8(bT)]. For every ${2 * baseTier} [2(bT)] Life Points lost, gain 1 Negative Energy until the end of the Combat Round.`,
      usageLimit: null,
      maxUses: null
    });
    // L2: Triggered — spend Negative Energy to debuff
    triggered.push({
      id: "ne_spend_debuff",
      name: "Negative Energy (Debuff Roll)",
      description: `When an Opponent makes a Combat Roll, before they make that roll, you may spend 1 Negative Energy to reduce the Natural Result of that roll by 1 and the Dice Score by ${tier} [1(T)].`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Personified Dragon Ball L3: Triggered — Ki on Negative Energy gain
  if (has.personifiedDragonBall && !disabled.has(TRAIT_IDS.personifiedDragonBall)) {
    triggered.push({
      id: "pdb_ki_on_ne",
      name: "Personified Dragon Ball (Ki on NE Gain)",
      description: `Whenever you gain Negative Energy, regain x×${tier} [x(T)] Ki Points, where x is equal to the amount of Negative Energy you have gained.`,
      usageLimit: null,
      maxUses: null
    });
  }

  // Dragonic Physique L2: Triggered — Steadfast debuff
  if (has.dragonicPhysique && !disabled.has(TRAIT_IDS.dragonicPhysique)) {
    triggered.push({
      id: "dp_steadfast_debuff",
      name: "Dragonic Physique (Steadfast Debuff)",
      description: "If your Opponent makes a Steadfast Check due to the Damage inflicted through one of your Attacking Maneuvers, you may spend 1 Negative Energy to reduce their Steadfast Check by 2.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Karmic Reflection L1: 1/Round — Botch Strike for Crit Wound
  if (has.karmicReflection && !disabled.has(TRAIT_IDS.karmicReflection)) {
    triggered.push({
      id: "kr_botch_for_crit",
      name: "Karmic Reflection (Botch for Crit Wound)",
      description: "When making a Strike Roll for an Attacking Maneuver against an Opponent, you may choose to score a Botch Result regardless of your Natural Result. If you do, your Wound Roll for that Attacking Maneuver automatically scores a Critical Result regardless of your Natural Result.",
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L2: 1/Encounter — force Opponent Botch
    triggered.push({
      id: "kr_force_botch",
      name: "Karmic Reflection (Force Opponent Botch)",
      description: "When an Opponent makes a Combat Roll within your Melee Range, they score a Botch Result regardless of their Natural Result. If the result would have been a Critical Result, it is also no longer a Critical Result.",
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Wrath of the Dragon L2: 1/Round — spend LP for Wound
  if (has.wrathOfTheDragon && !disabled.has(TRAIT_IDS.wrathOfTheDragon)) {
    triggered.push({
      id: "wotd_lp_wound",
      name: "Wrath of the Dragon (LP for Wound)",
      description: `When using a Signature Technique, you may spend ${2 * baseTier} [2(bT)] Life Points to increase the Wound Roll by x, where x is equal to 1/4 (rounded up) of the Life Points you've lost this Combat Round.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Supernatural Powers: option-dependent triggered effects
  if (has.supernaturalPowers && !disabled.has(TRAIT_IDS.supernaturalPowers) && supernaturalOpt !== "none") {
    if (supernaturalOpt === "hazy") {
      triggered.push({
        id: "sp_hazy_weather",
        name: "Hazy Dragon (Battle Weather)",
        description: "Choose a Battle Weather and a Weather Effect. Spend up to 3 Actions to create a Standard Sphere AoE centered on you that applies the chosen Battle Weather and Weather Effect. For every Action spent after the first, increase the Magnitude of this AoE. Lasts until end of Combat Encounter. You can remove this Battle Weather as an Instant Maneuver.",
        usageLimit: "2/Encounter",
        maxUses: 2
      });
    } else if (supernaturalOpt === "noble") {
      triggered.push({
        id: "sp_noble_morale",
        name: "Noble Dragon (Morale Clash)",
        description: "Spend 1 Action to target an Opponent. Make a Morale Clash against them. If you win, you both gain the Compelled Combat Condition against one another until the start of your next turn.",
        usageLimit: "1/Round",
        maxUses: 1
      });
    } else if (supernaturalOpt === "regenerative") {
      triggered.push({
        id: "sp_regen_create_slime",
        name: "Regenerative Dragon (Dragon Slime)",
        description: "When you gain 2+ Negative Energy at once, create a Dragon Slime in an unoccupied Square adjacent to you. A Dragon Slime is a Duplicate Minion that cannot trigger Racial Trait effects and can only use Movement and Grapple Maneuvers (always has at least 1 Action). If you Command them, they can also use Basic Attack.",
        usageLimit: null,
        maxUses: null
      });
      triggered.push({
        id: "sp_regen_defeat_heal",
        name: "Regenerative Dragon (Defeat Heal)",
        description: "When Defeated, all Dragon Slimes are instantly Defeated and you regain Life Points equal to 1/2 of the total Life Points all Dragon Slimes possessed. Then use a Healing Surge as an Out-of-Sequence Maneuver.",
        usageLimit: null,
        maxUses: null
      });
    } else if (supernaturalOpt === "natural") {
      triggered.push({
        id: "sp_natural_lookalike",
        name: "Natural Dragon (Lookalike Dragon Ball)",
        description: "You can spend 1 Action to turn into a Lookalike Dragon Ball. While a Lookalike Dragon Ball, you are of the Tiny Size Category and cannot use any Attacking Maneuvers. You can return to normal as an Instant Maneuver.",
        usageLimit: "1/Round",
        maxUses: 1
      });
    } else if (supernaturalOpt === "sinister") {
      // L2: Triggered/Power, 1/Round
      triggered.push({
        id: "sp_sinister_wound",
        name: "Sinister Dragon (Power Wound)",
        description: `Increase your Wound Rolls until the end of your turn by ${tier} [1(T)].`,
        usageLimit: "1/Round",
        maxUses: 1
      });
    }
  }

  // Store derived data for UI display
  system.shadowDragonBonuses = {
    has,
    supernaturalOpt,
    wrathCritWound,
    sinisterNaturalWound,
    sinisterNaturalDefend,
    ominousCombatBonus,
    triggered
  };
}
