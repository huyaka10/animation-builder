const MODES = ["draw", "runner", "draw-erase-loop", "pulse", "stagger"];
const EASINGS = ["linear", "ease", "ease-in", "ease-out", "ease-in-out", "cubic-bezier(0.4,0,0.2,1)"];
const PX_PER_SEC = 80;

const state = {
  originalSvgText: "",
  originalSvgElement: null,
  previewSvg: null,
  paths: [],
  selectedId: null,
  isPlaying: false,
  timelineStart: 0,
  timelineNow: 0,
  rafId: 0,
};

const ui = {
  upload: document.getElementById("svgUpload"),
  canvas: document.getElementById("svgCanvas"),
  pathList: document.getElementById("pathList"),
  tpl: document.getElementById("pathItemTemplate"),
  restartBtn: document.getElementById("restartBtn"),
  exportBtn: document.getElementById("exportBtn"),
  exportOriginalBtn: document.getElementById("exportOriginalBtn"),
  applyAllBtn: document.getElementById("applyAllBtn"),
  enableAllBtn: document.getElementById("enableAllBtn"),
  disableAllBtn: document.getElementById("disableAllBtn"),
  playPauseBtn: document.getElementById("playPauseBtn"),
  timelineLoop: document.getElementById("timelineLoop"),
  timelineScale: document.getElementById("timelineScale"),
  timelineWrap: document.getElementById("timelineWrap"),
  timelineNow: document.getElementById("timelineNow"),
  timelineTracks: document.getElementById("timelineTracks"),
  globalMode: document.getElementById("globalMode"),
  globalDuration: document.getElementById("globalDuration"),
  globalDelay: document.getElementById("globalDelay"),
  globalSegment: document.getElementById("globalSegment"),
  globalDirection: document.getElementById("globalDirection"),
  globalEasing: document.getElementById("globalEasing"),
  globalStrokeWidth: document.getElementById("globalStrokeWidth"),
  globalOpacity: document.getElementById("globalOpacity"),
  globalLinecap: document.getElementById("globalLinecap"),
  globalLinejoin: document.getElementById("globalLinejoin"),
};

function setup() {
  fillSelect(ui.globalMode, MODES);
  fillSelect(ui.globalEasing, EASINGS);

  ui.upload.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    loadSvg(await file.text());
  });

  ui.applyAllBtn.addEventListener("click", applyAllSettings);
  ui.enableAllBtn.addEventListener("click", () => toggleAll(true));
  ui.disableAllBtn.addEventListener("click", () => toggleAll(false));
  ui.restartBtn.addEventListener("click", () => {
    state.timelineNow = 0;
    applyAnimations();
    pauseTimeline();
    setTimelineMarker(0);
  });
  ui.exportBtn.addEventListener("click", exportAnimatedSvg);
  ui.exportOriginalBtn.addEventListener("click", exportOriginalSvg);
  ui.playPauseBtn.addEventListener("click", () => (state.isPlaying ? pauseTimeline() : playTimeline()));
}

function fillSelect(select, options) {
  select.innerHTML = "";
  options.forEach((option) => {
    const el = document.createElement("option");
    el.value = option;
    el.textContent = option;
    select.appendChild(el);
  });
}

function parseSvg(text) {
  const parsed = new DOMParser().parseFromString(text, "image/svg+xml");
  return parsed.querySelector("svg");
}

function loadSvg(svgText) {
  const original = parseSvg(svgText);
  if (!original) return alert("Не удалось найти <svg>.");

  state.originalSvgText = svgText;
  state.originalSvgElement = original;
  state.previewSvg = normalizeSvg(original.cloneNode(true));
  state.paths = buildModel(state.previewSvg);
  state.selectedId = state.paths[0]?.id ?? null;

  ui.canvas.innerHTML = "";
  ui.canvas.classList.remove("empty");
  ui.canvas.appendChild(state.previewSvg);

  [ui.restartBtn, ui.exportBtn, ui.exportOriginalBtn, ui.applyAllBtn, ui.enableAllBtn, ui.disableAllBtn, ui.playPauseBtn].forEach((b) => (b.disabled = false));

  renderPathList();
  renderTimeline();
  applyAnimations();
  pauseTimeline();
}

