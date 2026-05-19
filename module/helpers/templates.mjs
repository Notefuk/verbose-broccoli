/**
 * Preload Handlebars templates used by the DBU-OLD system.
 * @returns {Promise}
 */
export async function preloadHandlebarsTemplates() {
  const templatePaths = [
    // Actor sheet and partials
    "systems/DBU-MRR-OLD/templates/actor/character-sheet.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-main.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-skills.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-traits.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-talents.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-techniques.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-transformations.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-auras.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-unique.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-equipment.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-attack-ref.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-progression.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-bio.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-combat.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-fusion.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-adversary.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-downtime.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-tf-customize.hbs",
    "systems/DBU-MRR-OLD/templates/actor/battle-jacket.hbs",
    "systems/DBU-MRR-OLD/templates/actor/parts/tab-battlejacket.hbs"
  ];

  return loadTemplates(templatePaths);
}
