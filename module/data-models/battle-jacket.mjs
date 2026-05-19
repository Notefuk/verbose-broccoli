/**
 * TypeDataModel for the "battleJacket" actor type.
 * Represents a Battle Jacket (mech suit) in the Dragon Ball Universe RPG system.
 */

const { SchemaField, StringField, NumberField, BooleanField, ArrayField, ObjectField } = foundry.data.fields;

// ─── Reusable sub-schema helpers (mirrored from character.mjs) ──────────────

/**
 * Schema for a signature technique advantage/disadvantage entry.
 */
function advDisField() {
  return new SchemaField({
    name: new StringField({ initial: "" }),
    ranks: new NumberField({ required: true, nullable: false, initial: 1, integer: true }),
    notes: new StringField({ initial: "" }),
    tpCost: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    dynamicTP: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
  });
}

/**
 * Schema for a signature technique stored on the jacket.
 */
function signatureTechniqueField() {
  return new SchemaField({
    id: new NumberField({ required: true, nullable: false, integer: true }),
    name: new StringField({ initial: "New Technique" }),
    type: new StringField({ initial: "signature" }),
    foundation: new StringField({ initial: "Physical" }),
    profile: new StringField({ initial: "Simple" }),
    description: new StringField({ initial: "" }),
    tpMax: new NumberField({ required: true, nullable: false, initial: 10, integer: true }),
    freeTP: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    baseEnergyCharges: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    extraEnergyCharges: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    isWeapon: new BooleanField({ initial: false }),
    isLimitBreak: new BooleanField({ initial: false }),
    advantages: new ArrayField(advDisField()),
    disadvantages: new ArrayField(advDisField())
  });
}

/**
 * Schema for a signature aura stored on the jacket.
 */
function signatureAuraField() {
  return new SchemaField({
    id: new NumberField({ required: true, nullable: false, integer: true }),
    name: new StringField({ initial: "New Aura" }),
    type: new StringField({ initial: "Sparking" }),
    active: new BooleanField({ initial: false }),
    description: new StringField({ initial: "" }),
    tpMax: new NumberField({ required: true, nullable: false, initial: 10, integer: true }),
    freeTP: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    advantages: new ArrayField(advDisField()),
    disadvantages: new ArrayField(advDisField())
  });
}

/**
 * Schema for a unique ability selection on the jacket.
 */
function uniqueAbilityField() {
  return new SchemaField({
    id: new NumberField({ required: true, nullable: false, integer: true }),
    abilityKey: new StringField({ required: true, blank: false }),
    free: new BooleanField({ initial: false }),
    advancements: new ArrayField(new SchemaField({
      advancementId: new StringField({ required: true, blank: false }),
      free: new BooleanField({ initial: false }),
      amount: new NumberField({ required: true, nullable: false, initial: 1, integer: true })
    })),
    restrictions: new ArrayField(new SchemaField({
      restrictionId: new StringField({ required: true, blank: false })
    }))
  });
}

// ─── Lookup tables ──────────────────────────────────────────────────────────

/**
 * Frame combat stats: [base, scalingPerJT]
 */
const FRAME_STATS = {
  assault:  { awareness: [3, 1], defenseValue: [6, 2], soak: [4, 2], damageReduction: [1, 1] },
  sentinel: { awareness: [5, 1], defenseValue: [5, 1], soak: [6, 2], damageReduction: [2, 2] },
  mobile:   { awareness: [1, 1], defenseValue: [7, 3], soak: [2, 2], damageReduction: [1, 0] }
};

/**
 * Engine mobility stats: [base, scalingPerJT]
 */
const ENGINE_STATS = {
  power:   { haste: [1, 1], normalSpeed: [2, 1], boostedSpeed: [6, 1],  might: [7, 3] },
  balance: { haste: [3, 1], normalSpeed: [4, 2], boostedSpeed: [8, 2],  might: [6, 2] },
  speed:   { haste: [5, 1], normalSpeed: [8, 2], boostedSpeed: [12, 2], might: [5, 1] }
};

/**
 * Size category modifiers.
 * soak and defense scale × JT; speed and might are flat.
 */
const SIZE_MODS = {
  large:    { soak: 0, defense: 0,  speed: 0,  might: 0 },
  enormous: { soak: 1, defense: -1, speed: -1, might: 2 },
  gigantic: { soak: 2, defense: -2, speed: -2, might: 4 }
};

/**
 * Max installed modules by grade.
 */
const MAX_MODULES_BY_GRADE = {
  basic: 1,
  advanced: 2,
  masterpiece: 3,
  magnumOpus: 4
};

/**
 * Unique module name per frame type.
 */
const FRAME_UNIQUE_MODULE = {
  assault:  "allRoundFrame",
  sentinel: "heavyFrame",
  mobile:   "highSpeedFrame"
};

/**
 * Unique module name per engine type.
 */
const ENGINE_UNIQUE_MODULE = {
  power:   "powerToTheFrame",
  balance: "balancedOutput",
  speed:   "powerToTheThrusters"
};

// ─── TypeDataModel ──────────────────────────────────────────────────────────

