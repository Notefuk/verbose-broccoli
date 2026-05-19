/**
 * Equipment Quality Automation
 * Applies effects of apparel/weapon qualities to actor stats.
 * Called from actor.mjs._prepareCharacterData() after racial/talent automation.
 *
 * Architecture:
 *   - APPAREL_HANDLERS / WEAPON_HANDLERS: dispatch tables keyed by qualityKey
 *   - Each handler receives (ctx, q) where:
 *     ctx = { actor, system, tier, baseTier, item, isTopLayer, apparelBonus }
 *     q   = the quality entry from item.system.qualities[]
 *   - Handlers may mutate ctx.system directly
 *   - Apparel: most effects only on top layer (handler checks ctx.isTopLayer)
 *   - Weapon: effects only when item.system.worn === true
 */

const APPAREL_HANDLERS = {};
const WEAPON_HANDLERS  = {};

/**
 * Compute Apparel Bonus for an item: gradeBonus × baseTier.
 * Grade mapping (per rules):
 *   1 (Apprentice / Low)         → 1 × bT
 *   2 (Qualified / Standard-low) → 2 × bT
 *   3 (Expert / Standard)        → 2 × bT  (Standard grade in rules)
 *   4 (Master / High)            → 3 × bT
 *   5 (Grandmaster / High+)      → 3 × bT
 *
 * Note: rules define 3 grades (Low=1bT, Standard=2bT, High=3bT) but the
 * UI exposes a 5-step craftsmanshipGrade. Mapping treats 1=Low, 2-3=Standard,
 * 4-5=High to match common-sense scaling.
 */
function computeApparelBonus(item, baseTier) {
  const grade = item.system.craftsmanshipGrade || 1;
  const gradeMult = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3 }[grade] ?? 1;
  return gradeMult * baseTier;
}

/**
 * Public entry point. Iterates worn apparel + equipped weapons, dispatches each
 * quality to its handler.
 */
export function applyEquipmentQualityBonuses(actor, system, tier, baseTier) {
  if (!system) return;
  if (!system.equipmentFlags) return;  // schema not yet loaded

  const items = Array.from(actor.items || []);
  const apparelItems = items.filter(i => i.type === "equipment" && i.system.equipmentType === "apparel");
  const weaponItems  = items.filter(i => i.type === "equipment" && i.system.equipmentType === "weapon");

  const ctx = {
    actor,
    system,
    tier,
    baseTier,
    item: null,
    isTopLayer: false,
    apparelBonus: 0
  };

  // --- Apparel: iterate worn items, mark top layer ---
  const slots = system.wornApparelSlots || {};
  const topLayerId    = slots.topLayer    || "";
  const middleLayerId = slots.middleLayer || "";
  const bottomLayerId = slots.bottomLayer || "";
  const wornApparelIds = new Set([topLayerId, middleLayerId, bottomLayerId].filter(Boolean));

  for (const item of apparelItems) {
    if (!wornApparelIds.has(item.id)) continue;
    ctx.item = item;
    ctx.isTopLayer = (item.id === topLayerId);
    ctx.apparelBonus = computeApparelBonus(item, baseTier);
    for (const q of (item.system.qualities || [])) {
      const handler = APPAREL_HANDLERS[q.qualityKey];
      if (handler) {
        try { handler(ctx, q); }
        catch (e) { console.error(`Apparel quality "${q.qualityKey}" handler error:`, e); }
      }
    }
  }

  // --- Weapons: only equipped weapons ---
  for (const item of weaponItems) {
    if (!item.system.worn) continue;
    ctx.item = item;
    ctx.isTopLayer = false;
    ctx.apparelBonus = 0;
    for (const q of (item.system.qualities || [])) {
      const handler = WEAPON_HANDLERS[q.qualityKey];
      if (handler) {
        try { handler(ctx, q); }
        catch (e) { console.error(`Weapon quality "${q.qualityKey}" handler error:`, e); }
      }
    }
  }
}

