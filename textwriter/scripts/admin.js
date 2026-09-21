// scripts/admin.js
// ===== ЛОГИКА АДМИНКИ =====

import { createAuth0Client } from "https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js/+esm";

const AUTH0_DOMAIN = "text-effects.us.auth0.com";
const AUTH0_CLIENT_ID = "qwqzz0iRInWTckmX4MaHKzPI5ZN9u8gZ";
const AUTH0_AUDIENCE = "https://text-effects-pro-api";

// ===== ЯЗЫКИ =====
const LANG = {
  ru: {
    navDashboard: "Дашборд",
    navLicenses: "Лицензии",
    navUsers: "Пользователи",
    logout: "Выйти",
    createKey: "Создать ключ",
    statUsers: "Пользователей",
    statActive: "Активных лицензий",
    statUnused: "Свободных ключей",
    statBlocked: "Заблокировано",
    statToday: "Активны сегодня",
    recentActivity: "Последняя активность",
    noActivity: "Пока нет активности",
    allLicenses: "Все лицензии",
    searchPlaceholder: "Поиск по email или ключу...",
    colKey: "Ключ",
    colUser: "Пользователь",
    colDevice: "Устройство",
    colStatus: "Статус",
    colCreated: "Создан",
    colActions: "Действия",
    loading: "Загрузка…",
    allUsers: "Все пользователи",
    colEmail: "Email",
    colRole: "Роль",
    colLastLogin: "Последний вход",
    newKeyTitle: "Новый лицензионный ключ",
    newKeySub:
      "Ключ будет показан только один раз. Скопируйте и передайте пользователю.",
    copyKey: "Скопировать",
    close: "Закрыть",
  },
  en: {
    navDashboard: "Dashboard",
    navLicenses: "Licenses",
    navUsers: "Users",
    logout: "Logout",
    createKey: "Create Key",
    statUsers: "Users",
    statActive: "Active licenses",
    statUnused: "Unused keys",
    statBlocked: "Blocked",
    statToday: "Active today",
    recentActivity: "Recent activity",
    noActivity: "No activity yet",
    allLicenses: "All licenses",
    searchPlaceholder: "Search by email or key...",
    colKey: "Key",
    colUser: "User",
    colDevice: "Device",
    colStatus: "Status",
    colCreated: "Created",
    colActions: "Actions",
    loading: "Loading…",
    allUsers: "All users",
    colEmail: "Email",
    colRole: "Role",
    colLastLogin: "Last login",
    newKeyTitle: "New license key",
    newKeySub: "The key will be shown only once. Copy and send it to the user.",
    copyKey: "Copy",
    close: "Close",
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
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (LANG[lang][key]) el.placeholder = LANG[lang][key];
  });
  const btn = document.getElementById("ad-lang");
  if (btn) btn.textContent = lang.toUpperCase();
}

// ===== СОСТОЯНИЕ =====
let auth0 = null;
let user = null;
let licenses = [];
let usersList = [];

// ===== AUTH0 INIT (правильное имя — совпадает с boot) =====
async function initAuth0() {
  console.log("[Admin] initAuth0 creating client");

  auth0 = await createAuth0Client({
    domain: AUTH0_DOMAIN,
    clientId: AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: window.location.origin + "/admin.html",
      audience: AUTH0_AUDIENCE,
      scope: "openid profile email offline_access",
    },
    cacheLocation: "localstorage",
    useRefreshTokens: true,
  });

  console.log("[Admin] auth0 client created");

  // Обработка callback
  const params = new URLSearchParams(window.location.search);
  if (params.has("code") && params.has("state")) {
    console.log("[Admin] handling redirect callback");
    try {
      await auth0.handleRedirectCallback();
      window.history.replaceState({}, document.title, "/admin.html");
      console.log("[Admin] callback handled");
    } catch (e) {
      console.error("[Admin] handleRedirectCallback failed:", e);
    }
  }

  // Проверка авторизации
  const authed = await auth0.isAuthenticated();
  console.log("[Admin] isAuthenticated:", authed);

  if (!authed) {
    console.log("[Admin] not authenticated, redirecting to login");
    await auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin + "/admin.html",
        audience: AUTH0_AUDIENCE,
        scope: "openid profile email offline_access",
      },
    });
    return;
  }

  user = await auth0.getUser();
  console.log("[Admin] user:", user);

  // Обновляем email в сайдбаре
  const emailEl = document.getElementById("ad-user-email");
  if (emailEl) emailEl.textContent = user.email || user.name || "—";
}

