// ==================== DBU-OLD System Configuration ====================
// Ported from docs/Version_web/data.js as an ES module for FoundryVTT

/**
 * Register all DBU system configuration data onto CONFIG.DBU.
 * Call this during system initialization (e.g., in the "init" hook).
 */
export function registerConfig() {
  CONFIG.DBU = {

    // ==================== ATTRIBUTES ====================
    attributes: {
      ag: "Agility",
      fo: "Force",
      te: "Tenacity",
      sc: "Scholarship",
      in: "Insight",
      ma: "Magic",
      pe: "Personality"
    },

    attributeAbbreviations: {
      ag: "AG",
      fo: "FO",
      te: "TE",
      sc: "SC",
      in: "IN",
      ma: "MA",
      pe: "PE"
    },

    // ==================== RACIAL FACTORS ====================
    racialFactors: {
      saiyan: [
        { id: "none", name: "None" },
        { id: "half-saiyan", name: "Half-Saiyan" },
        { id: "ancient-saiyan", name: "Ancient Saiyan" },
        { id: "alternate-universe-saiyan", name: "Alternate Universe Saiyan" },
        { id: "legendary-saiyan", name: "Legendary Saiyan (Mutation)" },
        { id: "demon-clansman-evil-saiyan", name: "Demon Clansman: Evil Saiyan of Legend" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" },
        { id: "alternate-upbringing", name: "Alternate Upbringing" }
      ],
      earthling: [
        { id: "none", name: "None" },
        { id: "saiyan-ancestry", name: "Saiyan Ancestry" },
        { id: "triclops", name: "Triclops (Three-Eyes)" },
        { id: "beast-man-part-beast", name: "Beast-Man: Part Beast" },
        { id: "beast-man-were-beast", name: "Beast-Man: Were-Beast" },
        { id: "monster-custom", name: "Monster: Custom Monstrosity" },
        { id: "monster-devil", name: "Monster: Devil" },
        { id: "monster-genie", name: "Monster: Genie" },
        { id: "monster-ghost", name: "Monster: Ghost" },
        { id: "monster-goblin", name: "Monster: Goblin" },
        { id: "monster-mummy", name: "Monster: Mummy" },
        { id: "monster-troll", name: "Monster: Troll" },
        { id: "monster-vampire", name: "Monster: Vampire" },
        { id: "demon-clansman", name: "Demon Clansman" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" },
        { id: "alternate-upbringing", name: "Alternate Upbringing" }
      ],
      namekian: [
        { id: "none", name: "None" },
        { id: "dark-vassal", name: "Dark Vassal" },
        { id: "tremendous-lord", name: "Tremendous Lord (Mutation)" },
        { id: "demon-clansman-demonic-skills", name: "Demon Clansman: Demonic Skills" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" },
        { id: "alternate-upbringing", name: "Alternate Upbringing" }
      ],
      android: [
        { id: "none", name: "None" },
        { id: "machine-mutant", name: "Machine Mutant" },
        { id: "og-soldier", name: "OG Soldier (Mimicry Program)" },
        { id: "tamagami", name: "Tamagami" },
        { id: "beast-man-part-beast", name: "Beast-Man: Part Beast" },
        { id: "beast-man-were-beast", name: "Beast-Man: Were-Beast" },
        { id: "demon-clansman", name: "Demon Clansman" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" }
      ],
      majin: [
        { id: "none", name: "None" },
        { id: "diluted-majin", name: "Diluted Majin" },
        { id: "goopy-majin", name: "Goopy Majin" },
        { id: "primordial-majin", name: "Primordial Majin" },
        { id: "android-majin", name: "Android Majin (req. Assimilation)" },
        { id: "demon-clansman", name: "Demon Clansman" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" },
        { id: "alternate-upbringing", name: "Alternate Upbringing" }
      ],
      arcosian: [
        { id: "none", name: "None" },
        { id: "emperor", name: "Emperor (Mutation)" },
        { id: "demon-clansman", name: "Demon Clansman" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" },
        { id: "alternate-upbringing", name: "Alternate Upbringing" }
      ],
      shinjin: [
        { id: "none", name: "None" },
        { id: "golden-fruit", name: "Golden Fruit (Mutation)" },
        { id: "demon-clansman-demonic-god", name: "Demon Clansman: Demonic God" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" },
        { id: "alternate-upbringing", name: "Alternate Upbringing" }
      ],
      cerealian: [
        { id: "none", name: "None" },
        { id: "demon-clansman", name: "Demon Clansman" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" },
        { id: "alternate-upbringing", name: "Alternate Upbringing" }
      ],
      neoTuffle: [
        { id: "none", name: "None" },
        { id: "demon-clansman", name: "Demon Clansman" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" },
        { id: "alternate-upbringing", name: "Alternate Upbringing" }
      ],
      nekoMajin: [
        { id: "none", name: "None" },
        { id: "usagi-majin", name: "Usagi Majin" },
        { id: "feline-warrior", name: "Feline Warrior (Combat Cat)" },
        { id: "demon-clansman", name: "Demon Clansman" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" },
        { id: "alternate-upbringing", name: "Alternate Upbringing" }
      ],
      shadowDragon: [
        { id: "none", name: "None" },
        { id: "demon-clansman", name: "Demon Clansman" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" },
        { id: "alternate-upbringing", name: "Alternate Upbringing" }
      ],
      bioAndroid: [
        { id: "none", name: "None" },
        { id: "genetic-splicing-android", name: "Genetic Splicing: Android Cybernetics" },
        { id: "genetic-splicing-arcosian", name: "Genetic Splicing: Arcosian Genes" },
        { id: "genetic-splicing-cerealian", name: "Genetic Splicing: Cerealian Genes" },
        { id: "genetic-splicing-dragon", name: "Genetic Splicing: Dragon Genes" },
        { id: "genetic-splicing-earthling", name: "Genetic Splicing: Earthling Genes" },
        { id: "genetic-splicing-majin", name: "Genetic Splicing: Majin Genes" },
        { id: "genetic-splicing-namekian", name: "Genetic Splicing: Namekian Genes" },
        { id: "genetic-splicing-neko", name: "Genetic Splicing: Neko Majin Genes" },
        { id: "genetic-splicing-neo-tuffle", name: "Genetic Splicing: Neo-Tuffle Genes" },
        { id: "genetic-splicing-other", name: "Genetic Splicing: Other Genes" },
        { id: "genetic-splicing-saiyan", name: "Genetic Splicing: Saiyan Genes" },
        { id: "genetic-splicing-shinjin", name: "Genetic Splicing: Shinjin Genes" },
        { id: "bio-focus", name: "Bio Focus (req. Genetic Splicing)" },
        { id: "weapon-of-mass-destruction", name: "Weapon of Mass Destruction" },
        { id: "beast-man-part-beast", name: "Beast-Man: Part Beast" },
        { id: "beast-man-were-beast", name: "Beast-Man: Were-Beast" },
        { id: "monster-custom", name: "Monster: Custom Monstrosity" },
        { id: "monster-devil", name: "Monster: Devil" },
        { id: "monster-genie", name: "Monster: Genie" },
        { id: "monster-ghost", name: "Monster: Ghost" },
        { id: "monster-goblin", name: "Monster: Goblin" },
        { id: "monster-mummy", name: "Monster: Mummy" },
        { id: "monster-troll", name: "Monster: Troll" },
        { id: "monster-vampire", name: "Monster: Vampire" },
        { id: "demon-clansman", name: "Demon Clansman" },
        { id: "reincarnated", name: "Reincarnated" },
        { id: "undead", name: "Undead" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" }
      ],
      undead: [
        { id: "none", name: "None" },
        { id: "cybernetic-enhancement", name: "Cybernetic Enhancement" },
        { id: "mutation-brute", name: "Mutation: Brute" },
        { id: "mutation-captain", name: "Mutation: Captain" },
        { id: "mutation-giant-gene", name: "Mutation: Giant Gene" },
        { id: "mutation-psychic", name: "Mutation: Psychic" },
        { id: "mutation-speedster", name: "Mutation: Speedster" },
        { id: "mutation-tactician", name: "Mutation: Tactician" },
        { id: "mutation-technician", name: "Mutation: Technician" }
      ]
    },

    // ==================== RACIAL SUBRACES ====================
    racialSubraces: {
      saiyan: [
        { id: "none", name: "None (Select Heritage)" },
        { id: "fullBlooded", name: "Full-Blooded" },
        { id: "halfBlood", name: "Half-Blood" },
        { id: "ancient", name: "Ancient" }
      ],
      earthling: [
        { id: "none", name: "None (Human)" },
        { id: "beastman", name: "Beastman" },
        { id: "triclops", name: "Triclops" }
      ],
      namekian: [
        { id: "none", name: "None (Select Clan)" },
        { id: "warriorClan", name: "Warrior Clan" },
        { id: "dragonClan", name: "Dragon Clan" },
        { id: "demonClan", name: "Demon Clan" }
      ],
      shinjin: [
        { id: "none", name: "None (Select Subrace)" },
        { id: "kaio", name: "Kaio" },
        { id: "makaio", name: "Makaio" }
      ],
      neoTuffle: [
        { id: "none", name: "None (Select a Subrace)" },
        { id: "hatredEmbodiment", name: "Hatred Embodiment" },
        { id: "parasite", name: "Parasite" }
      ],
      bioAndroid: [
        { id: "none", name: "None (Select Subrace)" },
        { id: "familiar", name: "Familiar" },
        { id: "uncanny", name: "Uncanny" }
      ],
      arcosian: [
        { id: "none", name: "None (Standard)" },
        { id: "mutant", name: "Mutant (Lineage of Evil)" }
      ]
    },

    // ==================== RACIAL ATTRIBUTE BONUSES ====================
    racesWithFixedAttributes: ["saiyan", "arcosian", "android", "neoTuffle"],

    racialAttributeBonuses: {
      saiyan: { ag: 1, fo: 2, te: 2, sc: 0, in: 0, ma: 0, pe: 0 },
      earthling: { ag: 2, fo: 0, te: 0, sc: 1, in: 2, ma: 0, pe: 0 },
      namekian: { ag: 0, fo: 1, te: 2, sc: 0, in: 2, ma: 0, pe: 0 },
      android: { ag: 0, fo: 2, te: 2, sc: 0, in: 1, ma: 0, pe: 0 },
      bioAndroid: { ag: 1, fo: 0, te: 2, sc: 0, in: 2, ma: 0, pe: 0 },
      majin: { ag: 0, fo: 2, te: 1, sc: 0, in: 0, ma: 0, pe: 2 },
      arcosian: { ag: 2, fo: 1, te: 2, sc: 0, in: 0, ma: 0, pe: 0 },
      shinjin: { ag: 0, fo: 2, te: 0, sc: 1, in: 2, ma: 0, pe: 0 },
      cerealian: { ag: 2, fo: 1, te: 0, sc: 0, in: 2, ma: 0, pe: 0 },
      neoTuffle: { ag: 0, fo: 0, te: 2, sc: 1, in: 2, ma: 0, pe: 0 },
      nekoMajin: { ag: 0, fo: 2, te: 0, sc: 0, in: 1, ma: 0, pe: 2 },
      shadowDragon: { ag: 0, fo: 2, te: 2, sc: 0, in: 0, ma: 0, pe: 1 },
      undead: { ag: 0, fo: 1, te: 2, sc: 0, in: 0, ma: 0, pe: 0 },
      customSpecies: { ag: 0, fo: 0, te: 0, sc: 0, in: 0, ma: 0, pe: 0 }
    },

    // ==================== RACIAL SKILL RANKS ====================
    racialSkillRanks: {
      saiyan: 2,
      earthling: 4,
      namekian: 3,
      android: 3,
      bioAndroid: 3,
      majin: 2,
      arcosian: 2,
      shinjin: 2,
      cerealian: 3,
      neoTuffle: 3,
      nekoMajin: 4,
      shadowDragon: 2,
      undead: 2,
      customSpecies: 2
    },

    // ==================== SKILLS DATA ====================
    skillsData: [
      { id: "acrobatics", name: "Acrobatics", attribute: "ag", ranks: 2 },
      { id: "bluff", name: "Bluff", attribute: "pe", ranks: 0 },
      { id: "clairvoyance", name: "Clairvoyance", attribute: "in", ranks: 1 },
      { id: "concealment", name: "Concealment", attribute: "in", ranks: 0 },
      { id: "crafting", name: "Craft", attribute: "sc", ranks: 0 },
      { id: "creature_handling", name: "Creature Handling", attribute: "in", ranks: 0 },
      { id: "empathy", name: "Intuition", attribute: "in", ranks: 0 },
      { id: "intimidation", name: "Intimidation", attribute: "pe", ranks: 2 },
      { id: "investigation", name: "Investigation", attribute: "sc", ranks: 0 },
      { id: "science", name: "Knowledge", attribute: "sc", ranks: 0 },
      { id: "medicine", name: "Medicine", attribute: "sc", ranks: 0 },
      { id: "perception", name: "Perception", attribute: "in", ranks: 2 },
      { id: "performance", name: "Performance", attribute: "pe", ranks: 0 },
      { id: "persuasion", name: "Persuasion", attribute: "pe", ranks: 1 },
      { id: "piloting", name: "Pilot", attribute: "ag", ranks: 0 },
      { id: "sleight_of_hand", name: "Thievery", attribute: "ag", ranks: 0 },
      { id: "stealth", name: "Stealth", attribute: "ag", ranks: 1 },
      { id: "survival", name: "Survival", attribute: "in", ranks: 1 },
      { id: "use_magic", name: "Use Magic", attribute: "ma", ranks: 0 }
    ],

    // ==================== AVAILABLE SKILLS (for dropdowns) ====================
    availableSkills: [
      "Acrobatics", "Bluff", "Clairvoyance", "Concealment",
      "Craft", "Creature Handling", "Intuition", "Intimidation", "Investigation",
      "Knowledge", "Medicine", "Perception", "Performance", "Persuasion", "Pilot",
      "Thievery", "Stealth", "Survival", "Use Magic"
    ],

    // ==================== TECHNIQUE TYPES ====================
    techniqueTypes: [
      "Super Signature",
      "Ultimate Signature",
      "Limit Break"
    ],

    // ==================== TECHNIQUE FOUNDATIONS ====================
    techniqueFoundations: {
      "Physical": ["Simple", "Blitz", "Combination", "Crushing", "Launching", "Powered", "Soaring", "Sweeping"],
      "Energy": ["Sphere", "Beam", "Blast", "Cutting", "Explosion", "Kiai", "Rapid Fire"],
      "Magic": ["Spell", "Elemental (Dark)", "Elemental (Earth)", "Elemental (Fire)", "Elemental (Ice)", "Elemental (Light)", "Elemental (Lightning)", "Elemental (Water)", "Elemental (Wind)", "Mega Flare"]
    },

    // ==================== PROFILE KP COSTS ====================
    profileKpCosts: {
      // Physical Profiles
      "Simple": 0,
      "Blitz": 3,
      "Combination": 4,
      "Crushing": 6,
      "Launching": 2,
      "Powered": 8,
      "Soaring": 8,
      "Sweeping": 4,
      // Energy Profiles
      "Sphere": 2,
      "Beam": 10,
      "Blast": 5,
      "Cutting": 6,
      "Explosion": 5,
      "Kiai": 5,
      "Rapid Fire": 5,
      // Magic Profiles
      "Spell": 2,
      "Elemental (Dark)": 6,
      "Elemental (Earth)": 5,
      "Elemental (Fire)": 8,
      "Elemental (Ice)": 8,
      "Elemental (Light)": 6,
      "Elemental (Lightning)": 8,
      "Elemental (Water)": 8,
      "Elemental (Wind)": 5,
      "Mega Flare": 10
    },

    // ==================== PROFILE DATA ====================
    profileData: {
      // -- Multi-Foundation Profiles --
      "Simple": {
        foundations: ["Physical", "Energy", "Magic"],
        damageCat: "Standard", kpCost: 0, range: "Melee/Any",
        effect: "None."
      },
      "Combination": {
        foundations: ["Physical", "Energy", "Magic"],
        damageCat: "Standard", kpCost: 3, range: "Melee/Any",
        effect: "After you hit an Opponent but before you roll your Wound Roll, roll your Strike Roll against the Dice Score of their Dodge/Strike Roll an additional 3 times. For every additional time your Strike Roll exceeds their Dice Score, increase the Wound Roll by 2(T)."
      },
      "Launching": {
        foundations: ["Physical", "Energy"],
        damageCat: "Standard", kpCost: 3, range: "Melee/Any",
        effect: "Gains the Knockback Advantage for free. Double any Collision Damage from Knockback movement."
      },
      "Mega Flare": {
        foundations: ["Physical", "Energy", "Magic"],
        damageCat: "Standard", kpCost: 4, range: "Melee/Any",
        effect: "Max Energy Charges for this Profile is 10. For every Energy Charge, increase Wound Roll by 1(T). If 7+ Energy Charges, increase Damage Category by 1."
      },
      // -- Physical Profiles --
      "Blitz": {
        foundations: ["Physical"],
        damageCat: "Standard", kpCost: 4, range: "Melee",
        effect: "Gains the Charging Assault Advantage for free. If you move more Squares than your Normal Speed via Charging Assault, score a Critical Result on Wound Roll. If Signature Technique, reduce KP Cost by 2(T)."
      },
      "Crushing": {
        foundations: ["Physical"],
        damageCat: "Lethal", kpCost: 6, range: "Melee",
        effect: "Reduce the bonus to your Wound Roll from your Force by 1/2."
      },
      "Pinpoint": {
        foundations: ["Physical"],
        damageCat: "Standard", kpCost: 4, range: "Melee",
        effect: "Ignores target's Soak Value equal to your Insight Modifier. If Critical Result on Strike Roll, double your Insight Modifier for this Maneuver."
      },
      "Powered": {
        foundations: ["Physical"],
        damageCat: "Standard", kpCost: 8, range: "Melee",
        effect: "Apply your Damage Attribute an additional time. This Attacking Maneuver gains an Energy Charge."
      },
      "Soaring": {
        foundations: ["Physical"],
        damageCat: "Direct", kpCost: 5, range: "Line AoE",
        effect: "This Attacking Maneuver has a Standard Line AoE."
      },
      "Sweeping": {
        foundations: ["Physical"],
        damageCat: "Standard", kpCost: 4, range: "Sphere AoE",
        effect: "Minor Sphere AoE (centered on you). Allies not targeted. If you deal Damage, double the Diminishing Defense stacks."
      },
      // -- Energy Profiles --
      "Beam": {
        foundations: ["Energy"],
        damageCat: "Direct", kpCost: 8, range: "Any",
        effect: "Gains an Energy Charge that does not count towards your maximum Energy Charges."
      },
      "Blast": {
        foundations: ["Energy"],
        damageCat: "Direct", kpCost: 5, range: "Cone AoE",
        effect: "This Attacking Maneuver has a Cone AoE."
      },
      "Clearing": {
        foundations: ["Energy"],
        damageCat: "Standard", kpCost: 6, range: "Sphere AoE",
        effect: "Target a Square not at Long Range. Sphere AoE centered on chosen Square. Minimum Natural Result on Strike Roll is 5."
      },
      "Concentrated": {
        foundations: ["Energy"],
        damageCat: "Lethal", kpCost: 10, range: "Line AoE",
        effect: "This Attacking Maneuver has a Line AoE. Ignore 1/2 of target's Damage Reduction."
      },
      "Cutting": {
        foundations: ["Energy"],
        damageCat: "Lethal", kpCost: 6, range: "Any",
        effect: "You only add 3/4 of your Awareness and 1/2 (rounded up) of your Haste to the Strike Roll for this Attacking Maneuver."
      },
      "Sphere": {
        foundations: ["Energy"],
        damageCat: "Standard", kpCost: 2, range: "Any",
        effect: "None."
      },
      "Explosion": {
        foundations: ["Energy"],
        damageCat: "Standard", kpCost: 5, range: "Sphere AoE",
        effect: "Target a Square. This Attacking Maneuver has a Sphere AoE."
      },
      "Kiai": {
        foundations: ["Energy"],
        damageCat: "Standard", kpCost: 5, range: "Cone AoE",
        effect: "Shockwave-style energy attack with a Cone AoE."
      },
      "Rapid Fire": {
        foundations: ["Energy"],
        damageCat: "Standard", kpCost: 5, range: "Any",
        effect: "Multiple rapid energy projectiles."
      },
      "Wave": {
        foundations: ["Energy"],
        damageCat: "Direct", kpCost: 6, range: "Line AoE",
        effect: "Target a Square not at Long Range. Line AoE centered on chosen Square, pointing in any cardinal direction."
      },
      // -- Magic Profiles --
      "Spell": {
        foundations: ["Magic"],
        damageCat: "Standard", kpCost: 2, range: "Any",
        effect: "None."
      },
      "Elemental (Dark)": {
        foundations: ["Magic"],
        damageCat: "Standard", kpCost: 2, range: "Any",
        effect: "When Ki Wagering, you may spend Life Points instead of Ki Points. Squares occupied by damaged targets have Light Level reduced by 1."
      },
      "Elemental (Earth)": {
        foundations: ["Magic"],
        damageCat: "Direct", kpCost: 4, range: "Any",
        effect: "After using (hit or miss), for each target you may create a Feature with Hardness Rank equal to highest adjacent on any Square within a Large Sphere AoE."
      },
      "Elemental (Fire)": {
        foundations: ["Magic"],
        damageCat: "Direct", kpCost: 8, range: "Any",
        effect: "If you knock an Opponent through a Health Threshold, they gain Broken. Damaged Squares become Aflame."
      },
      "Elemental (Ice)": {
        foundations: ["Magic"],
        damageCat: "Direct", kpCost: 8, range: "Any",
        effect: "If you knock an Opponent through a Health Threshold, they gain Slowed. Damaged Squares become Frozen."
      },
      "Elemental (Light)": {
        foundations: ["Magic"],
        damageCat: "Standard", kpCost: 2, range: "Any",
        effect: "Gains the Full Wager Advantage for free. Damaged Squares have Light Level increased by 1."
      },
      "Elemental (Lightning)": {
        foundations: ["Magic"],
        damageCat: "Direct", kpCost: 8, range: "Any",
        effect: "If you knock an Opponent through a Health Threshold, they gain Impediment. Damaged Squares become Electrified."
      },
      "Elemental (Metal)": {
        foundations: ["Magic"],
        damageCat: "Lethal", kpCost: 8, range: "Any",
        effect: "Damaged Squares become Metallic with Dangerous Environment / Sharp Feature Quality. Hardness Rank increased to 3."
      },
      "Elemental (Plantlife)": {
        foundations: ["Magic"],
        damageCat: "Standard", kpCost: 3, range: "Any",
        effect: "Gains Staggering Attack Advantage for free. After using, create Features with Hardness Rank 1 and Splintering Quality on adjacent unoccupied Squares."
      },
      "Elemental (Poison)": {
        foundations: ["Magic"],
        damageCat: "Direct", kpCost: 8, range: "Any",
        effect: "If you knock an Opponent through a Health Threshold, they gain Poisoned. Damaged Squares become Poisoned."
      },
      "Elemental (Water)": {
        foundations: ["Magic"],
        damageCat: "Direct", kpCost: 8, range: "Any",
        effect: "If you knock an Opponent through a Health Threshold, they gain Prone. Damaged Squares become Bog Environment."
      },
      "Elemental (Wind)": {
        foundations: ["Magic"],
        damageCat: "Direct", kpCost: 4, range: "Any",
        effect: "Gains the Knockback Advantage for free. When moving via Knockback, you can move the Character in any direction."
      }
    },

    // ==================== TECHNIQUE ADVANTAGES ====================
    techniqueAdvantagesData: {
      // -- Area Advantages --
      "Controlled Blast": { tpPerRank: 5, maxRanks: 1, hasNotes: false, requirement: "Cone AoE", effect: "" },
      "Hurricane Assault": { tpPerRank: 4, maxRanks: 1, hasNotes: false, requirement: "Sweeping Profile", effect: "" },
      "Intense Blast": { tpPerRank: 15, maxRanks: 1, hasNotes: false, requirement: "AoE", effect: "" },
      "Pinpoint Precision": { tpPerRank: 6, maxRanks: 1, hasNotes: false, requirement: "AoE Standard/Minor, no Concentrated Strike", effect: "" },
      "Splitting": { tpPerRank: [4, 6], maxRanks: 2, hasNotes: false, requirement: "Energy or Magic, no AoE", effect: "" },
      "Terrain Destruction": { tpPerRank: [3, 5, 7], maxRanks: 3, hasNotes: false, requirement: "AoE", effect: "" },
      "Widespread Assault": { tpPerRank: 8, maxRanks: 1, hasNotes: true, requirement: "No AoE", effect: "" },
      // -- Charge Advantages --
      "Aura Gathering": { tpPerRank: 8, maxRanks: 1, hasNotes: false, requirement: "Ultimate Signature" },
      "Concentrated Strike": { tpPerRank: 8, maxRanks: 1, hasNotes: false, requirement: "AoE, no Pinpoint Precision" },
      "Maximum Charge": { tpPerRank: 6, maxRanks: 1, hasNotes: false, requirement: "Ultimate Signature" },
      // -- Magic Advantages --
      "Explosion Sorcery": { tpPerRank: 12, maxRanks: 1, hasNotes: false, requirement: "Simple Profile Magic, no AoE/Splitting" },
      "Reinforced Plantlife": { tpPerRank: [3, 4, 5], maxRanks: 3, hasNotes: false, requirement: "Elemental (Plantlife)" },
      "Weather Calling": { tpPerRank: 10, maxRanks: 1, hasNotes: false, requirement: "Elemental (not Light/Dark/Metal/Water)" },
      // -- Movement Advantages --
      "Back Flip": { tpPerRank: 2, maxRanks: 1, hasNotes: false, requirement: "Hit and Run, Energy/Magic/Soaring/Physical+Charging Assault, no AoE (except Line)" },
      "Charging Assault": { tpPerRank: 10, maxRanks: 1, hasNotes: false },
      "Express Ticket": { tpPerRank: 6, maxRanks: 1, hasNotes: false, requirement: "Charging Assault" },
      "High-Speed Dash": { tpPerRank: 2, maxRanks: 1, hasNotes: false, requirement: "Hit and Run" },
      "Hit and Run": { tpPerRank: 8, maxRanks: 1, hasNotes: false },
      "Knockback": { tpPerRank: 4, maxRanks: 1, hasNotes: false },
      "Two-Step Strike": { tpPerRank: 8, maxRanks: 1, hasNotes: false, requirement: "Energy/Magic/Soaring/Physical+Charging Assault, no Concentration" },
      // -- Power Advantages --
      "Accurate": { tpPerRank: [3, 5, 7], maxRanks: 3, hasNotes: false, requirement: "No Inaccurate", effect: "+1(T) to Strike Rolls per rank." },
      "Armor-Piercing": { tpPerRank: 8, maxRanks: 1, hasNotes: false, requirement: "Pinpoint Profile" },
      "Brutal Blitz": { tpPerRank: 7, maxRanks: 1, hasNotes: false, requirement: "Blitz Profile" },
      "Final Chance": { tpPerRank: 4, maxRanks: 1, hasNotes: false, requirement: "Ultimate Signature" },
      "Full Wager": { tpPerRank: 10, maxRanks: 1, hasNotes: false },
      "Last Legs": { tpPerRank: 6, maxRanks: 1, hasNotes: false, requirement: "Ultimate Signature" },
      "Long Shot": { tpPerRank: [3, 4], maxRanks: 2, hasNotes: false },
      "Overwhelming Terror": { tpPerRank: 12, maxRanks: 1, hasNotes: false, requirement: "Terrify Maneuver" },
      "Peppering Blows": { tpPerRank: [6, 8, 10], maxRanks: 3, hasNotes: false, requirement: "Combination Profile" },
      "Power Burst": { tpPerRank: [6, 5, 4], maxRanks: 3, hasNotes: false, requirement: "Ultimate Signature" },
      "Power Shot": { tpPerRank: [4, 6, 8], maxRanks: 3, hasNotes: false, requirement: "No Low Penetration" },
      "Shattering Blow": { tpPerRank: [4, 6, 6, 8], maxRanks: 4, hasNotes: false, requirement: "Crushing Profile" },
      "Sky Assault": { tpPerRank: 3, maxRanks: 1, hasNotes: false, requirement: "Energy or Magic" },
      "Super Advantage": { tpPerRank: 11, maxRanks: 1, hasNotes: true, requirement: "Ultimate Signature" },
      "Transformation Boost": { tpPerRank: 6, maxRanks: 1, hasNotes: false, requirement: "Ultimate Signature" },
      // -- Surprise Advantages --
      "Counter": { tpPerRank: 7, maxRanks: 1, hasNotes: false },
      "Delayed": { tpPerRank: 8, maxRanks: 1, hasNotes: false, requirement: "Signature Technique only" },
      "Exploiting Technique": { tpPerRank: 7, maxRanks: 1, hasNotes: false, requirement: "No AoE/Mandatory Charge/Special Set Up/Grappling/Time-Skipped/Trick Technique/Lead Up" },
      "Fake Out": { tpPerRank: 10, maxRanks: 1, hasNotes: false, requirement: "Bluff 2+, Super Signature" },
      "Instant Assault": { tpPerRank: 10, maxRanks: 1, hasNotes: false },
      "Low Stakes Attack": { tpPerRank: 5, maxRanks: 1, hasNotes: false, requirement: "Fake Out" },
      "Personal Bomb": { tpPerRank: 12, maxRanks: 1, hasNotes: false, requirement: "Delayed, Sphere AoE" },
      "Trick Attack": { tpPerRank: 4, maxRanks: 1, hasNotes: true, requirement: "Bluff or Acrobatics 2+" },
      // -- Technical Advantages --
      "Condition": { tpPerRank: 14, maxRanks: 1, hasNotes: true, requirement: "Not Elemental (Fire/Ice/Water/Lightning/Poison)" },
      "Deadly Drop": { tpPerRank: 8, maxRanks: 1, hasNotes: false, requirement: "Physical, Grappling, Restricted \u2013 High Environment" },
      "Hefty Stagger": { tpPerRank: [4, 6], maxRanks: 2, hasNotes: false, requirement: "Staggering Attack" },
      "Homing": { tpPerRank: [6, 8, 10], maxRanks: 3, hasNotes: false, requirement: "No AoE" },
      "Penetration": { tpPerRank: [12, 6, 6], maxRanks: 3, hasNotes: false, requirement: "No AoE (Sphere/Cone), no Low Penetration" },
      "Perfect Strike": { tpPerRank: 8, maxRanks: 1, hasNotes: false, requirement: "Simple Profile, Ultimate Signature" },
      "Powerbomb": { tpPerRank: [11, 4], maxRanks: 2, hasNotes: false, requirement: "Physical, Grappling" },
      "Rebound": { tpPerRank: 2, maxRanks: 1, hasNotes: false, requirement: "Homing" },
      "Staggering Attack": { tpPerRank: 6, maxRanks: 1, hasNotes: false },
      "Sudden Blast": { tpPerRank: 4, maxRanks: 1, hasNotes: false, requirement: "Clearing Profile" },
      "Sustained": { tpPerRank: 6, maxRanks: 5, hasNotes: false },
      // -- Miscellaneous Advantages --
      "Alotta Lotta Attacks": { tpPerRank: [3, 5, 7], maxRanks: 3, hasNotes: false, requirement: "Combination Profile" },
      "Ascended Signature": { tpPerRank: 8, maxRanks: 1, hasNotes: false, requirement: "Super Signature" },
      "Aura Surge": { tpPerRank: 10, maxRanks: 1, hasNotes: false, requirement: "Ultimate Signature" },
      "Efficiency": { tpPerRank: [8, 7], maxRanks: 2, hasNotes: false, requirement: "No Inefficiency" },
      "Forceful Launch": { tpPerRank: [4, 6, 8], maxRanks: 3, hasNotes: false, requirement: "Launching Profile" },
      "Precise Strike": { tpPerRank: 4, maxRanks: 1, hasNotes: false, requirement: "Launching Profile" },
      "Throwing Technique": { tpPerRank: 5, maxRanks: 1, hasNotes: false, requirement: "Simple Physical" },
      "Transformation Flare": { tpPerRank: 4, maxRanks: 1, hasNotes: false, requirement: "Restricted \u2013 Untransformed" },
      "Twin-Linked": { tpPerRank: 10, maxRanks: 1, hasNotes: true, requirement: "No Dead-Link for chosen roll" },
      "Weapon Assisted": { tpPerRank: 2, maxRanks: 1, hasNotes: false },
      // -- From official examples --
      "Big Bang": { tpPerRank: 5, maxRanks: 3, hasNotes: false },
      "Broad Beam": { tpPerRank: 2, maxRanks: 1, hasNotes: false, requirement: "Beam Profile" },
      "Chain Attack": { tpPerRank: 8, maxRanks: 1, hasNotes: true },
      "Giant Sphere": { tpPerRank: 6, maxRanks: 1, hasNotes: false },
      "Karmic": { tpPerRank: 8, maxRanks: 1, hasNotes: false },
      "Widespread Magic": { tpPerRank: 5, maxRanks: 1, hasNotes: true, requirement: "Magic Foundation" }
    },

    // ==================== TECHNIQUE DISADVANTAGES ====================
    techniqueDisadvantagesData: {
      // -- Movement Disadvantages --
      "Drop Down": { tpPerRank: -2, maxRanks: 1, hasNotes: false, requirement: "Charging Assault, Restricted \u2013 Environment (High)" },
      "Recoil": { tpPerRank: -2, maxRanks: 1, hasNotes: false, requirement: "Hit and Run" },
      // -- Resource Disadvantages --
      "All or Nothing": { tpPerRank: -5, maxRanks: 1, hasNotes: false },
      "Backlash": { tpPerRank: [-2, -3, -3, -3, -3], maxRanks: 5, hasNotes: false },
      "Inefficiency": { tpPerRank: [-6, -7], maxRanks: 2, hasNotes: false, requirement: "No Efficiency" },
      // -- Restriction Disadvantages --
      "Concentration": { tpPerRank: -4, maxRanks: 1, hasNotes: false, requirement: "Energy/Magic/Soaring/Physical+Widespread Assault or Charging Assault" },
      "Grappling": { tpPerRank: -5, maxRanks: 1, hasNotes: false },
      "Restricted \u2013 Aura": { tpPerRank: -4, maxRanks: 1, hasNotes: true },
      "Restricted \u2013 Environment": { tpPerRank: -6, maxRanks: 1, hasNotes: true },
      "Restricted \u2013 State": { tpPerRank: -4, maxRanks: 1, hasNotes: true },
      "Restricted \u2013 Transformation": { tpPerRank: [-2, -4], maxRanks: 2, hasNotes: true },
      "Restricted \u2013 Untransformed": { tpPerRank: -6, maxRanks: 1, hasNotes: false, requirement: "Possess a Form" },
      "Restricted \u2013 Weapon": { tpPerRank: [-2, -4], maxRanks: 2, hasNotes: true, requirement: "Weapon Assisted" },
      "Restricted \u2013 Weather": { tpPerRank: -4, maxRanks: 1, hasNotes: true },
      "Required Counter": { tpPerRank: -5, maxRanks: 1, hasNotes: false, requirement: "Counter" },
      "Vehicle Attack": { tpPerRank: -4, maxRanks: 1, hasNotes: false, requirement: "Blitz Profile or Restricted \u2013 Weapon" },
      // -- Set-Up Disadvantages --
      "Lead Up": { tpPerRank: -6, maxRanks: 1, hasNotes: true, requirement: "No Mandatory Charge" },
      "Mandatory Charge": { tpPerRank: [-4, -8, -10], maxRanks: 3, hasNotes: false },
      "Sneak Attack": { tpPerRank: -4, maxRanks: 1, hasNotes: false },
      "Special Set Up": { tpPerRank: -4, maxRanks: 1, hasNotes: true, requirement: "No Mandatory Charge or Lead Up" },
      // -- Targeting Disadvantages --
      "Distant Explosion": { tpPerRank: -3, maxRanks: 1, hasNotes: false, requirement: "Sphere AoE, no Self-Explosion" },
      "Hostile Chase": { tpPerRank: -7, maxRanks: 1, hasNotes: false, requirement: "Homing 2+, Energy or Magic" },
      "Limited Line": { tpPerRank: [-4, -2], maxRanks: 2, hasNotes: false, requirement: "Line AoE" },
      "Self-Explosion": { tpPerRank: -6, maxRanks: 1, hasNotes: false, requirement: "Sphere AoE, no Distant Explosion" },
      "Skyward Strike": { tpPerRank: -8, maxRanks: 1, hasNotes: false, requirement: "No AoE, Energy/Magic/Physical+Charging Assault" },
      "Small Scale Blast": { tpPerRank: -4, maxRanks: 1, hasNotes: false, requirement: "Sphere AoE, no Terrain Destruction" },
      "Volatile Explosion": { tpPerRank: -8, maxRanks: 1, hasNotes: false, requirement: "Sphere AoE" },
      // -- Weakness Disadvantages --
      "Compressed Element": { tpPerRank: -4, maxRanks: 1, hasNotes: false, requirement: "Elemental (Fire/Ice/Lightning/Poison/Water/Dark/Light/Plantlife)" },
      "Exhaustive": { tpPerRank: [-6, -10], maxRanks: 2, hasNotes: false },
      "Inaccurate": { tpPerRank: [-4, -5, -6], maxRanks: 3, hasNotes: false, requirement: "No Accurate" },
      "Low Penetration": { tpPerRank: [-2, -3, -4], maxRanks: 3, hasNotes: false, requirement: "No Power Shot or Penetration" },
      "Short Range": { tpPerRank: -2, maxRanks: 2, hasNotes: false, requirement: "Energy or Magic, no AoE" },
      "Stat Drain": { tpPerRank: -7, maxRanks: 3, hasNotes: false },
      // -- Miscellaneous Disadvantages --
      "Climax Attack": { tpPerRank: [-2, -3, -4], maxRanks: 3, hasNotes: false },
      "Dead-Link": { tpPerRank: -6, maxRanks: 1, hasNotes: true, requirement: "No Twin-Linked for chosen roll" },
      "Shoot and Pray": { tpPerRank: [-3, -4], maxRanks: 2, hasNotes: false, requirement: "Combination Profile" },
      "Short Delay": { tpPerRank: -4, maxRanks: 1, hasNotes: false, requirement: "Delayed" },
      "United Attack": { tpPerRank: -10, maxRanks: 1, hasNotes: false },
      // -- From official examples --
      "Blind Karma": { tpPerRank: -4, maxRanks: 1, hasNotes: false },
      "Time-Skipped": { tpPerRank: -6, maxRanks: 1, hasNotes: false },
      "Trick Technique": { tpPerRank: -5, maxRanks: 1, hasNotes: false }
    },

    // ==================== AURA TYPES ====================
    auraTypes: {
      "Sparking": { kpCost: 8, effect: "Increase all Combat Rolls and both Force and Magic Modifiers by 1(T)" },
      "Burning": { kpCost: 6, effect: "At end of turn, reduce Life Points of all characters in Minor Sphere AoE by 3(T)" },
      "Hazardous": { kpCost: 6, effect: "Create a Battle Weather at first Tier within Minor Sphere AoE (centered on you)" },
      "Avatar": { kpCost: 8, effect: "Increase Size Category to Gigantic + 2 free ranks of Absorption Advantage" },
      "Energy Focus": { kpCost: 6, effect: "Choose Melee Weapon Category, Size, and 2 Weapon Qualities; benefit from them on Unarmed Physical Attacks" },
      "Draining Focus": { kpCost: 8, effect: "Each time you deal Damage with Attacking Maneuver, reduce opponent's Life and Ki by 2(bT)" },
      "Shield": { kpCost: 10, effect: "Create barrier that absorbs damage instead of losing Life Points; Shield Durability = 5x Might" }
    },

    // ==================== AURA ADVANTAGES ====================
    auraAdvantagesData: {
      // Augmentation
      "Big Aura": { tpPerRank: [10, 6, 6], maxRanks: 3, hasNotes: false, requirement: "Burning or Hazardous Aura" },
      "Boosting": { tpPerRank: 7, maxRanks: 4, hasNotes: true },
      "Element Bound": { tpPerRank: 10, maxRanks: 3, hasNotes: true },
      "Flashy Aura": { tpPerRank: [4, 5], maxRanks: 2, hasNotes: false },
      "Range Extension": { tpPerRank: 2, maxRanks: 3, hasNotes: false },
      "Scaling": { tpPerRank: 10, maxRanks: 1, hasNotes: true, requirement: "No Boosting or Tiring" },
      "Skill Shield": { tpPerRank: 4, maxRanks: 1, hasNotes: false, requirement: "Shield Aura" },
      "Technical Aura": { tpPerRank: 15, maxRanks: 1, hasNotes: true },
      "Variable Energy Weapon": { tpPerRank: [3, 5, 7], maxRanks: 3, hasNotes: false, requirement: "Energy Focus Aura" },
      // Defensive
      "Absorption": { tpPerRank: [6, 8], maxRanks: 2, hasNotes: false },
      "Environmental Shielding": { tpPerRank: 6, maxRanks: 1, hasNotes: false, requirement: "Shield Aura" },
      "Expanded Shield": { tpPerRank: 10, maxRanks: 1, hasNotes: false, requirement: "Shield Aura" },
      "Protective": { tpPerRank: [6, 8], maxRanks: 2, hasNotes: false },
      "Solid Shield": { tpPerRank: 6, maxRanks: 1, hasNotes: false, requirement: "Expanded Shield" },
      "Dynamic Shield": { tpPerRank: 6, maxRanks: 1, hasNotes: false, requirement: "Shield Aura" },
      // Offensive
      "Burst Aura": { tpPerRank: 2, maxRanks: 1, hasNotes: false },
      "Charging Aura": { tpPerRank: 8, maxRanks: 1, hasNotes: false },
      "Deadly Drain": { tpPerRank: [8, 8, 10], maxRanks: 3, hasNotes: false, requirement: "Draining Focus" },
      "Defiant Aura": { tpPerRank: [2, 3, 3], maxRanks: 3, hasNotes: false, effect: "+1(T) per rank to Combat Rolls when below Health Thresholds." },
      "Explosive Aura": { tpPerRank: 12, maxRanks: 1, hasNotes: false, requirement: "Burning Aura", effect: "When you Power Up, everyone in your Aura's AoE must dodge or take damage." },
      "Flaring Aura": { tpPerRank: [6, 6, 8], maxRanks: 3, hasNotes: false, requirement: "Burning Aura" },
      "Powerful Aura": { tpPerRank: [4, 5, 6], maxRanks: 3, hasNotes: false },
      "Push Through It": { tpPerRank: 8, maxRanks: 1, hasNotes: false, requirement: "Scaling Advantage" },
      "Reactive Shield": { tpPerRank: 7, maxRanks: 1, hasNotes: false, requirement: "Shield Aura" },
      // Exceptional
      "Offensive Shield": { tpPerRank: 8, maxRanks: 1, hasNotes: false, requirement: "Shield Aura" },
      "Selective": { tpPerRank: 7, maxRanks: 1, hasNotes: false, requirement: "Burning Aura" },
      "Strainless Aura": { tpPerRank: 7, maxRanks: 1, hasNotes: false },
      "Tax Exempt": { tpPerRank: 5, maxRanks: 1, hasNotes: false, requirement: "Efficiency rank 1+" },
      // Utility
      "Efficiency": { tpPerRank: [8, 7], maxRanks: 2, hasNotes: false },
      "Hefty Aura": { tpPerRank: [6, 6, 8], maxRanks: 3, hasNotes: false },
      "High Speed Aura": { tpPerRank: [2, 2, 1], maxRanks: 3, hasNotes: false, requirement: "Sparking Aura" },
      "Infusion": { tpPerRank: 6, maxRanks: 1, hasNotes: false },
      "Restorative Shield": { tpPerRank: 6, maxRanks: 1, hasNotes: false, requirement: "Shield Aura" },
      "Sensory Refinement": { tpPerRank: [1, 2, 2], maxRanks: 3, hasNotes: false },
      "Shockwave": { tpPerRank: 4, maxRanks: 1, hasNotes: false },
      "State of Mind": { tpPerRank: 12, maxRanks: 1, hasNotes: true, requirement: "Sparking Aura" }
    },

    // ==================== AURA DISADVANTAGES ====================
    auraDisadvantagesData: {
      // Harmful
      "Burnout": { tpPerRank: -6, maxRanks: 1, hasNotes: false },
      "Dangerous Aura": { tpPerRank: [-4, -4, -6], maxRanks: 3, hasNotes: false },
      "Degrading Shield": { tpPerRank: [-4, -6, -8], maxRanks: 3, hasNotes: false, requirement: "Shield Aura" },
      "Distracting Aura": { tpPerRank: [-1, -1, -2], maxRanks: 3, hasNotes: false },
      "Heavy Aura": { tpPerRank: [-4, -4, -6], maxRanks: 3, hasNotes: false },
      "Immolate Self": { tpPerRank: -10, maxRanks: 1, hasNotes: false, requirement: "Burning Aura" },
      "Life Drain": { tpPerRank: [-2, -3, -4, -4, -4], maxRanks: 5, hasNotes: false },
      "Stat Loss": { tpPerRank: [-6, -6], maxRanks: 2, hasNotes: true },
      "Tiring": { tpPerRank: [-4, -5, -6], maxRanks: 3, hasNotes: false },
      "Vulnerable Aura": { tpPerRank: [-6, -8, -8], maxRanks: 3, hasNotes: false },
      // Prohibitive
      "Base Aura": { tpPerRank: -8, maxRanks: 1, hasNotes: false },
      "Climactic": { tpPerRank: [-2, -3, -4], maxRanks: 3, hasNotes: false },
      "Focused": { tpPerRank: [-8, -10, -12], maxRanks: 3, hasNotes: false },
      "Fragile State": { tpPerRank: [-2, -3, -4], maxRanks: 3, hasNotes: false, requirement: "Required State" },
      "Harsh Focus": { tpPerRank: -5, maxRanks: 1, hasNotes: false },
      "Numb": { tpPerRank: [-3, -4, -4], maxRanks: 3, hasNotes: false },
      "Required State": { tpPerRank: -4, maxRanks: 1, hasNotes: true },
      // Miscellaneous
      "Inefficiency": { tpPerRank: [-6, -7], maxRanks: 2, hasNotes: false },
      "Small Avatar": { tpPerRank: [-3, -3], maxRanks: 2, hasNotes: false, requirement: "Avatar Aura" },
      "Restricted Aura": { tpPerRank: -6, maxRanks: 1, hasNotes: true, requirement: "Access to a Transformation" },
      "Stressful Aura": { tpPerRank: -5, maxRanks: 3, hasNotes: false, requirement: "Restricted Aura, no Strainless Aura" },
      "Tax Evasion": { tpPerRank: -5, maxRanks: 1, hasNotes: false, requirement: "Tax Exempt" },
      "Time Limit": { tpPerRank: -8, maxRanks: 1, hasNotes: false }
    },

    // ==================== TECHNIQUE POINTS ====================
    techniquePoints: {
      total: 40
    },

    // ==================== TRANSFORMATION TYPES ====================
    transformationTypes: [
      { id: "manifested_power", name: "Manifested Power", category: "manifested_power" },
      { id: "enhancement_standard", name: "Enhancement (Standard)", category: "enhancement_power" },
      { id: "enhancement_special", name: "Enhancement (Special)", category: "enhancement_power" },
      { id: "enhancement_transcendent", name: "Enhancement (Transcendent)", category: "enhancement_power" },
      { id: "form_alternate", name: "Form (Alternate)", category: "form_alternate" },
      { id: "form_legendary", name: "Form (Legendary)", category: "form_legendary" }
    ],

    // ==================== TRANSFORMATION CATEGORIES ====================
    transformationCategories: [
      { id: "manifested_power", name: "Manifested Powers", typeId: "manifested_power" },
      { id: "enhancement_power", name: "Enhancement Powers", typeId: "enhancement_standard" },
      { id: "form_alternate", name: "Alternate Forms", typeId: "form_alternate" },
      { id: "form_legendary", name: "Legendary Forms", typeId: "form_legendary" }
    ],

    // ==================== PERK TYPES ====================
    perkTypes: [
      { id: "character_perk", name: "Character Perk" },
      { id: "talent_addition", name: "Talent Addition" },
      { id: "attribute_addition", name: "Attribute Addition" },
      { id: "skill_improvement", name: "Skill Improvement" }
    ],

    // ==================== PROGRESSION ROWS ====================
    progressionRows: [
      // Level 1 - Starting character: 1 CP, 4 Talents, 5 Attr Additions, 1 Skill Improvement
      // Hidden row: provides racial skill slots at character creation (not rendered in UI)
      { id: 0, level: 1, perkType: "starting_stats", talent: "", ag: 0, fo: 0, te: 0, sc: 0, in: 0, ma: 0, pe: 0, tp: 0, skills: [] },
      { id: 1, level: 1, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 2, level: 1, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 3, level: 1, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 4, level: 1, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 5, level: 1, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 6, level: 1, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 7, level: 1, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 8, level: 1, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 9, level: 1, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 10, level: 1, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 11, level: 1, perkType: "skill_improvement", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 2: Character Perk
      { id: 13, level: 2, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 3: Attribute Addition
      { id: 14, level: 3, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 4: Character Perk
      { id: 15, level: 4, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 5: Talent Addition + Attribute Addition + Skill Improvement (Tier 2)
      { id: 16, level: 5, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 17, level: 5, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 18, level: 5, perkType: "skill_improvement", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 6: Character Perk
      { id: 19, level: 6, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 7: Attribute Addition
      { id: 20, level: 7, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 8: Character Perk
      { id: 21, level: 8, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 9: Talent Addition
      { id: 22, level: 9, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 10: Talent Addition + Attribute Addition + Skill Improvement (Tier 3)
      { id: 23, level: 10, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 24, level: 10, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 25, level: 10, perkType: "skill_improvement", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 11: Character Perk
      { id: 26, level: 11, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 12: Attribute Addition
      { id: 27, level: 12, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 13: Character Perk
      { id: 28, level: 13, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 14: Talent Addition
      { id: 29, level: 14, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 15: Talent Addition + Attribute Addition + Skill Improvement (Tier 4)
      { id: 30, level: 15, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 31, level: 15, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 32, level: 15, perkType: "skill_improvement", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 16: Character Perk
      { id: 33, level: 16, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 17: Attribute Addition
      { id: 34, level: 17, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 18: Character Perk
      { id: 35, level: 18, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 19: Talent Addition
      { id: 36, level: 19, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 20: Talent Addition + Attribute Addition + Skill Improvement (Tier 5)
      { id: 37, level: 20, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 38, level: 20, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 39, level: 20, perkType: "skill_improvement", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 21: Character Perk
      { id: 40, level: 21, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 22: Attribute Addition
      { id: 41, level: 22, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 23: Character Perk
      { id: 42, level: 23, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 24: Talent Addition
      { id: 43, level: 24, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 25: Talent Addition + Attribute Addition + Skill Improvement (Tier 6)
      { id: 44, level: 25, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 45, level: 25, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 46, level: 25, perkType: "skill_improvement", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 26: Character Perk
      { id: 47, level: 26, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 27: Attribute Addition
      { id: 48, level: 27, perkType: "attribute_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 28: Character Perk
      { id: 49, level: 28, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 29: Talent Addition
      { id: 50, level: 29, perkType: "talent_addition", talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      // Level 30: 5x Character Perk (Pinnacle)
      { id: 51, level: 30, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 52, level: 30, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 53, level: 30, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 54, level: 30, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] },
      { id: 55, level: 30, perkType: "character_perk", convertible: true, talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null, tp: null, skills: [] }
    ],

    // ==================== LEVEL PROGRESSION ====================
    levelProgression: {
      1: { tier: 1 },
      2: { tier: 1 },
      3: { tier: 1 },
      4: { tier: 1 },
      5: { tier: 2 },
      6: { tier: 2 },
      7: { tier: 2 },
      8: { tier: 2 },
      9: { tier: 2 },
      10: { tier: 3 },
      11: { tier: 3 },
      12: { tier: 3 },
      13: { tier: 3 },
      14: { tier: 3 },
      15: { tier: 4 },
      16: { tier: 4 },
      17: { tier: 4 },
      18: { tier: 4 },
      19: { tier: 4 },
      20: { tier: 5 },
      21: { tier: 5 },
      22: { tier: 5 },
      23: { tier: 5 },
      24: { tier: 5 },
      25: { tier: 6 },
      26: { tier: 6 },
      27: { tier: 6 },
      28: { tier: 6 },
      29: { tier: 6 },
      30: { tier: 7 }
    },

    // ==================== PROGRESSION TABLE ====================
    progressionTable: [
      { level: 1, tier: 1, features: "Starting: 1 CP, 4 Talents, 5 Attr, Skill Imp" },
      { level: 2, tier: 1, features: "Character Perk" },
      { level: 3, tier: 1, features: "Attribute Addition" },
      { level: 4, tier: 1, features: "Character Perk" },
      { level: 5, tier: 2, features: "Tier 2 \u2014 Talent, Attr, Skill Imp" },
      { level: 6, tier: 2, features: "Character Perk" },
      { level: 7, tier: 2, features: "Attribute Addition" },
      { level: 8, tier: 2, features: "Character Perk" },
      { level: 9, tier: 2, features: "Talent Addition" },
      { level: 10, tier: 3, features: "Tier 3 \u2014 Talent, Attr, Skill Imp" },
      { level: 11, tier: 3, features: "Character Perk" },
      { level: 12, tier: 3, features: "Attribute Addition" },
      { level: 13, tier: 3, features: "Character Perk" },
      { level: 14, tier: 3, features: "Talent Addition" },
      { level: 15, tier: 4, features: "Tier 4 \u2014 Talent, Attr, Skill Imp" },
      { level: 16, tier: 4, features: "Character Perk" },
      { level: 17, tier: 4, features: "Attribute Addition" },
      { level: 18, tier: 4, features: "Character Perk" },
      { level: 19, tier: 4, features: "Talent Addition" },
      { level: 20, tier: 5, features: "Tier 5 \u2014 Talent, Attr, Skill Imp" },
      { level: 21, tier: 5, features: "Character Perk" },
      { level: 22, tier: 5, features: "Attribute Addition" },
      { level: 23, tier: 5, features: "Character Perk" },
      { level: 24, tier: 5, features: "Talent Addition" },
      { level: 25, tier: 6, features: "Tier 6 \u2014 Talent, Attr, Skill Imp" },
      { level: 26, tier: 6, features: "Character Perk" },
      { level: 27, tier: 6, features: "Attribute Addition" },
      { level: 28, tier: 6, features: "Character Perk" },
      { level: 29, tier: 6, features: "Talent Addition" },
      { level: 30, tier: 7, features: "Tier 7 \u2014 5x Character Perk (Pinnacle)" }
    ],

    // ==================== SIZE CATEGORIES ====================
    sizeCategories: ["Nano", "Tiny", "Small", "Medium", "Large", "Enormous", "Gigantic", "Colossal"],

    // ==================== HEALTH THRESHOLDS ====================
    healthThresholds: {
      healthy: { name: "Healthy", penalty: 0, percentage: "100-76%" },
      injured: { name: "Injured", penalty: -1, percentage: "75-51%" },
      bloodied: { name: "Bloodied", penalty: -2, percentage: "50-26%" },
      wounded: { name: "Wounded", penalty: -3, percentage: "25-11%" },
      critical: { name: "Critical", penalty: -4, percentage: "10-1%" }
    },

    // ==================== CUSTOM BUFF OPTIONS ====================
    customBuffOptions: [
      // Attribute Scores
      "AG Score", "FO Score", "TE Score", "SC Score", "IN Score", "MA Score", "PE Score",
      // Attribute Modifiers
      "AG Modifier", "FO Modifier", "TE Modifier", "SC Modifier", "IN Modifier", "MA Modifier", "PE Modifier",
      // ToP & Progression
      "ToP (Breakthrough)", "ToP Extra Dice Cat.", "ToP Extra Dice Cat. (Dodge)", "ToP Extra Dice Cat. (Strike)", "ToP Extra Dice Cat. (Wound)",
      "TP per Skill Improvement",
      // Resources
      "Max Life Points", "Max Life Points \u00b11/4", "Max Ki Pool", "Max Ki Pool \u00b11/4",
      "Max Capacity", "Max Capacity \u00b11/4", "Racial Life Modifier",
      // Defense
      "Damage Reduction", "Soak", "Soak (from Exceed Trait)", "Double Base Soak", "Defense Value",
      // Super Stacks
      "Super Stacks", "Power Burst S. Stacks", "No Super Stack Pen.", "Super Stack Extra Dice", "Super Stack Dice Category",
      // Range
      "Long Range Distance",
      // Saves
      "All Saves", "Impulsive Saves", "Cognitive Saves", "Corporeal Saves", "Morale Saves",
      // Combat General
      "Haste", "Awareness", "Initiative", "Combat Rolls",
      // Strike
      "Strike (All)", "Strike CT (All)", "Strike (Physical)", "Strike CT (Physical)",
      "Strike (Energy)", "Strike CT (Energy)", "Strike (Magic)", "Strike CT (Magic)",
      // Dodge
      "Dodge", "Dodge CT",
      // Wound
      "Wound (All)", "Wound CT (All)", "Wound (Physical)", "Wound CT (Physical)",
      "Wound (Energy)", "Wound CT (Energy)", "Wound (Magic)", "Wound CT (Magic)",
      // Might & Stress
      "Might", "Might for Clashes", "Stress Bonus", "Threshold Breaker",
      // Speed
      "Normal Speed", "Boosted Speed", "Both Speeds",
      "Normal Speed \u00b11/4", "Boosted Speed \u00b11/4", "Both Speeds \u00b11/4",
      "Halve Normal Speed", "Halve Boosted Speed", "Halve Both Speeds",
      // Size & Penalties
      "Size Category", "No Strike Penalties", "No Dodge Penalties", "No Wound Penalties",
      // Maneuvers
      "Hype Maneuver", "Analysis Maneuver (Investigation)", "Analysis Maneuver (Intuition)",
      // Skills
      "Agility Skills", "Force Skills", "Scholarship Skills", "Insight Skills", "Magic Skills", "Personality Skills",
      "Acrobatics", "Bluff", "Clairvoyance", "Concealment", "Craft", "Creature Handling",
      "Intimidation", "Intuition", "Investigation", "Knowledge", "Medicine", "Perception",
      "Performance", "Persuasion", "Pilot", "Stealth", "Survival", "Thievery", "Use Magic",
      // States & Dice
      "States", "Greater Dice Category", "Greater Dice (All)", "Greater Dice (Dodge)", "Greater Dice (Strike)", "Greater Dice (Wound)",
      "ToP Extra Dice (All)", "ToP Extra Dice (Dodge)", "ToP Extra Dice (Strike)", "ToP Extra Dice (Wound)",
      // Extra Dice
      "Extra d4 (Combat Rolls)", "Extra d6 (Combat Rolls)", "Extra d8 (Combat Rolls)", "Extra d10 (Combat Rolls)",
      "Extra d4 (Dodge)", "Extra d6 (Dodge)", "Extra d8 (Dodge)", "Extra d10 (Dodge)",
      "Extra d4 (Strike)", "Extra d6 (Strike)", "Extra d8 (Strike)", "Extra d10 (Strike)",
      "Extra d4 (Wound)", "Extra d6 (Wound)", "Extra d8 (Wound)", "Extra d10 (Wound)",
      "Surging Extra Dice",
      // Signature Techniques
      "Signature CT (Strike)", "Signature Strike", "Signature CT (Wound)", "Signature Wound",
      "Signature Extra ToP Dice (All)", "Signature Extra ToP Dice (Strike)", "Signature Extra ToP Dice (Wound)",
      "Signature d4 (All)", "Signature d6 (All)", "Signature d8 (All)", "Signature d10 (All)",
      "Signature d4 (Strike)", "Signature d6 (Strike)", "Signature d8 (Strike)", "Signature d10 (Strike)",
      "Signature d4 (Wound)", "Signature d6 (Wound)", "Signature d8 (Wound)", "Signature d10 (Wound)",
      // Combat Styles
      "Duel Clash Bonus", "Armed Strike", "Armed Wound", "Unarmed Strike", "Unarmed Wound",
      // Ki Costs
      "Ki Point Cost Attacks", "Ki Point Cost Attacks (no cap)",
      "Ki Point Cost Unique Abilities", "Ki Point Cost Unique Abilities (Magical)", "Ki Point Cost Unique Abilities (Technical)",
      // Dice Categories
      "Energy Charge Dice Category", "Signature Energy Charge Dice Category",
      "Raging Dice Size", "Surging Dice Size", "Superior Dice Size", "Attacking Damage Category",
      // Other
      "Ignore Transformation Lite", "I'm being Bludgeoned"
    ],

    // ==================== EFFECT TRACKING (default state) ====================
    effectTracking: {
      enabledPassives: {},
      usedEffects: {
        round: {},
        encounter: {}
      }
    },

    // ==================== SAVING THROWS ====================
    savingThrows: {
      impulsive: { name: "Impulsive", attributes: ["ag", "in"] },
      corporeal: { name: "Corporeal", attributes: ["fo", "te"] },
      cognitive: { name: "Cognitive", attributes: ["sc", "in"] },
      morale: { name: "Morale", attributes: ["te", "pe"] }
    },

    // ==================== CONDITIONS ====================
    conditions: [
      { id: "blinded", name: "Blinded", maxStacks: 1, effect: "No Sight. Illuminating Aura cannot reduce or remove." },
      { id: "broken", name: "Broken", maxStacks: 3, effect: "Soak -2(T)/stack. If Soak=0, +2(T) damage received/stack." },
      { id: "compelled", name: "Compelled", maxStacks: 1, effect: "Must attack assigned target. Min 2 attacks, min 6(bT) Ki Wager. Urgent rolls." },
      { id: "fatigued", name: "Fatigued", maxStacks: 2, effect: "Max Capacity halved per stack." },
      { id: "guardDown", name: "Guard Down", maxStacks: 1, effect: "Defense & Defend Strike -2(T). Guard Ki cost +1/2." },
      { id: "impediment", name: "Impediment", maxStacks: 1, effect: "Greater Dice penalty on Combat Rolls." },
      { id: "oblivious", name: "Oblivious", maxStacks: 1, effect: "Can't target opponent. Soak -2(T), Dodge -1(T), Strike -3(T) vs them." },
      { id: "pinned", name: "Pinned", maxStacks: 1, effect: "Actions reduced to 1. No attacks or movement. Might Clash to escape." },
      { id: "poisoned", name: "Poisoned", maxStacks: 1, effect: "LP -1/10 max at end of turn. Double Health Threshold Penalties." },
      { id: "prone", name: "Prone", maxStacks: 1, effect: "Speed, Defense, Haste halved. Damage Category +1. 1 Action to stand." },
      { id: "shaken", name: "Shaken", maxStacks: 1, effect: "Can't move toward inflictor. Strike -2(T)." },
      { id: "sleeping", name: "Sleeping", maxStacks: 1, effect: "Can't act. Auto-hit by attacks. Removed when hit." },
      { id: "slowed", name: "Slowed", maxStacks: 3, effect: "-1 Action & Speed -1/3 per stack. At 3: skip turn entirely." },
      { id: "stressExhaustion", name: "Stress Exhaustion", maxStacks: 1, effect: "Exit all Transformations. Ki -1/2 if in Core. Can't transform." },
      { id: "suffocating", name: "Suffocating", maxStacks: 1, effect: "LP -1/5 max at end of turn." }
    ],

    // ==================== CHARACTER DATA (default template) ====================
    characterDataTemplate: {
      name: "Kaito",
      tier: 1,
      level: 1,

      // Resources
      lifePoints: { current: 45, max: 50 },
      kiPool: { current: 38, max: 40 },

      // Attributes (base score of 1, modified by progression)
      attributes: {
        ag: { name: "Agility", abbr: "AG", score: 1 },
        fo: { name: "Force", abbr: "FO", score: 1 },
        te: { name: "Tenacity", abbr: "TE", score: 1 },
        sc: { name: "Scholarship", abbr: "SC", score: 1 },
        in: { name: "Insight", abbr: "IN", score: 1 },
        ma: { name: "Magic", abbr: "MA", score: 1 },
        pe: { name: "Personality", abbr: "PE", score: 1 }
      },

      // Saving Throws
      savingThrows: {
        impulsive: { name: "Impulsive", attributes: ["ag", "in"], proficient: false },
        corporeal: { name: "Corporeal", attributes: ["fo", "te"], proficient: true },
        cognitive: { name: "Cognitive", attributes: ["sc", "in"], proficient: false },
        morale: { name: "Morale", attributes: ["te", "pe"], proficient: false }
      },

      // Status
      healthThreshold: "healthy",
      capacity: 12,
      speed: 4,
      soakValue: 8,

      // Combat Rolls
      combatRolls: {
        strike: 12,
        dodge: 10,
        wound: 8
      },

      // Combat Tracking
      tracking: {
        energyCharges: 0,
        powerStacks: 0,
        diminishingDefense: 0,
        diminishingOffense: 0,
        combatStates: [],
        customBuffs: []
      },

      // Conditions (15 from Damage & Conditions manual)
      conditions: [
        { id: "blinded", name: "Blinded", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "No Sight. Illuminating Aura cannot reduce or remove." },
        { id: "broken", name: "Broken", active: false, stacks: 0, maxStacks: 3, roundApplied: null, effect: "Soak -2(T)/stack. If Soak=0, +2(T) damage received/stack." },
        { id: "compelled", name: "Compelled", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "Must attack assigned target. Min 2 attacks, min 6(bT) Ki Wager. Urgent rolls." },
        { id: "fatigued", name: "Fatigued", active: false, stacks: 0, maxStacks: 2, roundApplied: null, effect: "Max Capacity halved per stack." },
        { id: "guardDown", name: "Guard Down", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "Defense & Defend Strike -2(T). Guard Ki cost +1/2." },
        { id: "impediment", name: "Impediment", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "Greater Dice penalty on Combat Rolls." },
        { id: "oblivious", name: "Oblivious", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "Can't target opponent. Soak -2(T), Dodge -1(T), Strike -3(T) vs them." },
        { id: "pinned", name: "Pinned", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "Actions reduced to 1. No attacks or movement. Might Clash to escape." },
        { id: "poisoned", name: "Poisoned", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "LP -1/10 max at end of turn. Double Health Threshold Penalties." },
        { id: "prone", name: "Prone", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "Speed, Defense, Haste halved. Damage Category +1. 1 Action to stand." },
        { id: "shaken", name: "Shaken", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "Can't move toward inflictor. Strike -2(T)." },
        { id: "sleeping", name: "Sleeping", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "Can't act. Auto-hit by attacks. Removed when hit." },
        { id: "slowed", name: "Slowed", active: false, stacks: 0, maxStacks: 3, roundApplied: null, effect: "-1 Action & Speed -1/3 per stack. At 3: skip turn entirely." },
        { id: "stressExhaustion", name: "Stress Exhaustion", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "Exit all Transformations. Ki -1/2 if in Core. Can't transform." },
        { id: "suffocating", name: "Suffocating", active: false, stacks: 0, maxStacks: 1, roundApplied: null, effect: "LP -1/5 max at end of turn." }
      ],

      // Details
      details: {
        name: "",
        player: "",
        race: "saiyan",
        subrace: "",
        subspecies: "",
        proficientSave: "corporeal",
        baseSize: "medium",
        size: "Medium",
        height: "",
        weight: "",
        age: "",
        gender: "",
        skinTone: "",
        eyeColor: "",
        hairColor: ""
      },

      // Z-Soul
      zsoul: {
        alignment: "neutral",
        karma: 0,
        quote: "I will surpass my limits!"
      },

      // Character's selected racial traits (by ID)
      racialTraits: [],

      // Racial trait option selections
      racialOptionSelections: {},

      // Character's selected talents (by ID)
      talents: [],

      biography: "",
      notes: ""
    },

    // ==================== SIGNATURE TECHNIQUES (default) ====================
    signatureTechniquesDefault: [
      {
        id: 1,
        name: "Kamehameha",
        type: "Super Signature",
        foundation: "Energy",
        profile: "Beam",
        isLimitBreak: false,
        description: "The Kamehameha is formed when cupped hands are drawn to the user's side and ki is concentrated into a single point. The hands are then thrust forward to shoot out a streaming, powerful beam of energy.",
        tpCost: 0,
        tpMax: 30,
        freeTP: 0,
        baseEnergyCharges: 1,
        extraEnergyCharges: 0,
        strikeFormula: "1d10+4",
        strikeCT: "8+",
        woundFormula: "1d10+2d8+6",
        woundCT: "9+",
        isWeapon: false,
        advantages: [
          { name: "Power Shot", ranks: 2, notes: "", tpCost: 6, dynamicTP: 0 },
          { name: "Accurate", ranks: 1, notes: "", tpCost: 3, dynamicTP: 0 }
        ],
        disadvantages: [
          { name: "Mandatory Charge", ranks: 1, notes: "", tpCost: -4, dynamicTP: 0 },
          { name: "Stat Drain", ranks: 1, notes: "Force", tpCost: -5, dynamicTP: 0 }
        ]
      }
    ],

    // ==================== SIGNATURE AURAS (default) ====================
    signatureAurasDefault: [
      {
        id: 1,
        name: "Kaioken Aura",
        type: "Sparking",
        active: false,
        description: "A powerful aura technique that multiplies the user's combat abilities at the cost of physical strain.",
        tpCost: 0,
        tpMax: 50,
        freeTP: 0,
        advantages: [
          { name: "Boosting", ranks: 2, notes: "FO, AG", tpCost: 14, dynamicTP: 0 },
          { name: "High Speed Aura", ranks: 2, notes: "", tpCost: 4, dynamicTP: 0 }
        ],
        disadvantages: [
          { name: "Life Drain", ranks: 2, notes: "", tpCost: -5, dynamicTP: 0 },
          { name: "Tiring", ranks: 1, notes: "", tpCost: -4, dynamicTP: 0 }
        ]
      }
    ],

    // ==================== EQUIPMENT CONFIG ====================

    apparelCategories: {
      armor: { id: "armor", name: "Armor", effect: "Gain Damage Reduction equal to Apparel Bonus.", rules: "Must be Top Layer. Cannot equip other Apparel during Combat Encounter while wearing Armor." },
      weights: { id: "weights", name: "Weights", effect: "Reduce Combat Rolls by Apparel Bonus.", rules: "Penalty applies regardless of layer. Doff Bonus after 3rd Combat Round: increase Doff Bonus by 1/2 (rounded up)." },
      combat_clothing: { id: "combat_clothing", name: "Combat Clothing", effect: "Increase Defense Value by 1/2 (rounded up) of Apparel Bonus.", rules: "" },
      standard_clothing: { id: "standard_clothing", name: "Standard Clothing", effect: "No Apparel Penalties. Reduce Craft DC by 1 Difficulty Category.", rules: "Benefits apply regardless of layer." }
    },

    craftsmanshipGrades: {
      1: { grade: 1, name: "Apprentice", apparelGrade: "low", qualitySlots: 0 },
      2: { grade: 2, name: "Qualified", apparelGrade: "low", qualitySlots: 1 },
      3: { grade: 3, name: "Expert", apparelGrade: "standard", qualitySlots: 2 },
      4: { grade: 4, name: "Master", apparelGrade: "standard", qualitySlots: 3 },
      5: { grade: 5, name: "Grandmaster", apparelGrade: "high", qualitySlots: 4 }
    },

    apparelGrades: {
      low: { id: "low", name: "Low", multiplier: 1 },
      standard: { id: "standard", name: "Standard", multiplier: 2 },
      high: { id: "high", name: "High", multiplier: 3 }
    },

    weaponTypes: {
      physical: { id: "physical", name: "Physical", attackType: "Physical", range: "Melee" },
      energy: { id: "energy", name: "Energy", attackType: "Energy", range: "Ranged" },
      magic: { id: "magic", name: "Magic", attackType: "Magic", range: "Ranged" }
    },

    weaponCategories: {
      bludgeoning: { id: "bludgeoning", name: "Bludgeoning", type: "physical", freeQuality: "staggering", effect: "On a Critical Result, push target 1 Space." },
      slashing: { id: "slashing", name: "Slashing", type: "physical", freeQuality: null, effect: "On a Critical Result, reduce target Soak Value by 1(bT) until end of your next turn." },
      piercing: { id: "piercing", name: "Piercing", type: "physical", freeQuality: "lasting_wounds", effect: "On a Critical Result, inflict Bleeding (1) Condition." },
      shield: { id: "shield", name: "Shield", type: "physical", freeQuality: null, effect: "Gain +1(bT) Defense Value while equipped. Cannot be used for Attacking Maneuvers." },
      efficient: { id: "efficient", name: "Efficient", type: "energy", freeQuality: null, effect: "Reduce Ki Cost of Energy Attacks by 1(bT)." },
      precision: { id: "precision", name: "Precision", type: "energy", freeQuality: "far_sight", effect: "Increase Strike Roll by 1(bT) with this weapon." },
      high_power: { id: "high_power", name: "High Power", type: "energy", freeQuality: null, effect: "Increase Wound Roll by 1(bT) with this weapon." },
      magic_staff: { id: "magic_staff", name: "Magic Staff", type: "magic", freeQuality: null, effect: "Increase Magic Modifier by 1(bT) while equipped." },
      elemental_tool: { id: "elemental_tool", name: "Elemental Tool", type: "magic", freeQuality: null, effect: "Choose an Element; attacks with this weapon gain that Element." },
      magic_orb: { id: "magic_orb", name: "Magic Orb", type: "magic", freeQuality: "spiritual_weapon", effect: "Can use Magic attacks at Melee range without penalty." }
    },

    weaponSizes: {
      small: { id: "small", name: "Small", strikeBonus: 1, woundBonus: -2, label: "+1(T) Strike, -2(T) Wound" },
      standard: { id: "standard", name: "Standard", strikeBonus: 0, woundBonus: 0, label: "No effect" },
      big: { id: "big", name: "Big", strikeBonus: -1, woundBonus: 2, label: "-1(T) Strike, +2(T) Wound" }
    },

    apparelQualities: {
      armed: { id: "armed", name: "Armed", slots: 1, categories: ["armor","combat_clothing","standard_clothing"], prerequisites: "", effect: "Possess Integrated Weapon. Create a Weapon with same Craftsmanship Grade as this Apparel.", special: false },
      beautiful_attire: { id: "beautiful_attire", name: "Beautiful Attire", slots: 1, categories: ["armor","weights","combat_clothing","standard_clothing"], prerequisites: "Personality Score 4+", effect: "+2 Dice Score on chosen Personality-based Skill Checks.", special: false },
      dense_armor: { id: "dense_armor", name: "Dense Armor", slots: 1, categories: ["armor"], prerequisites: "", effect: "Increase Apparel Bonus by 1(bT), but reduce Combat Rolls by equal amount.", special: false },
      durable: { id: "durable", name: "Durable", slots: 1, categories: ["armor","weights","combat_clothing","standard_clothing"], prerequisites: "NOT Lightweight quality", effect: "Increase max Break Value by 3.", special: false },
      environmental_protection: { id: "environmental_protection", name: "Environmental Protection", slots: 2, categories: ["standard_clothing"], prerequisites: "", effect: "Ignore Battle Environments, Environmental Qualities, Unbreathable Atmosphere.", special: false },
      focal: { id: "focal", name: "Focal", slots: 1, categories: ["weights"], prerequisites: "", effect: "Select Strike or Dodge. Only that roll is reduced by Weight penalty; only that roll benefits from Doff Bonus.", special: false },
      hefty_plating: { id: "hefty_plating", name: "Hefty Plating", slots: 1, categories: ["weights"], prerequisites: "Force Score 6+", effect: "Hardness Value = 4. If hit Opponent via Throw, Might Clash: win = Prone.", special: false },
      jacket: { id: "jacket", name: "Jacket", slots: 1, categories: ["standard_clothing"], prerequisites: "", effect: "Increase Soak Value by 1(bT). Can be worn over Armor.", special: false },
      joint_protection: { id: "joint_protection", name: "Joint Protection", slots: 1, categories: ["armor"], prerequisites: "", effect: "First time Break Value would be lowered from max in a Combat Encounter, it is not lowered.", special: false },
      lab_coat: { id: "lab_coat", name: "Lab Coat", slots: 1, categories: ["standard_clothing"], prerequisites: "Scholarship Score 4+", effect: "+2 Dice Score on chosen Scholarship-based Skill Checks.", special: false },
      leaders_insignia: { id: "leaders_insignia", name: "Leader's Insignia", slots: 1, categories: ["armor","combat_clothing","standard_clothing"], prerequisites: "Personality Score 6+", effect: "+1(bT) Combat Rolls for Minions. If has Team Outfit, +1(bT) Wound Roll for same-team Allies.", special: false },
      lightweight: { id: "lightweight", name: "Lightweight", slots: 1, categories: ["armor","combat_clothing","standard_clothing"], prerequisites: "NOT Durable quality", effect: "Does not count toward Apparel Penalty.", special: false },
      loose: { id: "loose", name: "Loose", slots: 1, categories: ["combat_clothing","standard_clothing"], prerequisites: "", effect: "Can Doff via No-Effort Maneuver.", special: false },
      mystical: { id: "mystical", name: "Mystical", slots: 1, categories: ["combat_clothing","standard_clothing"], prerequisites: "2+ Ranks in Clairvoyance and Use Magic", effect: "+1 Dice Score to Use Magic and Clairvoyance Skill Checks.", special: false },
      parrying_armor: { id: "parrying_armor", name: "Parrying Armor", slots: 1, categories: ["armor"], prerequisites: "", effect: "While no Weapon equipped, +1/2 (rounded up) of Apparel Bonus to Strike when using Parry of Defend Maneuver.", special: false },
      segmented_weight: { id: "segmented_weight", name: "Segmented Weight", slots: 1, categories: ["weights"], prerequisites: "", effect: "When Doffing, if above Low grade, reduce grade instead. +1(bT) Doff Bonus per grade lost. Can use multiple times per encounter.", special: false },
      sleek_design: { id: "sleek_design", name: "Sleek Design", slots: 1, categories: ["armor"], prerequisites: "", effect: "Halve Damage Reduction from Armor. Does not count toward Apparel Penalty.", special: false },
      spiked: { id: "spiked", name: "Spiked", slots: 1, categories: ["armor"], prerequisites: "", effect: "If hit by Physical Attack, attacker's LP reduced by Apparel Bonus.", special: false },
      stealth_suit: { id: "stealth_suit", name: "Stealth Suit", slots: 1, categories: ["combat_clothing","standard_clothing"], prerequisites: "", effect: "+2 Dice Score on Stealth Skill Checks.", special: false },
      stretching: { id: "stretching", name: "Stretching", slots: 1, categories: ["armor","weights","combat_clothing","standard_clothing"], prerequisites: "", effect: "Apparel Size Category = wearer's current Size Category.", special: false },
      team_outfit: { id: "team_outfit", name: "Team Outfit", slots: 2, categories: ["armor","weights","combat_clothing","standard_clothing"], prerequisites: "", effect: "Choose Team Name. Each Ally with same Team Outfit name: +1 Stress Bonus (no stack).", special: false },
      terrifying_design: { id: "terrifying_design", name: "Terrifying Design", slots: 1, categories: ["armor","combat_clothing","standard_clothing"], prerequisites: "2+ Ranks in Intimidation", effect: "+2 Dice Score on Intimidation Skill Checks.", special: false },
      training_support: { id: "training_support", name: "Training Support", slots: 2, categories: ["weights"], prerequisites: "2+ Ranks in Concealment", effect: "If have Holding Back stacks, ignore Weight Combat Roll reduction. Applies even if not Top Layer.", special: false },
      weather_resistant: { id: "weather_resistant", name: "Weather Resistant", slots: [1, 2, 3], categories: ["weights"], prerequisites: "2+ Ranks in Survival", effect: "Choose Battle Weather type. Ignore effects up to Weather Tier = number of slots used.", special: false },
      assassins_craft: { id: "assassins_craft", name: "Assassin's Craft", slots: 1, categories: ["armor","weights","combat_clothing","standard_clothing"], prerequisites: "2+ Ranks in Stealth", effect: "While Hidden, +Apparel Bonus to Wound Rolls vs Oblivious Characters.", special: true },
      combat_ready: { id: "combat_ready", name: "Combat Ready", slots: 1, categories: ["armor","combat_clothing","standard_clothing"], prerequisites: "", effect: "+1/2 (rounded up) of Apparel Bonus to Strike and Dodge Rolls.", special: true },
      divine_apparel: { id: "divine_apparel", name: "Divine Apparel", slots: 1, categories: ["armor","weights","combat_clothing","standard_clothing"], prerequisites: "", effect: "Increase Apparel Bonus by 1(bT).", special: true },
      enchanted: { id: "enchanted", name: "Enchanted", slots: 1, categories: ["armor","combat_clothing","standard_clothing"], prerequisites: "", effect: "Increase Soak Value by Apparel Bonus.", special: true },
      legacy: { id: "legacy", name: "Legacy", slots: 1, categories: ["armor","combat_clothing","standard_clothing"], prerequisites: "", effect: "+2 Natural Result for Steadfast Checks and Saving Throws.", special: true },
      resolute_belief: { id: "resolute_belief", name: "Resolute Belief", slots: 1, categories: ["armor","weights","combat_clothing","standard_clothing"], prerequisites: "", effect: "+2 Stress Bonus.", special: true },
      unbreakable_apparel: { id: "unbreakable_apparel", name: "Unbreakable", slots: 1, categories: ["armor","weights","combat_clothing","standard_clothing"], prerequisites: "Durable quality", effect: "Break Value cannot be reduced.", special: true },
      yardrat_material: { id: "yardrat_material", name: "Yardrat Material", slots: 1, categories: ["armor","weights","combat_clothing","standard_clothing"], prerequisites: "Spirit Control Awakening", effect: "Halve Ki Point Cost for any Unique Ability that requires Spirit Control Awakening.", special: true }
    },

    weaponCraftsmanshipGrades: {
      1: { grade: 1, name: "Apprentice", qualitySlots: 0 },
      2: { grade: 2, name: "Qualified", qualitySlots: 1 },
      3: { grade: 3, name: "Expert", qualitySlots: 2 },
      4: { grade: 4, name: "Master", qualitySlots: 3 },
      5: { grade: 5, name: "Grandmaster", qualitySlots: 4 }
    },

    weaponQualities: {
      artisan: { id: "artisan", name: "Artisan", slots: [1, 2], types: ["physical","energy","magic"], prerequisites: "", effect: "For each slot, increase Wound Rolls by 1(T).", special: false },
      barrage_weapon: { id: "barrage_weapon", name: "Barrage Weapon", slots: 1, types: ["physical"], prerequisites: "Throwing Weapon quality", effect: "When throwing, may use Combination Profile (Physical) instead of Simple.", special: false },
      boomerang: { id: "boomerang", name: "Boomerang", slots: [1, 2], types: ["physical"], prerequisites: "Throwing Weapon quality; NOT Multi-Storage", effect: "1 slot: Thrown weapon returns immediately. 2 slots: Also apply Homing Advantage to Throw Maneuver attacks.", special: false },
      breaker: { id: "breaker", name: "Breaker", slots: 1, types: ["physical","energy","magic"], prerequisites: "", effect: "Double Break Value loss on Apparel hits. Increase Weapon damage by 1/4 (rounded up).", special: false },
      burst_fire: { id: "burst_fire", name: "Burst Fire", slots: 1, types: ["energy","magic"], prerequisites: "", effect: "When attacking, may spend any number of Actions; gain 1 Energy Charge per Action spent.", special: false },
      concealed: { id: "concealed", name: "Concealed", slots: 1, types: ["physical","energy","magic"], prerequisites: "", effect: "First Armed Attack each Combat Round: Clash (Stealth vs Perception). If win, target has Guard Down.", special: false },
      controller_weapon: { id: "controller_weapon", name: "Controller Weapon", slots: [1, 2], types: ["physical","energy","magic"], prerequisites: "", effect: "1 slot: Weapon treated as Remote Control for one specific item. 2 slots: For all items of that type.", special: false },
      duelist: { id: "duelist", name: "Duelist", slots: 1, types: ["physical"], prerequisites: "", effect: "Increase Strike Rolls when using Parry effect of Defend Maneuver by 1(T).", special: false },
      durable_weapon: { id: "durable_weapon", name: "Durable", slots: [1, 2], types: ["physical"], prerequisites: "", effect: "Increase LP by 2 per Power Level. 2 slots: double the LP gained.", special: false },
      extending: { id: "extending", name: "Extending", slots: 1, types: ["physical"], prerequisites: "", effect: "Increase Melee Range by 3 for Attacking Maneuvers. If AoE, increase Magnitude by 1 (except Line).", special: false },
      far_sight: { id: "far_sight", name: "Far Sight", slots: 1, types: ["energy","magic"], prerequisites: "", effect: "Ignore Long Range penalties for Armed Attacks.", special: false },
      flexible: { id: "flexible", name: "Flexible", slots: [1, 2], types: ["physical","energy","magic"], prerequisites: "", effect: "Per slot, select a different Category of same Foundation. At start of turn, may switch Category.", special: false },
      giant_weapon: { id: "giant_weapon", name: "Giant Weapon", slots: 2, types: ["physical","energy","magic"], prerequisites: "", effect: "+3(T) Wound Rolls. -1(T) Strike for every Size Category smaller than Enormous.", special: false },
      high_tech: { id: "high_tech", name: "High-Tech", slots: 1, types: ["physical","energy","magic"], prerequisites: "", effect: "Damage Attribute for Armed Attacks is Scholarship.", special: false },
      lasting_wounds: { id: "lasting_wounds", name: "Lasting Wounds", slots: 1, types: ["physical","energy","magic"], prerequisites: "", effect: "If deal Damage, inflict 1 stack DOT until start of next turn.", special: false },
      long_range_weapon: { id: "long_range_weapon", name: "Long Range Weapon", slots: 1, types: ["energy","magic"], prerequisites: "", effect: "+1(T) Strike against Opponents 9+ Squares away.", special: false },
      multi_storage: { id: "multi_storage", name: "Multi-Storage", slots: 1, types: ["physical"], prerequisites: "Throwing Weapon; NOT Boomerang", effect: "Immediately equip copy after Throw. May Throw up to 3 times per Combat Round.", special: false },
      quick_draw: { id: "quick_draw", name: "Quick Draw", slots: 1, types: ["physical","energy","magic"], prerequisites: "", effect: "Unsheathe: +1(T) Strike on next Attacking Maneuver. Sheathe: +2(T) Wound on next Attacking Maneuver.", special: false },
      spiritual_weapon: { id: "spiritual_weapon", name: "Spiritual Weapon", slots: 1, types: ["physical","energy","magic"], prerequisites: "2+ Skill Ranks in Clairvoyance or Use Magic", effect: "Treated as Crystal Ball.", special: false },
      staggering: { id: "staggering", name: "Staggering", slots: 1, types: ["physical","energy","magic"], prerequisites: "", effect: "If hit knocks through Health Threshold, Might Clash: win = target Prone.", special: false },
      targeting_system: { id: "targeting_system", name: "Targeting System", slots: [1, 2], types: ["physical","energy","magic"], prerequisites: "", effect: "Increase Natural Result of Strike Rolls by number of Quality Slots occupied.", special: false },
      telekinetic: { id: "telekinetic", name: "Telekinetic", slots: 1, types: ["physical","energy","magic"], prerequisites: "Wielder has Telekinesis Unique Ability", effect: "Doesn't count toward max Weapons wielded. Attacks can originate from any square in Large Sphere AoE centered on you.", special: false },
      throwing_weapon: { id: "throwing_weapon", name: "Throwing Weapon", slots: 1, types: ["physical"], prerequisites: "", effect: "When hitting with Throw Maneuver, apply Weapon Category effects and qualifying Weapon Qualities.", special: false },
      transforming_weapon: { id: "transforming_weapon", name: "Transforming Weapon", slots: [1, 2], types: ["physical","energy","magic"], prerequisites: "", effect: "Per slot, select a Category of different Weapon Type. May use as that Type/Category (same Size, only matching Qualities apply).", special: false },
      variable: { id: "variable", name: "Variable", slots: [1, 2], types: ["physical","energy","magic"], prerequisites: "", effect: "Per slot, select additional Size. May switch Size via No Effort Maneuver during turn.", special: false },
      dimension_blade: { id: "dimension_blade", name: "Dimension Blade", slots: 1, types: ["physical"], prerequisites: "", effect: "Increase Damage Category by 1. Each attack reduces Weapon LP by 1/10 max LP.", special: true },
      elemental_blade: { id: "elemental_blade", name: "Elemental Blade", slots: 2, types: ["physical","energy"], prerequisites: "", effect: "Select Elemental Profile. Apply Multi-Profile Super Profile + Compressed Element Disadvantage if meets prereqs.", special: true },
      elongation: { id: "elongation", name: "Elongation", slots: 1, types: ["physical"], prerequisites: "Extending quality", effect: "Entire Battlefield is Melee Range. AoE Magnitude +2. Replaces Extending effects.", special: true },
      karmic_edge: { id: "karmic_edge", name: "Karmic Edge", slots: 1, types: ["physical","energy","magic"], prerequisites: "", effect: "Choose Good/Pure Good or Evil/Pure Evil. Apply Energy Charge vs matching Alignment Opponents.", special: true },
      regenerating: { id: "regenerating", name: "Regenerating", slots: 1, types: ["physical","energy","magic"], prerequisites: "", effect: "End of Combat Encounter: fully recover LP. If destroyed, completely repaired.", special: true },
      super_heavy: { id: "super_heavy", name: "Super Heavy", slots: 1, types: ["physical"], prerequisites: "", effect: "-2(bT) Strike, +5(bT) Wound. Hardness Value = 4. ARC may remove Strike penalty over time.", special: true },
      unbreakable_weapon: { id: "unbreakable_weapon", name: "Unbreakable", slots: 1, types: ["physical","energy","magic"], prerequisites: "", effect: "Cannot be destroyed. Cannot use effects that reduce this Weapon's LP.", special: true },
      warding_weapon: { id: "warding_weapon", name: "Warding Weapon", slots: 1, types: ["physical","energy","magic"], prerequisites: "", effect: "While wielding: +2(bT) Damage Reduction, +1(T) Dice Score in Opponent-initiated Clashes.", special: true }
    },

    accessoryData: {
      armored_gloves: { id: "armored_gloves", name: "Armored Gloves", craftDC: "Expert", effect: "+1(bT) Damage Reduction.", special: false },
      battle_jacket_belt: { id: "battle_jacket_belt", name: "Battle Jacket Belt", craftDC: "Master", effect: "Store a Battle Jacket. 1 Action: deploy/store BJ. Auto-enter on deploy.", special: false },
      bloodstained_accessory: { id: "bloodstained_accessory", name: "Bloodstained Accessory", craftDC: "N/A", effect: "Enter Determined State with Raging (once ever). +1(bT) Morale Saves. Gained when Ally dies.", special: false },
      bunny_ears: { id: "bunny_ears", name: "Bunny Ears", craftDC: "Apprentice", effect: "+1(bT) Normal Speed, +2(bT) Boosted Speed.", special: false },
      champion_belt: { id: "champion_belt", name: "Champion Belt", craftDC: "Master", effect: "+1(bT) Morale Saving Throw. +2 Personality Score Skill Checks.", special: false },
      eyeglasses: { id: "eyeglasses", name: "Eyeglasses", craftDC: "Apprentice", effect: "Intended Character: +1 Natural Result Perception. Others: -1 Natural Result sight-based Perception.", special: false },
      eyepatch: { id: "eyepatch", name: "Eyepatch", craftDC: "Apprentice", effect: "-1 Natural Result sight Perception. +1 Natural Result Intimidation.", special: false },
      fashionable_accessories: { id: "fashionable_accessories", name: "Fashionable Accessories", craftDC: "Qualified", effect: "+1(bT) Morale Saving Throws while wearing Standard Clothing.", special: false },
      flowing_fashion: { id: "flowing_fashion", name: "Flowing Fashion", craftDC: "Expert", effect: "+2 Dice Score Performance. +1(bT) Combat Rolls until end of next turn when using Hype Maneuver.", special: false },
      galactic_receiver: { id: "galactic_receiver", name: "Galactic Receiver", craftDC: "Qualified", effect: "+2 Natural Result hearing Perception. Also a Communicator.", special: false },
      helmet: { id: "helmet", name: "Helmet", craftDC: "Expert", effect: "+1(bT) Damage Reduction. +2 Bluff Skill Checks.", special: false },
      hologram_projector: { id: "hologram_projector", name: "Hologram Projector", craftDC: "Expert", effect: "May use Personality Modifier for Damage Attribute of Signature Technique Maneuver.", special: false },
      jetpack: { id: "jetpack", name: "Jetpack", craftDC: "Qualified", effect: "Ki Pool = 30(bT). Spend from Jetpack for Movement. Gain Soar Maneuver.", special: false },
      ki_sealing_handcuff: { id: "ki_sealing_handcuff", name: "Ki-Sealing Handcuff", craftDC: "Grandmaster", effect: "3 Actions on Defeated/Oblivious target. Inflicts Fatigued (unremovable), blocks Transformations/Signatures/UAs/Ki Wagers/non-Simple profiles.", special: false },
      mask: { id: "mask", name: "Mask", craftDC: "Qualified", effect: "+2 Bluff Skill Checks.", special: false },
      metamo_ring: { id: "metamo_ring", name: "Metamo-Ring", craftDC: "Grandmaster", effect: "Auto-succeed Metamoran Fusion Dance Performance check if target also has one. Uses EX-Fusion method.", special: false },
      micro_band: { id: "micro_band", name: "Micro Band", craftDC: "Master", effect: "1 Action: shrink to Tiny/Nano. 1 Action: return to base Size.", special: false },
      oven_mitt: { id: "oven_mitt", name: "Oven Mitt", craftDC: "Novice", effect: "Can't use Energy Focus Aura. +1(bT) DR vs Elemental (Fire) Attacks.", special: false },
      sash: { id: "sash", name: "Sash", craftDC: "Qualified", effect: "+1(bT) Impulsive Saving Throws.", special: false },
      scouter: { id: "scouter", name: "Scouter", craftDC: "Qualified", effect: "1 Action scan. Breaks if Tier 2+ uses Power Up/Transform within 15 Squares. Also a Communicator. Grants Scan.", special: false },
      sheath_holster: { id: "sheath_holster", name: "Sheath/Holster", craftDC: "Qualified", effect: "First unsheathe per encounter: +2(T) Strike on next Armed Attack. End of encounter sheathe: Weapon regains 1/4 LP.", special: false },
      shock_collar: { id: "shock_collar", name: "Shock Collar", craftDC: "Expert", effect: "Connected to Remote Control. When triggered: lose 1/5 max LP. If knocked through Health Threshold: Prone.", special: false },
      sunglasses: { id: "sunglasses", name: "Sunglasses", craftDC: "Apprentice", effect: "Ignore Solar Flare UA. Treat Light Level as 1 lower.", special: false },
      suppression_crown: { id: "suppression_crown", name: "Suppression Crown", craftDC: "Master", effect: "Reduce AG/FO/MA Attribute Modifier Bonuses of all Forms by 1(T). +4 Stress Test for Legendary Forms.", special: false },
      time_breaker_mask: { id: "time_breaker_mask", name: "Time Breaker Mask", craftDC: "Grandmaster", effect: "+2 Bluff. Gain Masked Warrior Awakening (Level 2 Temporary).", special: false },
      transformation_device: { id: "transformation_device", name: "Transformation Device", craftDC: "Master", effect: "Gain Hero Enhancement Power while wearing.", special: false },
      trucker_hat: { id: "trucker_hat", name: "Trucker Hat", craftDC: "Qualified", effect: "+2 Dice Score Pilot. +2(bT) Wound Rolls for Blitz attacks while Piloting Vehicle.", special: false },
      space_helmet: { id: "space_helmet", name: "Space Helmet", craftDC: "Expert", effect: "Ignore Unbreathable Environments.", special: false },
      potara_earring: { id: "potara_earring", name: "Potara Earring", craftDC: "N/A", effect: "Set of 2. When worn on opposite ears by 2 people: Potara Fusion as Out-of-Sequence Maneuver.", special: true },
      soul_potara_earring: { id: "soul_potara_earring", name: "Soul Potara Earring", craftDC: "N/A", effect: "Gain Absorption Special Maneuver. Unequip: lose Absorption Awakening stacks and free stored Characters.", special: true },
      tertian_oculus: { id: "tertian_oculus", name: "Tertian Oculus", craftDC: "N/A", effect: "Gain Demonic Third Eye Legendary Form.", special: true }
    },

    // ==================== TRANSFORMATION ASPECTS ====================
    transformationAspects: {
      "Armored": "Reduce Damage Category of all attacking maneuvers that hit you by 1 Category",
      "Battle Uniform": "Gain unique outfit (with Stretching Quality) when transforming",
      "Bulky": "Gain 1 Super Stack while in transformation",
      "Enhanced Save": "Increase listed Saving Throw(s) by 1(T)",
      "Glowing": "Become a Light Source, increase Light Level by 1 in Minor Sphere AoE",
      "God Ki": "Enter God Ki State while in transformation",
      "Graded": "Transformation has Grades; may use Transformation Maneuver at different Grade",
      "Growth": "Set Size Category to Large (LV1); increase by 1 per additional level",
      "Heartbeat": "Surging Strength becomes [3/Round]; ignores 3/Encounter limit",
      "High Speed": "Increase Speeds by AG (AMB) of transformation",
      "Innate State": "Enter specific State; leaving State forces exit + Stress Exhaustion",
      "Linked": "Upon entering, also enter listed Enhancement",
      "Mindful": "While in Mindful State, increase Dodge/Parry Strike by 1(T)",
      "Natural": "LV1: No Stress Tests required. LV2: May enter instead of Normal State",
      "Perfect Ki Control": "Reduce KP Cost of Attacking Maneuvers by 1(T); min 2(T)",
      "Pinnacle": "Evolved Stage can stack on another Evolved Stage with same Original",
      "Prelude": "Reduce Tier Req by 1, Stress Test by 5, AMB by 1(T), lose last Trait",
      "Raging": "While in Raging State, increase Wound Rolls by 2(T)",
      "Realization": "Legend Realized as Instant x times/encounter (x = excess Tier, max 2)",
      "Scaling": "Increase AMB (except IN) by x(T), Stress by 2x (x = excess Tier, max LV)",
      "Super Saiyan Form": "Extra dice applied again; Max Ki and Capacity +1/4",
      "Transcendent": "This is a Transcendent Enhancement",
      "Variant": "This is a Variant Transformation for listed transformation",
      "Blutz Wave": "Requires Saiyan tail; leave if tail lost + Stress Exhaustion",
      "Bursting": "Destroy Top Layer of Apparel upon entering",
      "Dedicated": "Can only enter through Transformation Maneuver",
      "Difficult": "Must master transformation additional times (1 per LV)",
      "Draining": "Start of each turn, reduce Ki by 3(T) per level",
      "Exhausting": "Upon leaving, gain Stress Exhaustion + Impediment",
      "Fading": "LV1: Cannot re-enter this encounter. LV2: Lose access entirely",
      "Light Dependent": "Classification aspect",
      "Limited": "Forced to leave after LV rounds; cannot re-enter until end of next turn",
      "Long Transformation": "+1 Action required per LV; no Surging Strength; triggers Exploit",
      "Peaked": "Cannot be Mastered but always considered Mastered",
      "Power High": "Increase KP for Guard by 1(T) per level",
      "Rampaging": "Gain Compelled vs nearest Opponent(LV1)/Character(LV2); Urgent Stress",
      "Straining": "Must make Stress Test at start of each turn",
      "Weakening": "Reduce AMB by 1/2 if Ki below 1/4 of max"
    },

    // ---- God Maneuvers ----
    godManeuvers: {
      divine_attack: {
        id: "divine_attack", name: "Divine Attack", frequency: "1/Round",
        maneuverType: "Standard", actionCost: "1 Action", dkpCost: "Profile KP",
        effect: "Make an Attacking Maneuver as if this was the Basic Attack Maneuver. The DKP Cost is equal to the KP Cost of your chosen Profile, after applying any reductions from effects, and is paid instead of it. This Attacking Maneuver has its Damage Category increased by 1 category."
      },
      divine_aura: {
        id: "divine_aura", name: "Divine Aura", frequency: "1/Encounter",
        maneuverType: "Standard", actionCost: "1 Action", dkpCost: "Aura KP",
        effect: "Upon gaining access to this God Maneuver, create an Aura with a total TP Cost of 50 (you do not spend any Technique Points) and the Required State (God Ki) Aura Disadvantage. You may only use this Aura through the Divine Aura Maneuver. The DKP Cost is equal to the KP Cost of that Aura."
      },
      divine_breathing: {
        id: "divine_breathing", name: "Divine Breathing", frequency: "1/Encounter",
        maneuverType: "Instant", actionCost: "N/A", dkpCost: "5(bT)",
        effect: "Regain 5d10(bT) Life Points. This is considered a Healing Surge for effects, and applies Surgency."
      },
      divine_counter: {
        id: "divine_counter", name: "Divine Counter", frequency: "1/Round",
        maneuverType: "Counter", actionCost: "1 Counter Action", dkpCost: "2(T)",
        effect: "If you are targeted by an Opponent's Attacking Maneuver, use the Basic Attack Maneuver against that Opponent as an Out-of-Sequence Maneuver. If this Attacking Maneuver knocks your Opponent through a Health Threshold or Defeats them, their Attacking Maneuver is canceled."
      },
      divine_flame: {
        id: "divine_flame", name: "Divine Flame", frequency: "1/Round",
        maneuverType: "Standard", actionCost: "1 Action", dkpCost: "2(bT)",
        effect: "Gain 2 stacks of Power until the end of your next turn and regain Ki Points equal to the Divine Ki Points spent on this Maneuver. This Maneuver is considered the Power Up Maneuver for any effects."
      },
      divine_flex: {
        id: "divine_flex", name: "Divine Flex", frequency: "1/Round",
        maneuverType: "Counter", actionCost: "1 Counter Action", dkpCost: "2(bT)",
        effect: "If you are targeted by an Opponent's Attacking Maneuver, reduce the Damage Category of that Attacking Maneuver by 1 Category. This is treated as the Direct Hit option of Defend Maneuver. If you receive 0 Damage while not using a Shield Aura, reduce that Opponent's LP by your Soak Value."
      },
      divine_pulse: {
        id: "divine_pulse", name: "Divine Pulse", frequency: "1/Round",
        maneuverType: "Standard", actionCost: "1~2 Actions", dkpCost: "1(bT)/Action",
        effect: "Functions as the Transformation Maneuver. For each Action spent, reduce Stress Bonus by 1 but increase AMB (FO/MA) for the Transformation by 1(T) until you leave it."
      },
      divine_roar: {
        id: "divine_roar", name: "Divine Roar", frequency: "1/Encounter",
        maneuverType: "Standard", actionCost: "2 Actions", dkpCost: "4(bT)",
        effect: "Make a Might Clash against all Characters within a Destructive Sphere AoE. If you win, losers gain Guard Down and Impediment until end of your next turn. Minions (except Special) are Defeated."
      },
      god_bind: {
        id: "god_bind", name: "God Bind", frequency: "1/Encounter",
        maneuverType: "Standard", actionCost: "1 Action", dkpCost: "4(T)",
        effect: "Target an Opponent within Melee Range. Make a Might Clash. If you win, they gain Pinned. Spend 2 Actions each turn to maintain. Can also be used as Out-of-Sequence with 1 Counter Action to cancel an attack."
      },
      god_strike: {
        id: "god_strike", name: "God Strike", frequency: "1/Round",
        maneuverType: "Standard", actionCost: "1 Action", dkpCost: "1/4 Profile KP",
        effect: "Upon gaining access, select a Profile. DKP Cost = 1/4 (rounded up) of that Profile's KP Cost. Use the Basic Attack Maneuver as an Out-of-Sequence Maneuver with that Profile applied."
      },
      god_finisher: {
        id: "god_finisher", name: "God Finisher", frequency: "1/Encounter",
        maneuverType: "Standard", actionCost: "1 Action", dkpCost: "Technique KP",
        effect: "Upon gaining access, create a Signature Technique with TP Cost of 50 or less (free) and Required State (God Ki) Disadvantage. DKP Cost = that Technique's KP Cost. Only usable through this Maneuver."
      },
      holy_transformation: {
        id: "holy_transformation", name: "Holy Transformation", frequency: "1/Encounter",
        maneuverType: "Standard", actionCost: "1 Action", dkpCost: "2(T)",
        effect: "Enter a Transformation with the God Ki Aspect. You do not roll a Stress Test for entering. Subsequent Stress Tests are rolled as usual. This is considered the Transformation Maneuver for effects."
      }
    },

    // ==================== FUSION SYSTEM ====================
    fusionMethods: {
      metamorese: {
        id: "metamorese", name: "Metamorese Fusion", fusionType: "temporary",
        roundLimit: 10, charLimit: 2, charLimitRange: false,
        howToObtain: "Metamoran Fusion Dance (Unique Ability)",
        traitName: "Metamoran Style",
        traits: [
          { level: 1, activationType: "automatic", text: "Instead of gaining the Apparel of the Fused Characters, this Fusion gains and equips the Metamoran Clothing." },
          { level: 2, activationType: "passive", text: "Increase your Stress Bonus by 2." },
          { level: 3, activationType: "passive", text: "While in a Transformation with ToP Requirement 4+, apply Divine Apparel to the Metamoran Clothing." },
          { level: 4, activationType: "triggered", usageLimit: "1/encounter", text: "You may use a Maneuver with Action Cost 1 as an Out-of-Sequence Maneuver." },
          { level: 5, activationType: "triggered", text: "Gain 2 Karma Points (lost if unspent when Fusion splits)." }
        ],
        clothing: {
          name: "Metamoran Clothing", category: "Combat Clothing", grade: "High",
          accessories: "Sash",
          qualities: [
            "Stylish Fusion: Increase Personality Score by 1/3 of Apparel Bonus (rounded up). Gain 2 Karma Points per encounter.",
            "Free Flowing: Increase Strike and Wound Rolls by Apparel Bonus. Cannot be destroyed nor replaced by Battle Uniform.",
            "Stretching: Not destroyed by Size Category change."
          ]
        }
      },
      potara: {
        id: "potara", name: "Potara Fusion", fusionType: "temporary",
        roundLimit: 20, charLimit: 2, charLimitRange: false,
        howToObtain: "Potara Earring Accessories (Special Accessories)",
        traitName: "Divine Fusion Method",
        traits: [
          { level: 1, activationType: "automatic", text: "Instead of Fused Characters' Apparel, gain a combined version. For each layer, select one piece and apply qualifying Qualities from the other." },
          { level: 2, activationType: "passive", text: "Ignore all Apparel Penalties." },
          { level: 3, activationType: "passive", text: "While in God Ki State, increase Wound Rolls and Damage Reduction by 2(bT)." },
          { level: 4, activationType: "passive", text: "Increase Maximum Life Points by 2 for each Power Level reached." },
          { level: 5, activationType: "triggered", usageLimit: "1/encounter", text: "If you fail a Stress Test, you may choose to instead succeed." },
          { level: 6, activationType: "triggered", usageLimit: "1/encounter", text: "You may use the Transformation Maneuver as an Out-of-Sequence Maneuver." }
        ]
      },
      maxi: {
        id: "maxi", name: "Maxi Fusion", fusionType: "temporary",
        roundLimit: 1, charLimit: 5, charLimitRange: false,
        howToObtain: "Five-Way Fusion Advancement (Unique Ability)",
        traitName: "Maximum Metamorese",
        traits: [
          { level: 1, activationType: "automatic", text: "Gain 2 Actions. Then use Transformation Maneuver as Out-of-Sequence to enter Ultra Fusion." },
          { level: 2, activationType: "automatic", text: "Gain and equip Metamoran Clothing with Divine Apparel Quality." },
          { level: 3, activationType: "passive", text: "Automatically succeed on all Stress Tests." }
        ]
      },
      merge: {
        id: "merge", name: "Merge Fusion", fusionType: "lasting",
        roundLimit: 0, charLimit: 4, charLimitMin: 2, charLimitRange: true,
        howToObtain: "ARC Permission, Racial Traits (Custom Species)",
        traitName: "Bio-Fusion",
        traits: [
          { level: 1, activationType: "triggered", text: "You may increase base Size Category to 1 larger than the largest among Fused Characters. If 3+ Fused Characters, may be 2 larger." },
          { level: 2, activationType: "passive", text: "If Size > Large, for Defense Value calculations and Punching Up, you are considered Large." }
        ]
      },
      ex: {
        id: "ex", name: "EX Fusion", fusionType: "lasting",
        roundLimit: 0, charLimit: 2, charLimitRange: false,
        howToObtain: "Metamoran Fusion Dance + Metamo Ring Accessory",
        traitName: "Fusion of Fusion Methods",
        traits: [
          { level: 1, activationType: "automatic", text: "Gain combined Apparel. For each layer, select one piece and apply qualifying Qualities from the other." },
          { level: 2, activationType: "passive", text: "Ignore all Apparel Penalties." },
          { level: 3, activationType: "passive", text: "Increase your Stress Bonus by 1." }
        ]
      },
      parasitic: {
        id: "parasitic", name: "Parasitic Fusion", fusionType: "lasting",
        roundLimit: 0, charLimit: 2, charLimitRange: false,
        howToObtain: "Tuffle Fusion Talent (Racial Talents)",
        traitName: "Merged Tuffle",
        traits: [
          { level: 1, activationType: "triggered", text: "Instead of Fused Character's Apparel, you may forgo it to increase Combat Rolls and Damage Reduction by 2(bT)." },
          { level: 2, activationType: "limited", usageLimit: "1/round", text: "As a Standard Action (1 Action), use a Healing Surge." }
        ]
      }
    },

    fusionModifiers: {
      balanced_fusion: {
        id: "balanced_fusion", name: "Balanced Fusion",
        prerequisite: "Fused Characters must have 2+ Attributes within 1 of each other. Select 2 as 'Balanced Attributes'.",
        hasChoice: true, choiceLabel: "Select 2 Balanced Attributes",
        effects: [
          { level: 1, activationType: "passive", text: "Increase the Attribute Modifier of your Balanced Attributes by 2(bT)." },
          { level: 2, activationType: "triggered", text: "Regain 3(bT) Ki Points at the start of your turn." }
        ]
      },
      combined_transformation: {
        id: "combined_transformation", name: "Combined Transformation",
        prerequisite: "All Fused Characters possess different Forms of the same Sub-Type (Alternate/Legendary) and do not share any Forms.",
        effects: [
          { level: 1, activationType: "passive", text: "You may use a Form as if it was an Enhancement for Transformation Stacking, as long as it doesn't have the Linked Aspect." }
        ]
      },
      dominant_personality: {
        id: "dominant_personality", name: "Dominant Personality",
        prerequisite: "Only 1 Non-Minion Fused Character, or 1 has higher Power Level than all others.",
        effects: [
          { level: 1, activationType: "passive", text: "Double the amount of Technique Points gained through Character Combination." },
          { level: 2, activationType: "passive", text: "Reduce KP Cost of all Attacking Maneuvers and Unique Abilities by 2(T)." }
        ]
      },
      enhanced_fusion: {
        id: "enhanced_fusion", name: "Enhanced Fusion",
        prerequisite: "You do not have access to any Forms.",
        effects: [
          { level: 1, activationType: "passive", text: "While in a non-Transcendent Enhancement, increase Combat Rolls by 1(T)." },
          { level: 2, activationType: "passive", text: "While using 2+ Enhancements together, increase Wound Rolls by 2(T)." },
          { level: 3, activationType: "triggered", text: "You may use Transformation Maneuver as Out-of-Sequence to enter a non-Transcendent Enhancement. Leave that Transformation at end of turn (no Stress Exhaustion)." }
        ]
      },
      fused_transformation: {
        id: "fused_transformation", name: "Fused Transformation",
        prerequisite: "All Fused Characters share a Form (known as 'Fused Form').",
        hasChoice: true, choiceLabel: "Select the Fused Form",
        effects: [
          { level: 1, activationType: "passive", text: "If Fused Form is in a Transformation Line with higher Stages, gain access if base ToP meets their requirement." },
          { level: 2, activationType: "passive", text: "Ignore Stress Bonus reduction from Health Threshold Penalties when entering or in a Fused Form." },
          { level: 3, activationType: "passive", text: "Increase AMB (AG/FO/TE/MA) of Fused Form: Alternate Form +1(T), Legendary Form +2(T)." }
        ]
      },
      power_of_friendship: {
        id: "power_of_friendship", name: "Power of Friendship",
        prerequisite: "2 Fused Characters who declared each other as 'Partner' (Synchronized Combatant Talent).",
        effects: [
          { level: 1, activationType: "passive", text: "Increase your Tier of Power by 1 (Breakthrough)." },
          { level: 2, activationType: "passive", text: "This Fusion is its own Partner." }
        ]
      },
      shared_heritage: {
        id: "shared_heritage", name: "Shared Heritage",
        prerequisite: "All Fused Characters are the same Race and Fusion has fewer than 7 Racial Traits.",
        effects: [
          { level: 1, activationType: "passive", text: "Double your Racial Life Modifier." },
          { level: 2, activationType: "passive", text: "Increase Attribute Modifiers (AG/FO/TE/MA) by 1(T)." },
          { level: 3, activationType: "passive", text: "Increase Wound Roll of Fused Technique by 2(T) per Fused Character." }
        ]
      },
      synergistic_fusion: {
        id: "synergistic_fusion", name: "Synergistic Fusion",
        prerequisite: "Fused Characters had 2+1(bT) or more identical Talents.",
        effects: [
          { level: 1, activationType: "passive", text: "Increase Attribute Modifiers (AG/FO/TE/MA) by 1(T)." },
          { level: 2, activationType: "passive", text: "Increase Power Level by 3 (recalculate base ToP, LP, KP, Capacity)." }
        ]
      },
      the_mightiest_fusion: {
        id: "the_mightiest_fusion", name: "The Mightiest Fusion",
        prerequisite: "2 Fused Characters who declared each other as 'Rival' (Chosen Rival Talent).",
        effects: [
          { level: 1, activationType: "passive", text: "Increase your Tier of Power by 1 (Breakthrough)." },
          { level: 2, activationType: "passive", text: "This Fusion is its own Rival, benefits from 2nd and 3rd effects of Chosen Rival Talent." }
        ]
      }
    },

    fissionTraits: {
      paragon: {
        id: "paragon", name: "Paragon",
        description: "You are the epitome of kindness, compassion, and virtue.",
        effects: [
          { level: 1, activationType: "passive", text: "Reduce your Tier of Power by 1. If base ToP is 1, reduce Combat Rolls by 2 instead." },
          { level: 2, activationType: "passive", text: "Increase your Soak Value by 2(bT)." },
          { level: 3, activationType: "triggered", usageLimit: "1/round", text: "If you or an Ally receive Damage from Opponent's Attacking Maneuver, reduce that Damage by 1/2 of your Might." }
        ]
      },
      renegade: {
        id: "renegade", name: "Renegade",
        description: "Inheriting all of the darkness of your originator, you are the face of destruction and terror.",
        effects: [
          { level: 1, activationType: "passive", text: "Reduce your Tier of Power by 1. If base ToP is 1, reduce Combat Rolls by 2 instead." },
          { level: 2, activationType: "passive", text: "Increase your Wound Rolls by 2(bT)." },
          { level: 3, activationType: "triggered", usageLimit: "1/round", text: "If an Opponent receives Damage from you or Ally's Attacking Maneuver, increase Damage by 1/2 of your Might." }
        ]
      }
    }

  }; // end CONFIG.DBU
}
