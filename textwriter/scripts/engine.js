// engine.js

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const NS = "http://www.w3.org/2000/svg";
function svgEl(tag) {
  return document.createElementNS(NS, tag);
}

export const D = {
  font: "IBM Plex Mono",
  visual: "typewriter",
  appear: "none",
  disappear: "none",
  text: "Welcome to the stream\nToday we're doing something special\nLet's get started",
  speed: 55,
  aspeed: 55,
  dspeed: 55,
  size: 42,
  lh: 140,
  color: "#ffffff",
  bold: true,
  italic: false,
  align: "left",
  glow: false,
  gc: "#d4a054",
  gi: 12,
  stroke: false,
  sc: "#000000",
  sw: 2,
  cursor: "block",
  cc: "#d4a054",
  pos: "bl",
  margin: 40,
  sound: false,
  loop: false,
  pause: 700,
  ptype: "snow",
  pcolor: "#ffffff",
  pspd: 55,
  fdir: "up",
  fint: 50,
  sdns: 50,
  autoTrigger: false,
  activityTime: 10,
  betweenTime: 60,
  colors: ["#ff00ff", "#00ffff"],
  nsw: 3,
  ngi: 4,
  nsGradSpeed: 55,
  dpc: "#ffffff",
  dpsz: 6,
  dpspd: 100,
};

export let S = { ...D };
let playing = false,
  timer = null,
  animFrame = null,
  audioCtx = null,
  particles = [];

const SELF_ENTRANCE = new Set([
  "typewriter",
  "matrix",
  "stamp",
  "scanner",
  "pour",
  "neonstroke",
  "assemble", // Moved to Self Entrance
]);
const APPEAR_CLS = {
  "slide-left": "fx-sl",
  "slide-right": "fx-sr",
  "fall-down": "fx-fd",
  "rise-up": "fx-ru",
  "rotate-in": "fx-ri",
  "blur-in": "fx-bi",
  "pixel-in": "fx-pi",
  "fade-in": "fx-fi",
  "mask-stripe": "fx-ms",
  "zoom-in": "fx-zi",
};
const EXIT_CLS = {
  "slide-left": "fx-sl-exit",
  "slide-right": "fx-sr-exit",
  "fall-down": "fx-fd-exit",
  "rise-up": "fx-ru-exit",
  "rotate-out": "fx-ri-exit",
  "blur-out": "fx-bi-exit",
  "pixel-out": "fx-pi-exit",
  "fade-out": "fx-fi-exit",
  "mask-stripe-exit": "fx-ms-exit",
  "zoom-out": "fx-zi-exit",
  "shrink-point": "fx-shrink-exit",
};

const APPEAR_DUR = {
  "slide-left": 700,
  "slide-right": 700,
  "fall-down": 700,
  "rise-up": 700,
  "rotate-in": 800,
  "blur-in": 900,
  "pixel-in": 1000,
  "mask-stripe": 1000,
  "zoom-in": 700,
};
const EXIT_DUR = {
  ...APPEAR_DUR,
  "mask-stripe-exit": 1000,
  "shrink-point": 600,
  "glass-shatter": 1800,
  "particle-explode": 1000,
  scatter: 1400, // Added for scatter
};

function vm(val) {
  return val / 55;
}
function fmtTime(sec) {
  if (sec === 0) return "0s";
  if (sec < 60) return sec + "s";
  const m = Math.floor(sec / 60),
    s = sec % 60;
  return s > 0 ? m + "m " + s + "s" : m + "m";
}

export function toHash() {
  const l = S.text
    .split("\n")
    .map((x) => encodeURIComponent(x))
    .join("|");
  return (
    "#v=" +
    S.visual +
    "&ap=" +
    S.appear +
    "&di=" +
    S.disappear +
    "&t=" +
    l +
    "&f=" +
    encodeURIComponent(S.font) +
    "&sp=" +
    S.speed +
    "&as=" +
    S.aspeed +
    "&ds=" +
    S.dspeed +
    "&sz=" +
    S.size +
    "&lh=" +
    S.lh +
    "&c=" +
    encodeURIComponent(S.color) +
    "&b=" +
    (S.bold ? 1 : 0) +
    "&i=" +
    (S.italic ? 1 : 0) +
    "&a=" +
    S.align +
    "&gl=" +
    (S.glow ? 1 : 0) +
    "&gc=" +
    encodeURIComponent(S.gc) +
    "&gi=" +
    S.gi +
    "&st=" +
    (S.stroke ? 1 : 0) +
    "&sc=" +
    encodeURIComponent(S.sc) +
    "&sw=" +
    S.sw +
    "&cs=" +
    S.cursor +
    "&cc=" +
    encodeURIComponent(S.cc) +
    "&p=" +
    S.pos +
    "&m=" +
    S.margin +
    "&sn=" +
    (S.sound ? 1 : 0) +
    "&lo=" +
    (S.loop ? 1 : 0) +
    "&lp=" +
    S.pause +
    "&pt=" +
    S.ptype +
    "&pc=" +
    encodeURIComponent(S.pcolor) +
    "&ps=" +
    S.pspd +
    "&fd=" +
    S.fdir +
    "&fi=" +
    S.fint +
    "&sd=" +
    S.sdns +
    "&atr=" +
    (S.autoTrigger ? 1 : 0) +
    "&atm=" +
    S.activityTime +
    "&btm=" +
    S.betweenTime +
    "&nc=" +
    S.colors.map((c) => encodeURIComponent(c)).join("|") +
    "&nsw=" +
    S.nsw +
    "&ngi=" +
    S.ngi +
    "&ngs=" +
    S.nsGradSpeed +
    "&dpc=" +
    encodeURIComponent(S.dpc) +
    "&dpsz=" +
    S.dpsz +
    "&dpspd=" +
    S.dpspd
  );
}

export function parseHash() {
  const h = location.hash.slice(1);
  if (!h || h === "config") return;
  const p = new URLSearchParams(h),
    g = (k) => p.get(k);
  if (g("v")) S.visual = g("v");
  if (g("ap")) S.appear = g("ap");
  if (g("di")) S.disappear = g("di");
  if (g("t")) S.text = g("t").replace(/\|/g, "\n");
  if (g("sp")) S.speed = +g("sp");
  if (g("as")) S.aspeed = +g("as");
  if (g("ds")) S.dspeed = +g("ds");
  if (g("sz")) S.size = +g("sz");
  if (g("lh")) S.lh = +g("lh");
  if (g("c")) S.color = g("c");
  S.bold = g("b") === "1";
  S.italic = g("i") === "1";
  if (g("a")) S.align = g("a");
  S.glow = g("gl") === "1";
  if (g("gc")) S.gc = g("gc");
  if (g("gi")) S.gi = +g("gi");
  S.stroke = g("st") === "1";
  if (g("sc")) S.sc = g("sc");
  if (g("sw")) S.sw = +g("sw");
  if (g("cs")) S.cursor = g("cs");
  if (g("cc")) S.cc = g("cc");
  if (g("p")) S.pos = g("p");
  if (g("m")) S.margin = +g("m");
  S.sound = g("sn") === "1";
  S.loop = g("lo") === "1";
  if (g("lp")) S.pause = +g("lp");
  if (g("pt")) S.ptype = g("pt");
  if (g("pc")) S.pcolor = g("pc");
  if (g("ps")) S.pspd = +g("ps");
  if (g("fd")) S.fdir = g("fd");
  if (g("fi")) S.fint = +g("fi");
  if (g("sd")) S.sdns = +g("sd");
  S.autoTrigger = g("atr") === "1";
  if (g("atm")) S.activityTime = +g("atm");
  if (g("btm")) S.betweenTime = +g("btm");
  if (g("nc")) {
    S.colors = g("nc").split("|");
  } else if (g("nc1") && g("nc2")) {
    S.colors = [g("nc1"), g("nc2")];
  }
  if (g("nsw")) S.nsw = +g("nsw");
  if (g("ngi")) S.ngi = +g("ngi");
  if (g("ngs")) S.nsGradSpeed = +g("ngs");
  if (g("dpc")) S.dpc = g("dpc");
  if (g("dpsz")) S.dpsz = +g("dpsz");
  if (g("dpspd")) S.dpspd = +g("dpspd");
}

