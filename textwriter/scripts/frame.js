/* frame.js - Logic for Neon Frame Editor */

import { S } from "./engine.js";

let framePreview = null;
let frameBorder = null;

let frameAnimId = null;
let frameStartTime = 0;

/* ===== Color Math ===== */

function hexToRgbObj(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 0, b: 255 };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function lerpColor(hex1, hex2, t) {
  const c1 = hexToRgbObj(hex1);
  const c2 = hexToRgbObj(hex2);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t,
  );
}

/* ===== Shared style logic ===== */

function applyFrameStyles(container, borderEl) {
  const colors =
    S.frColors && S.frColors.length >= 1 ? S.frColors : ["#ff00ff"];
  const angle = S.frAngle != null ? S.frAngle : 90;
  const width = S.frWidth || 600;
  const height = S.frHeight || 400;
  const size = S.frSize || 10;
  const radius = S.frRadius || 0;
  const glow = S.frGlow != null ? S.frGlow : 20;

  /* Container: dimensions, radius, glow */
  container.style.width = width + "px";
  container.style.height = height + "px";
  container.style.borderRadius = radius + "px";
  container.style.background = "transparent";

  const n = colors.length;

  if (glow > 0) {
    /* If gradient glow is OFF, or speed is 0, or only 1 color — use static first color */
    if (!S.frGlowGradient || S.frSpeed === 0 || n === 1) {
      const glowColor = colors[0];
      container.style.boxShadow =
        "0 0 " +
        glow +
        "px " +
        glowColor +
        ", 0 0 " +
        glow * 2 +
        "px " +
        glowColor;
    } else {
      /* Gradient glow is ON and animating — JS will handle it, set initial */
      container.style.boxShadow =
        "0 0 " +
        glow +
        "px " +
        colors[0] +
        ", 0 0 " +
        glow * 2 +
        "px " +
        colors[0];
    }
  } else {
    container.style.boxShadow = "none";
  }

  /* Border element: gradient + mask cutout */
  borderEl.style.borderRadius = radius + "px";
  borderEl.style.padding = size + "px";

  const speed = S.frSpeed || 0;

  /* Set initial static gradient */
  if (n === 1 || speed === 0) {
    borderEl.style.background =
      "linear-gradient(" + angle + "deg, " + colors.join(", ") + ")";
    borderEl.style.backgroundSize = "100% 100%";
  }

  /* Mask: content-box cutout leaves only padding (=tube) visible */
  borderEl.style.webkitMask =
    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)";
  borderEl.style.webkitMaskComposite = "xor";
  borderEl.style.mask =
    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)";
  borderEl.style.maskComposite = "exclude";
}

/* ===== JS Gradient Animation (smooth for any angle + glow sync) ===== */

function startFrameAnimation() {
  stopFrameAnimation();
  if (S.frSpeed > 0 && S.frColors && S.frColors.length > 1) {
    frameStartTime = performance.now();
    frameAnimId = requestAnimationFrame(animateFrameGradient);
  }
}

function stopFrameAnimation() {
  if (frameAnimId) {
    cancelAnimationFrame(frameAnimId);
    frameAnimId = null;
  }
}

function ensureFrameAnimation() {
  if (S.frSpeed > 0 && S.frColors && S.frColors.length > 1) {
    if (!frameAnimId) {
      frameStartTime = performance.now();
      frameAnimId = requestAnimationFrame(animateFrameGradient);
    }
  } else {
    stopFrameAnimation();
  }
}

