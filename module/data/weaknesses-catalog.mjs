// Weaknesses catalog for the Adversary system
// Source: adversaries.txt
// Total weaknesses: 5

export const WEAKNESSES_CATALOG = [
  {
    "id": "wk_weak_stamina_001",
    "name": "Weak Stamina",
    "description": "This Adversary is strong at the outset, but has trouble recovering their energy.",
    "effects": [
      { "activationType": "passive", "keyword": "Passive", "text": "Reduce the amount of Ki Points you regain for any reason by 2(bT).", "usageLimit": null, "maxUses": 0 },
      { "activationType": "passive", "keyword": "Passive", "text": "While your Ki Points are below 1/2 of your Maximum Ki Points, reduce your Combat Rolls by 1(bT).", "usageLimit": null, "maxUses": 0 },
      { "activationType": "automatic", "keyword": "Automatic", "text": "While you are below the Injured Health Threshold, increase the Ki Point Cost of all Attacking Maneuvers by 1(T).", "usageLimit": null, "maxUses": 0 }
    ]
  },
  {
    "id": "wk_tipping_point02",
    "name": "The Tipping Point",
    "description": "This Adversary is almost impossible to damage, but once you pierce their defenses, they will crumble and implode.",
    "effects": [
      { "activationType": "triggered", "keyword": "Triggered", "text": "If you would take less than 20(bT) Damage from an Attacking Maneuver, you do not reduce your Life Points and instead reduce your Ki Points by the amount of Life Points you would lose. You do not benefit from this effect if you have fewer Life Points than your Maximum Life Points.", "usageLimit": null, "maxUses": 0 },
      { "activationType": "passive", "keyword": "Passive", "text": "You do not reduce your Life Points from Combat Conditions or Damage Over Time.", "usageLimit": null, "maxUses": 0 },
      { "activationType": "automatic", "keyword": "Automatic/Start of Turn", "text": "If you have fewer Life Points than your Maximum Life Points, reduce your Life Points by 5(bT).", "usageLimit": null, "maxUses": 0 }
    ]
  },
  {
    "id": "wk_obsessive_opp03",
    "name": "Obsessive Opponent",
    "description": "This Adversary meticulously focuses on a single enemy until they are no more.",
    "effects": [
      { "activationType": "automatic", "keyword": "Automatic/Start of Combat Encounter, Ruling", "text": "Target an Opponent. They become your \"Source of Obsession\". Increase your Combat Rolls against your Source of Obsession by 2(T), but reduce your Strike and Dodge Rolls against all other Opponents by 2(T).", "usageLimit": null, "maxUses": 0 },
      { "activationType": "automatic", "keyword": "Automatic", "text": "If your Source of Obsession is Defeated, select a new Opponent to be your Source of Obsession.", "usageLimit": null, "maxUses": 0 },
      { "activationType": "passive", "keyword": "Passive", "text": "You cannot target any Opponent other than your Source of Obsession with Attacking Maneuvers unless you cannot target your Source of Obsession with an Attacking Maneuver, or your Attacking Maneuver has an AoE that also targets your Source of Obsession.", "usageLimit": null, "maxUses": 0 }
    ]
  },
  {
    "id": "wk_personality_f04",
    "name": "Personality Flaw",
    "description": "This Adversary has a crippling personality flaw.",
    "effects": [
      { "activationType": "passive", "keyword": "Passive", "text": "Gain a Drawback.", "usageLimit": null, "maxUses": 0 }
    ]
  },
  {
    "id": "wk_flawed_phys_005",
    "name": "Flawed Physiology",
    "description": "This Adversary has some unusual defect that negatively impacts their performance.",
    "effects": [
      { "activationType": "passive", "keyword": "Passive", "text": "Gain a Flaw (see — Custom Species).", "usageLimit": null, "maxUses": 0 }
    ]
  }
];
