import {
  S,
  D,
  parseHash,
  parseFrameHash,
  fullURL,
  fullFrameURL,
  playFx,
  stopFx,
  startAutoTrigger,
  stopAutoTrigger,
} from "./engine.js";
import {
  initFrameEditor,
  destroyFrameEditor,
  renderFrameOBS,
  destroyFrameOBS,
} from "./frame.js";

const IS_CFG =
  location.hash === "#config" || location.search.includes("config");
const $ = (id) => document.getElementById(id);

const SITE_FONTS = [
  "IBM Plex Mono",
  "Agnosco",
  "Atonic",
  "BLOS",
  "BOWLER",
  "Bedstead",
  "Better VCR",
  "Coiny 2.0",
  "Coolvetica Compressed Rg",
  "Coolvetica Condensed Rg",
  "Coolvetica Crammed Rg",
  "Coolvetica Rg",
  "Corinthia",
  "Corsa Grotesk",
  "Cursyger",
  "Dead Hammer",
  "Foo",
  "Forward",
  "Gloria script",
  "Gunny Rewritten",
  "Kirpich",
  "Kudry Weird Headline",
  "Machrie",
  "Mail Ray Stuff",
  "Miama Nueva",
  "Moiamova-1",
  "Moiamova-2",
  "Moiamova-3",
  "Moiamova-4",
  "Morana",
  "Nasalization Rg",
  "Neucha",
  "Neuropol X Rg",
  "Penguin Attack Cyrillic",
  "Phage Regular KG",
  "Podarok",
  "Pressuru",
  "Relic Pro Canonic TRIAL",
  "acogessic",
  "fs metallic",
  "gooseberry",
  "inglobal",
  "koliko",
  "overdoze sans",
];

const FF = [
  "Arial",
  "Arial Black",
  "Arial Narrow",
  "Bahnschrift",
  "Book Antiqua",
  "Bookman Old Style",
  "Bradley Hand",
  "Calibri",
  "Cambria",
  "Candara",
  "Century",
  "Century Gothic",
  "Comic Sans MS",
  "Consolas",
  "Constantia",
  "Corbel",
  "Courier New",
  "Ebrima",
  "Franklin Gothic Medium",
  "Garamond",
  "Georgia",
  "Gill Sans MT",
  "Goudy Old Style",
  "Harrington",
  "Impact",
  "Jokerman",
  "Juice ITC",
  "Kristen ITC",
  "Lucida Console",
  "Lucida Handwriting",
  "Lucida Sans Unicode",
  "Malgun Gothic",
  "Marlett",
  "Microsoft Sans Serif",
  "MingLiU",
  "MS Gothic",
  "MS Mincho",
  "MS PGothic",
  "MV Boli",
  "NSimSun",
  "Palatino Linotype",
  "Papyrus",
  "Perpetua",
  "PMingLiU",
  "Raavi",
  "Rockwell",
  "Segoe Print",
  "Segoe Script",
  "Segoe UI",
  "Segoe UI Black",
  "Segoe UI Light",
  "Segoe UI Semibold",
  "Segoe UI Symbol",
  "SimHei",
  "SimSun",
  "Sitka Display",
  "Sitka Heading",
  "Sitka Small",
  "Sitka Text",
  "Snap ITC",
  "Sylfaen",
  "Symbol",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Wingdings",
];

