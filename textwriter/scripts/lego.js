// scripts/lego.js
// ===== LEGO 3D эффект для Text Effects Pro =====

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ===== СОСТОЯНИЕ =====
let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let canvas = null;
let textGroup = null;
let currentMeshes = [];
let anim = null;
let animLoopId = null;

const S = {
  text: "LEGO",
  colors: ["#E3000B", "#0057A8", "#FFD500", "#00852B", "#FF7E14"],
  depth: 3,
  maxSize: 1,
  randomSize: false,
  speed: 5,
  rotate: 0,
  tilt: 0,
  autoRotate: false,
  radius: 0.315, // ← добавлено для настроек, если захочешь расширить
};

// ===== КОНСТАНТЫ КИРПИЧЕЙ =====
const UNIT = 1.0;
const GAP = 0.06;
const BRICK_H = 0.58;
const STUD_H = 0.17;
const TUBE_H = 0.22;
const LAYER_GAP = 0.04;
const MAX_BRICKS = 2000;

// ===== ГЕОМЕТРИИ =====
const boxGeo = new THREE.BoxGeometry(UNIT, UNIT, BRICK_H);
const studGeo = new THREE.CylinderGeometry(0.28, 0.28, STUD_H, 24);
studGeo.rotateX(-Math.PI / 2);

function createTubeGeo() {
  const iR = 0.315;
  const oR = 0.375;
  const h = TUBE_H;
  const pts = [
    new THREE.Vector2(iR, h),
    new THREE.Vector2(iR, 0.025),
    new THREE.Vector2(iR + 0.008, 0.008),
    new THREE.Vector2(oR - 0.008, 0),
    new THREE.Vector2(oR, 0.008),
    new THREE.Vector2(oR, h - 0.005),
    new THREE.Vector2(oR - 0.005, h),
  ];
  const geo = new THREE.LatheGeometry(pts, 24);
  geo.rotateX(-Math.PI / 2);
  return geo;
}
const tubeGeo = createTubeGeo();

const brickMat = new THREE.MeshStandardMaterial({
  roughness: 0.22,
  metalness: 0.02,
  envMapIntensity: 0.7,
});

// ===== ENV MAP =====
function createEnvMap() {
  const envC = document.createElement("canvas");
  envC.width = 64;
  envC.height = 64;
  const envX = envC.getContext("2d");
  const envGr = envX.createLinearGradient(0, 0, 0, 64);
  envGr.addColorStop(0, "#ffeedd");
  envGr.addColorStop(0.35, "#554455");
  envGr.addColorStop(0.7, "#221122");
  envGr.addColorStop(1, "#110a16");
  envX.fillStyle = envGr;
  envX.fillRect(0, 0, 64, 64);
  envX.fillStyle = "rgba(255,240,220,0.12)";
  envX.fillRect(42, 8, 8, 48);
  const envTex = new THREE.CanvasTexture(envC);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  return envTex;
}

// ===== ОПРЕДЕЛЯЕМ РЕЖИМ =====
function isOBSMode() {
  return location.hash.includes("mode=lego");
}

// ===== ПАРСИНГ ХЭША =====
function parseHash() {
  const h = location.hash.slice(1);
  if (!h) return;
  const p = new URLSearchParams(h);
  const g = (k) => p.get(k);
  if (g("t")) S.text = decodeURIComponent(g("t"));
  if (g("c")) S.colors = g("c").split(",").map(decodeURIComponent);
  if (g("d")) S.depth = +g("d");
  if (g("sz")) S.maxSize = +g("sz");
  if (g("rs")) S.randomSize = g("rs") === "1";
  if (g("sp")) S.speed = +g("sp");
  if (g("rot")) S.rotate = +g("rot");
  if (g("tilt")) S.tilt = +g("tilt");
  if (g("ar")) S.autoRotate = g("ar") === "1";
}

