/**
 * Apparel Qualities Catalog
 * Source: Manuales_Organizados/player/gear/apparel.txt
 *
 * Each entry shape:
 *   {
 *     id: snake_case_string,
 *     name: "Display Name",
 *     description: "Full rules text",
 *     isSpecial: false,                          // 10 special qualities = true
 *     compatibility: ["any"|"armor"|"weights"|"combat_clothing"|"standard_clothing"],
 *     automationType: "A"|"B"|"C"|"D"|"E",       // doc-only — see design doc
 *     config: [ { key, type, label, options?, attribute?, placeholder?, subset? } ]   // optional
 *   }
 */
export const APPAREL_QUALITIES_CATALOG = [
  {
    id: "armed",
    name: "Armed",
    description: "This outfit has a built-in weapon of some kind. While you wear this piece of Apparel, you possess an Integrated Weapon. When this piece of Apparel is created, create a Weapon with one Quality – that Weapon is the Integrated Weapon.",
    isSpecial: false,
    compatibility: ["armor", "combat_clothing", "standard_clothing"],
    automationType: "B"
  },
  {
    id: "dense_armor",
    name: "Dense Armor",
    description: "Particularly protective armor, this bulky gear restricts your movements. Increase your Apparel Bonus by 1(bT) but reduce your Combat Rolls by an equal amount.",
    isSpecial: false,
    compatibility: ["armor"],
    automationType: "A"
  },
  {
    id: "durable",
    name: "Durable",
    description: "This particular piece of apparel is extremely hard to damage. Increase the maximum Break Value for this piece of Apparel by 3.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "environmental_protection",
    name: "Environmental Protection",
    description: "Intended to preserve one's life for exploration into a hostile environment, this outfit is airtight. You cannot lose Oxygen or gain the Suffocating Combat Condition through the effects of any Battle Environment.",
    isSpecial: false,
    compatibility: ["armor", "combat_clothing", "standard_clothing"],
    automationType: "C"
  },
  {
    id: "focal",
    name: "Focal",
    description: "Designed to improve a single aspect of combat, these weights aren't as heavy, but are placed on specific areas of the body. Upon creating this piece of Apparel, select either your Strike or Dodge Rolls. The chosen Combat Roll is the only Combat Roll reduced by the effects of the Weight Apparel Category, but only that Combat Roll benefits from this piece of Apparel's Doff Bonus.",
    isSpecial: false,
    compatibility: ["weights"],
    automationType: "B",
    config: [
      { key: "target", type: "choice", label: "Affected Roll", required: true, options: [
        { value: "strike", label: "Strike" },
        { value: "dodge",  label: "Dodge" }
      ]}
    ]
  },
  {
    id: "hefty_plating",
    name: "Hefty Plating",
    description: "The sturdy weights in this outfit can be weaponized. The Hardness Value of this piece of Apparel is set to 4. If you hit an Opponent with this piece of Apparel through the Throw Maneuver, make a Might Clash against them. If you win, they are knocked Prone.",
    isSpecial: false,
    compatibility: ["weights"],
    automationType: "C"
  },
  {
    id: "jacket",
    name: "Jacket",
    description: "A piece of clothing designed to protect another piece of clothing underneath. This piece of Apparel can be worn over Armor. Increase your Soak Value by 1(T).",
    isSpecial: false,
    compatibility: ["standard_clothing"],
    automationType: "A"
  },
  {
    id: "joint_protection",
    name: "Joint Protection",
    description: "This armor covers your joints, reducing the chances of them being injured. The first time this piece of Apparel would break from its Break Value reaching 0, it does not break (set the Break Value back to 1) and you may gain the Doff Bonus of this piece of Apparel. If you do so, this uses your once per Combat Encounter Doff Bonus. This effect cannot be used again until this piece of Apparel is repaired.",
    isSpecial: false,
    compatibility: ["armor"],
    automationType: "C"
  },
  {
    id: "lab_coat",
    name: "Lab Coat",
    description: "This type of clothing is intended to protect you from chemical spills and other scientific mishaps. Increase your Dice Score on Skill Checks with a Skill of your choice by 2. The Skill must use your Scholarship Score to be chosen. In addition, if the Unique Decal Apparel Quality is selected as part of this Apparel, you may select a skill that uses your Scholarship Score for its effects instead.",
    isSpecial: false,
    compatibility: ["standard_clothing"],
    automationType: "B",
    config: [
      { key: "skillId", type: "skill", label: "Skill", attribute: "sc" }
    ]
  },
  {
    id: "layered",
    name: "Layered",
    description: "A piece of apparel specifically designed to be layered on top of another piece of apparel. While this piece of Apparel is your Top Layer, you also benefit from the Middle Layer's Apparel Category effects (using that piece of Apparel's Apparel Bonus).",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "C"
  },
  {
    id: "leaders_insignia",
    name: "Leader's Insignia",
    description: "A symbol of your authority, those who follow you respect and recognize you as their leader. Increase the Combat Rolls of your Minions by 1(bT). If this piece of Apparel has the Team Outfit Quality, increase the Wound Roll of all allies with the same team name by 1(bT) – this bonus does not stack if multiple characters possess this Quality.",
    isSpecial: false,
    compatibility: ["armor", "combat_clothing", "standard_clothing"],
    automationType: "A"
  },
  {
    id: "lightweight",
    name: "Lightweight",
    description: "This article of clothing is especially light. This piece of Apparel does not count towards the Apparel Penalty. You cannot possess both Lightweight and Durable on the same piece of Apparel.",
    isSpecial: false,
    compatibility: ["combat_clothing"],
    automationType: "C"
  },
  {
    id: "loose",
    name: "Loose",
    description: "This item of clothing comes off quite easily. You can remove this piece of Apparel through the No Effort Maneuver.",
    isSpecial: false,
    compatibility: ["combat_clothing", "standard_clothing"],
    automationType: "E"
  },
  {
    id: "mystical",
    name: "Mystical",
    description: "This item of clothing is great for magically focused characters. Increase the Dice Score of your Use Magic and Clairvoyance Skill Checks by 1.",
    isSpecial: false,
    compatibility: ["combat_clothing", "standard_clothing"],
    automationType: "A"
  },
  {
    id: "notorious_symbol",
    name: "Notorious Symbol",
    description: "Bearing the mark of the company, army, or other large organized force that you work for, your outfit strikes fear in the hearts of your organization's enemies. Name an Organization. If someone knows and fears that Organization, increase the Dice Score of your Intimidation Skill Checks against that Character by 3.",
    isSpecial: false,
    compatibility: ["armor", "combat_clothing", "standard_clothing"],
    automationType: "B",
    config: [
      { key: "organization", type: "text", label: "Organization", placeholder: "e.g. Capsule Corp" }
    ]
  },
  {
    id: "segmented_weights",
    name: "Segmented Weights",
    description: "You can remove these weights in increments, or all at once. When you would Doff these Weights, if their Apparel Grade is above Low, you can choose to instead reduce their Apparel Grade to any amount until the end of the Combat Encounter. Increase your Combat Rolls by a Doff Bonus of 1(bT) for every Apparel Grade lost through this effect. This effect can be applied multiple times per Combat Encounter.",
    isSpecial: false,
    compatibility: ["weights"],
    automationType: "E"
  },
  {
    id: "sentimental_value",
    name: "Sentimental Value",
    description: "This piece of clothing has particular meaning to you. When you spend a Karma Point to add an Extra Die to your Combat Roll, you regain your Karma Point if you score the highest result possible on that die. If this piece of Apparel is broken by an Opponent, you may enter the Surging State until the end of your next turn, but you can only make Attacking Maneuvers against the Opponent that broke this piece of Apparel while in that State.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "E"
  },
  {
    id: "sleek_design",
    name: "Sleek Design",
    description: "Light and flexible, this armor allows for a freer range of motion, but provides less protection. Reduce the Damage Reduction to 1/2 (rounded up). This Armor does not count towards your Apparel Penalty.",
    isSpecial: false,
    compatibility: ["armor"],
    automationType: "A"
  },
  {
    id: "special_event",
    name: "Special Event",
    description: "A tuxedo for a formal dinner, a bridal gown for your wedding, or even just a T-Shirt with the words \"I went to the family barbecue and all I got was this lousy T-Shirt\" on it, this apparel item is intended for use at a specific time and place. Speak with your ARC to select a Special Event – this is a circumstance in which wearing this outfit would be appropriate, such as wearing an expensive suit at a wedding. The first time you arrive at your selected Special Event, gain 1 Karma Point. If a Combat Encounter occurs while at the selected Special Event, increase the Doff Bonus for this piece of Apparel by 1(bT) for the duration of that Combat Encounter.",
    isSpecial: false,
    compatibility: ["standard_clothing"],
    automationType: "B",
    config: [
      { key: "event", type: "text", label: "Event Description" }
    ]
  },
  {
    id: "stealth_suit",
    name: "Stealth Suit",
    description: "This outfit muffles sound and/or helps you blend in to your environment. Increase the Dice Score of your Stealth Skill Checks by 2.",
    isSpecial: false,
    compatibility: ["combat_clothing", "standard_clothing"],
    automationType: "A"
  },
  {
    id: "stretching",
    name: "Stretching",
    description: "It expands to almost ANY size. This piece of Apparel will not be destroyed by your Size Category changing, regardless of your current or base Size Category.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "C"
  },
  {
    id: "team_outfit",
    name: "Team Outfit",
    description: "Bearing an emblem synonymous with the team you are part of, this outfit shows your team pride! When you select this Apparel Quality, choose a Team Name. Each ally with this Quality and the same Team Name increases their Stress Tests by 1 (this bonus does not stack).",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "B",
    config: [
      { key: "teamName", type: "text", label: "Team Name" }
    ]
  },
  {
    id: "training_support",
    name: "Training Support",
    description: "This outfit is heavy, but doesn't restrict your movement. If you possess any stacks of Holding Back while wearing this Apparel, you may ignore the reduction to your Combat Rolls from the effects of the Weight Apparel Category. This applies even if this piece of Apparel is not the Top Layer.",
    isSpecial: false,
    compatibility: ["weights"],
    automationType: "C"
  },
  {
    id: "unique_decal",
    name: "Unique Decal",
    description: "Some mark individual to you adorns your clothing, and your reputation is tied to that symbol, which is known to others. Increase your Dice Score on Skill Checks with a Skill of your choice by 2. The Skill must use your Personality Score to be chosen. If this piece of Apparel has another Apparel Quality that increases the Dice Score of your Skill Checks with a certain Skill, you cannot select the same Skill for the effects of Unique Decal (or vice versa).",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "B",
    config: [
      { key: "skillId", type: "skill", label: "Skill", attribute: "pe" }
    ]
  },
  {
    id: "weather_resistant",
    name: "Weather Resistant",
    description: "Built to withstand extreme weather, this clothing protects you from one specific weather type. When you gain this Quality, choose any type of Battle Weather. Ignore any Weather Effects from that Battle Weather while wearing this piece of Apparel.",
    isSpecial: false,
    compatibility: ["any"],
    automationType: "B",
    config: [
      { key: "weatherType", type: "choice", label: "Weather Type", options: [
        { value: "hot",       label: "Hot" },
        { value: "cold",      label: "Cold" },
        { value: "storm",     label: "Storm" },
        { value: "rain",      label: "Rain" },
        { value: "toxic",     label: "Toxic" },
        { value: "radiation", label: "Radiation" }
      ]}
    ]
  },
  // ===== Special Apparel Qualities =====
  {
    id: "assassins_craft",
    name: "Assassin's Craft",
    description: "These clothes aid in attacking enemies without being spotted. While your Opponent has the Oblivious Combat Condition, increase your Wound Rolls against them by twice the Apparel Bonus.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "D"
  },
  {
    id: "combat_ready",
    name: "Combat Ready",
    description: "This set of clothing gives you such wonderful freedom of movement, it's like you're wearing nothing at all. Increase all of your Combat Rolls by 1/2 (rounded up) of the Apparel Bonus.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "divine_apparel",
    name: "Divine Apparel",
    description: "This article of clothing is empowered by a divine entity. Increase the Apparel Bonus by 1(bT).",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "enchanted",
    name: "Enchanted",
    description: "Protected by magic, this item offers you greater defense. Increase your Soak Value by your Apparel Bonus.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "legacy",
    name: "Legacy",
    description: "Passed down from parent to child or master to student, this outfit helps you remember those who have placed their hopes and faith in you. Increase the Natural Result for all Steadfast Checks and Saving Throws by 2.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "masters_garb",
    name: "Master's Garb",
    description: "Clothes created specifically to match the requests of a master of their combat art, this outfit is specialized for accuracy. Increase your Strike Rolls by the Apparel Bonus.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "power_enhancement",
    name: "Power Enhancement",
    description: "Designed to give greater power to your attacks, this set of clothing amps up your techniques. Increase the Wound Rolls of your Signature Techniques by 2x the Apparel Bonus.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "D"
  },
  {
    id: "resolute_belief",
    name: "Resolute Belief",
    description: "These clothes contribute to your morale, allowing you to draw on memories of the cause you fight for. Increase the Dice Score of your Stress Test rolls by 2.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "A"
  },
  {
    id: "unbreakable",
    name: "Unbreakable",
    description: "This outfit is somehow indestructible. This piece of Apparel cannot lower its Break Value.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "C"
  },
  {
    id: "yardrat_material",
    name: "Yardrat Material",
    description: "This outfit is made of a special material that ki flows through easily, and comes with a fashionable neck tutu! Increase your Clairvoyance Skill Checks by 2. Additionally, reduce the Ki Point Cost for the Instant Transmission Unique Ability by 1/2.",
    isSpecial: true,
    compatibility: ["any"],
    automationType: "A"
  }
];
