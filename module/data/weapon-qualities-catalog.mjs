/**
 * Weapon Qualities Catalog
 * Source: Manuales_Organizados/player/gear/weapons.txt
 *
 * Each entry shape:
 *   {
 *     id: snake_case_string,
 *     name: "Display Name",
 *     description: "Full rules text",
 *     isSpecial: false,                                // 10 special qualities = true
 *     compatibility: ["any"|"physical"|"energy"|"magic"],
 *     automationType: "A"|"B"|"C"|"D"|"E",             // doc-only — see design doc
 *     config: [ { key, type, label, options?, placeholder?, subset? } ]  // optional
 *   }
 */
export const WEAPON_QUALITIES_CATALOG = [
  {
    id: "artisan",
    name: "Artisan",
    description: "Crafted by a master craftsman, this Weapon is a superior example of its kind. Increase your Wound Rolls by 2(T).",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "boomerang",
    name: "Boomerang",
    description: "This Weapon is designed to slice through the air in such a way as to turn it back the way it came. If you hit an Opponent with this Weapon through the Throw Maneuver, you may equip it again immediately, ignoring the distance between you and the Weapon. You may spend 3(T) Ki Points to apply the Homing Advantage to any Attacking Maneuver made with this Weapon through the Throw Maneuver. If you fail to hit an Opponent with an Attacking Maneuver using this Weapon that has the Homing Advantage, you may equip this Weapon at the start of your next turn, ignoring the distance between you and the Weapon.",
    isSpecial: false,
    compatibility: ["physical"],
    automationType: "E"
  },
  {
    id: "breaker",
    name: "Breaker",
    description: "This Weapon is designed to deal extra damage to inanimate objects. If you use a Called Shot to target a piece of Apparel, double the loss of Break Value. If you targeted a Weapon instead, increase the Damage dealt to that weapon by 1/4 (rounded up).",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "D"
  },
  {
    id: "burst_fire",
    name: "Burst Fire",
    description: "This Weapon can gather massive amounts of energy and release them all at once. When making an Attacking Maneuver using this Weapon, you can choose to make that Attacking Maneuver a Burst Shot by spending 5(bT) Ki Points. You cannot make any further Attacking Maneuvers using this Weapon until the end of your next turn but for every remaining Action in your turn, this Attacking Maneuver gains an Energy Charge.",
    isSpecial: false,
    compatibility: ["energy", "magic"],
    automationType: "E"
  },
  {
    id: "close_quarters_combat",
    name: "Close Quarters Combat",
    description: "Your weapon is, through modifications, a bayonet, or sheer weight, able to be used in melee. Select a Physical Weapon Category. When making a Physical Attack, you can make it with this Weapon as if it was a Physical Weapon of that Category. If you do, it has the same Weapon Size as this Weapon but does not benefit from any Qualities.",
    isSpecial: false,
    compatibility: ["energy", "magic"],
    automationType: "B",
    config: [
      { key: "physicalCategory", type: "weaponCategory", label: "Physical Category", subset: "physical" }
    ]
  },
  {
    id: "duelist",
    name: "Duelist",
    description: "This Weapon is equally effective at offense and defense. Increase your Strike Rolls when using the Parry effect of the Defend Maneuver by 1(T).",
    isSpecial: false,
    compatibility: ["physical"],
    automationType: "D"
  },
  {
    id: "durable",
    name: "Durable",
    description: "Sturdy and unyielding, this Weapon is harder to break than most. Increase this Weapon's Life Points by 2 for each of your Power Levels.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "extending",
    name: "Extending",
    description: "This Weapon can grow in length, allowing you to attack at a distance. Increase your Melee Range by 3 for the duration of any Attacking Maneuvers made with this Weapon. If the Attacking Maneuver has an AoE, instead increase the Magnitude by 1, except for the Line AoE.",
    isSpecial: false,
    compatibility: ["physical"],
    automationType: "A"
  },
  {
    id: "far_sight",
    name: "Far Sight",
    description: "Be it a high-tech scope or a mystical crystal ball, this Weapon has a way to keep the wielder's attacks on target. Increase the number of Squares before an opponent is at Long Range by 4.",
    isSpecial: false,
    compatibility: ["energy", "magic"],
    automationType: "A"
  },
  {
    id: "flexible",
    name: "Flexible",
    description: "This Weapon can be used in multiple ways, such as being fit for both stabbing and slashing. Select a different Weapon Category of the same Foundation for this Weapon. When making an Attacking Maneuver, you may use the selected Weapon Category instead of its usual Weapon Category.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "B",
    config: [
      { key: "altCategory", type: "weaponCategory", label: "Alternate Category" }
    ]
  },
  {
    id: "giant_weapon",
    name: "Giant Weapon",
    description: "This Weapon is massively over-sized, making it unwieldy for most users. Increase your Wound Rolls with this Weapon by 1d4(T). Reduce your Strike Rolls with this Weapon by 1(T) for every Size Category you are smaller than Enormous. You do not suffer from this penalty to Strike Rolls if you are Piloting a Vehicle that gained this Weapon through the Weaponry Vehicle Quality.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "hidden",
    name: "Hidden",
    description: "This Weapon is sleek, designed to be kept out of sight until the moment you strike! The target(s) of the first Attacking Maneuver made with this Weapon during each Combat Encounter have the Guard Down Combat Condition for the duration of that Attacking Maneuver. This effect can only be avoided if the target already knows about this Weapon, at which point to apply this effect you must (at Attack Declaration) make a Skill Clash (Stealth vs Perception) against the target(s) that are aware. If you win, continue using this effect as normal. If you lose, they do not suffer the Guard Down Combat Condition.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "D"
  },
  {
    id: "high_tech",
    name: "High-Tech",
    description: "You substitute your lack of raw power with your genius. Increase your Wound Rolls by 1/4 (rounded up) of your Scholarship Modifier. When using a Signature Technique, instead use 1/2 of your Scholarship Modifier.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "lasting_wounds",
    name: "Lasting Wounds",
    description: "This Weapon leaves wounds that are hard for the body to heal, resulting in damage that remains for a longer period. If you deal Damage with an Attacking Maneuver that uses this Weapon, inflict one stack of DOT on an Opponent until the start of your next turn.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "D"
  },
  {
    id: "long_range_weapon",
    name: "Long Range Weapon",
    description: "This Weapon is exceedingly accurate, lessening the penalties of attacking distant targets. Increase your Strike Rolls by 1(T) against Opponents that are 9+ Squares away from you.",
    isSpecial: false,
    compatibility: ["energy", "magic"],
    automationType: "A"
  },
  {
    id: "quick_draw",
    name: "Quick Draw",
    description: "This Weapon is easy to ready, allowing you to attack with greater ease. When you Unsheathe this Weapon, if your next Maneuver is an Attacking Maneuver, increase the Strike Roll of that Attacking Maneuver by 1(T). If you would Sheathe this Weapon, increase the Wound Roll of the next Attacking Maneuver you would make with this Weapon by 2(T) – this effect does not stack.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "D"
  },
  {
    id: "shishkebab",
    name: "Shishkebab",
    description: "This Weapon also serves as a convenient way to carry a hearty snack. Once per Combat Encounter, while this Weapon is equipped, you may gain a Snack Basic Item as an Instant Maneuver.",
    isSpecial: false,
    compatibility: ["physical"],
    automationType: "E"
  },
  {
    id: "targeting_system",
    name: "Targeting System",
    description: "This Weapon has a built-in device to improve your accuracy. Increase the Natural Result of any Strike Roll made as part of an Attacking Maneuver with this Weapon by 1.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "telekinetic",
    name: "Telekinetic",
    description: "You can control this Weapon with your mind. Wielding this Weapon does not count towards your maximum number of Weapons you're able to wield. If this Weapon is a Physical Weapon, increase your Melee Range by 1 for the duration of any Attacking Maneuvers made with this Weapon.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "C"
  },
  {
    id: "throwing_weapon",
    name: "Throwing Weapon",
    description: "This Weapon is perfectly balanced for throwing, allowing it to fly further and straighter. If this Weapon hits an Opponent with the use of the Throw Maneuver, apply the effects of its Weapon Category and any qualifying Qualities.",
    isSpecial: false,
    compatibility: ["physical"],
    automationType: "E"
  },
  {
    id: "variable",
    name: "Variable",
    description: "This Weapon's size is larger than most, but smaller than some, allowing it to be wielded as if it were of either size. During your turn, you can use the No Effort Maneuver to change this Weapon's Weapon Size to another Weapon Size selected upon gaining this Quality or back to its original Weapon Size.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "B",
    config: [
      { key: "altSize", type: "choice", label: "Alternate Size", options: [
        { value: "small",    label: "Small" },
        { value: "standard", label: "Standard" },
        { value: "big",      label: "Big" }
      ]}
    ]
  },
  {
    id: "dimension_blade",
    name: "Dimension Blade",
    description: "This Weapon can cut through the very fabric of reality. Increase the Damage Category of all Attacking Maneuvers made with this Weapon by 1. Each Attacking Maneuver made with this Weapon reduces the Life Points of this Weapon by 1/10.",
    isSpecial: true,
    compatibility: ["physical"],
    automationType: "A"
  },
  {
    id: "elemental_blade",
    name: "Elemental Blade",
    description: "This Weapon is charged with elemental energy. Upon creating this Weapon, select a Profile with 'Elemental' in the name. Once per Combat Round, when making an Attacking Maneuver using this Weapon, you can spend the Ki Point Cost for that Profile to apply the effect of that Profile to this Attacking Maneuver.",
    isSpecial: true,
    compatibility: ["physical"],
    automationType: "B",
    config: [
      { key: "profile", type: "text", label: "Elemental Profile" }
    ]
  },
  {
    id: "elongation",
    name: "Elongation",
    description: "This Weapon is capable of extending to unfathomable distances. When making an Attacking Maneuver with this Weapon, the entire Battlefield is your Melee Range. If an Attacking Maneuver made with this Weapon has an AoE, except the Line AoE, increase the Magnitude for that AoE by 2. You cannot use this effect along with the Extending Weapon Quality.",
    isSpecial: true,
    compatibility: ["physical"],
    automationType: "A"
  },
  {
    id: "karmic_edge",
    name: "Karmic Edge",
    description: "This Weapon is dedicated to destroying targets of a particular alignment. When this Weapon is created, select either Good/Pure Good or Evil/Pure Evil. Increase your Wound Rolls for Attacking Maneuvers using this Weapon against the Opponents whose Alignment matches the chosen Alignment by 1d6(T).",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "B",
    config: [
      { key: "alignment", type: "alignment", label: "Target Alignment" }
    ]
  },
  {
    id: "pondering_orb",
    name: "Pondering Orb",
    description: "This Weapon offers benefits to magic-users who wield it. This Weapon also serves as a Crystal Ball.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "E"
  },
  {
    id: "regenerating",
    name: "Regenerating",
    description: "This Weapon is somehow able to recover. At the end of each Combat Encounter, this Weapon's Life Points are completely recovered. If it was destroyed during the Combat Encounter, it is completely repaired.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "E"
  },
  {
    id: "sealing",
    name: "Sealing",
    description: "This Weapon is designed to hold a powerful entity trapped within! This Weapon can be used for the Mafuba Unique Ability. You do not require a Sealing Talisman, if a character is placed into this Weapon, they are automatically sealed. Increase your Wound Rolls of any Attacking Maneuver using this Weapon by the Tier of Power Extra Dice (min. 1d4) of a character sealed within it.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "E"
  },
  {
    id: "super_heavy",
    name: "Super Heavy",
    description: "This Weapon is weighted poorly, but the weight helps build your strength. Reduce your Strike Rolls with this Weapon by 2(bT), but increase your Wound Rolls by 5(bT). The Hardness Value for this Weapon is 4. While using this Weapon over time, you can become accustomed to the intense weight. Your ARC decides when this occurs, but when it does, remove the reduction to your Strike Rolls while using this Weapon.",
    isSpecial: true,
    compatibility: ["physical"],
    automationType: "A"
  },
  {
    id: "unbreakable",
    name: "Unbreakable",
    description: "This Weapon is somehow indestructible. This Weapon cannot be destroyed by any means. You cannot use effects that would reduce the Life Points of this Weapon.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "C"
  },
  {
    id: "warding_weapon",
    name: "Warding Weapon",
    description: "This Weapon protects you from harm. While wielding this Weapon, increase your Damage Reduction by 4(bT) and increase your Dice Score in any Clash initiated by an Opponent by 1(T).",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "A"
  }
];