function animateFrameGradient(timestamp) {
  const borderEl = frameBorder || document.getElementById("obs-frame-border");
  const containerEl = framePreview || document.getElementById("obs-frame");
  if (!borderEl) {
    stopFrameAnimation();
    return;
  }

  const speed = S.frSpeed || 0;
  const colors = S.frColors;
  const n = colors ? colors.length : 0;

  if (speed === 0 || n <= 1) {
    stopFrameAnimation();
    return;
  }

  if (!frameStartTime) frameStartTime = timestamp;
  const elapsed = timestamp - frameStartTime;

  const duration = (200 / speed) * 1000; // ms for one full cycle
  const progress = (elapsed % duration) / duration; // 0 to 1

  const angle = S.frAngle != null ? S.frAngle : 90;

  /* Build shifted gradient stops */
  const allColors = [...colors, ...colors, colors[0]];
  let stops = [];

  for (let i = 0; i < allColors.length; i++) {
    const pos = (i / n - progress) * 100;
    stops.push(allColors[i] + " " + pos.toFixed(2) + "%");
  }

  borderEl.style.background =
    "linear-gradient(" + angle + "deg, " + stops.join(", ") + ")";
  borderEl.style.backgroundSize = "100% 100%";

  /* Animate glow color if enabled */
  if (S.frGlowGradient && S.frGlow > 0 && containerEl) {
    const glowProgress = (progress * n) % 1;
    const glowIndex = Math.floor(progress * n) % n;
    const nextGlowIndex = (glowIndex + 1) % n;
    const currentGlowColor = lerpColor(
      colors[glowIndex],
      colors[nextGlowIndex],
      glowProgress,
    );

    containerEl.style.boxShadow =
      "0 0 " +
      S.frGlow +
      "px " +
      currentGlowColor +
      ", 0 0 " +
      S.frGlow * 2 +
      "px " +
      currentGlowColor;
  }

  frameAnimId = requestAnimationFrame(animateFrameGradient);
}

/* ===== CONFIG MODE ===== */

export function initFrameEditor() {
  if (document.getElementById("editor-frame-preview")) return;

  const previewStage = document.getElementById("pstage");
  if (!previewStage) return;

  framePreview = document.createElement("div");
  framePreview.id = "editor-frame-preview";

  frameBorder = document.createElement("div");
  frameBorder.id = "editor-frame-border";
  framePreview.appendChild(frameBorder);

  previewStage.appendChild(framePreview);

  renderFrameColors();

  const addBtn = document.getElementById("fc-add");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      if (S.frColors.length < 5) {
        S.frColors.push(S.frColors[S.frColors.length - 1] || "#ffffff");
        renderFrameColors();
        updateFramePreview();
        if (window.onChange) window.onChange();
      }
    });
  }

  updateFramePreview();
}

export function destroyFrameEditor() {
  stopFrameAnimation();
  const preview = document.getElementById("editor-frame-preview");
  if (preview) preview.remove();
  framePreview = null;
  frameBorder = null;
}

export function renderFrameColors() {
  const container = document.getElementById("fc-list");
  if (!container) return;

  container.innerHTML = "";
  S.frColors.forEach((color, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "ns-item";
    const input = document.createElement("input");
    input.type = "color";
    input.value = color;
    input.className = "ns-color-in";
    input.addEventListener("input", (e) => {
      S.frColors[index] = e.target.value;
      updateFramePreview();
      if (window.onChange) window.onChange();
    });
    wrapper.appendChild(input);
    if (S.frColors.length > 1) {
      const btn = document.createElement("button");
      btn.className = "ns-rem-btn";
      btn.innerHTML = "&times;";
      btn.title = "Remove Color";
      btn.onclick = () => {
        S.frColors.splice(index, 1);
        renderFrameColors();
        updateFramePreview();
        if (window.onChange) window.onChange();
      };
      wrapper.appendChild(btn);
    }
    container.appendChild(wrapper);
  });

  const addBtn = document.getElementById("fc-add");
  if (addBtn) {
    addBtn.style.display = S.frColors.length < 5 ? "block" : "none";
  }
}

window.updateFramePreview = function () {
  if (!framePreview || !frameBorder) return;
  applyFrameStyles(framePreview, frameBorder);
  ensureFrameAnimation();
};

/* ===== OBS OVERLAY MODE ===== */

export function renderFrameOBS() {
  const colors = S.frColors;
  if (!colors || colors.length < 1) return;

  const container = document.createElement("div");
  container.id = "obs-frame";

  const border = document.createElement("div");
  border.id = "obs-frame-border";
  container.appendChild(border);

  document.body.appendChild(container);
  applyFrameStyles(container, border);
  ensureFrameAnimation();
}

export function destroyFrameOBS() {
  stopFrameAnimation();
  const el = document.getElementById("obs-frame");
  if (el) el.remove();
}
