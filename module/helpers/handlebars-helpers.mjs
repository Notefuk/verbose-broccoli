/**
 * Register custom Handlebars helpers for the DBU-OLD system.
 */
export function registerHandlebarsHelpers() {

  // -------------------------------------------------------
  // Comparison helpers
  // -------------------------------------------------------

  /** Strict equality: {{#if (eq a b)}} */
  Handlebars.registerHelper("eq", (a, b) => a === b);

  /** Strict inequality: {{#if (neq a b)}} */
  Handlebars.registerHelper("neq", (a, b) => a !== b);

  /** Greater than: {{#if (gt a b)}} */
  Handlebars.registerHelper("gt", (a, b) => a > b);

  /** Greater than or equal: {{#if (gte a b)}} */
  Handlebars.registerHelper("gte", (a, b) => a >= b);

  /** Less than: {{#if (lt a b)}} */
  Handlebars.registerHelper("lt", (a, b) => a < b);

  /** Less than or equal: {{#if (lte a b)}} */
  Handlebars.registerHelper("lte", (a, b) => a <= b);

  // -------------------------------------------------------
  // Arithmetic helpers
  // -------------------------------------------------------

  /** Addition: {{add a b}} */
  Handlebars.registerHelper("add", (a, b) => Number(a) + Number(b));

  /** Subtraction: {{subtract a b}} */
  Handlebars.registerHelper("subtract", (a, b) => Number(a) - Number(b));

  /** Multiplication: {{multiply a b}} */
  Handlebars.registerHelper("multiply", (a, b) => Number(a) * Number(b));

  /** Division (safe): {{divide a b}} */
  Handlebars.registerHelper("divide", (a, b) => {
    const divisor = Number(b);
    return divisor !== 0 ? Number(a) / divisor : 0;
  });

  // -------------------------------------------------------
  // Formatting helpers
  // -------------------------------------------------------

  /**
   * Format a number as a signed modifier string.
   * formatMod(3) → "+3",  formatMod(-1) → "-1",  formatMod(0) → "+0"
   */
  Handlebars.registerHelper("formatMod", (value) => {
    const n = Number(value) || 0;
    return n >= 0 ? `+${n}` : `${n}`;
  });

  // -------------------------------------------------------
  // Tier-scaling helpers (core DBU mechanic)
  // -------------------------------------------------------

  /**
   * Multiply a value by the actor's tier.
   * Usage: {{tierMultiply value tier}}
   * Corresponds to (T) notation in the manuals.
   */
  Handlebars.registerHelper("tierMultiply", (value, tier) => {
    return Number(value) * Number(tier);
  });

  /**
   * Multiply a value by the actor's base tier (ceil(tier/2)).
   * Usage: {{baseTierMultiply value tier}}
   * Corresponds to (bT) notation in the manuals.
   */
  Handlebars.registerHelper("baseTierMultiply", (value, tier) => {
    const baseTier = Math.ceil(Number(tier) / 2);
    return Number(value) * baseTier;
  });

  /**
   * Parse an attribute bonus string that may contain (T) or (bT) notation.
   * Examples:
   *   parseAttrBonus "+2(T)" 3  → 6
   *   parseAttrBonus "+1(bT)" 4 → 2  (baseTier of 4 = 2)
   *   parseAttrBonus "+3" 5     → 3
   *   parseAttrBonus "5" 2      → 5
   */
  Handlebars.registerHelper("parseAttrBonus", (val, tier) => {
    if (val == null) return 0;
    const str = String(val).trim();
    const t = Number(tier) || 1;
    const bt = Math.ceil(t / 2);

    // Match patterns like "+2(T)", "-1(bT)", "3(T)", etc.
    const tierMatch = str.match(/^([+-]?\d+)\s*\(T\)$/i);
    if (tierMatch) return Number(tierMatch[1]) * t;

    const baseTierMatch = str.match(/^([+-]?\d+)\s*\(bT\)$/i);
    if (baseTierMatch) return Number(baseTierMatch[1]) * bt;

    // Plain number
    return Number(str) || 0;
  });

  // -------------------------------------------------------
  // String helpers
  // -------------------------------------------------------

  /**
   * Concatenate any number of values into a single string.
   * The last argument is the Handlebars options hash, so we exclude it.
   * Usage: {{concat "prefix-" id "-suffix"}}
   */
  Handlebars.registerHelper("concat", (...args) => {
    // Remove the Handlebars options object (always last argument)
    args.pop();
    return args.join("");
  });

  /** Convert string to lower case: {{toLowerCase str}} */
  Handlebars.registerHelper("toLowerCase", (str) => {
    return str != null ? String(str).toLowerCase() : "";
  });

  /** Convert string to upper case: {{toUpperCase str}} */
  Handlebars.registerHelper("toUpperCase", (str) => {
    return str != null ? String(str).toUpperCase() : "";
  });

  /**
   * Truncate a string to a given length, appending "..." if truncated.
   * Usage: {{truncate description 80}}
   */
  Handlebars.registerHelper("truncate", (str, len) => {
    if (str == null) return "";
    const s = String(str);
    const maxLen = Number(len) || 50;
    return s.length > maxLen ? s.slice(0, maxLen) + "..." : s;
  });

  // -------------------------------------------------------
  // Utility helpers
  // -------------------------------------------------------

  /**
   * Calculate a percentage (0-100).
   * Usage: {{percentage currentHP maxHP}}
   */
  Handlebars.registerHelper("percentage", (value, max) => {
    const v = Number(value) || 0;
    const m = Number(max) || 1;
    return Math.round((v / m) * 100);
  });

  /**
   * Dump a value as JSON for debugging.
   * Usage: <pre>{{json someObject}}</pre>
   */
  Handlebars.registerHelper("json", (value) => {
    return JSON.stringify(value, null, 2);
  });

  /**
   * Check if an array includes a given value.
   * Usage: {{#if (includes myArray "someValue")}}
   */
  Handlebars.registerHelper("includes", (array, value) => {
    if (!Array.isArray(array)) return false;
    return array.includes(value);
  });

  /**
   * Block helper for equality comparison.
   * Usage: {{#ifEquals type "technique"}}...{{else}}...{{/ifEquals}}
   */
  Handlebars.registerHelper("ifEquals", function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  /**
   * Join an array with a separator string.
   * Usage: {{join skills ", "}}
   */
  Handlebars.registerHelper("join", (array, separator) => {
    if (!Array.isArray(array)) return "";
    const sep = typeof separator === "string" ? separator : ", ";
    return array.join(sep);
  });

  /**
   * Transformation aspect tooltip lookup.
   * Strips level suffix and parenthetical notes to match the base name.
   * Usage: {{aspectTooltip "Growth [LV3]"}} → "Set Size Category to Large..."
   */
  Handlebars.registerHelper("aspectTooltip", (aspectName) => {
    const aspects = CONFIG.DBU?.transformationAspects || {};
    const baseName = (aspectName || "")
      .replace(/\s*\[LV~?\d*\]/i, "")
      .replace(/\s*\([^)]*\)/g, "")
      .trim();
    return aspects[baseName] || "";
  });
}
