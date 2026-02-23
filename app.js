const MODES = ["draw", "runner", "draw-erase-loop", "pulse", "stagger"];
const EASINGS = ["linear", "ease", "ease-in", "ease-out", "ease-in-out", "cubic-bezier(0.4,0,0.2,1)"];

const state = {
  svgElement: null,
  paths: [],
  selectedId: null,
};

const ui = {
  upload: document.getElementById("svgUpload"),
  canvas: document.getElementById("svgCanvas"),
  pathList: document.getElementById("pathList"),
  tpl: document.getElementById("pathItemTemplate"),
  restartBtn: document.getElementById("restartBtn"),
  exportBtn: document.getElementById("exportBtn"),
  applyAllBtn: document.getElementById("applyAllBtn"),
  enableAllBtn: document.getElementById("enableAllBtn"),
  disableAllBtn: document.getElementById("disableAllBtn"),
  globalMode: document.getElementById("globalMode"),
  globalSpeed: document.getElementById("globalSpeed"),
  globalDelay: document.getElementById("globalDelay"),
  globalSegment: document.getElementById("globalSegment"),
  globalDirection: document.getElementById("globalDirection"),
  globalEasing: document.getElementById("globalEasing"),
  globalStrokeWidth: document.getElementById("globalStrokeWidth"),
  globalOpacity: document.getElementById("globalOpacity"),
};

function setupStaticControls() {
  fillSelect(ui.globalMode, MODES);
  fillSelect(ui.globalEasing, EASINGS);

  ui.upload.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    const content = await file.text();
    loadSvg(content);
  });

  ui.applyAllBtn.addEventListener("click", applyAllSettings);
  ui.enableAllBtn.addEventListener("click", () => toggleAll(true));
  ui.disableAllBtn.addEventListener("click", () => toggleAll(false));
  ui.restartBtn.addEventListener("click", applyAnimations);
  ui.exportBtn.addEventListener("click", exportSvg);
}

function fillSelect(select, options) {
  select.innerHTML = "";
  for (const option of options) {
    const el = document.createElement("option");
    el.value = option;
    el.textContent = option;
    select.appendChild(el);
  }
}

function loadSvg(svgText) {
  const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = parsed.querySelector("svg");
  if (!svg) {
    alert("Не удалось найти <svg> в файле");
    return;
  }

  const normalized = normalizeSvg(svg);
  state.svgElement = normalized;
  state.paths = buildModel(normalized);
  state.selectedId = state.paths[0]?.id ?? null;

  ui.canvas.classList.remove("empty");
  ui.canvas.innerHTML = "";
  ui.canvas.appendChild(normalized);

  ui.restartBtn.disabled = false;
  ui.exportBtn.disabled = false;
  ui.applyAllBtn.disabled = false;
  ui.enableAllBtn.disabled = false;
  ui.disableAllBtn.disabled = false;

  renderPathList();
  applyAnimations();
}

function normalizeSvg(svg) {
  const ns = "http://www.w3.org/2000/svg";
  const clone = svg.cloneNode(true);
  const shapeSelectors = "path,circle,rect,line,polyline,polygon";
  const shapes = Array.from(clone.querySelectorAll(shapeSelectors));

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

    if (!path.id) path.id = `path-${index + 1}`;
    path.setAttribute("d", d);
    shape.replaceWith(path);
  });

  return clone;
}

