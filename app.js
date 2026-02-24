const logEl = document.getElementById('log');
const outputEl = document.getElementById('output');
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const downloadLink = document.getElementById('downloadLink');

const URL_ATTRS = ['mask', 'clip-path', 'filter', 'fill', 'stroke'];
const SERVICE_ATTRS = new Set([
  'data-name', 'data-index', 'data-svgator', 'project-id', 'export-id', 'cached',
  'data-cached', 'data-uid', 'data-version', 'data-type', 'data-svgator-export'
]);

function setLog(text) {
  logEl.textContent = text;
}

function parseXml(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('SVG parse error: ' + parserError.textContent.trim());
  }
  return doc;
}

function extractPossibleJsonObjects(text) {
  const out = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '{') continue;
    let depth = 0;
    let inString = false;
    let quote = '';
    let escaped = false;
    for (let j = i; j < text.length; j += 1) {
      const ch = text[j];
      if (inString) {
        if (!escaped && ch === quote) inString = false;
        escaped = !escaped && ch === '\\';
        continue;
      }
      if (ch === '"' || ch === "'") {
        inString = true;
        quote = ch;
      } else if (ch === '{') {
        depth += 1;
      } else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          out.push(text.slice(i, j + 1));
          break;
        }
      }
    }
  }
  return out;
}

