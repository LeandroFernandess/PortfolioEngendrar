/**
 * @file theme.js
 * @summary Gerencia o tema light/dark com toggle persistente.
 *          O tema inicial já é aplicado por script inline no <head>.
 */

const STORAGE_KEY = "engendrar-theme";

/**
 * Lê o tema atual aplicado ao <html>.
 * @returns {'light'|'dark'} Tema atual.
 */
export function getCurrentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/**
 * Define o tema, atualizando o atributo no <html>, o storage e o estado do botão.
 * @param {'light'|'dark'} theme Tema a aplicar.
 */
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    /* Storage indisponível: mantém apenas em memória */
  }
  syncToggle(theme);
}

/**
 * Sincroniza o estado visual/ARIA do botão de toggle com o tema atual.
 * @param {'light'|'dark'} theme Tema atual.
 */
function syncToggle(theme) {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;
  toggle.setAttribute("aria-pressed", String(theme === "dark"));
  toggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro",
  );
}

/**
 * Alterna entre light e dark.
 */
export function toggleTheme() {
  setTheme(getCurrentTheme() === "dark" ? "light" : "dark");
}

/**
 * Inicializa o módulo de tema: sincroniza o botão e registra o listener.
 */
export function initTheme() {
  syncToggle(getCurrentTheme());
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", toggleTheme);
  }
}
