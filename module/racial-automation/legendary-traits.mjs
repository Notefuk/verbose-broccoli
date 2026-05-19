/**
 * Legendary Trait Automation
 * Applies permanent, always-active legendary trait bonuses from Legendary Form transformations.
 *
 * Unlike legendary-forms.mjs (which applies bonuses only while the form is ACTIVE),
 * legendary traits are permanent — they remain active AT ALL TIMES after gaining access
 * to the form, even when NOT transformed.
 *
 * Each legendary form catalog entry has a `legendaryTraitGroup` field:
 *   - Single string: one trait, no choice (e.g. "Legendary: Pride of Namek")
 *   - Array: player chooses one (e.g. ["Legendary: Song of Hope", "Legendary: Blue Saiyan"])
 *
 * Player choices are stored in system.transformationMeta.legendaryTraitSelections:
 *   { "super_saiyan_blue": "Legendary: Song of Hope" }
 *
 * Called from actor.mjs between _applyTransformationAspects() and _calculateRacialTraitBonuses().
 */

// ============================================================
// Known Legendary Trait catalog keys (45 entries)
// ============================================================
const LEGENDARY_TRAIT_KEYS = new Set([
  "ajisa_namekian", "beast", "condensed_legendary_super_saiyan", "dark_king",
  "initial_demon_god", "true_demon_god", "destroyer_form", "divinity_unleashed",
  "empowered", "z_empowered", "super_empowered", "enhanced_transformation",
  "god_of_martial_arts", "godly_powers", "empowered_evolution", "brilliant_evolution",
  "hyper_mega_form", "legendary_super_saiyan_4", "liquid_metal", "mightiest_majin",
  "perfected_super_saiyan", "potential_unleashed", "pure_form", "splendid_evolution",
  "super_evolution", "super_grudge_amplification", "super_perfect_form",
  "super_saiyan_4", "super_saiyan_5", "super_saiyan_god", "super_saiyan_blue",
  "super_saiyan_rose", "super_star_dragon", "supreme_form", "ultimate_android",
  "ultimate_super_saiyan", "ultra_ego", "ultra_instinct_sign", "ultra_instinct_complete",
  "ultimate_form", "godslayer", "legendary_oozaru", "legendary_super_saiyan_1",
  "legendary_super_saiyan_2", "legendary_super_saiyan_3"
]);

/**
 * Parse grade/stacks from gradeOrStacks.
 * Format "current/max" (e.g. "3/5") or just a number.
 * @returns {number} minimum 1
 */
function parseGradeOrStacks(gradeOrStacks) {
  if (!gradeOrStacks) return 1;
  const str = String(gradeOrStacks).trim();
  const slashIdx = str.indexOf("/");
  const num = parseInt(slashIdx >= 0 ? str.substring(0, slashIdx) : str, 10);
  return isNaN(num) || num <= 0 ? 1 : num;
}

