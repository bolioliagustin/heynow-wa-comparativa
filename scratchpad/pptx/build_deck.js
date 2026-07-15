const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

/* ============================================================
   Deck "Cascada vs Agente IA vs WhatsApp Flow" — estilo Heynow
   Dark editorial: fondo casi negro, Arbeit Pro, titulares con
   punto, acentos naranja/azul/violeta + barra tricolor.
   ============================================================ */

const P = {
  bg: '0A0A0B',        // fondo casi negro (todas las slides)
  surface: '0F0F12',   // tarjetas
  surface2: '151519',  // icon squares / detalles
  border: '212227',
  text: 'FFFFFF',
  muted: 'A2A6AD',
  faint: '6B6F76',
  orange: 'F15C2C',
  blue: '2A4BF5',
  violet: 'AF52E8',
  // Mapeo por canal (Flow = naranja, color héroe)
  cascada: '2A4BF5',
  agente: 'AF52E8',
  flow: 'F15C2C',
};
const F_HEAD = 'Arbeit Pro';
const F_BODY = 'Arbeit Pro';

const ICON = {
  cascada: path.join(__dirname, 'icon-cascada.png'),
  agente: path.join(__dirname, 'icon-agente.png'),
  flow: path.join(__dirname, 'icon-flow.png'),
};
// Logos oficiales (en ../assets/brand); fallback a los generados por gen_icons.js
const BRAND_DIR = path.join(__dirname, '..', 'assets', 'brand');
const ISO_OFFICIAL = path.join(BRAND_DIR, 'heynow-iso.png');
const WORDMARK_OFFICIAL = path.join(BRAND_DIR, 'heynow-wordmark.png');
const ISO_GEN = path.join(__dirname, 'logo-iso-white.png');
function hasImg(p) { return fs.existsSync(p); }
function isoPath() { return hasImg(ISO_OFFICIAL) ? ISO_OFFICIAL : (hasImg(ISO_GEN) ? ISO_GEN : null); }

function newPres() {
  const p = new pptxgen();
  p.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
  p.layout = 'WIDE';
  return p;
}

// Barra de acento tricolor (naranja -> azul -> violeta)
function accentBar(slide, y) {
  const segW = 13.333 / 3;
  [P.orange, P.blue, P.violet].forEach((c, i) => {
    slide.addShape('rect', { x: i * segW, y, w: segW, h: 0.06, fill: { color: c }, line: { type: 'none' } });
  });
}

// Lockup de marca: isotipo oficial + "Heynow"
function brandLockup(slide, x, y) {
  const iso = isoPath();
  if (iso) slide.addImage({ path: iso, x, y, w: 0.44, h: 0.44 });
  slide.addText('Heynow', {
    x: x + (iso ? 0.52 : 0), y: y - 0.05, w: 2.6, h: 0.54, fontFace: F_HEAD, fontSize: 23, bold: true,
    color: P.text, margin: 0, valign: 'middle',
  });
}

// Pie de marca discreto (slides internas)
function footerBrand(slide) {
  const iso = isoPath();
  if (iso) slide.addImage({ path: iso, x: 12.42, y: 7.0, w: 0.26, h: 0.26 });
  slide.addText('Heynow', {
    x: 11.1, y: 6.98, w: 1.24, h: 0.32, fontFace: F_HEAD, fontSize: 11, bold: true,
    color: P.muted, align: 'right', valign: 'middle', margin: 0,
  });
}

// Eyebrow (uppercase tracked)
function eyebrow(slide, text, x, y, color) {
  slide.addText(text, {
    x, y, w: 9, h: 0.34, fontFace: F_BODY, fontSize: 11.5, bold: true,
    color: color || P.orange, charSpacing: 3, margin: 0,
  });
}

// Badge pill (borde + texto de color)
function pill(slide, x, y, w, text, color) {
  slide.addShape('roundRect', { x, y, w, h: 0.34, rectRadius: 0.17, fill: { type: 'none' }, line: { color, width: 1 } });
  slide.addText(text.toUpperCase(), {
    x, y: y - 0.01, w, h: 0.36, fontFace: F_BODY, fontSize: 9.5, bold: true, charSpacing: 2,
    color, align: 'center', valign: 'middle', margin: 0,
  });
}

