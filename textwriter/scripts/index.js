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

// ===== СИСТЕМА ПЕРЕКЛЮЧЕНИЯ ЯЗЫКОВ =====
const LANG = {
  ru: {
    btnLang: "RU",
    sTextPresets: "Пресеты текста",
    sFramePresets: "Пресеты рамки",
    presetName: "Имя пресета...",
    presetSelect: "Выбрать пресет...",
    presetEmpty: "Нет сохранённых пресетов",
    sFont: "Шрифт",
    sContent: "Контент",
    lText: "Текст (строка = запись)",
    sAnimation: "Анимация",
    lVisualEffect: "Визуальный эффект",
    visNone: "Нет (статичный)",
    visTypewriter: "Печатная машинка",
    visNeon: "Неон мерцание",
    visGlitch: "Глитч (RGB сдвиг)",
    visSmoke: "Дым / Туман",
    visFire: "Огонь (мерцание)",
    visIce: "Лёд (заморозка + трещины)",
    visChrome: "Золото / Хром",
    visWave: "Волна",
    visShake: "Тряска (алерт)",
    visRipple: "Рябь",
    visGlowpulse: "Пульсация свечения",
    visShadow: "Движущаяся тень",
    visPour: "Выливание (буквы падают)",
    visStamp: "Штамп печати",
    visScanner: "Сканер",
    visRainbow: "Радуга",
    visMatrix: "Матрица",
    visWater: "Искажение водой",
    visParticles: "Падающие частицы",
    visNeonstroke: "Неоновый штрих",
    visBlood: "Кровь",
    visLaser: "Лазерное письмо",
    lVisualSpeed: "Скорость визуального эффекта",
    lAppearance: "Эффект появления",
    aprNone: "Нет",
    aprAssemble: "Сборка текста",
    aprSlideL: "Слева",
    aprSlideR: "Справа",
    aprFallDown: "Сверху",
    aprRiseUp: "Снизу",
    aprRotateIn: "Вращение",
    aprBlurIn: "Через блюр",
    aprPixelIn: "Через пиксели",
    aprFadeIn: "Плавное появление",
    aprMaskStripe: "Маска-полоса",
    aprZoomIn: "Масштаб",
    lAppearSpeed: "Скорость появления",
    lDisappear: "Эффект исчезновения",
    disNone: "Нет (мгновенно)",
    disScatter: "Рассеивание букв",
    disSlideL: "Влево",
    disSlideR: "Вправо",
    disFallDown: "Вниз",
    disRiseUp: "Вверх",
    disRotateOut: "Вращение",
    disBlurOut: "Через блюр",
    disPixelOut: "Через пиксели",
    disFadeOut: "Плавное исчезновение",
    disMaskStripe: "Маска-полоса",
    disZoomOut: "Масштаб",
    disGlass: "Стекло",
    disShrink: "Сжатие в точку",
    disParticles: "Взрыв частицами",
    disFire: "Огонь",
    lDisappearSpeed: "Скорость исчезновения",
    lPartColor: "Цвет частиц",
    lPartSize: "Размер частиц",
    lExpSpeed: "Скорость взрыва",
    lShardSize: "Размер осколков",
    lEdgeThick: "Толщина краёв",
    lGlassSpeed: "Скорость стекла",
    lPartType: "Тип частиц",
    ptSnow: "Снег",
    ptPetals: "Лепестки",
    ptSparks: "Искры",
    lPartFallColor: "Цвет частиц",
    lPartFallSpeed: "Скорость падения",
    lSmokeDensity: "Плотность дыма",
    lBloodDensity: "Плотность крови",
    lDripLength: "Длина капель",
    lGradColors: "Градиентные цвета",
    btnAddColor: "Добавить цвет",
    lStrokeWidth: "Толщина штриха",
    lGlowInt: "Интенсивность свечения",
    lGradSpeed: "Скорость градиента",
    lPause: "Пауза между строками",
    tSound: "Звук",
    tLoop: "Зациклить",
    tAuto: "Автозапуск",
    lShowDur: "Время показа",
    lPauseBetween: "Пауза между запусками",
    autoIdle: "Ожидание",
    sFrameAppearance: "Внешний вид",
    lFrameGradColors: "Градиентные цвета (макс. 5)",
    lFrameGradSpeed: "Скорость градиента",
    note0Static: "0 = Статичный",
    lFrameGradDir: "Направление градиента",
    lFrameTubeSize: "Размер трубки (толщина рамки)",
    lFrameCorner: "Радиус углов",
    lFrameGlow: "Интенсивность свечения",
    tFrameGradGlow: "Градиентное свечение",
    noteSyncGlow: "Синхронизация цвета свечения с градиентом",
    sDimensions: "Размеры",
    lFrameWidth: "Ширина рамки",
    lFrameHeight: "Высота рамки",
    navText: "Текст",
    navFrame: "Рамка",
    sColors: "Цвета",
    lTextColor: "Цвет текста",
    tGlow: "Свечение",
    tStroke: "Обводка",
    sCursor: "Курсор",
    lCursorStyle: "Стиль",
    csBlock: "Блок",
    csLine: "Линия",
    csUnder: "Подчёркивание",
    csNone: "Нет",
    lCursorColor: "Цвет курсора",
    sStyle: "Стиль",
    lSize: "Размер",
    lLineHeight: "Высота строки",
    tBold: "Жирный",
    tItalic: "Курсив",
    lAlign: "Выравнивание",
    sLayout: "Расположение",
    lPosition: "Позиция",
    lMargin: "Отступ",
    sPreview: "Предпросмотр",
    tPlay: "Воспроизвести",
    tStop: "Остановить",
    tDarkBg: "Тёмный фон",
    tLightBg: "Светлый фон",
    sObsUrl: "OBS Ссылка",
  },
  en: {
    btnLang: "EN",
    sTextPresets: "Text Presets",
    sFramePresets: "Frame Presets",
    presetName: "Preset name...",
    presetSelect: "Select a preset...",
    presetEmpty: "No saved presets",
    sFont: "Font",
    sContent: "Content",
    lText: "Text (one line per entry)",
    sAnimation: "Animation",
    lVisualEffect: "Visual Effect",
    visNone: "None (static)",
    visTypewriter: "Typewriter",
    visNeon: "Neon Flicker",
    visGlitch: "Glitch (RGB Shift)",
    visSmoke: "Smoke / Fog",
    visFire: "Fire (Text Flicker)",
    visIce: "Ice (Frozen + Cracks)",
    visChrome: "Gold / Chrome",
    visWave: "Wave",
    visShake: "Shaking (Alert)",
    visRipple: "Ripple",
    visGlowpulse: "Glow Pulse",
    visShadow: "Moving Shadow",
    visPour: "Pour (Letters Fall Into Place)",
    visStamp: "Print Stamp",
    visScanner: "Scanner Line",
    visRainbow: "Rainbow",
    visMatrix: "Matrix Code",
    visWater: "Water Distortion",
    visParticles: "Falling Particles",
    visNeonstroke: "Neon Stroke (Flowing Light)",
    visBlood: "Blood Drip",
    visLaser: "Laser Writing",
    lVisualSpeed: "Visual Effect Speed",
    lAppearance: "Appearance Effect",
    aprNone: "None",
    aprAssemble: "Assembling Text",
    aprSlideL: "From Left",
    aprSlideR: "From Right",
    aprFallDown: "Falling from Above",
    aprRiseUp: "Rising from Below",
    aprRotateIn: "Rotate In",
    aprBlurIn: "Through Blur",
    aprPixelIn: "Through Pixels",
    aprFadeIn: "Fade In",
    aprMaskStripe: "Mask Stripe",
    aprZoomIn: "Zoom In",
    lAppearSpeed: "Appearance Speed",
    lDisappear: "Disappearing Effect",
    disNone: "None (Instant)",
    disScatter: "Scattering Letters",
    disSlideL: "Slide Left",
    disSlideR: "Slide Right",
    disFallDown: "Fall Down",
    disRiseUp: "Rise Up",
    disRotateOut: "Rotate Out",
    disBlurOut: "Through Blur",
    disPixelOut: "Through Pixels",
    disFadeOut: "Fade Out",
    disMaskStripe: "Mask Stripe",
    disZoomOut: "Zoom Out",
    disGlass: "Breaks like Glass",
    disShrink: "Shrinks to a Point",
    disParticles: "Transforms into Particles",
    disFire: "Burn / Fire",
    lDisappearSpeed: "Disappearing Speed",
    lPartColor: "Particle Color",
    lPartSize: "Particle Size",
    lExpSpeed: "Explosion Speed",
    lShardSize: "Shard Size",
    lEdgeThick: "Edge Thickness",
    lGlassSpeed: "Glass Speed",
    lPartType: "Particle Type",
    ptSnow: "Snow",
    ptPetals: "Petals",
    ptSparks: "Sparks",
    lPartFallColor: "Particle Color",
    lPartFallSpeed: "Particle Fall Speed",
    lSmokeDensity: "Smoke Density",
    lBloodDensity: "Blood Density",
    lDripLength: "Drip Length",
    lGradColors: "Gradient Colors",
    btnAddColor: "Add Color",
    lStrokeWidth: "Stroke Width",
    lGlowInt: "Glow Intensity",
    lGradSpeed: "Gradient Speed",
    lPause: "Pause Between Lines",
    tSound: "Sound",
    tLoop: "Loop",
    tAuto: "Auto Trigger",
    lShowDur: "Activity Time",
    lPauseBetween: "Time Between Activations",
    autoIdle: "Idle",
    sFrameAppearance: "Frame Appearance",
    lFrameGradColors: "Gradient Colors (Max 5)",
    lFrameGradSpeed: "Gradient Speed",
    note0Static: "0 = Static",
    lFrameGradDir: "Gradient Direction",
    lFrameTubeSize: "Tube Size (Border Width)",
    lFrameCorner: "Corner Radius",
    lFrameGlow: "Glow Intensity",
    tFrameGradGlow: "Gradient Glow",
    noteSyncGlow: "Syncs glow color with gradient movement",
    sDimensions: "Dimensions",
    lFrameWidth: "Frame Width",
    lFrameHeight: "Frame Height",
    navText: "Font",
    navFrame: "Frame",
    sColors: "Colors",
    lTextColor: "Color",
    tGlow: "Glow",
    tStroke: "Stroke",
    sCursor: "Cursor",
    lCursorStyle: "Style",
    csBlock: "Block",
    csLine: "Line",
    csUnder: "Underscore",
    csNone: "None",
    lCursorColor: "Cursor Color",
    sStyle: "Style",
    lSize: "Size",
    lLineHeight: "Line Height",
    tBold: "Bold",
    tItalic: "Italic",
    lAlign: "Align",
    sLayout: "Layout",
    lPosition: "Position",
    lMargin: "Margin",
    sPreview: "Preview",
    tPlay: "Play",
    tStop: "Stop",
    tDarkBg: "Dark background",
    tLightBg: "Light background",
    sObsUrl: "OBS URL",
  },
};

