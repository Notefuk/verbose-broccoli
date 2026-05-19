/**
 * TypeDataModel for the "talent" item type.
 * Mirrors ALL_TALENTS / ALL_TALENTS_DATA from the web version.
 */

const { SchemaField, StringField, NumberField, ArrayField, HTMLField } = foundry.data.fields;

/**
 * Schema for a single talent effect entry.
 */
function talentEffectField() {
  return new SchemaField({
    level: new NumberField({ required: true, nullable: false, initial: 1, integer: true, min: 1 }),
    activationType: new StringField({ initial: "passive" }),   // passive | triggered | limited
    keyword: new StringField({ initial: "" }),
    text: new StringField({ initial: "" }),
    usageLimit: new StringField({ initial: "" }),
    maxUses: new NumberField({ required: true, nullable: false, initial: 0, integer: true })
  });
}

export default class DBUTalentData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // Category grouping (e.g. "combat", "ki", "utility", "racial")
      category: new StringField({ initial: "" }),

      // Prerequisite description (free text)
      prerequisites: new StringField({ initial: "" }),

      // Description (rich text)
      description: new HTMLField({ initial: "" }),

      // Array of level-gated effects
      effects: new ArrayField(talentEffectField())
    };
  }
}
