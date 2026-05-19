/**
 * Extend the base Combat document for DBU-OLD.
 * Handles Initiative Advantage detection after initiative rolls.
 * @extends {Combat}
 */
export class DBUCombat extends Combat {

  /**
   * Override rollInitiative to handle Alert talent (2d10kh).
   * For combatants with alertReroll, use advantage formula.
   */
  async rollInitiative(ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {
    // Separate Alert combatants from normal ones
    const alertIds = [];
    const normalIds = [];
    for (const id of ids) {
      const c = this.combatants.get(id);
      if (c?.actor?.system?.aptitudes?.alertReroll) {
        alertIds.push(id);
      } else {
        normalIds.push(id);
      }
    }

    // Roll Alert combatants with 2d10kh formula
    if (alertIds.length > 0) {
      const alertFormula = "2d10kh + @aptitudes.initiative + @aptitudes.initiativeRollBonus";
      await super.rollInitiative(alertIds, { formula: alertFormula, updateTurn: false, messageOptions });
    }

    // Roll normal combatants with default formula
    if (normalIds.length > 0) {
      await super.rollInitiative(normalIds, { formula, updateTurn, messageOptions });
    } else if (alertIds.length > 0 && updateTurn) {
      // If only alert combatants were rolled, preserve current turn or default to 0
      await this.update({ turn: this.turn ?? 0 });
    }

    // Evaluate Initiative Advantage after all rolls
    await this._evaluateInitiativeAdvantage();
    return this;
  }

  /**
   * Evaluate Initiative Advantage for every combatant in this combat.
   * IA = your rolled initiative >= 2+2(bT) above highest opponent.
   * Double IA = >= 5+2(bT) above highest opponent.
   * Lowest Initiative = your rolled initiative is the lowest in turn order.
   */
  async _evaluateInitiativeAdvantage() {
    const combatants = this.combatants.contents.filter(c => c.initiative !== null && c.initiative !== undefined);
    if (combatants.length < 2) return;

    const updates = [];
    for (const c of combatants) {
      const actor = c.actor;
      if (!actor) continue;
      const system = actor.system;
      const tier = system?.tier ?? 1;
      const baseTier = system?.baseTier ?? 1;
      const myInit = c.initiative;

      // Initiative Value: separate bonus from transformations (SSJ, Golden Power, etc.)
      // Added on top of rolled initiative ONLY for IA comparison, not for turn order.
      const myInitValue = system?.aptitudes?.initiativeValue ?? 0;

      // Find opponents (different token disposition)
      const opponents = combatants.filter(opp => {
        if (opp.id === c.id) return false;
        const myDisp = c.token?.disposition ?? 1;
        const oppDisp = opp.token?.disposition ?? 1;
        return myDisp !== oppDisp;
      });

      let ia = false;
      let doubleIa = false;
      let lowestInit = false;

      if (opponents.length > 0) {
        // Each combatant's effective initiative for IA = rolled initiative + Initiative Value
        const highestOpp = Math.max(...opponents.map(o => {
          const oppIV = o.actor?.system?.aptitudes?.initiativeValue ?? 0;
          return (o.initiative ?? 0) + oppIV;
        }));
        const diff = (myInit + myInitValue) - highestOpp;
        const iaThreshold = 2 + 2 * baseTier;
        const doubleThreshold = 5 + 2 * baseTier;
        if (diff >= iaThreshold) ia = true;
        if (diff >= doubleThreshold) doubleIa = true;
      }

      // Check if lowest initiative in full turn order
      const allInits = combatants.map(x => x.initiative ?? 0);
      if (myInit <= Math.min(...allInits)) lowestInit = true;

      updates.push({ combatantId: c.id, ia, doubleIa, lowestInit });
    }

    // Batch-update flags (single update per combatant for performance)
    for (const u of updates) {
      const c = this.combatants.get(u.combatantId);
      if (!c) continue;
      await c.update({
        "flags.DBU-MRR-OLD.initiativeAdvantage": u.ia,
        "flags.DBU-MRR-OLD.doubleInitiativeAdvantage": u.doubleIa,
        "flags.DBU-MRR-OLD.lowestInitiative": u.lowestInit
      });
    }
  }

  /**
   * Register hooks for re-evaluating Initiative Advantage
   * when combatants change.
   */
  static registerHooks() {
    Hooks.on("updateCombatant", async (combatant, change, options, userId) => {
      if ("initiative" in change && combatant.combat) {
        await combatant.combat._evaluateInitiativeAdvantage();
      }
    });
    Hooks.on("createCombatant", async (combatant, options, userId) => {
      if (combatant.combat) {
        await combatant.combat._evaluateInitiativeAdvantage();
      }
    });
    Hooks.on("deleteCombatant", async (combatant, options, userId) => {
      if (combatant.combat) {
        await combatant.combat._evaluateInitiativeAdvantage();
      }
    });
  }
}