let currentLang = "ru";

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (LANG[lang][key]) el.textContent = LANG[lang][key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (LANG[lang][key]) el.placeholder = LANG[lang][key];
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (LANG[lang][key]) el.title = LANG[lang][key];
  });
  const emptyOpt = document.querySelector("#preset-options .cs-empty");
  if (emptyOpt) emptyOpt.textContent = LANG[lang].presetEmpty;

  const isFrameActive = $("tab-btn-frame")?.classList.contains("active");
  const presetsTitle = $("presets-title");
  if (presetsTitle) {
    presetsTitle.textContent =
      LANG[lang][isFrameActive ? "sFramePresets" : "sTextPresets"];
  }
}

// ===== РАЗДЕЛЬНЫЕ ПРЕСЕТЫ =====
const PRESETS_KEY_TEXT = "obsTextEffectsPresets";
const PRESETS_KEY_FRAME = "obsFrameEffectsPresets";

function getPresetsKey() {
  return $("tab-btn-frame")?.classList.contains("active")
    ? PRESETS_KEY_FRAME
    : PRESETS_KEY_TEXT;
}

function getPresets() {
  try {
    return JSON.parse(localStorage.getItem(getPresetsKey()) || "{}");
  } catch (e) {
    return {};
  }
}

function savePreset() {
  const nameInput = $("preset-name");
  const name = nameInput.value.trim();
  if (!name) return;
  const presets = getPresets();
  const isFrame = $("tab-btn-frame")?.classList.contains("active");
  if (isFrame) {
    presets[name] = {
      frColors: S.frColors,
      frSpeed: S.frSpeed,
      frAngle: S.frAngle,
      frSize: S.frSize,
      frGlow: S.frGlow,
      frGlowGradient: S.frGlowGradient,
      frRadius: S.frRadius,
      frWidth: S.frWidth,
      frHeight: S.frHeight,
    };
  } else {
    presets[name] = JSON.parse(JSON.stringify(S));
  }
  localStorage.setItem(getPresetsKey(), JSON.stringify(presets));
  nameInput.value = "";
  renderPresets();
  $("preset-text").textContent = name;
}