// =============================================================
// Apparel Quality Handlers (registered in Tasks 12, 14, 15, 16)
// =============================================================

/**
 * Helper: ensure a sub-object exists on a parent object before mutation.
 * SchemaField ObjectField initial value can be undefined; this guarantees
 * a safe assignment target.
 */
function _ensureObj(parent, key) {
  if (!parent[key] || typeof parent[key] !== "object") parent[key] = {};
  return parent[key];
}

/**
 * Helper: bump skill bonus map. Aggregates across qualities that grant
 * Skill Check Dice Score bonuses (mystical, stealth_suit, lab_coat, unique_decal,
 * yardrat_material). Stored on `system.equipmentFlags.skillBonuses[skillId]`.
 * Skill rolls consult this map when computing the bonus.
 */
function _addSkillBonus(system, skillId, amount) {
  if (!skillId || !amount) return;
  const map = _ensureObj(system.equipmentFlags, "skillBonuses");
  map[skillId] = (map[skillId] || 0) + amount;
}

// ---------------------------------------------------------------
// Type A — Numeric direct
// ---------------------------------------------------------------

// dense_armor: +baseTier Apparel Bonus, -baseTier Combat Rolls (top layer only)
// Apparel Bonus increase already handled in actor.mjs._calcApparelBonus().
// Combat Roll penalty: subtract from all combat buff totals.
APPAREL_HANDLERS.dense_armor = (ctx) => {
  if (!ctx.isTopLayer) return;
  const bT = ctx.baseTier;
  ctx.system.aptitudes.strikeBuffTotal = (ctx.system.aptitudes.strikeBuffTotal || 0) - bT;
  ctx.system.aptitudes.dodgeBuffTotal  = (ctx.system.aptitudes.dodgeBuffTotal  || 0) - bT;
  ctx.system.aptitudes.woundBuffTotal  = (ctx.system.aptitudes.woundBuffTotal  || 0) - bT;
};

// durable: flag the item for BV display elsewhere
APPAREL_HANDLERS.durable = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "durableItems");
  map[ctx.item.id] = true;
};

// jacket: +tier Soak if standard_clothing top layer AND middle/bottom is armor.
// (Note: actor.mjs._getEquipmentSoakBonus already adds baseTier per-jacket; we
// fix to "tier" semantics here. We do NOT double-add — instead, add the (tier - baseTier)
// delta if the existing helper already counted it. To keep things consistent and avoid
// drift, we simply leave the existing handler in actor.mjs and skip here.)
// Because actor.mjs already grants +baseTier soak for ANY jacket regardless of category,
// we register a no-op so the handler exists for future migration.
APPAREL_HANDLERS.jacket = () => { /* handled in actor.mjs._getEquipmentSoakBonus (legacy) */ };

// leaders_insignia: +baseTier minion combat rolls (flag only; minion aggregator elsewhere)
APPAREL_HANDLERS.leaders_insignia = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.leaderInsigniaBonus =
    (ctx.system.equipmentFlags.leaderInsigniaBonus || 0) + ctx.baseTier;
  // Stack with Team Outfit on same item: +baseTier ally wound
  const hasTeamOutfit = (ctx.item.system.qualities || []).some(qq => qq.qualityKey === "team_outfit");
  if (hasTeamOutfit) {
    ctx.system.equipmentFlags.leaderInsigniaTeamWound =
      (ctx.system.equipmentFlags.leaderInsigniaTeamWound || 0) + ctx.baseTier;
  }
};

// mystical: +1 Use Magic, +1 Clairvoyance
APPAREL_HANDLERS.mystical = (ctx) => {
  if (!ctx.isTopLayer) return;
  _addSkillBonus(ctx.system, "use_magic", 1);
  _addSkillBonus(ctx.system, "clairvoyance", 1);
};

// stealth_suit: +2 Stealth
APPAREL_HANDLERS.stealth_suit = (ctx) => {
  if (!ctx.isTopLayer) return;
  _addSkillBonus(ctx.system, "stealth", 2);
};

