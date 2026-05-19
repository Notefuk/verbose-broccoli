/**
 * Talent Automation
 * Applies passive numeric bonuses and conditional effects from selected talents.
 * Called from actor.mjs after applyLegendaryFormBonuses().
 */

// Snapshot/restore for passive toggle support — allows undoing stat changes
// when a talent's passive effect is toggled OFF in the effect panel.
function _takeSnapshot(system) {
  return {
    soak: system.status?.soak,
    normalSpeed: system.status?.normalSpeed,
    boostedSpeed: system.status?.boostedSpeed,
    might: system.status?.might,
    defenseValue: system.aptitudes?.defenseValue,
    awareness: system.aptitudes?.awareness,
    initiative: system.aptitudes?.initiative,
    initiativeRollBonus: system.aptitudes?.initiativeRollBonus,
    alertReroll: system.aptitudes?.alertReroll,
    stressBonus: system.aptitudes?.stressBonus,
    haste: system.aptitudes?.haste,
    lifePointsMax: system.lifePoints?.max
  };
}

function _restoreSnapshot(system, snap) {
  if (system.status) {
    system.status.soak = snap.soak;
    system.status.normalSpeed = snap.normalSpeed;
    system.status.boostedSpeed = snap.boostedSpeed;
    system.status.might = snap.might;
  }
  if (system.aptitudes) {
    system.aptitudes.defenseValue = snap.defenseValue;
    system.aptitudes.awareness = snap.awareness;
    system.aptitudes.initiative = snap.initiative;
    system.aptitudes.initiativeRollBonus = snap.initiativeRollBonus;
    system.aptitudes.alertReroll = snap.alertReroll;
    system.aptitudes.stressBonus = snap.stressBonus;
    system.aptitudes.haste = snap.haste;
  }
  if (system.lifePoints) system.lifePoints.max = snap.lifePointsMax;
}

/**
 * @param {object} system - Actor system data (mutated in place)
 * @param {number} tier - Current Tier of Power
 * @param {number} baseTier - ceil(tier/2)
 */
export function applyTalentBonuses(system, tier, baseTier) {
  const talents = system.talents || [];
  if (talents.length === 0) return;

  const result = { entries: [], hasBonuses: false };
  const totals = {
    soak: 0, defense: 0, dr: 0, might: 0,
    strike: 0, dodge: 0, wound: 0, combatRolls: 0,
    speed: 0, initiative: 0, steadfast: 0,
    allSaves: 0, stressBonus: 0
  };

  const talentSet = new Set(talents);
  const tempMods = system.combatTabState?.talentTempMods || {};
  const enabledPassives = system.effectTracking?.enabledPassives || {};
  const catalog = CONFIG.DBU?.talentsCatalog || [];

  for (const id of talents) {
    const entry = { name: id, catalogKey: id, bonuses: [], conditionals: [], triggered: [], perRound: [] };

    // Check if any passive effect for this talent is disabled via the effect panel toggle
    const catEntry = catalog.find(t => t.id === id);
    const passiveDisabled = catEntry?.effects?.some(eff => {
      if ((eff.activationType || "passive") !== "passive") return false;
      const effectId = `talent_${id}_${eff.level || 0}`;
      return enabledPassives[effectId] === false;
    }) ?? false;

    // Snapshot before applying — if passive is disabled we restore after
    const snap = passiveDisabled ? _takeSnapshot(system) : null;
    const totalsBefore = passiveDisabled ? { ...totals } : null;

    applyBonusesForTalent(id, system, tier, baseTier, talentSet, tempMods, entry, totals);

    // If passive was toggled off, undo stat changes but keep triggered/limited effects
    if (passiveDisabled && snap) {
      _restoreSnapshot(system, snap);
      Object.assign(totals, totalsBefore);
      for (const b of entry.bonuses) {
        entry.conditionals.unshift(`(Off) ${b}`);
      }
      entry.bonuses = [];
    }

    if (entry.bonuses.length || entry.conditionals.length || entry.triggered.length || entry.perRound.length) {
      result.entries.push(entry);
      result.hasBonuses = true;
    }
  }

  result.totals = totals;
  system.talentBonuses = result;
}

function getAttrScore(system, key) {
  return system.attributes?.[key]?.score || 0;
}

function addSoak(system, amount) {
  system.status = system.status || {};
  system.status.soak = (system.status.soak || 0) + amount;
}

function addSpeed(system, amount) {
  system.status = system.status || {};
  system.status.normalSpeed = (system.status.normalSpeed || 0) + amount;
  system.status.boostedSpeed = (system.status.boostedSpeed || 0) + amount;
}

function addCatalogFallback(entry, catEntry) {
  if (!catEntry?.effects?.length) return;

  for (const eff of catEntry.effects) {
    const effectType = eff.activationType || "passive";
    const payload = {
      id: `${catEntry.id}_${eff.level || 0}`,
      name: catEntry.name,
      description: eff.text || "",
      usageLimit: eff.usageLimit || null,
      maxUses: eff.maxUses || null
    };

    if (effectType === "passive" || effectType === "automatic" || effectType === "ruling") {
      entry.conditionals.push(payload.description);
      continue;
    }

    if (effectType === "triggered" || effectType === "limited") {
      entry.triggered.push(payload);
      continue;
    }

    entry.conditionals.push(payload.description);
  }
}