function normalizeSvg(svg) {
  const ns = "http://www.w3.org/2000/svg";
  const shapes = Array.from(svg.querySelectorAll("path,circle,rect,line,polyline,polygon"));

  shapes.forEach((shape, index) => {
    if (shape.tagName.toLowerCase() === "path") {
      if (!shape.id) shape.id = `path-${index + 1}`;
      return;
    }
    const d = shapeToPathData(shape);
    if (!d) return;
    const path = document.createElementNS(ns, "path");
    for (const { name, value } of Array.from(shape.attributes)) {
      if (["x", "y", "x1", "x2", "y1", "y2", "width", "height", "cx", "cy", "r", "rx", "ry", "points"].includes(name)) continue;
      path.setAttribute(name, value);
    }
    path.setAttribute("d", d);
    if (!path.id) path.id = `path-${index + 1}`;
    shape.replaceWith(path);
  });
  return svg;
}

function shapeToPathData(el) {
  const n = (v, d = 0) => Number.parseFloat(v ?? d);
  const type = el.tagName.toLowerCase();
  if (type === "line") return `M ${n(el.getAttribute("x1"))} ${n(el.getAttribute("y1"))} L ${n(el.getAttribute("x2"))} ${n(el.getAttribute("y2"))}`;
  if (type === "polyline" || type === "polygon") {
    const pts = (el.getAttribute("points") || "").trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (pts.length < 4) return null;
    let d = `M ${pts[0]} ${pts[1]}`;
    for (let i = 2; i < pts.length; i += 2) d += ` L ${pts[i]} ${pts[i + 1]}`;
    return type === "polygon" ? `${d} Z` : d;
  }
  if (type === "rect") {
    const x = n(el.getAttribute("x")); const y = n(el.getAttribute("y"));
    const w = n(el.getAttribute("width")); const h = n(el.getAttribute("height"));
    const rx = Math.min(n(el.getAttribute("rx")) || n(el.getAttribute("ry")), w / 2);
    const ry = Math.min(n(el.getAttribute("ry")) || n(el.getAttribute("rx")), h / 2);
    if (!rx && !ry) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
    return [`M ${x + rx} ${y}`, `H ${x + w - rx}`, `A ${rx} ${ry} 0 0 1 ${x + w} ${y + ry}`, `V ${y + h - ry}`, `A ${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}`, `H ${x + rx}`, `A ${rx} ${ry} 0 0 1 ${x} ${y + h - ry}`, `V ${y + ry}`, `A ${rx} ${ry} 0 0 1 ${x + rx} ${y}`, "Z"].join(" ");
  }
  if (type === "circle") {
    const cx = n(el.getAttribute("cx")); const cy = n(el.getAttribute("cy")); const r = n(el.getAttribute("r"));
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
  }
  return null;
}

function buildModel(svg) {
  return Array.from(svg.querySelectorAll("path")).map((path, i) => {
    if (!path.id) path.id = `path-${i + 1}`;
    const length = path.getTotalLength();
    return {
      id: path.id,
      length,
      enabled: true,
      mode: "draw",
      speed: 2,
      duration: 2,
      delay: 0,
      segmentLength: Math.max(1, Math.round(length * 0.2)),
      direction: "forward",
      easing: "linear",
      strokeWidth: Number(path.getAttribute("stroke-width") || 2),
      opacity: Number(path.getAttribute("opacity") || 1),
      linecap: path.getAttribute("stroke-linecap") || "round",
      linejoin: path.getAttribute("stroke-linejoin") || "round",
      animation: null,
    };
  });
}