// combat_ready (special): +ceil(apparelBonus/2) to all combat rolls
APPAREL_HANDLERS.combat_ready = (ctx) => {
  if (!ctx.isTopLayer) return;
  const bonus = Math.ceil(ctx.apparelBonus / 2);
  ctx.system.aptitudes.strikeBuffTotal = (ctx.system.aptitudes.strikeBuffTotal || 0) + bonus;
  ctx.system.aptitudes.dodgeBuffTotal  = (ctx.system.aptitudes.dodgeBuffTotal  || 0) + bonus;
  ctx.system.aptitudes.woundBuffTotal  = (ctx.system.aptitudes.woundBuffTotal  || 0) + bonus;
};

// divine_apparel (special): +baseTier Apparel Bonus
// Already counted in actor.mjs._calcApparelBonus(). No-op here.
APPAREL_HANDLERS.divine_apparel = () => { /* handled in actor.mjs._calcApparelBonus (legacy) */ };

// enchanted (special): +apparelBonus Soak
// Already counted in actor.mjs._getEquipmentSoakBonus(). No-op here.
APPAREL_HANDLERS.enchanted = () => { /* handled in actor.mjs._getEquipmentSoakBonus (legacy) */ };

// legacy (special): +2 Natural Result on Steadfast Checks and Saving Throws
APPAREL_HANDLERS.legacy = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.legacyNaturalBonus = 2;
};

// masters_garb (special): +apparelBonus Strike Rolls
APPAREL_HANDLERS.masters_garb = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.aptitudes.strikeBuffTotal =
    (ctx.system.aptitudes.strikeBuffTotal || 0) + ctx.apparelBonus;
};

// resolute_belief (special): +2 Stress Test dice
APPAREL_HANDLERS.resolute_belief = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.stressTestDiceBonus =
    (ctx.system.equipmentFlags.stressTestDiceBonus || 0) + 2;
};

// yardrat_material (special): +2 Clairvoyance + Instant Transmission discount flag
APPAREL_HANDLERS.yardrat_material = (ctx) => {
  if (!ctx.isTopLayer) return;
  _addSkillBonus(ctx.system, "clairvoyance", 2);
  ctx.system.equipmentFlags.instantTransmissionDiscount = true;
};

// ---------------------------------------------------------------
// Type B — Configurable
// ---------------------------------------------------------------

// focal: weights category penalty applies only to chosen roll. Stored on flag.
// Weights penalty not yet automated centrally (legacy code) — flag for future.
APPAREL_HANDLERS.focal = (ctx, q) => {
  const target = q?.config?.target || "";
  const map = _ensureObj(ctx.system.equipmentFlags, "focalTarget");
  map[ctx.item.id] = target;
};

// lab_coat: +2 chosen Scholarship-based skill (top layer only)
APPAREL_HANDLERS.lab_coat = (ctx, q) => {
  if (!ctx.isTopLayer) return;
  const skillId = q?.config?.skillId;
  _addSkillBonus(ctx.system, skillId, 2);
};

// unique_decal: +2 chosen Personality-based skill (any layer per rules)
APPAREL_HANDLERS.unique_decal = (ctx, q) => {
  const skillId = q?.config?.skillId;
  _addSkillBonus(ctx.system, skillId, 2);
};

// notorious_symbol: store flag for combat-time intimidation lookup
APPAREL_HANDLERS.notorious_symbol = (ctx, q) => {
  if (!ctx.isTopLayer) return;
  const organization = q?.config?.organization || "";
  ctx.system.equipmentFlags.notoriousSymbol = {
    itemId: ctx.item.id,
    organization
  };
};

// special_event: +baseTier Doff Bonus (flag set; GM activates at runtime)
APPAREL_HANDLERS.special_event = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.specialEventDoffBonus = ctx.baseTier;
};

