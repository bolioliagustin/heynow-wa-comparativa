# AGENTS.md

## Cursor Cloud specific instructions

This repo is a static demo site plus a small optional Node tool. There are no lint or automated test suites.

### Main app — static demo site (`scratchpad/`)
- Pure client-side HTML/CSS/JS with no dependencies or build step. The entry point is `scratchpad/index.html` (`scratchpad/wa-comparativa.html` is an identical copy).
- Serve it as static files and open in a browser, e.g. `python3 -m http.server 8000` run from inside `scratchpad/`, then load `http://localhost:8000/index.html`. Click "Reproducir demo" to run the interactive WhatsApp comparison animation.
- Published to GitHub Pages via `.github/workflows/pages.yml`, which uploads the `scratchpad/` folder as-is.

### Optional tool — PPTX generator (`scratchpad/pptx/`)
- Node.js project (deps: `pptxgenjs`, `sharp`, `react*`). Build with `npm run build` (runs `gen_icons.js` then `build_deck.js`), which writes generated PNG icons and `comparativa-whatsapp.pptx` into the same folder. `npm run icons` / `npm run deck` run the steps individually.
- Generated artifacts (icons, `.pptx`) and `node_modules/` are gitignored.
