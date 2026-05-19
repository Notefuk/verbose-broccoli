// ============================================================================
// UNIQUE ABILITIES DATA - All 46 Unique Abilities from DBU RPG
// Source: unique-abilities.txt (Manuales_Organizados)
// ============================================================================

export const UNIQUE_ABILITIES_DATA = {

  // ── 1. Afterimage Technique ──────────────────────────────────────────────
  afterimage_technique: {
    id: "afterimage_technique",
    name: "Afterimage Technique",
    abilityType: "Technical",
    prerequisites: "Agility Score 4+",
    tpCost: 8,
    kpCost: "2(T)",
    maneuverType: "Counter",
    actionCost: "1 Counter Action",
    passiveBonus: "Increase the bonus to your Strike Roll from Rapid Movement by 1(T).",
    effect: "When targeted by an Attacking Maneuver, you can increase your Defense Value by 2(T) for the duration of the Attacking Maneuver. If you avoid the Attacking Maneuver, you can use the Movement Maneuver as an Out-of-Sequence Action. This Movement Maneuver does not trigger the Exploit Maneuver.",
    advancements: [
      {
        id: "wild_sense",
        name: "Wild Sense",
        prerequisites: "Insight Score 6+",
        tpCost: 6,
        effect: "If you would use the Movement Maneuver through the effects of the Afterimage Technique, you may instead use the Basic Attack Maneuver."
      },
      {
        id: "afterimage_strike",
        name: "Afterimage Strike",
        prerequisites: "Agility Score 8+",
        tpCost: 10,
        effect: "If you use the Movement Maneuver through the effects of the Afterimage Technique, make a Clash (Impulsive vs Cognitive) against the Opponent who targeted you with an Attacking Maneuver. If you win, the targeted Opponent gains the Oblivious Combat Condition."
      },
      {
        id: "bunkai_teleport",
        name: "Bunkai Teleport",
        prerequisites: "Illusion Smash",
        tpCost: 10,
        effect: "If you use the Afterimage Technique in response to an Attacking Maneuver, you may treat your Size Category as if it was Tiny for the sake of calculating your Defense Value for the duration of that Attacking Maneuver."
      }
    ],
    restrictions: []
  },

  // ── 2. Binding ─────────────────────────────────────────────────────────
  binding: {
    id: "binding",
    name: "Binding",
    abilityType: "Technical/Magical",
    prerequisites: "Force or Magic Score of 8+",
    tpCost: 15,
    kpCost: "10(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "N/A",
    effect: "Target a Character who is not at Long Range. Make a Clash (Energy Strike/Magic Strike vs Dodge). If you win, reduce their Defense Value by 1(T) until the end of your next turn and make a Might Clash against that same Character. If you win, that target is Pinned. At the start of each of your turns, while a Character is Pinned by the effects of your Binding, you must pay the KP Cost of Binding or they stop being Pinned. You can also remove the effects of Binding as an Instant Maneuver. For every Turn that an Opponent ends with the Pinned Combat Condition through the effects of your Binding, increase the Dice Score of their Might Clash through the effects of the Pinned Combat Condition by 1(T) – using their Tier of Power to calculate this bonus. You cannot use this Unique Ability again if an Opponent is currently Pinned due to the effects of your use of Binding.",
    advancements: [
      {
        id: "psychic_grip",
        name: "Psychic Grip",
        prerequisites: "Telekinesis, Force or Magic Score 8+",
        tpCost: 4,
        effect: "While an Opponent is Pinned due to the effects of Binding, reduce their Dice Score for the Clash against the effects of Telekinesis by 2(T)."
      },
      {
        id: "galactic_donut",
        name: "Galactic Donut",
        prerequisites: "Force or Magic Score 10+, you do not possess the Energy Web Advancement",
        tpCost: 6,
        effect: "Spend 2(T) Ki Points when using the Binding Unique Ability to apply the effects of Galactic Donut to the targeted Opponent if they become Pinned through the effects of this use of Binding, while they are suffering from the effects of Binding. Galactic Donut reduces a target's Life Points by 1/2 of your Might when they gain the Pinned Combat Condition and at the start of each of their turns. If you hit an Opponent who is suffering from the effects of Galactic Donut with a Signature Technique, you may cause it to explode – freeing them from the effects of the Binding (after the Attacking Maneuver is complete) but increasing the Wound Roll of that Attacking Maneuver by your Might."
      },
      {
        id: "super_donut_volley",
        name: "Super Donut Volley",
        prerequisites: "Galactic Donut",
        tpCost: 4,
        effect: "When using the effects of Galactic Donut, you can spend an additional 4(T) Ki Points. If you do, increase the damage inflicted through any of the effects of Galactic Donut by 1/2 of your Might."
      },
      {
        id: "donut_volleyball",
        name: "Donut Volleyball",
        prerequisites: "Super Donut Volley",
        tpCost: 4,
        effect: "If you use the effects of Super Donut Volley, you may move the targeted Opponent to a Square adjacent to you- they become known as the Volleyball until they are no longer bound- and begin Volleyball Time! Once Volleyball Time! begins, make a Basic Attack Maneuver of the Simple Profile against the Volleyball as an Out-of-Sequence Maneuver. This Attacking Maneuver gains the Knockback Advantage. If the movement from this Attacking Maneuver would make them Collide with any of your Allies, instead of undergoing the rules for Collision, that Ally can use the Basic Attack Maneuver of the Simple Profile against the Volleyball as an Out-of-Sequence Maneuver. That Attacking Maneuver gains the Knockback Advantage and if the movement from that Attacking Maneuver would cause Collision with any of their Allies, continue to apply this effect until it can no longer be applied. Each Character can only use the Basic Attack Maneuver through the effects of Donut Volleyball once during each Combat Encounter. If an Ally's Attacking Maneuver would cause the Volleyball to Collide with you, you may use the Signature Technique Maneuver to use the Spike! Signature Technique as an Out-of-Sequence Maneuver, even if you do not possess the Spike! Signature Technique. The Spike! Signature is a Super Signature Technique of the Powered Profile with no Advantages or Disadvantages. If you hit the Volleyball with the Spike! Signature Technique, you must apply the effect of Galactic Donut to increase your Wound Roll of this Attacking Maneuver by your Might."
      },
      {
        id: "energy_web",
        name: "Energy Web",
        prerequisites: "Insight Score 6+, you do not possess the Galactic Donut Advancement",
        tpCost: 10,
        effect: "If you inflict the Pinned Combat Condition through the Binding Unique Ability, spend 4(T) Ki Points to apply the Guard Down Combat Condition to that Opponent until they are no longer Pinned."
      },
      {
        id: "psycho_thread",
        name: "Psycho Thread",
        prerequisites: "Energy Web",
        tpCost: 8,
        effect: "Spend 4(T) Ki Points when using the Binding Unique Ability to apply the effects of Psycho Thread to the targeted Opponent if they become Pinned through the effects of this use of Binding, while they are suffering from the effects of Binding. Psycho Thread reduces a target's Ki Points by 1/2 of your Might when they gain the Pinned Combat Condition and at the start of each of their turns. If an Opponent has the Guard Down Combat Condition when they would lose Ki Points through the effects of Psycho Thread, they must make a Stress Test for any Transformation they are currently in. Reduce the Dice Score of their Stress Test by 1/2 of your Tier of Power (rounded up)."
      }
    ],
    restrictions: []
  },

  // ── 3. Body Change ─────────────────────────────────────────────────────
  body_change: {
    id: "body_change",
    name: "Body Change",
    abilityType: "Magical",
    prerequisites: "N/A",
    tpCost: 50,
    kpCost: "15(T)",
    maneuverType: "Standard",
    actionCost: "3 Actions",
    passiveBonus: null,
    effect: "Target a Character who is not at Long Range and make a Clash (Cognitive vs Impulsive) against them. If you win, you swap bodies. For both Characters who have swapped bodies, follow the below rules: Swap Attribute Scores (AG/TE/FO/MA). Swap Races for the sake of any Racial Requirements and Racial Life Modifiers. Recalculate your Maximum Life Points and then swap current Life Point values. Swap Body Racial Traits. You cannot gain more than 7 Racial Traits (both Body and Mind) in total. If you would gain more than 7 Racial Traits, decide which 7 Racial Traits (2 Primary and up to 5 Secondary) you can use from the list of Body and Mind Racial Traits you possess. Any Option effects for Body Racial Traits must be the same as the original owner of the body and any Option effects for your Mind Racial Traits remain the same as what you decided in Character Creation. After swapping bodies, both Characters gain 3 stacks of Unfamiliar. Each stack of Unfamiliar reduces your Combat Rolls by 1(bT). While you have 2+ stacks of Unfamiliar, reduce your current Tier of Power by 1. At the end of each Combat Encounter you participate in, you may remove a stack of Unfamiliar. You lose all previous stacks of Unfamiliar when you swap to a new body, but you still gain the 3 stacks for entering a new body. If you are swapped back into your original body, you do not gain Unfamiliar stacks.",
    advancements: [],
    restrictions: []
  },

  // ── 4. Cage of Light ───────────────────────────────────────────────────
  cage_of_light: {
    id: "cage_of_light",
    name: "Cage of Light",
    abilityType: "Technical",
    prerequisites: "Force or Magic Score 10+, Insight Score 8+",
    tpCost: 16,
    kpCost: "10(T)",
    maneuverType: "Standard",
    actionCost: "All Actions",
    passiveBonus: null,
    effect: "Spend all of your Actions to target a Square within 8 Squares of you. Create a Large Sphere AoE centered on your chosen Square, this is known as the Cage. Characters within the Cage of Light reduce their Life Points by 1/2 of your Might whenever they would successfully dodge an Attacking Maneuver. Characters within the Cage cannot move outside of the Cage, and characters outside of the Cage cannot move into the Cage and will cease movement on a Square adjacent to the perimeter of the Cage. Any Character that moves onto an adjacent Square to the perimeter of the Cage reduces their Life Points by 2x your Might. Characters can attempt to enter or exit the Cage when using the Movement Maneuver to try and move into or out of the Cage (they still suffer the reduction to Life Points listed above) by making a Might Clash against you. If they win, they enter/exit the Cage. At the start of each of your turns, you may spend all of your Actions and pay the KP Cost of Cage of Light to maintain the Cage. If you choose not to, the Cage will disappear. You cannot use this Unique Ability while a Cage is active but you can remove the Cage as an Instant Action.",
    advancements: [],
    restrictions: []
  },

  // ── 5. Devilmite Beam ──────────────────────────────────────────────────
  devilmite_beam: {
    id: "devilmite_beam",
    name: "Devilmite Beam",
    abilityType: "Technical",
    prerequisites: "Insight Score 6+, Personality Score 4+",
    tpCost: 50,
    kpCost: "100% of the highest between your current and base Max Capacity",
    maneuverType: "Standard",
    actionCost: "3 Actions",
    passiveBonus: "Increase the Wound Roll of all Attacking Maneuvers with the Karmic Advantage by 2(T).",
    effect: "Target an Opponent and make a Clash (Cognitive vs Impulsive) against them. If you win, apply the following effects depending on the alignment of their Z-Soul: Pure Evil: The target is Defeated. Evil: Reduce the target's Life Points by 10x their Might. Neutral: Reduce the target's Life Points by 5x their Might. Good: Reduce the target's Life Points by 2x their Might. Pure Good: Nothing happens.",
    advancements: [],
    restrictions: []
  },

  // ── 6. Dragon Dash ─────────────────────────────────────────────────────
  dragon_dash: {
    id: "dragon_dash",
    name: "Dragon Dash",
    abilityType: "Technical",
    prerequisites: "Access to the Soar Maneuver",
    tpCost: 5,
    kpCost: "2(T)",
    maneuverType: "Out-of-Sequence",
    actionCost: "N/A",
    passiveBonus: "Increase your Speed by 1(T).",
    effect: "If one of your Attacking Maneuvers or effects moves an Opponent out of your Melee Range, you may use the Movement Maneuver to move in a straight line towards that Opponent or away from that Opponent as an Out-of-Sequence Maneuver.",
    advancements: [
      {
        id: "deadly_chaser",
        name: "Deadly Chaser",
        prerequisites: "N/A",
        tpCost: 10,
        effect: "If you move to a Square that places the triggering Opponent in your Melee Range through the effects of the Dragon Dash Unique Ability, you may use the Basic Attack Maneuver as an Out-of-Sequence Maneuver. If you do, you may apply the Knockback Advantage to that Attacking Maneuver if it does not already possess it."
      },
      {
        id: "z_burst_dash",
        name: "Z-Burst Dash",
        prerequisites: "N/A",
        tpCost: 5,
        effect: "Instead of moving in a straight line towards an Opponent through the effects of the Dragon Dash, you can instead choose to move your Character to any Square within that Opponent's Melee Range. You cannot move to a Square that is further away than twice the number of Squares you would be able to move with your Boosted Speed."
      },
      {
        id: "spread_shot_retreat",
        name: "Spread Shot Retreat",
        prerequisites: "N/A",
        tpCost: 10,
        effect: "If you move away from the triggering Opponent through the effects of the Dragon Dash Advancement, you may use the Basic Attack Maneuver as an Out-of-Sequence Maneuver. If you do, you cannot Ki Wager on this Attacking Maneuver, but that Attacking Maneuver gains either (you decide when making the Attacking Maneuver): 2 ranks of the Long Shot Advantage. The Condition Advantage – but you must choose either Shaken or Oblivious for the Combat Condition to apply."
      }
    ],
    restrictions: []
  },

  // ── 7. Down Burst ──────────────────────────────────────────────────────
  down_burst: {
    id: "down_burst",
    name: "Down Burst",
    abilityType: "Technical",
    prerequisites: "Force or Magic Score of 4+, 2+ Skill Ranks in Concealment",
    tpCost: 10,
    kpCost: "4(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "Increase your Skill Bonus for your Bluff and Concealment Skills by 1.",
    effect: "Make a Clash (Impulsive) against all Opponents within a Minor Sphere AoE (centered on you). If you win against an Opponent, that Opponent gains the Oblivious Combat Condition against you until the end of their next turn or until you hit them with an Attacking Maneuver (whichever occurs first). If you win against all Opponents in the AoE, you may use the Movement Maneuver as an Out-of-Sequence Maneuver. This use of the Movement Maneuver does not trigger the Exploit Maneuver.",
    advancements: [
      {
        id: "ki_deception",
        name: "Ki Deception",
        prerequisites: "2+ Skill Ranks in Bluff",
        tpCost: 10,
        effect: "Instead of the Movement Maneuver, you may use the Basic Attack Maneuver through the effects of Down Burst. If you do, and the Attacking Maneuver targets only one Opponent, make a Clash (Bluff vs Perception/Clairvoyance) against that Opponent. If you win, apply an Energy Charge to that Attacking Maneuver."
      }
    ],
    restrictions: []
  },

  // ── 8. Energy Drain ────────────────────────────────────────────────────
  energy_drain: {
    id: "energy_drain",
    name: "Energy Drain",
    abilityType: "Magical",
    prerequisites: "Magic Score of 8+, Insight Score of 6+, 3+ Skill Ranks in the Use Magic Skill, 2+ Skill Ranks in the Clairvoyance Skill",
    tpCost: 20,
    kpCost: "6(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "Gain access to the Power Drain Special Maneuver.",
    effect: "Target a Character within 8 Squares of you. Make a Clash (Cognitive vs Cognitive/Corporeal) against that target. If you win, roll a Magical Wound Roll but do not reduce their Life Points by that amount. Instead, reduce their Ki Points by that amount and regain Ki Points equal to the total amount of Ki Points lost by the target.",
    advancements: [
      {
        id: "energy_absorption",
        name: "Energy Absorption",
        prerequisites: "Insight Score of 12+",
        tpCost: 10,
        effect: "If you are targeted by an Energy or Magic Attack, you may spend 1 Counter Action to use the Energy Drain Unique Ability as a Counter Maneuver, but you must target the Character who targeted you with this Attacking Maneuver and for each Energy Charge applied to that Attacking Maneuver, reduce the Natural Result of your roll by 1. If you win the Clash for Energy Drain, instead of applying the usual effects, you are treated as if you deflected the Attacking Maneuver, but the Character that used the Attacking Maneuver makes an Urgent Wound Roll for that Attacking Maneuver as if you were hit and you regain Ki Points equal to 1/2 of the Dice Score. Additionally, if you regain Ki Points that equal or exceed 1/5 of your Maximum Ki Points through this effect, you may use the Power Up Maneuver as an Out-of-Sequence Maneuver."
      },
      {
        id: "greater_absorption",
        name: "Greater Absorption",
        prerequisites: "Magic Score of 14+",
        tpCost: 6,
        effect: "Increase the Dice Score of your Magical Wound Roll through the effects of Energy Drain by 1d6(T)."
      },
      {
        id: "stress_eater",
        name: "Stress Eater",
        prerequisites: "Personality Score of 8+",
        tpCost: 10,
        effect: "If you win the Clash for the effects of Energy Drain, that Character has their Stress Test Dice Score reduced by 2 until the end of their next turn. This effect cannot stack."
      }
    ],
    restrictions: []
  },

  // ── 9. Extra Arms ──────────────────────────────────────────────────────
  extra_arms: {
    id: "extra_arms",
    name: "Extra Arms",
    abilityType: "Technical/Magical",
    prerequisites: "Agility Score 6+, Insight Score 5+",
    tpCost: 12,
    kpCost: "6(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "While in the Mindful, Multiple Arms, or Surging State, increase your Strike Rolls by 1(T).",
    effect: "Enter the Multiple Arms Special State or leave it if you are already in it. If you do, you must pay the KP Cost of this Unique Ability at the start of each of your turns or leave the Multiple Arms State.",
    advancements: [
      {
        id: "hundred_arm_technique",
        name: "100 Arm Technique",
        prerequisites: "Agility Score of 8+",
        tpCost: 4,
        effect: "While in the Multiple Arms Special State, increase your Strike Rolls by 1(T) when using the Combination or Rapid Fire Profiles."
      },
      {
        id: "four_witches_grip",
        name: "Four Witches Grip",
        prerequisites: "Insight Score of 6+",
        tpCost: 4,
        effect: "While in the Multiple Arms Special State, increase all of your Grapple Checks made as the Grappler by 1(T)."
      }
    ],
    restrictions: []
  },

  // ── 10. Fake Moon ──────────────────────────────────────────────────────
  fake_moon: {
    id: "fake_moon",
    name: "Fake Moon",
    abilityType: "Technical/Magical",
    prerequisites: "Force or Magic Score 4+",
    tpCost: 10,
    kpCost: "6(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "Increase your Dodge Rolls while in the Great Ape Transformation Line by 1(T).",
    effect: "Create a False Moon. A False Moon acts as a full moon for the effects of any Traits. If you are a Saiyan with access to any Transformation in the Great Ape Transformation Line, you may use the Transformation Maneuver to enter a Transformation from that Transformation Line as an Out-of-Sequence Maneuver. A False Moon lasts for 5 Combat Rounds, after which it will disappear and any Saiyan in the Oozaru or Golden Oozaru Transformations will suffer from Stress Exhaustion until the end of their next turn. A False Moon is a Feature that does not exist on the Battlemap, but can be targeted by any Energy or Magic Attack that does not possess an AoE. A False Moon does not possess a Hardness Value but possesses Damage Reduction equal to the Might of the Character who created it and an amount of Life Points equal to 10x their Might. If a False Moon's Life Points reach 0, it is destroyed and you apply the effects as if it disappeared (seen above). Only one False Moon can exist at a time.",
    advancements: [
      {
        id: "lasting_moon",
        name: "Lasting Moon",
        prerequisites: "Force or Magic Score of 8+",
        tpCost: 5,
        effect: "Triple the number of Combat Rounds your False Moon remains in the Combat Encounter."
      }
    ],
    restrictions: []
  },

  // ── 11. Flooding Technique ─────────────────────────────────────────────
  flooding_technique: {
    id: "flooding_technique",
    name: "Flooding Technique",
    abilityType: "Magical",
    prerequisites: "N/A",
    tpCost: 15,
    kpCost: "6(T)",
    maneuverType: "Standard",
    actionCost: "2 Actions",
    passiveBonus: "While in the Underwater Battle Environment, increase your Combat Rolls by 1(T).",
    effect: "Within a Large Sphere AoE (centered on you), the Battle Environment becomes Underwater. If you move to another Square due to any effect, the AoE containing this Battle Environment moves the exact same distance and in the same direction. You cannot use this Unique Ability while it is active, and must pay the Ki Point Cost of this Unique Ability at the start of each of your turns or return the Battle Environment to what it would normally be. You may return the Battle Environment to normal as an Instant Action.",
    advancements: [],
    restrictions: []
  },

  // ── 12. Forced Spirit Fission ──────────────────────────────────────────
  forced_spirit_fission: {
    id: "forced_spirit_fission",
    name: "Forced Spirit Fission",
    abilityType: "Technical/Magical",
    prerequisites: "Force or Magic Score 10+, Spirit Control, Tier of Power 3+",
    tpCost: 30,
    kpCost: "6(T)",
    maneuverType: "Instant",
    actionCost: "N/A",
    passiveBonus: "Increase Z by 1 for all effects of Spirit Control.",
    effect: "Until the end of your turn, all of your Attacking Maneuvers have the following benefits: Ki Reduction: Reduce the Ki Points of anyone hit by your Attacking Maneuvers by 1/4 (rounded up) of your Might. Lifeforce: Any Opponent hit by your Attacking Maneuvers loses 1 Lifeforce. If your Attacking Maneuver has a Ki Wager of 10(bT) or more and hits any of the qualifying Characters below, make a Clash (Cognitive) against them. If you win, apply the effects listed below. A Fused Character: They split into their components, following the rules as if their fusion ended normally. A Character in the FK State: The Linked Characters exit the FK State. A Character benefiting from Absorption: Eject an Absorbed Character of your choice. A Character benefiting from Possession: Eject the Parasite. Primary Character of a Unification: Remove a Secondary Character of your choice, placing them on an adjacent Square. The Primary Character loses the benefits of Unification from that Secondary Character.",
    advancements: [],
    restrictions: []
  },

  // ── 13. God Meteor ─────────────────────────────────────────────────────
  god_meteor: {
    id: "god_meteor",
    name: "God Meteor",
    abilityType: "Technical/Magical",
    prerequisites: "Force or Magic Score 10+, access to the God Ki Special State and/or Gravity Manipulation, Tier of Power 4+",
    tpCost: 40,
    kpCost: "18(T)",
    maneuverType: "Standard",
    actionCost: "3 Actions",
    passiveBonus: "Increase your Wound Rolls by 1(T) while in the God Ki State, or against Pinned Characters if you are not in the God Ki State.",
    effect: "Target a Square on the Battlefield. Every Character (except the user of this Unique Ability) within a Destructive Sphere AoE centered on your targeted Square enters the Meteor Phase, wherein a gigantic meteor falls from the heavens onto those Characters. Once the Meteor Phase starts, all combat stops and every Character within the Meteor Phase must choose to Defend or Attack: Those who Defend will reduce the Damage they take by 1/2. Those who Attack can use the Basic Attack Maneuver or Signature Attack Maneuver as an Out-of-Sequence Action, but they must target the Meteor in order of their place in the Initiative Order. No Character can miss the Meteor with this Attacking Maneuver, but they can only Ki Wager up to 1/2 of their Max Capacity. The God Meteor's Life Points are equal to 3/4 of the user's Maximum Life Points and it possesses Damage Reduction equal to the user's Might. If the Life Points of the God Meteor reaches 0, it is destroyed and no Character in the Meteor Phase will receive any damage. After all decisions and Attacking Maneuvers are made, the Meteor Phase ends. If the God Meteor is not destroyed by the end of the Meteor Phase, all Combatants that were within the Meteor Phase have their Life Points reduced by the remaining Life Points of the God Meteor. You can only use this Unique Ability while in a Transformation with a Tier of Power Requirement of 4 or higher. This Unique Ability can only be used once per Combat Encounter.",
    advancements: [],
    restrictions: []
  },

  // ── 14. Gravity Manipulation ───────────────────────────────────────────
  gravity_manipulation: {
    id: "gravity_manipulation",
    name: "Gravity Manipulation",
    abilityType: "Magical",
    prerequisites: "Force or Magic Score 10+",
    tpCost: 20,
    kpCost: "9(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "While you have 2+ stacks of Power, increase your Might by 1(T).",
    effect: "Target an Opponent who is not at Long Range. Make a Might Clash against that Opponent. Their Defense Value is reduced by 1(T) until the start of your next turn and, if you win, they are knocked Prone. If your Opponent tries to end the Prone Condition through any means, they must make a Might Clash against you. They can only leave the Prone condition if they win. If you target an already Prone Opponent with Gravity Manipulation, instead reduce their Life Points by 2x your Might. You are not required to make a Might Clash against them to apply this effect. For every turn after the first that an Opponent ends with the Prone Combat Condition through the effects of your Gravity Manipulation, increase the Dice Score of their Might Clash through the effects of Gravity Manipulation by 1(T) – using their Tier of Power to calculate this bonus. You cannot target another Character with Gravity Manipulation if an Opponent is already Prone due to the effects of your usage of Gravity Manipulation.",
    advancements: [
      {
        id: "gravity_cage",
        name: "Gravity Cage",
        prerequisites: "Force or Magic Score 14+",
        tpCost: 6,
        effect: "If an Opponent is knocked Prone through the effects of Gravity Manipulation, spend 5(T) Ki Points to reduce their Life Points by your Might."
      },
      {
        id: "gravity_barrage",
        name: "Gravity Barrage",
        prerequisites: "Tier of Power 3+ and +1 Tier of Power for each time you gain this Advancement.",
        tpCost: 8,
        effect: "You may use this Unique Ability an additional time per each Combat Round. You can gain this Advancement up to 2 times."
      },
      {
        id: "gravity_fist",
        name: "Gravity Fist",
        prerequisites: "Insight Score 8+",
        tpCost: 10,
        effect: "If you successfully knock an Opponent Prone through the Gravity Manipulation Magical Ability, you may make a Basic Attack Maneuver against that Opponent as an Out-of-Sequence Maneuver. This effect can only be used once per Combat Round, even if you have the Gravity Barrage Advancement."
      },
      {
        id: "gravity_burst",
        name: "Gravity Burst",
        prerequisites: "Gravity Cage, Insight Score 12+, Tier of Power 4+",
        tpCost: 15,
        effect: "Increase your Might by 2(T) when using any effect of the Gravity Manipulation Unique Ability or its Advancements. This effect also applies to any Might Clashes made against Pinned characters who are Pinned due to the effects of your usage of Gravity Manipulation."
      },
      {
        id: "wide_spread_gravity",
        name: "Wide-Spread Gravity",
        prerequisites: "Insight Score 10+",
        tpCost: 6,
        effect: "Instead of targeting a single Opponent, target a Square. All Opponents within a Sphere AoE (centered on that Square) are targeted by the effects of the Gravity Manipulation Unique Ability. You can take this Advancement up to 4 times – for each time it's taken after the first, increase the Magnitude of the AoE by 1. For each time it's taken, increase the Insight Score Prerequisite by 2 and the TP Cost by 2."
      }
    ],
    restrictions: []
  },

  // ── 15. Hakai ──────────────────────────────────────────────────────────
  hakai: {
    id: "hakai",
    name: "Hakai",
    abilityType: "Technical",
    prerequisites: "Access to Power of Destruction – this Prerequisite cannot be ignored through any effect other than those of this Unique Ability",
    tpCost: 22,
    kpCost: "14(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "Increase your Force and Magic Modifiers by 1(T).",
    effect: "You may either: Destroy a Feature. If you do, make a Clash (Cognitive vs Impulsive) against all Characters within a Minor Sphere AoE of that Feature. If you win, reduce their Life Points by 5x the Collision Damage they would suffer from colliding with that Feature. If you lose, reduce their Life Points by the Collision Damage they would suffer from colliding with that Feature. For every Square that Feature occupied, increase the Magnitude of this effect's AoE by 1. Target a Weapon or piece of Apparel equipped by an Opponent. Make a Clash (Cognitive vs Impulsive). If you win, the Item is destroyed and the Character who had it equipped reduces their Life Points by 2x your Might. Destroy an Item not currently held or equipped by any other Character, bypassing any usual requirements. This even allows you to destroy Items with the Unbreakable Special Quality. Target a Character within a Minor Sphere AoE (centered on you) who has a lower base Tier of Power than you. They are erased from existence unless they spend 2 Karma Points to avoid the effect. You can only choose to use this effect once per Combat Encounter. Target an Opponent within a Minor Sphere AoE (centered on you). Use the Basic Attack Maneuver to use an Attacking Maneuver of the Simple, Sphere, or Spell Profile against them. Double the Wound Roll and also reduce their Maximum Life Points by any Damage they receive. At the end of a Combat Encounter, any affected Characters have their Maximum Life Points returned to normal. If a Character has their Maximum Life Points reduced to 0 by this effect, they are erased from existence. This Unique Ability can be obtained through the Advanced Learner Talent, ignoring any Prerequisites. If you do, you can only use the last option and you only increase your Wound Roll by 1/2 instead of doubling it.",
    advancements: [
      {
        id: "divine_destruction",
        name: "Divine Destruction",
        prerequisites: "Force or Magic Score 18+",
        tpCost: 2,
        effect: "Increase the amount of Life Points lost through any effect of Hakai by 1(T). You can gain this Advancement any number of times. Each time you gain this Advancement, increase the Technique Point Cost for future instances of this Advancement by 2."
      },
      {
        id: "improved_destruction",
        name: "Improved Destruction",
        prerequisites: "Force or Magic Score 20+",
        tpCost: 4,
        effect: "Increase the Magnitude of all AoEs in the effects of Hakai. This Advancement can be gained 4 times."
      }
    ],
    restrictions: []
  },

  // ── 16. Healing Hands ──────────────────────────────────────────────────
  healing_hands: {
    id: "healing_hands",
    name: "Healing Hands",
    abilityType: "Magical",
    prerequisites: "2+ Skill Ranks in Use Magic",
    tpCost: 10,
    kpCost: "5(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "Increase your Medicine Skill Checks by 1.",
    effect: "Target a Character within your Melee Range. That Character regains 1d10(bT) Life Points. Increase the amount of Life Points they regain by your Magic Modifier.",
    advancements: [
      {
        id: "healing_expertise",
        name: "Healing Expertise",
        prerequisites: "Magic Score of 8+",
        tpCost: 6,
        effect: "Increase the amount of Life Points restored by the Healing Hands Unique Ability by 1d10(bT)."
      },
      {
        id: "overexertion",
        name: "Overexertion",
        prerequisites: "Personality Score of 4+",
        tpCost: 5,
        effect: "When you target a Character with Healing Hands, you may use that target's Tier of Power when calculating the KP Cost and amount of Life Points regained."
      },
      {
        id: "desperate_heal",
        name: "Desperate Heal",
        prerequisites: "Overexertion",
        tpCost: 10,
        effect: "When you target a Character with Healing Hands, you may spend a number of Ki Points equal to your current Capacity, if you do, increase the amount of Life Points the target regains by an equal amount. If you possess the Energy Zone Advancement, this effect can only apply to ONE of the targets."
      },
      {
        id: "energy_zone",
        name: "Energy Zone",
        prerequisites: "Magic Score of 10+",
        tpCost: 10,
        effect: "Instead of targeting a Character within your Melee Range, you may target all Allies within a Large Sphere AoE (centered on you) for the effects of Healing Hands."
      },
      {
        id: "patch_up",
        name: "Patch-Up",
        prerequisites: "Magical Materialization",
        tpCost: 4,
        effect: "If you would target a Character with the Healing Hands Magical Ability, you may also repair their Apparel. Restore a damaged or broken piece of Apparel to have their maximum Break Value."
      }
    ],
    restrictions: []
  },

  // ── 17. Illusion ───────────────────────────────────────────────────────
  illusion: {
    id: "illusion",
    name: "Illusion",
    abilityType: "Magical",
    prerequisites: "Magic Score of 4+",
    tpCost: 7,
    kpCost: "4(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "Increase your Bluff Skill Checks by 1.",
    effect: "Target a Square within 8 Squares of you. Create a Sphere AoE centered on that Square. This is known as the Illusionary Space – a space in which you have created any Illusion you desire; your ARC may give special benefits due to these illusions such as inflicting a Combat Condition on Opponents in there. Any Opponents within the Illusionary Space have their Defense Value reduced by 1(T). At the start of your turn, you must pay the KP Cost for Illusion or lose your Illusionary Space. When you do pay the KP Cost to maintain your Illusionary Space, you may move it to center on a different Square. You can remove your Illusionary Space as an Instant Maneuver and you can only possess one Illusionary Space at any one time. Using this Unique Ability while your Illusionary Space is still there lets you move it to center on a different Square.",
    advancements: [
      {
        id: "expanded_illusion",
        name: "Expanded Illusion",
        prerequisites: "Magic Score of 8+",
        tpCost: 7,
        effect: "You only pay 1/2 of the KP Cost for Illusion to maintain it and increase the Magnitude of the Illusionary Space by 2 Magnitudes."
      },
      {
        id: "combat_illusion",
        name: "Combat Illusion",
        prerequisites: "Insight Score of 8+",
        tpCost: 6,
        effect: "At the start of any Opponent's turn, if they are in the Illusionary Space, make a Clash (Use Magic vs Perception/Clairvoyance) against them. If you win, that Opponent gains the Oblivious Combat Condition until the start of their next turn."
      }
    ],
    restrictions: []
  },

  // ── 18. Illusion Smash ─────────────────────────────────────────────────
  illusion_smash: {
    id: "illusion_smash",
    name: "Illusion Smash",
    abilityType: "Magical",
    prerequisites: "Portal Creation",
    tpCost: 10,
    kpCost: "3(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: null,
    effect: "Target an Opponent, you can make a Basic Attack Maneuver against that Opponent as an Out-of-Sequence Maneuver. If you do, treat them as if they were on a Square adjacent to you for this Attacking Maneuver. Ignore the second effect of Giant Strike for this Attacking Maneuver and this Attacking Maneuver cannot possess an AoE.",
    advancements: [
      {
        id: "combo_portal",
        name: "Combo Portal",
        prerequisites: "Insight Score of 10+",
        tpCost: 6,
        effect: "If you move an Opponent with an effect, you may use Illusion Smash as an Instant Maneuver. If you do, you can only target the Opponent you moved with the Basic Attack Maneuver used through Illusion Smash. Additionally, this Attacking Maneuver may gain the Knockback Advantage."
      },
      {
        id: "portal_control",
        name: "Portal Control",
        prerequisites: "N/A",
        tpCost: 8,
        effect: "Instead of targeting an Opponent, you may target any Character with the effects of Illusion Smash and, instead of using an Attacking Maneuver, may use any Maneuver with an Action Cost of 1 that targets another Character as if that Character was in your Melee Range. If you would use the Grapple Maneuver through this effect and successfully enter a Grapple as a result, move the Grappled Character into your Melee Range on an unoccupied Square of your choice."
      },
      {
        id: "smash_barrage",
        name: "Smash Barrage",
        prerequisites: "Insight Score of 14+",
        tpCost: 10,
        effect: "When using a Profile that does not possess an AoE through the Basic Attack Maneuver used through the effects of Illusion Smash, you may target up to 3 Opponents with that Attacking Maneuver simultaneously."
      }
    ],
    restrictions: []
  },

  // ── 19. Instant Transmission ───────────────────────────────────────────
  instant_transmission: {
    id: "instant_transmission",
    name: "Instant Transmission",
    abilityType: "Technical/Magical",
    prerequisites: "2+ Skill Ranks in the Clairvoyance Skill, Spirit Control",
    tpCost: 15,
    kpCost: "4(T)",
    maneuverType: "Instant",
    actionCost: "N/A",
    passiveBonus: "Increase the bonus to your Defense Value from the Afterimage Technique Unique Ability by 1(T).",
    effect: "Target one Character you can sense through the Clairvoyance Skill. Make a Skill Clash (Clairvoyance vs Concealment) against them. If you win, you can instantly place yourself on a Square within their Melee Range. When you use this Unique Ability, you can make a Clash (Physical Strike vs Strike/Dodge) against any number of Characters within your Melee Range. If you win, they are immediately brought with you to your chosen location, instantly being placed on a Square within your Melee Range after you have arrived at your Square. If you use Instant Transmission within a Grapple, you must target the other Character within the Grapple, and if the other Character wins the Clash, the Grapple immediately ends and the Grappled Character is freed. If you are exceptionally far from your target, your ARC may need you to make a Clairvoyance Skill Check to perceive their energy. The target can use the Power Up Maneuver and/or a Transformation Maneuver to reduce the Difficulty Category of this Clairvoyance Skill Check by 1 for each stack of Power they possess and by an additional reduction amount equal to their Transformation's Tier of Power Requirement.",
    advancements: [
      {
        id: "combat_transmitter",
        name: "Combat Transmitter",
        prerequisites: "Agility Score 8+",
        tpCost: 3,
        effect: "Instead of targeting another Character, target a square that is within a Destructive Sphere AoE (centered on you) to move through the effects of Instant Transmission. You do not need to make a Skill Clash."
      },
      {
        id: "masterful_combat_transmitter",
        name: "Masterful Combat Transmitter",
        prerequisites: "Combat Transmitter, Insight Score 8+",
        tpCost: 10,
        effect: "If you enter an Opponent's Melee Range through the effects of Instant Transmission, you may use the Basic Attack Maneuver as an Out-of-Sequence Maneuver."
      },
      {
        id: "surprising_combat_transmitter",
        name: "Surprising Combat Transmitter",
        prerequisites: "Combat Transmitter, Insight Score 8+",
        tpCost: 8,
        effect: "If you use the Instant Transmission Unique Ability to enter an Opponent's Melee Range while you are suffering from the effects of the Energy Charge Maneuver, and your next Maneuver this Combat Round is to use the declared Attacking Maneuver for that Energy Charge Maneuver, your Opponent suffers from the Guard Down Combat Condition against that Attacking Maneuver. That Attacking Maneuver must have three or more Energy Charges to apply this effect. You can only use the effects of Surprising Combat Transmitter once per Combat Encounter."
      },
      {
        id: "defensive_combat_transmitter",
        name: "Defensive Combat Transmitter",
        prerequisites: "Combat Transmitter, Quick Transmitter",
        tpCost: 10,
        effect: "If an Ally is targeted by an Attacking Maneuver, you may use Instant Transmission twice in sequence as a pair of Out-of-Sequence Maneuvers by spending 1 Counter Action. If you do, the first use of Instant Transmission must be to move to a Square adjacent to that Ally and the second use of Instant Transmission must be to move to another Character within this Combat Encounter. If you successfully move the Ally targeted by an Attacking Maneuver through this effect, the Attacking Maneuver continues as if they missed your Ally rather than applying Instantaneous Control. Any effects that would occur upon missing an Attacking Maneuver (except the Homing Advantage) do not apply and any Ki Points spent on a Ki Wager for that Attacking Maneuver are regained (unless the Attacking Maneuver possesses the Homing Advantage). You can only use the effects of Defensive Combat Transmitter once per Combat Encounter."
      },
      {
        id: "quick_transmitter",
        name: "Quick Transmitter",
        prerequisites: "Tier of Power 3+ and +1 Tier of Power for each time you gain this Advancement.",
        tpCost: 8,
        effect: "You may use this Unique Ability an additional time per each Combat Round. You can gain this Advancement up to 3 times."
      },
      {
        id: "spirit_transporter",
        name: "Spirit Transporter",
        prerequisites: "4+ Skill Ranks in Clairvoyance, Insight Score 12+",
        tpCost: 8,
        effect: "Make a Clash (Cognitive vs Impulsive) against your targeted Character. If you win, instead of moving yourself, move your targeted Character to an adjacent Square next to you."
      }
    ],
    restrictions: []
  },

  // ── 20. Ki Flames ──────────────────────────────────────────────────────
  ki_flames: {
    id: "ki_flames",
    name: "Ki Flames",
    abilityType: "Technical",
    prerequisites: "Force Score 15+",
    tpCost: 15,
    kpCost: "8(T)",
    maneuverType: "Standard",
    actionCost: "2 Actions",
    passiveBonus: "While you have 2+ stacks of Power, increase your Wound Rolls by 1(T).",
    effect: "Use the Power Up Maneuver as an Out-of-Sequence Maneuver. Then, every Square within a Destructive AoE (centered on you) becomes Burned. Burned Squares reduce the Life Points of all Characters (other than you) who are upon them by 1/4 (rounded up) of your Might at the start of their turns and, if they do, they must make a Might Clash against you. If you win, reduce their Combat Rolls by 1(T) until the start of their next turn. If a square would be Burned by this Unique Ability while it is already Burned, ignore the original effect that Burned that square and apply the new effect that would create a Burned square. Burned Squares last for 3 Combat Rounds.",
    advancements: [],
    restrictions: []
  },

  // ── 21. Lullaby Fist ───────────────────────────────────────────────────
  lullaby_fist: {
    id: "lullaby_fist",
    name: "Lullaby Fist",
    abilityType: "Technical/Magical",
    prerequisites: "2+ Skill Ranks in Bluff and Use Magic",
    tpCost: 12,
    kpCost: "8(T)",
    maneuverType: "Standard",
    actionCost: "2 Actions",
    passiveBonus: null,
    effect: "Target a Character within a Large Sphere AoE (centered on you). Make a Clash (Cognitive vs Corporeal/Impulsive/Cognitive/Morale) against that Opponent. If you win, they gain the Sleeping Combat Condition.",
    advancements: [],
    restrictions: []
  },

  // ── 22. Mafuba ─────────────────────────────────────────────────────────
  mafuba: {
    id: "mafuba",
    name: "Mafuba",
    abilityType: "Technical",
    prerequisites: "Force or Magic Score of 3+, Insight Score of 6+",
    tpCost: 22,
    kpCost: "12(T)",
    maneuverType: "Standard",
    actionCost: "2 Actions",
    passiveBonus: null,
    effect: "Target an Opponent who is not at Long Range. Make a Clash (Cognitive vs Impulsive/Corporeal) against them. If you win, they gain the Shaken Combat Condition until the start of your next turn, and you may make an additional Might Clash against them. If you win this Clash, target a Basic Item that can be used for the Mafuba. They are sealed in the container until the end of your next turn, unless you apply a Sealing Talisman (or use the effects of a Sealing Bottle), in which case they are sealed indefinitely. If you score a Natural Result of 1 on the Might Clash, destroy the container. A Character sealed by the Mafuba is removed from the Combat Encounter and cannot take any Actions, as they are sealed away within a container. If they would return to the Combat Encounter, they do not roll another Initiative Check but rather regain their previous Initiative. After using the Mafuba Unique Ability, reduce your Life Points by 5x the Might of your target – regardless of any results.",
    advancements: [],
    restrictions: []
  },

  // ── 23. Magical Enhancement ────────────────────────────────────────────
  magical_enhancement: {
    id: "magical_enhancement",
    name: "Magical Enhancement",
    abilityType: "Magical",
    prerequisites: "Magic Score of 6+",
    tpCost: 10,
    kpCost: "4(T)",
    maneuverType: "Standard",
    actionCost: "Variable (1~2)",
    passiveBonus: null,
    effect: "Target an Ally within 8 Squares of you. That Ally gains a stack of Power for each Action spent on this Maneuver until the end of their turn.",
    advancements: [],
    restrictions: []
  },

  // ── 24. Magical Materialization ────────────────────────────────────────
  magical_materialization: {
    id: "magical_materialization",
    name: "Magical Materialization",
    abilityType: "Magical",
    prerequisites: "2+ Skill Ranks in Use Magic",
    tpCost: 10,
    kpCost: "6(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: null,
    effect: "Select either a Basic Item that does not have the [Tech] tag, a piece of Apparel, or a Weapon. Roll the Craft Skill Check for your choice, using the Use Magic Skill instead of the relevant Craft Specialization, but increase the Difficulty Category by 1. If you fail, you do not create the item, but you still lose the Ki Points. If you succeed, you create the selected Item. The created item is either made in your hand, or in a Square within your Melee Range.",
    advancements: [
      {
        id: "weapon_summoner",
        name: "Weapon Summoner",
        prerequisites: "Insight Score 8+",
        tpCost: 5,
        effect: "You automatically succeed each Use Magic Skill Check to make a Weapon. You can dismiss any Weapon you've created with Magical Materialization as an Instant Maneuver OR as part of Magical Materialization in addition to its other effects."
      },
      {
        id: "power_builder",
        name: "Power Builder",
        prerequisites: "Force Score 4+",
        tpCost: 2,
        effect: "When making a Use Magic Skill Check for the effects of Magical Materialization, you may use your Force Score instead of your Magic Score for the Use Magic Skill's Skill Bonus."
      },
      {
        id: "world_builder",
        name: "World Builder",
        prerequisites: "Force or Magic Score 8+",
        tpCost: 4,
        effect: "You may create a Feature through the effects of Magical Materialization. Make a Qualified Use Magic Skill Check. On a success, you create the Feature within a Sphere AoE, centered on yourself. Features created through Magical Materialization have a default Hardness Value of 0, and cover a number of squares up to twice your ranks in Use Magic, in whatever shape you designate. For every Difficulty Category you pass after Qualified, increase the Hardness Value of that piece of terrain by 1, up to a maximum Hardness Value of 2. You can gain this Advancement twice. Selecting World Builder a second time increases the Maximum Hardness Value of Features by 1, and the default Hardness Value of created Features to 1."
      },
      {
        id: "mass_construction",
        name: "Mass Construction",
        prerequisites: "Force or Magic Score 8+, World Builder",
        tpCost: 3,
        effect: "You can make a number of Features equal to 1/2 your Might. For each Feature you make after the first, increase the Ki Point cost of Magical Materialization by 1(T)."
      },
      {
        id: "projectile_materialization",
        name: "Projectile Materialization",
        prerequisites: "Insight Score 4+",
        tpCost: 2,
        effect: "Target a willing Ally within a Sphere AoE (centered on you). If you succeed on the Skill Check for Magical Materialization to create an Accessory, Apparel, or Weapon, the targeted Ally gains that item. If it was a piece of Apparel or an Accessory, they may replace one layer of Apparel or Accessory they are currently wearing, or equip it as an additional item (they decide)."
      },
      {
        id: "restrictive_weights",
        name: "Restrictive Weights",
        prerequisites: "Projectile Materialization",
        tpCost: 6,
        effect: "You may target an Opponent with the effects of Projectile Materialization, but you may only create Weights. Make a Clash (Cognitive vs Impulsive) against the targeted Opponent. If they win, your selected Weights are created on a Square adjacent to that Opponent. If you win, that opponent automatically equips the Weights you created as their top layer of Apparel (this can allow them to wear 4 layers of Apparel). These Weights do not give a Doff Bonus once removed."
      },
      {
        id: "dematerialize",
        name: "Dematerialize",
        prerequisites: "Scholarship or Magic Score 7+",
        tpCost: 6,
        effect: "You may forgo Magical Materialization's effect to target an item created through Magical Materialization within your Melee Range and destroy it."
      },
      {
        id: "magic_crafter",
        name: "Magic Crafter",
        prerequisites: "Scholarship or Insight Score of 4+",
        tpCost: 5,
        effect: "Do not increase the Difficulty Category for the Use Magic Skill Check of Magical Materialization."
      }
    ],
    restrictions: []
  },

  // ── 25. Manipulation Sorcery ───────────────────────────────────────────
  manipulation_sorcery: {
    id: "manipulation_sorcery",
    name: "Manipulation Sorcery",
    abilityType: "Magical",
    prerequisites: "Evil/Pure Evil Z-Soul, Magic Score of 7+",
    tpCost: 22,
    kpCost: "15(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "You can use the Mind Control Unique Ability against a Character with the Majin Mark Manifested Power or Karmic Empowerment Manifested Power as an Instant Maneuver.",
    effect: "Target a Character who does not possess the Pure Good Z-Soul. Make a Clash (Cognitive vs Cognitive/Morale) against them. If you win, they gain the Majin Mark or a stack of the Karmic Empowerment Manifested Power, become your Ally, and have their Cognitive Saves reduced by 1(T) in any Clashes against you while possessing that Manifested Power. If your Life Points and/or Ki Points reach 0 at any point, the targets of Manipulation Sorcery become free from your control and lose the Majin Mark or a stack of the Karmic Empowerment Manifested Power. You cannot target yourself with Manipulation Sorcery, and can only use it on a number of Characters equal to or less than your base Tier of Power. You can only target a Character with this Unique Ability once. Even if you are in a different Combat Encounter, if you have targeted a Character with this Unique Ability previously, you cannot use it against them again.",
    advancements: [],
    restrictions: []
  },

  // ── 26. Metamoran Fusion Dance ─────────────────────────────────────────
  metamoran_fusion_dance: {
    id: "metamoran_fusion_dance",
    name: "Metamoran Fusion Dance",
    abilityType: "Technical",
    prerequisites: "2+ Skill Ranks in Performance",
    tpCost: 15,
    kpCost: "N/A",
    maneuverType: "Standard",
    actionCost: "3 Actions",
    passiveBonus: "Increase your Performance Skill Checks by 1.",
    effect: "Target an Ally within your Melee Range who is of the same Power Level as you and within 1 Size Category of you until the start of your next turn. For each stack of Holding Back a Character possesses, treat their Power Level as if it was 1 lower for this effect. If that Ally also targets you with the Metamoran Fusion Dance, both Characters make a Performance Skill Check with a Difficulty Category of Master. If you are not the same Size Category as your target, increase the Performance Skill Check's Difficulty Category by 1 for both Characters. Gain the following benefits depending on the results of both Characters: Both Succeed: Both Characters combine using the Metamoran Fusion Method. Both Fail: Nothing happens. One Succeeds, One Fail: Both Characters combine using the Metamoran Fusion Method but roll a 1d4, if the result is 2~4 the Fusion becomes Plump, and if your result is a 1, the Fusion becomes Frail.",
    advancements: [
      {
        id: "ultra_fusion",
        name: "Ultra Fusion",
        prerequisites: "N/A",
        tpCost: 30,
        effect: "Instead of targeting a single Ally through the effects of the Metamoran Fusion Dance, you may target 4 Allies instead. Those Allies may be within a Large Sphere AoE (centered on you) instead of being within your Melee Range. If you target 4 Allies with the Metamoran Fusion Dance, the other Characters do not need to also target you with the Metamoran Fusion Dance, can have a different Power Level than you, and all Characters combine using the Metamorese Fusion Method immediately without making a Performance Skill Check. If this effect is used, the Round Limit for the Fusion Method is reduced to 2 Combat Rounds, but cannot be reduced regardless of any Transformations entered by this Fusion."
      }
    ],
    restrictions: []
  },

  // ── 27. Mind Control ───────────────────────────────────────────────────
  mind_control: {
    id: "mind_control",
    name: "Mind Control",
    abilityType: "Magical",
    prerequisites: "Evil/Pure Evil Z-Soul",
    tpCost: 20,
    kpCost: "12(T)",
    maneuverType: "Standard",
    actionCost: "2 Actions",
    passiveBonus: null,
    effect: "Target an Opponent and make a Clash (Cognitive vs Cognitive/Morale) against them. If you win, they gain the Compelled Combat Condition against a target of your choice. If you lose, you can't target this Character again with the Mind Control Unique Ability for the rest of the Combat Encounter. When you target an Opponent with the Majin Mark or Karmic Empowerment Manifested Powers, you may spend an additional Action. If you win the Clash for this Unique Ability, make that Character use one of their Actions for any Maneuver you know they have access to (you can also choose the targets). This Maneuver does not count towards the required Attacking Maneuvers for the Mind Control Unique Ability.",
    advancements: [],
    restrictions: []
  },

  // ── 28. Mind Reading ───────────────────────────────────────────────────
  mind_reading: {
    id: "mind_reading",
    name: "Mind Reading",
    abilityType: "Magical",
    prerequisites: "Insight Score of 6+",
    tpCost: 8,
    kpCost: "N/A",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "Increase the Dice Score of your Skill Checks in any Clashes against an Opponent within your Melee Range by 1.",
    effect: "Target a Character within your Melee Range and make a Clash (Cognitive) against them. If you win, increase your Dodge Rolls and the Dice Score of any Strike Roll made through the Parry effect of the Defend Maneuver against that Opponent by 1(T) until the end of your next turn. Additionally, you may learn any piece of information they know that you are searching for. The amount of information you gain is limited by your ARC, some information may be repressed or Characters may have some unnatural resistance against this ability.",
    advancements: [
      {
        id: "far_reading",
        name: "Far Reading",
        prerequisites: "Insight Score of 7+",
        tpCost: 2,
        effect: "You can target any Character who is not at Long Range for the effects of Mind Reading."
      },
      {
        id: "combat_telepath",
        name: "Combat Telepath",
        prerequisites: "Force or Magic Score of 6+",
        tpCost: 5,
        effect: "If you win the Clash against an Opponent with Mind Reading, increase your Combat Rolls by 1(bT) against them until the end of your next turn."
      }
    ],
    restrictions: []
  },

  // ── 29. Multi-Form Technique ───────────────────────────────────────────
  multi_form_technique: {
    id: "multi_form_technique",
    name: "Multi-Form Technique",
    abilityType: "Magical",
    prerequisites: "N/A",
    tpCost: 10,
    kpCost: "8(T)",
    maneuverType: "Standard",
    actionCost: "2 Actions",
    passiveBonus: null,
    effect: "Create a Duplicate Minion. While you have a Duplicate Minion created through the Multi-Form Technique, reduce your Tier of Power by 1 (if you are already Tier of Power 1, reduce your Combat Rolls by 2 instead). If you fail a Steadfast Check while you have Duplicate Minion(s) created by the Multi-Form Technique, those Minions are Defeated. As an Instant Maneuver during your turn, you can erase all of your Duplicate Minions created by this Unique Ability. You can only possess 1 Duplicate Minion through the effects of Multi-Form Technique.",
    advancements: [
      {
        id: "mass_multi_form",
        name: "Mass Multi-Form",
        prerequisites: "N/A",
        tpCost: 15,
        effect: "Instead of a single Duplicate Minion, you can create up to 3 Duplicate Minions. For each Duplicate Minion added after the first, pay the Ki Point Cost for Multi-Form Technique an additional time. Instead of 1, you can possess up to 3 Duplicate Minions created through the effects of the Multi-Form Technique. These Minions do not count towards your maximum number of Minions."
      }
    ],
    restrictions: []
  },

  // ── 30. Para Para Dance ────────────────────────────────────────────────
  para_para_dance: {
    id: "para_para_dance",
    name: "Para Para Dance",
    abilityType: "Technical/Magical",
    prerequisites: "2+ Skill Ranks in Performance",
    tpCost: 10,
    kpCost: "7(T)",
    maneuverType: "Standard",
    actionCost: "Variable (1~3 Actions)",
    passiveBonus: "Reduce the Critical Target of your Performance Skill Checks by 1.",
    effect: "Spend up to 3 Actions, spending the Ki Point Cost an additional time for each Action spent after the first. Target a number of Opponents up to 1/4 (rounded up) of your Personality Modifier. Make a Skill Clash (Performance vs Performance/Intuition). If you win, on their next turn, that Opponent loses an equal number of Actions to the Actions spent on this Unique Ability at the start of their next turn, and they cannot convert any Actions into Counter Actions if it would reduce their Actions to less than the amount they need to reduce through this effect. For each Action an Opponent loses through this effect, reduce their Dodge Rolls by 1(T) until the start of their next turn.",
    advancements: [],
    restrictions: []
  },

  // ── 31. Petrification ──────────────────────────────────────────────────
  petrification: {
    id: "petrification",
    name: "Petrification",
    abilityType: "Magical",
    prerequisites: "Magic Score of 8+",
    tpCost: 20,
    kpCost: "12(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: null,
    effect: "Target an Opponent who is not at Long Range. Make a Clash (Cognitive vs Impulsive/Corporeal) against that Opponent. If you win, they gain a stack of the Slowed Combat Condition until the end of the Combat Encounter. They can remove a stack of this Combat Condition by dropping a carried Weapon or removing a layer of Apparel. Whatever is dropped crumbles to dust and is destroyed. If the user of this Magical Ability is Defeated, all Characters suffering from the Slowed Combat Condition due to any uses of Petrification done by this Character stop suffering from that Combat Condition.",
    advancements: [
      {
        id: "metal_breath",
        name: "Metal Breath",
        prerequisites: "Machine Mutant option selected for the Wonders of Technology Racial Trait",
        tpCost: 6,
        effect: "If you give a Character the Slowed Combat Condition through Petrification, you may treat them as if they were a Feature with a Hardness Value of 3. Instead of targeting an Opponent, you may target a Square. Your selected Square and all adjacent Squares to that Square gain Features that possess a Hardness Value of 3."
      },
      {
        id: "petrification_barrage",
        name: "Petrification Barrage",
        prerequisites: "Tier of Power 4+",
        tpCost: 10,
        effect: "You may use this Unique Ability an additional time per each Combat Round. You can gain this Advancement twice."
      }
    ],
    restrictions: []
  },

  // ── 32. Physical Retreat ───────────────────────────────────────────────
  physical_retreat: {
    id: "physical_retreat",
    name: "Physical Retreat",
    abilityType: "Technical/Magical",
    prerequisites: "Agility and Insight Score of 8+",
    tpCost: 10,
    kpCost: "4(T)",
    maneuverType: "Counter",
    actionCost: "1 Counter Action",
    passiveBonus: "Reduce the Damage you take from Attacking Maneuvers that had the Called Shot Maneuver applied to them by 1(bT).",
    effect: "If you are targeted by an Attacking Maneuver that has the Called Shot Maneuver applied to it, you may increase your Dodge Rolls by 4(T) for the duration of that Attacking Maneuver.",
    advancements: [],
    restrictions: []
  },

  // ── 33. Planet Merge ───────────────────────────────────────────────────
  planet_merge: {
    id: "planet_merge",
    name: "Planet Merge",
    abilityType: "Magical",
    prerequisites: "4+ Skill Ranks in Use Magic",
    tpCost: 16,
    kpCost: "12(T)",
    maneuverType: "Standard",
    actionCost: "3 Actions",
    passiveBonus: null,
    effect: "Target a Base you are inside of. That Base becomes a Living Base with you as the Avatar. This Unique Ability can only be used once per Combat Encounter and triggers the Exploit Maneuver of any Character within a Large Sphere AoE (centered on you). If you are hit by an Attacking Maneuver through the Exploit Maneuver, you fail to use the effect of this Unique Ability but are still considered to have used it for the Ki Point Cost, Action Cost, and its once per Combat Encounter limit.",
    advancements: [],
    restrictions: []
  },

  // ── 34. Portal Creation ────────────────────────────────────────────────
  portal_creation: {
    id: "portal_creation",
    name: "Portal Creation",
    abilityType: "Magical",
    prerequisites: "3+ Skill Ranks in Use Magic and Clairvoyance",
    tpCost: 20,
    kpCost: "5(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "When an Opponent moves into your Melee Range, except through the effects of the Movement Maneuver or any of their own effects, this triggers the Exploit Maneuver.",
    effect: "Create a Portal on an adjacent Square. When you do, select another Square on the Battlefield or in a location you have previously visited or know the exact coordinates for. Another Portal is created at that point in space, connecting the two Squares. Any Movement or Attacking Maneuvers may treat the Squares occupied by Portals as if they were the same Square. For example, if you are standing on the Square occupied by a Portal and have a Melee Range of 1 Square, you can make a Physical Attacking Maneuver against an Opponent who is adjacent to another Portal. You can only possess 2 Portals at one time and can dismiss any number of Portals as an Instant Maneuver.",
    advancements: [
      {
        id: "warp_zone",
        name: "Warp Zone",
        prerequisites: "4+ Skill Ranks in Use Magic and Clairvoyance",
        tpCost: 6,
        effect: "You can possess up to 4 Portals at one time. When you use the Portal Creation Unique Ability while you already possess Portals, you may choose which Portals the new Portals are connected to. For example, you could connect them to one another and have two sets of Portals active, or you could connect them to all of the other Portals and allow for any Portal to lead to any other Portal, or you could connect all of the new Portals to the Portal adjacent to you to effectively allow that Portal to lead to three different places while the other Portals only lead back to it."
      },
      {
        id: "dimensional_hole",
        name: "Dimensional Hole",
        prerequisites: "4+ Skill Ranks in Use Magic",
        tpCost: 10,
        effect: "If you are targeted by the Basic Attack Maneuver using an Energy or Magic Foundation, you may spend 1 Counter Action. If you do, target an Opponent, they become the target of the Attacking Maneuver instead of you. The Combat Rolls for that Attacking Maneuver become Urgent. You can only use this effect once per Combat Encounter."
      }
    ],
    restrictions: []
  },

  // ── 35. Position Change ────────────────────────────────────────────────
  position_change: {
    id: "position_change",
    name: "Position Change",
    abilityType: "Magical",
    prerequisites: "2+ Skill Ranks of Use Magic, Insight Score of 4+",
    tpCost: 12,
    kpCost: "5(T)",
    maneuverType: "Instant",
    actionCost: "N/A",
    passiveBonus: null,
    effect: "Target a Character within a Destructive Sphere AoE (centered on you). Make a Clash (Cognitive) against that Character. If you win, swap your places in the Battlefield. If your target was in a Grapple as the Grappler, also move the Grappled so they are in the Melee Range of the Grappler (the exact square is decided by the Grappler). If your target was the Grappled in a Grapple, they stop being the Grappled and you become the Grappled in their place. You cannot use this Unique Ability while in a Grapple or in the Pinned Combat Condition.",
    advancements: [
      {
        id: "item_swap",
        name: "Item Swap",
        prerequisites: "2+ Skill Ranks of Thievery",
        tpCost: 6,
        effect: "Instead of swapping places with an Opponent, steal a Basic Item they possess that you're aware of. This cannot be an Accessory they have equipped."
      },
      {
        id: "people_swap",
        name: "People Swap",
        prerequisites: "3+ Skill Ranks in Use Magic",
        tpCost: 5,
        effect: "Instead of a single target, you may choose two targets within the AoE for the effects of Position Change. If you win the Clash against both Characters, you may swap their positions on the Battlefield instead of changing yours."
      },
      {
        id: "sacrifice_play",
        name: "Sacrifice Play",
        prerequisites: "N/A",
        tpCost: 4,
        effect: "You may use the Position Change Unique Ability as a Counter Maneuver at the cost of 1 Counter Action. If you do, you must target a Character targeted by an Attacking Maneuver while you are not targeted by that same Attacking Maneuver. If you win the Clash, swap places with them. You become the target of that Attacking Maneuver and the targeted Character stops being a target for that Attacking Maneuver. You cannot use a Counter Maneuver in response to that Attacking Maneuver, but you may still roll your Dodge as usual."
      },
      {
        id: "web_save",
        name: "Web Save",
        prerequisites: "Energy Web Advancement",
        tpCost: 4,
        effect: "Instead of swapping places, move your target to a Square (you decide) within a Large Sphere AoE (centered on you)."
      }
    ],
    restrictions: []
  },

  // ── 36. Precognition ───────────────────────────────────────────────────
  precognition: {
    id: "precognition",
    name: "Precognition",
    abilityType: "Magical",
    prerequisites: "Insight Score of 7+",
    tpCost: 30,
    kpCost: "N/A",
    maneuverType: "Instant",
    actionCost: "N/A",
    passiveBonus: "Increase your Initiative by 1(T).",
    effect: "Target an Opponent who hasn't done their turn yet. For this Combat Round, move their place in the Initiative Order to the next turn after the current one. If you do, you gain 1 Counter Action to use during their turn and increase your Strike and Dodge Rolls against that Opponent by 1(T) for the duration of that turn.",
    advancements: [],
    restrictions: []
  },

  // ── 37. Second Sight ───────────────────────────────────────────────────
  second_sight: {
    id: "second_sight",
    name: "Second Sight",
    abilityType: "Magical",
    prerequisites: "2+ Skill Ranks of the Clairvoyance Skill, 2+ Skill Ranks of the Use Magic Skill",
    tpCost: 20,
    kpCost: "N/A",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "If you or the area you are in is targeted by Second Sight, you may make a Skill Clash (Concealment vs Clairvoyance) against the Character using the ability. If you win, you become aware of that Character, the effects of Second Sight fail, and you cannot be targeted again by Second Sight from that Character for 1d4 days.",
    effect: "Target a Character you know exists or an area you are aware of. You see that Character and their immediate surroundings as if looking from a bird's eye view, or see what is occurring in that area, until the start of your next turn (or until you stop focusing outside of a Combat Encounter). If you are benefiting from the effects of Second Sight, reduce your Defense Value by 1(T). If you are targeting a Character who is 8+ Squares away, you do not suffer from the penalties of Long Range against that Opponent for any Attacking Maneuvers.",
    advancements: [],
    restrictions: []
  },

  // ── 38. Shapeshift ─────────────────────────────────────────────────────
  shapeshift: {
    id: "shapeshift",
    name: "Shapeshift",
    abilityType: "Magical",
    prerequisites: "Personality or Scholarship Score of 6+",
    tpCost: 20,
    kpCost: "8(T)",
    maneuverType: "Standard",
    actionCost: "Variable (1~3 Actions)",
    passiveBonus: "While outside of a Combat Encounter, you can take on the form of any Character you know of. If a Character did not see you change, they cannot tell who you are unless they make a Skill Clash (Perception/Intuition vs Bluff) against you. If they win, they see through your disguise. If you win, they completely believe you are that person and cannot attempt to see through your disguise again unless you do something that would be suspicious.",
    effect: "When you use this Unique Ability, gain a number of the following effects for 5 turns based on the number of Actions spent on this Maneuver: Exchange one of your Body-Category Secondary Racial Traits for a Bestial Trait of your choice. Change your Size Category to any other Size Category (this does not destroy any Apparel you have equipped). Transform into a Vehicle with a BP Cost of 8. You are always considered the Pilot and cannot use any Attacking Maneuvers other than a Basic Attack Maneuver using the Blitz Profile unless the Vehicle has a Weapon – in which case you can only use Attacking Maneuvers using that Weapon(s). Transform into a Weapon with 3 Qualities. If you make any Attacking Maneuvers while a Weapon, treat the Weapon you transformed into as if it was Integrated for those Attacking Maneuvers but you can only use Attacking Maneuvers of the Attack Foundation that your Weapon would be applied to. While you are equipped, increase the Wound Roll of any Attacking Maneuver made with you by your Might, but you cannot use any Maneuvers other than to use the Shapeshift Maneuver. Additionally, you may apply a Ki Wager (up to 1/5 of your Max Capacity) onto any Attacking Maneuver made with you. If you use the Shapeshift Unique Ability while benefiting from its effects, you remove those effects and regain 6(T) Ki Points instead of applying the effects again. You may spend 6(T) Ki Points to apply the effects of Shapeshift immediately after removing the effects. If your Character is a Vehicle or Weapon, follow any rules related to that object. Any damage inflicted to that Vehicle or Weapon is instead inflicted to your Life Points. If an effect would destroy the Vehicle or Weapon except by inflicting Damage, you have your Life Points reduced to 1 Life Point below your next Health Threshold and you forcefully stop benefiting from the effects of Shapeshift. If you are benefiting from the effects of Shapeshift, you must pay 1/2 of the KP Cost for Shapeshift at the start of each of your turns. If you do not, remove the effects of Shapeshift.",
    advancements: [
      {
        id: "shapeshift_diploma",
        name: "Shapeshift Diploma",
        prerequisites: "N/A",
        tpCost: 5,
        effect: "The effects of Shapeshift lose the 5 Combat Round limit. Additionally, reduce the Ki Point Cost of the Shapeshift Unique Ability by 2(T)."
      },
      {
        id: "quick_shift",
        name: "Quick Shift",
        prerequisites: "Personality or Scholarship Score of 14+",
        tpCost: 15,
        effect: "When using the Shapeshift Maneuver, the Action Cost is always 1 Standard Action and you treat the effects of the Shapeshift Maneuver as if you spent up to 3 Actions (you decide how many)."
      }
    ],
    restrictions: []
  },

  // ── 39. Solar Flare ────────────────────────────────────────────────────
  solar_flare: {
    id: "solar_flare",
    name: "Solar Flare",
    abilityType: "Technical",
    prerequisites: "Force Score of 4+",
    tpCost: 10,
    kpCost: "5(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: null,
    effect: "Make a Clash (Impulsive) against all Opponents within a Huge Cone AoE (the direction is decided by you). If you win, they suffer from the Blinded Combat Condition until the end of their next turn.",
    advancements: [
      {
        id: "solar_flare_x100",
        name: "Solar Flare x100",
        prerequisites: "Force Score of 10+",
        tpCost: 8,
        effect: "Increase the Magnitude of Solar Flare's AoE by 1 category. While an Opponent suffers from the Blinded Combat Condition through the effects of Solar Flare, reduce their Clairvoyance Skill Checks by 4."
      }
    ],
    restrictions: []
  },

  // ── 40. Space-Time Connection ──────────────────────────────────────────
  space_time_connection: {
    id: "space_time_connection",
    name: "Space-Time Connection",
    abilityType: "Magical",
    prerequisites: "Access to the God Ki Special State and the Time Freeze Unique Ability",
    tpCost: 15,
    kpCost: "10(T)",
    maneuverType: "Standard",
    actionCost: "2 Actions",
    passiveBonus: "Reduce the Ki Point Cost of all other 'Time' Unique Abilities by 1(T).",
    effect: "Target 2 willing Characters within your Melee Range. For this Combat Encounter, those two Characters gain access to the Energy Synchronize Special Maneuver and may use that Maneuver as an Out-of-Sequence Maneuver immediately after the effects of this Unique Ability. This Unique Ability can only be used once per Combat Encounter.",
    advancements: [],
    restrictions: []
  },

  // ── 41. Super Ghost Kamikaze Attack ────────────────────────────────────
  super_ghost_kamikaze_attack: {
    id: "super_ghost_kamikaze_attack",
    name: "Super Ghost Kamikaze Attack",
    abilityType: "Magical/Technical",
    prerequisites: "Force or Magic Score 10+",
    tpCost: 20,
    kpCost: "Variable (3(T) for each Kamikaze Ghost)",
    maneuverType: "Standard",
    actionCost: "Variable (1~3 Actions)",
    passiveBonus: null,
    effect: "For each Action spent, create a Kamikaze Ghost! The Kamikaze Ghosts are Duplicate Minions with their Life Points reduced by 1/2. If a Character hits a Kamikaze Ghost with an Attacking Maneuver while in their Melee Range, is hit by the Physical Attack of a Kamikaze Ghost, or otherwise touches the Kamikaze Ghost in any way (such as either attempting to use the Grapple or Thrust Maneuver on the other, and it not failing due to a successful Dodge roll), the Kamikaze Ghost uses the Basic Attack Maneuver to use the Explosion Profile (targeting a Square they occupy) as an Out-of-Sequence Maneuver. Increase the Wound Roll of this Attacking Maneuver by the amount of Life Points the Kamikaze Ghost possesses at that moment. After using this effect, the Kamikaze Ghost is Defeated.",
    advancements: [
      {
        id: "balloon_flash_bomber",
        name: "Balloon Flash Bomber",
        prerequisites: "Force or Magic Score 16+",
        tpCost: 10,
        effect: "When you use the Super Ghost Kamikaze Attack Unique Ability, you may double the amount of Kamikaze Ghosts you create."
      }
    ],
    restrictions: []
  },

  // ── 42. Telekinesis ────────────────────────────────────────────────────
  telekinesis: {
    id: "telekinesis",
    name: "Telekinesis",
    abilityType: "Technical/Magical",
    prerequisites: "Force or Magic Score of 4+",
    tpCost: 20,
    kpCost: "8(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: "If you use the Terrain Lift Maneuver, you may use Magic instead of Force. Additionally, when using the Terrain Lift Maneuver, you may instead target any Feature that is not at Long Range. You gain access to the Elemental (Earth) Profile even if you do not meet the Magic Score requirement and you may use your Force instead of your Magic when calculating Wound Rolls with that Profile.",
    effect: "Target a Feature, Opponent, or an unequipped Item within 8 Squares of you. If you targeted an Item, you may use the Throw Maneuver or Toss Maneuver as if you were holding that Item. If you targeted a Feature, you may use the Throw Maneuver as if you were holding that Feature. If you targeted a Character, you may use the Launch Maneuver as if you were Grappling with that Character as the Grappler.",
    advancements: [
      {
        id: "psychic_counter",
        name: "Psychic Counter",
        prerequisites: "N/A",
        tpCost: 4,
        effect: "If you are targeted by another Character using the Telekinesis Unique Ability, you may initiate a Might Clash. If you win, they fail to target you with Telekinesis and you may spend 1 Counter Action to use the Telekinesis Unique Ability to target that Opponent as an Out-of-Sequence Maneuver."
      },
      {
        id: "advanced_telekinesis",
        name: "Advanced Telekinesis",
        prerequisites: "Force or Magic Score of 10+",
        tpCost: 8,
        effect: "You can select an additional target to use the Throw Maneuver against through the effects of Telekinesis."
      }
    ],
    restrictions: []
  },

  // ── 43. Telepathy ──────────────────────────────────────────────────────
  telepathy: {
    id: "telepathy",
    name: "Telepathy",
    abilityType: "Magical",
    prerequisites: "2+ Skill Ranks in Clairvoyance",
    tpCost: 8,
    kpCost: "N/A",
    maneuverType: "Instant",
    actionCost: "N/A",
    passiveBonus: "If you are in the Melee Range of a Character you are telepathically communicating with, increase both of your Defense Values by 1(bT). This effect does not stack if multiple Characters with the Telepathy Unique Ability are in each other's Melee Ranges.",
    effect: "Target a number of Characters within your Battlefield up to your number of Clairvoyance Skill Ranks. Until the end of the Combat Round, you may communicate with those Characters telepathically. While outside of a Combat Encounter, you can communicate with anyone you can see (this includes if you see them through the Second Sight Unique Ability).",
    advancements: [
      {
        id: "wide_range_telepathy",
        name: "Wide-Range Telepathy",
        prerequisites: "4+ Skill Ranks in Clairvoyance",
        tpCost: 4,
        effect: "You can select any number of targets with Telepathy. Additionally, you can target Characters outside of your Battlefield that you cannot see (even if you do not possess the Second Sight Unique Ability)."
      }
    ],
    restrictions: []
  },

  // ── 44. Threaded Energy ────────────────────────────────────────────────
  threaded_energy: {
    id: "threaded_energy",
    name: "Threaded Energy",
    abilityType: "Technical",
    prerequisites: "Energy Web Advancement",
    tpCost: 12,
    kpCost: "6(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: null,
    effect: "The Squares within a Large Sphere AoE (centered on you) become your Explosive Web. If an Opponent moves into or through these Squares, you may use the Basic Attack Maneuver against them as an Out-of-Sequence Maneuver, but the Attacking Maneuver must be of the Energy Foundation. You can only target each Opponent with this effect once per Combat Round. You cannot use this Unique Ability while you possess an Explosive Web, and must pay the Ki Point Cost of this Unique Ability at the start of each of your turns or remove your Explosive Web. You may remove your Explosive Web as an Instant Maneuver.",
    advancements: [],
    restrictions: []
  },

  // ── 45. Time Freeze ────────────────────────────────────────────────────
  time_freeze: {
    id: "time_freeze",
    name: "Time Freeze",
    abilityType: "Magical",
    prerequisites: "Magic Score 8+",
    tpCost: 20,
    kpCost: "14(T)",
    maneuverType: "Instant",
    actionCost: "N/A",
    passiveBonus: "You do not suffer a penalty to your Strike or Dodge Rolls from an Opponent who has used the Time Freeze Unique Ability. Maneuvers performed by an Opponent who has used the Time Freeze ability also provoke the Exploit Maneuver as normal.",
    effect: "Gain 2 Actions to use immediately – the Maneuvers made using these Actions can occur during another Character's turn, as they are used immediately after activating the Unique Ability (you cannot use any other type of Maneuver until these two Actions are spent on Standard Maneuvers). These Maneuvers don't provoke the Exploit Maneuver. You can only spend 1 of these Actions on an Attacking Maneuver, and if you do, any Opponents targeted by that Attacking Maneuver reduce their Strike and Dodge Rolls by 2(T) for the duration of that Attacking Maneuver. You cannot use the Combat Recovery, Power Up Maneuver, Energy Charge Maneuver, or a Unique Ability that targets an Opponent with these additional Actions.",
    advancements: [],
    restrictions: []
  },

  // ── 46. Trap Attack ────────────────────────────────────────────────────
  trap_attack: {
    id: "trap_attack",
    name: "Trap Attack",
    abilityType: "Technical",
    prerequisites: "Insight Score 4+, Force or Magic Score 4+",
    tpCost: 15,
    kpCost: "5(T)",
    maneuverType: "Standard",
    actionCost: "1 Action",
    passiveBonus: null,
    effect: "Select a Signature Technique of the Energy or Magic Foundation you possess and a Square within a Large Sphere AoE (centered on you), and record both the Square and the Signature Technique. That Square becomes a Trap Square with that Signature Technique stored in it – you cannot use the Signature Technique Maneuver to select that Signature Technique while that Trap Square exists. If an Opponent moves into or through that Square, you may use the Signature Technique Maneuver to use your selected Signature Technique as an Out-of-Sequence Maneuver. If you possess a Trap Square, you may use the Signature Technique Maneuver to use the stored Signature Technique as an Instant Maneuver. If you do, your Attacking Maneuver must target someone within a Sphere AoE (centered on the Trap Square). If your Signature Technique has an AoE, instead simply apply that AoE (starting from the Trap Square) and target all Characters in it. After you use the stored Signature Technique in the Trap Square, remove the Trap Square. You can only possess 1 Trap Square at a time. When you use the Signature Technique Maneuver through the effects of Trap Attack, make a Clash (Cognitive vs Impulsive) against your Opponent. If you win, that Opponent suffers from the Guard Down Combat Condition for the duration of that Attacking Maneuver.",
    advancements: [],
    restrictions: []
  }

};