// ===== ГЕНЕРАЦИЯ ХЭША =====
export function toLegoHash() {
  return (
    "#mode=lego&t=" +
    encodeURIComponent(S.text) +
    "&c=" +
    S.colors.map(encodeURIComponent).join(",") +
    "&d=" +
    S.depth +
    "&sz=" +
    S.maxSize +
    "&rs=" +
    (S.randomSize ? 1 : 0) +
    "&sp=" +
    S.speed +
    "&rot=" +
    S.rotate +
    "&tilt=" +
    S.tilt +
    "&ar=" +
    (S.autoRotate ? 1 : 0)
  );
}

// ===== РАСТЕРИЗАЦИЯ ТЕКСТА =====
function rasterizeToGrid(text, fontSize, step) {
  const off = document.createElement("canvas");
  const ctx = off.getContext("2d");
  const font = `900 ${fontSize}px "Nunito","Arial Black","Impact",sans-serif`;
  ctx.font = font;
  const m = ctx.measureText(text);
  const pad = 10;
  off.width = Math.ceil(m.width) + pad * 2;
  off.height = Math.ceil(fontSize * 1.4) + pad * 2;
  ctx.font = font;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.fillText(text, pad, pad);
  const id = ctx.getImageData(0, 0, off.width, off.height);
  const d = id.data;
  const gw = Math.ceil(off.width / step);
  const gh = Math.ceil(off.height / step);
  const grid = [];
  for (let y = 0; y < gh; y++) {
    grid[y] = new Uint8Array(gw);
    for (let x = 0; x < gw; x++) {
      const sx = Math.min(x * step, off.width - 1);
      const sy = Math.min(y * step, off.height - 1);
      if (d[(sy * off.width + sx) * 4] > 100) grid[y][x] = 1;
    }
  }
  return { grid, gw, gh };
}

// ===== УПАКОВКА КИРПИЧЕЙ =====
function canPlace(grid, occ, gx, gy, w, h, gw, gh) {
  if (gx + w > gw || gy + h > gh) return false;
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      if (!grid[gy + dy][gx + dx] || occ[gy + dy][gx + dx]) return false;
  return true;
}

function findBrickGreedy(grid, occ, gx, gy, maxS, gw, gh) {
  for (let area = maxS * maxS; area >= 2; area--) {
    const cands = [];
    for (let h = Math.min(maxS, area); h >= 1; h--) {
      if (area % h !== 0) continue;
      const w = area / h;
      if (w > maxS) continue;
      cands.push([w, h]);
    }
    for (let i = cands.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cands[i], cands[j]] = [cands[j], cands[i]];
    }
    for (const [w, h] of cands) {
      if (canPlace(grid, occ, gx, gy, w, h, gw, gh))
        return { x: gx, y: gy, w, h };
    }
  }
  return { x: gx, y: gy, w: 1, h: 1 };
}

function findBrickRandom(grid, occ, gx, gy, maxS, gw, gh) {
  const w1 = 1 + Math.floor(Math.random() * maxS);
  const h1 = 1 + Math.floor(Math.random() * maxS);
  if (canPlace(grid, occ, gx, gy, w1, h1, gw, gh))
    return { x: gx, y: gy, w: w1, h: h1 };
  for (let a = 0; a < 8; a++) {
    const rw = 1 + Math.floor(Math.random() * maxS);
    const rh = 1 + Math.floor(Math.random() * maxS);
    if (canPlace(grid, occ, gx, gy, rw, rh, gw, gh))
      return { x: gx, y: gy, w: rw, h: rh };
  }
  return findBrickGreedy(grid, occ, gx, gy, maxS, gw, gh);
}

function packBricks(grid, gw, gh, maxS, randomMode) {
  const occ = [];
  for (let y = 0; y < gh; y++) occ[y] = new Uint8Array(gw);
  const bricks = [];
  const finder = randomMode ? findBrickRandom : findBrickGreedy;
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      if (occ[gy][gx] || !grid[gy][gx]) continue;
      const b = finder(grid, occ, gx, gy, maxS, gw, gh);
      for (let dy = 0; dy < b.h; dy++)
        for (let dx = 0; dx < b.w; dx++) occ[gy + dy][gx + dx] = 1;
      bricks.push(b);
    }
  }
  return bricks;
}