function parseAnimationConfig(doc) {
  const scripts = [...doc.querySelectorAll('script')];
  const scriptTexts = scripts.map((s) => s.textContent || '');

  const candidates = [];
  for (const src of scriptTexts) {
    const objects = extractPossibleJsonObjects(src);
    for (const raw of objects) {
      const normalized = raw.replace(/'/g, '"');
      try {
        const parsed = JSON.parse(normalized);
        candidates.push(parsed);
      } catch {
        // skip non-JSON object literals
      }
    }
  }

  const score = (obj) => {
    let s = 0;
    const anim = obj?.animation || obj;
    if (anim && typeof anim === 'object') s += 1;
    if (anim?.elements && typeof anim.elements === 'object') s += 10;
    if (anim?.duration != null) s += 5;
    if (anim?.frames != null || anim?.keyframes != null || anim?.animations != null) s += 3;
    return s;
  };

  candidates.sort((a, b) => score(b) - score(a));
  const chosen = candidates.find((c) => score(c) >= 11);
  if (!chosen) throw new Error('Не удалось найти JSON-конфигурацию анимации в <script>.');
  return chosen.animation && chosen.animation.elements ? chosen.animation : chosen;
}

function collectIdMap(root) {
  const idMap = new Map();
  root.querySelectorAll('[id]').forEach((el) => idMap.set(el.id, el));
  return idMap;
}

function getUrlRefIds(el) {
  const ids = [];
  for (const attr of URL_ATTRS) {
    const val = el.getAttribute(attr);
    if (!val) continue;
    const matches = [...val.matchAll(/url\(#([^)]+)\)/g)];
    matches.forEach((m) => ids.push(m[1]));
  }
  return ids;
}

function collectRequiredIds(svgEl, animation) {
  const animatedIds = new Set(Object.keys(animation?.elements || {}));
  const idMap = collectIdMap(svgEl);
  const requiredIds = new Set();
  const queue = [];

  const addId = (id) => {
    if (!id || requiredIds.has(id) || !idMap.has(id)) return;
    requiredIds.add(id);
    queue.push(id);
  };

  animatedIds.forEach(addId);

  for (const id of animatedIds) {
    let node = idMap.get(id);
    while (node && node !== svgEl) {
      if (node.id) addId(node.id);
      node = node.parentElement;
    }
  }

  while (queue.length) {
    const id = queue.shift();
    const el = idMap.get(id);
    if (!el) continue;

    getUrlRefIds(el).forEach(addId);

    let p = el.parentElement;
    while (p && p !== svgEl) {
      getUrlRefIds(p).forEach(addId);
      p = p.parentElement;
    }

    el.querySelectorAll('*').forEach((child) => getUrlRefIds(child).forEach(addId));
  }

  return { requiredIds, animatedIds };
}

function stripServiceAttributes(el) {
  [...el.attributes].forEach((attr) => {
    const name = attr.name;
    if (
      SERVICE_ATTRS.has(name) ||
      name.startsWith('data-svgator') ||
      name.startsWith('svgator:')
    ) {
      el.removeAttribute(name);
    }
  });
}

function shouldKeepNode(node, requiredIds, inDefs = false) {
  if (!(node instanceof Element)) return false;
  if (node.tagName.toLowerCase() === 'script') return false;
  if (node.id && requiredIds.has(node.id)) return true;
  if (inDefs) return !!node.querySelector('[id]');
  return [...node.children].some((child) => shouldKeepNode(child, requiredIds, inDefs || node.tagName.toLowerCase() === 'defs'));
}

function cloneFiltered(node, requiredIds, inDefs = false) {
  if (!shouldKeepNode(node, requiredIds, inDefs)) return null;
  const clone = node.cloneNode(false);
  stripServiceAttributes(clone);

  [...node.children].forEach((child) => {
    const next = cloneFiltered(child, requiredIds, inDefs || node.tagName.toLowerCase() === 'defs');
    if (next) clone.appendChild(next);
  });
  return clone;
}

function buildEngineScript(animation) {
  const animJson = JSON.stringify(animation);
  return `(() => {
  const animation = ${animJson};
  const svg = document.currentScript.ownerSVGElement;
  const raf = window.requestAnimationFrame.bind(window);

  function cubicBezier(x1, y1, x2, y2, t) {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    const sampleX = (u) => ((ax * u + bx) * u + cx) * u;
    const sampleY = (u) => ((ay * u + by) * u + cy) * u;
    const sampleDerivX = (u) => (3 * ax * u + 2 * bx) * u + cx;

    let u = t;
    for (let i = 0; i < 8; i += 1) {
      const x = sampleX(u) - t;
      const dx = sampleDerivX(u);
      if (Math.abs(x) < 1e-7 || Math.abs(dx) < 1e-7) break;
      u -= x / dx;
    }
    let lo = 0;
    let hi = 1;
    while (lo < hi) {
      const x = sampleX(u);
      if (Math.abs(x - t) < 1e-7) break;
      if (t > x) lo = u;
      else hi = u;
      u = (hi + lo) / 2;
      if (Math.abs(hi - lo) < 1e-7) break;
    }
    return sampleY(u);
  }

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function parseColor(c) {
    const m = String(c).trim().match(/^#?([\da-f]{6}|[\da-f]{3})$/i);
    if (!m) return null;
    const hex = m[1].length === 3 ? m[1].split('').map((x) => x + x).join('') : m[1];
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }

  function colorLerp(a, b, t) {
    const ca = parseColor(a);
    const cb = parseColor(b);
    if (!ca || !cb) return t < 0.5 ? a : b;
    const v = ca.map((x, i) => Math.round(lerp(x, cb[i], t)).toString(16).padStart(2, '0')).join('');
    return '#' + v;
  }

  function getTracks(elAnim) {
    if (Array.isArray(elAnim?.tracks)) return elAnim.tracks;
    if (Array.isArray(elAnim?.animations)) return elAnim.animations;
    const out = [];
    for (const [prop, frames] of Object.entries(elAnim || {})) {
      if (Array.isArray(frames)) out.push({ property: prop, keyframes: frames });
    }
    return out;
  }

  function fTime(f) { return f.t ?? f.time ?? f.offset ?? 0; }
  function fVal(f) { return f.v ?? f.value; }
  function fEase(f) { return f.e ?? f.ease ?? [0.25, 0.1, 0.25, 1]; }

  function interpFrames(frames, ms) {
    if (!frames?.length) return null;
    if (ms <= fTime(frames[0])) return fVal(frames[0]);
    if (ms >= fTime(frames[frames.length - 1])) return fVal(frames[frames.length - 1]);
    for (let i = 0; i < frames.length - 1; i += 1) {
      const a = frames[i];
      const b = frames[i + 1];
      const ta = fTime(a);
      const tb = fTime(b);
      if (ms < ta || ms > tb) continue;
      const span = tb - ta || 1;
      const raw = clamp01((ms - ta) / span);
      const ez = fEase(a);
      const eased = Array.isArray(ez) && ez.length === 4 ? cubicBezier(ez[0], ez[1], ez[2], ez[3], raw) : raw;
      const va = fVal(a);
      const vb = fVal(b);

      if (typeof va === 'number' && typeof vb === 'number') return lerp(va, vb, eased);
      if (typeof va === 'string' && typeof vb === 'string') return colorLerp(va, vb, eased);
      if (typeof va === 'object' && va && typeof vb === 'object' && vb) {
        const out = {};
        const keys = new Set([...Object.keys(va), ...Object.keys(vb)]);
        keys.forEach((k) => {
          if (typeof va[k] === 'number' && typeof vb[k] === 'number') out[k] = lerp(va[k], vb[k], eased);
          else out[k] = eased < 0.5 ? va[k] : vb[k];
        });
        return out;
      }
      return eased < 0.5 ? va : vb;
    }
    return fVal(frames[0]);
  }

  function applyProp(el, prop, val) {
    if (val == null) return;
    if (prop === 'stroke-dashoffset' || prop === 'strokeDashoffset') {
      el.setAttribute('stroke-dashoffset', String(val));
      return;
    }
    if (prop === 'fill') {
      el.setAttribute('fill', String(val));
      return;
    }
    if (prop === 'opacity') {
      el.setAttribute('opacity', String(val));
      return;
    }
    if (prop === 'transform') {
      if (typeof val === 'string') {
        el.setAttribute('transform', val);
        return;
      }
      const tx = val.tx ?? val.x ?? 0;
      const ty = val.ty ?? val.y ?? 0;
      const sx = val.sx ?? val.scaleX ?? 1;
      const sy = val.sy ?? val.scaleY ?? 1;
      const r = val.r ?? val.rotate ?? val.rotation ?? 0;
      const px = val.px ?? val.pivotX ?? val.cx ?? 0;
      const py = val.py ?? val.pivotY ?? val.cy ?? 0;
      const transform = 'translate(' + tx + ' ' + ty + ') translate(' + px + ' ' + py + ') rotate(' + r + ') scale(' + sx + ' ' + sy + ') translate(' + (-px) + ' ' + (-py) + ')';
      el.setAttribute('transform', transform);
      return;
    }
    if (typeof val === 'number' || typeof val === 'string') {
      el.setAttribute(prop, String(val));
    }
  }

  const duration = animation.duration ?? animation.dur ?? 1000;
  const loop = animation.loop ?? true;
  const tracksById = Object.entries(animation.elements || {}).map(([id, data]) => ({
    element: svg.getElementById(id),
    tracks: getTracks(data)
  })).filter((x) => x.element);

  const startedAt = performance.now();
  function tick(now) {
    let t = now - startedAt;
    if (loop) t = t % duration;
    else t = Math.min(t, duration);

    for (const { element, tracks } of tracksById) {
      for (const tr of tracks) {
        const prop = tr.property || tr.name || tr.attr;
        const frames = tr.keyframes || tr.frames || tr.values || tr;
        const value = interpFrames(frames, t);
        applyProp(element, prop, value);
      }
    }

    if (loop || t < duration) raf(tick);
  }
  raf(tick);
})();`;
}

function convertSvg(svgText) {
  const srcDoc = parseXml(svgText);
  const srcSvg = srcDoc.documentElement;
  if (srcSvg.tagName.toLowerCase() !== 'svg') {
    throw new Error('Корневой элемент не <svg>.');
  }

  const animation = parseAnimationConfig(srcDoc);
  const { requiredIds, animatedIds } = collectRequiredIds(srcSvg, animation);

  const outDoc = document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg', null);
  const outSvg = outDoc.documentElement;

  [...srcSvg.attributes].forEach((attr) => {
    outSvg.setAttribute(attr.name, attr.value);
  });
  stripServiceAttributes(outSvg);
  outSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  [...srcSvg.children].forEach((child) => {
    if (child.tagName.toLowerCase() === 'script') return;
    const cloned = cloneFiltered(child, requiredIds, child.tagName.toLowerCase() === 'defs');
    if (cloned) outSvg.appendChild(outDoc.importNode(cloned, true));
  });

  const script = outDoc.createElement('script');
  script.textContent = buildEngineScript(animation);
  outSvg.appendChild(script);

  const xml = new XMLSerializer().serializeToString(outDoc);
  return {
    xml,
    stats: {
      animated: animatedIds.size,
      required: requiredIds.size
    }
  };
}

convertBtn.addEventListener('click', async () => {
  const file = fileInput.files?.[0];
  if (!file) {
    setLog('Сначала выберите SVG файл.');
    return;
  }

  try {
    setLog('Конвертация...');
    const text = await file.text();
    const { xml, stats } = convertSvg(text);

    outputEl.value = xml;
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.style.display = 'inline-block';

    setLog(`Готово. Animated IDs: ${stats.animated}, required IDs: ${stats.required}.`);
  } catch (err) {
    setLog('Ошибка: ' + (err?.message || String(err)));
  }
});
