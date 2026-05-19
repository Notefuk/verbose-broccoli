/**
 * Actor sheet for DBU-OLD character type.
 * @extends {ActorSheet}
 */
export class DBUCharacterSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["dbu-old", "sheet", "actor", "character"],
      template: "systems/DBU-MRR-OLD/templates/actor/character-sheet.hbs",
      width: 1100,
      height: 800,
      resizable: true,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "main",
          group: "primary"
        }
      ]
    });
  }

  // -------------------------------------------------------
  // Form Submission — merge form data with existing actor data
  // -------------------------------------------------------

  /** @override */
  async _updateObject(event, formData) {
    // Generic array merge: form data only contains visible fields per row.
    // Hidden fields (id, convertible, etc.) must be preserved from existing data.
    const arrayFieldsToMerge = [
      { key: "progressionRows", fallbackKey: "progressionRows" },
      { key: "customBuffs", fallbackKey: null },
      { key: "attackRefs", fallbackKey: null },
      { key: "transformations", fallbackKey: null }
    ];

    for (const { key, fallbackKey } of arrayFieldsToMerge) {
      const prefix = `system.${key}.`;
      const formRows = {};
      const keysToRemove = [];

      // Collect array sub-keys from flat formData
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

      // Remove flat keys
      for (const fk of keysToRemove) delete formData[fk];

      // Get existing stored data (with fallback for progression rows from CONFIG)
      const stored = this.actor.system[key] || [];
      const fallback = fallbackKey ? (CONFIG.DBU?.[fallbackKey] || []) : [];
      const existing = stored.length > 0 ? stored : fallback;

      // Merge form data onto existing rows
      const formIndices = Object.keys(formRows).map(Number).sort((a, b) => a - b);
      let mergedRows = formIndices.map(idx => {
        const base = foundry.utils.deepClone(existing[idx] || { id: idx });
        const overlay = formRows[String(idx)];
        return { ...base, ...overlay };
      });
      if (key === "transformations") {
        mergedRows = this._normalizeTransformationRows(mergedRows);
      }
      formData[`system.${key}`] = mergedRows;
    }

    // Sync progression talent selections with system.talents array
    // Progression stores talent NAMES, but system.talents stores talent IDs
    if (formData["system.progressionRows"]) {
      const talentCatalog = CONFIG.DBU?.talentsCatalog || [];
      const nameToId = (name) => {
        const t = talentCatalog.find(c => c.name === name);
        return t ? t.id : null;
      };

      const progRows = formData["system.progressionRows"];
      const progTalentIds = progRows.map(r => nameToId(r.talent)).filter(Boolean);

      // Determine which IDs came from old progression rows (to identify manual adds)
      const existingTalents = this.actor.system.talents || [];
      const oldProgRows = this.actor.system.progressionRows || [];
      const oldProgTalentIds = new Set(
        oldProgRows.map(r => nameToId(r.talent)).filter(Boolean)
      );

      // Talents not from progression (manually added) are preserved
      const manualTalents = existingTalents.filter(t => !oldProgTalentIds.has(t));
      // Combine: manual + new progression talents (unique)
      const combined = [...new Set([...manualTalents, ...progTalentIds])];
      formData["system.talents"] = combined;
    }

    // Ensure integer racial attribute fields don't fail validation with empty strings
    for (const key of ["ag", "fo", "te", "sc", "in", "ma", "pe"]) {
      const field = `system.attributes.${key}.racial`;
      if (field in formData) {
        const v = formData[field];
        if (v === "" || v === null || v === undefined) {
          formData[field] = 0;
        } else {
          formData[field] = Math.round(Number(v)) || 0;
        }
      }
    }

    // Resolve duplicate-name inputs (header + main tab both have lifePoints.value / kiPool.value).
    // FormDataExtended returns an array when two inputs share the same name.
    // Pick the value that differs from the current actor value (= the one the user just edited).
    const resourceFields = [
      { field: "system.lifePoints.value", current: this.actor.system.lifePoints?.value ?? 0, max: this.actor.system.lifePoints?.max ?? Infinity },
      { field: "system.kiPool.value", current: this.actor.system.kiPool?.value ?? 0, max: this.actor.system.kiPool?.max ?? Infinity }
    ];
    for (const { field, current, max } of resourceFields) {
      if (!(field in formData)) continue;
      let v = formData[field];
      // Resolve array from duplicate name inputs: pick the changed value
      if (Array.isArray(v)) {
        const nums = v.map(x => Math.round(Number(x)) || 0);
        const changed = nums.find(n => n !== current);
        v = changed !== undefined ? changed : nums[0];
      }
      if (v === "" || v === null || v === undefined) {
        formData[field] = 0;
      } else {
        formData[field] = Math.clamped(Math.round(Number(v)) || 0, 0, max);
      }
    }

    // NOTE: Absorption threshold auto-eject is handled in _applyDamage (L11474+),
    // which correctly detects LP-based threshold crossings at the moment damage is applied.
    // The `checked` field now means "saved against penalty", not "threshold crossed".

    // --- Possession: damage sharing with Host ---
    const fusion = this.actor.system.fusion || {};
    if (fusion.isFusion && fusion.type === "one-sided-possession" && fusion.hostCurrentLP != null) {
      const lpField = "system.lifePoints.value";
      if (lpField in formData) {
        const oldLP = this.actor.system.lifePoints?.value ?? 0;
        const newLP = Number(formData[lpField]) || 0;
        if (newLP < oldLP) {
          const damageTaken = oldLP - newLP;
          const hostLP = fusion.hostCurrentLP ?? 0;
          const newHostLP = Math.max(0, hostLP - damageTaken);
          formData["system.fusion.hostCurrentLP"] = newHostLP;
          const hostId = (fusion.suppressedCharacterIds || [])[0];
          const hostActor = game.actors?.get(hostId);
          const hostName = hostActor?.name || "Host";
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: `<div style="border-left:3px solid #9b59b6; padding:4px 8px;">
              <b>Possession — Damage Shared</b><br>
              ${this.actor.name} took <b>${damageTaken}</b> damage. ${hostName}'s body also takes <b>${damageTaken}</b> damage.<br>
              ${hostName}'s LP: ${hostLP} → <b>${newHostLP}</b>
              ${newHostLP <= 0 ? `<br><em style="color:#e74c3c;">⚠ ${hostName}'s body has reached 0 LP!</em>` : ""}
            </div>`
          });
          // If host reaches 0 LP: prompt dialog
          if (newHostLP <= 0) {
            setTimeout(() => {
              new Dialog({
                title: "Host Body Defeated",
                content: `<p><b>${hostName}</b>'s body has reached 0 LP while possessed by <b>${this.actor.name}</b>.</p>
                  <p>Choose what happens:</p>`,
                buttons: {
                  defeated: {
                    icon: '<i class="fas fa-skull"></i>',
                    label: "Be Defeated",
                    callback: async () => {
                      await this.actor.update({ "system.lifePoints.value": 0 });
                      ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                        content: `<b>${this.actor.name}</b> is defeated along with the host body.`
                      });
                    }
                  },
                  endPossession: {
                    icon: '<i class="fas fa-sign-out-alt"></i>',
                    label: "End Possession",
                    callback: async () => {
                      const suppIds = this.actor.system.fusion?.suppressedCharacterIds || [];
                      if (suppIds.length > 0) {
                        await this._onEjectSuppressed({ preventDefault: () => {}, actorId: suppIds[0] });
                      }
                    }
                  }
                },
                default: "endPossession"
              }).render(true);
            }, 200);
          }
        }
      }
    }

    return super._updateObject(event, formData);
  }

  _normalizeTransformationRows(rows) {
    const list = foundry.utils.deepClone(rows || []);
    let nextId = 1;
    const usedIds = new Set();

    for (const row of list) {
      const numericId = Number(row?.id);
      if (Number.isInteger(numericId) && numericId > 0 && !usedIds.has(numericId)) {
        row.id = numericId;
        usedIds.add(numericId);
        nextId = Math.max(nextId, numericId + 1);
      } else {
        while (usedIds.has(nextId)) nextId++;
        row.id = nextId;
        usedIds.add(nextId);
        nextId++;
      }
    }

    return list;
  }

  // -------------------------------------------------------
  // Data Preparation
  // -------------------------------------------------------

  /** @override */
  async getData(options = {}) {
    const context = await super.getData(options);

    // Convenience references
    const system = this.actor.system;
    // Normalize transformation rows in-memory for display only (no actor.update in getData)
    if (Array.isArray(system.transformations) && system.transformations.some(t => !(Number.isInteger(Number(t?.id)) && Number(t?.id) > 0))) {
      system._normalizedTransformations = this._normalizeTransformationRows(system.transformations);
    }
    context.system = system;
    context.flags = this.actor.flags;
    context.editable = this.isEditable;

    // Compute buffTotal for display — buffTotal is a transient display field, safe to set on live data
    // since TypeDataModel strips unknown fields on save and prepareDerivedData recomputes each cycle
    const _tier = system.tier || 1;
    const _baseTier = system.baseTier || _tier;
    for (const buff of (system.customBuffs || [])) {
      buff.buffTotal = (buff.flat || 0) + (buff.bT || 0) * _baseTier + (buff.T || 0) * _tier;
    }

    // System config (for drop-down options, labels, etc.)
    context.config = CONFIG.DBU ?? {};

    // Categorize owned items by type
    this._prepareItems(context);

    // Resource bar percentages for the header
    const lpMax = system.lifePoints?.max || 1;
    const kiMax = system.kiPool?.max || 1;
    context.lpPercent = Math.min(100, Math.round(((system.lifePoints?.value || 0) / lpMax) * 100));
    context.kiPercent = Math.min(100, Math.round(((system.kiPool?.value || 0) / kiMax) * 100));
    const dkpMax = system.divineKiPoints?.max || 1;
    context.dkpPercent = Math.min(100, Math.round(((system.divineKiPoints?.value || 0) / dkpMax) * 100));

    // Prepare attributes array for tab-main.hbs
    const attrLabels = CONFIG.DBU?.attributes ?? {};
    context.attributes = Object.entries(system.attributes ?? {}).map(([key, attr]) => ({
      key,
      name: attrLabels[key] || key.toUpperCase(),
      racial: attr.racial ?? 0,
      progression: attr.progression ?? 0,
      score: attr.score ?? 0,
      modifier: attr.modifier ?? 0,
      totalScore: attr.totalScore ?? (attr.score ?? 0)
    }));

    // Prepare skills array for tab-skills.hbs (floor(attrScore/2) + ranks*2 + Gifted Student + equipment qualities + custom buffs)
    const skillsData = CONFIG.DBU?.skillsData ?? [];
    const gsSkillBonus = system.aptitudes?.giftedStudentSkillBonus || 0;
    const equipSkillBonuses = system.equipmentFlags?.skillBonuses || {};
    // Custom buff: skill group bonuses (per attribute) — match spreadsheet category names
    const skillGroupBuff = (attrKey) => {
      const groupNameMap = {
        ag: "Agility Skills", fo: "Force Skills", sc: "Scholarship Skills",
        in: "Insight Skills", ma: "Magic Skills", pe: "Personality Skills"
      };
      return this.actor._getBuffTotal(system, groupNameMap[attrKey] || "");
    };
    context.skills = skillsData.map((def) => {
      const key = def.id;
      const rank = system.skills?.[key]?.rank ?? system.skills?.[key] ?? 0;
      const attrKey = def.attribute || "ag";
      const attrData = system.attributes?.[attrKey];
      const attrScore = attrData?.score ?? 0;
      const rankNum = Number(rank) || 0;
      const equipBonus = Number(equipSkillBonuses[key]) || 0;
      // Per-skill buff (matches the skill's display name from spreadsheet)
      const perSkillBuff = this.actor._getBuffTotal(system, def.name || "");
      const groupBuff = skillGroupBuff(attrKey);
      const bonus = Math.floor(attrScore / 2) + (rankNum * 2) + gsSkillBonus + equipBonus + perSkillBuff + groupBuff;
      return {
        key,
        name: def.name || key,
        attribute: attrKey,
        abbr: attrKey.toUpperCase(),
        rank: rankNum,
        bonus,
        bonusStr: bonus >= 0 ? `+${bonus}` : `${bonus}`
      };
    });
    // Expose for testability
    system._skillBonuses = Object.fromEntries(context.skills.map(s => [s.key, s.bonus]));

    // Subspecies options based on selected race
    context.subspeciesOptions = this._getSubspeciesOptions(system);
    context.subraceOptions = this._getSubraceOptions(system);
    context.showSubrace = (context.subraceOptions.length > 0);

    // Select options for dropdowns
    context.raceOptions = {
      saiyan: "Saiyan", earthling: "Earthling", namekian: "Namekian",
      android: "Android", bioAndroid: "Bio-Android", majin: "Majin",
      arcosian: "Arcosian", shinjin: "Shinjin", cerealian: "Cerealian",
      neoTuffle: "Neo-Tuffle", nekoMajin: "Neko-Majin", shadowDragon: "Shadow Dragon",
      undead: "Undead",
      customSpecies: "Custom Species"
    };
    context.sizeOptions = {
      nano: "Nano", tiny: "Tiny", small: "Small", medium: "Medium",
      large: "Large", enormous: "Enormous", gigantic: "Gigantic", colossal: "Colossal"
    };

    context.dmgCategoryOptions = {
      standard: "Standard", direct: "Direct", lethal: "Lethal"
    };
    context.defenseOptions = {
      none: "None", directHit: "Direct Hit", guard: "Guard"
    };

    // ---- Traits tab data ----
    context.raceLabel = context.raceOptions[system.race] || system.race;
    context.subspeciesLabel = this._getSubspeciesLabel(system) || "—";
    const subraceList = CONFIG.DBU?.racialSubraces?.[system.race] || [];
    const matchedSubrace = subraceList.find(sr => sr.id === system.subrace);
    context.subraceLabel = matchedSubrace?.name || "—";
    context.characterTraits = this._getCharacterTraits(system);
    context.isCustomSpecies = system.race === "customSpecies";

    // ---- Talents tab data ----
    context.talentCategories = Object.keys(CONFIG.DBU?.talentCategories ?? {});
    context.selectedTalentCategory = this._talentCategoryFilter ?? "";
    const allCharTalents = this._getCharacterTalents(system);
    const filtered = context.selectedTalentCategory
      ? allCharTalents.filter(t => t.category === context.selectedTalentCategory)
      : allCharTalents;
    context.characterTalents = filtered;
    context.visibleTalentCount = filtered.length;
    context.totalTalentCount = allCharTalents.length;
    context.talentGroups = this._groupTalentsByCategory(filtered);

    // ---- Bio tab data ----
    context.alignmentOptions = {
      hero: "Hero", villain: "Villain", neutral: "Neutral"
    };

    // ---- Adversary tab dropdown options ----
    context.adversaryCategoryOptions = {
      villain: "Villain", superior: "Superior", standard: "Standard", mook: "Mook"
    };
    context.adversaryDifficultyOptions = {
      easy: "Easy", medium: "Medium", hard: "Hard", super: "Super"
    };
    context.minionDangerOptions = {
      "very-easy": "Very Easy", easy: "Easy", medium: "Medium", hard: "Hard", "very-hard": "Very Hard"
    };

    // Bio tab no longer uses rich text editor (plain textareas match maqueta)

    // ---- Progression tab data ----
    try { this._prepareProgressionData(context, system); }
    catch (err) { console.error("DBU-OLD | _prepareProgressionData failed:", err); }

    // ---- Techniques tab data ----
    try { this._prepareTechniquesData(context, system); }
    catch (err) { console.error("DBU-OLD | _prepareTechniquesData failed:", err); }

    // ---- Auras tab data ----
    try { this._prepareAurasData(context, system); }
    catch (err) { console.error("DBU-OLD | _prepareAurasData failed:", err); }

    // ---- Transformations tab data ----
    try { this._prepareTransformationsData(context, system); }
    catch (err) { console.error("DBU-OLD | _prepareTransformationsData failed:", err); }

    // ---- Unique Abilities tab data ----
    try { this._prepareUniqueData(context, system); }
    catch (err) { console.error("DBU-OLD | _prepareUniqueData failed:", err); }

    // ---- Equipment tab data ----
    // equipmentItems already prepared by _prepareItems -> context.equipment

    // ---- Attack Ref tab data ----
    try { this._prepareAttackRefData(context, system); }
    catch (err) { console.error("DBU-OLD | _prepareAttackRefData failed:", err); }

    // ---- Active Effects panel (Main tab) ----
    try {
      this._prepareActiveEffects(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareActiveEffects failed:", err);
    }

    // ---- Combat Rolls summary (Main tab) ----
    try {
      this._prepareCombatRollsData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareCombatRollsData failed:", err);
    }

    // ---- Combat State Summary (Main tab) ----
    try {
      const cs = system.combatStates || {};
      const t = system.tier || 1;
      context.combatStateSummary = [];
      if (cs.raging) context.combatStateSummary.push({ state: "Raging", effect: `+1d4\u00d7${t} Wound, \u2212${t} Defense` });
      if (cs.surging) context.combatStateSummary.push({ state: "Surging", effect: `+1d4\u00d7${t} Strike & Wound (vs target)` });
      if (cs.mindful) context.combatStateSummary.push({ state: "Mindful", effect: `\u22121 Crit Target, \u2212${t} Wound` });
      if (cs.superior) context.combatStateSummary.push({ state: "Superior", effect: `Greater Dice, +${2 * t} Dmg Received` });
      if (cs.undying) context.combatStateSummary.push({ state: "Undying", effect: `\u2212${t} All Combat Rolls` });
      context.hasCombatStateEffects = context.combatStateSummary.length > 0;
    } catch (err) {
      console.error("DBU-OLD | Combat state summary failed:", err);
      context.combatStateSummary = [];
      context.hasCombatStateEffects = false;
    }

    // ---- Active Conditions summary (Main tab) ----
    try {
      const combatConds = this._getCombatConditions(system);
      context.activeConditions = combatConds.filter(c => c.active).map(c => ({
        name: c.name,
        severity: c.stacks > 1 ? "stacked" : "active"
      }));
    } catch (err) {
      console.error("DBU-OLD | Active conditions summary failed:", err);
      context.activeConditions = [];
    }

    // ---- Combat tab data ----
    try {
      this._prepareCombatData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareCombatData failed:", err);
    }

    // Condition options for Attack Ref lookup (needs combatConditions from _prepareCombatData)
    context.conditionOptions = (context.combatConditions || []).map(c => c.name).sort();

    // ---- Racial Bonus display data ----
    try {
      this._prepareRacialBonusData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareRacialBonusData failed:", err);
    }

    // ---- Manifested Power Bonus display data ----
    try {
      this._prepareManifestedPowerData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareManifestedPowerData failed:", err);
    }

    // ---- Talent Bonus display data ----
    try {
      this._prepareTalentBonusData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareTalentBonusData failed:", err);
    }

    // ---- Enhancement Power Bonus display data ----
    try {
      this._prepareEnhancementPowerData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareEnhancementPowerData failed:", err);
    }

    // ---- Alternate Form Bonus display data ----
    try {
      this._prepareAlternateFormData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareAlternateFormData failed:", err);
    }

    // ---- Legendary Form Bonus display data ----
    try {
      this._prepareLegendaryFormData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareLegendaryFormData failed:", err);
    }

    // ---- Fusion tab data ----
    try {
      this._prepareFusionData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareFusionData failed:", err);
    }

    // ---- Adversary tab data ----
    try {
      this._prepareAdversaryData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareAdversaryData failed:", err);
      context.adversaryTraits = [];
      context.adversaryWeaknesses = [];
      context.minionTraitsData = [];
    }

    // ---- Downtime tab data ----
    try {
      this._prepareDowntimeData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareDowntimeData failed:", err);
    }

    // ---- Transformation Customization tab data ----
    try {
      this._prepareTfCustomizationData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareTfCustomizationData failed:", err);
    }

    // ---- Battle Jacket tab data ----
    try {
      this._prepareBattleJacketTabData(context, system);
    } catch (err) {
      console.error("DBU-OLD | _prepareBattleJacketTabData failed:", err);
    }

    // ---- Combat sub-tab state ----
    context.combatTabsState = {
      traitsBonusesTab: system.combatTabState?.traitsBonusesTab || "racial"
    };

    // ---- Tab badge counts ----
    context.tbTabBadges = {
      racial: (context.hasRacialBonuses || context.hasEarthlingBonuses || context.hasMajinBonuses
        || context.hasBioAndroidBonuses || context.hasAndroidBonuses || context.hasArcosianBonuses
        || context.hasCerealianBonuses || context.hasNamekianBonuses || context.hasNekoMajinBonuses
        || context.hasNeoTuffleBonuses || context.hasShadowDragonBonuses || context.hasShinjinBonuses
        || context.hasUndeadBonuses) ? 1 : 0,
      talents: context.talentBonuses?.entries?.length || 0,
      mp: context.manifestedPowerBonuses?.entries?.length || 0,
      ep: context.enhancementPowerBonuses?.entries?.length || 0,
      af: context.alternateFormBonuses?.entries?.length || 0,
      lf: (context.legendaryFormBonuses?.entries?.length || 0)
        + (context.legendaryTraitsCombat?.entries?.length || 0),
      resources: (context.combatResourceGroups || [])
        .reduce((sum, g) => sum + (g.resources?.length || 0), 0)
    };

    return context;
  }

  // -------------------------------------------------------
  // Data Prep: Progression
  // -------------------------------------------------------

  _prepareProgressionData(context, system) {
    const fallbackRows = foundry.utils.deepClone(CONFIG.DBU?.progressionRows || []);
    const rows = (system.progressionRows && system.progressionRows.length > 0)
      ? system.progressionRows
      : fallbackRows;

    const racialSkillRanks = CONFIG.DBU?.racialSkillRanks || {};
    const availableSkills = CONFIG.DBU?.availableSkills || [];

    // Determine if this race has fixed racial attributes (auto-set, no UI row needed)
    const fixedRaces = CONFIG.DBU?.racesWithFixedAttributes || [];
    const isFixedRace = fixedRaces.includes(system.race || "");
    context.isFixedRace = isFixedRace;
    context.showRacialStatsRow = !isFixedRace;

    // Build talent option groups (sorted by category, then by name within each)
    const allTalents = CONFIG.DBU?.talentsCatalog || [];
    const talentsByCategory = {};
    for (const t of allTalents) {
      const cat = t.category || "Other";
      if (!talentsByCategory[cat]) talentsByCategory[cat] = [];
      talentsByCategory[cat].push(t);
    }
    context.talentOptionGroups = Object.entries(talentsByCategory)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cat, talents]) => ({
        category: cat,
        talents: talents.sort((a, b) => a.name.localeCompare(b.name)).map(t => ({ name: t.name }))
      }));
    context.availableSkills = availableSkills;

    // Enrich rows with conditional visibility flags + skill slots (matching MVP behavior)
    const enrichedRows = rows.map((row, idx) => {
      const perk = row.perkType || "";
      const showSkills = perk === "skill_improvement" || perk === "starting_stats";
      const racialSkillCount = perk === "starting_stats" ? (racialSkillRanks[system.race] || 2) : 0;
      const maxSkillSlots = perk === "starting_stats" ? racialSkillCount : 4;

      // Build skill slots array (6 columns, some active, some dim)
      const skillSlots = [0, 1, 2, 3, 4, 5].map(i => ({
        active: showSkills && i < maxSkillSlots,
        value: row[`skill${i}`] || "",
        fieldName: `system.progressionRows.${idx}.skill${i}`
      }));

      // Default TP for Skill Improvement rows per character-creation.txt:
      //   - Base 15 TP per Skill Improvement (line 56)
      //   - PL 1 bonus: +10 TP (line 70-71) → L1 SI defaults to 25
      // Stored value remains null until user edits — display falls back to default.
      const isSkillImprovement = perk === "skill_improvement";
      const isPL1SI = isSkillImprovement && (row.level || 0) === 1;
      const defaultTP = isPL1SI ? 25 : 15;
      const displayTP = (isSkillImprovement && (row.tp == null || row.tp === ""))
        ? defaultTP
        : row.tp;

      return {
        ...row,
        tp: displayTP,
        showAttrs: perk === "attribute_addition" || perk === "starting_stats",
        showTalent: perk === "talent_addition" || perk === "character_perk",
        showTP: perk === "skill_improvement",
        showSkills,
        maxSkillSlots,
        racialSkillCount,
        skillSlots
      };
    });
    context.progressionRows = enrichedRows;

    let totalAttrPoints = 0;
    let totalSkillRanks = 0;
    let totalTP = 0;
    let skillImprovementCount = 0;

    const currentLevel = system.level || 1;
    for (const row of rows) {
      if (row.perkType === "racial_stats") continue; // Racial stats are not progression points
      if ((row.level || 0) > currentLevel) continue; // Skip future-level rows
      for (const key of ["ag", "fo", "te", "sc", "in", "ma", "pe"]) {
        if (row[key] != null) totalAttrPoints += Number(row[key]) || 0;
      }
      // Skill Improvement defaults per character-creation.txt:
      //   PL 1 SI = 15 + 10 bonus = 25 TP, other SIs = 15 TP each
      if (row.perkType === "skill_improvement") {
        const defaultTP = (row.level || 0) === 1 ? 25 : 15;
        totalTP += (row.tp == null || row.tp === "") ? defaultTP : (Number(row.tp) || 0);
        skillImprovementCount++;
      } else if (row.tp != null) {
        totalTP += Number(row.tp) || 0;
      }
      for (let i = 0; i < 6; i++) {
        const val = row[`skill${i}`];
        if (val && String(val).trim()) totalSkillRanks++;
      }
    }

    // Gifted Student: +3 TP per Skill Improvement (retroactive); +6 if SC 8+
    const gsTPPerSI = system.aptitudes?.giftedStudentTPPerSI || 0;
    const giftedStudentTP = gsTPPerSI * skillImprovementCount;

    // Custom buff: +X TP per Skill Improvement (multiplied by SI count)
    const tpPerSIBuff = this.actor._getBuffTotal(system, "TP per Skill Improvement");
    const tpPerSIBuffTotal = tpPerSIBuff * skillImprovementCount;

    context.totalAttrPoints = totalAttrPoints;
    context.totalSkillRanks = totalSkillRanks;
    // L1 SI already includes the 25 TP (15 base + 10 PL1 bonus per character-creation.txt:71)
    context.totalTP = totalTP + giftedStudentTP + tpPerSIBuffTotal;
    // Expose for testability and other consumers
    system.totalTP = context.totalTP;
    system.skillImprovementCount = skillImprovementCount;

    // Perk type options for select
    const perkTypes = CONFIG.DBU?.perkTypes || [];
    const perkTypeOptions = {};
    for (const pt of perkTypes) {
      perkTypeOptions[pt.id] = pt.name;
    }
    context.perkTypeOptions = perkTypeOptions;

    // Progression Preview: single summary row (totals across all rows up to current level)
    // Start with racial bonuses: for fixed races use config, for choice races the racial_stats row contributes
    const racialBonuses = CONFIG.DBU?.racialAttributeBonuses?.[system.race] || {};
    const summary = {
      level: system.level || 1,
      talents: [],
      ag: 1 + (isFixedRace ? (racialBonuses.ag ?? 0) : (system.attributes?.ag?.racial ?? 0)),
      fo: 1 + (isFixedRace ? (racialBonuses.fo ?? 0) : (system.attributes?.fo?.racial ?? 0)),
      te: 1 + (isFixedRace ? (racialBonuses.te ?? 0) : (system.attributes?.te?.racial ?? 0)),
      sc: 1 + (isFixedRace ? (racialBonuses.sc ?? 0) : (system.attributes?.sc?.racial ?? 0)),
      in: 1 + (isFixedRace ? (racialBonuses.in ?? 0) : (system.attributes?.in?.racial ?? 0)),
      ma: 1 + (isFixedRace ? (racialBonuses.ma ?? 0) : (system.attributes?.ma?.racial ?? 0)),
      pe: 1 + (isFixedRace ? (racialBonuses.pe ?? 0) : (system.attributes?.pe?.racial ?? 0)),
      tp: 25,
      skills: []
    };
    for (const row of rows) {
      for (const key of ["ag", "fo", "te", "sc", "in", "ma", "pe"]) {
        summary[key] += Number(row[key]) || 0;
      }
      summary.tp += Number(row.tp) || 0;
      if (row.talent && String(row.talent).trim()) {
        summary.talents.push(row.talent);
      }
      for (let i = 0; i < 6; i++) {
        const val = row[`skill${i}`];
        if (val && String(val).trim()) summary.skills.push(val);
      }
    }
    context.progressionPreview = [{
      level: summary.level,
      talents: summary.talents.join(", ") || "-",
      ag: summary.ag,
      fo: summary.fo,
      te: summary.te,
      sc: summary.sc,
      in: summary.in,
      ma: summary.ma,
      pe: summary.pe,
      tp: summary.tp,
      skillRanks: summary.skills.join(", ") || "-",
      isCurrent: true
    }];
  }

  // -------------------------------------------------------
  // Data Prep: Techniques (TP System)
  // -------------------------------------------------------

  _prepareTechniquesData(context, system) {
    const techniques = system.signatureTechniques || [];
    const config = CONFIG.DBU ?? {};
    const tier = system.tier || 1;
    const foundations = config.techniqueFoundations || {};
    const profileDataMap = config.profileData || {};
    const profileKpCosts = config.profileKpCosts || {};
    const advData = config.techniqueAdvantagesData || {};
    const disadvData = config.techniqueDisadvantagesData || {};

    // Helper: get attribute modifier
    const getAttrMod = (key) => system.attributes?.[key]?.modifier ?? 0;

    // Calculate enriched data for each technique
    const preparedTechniques = techniques.map(t => {
      const tpCost = this._calcTechTPCost(t);

      // Profile data
      const profileInfo = profileDataMap[t.profile] || null;

      // KP Cost: profile base KP + ceil(TP/5)
      const profileBaseKP = profileKpCosts[t.profile] || 0;
      const kpCost = profileBaseKP + Math.ceil(tpCost / 5);

      // KP Reduction: sum of absolute disadvantage TP costs
      let kpReduction = 0;
      for (const dis of (t.disadvantages || [])) {
        const tc = dis.tpCost || 0;
        if (tc < 0) kpReduction += Math.abs(tc);
      }

      // Dynamic Ki: sum of all dynamicTP values
      let dynamicKi = 0;
      for (const adv of (t.advantages || [])) dynamicKi += (adv.dynamicTP || 0);
      for (const dis of (t.disadvantages || [])) dynamicKi += (dis.dynamicTP || 0);

      // Final KP (reduce by KP Reduction from disadvantages, floor at half profile base)
      const finalKP = Math.max(Math.ceil(profileBaseKP / 2), kpCost - kpReduction);

      // Available profiles for selected foundation
      const availableProfiles = foundations[t.foundation] || Object.keys(profileDataMap);

      // Enrich advantages with requirement field
      const enrichedAdvantages = (t.advantages || []).map(adv => ({
        ...adv,
        requirement: advData[adv.name]?.requirement || ""
      }));

      // Enrich disadvantages with requirement field
      const enrichedDisadvantages = (t.disadvantages || []).map(dis => ({
        ...dis,
        requirement: disadvData[dis.name]?.requirement || ""
      }));

      // Strike formula
      const strikeInfo = this._calcTechStrike(t, system, tier);
      // Wound formula
      const woundInfo = this._calcTechWound(t, system, tier);
      // CT info
      const ctInfo = this._calcTechCT(t, system);

      return {
        ...t,
        tpCost,
        kpCost,
        kpReduction,
        dynamicKi,
        finalKP,
        maintenanceKP: Math.ceil(finalKP / 2),
        profileBaseKP,
        profileInfo,
        availableProfiles,
        advantages: enrichedAdvantages,
        disadvantages: enrichedDisadvantages,
        strikeFormula: strikeInfo.formula,
        strikeCT: ctInfo.strikeCT,
        woundFormula: woundInfo.formula,
        woundCT: ctInfo.woundCT,
        dodgeCT: ctInfo.dodgeCT,
        damageCat: woundInfo.damageCat,
        ctNotes: ctInfo.notes
      };
    });
    context.signatureTechniques = preparedTechniques;

    // TP Summary (shared pool) — base 25 + accumulated progression TP + Gifted Student
    const progRows = system.progressionRows || CONFIG.DBU?.progressionRows || [];
    const currentLevel = system.level || 1;
    let tpFromProgression = 0;
    let siCount = 0;
    for (const row of progRows) {
      if ((row.level || 0) <= currentLevel) {
        if (row.tp != null) tpFromProgression += Number(row.tp) || 0;
        if (row.perkType === "skill_improvement") siCount++;
      }
    }
    const gsTPBonus = (system.aptitudes?.giftedStudentTPPerSI || 0) * siCount;
    const tpTotal = 25 + tpFromProgression + gsTPBonus;
    const tpSpentSignatures = preparedTechniques.reduce((sum, t) => sum + t.tpCost, 0);
    const tpSpentAuras = this._calcAurasTotalTP(system);
    const tpSpentUnique = this._calcUniqueTotalTP(system);

    context.tpTotal = tpTotal;
    context.tpSpentSignatures = tpSpentSignatures;
    context.tpSpentAuras = tpSpentAuras;
    context.tpSpentUnique = tpSpentUnique;
    context.tpRemaining = tpTotal - tpSpentSignatures - tpSpentAuras - tpSpentUnique;

    // --- One-Sided Fusion: append gained techniques from suppressed actor(s) ---
    const fusion = system.fusion || {};
    if (fusion.isFusion && (fusion.type === "one-sided-absorption" || fusion.type === "one-sided-possession")
        && !this.actor._blockGainedAbilities(system)) {
      const suppIds = fusion.suppressedCharacterIds || [];
      for (const suppId of suppIds) {
        const suppActor = game.actors?.get(suppId);
        if (!suppActor) continue;
        const suppSys = suppActor.system || {};
        const suppTechs = suppSys.signatureTechniques || [];
        for (const st of suppTechs) {
          const cloned = foundry.utils.deepClone(st);
          const tpCost = this._calcTechTPCost(cloned);
          const profileInfo = profileDataMap[cloned.profile] || null;
          const profileBaseKP = profileKpCosts[cloned.profile] || 0;
          const kpCost = profileBaseKP + Math.ceil(tpCost / 5);
          let kpReduction = 0;
          for (const dis of (cloned.disadvantages || [])) {
            const tc = dis.tpCost || 0;
            if (tc < 0) kpReduction += Math.abs(tc);
          }
          let dynamicKi = 0;
          for (const adv of (cloned.advantages || [])) dynamicKi += (adv.dynamicTP || 0);
          for (const dis of (cloned.disadvantages || [])) dynamicKi += (dis.dynamicTP || 0);
          const finalKP = Math.max(Math.ceil(profileBaseKP / 2), kpCost - kpReduction);
          const availableProfiles = foundations[cloned.foundation] || Object.keys(profileDataMap);
          const enrichedAdvantages = (cloned.advantages || []).map(adv => ({
            ...adv, requirement: advData[adv.name]?.requirement || ""
          }));
          const enrichedDisadvantages = (cloned.disadvantages || []).map(dis => ({
            ...dis, requirement: disadvData[dis.name]?.requirement || ""
          }));
          const strikeInfo = this._calcTechStrike(cloned, system, tier);
          const woundInfo = this._calcTechWound(cloned, system, tier);
          const ctInfo = this._calcTechCT(cloned, system);
          preparedTechniques.push({
            ...cloned,
            isGained: true,
            gainedFrom: suppActor.name,
            tpCost, kpCost, kpReduction, dynamicKi, finalKP,
            maintenanceKP: Math.ceil(finalKP / 2),
            profileBaseKP, profileInfo, availableProfiles,
            advantages: enrichedAdvantages,
            disadvantages: enrichedDisadvantages,
            strikeFormula: strikeInfo.formula, strikeCT: ctInfo.strikeCT,
            woundFormula: woundInfo.formula, woundCT: ctInfo.woundCT,
            dodgeCT: ctInfo.dodgeCT, damageCat: woundInfo.damageCat,
            ctNotes: ctInfo.notes
          });
        }
      }
    }

    // --- Battle Jacket Piloting: append gained techniques from jacket ---
    if (system.isPiloting && system._pilotedJacket) {
      const bjTechs = system._pilotedJacket.signatureTechniques || [];
      for (const st of bjTechs) {
        const cloned = foundry.utils.deepClone(st);
        preparedTechniques.push({
          ...cloned,
          isGained: true,
          gainedFrom: system._pilotedJacket.name,
          gainedSource: "battleJacket"
        });
      }
    }

    // --- Evil Aura: append gained techniques when transformation active + evilTechsActive ---
    const evilAuraActive = (system.transformations || []).some(
      t => t.active && t.catalogKey === "evil_aura"
    );
    const evilTechsToggled = !!system.transformationMeta?.evilTechsActive;
    if (evilAuraActive && evilTechsToggled) {
      const evilCatalog = CONFIG.DBU?.evilAuraTechniques || [];
      for (const st of evilCatalog) {
        const cloned = foundry.utils.deepClone(st);
        const tpCost = this._calcTechTPCost(cloned);
        const profileInfo = profileDataMap[cloned.profile] || null;
        const profileBaseKP = profileKpCosts[cloned.profile] || 0;
        const kpCost = profileBaseKP + Math.ceil(tpCost / 5);
        let kpReduction = 0;
        for (const dis of (cloned.disadvantages || [])) {
          const tc = dis.tpCost || 0;
          if (tc < 0) kpReduction += Math.abs(tc);
        }
        let dynamicKi = 0;
        for (const adv of (cloned.advantages || [])) dynamicKi += (adv.dynamicTP || 0);
        for (const dis of (cloned.disadvantages || [])) dynamicKi += (dis.dynamicTP || 0);
        const baseFinalKP = Math.max(Math.ceil(profileBaseKP / 2), kpCost - kpReduction);
        // Rule: "Reduce their Ki Point Cost by 1/2."
        const finalKP = Math.ceil(baseFinalKP / 2);
        const availableProfiles = foundations[cloned.foundation] || Object.keys(profileDataMap);
        const enrichedAdvantages = (cloned.advantages || []).map(adv => ({
          ...adv, requirement: advData[adv.name]?.requirement || ""
        }));
        const enrichedDisadvantages = (cloned.disadvantages || []).map(dis => ({
          ...dis, requirement: disadvData[dis.name]?.requirement || ""
        }));
        const strikeInfo = this._calcTechStrike(cloned, system, tier);
        const woundInfo  = this._calcTechWound(cloned, system, tier);
        const ctInfo     = this._calcTechCT(cloned, system);
        preparedTechniques.push({
          ...cloned,
          isGained: true,
          gainedFrom: "Evil Aura",
          gainedSource: "evil_aura",
          tpCost, kpCost, kpReduction, dynamicKi, finalKP,
          maintenanceKP: Math.ceil(finalKP / 2),
          profileBaseKP, profileInfo, availableProfiles,
          advantages: enrichedAdvantages,
          disadvantages: enrichedDisadvantages,
          strikeFormula: strikeInfo.formula, strikeCT: ctInfo.strikeCT,
          woundFormula: woundInfo.formula, woundCT: ctInfo.woundCT,
          dodgeCT: ctInfo.dodgeCT, damageCat: woundInfo.damageCat,
          ctNotes: ctInfo.notes
        });
      }
    }

    // Options for technique dropdowns
    context.techniqueTypeOptions = {
      signature: "Signature", super: "Super", ultimate: "Ultimate"
    };
    context.foundationOptions = {
      Physical: "Physical", Energy: "Energy", Magic: "Magic"
    };

    // Profile options (all, for fallback): sorted profile names
    context.profileOptions = Object.keys(profileDataMap).sort();

    // Advantage/disadvantage names
    context.advantageOptions = Object.keys(advData).sort();
    context.disadvantageOptions = Object.keys(disadvData).sort();
  }

  _calcTechTPCost(tech) {
    // Base: 8 TP for all Signature Techniques
    let total = 8;
    // +4 TP if Ultimate
    if (tech.type === "ultimate") total += 4;
    // Sum advantages TP (positive)
    for (const adv of (tech.advantages || [])) total += (adv.tpCost || 0);
    // Sum disadvantages TP (negative - reduces cost)
    for (const disadv of (tech.disadvantages || [])) total += (disadv.tpCost || 0);
    // Subtract free TP
    total -= (tech.freeTP || 0);
    // Minimum TP is 8
    return Math.max(8, total);
  }

  _calcTechStrike(tech, system, tier) {
    let haste = system.aptitudes?.haste ?? 0;
    let awareness = system.aptitudes?.awareness ?? 0;

    // Cutting: "1/2 (rounded up) of your Haste and 3/4 of your Awareness" to Strike Roll (attacking.txt)
    if (tech.profile === "Cutting") {
      haste = Math.ceil(haste / 2);
      awareness = Math.floor(awareness * 3 / 4);
    }

    // Accurate bonus
    let accurateBonus = 0;
    for (const adv of (tech.advantages || [])) {
      if (adv.name === "Accurate") accurateBonus += (adv.ranks || 1) * tier;
    }
    // Inaccurate penalty
    let inaccuratePenalty = 0;
    for (const dis of (tech.disadvantages || [])) {
      if (dis.name === "Inaccurate") inaccuratePenalty += (dis.ranks || 1) * tier;
    }

    // Super Stack Strike penalty
    const ssPenStrike = system.aptitudes?.superStackStrikePenalty ?? 0;
    // Unified strike buff total (talents, states, maneuvers, custom buffs)
    const strikeBuffTotal = system.aptitudes?.strikeBuffTotal ?? 0;
    let totalMod = haste + awareness + accurateBonus - inaccuratePenalty - ssPenStrike + strikeBuffTotal;
    const baseTier = system.baseTier || 1;

    // Aura combat roll bonus (Sparking type)
    const activeAura = this.actor._getActiveAura(system);
    if (activeAura && activeAura.type === "Sparking") {
      totalMod += tier;
    }
    // Shaken condition: -2(T)
    const shakenStacks = this._getConditionStacks(system, "shaken");
    if (shakenStacks > 0) {
      totalMod -= 2 * tier;
    }
    // Diminishing Offense: -bT per stack
    const dimOff = system.tracking?.diminishingOffense || 0;
    if (dimOff > 0) {
      totalMod -= dimOff * baseTier;
    }
    // Equipment combat penalty
    const eqPenalty = system.equipment?.combatPenalty || 0;
    if (eqPenalty > 0) {
      totalMod -= eqPenalty;
    }

    const combatStates = system.combatStates || {};
    const isImpediment = (system.conditions || []).some(c => c.id === "impediment" && c.active);
    const dp = system.dicePools || {};
    const topCat = dp.topCatBonus || {};
    const grCat = dp.greaterCatBonus || {};
    const grApply = dp.greaterApplyCount || {};
    const topCatBonus = (topCat.global || 0) + (topCat.strike || 0);
    const topDice = this._resolveExtraDice(tier, 0, topCatBonus);
    const hasGreater = !isImpediment && (combatStates.superior || (grApply.global || 0) > 0 || (grApply.strike || 0) > 0);
    const grCatBonus = (grCat.global || 0) + (grCat.strike || 0);
    const greaterDice = hasGreater ? this._resolveExtraDice(tier, 1, grCatBonus) : "";
    const formula = this._buildFormula(topDice, greaterDice, totalMod);

    return { formula };
  }

  _calcTechWound(tech, system, tier) {
    const config = CONFIG.DBU ?? {};
    const getAttrTotal = (key) => system.attributes?.[key]?.totalScore ?? 0;
    const profileInfo = config.profileData?.[tech.profile] || {};

    // Damage attribute: Physical/Energy → Force Modifier, Magic → Magic Modifier
    let damageAttr = tech.foundation === "Magic" ? getAttrTotal("ma") : getAttrTotal("fo");
    // Crushing: "Reduce the bonus to your Wound Roll from your Force by 1/2" (attacking.txt)
    if (tech.profile === "Crushing") damageAttr = Math.floor(damageAttr / 2);
    // Powered: double damage attribute
    let extraDamageAttr = tech.profile === "Powered" ? damageAttr : 0;

    // Power Shot bonus
    let powerShotBonus = 0;
    for (const adv of (tech.advantages || [])) {
      if (adv.name === "Power Shot") powerShotBonus += (adv.ranks || 1) * 2 * tier;
    }
    // Low Penetration penalty
    let lowPenPenalty = 0;
    for (const dis of (tech.disadvantages || [])) {
      if (dis.name === "Low Penetration") lowPenPenalty += (dis.ranks || 1) * tier;
    }

    const charges = (tech.baseEnergyCharges || 0) + (tech.extraEnergyCharges || 0);
    // Unified wound buff total (talents, states, maneuvers, custom buffs)
    const woundBuffTotal = system.aptitudes?.woundBuffTotal ?? 0;
    let totalMod = damageAttr + extraDamageAttr + powerShotBonus - lowPenPenalty + woundBuffTotal;

    // Aura wound bonus (Powerful Aura advantage)
    const activeAura = this.actor._getActiveAura(system);
    if (activeAura) {
      for (const adv of (activeAura.advantages || [])) {
        if (adv.name === "Powerful Aura") {
          const powerStacks = system.tracking?.powerStacks || 0;
          totalMod += ((adv.ranks || 1) + powerStacks) * tier;
        }
      }
    }

    const combatStates = system.combatStates || {};
    const isImpediment = (system.conditions || []).some(c => c.id === "impediment" && c.active);
    const dp = system.dicePools || {};
    const topCat = dp.topCatBonus || {};
    const grCat = dp.greaterCatBonus || {};
    const grApply = dp.greaterApplyCount || {};
    const topCatBonus = (topCat.global || 0) + (topCat.wound || 0);
    const topDice = this._resolveExtraDice(tier, 0, topCatBonus);
    const hasGreater = !isImpediment && (combatStates.superior || (grApply.global || 0) > 0 || (grApply.wound || 0) > 0);
    const grCatBonus = (grCat.global || 0) + (grCat.wound || 0);
    const greaterDice = hasGreater ? this._resolveExtraDice(tier, 1, grCatBonus) : "";
    // Sig Techs use d8 for energy charges: "1d8(T) if that Attacking Maneuver is a
    // Signature Technique" (attacking.txt)
    let chargesExtra = charges > 0 ? `+${charges * tier}d8` : "";
    if (tech.profile === "Mega Flare" && charges > 0) chargesExtra += `+${charges * tier}`;
    // Super Stack wound extra dice (Physical/Energy foundations only)
    const ssWoundDice = (tech.foundation === "Physical" || tech.foundation === "Energy")
      ? (system.aptitudes?.superStackWoundDice || "") : "";
    const ssExtra = ssWoundDice ? `+${ssWoundDice}` : "";
    const formula = this._buildFormula(topDice, greaterDice, totalMod, chargesExtra + ssExtra);

    let damageCat = profileInfo.damageCat || "Standard";
    if (tech.profile === "Mega Flare" && charges >= 7) damageCat = "Direct";

    return { formula, damageCat };
  }

  _getConditionStacks(system, id) {
    const c = (system.conditions || []).find(c => c.id === id);
    return (c && c.active) ? (c.stacks || 1) : 0;
  }

  _calcTechCT(tech, system) {
    let strikeCT = 10, woundCT = 10, dodgeCT = 10;
    const notes = [];
    const talents = system.talents || [];

    if (talents.includes("focused_strike")) strikeCT -= 1;
    if (talents.includes("powerful_strike")) woundCT -= 1;
    if (talents.includes("instinctual_evasion")) dodgeCT -= 1;

    if (talents.includes("precision_kata")) notes.push("Precision Kata: Strike CT -1 (Focused only)");
    if (talents.includes("brutal_kata")) notes.push("Brutal Kata: Wound CT -1 (Focused only)");
    if (talents.includes("critical_specialist")) {
      if (tech.isWeapon) {
        strikeCT -= 1;
      } else {
        notes.push("Critical Specialist: Strike CT -1 (Armed Attacks only)");
      }
    }
    if (talents.includes("artful_strike")) notes.push("Artful Strike: 1 below CT = Critical (Strike, 1/Rnd)");
    // Note: "1 below CT = Critical (Wound)" is handled by Aggressive/Defensive Style triggered effects

    if (tech.profile === "Cutting") {
      woundCT = 5;
      notes.push("Cutting: Wound CT set to 5");
    }

    return { strikeCT, woundCT, dodgeCT, notes };
  }

  // -------------------------------------------------------
  // Data Prep: Auras (TP System)
  // -------------------------------------------------------

  _prepareAurasData(context, system) {
    const auras = system.signatureAuras || [];
    const config = CONFIG.DBU ?? {};
    const tier = system.tier || 1;
    const advData = config.auraAdvantagesData || {};
    const disadvData = config.auraDisadvantagesData || {};

    const preparedAuras = auras.map(a => {
      const tpCost = this._calcAuraTPCost(a);
      const calculatedKP = this._calcAuraKPCharge(a, tpCost);
      const efficiency = this._calcAuraEfficiency(a, tier);

      const auraTypeData = config.auraTypes?.[a.type] || { kpCost: 6, effect: "" };
      const baseKP = auraTypeData.kpCost;
      const minKP = Math.ceil(baseKP / 2);
      const finalKP = Math.max(minKP, calculatedKP - efficiency);
      const maintenanceKP = Math.ceil(finalKP / 2);

      // KP reduction from disadvantages (display purposes)
      let kpReduction = 0;
      for (const dis of (a.disadvantages || [])) {
        const tc = dis.tpCost || 0;
        if (tc < 0) kpReduction += Math.abs(tc);
      }

      // Dynamic Ki from all adv/disadv
      let dynamicKi = 0;
      for (const adv of (a.advantages || [])) dynamicKi += (adv.dynamicTP || 0);
      for (const dis of (a.disadvantages || [])) dynamicKi += (dis.dynamicTP || 0);

      // Enriched advantages with requirement field
      const enrichedAdvantages = (a.advantages || []).map(adv => ({
        ...adv,
        requirement: advData[adv.name]?.requirement || ""
      }));

      // Enriched disadvantages with requirement field
      const enrichedDisadvantages = (a.disadvantages || []).map(dis => ({
        ...dis,
        requirement: disadvData[dis.name]?.requirement || ""
      }));

      return {
        ...a,
        tpCost,
        calculatedKP,
        baseKP,
        efficiency,
        finalKP,
        maintenanceKP,
        kpReduction,
        dynamicKi,
        auraTypeEffect: auraTypeData.effect || "",
        advantages: enrichedAdvantages,
        disadvantages: enrichedDisadvantages
      };
    });
    context.signatureAuras = preparedAuras;

    // --- One-Sided Fusion: append gained auras from suppressed actor(s) ---
    const fusion = system.fusion || {};
    const activeGainedAuraId = fusion.activeGainedAuraId || "";
    if (fusion.isFusion && (fusion.type === "one-sided-absorption" || fusion.type === "one-sided-possession")
        && !this.actor._blockGainedAbilities(system)) {
      const suppIds = fusion.suppressedCharacterIds || [];
      for (const suppId of suppIds) {
        const suppActor = game.actors?.get(suppId);
        if (!suppActor) continue;
        const suppSys = suppActor.system || {};
        const suppAuras = suppSys.signatureAuras || [];
        for (const sa of suppAuras) {
          const cloned = foundry.utils.deepClone(sa);
          const tpCost = this._calcAuraTPCost(cloned);
          const calculatedKP = this._calcAuraKPCharge(cloned, tpCost);
          const efficiency = this._calcAuraEfficiency(cloned, tier);
          const auraTypeData = config.auraTypes?.[cloned.type] || { kpCost: 6, effect: "" };
          const baseKP = auraTypeData.kpCost;
          const minKP = Math.ceil(baseKP / 2);
          const finalKP = Math.max(minKP, calculatedKP - efficiency);
          const maintenanceKP = Math.ceil(finalKP / 2);
          let kpReduction = 0;
          for (const dis of (cloned.disadvantages || [])) {
            const tc = dis.tpCost || 0;
            if (tc < 0) kpReduction += Math.abs(tc);
          }
          let dynamicKi = 0;
          for (const adv of (cloned.advantages || [])) dynamicKi += (adv.dynamicTP || 0);
          for (const dis of (cloned.disadvantages || [])) dynamicKi += (dis.dynamicTP || 0);
          const enrichedAdvantages = (cloned.advantages || []).map(adv => ({
            ...adv, requirement: advData[adv.name]?.requirement || ""
          }));
          const enrichedDisadvantages = (cloned.disadvantages || []).map(dis => ({
            ...dis, requirement: disadvData[dis.name]?.requirement || ""
          }));
          // Gained aura active state is tracked via fusion.activeGainedAuraId
          const gainedAuraKey = `${suppId}_${cloned.id}`;
          preparedAuras.push({
            ...cloned,
            active: activeGainedAuraId === gainedAuraKey,
            isGained: true,
            gainedFrom: suppActor.name,
            gainedAuraKey,
            tpCost, calculatedKP, baseKP, efficiency, finalKP, maintenanceKP,
            kpReduction, dynamicKi,
            auraTypeEffect: auraTypeData.effect || "",
            advantages: enrichedAdvantages,
            disadvantages: enrichedDisadvantages
          });
        }
      }
    }

    // --- Battle Jacket Piloting: append gained auras from jacket ---
    if (system.isPiloting && system._pilotedJacket) {
      const bjAuras = system._pilotedJacket.signatureAuras || [];
      for (const sa of bjAuras) {
        const cloned = foundry.utils.deepClone(sa);
        preparedAuras.push({
          ...cloned,
          isGained: true,
          gainedFrom: system._pilotedJacket.name,
          gainedSource: "battleJacket"
        });
      }
    }

    // Identified active aura for header display
    context.activeAura = preparedAuras.find(a => a.active) || null;
    context.activeAuraEffects = this._getActiveAuraEffects(context.activeAura);

    // Aura type options
    const auraTypeOptions = {};
    for (const [key, data] of Object.entries(config.auraTypes || {})) {
      auraTypeOptions[key] = key;
    }
    context.auraTypeOptions = auraTypeOptions;

    // Aura advantage/disadvantage names
    context.auraAdvantageOptions = Object.keys(advData).sort();
    context.auraDisadvantageOptions = Object.keys(disadvData).sort();

    // Lookup options for Attack Ref tab
    context.techAdvantageOptions = Object.keys(config.techniqueAdvantagesData || {}).sort();
    context.techDisadvantageOptions = Object.keys(config.techniqueDisadvantagesData || {}).sort();
  }

  _getActiveAuraEffects(activeAura) {
    if (!activeAura) return [];
    const effects = [];

    for (const adv of (activeAura.advantages || [])) {
      const rankLabel = (adv.ranks && adv.ranks > 1) ? ` (x${adv.ranks})` : "";
      const noteLabel = adv.notes ? `: ${adv.notes}` : "";
      effects.push({ type: "advantage", name: `${adv.name}${rankLabel}${noteLabel}` });
    }

    for (const dis of (activeAura.disadvantages || [])) {
      const rankLabel = (dis.ranks && dis.ranks > 1) ? ` (x${dis.ranks})` : "";
      const noteLabel = dis.notes ? `: ${dis.notes}` : "";
      effects.push({ type: "disadvantage", name: `${dis.name}${rankLabel}${noteLabel}` });
    }

    return effects;
  }

  _calcAuraKPCharge(aura, tpCost) {
    const config = CONFIG.DBU ?? {};
    const auraTypeData = config.auraTypes?.[aura.type] || { kpCost: 6 };
    const baseKP = auraTypeData.kpCost;
    const tpModifier = Math.ceil(tpCost / 5);
    return baseKP + tpModifier;
  }

  _calcAuraEfficiency(aura, tier) {
    let efficiency = 0;
    for (const adv of (aura.advantages || [])) {
      if (adv.name === "Efficiency") efficiency += (adv.ranks || 1) * 4;
    }
    for (const dis of (aura.disadvantages || [])) {
      if (dis.name === "Inefficiency") efficiency -= (dis.ranks || 1) * 4;
    }
    return efficiency;
  }

  _calcAuraTPCost(aura) {
    let total = 15; // Base TP for auras
    for (const adv of (aura.advantages || [])) total += (adv.tpCost || 0);
    for (const disadv of (aura.disadvantages || [])) total += (disadv.tpCost || 0);
    total -= (aura.freeTP || 0);
    return Math.max(10, total); // Minimum 10 TP
  }

  _calcAurasTotalTP(system) {
    const auras = system.signatureAuras || [];
    return auras.reduce((sum, a) => sum + this._calcAuraTPCost(a), 0);
  }

  // -------------------------------------------------------
  // Data Prep: Transformations
  // -------------------------------------------------------

  _prepareTransformationsData(context, system) {
    const transformations = system.transformations || [];
    const config = CONFIG.DBU ?? {};
    const catalog = config.transformationsCatalog || {};

    // Build type name lookup
    const typeMap = {};
    for (const tt of (config.transformationTypes || [])) {
      typeMap[tt.id] = tt.name;
    }

    // Enrich each transformation with catalog data and original index
    const standard = [];
    const legendary = [];
    const active = [];

    transformations.forEach((t, i) => {
      const catEntry = t.catalogKey ? catalog[t.catalogKey] : null;
      const structuredTraits = t.structuredTraits?.length > 0
        ? t.structuredTraits
        : (catEntry?.traitGroups ? JSON.parse(JSON.stringify(catEntry.traitGroups)) : []);
      const effectCount = structuredTraits.reduce((n, g) => n + (g.effects ? g.effects.length : 0), 0);
      // Resolve aspects: prefer stored, fallback to catalog
      const aspects = (t.aspects && t.aspects.length > 0) ? t.aspects : (catEntry?.aspects || []);
      const entry = {
        ...t,
        transIndex: i,
        hasCatalog: !!catEntry,
        catEntry,
        effectCount,
        hasStructuredTraits: effectCount > 0,
        typeName: typeMap[t.transformationType] || t.transformationType,
        aspects
      };

      // Add mastery display data
      if (t.mastered && t.catalogKey) {
        const masteryCat = CONFIG.DBU?.masteryEffectsCatalog ?? {};
        const mastery = masteryCat[t.catalogKey];
        if (mastery) {
          entry.masteryData = {
            name: mastery.name,
            attrBonusEntries: Object.entries(mastery.attrBonuses || {}).map(([attr, value]) => ({
              attr: attr.toUpperCase(),
              value
            })),
            aspectsToRemove: mastery.aspectsToRemove || [],
            aspectsToAdd: mastery.aspectsToAdd || [],
            hasAutoEffects: !!(
              Object.keys(mastery.attrBonuses || {}).length ||
              mastery.aspectsToRemove?.length ||
              mastery.aspectsToAdd?.length ||
              mastery.conditionals?.length
            ),
            conditionals: (mastery.conditionals || []).map(c => ({
              ...c,
              active: t.active
            })),
            narrative: mastery.narrative || []
          };
        }
      }

      if (t.isLegendary) legendary.push(entry);
      else standard.push(entry);
      if (t.active) active.push(entry);
    });

    // ---- Gained transformations from suppressed actors (OSF) ----
    const fusion = system.fusion || {};
    const gainedTransFoMaBonuses = []; // track +1(T) FO/MA alternatives
    if (fusion.isFusion && (fusion.type === "one-sided-absorption" || fusion.type === "one-sided-possession")
        && !this.actor._blockGainedAbilities(system)) {
      const suppIds = fusion.suppressedCharacterIds || [];
      const activeGainedIds = fusion.activeGainedTransformationIds || [];
      const isPossession = fusion.type === "one-sided-possession";
      const dominantRace = isPossession ? (fusion._possessionRace || system.race) : system.race;
      // Collect own transformation keys for dedup
      const ownTransKeys = new Set();
      for (const t of transformations) {
        if (t.catalogKey) ownTransKeys.add(t.catalogKey);
        else if (t.name) ownTransKeys.add(t.name.toLowerCase());
      }
      const gainedTransKeys = new Set(); // dedup across multiple suppressed

      for (const suppId of suppIds) {
        const suppActor = game.actors?.get(suppId);
        if (!suppActor) continue;
        const suppTransformations = suppActor.system?.transformations || [];

        for (const st of suppTransformations) {
          // Dedup key: catalogKey or name
          const dedupKey = st.catalogKey || (st.name || "").toLowerCase();
          if (!dedupKey) continue;

          // Already gained from another suppressed?
          if (gainedTransKeys.has(dedupKey)) continue;

          // Already owned by dominant?
          const alreadyOwned = ownTransKeys.has(dedupKey);

          // Racial eligibility (Possession: always eligible; Absorption: check catalog)
          let raciallyEligible = true;
          if (!isPossession && st.catalogKey) {
            const catEntry = catalog[st.catalogKey];
            if (catEntry) {
              raciallyEligible = this._meetsRacialRequirement(dominantRace, catEntry.racialRequirement);
            }
          }

          if (raciallyEligible && !alreadyOwned) {
            // ELIGIBLE: clone and add as gained
            gainedTransKeys.add(dedupKey);
            const gainedKey = `${suppId}_${st.id}`;
            const isActive = activeGainedIds.includes(gainedKey);
            const catEntry = st.catalogKey ? catalog[st.catalogKey] : null;
            const sTraits = st.structuredTraits?.length > 0
              ? st.structuredTraits
              : (catEntry?.traitGroups ? JSON.parse(JSON.stringify(catEntry.traitGroups)) : []);
            const effectCount = sTraits.reduce((n, g) => n + (g.effects ? g.effects.length : 0), 0);
            const aspects = (st.aspects && st.aspects.length > 0) ? st.aspects : (catEntry?.aspects || []);

            const gainedEntry = {
              ...foundry.utils.deepClone(st),
              transIndex: -1,
              gainedKey,
              isGained: true,
              gainedFrom: suppActor.name,
              active: isActive,
              hasCatalog: !!catEntry,
              catEntry,
              effectCount,
              hasStructuredTraits: effectCount > 0,
              typeName: typeMap[st.transformationType] || st.transformationType,
              aspects
            };

            // Add mastery display data if mastered
            if (st.mastered && st.catalogKey) {
              const masteryCat = CONFIG.DBU?.masteryEffectsCatalog ?? {};
              const mastery = masteryCat[st.catalogKey];
              if (mastery) {
                gainedEntry.masteryData = {
                  name: mastery.name,
                  attrBonusEntries: Object.entries(mastery.attrBonuses || {}).map(([attr, value]) => ({
                    attr: attr.toUpperCase(), value
                  })),
                  aspectsToRemove: mastery.aspectsToRemove || [],
                  aspectsToAdd: mastery.aspectsToAdd || [],
                  hasAutoEffects: !!(
                    Object.keys(mastery.attrBonuses || {}).length ||
                    mastery.aspectsToRemove?.length ||
                    mastery.aspectsToAdd?.length ||
                    mastery.conditionals?.length
                  ),
                  conditionals: (mastery.conditionals || []).map(c => ({ ...c, active: isActive })),
                  narrative: mastery.narrative || []
                };
              }
            }

            if (st.isLegendary) legendary.push(gainedEntry);
            else standard.push(gainedEntry);
            if (isActive) active.push(gainedEntry);
          } else {
            // NOT ELIGIBLE or ALREADY OWNED: +1(T) FO/MA to first own same-type
            gainedTransKeys.add(dedupKey); // mark as seen for dedup
            gainedTransFoMaBonuses.push({
              fromName: suppActor.name,
              transName: st.name,
              transformationType: st.transformationType
            });
          }
        }
      }
    }

    // Apply +1(T) FO/MA badge indicators to own transformations
    for (const bonus of gainedTransFoMaBonuses) {
      const target = standard.concat(legendary).find(
        t => !t.isGained && t.transformationType === bonus.transformationType
      );
      if (target) {
        if (!target.gainedFoMaBonuses) target.gainedFoMaBonuses = [];
        target.gainedFoMaBonuses.push({ fromName: bonus.fromName, transName: bonus.transName });
      }
    }

    // Unified list: standard first, then legendary
    context.allTransformations = [...standard, ...legendary];
    context.activeTransformations = active;

    // Stress bonus pre-computed by actor.mjs (base + all racial automation + finalizers)
    context.stressBonus = system.aptitudes?.stressBonus || 0;

    // Aspect effects computed by actor.mjs
    context.aspectEffects = system.aspectEffects || {};

    // Transformation rules computed by actor.mjs
    context.transformationRules = system.transformationRules || {};
    context.transformationMeta = system.transformationMeta || {};

    // Mastery effects from actor calculation
    context.masteryEffects = system.masteryEffects || {};

    // Legendary Trait bonuses (permanent, always active)
    context.legendaryTraitBonuses = system.legendaryTraitBonuses || { entries: [], hasBonuses: false, totals: {} };

    // Build legendary trait selection options for forms with multiple choices
    const legendaryTraitOptions = {};
    const ltCatalog = CONFIG.DBU?.transformationsCatalog || {};
    for (const trans of (system.transformations || [])) {
      const catEntry = trans.catalogKey ? ltCatalog[trans.catalogKey] : null;
      if (!catEntry?.legendaryTraitGroup) continue;
      if (Array.isArray(catEntry.legendaryTraitGroup) && catEntry.legendaryTraitGroup.length > 1) {
        legendaryTraitOptions[trans.catalogKey] = {
          name: trans.name,
          options: catEntry.legendaryTraitGroup,
          selected: (system.transformationMeta?.legendaryTraitSelections || {})[trans.catalogKey] || catEntry.legendaryTraitGroup[0]
        };
      }
    }
    context.legendaryTraitOptions = legendaryTraitOptions;

    // Transformation type options
    const transformationTypeOptions = {};
    for (const tt of (config.transformationTypes || [])) {
      transformationTypeOptions[tt.id] = tt.name;
    }
    context.transformationTypeOptions = transformationTypeOptions;

    // Catalog categories for filter
    context.transformationCategories = config.transformationCategories || [];

    // ---- Token Album data ----
    const album = system.tokenAlbum || [];
    const activeAlbumImage = this.actor.getFlag("DBU-MRR-OLD", "activeAlbumImage") || "";
    context.tokenAlbumEntries = album.map((entry, i) => ({
      name: entry.name || "",
      image: entry.image || "",
      isActive: !!(entry.image && entry.image === activeAlbumImage)
    }));
    context.hasActiveAlbumToken = !!activeAlbumImage;
  }

  // -------------------------------------------------------
  // Data Prep: Unique Abilities
  // -------------------------------------------------------

  _prepareUniqueData(context, system) {
    const uniques = system.uniqueAbilities || [];
    const catalog = CONFIG.DBU?.uniqueAbilitiesCatalog || {};

    const prepared = uniques.map((ua, index) => {
      const data = catalog[ua.abilityKey] || { name: ua.abilityKey, tpCost: 0, advancements: [], restrictions: [] };

      // Calculate TP cost for this unique
      const tpCost = this._calcUniqueTPCost(ua, data);

      // Prepare selected advancements with resolved data
      // Collect locked advancement names from selected restrictions
      const lockedAdvNames = [];
      for (const sel of (ua.restrictions || [])) {
        const resData = (data.restrictions || []).find(r => r.id === sel.restrictionId);
        if (resData?.lockedAdvancements) lockedAdvNames.push(...resData.lockedAdvancements);
      }

      const selectedAdvancements = (ua.advancements || []).map((sel, ai) => {
        const advData = (data.advancements || []).find(a => a.id === sel.advancementId);
        return {
          advancementId: sel.advancementId,
          free: sel.free,
          amount: sel.amount || 1,
          tpDisplay: advData ? this._calcAdvancementTP(advData, sel) : "?",
          effect: advData?.effect || "Unknown advancement",
          prerequisites: advData?.prerequisites || ""
        };
      });

      // Prepare selected restrictions with resolved data
      const selectedRestrictions = (ua.restrictions || []).map((sel, ri) => {
        const resData = (data.restrictions || []).find(r => r.id === sel.restrictionId);
        return {
          restrictionId: sel.restrictionId,
          tpDisplay: resData?.tpCost || 0,
          effect: resData?.effect || "Unknown restriction",
          lockedAdvs: (resData?.lockedAdvancements || []).join(", ") || "-"
        };
      });

      // Available advancements/restrictions for selects (filter out locked advancements)
      const availableAdvancements = (data.advancements || [])
        .filter(a => !lockedAdvNames.includes(a.name || a.id))
        .map(a => ({ id: a.id, name: a.name || a.id }));
      const availableRestrictions = (data.restrictions || []).map(r => ({ id: r.id, name: r.name || r.id }));

      return {
        ...ua,
        uniqueIndex: index,
        data,
        tpCost,
        selectedAdvancements,
        selectedRestrictions,
        availableAdvancements,
        availableRestrictions
      };
    });

    // --- One-Sided Fusion: append gained unique abilities from suppressed actor(s) ---
    const fusion = system.fusion || {};
    if (fusion.isFusion && (fusion.type === "one-sided-absorption" || fusion.type === "one-sided-possession")
        && !this.actor._blockGainedAbilities(system)) {
      const suppIds = fusion.suppressedCharacterIds || [];
      for (const suppId of suppIds) {
        const suppActor = game.actors?.get(suppId);
        if (!suppActor) continue;
        const suppSys = suppActor.system || {};
        const suppUniques = suppSys.uniqueAbilities || [];
        for (const su of suppUniques) {
          const cloned = foundry.utils.deepClone(su);
          const data = catalog[cloned.abilityKey] || { name: cloned.abilityKey, tpCost: 0, advancements: [], restrictions: [] };
          const tpCost = this._calcUniqueTPCost(cloned, data);
          const lockedAdvNames = [];
          for (const sel of (cloned.restrictions || [])) {
            const resData = (data.restrictions || []).find(r => r.id === sel.restrictionId);
            if (resData?.lockedAdvancements) lockedAdvNames.push(...resData.lockedAdvancements);
          }
          const selectedAdvancements = (cloned.advancements || []).map((sel, ai) => {
            const advData = (data.advancements || []).find(a => a.id === sel.advancementId);
            return {
              advancementId: sel.advancementId, free: sel.free, amount: sel.amount || 1,
              tpDisplay: advData ? this._calcAdvancementTP(advData, sel) : "?",
              effect: advData?.effect || "Unknown advancement",
              prerequisites: advData?.prerequisites || ""
            };
          });
          const selectedRestrictions = (cloned.restrictions || []).map((sel, ri) => {
            const resData = (data.restrictions || []).find(r => r.id === sel.restrictionId);
            return {
              restrictionId: sel.restrictionId, tpDisplay: resData?.tpCost || 0,
              effect: resData?.effect || "Unknown restriction",
              lockedAdvs: (resData?.lockedAdvancements || []).join(", ") || "-"
            };
          });
          const availableAdvancements = (data.advancements || [])
            .filter(a => !lockedAdvNames.includes(a.name || a.id))
            .map(a => ({ id: a.id, name: a.name || a.id }));
          const availableRestrictions = (data.restrictions || []).map(r => ({ id: r.id, name: r.name || r.id }));
          prepared.push({
            ...cloned,
            isGained: true,
            gainedFrom: suppActor.name,
            uniqueIndex: prepared.length,
            data, tpCost,
            selectedAdvancements, selectedRestrictions,
            availableAdvancements, availableRestrictions
          });
        }
      }
    }

    // --- Battle Jacket Piloting: append gained unique abilities from jacket ---
    if (system.isPiloting && system._pilotedJacket) {
      const bjUAs = system._pilotedJacket.uniqueAbilities || [];
      for (const su of bjUAs) {
        const cloned = foundry.utils.deepClone(su);
        prepared.push({
          ...cloned,
          isGained: true,
          gainedFrom: system._pilotedJacket.name,
          gainedSource: "battleJacket"
        });
      }
    }

    context.characterUniques = prepared;
  }

  _calcUniqueTPCost(ua, data) {
    if (ua.free) return 0;
    const baseCost = data.tpCost || 0;
    let tp = baseCost;

    for (const sel of (ua.advancements || [])) {
      if (sel.free) continue;
      const advData = (data.advancements || []).find(a => a.id === sel.advancementId);
      if (!advData) continue;
      tp += (advData.tpCost || 0) * (sel.amount || 1);
    }

    for (const sel of (ua.restrictions || [])) {
      const resData = (data.restrictions || []).find(r => r.id === sel.restrictionId);
      if (resData) tp += (resData.tpCost || 0); // negative values
    }

    // Floor: can't go below ceil(baseCost/2)
    return Math.max(Math.ceil(baseCost / 2), tp);
  }

  _calcAdvancementTP(advData, sel) {
    if (sel.free) return "Free";
    return (advData.tpCost || 0) * (sel.amount || 1);
  }

  _calcUniqueTotalTP(system) {
    const uniques = system.uniqueAbilities || [];
    const catalog = CONFIG.DBU?.uniqueAbilitiesCatalog || {};
    return uniques.reduce((sum, ua) => {
      const data = catalog[ua.abilityKey] || { tpCost: 0, advancements: [], restrictions: [] };
      return sum + this._calcUniqueTPCost(ua, data);
    }, 0);
  }

  // -------------------------------------------------------
  // Data Prep: Attack Reference
  // -------------------------------------------------------

  _prepareAttackRefData(context, system) {
    const config = CONFIG.DBU ?? {};
    const profileData = config.profileData || {};
    const tier = system.tier || 1;
    const baseTier = system.baseTier || 1;
    const maxCap = system.status?.maxCapacity || 0;
    const defaultWager = Math.floor(maxCap / 2);

    // Dice pool category bonuses
    const dp = system.dicePools || {};
    const topCat = dp.topCatBonus || {};
    const grCat = dp.greaterCatBonus || {};
    // topApplyCount: Phase 2 — "apply additional times" effects
    const grApply = dp.greaterApplyCount || {};

    const getTopDice = (rollType) => {
      const catBonus = (topCat.global || 0) + (topCat[rollType] || 0);
      return this._resolveExtraDice(tier, 0, catBonus);
    };

    // --- Combat State Modifiers ---
    const combatStates = system.combatStates || {};
    const isImpediment = (system.conditions || []).some(c => c.id === "impediment" && c.active);

    const getGreaterDice = (rollType) => {
      if (isImpediment) return "";
      const hasGreater = combatStates.superior || (grApply.global || 0) > 0 || (grApply[rollType] || 0) > 0;
      if (!hasGreater) return "";
      const catBonus = (grCat.global || 0) + (grCat[rollType] || 0);
      return this._resolveExtraDice(tier, 1, catBonus);
    };

    const strikeTopDice = getTopDice("strike");
    const strikeGreaterDice = getGreaterDice("strike");
    const woundTopDice = getTopDice("wound");
    const woundGreaterDice = getGreaterDice("wound");
    const dodgeTopDice = getTopDice("dodge");
    const dodgeGreaterDice = getGreaterDice("dodge");
    let stateStrikeMod = 0;   // flat bonus to strike
    let stateWoundMod = 0;    // flat bonus to wound
    let stateAllMod = 0;      // flat bonus to ALL combat rolls
    let stateStrikeExtra = ""; // dice expressions for strike
    let stateWoundExtra = "";  // dice expressions for wound

    // Raging: +1d4(T) Wound Rolls
    if (combatStates.raging) stateWoundExtra += `+${tier}d4`;
    // Surging: +1d4(T) Strike & Wound Rolls (vs targeted opponent)
    if (combatStates.surging) {
      stateStrikeExtra += `+${tier}d4`;
      stateWoundExtra += `+${tier}d4`;
    }
    // Mindful: -1(T) Wound Rolls
    if (combatStates.mindful) stateWoundMod -= tier;
    // Undying: -1(T) all Combat Rolls
    if (combatStates.undying) stateAllMod -= tier;
    // Combat Critical Target (Mindful: -1)
    context.combatCT = combatStates.mindful ? "9+" : "10+";

    // Build foundation→profiles map for template selects
    const foundationProfiles = { Physical: [], Energy: [], Magic: [] };
    for (const [name, data] of Object.entries(profileData)) {
      for (const f of (data.foundations || [])) {
        if (foundationProfiles[f]) foundationProfiles[f].push(name);
      }
    }
    context.foundationProfilesJSON = JSON.stringify(foundationProfiles);

    // Helper to get attr mod
    const getAttr = (key) => {
      const a = system.attributes?.[key];
      return a?.totalScore ?? a?.score ?? 0;
    };

    const ag = getAttr("ag");
    const fo = getAttr("fo");
    const ma = getAttr("ma");
    const inAttr = getAttr("in");

    // Check conditions
    const isCondActive = (id) => {
      const c = (system.conditions || []).find(c => c.id === id);
      return c?.active ?? false;
    };
    const condStacks = (id) => {
      const c = (system.conditions || []).find(c => c.id === id);
      return c?.stacks ?? 0;
    };
    const isProne = isCondActive("prone");
    const isShaken = isCondActive("shaken");
    const guardDown = isCondActive("guardDown");
    const dimOffense = system.tracking?.diminishingOffense || 0;
    const dimDefense = system.tracking?.diminishingDefense || 0;
    const eqPenalty = system.equipment?.combatPenalty || 0;

    // Active aura bonuses
    const activeAura = this.actor._getActiveAura(system);
    const sparkingBonus = (activeAura && activeAura.type === "Sparking") ? tier : 0;
    let auraWoundBonus = 0;
    if (activeAura) {
      for (const adv of (activeAura.advantages || [])) {
        if (adv.name === "Powerful Aura") {
          const powerStacks = system.tracking?.powerStacks || 0;
          auraWoundBonus += ((adv.ranks || 1) + powerStacks) * tier;
        }
      }
    }

    // Prepare each attack ref card with calculated formulas
    const refs = system.attackRefs || [];
    context.attackRefs = refs.map((ref, idx) => {
      const profile = profileData[ref.profile] || {};
      const charges = ref.energyCharges || 0;
      const wager = ref.kiWager || 0;
      const ps = ref.powerShot || 0;
      const targetRange = ref.targetRange || 0;

      // --- STRIKE ---
      let haste = system.aptitudes?.haste ?? 0;
      let awareness = system.aptitudes?.awareness ?? 0;
      if (isProne) haste = Math.floor(haste / 2);
      // Cutting: "1/2 (rounded up) of your Haste and 3/4 of your Awareness" (attacking.txt)
      if (ref.profile === "Cutting") {
        haste = Math.ceil(haste / 2);
        awareness = Math.floor(awareness * 3 / 4);
      }
      const strikePenShaken = isShaken ? 2 * tier : 0;
      const strikePenLR = (targetRange >= 9) ? 2 * baseTier : 0;
      const strikePenDim = dimOffense * baseTier;
      // Super Stack Strike penalty: -1(T) per stack (attributes.txt)
      const ssPenStrike = system.aptitudes?.superStackStrikePenalty ?? 0;
      // Unified strike buff total (talents, states, maneuvers, custom buffs)
      const strikeBuffTotal = system.aptitudes?.strikeBuffTotal ?? 0;
      const strikeMod = haste + awareness + sparkingBonus - strikePenShaken - strikePenLR - strikePenDim - eqPenalty - ssPenStrike + strikeBuffTotal + stateAllMod;
      const strikeFormula = this._buildFormula(strikeTopDice, strikeGreaterDice, strikeMod, stateStrikeExtra);

      // --- WOUND ---
      const isMagic = ref.foundation === "Magic";
      let damageAttr = isMagic ? ma : fo;
      // Crushing: "Reduce the bonus to your Wound Roll from your Force by 1/2" (attacking.txt)
      if (ref.profile === "Crushing") damageAttr = Math.floor(damageAttr / 2);
      const isPowered = ref.profile === "Powered";
      const extraDmgAttr = isPowered ? damageAttr : 0;
      const woundPSBonus = ps * 2 * tier;
      // Unified wound buff total (talents, states, maneuvers, custom buffs)
      const woundBuffTotal = system.aptitudes?.woundBuffTotal ?? 0;
      const woundMod = damageAttr + extraDmgAttr + wager + woundPSBonus + auraWoundBonus + stateWoundMod + stateAllMod + woundBuffTotal;
      // Sig Techs use d8: "1d8(T) if Signature Technique" (attacking.txt)
      const chargesStr = charges > 0 ? `+${charges * tier}d8` : "";
      // Super Stack Extra Dice: "+1d4(T), increasing dice category per stack after first" (attributes.txt)
      const ssWoundDice = system.aptitudes?.superStackWoundDice || "";
      const ssWoundExtra = (ssWoundDice && (ref.foundation === "Physical" || ref.foundation === "Energy"))
        ? `+${ssWoundDice}` : "";
      const woundFormula = this._buildFormula(woundTopDice, woundGreaterDice, woundMod, chargesStr + ssWoundExtra + stateWoundExtra);
      let damageCat = profile.damageCat || "Standard";
      // Mega Flare: 7+ charges → upgrade damage category
      if (ref.profile === "Mega Flare" && charges >= 7) {
        if (damageCat === "Standard") damageCat = "Direct";
        else if (damageCat === "Direct") damageCat = "Lethal";
      }

      // --- DODGE ---
      // Rule: "Add your Defense Value to all Dodge Rolls" (attributes.txt)
      // DV already includes size, aura, equipment, raging, guard down, prone.
      const dv = system.aptitudes?.defenseValue ?? 0;
      const dodgePenDim = dimDefense * baseTier;
      // Super Stack Dodge penalty: -1(T) per stack (attributes.txt)
      const ssPenDodge = system.aptitudes?.superStackDodgePenalty ?? 0;
      // Unified dodge buff total (talents, states, maneuvers, custom buffs)
      const dodgeBuffTotal = system.aptitudes?.dodgeBuffTotal ?? 0;
      const dodgeMod = dv - dodgePenDim - ssPenDodge + dodgeBuffTotal + stateAllMod;
      const dodgeFormula = this._buildFormula(dodgeTopDice, dodgeGreaterDice, dodgeMod);

      // --- DUEL CLASH ---
      const bestAttr = Math.max(fo, ma);
      const clashCharges = charges * 2 * tier;
      const clashPS = ps * tier;
      const clashMod = bestAttr + clashCharges + clashPS + stateAllMod;
      const clashFormula = this._buildFormula(strikeTopDice, strikeGreaterDice, clashMod);

      // Available profiles for this foundation
      const availableProfiles = foundationProfiles[ref.foundation] || Object.keys(profileData);

      return {
        ...ref,
        _idx: idx,
        attackName: ref.name || "Attack Reference",
        extraProfile: ref.extraProfile || "",
        profileEffect: profile.effect || "—",
        profileRange: profile.range || "—",
        profileKP: profile.kpCost != null ? `${profile.kpCost}(T)` : "—",
        damageCat,
        damageCatClass: `dmg-cat-${damageCat.toLowerCase()}`,
        strikeFormula, strikeMod, haste, awareness,
        woundFormula, woundMod, damageAttr,
        dodgeFormula, dodgeMod,
        clashFormula, clashMod,
        strikeTopDice,
        strikeGreaterDice,
        woundTopDice,
        woundGreaterDice,
        dodgeTopDice,
        dodgeGreaterDice,
        strikeTopDiceDisplay: strikeTopDice || "--",
        strikeGreaterDiceDisplay: strikeGreaterDice || "--",
        woundTopDiceDisplay: woundTopDice || "--",
        woundGreaterDiceDisplay: woundGreaterDice || "--",
        dodgeTopDiceDisplay: dodgeTopDice || "--",
        dodgeGreaterDiceDisplay: dodgeGreaterDice || "--",
        totalEnergyCharges: charges,
        maxWager: defaultWager,
        weaponEquippedLabel: ref.weaponEquipped || "Unarmed",
        offHandLabel: ref.offHand || "Unarmed",
        defense: system.defense ?? 0,
        soak: system.soak ?? 0,
        availableProfiles
      };
    });

    // Profile options lists
    context.allProfiles = Object.keys(profileData).sort();
  }

  /**
   * Resolve a dice pool string given tier and category bonus steps.
   * @param {number} tier - Current Tier of Power (1-7)
   * @param {number} baseStep - Base step in the progression (0=none for ToP, 1=1d4 for Greater)
   * @param {number} catBonus - Additional category steps from effects
   * @returns {string} Dice expression like "1d8" or "1d10+1d4" or "" for none
   */
  _resolveExtraDice(tier, baseStep, catBonus = 0) {
    const DICE_CAT = ["", "1d4", "1d6", "1d8", "1d10", "1d10+1d4", "1d10+1d6", "1d10+1d8", "2d10", "2d10+1d4", "2d10+1d6", "2d10+1d8", "3d10", "3d10+1d4", "3d10+1d6"];
    const idx = Math.max(0, Math.min(DICE_CAT.length - 1, (tier - 1) + baseStep + catBonus));
    return DICE_CAT[idx];
  }

  _buildFormula(topDice, greaterDice, mod, extra = "") {
    let f = "1d10";
    if (topDice) f += `+${topDice}`;
    if (greaterDice) f += `+${greaterDice}`;
    if (mod > 0) f += `+${mod}`;
    else if (mod < 0) f += `${mod}`;
    if (extra) f += extra;
    return f;
  }

  // -------------------------------------------------------
  // Data Prep: Combat Rolls Summary (Main Tab)
  // -------------------------------------------------------

  _prepareCombatRollsData(context, system) {
    const haste = system.aptitudes?.haste ?? 0;
    const awareness = system.aptitudes?.awareness ?? 0;
    const defenseValue = system.aptitudes?.defenseValue ?? 0;
    const strikeBuffTotal = system.aptitudes?.strikeBuffTotal ?? 0;
    const dodgeBuffTotal = system.aptitudes?.dodgeBuffTotal ?? 0;
    const woundBuffTotal = system.aptitudes?.woundBuffTotal ?? 0;
    const foTotal = system.attributes?.fo?.totalScore ?? 0;
    const maTotal = system.attributes?.ma?.totalScore ?? 0;
    const crit = system.combatStates?.mindful ? "9+" : "10+";

    const strikeDerived = haste + awareness;
    const strikeTotal = strikeDerived + strikeBuffTotal;
    const dodgeTotal = defenseValue + dodgeBuffTotal;

    const fmt = (v) => v >= 0 ? `+${v}` : `${v}`;

    context.combatRolls = {
      strike: {
        derivedValue: fmt(strikeDerived),
        additionalMods: fmt(strikeBuffTotal),
        total: fmt(strikeTotal),
        crit
      },
      dodge: {
        derivedValue: fmt(defenseValue),
        additionalMods: fmt(dodgeBuffTotal),
        total: fmt(dodgeTotal),
        crit
      },
      strikeForType: `${fmt(strikeTotal)} (${crit})`,
      wound: {
        physical: { total: fmt(foTotal + woundBuffTotal), crit },
        energy:   { total: fmt(foTotal + woundBuffTotal), crit },
        magic:    { total: fmt(maTotal + woundBuffTotal), crit }
      }
    };
  }

  // -------------------------------------------------------
  // Data Prep: Active Effects Panel (Main Tab)
  // -------------------------------------------------------

  _prepareActiveEffects(context, system) {
    const catalog = CONFIG.DBU ?? {};
    const et = system.effectTracking || {};
    const enabledPassives = et.enabledPassives || {};
    const usedRound = et.usedEffects?.round || {};
    const usedEncounter = et.usedEffects?.encounter || {};
    const combatStates = system.combatStates || {};

    const groups = {
      racial: { label: "Racial Traits", source: "racial", effects: [] },
      villainous: { label: "Villainous Traits", source: "villainous", effects: [] },
      weaknesses: { label: "Weaknesses", source: "weaknesses", effects: [] },
      talents: { label: "Talents", source: "talents", effects: [] },
      transformations: { label: "Transformations", source: "transformations", effects: [] }
    };

    // 1. Racial traits
    const traitIds = system.racialTraits || [];
    const traitCatalog = catalog.racialTraitsCatalog || {};
    const allTraits = [];
    for (const [race, traits] of Object.entries(traitCatalog)) {
      for (const trait of traits) allTraits.push({ ...trait, race });
    }
    for (const id of traitIds) {
      const trait = allTraits.find(t => t.id === id);
      if (!trait) continue;
      const traitKey = trait.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      for (const eff of (trait.effects || [])) {
        // For "option"/"multi-option"/"choice" effects, resolve the chosen option and display it
        if (["option", "multi-option", "choice"].includes(eff.activationType)) {
          const optSel = system.racialOptionSelections || {};
          const traitSel = optSel[id] || {};
          const chosenName = traitSel?.[String(eff.level)] ?? traitSel?.[eff.level] ?? "";
          if (!chosenName) continue; // no option selected yet, skip
          const chosenOpt = (eff.options || []).find(o => o.name === chosenName);
          if (!chosenOpt) continue;
          const optEffectId = `racial_${trait.traitCategory}_${traitKey}_${eff.level}`;
          const optType = chosenOpt.activationType || "passive";
          const optMaxUses = chosenOpt.maxUses || (optType === "limited" ? 1 : 0);
          const optUsageLimit = chosenOpt.usageLimit || null;
          const optUsedKey = optUsageLimit === "round" ? "round" : "encounter";
          const optUsedCount = (optUsedKey === "round" ? usedRound : usedEncounter)[optEffectId] || 0;
          const optPips = [];
          if (optMaxUses > 0) {
            for (let i = 0; i < optMaxUses; i++) {
              optPips.push({ available: i >= optUsedCount, index: i });
            }
          }
          const optKeyword = chosenOpt.keyword || optType.charAt(0).toUpperCase() + optType.slice(1);
          let optTriggered = false;
          if (optType === "triggered") {
            if (optKeyword.includes("Raging")) optTriggered = !!combatStates.raging;
            else if (optKeyword.includes("Surging")) optTriggered = !!combatStates.surging;
            else if (optKeyword.includes("Mindful")) optTriggered = !!combatStates.mindful;
            else if (optKeyword.includes("Superior")) optTriggered = !!combatStates.superior;
            else if (optKeyword.includes("Undying")) optTriggered = !!combatStates.undying;
            else if (optKeyword.includes("Start of")) optTriggered = true;
            else if (optKeyword.includes("Power")) optTriggered = true;
          }
          groups.racial.effects.push({
            id: optEffectId,
            name: `${trait.name} (${chosenName})`,
            level: eff.level || 0,
            type: optType,
            keyword: optKeyword,
            text: chosenOpt.text || "",
            maxUses: optMaxUses,
            usageLimit: optUsageLimit,
            usedCount: optUsedCount,
            pips: optPips,
            isEnabled: enabledPassives[optEffectId] !== false,
            isTriggered: optTriggered,
            truncatedKeyword: (optKeyword || "Passive").substring(0, 12)
          });
          continue;
        }
        const effectId = `racial_${trait.traitCategory}_${traitKey}_${eff.level}`;
        const effectType = eff.activationType || "passive";
        const maxUses = eff.maxUses || (effectType === "limited" ? 1 : 0);
        const usageLimit = eff.usageLimit || null;
        const usedKey = usageLimit === "round" ? "round" : "encounter";
        const usedCount = (usedKey === "round" ? usedRound : usedEncounter)[effectId] || 0;

        // Build usage pips
        const pips = [];
        if (maxUses > 0) {
          for (let i = 0; i < maxUses; i++) {
            pips.push({ available: i >= usedCount, index: i });
          }
        }

        // Check triggered state
        let isTriggered = false;
        const keyword = eff.keyword || "";
        if (effectType === "triggered") {
          if (keyword.includes("Raging")) isTriggered = !!combatStates.raging;
          else if (keyword.includes("Surging")) isTriggered = !!combatStates.surging;
          else if (keyword.includes("Mindful")) isTriggered = !!combatStates.mindful;
          else if (keyword.includes("Superior")) isTriggered = !!combatStates.superior;
          else if (keyword.includes("Undying")) isTriggered = !!combatStates.undying;
          else if (keyword.includes("Start of")) isTriggered = true;
          else if (keyword.includes("Power")) isTriggered = true;
        }

        groups.racial.effects.push({
          id: effectId,
          name: trait.name,
          level: eff.level || 0,
          type: effectType,
          keyword: keyword,
          text: eff.text || "",
          maxUses,
          usageLimit,
          usedCount,
          pips,
          isEnabled: enabledPassives[effectId] !== false,
          isTriggered,
          truncatedKeyword: (keyword || "TRIG").substring(0, 12)
        });
      }
    }

    // 1b. Villainous Traits
    const vtIds = system.adversary?.villainousTraits || [];
    const vtCatalog = catalog.villainousTraitsCatalog || [];
    if (system.adversary?.enabled) {
      for (const id of vtIds) {
        const trait = vtCatalog.find(t => t.id === id);
        if (!trait) continue;
        const traitKey = trait.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
        for (const eff of (trait.effects || [])) {
          if (["option", "multi-option", "choice"].includes(eff.activationType)) continue;
          const effectId = `villainous_${traitKey}_${eff.keyword?.replace(/[^a-z0-9]/gi, "_") || "0"}`;
          const effectType = eff.activationType || "passive";
          const maxUses = eff.maxUses || (effectType === "limited" ? 1 : 0);
          const usageLimit = eff.usageLimit || null;
          const usedKey = usageLimit === "round" ? "round" : "encounter";
          const usedCount = (usedKey === "round" ? usedRound : usedEncounter)[effectId] || 0;

          const pips = [];
          if (maxUses > 0) {
            for (let i = 0; i < maxUses; i++) {
              pips.push({ available: i >= usedCount, index: i });
            }
          }

          let isTriggered = false;
          const keyword = eff.keyword || "";
          if (effectType === "triggered") {
            if (keyword.includes("Raging")) isTriggered = !!combatStates.raging;
            else if (keyword.includes("Surging")) isTriggered = !!combatStates.surging;
            else if (keyword.includes("Start of")) isTriggered = true;
            else if (keyword.includes("Defeated")) isTriggered = true;
            else if (keyword.includes("Threshold")) isTriggered = true;
            else if (keyword.includes("Power")) isTriggered = true;
          }

          groups.villainous.effects.push({
            id: effectId,
            name: trait.name,
            level: 0,
            type: effectType,
            keyword: keyword,
            text: eff.text || "",
            maxUses,
            usageLimit,
            usedCount,
            pips,
            isEnabled: enabledPassives[effectId] !== false,
            isTriggered,
            truncatedKeyword: (keyword || "TRIG").substring(0, 12)
          });
        }
      }

      // 1c. Weaknesses
      const wkIds = system.adversary?.weaknesses || [];
      const wkCatalog = catalog.weaknessesCatalog || [];
      for (const id of wkIds) {
        const weakness = wkCatalog.find(w => w.id === id);
        if (!weakness) continue;
        const wkKey = weakness.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
        for (const eff of (weakness.effects || [])) {
          const effectId = `weakness_${wkKey}_${eff.keyword?.replace(/[^a-z0-9]/gi, "_") || "0"}`;
          const effectType = eff.activationType || "passive";

          groups.weaknesses.effects.push({
            id: effectId,
            name: weakness.name,
            level: 0,
            type: effectType,
            keyword: eff.keyword || "",
            text: eff.text || "",
            maxUses: 0,
            usageLimit: null,
            usedCount: 0,
            pips: [],
            isEnabled: enabledPassives[effectId] !== false,
            isTriggered: effectType === "automatic",
            truncatedKeyword: (eff.keyword || "AUTO").substring(0, 12)
          });
        }
      }
    }

    // 2. Talents
    const talentIds = system.talents || [];
    const talentCatalog = catalog.talentsCatalog || [];
    for (const id of talentIds) {
      const talent = talentCatalog.find(t => t.id === id);
      if (!talent) continue;
      const talentKey = talent.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      for (const eff of (talent.effects || [])) {
        if (["option", "multi-option", "choice"].includes(eff.activationType)) continue;
        const effectId = `talent_${talentKey}_${eff.level || 0}`;
        const effectType = eff.activationType || "passive";
        const maxUses = eff.maxUses || (effectType === "limited" ? 1 : 0);
        const usageLimit = eff.usageLimit || null;
        const usedKey = usageLimit === "round" ? "round" : "encounter";
        const usedCount = (usedKey === "round" ? usedRound : usedEncounter)[effectId] || 0;

        const pips = [];
        if (maxUses > 0) {
          for (let i = 0; i < maxUses; i++) {
            pips.push({ available: i >= usedCount, index: i });
          }
        }

        let isTriggered = false;
        const keyword = eff.keyword || "";
        if (effectType === "triggered") {
          if (keyword.includes("Raging")) isTriggered = !!combatStates.raging;
          else if (keyword.includes("Surging")) isTriggered = !!combatStates.surging;
          else if (keyword.includes("Mindful")) isTriggered = !!combatStates.mindful;
          else if (keyword.includes("Superior")) isTriggered = !!combatStates.superior;
          else if (keyword.includes("Undying")) isTriggered = !!combatStates.undying;
          else if (keyword.includes("Start of")) isTriggered = true;
          else if (keyword.includes("Power")) isTriggered = true;
        }

        groups.talents.effects.push({
          id: effectId,
          name: talent.name,
          level: eff.level || 0,
          type: effectType,
          keyword: keyword,
          text: eff.text || "",
          maxUses,
          usageLimit,
          usedCount,
          pips,
          isEnabled: enabledPassives[effectId] !== false,
          isTriggered,
          truncatedKeyword: (keyword || "TRIG").substring(0, 12)
        });
      }
    }

    // Build context — all effect groups shown in Main tab AND Combat tab
    context.effectGroups = [];
    for (const [key, group] of Object.entries(groups)) {
      if (group.effects.length > 0) {
        context.effectGroups.push({
          key,
          label: group.label,
          count: group.effects.length,
          effects: group.effects
        });
      }
    }
    context.hasActiveEffects = context.effectGroups.length > 0;

    // Talent effects also available separately for the Combat tab's Talents sub-tab
    const tg = groups.talents;
    context.talentEffectGroup = tg.effects.length > 0
      ? { key: "talents", label: tg.label, count: tg.effects.length, effects: tg.effects }
      : null;
  }

  // -------------------------------------------------------
  // Data Prep: Combat
  // -------------------------------------------------------

  _prepareCombatData(context, system) {
    // Combat resources from traits, talents, unique (passive + catalog-based)
    const rawResources = this._getCombatResources(system);

    // === Unified Action: merge bonus panel triggered effects into resource list ===
    // Keep passive resources from all sources + unique ability trackable resources.
    // Trackable resources for racial/talent/transformation are replaced by bonus panel triggers
    // which have correct trigger IDs and computed descriptions.
    const baseResources = rawResources.filter(r => {
      if (!r.isTrackable) return true;
      if (r.sourceType === "unique") return true;
      return false;
    });

    const bonusTriggers = [];

    // Racial trait triggered effects (from racial automation bonus objects)
    const raceBonusMap = {
      racialBonuses: "Saiyan", earthlingBonuses: "Earthling", majinBonuses: "Majin",
      bioAndroidBonuses: "Bio-Android", androidBonuses: "Android", arcosianBonuses: "Arcosian",
      cerealianBonuses: "Cerealian", namekianBonuses: "Namekian", nekoMajinBonuses: "Neko Majin",
      neoTuffleBonuses: "Neo-Tuffle", shadowDragonBonuses: "Shadow Dragon",
      shinjinBonuses: "Shinjin", undeadBonuses: "Undead"
    };
    for (const [key, raceName] of Object.entries(raceBonusMap)) {
      const bonuses = system[key];
      if (!bonuses?.triggered) continue;
      for (const t of bonuses.triggered) {
        bonusTriggers.push({
          id: `rt:${t.id}`, sourceName: t.name, sourceLabel: raceName,
          sourceType: "racial", level: 0, activationType: "triggered",
          usageLimit: t.usageLimit || null, maxUses: t.maxUses || 0,
          keyword: t.usageLimit || "Triggered", text: t.description || "",
          isTrackable: true, actionType: "rt-trigger", triggerId: t.id
        });
      }
    }

    // Talent triggered effects
    for (const entry of (system.talentBonuses?.entries || [])) {
      for (const t of (entry.triggered || [])) {
        bonusTriggers.push({
          id: `tb:${t.id}`, sourceName: t.name, sourceLabel: entry.name,
          sourceType: "talent", level: 0, activationType: "triggered",
          usageLimit: t.usageLimit || "round", maxUses: t.maxUses || 0,
          keyword: t.usageLimit || "Triggered", text: t.description || "",
          isTrackable: true, actionType: "talent-trigger", triggerId: t.id
        });
      }
    }

    // Talent stances (Combat Expertise, Balanced Defender)
    const talentIds = new Set(system.talents || []);
    if (talentIds.has("combat_expertise")) {
      bonusTriggers.push({
        id: "stance:combat_expertise", sourceName: "Combat Expertise Shift",
        sourceLabel: "Combat Expertise", sourceType: "talent", level: 0,
        activationType: "triggered", usageLimit: null, maxUses: 0,
        keyword: "Stance", text: "Redistribute points between Defense Value and Awareness.",
        isTrackable: false, actionType: "talent-stance", triggerId: null, stanceId: "combat_expertise"
      });
    }
    if (talentIds.has("balanced_defender")) {
      bonusTriggers.push({
        id: "stance:balanced_defender", sourceName: "Balanced Defender Shift",
        sourceLabel: "Balanced Defender", sourceType: "talent", level: 0,
        activationType: "triggered", usageLimit: null, maxUses: 0,
        keyword: "Stance", text: "Redistribute points between Defense Value and Soak.",
        isTrackable: false, actionType: "talent-stance", triggerId: null, stanceId: "balanced_defender"
      });
    }

    // Manifested Power triggered effects
    for (const entry of (system.manifestedPowerBonuses?.entries || [])) {
      for (const t of (entry.triggered || [])) {
        bonusTriggers.push({
          id: `mp:${t.id}`, sourceName: t.name, sourceLabel: entry.name,
          sourceType: "transformation", level: 0, activationType: "triggered",
          usageLimit: t.usageLimit || null, maxUses: t.maxUses || 0,
          keyword: t.usageLimit || "Triggered", text: t.description || "",
          isTrackable: true, actionType: "mp-trigger", triggerId: t.id
        });
      }
    }

    // Enhancement Power triggered effects
    for (const entry of (system.enhancementPowerBonuses?.entries || [])) {
      for (const t of (entry.triggered || [])) {
        bonusTriggers.push({
          id: `ep:${t.id}`, sourceName: t.name, sourceLabel: entry.name,
          sourceType: "transformation", level: 0, activationType: "triggered",
          usageLimit: t.usageLimit || null, maxUses: t.maxUses || 0,
          keyword: t.usageLimit || "Triggered", text: t.description || "",
          isTrackable: true, actionType: "ep-trigger", triggerId: t.id
        });
      }
    }

    // Alternate Form triggered effects
    for (const entry of (system.alternateFormBonuses?.entries || [])) {
      for (const t of (entry.triggered || [])) {
        bonusTriggers.push({
          id: `af:${t.id}`, sourceName: t.name, sourceLabel: entry.name,
          sourceType: "transformation", level: 0, activationType: "triggered",
          usageLimit: t.usageLimit || null, maxUses: t.maxUses || 0,
          keyword: t.usageLimit || "Triggered", text: t.description || "",
          isTrackable: true, actionType: "af-trigger", triggerId: t.id
        });
      }
    }

    // Legendary Form triggered effects
    for (const entry of (system.legendaryFormBonuses?.entries || [])) {
      for (const t of (entry.triggered || [])) {
        bonusTriggers.push({
          id: `lf:${t.id}`, sourceName: t.name, sourceLabel: entry.name,
          sourceType: "transformation", level: 0, activationType: "triggered",
          usageLimit: t.usageLimit || null, maxUses: t.maxUses || 0,
          keyword: t.usageLimit || "Triggered", text: t.description || "",
          isTrackable: true, actionType: "lf-trigger", triggerId: t.id
        });
      }
    }

    // Legendary Trait triggered effects
    for (const entry of (system.legendaryTraitBonuses?.entries || [])) {
      for (const t of (entry.triggered || [])) {
        bonusTriggers.push({
          id: `lt:${t.id}`, sourceName: t.name, sourceLabel: entry.sourceName || entry.name,
          sourceType: "racial", level: 0, activationType: "triggered",
          usageLimit: t.usageLimit || null, maxUses: t.maxUses || 0,
          keyword: t.usageLimit || "Triggered", text: t.description || "",
          isTrackable: true, actionType: "lt-trigger", triggerId: t.id
        });
      }
    }

    // Merge base resources + bonus panel triggers
    const allResources = [...baseResources, ...bonusTriggers];

    // Enrich resources with usage pips
    const cts = system.combatTabState || {};
    const usage = cts.resourceUsage || {};
    const roundUsage = usage.round || {};
    const encounterUsage = usage.encounter || {};

    const _buildUsageLabel = (r, hasCap) => {
      const u = r.usageLimit;
      if (!u) return "";
      const s = String(u).trim();
      const lower = s.toLowerCase();
      if (lower === "round") return hasCap ? `${r.maxUses}/R` : "Round";
      if (lower === "encounter") return hasCap ? `${r.maxUses}/E` : "Enc";
      if (lower === "turn") return hasCap ? `${r.maxUses}/T` : "Turn";
      if (lower === "burst limit") return "BL";
      if (lower === "unlimited") return "∞";
      // Already-formatted strings like "1/Round", "1/Encounter"
      return s.replace(/\s*\/\s*Round\b/i, "/R")
              .replace(/\s*\/\s*Encounter\b/i, "/E")
              .replace(/\s*\/\s*Turn\b/i, "/T");
    };
    context.combatResources = allResources.map(r => {
      const usedKey = (r.usageLimit === "round") ? "round" : "encounter";
      const usedCount = r.isTrackable ? ((usedKey === "round" ? roundUsage : encounterUsage)[r.id] || 0) : 0;
      const hasCap = r.maxUses > 0;
      const isMaxed = hasCap && usedCount >= r.maxUses;
      const pips = [];
      if (hasCap) {
        for (let i = 0; i < r.maxUses; i++) {
          pips.push({ available: i >= usedCount, index: i });
        }
      }
      return {
        ...r, usedCount, hasCap, isMaxed, pips,
        usageLabel: _buildUsageLabel(r, hasCap),
        hasAction: !!r.actionType,
        buttonLabel: r.actionType === "talent-stance" ? "Shift" : "Use"
      };
    });

    // Group resources by source type
    const groupOrder = [
      { key: "racial", label: "Racial Traits" },
      { key: "talent", label: "Talents" },
      { key: "unique", label: "Unique Abilities" },
      { key: "transformation", label: "Transformations" },
      { key: "equipment", label: "Equipment" }
    ];
    context.combatResourceGroups = [];
    for (const g of groupOrder) {
      const items = context.combatResources.filter(r => r.sourceType === g.key);
      if (items.length > 0) {
        context.combatResourceGroups.push({ key: g.key, label: g.label, resources: items });
      }
    }

    const specialResources = system.transformationMeta?.specialResources || {};
    context.specialTransformationResources = Object.entries(specialResources).map(([key, data]) => ({
      key,
      label: String(key).replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()),
      value: Number(data?.value || 0),
      max: Number(data?.max || 0),
      sourceName: data?.sourceName || data?.source || ""
    })).filter(r => r.value > 0 || r.max > 0);
    context.hasSpecialTransformationResources = context.specialTransformationResources.length > 0;
    const hasDivineKiAccess = Number(system.divineKiPoints?.max || 0) > 0 || Number(system.divineKiPoints?.value || 0) > 0;
    const quickCombatResources = [
      ...(hasDivineKiAccess ? [{
        key: "divineKi",
        label: "Divine Ki",
        value: Number(system.divineKiPoints?.value || 0),
        max: Number(system.divineKiPoints?.max || 0)
      }] : []),
      {
        key: "lifeforce",
        label: "Lifeforce",
        value: Number(system.tracking?.lifeforce || 0),
        max: 0
      },
      {
        key: "perfectPoints",
        label: "Perfect Points",
        value: Number(system.tracking?.perfectPoints || 0),
        max: 0
      }
    ].filter(r => r.value > 0 || r.max > 0);
    context.quickCombatResources = quickCombatResources;
    context.hasQuickCombatResources = quickCombatResources.length > 0;
    context.universeSeed = {
      universalPower: Number(system.universeSeed?.universalPower || 0),
      integrated: !!system.universeSeed?.integrated
    };
    context.hasUniverseSeed = context.universeSeed.universalPower > 0
      || context.universeSeed.integrated
      || !!specialResources.godSphere;

    // Combat conditions
    context.combatConditions = this._getCombatConditions(system);

    // Combat tab state (round tracker)
    const rounds = cts.rounds || [];
    const currentRound = cts.currentRound || (rounds.length > 0 ? rounds.length : 0);
    context.combatRound = currentRound;

    // Prepare rounds for display
    context.combatRounds = rounds.map((r, i) => ({
      ...r,
      isActive: i === rounds.length - 1,
      kiTotal: (r.actions || []).reduce((sum, a) => sum + (a.kiCost || 0), 0),
      dkpTotal: (r.actions || []).reduce((sum, a) => sum + (a.dkpCost || 0), 0)
    }));

    // --- Tracker Attack Sources (for "attack" action type) ---
    const trackerTier = system.tier || 1;
    const trackerSourceGroups = [];
    const configDBU = CONFIG.DBU ?? {};
    // Attack Refs
    const arSources = [];
    for (let i = 0; i < (system.attackRefs || []).length; i++) {
      const ref = system.attackRefs[i];
      if (!ref.name) continue;
      const profile = (configDBU.profileData || {})[ref.profile] || {};
      arSources.push({ key: `ref_${i}`, name: ref.name, kiCost: (profile.kpCost || 0) * trackerTier });
    }
    if (arSources.length) trackerSourceGroups.push({ label: "Attack Refs", sources: arSources });
    // Signature Techniques
    const stSources = [];
    for (const tech of (context.signatureTechniques || [])) {
      if (!tech.name) continue;
      stSources.push({ key: `tech_${tech.id}`, name: tech.name, kiCost: (tech.finalKP || 0) * trackerTier });
    }
    if (stSources.length) trackerSourceGroups.push({ label: "Sig. Techniques", sources: stSources });
    // Unique Abilities
    const uaSources = [];
    for (const ua of (context.characterUniques || [])) {
      const name = ua.data?.name || ua.abilityKey;
      uaSources.push({ key: `unique_${ua.abilityKey}`, name, kiCost: 0 });
    }
    if (uaSources.length) trackerSourceGroups.push({ label: "Unique Abilities", sources: uaSources });
    // Store for listener access
    this._trackerSourceGroups = trackerSourceGroups;

    // Power-Up count — only active power-ups (last 2 rounds, per DBU rules)
    let powerUpCount = 0;
    for (const r of rounds) {
      if (r.roundNumber >= currentRound - 1) {
        for (const a of (r.actions || [])) {
          if (a.type === "power-up") powerUpCount++;
        }
      }
    }
    context.combatPowerUpCount = powerUpCount;

    // Ki Wager limits reference (calculated from Max Capacity)
    const maxCap = system.status.maxCapacity || 0;
    context.kiWagerLimits = {
      default: Math.floor(maxCap / 2),
      duel: Math.floor(maxCap / 2),
      throw: Math.ceil(maxCap / 4),
      elementalEarth: Math.floor(maxCap / 4),
      deflectPS: Math.floor(maxCap / 5),
      unitedDuel: Math.floor(maxCap / 10)
    };

    // DOT damage calculation
    const dotStacks = cts.dotStacks || 0;
    context.combatDotDamage = dotStacks * (system.tier || 1);

    // Top layer Break Value status for combat display
    const topLayerId = system.wornApparelSlots?.topLayer;
    if (topLayerId) {
      const topItem = this.actor.items.get(topLayerId);
      if (topItem) {
        context.topLayerBV = {
          name: topItem.name,
          current: topItem.system.breakValueCurrent ?? 0,
          max: this._calcBreakValueMax(topItem),
          broken: (topItem.system.breakValueCurrent ?? 0) === 0
        };
      }
    }
    context.hasTopLayer = !!context.topLayerBV;

    // Damage log (structured events)
    const rawLog = cts.damageLog || [];
    context.combatDamageLog = rawLog.map(entry => {
      // Support both old string format and new structured format
      if (typeof entry === "string") {
        return { text: entry, isLegacy: true };
      }
      // Structured entry: { round, type, finalDamage, lpBefore, lpAfter, steadfastResults, breakReduction, thresholdsCrossed }
      const typeLabels = { standard: "STD", direct: "DIR", lethal: "LTH", dot: "DOT", lpReduction: "LP-", heal: "HEAL", wound: "STD" };
      return {
        ...entry,
        typeLabel: typeLabels[entry.type] || entry.type,
        isHeal: entry.type === "heal",
        absDamage: Math.abs(entry.finalDamage || 0),
        hasBreak: !!entry.breakReduction,
        breakReduction: entry.breakReduction || 0,
        steadfastBadges: (entry.steadfastResults || []).map(sr => ({
          passed: sr.passed,
          cls: sr.passed ? "passed" : "failed",
          icon: sr.passed ? "check" : "times",
          initial: (sr.threshold || "?").charAt(0).toUpperCase(),
          rollText: sr.autoFail ? "auto" : String(sr.roll)
        }))
      };
    });
    context.combatDamageLog.reverse(); // newest first

    // Resource usage counts
    context.combatRoundUses = Object.values(roundUsage).reduce((a, b) => a + b, 0);
    context.combatEncounterUses = Object.values(encounterUsage).reduce((a, b) => a + b, 0);

    // Build used resources list with pips
    const usedMap = {};
    const enrichedResources = context.combatResources;
    for (const [effectId, count] of Object.entries(roundUsage)) {
      if (count > 0) {
        const res = enrichedResources.find(r => r.id === effectId) || this._resolveTrackedEffectResource(effectId, system);
        if (!res) continue;
        const pips = [];
        if (res.maxUses > 0) {
          for (let i = 0; i < res.maxUses; i++) pips.push({ available: i >= count, index: i });
        }
        usedMap[effectId] = {
          id: effectId, sourceName: res.sourceName, level: res.level,
          usageLimit: "round", usedCount: count, maxUses: res.maxUses,
          hasCap: res.maxUses > 0, isMaxed: res.maxUses > 0 && count >= res.maxUses, pips
        };
      }
    }
    for (const [effectId, count] of Object.entries(encounterUsage)) {
      if (count > 0 && !usedMap[effectId]) {
        const res = enrichedResources.find(r => r.id === effectId) || this._resolveTrackedEffectResource(effectId, system);
        if (!res) continue;
        const pips = [];
        if (res.maxUses > 0) {
          for (let i = 0; i < res.maxUses; i++) pips.push({ available: i >= count, index: i });
        }
        usedMap[effectId] = {
          id: effectId, sourceName: res.sourceName, level: res.level,
          usageLimit: "encounter", usedCount: count, maxUses: res.maxUses,
          hasCap: res.maxUses > 0, isMaxed: res.maxUses > 0 && count >= res.maxUses, pips
        };
      }
    }
    context.combatUsedResources = Object.values(usedMap);

    // --- Transformation Rules panel data ---
    const tfMeta = system.transformationMeta || {};
    const tfRulesData = system.transformationRules || {};
    const allTransformations = [...(system.transformations || []), ...(system._gainedActiveTransformations || [])];

    const activeTransAll = allTransformations.filter(t => t.active);
    const activeEPs = activeTransAll.filter(t =>
      ["enhancement_standard", "enhancement_special", "enhancement_transcendent"].includes(t.transformationType)
    );
    const activeAFLFs = activeTransAll.filter(t =>
      t.transformationType === "form_alternate" || t.transformationType === "form_legendary"
    );
    // Full Suppression does not benefit from Legend Realized (Weakest State Level 3)
    const lrEligibleAFLFs = activeAFLFs.filter(t => t.catalogKey !== "full_suppression");

    const legendRealizedUsed = tfMeta.legendRealizedUsed || [];
    const legendRealizedEligible = lrEligibleAFLFs.filter(t => !legendRealizedUsed.includes(t.name));
    const nlopUsedEver = tfMeta.newLevelOfPowerUsed || [];
    const blockedNlopCatalogKeys = new Set(["full_suppression", "limited_suppression", "partial_suppression", "true_form"]);
    const nlopEligible = allTransformations.filter(t =>
      t.name &&
      !nlopUsedEver.includes(t.name) &&
      !blockedNlopCatalogKeys.has(t.catalogKey)
    );

    context.tfRules = {
      hasTransformations: allTransformations.length > 0,
      hasActiveTransformations: activeTransAll.length > 0,
      combinedStressTest: tfRulesData.combinedStressTest || 0,
      kiMultiplierActive: tfRulesData.kiMultiplierActive || false,
      turbulentPowerActive: tfRulesData.turbulentPowerActive || false,
      stepByStepReduction: tfRulesData.stepByStepReduction || 0,
      baseCapacityRestore: tfRulesData.baseCapacityRestore || 0,
      // Surging Strength
      surgingStrengthRound: tfMeta.surgingStrengthRound || 0,
      surgingStrengthEncounter: tfMeta.surgingStrengthEncounter || 0,
      heartbeatActive: system.aspectEffects?.heartbeatActive || false,
      surgingRoundLimit: (system.aspectEffects?.heartbeatActive) ? 3 : 1,
      surgingEncounterLimit: (system.aspectEffects?.heartbeatActive) ? "∞" : "3",
      surgingDisabled: (system.aspectEffects?.heartbeatActive)
        ? (tfMeta.surgingStrengthRound || 0) >= 3
        : ((tfMeta.surgingStrengthRound || 0) >= 1 || (tfMeta.surgingStrengthEncounter || 0) >= 3),
      gradedTransformations: system.aspectEffects?.gradedTransformations || [],
      noLpRegen: system.aspectEffects?.noLpRegen || false,
      crimsonAcclimationActive: system.aspectEffects?.crimsonAcclimationActive || false,
      // Burst Limit + Burst Through Your Limit
      hasActiveEPs: activeEPs.length > 0,
      burstLimitUsed: tfMeta.burstLimitUsed || false,
      burstLimitSource: tfMeta.burstLimitSource || "",
      // Burst Through: available if NLoP active for an EP this encounter
      burstThroughAvailable: (tfMeta.burstLimitUsed || false) &&
        (tfMeta.nlopActiveEncounter || []).some(name =>
          allTransformations.some(t => t.name === name &&
            ["enhancement_standard", "enhancement_special", "enhancement_transcendent"].includes(t.transformationType)
          )
        ),
      // Legend Realized (excludes Full Suppression — Weakest State Level 3)
      hasActiveAFLF: lrEligibleAFLFs.length > 0,
      legendRealizedCount: legendRealizedUsed.length,
      legendRealizedMax: lrEligibleAFLFs.length,
      legendRealizedAllUsed: legendRealizedEligible.length === 0 && lrEligibleAFLFs.length > 0,
      // New Level of Power
      nlopCount: nlopUsedEver.length,
      nlopHasEligible: nlopEligible.length > 0,
      nlopActiveEncounter: tfMeta.nlopActiveEncounter || [],
      nlopTierBoost: system.nlopTierBoost || 0
    };

    // --- Legendary Traits combat data ---
    const ltBonuses = system.legendaryTraitBonuses || { entries: [], hasBonuses: false };
    context.legendaryTraitsCombat = {
      hasBonuses: ltBonuses.hasBonuses,
      entries: ltBonuses.entries,
      totals: ltBonuses.totals || {},
      // Collect all triggered effects for buttons
      triggeredEffects: this._decorateTriggeredEffects(
        (ltBonuses.entries || []).flatMap(e =>
          (e.triggered || []).map(t => ({ ...t, sourceName: e.sourceName, catalogKey: e.catalogKey }))
        ),
        system,
        "lt"
      )
    };

    // God Maneuvers
    if (system.godKi?.active) {
      const godManeuversCatalog = CONFIG.DBU?.godManeuvers || {};
      const selectedIds = system.godManeuvers || [];
      context.godManeuverEntries = selectedIds
        .map(id => godManeuversCatalog[id])
        .filter(Boolean);
      context.godStrikeProfile = system.godStrikeProfile || "";
      const profileDataMap = CONFIG.DBU?.profileData || {};
      const profileOptions = {};
      for (const [key, data] of Object.entries(profileDataMap)) {
        profileOptions[key] = data.name || key;
      }
      context.profileOptions = profileOptions;
      context.godHasDivineAura = selectedIds.includes("divine_aura");
      context.godHasFinisher = selectedIds.includes("god_finisher");
    } else {
      context.godManeuverEntries = [];
      context.godHasDivineAura = false;
      context.godHasFinisher = false;
    }

    // Initiative Advantage (from active combat)
    const activeCombat = game.combat;
    let initiativeAdvantage = false;
    let doubleInitiativeAdvantage = false;
    let lowestInitiative = false;
    let currentInitiative = null;

    if (activeCombat) {
      const combatant = activeCombat.combatants.find(c => c.actorId === this.actor.id);
      if (combatant) {
        initiativeAdvantage = combatant.getFlag("DBU-MRR-OLD", "initiativeAdvantage") ?? false;
        doubleInitiativeAdvantage = combatant.getFlag("DBU-MRR-OLD", "doubleInitiativeAdvantage") ?? false;
        lowestInitiative = combatant.getFlag("DBU-MRR-OLD", "lowestInitiative") ?? false;
        currentInitiative = combatant.initiative;
      }
    }

    context.initiativeAdvantage = initiativeAdvantage;
    context.doubleInitiativeAdvantage = doubleInitiativeAdvantage;
    context.lowestInitiative = lowestInitiative;
    context.currentInitiative = currentInitiative;
    context.inCombat = !!activeCombat && currentInitiative !== null;

    // ---- Extra Dice Pools for Combat Tab ----
    const tier = system.tier || 1;
    const dp = system.dicePools || {};
    const topCat = dp.topCatBonus || {};
    const grCat = dp.greaterCatBonus || {};
    const grApply = dp.greaterApplyCount || {};
    const combatStates = system.combatStates || {};

    const resolveTop = (rollType) => {
      const catBonus = (topCat.global || 0) + (topCat[rollType] || 0);
      return this._resolveExtraDice(tier, 0, catBonus);
    };
    const isImpediment = (system.conditions || []).some(c => c.id === "impediment" && c.active);
    const resolveGreater = (rollType) => {
      if (isImpediment) return "";
      const hasGreater = combatStates.superior || (grApply.global || 0) > 0 || (grApply[rollType] || 0) > 0;
      if (!hasGreater) return "";
      const catBonus = (grCat.global || 0) + (grCat[rollType] || 0);
      return this._resolveExtraDice(tier, 1, catBonus);
    };

    context.dicePoolsSummary = {
      strike: { top: resolveTop("strike") || "--", greater: resolveGreater("strike") || "--" },
      wound:  { top: resolveTop("wound") || "--",  greater: resolveGreater("wound") || "--" },
      dodge:  { top: resolveTop("dodge") || "--",  greater: resolveGreater("dodge") || "--" }
    };
    context.dicePools = system.dicePools || {};
  }

  // -------------------------------------------------------
  // Fusion Data Prep
  // -------------------------------------------------------

  _prepareFusionData(context, system) {
    const fusion = system.fusion || {};
    const cfg = CONFIG.DBU || {};

    // Type flags
    context.fusionIsRegular = fusion.isFusion && fusion.type === "regular";
    context.fusionIsOneSided = fusion.isFusion && (fusion.type === "one-sided-absorption" || fusion.type === "one-sided-possession");
    context.fusionIsFission = fusion.isFusion && fusion.type === "fission";
    context.fusionIsTemporary = false;

    // Fusion method options
    const methods = cfg.fusionMethods || {};
    context.fusionMethodOptions = Object.values(methods).map(m => ({
      ...m, selected: fusion.method === m.id
    }));

    // Active method data
    context.fusionMethodData = methods[fusion.method] || null;
    if (context.fusionMethodData) {
      context.fusionIsTemporary = context.fusionMethodData.fusionType === "temporary";
    }
    context.fusionIsMetamorese = fusion.method === "metamorese";

    // Resolve linked actors
    const linkedIds = fusion.type === "fission"
      ? [fusion.originCharacterId, fusion.linkedSplitId].filter(Boolean)
      : (fusion.fusedCharacterIds || []);
    context.fusionLinkedActors = linkedIds.map(id => {
      const actor = game.actors?.get(id);
      if (!actor) return null;
      const s = actor.system || {};
      return {
        id: actor.id,
        name: actor.name,
        img: actor.img || "icons/svg/mystery-man.svg",
        level: s.level || 1,
        race: s.race || "",
        ag: s.attributes?.ag?.totalScore ?? s.attributes?.ag?.score ?? 0,
        fo: s.attributes?.fo?.totalScore ?? s.attributes?.fo?.score ?? 0,
        te: s.attributes?.te?.totalScore ?? s.attributes?.te?.score ?? 0,
        sc: s.attributes?.sc?.totalScore ?? s.attributes?.sc?.score ?? 0,
        in: s.attributes?.in?.totalScore ?? s.attributes?.in?.score ?? 0,
        ma: s.attributes?.ma?.totalScore ?? s.attributes?.ma?.score ?? 0,
        pe: s.attributes?.pe?.totalScore ?? s.attributes?.pe?.score ?? 0
      };
    }).filter(Boolean);

    // Attribute comparison for regular fusion
    if (context.fusionIsRegular && context.fusionLinkedActors.length) {
      const attrKeys = ["ag", "fo", "te", "sc", "in", "ma", "pe"];
      const labels = { ag: "Agility", fo: "Force", te: "Tenacity", sc: "Scholarship", in: "Insight", ma: "Magic", pe: "Personality" };
      context.fusionAttrComparison = attrKeys.map(key => {
        const values = context.fusionLinkedActors.map(a => a[key]);
        const maxVal = Math.max(...values);
        return {
          label: labels[key],
          values: context.fusionLinkedActors.map(a => ({
            score: a[key],
            isHighest: a[key] === maxVal
          })),
          fusionValue: maxVal
        };
      });

      // Derived fusion stats — must match _onRecalculateFusion formula
      const highestPL = Math.max(...context.fusionLinkedActors.map(a => a.level));
      const previewMethod = (CONFIG.DBU?.fusionMethods || {})[fusion.method];
      const previewIsTemp = previewMethod?.fusionType === "temporary";
      const previewPLBonus = previewIsTemp ? 5 : 2;
      context.fusionPowerLevel = Math.min(30, highestPL + previewPLBonus);
      const fusionTier = Math.min(7, this._tierFromLevel(context.fusionPowerLevel));
      context.fusionTier = fusionTier;
      const fusionBT = fusionTier;  // baseTier = tier from PL
      context.fusionLP = "Calculated from PL";
      context.fusionKP = "Calculated from PL";
      context.fusionCapacity = "Calculated from PL";
      context.fusionBonusTP = fusion.hasFusedTechnique ? (10 * fusionBT) : (10 * fusionBT + 20);
    }

    // Available racial traits from fused characters
    if (context.fusionIsRegular) {
      const selectedTraitIds = new Set(fusion.selectedRacialTraitIds || []);
      const allTraits = [];
      const traitCatalog = cfg.racialTraitsCatalog || {};
      for (const linkedActor of context.fusionLinkedActors) {
        const actorObj = game.actors?.get(linkedActor.id);
        if (!actorObj) continue;
        const actorTraitIds = actorObj.system?.racialTraits || [];
        for (const traitId of actorTraitIds) {
          // Find this trait in the catalog
          for (const [race, traits] of Object.entries(traitCatalog)) {
            const trait = traits.find(t => t.id === traitId);
            if (trait && !allTraits.find(t => t.id === traitId)) {
              allTraits.push({
                id: trait.id,
                name: trait.name,
                race: race,
                category: trait.traitCategory || "secondary",
                categoryLabel: (trait.traitCategory || "secondary").charAt(0).toUpperCase() + (trait.traitCategory || "secondary").slice(1),
                selected: selectedTraitIds.has(trait.id)
              });
            }
          }
        }
      }
      context.fusionAvailableTraits = allTraits;
      context.fusionSelectedTraitCount = allTraits.filter(t => t.selected).length;
    } else {
      context.fusionAvailableTraits = [];
      context.fusionSelectedTraitCount = 0;
    }

    // +1(bT) Boost Attribute selection (A2: choose 3 attrs for +1(bT) boost)
    if (context.fusionIsRegular) {
      const boostAttrs = new Set(fusion.fusionBoostAttrs || []);
      const attrOpts = ["ag", "fo", "te", "sc", "in", "ma", "pe"];
      const attrLabels2 = { ag: "Agility", fo: "Force", te: "Tenacity", sc: "Scholarship", in: "Insight", ma: "Magic", pe: "Personality" };
      context.fusionBoostAttrOptions = attrOpts.map(k => ({
        key: k, label: attrLabels2[k], selected: boostAttrs.has(k)
      }));
      context.fusionBoostAttrCount = boostAttrs.size;
      // Fusion-derived bonuses for display
      const f = system.fusion || {};
      context.fusionSameRaceBonus = f._sameRaceBonus || 0;
      context.fusionBreakthrough = f._fusionBreakthrough || false;
      context.fusionMissingTraitBonus = f._lastingMissingTraitBonus || 0;
      context.fusionMatchRaceBonus = f._lastingMatchRaceBonus || 0;
      context.fusionPLOverflow = f.plOverflow || 0;
      context.fusionRLM = f._fusionRLM || null;
      context.fusionAllProfSaves = f._fusionProficientSaves || [];

      // +2 Bonus Talents selection (fusion.txt line 19: Character Combination grants +2 talents)
      const bonusTalentIds = new Set(fusion.fusionBonusTalents || []);
      const talentCat = cfg.talentsCatalog || [];
      const existingTalentIds = new Set(system.talents || []);
      context.fusionBonusTalentOptions = talentCat
        .filter(t => !existingTalentIds.has(t.id) || bonusTalentIds.has(t.id))
        .sort((a, b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name))
        .map(t => ({
          id: t.id,
          name: t.name,
          category: t.category || "Other",
          selected: bonusTalentIds.has(t.id)
        }));
      context.fusionBonusTalentCount = bonusTalentIds.size;
    }

    // Size options
    const sizeOrder = ["tiny", "small", "medium", "large", "huge", "gigantic", "colossal"];
    const sizeLabels = { tiny: "Tiny", small: "Small", medium: "Medium", large: "Large", huge: "Huge", gigantic: "Gigantic", colossal: "Colossal" };
    if (context.fusionIsRegular && context.fusionLinkedActors.length) {
      const sizes = context.fusionLinkedActors.map(a => {
        const actor = game.actors?.get(a.id);
        return actor?.system?.baseSize || actor?.system?.status?.currentSize || "medium";
      });
      const minIdx = Math.min(...sizes.map(s => sizeOrder.indexOf(s)).filter(i => i >= 0));
      const maxIdx = Math.max(...sizes.map(s => sizeOrder.indexOf(s)).filter(i => i >= 0));
      context.fusionSizeOptions = sizeOrder.slice(minIdx, maxIdx + 1).map(s => ({
        value: s, label: sizeLabels[s] || s, selected: fusion.chosenSize === s
      }));
    } else {
      context.fusionSizeOptions = sizeOrder.map(s => ({
        value: s, label: sizeLabels[s] || s, selected: fusion.chosenSize === s
      }));
    }

    // Fusion modifier options
    const modifiers = cfg.fusionModifiers || {};
    const selectedMods = new Set(fusion.modifiers || []);
    const isTemp = context.fusionIsTemporary;
    context.fusionModifierLimit = isTemp ? "Up to 2 for Temporary" : "Up to 1 for Lasting";
    context.fusionModifierOptions = Object.values(modifiers).map(m => ({
      ...m, selected: selectedMods.has(m.id)
    }));
    context.fusionSelectedModifiers = (fusion.modifiers || [])
      .map(id => modifiers[id])
      .filter(Boolean);

    // One-Sided Fusion: suppressed actors with per-attribute bonuses
    if (context.fusionIsOneSided) {
      const suppIds = fusion.suppressedCharacterIds || fusion.fusedCharacterIds || [];
      const deeplySet = new Set(fusion.deeplySuppressed || []);
      const strugglingObj = fusion.strugglingStacks || {};
      const attrKeys = ["ag", "fo", "te", "sc", "in", "ma", "pe"];
      const attrLabels = { ag: "AG", fo: "FO", te: "TE", sc: "SC", in: "IN", ma: "MA", pe: "PE" };
      const isAbsorption = fusion.type === "one-sided-absorption";
      const isPossession = fusion.type === "one-sided-possession";

      // Read applied bonuses from actor.mjs derived data
      const appliedBonuses = fusion._appliedAttrBonuses || {};

      context.fusionSuppressedActors = suppIds.map(id => {
        const actor = game.actors?.get(id);
        if (!actor) return null;
        const s = actor.system || {};
        const stacks = strugglingObj[id] || 0;
        const cogSaveBonus = Math.floor(stacks / 3) * (system.tier || 1);

        // Per-attr scores from this suppressed character
        const perAttr = attrKeys.map(k => {
          const score = s.attributes?.[k]?.totalScore ?? s.attributes?.[k]?.score ?? 0;
          const bonus = Math.ceil(score / 4);
          return { key: k, label: attrLabels[k], score, bonus };
        });

        // Absorption/Possession: list suppressed actor's abilities for reference
        const abilities = {};
        if (isAbsorption || isPossession) {
          abilities.uniqueAbilities = (s.uniqueAbilities || []).map(u => u.name || u.abilityKey || "Unknown");
          abilities.auras = (s.signatureAuras || []).map(a => a.name || "Unknown");
          abilities.techniques = (s.signatureTechniques || []).map(t => t.name || "Unknown");
          abilities.transformations = (s.transformations || []).filter(t => t.name).map(t => t.name);
          // Secondary racial traits for the trait picker
          const traitCatalog3 = cfg.racialTraitsCatalog || {};
          const actorTraitIds = s.racialTraits || [];
          const chosenTraits = fusion.absorptionChosenTraits || {};
          const chosenForThis = chosenTraits[id] || "";
          abilities.secondaryTraits = [];
          for (const tId of actorTraitIds) {
            for (const [race, rTraits] of Object.entries(traitCatalog3)) {
              const trait = rTraits.find(t => t.id === tId);
              if (trait && (trait.traitCategory === "secondary")) {
                abilities.secondaryTraits.push({
                  id: trait.id,
                  name: trait.name,
                  race,
                  selected: chosenForThis === trait.id
                });
                break;
              }
            }
          }
        }

        return {
          id: actor.id,
          name: actor.name,
          img: actor.img || "icons/svg/mystery-man.svg",
          level: s.level || 1,
          race: s.race || "",
          perAttr,
          isDeeply: deeplySet.has(id),
          strugglingStacks: stacks,
          cogSaveBonus,
          abilities
        };
      }).filter(Boolean);

      // Possession-specific context
      if (isPossession && suppIds.length > 0) {
        const hostActor = game.actors?.get(suppIds[0]);
        if (hostActor) {
          context.fusionPossessionHost = {
            name: hostActor.name,
            race: hostActor.system?.race || "",
            size: hostActor.system?.baseSize || hostActor.system?.status?.currentSize || "medium",
            hostLP: fusion._hostCurrentLP ?? fusion.hostCurrentLP ?? hostActor.system?.lifePoints?.value ?? 0,
            hostMaxLP: fusion._hostMaxLP ?? hostActor.system?.lifePoints?.max ?? 0
          };
          // Per-attr breakdown: host score + 1/4 own
          context.fusionPossessionAttr = attrKeys.map(k => {
            const data = appliedBonuses[k];
            // AG/FO/TE/MA: object with hostScore/ownBonus/total/mode
            // SC/IN/PE: plain number (standard +ceil(host/4) bonus)
            if (typeof data === "object" && data !== null) {
              return {
                label: attrLabels[k],
                hostScore: data.hostScore ?? 0,
                ownBonus: data.ownBonus ?? 0,
                total: data.total ?? 0,
                isPossessionFull: true
              };
            }
            const bonus = data || 0;
            return {
              label: attrLabels[k],
              hostScore: "—",
              ownBonus: bonus,
              total: `+${bonus}`,
              isPossessionFull: false
            };
          });

          // Neo-Tuffle Parasite: host trait picker
          const liquidFormId = "0dda96aa0a5a229f";
          const ownTraits = system.racialTraits || [];
          if (ownTraits.includes(liquidFormId) || fusion._possessorOriginalRace === "neoTuffle") {
            const hostRace = hostActor.system?.race || "";
            const hostTraitIds = hostActor.system?.racialTraits || [];
            const traitCatalog2 = cfg.racialTraitsCatalog || {};
            const hostTraitOptions = [];
            for (const hId of hostTraitIds) {
              for (const [race, rTraits] of Object.entries(traitCatalog2)) {
                const trait = rTraits.find(t => t.id === hId);
                if (trait) {
                  hostTraitOptions.push({
                    id: trait.id,
                    name: trait.name,
                    category: (trait.traitCategory || "secondary").charAt(0).toUpperCase() + (trait.traitCategory || "secondary").slice(1),
                    selected: fusion.parasiteHostTraitId === trait.id
                  });
                  break;
                }
              }
            }
            context.fusionParasiteHostTraitOptions = hostTraitOptions;
            context.fusionIsParasitePossession = true;
          }

          // Primary Racial Trait Exchange (rules line 56)
          const traitExchange = fusion.possessionTraitExchange || {};
          const traitCatalogPTE = cfg.racialTraitsCatalog || {};
          // Dominant's primary traits
          const ownTraitIdsPTE = fusion._originalRacialTraits || system.racialTraits || [];
          context.possessionOwnPrimaryTraits = [];
          for (const tId of ownTraitIdsPTE) {
            for (const [race, rTraits] of Object.entries(traitCatalogPTE)) {
              const trait = rTraits.find(t => t.id === tId);
              if (trait && trait.traitCategory === "primary") {
                context.possessionOwnPrimaryTraits.push({
                  id: trait.id, name: trait.name, race,
                  selected: traitExchange.givenTraitId === trait.id
                });
                break;
              }
            }
          }
          // Host's primary traits
          const hostTraitIdsPTE = hostActor.system?.racialTraits || [];
          context.possessionHostPrimaryTraits = [];
          for (const hId of hostTraitIdsPTE) {
            for (const [race, rTraits] of Object.entries(traitCatalogPTE)) {
              const trait = rTraits.find(t => t.id === hId);
              if (trait && trait.traitCategory === "primary") {
                context.possessionHostPrimaryTraits.push({
                  id: trait.id, name: trait.name, race,
                  selected: traitExchange.takenTraitId === trait.id
                });
                break;
              }
            }
          }
        }
      }

      // Absorption limit: depends on Insatiable / Pursuit of Perfection / baseTier
      if (isAbsorption) {
        const limit = this.actor._getAbsorptionLimit(system);
        context.fusionAbsorptionLimit = limit;
        context.fusionAbsorptionOverLimit = suppIds.length >= limit;
        context.fusionAbsorptionLimitSource = this.actor._hasInsatiableActive(system) ? "Insatiable"
          : this.actor._hasPursuitOfPerfection(system) ? "Pursuit of Perfection"
          : null;

        // Shared Mutation MP: list suppressed actors that have Mutation (rules line 38)
        const dominantHasMutation = (system.transformations || []).some(t => t.catalogKey === "mutation");
        if (dominantHasMutation) {
          context.fusionMutationOptions = [];
          for (const suppId of suppIds) {
            const suppActorMut = game.actors?.get(suppId);
            if (!suppActorMut) continue;
            const suppTrans = suppActorMut.system?.transformations || [];
            const suppMutIdx = suppTrans.findIndex(t => t.catalogKey === "mutation");
            if (suppMutIdx < 0) continue;
            const suppOptions = suppActorMut.system?.transformationOptionSelections?.[String(suppMutIdx)] || {};
            const traitName = Object.values(suppOptions).find(v => typeof v === "string" && v !== "") || "Unknown";
            context.fusionMutationOptions.push({
              actorId: suppId,
              actorName: suppActorMut.name,
              traitName,
              selected: fusion.chosenMutationSourceId === suppId
            });
          }
        }

        // Majin Absorbed Apparel display (rules line 37)
        if (system.race === "majin") {
          const apparelData = fusion.absorbedApparel || {};
          if (apparelData.itemId) {
            const apparelItem = this.actor.items.get(apparelData.itemId);
            const sourceActor = game.actors?.get(apparelData.sourceActorId);
            context.fusionAbsorbedApparel = {
              itemName: apparelItem?.name || "Unknown Item",
              sourceName: sourceActor?.name || "Unknown",
              itemId: apparelData.itemId
            };
          }
          context.fusionIsMajinAbsorption = true;
        }
      }
    } else {
      context.fusionSuppressedActors = [];
    }

    // Fission
    if (context.fusionIsFission) {
      const fissionTraits = cfg.fissionTraits || {};
      context.fusionFissionTrait = fissionTraits[fusion.splitType] || null;
      // Origin and linked split actors
      if (fusion.originCharacterId) {
        const origin = game.actors?.get(fusion.originCharacterId);
        if (origin) {
          context.fusionOriginActor = {
            id: origin.id, name: origin.name, img: origin.img,
            level: origin.system?.level || 1, race: origin.system?.race || ""
          };
        }
      }
      if (fusion.linkedSplitId) {
        const split = game.actors?.get(fusion.linkedSplitId);
        if (split) {
          context.fusionLinkedSplit = {
            id: split.id, name: split.name, img: split.img,
            splitType: split.system?.fusion?.splitType || ""
          };
        }
      }
    }
  }

  _tierFromLevel(lvl) {
    if (lvl <= 4) return 1;
    if (lvl <= 9) return 2;
    if (lvl <= 14) return 3;
    if (lvl <= 19) return 4;
    if (lvl <= 24) return 5;
    if (lvl <= 29) return 6;
    return 7;
  }

  _getCombatResources(system) {
    const resources = [];
    const catalog = CONFIG.DBU ?? {};

    // 1. Racial traits
    const traitIds = system.racialTraits || [];
    const traitCatalog = catalog.racialTraitsCatalog || {};
    const allTraits = [];
    for (const [race, traits] of Object.entries(traitCatalog)) {
      for (const trait of traits) allTraits.push({ ...trait, race });
    }
    for (const id of traitIds) {
      const trait = allTraits.find(t => t.id === id);
      if (!trait) continue;
      const traitKey = trait.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      for (const eff of (trait.effects || [])) {
        if (["option", "multi-option", "choice"].includes(eff.activationType)) continue;
        const isTrackable = ["limited", "triggered"].includes(eff.activationType);
        resources.push({
          id: `racial_${trait.traitCategory}_${traitKey}_${eff.level}`,
          sourceName: trait.name,
          sourceType: "racial",
          level: eff.level || 0,
          activationType: eff.activationType || "passive",
          usageLimit: eff.usageLimit || (isTrackable ? "round" : null),
          maxUses: eff.maxUses || (eff.activationType === "limited" ? 1 : 0),
          keyword: eff.keyword || eff.activationType || "",
          text: eff.text || "",
          isTrackable
        });
      }
    }

    // 2. Talents
    const talentIds = system.talents || [];
    const talentCatalog = catalog.talentsCatalog || [];
    for (const id of talentIds) {
      const talent = talentCatalog.find(t => t.id === id);
      if (!talent) continue;
      const talentKey = talent.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      for (const eff of (talent.effects || [])) {
        if (["option", "multi-option", "choice"].includes(eff.activationType)) continue;
        const isTrackable = ["limited", "triggered"].includes(eff.activationType);
        resources.push({
          id: `talent_${talentKey}_${eff.level || 0}`,
          sourceName: talent.name,
          sourceType: "talent",
          level: eff.level || 0,
          activationType: eff.activationType || "passive",
          usageLimit: eff.usageLimit || (isTrackable ? "round" : null),
          maxUses: eff.maxUses || (eff.activationType === "limited" ? 1 : 0),
          keyword: eff.keyword || eff.activationType || "",
          text: eff.text || "",
          isTrackable
        });
      }
    }

    // 3. Unique abilities (own + gained from suppressed actors in OSF)
    const uniqueCatalog = catalog.uniqueAbilitiesCatalog || {};
    const allUAs = [...(system.uniqueAbilities || [])];
    const fusion = system.fusion || {};
    if (fusion.isFusion && (fusion.type === "one-sided-absorption" || fusion.type === "one-sided-possession")) {
      for (const suppId of (fusion.suppressedCharacterIds || [])) {
        const suppActor = game.actors?.get(suppId);
        if (suppActor) {
          for (const ua of (suppActor.system?.uniqueAbilities || [])) allUAs.push(ua);
        }
      }
    }
    for (const ua of allUAs) {
      const data = uniqueCatalog[ua.abilityKey];
      if (!data) continue;
      const abilityKey = data.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

      // Build combined effect text including selected advancements
      let effectText = data.effect || "";
      for (const adv of (ua.advancements || [])) {
        const advData = (data.advancements || []).find(a => a.id === adv.advancementId);
        if (advData) {
          effectText += `<br><br><strong>[${advData.name}]:</strong> ${advData.effect}`;
        }
      }

      // Base effect
      resources.push({
        id: `unique_${abilityKey}`,
        sourceName: data.name,
        sourceType: "unique",
        level: 1,
        activationType: "triggered",
        usageLimit: "round",
        maxUses: 1,
        keyword: `${data.maneuverType || "Standard"}, 1/Round`,
        text: effectText,
        isTrackable: true,
        actionType: "chat"
      });

      // Passive bonus
      if (data.passiveBonus) {
        resources.push({
          id: `unique_${abilityKey}_passive`,
          sourceName: `${data.name} (Passive)`,
          sourceType: "unique",
          level: 1,
          activationType: "passive",
          usageLimit: null,
          maxUses: 0,
          keyword: "Passive",
          text: data.passiveBonus,
          isTrackable: false
        });
      }
    }

    // 4. Transformation trait effects as combat resources (own + gained active)
    const transOptionSels = system.transformationOptionSelections || {};
    const allTransForResources = [...(system.transformations || []), ...(system._gainedActiveTransformations || [])];
    for (const [tIdx, trans] of allTransForResources.entries()) {
      if (!trans.active) continue;
      const tSelections = transOptionSels[tIdx] || {};

      const pushEffect = (eff, groupName, groupLevel) => {
        const isTrackable = ["limited", "triggered"].includes(eff.activationType);
        resources.push({
          id: `trans_${trans.id}_${groupLevel || 0}_${eff.keyword || ""}`,
          sourceName: trans.name || "Transformation",
          sourceType: "transformation",
          level: groupLevel || eff.level || 0,
          activationType: eff.activationType || "passive",
          keyword: eff.keyword || "Passive",
          text: eff.text || "",
          usageLimit: eff.usageLimit || null,
          maxUses: eff.maxUses || null,
          isTrackable
        });
      };

      for (const group of (trans.structuredTraits || [])) {
        for (const effect of (group.effects || [])) {
          if (effect.activationType === "option" && effect.options?.length > 0) {
            // Include the SELECTED option's sub-effects
            const effectKey = `${group.name || "trait"}_${effect.level || 0}`;
            const selectedName = tSelections[effectKey] || effect.options[0]?.name;
            const selectedOpt = effect.options.find(o => o.name === selectedName);
            if (selectedOpt) pushEffect(selectedOpt, group.name, group.level);
          } else if (effect.activationType === "multi-option" && effect.options?.length > 0) {
            // Include ALL selected multi-option sub-effects
            const effectKey = `${group.name || "trait"}_${effect.level || 0}`;
            const selectedArr = Array.isArray(tSelections[effectKey]) ? tSelections[effectKey] : [];
            for (const optName of selectedArr) {
              const opt = effect.options.find(o => o.name === optName);
              if (opt) pushEffect(opt, group.name, group.level);
            }
          } else if (effect.activationType === "choice" && effect.options?.length > 0) {
            // Include the matching choice sub-effect
            const parentKey = effect.parentOptionKey || "";
            const parentSelected = tSelections[parentKey] || "";
            const matchingOpt = effect.options.find(o => o.name === parentSelected);
            if (matchingOpt) pushEffect(matchingOpt, group.name, group.level);
          } else if (!["option", "multi-option", "choice"].includes(effect.activationType)) {
            pushEffect(effect, group.name, group.level);
          }
        }
      }
    }

    // 5. Equipment combat penalty as passive resource
    const eqPenalty = system.equipment?.combatPenalty || 0;
    if (eqPenalty > 0) {
      resources.push({
        id: "eq_combat_penalty",
        sourceName: "Equipment",
        sourceType: "equipment",
        level: 0,
        activationType: "passive",
        keyword: "Passive",
        text: `Combat Roll Penalty: -${eqPenalty}`,
        usageLimit: null,
        maxUses: null,
        isTrackable: false
      });
    }

    // 6. Unique ability restrictions as passive reference items (own + gained)
    for (const ua of allUAs) {
      const data = uniqueCatalog[ua.abilityKey];
      if (!data) continue;
      for (const sel of (ua.restrictions || [])) {
        const resData = (data.restrictions || []).find(r => r.id === sel.restrictionId);
        if (!resData) continue;
        resources.push({
          id: `unique_${ua.abilityKey}_res_${sel.restrictionId}`,
          sourceName: data.name || ua.abilityKey,
          sourceType: "unique",
          level: 0,
          activationType: "passive",
          keyword: "Restriction",
          text: resData.effect || resData.name || "",
          usageLimit: null,
          maxUses: null,
          isTrackable: false
        });
      }
    }

    return resources;
  }

  /** Default combat conditions with current state from system data. */
  _getCombatConditions(system) {
    const defaults = [
      { id: "blinded", name: "Blinded", maxStacks: 1, effect: "No Sight. Illuminating Aura cannot reduce or remove this." },
      { id: "broken", name: "Broken", maxStacks: 3, effect: "Soak \u22122(T)/stack. If Soak=0, +2(T) damage received/stack." },
      { id: "compelled", name: "Compelled", maxStacks: 1, effect: "Must target assigned character. Ki Wager 6(bT) min. 2 Actions/turn attacking target. Combat Rolls become Urgent. Fail = lose 6(bT) LP." },
      { id: "fatigued", name: "Fatigued", maxStacks: 2, effect: "Halve Max Capacity per stack." },
      { id: "guardDown", name: "Guard Down", maxStacks: 1, effect: "Defense Value & Defend Strike \u22122(T). Guard KP cost +50%." },
      { id: "impediment", name: "Impediment", maxStacks: 1, effect: "Reduce Dice Score of Combat Rolls by Greater Dice (roll separately, subtract). Cancels with Greater Dice." },
      { id: "oblivious", name: "Oblivious", maxStacks: 1, effect: "Assign to character. Can\u2019t target them (except AoE). Soak \u22122(T), Dodge \u22121(T), Strike \u22123(T) vs them. Lose if hit or targeted 2+ times/round." },
      { id: "pinned", name: "Pinned", maxStacks: 1, effect: "Actions reduced to 1/round. No Attacking Maneuvers or Movement. 1 Action: Might Clash to escape." },
      { id: "poisoned", name: "Poisoned", maxStacks: 1, effect: "Lose 1/10 Max LP at end of turn. Double Health Threshold Penalties." },
      { id: "prone", name: "Prone", maxStacks: 1, effect: "Speed, Defense, Haste halved. Damage Category +1 step. 1 Action to stand." },
      { id: "shaken", name: "Shaken", maxStacks: 1, effect: "Can\u2019t move toward source. Strike Rolls \u22122(T)." },
      { id: "sleeping", name: "Sleeping", maxStacks: 1, effect: "Can\u2019t use Maneuvers. Auto-hit by attacks. Lose condition if hit. Karma Point to defend normally." },
      { id: "slowed", name: "Slowed", maxStacks: 3, effect: "\u22121 Action/round and Speed \u22121/3 per stack. 3 stacks: turn skipped, no Maneuvers." },
      { id: "stressExhaustion", name: "Stress Exhaustion", maxStacks: 1, effect: "Leave all Transformations. KP halved if in Core Trans. Can\u2019t transform." },
      { id: "suffocating", name: "Suffocating", maxStacks: 1, effect: "Lose 1/5 Max LP at end of each turn." }
    ];

    const conditions = system.conditions || [];

    return defaults.map(def => {
      const stored = conditions.find(c => c.id === def.id);
      return {
        ...def,
        active: stored?.active ?? false,
        stacks: stored?.stacks ?? 0
      };
    });
  }

  // -------------------------------------------------------
  // Racial Requirement Helpers (OSF Gained Transformations)
  // -------------------------------------------------------

  /**
   * Check if a race ID meets a catalog racialRequirement string.
   * @param {string} raceId - system.race value (e.g. "saiyan", "bioAndroid")
   * @param {string} requirement - catalog racialRequirement (e.g. "Saiyan", "Any (except Bio-Android)")
   * @returns {boolean}
   */
  _meetsRacialRequirement(raceId, requirement) {
    if (!requirement) return true;
    const req = requirement.trim();
    if (req === "Any" || req === "Any Race") return true;

    // "Any (except X)" pattern
    const exceptMatch = req.match(/^Any\s*\(except\s+(.+)\)$/i);
    if (exceptMatch) {
      const excluded = exceptMatch[1].trim();
      return !this._raceMatchesLabel(raceId, excluded);
    }

    // Direct race match
    return this._raceMatchesLabel(raceId, req);
  }

  /**
   * Check if a camelCase race ID matches a display-name label.
   * Handles inconsistencies like "Bio-Androids" vs "Bio-Android" vs "bioAndroid".
   */
  _raceMatchesLabel(raceId, label) {
    const raceMap = {
      saiyan: "saiyan", earthling: "earthling", namekian: "namekian",
      android: "android", bioAndroid: "bio-android", majin: "majin",
      arcosian: "arcosian", shinjin: "shinjin", cerealian: "cerealian",
      neoTuffle: "neo-tuffle", nekoMajin: "neko majin",
      shadowDragon: "shadow dragon", undead: "undead"
    };
    const normalized = (raceMap[raceId] || raceId).toLowerCase();
    const target = label.toLowerCase().replace(/s$/, ""); // strip trailing 's' ("Bio-Androids" → "Bio-Android")
    return normalized === target || normalized === target.replace(/-/g, " ");
  }

  // -------------------------------------------------------
  // Existing Helpers
  // -------------------------------------------------------

  _getSubspeciesLabel(system) {
    const race = system.race || "saiyan";
    const factors = CONFIG.DBU?.racialFactors?.[race] || [];
    const match = factors.find(f => f.id === system.subspecies);
    return match?.name || "";
  }

  // -------------------------------------------------------
  // Data Prep: Racial Bonus Display
  // -------------------------------------------------------

  _prepareRacialBonusData(context, system) {
    const race = system.race || "";
    context.isSaiyan = (race === "saiyan");
    context.isEarthling = (race === "earthling");
    context.isMajin = (race === "majin");
    context.isBioAndroid = (race === "bioAndroid");
    context.isAndroid = (race === "android");
    context.isArcosian = (race === "arcosian");
    context.isCerealian = (race === "cerealian");
    context.isNamekian = (race === "namekian");
    context.isNekoMajin = (race === "nekoMajin");
    context.isNeoTuffle = (race === "neoTuffle");
    context.isShadowDragon = (race === "shadowDragon");
    context.isShinjin = (race === "shinjin");
    context.isUndead = (race === "undead");

    // ---- Saiyan: Battle Born ----
    if (context.isSaiyan) {
      const bb = system.battleBorn || { strike: 0, dodge: 0, wound: 0, undying: false, cap: 2, total: 0, maxTotal: 6 };
      const cap = bb.cap || (bb.undying ? 3 : 2);

      const makePips = (count, max) => {
        const pips = [];
        for (let i = 0; i < max; i++) pips.push({ filled: i < count });
        return pips;
      };

      context.bbStrikePips = makePips(bb.strike, cap);
      context.bbDodgePips = makePips(bb.dodge, cap);
      context.bbWoundPips = makePips(bb.wound, bb.woundCap || cap);
      context.racialBonuses = system.racialBonuses || { has: {} };
      context.hasRacialBonuses = Object.values(context.racialBonuses.has || {}).some(v => v);
      context.battleBornTraitId = "908d85ede236e3ce";
    }

    // ---- Earthling: Resolve, Experienced Fighter, Three-Eyes, Part Beast ----
    if (context.isEarthling) {
      const eb = system.earthlingBonuses || { has: {} };
      context.earthlingBonuses = eb;
      context.hasEarthlingBonuses = Object.values(eb.has || {}).some(v => v);

      // Experienced Fighter state
      const ef = system.experiencedFighter || { mode: "none", usedThisRound: false };
      context.efMode = ef.mode;
      context.efUsedThisRound = ef.usedThisRound;
      context.efCanActivate = eb.has?.experiencedFighter && !ef.usedThisRound;
    }

    // ---- Majin: Bouncy, Assimilation, Bouncy Physique, Super Regen, Mass-Shift, Transfig, Roomy ----
    if (context.isMajin) {
      const mb = system.majinBonuses || { has: {} };
      context.majinBonuses = mb;
      context.hasMajinBonuses = Object.values(mb.has || {}).some(v => v);
    }

    // ---- Bio-Android: Power Core, Red Eye, Namekian Cells, Genetic Efficiency, Genetic Mod ----
    if (context.isBioAndroid) {
      const ba = system.bioAndroidBonuses || { has: {} };
      context.bioAndroidBonuses = ba;
      context.hasBioAndroidBonuses = Object.values(ba.has || {}).some(v => v);
    }

    // ---- Android: Damage Inhibitor, Lock On, Energy Core ----
    if (context.isAndroid) {
      const ab = system.androidBonuses || { has: {} };
      context.androidBonuses = ab;
      context.hasAndroidBonuses = Object.values(ab.has || {}).some(v => v);
    }

    // ---- Arcosian: Survivor, Keratinous Plating ----
    if (context.isArcosian) {
      const arc = system.arcosianBonuses || { has: {} };
      context.arcosianBonuses = arc;
      context.hasArcosianBonuses = Object.values(arc.has || {}).some(v => v);
    }

    // ---- Cerealian: Evolved Right Eye, Pinpoint Combat, Scarlet Spotter ----
    if (context.isCerealian) {
      const cer = system.cerealianBonuses || { has: {} };
      context.cerealianBonuses = cer;
      context.hasCerealianBonuses = Object.values(cer.has || {}).some(v => v);
    }

    // ---- Namekian: Biology, Intelligent Fighter, Resilience, Refined Combat, Spirit of Namek ----
    if (context.isNamekian) {
      const nam = system.namekianBonuses || { has: {} };
      context.namekianBonuses = nam;
      context.hasNamekianBonuses = Object.values(nam.has || {}).some(v => v);
    }

    // ---- Neko Majin: Feline Build ----
    if (context.isNekoMajin) {
      const nk = system.nekoMajinBonuses || { has: {} };
      context.nekoMajinBonuses = nk;
      context.hasNekoMajinBonuses = Object.values(nk.has || {}).some(v => v);
    }

    // ---- Neo-Tuffle: Energy of Revenge, Manufactured Physique, Hate Empowerment, Power Hungry ----
    if (context.isNeoTuffle) {
      const nt = system.neoTuffleBonuses || { has: {} };
      context.neoTuffleBonuses = nt;
      context.hasNeoTuffleBonuses = Object.values(nt.has || {}).some(v => v);
    }

    // ---- Shadow Dragon: Wrath, Supernatural Powers ----
    if (context.isShadowDragon) {
      const sd = system.shadowDragonBonuses || { has: {} };
      context.shadowDragonBonuses = sd;
      context.hasShadowDragonBonuses = Object.values(sd.has || {}).some(v => v);
    }

    // ---- Shinjin: Cosmic Efficiency, Arcane Affinity, Light/Dark Magic ----
    if (context.isShinjin) {
      const sh = system.shinjinBonuses || { has: {} };
      context.shinjinBonuses = sh;
      context.hasShinjinBonuses = Object.values(sh.has || {}).some(v => v);
    }

    // ---- Undead: Undead Survival ----
    if (context.isUndead) {
      const ud = system.undeadBonuses || { has: {} };
      context.undeadBonuses = ud;
      context.hasUndeadBonuses = Object.values(ud.has || {}).some(v => v);
    }

    // ---- Collect racial trait triggered effects for combat tab ----
    const raceBonusMap = {
      racialBonuses: "Saiyan",
      earthlingBonuses: "Earthling",
      majinBonuses: "Majin",
      bioAndroidBonuses: "Bio-Android",
      androidBonuses: "Android",
      arcosianBonuses: "Arcosian",
      cerealianBonuses: "Cerealian",
      namekianBonuses: "Namekian",
      nekoMajinBonuses: "Neko Majin",
      neoTuffleBonuses: "Neo-Tuffle",
      shadowDragonBonuses: "Shadow Dragon",
      shinjinBonuses: "Shinjin",
      undeadBonuses: "Undead"
    };
    const allRacialTriggered = [];
    for (const [key, raceName] of Object.entries(raceBonusMap)) {
      const bonuses = system[key];
      if (bonuses?.triggered) {
        for (const t of bonuses.triggered) {
          allRacialTriggered.push({ ...t, sourceName: raceName });
        }
      }
    }
    context.rtTriggeredEffects = this._decorateTriggeredEffects(allRacialTriggered, system, "rt");
  }

  // -------------------------------------------------------
  // Data Prep: Manifested Power Bonus Display
  // -------------------------------------------------------

  _prepareManifestedPowerData(context, system) {
    const mpData = system.manifestedPowerBonuses || { entries: [], hasBonuses: false, totals: {} };
    context.manifestedPowerBonuses = mpData;
    context.hasManifestedPowers = mpData.hasBonuses && mpData.entries.length > 0;
    // Collect triggered effects for combat buttons
    context.mpTriggeredEffects = this._decorateTriggeredEffects(
      (mpData.entries || []).flatMap(e =>
        (e.triggered || []).map(t => ({ ...t, sourceName: e.name, catalogKey: e.catalogKey }))
      ),
      system,
      "mp"
    );
    // Collect per-round resource entries
    context.mpPerRoundEffects = (mpData.entries || []).flatMap(e =>
      (e.perRound || []).map(pr => ({ ...pr, sourceName: e.name, catalogKey: e.catalogKey }))
    );
  }

  // -------------------------------------------------------
  // Data Prep: Talent Bonus Display
  // -------------------------------------------------------

  _prepareTalentBonusData(context, system) {
    const tbData = system.talentBonuses || { entries: [], hasBonuses: false, totals: {} };
    context.talentBonuses = tbData;
    context.hasTalentBonuses = tbData.hasBonuses && tbData.entries.length > 0;
    context.talentTriggeredEffects = this._decorateTriggeredEffects(
      (tbData.entries || []).flatMap(e =>
        (e.triggered || []).map(t => ({ ...t, sourceName: e.name, catalogKey: e.catalogKey }))
      ),
      system,
      "tb"
    );
    context.talentPerRoundEffects = (tbData.entries || []).flatMap(e =>
      (e.perRound || []).map(pr => ({ ...pr, sourceName: e.name, catalogKey: e.catalogKey }))
    );
    const talentIds = new Set(system.talents || []);
    context.talentStanceButtons = [
      {
        id: "combat_expertise",
        name: "Combat Expertise Shift",
        visible: talentIds.has("combat_expertise")
      },
      {
        id: "balanced_defender",
        name: "Balanced Defender Shift",
        visible: talentIds.has("balanced_defender")
      }
    ].filter(btn => btn.visible);
  }

  // -------------------------------------------------------
  // Data Prep: Enhancement Power Bonus Display
  // -------------------------------------------------------

  _prepareEnhancementPowerData(context, system) {
    const epData = system.enhancementPowerBonuses || { entries: [], hasBonuses: false, totals: {} };
    context.enhancementPowerBonuses = epData;
    context.hasEnhancementPowers = epData.hasBonuses && epData.entries.length > 0;
    context.epTriggeredEffects = this._decorateTriggeredEffects(
      (epData.entries || []).flatMap(e =>
        (e.triggered || []).map(t => ({ ...t, sourceName: e.name, catalogKey: e.catalogKey }))
      ),
      system,
      "ep"
    );
    context.epPerRoundEffects = (epData.entries || []).flatMap(e =>
      (e.perRound || []).map(pr => ({ ...pr, sourceName: e.name, catalogKey: e.catalogKey }))
    );

    // Evil Aura panel: shown when transformation is active. Shows EP count and toggle button.
    const evilAuraActive = (system.transformations || []).some(
      t => t.active && t.catalogKey === "evil_aura"
    );
    context.evilAuraActive = evilAuraActive;
    context.evilTechsActive = !!system.transformationMeta?.evilTechsActive;
    context.evilPoints = system.transformationMeta?.evilPoints || 0;
    context.evilAuraTechniqueCost = 2 * (system.baseTier || 1);
  }

  _prepareAlternateFormData(context, system) {
    const afData = system.alternateFormBonuses || { entries: [], hasBonuses: false, totals: {} };
    context.alternateFormBonuses = afData;
    context.hasAlternateForms = afData.hasBonuses && afData.entries.length > 0;
    context.afTriggeredEffects = this._decorateTriggeredEffects(
      (afData.entries || []).flatMap(e =>
        (e.triggered || []).map(t => ({ ...t, sourceName: e.name, catalogKey: e.catalogKey }))
      ),
      system,
      "af"
    );
    context.afPerRoundEffects = (afData.entries || []).flatMap(e =>
      (e.perRound || []).map(pr => ({ ...pr, sourceName: e.name, catalogKey: e.catalogKey }))
    );
  }

  _prepareLegendaryFormData(context, system) {
    const lfData = system.legendaryFormBonuses || { entries: [], hasBonuses: false, totals: {} };
    context.legendaryFormBonuses = lfData;
    context.hasLegendaryForms = lfData.hasBonuses && lfData.entries.length > 0;
    context.lfTriggeredEffects = this._decorateTriggeredEffects(
      (lfData.entries || []).flatMap(e =>
        (e.triggered || []).map(t => ({ ...t, sourceName: e.name, catalogKey: e.catalogKey }))
      ),
      system,
      "lf"
    );
    context.lfPerRoundEffects = (lfData.entries || []).flatMap(e =>
      (e.perRound || []).map(pr => ({ ...pr, sourceName: e.name, catalogKey: e.catalogKey }))
    );
  }

  _decorateTriggeredEffects(effects, system, prefix) {
    const usage = system.combatTabState?.resourceUsage || {};
    const roundUsage = usage.round || {};
    const encounterUsage = usage.encounter || {};
    return effects.map(effect => {
      const trackingId = `${prefix}:${effect.id}`;
      const usageKey = effect.usageLimit === "encounter" ? "encounter" : "round";
      const usedCount = (usageKey === "encounter" ? encounterUsage : roundUsage)[trackingId] || 0;
      const maxUses = effect.maxUses || 0;
      return {
        ...effect,
        trackingId,
        usedCount,
        isMaxed: maxUses > 0 && usedCount >= maxUses
      };
    });
  }

  _resolveTrackedEffectResource(effectId, system) {
    const [prefix, rawId] = String(effectId).split(":");
    if (!prefix || !rawId) return null;

    const maps = {
      tb: {
        sourceType: "talent",
        entries: system.talentBonuses?.entries || []
      },
      mp: {
        sourceType: "transformation",
        entries: system.manifestedPowerBonuses?.entries || []
      },
      ep: {
        sourceType: "transformation",
        entries: system.enhancementPowerBonuses?.entries || []
      },
      af: {
        sourceType: "transformation",
        entries: system.alternateFormBonuses?.entries || []
      },
      lf: {
        sourceType: "transformation",
        entries: system.legendaryFormBonuses?.entries || []
      },
      lt: {
        sourceType: "racial",
        entries: system.legendaryTraitBonuses?.entries || []
      }
    };

    const group = maps[prefix];
    if (!group) return null;

    for (const entry of group.entries) {
      const trigger = (entry.triggered || []).find(t => t.id === rawId);
      if (!trigger) continue;
      return {
        id: effectId,
        sourceName: entry.name || entry.sourceName || trigger.name,
        sourceType: group.sourceType,
        level: trigger.level || 0,
        activationType: "triggered",
        usageLimit: trigger.usageLimit || "round",
        maxUses: trigger.maxUses || 0,
        keyword: trigger.name || "Triggered",
        text: trigger.description || "",
        isTrackable: true
      };
    }

    return null;
  }

  // -------------------------------------------------------
  // Battle Born Stack Handlers
  // -------------------------------------------------------

  async _onBBIncrement(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.bbType;
    if (!type) return;
    const bb = foundry.utils.deepClone(this.actor.system.battleBorn || {});
    const cap = type === "wound" ? (bb.woundCap ?? bb.cap ?? 2) : (bb.cap ?? (bb.undying ? 3 : 2));
    const current = bb[type] ?? 0;
    if (current >= cap) return;
    bb[type] = current + 1;
    await this.actor.update({ "system.battleBorn": bb });
  }

  async _onBBDecrement(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.bbType;
    if (!type) return;
    const bb = foundry.utils.deepClone(this.actor.system.battleBorn || {});
    const current = bb[type] ?? 0;
    if (current <= 0) return;
    bb[type] = current - 1;
    await this.actor.update({ "system.battleBorn": bb });
  }

  /**
   * Grant a Battle Born stack via dialog (asks user where to allocate).
   * Only fires if the character is a Saiyan with the Battle Born trait and has room.
   * @param {string} source - Description of why the stack is being granted (e.g. "Even Round 2")
   */
  async _battleBornGrantStack(source) {
    const system = this.actor.system;
    if (system.race !== "saiyan") return;
    const traitIds = system.racialTraits || [];
    if (!traitIds.includes("908d85ede236e3ce")) return; // Battle Born trait ID

    const bb = system.battleBorn || { strike: 0, dodge: 0, wound: 0, undying: false };
    const cap = bb.cap ?? (bb.undying ? 3 : 2);
    const woundCap = bb.woundCap ?? cap;

    // Check if there's room on any roll
    const canStrike = (bb.strike ?? 0) < cap;
    const canDodge = (bb.dodge ?? 0) < cap;
    const canWound = (bb.wound ?? 0) < woundCap;
    if (!canStrike && !canDodge && !canWound) {
      ui.notifications.warn("Battle Born: All combat rolls are at max stacks!");
      await this._applyBattleBornOverflowSideEffects(source);
      return "maxed";
    }

    // Build dialog buttons
    const buttons = {};
    if (canStrike) buttons.strike = { label: `Strike (${bb.strike ?? 0}/${cap})`, callback: () => "strike" };
    if (canDodge) buttons.dodge = { label: `Dodge (${bb.dodge ?? 0}/${cap})`, callback: () => "dodge" };
    if (canWound) buttons.wound = { label: `Wound (${bb.wound ?? 0}/${woundCap})`, callback: () => "wound" };

    const choice = await Dialog.wait({
      title: "Battle Born — Allocate Stack",
      content: `<p><strong>${source}:</strong> Gain 1 stack of Battle Born. Where do you want to allocate it?</p>`,
      buttons,
      close: () => null
    });

    if (!choice) return "cancelled";
    const updated = foundry.utils.deepClone(system.battleBorn || {});
    updated[choice] = (updated[choice] ?? 0) + 1;
    await this.actor.update({ "system.battleBorn": updated });
    await this._applyBattleBornGainSideEffects(source);
    ui.notifications.info(`Battle Born: +1 stack to ${choice.charAt(0).toUpperCase() + choice.slice(1)} (${source})`);
    return "granted";
  }

  // -------------------------------------------------------
  // Experienced Fighter Handler (Earthling)
  // -------------------------------------------------------

  async _onExperiencedFighterActivate(event) {
    event.preventDefault();
    const mode = event.currentTarget.dataset.efMode;
    if (!mode || mode === "none") return;

    const system = this.actor.system;
    const ef = system.experiencedFighter || {};

    // Prevent double activation in same round
    if (ef.usedThisRound) {
      ui.notifications.warn("Experienced Fighter: Already used this round!");
      return;
    }

    // Check Ki cost: 4(bT)
    const baseTier = system.baseTier || Math.ceil((system.tier || 1) / 2);
    const kiCost = 4 * baseTier;
    const currentKi = system.kiPool?.value ?? 0;
    if (currentKi < kiCost) {
      ui.notifications.warn(`Experienced Fighter: Not enough Ki! Need ${kiCost}, have ${currentKi}.`);
      return;
    }

    // Deduct Ki and activate mode
    await this.actor.update({
      "system.experiencedFighter.mode": mode,
      "system.experiencedFighter.usedThisRound": true,
      "system.kiPool.value": currentKi - kiCost
    });

    const labels = { strike: "Exploitation Strike", dodge: "Instinct-Driven Dodge", wound: "Punishing Blow" };
    ui.notifications.info(`Experienced Fighter: ${labels[mode]} activated! (−${kiCost} Ki)`);
  }

  async _onExperiencedFighterDeactivate(event) {
    event.preventDefault();
    // Allow deactivating but keep usedThisRound true (Ki already spent, can't reuse)
    await this.actor.update({
      "system.experiencedFighter.mode": "none"
    });
  }

  // -------------------------------------------------------
  // Data Prep: Adversary
  // -------------------------------------------------------

  _prepareAdversaryData(context, system) {
    const adv = system.adversary || {};
    if (!adv.enabled) {
      context.adversaryTraits = [];
      context.adversaryWeaknesses = [];
      context.minionTraitsData = [];
      context.adversaryLPBonus = 0;
      context.adversaryKPBonus = 0;
      return;
    }

    // LP/KP bonus display values
    const pl = system.level || 1;
    switch (adv.category) {
      case "villain":  context.adversaryLPBonus = 4 * pl; context.adversaryKPBonus = 4 * pl; break;
      case "superior": context.adversaryLPBonus = 2 * pl; context.adversaryKPBonus = 2 * pl; break;
      case "mook":     context.adversaryLPBonus = "\u00f74"; context.adversaryKPBonus = "\u00f72"; break;
      default:         context.adversaryLPBonus = 0; context.adversaryKPBonus = 0; break;
    }

    // Villainous Traits
    const vtCatalog = CONFIG.DBU?.villainousTraitsCatalog || [];
    const vtSelectedIds = adv.villainousTraits || [];
    const vtOptions = adv.villainousOptionSelections || {};
    context.adversaryTraits = [];
    for (const id of vtSelectedIds) {
      const traitData = vtCatalog.find(t => t.id === id);
      if (!traitData) continue;
      const trait = foundry.utils.deepClone(traitData);
      const traitSelections = vtOptions[id] || {};
      for (const effect of (trait.effects || [])) {
        if (effect.options && (effect.activationType === "option" || effect.activationType === "choice")) {
          const selected = traitSelections[effect.level];
          for (const opt of effect.options) opt.selected = (opt.name === selected);
          if (!effect.options.some(o => o.selected) && effect.options.length > 0) effect.options[0].selected = true;
        }
      }
      context.adversaryTraits.push(trait);
    }

    // Weaknesses
    const wkCatalog = CONFIG.DBU?.weaknessesCatalog || [];
    const wkSelectedIds = adv.weaknesses || [];
    context.adversaryWeaknesses = [];
    for (const id of wkSelectedIds) {
      const wkData = wkCatalog.find(w => w.id === id);
      if (!wkData) continue;
      context.adversaryWeaknesses.push(foundry.utils.deepClone(wkData));
    }

    // Minion Traits
    const mtCatalog = CONFIG.DBU?.minionTraitsCatalog || [];
    const mtSelectedIds = adv.minion?.minionTraits || [];
    context.minionTraitsData = [];
    for (const id of mtSelectedIds) {
      const mtData = mtCatalog.find(m => m.id === id);
      if (!mtData) continue;
      context.minionTraitsData.push(foundry.utils.deepClone(mtData));
    }
  }

  // -------------------------------------------------------
  // Data Prep: Downtime
  // -------------------------------------------------------

  _prepareDowntimeData(context, system) {
    const dt = system.downtime || {};
    const period = dt.currentPeriod || {};
    const lifetime = dt.lifetimeUses || {};
    const history = dt.history || [];

    context.dtPeriodActive = period.active || false;
    context.dtTotalDT = period.totalDT || 0;
    context.dtSpentDT = period.spentDT || 0;
    context.dtRemainingDT = (period.totalDT || 0) - (period.spentDT || 0);

    const activitiesUsed = period.activitiesUsed || [];
    const modifiersUsed = period.modifiersUsed || [];

    // Has Mentor modifier? Allows using same activity more than once
    const hasMentor = modifiersUsed.includes("mentor");
    // Has Deep Focus? Allows using recreational twice
    const hasDeepFocus = modifiersUsed.includes("deepFocus");

    // Check if a training-type activity was used this period
    const trainingActivitiesUsed = activitiesUsed.filter(a =>
      ["basicTraining", "techniqueTraining", "reinforcingForm", "unlockingForm",
       "transformationTraining", "heartbeatTraining"].includes(a)
    );
    const recreationalActivitiesUsed = activitiesUsed.filter(a =>
      ["resting", "studying", "baseBuilding"].includes(a)
    );

    const hasTrainingActivity = trainingActivitiesUsed.length > 0;
    const hasRecreationalActivity = recreationalActivitiesUsed.length > 0;

    // Activity definitions
    const allActivities = [
      { id: "basicTraining", name: "Basic Training", cost: 1, type: "Training", limit: 4, lifetimeKey: "basicTraining",
        effect: "Gain 2 Attribute Points to spend on any Attribute except SC or PE." },
      { id: "techniqueTraining", name: "Technique Training", cost: 1, type: "Training", limit: 4, lifetimeKey: "techniqueTraining",
        effect: "Gain 15 Technique Points to spend immediately." },
      { id: "reinforcingForm", name: "Reinforcing Form", cost: 2, type: "Training", limit: "N/A", lifetimeKey: null,
        effect: "Gain Mastery over an Alternate/Legendary Form or apply Power Improvement to an Enhancement Power." },
      { id: "unlockingForm", name: "Unlocking Form", cost: 2, type: "Training", limit: "N/A", lifetimeKey: null,
        effect: "Gain access to a Transformation you meet the Prerequisites, Tier, and Racial Requirement of." },
      { id: "transformationTraining", name: "Transformation Training", cost: 2, type: "Training", limit: 2, lifetimeKey: "transformationTraining",
        effect: "Increase your Stress Bonus by 1." },
      { id: "heartbeatTraining", name: "Heartbeat Training", cost: 1, type: "Training", limit: 1, lifetimeKey: "heartbeatTraining",
        effect: "Select a Transformation you possess that lacks Dedicated and Heartbeat Aspects. It gains Heartbeat." },
      { id: "resting", name: "Resting", cost: 1, type: "Recreational", limit: 4, lifetimeKey: "resting",
        effect: "Gain 1 Karma Point, 1 Skill Rank (PE Skill), and +2 Personality Score." },
      { id: "studying", name: "Studying", cost: 1, type: "Recreational", limit: 4, lifetimeKey: "studying",
        effect: "Gain 1 Skill Rank in any 2 Skills and +2 Scholarship Score." },
      { id: "baseBuilding", name: "Base Building", cost: 2, type: "Recreational", limit: 4, lifetimeKey: "baseBuilding",
        effect: "Gain and spend 2 Dev Points. +1 Personality Score, +1 Scholarship Score." }
    ];

    // Build activity display data
    for (const act of allActivities) {
      act.lifetimeUsed = act.lifetimeKey ? (lifetime[act.lifetimeKey] || 0) : 0;
      act.usedThisPeriod = activitiesUsed.includes(act.id);

      // Determine disabled state
      act.disabled = false;
      act.disabledReason = "";

      if (!context.dtPeriodActive) {
        act.disabled = true;
        act.disabledReason = "No active downtime period";
      } else if (context.dtRemainingDT < act.cost) {
        act.disabled = true;
        act.disabledReason = "Not enough DT remaining";
      } else if (act.limit !== "N/A" && act.lifetimeUsed >= act.limit) {
        act.disabled = true;
        act.disabledReason = `Lifetime limit reached (${act.limit})`;
      } else if (act.usedThisPeriod && !hasMentor) {
        act.disabled = true;
        act.disabledReason = "Already used this period (each activity once per period)";
      }
    }

    context.dtTrainingActivities = allActivities.filter(a => a.type === "Training");
    context.dtRecreationalActivities = allActivities.filter(a => a.type === "Recreational");

    // Modifier definitions
    const maxModifiers = 2;
    const modifierCount = modifiersUsed.length;

    const allModifiers = [
      { id: "trainingPartner", name: "Training Partner", type: "Training",
        effect: "Choose: +1 AP (not SC/PE) & +1 Score Limit, OR +10 TP & +5 Sig Tech limit, OR +1 Natural Result on a Stress Test." },
      { id: "mentor", name: "Mentor", type: "Training",
        effect: "+1 additional DT this period. May use a Downtime Activity more than once." },
      { id: "strenuous", name: "Strenuous", type: "Training",
        effect: "Grueling: -1/4 Max LP (2 fights), +1 AP, +10 TP. Life Threatening: -1/2 Max LP, +1 AP, +10 TP, +1 DT." },
      { id: "deepFocus", name: "Deep Focus", type: "Recreational",
        effect: "+1 Karma Point. May use a Recreational Activity twice this period." },
      { id: "crafting", name: "Crafting", type: "Recreational",
        effect: "For every Craft Skill Rank, gain 2 Equipment Points to spend immediately." }
    ];

    for (const mod of allModifiers) {
      mod.active = modifiersUsed.includes(mod.id);

      mod.disabled = false;
      if (!context.dtPeriodActive) {
        mod.disabled = true;
      } else if (!mod.active && modifierCount >= maxModifiers) {
        mod.disabled = true;
      } else if (mod.type === "Training" && !hasTrainingActivity && !mod.active) {
        // Training modifiers need a training activity to be used this period
        // But don't disable if already active (allow toggling off)
        mod.disabled = false; // Allow selecting even before activity — ARC may set up modifiers first
      }
    }

    context.dtModifiers = allModifiers;

    // History display
    const displayHistory = history.map((h, i) => ({
      periodNum: history.length - i,
      totalDT: h.totalDT || 0,
      activities: (h.activities || []).map(aId => {
        const found = allActivities.find(a => a.id === aId);
        return found ? found.name : aId;
      }),
      modifiers: (h.modifiers || []).map(mId => {
        const found = allModifiers.find(m => m.id === mId);
        return found ? found.name : mId;
      }),
      notes: h.notes || ""
    }));

    context.dtHistory = displayHistory;
    context.dtHasHistory = displayHistory.length > 0;
  }

  // -------------------------------------------------------
  // Data Prep: Transformation Customization
  // -------------------------------------------------------

  _prepareTfCustomizationData(context, system) {
    const transformations = system.transformations || [];
    const catalog = CONFIG.DBU?.transformationsCatalog || {};

    // Build enriched transformation list for all sections
    const allTfc = [];
    const enhancements = [];
    const legendaryOptions = [];

    transformations.forEach((t, i) => {
      const catEntry = t.catalogKey ? catalog[t.catalogKey] : null;
      const aspects = (t.aspects && t.aspects.length > 0) ? t.aspects : (catEntry?.aspects || []);
      const bonuses = t.attrBonuses || {};
      const isEnhancement = (t.transformationType || "").startsWith("enhancement");
      const isTranscendent = (catEntry?.aspects || []).some(a =>
        typeof a === "string" && a.toLowerCase().includes("transcendent")
      ) || aspects.some(a => typeof a === "string" && a.toLowerCase().includes("transcendent"));

      const hasPrelude = aspects.some(a => typeof a === "string" && a.trim() === "Prelude");
      const preludeActive = !!t.preludeActive;
      const preludeApplies = hasPrelude && preludeActive;
      // Effective values when Prelude is on: -1 ToP req, -5 ST req
      const effectiveStressTest = preludeApplies
        ? Math.max(0, (t.stressTest || 0) - 5)
        : (t.stressTest || 0);
      const tierRaw = String(t.tierRequirement || "");
      const tierMatch = tierRaw.match(/(\d+)/);
      const effectiveTierRequirement = (preludeApplies && tierMatch)
        ? tierRaw.replace(/(\d+)/, Math.max(0, parseInt(tierMatch[1]) - 1))
        : tierRaw;
      const entry = {
        transIndex: i,
        name: t.name || "(Unnamed)",
        stressTest: t.stressTest || 0,
        tierRequirement: t.tierRequirement || "",
        effectiveStressTest,
        effectiveTierRequirement,
        preludeReducingThis: preludeApplies,
        matchFoMa: t.matchFoMa || false,
        scaleAmb: t.scaleAmb || false,
        powerImprovement: t.powerImprovement || "none",
        isLegendary: t.isLegendary || false,
        isEnhancement,
        isTranscendent,
        mastered: t.mastered || false,
        hasPrelude,
        preludeActive,
        aspects: [...aspects],
        ambAg: bonuses.ag || "",
        ambFo: bonuses.fo || "",
        ambTe: bonuses.te || "",
        ambSc: bonuses.sc || "",
        ambIn: bonuses.in || "",
        ambMa: bonuses.ma || "",
        ambPe: bonuses.pe || ""
      };

      allTfc.push(entry);
      if (isEnhancement) enhancements.push(entry);
      if (t.isLegendary) legendaryOptions.push(entry);
    });

    context.tfcTransformations = allTfc;
    context.tfcEnhancements = enhancements;

    // Limit Shattering data
    const lsData = system.transformationCustomization?.limitShattering || {};
    const lsTransId = lsData.transformationId ?? -1;
    context.tfcLsHasForm = lsTransId >= 0;
    context.tfcLsExceedActive = lsData.exceedActive || false;

    context.tfcLegendaryOptions = legendaryOptions.map(l => ({
      ...l,
      selected: l.transIndex === lsTransId
    }));

    // Exceed traits
    const exceedTraits = [
      { id: "promisedPower", name: "Promised Power" },
      { id: "poweredByFury", name: "Powered by Fury" },
      { id: "clearHeart", name: "Clear Heart" },
      { id: "awokenDivinity", name: "Awoken Divinity" },
      { id: "breakTheLimiter", name: "Break the Limiter" },
      { id: "irreparableBeatdown", name: "Irreparable Beatdown" },
      { id: "godSurpassing", name: "God-Surpassing" },
      { id: "timePowerUnleashed", name: "Time Power Unleashed" },
      { id: "lifeRisking", name: "Life-Risking" },
      { id: "powerOfDemonGod", name: "Power of a Demon God" },
      { id: "enhancedStyle", name: "Enhanced Style" },
      { id: "unnecessaryEvolution", name: "Unnecessary Evolution" },
      { id: "fullyControlledPower", name: "Fully Controlled Power" }
    ];
    const selectedExceed = lsData.exceedTrait || "";
    context.tfcExceedTraits = exceedTraits.map(et => ({
      ...et,
      selected: et.id === selectedExceed
    }));
    context.tfcLsExceedTrait = exceedTraits.find(et => et.id === selectedExceed)?.name || "";

    // Unique Paths data
    const uniquePathEntries = system.transformationCustomization?.uniquePaths || [];
    const uniquePathOptions = [
      { id: "speed", name: "Path of Speed" },
      { id: "might", name: "Path of Might" },
      { id: "wall", name: "Path of the Wall" },
      { id: "heart", name: "Path of the Heart" },
      { id: "mind", name: "Path of the Mind" },
      { id: "control", name: "Path of Control" },
      { id: "unnecessaryEvolution", name: "Unnecessary Evolution" },
      { id: "fullyControlledPower", name: "Fully Controlled Power" },
      { id: "ultimate", name: "Ultimate" },
      { id: "ssjFullPower", name: "Super Saiyan Full Power" },
      { id: "earnedEvolution", name: "Earned Evolution" },
      { id: "trueSsjGod", name: "True Super Saiyan God" },
      { id: "trueUltraInstinct", name: "True Ultra Instinct" }
    ];
    context.tfcUniquePathOptions = uniquePathOptions;

    // Path descriptions
    const pathDescriptions = {
      speed: "AG +1(T). Enhanced Save (Impulsive). Blitz stacks (max 3). Wound/dodge boosts.",
      might: "FO/MA +1(T), Might +1(T). Super Power stacks. Strike boost. Power Flare without Counter.",
      wall: "TE +1(T). Enhanced Save (Corporeal). Steel stacks. Damage reduction, soak boost.",
      heart: "PE +1(T). Enhanced Save (Morale). Heart stacks. Energy Charges, target redirection.",
      mind: "SC +1(T). Enhanced Save (Cognitive). Mind stacks. Energy Charges, target redirection.",
      control: "IN +1(T), FO/MA -1(T). Perfect Ki Control. -1 Stress for Enhancements. Regain Ki on maneuvers.",
      unnecessaryEvolution: "+1 selected AMB. +2 ED on Brutal Assault wounds. Cruelty spending for ED.",
      fullyControlledPower: "+1 selected AMB. Perfect Ki Control. -2(T) Ki cost. Keep Power stacks.",
      ultimate: "+1 selected AMB. Spend Ki for Peak stacks. Use Peak for damage category boost.",
      ssjFullPower: "Synergy with Wrathful. +1 damage category. +3 DR. Double Battle Born on ultimates.",
      earnedEvolution: "+1 selected AMB. Meta Trait. +1 ED/Energy Charge ED. +1/4 wound rolls from defense.",
      trueSsjGod: "+1 selected AMB. Armored aspect. +2 Steadfast. +1(T) DR per Power stack.",
      trueUltraInstinct: "Extra Enhancement Power. Beyond Heat trait in Full Power/Exceed. Lose Draining."
    };

    // Build display rows for unique paths — ensure at least 1 row
    const upRows = uniquePathEntries.length > 0
      ? uniquePathEntries.map(up => ({
          transformationId: up.transformationId ?? -1,
          pathType: up.pathType || "",
          ambAttribute: up.ambAttribute || "",
          pathDescription: pathDescriptions[up.pathType] || ""
        }))
      : [{ transformationId: -1, pathType: "", ambAttribute: "", pathDescription: "" }];

    context.tfcUniquePaths = upRows;

    // Legendary forms available for Unique Paths dropdown
    context.tfcLegendaryForUpDropdown = legendaryOptions;
  }

  _getCharacterTraits(system) {
    const selectedIds = system.racialTraits || [];
    const catalog = CONFIG.DBU?.racialTraitsCatalog || {};
    const optionSelections = system.racialOptionSelections || {};
    const results = [];

    const allTraits = [];
    for (const [race, traits] of Object.entries(catalog)) {
      for (const trait of traits) allTraits.push({ ...trait, race });
    }

    for (const id of selectedIds) {
      const traitData = allTraits.find(t => t.id === id);
      if (!traitData) continue;
      const trait = foundry.utils.deepClone(traitData);
      const traitSelections = optionSelections[id] || {};
      for (const effect of (trait.effects || [])) {
        if (effect.options && (effect.activationType === "option" || effect.activationType === "choice")) {
          const selected = traitSelections[effect.level];
          for (const opt of effect.options) opt.selected = (opt.name === selected);
          if (!effect.options.some(o => o.selected) && effect.options.length > 0) effect.options[0].selected = true;
        } else if (effect.options && effect.activationType === "multi-option") {
          const selected = traitSelections[effect.level] || [];
          const selectedArr = Array.isArray(selected) ? selected : [selected];
          const max = effect.optionCount || Infinity;
          for (const opt of effect.options) {
            opt.selected = selectedArr.includes(opt.name);
          }
          const selCount = effect.options.filter(o => o.selected).length;
          effect.selectedCount = selCount;
          // Disable unchecked options when at max
          if (selCount >= max) {
            for (const opt of effect.options) { if (!opt.selected) opt.disabled = true; }
          }
        }
      }
      results.push(trait);
    }
    return results;
  }

  _getCharacterTalents(system) {
    const selectedIds = system.talents || [];
    const catalog = CONFIG.DBU?.talentsCatalog || [];
    const results = [];
    for (const id of selectedIds) {
      const talentData = catalog.find(t => t.id === id);
      if (!talentData) continue;
      results.push(foundry.utils.deepClone(talentData));
    }
    return results;
  }

  _groupTalentsByCategory(talents) {
    const groups = {};
    for (const talent of talents) {
      const cat = talent.category || "Miscellaneous";
      if (!groups[cat]) groups[cat] = { category: cat, talents: [] };
      groups[cat].talents.push(talent);
    }
    return Object.values(groups).sort((a, b) => a.category.localeCompare(b.category));
  }

  _getSubspeciesOptions(system) {
    const race = system.race || "saiyan";
    const factors = CONFIG.DBU?.racialFactors?.[race] || [];
    return factors.map(f => ({ value: f.id, label: f.name, selected: f.id === system.subspecies }));
  }

  _getSubraceOptions(system) {
    const race = system.race || "saiyan";
    const subraces = CONFIG.DBU?.racialSubraces?.[race] || [];
    return subraces.map(sr => ({ value: sr.id, label: sr.name, selected: sr.id === system.subrace }));
  }

  _prepareItems(context) {
    const apparel = [];
    const weapons = [];
    const accessories = [];
    const worn = [];

    for (const item of this.actor.items) {
      if (item.type !== "equipment") continue;
      const eqType = item.system.equipmentType || "apparel";
      if (eqType === "weapon") weapons.push(item);
      else if (eqType === "accessory") accessories.push(item);
      else apparel.push(item);

      if (item.system.worn) worn.push(item);
    }

    apparel.sort((a, b) => a.name.localeCompare(b.name));
    weapons.sort((a, b) => a.name.localeCompare(b.name));
    accessories.sort((a, b) => a.name.localeCompare(b.name));

    // Enrich apparel + weapon items with qualities CRUD data
    if (!this._expandedQualityCards) this._expandedQualityCards = new Set();
    for (const item of [...apparel, ...weapons]) {
      this._enrichItemQualities(item);
    }

    context.apparelItems = apparel;
    context.weaponItems = weapons;
    context.accessoryItems = accessories;
    context.wornApparel = worn;
    context.equipmentItems = [...apparel, ...weapons, ...accessories];

    // Layer System data preparation
    const system = this.actor.system;
    const slots = system.wornApparelSlots || {};
    const layers = [
      { key: "topLayer", label: "Top Layer" },
      { key: "middleLayer", label: "Middle Layer" },
      { key: "bottomLayer", label: "Bottom Layer" }
    ];
    const accSlots = [
      { key: "accessory1", label: "Accessory 1" },
      { key: "accessory2", label: "Accessory 2" }
    ];
    context.wornLayers = layers.map(l => {
      const itemId = slots[l.key] || "";
      const item = itemId ? this.actor.items.get(itemId) : null;
      return {
        key: l.key, label: l.label, assignedId: itemId, assigned: !!item,
        categoryName: item ? (CONFIG.DBU.apparelCategories?.[item.system.apparelCategory]?.name || "") : "",
        benefit: item ? this._calcApparelBenefitLabel(item) : "",
        bvCurrent: item ? (item.system.breakValueCurrent ?? this._calcBreakValueMax(item)) : "",
        bvMax: item ? this._calcBreakValueMax(item) : "",
        doffStatus: item ? (item.system.doffUsed ? "Used" : "Available") : "",
        gradeLabel: item ? this._getGradeLabel(item) : "",
        qualitiesSummary: item ? (item.system.qualities || []).map(q => CONFIG.DBU.apparelQualities?.[q.qualityKey]?.name || q.qualityKey).join(", ") : "",
        isSelected: system.selectedWornLayer === l.key
      };
    });
    context.accessorySlots = accSlots.map(a => {
      const itemId = slots[a.key] || "";
      const item = itemId ? this.actor.items.get(itemId) : null;
      return {
        key: a.key, label: a.label, assignedId: itemId, assigned: !!item,
        name: item?.name || "", effect: item?.system.description || ""
      };
    });
    context.apparelOptions = apparel.map(i => ({ id: i._id, name: i.name }));
    context.accessoryOptions = accessories.map(i => ({ id: i._id, name: i.name }));
    context.equipment = system.equipment || {};

    // Battle Uniform Detail
    if (system.selectedWornLayer) {
      const detailItemId = slots[system.selectedWornLayer];
      const detailItem = detailItemId ? this.actor.items.get(detailItemId) : null;
      if (detailItem) {
        const config = CONFIG.DBU ?? {};
        const catEffect = config.apparelCategories?.[detailItem.system.apparelCategory] || {};
        const slotsMax = config.craftsmanshipGrades?.[detailItem.system.craftsmanshipGrade || 1]?.qualitySlots || 0;
        const quals = (detailItem.system.qualities || []).map((q, idx) => {
          const qData = config.apparelQualities?.[q.qualityKey] || {};
          return {
            name: qData.name || q.qualityKey,
            notes: q.notes || "",
            effect: qData.effect || "",
            slotsUsed: q.slotsUsed || (Array.isArray(qData.slots) ? qData.slots[0] : qData.slots || 1)
          };
        });
        const slotsUsed = quals.reduce((sum, q) => sum + q.slotsUsed, 0);
        const availQualities = Object.values(config.apparelQualities || {})
          .filter(q => q.categories?.includes(detailItem.system.apparelCategory))
          .filter(q => !(detailItem.system.qualities || []).some(eq => eq.qualityKey === q.id));
        context.battleUniformDetail = {
          itemId: detailItem._id,
          name: detailItem.name,
          categoryName: catEffect.name || "",
          categoryEffect: catEffect.effect || "",
          gradeLabel: this._getGradeLabel(detailItem),
          apparelBonus: this.actor._calcApparelBonus(detailItem),
          bvCurrent: detailItem.system.breakValueCurrent ?? this._calcBreakValueMax(detailItem),
          bvMax: this._calcBreakValueMax(detailItem),
          doffBonus: this._calcDoffBonus(detailItem),
          doffStatus: detailItem.system.doffUsed ? "Used" : "Available",
          slotsUsed, slotsMax,
          qualities: quals,
          canAddQuality: slotsUsed < slotsMax,
          availableQualities: availQualities
        };
      }
    }
  }

  // -------------------------------------------------------
  // Data Prep: Battle Jacket Tab
  // -------------------------------------------------------

  _prepareBattleJacketTabData(context, system) {
    const pilotedId = system.pilotedJacketId || "";
    const isPiloting = system.isPiloting || false;

    context.bjLinked = !!pilotedId;
    context.bjPiloting = isPiloting;
    context.bjJacket = null;
    context.bjAvailableJackets = [];

    if (!pilotedId) {
      context.bjAvailableJackets = game.actors
        .filter(a => a.type === "battleJacket" && !a.system.pilotId)
        .map(a => ({ id: a.id, name: a.name }));
    }

    if (pilotedId) {
      const bjActor = game.actors?.get(pilotedId);
      if (!bjActor || bjActor.type !== "battleJacket") {
        // Stale link: jacket was deleted or is no longer valid
        context.bjLinked = false;
        context.bjStaleLink = true;
        context.bjAvailableJackets = game.actors
          .filter(a => a.type === "battleJacket" && !a.system.pilotId)
          .map(a => ({ id: a.id, name: a.name }));
      } else {
        const bjSys = bjActor.system;
        const catalog = CONFIG.DBU?.jacketModulesCatalog || {};

        context.bjJacket = {
          id: bjActor.id,
          name: bjActor.name,
          img: bjActor.img,
          grade: bjSys.jacketGrade,
          frame: bjSys.jacketFrame,
          engine: bjSys.jacketEngine,
          jacketLevel: bjSys.jacketLevel,
          jacketTier: bjSys.jacketTier,
          sizeCategory: bjSys.effectiveSizeCategory || bjSys.sizeCategory,
          lp: bjSys.lp,
          kp: bjSys.kp,
          awareness: bjSys.awareness,
          haste: bjSys.haste,
          soak: bjSys.soak,
          defenseValue: bjSys.defenseValue,
          damageReduction: bjSys.damageReduction,
          normalSpeed: bjSys.normalSpeed,
          boostedSpeed: bjSys.boostedSpeed,
          might: bjSys.might,
          healthThresholds: bjSys.healthThresholds,
          weakPoints: bjSys.weakPoints,
          uniqueFrameModule: catalog[bjSys.frameUniqueModule] || null,
          uniqueEngineModule: catalog[bjSys.engineUniqueModule] || null,
          installedModules: (bjSys.installedModules || []).map(id => catalog[id] || { name: id }),
          signatureTechniques: bjSys.signatureTechniques || [],
          signatureAuras: bjSys.signatureAuras || [],
          uniqueAbilities: bjSys.uniqueAbilities || [],
          lpPercent: bjSys.lp.max > 0 ? Math.clamped(bjSys.lp.value / bjSys.lp.max * 100, 0, 100) : 0,
          kpPercent: bjSys.kp.max > 0 ? Math.clamped(bjSys.kp.value / bjSys.kp.max * 100, 0, 100) : 0
        };
      }
    }

    // Fix I3: Resolve unique ability display names from catalog
    if (context.bjJacket?.uniqueAbilities) {
      const uaCatalog = CONFIG.DBU?.uniqueAbilitiesCatalog || {};
      context.bjJacket.uniqueAbilities = context.bjJacket.uniqueAbilities.map(ua => {
        const catEntry = uaCatalog[ua.abilityKey];
        return { ...ua, resolvedName: catEntry?.name || ua.abilityKey };
      });
    }

    context.bjPenalty = system._bjPenalty || 0;
    context.bjPenaltyRemoved = system._bjPenaltyApplied === false && isPiloting;
  }

  // ---- Equipment Layer Helpers ----

  _calcApparelBenefitLabel(item) {
    const bonus = this.actor._calcApparelBonus(item);
    switch (item.system.apparelCategory) {
      case "armor": return `DR +${bonus}`;
      case "weights": return `-${bonus} Combat`;
      case "combat_clothing": return `+${Math.ceil(bonus / 2)} Defense`;
      case "standard_clothing": return "No penalty";
      default: return "";
    }
  }

  _calcBreakValueMax(item) {
    const grade = item.system.craftsmanshipGrade || 1;
    const quals = item.system.qualities || [];
    let bv = 3 + grade * 2;
    if (quals.some(q => q.qualityKey === "durable")) bv += 3;
    return bv;
  }

  _calcDoffBonus(item) {
    const bonus = this.actor._calcApparelBonus(item);
    return Math.ceil(bonus / 2);
  }

  _getGradeLabel(item) {
    const config = CONFIG.DBU ?? {};
    const gradeData = config.craftsmanshipGrades?.[item.system.craftsmanshipGrade || 1] || {};
    return config.apparelGrades?.[gradeData.apparelGrade || "low"]?.name || "Low";
  }

  // ---- Equipment Item Qualities CRUD Helpers ----

  /**
   * Enrich an apparel/weapon item with `qualitiesEnriched`, `availableStandard`,
   * `availableSpecial`, and `expanded` for use in the equipment cards UI.
   */
  _enrichItemQualities(item) {
    const isApparel = item.system.equipmentType === "apparel";
    const catalog = isApparel
      ? (CONFIG.DBU?.apparelQualities || {})
      : (CONFIG.DBU?.weaponQualities || {});
    const sys = this.actor.system;

    item.qualitiesEnriched = (item.system.qualities || []).map((q, idx) => {
      const cat = catalog[q.qualityKey] || {};
      return {
        ...q,
        itemId: item._id,
        qIdx: idx,
        catalogName: cat.name || q.qualityKey,
        description: cat.description || "",
        isSpecial: !!cat.isSpecial,
        configFields: (cat.config || []).map(cfg => ({
          ...cfg,
          currentValue: q.config?.[cfg.key] ?? "",
          resolvedOptions: this._resolveQualityConfigOptions(cfg, sys)
        }))
      };
    });

    const usedKeys = new Set((item.system.qualities || []).map(q => q.qualityKey));
    const itemCatKey = isApparel ? item.system.apparelCategory : item.system.weaponType;
    const isCompatible = (q) => {
      if (!Array.isArray(q.compatibility)) return false;
      if (q.compatibility.includes("any")) return true;
      return q.compatibility.includes(itemCatKey);
    };
    item.availableStandard = Object.values(catalog)
      .filter(q => !q.isSpecial && isCompatible(q) && !usedKeys.has(q.id));
    item.availableSpecial = Object.values(catalog)
      .filter(q => q.isSpecial && !usedKeys.has(q.id));

    item.expanded = this._expandedQualityCards?.has(item._id) || false;
  }

  /**
   * Resolve the option list for a quality config field based on its type.
   * Supports: choice, text (returns []), skill, weaponCategory, alignment.
   */
  _resolveQualityConfigOptions(cfg, system) {
    if (cfg.type === "choice") return cfg.options || [];
    if (cfg.type === "alignment") {
      return [
        { value: "",     label: "-- Select --" },
        { value: "good", label: "Good/Pure Good" },
        { value: "evil", label: "Evil/Pure Evil" }
      ];
    }
    if (cfg.type === "skill") {
      // Source of truth: CONFIG.DBU.skillsData (legacy IDs: science, use_magic, crafting, etc.)
      const skillsData = CONFIG.DBU?.skillsData || [];
      const opts = [{ value: "", label: "-- Select Skill --" }];
      for (const def of skillsData) {
        if (cfg.attribute && def.attribute !== cfg.attribute) continue;
        opts.push({ value: def.id, label: def.name });
      }
      return opts;
    }
    if (cfg.type === "weaponCategory") {
      const PHYSICAL = ["bludgeoning", "slashing", "piercing", "shield"];
      const ENERGY   = ["pinpoint", "high_power"];
      const MAGIC    = ["magic_staff", "elemental_tool", "magic_orb"];
      let cats;
      if (cfg.subset === "physical") cats = PHYSICAL;
      else if (cfg.subset === "energy") cats = ENERGY;
      else if (cfg.subset === "magic") cats = MAGIC;
      else cats = [...PHYSICAL, ...ENERGY, ...MAGIC];
      const opts = [{ value: "", label: "-- Select Category --" }];
      for (const c of cats) {
        opts.push({ value: c, label: c.replace(/_/g, " ").replace(/\b\w/g, ch => ch.toUpperCase()) });
      }
      return opts;
    }
    return [];
  }

  // ===============================================================
  // EVENT LISTENERS
  // ===============================================================

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // Item CRUD (Equipment)
    html.on("click", ".item-create", this._onItemCreate.bind(this));
    html.on("click", ".item-edit", this._onItemEdit.bind(this));
    html.on("click", ".item-delete", this._onItemDelete.bind(this));
    html.on("change", ".eq-worn-toggle", this._onEquipmentWornToggle.bind(this));
    html.on("change", ".eq-inline-input", this._onEquipmentInlineEdit.bind(this));
    html.on("change", ".eq-inline-check", this._onEquipmentInlineCheck.bind(this));

    // Equipment Layer system
    html.on("change", "[data-action='assign-layer']", this._onAssignLayer.bind(this));
    html.on("click", "[data-action='toggle-detail']", this._onToggleDetail.bind(this));
    html.on("click", "[data-action='add-quality']", this._onAddQuality.bind(this));
    html.on("click", "[data-action='remove-quality']", this._onRemoveQuality.bind(this));
    html.on("change", ".eq-quality-notes", this._onQualityNotesChange.bind(this));
    html.on("change", ".eq-bv-input", this._onBreakValueChange.bind(this));

    // Equipment item card: per-card qualities CRUD
    html.on("click",  "[data-action='toggle-qualities-card']", this._onToggleQualityCard.bind(this));
    html.on("click",  "[data-action='add-item-quality']",      this._onAddItemQuality.bind(this));
    html.on("click",  "[data-action='remove-item-quality']",   this._onRemoveItemQuality.bind(this));
    html.on("change", ".eq-quality-config-input",              this._onChangeQualityConfig.bind(this));
    html.on("change", ".eq-quality-notes-input",               this._onChangeQualityNotes.bind(this));

    // Skill roll button
    html.on("click", "[data-action='roll-skill']", this._onRollSkill.bind(this));

    // Counter +/- buttons
    html.on("click", ".counter-btn", this._onCounterButton.bind(this));

    // Custom Buff CRUD
    html.on("click", "[data-action='add-custom-buff']", this._onAddCustomBuff.bind(this));
    html.on("click", "[data-action='delete-custom-buff']", this._onDeleteCustomBuff.bind(this));

    // New Round / New Encounter (main tab)
    html.on("click", "[data-action='new-round']", this._onNewRound.bind(this));
    html.on("click", "[data-action='new-encounter']", this._onNewEncounter.bind(this));

    // Effect Panel interactions (main tab)
    html.on("click", "[data-action='toggle-effect-group']", this._onToggleEffectGroup.bind(this));
    html.on("change", ".passive-toggle", this._onPassiveToggle.bind(this));
    html.on("click", ".usage-pip", this._onUsagePipClick.bind(this));

    // Trait CRUD
    html.on("click", "[data-action='add-trait']", this._onAddTrait.bind(this));
    html.on("click", "[data-action='delete-trait']", this._onDeleteTrait.bind(this));
    html.on("click", "[data-action='toggle-trait']", this._onToggleTrait.bind(this));
    html.on("change", ".option-select", this._onTraitOptionSelect.bind(this));
    html.on("change", ".option-checkbox", this._onTraitOptionCheckbox.bind(this));

    // Adversary CRUD
    html.on("click", "[data-action='add-villainous-trait']", this._onAddVillainousTrait.bind(this));
    html.on("click", "[data-action='delete-villainous-trait']", this._onDeleteVillainousTrait.bind(this));
    html.on("click", "[data-action='toggle-villainous-trait']", this._onToggleTraitCard.bind(this));
    html.on("click", "[data-action='add-weakness']", this._onAddWeakness.bind(this));
    html.on("click", "[data-action='delete-weakness']", this._onDeleteWeakness.bind(this));
    html.on("click", "[data-action='toggle-weakness']", this._onToggleTraitCard.bind(this));
    html.on("click", "[data-action='add-minion-trait']", this._onAddMinionTrait.bind(this));
    html.on("click", "[data-action='delete-minion-trait']", this._onDeleteMinionTrait.bind(this));

    // Battle Born stack controls
    html.on("click", ".bb-increment", this._onBBIncrement.bind(this));
    html.on("click", ".bb-decrement", this._onBBDecrement.bind(this));

    // Experienced Fighter controls
    html.on("click", "[data-action='ef-activate']", this._onExperiencedFighterActivate.bind(this));
    html.on("click", "[data-action='ef-deactivate']", this._onExperiencedFighterDeactivate.bind(this));

    // Talent CRUD
    html.on("click", "[data-action='add-talent']", this._onAddTalent.bind(this));
    html.on("click", "[data-action='delete-talent']", this._onDeleteTalent.bind(this));
    html.on("change", ".talent-category-filter", this._onTalentCategoryFilter.bind(this));

    // Technique CRUD
    html.on("click", "[data-action='add-technique']", this._onAddTechnique.bind(this));
    html.on("click", "[data-action='delete-technique']", this._onDeleteTechnique.bind(this));
    html.on("change", ".tech-input", this._onTechniqueFieldChange.bind(this));
    html.on("click", "[data-action='add-advantage']", this._onAddTechAdvantage.bind(this));
    html.on("click", "[data-action='remove-advantage']", this._onRemoveTechAdvantage.bind(this));
    html.on("change", ".adv-input", this._onTechAdvField.bind(this));
    html.on("click", "[data-action='add-disadvantage']", this._onAddTechDisadvantage.bind(this));
    html.on("click", "[data-action='remove-disadvantage']", this._onRemoveTechDisadvantage.bind(this));
    html.on("change", ".disadv-input", this._onTechDisadvField.bind(this));
    html.on("click", ".style-btn", this._onTechStyleToggle.bind(this));

    // Aura CRUD
    html.on("click", "[data-action='add-aura']", this._onAddAura.bind(this));
    html.on("click", "[data-action='delete-aura']", this._onDeleteAura.bind(this));
    html.on("click", "[data-action='toggle-aura']", this._onToggleAura.bind(this));
    html.on("change", ".aura-input", this._onAuraFieldChange.bind(this));
    html.on("click", "[data-action='add-aura-advantage']", this._onAddAuraAdvantage.bind(this));
    html.on("click", "[data-action='remove-aura-advantage']", this._onRemoveAuraAdvantage.bind(this));
    html.on("change", ".aura-adv-input", this._onAuraAdvField.bind(this));
    html.on("click", "[data-action='add-aura-disadvantage']", this._onAddAuraDisadvantage.bind(this));
    html.on("click", "[data-action='remove-aura-disadvantage']", this._onRemoveAuraDisadvantage.bind(this));
    html.on("change", ".aura-disadv-input", this._onAuraDisadvField.bind(this));

    // Transformation CRUD
    html.on("click", "[data-action='add-transformation']", this._onAddTransformation.bind(this));
    html.on("click", "[data-action='delete-transformation']", this._onDeleteTransformation.bind(this));
    html.on("change", ".tf-input", this._onTransformationFieldChange.bind(this));
    html.on("change", ".tf-check", this._onTransformationCheckChange.bind(this));
    html.on("click", "[data-action='open-transformation-catalog']", this._onOpenTransformationCatalog.bind(this));
    html.on("click", "[data-action='view-transformation-traits']", this._onViewTransformationTraits.bind(this));

    // Kaioken LP Cost
    html.on("click", "[data-action='pay-kaioken-lp']", this._onPayKaiokenLp.bind(this));

    // Token Album
    html.on("click", "[data-action='add-token-album-entry']", this._onAddAlbumEntry.bind(this));
    html.on("click", "[data-action='browse-album-image']", this._onBrowseAlbumImage.bind(this));
    html.on("click", "[data-action='activate-album-token']", this._onActivateAlbumToken.bind(this));
    html.on("click", "[data-action='remove-album-entry']", this._onRemoveAlbumEntry.bind(this));
    html.on("click", "[data-action='restore-original-token']", this._onRestoreOriginalToken.bind(this));
    html.on("change", ".tfi-name-input", this._onAlbumNameChange.bind(this));

    // Legendary Trait selection dropdown
    html.on("change", ".lt-trait-select", this._onLegendaryTraitSelect.bind(this));

    // Unique Abilities CRUD
    html.on("click", "[data-action='add-unique']", this._onAddUnique.bind(this));
    html.on("click", "[data-action='delete-unique']", this._onDeleteUnique.bind(this));
    html.on("change", ".unique-free-check", this._onUniqueFreeToggle.bind(this));
    html.on("click", "[data-action='add-unique-advancement']", this._onAddUniqueAdvancement.bind(this));
    html.on("click", "[data-action='remove-unique-advancement']", this._onRemoveUniqueAdvancement.bind(this));
    html.on("change", ".unique-adv-select", this._onUniqueAdvSelect.bind(this));
    html.on("change", ".unique-adv-free", this._onUniqueAdvFree.bind(this));
    html.on("change", ".unique-adv-amount", this._onUniqueAdvAmount.bind(this));
    html.on("click", "[data-action='add-unique-restriction']", this._onAddUniqueRestriction.bind(this));
    html.on("click", "[data-action='remove-unique-restriction']", this._onRemoveUniqueRestriction.bind(this));
    html.on("change", ".unique-res-select", this._onUniqueResSelect.bind(this));

    // Progression CRUD
    html.on("click", "[data-action='add-progression-row']", this._onAddProgressionRow.bind(this));
    html.on("click", "[data-action='delete-progression-row']", this._onDeleteProgressionRow.bind(this));

    // Combat tab
    html.on("click", "[data-action='unified-action']", this._onUnifiedAction.bind(this));
    html.on("click", ".combat-undo-use", this._onUndoResource.bind(this));
    html.on("click", ".combat-add-use", this._onAddResourceUse.bind(this));
    html.on("click", "[data-action='combat-new-round']", this._onCombatNewRound.bind(this));
    html.on("click", "[data-action='combat-new-encounter']", this._onCombatNewEncounter.bind(this));
    html.on("click", "[data-action='evil-aura-points-add']",        this._onEvilAuraPointsAdd.bind(this));
    html.on("click", "[data-action='evil-aura-points-sub']",        this._onEvilAuraPointsSub.bind(this));
    html.on("click", "[data-action='evil-aura-techs-activate']",    this._onEvilAuraTechsActivate.bind(this));
    html.on("click", "[data-action='evil-aura-techs-deactivate']",  this._onEvilAuraTechsDeactivate.bind(this));
    html.on("click", "[data-action='dkp-add']",                     this._onDkpAdd.bind(this));
    html.on("click", "[data-action='dkp-sub']",                     this._onDkpSub.bind(this));
    html.on("click", "[data-action='dkp-refill']",                  this._onDkpRefill.bind(this));
    html.on("click", "[data-action='god-maneuver-use']",            this._onGodManeuverUse.bind(this));
    html.on("click", "[data-action='apply-damage']", this._onApplyDamage.bind(this));
    html.on("click", "[data-action='apply-heal']", this._onApplyHeal.bind(this));
    html.on("change", ".combat-dmg-input", this._onDamageCalcInput.bind(this));
    html.on("change", ".threshold-check", this._onThresholdCheck.bind(this));
    html.on("change", ".condition-toggle", this._onConditionToggle.bind(this));
    html.on("change", ".condition-stack-input", this._onConditionStack.bind(this));
    html.on("click", "[data-action='toggle-ki-wager-ref']", (ev) => {
      ev.currentTarget.closest(".ki-wager-ref").classList.toggle("collapsed");
    });
    html.on("click", "[data-action='toggle-dice-pools']", (ev) => {
      ev.currentTarget.closest(".dice-pools-section").classList.toggle("collapsed");
    });
    html.on("click", "[data-action='tracker-add-action']", this._onTrackerAddAction.bind(this));
    html.on("click", "[data-action='tracker-next-round']", this._onTrackerNextRound.bind(this));
    html.on("click", "[data-action='tracker-reset']", this._onTrackerReset.bind(this));
    html.on("click", "[data-action='delete-tracker-action']", this._onDeleteTrackerAction.bind(this));
    html.on("change", ".action-type, .action-ki, .action-dkp, .action-desc", this._onTrackerActionChange.bind(this));
    html.on("change", ".action-source", this._onTrackerSourceChange.bind(this));
    html.on("click", "[data-action='tb-tab-switch']", this._onTbTabSwitch.bind(this));
    html.on("click", "[data-action='rt-activable-use']", this._onRtActivableUse.bind(this));

    // Populate tracker attack-source dropdowns from stored data
    try { this._populateTrackerSources(html); }
    catch (err) { console.error("DBU-OLD | _populateTrackerSources failed:", err); }

    // Combat filter checkboxes
    html.on("change", ".combat-filter", this._onCombatFilter.bind(this));

    // God Ki / God Maneuvers
    html.on("click", "[data-action='add-god-maneuver']", this._onAddGodManeuver.bind(this));
    html.on("click", "[data-action='remove-god-maneuver']", this._onRemoveGodManeuver.bind(this));
    html.on("change", ".god-strike-profile", this._onGodStrikeProfile.bind(this));

    // Perfect KI Control
    html.on("change", ".perfect-ki-control", this._onTogglePerfectKi.bind(this));

    // Clear damage log
    html.on("click", "[data-action='clear-damage-log']", this._onClearDamageLog.bind(this));

    // Transformation Rules buttons (Combat tab)
    html.on("click", "[data-action='tf-stress-test']", this._onTfStressTest.bind(this));
    html.on("click", "[data-action='tf-turbulent-roll']", this._onTfTurbulentRoll.bind(this));
    html.on("click", "[data-action='tf-surging-strength']", this._onTfSurgingStrength.bind(this));
    html.on("click", "[data-action='tf-burst-limit']", this._onTfBurstLimit.bind(this));
    html.on("click", "[data-action='tf-legend-realized']", this._onTfLegendRealized.bind(this));
    html.on("click", "[data-action='tf-new-level-of-power']", this._onTfNewLevelOfPower.bind(this));

    // Legendary Trait triggered buttons (Combat tab)
    html.on("click", "[data-action='lt-trigger']", this._onLegendaryTraitTrigger.bind(this));

    // Manifested Power triggered buttons (Combat tab)
    html.on("click", "[data-action='mp-trigger']", this._onManifestedPowerTrigger.bind(this));

    // Transformation bonus triggered buttons (Combat tab)
    html.on("click", "[data-action='ep-trigger']", this._onEnhancementPowerTrigger.bind(this));
    html.on("click", "[data-action='af-trigger']", this._onAlternateFormTrigger.bind(this));
    html.on("click", "[data-action='lf-trigger']", this._onLegendaryFormTrigger.bind(this));

    // Talent triggered buttons (Combat tab)
    html.on("click", "[data-action='talent-trigger']", this._onTalentTrigger.bind(this));
    html.on("click", "[data-action='talent-stance']", this._onTalentStanceShift.bind(this));

    // Racial Trait triggered buttons (Combat tab)
    html.on("click", "[data-action='rt-trigger']", this._onRacialTraitTrigger.bind(this));

    // Attack Ref CRUD
    html.on("click", "[data-action='add-attack-ref']", this._onAddAttackRef.bind(this));
    html.on("click", "[data-action='remove-attack-ref']", this._onRemoveAttackRef.bind(this));

    // Lookup handlers (Attack Ref tab)
    html.on("change", "#advdisLookupSelect", this._onAttackRefLookup.bind(this));
    html.on("change", "#stateLookupSelect", this._onStateLookup.bind(this));

    // Fusion tab
    html.on("click", "[data-action='add-fused-character']", this._onAddFusedCharacter.bind(this));
    html.on("click", "[data-action='remove-fused-character']", this._onRemoveFusedCharacter.bind(this));
    html.on("click", "[data-action='recalculate-fusion']", this._onRecalculateFusion.bind(this));
    html.on("change", ".fusion-racial-trait-toggle", this._onFusionTraitToggle.bind(this));
    html.on("change", ".fusion-boost-attr-toggle", this._onFusionBoostAttrToggle.bind(this));
    html.on("change", ".fusion-bonus-talent-toggle", this._onFusionBonusTalentToggle.bind(this));
    html.on("change", ".fusion-modifier-check", this._onFusionModifierToggle.bind(this));
    html.on("click", "[data-action='fusion-round-decrement']", this._onFusionRoundDecrement.bind(this));
    html.on("click", "[data-action='fusion-round-reset']", this._onFusionRoundReset.bind(this));
    html.on("change", ".absorption-trait-select", this._onAbsorptionTraitSelect.bind(this));
    html.on("change", ".possession-trait-give", this._onPossessionTraitExchange.bind(this));
    html.on("change", ".possession-trait-take", this._onPossessionTraitExchange.bind(this));
    html.on("change", ".mutation-source-select", this._onMutationSourceSelect.bind(this));
    html.on("click", "[data-action='destroy-absorbed-apparel']", this._onDestroyAbsorbedApparel.bind(this));
    html.on("change", ".fusion-deeply-suppressed", this._onFusionDeeplySuppressed.bind(this));
    html.on("change", ".fusion-struggling-input", this._onFusionStrugglingChange.bind(this));
    html.on("click", "[data-action='eject-suppressed']", this._onEjectSuppressed.bind(this));
    html.on("click", "[data-action='escape-suppressed']", this._onEscapeSuppressed.bind(this));

    // --- Battle Jacket Tab ---
    html.on("click", "[data-action='link-jacket']", this._onLinkJacket.bind(this));
    html.on("click", "[data-action='unlink-jacket']", this._onUnlinkJacket.bind(this));
    html.on("click", "[data-action='enter-jacket']", this._onEnterJacket.bind(this));
    html.on("click", "[data-action='exit-jacket']", this._onExitJacket.bind(this));
    html.on("click", "[data-action='open-jacket-sheet']", this._onOpenJacketSheet.bind(this));
    html.on("change", ".bj-lp-input", this._onBJResourceChange.bind(this));
    html.on("change", ".bj-kp-input", this._onBJResourceChange.bind(this));
    html.on("change", ".bj-weakpoint-toggle", this._onBJWeakPointToggle.bind(this));

    // Downtime tab
    html.on("click", "[data-action='dt-start-period']", this._onDtStartPeriod.bind(this));
    html.on("click", "[data-action='dt-end-period']", this._onDtEndPeriod.bind(this));
    html.on("click", "[data-action='dt-cancel-period']", this._onDtCancelPeriod.bind(this));
    html.on("click", "[data-action='dt-use-activity']", this._onDtUseActivity.bind(this));
    html.on("click", "[data-action='dt-undo-activity']", this._onDtUndoActivity.bind(this));
    html.on("change", "[data-action='dt-toggle-modifier']", this._onDtToggleModifier.bind(this));
    html.on("click", "[data-action='dt-delete-history']", this._onDtDeleteHistory.bind(this));

    // ---- Transformation Customization listeners ----
    html.on("click", "[data-action='tfc-toggle-section']", (ev) => {
      ev.currentTarget.closest(".tfc-section").classList.toggle("collapsed");
    });
    html.on("click", "[data-action='tfc-remove-aspect']", this._onTfcRemoveAspect.bind(this));
    html.on("click", "[data-action='tfc-add-aspect']", this._onTfcAddAspect.bind(this));
    html.on("keydown", ".tfc-aspect-input", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        const idx = ev.currentTarget.dataset.transIndex;
        html.find(`[data-action='tfc-add-aspect'][data-trans-index='${idx}']`).trigger("click");
      }
    });
    html.on("change", "[data-action='tfc-edit-amb']", this._onTfcEditAmb.bind(this));
    html.on("change", "[data-action='tfc-set-power-improvement']", this._onTfcSetPowerImprovement.bind(this));
    html.on("change", "[data-action='tfc-set-ls-form']", this._onTfcSetLsForm.bind(this));
    html.on("change", "[data-action='tfc-set-ls-exceed']", this._onTfcSetLsExceed.bind(this));
    html.on("change", "[data-action='tfc-toggle-exceed']", this._onTfcToggleExceed.bind(this));
    html.on("change", "[data-action='tfc-set-up-form']", this._onTfcSetUpField.bind(this));
    html.on("change", "[data-action='tfc-set-up-path']", this._onTfcSetUpField.bind(this));
    html.on("change", "[data-action='tfc-set-up-amb']", this._onTfcSetUpField.bind(this));
    html.on("click", "[data-action='tfc-add-up']", this._onTfcAddUp.bind(this));
    html.on("click", "[data-action='tfc-delete-up']", this._onTfcDeleteUp.bind(this));
  }

  // -------------------------------------------------------
  // Skill Roll
  // -------------------------------------------------------

  async _onRollSkill(event) {
    event.preventDefault();
    const skillKey = event.currentTarget.dataset.skill;
    if (!skillKey) return;

    // Find skill data from context
    const skillDef = (CONFIG.DBU?.skillsData || []).find(s => s.id === skillKey);
    const skillName = skillDef?.name || skillKey;
    const attrKey = skillDef?.attribute || "ag";
    const rank = this.actor.system.skills?.[skillKey]?.rank ?? this.actor.system.skills?.[skillKey] ?? 0;
    const attrData = this.actor.system.attributes?.[attrKey];
    const attrScore = attrData?.score ?? 0;
    const gsBonus = this.actor.system.aptitudes?.giftedStudentSkillBonus || 0;
    const equipBonus = Number(this.actor.system.equipmentFlags?.skillBonuses?.[skillKey]) || 0;
    let bonus = Math.floor(attrScore / 2) + (Number(rank) || 0) * 2 + gsBonus + equipBonus;

    // --- Absorption OSF: use best skill bonus among suppressed actors ---
    let viaName = "";
    const fusion = this.actor.system.fusion || {};
    if (fusion.isFusion && fusion.type === "one-sided-absorption") {
      const suppIds = fusion.suppressedCharacterIds || [];
      for (const suppId of suppIds) {
        const suppActor = game.actors?.get(suppId);
        if (!suppActor) continue;
        const sRank = suppActor.system.skills?.[skillKey]?.rank ?? suppActor.system.skills?.[skillKey] ?? 0;
        const sAttrData = suppActor.system.attributes?.[attrKey];
        const sAttrScore = sAttrData?.score ?? 0;
        // Suppressed actor's own equipment skill bonuses (Absorption pulls best total)
        const sEquipBonus = Number(suppActor.system.equipmentFlags?.skillBonuses?.[skillKey]) || 0;
        const sBonus = Math.floor(sAttrScore / 2) + (Number(sRank) || 0) * 2 + sEquipBonus;
        if (sBonus > bonus) {
          bonus = sBonus;
          viaName = suppActor.name;
        }
      }
    }

    // Roll Base Die (d10) + bonus
    const roll = new Roll(`1d10 + ${bonus}`);
    await roll.evaluate();

    // Create chat message
    let label = `${skillName} (${attrKey.toUpperCase()})`;
    if (viaName) label += ` (via ${viaName})`;
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label
    });
  }

  // -------------------------------------------------------
  // Counter Buttons
  // -------------------------------------------------------

  async _onCounterButton(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const field = btn.dataset.field;
    const action = btn.dataset.action;
    if (!field) return;
    const current = foundry.utils.getProperty(this.actor, field) ?? 0;
    const newVal = action === "increase" ? current + 1 : Math.max(0, current - 1);
    await this.actor.update({ [field]: newVal });
  }

  // -------------------------------------------------------
  // Custom Buff CRUD
  // -------------------------------------------------------

  async _onAddCustomBuff(event) {
    event.preventDefault();
    const buffs = foundry.utils.deepClone(this.actor.system.customBuffs || []);
    const nextId = buffs.length > 0 ? Math.max(...buffs.map(b => b.id || 0)) + 1 : 1;
    buffs.push({ id: nextId, name: "", active: true, effect: "", flat: 0, bT: 0, T: 0 });
    await this.actor.update({ "system.customBuffs": buffs });
  }

  async _onDeleteCustomBuff(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const buffs = foundry.utils.deepClone(this.actor.system.customBuffs || []);
    buffs.splice(index, 1);
    await this.actor.update({ "system.customBuffs": buffs });
  }

  // -------------------------------------------------------
  // Combat Reset Actions (Main Tab)
  // -------------------------------------------------------

  async _onNewRound(event) {
    event.preventDefault();
    const updates = {
      "system.tracking.energyCharges": 0,
      "system.tracking.diminishingDefense": 0,
      "system.tracking.diminishingOffense": 0,
      // Reset Experienced Fighter for new round
      "system.experiencedFighter.mode": "none",
      "system.experiencedFighter.usedThisRound": false,
      // Reset round-scoped transformation tracking
      "system.transformationMeta.surgingStrengthRound": 0
    };

    // Explicitly delete round-scoped keys (Foundry deep merge workaround)
    const ru = this.actor.system.combatTabState?.resourceUsage?.round || {};
    for (const key of Object.keys(ru)) {
      updates[`system.combatTabState.resourceUsage.round.-=${key}`] = null;
    }
    const ue = this.actor.system.effectTracking?.usedEffects?.round || {};
    for (const key of Object.keys(ue)) {
      updates[`system.effectTracking.usedEffects.round.-=${key}`] = null;
    }

    await this.actor.update(updates);
  }

  async _onNewEncounter(event) {
    event.preventDefault();
    const updates = {
      "system.tracking.energyCharges": 0,
      "system.tracking.powerStacks": 0,
      "system.tracking.diminishingDefense": 0,
      "system.tracking.diminishingOffense": 0,
      "system.status.capacitySpent": 0,
      "system.status.superStacks": 0,
      "system.combatStates.raging": false,
      "system.combatStates.surging": false,
      "system.combatStates.mindful": false,
      "system.combatStates.superior": false,
      "system.combatStates.undying": false,
      "system.thresholds.bruised.checked": false,
      "system.thresholds.injured.checked": false,
      "system.thresholds.critical.checked": false,
      "system.battleBorn.strike": 0,
      "system.battleBorn.dodge": 0,
      "system.battleBorn.wound": 0,
      "system.battleBorn.undying": false,
      // Reset Experienced Fighter
      "system.experiencedFighter.mode": "none",
      "system.experiencedFighter.usedThisRound": false,
      // Reset transformation encounter tracking
      "system.transformationMeta.burstLimitUsed": false,
      "system.transformationMeta.burstLimitSource": "",
      "system.transformationMeta.legendRealizedUsed": [],
      "system.transformationMeta.nlopActiveEncounter": [],
      "system.transformationMeta.persistentCombatStates": {},
      "system.transformationMeta.specialResources": {},
      "system.transformationMeta.surgingStrengthEncounter": 0,
      "system.transformationMeta.surgingStrengthRound": 0,
      // Reset One-Sided Fusion encounter tracking
      "system.fusion.encounterThresholdsCrossed": 0,
      // Reset Hidden weapon quality usage (per-encounter flag)
      "system.equipmentFlags.hiddenUsedThisEncounter": false,
      // Reset combat tab round tracker and damage log
      "system.combatTabState.currentRound": 0,
      "system.combatTabState.rounds": [],
      "system.combatTabState.damageLog": []
    };

    // Reset Possession host LP tracking if in possession mode
    const fusion = this.actor.system.fusion || {};
    if (fusion.isFusion && fusion.type === "one-sided-possession") {
      const hostId = (fusion.suppressedCharacterIds || [])[0];
      const hostActor = hostId ? game.actors?.get(hostId) : null;
      if (hostActor) {
        updates["system.fusion.hostCurrentLP"] = hostActor.system.lifePoints?.value ?? hostActor.system.lifePoints?.max ?? 0;
      }
    }

    // Explicitly delete all resourceUsage and usedEffects keys
    const ru = this.actor.system.combatTabState?.resourceUsage || {};
    for (const key of Object.keys(ru.round || {})) {
      updates[`system.combatTabState.resourceUsage.round.-=${key}`] = null;
    }
    for (const key of Object.keys(ru.encounter || {})) {
      updates[`system.combatTabState.resourceUsage.encounter.-=${key}`] = null;
    }
    const ue = this.actor.system.effectTracking?.usedEffects || {};
    for (const key of Object.keys(ue.round || {})) {
      updates[`system.effectTracking.usedEffects.round.-=${key}`] = null;
    }
    for (const key of Object.keys(ue.encounter || {})) {
      updates[`system.effectTracking.usedEffects.encounter.-=${key}`] = null;
    }

    await this.actor.update(updates);
  }

  // -------------------------------------------------------
  // Effect Panel Interactions (Main Tab)
  // -------------------------------------------------------

  _onToggleEffectGroup(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const group = header.closest(".effect-group");
    if (group) group.classList.toggle("collapsed");
  }

  async _onPassiveToggle(event) {
    const effectId = event.currentTarget.dataset.effectId;
    const et = foundry.utils.deepClone(this.actor.system.effectTracking || {});
    if (!et.enabledPassives) et.enabledPassives = {};
    et.enabledPassives[effectId] = event.currentTarget.checked;
    await this.actor.update({ "system.effectTracking": et });
  }

  async _onUsagePipClick(event) {
    event.preventDefault();
    const pip = event.currentTarget;
    const tracker = pip.closest(".usage-tracker");
    if (!tracker) return;
    const effectId = tracker.dataset.effectId;
    const limit = tracker.dataset.limit || "round";
    const maxUses = Number(tracker.dataset.max) || 1;

    const et = foundry.utils.deepClone(this.actor.system.effectTracking || {});
    if (!et.usedEffects) et.usedEffects = { round: {}, encounter: {} };
    const usedKey = limit === "round" ? "round" : "encounter";
    const currentUsed = et.usedEffects[usedKey][effectId] || 0;

    if (pip.classList.contains("available")) {
      // Use one
      et.usedEffects[usedKey][effectId] = Math.min(maxUses, currentUsed + 1);
    } else {
      // Undo one
      et.usedEffects[usedKey][effectId] = Math.max(0, currentUsed - 1);
      if (et.usedEffects[usedKey][effectId] === 0) delete et.usedEffects[usedKey][effectId];
    }
    await this.actor.update({ "system.effectTracking": et });
  }

  // -------------------------------------------------------
  // Racial Trait CRUD
  // -------------------------------------------------------

  _onToggleTrait(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const card = btn.closest(".trait-card");
    if (!card) return;
    const effectsList = card.querySelector(".trait-effects-list");
    const description = card.querySelector(".trait-description");
    const icon = btn.querySelector("i");
    if (!effectsList) return;
    const isCollapsed = effectsList.style.display === "none";
    effectsList.style.display = isCollapsed ? "" : "none";
    if (description) description.style.display = isCollapsed ? "" : "none";
    if (icon) icon.className = isCollapsed ? "fas fa-chevron-down" : "fas fa-chevron-right";
  }

  async _onAddTrait(event) {
    event.preventDefault();
    const race = this.actor.system.race || "saiyan";
    const catalog = CONFIG.DBU?.racialTraitsCatalog || {};
    const selectedIds = this.actor.system.racialTraits || [];

    const allTraits = [];
    for (const [traitRace, traits] of Object.entries(catalog)) {
      for (const trait of traits) {
        allTraits.push({ ...trait, race: traitRace, isSelected: selectedIds.includes(trait.id) });
      }
    }
    allTraits.sort((a, b) => {
      if (a.race === race && b.race !== race) return -1;
      if (b.race === race && a.race !== race) return 1;
      return a.name.localeCompare(b.name);
    });

    // Collect unique races for filter (use display names from sheet raceOptions)
    const raceDisplayNames = {
      saiyan: "Saiyan", earthling: "Earthling", namekian: "Namekian",
      android: "Android", bioAndroid: "Bio-Android", majin: "Majin",
      arcosian: "Arcosian", shinjin: "Shinjin", cerealian: "Cerealian",
      neoTuffle: "Neo-Tuffle", nekoMajin: "Neko-Majin", shadowDragon: "Shadow Dragon",
      undead: "Undead", customSpecies: "Custom Species"
    };
    const races = [...new Set(allTraits.map(t => t.race))].sort();
    const raceOptions = races.map(r => `<option value="${r}" ${r === race ? "selected" : ""}>${raceDisplayNames[r] || r}</option>`).join("");

    const buildList = (filterRace, hideSelected) => {
      return allTraits.filter(t => {
        if (filterRace && t.race !== filterRace) return false;
        if (hideSelected && t.isSelected) return false;
        return true;
      }).map(t => {
        const badge = t.traitCategory || "secondary";
        const selClass = t.isSelected ? "trait-selector-selected" : "";
        return `<div class="trait-selector-item ${selClass}" data-trait-id="${t.id}">
          <span class="trait-selector-name">${t.name}</span>
          <span class="trait-category-badge ${badge}">${badge}</span>
          <span class="trait-selector-race">${raceDisplayNames[t.race] || t.race}</span>
          ${t.isSelected ? '<span class="trait-selector-check"><i class="fas fa-check"></i></span>' : ""}
        </div>`;
      }).join("");
    };

    const content = `<div class="trait-selector-modal">
      <div class="trait-selector-filters">
        <div class="filter-group"><label>Filter by Race:</label><select class="trait-race-filter"><option value="">All Races</option>${raceOptions}</select></div>
        <div class="filter-group"><label class="filter-toggle"><input type="checkbox" class="trait-hide-selected" /> Hide selected</label></div>
      </div>
      <div class="trait-selector-list">${buildList(race, false)}</div>
    </div>`;

    const dlg = new Dialog({
      title: "Add Racial Trait",
      content,
      buttons: { close: { label: "Close" } },
      default: "close",
      render: (html) => {
        const listEl = html.find(".trait-selector-list");
        const raceFilter = html.find(".trait-race-filter");
        const hideCheck = html.find(".trait-hide-selected");

        const refresh = () => {
          const r = raceFilter.val();
          const h = hideCheck.is(":checked");
          listEl.html(buildList(r, h));
        };

        raceFilter.on("change", refresh);
        hideCheck.on("change", refresh);

        html.on("click", ".trait-selector-item:not(.trait-selector-selected)", async (ev) => {
          const traitId = ev.currentTarget.dataset.traitId;
          if (!traitId) return;
          const traits = foundry.utils.deepClone(this.actor.system.racialTraits || []);
          traits.push(traitId);
          await this.actor.update({ "system.racialTraits": traits });
          // Mark as selected in allTraits for refresh
          const t = allTraits.find(x => x.id === traitId);
          if (t) t.isSelected = true;
          refresh();
        });
      }
    }, { width: 500, height: 500, classes: ["dbu-old", "trait-selector-dialog"] });
    dlg.render(true);
  }

  async _onDeleteTrait(event) {
    event.preventDefault();
    const traitId = event.currentTarget.dataset.traitId;
    if (!traitId) return;
    const traits = foundry.utils.deepClone(this.actor.system.racialTraits || []);
    const index = traits.indexOf(traitId);
    if (index > -1) {
      traits.splice(index, 1);
      const options = foundry.utils.deepClone(this.actor.system.racialOptionSelections || {});
      delete options[traitId];
      await this.actor.update({ "system.racialTraits": traits, "system.racialOptionSelections": options });
    }
  }

  async _onTraitOptionSelect(event) {
    const { traitId, effectLevel } = event.currentTarget.dataset;
    if (!traitId || !effectLevel) return;
    const options = foundry.utils.deepClone(this.actor.system.racialOptionSelections || {});
    if (!options[traitId]) options[traitId] = {};
    options[traitId][effectLevel] = event.currentTarget.value;
    await this.actor.update({ "system.racialOptionSelections": options });
  }

  async _onTraitOptionCheckbox(event) {
    const { traitId, effectLevel, optionName, maxOptions } = event.currentTarget.dataset;
    if (!traitId || !effectLevel || !optionName) return;
    const options = foundry.utils.deepClone(this.actor.system.racialOptionSelections || {});
    if (!options[traitId]) options[traitId] = {};
    let current = options[traitId][effectLevel];
    if (!Array.isArray(current)) current = current ? [current] : [];
    const max = maxOptions ? Number(maxOptions) : Infinity;
    if (event.currentTarget.checked) {
      if (current.length < max && !current.includes(optionName)) current.push(optionName);
      else if (current.length >= max) { event.currentTarget.checked = false; return; }
    } else {
      current = current.filter(n => n !== optionName);
    }
    options[traitId][effectLevel] = current;
    await this.actor.update({ "system.racialOptionSelections": options });
  }

  // -------------------------------------------------------
  // Adversary: Villainous Trait CRUD
  // -------------------------------------------------------

  async _onAddVillainousTrait(event) {
    event.preventDefault();
    const catalog = CONFIG.DBU?.villainousTraitsCatalog || [];
    const selectedIds = this.actor.system.adversary?.villainousTraits || [];

    const allTraits = catalog.map(t => ({
      ...t,
      isSelected: selectedIds.includes(t.id)
    }));

    const buildList = (hideSelected) => {
      return allTraits.filter(t => {
        if (hideSelected && t.isSelected) return false;
        return true;
      }).map(t => {
        const badge = t.category || "offensive";
        const selClass = t.isSelected ? "trait-selector-selected" : "";
        return `<div class="trait-selector-item ${selClass}" data-trait-id="${t.id}">
          <span class="trait-selector-name">${t.name}</span>
          <span class="trait-category-badge ${badge}">${badge}</span>
          ${t.isSelected ? '<span class="trait-selector-check"><i class="fas fa-check"></i></span>' : ""}
        </div>`;
      }).join("");
    };

    const content = `<div class="trait-selector-modal">
      <div class="trait-selector-filters">
        <div class="filter-group"><label class="filter-toggle"><input type="checkbox" class="trait-hide-selected" /> Hide selected</label></div>
      </div>
      <div class="trait-selector-list">${buildList(false)}</div>
    </div>`;

    const dlg = new Dialog({
      title: "Add Villainous Trait",
      content,
      buttons: { close: { label: "Close" } },
      default: "close",
      render: (html) => {
        const listEl = html.find(".trait-selector-list");
        const hideCheck = html.find(".trait-hide-selected");
        const refresh = () => listEl.html(buildList(hideCheck.is(":checked")));
        hideCheck.on("change", refresh);
        html.on("click", ".trait-selector-item:not(.trait-selector-selected)", async (ev) => {
          const traitId = ev.currentTarget.dataset.traitId;
          if (!traitId) return;
          const traits = foundry.utils.deepClone(this.actor.system.adversary?.villainousTraits || []);
          traits.push(traitId);
          await this.actor.update({ "system.adversary.villainousTraits": traits });
          const t = allTraits.find(x => x.id === traitId);
          if (t) t.isSelected = true;
          refresh();
        });
      }
    }, { width: 500, height: 500, classes: ["dbu-old", "trait-selector-dialog"] });
    dlg.render(true);
  }

  async _onDeleteVillainousTrait(event) {
    event.preventDefault();
    const traitId = event.currentTarget.dataset.traitId;
    if (!traitId) return;
    const traits = foundry.utils.deepClone(this.actor.system.adversary?.villainousTraits || []);
    const index = traits.indexOf(traitId);
    if (index > -1) {
      traits.splice(index, 1);
      const options = foundry.utils.deepClone(this.actor.system.adversary?.villainousOptionSelections || {});
      delete options[traitId];
      await this.actor.update({
        "system.adversary.villainousTraits": traits,
        "system.adversary.villainousOptionSelections": options
      });
    }
  }

  // -------------------------------------------------------
  // Adversary: Weakness CRUD
  // -------------------------------------------------------

  async _onAddWeakness(event) {
    event.preventDefault();
    const catalog = CONFIG.DBU?.weaknessesCatalog || [];
    const selectedIds = this.actor.system.adversary?.weaknesses || [];

    const allWeaknesses = catalog.map(w => ({
      ...w,
      isSelected: selectedIds.includes(w.id)
    }));

    const buildList = (hideSelected) => {
      return allWeaknesses.filter(w => {
        if (hideSelected && w.isSelected) return false;
        return true;
      }).map(w => {
        const selClass = w.isSelected ? "trait-selector-selected" : "";
        return `<div class="trait-selector-item ${selClass}" data-trait-id="${w.id}">
          <span class="trait-selector-name">${w.name}</span>
          <span class="trait-category-badge weakness">weakness</span>
          ${w.isSelected ? '<span class="trait-selector-check"><i class="fas fa-check"></i></span>' : ""}
        </div>`;
      }).join("");
    };

    const content = `<div class="trait-selector-modal">
      <div class="trait-selector-filters">
        <div class="filter-group"><label class="filter-toggle"><input type="checkbox" class="trait-hide-selected" /> Hide selected</label></div>
      </div>
      <div class="trait-selector-list">${buildList(false)}</div>
    </div>`;

    const dlg = new Dialog({
      title: "Add Weakness",
      content,
      buttons: { close: { label: "Close" } },
      default: "close",
      render: (html) => {
        const listEl = html.find(".trait-selector-list");
        const hideCheck = html.find(".trait-hide-selected");
        const refresh = () => listEl.html(buildList(hideCheck.is(":checked")));
        hideCheck.on("change", refresh);
        html.on("click", ".trait-selector-item:not(.trait-selector-selected)", async (ev) => {
          const wkId = ev.currentTarget.dataset.traitId;
          if (!wkId) return;
          const weaknesses = foundry.utils.deepClone(this.actor.system.adversary?.weaknesses || []);
          weaknesses.push(wkId);
          await this.actor.update({ "system.adversary.weaknesses": weaknesses });
          const w = allWeaknesses.find(x => x.id === wkId);
          if (w) w.isSelected = true;
          refresh();
        });
      }
    }, { width: 500, height: 400, classes: ["dbu-old", "trait-selector-dialog"] });
    dlg.render(true);
  }

  async _onDeleteWeakness(event) {
    event.preventDefault();
    const traitId = event.currentTarget.dataset.traitId;
    if (!traitId) return;
    const weaknesses = foundry.utils.deepClone(this.actor.system.adversary?.weaknesses || []);
    const index = weaknesses.indexOf(traitId);
    if (index > -1) {
      weaknesses.splice(index, 1);
      const options = foundry.utils.deepClone(this.actor.system.adversary?.weaknessOptionSelections || {});
      delete options[traitId];
      await this.actor.update({
        "system.adversary.weaknesses": weaknesses,
        "system.adversary.weaknessOptionSelections": options
      });
    }
  }

  // -------------------------------------------------------
  // Adversary: Minion Trait CRUD
  // -------------------------------------------------------

  async _onAddMinionTrait(event) {
    event.preventDefault();
    const catalog = CONFIG.DBU?.minionTraitsCatalog || [];
    const selectedIds = this.actor.system.adversary?.minion?.minionTraits || [];

    const allTraits = catalog.map(t => ({
      ...t,
      isSelected: selectedIds.includes(t.id)
    }));

    const buildList = () => {
      return allTraits.map(t => {
        const selClass = t.isSelected ? "trait-selector-selected" : "";
        return `<div class="trait-selector-item ${selClass}" data-trait-id="${t.id}">
          <span class="trait-selector-name">${t.name}</span>
          <span class="trait-category-badge minion">minion</span>
          ${t.isSelected ? '<span class="trait-selector-check"><i class="fas fa-check"></i></span>' : ""}
        </div>`;
      }).join("");
    };

    const content = `<div class="trait-selector-modal">
      <div class="trait-selector-list">${buildList()}</div>
    </div>`;

    const dlg = new Dialog({
      title: "Add Minion Trait",
      content,
      buttons: { close: { label: "Close" } },
      default: "close",
      render: (html) => {
        const listEl = html.find(".trait-selector-list");
        html.on("click", ".trait-selector-item:not(.trait-selector-selected)", async (ev) => {
          const traitId = ev.currentTarget.dataset.traitId;
          if (!traitId) return;
          const traits = foundry.utils.deepClone(this.actor.system.adversary?.minion?.minionTraits || []);
          traits.push(traitId);
          await this.actor.update({ "system.adversary.minion.minionTraits": traits });
          const t = allTraits.find(x => x.id === traitId);
          if (t) t.isSelected = true;
          listEl.html(buildList());
        });
      }
    }, { width: 500, height: 300, classes: ["dbu-old", "trait-selector-dialog"] });
    dlg.render(true);
  }

  async _onDeleteMinionTrait(event) {
    event.preventDefault();
    const traitId = event.currentTarget.dataset.traitId;
    if (!traitId) return;
    const traits = foundry.utils.deepClone(this.actor.system.adversary?.minion?.minionTraits || []);
    const index = traits.indexOf(traitId);
    if (index > -1) {
      traits.splice(index, 1);
      await this.actor.update({ "system.adversary.minion.minionTraits": traits });
    }
  }

  _onToggleTraitCard(event) {
    event.preventDefault();
    const card = event.currentTarget.closest(".trait-card");
    if (card) card.classList.toggle("collapsed");
  }

  // -------------------------------------------------------
  // Talent CRUD
  // -------------------------------------------------------

  async _onAddTalent(event) {
    event.preventDefault();
    const catalog = CONFIG.DBU?.talentsCatalog || [];
    const selectedIds = foundry.utils.deepClone(this.actor.system.talents || []);

    // Build enriched list with selection state
    const allTalents = catalog.map(t => ({
      ...t,
      isSelected: selectedIds.includes(t.id)
    }));
    allTalents.sort((a, b) => {
      const catCmp = (a.category || "").localeCompare(b.category || "");
      return catCmp !== 0 ? catCmp : a.name.localeCompare(b.name);
    });

    // Collect unique categories
    const categories = [...new Set(allTalents.map(t => t.category).filter(Boolean))].sort();
    const catOptions = categories.map(c => `<option value="${c}">${c}</option>`).join("");

    const buildList = (catFilter, searchText, hideSelected) => {
      const filtered = allTalents.filter(t => {
        if (catFilter && t.category !== catFilter) return false;
        if (hideSelected && t.isSelected) return false;
        if (searchText) {
          const s = searchText.toLowerCase();
          if (!t.name.toLowerCase().includes(s) && !(t.description || "").toLowerCase().includes(s)) return false;
        }
        return true;
      });

      // Group by category
      const groups = {};
      for (const t of filtered) {
        const cat = t.category || "Miscellaneous";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(t);
      }

      let html = "";
      for (const [cat, talents] of Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))) {
        html += `<div class="talent-selector-group-header">${cat} (${talents.length})</div>`;
        for (const t of talents) {
          const selClass = t.isSelected ? "talent-selector-selected" : "";
          const prereq = t.prerequisites ? `<span class="talent-selector-prereq">Prereq: ${t.prerequisites}</span>` : "";
          html += `<div class="talent-selector-item ${selClass}" data-talent-id="${t.id}">
            <span class="talent-selector-name">${t.name}</span>
            <span class="talent-category-badge">${t.category}</span>
            ${prereq}
            ${t.isSelected ? '<span class="talent-selector-check"><i class="fas fa-check"></i></span>' : ""}
          </div>`;
        }
      }
      return html || '<div class="empty-message">No talents match filters.</div>';
    };

    const content = `<div class="talent-selector-modal">
      <div class="talent-selector-filters">
        <div class="filter-group"><label>Category:</label><select class="talent-cat-filter"><option value="">All Categories</option>${catOptions}</select></div>
        <div class="filter-group"><label>Search:</label><input type="text" class="talent-search" placeholder="Search talents..." /></div>
        <div class="filter-group"><label class="filter-toggle"><input type="checkbox" class="talent-hide-selected" /> Hide selected</label></div>
      </div>
      <div class="talent-selector-list">${buildList("", "", false)}</div>
    </div>`;

    const dlg = new Dialog({
      title: "Add Talent",
      content,
      buttons: { close: { label: "Close" } },
      default: "close",
      render: (html) => {
        const listEl = html.find(".talent-selector-list");
        const catFilter = html.find(".talent-cat-filter");
        const searchInput = html.find(".talent-search");
        const hideCheck = html.find(".talent-hide-selected");

        const refresh = () => {
          listEl.html(buildList(catFilter.val(), searchInput.val(), hideCheck.is(":checked")));
        };

        catFilter.on("change", refresh);
        searchInput.on("input", refresh);
        hideCheck.on("change", refresh);

        html.on("click", ".talent-selector-item:not(.talent-selector-selected)", async (ev) => {
          const talentId = ev.currentTarget.dataset.talentId;
          if (!talentId) return;
          const talents = foundry.utils.deepClone(this.actor.system.talents || []);
          talents.push(talentId);
          await this.actor.update({ "system.talents": talents });
          const t = allTalents.find(x => x.id === talentId);
          if (t) t.isSelected = true;
          refresh();
        });
      }
    }, { width: 550, height: 550, classes: ["dbu-old", "talent-selector-dialog"] });
    dlg.render(true);
  }

  async _onDeleteTalent(event) {
    event.preventDefault();
    const talentId = event.currentTarget.dataset.talentId;
    if (!talentId) return;
    const talents = foundry.utils.deepClone(this.actor.system.talents || []);
    const index = talents.indexOf(talentId);
    if (index > -1) { talents.splice(index, 1); await this.actor.update({ "system.talents": talents }); }
  }

  _onTalentCategoryFilter(event) {
    this._talentCategoryFilter = event.currentTarget.value;
    this.render(false);
  }

  // -------------------------------------------------------
  // Technique CRUD
  // -------------------------------------------------------

  async _onAddTechnique(event) {
    event.preventDefault();
    const techs = foundry.utils.deepClone(this.actor.system.signatureTechniques || []);
    const nextId = techs.length > 0 ? Math.max(...techs.map(t => t.id || 0)) + 1 : 1;
    techs.push({
      id: nextId, name: "New Technique", type: "signature",
      foundation: "Physical", profile: "Simple", description: "",
      tpMax: 10, freeTP: 0, baseEnergyCharges: 0, extraEnergyCharges: 0,
      isLimitBreak: false, isWeapon: false,
      advantages: [], disadvantages: []
    });
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  async _onDeleteTechnique(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const techId = Number(event.currentTarget.dataset.techniqueId);
    const techs = foundry.utils.deepClone(this.actor.system.signatureTechniques || []);
    const idx = techs.findIndex(t => t.id === techId);
    if (idx > -1) { techs.splice(idx, 1); await this.actor.update({ "system.signatureTechniques": techs }); }
  }

  async _onTechniqueFieldChange(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const el = event.currentTarget;
    const techId = Number(el.dataset.techId);
    const field = el.dataset.field;
    if (isNaN(techId) || !field) return;
    const techs = foundry.utils.deepClone(this.actor.system.signatureTechniques || []);
    const tech = techs.find(t => t.id === techId);
    if (!tech) return;
    if (el.type === "checkbox") tech[field] = el.checked;
    else if (el.type === "number") tech[field] = Number(el.value) || 0;
    else tech[field] = el.value;
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  async _onTechStyleToggle(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const btn = event.currentTarget;
    const card = btn.closest(".signature-technique-card");
    if (!card) return;
    const techId = Number(card.dataset.techniqueId);
    const isWeapon = btn.dataset.style === "weapon";
    const techs = foundry.utils.deepClone(this.actor.system.signatureTechniques || []);
    const tech = techs.find(t => t.id === techId);
    if (!tech) return;
    tech.isWeapon = isWeapon;
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  async _onAddTechAdvantage(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const techId = Number(event.currentTarget.dataset.techniqueId);
    const techs = foundry.utils.deepClone(this.actor.system.signatureTechniques || []);
    const tech = techs.find(t => t.id === techId);
    if (!tech) return;
    if (!tech.advantages) tech.advantages = [];
    tech.advantages.push({ name: "", ranks: 1, notes: "", tpCost: 0, dynamicTP: 0 });
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  async _onRemoveTechAdvantage(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const techId = Number(event.currentTarget.dataset.techniqueId);
    const advIndex = Number(event.currentTarget.dataset.advIndex);
    const techs = foundry.utils.deepClone(this.actor.system.signatureTechniques || []);
    const tech = techs.find(t => t.id === techId);
    if (!tech || !tech.advantages) return;
    tech.advantages.splice(advIndex, 1);
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  async _onTechAdvField(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const el = event.currentTarget;
    const techId = Number(el.dataset.techId);
    const advIndex = Number(el.dataset.advIndex);
    const field = el.dataset.field;
    const techs = foundry.utils.deepClone(this.actor.system.signatureTechniques || []);
    const tech = techs.find(t => t.id === techId);
    if (!tech?.advantages?.[advIndex]) return;
    if (field === "name") {
      tech.advantages[advIndex].name = el.value;
      // Auto-calculate TP cost based on name and ranks
      tech.advantages[advIndex].tpCost = this._lookupAdvTP(el.value, tech.advantages[advIndex].ranks);
    } else if (field === "ranks") {
      tech.advantages[advIndex].ranks = Number(el.value) || 1;
      tech.advantages[advIndex].tpCost = this._lookupAdvTP(tech.advantages[advIndex].name, Number(el.value) || 1);
    } else if (field === "dynamicTP") {
      tech.advantages[advIndex].dynamicTP = Number(el.value) || 0;
    } else {
      tech.advantages[advIndex][field] = el.value;
    }
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  async _onAddTechDisadvantage(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const techId = Number(event.currentTarget.dataset.techniqueId);
    const techs = foundry.utils.deepClone(this.actor.system.signatureTechniques || []);
    const tech = techs.find(t => t.id === techId);
    if (!tech) return;
    if (!tech.disadvantages) tech.disadvantages = [];
    tech.disadvantages.push({ name: "", ranks: 1, notes: "", tpCost: 0, dynamicTP: 0 });
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  async _onRemoveTechDisadvantage(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const techId = Number(event.currentTarget.dataset.techniqueId);
    const disadvIndex = Number(event.currentTarget.dataset.disadvIndex);
    const techs = foundry.utils.deepClone(this.actor.system.signatureTechniques || []);
    const tech = techs.find(t => t.id === techId);
    if (!tech || !tech.disadvantages) return;
    tech.disadvantages.splice(disadvIndex, 1);
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  async _onTechDisadvField(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const el = event.currentTarget;
    const techId = Number(el.dataset.techId);
    const disadvIndex = Number(el.dataset.disadvIndex);
    const field = el.dataset.field;
    const techs = foundry.utils.deepClone(this.actor.system.signatureTechniques || []);
    const tech = techs.find(t => t.id === techId);
    if (!tech?.disadvantages?.[disadvIndex]) return;
    if (field === "name") {
      tech.disadvantages[disadvIndex].name = el.value;
      tech.disadvantages[disadvIndex].tpCost = this._lookupDisadvTP(el.value, tech.disadvantages[disadvIndex].ranks);
    } else if (field === "ranks") {
      tech.disadvantages[disadvIndex].ranks = Number(el.value) || 1;
      tech.disadvantages[disadvIndex].tpCost = this._lookupDisadvTP(tech.disadvantages[disadvIndex].name, Number(el.value) || 1);
    } else if (field === "dynamicTP") {
      tech.disadvantages[disadvIndex].dynamicTP = Number(el.value) || 0;
    } else {
      tech.disadvantages[disadvIndex][field] = el.value;
    }
    await this.actor.update({ "system.signatureTechniques": techs });
  }

  /** Look up total TP for an advantage at given rank count. */
  _lookupAdvTP(name, ranks) {
    const data = CONFIG.DBU?.techniqueAdvantagesData?.[name];
    if (!data) return 0;
    const perRank = Array.isArray(data.tpPerRank) ? data.tpPerRank : [data.tpPerRank || 0];
    let total = 0;
    for (let i = 0; i < ranks; i++) total += perRank[Math.min(i, perRank.length - 1)] || 0;
    return total;
  }

  /** Look up total TP for a disadvantage at given rank count. */
  _lookupDisadvTP(name, ranks) {
    const data = CONFIG.DBU?.techniqueDisadvantagesData?.[name];
    if (!data) return 0;
    const perRank = Array.isArray(data.tpPerRank) ? data.tpPerRank : [data.tpPerRank || 0];
    let total = 0;
    for (let i = 0; i < ranks; i++) total += perRank[Math.min(i, perRank.length - 1)] || 0;
    return total;
  }

  // -------------------------------------------------------
  // Aura CRUD
  // -------------------------------------------------------

  async _onAddAura(event) {
    event.preventDefault();
    const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
    const nextId = auras.length > 0 ? Math.max(...auras.map(a => a.id || 0)) + 1 : 1;
    auras.push({
      id: nextId, name: "New Aura", type: "Sparking", active: false,
      description: "", tpMax: 10, freeTP: 0, advantages: [], disadvantages: []
    });
    await this.actor.update({ "system.signatureAuras": auras });
  }

  async _onDeleteAura(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const auraId = Number(event.currentTarget.dataset.auraId);
    const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
    const idx = auras.findIndex(a => a.id === auraId);
    if (idx > -1) { auras.splice(idx, 1); await this.actor.update({ "system.signatureAuras": auras }); }
  }

  async _onToggleAura(event) {
    event.preventDefault();
    const gainedAuraKey = event.currentTarget.dataset.gainedAuraKey || "";

    // --- Gained aura toggle (One-Sided Fusion) ---
    if (gainedAuraKey) {
      const fusion = this.actor.system.fusion || {};
      const wasActive = fusion.activeGainedAuraId === gainedAuraKey;
      const updateData = {};
      // If activating a gained aura, deactivate any own active aura
      if (!wasActive) {
        const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
        let ownChanged = false;
        for (const a of auras) {
          if (a.active) { a.active = false; ownChanged = true; }
        }
        if (ownChanged) updateData["system.signatureAuras"] = auras;
      }
      updateData["system.fusion.activeGainedAuraId"] = wasActive ? "" : gainedAuraKey;
      await this.actor.update(updateData);
      return;
    }

    // --- Own aura toggle ---
    const auraId = Number(event.currentTarget.dataset.auraId);
    const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
    const aura = auras.find(a => a.id === auraId);
    if (!aura) return;
    const newState = !aura.active;
    // Deactivate all other auras (only one can be active at a time)
    if (newState) {
      for (const a of auras) { if (a.id !== auraId) a.active = false; }
    }
    aura.active = newState;
    const updateData = { "system.signatureAuras": auras };
    // If activating an own aura, clear any active gained aura
    if (newState && this.actor.system.fusion?.activeGainedAuraId) {
      updateData["system.fusion.activeGainedAuraId"] = "";
    }
    await this.actor.update(updateData);
  }

  async _onAuraFieldChange(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const el = event.currentTarget;
    const auraId = Number(el.dataset.auraId);
    const field = el.dataset.field;
    if (isNaN(auraId) || !field) return;
    const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
    const aura = auras.find(a => a.id === auraId);
    if (!aura) return;
    if (el.type === "number") aura[field] = Number(el.value) || 0;
    else aura[field] = el.value;
    await this.actor.update({ "system.signatureAuras": auras });
  }

  async _onAddAuraAdvantage(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const auraId = Number(event.currentTarget.dataset.auraId);
    const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
    const aura = auras.find(a => a.id === auraId);
    if (!aura) return;
    if (!aura.advantages) aura.advantages = [];
    aura.advantages.push({ name: "", ranks: 1, notes: "", tpCost: 0, dynamicTP: 0 });
    await this.actor.update({ "system.signatureAuras": auras });
  }

  async _onRemoveAuraAdvantage(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const auraId = Number(event.currentTarget.dataset.auraId);
    const advIndex = Number(event.currentTarget.dataset.advIndex);
    const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
    const aura = auras.find(a => a.id === auraId);
    if (!aura?.advantages) return;
    aura.advantages.splice(advIndex, 1);
    await this.actor.update({ "system.signatureAuras": auras });
  }

  async _onAuraAdvField(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const el = event.currentTarget;
    const auraId = Number(el.dataset.auraId);
    const advIndex = Number(el.dataset.advIndex);
    const field = el.dataset.field;
    const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
    const aura = auras.find(a => a.id === auraId);
    if (!aura?.advantages?.[advIndex]) return;
    if (field === "name") {
      aura.advantages[advIndex].name = el.value;
      aura.advantages[advIndex].ranks = 1;
      aura.advantages[advIndex].tpCost = this._lookupAuraAdvTP(el.value, 1);
    } else if (field === "ranks") {
      aura.advantages[advIndex].ranks = Number(el.value) || 1;
      aura.advantages[advIndex].tpCost = this._lookupAuraAdvTP(aura.advantages[advIndex].name, Number(el.value) || 1);
    } else if (field === "dynamicTP") {
      aura.advantages[advIndex].dynamicTP = Number(el.value) || 0;
    } else {
      aura.advantages[advIndex][field] = el.value;
    }
    await this.actor.update({ "system.signatureAuras": auras });
  }

  async _onAddAuraDisadvantage(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const auraId = Number(event.currentTarget.dataset.auraId);
    const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
    const aura = auras.find(a => a.id === auraId);
    if (!aura) return;
    if (!aura.disadvantages) aura.disadvantages = [];
    aura.disadvantages.push({ name: "", ranks: 1, notes: "", tpCost: 0, dynamicTP: 0 });
    await this.actor.update({ "system.signatureAuras": auras });
  }

  async _onRemoveAuraDisadvantage(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const auraId = Number(event.currentTarget.dataset.auraId);
    const disadvIndex = Number(event.currentTarget.dataset.disadvIndex);
    const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
    const aura = auras.find(a => a.id === auraId);
    if (!aura?.disadvantages) return;
    aura.disadvantages.splice(disadvIndex, 1);
    await this.actor.update({ "system.signatureAuras": auras });
  }

  async _onAuraDisadvField(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const el = event.currentTarget;
    const auraId = Number(el.dataset.auraId);
    const disadvIndex = Number(el.dataset.disadvIndex);
    const field = el.dataset.field;
    const auras = foundry.utils.deepClone(this.actor.system.signatureAuras || []);
    const aura = auras.find(a => a.id === auraId);
    if (!aura?.disadvantages?.[disadvIndex]) return;
    if (field === "name") {
      aura.disadvantages[disadvIndex].name = el.value;
      aura.disadvantages[disadvIndex].ranks = 1;
      aura.disadvantages[disadvIndex].tpCost = this._lookupAuraDisadvTP(el.value, 1);
    } else if (field === "ranks") {
      aura.disadvantages[disadvIndex].ranks = Number(el.value) || 1;
      aura.disadvantages[disadvIndex].tpCost = this._lookupAuraDisadvTP(aura.disadvantages[disadvIndex].name, Number(el.value) || 1);
    } else if (field === "dynamicTP") {
      aura.disadvantages[disadvIndex].dynamicTP = Number(el.value) || 0;
    } else {
      aura.disadvantages[disadvIndex][field] = el.value;
    }
    await this.actor.update({ "system.signatureAuras": auras });
  }

  _lookupAuraAdvTP(name, ranks) {
    const data = CONFIG.DBU?.auraAdvantagesData?.[name];
    if (!data) return 0;
    const perRank = Array.isArray(data.tpPerRank) ? data.tpPerRank : [data.tpPerRank || 0];
    let total = 0;
    for (let i = 0; i < ranks; i++) total += perRank[Math.min(i, perRank.length - 1)] || 0;
    return total;
  }

  _lookupAuraDisadvTP(name, ranks) {
    const data = CONFIG.DBU?.auraDisadvantagesData?.[name];
    if (!data) return 0;
    const perRank = Array.isArray(data.tpPerRank) ? data.tpPerRank : [data.tpPerRank || 0];
    let total = 0;
    for (let i = 0; i < ranks; i++) total += perRank[Math.min(i, perRank.length - 1)] || 0;
    return total;
  }

  // -------------------------------------------------------
  // Transformation CRUD
  // -------------------------------------------------------

  async _onAddTransformation(event) {
    event.preventDefault();
    const trans = foundry.utils.deepClone(this.actor.system.transformations || []);
    const nextId = trans.length > 0 ? Math.max(...trans.map(t => t.id || 0)) + 1 : 1;
    trans.push({
      id: nextId, catalogKey: null, name: "", active: false,
      gradeOrStacks: "", tierRequirement: "", mastered: false, stressTest: 0,
      transformationType: "form_alternate",
      attrBonuses: { ag: "", fo: "", te: "", sc: "", in: "", ma: "", pe: "" },
      aspects: [], structuredTraits: [], traits: "", isLegendary: false
    });
    await this.actor.update({ "system.transformations": trans });
  }

  async _onDeleteTransformation(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const transIndex = Number(event.currentTarget.dataset.transIndex);
    const trans = foundry.utils.deepClone(this.actor.system.transformations || []);
    if (transIndex >= 0 && transIndex < trans.length) {
      trans.splice(transIndex, 1);
      await this.actor.update({ "system.transformations": trans });
    }
  }

  async _onTransformationFieldChange(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const el = event.currentTarget;
    const transIndex = Number(el.dataset.transIndex);
    const field = el.dataset.field;
    if (isNaN(transIndex) || !field) return;
    const trans = foundry.utils.deepClone(this.actor.system.transformations || []);
    if (transIndex >= trans.length) return;

    // Handle nested attrBonuses fields (e.g. "attrBonuses.ag")
    if (field.startsWith("attrBonuses.")) {
      const attrKey = field.split(".")[1];
      if (!trans[transIndex].attrBonuses) trans[transIndex].attrBonuses = {};
      trans[transIndex].attrBonuses[attrKey] = el.value;
    } else if (el.type === "number") {
      trans[transIndex][field] = Number(el.value) || 0;
    } else {
      trans[transIndex][field] = el.value;
    }
    await this.actor.update({ "system.transformations": trans });
  }

  async _onTransformationCheckChange(event) {
    const el = event.currentTarget;
    const transIndex = Number(el.dataset.transIndex);
    const field = el.dataset.field;
    if (isNaN(transIndex) || !field) return;

    // Handle gained transformation toggle (OSF)
    const gainedKey = el.dataset.gainedKey;
    if (gainedKey && field === "active") {
      const activeGainedIds = foundry.utils.deepClone(this.actor.system.fusion?.activeGainedTransformationIds || []);
      if (el.checked) {
        if (!activeGainedIds.includes(gainedKey)) activeGainedIds.push(gainedKey);
      } else {
        const idx = activeGainedIds.indexOf(gainedKey);
        if (idx >= 0) activeGainedIds.splice(idx, 1);
      }
      await this.actor.update({ "system.fusion.activeGainedTransformationIds": activeGainedIds });
      return;
    }

    // Non-active fields on gained transformations are read-only
    if (el.closest('.gained-ability')) return;

    const trans = foundry.utils.deepClone(this.actor.system.transformations || []);
    if (transIndex >= trans.length) return;
    const wasActive = !!trans[transIndex][field];
    trans[transIndex][field] = el.checked;

    const updates = { "system.transformations": trans };
    let entrySnapshot = null;
    if (field === "active") {
      const snapshots = foundry.utils.deepClone(this.actor.system.transformationMeta?.entrySnapshots || {});
      const transId = String(trans[transIndex].id ?? transIndex);
      if (el.checked && !wasActive) {
        entrySnapshot = this._buildTransformationEntrySnapshot(transIndex, trans);
        snapshots[transId] = entrySnapshot;
      } else if (!el.checked && wasActive) {
        delete snapshots[transId];
      }
      updates["system.transformationMeta.entrySnapshots"] = snapshots;
    }

    await this.actor.update(updates);
    await this._syncPersistentTransformationCombatStates(trans);
    await this._syncPersistentTransformationResources(trans);
    await this._syncPersistentTransformationFlags(trans);

    if (field === "active" && el.checked && !wasActive) {
      await this._applyTransformationEntryEffects(trans[transIndex], entrySnapshot);

      // --- Power High: popup warning on activation ---
      const activated = trans[transIndex];
      const phMatch = (activated.aspects || []).find(a => /Power\s+High/i.test(a));
      if (phMatch) {
        Dialog.prompt({
          title: "Power High",
          content: `<div style="padding:8px;">
            <h3 style="color:#e74c3c;"><i class="fas fa-exclamation-triangle"></i> Power High — ${activated.name || "Transformation"}</h3>
            <p><b>Each turn</b>, roll <b>1d10</b>. If the result is <b>5 or lower</b>:</p>
            <ul>
              <li>You must use <b>Direct Hit</b> on the next attack against you, OR</li>
              <li>Suffer a stack of <b>Slowed</b> until the start of your next turn</li>
            </ul>
            <p>After taking Direct Hit or losing the Slowed stack, the Power High level decreases by 1.</p>
          </div>`,
          callback: () => {}
        });
      }

      // --- Temporary: start countdown ---
      const tmpMatch = (activated.aspects || []).find(a => /Temporary/i.test(a));
      if (tmpMatch) {
        const lvMatch = tmpMatch.match(/\(([^)]+)\)/i);
        const lv = lvMatch ? (parseInt(lvMatch[1]) || 1) : 1;
        const rounds = 6 - Math.min(lv, 5);
        const countdowns = foundry.utils.deepClone(this.actor.system.transformationMeta?.temporaryCountdowns || {});
        const transId = String(activated.id ?? transIndex);
        countdowns[transId] = rounds;
        await this.actor.update({ "system.transformationMeta.temporaryCountdowns": countdowns });
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `<div style="font-size:0.85rem; border-left:3px solid #f39c12; padding-left:8px;">
            <b><i class="fas fa-hourglass-half"></i> Temporary — ${activated.name || "Transformation"}</b><br>
            This transformation will expire in <b>${rounds} rounds</b>.
          </div>`
        });
      }
    }

    // --- Exhausting Aspect: apply conditions when leaving transformation ---
    // "Immediately begin suffering from Stress Exhaustion and Impediment until end of next turn.
    //  Exception: if entering a Transformation with a higher Tier of Power Requirement." (transformation-aspects.txt)
    if (field === "active" && !el.checked && wasActive) {
      const deactivated = trans[transIndex];
      const hasExhausting = (deactivated.aspects || []).some(a => /^Exhausting\b/i.test(a.trim()));
      if (hasExhausting) {
        // Check exception: is any OTHER transformation being activated with higher TR?
        const deactivatedTR = parseInt(String(deactivated.tierRequirement || "0").match(/(\d+)/)?.[1] || "0");
        const higherTRActive = trans.some((t, i) => {
          if (i === transIndex || !t.active) return false;
          const tr = parseInt(String(t.tierRequirement || "0").match(/(\d+)/)?.[1] || "0");
          return tr > deactivatedTR;
        });
        if (!higherTRActive) {
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: `<div style="font-size:0.85rem; border-left:3px solid #e74c3c; padding-left:8px;">
              <b><i class="fas fa-tired"></i> Exhausting — ${deactivated.name || "Transformation"}</b><br>
              You suffer <b>Stress Exhaustion</b> and <b>Impediment</b> Combat Conditions until the end of your next turn.
            </div>`
          });
        }
      }
    }
  }

  _buildTransformationEntrySnapshot(transIndex, transformations) {
    const system = this.actor.system;
    const currentLP = system.lifePoints?.value ?? 0;
    const currentKP = system.kiPool?.value ?? 0;
    const currentMaxLP = system.lifePoints?.max ?? 0;
    const currentMaxKP = system.kiPool?.max ?? 0;
    const currentHealthStatus = system.status?.healthStatus || "healthy";
    const thresholdsBelow = system.thresholds?.crossedCount ?? 0;

    return {
      transIndex,
      transId: transformations?.[transIndex]?.id ?? transIndex,
      catalogKey: transformations?.[transIndex]?.catalogKey || "",
      name: transformations?.[transIndex]?.name || "",
      lp: currentLP,
      kp: currentKP,
      maxLP: currentMaxLP,
      maxKP: currentMaxKP,
      healthStatus: currentHealthStatus,
      thresholdsBelow,
      belowBruised: thresholdsBelow >= 1,
      belowInjured: thresholdsBelow >= 2,
      belowCritical: thresholdsBelow >= 3,
      activeTransformationKeysBeforeEntry: (transformations || [])
        .filter((t, idx) => idx !== transIndex && t?.active)
        .map(t => t.catalogKey)
        .filter(Boolean),
      activeTransformationNamesBeforeEntry: (transformations || [])
        .filter((t, idx) => idx !== transIndex && t?.active)
        .map(t => t.name)
        .filter(Boolean),
      timestamp: Date.now()
    };
  }

  _parseTransformationGradeOrStacks(gradeOrStacks) {
    if (!gradeOrStacks) return 1;
    const str = String(gradeOrStacks).trim();
    const slashIdx = str.indexOf("/");
    const num = parseInt(slashIdx >= 0 ? str.substring(0, slashIdx) : str, 10);
    return isNaN(num) || num <= 0 ? 1 : num;
  }

  _getTransformationStageValue(transformation) {
    const key = transformation?.catalogKey || "";
    const stageMap = {
      super_saiyan_1: 1,
      super_saiyan_2: 2,
      super_saiyan_3: 3,
      ascended_super_saiyan: 1,
      future_super_saiyan: 2,
      legendary_super_saiyan_1: 1,
      legendary_super_saiyan_2: 2,
      legendary_super_saiyan_3: 3,
      super_saiyan_god: 4,
      super_saiyan_blue: 5,
      super_saiyan_rose: 5
    };
    return stageMap[key] ?? this._parseTransformationGradeOrStacks(transformation?.gradeOrStacks);
  }

  _findFormTrigger(prefix, catalogKey, predicate) {
    const entriesMap = {
      ep: this.actor.system.enhancementPowerBonuses?.entries || [],
      af: this.actor.system.alternateFormBonuses?.entries || [],
      lf: this.actor.system.legendaryFormBonuses?.entries || []
    };
    const entries = entriesMap[prefix] || [];

    for (const entry of entries) {
      if (entry.catalogKey !== catalogKey) continue;
      for (const trig of (entry.triggered || [])) {
        if (!predicate(trig)) continue;
        return { entry, trigger: trig, trackingId: `${prefix}:${trig.id}` };
      }
    }
    return null;
  }

  _findAnyFormTrigger(catalogKey, predicate, prefixes = ["ep", "af", "lf"]) {
    for (const prefix of prefixes) {
      const match = this._findFormTrigger(prefix, catalogKey, predicate);
      if (match) return { ...match, prefix };
    }
    return null;
  }

  _hasUsedFormTrigger(prefix, catalogKey, predicate) {
    const usage = this.actor.system.combatTabState?.resourceUsage?.encounter || {};
    const match = this._findFormTrigger(prefix, catalogKey, predicate);
    return !!(match && usage[match.trackingId]);
  }

  async _applyTransformationEntryEffects(transformation, entrySnapshot = null) {
    if (!transformation?.active) return;

    const key = transformation.catalogKey || "";
    const updates = {};
    const messages = [];
    const resolvedEffects = this._getResolvedTransformationEffects(transformation);

    const autoLinkedTransforms = [
      { pattern: /enter the power of destruction enhancement power/i, catalogKey: "power_of_destruction", label: "Power of Destruction" },
      { pattern: /enter the autonomous ultra instinct enhancement power/i, catalogKey: "autonomous_ultra_instinct", label: "Autonomous Ultra Instinct" }
    ];
    for (const link of autoLinkedTransforms) {
      const shouldActivate = resolvedEffects.some(eff =>
        eff.activationType === "automatic" && link.pattern.test(String(eff.text || "")));
      if (shouldActivate) {
        const activated = await this._activateTransformationByCatalogKey(link.catalogKey, transformation.name);
        if (activated) {
          messages.push(`<b>${transformation.name}</b>: activated <b>${link.label}</b> automatically`);
        }
      }
    }

    const quarterCapacityTrigger = this._findAnyFormTrigger(key, trig =>
      /regain ki points equal to 1\/4 of your max capacity/i.test(trig.description || ""));
    if (quarterCapacityTrigger) {
      const tracked = await this._trackCombatUsage(
        quarterCapacityTrigger.trackingId,
        quarterCapacityTrigger.trigger.usageLimit,
        quarterCapacityTrigger.trigger.maxUses || 0
      );
      if (tracked) {
        const currentKP = this.actor.system.kiPool?.value ?? 0;
        const maxKP = this.actor.system.kiPool?.max ?? 0;
        const kpGain = Math.floor((this.actor.system.capacity?.max ?? 0) / 4);
        updates["system.kiPool.value"] = Math.min(maxKP, currentKP + kpGain);
        messages.push(`<b>${quarterCapacityTrigger.trigger.name}</b>: +${kpGain} KP (1/4 Max Capacity)`);
      }
    }

    const singleBattleBornTrigger = this._findAnyFormTrigger(key, trig =>
      /\bgain a stack of battle born\b/i.test(trig.description || ""));
    if (singleBattleBornTrigger) {
      const tracked = await this._trackCombatUsage(
        singleBattleBornTrigger.trackingId,
        singleBattleBornTrigger.trigger.usageLimit,
        singleBattleBornTrigger.trigger.maxUses || 0
      );
      if (tracked) {
        await this._battleBornGrantStack(`${singleBattleBornTrigger.trigger.name} (${transformation.name})`);
        messages.push(`<b>${singleBattleBornTrigger.trigger.name}</b>: +1 Battle Born stack`);
      }
    }

    if (key === "supreme_form") {
      const trigger = this._findFormTrigger("lf", key, trig =>
        /regain life points equal to 1\/2 of your maximum life points prior to entering this transformation/i.test(trig.description || ""));
      if (trigger) {
        const tracked = await this._trackCombatUsage(trigger.trackingId, trigger.trigger.usageLimit, trigger.trigger.maxUses || 0);
        if (tracked) {
          const maxLPBeforeEntry = entrySnapshot?.maxLP ?? this.actor.system.lifePoints?.max ?? 0;
          const recoveredLP = Math.floor(maxLPBeforeEntry / 2);
          const currentLP = this.actor.system.lifePoints?.value ?? 0;
          const maxLP = this.actor.system.lifePoints?.max ?? 0;
          updates["system.lifePoints.value"] = Math.min(maxLP, currentLP + recoveredLP);
          messages.push(`<b>Supreme Presence</b>: +${recoveredLP} LP`);
        }
      }
    }

    if (key === "power_of_destruction") {
      const trigger = this._findFormTrigger("lf", "destroyer_form", trig =>
        /regain divine ki points equal to triple your power level/i.test(trig.description || ""));
      if (trigger) {
        const tracked = await this._trackCombatUsage(trigger.trackingId, trigger.trigger.usageLimit, trigger.trigger.maxUses || 0);
        if (tracked) {
          const dkpGain = 3 * (this.actor.system.level || 1);
          const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
          const maxDKP = this.actor.system.divineKiPoints?.max ?? 0;
          updates["system.divineKiPoints.value"] = Math.min(maxDKP, currentDKP + dkpGain);
          messages.push(`<b>Legendary: Before Creation Comes Destruction</b>: +${dkpGain} DKP`);
        }
      }
    }

    if (key === "superior_super_saiyan") {
      const trigger = this._findFormTrigger("lf", key, trig =>
        /gain a stack of battle born for each health threshold you were below before entering this transformation/i.test(trig.description || ""));
      const stackCount = entrySnapshot?.thresholdsBelow || 0;
      if (trigger && stackCount > 0) {
        const tracked = await this._trackCombatUsage(trigger.trackingId, trigger.trigger.usageLimit, trigger.trigger.maxUses || 0);
        if (tracked) {
          for (let i = 0; i < stackCount; i++) {
            await this._battleBornGrantStack(`Superior Pain, Superior Power (${transformation.name})`);
          }
          messages.push(`<b>Superior Pain, Superior Power</b>: ${stackCount} Battle Born stack(s) from entry thresholds`);
          if (stackCount >= 2) {
            messages.push("<b>Superior Pain, Superior Power</b>: Enter the Superior State until the end of your next turn");
          }
        }
      }
    }

    const resourceUpdates = await this._applyTransformationResourceEntryEffects(transformation, resolvedEffects, entrySnapshot);
    for (const [path, value] of Object.entries(resourceUpdates.updates || {})) {
      updates[path] = value;
    }
    messages.push(...(resourceUpdates.messages || []));

    if (Object.keys(updates).length > 0) {
      await this.actor.update(updates);
    }

    if (messages.length > 0) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-exchange-alt"></i> ${transformation.name}</b><br>${messages.join("<br>")}</div>`
      });
    }
  }

  async _applyTransformationResourceEntryEffects(transformation, resolvedEffects, entrySnapshot = null) {
    const resources = foundry.utils.deepClone(this.actor.system.transformationMeta?.specialResources || {});
    const updates = {};
    const messages = [];
    const key = transformation?.catalogKey || "";
    const grade = this._parseTransformationGradeOrStacks(transformation?.gradeOrStacks);
    const stage = this._getTransformationStageValue(transformation);

    const setResource = (resourceKey, value, max = value, label = resourceKey) => {
      resources[resourceKey] = { value, max, source: key, sourceName: transformation?.name || "" };
      messages.push(`<b>${label}</b>: ${value}${max !== value ? ` / ${max}` : ""}`);
    };

    for (const eff of resolvedEffects) {
      const text = String(eff?.text || "");
      const activationType = String(eff?.activationType || "").toLowerCase();
      const isAutomatic = activationType.includes("automatic");
      const isPassive = activationType.includes("passive");
      const isTriggered = activationType.includes("triggered");
      if (!isAutomatic && !isPassive && !isTriggered) continue;

      if (isAutomatic && /gain g stacks of revolving eye/i.test(text)) {
        setResource("revolvingEye", grade, grade, "Revolving Eye");
      } else if (isAutomatic && /gain 4 stacks of draconic force/i.test(text)) {
        const aboveMaxKPBeforeEntry = (entrySnapshot?.kp ?? 0) > (entrySnapshot?.maxKP ?? 0);
        const amount = aboveMaxKPBeforeEntry ? 8 : 4;
        setResource("draconicForce", amount, amount, "Draconic Force");
      } else if (isAutomatic && /gain ssj stacks of golden light/i.test(text)) {
        setResource("goldenLight", stage, stage, "Golden Light");
      } else if (isAutomatic && /gain a stack of darkness \(max\. 3\)/i.test(text)) {
        const tierReqMatch = String(CONFIG.DBU?.transformationsCatalog?.[key]?.tierRequirement || "").match(/(\d+)/);
        const tierReq = tierReqMatch ? Number(tierReqMatch[1]) : (this.actor.system.tier || 1);
        const actorTier = this.actor.system.tier || 1;
        const amount = Math.max(1, 1 + Math.max(0, actorTier - tierReq));
        setResource("darkness", amount, 3, "Darkness");
      } else if (isAutomatic && /gain 1 darkness and set your maximum amount of darkness to 4/i.test(text)) {
        setResource("darkness", 1, 4, "Darkness");
      } else if (isAutomatic && /gain a stack of revolving eye for each talent you possess that has the name/i.test(text)) {
        const talents = this.actor.system.talents || [];
        const talentCatalog = CONFIG.DBU?.talentsCatalog || {};
        let count = 0;
        for (const talentId of talents) {
          const talent = talentCatalog[talentId];
          const name = String(talent?.name || "");
          const prereq = String(talent?.prerequisites || "");
          if (/quick learner/i.test(name) || /quick learner/i.test(prereq)) count += 1;
        }
        if (count > 0) setResource("revolvingEye", count, count, "Revolving Eye");
      } else if (isAutomatic && /gain nature ki equal to 1\/2 of your maximum ki points/i.test(text)) {
        const currentMaxKP = this.actor.system.kiPool?.max ?? 0;
        const baseMaxKP = this.actor.system.transformationRules?.kiMultiplierActive ? Math.floor(currentMaxKP / 2) : currentMaxKP;
        const amount = Math.floor(baseMaxKP / 2);
        setResource("natureKi", amount, amount, "Nature Ki");
      } else if (isAutomatic && /gain an amount of spectral armor points \(sap\) equal to 1\/4 \(rounded up\) of your maximum life points/i.test(text)) {
        const amount = Math.ceil((this.actor.system.lifePoints?.max ?? 0) / 4);
        setResource("spectralArmorPoints", amount, amount, "Spectral Armor Points");
      } else if (isAutomatic && /gain a stack of mask condition for each health threshold you are above/i.test(text)) {
        const thresholdsBelow = entrySnapshot?.thresholdsBelow ?? 0;
        const amount = Math.max(0, 3 - thresholdsBelow);
        setResource("maskCondition", amount, 3, "Mask Condition");
      } else if ((isAutomatic || isPassive) && /for the effects of masked power, you possess a mask condition of 4/i.test(text)) {
        setResource("maskCondition", 4, 4, "Mask Condition");
      } else if (/gain 1 god sphere for every 10 universal power your integrated universe seed possesses/i.test(text)) {
        const universalPower = this.actor.system.universeSeed?.universalPower ?? 0;
        const amount = Math.floor(universalPower / 10);
        if (amount > 0) setResource("godSphere", amount, amount, "God Sphere");
      } else if (isTriggered && /when you enter the monster form transformation, gain 3 plates/i.test(text)) {
        setResource("plates", 3, 3, "Plates");
      } else if (isTriggered && /you begin every combat encounter with 0 stacks of karmic empowerment and z dark ki points/i.test(text)) {
        // Scaling Darkness Lv2: start with Z Dark Ki Points, reset stacks to 0
        const keTrans = (this.actor.system.transformations || []).find(t => t?.active && t.catalogKey === "karmic_empowerment");
        if (keTrans) {
          const keZ = this._parseTransformationGradeOrStacks(keTrans.gradeOrStacks);
          setResource("darkKiPoints", keZ, keZ, "Dark Ki Points");
        }
      }
    }

    if (Object.keys(resources).length > 0) {
      updates["system.transformationMeta.specialResources"] = resources;
    }

    return { updates, messages };
  }

  _collectPersistentTransformationResources(transformations = null) {
    const resources = {};
    const activeTransformations = transformations || this.actor.system.transformations || [];
    const entrySnapshots = this.actor.system.transformationMeta?.entrySnapshots || {};

    for (const trans of activeTransformations) {
      if (!trans?.active) continue;
      const key = trans.catalogKey || "";
      const resolvedEffects = this._getResolvedTransformationEffects(trans, activeTransformations);
      const grade = this._parseTransformationGradeOrStacks(trans?.gradeOrStacks);
      const stage = this._getTransformationStageValue(trans);
      const entrySnapshot = entrySnapshots[String(trans.id ?? "")] || null;

      const setResource = (resourceKey, value, max = value) => {
        resources[resourceKey] = { value, max, source: key, sourceName: trans?.name || "" };
      };

      for (const eff of resolvedEffects) {
        const text = String(eff?.text || "");
        const activationType = String(eff?.activationType || "").toLowerCase();
        const isAutomatic = activationType.includes("automatic");
        const isPassive = activationType.includes("passive");
        const isTriggered = activationType.includes("triggered");
        if (!isAutomatic && !isPassive && !isTriggered) continue;

        if (isAutomatic && /gain g stacks of revolving eye/i.test(text)) {
          setResource("revolvingEye", grade, grade);
        } else if (isAutomatic && /gain 4 stacks of draconic force/i.test(text)) {
          const aboveMaxKPBeforeEntry = (entrySnapshot?.kp ?? 0) > (entrySnapshot?.maxKP ?? 0);
          const amount = aboveMaxKPBeforeEntry ? 8 : 4;
          setResource("draconicForce", amount, amount);
        } else if (isAutomatic && /gain ssj stacks of golden light/i.test(text)) {
          setResource("goldenLight", stage, stage);
        } else if (isAutomatic && /gain a stack of darkness \(max\. 3\)/i.test(text)) {
          const tierReqMatch = String(CONFIG.DBU?.transformationsCatalog?.[key]?.tierRequirement || "").match(/(\d+)/);
          const tierReq = tierReqMatch ? Number(tierReqMatch[1]) : (this.actor.system.tier || 1);
          const actorTier = this.actor.system.tier || 1;
          const amount = Math.max(1, 1 + Math.max(0, actorTier - tierReq));
          setResource("darkness", amount, 3);
        } else if (isAutomatic && /gain 1 darkness and set your maximum amount of darkness to 4/i.test(text)) {
          setResource("darkness", 1, 4);
        } else if (isAutomatic && /gain a stack of revolving eye for each talent you possess that has the name/i.test(text)) {
          const talents = this.actor.system.talents || [];
          const talentCatalog = CONFIG.DBU?.talentsCatalog || {};
          let count = 0;
          for (const talentId of talents) {
            const talent = talentCatalog[talentId];
            const name = String(talent?.name || "");
            const prereq = String(talent?.prerequisites || "");
            if (/quick learner/i.test(name) || /quick learner/i.test(prereq)) count += 1;
          }
          if (count > 0) setResource("revolvingEye", count, count);
        } else if (isAutomatic && /gain nature ki equal to 1\/2 of your maximum ki points/i.test(text)) {
          const currentMaxKP = this.actor.system.kiPool?.max ?? 0;
          const baseMaxKP = this.actor.system.transformationRules?.kiMultiplierActive ? Math.floor(currentMaxKP / 2) : currentMaxKP;
          const amount = Math.floor(baseMaxKP / 2);
          setResource("natureKi", amount, amount);
        } else if (isAutomatic && /gain an amount of spectral armor points \(sap\) equal to 1\/4 \(rounded up\) of your maximum life points/i.test(text)) {
          const amount = Math.ceil((this.actor.system.lifePoints?.max ?? 0) / 4);
          setResource("spectralArmorPoints", amount, amount);
        } else if (isAutomatic && /gain a stack of mask condition for each health threshold you are above/i.test(text)) {
          const thresholdsBelow = entrySnapshot?.thresholdsBelow ?? 0;
          const amount = Math.max(0, 3 - thresholdsBelow);
          setResource("maskCondition", amount, 3);
        } else if ((isAutomatic || isPassive) && /for the effects of masked power, you possess a mask condition of 4/i.test(text)) {
          setResource("maskCondition", 4, 4);
        } else if (/gain 1 god sphere for every 10 universal power your integrated universe seed possesses/i.test(text)) {
          const universalPower = this.actor.system.universeSeed?.universalPower ?? 0;
          const amount = Math.floor(universalPower / 10);
          if (amount > 0) setResource("godSphere", amount, amount);
        } else if (isTriggered && /when you enter the monster form transformation, gain 3 plates/i.test(text)) {
          setResource("plates", 3, 3);
        } else if (isTriggered && /you begin every combat encounter with 0 stacks of karmic empowerment and z dark ki points/i.test(text)) {
          const keZ = this._parseTransformationGradeOrStacks(trans?.gradeOrStacks);
          setResource("darkKiPoints", keZ, keZ);
        }
      }
    }

    const activeKeys = new Set(activeTransformations.filter(t => t?.active).map(t => t.catalogKey));
    const currentResources = this.actor.system.transformationMeta?.specialResources || {};
    if ((activeKeys.has("ultra_instinct_sign") || activeKeys.has("ultra_instinct_complete")) && currentResources.instinct) {
      resources.instinct = foundry.utils.deepClone(currentResources.instinct);
    }
    if (activeKeys.has("ultra_ego") && currentResources.ego) {
      resources.ego = foundry.utils.deepClone(currentResources.ego);
    }
    if (activeKeys.has("super_saiyan_god") && currentResources.acclimation) {
      resources.acclimation = foundry.utils.deepClone(currentResources.acclimation);
    }
    const justiceContext = this._getJusticeChargeContext(activeTransformations);
    if (justiceContext.active && currentResources.justiceCharge) {
      resources.justiceCharge = foundry.utils.deepClone(currentResources.justiceCharge);
      resources.justiceCharge.max = Math.max(resources.justiceCharge.max ?? 0, justiceContext.max);
      resources.justiceCharge.value = Math.min(resources.justiceCharge.value ?? 0, resources.justiceCharge.max);
    }
    if (activeKeys.has("god_of_martial_arts") && currentResources.advantagePoints) {
      resources.advantagePoints = foundry.utils.deepClone(currentResources.advantagePoints);
      resources.advantagePoints.max = Math.max(resources.advantagePoints.max ?? 0, 12);
      resources.advantagePoints.value = Math.min(resources.advantagePoints.value ?? 0, resources.advantagePoints.max);
    }
    if (activeKeys.has("karmic_empowerment") && currentResources.darkKiPoints) {
      resources.darkKiPoints = foundry.utils.deepClone(currentResources.darkKiPoints);
    }

    return resources;
  }

  async _syncPersistentTransformationResources(transformations = null) {
    const resources = this._collectPersistentTransformationResources(transformations);
    await this.actor.update({ "system.transformationMeta.specialResources": resources });
  }

  _collectPersistentTransformationFlags(transformations = null) {
    const flags = { universeSeedIntegrated: false };
    const activeTransformations = transformations || this.actor.system.transformations || [];

    for (const trans of activeTransformations) {
      if (!trans?.active) continue;
      const effects = this._getResolvedTransformationEffects(trans, activeTransformations);
      for (const eff of effects) {
        const text = String(eff?.text || "");
        const activationType = String(eff?.activationType || "").toLowerCase();
        if (!activationType.includes("automatic")) continue;
        if (/universe seed becomes integrated until you leave this transformation/i.test(text)) {
          flags.universeSeedIntegrated = true;
        }
      }
    }

    return flags;
  }

  async _syncPersistentTransformationFlags(transformations = null) {
    const flags = this._collectPersistentTransformationFlags(transformations);
    await this.actor.update({
      "system.universeSeed.integrated": !!flags.universeSeedIntegrated
    });
  }

  async _activateTransformationByCatalogKey(catalogKey, sourceName = "") {
    const transformations = foundry.utils.deepClone(this.actor.system.transformations || []);
    const targetIndex = transformations.findIndex(t => t?.catalogKey === catalogKey);
    if (targetIndex < 0) return false;
    if (transformations[targetIndex]?.active) return false;

    transformations[targetIndex].active = true;
    const snapshots = foundry.utils.deepClone(this.actor.system.transformationMeta?.entrySnapshots || {});
    const targetId = String(transformations[targetIndex].id ?? targetIndex);
    const entrySnapshot = this._buildTransformationEntrySnapshot(targetIndex, transformations);
    snapshots[targetId] = entrySnapshot;

    await this.actor.update({
      "system.transformations": transformations,
      "system.transformationMeta.entrySnapshots": snapshots
    });
    await this._syncPersistentTransformationCombatStates(transformations);
    await this._syncPersistentTransformationResources(transformations);
    await this._syncPersistentTransformationFlags(transformations);
    await this._applyTransformationEntryEffects(transformations[targetIndex], entrySnapshot);

    if (sourceName) {
      ui.notifications.info(`${sourceName}: activated ${transformations[targetIndex].name}.`);
    }

    return true;
  }

  // -------------------------------------------------------
  // Token Album Handlers
  // -------------------------------------------------------

  async _onAddAlbumEntry(event) {
    event.preventDefault();
    const raw = this.actor.system.tokenAlbum;
    const album = Array.isArray(raw) ? foundry.utils.deepClone(raw) : [];
    album.push({ name: "", image: "" });
    await this.actor.update({ "system.tokenAlbum": album });
  }

  async _onBrowseAlbumImage(event) {
    event.preventDefault();
    const idx = Number(event.currentTarget.dataset.albumIndex);
    const album = foundry.utils.deepClone(this.actor.system.tokenAlbum || []);
    if (idx >= album.length) return;
    const fp = new FilePicker({
      type: "image",
      current: album[idx].image || "",
      callback: async (path) => {
        album[idx].image = path;
        await this.actor.update({ "system.tokenAlbum": album });
      }
    });
    fp.browse();
  }

  async _onAlbumNameChange(event) {
    const idx = Number(event.currentTarget.dataset.albumIndex);
    const album = foundry.utils.deepClone(this.actor.system.tokenAlbum || []);
    if (idx >= album.length) return;
    album[idx].name = event.currentTarget.value;
    await this.actor.update({ "system.tokenAlbum": album });
  }

  async _onRemoveAlbumEntry(event) {
    event.preventDefault();
    const idx = Number(event.currentTarget.dataset.albumIndex);
    const album = foundry.utils.deepClone(this.actor.system.tokenAlbum || []);
    if (idx >= album.length) return;
    // If removing the active image, restore original first
    const activeImage = this.actor.getFlag("DBU-MRR-OLD", "activeAlbumImage");
    if (activeImage && album[idx].image === activeImage) {
      await this._restoreOriginalToken();
    }
    album.splice(idx, 1);
    await this.actor.update({ "system.tokenAlbum": album });
  }

  async _onActivateAlbumToken(event) {
    event.preventDefault();
    const idx = Number(event.currentTarget.dataset.albumIndex);
    const album = this.actor.system.tokenAlbum || [];
    if (idx >= album.length || !album[idx].image) {
      ui.notifications.warn("Assign an image first.");
      return;
    }

    const targetImage = album[idx].image;
    const currentImage = this.actor.prototypeToken?.texture?.src || "";

    // Cache original if first time
    const cachedOriginal = this.actor.getFlag("DBU-MRR-OLD", "originalTokenImage");
    if (!cachedOriginal) {
      await this.actor.setFlag("DBU-MRR-OLD", "originalTokenImage", currentImage);
    }

    // Mark as active
    await this.actor.setFlag("DBU-MRR-OLD", "activeAlbumImage", targetImage);

    // Update prototype token
    if (currentImage !== targetImage) {
      await this.actor.update({ "prototypeToken.texture.src": targetImage });
    }

    // Update all active tokens on scene with morph animation
    const activeTokens = this.actor.getActiveTokens();
    for (const token of activeTokens) {
      if (token.document.texture.src !== targetImage) {
        await token.document.update({ "texture.src": targetImage });
      }
    }
  }

  async _onRestoreOriginalToken(event) {
    if (event) event.preventDefault();
    await this._restoreOriginalToken();
  }

  /** Pay LP Cost for a graded transformation (Kaioken family). */
  async _onPayKaiokenLp(event) {
    event.preventDefault();
    const catalogKey = event.currentTarget.dataset.catalogKey;
    const graded = (this.actor.system.aspectEffects?.gradedTransformations || [])
      .find(g => g.catalogKey === catalogKey);
    if (!graded) return;

    const currentLp = this.actor.system.lifePoints?.value ?? 0;
    const cost = graded.lpCostNum;
    const newLp = currentLp - cost;

    await this.actor.update({ "system.lifePoints.value": newLp });

    const penaltyNote = graded.crimsonPenalty
      ? ` <span style="color:#ff9800">(includes +${graded.crimsonPenalty} Crimson Acclimation)</span>` : '';

    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-heart-broken" style="color:#e91e63"></i> ${graded.name} Grade ${graded.grade} — LP Cost</b><br>` +
      `Paid <b>${cost}</b> LP (${graded.lpCostFormula})${penaltyNote}<br>` +
      `LP: ${currentLp} → <b>${newLp}</b>` +
      (newLp <= 0 ? `<br><span style="color:#ff1744;font-weight:bold">⚠ LP at or below 0!</span>` : '') +
      `</div>`;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: flavor
    });
  }

  async _restoreOriginalToken() {
    const cachedOriginal = this.actor.getFlag("DBU-MRR-OLD", "originalTokenImage");
    if (!cachedOriginal) return;

    const currentImage = this.actor.prototypeToken?.texture?.src || "";
    if (currentImage !== cachedOriginal) {
      await this.actor.update({ "prototypeToken.texture.src": cachedOriginal });
      for (const token of this.actor.getActiveTokens()) {
        if (token.document.texture.src !== cachedOriginal) {
          await token.document.update({ "texture.src": cachedOriginal });
        }
      }
    }
    await this.actor.unsetFlag("DBU-MRR-OLD", "originalTokenImage");
    await this.actor.unsetFlag("DBU-MRR-OLD", "activeAlbumImage");
  }

  async _onOpenTransformationCatalog(event) {
    event.preventDefault();
    const catalog = CONFIG.DBU?.transformationsCatalog || {};
    const categories = CONFIG.DBU?.transformationCategories || [];
    const catLabels = {};
    for (const c of categories) catLabels[c.id] = c.name;

    // Collect races from catalog
    const races = new Set();
    for (const t of Object.values(catalog)) {
      if (t.racialRequirement && t.racialRequirement !== "Any") races.add(t.racialRequirement);
    }
    const raceOptions = [...races].sort().map(r => `<option value="${r}">${r}</option>`).join("");
    const catOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");

    const sheet = this;

    const d = new Dialog({
      title: "Transformation Catalog",
      content: `
        <div class="tf-catalog-dialog">
          <div class="tf-catalog-filters">
            <select id="tfCatFilter"><option value="">All Categories</option>${catOptions}</select>
            <select id="tfRaceFilter"><option value="">All Races</option>${raceOptions}</select>
            <input type="text" id="tfCatSearch" placeholder="Search..." />
          </div>
          <div class="tf-catalog-list" id="tfCatalogList"></div>
        </div>`,
      buttons: { close: { label: "Close" } },
      default: "close",
      render: (html) => {
        const listEl = html.find("#tfCatalogList")[0];
        const catFilter = html.find("#tfCatFilter");
        const raceFilter = html.find("#tfRaceFilter");
        const searchInput = html.find("#tfCatSearch");

        const renderList = () => {
          const catVal = catFilter.val();
          const raceVal = raceFilter.val();
          const searchVal = (searchInput.val() || "").toLowerCase();

          const entries = Object.values(catalog).filter(t => {
            if (catVal && t.category !== catVal) return false;
            if (raceVal && t.racialRequirement !== raceVal) return false;
            if (searchVal && !t.name.toLowerCase().includes(searchVal) && !t.id.includes(searchVal)) return false;
            return true;
          });

          const catOrder = ["manifested_power", "enhancement_power", "form_alternate", "form_legendary"];
          entries.sort((a, b) => {
            const ca = catOrder.indexOf(a.category); const cb = catOrder.indexOf(b.category);
            if (ca !== cb) return ca - cb;
            return a.name.localeCompare(b.name);
          });

          if (entries.length === 0) {
            listEl.innerHTML = '<div class="tf-catalog-empty">No transformations match filters.</div>';
            return;
          }

          const attrKeys = ["ag", "fo", "te", "sc", "in", "ma", "pe"];
          let h = "";
          for (const t of entries) {
            const attrStr = attrKeys.map(k => {
              const v = t.attrBonuses?.[k];
              return v && v !== "–" ? `${k.toUpperCase()}:${v}` : null;
            }).filter(Boolean).join(" ");
            const catLabel = catLabels[t.category] || t.category;

            h += `<div class="tf-catalog-item" data-catalog-key="${t.id}">
              <div class="tf-catalog-item-info">
                <span class="tf-catalog-item-name">${t.name}</span>
                <span class="tf-catalog-badge-cat ${t.category}">${catLabel}</span>
                <div class="tf-catalog-item-meta">
                  <span>Race: ${t.racialRequirement || "Any"}</span>
                  <span>Tier: ${t.tierRequirement || "—"}</span>
                  <span>Stress: ${t.stressTest || 0}</span>
                </div>
                ${attrStr ? `<div class="tf-catalog-item-attrs">${attrStr}</div>` : ""}
              </div>
              <button type="button" class="tf-catalog-item-add" data-catalog-key="${t.id}">Add</button>
            </div>`;
          }
          listEl.innerHTML = h;

          // Bind add buttons
          listEl.querySelectorAll(".tf-catalog-item-add").forEach(btn => {
            btn.addEventListener("click", async (e) => {
              const key = e.currentTarget.dataset.catalogKey;
              await sheet._addTransformationFromCatalog(key);
            });
          });
        };

        catFilter.on("change", renderList);
        raceFilter.on("change", renderList);
        let searchTimer;
        searchInput.on("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(renderList, 250); });
        renderList();
      }
    }, { width: 700, height: 600, classes: ["dbu-old", "tf-catalog-window"] });
    d.render(true);
  }

  async _addTransformationFromCatalog(catalogKey) {
    const catalog = CONFIG.DBU?.transformationsCatalog || {};
    const entry = catalog[catalogKey];
    if (!entry) return;

    const catMap = {
      manifested_power: "manifested_power",
      enhancement_power: "enhancement_standard",
      form_alternate: "form_alternate",
      form_legendary: "form_legendary"
    };
    const typeId = catMap[entry.category] || "form_alternate";
    const isLegendary = entry.category === "form_legendary";

    // --- Transcendent Aspect Dialog ---
    let aspects = entry.aspects ? [...entry.aspects] : [];
    const hasTranscendent = aspects.some(a => a.toLowerCase() === "transcendent");
    if (hasTranscendent) {
      let keepTranscendent;
      try {
        keepTranscendent = await Dialog.wait({
          title: `${entry.name} — Transcendent Aspect`,
          content: `<p><strong>${entry.name}</strong> has the <em>Transcendent</em> aspect.</p><p>Do you want to keep the Transcendent aspect?</p>`,
          buttons: {
            yes: { icon: '<i class="fas fa-check"></i>', label: "Yes, keep it", callback: () => true },
            no: { icon: '<i class="fas fa-times"></i>', label: "No, remove it", callback: () => false }
          },
          default: "yes"
        });
      } catch (e) {
        return; // Dialog closed via X or Escape — cancel entirely
      }
      if (!keepTranscendent) {
        aspects = aspects.filter(a => a.toLowerCase() !== "transcendent");
      }
    }

    const trans = foundry.utils.deepClone(this.actor.system.transformations || []);
    const nextId = trans.length > 0 ? Math.max(...trans.map(t => t.id || 0)) + 1 : 1;

    trans.push({
      id: nextId,
      catalogKey: catalogKey,
      name: entry.name,
      active: false,
      gradeOrStacks: entry.maxStacks ? `0/${entry.maxStacks}` : "",
      tierRequirement: entry.tierRequirement || "",
      mastered: false,
      stressTest: typeof entry.stressTest === "number" ? entry.stressTest : 0,
      transformationType: typeId,
      attrBonuses: { ...(entry.attrBonuses || {}) },
      aspects,
      structuredTraits: JSON.parse(JSON.stringify(entry.traitGroups || [])),
      traits: "",
      isLegendary
    });

    await this.actor.update({ "system.transformations": trans });
    ui.notifications.info(`Added transformation: ${entry.name}`);
  }

  async _onViewTransformationTraits(event) {
    event.preventDefault();
    const transIndex = Number(event.currentTarget.dataset.transIndex);
    const transformations = this.actor.system.transformations || [];
    const trans = transformations[transIndex];
    if (!trans) return;

    const catalog = CONFIG.DBU?.transformationsCatalog || {};
    const catEntry = trans.catalogKey ? catalog[trans.catalogKey] : null;
    const traitGroups = trans.structuredTraits?.length > 0
      ? trans.structuredTraits
      : (catEntry?.traitGroups || []);

    if (traitGroups.length === 0) {
      ui.notifications.warn("No structured traits available for this transformation.");
      return;
    }

    // Build HTML for trait groups
    let html = '<div class="tf-traits-detail">';

    // Header info from catalog
    if (catEntry) {
      html += '<div class="tf-detail-header-info">';
      if (catEntry.racialRequirement) html += `<span class="tf-detail-meta"><strong>Race:</strong> ${catEntry.racialRequirement}</span>`;
      if (catEntry.tierRequirement) html += `<span class="tf-detail-meta"><strong>Tier:</strong> ${catEntry.tierRequirement}</span>`;
      if (catEntry.stressTest) html += `<span class="tf-detail-meta"><strong>Stress Test:</strong> ${catEntry.stressTest}</span>`;
      if (catEntry.maxStacks) html += `<span class="tf-detail-meta"><strong>Max Stacks:</strong> ${catEntry.maxStacks}</span>`;
      html += '</div>';
      if (catEntry.prerequisites) html += `<div class="tf-detail-prereqs"><strong>Prerequisites:</strong> ${catEntry.prerequisites}</div>`;

      // Aspects
      const aspects = catEntry.aspects || [];
      if (aspects.length > 0) {
        const tfAspects = CONFIG.DBU?.transformationAspects || {};
        html += `<div class="tf-detail-aspects"><strong>Aspects:</strong> <span class="tf-aspects-list">${aspects.map(a => {
          const baseName = a.replace(/\s*\[LV~?\d*\]/i, "").replace(/\s*\([^)]*\)/g, "").trim();
          const tooltip = tfAspects[baseName] || "";
          return `<span class="tf-aspect-tag" title="${tooltip}">${a}</span>`;
        }).join("")}</span></div>`;
      }

      // AMB
      const attrKeys = ["ag", "fo", "te", "sc", "in", "ma", "pe"];
      const attrVals = attrKeys.map(k => { const v = catEntry.attrBonuses?.[k]; return v && v !== "–" ? `${k.toUpperCase()}: ${v}` : null; }).filter(Boolean);
      if (attrVals.length > 0) {
        html += `<div class="tf-detail-attrs"><strong>AMB:</strong> ${attrVals.join(", ")}</div>`;
      }
    }

    // Load saved selections for this transformation
    const allSelections = this.actor.system.transformationOptionSelections || {};
    const transSelections = allSelections[transIndex] || {};
    const actorRef = this.actor;

    // === MUTATION: Born with Power distribution + Mutation Trait selector ===
    if (trans.catalogKey === "mutation") {
      const currentBonuses = trans.attrBonuses || {};
      const bwpAttrs = ["ag","fo","te","sc","in","ma","pe"];
      const bwpLabels = {ag:"Agility",fo:"Force",te:"Tenacity",sc:"Scholarship",in:"Insight",ma:"Magic",pe:"Personality"};

      html += `<div class="mutation-bwp-section">
        <div class="tf-trait-group-header">Born with Power — Distribute 6 Attribute Modifier Bonus Points</div>
        <p class="mutation-bwp-rules"><i>Max 2 per attribute. Force and Magic are linked (changing one changes the other).</i></p>
        <div class="mutation-bwp-grid">`;
      for (const attr of bwpAttrs) {
        const raw = currentBonuses[attr];
        const displayVal = (!raw || raw === "*" || raw === "–" || raw === "-") ? 0 : (parseInt(String(raw).replace("+","")) || 0);
        html += `<div class="mutation-bwp-attr">
          <label>${bwpLabels[attr]}</label>
          <input type="number" class="mutation-bwp-input" data-attr="${attr}" value="${displayVal}" min="0" max="2" />
        </div>`;
      }
      html += `</div><div class="mutation-bwp-total">Points Used: <span class="bwp-total-display">0</span> / 6</div>
      </div>`;

      // Mutation Trait selector
      const mutCatalog = CONFIG.DBU?.transformationsCatalog?.mutation;
      const mutationTraits = mutCatalog?.mutationTraits || [];
      const actorRace = this.actor.system.race || "";
      const actorSubrace = this.actor.system.subrace || "";
      const selectedMutTrait = transSelections.mutationTrait || "";

      const availableTraits = mutationTraits.filter(mt => {
        if (!mt.racialRequirement) return true;
        const req = mt.racialRequirement.toLowerCase();
        if (req.includes(actorRace.toLowerCase())) return true;
        if (actorSubrace && req.includes(actorSubrace.toLowerCase())) return true;
        return false;
      });

      html += `<div class="mutation-trait-selector">
        <div class="tf-trait-group-header">Select Mutation Trait</div>
        <select class="mutation-trait-select" data-trans-index="${transIndex}">
          <option value="">-- Choose Mutation Trait --</option>`;
      for (const mt of availableTraits) {
        const raceTag = mt.racialRequirement ? ` (${mt.racialRequirement})` : "";
        html += `<option value="${mt.id}" ${selectedMutTrait === mt.id ? "selected" : ""}>${mt.name}${raceTag}</option>`;
      }
      html += `</select><div class="mutation-trait-preview">`;

      // Show selected trait effects
      if (selectedMutTrait) {
        const selTrait = mutationTraits.find(t => t.id === selectedMutTrait);
        if (selTrait) {
          html += `<p><strong>${selTrait.name}</strong>: ${selTrait.description}</p>`;
          for (const eff of (selTrait.effects || [])) {
            html += `<div class="tf-trait-effect-row">
              <span class="tf-trait-keyword-badge ${eff.activationType || ""}">${eff.keyword || ""}</span>
              <span class="tf-trait-effect-text">${eff.text || ""}</span>
            </div>`;
          }
        }
      }
      html += `</div>`;

      // === MUTATION TRAIT SUB-SELECTIONS ===
      const mutState = this.actor.system.transformationMeta?.mutationState || {};

      // --- Were-creature ---
      if (selectedMutTrait === "were_creature") {
        const wcOption = mutState.wereCreatureOption || "";
        const wcBestialRaw = Array.isArray(mutState.wereCreatureBestialTraits) ? mutState.wereCreatureBestialTraits : [];
        const btCatalog = CONFIG.DBU?.bestialTraitsCatalog || [];
        const btNameMap = {};
        for (const t of btCatalog) btNameMap[t.name] = t.id;
        const _normBtId = (v) => v?.startsWith("bestial_") ? v : (btNameMap[v] || null);
        const btValidIds = new Set(btCatalog.map(t => t.id));
        const wcBestial = wcBestialRaw.map(_normBtId).filter(id => id && btValidIds.has(id));
        const btConfig = mutState.bestialTraitConfig || {};
        const wcAttrs = Array.isArray(mutState.wereCreatureAttributes) ? mutState.wereCreatureAttributes : [];
        const wcActive = !!mutState.wereCreatureActive;
        const wcAttrOpts = [{k:"ag",l:"Agility"},{k:"fo",l:"Force"},{k:"te",l:"Tenacity"},{k:"ma",l:"Magic"}];
        html += `<div class="mutation-sub-config" data-trait="were_creature">
          <div class="tf-trait-group-header">Were-creature Configuration</div>
          <div class="mut-sub-row">
            <label>Option:</label>
            <select class="mut-wc-option">
              <option value="">-- Choose --</option>
              <option value="free_control" ${wcOption === "free_control" ? "selected" : ""}>Free Control</option>
              <option value="traditional" ${wcOption === "traditional" ? "selected" : ""}>Traditional</option>
            </select>
          </div>
          <div class="mut-sub-row">
            <label>Bestial Traits (select 2):</label>
            <div class="mut-checkbox-list">
              ${btCatalog.map(bt => {
                const checked = wcBestial.includes(bt.id);
                const disabled = !checked && wcBestial.length >= 2;
                const optEffect = bt.effects.find(e => e.activationType === "option");
                const traitCfg = btConfig[bt.id] || {};
                return `<label class="effect-option-checkbox ${checked ? "selected" : ""} ${disabled ? "disabled" : ""}">
                  <input type="checkbox" class="mut-wc-bestial" data-name="${bt.id}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
                  <span class="option-name">${bt.name}</span>
                </label>${checked && optEffect ? `<div class="bestial-option-row" style="margin-left:24px;margin-bottom:4px;">
                  <select class="mut-bestial-option" data-trait-id="${bt.id}">
                    <option value="">-- ${optEffect.text.includes("choose") ? "Choose" : "Select"} --</option>
                    ${optEffect.options.map(o => {
                      const optKey = o.name.toLowerCase().replace(/\s+/g, "_");
                      return `<option value="${optKey}" ${traitCfg.option === optKey ? "selected" : ""}>${o.name}</option>`;
                    }).join("")}
                  </select>
                </div>` : ""}`;
              }).join("")}
            </div>
          </div>
          ${wcOption === "traditional" ? `<div class="mut-sub-row">
            <label>Attribute Bonuses (select 2, AG/FO/TE/MA only):</label>
            <div class="mut-checkbox-list">
              ${wcAttrOpts.map(a => {
                const checked = wcAttrs.includes(a.k);
                const disabled = !checked && wcAttrs.length >= 2;
                return `<label class="effect-option-checkbox ${checked ? "selected" : ""} ${disabled ? "disabled" : ""}">
                  <input type="checkbox" class="mut-wc-attr" data-attr="${a.k}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
                  <span class="option-name">${a.l}</span>
                </label>`;
              }).join("")}
            </div>
          </div>` : ""}
          <div class="mut-sub-row">
            <label class="effect-option-checkbox ${wcActive ? "selected" : ""}">
              <input type="checkbox" class="mut-wc-active" ${wcActive ? "checked" : ""} />
              <span class="option-name">Currently Transformed (Were-creature Active)</span>
            </label>
          </div>
        </div>`;
      }

      // --- Dark Vassal ---
      if (selectedMutTrait === "dark_vassal") {
        const dvBestialRaw = Array.isArray(mutState.darkVassalBestialTraits) ? mutState.darkVassalBestialTraits : [];
        const dvCatalog = CONFIG.DBU?.bestialTraitsCatalog || [];
        const dvNameMap = {};
        for (const t of dvCatalog) dvNameMap[t.name] = t.id;
        const _normDvId = (v) => v?.startsWith("bestial_") ? v : (dvNameMap[v] || null);
        const dvValidIds = new Set(dvCatalog.map(t => t.id));
        const dvBestial = dvBestialRaw.map(_normDvId).filter(id => id && dvValidIds.has(id));
        const dvBtConfig = mutState.bestialTraitConfig || {};
        html += `<div class="mutation-sub-config" data-trait="dark_vassal">
          <div class="tf-trait-group-header">Dark Vassal — Bestial Traits (up to 2)</div>
          <p class="mutation-bwp-rules"><i>Reduce Max LP by x for each Power Level, where x = number of Bestial Traits selected.</i></p>
          <div class="mut-checkbox-list">
            ${dvCatalog.map(bt => {
              const checked = dvBestial.includes(bt.id);
              const disabled = !checked && dvBestial.length >= 2;
              const optEffect = bt.effects.find(e => e.activationType === "option");
              const traitCfg = dvBtConfig[bt.id] || {};
              return `<label class="effect-option-checkbox ${checked ? "selected" : ""} ${disabled ? "disabled" : ""}">
                <input type="checkbox" class="mut-dv-bestial" data-name="${bt.id}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
                <span class="option-name">${bt.name}</span>
              </label>${checked && optEffect ? `<div class="bestial-option-row" style="margin-left:24px;margin-bottom:4px;">
                <select class="mut-bestial-option" data-trait-id="${bt.id}">
                  <option value="">-- ${optEffect.text.includes("choose") ? "Choose" : "Select"} --</option>
                  ${optEffect.options.map(o => {
                    const optKey = o.name.toLowerCase().replace(/\s+/g, "_");
                    return `<option value="${optKey}" ${traitCfg.option === optKey ? "selected" : ""}>${o.name}</option>`;
                  }).join("")}
                </select>
              </div>` : ""}`;
            }).join("")}
          </div>
        </div>`;
      }

      // --- Dark Evolution ---
      if (selectedMutTrait === "dark_evolution") {
        const deMonster = Array.isArray(mutState.darkEvolutionMonsterTraits) ? mutState.darkEvolutionMonsterTraits : [];
        const monsterFormCat = CONFIG.DBU?.transformationsCatalog?.monster_form;
        const monsterTraitGroups = monsterFormCat?.traitGroups || [];
        const monsterTraitNames = monsterTraitGroups
          .filter(g => g.name && g.name !== "Monstrous Ascension" && g.name !== "Vile Technique" && g.name !== "Beast of Wrath" && g.name !== "Mastery: Controlled Monster" && g.name !== "Mutating Beast")
          .map(g => g.name);
        html += `<div class="mutation-sub-config" data-trait="dark_evolution">
          <div class="tf-trait-group-header">Dark Evolution — Monster Traits (select 2, cannot select Mutating Beast)</div>
          <div class="mut-checkbox-list">
            ${monsterTraitNames.map(mt => {
              const checked = deMonster.includes(mt);
              const disabled = !checked && deMonster.length >= 2;
              return `<label class="effect-option-checkbox ${checked ? "selected" : ""} ${disabled ? "disabled" : ""}">
                <input type="checkbox" class="mut-de-monster" data-name="${mt}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
                <span class="option-name">${mt}</span>
              </label>`;
            }).join("")}
          </div>
        </div>`;
      }

      // --- DNA Absorption ---
      if (selectedMutTrait === "dna_absorption") {
        const dnaStacks = Array.isArray(mutState.dnaStacks) ? mutState.dnaStacks : [];
        const activeIdx = typeof mutState.activeDnaStackIndex === "number" ? mutState.activeDnaStackIndex : -1;
        const attrKeys = ["ag","fo","te","sc","in","ma","pe"];
        const attrLabels = {ag:"AG",fo:"FO",te:"TE",sc:"SC",in:"IN",ma:"MA",pe:"PE"};
        html += `<div class="mutation-sub-config" data-trait="dna_absorption">
          <div class="tf-trait-group-header">DNA Absorption — Stacks (${dnaStacks.length}/3)</div>
          <p class="mutation-bwp-rules"><i>Record absorbed character's attribute scores. Bonus = ceil(score/4), capped at base Tier.</i></p>
          <div class="mut-dna-stacks">
            ${dnaStacks.map((stack, i) => `<div class="mut-dna-stack-row" data-stack-idx="${i}">
              <div class="mut-dna-stack-header">
                <input type="radio" name="mut-dna-active" class="mut-dna-active-radio" value="${i}" ${activeIdx === i ? "checked" : ""} />
                <input type="text" class="mut-dna-name" data-stack-idx="${i}" value="${foundry.utils.escapeHTML(stack.name || "")}" placeholder="Character name" />
                <button type="button" class="mut-dna-remove" data-stack-idx="${i}" title="Remove Stack"><i class="fas fa-trash"></i></button>
              </div>
              <div class="mut-dna-attrs">
                ${attrKeys.map(k => `<div class="mut-dna-attr-cell">
                  <label>${attrLabels[k]}</label>
                  <input type="number" class="mut-dna-attr" data-stack-idx="${i}" data-attr="${k}" value="${stack.attributes?.[k] || 0}" min="0" />
                </div>`).join("")}
              </div>
            </div>`).join("")}
          </div>
          ${dnaStacks.length < 3 ? `<button type="button" class="mut-dna-add"><i class="fas fa-plus"></i> Add DNA Stack</button>` : ""}
          <div class="mut-sub-row" style="margin-top:4px;">
            <label class="effect-option-checkbox">
              <input type="radio" name="mut-dna-active" class="mut-dna-active-radio" value="-1" ${activeIdx < 0 ? "checked" : ""} />
              <span class="option-name">No active stack</span>
            </label>
          </div>
        </div>`;
      }

      // --- OG Soldier ---
      if (selectedMutTrait === "og_soldier") {
        const ogCopies = Array.isArray(mutState.ogSoldierCopies) ? mutState.ogSoldierCopies : [];
        const ogActiveIdx = typeof mutState.ogSoldierActiveCopyIndex === "number" ? mutState.ogSoldierActiveCopyIndex : -1;
        html += `<div class="mutation-sub-config" data-trait="og_soldier">
          <div class="tf-trait-group-header">OG Soldier — Copies (${ogCopies.length}/3)</div>
          <p class="mutation-bwp-rules"><i>Record copied character data via Grab Neck. After 9 total Actions, that copy is lost permanently.</i></p>
          <div class="mut-og-copies">
            ${ogCopies.map((copy, i) => `<div class="mut-og-copy-row" data-copy-idx="${i}">
              <div class="mut-og-copy-header">
                <input type="radio" name="mut-og-active" class="mut-og-active-radio" value="${i}" ${ogActiveIdx === i ? "checked" : ""} />
                <input type="text" class="mut-og-name" data-copy-idx="${i}" value="${foundry.utils.escapeHTML(copy.name || "")}" placeholder="Character name" />
                <label class="mut-og-actions">Actions: <input type="number" class="mut-og-actions-input" data-copy-idx="${i}" value="${copy.actionsSpent || 0}" min="0" max="9" /> / 9</label>
                <button type="button" class="mut-og-remove" data-copy-idx="${i}" title="Remove Copy"><i class="fas fa-trash"></i></button>
              </div>
            </div>`).join("")}
          </div>
          ${ogCopies.length < 3 ? `<button type="button" class="mut-og-add"><i class="fas fa-plus"></i> Add Copy</button>` : ""}
          <div class="mut-sub-row" style="margin-top:4px;">
            <label class="effect-option-checkbox">
              <input type="radio" name="mut-og-active" class="mut-og-active-radio" value="-1" ${ogActiveIdx < 0 ? "checked" : ""} />
              <span class="option-name">No active copy</span>
            </label>
          </div>
        </div>`;
      }

      // --- Biodiversity ---
      if (selectedMutTrait === "biodiversity") {
        const addTraits = mutState.additionalTraitSelections || {};
        const bioVal = foundry.utils.escapeHTML(addTraits.biodiversity || "");
        html += `<div class="mutation-sub-config" data-trait="biodiversity">
          <div class="tf-trait-group-header">Biodiversity — Additional Genetic Splicing Trait</div>
          <div class="mut-sub-row">
            <input type="text" class="mut-bio-trait" value="${bioVal}" placeholder="Enter trait name" />
          </div>
        </div>`;
      }

      // --- Spreading Shadow ---
      if (selectedMutTrait === "spreading_shadow") {
        const addTraits = mutState.additionalTraitSelections || {};
        const ssVal = foundry.utils.escapeHTML(addTraits.spreadingShadow || "");
        html += `<div class="mutation-sub-config" data-trait="spreading_shadow">
          <div class="tf-trait-group-header">Spreading Shadow — Additional Supernatural Powers Option</div>
          <div class="mut-sub-row">
            <input type="text" class="mut-ss-option" value="${ssVal}" placeholder="Enter option name" />
          </div>
        </div>`;
      }

      // --- Custom Mutation ---
      if (selectedMutTrait === "custom_mutation") {
        const addTraits = mutState.additionalTraitSelections || {};
        const cmVal = foundry.utils.escapeHTML(addTraits.customMutation || "");
        const cmFlaw = !!addTraits.customMutationFlaw;
        html += `<div class="mutation-sub-config" data-trait="custom_mutation">
          <div class="tf-trait-group-header">Custom Mutation — Additional Secondary Racial Trait</div>
          <div class="mut-sub-row">
            <input type="text" class="mut-cm-trait" value="${cmVal}" placeholder="Enter trait name" />
          </div>
          <div class="mut-sub-row">
            <label class="effect-option-checkbox ${cmFlaw ? "selected" : ""}">
              <input type="checkbox" class="mut-cm-flaw" ${cmFlaw ? "checked" : ""} />
              <span class="option-name">Gain Flaw Trait</span>
              <span class="option-text">The Flaw Effect from this Secondary Racial Trait applies</span>
            </label>
          </div>
        </div>`;
      }

      // --- Legendary ---
      if (selectedMutTrait === "legendary") {
        html += `<div class="mutation-sub-config" data-trait="legendary">
          <div class="tf-trait-group-header">Legendary — Notes</div>
          <p class="mutation-bwp-rules"><i>Legendary Traits for LSS1 and Legendary Oozaru are selected in those transformations' trait dialogs, not here. Battle Born wound cap is automatically increased by +2.</i></p>
        </div>`;
      }

      html += `</div>`;
    }

    // === PURE RESOLVE: Choose 2 AMBs to increase ===
    if (trans.catalogKey === "pure_resolve") {
      const prSelections = transSelections.pureResolveChosenAttrs || [];
      const prAttrOptions = [
        { key: "ag", label: "Agility" }, { key: "fo", label: "Force" },
        { key: "te", label: "Tenacity" }, { key: "sc", label: "Scholarship" },
        { key: "in", label: "Insight" }, { key: "ma", label: "Magic" },
        { key: "pe", label: "Personality" }
      ];
      html += `<div class="pure-resolve-amb-section">
        <div class="tf-trait-group-header">No Shortcuts — Choose 2 AMBs to Increase</div>
        <p class="mutation-bwp-rules"><i>Select 2 different Attribute Modifier Bonuses to increase by +1. If you select Force or Magic, the other also increases by +1. You cannot select both Force and Magic.</i></p>
        <div style="display:flex;gap:8px;margin:4px 0;">
          <label style="flex:1;">AMB 1:
            <select class="pure-resolve-amb-select" data-trans-index="${transIndex}" data-amb-slot="0" style="width:100%;">
              <option value="">-- Choose --</option>
              ${prAttrOptions.map(a => `<option value="${a.key}" ${prSelections[0] === a.key ? "selected" : ""}>${a.label}</option>`).join("")}
            </select>
          </label>
          <label style="flex:1;">AMB 2:
            <select class="pure-resolve-amb-select" data-trans-index="${transIndex}" data-amb-slot="1" style="width:100%;">
              <option value="">-- Choose --</option>
              ${prAttrOptions.map(a => `<option value="${a.key}" ${prSelections[1] === a.key ? "selected" : ""}>${a.label}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="pure-resolve-amb-preview" style="font-size:0.85rem;color:#aaa;margin-top:2px;"></div>
      </div>`;
    }

    const renderEffects = (groups, label, cssClass) => {
      if (!groups) return "";
      let h = "";
      if (label) h += `<div class="tf-special-trait-header ${cssClass}">${label}</div>`;
      const groupArr = groups.subGroups || [groups];
      for (const g of groupArr) {
        if (!g.effects || g.effects.length === 0) continue;
        h += '<div class="tf-trait-group-detail">';
        h += `<div class="tf-trait-group-header">${g.name || "Trait"}</div>`;
        for (const e of g.effects) {
          const effectKey = `${g.name || "trait"}_${e.level || 0}`;

          if (e.activationType === "option" && e.options?.length > 0) {
            // Single option: dropdown
            const selected = transSelections[effectKey] || "";
            h += `<div class="tf-trait-effect-row">
              <span class="tf-trait-keyword-badge option">${e.keyword || "Option"}</span>
              <span class="tf-trait-effect-text">${e.text || ""}</span>
              <div class="tf-option-controls">
                <select class="tf-option-select option-select" data-trans-index="${transIndex}" data-effect-key="${effectKey}">
                  ${e.options.map(o => `<option value="${o.name}" ${o.name === selected ? "selected" : ""}>${o.name}</option>`).join("")}
                </select>
                ${e.options.map(o => {
                  const isSelected = o.name === selected || (!selected && o === e.options[0]);
                  return isSelected ? `<div class="tf-option-detail">
                    <span class="tf-option-keyword">[${o.keyword || o.activationType || ""}]</span>
                    <span class="tf-option-text">${o.text || ""}</span>
                  </div>` : "";
                }).join("")}
              </div>
            </div>`;

          } else if (e.activationType === "multi-option" && e.options?.length > 0) {
            // Multi-option: checkboxes with limit
            const selectedArr = Array.isArray(transSelections[effectKey]) ? transSelections[effectKey] : [];
            const max = e.optionCount || Infinity;
            const selCount = selectedArr.length;
            h += `<div class="tf-trait-effect-row">
              <span class="tf-trait-keyword-badge multi-option">${e.keyword || "Multi-Option"}</span>
              <span class="tf-trait-effect-text">${e.text || ""}</span>
              <div class="tf-option-controls">
                ${max !== Infinity ? `<div class="option-limit">Choose up to ${max} (${selCount}/${max} selected)</div>` : ""}
                ${e.options.map(o => {
                  const checked = selectedArr.includes(o.name);
                  const disabled = !checked && selCount >= max;
                  return `<label class="effect-option-checkbox ${checked ? "selected" : ""} ${disabled ? "disabled" : ""}">
                    <input type="checkbox" class="tf-option-checkbox option-checkbox" data-trans-index="${transIndex}" data-effect-key="${effectKey}" data-option-name="${o.name}" data-max-options="${max}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
                    <span class="option-name">${o.name}</span>
                    <span class="option-text">${o.text || ""}</span>
                  </label>`;
                }).join("")}
              </div>
            </div>`;

          } else if (e.activationType === "choice" && e.options?.length > 0) {
            // Choice: conditional display based on previous option
            const parentKey = e.parentOptionKey || "";
            const parentSelected = transSelections[parentKey] || "";
            const matchingOpt = e.options.find(o => o.name === parentSelected);
            h += `<div class="tf-trait-effect-row">
              <span class="tf-trait-keyword-badge choice">${e.keyword || "Choice"}</span>
              <span class="tf-trait-effect-text">${e.text || ""}</span>
              ${matchingOpt ? `<div class="tf-option-detail choice-detail">
                <span class="option-name">${matchingOpt.name}</span>
                <span class="tf-option-keyword">[${matchingOpt.keyword || ""}]</span>
                <span class="tf-option-text">${matchingOpt.text || ""}</span>
              </div>` : '<div class="tf-option-pending">Select the related option above to see this effect.</div>'}
            </div>`;

          } else {
            // Standard effect (passive/triggered/limited/etc.)
            h += `<div class="tf-trait-effect-row">
              <span class="tf-trait-keyword-badge ${e.activationType || ""}">${e.keyword || e.activationType || ""}</span>
              <span class="tf-trait-effect-text">${e.text || ""}</span>
            </div>`;
          }
        }
        h += '</div>';
      }
      return h;
    };

    // Main trait groups
    for (const g of traitGroups) {
      html += renderEffects(g, null, "");
    }

    // Special traits from catalog
    if (catEntry) {
      if (catEntry.masteryTrait) html += renderEffects(catEntry.masteryTrait, "Mastery Trait", "mastery");
      if (catEntry.legendaryTrait) html += renderEffects(catEntry.legendaryTrait, "Legendary Trait", "legendary");
      if (catEntry.exceedTrait) html += renderEffects(catEntry.exceedTrait, "Exceed Trait", "exceed");
      if (catEntry.burstLimit) html += renderEffects(catEntry.burstLimit, "Burst Limit", "burst");
    }

    html += '</div>';

    const dialog = new Dialog({
      title: `${trans.name} - Traits`,
      content: html,
      buttons: { close: { label: "Close" } },
      default: "close",
      render: (dialogHtml) => {
        // === MUTATION: Born with Power handlers ===
        if (trans.catalogKey === "mutation") {
          const bwpInputs = dialogHtml.find('.mutation-bwp-input');
          const totalDisplay = dialogHtml.find('.bwp-total-display');

          const updateBWPTotal = () => {
            let total = 0;
            bwpInputs.each(function() {
              // FO/MA are linked — only count FO, skip MA to avoid double-counting
              if (this.dataset.attr === 'ma') return;
              total += parseInt(this.value) || 0;
            });
            totalDisplay.text(total);
            totalDisplay.css('color', total > 6 ? '#e53935' : (total === 6 ? '#4caf50' : ''));
          };
          updateBWPTotal();

          bwpInputs.on('change', async (ev) => {
            const attr = ev.currentTarget.dataset.attr;
            let val = Math.max(0, Math.min(2, parseInt(ev.currentTarget.value) || 0));
            ev.currentTarget.value = val;

            // FO/MA linkage
            if (attr === 'fo') {
              dialogHtml.find('[data-attr="ma"]').val(val);
            } else if (attr === 'ma') {
              dialogHtml.find('[data-attr="fo"]').val(val);
            }
            updateBWPTotal();

            // Save distribution to actor
            const newBonuses = {};
            bwpInputs.each(function() {
              const v = parseInt(this.value) || 0;
              newBonuses[this.dataset.attr] = v > 0 ? `+${v}` : "–";
            });
            // Re-read FO/MA linkage to ensure sync
            const foVal = parseInt(dialogHtml.find('[data-attr="fo"]').val()) || 0;
            newBonuses.fo = foVal > 0 ? `+${foVal}` : "–";
            newBonuses.ma = foVal > 0 ? `+${foVal}` : "–";

            const transArr = foundry.utils.deepClone(actorRef.system.transformations || []);
            const tIdx = transArr.findIndex(t => t.id === trans.id);
            if (tIdx >= 0) {
              transArr[tIdx].attrBonuses = newBonuses;
              await actorRef.update({ "system.transformations": transArr });
            }
          });

          // Mutation Trait dropdown
          dialogHtml.on("change", ".mutation-trait-select", async (ev) => {
            const traitId = ev.currentTarget.value;
            const idx = ev.currentTarget.dataset.transIndex;
            const selections = foundry.utils.deepClone(actorRef.system.transformationOptionSelections || {});
            if (!selections[idx]) selections[idx] = {};
            selections[idx].mutationTrait = traitId;
            await actorRef.update({ "system.transformationOptionSelections": selections });
            dialog.close();
            this._onViewTransformationTraits(event);
          });

          // === MUTATION SUB-SELECTION HANDLERS ===
          const _mutSave = async (updater) => {
            const meta = foundry.utils.deepClone(actorRef.system.transformationMeta || {});
            if (!meta.mutationState) meta.mutationState = {};
            updater(meta.mutationState);
            await actorRef.update({ "system.transformationMeta": meta });
          };
          const _mutReopen = () => { dialog.close(); this._onViewTransformationTraits(event); };

          // Were-creature: option dropdown
          dialogHtml.on("change", ".mut-wc-option", async (ev) => {
            await _mutSave(ms => {
              ms.wereCreatureOption = ev.currentTarget.value;
              if (ev.currentTarget.value !== "traditional") ms.wereCreatureAttributes = [];
            });
            _mutReopen();
          });
          // Were-creature: bestial traits (stores catalog IDs, normalizes legacy names)
          dialogHtml.on("change", ".mut-wc-bestial", async (ev) => {
            const traitId = ev.currentTarget.dataset.name;
            await _mutSave(ms => {
              const _catalog = CONFIG.DBU?.bestialTraitsCatalog || [];
              const _nmap = {};
              for (const t of _catalog) _nmap[t.name] = t.id;
              const _validIds = new Set(_catalog.map(t => t.id));
              const _norm = (v) => v?.startsWith("bestial_") ? v : (_nmap[v] || null);
              const arr = (Array.isArray(ms.wereCreatureBestialTraits) ? ms.wereCreatureBestialTraits : []).map(_norm).filter(id => id && _validIds.has(id));
              if (ev.currentTarget.checked) { if (arr.length < 2 && !arr.includes(traitId)) arr.push(traitId); }
              else {
                const i = arr.indexOf(traitId); if (i >= 0) arr.splice(i, 1);
                // Remove option config when unchecking
                if (ms.bestialTraitConfig?.[traitId]) {
                  const cfg = { ...ms.bestialTraitConfig };
                  delete cfg[traitId];
                  ms.bestialTraitConfig = cfg;
                }
              }
              ms.wereCreatureBestialTraits = arr;
            });
            _mutReopen();
          });
          // Were-creature: attribute bonuses
          dialogHtml.on("change", ".mut-wc-attr", async (ev) => {
            const attr = ev.currentTarget.dataset.attr;
            await _mutSave(ms => {
              const arr = Array.isArray(ms.wereCreatureAttributes) ? [...ms.wereCreatureAttributes] : [];
              if (ev.currentTarget.checked) { if (arr.length < 2 && !arr.includes(attr)) arr.push(attr); }
              else { const i = arr.indexOf(attr); if (i >= 0) arr.splice(i, 1); }
              ms.wereCreatureAttributes = arr;
            });
            _mutReopen();
          });
          // Were-creature: active toggle
          dialogHtml.on("change", ".mut-wc-active", async (ev) => {
            await _mutSave(ms => { ms.wereCreatureActive = ev.currentTarget.checked; });
          });

          // Dark Vassal: bestial traits (stores catalog IDs, normalizes legacy names)
          dialogHtml.on("change", ".mut-dv-bestial", async (ev) => {
            const traitId = ev.currentTarget.dataset.name;
            await _mutSave(ms => {
              const _catalog = CONFIG.DBU?.bestialTraitsCatalog || [];
              const _nmap = {};
              for (const t of _catalog) _nmap[t.name] = t.id;
              const _validIds = new Set(_catalog.map(t => t.id));
              const _norm = (v) => v?.startsWith("bestial_") ? v : (_nmap[v] || null);
              const arr = (Array.isArray(ms.darkVassalBestialTraits) ? ms.darkVassalBestialTraits : []).map(_norm).filter(id => id && _validIds.has(id));
              if (ev.currentTarget.checked) { if (arr.length < 2 && !arr.includes(traitId)) arr.push(traitId); }
              else {
                const i = arr.indexOf(traitId); if (i >= 0) arr.splice(i, 1);
                if (ms.bestialTraitConfig?.[traitId]) {
                  const cfg = { ...ms.bestialTraitConfig };
                  delete cfg[traitId];
                  ms.bestialTraitConfig = cfg;
                }
              }
              ms.darkVassalBestialTraits = arr;
            });
            _mutReopen();
          });

          // Bestial trait option selection (shared by Were-creature and Dark Vassal)
          dialogHtml.on("change", ".mut-bestial-option", async (ev) => {
            const traitId = ev.currentTarget.dataset.traitId;
            const optionValue = ev.currentTarget.value;
            await _mutSave(ms => {
              const cfg = { ...(ms.bestialTraitConfig || {}) };
              if (optionValue) {
                cfg[traitId] = { ...(cfg[traitId] || {}), option: optionValue };
              } else if (cfg[traitId]) {
                delete cfg[traitId].option;
              }
              ms.bestialTraitConfig = cfg;
            });
          });

          // Dark Evolution: monster traits
          dialogHtml.on("change", ".mut-de-monster", async (ev) => {
            const name = ev.currentTarget.dataset.name;
            await _mutSave(ms => {
              const arr = Array.isArray(ms.darkEvolutionMonsterTraits) ? [...ms.darkEvolutionMonsterTraits] : [];
              if (ev.currentTarget.checked) { if (arr.length < 2 && !arr.includes(name)) arr.push(name); }
              else { const i = arr.indexOf(name); if (i >= 0) arr.splice(i, 1); }
              ms.darkEvolutionMonsterTraits = arr;
            });
            _mutReopen();
          });

          // DNA Absorption: active stack radio
          dialogHtml.on("change", ".mut-dna-active-radio", async (ev) => {
            const idx = parseInt(ev.currentTarget.value);
            await _mutSave(ms => { ms.activeDnaStackIndex = idx; });
          });
          // DNA Absorption: stack name
          dialogHtml.on("change", ".mut-dna-name", async (ev) => {
            const i = parseInt(ev.currentTarget.dataset.stackIdx);
            await _mutSave(ms => {
              if (!Array.isArray(ms.dnaStacks)) ms.dnaStacks = [];
              if (ms.dnaStacks[i]) ms.dnaStacks[i].name = ev.currentTarget.value;
            });
          });
          // DNA Absorption: stack attribute
          dialogHtml.on("change", ".mut-dna-attr", async (ev) => {
            const i = parseInt(ev.currentTarget.dataset.stackIdx);
            const attr = ev.currentTarget.dataset.attr;
            const val = Math.max(0, parseInt(ev.currentTarget.value) || 0);
            await _mutSave(ms => {
              if (!Array.isArray(ms.dnaStacks)) ms.dnaStacks = [];
              if (ms.dnaStacks[i]) {
                if (!ms.dnaStacks[i].attributes) ms.dnaStacks[i].attributes = {};
                ms.dnaStacks[i].attributes[attr] = val;
              }
            });
          });
          // DNA Absorption: add stack
          dialogHtml.on("click", ".mut-dna-add", async (ev) => {
            await _mutSave(ms => {
              if (!Array.isArray(ms.dnaStacks)) ms.dnaStacks = [];
              if (ms.dnaStacks.length < 3) ms.dnaStacks.push({ name: "", attributes: {ag:0,fo:0,te:0,sc:0,in:0,ma:0,pe:0} });
            });
            _mutReopen();
          });
          // DNA Absorption: remove stack
          dialogHtml.on("click", ".mut-dna-remove", async (ev) => {
            const i = parseInt(ev.currentTarget.dataset.stackIdx);
            await _mutSave(ms => {
              if (Array.isArray(ms.dnaStacks)) ms.dnaStacks.splice(i, 1);
              if (typeof ms.activeDnaStackIndex === "number") {
                if (ms.activeDnaStackIndex === i) ms.activeDnaStackIndex = -1;
                else if (ms.activeDnaStackIndex > i) ms.activeDnaStackIndex -= 1;
              }
            });
            _mutReopen();
          });

          // OG Soldier: active copy radio
          dialogHtml.on("change", ".mut-og-active-radio", async (ev) => {
            const idx = parseInt(ev.currentTarget.value);
            await _mutSave(ms => { ms.ogSoldierActiveCopyIndex = idx; });
          });
          // OG Soldier: copy name
          dialogHtml.on("change", ".mut-og-name", async (ev) => {
            const i = parseInt(ev.currentTarget.dataset.copyIdx);
            await _mutSave(ms => {
              if (!Array.isArray(ms.ogSoldierCopies)) ms.ogSoldierCopies = [];
              if (ms.ogSoldierCopies[i]) ms.ogSoldierCopies[i].name = ev.currentTarget.value;
            });
          });
          // OG Soldier: actions spent
          dialogHtml.on("change", ".mut-og-actions-input", async (ev) => {
            const i = parseInt(ev.currentTarget.dataset.copyIdx);
            const val = Math.max(0, Math.min(9, parseInt(ev.currentTarget.value) || 0));
            ev.currentTarget.value = val;
            await _mutSave(ms => {
              if (!Array.isArray(ms.ogSoldierCopies)) ms.ogSoldierCopies = [];
              if (ms.ogSoldierCopies[i]) ms.ogSoldierCopies[i].actionsSpent = val;
            });
          });
          // OG Soldier: add copy
          dialogHtml.on("click", ".mut-og-add", async (ev) => {
            await _mutSave(ms => {
              if (!Array.isArray(ms.ogSoldierCopies)) ms.ogSoldierCopies = [];
              if (ms.ogSoldierCopies.length < 3) ms.ogSoldierCopies.push({ name: "", actionsSpent: 0 });
            });
            _mutReopen();
          });
          // OG Soldier: remove copy
          dialogHtml.on("click", ".mut-og-remove", async (ev) => {
            const i = parseInt(ev.currentTarget.dataset.copyIdx);
            await _mutSave(ms => {
              if (Array.isArray(ms.ogSoldierCopies)) ms.ogSoldierCopies.splice(i, 1);
              if (typeof ms.ogSoldierActiveCopyIndex === "number") {
                if (ms.ogSoldierActiveCopyIndex === i) ms.ogSoldierActiveCopyIndex = -1;
                else if (ms.ogSoldierActiveCopyIndex > i) ms.ogSoldierActiveCopyIndex -= 1;
              }
            });
            _mutReopen();
          });

          // Biodiversity: trait text input
          dialogHtml.on("change", ".mut-bio-trait", async (ev) => {
            await _mutSave(ms => {
              if (!ms.additionalTraitSelections) ms.additionalTraitSelections = {};
              ms.additionalTraitSelections.biodiversity = ev.currentTarget.value;
            });
          });

          // Spreading Shadow: option text input
          dialogHtml.on("change", ".mut-ss-option", async (ev) => {
            await _mutSave(ms => {
              if (!ms.additionalTraitSelections) ms.additionalTraitSelections = {};
              ms.additionalTraitSelections.spreadingShadow = ev.currentTarget.value;
            });
          });

          // Custom Mutation: trait text input
          dialogHtml.on("change", ".mut-cm-trait", async (ev) => {
            await _mutSave(ms => {
              if (!ms.additionalTraitSelections) ms.additionalTraitSelections = {};
              ms.additionalTraitSelections.customMutation = ev.currentTarget.value;
            });
          });
          // Custom Mutation: flaw checkbox
          dialogHtml.on("change", ".mut-cm-flaw", async (ev) => {
            await _mutSave(ms => {
              if (!ms.additionalTraitSelections) ms.additionalTraitSelections = {};
              ms.additionalTraitSelections.customMutationFlaw = ev.currentTarget.checked;
            });
          });
        }

        // === PURE RESOLVE: AMB choice handlers ===
        if (trans.catalogKey === "pure_resolve") {
          dialogHtml.on("change", ".pure-resolve-amb-select", async (ev) => {
            const slot = parseInt(ev.currentTarget.dataset.ambSlot);
            const val = ev.currentTarget.value;
            const selections = foundry.utils.deepClone(actorRef.system.transformationOptionSelections || {});
            const idx = ev.currentTarget.dataset.transIndex;
            if (!selections[idx]) selections[idx] = {};
            const chosen = Array.isArray(selections[idx].pureResolveChosenAttrs)
              ? [...selections[idx].pureResolveChosenAttrs] : ["", ""];

            // Validate: can't pick both FO and MA
            const otherSlot = slot === 0 ? 1 : 0;
            if ((val === "fo" && chosen[otherSlot] === "ma") || (val === "ma" && chosen[otherSlot] === "fo")) {
              ui.notifications.warn("Pure Resolve: You cannot select both Force and Magic.");
              ev.currentTarget.value = chosen[slot] || "";
              return;
            }
            // Validate: can't pick same attr in both slots
            if (val && val === chosen[otherSlot]) {
              ui.notifications.warn("Pure Resolve: You must select two different attributes.");
              ev.currentTarget.value = chosen[slot] || "";
              return;
            }

            chosen[slot] = val;
            selections[idx].pureResolveChosenAttrs = chosen;
            await actorRef.update({ "system.transformationOptionSelections": selections });
            dialog.close();
            this._onViewTransformationTraits(event);
          });
        }

        // Option select handler
        dialogHtml.on("change", ".tf-option-select", async (ev) => {
          const key = ev.currentTarget.dataset.effectKey;
          const idx = ev.currentTarget.dataset.transIndex;
          const selections = foundry.utils.deepClone(actorRef.system.transformationOptionSelections || {});
          if (!selections[idx]) selections[idx] = {};
          selections[idx][key] = ev.currentTarget.value;
          await actorRef.update({ "system.transformationOptionSelections": selections });
          dialog.close();
          this._onViewTransformationTraits(event);
        });

        // Multi-option checkbox handler
        dialogHtml.on("change", ".tf-option-checkbox", async (ev) => {
          const { transIndex: idx, effectKey: key, optionName, maxOptions } = ev.currentTarget.dataset;
          const selections = foundry.utils.deepClone(actorRef.system.transformationOptionSelections || {});
          if (!selections[idx]) selections[idx] = {};
          let current = selections[idx][key];
          if (!Array.isArray(current)) current = current ? [current] : [];
          const max = maxOptions ? Number(maxOptions) : Infinity;
          if (ev.currentTarget.checked) {
            if (current.length < max && !current.includes(optionName)) current.push(optionName);
            else { ev.currentTarget.checked = false; return; }
          } else {
            current = current.filter(n => n !== optionName);
          }
          selections[idx][key] = current;
          await actorRef.update({ "system.transformationOptionSelections": selections });
          dialog.close();
          this._onViewTransformationTraits(event);
        });
      }
    }, { width: 650, height: 500, classes: ["dbu-old", "tf-traits-window"] });
    dialog.render(true);
  }

  // -------------------------------------------------------
  // Legendary Trait Selection
  // -------------------------------------------------------

  /**
   * Handle changing a Legendary Trait selection dropdown.
   */
  async _onLegendaryTraitSelect(event) {
    const select = event.currentTarget;
    const catalogKey = select.dataset.catalogKey;
    const value = select.value;
    const selections = foundry.utils.deepClone(this.actor.system.transformationMeta?.legendaryTraitSelections || {});
    selections[catalogKey] = value;
    await this.actor.update({ "system.transformationMeta.legendaryTraitSelections": selections });
  }

  // -------------------------------------------------------
  // Unique Abilities CRUD
  // -------------------------------------------------------

  async _onAddUnique(event) {
    event.preventDefault();
    const catalog = CONFIG.DBU?.uniqueAbilitiesCatalog || {};
    const existing = this.actor.system.uniqueAbilities || [];
    const existingKeys = existing.map(u => u.abilityKey);

    const available = Object.entries(catalog)
      .filter(([key]) => !existingKeys.includes(key))
      .map(([key, data]) => ({ key, name: data.name, type: data.abilityType }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const optionsHtml = available.map(a =>
      `<option value="${a.key}">${a.name} (${a.type})</option>`
    ).join("\n");

    const result = await Dialog.prompt({
      title: "Add Unique Ability",
      content: `<form><div class="form-group"><label>Select Ability:</label><select name="abilityKey" style="width:100%;padding:4px;">${optionsHtml}</select></div></form>`,
      callback: (html) => html.find('[name="abilityKey"]').val(),
      rejectClose: false
    });
    if (!result) return;

    const uniques = foundry.utils.deepClone(existing);
    const nextId = uniques.length > 0 ? Math.max(...uniques.map(u => u.id || 0)) + 1 : 1;
    uniques.push({ id: nextId, abilityKey: result, free: false, advancements: [], restrictions: [] });
    await this.actor.update({ "system.uniqueAbilities": uniques });
  }

  async _onDeleteUnique(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const index = Number(event.currentTarget.dataset.uniqueIndex);
    const uniques = foundry.utils.deepClone(this.actor.system.uniqueAbilities || []);
    if (index >= 0 && index < uniques.length) {
      uniques.splice(index, 1);
      await this.actor.update({ "system.uniqueAbilities": uniques });
    }
  }

  async _onUniqueFreeToggle(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const index = Number(event.currentTarget.dataset.uniqueIndex);
    const uniques = foundry.utils.deepClone(this.actor.system.uniqueAbilities || []);
    if (index >= 0 && index < uniques.length) {
      uniques[index].free = event.currentTarget.checked;
      await this.actor.update({ "system.uniqueAbilities": uniques });
    }
  }

  async _onAddUniqueAdvancement(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const index = Number(event.currentTarget.dataset.uniqueIndex);
    const uniques = foundry.utils.deepClone(this.actor.system.uniqueAbilities || []);
    if (index < 0 || index >= uniques.length) return;
    const catalog = CONFIG.DBU?.uniqueAbilitiesCatalog || {};
    const data = catalog[uniques[index].abilityKey];
    if (!data?.advancements?.length) return;
    uniques[index].advancements.push({ advancementId: data.advancements[0].id, free: false, amount: 1 });
    await this.actor.update({ "system.uniqueAbilities": uniques });
  }

  async _onRemoveUniqueAdvancement(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const uIdx = Number(event.currentTarget.dataset.uniqueIndex);
    const aIdx = Number(event.currentTarget.dataset.advIndex);
    const uniques = foundry.utils.deepClone(this.actor.system.uniqueAbilities || []);
    if (uIdx < 0 || uIdx >= uniques.length) return;
    uniques[uIdx].advancements.splice(aIdx, 1);
    await this.actor.update({ "system.uniqueAbilities": uniques });
  }

  async _onUniqueAdvSelect(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const uIdx = Number(event.currentTarget.dataset.uniqueIndex);
    const aIdx = Number(event.currentTarget.dataset.advIndex);
    const uniques = foundry.utils.deepClone(this.actor.system.uniqueAbilities || []);
    if (uIdx < 0 || uIdx >= uniques.length || aIdx < 0) return;
    uniques[uIdx].advancements[aIdx].advancementId = event.currentTarget.value;
    await this.actor.update({ "system.uniqueAbilities": uniques });
  }

  async _onUniqueAdvFree(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const uIdx = Number(event.currentTarget.dataset.uniqueIndex);
    const aIdx = Number(event.currentTarget.dataset.advIndex);
    const uniques = foundry.utils.deepClone(this.actor.system.uniqueAbilities || []);
    if (uIdx < 0 || uIdx >= uniques.length || aIdx < 0) return;
    uniques[uIdx].advancements[aIdx].free = event.currentTarget.checked;
    await this.actor.update({ "system.uniqueAbilities": uniques });
  }

  async _onUniqueAdvAmount(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const uIdx = Number(event.currentTarget.dataset.uniqueIndex);
    const aIdx = Number(event.currentTarget.dataset.advIndex);
    const uniques = foundry.utils.deepClone(this.actor.system.uniqueAbilities || []);
    if (uIdx < 0 || uIdx >= uniques.length || aIdx < 0) return;
    uniques[uIdx].advancements[aIdx].amount = Number(event.currentTarget.value) || 1;
    await this.actor.update({ "system.uniqueAbilities": uniques });
  }

  async _onAddUniqueRestriction(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const index = Number(event.currentTarget.dataset.uniqueIndex);
    const uniques = foundry.utils.deepClone(this.actor.system.uniqueAbilities || []);
    if (index < 0 || index >= uniques.length) return;
    const catalog = CONFIG.DBU?.uniqueAbilitiesCatalog || {};
    const data = catalog[uniques[index].abilityKey];
    if (!data?.restrictions?.length) return;
    uniques[index].restrictions.push({ restrictionId: data.restrictions[0].id });
    await this.actor.update({ "system.uniqueAbilities": uniques });
  }

  async _onRemoveUniqueRestriction(event) {
    event.preventDefault();
    if (event.currentTarget.closest('.gained-ability')) return;
    const uIdx = Number(event.currentTarget.dataset.uniqueIndex);
    const rIdx = Number(event.currentTarget.dataset.resIndex);
    const uniques = foundry.utils.deepClone(this.actor.system.uniqueAbilities || []);
    if (uIdx < 0 || uIdx >= uniques.length) return;
    uniques[uIdx].restrictions.splice(rIdx, 1);
    await this.actor.update({ "system.uniqueAbilities": uniques });
  }

  async _onUniqueResSelect(event) {
    if (event.currentTarget.closest('.gained-ability')) return;
    const uIdx = Number(event.currentTarget.dataset.uniqueIndex);
    const rIdx = Number(event.currentTarget.dataset.resIndex);
    const uniques = foundry.utils.deepClone(this.actor.system.uniqueAbilities || []);
    if (uIdx < 0 || uIdx >= uniques.length || rIdx < 0) return;
    uniques[uIdx].restrictions[rIdx].restrictionId = event.currentTarget.value;
    await this.actor.update({ "system.uniqueAbilities": uniques });
  }

  // -------------------------------------------------------
  // Progression CRUD
  // -------------------------------------------------------

  async _onAddProgressionRow(event) {
    event.preventDefault();
    const baseRows = (this.actor.system.progressionRows && this.actor.system.progressionRows.length > 0)
      ? this.actor.system.progressionRows
      : (CONFIG.DBU?.progressionRows || []);
    const rows = foundry.utils.deepClone(baseRows);
    const nextId = rows.length > 0 ? Math.max(...rows.map(r => r.id || 0)) + 1 : 1;
    const lastLevel = rows.length > 0 ? rows[rows.length - 1].level || 1 : 1;
    rows.push({
      id: nextId, level: lastLevel, perkType: "attribute_addition", convertible: false,
      talent: "", ag: null, fo: null, te: null, sc: null, in: null, ma: null, pe: null,
      tp: null,
      skill0: "", skill1: "", skill2: "", skill3: "", skill4: "", skill5: "",
      skills: []
    });
    rows.sort((a, b) => (a.level || 1) - (b.level || 1) || (a.id || 0) - (b.id || 0));
    await this.actor.update({ "system.progressionRows": rows });
  }

  async _onDeleteProgressionRow(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const baseRows = (this.actor.system.progressionRows && this.actor.system.progressionRows.length > 0)
      ? this.actor.system.progressionRows
      : (CONFIG.DBU?.progressionRows || []);
    const rows = foundry.utils.deepClone(baseRows);
    if (index >= 0 && index < rows.length) {
      rows.splice(index, 1);
      await this.actor.update({ "system.progressionRows": rows });
    }
  }

  // -------------------------------------------------------
  // Equipment Listeners
  // -------------------------------------------------------

  async _onEquipmentWornToggle(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) await item.update({ "system.worn": event.currentTarget.checked });
  }

  async _onEquipmentInlineEdit(event) {
    const el = event.currentTarget;
    const itemId = el.dataset.itemId;
    const field = el.dataset.field;
    if (!itemId || !field) return;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    let value = el.value;
    if (el.type === "number") value = Number(value) || 0;
    // Handle top-level vs system fields
    if (field === "name") {
      await item.update({ name: value });
    } else {
      await item.update({ [field]: value });
    }
  }

  async _onEquipmentInlineCheck(event) {
    const el = event.currentTarget;
    const itemId = el.dataset.itemId;
    const field = el.dataset.field;
    if (!itemId || !field) return;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await item.update({ [field]: el.checked });
  }

  // ---- Equipment Layer Handlers ----

  async _onAssignLayer(event) {
    event.preventDefault();
    const layer = event.currentTarget.dataset.layer;
    const itemId = event.currentTarget.value || "";
    await this.actor.update({ [`system.wornApparelSlots.${layer}`]: itemId });
  }

  async _onToggleDetail(event) {
    event.preventDefault();
    const layer = event.currentTarget.dataset.layer;
    const current = this.actor.system.selectedWornLayer;
    await this.actor.update({ "system.selectedWornLayer": current === layer ? "" : layer });
  }

  async _onAddQuality(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const select = event.currentTarget.closest(".eq-add-quality-row")?.querySelector(".eq-add-quality-select");
    const qualityKey = select?.value;
    if (!qualityKey || !itemId) return;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const qData = CONFIG.DBU.apparelQualities?.[qualityKey] || {};
    const slotsUsed = Array.isArray(qData.slots) ? qData.slots[0] : (qData.slots || 1);
    const quals = [...(item.system.qualities || []), { qualityKey, notes: "", slotsUsed }];
    await item.update({ "system.qualities": quals });
  }

  async _onRemoveQuality(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const idx = Number(event.currentTarget.dataset.qualityIdx);
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const quals = [...(item.system.qualities || [])];
    quals.splice(idx, 1);
    await item.update({ "system.qualities": quals });
  }

  async _onQualityNotesChange(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const idx = Number(event.currentTarget.dataset.qualityIdx);
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const quals = [...(item.system.qualities || [])];
    if (quals[idx]) quals[idx] = { ...quals[idx], notes: event.currentTarget.value };
    await item.update({ "system.qualities": quals });
  }

  async _onBreakValueChange(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await item.update({ "system.breakValueCurrent": Number(event.currentTarget.value) });
  }

  // ---- Per-card item quality CRUD handlers ----

  async _onToggleQualityCard(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    if (!itemId) return;
    if (!this._expandedQualityCards) this._expandedQualityCards = new Set();
    if (this._expandedQualityCards.has(itemId)) this._expandedQualityCards.delete(itemId);
    else this._expandedQualityCards.add(itemId);
    this.render(false);
  }

  async _onAddItemQuality(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const itemId = btn.dataset.itemId;
    const isSpecial = btn.dataset.special === "true";
    const selectClass = isSpecial ? ".eq-add-quality-select-special" : ".eq-add-quality-select-standard";
    const row = btn.closest(".eq-add-quality-row");
    const select = row?.querySelector(selectClass);
    const qualityKey = select?.value;
    if (!qualityKey || !itemId) return;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const isApparel = item.system.equipmentType === "apparel";
    const cat = (isApparel ? CONFIG.DBU.apparelQualities : CONFIG.DBU.weaponQualities)[qualityKey];
    if (!cat) return;
    const newQ = { qualityKey, name: cat.name, notes: "", slotsUsed: 1, ranks: 1, config: {} };
    const quals = [...(item.system.qualities || []), newQ];
    await item.update({ "system.qualities": quals });
  }

  async _onRemoveItemQuality(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const qIdx = Number(event.currentTarget.dataset.qIdx);
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const quals = [...(item.system.qualities || [])];
    quals.splice(qIdx, 1);
    await item.update({ "system.qualities": quals });
  }

  async _onChangeQualityConfig(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const qIdx = Number(event.currentTarget.dataset.qIdx);
    const configKey = event.currentTarget.dataset.configKey;
    const value = event.currentTarget.value;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const quals = foundry.utils.deepClone(item.system.qualities || []);
    if (!quals[qIdx]) return;
    if (!quals[qIdx].config) quals[qIdx].config = {};
    quals[qIdx].config[configKey] = value;
    await item.update({ "system.qualities": quals });
  }

  async _onChangeQualityNotes(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const qIdx = Number(event.currentTarget.dataset.qIdx);
    const value = event.currentTarget.value;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const quals = foundry.utils.deepClone(item.system.qualities || []);
    if (!quals[qIdx]) return;
    quals[qIdx].notes = value;
    await item.update({ "system.qualities": quals });
  }

  // -------------------------------------------------------
  // Combat Tab Listeners
  // -------------------------------------------------------

  async _onUseResource(event) {
    event.preventDefault();
    const effectId = event.currentTarget.dataset.effectId;
    const limit = event.currentTarget.dataset.limit || "round";
    await this._trackCombatUsage(effectId, limit);
  }

  /**
   * Handle switching sub-tabs in the Traits & Bonuses panel on Combat tab.
   */
  async _onTbTabSwitch(event) {
    event.preventDefault();
    const newTab = event.currentTarget.dataset.tab;
    if (!newTab) return;

    const current = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    current.traitsBonusesTab = newTab;
    await this.actor.update({ "system.combatTabState": current });
  }

  /**
   * Unified action handler for Available Resources.
   * Routes to the correct trigger handler based on actionType,
   * or falls back to simple track + chat.
   */
  async _onUnifiedAction(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const actionType = btn.dataset.actionType || "chat";
    const triggerId = btn.dataset.triggerId || "";
    const stanceId = btn.dataset.stance || "";

    try {
      switch (actionType) {
        case "talent-stance":
          return await this._executeUnifiedStance(stanceId);
        case "talent-trigger":
          return await this._executeUnifiedTrigger("tb", triggerId, "fas fa-gem");
        case "mp-trigger":
          return await this._executeUnifiedTrigger("mp", triggerId, "fas fa-star-of-life");
        case "rt-trigger":
          return await this._executeUnifiedTrigger("rt", triggerId, "fas fa-dna");
        case "lt-trigger":
          return await this._executeUnifiedTrigger("lt", triggerId, "fas fa-crown");
        case "ep-trigger": {
          const synth = { preventDefault() {}, currentTarget: { dataset: { triggerId } } };
          return await this._onEnhancementPowerTrigger(synth);
        }
        case "af-trigger": {
          const synth = { preventDefault() {}, currentTarget: { dataset: { triggerId } } };
          return await this._onAlternateFormTrigger(synth);
        }
        case "lf-trigger": {
          const synth = { preventDefault() {}, currentTarget: { dataset: { triggerId } } };
          return await this._onLegendaryFormTrigger(synth);
        }
        default: {
          // Simple track + post chat from resource data
          const effectId = btn.dataset.effectId;
          const limit = btn.dataset.limit || "round";
          const maxUses = Number(btn.dataset.maxUses || 0);
          if (effectId) {
            const tracked = await this._trackCombatUsage(effectId, limit, maxUses);
            if (!tracked) return;
          }
          const item = btn.closest(".combat-resource-item");
          const name = item?.querySelector(".resource-name")?.textContent || "Resource";
          const text = item?.querySelector(".resource-text")?.innerHTML || "";
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: `<div style="font-size:0.9rem"><b>${name}</b><br>${text}</div>`
          });
        }
      }
    } catch (err) {
      // Dialog.wait() throws when closed via X or Escape — treat as silent cancel
      if (err?.message?.includes("closed without a choice")) return;
      console.error("DBU-OLD | _onUnifiedAction failed:", err);
      ui.notifications.error("Action failed. Check console for details.");
    }
  }

  /**
   * Execute a talent stance shift directly (for unified action).
   */
  async _executeUnifiedStance(stanceId) {
    const system = this.actor.system;
    const baseTier = system.baseTier || 1;
    const maxShift = 2 * baseTier;

    let title, dirOptions;
    if (stanceId === "combat_expertise") {
      title = "Combat Expertise — Shift Stance";
      dirOptions = `<option value="def_to_aw">Defense → Awareness</option>
        <option value="aw_to_def">Awareness → Defense</option>`;
    } else if (stanceId === "balanced_defender") {
      title = "Balanced Defender — Shift Defense";
      dirOptions = `<option value="def_to_soak">Defense → Soak</option>
        <option value="soak_to_def">Soak → Defense</option>`;
    } else return;

    const content = `<form>
      <div class="form-group"><label>Direction</label>
        <select name="direction">${dirOptions}</select></div>
      <div class="form-group"><label>Amount (0–${maxShift})</label>
        <input type="number" name="amount" value="0" min="0" max="${maxShift}" /></div>
    </form>`;

    let result;
    try {
      result = await Dialog.wait({
        title,
        content,
        buttons: {
          apply: { icon: '<i class="fas fa-check"></i>', label: "Apply", callback: html => {
            const direction = html.find("[name=direction]").val();
            const amount = Math.max(0, Math.min(maxShift, parseInt(html.find("[name=amount]").val()) || 0));
            return { direction, amount };
          }},
          reset: { icon: '<i class="fas fa-undo"></i>', label: "Reset", callback: () => ({ direction: null, amount: 0 }) }
        },
        default: "apply"
      });
    } catch (e) {
      return; // Dialog closed via X or Escape — cancel silently
    }

    if (!result) return;

    const tempMods = foundry.utils.deepClone(system.combatTabState?.talentTempMods || {});
    if (result.amount === 0 || !result.direction) {
      delete tempMods[stanceId];
    } else {
      tempMods[stanceId] = { direction: result.direction, amount: result.amount };
    }
    await this.actor.update({ "system.combatTabState.talentTempMods": tempMods });

    if (result.amount > 0 && result.direction) {
      const dirLabel = result.direction.replace(/_/g, " ").replace(/to/g, "→");
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.85rem"><b><i class="fas fa-exchange-alt"></i> ${title}</b><br>Shift: ${dirLabel} (${result.amount})</div>`
      });
    }
  }

  /**
   * Execute a simple trigger (track + chat) for unified action.
   * Works for TB, MP, RT, LT triggers.
   */
  async _executeUnifiedTrigger(prefix, triggerId, iconClass) {
    if (!triggerId) return;

    // Find trigger data from the appropriate bonus object
    let triggerData = null;
    const system = this.actor.system;

    if (prefix === "tb") {
      for (const entry of (system.talentBonuses?.entries || [])) {
        const found = (entry.triggered || []).find(t => t.id === triggerId);
        if (found) { triggerData = { ...found, sourceName: entry.name, trackingId: `tb:${found.id}` }; break; }
      }
      // Special: Patient Fighter
      if (triggerId === "patient_fighter_transfer") {
        const synth = { preventDefault() {}, currentTarget: { dataset: { triggerId } } };
        return this._onTalentTrigger(synth);
      }
    } else if (prefix === "mp") {
      for (const entry of (system.manifestedPowerBonuses?.entries || [])) {
        const found = (entry.triggered || []).find(t => t.id === triggerId);
        if (found) { triggerData = { ...found, sourceName: entry.name, trackingId: `mp:${found.id}` }; break; }
      }
    } else if (prefix === "rt") {
      const raceBonusKeys = [
        "racialBonuses", "earthlingBonuses", "majinBonuses", "bioAndroidBonuses",
        "androidBonuses", "arcosianBonuses", "cerealianBonuses", "namekianBonuses",
        "nekoMajinBonuses", "neoTuffleBonuses", "shadowDragonBonuses", "shinjinBonuses",
        "undeadBonuses"
      ];
      for (const key of raceBonusKeys) {
        const bonuses = system[key];
        if (!bonuses?.triggered) continue;
        const found = bonuses.triggered.find(t => t.id === triggerId);
        if (found) { triggerData = { ...found, trackingId: `rt:${found.id}` }; break; }
      }
    } else if (prefix === "lt") {
      for (const entry of (system.legendaryTraitBonuses?.entries || [])) {
        const found = (entry.triggered || []).find(t => t.id === triggerId);
        if (found) { triggerData = { ...found, sourceName: entry.sourceName || entry.name, trackingId: `lt:${found.id}` }; break; }
      }
    }

    if (!triggerData) {
      console.warn(`DBU-OLD | Unified trigger not found: ${prefix}:${triggerId}`);
      return;
    }

    if (triggerData.usageLimit || triggerData.maxUses) {
      const tracked = await this._trackCombatUsage(triggerData.trackingId, triggerData.usageLimit, triggerData.maxUses || 0);
      if (!tracked) return;
    }

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="${iconClass}"></i> ${triggerData.name}</b>${triggerData.sourceName ? ` <small>(${triggerData.sourceName})</small>` : ""}<br>${triggerData.description}</div>`
    });
  }

  async _onUndoResource(event) {
    event.preventDefault();
    const effectId = event.currentTarget.dataset.effectId;
    const limit = event.currentTarget.dataset.limit || "round";
    const key = limit === "round" ? "round" : "encounter";
    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    if (!cts.resourceUsage) return;
    if (cts.resourceUsage[key]?.[effectId]) {
      cts.resourceUsage[key][effectId] = Math.max(0, cts.resourceUsage[key][effectId] - 1);
      if (cts.resourceUsage[key][effectId] === 0) delete cts.resourceUsage[key][effectId];
    }
    // Sync effect tracking
    const et = foundry.utils.deepClone(this.actor.system.effectTracking || {});
    if (et.usedEffects?.[key]?.[effectId]) {
      et.usedEffects[key][effectId] = Math.max(0, et.usedEffects[key][effectId] - 1);
      if (et.usedEffects[key][effectId] === 0) delete et.usedEffects[key][effectId];
    }
    await this.actor.update({ "system.combatTabState": cts, "system.effectTracking": et });
  }

  async _onAddResourceUse(event) {
    event.preventDefault();
    const effectId = event.currentTarget.dataset.effectId;
    const limit = event.currentTarget.dataset.limit || "round";
    await this._trackCombatUsage(effectId, limit);
  }

  async _trackCombatUsage(effectId, limit = "round", maxUses = 0) {
    const key = limit === "encounter" ? "encounter" : "round";
    const currentCount = this.actor.system.combatTabState?.resourceUsage?.[key]?.[effectId] || 0;
    if (maxUses > 0 && currentCount >= maxUses) {
      ui.notifications.warn("That effect has already reached its usage limit.");
      return false;
    }

    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    if (!cts.resourceUsage) cts.resourceUsage = { round: {}, encounter: {} };
    cts.resourceUsage[key][effectId] = (cts.resourceUsage[key][effectId] || 0) + 1;

    const et = foundry.utils.deepClone(this.actor.system.effectTracking || {});
    if (!et.usedEffects) et.usedEffects = { round: {}, encounter: {} };
    et.usedEffects[key][effectId] = (et.usedEffects[key][effectId] || 0) + 1;

    await this.actor.update({ "system.combatTabState": cts, "system.effectTracking": et });
    return true;
  }

  async _onCombatNewRound(event) {
    event.preventDefault();
    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    // Advance round in tracker
    if (!cts.rounds) cts.rounds = [];
    cts.rounds.push({ roundNumber: cts.rounds.length + 1, actions: [] });
    cts.currentRound = cts.rounds.length;
    // Recalculate active power stacks (power-ups last 2 rounds)
    let activePowerUps = 0;
    for (const r of cts.rounds) {
      if (r.roundNumber >= cts.currentRound - 1) {
        for (const a of (r.actions || [])) {
          if (a.type === "power-up") activePowerUps++;
        }
      }
    }

    const updates = {
      "system.combatTabState.rounds": cts.rounds,
      "system.combatTabState.currentRound": cts.currentRound,
      "system.tracking.powerStacks": activePowerUps,
      "system.tracking.energyCharges": 0,
      "system.tracking.diminishingDefense": 0,
      "system.tracking.diminishingOffense": 0,
      // Reset Experienced Fighter for new round
      "system.experiencedFighter.mode": "none",
      "system.experiencedFighter.usedThisRound": false,
      // Reset round-scoped transformation tracking
      "system.transformationMeta.surgingStrengthRound": 0,
      // Evil Aura: techniques access ends at end of turn (≈ next round in this engine)
      "system.transformationMeta.evilTechsActive": false,
      // Reset Capacity to Max Capacity at start of each round (core-rules.txt:140)
      "system.status.capacitySpent": 0
    };

    // Explicitly delete round-scoped resourceUsage keys (Foundry deep merge workaround)
    const ru = this.actor.system.combatTabState?.resourceUsage?.round || {};
    for (const key of Object.keys(ru)) {
      updates[`system.combatTabState.resourceUsage.round.-=${key}`] = null;
    }

    // Explicitly delete round-scoped effectTracking keys
    const ue = this.actor.system.effectTracking?.usedEffects?.round || {};
    for (const key of Object.keys(ue)) {
      updates[`system.effectTracking.usedEffects.round.-=${key}`] = null;
    }

    await this.actor.update(updates);

    // Transformation / manifested per-round resource generation
    const allPerRoundSources = [
      ...(this.actor.system.manifestedPowerBonuses?.entries || []),
      ...(this.actor.system.enhancementPowerBonuses?.entries || []),
      ...(this.actor.system.alternateFormBonuses?.entries || []),
      ...(this.actor.system.legendaryFormBonuses?.entries || [])
    ];
    const perRoundUpdates = {};
    const prMessages = [];
    for (const entry of allPerRoundSources) {
      for (const pr of (entry.perRound || [])) {
        if (pr.type === "kp") {
          const currentKP = this.actor.system.kiPool?.value ?? 0;
          const maxKP = this.actor.system.kiPool?.max ?? 0;
          const baseKP = perRoundUpdates["system.kiPool.value"] ?? currentKP;
          const newKP = Math.min(maxKP, baseKP + pr.amount);
          if (newKP > baseKP) {
            perRoundUpdates["system.kiPool.value"] = newKP;
            prMessages.push(`${entry.name}: +${newKP - baseKP} KP (${pr.label})`);
          }
        } else if (pr.type === "lp") {
          const currentLP = this.actor.system.lifePoints?.value ?? 0;
          const maxLP = this.actor.system.lifePoints?.max ?? 0;
          const baseLP = perRoundUpdates["system.lifePoints.value"] ?? currentLP;
          const newLP = Math.min(maxLP, baseLP + pr.amount);
          if (newLP > baseLP) {
            perRoundUpdates["system.lifePoints.value"] = newLP;
            prMessages.push(`${entry.name}: +${newLP - baseLP} LP (${pr.label})`);
          }
        } else if (pr.type === "pp") {
          const currentPP = this.actor.system.tracking?.perfectPoints ?? 0;
          const basePP = perRoundUpdates["system.tracking.perfectPoints"] ?? currentPP;
          perRoundUpdates["system.tracking.perfectPoints"] = basePP + pr.amount;
          prMessages.push(`${entry.name}: +${pr.amount} Perfect Points`);
        } else if (pr.type === "dkp") {
          const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
          const maxDKP = this.actor.system.divineKiPoints?.max ?? 0;
          const baseDKP = perRoundUpdates["system.divineKiPoints.value"] ?? currentDKP;
          const newDKP = Math.min(maxDKP, baseDKP + pr.amount);
          if (newDKP > baseDKP) {
            perRoundUpdates["system.divineKiPoints.value"] = newDKP;
            prMessages.push(`${entry.name}: +${newDKP - baseDKP} DKP (${pr.label})`);
          }
        }
      }
    }
    const specialResources = foundry.utils.deepClone(this.actor.system.transformationMeta?.specialResources || {});
    const activeTransforms = this.actor.system.transformations || [];
    const instinctSource = activeTransforms.find(t => t?.active && ["ultra_instinct_sign", "ultra_instinct_complete"].includes(t.catalogKey));
    if (instinctSource) {
      const currentInstinct = specialResources.instinct?.value ?? 0;
      const newInstinct = Math.min(3, currentInstinct + 1);
      if (newInstinct > currentInstinct) {
        specialResources.instinct = {
          value: newInstinct,
          max: 3,
          source: instinctSource.catalogKey,
          sourceName: instinctSource.name || "Ultra Instinct"
        };
        prMessages.push(`${instinctSource.name}: +${newInstinct - currentInstinct} Instinct`);
      }
    }
    const acclimationSource = activeTransforms.find(t => t?.active && t.catalogKey === "super_saiyan_god");
    if (acclimationSource) {
      const currentAcclimation = specialResources.acclimation?.value ?? 0;
      const newAcclimation = Math.min(4, currentAcclimation + 1);
      if (newAcclimation > currentAcclimation) {
        specialResources.acclimation = {
          value: newAcclimation,
          max: 4,
          source: acclimationSource.catalogKey,
          sourceName: acclimationSource.name || "Super Saiyan God"
        };
        prMessages.push(`${acclimationSource.name}: +${newAcclimation - currentAcclimation} Acclimation`);
      }
    }
    const justiceContext = this._getJusticeChargeContext(activeTransforms);
    const justiceSource = justiceContext.transforms[0] || null;
    const currentJustice = specialResources.justiceCharge?.value ?? 0;
    if (justiceSource && currentJustice > 0) {
      const gain = 2 * (this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2)) * currentJustice;
      const currentKP = this.actor.system.kiPool?.value ?? 0;
      const maxKP = this.actor.system.kiPool?.max ?? 0;
      const baseKP = perRoundUpdates["system.kiPool.value"] ?? currentKP;
      const newKP = Math.min(maxKP, baseKP + gain);
      if (newKP > baseKP) {
        perRoundUpdates["system.kiPool.value"] = newKP;
        prMessages.push(`${justiceSource.name}: +${newKP - baseKP} KP (Justice Charge)`);
      }
    }

    if (Object.keys(perRoundUpdates).length > 0 || Object.keys(specialResources).length > 0) {
      const combinedUpdates = { ...perRoundUpdates };
      if (Object.keys(specialResources).length > 0) {
        combinedUpdates["system.transformationMeta.specialResources"] = specialResources;
      }
      await this.actor.update(combinedUpdates);
    }
    if (prMessages.length > 0) {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.85rem"><b><i class="fas fa-sync-alt"></i> Per-Round Resources (Round ${cts.currentRound})</b><br>${prMessages.join("<br>")}</div>`
      });
    }

    // Talent per-round resource generation
    const tbBonuses = this.actor.system.talentBonuses || {};
    const talentPerRoundUpdates = {};
    const tbMessages = [];
    for (const entry of (tbBonuses.entries || [])) {
      for (const pr of (entry.perRound || [])) {
        if (pr.type === "kp") {
          const currentKP = this.actor.system.kiPool?.value ?? 0;
          const maxKP = this.actor.system.kiPool?.max ?? 0;
          const newKP = Math.min(maxKP, currentKP + (talentPerRoundUpdates["system.kiPool.value"] != null ? 0 : pr.amount));
          const baseKP = talentPerRoundUpdates["system.kiPool.value"] ?? currentKP;
          const updKP = Math.min(maxKP, baseKP + pr.amount);
          if (updKP > baseKP) {
            talentPerRoundUpdates["system.kiPool.value"] = updKP;
            tbMessages.push(`${entry.name}: +${updKP - baseKP} KP (${pr.label})`);
          }
        } else if (pr.type === "lp") {
          const currentLP = this.actor.system.lifePoints?.value ?? 0;
          const maxLP = this.actor.system.lifePoints?.max ?? 0;
          const baseLP = talentPerRoundUpdates["system.lifePoints.value"] ?? currentLP;
          const updLP = Math.min(maxLP, baseLP + pr.amount);
          if (updLP > baseLP) {
            talentPerRoundUpdates["system.lifePoints.value"] = updLP;
            tbMessages.push(`${entry.name}: +${updLP - baseLP} LP (${pr.label})`);
          }
        } else if (pr.type === "patience") {
          // Reserved Combatant: only if Holding Back
          const holdingBack = this.actor.system.combatStates?.holdingBack;
          if (holdingBack) {
            const currentPatience = this.actor.system.tracking?.patienceStacks ?? 0;
            talentPerRoundUpdates["system.tracking.patienceStacks"] = currentPatience + pr.amount;
            tbMessages.push(`${entry.name}: +${pr.amount} Patience stack (${pr.label})`);
          }
        }
      }
    }
    // Reset talent stance shifts for new round
    talentPerRoundUpdates["system.combatTabState.talentTempMods"] = {};
    if (Object.keys(talentPerRoundUpdates).length > 0) {
      await this.actor.update(talentPerRoundUpdates);
      if (tbMessages.length > 0) {
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `<div style="font-size:0.85rem"><b><i class="fas fa-gem"></i> Talent Per-Round (Round ${cts.currentRound})</b><br>${tbMessages.join("<br>")}</div>`
        });
      }
    }

    // --- Aspect per-round notifications ---
    const aspectEffects = this.actor.system.aspectEffects || {};

    // Power High: reminder to roll 1d10 each turn
    if (aspectEffects.powerHighLevel > 0) {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.85rem; border-left:3px solid #e74c3c; padding-left:8px;">
          <b><i class="fas fa-exclamation-triangle"></i> Power High LV${aspectEffects.powerHighLevel} (Round ${cts.currentRound})</b><br>
          Roll <b>1d10</b>. If ≤5: choose <b>Direct Hit</b> against the next attack, or gain <b>Slowed</b> until next turn.
        </div>`
      });
    }

    // Rampaging: reminder to roll 1d10 each turn
    if (aspectEffects.rampagingLevel > 0) {
      const targetText = aspectEffects.rampagingLevel >= 2
        ? "nearest <b>Character</b> (ally or enemy)"
        : "nearest <b>Opponent</b>";
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.85rem; border-left:3px solid #9b59b6; padding-left:8px;">
          <b><i class="fas fa-skull-crossbones"></i> Rampaging LV${aspectEffects.rampagingLevel} (Round ${cts.currentRound})</b><br>
          Roll <b>1d10</b>. If ≤5: gain <b>Compelled</b> against ${targetText} + <b>Guard Down</b>. Cannot leave transformation. Stress Tests become <b>Urgent</b>. Lasts until start of next turn.
        </div>`
      });
    }

    // Temporary: countdown and forced deactivation
    const countdowns = foundry.utils.deepClone(this.actor.system.transformationMeta?.temporaryCountdowns || {});
    let countdownChanged = false;
    let forcedDeactivation = false;
    for (const [transId, remaining] of Object.entries(countdowns)) {
      const newRemaining = remaining - 1;
      const matchingTrans = activeTransforms.find(t => String(t.id) === transId && t.active);
      if (!matchingTrans) {
        delete countdowns[transId];
        countdownChanged = true;
        continue;
      }
      if (newRemaining <= 0) {
        // Force deactivation — check Exhausting aspect
        // "You still suffer Stress Exhaustion if this Transformation has the Exhausting Aspect." (transformation-aspects.txt:179)
        const hasExhausting = (matchingTrans.aspects || []).some(a => /^Exhausting\b/i.test(a.trim()));
        if (hasExhausting) {
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: `<div style="font-size:0.85rem; border-left:3px solid #e74c3c; padding-left:8px;">
              <b><i class="fas fa-tired"></i> Exhausting — ${matchingTrans.name || "Transformation"}</b><br>
              You suffer <b>Stress Exhaustion</b> and <b>Impediment</b> Combat Conditions until the end of your next turn (Temporary expiration does not exempt Exhausting).
            </div>`
          });
        }
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `<div style="font-size:0.85rem; border-left:3px solid #e74c3c; padding-left:8px;">
            <b><i class="fas fa-hourglass-end"></i> Temporary EXPIRED — ${matchingTrans.name || "Transformation"}</b><br>
            This transformation has ended.${hasExhausting ? "" : " You do <b>not</b> suffer Stress Exhaustion."} You cannot re-enter this transformation until the end of your next turn.
          </div>`
        });
        // Deactivate the transformation
        const transArr = foundry.utils.deepClone(activeTransforms);
        const idx = transArr.findIndex(t => String(t.id) === transId);
        if (idx >= 0) {
          transArr[idx].active = false;
          await this.actor.update({ "system.transformations": transArr });
          forcedDeactivation = true;
        }
        delete countdowns[transId];
        countdownChanged = true;
      } else {
        countdowns[transId] = newRemaining;
        countdownChanged = true;
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `<div style="font-size:0.85rem; border-left:3px solid #f39c12; padding-left:8px;">
            <b><i class="fas fa-hourglass-half"></i> Temporary — ${matchingTrans.name || "Transformation"} (Round ${cts.currentRound})</b><br>
            <b>${newRemaining} round${newRemaining !== 1 ? "s" : ""}</b> remaining before forced deactivation.
          </div>`
        });
      }
    }
    if (countdownChanged) {
      await this.actor.update({ "system.transformationMeta.temporaryCountdowns": countdowns });
    }

    // --- Draining Aspect: subtract Ki at start of turn ---
    // "Reduce your Ki Points by 3(T) for each level. Use highest Tier Requirement." (transformation-aspects.txt)
    const drainingKi = this.actor.system.aspectEffects?.drainingKiPerTurn || 0;
    if (drainingKi > 0) {
      const currentKP = this.actor.system.kiPool?.value ?? 0;
      const newKP = Math.max(0, currentKP - drainingKi);
      await this.actor.update({ "system.kiPool.value": newKP });
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.85rem"><b><i class="fas fa-fire-alt"></i> Draining (Round ${cts.currentRound})</b><br>Lost ${currentKP - newKP} Ki Points (${this.actor.system.aspectEffects?.drainingLevel || 0} level${this.actor.system.aspectEffects?.drainingLevel > 1 ? "s" : ""} × 3(T${this.actor.system.aspectEffects?.drainingTier || 0}))</div>`
      });
    }

    // Battle Born: grant a stack on even-numbered rounds (Saiyan with Battle Born trait)
    const newRound = cts.currentRound;
    if (newRound % 2 === 0) {
      await this._battleBornGrantStack("Even Round " + newRound);
    }
  }

  // ============== Evil Aura Controls ==============
  async _onEvilAuraPointsAdd(event) {
    event.preventDefault();
    const cur = this.actor.system.transformationMeta?.evilPoints || 0;
    await this.actor.update({ "system.transformationMeta.evilPoints": cur + 1 });
  }
  async _onEvilAuraPointsSub(event) {
    event.preventDefault();
    const cur = this.actor.system.transformationMeta?.evilPoints || 0;
    await this.actor.update({ "system.transformationMeta.evilPoints": Math.max(0, cur - 1) });
  }
  async _onEvilAuraTechsActivate(event) {
    event.preventDefault();
    const cur = this.actor.system.transformationMeta?.evilPoints || 0;
    const cost = 2 * (this.actor.system.baseTier || 1);
    if (cur < cost) {
      ui.notifications.warn(`Need ${cost} Evil Points to activate Evil Techniques (have ${cur}).`);
      return;
    }
    await this.actor.update({
      "system.transformationMeta.evilPoints": cur - cost,
      "system.transformationMeta.evilTechsActive": true
    });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<strong>${this.actor.name}</strong> activates Evil Techniques (-${cost} EP). Gains access to Baked Sphere, Bloody Sauce, Gigantic Ki Blast, Marbling Drop, Peeler Storm until end of turn (KP cost halved).`
    });
  }
  async _onEvilAuraTechsDeactivate(event) {
    event.preventDefault();
    await this.actor.update({ "system.transformationMeta.evilTechsActive": false });
  }

  // ============== God Ki / DKP Controls ==============
  async _onDkpAdd(event) {
    event.preventDefault();
    const cur = this.actor.system.divineKiPoints?.value || 0;
    const max = this.actor.system.divineKiPoints?.max || 0;
    await this.actor.update({ "system.divineKiPoints.value": Math.min(max, cur + 1) });
  }
  async _onDkpSub(event) {
    event.preventDefault();
    const cur = this.actor.system.divineKiPoints?.value || 0;
    await this.actor.update({ "system.divineKiPoints.value": Math.max(0, cur - 1) });
  }
  async _onDkpRefill(event) {
    event.preventDefault();
    const max = this.actor.system.divineKiPoints?.max || 0;
    await this.actor.update({ "system.divineKiPoints.value": max });
  }

  /**
   * Generic God Maneuver "Use" handler.
   * Reads dkpCost from the maneuver card, presents a Dialog allowing the player
   * to confirm or override the cost (variable-cost maneuvers like Divine Attack,
   * Divine Pulse, God Strike, God Finisher, Divine Aura have variable costs),
   * spends DKP, and posts a chat card.
   */
  async _onGodManeuverUse(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const maneuverId = btn.dataset.maneuverId;
    const dkpCostStr = btn.dataset.dkpCost || "0";
    const baseTier = this.actor.system.baseTier || 1;
    const tier = this.actor.system.tier || 1;
    const currentDKP = this.actor.system.divineKiPoints?.value || 0;

    // Lookup name + description from CONFIG.DBU.godManeuvers
    const catalog = CONFIG.DBU?.godManeuvers || {};
    const def = catalog[maneuverId] || { name: maneuverId, effect: "" };

    // Try to parse cost: numbers in (T) and (bT) form, or "Profile KP" / "Aura KP" / "Technique KP" / "Variable" / "Varies" → ask user
    const parseCost = (s) => {
      if (!s) return null;
      const str = String(s).trim();
      // "5(T)" or "5(bT)"
      let m = str.match(/^(\d+)\(T\)$/i);     if (m) return Number(m[1]) * tier;
      m = str.match(/^(\d+)\(bT\)$/i);        if (m) return Number(m[1]) * baseTier;
      // "1(bT)/Action" — for Divine Pulse: each level of Long Transformation
      m = str.match(/^(\d+)\(bT\)\/Action$/i);if (m) return null;  // ask user
      m = str.match(/^\d+$/);                 if (m) return Number(str);
      // Variable / Profile KP / Aura KP / Technique KP / 1/4 Profile KP → ask
      return null;
    };

    let cost = parseCost(dkpCostStr);
    let promptValue = cost ?? 1;
    let userOverrode = false;

    // Always show dialog so player can override (rules say cost varies for many)
    const result = await Dialog.prompt({
      title: `Use ${def.name}`,
      content: `
        <form>
          <div class="form-group" style="display:flex;flex-direction:column;gap:0.4em">
            <div><b>Cost:</b> ${dkpCostStr} ${cost != null ? `→ <b>${cost}</b> DKP (auto-calculated)` : "<i>variable</i>"}</div>
            <div><b>Available:</b> ${currentDKP} DKP</div>
            <label>DKP to spend</label>
            <input type="number" name="dkpSpend" min="0" max="${currentDKP}" step="1" value="${promptValue}" />
            <small style="color:#aaa">${(def.effect || "").substring(0, 200)}${(def.effect || "").length > 200 ? "…" : ""}</small>
          </div>
        </form>`,
      callback: (html) => Number(html.find("[name='dkpSpend']").val()) || 0,
      rejectClose: false
    });

    const spend = Math.max(0, Number(result) || 0);
    if (spend === 0) return;
    if (spend > currentDKP) {
      ui.notifications.warn(`Not enough Divine Ki Points (need ${spend}, have ${currentDKP}).`);
      return;
    }

    // Per god-ki.txt:22 the Capacity Rate halving for DKP is tracked via the
    // round tracker's dedicated DKP field (see _onTrackerAddAction). The Use
    // button only deducts from the DKP pool; the tracker logs the cost.
    await this.actor.update({ "system.divineKiPoints.value": currentDKP - spend });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${def.name}</b><br>Spent <b>${spend}</b> Divine Ki Points.<br><small>${def.effect || ""}</small></div>`
    });
  }

  async _onCombatNewEncounter(event) {
    event.preventDefault();

    // Foundry deep-merges ObjectFields, so we must explicitly delete
    // every existing key inside resourceUsage and usedEffects.
    const updates = {
      "system.combatTabState.rounds": [],
      "system.combatTabState.currentRound": 0,
      "system.combatTabState.damageLog": [],
      "system.tracking.energyCharges": 0,
      "system.tracking.powerStacks": 0,
      "system.tracking.diminishingDefense": 0,
      "system.tracking.diminishingOffense": 0,
      "system.status.capacitySpent": 0,
      "system.status.superStacks": 0,
      "system.battleBorn.strike": 0,
      "system.battleBorn.dodge": 0,
      "system.battleBorn.wound": 0,
      "system.battleBorn.undying": false,
      // Reset Experienced Fighter
      "system.experiencedFighter.mode": "none",
      "system.experiencedFighter.usedThisRound": false,
      // Reset transformation encounter tracking
      "system.transformationMeta.burstLimitUsed": false,
      "system.transformationMeta.burstLimitSource": "",
      "system.transformationMeta.legendRealizedUsed": [],
      "system.transformationMeta.nlopActiveEncounter": [],
      "system.transformationMeta.persistentCombatStates": {},
      "system.transformationMeta.specialResources": {},
      "system.transformationMeta.entrySnapshots": {},
      // DKP refill at Combat Encounter start per god-ki.txt:20:
      // "starts each Combat Encounter with their maximum amount of DKP"
      "system.divineKiPoints.value": this.actor.system.divineKiPoints?.max ?? 0,
      // Snapshot DKP at encounter start (post-refill) for Weakening aspect threshold
      // "below 1/4 of the amount of Divine Ki Points you started the Combat Encounter with"
      "system.transformationMeta.encounterStartDKP": this.actor.system.divineKiPoints?.max ?? null,
      "system.transformationMeta.surgingStrengthEncounter": 0,
      "system.transformationMeta.surgingStrengthRound": 0,
      // Reset talent stance shifts
      "system.combatTabState.talentTempMods": {},
      "system.tracking.patienceStacks": 0,
      // Reset One-Sided Fusion encounter tracking
      "system.fusion.encounterThresholdsCrossed": 0,
      // Reset Hidden weapon quality usage (per-encounter flag)
      "system.equipmentFlags.hiddenUsedThisEncounter": false,
      // Reset Evil Aura state at encounter start
      "system.transformationMeta.evilTechsActive": false,
      "system.transformationMeta.evilPoints": 0
    };

    // Reset Possession host LP tracking if in possession mode
    const fusion = this.actor.system.fusion || {};
    if (fusion.isFusion && fusion.type === "one-sided-possession") {
      const hostId = (fusion.suppressedCharacterIds || [])[0];
      const hostActor = hostId ? game.actors?.get(hostId) : null;
      if (hostActor) {
        updates["system.fusion.hostCurrentLP"] = hostActor.system.lifePoints?.value ?? hostActor.system.lifePoints?.max ?? 0;
      }
    }

    // Delete all resourceUsage keys (round + encounter)
    const ru = this.actor.system.combatTabState?.resourceUsage || {};
    for (const key of Object.keys(ru.round || {})) {
      updates[`system.combatTabState.resourceUsage.round.-=${key}`] = null;
    }
    for (const key of Object.keys(ru.encounter || {})) {
      updates[`system.combatTabState.resourceUsage.encounter.-=${key}`] = null;
    }

    // Delete all effectTracking usedEffects keys (round + encounter)
    const ue = this.actor.system.effectTracking?.usedEffects || {};
    for (const key of Object.keys(ue.round || {})) {
      updates[`system.effectTracking.usedEffects.round.-=${key}`] = null;
    }
    for (const key of Object.keys(ue.encounter || {})) {
      updates[`system.effectTracking.usedEffects.encounter.-=${key}`] = null;
    }

    await this.actor.update(updates);
  }

  // -------------------------------------------------------
  // Transformation Rules Handlers (Combat Tab)
  // -------------------------------------------------------

  /** Compute the stress bonus for this character (pre-computed by actor.mjs). */
  _getStressBonus() {
    return this.actor.system.aptitudes?.stressBonus || 0;
  }

  /** Roll a Stress Test: 1d10+1 + Stress Bonus + equipment dice bonus (Resolute Belief). */
  async _onTfStressTest(event) {
    event.preventDefault();
    const system = this.actor.system;
    const stressBonus = this._getStressBonus();
    const combinedST = system.transformationRules?.combinedStressTest || 0;
    const equipDiceBonus = Number(system.equipmentFlags?.stressTestDiceBonus) || 0;

    const totalBonus = stressBonus + equipDiceBonus;
    const roll = new Roll("1d10 + 1 + @bonus", { bonus: totalBonus });
    await roll.evaluate();

    const success = combinedST > 0 ? roll.total >= combinedST : true;
    const equipNote = equipDiceBonus ? ` + ${equipDiceBonus} Equipment` : "";
    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-dice-d20"></i> Stress Test</b><br>` +
      `Roll: <b>${roll.total}</b> (1d10+1 + ${stressBonus} Stress Bonus${equipNote})` +
      (combinedST > 0 ? `<br>Required: <b>${combinedST}</b>` : '') +
      `<br><span style="color:${success ? '#4caf50' : '#e94560'};font-weight:bold">` +
      `${success ? '&#10003; Success!' : '&#10007; Failed — Stress Exhaustion!'}</span>` +
      `</div>`;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor
    });
  }

  /** Roll Turbulent Power stress test (start of turn). */
  async _onTfTurbulentRoll(event) {
    event.preventDefault();
    const system = this.actor.system;
    const stressBonus = this._getStressBonus();
    const combinedST = system.transformationRules?.combinedStressTest || 0;
    const equipDiceBonus = Number(system.equipmentFlags?.stressTestDiceBonus) || 0;

    const totalBonus = stressBonus + equipDiceBonus;
    const roll = new Roll("1d10 + 1 + @bonus", { bonus: totalBonus });
    await roll.evaluate();

    const success = combinedST > 0 ? roll.total >= combinedST : true;
    const equipNote = equipDiceBonus ? ` + ${equipDiceBonus} Equipment` : "";
    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-exclamation-triangle"></i> Turbulent Power — Start of Turn</b><br>` +
      `Roll: <b>${roll.total}</b> (1d10+1 + ${stressBonus} Stress Bonus${equipNote})` +
      (combinedST > 0 ? `<br>Required: <b>${combinedST}</b>` : '') +
      `<br><span style="color:${success ? '#4caf50' : '#e94560'};font-weight:bold">` +
      `${success ? '&#10003; Remain in Transformation!' : '&#10007; Failed — Stress Exhaustion until end of next turn!'}</span>` +
      `</div>`;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor
    });
  }

  /** Use Surging Strength (1/Round, 3/Encounter). */
  async _onTfSurgingStrength(event) {
    event.preventDefault();
    const meta = this.actor.system.transformationMeta || {};
    const aspectEffects = this.actor.system.aspectEffects || {};

    const heartbeat = aspectEffects.heartbeatActive || false;
    const longTransformation = aspectEffects.longTransformationActive || false;
    const roundLimit = heartbeat ? 3 : 1;

    if (longTransformation) {
      ui.notifications.warn("Surging Strength is blocked while Long Transformation is active.");
      return;
    }

    if ((meta.surgingStrengthRound || 0) >= roundLimit) {
      ui.notifications.warn(`Surging Strength already used this round (${roundLimit}/Round).`);
      return;
    }
    if (!heartbeat && (meta.surgingStrengthEncounter || 0) >= 3) {
      ui.notifications.warn("Surging Strength limit reached (3/Encounter).");
      return;
    }

    const newRound = (meta.surgingStrengthRound || 0) + 1;
    const newEnc = (meta.surgingStrengthEncounter || 0) + 1;

    await this.actor.update({
      "system.transformationMeta.surgingStrengthRound": newRound,
      "system.transformationMeta.surgingStrengthEncounter": newEnc
    });

    const stressBonus = this._getStressBonus();
    const combinedST = this.actor.system.transformationRules?.combinedStressTest || 0;
    const threshold = combinedST > 0 ? combinedST - 4 : 0;
    const eligible = threshold <= 0 || stressBonus >= threshold;

    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-forward"></i> Surging Strength</b> [${heartbeat ? newEnc + ' Enc' : newEnc + '/3 Enc'}, ${newRound}/${roundLimit} Rnd]` +
      (heartbeat ? ` <span style="color:#e91e63"><i class="fas fa-heartbeat"></i> Heartbeat</span>` : '') + `<br>` +
      `Stress Bonus: <b>${stressBonus}</b>` +
      (combinedST > 0 ? ` | Threshold: <b>${threshold}</b> (ST ${combinedST} - 4)` : '') +
      `<br><span style="color:${eligible ? '#4caf50' : '#e94560'};font-weight:bold">` +
      `${eligible ? '&#10003; Eligible — Transform as OoS Maneuver!' : '&#10007; Not eligible (Stress Bonus too low)'}</span>` +
      `</div>`;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: flavor
    });
  }

  /** Trigger Burst Limit (1/Encounter, any EP). */
  async _onTfBurstLimit(event) {
    event.preventDefault();
    const system = this.actor.system;
    const meta = system.transformationMeta || {};

    // Check Burst Through Your Limit: allows second burst if NLoP + first EP entry
    const nlopActiveEnc = meta.nlopActiveEncounter || [];
    const burstThroughAvailable = meta.burstLimitUsed && nlopActiveEnc.some(name =>
      (system.transformations || []).some(t => t.name === name &&
        ["enhancement_standard", "enhancement_special", "enhancement_transcendent"].includes(t.transformationType)
      )
    );

    if (meta.burstLimitUsed && !burstThroughAvailable) {
      ui.notifications.warn("Burst Limit already used this encounter.");
      return;
    }

    // Find active EPs
    const transformations = system.transformations || [];
    const activeEPs = transformations.filter(t => t.active &&
      ["enhancement_standard", "enhancement_special", "enhancement_transcendent"].includes(t.transformationType)
    );

    if (activeEPs.length === 0) {
      // Allow triggering even without active EP if entering one via Transformation Maneuver
      // But show dialog with all EPs
      const allEPs = transformations.filter(t =>
        ["enhancement_standard", "enhancement_special", "enhancement_transcendent"].includes(t.transformationType)
      );
      if (allEPs.length === 0) {
        ui.notifications.warn("No Enhancement Powers available.");
        return;
      }
    }

    // Collect all EPs (active or not) since you trigger it on entering
    const allEPs = transformations.filter(t =>
      ["enhancement_standard", "enhancement_special", "enhancement_transcendent"].includes(t.transformationType) && t.name
    );
    if (allEPs.length === 0) {
      ui.notifications.warn("No Enhancement Powers available.");
      return;
    }

    let selectedEP = allEPs[0];
    if (allEPs.length > 1) {
      const options = allEPs.map((ep, i) => `<option value="${i}">${ep.name}${ep.active ? ' (Active)' : ''}</option>`).join("");
      const result = await Dialog.wait({
        title: "Burst Limit",
        content: `<p>Select Enhancement Power for Burst Limit:</p><select id="ep-select" style="width:100%;margin-bottom:8px">${options}</select>`,
        buttons: {
          ok: { label: "Trigger", icon: '<i class="fas fa-fire"></i>', callback: (html) => parseInt(html.find("#ep-select").val()) },
          cancel: { label: "Cancel", callback: () => null }
        }
      });
      if (result === null) return;
      selectedEP = allEPs[result];
    }

    // Check for Burst Recovery (Transcendent EP or Special EP)
    const aspects = selectedEP.aspects || [];
    const catalogEntry = selectedEP.catalogKey ? (CONFIG.DBU?.transformationsCatalog?.[selectedEP.catalogKey]) : null;
    const resolvedAspects = aspects.length > 0 ? aspects : (catalogEntry?.aspects || []);
    const isTranscendent = resolvedAspects.some(a => a.toLowerCase().includes("transcendent"));
    const isSpecial = resolvedAspects.some(a => a.toLowerCase().includes("special"));
    const qualifiesForBurstRecovery = isTranscendent || isSpecial;

    let recoveryMsg = "";
    const updates = {
      "system.transformationMeta.burstLimitUsed": true,
      "system.transformationMeta.burstLimitSource": selectedEP.name
    };

    if (qualifiesForBurstRecovery) {
      const maxKP = system.kiPool.max;
      const currentLP = system.lifePoints?.value ?? 0;
      const injuredVal = system.thresholds?.injured?.value ?? Math.floor((system.lifePoints?.max || 100) * 0.5);
      const belowInjured = currentLP <= injuredVal;

      let kpRestore;
      if (belowInjured) {
        kpRestore = maxKP;
        recoveryMsg = `<br><b>Burst Recovery:</b> Below Injured Threshold — KP set to MAX (<b>${maxKP}</b>)`;
      } else {
        kpRestore = Math.floor(maxKP / 2);
        recoveryMsg = `<br><b>Burst Recovery:</b> Regain <b>${kpRestore}</b> KP (1/2 Max)`;
      }

      // Ki Multiplier active → halve Burst Recovery
      if (system.transformationRules?.kiMultiplierActive) {
        kpRestore = Math.floor(kpRestore / 2);
        recoveryMsg += ` [Halved by Ki Multiplier]`;
      }

      const currentKP = system.kiPool?.value ?? 0;
      updates["system.kiPool.value"] = Math.min(maxKP, currentKP + kpRestore);
    }

    await this.actor.update(updates);

    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-fire"></i> ${burstThroughAvailable ? 'Burst Through Your Limit!' : 'Burst Limit Triggered!'}</b><br>` +
      `Enhancement Power: <b>${selectedEP.name}</b>` +
      (qualifiesForBurstRecovery ? ` (${isSpecial ? 'Special' : 'Transcendent'})` : '') +
      recoveryMsg +
      `</div>`;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: flavor
    });
  }

  _getTransformationOptions(transformation) {
    const transformations = this.actor.system.transformations || [];
    const index = transformations.indexOf(transformation);
    if (index < 0) return {};
    const selections = this.actor.system.transformationOptionSelections || {};
    return selections[String(index)] || selections[index] || {};
  }

  _getResolvedTransformationEffects(transformation, transformationsOverride = null) {
    const transformations = transformationsOverride || this.actor.system.transformations || [];
    const index = transformations.indexOf(transformation);
    const selections = this.actor.system.transformationOptionSelections || {};
    const options = index >= 0 ? (selections[String(index)] || selections[index] || {}) : {};
    const catalog = CONFIG.DBU?.transformationsCatalog || {};
    const catEntry = transformation?.catalogKey ? catalog[transformation.catalogKey] : null;
    const groups = transformation?.structuredTraits?.length ? transformation.structuredTraits : (catEntry?.traitGroups || []);
    const specialGroups = [catEntry?.masteryTrait, catEntry?.legendaryTrait, catEntry?.exceedTrait, catEntry?.burstLimit].filter(Boolean);
    const resolved = [];

    const visitGroup = (group) => {
      for (const eff of (group?.effects || [])) {
        const effectKey = `${group?.name || transformation?.name || "Transformation"}_${eff.level || 0}`;
        if (eff.activationType === "option" && eff.options?.length > 0) {
          const selected = options[effectKey] || eff.options[0]?.name;
          const opt = eff.options.find(o => o.name === selected);
          if (opt) resolved.push({ ...opt, groupName: group?.name || transformation?.name || "Transformation" });
        } else if (eff.activationType === "multi-option" && eff.options?.length > 0) {
          const selectedArr = Array.isArray(options[effectKey]) ? options[effectKey] : [];
          for (const selected of selectedArr) {
            const opt = eff.options.find(o => o.name === selected);
            if (opt) resolved.push({ ...opt, groupName: group?.name || transformation?.name || "Transformation" });
          }
        } else if (eff.activationType === "choice" && eff.options?.length > 0) {
          const parentSelected = options[eff.parentOptionKey || ""] || "";
          const opt = eff.options.find(o => o.name === parentSelected);
          if (opt) resolved.push({ ...opt, groupName: group?.name || transformation?.name || "Transformation" });
        } else {
          resolved.push({ ...eff, groupName: group?.name || transformation?.name || "Transformation" });
        }
      }
    };

    for (const group of groups) visitGroup(group);
    for (const group of specialGroups) {
      for (const sub of (group.subGroups || [group])) visitGroup(sub);
    }

    return resolved;
  }

  _collectPersistentTransformationCombatStates(transformations = null) {
    const states = { raging: false, surging: false, mindful: false, superior: false, undying: false };
    const statePatterns = {
      raging: /\braging state\b/i,
      surging: /\bsurging state\b/i,
      mindful: /\bmindful state\b/i,
      superior: /\bsuperior state\b/i,
      undying: /\bundying state\b/i
    };

    for (const trans of (transformations || this.actor.system.transformations || [])) {
      if (!trans?.active) continue;
      const effects = this._getResolvedTransformationEffects(trans, transformations);
      for (const eff of effects) {
        const text = String(eff?.text || "");
        if (!/enter/i.test(text) || !/until you leave/i.test(text)) continue;
        for (const [stateKey, pattern] of Object.entries(statePatterns)) {
          if (pattern.test(text)) states[stateKey] = true;
        }
      }
    }

    return states;
  }

  async _syncPersistentTransformationCombatStates(transformations = null) {
    const persistentStates = this._collectPersistentTransformationCombatStates(transformations);
    const previousPersistent = this.actor.system.transformationMeta?.persistentCombatStates || {};
    const updates = { "system.transformationMeta.persistentCombatStates": persistentStates };

    for (const stateKey of Object.keys(persistentStates)) {
      if (persistentStates[stateKey]) {
        updates[`system.combatStates.${stateKey}`] = true;
      } else if (previousPersistent[stateKey]) {
        updates[`system.combatStates.${stateKey}`] = false;
      }
    }

    await this.actor.update(updates);
  }

  _getFirstTransformationOption(transformation) {
    const options = this._getTransformationOptions(transformation);
    for (const key of Object.keys(options)) {
      const value = options[key];
      if (value && typeof value === "string" && value !== "none") return value.toLowerCase();
    }
    return "";
  }

  async _applyLegendRealizedBonuses(selectedTrans, tier, baseTier, baseRecovery) {
    const key = selectedTrans.catalogKey;
    const option = this._getFirstTransformationOption(selectedTrans);
    const usedEncounter = this.actor.system.combatTabState?.resourceUsage?.encounter || {};
    const entrySnapshots = this.actor.system.transformationMeta?.entrySnapshots || {};
    const entrySnapshot = entrySnapshots[String(selectedTrans.id ?? "")] || null;
    const result = {
      rollBonus: 0,
      lpBonus: 0,
      kpBonus: 0,
      lpMultiplier: 1,
      kpMultiplier: 1,
      allowOverMaxKP: false,
      bonusLines: []
    };

    const addLpDiceBonus = async (formula, label) => {
      const bonusRoll = new Roll(formula);
      await bonusRoll.evaluate();
      result.lpBonus += bonusRoll.total;
      result.bonusLines.push(`${label}: <b>+${bonusRoll.total}</b> LP`);
    };

    const metamorphosisStage = {
      limited_suppression: 1,
      partial_suppression: 2,
      true_form: 3
    }[key];

    if (metamorphosisStage) {
      await addLpDiceBonus(`${metamorphosisStage * baseTier}d6`, "Transforming Physique");
      if (key === "limited_suppression") {
        result.bonusLines.push("True Terror: AoE Might Clash vs opponents, Shaken on win");
      }
    }

    if (key === "genetic_power" && (option.includes("stroke") || option.includes("arcosian"))) {
      await addLpDiceBonus(`${baseTier}d10`, "Stroke of Death");
    }

    if (key === "monster_form" && option.includes("shedding")) {
      await addLpDiceBonus(`${tier}d6`, "Shedding Transformation");
    }

    if (key === "super_form") {
      if (option.includes("survival")) {
        const lpHalfBonus = Math.floor(baseRecovery / 2);
        result.lpBonus += lpHalfBonus;
        result.bonusLines.push(`Desire Survival: <b>+${lpHalfBonus}</b> LP`);
      }

      const options = this._getTransformationOptions(selectedTrans);
      const awakeningOption = String(
        options.awakening ??
        options.example_of_awakening ??
        options.Awakening ??
        ""
      ).toLowerCase();

      if (awakeningOption.includes("any")) {
        const rollBonus = 4 * baseTier;
        result.rollBonus += rollBonus;
        result.bonusLines.push(`Any Race: <b>+${rollBonus}</b> to Legend Realized roll`);
      }
    }

    if (["empowered", "z_empowered", "super_empowered"].includes(key) &&
      this._hasUsedFormTrigger("lf", key, trig => /double the amount of life and ki points regained/i.test(trig.description || ""))) {
      result.lpMultiplier *= 2;
      result.kpMultiplier *= 2;
      result.bonusLines.push(`${selectedTrans.name}: <b>x2</b> Legend Realized LP/KP`);

      if (usedEncounter["lt:blaze_up"] && entrySnapshot?.belowInjured) {
        const blazeRoll = new Roll(`${tier}d8`);
        await blazeRoll.evaluate();
        result.lpBonus += blazeRoll.total;
        result.kpBonus += blazeRoll.total;
        result.bonusLines.push(`Blaze Up!: <b>+${blazeRoll.total}</b> LP/KP`);
      }
    }

    const isSuperSaiyanLine = /super_saiyan/i.test(key) || /super saiyan/i.test(selectedTrans.name || "");
    if (isSuperSaiyanLine && usedEncounter["lt:golden_warrior"]) {
      result.lpMultiplier *= 2;
      result.kpMultiplier *= 2;
      result.allowOverMaxKP = true;
      result.bonusLines.push("Super Saiyan Style: <b>x2</b> Legend Realized LP/KP, KP may exceed max");
    }

    if (key === "final_form_rider" && (entrySnapshot?.thresholdsBelow || 0) > 0) {
      const riderBonus = entrySnapshot.thresholdsBelow;
      const riderRoll = new Roll(`${riderBonus * tier}d10`);
      await riderRoll.evaluate();
      result.rollBonus += riderRoll.total;
      result.bonusLines.push(`Final Form Rider: <b>+${riderRoll.total}</b> to Legend Realized roll`);
    }

    return result;
  }

  /** Legend Realized: Roll 2d10(T) + PL, restore LP+KP (1/Transformation/Encounter). */
  async _onTfLegendRealized(event) {
    event.preventDefault();
    const system = this.actor.system;
    const meta = system.transformationMeta || {};
    const tier = system.tier || 1;
    const baseTier = system.baseTier || 1;

    const transformations = system.transformations || [];
    const activeAFLFs = transformations.filter(t => t.active &&
      (t.transformationType === "form_alternate" || t.transformationType === "form_legendary")
    );
    // Full Suppression does not benefit from Legend Realized (Weakest State Level 3)
    const lrEligible = activeAFLFs.filter(t => t.catalogKey !== "full_suppression");
    const used = meta.legendRealizedUsed || [];
    const eligible = lrEligible.filter(t => !used.includes(t.name));

    if (eligible.length === 0) {
      const hasBlockedOnly = activeAFLFs.length > 0 && lrEligible.length === 0;
      if (hasBlockedOnly) {
        ui.notifications.warn("Full Suppression does not benefit from Legend Realized (Weakest State).");
      } else {
        ui.notifications.warn("Legend Realized already used for all eligible AF/LF transformations this encounter.");
      }
      return;
    }

    let selectedTrans = eligible[0];
    if (eligible.length > 1) {
      const options = eligible.map((t, i) => `<option value="${i}">${t.name}</option>`).join("");
      const result = await Dialog.wait({
        title: "Legend Realized",
        content: `<p>Select Transformation for Legend Realized:</p><select id="lr-select" style="width:100%;margin-bottom:8px">${options}</select>`,
        buttons: {
          ok: { label: "Roll", icon: '<i class="fas fa-star"></i>', callback: (html) => parseInt(html.find("#lr-select").val()) },
          cancel: { label: "Cancel", callback: () => null }
        }
      });
      if (result === null) return;
      selectedTrans = eligible[result];
    }

    // Roll 2d10(T) + Power Level
    const pl = system.level || 1;
    const roll = new Roll(`${2 * tier}d10 + ${pl}`);
    await roll.evaluate();

    const extra = await this._applyLegendRealizedBonuses(selectedTrans, tier, baseTier, roll.total);
    const effectiveRollTotal = roll.total + extra.rollBonus;
    const lpRestored = (effectiveRollTotal + extra.lpBonus) * (extra.lpMultiplier || 1);
    const kpRestored = (effectiveRollTotal + extra.kpBonus) * (extra.kpMultiplier || 1);
    const bonusLines = [...extra.bonusLines];

    // Metamorphosis line: Transforming Physique Level 5 → +Sd6(bT) LP
    // Additional Legend Realized bonuses are applied in _applyLegendRealizedBonuses().

    const maxLP = system.lifePoints?.max || 100;
    const maxKP = system.kiPool?.max || 100;
    const newLP = Math.min(maxLP, (system.lifePoints?.value || 0) + lpRestored);
    const uncappedKP = (system.kiPool?.value || 0) + kpRestored;
    const newKP = extra.allowOverMaxKP ? uncappedKP : Math.min(maxKP, uncappedKP);

    const newUsed = [...used, selectedTrans.name];

    await this.actor.update({
      "system.lifePoints.value": newLP,
      "system.kiPool.value": newKP,
      "system.transformationMeta.legendRealizedUsed": newUsed
    });

    const bonusHtml = bonusLines.length > 0 ? "<br>" + bonusLines.join("<br>") : "";
    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-star"></i> Legend Realized!</b> (${selectedTrans.name})<br>` +
      `Roll: ${2 * tier}d10 + ${pl} PL = <b>${roll.total}</b>` +
      (extra.rollBonus ? ` <span style="color:#4caf50">+ ${extra.rollBonus} bonus</span>` : "") +
      `<br>` +
      `Restored <b>${lpRestored}</b> LP and <b>${kpRestored}</b> KP` +
      bonusHtml +
      `</div>`;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor
    });
  }

  /** New Level of Power: Mark first-time entry for a transformation. */
  async _onTfNewLevelOfPower(event) {
    event.preventDefault();
    const system = this.actor.system;
    const meta = system.transformationMeta || {};

    const transformations = system.transformations || [];
    const usedEver = meta.newLevelOfPowerUsed || [];
    const blockedNlopCatalogKeys = new Set(["full_suppression", "limited_suppression", "partial_suppression", "true_form"]);
    const eligible = transformations.filter(t =>
      t.name &&
      !usedEver.includes(t.name) &&
      !blockedNlopCatalogKeys.has(t.catalogKey)
    );

    if (eligible.length === 0) {
      ui.notifications.warn("No eligible transformations remain for New Level of Power.");
      return;
    }

    let selectedTrans = eligible[0];
    if (eligible.length > 1) {
      const options = eligible.map((t, i) => `<option value="${i}">${t.name} (${t.transformationType || '?'})</option>`).join("");
      const result = await Dialog.wait({
        title: "New Level of Power",
        content: `<p>Select the Transformation you are entering for the <b>first time ever</b>:</p>` +
          `<select id="nlop-select" style="width:100%;margin-bottom:8px">${options}</select>`,
        buttons: {
          ok: { label: "Mark", icon: '<i class="fas fa-level-up-alt"></i>', callback: (html) => parseInt(html.find("#nlop-select").val()) },
          cancel: { label: "Cancel", callback: () => null }
        }
      });
      if (result === null) return;
      selectedTrans = eligible[result];
    }

    const newUsedEver = [...usedEver, selectedTrans.name];
    const nlopActiveEnc = [...(meta.nlopActiveEncounter || []), selectedTrans.name];
    const baseTier = system.baseTier || 1;

    await this.actor.update({
      "system.transformationMeta.newLevelOfPowerUsed": newUsedEver,
      "system.transformationMeta.nlopActiveEncounter": nlopActiveEnc
    });

    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-level-up-alt"></i> New Level of Power!</b> (${selectedTrans.name})<br>` +
      `First-time entry — for the remainder of this encounter:<br>` +
      `&bull; <b>+1 Tier of Power</b><br>` +
      `&bull; <b>+${baseTier} Stress Bonus</b> (+1(bT))<br>` +
      `&bull; +1 base Tier for Power Advantage<br>` +
      `&bull; No Stress Test required to enter this Transformation` +
      `</div>`;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: flavor
    });
  }

  /**
   * Handle clicking a Legendary Trait triggered effect button in Combat tab.
   */
  async _onLegendaryTraitTrigger(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const triggerId = btn.dataset.triggerId;

    // Find the triggered effect data
    const ltBonuses = this.actor.system.legendaryTraitBonuses || {};
    let triggerData = null;
    for (const entry of (ltBonuses.entries || [])) {
      const found = (entry.triggered || []).find(t => t.id === triggerId);
      if (found) { triggerData = { ...found, sourceName: entry.sourceName, trackingId: `lt:${found.id}` }; break; }
    }
    if (!triggerData) return;

    if (triggerData.usageLimit || triggerData.maxUses) {
      const tracked = await this._trackCombatUsage(triggerData.trackingId, triggerData.usageLimit, triggerData.maxUses || 0);
      if (!tracked) return;
    }

    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-crown"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>` +
      `${triggerData.description}</div>`;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: flavor
    });
  }

  /**
   * Handle clicking a Manifested Power triggered effect button in Combat tab.
   */
  async _onManifestedPowerTrigger(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const triggerId = btn.dataset.triggerId;

    // Find the triggered effect data
    const mpBonuses = this.actor.system.manifestedPowerBonuses || {};
    let triggerData = null;
    for (const entry of (mpBonuses.entries || [])) {
      const found = (entry.triggered || []).find(t => t.id === triggerId);
      if (found) { triggerData = { ...found, sourceName: entry.name, trackingId: `mp:${found.id}` }; break; }
    }
    if (!triggerData) return;

    if (triggerData.usageLimit || triggerData.maxUses) {
      const tracked = await this._trackCombatUsage(triggerData.trackingId, triggerData.usageLimit, triggerData.maxUses || 0);
      if (!tracked) return;
    }

    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-star-of-life"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>` +
      `${triggerData.description}</div>`;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: flavor
    });
  }

  /**
   * Handle clicking a Racial Trait triggered effect button in Combat tab.
   */
  async _onRacialTraitTrigger(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const triggerId = btn.dataset.triggerId;

    // Search all race bonus objects for the triggered entry
    const system = this.actor.system;
    const raceBonusKeys = [
      "racialBonuses", "earthlingBonuses", "majinBonuses", "bioAndroidBonuses",
      "androidBonuses", "arcosianBonuses", "cerealianBonuses", "namekianBonuses",
      "nekoMajinBonuses", "neoTuffleBonuses", "shadowDragonBonuses", "shinjinBonuses",
      "undeadBonuses"
    ];
    let triggerData = null;
    for (const key of raceBonusKeys) {
      const bonuses = system[key];
      if (!bonuses?.triggered) continue;
      const found = bonuses.triggered.find(t => t.id === triggerId);
      if (found) {
        triggerData = { ...found, trackingId: `rt:${found.id}` };
        break;
      }
    }
    if (!triggerData) return;

    if (triggerData.usageLimit || triggerData.maxUses) {
      const tracked = await this._trackCombatUsage(triggerData.trackingId, triggerData.usageLimit, triggerData.maxUses || 0);
      if (!tracked) return;
    }

    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-dna"></i> ${triggerData.name}</b><br>` +
      `${triggerData.description}</div>`;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: flavor
    });
  }

  _getJusticeChargeContext(transformations = null) {
    const activeTransformations = transformations || this.actor.system.transformations || [];
    const justiceTransforms = [];
    let max = 3;

    for (const trans of activeTransformations) {
      if (!trans?.active) continue;
      const effects = this._getResolvedTransformationEffects(trans, activeTransformations);
      let hasJusticeCharge = false;

      for (const eff of effects) {
        const text = String(eff?.text || "");
        if (/justice charge/i.test(text)) {
          hasJusticeCharge = true;
        }
        if (/maximum number of justice charges is increased to 5/i.test(text)) {
          max = Math.max(max, 5);
        }
      }

      if (hasJusticeCharge) {
        justiceTransforms.push(trans);
      }
    }

    return { active: justiceTransforms.length > 0, max, transforms: justiceTransforms };
  }

  _getTransformationScalingLevel(transformation, transformations = null) {
    if (!transformation) return 0;
    const activeTransformations = transformations || this.actor.system.transformations || [];
    const aspects = Array.isArray(transformation.aspects) ? transformation.aspects : [];
    let scaling = 0;

    for (const aspect of aspects) {
      const match = String(aspect || "").match(/Scaling\s*\(LV\s*(\d+)\)/i);
      if (match) scaling += Number(match[1]) || 0;
    }

    const effects = this._getResolvedTransformationEffects(transformation, activeTransformations);
    for (const eff of effects) {
      const text = String(eff?.text || "");
      const addMatch = text.match(/gains?(?: an)? additional\s+(\d+)\s+levels? of the scaling aspect/i);
      if (addMatch) scaling += Number(addMatch[1]) || 0;
      const flatMatch = text.match(/gains the scaling\s*\(LV\s*(\d+)\)/i);
      if (flatMatch && scaling === 0) scaling += Number(flatMatch[1]) || 0;
    }

    return scaling;
  }

  _getTransformationGrowthLevel(transformation, transformations = null) {
    if (!transformation) return 0;
    const activeTransformations = transformations || this.actor.system.transformations || [];
    const aspects = Array.isArray(transformation.aspects) ? transformation.aspects : [];
    let growth = 0;

    for (const aspect of aspects) {
      const match = String(aspect || "").match(/Growth\s*\(LV\s*(\d+|\*)\)/i);
      if (match && match[1] !== "*") growth = Math.max(growth, Number(match[1]) || 0);
    }

    const effects = this._getResolvedTransformationEffects(transformation, activeTransformations);
    for (const eff of effects) {
      const text = String(eff?.text || "");
      const flatMatch = text.match(/gains? the growth\s*\(LV\s*(\d+)\)\s*aspect/i);
      if (flatMatch) growth = Math.max(growth, Number(flatMatch[1]) || 0);
    }

    return growth;
  }

  _applyJusticeChargeTriggerResource(specialResources, triggerData) {
    const desc = String(triggerData?.description || "");
    const sourceKey = String(triggerData?.trackingId || "");
    const justiceContext = this._getJusticeChargeContext();
    const max = Math.max(justiceContext.max || 3, specialResources.justiceCharge?.max ?? 0, 3);
    let changed = false;

    if (/gain 3 justice charges/i.test(desc)) {
      specialResources.justiceCharge = {
        value: Math.min(max, 3),
        max,
        source: sourceKey,
        sourceName: triggerData.sourceName || "Justice Charge"
      };
      changed = true;
    } else if (/gain a stack of justice charge/i.test(desc)) {
      const current = specialResources.justiceCharge?.value ?? 0;
      const next = Math.min(max, current + 1);
      if (next > current) {
        specialResources.justiceCharge = {
          value: next,
          max,
          source: sourceKey,
          sourceName: triggerData.sourceName || "Justice Charge"
        };
        changed = true;
      }
    }

    return changed;
  }

  async _undoCombatUsage(trackingId, usageLimit) {
    if (!trackingId || !usageLimit) return;
    const ctsUndo = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    const etUndo = foundry.utils.deepClone(this.actor.system.effectTracking || {});
    if (ctsUndo.resourceUsage?.[usageLimit]?.[trackingId]) {
      ctsUndo.resourceUsage[usageLimit][trackingId] = Math.max(0, ctsUndo.resourceUsage[usageLimit][trackingId] - 1);
      if (ctsUndo.resourceUsage[usageLimit][trackingId] === 0) delete ctsUndo.resourceUsage[usageLimit][trackingId];
    }
    if (etUndo.usedEffects?.[usageLimit]?.[trackingId]) {
      etUndo.usedEffects[usageLimit][trackingId] = Math.max(0, etUndo.usedEffects[usageLimit][trackingId] - 1);
      if (etUndo.usedEffects[usageLimit][trackingId] === 0) delete etUndo.usedEffects[usageLimit][trackingId];
    }
    await this.actor.update({ "system.combatTabState": ctsUndo, "system.effectTracking": etUndo });
  }

  async _handleJusticeChargeKiConversion(triggerData) {
    const desc = String(triggerData?.description || "");
    if (!/gain a stack of justice charge for every 4\(bT\) ki points spent/i.test(desc)) return false;

    const justiceContext = this._getJusticeChargeContext();
    if (!justiceContext.active) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const maxSpend = justiceContext.max >= 5 ? 20 * baseTier : 12 * baseTier;
    const kpCurrent = this.actor.system.kiPool?.value ?? 0;
    const spendCap = Math.min(maxSpend, kpCurrent);
    if (spendCap < 4 * baseTier) {
      ui.notifications?.warn("Not enough Ki Points to gain a Justice Charge.");
      return "blocked";
    }

    const content = `
      <form>
        <div class="form-group">
          <label>Ki Points to spend (max ${spendCap})</label>
          <input type="number" name="kpSpend" min="0" max="${spendCap}" step="${4 * baseTier}" value="${4 * baseTier}" />
          <p class="notes">Gain 1 Justice Charge per ${4 * baseTier} KP spent. This does not reduce Capacity.</p>
        </div>
      </form>`;

    const kpSpendRaw = await Dialog.prompt({
      title: triggerData.name || "Justice Charge",
      content,
      callback: (html) => Number(html.find("[name='kpSpend']").val()) || 0,
      rejectClose: false
    });

    let kpSpend = Math.min(spendCap, Math.max(0, Number(kpSpendRaw) || 0));
    kpSpend -= kpSpend % (4 * baseTier);
    if (kpSpend <= 0) return "cancelled";

    const chargesGained = Math.floor(kpSpend / (4 * baseTier));
    const specialResources = foundry.utils.deepClone(this.actor.system.transformationMeta?.specialResources || {});
    const max = Math.max(justiceContext.max || 3, specialResources.justiceCharge?.max ?? 0, 3);
    const current = specialResources.justiceCharge?.value ?? 0;
    const next = Math.min(max, current + chargesGained);
    const actualChargesGained = Math.max(0, next - current);
    if (actualChargesGained <= 0) {
      ui.notifications?.info("Justice Charge is already at its maximum.");
      return "cancelled";
    }

    const currentKP = this.actor.system.kiPool?.value ?? 0;
    specialResources.justiceCharge = {
      value: next,
      max,
      source: String(triggerData?.trackingId || ""),
      sourceName: triggerData.sourceName || "Justice Charge"
    };

    await this.actor.update({
      "system.kiPool.value": Math.max(0, currentKP - kpSpend),
      "system.transformationMeta.specialResources": specialResources
    });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-bolt"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${kpSpend}</b> KP and gained <b>${actualChargesGained}</b> Justice Charge${actualChargesGained === 1 ? "" : "s"}.</div>`
    });

    return true;
  }

  _getGodOfMartialArtsSuperiorCost() {
    const activeTransform = (this.actor.system.transformations || []).find(t => t?.active && t.catalogKey === "god_of_martial_arts");
    if (!activeTransform) return 4;
    const effects = this._getResolvedTransformationEffects(activeTransform, this.actor.system.transformations || []);
    const hasExceedDiscount = effects.some(e => /halve the advantage point cost of the 6th effect of wizened warrior/i.test(String(e?.text || "")));
    return hasExceedDiscount ? 2 : 4;
  }

  async _handleAdvantagePointSuperiorTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    if (!/spend 4 advantage points to enter the superior state until the end of your next turn/i.test(desc)) return false;

    const specialResources = foundry.utils.deepClone(this.actor.system.transformationMeta?.specialResources || {});
    const current = specialResources.advantagePoints?.value ?? 0;
    const requiredHeld = 12;
    const cost = this._getGodOfMartialArtsSuperiorCost();
    if (current < requiredHeld) {
      ui.notifications?.warn("You need 12 Advantage Points to use this trigger.");
      return "blocked";
    }
    if (current < cost) {
      ui.notifications?.warn("Not enough Advantage Points to pay this trigger's cost.");
      return "blocked";
    }

    if (triggerData?.dryRun) return true;

    specialResources.advantagePoints = {
      ...(specialResources.advantagePoints || {}),
      max: Math.max(specialResources.advantagePoints?.max ?? 0, 12),
      value: Math.max(0, current - cost),
      sourceName: triggerData.sourceName || "Advantage Points"
    };

    await this.actor.update({
      "system.transformationMeta.specialResources": specialResources,
      "system.combatStates.superior": true
    });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-crown"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${cost}</b> Advantage Point${cost === 1 ? "" : "s"} and entered the <b>Superior</b> State until the end of your next turn.</div>`
    });

    return true;
  }

  async _handleAdvantagePointSignatureTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    if (!/spend any number of advantage points to either: increase the wound roll/i.test(desc)) return false;

    const specialResources = foundry.utils.deepClone(this.actor.system.transformationMeta?.specialResources || {});
    const current = specialResources.advantagePoints?.value ?? 0;
    if (current <= 0) {
      ui.notifications?.warn("You have no Advantage Points to spend.");
      return "blocked";
    }

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const content = `
      <form>
        <div class="form-group">
          <label>Advantage Points to spend (max ${current})</label>
          <input type="number" name="apSpend" min="0" max="${current}" step="1" value="1" />
        </div>
        <div class="form-group">
          <label>Effect</label>
          <select name="mode">
            <option value="wound">Increase Wound Roll</option>
            <option value="charge">Apply Energy Charges</option>
          </select>
        </div>
      </form>`;

    const result = await Dialog.prompt({
      title: triggerData.name || "Advantage Points",
      content,
      callback: (html) => ({
        spend: Number(html.find("[name='apSpend']").val()) || 0,
        mode: String(html.find("[name='mode']").val() || "wound")
      }),
      rejectClose: false
    });

    const spend = Math.min(current, Math.max(0, Number(result?.spend) || 0));
    if (spend <= 0) return "cancelled";

    specialResources.advantagePoints = {
      ...(specialResources.advantagePoints || {}),
      max: Math.max(specialResources.advantagePoints?.max ?? 0, 12),
      value: current - spend,
      sourceName: triggerData.sourceName || "Advantage Points"
    };

    await this.actor.update({ "system.transformationMeta.specialResources": specialResources });

    const mode = result?.mode === "charge" ? "charge" : "wound";
    const effectText = mode === "charge"
      ? `Apply <b>${Math.floor(spend / 4)}</b> Energy Charge${Math.floor(spend / 4) === 1 ? "" : "s"} to the Signature Technique`
      : `Increase the Wound Roll by <b>${spend * baseTier}</b>`;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-crown"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Advantage Point${spend === 1 ? "" : "s"}<br>${effectText}</div>`
    });

    return true;
  }

  async _handleDivineKiConversionTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    if (!/convert up to 10\(bT\) ki points into divine ki points/i.test(desc)) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const maxConvert = 10 * baseTier;
    const currentKP = this.actor.system.kiPool?.value ?? 0;
    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    const maxDKP = this.actor.system.divineKiPoints?.max ?? 0;
    const spendCap = Math.min(maxConvert, currentKP, Math.max(0, maxDKP - currentDKP));
    if (spendCap <= 0) {
      ui.notifications?.warn("No Ki Points can be converted into Divine Ki Points right now.");
      return "blocked";
    }

    const kpSpendRaw = await Dialog.prompt({
      title: triggerData.name || "Divine Ki Conversion",
      content: `<form><div class="form-group"><label>Ki Points to convert (max ${spendCap})</label><input type="number" name="kpSpend" min="0" max="${spendCap}" step="1" value="1" /></div></form>`,
      callback: (html) => Number(html.find("[name='kpSpend']").val()) || 0,
      rejectClose: false
    });

    const kpSpend = Math.min(spendCap, Math.max(0, Number(kpSpendRaw) || 0));
    if (kpSpend <= 0) return "cancelled";

    await this.actor.update({
      "system.kiPool.value": Math.max(0, currentKP - kpSpend),
      "system.divineKiPoints.value": Math.min(maxDKP, currentDKP + kpSpend)
    });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Converted <b>${kpSpend}</b> KP into <b>${kpSpend}</b> Divine Ki Points.</div>`
    });

    return true;
  }

  _hasDivineKiSpendKiRefund() {
    const activeTransform = (this.actor.system.transformations || []).find(t => t?.active && t.catalogKey === "godly_powers");
    if (!activeTransform) return false;
    const effects = this._getResolvedTransformationEffects(activeTransform, this.actor.system.transformations || []);
    return effects.some(e => /if you spend any amount of divine ki points, regain ki points equal to 1\/2/i.test(String(e?.text || "")));
  }

  async _applyDivineKiSpendSideEffects(spent, label = "Divine Ki") {
    if (!(spent > 0) || !this._hasDivineKiSpendKiRefund()) return 0;
    const kpGain = Math.ceil(spent / 2);
    const currentKP = this.actor.system.kiPool?.value ?? 0;
    const maxKP = this.actor.system.kiPool?.max ?? 0;
    const nextKP = Math.min(maxKP, currentKP + kpGain);
    if (nextKP <= currentKP) return 0;
    await this.actor.update({ "system.kiPool.value": nextKP });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> Divine Style</b><br>Spent <b>${spent}</b> Divine Ki Points through <b>${label}</b><br>Regained <b>${nextKP - currentKP}</b> KP.</div>`
    });
    return nextKP - currentKP;
  }

  async _handleDivineKiRollBoostTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    if (!/spend up to 4\(bT\) divine ki points to increase one of your strike or dodge rolls/i.test(desc)) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const maxSpend = 4 * baseTier;
    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    const spendCap = Math.min(maxSpend, currentDKP);
    if (spendCap <= 0) {
      ui.notifications?.warn("You do not have enough Divine Ki Points.");
      return "blocked";
    }

    const result = await Dialog.prompt({
      title: triggerData.name || "Divine Ki Roll Boost",
      content: `
        <form>
          <div class="form-group">
            <label>Divine Ki Points to spend (max ${spendCap})</label>
            <input type="number" name="dkpSpend" min="0" max="${spendCap}" step="1" value="1" />
          </div>
          <div class="form-group">
            <label>Roll to boost</label>
            <select name="rollType">
              <option value="Strike">Strike</option>
              <option value="Dodge">Dodge</option>
            </select>
          </div>
        </form>`,
      callback: (html) => ({
        spend: Number(html.find("[name='dkpSpend']").val()) || 0,
        rollType: String(html.find("[name='rollType']").val() || "Strike")
      }),
      rejectClose: false
    });

    const spend = Math.min(spendCap, Math.max(0, Number(result?.spend) || 0));
    if (spend <= 0) return "cancelled";

    await this.actor.update({ "system.divineKiPoints.value": Math.max(0, currentDKP - spend) });
    await this._applyDivineKiSpendSideEffects(spend, triggerData.name || "Divine Ki Roll Boost");

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Divine Ki Points to increase a <b>${result?.rollType === "Dodge" ? "Dodge" : "Strike"}</b> Roll by <b>${spend}</b>.</div>`
    });

    return true;
  }

  async _handleDivineKiOOSTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    if (!/spend 4\(bT\) divine ki points to use any maneuver with an action cost of 1 action as an out-of-sequence maneuver/i.test(desc)) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const spend = 4 * baseTier;
    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    if (currentDKP < spend) {
      ui.notifications?.warn("Not enough Divine Ki Points to use this trigger.");
      return "blocked";
    }

    const maneuver = await Dialog.prompt({
      title: triggerData.name || "Divine Energy",
      content: `<form><div class="form-group"><label>Maneuver used OoS</label><input type="text" name="maneuver" value="" /></div></form>`,
      callback: (html) => String(html.find("[name='maneuver']").val() || "").trim(),
      rejectClose: false
    });
    if (!maneuver) return "cancelled";

    await this.actor.update({ "system.divineKiPoints.value": Math.max(0, currentDKP - spend) });
    await this._applyDivineKiSpendSideEffects(spend, triggerData.name || "Divine Energy");

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Divine Ki Points to use <b>${foundry.utils.escapeHTML(maneuver)}</b> as an Out-of-Sequence Maneuver.</div>`
    });

    return true;
  }

  async _applyDivineKiRecoveryTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    const btMatch = desc.match(/regain\s+(\d+)\(bT\)\s+divine ki points/i);
    if (!btMatch) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const gain = Number(btMatch[1]) * baseTier;
    if (!(gain > 0)) return false;

    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    const maxDKP = this.actor.system.divineKiPoints?.max ?? 0;
    const nextDKP = Math.min(maxDKP, currentDKP + gain);
    const actualGain = nextDKP - currentDKP;
    if (actualGain <= 0) return true;

    await this.actor.update({ "system.divineKiPoints.value": nextDKP });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Regained <b>${actualGain}</b> Divine Ki Points.</div>`
    });
    return true;
  }

  async _handleDivineKiStateTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    const match = desc.match(/spend\s+(\d+)\(bT\)\s+divine ki points to enter the\s+(superior|surging)\s+state/i);
    if (!match) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const spend = Number(match[1]) * baseTier;
    const stateKey = String(match[2] || "").toLowerCase() === "surging" ? "surging" : "superior";
    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    if (currentDKP < spend) {
      ui.notifications?.warn("Not enough Divine Ki Points to use this trigger.");
      return "blocked";
    }

    await this.actor.update({
      "system.divineKiPoints.value": Math.max(0, currentDKP - spend),
      [`system.combatStates.${stateKey}`]: true
    });
    await this._applyDivineKiSpendSideEffects(spend, triggerData.name || "Divine Ki State");

    const stateLabel = stateKey === "surging" ? "Surging" : "Superior";
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Divine Ki Points and entered the <b>${stateLabel}</b> State.</div>`
    });
    return true;
  }

  async _handleDivineKiManeuverTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    if (/use any maneuver with an action cost of 1 action as an out-of-sequence maneuver/i.test(desc)) return false;

    const match = desc.match(/spend\s+(\d+)\(bT\)\s+divine ki points to use the\s+(.+?)\s+maneuver(?:\s+or\s+(.+?)\s+maneuver)?\s+as an\s+(instant|out-of-sequence)\s+maneuver/i);
    if (!match) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const spend = Number(match[1]) * baseTier;
    const optionA = String(match[2] || "").trim();
    const optionB = String(match[3] || "").trim();
    const timing = String(match[4] || "").toLowerCase() === "instant" ? "Instant" : "Out-of-Sequence";
    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    if (currentDKP < spend) {
      ui.notifications?.warn("Not enough Divine Ki Points to use this trigger.");
      return "blocked";
    }

    let maneuver = optionA;
    if (optionB) {
      const chosen = await Dialog.prompt({
        title: triggerData.name || "Divine Ki Maneuver",
        content: `<form><div class="form-group"><label>Maneuver</label><select name="maneuver"><option value="${foundry.utils.escapeHTML(optionA)}">${foundry.utils.escapeHTML(optionA)}</option><option value="${foundry.utils.escapeHTML(optionB)}">${foundry.utils.escapeHTML(optionB)}</option></select></div></form>`,
        callback: (html) => String(html.find("[name='maneuver']").val() || optionA),
        rejectClose: false
      });
      if (!chosen) return "cancelled";
      maneuver = chosen;
    }

    await this.actor.update({ "system.divineKiPoints.value": Math.max(0, currentDKP - spend) });
    await this._applyDivineKiSpendSideEffects(spend, triggerData.name || "Divine Ki Maneuver");

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Divine Ki Points to use <b>${foundry.utils.escapeHTML(maneuver)}</b> as an <b>${timing}</b> Maneuver.</div>`
    });
    return true;
  }

  async _handleDivineKiHealingSurgeTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    const match = desc.match(/spend\s+(\d+)\(bT\)\s+divine ki points to use a healing surge as an instant maneuver/i);
    if (!match) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const spend = Number(match[1]) * baseTier;
    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    if (currentDKP < spend) {
      ui.notifications?.warn("Not enough Divine Ki Points to use Healing Surge.");
      return "blocked";
    }

    await this.actor.update({ "system.divineKiPoints.value": Math.max(0, currentDKP - spend) });
    await this._applyDivineKiSpendSideEffects(spend, triggerData.name || "Healing Surge");

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Divine Ki Points to use <b>Healing Surge</b> as an <b>Instant</b> Maneuver.</div>`
    });
    return true;
  }

  async _handlePerfectPointManeuverTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    const match = desc.match(/spend\s+(\d+)\s+perfect points to use the\s+(.+?)\s+maneuver(?:\s+or\s+(.+?)\s+maneuver)?\s+as an instant maneuver/i);
    if (!match) return false;

    const spend = Number(match[1]) || 0;
    const currentPP = this.actor.system.tracking?.perfectPoints ?? 0;
    if (currentPP < spend) {
      ui.notifications?.warn("Not enough Perfect Points to use this trigger.");
      return "blocked";
    }

    const optionA = String(match[2] || "").trim();
    const optionB = String(match[3] || "").trim();
    let maneuver = optionA;
    if (optionB) {
      const chosen = await Dialog.prompt({
        title: triggerData.name || "Perfect Points",
        content: `<form><div class="form-group"><label>Maneuver</label><select name="maneuver"><option value="${foundry.utils.escapeHTML(optionA)}">${foundry.utils.escapeHTML(optionA)}</option><option value="${foundry.utils.escapeHTML(optionB)}">${foundry.utils.escapeHTML(optionB)}</option></select></div></form>`,
        callback: (html) => String(html.find("[name='maneuver']").val() || optionA),
        rejectClose: false
      });
      if (!chosen) return "cancelled";
      maneuver = chosen;
    }

    await this.actor.update({ "system.tracking.perfectPoints": Math.max(0, currentPP - spend) });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-circle"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Perfect Points to use <b>${foundry.utils.escapeHTML(maneuver)}</b> as an <b>Instant</b> Maneuver.</div>`
    });
    return true;
  }

  async _handleKiSurgingTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    const match = desc.match(/spend\s+(\d+)\(bT\)\s+ki points? to enter the surging state until the end of your next turn/i);
    if (!match) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const spend = Number(match[1]) * baseTier;
    const currentKP = this.actor.system.kiPool?.value ?? 0;
    if (currentKP < spend) {
      ui.notifications?.warn("Not enough Ki Points to enter the Surging State.");
      return "blocked";
    }

    await this.actor.update({
      "system.kiPool.value": Math.max(0, currentKP - spend),
      "system.combatStates.surging": true
    });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-bolt"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Ki Points and entered the <b>Surging</b> State until the end of your next turn.</div>`
    });
    return true;
  }

  async _handleLifeforceGainTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    const match = desc.match(/gain\s+1\s+lifeforce/i);
    if (!match) return false;

    const current = this.actor.system.tracking?.lifeforce ?? 0;
    await this.actor.update({ "system.tracking.lifeforce": current + 1 });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-heart"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Gained <b>1</b> Lifeforce.</div>`
    });
    return true;
  }

  async _handleLifeforceSpendTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    const current = this.actor.system.tracking?.lifeforce ?? 0;
    if (current <= 0) return false;

    if (/spend any amount of lifeforce up to 1\/2 \(rounded up\) of z/i.test(desc)) {
      const maxSpend = current;
      const result = await Dialog.prompt({
        title: triggerData.name || "Lifeforce",
        content: `<form><div class="form-group"><label>Lifeforce to spend (max ${maxSpend})</label><input type="number" name="lfSpend" min="0" max="${maxSpend}" step="1" value="1" /></div></form>`,
        callback: (html) => Number(html.find("[name='lfSpend']").val()) || 0,
        rejectClose: false
      });
      const spend = Math.min(maxSpend, Math.max(0, Number(result) || 0));
      if (spend <= 0) return "cancelled";

      const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
      const currentCharges = this.actor.system.tracking?.energyCharges ?? 0;
      await this.actor.update({
        "system.tracking.lifeforce": current - spend,
        "system.tracking.energyCharges": currentCharges + spend
      });
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-heart"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Lifeforce<br>Signature Technique: <b>-${spend * baseTier}</b> KP cost and <b>+${spend}</b> Energy Charge${spend === 1 ? "" : "s"}.</div>`
      });
      return true;
    }

    if (/spend 1 or 2 lifeforce to enter the superior state/i.test(desc) || /spend 2 or 3 lifeforce to enter the surging state/i.test(desc)) {
      const options = [];
      if (current >= 1) options.push({ value: "power", label: "1 Lifeforce -> +1 Power" });
      if (current >= 1) options.push({ value: "superior1", label: "1 Lifeforce -> Superior until end of turn" });
      if (current >= 2) options.push({ value: "superior2", label: "2 Lifeforce -> Superior until end of next turn" });
      if (current >= 2) options.push({ value: "surging2", label: "2 Lifeforce -> Surging until end of next turn" });
      if (current >= 3) options.push({ value: "surging3", label: "3 Lifeforce -> Surging until end of next turn (ignore 2nd effect)" });
      if (options.length === 0) return "blocked";

      const chosen = await Dialog.prompt({
        title: triggerData.name || "Lifeforce",
        content: `<form><div class="form-group"><label>Effect</label><select name="effect">${options.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}</select></div></form>`,
        callback: (html) => String(html.find("[name='effect']").val() || ""),
        rejectClose: false
      });
      if (!chosen) return "cancelled";

      const updates = {};
      let spend = 0;
      let msg = "";
      if (chosen === "power") {
        spend = 1;
        const currentPower = this.actor.system.tracking?.powerStacks ?? 0;
        updates["system.tracking.powerStacks"] = currentPower + 1;
        msg = "Gained <b>1</b> stack of Power from this Power Up.";
      } else if (chosen === "superior1") {
        spend = 1;
        updates["system.combatStates.superior"] = true;
        msg = "Entered the <b>Superior</b> State until the end of your turn.";
      } else if (chosen === "superior2") {
        spend = 2;
        updates["system.combatStates.superior"] = true;
        msg = "Entered the <b>Superior</b> State until the end of your next turn.";
      } else if (chosen === "surging2") {
        spend = 2;
        updates["system.combatStates.surging"] = true;
        msg = "Entered the <b>Surging</b> State until the end of your next turn.";
      } else if (chosen === "surging3") {
        spend = 3;
        updates["system.combatStates.surging"] = true;
        msg = "Entered the <b>Surging</b> State until the end of your next turn and ignores its 2nd effect.";
      }

      if (!(spend > 0) || current < spend) return "blocked";
      updates["system.tracking.lifeforce"] = current - spend;
      await this.actor.update(updates);
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-heart"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Lifeforce<br>${msg}</div>`
      });
      return true;
    }

    return false;
  }

  _getBattleBornTotal() {
    const bb = this.actor.system.battleBorn || {};
    return (bb.strike ?? 0) + (bb.dodge ?? 0) + (bb.wound ?? 0);
  }

  async _applyBattleBornGainSideEffects(source = "Battle Born") {
    const transformations = this.actor.system.transformations || [];
    const active = transformations.filter(t => t?.active);
    if (active.length === 0) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    let lpGain = 0;
    let dkpGain = 0;

    for (const trans of active) {
      const effects = this._getResolvedTransformationEffects(trans, transformations);
      for (const effect of effects) {
        const text = String(effect?.text || "");
        let match = text.match(/(?:if|upon)\s+gaining\s+(?:a stack|\w+\s+stack\(s\))\s+of\s+battle born.*?regain\s+(\d+)\(bT\)\s+life points?\s+and\s+(\d+)\(bT\)\s+divine ki points?/i);
        if (match) {
          lpGain += Number(match[1]) * baseTier;
          dkpGain += Number(match[2]) * baseTier;
          continue;
        }
        match = text.match(/(?:if|upon)\s+gaining\s+(?:a stack|\w+\s+stack\(s\))\s+of\s+battle born.*?regain\s+(\d+)\(bT\)\s+divine ki points?/i);
        if (match) {
          dkpGain += Number(match[1]) * baseTier;
        }
      }
    }

    if (!(lpGain > 0 || dkpGain > 0)) return false;

    const updates = {};
    const currentLP = this.actor.system.health?.value ?? 0;
    const maxLP = this.actor.system.health?.max ?? 0;
    const nextLP = Math.min(maxLP, currentLP + lpGain);
    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    const maxDKP = this.actor.system.divineKiPoints?.max ?? 0;
    const nextDKP = Math.min(maxDKP, currentDKP + dkpGain);
    if (nextLP > currentLP) updates["system.health.value"] = nextLP;
    if (nextDKP > currentDKP) updates["system.divineKiPoints.value"] = nextDKP;
    if (Object.keys(updates).length > 0) {
      await this.actor.update(updates);
    }

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-fire"></i> Battle Born</b><br>${foundry.utils.escapeHTML(source)}<br>${nextLP > currentLP ? `Regained <b>${nextLP - currentLP}</b> LP` : ""}${nextLP > currentLP && nextDKP > currentDKP ? "<br>" : ""}${nextDKP > currentDKP ? `Regained <b>${nextDKP - currentDKP}</b> Divine Ki Points` : ""}</div>`
    });
    return true;
  }

  async _applyBattleBornOverflowSideEffects(source = "Battle Born") {
    const transformations = this.actor.system.transformations || [];
    const active = transformations.filter(t => t?.active);
    if (active.length === 0) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    let dkpGain = 0;
    for (const trans of active) {
      const effects = this._getResolvedTransformationEffects(trans, transformations);
      for (const effect of effects) {
        const text = String(effect?.text || "");
        const match = text.match(/if you would gain a stack of battle born.*?maximum number of battle born stacks.*?regain\s+(\d+)\(bT\)\s+divine ki points?/i);
        if (match) dkpGain += Number(match[1]) * baseTier;
      }
    }
    if (!(dkpGain > 0)) return false;

    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    const maxDKP = this.actor.system.divineKiPoints?.max ?? 0;
    const nextDKP = Math.min(maxDKP, currentDKP + dkpGain);
    if (nextDKP <= currentDKP) return true;
    await this.actor.update({ "system.divineKiPoints.value": nextDKP });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-fire"></i> Battle Born Overflow</b><br>${foundry.utils.escapeHTML(source)}<br>Regained <b>${nextDKP - currentDKP}</b> Divine Ki Points.</div>`
    });
    return true;
  }

  async _spendBattleBornStacks(amount, title = "Battle Born") {
    const bb = foundry.utils.deepClone(this.actor.system.battleBorn || { strike: 0, dodge: 0, wound: 0, undying: false });
    const total = (bb.strike ?? 0) + (bb.dodge ?? 0) + (bb.wound ?? 0);
    if (total < amount) return false;

    let remaining = amount;
    const order = ["wound", "strike", "dodge"];
    for (const key of order) {
      const available = bb[key] ?? 0;
      if (available <= 0) continue;
      const spend = Math.min(available, remaining);
      bb[key] = available - spend;
      remaining -= spend;
      if (remaining <= 0) break;
    }
    if (remaining > 0) return false;

    await this.actor.update({ "system.battleBorn": bb });
    ui.notifications.info(`${title}: spent ${amount} Battle Born.`);
    return true;
  }

  async _handleBattleBornGainTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    if (!/gain a stack of battle born/i.test(desc)) return false;
    const result = await this._battleBornGrantStack(triggerData.name || triggerData.sourceName || "Battle Born");
    if (result === "cancelled") return "cancelled";
    return !!result;
  }

  async _handleBattleBornSpendTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    const total = this._getBattleBornTotal();
    if (total <= 0) return false;

    if (/spend 1 battle born to regain 12\(bT\) divine ki points/i.test(desc)) {
      const spent = await this._spendBattleBornStacks(1, triggerData.name || "Battle Born");
      if (!spent) return "blocked";
      const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
      const gain = 12 * baseTier;
      const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
      const maxDKP = this.actor.system.divineKiPoints?.max ?? 0;
      await this.actor.update({ "system.divineKiPoints.value": Math.min(maxDKP, currentDKP + gain) });
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-fire"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>1</b> Battle Born and regained <b>${Math.min(gain, maxDKP - currentDKP)}</b> Divine Ki Points.</div>`
      });
      return true;
    }

    if (/spend a stack of battle born to increase the damage category of that attacking maneuver by 1 category/i.test(desc)) {
      const spent = await this._spendBattleBornStacks(1, triggerData.name || "Battle Born");
      if (!spent) return "blocked";
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-fire"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>1</b> Battle Born to increase the Damage Category by <b>1</b>.</div>`
      });
      return true;
    }

    if (/spend a stack of battle born to apply your greater dice to the wound roll/i.test(desc)) {
      const spent = await this._spendBattleBornStacks(1, triggerData.name || "Battle Born");
      if (!spent) return "blocked";
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-fire"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>1</b> Battle Born to apply <b>Greater Dice</b> to the Wound Roll.</div>`
      });
      return true;
    }

    if (/spend any number of battle born stacks.*gain an energy charge for each stack of battle born spent/i.test(desc)) {
      const spendRaw = await Dialog.prompt({
        title: triggerData.name || "Battle Born",
        content: `<form><div class="form-group"><label>Battle Born to spend (max ${total})</label><input type="number" name="bbSpend" min="0" max="${total}" step="1" value="1" /></div></form>`,
        callback: (html) => Number(html.find("[name='bbSpend']").val()) || 0,
        rejectClose: false
      });
      const spend = Math.min(total, Math.max(0, Number(spendRaw) || 0));
      if (spend <= 0) return "cancelled";
      const spent = await this._spendBattleBornStacks(spend, triggerData.name || "Battle Born");
      if (!spent) return "blocked";
      const currentCharges = this.actor.system.tracking?.energyCharges ?? 0;
      await this.actor.update({ "system.tracking.energyCharges": currentCharges + spend });
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-fire"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Battle Born and gained <b>${spend}</b> Energy Charge${spend === 1 ? "" : "s"}.</div>`
      });
      return true;
    }

    return false;
  }

  async _handlePowerGainTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    const gainTwo = /gain 2 stacks of power until the end of your next turn/i.test(desc);
    const gainOne = /gain a stack of power until the end of your next turn/i.test(desc) || /gain a stack of power until the end of your turn/i.test(desc);
    if (!gainTwo && !gainOne) return false;

    const currentPower = this.actor.system.tracking?.powerStacks ?? 0;
    const amount = gainTwo ? 2 : 1;
    await this.actor.update({ "system.tracking.powerStacks": currentPower + amount });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-bolt"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Gained <b>${amount}</b> stack${amount === 1 ? "" : "s"} of Power.</div>`
    });
    return true;
  }

  async _handleDivineKiPowerLevelRecoveryTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    if (!/divine ki points equal to twice your power level/i.test(desc)) return false;

    const gain = 2 * (this.actor.system.level || 1);
    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    const maxDKP = this.actor.system.divineKiPoints?.max ?? 0;
    const actualGain = Math.max(0, Math.min(maxDKP, currentDKP + gain) - currentDKP);
    await this.actor.update({ "system.divineKiPoints.value": Math.min(maxDKP, currentDKP + gain) });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Regained <b>${actualGain}</b> Divine Ki Points.</div>`
    });
    return true;
  }

  async _handleDivineKiEnergyChargeTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    let match = desc.match(/spend\s+(\d+)\(bT\)\s+divine ki points to gain an additional energy charge/i);
    if (match) {
      const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
      const spend = Number(match[1]) * baseTier;
      const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
      if (currentDKP < spend) {
        ui.notifications?.warn("Not enough Divine Ki Points to gain an additional Energy Charge.");
        return "blocked";
      }
      const currentCharges = this.actor.system.tracking?.energyCharges ?? 0;
      await this.actor.update({
        "system.divineKiPoints.value": Math.max(0, currentDKP - spend),
        "system.tracking.energyCharges": currentCharges + 1
      });
      await this._applyDivineKiSpendSideEffects(spend, triggerData.name || "Divine Ki Energy Charge");
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Divine Ki Points and gained <b>1</b> additional Energy Charge.</div>`
      });
      return true;
    }

    match = desc.match(/for every\s+(\d+)\(bT\)\s+divine ki points spent,\s*gain a stack of power/i);
    if (!match) return false;

    const step = Number(match[1]);
    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    const maxSpend = currentDKP;
    if (maxSpend <= 0) {
      ui.notifications?.warn("Not enough Divine Ki Points to gain Power.");
      return "blocked";
    }
    const spendRaw = await Dialog.prompt({
      title: triggerData.name || "Divine Ki Power",
      content: `<form><div class="form-group"><label>Divine Ki Points to spend (multiples of ${step * baseTier})</label><input type="number" name="dkpSpend" min="0" max="${maxSpend}" step="${step * baseTier}" value="${step * baseTier}" /></div></form>`,
      callback: (html) => Number(html.find("[name='dkpSpend']").val()) || 0,
      rejectClose: false
    });
    const spend = Math.min(maxSpend, Math.max(0, Number(spendRaw) || 0));
    const normalizedSpend = Math.floor(spend / (step * baseTier)) * step * baseTier;
    if (normalizedSpend <= 0) return "cancelled";

    const powerGain = Math.floor(normalizedSpend / (step * baseTier));
    const currentPower = this.actor.system.tracking?.powerStacks ?? 0;
    await this.actor.update({
      "system.divineKiPoints.value": Math.max(0, currentDKP - normalizedSpend),
      "system.tracking.powerStacks": currentPower + powerGain
    });
    await this._applyDivineKiSpendSideEffects(normalizedSpend, triggerData.name || "Divine Ki Power");
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${normalizedSpend}</b> Divine Ki Points and gained <b>${powerGain}</b> stack${powerGain === 1 ? "" : "s"} of Power.</div>`
    });
    return true;
  }

  async _handleDivineKiDamageCategoryTrigger(triggerData) {
    const desc = String(triggerData?.description || "");
    const match = desc.match(/spend\s+(\d+)\(bT\)\s+divine ki points to increase the damage category(?: of that attacking maneuver)? by 1 category/i);
    if (!match) return false;

    const baseTier = this.actor.system.baseTier || Math.ceil((this.actor.system.tier || 1) / 2);
    const spend = Number(match[1]) * baseTier;
    const currentDKP = this.actor.system.divineKiPoints?.value ?? 0;
    if (currentDKP < spend) {
      ui.notifications?.warn("Not enough Divine Ki Points to increase the Damage Category.");
      return "blocked";
    }

    await this.actor.update({ "system.divineKiPoints.value": Math.max(0, currentDKP - spend) });
    await this._applyDivineKiSpendSideEffects(spend, triggerData.name || "Divine Ki Damage Category");
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>Spent <b>${spend}</b> Divine Ki Points to increase the Damage Category by <b>1</b>.</div>`
    });
    return true;
  }

  async _onEnhancementPowerTrigger(event) {
    event.preventDefault();
    const triggerId = event.currentTarget.dataset.triggerId;
    const epBonuses = this.actor.system.enhancementPowerBonuses || {};
    let triggerData = null;
    for (const entry of (epBonuses.entries || [])) {
      const found = (entry.triggered || []).find(t => t.id === triggerId);
      if (found) { triggerData = { ...found, sourceName: entry.name, trackingId: `ep:${found.id}` }; break; }
    }
    if (!triggerData) return;

    if (triggerData.usageLimit || triggerData.maxUses) {
      const tracked = await this._trackCombatUsage(triggerData.trackingId, triggerData.usageLimit, triggerData.maxUses || 0);
      if (!tracked) return;
    }

    const handledJusticeConversion = await this._handleJusticeChargeKiConversion(triggerData);
    if (handledJusticeConversion === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledJusticeConversion) return;
    const handledLifeforceGain = await this._handleLifeforceGainTrigger(triggerData);
    if (handledLifeforceGain) return;
    const handledLifeforceSpend = await this._handleLifeforceSpendTrigger(triggerData);
    if (handledLifeforceSpend === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledLifeforceSpend) return;
    const handledBattleBornGain = await this._handleBattleBornGainTrigger(triggerData);
    if (handledBattleBornGain) return;
    const handledBattleBornSpend = await this._handleBattleBornSpendTrigger(triggerData);
    if (handledBattleBornSpend === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledBattleBornSpend) return;
    const handledKiSurging = await this._handleKiSurgingTrigger(triggerData);
    if (handledKiSurging === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledKiSurging) return;
    const handledPerfectPointManeuver = await this._handlePerfectPointManeuverTrigger(triggerData);
    if (handledPerfectPointManeuver === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledPerfectPointManeuver) return;

    const specialResources = foundry.utils.deepClone(this.actor.system.transformationMeta?.specialResources || {});
    const resourceChanged = this._applyJusticeChargeTriggerResource(specialResources, triggerData);
    if (resourceChanged) {
      await this.actor.update({ "system.transformationMeta.specialResources": specialResources });
    }

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-bolt"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>${triggerData.description}</div>`
    });
  }

  async _onAlternateFormTrigger(event) {
    event.preventDefault();
    const triggerId = event.currentTarget.dataset.triggerId;
    const afBonuses = this.actor.system.alternateFormBonuses || {};
    let triggerData = null;
    for (const entry of (afBonuses.entries || [])) {
      const found = (entry.triggered || []).find(t => t.id === triggerId);
      if (found) { triggerData = { ...found, sourceName: entry.name, trackingId: `af:${found.id}` }; break; }
    }
    if (!triggerData) return;

    if (triggerData.usageLimit || triggerData.maxUses) {
      const tracked = await this._trackCombatUsage(triggerData.trackingId, triggerData.usageLimit, triggerData.maxUses || 0);
      if (!tracked) return;
    }

    const handledLifeforceGain = await this._handleLifeforceGainTrigger(triggerData);
    if (handledLifeforceGain) return;
    const handledLifeforceSpend = await this._handleLifeforceSpendTrigger(triggerData);
    if (handledLifeforceSpend === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledLifeforceSpend) return;
    const handledPowerGain = await this._handlePowerGainTrigger(triggerData);
    if (handledPowerGain) return;
    const handledBattleBornGain = await this._handleBattleBornGainTrigger(triggerData);
    if (handledBattleBornGain === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledBattleBornGain) return;
    const handledBattleBornSpend = await this._handleBattleBornSpendTrigger(triggerData);
    if (handledBattleBornSpend === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledBattleBornSpend) return;
    const handledPerfectPointManeuver = await this._handlePerfectPointManeuverTrigger(triggerData);
    if (handledPerfectPointManeuver === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledPerfectPointManeuver) return;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-exchange-alt"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>${triggerData.description}</div>`
    });
  }

  async _onLegendaryFormTrigger(event) {
    event.preventDefault();
    const triggerId = event.currentTarget.dataset.triggerId;
    const lfBonuses = this.actor.system.legendaryFormBonuses || {};
    let triggerData = null;
    for (const entry of (lfBonuses.entries || [])) {
      const found = (entry.triggered || []).find(t => t.id === triggerId);
      if (found) { triggerData = { ...found, sourceName: entry.name, trackingId: `lf:${found.id}` }; break; }
    }
    if (!triggerData) return;

    const handledAdvantageSuperiorPrecheck = await this._handleAdvantagePointSuperiorTrigger({ ...triggerData, dryRun: true });
    if (handledAdvantageSuperiorPrecheck === "blocked") return;

    if (triggerData.usageLimit || triggerData.maxUses) {
      const tracked = await this._trackCombatUsage(triggerData.trackingId, triggerData.usageLimit, triggerData.maxUses || 0);
      if (!tracked) return;
    }

    const handledLifeforceGain = await this._handleLifeforceGainTrigger(triggerData);
    if (handledLifeforceGain) return;
    const handledLifeforceSpend = await this._handleLifeforceSpendTrigger(triggerData);
    if (handledLifeforceSpend === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledLifeforceSpend) return;
    const handledPowerGain = await this._handlePowerGainTrigger(triggerData);
    if (handledPowerGain) return;
    const handledBattleBornGain = await this._handleBattleBornGainTrigger(triggerData);
    if (handledBattleBornGain === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledBattleBornGain) return;
    const handledBattleBornSpend = await this._handleBattleBornSpendTrigger(triggerData);
    if (handledBattleBornSpend === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledBattleBornSpend) return;
    const handledAdvantageSuperior = await this._handleAdvantagePointSuperiorTrigger(triggerData);
    if (handledAdvantageSuperior) return;
    const handledAdvantageSignature = await this._handleAdvantagePointSignatureTrigger(triggerData);
    if (handledAdvantageSignature === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledAdvantageSignature) return;
    const handledDivineKiConversion = await this._handleDivineKiConversionTrigger(triggerData);
    if (handledDivineKiConversion === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledDivineKiConversion) return;
    const handledDivineKiRollBoost = await this._handleDivineKiRollBoostTrigger(triggerData);
    if (handledDivineKiRollBoost === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledDivineKiRollBoost) return;
    const handledDivineKiOOS = await this._handleDivineKiOOSTrigger(triggerData);
    if (handledDivineKiOOS === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledDivineKiOOS) return;
    const handledDivineKiHealingSurge = await this._handleDivineKiHealingSurgeTrigger(triggerData);
    if (handledDivineKiHealingSurge === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledDivineKiHealingSurge) return;
    const handledDivineKiState = await this._handleDivineKiStateTrigger(triggerData);
    if (handledDivineKiState === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledDivineKiState) return;
    const handledDivineKiManeuver = await this._handleDivineKiManeuverTrigger(triggerData);
    if (handledDivineKiManeuver === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledDivineKiManeuver) return;
    const handledDivineKiPowerLevelRecovery = await this._handleDivineKiPowerLevelRecoveryTrigger(triggerData);
    if (handledDivineKiPowerLevelRecovery) return;
    const handledDivineKiEnergyCharge = await this._handleDivineKiEnergyChargeTrigger(triggerData);
    if (handledDivineKiEnergyCharge === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledDivineKiEnergyCharge) return;
    const handledDivineKiDamageCategory = await this._handleDivineKiDamageCategoryTrigger(triggerData);
    if (handledDivineKiDamageCategory) return;
    const handledKiSurging = await this._handleKiSurgingTrigger(triggerData);
    if (handledKiSurging === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledKiSurging) return;
    const handledPerfectPointManeuver = await this._handlePerfectPointManeuverTrigger(triggerData);
    if (handledPerfectPointManeuver === "cancelled") {
      await this._undoCombatUsage(triggerData.trackingId, triggerData.usageLimit);
      return;
    }
    if (handledPerfectPointManeuver) return;
    const handledDivineKiRecovery = await this._applyDivineKiRecoveryTrigger(triggerData);
    if (handledDivineKiRecovery) return;

    const specialResources = foundry.utils.deepClone(this.actor.system.transformationMeta?.specialResources || {});
    let resourceChanged = false;
    const desc = String(triggerData.description || "");
    const sourceKey = String(triggerData.trackingId || "");
    if (/gain a stack of ego/i.test(desc)) {
      const current = specialResources.ego?.value ?? 0;
      const max = 6;
      const next = Math.min(max, current + 1);
      if (next > current) {
        specialResources.ego = {
          value: next,
          max,
          source: sourceKey,
          sourceName: triggerData.sourceName || "Ultra Ego"
        };
        resourceChanged = true;
      }
    }
    if (this._applyJusticeChargeTriggerResource(specialResources, triggerData)) {
      resourceChanged = true;
    }
    if (/gain 2 advantage points/i.test(desc)) {
      const current = specialResources.advantagePoints?.value ?? 0;
      const max = Math.max(specialResources.advantagePoints?.max ?? 0, 12);
      const next = Math.min(max, current + 2);
      if (next > current) {
        specialResources.advantagePoints = {
          value: next,
          max,
          source: sourceKey,
          sourceName: triggerData.sourceName || "Advantage Points"
        };
        resourceChanged = true;
      }
    } else if (/gain an advantage point/i.test(desc)) {
      const current = specialResources.advantagePoints?.value ?? 0;
      const max = Math.max(specialResources.advantagePoints?.max ?? 0, 12);
      const next = Math.min(max, current + 1);
      if (next > current) {
        specialResources.advantagePoints = {
          value: next,
          max,
          source: sourceKey,
          sourceName: triggerData.sourceName || "Advantage Points"
        };
        resourceChanged = true;
      }
    }
    if (resourceChanged) {
      await this.actor.update({ "system.transformationMeta.specialResources": specialResources });
    }

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="font-size:0.9rem"><b><i class="fas fa-crown"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>${triggerData.description}</div>`
    });
  }

  /**
   * Handle clicking a Talent triggered effect button in Combat tab.
   */
  async _onTalentTrigger(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const triggerId = btn.dataset.triggerId;

    // Special handling for Patient Fighter initiative transfer
    if (triggerId === "patient_fighter_transfer") {
      return this._onPatientFighterTransfer(event);
    }

    const tbBonuses = this.actor.system.talentBonuses || {};
    let triggerData = null;
    for (const entry of (tbBonuses.entries || [])) {
      const found = (entry.triggered || []).find(t => t.id === triggerId);
      if (found) { triggerData = { ...found, sourceName: entry.name, trackingId: `tb:${found.id}` }; break; }
    }
    if (!triggerData) return;

    if (triggerData.usageLimit || triggerData.maxUses) {
      const tracked = await this._trackCombatUsage(triggerData.trackingId, triggerData.usageLimit, triggerData.maxUses || 0);
      if (!tracked) return;
    }

    const flavor = `<div style="font-size:0.9rem">` +
      `<b><i class="fas fa-gem"></i> ${triggerData.name}</b> <small>(${triggerData.sourceName})</small><br>` +
      `${triggerData.description}</div>`;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: flavor
    });
  }

  /**
   * Handle Patient Fighter initiative transfer.
   * Opens dialog to select ally, transfers initiative from self to ally.
   */
  async _onPatientFighterTransfer(event) {
    const combat = game.combat;
    if (!combat) {
      ui.notifications.warn("No active combat encounter.");
      return;
    }
    const myCombatant = combat.combatants.find(c => c.actorId === this.actor.id);
    if (!myCombatant || myCombatant.initiative === null) {
      ui.notifications.warn("You must have rolled initiative first.");
      return;
    }

    const tier = this.actor.system.tier ?? 1;
    const transferAmount = tier;

    // Find allies (same disposition)
    const myDisp = myCombatant.token?.disposition ?? 1;
    const allies = combat.combatants.filter(c =>
      c.id !== myCombatant.id &&
      (c.token?.disposition ?? 1) === myDisp &&
      c.initiative !== null
    );

    if (allies.length === 0) {
      ui.notifications.warn("No allies with rolled initiative found.");
      return;
    }

    // Build dialog options
    const options = allies.map(a => `<option value="${a.id}">${a.name} (Init: ${a.initiative})</option>`).join("");
    const content = `
      <form>
        <div class="form-group">
          <label>Transfer ${transferAmount} Initiative to:</label>
          <select name="allyId">${options}</select>
        </div>
        <p style="color:#aaa;font-size:0.85em;">Your Initiative will decrease by ${transferAmount}.</p>
      </form>`;

    const result = await Dialog.wait({
      title: "Patient Fighter — Transfer Initiative",
      content,
      buttons: {
        transfer: { icon: '<i class="fas fa-exchange-alt"></i>', label: "Transfer", callback: (html) => html.find("[name=allyId]").val() },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => null }
      },
      default: "transfer",
      close: () => null
    }, { classes: ["dbu-old", "dialog"] });

    if (!result) return;

    const allyCombatant = combat.combatants.get(result);
    if (!allyCombatant) return;

    // Update initiatives
    await myCombatant.update({ initiative: myCombatant.initiative - transferAmount });
    await allyCombatant.update({ initiative: allyCombatant.initiative + transferAmount });

    // Post chat message
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<b>Patient Fighter</b> — Transferred ${transferAmount} Initiative to <b>${allyCombatant.name}</b>.`
    });
  }

  /**
   * Handle clicking a Talent stance shift button (Combat Expertise / Balanced Defender).
   */
  async _onTalentStanceShift(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const stanceId = btn.dataset.stance;
    const system = this.actor.system;
    const tier = system.tier ?? 1;
    const baseTier = system.baseTier || 1;
    const maxShift = 2 * baseTier;

    let title, dirOptions;
    if (stanceId === "combat_expertise") {
      title = "Combat Expertise — Shift Stance";
      dirOptions = `<option value="def_to_aw">Defense → Awareness</option>
        <option value="aw_to_def">Awareness → Defense</option>`;
    } else if (stanceId === "balanced_defender") {
      title = "Balanced Defender — Shift Defense";
      dirOptions = `<option value="def_to_soak">Defense → Soak</option>
        <option value="soak_to_def">Soak → Defense</option>`;
    } else return;

    const content = `<form>
      <div class="form-group"><label>Direction</label>
        <select name="direction">${dirOptions}</select></div>
      <div class="form-group"><label>Amount (0–${maxShift})</label>
        <input type="number" name="amount" value="0" min="0" max="${maxShift}" /></div>
    </form>`;

    const result = await Dialog.wait({
      title,
      content,
      buttons: {
        apply: { icon: '<i class="fas fa-check"></i>', label: "Apply", callback: html => {
          const direction = html.find("[name=direction]").val();
          const amount = Math.max(0, Math.min(maxShift, parseInt(html.find("[name=amount]").val()) || 0));
          return { direction, amount };
        }},
        reset: { icon: '<i class="fas fa-undo"></i>', label: "Reset", callback: () => ({ direction: null, amount: 0 }) }
      },
      default: "apply"
    });

    if (!result) return;

    const tempMods = foundry.utils.deepClone(system.combatTabState?.talentTempMods || {});
    if (result.amount === 0 || !result.direction) {
      delete tempMods[stanceId];
    } else {
      tempMods[stanceId] = { direction: result.direction, amount: result.amount };
    }
    await this.actor.update({ "system.combatTabState.talentTempMods": tempMods });

    // Post chat message
    if (result.amount > 0 && result.direction) {
      const dirLabel = result.direction.replace(/_/g, " ").replace(/to/g, "→");
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.85rem"><b><i class="fas fa-exchange-alt"></i> ${title}</b><br>Shift: ${dirLabel} (${result.amount})</div>`
      });
    }
  }

  async _onDamageCalcInput(event) {
    const field = event.currentTarget.dataset.field;
    if (!field) return;
    const val = event.currentTarget.type === "number"
      ? Number(event.currentTarget.value) || 0
      : event.currentTarget.value;
    await this.actor.update({ [`system.damageCalc.${field}`]: val });
  }

  async _onApplyDamage(event) {
    event.preventDefault();
    const system = this.actor.system;
    const dc = system.damageCalc;
    let damage = dc?.healthReduction || 0;
    if (damage <= 0) return;
    const baseTier = system.baseTier || 1;
    const specialResourcesAtStart = foundry.utils.deepClone(system.transformationMeta?.specialResources || {});
    const justiceContext = this._getJusticeChargeContext(system.transformations || []);
    let draconicForceSpent = false;
    let draconicForceReduction = 0;
    let draconicForceSource = "";
    let mightGuardTriggered = false;
    let mightGuardReduction = 0;
    let mightGuardSource = "";
    let smallHitNullified = false;
    let smallHitNullifyAmount = 0;
    let smallHitNullifySource = "";
    let perfectPointsSpent = 0;
    let perfectPointsReduction = 0;
    let sapAbsorbed = 0;
    let sapBefore = specialResourcesAtStart.spectralArmorPoints?.value ?? 0;
    let sapAfter = sapBefore;
    let sapSource = "";
    let sapExitTransformId = null;
    let sapRegenAmount = 0;
    let sapRegenSource = "";
    let divineKiGuardSpent = 0;
    let divineKiGuardReduction = 0;
    let divineKiGuardSource = "";
    let kiGuardSpent = 0;
    let kiGuardReduction = 0;
    let kiGuardRecoveredDKP = 0;
    let kiGuardSource = "";
    let natureKiSpent = 0;
    let natureKiReduction = 0;
    let plateSpent = false;
    let plateReduction = 0;
    let justiceChargeSpent = false;
    let justiceChargeReduction = 0;

    const perfectPointsAtStart = system.tracking?.perfectPoints ?? 0;
    if (perfectPointsAtStart >= 4) {
      const activeTransforms = system.transformations || [];
      let perfectGuardAvailable = false;
      for (const trans of activeTransforms) {
        if (!trans?.active) continue;
        const effects = this._getResolvedTransformationEffects(trans, activeTransforms);
        if (effects.some(e => /spend 1 counter action and all of your perfect points \(min\. 4\) to reduce the damage from that attacking maneuver to 0/i.test(String(e?.text || "")))) {
          perfectGuardAvailable = true;
          break;
        }
      }

      const quarterMaxLP = Math.ceil((system.lifePoints?.max ?? 0) / 4);
      if (perfectGuardAvailable && damage > 0 && damage < quarterMaxLP) {
        const canUsePerfectGuard = await this._trackCombatUsage("tf:auto_perfect_guard", "encounter", 1);
        if (canUsePerfectGuard) {
          const usePerfectGuard = await Dialog.wait({
            title: "Perfect Guard",
            content: `<p>Spend all Perfect Points (<b>${perfectPointsAtStart}</b>) to reduce this damage to <b>0</b>?</p>`,
            buttons: {
              yes: { label: "Use Perfect Points", callback: () => true },
              no: { label: "Skip", callback: () => false }
            },
            close: () => false
          });
          if (usePerfectGuard) {
            perfectPointsSpent = perfectPointsAtStart;
            perfectPointsReduction = damage;
            damage = 0;
          } else {
            await this._undoCombatUsage("tf:auto_perfect_guard", "encounter");
          }
        }
      }
    }

    if (!smallHitNullified && damage > 0) {
      const quarterMaxLP = Math.ceil((system.lifePoints?.max ?? 0) / 4);
      if (damage < quarterMaxLP) {
        const activeTransforms = system.transformations || [];
        let nullifyTransform = null;
        for (const trans of activeTransforms) {
          if (!trans?.active) continue;
          const effects = this._getResolvedTransformationEffects(trans, activeTransforms);
          const match = effects.find(e =>
            String(e?.usageLimit || "").toLowerCase() === "encounter" &&
            (e?.maxUses ?? 0) === 1 &&
            /if you are hit by an attacking maneuver that deals damage less than 1\/4 of your maximum life points, reduce the amount of damage you receive to 0/i.test(String(e?.text || ""))
          );
          if (match) {
            nullifyTransform = { trans, effect: match };
            break;
          }
        }

        if (nullifyTransform) {
          const trackingId = `tf:auto_small_hit_nullify:${nullifyTransform.trans.id ?? nullifyTransform.trans.catalogKey ?? "unknown"}`;
          const canUseNullify = await this._trackCombatUsage(trackingId, "encounter", 1);
          if (canUseNullify) {
            const useNullify = await Dialog.wait({
              title: "Burst Limit Guard",
              content: `<p>Use <b>${nullifyTransform.trans.name}</b> to reduce this damage to <b>0</b>?</p>`,
              buttons: {
                yes: { label: "Use Effect", callback: () => true },
                no: { label: "Skip", callback: () => false }
              },
              close: () => false
            });
            if (useNullify) {
              smallHitNullified = true;
              smallHitNullifyAmount = damage;
              smallHitNullifySource = nullifyTransform.trans.name || "Burst Limit Guard";
              damage = 0;
            } else {
              await this._undoCombatUsage(trackingId, "encounter");
            }
          }
        }
      }
    }

    if (damage > 0) {
      const activeTransforms = system.transformations || [];
      let mightGuardTransform = null;
      for (const trans of activeTransforms) {
        if (!trans?.active) continue;
        const effects = this._getResolvedTransformationEffects(trans, activeTransforms);
        const match = effects.find(e =>
          String(e?.usageLimit || "").toLowerCase() === "round" &&
          (e?.maxUses ?? 0) === 1 &&
          /if you are hit by an attacking maneuver, reduce the damage you would receive by your might/i.test(String(e?.text || ""))
        );
        if (match) {
          mightGuardTransform = { trans, effect: match };
          break;
        }
      }

      if (mightGuardTransform) {
        const trackingId = `tf:auto_might_guard:${mightGuardTransform.trans.id ?? mightGuardTransform.trans.catalogKey ?? "unknown"}`;
        const canUseMightGuard = await this._trackCombatUsage(trackingId, "round", 1);
        if (canUseMightGuard) {
          const might = system.status?.might ?? 0;
          const useMightGuard = await Dialog.wait({
            title: "Might Guard",
            content: `<p>Use <b>${mightGuardTransform.trans.name}</b> to reduce this damage by your Might (<b>${might}</b>)?</p>`,
            buttons: {
              yes: { label: "Use Effect", callback: () => true },
              no: { label: "Skip", callback: () => false }
            },
            close: () => false
          });
          if (useMightGuard) {
            mightGuardTriggered = true;
            mightGuardReduction = Math.min(damage, might);
            damage = Math.max(0, damage - mightGuardReduction);
            mightGuardSource = mightGuardTransform.trans.name || "Might Guard";
          } else {
            await this._undoCombatUsage(trackingId, "round");
          }
        }
      }
    }

    const currentDKPAtStart = system.divineKiPoints?.value ?? 0;
    if (currentDKPAtStart > 0) {
      const activeTransforms = system.transformations || [];
      let divineKiGuardEffect = null;
      for (const trans of activeTransforms) {
        if (!trans?.active) continue;
        const effects = this._getResolvedTransformationEffects(trans, activeTransforms);
        const match = effects.find(e => /if you receive damage from an opponent.?s attacking maneuver, you may spend 4\(bT\) divine ki points to reduce the damage you received by your might/i.test(String(e?.text || "")));
        if (match) {
          divineKiGuardEffect = { trans, effect: match };
          break;
        }
      }

      if (divineKiGuardEffect) {
        const spend = 4 * baseTier;
        if (currentDKPAtStart >= spend) {
          const might = system.status?.might ?? 0;
          const useDivineKiGuard = await Dialog.wait({
            title: "Divine Ki Guard",
            content: `<p>Spend <b>${spend}</b> Divine Ki Points to reduce this damage by your Might (<b>${might}</b>)?</p>`,
            buttons: {
              yes: { label: "Use Divine Ki", callback: () => true },
              no: { label: "Skip", callback: () => false }
            },
            close: () => false
          });
          if (useDivineKiGuard) {
            divineKiGuardSpent = spend;
            divineKiGuardReduction = Math.min(damage, might);
            damage = Math.max(0, damage - divineKiGuardReduction);
            divineKiGuardSource = divineKiGuardEffect.trans?.name || "Divine Ki Guard";
          }
        }
      }
    }

    const startingDraconicForce = specialResourcesAtStart.draconicForce?.value ?? 0;
    if (startingDraconicForce > 0) {
      const activeTransforms = system.transformations || [];
      let draconicGuardTransform = null;
      for (const trans of activeTransforms) {
        if (!trans?.active) continue;
        const effects = this._getResolvedTransformationEffects(trans, activeTransforms);
        if (effects.some(e => /spend a stack of draconic force to gain x\(bT\) damage reduction/i.test(String(e?.text || "")))) {
          draconicGuardTransform = trans;
          break;
        }
      }

      if (draconicGuardTransform) {
        const scaling = this._getTransformationScalingLevel(draconicGuardTransform, activeTransforms);
        const x = 2 + scaling;
        const reduction = x * baseTier;
        const useDraconicForce = await Dialog.wait({
          title: "Draconic Force Guard",
          content: `<p>Spend 1 Draconic Force to reduce this damage by <b>${reduction}</b>?</p>`,
          buttons: {
            yes: { label: "Use Draconic Force", callback: () => true },
            no: { label: "Skip", callback: () => false }
          },
          close: () => false
        });
        if (useDraconicForce) {
          draconicForceSpent = true;
          draconicForceReduction = Math.min(damage, reduction);
          damage = Math.max(0, damage - draconicForceReduction);
          draconicForceSource = draconicGuardTransform.name || "Draconic Force";
        }
      }
    }

    const currentKPAtStart = system.kiPool?.value ?? 0;
    if (currentKPAtStart > 0) {
      const activeTransforms = system.transformations || [];
      let kiGuardEffect = null;
      for (const trans of activeTransforms) {
        if (!trans?.active) continue;
        const effects = this._getResolvedTransformationEffects(trans, activeTransforms);
        const match = effects.find(e => /spend up to 8\(t\) ki points to reduce any damage you receive by an equal amount/i.test(String(e?.text || "")));
        if (match) {
          kiGuardEffect = { trans, effect: match };
          break;
        }
      }

      if (kiGuardEffect) {
        const tier = system.tier || 1;
        const maxSpend = Math.min(currentKPAtStart, 8 * tier, damage);
        if (maxSpend > 0) {
          const canUseKiGuard = await this._trackCombatUsage("tf:auto_ki_guard", "round", 1);
          if (canUseKiGuard) {
            const spendRaw = await Dialog.prompt({
              title: "Ki Guard",
              content: `<form><div class="form-group"><label>Ki Points to spend (max ${maxSpend})</label><input type="number" name="kpSpend" min="0" max="${maxSpend}" step="1" value="1" /></div></form>`,
              callback: (html) => Number(html.find("[name='kpSpend']").val()) || 0,
              rejectClose: false
            });
            const spend = Math.min(maxSpend, Math.max(0, Number(spendRaw) || 0));
            if (spend > 0) {
              kiGuardSpent = spend;
              kiGuardReduction = Math.min(damage, spend);
              damage = Math.max(0, damage - kiGuardReduction);
              if (damage === 0) {
                const currentDKP = system.divineKiPoints?.value ?? 0;
                const maxDKP = system.divineKiPoints?.max ?? 0;
                kiGuardRecoveredDKP = Math.min(maxDKP - currentDKP, Math.ceil(spend / 2));
              }
              kiGuardSource = kiGuardEffect.trans?.name || "Ki Guard";
            } else {
              await this._undoCombatUsage("tf:auto_ki_guard", "round");
            }
          }
        }
      }
    }

    const startingNatureKi = specialResourcesAtStart.natureKi?.value ?? 0;
    if (startingNatureKi > 0) {
      const activeTransforms = system.transformations || [];
      let natureKiGuardAvailable = false;
      for (const trans of activeTransforms) {
        if (!trans?.active) continue;
        const effects = this._getResolvedTransformationEffects(trans, activeTransforms);
        if (effects.some(e => /spend up to 5\(t\) nature ki to increase your soak value by an equal amount/i.test(String(e?.text || "")))) {
          natureKiGuardAvailable = true;
          break;
        }
      }

      if (natureKiGuardAvailable) {
        const canUseNatureKi = await this._trackCombatUsage("tf:auto_nature_ki_guard", "round", 1);
        if (canUseNatureKi) {
          const tier = system.tier || 1;
          const maxSpend = Math.min(startingNatureKi, 5 * tier);
          const spendRaw = await Dialog.prompt({
            title: "Nature Ki Guard",
            content: `<form><div class="form-group"><label>Nature Ki to spend (max ${maxSpend})</label><input type="number" name="nkSpend" min="0" max="${maxSpend}" step="1" value="1" /></div></form>`,
            callback: (html) => Number(html.find("[name='nkSpend']").val()) || 0,
            rejectClose: false
          });
          const spend = Math.min(maxSpend, Math.max(0, Number(spendRaw) || 0));
          if (spend > 0) {
            natureKiSpent = spend;
            natureKiReduction = Math.min(damage, spend);
            damage = Math.max(0, damage - natureKiReduction);
          } else {
            await this._undoCombatUsage("tf:auto_nature_ki_guard", "round");
          }
        }
      }
    }

    const startingPlates = specialResourcesAtStart.plates?.value ?? 0;
    if (startingPlates > 0) {
      const canUsePlate = await this._trackCombatUsage("tf:auto_plate_guard", "round", 1);
      if (canUsePlate) {
        const reduction = 6 * baseTier;
        const usePlate = await Dialog.wait({
          title: "Plate Guard",
          content: `<p>Spend 1 Plate to reduce this damage by <b>${reduction}</b>?</p>`,
          buttons: {
            yes: { label: "Use Plate", callback: () => true },
            no: { label: "Skip", callback: () => false }
          },
          close: () => false
        });
        if (usePlate) {
          plateSpent = true;
          plateReduction = Math.min(damage, reduction);
          damage = Math.max(0, damage - plateReduction);
        } else {
          await this._undoCombatUsage("tf:auto_plate_guard", "round");
        }
      }
    }

    const justiceCharges = justiceContext.active ? (specialResourcesAtStart.justiceCharge?.value ?? 0) : 0;
    if (justiceCharges > 0) {
      const canUseJusticeCharge = await this._trackCombatUsage("tf:auto_justice_charge_guard", "round", 1);
      if (canUseJusticeCharge) {
        const reduction = justiceCharges * baseTier;
        const useJusticeCharge = await Dialog.wait({
          title: "Justice Charge",
          content: `<p>Spend 1 Justice Charge to reduce this damage by <b>${reduction}</b>?</p>`,
          buttons: {
            yes: { label: "Use Charge", callback: () => true },
            no: { label: "Skip", callback: () => false }
          },
          close: () => false
        });
        if (useJusticeCharge) {
          justiceChargeSpent = true;
          justiceChargeReduction = Math.min(damage, reduction);
          damage = Math.max(0, damage - justiceChargeReduction);
        } else {
          const ctsUndo = foundry.utils.deepClone(this.actor.system.combatTabState || {});
          const etUndo = foundry.utils.deepClone(this.actor.system.effectTracking || {});
          if (ctsUndo.resourceUsage?.round?.["tf:auto_justice_charge_guard"]) {
            ctsUndo.resourceUsage.round["tf:auto_justice_charge_guard"] = Math.max(0, ctsUndo.resourceUsage.round["tf:auto_justice_charge_guard"] - 1);
            if (ctsUndo.resourceUsage.round["tf:auto_justice_charge_guard"] === 0) delete ctsUndo.resourceUsage.round["tf:auto_justice_charge_guard"];
          }
          if (etUndo.usedEffects?.round?.["tf:auto_justice_charge_guard"]) {
            etUndo.usedEffects.round["tf:auto_justice_charge_guard"] = Math.max(0, etUndo.usedEffects.round["tf:auto_justice_charge_guard"] - 1);
            if (etUndo.usedEffects.round["tf:auto_justice_charge_guard"] === 0) delete etUndo.usedEffects.round["tf:auto_justice_charge_guard"];
          }
          await this.actor.update({ "system.combatTabState": ctsUndo, "system.effectTracking": etUndo });
        }
      }
    }

    if (sapBefore > 0 && damage > 0) {
      const activeTransforms = system.transformations || [];
      let sapTransform = null;
      for (const trans of activeTransforms) {
        if (!trans?.active) continue;
        const effects = this._getResolvedTransformationEffects(trans, activeTransforms);
        if (effects.some(e => /reduce your sap instead of your life points/i.test(String(e?.text || "")))) {
          sapTransform = trans;
          break;
        }
      }

      if (sapTransform) {
        sapSource = sapTransform.name || "Spectral Armor";
        sapAbsorbed = Math.min(damage, sapBefore);
        sapAfter = Math.max(0, sapBefore - damage);
        damage = Math.max(0, damage - sapBefore);
        if (sapAfter === 0) {
          sapExitTransformId = sapTransform.id ?? null;
        } else {
          const effects = this._getResolvedTransformationEffects(sapTransform, activeTransforms);
          const hasSapRegen = effects.some(e => /each time you are hit by an attacking maneuver and receive damage, regain g\(t\) sap after that attacking maneuver is concluded/i.test(String(e?.text || "")));
          if (hasSapRegen) {
            const growth = this._getTransformationGrowthLevel(sapTransform, activeTransforms);
            sapRegenAmount = growth * (system.tier || 1);
            sapRegenSource = sapTransform.name || "Perfect Armor";
          }
        }
      }
    }

    const currentLP = system.lifePoints?.value ?? 0;
    let newLP = Math.max(0, currentLP - damage);
    let deadOrAliveUsed = false;
    let justiceChargesLostOnDefeat = 0;
    let defeatRecoveryLP = 0;
    let defeatRecoveryKP = 0;

    const justiceChargesRemaining = Math.max(0, justiceCharges - (justiceChargeSpent ? 1 : 0));
    if (newLP <= 0 && justiceChargesRemaining > 0) {
      const useDeadOrAlive = await Dialog.wait({
        title: "Dead or Alive",
        content: `<p>Use all remaining Justice Charges (${justiceChargesRemaining}) to avoid defeat?</p>`,
        buttons: {
          yes: { label: "Use Charges", callback: () => true },
          no: { label: "Stay Defeated", callback: () => false }
        },
        close: () => false
      });
      if (useDeadOrAlive) {
        deadOrAliveUsed = true;
        justiceChargesLostOnDefeat = justiceChargesRemaining;
        defeatRecoveryLP = 5 * baseTier * justiceChargesRemaining;
        defeatRecoveryKP = 5 * baseTier * justiceChargesRemaining;
        const maxLP = system.lifePoints?.max ?? 0;
        newLP = Math.min(maxLP, 1 + defeatRecoveryLP);
      }
    }

    // --- Threshold crossing detection for Break Value ---
    const thresholdValues = [
      { name: "Bruised", value: system.thresholds?.bruised?.value ?? 0 },
      { name: "Injured", value: system.thresholds?.injured?.value ?? 0 },
      { name: "Critical", value: system.thresholds?.critical?.value ?? 0 }
    ];
    let thresholdsCrossed = 0;
    const crossedNames = [];
    for (const t of thresholdValues) {
      if (currentLP > t.value && newLP <= t.value) {
        thresholdsCrossed++;
        crossedNames.push(t.name);
      }
    }

    // Reduce top layer apparel Break Value if thresholds were crossed
    let breakReduction = 0;
    if (thresholdsCrossed > 0) {
      const topLayerId = system.wornApparelSlots?.topLayer;
      if (topLayerId) {
        const topItem = this.actor.items.get(topLayerId);
        if (topItem && (topItem.system.breakValueCurrent ?? 0) > 0) {
          const oldBV = topItem.system.breakValueCurrent;
          const newBV = Math.max(0, oldBV - thresholdsCrossed);
          breakReduction = oldBV - newBV;
          const bvMax = this._calcBreakValueMax(topItem);
          await topItem.update({ "system.breakValueCurrent": newBV });

          const broken = newBV === 0;
          const flavor = `<div style="font-size:0.9rem">` +
            `<b><i class="fas fa-shield-alt"></i> Break Value Reduced!</b><br>` +
            `<b>${topItem.name}</b> — crossed ${crossedNames.join(", ")}<br>` +
            `BV: ${oldBV} → <b>${newBV}</b> / ${bvMax}` +
            (broken ? `<br><span style="color:#e53935;font-weight:bold">BROKEN!</span>` : "") +
            `</div>`;
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: flavor
          });
        }
      }
    }

    // Structured log entry
    const cts = foundry.utils.deepClone(system.combatTabState || {});
    if (!cts.damageLog) cts.damageLog = [];
    const source = dc?.source || "wound";
    const category = dc?.category || "standard";
    cts.damageLog.push({
      round: cts.currentRound || 1,
      type: source === "wound" ? category : source,
      finalDamage: -damage,
      lpBefore: currentLP,
      lpAfter: newLP,
      sapBefore: sapAbsorbed > 0 ? sapBefore : undefined,
      sapAfter: sapAbsorbed > 0 ? sapAfter : undefined,
      steadfastResults: [],
      breakReduction: breakReduction > 0 ? breakReduction : undefined,
      thresholdsCrossed: crossedNames.length > 0 ? crossedNames : undefined
    });

    const updates = {
      "system.lifePoints.value": newLP,
      "system.combatTabState.damageLog": cts.damageLog
    };

    if (perfectPointsSpent > 0) {
      updates["system.tracking.perfectPoints"] = 0;
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-circle"></i> Perfect Guard</b><br>Spent <b>${perfectPointsSpent}</b> Perfect Points<br>Reduced damage by <b>${perfectPointsReduction}</b> to <b>0</b></div>`
      });
    }
    if (smallHitNullified) {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-shield-alt"></i> ${smallHitNullifySource}</b><br>Reduced damage by <b>${smallHitNullifyAmount}</b> to <b>0</b></div>`
      });
    }
    if (mightGuardTriggered) {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-fist-raised"></i> ${mightGuardSource}</b><br>Reduced damage by <b>${mightGuardReduction}</b> through Might.</div>`
      });
    }
    if (sapAbsorbed > 0) {
      const specialResources = foundry.utils.deepClone(updates["system.transformationMeta.specialResources"] || this.actor.system.transformationMeta?.specialResources || {});
      const sapMax = specialResources.spectralArmorPoints?.max ?? sapBefore;
      const sapFinal = sapRegenAmount > 0 ? Math.min(sapMax, sapAfter + sapRegenAmount) : sapAfter;
      specialResources.spectralArmorPoints = {
        ...(specialResources.spectralArmorPoints || {}),
        value: sapFinal
      };
      updates["system.transformationMeta.specialResources"] = specialResources;
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-shield-alt"></i> ${sapSource}</b><br>Absorbed <b>${sapAbsorbed}</b> damage with SAP<br>SAP: <b>${sapBefore}</b> → <b>${sapFinal}</b>${sapRegenAmount > 0 ? `<br>${sapRegenSource}: +<b>${Math.max(0, sapFinal - sapAfter)}</b> SAP` : ""}${sapAfter === 0 ? `<br>Transformation will exit.` : ""}</div>`
      });
    }
    if (draconicForceSpent) {
      const specialResources = foundry.utils.deepClone(updates["system.transformationMeta.specialResources"] || this.actor.system.transformationMeta?.specialResources || {});
      const currentDraconicForce = specialResources.draconicForce?.value ?? 0;
      if (currentDraconicForce > 0) {
        specialResources.draconicForce = {
          ...(specialResources.draconicForce || {}),
          value: Math.max(0, currentDraconicForce - 1)
        };
        updates["system.transformationMeta.specialResources"] = specialResources;
      }
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-dragon"></i> ${draconicForceSource}</b><br>Spent <b>1</b> Draconic Force<br>Reduced damage by <b>${draconicForceReduction}</b></div>`
      });
    }
    if (kiGuardSpent > 0) {
      const currentKP = updates["system.kiPool.value"] ?? (system.kiPool?.value ?? 0);
      updates["system.kiPool.value"] = Math.max(0, currentKP - kiGuardSpent);
      if (kiGuardRecoveredDKP > 0) {
        const currentDKP = updates["system.divineKiPoints.value"] ?? (system.divineKiPoints?.value ?? 0);
        updates["system.divineKiPoints.value"] = currentDKP + kiGuardRecoveredDKP;
      }
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-bolt"></i> ${kiGuardSource}</b><br>Spent <b>${kiGuardSpent}</b> Ki Points<br>Reduced damage by <b>${kiGuardReduction}</b>${kiGuardRecoveredDKP > 0 ? `<br>Regained <b>${kiGuardRecoveredDKP}</b> Divine Ki Points` : ""}</div>`
      });
    }
    if (natureKiSpent > 0) {
      const specialResources = foundry.utils.deepClone(updates["system.transformationMeta.specialResources"] || this.actor.system.transformationMeta?.specialResources || {});
      const currentNatureKi = specialResources.natureKi?.value ?? 0;
      if (currentNatureKi > 0) {
        specialResources.natureKi = {
          ...(specialResources.natureKi || {}),
          value: Math.max(0, currentNatureKi - natureKiSpent)
        };
        updates["system.transformationMeta.specialResources"] = specialResources;
      }
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-leaf"></i> Nature Ki Guard</b><br>Spent <b>${natureKiSpent}</b> Nature Ki<br>Reduced damage by <b>${natureKiReduction}</b></div>`
      });
    }
    if (divineKiGuardSpent > 0) {
      const currentDKP = updates["system.divineKiPoints.value"] ?? (system.divineKiPoints?.value ?? 0);
      updates["system.divineKiPoints.value"] = Math.max(0, currentDKP - divineKiGuardSpent);
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-sun"></i> ${divineKiGuardSource}</b><br>Spent <b>${divineKiGuardSpent}</b> Divine Ki Points<br>Reduced damage by <b>${divineKiGuardReduction}</b></div>`
      });
    }
    if (plateSpent) {
      const specialResources = foundry.utils.deepClone(updates["system.transformationMeta.specialResources"] || this.actor.system.transformationMeta?.specialResources || {});
      const currentPlates = specialResources.plates?.value ?? 0;
      if (currentPlates > 0) {
        specialResources.plates = {
          ...(specialResources.plates || {}),
          value: Math.max(0, currentPlates - 1)
        };
        updates["system.transformationMeta.specialResources"] = specialResources;
      }
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-shield-alt"></i> Plates</b><br>Reduced damage by <b>${plateReduction}</b><br>Lost <b>1</b> Plate</div>`
      });
    }
    if (justiceChargeSpent) {
      const specialResources = foundry.utils.deepClone(updates["system.transformationMeta.specialResources"] || this.actor.system.transformationMeta?.specialResources || {});
      const currentCharges = specialResources.justiceCharge?.value ?? 0;
      if (currentCharges > 0) {
        specialResources.justiceCharge = {
          ...(specialResources.justiceCharge || {}),
          max: Math.max(specialResources.justiceCharge?.max ?? 0, justiceContext.max),
          value: Math.max(0, currentCharges - 1)
        };
        updates["system.transformationMeta.specialResources"] = specialResources;
      }
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-shield-alt"></i> Justice Charge</b><br>Reduced damage by <b>${justiceChargeReduction}</b><br>Lost <b>1</b> Justice Charge</div>`
      });
    }
    if (deadOrAliveUsed) {
      const specialResources = foundry.utils.deepClone(updates["system.transformationMeta.specialResources"] || this.actor.system.transformationMeta?.specialResources || {});
      specialResources.justiceCharge = {
        ...(specialResources.justiceCharge || {}),
        max: Math.max(specialResources.justiceCharge?.max ?? 0, justiceContext.max),
        value: 0
      };
      updates["system.transformationMeta.specialResources"] = specialResources;
      const currentKP = updates["system.kiPool.value"] ?? (system.kiPool?.value ?? 0);
      const maxKP = system.kiPool?.max ?? 0;
      updates["system.kiPool.value"] = Math.min(maxKP, currentKP + defeatRecoveryKP);
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="font-size:0.9rem"><b><i class="fas fa-heartbeat"></i> Dead or Alive</b><br>` +
          `Avoided defeat with <b>${justiceChargesLostOnDefeat}</b> Justice Charges` +
          `<br>LP set to <b>${newLP}</b>` +
          `<br>Regained <b>${Math.max(0, newLP - 1)}</b> LP and <b>${defeatRecoveryKP}</b> KP</div>`
      });
    }

    const activeUltraEgo = (system.transformations || []).find(t => t?.active && t.catalogKey === "ultra_ego");
    if (activeUltraEgo) {
      const specialResources = foundry.utils.deepClone(updates["system.transformationMeta.specialResources"] || system.transformationMeta?.specialResources || {});
      const tracked = await this._trackCombatUsage("lf:auto_ultra_ego_ego_on_hit", "round", 2);
      if (tracked) {
        const currentEgo = specialResources.ego?.value ?? 0;
        const nextEgo = Math.min(6, currentEgo + 1);
        if (nextEgo > currentEgo) {
          specialResources.ego = {
            value: nextEgo,
            max: 6,
            source: "lf:auto_ultra_ego_ego_on_hit",
            sourceName: activeUltraEgo.name || "Ultra Ego"
          };
        }
      }

      const kpGain = Math.ceil(damage / 2);
      const currentKP = system.kiPool?.value ?? 0;
      const maxKP = system.kiPool?.max ?? 0;
      const newKP = Math.min(maxKP, currentKP + kpGain);
      updates["system.kiPool.value"] = newKP;
      updates["system.transformationMeta.specialResources"] = specialResources;

      const flavor = `<div style="font-size:0.9rem"><b><i class="fas fa-crown"></i> Ultra Ego</b><br>` +
        `Received <b>${damage}</b> damage` +
        (tracked ? `<br>+1 Ego` : `<br>Ego gain already capped this round`) +
        `<br>Regained <b>${newKP - currentKP}</b> KP</div>`;
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: flavor
      });
    }

    // --- One-Sided Fusion: damage sharing (Possession) + threshold auto-eject (Absorption) ---
    const fusion = system.fusion || {};
    if (fusion.isFusion && damage > 0) {
      // Possession: share damage with host
      if (fusion.type === "one-sided-possession" && fusion.hostCurrentLP != null) {
        const hostLP = fusion.hostCurrentLP ?? 0;
        const newHostLP = Math.max(0, hostLP - damage);
        updates["system.fusion.hostCurrentLP"] = newHostLP;
        const hostId = (fusion.suppressedCharacterIds || [])[0];
        const hostActor = game.actors?.get(hostId);
        const hostName = hostActor?.name || "Host";
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `<div style="border-left:3px solid #9b59b6; padding:4px 8px;">
            <b>Possession — Damage Shared</b><br>
            ${this.actor.name} took <b>${damage}</b> damage. ${hostName}'s body also takes <b>${damage}</b> damage.<br>
            ${hostName}'s LP: ${hostLP} → <b>${newHostLP}</b>
            ${newHostLP <= 0 ? `<br><em style="color:#e74c3c;">⚠ ${hostName}'s body has reached 0 LP!</em>` : ""}
          </div>`
        });
        if (newHostLP <= 0) {
          setTimeout(() => {
            new Dialog({
              title: "Host Body Defeated",
              content: `<p><b>${hostName}</b>'s body has reached 0 LP while possessed by <b>${this.actor.name}</b>.</p><p>Choose what happens:</p>`,
              buttons: {
                defeated: {
                  icon: '<i class="fas fa-skull"></i>', label: "Be Defeated",
                  callback: async () => {
                    await this.actor.update({ "system.lifePoints.value": 0 });
                    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: `<b>${this.actor.name}</b> is defeated along with the host body.` });
                  }
                },
                endPossession: {
                  icon: '<i class="fas fa-sign-out-alt"></i>', label: "End Possession",
                  callback: async () => {
                    const sIds = this.actor.system.fusion?.suppressedCharacterIds || [];
                    if (sIds.length > 0) await this._onEjectSuppressed({ actorId: sIds[0] });
                  }
                }
              }, default: "endPossession"
            }).render(true);
          }, 200);
        }
      }
      // Absorption: track threshold crossings for auto-eject
      if (fusion.type === "one-sided-absorption" && thresholdsCrossed > 0) {
        updates["system.fusion.encounterThresholdsCrossed"] =
          (fusion.encounterThresholdsCrossed || 0) + thresholdsCrossed;
        // Non-Majin + knocked through 2+ thresholds BY A SINGLE ATTACK = auto-eject (rules line 39)
        const race = system.race || "";
        if (race !== "majin" && thresholdsCrossed >= 2) {
          const suppIds = fusion.suppressedCharacterIds || [];
          if (suppIds.length > 0) {
            const lastAbsorbed = suppIds[suppIds.length - 1];
            const deepIds = fusion.deeplySuppressed || [];
            const wasDeep = deepIds.includes(lastAbsorbed);
            setTimeout(() => {
              this._onEjectSuppressed({ actorId: lastAbsorbed, silent: true, skipSlowed: true });
              const ejectedActor = game.actors?.get(lastAbsorbed);
              const ejectedName = ejectedActor?.name || "Character";
              ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: `<div style="border-left:3px solid #e74c3c; padding:4px 8px;">
                  <b>Health Threshold Auto-Eject</b><br>
                  ${this.actor.name} was knocked through ${thresholdsCrossed} health thresholds in a single attack!<br>
                  <b>${ejectedName}</b> (most recently absorbed) is automatically freed.
                  ${wasDeep ? `<br><em>${ejectedName} was Deeply Suppressed — they awaken in a <b>Sleeping</b> state.</em>` : ""}
                </div>`
              });
            }, 100);
          }
        }
      }
    }

    await this.actor.update(updates);
    if (sapExitTransformId) {
      const transformations = foundry.utils.deepClone(this.actor.system.transformations || []);
      const idx = transformations.findIndex(t => t?.id === sapExitTransformId);
      if (idx >= 0 && transformations[idx]?.active) {
        transformations[idx].active = false;
        await this.actor.update({ "system.transformations": transformations });
        await this._syncPersistentTransformationCombatStates(transformations);
        await this._syncPersistentTransformationResources(transformations);
        await this._syncPersistentTransformationFlags(transformations);
      }
    }
    if (divineKiGuardSpent > 0) {
      await this._applyDivineKiSpendSideEffects(divineKiGuardSpent, divineKiGuardSource || "Divine Ki Guard");
    }
  }

  async _onApplyHeal(event) {
    event.preventDefault();
    const dc = this.actor.system.damageCalc;
    const heal = dc?.woundRoll || 0;
    if (heal <= 0) return;
    const currentLP = this.actor.system.lifePoints?.value ?? 0;
    const maxLP = this.actor.system.lifePoints?.max || 0;
    const newLP = Math.min(maxLP, currentLP + heal);

    // Structured log entry
    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    if (!cts.damageLog) cts.damageLog = [];
    cts.damageLog.push({
      round: cts.currentRound || 1,
      type: "heal",
      finalDamage: heal,
      lpBefore: currentLP,
      lpAfter: newLP,
      steadfastResults: []
    });

    await this.actor.update({
      "system.lifePoints.value": newLP,
      "system.combatTabState": cts
    });
  }

  async _onThresholdCheck(event) {
    const el = event.currentTarget;
    const name = el.name; // e.g. "system.thresholds.bruised.checked"
    await this.actor.update({ [name]: el.checked });
  }

  async _onConditionToggle(event) {
    const conditionId = event.currentTarget.dataset.conditionId;
    const conditions = foundry.utils.deepClone(this.actor.system.conditions || []);
    let cond = conditions.find(c => c.id === conditionId);
    if (cond) {
      cond.active = event.currentTarget.checked;
      if (!cond.active) cond.stacks = 0;
    } else {
      conditions.push({ id: conditionId, active: event.currentTarget.checked, stacks: 0 });
    }
    await this.actor.update({ "system.conditions": conditions });
  }

  async _onConditionStack(event) {
    const conditionId = event.currentTarget.dataset.conditionId;
    const conditions = foundry.utils.deepClone(this.actor.system.conditions || []);
    let rawStacks = Number(event.currentTarget.value) || 0;
    // Enforce maxStacks from condition definition
    const condDefs = this._getCombatConditions(this.actor.system);
    const def = condDefs.find(d => d.id === conditionId);
    if (def?.maxStacks) rawStacks = Math.min(rawStacks, def.maxStacks);
    rawStacks = Math.max(0, rawStacks);
    let cond = conditions.find(c => c.id === conditionId);
    if (cond) {
      cond.stacks = rawStacks;
    } else {
      conditions.push({ id: conditionId, active: true, stacks: rawStacks });
    }
    await this.actor.update({ "system.conditions": conditions });
  }

  async _onTrackerAddAction(event) {
    event.preventDefault();
    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    if (!cts.rounds) cts.rounds = [{ roundNumber: 1, actions: [] }];
    if (cts.rounds.length === 0) cts.rounds.push({ roundNumber: 1, actions: [] });
    const lastRound = cts.rounds[cts.rounds.length - 1];
    lastRound.actions.push({ type: "standard", source: "", kiCost: 0, dkpCost: 0, kiWager: 0, description: "" });
    await this.actor.update({ "system.combatTabState": cts });
  }

  async _onTrackerNextRound(event) {
    event.preventDefault();
    return this._onCombatNewRound(event);
  }

  async _onTrackerReset(event) {
    event.preventDefault();
    return this._onCombatNewEncounter(event);
  }

  async _onDeleteTrackerAction(event) {
    event.preventDefault();
    const actionIndex = Number(event.currentTarget.dataset.actionIndex);
    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    if (!cts.rounds?.length) return;
    const lastRound = cts.rounds[cts.rounds.length - 1];
    if (actionIndex >= 0 && actionIndex < lastRound.actions.length) {
      const deleted = lastRound.actions.splice(actionIndex, 1)[0];
      const updates = { "system.combatTabState": cts };
      // Refund KP / DKP / capacity that the deleted action consumed
      const refundKi  = deleted.kiCost  || 0;
      const refundDkp = deleted.dkpCost || 0;
      if (refundKi > 0) {
        const cur = this.actor.system.kiPool?.value ?? 0;
        const max = this.actor.system.kiPool?.max ?? 0;
        updates["system.kiPool.value"] = Math.min(max, cur + refundKi);
      }
      if (refundDkp > 0) {
        const cur = this.actor.system.divineKiPoints?.value ?? 0;
        const max = this.actor.system.divineKiPoints?.max ?? 0;
        updates["system.divineKiPoints.value"] = Math.min(max, cur + refundDkp);
      }
      if (refundKi > 0 || refundDkp > 0) {
        const capRefund = refundKi + Math.ceil(refundDkp / 2);
        const curCap = this.actor.system.status?.capacitySpent ?? 0;
        updates["system.status.capacitySpent"] = Math.max(0, curCap - capRefund);
      }
      // Recalculate power stacks if a power-up was deleted
      if (deleted.type === "power-up") {
        const currentRound = cts.currentRound || cts.rounds.length;
        let activePowerUps = 0;
        for (const r of cts.rounds) {
          if (r.roundNumber >= currentRound - 1) {
            for (const a of (r.actions || [])) {
              if (a.type === "power-up") activePowerUps++;
            }
          }
        }
        updates["system.tracking.powerStacks"] = activePowerUps;
      }
      await this.actor.update(updates);
    }
  }

  async _onTrackerActionChange(event) {
    const el = event.currentTarget;
    const roundNum = Number(el.dataset.round);
    const actionIndex = Number(el.dataset.actionIndex);
    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    if (!cts.rounds?.length) return;
    const round = cts.rounds.find(r => r.roundNumber === roundNum);
    if (!round?.actions?.[actionIndex]) return;
    const action = round.actions[actionIndex];
    const wasTypeChange = el.classList.contains("action-type");

    // Capture previous values to compute delta when KI/DKP changes (so we can
    // auto-deduct from pools and adjust capacitySpent accordingly).
    const prevKi  = action.kiCost  || 0;
    const prevDkp = action.dkpCost || 0;

    if (wasTypeChange) {
      action.type = el.value;
      // Clear source data when switching away from "attack" type
      if (el.value !== "attack") {
        action.source = "";
      }
    }
    else if (el.classList.contains("action-ki")) action.kiCost = Number(el.value) || 0;
    else if (el.classList.contains("action-dkp")) action.dkpCost = Number(el.value) || 0;
    else if (el.classList.contains("action-desc")) action.description = el.value;
    const updates = { "system.combatTabState": cts };

    // Auto-deduct KP / DKP from pools and update capacitySpent.
    // Full Capacity Rate for KP, half (rounded up) for DKP per god-ki.txt:22.
    const deltaKi  = (action.kiCost  || 0) - prevKi;
    const deltaDkp = (action.dkpCost || 0) - prevDkp;
    if (deltaKi !== 0) {
      const curKi = this.actor.system.kiPool?.value ?? 0;
      updates["system.kiPool.value"] = Math.max(0, curKi - deltaKi);
    }
    if (deltaDkp !== 0) {
      const curDkp = this.actor.system.divineKiPoints?.value ?? 0;
      updates["system.divineKiPoints.value"] = Math.max(0, curDkp - deltaDkp);
    }
    if (deltaKi !== 0 || deltaDkp !== 0) {
      const capDelta = deltaKi + (deltaDkp > 0 ? Math.ceil(deltaDkp / 2) : -Math.ceil(-deltaDkp / 2));
      const curCap = this.actor.system.status?.capacitySpent ?? 0;
      updates["system.status.capacitySpent"] = Math.max(0, curCap + capDelta);
    }
    // Recalculate power stacks when action type changes
    if (wasTypeChange) {
      const currentRound = cts.currentRound || cts.rounds.length;
      let activePowerUps = 0;
      for (const r of cts.rounds) {
        if (r.roundNumber >= currentRound - 1) {
          for (const a of (r.actions || [])) {
            if (a.type === "power-up") activePowerUps++;
          }
        }
      }
      updates["system.tracking.powerStacks"] = activePowerUps;
    }
    await this.actor.update(updates);
  }

  /**
   * Handle clicking an activable in the Round Tracker sidebar.
   * Consumes the resource (reuses unified-action logic) AND adds an action entry to the active round.
   */
  async _onRtActivableUse(event) {
    event.preventDefault();
    const button = event.currentTarget;
    if (button.disabled) return;

    // 1. Consume the resource by reusing the unified-action flow.
    //    The button already carries the same dataset attrs _onUnifiedAction expects
    //    (data-action-type, data-trigger-id, data-stance, data-effect-id, data-limit, data-max-uses).
    await this._onUnifiedAction({
      preventDefault: () => {},
      currentTarget: button
    });

    // 2. Add an action entry to the current (last) round in the tracker.
    const sourceName = button.dataset.sourceName || "Ability";
    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    if (!cts.rounds) cts.rounds = [{ roundNumber: 1, actions: [] }];
    if (cts.rounds.length === 0) cts.rounds.push({ roundNumber: 1, actions: [] });
    const lastRound = cts.rounds[cts.rounds.length - 1];
    lastRound.actions.push({
      type: "standard",
      source: "",
      kiCost: 0,
      kiWager: 0,
      description: sourceName
    });
    await this.actor.update({ "system.combatTabState": cts });
  }

  /**
   * Populate tracker attack-source dropdowns with optgroups from stored data.
   */
  _populateTrackerSources(html) {
    const groups = this._trackerSourceGroups || [];
    html.find(".action-source").each((i, el) => {
      const currentSource = el.dataset.currentSource || "";
      // Build optgroup HTML
      let optionsHTML = '<option value="">-- Select --</option>';
      for (const g of groups) {
        optionsHTML += `<optgroup label="${g.label}">`;
        for (const s of g.sources) {
          const sel = s.key === currentSource ? " selected" : "";
          const kiLabel = s.kiCost > 0 ? ` (${s.kiCost} KP)` : "";
          optionsHTML += `<option value="${s.key}" data-ki="${s.kiCost}" data-name="${s.name}"${sel}>${s.name}${kiLabel}</option>`;
        }
        optionsHTML += "</optgroup>";
      }
      el.innerHTML = optionsHTML;
    });
  }

  /**
   * Handle tracker attack-source selection: auto-fill Ki cost and description.
   */
  async _onTrackerSourceChange(event) {
    const el = event.currentTarget;
    const roundNum = Number(el.dataset.round);
    const actionIndex = Number(el.dataset.actionIndex);
    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    if (!cts.rounds?.length) return;
    const round = cts.rounds.find(r => r.roundNumber === roundNum);
    if (!round?.actions?.[actionIndex]) return;
    const action = round.actions[actionIndex];
    const sourceKey = el.value;
    action.source = sourceKey;
    // Auto-fill from selected option data attributes
    const option = el.selectedOptions?.[0];
    if (option && sourceKey) {
      action.kiCost = Number(option.dataset.ki) || 0;
      action.description = option.dataset.name || "";
    } else {
      action.kiCost = 0;
      action.description = "";
    }
    await this.actor.update({ "system.combatTabState": cts });
  }

  _onCombatFilter(event) {
    // Client-side filter - toggle visibility of resource items by type
    const filterType = event.currentTarget.dataset.filter;
    const checked = event.currentTarget.checked;
    const container = event.currentTarget.closest(".combat-panel-resources, .combat-panel, .tb-tab-content, .rt-activables");
    if (!container) return;
    // Target both resource items and RT activable items
    const items = container.querySelectorAll(`.combat-resource-item.type-${filterType}, .rt-activable.type-${filterType}`);
    for (const item of items) {
      item.style.display = checked ? "" : "none";
    }
  }

  async _onTogglePerfectKi(event) {
    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    cts.perfectKiControl = event.currentTarget.checked;
    await this.actor.update({ "system.combatTabState": cts });
  }

  async _onClearDamageLog(event) {
    event.preventDefault();
    const cts = foundry.utils.deepClone(this.actor.system.combatTabState || {});
    cts.damageLog = [];
    await this.actor.update({ "system.combatTabState": cts });
  }

  // Item CRUD (Equipment)
  // -------------------------------------------------------

  async _onItemCreate(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const type = element.dataset.type || "equipment";
    const eqType = element.dataset.eqType || "apparel";
    const name = `New ${eqType}`;
    return this.actor.createEmbeddedDocuments("Item", [{ name, type, system: { equipmentType: eqType } }]);
  }

  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest("[data-item-id]");
    const item = this.actor.items.get(li?.dataset.itemId);
    if (item) item.sheet.render(true);
  }

  async _onItemDelete(event) {
    event.preventDefault();
    const li = event.currentTarget.closest("[data-item-id]");
    const item = this.actor.items.get(li?.dataset.itemId);
    if (!item) return;
    const confirmed = await Dialog.confirm({
      title: `Delete ${item.name}`,
      content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`,
      defaultYes: false
    });
    if (confirmed) return item.delete();
  }

  // -------------------------------------------------------
  // Attack Ref CRUD
  // -------------------------------------------------------

  async _onAddAttackRef(event) {
    event.preventDefault();
    const refs = foundry.utils.deepClone(this.actor.system.attackRefs || []);
    const nextId = refs.length > 0 ? Math.max(...refs.map(r => r.id || 0)) + 1 : 1;
    refs.push({
      id: nextId,
      name: "Attack Reference",
      foundation: "Physical",
      profile: "Simple",
      extraProfile: "",
      targetRange: 0,
      inMelee: true,
      energyCharges: 0,
      kiWager: 0,
      powerShot: 0,
      miscStrike: "",
      miscWound: "",
      miscDodge: "",
      miscBonuses: "",
      weaponEquipped: "",
      weaponCheckbox: false,
      offHand: "",
      offHandCheckbox: false,
      description: ""
    });
    await this.actor.update({ "system.attackRefs": refs });
  }

  async _onRemoveAttackRef(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const refs = foundry.utils.deepClone(this.actor.system.attackRefs || []);
    refs.splice(index, 1);
    await this.actor.update({ "system.attackRefs": refs });
  }

  // -------------------------------------------------------
  // Fusion Handlers
  // -------------------------------------------------------

  async _onAddFusedCharacter(event) {
    event.preventDefault();
    const fusion = this.actor.system.fusion || {};
    const currentIds = fusion.type === "fission"
      ? [fusion.originCharacterId, fusion.linkedSplitId].filter(Boolean)
      : [...(fusion.fusedCharacterIds || []), ...(fusion.suppressedCharacterIds || [])];

    // Build actor options excluding self and already-linked
    const selfId = this.actor.id;
    const options = game.actors
      .filter(a => a.type === "character" && a.id !== selfId && !currentIds.includes(a.id))
      .map(a => `<option value="${a.id}">${a.name} (Lv${a.system?.level || 1} ${a.system?.race || ""})</option>`)
      .join("");

    if (!options) {
      ui.notifications.warn("No available character actors to link.");
      return;
    }

    const content = `<form><div class="form-group"><label>Select Character</label><select name="actorId">${options}</select></div></form>`;

    new Dialog({
      title: "Link Fused Character",
      content,
      buttons: {
        add: {
          icon: '<i class="fas fa-link"></i>',
          label: "Link",
          callback: async (html) => {
            const actorId = html.find("[name=actorId]").val();
            if (!actorId) return;

            if (fusion.type === "fission") {
              // For fission: set origin or linked split
              if (!fusion.originCharacterId) {
                await this.actor.update({ "system.fusion.originCharacterId": actorId });
              } else {
                await this.actor.update({ "system.fusion.linkedSplitId": actorId });
              }
            } else if (fusion.type === "one-sided-absorption" || fusion.type === "one-sided-possession") {
              // Filter out stale IDs (deleted actors) before checking limits
              const rawIds = fusion.suppressedCharacterIds || fusion.fusedCharacterIds || [];
              const suppIds = rawIds.filter(id => game.actors?.has(id));
              // If stale IDs were pruned, update the stored array
              if (suppIds.length < rawIds.length) {
                await this.actor.update({ "system.fusion.suppressedCharacterIds": suppIds });
              }
              // Absorption limit: depends on Insatiable / Pursuit of Perfection / baseTier
              if (fusion.type === "one-sided-absorption") {
                const limit = this.actor._getAbsorptionLimit(this.actor.system);
                if (suppIds.length >= limit) {
                  let reason = `base Tier ${this.actor.system.baseTier || 1}`;
                  if (this.actor._hasInsatiableActive(this.actor.system)) reason = "Insatiable active";
                  else if (this.actor._hasPursuitOfPerfection(this.actor.system)) reason = "Pursuit of Perfection";
                  ui.notifications.warn(`Absorption limit reached: maximum ${limit} absorbed character(s) (${reason}).`);
                  return;
                }
              }
              // Possession limit: exactly 1 host
              if (fusion.type === "one-sided-possession" && suppIds.length >= 1) {
                ui.notifications.warn("Possession only allows one host character.");
                return;
              }
              suppIds.push(actorId);
              const updateData = { "system.fusion.suppressedCharacterIds": suppIds };
              // For Possession: initialize host LP tracking
              if (fusion.type === "one-sided-possession") {
                const hostActor = game.actors?.get(actorId);
                if (hostActor) {
                  updateData["system.fusion.hostCurrentLP"] = hostActor.system.lifePoints?.value ?? hostActor.system.lifePoints?.max ?? 0;
                }
              }
              await this.actor.update(updateData);
              // Majin Absorbed Apparel (rules line 37): offer to copy top layer
              if (fusion.type === "one-sided-absorption" && this.actor.system.race === "majin") {
                const suppActorApp = game.actors?.get(actorId);
                const suppTopId = suppActorApp?.system?.wornApparelSlots?.topLayer;
                const suppTopItem = suppTopId ? suppActorApp.items.get(suppTopId) : null;
                if (suppTopItem) {
                  const existing = this.actor.system.fusion?.absorbedApparel || {};
                  const hasExisting = !!existing.itemId;
                  const confirmMsg = hasExisting
                    ? `Replace current Absorbed Apparel with <b>${suppTopItem.name}</b> from ${suppActorApp.name}?`
                    : `Gain a copy of <b>${suppTopItem.name}</b> from ${suppActorApp.name} as Absorbed Apparel?`;
                  const accept = await Dialog.wait({
                    title: "Majin Absorbed Apparel",
                    content: `<p>${confirmMsg}</p>`,
                    buttons: {
                      yes: { icon: '<i class="fas fa-check"></i>', label: "Yes", callback: () => true },
                      no: { icon: '<i class="fas fa-times"></i>', label: "No", callback: () => false }
                    },
                    default: "yes",
                    close: () => false
                  });
                  if (accept) {
                    // Destroy existing absorbed apparel if any
                    if (hasExisting && this.actor.items.get(existing.itemId)) {
                      await this.actor.deleteEmbeddedDocuments("Item", [existing.itemId]);
                    }
                    // Count current worn apparel layers
                    const slots = this.actor.system.wornApparelSlots || {};
                    const wornCount = [slots.topLayer, slots.middleLayer, slots.bottomLayer].filter(Boolean).length;
                    // If 3 apparel worn, destroy current top layer to make room
                    if (wornCount >= 3 && slots.topLayer) {
                      const oldTop = this.actor.items.get(slots.topLayer);
                      if (oldTop) await this.actor.deleteEmbeddedDocuments("Item", [slots.topLayer]);
                    }
                    // Clone and create new item
                    const itemData = suppTopItem.toObject();
                    delete itemData._id;
                    const created = await this.actor.createEmbeddedDocuments("Item", [itemData]);
                    const newId = created[0]?.id || "";
                    // Equip as top layer and track
                    await this.actor.update({
                      "system.wornApparelSlots.topLayer": newId,
                      "system.fusion.absorbedApparel": { itemId: newId, sourceActorId: actorId }
                    });
                    ui.notifications.info(`Gained Absorbed Apparel: ${suppTopItem.name}`);
                  }
                }
              }
              // Mark the suppressed actor so their saving throws can reference the dominant
              const suppActor = game.actors?.get(actorId);
              if (suppActor) {
                await suppActor.update({
                  "system.fusion.isSuppressed": true,
                  "system.fusion.dominantCharacterId": this.actor.id
                });
              }
            } else {
              // Enforce method character limit
              const methodKey = fusion.method || "";
              const methodConfig = CONFIG.DBU?.fusionMethods?.[methodKey];
              const ids = foundry.utils.deepClone(fusion.fusedCharacterIds || []);
              if (methodConfig?.charLimit) {
                // charLimit = how many characters fuse together; fusion actor is the result, not a component
                if (ids.length >= methodConfig.charLimit) {
                  ui.notifications.warn(`${methodConfig.name} allows a maximum of ${methodConfig.charLimit} fused characters. Limit reached.`);
                  return;
                }
              }
              ids.push(actorId);
              await this.actor.update({ "system.fusion.fusedCharacterIds": ids });
            }
          }
        },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel" }
      },
      default: "add"
    }).render(true);
  }

  async _onRemoveFusedCharacter(event) {
    event.preventDefault();
    const actorId = event.currentTarget.dataset.actorId;
    if (!actorId) return;
    const fusion = this.actor.system.fusion || {};

    if (fusion.type === "fission") {
      const updates = {};
      if (fusion.originCharacterId === actorId) updates["system.fusion.originCharacterId"] = "";
      if (fusion.linkedSplitId === actorId) updates["system.fusion.linkedSplitId"] = "";
      await this.actor.update(updates);
    } else if (fusion.type === "one-sided-absorption" || fusion.type === "one-sided-possession") {
      const suppIds = (fusion.suppressedCharacterIds || fusion.fusedCharacterIds || []).filter(id => id !== actorId);
      const deepIds = (fusion.deeplySuppressed || []).filter(id => id !== actorId);
      const updateData = {
        "system.fusion.suppressedCharacterIds": suppIds,
        "system.fusion.deeplySuppressed": deepIds
      };
      // Clear struggling stacks for removed actor
      const stacks = foundry.utils.deepClone(fusion.strugglingStacks || {});
      if (stacks[actorId]) { delete stacks[actorId]; updateData["system.fusion.strugglingStacks"] = stacks; }
      // Clear host LP tracking for Possession
      if (fusion.type === "one-sided-possession") updateData["system.fusion.hostCurrentLP"] = null;
      await this.actor.update(updateData);
      // Clear suppression state on the removed actor
      const removedActor = game.actors?.get(actorId);
      if (removedActor) {
        await removedActor.update({ "system.fusion.isSuppressed": false, "system.fusion.dominantCharacterId": "" });
      }
    } else {
      const ids = (fusion.fusedCharacterIds || []).filter(id => id !== actorId);
      await this.actor.update({ "system.fusion.fusedCharacterIds": ids });
    }
  }

  async _onRecalculateFusion(event) {
    event.preventDefault();
    const fusion = this.actor.system.fusion || {};
    const ids = fusion.fusedCharacterIds || [];
    if (!ids.length) {
      ui.notifications.warn("No fused characters linked.");
      return;
    }

    const actors = ids.map(id => game.actors?.get(id)).filter(Boolean);
    if (!actors.length) return;

    const attrKeys = ["ag", "fo", "te", "sc", "in", "ma", "pe"];
    const updates = {};
    const method = (CONFIG.DBU?.fusionMethods || {})[fusion.method];
    const isTemporary = method && method.fusionType === "temporary";

    // Step 4: Highest attributes
    for (const key of attrKeys) {
      const highest = Math.max(...actors.map(a => {
        const attr = a.system?.attributes?.[key];
        return attr?.totalScore ?? ((attr?.racial || 0) + (attr?.progression || 0));
      }));
      // Store as racial (since fusion doesn't have progression from leveling)
      updates[`system.attributes.${key}.racial`] = highest;
      updates[`system.attributes.${key}.progression`] = 0;
    }

    // Step 7: Highest skills
    const fusionSkills = {};
    for (const actor of actors) {
      const skills = actor.system?.skills || {};
      for (const [skillKey, skillData] of Object.entries(skills)) {
        const rank = typeof skillData === "object" ? (skillData.rank || 0) : (Number(skillData) || 0);
        if (!fusionSkills[skillKey] || rank > fusionSkills[skillKey].rank) {
          fusionSkills[skillKey] = { rank };
        }
      }
    }
    updates["system.skills"] = fusionSkills;

    // Step 6: Union of talents, transformations, techniques, auras, unique abilities
    const allTalents = new Set();
    const allTransformations = [];
    const allTechniques = [];
    const allAuras = [];
    const allUnique = [];
    for (const actor of actors) {
      const s = actor.system || {};
      for (const t of (s.talents || [])) allTalents.add(t);
      for (const t of (s.transformations || [])) {
        if (!allTransformations.find(x => x.name === t.name)) allTransformations.push(foundry.utils.deepClone(t));
      }
      for (const t of (s.signatureTechniques || [])) {
        if (!allTechniques.find(x => x.name === t.name)) allTechniques.push(foundry.utils.deepClone(t));
      }
      for (const a of (s.signatureAuras || [])) {
        if (!allAuras.find(x => x.name === a.name)) allAuras.push(foundry.utils.deepClone(a));
      }
      for (const u of (s.uniqueAbilities || [])) {
        if (!allUnique.find(x => x.abilityKey === u.abilityKey)) allUnique.push(foundry.utils.deepClone(u));
      }
    }
    // Include fusion bonus talents (+2 from Character Combination, fusion.txt line 19)
    for (const bt of (fusion.fusionBonusTalents || [])) allTalents.add(bt);
    updates["system.talents"] = [...allTalents];
    updates["system.transformations"] = allTransformations;
    updates["system.signatureTechniques"] = allTechniques;
    updates["system.signatureAuras"] = allAuras;
    updates["system.uniqueAbilities"] = allUnique;

    // Step 2: Races — use the first fused character's race as primary
    const races = [...new Set(actors.map(a => a.system?.race).filter(Boolean))];
    if (races.length) updates["system.race"] = races.join(" / ");

    // Sync selectedRacialTraitIds → system.racialTraits for racial automation
    // Temporary: all traits from fused chars. Lasting: user-selected (max 7).
    const selectedTraitIds = fusion.selectedRacialTraitIds || [];
    if (isTemporary) {
      // Auto-select all racial traits from fused characters
      const allTraitIds = [];
      for (const actor of actors) {
        for (const tId of (actor.system?.racialTraits || [])) {
          if (!allTraitIds.includes(tId)) allTraitIds.push(tId);
        }
      }
      updates["system.racialTraits"] = allTraitIds;
      updates["system.fusion.selectedRacialTraitIds"] = allTraitIds;
    } else {
      updates["system.racialTraits"] = selectedTraitIds;
    }

    // Step 8: Fusion Power Level (fusion.txt:16 — base PL is highest +2)
    const highestPL = Math.max(...actors.map(a => a.system?.level || 1));
    // Temporary fusions gain +3 extra PL (fusion.txt:62 — total +5)
    const plBonus = isTemporary ? 5 : 2;
    const rawPL = highestPL + plBonus;
    const fusionPL = Math.min(30, rawPL);
    // A17: PL overflow beyond 30 → +1 to all Attribute Modifiers per PL above 30
    const plOverflow = Math.max(0, rawPL - 30);
    updates["system.level"] = fusionPL;
    updates["system.fusion.plOverflow"] = plOverflow;

    // Step 9: Bonus TP (fusion.txt:17 = 10(bT); fusion.txt:28 = forgo for +20 flat extra)
    const fusionTier = this._tierFromLevel(fusionPL);
    const fusionBT = fusionTier;
    updates["system.fusion.bonusTP"] = fusion.hasFusedTechnique ? (10 * fusionBT) : (10 * fusionBT + 20);

    // Set round limit from method
    if (isTemporary) {
      updates["system.fusion.roundLimit"] = method.roundLimit;
      updates["system.fusion.maxRoundLimit"] = method.roundLimit;
    }

    // F1/F2: Initialize LP to max and Ki with penalty for low-Ki fused characters
    // Ki: count fused chars below 1/2 Ki for penalty
    let kiPenaltyCount = 0;
    for (const a of actors) {
      const aKi = a.system?.kiPool?.value ?? 0;
      const aKiMax = a.system?.kiPool?.max ?? 1;
      if (aKi < aKiMax / 2) kiPenaltyCount++;
    }

    await this.actor.update(updates);

    // After update, prepareDerivedData has recalculated max LP/KP — now set current to max
    const newLPMax = this.actor.system.lifePoints?.max || 100;
    const newKiMax = this.actor.system.kiPool?.max || 50;
    const kiPenalty = kiPenaltyCount > 0 ? Math.floor(newKiMax / 4) * kiPenaltyCount : 0;
    await this.actor.update({
      "system.lifePoints.value": newLPMax,
      "system.kiPool.value": Math.max(0, newKiMax - kiPenalty)
    });

    ui.notifications.info(`Fusion stats recalculated from ${actors.length} characters. PL: ${fusionPL}${plOverflow > 0 ? ` (+${plOverflow} overflow → attr mods)` : ""}, Tier: ${fusionTier}.`);
  }

  async _onFusionTraitToggle(event) {
    const traitId = event.currentTarget.dataset.traitId;
    const checked = event.currentTarget.checked;
    const current = foundry.utils.deepClone(this.actor.system.fusion?.selectedRacialTraitIds || []);
    if (checked) {
      // Temporary fusions inherit ALL racial traits (no limit). Lasting = max 7.
      const method = (CONFIG.DBU?.fusionMethods || {})[this.actor.system.fusion?.method];
      const isTemp = method?.fusionType === "temporary";
      if (!isTemp && current.length >= 7) {
        ui.notifications.warn("Maximum 7 racial traits allowed for a Lasting Fusion.");
        event.currentTarget.checked = false;
        return;
      }
      if (!current.includes(traitId)) current.push(traitId);
    } else {
      const idx = current.indexOf(traitId);
      if (idx >= 0) current.splice(idx, 1);
    }
    await this.actor.update({ "system.fusion.selectedRacialTraitIds": current });
  }

  async _onFusionBoostAttrToggle(event) {
    const attrKey = event.currentTarget.dataset.attrKey;
    const checked = event.currentTarget.checked;
    const current = foundry.utils.deepClone(this.actor.system.fusion?.fusionBoostAttrs || []);
    if (checked) {
      if (current.length >= 3) {
        ui.notifications.warn("Maximum 3 attributes for +1(bT) boost.");
        event.currentTarget.checked = false;
        return;
      }
      if (!current.includes(attrKey)) current.push(attrKey);
    } else {
      const idx = current.indexOf(attrKey);
      if (idx >= 0) current.splice(idx, 1);
    }
    await this.actor.update({ "system.fusion.fusionBoostAttrs": current });
  }

  async _onFusionBonusTalentToggle(event) {
    const talentId = event.currentTarget.dataset.talentId;
    const checked = event.currentTarget.checked;
    const current = foundry.utils.deepClone(this.actor.system.fusion?.fusionBonusTalents || []);
    if (checked) {
      if (current.length >= 2) {
        ui.notifications.warn("Maximum 2 bonus talents from Character Combination.");
        event.currentTarget.checked = false;
        return;
      }
      if (!current.includes(talentId)) current.push(talentId);
    } else {
      const idx = current.indexOf(talentId);
      if (idx >= 0) current.splice(idx, 1);
    }
    await this.actor.update({ "system.fusion.fusionBonusTalents": current });
  }

  async _onAbsorptionTraitSelect(event) {
    const actorId = event.currentTarget.dataset.actorId;
    const traitId = event.currentTarget.value;
    const current = foundry.utils.deepClone(this.actor.system.fusion?.absorptionChosenTraits || {});
    if (traitId) {
      current[actorId] = traitId;
    } else {
      delete current[actorId];
    }
    await this.actor.update({ "system.fusion.absorptionChosenTraits": current });
  }

  async _onPossessionTraitExchange(event) {
    const el = event.currentTarget;
    const field = el.classList.contains("possession-trait-give") ? "givenTraitId" : "takenTraitId";
    const value = el.value;
    await this.actor.update({ [`system.fusion.possessionTraitExchange.${field}`]: value });
  }

  async _onMutationSourceSelect(event) {
    const value = event.currentTarget.value;
    await this.actor.update({ "system.fusion.chosenMutationSourceId": value });
  }

  async _onDestroyAbsorbedApparel(event) {
    if (event.preventDefault) event.preventDefault();
    const apparel = this.actor.system.fusion?.absorbedApparel || {};
    if (!apparel.itemId) return;
    const slots = this.actor.system.wornApparelSlots || {};
    const updateData = {
      "system.fusion.absorbedApparel": { itemId: "", sourceActorId: "" }
    };
    if (slots.topLayer === apparel.itemId) {
      updateData["system.wornApparelSlots.topLayer"] = "";
    }
    const itemIdToDelete = apparel.itemId;
    await this.actor.update(updateData);
    const item = this.actor.items.get(itemIdToDelete);
    if (item) await this.actor.deleteEmbeddedDocuments("Item", [itemIdToDelete]);
    ui.notifications.info("Absorbed Apparel destroyed.");
  }

  async _onFusionModifierToggle(event) {
    const modId = event.currentTarget.dataset.modifierId;
    const checked = event.currentTarget.checked;
    const fusion = this.actor.system.fusion || {};
    const current = foundry.utils.deepClone(fusion.modifiers || []);
    const method = (CONFIG.DBU?.fusionMethods || {})[fusion.method];
    const isTemp = method?.fusionType === "temporary";
    const limit = isTemp ? 2 : 1;

    if (checked) {
      if (current.length >= limit) {
        ui.notifications.warn(`Maximum ${limit} modifier(s) for ${isTemp ? "Temporary" : "Lasting"} fusion.`);
        event.currentTarget.checked = false;
        return;
      }
      if (!current.includes(modId)) current.push(modId);
    } else {
      const idx = current.indexOf(modId);
      if (idx >= 0) current.splice(idx, 1);
    }
    await this.actor.update({ "system.fusion.modifiers": current });
  }

  async _onFusionRoundDecrement(event) {
    event.preventDefault();
    const current = this.actor.system.fusion?.roundLimit ?? 0;
    await this.actor.update({ "system.fusion.roundLimit": Math.max(0, current - 1) });
  }

  async _onFusionRoundReset(event) {
    event.preventDefault();
    const max = this.actor.system.fusion?.maxRoundLimit ?? 0;
    await this.actor.update({ "system.fusion.roundLimit": max });
  }

  async _onFusionDeeplySuppressed(event) {
    const actorId = event.currentTarget.dataset.actorId;
    const checked = event.currentTarget.checked;
    const current = foundry.utils.deepClone(this.actor.system.fusion?.deeplySuppressed || []);
    if (checked && !current.includes(actorId)) current.push(actorId);
    else if (!checked) {
      const idx = current.indexOf(actorId);
      if (idx >= 0) current.splice(idx, 1);
    }
    await this.actor.update({ "system.fusion.deeplySuppressed": current });
  }

  async _onFusionStrugglingChange(event) {
    const val = Math.max(0, Number(event.currentTarget.value) || 0);
    const actorId = event.currentTarget.dataset.actorId;
    if (!actorId) return;
    const stacks = foundry.utils.deepClone(this.actor.system.fusion?.strugglingStacks || {});
    stacks[actorId] = val;
    await this.actor.update({ "system.fusion.strugglingStacks": stacks });
  }

  /** Suppressed Character wins the Cognitive Clash and escapes.
   *  Rules (one-sided-fusions.txt line 24): freed from the One-Sided Fusion,
   *  Dominant gains 2 stacks of Fatigued until end of their next turn,
   *  escaped character may use any 1-Standard-Action Maneuver as Out-of-Sequence. */
  async _onEscapeSuppressed(event) {
    event.preventDefault();
    const actorId = event.currentTarget?.dataset?.actorId;
    if (!actorId) return;
    const escapedActor = game.actors?.get(actorId);
    const escapedName = escapedActor?.name || "Character";

    // Eject without Slowed (escape, not voluntary ejection)
    await this._onEjectSuppressed({ currentTarget: { dataset: { actorId } }, skipSlowed: true, silent: true, preventDefault() {} });

    // Apply Fatigued 2 stacks to the Dominant (this actor)
    const conditions = foundry.utils.deepClone(this.actor.system.conditions || []);
    const fatIdx = conditions.findIndex(c => c.id === "fatigued");
    if (fatIdx >= 0) { conditions[fatIdx].active = true; conditions[fatIdx].stacks = 2; }
    else { conditions.push({ id: "fatigued", active: true, stacks: 2 }); }
    await this.actor.update({ "system.conditions": conditions });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div style="border-left:3px solid #9b59b6; padding:4px 8px;">
        <b><i class="fas fa-running"></i> Escape — ${escapedName}</b><br>
        ${escapedName} wins the Cognitive Clash and is freed from ${this.actor.name}'s One-Sided Fusion!<br>
        <em style="color:#e67e22;">⚠ ${this.actor.name} gains <b>Fatigued (2 stacks)</b> until the end of their next turn.</em><br>
        <em style="color:#2ecc71;">${escapedName} may use any 1-Standard-Action Maneuver as an Out-of-Sequence Maneuver.</em>
      </div>`
    });
    ui.notifications.info(`${escapedName} escaped! ${this.actor.name} is Fatigued (2 stacks).`);
  }

  async _onEjectSuppressed(event) {
    if (event.preventDefault) event.preventDefault();
    const actorId = event.currentTarget?.dataset?.actorId || event.actorId;
    if (!actorId) return;
    const fusion = this.actor.system.fusion || {};
    const suppIds = (fusion.suppressedCharacterIds || []).filter(id => id !== actorId);
    const deepIds = (fusion.deeplySuppressed || []).filter(id => id !== actorId);
    // Clear struggling stacks for the ejected actor
    const stacks = foundry.utils.deepClone(fusion.strugglingStacks || {});
    delete stacks[actorId];
    const updateData = {
      "system.fusion.suppressedCharacterIds": suppIds,
      "system.fusion.deeplySuppressed": deepIds,
      "system.fusion.strugglingStacks": stacks
    };
    // Clear gained aura if it belongs to the ejected actor
    const gainedAuraKey = fusion.activeGainedAuraId || "";
    if (gainedAuraKey && gainedAuraKey.startsWith(actorId + "_")) {
      updateData["system.fusion.activeGainedAuraId"] = "";
    }
    // Clear gained transformations from the ejected actor
    const gainedTransIds = (fusion.activeGainedTransformationIds || []).filter(
      key => !key.startsWith(actorId + "_")
    );
    if (gainedTransIds.length !== (fusion.activeGainedTransformationIds || []).length) {
      updateData["system.fusion.activeGainedTransformationIds"] = gainedTransIds;
    }
    // Possession: clear trait exchange and parasite trait on eject
    if (fusion.type === "one-sided-possession") {
      updateData["system.fusion.possessionTraitExchange"] = { givenTraitId: "", takenTraitId: "" };
      updateData["system.fusion.parasiteHostTraitId"] = "";
    }
    // Absorption: clear mutation source if ejected actor was the chosen source
    if (fusion.chosenMutationSourceId === actorId) {
      updateData["system.fusion.chosenMutationSourceId"] = "";
    }
    // Clean orphaned absorptionChosenTraits entry for ejected actor
    const chosenTraitsClean = foundry.utils.deepClone(fusion.absorptionChosenTraits || {});
    if (chosenTraitsClean[actorId]) {
      delete chosenTraitsClean[actorId];
      updateData["system.fusion.absorptionChosenTraits"] = chosenTraitsClean;
    }
    // Majin Absorbed Apparel: destroy if source is ejected (rules line 37)
    const apparel = fusion.absorbedApparel || {};
    if (apparel.itemId && apparel.sourceActorId === actorId) {
      const currentTopLayer = this.actor.system.wornApparelSlots?.topLayer;
      if (currentTopLayer === apparel.itemId) {
        updateData["system.wornApparelSlots.topLayer"] = "";
      }
      const apparelItem = this.actor.items.get(apparel.itemId);
      if (apparelItem) await this.actor.deleteEmbeddedDocuments("Item", [apparel.itemId]);
      updateData["system.fusion.absorbedApparel"] = { itemId: "", sourceActorId: "" };
      // If other absorbed remain, offer replacement from highest tier
      if (suppIds.length > 0 && this.actor.system.race === "majin") {
        const candidates = [];
        for (const sId of suppIds) {
          const sActor = game.actors?.get(sId);
          if (!sActor) continue;
          const sTopId = sActor.system?.wornApparelSlots?.topLayer;
          const sTopItem = sTopId ? sActor.items.get(sTopId) : null;
          if (sTopItem) {
            candidates.push({ actorId: sId, actorName: sActor.name, item: sTopItem, tier: sActor.system?.tier || 1 });
          }
        }
        if (candidates.length > 0) {
          candidates.sort((a, b) => b.tier - a.tier);
          const best = candidates[0];
          let chosen = best;
          const tied = candidates.filter(c => c.tier === best.tier);
          if (tied.length > 1) {
            const buttons = {};
            for (const c of tied) {
              buttons[c.actorId] = { label: `${c.actorName}: ${c.item.name}`, callback: () => c };
            }
            buttons.none = { label: "None", callback: () => null };
            chosen = await Dialog.wait({
              title: "Replacement Absorbed Apparel",
              content: "<p>Choose replacement Absorbed Apparel from remaining absorbed characters:</p>",
              buttons, default: tied[0].actorId, close: () => null
            });
          } else {
            const accept = await Dialog.wait({
              title: "Replacement Absorbed Apparel",
              content: `<p>Gain <b>${best.item.name}</b> from ${best.actorName} as replacement?</p>`,
              buttons: {
                yes: { label: "Yes", callback: () => best },
                no: { label: "No", callback: () => null }
              },
              default: "yes", close: () => null
            });
            chosen = accept;
          }
          if (chosen) {
            const itemData = chosen.item.toObject();
            delete itemData._id;
            const created = await this.actor.createEmbeddedDocuments("Item", [itemData]);
            const newId = created[0]?.id || "";
            updateData["system.wornApparelSlots.topLayer"] = newId;
            updateData["system.fusion.absorbedApparel"] = { itemId: newId, sourceActorId: chosen.actorId };
            ui.notifications.info(`Replacement Absorbed Apparel: ${chosen.item.name}`);
          }
        }
      }
    }
    // Possession: write back accumulated LP damage to the actual host actor, then clear tracking
    if (fusion.type === "one-sided-possession" && fusion.hostCurrentLP != null) {
      const hostActor = game.actors?.get(actorId);
      if (hostActor) {
        const hostMax = hostActor.system.lifePoints?.max ?? 0;
        const writtenLP = Math.min(hostMax, Math.max(0, fusion.hostCurrentLP));
        await hostActor.update({ "system.lifePoints.value": writtenLP });
      }
      updateData["system.fusion.hostCurrentLP"] = null;
    }
    // Clear suppression state on the ejected actor; apply conditions
    const ejected = game.actors?.get(actorId);
    const wasDeep = (fusion.deeplySuppressed || []).includes(actorId);
    if (ejected) {
      const ejectedUpdates = { "system.fusion.isSuppressed": false, "system.fusion.dominantCharacterId": "" };
      const conditions = foundry.utils.deepClone(ejected.system.conditions || []);
      // Slowed only for voluntary Ejection Maneuver (rules line 87), NOT threshold auto-eject (rules line 39)
      if (!event.skipSlowed) {
        const slowIdx = conditions.findIndex(c => c.id === "slowed");
        if (slowIdx >= 0) { conditions[slowIdx].active = true; }
        else { conditions.push({ id: "slowed", active: true, stacks: 0 }); }
      }
      // Deeply Suppressed → Sleeping condition on ejection
      if (wasDeep) {
        const sleepIdx = conditions.findIndex(c => c.id === "sleeping");
        if (sleepIdx >= 0) { conditions[sleepIdx].active = true; }
        else { conditions.push({ id: "sleeping", active: true, stacks: 0 }); }
      }
      ejectedUpdates["system.conditions"] = conditions;
      await ejected.update(ejectedUpdates);
    }
    await this.actor.update(updateData);
    const ejectedName = ejected?.name || "Character";
    // ChatMessage unless caller passes silent=true (e.g., auto-eject creates its own message)
    if (!event.silent) {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div style="border-left:3px solid #e74c3c; padding:4px 8px;">
          <b>Ejection — ${ejectedName}</b><br>
          ${ejectedName} has been ejected from ${this.actor.name}'s One-Sided Fusion.<br>
          <em style="color:#e67e22;">⚠ ${ejectedName} gains the <b>Slowed</b> condition until the end of their next turn.</em>
        </div>`
      });
      ui.notifications.info(`${ejectedName} ejected from One-Sided Fusion. They are Slowed.`);
    }
  }

  // -------------------------------------------------------
  // Downtime
  // -------------------------------------------------------

  async _onDtStartPeriod(event) {
    event.preventDefault();
    const html = $(event.currentTarget).closest(".downtime-container");
    const amount = parseInt(html.find(".dt-start-amount").val()) || 2;
    await this.actor.update({
      "system.downtime.currentPeriod.active": true,
      "system.downtime.currentPeriod.totalDT": amount,
      "system.downtime.currentPeriod.spentDT": 0,
      "system.downtime.currentPeriod.activitiesUsed": [],
      "system.downtime.currentPeriod.modifiersUsed": [],
      "system.downtime.currentPeriod.notes": ""
    });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<b>Downtime Period Started</b> — ${amount} DT available.`
    });
  }

  async _onDtEndPeriod(event) {
    event.preventDefault();
    const dt = this.actor.system.downtime || {};
    const period = dt.currentPeriod || {};
    const history = foundry.utils.deepClone(dt.history || []);

    // Save to history
    history.unshift({
      totalDT: period.totalDT || 0,
      activities: [...(period.activitiesUsed || [])],
      modifiers: [...(period.modifiersUsed || [])],
      notes: period.notes || ""
    });

    await this.actor.update({
      "system.downtime.currentPeriod.active": false,
      "system.downtime.currentPeriod.totalDT": 0,
      "system.downtime.currentPeriod.spentDT": 0,
      "system.downtime.currentPeriod.activitiesUsed": [],
      "system.downtime.currentPeriod.modifiersUsed": [],
      "system.downtime.currentPeriod.notes": "",
      "system.downtime.history": history
    });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<b>Downtime Period Ended</b> — ${period.spentDT || 0}/${period.totalDT || 0} DT spent.`
    });
  }

  async _onDtCancelPeriod(event) {
    event.preventDefault();
    const confirmed = await Dialog.confirm({
      title: "Cancel Downtime Period",
      content: "<p>Cancel the current period? Lifetime usage counters from this period will be reverted.</p>",
      defaultYes: false
    });
    if (!confirmed) return;

    // Revert lifetime uses for activities used this period
    const dt = this.actor.system.downtime || {};
    const period = dt.currentPeriod || {};
    const lifetime = foundry.utils.deepClone(dt.lifetimeUses || {});
    const activitiesUsed = period.activitiesUsed || [];

    // Count occurrences of each activity and revert
    const activityMap = {
      basicTraining: "basicTraining", techniqueTraining: "techniqueTraining",
      transformationTraining: "transformationTraining", heartbeatTraining: "heartbeatTraining",
      resting: "resting", studying: "studying", baseBuilding: "baseBuilding"
    };
    for (const actId of activitiesUsed) {
      const key = activityMap[actId];
      if (key && lifetime[key] > 0) lifetime[key]--;
    }

    await this.actor.update({
      "system.downtime.currentPeriod.active": false,
      "system.downtime.currentPeriod.totalDT": 0,
      "system.downtime.currentPeriod.spentDT": 0,
      "system.downtime.currentPeriod.activitiesUsed": [],
      "system.downtime.currentPeriod.modifiersUsed": [],
      "system.downtime.currentPeriod.notes": "",
      "system.downtime.lifetimeUses": lifetime
    });
  }

  async _onDtUseActivity(event) {
    event.preventDefault();
    const actId = event.currentTarget.dataset.activityId;
    if (!actId) return;

    const dt = this.actor.system.downtime || {};
    const period = dt.currentPeriod || {};
    const lifetime = foundry.utils.deepClone(dt.lifetimeUses || {});
    const activitiesUsed = [...(period.activitiesUsed || [])];

    // Activity cost lookup
    const costMap = {
      basicTraining: 1, techniqueTraining: 1, reinforcingForm: 2,
      unlockingForm: 2, transformationTraining: 2, heartbeatTraining: 1,
      resting: 1, studying: 1, baseBuilding: 2
    };
    const nameMap = {
      basicTraining: "Basic Training", techniqueTraining: "Technique Training",
      reinforcingForm: "Reinforcing Form", unlockingForm: "Unlocking Form",
      transformationTraining: "Transformation Training", heartbeatTraining: "Heartbeat Training",
      resting: "Resting", studying: "Studying", baseBuilding: "Base Building"
    };
    const effectMap = {
      basicTraining: "+2 Attribute Points (not SC/PE)",
      techniqueTraining: "+15 Technique Points",
      reinforcingForm: "Mastery / Power Improvement",
      unlockingForm: "New Transformation access",
      transformationTraining: "+1 Stress Bonus",
      heartbeatTraining: "Transformation gains Heartbeat Aspect",
      resting: "+1 Karma, +1 PE Skill Rank, +2 PE Score",
      studying: "+2 Skill Ranks, +2 SC Score",
      baseBuilding: "+2 Dev Points, +1 PE, +1 SC Score"
    };

    const cost = costMap[actId] || 1;
    const remaining = (period.totalDT || 0) - (period.spentDT || 0);
    if (remaining < cost) {
      ui.notifications.warn("Not enough DT remaining.");
      return;
    }

    activitiesUsed.push(actId);
    const spentDT = (period.spentDT || 0) + cost;

    // Increment lifetime uses for limited activities
    const lifetimeKey = ["basicTraining", "techniqueTraining", "transformationTraining",
      "heartbeatTraining", "resting", "studying", "baseBuilding"];
    if (lifetimeKey.includes(actId)) {
      lifetime[actId] = (lifetime[actId] || 0) + 1;
    }

    await this.actor.update({
      "system.downtime.currentPeriod.activitiesUsed": activitiesUsed,
      "system.downtime.currentPeriod.spentDT": spentDT,
      "system.downtime.lifetimeUses": lifetime
    });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<b>Downtime:</b> ${nameMap[actId] || actId} (${cost} DT)<br><em>${effectMap[actId] || ""}</em>`
    });
  }

  async _onDtUndoActivity(event) {
    event.preventDefault();
    const actId = event.currentTarget.dataset.activityId;
    if (!actId) return;

    const dt = this.actor.system.downtime || {};
    const period = dt.currentPeriod || {};
    const lifetime = foundry.utils.deepClone(dt.lifetimeUses || {});
    const activitiesUsed = [...(period.activitiesUsed || [])];

    const costMap = {
      basicTraining: 1, techniqueTraining: 1, reinforcingForm: 2,
      unlockingForm: 2, transformationTraining: 2, heartbeatTraining: 1,
      resting: 1, studying: 1, baseBuilding: 2
    };

    // Remove last occurrence
    const idx = activitiesUsed.lastIndexOf(actId);
    if (idx === -1) return;
    activitiesUsed.splice(idx, 1);

    const cost = costMap[actId] || 1;
    const spentDT = Math.max(0, (period.spentDT || 0) - cost);

    // Decrement lifetime
    const lifetimeKey = ["basicTraining", "techniqueTraining", "transformationTraining",
      "heartbeatTraining", "resting", "studying", "baseBuilding"];
    if (lifetimeKey.includes(actId) && (lifetime[actId] || 0) > 0) {
      lifetime[actId]--;
    }

    await this.actor.update({
      "system.downtime.currentPeriod.activitiesUsed": activitiesUsed,
      "system.downtime.currentPeriod.spentDT": spentDT,
      "system.downtime.lifetimeUses": lifetime
    });
  }

  async _onDtToggleModifier(event) {
    const modId = event.currentTarget.dataset.modifierId;
    if (!modId) return;

    const dt = this.actor.system.downtime || {};
    const period = dt.currentPeriod || {};
    const modifiersUsed = [...(period.modifiersUsed || [])];
    const checked = event.currentTarget.checked;

    const updates = {};

    if (checked) {
      if (modifiersUsed.length >= 2) {
        event.currentTarget.checked = false;
        ui.notifications.warn("Maximum 2 modifiers per downtime period.");
        return;
      }
      modifiersUsed.push(modId);

      // Mentor grants +1 DT
      if (modId === "mentor") {
        updates["system.downtime.currentPeriod.totalDT"] = (period.totalDT || 0) + 1;
      }
    } else {
      const idx = modifiersUsed.indexOf(modId);
      if (idx !== -1) modifiersUsed.splice(idx, 1);

      // Removing Mentor reverts the +1 DT
      if (modId === "mentor") {
        const newTotal = Math.max(0, (period.totalDT || 0) - 1);
        updates["system.downtime.currentPeriod.totalDT"] = newTotal;
        // Clamp spentDT if needed
        if ((period.spentDT || 0) > newTotal) {
          updates["system.downtime.currentPeriod.spentDT"] = newTotal;
        }
      }
    }

    updates["system.downtime.currentPeriod.modifiersUsed"] = modifiersUsed;
    await this.actor.update(updates);
  }

  async _onDtDeleteHistory(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.historyIndex);
    if (isNaN(index)) return;

    const history = foundry.utils.deepClone(this.actor.system.downtime?.history || []);
    if (index < 0 || index >= history.length) return;
    history.splice(index, 1);
    await this.actor.update({ "system.downtime.history": history });
  }

  // ============================================================
  // Battle Jacket Tab Handlers
  // ============================================================

  async _onLinkJacket(event) {
    event.preventDefault();
    const select = this.element.find(".bj-jacket-select");
    const jacketId = select.val();
    if (!jacketId) return;
    const bjActor = game.actors.get(jacketId);
    if (!bjActor) return;
    await this.actor.update({ "system.pilotedJacketId": jacketId });
    await bjActor.update({ "system.pilotId": this.actor.id });
  }

  async _onUnlinkJacket(event) {
    event.preventDefault();
    const jacketId = this.actor.system.pilotedJacketId;
    if (jacketId) {
      const bjActor = game.actors.get(jacketId);
      if (bjActor) await bjActor.update({ "system.pilotId": "" });
    }
    await this.actor.update({ "system.pilotedJacketId": "", "system.isPiloting": false });
  }

  async _onEnterJacket(event) {
    event.preventDefault();
    await this.actor.update({ "system.isPiloting": true });
  }

  async _onExitJacket(event) {
    event.preventDefault();
    await this.actor.update({ "system.isPiloting": false });
  }

  _onOpenJacketSheet(event) {
    event.preventDefault();
    const jacketId = this.actor.system.pilotedJacketId;
    if (jacketId) {
      const bjActor = game.actors.get(jacketId);
      if (bjActor) bjActor.sheet.render(true);
    }
  }

  async _onBJResourceChange(event) {
    const input = event.currentTarget;
    const jacketId = input.dataset.jacketId;
    const bjActor = game.actors.get(jacketId);
    if (!bjActor) return;
    const isLP = input.classList.contains("bj-lp-input");
    const field = isLP ? "system.lp.value" : "system.kp.value";
    await bjActor.update({ [field]: Number(input.value) || 0 });
  }

  async _onBJWeakPointToggle(event) {
    const jacketId = event.currentTarget.dataset.jacketId;
    const field = event.currentTarget.dataset.field;
    const checked = event.currentTarget.checked;
    const bjActor = game.actors.get(jacketId);
    if (!bjActor) return;
    await bjActor.update({ [`system.weakPoints.${field}`]: checked });
  }

  // -------------------------------------------------------
  // Transformation Customization Handlers
  // -------------------------------------------------------

  async _onTfcRemoveAspect(event) {
    event.preventDefault();
    const idx = parseInt(event.currentTarget.dataset.transIndex);
    const aspectToRemove = event.currentTarget.dataset.aspect;
    if (isNaN(idx) || !aspectToRemove) return;

    const trans = foundry.utils.deepClone(this.actor.system.transformations || []);
    if (!trans[idx]) return;

    // If aspects are empty, pull from catalog first
    if (!trans[idx].aspects || trans[idx].aspects.length === 0) {
      const catEntry = trans[idx].catalogKey
        ? (CONFIG.DBU?.transformationsCatalog || {})[trans[idx].catalogKey]
        : null;
      trans[idx].aspects = catEntry?.aspects ? [...catEntry.aspects] : [];
    }

    trans[idx].aspects = trans[idx].aspects.filter(a => a !== aspectToRemove);
    await this.actor.update({ "system.transformations": trans });
  }

  async _onTfcAddAspect(event) {
    event.preventDefault();
    const idx = parseInt(event.currentTarget.dataset.transIndex);
    if (isNaN(idx)) return;

    const input = this.element.find(`.tfc-aspect-input[data-trans-index='${idx}']`);
    const newAspect = input.val()?.trim();
    if (!newAspect) return;

    const trans = foundry.utils.deepClone(this.actor.system.transformations || []);
    if (!trans[idx]) return;

    // If aspects are empty, pull from catalog first
    if (!trans[idx].aspects || trans[idx].aspects.length === 0) {
      const catEntry = trans[idx].catalogKey
        ? (CONFIG.DBU?.transformationsCatalog || {})[trans[idx].catalogKey]
        : null;
      trans[idx].aspects = catEntry?.aspects ? [...catEntry.aspects] : [];
    }

    trans[idx].aspects.push(newAspect);
    await this.actor.update({ "system.transformations": trans });
  }

  async _onTfcEditAmb(event) {
    const idx = parseInt(event.currentTarget.dataset.transIndex);
    const attr = event.currentTarget.dataset.attr;
    const value = event.currentTarget.value.trim();
    if (isNaN(idx) || !attr) return;

    const trans = foundry.utils.deepClone(this.actor.system.transformations || []);
    if (!trans[idx]) return;

    if (!trans[idx].attrBonuses) trans[idx].attrBonuses = {};
    trans[idx].attrBonuses[attr] = value;
    await this.actor.update({ "system.transformations": trans });
  }

  async _onTfcSetPowerImprovement(event) {
    const idx = parseInt(event.currentTarget.dataset.transIndex);
    const value = event.currentTarget.value;
    if (isNaN(idx)) return;

    const trans = foundry.utils.deepClone(this.actor.system.transformations || []);
    if (!trans[idx]) return;

    trans[idx].powerImprovement = value;

    // Auto-apply Control effects
    if (value === "control") {
      // Add Strainless if not present
      if (!trans[idx].aspects) trans[idx].aspects = [];
      if (!trans[idx].aspects.includes("Strainless")) {
        trans[idx].aspects.push("Strainless");
      }
      // Reduce stress test by 2
      trans[idx].stressTest = Math.max(0, (trans[idx].stressTest || 0) - 2);
    }

    // Auto-apply Surpass effects
    if (value === "surpass") {
      trans[idx].mastered = true;
    }

    await this.actor.update({ "system.transformations": trans });
  }

  async _onTfcSetLsForm(event) {
    const transId = parseInt(event.currentTarget.value);
    await this.actor.update({
      "system.transformationCustomization.limitShattering.transformationId": transId,
      "system.transformationCustomization.limitShattering.exceedTrait": "",
      "system.transformationCustomization.limitShattering.exceedActive": false
    });
  }

  async _onTfcSetLsExceed(event) {
    await this.actor.update({
      "system.transformationCustomization.limitShattering.exceedTrait": event.currentTarget.value
    });
  }

  async _onTfcToggleExceed(event) {
    await this.actor.update({
      "system.transformationCustomization.limitShattering.exceedActive": event.currentTarget.checked
    });
  }

  async _onTfcSetUpField(event) {
    const upIdx = parseInt(event.currentTarget.dataset.upIndex);
    if (isNaN(upIdx)) return;

    const paths = foundry.utils.deepClone(
      this.actor.system.transformationCustomization?.uniquePaths || []
    );

    // Ensure row exists
    while (paths.length <= upIdx) {
      paths.push({ transformationId: -1, pathType: "", ambAttribute: "" });
    }

    const action = event.currentTarget.dataset.action;
    if (action === "tfc-set-up-form") {
      paths[upIdx].transformationId = parseInt(event.currentTarget.value);
    } else if (action === "tfc-set-up-path") {
      paths[upIdx].pathType = event.currentTarget.value;
    } else if (action === "tfc-set-up-amb") {
      paths[upIdx].ambAttribute = event.currentTarget.value;
    }

    await this.actor.update({
      "system.transformationCustomization.uniquePaths": paths
    });
  }

  async _onTfcAddUp(event) {
    event.preventDefault();
    const paths = foundry.utils.deepClone(
      this.actor.system.transformationCustomization?.uniquePaths || []
    );
    paths.push({ transformationId: -1, pathType: "", ambAttribute: "" });
    await this.actor.update({
      "system.transformationCustomization.uniquePaths": paths
    });
  }

  async _onTfcDeleteUp(event) {
    event.preventDefault();
    const upIdx = parseInt(event.currentTarget.dataset.upIndex);
    if (isNaN(upIdx)) return;

    const paths = foundry.utils.deepClone(
      this.actor.system.transformationCustomization?.uniquePaths || []
    );
    if (upIdx < 0 || upIdx >= paths.length) return;
    paths.splice(upIdx, 1);
    await this.actor.update({
      "system.transformationCustomization.uniquePaths": paths
    });
  }

  // -------------------------------------------------------
  // God Ki / God Maneuvers
  // -------------------------------------------------------

  async _onAddGodManeuver(event) {
    event.preventDefault();
    const catalog = CONFIG.DBU?.godManeuvers || {};
    const current = this.actor.system.godManeuvers || [];
    const available = Object.values(catalog).filter(m => !current.includes(m.id));

    if (!available.length) {
      ui.notifications.warn("All God Maneuvers have already been added.");
      return;
    }

    const options = available.map(m =>
      `<option value="${m.id}">${m.name} — ${m.frequency} (${m.dkpCost} DKP)</option>`
    ).join("");

    const content = `
      <form>
        <div class="form-group">
          <label>Select God Maneuver</label>
          <select name="maneuver">${options}</select>
        </div>
      </form>`;

    new Dialog({
      title: "Add God Maneuver",
      content,
      buttons: {
        add: {
          icon: '<i class="fas fa-plus"></i>',
          label: "Add",
          callback: async (html) => {
            const id = html.find("[name=maneuver]").val();
            if (!id) return;
            const updated = [...current, id];
            await this.actor.update({ "system.godManeuvers": updated });
          }
        },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel" }
      },
      default: "add"
    }).render(true);
  }

  async _onRemoveGodManeuver(event) {
    event.preventDefault();
    const current = this.actor.system.godManeuvers || [];
    if (!current.length) {
      ui.notifications.warn("No God Maneuvers to remove.");
      return;
    }

    const catalog = CONFIG.DBU?.godManeuvers || {};
    const options = current.map(id => {
      const m = catalog[id];
      return `<option value="${id}">${m?.name || id}</option>`;
    }).join("");

    const content = `
      <form>
        <div class="form-group">
          <label>Select God Maneuver to Remove</label>
          <select name="maneuver">${options}</select>
        </div>
      </form>`;

    new Dialog({
      title: "Remove God Maneuver",
      content,
      buttons: {
        remove: {
          icon: '<i class="fas fa-trash"></i>',
          label: "Remove",
          callback: async (html) => {
            const id = html.find("[name=maneuver]").val();
            if (!id) return;
            const updated = current.filter(m => m !== id);
            await this.actor.update({ "system.godManeuvers": updated });
          }
        },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel" }
      },
      default: "remove"
    }).render(true);
  }

  async _onGodStrikeProfile(event) {
    event.preventDefault();
    const val = event.currentTarget.value;
    await this.actor.update({ "system.godStrikeProfile": val });
  }

  // -------------------------------------------------------
  // Lookup Handlers (Attack Ref Tab)
  // -------------------------------------------------------

  /**
   * Handle advantage/disadvantage lookup selection.
   */
  _onAttackRefLookup(event) {
    const val = event.currentTarget.value;
    const resultDiv = this.element.find("#advdisLookupResult")[0];
    if (!resultDiv) return;

    if (!val) {
      resultDiv.innerHTML = '<div class="ar-lookup-empty">Select an entry to view details</div>';
      return;
    }

    const config = CONFIG.DBU ?? {};
    let data = config.techniqueAdvantagesData?.[val];
    let type = "adv";

    if (!data) {
      data = config.techniqueDisadvantagesData?.[val];
      type = "dis";
    }

    if (!data) {
      resultDiv.innerHTML = '<div class="ar-lookup-empty">Entry not found</div>';
      return;
    }

    const tpDisplay = Array.isArray(data.tpPerRank) ? data.tpPerRank.join("/") : data.tpPerRank;

    resultDiv.innerHTML = `
      <div class="ar-lookup-card">
        <div class="ar-lookup-name">${val}</div>
        <div class="ar-lookup-row">
          <span class="ar-lk-label">Type:</span> 
          <span class="${type === 'adv' ? 'ar-lk-adv' : 'ar-lk-dis'}">${type === 'adv' ? 'Advantage' : 'Disadvantage'}</span>
        </div>
        <div class="ar-lookup-row"><span class="ar-lk-label">TP/Rank:</span> ${tpDisplay}</div>
        <div class="ar-lookup-row"><span class="ar-lk-label">Max Ranks:</span> ${data.maxRanks || 5}</div>
        ${data.requirement ? `<div class="ar-lookup-row"><span class="ar-lk-label">Restriction:</span> ${data.requirement}</div>` : ''}
        ${data.effect ? `<div class="ar-lookup-row"><span class="ar-lk-label">Effect:</span> ${data.effect}</div>` : ''}
      </div>
    `;
  }

  /**
   * Handle state/condition lookup selection.
   */
  _onStateLookup(event) {
    const val = event.currentTarget.value;
    const resultDiv = this.element.find("#stateLookupResult")[0];
    if (!resultDiv) return;

    if (!val) {
      resultDiv.innerHTML = '<div class="ar-lookup-empty">Select a condition to view details</div>';
      return;
    }

    // Default conditions list matching _getCombatConditions logic
    const defaults = this._getCombatConditions(this.actor.system).map(c => ({
      id: c.id, name: c.name, maxStacks: c.maxStacks, effect: c.effect
    }));

    const cond = defaults.find(c => c.name === val);
    if (!cond) {
      resultDiv.innerHTML = '<div class="ar-lookup-empty">Condition not found</div>';
      return;
    }

    // Check if active on this actor
    const stored = (this.actor.system.conditions || []).find(c => c.id === cond.id);
    const isActive = stored?.active ?? false;
    const stacks = stored?.stacks ?? 0;

    resultDiv.innerHTML = `
      <div class="ar-lookup-card">
        <div class="ar-lookup-name">${cond.name} ${isActive ? `<span class="ar-lk-active">ACTIVE ${cond.maxStacks > 1 ? `(${stacks}/${cond.maxStacks})` : ''}</span>` : ''}</div>
        <div class="ar-lookup-row"><span class="ar-lk-label">Max Stacks:</span> ${cond.maxStacks}</div>
        <div class="ar-lookup-row"><span class="ar-lk-label">Effect:</span> ${cond.effect}</div>
      </div>
    `;
  }
}