export function fullURL() {
  return location.href.split("#")[0].split("?")[0] + toHash();
}

const dynCSS = document.createElement("style");
document.head.appendChild(dynCSS);
function injCSS(c) {
  dynCSS.textContent += c;
}
function clrCSS() {
  dynCSS.textContent = "";
}

function curH(id) {
  const c = S.cc,
    e = id || "oc";
  switch (S.cursor) {
    case "block":
      return `<span id="${e}" style="background:${c};color:${c}">&nbsp;</span>`;
    case "line":
      return `<span id="${e}" style="border-left:2px solid ${c};margin-left:1px">&nbsp;</span>`;
    case "underscore":
      return `<span id="${e}" style="border-bottom:2px solid ${c}">&nbsp;</span>`;
    default:
      return "";
  }
}

function applyStyle(tgt) {
  const m = S.margin;
  let sh = "none";
  if (
    S.glow &&
    !["neon", "glowpulse", "fire", "chrome", "ice", "neonstroke"].includes(
      S.visual,
    )
  )
    sh = `0 0 ${S.gi}px ${S.gc}, 0 0 ${S.gi * 2.5}px ${S.gc}`;
  Object.assign(tgt.style, {
    fontFamily: `"${S.font}", sans-serif`,
    fontSize: S.size + "px",
    lineHeight: String(S.lh / 100),
    color: S.color,
    fontWeight: S.bold ? "700" : "400",
    fontStyle: S.italic ? "italic" : "normal",
    textAlign: S.align,
    textShadow: sh,
    webkitTextStroke: S.stroke ? `${S.sw}px ${S.sc}` : "",
    webkitBackgroundClip: "",
    webkitTextFillColor: "",
    background: "",
    backgroundSize: "",
    filter: "",
    clipPath: "",
    animation: "",
    left: "auto",
    right: "auto",
    top: "auto",
    bottom: "auto",
    transform: "none",
  });
  const pm = {
    tl: { top: m, left: m },
    tc: { top: m, left: "50%", transform: "translateX(-50%)" },
    tr: { top: m, right: m },
    ml: { top: "50%", left: m, transform: "translateY(-50%)" },
    mc: { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
    mr: { top: "50%", right: m, transform: "translateY(-50%)" },
    bl: { bottom: m, left: m },
    bc: { bottom: m, left: "50%", transform: "translateX(-50%)" },
    br: { bottom: m, right: m },
  };
  Object.assign(tgt.style, pm[S.pos] || pm.bl);
  const par = tgt.parentElement;
  if (par) tgt.style.maxWidth = `calc(${par.clientWidth}px - ${m * 2}px)`;
}

function setLines(tgt, cls, sty) {
  const lines = S.text.split("\n").filter((l) => l.trim());
  tgt.innerHTML = lines
    .map(
      (l) => `<div class="${cls || ""}" style="${sty || ""}">${esc(l)}</div>`,
    )
    .join("");
}

function sizeCV(cv) {
  if (!cv || !cv.parentElement) return;
  cv.width = cv.parentElement.clientWidth;
  cv.height = cv.parentElement.clientHeight;
}

function clickSnd() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const t = audioCtx.currentTime,
    o = audioCtx.createOscillator(),
    g = audioCtx.createGain(),
    f = audioCtx.createBiquadFilter();
  o.type = "square";
  o.frequency.value = 600 + Math.random() * 600;
  f.type = "bandpass";
  f.frequency.value = 2200;
  f.Q.value = 0.8;
  g.gain.setValueAtTime(0.035, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  o.connect(f);
  f.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.025);
}