/**
 * Apply all permanent legendary trait bonuses.
 * Iterates ALL transformations (not just active) because these traits are permanent.
 *
 * @param {object} system - The actor's system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyLegendaryTraitBonuses(system, tier, baseTier) {
  const transformations = system.transformations || [];
  const catalog = CONFIG.DBU?.transformationsCatalog || {};
  const legendaryTraitSelections = system.transformationMeta?.legendaryTraitSelections || {};

  const result = {
    entries: [],
    hasBonuses: false
  };

  const totals = {
    soak: 0, defense: 0, dr: 0, might: 0,
    strike: 0, dodge: 0, wound: 0, combatRolls: 0,
    lpMax: 0, kpMax: 0, capacityMax: 0,
    speed: 0, initiative: 0, steadfast: 0,
    allSaves: 0, stressBonus: 0
  };

  for (let i = 0; i < transformations.length; i++) {
    const trans = transformations[i];
    // NOTE: Do NOT filter by trans.active — legendary traits are permanent
    const key = trans.catalogKey;
    if (!key || !LEGENDARY_TRAIT_KEYS.has(key)) continue;

    // Look up the catalog entry for this transformation
    const catalogEntry = catalog[key];
    if (!catalogEntry) continue;

    // Must be a legendary form
    if (catalogEntry.category !== "form_legendary") continue;

    // Must have a legendaryTraitGroup
    const traitGroup = catalogEntry.legendaryTraitGroup;
    if (!traitGroup) continue;

    // Resolve the selected trait name for multi-choice forms
    let selectedTraitName;
    if (Array.isArray(traitGroup)) {
      // Multi-choice: use player selection, default to first option
      selectedTraitName = legendaryTraitSelections[key];
      if (!selectedTraitName || !traitGroup.includes(selectedTraitName)) {
        selectedTraitName = traitGroup[0];
      }
    } else {
      // Single trait — use it directly
      selectedTraitName = traitGroup;
    }

    const G = parseGradeOrStacks(trans.gradeOrStacks);
    const entry = {
      name: selectedTraitName,
      catalogKey: key,
      sourceName: trans.name,
      bonuses: [],
      conditionals: [],
      triggered: []
    };

    applyLegendaryTraitForKey(key, system, tier, baseTier, entry, totals, selectedTraitName);

    if (entry.bonuses.length > 0 || entry.conditionals.length > 0 || entry.triggered.length > 0) {
      result.entries.push(entry);
      result.hasBonuses = true;
    }
  }

  // Store totals on the result and apply numeric totals to system stats
  result.totals = totals;

  // Apply accumulated numeric bonuses to system stats
  if (totals.soak) system.status.soak = (system.status.soak || 0) + totals.soak;
  if (totals.defense) system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + totals.defense;
  if (totals.dr) system.status.damageReduction = (system.status.damageReduction || 0) + totals.dr;
  if (totals.might) system.status.might = (system.status.might || 0) + totals.might;
  if (totals.strike) system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + totals.strike;
  if (totals.dodge) system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + totals.dodge;
  if (totals.wound) system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + totals.wound;
  if (totals.combatRolls) {
    system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + totals.combatRolls;
    system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + totals.combatRolls;
    system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + totals.combatRolls;
  }
  if (totals.lpMax) system.lifePoints.max = (system.lifePoints.max || 0) + totals.lpMax;
  if (totals.kpMax) system.kiPool.max = (system.kiPool.max || 0) + totals.kpMax;
  if (totals.capacityMax) system.capacity.max = (system.capacity.max || 0) + totals.capacityMax;
  if (totals.speed) {
    system.status.normalSpeed = (system.status.normalSpeed || 0) + totals.speed;
    system.status.boostedSpeed = (system.status.boostedSpeed || 0) + totals.speed;
  }
  if (totals.initiative) system.aptitudes.initiative = (system.aptitudes.initiative || 0) + totals.initiative;
  // steadfast: stored in result.totals for display, no established consumption path
  if (totals.allSaves) {
    for (const saveKey of ["impulsive", "corporeal", "cognitive", "morale"]) {
      if (system.savingThrows?.[saveKey]) {
        system.savingThrows[saveKey].bonus = (system.savingThrows[saveKey].bonus || 0) + totals.allSaves;
      }
    }
  }

  system.legendaryTraitBonuses = result;
}

// ============================================================
// Per-key legendary trait application
// ============================================================

/**
 * Apply the legendary trait bonus for a specific catalog key.
 *
 * @param {string} key - The catalog key
 * @param {object} system - Actor system data
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 * @param {object} entry - The entry object to push bonuses/conditionals/triggered into
 * @param {object} totals - Accumulated numeric totals
 * @param {string} selectedTraitName - The resolved legendary trait group name
 */
