/**
 * @file api/contact.js
 * @summary Vercel Serverless Function (Node.js runtime) para envio de e-mail via RESEND.
 *          Segue o padrão do projeto de referência: module.exports + IncomingMessage/ServerResponse.
 *          Usa onboarding@resend.dev como FROM (sender padrão do Resend, sem verificação de domínio).
 */

const fs = require("node:fs");
const path = require("node:path");
const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_FROM = "Engendrar <onboarding@resend.dev>";
const EMAIL_CSS_PATH = path.join(process.cwd(), "assets", "css", "email.css");

/**
 * Lê o conteúdo de assets/css/email.css para injeção como <style> no e-mail.
 * Mantém a fonte dos estilos num único arquivo CSS do projeto, evitando CSS
 * inline em JS/HTML. Retorna string vazia se o arquivo não estiver acessível
 * (ex.: ambiente sem deploy dos assets estáticos).
 * @returns {string} Conteúdo do CSS ou string vazia.
 */
function readEmailCss() {
  try {
    return fs.readFileSync(EMAIL_CSS_PATH, "utf8");
  } catch (err) {
    console.warn("[contact] email.css não acessível:", err.code || err.message);
    return "";
  }
}

const EMAIL_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const MAX_EMAIL_LENGTH = 500;
const MESSAGE_MAX = 500;
const PHONE_MIN = 10;
const PHONE_MAX = 11;

/**
 * Formata um telefone de 10 ou 11 dígitos para exibição no e-mail,
 * reproduzindo a máscara exibida no front (máscara final 11 dígitos):
 * 11 dígitos -> (31) 9 1234-1234 | 10 dígitos -> (31) 1234-1234.
 * Originalmente definida em `assets/js/utils/mask.js` (formatPhoneForDisplay);
 * replicada aqui porque o endpoint é CommonJS e a máscara do front é ESM.
 * @param {string} digits Apenas dígitos.
 * @returns {string} Telefone formatado.
 */
function formatPhoneForDisplay(digits) {
  const d = String(digits || "")
    .replace(/\D+/g, "")
    .slice(0, 11);
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return d;
}

const DISPOSABLE_DOMAINS = new Set([
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
  "example.com",
  "test.com",
  "domain.com",
  "seuemail.com",
]);

/**
 * Envia uma resposta JSON padronizada.
 * @param {import('http').ServerResponse} res O objeto de resposta HTTP.
 * @param {number} statusCode Código HTTP.
 * @param {object} body Corpo da resposta.
 * @returns {void}
 */
function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

/**
 * Escapa conteúdo informado pelo usuário antes de montar o HTML do e-mail.
 * @param {*} value Valor a escapar.
 * @returns {string} Valor escapado.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(
      /[<>&"']/g,
      (char) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    )
    .trim();
}

/**
 * Verifica se o domínio do e-mail é descartável/inválido.
 * @param {string} email E-mail validado.
 * @returns {boolean} true se descartável.
 */
function isDisposableEmail(email) {
  const at = email.lastIndexOf("@");
  if (at < 0) return true;
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain.includes(".")) return true;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  const local = email.slice(0, at).toLowerCase();
  if (domain === `${local}.com`) return true;
  return false;
}

/**
 * Lê o corpo da requisição, suportando tanto objetos prontos quanto streams brutas.
 * @param {import('http').IncomingMessage} req Requisição HTTP.
 * @returns {Promise<object>} Corpo como objeto.
 */
async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(
    chunks.map((chunk) =>
      Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
    ),
  ).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

/**
 * Constrói o HTML do e-mail com os dados do contato.
 * Não contém nenhum atributo style= inline — toda a estilização vem das
 * classes definidas em assets/css/email.css, injetadas aqui via <style>.
 * O telefone já vem formatado (ex.: (31) 9 1234-1234).
 * @param {object} data Dados formatados (telefone já em formato de exibição).
 * @returns {string} HTML do e-mail.
 */
