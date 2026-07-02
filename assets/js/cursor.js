/**
 * @file cursor.js
 * @summary Cursor customizado com engrenagem giratória (tema mecânico).
 *          Ativo apenas em dispositivos com mouse fino (pointer: fine) e
 *          que não prefiram reduced-motion total. O cursor nativo é ocultado
 *          no body (com restauração em campos de formulário) para evitar
 *          duplicação visual.
 */

const HOVER_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  ".project-card",
  ".project-modal-close",
  ".project-modal-tab",
  ".theme-toggle",
  "[role='button']",
].join(",");

/**
 * Cria o elemento do cursor e o anexa ao body.
 * @returns {HTMLElement} Elemento do cursor customizado.
 */
function createCursorEl() {
  const el = document.createElement("div");
  el.className = "mech-cursor";
  el.setAttribute("aria-hidden", "true");
  // Engrenagem simplificada: 10 dentes desenhados como caminho.
  el.innerHTML = `
    <svg class="mech-cursor__gear" viewBox="0 0 100 100">
      <g class="mech-cursor__body">
        <circle cx="50" cy="50" r="38" />
        <circle cx="50" cy="50" r="14" />
        <rect x="48" y="2" width="4" height="10" rx="1" />
        <rect x="48" y="88" width="4" height="10" rx="1" />
        <rect x="2" y="48" width="10" height="4" rx="1" />
        <rect x="88" y="48" width="10" height="4" rx="1" />
        <rect x="14" y="14" width="10" height="4" rx="1" transform="rotate(45 19 16)" />
        <rect x="76" y="14" width="10" height="4" rx="1" transform="rotate(-45 81 16)" />
        <rect x="14" y="82" width="10" height="4" rx="1" transform="rotate(-45 19 84)" />
        <rect x="76" y="82" width="10" height="4" rx="1" transform="rotate(45 81 84)" />
      </g>
      <circle class="mech-cursor__hub" cx="50" cy="50" r="3" />
    </svg>`;
  document.body.appendChild(el);
  return el;
}

/**
 * Inicializa o cursor customizado.
 */
export function initCursor() {
  const supportsFinePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  if (!supportsFinePointer) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let cursorEl = document.querySelector(".mech-cursor");
  if (!cursorEl) cursorEl = createCursorEl();
  const gear = cursorEl.querySelector(".mech-cursor__gear");

  // Estado interno
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let rotation = 0;
  let lastMouseX = targetX;
  let isActive = false;
  let rafId = 0;
  let inactivityTimer = 0;
  const INACTIVITY_DELAY = 100; // ms

  /**
   * Posiciona o cursor ouvindo mousemove (passivo).
   * @param {MouseEvent} e Evento de mouse.
   */
  function onMouseMove(e) {
    targetX = e.clientX;
    targetY = e.clientY;
    if (!isActive) {
      isActive = true;
      cursorEl.classList.add("is-active");
    }
    inactivityTimer = 0;
    if (rafId === 0) tick();
  }

  /**
   * Detecta hover sobre interativos para destacar o cursor.
   * @param {MouseEvent} e Evento de mouse.
   */
  function onMouseOver(e) {
    if (e.target instanceof Element && e.target.closest(HOVER_SELECTOR)) {
      cursorEl.classList.add("is-hover");
    } else {
      cursorEl.classList.remove("is-hover");
    }
  }

  /**
   * Sai da janela: oculta o cursor.
   */
  function onMouseOut() {
    isActive = false;
    cursorEl.classList.remove("is-active");
  }

  /**
   * Loop de animação: interpola posição e atualiza rotação da engrenagem.
   * Em reduced-motion, posiciona direto sem spin.
   * Pausa quando o mouse está inativo por INACTIVITY_DELAY ms.
   */
  function tick() {
    rafId = requestAnimationFrame(tick);

    if (reduceMotion) {
      currentX = targetX;
      currentY = targetY;
    } else {
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
        inactivityTimer += 16;
        if (inactivityTimer > INACTIVITY_DELAY) {
          cancelAnimationFrame(rafId);
          rafId = 0;
          return;
        }
      } else {
        inactivityTimer = 0;
      }
      currentX += dx * 0.2;
      currentY += dy * 0.2;
      const dMouse = targetX - lastMouseX;
      rotation += dMouse * 0.6;
      lastMouseX = targetX;
    }

    const transform =
      `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)` +
      ` rotate(${rotation.toFixed(2)}deg)`;
    cursorEl.style.transform = transform;
    if (gear) gear.style.transform = `rotate(${rotation.toFixed(2)}deg)`;
  }

  document.body.classList.add("mech-cursor-active");

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("mouseover", onMouseOver, { passive: true });
  document.addEventListener("mouseleave", onMouseOut);
  window.addEventListener("blur", onMouseOut);

  tick();
}
