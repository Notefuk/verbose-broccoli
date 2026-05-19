/**
 * TypeDataModel for the "unique-ability" item type.
 * Mirrors UNIQUE_ABILITIES_DATA / uniqueAbilities from the web version.
 *
 * Note: The character-level selection (free flag, chosen advancements,
 * chosen restrictions) is stored on the actor's system.uniqueAbilities array.
 * This item model represents the compendium definition of a unique ability.
 */

const { SchemaField, StringField, NumberField, BooleanField, ArrayField, HTMLField } = foundry.data.fields;

/**
 * Schema for a single advancement option.
 */
function advancementField() {
  return new SchemaField({
    id: new StringField({ required: true, blank: false }),
    name: new StringField({ initial: "" }),
    tpCost: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    maxRanks: new NumberField({ required: true, nullable: false, initial: 1, integer: true, min: 1 }),
    effect: new StringField({ initial: "" })
  });
}

/**
 * Schema for a single restriction option.
 */
function restrictionField() {
  return new SchemaField({
    id: new StringField({ required: true, blank: false }),
    name: new StringField({ initial: "" }),
    tpCost: new NumberField({ required: true, nullable: false, initial: 0, integer: true }),
    effect: new StringField({ initial: "" })
  });
}

export default class DBUUniqueAbilityData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // Key into UNIQUE_ABILITIES_DATA (e.g. "afterimage", "android-barrier")
      abilityKey: new StringField({ required: true, blank: false, initial: "unknown" }),

      // Whether this ability was granted for free (0 TP base cost)
      free: new BooleanField({ initial: false }),

      // Description (rich text)
      description: new HTMLField({ initial: "" }),

      // Available advancement options
      advancements: new ArrayField(advancementField()),

      // Available restriction options (negative TP cost)
      restrictions: new ArrayField(restrictionField())
    };
  }
}