// ===== АНИМАЦИЯ =====
function getSpeedMult() {
  return 0.3 + (S.speed - 1) * 0.3;
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function updateAssembly(now) {
  if (!anim || anim.done) return;
  const { bxM, stM, tbM, bx, st, tb, t0, dur } = anim;
  const sm = getSpeedMult();
  const elapsed = (now * 0.001 - t0) * sm;
  const ba = bxM.instanceMatrix.array;
  const sa = stM.instanceMatrix.array;
  const ta = tbM.instanceMatrix.array;
  let allDone = true;

  for (let i = 0; i < bx.n; i++) {
    const raw = (elapsed - bx.del[i]) / dur;
    if (raw < 1) allDone = false;
    const tc = raw < 0 ? 0 : raw > 1 ? 1 : raw;
    const e = Math.max(0.001, easeOutBack(tc));
    const omt = 1 - e;
    const i3 = i * 3;
    const b = i * 16;
    ba[b + 12] = bx.fp[i3] + bx.off[i3] * omt;
    ba[b + 13] =
      bx.fp[i3 + 1] + bx.off[i3 + 1] * omt + Math.sin(tc * Math.PI) * 1.2;
    ba[b + 14] = bx.fp[i3 + 2] + bx.off[i3 + 2] * omt;
    ba[b + 0] = bx.fs[i3] * e;
    ba[b + 5] = bx.fs[i3 + 1] * e;
    ba[b + 10] = bx.fs[i3 + 2] * e;
  }
  bxM.instanceMatrix.needsUpdate = true;

  const sDur = dur * 0.45;
  for (let i = 0; i < st.n; i++) {
    const raw = (elapsed - st.del[i]) / sDur;
    if (raw < 1) allDone = false;
    const tc = raw < 0 ? 0 : raw > 1 ? 1 : raw;
    const e = Math.max(0.001, easeOutBack(tc));
    const b = i * 16;
    sa[b + 0] = e;
    sa[b + 5] = e;
    sa[b + 10] = e;
  }
  stM.instanceMatrix.needsUpdate = true;

  for (let i = 0; i < tb.n; i++) {
    const raw = (elapsed - tb.del[i]) / sDur;
    if (raw < 1) allDone = false;
    const tc = raw < 0 ? 0 : raw > 1 ? 1 : raw;
    const e = Math.max(0.001, easeOutBack(tc));
    const b = i * 16;
    ta[b + 0] = e;
    ta[b + 5] = e;
    ta[b + 10] = e;
  }
  tbM.instanceMatrix.needsUpdate = true;

  if (allDone) {
    anim.done = true;
    for (let i = 0; i < bx.n; i++) {
      const i3 = i * 3;
      const b = i * 16;
      ba[b + 12] = bx.fp[i3];
      ba[b + 13] = bx.fp[i3 + 1];
      ba[b + 14] = bx.fp[i3 + 2];
      ba[b + 0] = bx.fs[i3];
      ba[b + 5] = bx.fs[i3 + 1];
      ba[b + 10] = bx.fs[i3 + 2];
    }
    bxM.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < st.n; i++) {
      const b = i * 16;
      sa[b + 0] = 1;
      sa[b + 5] = 1;
      sa[b + 10] = 1;
    }
    stM.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < tb.n; i++) {
      const b = i * 16;
      ta[b + 0] = 1;
      ta[b + 5] = 1;
      ta[b + 10] = 1;
    }
    tbM.instanceMatrix.needsUpdate = true;
  }
}

// ===== ОЧИСТКА =====
function clearMeshes() {
  anim = null;
  currentMeshes.forEach((m) => {
    textGroup.remove(m);
    if (m.geometry) m.geometry.dispose();
  });
  currentMeshes = [];
}