// ===== TOKEN =====
async function getToken() {
  if (!auth0 || !user) return null;
  try {
    return await auth0.getTokenSilently({
      authorizationParams: { audience: AUTH0_AUDIENCE },
    });
  } catch (e) {
    console.error("[Admin] getTokenSilently failed:", e);
    return null;
  }
}

// ===== API CALL =====
async function api(path, options = {}) {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(path, { ...options, headers });
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("[Admin] API returned non-JSON:", text.slice(0, 200));
    return { ok: false, error: "non_json_response", status: res.status };
  }
}

// ===== TABS =====
function setupTabs() {
  document.querySelectorAll(".ad-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      document
        .querySelectorAll(".ad-nav-item")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document
        .querySelectorAll(".ad-tab")
        .forEach((t) => t.classList.remove("active"));
      document.getElementById(`ad-tab-${tab}`).classList.add("active");
      document.getElementById("ad-title").textContent =
        LANG[currentLang][
          tab === "dashboard"
            ? "navDashboard"
            : tab === "licenses"
              ? "navLicenses"
              : "navUsers"
        ];
    });
  });
}

// ===== STATS =====
async function loadStats() {
  try {
    const data = await api("/api/admin/stats");
    if (!data.ok) {
      console.error("Stats error", data.error);
      return;
    }
    const s = data.stats;
    document.getElementById("stat-users").textContent = s.users;
    document.getElementById("stat-active").textContent = s.activeLicenses;
    document.getElementById("stat-unused").textContent = s.unusedKeys;
    document.getElementById("stat-blocked").textContent = s.blockedKeys;
    document.getElementById("stat-today").textContent = s.activeToday;
  } catch (e) {
    console.error("loadStats", e);
  }
}

// ===== LICENSES =====
async function loadLicenses() {
  try {
    const data = await api("/api/admin/list-licenses");
    if (!data.ok) {
      console.error("Licenses error", data.error);
      return;
    }
    licenses = data.licenses || [];
    renderLicenses();
  } catch (e) {
    console.error("loadLicenses", e);
  }
}

