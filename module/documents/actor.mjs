/**
 * Extend the base Actor document for the DBU-OLD system.
 * All character stat calculations are ported from app.js.
 * @extends {Actor}
 */
import { applySaiyanBonuses } from "../racial-automation/saiyan.mjs";
import { applyEarthlingBonuses } from "../racial-automation/earthling.mjs";
import { applyMajinBonuses } from "../racial-automation/majin.mjs";
import { applyBioAndroidBonuses } from "../racial-automation/bio-android.mjs";
import { applyAndroidBonuses } from "../racial-automation/android.mjs";
import { applyArcosianBonuses } from "../racial-automation/arcosian.mjs";
import { applyCerealianBonuses } from "../racial-automation/cerealian.mjs";
import { applyNamekianBonuses } from "../racial-automation/namekian.mjs";
import { applyNekoMajinBonuses } from "../racial-automation/neko-majin.mjs";
import { applyNeoTuffleBonuses } from "../racial-automation/neo-tuffle.mjs";
import { applyShadowDragonBonuses } from "../racial-automation/shadow-dragon.mjs";
import { applyShinjinBonuses } from "../racial-automation/shinjin.mjs";
import { applyUndeadBonuses } from "../racial-automation/undead.mjs";
import { applyCustomSpeciesBonuses } from "../racial-automation/custom-species.mjs";
import { applyManifestedPowerBonuses } from "../racial-automation/manifested-powers.mjs";
import { applyEnhancementPowerBonuses } from "../racial-automation/enhancement-powers.mjs";
import { applyAlternateFormBonuses } from "../racial-automation/alternate-forms.mjs";
import { applyLegendaryFormBonuses } from "../racial-automation/legendary-forms.mjs";
import { applyLegendaryTraitBonuses } from "../racial-automation/legendary-traits.mjs";
import { applyTalentBonuses } from "../racial-automation/talents.mjs";
import { applyEquipmentQualityBonuses } from "../equipment-automation/qualities.mjs";
import { applyBestialTraitBonuses } from "../racial-automation/bestial-traits.mjs";