// Legend inline
function legendRow(slide, y) {
  const items = [
    { label: 'Bot en cascada', color: P.cascada },
    { label: 'Agente IA', color: P.agente },
    { label: 'WhatsApp Flow', color: P.flow },
  ];
  let x = 0.72;
  items.forEach((it) => {
    slide.addShape('rect', { x, y, w: 0.14, h: 0.14, fill: { color: it.color }, line: { type: 'none' } });
    slide.addText(it.label, {
      x: x + 0.24, y: y - 0.1, w: 2.1, h: 0.34, fontFace: F_BODY, fontSize: 11.5,
      color: P.muted, margin: 0, valign: 'middle',
    });
    x += 2.4;
  });
}

const pres = newPres();

/* ---------- Slide 1 : Portada ---------- */
{
  const s = pres.addSlide();
  s.background = { color: P.bg };
  brandLockup(s, 0.72, 0.62);
  eyebrow(s, 'DEMO · WHATSAPP FLOWS', 0.72, 2.35, P.orange);
  s.addText('Cascada vs Agente IA\nvs WhatsApp Flow.', {
    x: 0.68, y: 2.75, w: 11.8, h: 2.0, fontFace: F_HEAD, fontSize: 46, bold: true,
    color: P.text, margin: 0, valign: 'top', charSpacing: -0.5, lineSpacing: 48,
  });
  s.addText('Misma encuesta de satisfacción, tres formas de resolverla por chat — y una diferencia muy concreta en cuántos mensajes manda la empresa.', {
    x: 0.72, y: 4.95, w: 9.0, h: 0.9, fontFace: F_BODY, fontSize: 15.5, color: P.muted, margin: 0, lineSpacing: 22,
  });
  legendRow(s, 6.4);
  s.addText('Hotel Vista Mar', {
    x: 9.9, y: 6.9, w: 2.7, h: 0.35, fontFace: F_BODY, fontSize: 11, color: P.faint, align: 'right', margin: 0,
  });
  accentBar(s, 7.44);
}

/* ---------- Slide 2 : La encuesta ---------- */
{
  const s = pres.addSlide();
  s.background = { color: P.bg };
  eyebrow(s, 'LA ENCUESTA', 0.72, 0.55, P.muted);
  s.addText('La misma encuesta para los tres canales.', {
    x: 0.7, y: 0.9, w: 11.8, h: 0.7, fontFace: F_HEAD, fontSize: 28, bold: true, color: P.text, margin: 0, charSpacing: -0.3,
  });
  s.addText('6 preguntas post-estadía, pensadas para medir satisfacción y NPS.', {
    x: 0.72, y: 1.55, w: 10.5, h: 0.4, fontFace: F_BODY, fontSize: 14, color: P.muted, margin: 0,
  });

  const qs = [
    ['1', 'Satisfacción con el check-in', 'Escala de 5 puntos'],
    ['2', 'Atención del personal', 'Escala de 5 puntos'],
    ['3', 'Servicios utilizados', 'Selección múltiple (10 opciones)'],
    ['4', 'Satisfacción con esos servicios', 'Escala de 5 puntos'],
    ['5', 'Probabilidad de recomendar (NPS)', 'Escala de 0 a 10'],
    ['6', 'Comentario abierto', 'Respuesta libre'],
  ];
  const colW = 5.55, rowH = 1.34, gx = 0.72, gy = 2.25, gapX = 0.5, gapY = 0.24;
  qs.forEach((q, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (colW + gapX);
    const y = gy + row * (rowH + gapY);
    s.addShape('roundRect', {
      x, y, w: colW, h: rowH, rectRadius: 0.1, fill: { color: P.surface }, line: { color: P.border, width: 1 },
    });
    s.addShape('roundRect', {
      x: x + 0.24, y: y + rowH / 2 - 0.28, w: 0.56, h: 0.56, rectRadius: 0.12, fill: { color: P.surface2 }, line: { color: P.border, width: 1 },
    });
    s.addText(q[0], {
      x: x + 0.24, y: y + rowH / 2 - 0.28, w: 0.56, h: 0.56, fontFace: F_HEAD, fontSize: 17, bold: true,
      color: P.orange, align: 'center', valign: 'middle', margin: 0,
    });
    s.addText(q[1], {
      x: x + 1.0, y: y + 0.2, w: colW - 1.2, h: 0.5, fontFace: F_BODY, fontSize: 13.5, bold: true,
      color: P.text, margin: 0, valign: 'top',
    });
    s.addText(q[2], {
      x: x + 1.0, y: y + 0.72, w: colW - 1.2, h: 0.5, fontFace: F_BODY, fontSize: 11.5,
      color: P.muted, margin: 0, valign: 'top',
    });
  });
  footerBrand(s);
}

