# WhatsApp Flows — Comparativa Demo

Demo interactiva de comparación WhatsApp (flujo / cascada / agente).

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

### Local

Abre `scratchpad/index.html` en el navegador (o sirve la carpeta `scratchpad`).