// team_outfit: store flag for ally aggregation (cross-actor)
APPAREL_HANDLERS.team_outfit = (ctx, q) => {
  if (!ctx.isTopLayer) return;
  const teamName = q?.config?.teamName || "";
  ctx.system.equipmentFlags.teamOutfit = {
    itemId: ctx.item.id,
    teamName
  };
};

// weather_resistant: store weather type flag (any layer)
APPAREL_HANDLERS.weather_resistant = (ctx, q) => {
  const weatherType = q?.config?.weatherType || "";
  ctx.system.equipmentFlags.weatherResistance = weatherType;
};

// armed: integrated weapon flag (linked weapon item created separately by GM)
APPAREL_HANDLERS.armed = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.hasIntegratedWeapon = true;
};

// ---------------------------------------------------------------
// Type C — Flag Only
// ---------------------------------------------------------------

APPAREL_HANDLERS.environmental_protection = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.preventSuffocating = true;
};

// hefty_plating: HV=4 (regardless of layer — Weights effect)
APPAREL_HANDLERS.hefty_plating = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "heftyPlatingHV");
  map[ctx.item.id] = 4;
};

APPAREL_HANDLERS.joint_protection = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.jointProtection = true;
};

APPAREL_HANDLERS.layered = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.layeredActive = true;
};

// lightweight: skip apparel penalty (regardless of layer)
// actor.mjs._calcLayerPenalty already handles this; flag for completeness.
APPAREL_HANDLERS.lightweight = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "skipApparelPenalty");
  map[ctx.item.id] = true;
};

// sleek_design: top layer only; halves DR (handled in actor.mjs._getEquipmentDR)
// also skips apparel penalty (handled in actor.mjs._calcLayerPenalty).
// Set the flag for downstream consumers/templates.
APPAREL_HANDLERS.sleek_design = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.sleekDesign = true;
  const map = _ensureObj(ctx.system.equipmentFlags, "skipApparelPenalty");
  map[ctx.item.id] = true;
};

// stretching: prevent destruction by size change (any layer)
APPAREL_HANDLERS.stretching = (ctx) => {
  ctx.system.equipmentFlags.preventSizeDestruction = true;
};

// training_support: ignore Weights combat roll penalty if Holding Back stacks present
// (regardless of layer).
APPAREL_HANDLERS.training_support = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "trainingSupport");
  map[ctx.item.id] = true;
};

// unbreakable (special): top layer only
APPAREL_HANDLERS.unbreakable = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.unbreakableTopLayer = true;
};

// ---------------------------------------------------------------
// Type D — Combat-time
// ---------------------------------------------------------------

// assassins_craft (special): +2*apparelBonus to wound vs Oblivious targets.
// Stored as numeric; wound-roll handler checks target.hasOblivious later.
APPAREL_HANDLERS.assassins_craft = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.assassinsCraft =
    (ctx.system.equipmentFlags.assassinsCraft || 0) + 2 * ctx.apparelBonus;
};

// power_enhancement (special): +2*apparelBonus to Sig Tech wound rolls.
// Stored as numeric; technique-wound handler consults later.
APPAREL_HANDLERS.power_enhancement = (ctx) => {
  if (!ctx.isTopLayer) return;
  ctx.system.equipmentFlags.sigTechWoundBonus =
    (ctx.system.equipmentFlags.sigTechWoundBonus || 0) + 2 * ctx.apparelBonus;
};

// =============================================================
// Weapon Quality Handlers (Tasks 13, 14, 15, 16)
// =============================================================
// All weapon handlers receive the same ctx as apparel handlers, but
// ctx.isTopLayer === false and ctx.apparelBonus === 0. Most weapon effects
// are per-item (a weapon's bonus only applies to attacks made with it),
// so most flags are stored in per-item maps keyed by `ctx.item.id`.
//
// Type E (purely narrative) qualities have no handler:
//   boomerang, burst_fire, shishkebab, throwing_weapon,
//   pondering_orb, regenerating, sealing.

// ---------------------------------------------------------------
// Type A — Numeric Direct
// ---------------------------------------------------------------