const PRESETS_KEY = "obsTextEffectsPresets";
function getPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || "{}");
  } catch (e) {
    return {};
  }
}
function savePreset() {
  const nameInput = $("preset-name");
  const name = nameInput.value.trim();
  if (!name) return;
  const presets = getPresets();
  presets[name] = JSON.parse(JSON.stringify(S));
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  nameInput.value = "";
  renderPresets();
  $("preset-text").textContent = name;
}
function loadPreset(name) {
  const presets = getPresets();
  if (presets[name]) {
    Object.assign(S, D, presets[name]);
    writeUI();
    onChange();
    $("preset-text").textContent = name;
  }
  $("preset-wrapper").classList.remove("open");
}
function deletePreset(e, name) {
  e.stopPropagation();
  const presets = getPresets();
  delete presets[name];
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  renderPresets();
  if ($("preset-text").textContent === name)
    $("preset-text").textContent = "Select a preset...";
}
function renderPresets() {
  const optionsEl = $("preset-options");
  const presets = getPresets();
  const names = Object.keys(presets);
  optionsEl.innerHTML = "";
  if (names.length === 0) {
    const emptyOpt = document.createElement("div");
    emptyOpt.className = "cs-option cs-empty";
    emptyOpt.style.cssText =
      "pointer-events: none; color: var(--muted); font-style: italic;";
    emptyOpt.textContent = "No saved presets";
    optionsEl.appendChild(emptyOpt);
    return;
  }
  names.forEach((name) => {
    const opt = document.createElement("div");
    opt.className = "cs-option preset-option-item";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = name;
    nameSpan.style.flex = "1";
    const delBtn = document.createElement("i");
    delBtn.className = "fas fa-trash-alt preset-del-btn";
    delBtn.title = "Delete preset";
    delBtn.addEventListener("click", (e) => deletePreset(e, name));
    opt.appendChild(nameSpan);
    opt.appendChild(delBtn);
    opt.addEventListener("click", () => loadPreset(name));
    optionsEl.appendChild(opt);
  });
}

