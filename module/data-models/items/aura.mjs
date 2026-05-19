/**
 * TypeDataModel for the "aura" item type.
 * Mirrors SIGNATURE_AURAS structure from data.js.
 */

const { SchemaField, StringField, NumberField, BooleanField, ArrayField, HTMLField } = foundry.data.fields;

/**
 * Schema for a single aura advantage / disadvantage entry.
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

export default class DBUAuraData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // Aura type: "Sparking", "Illuminating", "Turbulent", etc.
      auraType: new StringField({ initial: "Sparking" }),

      // Whether this aura is currently active on the character
      active: new BooleanField({ initial: false }),

      // TP fields
      tpCost: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
      tpMax: new NumberField({ required: true, nullable: false, initial: 50, integer: true }),
      freeTP: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),

      // Description (rich text)
      description: new HTMLField({ initial: "" }),

      // Advantages & Disadvantages
      advantages: new ArrayField(advDisadvField()),
      disadvantages: new ArrayField(advDisadvField())
    };
  }
}