/* ---------- Slide 3 : Big stats (6 / 6 / 1) ---------- */
{
  const s = pres.addSlide();
  s.background = { color: P.bg };
  eyebrow(s, 'RESULTADOS', 0.72, 0.55, P.muted);
  s.addText('¿Cuántos mensajes manda la empresa?', {
    x: 0.7, y: 0.9, w: 11.8, h: 0.7, fontFace: F_HEAD, fontSize: 28, bold: true, color: P.text, margin: 0, charSpacing: -0.3,
  });

  const cols = [
    { icon: ICON.cascada, color: P.cascada, num: '6', unit: 'mensajes', label: 'Bot en cascada', caption: 'Un mensaje por pregunta, sin vuelta atrás' },
    { icon: ICON.agente, color: P.agente, num: '6', unit: 'mensajes', label: 'Agente IA', caption: 'Conversación más natural, mismo vaivén' },
    { icon: ICON.flow, color: P.flow, num: '1', unit: 'mensaje', label: 'WhatsApp Flow', caption: 'Formulario nativo, todo en una pantalla' },
  ];
  const w = 3.7, gap = 0.42, startX = (13.333 - (w * 3 + gap * 2)) / 2, y0 = 2.0, h = 4.5;
  cols.forEach((c, i) => {
    const x = startX + i * (w + gap);
    s.addShape('roundRect', {
      x, y: y0, w, h, rectRadius: 0.12, fill: { color: P.surface }, line: { color: P.border, width: 1 },
    });
    // línea de acento superior
    s.addShape('rect', { x: x + 0.3, y: y0, w: w - 0.6, h: 0.045, fill: { color: c.color }, line: { type: 'none' } });
    if (hasImg(c.icon)) s.addImage({ path: c.icon, x: x + 0.34, y: y0 + 0.38, w: 0.66, h: 0.66 });
    s.addText(c.num, {
      x, y: y0 + 1.2, w, h: 1.5, fontFace: F_HEAD, fontSize: 88, bold: true, color: c.color,
      align: 'center', margin: 0, charSpacing: -2,
    });
    s.addText(c.unit, {
      x, y: y0 + 2.72, w, h: 0.4, fontFace: F_BODY, fontSize: 13, color: P.muted, align: 'center', margin: 0,
    });
    pill(s, x + w / 2 - 1.0, y0 + 3.3, 2.0, c.label, c.color);
    s.addText(c.caption, {
      x: x + 0.35, y: y0 + 3.78, w: w - 0.7, h: 0.6, fontFace: F_BODY, fontSize: 11.5,
      color: P.muted, align: 'center', margin: 0, lineSpacing: 15,
    });
  });
  footerBrand(s);
}