export default class DBUBattleJacketData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // ---- Core identity ----
      jacketGrade: new StringField({ required: true, initial: "basic",
        choices: ["basic", "advanced", "masterpiece", "magnumOpus"] }),
      jacketFrame: new StringField({ required: true, initial: "assault",
        choices: ["assault", "sentinel", "mobile"] }),
      jacketEngine: new StringField({ required: true, initial: "power",
        choices: ["power", "balance", "speed"] }),
      sizeCategory: new StringField({ required: true, initial: "enormous",
        choices: ["large", "enormous", "gigantic"] }),
      pilotId: new StringField({ initial: "" }),
      jacketLevel: new NumberField({ required: true, nullable: false, initial: 1, integer: true, min: 1 }),

      // ---- Resources ----
      lp: new SchemaField({
        value: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        max: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),
      kp: new SchemaField({
        value: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        max: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),

      // ---- Weak Points ----
      weakPoints: new SchemaField({
        frameDisabled: new BooleanField({ initial: false }),
        engineDisabled: new BooleanField({ initial: false })
      }),

      // ---- Installed Modules ----
      installedModules: new ArrayField(new StringField(), { initial: [] }),

      // ---- Signature Techniques (same pattern as character) ----
      signatureTechniques: new ArrayField(signatureTechniqueField()),

      // ---- Signature Auras (same pattern as character) ----
      signatureAuras: new ArrayField(signatureAuraField()),

      // ---- Unique Abilities (same pattern as character) ----
      uniqueAbilities: new ArrayField(uniqueAbilityField())
    };
  }

  // ─── Derived data calculation ───────────────────────────────────────────

  prepareDerivedData() {
    const jl = this.jacketLevel ?? 1;

    // ── 1. Jacket Tier (same tier table as characters) ──
    let jt;
    if (jl <= 4) jt = 1;
    else if (jl <= 9) jt = 2;
    else if (jl <= 14) jt = 3;
    else if (jl <= 19) jt = 4;
    else if (jl <= 24) jt = 5;
    else if (jl <= 29) jt = 6;
    else jt = 7;
    this.jacketTier = jt;

    // ── 2. LP max ──
    this.lp.max = 50 + (jl - 1) * 5;

    // ── 3. KP max ──
    this.kp.max = 30 + (jl - 1) * 8;

    // ── 4. Capacity ──
    this.capacity = 20 + (jl - 1) * 4;

    // ── 5. Technique Points ──
    this.techniquePoints = 20 * jt;

    // ── 6. Max Modules by grade ──
    this.maxModules = MAX_MODULES_BY_GRADE[this.jacketGrade] ?? 1;

    // ── 7. Frame stats (base + scaling × JT) ──
    const frame = this.jacketFrame || "assault";
    const frameDef = FRAME_STATS[frame] ?? FRAME_STATS.assault;

    let awareness      = frameDef.awareness[0]      + frameDef.awareness[1]      * jt;
    let defenseValue   = frameDef.defenseValue[0]    + frameDef.defenseValue[1]   * jt;
    let soak           = frameDef.soak[0]            + frameDef.soak[1]           * jt;
    let damageReduction = frameDef.damageReduction[0] + frameDef.damageReduction[1] * jt;

    // ── 8. Engine stats (base + scaling × JT) ──
    const engine = this.jacketEngine || "power";
    const engineDef = ENGINE_STATS[engine] ?? ENGINE_STATS.power;

    let haste        = engineDef.haste[0]        + engineDef.haste[1]        * jt;
    let normalSpeed  = engineDef.normalSpeed[0]  + engineDef.normalSpeed[1]  * jt;
    let boostedSpeed = engineDef.boostedSpeed[0] + engineDef.boostedSpeed[1] * jt;
    let might        = engineDef.might[0]        + engineDef.might[1]        * jt;

    // ── 9. Size Category adjustments ──
    // Module overrides for size
    let effectiveSize = this.sizeCategory || "enormous";
    const modules = this.installedModules ?? [];

    if (modules.includes("powerArmor")) effectiveSize = "large";
    if (modules.includes("giantRobot")) effectiveSize = "gigantic";

    this.effectiveSizeCategory = effectiveSize;

    const sizeMod = SIZE_MODS[effectiveSize] ?? SIZE_MODS.enormous;
    // soak and defense scale × JT
    soak         += sizeMod.soak * jt;
    defenseValue += sizeMod.defense * jt;
    // speed and might are flat
    normalSpeed  += sizeMod.speed;
    boostedSpeed += sizeMod.speed;
    might        += sizeMod.might;

    // ── 10. Module bonuses ──
    if (modules.includes("heavilyReinforced")) {
      this.lp.max += 2 * jl;
      soak += 2 * jt;
    }
    if (modules.includes("mechaFinisher")) {
      this.techniquePoints += 20;
    }

    // ── 11. Unique module names (expose for sheet / automation) ──
    this.frameUniqueModule  = FRAME_UNIQUE_MODULE[frame]   ?? "allRoundFrame";
    this.engineUniqueModule = ENGINE_UNIQUE_MODULE[engine]  ?? "powerToTheFrame";

    // ── 12. Health Thresholds ──
    this.healthThresholds = {
      bruised:  Math.floor(this.lp.max / 2),
      injured:  Math.floor(this.lp.max / 4),
      critical: Math.floor(this.lp.max / 10)
    };

    // ── 13. Minimum values ──
    soak         = Math.max(soak, jt);
    defenseValue = Math.max(defenseValue, 0);
    normalSpeed  = Math.max(normalSpeed, 0);
    boostedSpeed = Math.max(boostedSpeed, 0);

    // ── Store final computed combat stats as flat properties ──
    this.awareness      = awareness;
    this.defenseValue   = defenseValue;
    this.soak           = soak;
    this.damageReduction = damageReduction;
    this.haste          = haste;
    this.normalSpeed    = normalSpeed;
    this.boostedSpeed   = boostedSpeed;
    this.might          = might;
  }
}

// ─── Export lookup tables for use by sheet / automation ──────────────────────

export {
  FRAME_STATS,
  ENGINE_STATS,
  SIZE_MODS,
  MAX_MODULES_BY_GRADE,
  FRAME_UNIQUE_MODULE,
  ENGINE_UNIQUE_MODULE
};
