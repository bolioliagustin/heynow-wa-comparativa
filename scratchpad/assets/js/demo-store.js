/* ============================================================
   Heynow — Demo Store
   Persistencia sin backend para el playground: localStorage,
   exportar/importar JSON y compartir por URL (comprimida con
   CompressionStream cuando el navegador lo soporta, con fallback
   a texto plano en base64url).
   ============================================================ */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'heynow_demo_playground_v1';

  function readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }
  function writeAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  function makeId() {
    return 'demo_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function list() {
    return readAll()
      .map(function (d) { return { id: d.id, name: d.name, updatedAt: d.updatedAt || 0 }; })
      .sort(function (a, b) { return b.updatedAt - a.updatedAt; });
  }
  function get(id) {
    const found = readAll().find(function (d) { return d.id === id; });
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }
  function save(record) {
    const all = readAll();
    const id = record.id || makeId();
    const now = Date.now();
    const entry = { id: id, name: record.name || 'Sin título', demo: record.demo, updatedAt: now };
    const idx = all.findIndex(function (d) { return d.id === id; });
    if (idx >= 0) all[idx] = entry; else all.push(entry);
    writeAll(all);
    return entry;
  }
  function remove(id) {
    writeAll(readAll().filter(function (d) { return d.id !== id; }));
  }

  /* ---------------- Exportar / importar JSON ---------------- */
  function exportJSON(name, demo) {
    const payload = { name: name || 'demo', demo: demo };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = String(name || 'demo').trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function importJSON(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (parsed && parsed.demo) {
            resolve({ name: parsed.name || file.name.replace(/\.json$/i, ''), demo: parsed.demo });
          } else {
            resolve({ name: file.name.replace(/\.json$/i, ''), demo: parsed });
          }
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = function () { reject(new Error('No se pudo leer el archivo.')); };
      reader.readAsText(file);
    });
  }

  /* ---------------- Codificación para URL compartible ---------------- */
  function bytesToBase64Url(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function base64UrlToBytes(str) {
    let s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const binary = atob(s);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function encode(demo) {
    const json = JSON.stringify(demo);
    const utf8 = new TextEncoder().encode(json);
    let flag = 0;
    let payload = utf8;
    if ('CompressionStream' in global) {
      try {
        const cs = new CompressionStream('deflate');
        const stream = new Blob([utf8]).stream().pipeThrough(cs);
        const buf = await new Response(stream).arrayBuffer();
        payload = new Uint8Array(buf);
        flag = 1;
      } catch (e) {
        payload = utf8;
        flag = 0;
      }
    }
    const out = new Uint8Array(payload.length + 1);
    out[0] = flag;
    out.set(payload, 1);
    return bytesToBase64Url(out);
  }

  async function decode(str) {
    const bytes = base64UrlToBytes(str);
    const flag = bytes[0];
    const payload = bytes.slice(1);
    let jsonBytes = payload;
    if (flag === 1) {
      if (!('DecompressionStream' in global)) {
        throw new Error('Este link fue comprimido y tu navegador no soporta descomprimirlo.');
      }
      const ds = new DecompressionStream('deflate');
      const stream = new Blob([payload]).stream().pipeThrough(ds);
      const buf = await new Response(stream).arrayBuffer();
      jsonBytes = new Uint8Array(buf);
    }
    const json = new TextDecoder().decode(jsonBytes);
    return JSON.parse(json);
  }

  function readShareHash(hash) {
    const h = hash != null ? hash : global.location.hash;
    const m = /#d=([^&]+)/.exec(h || '');
    return m ? m[1] : null;
  }

  async function buildShareUrl(demo, baseUrl) {
    const encoded = await encode(demo);
    const base = baseUrl || (global.location.origin + global.location.pathname.replace(/[^/]*$/, '') + 'player.html');
    return base + '#d=' + encoded;
  }

  global.DemoStore = {
    list: list,
    get: get,
    save: save,
    remove: remove,
    exportJSON: exportJSON,
    importJSON: importJSON,
    encode: encode,
    decode: decode,
    readShareHash: readShareHash,
    buildShareUrl: buildShareUrl
  };
})(window);
