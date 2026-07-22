# WhatsApp Flows — Comparativa Demo

Demos interactivas de WhatsApp para Heynow.

## Demos

| Página | Qué muestra |
| --- | --- |
| `scratchpad/index.html` | Cascada vs Agente IA vs WhatsApp Flow (misma encuesta) |
| `scratchpad/flow-webchat.html` | Solo WhatsApp vs Flow + webchat (transaccional en WA, consultivo en canal web) |
| `scratchpad/builder.html` | Playground: creador de demos por columnas/bloques |
| `scratchpad/player.html` | Reproductor de una demo compartida por link (`#d=...`) |

## Playground (creador de demos)

`scratchpad/builder.html` permite armar demos comparativas (columnas de chat WhatsApp, WhatsApp Flow y handoff a un canal web) sin tocar código. No usa backend:

- Se guarda en el `localStorage` del navegador (botón **Guardar** / selector de demos guardadas).
- Se puede **exportar/importar** como archivo `.json`.
- Se puede **compartir por link**: el botón **Copiar link** (o **Abrir en player**) codifica la demo completa en la URL (`player.html#d=...`), donde corre con las mismas animaciones que las demos fijas.

El motor de animación (`assets/js/demo-engine.js`) y los estilos (`assets/css/demo.css`) son compartidos por `builder.html` y `player.html`.

## GitHub Pages

El sitio vive en `scratchpad/` y se publica con GitHub Actions (workflow `.github/workflows/pages.yml`).

### Publicar

1. Crea un repositorio vacío en GitHub.
2. Conecta el remoto y sube `main`:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

3. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Tras el workflow, la URL será:

`https://TU_USUARIO.github.io/TU_REPO/`

URLs de demos: `/`, `/flow-webchat.html`, `/builder.html` y `/player.html`.

### Local

Abre cualquiera de los HTML de `scratchpad/` en el navegador (o sirve la carpeta `scratchpad`).
