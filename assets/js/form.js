/**
 * @file form.js
 * @summary Montagem e envio do formulário de contato.
 *          Máscara de telefone, validações client-side e envio para /api/contact.
 */

import { qs } from "./utils/dom.js";
import { maskPhone, onlyDigits, validatePhone } from "./utils/mask.js";
import {
  validateEmail,
  validateRequired,
  updateCounter,
} from "./utils/validate.js";

const MESSAGE_MAX = 500;

/**
 * Exibe ou limpa a mensagem de erro de um campo.
 * @param {HTMLElement} input Campo validado.
 * @param {HTMLElement} errorEl Elemento de erro.
 * @param {{ valid: boolean, message: string }} result Resultado da validação.
 */
function applyFieldError(input, errorEl, result) {
  errorEl.textContent = result.message || "";
  input.setAttribute("aria-invalid", String(!result.valid));
}

/**
 * Valida todos os campos do formulário de uma vez.
 * @param {Record<string, HTMLInputElement|HTMLTextAreaElement>} fields Campos.
 * @param {Record<string, HTMLElement>} errors Elementos de erro.
 * @returns {boolean} true se todos forem válidos.
 */
function validateAll(fields, errors) {
  const r1 = validateRequired(
    fields.company.value,
    120,
    "Empresa / Pessoa física",
  );
  applyFieldError(fields.company, errors.company, r1);

  const r2 = validatePhone(fields.phone.value);
  applyFieldError(fields.phone, errors.phone, r2);

  const r3 = validateEmail(fields.email.value);
  applyFieldError(fields.email, errors.email, r3);

  const r4 = validateRequired(fields.message.value, MESSAGE_MAX, "Mensagem");
  applyFieldError(fields.message, errors.message, r4);

  return r1.valid && r2.valid && r3.valid && r4.valid;
}

/**
 * Envia os dados do formulário ao endpoint serverless e exibe o feedback.
 * @param {Record<string, string>} payload Dados a enviar.
 * @param {HTMLButtonElement} submit Botão de submit.
 * @param {HTMLElement} status Status de retorno ao usuário.
 * @returns {Promise<void>}
 */
async function sendContact(payload, submit, status) {
  submit.disabled = true;
  status.textContent = "Enviando...";
  status.className = "form-status";

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      status.textContent =
        data.message || "Mensagem enviada com sucesso! Em breve responderemos.";
      status.classList.add("success");
    } else {
      status.textContent =
        data.message || "Não foi possível enviar. Tente novamente.";
      status.classList.add("error");
    }
  } catch (err) {
    status.textContent =
      "Erro de conexão. Verifique sua internet e tente novamente.";
    status.classList.add("error");
  } finally {
    submit.disabled = false;
  }
}

/**
 * Inicializa o formulário de contato: máscara, validação, contador e submit.
 */
export function initForm() {
  const form = /** @type {HTMLFormElement|null} */ (qs("#contact-form"));
  if (!form) return;

  const fields = {
    company: qs("#company", form),
    phone: qs("#phone", form),
    email: qs("#email", form),
    message: qs("#message", form),
  };
  const errors = {
    company: qs("#company-error", form),
    phone: qs("#phone-error", form),
    email: qs("#email-error", form),
    message: qs("#message-error", form),
  };
  const counter = qs("#message-counter", form);
  const submit = /** @type {HTMLButtonElement} */ (qs("#contact-submit", form));
  const status = qs("#contact-status", form);

  fields.phone.addEventListener("input", () => {
    fields.phone.value = maskPhone(fields.phone.value);
    const r = validatePhone(fields.phone.value);
    applyFieldError(fields.phone, errors.phone, r);
  });

  fields.email.addEventListener("blur", () =>
    applyFieldError(
      fields.email,
      errors.email,
      validateEmail(fields.email.value),
    ),
  );
  fields.company.addEventListener("blur", () =>
    applyFieldError(
      fields.company,
      errors.company,
      validateRequired(fields.company.value, 120, "Empresa / Pessoa física"),
    ),
  );
  fields.message.addEventListener("blur", () =>
    applyFieldError(
      fields.message,
      errors.message,
      validateRequired(fields.message.value, MESSAGE_MAX, "Mensagem"),
    ),
  );

  fields.message.addEventListener("input", () =>
    updateCounter(fields.message, counter, MESSAGE_MAX),
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateAll(fields, errors)) {
      status.textContent = "Por favor, corrija os campos destacados.";
      status.className = "form-status error";
      return;
    }
    sendContact(
      {
        company: fields.company.value.trim(),
        phone: onlyDigits(fields.phone.value),
        email: fields.email.value.trim(),
        message: fields.message.value.trim(),
      },
      submit,
      status,
    ).then(() => {
      if (!status.classList.contains("error")) {
        form.reset();
        updateCounter(fields.message, counter, MESSAGE_MAX);
      }
    });
  });
}