function renderPathList() {
  ui.pathList.innerHTML = "";
  state.paths.forEach((model) => {
    const f = ui.tpl.content.cloneNode(true);
    const root = f.querySelector(".path-item");
    root.dataset.id = model.id;
    f.querySelector(".path-title").textContent = model.id;
    f.querySelector(".path-length").textContent = `${model.length.toFixed(1)}px`;

    bindCheck(f, ".path-enabled", model.enabled, (value) => updatePath(model.id, { enabled: value }));
    bindSelect(f, ".path-mode", MODES, model.mode, (value) => updatePath(model.id, { mode: value }));
    bindNumber(f, ".path-duration", model.duration, (value) => updatePath(model.id, { duration: value, speed: value }));
    bindNumber(f, ".path-delay", model.delay, (value) => updatePath(model.id, { delay: value }));
    bindNumber(f, ".path-segment", toPercent(model), (value) => updatePath(model.id, { segmentLength: Math.round(model.length * value / 100) }));
    bindSelect(f, ".path-direction", ["forward", "reverse"], model.direction, (value) => updatePath(model.id, { direction: value }));
    bindSelect(f, ".path-easing", EASINGS, model.easing, (value) => updatePath(model.id, { easing: value }));
    bindNumber(f, ".path-stroke", model.strokeWidth, (value) => updatePath(model.id, { strokeWidth: value }));
    bindNumber(f, ".path-opacity", model.opacity, (value) => updatePath(model.id, { opacity: value }));
    bindSelect(f, ".path-linecap", ["butt", "round", "square"], model.linecap, (value) => updatePath(model.id, { linecap: value }));
    bindSelect(f, ".path-linejoin", ["miter", "round", "bevel"], model.linejoin, (value) => updatePath(model.id, { linejoin: value }));

    root.addEventListener("click", (event) => {
      if (event.target.closest("input,select")) return;
      state.selectedId = model.id;
      syncSelection();
    });
    ui.pathList.appendChild(f);
  });
  syncSelection();
}

function bindNumber(fragment, selector, initial, cb) { const el = fragment.querySelector(selector); el.value = initial; el.addEventListener("input", () => cb(Number(el.value))); }
function bindCheck(fragment, selector, initial, cb) { const el = fragment.querySelector(selector); el.checked = initial; el.addEventListener("change", () => cb(el.checked)); }
function bindSelect(fragment, selector, options, initial, cb) { const el = fragment.querySelector(selector); fillSelect(el, options); el.value = initial; el.addEventListener("change", () => cb(el.value)); }
function toPercent(model) { return Math.max(1, Math.min(100, Math.round((model.segmentLength / model.length) * 100))); }

function updatePath(id, patch) {
  Object.assign(state.paths.find((p) => p.id === id), patch);
  renderTimeline();
  applyAnimations();
}

function applyAllSettings() {
  const patch = {
    mode: ui.globalMode.value,
    duration: Number(ui.globalDuration.value),
    speed: Number(ui.globalDuration.value),
    delay: Number(ui.globalDelay.value),
    direction: ui.globalDirection.value,
    easing: ui.globalEasing.value,
    strokeWidth: Number(ui.globalStrokeWidth.value),
    opacity: Number(ui.globalOpacity.value),
    linecap: ui.globalLinecap.value,
    linejoin: ui.globalLinejoin.value,
  };
  const segmentPercent = Number(ui.globalSegment.value);
  state.paths.forEach((path) => {
    Object.assign(path, patch);
    path.segmentLength = Math.max(1, Math.round(path.length * segmentPercent / 100));
  });
  renderPathList();
  renderTimeline();
  applyAnimations();
}

function toggleAll(enabled) {
  state.paths.forEach((path) => (path.enabled = enabled));
  renderPathList();
  applyAnimations();
}