/* ---------- Slide 4 : Mockup del lado del huésped ---------- */
{
  const s = pres.addSlide();
  s.background = { color: P.bg };
  eyebrow(s, 'DEL LADO DEL HUÉSPED', 0.72, 0.5, P.muted);
  s.addText('Un hilo largo, o una sola pantalla.', {
    x: 0.7, y: 0.85, w: 11.8, h: 0.6, fontFace: F_HEAD, fontSize: 28, bold: true, color: P.text, margin: 0, charSpacing: -0.3,
  });
  s.addText('Cascada y Agente IA abren una ida y vuelta pregunta por pregunta. Flow abre un formulario y listo.', {
    x: 0.72, y: 1.48, w: 11, h: 0.4, fontFace: F_BODY, fontSize: 13.5, color: P.muted, margin: 0,
  });

  const colW = 3.7, gap = 0.42, startX = (13.333 - (colW * 3 + gap * 2)) / 2, topY = 2.15, bottomY = 6.85;

  function bubbleThread(x, color, seedTexts) {
    let y = topY;
    const bw = colW - 0.5;
    seedTexts.forEach((row) => {
      s.addShape('roundRect', { x: x + 0.25, y, w: bw * 0.84, h: 0.5, rectRadius: 0.08, fill: { color: P.surface2 }, line: { color: P.border, width: 0.5 } });
      s.addText(row[0], { x: x + 0.37, y, w: bw * 0.84 - 0.24, h: 0.5, fontFace: F_BODY, fontSize: 9.5, color: P.text, valign: 'middle', margin: 0 });
      y += 0.58;
      const uw = bw * 0.4;
      s.addShape('roundRect', { x: x + colW - 0.25 - uw, y, w: uw, h: 0.4, rectRadius: 0.08, fill: { color }, line: { type: 'none' } });
      s.addText(row[1], { x: x + colW - 0.25 - uw, y, w: uw, h: 0.4, fontFace: F_BODY, fontSize: 9.5, color: 'FFFFFF', bold: true, align: 'center', valign: 'middle', margin: 0 });
      y += 0.5;
    });
    s.addText('+ 2 preguntas más así ⋯', { x: x + 0.25, y: y + 0.02, w: bw * 0.84, h: 0.35, fontFace: F_BODY, fontSize: 10.5, italic: true, color: P.faint, margin: 0 });
  }

  const cascadaRows = [
    ['¿Satisfacción con el check-in?', '4'],
    ['¿Atención del personal?', '5'],
    ['¿Qué servicios usaste?', '1, 3, 7'],
    ['¿Conforme con los servicios?', '4'],
  ];
  const agenteRows = [
    ['¿Qué tal el check-in?', 'Perfecto'],
    ['¿Y la atención?', 'Excelente'],
    ['¿Qué servicios usaste?', 'Desayuno…'],
    ['¿Conforme con eso?', 'Muy conforme'],
  ];

  bubbleThread(startX, P.cascada, cascadaRows);
  bubbleThread(startX + colW + gap, P.agente, agenteRows);

  [
    { x: startX, label: 'Bot en cascada', color: P.cascada },
    { x: startX + colW + gap, label: 'Agente IA', color: P.agente },
    { x: startX + (colW + gap) * 2, label: 'WhatsApp Flow', color: P.flow },
  ].forEach((c) => {
    s.addShape('rect', { x: c.x + 0.25, y: bottomY, w: 0.13, h: 0.13, fill: { color: c.color }, line: { type: 'none' } });
    s.addText(c.label, { x: c.x + 0.44, y: bottomY - 0.1, w: colW - 0.6, h: 0.33, fontFace: F_BODY, fontSize: 12, bold: true, color: P.text, margin: 0, valign: 'middle' });
  });

  // Flow: 1 mensaje + formulario
  const fx = startX + (colW + gap) * 2;
  s.addShape('roundRect', { x: fx + 0.25, y: topY, w: colW - 0.5, h: 0.62, rectRadius: 0.08, fill: { color: P.surface2 }, line: { color: P.border, width: 0.5 } });
  s.addText('¡Hola! Completá la encuesta acá 👇', { x: fx + 0.37, y: topY, w: colW - 0.74, h: 0.62, fontFace: F_BODY, fontSize: 9.5, color: P.text, valign: 'middle', margin: 0 });
  s.addShape('roundRect', {
    x: fx + 0.25, y: topY + 0.78, w: colW - 0.5, h: 3.95, rectRadius: 0.1,
    fill: { color: P.surface }, line: { color: P.flow, width: 1 },
    shadow: { type: 'outer', color: P.flow, opacity: 0.25, blur: 10, offset: 0, angle: 90 },
  });
  s.addText('📋 Encuesta de satisfacción', { x: fx + 0.4, y: topY + 0.92, w: colW - 0.8, h: 0.34, fontFace: F_BODY, fontSize: 10.5, bold: true, color: P.flow, margin: 0 });
  const fRows = ['Check-in ★★★★★', 'Atención ★★★★★', 'Servicios ☑ Restaurante ☑ Piscina', 'Conformidad ★★★★☆', 'Recomendación 9/10', 'Comentario: "Todo excelente…"'];
  let fy = topY + 1.4;
  fRows.forEach((r) => { s.addText(r, { x: fx + 0.4, y: fy, w: colW - 0.8, h: 0.34, fontFace: F_BODY, fontSize: 9.5, color: P.muted, margin: 0 }); fy += 0.38; });
  s.addShape('roundRect', { x: fx + 0.4, y: fy + 0.04, w: colW - 0.8, h: 0.42, rectRadius: 0.09, fill: { color: P.flow }, line: { type: 'none' } });
  s.addText('Enviar respuestas', { x: fx + 0.4, y: fy + 0.04, w: colW - 0.8, h: 0.42, fontFace: F_BODY, fontSize: 10.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0 });
  footerBrand(s);
}