function applyLegendaryTraitForKey(key, system, tier, baseTier, entry, totals, selectedTraitName) {
  switch (key) {

    // ==========================================================
    // 1. AJISA NAMEKIAN — "Pride of Namek"
    // ==========================================================
    case "ajisa_namekian": {
      // Triggered/Defeated: Enter the Undying State for 3 Combat Rounds.
      entry.triggered.push({
        id: "pride_of_namek",
        name: "Pride of Namek",
        description: "When Defeated: Enter the Undying State for 3 Combat Rounds.",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 2. POTENTIAL UNLEASHED — "Brought to the Limit"
    // ==========================================================
    case "potential_unleashed": {
      // Passive: Double the Attribute Modifier Bonus for Unlocked Potential.
      // Complex — needs to find Unlocked Potential values at runtime.
      entry.conditionals.push("Double AM Bonus for Unlocked Potential");

      // Triggered, 1/Round: With 2+ Power stacks, apply ToP Extra Dice additional time.
      entry.triggered.push({
        id: "brought_to_limit_extra_dice",
        name: "Brought to the Limit",
        description: "1/Round: With 2+ Power, apply ToP Extra Dice additional time to Attacking Maneuver Combat Rolls.",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 3. DARK KING — "Bow to the King"
    // ==========================================================
    case "dark_king": {
      // Passive: +1(T) Combat Rolls against opponents with Combat Conditions.
      entry.conditionals.push("+1(T) Combat Rolls vs opponents with Combat Conditions");

      // Battle Uniform (text only).
      entry.conditionals.push("Battle Uniform: Demon King regalia");
      break;
    }

    // ==========================================================
    // 4. PURE FORM — "Sensation of Purity"
    // ==========================================================
    case "pure_form": {
      // Passive: +1(T) Defense Value and Strike Rolls while no Absorbed Characters (except Deeply Suppressed).
      entry.conditionals.push("+1(T) Defense and Strike (no absorbed characters)");
      break;
    }

    // ==========================================================
    // 5. MIGHTIEST MAJIN — "Scouting Potential"
    // ==========================================================
    case "mightiest_majin": {
      // Passive: +1(T) Dice Score of Clashes for Absorption Maneuver.
      entry.conditionals.push("+1(T) Dice Score on Absorption Clashes");
      break;
    }

    // ==========================================================
    // 6. CONDENSED LEGENDARY SUPER SAIYAN — "Sparks of Super Saiyan"
    // ==========================================================
    case "condensed_legendary_super_saiyan": {
      // Passive: While in a SS Transformation Line form, +2 Steadfast Check Dice Score.
      // Conditional — only applies while in SS line.
      entry.conditionals.push("+2 Steadfast Dice Score (while in SS line)");

      // Triggered, 1/Encounter: If transforming from SS line -> Legendary Saiyan line, +2 Stress Bonus.
      entry.triggered.push({
        id: "sparks_stress",
        name: "Sparks of Super Saiyan",
        description: "1/Enc: When transforming from SS \u2192 Legendary Saiyan line, +2 Stress Bonus.",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 7. LEGENDARY OOZARU — "Legend"
    // ==========================================================
    case "legendary_oozaru": {
      // Passive: +1(T) AMB(FO/TE) to every Great Ape line transformation.
      entry.conditionals.push("+1(T) AMB(FO/TE) to Great Ape line");

      // Passive: Cannot enter Golden Oozaru.
      entry.conditionals.push("Cannot enter Golden Oozaru");

      // Passive: +1(T) Strike Rolls while in Raging State.
      entry.conditionals.push("+1(T) Strike (while Raging)");
      break;
    }

    // ==========================================================
    // 8. SUPER PERFECT FORM — "Perfect Power"
    // ==========================================================
    case "super_perfect_form": {
      // 1/Round: Spend 2 Perfect Points to use Power Up or Energy Charge as Instant.
      entry.triggered.push({
        id: "perfect_power",
        name: "Perfect Power",
        description: "1/Round: Spend 2 Perfect Points to use Power Up or Energy Charge as Instant Maneuver.",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 9. BEAST — "Caged Beast"
    // ==========================================================
    case "beast": {
      // Triggered, 1/Encounter: When non-Minion Ally Defeated, transform into Beast as OoS.
      // If already in Beast, may use Exceed as OoS. Apply NLoP effects.
      entry.triggered.push({
        id: "caged_beast",
        name: "Caged Beast",
        description: "1/Enc: When a non-Minion Ally is Defeated, transform into Beast as Out-of-Sequence. If already in Beast, may Exceed as OoS. Apply NLoP effects.",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 10. ENHANCED TRANSFORMATION — "We Were Angels"
    // ==========================================================
    case "enhanced_transformation": {
      // Passive: -2 Stress Test for Ascended Form.
      entry.bonuses.push("-2 Stress Test for Ascended Form");
      totals.stressBonus += 2;
      system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 2;

      // Triggered, 1/Encounter: Auto-succeed a ST for Ascended Form line.
      entry.triggered.push({
        id: "we_were_angels_auto_st",
        name: "We Were Angels",
        description: "1/Enc: Auto-succeed a Stress Test for Ascended Form Transformation Line.",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 11-12. SUPER SAIYAN GOD / SUPER SAIYAN BLUE
    //        Choice: "Legendary: Song of Hope" or "Legendary: Blue Saiyan"
    // ==========================================================
    case "super_saiyan_god":
    case "super_saiyan_blue": {
      if (selectedTraitName === "Legendary: Song of Hope") {
        // Triggered/Power: Spend 2(bT) DKP: +2(T) to a Combat Roll at max BB until end of next turn.
        entry.triggered.push({
          id: "song_of_hope",
          name: "Song of Hope",
          description: "Triggered/Power: Spend " + (2 * baseTier) + " DKP: +" + (2 * tier) + " to a Combat Roll at max BB until end of next turn.",
          usageLimit: "power",
          maxUses: null
        });
      } else {
        // Blue Saiyan — Passive: +1(T) Speed and Strike while at max BB on all Combat Rolls
        entry.conditionals.push("+" + tier + " Speed and Strike (at max BB on all Combat Rolls)");
      }
      break;
    }

    // ==========================================================
    // 13. SUPER SAIYAN ROSÉ — "Legendary: Isn't this color beautiful?"
    // ==========================================================
    case "super_saiyan_rose": {
      // 1/Round: Spend 2(bT) DKP to use Aura or Energy Charge as Instant.
      entry.triggered.push({
        id: "beautiful_color",
        name: "Isn't this color beautiful?",
        description: "1/Round: Spend " + (2 * baseTier) + " DKP to use Aura or Energy Charge as Instant Maneuver.",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 14. SUPER SAIYAN 4 — "Legendary: Primal Saiyan Legacy"
    // ==========================================================
    case "super_saiyan_4": {
      // Triggered: Any Surge becomes Primal Surge (regain 2d10(T) LP+KP).
      entry.conditionals.push("Any Surge becomes Primal Surge: regain " + (2 * tier) + "d10 LP and KP");
      break;
    }

    // ==========================================================
    // 15. SUPER SAIYAN 5 — "Primal Focus"
    // ==========================================================
    case "super_saiyan_5": {
      // Triggered, 1/Round: Reduce LP by up to 10(bT) → +1/5 Strike, +equal Wound.
      entry.triggered.push({
        id: "primal_focus",
        name: "Primal Saiyan Tendency",
        description: "1/Round: Reduce LP by up to " + (10 * baseTier) + " → +1/5 Strike, +equal Wound on Attacking Maneuver. Not Defeated until after attack.",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 16. LEGENDARY SUPER SAIYAN 4 — "Legendary: Legend of GT"
    // ==========================================================
    case "legendary_super_saiyan_4": {
      // Passive: Healing Surges become Primal Surges.
      entry.conditionals.push("Healing Surges become Primal Surges");

      // Triggered, 1/Round: On knocking opponent through threshold with 10(bT)+ Ki Wager, use Primal Surge.
      entry.triggered.push({
        id: "legend_of_gt",
        name: "Legend of GT",
        description: "1/Round: On knocking opponent through threshold with " + (10 * baseTier) + "+ Ki Wager, use Primal Surge.",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 17-19. LEGENDARY SUPER SAIYAN 1/2/3
    //        Choice: "Legend of Z" or "Legend of Super"
    // ==========================================================
    case "legendary_super_saiyan_1":
    case "legendary_super_saiyan_2":
    case "legendary_super_saiyan_3": {
      if (selectedTraitName === "Legend of Z") {
        // Passive: +1(T) AMB(FO/TE/MA) to SS line forms.
        entry.conditionals.push("+" + tier + " AMB(FO/TE/MA) to SS line forms");
        // Passive: +1(T) Might.
        totals.might += tier;
        entry.bonuses.push("+" + tier + " Might (1×T)");
      } else {
        // Legend of Super
        // Passive: +1(T) AMB(FO/TE/MA) to Wrathful.
        entry.conditionals.push("+" + tier + " AMB(FO/TE/MA) to Wrathful");
        // Passive: -4 Stress Test for Wrathful.
        entry.bonuses.push("-4 Stress Test for Wrathful");
      }
      break;
    }

    // ==========================================================
    // 20. PERFECTED SUPER SAIYAN — "Super Saiyan Style"
    // ==========================================================
    case "perfected_super_saiyan": {
      // Passive: While 2+ Power stacks and in SS line, +1(T) AMB(FO/MA).
      entry.conditionals.push("+" + tier + " AMB(FO/MA) (2+ Power, in SS line)");

      // Triggered, 1/Encounter: On entering SS line form, double Legend Realized LP+KP regain.
      entry.triggered.push({
        id: "golden_warrior",
        name: "Super Saiyan Style",
        description: "1/Enc: On entering SS line form, double Legend Realized LP+KP regain.",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 21. ULTIMATE SUPER SAIYAN — "Legendary: Burst of Gold"
    // ==========================================================
    case "ultimate_super_saiyan": {
      // Triggered, 1/Round: On hit with 5(bT)+ Ki Wager in SS line/SS Power, +1 Damage Category.
      entry.triggered.push({
        id: "burst_of_gold",
        name: "Burst of Gold",
        description: "1/Round: On hit with " + (5 * baseTier) + "+ Ki Wager in SS line/SS Power, +1 Damage Category (doesn't stack with other DC increases).",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 22-24. EMPOWERED / Z EMPOWERED / SUPER EMPOWERED
    //        Choice: "Blaze Up!" / "Rock the Dragon" / "I Won't Stop Till the End!!"
    // ==========================================================
    case "empowered":
    case "z_empowered":
    case "super_empowered": {
      if (selectedTraitName === "Legendary: Blaze Up!") {
        // Triggered/Transform, 1/Encounter: Gain Greater Dice until end of next turn.
        // If below Injured threshold before transforming, +1d8(T) to Legend Realized.
        entry.triggered.push({
          id: "blaze_up",
          name: "Blaze Up!",
          description: "1/Enc on Transform: Gain Greater Dice until end of next turn. If below Injured threshold, +" + tier + "d8 to Legend Realized.",
          usageLimit: "encounter",
          maxUses: 1
        });
      } else if (selectedTraitName === "Legendary: Rock the Dragon") {
        // Passive: While in Alternate Form, reduce Ki Point Cost of all Maneuvers by 1(T).
        entry.conditionals.push("-" + tier + " KP Cost on all Maneuvers (in Alternate Form)");
        // Passive: While in Legendary Form, +2(T) Wound Rolls.
        entry.conditionals.push("+" + (2 * tier) + " Wound (in Legendary Form)");
      } else {
        // "Legendary: I Won't Stop Till the End!!"
        // Passive: While in Alternate Form, increase Damage Reduction by 1(T).
        entry.conditionals.push("+" + tier + " Damage Reduction (in Alternate Form)");
        // Passive: While in Legendary Form, increase Soak Value by 2(T).
        entry.conditionals.push("+" + (2 * tier) + " Soak (in Legendary Form)");
      }
      break;
    }

    // ==========================================================
    // 25-26. EMPOWERED EVOLUTION / BRILLIANT EVOLUTION
    //        Choice: "Deadly Finish" / "Deadly Glimmer"
    // ==========================================================
    case "empowered_evolution":
    case "brilliant_evolution": {
      if (selectedTraitName === "Legendary: Deadly Finish") {
        // Triggered, 1/Round: Signature Technique with 3+ Cruelty gains an Energy Charge.
        entry.triggered.push({
          id: "deadly_finish",
          name: "Deadly Finish",
          description: "1/Round: Signature Technique with 3+ Cruelty gains an Energy Charge.",
          usageLimit: "round",
          maxUses: 1
        });
      } else {
        // "Legendary: Deadly Glimmer"
        // Triggered: On Power Up or Energy Charge, gain 1 stack of Cruelty.
        entry.triggered.push({
          id: "deadly_glimmer",
          name: "Deadly Glimmer",
          description: "Triggered: On Power Up or Energy Charge, gain 1 stack of Cruelty.",
          usageLimit: null,
          maxUses: null
        });
      }
      break;
    }

    // ==========================================================
    // 27. SPLENDID EVOLUTION — "Legendary: Turn Brilliant"
    // ==========================================================
    case "splendid_evolution": {
      // Triggered/Transform, 1/Encounter: Maximize Cruelty stacks and enter Superior State.
      entry.triggered.push({
        id: "turn_brilliant",
        name: "Turn Brilliant",
        description: "1/Enc on Transform: Maximize Cruelty stacks and enter Superior State until end of next turn.",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 28. SUPER EVOLUTION — "Legendary: Domination"
    // ==========================================================
    case "super_evolution": {
      // Triggered, 1/Round: On maximizing Cruelty, next Signature Technique doubles Wound bonus.
      entry.triggered.push({
        id: "domination",
        name: "Domination",
        description: "1/Round: On maximizing Cruelty, next Signature Technique doubles Cruelty Wound bonus.",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 29. GODLY POWERS — "Legendary: Divine Energy"
    // ==========================================================
    case "godly_powers": {
      // Triggered/Power: Spend 4(bT) DKP for any 1-Action Maneuver as Out-of-Sequence.
      entry.triggered.push({
        id: "divine_energy",
        name: "Divine Energy",
        description: "Triggered/Power: Spend " + (4 * baseTier) + " DKP to use any 1-Action Maneuver as Out-of-Sequence. Works outside God Ki State.",
        usageLimit: "power",
        maxUses: null
      });
      break;
    }

    // ==========================================================
    // 30. GOD OF MARTIAL ARTS — "Legendary: Ease of Combat"
    // ==========================================================
    case "god_of_martial_arts": {
      // Passive: -2 Stress Test for all Enhancement Powers.
      entry.bonuses.push("-2 Stress Test for Enhancement Powers");
      // Passive: +1 DC Greater Dice with EP + Core Transformation.
      entry.conditionals.push("+1 DC Greater Dice (with Enhancement Power + Core Transformation)");
      break;
    }

    // ==========================================================
    // 31. SUPREME FORM — "Legendary: Supreme Energy"
    // ==========================================================
    case "supreme_form": {
      // Passive: Per Power stack, +1 DC to ToP Extra Dice and Greater Dice.
      entry.conditionals.push("Per Power stack: +1 DC to ToP Extra Dice and Greater Dice");
      // Triggered/Power, 1/Round: Gain additional Power stack.
      entry.triggered.push({
        id: "supreme_energy",
        name: "Supreme Energy",
        description: "1/Round on Power: Gain an additional Power stack.",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 32-33. ULTIMATE FORM / GODSLAYER
    //        Choice: "Power of a Universe I" / "Power of a Universe II"
    // ==========================================================
    case "ultimate_form":
    case "godslayer": {
      const universalPower = system.universeSeed?.universalPower || 0;
      if (selectedTraitName === "Legendary: Power of a Universe I") {
        if (universalPower > 0) {
          const kpAdd = universalPower * 2;
          totals.kpMax += kpAdd;
          entry.bonuses.push(`+${kpAdd} Max KP (2x Universe Seed Universal Power)`);
        }
        // Passive: While possessing Universe Seed, increase Max KP by 2× Universal Power.
        entry.conditionals.push("Max KP +2\u00D7 Universe Seed's Universal Power (while possessing seed)");
      } else {
        if (universalPower > 0) {
          const capAdd = Math.min(universalPower, Math.floor(system.capacity.max / 2));
          if (capAdd > 0) {
            totals.capacityMax += capAdd;
            entry.bonuses.push(`+${capAdd} Max Capacity (Universe Seed Universal Power)`);
          }
        }
        // "Legendary: Power of a Universe II"
        // Passive: While possessing Universe Seed, increase Max Capacity by Universal Power (max +1/2).
        entry.conditionals.push("Max Capacity + Universe Seed's Universal Power (while possessing seed, max +1/2)");
      }
      break;
    }

    // ==========================================================
    // 34-35. INITIAL DEMON GOD / TRUE DEMON GOD (fallthrough)
    //        Choice: "Legendary: Fiendish Sorcery" or "Legendary: Diabolic Destruction"
    // ==========================================================
    case "initial_demon_god":
    case "true_demon_god": {
      if (selectedTraitName === "Legendary: Fiendish Sorcery") {
        // Passive: Create a Fiendish Weapon with 3 Qualities + Unbreakable + Pondering Orb.
        entry.conditionals.push("Create a Fiendish Weapon with 3 Qualities + Unbreakable + Pondering Orb Special Qualities");
        // Passive: Ignore Weapon Penalties with Fiendish Weapon. Treat as Unarmed for effects.
        entry.conditionals.push("Ignore Weapon Penalties with Fiendish Weapon; treat as Unarmed Attack for all effects");
        // 1/Round: Warp Fiendish Weapon to grip as Instant.
        entry.triggered.push({
          id: "fiendish_sorcery_warp",
          name: "Fiendish Sorcery — Warp Weapon",
          description: "1/Round: As an Instant Maneuver, warp your Fiendish Weapon into your grip and equip it, regardless of its previous location. If another Character was holding it, it is unequipped from them.",
          usageLimit: "round",
          maxUses: 1
        });
        // Battle Uniform included.
        entry.conditionals.push("Battle Uniform (Fiendish Sorcery)");
      } else {
        // Legendary: Diabolic Destruction
        // Passive: +2(T) Wound Rolls with Fiendish Weapon vs opponent with Combat Condition.
        entry.conditionals.push("+" + (2 * tier) + " Wound Rolls with Fiendish Weapon vs opponents suffering from a Combat Condition");
        // Triggered, 1/Encounter: On hit with Fiendish Weapon vs opponent with Combat Condition, force Critical Wound Roll.
        entry.triggered.push({
          id: "diabolic_destruction",
          name: "Diabolic Destruction",
          description: "1/Enc: On hit with Fiendish Weapon vs opponent with a Combat Condition, score a Critical Result for the Wound Roll regardless of Natural Result.",
          usageLimit: "encounter",
          maxUses: 1
        });
      }
      break;
    }

    // ==========================================================
    // 36. DESTROYER FORM — "Legendary: Before Creation Comes Destruction"
    // ==========================================================
    case "destroyer_form": {
      // Passive: If Attacking Maneuver has DKP spent on KP Cost or Ki Wager, +1/4 (rounded up) of Soak Value to Wound Roll.
      entry.conditionals.push("+1/4 (rounded up) of Soak Value to Wound Roll (if DKP spent on KP Cost or Ki Wager)");
      // Triggered/Transform, 1/Encounter: On entering Power of Destruction EP, regain DKP = triple Power Level.
      entry.triggered.push({
        id: "before_creation_destruction",
        name: "Before Creation Comes Destruction",
        description: "1/Enc on Transform: Upon entering the Power of Destruction Enhancement Power, regain Divine Ki Points equal to triple your Power Level.",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 37. DIVINITY UNLEASHED — "Legendary: Divine Ascension"
    // ==========================================================
    case "divinity_unleashed": {
      // Passive/Ruling: Select a Unique Ability as Domain. When using Domain, choose one 1/Round effect.
      entry.conditionals.push("Select a Unique Ability as your Domain. When using Domain, apply one of the following 1/Round effects:");
      // 1/Round option: Regain 2(bT) DKP
      entry.triggered.push({
        id: "divine_ascension_dkp",
        name: "Divine Ascension — Regain DKP",
        description: "1/Round (Domain): Regain " + (2 * baseTier) + " Divine Ki Points.",
        usageLimit: "round",
        maxUses: 1
      });
      // 1/Round option: Allies in Sphere gain Power stack until end of turn
      entry.triggered.push({
        id: "divine_ascension_power",
        name: "Divine Ascension — Ally Power",
        description: "1/Round (Domain): All Allies within a Sphere AoE (centered on you) gain a stack of Power until the end of their turn.",
        usageLimit: "round",
        maxUses: 1
      });
      // 1/Round option: Use Empower or Power Up as OoS
      entry.triggered.push({
        id: "divine_ascension_empower",
        name: "Divine Ascension — Empower/Power Up",
        description: "1/Round (Domain): Use the Empower Maneuver or Power Up Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: "round",
        maxUses: 1
      });
      // Battle Uniform included.
      entry.conditionals.push("Battle Uniform (Divine Ascension)");
      break;
    }

    // ==========================================================
    // 38. HYPER MEGA FORM — "Legendary: Support Units"
    // ==========================================================
    case "hyper_mega_form": {
      // Complex: Create up to 4 Minion Soldiers (Android race, PL 3 lower).
      entry.conditionals.push("Create up to 4 Minion Soldiers (Android race, PL 3 lower than yours). Soldiers are Special Minions following normal Character Creation rules.");
      // Passive: Soldiers have access to all your Manifested Powers, Alternate Forms (incl. Masteries), and Enhancement Powers.
      entry.conditionals.push("Soldiers have access to all your Manifested Powers, Alternate Forms (incl. Masteries), and Enhancement Powers");
      // Passive: Each time you gain a Power Level, so do your Soldiers.
      entry.conditionals.push("Each time you gain a Power Level, so do your Soldiers (even Defeated/killed Soldiers)");
      // Passive: You do not gain Attribute Points from Soldiers who become Secondary Characters through Unify.
      entry.conditionals.push("No Attribute Points from Soldiers who become Secondary Characters via Unify");
      // Passive: Soldiers may use Merge Fusion with one another.
      entry.conditionals.push("Soldiers may use Merge Fusion with one another; Unifying with the Merge separates them into Secondary Characters");
      // Passive: Defeated/killed Soldiers can be regained outside of combat (method decided with ARC, min. 1 hour).
      entry.conditionals.push("Defeated/killed Soldiers may be regained outside of combat (method decided with ARC, min. 1 hour)");
      // Passive: For every Soldier not created, bonuses to Hyper Mega Form.
      entry.conditionals.push("Per Soldier not created: +1 ST Requirement, +1(T) AMB(AG/FO/TE/MA), +1(T) DR, +2(T) Wound (while in Hyper Mega Form)");
      break;
    }

    // ==========================================================
    // 39. LIQUID METAL — "Legendary: Metal Takeover"
    // ==========================================================
    case "liquid_metal": {
      // Passive: Gain Petrification Unique Ability + Metal Breath Advancement.
      entry.conditionals.push("Gain access to the Petrification Unique Ability and Metal Breath Advancement");
      // Triggered/Power, 1/Encounter: If your Square and all adjacent are Metal, +1 Tier until end of next turn.
      entry.triggered.push({
        id: "metal_takeover",
        name: "Metal Takeover",
        description: "1/Enc on Power: If the Square you are on and all adjacent Squares are Metal, increase your Tier of Power by 1 (Breakthrough) until the end of your next turn.",
        usageLimit: "encounter",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 40. SUPER GRUDGE AMPLIFICATION — "Legendary: Terrifying Vengeance"
    // ==========================================================
    case "super_grudge_amplification": {
      // Triggered, 1/Round: On hit with 2+ Revenge Points spent, Clash (Morale) → if win, Broken condition until end of turn.
      entry.triggered.push({
        id: "terrifying_vengeance",
        name: "Terrifying Vengeance",
        description: "1/Round: On hit with an Attacking Maneuver that you spent 2+ Revenge Points on, make a Clash (Morale) against that Opponent. If you win, they gain a stack of the Broken Combat Condition until the end of your turn.",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 41. SUPER STAR DRAGON — "Legendary: Negative Spiral"
    // ==========================================================
    case "super_star_dragon": {
      // Triggered, 1/Round: When you or Ally in Destructive Sphere AoE makes a Combat Roll, force Botch Result. Then regain 1d8(T) KP.
      entry.triggered.push({
        id: "negative_spiral",
        name: "Negative Spiral",
        description: "1/Round: When you or an Ally within a Destructive Sphere AoE (centered on you) makes a Combat Roll, force a Botch Result regardless of Natural Result or any prohibiting effects. Then, regain 1d8(" + tier + ") Ki Points.",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 42. ULTIMATE ANDROID — "Legendary: Pinnacle of Technology"
    // ==========================================================
    case "ultimate_android": {
      // Triggered, 1/Round: On Power Surge or gaining KP exceeding 1/5 Max KP through effect, use Energy Charge as OoS.
      entry.triggered.push({
        id: "pinnacle_of_technology",
        name: "Pinnacle of Technology",
        description: "1/Round: If you use the Power Surge Maneuver or gain Ki Points exceeding 1/5 of your Maximum Ki Point Pool through one of your effects, use the Energy Charge Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: "round",
        maxUses: 1
      });
      break;
    }

    // ==========================================================
    // 43. ULTRA EGO — "Legendary: Rampant Ego"
    // ==========================================================
    case "ultra_ego": {
      // Triggered/Power, 1/Round: +1 DC ToP Extra Dice for Strike and Wound until start of next turn.
      entry.triggered.push({
        id: "rampant_ego_extra_dice",
        name: "Rampant Ego — Extra Dice",
        description: "1/Round on Power: Increase your Tier of Power Extra Dice for your Strike and Wound Rolls by 1 Dice Category until the start of your next turn.",
        usageLimit: "round",
        maxUses: 1
      });
      // 1/Round: Use Power Up or Energy Charge as Instant.
      entry.triggered.push({
        id: "rampant_ego_instant",
        name: "Rampant Ego — Instant Maneuver",
        description: "1/Round: Use the Power Up Maneuver or Energy Charge Maneuver as an Instant Maneuver.",
        usageLimit: "round",
        maxUses: 1
      });
      // Passive: +1 Steadfast Dice Score.
      totals.steadfast += 1;
      entry.bonuses.push("+1 Steadfast Dice Score");
      break;
    }

    // ==========================================================
    // 44-45. ULTRA INSTINCT SIGN / ULTRA INSTINCT COMPLETE (fallthrough)
    //        Choice: "Legendary: Instinctual Movement" or "Legendary: Instinctual Combat"
    // ==========================================================
    case "ultra_instinct_sign":
    case "ultra_instinct_complete": {
      if (selectedTraitName === "Legendary: Instinctual Movement") {
        // Triggered/Power, 1/Round: +1 DC ToP Extra Dice for Dodge Rolls until start of next turn.
        entry.triggered.push({
          id: "instinctual_movement_dodge",
          name: "Instinctual Movement — Dodge Dice",
          description: "1/Round on Power: Increase your Tier of Power Extra Dice for your Dodge Rolls by 1 Dice Category until the start of your next turn.",
          usageLimit: "round",
          maxUses: 1
        });
        // 1/Round: Use Movement Maneuver or God Maneuver (1 Action) as Instant.
        entry.triggered.push({
          id: "instinctual_movement_instant",
          name: "Instinctual Movement — Instant Maneuver",
          description: "1/Round: Use the Movement Maneuver or a God Maneuver with an Action Cost of 1 as an Instant Maneuver.",
          usageLimit: "round",
          maxUses: 1
        });
      } else {
        // Legendary: Instinctual Combat
        // Triggered/Power, 1/Round: +1 DC ToP Extra Dice for Strike Rolls until start of next turn.
        entry.triggered.push({
          id: "instinctual_combat_strike",
          name: "Instinctual Combat — Strike Dice",
          description: "1/Round on Power: Increase your Tier of Power Extra Dice for your Strike Rolls by 1 Dice Category until the start of your next turn.",
          usageLimit: "round",
          maxUses: 1
        });
        // 1/Round: Use Basic Attack as Instant.
        entry.triggered.push({
          id: "instinctual_combat_instant",
          name: "Instinctual Combat — Instant Basic Attack",
          description: "1/Round: Use the Basic Attack Maneuver as an Instant Maneuver.",
          usageLimit: "round",
          maxUses: 1
        });
      }
      break;
    }

    // ==========================================================
    // DEFAULT — Key not yet implemented
    // ==========================================================
    default:
      break;
  }
}
