# ARJE

Del griego *arjé*: principio, origen. El sistema personal de Alejo, módulo por módulo.

**Módulo 1 · Entreno**: rutina de 4 días en bloques de 4 semanas, registro de series con doble progresión, temporizador de descanso, récords, control cada dos semanas, pautas de comida con lista del súper y pausas activas para la oficina.

App web instalable (PWA) sin dependencias ni build: funciona sin señal y guarda los datos en el teléfono.

## Instalar en el iPhone

1. Abrí la dirección de GitHub Pages en Safari.
2. Compartir → **Agregar a pantalla de inicio**.

## Estructura

- `index.html`, `styles.css` — interfaz e identidad "Fuego"
- `data.js` — el programa: ejercicios, días, pausas, comida
- `logic.js` — reglas puras (semanas, fases, progresión, récords)
- `app.js` — pantallas y registro
- `sw.js` — caché para uso sin señal (subir `VERSION` en cada cambio)

Íconos: [Lucide](https://lucide.dev) (ISC). Tipografía: Barlow y Barlow Condensed (OFL).
