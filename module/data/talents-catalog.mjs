// talents-catalog.mjs - Auto-generated from talents.txt
// Total: 214 talents across 30 categories

export const TALENT_CATEGORIES = {
  "Adaptation": ["adept_warrior", "combat_expertise"],
  "Attacking": ["aggressive_style", "artful_strike", "focused_strike", "masterful_strike", "powerful_strike"],
  "Balance": ["balanced_warrior", "balanced_defender", "balanced_mind", "jack_of_all_styles", "lord_of_balance", "power_of_the_z_warrior", "valor_of_the_dragon_team"],
  "Blaster": ["close_range_shot", "far_shot", "point_blank_shot", "artillery_shot", "blaster_master"],
  "Condition": ["combat_tactician", "perfected_tactics", "beat_down_tactics"],
  "Counter": ["wild_counter", "fierce_counter", "perfect_counter", "jolt_counter", "full_counter"],
  "Dodging": ["defensive_style", "cunning_evasion", "instinctual_evasion", "masterful_evasion", "free_flowing_stance", "agile_warrior", "superior_agility"],
  "Durability": ["effective_defenses", "resilience", "tough_warrior", "risky_bet", "superior_durability"],
  "Grappling": ["brawler", "wrestler", "judo_training", "heel", "suplex", "human_shield", "personal_space"],
  "Initiative": ["alert", "improved_initiative", "lightning_initiative", "patient_fighter"],
  "Magic": ["magic_blaster", "magic_warrior", "magic_champion", "magic_master"],
  "Mindful": ["serene_warrior", "combat_meditation", "tranquil_counter", "clear_mind", "combat_zen"],
  "Minion": ["master_of_minions", "minion_coordinator", "minion_mark", "sacrificial_minion", "minion_army", "minion_supporter"],
  "Mobility": ["footwork", "high_speed_ace", "power_of_movement", "fleet_of_foot"],
  "Multi-Type": ["multi_type_attacker", "balanced_in_body_and_spirit", "multi_type_gambit", "multi_type_master"],
  "Physical": ["iron_fist", "rapid_fist", "penetrating_fist", "supreme_fist"],
  "Racial": ["masterful_integration", "combat_mode", "nefarious_plating", "dedicated_sniper", "technical_prowess", "acute_triple_vision", "battle_goo", "mini_majin", "saiyan_tail_resistance", "tuffle_parasite"],
  "Raging": ["frenzy", "burning_anger", "berserk_resolve"],
  "Skill": ["practiced", "show_stopping_performance", "dynamic_hype", "team_pose", "spotlight_specialist", "analytic_fighter", "complete_analysis", "flexible_planning", "master_strategist", "genius_designer", "counter_jury_rigging", "silent_footsteps", "stealth_strike", "assassinate", "master_assassin", "acrobat_star", "expert_pilot", "yoink", "battlefield_doctor", "refined_sensor", "master_tamer", "terrifying_presence", "desperate_distraction", "last_ditch_effort", "survivalist", "team_survivalist", "feint_master"],
  "Specialization": ["archetype_focus", "precision_kata", "brutal_kata", "profile_focus"],
  "Starter": ["slow_starter", "warm_up", "reserved_combatant", "conserving_strength", "jump_start", "all_out_start"],
  "Super Stack": ["muscular_warrior", "hefty_muscle", "steel_muscle", "herculean_power"],
  "Surge": ["second_wind", "never_surrender", "lions_heart", "lightning_surge"],
  "Taunt": ["mental_warfare", "taunt", "improved_taunt"],
  "Teamwork": ["flexible_flanker", "supporting_defender", "opportunist", "power_gifter", "teamwork", "synchronized_combatants", "superior_synchronization", "desperate_support"],
  "Technique": ["bag_of_tricks", "energy_control", "technique_master", "favored_technique", "flexible_technique", "powerful_technique", "unique_technique", "terrifying_technique", "quick_learner", "perfect_mimicry", "copy_index", "advanced_learner", "multi_aura_specialist", "solo_aura_specialist", "aura_master", "technique_armory"],
  "Threshold": ["vigor", "diehard", "fortitude", "undying_determination"],
  "Transformation": ["blinding_transformation", "desperate_transformation", "enhanced_transformation", "forceful_transformation", "under_pressure", "specialized_transformation", "comfortable_transformation", "inspiring_transformation", "overwhelming_transformation", "transformation_stressor", "transforming_initiative", "restrained_transformation"],
  "Weapon": ["weapon_specialist", "category_specialist", "dueling_specialist", "light_weapons_specialist", "heavy_weapons_specialist", "iaijutsu_specialist", "dual_wielding_specialist", "twin_weapon_specialist", "critical_specialist", "variety_specialist", "improvised_specialist", "weapon_fixer", "weapon_master", "variable_fighter", "variable_champion"],
  "Miscellaneous": ["application_of_skill", "combat_wisdom", "concentrated_energy", "experienced_drunk", "ferocious_fighter", "furious_flex", "lucky", "naturist", "au_naturel", "superhuman_physique", "divine_physique", "snack_fiend", "frequent_flyer", "swaggering_wager", "willpower", "practiced_charger", "throwing_specialist", "aikido_apprentice", "exploit_expert", "master_of_openings", "responsive_warrior"],
};