function hexToRGB(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function smokeNoise(x, y, t) {
  return (
    Math.sin(x * 0.008 + t * 0.4) * Math.cos(y * 0.012 + t * 0.25) * 0.5 +
    Math.sin(x * 0.015 - t * 0.15) * Math.cos(y * 0.008 + t * 0.35) * 0.3 +
    Math.sin((x + y) * 0.005 + t * 0.5) * 0.2
  );
}

function getSVGTextMetrics(par, S) {
  const W = par.clientWidth || window.innerWidth;
  const H = par.clientHeight || window.innerHeight;
  const lines = S.text.split("\n").filter((l) => l.trim());
  const fontSize = S.size;
  const lineH = (fontSize * S.lh) / 100;
  const totalH = lines.length * lineH;
  const m = S.margin;
  let bx, by;
  switch (S.pos) {
    case "tl":
      bx = m;
      by = m;
      break;
    case "tc":
      bx = W / 2;
      by = m;
      break;
    case "tr":
      bx = W - m;
      by = m;
      break;
    case "ml":
      bx = m;
      by = (H - totalH) / 2;
      break;
    case "mc":
      bx = W / 2;
      by = (H - totalH) / 2;
      break;
    case "mr":
      bx = W - m;
      by = (H - totalH) / 2;
      break;
    case "bl":
      bx = m;
      by = H - totalH - m;
      break;
    case "bc":
      bx = W / 2;
      by = H - totalH - m;
      break;
    case "br":
      bx = W - m;
      by = H - totalH - m;
      break;
    default:
      bx = m;
      by = H - totalH - m;
  }
  const anchor =
    S.align === "center" ? "middle" : S.align === "right" ? "end" : "start";
  const lineObjs = lines.map((line, i) => ({
    text: line,
    x: bx,
    y: by + fontSize * 0.82 + i * lineH,
    anchor: anchor,
  }));
  return { W, H, lines: lineObjs };
}

/* ==================== EFFECTS ==================== */
const FX = {
  typewriter(tgt) {
    playing = true;
    tgt.style.whiteSpace = "pre-wrap";
    tgt.innerHTML = curH();
    let li = 0,
      ci = 0,
      txt = "",
      lines = S.text.split("\n");
    const baseDelay = Math.max(5, 3025 / S.speed);
    (function tick() {
      if (!playing) return;
      if (li >= lines.length) {
        // Stop animation, but do NOT trigger disappear. Just stay.
        return;
      }
      const ln = lines[li];
      if (!ln || !ln.trim()) {
        li++;
        if (ci === 0 && li > 0) txt += "\n";
        timer = setTimeout(tick, 50);
        return;
      }
      if (ci === 0 && li > 0) txt += "\n";
      if (ci < ln.length) {
        txt += ln[ci];
        ci++;
        tgt.innerHTML = esc(txt) + curH();
        if (S.sound) clickSnd();
        let d = baseDelay;
        const ch = ln[ci - 1];
        if (".!?".includes(ch)) d *= 5;
        else if (",;:".includes(ch)) d *= 2.5;
        else if (ch === " ") d *= 0.4;
        timer = setTimeout(tick, d);
      } else {
        li++;
        ci = 0;
        timer = setTimeout(tick, S.pause);
      }
    })();
  },
  neon(tgt) {
    const sm = vm(S.speed),
      dur = (3 / sm).toFixed(3);
    setLines(tgt, "fx-neon");
    tgt
      .querySelectorAll(".fx-neon")
      .forEach((el) => (el.style.animationDuration = dur + "s"));
    tgt.style.textShadow = `0 0 7px ${S.color},0 0 15px ${S.color},0 0 30px ${S.color},0 0 60px ${S.color}`;
    playing = true;
  },
  glitch(tgt) {
    const sm = vm(S.speed),
      dur = (2 / sm).toFixed(3);
    injCSS(`.fx-glitch::before,.fx-glitch::after{animation-duration:${dur}s`);
    const lines = S.text.split("\n");
    tgt.innerHTML = lines
      .map(
        (l) => `<div class="fx-glitch" data-text="${esc(l)}">${esc(l)}</div>`,
      )
      .join("");
    playing = true;
  },
  smoke(tgt, cv) {
    setLines(tgt);
    tgt.style.opacity = "0";
    sizeCV(cv);
    const ctx = cv.getContext("2d");
    playing = true;
    let age = 0;
    const sm = vm(S.speed),
      density = (S.sdns || 50) / 50;
    (function draw() {
      if (!playing) return;
      age++;
      const spawnCount = Math.max(1, Math.floor(2 * density));
      if (age % 2 === 0) {
        for (let i = 0; i < spawnCount; i++) {
          const bx = cv.width * 0.1 + Math.random() * cv.width * 0.8,
            by = cv.height * 0.1 + Math.random() * cv.height * 0.8;
          particles.push({
            x: bx,
            y: by,
            r: 25 + Math.random() * 55,
            baseX: bx,
            baseY: by,
            age: 0,
            maxAge: 180 + Math.random() * 250,
            phase: Math.random() * Math.PI * 2,
            drift: 0.3 + Math.random() * 0.6,
          });
        }
      }
      ctx.clearRect(0, 0, cv.width, cv.height);
      const revealT = Math.max(60, 180 / density / sm);
      const revealProg = Math.min(
        1,
        Math.max(0, (age - revealT * 0.4) / (revealT * 0.8)),
      );
      const smokeAlpha = Math.max(0, 1 - revealProg * 1.3);
      particles.forEach((p) => {
        p.age++;
        const life = 1 - p.age / p.maxAge;
        if (life <= 0) return;
        const t = age * 0.008 * sm;
        const nx = smokeNoise(p.baseX, p.baseY, t + p.phase) * 35 * p.drift;
        const ny =
          smokeNoise(p.baseX + 500, p.baseY + 500, t + p.phase) * 25 * p.drift -
          p.age * 0.04 * sm;
        p.x = p.baseX + nx;
        p.y = p.baseY + ny;
        const curR = p.r + p.age * 0.18,
          a = life * 0.1 * smokeAlpha * density;
        if (a > 0.002) {
          const grad = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            Math.max(1, curR),
          );
          grad.addColorStop(0, `rgba(170,170,180,${a})`);
          grad.addColorStop(0.35, `rgba(150,150,160,${a * 0.65})`);
          grad.addColorStop(0.7, `rgba(130,130,140,${a * 0.25})`);
          grad.addColorStop(1, `rgba(110,110,120,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, curR), 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      });
      particles = particles.filter((p) => p.age < p.maxAge);
      if (particles.length > 250) particles.splice(0, 50);
      tgt.style.opacity = String(revealProg);
      animFrame = requestAnimationFrame(draw);
    })();
  },
  fire(tgt, cv) {
    const sm = vm(S.speed);
    setLines(tgt, "fx-fire-text");
    tgt.style.color = "#ffdd88";
    const dir = S.fdir || "up";
    const shadowMap = {
      up: "0 0 10px #ff6600, 0 -4px 20px #ff3300",
      "up-left": "0 0 10px #ff6600, -4px -4px 20px #ff3300",
      "up-right": "0 0 10px #ff6600, 4px -4px 20px #ff3300",
      down: "0 0 10px #ff6600, 0 4px 20px #ff3300",
      left: "0 0 10px #ff6600, -4px 0 20px #ff3300",
      right: "0 0 10px #ff6600, 4px 0 20px #ff3300",
    };
    tgt.style.textShadow = shadowMap[dir] || shadowMap["up"];
    tgt
      .querySelectorAll(".fx-fire-text")
      .forEach(
        (el) => (el.style.animationDuration = Math.max(0.02, 0.12 / sm) + "s"),
      );
    sizeCV(cv);
    const ctx = cv.getContext("2d");
    playing = true;
    const intensity = (S.fint || 50) / 50;
    const dirVecs = {
      up: { vx: 0, vy: -1 },
      "up-left": { vx: -0.6, vy: -1 },
      "up-right": { vx: 0.6, vy: -1 },
      down: { vx: 0, vy: 1 },
      left: { vx: -1, vy: -0.2 },
      right: { vx: 1, vy: -0.2 },
    };
    const dv = dirVecs[dir] || dirVecs["up"];
    (function draw() {
      if (!playing) return;
      const r = tgt.getBoundingClientRect(),
        cvR = cv.getBoundingClientRect();
      if (r.width > 0) {
        const count = Math.floor(3 + intensity * 6);
        for (let i = 0; i < count; i++) {
          let px, py;
          if (dv.vy < 0) {
            px = r.left - cvR.left + Math.random() * r.width;
            py = r.bottom - cvR.top;
          } else if (dv.vy > 0) {
            px = r.left - cvR.left + Math.random() * r.width;
            py = r.top - cvR.top;
          } else {
            px = r.left - cvR.left + Math.random() * r.width;
            py = r.top - cvR.top + Math.random() * r.height;
          }
          if (dv.vx < 0 && !dv.vy) {
            px = r.right - cvR.left;
            py = r.top - cvR.top + Math.random() * r.height;
          }
          if (dv.vx > 0 && !dv.vy) {
            px = r.left - cvR.left;
            py = r.top - cvR.top + Math.random() * r.height;
          }
          const spd = (1.5 + Math.random() * 3) * intensity * sm;
          particles.push({
            x: px,
            y: py,
            r: 1.5 + Math.random() * 4 * intensity,
            vx: dv.vx * spd + (Math.random() - 0.5) * 1.2 * intensity * sm,
            vy: dv.vy * spd + (Math.random() - 0.5) * 0.8 * intensity * sm,
            a: 1,
            life: 1,
            decay: (0.008 + Math.random() * 0.014) / Math.max(0.3, intensity),
            hue: dir.includes("down")
              ? 0 + Math.random() * 15
              : 15 + Math.random() * 35,
          });
        }
      }
      ctx.clearRect(0, 0, cv.width, cv.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.99;
        p.vx *= 0.98;
        p.r *= 0.997;
        p.life -= p.decay;
        if (p.life > 0) {
          const bri = 45 + p.life * 40;
          const g = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            Math.max(0.5, p.r),
          );
          g.addColorStop(0, `hsla(${p.hue},100%,${bri}%,${p.life * 0.9})`);
          g.addColorStop(
            0.4,
            `hsla(${p.hue + 8},100%,${bri - 12}%,${p.life * 0.55})`,
          );
          g.addColorStop(1, `hsla(${p.hue + 20},100%,18%,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }
      });
      particles = particles.filter((p) => p.life > 0);
      if (particles.length > 700) particles.splice(0, 150);
      animFrame = requestAnimationFrame(draw);
    })();
  },
  ice(tgt, cv) {
    const sm = vm(S.speed),
      dur = (3 / sm).toFixed(3);
    setLines(tgt, "fx-ice");
    tgt
      .querySelectorAll(".fx-ice")
      .forEach((el) => (el.style.animationDuration = dur + "s"));
    tgt.style.color = "#a8d8ff";
    tgt.style.textShadow = "0 0 8px #4488cc, 0 0 20px #2266aa";
    sizeCV(cv);
    const ctx = cv.getContext("2d");
    playing = true;
    const cracks = [];
    (function init() {
      const r = tgt.getBoundingClientRect(),
        cvR = cv.getBoundingClientRect();
      if (r.width === 0) {
        requestAnimationFrame(init);
        return;
      }
      for (let i = 0; i < 10; i++) {
        const pts = [
          {
            x: r.left - cvR.left + Math.random() * r.width,
            y: r.top - cvR.top + Math.random() * r.height,
          },
        ];
        for (let j = 0; j < 4 + Math.random() * 6; j++) {
          const prev = pts[pts.length - 1];
          pts.push({
            x: prev.x + (Math.random() - 0.5) * 55,
            y: prev.y + (Math.random() - 0.5) * 35,
          });
        }
        cracks.push({ pts, delay: i * (250 / sm) });
      }
      let start = Date.now();
      (function draw() {
        if (!playing) return;
        const elapsed = Date.now() - start;
        ctx.clearRect(0, 0, cv.width, cv.height);
        cracks.forEach((cr) => {
          const show = Math.min(
            cr.pts.length,
            Math.floor((elapsed - cr.delay) / (90 / sm)),
          );
          if (show < 2) return;
          ctx.beginPath();
          ctx.moveTo(cr.pts[0].x, cr.pts[0].y);
          for (let i = 1; i < show; i++) ctx.lineTo(cr.pts[i].x, cr.pts[i].y);
          ctx.strokeStyle = "rgba(200,230,255,0.5)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,0.25)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
        animFrame = requestAnimationFrame(draw);
      })();
    })();
  },
  chrome(tgt) {
    const sm = vm(S.speed),
      dur = (3 / sm).toFixed(3);
    setLines(tgt, "fx-chrome");
    tgt
      .querySelectorAll(".fx-chrome")
      .forEach((el) => (el.style.animationDuration = dur + "s"));
    playing = true;
  },
  wave(tgt) {
    const sm = vm(S.speed),
      dur = (2 / sm).toFixed(3);
    const lines = S.text.split("\n");
    let h = "";
    lines.forEach((ln, li) => {
      if (li > 0) h += "<br>";
      for (let i = 0; i < ln.length; i++) {
        const d = (((li * 20 + i) * 0.06) / sm).toFixed(3);
        h += `<span class="fx-wl" style="animation-delay:${d}s;animation-duration:${dur}s">${esc(ln[i])}</span>`;
      }
    });
    tgt.innerHTML = h;
    playing = true;
  },
  shake(tgt) {
    const sm = vm(S.speed),
      dur = Math.max(0.015, 0.06 / sm).toFixed(4);
    setLines(tgt, "fx-shake");
    tgt
      .querySelectorAll(".fx-shake")
      .forEach((el) => (el.style.animationDuration = dur + "s"));
    playing = true;
  },
  ripple(tgt) {
    const sm = vm(S.speed),
      dur = (1.5 / sm).toFixed(3);
    setLines(tgt, "fx-ripple");
    tgt
      .querySelectorAll(".fx-ripple")
      .forEach((el) => (el.style.animationDuration = dur + "s"));
    playing = true;
  },
  glowpulse(tgt) {
    const sm = vm(S.speed),
      dur = (2 / sm).toFixed(3);
    const c = S.glow ? S.gc : S.color;
    injCSS(
      `@keyframes fxGP{0%,100%{text-shadow:0 0 5px ${c}}50%{text-shadow:0 0 20px ${c},0 0 45px ${c},0 0 80px ${c}}}`,
    );
    setLines(tgt);
    tgt.style.animation = `fxGP ${dur}s ease-in-out infinite`;
    playing = true;
  },
  shadow(tgt) {
    const sm = vm(S.speed),
      dur = (3 / sm).toFixed(3);
    injCSS(
      `@keyframes fxShd{0%{text-shadow:4px 4px 0 rgba(0,0,0,.6)}25%{text-shadow:-4px 3px 0 rgba(0,0,0,.6)}50%{text-shadow:-3px -4px 0 rgba(0,0,0,.6)}75%{text-shadow:3px -3px 0 rgba(0,0,0,.6)}100%{text-shadow:4px 4px 0 rgba(0,0,0,.6)}}`,
    );
    setLines(tgt);
    tgt.style.animation = `fxShd ${dur}s ease-in-out infinite`;
    playing = true;
  },

  // SCATTER: Now acts as a Disappearance Effect (Exit)
  scatter(tgt) {
    const sm = vm(S.speed),
      durS = (1.4 / sm).toFixed(3),
      delayBase = 0.03 / sm;
    const lines = S.text.split("\n");
    let h = "",
      idx = 0;
    lines.forEach((ln, li) => {
      if (li > 0) h += "<br>";
      for (let i = 0; i < ln.length; i++) {
        const sx = (Math.random() - 0.5) * 1200,
          sy = (Math.random() - 0.5) * 800,
          sr = (Math.random() - 0.5) * 1080;
        h += `<span class="fx-scl" style="--sx:${sx}px;--sy:${sy}px;--sr:${sr}deg;animation-delay:${(idx * delayBase).toFixed(3)}s;animation-duration:${durS}s">${esc(ln[i])}</span>`;
        idx++;
      }
    });
    tgt.innerHTML = h;
    playing = true;
    const totalAnimTime = (idx * delayBase + parseFloat(durS)) * 1000 + 500;
    timer = setTimeout(() => {
      stopFx(tgt, $("cv"), $("sl"));
      handleNextCycle(tgt);
    }, totalAnimTime);
  },

  // ASSEMBLE: Now acts as an Appearance Effect
  assemble(tgt) {
    const sm = vm(S.speed),
      durA = (0.7 / sm).toFixed(3),
      delayBase = 0.04 / sm;
    const lines = S.text.split("\n");
    let h = "",
      idx = 0;
    lines.forEach((ln, li) => {
      if (li > 0) h += "<br>";
      for (let i = 0; i < ln.length; i++) {
        const sx = (Math.random() - 0.5) * 900,
          sy = (Math.random() - 0.5) * 600,
          sr = (Math.random() - 0.5) * 720;
        h += `<span class="fx-al" style="--sx:${sx}px;--sy:${sy}px;--sr:${sr}deg;animation-delay:${(idx * delayBase).toFixed(3)}s;animation-duration:${durA}s">${esc(ln[i])}</span>`;
        idx++;
      }
    });
    tgt.innerHTML = h;
    playing = true;
  },

  pour(tgt) {
    const sm = vm(S.speed),
      durP = (0.9 / sm).toFixed(3),
      delayBase = 0.05 / sm;
    const lines = S.text.split("\n");
    let h = "",
      idx = 0;
    lines.forEach((ln, li) => {
      if (li > 0) h += "<br>";
      for (let i = 0; i < ln.length; i++) {
        const pr = (Math.random() - 0.5) * 25,
          px = (Math.random() - 0.5) * 50;
        h += `<span class="fx-pour" style="--pr:${pr}deg;--px:${px}px;animation-delay:${(idx * delayBase).toFixed(3)}s;animation-duration:${durP}s">${esc(ln[i])}</span>`;
        idx++;
      }
    });
    tgt.innerHTML = h;
    playing = true;
    // Removed auto-disappear timer
  },
  stamp(tgt) {
    const sm = vm(S.speed),
      durSt = Math.max(0.02, 0.12 / sm).toFixed(4);
    const pauseSt = Math.max(100, 800 / sm);
    const lines = S.text.split("\n").filter((l) => l.trim());
    let li = 0;
    playing = true;
    (function go() {
      if (!playing) return;
      if (li >= lines.length) {
        // Stop, don't disappear
        return;
      }
      const d = document.createElement("div");
      d.className = "fx-stamp";
      d.textContent = lines[li];
      d.style.animationDuration = durSt + "s";
      tgt.appendChild(d);
      li++;
      timer = setTimeout(go, pauseSt);
    })();
  },
  scanner(tgt, sl) {
    const sm = vm(S.speed),
      dur = Math.max(200, 1500 / sm);
    setLines(tgt);
    tgt.style.clipPath = "inset(0 100% 0 0)";
    tgt.style.transition = "none";
    void tgt.offsetWidth;
    tgt.style.transition = `clip-path ${dur}ms linear`;
    tgt.style.clipPath = "inset(0 0% 0 0)";
    sl.style.transition = "none";
    sl.style.opacity = "1";
    sl.style.top = "0";
    sl.style.left = "0";
    sl.style.width = "3px";
    sl.style.height = "100%";
    void sl.offsetWidth;
    sl.style.transition = `left ${dur}ms linear, opacity .3s ease`;
    sl.style.left = "100%";
    playing = true;
    setTimeout(() => (sl.style.opacity = "0"), dur);
    // Removed auto-disappear timer
  },
  rainbow(tgt) {
    const sm = vm(S.speed),
      dur = (4 / sm).toFixed(3);
    setLines(tgt, "fx-rainbow");
    tgt
      .querySelectorAll(".fx-rainbow")
      .forEach((el) => (el.style.animationDuration = dur + "s"));
    playing = true;
  },
  matrix(tgt) {
    const sm = vm(S.speed),
      baseDelay = Math.max(5, (30 + 55 * 0.3) / sm);
    const lines = S.text.split("\n"),
      chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*";
    tgt.style.whiteSpace = "pre-wrap";
    let spans = [];
    lines.forEach((ln, li) => {
      if (li > 0) tgt.appendChild(document.createElement("br"));
      for (let i = 0; i < ln.length; i++) {
        const sp = document.createElement("span");
        sp.textContent = chars[Math.floor(Math.random() * chars.length)];
        sp.style.color = "#00ff41";
        tgt.appendChild(sp);
        spans.push({ el: sp, target: ln[i], done: false });
      }
    });
    playing = true;
    let round = 0;
    (function tick() {
      if (!playing) return;
      let allDone = true;
      spans.forEach((s) => {
        if (!s.done) {
          if (Math.random() < 0.08 + round * 0.004) {
            s.el.textContent = s.target;
            s.el.style.color = S.color;
            s.done = true;
          } else {
            s.el.textContent = chars[Math.floor(Math.random() * chars.length)];
            allDone = false;
          }
        }
      });
      round++;
      if (allDone) {
        // Stop, don't disappear
        return;
      } else timer = setTimeout(tick, baseDelay);
    })();
  },
  water(tgt) {
    setLines(tgt);
    tgt.style.filter = "url(#waterFilter)";
    playing = true;
    let frame = 0;
    const sm = vm(S.speed);
    const turb = document.getElementById("waterTurb"),
      disp = document.getElementById("waterDisp");
    (function anim() {
      if (!playing) return;
      frame++;
      const t = frame * 0.008 * sm;
      turb.setAttribute(
        "baseFrequency",
        `${(0.015 + Math.sin(t) * 0.004).toFixed(4)} ${(0.035 + Math.cos(t * 0.7) * 0.008).toFixed(4)}`,
      );
      disp.setAttribute(
        "scale",
        String(12 + Math.sin(t * 1.3) * 5 + Math.sin(t * 0.4) * 3),
      );
      animFrame = requestAnimationFrame(anim);
    })();
  },
  particles_fx(tgt, cv) {
    setLines(tgt);
    sizeCV(cv);
    const ctx = cv.getContext("2d");
    playing = true;
    const type = S.ptype,
      pColor = hexToRGB(S.pcolor || "#ffffff");
    const pSpeedMul = vm(S.pspd),
      sm = vm(S.speed),
      totalSpeed = pSpeedMul * sm;
    (function draw() {
      if (!playing) return;
      if (Math.random() < 0.4) {
        if (type === "snow")
          particles.push({
            x: Math.random() * cv.width,
            y: -10,
            r: 1 + Math.random() * 3,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (0.5 + Math.random() * 1.5) * totalSpeed,
            a: 0.6 + Math.random() * 0.4,
            w: Math.random() * Math.PI * 2,
            t: "snow",
          });
        else if (type === "petals")
          particles.push({
            x: Math.random() * cv.width,
            y: -15,
            r: 3 + Math.random() * 4,
            vx: (0.3 + Math.random() * 0.8) * totalSpeed,
            vy: (0.8 + Math.random() * 1.2) * totalSpeed,
            a: 0.5 + Math.random() * 0.4,
            rot: Math.random() * 360,
            rv: (Math.random() - 0.5) * 3,
            t: "petals",
          });
        else
          particles.push({
            x: Math.random() * cv.width,
            y: -5,
            r: 1 + Math.random() * 2,
            vx: (Math.random() - 0.5) * 2,
            vy: (3 + Math.random() * 5) * totalSpeed,
            a: 1,
            life: 1,
            decay: (0.005 + Math.random() * 0.01) * Math.max(0.3, totalSpeed),
            t: "sparks",
          });
      }
      ctx.clearRect(0, 0, cv.width, cv.height);
      particles.forEach((p) => {
        if (p.t === "snow") {
          p.w += 0.02;
          p.x += p.vx + Math.sin(p.w) * 0.5;
          p.y += p.vy;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pColor.r},${pColor.g},${pColor.b},${p.a})`;
          ctx.fill();
          if (p.y > cv.height + 10) p.y = -10;
        } else if (p.t === "petals") {
          p.x += p.vx + Math.sin(p.rot * 0.05) * 0.5;
          p.y += p.vy;
          p.rot += p.rv;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pColor.r},${pColor.g},${pColor.b},${p.a})`;
          ctx.fill();
          ctx.restore();
          if (p.y > cv.height + 15) p.y = -15;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05;
          p.life -= p.decay;
          if (p.life > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${pColor.r},${pColor.g},${pColor.b},${p.life})`;
            ctx.fill();
          }
        }
      });
      particles = particles.filter((p) =>
        p.t === "sparks" ? p.life > 0 : p.y < cv.height + 20,
      );
      if (particles.length > 500) particles.splice(0, 80);
      animFrame = requestAnimationFrame(draw);
    })();
  },

  neonstroke(tgt) {
    let stage = tgt.parentElement;
    while (
      stage &&
      (stage.clientWidth === 0 || stage.clientHeight === 0) &&
      stage !== document.body
    )
      stage = stage.parentElement;
    const { W, H, lines } = getSVGTextMetrics(stage, S);
    const uid = "ns" + Date.now();
    const sm = vm(S.speed);
    const dashDur = Math.max(0.4, 3 / sm).toFixed(2);
    const dashLen = 5000; // Large enough for any text length
    const sw = S.nsw || 3;
    const glow = S.ngi || 0;
    const colors = S.colors || ["#ff00ff", "#00ffff"];
    const gradSpeed = S.nsGradSpeed || 0;

    const svg = svgEl("svg");
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.style.cssText =
      "position:absolute;top:0;left:0;pointer-events:none;z-index:3;";

    const defs = svgEl("defs");
    const grad = svgEl("linearGradient");
    grad.id = "nsG" + uid;
    grad.setAttribute("x1", "0%");
    grad.setAttribute("y1", "0%");
    grad.setAttribute("x2", "100%");
    grad.setAttribute("y2", "0%");

    // Gradient Animation
    if (gradSpeed > 0) {
      const gSm = vm(gradSpeed);
      const animDur = (4 / gSm).toFixed(2);

      const animX1 = svgEl("animate");
      animX1.setAttribute("attributeName", "x1");
      animX1.setAttribute("values", "-100%;100%");
      animX1.setAttribute("dur", animDur + "s");
      animX1.setAttribute("repeatCount", "indefinite");
      grad.appendChild(animX1);

      const animX2 = svgEl("animate");
      animX2.setAttribute("attributeName", "x2");
      animX2.setAttribute("values", "0%;200%");
      animX2.setAttribute("dur", animDur + "s");
      animX2.setAttribute("repeatCount", "indefinite");
      grad.appendChild(animX2);
    }

    colors.forEach((col, i) => {
      const stop = svgEl("stop");
      stop.setAttribute("offset", (i / (colors.length - 1)) * 100 + "%");
      stop.setAttribute("stop-color", col);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);

    if (glow > 0) {
      const filter = svgEl("filter");
      filter.id = "nsF" + uid;
      filter.setAttribute("x", "-20%");
      filter.setAttribute("y", "-20%");
      filter.setAttribute("width", "140%");
      filter.setAttribute("height", "140%");
      const blur = svgEl("feGaussianBlur");
      blur.setAttribute("in", "SourceGraphic");
      blur.setAttribute("stdDeviation", glow);
      blur.setAttribute("result", "blur");
      const merge = svgEl("feMerge");
      const mn1 = svgEl("feMergeNode");
      mn1.setAttribute("in", "blur");
      const mn2 = svgEl("feMergeNode");
      mn2.setAttribute("in", "SourceGraphic");
      merge.append(mn1, mn2);
      filter.append(blur, merge);
      defs.appendChild(filter);
    }
    svg.appendChild(defs);

    const filtRef = glow > 0 ? `url(#${"nsF" + uid})` : "";
    const gradRef = `url(#${"nsG" + uid})`;

    // CSS Animation for drawing the line (stroke-dashoffset)
    injCSS(
      `@keyframes ${"nsD" + uid}{0%{stroke-dashoffset:${dashLen}}100%{stroke-dashoffset:0}}.nsA${uid}{animation:${"nsD" + uid} ${dashDur}s linear forwards;}`,
    );

    lines.forEach((line) => {
      const text = svgEl("text");
      text.setAttribute("x", line.x);
      text.setAttribute("y", line.y);
      text.setAttribute("text-anchor", line.anchor);
      text.setAttribute("font-family", `"${S.font}", sans-serif`);
      text.setAttribute("font-size", S.size);
      text.setAttribute("font-weight", S.bold ? "900" : "400");
      text.setAttribute("font-style", S.italic ? "italic" : "normal");
      text.setAttribute("fill", "transparent");
      text.setAttribute("stroke", gradRef);
      text.setAttribute("stroke-width", sw);
      text.setAttribute("paint-order", "stroke fill");
      text.setAttribute("stroke-dasharray", dashLen);
      text.setAttribute("stroke-dashoffset", dashLen); // Start hidden
      text.setAttribute("stroke-linecap", "round");
      text.setAttribute("stroke-linejoin", "round");
      if (filtRef) text.setAttribute("filter", filtRef);

      // Class triggers CSS animation (drawing)
      text.classList.add("nsA" + uid);

      // REMOVED: opacity 0 and fade transitions. Pure stroke animation.

      text.textContent = line.text;
      svg.appendChild(text);
    });

    stage.appendChild(svg);
    tgt.style.display = "none";
    tgt._nsSvg = svg;
    tgt._nsUid = uid;
    tgt._nsDashLen = dashLen;

    playing = true;

    // Timer only if NOT auto-trigger
    if (!S.autoTrigger) {
      const stay = Math.max(2000, 5000 / sm);
      timer = setTimeout(() => triggerCycleEnd(tgt), dashDur * 1000 + stay);
    }
  },

  exitNeonStroke(tgt) {
    const svg = tgt._nsSvg;
    const dashLen = tgt._nsDashLen || 5000;

    if (!svg) {
      stopFx(tgt, $("cv"), $("sl"));
      handleNextCycle(tgt);
      return;
    }

    const sm = vm(S.speed);
    // Duration matches appearance
    const dur = Math.max(400, 3000 / sm);

    svg.querySelectorAll("text").forEach((t) => {
      // 1. Stop appearance animation
      t.style.animation = "none";

      // 2. Set to fully drawn state
      t.style.strokeDashoffset = "0";

      // 3. Force reflow
      void t.getBoundingClientRect();

      // 4. Start transition (erasing line)
      t.style.transition = `stroke-dashoffset ${dur}ms linear`;

      // 5. Move dash to cover the line (Gap covers line)
      t.style.strokeDashoffset = String(dashLen);
    });

    timer = setTimeout(() => {
      stopFx(tgt, $("cv"), $("sl"));
      handleNextCycle(tgt);
    }, dur + 100);
  },

  exitShatter: function (tgt, cv) {
    let effTgt = tgt;
    if (
      effTgt.firstElementChild &&
      effTgt.firstElementChild.classList.contains("ld-wrapper")
    ) {
      effTgt = effTgt.firstElementChild;
      const txt = effTgt.querySelector("div");
      if (txt) effTgt = txt;
    }

    const rect = effTgt.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      tgt.style.opacity = "0";
      timer = setTimeout(() => {
        stopFx(tgt, cv, $("sl"));
        handleNextCycle(tgt);
      }, 100);
      return;
    }
    if (!cv) cv = $("cv");
    if (!cv) {
      tgt.style.opacity = "0";
      return;
    }
    sizeCV(cv);
    const ctx = cv.getContext("2d");
    effTgt.style.opacity = "0";

    const W = rect.width,
      H = rect.height;
    const fontSize = S.size;
    const lineH = (fontSize * S.lh) / 100;

    const offscreen = document.createElement("canvas");
    offscreen.width = W;
    offscreen.height = H;
    const offCtx = offscreen.getContext("2d");
    offCtx.font = `${S.italic ? "italic " : ""}${S.bold ? "900 " : "400 "}${fontSize}px "${S.font}", sans-serif`;
    offCtx.textAlign = S.align;
    offCtx.textBaseline = "top";
    offCtx.fillStyle = "#ffffff";
    const lines = S.text.split("\n").filter((l) => l.trim());
    lines.forEach((line, i) => {
      let x = S.align === "center" ? W / 2 : S.align === "right" ? W : 0;
      offCtx.fillText(line, x, i * lineH);
    });
    const imgData = offCtx.getImageData(0, 0, W, H);
    const pixels = imgData.data;

    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = W;
    srcCanvas.height = H;
    const srcCtx = srcCanvas.getContext("2d");
    const tc = hexToRGB(S.color || "#ffffff");

    const grad = srcCtx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(
      0,
      `rgba(${Math.min(255, tc.r + 40)},${Math.min(255, tc.g + 40)},${Math.min(255, tc.b + 60)},1)`,
    );
    grad.addColorStop(
      0.5,
      `rgba(${Math.min(255, tc.r + 20)},${Math.min(255, tc.g + 20)},${Math.min(255, tc.b + 30)},1)`,
    );
    grad.addColorStop(
      1,
      `rgba(${Math.min(255, tc.r - 10)},${Math.min(255, tc.g - 10)},${Math.min(255, tc.b)},1)`,
    );
    srcCtx.font = offCtx.font;
    srcCtx.textAlign = S.align;
    srcCtx.textBaseline = "top";
    srcCtx.fillStyle = grad;
    lines.forEach((line, i) => {
      let x = S.align === "center" ? W / 2 : S.align === "right" ? W : 0;
      srcCtx.fillText(line, x, i * lineH);
    });

    const spacing = Math.max(6, fontSize * 0.11);
    const shardCenters = [];
    for (let y = 0; y < H; y += spacing) {
      for (let x = 0; x < W; x += spacing) {
        const px = Math.floor(x),
          py = Math.floor(y);
        if (px >= W || py >= H) continue;
        const idx = (py * W + px) * 4;
        if (pixels[idx + 3] < 30) continue;
        if (Math.random() > 0.55) continue;
        shardCenters.push({
          x: x + (Math.random() - 0.5) * spacing * 0.3,
          y: y + (Math.random() - 0.5) * spacing * 0.3,
        });
      }
    }

    if (shardCenters.length < 3) {
      tgt.style.opacity = "0";
      timer = setTimeout(() => {
        stopFx(tgt, cv, $("sl"));
        handleNextCycle(tgt);
      }, 200);
      return;
    }

    const cvRect = cv.getBoundingClientRect();
    const offsetX = rect.left - cvRect.left;
    const offsetY = rect.top - cvRect.top;
    const shards = [];

    for (const center of shardCenters) {
      const numVerts = 3 + Math.floor(Math.random() * 2);
      const avgR = spacing * (0.5 + Math.random() * 0.7);
      const pts = [];
      const baseAngle = Math.random() * Math.PI * 2;
      const elongation = 1.3 + Math.random() * 2.0;

      for (let i = 0; i < numVerts; i++) {
        const angle = baseAngle + (i / numVerts) * Math.PI * 2;
        let r = avgR * (0.3 + Math.random() * 0.7);
        if (Math.random() > 0.65) r *= elongation;
        const jitter = (Math.random() - 0.5) * 0.4;
        pts.push({
          x: center.x + Math.cos(angle + jitter) * r,
          y: center.y + Math.sin(angle + jitter) * r,
        });
      }

      let mnX = Infinity,
        mnY = Infinity,
        mxX = -Infinity,
        mxY = -Infinity;
      for (const p of pts) {
        mnX = Math.min(mnX, p.x);
        mnY = Math.min(mnY, p.y);
        mxX = Math.max(mxX, p.x);
        mxY = Math.max(mxY, p.y);
      }
      const pad = 3,
        sw = Math.ceil(mxX - mnX + pad * 2),
        sh = Math.ceil(mxY - mnY + pad * 2);
      if (sw <= 0 || sh <= 0) continue;

      const tc2 = document.createElement("canvas");
      tc2.width = sw;
      tc2.height = sh;
      const tx = tc2.getContext("2d");
      tx.translate(-mnX + pad, -mnY + pad);
      tx.beginPath();
      tx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) tx.lineTo(pts[i].x, pts[i].y);
      tx.closePath();
      tx.clip();
      tx.drawImage(srcCanvas, 0, 0);

      tx.strokeStyle = `rgba(${Math.min(255, tc.r + 80)},${Math.min(255, tc.g + 80)},255,0.6)`;
      tx.lineWidth = 0.5 + Math.random() * 0.8;
      tx.lineJoin = "bevel";
      tx.stroke();

      const cx = (mnX + mxX) / 2;
      const cy = (mnY + mxY) / 2;
      const dx = cx - W / 2,
        dy = cy - H / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.sqrt((W / 2) ** 2 + (H / 2) ** 2);

      shards.push({
        cx: cx + offsetX,
        cy: cy + offsetY,
        vx: 0,
        vy: 0,
        rot: 0,
        rotSpd: 0,
        opacity: 1,
        released: false,
        delay: (dist / maxDist) * 120 + Math.random() * 60,
        img: tc2,
        w: sw,
        h: sh,
        trail: [],
      });
    }

    const baseDur = EXIT_DUR["glass-shatter"] || 1800;
    const dur = Math.max(300, baseDur / vm(S.dspeed));
    const gravity = 0.12;
    const impactX = offsetX + W / 2;
    const impactY = offsetY + H / 2;
    const sparks = [];
    const startTime = Date.now();

    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6;
      sparks.push({
        x: impactX,
        y: impactY,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 2,
        life: 1,
        maxLife: 200 + Math.random() * 300,
      });
    }

    const gc_r = Math.min(255, tc.r + 80);
    const gc_g = Math.min(255, tc.g + 80);
    const gc_b = 255;

    function animate() {
      if (!playing) return;
      const elapsed = Date.now() - startTime;
      const clearPad = 300;
      ctx.clearRect(
        offsetX - clearPad,
        offsetY - clearPad,
        W + clearPad * 2,
        H + clearPad * 2,
      );

      for (const s of shards) {
        const dt = elapsed - s.delay;
        if (dt < 0) {
          const vi = Math.min(2, Math.max(0, 1 + dt / 50)) * 1.5;
          ctx.save();
          ctx.globalAlpha = s.opacity;
          ctx.translate(
            s.cx + (Math.random() - 0.5) * vi,
            s.cy + (Math.random() - 0.5) * vi * 0.5,
          );
          ctx.shadowColor = `rgba(${gc_r},${gc_g},${gc_b},0.6)`;
          ctx.shadowBlur = 8;
          if (s.img) ctx.drawImage(s.img, -s.w / 2, -s.h / 2);
          ctx.restore();
          continue;
        }
        if (!s.released) {
          s.released = true;
          const dx = s.cx - impactX,
            dy = s.cy - impactY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = Math.max(4, 40 / (dist * 0.01 + 1));
          const angle = Math.atan2(dy, dx);
          const spread = (Math.random() - 0.5) * 0.7;
          s.vx = Math.cos(angle + spread) * force + (Math.random() - 0.5) * 5;
          s.vy = Math.sin(angle + spread) * force - Math.random() * 4;
          s.rotSpd = (Math.random() - 0.5) * 0.2;
          for (let i = 0; i < 2; i++)
            sparks.push({
              x: s.cx,
              y: s.cy,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4 - 1.5,
              life: 1,
              maxLife: 150 + Math.random() * 250,
            });
        }
        s.vy += gravity;
        s.cx += s.vx;
        s.cy += s.vy;
        s.rot += s.rotSpd;
        s.vx *= 0.998;
        s.rotSpd *= 0.9995;

        if (elapsed < dur * 0.6 && s.trail.length < 5)
          s.trail.push({ x: s.cx, y: s.cy, alpha: 0.2 });
        for (const t of s.trail) t.alpha *= 0.88;
        s.trail = s.trail.filter((t) => t.alpha > 0.005);
        if (dt > dur * 0.35)
          s.opacity = Math.max(0, 1 - (dt - dur * 0.35) / (dur * 0.65));
        if (s.opacity <= 0) continue;

        for (const t of s.trail) {
          ctx.save();
          ctx.globalAlpha = t.alpha * s.opacity * 0.12;
          ctx.translate(t.x, t.y);
          ctx.rotate(s.rot * 0.7);
          if (s.img) ctx.drawImage(s.img, -s.w / 2, -s.h / 2);
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.translate(s.cx, s.cy);
        ctx.rotate(s.rot);
        if (dt < 250) {
          const heat = (1 - dt / 250) * 0.4;
          ctx.shadowColor = `rgba(${gc_r},${gc_g},${gc_b},${heat})`;
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowColor = `rgba(${gc_r},${gc_g},${gc_b},0.25)`;
          ctx.shadowBlur = 5;
        }
        if (s.img) ctx.drawImage(s.img, -s.w / 2, -s.h / 2);
        ctx.restore();
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.vy += 0.04;
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.99;
        sp.life -= 16 / sp.maxLife;
        if (sp.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = sp.life * 0.7;
        ctx.fillStyle = `rgba(${gc_r},${gc_g},${gc_b},1)`;
        ctx.shadowColor = `rgba(${gc_r},${gc_g},${gc_b},0.6)`;
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 0.4 + sp.life * 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (elapsed < 120) {
        const fo = 1 - elapsed / 120;
        ctx.save();
        const rg = ctx.createRadialGradient(
          impactX,
          impactY,
          0,
          impactX,
          impactY,
          elapsed * 1.5,
        );
        rg.addColorStop(0, `rgba(255,255,255,${fo * 0.7})`);
        rg.addColorStop(0.3, `rgba(${gc_r},${gc_g},${gc_b},${fo * 0.4})`);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(
          offsetX - clearPad,
          offsetY - clearPad,
          W + clearPad * 2,
          H + clearPad * 2,
        );
        ctx.restore();
      }

      if (elapsed < dur + 200) animFrame = requestAnimationFrame(animate);
      else {
        ctx.clearRect(0, 0, cv.width, cv.height);
        stopFx(tgt, cv, $("sl"));
        handleNextCycle(tgt);
      }
    }
    animate();
  },

  exitParticles: function (tgt, cv) {
    const baseDur = EXIT_DUR["particle-explode"] || 1000;
    const dur = Math.max(200, baseDur / vm(S.dspeed));
    const pColor = hexToRGB(S.dpc || "#ffffff");
    const pSize = S.dpsz || 4;
    const pSpeed = vm(S.dpspd || 100);
    const rect = tgt.getBoundingClientRect();
    const cvR = cv.getBoundingClientRect();
    tgt.style.opacity = "0";
    const ctx = cv.getContext("2d");
    const count = 100;
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      const px = rect.left - cvR.left + Math.random() * rect.width;
      const py = rect.top - cvR.top + Math.random() * rect.height;
      const cx = rect.left - cvR.left + rect.width / 2;
      const cy = rect.top - cvR.top + rect.height / 2;
      const angle = Math.atan2(py - cy, px - cx);
      const force = 2 + Math.random() * 5 * pSpeed;
      newParticles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        r: pSize * (0.5 + Math.random()),
        a: 1,
        life: 1,
        decay: 1 / (dur / 16),
        color: pColor,
      });
    }
    let startTime = Date.now();
    function pDraw() {
      if (!playing) return;
      const elapsed = Date.now() - startTime;
      if (elapsed > dur + 500) {
        stopFx(tgt, cv, $("sl"));
        handleNextCycle(tgt);
        return;
      }
      ctx.clearRect(0, 0, cv.width, cv.height);
      newParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= p.decay;
        if (p.life > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.life})`;
          ctx.fill();
        }
      });
      requestAnimationFrame(pDraw);
    }
    pDraw();
  },
};

/* ==================== TRIGGER CYCLE END ==================== */
function triggerCycleEnd(tgt) {
  if (!playing) return;

  if (S.visual === "neonstroke") {
    FX.exitNeonStroke(tgt);
    return;
  }

  if (S.disappear === "none" && !S.loop && !S.autoTrigger) {
    stopFx(tgt, $("cv"), $("sl"));
    return;
  }

  if (S.disappear === "glass-shatter") {
    FX.exitShatter(tgt, $("cv"));
  } else if (S.disappear === "particle-explode") {
    FX.exitParticles(tgt, $("cv"));
  } else if (S.disappear === "scatter") {
    // Handle Scatter here
    FX.scatter(tgt);
  } else if (S.disappear === "shrink-point") {
    const baseDur = EXIT_DUR["shrink-point"] || 600;
    const dur = Math.max(80, baseDur / vm(S.dspeed));
    tgt.classList.add(EXIT_CLS["shrink-point"]);
    tgt.style.animationDuration = dur + "ms";
    timer = setTimeout(() => {
      stopFx(tgt, $("cv"), $("sl"));
      handleNextCycle(tgt);
    }, dur + 100);
  } else if (S.disappear !== "none") {
    const exitClass = EXIT_CLS[S.disappear];
    const baseDur = EXIT_DUR[S.disappear] || 700;
    const dur = Math.max(80, baseDur / vm(S.dspeed));
    tgt.classList.add(exitClass);
    tgt.style.animationDuration = dur + "ms";
    timer = setTimeout(() => {
      stopFx(tgt, $("cv"), $("sl"));
      handleNextCycle(tgt);
    }, dur + 100);
  } else {
    stopFx(tgt, $("cv"), $("sl"));
    handleNextCycle(tgt);
  }
}

function handleNextCycle(tgt) {
  if (S.autoTrigger) {
    setAutoStatus("waiting", "Waiting (" + fmtTime(S.betweenTime) + ")");
    autoT2 = setTimeout(() => {
      autoTriggerLoop(tgt, $("cv"), $("sl"));
    }, S.betweenTime * 1000);
  } else if (S.loop) {
    playFx(tgt, $("cv"), $("sl"));
  }
}

export function stopFx(tgt, cv, sl) {
  playing = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
  clrCSS();
  particles = [];
  if (tgt._nsSvg) {
    tgt._nsSvg.remove();
    tgt._nsSvg = null;
  }
  if (tgt._ldSvg) {
    tgt._ldSvg.remove();
    tgt._ldSvg = null;
  }
  tgt.innerHTML = "";
  tgt.className = "";
  tgt.removeAttribute("data-text");
  tgt.style.whiteSpace = "pre-wrap";
  tgt.style.filter = "";
  tgt.style.display = "";
  tgt.style.opacity = "";
  tgt.style.transform = "";
  tgt.style.clipPath = "";
  if (sl) sl.style.opacity = "0";
  if (cv) {
    const ctx = cv.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, cv.width, cv.height);
  }
}

export function playFx(tgt, cv, sl) {
  stopFx(tgt, cv, sl);
  applyStyle(tgt);
  if (cv) sizeCV(cv);
  const vis = S.visual,
    apr = S.appear;
  const canCombine = apr !== "none" && !SELF_ENTRANCE.has(vis);
  let effectTarget = tgt;

  // Removed Line Draw (Wrapped)

  if (canCombine) {
    const aw = document.createElement("div");
    aw.style.display = "inline-block";
    const cls = APPEAR_CLS[apr];
    if (cls) aw.className = cls;
    const asm = vm(S.aspeed),
      baseDur = APPEAR_DUR[apr] || 700;
    const scaledDur = Math.max(80, baseDur / asm);
    aw.style.animationDuration = scaledDur + "ms";
    tgt.appendChild(aw);
    effectTarget = aw;
  }

  if (vis === "none") {
    setLines(effectTarget);
    playing = true;
  } else {
    const fn = FX[vis === "particles" ? "particles_fx" : vis];
    if (fn) fn(effectTarget, cv, sl);
    // Logic: If NOT auto-trigger, AND looping (or has disappear effect), start timer for Activity Time
    // This ensures text stays on screen for Activity Time even after print effects finish
    if (
      !S.autoTrigger &&
      (S.loop || S.disappear !== "none") &&
      !SELF_ENTRANCE.has(vis) // Exceptions handled inside functions
    ) {
      const duration = (S.activityTime || 5) * 1000;
      timer = setTimeout(() => triggerCycleEnd(tgt), duration);
    }
  }
}

let autoT1 = null,
  autoT2 = null,
  autoState = "idle";
function setAutoStatus(state, text) {
  autoState = state;
  const el = $("at-status");
  if (!el) return;
  el.className =
    "auto-status" +
    (state === "playing" ? " playing" : state === "waiting" ? " waiting" : "");
  const lbl = $("at-label");
  if (lbl) lbl.textContent = text || "Idle";
}
export function stopAutoTrigger() {
  if (autoT1) {
    clearTimeout(autoT1);
    autoT1 = null;
  }
  if (autoT2) {
    clearTimeout(autoT2);
    autoT2 = null;
  }
  setAutoStatus("idle", "Idle");
}
function autoTriggerLoop(tgt, cv, sl) {
  if (!S.autoTrigger) {
    stopAutoTrigger();
    return;
  }
  playFx(tgt, cv, sl);
  setAutoStatus("playing", "Playing (" + fmtTime(S.activityTime) + ")");
  autoT1 = setTimeout(() => {
    triggerCycleEnd(tgt);
  }, S.activityTime * 1000);
}
export function startAutoTrigger(tgt, cv, sl) {
  stopAutoTrigger();
  if (S.autoTrigger) autoTriggerLoop(tgt, cv, sl);
}