function applyAnimations() {
  if (!state.previewSvg) return;
  state.paths.forEach((model, i) => {
    const path = state.previewSvg.querySelector(`#${CSS.escape(model.id)}`);
    if (!path) return;
    path.getAnimations().forEach((a) => a.cancel());
    path.style.fill = path.getAttribute("fill") || "none";
    path.style.stroke = path.getAttribute("stroke") || "currentColor";
    path.style.strokeWidth = `${model.strokeWidth}`;
    path.style.opacity = `${model.opacity}`;
    path.style.strokeLinecap = model.linecap;
    path.style.strokeLinejoin = model.linejoin;
    if (!model.enabled) {
      path.style.strokeDasharray = "none";
      path.style.strokeDashoffset = "0";
      model.animation = null;
      return;
    }

    const directionFactor = model.direction === "reverse" ? -1 : 1;
    let options = { duration: model.duration * 1000, delay: model.delay * 1000, easing: model.easing, fill: "both", iterations: Infinity };
    let keyframes = [];

    if (model.mode === "draw") {
      path.style.strokeDasharray = `${model.length}`;
      keyframes = [{ strokeDashoffset: directionFactor * model.length }, { strokeDashoffset: 0 }];
      options.iterations = 1;
    } else if (model.mode === "runner") {
      path.style.strokeDasharray = `${model.segmentLength} ${model.length}`;
      keyframes = [{ strokeDashoffset: 0 }, { strokeDashoffset: -directionFactor * model.length }];
    } else if (model.mode === "draw-erase-loop") {
      path.style.strokeDasharray = `${model.length}`;
      keyframes = [{ strokeDashoffset: directionFactor * model.length, offset: 0 }, { strokeDashoffset: 0, offset: 0.5 }, { strokeDashoffset: -directionFactor * model.length, offset: 1 }];
    } else if (model.mode === "pulse") {
      path.style.strokeDasharray = `${model.length}`;
      keyframes = [{ strokeWidth: model.strokeWidth, opacity: model.opacity }, { strokeWidth: model.strokeWidth * 1.8, opacity: Math.max(0.2, model.opacity * 0.5) }, { strokeWidth: model.strokeWidth, opacity: model.opacity }];
    } else if (model.mode === "stagger") {
      path.style.strokeDasharray = `${model.length}`;
      keyframes = [{ strokeDashoffset: model.length }, { strokeDashoffset: 0 }];
      options = { ...options, delay: model.delay * 1000 + i * 250, iterations: 1 };
    }

    model.animation = path.animate(keyframes, options);
    if (!state.isPlaying) model.animation.pause();
  });
  syncSelection();
}

function syncSelection() {
  ui.pathList.querySelectorAll(".path-item").forEach((card) => card.classList.toggle("active", card.dataset.id === state.selectedId));
  if (!state.previewSvg) return;
  state.previewSvg.querySelectorAll("path").forEach((path) => path.classList.toggle("svg-selected", path.id === state.selectedId));
}

function getTimelineDuration() {
  return Math.max(1, ...state.paths.map((p, i) => p.delay + p.duration + (p.mode === "stagger" ? i * 0.25 : 0)));
}

function renderTimeline() {
  const total = getTimelineDuration();
  ui.timelineScale.textContent = `0s — ${total.toFixed(1)}s`;
  ui.timelineTracks.innerHTML = "";
  state.paths.forEach((path) => {
    const row = document.createElement("div");
    row.className = "track-row";
    row.dataset.id = path.id;
    const name = document.createElement("div");
    name.className = "track-name";
    name.textContent = path.id;

    const lane = document.createElement("div");
    lane.className = "track-lane";
    const block = document.createElement("div");
    block.className = `track-block${path.enabled ? "" : " disabled"}`;
    block.style.left = `${path.delay * PX_PER_SEC}px`;
    block.style.width = `${Math.max(12, path.duration * PX_PER_SEC)}px`;
    block.title = `${path.delay.toFixed(2)}s / ${path.duration.toFixed(2)}s`;

    const handle = document.createElement("span");
    handle.className = "resize-handle";
    block.appendChild(handle);
    lane.appendChild(block);
    row.append(name, lane);
    ui.timelineTracks.appendChild(row);

    wireDrag(block, path);
    wireResize(handle, path);
  });
}

function wireDrag(block, model) {
  block.addEventListener("pointerdown", (event) => {
    if (event.target.classList.contains("resize-handle")) return;
    const startX = event.clientX;
    const initial = model.delay;
    const onMove = (e) => {
      model.delay = Math.max(0, initial + (e.clientX - startX) / PX_PER_SEC);
      renderTimeline();
      applyAnimations();
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderPathList();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });
}

function wireResize(handle, model) {
  handle.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    const startX = event.clientX;
    const initial = model.duration;
    const onMove = (e) => {
      model.duration = Math.max(0.1, initial + (e.clientX - startX) / PX_PER_SEC);
      model.speed = model.duration;
      renderTimeline();
      applyAnimations();
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderPathList();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });
}