function loadPreset(name) {
  const presets = getPresets();
  if (presets[name]) {
    const isFrame = $("tab-btn-frame")?.classList.contains("active");
    if (isFrame) {
      Object.assign(S, presets[name]);
    } else {
      Object.assign(S, D, presets[name]);
    }
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
  localStorage.setItem(getPresetsKey(), JSON.stringify(presets));
  renderPresets();
  if ($("preset-text").textContent === name)
    $("preset-text").textContent = LANG[currentLang].presetSelect;
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
    emptyOpt.textContent = LANG[currentLang].presetEmpty;
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

// ===== ШРИФТЫ =====
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
      st.textContent = fonts.length + " fonts loaded (from cache).";
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
    st.textContent = "Permission denied.";
  else if (!("queryLocalFonts" in window))
    st.textContent = "Scan unavailable: requires HTTPS.";
  else st.textContent = "Scan failed.";
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
    if (S.colors.length > 1) {
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
  $("nc-add").style.display = S.colors.length < 5 ? "block" : "none"; // Лимит 5 цветов
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

  // Баг-фикс: берем цвета только из списка неонового штриха (игнорируем рамку)
  const colorInputs = document.querySelectorAll("#nc-list .ns-color-in");
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
      ? "HTTPS"
      : location.protocol === "file:"
        ? "Local"
        : "HTTP";
  parseHash();
  parseFrameHash();
  writeUI();
  updURL();
  renderPresets();
  loadFonts();

  // ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
  const btnFont = $("tab-btn-font");
  const btnFrame = $("tab-btn-frame");

  if (btnFont && btnFrame) {
    btnFont.addEventListener("click", () => {
      btnFont.classList.add("active");
      btnFrame.classList.remove("active");
      $("tab-font").style.display = "block";
      $("tab-frame").style.display = "none";
      $("font-section").style.display = "block";
      $("text-control-container").style.display = "block";
      $("presets-title").textContent = LANG[currentLang].sTextPresets;
      renderPresets();
      $("preset-text").textContent = LANG[currentLang].presetSelect;
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
      $("tab-font").style.display = "none";
      $("tab-frame").style.display = "block";
      $("font-section").style.display = "none";
      $("text-control-container").style.display = "none";

      // Баг-фикс: полностью останавливаем эффекты превью, чтобы SVG и Canvas очищались
      stopFx($("pt"), $("pcv"), $("psl"));
      stopAutoTrigger();

      $("presets-title").textContent = LANG[currentLang].sFramePresets;
      renderPresets();
      $("preset-text").textContent = LANG[currentLang].presetSelect;
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
  // Фикс добавления цветов по одному
  $("nc-add").addEventListener("click", () => {
    if (S.colors.length < 5) {
      S.colors.push("#ffffff");
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

  $("blang").addEventListener("click", () => {
    const newLang = currentLang === "ru" ? "en" : "ru";
    applyLang(newLang);
  });
  $("bbg-dark").addEventListener("click", () => {
    $("pstage").classList.remove("light-bg");
    $("bbg-dark").classList.add("active");
    $("bbg-light").classList.remove("active");
  });
  $("bbg-light").addEventListener("click", () => {
    $("pstage").classList.add("light-bg");
    $("bbg-light").classList.add("active");
    $("bbg-dark").classList.remove("active");
  });
  $("bplay").addEventListener("click", () => {
    onChange();
  });
  $("bstop").addEventListener("click", () => {
    stopFx($("pt"), $("pcv"), $("psl"));
    stopAutoTrigger();
  });
  $("tc").addEventListener("input", (e) => {
    const hex = $("tc-hex");
    if (hex) hex.textContent = e.target.value;
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