function buildEmailHtml({ company, email, phone, message, sentAt }) {
  const css = readEmailCss();
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Novo contato — Engendrar</title>
    <style>${css}</style>
  </head>
  <body class="engendrar-email">
    <div class="engendrar-email">
      <h1 class="engendrar-email__title">Novo contato — Engendrar</h1>
      <table class="engendrar-email__table">
        <tr>
          <td class="engendrar-email__cell engendrar-email__cell--label">Empresa / Pessoa</td>
          <td class="engendrar-email__cell">${company}</td>
        </tr>
        <tr>
          <td class="engendrar-email__cell engendrar-email__cell--label">E-mail</td>
          <td class="engendrar-email__cell">${email}</td>
        </tr>
        <tr>
          <td class="engendrar-email__cell engendrar-email__cell--label">Telefone</td>
          <td class="engendrar-email__cell">${phone}</td>
        </tr>
        <tr>
          <td class="engendrar-email__cell engendrar-email__cell--label">Data/Hora</td>
          <td class="engendrar-email__cell">${sentAt}</td>
        </tr>
      </table>
      <h2 class="engendrar-email__section-title">Mensagem</h2>
      <div class="engendrar-email__message">${message}</div>
    </div>
  </body>
</html>`;
}

/**
 * Constrói a versão texto plano do e-mail. O telefone já vem formatado.
 * @param {object} data Dados formatados (telefone em formato de exibição).
 * @returns {string} Texto do e-mail.
 */
function buildEmailText({ company, email, phone, message, sentAt }) {
  return [
    "",
    `Empresa / Pessoa: ${company}`,
    `E-mail: ${email}`,
    `Telefone: ${phone}`,
    `Data/Hora: ${sentAt}`,
    "",
    "Mensagem:",
    message,
  ].join("\n");
}

/**
 * Handler principal: valida entrada e envia por RESEND server-side.
 * @param {import('http').IncomingMessage} req Requisição HTTP.
 * @param {import('http').ServerResponse} res Resposta HTTP.
 * @returns {Promise<void>}
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Método não permitido." });
  }

  try {
    const body = await readBody(req);

    if (body.website) return json(res, 200, { ok: true });

    const company = escapeHtml(body.company);
    const phone = String(body.phone || "").replace(/\D+/g, "");
    const emailRaw = String(body.email || "")
      .trim()
      .toLowerCase();
    const message = escapeHtml(body.message);

    if (!company || company.length < 2 || company.length > 120) {
      return json(res, 400, { error: "Informe uma empresa ou nome válido." });
    }
    if (phone.length < PHONE_MIN || phone.length > PHONE_MAX) {
      return json(res, 400, {
        error: "Telefone inválido. Use o formato (31) 9 1234-1234.",
      });
    }
    if (
      !emailRaw ||
      emailRaw.length > MAX_EMAIL_LENGTH ||
      !EMAIL_RE.test(emailRaw)
    ) {
      return json(res, 400, { error: "E-mail inválido." });
    }
    if (isDisposableEmail(emailRaw)) {
      return json(res, 400, {
        error: "Por favor, use um provedor de e-mail válido.",
      });
    }
    if (!message || message.length < 5 || message.length > MESSAGE_MAX) {
      return json(res, 400, {
        error: `Mensagem inválida (máximo ${MESSAGE_MAX} caracteres).`,
      });
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const to = process.env.EMAIL?.trim();

    if (!apiKey) {
      return json(res, 500, {
        error: "RESEND_API_KEY não configurada no servidor.",
      });
    }
    if (!to) {
      return json(res, 500, {
        error: "EMAIL não configurado no servidor.",
      });
    }

    const sentAt = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date());

    const phoneDisplay = formatPhoneForDisplay(phone);

    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: to,
        reply_to: emailRaw,
        subject: `Novo contato — ${company}`,
        text: buildEmailText({
          company,
          email: emailRaw,
          phone: phoneDisplay,
          message,
          sentAt,
        }),
        html: buildEmailHtml({
          company,
          email: escapeHtml(emailRaw),
          phone: phoneDisplay,
          message,
          sentAt,
        }),
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text().catch(() => "");
      console.error("[contact] RESEND erro:", resendResponse.status, errText);
      if (resendResponse.status === 401 || resendResponse.status === 403) {
        return json(res, 500, {
          error: "RESEND_API_KEY inválida ou sem permissão.",
        });
      }
      return json(res, 502, {
        error: "Não foi possível enviar a mensagem agora.",
      });
    }

    return json(res, 200, {
      ok: true,
      message: "Mensagem enviada com sucesso! Em breve responderemos.",
    });
  } catch (error) {
    console.error("[contact] erro inesperado:", error);
    return json(res, 500, { error: "Erro interno ao enviar mensagem." });
  }
};