// artisan: +2*tier Wound Rolls (when using this weapon)
WEAPON_HANDLERS.artisan = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "weaponWoundBonus");
  map[ctx.item.id] = (map[ctx.item.id] || 0) + 2 * ctx.tier;
};

// durable: register weapon ID for BV-related lookups
WEAPON_HANDLERS.durable = (ctx) => {
  const arr = ctx.system.equipmentFlags.durableWeapons;
  if (!Array.isArray(arr)) {
    ctx.system.equipmentFlags.durableWeapons = [ctx.item.id];
  } else if (!arr.includes(ctx.item.id)) {
    arr.push(ctx.item.id);
  }
};

// extending: +3 melee range bonus (per-item)
WEAPON_HANDLERS.extending = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "weaponMeleeRangeBonus");
  map[ctx.item.id] = 3;
};

// far_sight: +4 long-range threshold bonus (per-item)
WEAPON_HANDLERS.far_sight = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "weaponLongRangeBonus");
  map[ctx.item.id] = 4;
};

// giant_weapon: -1T Strike per size category below Enormous, +1d4T Wound bonus
WEAPON_HANDLERS.giant_weapon = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "giantWeapon");
  map[ctx.item.id] = { strikePenaltyPerSize: ctx.tier, woundDieT: ctx.tier };
};

// high_tech: Wound bonus = ceil(SC totalScore / 4); also flag for sig tech alt comp
WEAPON_HANDLERS.high_tech = (ctx) => {
  const sc = ctx.system.attributes?.sc?.totalScore || 0;
  const bonus = Math.ceil(sc / 4);
  const wMap = _ensureObj(ctx.system.equipmentFlags, "weaponWoundBonus");
  wMap[ctx.item.id] = (wMap[ctx.item.id] || 0) + bonus;
  const htMap = _ensureObj(ctx.system.equipmentFlags, "highTechWeapons");
  htMap[ctx.item.id] = true;
};

// long_range_weapon: +1*tier Strike vs targets 9+ squares away
WEAPON_HANDLERS.long_range_weapon = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "weaponLongRangeStrikeBonus");
  map[ctx.item.id] = ctx.tier;
};

// targeting_system: +1 Natural Strike result
WEAPON_HANDLERS.targeting_system = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "weaponTargetingSystem");
  map[ctx.item.id] = 1;
};

// dimension_blade (special): +1 Damage Category for attacks with this weapon
WEAPON_HANDLERS.dimension_blade = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "weaponDamageCatBonus");
  map[ctx.item.id] = 1;
};

// elongation (special): full battlefield melee + AoE Mag +2
WEAPON_HANDLERS.elongation = (ctx) => {
  const fbMap = _ensureObj(ctx.system.equipmentFlags, "weaponFullBattlefieldMelee");
  fbMap[ctx.item.id] = true;
  const aoeMap = _ensureObj(ctx.system.equipmentFlags, "weaponAoEMagBonus");
  aoeMap[ctx.item.id] = 2;
};

// super_heavy (special): -2*baseTier Strike penalty, +5*baseTier Wound, HV=4
WEAPON_HANDLERS.super_heavy = (ctx) => {
  const bT = ctx.baseTier;
  const sMap = _ensureObj(ctx.system.equipmentFlags, "weaponStrikePenalty");
  sMap[ctx.item.id] = -2 * bT;
  const wMap = _ensureObj(ctx.system.equipmentFlags, "weaponWoundBonus");
  wMap[ctx.item.id] = (wMap[ctx.item.id] || 0) + 5 * bT;
  const hvMap = _ensureObj(ctx.system.equipmentFlags, "weaponHV");
  hvMap[ctx.item.id] = 4;
};

// warding_weapon (special): +4*baseTier system DR, +1*tier Clash dice when opponent initiates clash
WEAPON_HANDLERS.warding_weapon = (ctx) => {
  ctx.system.equipmentFlags.wardingDR =
    (ctx.system.equipmentFlags.wardingDR || 0) + 4 * ctx.baseTier;
  ctx.system.equipmentFlags.opponentClashDice =
    (ctx.system.equipmentFlags.opponentClashDice || 0) + ctx.tier;
};