function fillFontSel(fonts) {
  const textEl = $("fs-text");
  const optionsEl = $("fs-options");
  const cur = S.font;
  optionsEl.innerHTML = "";
  fonts.forEach((n) => {
    const opt = document.createElement("div");
    opt.className = "cs-option" + (n === cur ? " active" : "");
    opt.textContent = n;
    opt.style.fontFamily = `"${n}", sans-serif`;
    opt.dataset.value = n;
    opt.addEventListener("mouseenter", () => updFpv(n));
    opt.addEventListener("click", () => {
      S.font = n;
      textEl.textContent = n;
      textEl.style.fontFamily = `"${n}", sans-serif`;
      optionsEl
        .querySelectorAll(".cs-option")
        .forEach((o) => o.classList.remove("active"));
      opt.classList.add("active");
      $("fs-wrapper").classList.remove("open");
      updFpv(n);
      onChange();
    });
    optionsEl.appendChild(opt);
  });
  if (fonts.includes(cur)) S.font = cur;
  else S.font = fonts[0];
  textEl.textContent = S.font;
  textEl.style.fontFamily = `"${S.font}", sans-serif`;
  updFpv(S.font);
}
function updFpv(font) {
  $("fpv").style.fontFamily = `"${font || S.font}", sans-serif`;
}
const FONTS_KEY = "obsTextEffectsFonts";
async function loadFonts() {
  const st = $("fst");
  st.textContent = "Loading fonts...";
  st.className = "fst";
  try {
    const cached = localStorage.getItem(FONTS_KEY);
    if (cached) {
      const fonts = JSON.parse(cached);
      fillFontSel(fonts);
      st.textContent =
        fonts.length + " fonts loaded (from cache). Click 'Scan' to refresh.";
      st.className = "fst ok";
      return;
    }
  } catch (e) {}
  await scanFonts();
}
async function scanFonts() {
  const st = $("fst");
  st.textContent = "Scanning system fonts...";
  st.className = "fst";
  let error = null;
  try {
    if ("queryLocalFonts" in window) {
      const raw = await window.queryLocalFonts();
      const set = new Set(SITE_FONTS);
      raw.forEach((f) => {
        const family = f.family.replace(
          /\s+(Regular|Bold|Italic|Light|Medium|Semibold|Black|Thin|ExtraBold|SemiLight|DemiBold|Heavy|ExtraLight|UltraBold|Narrow|Condensed|SemiCondensed|ExtraCondensed)\s*$/i,
          "",
        );
        set.add(family);
      });
      const list = Array.from(set).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
      fillFontSel(list);
      try {
        localStorage.setItem(FONTS_KEY, JSON.stringify(list));
      } catch (e) {}
      const systemCount = list.length - SITE_FONTS.length;
      st.textContent = `${SITE_FONTS.length} site + ${systemCount} system fonts found`;
      st.className = "fst ok";
      return;
    }
  } catch (err) {
    error = err;
  }
  const combined = [...new Set([...SITE_FONTS, ...FF])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  fillFontSel(combined);
  try {
    localStorage.setItem(FONTS_KEY, JSON.stringify(combined));
  } catch (e) {}
  st.className = "fst err";
  if (error instanceof DOMException && error.name === "NotAllowedError")
    st.textContent = "Permission denied. Click 'Scan' to try again.";
  else if (!("queryLocalFonts" in window))
    st.textContent = "Scan unavailable: requires HTTPS. Showing common fonts.";
  else st.textContent = "Scan failed. Showing common fonts.";
}

function updateVisCtrls() {
  const v = S.visual,
    a = S.appear,
    d = S.disappear;
  $("tw-opts").style.display = v === "typewriter" ? "block" : "none";
  $("cursor-opts").style.display = v === "typewriter" ? "block" : "none";
  $("pt-opts").style.display = v === "particles" ? "block" : "none";
  $("pc-opts").style.display = v === "particles" ? "block" : "none";
  $("pspd-opts").style.display = v === "particles" ? "block" : "none";
  $("sd-opts").style.display = v === "smoke" ? "block" : "none";
  $("bd-opts").style.display = v === "blood" ? "block" : "none";
  $("bdpl-opts").style.display = v === "blood" ? "block" : "none";
  $("ns-opts").style.display = v === "neonstroke" ? "block" : "none";
  const SELF_ENTRANCE_UI = new Set([
    "typewriter",
    "matrix",
    "stamp",
    "scanner",
    "pour",
    "neonstroke",
    "assemble",
  ]);
  const canCombine =
    a !== "none" && !SELF_ENTRANCE_UI.has(v) && a !== "assemble";
  $("asp-opts").style.display = canCombine ? "block" : "none";
  $("dsp-opts").style.display =
    d !== "none" &&
    d !== "particle-explode" &&
    d !== "glass-shatter" &&
    d !== "scatter"
      ? "block"
      : "none";
  $("dp-opts").style.display = d === "particle-explode" ? "block" : "none";
  $("gs-opts").style.display = d === "glass-shatter" ? "block" : "none";
  const needsActivityTime = S.autoTrigger || (S.loop && d !== "none");
  $("at-opts").style.display = needsActivityTime ? "block" : "none";
  $("atm-label").textContent = S.autoTrigger
    ? "Activity Time"
    : "Show Duration";
  $("vis-note").textContent = SELF_ENTRANCE_UI.has(v)
    ? "Has built-in entrance — appearance skipped"
    : "";
  $("apr-note").textContent =
    a !== "none" && SELF_ENTRANCE_UI.has(v)
      ? "Ignored — visual effect handles entrance"
      : "";
  if (v === "typewriter")
    $("sp-note").textContent = "Controls character typing speed";
  else if (v === "none") $("sp-note").textContent = "No active visual effect";
  else $("sp-note").textContent = "";
}

function renderColorList() {
  const container = $("nc-list");
  container.innerHTML = "";
  S.colors.forEach((color, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "ns-item";
    const input = document.createElement("input");
    input.type = "color";
    input.value = color;
    input.className = "ns-color-in";
    input.addEventListener("input", (e) => {
      S.colors[index] = e.target.value;
      onChange();
    });
    wrapper.appendChild(input);
    if (S.colors.length > 2) {
      const btn = document.createElement("button");
      btn.className = "ns-rem-btn";
      btn.innerHTML = "&times;";
      btn.title = "Remove Color";
      btn.onclick = () => {
        S.colors.splice(index, 1);
        renderColorList();
        onChange();
      };
      wrapper.appendChild(btn);
    }
    container.appendChild(wrapper);
  });
  $("nc-add").style.display = S.colors.length < 4 ? "block" : "none";
}

function readUI() {
  S.font = $("fs-text").textContent;
  S.visual = $("vis").value;
  S.appear = $("apr").value;
  S.disappear = $("dis").value;
  S.text = $("ti").value;
  S.speed = +$("sp").value;
  S.aspeed = +$("asp").value;
  S.dspeed = +$("dsp").value;
  S.size = +$("sz").value;
  S.lh = +$("lh").value;
  S.color = $("tc").value;
  S.bold = $("tg-b").classList.contains("on");
  S.italic = $("tg-i").classList.contains("on");
  S.align = document.querySelector(".ab.on")?.dataset.a || "left";
  S.glow = $("tg-gl").classList.contains("on");
  S.gc = $("gc").value;
  S.gi = +$("gi").value;
  S.stroke = $("tg-st").classList.contains("on");
  S.sc = $("sc").value;
  S.sw = +$("sw").value;
  S.cursor = $("cs").value;
  S.cc = $("cc").value;
  S.pos = document.querySelector(".pb.on")?.dataset.p || "bl";
  S.margin = +$("mg").value;
  S.sound = $("tg-sn").classList.contains("on");
  S.loop = $("tg-lo").classList.contains("on");
  S.pause = +$("lp").value;
  S.ptype = $("ptyp").value;
  S.pcolor = $("pc").value;
  S.pspd = +$("pspd").value;
  S.fdir = "up";
  S.fint = 50;
  S.sdns = +$("sdns").value;
  S.bdns = +$("bdns").value;
  S.bdpl = +$("bdpl").value;
  S.autoTrigger = $("tg-at").classList.contains("on");
  S.activityTime = +$("atm").value;
  S.betweenTime = +$("btm").value;
  const colorInputs = document.querySelectorAll(".ns-color-in");
  if (colorInputs.length > 0)
    S.colors = Array.from(colorInputs).map((inp) => inp.value);
  S.nsw = +$("nsw").value;
  S.ngi = +$("ngi").value;
  S.nsGradSpeed = +$("nsgs").value;
  S.dpc = $("dpc").value;
  S.dpsz = +$("dpsz").value;
  S.dpspd = +$("dpspd").value;
  S.glassSize = +$("gsz").value;
  S.glassEdge = +$("ged").value;
  S.glassSpeed = +$("gspd").value;
  S.frSpeed = +$("fr-speed").value;
  S.frAngle = +$("fr-angle").value;
  S.frWidth = +$("fr-width").value;
  S.frHeight = +$("fr-height").value;
  S.frSize = +$("fr-size").value;
  S.frRadius = +$("fr-radius").value;
  S.frGlow = +$("fr-glow").value;
  S.frGlowGradient = $("fr-glow-gradient")?.classList.contains("on") || false;
  updateVisCtrls();
}

function writeUI() {
  const textEl = $("fs-text");
  const optionsEl = $("fs-options");
  textEl.textContent = S.font;
  textEl.style.fontFamily = `"${S.font}", sans-serif`;
  optionsEl
    .querySelectorAll(".cs-option")
    .forEach((o) => o.classList.toggle("active", o.dataset.value === S.font));
  updFpv(S.font);
  $("vis").value = S.visual;
  $("apr").value = S.appear;
  $("dis").value = S.disappear;
  $("ti").value = S.text;
  $("sp").value = S.speed;
  $("sp-v").textContent = (S.speed / 55).toFixed(1) + "x";
  $("asp").value = S.aspeed;
  $("asp-v").textContent = (S.aspeed / 55).toFixed(1) + "x";
  $("dsp").value = S.dspeed;
  $("dsp-v").textContent = (S.dspeed / 55).toFixed(1) + "x";
  $("sz").value = S.size;
  $("sz-v").textContent = S.size + "px";
  $("lh").value = S.lh;
  $("lh-v").textContent = (S.lh / 100).toFixed(1);
  $("tc").value = S.color;
  $("tg-b").classList.toggle("on", S.bold);
  $("tg-i").classList.toggle("on", S.italic);
  document
    .querySelectorAll(".ab")
    .forEach((b) => b.classList.toggle("on", b.dataset.a === S.align));
  $("tg-gl").classList.toggle("on", S.glow);
  $("gs-gl").style.display = S.glow ? "block" : "none";
  $("gc").value = S.gc;
  $("gi").value = S.gi;
  $("gi-v").textContent = S.gi + "px";
  $("tg-st").classList.toggle("on", S.stroke);
  $("gs-st").style.display = S.stroke ? "block" : "none";
  $("sc").value = S.sc;
  $("sw").value = S.sw;
  try {
    $("sw-v").textContent = S.sw + "px";
  } catch (e) {}
  $("cs").value = S.cursor;
  $("cc").value = S.cc;
  document
    .querySelectorAll(".pb")
    .forEach((b) => b.classList.toggle("on", b.dataset.p === S.pos));
  $("mg").value = S.margin;
  try {
    $("mg-v").textContent = S.margin + "px";
  } catch (e) {}
  $("tg-sn").classList.toggle("on", S.sound);
  $("tg-lo").classList.toggle("on", S.loop);
  $("lp").value = S.pause;
  $("lp-v").textContent = (S.pause / 1000).toFixed(1) + "s";
  $("ptyp").value = S.ptype;
  $("pc").value = S.pcolor;
  $("pspd").value = S.pspd;
  $("pspd-v").textContent = (S.pspd / 55).toFixed(1) + "x";
  $("sdns").value = S.sdns;
  try {
    $("sdns-v").textContent = S.sdns + "%";
  } catch (e) {}
  $("bdns").value = S.bdns;
  try {
    $("bdns-v").textContent = S.bdns + "%";
  } catch (e) {}
  $("bdpl").value = S.bdpl;
  try {
    $("bdpl-v").textContent = S.bdpl;
  } catch (e) {}
  $("tg-at").classList.toggle("on", S.autoTrigger);
  $("atm").value = S.activityTime;
  $("atm-v").textContent = fmtTimeUI(S.activityTime);
  $("btm").value = S.betweenTime;
  $("btm-v").textContent = fmtTimeUI(S.betweenTime);
  renderColorList();
  $("nsw").value = S.nsw;
  try {
    $("nsw-v").textContent = S.nsw + "px";
  } catch (e) {}
  $("ngi").value = S.ngi;
  try {
    $("ngi-v").textContent = S.ngi;
  } catch (e) {}
  $("nsgs").value = S.nsGradSpeed;
  try {
    $("nsgs-v").textContent = (S.nsGradSpeed / 55).toFixed(1) + "x";
  } catch (e) {}
  $("dpc").value = S.dpc;
  $("dpsz").value = S.dpsz;
  try {
    $("dpsz-v").textContent = S.dpsz + "px";
  } catch (e) {}
  $("dpspd").value = S.dpspd;
  try {
    $("dpspd-v").textContent = (S.dpspd / 55).toFixed(1) + "x";
  } catch (e) {}
  $("gsz").value = S.glassSize;
  try {
    $("gsz-v").textContent = S.glassSize;
  } catch (e) {}
  $("ged").value = S.glassEdge;
  try {
    $("ged-v").textContent = S.glassEdge;
  } catch (e) {}
  $("gspd").value = S.glassSpeed;
  try {
    $("gspd-v").textContent = (S.glassSpeed / 55).toFixed(1) + "x";
  } catch (e) {}
  try {
    $("fr-speed").value = S.frSpeed;
    $("fr-speed-v").textContent =
      S.frSpeed === 0 ? "Static" : (S.frSpeed / 55).toFixed(1) + "x";
  } catch (e) {}
  try {
    $("fr-angle").value = S.frAngle;
    $("fr-angle-v").textContent = S.frAngle + "deg";
  } catch (e) {}
  try {
    $("fr-width").value = S.frWidth;
    $("fr-width-v").textContent = S.frWidth + "px";
  } catch (e) {}
  try {
    $("fr-height").value = S.frHeight;
    $("fr-height-v").textContent = S.frHeight + "px";
  } catch (e) {}
  try {
    $("fr-size").value = S.frSize;
    $("fr-size-v").textContent = S.frSize + "px";
  } catch (e) {}
  try {
    $("fr-radius").value = S.frRadius;
    $("fr-radius-v").textContent = S.frRadius + "px";
  } catch (e) {}
  try {
    $("fr-glow").value = S.frGlow;
    $("fr-glow-v").textContent = S.frGlow + "px";
  } catch (e) {}
  try {
    $("fr-glow-gradient").classList.toggle("on", S.frGlowGradient);
  } catch (e) {}
  updateVisCtrls();
}

function fmtTimeUI(sec) {
  if (sec === 0) return "0s";
  if (sec < 60) return sec + "s";
  const m = Math.floor(sec / 60),
    s = sec % 60;
  return s > 0 ? m + "m " + s + "s" : m + "m";
}
function updURL() {
  const isFrameActive = $("tab-btn-frame")?.classList.contains("active");
  if (isFrameActive) $("ubox").textContent = fullFrameURL();
  else $("ubox").textContent = fullURL();
}

let previewTimeout = null;
function onChange() {
  readUI();
  updURL();
  clearTimeout(previewTimeout);
  previewTimeout = setTimeout(() => {
    const isFrameActive = $("tab-btn-frame")?.classList.contains("active");
    if (!isFrameActive) {
      stopAutoTrigger();
      if (S.autoTrigger) startAutoTrigger($("pt"), $("pcv"), $("psl"));
      else playFx($("pt"), $("pcv"), $("psl"));
    } else {
      if (window.updateFramePreview) window.updateFramePreview();
    }
  }, 150);
}

function initCfg() {
  $("cp").classList.add("on");
  $("host-info").textContent =
    location.protocol === "https:"
      ? "HTTPS — full scan available"
      : location.protocol === "file:"
        ? "Local file — limited"
        : "HTTP";
  parseHash();
  parseFrameHash();
  writeUI();
  updURL();
  renderPresets();
  loadFonts();
  const btnFont = $("tab-btn-font");
  const btnFrame = $("tab-btn-frame");
  const contentFont = $("tab-font");
  const contentFrame = $("tab-frame");
  const textControls = $("text-control-container");
  if (btnFont && btnFrame) {
    btnFont.addEventListener("click", () => {
      btnFont.classList.add("active");
      btnFrame.classList.remove("active");
      contentFont.style.display = "block";
      contentFrame.style.display = "none";
      textControls.style.display = "block";
      const pt = $("pt");
      const pcv = $("pcv");
      if (pt) pt.style.display = "";
      if (pcv) pcv.style.display = "";
      destroyFrameEditor();
      onChange();
    });
    btnFrame.addEventListener("click", () => {
      btnFrame.classList.add("active");
      btnFont.classList.remove("active");
      contentFrame.style.display = "block";
      contentFont.style.display = "none";
      const pt = $("pt");
      const pcv = $("pcv");
      if (pt) pt.style.display = "none";
      if (pcv) pcv.style.display = "none";
      const c = $("pcv");
      if (c) {
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);
      }
      initFrameEditor();
      updURL();
    });
  }
  document.querySelectorAll(".tg").forEach((tg) => {
    tg.addEventListener("click", () => {
      tg.classList.toggle("on");
      if (tg.id === "tg-gl")
        $("gs-gl").style.display = tg.classList.contains("on")
          ? "block"
          : "none";
      if (tg.id === "tg-st")
        $("gs-st").style.display = tg.classList.contains("on")
          ? "block"
          : "none";
      onChange();
    });
  });
  const rvM = {
    sp: (v) => (v / 55).toFixed(1) + "x",
    asp: (v) => (v / 55).toFixed(1) + "x",
    dsp: (v) => (v / 55).toFixed(1) + "x",
    pspd: (v) => (v / 55).toFixed(1) + "x",
    sz: (v) => v + "px",
    lh: (v) => (v / 100).toFixed(1),
    mg: (v) => v + "px",
    gi: (v) => v + "px",
    sw: (v) => v + "px",
    lp: (v) => (v / 1000).toFixed(1) + "s",
    sdns: (v) => v + "%",
    bdns: (v) => v + "%",
    bdpl: (v) => v,
    atm: (v) => fmtTimeUI(+v),
    btm: (v) => fmtTimeUI(+v),
    nsw: (v) => v + "px",
    ngi: (v) => v,
    nsgs: (v) => (v / 55).toFixed(1) + "x",
    dpsz: (v) => v + "px",
    dpspd: (v) => (v / 55).toFixed(1) + "x",
    gsz: (v) => v,
    ged: (v) => v,
    gspd: (v) => (v / 55).toFixed(1) + "x",
    "fr-speed": (v) => (+v === 0 ? "Static" : (v / 55).toFixed(1) + "x"),
    "fr-angle": (v) => v + "deg",
    "fr-width": (v) => v + "px",
    "fr-height": (v) => v + "px",
    "fr-size": (v) => v + "px",
    "fr-radius": (v) => v + "px",
    "fr-glow": (v) => v + "px",
  };
  document.querySelectorAll('input[type="range"]').forEach((r) => {
    r.addEventListener("input", () => {
      const v = $(r.id + "-v");
      if (v && rvM[r.id]) v.textContent = rvM[r.id](r.value);
      onChange();
    });
  });
  document.querySelectorAll(".pb").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".pb").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      onChange();
    });
  });
  document.querySelectorAll(".ab").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".ab").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      onChange();
    });
  });
  $("fs-trigger").addEventListener("click", (e) => {
    e.stopPropagation();
    $("fs-wrapper").classList.toggle("open");
    $("preset-wrapper").classList.remove("open");
  });
  $("preset-trigger").addEventListener("click", (e) => {
    e.stopPropagation();
    $("preset-wrapper").classList.toggle("open");
    $("fs-wrapper").classList.remove("open");
  });
  document.addEventListener("click", (e) => {
    if (!$("fs-wrapper").contains(e.target)) {
      $("fs-wrapper").classList.remove("open");
      updFpv(S.font);
    }
    if (!$("preset-wrapper").contains(e.target))
      $("preset-wrapper").classList.remove("open");
  });
  $("bscan").addEventListener("click", scanFonts);
  $("bsave-preset").addEventListener("click", savePreset);
  $("preset-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") savePreset();
  });
  ["tc", "cc", "gc", "sc", "pc", "dpc"].forEach((id) =>
    $(id).addEventListener("input", onChange),
  );
  ["vis", "apr", "dis", "cs", "ptyp"].forEach((id) =>
    $(id).addEventListener("change", onChange),
  );
  $("ti").addEventListener("input", onChange);
  $("nc-add").addEventListener("click", () => {
    if (S.colors.length < 4) {
      S.colors.push(S.colors[S.colors.length - 1]);
      renderColorList();
      onChange();
    }
  });
  $("btest").addEventListener("click", () => {
    onChange();
    window.open($("ubox").textContent, "_blank");
  });
  $("bcopy").addEventListener("click", () => {
    onChange();
    const url = $("ubox").textContent;
    navigator.clipboard.writeText(url).then(() => {
      const b = $("bcopy");
      b.innerHTML = '<i class="fas fa-check"></i> Copied';
      b.classList.add("copied");
      setTimeout(() => {
        b.innerHTML = '<i class="fas fa-copy"></i> Copy URL';
        b.classList.remove("copied");
      }, 2000);
    });
  });
  if (S.autoTrigger)
    setTimeout(() => startAutoTrigger($("pt"), $("pcv"), $("psl")), 400);
  else setTimeout(() => playFx($("pt"), $("pcv"), $("psl")), 300);
}

function waitForFont(fontName) {
  return new Promise((resolve) => {
    if (!document.fonts || !document.fonts.load) {
      resolve(false);
      return;
    }
    const fontSpec = `bold 48px "${fontName}"`;
    document.fonts.load(fontSpec).then(
      (faces) => {
        resolve(faces.length > 0);
      },
      () => {
        resolve(false);
      },
    );
    setTimeout(() => resolve(false), 3000);
  });
}
async function initOv() {
  const params = new URLSearchParams(location.hash.slice(1));
  const mode = params.get("mode");
  if (mode === "frame") {
    parseFrameHash();
    renderFrameOBS();
  } else {
    parseHash();
    await waitForFont(S.font);
    const cv = $("cv");
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    playFx($("ov"), cv, $("sl"));
    if (S.autoTrigger)
      setTimeout(() => startAutoTrigger($("ov"), cv, $("sl")), 300);
    window.addEventListener("resize", () => {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
    });
  }
}

if (IS_CFG) initCfg();
else initOv();
