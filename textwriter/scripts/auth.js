// scripts/auth.js
// ===== МОДУЛЬ АВТОРИЗАЦИИ И ЛИЦЕНЗИРОВАНИЯ =====

import { createAuth0Client } from "https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js/+esm";

// === КОНФИГ (вставь свои значения) ===
const AUTH0_DOMAIN = "text-effects.us.auth0.com";
const AUTH0_CLIENT_ID = "qwqzz0iRInWTckmX4MaHKzPI5ZN9u8gZ";
const AUTH0_AUDIENCE = "https://text-effects-pro-api";

// === СОСТОЯНИЕ ===
let auth0 = null;
let user = null;
let session = null;
let deviceFingerprint = null;

// === ОПРЕДЕЛЯЕМ РЕЖИМ ===
const isOBSMode = location.hash.includes("mode=");
const isConfig =
  location.hash === "#config" || location.search.includes("config");
const isEditorPage =
  location.pathname === "/" || location.pathname === "/index.html";
const isLandingPage = location.pathname.includes("landing");
const isAdminPage = location.pathname.includes("admin");

// === FINGERPRINT УСТРОЙСТВА ===
async function computeFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    String(new Date().getTimezoneOffset()),
    String(navigator.hardwareConcurrency || 0),
    String(navigator.deviceMemory || 0),
  ];

  // WebGL renderer — очень стабильный сигнал
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbg) parts.push(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
  } catch {}

  // Canvas fingerprint
  try {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 50;
    const ctx = c.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = "#069";
    ctx.fillText("TextEffectsPro", 2, 15);
    parts.push(c.toDataURL().slice(-64));
  } catch {}

  const raw = parts.join("||");
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// === СОХРАНЯЕМ INSTALL ID (доп. сигнал) ===
function getInstallId() {
  let id = localStorage.getItem("tep_install_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("tep_install_id", id);
  }
  return id;
}

// === ПОЛУЧАЕМ DEVICE ID = fingerprint + installId ===
async function getDeviceId() {
  if (!deviceFingerprint) {
    const fp = await computeFingerprint();
    const raw = fp + "||" + getInstallId();
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(raw),
    );
    deviceFingerprint = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return deviceFingerprint;
}

// === ИНИЦИАЛИЗАЦИЯ AUTH0 ===
async function initAuth0() {
  auth0 = await createAuth0Client({
    domain: AUTH0_DOMAIN,
    clientId: AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: window.location.origin + "/index.html", // ← ВОТ ТАК
      audience: AUTH0_AUDIENCE,
    },
    cacheLocation: "localstorage",
    useRefreshTokens: true,
  });

  // ❌ НЕ вызываем handleRedirectCallback вручную
  // createAuth0Client уже обрабатывает ?code=... автоматически

  // Просто чистим URL от ?code=...&state=...
  if (window.location.search.includes("code=")) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (await auth0.isAuthenticated()) {
    user = await auth0.getUser();
  }
}

// === ПОЛУЧАЕМ ACCESS TOKEN ДЛЯ API ===
async function getToken() {
  if (!auth0 || !user) return null;
  try {
    return await auth0.getTokenSilently({
      authorizationParams: { audience: AUTH0_AUDIENCE },
    });
  } catch (e) {
    console.error("Failed to get token", e);
    return null;
  }
}

// === ВЫЗОВ API С ТОКЕНОМ ===
async function apiCall(path, options = {}) {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(path, { ...options, headers });
  return res.json();
}

// === ПРОВЕРКА СЕССИИ + ЛИЦЕНЗИИ ===
async function fetchSession() {
  const data = await apiCall("/api/session");
  if (data.ok) {
    session = data;
  }
  return data;
}

// === АКТИВАЦИЯ КЛЮЧА ===
async function activateLicense(key) {
  const deviceId = await getDeviceId();
  return apiCall("/api/license/activate", {
    method: "POST",
    body: JSON.stringify({ key, fingerprint: deviceId }),
  });
}

// === ЗАПУСК НА СТРАНИЦЕ РЕДАКТОРА ===
async function bootEditor() {
  console.log("[TEP Auth] bootEditor started");
  console.log("[TEP Auth] url:", location.href);
  console.log("[TEP Auth] isOBSMode:", isOBSMode);

  if (isOBSMode) {
    console.log("[TEP Auth] OBS mode — skip auth");
    window.__TEP_AUTH__ = { fullAccess: true, obsMode: true };
    loadEditor();
    return;
  }

  try {
    console.log("[TEP Auth] creating auth0 client...");
    await initAuth0();
    console.log("[TEP Auth] initAuth0 done, user =", user);
  } catch (e) {
    console.error("[TEP Auth] initAuth0 FAILED", e);
    showDebugError("initAuth0 failed: " + (e.message || e));
    return;
  }

  if (!user) {
    console.warn("[TEP Auth] no user — NOT redirecting, showing debug");
    showDebugError("Not authenticated. URL search: " + location.search);
    return;
  }

  console.log("[TEP Auth] user OK:", user.email || user.sub);

  let sess;
  try {
    console.log("[TEP Auth] fetching session...");
    sess = await fetchSession();
    console.log("[TEP Auth] session =", sess);
  } catch (e) {
    console.error("[TEP Auth] fetchSession FAILED", e);
    showDebugError("fetchSession failed: " + (e.message || e));
    return;
  }

  if (sess.ok && sess.fullAccess) {
    console.log("[TEP Auth] FULL ACCESS");
    window.__TEP_AUTH__ = sess;
    document.body.classList.add("tep-full-access");
    loadEditor();
  } else {
    console.log("[TEP Auth] LOCKED (no license)");
    document.body.classList.add("tep-locked");
    window.__TEP_AUTH__ = sess;
    loadEditor();
    showActivationOverlay();
  }
}