function playTimeline() {
  state.isPlaying = true;
  ui.playPauseBtn.textContent = "Pause";
  state.timelineStart = performance.now() - state.timelineNow * 1000;
  state.paths.forEach((p) => p.animation?.play());
  tickTimeline();
}

function pauseTimeline() {
  state.isPlaying = false;
  ui.playPauseBtn.textContent = "Play";
  cancelAnimationFrame(state.rafId);
  state.paths.forEach((p) => p.animation?.pause());
}

function tickTimeline() {
  if (!state.isPlaying) return;
  const total = getTimelineDuration();
  const elapsed = (performance.now() - state.timelineStart) / 1000;
  if (ui.timelineLoop.checked) {
    state.timelineNow = elapsed % total;
    state.paths.forEach((p) => {
      if (!p.animation) return;
      const t = Math.max(0, state.timelineNow - p.delay);
      p.animation.currentTime = (t * 1000) % (p.duration * 1000);
    });
  } else {
    state.timelineNow = Math.min(elapsed, total);
    if (elapsed >= total) pauseTimeline();
  }
  setTimelineMarker(state.timelineNow);
  state.rafId = requestAnimationFrame(tickTimeline);
}

function setTimelineMarker(seconds) {
  ui.timelineNow.style.left = `${seconds * PX_PER_SEC}px`;
}

function buildExportCss(model, index) {
  const name = `anim_${model.id.replace(/[^a-zA-Z0-9_-]/g, "_")}_${index}`;
  const direction = model.direction === "reverse" ? -1 : 1;
  let dash = "";
  let frames = "";
  let animation = `animation:${name} ${model.duration}s ${model.easing} ${model.delay}s infinite;`;

  if (model.mode === "draw") {
    dash = `stroke-dasharray:${model.length};`;
    frames = `@keyframes ${name}{from{stroke-dashoffset:${direction * model.length};}to{stroke-dashoffset:0;}}`;
    animation = `animation:${name} ${model.duration}s ${model.easing} ${model.delay}s 1 forwards;`;
  } else if (model.mode === "runner") {
    dash = `stroke-dasharray:${model.segmentLength} ${model.length};`;
    frames = `@keyframes ${name}{from{stroke-dashoffset:0;}to{stroke-dashoffset:${-direction * model.length};}}`;
  } else if (model.mode === "draw-erase-loop") {
    dash = `stroke-dasharray:${model.length};`;
    frames = `@keyframes ${name}{0%{stroke-dashoffset:${direction * model.length};}50%{stroke-dashoffset:0;}100%{stroke-dashoffset:${-direction * model.length};}}`;
  } else if (model.mode === "pulse") {
    frames = `@keyframes ${name}{0%{stroke-width:${model.strokeWidth};opacity:${model.opacity};}50%{stroke-width:${model.strokeWidth * 1.8};opacity:${Math.max(0.2, model.opacity * 0.5)};}100%{stroke-width:${model.strokeWidth};opacity:${model.opacity};}}`;
  } else if (model.mode === "stagger") {
    dash = `stroke-dasharray:${model.length};`;
    frames = `@keyframes ${name}{from{stroke-dashoffset:${model.length};}to{stroke-dashoffset:0;}}`;
    animation = `animation:${name} ${model.duration}s ${model.easing} ${model.delay + index * 0.25}s 1 forwards;`;
  }

  return `${frames}\n#${CSS.escape(model.id)}{${dash}stroke-width:${model.strokeWidth};stroke-linecap:${model.linecap};stroke-linejoin:${model.linejoin};opacity:${model.opacity};${model.enabled ? animation : "animation:none;"}}`;
}

function exportAnimatedSvg() {
  if (!state.originalSvgElement) return;
  const exportSvg = normalizeSvg(state.originalSvgElement.cloneNode(true));
  const style = document.createElement("style");
  style.textContent = state.paths.map((p, i) => buildExportCss(p, i)).join("\n");
  exportSvg.prepend(style);
  download("animated.svg", new XMLSerializer().serializeToString(exportSvg));
}

function exportOriginalSvg() {
  if (!state.originalSvgText) return;
  download("original.svg", state.originalSvgText);
}

function download(name, text) {
  const blob = new Blob([text], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

setup();
