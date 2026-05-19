/**
 * TypeDataModel for the "character" actor type.
 * Mirrors CHARACTER_DATA + app.js state from the web version.
 */

const { SchemaField, StringField, NumberField, BooleanField, ArrayField, ObjectField, HTMLField } = foundry.data.fields;

/**
 * Helper: build a SchemaField for a single attribute (e.g. ag, fo, te ...).
 * Each attribute stores a racial bonus and a progression bonus; the final
 * score is derived in prepareDerivedData().
 */
function attributeField() {
  return new SchemaField({
    racial: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    progression: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
  });
}

/**
 * Schema for a single condition entry.
 */
function conditionField() {
  return new SchemaField({
    id: new StringField({ required: true, blank: false }),
    active: new BooleanField({ initial: false }),
    stacks: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
  });
}

/**
 * Schema for a single progression row.
 */
function progressionRowField() {
  return new SchemaField({
    id: new NumberField({ required: true, nullable: false, integer: true }),
    level: new NumberField({ required: true, nullable: false, initial: 1, integer: true }),
    perkType: new StringField({ initial: "character_perk" }),
    convertible: new BooleanField({ initial: false }),
    talent: new StringField({ initial: "" }),
    ag: new NumberField({ required: false, nullable: true, initial: null, integer: true }),
    fo: new NumberField({ required: false, nullable: true, initial: null, integer: true }),
    te: new NumberField({ required: false, nullable: true, initial: null, integer: true }),
    sc: new NumberField({ required: false, nullable: true, initial: null, integer: true }),
    in: new NumberField({ required: false, nullable: true, initial: null, integer: true }),
    ma: new NumberField({ required: false, nullable: true, initial: null, integer: true }),
    pe: new NumberField({ required: false, nullable: true, initial: null, integer: true }),
    tp: new NumberField({ required: false, nullable: true, initial: null, integer: true }),
    // 6 individual skill rank columns (matching maqueta's colspan=6)
    skill0: new StringField({ initial: "" }),
    skill1: new StringField({ initial: "" }),
    skill2: new StringField({ initial: "" }),
    skill3: new StringField({ initial: "" }),
    skill4: new StringField({ initial: "" }),
    skill5: new StringField({ initial: "" }),
    skills: new ArrayField(new StringField())
  });
}

/**
 * Schema for a single attack reference card.
 */
function attackRefField() {
  return new SchemaField({
    id: new NumberField({ required: true, nullable: false, integer: true }),
    name: new StringField({ initial: "Attack Reference" }),
    foundation: new StringField({ initial: "Physical" }),
    profile: new StringField({ initial: "Simple" }),
    extraProfile: new StringField({ initial: "" }),
    targetRange: new NumberField({ required: false, nullable: true, initial: 0, integer: true }),
    inMelee: new BooleanField({ initial: true }),
    energyCharges: new NumberField({ required: false, nullable: true, initial: 0, integer: true }),
    kiWager: new NumberField({ required: false, nullable: true, initial: 0, integer: true }),
    powerShot: new NumberField({ required: false, nullable: true, initial: 0, integer: true }),
    miscStrike: new StringField({ initial: "" }),
    miscWound: new StringField({ initial: "" }),
    miscDodge: new StringField({ initial: "" }),
    miscBonuses: new StringField({ initial: "" }),
    weaponEquipped: new StringField({ initial: "" }),
    weaponCheckbox: new BooleanField({ initial: false }),
    offHand: new StringField({ initial: "" }),
    offHandCheckbox: new BooleanField({ initial: false }),
    description: new StringField({ initial: "" })
  });
}

/**
 * Schema for a custom buff.
 */
/**
 * Schema for a custom buff.
 * Unified buff structure matching the Google Sheet:
 *   Total = flat + (bT × baseTier) + (T × tier)
 * Where: flat = raw unscaled value, bT = baseTier multiplier, T = tier multiplier.
 */
function customBuffField() {
  return new SchemaField({
    id: new NumberField({ required: true, nullable: false, integer: true }),
    name: new StringField({ initial: "" }),
    active: new BooleanField({ initial: true }),
    effect: new StringField({ initial: "" }),
    flat: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    bT: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    T: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    notes: new StringField({ initial: "" })
  });
}

