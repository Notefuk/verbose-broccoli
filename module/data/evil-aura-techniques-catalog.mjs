/**
 * Evil Aura Signature Techniques Catalog
 * Source: Manuales_Organizados/transformations/transformation-catalog/enhancement-powers/evil-aura.txt
 *
 * These 5 Signature Techniques are granted to a character whose Evil Aura
 * Transformation is active AND whose `transformationMeta.evilTechsActive`
 * flag has been turned on (Triggered/Start of Turn — costs 2(bT) Evil Points).
 *
 * Per rules: "Reduce their Ki Point Cost by 1/2." — applied via the kpDiscount field
 * (handled at preparedTechniques build time in character-sheet.mjs).
 *
 * Each entry mirrors the shape of system.signatureTechniques entries so they
 * merge cleanly into the prepared techniques list with `isGained: true,
 * gainedSource: "evil_aura"` markers.
 */
export const EVIL_AURA_TECHNIQUES = [
  {
    id: -1001,                       // negative IDs to avoid collision with player techs
    catalogId: "baked_sphere",
    name: "Baked Sphere",
    type: "ultimate",
    foundation: "Energy",
    profile: "Explosion",
    description: "Ultimate Signature granted by Evil Aura. KP Cost halved while Evil Techniques are active.",
    tpMax: 24,
    freeTP: 0,
    baseEnergyCharges: 0,
    extraEnergyCharges: 0,
    isWeapon: false,
    isLimitBreak: false,
    advantages: [
      { name: "Twin-Linked (Wound)", ranks: 1, notes: "Wound", tpCost: 0, dynamicTP: 0 },
      { name: "Knockback",           ranks: 1, notes: "",      tpCost: 0, dynamicTP: 0 },
      { name: "Power Shot",          ranks: 2, notes: "",      tpCost: 0, dynamicTP: 0 },
    ],
    disadvantages: [
      { name: "Self-Explosion",                       ranks: 1, notes: "",                  tpCost: 0, dynamicTP: 0 },
      { name: "Lead Up (Explosion)",                  ranks: 1, notes: "Explosion",        tpCost: 0, dynamicTP: 0 },
      { name: "Restriction – Transformation (2)",     ranks: 1, notes: "Evil Aura Grade 2", tpCost: 0, dynamicTP: 0 },
    ],
    rulesKpCost: 13   // (T) — actual cost is 13×tier; but in-system kpCost auto-derived; this is informational
  },
  {
    id: -1002,
    catalogId: "bloody_sauce",
    name: "Bloody Sauce",
    type: "super",
    foundation: "Energy",
    profile: "Sphere",
    description: "Super Signature granted by Evil Aura. KP Cost halved while Evil Techniques are active.",
    tpMax: 12,
    freeTP: 0,
    baseEnergyCharges: 0,
    extraEnergyCharges: 0,
    isWeapon: false,
    isLimitBreak: false,
    advantages: [
      { name: "Condition (Poisoned)", ranks: 1, notes: "Poisoned", tpCost: 0, dynamicTP: 0 },
      { name: "Splitting",            ranks: 1, notes: "",         tpCost: 0, dynamicTP: 0 },
    ],
    disadvantages: [
      { name: "Restriction – Transformation (2)", ranks: 1, notes: "Evil Aura Grade 2", tpCost: 0, dynamicTP: 0 },
    ],
    rulesKpCost: 7
  },
  {
    id: -1003,
    catalogId: "gigantic_ki_blast",
    name: "Gigantic Ki Blast",
    type: "ultimate",
    foundation: "Energy",
    profile: "Sphere",
    description: "Ultimate Signature granted by Evil Aura. KP Cost halved while Evil Techniques are active.",
    tpMax: 24,
    freeTP: 0,
    baseEnergyCharges: 0,
    extraEnergyCharges: 0,
    isWeapon: false,
    isLimitBreak: false,
    advantages: [
      { name: "Big Bang",     ranks: 2, notes: "",       tpCost: 0, dynamicTP: 0 },
      { name: "Giant Sphere", ranks: 1, notes: "Sphere", tpCost: 0, dynamicTP: 0 },
      { name: "Power Shot",   ranks: 2, notes: "",       tpCost: 0, dynamicTP: 0 },
    ],
    disadvantages: [
      { name: "Mandatory Charge",                 ranks: 1, notes: "",                  tpCost: 0, dynamicTP: 0 },
      { name: "All or Nothing",                   ranks: 1, notes: "",                  tpCost: 0, dynamicTP: 0 },
      { name: "Restriction – Transformation (2)", ranks: 1, notes: "Evil Aura Grade 2", tpCost: 0, dynamicTP: 0 },
    ],
    rulesKpCost: 8
  },
  {
    id: -1004,
    catalogId: "marbling_drop",
    name: "Marbling Drop",
    type: "super",
    foundation: "Energy",
    profile: "Rapid Fire",
    description: "Super Signature granted by Evil Aura. KP Cost halved while Evil Techniques are active.",
    tpMax: 12,
    freeTP: 0,
    baseEnergyCharges: 0,
    extraEnergyCharges: 0,
    isWeapon: false,
    isLimitBreak: false,
    advantages: [
      { name: "Splitting",          ranks: 1, notes: "",       tpCost: 0, dynamicTP: 0 },
      { name: "Condition (Shaken)", ranks: 1, notes: "Shaken", tpCost: 0, dynamicTP: 0 },
      { name: "Accurate",           ranks: 1, notes: "",       tpCost: 0, dynamicTP: 0 },
    ],
    disadvantages: [
      { name: "Restriction – Transformation (2)", ranks: 1, notes: "Evil Aura Grade 2", tpCost: 0, dynamicTP: 0 },
    ],
    rulesKpCost: 10
  },
  {
    id: -1005,
    catalogId: "peeler_storm",
    name: "Peeler Storm",
    type: "super",
    foundation: "Physical",
    profile: "Sweeping",
    description: "Super Signature granted by Evil Aura. KP Cost halved while Evil Techniques are active.",
    tpMax: 12,
    freeTP: 0,
    baseEnergyCharges: 0,
    extraEnergyCharges: 0,
    isWeapon: false,
    isLimitBreak: false,
    advantages: [
      { name: "Hurricane Assault",     ranks: 1, notes: "",   tpCost: 0, dynamicTP: 0 },
      { name: "Terrain Destruction",   ranks: 3, notes: "",   tpCost: 0, dynamicTP: 0 },
      { name: "Accurate",              ranks: 1, notes: "",   tpCost: 0, dynamicTP: 0 },
    ],
    disadvantages: [
      { name: "Mandatory Charge",                 ranks: 1, notes: "",                  tpCost: 0, dynamicTP: 0 },
      { name: "Restriction – Transformation (2)", ranks: 1, notes: "Evil Aura Grade 2", tpCost: 0, dynamicTP: 0 },
    ],
    rulesKpCost: 8
  },
];
