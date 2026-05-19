/**
 * TypeDataModel for the "transformation" item type.
 * Mirrors characterTransformations entries from app.js.
 */

const { SchemaField, StringField, NumberField, BooleanField, ArrayField, ObjectField, HTMLField } = foundry.data.fields;

export default class DBUTransformationData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // Key into the transformations catalog (null for manual entries)
      catalogKey: new StringField({ nullable: true, initial: null }),

      // Transformation type ID (e.g. "manifested_power", "enhancement_standard", "form_alternate", "form_legendary")
      transformationType: new StringField({ initial: "form_alternate" }),

      // Whether this transformation is currently active
      active: new BooleanField({ initial: false }),

      // Grade or stacks text (e.g. "Grade 1", "3 stacks")
      gradeOrStacks: new StringField({ initial: "" }),

      // Minimum tier required to use this transformation
      tierRequirement: new StringField({ initial: "" }),

      // Whether the character has mastered this transformation
      mastered: new BooleanField({ initial: false }),

      // Stress test DC
      stressTest: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),

      // Attribute bonuses while transformed (e.g. { ag: "+2", fo: "+3" })
      attrBonuses: new ObjectField(),

      // Selected aspects (string IDs or names)
      aspects: new ArrayField(new StringField()),

      // Structured trait objects for complex trait data
      structuredTraits: new ArrayField(new ObjectField()),

      // Legacy free-text traits field
      traits: new StringField({ initial: "" }),

      // Whether this is a legendary form
      isLegendary: new BooleanField({ initial: false }),

      // Description (rich text)
      description: new HTMLField({ initial: "" })
    };
  }
}