// ===== ГЛАВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ =====
export function generateLEGO() {
  if (!textGroup) return;

  const text = S.text.trim() || "LEGO";
  const colors = S.colors;
  const depth = S.depth;
  const maxSize = S.maxSize;
  const randomMode = S.randomSize;

  const { grid, gw, gh } = rasterizeToGrid(text, 140, 3);
  const bricks = packBricks(grid, gw, gh, maxSize, randomMode);
  if (!bricks.length) {
    showToast("Нет пикселей. Попробуйте другой текст.");
    return;
  }

  // Лимит кирпичей (проверяем по количеству боксов)
  const boxCount = bricks.length * depth;
  if (boxCount > MAX_BRICKS) {
    showToast(
      `Слишком много кирпичей (${boxCount}). Уменьшите глубину или текст (лимит: ${MAX_BRICKS}).`,
    );
    return;
  }

  let studCount = 0;
  let tubeCount = 0;
  for (const b of bricks) {
    studCount += b.w * b.h;
    tubeCount += b.w * b.h * (depth > 1 ? depth - 1 : 0);
  }

  const total = boxCount + studCount + tubeCount;

  clearMeshes();

  const boxMesh = new THREE.InstancedMesh(boxGeo, brickMat, boxCount);
  const studMesh = new THREE.InstancedMesh(studGeo, brickMat, studCount);
  const tubeMesh = new THREE.InstancedMesh(tubeGeo, brickMat, tubeCount);
  boxMesh.castShadow = true;
  boxMesh.receiveShadow = true;
  studMesh.castShadow = true;
  tubeMesh.castShadow = true;
  tubeMesh.receiveShadow = true;

  const bxFP = new Float32Array(boxCount * 3);
  const bxFS = new Float32Array(boxCount * 3);
  const bxOff = new Float32Array(boxCount * 3);
  const bxDel = new Float32Array(boxCount);
  const stDel = new Float32Array(studCount);
  const tbDel = new Float32Array(tubeCount);

  const dummy = new THREE.Object3D();
  const boxCols = new Float32Array(boxCount * 3);
  const studCols = new Float32Array(studCount * 3);
  const tubeCols = new Float32Array(tubeCount * 3);
  const halfW = (gw / 2) * UNIT;
  const halfH = (gh / 2) * UNIT;

  let minGX = Infinity,
    maxGX = -Infinity;
  for (const b of bricks) {
    minGX = Math.min(minGX, b.x);
    maxGX = Math.max(maxGX, b.x + b.w);
  }
  const rangeX = Math.max(maxGX - minGX, 1);

  let bi = 0,
    si = 0,
    ti = 0;
  const tmpColor = new THREE.Color();

  for (let z = 0; z < depth; z++) {
    const zp = z * (BRICK_H + LAYER_GAP);
    const isTop = z === depth - 1;
    const hasTubes = z > 0;

    for (let k = 0; k < bricks.length; k++) {
      const { x: bx, y: by, w, h } = bricks[k];

      tmpColor.set(colors[Math.floor(Math.random() * colors.length)]);

      const cx = (bx + w / 2) * UNIT - halfW;
      const cy = -((by + h / 2) * UNIT - halfH);

      const i3 = bi * 3;
      bxFP[i3] = cx;
      bxFP[i3 + 1] = cy;
      bxFP[i3 + 2] = zp;
      bxFS[i3] = w * UNIT - GAP;
      bxFS[i3 + 1] = h * UNIT - GAP;
      bxFS[i3 + 2] = 1;

      if (Math.random() < 0.55) {
        bxOff[i3] = (Math.random() - 0.5) * 14;
        bxOff[i3 + 1] = 18 + Math.random() * 24;
        bxOff[i3 + 2] = (Math.random() - 0.5) * 14;
      } else {
        const a = Math.random() * Math.PI * 2;
        const d = 22 + Math.random() * 20;
        bxOff[i3] = Math.cos(a) * d;
        bxOff[i3 + 1] = (Math.random() - 0.5) * 18;
        bxOff[i3 + 2] = Math.sin(a) * d;
      }

      const nx = (bx - minGX) / rangeX;
      const area = w * h;
      bxDel[bi] =
        nx * 0.9 + Math.random() * 0.5 + z * 0.06 + (7 - area) * 0.025;

      boxCols[bi * 3] = tmpColor.r;
      boxCols[bi * 3 + 1] = tmpColor.g;
      boxCols[bi * 3 + 2] = tmpColor.b;

      dummy.position.set(
        cx + bxOff[i3],
        cy + bxOff[i3 + 1],
        zp + bxOff[i3 + 2],
      );
      dummy.scale.set(0.001, 0.001, 0.001);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      boxMesh.setMatrixAt(bi, dummy.matrix);
      bi++;

      if (isTop) {
        const pDel = bxDel[bi - 1];
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            const sx = (bx + dx + 0.5) * UNIT - halfW;
            const sy = -((by + dy + 0.5) * UNIT - halfH);
            const sz = zp + BRICK_H / 2;

            stDel[si] = pDel + 0.2 + Math.random() * 0.1;
            studCols[si * 3] = tmpColor.r;
            studCols[si * 3 + 1] = tmpColor.g;
            studCols[si * 3 + 2] = tmpColor.b;

            dummy.position.set(sx, sy, sz);
            dummy.scale.set(0.001, 0.001, 0.001);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            studMesh.setMatrixAt(si, dummy.matrix);
            si++;
          }
        }
      }

      if (hasTubes) {
        const pDel = bxDel[bi - 1];
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            const sx = (bx + dx + 0.5) * UNIT - halfW;
            const sy = -((by + dy + 0.5) * UNIT - halfH);
            const tz = zp - BRICK_H / 2;

            tbDel[ti] = pDel + 0.2 + Math.random() * 0.1;
            tubeCols[ti * 3] = tmpColor.r;
            tubeCols[ti * 3 + 1] = tmpColor.g;
            tubeCols[ti * 3 + 2] = tmpColor.b;

            dummy.position.set(sx, sy, tz);
            dummy.scale.set(0.001, 0.001, -0.001);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            tubeMesh.setMatrixAt(ti, dummy.matrix);
            ti++;
          }
        }
      }
    }
  }

  boxMesh.instanceColor = new THREE.InstancedBufferAttribute(boxCols, 3);
  studMesh.instanceColor = new THREE.InstancedBufferAttribute(studCols, 3);
  tubeMesh.instanceColor = new THREE.InstancedBufferAttribute(tubeCols, 3);
  boxMesh.instanceMatrix.needsUpdate = true;
  studMesh.instanceMatrix.needsUpdate = true;
  tubeMesh.instanceMatrix.needsUpdate = true;

  textGroup.add(boxMesh);
  textGroup.add(studMesh);
  textGroup.add(tubeMesh);
  currentMeshes.push(boxMesh, studMesh, tubeMesh);

  anim = {
    t0: performance.now() * 0.001,
    dur: 0.65,
    done: false,
    bxM: boxMesh,
    stM: studMesh,
    tbM: tubeMesh,
    bx: { n: boxCount, fp: bxFP, fs: bxFS, off: bxOff, del: bxDel },
    st: { n: studCount, del: stDel },
    tb: { n: tubeCount, del: tbDel },
  };

  updateBrickCount(bricks.length);
  fitCamera();

  const sizes = {};
  bricks.forEach((b) => {
    const k = `${b.w}x${b.h}`;
    sizes[k] = (sizes[k] || 0) + 1;
  });
  const topSizes = Object.entries(sizes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map((e) => `${e[0]}:${e[1]}`)
    .join(", ");
  showToast(`${bricks.length} кирпичей (${topSizes})`);
}

