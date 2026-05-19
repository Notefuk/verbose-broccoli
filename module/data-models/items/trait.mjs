/**
 * TypeDataModel for the "trait" item type (racial traits).
 * Mirrors the RACIAL_TRAITS_DATA structure from racial-traits-data.js.
 */

const { SchemaField, StringField, NumberField, BooleanField, ArrayField, HTMLField } = foundry.data.fields;

/**
 * Schema for a single trait effect entry.
 * Each effect is gated by level and describes an activation type / usage limit.
 */
function traitEffectField() {
  return new SchemaField({
    level: new NumberField({ required: true, nullable: false, initial: 1, integer: true, min: 1 }),
    activationType: new StringField({ initial: "passive" }),   // passive | triggered | limited
    keyword: new StringField({ initial: "" }),
    text: new StringField({ initial: "" }),
    usageLimit: new StringField({ initial: "" }),               // "" | "1/round" | "1/encounter" etc.
    maxUses: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
  });
}

export default class DBUTraitData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // "primary" or "secondary"
      traitCategory: new StringField({ initial: "primary" }),

      // Race this trait belongs to (e.g. "saiyan", "earthling")
      race: new StringField({ initial: "" }),

      // "body" or "mind"
      category: new StringField({ initial: "body" }),

      // Description (rich text)
      description: new HTMLField({ initial: "" }),

      // Array of level-gated effects
      effects: new ArrayField(traitEffectField())
    };
  }
}