// ---------------------------------------------------------------
// Type B — Configurable
// ---------------------------------------------------------------

// close_quarters_combat: store chosen physical category for combat-time override
WEAPON_HANDLERS.close_quarters_combat = (ctx, q) => {
  const cat = q?.config?.physicalCategory || "";
  const map = _ensureObj(ctx.system.equipmentFlags, "cqcCategory");
  map[ctx.item.id] = cat;
};

// flexible: store alternate category
WEAPON_HANDLERS.flexible = (ctx, q) => {
  const cat = q?.config?.altCategory || "";
  const map = _ensureObj(ctx.system.equipmentFlags, "flexibleAltCategory");
  map[ctx.item.id] = cat;
};

// variable: store alternate size
WEAPON_HANDLERS.variable = (ctx, q) => {
  const altSize = q?.config?.altSize || "";
  const map = _ensureObj(ctx.system.equipmentFlags, "variableAltSize");
  map[ctx.item.id] = altSize;
};

// karmic_edge (special): store alignment for combat-time bonus computation
WEAPON_HANDLERS.karmic_edge = (ctx, q) => {
  const alignment = q?.config?.alignment || "";
  const map = _ensureObj(ctx.system.equipmentFlags, "karmicEdge");
  map[ctx.item.id] = alignment;
};

// elemental_blade (special): store profile config
WEAPON_HANDLERS.elemental_blade = (ctx, q) => {
  const profile = q?.config?.profile || "";
  const map = _ensureObj(ctx.system.equipmentFlags, "elementalBlade");
  map[ctx.item.id] = profile;
};

// ---------------------------------------------------------------
// Type C — Flag Only
// ---------------------------------------------------------------

// telekinetic: skip weapon limit (per-item flag)
WEAPON_HANDLERS.telekinetic = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "skipWeaponLimit");
  map[ctx.item.id] = true;
};

// unbreakable (special, weapon): add to unbreakableWeapons array
WEAPON_HANDLERS.unbreakable = (ctx) => {
  const arr = ctx.system.equipmentFlags.unbreakableWeapons;
  if (!Array.isArray(arr)) {
    ctx.system.equipmentFlags.unbreakableWeapons = [ctx.item.id];
  } else if (!arr.includes(ctx.item.id)) {
    arr.push(ctx.item.id);
  }
};

// ---------------------------------------------------------------
// Type D — Combat-time
// ---------------------------------------------------------------

// breaker: per-item flag for called-shot vs apparel/weapon
WEAPON_HANDLERS.breaker = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "weaponBreaker");
  map[ctx.item.id] = true;
};

// duelist: +1*tier Strike when using Parry (single accumulator — Parry uses one weapon)
WEAPON_HANDLERS.duelist = (ctx) => {
  ctx.system.equipmentFlags.duelistParryBonus =
    (ctx.system.equipmentFlags.duelistParryBonus || 0) + ctx.tier;
};

// hidden: enable first-attack bonus if not yet used this encounter
WEAPON_HANDLERS.hidden = (ctx) => {
  if (!ctx.system.equipmentFlags.hiddenUsedThisEncounter) {
    ctx.system.equipmentFlags.hiddenFirstAttack = true;
  }
};

// lasting_wounds: per-item flag, combat-time DOT application
WEAPON_HANDLERS.lasting_wounds = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "lastingWounds");
  map[ctx.item.id] = true;
};

// quick_draw: per-item bonuses for unsheathe/resheathe situational rolls
WEAPON_HANDLERS.quick_draw = (ctx) => {
  const map = _ensureObj(ctx.system.equipmentFlags, "quickDraw");
  map[ctx.item.id] = { strikeBonus: ctx.tier, woundBonus: 2 * ctx.tier };
};

// Export for testing/debugging if needed
export { APPAREL_HANDLERS, WEAPON_HANDLERS, computeApparelBonus };