/**
 * Schema for a unique ability selection on the character.
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

/**
 * Schema for a signature technique/aura advantage or disadvantage entry.
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
 * Schema for a signature technique stored on the character.
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
 * Schema for a signature aura stored on the character.
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
 * Schema for a transformation stored directly on the character.
 */
function transformationField() {
  return new SchemaField({
    id: new NumberField({ required: true, nullable: false, integer: true }),
    catalogKey: new StringField({ nullable: true, initial: null }),
    name: new StringField({ initial: "" }),
    active: new BooleanField({ initial: false }),
    gradeOrStacks: new StringField({ initial: "" }),
    tierRequirement: new StringField({ initial: "" }),
    mastered: new BooleanField({ initial: false }),
    stressTest: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    transformationType: new StringField({ initial: "form_alternate" }),
    attrBonuses: new ObjectField(),
    aspects: new ArrayField(new StringField()),
    structuredTraits: new ArrayField(new ObjectField()),
    traits: new StringField({ initial: "" }),
    isLegendary: new BooleanField({ initial: false }),
    matchFoMa: new BooleanField({ initial: false }),
    scaleAmb: new BooleanField({ initial: false }),
    powerImprovement: new StringField({ initial: "none" }),
    preludeActive: new BooleanField({ initial: false })
  });
}

export default class DBUCharacterData extends foundry.abstract.TypeDataModel {

  /** Sanitise legacy data before TypeDataModel validation runs. */
  static migrateData(source) {
    if (Array.isArray(source.transformations)) {
      for (const t of source.transformations) {
        if (t && typeof t.id !== "number") t.id = Number(t.id) || 0;
        if (t && typeof t.stressTest !== "number") t.stressTest = Number(t.stressTest) || 0;
      }
    }
    return super.migrateData(source);
  }

