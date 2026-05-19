/**
 * ActorSheet for the "battleJacket" actor type.
 */
export class DBUBattleJacketSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["dbu-old", "sheet", "actor", "battle-jacket"],
      template: "systems/DBU-MRR-OLD/templates/actor/battle-jacket.hbs",
      width: 700,
      height: 750,
      resizable: true
    });
  }

  async _updateObject(event, formData) {
    // Form rows only render visible fields (e.g. name/description). Hidden schema
    // fields like `id` must be preserved from existing actor data, otherwise the
    // schema rejects the update with "id: may not be null".
    const arrayFieldsToMerge = ["signatureTechniques", "signatureAuras", "uniqueAbilities"];
    for (const key of arrayFieldsToMerge) {
      const prefix = `system.${key}.`;
      const formRows = {};
      const keysToRemove = [];
      for (const fk of Object.keys(formData)) {
        if (!fk.startsWith(prefix)) continue;
        const rest = fk.slice(prefix.length);
        const dotIdx = rest.indexOf(".");
        if (dotIdx > -1) {
          const rowIdx = rest.slice(0, dotIdx);
          const field = rest.slice(dotIdx + 1);
          if (!formRows[rowIdx]) formRows[rowIdx] = {};
          formRows[rowIdx][field] = formData[fk];
        }
        keysToRemove.push(fk);
      }
      if (Object.keys(formRows).length === 0) continue;
      for (const fk of keysToRemove) delete formData[fk];
      const existing = this.actor.system[key] || [];
      const formIndices = Object.keys(formRows).map(Number).sort((a, b) => a - b);
      const mergedRows = formIndices.map(idx => {
        const base = foundry.utils.deepClone(existing[idx] || { id: idx + 1 });
        const overlay = formRows[String(idx)];
        return { ...base, ...overlay };
      });
      formData[`system.${key}`] = mergedRows;
    }
    return super._updateObject(event, formData);
  }

  getData() {
    const context = super.getData();
    const system = context.actor.system;

    // Pilot info
    const pilotActor = system.pilotId ? game.actors?.get(system.pilotId) : null;
    context.pilotName = pilotActor?.name || "";
    context.pilotId = system.pilotId || "";

    // Derived stats (from TypeDataModel.prepareDerivedData)
    context.jacketTier = system.jacketTier;
    context.capacity = system.capacity;
    context.techniquePoints = system.techniquePoints;
    context.maxModules = system.maxModules;
    context.frameUniqueModule = system.frameUniqueModule;
    context.engineUniqueModule = system.engineUniqueModule;
    context.healthThresholds = system.healthThresholds;
    context.effectiveSizeCategory = system.effectiveSizeCategory;

    // Module catalog for dropdowns
    const catalog = CONFIG.DBU?.jacketModulesCatalog || {};
    const installed = new Set(system.installedModules || []);

    // Build exclusion set from installed modules
    const allExclusions = new Set();
    for (const modId of installed) {
      const mod = catalog[modId];
      if (mod?.exclusions) mod.exclusions.forEach(e => allExclusions.add(e));
    }

    // Available standard modules (not unique, not excluded, not already installed)
    context.availableModules = Object.entries(catalog)
      .filter(([k, v]) => !v.unique && !allExclusions.has(k) && !installed.has(k))
      .map(([k, v]) => ({ id: k, name: v.name }));

    // Installed modules with full data
    context.installedModules = (system.installedModules || []).map(id => {
      const mod = catalog[id];
      return mod ? { id, name: mod.name, description: mod.description, effects: mod.effects } : { id, name: id, description: "", effects: [] };
    });

    // Unique module data
    context.frameUniqueModuleData = catalog[system.frameUniqueModule] || null;
    context.engineUniqueModuleData = catalog[system.engineUniqueModule] || null;

    // LP/KP percentages for bars
    context.lpPercent = system.lp.max > 0 ? Math.clamped(system.lp.value / system.lp.max * 100, 0, 100) : 0;
    context.kpPercent = system.kp.max > 0 ? Math.clamped(system.kp.value / system.kp.max * 100, 0, 100) : 0;

    // Grade/Frame/Engine options for selectors
    context.gradeOptions = [
      { value: "basic", label: "Basic" },
      { value: "advanced", label: "Advanced" },
      { value: "masterpiece", label: "Masterpiece" },
      { value: "magnumOpus", label: "Magnum Opus" }
    ];
    context.frameOptions = [
      { value: "assault", label: "Assault" },
      { value: "sentinel", label: "Sentinel" },
      { value: "mobile", label: "Mobile" }
    ];
    context.engineOptions = [
      { value: "power", label: "Power" },
      { value: "balance", label: "Balance" },
      { value: "speed", label: "Speed" }
    ];

    context.system = system;

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // Module add/remove
    html.on("change", ".module-select", this._onModuleSelect.bind(this));
    html.on("click", "[data-action='remove-module']", this._onRemoveModule.bind(this));

    // Pilot assign/unassign
    html.on("click", "[data-action='assign-pilot']", this._onAssignPilot.bind(this));
    html.on("click", "[data-action='unassign-pilot']", this._onUnassignPilot.bind(this));

    // Weak point toggles
    html.on("change", ".weak-point-toggle", this._onWeakPointToggle.bind(this));

    // Technique/Aura/UA CRUD
    html.on("click", "[data-action='add-bj-technique']", this._onAddTechnique.bind(this));
    html.on("click", "[data-action='delete-bj-technique']", this._onDeleteTechnique.bind(this));
    html.on("click", "[data-action='add-bj-aura']", this._onAddAura.bind(this));
    html.on("click", "[data-action='delete-bj-aura']", this._onDeleteAura.bind(this));
    html.on("click", "[data-action='add-bj-ua']", this._onAddUA.bind(this));
    html.on("click", "[data-action='delete-bj-ua']", this._onDeleteUA.bind(this));
  }

  // --- Module Handlers ---

  async _onModuleSelect(event) {
    const slotIndex = Number(event.currentTarget.dataset.slot);
    const moduleId = event.currentTarget.value;
    const modules = [...(this.actor.system.installedModules || [])];
    if (moduleId) {
      if (slotIndex < modules.length) {
        modules[slotIndex] = moduleId;
      } else {
        modules.push(moduleId);
      }
    }
    await this.actor.update({ "system.installedModules": modules });
  }

  async _onRemoveModule(event) {
    const slotIndex = Number(event.currentTarget.dataset.slot);
    const modules = [...(this.actor.system.installedModules || [])];
    modules.splice(slotIndex, 1);
    await this.actor.update({ "system.installedModules": modules });
  }

  // --- Pilot Handlers ---

  async _onAssignPilot(event) {
    const characters = game.actors.filter(a => a.type === "character");
    if (characters.length === 0) return ui.notifications.warn("No character actors found.");

    const options = characters.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
    const content = `<form><div class="form-group"><label>Select Pilot</label><select name="pilotId">${options}</select></div></form>`;

    const result = await Dialog.wait({
      title: "Assign Pilot",
      content,
      buttons: {
        ok: { icon: '<i class="fas fa-check"></i>', label: "Assign", callback: html => html.find("[name=pilotId]").val() },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => null }
      },
      default: "ok"
    });

    if (result) {
      // Clear old pilot's link if this jacket already had a different pilot
      const oldPilotId = this.actor.system.pilotId;
      if (oldPilotId && oldPilotId !== result) {
        const oldPilot = game.actors.get(oldPilotId);
        if (oldPilot) await oldPilot.update({ "system.pilotedJacketId": "", "system.isPiloting": false });
      }

      const pilotActor = game.actors.get(result);
      if (pilotActor) {
        // Clear new pilot's old jacket link if they were linked elsewhere
        const oldJacketId = pilotActor.system.pilotedJacketId;
        if (oldJacketId && oldJacketId !== this.actor.id) {
          const oldJacket = game.actors.get(oldJacketId);
          if (oldJacket) await oldJacket.update({ "system.pilotId": "" });
        }
        await pilotActor.update({ "system.pilotedJacketId": this.actor.id });
      }

      await this.actor.update({ "system.pilotId": result });
    }
  }

  async _onUnassignPilot(event) {
    const pilotId = this.actor.system.pilotId;
    if (pilotId) {
      const pilotActor = game.actors.get(pilotId);
      if (pilotActor) {
        await pilotActor.update({ "system.pilotedJacketId": "", "system.isPiloting": false });
      }
    }
    await this.actor.update({ "system.pilotId": "" });
  }

  // --- Weak Point Handlers ---

  async _onWeakPointToggle(event) {
    const field = event.currentTarget.dataset.field;
    const checked = event.currentTarget.checked;
    await this.actor.update({ [`system.weakPoints.${field}`]: checked });
  }

  // --- Ability CRUD ---

  async _onAddTechnique() {
    const techs = [...(this.actor.system.signatureTechniques || [])];
    const nextId = techs.length > 0 ? Math.max(...techs.map(t => t.id || 0)) + 1 : 1;
    techs.push({ id: nextId, name: "New Technique", type: "signature", foundation: "Physical", profile: "Simple", description: "", tpMax: 10, freeTP: 0, baseEnergyCharges: 0, extraEnergyCharges: 0, isWeapon: false, isLimitBreak: false, advantages: [], disadvantages: [] });
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  async _onDeleteTechnique(event) {
    const idx = Number(event.currentTarget.dataset.index);
    const techs = [...(this.actor.system.signatureTechniques || [])];
    techs.splice(idx, 1);
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  async _onAddAura() {
    const auras = [...(this.actor.system.signatureAuras || [])];
    const nextId = auras.length > 0 ? Math.max(...auras.map(a => a.id || 0)) + 1 : 1;
    auras.push({ id: nextId, name: "New Aura", type: "Sparking", active: false, description: "", tpMax: 10, freeTP: 0, advantages: [], disadvantages: [] });
    await this.actor.update({ "system.signatureAuras": auras });
  }

  async _onDeleteAura(event) {
    const idx = Number(event.currentTarget.dataset.index);
    const auras = [...(this.actor.system.signatureAuras || [])];
    auras.splice(idx, 1);
    await this.actor.update({ "system.signatureAuras": auras });
  }

  async _onAddUA() {
    const uas = [...(this.actor.system.uniqueAbilities || [])];
    const nextId = uas.length > 0 ? Math.max(...uas.map(u => u.id || 0)) + 1 : 1;
    uas.push({ id: nextId, abilityKey: "custom", free: false, advancements: [], restrictions: [] });
    await this.actor.update({ "system.uniqueAbilities": uas });
  }

  async _onDeleteUA(event) {
    const idx = Number(event.currentTarget.dataset.index);
    const uas = [...(this.actor.system.uniqueAbilities || [])];
    uas.splice(idx, 1);
    await this.actor.update({ "system.uniqueAbilities": uas });
  }
}