// ===== КАМЕРА =====
let camDist = 35;
let targetCamPos = new THREE.Vector3(0, 0, 35);
let isLerping = false;
let initialRot = S.rotate;
let initialTilt = S.tilt;

function calcCamPos(rotDeg, tiltDeg, dist) {
  const r = THREE.MathUtils.degToRad(rotDeg);
  const t = THREE.MathUtils.degToRad(tiltDeg);
  return new THREE.Vector3(
    dist * Math.cos(t) * Math.sin(r),
    dist * Math.sin(t),
    dist * Math.cos(t) * Math.cos(r),
  );
}

function applyInitialCamera() {
  camDist = 35;
  targetCamPos = calcCamPos(initialRot, initialTilt, camDist);
  camera.position.copy(targetCamPos);
  controls.target.set(0, 0, 0);
  controls.update();
  isLerping = false;
}

function fitCamera() {
  if (!currentMeshes.length) return;
  const box = new THREE.Box3().setFromObject(textGroup);
  const size = new THREE.Vector3();
  box.getSize(size);
  camDist = Math.max(Math.max(size.x, size.y, size.z) * 1.6, 12);
  targetCamPos = calcCamPos(initialRot, initialTilt, camDist);
  isLerping = true;
}

// ===== ИНИЦИАЛИЗАЦИЯ СЦЕНЫ =====
export function initLegoScene(canvasEl) {
  canvas = canvasEl || document.getElementById("legoCanvas");
  if (!canvas) {
    console.error("LEGO: canvas not found");
    return;
  }

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  // Scene
  scene = new THREE.Scene();
  scene.environment = createEnvMap();

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );
  camera.position.set(0, 0, 35);

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 120;
  controls.autoRotate = S.autoRotate;
  controls.autoRotateSpeed = 2.0;

  // Lights
  scene.add(new THREE.AmbientLight(0x404060, 0.5));
  scene.add(new THREE.HemisphereLight(0xffeedd, 0x0a0a20, 0.7));

  const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
  dirLight.position.set(8, 14, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 60;
  dirLight.shadow.camera.left = -25;
  dirLight.shadow.camera.right = 25;
  dirLight.shadow.camera.top = 25;
  dirLight.shadow.camera.bottom = -25;
  dirLight.shadow.bias = -0.001;
  scene.add(dirLight);

  const fill = new THREE.DirectionalLight(0x8899cc, 0.35);
  fill.position.set(-8, 4, -6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffcc88, 0.25);
  rim.position.set(-2, -6, -10);
  scene.add(rim);

  // Text group
  textGroup = new THREE.Group();
  scene.add(textGroup);

  // Resize
  window.addEventListener("resize", onResize);

  // Generate
  applyInitialCamera();
  generateLEGO();

  // Animation loop
  function loop(now) {
    animLoopId = requestAnimationFrame(loop);
    updateAssembly(now);
    if (isLerping) {
      camera.position.lerp(targetCamPos, 0.07);
      controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.07);
      if (camera.position.distanceTo(targetCamPos) < 0.05) {
        camera.position.copy(targetCamPos);
        controls.target.set(0, 0, 0);
        isLerping = false;
      }
    }
    controls.update();
    renderer.render(scene, camera);
  }
  animLoopId = requestAnimationFrame(loop);
}

