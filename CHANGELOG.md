# Changelog

## [1.0.2] - 2026-05-14

- Compatibilidad con Foundry VTT v13 declarada (`compatibility.verified` y
  `maximum` a `"13"`).
- Migración del bloque `gridDistance`/`gridUnits` al objeto `grid` (formato
  v12+).
- Retirados `primaryTokenAttribute` y `secondaryTokenAttribute` (deprecados
  desde v11). Las barras de token deben configurarse desde el TokenDocument.

> ⚠️ **Aviso**: esta versión solo declara compatibilidad a nivel manifest. El
> código de los sheets sigue usando las clases ApplicationV1 (`ActorSheet`,
> `ItemSheet`), que están deprecadas en v13. Si aparecen errores en consola
> al cargar el sistema en v13, abre una issue con el stack trace.

## [1.0.1] - 2026-05-14

- Renombrado público a **Dragon Universe RPG - Old System** (manteniendo el ID
  interno `DBU-MRR-OLD` por compatibilidad con instalaciones existentes).
- Aclaración de créditos y permisos: automatización realizada con permiso del
  equipo de [dbu-rpg.com](https://dbu-rpg.com/).
- README y descripción actualizados para reflejar la naturaleza fan-made,
  gratuita y no comercial del proyecto.

## [1.0.0] - 2026-05-14

- Primera release pública del sistema para Foundry VTT v12.
- Hojas de personaje y NPC.
- Battle Jacket y módulos.
- Automatización racial completa.
- Compendio inicial de Racial Traits.
- Localización en español.
