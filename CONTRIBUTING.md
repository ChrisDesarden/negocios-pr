# Contribuir a NegociosPR

¡Gracias por tu interés en hacer NegociosPR mejor! Este documento te guía paso a paso para contribuir, ya sea reportando un error, sugiriendo una mejora, o añadiendo código/datos.

## Código de Conducta

Este proyecto sigue el [Contributor Covenant](CODE_OF_CONDUCT.md). Al participar, te comprometes a respetarlo.

## ¿Cómo puedo contribuir?

### 1. Reportar errores o sugerir mejoras

Abre un [Issue](./issues/new) usando la plantilla correspondiente. Incluye:
- Pasos para reproducir (si es un bug)
- Comportamiento esperado vs. observado
- Capturas de pantalla si aplica
- Navegador y dispositivo (móvil, desktop, OS)

### 2. Añadir o corregir datos de negocios

**Esta es la forma más valiosa de contribuir al proyecto.**

Usa el formulario "Someter negocio" en la app, o abre un PR editando `assets/data/sample-businesses.json` directamente. Reglas:
- **Verifica antes de añadir.** Confirma que el negocio existe, que la dirección es correcta, y que los horarios están actualizados.
- **No inventes datos.** Si no estás seguro de algo, déjalo vacío o pon `null`.
- **Respeta a los dueños.** No incluyas teléfonos personales, emails privados, o información que el dueño no publica.
- **Una entrada por PR** si es posible, para que las revisiones sean más fáciles.

Estructura de cada entrada (ver ejemplos en `sample-businesses.json`):
```json
{
  "id": "slug-unico-en-kebab-case",
  "name": "Nombre del Negocio",
  "category": "restaurant",
  "municipality": "San Juan",
  "address": "123 Calle Principal",
  "phone": "+1-787-555-0100",
  "hours": { "mon": "8:00-18:00", "tue": "8:00-18:00", ... },
  "verified": false
}
```

### 3. Mejorar el código

#### Setup local

```bash
git clone https://github.com/TU_USUARIO/negocios-pr.git
cd negocios-pr
# Servir localmente
python3 -m http.server 8766 --bind 127.0.0.1
# Abre http://127.0.0.1:8766/
```

No hay build step. No hay `node_modules`. Es HTML+CSS+JS vanilla, abres los archivos y los editas. Refresca el navegador y ves los cambios.

#### Convenciones de código

- **HTML:** indentación con 2 espacios, atributos en minúscula, siempre con comillas dobles.
- **CSS:** variables en `:root` para colores, espacios, radios. Nombres de clase en kebab-case. Mobile-first (escribe el CSS base para móvil, luego media queries para desktop).
- **JS:** vanilla, sin frameworks. Funciones pequeñas, comentarios en español para explicar "por qué", código y nombres en inglés cuando sea posible.
- **Commits:** en español, primera línea de máximo 72 caracteres, modo imperativo ("añade filtro de municipio", no "añadido filtro de municipio").
- **No commits gigantes.** Si tu cambio es grande, divídelo en commits lógicos.

#### Pull Requests

1. **Fork** el repo (botón "Fork" arriba a la derecha)
2. **Crea una rama** descriptiva:
   ```bash
   git checkout -b feature/filtro-de-radio
   git checkout -b fix/scrollbar-en-firefox
   ```
3. **Haz commits pequeños y descriptivos**
4. **Push a tu fork:**
   ```bash
   git push origin feature/filtro-de-radio
   ```
5. **Abre un PR** usando la plantilla. Describe:
   - Qué cambia y por qué
   - Cómo lo probaste (navegador, dispositivo, capturas)
   - Si resuelve un Issue existente, linkéalo (`Fixes #42`)
6. **Espera revisión.** El maintainer puede pedirte cambios. No te preocupes, es parte del proceso.

## Configuración recomendada del editor

- **EditorConfig** (`.editorconfig` ya está en el repo) — indentación y EOL consistentes
- **Lenguaje:** `en` para code/commits, `es-PR` para UI strings (vía los archivos `assets/i18n/`)

## Estructura del proyecto

```
negocios-pr/
├── index.html              # Shell de la SPA
├── manifest.json           # PWA manifest
├── LICENSE                 # MIT
├── README.md               # Documentación principal
├── CONTRIBUTING.md         # Este archivo
├── CODE_OF_CONDUCT.md      # Estándar de comunidad
├── SECURITY.md             # Reporte de vulnerabilidades
├── .editorconfig           # Estilo de código
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
└── assets/
    ├── css/styles.css
    ├── js/app.js
    ├── i18n/
    │   ├── es-PR.json
    │   └── en.json
    └── data/
        ├── municipalities.json
        └── sample-businesses.json
```

## Reporte de vulnerabilidades de seguridad

Si encuentras un bug de seguridad, **no abras un Issue público**. Sigue las instrucciones de [SECURITY.md](SECURITY.md) para reportarlo de forma privada.

## Licencia

Al contribuir, aceptas que tu código se publique bajo la misma [MIT License](LICENSE) del proyecto.
