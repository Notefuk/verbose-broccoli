// =============================================================================
// MASTERY EFFECTS CATALOG
// Structured mastery effects for automation. Keyed by transformation catalogKey.
// Categories covered: form_alternate, manifested_power, enhancement_power, form_legendary
// =============================================================================

export const MASTERY_EFFECTS_CATALOG = {

  // ---------------------------------------------------------------------------
  // ALL-OUT FORM — Mastery: The Truth of your Power
  // ---------------------------------------------------------------------------
  "all_out_form": {
    name: "Mastery: The Truth of your Power",
    attrBonuses: {},
    aspectsToRemove: ["Draining"],    // effect 1: loses a level of Draining; effect 5: loses a level of Draining
    aspectsToAdd: ["Natural"],         // effect 5: replaces Strainless with Natural (Strainless removed, Natural added)
    conditionals: [
      // effect 1: loses a level of Draining → drainingReduction
      { type: "drainingReduction", value: 1, condition: { always: true } },
      // effect 1: gains a level of High Speed
      { type: "highSpeedLevel", value: 1, condition: { always: true } },
      // effect 5: loses a level of Draining → additional drainingReduction
      { type: "drainingReduction", value: 1, condition: { always: true } },
      // effect 5: gains a level of High Speed
      { type: "highSpeedLevel", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 2: While you have 0 stacks of Holding Back and at least 1 stack of Focused Power, increase your Wound Rolls by 2(T).
      "While you have 0 stacks of Holding Back and at least 1 stack of Focused Power, increase your Wound Rolls by 2(T).",
      // effect 3: All-Out Form may replace any Alternate Form for the Prerequisites of Legendary Forms.
      "All-Out Form may replace any Alternate Form for the Prerequisites of Legendary Forms.",
      // effect 4: 1/Round 2/Encounter — If you would gain a stack of Focused Power, gain an additional stack of Focused Power.
      "If you would gain a stack of Focused Power, gain an additional stack of Focused Power. (1/Round, 2/Encounter)",
      // effect 5: replaces Strainless with Natural — the removal of Strainless
      "All-Out Form loses the Strainless Aspect (replaced by Natural).",
    ],
  },

  // ---------------------------------------------------------------------------
  // ASCENDED SUPER SAIYAN — Mastery: Tactical Muscle
  // ---------------------------------------------------------------------------
  "ascended_super_saiyan": {
    name: "Mastery: Tactical Muscle",
    attrBonuses: {},
    aspectsToRemove: ["Power High", "Dedicated"],  // effect 1: loses both Power High and Dedicated
    aspectsToAdd: ["Heartbeat"],                     // effect 1: gains Heartbeat
    conditionals: [],
    narrative: [
      // effect 2: The second grade of Ascended Super Saiyan ignores the penalties of a single stack of Super Stack.
      "The second grade of Ascended Super Saiyan ignores the penalties of a single stack of Super Stack.",
      // effect 3: When you use the second effect of Golden Power, you may enter the Superior State instead of the Raging State...
      "When you use the second effect of Golden Power, you may enter the Superior State instead of the Raging State. The increase to Dice Category through the effects of the Raging Aspect apply to Greater Dice instead for the duration of this effect.",
    ],
  },

  // ---------------------------------------------------------------------------
  // BEYOND GOD — Mastery: Assimilated Divinity
  // ---------------------------------------------------------------------------
  "beyond_god": {
    name: "Mastery: Assimilated Divinity",
    attrBonuses: {},
    aspectsToRemove: ["Strainless"],  // effect 1: loses Strainless
    aspectsToAdd: ["Natural"],         // effect 1: gains Natural
    conditionals: [
      // effect 2: While you have 2+ stacks of Power, increase AMB (FO/MA) by 1(T)
      { type: "attrBonus", attr: "fo", value: "+1(T)", condition: { state: "power2plus" } },
      { type: "attrBonus", attr: "ma", value: "+1(T)", condition: { state: "power2plus" } },
    ],
    narrative: [
      "While you have 2+ stacks of Power, increase Beyond God's Attribute Modifier Bonuses (FO/MA) by 1(T).",
    ],
  },

  // ---------------------------------------------------------------------------
  // DARK DEMON — Mastery: Darkest Demon
  // ---------------------------------------------------------------------------
  "dark_demon": {
    name: "Mastery: Darkest Demon",
    attrBonuses: {},
    aspectsToRemove: ["Draining"],  // effect 1: loses the Draining Aspect
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 2: 1/Round — If you would spend Darkness as part of an effect, gain 1 Darkness.
      "If you would spend Darkness as part of an effect, gain 1 Darkness. (1/Round)",
      // effect 3: Triggered/Injured — The third effect of Dark Energy gains +1/Encounter.
      "The third effect of Dark Energy gains +1/Encounter. (Triggered/Injured)",
    ],
  },

  // ---------------------------------------------------------------------------
  // DESCENDED SUPER SAIYAN — Mastery: Bloodline Mastery
  // ---------------------------------------------------------------------------
  "descended_super_saiyan": {
    name: "Mastery: Bloodline Mastery",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Exhausting"],  // effect 1: loses a level of Draining; effect 5: loses Draining and Exhausting
    aspectsToAdd: [],
    conditionals: [
      // effect 1: loses a level of Draining and gains a level of High Speed
      { type: "drainingReduction", value: 1, condition: { always: true } },
      { type: "highSpeedLevel", value: 1, condition: { always: true } },
      // effect 5: loses Draining and Exhausting, gains a level of High Speed
      { type: "highSpeedLevel", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 2: While below the Injured Health Threshold, increase your Tier of Power Extra Dice by 1 Dice Category.
      "While below the Injured Health Threshold, increase your Tier of Power Extra Dice by 1 Dice Category.",
      // effect 3: The first effect of Dormant Saiya Power loses its 1/Round keyword.
      "The first effect of Dormant Saiya Power loses its 1/Round keyword.",
      // effect 4: The first effect of Earthling Resolve also increases your Dodge Rolls and Soak Value by an equal amount.
      "The first effect of Earthling Resolve also increases your Dodge Rolls and Soak Value by an amount equal to the increase to your Strike and Wound Rolls.",
    ],
  },

  // ---------------------------------------------------------------------------
  // MAGICAL FORMATION — Mastery: Lovely Love I
  // ---------------------------------------------------------------------------
  "magical_formation": {
    name: "Mastery: Lovely Love I",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation"],  // effect 1: Remove Long Transformation
    aspectsToAdd: ["Natural"],                  // effect 1: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: While a Character is your Beloved, gain access to one of the following effects...
      "While a Character is your Beloved, gain access to one of the following effects, depending on if they're an Ally or an Opponent, until the end of the Combat Round.",
      // effect 3: Ally — 1/Round: If your Ally targets you with the Empower Maneuver, increase their Combat Rolls by 1/4 of your Personality Modifier.
      "Ally [1/Round]: If your Ally targets you with the Empower Maneuver, increase their Combat Rolls by 1/4 of your Personality Modifier.",
      // effect 4: Opponent — Reduce their Morale Saving Throws by 1(T).
      "Opponent [Passive]: Reduce their Morale Saving Throws by 1(T).",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER MAGICAL FORMATION — Mastery: Lovely Love II
  // ---------------------------------------------------------------------------
  "super_magical_formation": {
    name: "Mastery: Lovely Love II",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation"],  // effect 1: Remove Long Transformation
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 2: 1/Encounter — If you hit an Opponent with an Attacking Maneuver and either: That Opponent is your Beloved, OR Your Beloved has used the United Attack Maneuver in response. Increase the Wound Roll by your Personality Modifier.
      "If you hit an Opponent with an Attacking Maneuver and either: That Opponent is your Beloved, OR Your Beloved has used the United Attack Maneuver in response to this Attacking Maneuver. Increase the Wound Roll of that Attacking Maneuver by your Personality Modifier. (1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // LOVELY MAGICAL FORMATION — Mastery: Lovely Love III
  // ---------------------------------------------------------------------------
  "lovely_magical_formation": {
    name: "Mastery: Lovely Love III",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation", "Exhausting"],  // effect 1: Remove Long Transformation and Exhausting
    aspectsToAdd: ["Perfect Ki Control"],                      // effect 1: gain Perfect Ki Control
    conditionals: [],
    narrative: [],
  },

  // ---------------------------------------------------------------------------
  // FUTURE SUPER SAIYAN — Mastery: Change the Future
  // ---------------------------------------------------------------------------
  "future_super_saiyan": {
    name: "Mastery: Change the Future",
    attrBonuses: {},
    aspectsToRemove: ["Draining"],  // effect 1: loses the Draining Aspect
    aspectsToAdd: [],
    conditionals: [
      // effect 1: gains a level of High Speed
      { type: "highSpeedLevel", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 2: When you use the second effect of Golden Power upon entering Future Super Saiyan, you may enter the Superior State instead of the Raging State...
      "When you use the second effect of Golden Power upon entering Future Super Saiyan, you may enter the Superior State instead of the Raging State. The increase to Dice Category through the effects of the Raging Aspect apply to Greater Dice instead for the duration of this effect.",
      // effect 3: While your amount of Opponents exceeds your number of Allies OR you are below the Injured Health Threshold, increase your Tier of Power Extra Dice by 1 Dice Category.
      "While your amount of Opponents exceeds your number of Allies OR you are below the Injured Health Threshold, increase your Tier of Power Extra Dice by 1 Dice Category.",
      // effect 4: 1/Encounter — If an Attacking Maneuver would knock you through a Health Threshold...
      "If an Attacking Maneuver would knock you through a Health Threshold after calculating the Damage, reduce the Damage until the amount you would suffer puts you exactly 1 Life Point below the lowest Health Threshold you would have passed through as a result of that Attacking Maneuver. (1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // GENETIC POWER — Mastery: Further Perfection
  // ---------------------------------------------------------------------------
  "genetic_power": {
    name: "Mastery: Further Perfection",
    attrBonuses: {},
    aspectsToRemove: ["Draining"],  // effect 1: loses the Draining Aspect
    aspectsToAdd: ["Natural"],       // effect 4: gains the Natural Aspect
    conditionals: [],
    narrative: [
      // effect 2: 1/Encounter — You may exit the Power Stressed Special State as an Instant Maneuver.
      "You may exit the Power Stressed Special State as an Instant Maneuver. (1/Encounter)",
      // effect 3: Upon gaining this Mastery, select an additional 2 Aspects as per the rules of the second effect of Genetic Transformation.
      "Upon gaining this Mastery, select an additional 2 Aspects as per the rules of the second effect of Genetic Transformation.",
    ],
  },

  // ---------------------------------------------------------------------------
  // OOZARU — Mastery: Primal Control I
  // ---------------------------------------------------------------------------
  "oozaru": {
    name: "Mastery: Primal Control I",
    attrBonuses: { in: "+1(T)" },  // effect 1: gains AMB (IN) of +1(T)
    aspectsToRemove: ["Rampaging"],  // effect 1: loses the Rampaging Aspect
    aspectsToAdd: [],
    conditionals: [
      // effect 4: Halve the penalties to your Defense Value from your Size Category
      { type: "defenseValuePenaltyHalve", source: "sizeCategory", condition: { always: true } },
    ],
    narrative: [
      // effect 2: When you use the first effect of Rampaging Assault upon entering a Mastered Stage of the Great Ape Transformation Line, you may enter the Superior State instead of the Feral State...
      "When you use the first effect of Rampaging Assault upon entering a Mastered Stage of the Great Ape Transformation Line, you may enter the Superior State instead of the Feral State. If you do, leave the Superior State at the end of your next turn.",
      // effect 3: Ignore the second effect of Rampaging Assault, but increase the Stress Test Requirement of any Transformation used in conjunction with Oozaru by 5.
      "Ignore the second effect of Rampaging Assault, but increase the Stress Test Requirement of any Transformation used in conjunction with Oozaru by 5.",
    ],
  },

  // ---------------------------------------------------------------------------
  // GOLDEN OOZARU — Mastery: Primal Control II
  // ---------------------------------------------------------------------------
  "golden_oozaru": {
    name: "Mastery: Primal Control II",
    attrBonuses: { ag: "+2(T)" },  // effect 1: gains AMB (AG) of +2(T)
    aspectsToRemove: ["Rampaging"],  // effect 1: loses the Rampaging Aspect
    aspectsToAdd: [],
    conditionals: [
      // effect 3: While in the Full Power State, gains a level of Scaling
      { type: "scalingAspectLevel", value: 1, condition: { state: "fullPower" } },
    ],
    narrative: [
      // effect 2: While you are in the Superior State, apply Punching Down to your Attacking Maneuvers, regardless of the Opponent's Size Category.
      "While you are in the Superior State, apply Punching Down to your Attacking Maneuvers, regardless of the Opponent's Size Category.",
    ],
  },

  // ---------------------------------------------------------------------------
  // LIMITED SUPPRESSION — Mastery: Complete Control I
  // ---------------------------------------------------------------------------
  "limited_suppression": {
    name: "Mastery: Complete Control I",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Power High"],  // effect 1: loses Draining and Power High
    aspectsToAdd: ["Natural Form"],                 // effect 1: gains Natural Form
    conditionals: [],
    narrative: [
      // effect 2: 2/Round — When you gain a stack(s) of Cruelty, reduce your Critical Target for your Strike Rolls by 1 until the end of this Combat Round.
      "When you gain a stack(s) of Cruelty, reduce your Critical Target for your Strike Rolls by 1 until the end of this Combat Round. (2/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // PARTIAL SUPPRESSION — Mastery: Complete Control II
  // ---------------------------------------------------------------------------
  "partial_suppression": {
    name: "Mastery: Complete Control II",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: While you have 2+ stacks of Power, increase the bonus to your Wound Rolls from your Cruelty Stacks by 1/2 (rounded up) for the duration of your Signature Techniques.
      "While you have 2+ stacks of Power, increase the bonus to your Wound Rolls from your Cruelty Stacks by 1/2 (rounded up) for the duration of your Signature Techniques.",
    ],
  },

  // ---------------------------------------------------------------------------
  // TRUE FORM — Mastery: Complete Control III
  // ---------------------------------------------------------------------------
  "true_form": {
    name: "Mastery: Complete Control III",
    attrBonuses: {},
    aspectsToRemove: ["Exhausting", "Long Transformation"],  // effect 1: loses Exhausting and Long Transformation
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 2: If you would enter the Full Suppression stage of Metamorphosis due to failing a Stress Test or using the Revert Maneuver, you may instead enter True Form.
      "If you would enter the Full Suppression stage of Metamorphosis due to failing a Stress Test or using the Revert Maneuver, you may instead enter True Form.",
      // effect 3: 1/Encounter — You may exit the Power Stressed Special State as an Instant Maneuver.
      "You may exit the Power Stressed Special State as an Instant Maneuver. (1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // HERO MODE — Mastery: Super Transformation I
  // ---------------------------------------------------------------------------
  "hero_mode": {
    name: "Mastery: Super Transformation I",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation"],  // effect 1: Remove the Long Transformation Aspect
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 2: 1/Round — Use the Power Up Maneuver or Hype Maneuver as an Instant Maneuver.
      "Use the Power Up Maneuver or Hype Maneuver as an Instant Maneuver. (1/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER MODE — Mastery: Super Transformation II
  // ---------------------------------------------------------------------------
  "super_mode": {
    name: "Mastery: Super Transformation II",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Hazard Form only gives Rampaging (LV1) through the second effect of Level Up. Additionally, you can change your Form even while in the Hazard Form.
      "Hazard Form only gives Rampaging (LV1) through the second effect of Level Up. Additionally, you can change your Form even while in the Hazard Form.",
    ],
  },

  // ---------------------------------------------------------------------------
  // ULTIMATE MODE — Mastery: Super Transformation III
  // ---------------------------------------------------------------------------
  "ultimate_mode": {
    name: "Mastery: Super Transformation III",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Ultimate Form does not grant the Weakening or Exhausting Aspects through the second effect of Ultimate Rising Power.
      "Ultimate Form does not grant the Weakening or Exhausting Aspects through the second effect of Ultimate Rising Power.",
    ],
  },

  // ---------------------------------------------------------------------------
  // MONSTER FORM — Mastery: Controlled Monster
  // ---------------------------------------------------------------------------
  "monster_form": {
    name: "Mastery: Controlled Monster",
    attrBonuses: { in: "+1(T)" },  // effect 2: Increase AMB (IN) of Monster Form by 1(T)
    aspectsToRemove: [],
    aspectsToAdd: ["Enhanced Save (Morale)", "Natural"],  // effect 4: gains Enhanced Save (Morale) and Natural
    conditionals: [],
    narrative: [
      // effect 1: Beast of Wrath's second effect no longer adds any ranks of the Rampaging Aspect.
      "Beast of Wrath's second effect no longer adds any ranks of the Rampaging Aspect.",
      // effect 3: Gain an additional Monster Trait (selected upon gaining Mastery). You benefit from that Monster Trait while in the Full Power Special State.
      "Gain an additional Monster Trait (selected upon gaining Mastery). You benefit from that Monster Trait while in the Full Power Special State.",
    ],
  },

  // ---------------------------------------------------------------------------
  // INITIAL POWER BOOST — Mastery: Controlled Power I
  // ---------------------------------------------------------------------------
  "initial_power_boost": {
    name: "Mastery: Controlled Power I",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Exhausting"],  // effect 1: Remove Draining and Exhausting
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 2: 1/Encounter — If through any effect you would gain the Impediment Combat Condition, you can choose not to.
      "If through any effect you would gain the Impediment Combat Condition, you can choose not to. (1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // HIGH POWER BOOST — Mastery: Controlled Power II
  // ---------------------------------------------------------------------------
  "high_power_boost": {
    name: "Mastery: Controlled Power II",
    attrBonuses: {},
    aspectsToRemove: ["Exhausting"],  // effect 1: Remove Exhausting
    aspectsToAdd: [],
    conditionals: [
      // effect 1: reduce the level of Draining by 1
      { type: "drainingReduction", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Boosting Power's second effect gains an additional +1/Encounter.
      "Boosting Power's second effect gains an additional +1/Encounter.",
    ],
  },

  // ---------------------------------------------------------------------------
  // MAXIMUM POWER BOOST — Mastery: Controlled Power III
  // ---------------------------------------------------------------------------
  "maximum_power_boost": {
    name: "Mastery: Controlled Power III",
    attrBonuses: {},
    aspectsToRemove: ["Exhausting"],  // effect 1: Remove Exhausting
    aspectsToAdd: [],
    conditionals: [
      // effect 2: reduce the level of Draining by 1
      { type: "drainingReduction", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 3: 1/Encounter — If your Tier of Power was increased beyond your base Tier of Power by the second effect of Boosting Power, when that effect would end, you may prolong the effect until the end of your next turn.
      "If your Tier of Power was increased beyond your base Tier of Power by the second effect of Boosting Power, when that effect would end, you may prolong the effect until the end of your next turn. (1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // SHATTERED SHELL — Mastery: Draconic Ascension
  // ---------------------------------------------------------------------------
  "shattered_shell": {
    name: "Mastery: Draconic Ascension",
    attrBonuses: {},
    aspectsToRemove: ["Draining"],  // effect 1: loses the Draining Aspect
    aspectsToAdd: ["Natural"],       // effect 4: gains the Natural Aspect
    conditionals: [],
    narrative: [
      // effect 2: 1/Encounter Triggered/Power — Reduce your Life Points by 8(bT). If you do, reduce the Life Points of all Opponents within a Large Sphere AoE (centered on you) by an equal amount. If this would knock any Opponent through a Health Threshold, they automatically fail the Steadfast Check.
      "Reduce your Life Points by 8(bT). If you do, reduce the Life Points of all Opponents within a Large Sphere AoE (centered on you) by an equal amount. If this would knock any Opponent through a Health Threshold, they automatically fail the Steadfast Check. (Triggered/Power, 1/Encounter)",
      // effect 3: If you have an Aura active while in this Transformation, treat yourself as if you have an additional stack of Power for any effects.
      "If you have an Aura active while in this Transformation, treat yourself as if you have an additional stack of Power for any effects.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER FORM — Mastery: Super Warrior
  // ---------------------------------------------------------------------------
  "super_form": {
    name: "Mastery: Super Warrior",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Strainless"],  // effect 1: loses a level of Draining; effect 4: loses Draining, replaces Strainless with Natural
    aspectsToAdd: ["Natural"],                      // effect 4: gains Natural (replaces Strainless)
    conditionals: [
      // effect 1: loses a level of Draining and gains a level of High Speed
      { type: "drainingReduction", value: 1, condition: { always: true } },
      { type: "highSpeedLevel", value: 1, condition: { always: true } },
      // effect 4: loses a level of Draining and gains a level of High Speed
      { type: "drainingReduction", value: 1, condition: { always: true } },
      { type: "highSpeedLevel", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Upon gaining this Mastery, select an additional effect from the Option effect of Example of Awakening to benefit from while in this Transformation.
      "Upon gaining this Mastery, select an additional effect from the Option effect of Example of Awakening to benefit from while in this Transformation.",
      // effect 3: Upon gaining this Mastery, select an additional effect from the Option effect of My Ideal Transformation to benefit from while in this Transformation. If you already possess the Desire Balance effect, you can instead gain access to both the Desire Combat and Desire Magic effects.
      "Upon gaining this Mastery, select an additional effect from the Option effect of My Ideal Transformation to benefit from while in this Transformation. If you already possess the Desire Balance effect, you can instead gain access to both the Desire Combat and Desire Magic effects.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER INCREDIBLE GUY — Mastery: Super Warriors Can't Rest
  // ---------------------------------------------------------------------------
  "super_incredible_guy": {
    name: "Mastery: Super Warriors Can't Rest",
    attrBonuses: { in: "+1(T)" },  // effect 2: Increase AMB (IN) of Super Incredible Guy by 1(T)
    aspectsToRemove: [],
    aspectsToAdd: ["Enhanced Save"],  // effect 1: gains Enhanced Save (you may choose which Saving Throw)
    conditionals: [
      // effect 1: gains an additional level of High Speed
      { type: "highSpeedLevel", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 1: also gains Enhanced Save (you may choose which Saving Throw) — choice-dependent, tracked as aspect add
      "Super Incredible Guy gains the Enhanced Save Aspect (you may choose which Saving Throw).",
      // effect 3: The first effect of The World's Strongest Guy increases the stated Extra Dice by 2 Dice Categories instead of 1.
      "The first effect of The World's Strongest Guy increases the stated Extra Dice by 2 Dice Categories instead of 1.",
      // effect 4: While in this Transformation, you do not suffer from the effects of any Flaw Traits and you gain the Flaw effects for all of your Custom Species Racial Traits.
      "While in this Transformation, you do not suffer from the effects of any Flaw Traits and you gain the Flaw effects for all of your Custom Species Racial Traits.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER SAIYAN RAGE — Mastery: Fury becomes Hope
  // ---------------------------------------------------------------------------
  "super_saiyan_rage": {
    name: "Mastery: Fury becomes Hope",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [
      // effect 1: loses 1 level of Draining
      { type: "drainingReduction", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Your Defense Value is not lowered by the second effect of the Raging State.
      "Your Defense Value is not lowered by the second effect of the Raging State.",
      // effect 3: While in the Full Power State, apply the Extra Dice gained from the Raging State an additional time.
      "While in the Full Power State, apply the Extra Dice gained from the Raging State an additional time.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER SAIYAN 1 — Mastery: Golden Mastery I
  // ---------------------------------------------------------------------------
  "super_saiyan_1": {
    name: "Mastery: Golden Mastery I",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Power High"],  // effect 1: loses both Draining and Power High
    aspectsToAdd: ["Natural"],                      // effect 1: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: When you use the second effect of Golden Power upon entering a Mastered Stage of the Super Saiyan Transformation Line, you may enter the Superior State instead of the Raging State...
      "When you use the second effect of Golden Power upon entering a Mastered Stage of the Super Saiyan Transformation Line, you may enter the Superior State instead of the Raging State. The increase to Dice Category through the effects of the Raging Aspect apply to Greater Dice instead for the duration of this effect.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER SAIYAN 2 — Mastery: Golden Mastery II
  // ---------------------------------------------------------------------------
  "super_saiyan_2": {
    name: "Mastery: Golden Mastery II",
    attrBonuses: {},
    aspectsToRemove: ["Power High"],  // effect 1: loses Power High
    aspectsToAdd: [],
    conditionals: [
      // effect 1: loses 1 level of Draining
      { type: "drainingReduction", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 2: The second effect of Sparking Ascension loses the 1/Round keyword.
      "The second effect of Sparking Ascension loses the 1/Round keyword.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER SAIYAN 3 — Mastery: Golden Mastery III
  // ---------------------------------------------------------------------------
  "super_saiyan_3": {
    name: "Mastery: Golden Mastery III",
    attrBonuses: {},
    aspectsToRemove: ["Power High", "Exhausting", "Long Transformation"],  // effect 1: loses Power High, Exhausting, Long Transformation
    aspectsToAdd: [],
    conditionals: [
      // effect 1: loses 2 levels of Draining
      { type: "drainingReduction", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Limitless loses its third effect.
      "Limitless loses its third effect.",
      // effect 3: While in the Full Power State, halve the amount of Ki Points lost by the Draining Aspect, but Super Saiyan 3 regains the Exhausting Aspect.
      "While in the Full Power State, halve the amount of Ki Points lost by the Draining Aspect, but Super Saiyan 3 regains the Exhausting Aspect.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER TUFFLE — Mastery: Long-Lasting Hatred
  // ---------------------------------------------------------------------------
  "super_tuffle": {
    name: "Mastery: Long-Lasting Hatred",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Temporary"],  // effect 1: loses Draining and Temporary
    aspectsToAdd: ["Heartbeat"],                   // effect 4: gains Heartbeat
    conditionals: [],
    narrative: [
      // effect 2: The third effect of Vengeful Driveby is also triggered if you use the Transformation Maneuver to enter a Legendary Form.
      "The third effect of Vengeful Driveby is also triggered if you use the Transformation Maneuver to enter a Legendary Form.",
      // effect 3: 1/Encounter — If you would leave the Surging State, instead remain in the Surging State until the end of your next turn.
      "If you would leave the Surging State, instead remain in the Surging State until the end of your next turn. (1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // UNITED ANDROID — Mastery: Robotic Perfection
  // ---------------------------------------------------------------------------
  "united_android": {
    name: "Mastery: Robotic Perfection",
    attrBonuses: {},
    aspectsToRemove: ["Power High", "Rampaging"],  // effect 1: loses Power High and Rampaging
    aspectsToAdd: ["Natural"],                       // effect 4: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: The second effect of Reinforced Frame no longer reduces your Ki Points.
      "The second effect of Reinforced Frame no longer reduces your Ki Points.",
      // effect 3: Ignore the penalties of 1 Super Stack.
      "Ignore the penalties of 1 Super Stack.",
    ],
  },

  // =========================================================================
  // MANIFESTED POWERS
  // =========================================================================

  // ---------------------------------------------------------------------------
  // FINAL FORM RIDER — Mastery: Climax Form!
  // ---------------------------------------------------------------------------
  "final_form_rider": {
    name: "Mastery: Climax Form!",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation"],  // effect 1: loses Long Transformation
    aspectsToAdd: ["Scaling"],                  // effect 1: gains Scaling (LV2)
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Increase the Dice Score of your Legend Realized by 1d10(T) for every Health Threshold you are below when entering this Transformation.
      "Increase the Dice Score of your Legend Realized by 1d10(T) for every Health Threshold you are below when entering this Transformation.",
      // effect 3: Triggered/Power, 1/Round — If you are in the Full Power State, you may use the Hype Maneuver as an Out-of-Sequence Maneuver.
      "If you are in the Full Power State, you may use the Hype Maneuver as an Out-of-Sequence Maneuver. (Triggered/Power, 1/Round)",
      // effect 4: Your maximum number of Rider Charge stacks is increased to 15. Battle Uniform
      "Your maximum number of Rider Charge stacks is increased to 15. Battle Uniform",
    ],
  },

  // ---------------------------------------------------------------------------
  // MAGICAL GIRL — Mastery: Believe in Yourself and Nothing Can Stop You
  // ---------------------------------------------------------------------------
  "magical_girl": {
    name: "Mastery: Believe in Yourself and Nothing Can Stop You",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation"],  // effect 12: loses Long Transformation
    aspectsToAdd: ["Scaling"],                  // effect 12: gains Scaling (LV2)
    conditionals: [
      // effect 12: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effects 1-10: Choice-dependent Dream stack effects
      "Depending on the Options selected for the first effect of My Evolution!, gain the corresponding effects (Dream generation).",
      "Pretty Barrier [Triggered, 1/Round]: If you prevent an Ally from taking Damage with your Pretty Barrier Aura, gain a stack of Dreams.",
      "A Different Me [Triggered/Start of Turn]: If you are benefiting from the effects of Shapeshift, gain a stack of Dreams.",
      "Magical Net [Triggered/Start of Turn]: If an Opponent is Pinned by your usage of the Binding Unique Ability, gain a stack of Dreams.",
      "Pretty Boost [Triggered, 1/Round]: If you or an Ally hits an Opponent with an Attacking Maneuver while benefiting from your usage of the Pretty Boost Aura, gain a stack of Dreams.",
      "Healing Love [Triggered, 1/Round]: When you heal an Ally above a Health Threshold with the Healing Hands Unique Ability, gain a stack of Dreams.",
      "Team Coordinator [Triggered, 1/Round]: If an Ally you targeted with the United Attack Maneuver hits an Opponent with an Attacking Maneuver, gain a stack of Dreams.",
      "Perfect Partner [Triggered]: If your Pretty Partner uses the Hype Maneuver or United Attack Maneuver within your Melee Range, gain a stack of Dreams.",
      "Solo Act [Triggered, 1/Round]: If you Damage an Opponent with an Attacking Maneuver while you have no Allies in the Combat Encounter, gain a stack of Dreams. Defeated Allies do not count for this effect.",
      "Lovely Signature [Triggered, 1/Round]: When you knock an Opponent through a Health Threshold with your Magical Finisher, gain a stack of Dreams.",
      // effect 11: Triggered/Defeated — If you are in the Full Power State, immediately use a Healing Surge. Spend all stacks of Dreams and increase LP recovered by 3(bT) per stack.
      "If you are in the Full Power State, immediately use a Healing Surge. Spend all of your stacks of Dreams and increase the amount of Life Points recovered by 3(bT) for every stack spent. (Triggered/Defeated)",
      // effect 12: Additionally, the Action cost of the third effect of Open My Heart! becomes 1 Action.
      "The Action cost of the third effect of Open My Heart! becomes 1 Action.",
    ],
  },

  // ---------------------------------------------------------------------------
  // PRETTY MAGICAL GIRL — Mastery: My Feelings, My Desires, My Path
  // ---------------------------------------------------------------------------
  "pretty_magical_girl": {
    name: "Mastery: My Feelings, My Desires, My Path",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation", "Exhausting"],  // effect 12: loses Long Transformation and Exhausting
    aspectsToAdd: ["Natural"],                                 // effect 13: gains Natural
    conditionals: [],
    narrative: [
      // effect 1: Select an additional Option to benefit from for the first effect of My Evolution!
      "Select an additional Option to benefit from for the first effect of My Evolution!",
      // effects 2-11: Choice-dependent Pretty Point effects
      "Depending on the Options selected for the first effect of My Evolution!, gain the corresponding effects (Pretty Point generation).",
      "Pretty Barrier [Triggered]: If you prevent yourself or an Ally from taking Damage through the use of your Pretty Barrier, gain 1 Pretty Point.",
      "A Different Me [Triggered/Start of Turn]: If you are benefiting from the effects of the Shapeshift Unique Ability, gain 1 Pretty Point.",
      "Magical Net [Triggered/Start of Turn]: If an Opponent is suffering from a Combat Condition due to the effects of your Binding Unique Ability, gain 1 Pretty Point.",
      "Pretty Boost [Triggered/Start of Turn]: If you are in the Pretty Boost Aura, gain 1 Pretty Point.",
      "Healing Love [Triggered]: If you heal an Ally above a Health Threshold with the Healing Hand Unique Ability, gain 1 Pretty Point.",
      "Team Coordinator [Triggered, 1/Round]: If an Ally benefiting from the Passive of your Telepathy Unique Ability avoids an Opponent's Attacking Maneuver, gain 1 Pretty Point.",
      "Perfect Partner [Triggered, 1/Round]: If your Pretty Partner is knocked through a Health Threshold or Defeated by an Attacking Maneuver, gain an additional Pretty Point.",
      "Solo Act [Triggered, 1/Round]: When you are knocked through a Health Threshold by an Attacking Maneuver while the number of Opponents exceeds the number of Allies in the Combat Encounter, gain 1 additional Pretty Point. Defeated Allies do not count for this effect.",
      "Lovely Signature [Triggered]: If you knock an Opponent through a Health Threshold with a Signature Technique with the Restricted Transformation (Formation) Disadvantage, gain 1 Pretty Point.",
      // effect 12: Additionally, the Action cost of the third effect of Open My Heart! becomes 1 Action.
      "The Action cost of the third effect of Open My Heart! becomes 1 Action.",
    ],
  },

  // ---------------------------------------------------------------------------
  // RELEASED HEAVENLY CHAIN — Mastery: Stress Adjustment
  // ---------------------------------------------------------------------------
  "released_heavenly_chain": {
    name: "Mastery: Stress Adjustment",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Exhausting"],  // effect 1: loses Draining and Exhausting
    aspectsToAdd: ["Natural"],                      // effect 1: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: Halve the amount of Life Points you lose through the first effect of Ultra High Speed Combat.
      "Halve the amount of Life Points you lose through the first effect of Ultra High Speed Combat.",
      // effect 3: Ignore the second effect of Ultra High-Speed Combat.
      "Ignore the second effect of Ultra High-Speed Combat.",
      // effect 4: Gain access to the Concentrated Moon Fang Aura...
      "Gain access to the Concentrated Moon Fang Aura. Instead of paying Ki Points for the Concentrated Moon Fang Aura, you may spend your Moon Slayer's Life Points for the Ki Point Cost of the Aura Maneuver or the Ki Point Cost to maintain the Aura. While in the Concentrated Moon Fang Aura, all of your Attacking Maneuvers must use your Moon Slayer.",
    ],
  },

  // ---------------------------------------------------------------------------
  // DRAGON FORCE — Mastery: Mastery of Dragon Embodiment
  // ---------------------------------------------------------------------------
  "dragon_force": {
    name: "Mastery: Mastery of Dragon Embodiment",
    attrBonuses: { in: "+1(T)", fo: "+1(T)", ma: "+1(T)" },  // effect 2: AMB (IN) +1(T); effect 4: AMB (FO/MA) +1(T)
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [
      // effect 3: gains 2 additional levels of Scaling (can exceed max)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 1: Triggered — If targeted by Empower, gain a stack of Draconic Force. If Miracle Empowerment causes KP to exceed max, maximize Draconic Force stacks.
      "If you are targeted by the Empower Maneuver, gain a stack of Draconic Force. If the target applied the effects of Miracle Empowerment and this causes your Ki Points to exceed your Maximum Ki Points, instead maximize your stacks of Draconic Force. (Triggered)",
      // effect 4: Ignore the first effect of Epitome of the Dragons.
      "Ignore the first effect of Epitome of the Dragons.",
    ],
  },

  // =========================================================================
  // ENHANCEMENT POWERS
  // =========================================================================

  // ---------------------------------------------------------------------------
  // WRATHFUL — Mastery: Caging the Beast
  // ---------------------------------------------------------------------------
  "wrathful": {
    name: "Mastery: Caging the Beast",
    attrBonuses: {},
    aspectsToRemove: ["Rampaging"],   // effects 1+5: loses Rampaging (1 level then full)
    aspectsToAdd: ["Strainless"],      // effect 5: gains Strainless
    conditionals: [],
    narrative: [
      // effect 1: loses a level of Rampaging (tracked via aspectsToRemove)
      "This Transformation loses a level of the Rampaging Aspect.",
      // effect 2: While in Full Power State, gains Armored
      "While you are in the Full Power State, this Transformation gains the Armored Aspect.",
      // effect 3: Ignore the second effect of Ferocity of the Great Ape.
      "Ignore the second effect of Ferocity of the Great Ape.",
      // effect 4: Triggered/Transform — Instead of entering Feral State, may enter Superior State.
      "Instead of entering the Feral State through the first effect of Ferocity of the Great Ape, you may instead enter the Superior State until the end of your next turn. (Triggered/Transform)",
      // effect 5: loses Rampaging, gains Strainless (tracked via aspects)
      "This Transformation loses the Rampaging Aspect and gains the Strainless Aspect.",
    ],
  },

  // ---------------------------------------------------------------------------
  // KAMEN RIDER — Mastery: Evolution!
  // ---------------------------------------------------------------------------
  "kamen_rider": {
    name: "Mastery: Evolution!",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation"],  // effect 1: loses Long Transformation
    aspectsToAdd: ["Strainless"],                // effect 1: gains Strainless
    conditionals: [],
    narrative: [
      // effects 2-12: Choice-dependent Rider effects
      "Depending on your choice for the 4th effect of Rider System!, gain the corresponding effect.",
      "Classic Technique [Triggered, 1/Round]: If you use the Signature Technique Maneuver to use a Signature Technique with the Restricted Transformation (Mode Change) Disadvantage, gain 2 stacks of Rider Charge before applying any other effects.",
      "Classic Power [Triggered/Full Power, 1/Encounter]: If you possess 5+ stacks of Rider Charge, you may use the Energy Charge Maneuver as an Out-of-Sequence Maneuver.",
      "Sky Rider [Passive]: While you are in the Sky Environment, ignore the effects of the Draining Aspect.",
      "J's Power [Passive]: For every 5 stacks of Rider Charge you possess, increase the Dice Category of your Punching Down Extra Dice by 1 Category.",
      "Monstrous Rider [Permanent, Passive]: Select a Bestial Trait. You gain access to that Trait while in the Full Power State.",
      "Metamorphing Rider [Passive]: While in the Full Power State, double the increase to your Attribute Modifier Bonuses from the effects of your Forms.",
      "Card Rider [Triggered/Full Power, 1/Encounter]: You may regain access to all drawn cards.",
      "High-Speed Rider [Triggered/Full Power, 1/Encounter]: Enter the Clock Up State until the start of your next turn.",
      "Musical Rider [Triggered]: If you won the Clash initiated by the effects of Musical Rider, gain 2 Rider Charge and a stack of Power until the end of your turn.",
      "Anniversary Rider [Permanent, Passive]: Select an additional Option effect to benefit from for the fourth effect of Rider System!",
      // effect 13: max Rider Charge increased to 15
      "Your maximum number of Rider Charge stacks is increased to 15. Battle Uniform",
    ],
  },

  // ---------------------------------------------------------------------------
  // TRANSFORMATIVE MIMICRY — Mastery: Favored Forms
  // ---------------------------------------------------------------------------
  "transformative_mimicry": {
    name: "Mastery: Favored Forms",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Upon gaining a Copied Transformation, may select as Favored Transformation.
      "Upon gaining a Copied Transformation, you may select to make that your Favored Transformation. You can only possess 1 Favored Transformation and your Favored Transformation counts as a Copied Transformation for the effects of Transformative Mimicry, but does not count towards your limit of only possessing a single Copied Transformation at a time.",
      // effect 2: Triggered, 1/Encounter — If a higher ToP Character transforms, may enter Transformative Mimicry as OoS.
      "If a Character with a higher Tier of Power than you uses the Transformation Maneuver to enter a Transformation, you may use a Transformation Maneuver to enter Transformative Mimicry as an Out-of-Sequence Maneuver. (1/Encounter)",
      // effect 3: May possess up to 3 Favored Transformations; count as Alternate Forms for My Own Power.
      "You may possess up to 3 Favored Transformations, and your Favored Transformations count as Alternate Forms you possess for the second effect of My Own Power.",
    ],
  },

  // =========================================================================
  // LEGENDARY FORMS
  // =========================================================================

  // ---------------------------------------------------------------------------
  // LEGENDARY OOZARU — Mastery: Superior Specimen
  // ---------------------------------------------------------------------------
  "legendary_oozaru": {
    name: "Mastery: Superior Specimen",
    attrBonuses: { ag: "+2(T)" },  // effect 1: AMB (AG) +2(T)
    aspectsToRemove: ["Rampaging"],  // effect 1: loses Rampaging
    aspectsToAdd: [],
    conditionals: [
      // effect 3: Halve penalties to Defense Value from Size Category and Dodge Rolls from Super Stack
      { type: "defenseValuePenaltyHalve", source: "sizeCategory", condition: { always: true } },
    ],
    narrative: [
      // effect 2: Remove the first effect of Rampaging Assault while in this Transformation.
      "Remove the first effect of Rampaging Assault while in this Transformation.",
      // effect 3: Also halve penalties to Dodge Rolls from Super Stack stacks.
      "Halve the penalties to your Dodge Rolls from your stacks of Super Stack.",
      // effect 4: You do not lose Life Points through the effects gained through the third effect of Legendary Rampage.
      "You do not lose Life Points through the effects gained through the third effect of Legendary Rampage.",
      // effect 5: Automatic/Transform — Enter the Raging State until you leave this Transformation.
      "Enter the Raging State until you leave this Transformation. (Automatic/Transform)",
    ],
  },

  // ---------------------------------------------------------------------------
  // LEGENDARY SUPER SAIYAN 1 — Mastery: Controlled Legend I
  // ---------------------------------------------------------------------------
  "legendary_super_saiyan_1": {
    name: "Mastery: Controlled Legend I",
    attrBonuses: {},
    aspectsToRemove: ["Rampaging"],  // effect 1: loses Rampaging
    aspectsToAdd: ["Strainless"],     // effect 1: gains Strainless
    conditionals: [],
    narrative: [
      // effect 2: Ignore the penalties of 1 stack of Super Stack.
      "Ignore the penalties of 1 stack of Super Stack.",
      // effect 3: Ignore the effects of Unstable Demon.
      "Ignore the effects of Unstable Demon.",
    ],
  },

  // ---------------------------------------------------------------------------
  // LEGENDARY SUPER SAIYAN 2 — Mastery: Controlled Legend II
  // ---------------------------------------------------------------------------
  "legendary_super_saiyan_2": {
    name: "Mastery: Controlled Legend II",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Increase the maximum number of Battle Born stacks for your Wound Rolls by S-1.
      "Increase the maximum number of Battle Born stacks for your Wound Rolls by S-1.",
      // effect 2: When using 3rd effect of Sparking Legend upon entering a Mastered Stage, may enter Superior State instead of Raging State.
      "When you use the 3rd effect of Sparking Legend upon entering a Mastered Stage of this Transformation Line, you may enter the Superior State instead of the Raging State. The increase to Dice Category through the effects of the Raging Aspect apply to Greater Dice instead for the duration of this effect.",
    ],
  },

  // ---------------------------------------------------------------------------
  // LEGENDARY SUPER SAIYAN 3 — Mastery: Controlled Legend III
  // ---------------------------------------------------------------------------
  "legendary_super_saiyan_3": {
    name: "Mastery: Controlled Legend III",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Increase the Wound Roll of any Attacking Maneuver with a Ki Wager by 1/2 of the Ki Points spent.
      "Increase the Wound Roll of any Attacking Maneuver you make with a Ki Wager by 1/2 of the amount of Ki Points spent on the Ki Wager.",
      // effect 2: 1/Encounter — If 5+ stacks of Battle Born on Wound Rolls, Ki Wager attack that reduces Capacity to 0, apply Battle Born bonus an additional time.
      "If you have 5+ stacks of Battle Born applied to your Wound Rolls, when making an Attacking Maneuver with a Ki Wager that would reduce your Capacity to 0 and has at least 10(bT) Ki Points spent on it, you may apply the bonus to your Wound Rolls from Battle Born an additional time. (1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // AJISA NAMEKIAN — Mastery: Resilient Potential
  // ---------------------------------------------------------------------------
  "ajisa_namekian": {
    name: "Mastery: Resilient Potential",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Ignore the third effect of Undying and the second effect of Superior.
      "Ignore the third effect of Undying and the second effect of Superior.",
      // effect 2: Ignore the penalties of a single stack of Super Stack.
      "Ignore the penalties of a single stack of Super Stack.",
      // effect 3: Increase the Dice Score of your Stress Test rolls when using this Transformation in conjunction with another Namekian Transformation by 2.
      "Increase the Dice Score of your Stress Test rolls when using this Transformation in conjunction with another Transformation that has the Namekian Racial Requirement by 2.",
    ],
  },

  // ---------------------------------------------------------------------------
  // ANCESTRAL SUPER SAIYAN 3 — Mastery: Ancient Secrets of the Super Saiyan 3
  // ---------------------------------------------------------------------------
  "ancestral_super_saiyan_3": {
    name: "Mastery: Ancient Secrets of the Super Saiyan 3",
    attrBonuses: {},
    aspectsToRemove: ["Power High", "Exhausting", "Long Transformation", "Draining"],  // effect 1+3: loses all these
    aspectsToAdd: ["Strainless"],  // effect 3: gains Strainless
    conditionals: [
      // effect 1: loses 2 levels of Draining
      { type: "drainingReduction", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: While in the Undying State, double the bonus to your Wound Rolls from your Battle Born stacks.
      "While you are in the Undying State, double the bonus to your Wound Rolls from your Battle Born stacks.",
      // effect 4: While in the Full Power State, increase your ToP Extra Dice by 1 Dice Category for every Health Threshold you are below.
      "While in the Full Power State, increase your Tier of Power Extra Dice by 1 Dice Category for every Health Threshold you are below.",
    ],
  },

  // ---------------------------------------------------------------------------
  // BEAST — Mastery: Overwhelming Potential
  // ---------------------------------------------------------------------------
  "beast": {
    name: "Mastery: Overwhelming Potential",
    attrBonuses: {},
    aspectsToRemove: ["Power High"],  // effect 1: removes Power High
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 2: You do not gain the Rampaging Aspect through the second effect of Wrathful Power.
      "You do not gain the Rampaging Aspect through the second effect of Wrathful Power.",
      // effect 3: Your maximum level of the Raging Aspect becomes 4.
      "Your maximum level of the Raging Aspect becomes 4.",
    ],
  },

  // ---------------------------------------------------------------------------
  // CONDENSED LEGENDARY SUPER SAIYAN — Mastery: Compressed and Controlled
  // ---------------------------------------------------------------------------
  "condensed_legendary_super_saiyan": {
    name: "Mastery: Compressed and Controlled",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Upon gaining this Mastery Trait, you can choose to apply this effect: for each Stage of the Super Saiyan Transformation Line you do not possess access to, this Transformation gains a level of the Scaling Aspect.
      "Upon gaining this Mastery Trait, you can choose to apply this effect: for each Stage of the Super Saiyan Transformation Line you do not possess access to, this Transformation gains a level of the Scaling Aspect. If you do apply this effect, you cannot gain any additional stages of the Super Saiyan Transformation Line.",
      // effect 2: Ignore the first effect of Focused Power of the Legendary Demon.
      "Ignore the first effect of Focused Power of the Legendary Demon.",
      // effect 3: You do not have to spend Life Points to use the 4th effect of Power Redefined.
      "You do not have to spend Life Points to use the 4th effect of Power Redefined.",
    ],
  },

  // ---------------------------------------------------------------------------
  // DARK DEMON GOD — Mastery: Depths of Darkness
  // ---------------------------------------------------------------------------
  "dark_demon_god": {
    name: "Mastery: Depths of Darkness",
    attrBonuses: {},
    aspectsToRemove: ["Exhausting", "Draining"],  // effect 1: loses Exhausting; effect 3: loses Draining
    aspectsToAdd: ["Strainless"],                   // effect 3: gains Strainless
    conditionals: [],
    narrative: [
      // effect 2: While in the Full Power State, you gain access to all effects granted by the 6th effect of Fraction of the Dark Factor.
      "While in the Full Power State, you gain access to all effects granted by the 6th effect of Fraction of the Dark Factor.",
    ],
  },

  // ---------------------------------------------------------------------------
  // DARK KING — Mastery: Lord of Demons
  // ---------------------------------------------------------------------------
  "dark_king": {
    name: "Mastery: Lord of Demons",
    attrBonuses: {},
    aspectsToRemove: ["Strainless"],  // effect 1: loses Strainless
    aspectsToAdd: ["Natural"],         // effect 1: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: While your Divine Ki Points are below 1/2 of starting amount, increase Wound Rolls by Insight Modifier.
      "While your Divine Ki Points are below 1/2 of the Divine Ki Points you possessed at the start of the Combat Encounter, increase your Wound Rolls by your Insight Modifier.",
      // effect 3: Upon gaining this Mastery, select two additional effects through the third effect of Dark Factor. Gain access in Full Power State.
      "Upon gaining this Mastery, select two additional effects through the third effect of Dark Factor. You gain access to those effects while you are in the Full Power State.",
    ],
  },

  // ---------------------------------------------------------------------------
  // INITIAL DEMON GOD — Mastery: Divine Demon
  // ---------------------------------------------------------------------------
  "initial_demon_god": {
    name: "Mastery: Divine Demon",
    attrBonuses: {},
    aspectsToRemove: ["Strainless"],  // effect 1: loses Strainless
    aspectsToAdd: ["Natural"],         // effect 1: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: Ignore the first effect of Divine Dark Magic.
      "Ignore the first effect of Divine Dark Magic.",
      // effect 3: When using the first effect of Demonic Branding, you may select up to 3 Opponents instead.
      "When using the first effect of Demonic Branding, you may select up to 3 Opponents instead. For every Opponent after the first, spend 1(bT) Divine Ki Points.",
    ],
  },

  // ---------------------------------------------------------------------------
  // TRUE DEMON GOD — Mastery: True Demon
  // ---------------------------------------------------------------------------
  "true_demon_god": {
    name: "Mastery: True Demon",
    attrBonuses: {},
    aspectsToRemove: ["Exhausting"],  // effect 1: loses Exhausting
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effects 2-4: Choice-dependent based on Demonic Fury option
      "Depending on the effect chosen for the Option effect of Demonic Fury, gain the following effect.",
      "Demonic God Beast [Passive]: Ignore the penalty to your Defense Value from your Size Category and treat your Size Category as if it was 1 Size Category smaller for the effects of Punching Up.",
      "Demonic God Style [Passive]: Increase your Strike Rolls by 1(T) against Opponents who are suffering from a Combat Condition.",
    ],
  },

  // ---------------------------------------------------------------------------
  // DESTROYER FORM — Mastery: God of Destruction
  // ---------------------------------------------------------------------------
  "destroyer_form": {
    name: "Mastery: God of Destruction",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: ["Armored", "Natural"],  // effect 4: gains Armored and Natural
    conditionals: [],
    narrative: [
      // effect 1: Ignore the penalties for 1 stack of Super Stack.
      "Ignore the penalties for 1 stack of Super Stack.",
      // effect 2: Triggered/Transform — You may choose to remove the Growth and Bulky Aspects. If you do, increase Strike and Dodge Rolls by 1(T).
      "You may choose to remove the Growth and Bulky Aspects from this Transformation. If you do, increase your Strike and Dodge Rolls by 1(T) until you leave this Transformation. (Triggered/Transform)",
      // effect 3: 1/Round — For every Energy Charge a Signature Technique with the Destruction Profile possesses, increase its Wound Roll by 1(T).
      "For every Energy Charge a Signature Technique with the Destruction Profile possesses, increase its Wound Roll by 1(T). (1/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // DIVINITY UNLEASHED — Mastery: True Divinity
  // ---------------------------------------------------------------------------
  "divinity_unleashed": {
    name: "Mastery: True Divinity",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: ["Scaling", "Natural"],  // effect 1: gains Scaling (LV2); effect 4: gains Natural
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Upon gaining this Mastery, select a God Maneuver.
      "Upon gaining this Mastery, select a God Maneuver. You gain access to that God Maneuver while in this Transformation.",
      // effect 3: Ignore the second effect of Divine Light Magic and the second effect of the Superior State.
      "Ignore the second effect of Divine Light Magic and the second effect of the Superior State.",
      // effect 5: If Divine Halo is used in conjunction, you may use one more Enhancement Power.
      "If Divine Halo is used in conjunction with this Transformation, you may use one more Enhancement Power in conjunction with these Transformations.",
    ],
  },

  // ---------------------------------------------------------------------------
  // EMPOWERED — Mastery: Flame of a Miracle
  // ---------------------------------------------------------------------------
  "empowered": {
    name: "Mastery: Flame of a Miracle",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: You may enter this Transformation from an Alternate Form with the same Stage number as an Instant Maneuver.
      "You may use the Transformation Maneuver to enter this Transformation from an Alternate Form with the same Stage number as this Transformation as an Instant Maneuver. If you do, you must select that Transformation as your Empowered Form.",
      // effect 2: Gain the Mastery Trait of your Empowered Form.
      "Gain the Mastery Trait of your Empowered Form.",
    ],
  },

  // ---------------------------------------------------------------------------
  // Z EMPOWERED — Mastery: Gatebreaker
  // ---------------------------------------------------------------------------
  "z_empowered": {
    name: "Mastery: Gatebreaker",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: After selecting your Empowered Form, you may adjust one of its Aspects with a level by 1 level.
      "After selecting your Empowered Form, you may increase or decrease one of its Aspects with a level by 1 level until you leave this Transformation. (Triggered/Transform)",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER EMPOWERED — Mastery: Super Survivor
  // ---------------------------------------------------------------------------
  "super_empowered": {
    name: "Mastery: Super Survivor",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: 1/Encounter — Triggered/Transform — Increase AMB (AG/FO/TE/MA) by 1(T) until end of next turn.
      "Increase this Transformation's Attribute Modifier Bonus (AG/FO/TE/MA) by 1(T) until the end of your next turn. (Triggered/Transform, 1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // ENHANCED TRANSFORMATION — Mastery: Yeah! Break! Care! Break!
  // ---------------------------------------------------------------------------
  "enhanced_transformation": {
    name: "Mastery: Yeah! Break! Care! Break!",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: You may enter this Transformation from your Ascended Form as an Instant Maneuver.
      "You may use the Transformation Maneuver to enter this Transformation from your Ascended Form as an Instant Maneuver.",
      // effect 2: Gain the Mastery Trait of your Ascended Form.
      "Gain the Mastery Trait of your Ascended Form.",
      // effect 3: Triggered/Power, 1/Round — Use a Healing Surge. Then, regain Ki Points equal to half the Life Points you regained.
      "Use a Healing Surge. Then, regain Ki Points equal to half the Life Points you regained. (Triggered/Power, 1/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // GOD OF MARTIAL ARTS — Mastery: Path of Self Discovery
  // ---------------------------------------------------------------------------
  "god_of_martial_arts": {
    name: "Mastery: Path of Self Discovery",
    attrBonuses: {},
    aspectsToRemove: ["Strainless"],              // effect 3: loses Strainless
    aspectsToAdd: ["Perfect Ki Control", "Natural"],  // effect 1: gains Perfect Ki Control; effect 3: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: The 6th effect of Wizened Warrior loses 1/Encounter and gains 1/Round.
      "The 6th effect of Wizened Warrior loses the 1/Encounter Keyword and gains the 1/Round Keyword.",
      // effect 4: Increase the '4(T)' in the second effect of Wizened Warrior to '6(T)', but increase the Stress Test Requirement to 28.
      "Increase the '4(T)' listed in the second effect of Wizened Warrior to '6(T)', but increase the Stress Test Requirement of this Transformation to 28.",
    ],
  },

  // ---------------------------------------------------------------------------
  // GODLY POWERS — Mastery: Among Gods
  // ---------------------------------------------------------------------------
  "godly_powers": {
    name: "Mastery: Among Gods",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: ["Strainless", "Scaling"],  // effect 1: gains Strainless; effect 3: gains Scaling (LV2)
    conditionals: [
      // effect 1: loses 1 level of Draining
      { type: "drainingReduction", value: 1, condition: { always: true } },
      // effect 3: gains Scaling (LV2) and loses 1 level of Draining
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
      { type: "drainingReduction", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 2: While in this Transformation, ignore the second effect of the Superior State.
      "While in this Transformation, ignore the second effect of the Superior State.",
      // effect 4: 1/Round — Regain 1/2 of the Divine Ki Points spent to pay the Ki Point Cost of a Maneuver.
      "Regain 1/2 of the Divine Ki Points spent to pay the Ki Point Cost of a Maneuver. (1/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // EMPOWERED EVOLUTION — Mastery: Empowered Mutation
  // ---------------------------------------------------------------------------
  "empowered_evolution": {
    name: "Mastery: Empowered Mutation",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Strainless"],  // effect 1: loses Draining and Strainless
    aspectsToAdd: ["Natural"],                      // effect 1: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: 1/Round — If Attacking Maneuver's Damage Category is Lethal, trigger first effect of Brutal Assault.
      "If you make an Attacking Maneuver whose Damage Category is Lethal, you may trigger the first effect of Brutal Assault for that Attacking Maneuver. (1/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // BRILLIANT EVOLUTION — Mastery: Truly Brilliant
  // ---------------------------------------------------------------------------
  "brilliant_evolution": {
    name: "Mastery: Truly Brilliant",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation", "Draining", "Weakening"],  // effect 1: reduces Draining by 2, loses Long Transformation; effect 4: loses Draining and Weakening
    aspectsToAdd: ["Strainless"],  // effect 4: gains Strainless
    conditionals: [
      // effect 1: reduces Draining by 2
      { type: "drainingReduction", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Ignore the first effect of Brilliant Plating.
      "Ignore the first effect of Brilliant Plating.",
      // effect 3: 1/Round — If an Attacking Maneuver benefits from Brutal Assault, increase Strike Roll by 1(T).
      "If one of your Attacking Maneuvers would benefit from the first effect of Brutal Assault, increase the Strike Roll of that Attacking Maneuver by 1(T). (1/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // HYPER MEGA FORM — Mastery: Steel General
  // ---------------------------------------------------------------------------
  "hyper_mega_form": {
    name: "Mastery: Steel General",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation"],  // effect 1: loses Long Transformation
    aspectsToAdd: ["Scaling", "Strainless"],    // effect 1: gains Scaling (LV2); effect 5: gains Strainless
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Increase the Saving Throws of all your Soldiers by 1(T).
      "Increase the Saving Throws of all your Soldiers (including those who are Secondary Characters) by 1(T).",
      // effect 3: Increase the Might and Wound Rolls of your Soldiers by 1(T) for each Power stack.
      "Increase the Might and Wound Rolls of your Soldiers (including those who are Secondary Characters) by 1(T) for each stack of Power you possess.",
      // effect 4: Triggered/Power, 1/Round — Use the Unify Maneuver or Energy Charge Maneuver as OoS.
      "You may use the Unify Maneuver or the Energy Charge Maneuver as an Out-of-Sequence Maneuver. (Triggered/Power, 1/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // LEGENDARY SUPER SAIYAN 4 — Mastery: Legendary Super Full Power Saiyan 4
  // ---------------------------------------------------------------------------
  "legendary_super_saiyan_4": {
    name: "Mastery: Legendary Super Full Power Saiyan 4",
    attrBonuses: {},
    aspectsToRemove: ["Rampaging"],  // effect 1: loses Rampaging
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 2: Change keyword for 5th effect of Overflowing Saiyan Power from Automatic to Triggered.
      "Change the keyword for the 5th effect of Overflowing Saiyan Power from Automatic to Triggered.",
      // effect 3: You do not apply the first effect to your Multiplicative Technique (the Life Point cost).
      "You do not apply the first effect to your Signature Technique gained through the 7th effect of Overflowing Saiyan Power.",
      // effect 4: 1/Round — While in Full Power, may use Direct Hit without spending Counter Action.
      "While in the Full Power Special State, you may use the Direct Hit option of the Defend Maneuver without spending a Counter Action. (1/Round)",
      // effect 5: Change Keywords for 5th effect of Primal Power to [Triggered/Power, 1/Round, 3/Encounter].
      "Change the Keywords for 5th effect of Primal Power to [ Triggered/Power, 1/Round, 3/Encounter ].",
    ],
  },

  // ---------------------------------------------------------------------------
  // LIQUID METAL — Mastery: Dominion over Metal
  // ---------------------------------------------------------------------------
  "liquid_metal": {
    name: "Mastery: Dominion over Metal",
    attrBonuses: {},
    aspectsToRemove: ["Long Transformation", "Draining", "Strainless"],  // effects 1+3: loses these
    aspectsToAdd: ["Scaling", "Natural"],  // effect 1: gains Scaling (LV2); effect 3: gains Natural
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: While occupying a Metal Square, increase ToP Extra Dice by 2 Dice Categories.
      "While you are occupying a Metal Square, increase your Tier of Power Extra Dice by 2 Dice Categories.",
    ],
  },

  // ---------------------------------------------------------------------------
  // MIGHTIEST MAJIN — Mastery: Combined Power
  // ---------------------------------------------------------------------------
  "mightiest_majin": {
    name: "Mastery: Combined Power",
    attrBonuses: {},
    aspectsToRemove: ["Power High"],          // effect 1: loses Power High
    aspectsToAdd: ["Scaling", "Natural"],      // effect 1: gains Scaling (LV2); effect 4: gains Natural
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Double the value of x for the first effect of Manifested Power.
      "Double the value of x for the first effect of Manifested Power.",
      // effect 3: Triggered/Power, 1/Encounter — If Source of Might has equal or higher base ToP, enter Superior or Surging State.
      "If your Source of Might has an equal or higher base Tier of Power as you, enter the Superior State or Surging State (you decide) until the end of your next turn. (Triggered/Power, 1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // PERFECTED SUPER SAIYAN — The Golden Warrior of Legend (Mastery Trait)
  // ---------------------------------------------------------------------------
  "perfected_super_saiyan": {
    name: "The Golden Warrior of Legend",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Dedicated"],  // effect 1: loses 1 Draining + Dedicated; effect 3: loses remaining Draining
    aspectsToAdd: ["Strainless", "Realization", "Scaling", "Perfect Ki Control"],  // effect 1: gains Strainless, Realization, Scaling (LV2); effect 3: gains Perfect Ki Control
    conditionals: [
      // effect 1: loses 1 level of Draining
      { type: "drainingReduction", value: 1, condition: { always: true } },
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Increase your maximum number of Power Stacks by 1.
      "Increase your maximum number of Power Stacks by 1.",
      // effect 4: Triggered/Power — Gain an additional stack of Power.
      "Gain an additional stack of Power. (Triggered/Power)",
    ],
  },

  // ---------------------------------------------------------------------------
  // POTENTIAL UNLEASHED — Mastery: Neverending Potential
  // ---------------------------------------------------------------------------
  "potential_unleashed": {
    name: "Mastery: Neverending Potential",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: While not in Full Power State, ignore 3rd effect of Latent Power and replace Strainless with Natural.
      "While you are in Potential Unleashed and are not in the Full Power State, ignore the third effect of Latent Power and replace the Strainless Aspect for Potential Unleashed with the Natural Aspect.",
      // effect 2: While in Full Power State, possess 1 extra Power stack and reduce Draining by 1.
      "While in the Full Power State, you can possess 1 stack of Power beyond the maximum and you reduce your levels of the Draining Aspect by 1. Any number of Power stacks that exceed the maximum are removed if you leave the Full Power State.",
      // effect 3: Triggered/Transform — Gain 1 stack of Unlocked Potential until you leave this Transformation.
      "Gain 1 stack of Unlocked Potential until you leave this Transformation. (Triggered/Transform)",
    ],
  },

  // ---------------------------------------------------------------------------
  // FULL POWER BOOST — Mastery: The Meaning of Power I
  // ---------------------------------------------------------------------------
  "full_power_boost": {
    name: "Mastery: The Meaning of Power I",
    attrBonuses: {},
    aspectsToRemove: ["Strainless"],  // effect 1: replaces Strainless with Natural
    aspectsToAdd: ["Natural"],         // effect 1: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: Full Power Boost does not gain the Draining Aspect from the 4th effect of Greatest Power.
      "Full Power Boost does not gain the Draining Aspect from the 4th effect of Greatest Power.",
      // effect 3: Triggered/Power — Increase the amount of Power stacks gained from this use of Power Up Maneuver by 1.
      "Increase the amount of Power stacks you gain from this use of the Power Up Maneuver by 1. (Triggered/Power)",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER FULL POWER BOOST — Mastery: The Meaning of Power II
  // ---------------------------------------------------------------------------
  "super_full_power_boost": {
    name: "Mastery: The Meaning of Power II",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Surpass the Strong's third effect becomes 2/Encounter.
      "Surpass the Strong's third effect becomes 2/Encounter.",
      // effect 2: For each stack of Power, increase your Wound Rolls by 1(T).
      "For each stack of Power, increase your Wound Rolls by 1(T).",
      // effect 3: Reduce the amount of Ki Points lost through the Draining Aspect by 1/2.
      "Reduce the amount of Ki Points lost through the Draining Aspect by 1/2.",
    ],
  },

  // ---------------------------------------------------------------------------
  // PURE FORM — Mastery: Directed Chaos
  // ---------------------------------------------------------------------------
  "pure_form": {
    name: "Mastery: Directed Chaos",
    attrBonuses: {},
    aspectsToRemove: ["Rampaging"],  // effects 1+5: loses 1 level then full Rampaging
    aspectsToAdd: ["Scaling", "Natural"],  // effect 1: gains Scaling (LV2); effect 5: gains Natural
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Ignore the 4th effect of Erratic.
      "Ignore the 4th effect of Erratic.",
      // effect 3: 1/Encounter — If you roll 6 on Chaos Die, enter Superior or Surging State.
      "If you roll 6 on the Chaos Die, enter either the Superior State or Surging State (you decide) until the end of your next turn. (1/Encounter)",
      // effect 4: Automatic, Resource — First Chaos Die roll each round grants 1 or 2 Control stacks. Can spend to adjust Chaos Die by 1.
      "The first time you roll the Chaos Die a Combat Round, you gain either 1 (result: 1~3) or 2 (result: 4~6) stacks of Control until the end of the Combat Round. You may spend Control when rolling the Chaos Die to increase or reduce the result by 1. (Automatic, Resource, 1/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // SPLENDID EVOLUTION — Mastery: Truly Splendid
  // ---------------------------------------------------------------------------
  "splendid_evolution": {
    name: "Mastery: Truly Splendid",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Dedicated"],  // effect 1: loses Draining; effect 4: loses Dedicated
    aspectsToAdd: ["Scaling", "Strainless"],       // effect 1: gains Scaling (LV2); effect 4: gains Strainless
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: If Attacking Maneuver benefits from Brutal Assault, increase Strike Roll by 1(T).
      "If your Attacking Maneuver benefits from the first effect of Brutal Assault, increase the Strike Roll of that Attacking Maneuver by 1(T).",
      // effect 3: 1/Round — If you hit an Opponent, may use Power Up as OoS.
      "If you hit an Opponent with an Attacking Maneuver, you may use the Power Up Maneuver as an Out-of-Sequence Maneuver. (1/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER EVOLUTION — Mastery: Superior Evolution
  // ---------------------------------------------------------------------------
  "super_evolution": {
    name: "Mastery: Superior Evolution",
    attrBonuses: {},
    aspectsToRemove: ["Power High", "Strainless"],  // effect 1: loses Power High and Strainless
    aspectsToAdd: ["Natural"],                        // effect 1: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: Double the bonus gained through the third effect of Keratinous Plating.
      "Double the bonus gained through the third effect of Keratinous Plating.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER GRUDGE AMPLIFICATION — Mastery: An Unending Grudge
  // ---------------------------------------------------------------------------
  "super_grudge_amplification": {
    name: "Mastery: An Unending Grudge",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: ["Scaling"],  // effect 1: gains Scaling (LV2)
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Triggered/Transform — Maximize your Revenge Points. Set to 0 at end of turn.
      "Maximize your Revenge Points. Set your Revenge Points to 0 at the end of this turn. (Triggered/Transform)",
      // effect 3: 1/Encounter — If you or an Ally is hit by a Signature Technique while you have 2+ Revenge Points, use Basic Attack or Signature Technique as OoS.
      "If you or an Ally within a Destructive Sphere AoE (centered on you) is hit by an Opponent's Signature Technique while you have 2+ Revenge Points, you may use the Basic Attack Maneuver or the Signature Technique Maneuver as an Out-of-Sequence Maneuver against that Opponent, but you must spend at least 2 Revenge Points on that Attacking Maneuver. (1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER PERFECT FORM — Mastery: Far Beyond Perfection
  // ---------------------------------------------------------------------------
  "super_perfect_form": {
    name: "Mastery: Far Beyond Perfection",
    attrBonuses: {},
    aspectsToRemove: ["Power High", "Draining"],  // effect 1: loses Power High; effect 2: loses Draining
    aspectsToAdd: ["Strainless", "Scaling"],        // effect 1: gains Strainless and Scaling (LV2)
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 3: Upon gaining this Mastery, select an additional Super Genetic Trait matching your Genetic Traits.
      "Upon gaining this Mastery, select an additional Super Genetic Trait that has a listed Race in brackets that matches a Race listed in brackets among your Genetic Traits. You gain the effects of that Super Genetic Trait while in this Transformation.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER SAIYAN 4 — Mastery: Super Full Power Saiyan 4
  // ---------------------------------------------------------------------------
  "super_saiyan_4": {
    name: "Mastery: Super Full Power Saiyan 4",
    attrBonuses: {},
    aspectsToRemove: ["Power High"],  // effect 1: loses Power High
    aspectsToAdd: ["Scaling", "Natural"],  // effect 1: gains Scaling (LV2); effect 3: gains Natural
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: 1/Encounter — While in Full Power, if hit, use Signature Technique as OoS with Multiplicative Technique. Increase Wound Roll by 1/2 of Damage suffered.
      "While in the Full Power State, if you are hit by an Attacking Maneuver, you may (after that Attacking Maneuver is completed) use the Signature Technique Maneuver as an Out-of-Sequence Maneuver, but you must use your Multiplicative Technique for that Attacking Maneuver. If you do, increase the Wound Roll of that Attacking Maneuver by 1/2 (rounded up) the Damage you suffered from the triggering Attacking Maneuver. (1/Encounter)",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER SAIYAN 5 — Primal Focus (Mastery Trait)
  // ---------------------------------------------------------------------------
  "super_saiyan_5": {
    name: "Primal Focus",
    attrBonuses: {},
    aspectsToRemove: ["Rampaging", "Draining"],  // effect 1: loses Rampaging and Draining
    aspectsToAdd: ["Mindful"],                     // effect 1: gains Mindful (LV2)
    conditionals: [],
    narrative: [
      // effect 2: Ignore the first and second effects of Intense Bloodthirst.
      "Ignore the first and second effects of Intense Bloodthirst.",
      // effect 3: The third effect of Primal Fury also applies if you are in the Mindful or Superior States.
      "The third effect of Primal Fury also applies if you are in the Mindful or Superior States.",
      // effect 4: While in Mindful State, increase Wound Rolls by x(bT), where x = Battle Born stacks on Dodge Rolls.
      "While in the Mindful State, increase your Wound Rolls by x(bT), where x is equal to the number of Battle Born stacks applied to your Dodge Rolls.",
      // effect 5: While in Superior State, increase Greater Dice Category by 1 for every Battle Born stack on Strike Rolls.
      "While in the Superior State, increase the Dice Category of your Greater Dice by 1 for every Battle Born stack applied to your Strike Rolls.",
      // effect 6: If you trigger the 5th effect of Primal Fury, you may enter Mindful or Superior State instead.
      "If you trigger the 5th effect of Primal Fury, you may choose to enter the Mindful or Superior State instead of the Raging State for its effects.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER SAIYAN GOD — Mastery: Acclimated to Divinity
  // ---------------------------------------------------------------------------
  "super_saiyan_god": {
    name: "Mastery: Acclimated to Divinity",
    attrBonuses: {},
    aspectsToRemove: ["Temporary", "Limited"],  // effect 1: loses Temporary and Limited + third effect of Divine Acclimation
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: also loses the third effect of Divine Acclimation.
      "Super Saiyan God loses the third effect of Divine Acclimation.",
      // effect 2: Double the increase to your ToP Extra Dice from your Acclimation stacks.
      "Double the increase to your Tier of Power Extra Dice from your Acclimation stacks.",
      // effect 3: If you would gain Battle Born while at max stacks, regain 3(bT) Divine Ki Points.
      "If you would gain a stack of Battle Born through an effect while you have your maximum number of Battle Born stacks, regain 3(bT) Divine Ki Points.",
      // effect 4: Upon mastering SSG, select 2 God Maneuvers.
      "Upon mastering Super Saiyan God, select 2 God Maneuvers. Gain access to those God Maneuvers while you are in the Super Saiyan God Transformation.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER SAIYAN BLUE — Mastery: Perfected Super Saiyan Blue
  // ---------------------------------------------------------------------------
  "super_saiyan_blue": {
    name: "Mastery: Perfected Super Saiyan Blue",
    attrBonuses: {},
    aspectsToRemove: ["Weakening"],  // effect 5: loses Weakening
    aspectsToAdd: ["Strainless"],     // effect 5: gains Strainless
    conditionals: [
      // effect 5: loses 1 level of Draining
      { type: "drainingReduction", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 1: For each level of the Draining Aspect, you lose 2(T) Ki Points instead of 3(T).
      "For each level of the Draining Aspect, you lose 2(T) Ki Points instead of 3(T).",
      // effect 2: Ignore the second effect of Deific Saiyan.
      "Ignore the second effect of Deific Saiyan.",
      // effect 3: While using an Enhancement Power in conjunction, increase Stress Bonus by 2.
      "While using an Enhancement Power in conjunction with Super Saiyan Blue, increase your Stress Bonus by 2.",
      // effect 4: Upon gaining this Mastery, select a God Maneuver. Access while in SSB and Full Power simultaneously.
      "Upon gaining this Mastery Trait, select a God Maneuver. You have access to that God Maneuver while in the Super Saiyan Blue Transformation and Full Power State simultaneously.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER SAIYAN ROSE — Mastery: What Vulgar Power
  // ---------------------------------------------------------------------------
  "super_saiyan_rose": {
    name: "Mastery: What Vulgar Power",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Upon gaining this Mastery, select a God Maneuver. Access while in SSR and Full Power simultaneously.
      "Upon gaining this Mastery Trait, select a God Maneuver. You have access to that God Maneuver while in the Super Saiyan Ros\u00e9 Transformation and the Full Power State simultaneously.",
      // effect 2: Ignore the 2nd effect of Deific Saiyan.
      "Ignore the 2nd effect of Deific Saiyan.",
      // effect 3: While using an Aura, increase your Stress Bonus by 2.
      "While using an Aura, increase your Stress Bonus by 2.",
      // effect 4: If you do not have access to SSG, gain Divine Ki regain on Battle Born overflow.
      "If you do not have access to Super Saiyan God, apply the following effect: [Triggered]: If you would gain a stack of Battle Born through an effect while you have your maximum number of Battle Born stacks, regain 3(bT) Divine Ki Points.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPER STAR DRAGON — Mastery: Greatest Dragon
  // ---------------------------------------------------------------------------
  "super_star_dragon": {
    name: "Mastery: Greatest Dragon",
    attrBonuses: {},
    aspectsToRemove: ["Power High"],          // effect 3: loses Power High
    aspectsToAdd: ["Scaling", "Natural"],      // effect 1: gains Scaling (LV2); effect 3: gains Natural
    conditionals: [
      // effect 1: gains Scaling (LV2)
      { type: "scalingAspectLevel", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Triggered, Resource — Whenever you lose Life Points through one of your effects, gain Karmic Ki equal to 1/2 the amount lost.
      "Whenever you lose Life Points through one of your effects, gain an amount of Karmic Ki equal to 1/2 (rounded up) the amount lost. You may spend your Karmic Ki when making an Attacking Maneuver to increase your Ki Wager by the amount of Karmic Ki spent. You cannot spend an amount of Karmic Ki that exceeds 1/2 of your Max Capacity on one Attacking Maneuver.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPERIOR NAMEKIAN — Mastery: True Super Namekian
  // ---------------------------------------------------------------------------
  "superior_namekian": {
    name: "Mastery: True Super Namekian",
    attrBonuses: {},
    aspectsToRemove: ["Draining"],                          // effect 1: loses Draining
    aspectsToAdd: ["Natural", "Perfect Ki Control"],         // effect 4: gains Natural and Perfect Ki Control
    conditionals: [
      // effect 1: gains a level of High Speed
      { type: "highSpeedLevel", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 2: For each stack of Super Namekian, increase LP regain from Namekian Biology by 1(bT).
      "For each stack of Super Namekian you possess, increase the amount of Life Points you regain through the second effect of Namekian Biology by 1(bT).",
      // effect 3: 1/Round — If you remove 2+ stacks of Studied, next Attacking Maneuver's Damage Category increased by 1.
      "If you remove 2+ stacks of Studied from an Opponent due to any effect, your next Attacking Maneuver to hit that Opponent has its Damage Category increased by 1 Category. (1/Round)",
    ],
  },

  // ---------------------------------------------------------------------------
  // SUPERIOR SUPER SAIYAN — Mastery: A Superior Saiyan
  // ---------------------------------------------------------------------------
  "superior_super_saiyan": {
    name: "Mastery: A Superior Saiyan",
    attrBonuses: {},
    aspectsToRemove: ["Draining", "Power High"],  // effect 1: loses both Draining and Power High
    aspectsToAdd: ["Strainless"],                   // effect 1: gains Strainless
    conditionals: [],
    narrative: [
      // effect 2: When using Golden Power upon entering, may enter Superior State instead of Raging State.
      "When you use the second effect of Golden Power upon entering this Transformation, you may enter the Superior State instead of the Raging State. The increase to Dice Category through the effects of the Raging Aspect apply to Greater Dice instead for the duration of this effect.",
      // effect 3: Triggered/Transform — Gain a stack of Battle Born.
      "Gain a stack of Battle Born. (Triggered/Transform)",
      // effect 4: While using an Aura, increase your Stress Bonus by 2.
      "While using an Aura, increase your Stress Bonus by 2.",
    ],
  },

  // ---------------------------------------------------------------------------
  // ULTIMATE ANDROID — Mastery: Magnum Opus
  // ---------------------------------------------------------------------------
  "ultimate_android": {
    name: "Mastery: Magnum Opus",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Ignore the second effect of the Superior State and the first effect of Strongest Android.
      "Ignore the second effect of the Superior State and the first effect of Strongest Android.",
      // effect 2: Increase the Dice Score of your Stress Test rolls when using in conjunction by 1.
      "Increase the Dice Score of your Stress Test rolls when using this Transformation in conjunction with another Transformation by 1.",
    ],
  },

  // ---------------------------------------------------------------------------
  // ULTIMATE SUPER SAIYAN — Mastery: Ultimate Golden Power
  // ---------------------------------------------------------------------------
  "ultimate_super_saiyan": {
    name: "Mastery: Ultimate Golden Power",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Ignore the second effect of the Superior State.
      "Ignore the second effect of the Superior State.",
      // effect 2: Increase the Dice Score of your Stress Test rolls when using in conjunction by 1.
      "Increase the Dice Score of your Stress Test rolls when using this Transformation in conjunction with another Transformation by 1.",
    ],
  },

  // ---------------------------------------------------------------------------
  // ULTRA EGO — Mastery: Overcoming the Self
  // ---------------------------------------------------------------------------
  "ultra_ego": {
    name: "Mastery: Overcoming the Self",
    attrBonuses: {},
    aspectsToRemove: ["Power High", "Exhausting", "Draining"],  // effect 1: loses Power High + Exhausting; effect 5: loses Draining
    aspectsToAdd: ["Strainless", "Natural"],  // effect 1: gains Strainless; effect 5: gains Natural
    conditionals: [],
    narrative: [
      // effect 2: Ignore the second effect of the Superior State.
      "Ignore the second effect of the Superior State.",
      // effect 3: While you possess 2+ stacks of Power, this Transformation gains the Armored Aspect.
      "While you possess 2+ stacks of Power, this Transformation gains the Armored Aspect.",
      // effect 4: 1/Round — For every Energy Charge a Signature Technique with the Destruction Profile possesses, increase its Wound Roll by 1(T).
      "For every Energy Charge a Signature Technique with the Destruction Profile possesses, increase its Wound Roll by 1(T). (1/Round)",
      // effect 5: Power of Destruction does not count as an additional Transformation for the effects of the Natural Aspect.
      "Power of Destruction does not count as an additional Transformation for the effects of the Natural Aspect.",
    ],
  },

  // ---------------------------------------------------------------------------
  // ULTRA INSTINCT "SIGN" — Mastery: Overcoming the Heat
  // ---------------------------------------------------------------------------
  "ultra_instinct_sign": {
    name: "Mastery: Overcoming the Heat",
    attrBonuses: {},
    aspectsToRemove: ["Exhausting", "Weakening", "Temporary Form"],  // effect 1: loses Exhausting, Weakening, Temporary Form
    aspectsToAdd: ["Strainless"],  // effect 1: gains Strainless
    conditionals: [
      // effect 1: loses 1 level of Draining
      { type: "drainingReduction", value: 1, condition: { always: true } },
    ],
    narrative: [
      // effect 2: Ignore the 4th and 5th effects of Overwhelming Heat.
      "Ignore the 4th and 5th effects of Overwhelming Heat.",
      // effect 3: All of your Attacking Maneuvers have their Damage Category increased by 1 category.
      "All of your Attacking Maneuvers have their Damage Category increased by 1 category.",
    ],
  },

  // ---------------------------------------------------------------------------
  // ULTRA INSTINCT "COMPLETE" — Mastery: Surpassing the Gods
  // ---------------------------------------------------------------------------
  "ultra_instinct_complete": {
    name: "Mastery: Surpassing the Gods",
    attrBonuses: {},
    aspectsToRemove: ["Draining"],  // effects 3+4: loses 2 total levels of Draining
    aspectsToAdd: ["Natural"],       // effect 4: gains Natural
    conditionals: [
      // effects 3+4: loses 2 levels of Draining total
      { type: "drainingReduction", value: 2, condition: { always: true } },
    ],
    narrative: [
      // effect 1: Set your Critical Target for Strike and Dodge Rolls to 7.
      "Set your Critical Target for your Strike and Dodge Rolls to 7.",
      // effect 2: You may use Signature Technique Maneuver instead of Basic Attack through 4th effect of Beyond Heat.
      "You may use the Signature Technique Maneuver instead of the Basic Attack Maneuver through the 4th effect of Beyond Heat.",
      // effect 4: Autonomous Ultra Instinct does not count as an additional Transformation for the effects of the Natural Aspect.
      "Autonomous Ultra Instinct does not count as an additional Transformation for the effects of the Natural Aspect.",
    ],
  },

  // ---------------------------------------------------------------------------
  // XENO SUPER SAIYAN ROSE — Mastery: Multiversal Strength
  // ---------------------------------------------------------------------------
  "xeno_super_saiyan_rose": {
    name: "Mastery: Multiversal Strength",
    attrBonuses: {},
    aspectsToRemove: [],
    aspectsToAdd: [],
    conditionals: [],
    narrative: [
      // effect 1: Triggered/Start of Turn — While using an Enhancement Power in conjunction, regain G(bT) Divine Ki Points.
      "While using an Enhancement Power in conjunction with this Transformation, regain G(bT) Divine Ki Points. (Triggered/Start of Turn)",
      // effect 2: Grade 2 does not add a level of the Draining Aspect to this Transformation.
      "Grade 2 does not add a level of the Draining Aspect to this Transformation.",
    ],
  },

};
