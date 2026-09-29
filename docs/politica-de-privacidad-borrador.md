# Política de tratamiento de datos personales — BORRADOR

> **No publicar tal cual.** Este borrador describe lo que el código hace hoy (tabla `consultas` en D1, Cloudflare Turnstile, Umami). Los campos `[COMPLETAR]` los define el responsable del sitio y todo el texto debe pasar por revisión legal (Ley 1581 de 2012 y Decreto 1377 de 2013) antes de publicarse.

## Qué guardamos hoy (según `src/lib/d1.ts`)

Por cada consulta se guarda o actualiza un registro por tipo y número de documento:

| Dato | Origen |
|---|---|
| Tipo y número de documento | Lo escribe el usuario |
| Nombre, sexo, edad | Respuesta del servicio del DNP |
| Municipio y departamento | Respuesta del servicio del DNP |
| Grupo/subgrupo del RUI | Respuesta del servicio del DNP |
| Número de consultas y fecha de la última | Generado por el sitio |

Además: Cloudflare Turnstile (verificación anti-bots) y Umami en `analytics.col0.com` (analítica de visitas).

## Decisiones que hay que tomar antes de publicar

1. **¿Hace falta guardar nombre, sexo, edad y ubicación?** Si la finalidad es solo estadística, se puede reducir a grupo y departamento, o dejar de guardar el número de documento. Guardar menos es la forma más sencilla de cumplir.
2. **Finalidad real del almacenamiento** (estadísticas, mejora del servicio, otra).
3. **Autorización previa:** el aviso junto al botón debe existir antes de la consulta, no después.
4. **Plazo de conservación** y forma de solicitar la supresión.

---

## Texto propuesto para la página `/politica-de-privacidad`

### 1. Quiénes somos
Consulta RUI es un sitio informativo independiente. No es un portal oficial del Gobierno de Colombia ni está afiliado al DNP. Responsable del tratamiento: **[COMPLETAR: razón social / nombre, NIT o documento]**. Contacto: **[COMPLETAR: correo]**.

### 2. Qué datos tratamos
Cuando consultas tu clasificación, enviamos tu tipo y número de documento al servicio del DNP y mostramos el resultado. Guardamos **[COMPLETAR según la decisión 1: tipo y número de documento, nombre, sexo, edad, municipio, departamento, grupo del RUI, número de consultas y fecha de la última]**.

También usamos Cloudflare Turnstile para verificar que eres una persona, y una herramienta de analítica de visitas (Umami) que **[COMPLETAR: confirmar si usa cookies o datos personales]**.

### 3. Para qué los usamos
**[COMPLETAR: finalidad concreta]**. No vendemos tus datos ni los usamos para ofrecerte productos de terceros **[confirmar antes de publicar]**.

### 4. Tus derechos
Puedes conocer, actualizar, rectificar y solicitar la supresión de tus datos, y revocar la autorización, escribiendo a **[COMPLETAR: correo]**. Responderemos en los plazos que fija la ley **[COMPLETAR: plazos]**.

### 5. Cuánto tiempo los conservamos
**[COMPLETAR: plazo]**.

### 6. Seguridad
La conexión con el sitio es cifrada (HTTPS). Los datos se guardan en Cloudflare D1 con acceso restringido **[confirmar]**.

### 7. Cambios
Publicaremos aquí cualquier cambio. Última actualización: **[COMPLETAR: fecha]**.

---

## Aviso corto junto al botón «Consultar RUI»

> Al consultar aceptas el tratamiento de tus datos según nuestra [política de privacidad](/politica-de-privacidad).

Se enlaza a la política y no se marca por defecto ninguna casilla; si el equipo legal exige consentimiento explícito, se cambia a casilla obligatoria.
