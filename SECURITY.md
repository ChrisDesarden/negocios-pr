# Seguridad

Si descubres una vulnerabilidad de seguridad en NegociosPR, **por favor no la reportes como Issue público**. Las issues públicas son visibles para todo el mundo, y un atacante podría explotar la vulnerabilidad antes de que se publique un fix.

## Cómo reportar

Envía un reporte privado al maintainer del proyecto. Incluye:

- **Descripción de la vulnerabilidad** y su impacto potencial
- **Pasos para reproducirla** (o un proof-of-concept si aplica)
- **Versión afectada** (commit hash, tag, o "main" si es la última versión)
- **Tu nombre/handle** si quieres ser acreditado en el fix (opcional)

## Qué esperar

- **Acuse de recibo** dentro de 72 horas
- **Evaluación inicial** dentro de 7 días
- **Fix o mitigación** dependiendo de la severidad:
  - Crítica: parche inmediato
  - Alta: fix en la próxima release
  - Media/Baja: agregado al backlog

## Divulgación responsable

Pedimos que nos des tiempo razonable para investigar y arreglar el problema antes de divulgarlo públicamente. Una vez publicado el fix, agradecemos la divulgación coordinada con crédito al reportero.

## Alcance

Por el momento, las vulnerabilidades más relevantes serían:

- **XSS** en formularios de submissión o búsqueda
- **Inyección de contenido** vía URLs manipuladas
- **Bypass de verificación** de dueños de negocios
- **Exposición de datos** sensibles (cuando integremos Supabase)
- **CSRF** en endpoints de mutación

Una vez que integremos Supabase en Fase 2, el alcance se ampliará a:
- Row Level Security (RLS) gaps
- Permisos del Storage bucket
- Manejo de tokens de autenticación

## Agradecimientos

Gracias por ayudar a mantener NegociosPR seguro para la comunidad de pequeños negocios de Puerto Rico. 🍰