/* ---------- Slide 5 : Comparativa (tabla) ---------- */
{
  const s = pres.addSlide();
  s.background = { color: P.bg };
  eyebrow(s, 'COMPARATIVA', 0.72, 0.55, P.muted);
  s.addText('Los números, lado a lado.', {
    x: 0.7, y: 0.9, w: 11.8, h: 0.7, fontFace: F_HEAD, fontSize: 28, bold: true, color: P.text, margin: 0, charSpacing: -0.3,
  });

  const hFill = P.surface2;
  const rows = [
    [
      { text: '', options: { fill: hFill } },
      { text: 'Bot en cascada', options: { color: P.cascada, bold: true, fill: hFill } },
      { text: 'Agente IA', options: { color: P.agente, bold: true, fill: hFill } },
      { text: 'WhatsApp Flow', options: { color: P.flow, bold: true, fill: hFill } },
    ],
    [
      { text: 'Mensajes salientes', options: { color: P.muted, bold: true } },
      { text: '6', options: { color: P.cascada, bold: true, fontSize: 22 } },
      { text: '6', options: { color: P.agente, bold: true, fontSize: 22 } },
      { text: '1', options: { color: P.flow, bold: true, fontSize: 22 } },
    ],
    [
      { text: 'Formato de respuesta', options: { color: P.muted, bold: true } },
      { text: 'Texto libre, una pregunta a la vez' },
      { text: 'Texto libre, una pregunta a la vez' },
      { text: 'Formulario nativo en una pantalla' },
    ],
    [
      { text: 'Revisión antes de enviar', options: { color: P.muted, bold: true } },
      { text: 'No — ya quedó enviada' },
      { text: 'No — ya quedó enviada' },
      { text: 'Sí — edita todo antes de enviar' },
    ],
    [
      { text: 'Riesgo de abandono', options: { color: P.muted, bold: true } },
      { text: 'Alto — 6 idas y vueltas' },
      { text: 'Alto — 6 idas y vueltas' },
      { text: 'Bajo — 1 sola pantalla' },
    ],
  ];

  s.addTable(rows, {
    x: 0.72, y: 1.75, w: 11.9, h: 4.8,
    fontFace: F_BODY, fontSize: 12.5, color: P.text,
    border: { type: 'solid', color: P.border, pt: 1 },
    fill: { color: P.surface },
    autoPage: false,
    colW: [2.9, 3.0, 3.0, 3.0],
    rowH: [0.55, 0.95, 1.1, 1.1, 1.1],
    valign: 'middle',
    margin: [0.08, 0.14, 0.08, 0.14],
  });
  footerBrand(s);
}

/* ---------- Slide 6 : Cierre ---------- */
{
  const s = pres.addSlide();
  s.background = { color: P.bg };
  brandLockup(s, 0.72, 0.62);
  s.addText('Menos mensajes.\nMenos fricción.\nMás respuestas completas.', {
    x: 0.7, y: 2.2, w: 11.0, h: 2.7, fontFace: F_HEAD, fontSize: 38, bold: true,
    color: P.text, margin: 0, lineSpacing: 46, charSpacing: -0.5,
  });
  s.addText('WhatsApp Flow resuelve la misma encuesta de satisfacción con un solo mensaje de la empresa, en una sola pantalla para el huésped.', {
    x: 0.72, y: 5.0, w: 9.0, h: 0.9, fontFace: F_BODY, fontSize: 15, color: P.muted, margin: 0, lineSpacing: 21,
  });
  legendRow(s, 6.4);
  s.addText('Hotel Vista Mar', {
    x: 9.9, y: 6.9, w: 2.7, h: 0.35, fontFace: F_BODY, fontSize: 11, color: P.faint, align: 'right', margin: 0,
  });
  accentBar(s, 7.44);
}

pres.writeFile({ fileName: path.join(__dirname, 'comparativa-whatsapp.pptx') }).then(() => {
  console.log('done: comparativa-whatsapp.pptx');
});