export function destroyLegoScene() {
  if (animLoopId) {
    cancelAnimationFrame(animLoopId);
    animLoopId = null;
  }
  clearMeshes();
  if (controls) controls.dispose();
  if (renderer) renderer.dispose();
  scene = null;
  camera = null;
  controls = null;
  renderer = null;
  textGroup = null;
  canvas = null;
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}

// ===== ПУБЛИЧНОЕ API =====
export function updateLegoSettings(newSettings) {
  Object.assign(S, newSettings);
  if (newSettings.autoRotate !== undefined && controls) {
    controls.autoRotate = newSettings.autoRotate;
  }
  if (newSettings.rotate !== undefined || newSettings.tilt !== undefined) {
    initialRot = S.rotate;
    initialTilt = S.tilt;
    targetCamPos = calcCamPos(initialRot, initialTilt, camDist);
    isLerping = true;
  }
}

export function getLegoSettings() {
  return { ...S };
}

// ===== UI-ФУНКЦИИ =====
function updateBrickCount(count) {
  const el = document.getElementById("legoBrickCount");
  if (el) {
    const span = el.querySelector("span");
    if (span) span.textContent = count.toLocaleString("ru-RU");
  }
}

function showToast(msg) {
  const t = document.getElementById("legoToast");
  if (!t) {
    console.log("[LEGO]", msg);
    return;
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._to);
  showToast._to = setTimeout(() => t.classList.remove("show"), 2800);
}

// ===== АВТОЗАПУСК В OBS-РЕЖИМЕ =====
if (isOBSMode()) {
  parseHash();
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => initLegoScene(), 100);
  });
  if (document.readyState !== "loading") {
    setTimeout(() => initLegoScene(), 100);
  }
}
