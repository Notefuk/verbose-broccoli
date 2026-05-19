/**
 * TypeDataModel for the "equipment" item type.
 * Covers apparel, weapons, and accessories.
 */

const { SchemaField, StringField, NumberField, BooleanField, ArrayField, ObjectField, HTMLField } = foundry.data.fields;

/**
 * Schema for a single equipment quality.
 */
function qualityField() {
  return new SchemaField({
    name: new StringField({ required: true, initial: "" }),
    qualityKey: new StringField({ initial: "" }),
    notes: new StringField({ initial: "" }),
    slotsUsed: new NumberField({ required: true, nullable: false, initial: 1, integer: true, min: 0 }),
    ranks: new NumberField({ required: true, nullable: false, initial: 1, integer: true, min: 0 }),
    config: new ObjectField()
  });
}

export default class DBUEquipmentData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // "apparel", "weapon", or "accessory"
      equipmentType: new StringField({ initial: "apparel" }),

      // Whether the item is currently worn / equipped
      worn: new BooleanField({ initial: false }),

      // Description (rich text)
      description: new HTMLField({ initial: "" }),

      // Equipment qualities
      qualities: new ArrayField(qualityField()),

      // ---- Apparel-specific ----
      apparelCategory: new StringField({ initial: "standard_clothing" }),
      craftsmanshipGrade: new NumberField({ initial: 1, integer: true, min: 1, max: 5 }),
      breakValueCurrent: new NumberField({ initial: 3, integer: true, min: 0 }),
      doffUsed: new BooleanField({ initial: false }),

      // ---- Weapon-specific ----
      weaponType: new StringField({ initial: "physical" }),
      weaponCategory: new StringField({ initial: "" }),
      weaponSize: new StringField({ initial: "standard" }),
      weaponLP: new NumberField({ initial: 0, integer: true, min: 0 }),

      // ---- Accessory-specific ----
      accessoryKey: new StringField({ initial: "" }),
      effectOverride: new StringField({ initial: "" }),

      // ---- Worn slot (for multi-layer system) ----
      wornSlot: new StringField({ initial: "" }),

      // Freeform stats object (for any extra calculations)
      stats: new ObjectField()
    };
  }
}
