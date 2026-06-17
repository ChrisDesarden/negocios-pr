# NegociosPR

> ⚠️ **Project status (2026-06-17): On hold / discontinued.** During naming investigation we discovered [PR Local by JaydevsPR LLC](https://prlocal.app) — a near-identical bilingual directory already published on App Store + Google Play with the same vision (local businesses + tourism in PR's 78 municipios). Continuing under this name space would create app store conflicts, user confusion, and unfair competition with a project that has more resources. Repo is preserved as portfolio + future reference; all 3 open issues closed as wontfix. See `memory/2026-06-17.md` round 21 and `investigations/prlocal/REPORT.md` for the full story.

---

> Directorio interactivo de pequeños negocios locales en Puerto Rico. Bilingüe (español-PR / inglés), mobile-first, con mapa y filtros potentes.

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Status: on hold](https://img.shields.io/badge/status-on%20hold-lightgrey.svg)](#estado)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Bilingüe](https://img.shields.io/badge/i18n-es--PR%20%2F%20en-blue.svg)](./assets/i18n/)

## Qué es

NegociosPR es un directorio comunitario de pequeños negocios de Puerto Rico — restaurantes, chinchorros, cafeterías, ferreterías, talleres, hospedajes, y mucho más. Cualquier persona puede buscar, filtrar, y eventualmente someter un negocio para incluirlo.

El proyecto nace con la idea de que **los pequeños negocios de PR merecen tener presencia digital accesible** — no solo las cadenas y franquicias. Y de que la tecnología puede ser una herramienta de comunidad, no de extracción.

## Características

- 🌎 **Bilingüe** — Español de Puerto Rico e Inglés, con un toggle en el header
- 📱 **Mobile-first** — Diseñado primero para móvil, luego adaptado a desktop
- 🗺️ **Mapa interactivo** — Leaflet + OpenStreetMap, sin API key, sin tracking
- 🔍 **9 grupos de filtros** — categoría, municipio, precio, horario, pago, servicios, idiomas, accesibilidad, verificación
- ✍️ **Búsqueda libre** — por nombre, producto, pueblo, descripción, dueño
- 🌓 **Tema claro / oscuro / auto** — sigue tu sistema o tu preferencia
- 📲 **PWA instalable** — funciona como app en el celular
- ♿ **Accesible** — focus visible, ARIA labels, navegación por teclado
- 🪶 **Ligero** — vanilla HTML+CSS+JS, sin build step, sin frameworks

## Estado

**Proyecto en pausa / descontinuado (2026-06-17).** Ver el banner arriba para el contexto completo.

El frontend completo quedó listo (v0.2.0): 12 negocios de muestra (ficticios pero realistas, distribuidos por toda la isla), los 78 municipios cargados, 25 categorías, 9 grupos de filtros, mobile-first con topbar fijo + hero dismissable, bilingüe ES-PR/EN, tema claro/oscuro/auto, PWA-ready.

| Fase | Qué incluye | Estado |
|------|------------|--------|
| 1    | Frontend con datos mockup | ✅ Completa |
| 2    | Supabase: DB, Auth, Storage, RLS | ⏳ Pendiente |
| 3    | Conectar el formulario de sometimiento al backend | ⏳ Pendiente |
| 4    | Service worker, panel de moderación, SEO | ⏳ Pendiente |

## Para correrlo localmente

No hay build step. Solo necesitas Python (o cualquier servidor estático).

```bash
git clone https://github.com/TU_USUARIO/negocios-pr.git
cd negocios-pr
python3 -m http.server 8766 --bind 127.0.0.1
```

Abre <http://127.0.0.1:8766/> en el navegador.

Si no tienes Python, también funciona con:
- `npx serve`
- `php -S 127.0.0.1:8766`
- Cualquier servidor estático

## Stack técnico

- **Frontend:** HTML + CSS + JavaScript vanilla (sin frameworks, sin build step)
- **Mapa:** Leaflet 1.9.4 + tiles de OpenStreetMap (gratis, sin API key)
- **PWA:** `manifest.json` + service worker (Fase 4)
- **i18n:** Diccionarios JSON, sin librerías
- **Backend planeado:** Supabase (Postgres + Auth + Storage, free tier)
- **Geocoding planeado:** Nominatim (OpenStreetMap)

## Estructura

```
negocios-pr/
├── index.html                              # Shell de la SPA
├── manifest.json                           # PWA manifest
├── README.md                               # Este archivo
└── assets/
    ├── css/styles.css                      # Estilos (mobile-first, dark mode)
    ├── js/app.js                           # Lógica: i18n, filtros, mapa, routing
    ├── i18n/
    │   ├── es-PR.json                      # Español de Puerto Rico
    │   └── en.json                         # English
    └── data/
        ├── municipalities.json             # Los 78 municipios con coords
        └── sample-businesses.json          # 12 negocios de muestra
```

## Cómo contribuir

¡Las contribuciones son bienvenidas! Ya sea:

- 🐛 **Reportar un bug** — abre un [issue](./issues/new?template=bug_report.md)
- 💡 **Sugerir una mejora** — abre un [issue](./issues/new?template=feature_request.md)
- 📝 **Añadir/corregir datos** — usa el formulario en la app, o edita `assets/data/sample-businesses.json` directamente
- 💻 **Mejorar el código** — lee [`CONTRIBUTING.md`](CONTRIBUTING.md) y abre un PR

Por favor lee el [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) antes de participar.

## Licencia

[MIT](LICENSE) — Copyright © 2026 Chris Desarden.

Esto significa que puedes usar, modificar, y redistribuir el código libremente, siempre y cuando mantengas el copyright notice. Es la licencia más permisiva de open source.

## Créditos

- **Mapa:** Tiles de [OpenStreetMap](https://www.openstreetmap.org/) contributors
- **Librería de mapa:** [Leaflet](https://leafletjs.com/) (BSD-2-Clause)
- **Inspiración de diseño:** Apple Human Interface Guidelines
- **Comunidades de PR:** por hacer de esta isla un lugar único

## Roadmap

A corto plazo:
- [ ] Backend con Supabase (Fase 2)
- [ ] Geocoding automático vía Nominatim al someter un negocio
- [ ] Verificación de dueños vía magic link email
- [ ] Panel de moderación para verificar listings
- [ ] Filtro de radio de búsqueda (cercanía)
- [ ] Modo offline (service worker)

A mediano plazo:
- [ ] Comentarios y ratings de usuarios
- [ ] Integración con Google Maps / Apple Maps para direcciones
- [ ] Exportar a CSV/JSON para periodistas e investigadores
- [ ] API pública para investigadores y developers
- [ ] Versión standalone instalable (TWA / iOS app shell)

---

¿Encontraste un bug de seguridad? **No abras un issue público.** Sigue [`SECURITY.md`](SECURITY.md).
