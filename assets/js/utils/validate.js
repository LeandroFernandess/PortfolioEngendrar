/**
 * @file validate.js
 * @summary Validações do formulário de contato: e-mail (D3), textarea e campos.
 */

import { isDisposableEmail } from "./disposable-domains.js";

// Regex de formato de e-mail (RFC-ish, suficiente para validação client-side).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Valida se um e-mail é aceitável: formato + domínio + não descartável (D3).
 * @param {string} email E-mail a validar.
 * @returns {{ valid: boolean, message: string }} Resultado da validação.
 */
export function validateEmail(email) {
  const value = (email || "").trim();
  if (!value) return { valid: false, message: "E-mail é obrigatório." };
  if (!EMAIL_RE.test(value)) {
    return { valid: false, message: "Formato de e-mail inválido." };
  }
  if (isDisposableEmail(value)) {
    return {
      valid: false,
      message: "Por favor, use um provedor de e-mail válido.",
    };
  }
  return { valid: true, message: "" };
}

/**
 * Valida se um campo de texto obrigatório está preenchido e dentro do limite.
 * @param {string} value Valor do campo.
 * @param {number} max Tamanho máximo permitido.
 * @param {string} label Rótulo amigável do campo.
 * @returns {{ valid: boolean, message: string }} Resultado da validação.
 */
export function validateRequired(value, max, label) {
  const v = (value || "").trim();
  if (!v) return { valid: false, message: `${label} é obrigatório.` };
  if (v.length > max)
    return {
      valid: false,
      message: `${label} excede o limite de ${max} caracteres.`,
    };
  return { valid: true, message: "" };
}

/**
 * Atualiza o contador de um textarea.
 * @param {HTMLTextAreaElement} textarea Elemento textarea.
 * @param {HTMLElement} counter Elemento de contador.
 * @param {number} max Tamanho máximo.
 */
export function updateCounter(textarea, counter, max) {
  const len = textarea.value.length;
  counter.textContent = `${len} / ${max}`;
  counter.style.color = len > max ? "var(--danger)" : "var(--muted)";
}
