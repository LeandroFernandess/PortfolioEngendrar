# Engendrar — Portfolio / Portfólio

## PT-BR

Portfólio institucional da **Engendrar**, focado em soluções mecânicas, modelagem CAD e apresentação de projetos industriais.

### Stack

- HTML + CSS + **JavaScript Vanilla** (sem build step)
- **Three.js** (ESM via import map) para o hero 3D procedural
- **GSAP** (CDN/ESM) para entrada do hero e animações de reveal
- **Vercel Serverless Function** em `api/contact.js` para envio de e-mail via **Resend**
- Deploy: **Vercel**

### Conceitos e recursos atuais

- **Hero 3D procedural**:
  - construído apenas com geometrias nativas do Three.js
  - sem `.glb`, `.obj`, `.fbx` ou modelos externos no hero principal
  - emblema com engrenagem, letra `E` e capacete de segurança
- **Tema light/dark reativo**:
  - o hero 3D, luzes, grid, fundo, partículas e cursor respondem à troca de tema
  - atualização sem reload usando `MutationObserver` em `<html data-theme>`
- **Cursor dinâmico mecânico**:
  - cursor em forma de engrenagem
  - aparência adaptada por tema com variáveis CSS:
    - `--cursor-color`
    - `--cursor-border`
    - `--cursor-shadow`
    - `--cursor-hub-color`
- **Projetos estruturados**:
  - cards com resumo curto (`summary`)
  - modal com seções separadas:
    - `Dado técnico` (`technical`)
    - `O que resolve` (`solves`)
  - suporte a imagens e modelos 3D por projeto
- **E-mail com estilo centralizado em CSS**:
  - template usa `assets/css/email.css`
  - CSS é lido server-side e injetado no HTML enviado pelo endpoint

### Estrutura

```text
.
├── index.html
├── README.md
├── .gitignore
├── api/
│   └── contact.js
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── cursor.css
│   │   ├── email.css
│   │   ├── hero.css
│   │   ├── layout.css
│   │   └── theme.css
│   ├── data/
│   │   └── projects.json
│   ├── imgs/
│   │   ├── glb/
│   │   ├── logo/
│   │   └── projects/
│   └── js/
│       ├── cursor.js
│       ├── form.js
│       ├── hero.js
│       ├── main.js
│       ├── projects.js
│       ├── scroll-reveal.js
│       ├── theme.js
│       ├── viewer3d.js
│       └── utils/
```

### Como rodar localmente

```bash
python3 -m http.server 4317
# abrir http://localhost:4317
```

### Variáveis de ambiente

Na Vercel, configure:

- `RESEND_API_KEY` — chave da API Resend
- `EMAIL` — destinatário do formulário de contato

---

## EN

Institutional portfolio for **Engendrar**, focused on mechanical solutions, CAD modeling, and industrial project presentation.

### Stack

- HTML + CSS + **Vanilla JavaScript** (no build step)
- **Three.js** (ESM via import map) for the procedural 3D hero
- **GSAP** (CDN/ESM) for hero entrance and reveal animations
- **Vercel Serverless Function** in `api/contact.js` for **Resend** email delivery
- Deployment: **Vercel**

### Current concepts and features

- **Procedural 3D hero**:
  - built only with native Three.js geometries
  - no `.glb`, `.obj`, `.fbx`, or external models in the main hero
  - emblem composed of gear, letter `E`, and safety helmet
- **Reactive light/dark theming**:
  - the 3D hero, lights, grid, background, particles, and cursor react to theme changes
  - updates happen without reload using a `MutationObserver` on `<html data-theme>`
- **Mechanical custom cursor**:
  - gear-shaped cursor
  - theme-aware appearance through CSS variables:
    - `--cursor-color`
    - `--cursor-border`
    - `--cursor-shadow`
    - `--cursor-hub-color`
- **Structured project content**:
  - cards with short summaries (`summary`)
  - modal split into:
    - `Technical data` (`technical`)
    - `What it solves` (`solves`)
  - support for images and 3D models per project
- **Email styling sourced from CSS**:
  - template uses `assets/css/email.css`
  - CSS is read server-side and injected into the outgoing HTML

### Structure

```text
.
├── index.html
├── README.md
├── .gitignore
├── api/
│   └── contact.js
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── cursor.css
│   │   ├── email.css
│   │   ├── hero.css
│   │   ├── layout.css
│   │   └── theme.css
│   ├── data/
│   │   └── projects.json
│   ├── imgs/
│   │   ├── glb/
│   │   ├── logo/
│   │   └── projects/
│   └── js/
│       ├── cursor.js
│       ├── form.js
│       ├── hero.js
│       ├── main.js
│       ├── projects.js
│       ├── scroll-reveal.js
│       ├── theme.js
│       ├── viewer3d.js
│       └── utils/
```

### Local run

```bash
python3 -m http.server 4317
# open http://localhost:4317
```

### Environment variables

Configure the following in Vercel:

- `RESEND_API_KEY` — Resend API key
- `EMAIL` — contact form destination email