function applyBonusesForTalent(id, system, tier, baseTier, talentSet, tempMods, entry, totals) {
  // Resolve display name from catalog
  const catalog = CONFIG.DBU?.talentsCatalog || [];
  const catEntry = catalog.find(t => t.id === id);
  if (catEntry) entry.name = catEntry.name;

  let handled = true;

  switch (id) {
    // ========== CATEGORY A: Flat Numeric Bonuses ==========
    case "resilience": {
      addSoak(system, baseTier);
      totals.soak += baseTier;
      entry.bonuses.push(`+${baseTier} Soak (Resilience)`);
      // Lv2: display-only surge bonus
      entry.conditionals.push(`Healing Surge/Combat Recovery LP +1d4(${tier})`);
      break;
    }
    case "saiyan_tail_resistance": {
      addSoak(system, baseTier);
      totals.soak += baseTier;
      entry.bonuses.push(`+${baseTier} Soak (Saiyan Tail Resistance)`);
      break;
    }
    case "nefarious_plating": {
      // +1(bT) Soak if no apparel worn
      const slots = system.wornApparelSlots || {};
      const hasApparel = !!(slots.topLayer || slots.middleLayer || slots.bottomLayer);
      if (!hasApparel) {
        addSoak(system, baseTier);
        totals.soak += baseTier;
        entry.bonuses.push(`+${baseTier} Soak (Nefarious Plating, no apparel)`);
      } else {
        entry.conditionals.push(`+${baseTier} Soak if no apparel worn (Nefarious Plating)`);
      }
      break;
    }
    case "high_speed_ace": {
      system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + tier;
      addSpeed(system, tier);
      totals.defense += tier;
      totals.speed += tier;
      entry.bonuses.push(`+${tier} Defense, +${tier} Speed (High Speed Ace)`);
      // Lv2: conditional — moved total squares >= Normal Speed
      entry.conditionals.push(`+${tier} Combat Rolls if moved >= Normal Speed this round`);
      break;
    }
    case "penetrating_fist": {
      system.status = system.status || {};
      system.status.might = (system.status.might || 0) + tier;
      totals.might += tier;
      entry.bonuses.push(`+${tier} Might (Penetrating Fist)`);
      // Lv2: triggered — Might Clash on hit
      entry.conditionals.push("1/Rnd: On Unarmed Physical hit, Might Clash → +1 Damage Category");
      break;
    }
    case "improved_taunt": {
      if (system.aptitudes) {
        system.aptitudes.moraleClashBonus = (system.aptitudes.moraleClashBonus || 0) + tier;
      }
      entry.bonuses.push(`+${tier} Morale Clash Dice Score (Improved Taunt)`);
      entry.conditionals.push("Insult can target all opponents in Sphere AoE");
      break;
    }
    case "archetype_focus": {
      if (system.aptitudes) {
        system.aptitudes.archetypeFocusCTReduction = (system.aptitudes.archetypeFocusCTReduction || 0) + 1;
        system.aptitudes.archetypeFocusSurgencyBonus = (system.aptitudes.archetypeFocusSurgencyBonus || 0) + 2 * tier;
      }
      entry.bonuses.push(`CT -1 Strike/Wound for chosen Foundation (Archetype Focus)`);
      entry.bonuses.push(`+${2 * tier} Surgency bonus (Archetype Focus)`);
      break;
    }
    // ========== CATEGORY B: Health-Based Conditionals ==========
    case "agile_warrior": {
      const hs = system.status?.healthStatus || "healthy";
      if (hs === "healthy" || hs === "bruised") {
        system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + baseTier;
        totals.defense += baseTier;
        entry.bonuses.push(`+${baseTier} Defense (Agile Warrior, above Injured)`);
      } else {
        entry.conditionals.push(`+${baseTier} Defense if above Injured (Agile Warrior)`);
      }
      // Lv2: triggered — spend KP to boost Dodge
      entry.conditionals.push(`1/Rnd: Spend up to ${4 * baseTier} KP → +1/2 Dodge Dice Score`);
      break;
    }
    case "risky_bet": {
      const hs = system.status?.healthStatus || "healthy";
      if (hs === "injured" || hs === "critical") {
        addSoak(system, baseTier);
        totals.soak += baseTier;
        entry.bonuses.push(`+${baseTier} Soak (Risky Bet, below Injured)`);
      } else {
        entry.conditionals.push(`+${baseTier} Soak if below Injured (Risky Bet)`);
      }
      // Lv2: triggered — reduce Soak to boost Wound
      entry.conditionals.push(`1/Rnd: Reduce Soak up to ${3 * baseTier} → Wound +2x reduction`);
      break;
    }
    case "valor_of_the_dragon_team": {
      const hs = system.status?.healthStatus || "healthy";
      if (hs !== "healthy") {
        totals.combatRolls += tier;
        totals.allSaves += tier;
        entry.bonuses.push(`+${tier} Combat Rolls, +${tier} Saves (Valor, below Bruised)`);
      } else {
        entry.conditionals.push(`+${tier} Combat Rolls & Saves if below Bruised (Valor)`);
      }
      entry.conditionals.push("On Defeated: use Empower as Out-of-Sequence");
      break;
    }

    // ========== CATEGORY B: Combat State & Attribute Equality ==========
    case "berserk_resolve": {
      if (system.combatStates?.raging) {
        addSoak(system, 2 * tier);
        system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) - tier;
        totals.soak += 2 * tier;
        totals.defense -= tier;
        entry.bonuses.push(`+${2 * tier} Soak, -${tier} Defense (Berserk Resolve, Raging)`);
      } else {
        entry.conditionals.push(`Raging: +${2 * tier} Soak, -${tier} Defense (Berserk Resolve)`);
      }
      // Lv2: triggered/threshold → enter Raging
      entry.triggered.push({
        id: "berserk_resolve_threshold", name: "Berserk Resolve",
        description: "On threshold crossed: enter Raging until end of next turn. If already Raging, +2(T) Soak instead.",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "alert": {
      // L1: Roll initiative twice, keep highest
      system.aptitudes.alertReroll = true;
      entry.bonuses.push("Initiative: Roll 2d10kh (Alert)");
      // L2: Immune to Surprise Rounds
      entry.conditionals.push("Immune to Surprise Rounds (Alert L2)");
      // L3: +1(T) to chosen Combat Roll while Initiative Advantage
      entry.conditionals.push(`Initiative Advantage: +${tier} to a chosen Combat Roll (Alert L3)`);
      break;
    }
    case "improved_initiative": {
      // L1: +2(bT) to Initiative Roll Dice Score
      const rollBonus = 2 * baseTier;
      system.aptitudes.initiativeRollBonus = (system.aptitudes.initiativeRollBonus || 0) + rollBonus;
      totals.initiative += rollBonus;
      entry.bonuses.push(`+${rollBonus} Initiative Roll (Improved Initiative)`);
      // L2: +1(T) Combat Rolls vs characters with lower Initiative
      entry.conditionals.push(`+${tier} Combat Rolls vs lower Initiative opponents (Improved Init L2)`);
      break;
    }
    case "lightning_initiative": {
      // L1: While Initiative Advantage: +1(T) Impulsive Saves + Speed
      if (system.aptitudes) {
        system.aptitudes.bonusInitAdvImpulsive = (system.aptitudes.bonusInitAdvImpulsive || 0) + tier;
        system.aptitudes.bonusInitAdvSpeed = (system.aptitudes.bonusInitAdvSpeed || 0) + tier;
      }
      entry.bonuses.push(`Initiative Advantage: +${tier} Impulsive Saves, +${tier} Speed (Lightning Init)`);
      // L2: 1/Enc while Initiative Advantage: gain additional Action
      entry.triggered.push({
        id: "lightning_initiative_action", name: "Lightning Initiative",
        description: `While Initiative Advantage: gain 1 additional Action this round. (1/Encounter)`,
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "patient_fighter": {
      // L1: Triggered — reduce own Initiative by 1(T), give to an ally
      entry.triggered.push({
        id: "patient_fighter_transfer", name: "Patient Fighter",
        description: `Reduce your Initiative Dice Score by ${tier}, increase an Ally's Initiative by the same amount.`,
        usageLimit: null, maxUses: null
      });
      // L2: If lowest initiative, +1(T) Combat Rolls
      if (system.aptitudes) {
        system.aptitudes.bonusLowestInitiativeCombatRoll = (system.aptitudes.bonusLowestInitiativeCombatRoll || 0) + tier;
      }
      entry.bonuses.push(`Lowest Initiative: +${tier} Combat Rolls (Patient Fighter L2)`);
      break;
    }
    case "balanced_warrior": {
      const fo = getAttrScore(system, "fo");
      const ma = getAttrScore(system, "ma");
      if (fo === ma && fo > 0) {
        const score = fo;
        // Wound bonus is applied via _generateDerivedBuffs (effect "Wound"). Might isn't.
        if (system.status) system.status.might = (system.status.might || 0) + score;
        totals.wound += score;
        entry.bonuses.push(`+${score} Wound & Might Dice Score (Balanced Warrior, FO=MA=${score})`);
      } else {
        entry.conditionals.push(`FO=MA: +Score to Wound & Might Dice Score (Balanced Warrior)`);
      }
      entry.conditionals.push(`1/Rnd: After Unique Ability, +${2 * tier} Wound on next attack`);
      break;
    }
    case "balanced_defender": {
      const ag = getAttrScore(system, "ag");
      const te = getAttrScore(system, "te");
      if (ag === te && ag > 0) {
        system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + tier;
        addSoak(system, tier);
        totals.defense += tier;
        totals.soak += tier;
        entry.bonuses.push(`+${tier} Defense, +${tier} Soak (Balanced Defender, AG=TE=${ag})`);
      } else {
        entry.conditionals.push(`AG=TE: +${tier} Defense & Soak (Balanced Defender)`);
      }
      // Lv1: stance shift button
      entry.triggered.push({
        id: "balanced_defender_shift", name: "Shift Defense",
        description: `Reduce Defense or Soak up to ${2 * baseTier} to increase the other. 1/Round.`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "balanced_mind": {
      const pe = getAttrScore(system, "pe");
      const sc = getAttrScore(system, "sc");
      if (pe === sc && pe > 0) {
        // Combat Rolls bonus applied via _generateDerivedBuffs (Strike/Dodge/Wound)
        totals.combatRolls += baseTier;
        entry.bonuses.push(`+${baseTier} Combat Rolls (Balanced Mind, PE=SC=${pe})`);
      } else {
        entry.conditionals.push(`PE=SC: +${baseTier} Combat Rolls (Balanced Mind)`);
      }
      entry.conditionals.push("1/Rnd: While Hype/Analysis, use the other as Instant");
      break;
    }
    case "lord_of_balance": {
      const fo = getAttrScore(system, "fo");
      const ma = getAttrScore(system, "ma");
      const ag = getAttrScore(system, "ag");
      const te = getAttrScore(system, "te");
      if (fo === ma && ag === te && fo > 0 && ag > 0) {
        // Strike/Dodge/Wound bonuses are applied via _generateDerivedBuffs
        totals.strike += tier;
        totals.dodge += tier;
        totals.wound += 2 * tier;
        entry.bonuses.push(`+${tier} Strike/Dodge, +${2 * tier} Wound (Lord of Balance)`);
      } else {
        entry.conditionals.push(`FO=MA & AG=TE: +${tier} Strike/Dodge, +${2 * tier} Wound`);
      }
      // Per-round: +3(bT) LP and KP
      entry.perRound.push({ type: "lp", amount: 3 * baseTier, label: "Lord of Balance" });
      entry.perRound.push({ type: "kp", amount: 3 * baseTier, label: "Lord of Balance" });
      break;
    }
    case "jump_start": {
      if (system.aptitudes) {
        system.aptitudes.jumpStartNotHoldingBackWound = (system.aptitudes.jumpStartNotHoldingBackWound || 0) + baseTier;
      }
      entry.bonuses.push(`Not Holding Back: +${baseTier} Wound (Jump Start)`);
      entry.conditionals.push("Start of Encounter: Power Up as Out-of-Sequence");
      break;
    }
    case "all_out_start": {
      if (system.aptitudes) {
        system.aptitudes.allOutStartSigWound = (system.aptitudes.allOutStartSigWound || 0) + baseTier;
        system.aptitudes.allOutStartMight = (system.aptitudes.allOutStartMight || 0) + tier;
        system.aptitudes.allOutStartCombatRolls = (system.aptitudes.allOutStartCombatRolls || 0) + tier;
      }
      entry.bonuses.push(`Not Holding Back: +${baseTier} Wound for STs (All-Out Start)`);
      entry.bonuses.push(`Start of Encounter: +${tier} Might, +${tier} Combat Rolls until end of next turn`);
      break;
    }

    // ========== CATEGORY C: Attack-Specific Conditionals (display only) ==========
    case "iron_fist": {
      // Apply passive +2(T) to unarmed wound rolls (most unarmed are physical)
      if (system.aptitudes) {
        system.aptitudes.unarmedWound = (system.aptitudes.unarmedWound || 0) + 2 * tier;
      }
      entry.bonuses.push(`+${2 * tier} Wound (Unarmed Physical)`);
      entry.conditionals.push("1/Rnd: On hit + damage, Might Clash → Soak -2(T)");
      break;
    }
    case "rapid_fist": {
      if (system.aptitudes) {
        system.aptitudes.unarmedStrike = (system.aptitudes.unarmedStrike || 0) + tier;
      }
      entry.bonuses.push(`+${tier} Strike (Unarmed Physical)`);
      entry.conditionals.push(`1/Rnd: On hit + damage, Might Clash → Awareness/Defense -${baseTier}`);
      break;
    }
    case "magic_blaster": {
      if (system.aptitudes) {
        system.aptitudes.woundMagic = (system.aptitudes.woundMagic || 0) + 2 * tier;
      }
      entry.bonuses.push(`+${2 * tier} Wound (Magic attacks)`);
      entry.conditionals.push("On hit: reduce target Soak by Diminishing Defense inflicted");
      entry.conditionals.push("1/Rnd: After Magical Unique Ability, Energy Charge as Out-of-Sequence");
      break;
    }
    case "close_range_shot": {
      if (system.aptitudes) {
        system.aptitudes.woundEnergy = (system.aptitudes.woundEnergy || 0) + 2 * tier;
        system.aptitudes.woundMagic = (system.aptitudes.woundMagic || 0) + 2 * tier;
      }
      entry.bonuses.push(`+${2 * tier} Wound (Energy/Magic in Melee)`);
      entry.conditionals.push("1/Rnd: On hit in adjacent square, Might Clash → target can't move");
      break;
    }
    case "far_shot": {
      if (system.aptitudes) {
        system.aptitudes.woundEnergy = (system.aptitudes.woundEnergy || 0) + tier;
        system.aptitudes.woundMagic = (system.aptitudes.woundMagic || 0) + tier;
      }
      entry.bonuses.push(`+${tier} Wound (Energy/Magic outside Melee, +${3 * tier} if 8+ squares)`);
      entry.conditionals.push("1/Rnd: On hit outside Melee, Might Clash → push target");
      break;
    }
    case "fierce_counter": {
      if (system.aptitudes) {
        system.aptitudes.fierceCounterStrike = (system.aptitudes.fierceCounterStrike || 0) + tier;
        system.aptitudes.fierceCounterWoundDice = `1d4(${tier})`;
      }
      entry.bonuses.push(`+1d4(${tier}) Wound on Wild Counter attack`);
      entry.bonuses.push(`+${tier} Strike on Parry (Fierce Counter)`);
      break;
    }
    case "jolt_counter": {
      if (system.aptitudes) {
        system.aptitudes.joltCounterWound = (system.aptitudes.joltCounterWound || 0) + 3 * tier;
      }
      entry.bonuses.push(`+${3 * tier} Wound on Cross Counter (Jolt Counter)`);
      entry.conditionals.push("1/Enc: Cross Counter: Dodge=0, +DmgCat, +Defense to Strike, +DmgCat");
      break;
    }
    case "stealth_strike": {
      if (system.aptitudes) {
        system.aptitudes.bonusVsObliviousStrike = (system.aptitudes.bonusVsObliviousStrike || 0) + tier;
        system.aptitudes.bonusVsObliviousWound = (system.aptitudes.bonusVsObliviousWound || 0) + tier;
      }
      entry.bonuses.push(`+${tier} Strike & Wound vs Oblivious (Stealth Strike)`);
      entry.conditionals.push("1/Rnd: Stealth vs Perception → target Oblivious for attack");
      break;
    }
    case "assassinate": {
      if (system.aptitudes) {
        system.aptitudes.bonusVsObliviousWound = (system.aptitudes.bonusVsObliviousWound || 0) + tier;
      }
      entry.bonuses.push(`+${tier} Wound vs Oblivious (Assassinate)`);
      entry.conditionals.push("1/Rnd: On hit vs Oblivious → +1 Damage Category");
      break;
    }
    case "combat_tactician": {
      if (system.aptitudes) {
        system.aptitudes.bonusVsConditionedNatural = (system.aptitudes.bonusVsConditionedNatural || 0) + 1;
        system.aptitudes.bonusVsConditionedStrike = (system.aptitudes.bonusVsConditionedStrike || 0) + tier;
        system.aptitudes.bonusVsConditionedWound = (system.aptitudes.bonusVsConditionedWound || 0) + 2 * tier;
      }
      entry.bonuses.push("+1 Natural Result on Clashes vs Conditioned (Combat Tactician)");
      entry.conditionals.push(`On attack vs Conditioned: +${tier} Strike or +${2 * tier} Wound`);
      break;
    }
    case "beat_down_tactics": {
      if (system.aptitudes) {
        system.aptitudes.bonusVsConditionedMight = (system.aptitudes.bonusVsConditionedMight || 0) + tier;
      }
      entry.bonuses.push(`+${tier} Might vs Conditioned (Beat-down Tactics)`);
      entry.conditionals.push("1/Rnd: Opponent gains Condition within 4sq → triggers Exploit");
      break;
    }
    case "effective_defenses": {
      if (system.aptitudes) {
        system.aptitudes.guardKPReduction = (system.aptitudes.guardKPReduction || 0) + 2 * tier;
        system.aptitudes.directHitGuardSoakBonus = (system.aptitudes.directHitGuardSoakBonus || 0) + 2 * tier;
      }
      entry.bonuses.push(`Guard KP cost -${2 * tier} (Effective Defenses)`);
      entry.conditionals.push(`1/Rnd: Direct Hit/Guard → +${2 * tier} Soak`);
      break;
    }

    // ========== CATEGORY D: Stance Buttons ==========
    case "combat_expertise": {
      // Apply active temp mod if set
      const ceMod = tempMods.combat_expertise;
      if (ceMod && ceMod.amount > 0) {
        if (ceMod.direction === "def_to_aw") {
          system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) - ceMod.amount;
          system.aptitudes.awareness = (system.aptitudes.awareness || 0) + ceMod.amount;
          totals.defense -= ceMod.amount;
          entry.bonuses.push(`Stance: -${ceMod.amount} Defense → +${ceMod.amount} Awareness`);
        } else {
          system.aptitudes.awareness = (system.aptitudes.awareness || 0) - ceMod.amount;
          system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + ceMod.amount;
          totals.defense += ceMod.amount;
          entry.bonuses.push(`Stance: -${ceMod.amount} Awareness → +${ceMod.amount} Defense`);
        }
      }
      entry.triggered.push({
        id: "combat_expertise_shift", name: "Shift Stance",
        description: `Shift Defense↔Awareness up to ${2 * baseTier}. Start of Turn.`,
        usageLimit: "round", maxUses: 1
      });
      entry.conditionals.push("1/Rnd: Greater Dice on a Combat Roll for attacking/defending");
      break;
    }

    // ========== CATEGORY E: Per-Round Resource Generation ==========
    // (lord_of_balance perRound already handled in Cat B above)
    // (reserved_combatant below)
    case "reserved_combatant": {
      if (system.aptitudes) {
        system.aptitudes.reservedCombatantPatiencePerRound = 1;
        system.aptitudes.reservedCombatantKpRefundFactor = 2 * baseTier;
      }
      entry.perRound.push({ type: "patience", amount: 1, label: "Reserved Combatant (if Holding Back)" });
      entry.bonuses.push(`+1 Patience/Round (if Holding Back), refund 2×Patience×${baseTier} KP on lose`);
      entry.conditionals.push("3/Rnd: Ignore Holding Back for an attack/defense");
      break;
    }

    // ========== CATEGORY F: Triggered Effects ==========
    case "frenzy": {
      if (system.aptitudes) {
        system.aptitudes.frenzyMaxLPSpend = 4 * baseTier;
        system.aptitudes.frenzyStrikePerSpend = tier;
        system.aptitudes.frenzySpendCost = 2 * baseTier;
      }
      entry.bonuses.push(`Raging: Spend up to ${4 * baseTier} LP → +${tier} Strike per ${2 * baseTier} LP`);
      entry.triggered.push({
        id: "frenzy_power", name: "Frenzy (Power Surge)",
        description: `1/Enc, Raging + Power: +${4 * baseTier} KP per threshold below`,
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "burning_anger": {
      if (system.aptitudes) {
        system.aptitudes.burningAngerSoakReduction = baseTier;
      }
      entry.bonuses.push(`Raging: On hit, reduce target Soak -${baseTier} until end of turn`);
      entry.triggered.push({
        id: "burning_anger_raging", name: "Burning Anger",
        description: `1/Enc, on entering Raging: +${5 * baseTier} LP per threshold below`,
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }

    // ========== CATEGORY G: Surge Display ==========
    case "second_wind": {
      entry.conditionals.push(`Surge LP/KP +${2 * tier} (Second Wind)`);
      entry.conditionals.push("1/Enc: Use a Surge as Instant Maneuver");
      break;
    }
    case "never_surrender": {
      entry.conditionals.push("Surge: treat ToP as +1 (Never Surrender)");
      entry.conditionals.push("1/Enc: Power Surge below Injured → Superior State");
      break;
    }
    case "lions_heart": {
      const tb = system.thresholds?.crossedCount ?? 0;
      entry.conditionals.push(`Surge LP/KP +${2 * tier * tb} (Lion's Heart, ${tb} thresholds)`);
      entry.conditionals.push("1/Enc: Damage to 0 LP → use available Surge before deduction");
      break;
    }

    // ========== CATEGORY H: Additional High-Value Talent Coverage ==========
    case "power_of_the_z_warrior": {
      totals.stressBonus += 1;
      system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 1;
      entry.bonuses.push("+1 Stress Bonus (Power of the Z-Warrior)");
      entry.triggered.push({
        id: "power_of_the_z_warrior_crit",
        name: "Z-Warrior Critical",
        description: "1/Round, 2/Encounter: set Natural Result to 10 on any Combat Roll",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "close_range_shot": {
      entry.conditionals.push(`+${2 * tier} Wound with Unarmed Energy/Magic attacks in Melee`);
      entry.triggered.push({
        id: "close_range_shot_lock",
        name: "Close Range Lockdown",
        description: "1/Round: on hit in Melee with Unarmed Energy/Magic, win Might Clash to stop target using Movement",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "far_shot": {
      entry.conditionals.push(`Outside Melee: +${tier} Wound with Unarmed Energy/Magic attacks`);
      entry.conditionals.push(`8+ squares away: +${3 * tier} Wound total with Unarmed Energy/Magic attacks`);
      entry.triggered.push({
        id: "far_shot_push",
        name: "Far Shot Push",
        description: "1/Round: on ranged Unarmed Energy/Magic hit, win Might Clash to push target away up to your Might",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "point_blank_shot": {
      // Pure triggered talent — no passive bonus per rule
      entry.bonuses.push(`Point Blank: enables +1 Damage Category on Melee unarmed Energy/Magic`);
      entry.triggered.push({
        id: "point_blank_shot_burst",
        name: "Point Blank Burst",
        description: "1/Round: on Melee Unarmed Energy/Magic hit, win Might Clash for +1 Damage Category",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "point_blank_shot_charge",
        name: "Point Blank Charge",
        description: "1/Encounter: after Energy Charge in Melee, declared Unarmed Energy/Magic attack may be used OoS",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "artillery_shot": {
      if (system.aptitudes) {
        system.aptitudes.artilleryShotKPCost = 2 * tier;
      }
      entry.bonuses.push(`Spend ${2 * tier} KP → AoE on Unarmed Energy/Magic`);
      entry.triggered.push({
        id: "artillery_shot_aoe",
        name: "Artillery Shot AoE",
        description: `1/Round: spend ${2 * tier} KP to add Minor Sphere or Standard Line AoE to a non-AoE Unarmed Energy/Magic attack`,
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "artillery_shot_strike",
        name: "Artillery Shot Accuracy",
        description: `1/Round: spend ${2 * baseTier} KP for +${tier} Strike on a ranged Unarmed Energy/Magic attack`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "blaster_master": {
      if (system.aptitudes) {
        system.aptitudes.blasterMasterUltimateReuseAvailable = true;
      }
      entry.bonuses.push("1/Encounter: reuse an Energy/Magic Ultimate Signature (Unarmed)");
      entry.triggered.push({
        id: "blaster_master_ultimate",
        name: "Repeat Ultimate",
        description: "1/Encounter: reuse an Energy or Magic Ultimate Signature as long as it is Unarmed",
        usageLimit: "encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "blaster_master_wound",
        name: "Blaster Master Wound",
        description: `1/Round: on Unarmed Energy/Magic hit, spend up to ${6 * baseTier} KP for equal Wound bonus`,
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "blaster_master_prone",
        name: "Blaster Master Knockdown",
        description: `1/Round: on Unarmed Energy/Magic hit, win Might Clash to knock target Prone or +${4 * tier} Damage if already Prone`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "diehard": {
      const lpBonus = 2 * (system.level || 1);
      system.lifePoints.max = (system.lifePoints.max || 0) + lpBonus;
      totals.steadfast += 1;
      totals.allSaves += 0;
      entry.bonuses.push(`+${lpBonus} Max LP (Diehard)`);
      entry.bonuses.push("+1 Steadfast Dice Score (Diehard)");
      break;
    }
    case "fortitude": {
      const lpBonus = 2 * (system.level || 1);
      system.lifePoints.max = (system.lifePoints.max || 0) + lpBonus;
      entry.bonuses.push(`+${lpBonus} Max LP (Fortitude)`);
      entry.bonuses.push("Steadfast Checks: roll Base Die twice, keep highest");
      break;
    }
    case "undying_determination": {
      const lpBonus = 2 * (system.level || 1);
      system.lifePoints.max = (system.lifePoints.max || 0) + lpBonus;
      entry.bonuses.push(`+${lpBonus} Max LP (Undying Determination)`);
      entry.triggered.push({
        id: "undying_determination_actions",
        name: "Defeated Actions",
        description: "Triggered/Defeated: gain 3 OoS Actions immediately before Defeated applies",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "desperate_transformation": {
      const hs = system.status?.healthStatus || "healthy";
      if (hs === "injured" || hs === "critical") {
        totals.stressBonus += 1;
        system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 1;
        entry.bonuses.push("+1 Stress Bonus (below Injured)");
      } else {
        entry.conditionals.push("+1 Stress Bonus while below Injured");
      }
      entry.triggered.push({
        id: "desperate_transformation_save",
        name: "Stress Test Recovery",
        description: "1/Encounter: after failing a Stress Test, halve LP and gain +1 Dice Score per threshold below to possibly succeed",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "enhanced_transformation": {
      totals.stressBonus += 1;
      system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 1;
      entry.bonuses.push("+1 Stress Bonus (Enhanced Transformation)");
      entry.triggered.push({
        id: "enhanced_transformation_long",
        name: "Long Transformation Boost",
        description: `1/Encounter: add up to 2 Long Transformation levels; +1 ST Req and +${tier} AMB(FO/MA) per level`,
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "forceful_transformation": {
      system.status.might = (system.status.might || 0) + tier;
      totals.might += tier;
      entry.bonuses.push(`+${tier} Might (Forceful Transformation)`);
      entry.triggered.push({
        id: "forceful_transformation_clash",
        name: "Forceful Entrance",
        description: "1/Round: on Transformation Maneuver, Might Clash Large Sphere AoE to damage and knock back opponents",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "under_pressure": {
      totals.stressBonus += 1;
      system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 1;
      entry.bonuses.push("+1 Stress Bonus (Under Pressure)");
      entry.triggered.push({
        id: "under_pressure_choice",
        name: "Under Pressure",
        description: "1/Encounter below Injured on Transform: either double that form's Legend Realized recovery or use Power Up OoS",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "specialized_transformation": {
      entry.bonuses.push("Specialized Transformation: Stress Tests roll twice, keep highest");
      entry.triggered.push({
        id: "specialized_transformation_chain",
        name: "Specialized Chain",
        description: "1/Encounter: when entering a compatible Transformation, enter Specialized Transformation as OoS",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "comfortable_transformation": {
      if (system.aptitudes) {
        system.aptitudes.comfortableTransformCombatRolls = (system.aptitudes.comfortableTransformCombatRolls || 0) + 2 * baseTier;
      }
      entry.conditionals.push(`First stage of Specialized line + Full Power: +${2 * baseTier} Combat Rolls`);
      entry.triggered.push({
        id: "comfortable_transformation_surge",
        name: "Comfortable Surge",
        description: "1/Encounter: when advancing from first stage Specialized Transformation, Power Surge OoS",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "inspiring_transformation": {
      if (system.aptitudes) {
        system.aptitudes.inspiringTransformAllyWound = (system.aptitudes.inspiringTransformAllyWound || 0) + tier;
      }
      entry.conditionals.push(`In Alternate/Legendary Form: Allies in Minor Sphere gain +${tier} Wound`);
      entry.triggered.push({
        id: "inspiring_transformation_lr",
        name: "Inspiring Realization",
        description: "1/Encounter: on AF/LF transform, roll Legend Realized and allies in Sphere regain 1/2 of that result as LP/KP",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "overwhelming_transformation": {
      if (system.aptitudes) {
        system.aptitudes.overwhelmingTransformOpponentWoundPenalty = (system.aptitudes.overwhelmingTransformOpponentWoundPenalty || 0) + tier;
      }
      entry.conditionals.push(`In Alternate/Legendary Form: Opponents in Minor Sphere suffer -${tier} Wound`);
      entry.triggered.push({
        id: "overwhelming_transformation_lr",
        name: "Overwhelming Realization",
        description: "1/Encounter: on AF/LF transform, roll Legend Realized and opponents in Sphere lose 1/2 of that result as LP",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "transformation_stressor": {
      entry.bonuses.push("Do not reduce Stress Bonus from Health Threshold penalties");
      entry.triggered.push({
        id: "transformation_stressor_draining",
        name: "Stress Drain",
        description: "Triggered/Power 1/Round: core transformation gains 2 Draining; Wound bonus = 1/2 next turn's Draining KP loss",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "transformation_stressor_power_stressed",
        name: "Power Stressed",
        description: "Triggered/Power 1/Encounter: in Alternate/Legendary Form, enter Power Stressed until leaving it",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "transforming_initiative": {
      if (system.aptitudes) {
        system.aptitudes.transformingInitiativeWound = (system.aptitudes.transformingInitiativeWound || 0) + 2 * tier;
      }
      entry.conditionals.push(`Core Transformation + Initiative Advantage: +${2 * tier} Wound`);
      entry.triggered.push({
        id: "transforming_initiative_reroll",
        name: "Transform Initiative",
        description: "1/Encounter: on entering highest ToP Transformation, reroll Initiative and keep higher result",
        usageLimit: "encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "transforming_initiative_action",
        name: "Transform Action",
        description: "1/Encounter: on entering highest ToP Transformation, gain 1 Action this turn",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "restrained_transformation": {
      entry.bonuses.push("Gain access to Holding Back Maneuver");
      entry.conditionals.push("Per Holding Back stack: reduce Draining and Power High by 1 on a single current Transformation");
      entry.conditionals.push("Measured Form: ignore its ToP Requirement while holding back");
      break;
    }
    case "power_of_movement": {
      entry.bonuses.push("May use Movement after Energy Charge before releasing the declared attack");
      entry.bonuses.push("Energy Charge no longer inflicts Guard Down");
      entry.triggered.push({
        id: "power_of_movement_charge_assault",
        name: "Charged Movement",
        description: `1/Round: qualifying charged Signature Technique with 2+ Energy Charges may spend ${2 * tier} KP to gain Charging Assault`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "fleet_of_foot": {
      entry.conditionals.push(`Footwork Rapid Movement bonus becomes +${2 * tier} Defense total`);
      entry.triggered.push({
        id: "fleet_of_foot_entry",
        name: "Fleet Entry",
        description: `1/Round: if Movement enters an Opponent's Melee Range, next attack against them gains +${2 * tier} Strike until end of turn`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "teamwork": {
      entry.bonuses.push("Double maximum Ki Wager on United Attack");
      entry.triggered.push({
        id: "teamwork_united_attack",
        name: "United Attack Support",
        description: `1/Round: United Attack gives targeted Ally +${tier} Strike and +${2 * tier} Wound for that attack`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "synchronized_combatants": {
      entry.conditionals.push(`Within mutual Melee Range of Synchronized Partner: +${tier} Combat Rolls and Surges +${3 * baseTier}`);
      entry.bonuses.push("Fusion with Synchronized Partner counts as always within each other's Melee Range");
      entry.triggered.push({
        id: "synchronized_intervene",
        name: "Synchronized Intervene",
        description: "1/Round, 2/Encounter: Intervene without spending a Counter Action for your Synchronized Partner",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "superior_synchronization": {
      entry.conditionals.push(`Within mutual Melee Range of Synchronized Partner: +${tier} additional Wound`);
      entry.bonuses.push("Fusion Dance with Synchronized Partner reduced to Expert DC");
      entry.triggered.push({
        id: "superior_sync_transform",
        name: "Synced Transform",
        description: "1/Encounter: if Synchronized Partner uses Power Up or Transformation in your Melee Range, you may use the same Maneuver OoS",
        usageLimit: "encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "superior_sync_united",
        name: "Synced United Attack",
        description: "1/Encounter: United Attack without spending an Action if targeting Synchronized Partner",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "desperate_support": {
      entry.triggered.push({
        id: "desperate_support_defeated",
        name: "Desperate Support",
        description: "1/Encounter while Defeated: Empower (2 Actions) or apply listed Spectator support effect as Instant",
        usageLimit: "encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "desperate_support_team_buff",
        name: "Defeat Rally",
        description: `Triggered/Defeat: all Allies gain +${baseTier} Combat Rolls until end of next Combat Round`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "desperate_support_spectator",
        name: "Spectator Support",
        description: `1/Round: forgo Spectator recovery to grant Ally one support option, including +${baseTier} DR/Wound or +${baseTier} Strike/Dodge or +2 Stress Bonus`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "bag_of_tricks": {
      entry.bonuses.push(`-${2 * tier} KP cost on all Unique Abilities`);
      entry.bonuses.push(`+${tier} Clash Dice Score on Unique Ability clashes`);
      entry.conditionals.push(`Skill Clashes through Unique Abilities: +1 Natural Result and +${tier} Clash Dice Score`);
      entry.triggered.push({
        id: "bag_of_tricks_chain",
        name: "Bag of Tricks Chain",
        description: "1/Round: after winning a Unique Ability clash, use a Standard Action Unique Ability OoS with Action Cost reduced by 1",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "energy_control": {
      entry.bonuses.push(`-${2 * tier} KP cost on one chosen Signature Technique or Technical UA`);
      entry.triggered.push({
        id: "energy_control_homing",
        name: "Energy Control Homing",
        description: `1/Round: spend ${2 * baseTier} KP to apply a rank of Homing to a qualifying Signature Technique`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "technique_master": {
      entry.bonuses.push("Use Signature Technique Maneuver one additional time each Combat Round");
      entry.bonuses.push(`Energy Control reduction applies to all Signature Techniques and Technical UAs`);
      break;
    }
    case "powerful_technique": {
      const tb = system.thresholds?.crossedCount ?? 0;
      if (tb > 0) {
        totals.wound += 2 * tier * tb;
        entry.bonuses.push(`+${2 * tier * tb} Wound for Favored Technique (${tb} thresholds)`);
      } else {
        entry.conditionals.push(`Favored Technique: +${2 * tier} Wound per threshold below`);
      }
      entry.triggered.push({
        id: "powerful_technique_instant",
        name: "Instant Favored Technique",
        description: "1/Encounter below Injured: Signature Technique Maneuver as Instant, must use Favored Technique",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "perfect_mimicry": {
      entry.bonuses.push(`+${2 * tier} Wound for Copied Techniques`);
      entry.triggered.push({
        id: "perfect_mimicry_oos",
        name: "Perfect Mimicry",
        description: "1/Encounter: when declaring a Copied Technique, use it immediately as an OoS Maneuver",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "advanced_learner": {
      entry.bonuses.push("-3 TP cost for Signature Techniques or Unique Abilities gained after Combat");
      entry.triggered.push({
        id: "advanced_learner_copy_ua",
        name: "Advanced Learner",
        description: "1/Encounter: copy a qualifying Unique Ability for the Combat Encounter; with Copy Index, possibly retain it longer",
        usageLimit: "encounter", maxUses: 1
      });
      entry.conditionals.push("At end of Combat, may pay TP cost to retain copied Unique Ability permanently");
      break;
    }
    case "multi_aura_specialist": {
      entry.bonuses.push("Gain an additional Aura with TP cost 20 or less");
      entry.triggered.push({
        id: "multi_aura_swap",
        name: "Multi-Aura Swap",
        description: "1/Round: when changing Aura, reduce entry KP cost by 1/2 of previous Aura's KP cost and may Power Up OoS",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "multi_aura_instant",
        name: "Instant Aura",
        description: "1/Encounter: use Aura Maneuver as an Instant Maneuver",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "solo_aura_specialist": {
      entry.bonuses.push("Cannot create or gain additional Auras");
      entry.bonuses.push(`-${2 * tier} KP cost for your Aura`);
      entry.triggered.push({
        id: "solo_aura_advantage",
        name: "Solo Aura Bonus",
        description: "1/Round: when entering your Aura, apply an additional qualifying Aura Advantage (TP 8 or less)",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "solo_aura_instant",
        name: "Instant Aura",
        description: "1/Encounter: use Aura Maneuver as an Instant Maneuver",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "aura_master": {
      entry.bonuses.push("Halve Transformation Lite penalty while entering or in Perfect Ki Control / Strainless / Natural transformations");
      entry.conditionals.push(`While in an Aura, attacks with Ki Wager above Aura KP cost gain +${2 * tier} Wound`);
      entry.triggered.push({
        id: "aura_master_capacity",
        name: "Aura Capacity Recovery",
        description: "1/Encounter: on entering an Aura, regain Capacity equal to twice that Aura's KP cost",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "serene_warrior": {
      entry.triggered.push({
        id: "serene_warrior_meditate",
        name: "Meditate",
        description: "1/Round: convert current Power stacks into 1 Concentration stack (max 2)",
        usageLimit: "round", maxUses: 1
      });
      entry.conditionals.push("Triggered/Mindful: all Concentration stacks become Power until end of next turn");
      entry.triggered.push({
        id: "serene_warrior_power_surge",
        name: "Concentration Surge",
        description: "1/Encounter: spend 1 Concentration to use a Power Surge as an Instant Maneuver",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "combat_meditation": {
      entry.conditionals.push("Combat Recovery: gain 1 Concentration stack");
      entry.triggered.push({
        id: "combat_meditation_transform",
        name: "Meditative Transform",
        description: "1/Encounter: spend 1 Concentration to use Transformation Maneuver as OoS",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "tranquil_counter": {
      entry.conditionals.push("Mindful State: +1 Natural Result on Strike Rolls when using Parry");
      entry.triggered.push({
        id: "tranquil_counter_reduce",
        name: "Tranquil Counter",
        description: `1/Round: when targeted, spend ${2 * baseTier} KP to reduce incoming Strike by 1/4 of opponent's Might`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "clear_mind": {
      entry.conditionals.push(`Mindful critical result: +${tier} additional Dice Score`);
      entry.triggered.push({
        id: "clear_mind_focus",
        name: "Clear Mind Focus",
        description: `1/Encounter while Mindful: +${tier} Combat Rolls until leaving Mindful`,
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "combat_zen": {
      entry.triggered.push({
        id: "combat_zen_charges",
        name: "Combat Zen Charges",
        description: `1/Round while Mindful: spend ${3 * baseTier} KP and 1 Action to add 2 Energy Charges to an attack`,
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "combat_zen_mindful",
        name: "Combat Zen Mindful",
        description: "Triggered/Power, 2/Encounter: enter Mindful until end of next turn",
        usageLimit: "encounter", maxUses: 2
      });
      break;
    }
    case "master_of_minions": {
      entry.triggered.push({
        id: "master_of_minions_command",
        name: "Master of Minions",
        description: "1/Round: reduce Command Maneuver total Action Cost by 1; if 0, use as Instant",
        usageLimit: "round", maxUses: 1
      });
      entry.bonuses.push("Minion Wound = +1/4 of higher PE/SC modifier");
      entry.bonuses.push("+2 maximum Minions");
      break;
    }
    case "minion_coordinator": {
      entry.bonuses.push(`Minion Recovery Period LP/KP +${4 * baseTier}`);
      entry.bonuses.push("+2 maximum Minions");
      entry.triggered.push({
        id: "minion_coordinator_superior",
        name: "Minion Coordinator",
        description: "1/Round: as Instant, select a Minion to enter Superior until end of their turn",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "minion_mark": {
      entry.bonuses.push("+2 maximum Minions");
      entry.bonuses.push("Minions without Counter Actions can use Defense Wall by spending 1/2 LP");
      entry.triggered.push({
        id: "minion_mark_mark",
        name: "Mark Minion",
        description: `1/Round: mark a Minion; it loses ${2 * baseTier} LP each round and gains +${baseTier} Combat Rolls`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "sacrificial_minion": {
      entry.conditionals.push(`If your attack targets one of your Minions too: +${tier} Strike and +${2 * tier} Wound`);
      entry.triggered.push({
        id: "sacrificial_minion_burst",
        name: "Sacrificial Minion",
        description: `1/Round: defeat a Minion to either Shaken enemies, regain 1/2 its LP, or gain +${2 * tier} Combat Rolls until end of next turn`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "weapon_specialist": {
      entry.bonuses.push(`Weapon Penalty -${2 * tier}`);
      entry.triggered.push({
        id: "weapon_specialist_break",
        name: "Weapon Specialist",
        description: "1/Round: on Armed hit, win Might Clash to reduce target Top Layer Break Value by 1",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "dueling_specialist": {
      entry.conditionals.push(`Single Standard weapon only: +${tier} Wound on Armed Attacks`);
      entry.triggered.push({
        id: "dueling_specialist_strike",
        name: "Dueling Specialist",
        description: `1/Round: with only one Standard weapon, +${2 * tier} Strike on attack or Parry`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "light_weapons_specialist": {
      entry.conditionals.push(`Single Small weapon only: +${2 * tier} Wound`);
      entry.triggered.push({
        id: "light_weapons_called_shot",
        name: "Light Weapons Specialist",
        description: `1/Round: on Basic Attack with Small weapon, spend ${3 * baseTier} KP to use Called Shot OoS`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "heavy_weapons_specialist": {
      entry.conditionals.push(`Single Big weapon only: +${tier} Strike`);
      entry.triggered.push({
        id: "heavy_weapons_smash",
        name: "Heavy Weapons Specialist",
        description: "1/Round: reduce Big weapon LP by 1/10 max to add same amount to Wound and double Diminishing Defense on hit",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "iaijutsu_specialist": {
      entry.conditionals.push(`No weapon equipped: +${tier} Dodge`);
      entry.bonuses.push("After each Armed Attack, may sheathe the used Weapon as OoS");
      entry.triggered.push({
        id: "iaijutsu_specialist_draw",
        name: "Iaijutsu Draw",
        description: "1/Round: if unsheathing a Standard weapon as your only equipped weapon, make a Basic Attack OoS",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "lucky": {
      entry.triggered.push({
        id: "lucky_reroll",
        name: "Lucky Reroll",
        description: "1/Round: reroll any d10 rolled by you or an Ally after seeing the result",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "lucky_botch",
        name: "Lucky Botch",
        description: "1/Encounter: turn your Botch Result into a Critical Result and increase Natural Result by 3",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "willpower": {
      entry.bonuses.push(`+${tier} to one chosen Saving Throw`);
      entry.bonuses.push("Saving Throws: roll Base Die twice, keep highest");
      break;
    }
    case "concentrated_energy": {
      entry.conditionals.push("Energy Charge: gain 1 Concentrated Ki stack (max 6)");
      entry.conditionals.push(`Per 2 Concentrated Ki: +${baseTier} Wound`);
      entry.conditionals.push("Power Flare/Shield Aura: double Concentrated Energy Wound bonus for that Maneuver");
      entry.bonuses.push("Lose all Concentrated Ki after releasing an Energy Charge attack or canceling Energy Charge");
      break;
    }
    case "superhuman_physique": {
      const slots = system.wornApparelSlots || {};
      const hasApparel = !!(slots.topLayer || slots.middleLayer || slots.bottomLayer);
      if (!hasApparel) {
        totals.stressBonus += 1;
        system.aptitudes.stressBonus = (system.aptitudes.stressBonus || 0) + 1;
        totals.dr += 2 * tier;
        entry.bonuses.push("+1 Stress Bonus (no Apparel)");
        entry.bonuses.push(`+${2 * tier} Damage Reduction (no Apparel)`);
      } else {
        entry.conditionals.push("+1 Stress Bonus and +2(T) Damage Reduction while not wearing Apparel");
      }
      break;
    }
    case "divine_physique": {
      const lpBonus = 2 * (system.level || 1);
      system.lifePoints.max = (system.lifePoints.max || 0) + lpBonus;
      entry.bonuses.push("+2 Stress Bonus from Superhuman Physique while not wearing Apparel");
      entry.bonuses.push(`+${lpBonus} Max LP (Divine Physique)`);
      entry.conditionals.push(`No Apparel at start of encounter: +${tier} Combat Rolls`);
      break;
    }
    case "dual_wielding_specialist": {
      entry.conditionals.push(`While wielding 2+ Weapons: +${tier} Strike`);
      entry.triggered.push({
        id: "dual_wielding_specialist_mode",
        name: "Dual Wielding",
        description: `1/Round while wielding 2+ Weapons: either Parry without Counter Action or +1/2 Might to Armed Wound`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "twin_weapon_specialist": {
      entry.conditionals.push(`While wielding 2+ Weapons of same category: +${tier} Wound`);
      entry.triggered.push({
        id: "twin_weapon_specialist_chain",
        name: "Twin Weapon Chain",
        description: "1/Round: after 2+ attacks with different weapons of same category, next attack gains x(T) Wound",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "twin_weapon_specialist_qualities",
        name: "Twin Weapon Qualities",
        description: "1/Round: after Twin Weapon trigger or Weapon Assisted UST, apply 1 Quality from each wielded weapon",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "critical_specialist": {
      entry.bonuses.push("Armed Strike Critical Target -1");
      entry.bonuses.push("Armed Strike/Wound Critical Extra Dice +2 Dice Categories");
      entry.triggered.push({
        id: "critical_specialist_damage",
        name: "Critical Specialist",
        description: `1/Round: on Critical Strike with Armed Attack, spend ${3 * baseTier} KP for +1 Damage Category`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "variety_specialist": {
      entry.bonuses.push("All Weapons gain 1 additional Weapon Quality");
      entry.triggered.push({
        id: "variety_specialist_swap",
        name: "Variety Specialist",
        description: `1/Round: after swapping to another Weapon via No Effort or Weapon Summoner, next Armed Attack gains +${3 * tier} Wound`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "improvised_specialist": {
      entry.triggered.push({
        id: "improvised_specialist_feature",
        name: "Improvised Weapon",
        description: "1/Round: Terrain Lift feature may be used as a Big Weapon with ARC-decided Quality",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "improvised_specialist_break",
        name: "Improvised Break",
        description: "1/Round: destroy improvised Feature-weapon after hit to gain +1/2 its Weapon LP as Wound",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "weapon_fixer": {
      entry.triggered.push({
        id: "weapon_fixer_recreate",
        name: "Weapon Fixer",
        description: `Start of Turn: spend ${4 * baseTier} KP to recreate a destroyed Weapon until next turn; it gains +${tier} Wound`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "weapon_fixer_quality",
        name: "Weapon Fixer Quality",
        description: "1/Encounter: recreated Weapon gains a chosen Special Quality until next turn",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "weapon_master": {
      entry.triggered.push({
        id: "weapon_master_charge",
        name: "Weapon Master Charge",
        description: "1/Round: on Critical Strike with Armed Attack, +1 Energy Charge or +1 Dice Category to existing Energy Charges",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "weapon_master_wound",
        name: "Weapon Master Wound",
        description: `1/Round: on Armed hit, spend up to ${6 * baseTier} KP for equal Wound bonus`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "variable_fighter": {
      entry.triggered.push({
        id: "variable_fighter_armed",
        name: "Variable Fighter Armed",
        description: `1/Round: after Armed Attack, boost Unarmed Strike by ${tier} or Wound by ${2 * tier} for the round`,
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "variable_fighter_unarmed",
        name: "Variable Fighter Unarmed",
        description: `1/Round: after Unarmed Attack, boost Armed Strike by ${tier} or Wound by ${2 * tier} for the round`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "variable_champion": {
      entry.conditionals.push(`No Weapon equipped: +${tier} Dodge`);
      entry.conditionals.push(`Weapon equipped: +${tier} Wound`);
      entry.triggered.push({
        id: "variable_champion_chain",
        name: "Variable Champion",
        description: "1/Round: on Armed hit, use Basic Attack OoS as an Unarmed Attack",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "combat_wisdom": {
      entry.conditionals.push("If 3 attributes including IN exceed FO/MA: double Application of Skill bonuses");
      entry.triggered.push({
        id: "combat_wisdom_defend",
        name: "Combat Wisdom",
        description: "1/Round: on Parry/Power Flare/Cross Counter, add +1/2 Might to Strike and +IN Modifier to Wound",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "experienced_drunk": {
      entry.conditionals.push("Drunk State: critical-result Extra Dice +1 Category");
      entry.triggered.push({
        id: "experienced_drunk_dodge",
        name: "Experienced Drunk",
        description: "2/Round: after a Dodge result, increase or reduce its Natural Result by 1",
        usageLimit: "round", maxUses: 2
      });
      entry.bonuses.push("Start of Combat Encounter: gain a Sake Bottle");
      break;
    }
    case "frequent_flyer": {
      entry.triggered.push({
        id: "frequent_flyer_soar",
        name: "Frequent Flyer",
        description: "1/Round: use Soar as an Instant Maneuver",
        usageLimit: "round", maxUses: 1
      });
      entry.bonuses.push("Double Dodge bonus from Soar");
      entry.triggered.push({
        id: "frequent_flyer_drop",
        name: "Drop Down Damage",
        description: `1/Round: Drop Down attack gains +1d8(${tier}) Wound`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "practiced_charger": {
      entry.bonuses.push(`Energy Charge Maneuver costs ${baseTier} KP`);
      entry.triggered.push({
        id: "practiced_charger_extra",
        name: "Practiced Charger",
        description: "1/Round: if all Actions this turn were spent on Energy Charge (minimum 3), use Energy Charge OoS at end of turn",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "throwing_specialist": {
      entry.bonuses.push("Use Throw Maneuver one additional time each Combat Round");
      entry.triggered.push({
        id: "throwing_specialist_profile",
        name: "Throwing Specialist Profile",
        description: "1/Round: thrown Weapon may pay KP for a Physical Profile and apply its effects",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "throwing_specialist_quality",
        name: "Throwing Specialist Quality",
        description: "Start of Turn: wielded Weapon gains Throwing Weapon or Boomerang",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "aikido_apprentice": {
      entry.bonuses.push(`+${baseTier} Clash Dice Score for Thrust`);
      entry.triggered.push({
        id: "aikido_apprentice_thrust",
        name: "Aikido Apprentice",
        description: "1/Round: after successful Dodge or Parry, use Thrust OoS",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "exploit_expert": {
      entry.conditionals.push(`Exploit attacks: +${2 * tier} Wound`);
      entry.triggered.push({
        id: "exploit_expert_opening",
        name: "Exploit Expert",
        description: "1/Round: if an Opponent attacks while in Melee Range of 2+ Allies, it triggers your Exploit",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "master_of_openings": {
      entry.conditionals.push(`Exploit attacks: +${tier} Strike`);
      entry.triggered.push({
        id: "master_of_openings_transform",
        name: "Master of Openings",
        description: "1/Round: if an Opponent uses Power Up or Transformation while not at Long Range, it triggers your Exploit",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "responsive_warrior": {
      entry.conditionals.push(`Per converted Action to Counter Action this round: +${tier} Wound`);
      entry.conditionals.push(`If 2+ Actions converted to Counter Actions: +${tier} Strike`);
      entry.bonuses.push("Wild Counter attacks also count as Exploit attacks");
      entry.triggered.push({
        id: "responsive_warrior_redirect",
        name: "Responsive Warrior",
        description: "1/Round: if an enemy could target you but attacks an Ally instead, win Strike Clash to redirect the attack to you",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "adept_warrior": {
      entry.conditionals.push(`Vs larger Size Category: +${2 * tier} Wound`);
      entry.conditionals.push(`Vs smaller Size Category: +${tier} Strike`);
      entry.triggered.push({
        id: "adept_warrior_punching_down_defense",
        name: "Adept Warrior Defense",
        description: "Ignore Punching Down bonuses on attacks that hit you",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "adept_warrior_punching_down_offense",
        name: "Adept Warrior Offense",
        description: "If your attack misses but would benefit from Punching Down, still roll its Punching Down Extra Dice and deal that LP loss",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "aggressive_style": {
      entry.triggered.push({
        id: "aggressive_style_shift",
        name: "Aggressive Style",
        description: `If Combat Expertise reduces Defense by at least ${baseTier}, gain +${baseTier} extra Awareness`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "aggressive_style_crit",
        name: "Aggressive Style Crit",
        description: "On hit with an Attacking Maneuver, reduce Strike and Wound Critical Targets by 1 until end of turn",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "artful_strike": {
      entry.triggered.push({
        id: "artful_strike_dimdef",
        name: "Artful Strike",
        description: `On attack declaration, spend ${3 * baseTier} KP to double current Diminishing Defense penalties for that attack`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "artful_strike_momentum",
        name: "Artful Strike Momentum",
        description: "If you moved this round or used Charging Assault, gain Greater Dice on Strike for that attack",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "focused_strike": {
      entry.bonuses.push("Strike Rolls: roll Base Die twice, keep highest");
      entry.bonuses.push("Strike Critical Target -1");
      break;
    }
    case "masterful_strike": {
      entry.triggered.push({
        id: "masterful_strike_reroll",
        name: "Masterful Strike",
        description: "If an Attacking Maneuver misses, reroll its Strike Roll against the same opposing roll",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "masterful_strike_ignore",
        name: "Masterful Strike Focus",
        description: "Instant: until end of turn, ignore all penalties to Strike Rolls",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "powerful_strike": {
      entry.triggered.push({
        id: "powerful_strike_trade",
        name: "Powerful Strike",
        description: `On an Attacking Maneuver, reduce Strike by ${tier} to increase Wound by ${3 * tier}`,
        usageLimit: null, maxUses: null
      });
      entry.bonuses.push("Wound Critical Target -1");
      break;
    }
    case "jack_of_all_styles": {
      entry.bonuses.push("Treat AG/FO/TE/MA as +1/2 value for Unique Ability requirements");
      entry.triggered.push({
        id: "jack_of_all_styles_magic",
        name: "Jack of All Styles Magic",
        description: `After using a Magical Unique Ability, your Physical and Energy attacks gain +${2 * tier} Wound until end of turn`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "jack_of_all_styles_technical",
        name: "Jack of All Styles Technical",
        description: `After using a Technical Unique Ability, your Magic attacks gain +${2 * tier} Wound until end of turn`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "perfected_tactics": {
      entry.bonuses.push("Combat Tactician: gain both Conditioned bonuses together");
      entry.triggered.push({
        id: "perfected_tactics_dodge",
        name: "Perfected Tactics",
        description: `When targeted by an Opponent with a Combat Condition, gain +${2 * tier} Dodge`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "wild_counter": {
      entry.triggered.push({
        id: "wild_counter_basic",
        name: "Wild Counter",
        description: "When Parry avoids an Attacking Maneuver, use Basic Attack OoS against that attacker",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "perfect_counter": {
      entry.triggered.push({
        id: "perfect_counter_parry",
        name: "Perfect Counter Parry",
        description: `When targeted by an Attacking Maneuver, spend ${3 * baseTier} KP to use Parry without spending a Counter Action`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "perfect_counter_wild",
        name: "Perfect Counter Wild",
        description: `Wild Counter Basic Attacks gain +${tier} Strike`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "full_counter": {
      entry.triggered.push({
        id: "full_counter_wound",
        name: "Full Counter",
        description: "Cross Counter may add +1/4 of the target's Wound Dice Score to your Wound; target's Wound becomes Urgent even on miss",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "full_counter_jolt",
        name: "Full Counter Jolt",
        description: "If also using Jolt Counter, double Full Counter's Wound bonus",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "defensive_style": {
      entry.triggered.push({
        id: "defensive_style_shift",
        name: "Defensive Style",
        description: `If Combat Expertise reduces Awareness by at least ${baseTier}, gain +${baseTier} extra Defense`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "defensive_style_crit",
        name: "Defensive Style Crit",
        description: "After dodging an Attacking Maneuver, reduce Dodge and Wound Critical Targets by 1 until end of turn",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "cunning_evasion": {
      entry.triggered.push({
        id: "cunning_evasion_mark",
        name: "Cunning Evasion",
        description: "Target an Opponent; their first two Attacking Maneuvers against you this round do not inflict Diminishing Defense",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "cunning_evasion_move",
        name: "Cunning Evasion Movement",
        description: "If you used Movement this round, you may gain Greater Dice on Dodge against an incoming Attacking Maneuver",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "instinctual_evasion": {
      entry.bonuses.push("Dodge Rolls: roll Base Die twice, keep highest");
      entry.bonuses.push("Dodge Critical Target -1");
      break;
    }
    case "masterful_evasion": {
      entry.triggered.push({
        id: "masterful_evasion_reroll",
        name: "Masterful Evasion",
        description: "If an Attacking Maneuver hits you, reroll your Dodge Roll against the same opposing roll",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "masterful_evasion_ignore",
        name: "Masterful Evasion Focus",
        description: "Instant: until end of turn, ignore all penalties to Dodge Rolls",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "free_flowing_stance": {
      entry.triggered.push({
        id: "free_flowing_stance_actions",
        name: "Free Flowing Stance",
        description: `Instant on your turn: spend any number of Actions for +${tier} Defense each until start of your next turn`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "free_flowing_stance_kp",
        name: "Free Flowing Stance KP",
        description: `If you have no Standard Actions, spend up to ${4 * baseTier} KP for +1/2 spent KP to Dodge against an incoming attack`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "superior_agility": {
      entry.bonuses.push("Guard Down penalties to Defense and Strike are halved");
      entry.triggered.push({
        id: "superior_agility_reflect",
        name: "Superior Agility",
        description: "After dodging an Attacking Maneuver, target loses LP equal to 1/2 of the amount your Dodge exceeded their Strike by",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "tough_warrior": {
      entry.bonuses.push("Collision Damage suffered is halved");
      entry.triggered.push({
        id: "tough_warrior_dr",
        name: "Tough Warrior",
        description: `When hit by an Attacking Maneuver, spend up to ${3 * baseTier} KP for equal Damage Reduction during that attack`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "superior_durability": {
      entry.bonuses.push("LP loss from Combat Conditions and Damage over Time is halved");
      entry.triggered.push({
        id: "superior_durability_category",
        name: "Superior Durability",
        description: `If you have ${3 * baseTier} or more Damage Reduction against an attack, reduce its Damage Category by 1`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "muscular_warrior": {
      entry.bonuses.push("Ignore penalties from 1 stack of Super Stack");
      entry.triggered.push({
        id: "muscular_warrior_stack",
        name: "Muscular Warrior",
        description: "While below Bruised, gain 1 Super Stack as an Instant Maneuver for the encounter",
        usageLimit: "encounter", maxUses: 1
      });
      break;
    }
    case "hefty_muscle": {
      entry.bonuses.push("Super Stack Extra Dice gain +1 Dice Category");
      entry.triggered.push({
        id: "hefty_muscle_graze",
        name: "Hefty Muscle",
        description: "If an Attacking Maneuver misses, still roll Wound; halve it and apply it to the target as LP loss",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "steel_muscle": {
      entry.conditionals.push("Super Stack: gain additional Soak equal to 1/2 of the Soak provided by your Super Stacks");
      entry.triggered.push({
        id: "steel_muscle_dr",
        name: "Steel Muscle",
        description: "When hit by an Attacking Maneuver, gain Damage Reduction equal to 1/4 of your Force Modifier during that attack",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "herculean_power": {
      entry.conditionals.push(`UST with 1+ Super Stack: +${baseTier} Wound per Energy Charge`);
      entry.triggered.push({
        id: "herculean_power_soak",
        name: "Herculean Power",
        description: `If targeted before releasing an Energy-Charged attack, gain +${tier} Soak per Energy Charge used since declaration for that attack`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "vigor": {
      entry.conditionals.push(`Per Health Threshold below current max: +${baseTier} Soak and +${baseTier} Defense`);
      break;
    }
    case "ferocious_fighter": {
      entry.bonuses.push("Dodge Natural Result +1");
      entry.conditionals.push("Feral State: critical-result Extra Dice gain +1 Dice Category");
      entry.triggered.push({
        id: "ferocious_fighter_toggle",
        name: "Feral State",
        description: "Enter or exit the Feral State",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "furious_flex": {
      entry.triggered.push({
        id: "furious_flex_break",
        name: "Furious Flex Break",
        description: `If Top Layer Apparel is destroyed, gain +${tier} Combat Rolls until end of turn`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "furious_flex_signature",
        name: "Furious Flex Signature",
        description: "On Signature Technique or declared Energy Charge finisher, reduce Top Layer Break Value by 1 to add its Apparel Bonus to Wound",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "brawler": {
      entry.bonuses.push("While Pinned: gain 1 additional Action each Combat Round");
      entry.triggered.push({
        id: "brawler_grapple",
        name: "Brawler",
        description: "On hit with an Unarmed Physical Attack, use Grapple OoS",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "wrestler": {
      entry.bonuses.push("Treat your Size Category as 1 larger for Gigantic Grip");
      entry.triggered.push({
        id: "wrestler_maintain",
        name: "Wrestler",
        description: "When maintaining a Grapple as Grappler, you may use a Might Clash instead of a Grapple Check",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "judo_training": {
      entry.conditionals.push(`While already in a Grapple: +${2 * tier} Grapple Check Dice Score`);
      entry.triggered.push({
        id: "judo_training_followup",
        name: "Judo Training",
        description: "After successfully initiating a Grapple, use Basic Attack or Launch OoS",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "heel": {
      entry.conditionals.push(`Vs Opponents in a Grapple: +${2 * tier} Wound`);
      entry.triggered.push({
        id: "heel_suffocate",
        name: "Heel",
        description: "While Grappler, spend 1 Action to Clash (Strike); on win, the Grappled gains Suffocating until they escape",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "suplex": {
      entry.triggered.push({
        id: "suplex_sky",
        name: "Suplex Sky",
        description: "While Grappler in Sky, spend 1 Action for a Might Clash; on win, crash to Standard Environment and deal double ground Collision Damage plus your Might",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "suplex_ground",
        name: "Suplex Ground",
        description: "Powered or Crushing attacks used in a Grapple on the Standard Environment gain Wound equal to ground Collision Damage",
        usageLimit: null, maxUses: null
      });
      entry.conditionals.push("Powerbomb Advantage Signature Techniques may apply Suplex's ground-damage effect regardless of Profile");
      break;
    }
    case "human_shield": {
      entry.triggered.push({
        id: "human_shield_sacrifice",
        name: "Human Shield Sacrifice",
        description: "End of turn as Grappler: assign Sacrifice to a Grappled Opponent until start of your next turn or they escape",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "human_shield_redirect",
        name: "Human Shield Redirect",
        description: "If targeted by a non-AoE attack, spend Sacrifice or win a Grapple Check to redirect the attack to a Grappled Opponent; Strike and Wound become Urgent",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "personal_space": {
      entry.triggered.push({
        id: "personal_space_escape",
        name: "Personal Space Escape",
        description: "Spend 1 Action to make a Grapple Check to escape a Grapple as the Grappled",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "personal_space_followup",
        name: "Personal Space Followup",
        description: "After escaping a Grapple, use Basic Attack against the former Grappler or Movement OoS",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "personal_space_kp",
        name: "Personal Space KP",
        description: `On a defensive Grapple Check, spend up to ${8 * baseTier} KP for +1/2 spent KP to the check`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "magic_warrior": {
      entry.bonuses.push("Select a Mystical Foundation; it uses Magic for Wound and Energy Charge cap");
      entry.bonuses.push("If Energy is your Mystical Foundation, you gain access to all Energy Profiles");
      entry.triggered.push({
        id: "magic_warrior_chain",
        name: "Magic Warrior",
        description: `On hit with your Mystical Foundation, your Magic Attacks gain +${tier} Wound until end of turn`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "magic_champion": {
      entry.bonuses.push("Your other non-chosen Foundation also becomes a Mystical Foundation");
      entry.triggered.push({
        id: "magic_champion_followup",
        name: "Magic Champion Followup",
        description: "On hit with your Mystical Foundation, use Basic Attack OoS with a Magic Attack",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "magic_champion_profile",
        name: "Magic Champion Profile",
        description: "When making a Basic Attack with a chosen Foundation, you may pay the KP cost of a Magic Profile to apply it; the attack also counts as Magic",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "magic_master": {
      entry.bonuses.push(`Magic Attack KP Cost -${2 * tier}`);
      entry.triggered.push({
        id: "magic_master_signature",
        name: "Magic Master",
        description: "Magic Signature Techniques gain Strike equal to 1/4 of your Magic Modifier; lose KP equal to that bonus",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "magic_master_charge",
        name: "Magic Master Charge",
        description: "After using Energy Charge, use Signature Technique OoS",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "minion_army": {
      entry.bonuses.push("No limit on total Minions owned; up to 10 may join a Combat Encounter");
      entry.triggered.push({
        id: "minion_army_attack",
        name: "Minion Army Attack",
        description: `If one of your Minions attacks, it gains +${tier} Wound per allied Minion in the encounter that has not attacked this round, up to +${4 * tier}`,
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "minion_army_reinforce",
        name: "Minion Army Reinforce",
        description: "If any number of your Minions are Defeated, you may immediately bring in replacement Minions, up to 10 total in the encounter",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "minion_supporter": {
      entry.bonuses.push("Spectator State targeting a Minion also grants your Tier Extra Dice to that Minion's Combat Rolls");
      entry.triggered.push({
        id: "minion_supporter_empower",
        name: "Minion Supporter Empower",
        description: `Instant: use Empower as if spending 1 Action on one of your Minions; it gains +${tier} Combat Rolls until start of your next turn`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "minion_supporter_rage",
        name: "Minion Supporter Rage",
        description: "If one of your Minions is Defeated by an Opponent's Attacking Maneuver, you may enter Raging and Surging against that Opponent until end of turn",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "footwork": {
      entry.bonuses.push("Gain access to Dragon Dash, or +5 Technique Points if you already had it");
      entry.triggered.push({
        id: "footwork_step",
        name: "Footwork Step",
        description: `Instant: move up to ${baseTier} Squares in any direction`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "footwork_rapid",
        name: "Footwork Rapid Movement",
        description: `After Rapid Movement, gain +${tier} Defense until start of your next turn`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "footwork_soar",
        name: "Footwork Soar",
        description: "When a Character in your Melee Range enters the Sky Environment, use Soar OoS",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "footwork_chase",
        name: "Footwork Chase",
        description: "When a Character in your Melee Range leaves it with Movement, use Movement OoS",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "multi_type_attacker": {
      entry.triggered.push({
        id: "multi_type_attacker_physical",
        name: "Multi-Type Attacker Physical",
        description: `After using a Physical Attack, your Energy Attacks gain either +${tier} Strike or +${2 * tier} Wound for the rest of the round`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "multi_type_attacker_energy",
        name: "Multi-Type Attacker Energy",
        description: `After using an Energy Attack, your Physical Attacks gain either +${tier} Strike or +${2 * tier} Wound for the rest of the round`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "balanced_in_body_and_spirit": {
      entry.triggered.push({
        id: "balanced_in_body_and_spirit_magic",
        name: "Balanced in Body and Spirit Magic",
        description: `After using a Magic Attack, your Physical and Energy Attacks gain +${tier} Wound until end of round`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "balanced_in_body_and_spirit_other",
        name: "Balanced in Body and Spirit Other",
        description: `After using a Physical or Energy Attack, your Magic Attacks gain +${tier} Wound until end of round`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "balanced_in_body_and_spirit_chain",
        name: "Balanced in Body and Spirit Chain",
        description: `Each time you use an Attacking Maneuver of a different Foundation, gain +${tier} Wound until end of turn`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "balanced_in_body_and_spirit_equilibrium",
        name: "Equilibrium",
        description: "If you triggered the foundation-chain effect 3 times in one round, gain 1 Equilibrium (max 3); spend 1 Equilibrium to make a Basic Attack cost 0 KP",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "multi_type_gambit": {
      entry.triggered.push({
        id: "multi_type_gambit_fake",
        name: "Multi-Type Gambit",
        description: "Apply either Multi-Type Attacker trigger as if you had used the required Foundation",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "multi_type_gambit_category",
        name: "Multi-Type Gambit Charge",
        description: "If an attack has a different Foundation from your earlier attacks this round and has 2+ Energy Charges, it may gain +1 Damage Category",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "multi_type_master": {
      entry.triggered.push({
        id: "multi_type_master_swap",
        name: "Multi-Type Master Swap",
        description: "On hit with a Physical or Energy attack, use Basic Attack OoS with the other Foundation",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "multi_type_master_momentum",
        name: "Multi-Type Master Momentum",
        description: "If you would gain Bonus Momentum, instead use Basic Attack twice OoS: one Physical and one Energy; neither may Ki Wager",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "supreme_fist": {
      entry.bonuses.push(`Unarmed Physical Attack KP Cost -${2 * tier}`);
      entry.triggered.push({
        id: "supreme_fist_spend",
        name: "Supreme Fist Spend",
        description: `On hit with an Unarmed Physical Attack, spend up to ${6 * baseTier} KP for equal Wound`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "supreme_fist_prone",
        name: "Supreme Fist Prone",
        description: `On hit and damage with an Unarmed Physical Attack, win a Might Clash to knock the target Prone; if already Prone, they lose ${4 * tier} LP`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "masterful_integration": {
      entry.triggered.push({
        id: "masterful_integration_break",
        name: "Masterful Integration",
        description: `On an Attacking Maneuver, spend up to 2 Break Points for +${2 * tier} Wound per Break Point`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "masterful_integration_quality",
        name: "Masterful Integration Quality",
        description: "When Energy Core destroys a Weapon via Mutant Core Choice, transfer one of its Qualities to another applicable Integrated Weapon",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "combat_mode": {
      entry.conditionals.push(`While Damage Reduction is 0: +${tier} Dodge`);
      entry.triggered.push({
        id: "combat_mode_shift",
        name: "Combat Mode",
        description: "Reduce your Damage Reduction to 0 until start of your next turn; if you do, your Wound Rolls increase by the amount lost",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "dedicated_sniper": {
      entry.bonuses.push("Patient Sniper's first effect can be used 2 additional times per Combat Round");
      entry.bonuses.push("Your Exploit uses do not count toward Diminishing Offense");
      entry.triggered.push({
        id: "dedicated_sniper_trigger",
        name: "Dedicated Sniper",
        description: `If an Ally hits an Opponent, spend ${3 * baseTier} KP to make that Opponent trigger that Ally's Exploit; once per round per Ally`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "technical_prowess": {
      entry.triggered.push({
        id: "technical_prowess_aura",
        name: "Technical Prowess Aura",
        description: "When using Aura, either halve its activation KP cost for this use or add one Aura Advantage rank worth up to 10 TP",
        usageLimit: null, maxUses: null
      });
      entry.bonuses.push(`Experienced Fighter gains Iron Guard: +${2 * tier} Soak until end of round and +1/2 Insight Modifier Damage Reduction against the next incoming attack`);
      break;
    }
    case "acute_triple_vision": {
      entry.bonuses.push("Perception Skill Bonus +1");
      entry.triggered.push({
        id: "acute_triple_vision_retry",
        name: "Acute Triple Vision Retry",
        description: "If your attack is dodged and you have not used Earthling Resolve's second effect this round, win a Perception Clash to repeat that attack OoS at 0 KP and ignore Earthling Resolve's second effect for the round",
        usageLimit: "round", maxUses: 1
      });
      entry.triggered.push({
        id: "acute_triple_vision_offense",
        name: "Acute Triple Vision Offense",
        description: "This round, Diminishing Offense starts only after your 4th Attacking Maneuver; if used, ignore Three-Eyes' second effect",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "battle_goo": {
      entry.bonuses.push("Counts as a Minion Talent");
      entry.bonuses.push("Maximum number of Minions +2");
      entry.bonuses.push(`Goops gain +${10 * baseTier} LP`);
      entry.bonuses.push("Your Goops gain access to Intervene");
      break;
    }
    case "mini_majin": {
      entry.bonuses.push("Counts as a Minion Talent");
      entry.bonuses.push("Maximum number of Minions +2");
      entry.conditionals.push(`When creating a Goop, you may spend ${3 * tier} KP to create a smaller Duplicate Minion instead`);
      entry.triggered.push({
        id: "mini_majin_goop",
        name: "Mini Majin",
        description: "If hit by a Direct or Lethal attack, create a Goop on an unoccupied adjacent Square",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "tuffle_parasite": {
      entry.bonuses.push("Counts as a Minion Talent");
      entry.bonuses.push("Maximum number of Minions +2");
      entry.triggered.push({
        id: "tuffle_parasite_minion",
        name: "Tuffle Parasite Minion",
        description: "After leaving the body of a possessed Minion, it becomes your Minion unless it is a Special Minion",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "tuffle_parasite_cognitive",
        name: "Tuffle Parasite Cognitive",
        description: `After leaving the body of a possessed Character, their Cognitive Saves against you suffer -${tier} Dice Score for the encounter (non-stacking)`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "practiced": {
      entry.bonuses.push("Skill Checks: roll Base Die twice, keep highest");
      entry.bonuses.push("Gain 2 Skill Ranks across 2 different Skills");
      break;
    }
    case "show_stopping_performance": {
      entry.bonuses.push("Performance Skill Checks Natural Result +1");
      entry.triggered.push({
        id: "show_stopping_performance_choice",
        name: "Show Stopping Performance",
        description: "Choose one Hype enhancement option; it triggers 1/Round when using Hype",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "dynamic_hype": {
      entry.bonuses.push("Gain 2 additional Show Stopping Performance options; only one may be active at a time");
      entry.triggered.push({
        id: "dynamic_hype_soak",
        name: "Dynamic Hype",
        description: `When using Hype, gain +${tier} Soak until end of your next turn`,
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "team_pose": {
      entry.triggered.push({
        id: "team_pose_regen",
        name: "Team Pose Regain",
        description: `If an Ally uses Hype within Sphere AoE of you, regain ${2 * baseTier} KP`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "team_pose_chain",
        name: "Team Pose Chain",
        description: "When you use Hype, Allies in Sphere AoE with Show Stopping Performance may use Hype OoS",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "spotlight_specialist": {
      entry.bonuses.push("Choose a Performance Specialty as an Encompassing Skill; it crits on 7+ and tracks Performance ranks");
      entry.bonuses.push("Hype may use your Personality Modifier instead of the usual score");
      entry.triggered.push({
        id: "spotlight_specialist_double",
        name: "Spotlight Specialist",
        description: "When you use Hype, you may apply two Show Stopping Performance options at once",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "analytic_fighter": {
      entry.bonuses.push("Investigation Skill Checks Natural Result +1");
      entry.triggered.push({
        id: "analytic_fighter_choice",
        name: "Analytic Fighter",
        description: "Choose one Analysis enhancement option; it triggers 1/Round when using the Investigation effect of Analysis",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "complete_analysis": {
      entry.bonuses.push("Intuition Skill Checks Natural Result +1");
      entry.bonuses.push("Analysis may use both effects simultaneously");
      entry.triggered.push({
        id: "complete_analysis_share",
        name: "Complete Analysis",
        description: "When you use the Intuition effect of Analysis, all Allies benefit as if they used it themselves",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "flexible_planning": {
      entry.bonuses.push("Gain 2 additional Analytic Fighter options; only one may be active at a time");
      entry.triggered.push({
        id: "flexible_planning_regen",
        name: "Flexible Planning",
        description: `When using Analysis, regain ${4 * baseTier} KP`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "master_strategist": {
      entry.bonuses.push("Analysis Investigation may use your Scholarship Modifier instead of the usual score");
      entry.triggered.push({
        id: "master_strategist_extra",
        name: "Master Strategist Extra Target",
        description: "When using Analysis, you may target one additional Opponent",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "master_strategist_double",
        name: "Master Strategist Single Target",
        description: "If there is only one Opponent, your Analysis may use two Analytic Fighter options at once",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "genius_designer": {
      entry.bonuses.push("All Craft Skill Checks Natural Result +1");
      entry.bonuses.push("Choose one Craft Specialization; its Skill Bonus may be used for any Craft Skill Check");
      break;
    }
    case "counter_jury_rigging": {
      entry.triggered.push({
        id: "counter_jury_rigging_wound",
        name: "Counter Jury-rigging Wound",
        description: `While benefiting from Analysis, Armed Attacks gain +${2 * tier} Wound`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "counter_jury_rigging_quality",
        name: "Counter Jury-rigging Quality",
        description: "Select a Weapon and apply one additional applicable Weapon Quality to it until end of round",
        usageLimit: "round", maxUses: 1
      });
      break;
    }
    case "silent_footsteps": {
      entry.triggered.push({
        id: "silent_footsteps_rapid",
        name: "Silent Footsteps",
        description: "After Rapid Movement, Clash Stealth vs Perception against all Opponents; winners inflict Oblivious until end of your next turn or until after you attack them",
        usageLimit: null, maxUses: null
      });
      entry.bonuses.push("Concealment checks may use Stealth Skill Bonus at -2 Dice Score");
      break;
    }
    case "master_assassin": {
      entry.conditionals.push(`Vs Oblivious Opponents: +${tier} Wound`);
      entry.bonuses.push("You may use Stealth Strike's 1/Round effect one additional time each Combat Round");
      break;
    }
    case "acrobat_star": {
      entry.bonuses.push("Flip may be used as an Instant Maneuver");
      entry.triggered.push({
        id: "acrobat_star_prone",
        name: "Acrobat Star",
        description: "When using Flip, you may stand from Prone instead of moving",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "expert_pilot": {
      entry.bonuses.push("Action cost to enter a Vehicle or Battle Jacket is reduced by 1; if reduced to 0 it becomes Instant");
      entry.conditionals.push(`Vehicle Dodge Rolls: +${tier} per 2 Piloting ranks`);
      entry.bonuses.push("At 5 Piloting ranks, Vehicle Dodge Critical Target -1");
      entry.bonuses.push("Ignore the Battle Jacket Penalty");
      entry.triggered.push({
        id: "expert_pilot_battle_jacket",
        name: "Expert Pilot",
        description: "While piloting a Battle Jacket, you may add your Piloting Skill Bonus to a Combat Roll",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "yoink": {
      entry.bonuses.push("Snatch can also take unequipped Weapons possessed by another Character");
      entry.triggered.push({
        id: "yoink_guard_down",
        name: "Yoink",
        description: "If you successfully Snatch an Item, that Character gains Guard Down against your next Attacking Maneuver this turn",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "battlefield_doctor": {
      entry.triggered.push({
        id: "battlefield_doctor_self",
        name: "Battlefield Doctor Self",
        description: "Treatment may target yourself instead of an Ally in your Melee Range",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "battlefield_doctor_threshold",
        name: "Battlefield Doctor Threshold",
        description: "Treatment target ignores Health Threshold penalties until end of their next turn",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "refined_sensor": {
      entry.bonuses.push("Perception checks may use Clairvoyance Skill Bonus at -1 Dice Score");
      entry.bonuses.push("Gain access to the Perception option of Search");
      entry.triggered.push({
        id: "refined_sensor_alignment",
        name: "Refined Sensor Alignment",
        description: "If you win the Clairvoyance Clash of Search, you learn the target's Alignment",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "refined_sensor_bonus",
        name: "Refined Sensor Bonus",
        description: `If you win the Clairvoyance Clash of Search, gain +${tier} Strike and Dodge against that Opponent for the encounter`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "master_tamer": {
      entry.bonuses.push("Creature Handling Skill Checks Natural Result +1");
      entry.triggered.push({
        id: "master_tamer_control",
        name: "Master Tamer",
        description: "Instant: target an Opponent's Minion and Clash Creature Handling vs its Master; on win, that Minion makes a Basic Attack against the Master with Urgent Combat Rolls",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "terrifying_presence": {
      entry.bonuses.push("Terrify may target all Opponents in Sphere AoE or one Opponent up to 8 Squares away");
      entry.triggered.push({
        id: "terrifying_presence_threshold",
        name: "Terrifying Presence",
        description: "If you knock an Opponent through a Health Threshold, use Terrify OoS",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "desperate_distraction": {
      entry.bonuses.push("Gain access to Dirty Trick");
      entry.triggered.push({
        id: "desperate_distraction_instant",
        name: "Desperate Distraction",
        description: "If you are below the Injured Health Threshold, Dirty Trick may be used as an Instant Maneuver",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "last_ditch_effort": {
      entry.bonuses.push("Bluff Skill Checks Natural Result +1");
      entry.triggered.push({
        id: "last_ditch_effort_followup",
        name: "Last Ditch Effort",
        description: "If you win the Clash for Dirty Trick, after it resolves you may use Basic Attack or Signature Technique OoS",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "survivalist": {
      entry.bonuses.push("Survival Skill Check Critical Target -1");
      entry.conditionals.push(`While in Battle Weather whose effects you ignore: +${tier} Defense and +${tier} Soak`);
      break;
    }
    case "team_survivalist": {
      entry.bonuses.push("Using Brace does not trigger Exploit");
      entry.bonuses.push("Your Allies are unaffected by Battle Weather created by you");
      entry.triggered.push({
        id: "team_survivalist_brace",
        name: "Team Survivalist",
        description: "Brace applies to all Allies in your Melee Range; any Clash result from that Brace applies to them instead of separate Clashes",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "feint_master": {
      entry.bonuses.push("Feint may be declared after your Strike Roll as an OoS Maneuver");
      entry.bonuses.push("If you do, the Opponent regains KP or Counter Actions spent in response to that attack");
      entry.triggered.push({
        id: "feint_master_wager",
        name: "Feint Master",
        description: "Attacks made through Feint may Ki Wager up to 1/2 of your Max Capacity",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "precision_kata": {
      entry.conditionals.push("Archetype Focus selected Foundation: Strike Critical Target -1");
      entry.triggered.push({
        id: "precision_kata_crit",
        name: "Precision Kata",
        description: `If you critically hit on Strike with your Archetype Focus Foundation, gain +${3 * tier} Wound for that attack`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "brutal_kata": {
      entry.conditionals.push("Archetype Focus selected Foundation: Wound Critical Target -1");
      entry.triggered.push({
        id: "brutal_kata_crit",
        name: "Brutal Kata",
        description: `If you critically hit on Wound with your Archetype Focus Foundation, gain +${3 * tier} Wound for that attack`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "profile_focus": {
      entry.bonuses.push(`Choose a non-Crushing/Cutting Profile from Archetype Focus; it gains +${2 * tier} Wound`);
      entry.bonuses.push("That selected Profile may be used twice per Combat Round through Basic Attack");
      break;
    }
    case "slow_starter": {
      entry.bonuses.push("Clairvoyance and Concealment Skill Checks +2 Dice Score");
      entry.conditionals.push(`While Holding Back: Maneuver KP Cost -${tier}`);
      entry.triggered.push({
        id: "slow_starter_holdback",
        name: "Slow Starter Hold Back",
        description: "Use Holding Back OoS",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "slow_starter_realized",
        name: "Slow Starter Legend Realized",
        description: "If you lose all Holding Back stacks, you may apply Legend Realized even if not in a Transformation",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "warm_up": {
      entry.triggered.push({
        id: "warm_up_state",
        name: "Warm Up",
        description: "While Holding Back, spend 1 Action to become Warmed Up until end of your next turn; ignore 1 Holding Back stack but still pay reduced Tier KP costs",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "warm_up_followup",
        name: "Warm Up Followup",
        description: "If you lose all Holding Back stacks, use Power Up or Transformation OoS",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "conserving_strength": {
      entry.bonuses.push("Maximum Patience Stacks becomes 15");
      entry.bonuses.push("Reserved Combatant's second effect becomes Triggered instead of Automatic");
      entry.bonuses.push("You may gain Patience from Reserved Combatant even while not Holding Back, unless in a Tier 4+ requirement Transformation");
      entry.triggered.push({
        id: "conserving_strength_transform",
        name: "Conserving Strength",
        description: "When you enter a Transformation with a Tier 4+ requirement, lose all Patience and regain KP equal to 2 x lost Patience x(bT)",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "lightning_surge": {
      entry.triggered.push({
        id: "lightning_surge_heal",
        name: "Lightning Surge Heal",
        description: `If you use Healing Surge, gain +${2 * tier} Soak until end of your next turn`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "lightning_surge_power",
        name: "Lightning Surge Power",
        description: `If you use Power Surge, gain +${2 * tier} Wound until end of your next turn`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "lightning_surge_followup",
        name: "Lightning Surge Followup",
        description: "If Healing Surge raises you beyond a current Health Threshold, use Power Up or Transformation OoS",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "mental_warfare": {
      entry.bonuses.push("Gain access to the Insult Special Maneuver");
      entry.triggered.push({
        id: "mental_warfare_threshold",
        name: "Mental Warfare",
        description: "If an Opponent is knocked through a Health Threshold by an Attacking Maneuver, use Insult OoS targeting that Opponent",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "taunt": {
      entry.conditionals.push(`Vs Compelled Opponents: +${baseTier} Damage Reduction`);
      entry.triggered.push({
        id: "taunt_compelled",
        name: "Taunt",
        description: "If you win the Morale Clash for Insult, that Opponent gains Compelled against you until the start of your next turn",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "flexible_flanker": {
      entry.conditionals.push(`If an Ally is in an Opponent's Melee Range: +${tier} Strike and +${2 * tier} Wound against that Opponent`);
      break;
    }
    case "supporting_defender": {
      entry.conditionals.push(`If you are in an Opponent's Melee Range: your Allies gain +${tier} Dodge or +${tier} Strike on Parry against that Opponent`);
      break;
    }
    case "opportunist": {
      entry.triggered.push({
        id: "opportunist_exploit",
        name: "Opportunist",
        description: `If an Ally knocks an Opponent through a Health Threshold, use Exploit against that Opponent; spend ${4 * baseTier} KP to do it without a Counter Action`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "power_gifter": {
      entry.bonuses.push("Empower consumes only half your Capacity Rate");
      entry.triggered.push({
        id: "power_gifter_transfer",
        name: "Power Gifter",
        description: "If you have Power Stacks and use Empower, you may transfer them to the targeted Ally up to the number of Actions spent and their max stack limit; they last until end of that Ally's next turn",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "favored_technique": {
      entry.bonuses.push("Choose one Signature Technique as your Favored Technique");
      entry.bonuses.push("Favored Technique gains 1 Energy Charge when used through Signature Technique");
      entry.bonuses.push(`Gain a separate pool of ${4 * baseTier} Technique Points for Favored Technique upgrades; +4 per new base Tier`);
      break;
    }
    case "flexible_technique": {
      entry.triggered.push({
        id: "flexible_technique_advantages",
        name: "Flexible Technique Advantages",
        description: "When using your Favored Technique, swap Accurate ranks for Power Shot ranks or vice versa; if it has neither, apply 1 rank of Efficiency instead",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "flexible_technique_profile",
        name: "Flexible Technique Profile",
        description: "When using your Favored Technique, you may change it to any other Profile in its Foundation for that use and recalculate KP cost/valid Advantages",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "unique_technique": {
      entry.bonuses.push("Favored Technique gains a second selected Profile of the same Foundation; KP Cost increases by 1/2 of that Profile's KP Cost");
      entry.triggered.push({
        id: "unique_technique_ultimate",
        name: "Unique Technique Ultimate",
        description: "If your Favored Technique is used as an Ultimate Signature, ignore Unique Technique's KP increase; if it was already Ultimate, Energy Charge Extra Dice gain +1 Dice Category",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "terrifying_technique": {
      entry.conditionals.push(`Signature Techniques vs Shaken targets: +${2 * tier} Wound`);
      entry.triggered.push({
        id: "terrifying_technique_terrify",
        name: "Terrifying Technique",
        description: "If you use Energy Charge and declare your Favored Technique, you may use Terrify OoS",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "quick_learner": {
      entry.triggered.push({
        id: "quick_learner_copy",
        name: "Quick Learner Copy",
        description: `When any Character uses a Signature Technique, declare it as your Copied Technique for the encounter; Copied Techniques suffer -${2 * tier} Wound and you can only hold one at a time`,
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "quick_learner_permanent",
        name: "Quick Learner Permanent",
        description: "At the end of the Combat Encounter, you may pay the TP cost of a Copied Technique to learn it permanently",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "copy_index": {
      entry.bonuses.push("You may possess up to two Copied Techniques at once");
      entry.triggered.push({
        id: "copy_index_retain",
        name: "Copy Index",
        description: "At the end of each Combat Encounter, retain one Copied Technique until the end of your next Combat Encounter",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "technique_armory": {
      entry.bonuses.push("Initial Technique Point Cost of Signature Techniques -4, including retroactive TP refunds");
      entry.triggered.push({
        id: "technique_armory_points",
        name: "Technique Armory Points",
        description: "The first time each Combat Encounter that you use a Super Signature Technique, gain 1 Armory Point",
        usageLimit: "encounter", maxUses: 1
      });
      entry.triggered.push({
        id: "technique_armory_spend",
        name: "Technique Armory Spend",
        description: `When using an Ultimate Signature Technique, spend Armory Points for +${2 * tier} Wound each`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "blinding_transformation": {
      entry.triggered.push({
        id: "blinding_transformation_powerup",
        name: "Blinding Transformation Power Up",
        description: "If you enter a Transformation through the Transformation Maneuver, you may immediately use Power Up OoS",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "blinding_transformation_core",
        name: "Blinding Transformation Core",
        description: "When entering a Core Transformation, you may add one level of Long Transformation for the encounter; if you do, make an Impulsive Clash vs all Opponents in a Destructive Sphere AoE to inflict Blinded until end of their next turn",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "category_specialist": {
      entry.bonuses.push("Choose a Weapon Category; its Strike Rolls gain Natural Result +1");
      entry.triggered.push({
        id: "category_specialist_wound",
        name: "Category Specialist",
        description: `Attacks with the chosen Weapon Category may gain +${tier} Wound for each Talent you possess that is Weapon Specialist or lists it as a prerequisite`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "application_of_skill": {
      entry.conditionals.push("If three Attributes including IN are higher than FO and MA, Might Checks/Clashes gain +1/4 of your Insight Modifier");
      entry.triggered.push({
        id: "application_of_skill_wound",
        name: "Application of Skill",
        description: "Whenever you would make a Wound Roll, add +1/2 of your Insight Modifier; in a Core Transformation, you may add +1/2 of that form's FO or MA modifier bonus as well",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "naturist": {
      const slotsN = system.wornApparelSlots || {};
      const hasApparelN = !!(slotsN.topLayer || slotsN.middleLayer || slotsN.bottomLayer);
      const auNaturel = talentSet.has("au_naturel");
      const naturistMult = auNaturel ? 2 : 1;
      if (!hasApparelN) {
        const dvBonus = baseTier * naturistMult;
        const soakBonus = baseTier * naturistMult;
        system.aptitudes.defenseValue = (system.aptitudes.defenseValue || 0) + dvBonus;
        totals.defense += dvBonus;
        addSoak(system, soakBonus);
        totals.soak += soakBonus;
        // +1(bT) Awareness and Initiative (no Apparel)
        system.aptitudes.awareness = (system.aptitudes.awareness || 0) + baseTier;
        system.aptitudes.initiative = (system.aptitudes.initiative || 0) + baseTier;
        totals.initiative += baseTier;
        entry.bonuses.push(`+${dvBonus} Defense Value, +${soakBonus} Soak, +${baseTier} Awareness, +${baseTier} Initiative (Naturist${auNaturel ? " ×2 Au Naturel" : ""}, no Apparel)`);
      } else {
        entry.conditionals.push(`If wearing no Apparel: +${baseTier * naturistMult} Defense, +${baseTier * naturistMult} Soak, +${baseTier} Awareness, +${baseTier} Initiative`);
      }
      break;
    }
    case "au_naturel": {
      // Doubling is handled in the "naturist" case above
      entry.triggered.push({
        id: "au_naturel_wound",
        name: "Au Naturel",
        description: `If wearing no Apparel, gain +${2 * tier} Wound until you equip Apparel during the encounter`,
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "snack_fiend": {
      entry.triggered.push({
        id: "snack_fiend_gain",
        name: "Snack Fiend",
        description: "Gain a Snack Basic Item",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "snack_fiend_superior",
        name: "Snack Fiend Superior",
        description: "After using the Snack Basic Item, enter the Superior State until end of your turn",
        usageLimit: null, maxUses: null
      });
      break;
    }
    case "swaggering_wager": {
      entry.triggered.push({
        id: "swaggering_wager_limitations",
        name: "Swaggering Wager Limitations",
        description: "Select up to 3 penalties until the start of your next turn: Limb Restriction, Lazy Fighting, or Zero Effort",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "swaggering_wager_gain",
        name: "Swaggering Wager Gain",
        description: "When selected Swaggering Wager penalties end, gain that many Swagger Stacks",
        usageLimit: null, maxUses: null
      });
      entry.triggered.push({
        id: "swaggering_wager_spend",
        name: "Swaggering Wager Spend",
        description: `Instant: spend Swagger to gain +${tier} to a chosen Combat Roll per stack, or 2 Swagger for 1 Counter Action, or 3 Swagger for a Basic Attack OoS, or 4 Swagger for 1 additional Action`,
        usageLimit: null, maxUses: null
      });
      break;
    }

    default:
      handled = false;
      break;
  }

  if (!handled) addCatalogFallback(entry, catEntry);
}
