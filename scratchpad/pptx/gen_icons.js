const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const path = require('path');
const { FaCommentDots, FaRobot, FaBolt } = require('react-icons/fa');

const SIZE = 320;
const ICON_SIZE = 150;
const RADIUS = 64;

// Paleta Heynow (Flow = naranja, color héroe)
const C = {
  cascada: '#2A4BF5', // azul
  agente: '#AF52E8',  // violeta
  flow: '#F15C2C',    // naranja
};
const SURFACE = '#151519';
const BORDER = '#212227';

// Icon-square estilo Heynow: cuadrado oscuro redondeado + glifo de color
async function makeIcon(IconComp, color, outName) {
  const iconSvg = ReactDOMServer.renderToStaticMarkup(React.createElement(IconComp));
  const viewBoxMatch = iconSvg.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 512 512';
  const inner = iconSvg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const offset = (SIZE - ICON_SIZE) / 2;
  const composite = `
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="${SIZE - 8}" height="${SIZE - 8}" rx="${RADIUS}" fill="${SURFACE}" stroke="${BORDER}" stroke-width="3"/>
      <svg x="${offset}" y="${offset}" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="${viewBox}" fill="${color}">${inner}</svg>
    </svg>`;
  const outPath = path.join(__dirname, outName);
  await sharp(Buffer.from(composite)).png().toFile(outPath);
  console.log('wrote', outPath);
}

// Isotipo Heynow (H) — fallback si no están los PNG oficiales en ../assets/brand
async function makeIso(color, outName) {
  const S = 480;
  const svg = `
    <svg width="${S}" height="${S}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="${color}">
      <rect x="31" y="30" width="13" height="16"/>
      <rect x="31" y="54" width="13" height="16"/>
      <rect x="56" y="30" width="13" height="16"/>
      <rect x="56" y="54" width="13" height="16"/>
      <rect x="44" y="46" width="12" height="8"/>
    </svg>`;
  const outPath = path.join(__dirname, outName);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log('wrote', outPath);
}

(async () => {
  await makeIcon(FaCommentDots, C.cascada, 'icon-cascada.png');
  await makeIcon(FaRobot, C.agente, 'icon-agente.png');
  await makeIcon(FaBolt, C.flow, 'icon-flow.png');
  await makeIso('#FFFFFF', 'logo-iso-white.png');
  await makeIso('#060606', 'logo-iso-black.png');
})();