function shapeToPathData(el) {
  const toNum = (v, fallback = 0) => Number.parseFloat(v ?? fallback);
  const type = el.tagName.toLowerCase();

  if (type === "line") {
    const x1 = toNum(el.getAttribute("x1"));
    const y1 = toNum(el.getAttribute("y1"));
    const x2 = toNum(el.getAttribute("x2"));
    const y2 = toNum(el.getAttribute("y2"));
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  if (type === "polyline" || type === "polygon") {
    const points = (el.getAttribute("points") || "").trim().replace(/\s+/g, " ").split(/\s|,/).filter(Boolean).map(Number);
    if (points.length < 4) return null;
    let d = `M ${points[0]} ${points[1]}`;
    for (let i = 2; i < points.length; i += 2) d += ` L ${points[i]} ${points[i + 1]}`;
    if (type === "polygon") d += " Z";
    return d;
  }

  if (type === "rect") {
    const x = toNum(el.getAttribute("x"));
    const y = toNum(el.getAttribute("y"));
    const w = toNum(el.getAttribute("width"));
    const h = toNum(el.getAttribute("height"));
    const rxRaw = toNum(el.getAttribute("rx"));
    const ryRaw = toNum(el.getAttribute("ry"));
    const rx = Math.min(rxRaw || ryRaw, w / 2);
    const ry = Math.min(ryRaw || rxRaw, h / 2);

    if (!rx && !ry) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;

    return [
      `M ${x + rx} ${y}`,
      `H ${x + w - rx}`,
      `A ${rx} ${ry} 0 0 1 ${x + w} ${y + ry}`,
      `V ${y + h - ry}`,
      `A ${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}`,
      `H ${x + rx}`,
      `A ${rx} ${ry} 0 0 1 ${x} ${y + h - ry}`,
      `V ${y + ry}`,
      `A ${rx} ${ry} 0 0 1 ${x + rx} ${y}`,
      "Z",
    ].join(" ");
  }

  if (type === "circle") {
    const cx = toNum(el.getAttribute("cx"));
    const cy = toNum(el.getAttribute("cy"));
    const r = toNum(el.getAttribute("r"));
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
  }

  return null;
}

function buildModel(svg) {
  const paths = Array.from(svg.querySelectorAll("path"));
  return paths.map((path, idx) => {
    if (!path.id) path.id = `path-${idx + 1}`;
    const length = path.getTotalLength();
    path.style.fill = path.style.fill || path.getAttribute("fill") || "none";
    path.style.stroke = path.style.stroke || path.getAttribute("stroke") || "currentColor";
    path.style.strokeLinecap = path.style.strokeLinecap || "round";
    path.style.strokeLinejoin = path.style.strokeLinejoin || "round";

    return {
      id: path.id,
      length,
      enabled: true,
      mode: "draw",
      speed: 2,
      delay: 0,
      segmentLength: Math.max(1, Math.round(length * 0.2)),
      direction: "forward",
      easing: "linear",
      strokeWidth: Number(path.getAttribute("stroke-width") || 2),
      opacity: Number(path.getAttribute("opacity") || 1),
    };
  });
}

function renderPathList() {
  ui.pathList.innerHTML = "";
  for (const model of state.paths) {
    const fragment = ui.tpl.content.cloneNode(true);
    const root = fragment.querySelector(".path-item");
    root.dataset.id = model.id;

    fragment.querySelector(".path-title").textContent = model.id;
    fragment.querySelector(".path-length").textContent = `${model.length.toFixed(1)}px`;

    const enabled = fragment.querySelector(".path-enabled");
    enabled.checked = model.enabled;
    enabled.addEventListener("change", () => updatePath(model.id, { enabled: enabled.checked }));

    const mode = fragment.querySelector(".path-mode");
    fillSelect(mode, MODES);
    mode.value = model.mode;
    mode.addEventListener("change", () => updatePath(model.id, { mode: mode.value }));

    bindNumber(fragment, ".path-speed", model.speed, (value) => updatePath(model.id, { speed: value }));
    bindNumber(fragment, ".path-delay", model.delay, (value) => updatePath(model.id, { delay: value }));
    bindNumber(fragment, ".path-segment", percentFromSegment(model), (value) => {
      const length = model.length;
      updatePath(model.id, { segmentLength: Math.max(1, Math.round(length * value / 100)) });
    });

    const direction = fragment.querySelector(".path-direction");
    direction.value = model.direction;
    direction.addEventListener("change", () => updatePath(model.id, { direction: direction.value }));

    const easing = fragment.querySelector(".path-easing");
    fillSelect(easing, EASINGS);
    easing.value = model.easing;
    easing.addEventListener("change", () => updatePath(model.id, { easing: easing.value }));

    bindNumber(fragment, ".path-stroke", model.strokeWidth, (value) => updatePath(model.id, { strokeWidth: value }));
    bindNumber(fragment, ".path-opacity", model.opacity, (value) => updatePath(model.id, { opacity: value }));

    root.addEventListener("click", (event) => {
      if (event.target.closest("input,select")) return;
      state.selectedId = model.id;
      syncSelectionState();
    });

    ui.pathList.appendChild(fragment);
  }

  syncSelectionState();
}

function bindNumber(fragment, selector, initial, onChange) {
  const input = fragment.querySelector(selector);
  input.value = initial;
  input.addEventListener("input", () => onChange(Number(input.value)));
}

function percentFromSegment(model) {
  return Math.min(100, Math.max(1, Math.round((model.segmentLength / model.length) * 100)));
}

function updatePath(id, patch) {
  const path = state.paths.find((item) => item.id === id);
  Object.assign(path, patch);
  applyAnimations();
  syncSelectionState();
}

function toggleAll(enabled) {
  state.paths.forEach((path) => (path.enabled = enabled));
  renderPathList();
  applyAnimations();
}

function applyAllSettings() {
  const patch = {
    mode: ui.globalMode.value,
    speed: Number(ui.globalSpeed.value),
    delay: Number(ui.globalDelay.value),
    direction: ui.globalDirection.value,
    easing: ui.globalEasing.value,
    strokeWidth: Number(ui.globalStrokeWidth.value),
    opacity: Number(ui.globalOpacity.value),
  };
  const segmentPercent = Number(ui.globalSegment.value);

  state.paths.forEach((path) => {
    Object.assign(path, patch);
    path.segmentLength = Math.max(1, Math.round(path.length * segmentPercent / 100));
  });

  renderPathList();
  applyAnimations();
}

function applyAnimations() {
  if (!state.svgElement) return;

  state.paths.forEach((model, index) => {
    const pathEl = state.svgElement.querySelector(`#${CSS.escape(model.id)}`);
    if (!pathEl) return;

    pathEl.getAnimations().forEach((anim) => anim.cancel());
    pathEl.style.strokeWidth = `${model.strokeWidth}`;
    pathEl.style.opacity = `${model.opacity}`;

    if (!model.enabled) {
      pathEl.style.strokeDasharray = "none";
      pathEl.style.strokeDashoffset = "0";
      return;
    }

    const directionFactor = model.direction === "reverse" ? -1 : 1;
    let options = { duration: model.speed * 1000, delay: model.delay * 1000, easing: model.easing, fill: "both", iterations: Infinity };
    let keyframes = [];

    if (model.mode === "draw") {
      pathEl.style.strokeDasharray = `${model.length}`;
      keyframes = [{ strokeDashoffset: directionFactor * model.length }, { strokeDashoffset: 0 }];
      options.iterations = 1;
    } else if (model.mode === "runner") {
      pathEl.style.strokeDasharray = `${model.segmentLength} ${model.length}`;
      keyframes = [{ strokeDashoffset: 0 }, { strokeDashoffset: -directionFactor * model.length }];
    } else if (model.mode === "draw-erase-loop") {
      pathEl.style.strokeDasharray = `${model.length}`;
      keyframes = [
        { strokeDashoffset: directionFactor * model.length, offset: 0 },
        { strokeDashoffset: 0, offset: 0.5 },
        { strokeDashoffset: -directionFactor * model.length, offset: 1 },
      ];
    } else if (model.mode === "pulse") {
      pathEl.style.strokeDasharray = `${model.length}`;
      keyframes = [
        { strokeDashoffset: 0, strokeWidth: model.strokeWidth, opacity: model.opacity, offset: 0 },
        { strokeDashoffset: 0, strokeWidth: model.strokeWidth * 1.8, opacity: Math.max(0.2, model.opacity * 0.5), offset: 0.5 },
        { strokeDashoffset: 0, strokeWidth: model.strokeWidth, opacity: model.opacity, offset: 1 },
      ];
    } else if (model.mode === "stagger") {
      pathEl.style.strokeDasharray = `${model.length}`;
      keyframes = [{ strokeDashoffset: model.length }, { strokeDashoffset: 0 }];
      options = { ...options, delay: model.delay * 1000 + index * 250, iterations: 1 };
    }

    pathEl.animate(keyframes, options);
  });

  syncSelectionState();
}

function syncSelectionState() {
  const cards = ui.pathList.querySelectorAll(".path-item");
  cards.forEach((card) => card.classList.toggle("active", card.dataset.id === state.selectedId));

  if (!state.svgElement) return;
  state.svgElement.querySelectorAll("path").forEach((path) => {
    path.classList.toggle("svg-selected", path.id === state.selectedId);
  });
}

function buildExportCss(model, index) {
  const safeId = model.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const animName = `anim_${safeId}_${index}`;
  const duration = `${model.speed}s`;
  const delay = `${model.delay}s`;
  const directionFactor = model.direction === "reverse" ? -1 : 1;

  let keyframes = "";
  let extra = `animation: ${animName} ${duration} ${model.easing} ${delay} infinite;`;
  let dasharray = "";

  if (model.mode === "draw") {
    keyframes = `@keyframes ${animName}{from{stroke-dashoffset:${directionFactor * model.length};}to{stroke-dashoffset:0;}}`;
    extra = `animation: ${animName} ${duration} ${model.easing} ${delay} 1 forwards;`;
    dasharray = `stroke-dasharray:${model.length};`;
  } else if (model.mode === "runner") {
    keyframes = `@keyframes ${animName}{from{stroke-dashoffset:0;}to{stroke-dashoffset:${-directionFactor * model.length};}}`;
    dasharray = `stroke-dasharray:${model.segmentLength} ${model.length};`;
  } else if (model.mode === "draw-erase-loop") {
    keyframes = `@keyframes ${animName}{0%{stroke-dashoffset:${directionFactor * model.length};}50%{stroke-dashoffset:0;}100%{stroke-dashoffset:${-directionFactor * model.length};}}`;
    dasharray = `stroke-dasharray:${model.length};`;
  } else if (model.mode === "pulse") {
    keyframes = `@keyframes ${animName}{0%{stroke-width:${model.strokeWidth};opacity:${model.opacity};}50%{stroke-width:${model.strokeWidth * 1.8};opacity:${Math.max(0.2, model.opacity * 0.5)};}100%{stroke-width:${model.strokeWidth};opacity:${model.opacity};}}`;
  } else if (model.mode === "stagger") {
    keyframes = `@keyframes ${animName}{from{stroke-dashoffset:${model.length};}to{stroke-dashoffset:0;}}`;
    dasharray = `stroke-dasharray:${model.length};`;
    extra = `animation: ${animName} ${duration} ${model.easing} ${model.delay + index * 0.25}s 1 forwards;`;
  }

  return {
    selector: `#${CSS.escape(model.id)}`,
    css: `${dasharray}stroke-width:${model.strokeWidth};opacity:${model.opacity};${extra}${model.enabled ? "" : "animation:none;"}`,
    keyframes,
  };
}

function exportSvg() {
  if (!state.svgElement) return;

  const exported = state.svgElement.cloneNode(true);
  const style = document.createElement("style");
  const parts = [];

  state.paths.forEach((model, index) => {
    const target = exported.querySelector(`#${CSS.escape(model.id)}`);
    if (!target) return;

    const data = buildExportCss(model, index);
    target.getAnimations?.().forEach((anim) => anim.cancel());
    target.setAttribute("style", "");

    parts.push(`${data.selector}{${data.css}}`);
    parts.push(data.keyframes);
  });

  style.textContent = parts.join("\n");
  exported.prepend(style);

  const content = new XMLSerializer().serializeToString(exported);
  const blob = new Blob([content], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "animated.svg";
  link.click();
  URL.revokeObjectURL(link.href);
}

setupStaticControls();
