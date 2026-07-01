/**
 * @file main.js
 * @summary Bootstrap ESM: inicializa todos os módulos da página. (Sprint 1)
 */

import { initTheme } from "./theme.js";
import { initHero } from "./hero.js";
import { initProjects } from "./projects.js";
import { initForm } from "./form.js";
import { initScrollReveal } from "./scroll-reveal.js";
import { initCursor } from "./cursor.js";

updateFooterYear();

initTheme();
initForm();

// Postergamos módulos visuais para `load` para evitar leitura forçada de
// layout antes de todos os estilos/assets estarem carregados.
if (document.readyState === "complete") {
  initVisualModules();
} else {
  window.addEventListener("load", initVisualModules, { once: true });
}

function initVisualModules() {
  initHero();
  initProjects();
  initScrollReveal();
  initCursor();
}

/**
 * Define o ano corrente no rodapé (footer).
 */
function updateFooterYear() {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = String(new Date().getFullYear());
}
