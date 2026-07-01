/**
 * @file disposable-domains.js
 * @summary Lista curada de domínios de e-mail descartáveis/temporários (D3).
 *          Usada por validate.js para rejeitar e-mails como leandro@leandro.com.
 *          Mantida localmente e sem dependências externas.
 */

export const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempon.email",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "getnada.com",
  "trashmail.com",
  "fakeinbox.com",
  "sharklasers.com",
  "maildrop.cc",
  "dispostable.com",
  "mintemail.com",
  "mailcatch.com",
  "spambog.com",
  "tempinbox.com",
  "leandro.com",
  "example.com",
  "test.com",
  "domain.com",
  "seuemail.com",
]);

/**
 * Verifica se o domínio de um e-mail é descartável/inválido.
 * @param {string} email E-mail completo.
 * @returns {boolean} true se o domínio está na lista descartável.
 */
export function isDisposableEmail(email) {
  const at = email.lastIndexOf("@");
  if (at < 0) return true;
  const domain = email
    .slice(at + 1)
    .toLowerCase()
    .trim();
  if (!domain.includes(".")) return true;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  const local = email.slice(0, at).toLowerCase().trim();
  if (domain === `${local}.com`) return true;
  return false;
}