function renderLicenses(filter = "") {
  const body = document.getElementById("ad-licenses-body");
  const q = filter.trim().toLowerCase();
  const filtered = q
    ? licenses.filter((l) => {
        const email = (l.users?.email || "").toLowerCase();
        const id = (l.id || "").toLowerCase();
        return email.includes(q) || id.includes(q);
      })
    : licenses;

  if (!filtered.length) {
    body.innerHTML = `<tr><td colspan="6" class="ad-empty">${LANG[currentLang].noActivity}</td></tr>`;
    return;
  }

  body.innerHTML = filtered
    .map((l) => {
      const email = l.users?.email || "—";
      const devId = l.devices?.fingerprint_hash
        ? l.devices.fingerprint_hash.slice(0, 10) + "…"
        : "—";
      const status = l.status || "unused";
      const created = l.created_at
        ? new Date(l.created_at).toLocaleDateString()
        : "—";
      const shortId = l.id ? l.id.slice(0, 8) : "—";
      return `
        <tr>
          <td class="ad-key-code">${shortId}…</td>
          <td>${escapeHtml(email)}</td>
          <td>${devId}</td>
          <td><span class="ad-status ${status}">${status}</span></td>
          <td>${created}</td>
          <td>
            ${
              status === "active"
                ? `<button class="ad-btn ad-btn-ghost" onclick="window.__adRevoke('${l.id}')" style="padding:4px 10px;font-size:11px">Revoke</button>`
                : ""
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

async function revokeLicense(id) {
  if (!confirm("Заблокировать лицензию?")) return;
  const data = await api("/api/admin/revoke-license", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  if (data.ok) {
    await loadLicenses();
    await loadStats();
  } else {
    alert("Ошибка: " + (data.error || "unknown"));
  }
}

window.__adRevoke = revokeLicense;

// ===== USERS =====
async function loadUsers() {
  try {
    const data = await api("/api/admin/list-users");
    if (!data.ok) {
      console.error("Users error", data.error);
      return;
    }
    usersList = data.users || [];
    renderUsers();
  } catch (e) {
    console.error("loadUsers", e);
  }
}

function renderUsers() {
  const body = document.getElementById("ad-users-body");
  if (!usersList.length) {
    body.innerHTML = `<tr><td colspan="5" class="ad-empty">${LANG[currentLang].loading}</td></tr>`;
    return;
  }
  body.innerHTML = usersList
    .map((u) => {
      const created = u.created_at
        ? new Date(u.created_at).toLocaleDateString()
        : "—";
      const lastLogin = u.last_login
        ? new Date(u.last_login).toLocaleString()
        : "—";
      return `
        <tr>
          <td>${escapeHtml(u.email || "—")}</td>
          <td>${u.role || "user"}</td>
          <td><span class="ad-status ${u.status === "banned" ? "blocked" : "active"}">${u.status || "active"}</span></td>
          <td>${created}</td>
          <td>${lastLogin}</td>
        </tr>
      `;
    })
    .join("");
}

// ===== ACTIVITY =====
async function loadActivity() {
  try {
    const data = await api("/api/admin/activity");
    if (!data.ok) return;
    const el = document.getElementById("ad-activity");
    const items = data.logs || [];
    if (!items.length) {
      el.innerHTML = `<div class="ad-empty">${LANG[currentLang].noActivity}</div>`;
      return;
    }
    const iconMap = {
      license_activated: "fa-key",
      admin_create_license: "fa-plus",
      login: "fa-right-to-bracket",
    };
    el.innerHTML = items
      .slice(0, 20)
      .map(
        (l) => `
        <div class="ad-activity-item">
          <div class="ad-activity-icon"><i class="fas ${iconMap[l.event] || "fa-circle"}"></i></div>
          <div class="ad-activity-text">${escapeHtml(l.event)}</div>
          <div class="ad-activity-time">${new Date(l.created_at).toLocaleString()}</div>
        </div>
      `,
      )
      .join("");
  } catch (e) {
    console.error("loadActivity", e);
  }
}

// ===== CREATE KEY =====
async function createKey() {
  const btn = document.getElementById("ad-create-key");
  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  try {
    const data = await api("/api/admin/create-license", {
      method: "POST",
      body: JSON.stringify({ note: "Created via admin panel" }),
    });

    if (!data.ok) {
      alert("Ошибка создания ключа: " + (data.error || "unknown"));
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      return;
    }

    document.getElementById("ad-key-display").textContent = data.key;
    document.getElementById("ad-modal-key").classList.add("open");
    await loadLicenses();
    await loadStats();
  } catch (e) {
    alert("Ошибка: " + e.message);
  }

  btn.disabled = false;
  btn.innerHTML = originalHtml;
}

// ===== UTILS =====
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== BOOT =====
(async () => {
  console.log("[Admin] boot started");
  console.log("[Admin] url:", location.href);

  try {
    applyLang(currentLang);
    console.log("[Admin] lang applied");

    setupTabs();
    console.log("[Admin] tabs setup");

    console.log("[Admin] initAuth0...");
    await initAuth0();
    console.log("[Admin] initAuth0 done, user =", user);

    if (!user) {
      console.warn("[Admin] no user — waiting for Auth0 redirect");
      return;
    }

    console.log("[Admin] loading data...");
    await Promise.all([
      loadStats(),
      loadLicenses(),
      loadUsers(),
      loadActivity(),
    ]);
    console.log("[Admin] data loaded");

    document
      .getElementById("ad-create-key")
      .addEventListener("click", createKey);
    document.getElementById("ad-lang").addEventListener("click", () => {
      applyLang(currentLang === "ru" ? "en" : "ru");
    });
    document.getElementById("ad-logout").addEventListener("click", () => {
      auth0.logout({
        logoutParams: { returnTo: window.location.origin + "/landing.html" },
      });
    });
    document.getElementById("ad-modal-close").addEventListener("click", () => {
      document.getElementById("ad-modal-key").classList.remove("open");
    });
    document.getElementById("ad-close-modal").addEventListener("click", () => {
      document.getElementById("ad-modal-key").classList.remove("open");
    });
    document.getElementById("ad-copy-key").addEventListener("click", () => {
      const key = document.getElementById("ad-key-display").textContent;
      navigator.clipboard.writeText(key).then(() => {
        const btn = document.getElementById("ad-copy-key");
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> OK';
        setTimeout(() => (btn.innerHTML = orig), 1500);
      });
    });
    document.getElementById("ad-search").addEventListener("input", (e) => {
      renderLicenses(e.target.value);
    });

    console.log("[Admin] boot complete");
  } catch (e) {
    console.error("[Admin] BOOT FAILED:", e);
    document.body.innerHTML += `
      <div style="position:fixed;inset:0;background:#09090c;color:#f87171;
        font-family:monospace;padding:40px;z-index:99999;overflow:auto">
        <h2 style="color:#fff">Admin boot failed</h2>
        <pre>${e.message}\n\n${e.stack || ""}</pre>
        <button onclick="localStorage.clear();location.reload()"
          style="margin-top:20px;padding:10px 20px;background:#8b5cf6;color:#fff;border:none;border-radius:6px;cursor:pointer">
          Очистить и перезагрузить
        </button>
      </div>
    `;
  }
})();