  static defineSchema() {
    return {
      // ---- Core identity ----
      level: new NumberField({ required: true, nullable: false, initial: 1, integer: true, min: 1, max: 30 }),
      race: new StringField({ initial: "saiyan" }),
      subrace: new StringField({ initial: "" }),
      subspecies: new StringField({ initial: "" }),
      baseSize: new StringField({ initial: "medium" }),
      proficientSave: new StringField({ initial: "corporeal" }),
      customSpeciesSave: new StringField({ initial: "corporeal" }),

      // ---- Resources ----
      lifePoints: new SchemaField({
        value: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        max: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        modify: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),
      kiPool: new SchemaField({
        value: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        max: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        modify: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),
      capacity: new SchemaField({
        value: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        max: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),

      // ---- God Ki ----
      godKi: new SchemaField({
        permanent: new BooleanField({ initial: false }),
        active: new BooleanField({ initial: false })
      }),
      divineKiPoints: new SchemaField({
        value: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        max: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),
      universeSeed: new SchemaField({
        universalPower: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        integrated: new BooleanField({ initial: false })
      }),
      godManeuvers: new ArrayField(new StringField()),
      godStrikeProfile: new StringField({ initial: "" }),
      divineAura: new ObjectField(),
      godFinisherTechnique: new ObjectField(),

      // ---- Fusion System ----
      fusion: new SchemaField({
        // Core fusion identity
        isFusion: new BooleanField({ initial: false }),
        type: new StringField({ initial: "" }),  // "regular" | "one-sided-absorption" | "one-sided-possession" | "fission"
        fusedCharacterIds: new ArrayField(new StringField()),  // actor UUIDs of component characters
        method: new StringField({ initial: "" }),  // "metamorese" | "potara" | "maxi" | "merge" | "ex" | "parasitic"
        modifiers: new ArrayField(new StringField()),  // selected modifier IDs
        roundLimit: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        maxRoundLimit: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        selectedRacialTraitIds: new ArrayField(new StringField()),  // chosen racial traits (max 7)
        chosenSize: new StringField({ initial: "" }),
        fusedTechnique: new ObjectField(),  // { name, baseTechSource, advantages, superProfile, kpCost, effect }
        hasFusedTechnique: new BooleanField({ initial: true }),
        bonusTP: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        // Regular fusion: 3 chosen attrs for +1(bT) boost (Character Combination rule)
        fusionBoostAttrs: new ArrayField(new StringField()),
        // +2 bonus talents gained by fusion (fusion.txt line 19)
        fusionBonusTalents: new ArrayField(new StringField()),
        // PL overflow beyond 30 (stored for +1 attr mod per PL above 30)
        plOverflow: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        // Metamorese: "plump" | "frail" | "" (failed Fusion Dance result)
        fusionVariant: new StringField({ initial: "" }),

        // One-Sided Fusion (dominant character fields)
        suppressedCharacterIds: new ArrayField(new StringField()),
        deeplySuppressed: new ArrayField(new StringField()),
        absorbedApparel: new ObjectField(),
        // Absorption: chosen 1 secondary racial trait per suppressed actor { actorId: traitId }
        absorptionChosenTraits: new ObjectField(),
        // Possession: Primary Racial Trait exchange { givenTraitId, takenTraitId }
        possessionTraitExchange: new SchemaField({
          givenTraitId: new StringField({ initial: "" }),
          takenTraitId: new StringField({ initial: "" })
        }),
        // Absorption: chosen source actor for gained Mutation Trait
        chosenMutationSourceId: new StringField({ initial: "" }),

        // Possession: host LP tracking for damage sharing
        hostCurrentLP: new NumberField({ required: false, nullable: true, initial: null }),
        // One-Sided Fusion: active aura gained from suppressed character (mutual exclusion with own auras)
        activeGainedAuraId: new StringField({ initial: "" }),
        // One-Sided Fusion: active transformations gained from suppressed characters
        activeGainedTransformationIds: new ArrayField(new StringField(), { initial: [] }),
        // Neo-Tuffle Parasite: chosen host racial trait (replaces Liquid Form)
        parasiteHostTraitId: new StringField({ initial: "" }),

        // Absorption: thresholds crossed this encounter (for non-Majin auto-eject at 2)
        encounterThresholdsCrossed: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),

        // Suppression (on the suppressed character)
        isSuppressed: new BooleanField({ initial: false }),
        dominantCharacterId: new StringField({ initial: "" }),
        // Per-suppressed struggling stacks: { actorId: numberOfStacks }
        strugglingStacks: new ObjectField(),

        // Fission (on split characters)
        originCharacterId: new StringField({ initial: "" }),
        splitType: new StringField({ initial: "" }),  // "paragon" | "renegade"
        hasLifeLink: new BooleanField({ initial: false }),
        linkedSplitId: new StringField({ initial: "" })
      }),

      // ---- Attributes (7 core) ----
      attributes: new SchemaField({
        ag: attributeField(),
        fo: attributeField(),
        te: attributeField(),
        sc: attributeField(),
        in: attributeField(),
        ma: attributeField(),
        pe: attributeField()
      }),

      // ---- Skills (freeform object: { acrobatics: { rank: 2 }, ... }) ----
      skills: new ObjectField(),

      // ---- Conditions ----
      conditions: new ArrayField(conditionField()),

      // ---- Combat tracking (counters) ----
      tracking: new SchemaField({
        energyCharges: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        powerStacks: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        diminishingDefense: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        diminishingOffense: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        perfectPoints: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        patienceStacks: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        lifeforce: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        revengePoints: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        crueltyStacks: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        observationStacks: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        studiedStacks: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        disdainStacks: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        negativeEnergy: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),

      // ---- Combat states (boolean toggles) ----
      combatStates: new SchemaField({
        raging: new BooleanField({ initial: false }),
        surging: new BooleanField({ initial: false }),
        mindful: new BooleanField({ initial: false }),
        superior: new BooleanField({ initial: false }),
        undying: new BooleanField({ initial: false }),
        evasiveStance: new BooleanField({ initial: false }),
        drunk: new BooleanField({ initial: false }),
        combatExpertiseShift: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        balancedDefenderShift: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        hypeActive: new BooleanField({ initial: false }),
        analysisActive: new BooleanField({ initial: false })
      }),

      // ---- Extra dice pool category bonuses (from effects, transformations, etc.) ----
      dicePools: new SchemaField({
        topCatBonus: new SchemaField({
          global: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          strike: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          wound: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          dodge: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
        }),
        greaterCatBonus: new SchemaField({
          global: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          strike: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          wound: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          dodge: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
        }),
        topApplyCount: new SchemaField({
          global: new NumberField({ required: true, nullable: false, initial: 1, integer: true }),
          strike: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          wound: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          dodge: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
        }),
        greaterApplyCount: new SchemaField({
          global: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          strike: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          wound: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
          dodge: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
        })
      }),

      // ---- Health thresholds (user-checked) ----
      thresholds: new SchemaField({
        bruised: new SchemaField({ checked: new BooleanField({ initial: false }) }),
        injured: new SchemaField({ checked: new BooleanField({ initial: false }) }),
        critical: new SchemaField({ checked: new BooleanField({ initial: false }) })
      }),

      // ---- Status (stored user inputs for status section) ----
      status: new SchemaField({
        healthStatus: new StringField({ initial: "healthy" }),
        currentSize: new StringField({ initial: "medium" }),
        superStacks: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        capacitySpent: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),

      // ---- Aptitudes (stored manual adjustments) ----
      aptitudes: new SchemaField({
        haste: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        awareness: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        initiative: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        defenseValue: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),

      // ---- Damage calculator (stored inputs) ----
      damageCalc: new SchemaField({
        source: new StringField({ initial: "wound" }),
        category: new StringField({ initial: "standard" }),
        defense: new StringField({ initial: "none" }),
        damageReduction: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        woundRoll: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),

      // ---- Z-Soul ----
      zsoul: new SchemaField({
        alignment: new StringField({ initial: "neutral" }),
        karma: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        quote: new StringField({ initial: "" })
      }),

      // ---- Details (bio / appearance) ----
      details: new SchemaField({
        name: new StringField({ initial: "" }),
        player: new StringField({ initial: "" }),
        age: new StringField({ initial: "" }),
        gender: new StringField({ initial: "" }),
        skinTone: new StringField({ initial: "" }),
        eyeColor: new StringField({ initial: "" }),
        hairColor: new StringField({ initial: "" }),
        height: new StringField({ initial: "" }),
        weight: new StringField({ initial: "" })
      }),

      // ---- Racial Traits (selected IDs reference compendium items) ----
      racialTraits: new ArrayField(new StringField()),

      // ---- Racial option selections (traitId -> { effectLevel: selectedOptionName }) ----
      racialOptionSelections: new ObjectField(),

      // ---- Transformation option selections (transIndex -> { effectLevel: selectedOptionName|[names] }) ----
      transformationOptionSelections: new ObjectField(),

      // ---- Token image album [{ name: "SSJ2", image: "path/to/token.webp" }, ...] ----
      tokenAlbum: new ArrayField(new SchemaField({
        name: new StringField({ initial: "" }),
        image: new StringField({ initial: "" })
      })),

      // ---- Talent option selections (talentId -> selectedOption) ----
      talentOptionSelections: new ObjectField(),

      // ---- Talents (selected IDs reference compendium items) ----
      talents: new ArrayField(new StringField()),

      // ---- Progression rows ----
      progressionRows: new ArrayField(progressionRowField()),

      // ---- Custom Buffs ----
      customBuffs: new ArrayField(customBuffField()),

      // ---- Effect tracking (passives enabled, usage counts) ----
      effectTracking: new ObjectField(),

      // ---- Combat tab state (rounds, resource usage, etc.) ----
      combatTabState: new ObjectField(),

      // ---- Signature Techniques (stored on actor, not as Items) ----
      signatureTechniques: new ArrayField(signatureTechniqueField()),

      // ---- Signature Auras (stored on actor, not as Items) ----
      signatureAuras: new ArrayField(signatureAuraField()),

      // ---- Unique Abilities (character-level selections) ----
      uniqueAbilities: new ArrayField(uniqueAbilityField()),

      // ---- Transformations (stored on actor) ----
      transformations: new ArrayField(transformationField()),

      // ---- Transformation meta ----
      transformationMeta: new SchemaField({
        nullWeakening: new BooleanField({ initial: false }),
        kiMultOverride: new StringField({ initial: "" }),
        legendaryTraits: new StringField({ initial: "" }),
        // Combat-encounter tracking for transformation rules
        burstLimitUsed: new BooleanField({ initial: false }),
        burstLimitSource: new StringField({ initial: "" }),
        legendRealizedUsed: new ArrayField(new StringField()),
        newLevelOfPowerUsed: new ArrayField(new StringField()),
        nlopActiveEncounter: new ArrayField(new StringField()),
        surgingStrengthEncounter: new NumberField({ initial: 0, integer: true }),
        surgingStrengthRound: new NumberField({ initial: 0, integer: true }),
        persistentCombatStates: new ObjectField(),
        specialResources: new ObjectField(),
        legendaryTraitSelections: new ObjectField(),
        // Temporary aspect countdown: {transId: roundsRemaining}
        temporaryCountdowns: new ObjectField(),
        entrySnapshots: new ObjectField(),
        // DKP snapshot at start of combat encounter (for Weakening aspect threshold)
        encounterStartDKP: new NumberField({ required: false, nullable: true, initial: null }),
        // Mutation Trait complex state (Were-creature, OG Soldier, DNA Absorption, etc.)
        mutationState: new ObjectField(),
        // Evil Aura: gain access to 5 Signature Techniques until end of turn (cost 2bT EP)
        evilTechsActive: new BooleanField({ initial: false }),
        evilPoints: new NumberField({ required: true, nullable: false, initial: 0, integer: true, min: 0 }),
      }),

      // ---- Attack References (stored on actor) ----
      attackRefs: new ArrayField(attackRefField()),

      // ---- Biography / Notes ----
      biography: new StringField({ initial: "" }),
      notes: new StringField({ initial: "" }),
      portrait: new StringField({ initial: "" }),

      // ---- Worn Apparel Layer Slots (equipment tab) ----
      wornApparelSlots: new SchemaField({
        topLayer: new StringField({ initial: "" }),
        middleLayer: new StringField({ initial: "" }),
        bottomLayer: new StringField({ initial: "" }),
        accessory1: new StringField({ initial: "" }),
        accessory2: new StringField({ initial: "" })
      }),
      selectedWornLayer: new StringField({ initial: "" }),

      // ---- Equipment Quality Flags (set by equipment-automation/qualities.mjs) ----
      equipmentFlags: new SchemaField({
        preventSizeDestruction: new BooleanField({ initial: false }),
        preventSuffocating:     new BooleanField({ initial: false }),
        unbreakableTopLayer:    new BooleanField({ initial: false }),
        unbreakableWeapons:     new ArrayField(new StringField()),
        skipApparelPenalty:     new ObjectField(),
        skipWeaponLimit:        new ObjectField(),
        sleekDesign:            new BooleanField({ initial: false }),
        durableItems:           new ObjectField(),
        karmicEdge:             new ObjectField(),
        // Combat-time bonuses (consulted by roll handlers)
        assassinsCraft:         new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        duelistParryBonus:      new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        hiddenFirstAttack:      new BooleanField({ initial: false }),
        hiddenUsedThisEncounter:new BooleanField({ initial: false }),
        // ---- Apparel quality flags ----
        // Numeric/aggregated
        leaderInsigniaBonus:       new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        leaderInsigniaTeamWound:   new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        legacyNaturalBonus:        new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        sigTechWoundBonus:         new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        specialEventDoffBonus:     new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        stressTestDiceBonus:       new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        // Boolean
        instantTransmissionDiscount: new BooleanField({ initial: false }),
        jointProtection:           new BooleanField({ initial: false }),
        layeredActive:             new BooleanField({ initial: false }),
        hasIntegratedWeapon:       new BooleanField({ initial: false }),
        // String
        weatherResistance:         new StringField({ initial: "" }),
        // Object maps
        focalTarget:               new ObjectField(),
        notoriousSymbol:           new ObjectField(),
        teamOutfit:                new ObjectField(),
        heftyPlatingHV:            new ObjectField(),
        trainingSupport:           new ObjectField(),
        skillBonuses:              new ObjectField(),
        // ---- Weapon quality flags (per-item maps + accumulators) ----
        durableWeapons:                new ArrayField(new StringField()),
        weaponWoundBonus:              new ObjectField(),
        weaponMeleeRangeBonus:         new ObjectField(),
        weaponLongRangeBonus:          new ObjectField(),
        weaponLongRangeStrikeBonus:    new ObjectField(),
        giantWeapon:                   new ObjectField(),
        highTechWeapons:               new ObjectField(),
        weaponTargetingSystem:         new ObjectField(),
        weaponDamageCatBonus:          new ObjectField(),
        weaponFullBattlefieldMelee:    new ObjectField(),
        weaponAoEMagBonus:             new ObjectField(),
        weaponStrikePenalty:           new ObjectField(),
        weaponHV:                      new ObjectField(),
        wardingDR:                     new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        opponentClashDice:             new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        cqcCategory:                   new ObjectField(),
        flexibleAltCategory:           new ObjectField(),
        variableAltSize:               new ObjectField(),
        elementalBlade:                new ObjectField(),
        weaponBreaker:                 new ObjectField(),
        lastingWounds:                 new ObjectField(),
        quickDraw:                     new ObjectField()
      }),

      // ---- Battle Born Stack Tracking (Saiyan) ----
      battleBorn: new SchemaField({
        strike: new NumberField({ required: true, nullable: false, initial: 0, integer: true, min: 0, max: 5 }),
        dodge: new NumberField({ required: true, nullable: false, initial: 0, integer: true, min: 0, max: 5 }),
        wound: new NumberField({ required: true, nullable: false, initial: 0, integer: true, min: 0, max: 5 }),
        undying: new BooleanField({ initial: false })
      }),

      // ---- Experienced Fighter Tracking (Earthling) ----
      experiencedFighter: new SchemaField({
        mode: new StringField({ initial: "none" }),
        usedThisRound: new BooleanField({ initial: false })
      }),

      // ---- Bio-Android Option Tracking ----
      geneticSplicingOption: new StringField({ initial: "none" }),

      // ---- Android Option Tracking ----
      wondersOption: new StringField({ initial: "none" }),
      energyCoreOption: new StringField({ initial: "none" }),
      specializedOption: new StringField({ initial: "none" }),
      functionalPurposeOption: new StringField({ initial: "none" }),

      // ---- Arcosian Option Tracking ----
      keratinousPlatingOption: new StringField({ initial: "none" }),

      // ---- Namekian Option Tracking ----
      refinedCombatOption: new StringField({ initial: "none" }),
      spiritOfNamekOption: new StringField({ initial: "none" }),

      // ---- Shadow Dragon Option Tracking ----
      supernaturalPowersOption: new StringField({ initial: "none" }),

      // ---- Shinjin Option Tracking ----
      lightMagicOption: new StringField({ initial: "none" }),
      darkMagicOption: new StringField({ initial: "none" }),

      // ---- Adversary System (ARC-only) ----
      adversary: new SchemaField({
        enabled: new BooleanField({ initial: false }),
        category: new StringField({ initial: "standard" }),
        difficultyLevel: new StringField({ initial: "easy" }),
        partySize: new NumberField({ required: true, nullable: false, initial: 1, integer: true, min: 1 }),

        partyRules: new SchemaField({
          narrativeStamina: new BooleanField({ initial: false }),
          oneManArmy: new BooleanField({ initial: false }),
          villainousKarma: new BooleanField({ initial: false }),
          withoutCapacity: new BooleanField({ initial: false })
        }),

        villainousTraits: new ArrayField(new StringField()),
        villainousOptionSelections: new ObjectField(),

        weaknesses: new ArrayField(new StringField()),
        weaknessOptionSelections: new ObjectField(),

        minion: new SchemaField({
          enabled: new BooleanField({ initial: false }),
          dangerLevel: new StringField({ initial: "medium" }),
          minionTraits: new ArrayField(new StringField()),
          minionOptionSelections: new ObjectField()
        })
      }),

      // ---- Transformation Customization ----
      transformationCustomization: new SchemaField({
        limitShattering: new SchemaField({
          transformationId: new NumberField({ initial: -1, integer: true }),
          exceedTrait: new StringField({ initial: "" }),
          exceedActive: new BooleanField({ initial: false })
        }),
        uniquePaths: new ArrayField(new SchemaField({
          transformationId: new NumberField({ initial: -1, integer: true }),
          pathType: new StringField({ initial: "" }),
          ambAttribute: new StringField({ initial: "" })
        }))
      }),

      // ---- Downtime System ----
      downtime: new SchemaField({
        // Current period state
        currentPeriod: new SchemaField({
          active: new BooleanField({ initial: false }),
          totalDT: new NumberField({ initial: 0, integer: true, min: 0 }),
          spentDT: new NumberField({ initial: 0, integer: true, min: 0 }),
          activitiesUsed: new ArrayField(new StringField()),
          modifiersUsed: new ArrayField(new StringField()),
          notes: new StringField({ initial: "" })
        }),
        // Lifetime usage counters (limited activities only)
        lifetimeUses: new SchemaField({
          basicTraining: new NumberField({ initial: 0, integer: true, min: 0 }),
          techniqueTraining: new NumberField({ initial: 0, integer: true, min: 0 }),
          transformationTraining: new NumberField({ initial: 0, integer: true, min: 0 }),
          heartbeatTraining: new NumberField({ initial: 0, integer: true, min: 0 }),
          resting: new NumberField({ initial: 0, integer: true, min: 0 }),
          studying: new NumberField({ initial: 0, integer: true, min: 0 }),
          baseBuilding: new NumberField({ initial: 0, integer: true, min: 0 })
        }),
        // Completed period history
        history: new ArrayField(new SchemaField({
          totalDT: new NumberField({ integer: true }),
          activities: new ArrayField(new StringField()),
          modifiers: new ArrayField(new StringField()),
          notes: new StringField({ initial: "" })
        }))
      }),

      // ---- Battle Jacket Piloting ----
      pilotedJacketId: new StringField({ initial: "" }),
      isPiloting: new BooleanField({ initial: false })
    };
  }

  /* -------------------------------------------------- */
  /*  Derived Data                                      */
  /* -------------------------------------------------- */

  prepareDerivedData() {
    const lvl = this.level ?? 1;

    // Tier lookup: 1-4=T1, 5-9=T2, 10-14=T3, 15-19=T4, 20-24=T5, 25-29=T6, 30=T7
    let tier;
    if (lvl <= 4) tier = 1;
    else if (lvl <= 9) tier = 2;
    else if (lvl <= 14) tier = 3;
    else if (lvl <= 19) tier = 4;
    else if (lvl <= 24) tier = 5;
    else if (lvl <= 29) tier = 6;
    else tier = 7;

    this.tier = tier;
    // baseTier = tier from PL only, ignoring any modifications (NLOP, Holding Back, etc.)
    // "base Tier of Power can ONLY be modified by your Power Level" (quick-start-guide.txt)
    this.baseTier = tier;

    // Compute progression bonuses from progression rows (MVP behavior).
    const rows = (this.progressionRows && this.progressionRows.length > 0)
      ? this.progressionRows
      : (CONFIG?.DBU?.progressionRows || []);
    const attrKeys = ["ag", "fo", "te", "sc", "in", "ma", "pe"];

    // Determine if this race has fixed racial attributes
    const fixedRaces = CONFIG?.DBU?.racesWithFixedAttributes || [];
    const race = this.race || "";
    const isFixedRace = fixedRaces.includes(race);

    // For fixed races, auto-set attr.racial from config (overrides manual input).
    // For choice races, attr.racial comes from the stored schema value (user-edited via progression tab).
    if (isFixedRace) {
      const racialBonuses = CONFIG?.DBU?.racialAttributeBonuses?.[race] || {};
      for (const key of attrKeys) {
        const attr = this.attributes[key];
        if (attr) attr.racial = racialBonuses[key] ?? 0;
      }
    }

    // Compute progression totals (skip racial_stats — those go into attr.racial, not progression)
    const progressionTotals = Object.fromEntries(attrKeys.map(k => [k, 0]));
    for (const row of rows) {
      if (row.perkType === "racial_stats") continue;
      if ((row.level || 1) > lvl) continue;
      for (const key of attrKeys) {
        if (row[key] !== null && row[key] !== undefined) {
          progressionTotals[key] += Number(row[key]) || 0;
        }
      }
    }

    // Compute base attribute scores (racial + progression).
    // NOTE: These are "base scores" without modifiers from auras/transformations/buffs.
    // The full modified scores are computed in actor.mjs which has access to items.
    for (const key of ["ag", "fo", "te", "sc", "in", "ma", "pe"]) {
      const attr = this.attributes[key];
      if (attr) {
        if (rows.length > 0) attr.progression = progressionTotals[key];
        attr.score = 1 + (attr.racial ?? 0) + (attr.progression ?? 0);
      }
    }
  }
}
