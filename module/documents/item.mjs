/**
 * Extend the base Item document for the DBU-OLD system.
 * @extends {Item}
 */
export class DBUItem extends Item {

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    // Dispatch to type-specific preparation
    switch (this.type) {
      case 'technique':
        this._prepareTechniqueData();
        break;
      case 'transformation':
        this._prepareTransformationData();
        break;
      case 'uniqueAbility':
        this._prepareUniqueAbilityData();
        break;
    }
  }

  /**
   * Prepare derived data for techniques.
   * Handles TP cost calculations, tier-scaled damage, etc.
   */
  _prepareTechniqueData() {
    // TODO: Port TP calculation from app.js
    // - tpPerRank can be array or number; use Array.isArray() check
    // - Signature technique TP adjustments
  }

  /**
   * Prepare derived data for transformations.
   * Handles stat modifier calculations based on tier.
   */
  _prepareTransformationData() {
    // TODO: Port transformation stat calculations
  }

  /**
   * Prepare derived data for unique abilities.
   * Handles TP cost with floor calculation and advancement modifiers.
   */
  _prepareUniqueAbilityData() {
    // TODO: Port unique ability TP calculation
    // - TP floor: Math.ceil(baseTpCost / 2) per manual rules
    // - Advancement and restriction cost modifiers
  }
}