export class DBUActor extends Actor {

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === "character") {
      try {
        this._prepareCharacterData(this.system);
      } catch (err) {
        console.error("DBU-OLD | prepareDerivedData failed:", err);
      }
    }
    if (this.type === "battleJacket") {
      try {
        this._prepareBattleJacketData(this.system);
      } catch (err) {
        console.error("DBU-OLD | BJ prepareDerivedData failed:", err);
      }
    }
  }

  // =============================================================
  // Character Data Preparation
  // =============================================================

  _prepareCharacterData(system) {
    let tier = system.tier;
    let baseTier = system.baseTier;
    const level = system.level || 1;

    // Cache gained active transformations from OSF once for all calculations
    system._gainedActiveTransformations = DBUActor._getActiveGainedTransformations(system);

    // ---- New Level of Power: +1 Tier while in a NLoP-marked transformation ----
    const nlopActive = system.transformationMeta?.nlopActiveEncounter || [];
    let nlopTierBoost = 0;
    if (nlopActive.length > 0) {
      const allTransForNlop = [...(system.transformations || []), ...system._gainedActiveTransformations];
      for (const trans of allTransForNlop) {
        if (trans.active && nlopActive.includes(trans.name)) {
          nlopTierBoost = 1;
          break;
        }
      }
    }
    if (nlopTierBoost > 0) {
      tier += nlopTierBoost;
      // baseTier stays unchanged — only modified by PL, not NLOP
      system.tier = tier;
      system.nlopTierBoost = nlopTierBoost;
    }

    // ---- Custom buff: ToP (Breakthrough) — adds flat tier bumps ----
    const breakthroughBuff = this._getBuffTotal(system, "ToP (Breakthrough)");
    if (breakthroughBuff !== 0) {
      tier += breakthroughBuff;
      system.tier = tier;
    }

    // ---- Aggregate skill ranks from progression rows ----
    // Build name→id map (progression stores names like "Clairvoyance", skills tab uses IDs like "clairvoyance")
    const skillNameToId = {};
    for (const sd of (CONFIG.DBU?.skillsData || [])) {
      skillNameToId[sd.name] = sd.id;
      skillNameToId[sd.id] = sd.id; // also accept id directly
    }
    const skillRanks = {};
    const progRows = system.progressionRows || [];
    for (const row of progRows) {
      if (row.perkType === "racial_stats") continue;
      if ((row.level || 0) > level) continue;
      for (let i = 0; i < 6; i++) {
        const val = row[`skill${i}`];
        if (val && String(val).trim()) {
          const skillId = skillNameToId[val] || val.toLowerCase();
          skillRanks[skillId] = (skillRanks[skillId] || 0) + 1;
        }
      }
    }
    // For regular fusion actors, preserve DB-saved fusion skills (highest of both)
    const fusionData = system.fusion || {};
    const isRegularFusion = fusionData.isFusion
      && fusionData.type !== "one-sided-absorption"
      && fusionData.type !== "one-sided-possession"
      && (fusionData.fusedCharacterIds || []).length > 0;
    const baseSkills = isRegularFusion ? (system.skills || {}) : {};
    const skillsObj = {};
    for (const [key, data] of Object.entries(baseSkills)) {
      const r = typeof data === "object" ? (data.rank || 0) : (Number(data) || 0);
      if (r > 0) skillsObj[key] = { rank: r };
    }
    for (const [key, count] of Object.entries(skillRanks)) {
      const existing = skillsObj[key]?.rank || 0;
      skillsObj[key] = { rank: Math.max(existing, count) };
    }
    system.skills = skillsObj;

    // ---- Attribute Modifiers (with transformations, auras, buffs) ----
    this._calculateAttributeModifiers(system, tier);

    // ---- One-Sided Fusion Attribute Bonuses ----
    this._applyOneSidedFusionBonuses(system, tier, baseTier);

    // ---- Regular Fusion / Fission Bonuses ----
    this._applyRegularFusionBonuses(system, tier, baseTier);

    // ---- Racial proficient save ----
    // Fusion: use stored multi-save from composite races. Possession: host race. Normal: own race.
    if (system.fusion?._fusionProficientSaves?.length) {
      system.proficientSave = system.fusion._fusionProficientSaves[0];
      system.fusion._allProficientSaves = system.fusion._fusionProficientSaves;
    } else {
      const effectiveRace = system.fusion?._possessionRace || system.race;
      if (effectiveRace === "customSpecies") {
        system.proficientSave = system.customSpeciesSave || "corporeal";
      } else {
        system.proficientSave = DBUActor.RACIAL_SAVES[effectiveRace] || "corporeal";
      }
    }

    // ---- Early Mutation Effects (must run before resources/thresholds/combat stats) ----
    this._applyEarlyMutationEffects(system, tier, baseTier);

    // ---- Resources ----
    this._calculateResources(system, level, tier, baseTier);

    // ---- Saving Throws ----
    this._calculateSavingThrows(system, tier);

    // ---- Health Thresholds ----
    this._calculateThresholds(system, tier, baseTier);

    // ---- Combat Stats (size-dependent) ----
    this._calculateCombatStats(system, tier, baseTier);

    // ---- Custom buff: ToP / Greater Extra Dice Category bonuses ----
    // Each variant routes to a specific sub-bucket of system.dicePools.
    // Use `=` (not `+=`) since system.dicePools is a persistent SchemaField that
    // doesn't get reset between prep cycles in memory.
    if (!system.dicePools) system.dicePools = {};
    system.dicePools.topCatBonus = {
      global: this._getBuffTotal(system, "ToP Extra Dice Cat."),
      strike: this._getBuffTotal(system, "ToP Extra Dice Cat. (Strike)"),
      wound:  this._getBuffTotal(system, "ToP Extra Dice Cat. (Wound)"),
      dodge:  this._getBuffTotal(system, "ToP Extra Dice Cat. (Dodge)")
    };
    system.dicePools.greaterCatBonus = {
      global: this._getBuffTotal(system, "Greater Dice Category")
            + this._getBuffTotal(system, "Greater Dice (All)"),
      strike: this._getBuffTotal(system, "Greater Dice (Strike)"),
      wound:  this._getBuffTotal(system, "Greater Dice (Wound)"),
      dodge:  this._getBuffTotal(system, "Greater Dice (Dodge)")
    };
    // ToP Extra Dice — number of times the ToP dice apply (default 1 for global)
    system.dicePools.topApplyCount = {
      global: 1 + this._getBuffTotal(system, "ToP Extra Dice (All)"),
      strike: this._getBuffTotal(system, "ToP Extra Dice (Strike)"),
      wound:  this._getBuffTotal(system, "ToP Extra Dice (Wound)"),
      dodge:  this._getBuffTotal(system, "ToP Extra Dice (Dodge)")
    };
    // Extra dN dice pools — flat additions of specific dice sizes per roll type
    if (!system.dicePools.extraDice) {
      system.dicePools.extraDice = {
        combatRolls: { d4: 0, d6: 0, d8: 0, d10: 0 },
        strike: { d4: 0, d6: 0, d8: 0, d10: 0 },
        dodge: { d4: 0, d6: 0, d8: 0, d10: 0 },
        wound: { d4: 0, d6: 0, d8: 0, d10: 0 }
      };
    }
    for (const die of ["d4", "d6", "d8", "d10"]) {
      system.dicePools.extraDice.combatRolls[die] = this._getBuffTotal(system, `Extra ${die} (Combat Rolls)`);
      system.dicePools.extraDice.strike[die] = this._getBuffTotal(system, `Extra ${die} (Strike)`);
      system.dicePools.extraDice.dodge[die]  = this._getBuffTotal(system, `Extra ${die} (Dodge)`);
      system.dicePools.extraDice.wound[die]  = this._getBuffTotal(system, `Extra ${die} (Wound)`);
    }
    // Surging Extra Dice — bonus dice for Surging state
    system.aptitudes.surgingExtraDice = this._getBuffTotal(system, "Surging Extra Dice");
    // Signature Technique bonuses — applied when rolling a Signature Tech
    system.dicePools.signature = {
      ctStrike: this._getBuffTotal(system, "Signature CT (Strike)"),
      strikeBonus: this._getBuffTotal(system, "Signature Strike"),
      ctWound: this._getBuffTotal(system, "Signature CT (Wound)"),
      woundBonus: this._getBuffTotal(system, "Signature Wound"),
      topAll: this._getBuffTotal(system, "Signature Extra ToP Dice (All)"),
      topStrike: this._getBuffTotal(system, "Signature Extra ToP Dice (Strike)"),
      topWound: this._getBuffTotal(system, "Signature Extra ToP Dice (Wound)"),
      diceAll: { d4: 0, d6: 0, d8: 0, d10: 0 },
      diceStrike: { d4: 0, d6: 0, d8: 0, d10: 0 },
      diceWound: { d4: 0, d6: 0, d8: 0, d10: 0 }
    };
    for (const die of ["d4","d6","d8","d10"]) {
      system.dicePools.signature.diceAll[die] = this._getBuffTotal(system, `Signature ${die} (All)`);
      system.dicePools.signature.diceStrike[die] = this._getBuffTotal(system, `Signature ${die} (Strike)`);
      system.dicePools.signature.diceWound[die] = this._getBuffTotal(system, `Signature ${die} (Wound)`);
    }

    // Misc late-stage buffs (#157-174)
    system.aptitudes.duelClashBonus = this._getBuffTotal(system, "Duel Clash Bonus");
    system.aptitudes.armedStrike = this._getBuffTotal(system, "Armed Strike");
    system.aptitudes.armedWound = this._getBuffTotal(system, "Armed Wound");
    system.aptitudes.unarmedStrike = this._getBuffTotal(system, "Unarmed Strike");
    system.aptitudes.unarmedWound = this._getBuffTotal(system, "Unarmed Wound");
    system.aptitudes.kiCostAttacks = this._getBuffTotal(system, "Ki Point Cost Attacks");
    system.aptitudes.kiCostAttacksNoCap = this._getBuffTotal(system, "Ki Point Cost Attacks (no cap)");
    system.aptitudes.kiCostUnique = this._getBuffTotal(system, "Ki Point Cost Unique Abilities");
    system.aptitudes.kiCostUniqueMagical = this._getBuffTotal(system, "Ki Point Cost Unique Abilities (Magical)");
    system.aptitudes.kiCostUniqueTechnical = this._getBuffTotal(system, "Ki Point Cost Unique Abilities (Technical)");
    system.aptitudes.energyChargeDiceCategory = this._getBuffTotal(system, "Energy Charge Dice Category");
    system.aptitudes.signatureEnergyChargeDiceCategory = this._getBuffTotal(system, "Signature Energy Charge Dice Category");
    system.aptitudes.ragingDiceSize = this._getBuffTotal(system, "Raging Dice Size");
    system.aptitudes.surgingDiceSize = this._getBuffTotal(system, "Surging Dice Size");
    system.aptitudes.superiorDiceSize = this._getBuffTotal(system, "Superior Dice Size");
    system.aptitudes.attackingDamageCategory = this._getBuffTotal(system, "Attacking Damage Category");
    system.aptitudes.ignoreTransformationLite = this._getBuffTotal(system, "Ignore Transformation Lite") > 0;
    system.aptitudes.bludgeonedFlag = this._getBuffTotal(system, "I'm being Bludgeoned") > 0;
    // "States" — added to combat rolls while any combat state is active (header-style buff)
    const anyStateActive = !!(system.combatStates?.raging || system.combatStates?.surging
      || system.combatStates?.mindful || system.combatStates?.superior || system.combatStates?.undying);
    system.aptitudes.statesBonus = anyStateActive ? this._getBuffTotal(system, "States") : 0;

    // ---- Transformation Aspect Automation ----
    this._applyTransformationAspects(system, tier, baseTier);

    // ---- Mastery Conditional Effects ----
    this._applyMasteryConditionals(system, tier, baseTier);

    // ---- Legendary Trait Automation (permanent, always active) ----
    applyLegendaryTraitBonuses(system, tier, baseTier);

    // ---- Compute disabled racial passives (effect panel toggles) ----
    system._disabledRacialPassives = this._computeDisabledRacialPassives(system);

    // ---- Racial Trait Automation ----
    this._calculateRacialTraitBonuses(system, tier, baseTier);

    // ---- Manifested Power Trait Automation ----
    applyManifestedPowerBonuses(system, tier, baseTier);

    // ---- Enhancement Power Trait Automation ----
    applyEnhancementPowerBonuses(system, tier, baseTier);

    // ---- Alternate Form Trait Automation ----
    applyAlternateFormBonuses(system, tier, baseTier);

    // ---- Legendary Form Trait Automation ----
    applyLegendaryFormBonuses(system, tier, baseTier);

    // ---- Bestial Trait Automation ----
    applyBestialTraitBonuses(system, tier, baseTier);

    // ---- Talent Automation ----
    applyTalentBonuses(system, tier, baseTier);

    // ---- Damage Reduction Finalizer ----
    // Now that racial + talent + bestial DR additions are accumulated in
    // system.status.dr and talentBonuses.totals.dr, fold them into the displayed total.
    system.status.damageReduction = (system.status.damageReduction || 0)
      + (system.status.dr || 0)
      + (system.talentBonuses?.totals?.dr || 0);

    // ---- Equipment Quality Automation (apparel/weapon qualities) ----
    applyEquipmentQualityBonuses(this, system, tier, baseTier);

    // ---- Clamp Attribute totalScores to minimum ----
    // Applied after ALL automation that can modify totalScore
    // (transformations, fusions, aspects, manifested/alternate/legendary/talent bonuses).
    // Insight (IN) has a minimum of 1; all others minimum 0.
    for (const key of ["ag", "fo", "te", "ma", "pe", "sc", "in"]) {
      const attr = system.attributes[key];
      if (!attr) continue;
      const floor = key === "in" ? 1 : 0;
      if (attr.totalScore < floor) attr.totalScore = floor;
    }

    // ---- Stress Bonus Finalizers ----
    // Base (level + PE/10) was set in _calculateCombatStats.
    // Racial automation functions accumulated their bonuses above.
    // Now add remaining sources that don't belong in any single automation file.

    // Mastered transformation count: +1 per mastered transformation (own + gained active)
    const masteredCount = (system.transformations || []).filter(t => t.mastered).length
      + (system._gainedActiveTransformations || []).filter(t => t.mastered).length;
    system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + masteredCount;

    // Active signature aura: +1 (own or gained from one-sided fusion)
    const hasActiveAura = (system.signatureAuras || []).some(a => a.active) || !!(system.fusion?.activeGainedAuraId);
    if (hasActiveAura) system.aptitudes.stressBonus += 1;

    // Buff system: custom buffs + derived buffs with effect "Stress Bonus"
    system.aptitudes.stressBonus += this._getBuffTotal(system, "Stress Bonus");

    // NLoP: +1(bT) if NLoP transformation is active this encounter
    // Reuses nlopTierBoost computed at line 51 (> 0 means active NLoP trans found)
    if (nlopTierBoost > 0) system.aptitudes.stressBonus += (system.baseTier || 1);

    // Racial trait text scan: "increase your stress bonus by 1"
    const stressTraitCatalog = CONFIG.DBU?.racialTraitsCatalog || {};
    const stressTraitIds = system.racialTraits || [];
    const allStressTraits = [];
    for (const [, traits] of Object.entries(stressTraitCatalog)) {
      for (const trait of traits) allStressTraits.push(trait);
    }
    for (const traitId of stressTraitIds) {
      const trait = allStressTraits.find(t => t.id === traitId);
      if (!trait) continue;
      for (const eff of (trait.effects || [])) {
        if (eff.activationType !== "passive") continue;
        const txt = (eff.text || "").toLowerCase();
        if (txt.includes("increase your stress bonus by 1") || txt.includes("increase stress bonus by 1")) {
          system.aptitudes.stressBonus += 1;
        }
      }
    }

    // ---- Battle Born: add stack bonuses to combat roll totals ----
    // bb.strikeBonus/dodgeBonus/woundBonus are computed in applySaiyanBonuses (racial automation)
    // but need to be added to the buff totals AFTER all automation has run.
    const bb = system.battleBorn || {};
    if (bb.strikeBonus) system.aptitudes.strikeBuffTotal = (system.aptitudes.strikeBuffTotal || 0) + bb.strikeBonus;
    if (bb.dodgeBonus) system.aptitudes.dodgeBuffTotal = (system.aptitudes.dodgeBuffTotal || 0) + bb.dodgeBonus;
    if (bb.woundBonus) system.aptitudes.woundBuffTotal = (system.aptitudes.woundBuffTotal || 0) + bb.woundBonus;

    // ---- Damage Calculator derived values ----
    this._calculateDamageCalc(system, tier, baseTier);

    // ---- Adversary stat modifications ----
    this._calculateAdversaryStats(system, level, tier, baseTier);

    // ---- Battle Jacket piloting overrides (must be last) ----
    this._applyBattleJacketPiloting(system);
  }

  // =============================================================
  // Attribute Modifiers
  // =============================================================

  /**
   * Calculate full attribute modifiers including bonuses from
   * active transformations, active auras, and custom buffs.
   */
  _calculateAttributeModifiers(system, tier) {
    for (const key of ["ag", "fo", "te", "sc", "in", "ma", "pe"]) {
      const attr = system.attributes[key];
      if (!attr) continue;

      // Base score is already computed by TypeDataModel (racial + progression)
      // Score Limit: "At ToP 1, Attribute Scores cannot exceed 8. For every ToP
      // after the first, increase this limit by 3." (attributes.txt)
      const scoreCap = 8 + (tier - 1) * 3;
      attr.score = Math.min(attr.score, scoreCap);

      let modifier = 0;

      // Transformation bonuses
      // Pre-scan: check if any Enhancement Power is active (for Pure Resolve doubling)
      const _hasActiveEnhancement = (system.transformations || []).some(t =>
        t.active && t.transformationType && t.transformationType.startsWith("enhancement"));
      const _optionSels = system.transformationOptionSelections || {};

      for (const [_tIdx, trans] of (system.transformations || []).entries()) {
        if (!trans.active) continue;
        // Prelude aspect (opt-in via trans.preludeActive): -1(T) AMB, minimum 1(T).
        // Rule: "reduce the Attribute Modifier Bonuses by 1(T) (cannot reduce below 1(T))"
        const hasPreludeAspect = (trans.aspects || []).some(a => String(a).trim() === "Prelude");
        const preludeApplies = hasPreludeAspect && trans.preludeActive;
        // Normal transformation attribute bonuses
        if (trans.attrBonuses) {
          const val = trans.attrBonuses[key];
          if (val) {
            let amb = DBUActor.parseAttrBonus(val, tier, system.baseTier);
            if (preludeApplies && amb > 0) {
              amb = Math.max(tier, amb - tier); // reduce by 1(T), floor at 1(T)
            }
            modifier += amb;
          }
        }

        // Pure Resolve: chosen AMBs +1, and doubling in Enhancement
        if (trans.catalogKey === "pure_resolve") {
          const prOpts = _optionSels[String(_tIdx)] || {};
          const chosenAttrs = prOpts.pureResolveChosenAttrs || [];
          let prExtra = 0;
          // +1 for each chosen attribute that matches this key
          if (chosenAttrs.includes(key)) prExtra += 1;
          // FO/MA linked: if FO is chosen, MA also gets +1 (and vice versa)
          if (key === "ma" && chosenAttrs.includes("fo")) prExtra += 1;
          if (key === "fo" && chosenAttrs.includes("ma")) prExtra += 1;
          modifier += prExtra;
          // In Enhancement: double ALL Pure Resolve AMBs (base + chosen extras)
          if (_hasActiveEnhancement) {
            const baseVal = trans.attrBonuses?.[key];
            const baseParsed = baseVal ? DBUActor.parseAttrBonus(baseVal, tier, system.baseTier) : 0;
            modifier += baseParsed + prExtra; // add again to double
          }
        }

        // Mastery additional attribute bonuses
        if (trans.mastered && trans.catalogKey) {
          const masteryCat = CONFIG.DBU?.masteryEffectsCatalog ?? {};
          const mastery = masteryCat[trans.catalogKey];
          if (mastery?.attrBonuses?.[key]) {
            modifier += DBUActor.parseAttrBonus(mastery.attrBonuses[key], tier, system.baseTier);
          }
          // Conditional attribute bonuses
          if (mastery?.conditionals) {
            for (const cond of mastery.conditionals) {
              if (cond.type === "attrBonus" && cond.attr === key) {
                if (DBUActor._evaluateMasteryCondition(cond.condition, system)) {
                  modifier += DBUActor.parseAttrBonus(cond.value, tier, system.baseTier);
                }
              }
            }
          }
        }
      }

      // Metamorphosis "Weakest State": if baseTier < S+1, reduce AG/FO/TE/MA by 1(T)
      if (["ag", "fo", "te", "ma"].includes(key)) {
        const METAMORPHOSIS_STAGES = { full_suppression: 0, limited_suppression: 1, partial_suppression: 2, true_form: 3 };
        for (const trans of (system.transformations || [])) {
          if (!trans.active) continue;
          const stage = METAMORPHOSIS_STAGES[trans.catalogKey];
          if (stage !== undefined) {
            const effectiveReq = stage + 1;
            if (system.baseTier < effectiveReq) {
              modifier -= tier;
            }
          }
        }
      }

      // Gained transformation bonuses (from OSF suppressed actors)
      const fusionForAttr = system.fusion || {};
      if (fusionForAttr.isFusion && (fusionForAttr.type === "one-sided-absorption" || fusionForAttr.type === "one-sided-possession")) {
        const activeGainedIds = fusionForAttr.activeGainedTransformationIds || [];
        for (const gainedKey of activeGainedIds) {
          const sepIdx = gainedKey.indexOf("_");
          if (sepIdx < 0) continue;
          const suppId = gainedKey.substring(0, sepIdx);
          const transId = Number(gainedKey.substring(sepIdx + 1));
          const suppActor = game.actors?.get(suppId);
          if (!suppActor) continue;
          const gainedTrans = (suppActor.system?.transformations || []).find(t => t.id === transId);
          if (!gainedTrans) continue;

          // Normal transformation attribute bonuses
          if (gainedTrans.attrBonuses?.[key]) {
            modifier += DBUActor.parseAttrBonus(gainedTrans.attrBonuses[key], tier, system.baseTier);
          }
          // Mastery attribute bonuses
          if (gainedTrans.mastered && gainedTrans.catalogKey) {
            const masteryCat = CONFIG.DBU?.masteryEffectsCatalog ?? {};
            const mastery = masteryCat[gainedTrans.catalogKey];
            if (mastery?.attrBonuses?.[key]) {
              modifier += DBUActor.parseAttrBonus(mastery.attrBonuses[key], tier, system.baseTier);
            }
            if (mastery?.conditionals) {
              for (const cond of mastery.conditionals) {
                if (cond.type === "attrBonus" && cond.attr === key) {
                  if (DBUActor._evaluateMasteryCondition(cond.condition, system)) {
                    modifier += DBUActor.parseAttrBonus(cond.value, tier, system.baseTier);
                  }
                }
              }
            }
          }
        }
      }

      // Hakai Unique Ability: +1(T) to FO and MA Modifiers (own or gained from OSF)
      if (key === "fo" || key === "ma") {
        let hasHakai = (system.uniqueAbilities || []).some(ua => ua.abilityKey === "hakai");
        if (!hasHakai && system.fusion?.isFusion && (system.fusion.type === "one-sided-absorption" || system.fusion.type === "one-sided-possession")) {
          for (const suppId of (system.fusion.suppressedCharacterIds || [])) {
            const suppActor = game.actors?.get(suppId);
            if (suppActor?.system?.uniqueAbilities?.some(ua => ua.abilityKey === "hakai")) { hasHakai = true; break; }
          }
        }
        if (hasHakai) modifier += tier;
      }

      // Custom buff bonuses (unified: flat + bT×baseTier + T×tier)
      // "X Score" buffs raise the underlying Attribute Score (affects Skills + Saves
      // since those use score, not totalScore — see attributes.txt).
      // "X Modifier" buffs raise the modifier only (affects totalScore but not Skills/Saves).
      const attrModKey = key.toUpperCase() + " Modifier";
      const attrScoreKey = key.toUpperCase() + " Score";
      attr.score += this._getBuffTotal(system, attrScoreKey);
      modifier += this._getBuffTotal(system, attrModKey);

      // Aura "Boosting" advantage bonuses
      const aura = this._getActiveAura(system);
      if (aura) {
        // Sparking aura base: +1(T) to FO and MA modifiers (modifiers only, skip score)
        if (aura.type === "Sparking" && (key === "fo" || key === "ma")) {
          modifier += tier;
        }

        // Boosting advantage: +ranks(T) to specific attribute in notes
        for (const adv of (aura.advantages || [])) {
          if (adv.name === "Boosting" && adv.notes) {
            if (adv.notes.toLowerCase().includes(key)) {
              modifier += (adv.ranks || 1) * tier;
            }
          }
        }
      }

      // Store results
      attr.modifier = modifier;
      attr.totalScore = attr.score + modifier;
    }
  }

  // =============================================================
  // Early Mutation Effects (before resources/thresholds/combat stats)
  // =============================================================

  /**
   * Apply mutation trait effects that must resolve before the main calculation chain.
   * Golden Fruit → permanent God Ki (before God Ki detection in _calculateResources)
   * Giant Gene → size override (before _calculateCombatStats)
   * Legendary → wound cap bonus (before _calculateRacialTraitBonuses/saiyan)
   */
  _applyEarlyMutationEffects(system, tier, baseTier) {
    const mutTrans = (system.transformations || []).find(t => t.active && t.catalogKey === "mutation");
    if (!mutTrans) return;

    const mutIdx = (system.transformations || []).indexOf(mutTrans);
    const mutOpts = system.transformationOptionSelections?.[String(mutIdx)] || {};
    const traitId = mutOpts.mutationTrait;
    if (!traitId) return;

    if (traitId === "golden_fruit" && system.godKi) {
      system.godKi.permanent = true;
    }
    if (traitId === "giant_gene") {
      system.baseSize = "enormous";
    }
    if (traitId === "legendary") {
      if (!system.transformationMeta) system.transformationMeta = {};
      if (!system.transformationMeta.mutationState) system.transformationMeta.mutationState = {};
      system.transformationMeta.mutationState.legendaryWoundCapBonus = 2;
    }

    // DNA Absorption: score-class attribute bonuses (must run before resources/combat stats)
    if (traitId === "dna_absorption") {
      const mutState = system.transformationMeta?.mutationState || {};
      const dnaStacks = Array.isArray(mutState.dnaStacks) ? mutState.dnaStacks : [];
      const activeIdx = typeof mutState.activeDnaStackIndex === "number" ? mutState.activeDnaStackIndex : -1;
      if (activeIdx >= 0 && activeIdx < dnaStacks.length) {
        const activeStack = dnaStacks[activeIdx];
        const attrKeys = ["ag", "fo", "te", "sc", "in", "ma", "pe"];
        for (const key of attrKeys) {
          const suppScore = activeStack?.attributes?.[key] ?? 0;
          if (suppScore <= 0) continue;
          const bonus = Math.min(Math.ceil(suppScore / 4), baseTier);
          if (bonus > 0 && system.attributes[key]) {
            system.attributes[key].score = (system.attributes[key].score || 0) + bonus;
            system.attributes[key].totalScore = (system.attributes[key].score || 0) + (system.attributes[key].modifier || 0);
          }
        }
      }
    }

    // Were-creature Traditional: modifier-class attribute bonuses (must run before combat stats)
    if (traitId === "were_creature") {
      const mutState = system.transformationMeta?.mutationState || {};
      if (mutState.wereCreatureActive && mutState.wereCreatureOption === "traditional") {
        const selectedAttrs = Array.isArray(mutState.wereCreatureAttributes) ? mutState.wereCreatureAttributes : [];
        const validAttrs = ["ag", "fo", "te", "ma"];
        for (const key of selectedAttrs) {
          if (!validAttrs.includes(key)) continue;
          if (system.attributes[key]) {
            system.attributes[key].modifier = (system.attributes[key].modifier || 0) + tier;
            system.attributes[key].totalScore = (system.attributes[key].score || 0) + system.attributes[key].modifier;
          }
        }
      }
    }
  }

  // =============================================================
  // Resources: LP, Ki, Capacity
  // =============================================================

  _calculateResources(system, level, tier, baseTier) {
    // --- Max Life Points ---
    // Formula: 48 + PL × (12 + RLM + 2×TE score) + modifyLife
    // Fusion: use stored highest RLM. Possession: host race. Normal: own race.
    // Rule: "add twice your Tenacity Score" (attributes.txt) — Score, not Modifier
    const teScore = system.attributes.te?.score ?? 0;
    let rlm;
    if (system.fusion?._fusionRLM != null) {
      rlm = system.fusion._fusionRLM;
    } else {
      const effectiveRaceForLP = system.fusion?._possessionRace || system.race;
      rlm = DBUActor.RACIAL_LIFE_MODIFIERS[effectiveRaceForLP] || 3;
    }
    const modifyLife = system.lifePoints?.modify || 0;
    // Custom buff "Racial Life Modifier" — added to rlm before the formula uses it (scales by level)
    rlm += this._getBuffTotal(system, "Racial Life Modifier");
    system.lifePoints.max = 48 + (level * (12 + rlm + (2 * teScore))) + modifyLife;
    // Custom buff "Max Life Points" (unified: flat + bT×baseTier + T×tier)
    system.lifePoints.max += this._getBuffTotal(system, "Max Life Points");
    // Custom buff "Max Life Points ±1/4" — each unit adds 1/4 of base max (pre-buff)
    const lpQuarterBuff = this._getBuffTotal(system, "Max Life Points ±1/4");
    if (lpQuarterBuff !== 0) {
      const baseLpMax = system.lifePoints.max;
      system.lifePoints.max += lpQuarterBuff * Math.floor(baseLpMax / 4);
    }
    // Mutation Evolutionary Peak: +2 LP per Power Level (check own + gained transformations)
    const allTransForMutation = [...(system.transformations || []), ...(system._gainedActiveTransformations || [])];
    let hasMutationActive = false;
    for (const trans of allTransForMutation) {
      if (trans.active && trans.catalogKey === "mutation") {
        system.lifePoints.max += 2 * level;
        hasMutationActive = true;
        break;
      }
    }
    // Mutation Dark Vassal: reduce LP by (numBestialTraits × PL) — must happen before thresholds
    // Only apply if the selected mutation trait is actually dark_vassal (stale data guard)
    if (hasMutationActive) {
      const dvTrans = (system.transformations || []).find(t => t.active && t.catalogKey === "mutation");
      const dvIdx = dvTrans ? (system.transformations || []).indexOf(dvTrans) : -1;
      const dvOpts = dvIdx >= 0 ? (system.transformationOptionSelections?.[String(dvIdx)] || {}) : {};
      if (dvOpts.mutationTrait === "dark_vassal") {
        const mutState = system.transformationMeta?.mutationState || {};
        const bestialTraitsRaw = Array.isArray(mutState.darkVassalBestialTraits) ? mutState.darkVassalBestialTraits : [];
        // Count only valid bestial trait IDs (normalize legacy names, filter invalid)
        const _btCatalog = CONFIG.DBU?.bestialTraitsCatalog || [];
        const _btNameMap = {};
        for (const t of _btCatalog) _btNameMap[t.name] = t.id;
        const _btValidIds = new Set(_btCatalog.map(t => t.id));
        const validCount = bestialTraitsRaw.filter(v => {
          const id = v?.startsWith("bestial_") ? v : (_btNameMap[v] || null);
          return id && _btValidIds.has(id);
        }).length;
        if (validCount > 0) {
          system.lifePoints.max = Math.max(1, system.lifePoints.max - (validCount * level));
        }
      }
    }
    // Default current LP to max only when truly unset (null/undefined), not when 0
    if (system.lifePoints.value == null) system.lifePoints.value = system.lifePoints.max;

    // --- Max Ki Pool ---
    // Formula: 50 + (PL - 1) × 12 + modifyKi
    const modifyKi = system.kiPool?.modify || 0;
    system.kiPool.max = 50 + ((level - 1) * 12) + modifyKi;
    // Custom buff "Max Ki Points" / "Max Ki Pool" (unified: flat + bT×baseTier + T×tier)
    system.kiPool.max += this._getBuffTotal(system, "Max Ki Points");
    // Custom buff "Max Ki Pool ±1/4" — each unit adds 1/4 of base max (pre-buff)
    const kpQuarterBuff = this._getBuffTotal(system, "Max Ki Pool ±1/4");
    if (kpQuarterBuff !== 0) {
      const baseKpMax = system.kiPool.max;
      system.kiPool.max += kpQuarterBuff * Math.floor(baseKpMax / 4);
    }
    // Mutation Evolutionary Peak: +2 KP per Power Level (check own + gained transformations)
    for (const trans of allTransForMutation) {
      if (trans.active && trans.catalogKey === "mutation") {
        system.kiPool.max += 2 * level;
        break;
      }
    }
    // Default current KP to max only when truly unset (null/undefined), not when 0
    if (system.kiPool.value == null) system.kiPool.value = system.kiPool.max;

    // --- Max Capacity ---
    // Formula: (16 + 4 × PL) × Power_Capacity_Multiplier × ... / 2^Fatigued
    // Power_Capacity_Multiplier = 1 + 0.25 × Power_Stacks (each stack = +25% capacity)
    // Halved per Fatigued stack
    const powerStacks = system.tracking?.powerStacks || 0;
    const powerCapMult = 1 + 0.25 * powerStacks;
    let capacity = Math.floor((20 + ((level - 1) * 4)) * powerCapMult);
    const fatiguedStacks = this._getConditionStacks(system, "fatigued");
    for (let i = 0; i < fatiguedStacks; i++) {
      capacity = Math.floor(capacity / 2);
    }
    system.capacity.max = capacity;
    // Custom buff "Max Capacity" (flat add)
    system.capacity.max += this._getBuffTotal(system, "Max Capacity");
    // Custom buff "Max Capacity ±1/4" — each unit adds 1/4 of base max (pre-buff)
    const capQuarterBuff = this._getBuffTotal(system, "Max Capacity ±1/4");
    if (capQuarterBuff !== 0) {
      const baseCap = system.capacity.max;
      system.capacity.max += capQuarterBuff * Math.floor(baseCap / 4);
    }

    // --- Resolve Aspects for active transformations (with catalog fallback) ---
    const catalog = CONFIG.DBU?.transformationsCatalog || {};
    for (const trans of (system.transformations || [])) {
      if (!trans.active) continue;
      if ((!trans.aspects || trans.aspects.length === 0) && trans.catalogKey) {
        const catEntry = catalog[trans.catalogKey];
        if (catEntry?.aspects?.length) trans.aspects = [...catEntry.aspects];
      }
    }
    // Also resolve for gained active transformations (OSF)
    const gainedActiveTrans = system._gainedActiveTransformations || [];
    for (const trans of gainedActiveTrans) {
      if ((!trans.aspects || trans.aspects.length === 0) && trans.catalogKey) {
        const catEntry = catalog[trans.catalogKey];
        if (catEntry?.aspects?.length) trans.aspects = [...catEntry.aspects];
      }
    }

    // --- Ki Multiplier (Alternate Forms & Legendary Forms) ---
    // While in an AF or LF: max KP doubled, max Capacity increased by 1/2
    const meta = system.transformationMeta || {};
    let kiMultActive = false;
    let turbulentPowerActive = false;
    let stepByStepReduction = 0;

    const allActiveTransForRules = [...(system.transformations || []), ...gainedActiveTrans];
    for (const trans of allActiveTransForRules) {
      if (!trans.active) continue;
      const tt = trans.transformationType || "";
      if (tt === "form_alternate" || tt === "form_legendary") {
        if (trans.catalogKey !== "full_suppression") kiMultActive = true;
        const trMatch = String(trans.tierRequirement || "").match(/(\d+)/);
        if (trMatch) stepByStepReduction = Math.max(stepByStepReduction, parseInt(trMatch[1]));
      }
      if (["enhancement_standard", "enhancement_special", "enhancement_transcendent"].includes(tt)) {
        turbulentPowerActive = true;
      }
    }

    // Allow user override (e.g., "off" disables Ki Multiplier, or via Surging Strength)
    if (meta.kiMultOverride === "off" || meta.kiMultOverride === "0") kiMultActive = false;

    // Store base KP max before Ki Multiplier (for DKP calculation)
    const baseKiMax = system.kiPool.max;

    if (kiMultActive) {
      system.kiPool.max *= 2;
      system.capacity.max = Math.floor(system.capacity.max * 1.5);
    }

    // --- Combined Stress Test ---
    // Highest stress test + 1/2 of other active transformations' stress tests (own + gained)
    // Prelude rule: "reduce this Transformation's Stress Test Requirement by 5"
    let combinedStressTest = 0;
    const activeStressTests = [];
    for (const trans of allActiveTransForRules) {
      if (!trans.active) continue;
      let st = Number(trans.stressTest) || 0;
      const hasPreludeAspect = (trans.aspects || []).some(a => String(a).trim() === "Prelude");
      if (hasPreludeAspect && trans.preludeActive) st = Math.max(0, st - 5);
      if (st > 0) activeStressTests.push(st);
    }
    if (activeStressTests.length > 0) {
      activeStressTests.sort((a, b) => b - a);
      combinedStressTest = activeStressTests[0];
      for (let i = 1; i < activeStressTests.length; i++) {
        combinedStressTest += Math.floor(activeStressTests[i] / 2);
      }
    }

    // Crimson Acclimation: +2 Combined ST when co-active transformation lacks Perfect Ki Control
    if (system.aspectEffects?.crimsonAcclimationActive) {
      combinedStressTest += 2;
    }

    // Store computed transformation rules for sheet display
    system.transformationRules = {
      kiMultiplierActive: kiMultActive,
      turbulentPowerActive,
      stepByStepReduction,
      combinedStressTest,
      baseCapacityRestore: Math.floor(20 + ((level - 1) * 4)) // base max capacity for Ki Multiplier restore
    };

    // --- God Ki Detection & DKP ---
    // God Ki is active if: permanent flag is set, OR any active transformation has "God Ki" aspect
    let godKiActive = system.godKi?.permanent || false;
    if (!godKiActive) {
      for (const trans of [...(system.transformations || []), ...(system._gainedActiveTransformations || [])]) {
        if (!trans.active) continue;
        const aspects = trans.aspects || [];
        if (aspects.some(a => a.replace(/\s*\[LV~?\d*\]/i, "").replace(/\s*\([^)]*\)/g, "").trim() === "God Ki")) {
          godKiActive = true;
          break;
        }
      }
    }
    system.godKi.active = godKiActive;

    // DKP max = 6 × Power Level per god-ki.txt:20:
    // "starts each Combat Encounter with their maximum amount of DKP – an amount equal to 6x,
    // where x is equal to their Power Level"
    system.divineKiPoints.max = 6 * level;
    if (system.divineKiPoints.value == null && godKiActive) {
      system.divineKiPoints.value = system.divineKiPoints.max;
    }
    // Clamp current value if max decreased (e.g. PL down)
    if ((system.divineKiPoints.value || 0) > system.divineKiPoints.max) {
      system.divineKiPoints.value = system.divineKiPoints.max;
    }

    // God Ki State bonus: +3(T) to Wound and Soak (stored for formula use)
    system.godKi.woundBonus = godKiActive ? 3 * tier : 0;
    system.godKi.soakBonus = godKiActive ? 3 * tier : 0;

    // --- Derived status fields ---
    system.status.maxCapacity = system.capacity.max;
    system.status.capacityLeft = Math.max(0, system.capacity.max - (system.status.capacitySpent || 0));

    // --- Might = max(FO mod, MA mod) ---
    const foTotal = (system.attributes.fo?.score ?? 0) + (system.attributes.fo?.modifier ?? 0);
    const maTotal = (system.attributes.ma?.score ?? 0) + (system.attributes.ma?.modifier ?? 0);
    let might = Math.max(foTotal, maTotal);

    // --- Application of Skill talent: +ceil(IN_Mod/4) to Might ---
    // "While 3+ Attributes (including Insight) have a higher Score than FO and MA,
    //  increase Might Checks by 1/4 (rounded up) of your Insight Modifier." (talents.txt)
    const talents0 = system.talents || [];
    if (talents0.includes("application_of_skill")) {
      const scores = ["ag", "fo", "te", "sc", "in", "ma", "pe"].map(k => ({
        key: k, score: system.attributes[k]?.score ?? 0
      }));
      const foScore = scores.find(s => s.key === "fo")?.score ?? 0;
      const maScore = scores.find(s => s.key === "ma")?.score ?? 0;
      const maxFoMa = Math.max(foScore, maScore);
      const inScore = scores.find(s => s.key === "in")?.score ?? 0;
      // Count attributes with higher score than both FO and MA
      const higherCount = scores.filter(s => s.key !== "fo" && s.key !== "ma" && s.score > maxFoMa).length;
      if (higherCount >= 3 && inScore > maxFoMa) {
        const inMod = (system.attributes.in?.score ?? 0) + (system.attributes.in?.modifier ?? 0);
        let aosBonus = Math.ceil(inMod / 4);
        // Combat Wisdom: doubles the bonus
        if (talents0.includes("combat_wisdom")) aosBonus *= 2;
        might += aosBonus;
      }
    }
    // Custom buff "Might"
    might += this._getBuffTotal(system, "Might");
    system.status.might = might;
    // Custom buff "Might for Clashes" — separate stat used in Might Clashes only
    system.status.mightForClashes = might + this._getBuffTotal(system, "Might for Clashes");
    // Custom buff "Threshold Breaker" — bonus when crossing health thresholds (stored for downstream)
    system.aptitudes.thresholdBreaker = this._getBuffTotal(system, "Threshold Breaker");

    // --- Surgency = Force total ---
    const surgency = foTotal;

    // --- Healing Surge ---
    // Base: "2d10(T) Life Points" + Surgency (Force Modifier) (actions-combat.txt)
    // Talent bonuses: Resilience +1d4(T), Second Wind +2(T), Lion's Heart +2(T)/threshold
    // Never Surrender: treat ToP as +1 for (T) in surges
    const talents = system.talents || [];
    const surgeToP = talents.includes("never_surrender") ? tier + 1 : tier;
    // Compute thresholds crossed inline (thresholds.crossedCount isn't set until _calculateThresholds runs later)
    const _curLP = system.lifePoints?.value ?? system.lifePoints.max;
    const _maxLP = system.lifePoints.max;
    const _crossed = (_curLP <= Math.floor(_maxLP / 2) ? 1 : 0)
                   + (_curLP <= Math.floor(_maxLP / 4) ? 1 : 0)
                   + (_curLP <= Math.floor(_maxLP / 10) ? 1 : 0);
    let healParts = [`${2 * surgeToP}d10`];
    if (talents.includes("resilience")) healParts.push(`${surgeToP}d4`);
    let healFlat = surgency;
    if (talents.includes("second_wind")) healFlat += 2 * surgeToP;
    if (talents.includes("lions_heart")) {
      healFlat += 2 * surgeToP * _crossed;
    }
    healFlat += this._getBuffTotal(system, "Healing Surge");
    const healFlatStr = healFlat >= 0 ? `+${healFlat}` : `${healFlat}`;
    system.status.healingSurge = healParts.join("+") + healFlatStr;

    // --- Power Surge Ki = floor(maxKi/4) + Surgency + talents ---
    // Manual: "You regain Ki Points and Capacity equal to 1/4 of their maximums." +
    // Surgency: "+Force Modifier" (attributes.txt)
    let psFlat = Math.floor(system.kiPool.max / 4) + surgency;
    if (talents.includes("second_wind")) psFlat += 2 * surgeToP;
    if (talents.includes("lions_heart")) {
      psFlat += 2 * surgeToP * _crossed;
    }
    psFlat += this._getBuffTotal(system, "Power Surge");
    system.status.powerSurgeKi = psFlat;
    system.status.powerSurgeCapacity = Math.floor(system.capacity.max / 4);

    // --- Primal Surge (SS4 Legendary Trait: Primal Saiyan Legacy) ---
    // "Regain 2d10(T) Life Points and Ki Points." Counts as BOTH Healing and Power Surge.
    // All surge talent bonuses apply to both LP and KP recovery.
    let hasPrimalSurge = false;
    for (const trans of [...(system.transformations || []), ...(system._gainedActiveTransformations || [])]) {
      if (trans.active && trans.aspects) {
        for (const asp of trans.aspects) {
          if (typeof asp === "string" && asp.trim() === "Primal Saiyan Legacy") {
            hasPrimalSurge = true;
          }
        }
      }
    }
    if (hasPrimalSurge) {
      // Same dice as Healing Surge but recovers BOTH LP and KP
      const primalFlatStr = healFlat >= 0 ? `+${healFlat}` : `${healFlat}`;
      system.status.primalSurge = healParts.join("+") + primalFlatStr + " LP & KP";
    } else {
      system.status.primalSurge = "";
    }
  }

  // =============================================================
  // Saving Throws
  // =============================================================

  _calculateSavingThrows(system, tier) {
    const saveMap = {
      impulsive: "ag",
      corporeal: "te",
      cognitive: "in",
      morale: "pe"
    };

    system.savingThrows = {};

    // Loop-invariant values
    const aura = this._getActiveAura(system);
    let auraBonus = 0;
    if (aura) {
      for (const adv of (aura.advantages || [])) {
        if (adv.name === "Protective") auraBonus += (adv.ranks || 1) * tier;
      }
      for (const dis of (aura.disadvantages || [])) {
        if (dis.name === "Dangerous Aura") auraBonus -= (dis.ranks || 1) * tier;
      }
    }
    const drunkPenalty = system.combatStates?.drunk ? tier : 0;
    const talents = system.talents || [];
    const isBelowBruised = system.status?.healthStatus && system.status.healthStatus !== "healthy";
    const valorBonus = (talents.includes("valor_of_the_dragon_team") && isBelowBruised) ? tier : 0;
    const allSavesBuff = this._getBuffTotal(system, "All Saves");

    for (const [saveKey, attrKey] of Object.entries(saveMap)) {
      // Rules (attributes.txt:36): Skills and Saving Throws use Attribute Score, not Modifier
      const attrScore = system.attributes[attrKey]?.score ?? 0;
      // Fusion: multiple proficient saves from composite races (don't stack same save)
      const allProfSaves = system.fusion?._allProficientSaves;
      const isProficient = allProfSaves ? allProfSaves.includes(saveKey) : (saveKey === system.proficientSave);
      const profBonus = isProficient ? tier : 0;

      // Custom buff saves (e.g., "Impulsive Save", "All Saves")
      const customSaveBonus = this._getBuffTotal(system, `${saveKey.charAt(0).toUpperCase() + saveKey.slice(1)} Save`)
        + allSavesBuff;

      // Enhanced Save aspect — applied later via _applyTransformationAspects (removed dead code here)

      // Struggling stacks bonus: suppressed characters gain +floor(stacks/3)×dominantTier to Cognitive saves
      let strugglingBonus = 0;
      if (saveKey === "cognitive" && system.fusion?.isSuppressed && system.fusion?.dominantCharacterId) {
        const dominant = game.actors?.get(system.fusion.dominantCharacterId);
        const stacks = dominant?.system?.fusion?.strugglingStacks || {};
        const myStacks = stacks[this.id] || 0;
        const dominantTier = dominant?.system?.tier || tier;
        strugglingBonus = Math.floor(myStacks / 3) * dominantTier;
      }

      const bonus = attrScore + profBonus + auraBonus + customSaveBonus + valorBonus + strugglingBonus - drunkPenalty;
      // CT formula: max(7, 10 - proficiency(1) - mindful(1))
      // CT is only reduced by boolean flags (1 each), NOT by the full save bonus
      const profCT = isProficient ? 1 : 0;
      const mindfulCT = system.combatStates?.mindful ? 1 : 0;
      const ct = Math.max(7, 10 - profCT - mindfulCT);

      system.savingThrows[saveKey] = {
        bonus,
        ct,
        proficient: isProficient,
        attribute: attrKey
      };
    }
  }

  // =============================================================
  // Health Thresholds
  // =============================================================

  _calculateThresholds(system, tier, baseTier) {
    const maxLP = system.lifePoints.max;

    // Threshold values
    system.thresholds.bruised.value = Math.floor(maxLP / 2);
    system.thresholds.injured.value = Math.floor(maxLP / 4);
    system.thresholds.critical.value = Math.floor(maxLP / 10);

    // Determine which thresholds are crossed based on current LP.
    const currentLP = system.lifePoints?.value ?? 0;
    system.thresholds.bruised.crossed = currentLP <= system.thresholds.bruised.value;
    system.thresholds.injured.crossed = currentLP <= system.thresholds.injured.value;
    system.thresholds.critical.crossed = currentLP <= system.thresholds.critical.value;

    // Penalties: crossed thresholds that have NOT been saved (checked = saved, no penalty).
    // Rules: "reduce your Combat Rolls by 1(bT) and your Stress Bonus by 1" (damage-conditions.txt)
    let penaltyCount = 0;
    if (system.thresholds.bruised.crossed && !system.thresholds.bruised.checked) penaltyCount++;
    if (system.thresholds.injured.crossed && !system.thresholds.injured.checked) penaltyCount++;
    if (system.thresholds.critical.crossed && !system.thresholds.critical.checked) penaltyCount++;
    const poisonMult = this._isConditionActive(system, "poisoned") ? 2 : 1;
    system.thresholds.penalties = penaltyCount * baseTier * poisonMult;
    system.thresholds.stressPenalty = penaltyCount * poisonMult;
    // Transformation Stressor: do not reduce Stress Bonus from Health Threshold penalties.
    if ((system.talents || []).includes("transformation_stressor")) {
      system.thresholds.stressPenalty = 0;
    }

    // Count of crossed thresholds (regardless of save), used by talents/transformations.
    system.thresholds.crossedCount = (system.thresholds.bruised.crossed ? 1 : 0)
      + (system.thresholds.injured.crossed ? 1 : 0)
      + (system.thresholds.critical.crossed ? 1 : 0);

    // Auto-sync health status from current LP, matching MVP behavior.
    const _hsLabels = { healthy: "Healthy", bruised: "Bruised", injured: "Injured", critical: "Critical" };
    if (system.status) {
      if (currentLP <= system.thresholds.critical.value) system.status.healthStatus = "critical";
      else if (currentLP <= system.thresholds.injured.value) system.status.healthStatus = "injured";
      else if (currentLP <= system.thresholds.bruised.value) system.status.healthStatus = "bruised";
      else system.status.healthStatus = "healthy";
      system.status.healthStatusLabel = _hsLabels[system.status.healthStatus] || "Healthy";
    }
  }

  // =============================================================
  // Combat Stats (Speed, Soak, Reach, Range, Defense)
  // =============================================================

  _calculateCombatStats(system, tier, baseTier) {
    let size = system.status?.currentSize || system.baseSize || "medium";
    // Custom buff "Size Category" — shift size by N categories
    const sizeBuff = this._getBuffTotal(system, "Size Category");
    if (sizeBuff !== 0) {
      const order = DBUActor.SIZE_ORDER;
      const idx = order.indexOf(size);
      if (idx >= 0) {
        const newIdx = Math.max(0, Math.min(order.length - 1, idx + sizeBuff));
        size = order[newIdx];
        if (system.status) system.status.currentSize = size;
      }
    }
    const sizeData = DBUActor.SIZE_DATA[size] || DBUActor.SIZE_DATA.medium;

    const agTotal = system.attributes.ag?.totalScore ?? 0;
    const teTotal = system.attributes.te?.totalScore ?? 0;

    // --- Super Stacks ---
    // Rule: "For every multiple of 5 your Force Score exceeds your Agility Score by,
    // gain a Super Stack (max. 3). For each stack: -1(T) Strike/Dodge, +1(T) Soak,
    // +1d4(T) Wound (increasing dice category per stack after first)." (attributes.txt)
    const foScoreForStacks = system.attributes.fo?.score ?? 0;
    const agScoreForStacks = system.attributes.ag?.score ?? 0;
    let superStacks = Math.min(3, Math.max(0, Math.floor((foScoreForStacks - agScoreForStacks) / 5)));
    // Bulky transformation aspect: "Gain 1 Super Stack while in this Transformation" (own + gained)
    for (const trans of [...(system.transformations || []), ...(system._gainedActiveTransformations || [])]) {
      if (trans.active && trans.aspects) {
        for (const asp of trans.aspects) {
          if (typeof asp === "string" && asp.trim() === "Bulky") superStacks += 1;
        }
      }
    }
    // Custom buff Super Stacks
    superStacks += this._getBuffTotal(system, "Super Stacks");
    superStacks = Math.min(3, Math.max(0, superStacks));
    system.status.superStacks = superStacks;

    // Super Stack derived values
    const superStackSoak = superStacks * tier;
    const superStackStrikePenalty = superStacks * tier;
    const superStackDodgePenalty = superStacks * tier;
    // Talent halving flags (set by talents.mjs via _applyTransformationAspects)
    // Custom buff "No Super Stack Pen." — any positive value zeroes out SS strike/dodge penalty
    const noSSPen = this._getBuffTotal(system, "No Super Stack Pen.") > 0;
    if (noSSPen) {
      system.aptitudes.superStackStrikePenalty = 0;
      system.aptitudes.superStackDodgePenalty = 0;
    } else {
      if (system.aptitudes?.halveSuperStackStrikePenalty) {
        system.aptitudes.superStackStrikePenalty = Math.floor(superStackStrikePenalty / 2);
      } else {
        system.aptitudes.superStackStrikePenalty = superStackStrikePenalty;
      }
      if (system.aptitudes?.halveSuperStackDVPenalty) {
        system.aptitudes.superStackDodgePenalty = Math.floor(superStackDodgePenalty / 2);
      } else {
        system.aptitudes.superStackDodgePenalty = superStackDodgePenalty;
      }
    }
    // Custom buff "Power Burst S. Stacks" — bonus stacks consumed by Power Burst
    system.aptitudes.powerBurstSuperStackBonus = this._getBuffTotal(system, "Power Burst S. Stacks");
    // Custom buff "Super Stack Extra Dice" — flat additional dice for SS wound roll
    system.aptitudes.superStackExtraDice = this._getBuffTotal(system, "Super Stack Extra Dice");
    // Custom buff "Super Stack Dice Category" — bumps the SS dice category up (0 = unchanged, 1 = +1 cat, etc.)
    system.aptitudes.superStackDiceCategoryBonus = this._getBuffTotal(system, "Super Stack Dice Category");
    system.aptitudes.superStackSoak = superStackSoak;
    // Super Stack Extra Dice: 1d4(T) base, +1 category per stack after first
    // 1 stack=1d4, 2 stacks=1d6, 3 stacks=1d8 (scaled by tier)
    if (superStacks > 0) {
      const ssDieSizes = ["d4", "d6", "d8", "d10"];
      const ssDie = ssDieSizes[Math.min(superStacks - 1, 3)];
      system.aptitudes.superStackWoundDice = `${tier}${ssDie}`;
    } else {
      system.aptitudes.superStackWoundDice = "";
    }

    // --- Soak ---
    // Manual: "Your Soak Value is equal to your Tenacity Modifier" with minimum 1(T)
    // Formula: TE_Mod + (SizeMod × T) + AuraDR - AuraStatLoss - (Broken × 2T) + SuperStackSoak
    const brokenStacks = this._getConditionStacks(system, "broken");
    const brokenPenalty = brokenStacks * 2 * tier;

    // Aura DR and Stat Loss
    let auraDR = 0;
    let statLossSoak = 0;
    let statLossDV = 0;
    const aura = this._getActiveAura(system);
    if (aura) {
      // Absorption advantage
      for (const adv of (aura.advantages || [])) {
        if (adv.name === "Absorption") auraDR += (adv.ranks || 1) * tier;
      }
      // Avatar type gets 2 free ranks of Absorption
      if (aura.type === "Avatar") auraDR += 2 * tier;

      // Stat Loss: reduces the stat named in notes
      for (const dis of (aura.disadvantages || [])) {
        if (dis.name === "Stat Loss") {
          const lossAmount = (dis.ranks || 1) * tier;
          const notesLower = dis.notes?.toLowerCase() || "";
          if (notesLower.includes("soak")) statLossSoak += lossAmount;
          else if (notesLower.includes("dodge") || notesLower.includes("defense")) statLossDV += lossAmount;
        }
      }
    }

    // Custom buff soak (unified: flat + bT×baseTier + T×tier)
    const customBuffSoak = this._getBuffTotal(system, "Soak")
      + this._getBuffTotal(system, "Soak (from Exceed Trait)");

    const godKiSoak = system.godKi?.soakBonus || 0;
    const fissionSoak = system.fusion?._fissionSoakBonus || 0;
    // "Double Base Soak" — each unit doubles the base portion (TE + size mod + auraDR)
    const doubleBaseBuff = this._getBuffTotal(system, "Double Base Soak");
    const basePortion = teTotal + (sizeData.soakMod * tier) + auraDR;
    const doubledPortion = basePortion * doubleBaseBuff;
    const baseSoak = basePortion + doubledPortion - statLossSoak - brokenPenalty
      + this._getEquipmentSoakBonus() + godKiSoak + superStackSoak + customBuffSoak + fissionSoak;
    // Manual: "minimum Soak Value of 1(T)" = 1 × Tier of Power
    system.status.rawSoak = baseSoak;  // Pre-minimum value for Broken extra damage check
    system.status.soak = Math.max(tier, baseSoak);

    // --- Normal Speed ---
    // Formula: 2 + floor(AG total / 2) + SizeMod + AuraBonus
    let normalSpeed = Math.max(0, 2 + Math.floor(agTotal / 2) + sizeData.speedMod);
    if (this._isConditionActive(system, "prone")) normalSpeed = Math.floor(normalSpeed / 2);

    // Aura Speed Bonus
    if (aura) {
      if (aura.type === "Sparking") {
        for (const adv of (aura.advantages || [])) {
          if (adv.name === "High Speed Aura") normalSpeed += (adv.ranks || 1) * tier;
        }
      }
      for (const dis of (aura.disadvantages || [])) {
        if (dis.name === "Heavy Aura") normalSpeed -= (dis.ranks || 1) * tier;
      }
    }

    const slowedStacks = this._getConditionStacks(system, "slowed");
    for (let i = 0; i < slowedStacks; i++) {
      normalSpeed = normalSpeed - Math.floor(normalSpeed / 3);
    }
    // Custom buffs: Normal Speed, Both Speeds, ±1/4, Halve
    normalSpeed += this._getBuffTotal(system, "Normal Speed");
    normalSpeed += this._getBuffTotal(system, "Both Speeds");
    const nsQuarterBuff = this._getBuffTotal(system, "Normal Speed ±1/4");
    const bsQuarterBuff = this._getBuffTotal(system, "Both Speeds ±1/4");
    if (nsQuarterBuff !== 0 || bsQuarterBuff !== 0) {
      const baseNs = normalSpeed;
      normalSpeed += (nsQuarterBuff + bsQuarterBuff) * Math.floor(baseNs / 4);
    }
    if (this._getBuffTotal(system, "Halve Normal Speed") > 0
        || this._getBuffTotal(system, "Halve Both Speeds") > 0) {
      normalSpeed = Math.floor(normalSpeed / 2);
    }
    system.status.normalSpeed = Math.max(0, normalSpeed);

    // --- Boosted Speed ---
    // Formula: 2 + AG total + SizeMod + AuraBonus
    let boostedSpeed = Math.max(0, 2 + agTotal + sizeData.speedMod);
    if (this._isConditionActive(system, "prone")) boostedSpeed = Math.floor(boostedSpeed / 2);

    // Aura Speed Bonus (Boosted)
    if (aura) {
      if (aura.type === "Sparking") {
        for (const adv of (aura.advantages || [])) {
          if (adv.name === "High Speed Aura") boostedSpeed += (adv.ranks || 1) * tier;
        }
      }
      for (const dis of (aura.disadvantages || [])) {
        if (dis.name === "Heavy Aura") boostedSpeed -= (dis.ranks || 1) * tier;
      }
    }

    for (let i = 0; i < slowedStacks; i++) {
      boostedSpeed = boostedSpeed - Math.floor(boostedSpeed / 3);
    }
    // Custom buffs: Boosted Speed, Both Speeds, ±1/4, Halve
    boostedSpeed += this._getBuffTotal(system, "Boosted Speed");
    boostedSpeed += this._getBuffTotal(system, "Both Speeds");
    const bsBoosterQuarter = this._getBuffTotal(system, "Boosted Speed ±1/4");
    const bsBothQuarter = this._getBuffTotal(system, "Both Speeds ±1/4");
    if (bsBoosterQuarter !== 0 || bsBothQuarter !== 0) {
      const baseBs = boostedSpeed;
      boostedSpeed += (bsBoosterQuarter + bsBothQuarter) * Math.floor(baseBs / 4);
    }
    if (this._getBuffTotal(system, "Halve Boosted Speed") > 0
        || this._getBuffTotal(system, "Halve Both Speeds") > 0) {
      boostedSpeed = Math.floor(boostedSpeed / 2);
    }
    system.status.boostedSpeed = Math.max(0, boostedSpeed);

    // --- Melee Reach ---
    let rangeBonus = 0;
    if (aura) {
      for (const adv of (aura.advantages || [])) {
        if (adv.name === "Range Extension") rangeBonus += (adv.ranks || 1);
      }
    }
    const meleeExtra = sizeData.meleeExtra + rangeBonus;
    system.status.meleeReach = meleeExtra > 0 ? `1+${meleeExtra} sq.` : "1 sq.";

    // --- Long Range ---
    const sizeOrder = DBUActor.SIZE_ORDER;
    const sizeIndex = sizeOrder.indexOf(size);
    const largeIndex = sizeOrder.indexOf("large");
    const sizesAboveLarge = Math.max(0, sizeIndex - largeIndex);
    // Rule: "For every Size Category after Large, increase the distance until an Opponent
    // is at Long Range ... by 1" (size.txt)
    // Custom buff "Long Range Distance" — adds extra squares to the threshold
    const longRangeBuff = this._getBuffTotal(system, "Long Range Distance");
    const longRangeNum = 9 + sizesAboveLarge + longRangeBuff;
    system.status.longRangeNumeric = longRangeNum;
    system.status.longRange = `${longRangeNum}+ sq.`;

    // --- Squares Occupied ---
    system.status.squaresOccupied = sizeData.squares;

    // --- Size Skill Modifiers (relative to Medium) ---
    const mediumIndex = sizeOrder.indexOf("medium");
    const sizeDiffFromMedium = sizeIndex - mediumIndex;
    system.status.sizeStealthMod = -sizeDiffFromMedium;       // below medium = +, above = -
    system.status.sizeIntimidationMod = sizeDiffFromMedium;    // above medium = +, below = -

    // --- Defense Value ---
    // Formula: AG totalScore + SizeMod(T) + AuraPenalties
    // Note: Sparking adds +1(T) to Strike, NOT to DV (per official sheet)
    let auraDefense = 0;
    if (aura) {
      for (const dis of (aura.disadvantages || [])) {
        if (dis.name === "Heavy Aura") auraDefense -= (dis.ranks || 1) * tier;
      }
    }

    const customBuffDefense = this._getBuffTotal(system, "Defense Value");
    let defenseValue = agTotal + (sizeData.defenseMod * tier) + auraDefense + this._getEquipmentDefenseBonus() - statLossDV + customBuffDefense;
    // Raging state: "Reduce your Defense Value by 1(T)" (states.txt)
    if (system.combatStates?.raging) defenseValue -= tier;
    // Guard Down condition: reduce Defense Value by 2(T)
    if (this._isConditionActive(system, "guardDown")) defenseValue -= 2 * tier;
    if (this._isConditionActive(system, "prone")) defenseValue = Math.floor(defenseValue / 2);
    system.aptitudes.defenseValue = Math.max(0, defenseValue);

    // --- Haste ---
    // Rule: "Add 1/2 of your Agility Modifier to Strike Rolls" (attributes.txt)
    // DBU "Attribute Modifier" = totalScore (score + bonuses)
    system.aptitudes.haste = Math.floor(agTotal / 2)
      + this._getBuffTotal(system, "Haste");
    // Prone: "Reduce your Speed, Defense Value and Haste by 1/2" (damage-conditions.txt)
    if (this._isConditionActive(system, "prone")) {
      system.aptitudes.haste = Math.floor(system.aptitudes.haste / 2);
    }

    // --- Awareness ---
    // Rule: "Add your Insight Modifier to Strike Rolls" (attributes.txt)
    const inTotal = (system.attributes.in?.score ?? 0) + (system.attributes.in?.modifier ?? 0);
    system.aptitudes.awareness = inTotal
      + this._getBuffTotal(system, "Awareness");

    // --- Initiative ---
    // Rule: "Add 1/2 of your Agility Score to your Initiative Check" (attributes.txt)
    system.aptitudes.initiative = Math.floor((system.attributes.ag?.score ?? 0) / 2)
      + this._getBuffTotal(system, "Initiative");

    // Initiative Value (separate bonus for Initiative Advantage determination only,
    // NOT added to the d10 roll — from transformations like SSJ, Golden Power, etc.)
    // Derived-only field, populated by alternate-forms/legendary-forms/manifested-powers.
    system.aptitudes.initiativeValue = 0;

    // Initiative Roll Bonus (bonuses to the d10 roll, e.g. Improved Initiative +2bT)
    // Derived-only field (not in TypeDataModel schema), populated by talents.mjs
    system.aptitudes.initiativeRollBonus = system.aptitudes.initiativeRollBonus ?? 0;

    // Alert Reroll flag (Alert L1: roll 2d10kh instead of 1d10)
    // Derived-only field (not in TypeDataModel schema), populated by talents.mjs
    system.aptitudes.alertReroll = system.aptitudes.alertReroll ?? false;

    // --- Stress Bonus ---
    // Base: 1 + Determination(floor(PE_Score/4)) + Power Level - threshold stress penalty
    // Determination: +1 per 4 PE Score (continuous, not thresholded)
    // Roll: 1d10 + 1 + Stress Bonus (the +1 is in the roll, not here)
    // Derived-only field, accumulated by racial automation functions and finalized in prepareDerivedData.
    system.aptitudes.stressBonus = 1 + (system.level || 1)
      + Math.floor((system.attributes.pe?.score ?? 0) / 4)
      - (system.thresholds?.stressPenalty || 0);

    // Gifted Student: "If SC Score 4+, +2 Dice Score on Skill Checks, +3 TP per Skill Improvement. Double if SC 8+."
    const scScoreGS = system.attributes.sc?.score ?? 0;
    if (scScoreGS >= 8) {
      system.aptitudes.giftedStudentSkillBonus = 4;
      system.aptitudes.giftedStudentTPPerSI = 6;
    } else if (scScoreGS >= 4) {
      system.aptitudes.giftedStudentSkillBonus = 2;
      system.aptitudes.giftedStudentTPPerSI = 3;
    } else {
      system.aptitudes.giftedStudentSkillBonus = 0;
      system.aptitudes.giftedStudentTPPerSI = 0;
    }

    // --- Combat Expertise (talent) ---
    // "Reduce your Awareness or Defense Value by up to 2(bT) to increase the other.
    //  You cannot reduce an Aptitude to any value less than 2(bT)." (talents.txt)
    const bT = system.baseTier || 1;
    const talents = system.talents || [];
    if (talents.includes("combat_expertise")) {
      let ceShift = system.combatStates?.combatExpertiseShift ?? 0;
      const ceMax = 2 * bT;
      ceShift = Math.max(-ceMax, Math.min(ceMax, ceShift));
      // Positive = +Awareness/-DV, Negative = +DV/-Awareness
      if (ceShift > 0) ceShift = Math.min(ceShift, Math.max(0, system.aptitudes.defenseValue - 2 * bT));
      if (ceShift < 0) ceShift = Math.max(ceShift, -Math.max(0, system.aptitudes.awareness - 2 * bT));
      system.aptitudes.awareness += ceShift;
      system.aptitudes.defenseValue -= ceShift;
      // Aggressive Style: "If you reduce DV by at least 1(bT), +1(bT) Awareness" (talents.txt)
      if (ceShift >= bT && talents.includes("aggressive_style")) {
        system.aptitudes.awareness += bT;
      }
      // Defensive Style: "If you reduce Awareness by at least 1(bT), +1(bT) DV" (talents.txt)
      if (ceShift <= -bT && talents.includes("defensive_style")) {
        system.aptitudes.defenseValue += bT;
      }
      system.aptitudes.combatExpertiseApplied = ceShift;
    } else {
      system.aptitudes.combatExpertiseApplied = 0;
    }

    // --- Balanced Defender (talent) ---
    // "Reduce your DV or Soak by up to 2(bT), increase the other by equal amount.
    //  You cannot reduce either Aptitude to 0." (talents.txt)
    if (talents.includes("balanced_defender")) {
      let bdShift = system.combatStates?.balancedDefenderShift ?? 0;
      const bdMax = 2 * bT;
      bdShift = Math.max(-bdMax, Math.min(bdMax, bdShift));
      // Positive = +Soak/-DV, Negative = +DV/-Soak
      if (bdShift > 0) bdShift = Math.min(bdShift, Math.max(0, system.aptitudes.defenseValue - 1));
      if (bdShift < 0) bdShift = Math.max(bdShift, -Math.max(0, system.status.soak - 1));
      system.status.soak += bdShift;
      system.aptitudes.defenseValue -= bdShift;
      system.aptitudes.balancedDefenderApplied = bdShift;
      // Passive (AG=TE → +1T DV & Soak) is applied in talents.mjs to avoid double application
    } else {
      system.aptitudes.balancedDefenderApplied = 0;
    }

    // --- Generate derived buffs from talents, states, and maneuvers ---
    // Converts hardcoded talent/state bonuses into unified buff entries so
    // _getBuffTotal("Strike"/"Dodge"/"Wound") aggregates everything.
    this._generateDerivedBuffs(system);

    // --- Aggregate combat roll buff totals (custom + derived) ---
    // Single pre-computed total per combat roll type for the sheet to consume.
    // Fission combat roll penalty (-2 if base ToP is 1)
    const fissionCRPenalty = system.fusion?._fissionCombatRollPenalty || 0;
    // Health Threshold Penalties: -1(bT) per failed Steadfast Check (doubled if Poisoned)
    const thresholdCRPenalty = system.thresholds?.penalties || 0;
    // "Combat Rolls" buff applies to all three (Strike, Dodge, Wound)
    const combatRollsBuff = this._getBuffTotal(system, "Combat Rolls");
    system.aptitudes.strikeBuffTotal = this._getBuffTotal(system, "Strike") + combatRollsBuff - fissionCRPenalty - thresholdCRPenalty;
    system.aptitudes.dodgeBuffTotal = this._getBuffTotal(system, "Dodge") + combatRollsBuff - fissionCRPenalty - thresholdCRPenalty;
    system.aptitudes.woundBuffTotal = this._getBuffTotal(system, "Wound") + combatRollsBuff - fissionCRPenalty - thresholdCRPenalty
      + (system.fusion?._fissionWoundBonus || 0);
    // "No Strike/Dodge/Wound Penalties" — cancel penalty subtractions for that roll type
    if (this._getBuffTotal(system, "No Strike Penalties") > 0) {
      system.aptitudes.strikeBuffTotal += fissionCRPenalty + thresholdCRPenalty + (system.aptitudes.superStackStrikePenalty || 0);
    }
    if (this._getBuffTotal(system, "No Dodge Penalties") > 0) {
      system.aptitudes.dodgeBuffTotal += fissionCRPenalty + thresholdCRPenalty + (system.aptitudes.superStackDodgePenalty || 0);
    }
    if (this._getBuffTotal(system, "No Wound Penalties") > 0) {
      system.aptitudes.woundBuffTotal += fissionCRPenalty + thresholdCRPenalty;
    }
    // Hype / Analysis Maneuver bonuses (stored for downstream display + roll)
    system.aptitudes.hypeBonus = this._getBuffTotal(system, "Hype Maneuver");
    system.aptitudes.analysisInvestigation = this._getBuffTotal(system, "Analysis Maneuver (Investigation)");
    system.aptitudes.analysisIntuition = this._getBuffTotal(system, "Analysis Maneuver (Intuition)");

    // Damage-type-specific Strike/Wound variants (applied at roll time based on attack type)
    system.aptitudes.strikePhysical = this._getBuffTotal(system, "Strike (Physical)");
    system.aptitudes.strikeEnergy = this._getBuffTotal(system, "Strike (Energy)");
    system.aptitudes.strikeMagic = this._getBuffTotal(system, "Strike (Magic)");
    system.aptitudes.woundPhysical = this._getBuffTotal(system, "Wound (Physical)");
    system.aptitudes.woundEnergy = this._getBuffTotal(system, "Wound (Energy)");
    system.aptitudes.woundMagic = this._getBuffTotal(system, "Wound (Magic)");
    // Critical Target adjustments (subtract from CT threshold to widen crit range; default CT is 6)
    system.aptitudes.strikeCTBonus = this._getBuffTotal(system, "Strike CT (All)");
    system.aptitudes.strikeCTPhysical = this._getBuffTotal(system, "Strike CT (Physical)");
    system.aptitudes.strikeCTEnergy = this._getBuffTotal(system, "Strike CT (Energy)");
    system.aptitudes.strikeCTMagic = this._getBuffTotal(system, "Strike CT (Magic)");
    system.aptitudes.dodgeCTBonus = this._getBuffTotal(system, "Dodge CT");
    system.aptitudes.woundCTBonus = this._getBuffTotal(system, "Wound CT (All)");
    system.aptitudes.woundCTPhysical = this._getBuffTotal(system, "Wound CT (Physical)");
    system.aptitudes.woundCTEnergy = this._getBuffTotal(system, "Wound CT (Energy)");
    system.aptitudes.woundCTMagic = this._getBuffTotal(system, "Wound CT (Magic)");

    // --- Equipment Derived ---
    system.equipment = system.equipment || {};
    system.equipment.dr = this._getEquipmentDR();
    system.equipment.combatPenalty = this._getEquipmentCombatPenalty();
    system.equipment.layerPenalty = this._calcLayerPenalty();

    // --- Comprehensive Damage Reduction ---
    // Aggregates: equipment DR + racial/talent DR + God Ki DR + custom buff DR + transformation DR
    let totalDR = system.equipment.dr || 0;
    // Racial/talent automations that wrote to status.dr (e.g., Saiyan Inherited Resolve).
    totalDR += system.status.dr || 0;
    // Talent totals.dr (e.g., Superhuman Physique).
    totalDR += system.talentBonuses?.totals?.dr || 0;
    // God Ki: "+2(T) Damage Reduction against Attacking Maneuvers" (god-ki.txt)
    const godKiActive = system.godKi?.active;
    if (godKiActive) totalDR += 2 * tier;
    // Custom buff "Damage Reduction" (unified: flat + bT×baseTier + T×tier)
    totalDR += this._getBuffTotal(system, "Damage Reduction");
    // Transformation DR aspects (aspects are strings like "Damage Reduction (LV2)") — own + gained
    for (const trans of [...(system.transformations || []), ...(system._gainedActiveTransformations || [])]) {
      if (!trans.active || !trans.aspects) continue;
      for (const asp of trans.aspects) {
        if (typeof asp !== "string") continue;
        const drMatch = asp.trim().match(/^Damage Reduction(?:\s*\(LV(\d+)\))?$/i);
        if (drMatch) {
          const ranks = drMatch[1] ? parseInt(drMatch[1]) : 1;
          totalDR += ranks * tier;
        }
      }
    }
    system.status.damageReduction = Math.max(0, totalDR);

    // --- Size Combat Rules (pre-calculated values) ---
    // bT already declared above for Combat Expertise section
    const sizeCombatRules = [];

    // Gigantic Grip (Large+): +1(T) per size cat larger, max 3(T). 3+ larger = no Guard Down
    if (sizeIndex >= largeIndex) {
      sizeCombatRules.push({
        id: "gigantic_grip", name: "Gigantic Grip",
        text: `+${tier} Grapple per Size Category larger (max +${3 * tier}). If 3+ larger: no Guard Down.`
      });
    }

    // Giant Strike (Gigantic/Colossal)
    if (size === "gigantic") {
      sizeCombatRules.push({
        id: "giant_strike", name: "Giant Strike",
        text: `Attacking Maneuvers without AoE gain Minor Sphere AoE (not vs Gigantic+ targets).`
      });
    } else if (size === "colossal") {
      sizeCombatRules.push({
        id: "giant_strike", name: "Giant Strike",
        text: `Attacking Maneuvers without AoE gain Standard Sphere AoE (not vs Gigantic+ targets).`
      });
    }

    // Giant Magnitude (Enormous+)
    const catsAfterLarge = Math.max(0, sizeIndex - largeIndex);
    if (catsAfterLarge > 0) {
      sizeCombatRules.push({
        id: "giant_magnitude", name: "Giant Magnitude",
        text: `+${catsAfterLarge} AoE Magnitude on all AoE Attacking Maneuvers.`
      });
    }

    // Expanding Blow (Enormous+)
    if (sizeIndex >= sizeOrder.indexOf("enormous")) {
      sizeCombatRules.push({
        id: "expanding_blow", name: "Expanding Blow",
        text: `Sphere AoE targeting your own square expands from all ${sizeData.squares} squares you occupy.`
      });
    }

    // Punching Down (any, vs 2+ smaller)
    sizeCombatRules.push({
      id: "punching_down", name: "Punching Down",
      text: `+${tier}d6 damage per 2+ Size Categories smaller than you.`
    });

    // Punching Up (any, vs 2+ larger)
    sizeCombatRules.push({
      id: "punching_up", name: "Punching Up",
      text: `No Called Shot penalty. +${tier} Wound Roll per Size Category target is larger (when 2+ larger).`
    });

    // Size and Movement (any)
    sizeCombatRules.push({
      id: "size_movement", name: "Size & Movement",
      text: `Forced movement: +${bT}/−${bT} per Size Category difference (max ±${3 * bT}).`
    });

    // Slip Through (any, vs ally 2+ larger)
    sizeCombatRules.push({
      id: "slip_through", name: "Slip Through",
      text: `May enter squares of allies 2+ Size Categories larger than you.`
    });

    // Tiny Target (any, vs opponent 2+ larger)
    sizeCombatRules.push({
      id: "tiny_target", name: "Tiny Target",
      text: `Rapid Movement near opponents 2+ larger: Skill Clash (Acrobatics/Stealth vs Perception) → Hidden.`
    });

    system.sizeCombatRules = sizeCombatRules;
  }

  // =============================================================
  // Transformation Aspect Automation
  // =============================================================

  /**
   * Parse an aspect level from strings like "LV2", "LV 3", "Level 1",
   * "LVG" (Grade-based), "LV*" (variable). Returns a number or null.
   */
  static _parseAspectLevel(aspectStr, grade) {
    // Match "LV 2", "LV2", "Level 3"
    const fixedMatch = aspectStr.match(/(?:LV|Level)\s*(\d+)/i);
    if (fixedMatch) return parseInt(fixedMatch[1]);
    // Match "LVG" — level equals the Grade
    if (/LVG/i.test(aspectStr) && grade > 0) return grade;
    // Match "Level G" — level equals the Grade
    if (/Level\s+G/i.test(aspectStr) && grade > 0) return grade;
    // LV* = variable, cannot auto-resolve
    return null;
  }

  /**
   * Evaluate a mastery conditional's condition against the current system state.
   */
  static _evaluateMasteryCondition(condition, system) {
    if (!condition) return true;
    if (condition.always) return true;
    if (condition.state) return system.combatStates?.[condition.state] === true;
    if (condition.notState) return system.combatStates?.[condition.notState] !== true;
    if (condition.threshold) {
      const order = ["healthy", "bruised", "injured", "critical"];
      const currentIdx = order.indexOf(system.status?.healthStatus ?? "healthy");
      const targetIdx = order.indexOf(condition.threshold);
      return currentIdx >= targetIdx;
    }
    if (condition.aboveThreshold) {
      const order = ["healthy", "bruised", "injured", "critical"];
      const currentIdx = order.indexOf(system.status?.healthStatus ?? "healthy");
      const targetIdx = order.indexOf(condition.aboveThreshold);
      return currentIdx < targetIdx;
    }
    return false;
  }

  /**
   * Apply attribute bonuses from One-Sided Fusion (Absorption / Possession).
   * Called immediately after _calculateAttributeModifiers.
   *
   * Absorption: +ceil(highestSuppressedScore / 4) per attribute.
   *   Multiple absorbed: take highest score per-attr across all absorbed.
   * Possession: set modifiers to Host's scores, then +ceil(OWN scores / 4).
   *
   * Rules: one-sided-fusions.txt lines 9, 36, 55
   */
  _applyOneSidedFusionBonuses(system, tier, baseTier) {
    const fusion = system.fusion;
    if (!fusion?.isFusion) return;
    const fusionType = fusion.type;
    if (fusionType !== "one-sided-absorption" && fusionType !== "one-sided-possession") return;

    const attrKeys = ["ag", "fo", "te", "sc", "in", "ma", "pe"];
    const suppIds = fusion.suppressedCharacterIds || [];
    if (suppIds.length === 0) return;

    // Derived storage for display
    fusion._appliedAttrBonuses = {};
    fusion._possessionRace = null;
    fusion._possessionSize = null;

    if (fusionType === "one-sided-absorption") {
      // ---- ABSORPTION ----
      // "Select the highest Attribute Scores from the various Absorbed Characters"
      // "Increase your Attribute Modifiers by 1/4 (rounded up) of those scores"
      const highestScores = Object.fromEntries(attrKeys.map(k => [k, 0]));

      for (const suppId of suppIds) {
        const suppActor = game.actors?.get(suppId);
        if (!suppActor) continue;
        const suppSys = suppActor.system || {};
        for (const key of attrKeys) {
          // Rules: "1/4 of the Attribute Scores of the Suppressed Character"
          // DBU "Attribute Score" = raw attr.score (not totalScore which includes modifiers)
          const score = suppSys.attributes?.[key]?.score ?? 0;
          if (score > highestScores[key]) highestScores[key] = score;
        }
      }

      // Insatiable (Favored Snack Lv2): "double the increase to your Attribute Modifiers
      // from that Absorbed Character" — multiply absorption bonus by 2.
      const hasInsatiable = (system.transformations || []).some(
        t => t.active && t.catalogKey === "insatiable"
      );
      const absorbMult = hasInsatiable ? 2 : 1;

      for (const key of attrKeys) {
        const bonus = Math.ceil(highestScores[key] / 4) * absorbMult;
        fusion._appliedAttrBonuses[key] = bonus;
        const attr = system.attributes[key];
        if (attr) {
          attr.modifier += bonus;
          attr.totalScore += bonus;
        }
      }

      // Absorption: non-qualifying or already-owned transformations → +1(T) FO/MA each
      // Uses catalog racialRequirement for proper checking
      const ownRace = system.race || "";
      const transCatalog = CONFIG.DBU?.transformationsCatalog || {};
      const absRaceMap = {
        saiyan: "saiyan", earthling: "earthling", namekian: "namekian",
        android: "android", bioAndroid: "bio-android", majin: "majin",
        arcosian: "arcosian", shinjin: "shinjin", cerealian: "cerealian",
        neoTuffle: "neo-tuffle", nekoMajin: "neko majin",
        shadowDragon: "shadow dragon", undead: "undead"
      };
      const normalizedOwn = (absRaceMap[ownRace] || ownRace).toLowerCase();

      const ownTransKeys = new Set();
      for (const t of (system.transformations || [])) {
        if (t.catalogKey) ownTransKeys.add(t.catalogKey);
        else if (t.name) ownTransKeys.add(t.name.toLowerCase());
      }
      const seenKeys = new Set();
      let nonQualifyingCount = 0;

      for (const suppId of suppIds) {
        const suppActor = game.actors?.get(suppId);
        if (!suppActor) continue;
        for (const st of (suppActor.system?.transformations || [])) {
          const dedupKey = st.catalogKey || (st.name || "").toLowerCase();
          if (!dedupKey || seenKeys.has(dedupKey)) continue;
          seenKeys.add(dedupKey);

          const alreadyOwned = ownTransKeys.has(dedupKey);
          let raciallyEligible = true;
          if (st.catalogKey && transCatalog[st.catalogKey]) {
            const req = (transCatalog[st.catalogKey].racialRequirement || "").trim();
            if (req && req !== "Any" && req !== "Any Race") {
              const exceptMatch = req.match(/^Any\s*\(except\s+(.+)\)$/i);
              if (exceptMatch) {
                const excluded = exceptMatch[1].trim().toLowerCase().replace(/s$/, "");
                raciallyEligible = normalizedOwn !== excluded && normalizedOwn !== excluded.replace(/-/g, " ");
              } else {
                const target = req.toLowerCase().replace(/s$/, "");
                raciallyEligible = normalizedOwn === target || normalizedOwn === target.replace(/-/g, " ");
              }
            }
          }
          if (!raciallyEligible || alreadyOwned) nonQualifyingCount++;
        }
      }

      if (nonQualifyingCount > 0) {
        const nonQualifyingBonus = nonQualifyingCount * tier;
        fusion._absorptionNonQualifyingBonus = nonQualifyingBonus;
        fusion._absorptionNonQualifyingCount = nonQualifyingCount;
        for (const key of ["fo", "ma"]) {
          const attr = system.attributes[key];
          if (attr) {
            attr.modifier += nonQualifyingBonus;
            attr.totalScore = attr.score + attr.modifier;
          }
        }
      }

      // Absorption: Shared Mutation MP — if both dominant and suppressed have Mutation,
      // dominant gains suppressed's Mutation Trait (rules line 38)
      const mutSourceId = fusion.chosenMutationSourceId || "";
      const dominantHasMutation = (system.transformations || []).some(t => t.catalogKey === "mutation");
      if (mutSourceId && dominantHasMutation && suppIds.includes(mutSourceId)) {
        const mutSuppActor = game.actors?.get(mutSourceId);
        if (mutSuppActor) {
          const mutSuppTrans = mutSuppActor.system?.transformations || [];
          const mutSuppIdx = mutSuppTrans.findIndex(t => t.catalogKey === "mutation");
          if (mutSuppIdx >= 0) {
            const mutSuppOptions = mutSuppActor.system?.transformationOptionSelections?.[String(mutSuppIdx)] || {};
            fusion._gainedMutationTraitName = Object.values(mutSuppOptions).find(v => typeof v === "string" && v !== "") || "";
            fusion._gainedMutationSourceName = mutSuppActor.name;
          }
        }
      }

    } else if (fusionType === "one-sided-possession") {
      // ---- POSSESSION ----
      // "Set your Attribute Modifiers to the Host Character's Attribute Scores
      //  and then increase your Attribute Modifiers by 1/4 of your Attribute Scores instead."
      const hostId = suppIds[0];
      const hostActor = game.actors?.get(hostId);
      if (!hostActor) return;
      const hostSys = hostActor.system || {};

      // Store own scores before overwrite (base score from TypeDataModel)
      const ownScores = {};
      for (const key of attrKeys) {
        ownScores[key] = system.attributes[key]?.score ?? 0;
      }

      // Race swap: "You are also treated as the Race of your Host Character"
      fusion._possessionRace = hostSys.race || null;

      // Size swap: "Your Size Category becomes equal to that of the Host Character"
      fusion._possessionSize = hostSys.baseSize || hostSys.status?.currentSize || null;
      if (fusion._possessionSize && system.status) {
        system.status.currentSize = fusion._possessionSize;
      }

      // Host LP tracking for damage sharing
      if (fusion.hostCurrentLP == null) {
        fusion._hostMaxLP = hostSys.lifePoints?.max ?? 0;
        fusion._hostCurrentLP = hostSys.lifePoints?.value ?? fusion._hostMaxLP;
      } else {
        fusion._hostMaxLP = hostSys.lifePoints?.max ?? 0;
        fusion._hostCurrentLP = fusion.hostCurrentLP;
      }

      // Neo-Tuffle Parasite: lose Liquid Form, gain chosen host trait (one-sided-fusions.txt line 60)
      const liquidFormId = "0dda96aa0a5a229f";
      const traits = system.racialTraits || [];
      if (traits.includes(liquidFormId)) {
        system.racialTraits = traits.filter(id => id !== liquidFormId);
        const hostTraitId = fusion.parasiteHostTraitId;
        if (hostTraitId && !system.racialTraits.includes(hostTraitId)) {
          system.racialTraits.push(hostTraitId);
        }
        // Ensure Neo-Tuffle automation still runs alongside host race
        fusion._possessorOriginalRace = "neoTuffle";
      }

      // Possession full replacement only applies to AG/FO/TE/MA (rules line 55).
      // SC/IN/PE get standard One-Sided Fusion bonus: +ceil(hostScore/4).
      const possessionFullAttrs = new Set(["ag", "fo", "te", "ma"]);

      for (const key of attrKeys) {
        // Rules: "set your Attribute Modifiers to the Host Character's Attribute Scores"
        // DBU "Attribute Score" = raw attr.score (not totalScore which includes modifiers)
        const hostScore = hostSys.attributes?.[key]?.score ?? 0;
        const attr = system.attributes[key];
        if (!attr) continue;

        if (possessionFullAttrs.has(key)) {
          // AG/FO/TE/MA: Host body replaces possessor's base score.
          // "set your Attribute Modifiers to the Host's Attribute Scores, then +ceil(ownScore/4)"
          // Existing modifier has transformation/aura/buff bonuses — add them on top.
          const existingModifier = attr.modifier; // from _calculateAttributeModifiers
          const ownBonus = Math.ceil(ownScores[key] / 4);
          fusion._appliedAttrBonuses[key] = { hostScore, ownBonus, total: hostScore + ownBonus, mode: "possession" };
          attr.score = hostScore; // Host body replaces possessor's base score
          attr.modifier = ownBonus + existingModifier;
          attr.totalScore = attr.score + attr.modifier;
        } else {
          // SC/IN/PE: standard +ceil(hostScore/4) bonus
          const bonus = Math.ceil(hostScore / 4);
          fusion._appliedAttrBonuses[key] = bonus;
          attr.modifier += bonus;
          attr.totalScore += bonus;
        }
      }

      // Possession: Primary Racial Trait exchange (rules line 56)
      // Stash pre-exchange traits so getData() can build the "Give" dropdown correctly
      fusion._originalRacialTraits = [...(system.racialTraits || [])];
      const traitExchange = fusion.possessionTraitExchange || {};
      if (traitExchange.givenTraitId && traitExchange.takenTraitId) {
        const idx = system.racialTraits.indexOf(traitExchange.givenTraitId);
        if (idx >= 0) system.racialTraits.splice(idx, 1);
        if (!system.racialTraits.includes(traitExchange.takenTraitId)) {
          system.racialTraits.push(traitExchange.takenTraitId);
        }
      }
    }

    // Both Absorption and Possession: gain 1 secondary racial trait per suppressed character
    // (skip if Pursuit of Perfection without Insatiable — only attribute mods allowed)
    if (!this._blockGainedAbilities(system)) {
      const chosenTraits = fusion.absorptionChosenTraits || {};
      for (const suppId of suppIds) {
        const traitId = chosenTraits[suppId];
        if (traitId && !system.racialTraits.includes(traitId)) {
          system.racialTraits.push(traitId);
        }
      }
    }
  }

  /**
   * Apply bonuses for Regular Fusion (Character Combination) and Fission.
   * Handles: composite race RLM/saves, +1(bT) boost attrs, Same Race bonuses,
   * Lasting missing-trait bonus, PL>30 overflow, Fission ToP/soak/wound.
   * Called after _applyOneSidedFusionBonuses, before proficientSave and resources.
   */
  _applyRegularFusionBonuses(system, tier, baseTier) {
    const fusion = system.fusion;
    if (!fusion?.isFusion) return;
    if (fusion.type !== "regular" && fusion.type !== "fission") return;

    const fusedIds = fusion.fusedCharacterIds || [];
    const actors = fusedIds.map(id => game.actors?.get(id)).filter(Boolean);
    const method = (CONFIG.DBU?.fusionMethods || {})[fusion.method];
    const isTemporary = method?.fusionType === "temporary";
    const isLasting = method?.fusionType === "lasting";

    // --- A4/A5/A6: Fusion RLM and proficient saves from composite races ---
    if (actors.length > 0 && fusion.type === "regular") {
      const races = actors.map(a => a.system?.race).filter(Boolean);
      const uniqueRaces = [...new Set(races)];
      const allSameRace = uniqueRaces.length === 1 && races.length > 0;

      // Highest RLM among fused characters (+3 if all same race)
      let highestRLM = 0;
      for (const r of uniqueRaces) {
        const rlm = DBUActor.RACIAL_LIFE_MODIFIERS[r] || 3;
        if (rlm > highestRLM) highestRLM = rlm;
      }
      if (allSameRace) highestRLM += 3;
      fusion._fusionRLM = highestRLM;

      // All distinct proficient saves from composite races
      const profSaves = new Set();
      for (const r of uniqueRaces) {
        const save = DBUActor.RACIAL_SAVES[r];
        if (save) profSaves.add(save);
      }
      fusion._fusionProficientSaves = [...profSaves];

      // --- B3/B4/B5: Temporary Same Race/Subrace bonuses ---
      if (isTemporary && allSameRace) {
        const subraces = actors.map(a => a.system?.subrace || "");
        const noSubraceExists = subraces.every(s => !s);
        const allSameSubrace = noSubraceExists || (new Set(subraces.filter(Boolean)).size === 1);
        const boostBT = allSameSubrace ? (2 * baseTier) : (1 * baseTier);
        for (const key of ["ag", "fo", "te", "ma"]) {
          const attr = system.attributes[key];
          if (attr) {
            attr.score += boostBT;
            attr.totalScore = attr.score + attr.modifier;
          }
        }
        fusion._sameRaceBonus = boostBT;
        // Breakthrough: same race+subrace → +1 Tier
        if (allSameSubrace && !fusion._fusionBreakthrough) {
          system.tier = (system.tier || tier) + 1;
          fusion._fusionBreakthrough = true;
        }
      }

      // --- C2: Lasting — missing traits → +attr mod bonus ---
      if (isLasting) {
        const selectedCount = (fusion.selectedRacialTraitIds || []).length;
        const missingBonus = Math.max(0, 7 - selectedCount);
        if (missingBonus > 0) {
          for (const key of ["ag", "fo", "te", "ma"]) {
            const attr = system.attributes[key];
            if (attr) {
              attr.modifier += missingBonus;
              attr.totalScore = attr.score + attr.modifier;
            }
          }
          fusion._lastingMissingTraitBonus = missingBonus;
        }

        // --- C3: Lasting — matching races among fused → +1 to AG/FO/TE/MA per duplicate ---
        // Formula: totalRaceEntries - uniqueRaces (e.g. [Saiyan, Saiyan, Namekian] → 3 - 2 = 1)
        const races = actors.map(a => a.system?.race).filter(Boolean);
        const uniqueRaces = new Set(races).size;
        let matchBonus = races.length - uniqueRaces;
        if (matchBonus > 0) {
          for (const key of ["ag", "fo", "te", "ma"]) {
            const attr = system.attributes[key];
            if (attr) {
              attr.modifier += matchBonus;
              attr.totalScore = attr.score + attr.modifier;
            }
          }
          fusion._lastingMatchRaceBonus = matchBonus;
        }
      }
    }

    // --- A2: +1(bT) to 3 chosen attributes ---
    const boostAttrs = fusion.fusionBoostAttrs || [];
    if (boostAttrs.length > 0) {
      for (const key of boostAttrs.slice(0, 3)) {
        const attr = system.attributes[key];
        if (attr) {
          attr.score += baseTier;
          attr.totalScore = attr.score + attr.modifier;
        }
      }
      fusion._boostAttrAmount = baseTier;
    }

    // --- A17: PL>30 overflow → +1 to ALL attr modifiers per PL beyond 30 ---
    const overflow = fusion.plOverflow || 0;
    if (overflow > 0) {
      for (const key of ["ag", "fo", "te", "sc", "in", "ma", "pe"]) {
        const attr = system.attributes[key];
        if (attr) {
          attr.modifier += overflow;
          attr.totalScore = attr.score + attr.modifier;
        }
      }
    }

    // --- Metamorese Plump/Frail penalty (fusion.txt lines 71-81) ---
    const variant = fusion.fusionVariant || "";
    if (variant === "plump" || variant === "frail") {
      const divisor = variant === "plump" ? 2 : 4;  // plump: 1/2, frail: 1/4 (reduce by 3/4 → keep 1/4)
      const affectedKeys = variant === "plump" ? ["ag", "fo", "ma"] : ["ag", "fo", "te", "ma"];
      for (const key of affectedKeys) {
        const attr = system.attributes[key];
        if (attr) {
          attr.modifier = Math.floor(attr.modifier / divisor);
          attr.totalScore = attr.score + attr.modifier;
        }
      }
      // Cannot use Auras, Signature Techniques, Unique Abilities, or Transformations
      fusion._plumpFrailRestricted = true;
    }

    // --- Fission bonuses (J5/J6) ---
    if (fusion.type === "fission" && fusion.splitType) {
      // Level 1: Reduce ToP by 1 (if base ToP is 1, -2 Combat Rolls instead)
      if (baseTier <= 1) {
        fusion._fissionCombatRollPenalty = 2;
      } else {
        system.tier = Math.max(1, (system.tier || tier) - 1);
        fusion._fissionTierReduced = true;
      }
      // Level 2: Paragon +2(bT) Soak, Renegade +2(bT) Wound
      if (fusion.splitType === "paragon") {
        fusion._fissionSoakBonus = 2 * baseTier;
      } else if (fusion.splitType === "renegade") {
        fusion._fissionWoundBonus = 2 * baseTier;
      }
    }
  }

  /**
   * Apply mechanical effects of Transformation Aspects.
   * Called after _calculateCombatStats so speed, saves, size are already set.
   */
  _applyTransformationAspects(system, tier, baseTier) {
    let highSpeedLevel = 0;
    const enhancedSaves = new Set();
    let bulkyCount = 0;
    let armoredActive = false;
    let drainingLevel = 0;
    let weakeningActive = false;
    let lightDependentActive = false;
    let exhaustingActive = false;
    let powerHighLevel = 0;
    let rampagingLevel = 0;
    let temporaryLevel = 0;
    let heartbeatActive = false;
    let longTransformationActive = false;
    let realizationActive = false;
    let noLpRegen = false;
    const gradedTransformations = [];
    let crimsonAcclimationActive = false;
    let hasPerfectKiControl = false;
    let maxTierReq = 0; // For Draining: use highest Tier of Power Requirement
    const masteryConditionals = [];
    let mindfulAspectLevel = 0;
    let ragingAspectLevel = 0;
    let strainlessActive = false;

    const allTransForAspects = [...(system.transformations || []), ...(system._gainedActiveTransformations || [])];
    for (const trans of allTransForAspects) {
      if (!trans.active) continue;
      const aspects = trans.aspects || [];
      // Prelude rule: "you do not benefit from ... the Strainless Aspect while in this Transformation"
      const preludeBlocksStrainless = trans.preludeActive && aspects.some(a => String(a).trim() === "Prelude");

      // Apply mastery aspect changes before standard processing
      if (trans.mastered && trans.catalogKey) {
        const masteryCat = CONFIG.DBU?.masteryEffectsCatalog ?? {};
        const mastery = masteryCat[trans.catalogKey];
        if (mastery) {
          // Remove aspects
          if (mastery.aspectsToRemove?.length) {
            const toRemove = mastery.aspectsToRemove.map(r => r.toLowerCase());
            const filtered = aspects.filter(a =>
              !toRemove.some(r => a.toLowerCase().includes(r))
            );
            aspects.length = 0;
            aspects.push(...filtered);
          }
          // Add aspects
          if (mastery.aspectsToAdd?.length) {
            for (const add of mastery.aspectsToAdd) {
              if (!aspects.some(a => a.toLowerCase().includes(add.toLowerCase()))) {
                aspects.push(add);
              }
            }
          }
          // Collect conditionals (exclude attrBonus — already handled in _calculateAttributeModifiers)
          if (mastery.conditionals?.length) {
            for (const cond of mastery.conditionals) {
              if (cond.type !== "attrBonus") {
                masteryConditionals.push(cond);
              }
            }
          }
        }
      }
      // Parse grade from gradeOrStacks (e.g., "3", "2/5", "Grade 3")
      let grade = 0;
      const gs = String(trans.gradeOrStacks || "");
      const gMatch = gs.match(/(\d+)/);
      if (gMatch) grade = parseInt(gMatch[1]);

      // Track max Tier of Power Requirement (for Draining)
      const trMatch = String(trans.tierRequirement || "").match(/(\d+)/);
      if (trMatch) maxTierReq = Math.max(maxTierReq, parseInt(trMatch[1]));

      for (const a of aspects) {
        const clean = a.trim();

        // --- High Speed [LV~3] ---
        const hsMatch = clean.match(/High[\s-]?Speed\s*\(([^)]+)\)/i);
        if (hsMatch) {
          const lv = DBUActor._parseAspectLevel(hsMatch[1], grade);
          if (lv !== null) highSpeedLevel = Math.max(highSpeedLevel, Math.min(lv, 3));
        }

        // --- Enhanced Save (type/type) ---
        const esMatch = clean.match(/Enhanced Save\s*\(([^)]+)\)/i);
        if (esMatch) {
          const saves = esMatch[1].split('/').map(s => s.trim().toLowerCase());
          for (const s of saves) {
            if (s === 'all') {
              enhancedSaves.add('impulsive');
              enhancedSaves.add('corporeal');
              enhancedSaves.add('cognitive');
              enhancedSaves.add('morale');
            } else if (['impulsive', 'corporeal', 'cognitive', 'morale'].includes(s)) {
              enhancedSaves.add(s);
            }
          }
        }

        // --- Bulky ---
        if (clean === 'Bulky') bulkyCount++;

        // --- Armored ---
        if (clean === 'Armored') armoredActive = true;

        // --- Draining [LV] ---
        const drMatch = clean.match(/Draining\s*\(([^)]+)\)/i);
        if (drMatch) {
          const lv = DBUActor._parseAspectLevel(drMatch[1], grade);
          if (lv !== null) drainingLevel += lv;
        }

        // --- Weakening ---
        if (clean === 'Weakening') weakeningActive = true;

        // --- Light Dependent ---
        if (/^Light Dependent\b/i.test(clean)) lightDependentActive = true;

        // --- Exhausting ---
        if (/^Exhausting\b/i.test(clean)) exhaustingActive = true;

        // --- Power High [LV~3] ---
        const phMatch = clean.match(/Power\s+High\s*\(([^)]+)\)/i);
        if (phMatch) {
          const lv = DBUActor._parseAspectLevel(phMatch[1], grade);
          if (lv !== null) powerHighLevel = Math.max(powerHighLevel, Math.min(lv, 3));
        } else if (/^Power\s+High\b/i.test(clean)) {
          powerHighLevel = Math.max(powerHighLevel, 1);
        }

        // --- Rampaging [LV~2] ---
        const rpMatch = clean.match(/Rampaging\s*\(([^)]+)\)/i);
        if (rpMatch) {
          const lv = DBUActor._parseAspectLevel(rpMatch[1], grade);
          if (lv !== null) rampagingLevel = Math.max(rampagingLevel, Math.min(lv, 2));
        } else if (/^Rampaging\b/i.test(clean)) {
          rampagingLevel = Math.max(rampagingLevel, 1);
        }

        // --- Temporary [LV~5] ---
        const tmpMatch = clean.match(/Temporary\s*\(([^)]+)\)/i);
        if (tmpMatch) {
          const lv = DBUActor._parseAspectLevel(tmpMatch[1], grade);
          if (lv !== null) temporaryLevel = Math.max(temporaryLevel, Math.min(lv, 5));
        } else if (/^Temporary\b/i.test(clean)) {
          temporaryLevel = Math.max(temporaryLevel, 1);
        }

        // --- Heartbeat ---
        if (clean === 'Heartbeat') heartbeatActive = true;

        // --- Long Transformation ---
        if (/^Long Transformation\b/i.test(clean)) longTransformationActive = true;

        // --- Realization ---
        if (clean === 'Realization') realizationActive = true;

        // --- Perfect Ki Control ---
        if (clean === 'Perfect Ki Control') hasPerfectKiControl = true;

        // --- Strainless aspect — present unless suppressed by Prelude
        if (clean === 'Strainless' && !preludeBlocksStrainless) strainlessActive = true;

        // --- Mindful [LV~3] aspect — bumps Critical Result Extra Dice category by LV per active TF
        // (only takes effect while combatStates.mindful is on; we accumulate the level here)
        const mfMatch = clean.match(/^Mindful\s*\(([^)]+)\)/i) || (clean === 'Mindful' ? [null, '1'] : null);
        if (mfMatch) {
          const lv = DBUActor._parseAspectLevel(mfMatch[1], grade);
          if (lv !== null) mindfulAspectLevel = Math.max(mindfulAspectLevel, Math.min(lv, 3));
        }

        // --- Raging [LV~3] aspect — bumps Raging State Extra Dice category by LV
        // (only takes effect while combatStates.raging is on)
        const rgMatch = clean.match(/^Raging\s*\(([^)]+)\)/i) || (clean === 'Raging' ? [null, '1'] : null);
        if (rgMatch) {
          const lv = DBUActor._parseAspectLevel(rgMatch[1], grade);
          if (lv !== null) ragingAspectLevel = Math.max(ragingAspectLevel, Math.min(lv, 3));
        }
      }

      // --- Graded with LP Cost (from catalog gradesTable) ---
      const catalog = CONFIG.DBU?.transformationsCatalog || {};
      const catEntry = trans.catalogKey ? catalog[trans.catalogKey] : null;
      if (catEntry?.gradesTable && grade > 0) {
        const gradeEntry = catEntry.gradesTable.find(g => g.grade === grade) || catEntry.gradesTable[0];
        const lpCostNum = DBUActor._parseLpCostFormula(gradeEntry.lpCost, baseTier, tier);
        gradedTransformations.push({
          catalogKey: trans.catalogKey,
          name: trans.name || catEntry.name,
          grade,
          gradeEntry,
          lpCostFormula: gradeEntry.lpCost,
          lpCostNum,
          topExtraDice: gradeEntry.topExtraDice,
          crimsonAcclimation: !!catEntry.crimsonAcclimation
        });
      }

      // --- No LP Regen (scan trait text) ---
      if (catEntry?.traitGroups) {
        for (const group of catEntry.traitGroups) {
          for (const eff of (group.effects || [])) {
            if (eff.activationType === "passive" && (eff.text || "").toLowerCase().includes("cannot regain life points")) {
              noLpRegen = true;
            }
          }
        }
      }
    }

    // --- Crimson Acclimation: +2 Combined ST, +2(bT) LP if co-active lacks Perfect Ki Control ---
    const hasCrimsonTrans = gradedTransformations.some(g => g.crimsonAcclimation);
    if (hasCrimsonTrans && !hasPerfectKiControl) {
      crimsonAcclimationActive = true;
      for (const gt of gradedTransformations) {
        if (gt.crimsonAcclimation) {
          gt.crimsonPenalty = 2 * baseTier;
          gt.lpCostNum += gt.crimsonPenalty;
        }
      }
    }

    // Apply High Speed: +1(T) Speed per level
    if (highSpeedLevel > 0) {
      const bonus = highSpeedLevel * tier;
      system.status.normalSpeed = Math.max(0, (system.status.normalSpeed || 0) + bonus);
      system.status.boostedSpeed = Math.max(0, (system.status.boostedSpeed || 0) + bonus);
    }

    // Apply Light Dependent: -5(bT) Max Capacity when no Power stacks
    // "While you have no stacks of Power, reduce your Max Capacity by 5(bT)." (transformation-aspects.txt)
    if (lightDependentActive) {
      const powerStacks = system.tracking?.powerStacks || 0;
      if (powerStacks === 0) {
        system.capacity.max = Math.max(0, system.capacity.max - 5 * baseTier);
      }
    }

    // Apply Enhanced Save: +1(T) to each listed saving throw
    if (enhancedSaves.size > 0 && system.savingThrows) {
      for (const saveKey of enhancedSaves) {
        if (system.savingThrows[saveKey]) {
          system.savingThrows[saveKey].bonus += tier;
          // Recalculate CT: Enhanced Save reduces CT by 1 (minimum 5)
          system.savingThrows[saveKey].ct = Math.max(5, system.savingThrows[saveKey].ct - 1);
        }
      }
    }

    // --- Weakening: halve transformation Attribute Modifier Bonuses ---
    // "If your KP < 1/4 max KP, reduce this Transformation's Attribute Modifier Bonuses
    //  (after all calculations) by 1/2. Exception: entered via Surging Strength.
    //  Also if God Ki and DKP < 1/4 max DKP." (transformation-aspects.txt)
    let weakeningTriggered = false;
    if (weakeningActive && !system.combatStates?.surging) {
      const currentKP = system.kiPool?.value ?? 0;
      const maxKP = system.kiPool?.max ?? 0;
      const isKPLow = currentKP < Math.floor(maxKP / 4);
      const godKiActive = system.godKi?.active;
      const currentDKP = system.divineKiPoints?.value ?? 0;
      // "below 1/4 of the amount of Divine Ki Points you started the Combat Encounter with" (transformation-aspects.txt)
      const encounterStartDKP = system.transformationMeta?.encounterStartDKP;
      const dkpThreshold = encounterStartDKP != null ? encounterStartDKP : (system.divineKiPoints?.max ?? 0);
      const isDKPLow = godKiActive && currentDKP < Math.floor(dkpThreshold / 4);

      if (isKPLow || isDKPLow) {
        weakeningTriggered = true;
        for (const key of ["ag", "fo", "te", "sc", "in", "ma", "pe"]) {
          let weakeningBonus = 0;
          for (const trans of allTransForAspects) {
            if (!trans.active) continue;
            const hasWeakening = (trans.aspects || []).some(a => a.trim() === "Weakening");
            if (!hasWeakening) continue;
            if (trans.attrBonuses?.[key]) {
              weakeningBonus += DBUActor.parseAttrBonus(trans.attrBonuses[key], tier, system.baseTier);
            }
            if (trans.mastered && trans.catalogKey) {
              const mCat = CONFIG.DBU?.masteryEffectsCatalog ?? {};
              const mData = mCat[trans.catalogKey];
              if (mData?.attrBonuses?.[key]) {
                weakeningBonus += DBUActor.parseAttrBonus(mData.attrBonuses[key], tier, system.baseTier);
              }
            }
          }
          if (weakeningBonus > 0) {
            const reduction = Math.floor(weakeningBonus / 2);
            const attr = system.attributes[key];
            if (attr) {
              attr.modifier -= reduction;
              attr.totalScore -= reduction;
            }
          }
        }
      }
    }

    // Metamorphosis "Weakest State": if baseTier < S+1, increase Draining by 1 level
    const METAMORPHOSIS_STAGES = { full_suppression: 0, limited_suppression: 1, partial_suppression: 2, true_form: 3 };
    for (const trans of allTransForAspects) {
      if (!trans.active) continue;
      const stage = METAMORPHOSIS_STAGES[trans.catalogKey];
      if (stage !== undefined) {
        const effectiveReq = stage + 1;
        if (baseTier < effectiveReq) {
          drainingLevel += 1;
        }
        break; // Only one Metamorphosis stage can be active
      }
    }

    // Store aspect effects on system for sheet display and reference
    system.aspectEffects = {
      highSpeedLevel,
      highSpeedBonus: highSpeedLevel * tier,
      enhancedSaves: [...enhancedSaves],
      bulkyCount,
      armoredActive,
      drainingLevel,
      drainingTier: maxTierReq || tier,
      drainingKiPerTurn: drainingLevel * 3 * (maxTierReq || tier),
      weakeningActive,
      weakeningTriggered,
      lightDependentActive,
      exhaustingActive,
      powerHighLevel,
      rampagingLevel,
      temporaryLevel,
      temporaryRoundsLeft: temporaryLevel > 0 ? 6 - temporaryLevel : 0,
      heartbeatActive,
      longTransformationActive,
      realizationActive,
      gradedTransformations,
      crimsonAcclimationActive,
      noLpRegen,
      masteryConditionals,
      mindfulAspectLevel,
      ragingAspectLevel,
      strainlessActive
    };

    // Apply Mindful aspect: only effective while in Mindful Combat State.
    // "Increase the Dice Category of the Extra Dice gained through a Critical Result by 1 per LV"
    system.aptitudes.criticalExtraDiceCatBonus = (system.combatStates?.mindful && mindfulAspectLevel > 0)
      ? mindfulAspectLevel : 0;
    // Apply Raging aspect: only effective while in Raging Combat State.
    // "Increase the Dice Category of Extra Dice gained through Raging State effects by 1 per LV"
    system.aptitudes.ragingExtraDiceCatBonus = (system.combatStates?.raging && ragingAspectLevel > 0)
      ? ragingAspectLevel : 0;
  }

  /**
   * Apply mastery conditional effects to combat stats.
   * Must run AFTER _applyTransformationAspects() which collects masteryConditionals.
   *
   * Note: Some conditional types store values on system.aptitudes for future UI display
   * (masteryComRollBonus, masteryWoundBonus, masteryDRBonus, masteryStressTestMod,
   * masteryScalingBonus, masteryExtraDice, masteryKiCostReduction). These are not yet
   * consumed by templates but are available for combat tab / damage calc enhancements.
   */
  _applyMasteryConditionals(system, tier, baseTier) {
    const conditionals = system.aspectEffects?.masteryConditionals ?? [];
    if (!conditionals.length) return;

    for (const cond of conditionals) {
      if (!DBUActor._evaluateMasteryCondition(cond.condition, system)) continue;

      const val = cond.value ? DBUActor.parseAttrBonus(String(cond.value), tier, system.baseTier) : 0;

      switch (cond.type) {
        case "combatRollBonus":
          system.aptitudes.masteryComRollBonus = (system.aptitudes.masteryComRollBonus ?? 0) + val;
          break;

        case "soakBonus":
          system.status.soak = (system.status.soak ?? 0) + val;
          break;

        case "woundRollBonus":
          system.aptitudes.masteryWoundBonus = (system.aptitudes.masteryWoundBonus ?? 0) + val;
          break;

        case "damageReductionBonus":
          system.aptitudes.masteryDRBonus = (system.aptitudes.masteryDRBonus ?? 0) + val;
          break;

        case "defenseValueBonus":
          system.aptitudes.defenseValue = (system.aptitudes.defenseValue ?? 0) + val;
          break;

        case "defenseValuePenaltyHalve":
          if (cond.source === "sizeCategory") {
            const sizeData = DBUActor.SIZE_DATA[system.status?.currentSize ?? "medium"] || DBUActor.SIZE_DATA.medium;
            const fullPenalty = sizeData.defenseMod * tier;
            if (fullPenalty < 0) {
              system.aptitudes.defenseValue += Math.floor(Math.abs(fullPenalty) / 2);
            }
          }
          if (cond.source === "superStack") {
            system.aptitudes.halveSuperStackDVPenalty = true;
          }
          break;

        case "strikePenaltyHalve":
          if (cond.source === "superStack") {
            system.aptitudes.halveSuperStackStrikePenalty = true;
          }
          break;

        case "speedBonus":
          system.status.normalSpeed = (system.status.normalSpeed ?? 0) + val;
          system.status.boostedSpeed = (system.status.boostedSpeed ?? 0) + val;
          break;

        case "stressTestMod":
          system.aptitudes.masteryStressTestMod = (system.aptitudes.masteryStressTestMod ?? 0) + val;
          break;

        case "drainingReduction": {
          const reduce = cond.value ?? 0;
          if (system.aspectEffects) {
            system.aspectEffects.drainingLevel = Math.max(0, (system.aspectEffects.drainingLevel ?? 0) - reduce);
            system.aspectEffects.drainingKiPerTurn = system.aspectEffects.drainingLevel * 3 * (system.aspectEffects.drainingTier ?? tier);
          }
          break;
        }

        case "highSpeedLevel": {
          const addLevels = cond.value ?? 0;
          if (system.aspectEffects) {
            const currentHS = system.aspectEffects.highSpeedLevel ?? 0;
            const newHS = Math.min(currentHS + addLevels, 3);
            const addedBonus = (newHS - currentHS) * tier;
            system.aspectEffects.highSpeedLevel = newHS;
            system.aspectEffects.highSpeedBonus = newHS * tier;
            system.status.normalSpeed = (system.status.normalSpeed ?? 0) + addedBonus;
            system.status.boostedSpeed = (system.status.boostedSpeed ?? 0) + addedBonus;
          }
          break;
        }

        case "scalingAspectLevel":
          system.aptitudes.masteryScalingBonus = (system.aptitudes.masteryScalingBonus ?? 0) + (cond.value ?? 0);
          break;

        case "enhancedSave": {
          const saveKey = cond.value;
          if (saveKey && system.savingThrows?.[saveKey]) {
            system.savingThrows[saveKey].bonus += tier;
            system.savingThrows[saveKey].ct = Math.max(5, system.savingThrows[saveKey].ct - 1);
            if (system.aspectEffects && !system.aspectEffects.enhancedSaves.includes(saveKey)) {
              system.aspectEffects.enhancedSaves.push(saveKey);
            }
          }
          break;
        }

        case "extraDice":
          system.aptitudes.masteryExtraDice = (system.aptitudes.masteryExtraDice ?? 0) + val;
          break;

        case "kiCostReduction":
          system.aptitudes.masteryKiCostReduction = (system.aptitudes.masteryKiCostReduction ?? 0) + val;
          break;

        case "kiMultiplier": {
          const fraction = cond.value ?? 0;
          if (fraction > 0 && system.kiPool) {
            system.kiPool.max = Math.floor(system.kiPool.max * (1 + fraction));
          }
          break;
        }
      }
    }

    // Store summary for UI display
    system.masteryEffects = {
      hasActiveEffects: conditionals.some(c => DBUActor._evaluateMasteryCondition(c.condition, system)),
      conditionals: conditionals.map(c => ({
        ...c,
        active: DBUActor._evaluateMasteryCondition(c.condition, system)
      }))
    };
  }

  /**
   * Parse LP Cost formula like "3(bT)+2" → 3*baseTier + 2, "4(bT)" → 4*baseTier.
   */
  static _parseLpCostFormula(formula, baseTier, tier) {
    if (!formula) return 0;
    tier = tier || baseTier; // fallback if caller doesn't pass tier
    let total = 0;
    const btMatch = formula.match(/(\d+)\(bT\)/);
    const tMatch = formula.match(/(\d+)\(T\)/);
    if (btMatch) total += parseInt(btMatch[1]) * baseTier;
    else if (tMatch) total += parseInt(tMatch[1]) * tier;
    const addMatch = formula.match(/\+(\d+)$/);
    if (addMatch) total += parseInt(addMatch[1]);
    return total;
  }

  // =============================================================
  // Roll Data (for initiative formula and other roll expressions)
  // =============================================================

  /** @override */
  getRollData() {
    const data = super.getRollData();
    // Explicitly pull derived aptitudes from this.system (computed in prepareDerivedData)
    // because super.getRollData() may return source schema defaults (all 0s).
    const apt = this.system?.aptitudes ?? {};
    data.aptitudes = data.aptitudes || {};
    data.aptitudes.initiative = apt.initiative ?? 0;
    data.aptitudes.initiativeValue = apt.initiativeValue ?? 0;
    data.aptitudes.initiativeRollBonus = apt.initiativeRollBonus ?? 0;
    return data;
  }

  // =============================================================
  // Damage Calculator
  // =============================================================

  _calculateDamageCalc(system, tier, baseTier) {
    const dc = system.damageCalc;
    if (!dc) return;

    const soak = system.status?.soak || 0;
    let woundRoll = Number(dc.woundRoll) || 0;
    // Superior state: increase damage received by 2(T)
    if (system.combatStates?.superior) woundRoll += 2 * tier;
    let dmgCategory = dc.category || "standard";
    const defense = dc.defense || "none";

    // Guard: halve wound and reduce damage category by 1 step.
    if (defense === "guard") {
      woundRoll = Math.floor(woundRoll / 2);
      if (dmgCategory === "lethal") dmgCategory = "direct";
      else if (dmgCategory === "direct") dmgCategory = "standard";
    }

    // Armored aspect: "Reduce the Damage Category of all Damage you would take
    // from Attacking Maneuvers by 1" (transformation-aspects.txt)
    if (system.aspectEffects?.armoredActive) {
      if (dmgCategory === "lethal") dmgCategory = "direct";
      else if (dmgCategory === "direct") dmgCategory = "standard";
    }

    // Prone: increase damage category by 1 step.
    if (this._isConditionActive(system, "prone")) {
      if (dmgCategory === "standard") dmgCategory = "direct";
      else if (dmgCategory === "direct") dmgCategory = "lethal";
    }

    // Effective soak after category and defense modifiers.
    let effectiveSoak = soak;
    if (dmgCategory === "direct") effectiveSoak = Math.floor(soak / 2);
    else if (dmgCategory === "lethal") effectiveSoak = 0;
    if (defense === "directHit") effectiveSoak = Math.floor(effectiveSoak * 1.5);

    const totalReduction = (Number(dc.damageReduction) || 0) + effectiveSoak;
    dc.totalReduction = totalReduction;

    let healthReduction = Math.max(0, woundRoll - totalReduction);

    // Broken: "If your Soak Value is 0, either before or after applying any number of
    // stacks from Broken, increase the Damage you receive by 2(T) for each stack" (damage-conditions.txt)
    // Check rawSoak (pre-minimum) since the tier minimum clamp would otherwise prevent this from firing.
    const rawSoak = system.status?.rawSoak ?? soak;
    if (rawSoak <= 0) {
      const brokenStacks = this._getConditionStacks(system, "broken");
      healthReduction += brokenStacks * 2 * tier;
    }

    dc.healthReduction = healthReduction;
  }

  // =============================================================
  // Disabled racial passive computation (effect panel toggles)
  // =============================================================

  _computeDisabledRacialPassives(system) {
    const enabledPassives = system.effectTracking?.enabledPassives || {};
    const disabled = new Set();
    const traitCatalog = CONFIG.DBU?.racialTraitsCatalog || {};
    for (const traits of Object.values(traitCatalog)) {
      for (const trait of traits) {
        const traitKey = trait.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const category = trait.traitCategory || "secondary";
        for (const eff of (trait.effects || [])) {
          const actType = eff.activationType || "passive";
          // Check passives and resolved options (both can be toggled)
          if (actType !== "passive" && !["option", "multi-option", "choice"].includes(actType)) continue;
          const effectId = `racial_${category}_${traitKey}_${eff.level}`;
          if (enabledPassives[effectId] === false) {
            disabled.add(trait.id);
            break;
          }
        }
      }
    }
    return disabled;
  }

  // Racial Trait Automation (dispatches to per-race modules)
  // =============================================================

  _calculateRacialTraitBonuses(system, tier, baseTier) {
    // Emit aptitude flag per selected racial-trait option so every multi-option racial trait
    // produces a trackable state change. Flag name: `racial_<traitId>_<option_slug>_active`.
    if (system.racialOptionSelections) {
      for (const traitId of Object.keys(system.racialOptionSelections)) {
        const sel = system.racialOptionSelections[traitId];
        if (!sel || typeof sel !== "object") continue;
        for (const lvl of Object.keys(sel)) {
          const val = sel[lvl];
          const apply = (v) => {
            if (!v || typeof v !== "string" || v === "none") return;
            const slug = v.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
            if (slug) system.aptitudes[`racial_${traitId}_${slug}_active`] = true;
          };
          if (Array.isArray(val)) {
            for (const v of val) apply(v);
          } else {
            apply(val);
          }
        }
      }
    }
    // Possession: use host's race for racial trait dispatch
    const raceRaw = system.fusion?._possessionRace || system.race;
    // Support composite race strings (e.g. "saiyan / earthling") from Regular Fusion
    const races = (raceRaw || "").split(" / ").map(r => r.trim()).filter(Boolean);
    const raceDispatch = {
      saiyan: applySaiyanBonuses,
      earthling: applyEarthlingBonuses,
      majin: applyMajinBonuses,
      bioAndroid: applyBioAndroidBonuses,
      android: applyAndroidBonuses,
      arcosian: applyArcosianBonuses,
      cerealian: applyCerealianBonuses,
      namekian: applyNamekianBonuses,
      nekoMajin: applyNekoMajinBonuses,
      neoTuffle: applyNeoTuffleBonuses,
      shadowDragon: applyShadowDragonBonuses,
      shinjin: applyShinjinBonuses,
      undead: applyUndeadBonuses,
      customSpecies: applyCustomSpeciesBonuses
    };
    for (const race of races) {
      const fn = raceDispatch[race];
      if (fn) fn(system, tier, baseTier);
    }
    // Possession: also dispatch possessor's original race so their retained traits still function
    const origRace = system.fusion?._possessorOriginalRace;
    if (origRace && !races.includes(origRace)) {
      const fn = raceDispatch[origRace];
      if (fn) fn(system, tier, baseTier);
    }
  }

  // =============================================================
  // Adversary System Calculations
  // =============================================================

  _calculateAdversaryStats(system, level, tier, baseTier) {
    const adv = system.adversary;
    if (!adv?.enabled) return;

    const pl = level;

    // ---- Adversary Category: LP/KP modifications ----
    switch (adv.category) {
      case "villain":
        system.lifePoints.max += 4 * pl;
        system.kiPool.max += 4 * pl;
        break;
      case "superior":
        system.lifePoints.max += 2 * pl;
        system.kiPool.max += 2 * pl;
        break;
      case "mook":
        system.lifePoints.max = Math.floor(system.lifePoints.max / 4);
        system.kiPool.max = Math.floor(system.kiPool.max / 2);
        break;
      // "standard" = no change
    }

    // ---- Difficulty Level: PL-equivalent bonuses (display only) ----
    let plBonus = 0;
    switch (adv.difficultyLevel) {
      case "medium": plBonus = Math.max(1, (1 * baseTier) - 1); break;
      case "hard":   plBonus = (1 * baseTier) + 1; break;
      case "super":  plBonus = (1 * baseTier) + 2; break;
    }
    adv.plBonus = plBonus;

    // Trait slots from difficulty + weaknesses
    const difficultyTraitSlots = { easy: 0, medium: 1, hard: 2, super: 3 };
    const weaknessCount = (adv.weaknesses || []).length;
    adv.traitSlots = (difficultyTraitSlots[adv.difficultyLevel] || 0) + weaknessCount;

    // ---- Party Rules derived values ----
    const partySize = adv.partySize || 1;

    if (adv.partyRules?.narrativeStamina) {
      adv.narrativeStaminaLP = Math.floor(system.lifePoints.max / 20) * Math.max(0, partySize - 1);
      adv.narrativeStaminaKP = Math.floor(system.kiPool.max / 20) * Math.max(0, partySize - 1);
    } else {
      adv.narrativeStaminaLP = 0;
      adv.narrativeStaminaKP = 0;
    }

    if (adv.partyRules?.oneManArmy) {
      adv.extraCounterActions = Math.max(0, partySize - 1);
      adv.oneManArmyMightBonus = (adv.category === "villain") ? tier : 0;
    } else {
      adv.extraCounterActions = 0;
      adv.oneManArmyMightBonus = 0;
    }

    if (adv.partyRules?.villainousKarma) {
      adv.karmaPoints = (adv.category === "villain" || adv.category === "superior") ? 6 : 3;
    } else {
      adv.karmaPoints = 0;
    }

    // ---- Dangerous Minion modifications ----
    const minion = adv.minion;
    if (minion?.enabled) {
      let minionPLMod = 0;
      let minionLPMod = 0;
      switch (minion.dangerLevel) {
        case "very-easy": minionPLMod = -2; minionLPMod = -1; break;
        case "easy":      minionPLMod = -1; minionLPMod = 0; break;
        case "medium":    minionPLMod = 0;  minionLPMod = 1; break;
        case "hard":      minionPLMod = 1;  minionLPMod = 2; break;
        case "very-hard": minionPLMod = 2;  minionLPMod = 3; break;
      }
      minion.plModifier = minionPLMod;
      minion.lpModifier = minionLPMod;
    }
  }

  // =============================================================
  // Equipment Bonus Helpers
  // =============================================================

  _calcApparelBonus(item) {
    const baseTier = this.system.baseTier || 1;
    const config = CONFIG.DBU ?? {};
    const gradeData = config.craftsmanshipGrades?.[item.system.craftsmanshipGrade || 1] || {};
    const apparelGrade = config.apparelGrades?.[gradeData.apparelGrade || "low"] || { multiplier: 1 };
    let bonus = apparelGrade.multiplier * baseTier;
    const quals = item.system.qualities || [];
    if (quals.some(q => q.qualityKey === "dense_armor")) bonus += baseTier;
    if (quals.some(q => q.qualityKey === "divine_apparel")) bonus += baseTier;
    return bonus;
  }

  _getEquipmentSoakBonus() {
    const system = this.system;
    const baseTier = system.baseTier || 1;
    let soak = 0;
    const slots = system.wornApparelSlots || {};
    for (const key of ["topLayer", "middleLayer", "bottomLayer"]) {
      const itemId = slots[key];
      if (!itemId) continue;
      const item = this.items.get(itemId);
      if (!item) continue;
      const quals = item.system.qualities || [];
      if (quals.some(q => q.qualityKey === "jacket")) soak += baseTier;
      if (key === "topLayer" && quals.some(q => q.qualityKey === "enchanted")) {
        soak += this._calcApparelBonus(item);
      }
    }
    return soak;
  }

  _getEquipmentDR() {
    const system = this.system;
    const slots = system.wornApparelSlots || {};
    const topId = slots.topLayer;
    if (!topId) return 0;
    const item = this.items.get(topId);
    if (!item || item.system.apparelCategory !== "armor") return 0;
    let bonus = this._calcApparelBonus(item);
    const quals = item.system.qualities || [];
    if (quals.some(q => q.qualityKey === "sleek_design")) bonus = Math.floor(bonus / 2);
    return bonus;
  }

  _getEquipmentDefenseBonus() {
    const system = this.system;
    const slots = system.wornApparelSlots || {};
    const topId = slots.topLayer;
    if (!topId) return 0;
    const item = this.items.get(topId);
    if (!item || item.system.apparelCategory !== "combat_clothing") return 0;
    return Math.ceil(this._calcApparelBonus(item) / 2);
  }

  _getEquipmentCombatPenalty() {
    const system = this.system;
    const slots = system.wornApparelSlots || {};
    let penalty = this._calcLayerPenalty();
    for (const key of ["topLayer", "middleLayer", "bottomLayer"]) {
      const itemId = slots[key];
      if (!itemId) continue;
      const item = this.items.get(itemId);
      if (!item || item.system.apparelCategory !== "weights") continue;
      const quals = item.system.qualities || [];
      if (!quals.some(q => q.qualityKey === "focal")) {
        penalty += this._calcApparelBonus(item);
      }
    }
    return penalty;
  }

  _calcLayerPenalty() {
    const baseTier = this.system.baseTier || 1;
    const slots = this.system.wornApparelSlots || {};
    let penalizingLayers = 0;
    for (const key of ["topLayer", "middleLayer", "bottomLayer"]) {
      const itemId = slots[key];
      if (!itemId) continue;
      const item = this.items.get(itemId);
      if (!item) continue;
      if (item.system.apparelCategory === "standard_clothing") continue;
      const quals = item.system.qualities || [];
      if (quals.some(q => q.qualityKey === "lightweight")) continue;
      if (quals.some(q => q.qualityKey === "sleek_design")) continue;
      penalizingLayers++;
    }
    return Math.max(0, penalizingLayers - 1) * Math.ceil(baseTier / 2);
  }

  // =============================================================
  // Condition & Aura Helpers
  // =============================================================

  /**
   * Get the currently active aura (own or gained from one-sided fusion).
   */
  _getActiveAura(system) {
    const auras = system.signatureAuras || [];
    const ownActive = auras.find(a => a.active) || null;
    if (ownActive) return ownActive;

    // Check for active gained aura from suppressed actor
    const fusion = system.fusion || {};
    const gainedKey = fusion.activeGainedAuraId || "";
    if (!gainedKey) return null;
    // gainedKey format: "suppActorId_auraId"
    const sepIdx = gainedKey.indexOf("_");
    if (sepIdx < 0) return null;
    const suppId = gainedKey.substring(0, sepIdx);
    const auraId = Number(gainedKey.substring(sepIdx + 1));
    const suppActor = game.actors?.get(suppId);
    if (!suppActor) return null;
    const suppAuras = suppActor.system?.signatureAuras || [];
    const found = suppAuras.find(a => a.id === auraId);
    return found ? foundry.utils.deepClone(found) : null;
  }

  _isConditionActive(system, id) {
    const c = (system.conditions || []).find(c => c.id === id);
    return c ? c.active : false;
  }

  _getConditionStacks(system, id) {
    const c = (system.conditions || []).find(c => c.id === id);
    return (c && c.active) ? (c.stacks || 1) : 0;
  }

  /**
   * Unified buff total: scan both manual custom buffs and auto-derived buffs.
   * Formula per buff: flat + (bT × baseTier) + (T × tier)
   * Returns the fully-scaled total — callers should NOT multiply by tier.
   *
   * @param {object} system - The actor's system data
   * @param {string} effectName - The effect name to match (e.g. "Max Life Points", "Strike")
   * @returns {number} The total buff value (already tier-scaled)
   */
  // ============================================================
  // Absorption helpers (Insatiable / Pursuit of Perfection)
  // ============================================================

  /** Insatiable Manifested Power active (catalogKey "insatiable") */
  _hasInsatiableActive(system) {
    return (system.transformations || []).some(t => t.active && t.catalogKey === "insatiable");
  }

  /** Pursuit of Perfection option from Genetic Splicing trait */
  _hasPursuitOfPerfection(system) {
    const GENETIC_SPLICING_ID = "535d352a96774d48";
    const sel = system.racialOptionSelections?.[GENETIC_SPLICING_ID];
    const raw = sel?.["1"] ?? sel?.[1] ?? system.geneticSplicingOption ?? "";
    return String(raw).toLowerCase().includes("perfection");
  }

  /**
   * Max number of Absorbed Characters allowed:
   *  - Insatiable active → 1 (overrides everything)
   *  - Pursuit of Perfection (without Insatiable) → 2
   *  - Otherwise → baseTier
   */
  _getAbsorptionLimit(system) {
    if (this._hasInsatiableActive(system)) return 1;
    if (this._hasPursuitOfPerfection(system)) return 2;
    return system.baseTier || 1;
  }

  /**
   * Whether to block gained abilities (sigs/auras/uniques/transforms/secondary trait)
   * from absorbed characters. Pursuit of Perfection alone restricts to attribute mods only;
   * Insatiable lifts that restriction when both are present.
   */
  _blockGainedAbilities(system) {
    return this._hasPursuitOfPerfection(system) && !this._hasInsatiableActive(system);
  }

  _getBuffTotal(system, effectName) {
    const tier = system.tier || 1;
    const baseTier = system.baseTier || 1;
    // Aliases: code-side queries match all spreadsheet/legacy variants for the same effect.
    // Each entry maps a canonical query name → the set of buff effect strings that satisfy it.
    const aliasMap = {
      "Max Ki Points": ["Max Ki Points", "Max Ki Pool"],
      "Max Ki Pool": ["Max Ki Points", "Max Ki Pool"],
      "Impulsive Save": ["Impulsive Save", "Impulsive Saves"],
      "Cognitive Save": ["Cognitive Save", "Cognitive Saves"],
      "Corporeal Save": ["Corporeal Save", "Corporeal Saves"],
      "Morale Save": ["Morale Save", "Morale Saves"],
      "Strike": ["Strike", "Strike (All)"],
      "Wound": ["Wound", "Wound (All)"]
    };
    const accepted = new Set(aliasMap[effectName] || [effectName]);
    let total = 0;
    // Manual custom buffs (user-entered via sheet UI)
    for (const buff of (system.customBuffs || [])) {
      if (!buff.active) continue;
      if (accepted.has(buff.effect)) {
        total += (buff.flat || 0) + (buff.bT || 0) * baseTier + (buff.T || 0) * tier;
      }
    }
    // Auto-derived buffs (generated by _generateDerivedBuffs from talents/states/transformations)
    for (const buff of (system._derivedBuffs || [])) {
      if (!buff.active) continue;
      if (accepted.has(buff.effect)) {
        total += (buff.flat || 0) + (buff.bT || 0) * baseTier + (buff.T || 0) * tier;
      }
    }
    return total;
  }

  // =============================================================
  // Derived Buff Generation
  // =============================================================

  /**
   * Auto-generate virtual buff entries from active talents, combat states,
   * and maneuvers. Stored in system._derivedBuffs and scanned by _getBuffTotal
   * alongside manual custom buffs.
   *
   * Each entry uses the same {effect, flat, bT, T} structure as custom buffs.
   * The "source" field is for debugging/display only.
   */
  _generateDerivedBuffs(system) {
    const buffs = [];
    const talents = system.talents || [];

    // --- Combat State Buffs ---

    // Evasive Stance: +1(T) Dodge Rolls (fighting-styles.txt)
    if (system.combatStates?.evasiveStance) {
      buffs.push({ active: true, effect: "Dodge", T: 1, bT: 0, flat: 0, source: "Evasive Stance" });
    }

    // Drunk: -1(T) to all Combat Rolls (special-states.txt)
    if (system.combatStates?.drunk) {
      for (const eff of ["Strike", "Dodge", "Wound"]) {
        buffs.push({ active: true, effect: eff, T: -1, bT: 0, flat: 0, source: "Drunk" });
      }
    }

    // --- Talent Buffs ---

    // Valor of the Dragon Team: +1(T) Combat Rolls below Bruised (talents.txt)
    const isBelowBruised = system.status?.healthStatus && system.status.healthStatus !== "healthy";
    if (talents.includes("valor_of_the_dragon_team") && isBelowBruised) {
      for (const eff of ["Strike", "Dodge", "Wound"]) {
        buffs.push({ active: true, effect: eff, T: 1, bT: 0, flat: 0, source: "Valor of the Dragon Team" });
      }
    }

    // Lord of Balance: +1(T) Strike/Dodge, +2(T) Wound when FO=MA and AG=TE (talents.txt)
    const foScore = system.attributes.fo?.score ?? 0;
    const maScore = system.attributes.ma?.score ?? 0;
    const agScore = system.attributes.ag?.score ?? 0;
    const teScore = system.attributes.te?.score ?? 0;
    if (talents.includes("lord_of_balance") && foScore === maScore && agScore === teScore) {
      buffs.push({ active: true, effect: "Strike", T: 1, bT: 0, flat: 0, source: "Lord of Balance" });
      buffs.push({ active: true, effect: "Dodge", T: 1, bT: 0, flat: 0, source: "Lord of Balance" });
      buffs.push({ active: true, effect: "Wound", T: 2, bT: 0, flat: 0, source: "Lord of Balance" });
    }

    // Balanced Warrior: +FO_Score to Wound when FO=MA (talents.txt)
    if (talents.includes("balanced_warrior") && foScore === maScore) {
      buffs.push({ active: true, effect: "Wound", flat: Math.max(foScore, maScore), bT: 0, T: 0, source: "Balanced Warrior" });
    }

    // Balanced Mind: +1(bT) Combat Rolls when PE=SC (talents.txt)
    const peScore = system.attributes.pe?.score ?? 0;
    const scScore = system.attributes.sc?.score ?? 0;
    if (talents.includes("balanced_mind") && peScore === scScore && peScore > 0) {
      buffs.push({ active: true, effect: "Strike", bT: 1, T: 0, flat: 0, source: "Balanced Mind" });
      buffs.push({ active: true, effect: "Dodge", bT: 1, T: 0, flat: 0, source: "Balanced Mind" });
      buffs.push({ active: true, effect: "Wound", bT: 1, T: 0, flat: 0, source: "Balanced Mind" });
    }

    // --- Maneuver Buffs ---

    // Hype Maneuver: +floor(PE_Score/2) to all Combat Rolls (special-maneuvers.txt)
    if (system.combatStates?.hypeActive) {
      const peScore = system.attributes.pe?.score ?? 0;
      const hypeVal = Math.floor(peScore / 2);
      for (const eff of ["Strike", "Dodge", "Wound"]) {
        buffs.push({ active: true, effect: eff, flat: hypeVal, bT: 0, T: 0, source: "Hype Maneuver" });
      }
    }

    // Analysis Maneuver: +floor(SC_Score/2) to Combat Rolls (special-maneuvers.txt)
    if (system.combatStates?.analysisActive) {
      const scScore = system.attributes.sc?.score ?? 0;
      const analysisVal = Math.floor(scScore / 2);
      for (const eff of ["Strike", "Dodge", "Wound"]) {
        buffs.push({ active: true, effect: eff, flat: analysisVal, bT: 0, T: 0, source: "Analysis" });
      }
    }

    system._derivedBuffs = buffs;
  }

  // =============================================================
  // Static Helpers
  // =============================================================

  /**
   * Resolve active gained transformations from OSF suppressedCharacterIds.
   * Returns array of transformation objects (cloned) that are in activeGainedTransformationIds.
   */
  static _getActiveGainedTransformations(system) {
    const fusion = system.fusion || {};
    if (!fusion.isFusion) return [];
    if (fusion.type !== "one-sided-absorption" && fusion.type !== "one-sided-possession") return [];
    const activeGainedIds = fusion.activeGainedTransformationIds || [];
    if (activeGainedIds.length === 0) return [];
    const results = [];
    for (const gainedKey of activeGainedIds) {
      const sepIdx = gainedKey.indexOf("_");
      if (sepIdx < 0) continue;
      const suppId = gainedKey.substring(0, sepIdx);
      const transId = Number(gainedKey.substring(sepIdx + 1));
      const suppActor = game.actors?.get(suppId);
      if (!suppActor) continue;
      const trans = (suppActor.system?.transformations || []).find(t => t.id === transId);
      if (trans) results.push(foundry.utils.deepClone(trans));
    }
    return results;
  }

  /**
   * Parse attribute bonus strings: "+2", "+1(T)", "+1(bT)", "–"
   */
  static parseAttrBonus(val, tier, baseTier) {
    if (!val || val === "–" || val === "-" || val === "—") return 0;
    const str = String(val).trim();
    const bTMatch = str.match(/([+-]?\d+)\s*\(bT\)/i);
    if (bTMatch) return parseInt(bTMatch[1]) * (baseTier || tier);
    const tMatch = str.match(/([+-]?\d+)\s*\(T\)/i);
    if (tMatch) return parseInt(tMatch[1]) * tier;
    const num = parseInt(str);
    return isNaN(num) ? 0 : num;
  }

  // =============================================================
  // Static Data Tables
  // =============================================================

  static RACIAL_LIFE_MODIFIERS = {
    saiyan: 3, earthling: 4, namekian: 5, android: 4, bioAndroid: 3, majin: 3,
    arcosian: 3, shinjin: 4, cerealian: 3, neoTuffle: 4,
    nekoMajin: 4, shadowDragon: 7, undead: 1,
    customSpecies: 3
  };

  static RACIAL_SAVES = {
    saiyan: "corporeal", earthling: "morale", namekian: "corporeal",
    android: "cognitive", bioAndroid: "corporeal", majin: "morale",
    arcosian: "corporeal", shinjin: "cognitive", cerealian: "impulsive",
    neoTuffle: "cognitive", nekoMajin: "cognitive", shadowDragon: "morale",
    undead: "corporeal",
    customSpecies: "corporeal"
  };

  static SIZE_DATA = {
    nano: { meleeExtra: 0, speedMod: -6, defenseMod: 3, soakMod: -3, squares: "1" },
    tiny: { meleeExtra: 0, speedMod: -3, defenseMod: 2, soakMod: -2, squares: "1" },
    small: { meleeExtra: 0, speedMod: 0, defenseMod: 1, soakMod: -1, squares: "1" },
    medium: { meleeExtra: 0, speedMod: 0, defenseMod: 0, soakMod: 0, squares: "1" },
    large: { meleeExtra: 0, speedMod: 0, defenseMod: -1, soakMod: 1, squares: "1" },
    enormous: { meleeExtra: 1, speedMod: 3, defenseMod: -2, soakMod: 2, squares: "2×2" },
    gigantic: { meleeExtra: 3, speedMod: 6, defenseMod: -3, soakMod: 3, squares: "4×4" },
    colossal: { meleeExtra: 6, speedMod: 10, defenseMod: -5, soakMod: 5, squares: "7×7" }
  };

  static SIZE_ORDER = ["nano", "tiny", "small", "medium", "large", "enormous", "gigantic", "colossal"];

  // =============================================================
  // Battle Jacket Methods
  // =============================================================

  _prepareBattleJacketData(system) {
    // Clamp LP/KP to max
    if (system.lp.value > system.lp.max) system.lp.value = system.lp.max;
    if (system.kp.value > system.kp.max) system.kp.value = system.kp.max;
  }

  _applyBattleJacketPiloting(system) {
    if (!system.isPiloting || !system.pilotedJacketId) return;

    const bjActor = game.actors?.get(system.pilotedJacketId);
    if (!bjActor || bjActor.type !== "battleJacket") return;

    const bjSys = bjActor.system;

    // Store pre-piloting values for debugging and potential future "Your Stats vs Jacket" display
    system._prePilotingStats = {
      awareness: system.aptitudes?.awareness,
      haste: system.aptitudes?.haste,
      soak: system.status?.soak,
      defenseValue: system.aptitudes?.defenseValue,
      damageReduction: system.status?.damageReduction,
      normalSpeed: system.status?.normalSpeed,
      boostedSpeed: system.status?.boostedSpeed,
      tier: system.tier
    };

    // Override combat stats with BJ values
    if (system.aptitudes) {
      system.aptitudes.awareness = bjSys.awareness ?? 0;
      system.aptitudes.haste = bjSys.haste ?? 0;
      system.aptitudes.defenseValue = bjSys.defenseValue ?? 0;
    }
    if (system.status) {
      system.status.soak = bjSys.soak ?? 0;
      system.status.damageReduction = bjSys.damageReduction ?? 0;
      system.status.normalSpeed = bjSys.normalSpeed ?? 0;
      system.status.boostedSpeed = bjSys.boostedSpeed ?? 0;
      system.status.currentSize = bjSys.effectiveSizeCategory || "enormous";
    }

    // Store BJ-specific values on system for display
    system._bjMight = bjSys.might ?? 0;
    system._bjTier = bjSys.jacketTier ?? 1;

    // Override Tier with JT for (T)/(bT) scaling
    system.tier = bjSys.jacketTier ?? system.tier;

    // Battle Jacket Penalty: -2(JT) to Combat Rolls
    const hasExpertPilot = (system.talents || []).includes("expertPilot");
    if (!hasExpertPilot) {
      system._bjPenalty = 2 * (bjSys.jacketTier ?? 1);
      system._bjPenaltyApplied = true;
    } else {
      system._bjPenalty = 0;
      system._bjPenaltyApplied = false;
    }

    // Store BJ reference for template access
    system._pilotedJacket = {
      id: bjActor.id,
      name: bjActor.name,
      img: bjActor.img,
      lp: bjSys.lp,
      kp: bjSys.kp,
      jacketTier: bjSys.jacketTier,
      healthThresholds: bjSys.healthThresholds,
      weakPoints: bjSys.weakPoints,
      might: bjSys.might,
      awareness: bjSys.awareness,
      haste: bjSys.haste,
      soak: bjSys.soak,
      defenseValue: bjSys.defenseValue,
      damageReduction: bjSys.damageReduction,
      normalSpeed: bjSys.normalSpeed,
      boostedSpeed: bjSys.boostedSpeed,
      effectiveSizeCategory: bjSys.effectiveSizeCategory,
      installedModules: bjSys.installedModules,
      frameUniqueModule: bjSys.frameUniqueModule,
      engineUniqueModule: bjSys.engineUniqueModule,
      signatureTechniques: bjSys.signatureTechniques || [],
      signatureAuras: bjSys.signatureAuras || [],
      uniqueAbilities: bjSys.uniqueAbilities || []
    };
  }
}
