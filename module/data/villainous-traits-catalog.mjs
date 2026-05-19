// Villainous Traits catalog for the Adversary system
// Source: adversaries.txt
// Total traits: 14

export const VILLAINOUS_TRAITS_CATALOG = [

  // ── 1. The Pain Will Make Me Stronger! ──────────────────────────────────
  {
    id: "vt_pain_stronger_01",
    name: "The Pain Will Make Me Stronger!",
    category: "defensive",
    description: "A villainous resilience that turns suffering into power, rewarding the adversary for enduring punishment.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "Increase the Dice Score of your Steadfast Checks by 2.",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered/Threshold",
        text: "If you succeed at your Steadfast Check for this Health Threshold, increase your Combat Rolls for the remainder of the Combat Encounter by +1(bT). This bonus may stack.",
        usageLimit: null,
        maxUses: 0
      }
    ]
  },

  // ── 2. Overflowing Outburst ─────────────────────────────────────────────
  {
    id: "vt_overflow_outburst02",
    name: "Overflowing Outburst",
    category: "offensive",
    description: "Channels the fury of Raging or Surging states into devastating Energy Charge attacks.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "While you are in the Raging or Surging State, increase the Dice Category of the Extra Dice gained from any Energy Charges by 1.",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered/Raging, Triggered/Surging",
        text: "Use the Energy Charge Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: null,
        maxUses: 0
      }
    ]
  },

  // ── 3. Stay Down ────────────────────────────────────────────────────────
  {
    id: "vt_stay_down_000003",
    name: "Stay Down",
    category: "offensive",
    description: "Punishes opponents who are knocked through Health Thresholds, crippling their ability to recover.",
    effects: [
      {
        activationType: "triggered",
        keyword: "Triggered",
        text: "If you knock an Opponent through a Health Threshold with an Attacking Maneuver, reduce their Stress Bonus by 2 until the end of their next turn.",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered, 1/Encounter",
        text: "If you knock an Opponent through a Health Threshold with an Attacking Maneuver, they automatically fail their Steadfast Check for that Health Threshold.",
        usageLimit: "encounter",
        maxUses: 1
      }
    ]
  },

  // ── 4. No More Games ───────────────────────────────────────────────────
  {
    id: "vt_no_more_games_04",
    name: "No More Games",
    category: "defensive",
    description: "A dangerous trump card that cancels a lethal blow by counterattacking, but only once per encounter.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "If you have not used the second effect of No More Games during this Combat Encounter, the Combat Recovery Maneuver does not reduce your Defense Value or trigger the Exploit Maneuver.",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered, 1/Encounter",
        text: "If an Opponent's Attacking Maneuver would knock you through a Health Threshold or Defeat you, use the Basic Attack Maneuver on that Opponent as an Out-of-Sequence Maneuver. If you deal damage to that Opponent, their Attacking Maneuver is canceled and they regain any Ki Points spent on it (any Actions spent are still lost).",
        usageLimit: "encounter",
        maxUses: 1
      }
    ]
  },

  // ── 5. Instantaneous Assault ────────────────────────────────────────────
  {
    id: "vt_instant_asslt_05",
    name: "Instantaneous Assault",
    category: "offensive",
    description: "Grants free movement and allows a surprise attack at the end of that movement.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "You do not need to spend Ki Points for any effect of the Movement Maneuver (including Rapid Movement).",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered, 1/Round",
        text: "If you would end your movement within an Opponent's Melee Range, you may use the Basic Attack Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: "round",
        maxUses: 1
      }
    ]
  },

  // ── 6. The Perfect Plan ─────────────────────────────────────────────────
  {
    id: "vt_perfect_plan_06",
    name: "The Perfect Plan",
    category: "utility",
    description: "Designates a Chosen Nemesis for permanent analysis, while punishing other characters who interfere.",
    effects: [
      {
        activationType: "passive",
        keyword: "Permanent, Passive, Ruling",
        text: "Choose a Character to become your \"Chosen Nemesis\". You always benefit from both effects of the Analysis Maneuver on that Character.",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered, 1/Round",
        text: "If a Character who is not your Chosen Nemesis uses the Intervene Maneuver for an Attacking Maneuver that originally targeted your Chosen Nemesis, increase the Damage Category of the Attacking Maneuver by 1.",
        usageLimit: "round",
        maxUses: 1
      },
      {
        activationType: "triggered",
        keyword: "Triggered, 1/Round",
        text: "If an Opponent who is not your Chosen Nemesis targets you with an Attacking Maneuver, use a Special Maneuver with an Action Cost of 1 Action as an Out-of-Sequence Maneuver, targeting that Opponent.",
        usageLimit: "round",
        maxUses: 1
      }
    ]
  },

  // ── 7. An Unreachable Strength ──────────────────────────────────────────
  {
    id: "vt_unreach_str_007",
    name: "An Unreachable Strength",
    category: "offensive",
    description: "Dominates weaker opponents and can temporarily ascend to a higher Tier of Power when wounded.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "Increase your Combat Rolls against Opponents of a lower Tier of Power than you by 1(bT).",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered/Power, 1/Encounter",
        text: "If you are below the Injured Health Threshold, increase your Tier of Power by 1 (see \u2014 Breakthrough) until the end of your next turn.",
        usageLimit: "encounter",
        maxUses: 1
      }
    ]
  },

  // ── 8. Narrative Transformation ─────────────────────────────────────────
  {
    id: "vt_narr_transform08",
    name: "Narrative Transformation",
    category: "utility",
    description: "Removes Stress Test requirements for a chosen Transformation and enhances Legend Realized recovery.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "Select a Transformation or Transformation Line you possess. You do not need to roll Stress Tests for that Transformation or Transformation Line unless you are in the Full Power State, Exceed State, or using another Transformation in conjunction with them.",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered, 1/Encounter",
        text: "Double the amount of Life and Ki Points regained through Legend Realized.",
        usageLimit: "encounter",
        maxUses: 1
      }
    ]
  },

  // ── 9. Endless Barrage ──────────────────────────────────────────────────
  {
    id: "vt_endless_barr_09",
    name: "Endless Barrage",
    category: "offensive",
    description: "Reduces the cost of Signature Techniques and removes usage limits per round.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "Reduce the Ki Point Cost of your Signature Techniques by 2(T).",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "passive",
        keyword: "Passive",
        text: "You may use the Signature Technique Maneuver any number of times during each Combat Round. Additionally, if you are using the Path of Power Rules, ignore the Limited Signatures rule.",
        usageLimit: null,
        maxUses: 0
      }
    ]
  },

  // ── 10. Second Phase ────────────────────────────────────────────────────
  {
    id: "vt_second_phase_10",
    name: "Second Phase",
    category: "defensive",
    description: "Restricts access to the highest Transformation until defeated, then grants a dramatic revival and transformation.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "You cannot enter your Transformation with the highest Tier of Power Requirement, nor can you use two Transformations in conjunction with one another until you trigger the second effect of Second Phase.",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered/Defeated",
        text: "Regain Life Points equal to 1/2 of your Maximum Life Points and stop being Defeated. Then, you may use the Transformation Maneuver as an Out-of-Sequence Maneuver.",
        usageLimit: null,
        maxUses: 0
      }
    ]
  },

  // ── 11. Endless Resources ───────────────────────────────────────────────
  {
    id: "vt_endless_res_011",
    name: "Endless Resources",
    category: "utility",
    description: "Provides steady Ki regeneration each round and a one-time free Defend against powerful attacks.",
    effects: [
      {
        activationType: "automatic",
        keyword: "Triggered/Start of Combat Round",
        text: "Regain 5(bT) Ki Points.",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered, 1/Encounter",
        text: "If you are targeted by an Attacking Maneuver that is a Signature Technique or has a Ki Wager of 10(bT) or more, you may use the Defend Maneuver without spending a Counter Action.",
        usageLimit: "encounter",
        maxUses: 1
      }
    ]
  },

  // ── 12. Dauntless ───────────────────────────────────────────────────────
  {
    id: "vt_dauntless_00012",
    name: "Dauntless",
    category: "defensive",
    description: "Ignores forced Stress Tests and provides a last-stand safety net above the Critical Health Threshold.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "Ignore the rules for Forcing a Stress Test.",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered, 1/Encounter",
        text: "If you are above the Critical Health Threshold and are hit by an Attacking Maneuver that would reduce your Life Points to 0, instead set your Life Points to 1 Life Point below the Critical Health Threshold.",
        usageLimit: "encounter",
        maxUses: 1
      }
    ]
  },

  // ── 13. Drain Defying ───────────────────────────────────────────────────
  {
    id: "vt_drain_defy_0013",
    name: "Drain Defying",
    category: "utility",
    description: "Halves the Draining Aspect of Transformations and can reverse Ki drain into Ki gain once per encounter.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "Halve the Draining Aspect for all of your Transformations while you are not in the Power Stressed Special State.",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered, 1/Encounter",
        text: "If you would lose Ki Points from the Draining Aspect, gain that many Ki Points instead.",
        usageLimit: "encounter",
        maxUses: 1
      }
    ]
  },

  // ── 14. Condescending ───────────────────────────────────────────────────
  {
    id: "vt_condescend_0014",
    name: "Condescending",
    category: "offensive",
    description: "Rewards holding back with reduced attack costs and the ability to force a failed Steadfast Check.",
    effects: [
      {
        activationType: "passive",
        keyword: "Passive",
        text: "While you have any stacks of Holding Back or any Restrictions placed by the Swaggering Wager Talent, reduce the Ki Point Cost of all Attacking Maneuvers by 1(T).",
        usageLimit: null,
        maxUses: 0
      },
      {
        activationType: "triggered",
        keyword: "Triggered, 1/Encounter",
        text: "If you knock an Opponent through a Health Threshold with one of your Attacking Maneuvers while you have any stacks of Holding Back or any Restrictions placed by the Swaggering Wager Talent, they automatically fail their Steadfast Check made for that Health Threshold.",
        usageLimit: "encounter",
        maxUses: 1
      }
    ]
  }

];
