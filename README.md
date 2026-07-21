# WhatsApp Flows — Comparativa Demo

Demos interactivas de WhatsApp para Heynow.

## Demos

| Página | Qué muestra |
| --- | --- |
| `scratchpad/index.html` | Cascada vs Agente IA vs WhatsApp Flow (misma encuesta) |
| `scratchpad/flow-webchat.html` | Solo WhatsApp vs Flow + webchat (transaccional en WA, consultivo en canal web) |

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

URLs de demos: `/` y `/flow-webchat.html`.

### Local

Abre `scratchpad/index.html` o `scratchpad/flow-webchat.html` en el navegador (o sirve la carpeta `scratchpad`).