// === ОТЛАДОЧНЫЙ ЭКРАН ===
function showDebugError(msg) {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: #09090c; color: #f87171;
    font-family: monospace; font-size: 14px;
    padding: 40px; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; text-align: center;
  `;
  el.innerHTML = `
    <div style="font-size:24px;color:#fff">⚠ TEP Auth Debug</div>
    <div style="max-width:600px;line-height:1.6">${msg}</div>
    <div style="color:#8b5cf6;font-size:12px">URL: ${location.href}</div>
    <button onclick="location.href='/landing.html'" style="
      padding:10px 20px;background:#8b5cf6;color:#fff;border:none;
      border-radius:6px;cursor:pointer;font-size:14px;margin-top:20px;
    ">← На лендинг</button>
    <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="
      padding:10px 20px;background:transparent;color:#8b5cf6;
      border:1px solid #8b5cf6;border-radius:6px;cursor:pointer;font-size:14px;
    ">Очистить токены и перезагрузить</button>
  `;
  document.body.appendChild(el);
}

// Динамическая загрузка index.js
function loadEditor() {
  const s = document.createElement("script");
  s.type = "module";
  s.src = "scripts/index.js";
  s.onload = () => {
    window.dispatchEvent(
      new CustomEvent("tep:auth", { detail: window.__TEP_AUTH__ }),
    );
  };
  document.body.appendChild(s);
}

// === ОВЕРЛЕЙ ДЛЯ ВВОДА КЛЮЧА ===
function showActivationOverlay() {
  if (document.getElementById("tep-activation-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "tep-activation-overlay";
  overlay.innerHTML = `
    <div class="tep-ov-card">
      <div class="tep-ov-logo"><i class="fas fa-pen-nib"></i></div>
      <h2 data-i18n="activateTitle">Активация лицензии</h2>
      <p data-i18n="activateSub">Для использования редактора активируйте лицензионный ключ</p>
      <div class="tep-ov-user">
        <i class="fas fa-user"></i>
        <span>${user.email || user.name || "—"}</span>
      </div>
      <input type="text" id="tep-license-input" placeholder="TEP-XXXX-XXXX-XXXX" maxlength="20" />
      <button id="tep-activate-btn" class="tep-btn-primary" data-i18n="activateBtn">Активировать</button>
      <div id="tep-activate-error" class="tep-ov-error"></div>
      <button id="tep-logout-btn" class="tep-btn-ghost" data-i18n="logout">Выйти</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document
    .getElementById("tep-activate-btn")
    .addEventListener("click", async () => {
      const input = document.getElementById("tep-license-input");
      const errEl = document.getElementById("tep-activate-error");
      const btn = document.getElementById("tep-activate-btn");
      const key = input.value.trim().toUpperCase();

      if (!key) {
        errEl.textContent = "Введите ключ";
        return;
      }

      btn.disabled = true;
      btn.textContent = "Проверка...";
      errEl.textContent = "";

      const result = await activateLicense(key);

      if (result.ok) {
        document.body.classList.remove("tep-locked");
        document.body.classList.add("tep-full-access");
        overlay.remove();
        window.__TEP_AUTH__ = { ...session, fullAccess: true };
        window.dispatchEvent(
          new CustomEvent("tep:auth", { detail: window.__TEP_AUTH__ }),
        );
      } else {
        const errMap = {
          key_not_found: "Ключ не найден",
          key_blocked: "Ключ заблокирован",
          key_in_use_other_user: "Ключ уже привязан к другому аккаунту",
          device_mismatch: "Ключ уже активирован на другом устройстве",
          missing_fields: "Введите ключ",
        };
        errEl.textContent = errMap[result.error] || "Ошибка активации";
        btn.disabled = false;
        btn.textContent = LANG[currentLang]?.activateBtn || "Активировать";
      }
    });

  document.getElementById("tep-logout-btn").addEventListener("click", logout);
}

// === ЛОГИН / ЛОГАУТ ===
async function login() {
  await auth0.loginWithRedirect();
}

async function logout() {
  await auth0.logout({
    logoutParams: { returnTo: window.location.origin + "/landing.html" },
  });
}

// === ЭКСПОРТ ===
window.TEPAuth = {
  login,
  logout,
  getDeviceId,
  fetchSession,
  activateLicense,
  getState: () => ({ user, session, deviceFingerprint }),
};

// === АВТОЗАПУСК ===
if (isEditorPage && !isConfig) {
  bootEditor();
}
