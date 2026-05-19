// Dangerous Minion Traits catalog for the Adversary system
// Source: adversary-minions.txt
// Total traits: 2

export const MINION_TRAITS_CATALOG = [
  {
    "id": "mt_aggressor_00001",
    "name": "Aggressor",
    "description": "Far less passive than most, this Minion is ready to throw down.",
    "effects": [
      { "activationType": "passive", "keyword": "Passive", "text": "This Minion ignores the effects of Recovery Periods.", "usageLimit": null, "maxUses": 0 },
      { "activationType": "triggered", "keyword": "Triggered/Start of Turn", "text": "If this Minion is not given a command through the Command Maneuver, they will still use a Basic Attack Maneuver on their turn against the nearest Opponent. If multiple Opponents are at the same distance, you can choose which Opponent is targeted.", "usageLimit": null, "maxUses": 0 }
    ]
  },
  {
    "id": "mt_phalanx_fight02",
    "name": "Phalanx Fighter",
    "description": "A trained soldier, this Minion is disciplined and fearless.",
    "effects": [
      { "activationType": "triggered", "keyword": "Triggered", "text": "When the Master of a Minion with the Phalanx Fighter Trait uses the Command Maneuver with that Minion as the target, all Minions with the Phalanx Fighter Trait can be controlled, and are treated as if targeted by the Command Maneuver. However, all Minions with the Phalanx Fighter Trait must make the same Maneuvers and every Attacking Maneuver or Unique Ability used by a Minion with the Phalanx Fighter Trait costs an additional 2(T) Ki Points. If they use the Movement Maneuver, they can move in different directions but if they use an Attacking Maneuver, it must be the same Attacking Maneuver (using the same Foundation and Profile if applicable). If the Transformation Maneuver is used by Minions with the Phalanx Fighter Trait, the Minions must enter a Transformation of the same type (Alternate Form/Enhancement Power) but they do not need to enter the same Transformation.", "usageLimit": null, "maxUses": 0 }
    ]
  }
];
