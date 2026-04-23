const $ = (id) => document.getElementById(id);
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const NS = "http://www.w3.org/2000/svg";
function svgEl(tag) {
  return document.createElementNS(NS, tag);
}

export const D = {
  font: "IBM Plex Mono",
  visual: "none",
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
  bdns: 60,
  bdpl: 50,
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
  glassSize: 50,
  glassEdge: 50,
  glassSpeed: 55,
  frColors: ["#ff00ff"],
  frSpeed: 0,
  frAngle: 90,
  frSize: 10,
  frGlow: 20,
  frGlowGradient: false,
  frRadius: 0,
  frWidth: 500,
  frHeight: 200,
};

export let S = { ...D };
let playing = false,
  timer = null,
  animFrame = null,
  audioCtx = null,
  particles = [],
  _bloodCtx = null,
  _bloodFrontCv = null;
let currentCv = null,
  currentSl = null;

const SELF_ENTRANCE = new Set([
  "typewriter",
  "matrix",
  "stamp",
  "scanner",
  "pour",
  "neonstroke",
  "assemble",
  "laser",
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
  scatter: 1400,
  "fire-out": 2500,
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
    "#mode=text&v=" +
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
    "&bd=" +
    S.bdns +
    "&bl=" +
    S.bdpl +
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
    S.dpspd +
    "&gsz=" +
    S.glassSize +
    "&ged=" +
    S.glassEdge +
    "&gsp=" +
    S.glassSpeed
  );
}
export function toFrameHash() {
  return (
    "#mode=frame&frc=" +
    S.frColors.map((c) => encodeURIComponent(c)).join("|") +
    "&frsp=" +
    S.frSpeed +
    "&frdi=" +
    S.frAngle +
    "&frsz=" +
    S.frSize +
    "&frgl=" +
    S.frGlow +
    "&frrd=" +
    S.frRadius +
    "&frw=" +
    S.frWidth +
    "&frh=" +
    S.frHeight +
    "&frgg=" +
    (S.frGlowGradient ? 1 : 0)
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
  if (g("f")) S.font = g("f");
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
  if (g("bd")) S.bdns = +g("bd");
  if (g("bl")) S.bdpl = +g("bl");
  S.autoTrigger = g("atr") === "1";
  if (g("atm")) S.activityTime = +g("atm");
  if (g("btm")) S.betweenTime = +g("btm");
  if (g("nc")) S.colors = g("nc").split("|");
  if (g("nsw")) S.nsw = +g("nsw");
  if (g("ngi")) S.ngi = +g("ngi");
  if (g("ngs")) S.nsGradSpeed = +g("ngs");
  if (g("dpc")) S.dpc = g("dpc");
  if (g("dpsz")) S.dpsz = +g("dpsz");
  if (g("dpspd")) S.dpspd = +g("dpspd");
  if (g("gsz")) S.glassSize = +g("gsz");
  if (g("ged")) S.glassEdge = +g("ged");
  if (g("gsp")) S.glassSpeed = +g("gsp");
}
export function parseFrameHash() {
  const h = location.hash.slice(1);
  if (!h || h === "config") return;
  const p = new URLSearchParams(h),
    g = (k) => p.get(k);
  if (g("frc")) S.frColors = g("frc").split("|");
  if (g("frsp")) S.frSpeed = +g("frsp");
  if (g("frdi")) S.frAngle = +g("frdi");
  if (g("frsz")) S.frSize = +g("frsz");
  if (g("frgl")) S.frGlow = +g("frgl");
  if (g("frrd")) S.frRadius = +g("frrd");
  if (g("frw")) S.frWidth = +g("frw");
  if (g("frh")) S.frHeight = +g("frh");
  S.frGlowGradient = g("frgg") === "1";
}
export function fullURL() {
  return location.href.split("#")[0].split("?")[0] + toHash();
}
export function fullFrameURL() {
  return location.href.split("#")[0].split("?")[0] + toFrameHash();
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
    ![
      "neon",
      "glowpulse",
      "fire",
      "chrome",
      "ice",
      "neonstroke",
      "blood",
      "laser",
    ].includes(S.visual)
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
  return {
    W,
    H,
    lines: lines.map((line, i) => ({
      text: line,
      x: bx,
      y: by + fontSize * 0.82 + i * lineH,
      anchor,
    })),
  };
}

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
      if (li >= lines.length) return;
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
    tgt.innerHTML = S.text
      .split("\n")
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
      if (age % 2 === 0) {
        const sc = Math.max(1, Math.floor(2 * density));
        for (let i = 0; i < sc; i++) {
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
        p.x =
          p.baseX + smokeNoise(p.baseX, p.baseY, t + p.phase) * 35 * p.drift;
        p.y =
          p.baseY +
          smokeNoise(p.baseX + 500, p.baseY + 500, t + p.phase) * 25 * p.drift -
          p.age * 0.04 * sm;
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
          grad.addColorStop(1, "rgba(110,110,120,0)");
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
  fire(tgt) {
    const sm = vm(S.speed);
    setLines(tgt, "fx-fire-text");
    tgt.style.color = "#ffdd88";
    tgt.style.textShadow = "0 0 10px #ff6600, 0 -4px 20px #ff3300";
    tgt
      .querySelectorAll(".fx-fire-text")
      .forEach(
        (el) => (el.style.animationDuration = Math.max(0.02, 0.12 / sm) + "s"),
      );
    playing = true;
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
    let h = "";
    S.text.split("\n").forEach((ln, li) => {
      if (li > 0) h += "<br>";
      for (let i = 0; i < ln.length; i++) {
        h += `<span class="fx-wl" style="animation-delay:${(((li * 20 + i) * 0.06) / sm).toFixed(3)}s;animation-duration:${dur}s">${esc(ln[i])}</span>`;
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
  scatter(tgt) {
    const sm = vm(S.speed),
      durS = (1.4 / sm).toFixed(3),
      delayBase = 0.03 / sm;
    let h = "",
      idx = 0;
    S.text.split("\n").forEach((ln, li) => {
      if (li > 0) h += "<br>";
      for (let i = 0; i < ln.length; i++) {
        h += `<span class="fx-scl" style="--sx:${(Math.random() - 0.5) * 1200}px;--sy:${(Math.random() - 0.5) * 800}px;--sr:${(Math.random() - 0.5) * 1080}deg;animation-delay:${(idx * delayBase).toFixed(3)}s;animation-duration:${durS}s">${esc(ln[i])}</span>`;
        idx++;
      }
    });
    tgt.innerHTML = h;
    playing = true;
    timer = setTimeout(
      () => {
        stopFx(tgt, currentCv, currentSl);
        handleNextCycle(tgt);
      },
      (idx * delayBase + parseFloat(durS)) * 1000 + 500,
    );
  },
  assemble(tgt) {
    const sm = vm(S.speed),
      durA = (0.7 / sm).toFixed(3),
      delayBase = 0.04 / sm;
    let h = "",
      idx = 0;
    S.text.split("\n").forEach((ln, li) => {
      if (li > 0) h += "<br>";
      for (let i = 0; i < ln.length; i++) {
        h += `<span class="fx-al" style="--sx:${(Math.random() - 0.5) * 900}px;--sy:${(Math.random() - 0.5) * 600}px;--sr:${(Math.random() - 0.5) * 720}deg;animation-delay:${(idx * delayBase).toFixed(3)}s;animation-duration:${durA}s">${esc(ln[i])}</span>`;
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
    let h = "",
      idx = 0;
    S.text.split("\n").forEach((ln, li) => {
      if (li > 0) h += "<br>";
      for (let i = 0; i < ln.length; i++) {
        h += `<span class="fx-pour" style="--pr:${(Math.random() - 0.5) * 25}deg;--px:${(Math.random() - 0.5) * 50}px;animation-delay:${(idx * delayBase).toFixed(3)}s;animation-duration:${durP}s">${esc(ln[i])}</span>`;
        idx++;
      }
    });
    tgt.innerHTML = h;
    playing = true;
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
      if (li >= lines.length) return;
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
      if (!allDone) timer = setTimeout(tick, baseDelay);
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
  blood(tgt, cv) {
    setLines(tgt);
    sizeCV(cv);
    const ctx = cv.getContext("2d");
    _bloodCtx = { cv, ctx };
    playing = true;
    const sm = vm(S.speed);
    const density = (S.bdns || 60) / 60;
    let frontCv = null;
    let frontCtx = null;
    const par = cv.parentElement || tgt.parentElement;
    if (par) {
      frontCv = document.createElement("canvas");
      frontCv.style.cssText =
        "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;";
      par.style.position = "relative";
      par.appendChild(frontCv);
      frontCv.width = par.clientWidth;
      frontCv.height = par.clientHeight;
      frontCtx = frontCv.getContext("2d");
      _bloodFrontCv = frontCv;
    }
    tgt.style.textShadow =
      "0 0 8px rgba(139,0,0,0.5), 0 0 20px rgba(100,0,0,0.25)";
    const rect = tgt.getBoundingClientRect();
    const cvR = cv.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      requestAnimationFrame(() => FX.blood(tgt, cv));
      return;
    }
    const offscreen = document.createElement("canvas");
    offscreen.width = Math.ceil(rect.width);
    offscreen.height = Math.ceil(rect.height);
    const offCtx = offscreen.getContext("2d");
    const fontSize = S.size;
    const lineH = (fontSize * S.lh) / 100;
    const lines = S.text.split("\n").filter((l) => l.trim());
    offCtx.font = `${S.italic ? "italic " : ""}${S.bold ? "900 " : "400 "}${fontSize}px "${S.font}", sans-serif`;
    offCtx.textAlign = S.align;
    offCtx.textBaseline = "top";
    offCtx.fillStyle = "#ffffff";
    const yOffset = (lineH - fontSize) / 2;
    lines.forEach((line, i) => {
      let x =
        S.align === "center"
          ? rect.width / 2
          : S.align === "right"
            ? rect.width
            : 0;
      offCtx.fillText(line, x, yOffset + i * lineH);
    });
    const imgData = offCtx.getImageData(
      0,
      0,
      offscreen.width,
      offscreen.height,
    );
    const pxData = imgData.data;
    const oW = offscreen.width;
    const oH = offscreen.height;
    const topEdges = [];
    for (let x = 0; x < oW; x += 2) {
      for (let y = 0; y < oH; y++) {
        const idx = (y * oW + x) * 4;
        if (pxData[idx + 3] > 100) {
          topEdges.push({ x, y });
          break;
        }
      }
    }
    const bottomEdges = [];
    for (let x = 0; x < oW; x += 2) {
      for (let y = oH - 1; y >= 0; y--) {
        const idx = (y * oW + x) * 4;
        if (pxData[idx + 3] > 100) {
          bottomEdges.push({ x, y });
          break;
        }
      }
    }
    const offsetX = rect.left - cvR.left;
    const offsetY = rect.top - cvR.top;
    const drips = [];
    const pools = [];
    let lastSpawnTop = 0;
    let lastSpawnBottom = 0;
    function makeDrip(ex, ey) {
      const dripWidth = 2 + Math.random() * 6;
      const dripLen = (S.bdpl || 50) / 50;
      const maxLen = (15 + Math.random() * 60) * dripLen;
      const numSegs = 4 + Math.floor(Math.random() * 6);
      const shape = [];
      for (let i = 0; i <= numSegs; i++) shape.push(0.5 + Math.random() * 0.8);
      const vy = (0.3 + Math.random() * 0.6) * sm;
      return {
        x: ex + offsetX + (Math.random() * 4 - 2),
        y: ey + offsetY,
        width: dripWidth,
        maxLength: maxLen,
        currentLength: 0,
        vy,
        wobble: (Math.random() - 0.5) * 1.2,
        wobbleSpeed: 0.015 + Math.random() * 0.03,
        opacity: 0.65 + Math.random() * 0.35,
        growing: true,
        phase: Math.random() * Math.PI * 2,
        shape,
        front: Math.random() > 0.5,
      };
    }
    function drawDrip(d, drawCtx) {
      const len = d.currentLength;
      if (len < 1.5) return;
      const segs = d.shape.length - 1;
      const segLen = len / segs;
      drawCtx.save();
      drawCtx.globalAlpha = d.opacity;
      const cosA = 0;
      const sinA = 1;
      drawCtx.beginPath();
      const sx = d.x;
      const sy = d.y;
      drawCtx.moveTo(sx, sy);
      const points = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const dist = i * segLen;
        const wobbleOffset = Math.sin(d.phase + i * 0.6) * d.wobble * 1.5;
        const px = sx + cosA * dist + -sinA * wobbleOffset;
        const py = sy + sinA * dist + cosA * wobbleOffset;
        points.push({ x: px, y: py, t });
      }
      for (let i = 0; i <= segs; i++) {
        const p = points[i];
        const perpX = -sinA;
        const perpY = cosA;
        const halfW =
          (d.width * d.shape[i] * (0.5 + 0.5 * (1 - p.t * 0.35))) / 2;
        if (i === 0) drawCtx.moveTo(p.x + perpX * halfW, p.y + perpY * halfW);
        else drawCtx.lineTo(p.x + perpX * halfW, p.y + perpY * halfW);
      }
      const tip = points[segs];
      const tipExtend = d.width * 0.35;
      const tipX = tip.x + cosA * tipExtend;
      const tipY = tip.y + sinA * tipExtend;
      drawCtx.quadraticCurveTo(tipX + -sinA * 1, tipY + cosA * 1, tipX, tipY);
      drawCtx.quadraticCurveTo(tipX + sinA * 1, tipY - cosA * 1, tipX, tipY);
      for (let i = segs; i >= 0; i--) {
        const p = points[i];
        const perpX = sinA;
        const perpY = -cosA;
        const halfW =
          (d.width * d.shape[i] * (0.5 + 0.5 * (1 - p.t * 0.35))) / 2;
        drawCtx.lineTo(p.x + perpX * halfW, p.y + perpY * halfW);
      }
      drawCtx.closePath();
      const grad = drawCtx.createLinearGradient(sx, sy, sx, sy + len);
      grad.addColorStop(0, "#BB0000");
      grad.addColorStop(0.15, "#990000");
      grad.addColorStop(0.45, "#8B0000");
      grad.addColorStop(0.75, "#AA1111");
      grad.addColorStop(1, "#550000");
      drawCtx.fillStyle = grad;
      drawCtx.fill();
      drawCtx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const p = points[i];
        const perpX = -sinA;
        const perpY = cosA;
        const hw = d.width * d.shape[i] * 0.15;
        if (i === 0) drawCtx.moveTo(p.x + perpX * hw, p.y + perpY * hw);
        else drawCtx.lineTo(p.x + perpX * hw, p.y + perpY * hw);
      }
      drawCtx.strokeStyle = "rgba(255,100,100,0.18)";
      drawCtx.lineWidth = 0.8;
      drawCtx.stroke();
      drawCtx.restore();
    }
    function drawPool(p, poolCtx) {
      poolCtx.save();
      poolCtx.globalAlpha = p.opacity;
      poolCtx.beginPath();
      poolCtx.ellipse(p.x, p.y, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
      const grad = poolCtx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        p.width / 2,
      );
      grad.addColorStop(0, "#AA0000");
      grad.addColorStop(0.35, "#880000");
      grad.addColorStop(0.65, "#550000");
      grad.addColorStop(1, "rgba(80,0,0,0)");
      poolCtx.fillStyle = grad;
      poolCtx.fill();
      poolCtx.restore();
    }
    for (let i = 0; i < 12; i++) {
      if (topEdges.length > 0) {
        const pt = topEdges[Math.floor(Math.random() * topEdges.length)];
        const d = makeDrip(pt.x, pt.y);
        d.currentLength = Math.random() * d.maxLength * 0.6;
        drips.push(d);
      }
    }
    for (let i = 0; i < 5; i++) {
      if (bottomEdges.length > 0) {
        const pt = bottomEdges[Math.floor(Math.random() * bottomEdges.length)];
        const d = makeDrip(pt.x, pt.y);
        d.currentLength = Math.random() * d.maxLength * 0.4;
        drips.push(d);
      }
    }
    function frame() {
      if (!playing) return;
      const time = performance.now();
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (frontCtx) frontCtx.clearRect(0, 0, frontCv.width, frontCv.height);
      const topInterval = Math.max(60, 180 / density);
      const bottomInterval = Math.max(200, 500 / density);
      if (time - lastSpawnTop > topInterval) {
        if (topEdges.length > 0) {
          const pt = topEdges[Math.floor(Math.random() * topEdges.length)];
          drips.push(makeDrip(pt.x, pt.y));
          lastSpawnTop = time;
        }
      }
      if (time - lastSpawnBottom > bottomInterval) {
        if (bottomEdges.length > 0 && Math.random() > 0.4) {
          const pt =
            bottomEdges[Math.floor(Math.random() * bottomEdges.length)];
          drips.push(makeDrip(pt.x, pt.y));
          lastSpawnBottom = time;
        }
      }
      for (let i = drips.length - 1; i >= 0; i--) {
        const d = drips[i];
        d.phase += d.wobbleSpeed;
        if (d.growing) {
          d.currentLength += d.vy;
          d.y += d.vy;
          d.vy += 0.005 * sm;
          if (d.currentLength >= d.maxLength) d.growing = false;
        }
        const dCtx = d.front && frontCtx ? frontCtx : ctx;
        drawDrip(d, dCtx);
        if (!d.growing && d.currentLength >= d.maxLength * 0.8) {
          const tipX = d.x;
          const tipY = d.y + d.currentLength;
          const poolExists = pools.some(
            (p) => Math.abs(p.x - tipX) < 18 && Math.abs(p.y - tipY) < 12,
          );
          if (!poolExists && pools.length < 30)
            pools.push({
              x: tipX,
              y: tipY,
              width: 6 + Math.random() * 14,
              height: 2 + Math.random() * 5,
              opacity: 0.35 + Math.random() * 0.25,
              front: d.front,
            });
          d.opacity -= 0.003;
        }
        if (d.opacity <= 0) drips.splice(i, 1);
      }
      if (drips.length > 40) drips.splice(0, drips.length - 40);
      for (let i = pools.length - 1; i >= 0; i--) {
        const p = pools[i];
        p.width += 0.02;
        p.height += 0.005;
        const pCtx = p.front && frontCtx ? frontCtx : ctx;
        drawPool(p, pCtx);
        p.opacity -= 0.0006;
        if (p.opacity <= 0) pools.splice(i, 1);
      }
      animFrame = requestAnimationFrame(frame);
    }
    frame();
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
    const dashLen = 5000;
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
      text.setAttribute("stroke-dashoffset", dashLen);
      text.setAttribute("stroke-linecap", "round");
      text.setAttribute("stroke-linejoin", "round");
      if (filtRef) text.setAttribute("filter", filtRef);
      text.classList.add("nsA" + uid);
      text.textContent = line.text;
      svg.appendChild(text);
    });
    stage.appendChild(svg);
    tgt.style.display = "none";
    tgt._nsSvg = svg;
    tgt._nsUid = uid;
    tgt._nsDashLen = dashLen;
    playing = true;
    if (!S.autoTrigger) {
      const stay = Math.max(2000, 5000 / sm);
      timer = setTimeout(() => triggerCycleEnd(tgt), dashDur * 1000 + stay);
    }
  },

  /* ==================== LASER WRITING EFFECT (CONTOUR TRACING) ==================== */
  /* ==================== LASER WRITING EFFECT (CONTOUR TRACING) ==================== */
  /* ==================== LASER WRITING EFFECT (CONTOUR TRACING) ==================== */
  /* ==================== LASER WRITING EFFECT (CONTOUR TRACING) ==================== */
  /* ==================== LASER WRITING EFFECT (PERMANENT NEON TRAIL) ==================== */
  laser(tgt, cv) {
    if (!cv) {
      setLines(tgt);
      playing = true;
      return;
    }
    sizeCV(cv);
    if (cv.width === 0 || cv.height === 0) {
      setLines(tgt);
      playing = true;
      return;
    }
    const ctx = cv.getContext("2d");
    playing = true;

    setLines(tgt);
    tgt.style.opacity = "0"; // Скрываем HTML-текст

    const stage = cv.parentElement || document.body;
    const { W, H, lines } = getSVGTextMetrics(stage, S);
    const lc = hexToRGB(S.color || "#ff2020");
    const sm = vm(S.speed);

    const fontStr = `${S.italic ? "italic " : ""}${S.bold ? "900 " : "400 "}${S.size}px "${S.font}", sans-serif`;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // ---- Холст для постоянного следа ----
    const permCv = document.createElement("canvas");
    permCv.width = cv.width;
    permCv.height = cv.height;
    const permCtx = permCv.getContext("2d");

    // ---- Character positions ----
    const measureCv = document.createElement("canvas");
    const measureCtx = measureCv.getContext("2d");
    measureCtx.font = fontStr;
    measureCtx.textBaseline = "alphabetic";

    const charPositions = [];
    lines.forEach((line) => {
      measureCtx.textAlign = S.align;
      const metrics = measureCtx.measureText(line.text);
      let startX = line.x;
      if (S.align === "center") startX -= metrics.width / 2;
      else if (S.align === "right") startX -= metrics.width;

      measureCtx.textAlign = "left";
      let curX = startX;
      for (let i = 0; i < line.text.length; i++) {
        const ch = line.text[i];
        const chW = measureCtx.measureText(ch).width;
        charPositions.push({ ch, x: curX, y: line.y, w: chW });
        curX += chW;
      }
    });

    // ---- Contour extraction ----
    const STEP_PX = Math.max(2, Math.round(S.size / 30));

    function getContourPts(ch, charX, charY) {
      if (ch.trim() === "") return [];

      const padX = 8,
        padY = 8;
      measureCtx.font = fontStr;
      const m = measureCtx.measureText(ch);
      const cw = Math.ceil((m.width || S.size * 0.6) + padX * 2);
      const ch_h = Math.ceil(S.size * 1.8 + padY * 2);

      const tCv = document.createElement("canvas");
      tCv.width = Math.ceil(cw * dpr);
      tCv.height = Math.ceil(ch_h * dpr);
      const tCtx = tCv.getContext("2d");
      tCtx.scale(dpr, dpr);

      tCtx.font = fontStr;
      tCtx.textBaseline = "alphabetic";
      tCtx.textAlign = "left";
      tCtx.fillStyle = "#fff";

      const baselineY = ch_h - padY - S.size * 0.3;
      tCtx.fillText(ch, padX, baselineY);

      const imgD = tCtx.getImageData(0, 0, tCv.width, tCv.height);
      const d = imgD.data;
      const tw = tCv.width,
        th = tCv.height;

      const raw = [];
      const step = Math.max(1, Math.round(1.2 * dpr));

      for (let py = 0; py < th; py += step) {
        for (let px = 0; px < tw; px += step) {
          const idx = (py * tw + px) * 4;
          if (d[idx + 3] < 100) continue;

          let isEdge = false;
          const checks = [
            [px - step, py],
            [px + step, py],
            [px, py - step],
            [px, py + step],
          ];
          for (const [cx, cy] of checks) {
            if (cx < 0 || cy < 0 || cx >= tw || cy >= th) continue;
            const ni = (cy * tw + cx) * 4;
            if (d[ni + 3] < 40) {
              isEdge = true;
              break;
            }
          }
          if (isEdge) {
            raw.push({
              x: px / dpr - padX + charX,
              y: py / dpr - baselineY + charY,
            });
          }
        }
      }

      if (raw.length < 3) return [];

      const used = new Uint8Array(raw.length);
      const sorted = [raw[0]];
      used[0] = 1;

      for (let i = 1; i < raw.length; i++) {
        const last = sorted[sorted.length - 1];
        let bestD = 1e9,
          bestJ = -1;
        for (let j = 0; j < raw.length; j++) {
          if (used[j]) continue;
          const dx = raw[j].x - last.x,
            dy = raw[j].y - last.y;
          const dd = dx * dx + dy * dy;
          if (dd < bestD) {
            bestD = dd;
            bestJ = j;
          }
        }
        if (bestJ >= 0 && bestD < 900) {
          sorted.push(raw[bestJ]);
          used[bestJ] = 1;
        } else {
          bestD = 1e9;
          bestJ = -1;
          for (let k = 0; k < raw.length; k++) {
            if (used[k]) continue;
            const dx2 = raw[k].x - last.x,
              dy2 = raw[k].y - last.y;
            const dd2 = dx2 * dx2 + dy2 * dy2;
            if (dd2 < bestD) {
              bestD = dd2;
              bestJ = k;
            }
          }
          if (bestJ >= 0) {
            sorted.push({ x: raw[bestJ].x, y: raw[bestJ].y, jump: true });
            sorted.push(raw[bestJ]);
            used[bestJ] = 1;
          }
        }
      }
      return sorted;
    }

    // ---- Build path from contour points ----
    const allPts = [];
    const segs = [];
    let prevEndIdx = -1;
    const charBoundsArr = [];

    charPositions.forEach((cp, ci) => {
      charBoundsArr.push({
        minX: cp.x,
        maxX: cp.x + cp.w,
        minY: cp.y - S.size,
        maxY: cp.y + S.size * 0.3,
        cx: cp.x + cp.w / 2,
        cy: cp.y - S.size * 0.35,
      });

      const pts = getContourPts(cp.ch, cp.x, cp.y);

      if (pts.length === 0) {
        if (allPts.length > 0 && ci < charPositions.length - 1) {
          allPts.push({ x: cp.x + cp.w, y: cp.y, jump: true, ci });
        }
        return;
      }

      const sampled = [];
      let accum = 0;
      for (let s = 0; s < pts.length; s++) {
        if (pts[s].jump) {
          sampled.push({ ...pts[s], ci });
          accum = 0;
          continue;
        }
        accum++;
        if (accum >= STEP_PX || s === 0 || s === pts.length - 1) {
          sampled.push({ ...pts[s], ci });
          accum = 0;
        }
      }

      const startIdx = allPts.length;
      for (const p of sampled) allPts.push({ ...p, ci });

      if (
        prevEndIdx >= 0 &&
        startIdx > prevEndIdx &&
        prevEndIdx < allPts.length
      ) {
        segs.push({
          x0: allPts[prevEndIdx].x,
          y0: allPts[prevEndIdx].y,
          x1: allPts[startIdx].x,
          y1: allPts[startIdx].y,
          ci,
          jump: true,
        });
      }

      for (let m = startIdx; m < allPts.length - 1; m++) {
        segs.push({
          x0: allPts[m].x,
          y0: allPts[m].y,
          x1: allPts[m + 1].x,
          y1: allPts[m + 1].y,
          ci,
          jump: !!allPts[m + 1].jump,
        });
      }

      prevEndIdx = allPts.length - 1;
    });

    if (segs.length === 0) {
      tgt.style.opacity = "1";
      playing = true;
      return;
    }

    // ---- Animation state ----
    const SPEED = 350 * sm;
    let curSeg = 0,
      curProg = 0;
    let parts = [];
    let animDone = false;
    let animEndTime = 0;
    let cycleHandled = false;
    let prevT = performance.now();
    let lastPos = null;

    const srcX = W / 2,
      srcY = -5;

    function _rgba(r, g, b, a) {
      return `rgba(${r},${g},${b},${a})`;
    }

    function beamPos() {
      if (curSeg >= segs.length) {
        const last = segs[segs.length - 1];
        return { x: last.x1, y: last.y1 };
      }
      const s = segs[curSeg];
      return {
        x: s.x0 + (s.x1 - s.x0) * curProg,
        y: s.y0 + (s.y1 - s.y0) * curProg,
      };
    }

    function spawnP(x, y, n, inten) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (0.3 + Math.random() * 2.8) * inten;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * sp + (Math.random() - 0.5) * 0.6,
          vy: Math.sin(a) * sp - Math.random() * 1.8 * inten,
          life: 1,
          decay: 0.012 + Math.random() * 0.028,
          sz: 0.5 + Math.random() * 2.2 * inten,
        });
      }
    }

    function drawSource(t) {
      const pulse = 0.7 + Math.sin(t * 0.004) * 0.3;
      const r = lc.r,
        g = lc.g,
        b = lc.b;
      const gr = ctx.createRadialGradient(
        srcX,
        srcY + 6,
        0,
        srcX,
        srcY + 6,
        30,
      );
      gr.addColorStop(0, _rgba(r, g, b, 0.5 * pulse));
      gr.addColorStop(0.5, _rgba(r, g, b, 0.12 * pulse));
      gr.addColorStop(1, _rgba(r, g, b, 0));
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(srcX, srcY + 6, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = _rgba(255, 255, 255, 0.7 * pulse);
      ctx.beginPath();
      ctx.arc(srcX, srcY + 6, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawBeamLine(fx, fy, tx, ty, inten) {
      if (inten < 0.01) return;
      const r = lc.r,
        g = lc.g,
        b = lc.b;
      inten *= 0.93 + Math.random() * 0.14;

      ctx.save();
      ctx.strokeStyle = _rgba(r, g, b, 0.04 * inten);
      ctx.lineWidth = 24;
      ctx.shadowColor = _rgba(r, g, b, 0.15 * inten);
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = _rgba(r, g, b, 0.14 * inten);
      ctx.lineWidth = 5;
      ctx.shadowColor = _rgba(r, g, b, 0.35 * inten);
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = _rgba(
        Math.min(255, r + 80),
        Math.min(255, g + 80),
        Math.min(255, b + 80),
        0.5 * inten,
      );
      ctx.lineWidth = 1.5;
      ctx.shadowColor = _rgba(r, g, b, 0.5 * inten);
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = _rgba(255, 255, 255, 0.3 * inten);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
    }

    function drawContact(x, y, inten) {
      if (inten < 0.01) return;
      const r = lc.r,
        g = lc.g,
        b = lc.b;
      const g1 = ctx.createRadialGradient(x, y, 0, x, y, 35 * inten);
      g1.addColorStop(0, _rgba(r, g, b, 0.45 * inten));
      g1.addColorStop(0.4, _rgba(r, g, b, 0.1 * inten));
      g1.addColorStop(1, _rgba(r, g, b, 0));
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(x, y, 35 * inten, 0, Math.PI * 2);
      ctx.fill();

      const g2 = ctx.createRadialGradient(x, y, 0, x, y, 8);
      g2.addColorStop(0, _rgba(255, 255, 255, 0.85 * inten));
      g2.addColorStop(
        0.4,
        _rgba(
          Math.min(255, r + 100),
          Math.min(255, g + 100),
          Math.min(255, b + 100),
          0.6 * inten,
        ),
      );
      g2.addColorStop(1, _rgba(r, g, b, 0));
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawBurnedChars(t) {
      if (charBoundsArr.length === 0) return;
      const r = lc.r,
        g = lc.g,
        b = lc.b;
      const curCI =
        curSeg < segs.length ? segs[curSeg].ci : charPositions.length - 1;

      for (let i = 0; i < charBoundsArr.length; i++) {
        const cb = charBoundsArr[i];
        const isDone = i < curCI || (i === curCI && animDone);
        if (!isDone && i > curCI) continue;

        const pulse = 0.6 + Math.sin(t * 0.0015 + i * 1.2) * 0.15;
        const alpha = isDone ? 0.08 * pulse : 0.04 * pulse;
        const cx = (cb.minX + cb.maxX) / 2;
        const cy = (cb.minY + cb.maxY) / 2;
        const rad = Math.max(cb.maxX - cb.minX, cb.maxY - cb.minY) * 0.7;

        const gr = ctx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          Math.max(1, rad),
        );
        gr.addColorStop(0, _rgba(r, g, b, alpha));
        gr.addColorStop(1, _rgba(r, g, b, 0));
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, rad), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ---- Main Animation Loop ----
    function draw(t) {
      if (!playing) return;
      const dt = Math.min(t - prevT, 50);
      prevT = t;

      // Update progress
      if (!animDone) {
        let segsToMove = (SPEED * dt) / 1000;
        while (segsToMove > 0 && curSeg < segs.length) {
          const seg = segs[curSeg];
          const segLen = Math.sqrt(
            (seg.x1 - seg.x0) ** 2 + (seg.y1 - seg.y0) ** 2,
          );
          const progNeeded = segLen > 0.01 ? 1 / segLen : 1;
          const progRemaining = (1 - curProg) / progNeeded;

          if (segsToMove >= progRemaining) {
            segsToMove -= progRemaining;
            curSeg++;
            curProg = 0;
          } else {
            curProg += segsToMove * progNeeded * (segLen > 0.01 ? segLen : 1);
            curProg = Math.min(curProg, 1);
            segsToMove = 0;
          }
        }

        if (curSeg >= segs.length) {
          animDone = true;
          animEndTime = t;
        }
      }

      const bp = beamPos();

      // Spawn particles only while drawing
      if (!animDone && curSeg < segs.length && !segs[curSeg].jump) {
        if (Math.random() < 0.5) spawnP(bp.x, bp.y, 1, 0.8);
        if (Math.random() < 0.12) spawnP(bp.x, bp.y, 3, 1.3);
      }

      // Рисуем постоянный след на отдельном холсте (ОНИ НЕ ИСЧЕЗНУТ)
      if (!animDone && lastPos) {
        const dx = bp.x - lastPos.x,
          dy = bp.y - lastPos.y;
        const dist = dx * dx + dy * dy;
        // Рисуем линию, только если это не прыжок (расстояние < 30px)
        if (dist < 900 && dist > 0.01) {
          // Layer 1: wide glow
          permCtx.save();
          permCtx.lineCap = "round";
          permCtx.lineJoin = "round";
          permCtx.strokeStyle = _rgba(lc.r, lc.g, lc.b, 0.06);
          permCtx.lineWidth = 20;
          permCtx.shadowColor = _rgba(lc.r, lc.g, lc.b, 0.25);
          permCtx.shadowBlur = 40;
          permCtx.beginPath();
          permCtx.moveTo(lastPos.x, lastPos.y);
          permCtx.lineTo(bp.x, bp.y);
          permCtx.stroke();
          permCtx.restore();
          // Layer 2: medium
          permCtx.save();
          permCtx.lineCap = "round";
          permCtx.lineJoin = "round";
          permCtx.strokeStyle = _rgba(lc.r, lc.g, lc.b, 0.2);
          permCtx.lineWidth = 5;
          permCtx.shadowColor = _rgba(lc.r, lc.g, lc.b, 0.5);
          permCtx.shadowBlur = 14;
          permCtx.beginPath();
          permCtx.moveTo(lastPos.x, lastPos.y);
          permCtx.lineTo(bp.x, bp.y);
          permCtx.stroke();
          permCtx.restore();
          // Layer 3: core
          permCtx.save();
          permCtx.lineCap = "round";
          permCtx.lineJoin = "round";
          permCtx.strokeStyle = _rgba(
            Math.min(255, lc.r + 80),
            Math.min(255, lc.g + 80),
            Math.min(255, lc.b + 80),
            0.6,
          );
          permCtx.lineWidth = 1.8;
          permCtx.shadowColor = _rgba(lc.r, lc.g, lc.b, 0.6);
          permCtx.shadowBlur = 6;
          permCtx.beginPath();
          permCtx.moveTo(lastPos.x, lastPos.y);
          permCtx.lineTo(bp.x, bp.y);
          permCtx.stroke();
          permCtx.restore();
        }
      }
      lastPos = bp;

      // Update particles
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.vx *= 0.985;
        p.life -= p.decay;
        if (p.life <= 0) parts.splice(i, 1);
      }
      if (parts.length > 500) parts.splice(0, parts.length - 500);

      // Draw
      ctx.clearRect(0, 0, cv.width, cv.height);

      // 1. Выводим накопленный постоянный след
      ctx.drawImage(permCv, 0, 0);

      // 2. Свечение уже нарисованных символов
      drawBurnedChars(t);

      // 3. Рисуем активный лазер и искры
      const srcPt = { x: srcX, y: srcY + 6 };

      if (!animDone) {
        drawSource(t);
        drawBeamLine(srcPt.x, srcPt.y, bp.x, bp.y, 1);
        drawContact(bp.x, bp.y, 1);
      } else if (animEndTime > 0) {
        const fadeP = Math.max(0, 1 - (t - animEndTime) / 1000 / 0.5);
        if (fadeP > 0) {
          drawSource(t);
          drawBeamLine(srcPt.x, srcPt.y, bp.x, bp.y, fadeP);
          drawContact(bp.x, bp.y, fadeP);
        }
      }

      // Draw sparks/particles
      for (const p of parts) {
        const a = p.life;
        ctx.save();
        ctx.fillStyle = _rgba(lc.r, lc.g, lc.b, a * 0.9);
        ctx.shadowColor = _rgba(lc.r, lc.g, lc.b, a * 0.4);
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.3, p.sz * p.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Handle completion
      if (animDone && !cycleHandled) {
        const elapsed = (t - animEndTime) / 1000;
        if (elapsed > 0.5 && parts.length === 0) {
          cycleHandled = true;
          if (S.autoTrigger) {
            timer = setTimeout(
              () => triggerCycleEnd(tgt),
              S.activityTime * 1000,
            );
          } else if (S.loop) {
            timer = setTimeout(() => triggerCycleEnd(tgt), 3000);
          }
          // Если auto trigger и loop выключены — таймер не ставится, светящийся текст остаётся навсегда!
        }
      }

      // Продолжаем цикл, пока рисуем или есть искры
      if (
        playing &&
        (!animDone ||
          parts.length > 0 ||
          (animDone && (t - animEndTime) / 1000 < 0.5))
      ) {
        animFrame = requestAnimationFrame(draw);
      } else if (playing) {
        // Останавливаем цикл для экономии ресурсов, но НЕ очищаем экран. Текст останется.
      }
    }

    animFrame = requestAnimationFrame(draw);
  },

  exitFire: function (tgt, cv) {
    const rect = tgt.getBoundingClientRect();
    const cvR = cv.getBoundingClientRect();
    const x = rect.left - cvR.left;
    const y = rect.top - cvR.top;
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) {
      tgt.style.opacity = "0";
      timer = setTimeout(() => {
        stopFx(tgt, cv, currentSl);
        handleNextCycle(tgt);
      }, 50);
      return;
    }
    sizeCV(cv);
    const ctx = cv.getContext("2d");
    tgt.style.opacity = "1";
    tgt.style.clipPath = "inset(0 0 0% 0)";
    const fireParticles = [];
    const sparks = [];
    const sm = vm(S.dspeed);
    const baseDur = 2500;
    const dur = Math.max(500, baseDur / sm);
    const startTime = Date.now();
    class FireParticle {
      constructor(px, py) {
        this.x = px;
        this.y = py;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -Math.random() * 5 - 2;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 15 + 5;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.96;
      }
      draw(context) {
        if (this.life <= 0) return;
        let r, g, b;
        if (this.life > 0.8) {
          r = 255;
          g = 255;
          b = 100;
        } else if (this.life > 0.5) {
          r = 255;
          g = 100;
          b = 0;
        } else {
          r = 200;
          g = 20;
          b = 0;
        }
        context.beginPath();
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.life})`;
        context.shadowBlur = 20;
        context.shadowColor = `rgb(${r}, ${g}, ${b})`;
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      }
    }
    class Spark {
      constructor(px, py) {
        this.x = px;
        this.y = py;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -Math.random() * 10 - 5;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life -= this.decay;
      }
      draw(context) {
        if (this.life <= 0) return;
        context.beginPath();
        context.fillStyle = `rgba(255, 200, 50, ${this.life})`;
        context.shadowBlur = 5;
        context.shadowColor = "yellow";
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      }
    }
    function draw() {
      if (!playing) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / dur);
      ctx.clearRect(0, 0, cv.width, cv.height);
      tgt.style.clipPath = `inset(0 0 ${progress * 100}% 0)`;
      if (progress < 1) {
        const currentLineY = y + h - h * progress;
        const spawnCount = Math.ceil((w / 20) * Math.max(1, sm));
        for (let i = 0; i < spawnCount; i++) {
          const px = x + Math.random() * w;
          const py = currentLineY + (Math.random() - 0.5) * 10;
          fireParticles.push(new FireParticle(px, py));
        }
        if (Math.random() < 0.3)
          sparks.push(new Spark(x + Math.random() * w, currentLineY));
      }
      for (let i = fireParticles.length - 1; i >= 0; i--) {
        fireParticles[i].update();
        fireParticles[i].draw(ctx);
        if (fireParticles[i].life <= 0) fireParticles.splice(i, 1);
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        sparks[i].update();
        sparks[i].draw(ctx);
        if (sparks[i].life <= 0) sparks.splice(i, 1);
      }
      if (elapsed < dur + 1000 || fireParticles.length > 0 || sparks.length > 0)
        requestAnimationFrame(draw);
      else {
        tgt.style.clipPath = "";
        tgt.style.opacity = "0";
        stopFx(tgt, cv, currentSl);
        handleNextCycle(tgt);
      }
    }
    draw();
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
        stopFx(tgt, cv, currentSl);
        handleNextCycle(tgt);
      }, 100);
      return;
    }
    if (!cv) cv = currentCv;
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
    srcCtx.globalCompositeOperation = "lighter";
    const hlGrad = srcCtx.createLinearGradient(0, 0, W * 0.5, H * 0.5);
    hlGrad.addColorStop(0, "rgba(255,255,255,0.25)");
    hlGrad.addColorStop(0.5, "rgba(255,255,255,0.0)");
    hlGrad.addColorStop(1, "rgba(200,220,255,0.1)");
    srcCtx.fillStyle = hlGrad;
    lines.forEach((line, i) => {
      let x = S.align === "center" ? W / 2 : S.align === "right" ? W : 0;
      srcCtx.fillText(line, x, i * lineH);
    });
    srcCtx.globalCompositeOperation = "source-over";
    const sizeMul = (S.glassSize || 50) / 50;
    const spacing = Math.max(6, fontSize * 0.11 * sizeMul);
    const edgeMul = (S.glassEdge || 50) / 50;
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
        stopFx(tgt, cv, currentSl);
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
      tx.lineWidth = (0.5 + Math.random() * 0.8) * edgeMul;
      tx.lineJoin = "bevel";
      tx.stroke();
      tx.strokeStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.15})`;
      tx.lineWidth = 0.3 * edgeMul;
      tx.stroke();
      tx.globalCompositeOperation = "lighter";
      tx.strokeStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.1})`;
      tx.lineWidth = 0.3;
      if (pts.length >= 3) {
        const a = Math.floor(Math.random() * pts.length);
        const b = (a + 1) % pts.length;
        tx.beginPath();
        tx.moveTo(
          pts[a].x + (Math.random() - 0.5) * 3,
          pts[a].y + (Math.random() - 0.5) * 3,
        );
        tx.lineTo(
          pts[b].x + (Math.random() - 0.5) * 3,
          pts[b].y + (Math.random() - 0.5) * 3,
        );
        tx.stroke();
      }
      tx.globalCompositeOperation = "source-over";
      const cx = (mnX + mxX) / 2;
      const cy = (mnY + mxY) / 2;
      shards.push({
        cx: cx + offsetX,
        cy: cy + offsetY,
        vx: 0,
        vy: 0,
        rot: 0,
        rotSpd: 0,
        opacity: 1,
        released: false,
        delay: 0,
        img: tc2,
        w: sw,
        h: sh,
        trail: [],
      });
    }
    const speedMul = vm(S.glassSpeed || 55);
    const baseDur = EXIT_DUR["glass-shatter"] || 1800;
    const dur = Math.max(300, baseDur / speedMul);
    const gravity = 0.12 * speedMul;
    const impactX = offsetX + W / 2;
    const impactY = offsetY + H / 2;
    const sparkArr = [];
    const startTime = Date.now();
    const gc_r = Math.min(255, tc.r + 80);
    const gc_g = Math.min(255, tc.g + 80);
    const gc_b = 255;
    function animate() {
      if (!playing) return;
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const s of shards) {
        const dt = elapsed - s.delay;
        if (!s.released) {
          s.released = true;
          const dx = s.cx - impactX,
            dy = s.cy - impactY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = Math.max(4, 40 / (dist * 0.01 + 1));
          const angle = Math.atan2(dy, dx);
          const spread = (Math.random() - 0.5) * 0.7;
          s.vx =
            (Math.cos(angle + spread) * force + (Math.random() - 0.5) * 5) *
            speedMul;
          s.vy =
            (Math.sin(angle + spread) * force - Math.random() * 4) * speedMul;
          s.rotSpd = (Math.random() - 0.5) * 0.2 * speedMul;
          for (let i = 0; i < 2; i++)
            sparkArr.push({
              x: s.cx,
              y: s.cy,
              vx: (Math.random() - 0.5) * 4 * speedMul,
              vy: ((Math.random() - 0.5) * 4 - 1.5) * speedMul,
              life: 1,
              maxLife: (150 + Math.random() * 250) / speedMul,
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
        ctx.shadowColor = `rgba(${gc_r},${gc_g},${gc_b},0.25)`;
        ctx.shadowBlur = 5;
        if (s.img) ctx.drawImage(s.img, -s.w / 2, -s.h / 2);
        ctx.restore();
      }
      for (let i = sparkArr.length - 1; i >= 0; i--) {
        const sp = sparkArr[i];
        sp.vy += 0.04 * speedMul;
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.99;
        sp.life -= 16 / sp.maxLife;
        if (sp.life <= 0) {
          sparkArr.splice(i, 1);
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
      if (elapsed < dur + 200) animFrame = requestAnimationFrame(animate);
      else {
        ctx.clearRect(0, 0, cv.width, cv.height);
        stopFx(tgt, cv, currentSl);
        handleNextCycle(tgt);
      }
    }
    animate();
  },
};

function triggerCycleEnd(tgt) {
  if (!playing) return;

  // КРИТИЧЕСКИ ВАЖНО: Принудительно обрываем Canvas-анимации и начисто стираем холст
  if (S.visual === "laser" || S.visual === "smoke") {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    } // Останавливаем цикл
    if (currentCv) {
      const ctx = currentCv.getContext("2d");
      ctx.clearRect(0, 0, currentCv.width, currentCv.height);
    }
    if (tgt) tgt.style.opacity = "1"; // Убеждаемся, что HTML текст виден для анимации исчезновения
  }

  if (S.visual === "neonstroke") {
    FX.exitNeonStroke(tgt);
    return;
  }

  if (S.visual === "blood") {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    if (_bloodCtx) {
      _bloodCtx.ctx.clearRect(0, 0, _bloodCtx.cv.width, _bloodCtx.cv.height);
      _bloodCtx = null;
    }
    if (_bloodFrontCv) {
      const fCtx = _bloodFrontCv.getContext("2d");
      if (fCtx) fCtx.clearRect(0, 0, _bloodFrontCv.width, _bloodFrontCv.height);
      _bloodFrontCv.remove();
      _bloodFrontCv = null;
    }
  }
  if (S.disappear === "none" && !S.loop && !S.autoTrigger) {
    stopFx(tgt, currentCv, currentSl);
    return;
  }
  if (S.disappear === "glass-shatter") FX.exitShatter(tgt, currentCv);
  else if (S.disappear === "particle-explode") FX.exitParticles(tgt, currentCv);
  else if (S.disappear === "scatter") FX.scatter(tgt);
  else if (S.disappear === "fire-out") FX.exitFire(tgt, currentCv);
  else if (S.disappear === "shrink-point") {
    const baseDur = EXIT_DUR["shrink-point"] || 600;
    const dur = Math.max(80, baseDur / vm(S.dspeed));
    tgt.classList.add(EXIT_CLS["shrink-point"]);
    tgt.style.animationDuration = dur + "ms";
    timer = setTimeout(() => {
      stopFx(tgt, currentCv, currentSl);
      handleNextCycle(tgt);
    }, dur + 100);
  } else if (S.disappear !== "none") {
    const exitClass = EXIT_CLS[S.disappear];
    const baseDur = EXIT_DUR[S.disappear] || 700;
    const dur = Math.max(80, baseDur / vm(S.dspeed));
    tgt.classList.add(exitClass);
    tgt.style.animationDuration = dur + "ms";
    timer = setTimeout(() => {
      stopFx(tgt, currentCv, currentSl);
      handleNextCycle(tgt);
    }, dur + 100);
  } else {
    stopFx(tgt, currentCv, currentSl);
    handleNextCycle(tgt);
  }
}

function handleNextCycle(tgt) {
  if (S.autoTrigger) {
    setAutoStatus("waiting", "Waiting (" + fmtTime(S.betweenTime) + ")");
    autoT2 = setTimeout(() => {
      autoTriggerLoop(tgt, currentCv, currentSl);
    }, S.betweenTime * 1000);
  } else if (S.loop) playFx(tgt, currentCv, currentSl);
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
  _bloodCtx = null;
  if (_bloodFrontCv) {
    _bloodFrontCv.remove();
    _bloodFrontCv = null;
  }
  if (tgt._nsSvg) {
    tgt._nsSvg.remove();
    tgt._nsSvg = null;
  }
  if (tgt._laserSvg) {
    tgt._laserSvg.remove();
    tgt._laserSvg = null;
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
  currentCv = cv;
  currentSl = sl;
  applyStyle(tgt);
  if (cv) sizeCV(cv);
  const vis = S.visual,
    apr = S.appear;
  const canCombine = apr !== "none" && !SELF_ENTRANCE.has(vis);
  let effectTarget = tgt;
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
    if (
      !S.autoTrigger &&
      (S.loop || S.disappear !== "none") &&
      !SELF_ENTRANCE.has(vis)
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
