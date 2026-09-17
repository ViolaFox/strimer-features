// scripts/landing.js
// ===== ЛОГИКА ЛЕНДИНГА =====

import { createAuth0Client } from "https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js/+esm";

// === ВСТАВЬ СВОИ ЗНАЧЕНИЯ ===
const AUTH0_DOMAIN = "text-effects.auth0.com";
const AUTH0_CLIENT_ID = "auth0|6aabd54e69a3f610cb664946";
const AUTH0_AUDIENCE = "https://text-effects-pro-api";

// ===== ЯЗЫКИ =====
const LANG = {
  ru: {
    navVisual: "Визуальные",
    navAppear: "Появление",
    navDisappear: "Исчезновение",
    navPricing: "Цены",
    login: "Войти",
    signup: "Начать бесплатно",
    heroBadge: "Работает с OBS Browser Source",
    heroTitle1: "Кинематографичные",
    heroTitle2: "эффекты текста",
    heroTitle3: "для твоих стримов",
    heroSub:
      "Создавай глитч, неон, огонь, дым и ещё 30+ эффектов за секунды. Настраивай прямо в браузере — подключай к OBS одной ссылкой.",
    heroCta: "Начать бесплатно",
    heroDemo: "Смотреть эффекты",
    statEffects: "эффектов",
    statLatency: "задержка в OBS",
    statClick: "клик для подключения",
    slider1Tag: "01 — VISUAL",
    slider1Title: "Визуальные эффекты",
    slider1Sub:
      "Глитч, неон, огонь, дым, хром, матрица и другие — применяются к тексту и работают постоянно",
    slider2Tag: "02 — APPEARANCE",
    slider2Title: "Эффекты появления",
    slider2Sub:
      "Текст въезжает, собирается, проявляется через блюр или пиксели — 12 готовых анимаций",
    slider3Tag: "03 — DISAPPEARANCE",
    slider3Title: "Эффекты исчезновения",
    slider3Sub:
      "Стекло разбивается, буквы разлетаются частицами, текст сгорает — и ещё 15 способов уйти красиво",
    // Слайды
    visGlitchLabel: "Глитч (RGB сдвиг)",
    visNeonLabel: "Неон мерцание",
    visFireLabel: "Огонь",
    visSmokeLabel: "Дым / Туман",
    visMatrixLabel: "Матрица",
    visChromeLabel: "Золото / Хром",
    aprAssembleLabel: "Сборка текста",
    aprSlideLabel: "Выезд сбоку",
    aprBlurLabel: "Через блюр",
    aprPixelLabel: "Через пиксели",
    aprZoomLabel: "Масштаб",
    disGlassLabel: "Стекло",
    disScatterLabel: "Рассеивание букв",
    disFireLabel: "Сгорание",
    disParticlesLabel: "Взрыв частицами",
    disBlurLabel: "Через блюр",
    // Features
    featTag: "FEATURES",
    featTitle: "Всё, что нужно стримеру",
    feat1Title: "Мгновенный отклик",
    feat1Sub: "Ноль задержек — эффекты появляются в OBS сразу после запуска",
    feat2Title: "60+ шрифтов",
    feat2Sub: "От неона до рукописных — все подключены и готовы к работе",
    feat3Title: "Рамки с градиентом",
    feat3Sub: "Неоновые рамки с анимированными градиентами и свечением",
    feat4Title: "Пресеты",
    feat4Sub: "Сохраняй настройки и переключайся между ними в один клик",
    // Pricing
    pricingTag: "PRICING",
    pricingTitle: "Один платёж — навсегда",
    pricingSub: "Никаких подписок. Купил один раз — используешь сколько хочешь",
    price1Name: "Старт",
    price1f1: "Просмотр всех эффектов",
    price1f2: "Демо-превью",
    price1f3: "Без экспорта в OBS",
    price1Btn: "Попробовать",
    price2Name: "Pro",
    priceBadge: "Популярный",
    price2f1: "Все 30+ эффектов",
    price2f2: "OBS Browser Source ссылка",
    price2f3: "Пресеты и рамки",
    price2f4: "Привязка к 1 устройству",
    price2f5: "Пожизненный доступ",
    price2Btn: "Купить Pro",
    // CTA + Footer
    ctaTitle: "Готов добавить магии в свой стрим?",
    ctaSub: "Регистрация занимает 10 секунд. Первые эффекты — сразу",
    ctaBtn: "Начать бесплатно",
    footerCopy: "© 2025 Text Effects Pro. Все права защищены.",
  },
  en: {
    navVisual: "Visual",
    navAppear: "Appearance",
    navDisappear: "Disappearance",
    navPricing: "Pricing",
    login: "Login",
    signup: "Start Free",
    heroBadge: "Works with OBS Browser Source",
    heroTitle1: "Cinematic",
    heroTitle2: "text effects",
    heroTitle3: "for your streams",
    heroSub:
      "Create glitch, neon, fire, smoke and 30+ more effects in seconds. Customize in browser — connect to OBS with one link.",
    heroCta: "Start Free",
    heroDemo: "See Effects",
    statEffects: "effects",
    statLatency: "OBS latency",
    statClick: "click to connect",
    slider1Tag: "01 — VISUAL",
    slider1Title: "Visual Effects",
    slider1Sub:
      "Glitch, neon, fire, smoke, chrome, matrix and more — applied to text, working constantly",
    slider2Tag: "02 — APPEARANCE",
    slider2Title: "Appearance Effects",
    slider2Sub:
      "Text slides in, assembles, appears through blur or pixels — 12 ready animations",
    slider3Tag: "03 — DISAPPEARANCE",
    slider3Title: "Disappearance Effects",
    slider3Sub:
      "Glass shatters, letters scatter into particles, text burns — and 15 more ways to exit beautifully",
    visGlitchLabel: "Glitch (RGB Shift)",
    visNeonLabel: "Neon Flicker",
    visFireLabel: "Fire",
    visSmokeLabel: "Smoke / Fog",
    visMatrixLabel: "Matrix",
    visChromeLabel: "Gold / Chrome",
    aprAssembleLabel: "Text Assemble",
    aprSlideLabel: "Slide In",
    aprBlurLabel: "Through Blur",
    aprPixelLabel: "Through Pixels",
    aprZoomLabel: "Zoom",
    disGlassLabel: "Glass",
    disScatterLabel: "Scattering Letters",
    disFireLabel: "Burning",
    disParticlesLabel: "Particle Explosion",
    disBlurLabel: "Through Blur",
    featTag: "FEATURES",
    featTitle: "Everything a streamer needs",
    feat1Title: "Instant Response",
    feat1Sub: "Zero delay — effects appear in OBS immediately",
    feat2Title: "60+ Fonts",
    feat2Sub: "From neon to handwritten — all connected and ready",
    feat3Title: "Gradient Frames",
    feat3Sub: "Neon frames with animated gradients and glow",
    feat4Title: "Presets",
    feat4Sub: "Save your settings and switch between them in one click",
    pricingTag: "PRICING",
    pricingTitle: "One payment — forever",
    pricingSub: "No subscriptions. Buy once, use forever",
    price1Name: "Start",
    price1f1: "View all effects",
    price1f2: "Demo preview",
    price1f3: "No OBS export",
    price1Btn: "Try it",
    price2Name: "Pro",
    priceBadge: "Popular",
    price2f1: "All 30+ effects",
    price2f2: "OBS Browser Source link",
    price2f3: "Presets and frames",
    price2f4: "1 device binding",
    price2f5: "Lifetime access",
    price2Btn: "Buy Pro",
    ctaTitle: "Ready to add magic to your stream?",
    ctaSub: "Sign up takes 10 seconds. First effects — right away",
    ctaBtn: "Start Free",
    footerCopy: "© 2025 Text Effects Pro. All rights reserved.",
  },
};

