/**
 * Neko Majin Racial Trait Automation
 * Applies passive trait bonuses to derived stats.
 *
 * Called from actor.mjs _calculateRacialTraitBonuses() when race === "nekoMajin".
 */

// Neko Majin trait IDs from racial-traits-catalog.mjs
const TRAIT_IDS = {
  nekoMajinDama: "159482202823a161",
  nekoMimicry: "d4eaea2e948be854",
  felineBuild: "816970706bde0a30",
  quickThinking: "106be032fece0648",
  whimsicalMagic: "e9e2514cbc464935"
};

/**
 * Apply all automatable Neko Majin racial trait bonuses.
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyNekoMajinBonuses(system, tier, baseTier) {
  const traitIds = system.racialTraits || [];

  const has = {
    nekoMajinDama: traitIds.includes(TRAIT_IDS.nekoMajinDama),
    nekoMimicry: traitIds.includes(TRAIT_IDS.nekoMimicry),
    felineBuild: traitIds.includes(TRAIT_IDS.felineBuild),
    quickThinking: traitIds.includes(TRAIT_IDS.quickThinking),
    whimsicalMagic: traitIds.includes(TRAIT_IDS.whimsicalMagic)
  };

  const disabled = system._disabledRacialPassives || new Set();

  // ---- Feline Build L2: +2 Perception Skill Checks dice score ----
  let felinePerception = 0;
  if (has.felineBuild && !disabled.has(TRAIT_IDS.felineBuild)) {
    felinePerception = 2;
    system.aptitudes.perceptionBonus = (system.aptitudes.perceptionBonus || 0) + felinePerception;
  }

  // ---- Quick Thinking L1: +5 Technique Points from Skill Improvement ----
  let quickThinkingTP = 0;
  if (has.quickThinking && !disabled.has(TRAIT_IDS.quickThinking)) {
    quickThinkingTP = 5;
    system.aptitudes.techniquePointsPerSkillImprovement = (system.aptitudes.techniquePointsPerSkillImprovement || 0) + quickThinkingTP;
  }

  // ---- Build triggered effects array ----
  const triggered = [];

  // Neko Majin-Dama L3: 1/Round — Integrate Majin-Dama
  if (has.nekoMajinDama && !disabled.has(TRAIT_IDS.nekoMajinDama)) {
    triggered.push({
      id: "nmd_integrate",
      name: "Neko Majin-Dama (Integrate)",
      description: "You can spend 1 Action to Integrate a Majin-Dama you have Equipped.",
      usageLimit: "1/Round",
      maxUses: 1
    });
    // L4: 1/Round — expel Majin-Dama
    triggered.push({
      id: "nmd_expel",
      name: "Neko Majin-Dama (Expel)",
      description: "As an Instant Maneuver, you can spend 1 Action to expel an Integrated Majin-Dama. It stops being Integrated and is dropped or Equipped (your choice).",
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Neko Mimicry L3: 1/Encounter — change Profile on Copied Technique
  if (has.nekoMimicry && !disabled.has(TRAIT_IDS.nekoMimicry)) {
    triggered.push({
      id: "nm_profile_change",
      name: "Neko Mimicry (Profile Change)",
      description: `When using a Copied Technique, you may pay ${4 * baseTier} [4(bT)] Ki Points to change the Profile for that Signature Technique to any other Profile within its Foundation for this singular use (loses inapplicable Advantages/Disadvantages). Calculate Ki Point Cost change accordingly.`,
      usageLimit: "1/Encounter",
      maxUses: 1
    });
  }

  // Quick Thinking L2: Triggered — borrow Advantage
  if (has.quickThinking && !disabled.has(TRAIT_IDS.quickThinking)) {
    triggered.push({
      id: "qt_borrow_advantage",
      name: "Quick Thinking (Borrow Advantage)",
      description: "When you use a non-Copied Signature Technique, you may add a single Advantage with a TP cost of up to 10 TP from one of your Copied Techniques.",
      usageLimit: null,
      maxUses: null
    });
  }

  // Whimsical Magic L2: 1/Round
  if (has.whimsicalMagic && !disabled.has(TRAIT_IDS.whimsicalMagic)) {
    triggered.push({
      id: "wm_unique_move_resize",
      name: "Whimsical Magic (Move/Resize)",
      description: `When using a Unique Ability that targets one or more Characters, you may spend ${3 * baseTier} [3(bT)] Ki Points to target one Character and either: Move them a number of Squares equal to your Might in a straight line, or increase/decrease their Size Category by 1 until the start of your next turn.`,
      usageLimit: "1/Round",
      maxUses: 1
    });
  }

  // Store derived data for UI display
  system.nekoMajinBonuses = {
    has,
    felinePerception,
    quickThinkingTP,
    triggered
  };
}
