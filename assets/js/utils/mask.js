/**
 * @file mask.js
 * @summary Máscara de telefone: apenas números e formatação automática.
 *          Formato final (11 dígitos completos): (31) 9 1234-1234.
 *          Versões intermediárias durante a digitação são exibidas de forma
 *          progressiva até o número estar completamente preenchido.
 */

/**
 * Extrai apenas os dígitos de uma string.
 * @param {string} value Texto de entrada.
 * @returns {string} Apenas dígitos.
 */
export function onlyDigits(value) {
  return (value || "").replace(/\D+/g, "");
}

/**
 * Formata uma string de dígitos no padrão de telefone brasileiro.
 * Limite de 11 dígitos. Quando o número está completo (11 dígitos) o formato
 * exibido é `(DDD) 9 XXXX-XXXX` — ex.: `(31) 9 1234-1234`.
 * Para números fixos de 10 dígitos o formato é `(DDD) XXXX-XXXX`.
 * @param {string} value Texto bruto digitado.
 * @returns {string} Texto formatado (ou vazio).
 */
export function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  const len = digits.length;
  if (len === 0) return "";
  if (len <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  // 3..6 dígitos: (DDD) + início do número (com o prefixo "9" à frente)
  if (len <= 6) return `(${ddd}) ${rest}`;

  // 7..10 dígitos (fixo 8 dígitos): (DDD) XXXX-XXXX com hífen
  if (len <= 10) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;

  // 11 dígitos (celular com o 9º): (DDD) 9 XXXX-XXXX — formato completo
  return `(${ddd}) ${rest.slice(0, 1)} ${rest.slice(1, 5)}-${rest.slice(5)}`;
}

/**
 * Formata um número de telefone completo (10 ou 11 dígitos) para exibição,
 * usado server-side na montagem do e-mail. Não valida; apenas formata quando
 * há 10 ou 11 dígitos. Caso contrário, devolve os dígitos informados.
 * @param {string} digits Apenas dígitos já sanitizados.
 * @returns {string} Telefone formatado.
 */
export function formatPhoneForDisplay(digits) {
  const d = (digits || "").replace(/\D+/g, "").slice(0, 11);
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return d;
}

/**
 * Valida se o telefone (após remover máscara) tem entre 10 e 11 dígitos.
 * @param {string} value Texto com máscara.
 * @returns {{ valid: boolean, message: string }} Resultado da validação.
 */
export function validatePhone(value) {
  const digits = onlyDigits(value);
  if (digits.length === 0) {
    return { valid: false, message: "Telefone é obrigatório." };
  }
  if (digits.length < 10 || digits.length > 11) {
    return {
      valid: false,
      message: "Telefone inválido. Use o formato (31) 9 1234-1234.",
    };
  }
  return { valid: true, message: "" };
}
