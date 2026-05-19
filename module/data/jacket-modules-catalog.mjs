// =============================================================================
// JACKET MODULES CATALOG
// All 23 standard modules and 6 unique modules for Battle Jackets.
// Standard modules: { name, description, effects: [{ type, text }], exclusions?: [] }
// Unique modules:   { name, unique: true, source: "frame"|"engine", sourceKey, description, effects: [{ type, text }] }
// =============================================================================

export const JACKET_MODULES_CATALOG = {

  // ---------------------------------------------------------------------------
  // STANDARD MODULES (23)
  // ---------------------------------------------------------------------------

  armedJacket: {
    name: "Armed Jacket",
    description: "This Battle Jacket comes equipped with an arsenal of weapons.",
    effects: [
      { type: "passive", text: "Integrate up to 3 Weapons with 'Giant Weapon' Quality. Treat as Integrated while Piloting." },
      { type: "triggered", text: "1/Round: When using Integrated Weapon for Signature Technique Maneuver, gain 1 Energy Charge." }
    ]
  },

  automatedBrutality: {
    name: "Automated Brutality",
    description: "Mechanically driven to extreme violence.",
    effects: [
      { type: "passive", text: "Reduce Critical Target of Strike and Wound Rolls by 1." },
      { type: "triggered", text: "On Critical Result (Strike or Wound), increase Wound Roll by 2(JT). Stacks if both crit." },
      { type: "triggered", text: "1/Round, 3/Encounter: On knocking through Health Threshold, reduce Steadfast Check Dice Score by 2." }
    ]
  },

  backupReserve: {
    name: "Backup Reserve",
    description: "Redundant power system for extended operation.",
    effects: [
      { type: "passive", text: "Double Ki Points regained through Engine's Unique Module second effect." },
      { type: "triggered", text: "1/Encounter: As Instant Maneuver, regain 10(JT) Ki Points." }
    ]
  },

  bestialDesign: {
    name: "Bestial Design",
    description: "Beast-like features for wild combat.",
    effects: [
      { type: "passive", text: "Gain up to 2 Bestial Traits. If only 1, increase Max LP by 2\u00D7Jacket Level." }
    ]
  },

  capsuleForm: {
    name: "Capsule Form",
    description: "Capsule technology integration for easy transport.",
    effects: [
      { type: "ruling", text: "'Capsule Jacket'. Adjacent to empty jacket: spend 1 Action to store in Capsule." },
      { type: "passive", text: "Ignore penalties of Bruised Health Threshold." },
      { type: "triggered", text: "1/Encounter: On entering jacket, use Power Up as Out-of-Sequence Maneuver." }
    ]
  },

  dataInput: {
    name: "Data Input",
    description: "Combat analysis and prediction system.",
    effects: [
      { type: "triggered", text: "Start of Turn: Select one Opponent as 'Scanned' until next turn. +1(JT) Strike and Dodge vs Scanned." },
      { type: "triggered", text: "1/Round: On hitting Scanned Opponent, apply extra Diminishing Defense stack." }
    ]
  },

  ejectFunction: {
    name: "Eject Function",
    description: "Emergency pilot protection system.",
    effects: [
      { type: "passive", text: "Reduce Strike Roll of Called Shots targeting Pilot by 2(JT)." },
      { type: "triggered", text: "1/Encounter: If jacket would be destroyed, move Pilot up to 10 Squares. LP reduced by 1/4 of Max LP." }
    ]
  },

  extendableLimbs: {
    name: "Extendable Limbs",
    description: "Stretching mechanical arms/legs.",
    effects: [
      { type: "passive", text: "If not Oblivious, ignore Cover on attacks." },
      { type: "passive", text: "+1(JT) Strike on Physical attacks vs Opponents 3+ Squares away." },
      { type: "triggered", text: "On Physical attack/Grapple: +3 Melee Range. On hit: move target up to Melee Range Squares." }
    ]
  },

  flightSystem: {
    name: "Flight System",
    description: "Inherent flight capability.",
    effects: [
      { type: "passive", text: "Gain Soar Maneuver and Dragon Dash Unique Ability." },
      { type: "passive", text: "+2(JT) Speed while in Sky Environment." },
      { type: "triggered", text: "1/Round: Use Soar as Instant Maneuver." },
      { type: "triggered", text: "1/Round: If you use Movement Maneuver, +1(JT) Combat Rolls until next turn." }
    ]
  },

  giantRobot: {
    name: "Giant Robot",
    description: "Towering over everything in sight.",
    effects: [
      { type: "passive", text: "Size becomes Gigantic (Enormous for Punching Up). Cannot combine with Power Armor." }
    ],
    exclusions: ["powerArmor"]
  },

  heavilyReinforced: {
    name: "Heavily Reinforced",
    description: "Extra plating for durability.",
    effects: [
      { type: "passive", text: "+2 Max LP per Jacket Level. +2(JT) Soak Value." },
      { type: "triggered", text: "1/Encounter: If jacket would be Destroyed, set LP to 1 instead." }
    ]
  },

  invulnerabilityCoating: {
    name: "Invulnerability Coating",
    description: "Extra-durable protective material.",
    effects: [
      { type: "passive", text: "Reduce Ki Point Cost for Guard Maneuver by 2(JT)." },
      { type: "triggered", text: "1/Round, 2/Encounter: After hit by attack, spend 1 Counter Action to apply Guard." }
    ]
  },

  gattai: {
    name: "Gattai",
    description: "Jacket Combination system for multi-pilot fusion.",
    effects: [
      { type: "passive", text: "Access Jacket Combination Fusion Method. Only with other Gattai jackets." },
      { type: "passive", text: "+1(JT) Combat Rolls near Ally Battle Jackets with Gattai." }
    ]
  },

  kungFuActionGrip: {
    name: "Kung-Fu Action Grip",
    description: "Designed for martial arts grappling.",
    effects: [
      { type: "passive", text: "+1(JT) Grapple Check Dice Score." },
      { type: "triggered", text: "1/Encounter: On failed Grapple, immediately retry as Out-of-Sequence, ignoring 1/Round." }
    ]
  },

  mechaFinisher: {
    name: "Mecha Finisher",
    description: "Maximized combat system effectiveness.",
    effects: [
      { type: "passive", text: "+20 Technique Points." },
      { type: "triggered", text: "Each Energy Charge with declared Signature Technique: gain 1 'Charged' stack." },
      { type: "automatic", text: "On Signature Technique Maneuver: spend Charged stacks. +1 Extra Dice Category per stack." }
    ]
  },

  powerArmor: {
    name: "Power Armor",
    description: "Personal suit of high-tech armor.",
    effects: [
      { type: "passive", text: "Size becomes Large (Enormous for Weapons/Punching Down). Cannot combine with Giant Robot, Transformer, Spare Seat." },
      { type: "triggered", text: "1/Round: On dodging or Parrying, use Basic Attack as Out-of-Sequence against attacker." }
    ],
    exclusions: ["giantRobot", "transformer", "spareSeat"]
  },

  reflectiveCoating: {
    name: "Reflective Coating",
    description: "Mirror-like coating for energy redirection.",
    effects: [
      { type: "passive", text: "Free Reflect Maneuver against Energy/Magic Attacks." },
      { type: "passive", text: "+1(JT) DR against Energy/Magic Attacks." },
      { type: "triggered", text: "1/Round, 3/Encounter: Parry vs Energy/Magic without Counter Action." }
    ]
  },

  nanoRepair: {
    name: "Nano Repair",
    description: "Self-repairing nanobots.",
    effects: [
      { type: "passive", text: "Automatically Repaired after every Combat Encounter." },
      { type: "triggered", text: "1/Encounter: As Instant Maneuver, Repair jacket." },
      { type: "automatic", text: "Start of Combat Round: Regain 3(JT) Life Points." }
    ]
  },

  selfDestruct: {
    name: "Self Destruct",
    description: "Built-in explosive last resort.",
    effects: [
      { type: "passive", text: "+2(JT) Wound Rolls per Health Threshold below." },
      { type: "triggered", text: "1/Encounter: Below Bruised, use Basic Attack Explosion with Final Chance. Pilot is also targeted." }
    ]
  },

  spareSeat: {
    name: "Spare Seat",
    description: "Additional passenger seating.",
    effects: [
      { type: "ruling", text: "Adjacent Ally spends Action to enter as Passenger. Cannot be targeted. Cannot target others except Pilot. Leave as Instant." }
    ],
    exclusions: ["powerArmor"]
  },

  transformer: {
    name: "Transformer",
    description: "Vehicle transformation capability.",
    effects: [
      { type: "ruling", text: "Create a Vehicle (Travel Mode). LP/Soak/DR shared between modes." },
      { type: "triggered", text: "1/Round: Spend 1 Action to transform between modes." },
      { type: "automatic", text: "Transforming to Travel Mode removes Power Stacks." },
      { type: "triggered", text: "1/Encounter: On changing to Battle Jacket from Travel Mode, Power Up as Out-of-Sequence." }
    ],
    exclusions: ["powerArmor"]
  },

  ultimateSurvivalMode: {
    name: "Ultimate Survival Mode",
    description: "Rotary engine for spinning offense/defense.",
    effects: [
      { type: "ruling", text: "2 Actions + 5(JT) KP to begin 'Spinning' until next turn." },
      { type: "triggered", text: "While Spinning: On Opponent entering Melee Range, Basic Attack (Launching) as Out-of-Sequence." },
      { type: "triggered", text: "1/Round while Spinning: Parry vs Energy/Magic without Counter Action." }
    ]
  },

  uniqueFunction: {
    name: "Unique Function",
    description: "Unique gimmick for the jacket.",
    effects: [
      { type: "triggered", text: "1/Round: Apply one Advancement to a Unique Ability use (ignore Prerequisites)." },
      { type: "passive", text: "Select up to 2 Unique Abilities: Binding, Physical Retreat, Solar Flare, Afterimage Technique, Trap Attack." }
    ]
  },

  // ---------------------------------------------------------------------------
  // UNIQUE MODULES (6)
  // ---------------------------------------------------------------------------

  allRoundFrame: {
    name: "All-Round Frame",
    unique: true,
    source: "frame",
    sourceKey: "assault",
    description: "Well-balanced frame providing strength and agility.",
    effects: [
      { type: "passive", text: "Above Injured Threshold: +1(JT) Combat Rolls." },
      { type: "triggered", text: "1/Round: On hit+damage, spend 3(JT) KP to apply Broken until next turn." },
      { type: "triggered", text: "1/Round: When targeted, +2(JT) Strike or Dodge for that attack." }
    ]
  },

  heavyFrame: {
    name: "Heavy Frame",
    unique: true,
    source: "frame",
    sourceKey: "sentinel",
    description: "Strong weighted frame for power and durability.",
    effects: [
      { type: "passive", text: "Above Injured Threshold: +1(JT) Strike and Wound Rolls, +1(JT) DR." },
      { type: "triggered", text: "1/Round: On hit, spend 3(JT) KP to reduce target's Strike/Dodge by 1(JT) until next turn." },
      { type: "triggered", text: "1/Round: On being hit, +2(JT) DR for that attack." }
    ]
  },

  highSpeedFrame: {
    name: "High-Speed Frame",
    unique: true,
    source: "frame",
    sourceKey: "mobile",
    description: "Lightweight frame for speed and agility.",
    effects: [
      { type: "passive", text: "Above Injured Threshold: +1(JT) Strike and Dodge, +2(JT) Boosted Speed." },
      { type: "triggered", text: "1/Round: On hitting after Movement Maneuver, spend 3(JT) KP to deal 1/2 Boosted Speed as LP loss." },
      { type: "triggered", text: "1/Round: On dodging, use any Standard Maneuver (Action Cost 1) as Out-of-Sequence." }
    ]
  },

  powerToTheFrame: {
    name: "Power to the Frame",
    unique: true,
    source: "engine",
    sourceKey: "power",
    description: "Extra energy wired to the frame for damage output.",
    effects: [
      { type: "triggered", text: "On attacking: spend up to 3(JT) KP to increase Might by equal amount for that attack." },
      { type: "automatic", text: "Start of Combat Round: Regain 3(JT) KP." }
    ]
  },

  balancedOutput: {
    name: "Balanced Output",
    unique: true,
    source: "engine",
    sourceKey: "balance",
    description: "Proportional power distribution.",
    effects: [
      { type: "passive", text: "With 2+ Power stacks: +1(JT) Combat Rolls." },
      { type: "triggered", text: "1/Round, 2/Encounter (on Power): Regain 1/4 (rounded up) Max KP." }
    ]
  },

  powerToTheThrusters: {
    name: "Power to the Thrusters",
    unique: true,
    source: "engine",
    sourceKey: "speed",
    description: "Speed-optimized engine for battlefield mobility.",
    effects: [
      { type: "triggered", text: "When targeted: spend up to 4(JT) KP to increase DV by 1/2 KP spent for that attack." },
      { type: "triggered", text: "1/Round: On Movement Maneuver, regain 4(JT) KP." }
    ]
  }

};