let currentLang = localStorage.getItem("tep_lang") || "ru";

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem("tep_lang", lang);
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (LANG[lang][key]) el.textContent = LANG[lang][key];
  });
  const btn = document.getElementById("ld-lang");
  if (btn) btn.textContent = lang.toUpperCase();
}

// ===== AUTH0 =====
let auth0 = null;
let user = null;

async function initAuth() {
  auth0 = await createAuth0Client({
    domain: AUTH0_DOMAIN,
    clientId: AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: window.location.origin + "/index.html",
      audience: AUTH0_AUDIENCE,
    },
    cacheLocation: "localstorage",
  });

  // Если уже залогинен — сразу в редактор
  if (await auth0.isAuthenticated()) {
    user = await auth0.getUser();
    window.location.href = "/index.html";
    return;
  }
}

async function login() {
  await auth0.loginWithRedirect({
    authorizationParams: {
      redirect_uri: window.location.origin + "/index.html",
    },
  });
}

// ===== СЛАЙДЕРЫ =====
function setupSlider(root) {
  const track = root.querySelector("[data-track]");
  const slides = Array.from(track.children);
  const dots = root.querySelector("[data-dots]");
  const prev = root.querySelector("[data-prev]");
  const next = root.querySelector("[data-next]");
  let i = 0;
  let autoplayTimer = null;

  // Точки
  slides.forEach((_, idx) => {
    const d = document.createElement("button");
    d.className = "ld-slider-dot";
    d.setAttribute("aria-label", `Slide ${idx + 1}`);
    d.addEventListener("click", () => go(idx));
    dots.appendChild(d);
  });

  function go(n) {
    i = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${i * 100}%)`;
    Array.from(dots.children).forEach((d, idx) =>
      d.classList.toggle("on", idx === i),
    );
    slides.forEach((s, idx) => {
      const v = s.querySelector("video");
      if (!v) return;
      if (idx === i) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }

  function startAuto() {
    stopAuto();
    autoplayTimer = setInterval(() => go(i + 1), 8000);
  }

  function stopAuto() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  prev.addEventListener("click", () => {
    go(i - 1);
    startAuto();
  });

  next.addEventListener("click", () => {
    go(i + 1);
    startAuto();
  });

  // Свайп
  let sx = 0;
  root.addEventListener(
    "touchstart",
    (e) => {
      sx = e.touches[0].clientX;
    },
    { passive: true },
  );
  root.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) {
        go(i + (dx < 0 ? 1 : -1));
        startAuto();
      }
    },
    { passive: true },
  );

  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);

  go(0);
  startAuto();
}

// ===== BOOT =====
(async () => {
  applyLang(currentLang);

  // Слайдеры
  document.querySelectorAll("[data-slider]").forEach(setupSlider);

  // Auth0
  try {
    await initAuth();
  } catch (e) {
    console.error("Auth0 init failed", e);
  }

  // Кнопки логина
  const loginBtns = [
    "ld-login",
    "ld-signup",
    "ld-hero-cta",
    "ld-cta-bottom",
    "ld-price-free",
    "ld-price-pro",
  ];
  loginBtns.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", login);
  });

  // Смена языка
  document.getElementById("ld-lang").addEventListener("click", () => {
    applyLang(currentLang === "ru" ? "en" : "ru");
  });

  // Бургер
  const burger = document.getElementById("ld-burger");
  const nav = document.querySelector(".ld-nav");
  if (burger && nav) {
    burger.addEventListener("click", () => nav.classList.toggle("open"));
    nav
      .querySelectorAll("a")
      .forEach((a) =>
        a.addEventListener("click", () => nav.classList.remove("open")),
      );
  }
})();