export const ALL_TALENTS_DATA = [
  {
    id: "adept_warrior",
    name: "Adept Warrior",
    category: "Adaptation",
    description: "Skilled at making the most of your size, you know how to hit opponents where their guard is down.",
    prerequisites: "Base Size Category that is not Medium, or access to an effect that changes your Size Category (this may be an Aspect, Aura Type, Unique Ability, Transformation Trait or any other type of effect)",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Wound Rolls against an Opponent with a larger Size Category than you by 2(T) and increase your Strike Rolls against an Opponent with a smaller Size Category than you by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you are hit by an Opponent’s Attacking Maneuver that benefits from the Punching Down rules, do not apply that bonus to this Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you fail to hit an Opponent with an Attacking Maneuver that would benefit from the Punching Down rules, roll the Extra Dice from Punching Down regardless. Reduce that Opponent’s Life Points by that amount.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "combat_expertise",
    name: "Combat Expertise",
    category: "Adaptation",
    description: "Able to adjust your stance to focus on offense or defense, your ability to adapt is second to none.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered/Start of Turn", text: "Reduce your Awareness or Defense Value by up to 2(bT) to increase your Defense Value or Awareness (respectively) by the reduction until the start of your next turn. You cannot reduce an Aptitude to any value less than 2(bT) through this effect (if either Aptitude is already equal to or lower than 2(bT), then you cannot trigger this effect).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When making a Combat Roll as part of an Attacking Maneuver, or in response to an Attacking Maneuver that targets you, gain Greater Dice on that Combat Roll.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "aggressive_style",
    name: "Aggressive Style",
    category: "Attacking",
    description: "Leaning into your offensive skill, you sacrifice defense to ensure your blows cripple their targets.",
    prerequisites: "Combat Expertise, Insight Score of 5+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "If you reduce your Defense Value by at least 1(bT) through the first effect of Combat Expertise, increase your Awareness by an additional 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 2/Round", text: "If you hit an Opponent with an Attacking Maneuver, reduce your Critical Target for the Strike and Wound Rolls of any Attacking Maneuvers you make by 1 until the end of your turn.", usageLimit: "round", maxUses: 2 },
    ]
  },
  {
    id: "artful_strike",
    name: "Artful Strike",
    category: "Attacking",
    description: "Masterfully able to weave through an opponent’s defense, you catch them unaware.",
    prerequisites: "Combat Expertise",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you declare an Attacking Maneuver, you can spend 3(bT) Ki Points to double the penalty that all targets are suffering from Diminishing Defense for the duration of this Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you would make an Attacking Maneuver and have used the Movement Maneuver or an Attacking Maneuver with the Charging Assault Advantage this Combat Round, gain Greater Dice on your Strike Roll for that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "focused_strike",
    name: "Focused Strike",
    category: "Attacking",
    description: "Able to pinpoint weak points in a target’s defense, your attacks hone in on the least guarded parts of the opponent’s body to land strikes consistently.",
    prerequisites: "Artful Strike",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Roll your Base Die twice for any Strike Roll and use the highest result.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Reduce the Critical Target of your Strike Rolls by 1.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "masterful_strike",
    name: "Masterful Strike",
    category: "Attacking",
    description: "You are able to recover your momentum even when you miss, surprising your opponent with a strike that lands.",
    prerequisites: "Artful Strike, Tier of Power 3+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you fail to hit an Opponent with an Attacking Maneuver, reroll your Strike Roll and apply it against the same roll you lost against.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "1/Encounter", text: "As an Instant Maneuver you may activate this effect: until the end of your turn, ignore all penalties to your Strike Rolls.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "powerful_strike",
    name: "Powerful Strike",
    category: "Attacking",
    description: "Though less accurate, your attacks are far more powerful.",
    prerequisites: "Combat Expertise, Force or Magic Score of 5+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When making an Attacking Maneuver, you can reduce your Strike Roll by 1(T) to increase your Wound Roll by 3(T).", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Reduce the Critical Target of your Wound Rolls by 1.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "balanced_warrior",
    name: "Balanced Warrior",
    category: "Balance",
    description: "Proficient in combat and magic, you train to use both equally.",
    prerequisites: "Force and Magic Scores of 4+, you do not possess Magic Warrior or Magic Blaster",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While your Force and Magic Scores are equal to one another, increase the Dice Score of your Wound Rolls and Might Clashes by either your Force or Magic Score.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "After using a Unique Ability, increase the Wound Roll of your next Attacking Maneuver (in the same Combat Round) by 2(T).", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "balanced_defender",
    name: "Balanced Defender",
    category: "Balance",
    description: "Focused on both the ability to avoid damage and the ability to withstand it, you are able to shift stances to do either effectively.",
    prerequisites: "Agility and Tenacity Scores of 4+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Round", text: "As an Instant Maneuver, reduce your Defense Value or Soak Value by up to 2(bT) until the start of the next Combat Round. Increase the other Aptitude by an equal amount until the start of the next Combat Round. You cannot reduce either Aptitude to 0 through this effect.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "passive", keyword: "Passive", text: "While your Agility and Tenacity Scores are equal to one another, increase your Defense Value and Soak Value by 1(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "balanced_mind",
    name: "Balanced Mind",
    category: "Balance",
    description: "Focusing on both social and intellectual pursuits has taught you how to effectively blend the two.",
    prerequisites: "Personality and Scholarship Scores of 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While your Personality and Scholarship Scores are equal to each other, increase your Combat Rolls by 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Round", text: "While you are benefiting from the effects of the Hype Maneuver or Analysis Maneuver, you may use the other Maneuver listed by this effect as an Instant Maneuver. If you do, the effects of the Maneuver used through this effect only last until the end of your turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "jack_of_all_styles",
    name: "Jack of All Styles",
    category: "Balance",
    description: "You are able to utilize a wide variety of techniques, but your diversity prevents you from truly specializing in any one style.",
    prerequisites: "Balanced Warrior or Balanced Defender",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Treat your Attribute Scores (AG/FO/TE/MA) as if they were +1/2 their value for the Attribute Score Requirements of all Unique Abilities.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you use a Magical Unique Ability, increase the Wound Rolls of your Physical and Energy Attacks until the end of your turn by 2(T).", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you use a Technical Unique Ability, increase the Wound Rolls of your Magic Attacks until the end of your turn by 2(T).", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "lord_of_balance",
    name: "Lord of Balance",
    category: "Balance",
    description: "The epitome of the balanced combat style, you are able to adapt offensively and defensively in equal measure.",
    prerequisites: "Balanced Warrior, Balanced Defender",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While your Force and Magic Scores are equal to one another and your Agility and Tenacity Scores are equal to one another, increase your Strike and Dodge Rolls by 1(T) and your Wound Rolls by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Start of Combat Round", text: "Regain 3(bT) Life and Ki Points.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "power_of_the_z_warrior",
    name: "Power of the Z-Warrior",
    category: "Balance",
    description: "With a well-rounded approach to battle, you are a jack of all trades, but master of none.",
    prerequisites: "Agility, Force or Magic, Tenacity, Insight, Scholarship and Personality Scores of 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Stress Bonus by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round, 2/Encounter", text: "When making any Combat Roll, instead of rolling your Base Die, set the Natural Result to 10. This will cause you to score a Critical Result.", usageLimit: "round", maxUses: 1, encounterLimit: 2 },
    ]
  },
  {
    id: "valor_of_the_dragon_team",
    name: "Valor of the Dragon Team",
    category: "Balance",
    description: "Your determination grows as the battle wears on, and your spirit is carried forward by your comrades even after you’ve fallen.",
    prerequisites: "Power of the Z-Warrior",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are below the Bruised Health Threshold, increase all of your Combat Rolls and Saving Throws by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Defeated", text: "Use the Empower Maneuver as an Out-of-Sequence Maneuver.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "close_range_shot",
    name: "Close Range Shot",
    category: "Blaster",
    description: "Slipping in past your enemy’s reach, you unleash your energy blasts directly without fear of reprisal.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "When making an Unarmed Energy or Magic Attack within the Melee Range of a target, increase the Wound Rolls for that Attacking Maneuver against that target by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you are in the Square adjacent to a target when you hit an Opponent with an Unarmed Energy or Magic Attack, make a Might Clash against that target after the Wound Roll. If you win, that target is unable to use the Movement Maneuver until the start of your next turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "far_shot",
    name: "Far Shot",
    category: "Blaster",
    description: "Skilled at striking targets from a distance, your energy blasts are extra deadly.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "When making an Unarmed Energy or Magic Attack against a target that is outside of your Melee Range, increase the Wound Roll for that Attacking Maneuver by 1(T). If they were 8+ squares away from you, increase this bonus by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Unarmed Energy or Magic Attack that was outside of your Melee Range, make a Might Clash against that Opponent. If you win, move them any number of Squares up to your Might in a straight line away from you.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "point_blank_shot",
    name: "Point Blank Shot",
    category: "Blaster",
    description: "Knowing where to place your energy blasts for maximum effectiveness, the close range nature of your attacks makes them especially deadly.",
    prerequisites: "Close Range Shot",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent within your Melee Range with an Unarmed Energy or Magic Attack, make a Might Clash against them. If you win, increase the Damage Category of that Attacking Maneuver by 1.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you use the Energy Charge Maneuver within the Melee Range of an Opponent, use the declared Attacking Maneuver as an Out-of-Sequence Maneuver if it was an Unarmed Energy or Magic Attack.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "artillery_shot",
    name: "Artillery Shot",
    category: "Blaster",
    description: "Like a grenadier, your ability to lob energy blasts that cover a wide area makes your attacks even more likely to hit, despite the range.",
    prerequisites: "Far Shot",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you use an Unarmed Energy or Magic Attack that does not possess an AoE, you may spend 2(T) Ki Points to add the Minor Sphere or Standard Line AoE to that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you target an Opponent outside of your Melee Range with an Unarmed Energy or Magic Attack, you may spend 2(bT) Ki Points to increase that Attacking Maneuver’s Strike Roll by 1(T).", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "blaster_master",
    name: "Blaster Master",
    category: "Blaster",
    description: "Your unparalleled skill with energy blasts allows you to obliterate your enemies.",
    prerequisites: "Point Blank Shot or Artillery Shot, ToP2+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Encounter", text: "You may use an Energy or Magic Ultimate Signature Technique that has already been used in this Combat Encounter, as long as it is used as an Unarmed Attack.", usageLimit: "encounter", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Unarmed Energy or Magic Attack, spend up to 6(bT) Ki Points. If you do, increase the Wound Roll by an equal amount.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Unarmed Energy or Magic Attack, make a Might Clash against that target after the Wound Roll. If you win, the target is knocked Prone. If they are already Prone, increase the Damage of this Attacking Maneuver by 4(T) instead.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "combat_tactician",
    name: "Combat Tactician",
    category: "Condition",
    description: "You have learned to take advantage of your weakened opponents.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Natural Result of all Clashes made against an Opponent with a Combat Condition by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "When making an Attacking Maneuver against an Opponent suffering from a Combat Condition, increase either your Strike or Wound Rolls by 1(T) or 2(T) respectively for the duration of that Attacking Maneuver.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "perfected_tactics",
    name: "Perfected Tactics",
    category: "Condition",
    description: "Your brilliant tactics allow you to make the most of your opponents missteps.",
    prerequisites: "Combat Tactician",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You benefit from both bonuses from the second effect of Combat Tactician.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you are targeted by the Attacking Maneuver of an Opponent with a Combat Condition, increase your Dodge Roll against that Attacking Maneuver by 2(T).", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "beat_down_tactics",
    name: "Beat-down Tactics",
    category: "Condition",
    description: "Your ability to capitalize on your opponent’s weak points is second to none.",
    prerequisites: "Combat Tactician",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Might Clashes against an Opponent with a Combat Condition by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If an Opponent within 4 Squares of you gains a Combat Condition, this provokes your Exploit Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "wild_counter",
    name: "Wild Counter",
    category: "Counter",
    description: "Able to defend and attack in the same motion, you respond to being attacked with an attack of your own!",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you successfully avoid an Attacking Maneuver through the Parry effect of the Defend Maneuver, you can use the Basic Attack Maneuver against the attacking Opponent as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "fierce_counter",
    name: "Fierce Counter",
    category: "Counter",
    description: "Your counterattacks are stronger than most, striking with brutal efficiency.",
    prerequisites: "Wild Counter",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you use the Basic Attack Maneuver through the effects of Wild Counter, increase the Wound Roll for that Attacking Maneuver by 1d4(T).", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase your Strike Roll when using the Parry effect of the Defend Maneuver by 1(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "perfect_counter",
    name: "Perfect Counter",
    category: "Counter",
    description: "Able to defend even without preparations, your ability to counterattack is peerless.",
    prerequisites: "Fierce Counter, Tier of Power 3+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you are targeted by an Attacking Maneuver, you may spend 3(bT) Ki Points to use the Parry effect of the Defend Maneuver without spending a Counter Action.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you use the Basic Attack Maneuver through the effects of Wild Counter, increase the Strike Roll for that Attacking Maneuver by 1(T).", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "jolt_counter",
    name: "Jolt Counter",
    category: "Counter",
    description: "With the ability to dish it out as well as take it, you are skilled at turning the momentum of an attack against you into a more powerful blow against your attacker.",
    prerequisites: "Tenacity or Personality Score of 6+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When using the Cross Counter option of the Defend Maneuver, you may choose to reduce the Dice Score of your Dodge Roll against your opponents’ Attacking Maneuver to 0 and increase the Damage Category of that Attacking Maneuver by +1. If you do, increase your Strike Roll for your Attacking Maneuver by your Defense Value and increase the Damage Category of your Attacking Maneuver by 1.", usageLimit: "encounter", maxUses: 1 },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase your Wound Roll when using the Cross Counter effect of the Defend Maneuver by 3(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "full_counter",
    name: "Full Counter",
    category: "Counter",
    description: "You redirect your opponent’s attack, having them deal damage to themselves.",
    prerequisites: "Jolt Counter, Tranquil Counter",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When using the Cross Counter option of the Defend Maneuver, you may increase the Wound Roll of your Attacking Maneuver by 1/4 (rounded up) of your targeted Opponent’s Dice Score for the Wound Roll of their Attacking Maneuver. Your Opponent will roll their Wound Roll as an Urgent Roll, even if they fail to hit you.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you use the first effect of Full Counter while using the first effect of Jolt Counter, double the bonus to your Wound Roll from the first effect of Full Counter.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "defensive_style",
    name: "Defensive Style",
    category: "Dodging",
    description: "Focused heavily into defensive skills, you eschew accuracy to ensure your opponents can’t touch you.",
    prerequisites: "Combat Expertise, Agility Score of 5+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "If you reduce your Awareness by at least 1(bT) through the first effect of Combat Expertise, increase your Defense Value by an additional 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 2/Round", text: "If you dodge an Opponent’s Attacking Maneuver, reduce your Critical Target for your Dodge Rolls and the Wound Rolls of any Attacking Maneuvers you make by 1 until the end of your turn.", usageLimit: "round", maxUses: 2 },
    ]
  },
  {
    id: "cunning_evasion",
    name: "Cunning Evasion",
    category: "Dodging",
    description: "Masterfully skilled at evading attacks, you duck and weave out of the way of any incoming assault.",
    prerequisites: "Combat Expertise",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered/Start of Combat Round", text: "Target an Opponent. The first two Attacking Maneuvers that Opponent makes which target you do not inflict Diminishing Defense this Combat Round.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you are targeted by an Attacking Maneuver, if you have used the Movement Maneuver this Combat Round, you may gain Greater Dice on your Dodge Roll against that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "instinctual_evasion",
    name: "Instinctual Evasion",
    category: "Dodging",
    description: "Your ability to dodge is second-nature, to the point where you don’t even have to think about it anymore.",
    prerequisites: "Cunning Evasion",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Roll your Base Die twice for any Dodge Roll and use the highest result.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Reduce the Critical Target of your Dodge Rolls by 1.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "masterful_evasion",
    name: "Masterful Evasion",
    category: "Dodging",
    description: "Having mastered the elusive technique of dodging without intent, your evasive skills are without equal.",
    prerequisites: "Instinctual Evasion, Tier of Power 3+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you are hit by an Attacking Maneuver, reroll your Dodge Roll and apply it against the same roll you lost against.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "1/Encounter", text: "As an Instant Maneuver you may activate this effect: until the end of your turn, ignore all penalties to your Dodge Rolls.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "free_flowing_stance",
    name: "Free Flowing Stance",
    category: "Dodging",
    description: "You can take a defensive posture that allows you to dodge and weave around all attacks.",
    prerequisites: "Agility Score of 5+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Round", text: "You can spend any number of Actions as an Instant Maneuver during your turn. For each Action spent, increase your Defense Value by 1(T) until the start of your next turn.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you are targeted by an Attacking Maneuver while you possess no Standard Actions, you may spend up to 4(bT) Ki Points to increase your Dodge Roll by 1/2 of the Ki Points spent against that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "agile_warrior",
    name: "Agile Warrior",
    category: "Dodging",
    description: "You are nimble enough to avoid almost any attack.",
    prerequisites: "Agility Score of 10+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are above the Injured Health Threshold, increase your Defense Value by 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you are targeted by an Attacking Maneuver, you may spend up to 4(bT) Ki Points. Increase the Dice Score of your Dodge Roll for that Attacking Maneuver by 1/2 of the Ki Points spent.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "superior_agility",
    name: "Superior Agility",
    category: "Dodging",
    description: "You’re so unfathomably swift that you turn your enemy’s offensive power against them as you evade their blows.",
    prerequisites: "Agile Warrior, Tier of Power 3+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Halve the reduction to your Defense Value and Strike Rolls from the Guard Down Combat Condition.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you dodge an Opponent’s Attacking Maneuver, reduce their Life Points by 1/2 of the amount your Dodge Roll exceeds their Strike Roll for that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "effective_defenses",
    name: "Effective Defenses",
    category: "Durability",
    description: "Able to withstand damage more efficiently than most, you are nearly indestructible.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Reduce the Ki Point Cost for the Guard effect of the Defend Maneuver by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you use the Direct Hit or Guard options of the Defend Maneuver, increase your Soak Value by 2(T) before any calculations.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "resilience",
    name: "Resilience",
    category: "Durability",
    description: "Able to bounce back from damage more easily than most, you are exceptionally good at ignoring injuries.",
    prerequisites: "Tenacity Score 5+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Soak Value by 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase the amount of Life Points regained through a Healing Surge or Combat Recovery Maneuver by 1d4(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "tough_warrior",
    name: "Tough Warrior",
    category: "Durability",
    description: "Your ability to protect yourself from damage is far greater than average, allowing you to shrug off massive blows.",
    prerequisites: "Resilience",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Halve any Collision Damage you would suffer.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you are hit by an Attacking Maneuver, spend up to 3(bT) Ki Points. Increase your Damage Reduction by an equal amount for the duration of that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "risky_bet",
    name: "Risky Bet",
    category: "Durability",
    description: "You can throw more power into your attacks at the cost of opening your guard.",
    prerequisites: "Resilience, Tenacity Score of 8+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are below the Injured Health Threshold, increase your Soak Value by 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When making an Attacking Maneuver, reduce your Soak Value by up to 3(bT) until the start of your next turn to increase your Wound Rolls for that Attacking Maneuver by twice the reduction.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "superior_durability",
    name: "Superior Durability",
    category: "Durability",
    description: "Unmatched in your ability to take a hit, even the most lethal of blows barely scratches you.",
    prerequisites: "Tough Warrior, ToP3+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Halve the amount of Life Points you would lose from the effects of a Combat Condition or Damage over Time.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you have 3(bT) or more Damage Reduction against an Attacking Maneuver, you can reduce the Damage Category of that Attacking Maneuver by 1.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "brawler",
    name: "Brawler",
    category: "Grappling",
    description: "Particularly adept at submission holds and wrestling, you are more accustomed to fighting in a grapple than most.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Gain an additional Action each Combat Round while Pinned.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you hit an Opponent with an Unarmed Physical Attack, you may use the Grapple Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "wrestler",
    name: "Wrestler",
    category: "Grappling",
    description: "Your grapple techniques are highly refined, and you are able to leverage your opponent’s size against them.",
    prerequisites: "Brawler",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Treat your Size Category as if it was 1 larger for the effects of Gigantic Grip.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you make a Grapple Check to maintain a Grapple as the Grappler, you may use a Might Clash instead. Any bonuses from Gigantic Grip are applied to your Might Clash when using this effect.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "judo_training",
    name: "Judo Training",
    category: "Grappling",
    description: "Expanding your training in the art of submission holds, you are able to use your grip on a target to deal damage or reposition them as you please.",
    prerequisites: "Brawler",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Grapple Checks when already in a Grapple by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you successfully initiate a Grapple, you may use the Basic Attack Maneuver or the Launch Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "heel",
    name: "Heel",
    category: "Grappling",
    description: "Unabashed by dishonorable tactics, you are more than willing to choke the life out of your target.",
    prerequisites: "Brawler",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Wound Roll of your Attacking Maneuvers made against Opponents in a Grapple by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Round", text: "While you are the Grappler in a Grapple, you can spend 1 Action to target the Grappled and make a Clash (Strike) against them. If you win, they gain the Suffocating Combat Condition until they escape the Grapple.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "suplex",
    name: "Suplex",
    category: "Grappling",
    description: "Able to use the terrain to your advantage while grappling an opponent, you can smash them into the ground or drag them through a wall to inflict massive damage.",
    prerequisites: "Brawler",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Round", text: "While you are the Grappler in a Grapple in the Sky Environment, you can spend 1 Action to make a Might Clash against the Grappled. If you win, move to the Standard Environment and reduce the Grappled’s Life Points by twice the Collision Damage of the Ground plus your Might.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you use a Attacking Maneuver of the Powered or Crushing Profile while in a Grapple in the Standard Environment, increase the Wound Roll by an amount equal to the Collision Damage that would be inflicted by Colliding with the ground.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "passive", keyword: "Passive", text: "A Signature Technique that is applying the effects of the Powerbomb Advantage can apply the second effect of Suplex, regardless of which Profile is used (you must still be in the Standard Environment).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "human_shield",
    name: "Human Shield",
    category: "Grappling",
    description: "You can protect yourself by directing incoming attacks at the opponent currently in your grasp.",
    prerequisites: "Brawler",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round, Resource", text: "At the end of your turn, if you are the Grappler in a Grapple, you may select a Grappled Opponent in that Grapple and give them a stack of Sacrifice until the start of your next turn or they escape the Grapple (whichever occurs first). If you are targeted by an Attacking Maneuver (that does not possess an AoE), you may spend a stack of Sacrifice on a Grappled Opponent (in a Grapple you are the Grappler of) to change the target of that Attacking Maneuver to that Opponent and make the Strike Roll and Wound Rolls of that Attacking Maneuver become Urgent Rolls.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you are targeted for an Attacking Maneuver (that does not possess an AoE) while in a Grapple, you can make a Grapple Check against an Opponent in that Grapple. If you win, that Opponent becomes the target of that Attacking Maneuver instead and the Strike and Wound Rolls for that Attacking Maneuver become Urgent Rolls.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "personal_space",
    name: "Personal Space",
    category: "Grappling",
    description: "You are adept at keeping others from grabbing hold of you.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Round", text: "Spend 1 Action to make a Grapple Check to escape a Grapple you are in as the Grappled.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you escape a Grapple, you may use the Basic Attack Maneuver (against the former Grappler) or Movement Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you make a Grapple Check as the target of the Grapple Maneuver or as the Grappled, you may spend up to 8(bT) Ki Points to increase your Dice Score on that Grapple Check by half the amount of Ki Points spent.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "alert",
    name: "Alert",
    category: "Initiative",
    description: "Constantly on the lookout for danger, your awareness of your surroundings is unparalleled.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "When rolling Initiative, roll your Base Die twice. You may choose which result becomes the Natural Result.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "You ignore the effects of Surprise Rounds.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "passive", keyword: "Passive", text: "Choose a Combat Roll. While you have Initiative Advantage or are benefiting from the second effect of Patient Fighter, increase that Combat Roll by 1(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "improved_initiative",
    name: "Improved Initiative",
    category: "Initiative",
    description: "Able to act more quickly in response to stimuli, you’re quick to jump into the action.",
    prerequisites: "Alert, Agility Score 5+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Dice Score of your Initiative Checks by 2(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase your Combat Rolls by 1(T) against Characters with a lower Initiative than you.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "lightning_initiative",
    name: "Lightning Initiative",
    category: "Initiative",
    description: "Lightning-quick and ever-ready, you have your opening move of a fight planned before the fight’s even started.",
    prerequisites: "Improved Initiative, Agility Score 8+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you have Initiative Advantage, increase your Impulsive Saves and Speed by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Start of Turn, 1/Encounter", text: "If you have Initiative Advantage, gain an additional Action to spend during your turn this Combat Round.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "patient_fighter",
    name: "Patient Fighter",
    category: "Initiative",
    description: "You know the value of patience in battle, choosing to study your opponents to react perfectly to their attacks, rather than rush headlong into a fight.",
    prerequisites: "Scholarship or Insight Score 6+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "When you roll your Initiative Check at the start of a Combat Encounter, you may reduce the Dice Score by 1(T). If you do, increase the Initiative of an Ally by an equal amount.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "If your Initiative is the lowest in the turn order, increase your Combat Rolls by 1(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "magic_blaster",
    name: "Magic Blaster",
    category: "Magic",
    description: "Choosing to focus solely on your magical skills, you eschew other forms of combat to fire spell after spell at the enemy.",
    prerequisites: "Magic Score 6+, you do not possess Magic Warrior or Balanced Warrior",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Wound Rolls of your Magic Attacks by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "If you hit an Opponent with an Attacking Maneuver of the Magic Foundation, reduce that Opponent’s Soak Value by the Diminishing Defense inflicted from that Attacking Maneuver.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "After using a Magical Unique Ability, you may use the Energy Charge Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "magic_warrior",
    name: "Magic Warrior",
    category: "Magic",
    description: "Able to use magical power to supplement your physical might or ki blasts, your magical prowess is more than enough to stand up to others in combat.",
    prerequisites: "Magic Score 6+, you do not possess Magic Blaster or Balanced Warrior",
    effects: [
      { level: 1, activationType: "ruling", keyword: "Passive, Ruling", text: "Upon gaining this Talent, select either the Physical or Energy Foundation – this becomes known as your ‘Mystical Foundation’. You may use your Magic Modifier instead of your Force Modifier when rolling Wound Rolls for Profiles of your Mystical Foundation. Use your Magic Score instead of your Force Score to calculate the maximum amount of Energy Charges for Attacking Maneuvers made with Profiles of your Mystical Foundation. If the Energy Foundation is a Mystical Foundation, you gain access to all Energy Profiles.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 3/Round", text: "If you hit an Opponent with an Attacking Maneuver of your Mystical Foundation, increase the Wound Rolls of your Magic Attacks by 1(T) until the end of your turn.", usageLimit: "round", maxUses: 3 },
    ]
  },
  {
    id: "magic_champion",
    name: "Magic Champion",
    category: "Magic",
    description: "You are adept at infusing your magical power into your other attacks.",
    prerequisites: "Magic Score 12+, Magic Warrior Talent",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Upon gaining this Talent, the Foundation you did not select for the first effect of Magic Warrior also becomes a Mystical Foundation.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Attacking Maneuver of your Mystical Foundation, you may use the Basic Attack Maneuver as an Out-of-Sequence Maneuver. If you do, your Attacking Maneuver must be of the Magic Foundation.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round, 3/Encounter", text: "When making an Attacking Maneuver of your chosen Foundation through the Basic Attack Maneuver, you may spend Ki Points equal to the Ki Point Cost of a Profile for the Magic Foundation to apply its effects to that Attacking Maneuver. If you do, that Attacking Maneuver is also considered a Magic Attack for all effects.", usageLimit: "round", maxUses: 1, encounterLimit: 3 },
    ]
  },
  {
    id: "magic_master",
    name: "Magic Master",
    category: "Magic",
    description: "Your ability to empower your attacks with magical energy is unsurpassed, allowing you to hit harder and more accurately.",
    prerequisites: "Magic Score of 12+ and Magic Blaster, or Balanced Warrior",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Reduce the Ki Point Cost of all Magic Attacks by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When using a Signature Technique of the Magic Foundation, increase the Strike Roll by 1/4 of your Magic Modifier. Reduce your Ki Points by an equal amount to this bonus.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "After using the Energy Charge Maneuver, you may use the Signature Technique Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "serene_warrior",
    name: "Serene Warrior",
    category: "Mindful",
    description: "Able to calm yourself with meditation, you can unleash all of your stored power in an instant.",
    prerequisites: "Insight Score of 6+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Round, Resource", text: "While you possess any number of Power stacks, you can spend 1 Action to Meditate. If you do, you lose access to those Power stacks and gain a Concentration stack. You cannot possess more than 2 Concentration stacks.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered/Mindful", text: "All of your Concentration stacks become Power stacks until the end of your next turn.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "1/Encounter", text: "As an Instant Maneuver, you can spend 1 Concentration stack to use a Power Surge.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "combat_meditation",
    name: "Combat Meditation",
    category: "Mindful",
    description: "Your serenity and calm let you remain centered even in the midst of raging battle.",
    prerequisites: "Serene Warrior",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "When you regain Life and Ki Points through the Combat Recovery Maneuver, gain a stack of Concentration.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Encounter", text: "As an Instant Maneuver, you can spend 1 Concentration stack to use the Transformation Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "tranquil_counter",
    name: "Tranquil Counter",
    category: "Mindful",
    description: "Your patience and tranquility allow you to see past the emotional responses of others and quickly find the most efficient way to counter an attack.",
    prerequisites: "Insight Score of 6+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While in the Mindful State, increase the Natural Result of your Strike Rolls when using the Parry effect of the Defend Maneuver by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you are targeted by an Attacking Maneuver, you can spend 2(bT) Ki Points to reduce the Strike Roll for that Attacking Maneuver by 1/4 (rounded up) of that Opponent’s Might.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "clear_mind",
    name: "Clear Mind",
    category: "Mindful",
    description: "Your meditations have led to the ability to clear your mind of all thoughts but the ones that are necessary to continue the fight.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "Whenever you score a Critical Result on a Combat Roll while in the Mindful State, increase the Dice Score by an additional 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Mindful, 1/Encounter", text: "Increase your Combat Rolls by 1(T) until you leave the Mindful State.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "combat_zen",
    name: "Combat Zen",
    category: "Mindful",
    description: "Able to fully cleanse your mind of all thought, your body has become able to act on its own to some extent.",
    prerequisites: "Clear Mind",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When making an Attacking Maneuver while in the Mindful State, you can spend 3(bT) Ki Points and 1 Action to add 2 Energy Charges to that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered/Power, 2/Encounter", text: "Enter the Mindful State until the end of your next turn.", usageLimit: "encounter", maxUses: 2 },
    ]
  },
  {
    id: "master_of_minions",
    name: "Master of Minions",
    category: "Minion",
    description: "You are accustomed to command, and rule over your Minions with great ease.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Round", text: "Reduce the total Action Cost of the Command Maneuver by 1. If that would make the Action Cost 0, it can be used as an Instant Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase the Wound Roll of your Minions by 1/4 (rounded up) of your Personality or Scholarship Modifier (whichever is higher).", usageLimit: null, maxUses: null },
      { level: 3, activationType: "passive", keyword: "Passive", text: "Increase your maximum number of Minions by 2.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "minion_coordinator",
    name: "Minion Coordinator",
    category: "Minion",
    description: "You are a master tactician, able to give extremely efficient orders to your subordinates.",
    prerequisites: "Master of Minions, you do not possess Minion Mark",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the amount of Life and Ki Points regained through the Recovery Period rule for Minions by 4(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Round", text: "As an Instant Maneuver, select one of your Minions. That Minion enters the Superior State until the end of their turn.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "passive", keyword: "Passive", text: "Increase your maximum number of Minions by 2.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "minion_mark",
    name: "Minion Mark",
    category: "Minion",
    description: "You have the ability to turn your subordinates’ very life essence into greater power, and they know to defend you in battle.",
    prerequisites: "Master of Minions, you do not possess Minion Coordinator",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Round", text: "As an Instant Maneuver, select one of your Minions that is not a Special Minion. That Minion becomes Marked. A Marked Minion loses 2(bT) Life Points at the start of each Combat Round, but their Combat Rolls are increased by 1(bT) – both use your Tier of Power for calculation.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Minions (except Special Minions) without any Counter Actions can use the Defense Wall option of the Intervene Maneuver if you are targeted by an Attacking Maneuver by spending 1/2 of their Life Points.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "passive", keyword: "Passive", text: "Increase your maximum number of Minions by 2.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "sacrificial_minion",
    name: "Sacrificial Minion",
    category: "Minion",
    description: "You are able to draw power from killing your Minions, either by draining their life essence, terrifying your opponents, or just generally making yourself feel big.",
    prerequisites: "Minion Mark",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "If one of your Attacking Maneuvers includes one of your Minions in the list of targets, increase the Strike and Wound Rolls for that Attacking Maneuver by 1(T) and 2(T) respectively.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Round", text: "As an Instant Maneuver, target one of your Minions (except Special Minions). That Minion is Defeated. Apply an effect of your choice from the list below: Make a Morale Clash against all of your Opponents. If you win, they gain the Shaken Combat Condition. Regain Life Points equal to 1/2 of their Life Points immediately before you applied this effect. Increase your Combat Rolls by 2(T) until the end of your next turn. This effect cannot stack.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "minion_army",
    name: "Minion Army",
    category: "Minion",
    description: "You lead an entire army of Minions, able to call upon them at any time.",
    prerequisites: "Minion Coordinator or Minion Mark Talents",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "There is no limit to the number of Minions you may possess, but only up to 10 of your Minions may join a Combat Encounter.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "If one of your Minions makes an Attacking Maneuver, increase the Wound Roll for that Attacking Maneuver by 1(T) for every one of your Minions in the Combat Encounter who has not yet made an Attacking Maneuver this Combat Round (max. 4(T)).", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered", text: "If any number of your Minions are Defeated, you may have any number of Minions that are not currently in the Combat Encounter immediately join the Combat Encounter. This cannot allow your total number of Minions in the Combat Encounter to exceed 10.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "minion_supporter",
    name: "Minion Supporter",
    category: "Minion",
    description: "You are content to stand in the back, giving orders to your Minions.",
    prerequisites: "Minion Coordinator",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "If you target a Minion with the effects of the Spectator State, apply your Tier of Power Extra Dice as Extra Dice to your Minion’s Combat Rolls.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Round", text: "You can use the Empower Maneuver (as if you spent 1 Action) as an Instant Maneuver. If you do, you must target one of your Minions and that Minion has its Combat Rolls increased by 1(T) until the start of your next turn.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If one of your Minions is Defeated by an Opponent’s Attacking Maneuver, you may enter the Raging and Surging States until the end of your turn. If you do, you must target that Opponent with the effects of the Surging State.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "footwork",
    name: "Footwork",
    category: "Mobility",
    description: "Your deft footwork allows you to close the gap between you and your target, even as they try to flee.",
    prerequisites: "Agility Score of 4+, access to the Soar Maneuver",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Gain access to the Dragon Dash Unique Ability. If you already had access to Dragon Dash upon gaining this Talent, gain 5 Technique Points.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Round", text: "As an Instant Maneuver, you may move up to 1(bT) Squares in any direction.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you use the Rapid Movement effect of the Movement Maneuver, increase your Defense Value by 1(T) until the start of your next turn.", usageLimit: "round", maxUses: 1 },
      { level: 4, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When a Character within your Melee Range enters the Sky Environment, you can use the Soar Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 5, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When a Character within your Melee Range uses the Movement Maneuver to leave your Melee Range, you may use the Movement Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "high_speed_ace",
    name: "High Speed Ace",
    category: "Mobility",
    description: "Focused on zipping around the battlefield, you build up momentum and combine it with your fighting style.",
    prerequisites: "Footwork, Agility Score of 7+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Defense Value and Speed by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "During this Combat Round, if you have moved a total number of Squares that matches or exceeds your Normal Speed through your own effects or Maneuvers, increase your Combat Rolls by 1(T) until the end of this Combat Round.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "power_of_movement",
    name: "Power of Movement",
    category: "Mobility",
    description: "Having mastered the ability to stay mobile while charging your energy, you are a real force to be reckoned with on the battlefield.",
    prerequisites: "Footwork",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You can use the Movement Maneuver after using the Energy Charge Maneuver, even if you have not yet used whatever attack you have declared. You do not suffer from the Guard Down Combat Condition through the effects of the Energy Charge Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When using any type of applicable Signature Technique that has gained at least 2 Energy Charges from the Energy Charge Maneuver, you may spend 2(T) Ki Points to add the Charging Assault Advantage to that Signature Technique for the duration of that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "fleet_of_foot",
    name: "Fleet of Foot",
    category: "Mobility",
    description: "Your ability to gather momentum while moving is unmatched, allowing you to land blows before your opponent even realizes you’re attacking.",
    prerequisites: "High Speed Ace or Power of Movement",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the bonus to your Defense Value from Footwork’s third effect by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you enter the Melee Range of an Opponent when using the Movement Maneuver, increase the Strike Roll of your next Attacking Maneuver that targets them by 2(T) until the end of your turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "multi_type_attacker",
    name: "Multi-Type Attacker",
    category: "Multi-Type",
    description: "Skilled at combining physical might with ki blasts, you are able to easily switch between them with greater effect than others.",
    prerequisites: "Iron Fist or Rapid Fist, Close Range Shot or Far Shot (‘Weapon Specialist’ also counts as any of these options for this Prerequisite), you do not posses the Variable Fighter Talent",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you would use a Physical Attack, increase the Strike OR Wound Rolls of your Energy Attacks for the remainder of this Combat Round by 1(T) or 2(T) respectively.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you would use an Energy Attack, increase the Strike OR Wound Rolls of your Physical Attacks for the remainder of this Combat Round by 1(T) or 2(T) respectively.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "balanced_in_body_and_spirit",
    name: "Balanced in Body and Spirit",
    category: "Multi-Type",
    description: "You have trained yourself to be proficient in all types of combat with equal prowess, granting you a wide variety of options in battle.",
    prerequisites: "Multi-Type Attacker and Balanced Warrior",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you would use a Magic Attack, increase the Wound Rolls of your Physical and Energy Attacks by 1(T) until the end of the Combat Round.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you use a Physical or Energy Attack, increase the Wound Rolls of your Magic Attacks by 1(T) until the end of the Combat Round.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 3/Round", text: "Each time you use an Attacking Maneuver of a different Foundation, increase your Wound Rolls by 1(T) until the end of your turn.", usageLimit: "round", maxUses: 3 },
      { level: 4, activationType: "triggered", keyword: "Triggered, Resource", text: "If you trigger the third effect of Balanced in Body and Spirit 3 times in one Combat Round, gain a stack of Equilibrium (max. 3). If you would use the Basic Attack Maneuver, you may spend a stack of Equilibrium to reduce the Ki Point Cost of that Attacking Maneuver to 0.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "multi_type_gambit",
    name: "Multi-Type Gambit",
    category: "Multi-Type",
    description: "Eschewing the versatility of switching between attack types, you focus all your power into one massive attack.",
    prerequisites: "Multi-Type Attacker, ToP2+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered/Start of Combat Round", text: "Apply either Triggered effect of Multi-Type Attacker as if you had used an Attacking Maneuver of the required Foundation.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When making an Attacking Maneuver that does not share a Foundation with any Attacking Maneuvers you have used this Combat Round, and has at least 2+ Energy Charges, you may increase the Damage Category of that Attacking Maneuver by 1.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "multi_type_master",
    name: "Multi-Type Master",
    category: "Multi-Type",
    description: "Your ability to combine physical might and ki blasts is so great that you can use both at the same time.",
    prerequisites: "Multi-Type Attacker, ToP3+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit the Opponent with an Attacking Maneuver of the Physical or Energy Foundation, you may use the Basic Attack Maneuver as an Out-of-Sequence Maneuver using the other Foundation.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you would benefit from Bonus Momentum, instead of gaining an additional Action, use the Basic Attack Maneuver twice (one after the other) as an Out-of-Sequence Maneuver. If you do, one of these Attacking Maneuvers must be an Energy Attack and the other must be a Physical Attack. You cannot Ki Wager on these Attacking Maneuvers.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "iron_fist",
    name: "Iron Fist",
    category: "Physical",
    description: "Your Unarmed Physical Attacks hit harder than others’, allowing you to make their defenses crumble.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Wound Rolls of your Unarmed Physical Attacks by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Unarmed Physical Attack and deal Damage, make a Might Clash against them. If you win, that Opponent’s Soak Value is reduced by 2(T) until the start of your next turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "rapid_fist",
    name: "Rapid Fist",
    category: "Physical",
    description: "Your Unarmed Physical Attacks move faster than the eye can see, allowing you to stun your opponents.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Strike Rolls of your Unarmed Physical Attacks by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Unarmed Physical Attack and deal Damage, make a Might Clash against them. If you win, reduce their Awareness and Defense Value by 1(bT) until the start of your next turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "penetrating_fist",
    name: "Penetrating Fist",
    category: "Physical",
    description: "Your Unarmed Physical Attacks are strong enough to pierce an enemy’s defenses, letting you put a hole through the competition.",
    prerequisites: "Iron Fist or Rapid Fist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Dice Score of your Might Clashes by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Unarmed Physical Attack, make a Might Clash against them. If you win, increase the Damage Category of that Attacking Maneuver by 1.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "supreme_fist",
    name: "Supreme Fist",
    category: "Physical",
    description: "Thanks to your intense training, your Unarmed Physical Attacks are easier to perform and more potent, allowing you to apply extra pressure after striking your target.",
    prerequisites: "Penetrating Fist",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "When making an Unarmed Physical Attack, reduce the Ki Point Cost by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Unarmed Physical Attack, spend up to 6(bT) Ki Points. If you do, increase the Wound Roll by an equal amount.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Unarmed Physical Attack and deal Damage, make a Might Clash against them. If you win, that Opponent is knocked Prone. If they are already Prone, reduce that Opponent’s Life Points by 4(T).", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "masterful_integration",
    name: "Masterful Integration",
    category: "Racial",
    description: "You are able to make the most of the items you’ve Integrated.",
    prerequisites: "Android (Machine Mutant selected through Wonders of Technology)",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "When making an Attacking Maneuver, you can spend up to 2 Break Points to increase the Wound Roll by 2(T) for each Break Point spent.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "When you destroy a Weapon through the Mutant Core Choice effect of Energy Core, you may apply one of its Qualities to another applicable Weapon you have Integrated.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "combat_mode",
    name: "Combat Mode",
    category: "Racial",
    description: "Trading durability for pure power, you switch to an assault-oriented mode.",
    prerequisites: "Android, Force Score of 6+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While your Damage Reduction is 0, increase your Dodge Rolls by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Start of Turn", text: "Reduce your Damage Reduction to 0 until the start of your next turn. If you do, increase your Wound Rolls by an equal amount until the start of your next turn.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "nefarious_plating",
    name: "Nefarious Plating",
    category: "Racial",
    description: "You can manipulate your bio-armor in new ways, allowing you to incorporate a weapon into your body.",
    prerequisites: "Arcosian, Tenacity Score of 6+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Soak Value by 1(bT) while you are not wearing any piece of Apparel.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Upon gaining this Talent, create and Integrate a Physical Weapon with Small or Standard Size and the Hidden Quality.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "dedicated_sniper",
    name: "Dedicated Sniper",
    category: "Racial",
    description: "You’ve dedicated yourself to the art of striking your opponents’ vitals.",
    prerequisites: "Cerealian, Insight Score of 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You may use the first effect of Patient Sniper an additional 2 times per Combat Round and your uses of the Exploit Maneuver do not count towards your Diminishing Offense.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "If an Ally hits an Opponent with an Attacking Maneuver, you may spend 3(bT) Ki Points to make that Opponent trigger that Ally’s Exploit Maneuver. This effect can only be triggered once each Combat Round for each Ally.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "technical_prowess",
    name: "Technical Prowess",
    category: "Racial",
    description: "Your adaptability has grown to new heights, giving you access to new options.",
    prerequisites: "Earthling, Insight Score of 6+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "When you use the Aura Maneuver, for this instance of using your chosen Aura, you may either: Halve the Ki Point Cost to activate the Aura (this can reduce the Ki Point Cost below the minimium). This effect does not reduce the amount of Ki Points required to be spent at the beginning of each subsequent turn to maintain the Aura. Add a rank of an Aura Advantage with a TP cost of up to 10 TP to your chosen Aura.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Add the below effect to the options of Experienced Fighter: Iron Guard [Triggered] : Increase your Soak Value by 2(T) until the end of the Combat Round. Increase your Damage Reduction by 1/2 of your Insight Modifier against the next Attacking Maneuver that targets you this Combat Round.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "acute_triple_vision",
    name: "Acute Triple Vision",
    category: "Racial",
    description: "Your three eyes make you that much more perceptive, allowing you to keep track of your opponent, even while you’re both moving.",
    prerequisites: "Earthling (Triclops), Insight Score of 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Perception Skill Bonus by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you haven’t used the second effect of Earthling Resolve this Combat Round and your Opponent dodges your Attacking Maneuver, make a Clash (Perception vs Acrobatics/Stealth/Perception) against that Opponent. If you win, you may choose to ignore the second effect of Earthling Resolve for the remainder of this Combat Round to use that Attacking Maneuver again as an Out-of-Sequence Maneuver without spending any Ki Points (even if you normally wouldn’t be able to use that Attacking Maneuver again – for example, a Signature Technique).", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered/Start of Round", text: "This Combat Round, Diminishing Offense doesn’t apply until after your 4th Attacking Maneuver. If you use this effect, ignore the second effect of Three-Eyes.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "battle_goo",
    name: "Battle Goo",
    category: "Racial",
    description: "Your Goops are now combat-ready!",
    prerequisites: "Majin, Personality Score of 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "This Talent counts as a Minion Talent for your effects.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase your maximum number of Minions by 2.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "passive", keyword: "Passive", text: "Increase the Life Points of your Goops by 10(bT).", usageLimit: null, maxUses: null },
      { level: 4, activationType: "passive", keyword: "Passive", text: "Your Goops gain access to (and can use) the Intervene Maneuver.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "mini_majin",
    name: "Mini Majin",
    category: "Racial",
    description: "You can make a miniature copy of yourself out of Goop.",
    prerequisites: "Majin, Personality Score of 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "This Talent counts as a Minion Talent for your effects.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase your maximum number of Minions by 2.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "passive", keyword: "Passive", text: "When creating a Goop, you can spend 3(T) Ki Points to instead create a Duplicate Minion. If you do, that Duplicate Minion’s base Size Category is a Size Category smaller than you. They are not considered Goops and do not suffer from the same restrictions.", usageLimit: null, maxUses: null },
      { level: 4, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you are hit by an Attacking Maneuver that deals Direct or Lethal Damage, create a Goop on an unoccupied adjacent Square.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "saiyan_tail_resistance",
    name: "Saiyan Tail Resistance",
    category: "Racial",
    description: "You have overcome the inherent weakness of your tail.",
    prerequisites: "Saiyan (Tailed selected through Saiyan Heritage), Tenacity Score of 6+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Soak Value by 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "You do not become Prone upon suffering from Tail Restraint.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "automatic", keyword: "Automatic", text: "If your effect for the Option effect of Saiyan Heritage becomes Tailless, lose this Talent and gain another Character Perk to be spent immediately.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "tuffle_parasite",
    name: "Tuffle Parasite",
    category: "Racial",
    description: "You are able to leave behind a piece of yourself in the people you’ve possessed.",
    prerequisites: "Neo-Tuffle (Parasite Subrace)",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "This Talent counts as a Minion Talent for your effects.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase your maximum number of Minions by 2.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered", text: "After leaving the body of a Minion you possessed (see — One-Sided Fusions ), they become your Minion. This effect does not apply if that Minion is a Special Minion.", usageLimit: null, maxUses: null },
      { level: 4, activationType: "triggered", keyword: "Triggered", text: "After leaving the body of a Character you possessed, reduce the Dice Score of their Cognitive Save on any Clash against you by 1(T) for the remainder of the Combat Encounter. This effect cannot stack.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "frenzy",
    name: "Frenzy",
    category: "Raging",
    description: "Your rage pushes you to greater heights, allowing you to hit harder and more often.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "When making an Attacking Maneuver while in the Raging State, you can spend up to 4(bT) Life Points to increase your Strike Roll by 1(T) for every 2(bT) Life Points spent.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Power, 1/Encounter", text: "Regain 4(bT) Ki Points for every Health Threshold you are below. You must be in the Raging State to use this effect.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "burning_anger",
    name: "Burning Anger",
    category: "Raging",
    description: "Your rage burns through your opponent’s defenses and allows you to ignore your wounds.",
    prerequisites: "Frenzy",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "When you hit an opponent with an Attacking Maneuver while in the Raging State, reduce their Soak Value by 1(bT) until the end of your turn.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Raging, 1/Encounter", text: "Regain 5(bT) Life Points for every Health Threshold you are below.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "berserk_resolve",
    name: "Berserk Resolve",
    category: "Raging",
    description: "Your rage is so powerful, it protects you from damage.",
    prerequisites: "Tenacity Score of 6+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are in the Raging State, increase your Soak Value by 2(T) but reduce your Defense Value by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Threshold", text: "Enter the Raging State until the end of your next turn. If you are already in the Raging State when this effect occurs, instead increase your Soak Value by an additional 2(T) until the end of your next turn.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "practiced",
    name: "Practiced",
    category: "Skill",
    description: "You are especially adept in a variety of skills.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Roll your Base Dice twice for any Skill Check and use the highest result.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Gain a Skill Rank in 2 different Skills of your choice.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "show_stopping_performance",
    name: "Show Stopping Performance",
    category: "Skill",
    description: "You perform for everyone on the battlefield, inspiring awe in your allies, confidence in yourself, or terror in your enemies.",
    prerequisites: "2+ Skill Ranks in Performance",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Natural Result of your Performance Skill Checks by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "option", keyword: "Option", text: "Upon gaining this Talent, select an effect from the list below: Aggressive Performance [Triggered, 1/Round] : When using the Hype Maneuver, increase your Wound Rolls by an additional 2(T) until the end of your next turn. This effect cannot stack. Flexible Performance [Triggered, 1/Round] : When using the Hype Maneuver, increase your Dodge Rolls by an additional 1(T) until the end of your next turn. This effect cannot stack. Precision Performance [Triggered, 1/Round] : When using the Hype Maneuver, increase your Strike Rolls by an additional 1(T) until the end of your next turn. This effect cannot stack. Invigorating Performance [Triggered, 1/Round] : When using the Hype Maneuver, regain 5(bT) Life and Ki Points. Motivating Performance [Triggered, 1/Round] : When using the Hype Maneuver, all Allies within a Sphere AoE of you have their Combat Rolls increased by 1/4 (rounded up) of your Personality Modifier until the end of your next turn. This effect cannot stack. Distracting Performance [Triggered, 1/Round] : When using the Hype Maneuver, make a Morale Clash against all Opponents within a Large Sphere AoE. If you win, they suffer from the Guard Down Combat Condition against the next 2 Attacking Maneuvers made with them as a target before the end of your next turn. Explosive Performance [Triggered, 1/Round] : When using the Hype Maneuver, if your last Maneuver was an Attacking Maneuver, reduce the Life Points of the Opponent(s) hit by that Attacking Maneuver by your Personality Modifier and 1/2 (rounded up) of your Might.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "dynamic_hype",
    name: "Dynamic Hype",
    category: "Skill",
    description: "With a variety of performances in your arsenal, your shows are unparalleled!",
    prerequisites: "3+ Skill Ranks in Performance, Show Stopping Performance",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Upon gaining this Talent, select 2 additional effects through the Option effect of Show Stopping Performance. You can only use and benefit from one of these effects at any one time.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When using the Hype Maneuver, increase your Soak Value by 1(T) until the end of your next turn. This effect cannot stack.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "team_pose",
    name: "Team Pose",
    category: "Skill",
    description: "With the others in your group, your group performance grows stronger as everyone performs together.",
    prerequisites: "Show Stopping Performance",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "If an Ally uses the Hype Maneuver within a Sphere AoE centered on you, regain 2(bT) Ki Points.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you use the Hype Maneuver, any Allies within Sphere AoE centered on you that have the Show Stopping Performance Talent may use the Hype Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "spotlight_specialist",
    name: "Spotlight Specialist",
    category: "Skill",
    description: "You live for the spotlight, you crave it; when all eyes are on you, you excel.",
    prerequisites: "4+ Skill Ranks in Performance, Dynamic Hype",
    effects: [
      { level: 1, activationType: "ruling", keyword: "Ruling", text: "Upon gaining this Talent, select a Specialty for Performance as if it was an Encompassing Skill. This Specialty always has the same number of Skill Ranks as your Performance Skill, but you score a Critical Result on a Natural Result of 7 or higher when using your Specialty. When appropriate (ask your ARC), you may use your Specialty instead of the typical Performance Skill.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Your Hype Maneuver can use your Personality Modifier instead of the Score for its effects.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you use the Hype Maneuver, you may use two effects from the Option effect of Show Stopping Performance and benefit from both of them.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "analytic_fighter",
    name: "Analytic Fighter",
    category: "Skill",
    description: "Studious and perceptive, you take the time to pick apart an enemy’s strengths and weaknesses.",
    prerequisites: "2+ Skill Ranks in Investigation",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Natural Result of your Investigation Skill Checks by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "option", keyword: "Option", text: "Upon gaining this Talent, select an effect from the list below: Damage Analysis [Triggered, 1/Round] : If you use the Investigation effect of the Analysis Maneuver, make a Clash (Investigation vs Intuition/Bluff/Stealth) against the targeted Character. Regardless of if you win or lose, increase your Wound Rolls against that target by 1(bT) until the end of your next turn. If you won the Clash for this effect, that target gains the Broken Combat Condition until the end of your next turn. Weak Point Analysis [Triggered, 1/Round] : If you use the Investigation effect of the Analysis Maneuver, make a Clash (Investigation vs Intuition/Bluff/Stealth) against the targeted Character. Regardless of if you win or lose, your next Attacking Maneuver made against the targeted Character during this Combat Round gains a bonus of 2(T) to its Strike Roll. If you won the Clash for this effect, you may apply the Called Shot Maneuver as an Out-of-Sequence Maneuver (without spending an Action through its effect) to that Attacking Maneuver. Offensive Analysis [Triggered, 1/Round] : If you use the Investigation effect of the Analysis Maneuver, make a Clash (Investigation vs Intuition/Bluff/Stealth) against the targeted Character. Regardless of if you win or lose, increase your Strike Rolls against that target by 1(bT) until the end of your next turn. If you won the Clash for this effect, increase the Strike Rolls of all Allies against that Opponent by an equal amount. Defensive Analysis [Triggered, 1/Round] : If you use the Investigation effect of the Analysis Maneuver, make a Clash (Investigation vs Intuition/Bluff/Stealth) against the targeted Character. Regardless of if you win or lose, increase your Dodge Rolls against that target by 1(bT) until the end of your next turn. If you won the Clash for this effect, increase the Dodge Rolls of all Allies against that Opponent by an equal amount. Critical Tactics [Triggered, 1/Round] : If you use the Investigation effect of the Analysis Maneuver, reduce the Critical Target of all Strike and Wound Rolls made against the target by 1 until the end of your next turn. Teamwork Tactics [Triggered, 1/Round] : If you use the Investigation effect of the Analysis Maneuver, increase the Combat Rolls of all Allies against that Opponent by 1/4 (rounded up) of your Scholarship Modifier (this effect cannot stack – if multiple Characters use this effect, only gain the highest bonus) until the end of your next turn. Counter Tactics [Triggered, 1/Round] : If you use the Investigation effect of the Analysis Maneuver, gain an additional Counter Action to be spent before the start of your next turn. You may allow Allies to use this Counter Action if it is in response to the Attacking Maneuver of the targeted Character.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "complete_analysis",
    name: "Complete Analysis",
    category: "Skill",
    description: "You are able to completely dissect a target’s fighting style.",
    prerequisites: "2+ Skill Ranks in Intuition, Analytic Fighter",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Natural Result of your Intuition Skill Checks by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "When you use the Analysis Maneuver, you can use both effects simultaneously.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you use the Intuition effect of the Analysis Maneuver, all of your Allies benefit from its effects as if they had used it themselves.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "flexible_planning",
    name: "Flexible Planning",
    category: "Skill",
    description: "You are able to adapt to changes in the battlefield and adjust your strategies accordingly.",
    prerequisites: "3+ Skill Ranks in Investigation, Analytic Fighter",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Upon gaining this Talent, select 2 additional effects through the Option effect of Analytic Fighter. You can only use and benefit from one of these effects at any one time.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When using the Analysis Maneuver, regain 4(bT) Ki Points.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "master_strategist",
    name: "Master Strategist",
    category: "Skill",
    description: "Like any true tactician, you have backup plans for your backup plans.",
    prerequisites: "4+ Skill Ranks in Investigation, Flexible Planning",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Your Investigation Maneuver can use your Scholarship Modifier instead of the Score for its effects.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When using the Analysis Maneuver, you may target an additional Opponent to apply its effects to.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If there is only one Opponent, when you use the Analysis Maneuver against that Opponent, you may use two effects from the Option effect of Analytic Fighter and benefit from both of them.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "genius_designer",
    name: "Genius Designer",
    category: "Skill",
    description: "Your ability to create items far surpasses all others.",
    prerequisites: "Scholarship Score of 4+, 2+ Skill Ranks in any Specialization of the Craft Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Natural Result of all Craft Skill Checks by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Upon gaining this Talent, choose one Craft Skill Specialization you possess. You may use the Skill Bonus of that Specialization for any Craft Skill check.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "counter_jury_rigging",
    name: "Counter Jury-rigging",
    category: "Skill",
    description: "You are able to modify your weapons to suit the situation at hand, though such modifications don’t last.",
    prerequisites: "2+ Skill Ranks in Investigation and Craft (Weapon), Combat Expertise, Weapon Specialist",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "While you are benefiting from the effects of the Analysis Maneuver, increase your Wound Rolls with Armed Attacks by an additional 2(T).", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered/Start of Combat Round", text: "Select a Weapon you possess and apply an applicable Weapon Quality to that Weapon until the end of the Combat Round (this can exceed the limit on Weapon Qualities).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "silent_footsteps",
    name: "Silent Footsteps",
    category: "Skill",
    description: "You are able to dampen the sounds of your movement, allowing you to pass unnoticed.",
    prerequisites: "Footwork, 2+ Skill Ranks in the Stealth Skill",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "When you use the Rapid Movement effect of the Movement Maneuver, make a Skill Clash (Stealth vs Perception) against all of your Opponents. If you win against an Opponent, they suffer from the Oblivious Combat Condition until the end of your next turn or until after you make an Attacking Maneuver against them.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "When making a Concealment Skill Check, you may use your Stealth Skill Bonus instead. If you do, reduce your Dice Score by 2.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "stealth_strike",
    name: "Stealth Strike",
    category: "Skill",
    description: "Slipping through the shadows, your strikes are deadly when you attack from hiding.",
    prerequisites: "2+ Skill Ranks in the Stealth Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Strike and Wound Rolls against Opponents with the Oblivious Combat Condition by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When making an Attacking Maneuver against an Opponent, make a Skill Clash (Stealth vs Perception). If you win, they gain the Oblivious Combat Condition for the duration of this Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "assassinate",
    name: "Assassinate",
    category: "Skill",
    description: "When you attack from hiding, your strikes become even more lethal.",
    prerequisites: "Stealth Strike, 3+ Skill Ranks in the Stealth Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Wound Rolls against Opponents with the Oblivious Combat Condition by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Attacking Maneuver while they are suffering from the Oblivious Combat Condition, increase the Damage Category of that Attacking Maneuver by 1.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "master_assassin",
    name: "Master Assassin",
    category: "Skill",
    description: "You are peerless in the realm of dealing death from the shadows.",
    prerequisites: "Assassinate, 5+ Skill Ranks in the Stealth Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Wound Rolls against Opponents with the Oblivious Combat Condition by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "You may use the 1/Round effect of Stealth Strike an additional time each Combat Round.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "acrobat_star",
    name: "Acrobat Star",
    category: "Skill",
    description: "You are extremely skilled at gymnastics and acrobatics.",
    prerequisites: "2+ Skill Ranks in the Acrobatics Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You may use the Flip Maneuver as an Instant Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you use the Flip Maneuver, instead of moving any number of Squares, you can stop being Prone.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "expert_pilot",
    name: "Expert Pilot",
    category: "Skill",
    description: "You are a trained pilot, skilled in the use of Vehicles and Battle Jackets.",
    prerequisites: "2+ Skill Ranks in the Pilot Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Reduce the Action Cost to enter a Vehicle or Battle Jacket by 1. If it would reduce the Action Cost to 0, it becomes an Instant Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase all of your Dodge Rolls made with a Vehicle by 1(T) for every 2 Skill Ranks of Piloting gained. If you have 5 Skill Ranks of Piloting, reduce your Critical Target when rolling Dodge Rolls while the Pilot of a Vehicle by 1.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "passive", keyword: "Passive", text: "Ignore the Battle Jacket Penalty.", usageLimit: null, maxUses: null },
      { level: 4, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you would make a Combat Roll while Piloting a Battle Jacket, you may apply your Piloting Skill Bonus to that roll.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "yoink",
    name: "Yoink",
    category: "Skill",
    description: "You know how to slyly take anything unattended, startling foes.",
    prerequisites: "2+ Skill Ranks in the Thievery Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "When using the Snatch Maneuver, you can also take Weapons possessed by another Character that they have not currently equipped.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you successfully use the Snatch Maneuver to take an Item from another Character, they gain the Guard Down Combat Condition against your next Attacking Maneuver against them during this turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "battlefield_doctor",
    name: "Battlefield Doctor",
    category: "Skill",
    description: "You are adept in medicine, allowing you to easily treat any maladies.",
    prerequisites: "2+ Skill Ranks in the Medicine Skill",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "Upon using the Treatment Maneuver, you can target yourself instead of an Ally within your Melee Range.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you use the Treatment Maneuver, the target ignores any penalties from Health Thresholds until the end of their next turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "refined_sensor",
    name: "Refined Sensor",
    category: "Skill",
    description: "Your ability to detect ki is unmatched.",
    prerequisites: "2+ Skill Ranks in the Clairvoyance Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You can use your Clairvoyance Skill Bonus instead of Perception for any Perception Skill Checks but reduce your Dice Score by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "You may use the Perception option of the Search Maneuver.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered", text: "If you win the Skill Clash for the Clairvoyance effect of the Search Maneuver, you become aware of their Alignment.", usageLimit: null, maxUses: null },
      { level: 4, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you win the Skill Clash for the Clairvoyance effect of the Search Maneuver, increase your Strike and Dodge Rolls against that Opponent by 1(T) until the end of the Combat Encounter.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "master_tamer",
    name: "Master Tamer",
    category: "Skill",
    description: "You are able to connect with animals, even those that work for your enemies.",
    prerequisites: "2+ Skill Ranks in the Creature Handling Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Natural Result of your Creature Handling Skill Checks by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "As an Instant Maneuver, target an Opponent’s Minion. Make a Skill Clash (Creature Handling) against their Master. If you win, that Minion makes a Basic Attack Maneuver against the Master – all Combat Rolls involved are Urgent.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "terrifying_presence",
    name: "Terrifying Presence",
    category: "Skill",
    description: "Your ability to inspire fear in your enemies is truly astounding.",
    prerequisites: "2+ Skill Ranks in the Intimidation Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "When you use the Terrify Maneuver, you can target all Opponents within a Sphere AoE centered on you, or target a single Opponent up to 8 Squares away from you.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you knock an Opponent through a Health Threshold, you may use the Terrify Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "desperate_distraction",
    name: "Desperate Distraction",
    category: "Skill",
    description: "You can read your opponents and skillfully deceive them into creating an opening for you to fight back!",
    prerequisites: "2+ Skill Ranks in Bluff and 2+ Skill Ranks in Intuition",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You gain access to the Dirty Trick Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Round", text: "If you are below the Injured Health Threshold, you may use the Dirty Trick Maneuver as an Instant Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "last_ditch_effort",
    name: "Last Ditch Effort",
    category: "Skill",
    description: "You have one last trick up your sleeve for emergencies, allowing you to stand tall even when your back is against the wall.",
    prerequisites: "Desperate Distraction",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Natural Result of your Bluff Skill Checks by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 2/Encounter", text: "If you win the Clash for the Dirty Trick Maneuver, after completing that Maneuver, you may use the Basic Attack Maneuver or Signature Technique Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "encounter", maxUses: 2 },
    ]
  },
  {
    id: "survivalist",
    name: "Survivalist",
    category: "Skill",
    description: "You are skilled at adapting to extreme environmental conditions.",
    prerequisites: "2+ Skill Ranks in Survival",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Reduce the Critical Target for your Survival Skill Checks by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "While you are in a Battle Weather that you are not suffering the effects of, increase your Defense Value and Soak Value by 1(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "team_survivalist",
    name: "Team Survivalist",
    category: "Skill",
    description: "You are skilled enough to protect others from the effects of harsh environments.",
    prerequisites: "Survivalist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You do not trigger the Exploit Maneuver when you use the Brace Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Your Allies are unaffected by the effects of any Battle Weather created by you.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered", text: "If you use the Brace Maneuver, apply its effects to all Allies within your Melee Range. If you would make a Clash against an Opponent through the effects of this Brace Maneuver, the results of your Clash apply to all of your Allies within your Melee Range (instead of them making independent Clashes).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "feint_master",
    name: "Feint Master",
    category: "Skill",
    description: "You are most effective when tricking your opponents into opening their guard for your attacks.",
    prerequisites: "2+ Skill Ranks in Bluff",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You can wait until you’ve made your Strike Roll for your Attacking Maneuver before you declare the Feint Maneuver – treating it as an Out-of-Sequence Maneuver instead. If you do declare the Feint Maneuver, your Opponent regains any Ki Points spent on effects or Counter Actions spent on Counter Maneuvers in response to your Attacking Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you would make an Attacking Maneuver through the effects of the Feint Maneuver, you can Ki Wager up to 1/2 of your Max Capacity on this Attacking Maneuver.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "archetype_focus",
    name: "Archetype Focus",
    category: "Specialization",
    description: "You have specialized in a specific type of attack.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Upon gaining this Talent, select a Foundation. Decrease the Critical Target by 1 for your Strike and Wound Rolls when using that Foundation.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase the bonus from Surgency by 2(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "precision_kata",
    name: "Precision Kata",
    category: "Specialization",
    description: "Trained to increase your accuracy in your chosen type of attack, your blows land precisely where you mean for them to.",
    prerequisites: "Archetype Focus, Insight Score of 5+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Decrease the Critical Target by 1 for your Strike Rolls when using the Foundation chosen in the first effect of Archetype Focus.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "If you score a Critical Result on your Strike Roll for an Attacking Maneuver made with your selected Foundation from Archetype Focus, increase your Wound Roll for that Attacking Maneuver by 3(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "brutal_kata",
    name: "Brutal Kata",
    category: "Specialization",
    description: "Your attacks of your chosen type are more powerful.",
    prerequisites: "Archetype Focus, Force or Magic Score of 5+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Decrease the Critical Target by 1 for your Wound Rolls when using the Foundation chosen in the first effect of Archetype Focus.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "If you score a Critical Result on your Wound Roll for an Attacking Maneuver made with your selected Foundation from Archetype Focus, increase your Wound Roll for that Attacking Maneuver by 3(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "profile_focus",
    name: "Profile Focus",
    category: "Specialization",
    description: "You are especially adept at using a specific type of attack.",
    prerequisites: "Archetype Focus (Physical/Energy Foundation chosen)",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Upon gaining this Talent, select a Profile (except Crushing or Cutting) from the Foundation you selected through Archetype Focus. Increase your Wound Rolls for the selected Profile by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "You may use your selected Profile twice during each Combat Round through the Basic Attack Maneuver, instead of only being able to use it once.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "slow_starter",
    name: "Slow Starter",
    category: "Starter",
    description: "You are partial to holding back your true power until a foe has proven worthy.",
    prerequisites: "You do not possess Jump Start, 2+ Skill Ranks in Concealment",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Dice Score of your Clairvoyance and Concealment Skill Checks by 2.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "While you have a stack of Holding Back, reduce the Ki Point Cost of all Maneuvers by 1(T).", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered/Start of Combat Encounter", text: "Use the Holding Back Maneuver as an Out-of-Sequence Maneuver.", usageLimit: null, maxUses: null },
      { level: 4, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you lose all stacks of Holding Back, you may apply the effects of Legend Realized even if you are not in a Transformation.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "warm_up",
    name: "Warm Up",
    category: "Starter",
    description: "You are able to slowly limber up and ready yourself for battle, even as that battle wages on.",
    prerequisites: "Slow Starter",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Encounter", text: "While you are Holding Back, you can spend 1 Action to Warm Up until the end of your next turn. While you are Warmed Up, you cannot stop Holding Back but you may ignore the effects of 1 stack of Holding Back (you still treat your Tier of Power as if it was lower for the sake of Ki Point Costs).", usageLimit: "encounter", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you lose all stacks of Holding Back, you may use the Power Up or Transformation Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "reserved_combatant",
    name: "Reserved Combatant",
    category: "Starter",
    description: "Your patience in battle is rewarded, and you are always ready to unleash your full power in an emergency.",
    prerequisites: "Slow Starter, Combat Expertise",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered/Start of Combat Round, Resource", text: "If you are Holding Back, gain a stack of Patience (up to 10).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "automatic", keyword: "Automatic, 1/Encounter", text: "When you lose all stacks of Holding Back, lose all Patience Stacks and regain x(bT) Ki Points, where x is equal to 2x the amount of Patience stacks you lost.", usageLimit: "encounter", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 3/Round", text: "When you use an Attacking Maneuver/Unique Ability or are targeted by an Attacking Maneuver/Unique Ability, you can ignore any stacks of Holding Back for the duration of that Maneuver.", usageLimit: "round", maxUses: 3 },
    ]
  },
  {
    id: "conserving_strength",
    name: "Conserving Strength",
    category: "Starter",
    description: "As you patiently raise your power, you can store up the energy you don’t use to unleash the moment you go all out.",
    prerequisites: "Reserved Combatant, Tier of Power 4+, access to a Transformation with a Tier of Power Requirement of 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your maximum number of Patience Stacks to 15.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "The second effect of Reserved Combatant loses the Automatic Keyword and gains the Triggered Keyword.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "passive", keyword: "Passive", text: "You do not need to be Holding Back to gain Patience Stacks through the first effect of Reserved Combatant, as long as you are not in a Transformation with a Tier of Power Requirement of 4+.", usageLimit: null, maxUses: null },
      { level: 4, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you enter a Transformation with a Tier of Power Requirement of 4+, lose all Patience Stacks and regain x(bT) Ki Points, where x is equal to 2x the amount of Patience stacks you lost.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "jump_start",
    name: "Jump Start",
    category: "Starter",
    description: "You always use your full power from the start.",
    prerequisites: "You do not possess Slow Starter",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Dice Score of your Acrobatics Skill Checks by 2.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "While you are not Holding Back, increase the Wound Rolls of all your Attacking Maneuvers by 1(bT).", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered/Start of Combat Encounter", text: "You may use the Power Up Maneuver as an Out-of-Sequence Maneuver. If you do, ignore the current Initiative Order and take your turn first (if multiple characters use this effect, follow the Initiative Order among them).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "all_out_start",
    name: "All-Out Start",
    category: "Starter",
    description: "Not only do you refuse to hold back against your opponents, you make sure to go all out, crushing them before they can mount an effective defense.",
    prerequisites: "Jump Start",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are not Holding Back, increase the Wound Rolls of your Signature Techniques by 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "If you use the Power Up Maneuver through the effects of the Jump Start Talent, you may use the Transformation Maneuver immediately afterwards as an Out-of-Sequence Maneuver. If you do, at the end of your turn, leave the Transformation you entered through this effect (you do not suffer Stress Exhaustion) or pay 5(bT) Ki Points to remain in that Transformation.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered/Start of Combat Encounter", text: "Increase your Might by 1(T) until the end of your turn and your Combat Rolls by 1(T) until the end of your next turn.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "muscular_warrior",
    name: "Muscular Warrior",
    category: "Super Stack",
    description: "Your intense training has paid off, allowing you to effectively wield the massive strength you bear.",
    prerequisites: "Force Score of 6+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Ignore the penalties for one stack of Super Stack.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Encounter", text: "While you are below the Bruised Health Threshold, you may gain 1 Super Stack as an Instant Maneuver for the remainder of the Combat Encounter.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "hefty_muscle",
    name: "Hefty Muscle",
    category: "Super Stack",
    description: "Thanks to the incredible bulk you’ve achieved, you can deal damage to your opponent even when your attacks miss their mark.",
    prerequisites: "Muscular Warrior",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Dice Category of your Super Stack Extra Dice by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you fail to hit an Opponent with an Attacking Maneuver, still roll the Wound Roll for that Attacking Maneuver. If you do, halve the Wound Roll and apply it to the Opponent as if they were hit by that Attacking Maneuver. This does not count as hitting an Opponent for any effects.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "steel_muscle",
    name: "Steel Muscle",
    category: "Super Stack",
    description: "Your muscular build serves almost as a layer of armor, protecting you from attacks.",
    prerequisites: "Muscular Warrior",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Soak Value by 1/2 of the Soak Value gained from your Super Stacks.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you are hit by an Attacking Maneuver, gain Damage Reduction equal to 1/4 of your Force Modifier for the duration of that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "herculean_power",
    name: "Herculean Power",
    category: "Super Stack",
    description: "Your godly might calls forth a wellspring of power in your strongest attacks.",
    prerequisites: "Any talent that has ‘Muscular Warrior’ as a prerequisite",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "If you would use an Ultimate Signature Technique while you possess at least 1 stack of Super Stack, increase the Wound Roll of that Signature Technique by 1(bT) for each Energy Charge.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you have used the Energy Charge Maneuver but not released the declared Attacking Maneuver and are targeted by an Attacking Maneuver, you may gain 1(T) Soak Value for each time you’ve used the Energy Charge Maneuver since you declared your Attacking Maneuver for the duration of the Attacking Maneuver that targeted you.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "second_wind",
    name: "Second Wind",
    category: "Surge",
    description: "You are able to recover your stamina more quickly than most.",
    prerequisites: "Personality Score of 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the amount of Life and Ki Points you regain through a Surge by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Encounter", text: "Use a Surge as an Instant Maneuver.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "never_surrender",
    name: "Never Surrender",
    category: "Surge",
    description: "Your raw determination keeps you going even on the brink of death.",
    prerequisites: "Second Wind",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Treat your Tier of Power as if it was 1 higher when making any type of Surge.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you use a Power Surge while below the Injured Health Threshold, enter the Superior State until the end of your next turn.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "lions_heart",
    name: "Lion’s Heart",
    category: "Surge",
    description: "You do not give up the fight until your final breath is drawn.",
    prerequisites: "Never Surrender",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "For each Health Threshold you are below, increase the amount of Life Points and Ki Points regained through Surges by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you take an amount of Damage that would reduce your Life Points to 0, you may use an available Surge to use a Healing Surge before that damage is deducted from your Life Points.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "lightning_surge",
    name: "Lightning Surge",
    category: "Surge",
    description: "When you recover your stamina, your combat effectiveness rises.",
    prerequisites: "Never Surrender, Resilience",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you use a Healing Surge, you may increase your Soak Value by 2(T) until the end of your next turn.", usageLimit: "encounter", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you use a Power Surge, you may increase your Wound Rolls by 2(T) until the end of your next turn.", usageLimit: "encounter", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If your Life Points would be increased beyond a Health Threshold you are currently under after using the effects of a Healing Surge, you may use the Power Up Maneuver or Transformation Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "mental_warfare",
    name: "Mental Warfare",
    category: "Taunt",
    description: "You are not above breaking a target’s spirit to win a fight.",
    prerequisites: "Personality Score of 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Gain access to the Insult Special Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If an Opponent is knocked through a Health Threshold by an Attacking Maneuver, you may use the Insult Maneuver (targeting that Opponent) as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "taunt",
    name: "Taunt",
    category: "Taunt",
    description: "You are skilled at convincing an opponent to focus their assault on you.",
    prerequisites: "Mental Warfare, Personality Score of 6+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Gain 1(bT) Damage Reduction against all Attacking Maneuvers made by characters with the Compelled Combat Condition.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you win the Morale Clash for the Insult Maneuver, that Opponent gains the Compelled Combat Condition against you until the start of your next turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "improved_taunt",
    name: "Improved Taunt",
    category: "Taunt",
    description: "Even more skilled, you are capable of drawing all of your enemies’ attention.",
    prerequisites: "Taunt, Personality Score of 8+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Dice Score for any Morale Clash by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "When you use the Insult Maneuver, you can target all Opponents within a Sphere AoE centered on you.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "flexible_flanker",
    name: "Flexible Flanker",
    category: "Teamwork",
    description: "You are skilled in surrounding an opponent and taking them down with your allies.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "If an Ally is within the Melee Range of an Opponent, increase all of your Strike and Wound Rolls made against that Opponent by 1(T) and 2(T) respectively.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "supporting_defender",
    name: "Supporting Defender",
    category: "Teamwork",
    description: "Able to create openings in your opponents’ attacks, you provide perfect defensive support for your allies.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "If you are within the Melee Range of an Opponent, increase all of your Allies’ Dodge Rolls or Strike Rolls when using the Parry effect of the Defend Maneuver made against that Opponent by 1(T).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "opportunist",
    name: "Opportunist",
    category: "Teamwork",
    description: "You leap to the ready anytime an opportunity to injure an enemy presents itself.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If an Ally knocks an Opponent through a Health Threshold, you may use the Exploit Maneuver against that Opponent. If you spend 4(bT) Ki Points, you may use the Exploit Maneuver triggered by this effect without spending a Counter Action.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "power_gifter",
    name: "Power Gifter",
    category: "Teamwork",
    description: "You are adept in sharing your energy with others with minimal loss of efficiency.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Halve the consumption of your Capacity Rate through the effects of the Empower Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you possess any number of Power Stacks and use the Empower Maneuver, you may transfer those Power Stacks to the Ally you targeted with the Empower Maneuver. The maximum number of Power Stacks you can transfer is equal to the amount of Actions you spent on the Empower Maneuver and cannot allow your targeted Ally to exceed their maximum number of Power Stacks. The Power Stacks last until the end of your targeted Ally’s next turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "teamwork",
    name: "Teamwork",
    category: "Teamwork",
    description: "You are especially skilled in providing tactical support for your allies in combat.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Double the maximum amount you can Ki Wager when using the United Attack Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When using the United Attack Maneuver, increase your targeted Ally’s Strike and Wound Rolls by 1(T) and 2(T) respectively for that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "synchronized_combatants",
    name: "Synchronized Combatants",
    category: "Teamwork",
    description: "You are truly in sync with another person, allowing you two to act efficiently as a single unit.",
    prerequisites: "Teamwork, an Ally takes this Talent at the same time",
    effects: [
      { level: 1, activationType: "automatic", keyword: "Automatic", text: "Choose one Ally when you take this Talent who has also taken this talent and has chosen you. You are now Synchronized Partners.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "While you and your Synchronized Partner are both within each others’ Melee Ranges, increase your Combat Rolls by 1(T) and the amount of Life/Ki Points you would regain from any Surges by 3(bT), using the Tier of Power of your Synchronized Partner.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "2/Encounter, 1/Round", text: "You may use the Intervene Maneuver without spending a Counter Action. You can only use this effect if the targeted Ally is your Synchronized Partner.", usageLimit: "round", maxUses: 1, encounterLimit: 2 },
      { level: 4, activationType: "passive", keyword: "Passive", text: "If you enter a Fusion with your Synchronized Partner, that Fusion is treated as if their Synchronized Partner is always in their Melee Range and they are within the Melee Range of their Synchronized Partner.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "superior_synchronization",
    name: "Superior Synchronization",
    category: "Teamwork",
    description: "Your synchronicity with your partner is uncanny, to the point that it almost seems like you can communicate telepathically.",
    prerequisites: "Synchronized Combatants, Tier of Power 3+, Your Synchronized Partner takes this talent at the same time",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you and your Synchronized Partner are within each others’ Melee Ranges, increase your Wound Rolls by an additional 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Encounter", text: "If your Synchronized Partner would use the Power Up or Transformation Maneuver while within your Melee Range, you may immediately use the same Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "encounter", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "1/Encounter", text: "You may use the United Attack Maneuver without spending an Action, if your targeted Ally is your Synchronized Partner.", usageLimit: "encounter", maxUses: 1 },
      { level: 4, activationType: "passive", keyword: "Passive", text: "Reduce the Performance Skill Check for the Metamoran Fusion Dance to the Expert DC, if the Character you are attempting to fuse with is your Synchronized Partner.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "desperate_support",
    name: "Desperate Support",
    category: "Teamwork",
    description: "You are able to offer assistance to your friends even when you cannot fight by their side.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Encounter", text: "While you are Defeated, you may use the Empower Maneuver (as if you spent 2 Actions) or apply one of the listed effects of the third effect of Desperate Support as an Instant Maneuver.", usageLimit: "encounter", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered/Defeat", text: "Increase all of your Allies’ Combat Rolls by 1(bT) until the end of the next Combat Round.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you trigger the third effect of the Spectator State, you can choose to forgo regaining Life and Ki Points to instead apply one of the following effects: Go all out! [Triggered, 1/Round] : The Ally you targeted with the first effect of the Spectator State may use the Power Up Maneuver or Transformation Maneuver as an Out-of-Sequence Maneuver. Hang in there! [Triggered, 1/Round] : The Ally you targeted with the first effect of the Spectator State may ignore any Health Threshold Penalties until the start of your next turn. Stand strong! [Triggered, 1/Round] : The Ally you targeted with the first effect of the Spectator State has their Damage Reduction and Wound Rolls increased by 1(bT) until the start of your next turn. Dance for us. [Triggered, 1/Round] : The Ally you targeted with the first effect of the Spectator State has their Strike and Dodge Rolls increased by 1(bT) until the start of your next turn. You can do it! [Triggered, 1/Round] : The Ally you targeted with the first effect of the Spectator State has their Stress Bonus increased by 2 until the start of your next turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "bag_of_tricks",
    name: "Bag of Tricks",
    category: "Technique",
    description: "You have an arsenal of different techniques at your disposal, allowing you to rapidly switch between them to baffle or overwhelm your opponents.",
    prerequisites: "2+ Skill Ranks in 6+ Skills, access to 4+ Unique Abilities",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Reduce the Ki Point Cost of all Unique Abilities by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "If you make a Clash against an Opponent through the effects of a Unique Ability, increase your Dice Score for that Clash by 1(T). If the Clash is a Skill Clash, increase your Natural Result by 1 for that Clash instead.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you target an Opponent with a Unique Ability and win a Clash against them, you may use a Unique Ability that requires Standard Actions immediately as an Out-of-Sequence Maneuver. If you do, you still have to pay the Action Cost but the Action Cost is reduced by 1 (if this reduces it to 0, you do not have to pay any Actions).", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "energy_control",
    name: "Energy Control",
    category: "Technique",
    description: "You’ve learned to rein in your ki, fine-tuning your control.",
    prerequisites: "Scholarship or Insight Score of 5+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "When you gain this Talent, select one of your Signature Technique or Technical Unique Abilities. Reduce the Ki Point Cost for your selection by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When making a qualifying Signature Technique, you may spend 2(bT) Ki Points to apply a rank of the Homing Advantage to that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "technique_master",
    name: "Technique Master",
    category: "Technique",
    description: "Your control of ki has grown stronger, allowing you to perform amazing feats.",
    prerequisites: "Energy Control",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You can use the Signature Technique Maneuver an additional time per Combat Round, but you cannot use the same Signature Technique more than once per Combat Round.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Apply the Ki Point Cost reduction from the first effect of Energy Control to all of your Signature Techniques and Technical Unique Abilities.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "favored_technique",
    name: "Favored Technique",
    category: "Technique",
    description: "You have specialized in a single technique, to the point that it is associated with your presence on the battlefield.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "When you gain this Talent, select one of your Signature Techniques. This becomes your Favored Technique. When you use your Favored Technique through the Signature Technique Maneuver, it gains an Energy Charge.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "When you gain this Talent, you gain a pool of 4(bT) Technique Points. Each time you reach a new base Tier of Power, gain +4 Technique Points for this pool. This pool of Technique Points can only be used to add Advantages or remove Disadvantages from your Favored Technique. These Technique Points do not count towards your Signature Technique’s TP Cost for calculating the KP Cost or for the TP Cost limitations of Technique Progression.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "flexible_technique",
    name: "Flexible Technique",
    category: "Technique",
    description: "Your ability to manipulate your Favored Technique is beyond compare.",
    prerequisites: "Favored Technique",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered", text: "When using your Favored Technique, you may exchange any number of ranks in the Accurate Advantage for any number of ranks in the Power Shot Advantage, or vice versa. If your Favored Technique has neither of these Advantages, you may apply a rank of the Efficiency Advantage to it instead.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When using your Favored Technique, you may instead change the Profile for that Signature Technique to any other Profile within its Foundation for this singular use of that Signature Technique. If you do, it loses access to any Advantages or Disadvantages that no longer apply to its current Profile for this singular use of the Signature Technique. Calculate the change in Ki Point Cost accordingly for both the change in Profile and its remaining Advantages or Disadvantages. This Signature Technique, after the changes are applied, is considered its own Signature Technique but it still benefits from the effects of Favored Technique.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "powerful_technique",
    name: "Powerful Technique",
    category: "Technique",
    description: "Your Favored Technique has become truly powerful, leaving others in awe of its might.",
    prerequisites: "Favored Technique",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Wound Rolls of your Favored Technique by 2(T) for each Health Threshold you are below.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Encounter", text: "If you are below the Injured Health Threshold, you may use the Signature Technique Maneuver as an Instant Maneuver. If you do, you must use your Favored Technique. You must still meet any prerequisites for its use (such as the requisite number of Energy Charge Maneuvers, if your Favored Technique has the Mandatory Charge Disadvantage).", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "unique_technique",
    name: "Unique Technique",
    category: "Technique",
    description: "You’ve managed to make your special technique even more unique, creating something truly your own.",
    prerequisites: "Favored Technique",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Upon gaining this Talent, select a different Profile of the same Foundation as the Profile used for your Favored Technique. Apply that Profile’s effects to your Favored Technique, but increase its Ki Point Cost by 1/2 of the applied Profile’s Ki Point Cost. If your Favored Technique already has an AoE, you cannot select a Profile that would add an AoE to that Attacking Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you use your Favored Technique as an Ultimate Signature (either due to naturally being one or through the Ascended Signature Advantage’s effects), ignore the Ki Point Cost increase through the first effect of Unique Technique and, if your Favored Technique was originally an Ultimate Signature, increase the Extra Dice gained from any Energy Charges by 1 Dice Category.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "terrifying_technique",
    name: "Terrifying Technique",
    category: "Technique",
    description: "Your terrifying demeanor is displayed even in your attacks, shaking others to their core when you use your Favored Technique.",
    prerequisites: "Terrifying Presence, Favored Technique",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Wound Rolls of your Signature Techniques against characters with the Shaken Combat Condition by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you use the Energy Charge Maneuver and select your Favored Technique as its declared Attacking Maneuver, you may use the Terrify Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "quick_learner",
    name: "Quick Learner",
    category: "Technique",
    description: "You are able to pick up the techniques of others, just by seeing them in action.",
    prerequisites: "Scholarship or Personality Score of 4+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When any Character uses a Signature Technique, you can declare that it is a Copied Technique. You gain access to that Copied Technique for the duration of this Combat Encounter. Reduce the Dice Score of any Wound Rolls made by a Copied Technique by 2(T). You can only possess one Copied Technique at any one time.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "At the end of the Combat Encounter, you can pay the TP Cost of any Copied Technique to gain access to it permanently. If you do, it stops being a Copied Technique.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "perfect_mimicry",
    name: "Perfect Mimicry",
    category: "Technique",
    description: "Not only can you pick up the principles behind others’ techniques on the fly, but you can perfectly recreate them, as if you’d always known them.",
    prerequisites: "Quick Learner",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Wound Roll of your Copied Techniques by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you declare a Signature Technique is a Copied Technique, you may use that Signature Technique immediately as an Out-of-Sequence Maneuver. You must still meet any prerequisites for its use (such as the requisite number of Energy Charge Maneuvers if your Copied Technique has the Mandatory Charge Disadvantage).", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "copy_index",
    name: "Copy Index",
    category: "Technique",
    description: "You are able to quickly learn multiple techniques at once, and use the techniques copied from one opponent on another.",
    prerequisites: "Quick Learner",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You can possess up to two Copied Techniques at any one time.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "At the end of each Combat Encounter, you may select one Copied Technique to retain access to until the end of your next Combat Encounter.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "advanced_learner",
    name: "Advanced Learner",
    category: "Technique",
    description: "Your ability to quickly grasp techniques is exceptionally versatile, allowing you to learn more types of techniques.",
    prerequisites: "Quick Learner",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Reduce the Technique Point Cost of any Signature Technique or Unique Ability that would be gained at the end of a Combat Encounter by 3.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If a character uses a Unique Ability that you meet the Prerequisites of, you gain access to that Unique Ability for the remainder of the Combat Encounter. If you have the Copy Index Talent, you maintain access to this Unique Ability until the end of your next Combat Encounter or until you use this effect again.", usageLimit: "encounter", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered", text: "At the end of the Combat Encounter, you can pay the TP Cost of any Unique Ability gained through the second effect of Advanced Learner to retain it permanently.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "multi_aura_specialist",
    name: "Multi-Aura Specialist",
    category: "Technique",
    description: "You’ve practiced using multiple different Aura techniques to broaden your options in combat.",
    prerequisites: "You possess at least 1 Aura, Tier of Power 2+, you do not possess Solo-Aura Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Upon gaining this Talent, create an Aura with a Technique Point Cost of 20 or less.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you use the Aura Maneuver to change to a different Aura, reduce the Ki Point Cost of entering that Aura by 1/2 of the Ki Point Cost of the Aura you were in when you used the Aura Maneuver. Upon entering another Aura and applying this effect, you may use the Power Up Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "1/Encounter", text: "You may use the Aura Maneuver as an Instant Maneuver.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "solo_aura_specialist",
    name: "Solo-Aura Specialist",
    category: "Technique",
    description: "You’ve specialized in utilizing a single Aura technique to the fullest.",
    prerequisites: "You possess 1 Aura, Tier of Power 2+, you do not possess Multi-Aura Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You cannot create or gain access to any additional Auras.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Reduce the Ki Point Cost of your Aura by 2(T).", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you use the Aura Maneuver to enter your Aura, you may apply an additional qualifying Aura Advantage to that Aura until you exit it. The Aura Advantage must have a TP Cost of 8 or less.", usageLimit: "round", maxUses: 1 },
      { level: 4, activationType: "triggered", keyword: "1/Encounter", text: "You may use the Aura Maneuver as an Instant Maneuver.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "aura_master",
    name: "Aura Master",
    category: "Technique",
    description: "You incorporate the use of Aura Techniques into your battles with flawless efficiency.",
    prerequisites: "Solo-Aura Specialist or Multi-Aura Specialist, Tier of Power 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Halve the penalty from Transformation Lite while attempting to enter or while in a Transformation with the Perfect Ki Control, Strainless, or Natural Aspect.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "While in an Aura, if you use an Attacking Maneuver with a Ki Wager that exceeds the Ki Point Cost of that Aura, increase the Wound Roll of that Attacking Maneuver by 2(T).", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "Upon entering an Aura, you may regain Capacity equal to twice the Ki Point Cost of that Aura. This can allow you to exceed your Max Capacity.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "technique_armory",
    name: "Technique Armory",
    category: "Technique",
    description: "Your arsenal of combat techniques is vast and powerful, granting you a broad array of options for overcoming any obstacle.",
    prerequisites: "Spent at least 40 TP on Signature Techniques",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Reduce the initial Technique Point Cost of Signature Techniques by 4. This effect applies retroactively, meaning you regain 4 Technique Points for each Signature Technique you had previously obtained with Technique Points.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, Resource", text: "Each time you use a Super Signature Technique for the first time in a Combat Encounter, gain 1 Armory Point. When using an Ultimate Signature Technique, you may spend any number of Armory Points to increase the Wound Roll of that Signature Technique by 2(T) for each Armory Point spent.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "vigor",
    name: "Vigor",
    category: "Threshold",
    description: "Your body is conditioned for the harsh realities of battle.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "For each Health Threshold you are below, increase your Soak Value and Defense Value by 1(bT).", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "diehard",
    name: "Diehard",
    category: "Threshold",
    description: "Your ability to shrug off injury is remarkable.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Life Points by 2 for each of your Power Levels.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase the Dice Score of your Steadfast Checks by 1.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "fortitude",
    name: "Fortitude",
    category: "Threshold",
    description: "You are nearly unstoppable, continuing to fight well past when others would have dropped.",
    prerequisites: "Diehard",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Life Points by 2 for each of your Power Levels.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "When rolling a Steadfast Check, roll your Base Die twice and take the highest result.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "undying_determination",
    name: "Undying Determination",
    category: "Threshold",
    description: "Even the final blow isn’t enough to put you down immediately, and you are capable of unleashing all of your remaining energy to take the opponent down with you, or give your remaining allies the upper hand.",
    prerequisites: "Fortitude",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Life Points by 2 for each of your Power Levels.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Defeated", text: "Gain 3 Actions that you must spend on Maneuvers immediately. All of these Maneuvers are considered Out-of-Sequence Maneuvers and are done immediately upon becoming Defeated. You do not incur the effects of being Defeated until you have spent all 3 of these Actions.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "blinding_transformation",
    name: "Blinding Transformation",
    category: "Transformation",
    description: "You’ve learned to transform in a way that can leave those witnessing it blinded.",
    prerequisites: "Personality Score of 8+, Tier of Power 3+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you enter a Transformation through the Transformation Maneuver, you may immediately use the Power Up Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you use the Transformation Maneuver to enter a Core Transformation, you may apply a level of the Long Transformation Aspect onto that Transformation until the end of the Combat Encounter. If you do, make a Clash (Impulsive) against all Opponents within a Destructive Sphere AoE (centered on you). If you win, they suffer from the Blinded Combat Condition until the end of their next turn. If a Feature is in a straight line between you and an Opponent, that Opponent automatically wins this Clash.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "desperate_transformation",
    name: "Desperate Transformation",
    category: "Transformation",
    description: "You are capable of maintaining a Transformation, no matter the cost.",
    prerequisites: "Personality Score 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While below the Injured Health Threshold, increase your Stress Bonus by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "After rolling for your Stress Test, if you’ve failed, you can halve your Life Points (rounded up). If you do, increase your Dice Score by 1 for every Health Threshold you are below after halving your Life Points – this can retroactively allow you to succeed a failed Stress Test.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "enhanced_transformation",
    name: "Enhanced Transformation",
    category: "Transformation",
    description: "By concentrating your energy, you are able to push more power into your transformation.",
    prerequisites: "Personality Score of 8+, Tier of Power 3+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Stress Bonus by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you would use the Transformation Maneuver, you may apply up to 2 levels of the Long Transformation Aspect onto that Transformation until the end of the Combat Encounter. If you do, increase the Stress Test Requirement by 1 and the Attribute Modifier Bonus (FO/MA) by 1(T) for each level of the Long Transformation Aspect applied to it until the end of the Combat Encounter.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "forceful_transformation",
    name: "Forceful Transformation",
    category: "Transformation",
    description: "When you transform, your powerful aura knocks opponents away from you.",
    prerequisites: "Personality Score of 8+, Tier of Power 3+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Might by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you enter a Transformation through the Transformation Maneuver, you may make a Might Clash against all Opponents within a Large Sphere AoE (centered on you). If you win, reduce their Life Points by 1/2 of your Might and move the target(s) a number of Squares in a straight line away from you equal to your Might. If they would Collide with Terrain due to moving from this effect, increase the Damage they would suffer by your Might.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "under_pressure",
    name: "Under Pressure",
    category: "Transformation",
    description: "Even transforming while injured doesn’t hold you back.",
    prerequisites: "Desperate Transformation",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Stress Bonus by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you enter a Transformation through the Transformation Maneuver while you’re below the Injured Health Threshold, you may either: Double the Life/Ki Points regained through Legend Realized from this Transformation. Use the Power Up Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "specialized_transformation",
    name: "Specialized Transformation",
    category: "Transformation",
    description: "You have adapted especially to maintaining a specific Transformation.",
    prerequisites: "Personality Score of 8+, Tier of Power 3+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "When you gain this Talent, select one Transformation or Transformation Line to be your “Specialized Transformation”. When making a Stress Test for your Specialized Transformation, roll twice and take the highest result.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you use the Transformation Maneuver to enter a Transformation that can be used in conjunction with your Specialized Transformation, you can use the Transformation Maneuver again as an Out-of-Sequence Maneuver to enter your Specialized Transformation.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "comfortable_transformation",
    name: "Comfortable Transformation",
    category: "Transformation",
    description: "Your Specialized Transformation grants you greater strength.",
    prerequisites: "Specialized Transformation, your Specialized Transformation is an Alternate Form that does not possess the Scaling Aspect",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "If your Specialized Transformation is the first Stage of a Transformation with multiple Stages and you are in both that Transformation (ignoring any effects that would treat another Transformation as your Specialized Transformation) and the Full Power State, increase your Combat Rolls by 2(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you use the Transformation Maneuver while in the first Stage of your Specialized Transformation to enter a Transformation with a higher Tier of Power Requirement, use a Power Surge as an Out-of-Sequence Maneuver.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "inspiring_transformation",
    name: "Inspiring Transformation",
    category: "Transformation",
    description: "The sight of your Transformation fills your Allies with confidence.",
    prerequisites: "Personality Score of 8+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are in an Alternate Form or Legendary Form, Allies within a Minor Sphere AoE centered on you have their Wound Rolls increased by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you Transform into an Alternate Form or Legendary Form through the Transformation Maneuver, roll your Legend Realized, but you do not gain any Life or Ki Points. Instead, all of your Allies within a Sphere AoE centered on you regain Life and Ki Points equal to 1/2 of your Legend Realized Dice Score.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "overwhelming_transformation",
    name: "Overwhelming Transformation",
    category: "Transformation",
    description: "The menacing presence of your Transformation fills your enemies with dread.",
    prerequisites: "Personality Score of 8+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are in an Alternate Form or Legendary Form, Opponents within a Minor Sphere AoE centered on you have their Wound Rolls decreased by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "When you Transform into an Alternate Form or Legendary Form through the Transformation Maneuver, roll your Legend Realized, but you do not gain any Life or Ki Points. Instead, all of your Opponents within a Sphere AoE centered on you reduce their Life Points by an amount equal to 1/2 of your Legend Realized Dice Score.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "transformation_stressor",
    name: "Transformation Stressor",
    category: "Transformation",
    description: "You are able to draw extra power out of your Transformations at the cost of extra strain.",
    prerequisites: "Personality Score 8+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Do not reduce your Stress Bonus from any Health Threshold Penalties.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Power, 1/Round", text: "If you are in a Core Transformation, you may give that Transformation 2 levels of the Draining Aspect until the end of your next turn. If you do, you cannot use the Revert Maneuver and increase all of your Wound Rolls by 1/2 of the total Ki Points you would lose next turn through the effects of the Draining Aspect for that Transformation until the start of your next turn.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered/Power, 1/Encounter", text: "If you are in an Alternate Form or Legendary Form, you may enter the Power Stressed Special State until you leave that Transformation.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "transforming_initiative",
    name: "Transforming Initiative",
    category: "Transformation",
    description: "Your speed grows exponentially when you transform, allowing you to act more quickly and immediately charge into battle.",
    prerequisites: "Improved Initiative, Personality Score of 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are in a Core Transformation and you possess Initiative Advantage, increase your Wound Rolls by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you use the Transformation Maneuver to enter your Transformation with the highest Tier of Power Requirement, roll an Initiative Check to replace your Initiative. If your new Initiative is equal to or less than your current Initiative, keep your current Initiative.", usageLimit: "encounter", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you use the Transformation Maneuver to enter your Transformation with the highest Tier of Power Requirement, gain 1 Action to use until the end of this turn.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "restrained_transformation",
    name: "Restrained Transformation",
    category: "Transformation",
    description: "You can easily measure exactly how much power you draw out of your Transformations.",
    prerequisites: "Access to a Core Transformation, and your base Tier of Power is 3+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Gain access to the Holding Back Maneuver if you do not already have access.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "For every stack of Holding Back you possess, reduce the Draining and Power High Aspects for any Transformation you are in by 1 level. If you are currently using multiple Transformations in conjunction, only reduce the levels of these Aspects from a single Transformation.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "ruling", keyword: "Passive, Ruling", text: "Upon gaining access to this Talent, select a Core Transformation or Transformation Line that you have access to. The selected Transformation/Transformation Line becomes known as your “Measured Form”. If you have any number of Holding Back stacks, ignore your Measured Form’s Tier of Power Requirement.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "weapon_specialist",
    name: "Weapon Specialist",
    category: "Weapon",
    description: "You are especially skilled with a Weapon.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Reduce the Weapon Penalty by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you hit an Opponent with an Armed Attack, make a Might Clash against them. If you win, reduce the Break Value of their Top Layer by 1.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "category_specialist",
    name: "Category Specialist",
    category: "Weapon",
    description: "You are extraordinarily adept in the use of a particular type of weapon.",
    prerequisites: "Weapon Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Select a Weapon Category. When using an Attacking Maneuver with your chosen Weapon Category applied to it, increase the Natural Result of your Strike Rolls by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When making an Attacking Maneuver with a Weapon of your chosen Weapon Category, you may increase your Wound Roll for that Attacking Maneuver by 1(T) for each Talent you possess that is called Weapon Specialist or has Weapon Specialist as a Prerequisite.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "dueling_specialist",
    name: "Dueling Specialist",
    category: "Weapon",
    description: "You are proficient with using a Weapon for defense as well as offense.",
    prerequisites: "Weapon Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are only wielding a single Weapon of the Standard Size, increase your Wound Rolls with Armed Attacks made with it by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "While the only Weapon you have equipped is a Standard Size Weapon and you make an Attacking Maneuver or use the Parry effect of the Defend Maneuver, you can increase your Strike Rolls by 2(T) for the duration of that Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "light_weapons_specialist",
    name: "Light Weapons Specialist",
    category: "Weapon",
    description: "You are extremely skilled at wielding lighter weapons to their fullest.",
    prerequisites: "Weapon Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are only wielding a single Weapon of the Small Size, increase your Wound Rolls by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you use the Basic Attack Maneuver to make an Armed Attack with a Small Size Weapon, spend 3(bT) Ki Points to use the Called Shot Maneuver in response to that Attacking Maneuver without spending an Action.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "heavy_weapons_specialist",
    name: "Heavy Weapons Specialist",
    category: "Weapon",
    description: "You are especially adept in wielding large Weapons to great effect.",
    prerequisites: "Weapon Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are only wielding a single Weapon of the Big Size, increase your Strike Rolls by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you make an Attacking Maneuver with a Big Size Weapon, reduce the Weapon’s Life Points by 1/10 their Maximum to increase the Wound Roll by the reduction. If you hit your Opponent with this Attacking Maneuver, inflict 2x the amount of Diminishing Defense for this Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "iaijutsu_specialist",
    name: "Iaijutsu Specialist",
    category: "Weapon",
    description: "Trained in a particular style of combat, you keep your Weapon in its sheathe until the exact moment you want to strike.",
    prerequisites: "Weapon Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are not wielding any Weapon, increase your Dodge Rolls by 1(T). After each Armed Attack, you may sheathe the Weapon used as an Out-of-Sequence Maneuver.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you Unsheathe a Standard Size Weapon, making it the only Weapon you have equipped, you can make a Basic Attack Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "dual_wielding_specialist",
    name: "Dual Wielding Specialist",
    category: "Weapon",
    description: "Adapted to wielding two Weapons simultaneously, you can press the advantage more easily while using one Weapon to defend.",
    prerequisites: "Weapon Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are wielding 2+ Weapons, increase your Strike Rolls by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "1/Round", text: "While you are wielding 2+ Weapons, you can either: Use the Parry effect of the Defend Maneuver without spending a Counter Action. When making an Armed Attack, increase the Wound Roll by 1/2 of your Might.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "twin_weapon_specialist",
    name: "Twin Weapon Specialist",
    category: "Weapon",
    description: "Wielding matching Weapons together with terrifying precision, you maximize your offensive ability.",
    prerequisites: "Dual Wielding Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are wielding 2+ Weapons of the same Weapon Category, increase your Wound Rolls by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you make an Attacking Maneuver after having made 2+ Attacking Maneuvers with 2+ different Weapons of the same Weapon Category during this Combat Round, increase the Wound Roll of that Attacking Maneuver by x(T) – where x is equal to the number of Attacking Maneuvers you’ve previously made with Weapons of that Weapon Category during this Combat Round.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you trigger the second effect of Twin Weapon Specialist, or use an Ultimate Signature Technique that has the Weapon Assisted Advantage while wielding 2+ Weapons of the same Weapon Category, you may apply 1 Quality from each Weapon you are wielding to the Weapon used for that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "critical_specialist",
    name: "Critical Specialist",
    category: "Weapon",
    description: "Focusing on targeting an opponent’s vitals, you attempt to finish your opponents swiftly.",
    prerequisites: "Weapon Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Decrease the Critical Target of your Strike Rolls when making an Armed Attack by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase the Extra Dice of your Critical Results for your Strike and Wound Rolls when making an Armed Attack by 2 Dice Categories.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you score a Critical Result on the Strike Roll for an Armed Attack, spend 3(bT) Ki Points to increase the Damage Category of that Attacking Maneuver by 1.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "variety_specialist",
    name: "Variety Specialist",
    category: "Weapon",
    description: "Constantly switching your Weapon, your tactics leave your enemies guessing.",
    prerequisites: "Weapon Specialist",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "All of your Weapons gain an additional Weapon Quality (this can exceed the limit on Weapon Qualities).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you have exchanged a Weapon you are currently holding for another Weapon you possess through the No Effort Maneuver or the effects of the Weapon Summoner Advancement, increase the Wound Roll of your next Armed Attack by 3(T).", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "improvised_specialist",
    name: "Improvised Specialist",
    category: "Weapon",
    description: "You are able to fashion a Weapon out of whatever you can find.",
    prerequisites: "Weapon Specialist",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you use the Terrain Lift Maneuver, the Feature can be used as a Big Bludgeoning Weapon with a Quality decided by the ARC. The Life Points of this Feature becomes 1/4 of the amount for a Weapon at your Power Level. The ARC may allow the Feature to be Slashing or Piercing instead of Bludgeoning depending on the Feature.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "When you hit an Opponent with an Armed Attack using a Feature as a Physical Weapon, you may destroy the Weapon immediately after that Attacking Maneuver. If you do, increase your Wound Roll by 1/2 of the Weapon’s Life Points.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "weapon_fixer",
    name: "Weapon Fixer",
    category: "Weapon",
    description: "You are able to repair your weapon mid-fight, using your ki.",
    prerequisites: "Weapon Specialist",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered/Start of Turn", text: "If you have a destroyed Weapon, you can spend 4(bT) Ki Points to recreate that Weapon out of energy until the start of your next turn. If you do, increase the Wound Rolls of all Attacking Maneuvers made by that Weapon by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you use the first effect of Weapon Fixer to recreate a Weapon, apply a Special Quality of your choice to that Weapon until the start of your next turn.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "weapon_master",
    name: "Weapon Master",
    category: "Weapon",
    description: "Your Weapon Attacks are able to conduct your ki, dealing more damage when you land them successfully.",
    prerequisites: "Any talent that has ‘Weapon Specialist’ as a prerequisite",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you score a Critical Result on the Strike Roll for an Armed Attack, increase the Dice Category of your Energy Charges on that Attacking Maneuver by 1. If that Attacking Maneuver lacks any Energy Charges, instead apply an Energy Charge to that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit an Opponent with an Armed Attack, spend up to 6(bT) Ki Points. If you do, increase the Wound Roll by an equal amount.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "variable_fighter",
    name: "Variable Fighter",
    category: "Weapon",
    description: "You are skilled in the use of both Weapons and your fists or ki, and employ a style which utilizes both.",
    prerequisites: "Weapon Specialist and either Iron Fist, Rapid Fist, Close Range Shot or Far Shot, you do not possess the Multi-Type Attacker Talent",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you would use an Armed Attack, increase the Strike OR Wound Rolls of your Unarmed Attacks for the remainder of this Combat Round by 1(T) or 2(T) respectively.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you would use an Unarmed Attack, increase the Strike OR Wound Rolls of your Armed Attacks for the remainder of this Combat Round by 1(T) or 2(T) respectively.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "variable_champion",
    name: "Variable Champion",
    category: "Weapon",
    description: "Your fighting style has evolved, allowing you to seamlessly combine your Armed and Unarmed Attacks.",
    prerequisites: "Variable Fighter, ToP3+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "If you are not wielding a Weapon, increase your Dodge Rolls by 1(T). If you are wielding a Weapon, increase your Wound Rolls by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you hit the Opponent with an Armed Attacking Maneuver, you may use the Basic Attack Maneuver to make an Unarmed Attack as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "application_of_skill",
    name: "Application of Skill",
    category: "Miscellaneous",
    description: "You are so skilled that you can overcome brute force with the right stance, the right movement, or the right leverage.",
    prerequisites: "Insight Score of 6+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While three Attributes (including Insight) have a higher Attribute Score than your Force and Magic Attributes, increase the Dice Score of your Might Checks (including Might Clashes) by 1/4 (rounded up) of your Insight Modifier.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you would make a Wound Roll for any reason, increase the Dice Score of that Wound Roll by 1/2 of your Insight Modifier. If you are in a Core Transformation, you may increase this bonus by 1/2 of that Transformation’s Attribute Modifier Bonus (FO or MA).", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "combat_wisdom",
    name: "Combat Wisdom",
    category: "Miscellaneous",
    description: "You are able to substitute your skill and experience in battle for raw, unbridled power.",
    prerequisites: "Insight Score of 8+, Application of Skill",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While three Attributes (including Insight) have a higher Attribute Score than your Force and Magic Attributes, double the bonus from the first effect of Application of Skill.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "While three Attributes (including Insight) have a higher Attribute Score than your Force and Magic Attributes, double the bonus to your Wound Rolls from the second effect of Application of Skill if your Attacking Maneuver is a Signature Technique.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you would use the Parry, Power Flare, or Cross Counter options of the Defend Maneuver, you may increase your Strike Rolls by 1/2 of your Might and your Wound Rolls by your Insight Modifier for the duration of that Maneuver. This effect also applies to the use of a Power Flare for creating a Shield Aura.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "concentrated_energy",
    name: "Concentrated Energy",
    category: "Miscellaneous",
    description: "You are able to focus your energy more precisely, wasting less of it when you attack.",
    prerequisites: "Force or Magic Score of 7+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, Resource", text: "If you use the Energy Charge Maneuver, gain a stack of Concentrated Ki (max. 6).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase your Wound Rolls by 1(bT) for every 2 stacks of Concentrated Ki you possess.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered", text: "If you would use the Power Flare option of the Defend Maneuver, double the bonus from the second effect of Concentrated Energy for the duration of that Maneuver.", usageLimit: null, maxUses: null },
      { level: 4, activationType: "automatic", keyword: "Automatic", text: "Lose all stacks of Concentrated Ki after using an Attacking Maneuver declared by the Energy Charge Maneuver or if you use the Cancel Energy Charge effect of the No Effort Maneuver.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "experienced_drunk",
    name: "Experienced Drunk",
    category: "Miscellaneous",
    description: "Your body is used to the drunken stupor you spend most of your time in, allowing you to function almost normally even while inebriated.",
    prerequisites: "Insight Score of 6+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While in the Drunk State, increase the Dice Category of your Extra Dice gained from scoring a Critical Result by 1 Category.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 2/Round", text: "When making a Dodge Roll, you may increase or reduce the Natural Result by 1 after seeing the result.", usageLimit: "round", maxUses: 2 },
      { level: 3, activationType: "triggered", keyword: "Triggered/Start of Combat Encounter", text: "Gain a Sake Bottle.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "ferocious_fighter",
    name: "Ferocious Fighter",
    category: "Miscellaneous",
    description: "Your animal instincts take over, turning you into a wild animal on the battlefield.",
    prerequisites: "Insight Score of 6+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Natural Result of your Dodge Rolls by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "While in the Feral State, increase the Dice Category of your Extra Dice gained from scoring a Critical Result by 1 Category.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered/Start of Turn", text: "Enter or exit the Feral State.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "furious_flex",
    name: "Furious Flex",
    category: "Miscellaneous",
    description: "You are able to push your body to the limits to increase your damage, at the cost of destroying your outfit over time.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If your Top Layer of Apparel is destroyed, increase your Combat Rolls by 1(T) until the end of your turn.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered", text: "If you use a Signature Technique, or declare one for the effects of the Energy Charge Maneuver, reduce the Break Value of your Top Layer of Apparel by 1. If you do, increase the Wound Roll of that Attacking Maneuver by the Apparel Bonus of your piece of Apparel. This effect can only be used if your piece of Apparel can be destroyed.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "lucky",
    name: "Lucky",
    category: "Miscellaneous",
    description: "You are able to succeed even when the odds are not in your favor.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Round", text: "You can re-roll any d10 rolled by you or any Ally after seeing the result.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "If you score a Botch Result, score a Critical Result instead and increase the Natural Result by 3.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "naturist",
    name: "Naturist",
    category: "Miscellaneous",
    description: "You are most often fighting in as little clothing as possible, while preserving your modesty.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are not wearing any pieces of Apparel, increase your Defense Value and Soak Value by 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Start of Combat Encounter", text: "If you are not wearing any Apparel, increase your Awareness and Initiative by 1(bT). You lose this bonus if you equip any piece of Apparel during this Combat Encounter.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "au_naturel",
    name: "Au Naturel",
    category: "Miscellaneous",
    description: "You prefer to let your natural form show, using your toughened skin for defense.",
    prerequisites: "Naturist, Tier of Power 3+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Double the benefits from the first effect of Naturist.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Start of Combat Encounter", text: "If you are not wearing any Apparel, increase your Wound Rolls by 2(T). You lose this bonus if you equip any piece of Apparel during this Combat Encounter.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "superhuman_physique",
    name: "Superhuman Physique",
    category: "Miscellaneous",
    description: "Your musclebound form renders defensive gear superfluous.",
    prerequisites: "Au Naturel, Tier of Power 4+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "While you are not wearing any piece of Apparel, increase your Stress Bonus by 1.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered/Start of Combat Encounter", text: "If you are not wearing any Apparel, increase your Damage Reduction by 2(T). You lose this bonus if you equip any piece of Apparel during this Combat Encounter.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "divine_physique",
    name: "Divine Physique",
    category: "Miscellaneous",
    description: "So powerful is your natural form that it rivals divine artifacts in defensive capacity.",
    prerequisites: "Superhuman Physique, Tier of Power 5+",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Double the bonus from the first effect of Superhuman Physique.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Increase your Maximum Life Points by 2 for each Power Level reached.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered/Start of Combat Encounter", text: "If you are not wearing any Apparel, increase your Combat Rolls by 1(T). You lose this bonus if you equip any piece of Apparel during this Combat Encounter.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "snack_fiend",
    name: "Snack Fiend",
    category: "Miscellaneous",
    description: "You always have a snack on you, hidden away. No one, sometimes not even you, knows it’s there before you need it.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered/Start of Combat Encounter", text: "Gain a Snack Basic Item.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Encounter", text: "After using the Snack Basic Item, enter the Superior State until the end of your turn.", usageLimit: "encounter", maxUses: 1 },
    ]
  },
  {
    id: "frequent_flyer",
    name: "Frequent Flyer",
    category: "Miscellaneous",
    description: "You’ve become extremely accustomed to fighting in the sky.",
    prerequisites: "Access to the Soar Maneuver",
    effects: [
      { level: 1, activationType: "triggered", keyword: "1/Round", text: "You may use the Soar Maneuver as an Instant Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Double the bonus to your Dodge Rolls from using the Soar Maneuver.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you use an Attacking Maneuver that has the Drop Down Disadvantage, increase its Wound Roll by 1d8(T).", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "swaggering_wager",
    name: "Swaggering Wager",
    category: "Miscellaneous",
    description: "Your overwhelming power is more than enough to win, so why not prove your superiority?  That’s your philosophy.",
    prerequisites: "Personality Score of 4+",
    effects: [
      { level: 1, activationType: "triggered", keyword: "Triggered/Start of Turn", text: "Select up to 3 of the effects below, they apply until the start of your next turn: Limb Restriction [Passive] : Reduce all of your Combat Rolls by 2(bT). Lazy Fighting [Passive] : Gain the Slowed Combat Condition. Zero Effort [Passive] : You cannot Ki Wager or use any Signature Techniques.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, Resource", text: "When any number of effects chosen through the first effect of Swaggering Wager ends, gain a number of Swagger Stacks equal to the number of effects that ended.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "1/Round", text: "As an Instant Maneuver, you can spend a number of Swagger Stacks to gain the effects listed below: 1-3 Swagger : For each Swagger spent, increase one Combat Roll of your choice by 1(T) until the start of your next turn. This effect cannot stack. 2 Swagger : Gain 1 Counter Action to use before the start of your next turn. 3 Swagger : Make a Basic Attack Maneuver as an Out-of-Sequence Maneuver. 4 Swagger : Gain an additional Action to use before the end of your turn.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "willpower",
    name: "Willpower",
    category: "Miscellaneous",
    description: "Through sheer determination, you are able to power through events that would otherwise have an adverse effect on you.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Choose a Saving Throw (except the Saving Throw chosen by your Race), increase that Saving Throw by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Roll your Base Die twice for any Saving Throw and use the highest result.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "practiced_charger",
    name: "Practiced Charger",
    category: "Miscellaneous",
    description: "You have become extremely skilled at gathering energy into your attacks.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Reduce the Ki Point Cost of the Energy Charge Maneuver to 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "At the end of your turn, if all of your Actions (minimum 3) were spent using the Energy Charge Maneuver this turn, you may use the Energy Charge Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "throwing_specialist",
    name: "Throwing Specialist",
    category: "Miscellaneous",
    description: "You’ve practiced the art of throwing to the point of perfection.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "You may use the Throw Maneuver an additional time per Combat Round.", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you would throw a Weapon you possess through the Throw Maneuver, you may spend the Ki Points of a Physical Profile to apply its effects to that Attacking Maneuver. You cannot select a Profile that would apply an AoE to that Attacking Maneuver.", usageLimit: "round", maxUses: 1 },
      { level: 3, activationType: "triggered", keyword: "Triggered/Start of Turn", text: "Select a Weapon you are wielding and apply the Throwing Weapon or Boomerang Quality to that Weapon.", usageLimit: null, maxUses: null },
    ]
  },
  {
    id: "aikido_apprentice",
    name: "Aikido Apprentice",
    category: "Miscellaneous",
    description: "You know how to push opponents away from you with greater force.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase the Dice Score of your Clash for the Thrust Maneuver by 1(bT).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If you successfully avoid an Attacking Maneuver through Dodging or through the Parry option of the Defend Maneuver, you may use the Thrust Maneuver as an Out-of-Sequence Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "exploit_expert",
    name: "Exploit Expert",
    category: "Miscellaneous",
    description: "You are especially skilled at taking advantage of openings in the enemy’s guard.",
    prerequisites: "N/A",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Wound Rolls for Attacking Maneuvers made through the Exploit Maneuver by 2(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If an Opponent makes an Attacking Maneuver while they are within the Melee Range of 2+ Allies (including yourself, for this effect), this triggers your Exploit Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "master_of_openings",
    name: "Master of Openings",
    category: "Miscellaneous",
    description: "You are so skilled at taking advantage of openings in your enemy’s guard that you create openings where none were before.",
    prerequisites: "Exploit Expert",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "Increase your Strike Rolls for Attacking Maneuvers made through the Exploit Maneuver by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If an Opponent uses the Power Up Maneuver or Transformation Maneuver while not at Long Range, this triggers your Exploit Maneuver.", usageLimit: "round", maxUses: 1 },
    ]
  },
  {
    id: "responsive_warrior",
    name: "Responsive Warrior",
    category: "Miscellaneous",
    description: "You fight almost exclusively in reaction to your enemy’s attacks.",
    prerequisites: "Exploit Expert and Wild Counter",
    effects: [
      { level: 1, activationType: "passive", keyword: "Passive", text: "For each Action you’ve converted to a Counter Action this Combat Round, increase your Wound Rolls by 1(T). If you converted 2+ Actions into Counter Actions this Combat Round, increase your Strike Rolls by 1(T).", usageLimit: null, maxUses: null },
      { level: 2, activationType: "passive", keyword: "Passive", text: "Any Attacking Maneuver made through the effect of Wild Counter is also considered as if it was made through the Exploit Maneuver for any effects.", usageLimit: null, maxUses: null },
      { level: 3, activationType: "triggered", keyword: "Triggered, 1/Round", text: "If an Opponent makes an Attacking Maneuver that was not an AoE and could have targeted you, but targeted an Ally instead, make a Clash (Strike) against them. If you win, that Attacking Maneuver targets you instead.", usageLimit: "round", maxUses: 1 },
    ]
  },
];
