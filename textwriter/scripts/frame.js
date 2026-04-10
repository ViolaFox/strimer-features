/* frame.js - Логика редактора Neon Frame */

let frameInputs = {};
let framePreview = null;
let frameCodeBlock = null;

// Инициализация редактора (вызывается при открытии вкладки)
export function initFrameEditor() {
  if (document.getElementById("editor-frame-preview")) return; // Уже инициализирован

  const previewStage = document.getElementById("pstage");
  if (!previewStage) return;

  // 1. Создаем и добавляем элемент превью в область предпросмотра
  framePreview = document.createElement("div");
  framePreview.id = "editor-frame-preview";
  // Применяем начальные стили
  updateFrameStyles();
  previewStage.appendChild(framePreview);

  // 2. Кэшируем элементы управления
  frameInputs = {
    color: document.getElementById("frame-color"),
    width: document.getElementById("frame-width"),
    height: document.getElementById("frame-height"),
    size: document.getElementById("frame-size"),
    radius: document.getElementById("frame-radius"),
    glow: document.getElementById("frame-glow"),
    flicker: document.getElementById("frame-flicker"),
  };

  frameCodeBlock = document.getElementById("frame-code-output");

  // 3. Навешиваем обработчики событий
  Object.values(frameInputs).forEach((input) => {
    if (input) {
      input.addEventListener("input", updateFrameStyles);
      if (input.type === "checkbox") {
        input.addEventListener("change", updateFrameStyles);
      }
    }
  });

  // Первое обновление
  updateFrameStyles();
}

// Удаление превью (при закрытии вкладки)
export function destroyFrameEditor() {
  const preview = document.getElementById("editor-frame-preview");
  if (preview) preview.remove();
}

// Основная функция обновления
function updateFrameStyles() {
  if (!framePreview) return;

  // Получаем значения
  const color = frameInputs.color ? frameInputs.color.value : "#ff00ff";
  const width = frameInputs.width ? frameInputs.width.value : 300;
  const height = frameInputs.height ? frameInputs.height.value : 200;
  const size = frameInputs.size ? frameInputs.size.value : 4;
  const radius = frameInputs.radius ? frameInputs.radius.value : 0;
  const glow = frameInputs.glow ? frameInputs.glow.value : 20;
  const isFlicker = frameInputs.flicker ? frameInputs.flicker.checked : false;

  // Обновляем текстовые метки значений
  const updateLabel = (id, val, unit = "") => {
    const el = document.getElementById(id);
    if (el) el.textContent = val + unit;
  };

  updateLabel("frame-color-val", color);
  updateLabel("frame-width-val", width, "px");
  updateLabel("frame-height-val", height, "px");
  updateLabel("frame-size-val", size, "px");
  updateLabel("frame-radius-val", radius, "px");
  updateLabel("frame-glow-val", glow, "px");

  // Применяем стили к превью
  framePreview.style.width = width + "px";
  framePreview.style.height = height + "px";
  framePreview.style.border = `${size}px solid ${color}`;
  framePreview.style.borderRadius = radius + "px";

  // Эффект свечения (Box Shadow)
  framePreview.style.boxShadow = `
    0 0 ${glow}px ${color},
    0 0 ${glow * 2}px ${color},
    inset 0 0 ${glow}px ${color}
  `;

  // Класс анимации
  if (isFlicker) {
    framePreview.classList.add("flicker-anim");
  } else {
    framePreview.classList.remove("flicker-anim");
  }

  // Генерация CSS кода
  if (frameCodeBlock) {
    let css = `.my-neon-frame {\n`;
    css += `  width: ${width}px;\n`;
    css += `  height: ${height}px;\n`;
    css += `  border: ${size}px solid ${color};\n`;
    css += `  border-radius: ${radius}px;\n`;
    css += `  box-shadow: \n    0 0 ${glow}px ${color},\n`;
    css += `    0 0 ${glow * 2}px ${color},\n`;
    css += `    inset 0 0 ${glow}px ${color};\n`;

    if (isFlicker) {
      css += `  animation: flicker 1.5s infinite alternate;\n}\n\n`;
      css += `@keyframes flicker {\n  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }\n  20%, 24%, 55% { opacity: 0.4; }\n}`;
    } else {
      css += `}`;
    }

    frameCodeBlock.textContent = css;
  }
}

// Функция для быстрой установки цвета из пресета (глобальная)
window.setFrameColor = function (color) {
  const input = document.getElementById("frame-color");
  if (input) {
    input.value = color;
    updateFrameStyles();
  }
};

// Функция копирования CSS (глобальная)
window.copyFrameCSS = function (btn) {
  const code = document.getElementById("frame-code-output").textContent;
  if (!code) return;

  navigator.clipboard.writeText(code).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    btn.classList.add("copied");
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove("copied");
    }, 2000);
  });
};
