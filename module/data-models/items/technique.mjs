/**
 * TypeDataModel for the "technique" item type.
 * Mirrors SIGNATURE_TECHNIQUES structure from data.js.
 */

const { SchemaField, StringField, NumberField, BooleanField, ArrayField, HTMLField } = foundry.data.fields;

/**
 * Schema for a single technique advantage / disadvantage entry.
 */
function advDisadvField() {
  return new SchemaField({
    name: new StringField({ required: true, blank: false }),
    ranks: new NumberField({ required: true, nullable: false, initial: 1, integer: true, min: 0 }),
    notes: new StringField({ initial: "" }),
    tpCost: new NumberField({ required: true, nullable: false, initial: 0 }),
    dynamicTP: new NumberField({ required: true, nullable: false, initial: 0 })
  });
}

export default class DBUTechniqueData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // Type: "Super Signature", "Ultimate Signature", or "Limit Break"
      techType: new StringField({ initial: "Super Signature" }),

      // Foundation: "Physical", "Energy", or "Magic"
      foundation: new StringField({ initial: "Energy" }),

      // Profile: "Beam", "Sphere", "Blitz", etc.
      profile: new StringField({ initial: "" }),

      // TP fields
      tpCost: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
      tpMax: new NumberField({ required: true, nullable: false, initial: 30, integer: true }),
      freeTP: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),

      // Energy charges
      baseEnergyCharges: new NumberField({ required: true, nullable: false, initial: 0, integer: true, min: 0 }),
      extraEnergyCharges: new NumberField({ required: true, nullable: false, initial: 0, integer: true, min: 0 }),

      // Flags
      isLimitBreak: new BooleanField({ initial: false }),
      isWeapon: new BooleanField({ initial: false }),

      // Description (rich text)
      description: new HTMLField({ initial: "" }),

      // Advantages & Disadvantages
      advantages: new ArrayField(advDisadvField()),
      disadvantages: new ArrayField(advDisadvField()),

      // Combat roll formulas (display / override)
      strikeFormula: new StringField({ initial: "" }),
      strikeCT: new StringField({ initial: "" }),
      woundFormula: new StringField({ initial: "" }),
      woundCT: new StringField({ initial: "" })
    };
  }
}
