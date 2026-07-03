# Engendrar — Portfolio / Portfólio

## PT-BR

Portfólio institucional da **Engendrar**, focado em soluções mecânicas, modelagem CAD e apresentação de projetos industriais.

### Stack

- HTML + CSS + **JavaScript Vanilla** (sem build step)
- **Three.js** (ESM via import map) para previews 3D dos projetos e base de conhecimento do hero legado
- **GSAP** (CDN/ESM) para animações de reveal
- **Vercel Serverless Function** em `api/contact.js` para envio de e-mail via **Resend**
- Deploy: **Vercel**

### Conceitos e recursos atuais

- **Homepage redesenhada com visual industrial premium**:
  - hero estático baseado em `assets/imgs/logo/TemplateBase.png`
  - header fixo com navegação por âncoras compensada para o offset do topo
  - linguagem visual alinhada a `docs/TEMPLATE_REFERENCIA_GUIDE.md`
- **Hero 3D legado preservado no projeto**:
  - `assets/js/hero.js` permanece como base de conhecimento
  - não é mais carregado na homepage atual
- **Cursor dinâmico mecânico**:
  - cursor em forma de engrenagem
  - aparência adaptada por variáveis CSS:
    - `--cursor-color`
    - `--cursor-border`
    - `--cursor-shadow`
    - `--cursor-hub-color`
- **Projetos com preview 3D comprimido na grade**:
  - cards carregam modelos `.glb` com lazy loading por viewport
  - fila com concorrência limitada para evitar carga simultânea de todos os viewers
  - loading animado enquanto o preview 3D é inicializado
- **Modal técnico dos projetos**:
  - cards com resumo curto (`summary`)
  - modal com seções separadas:
    - `Dado técnico` (`technical`)
    - `O que resolve` (`solves`)
  - quando o projeto possui GLB, o modal abre por padrão em `Modelo 3D`
  - suporte a imagens e modelos 3D por projeto
- **Modelos GLB comprimidos com Draco**:
  - total reduzido de `179.93 MB` para `47.64 MB`
  - `viewer3d.js` usa `DRACOLoader`
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
│       ├── hero.js          # legado / base de conhecimento, não carregado na home
│       ├── main.js
│       ├── projects.js
│       ├── scroll-reveal.js
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
- **Three.js** (ESM via import map) for project 3D previews and legacy hero knowledge
- **GSAP** (CDN/ESM) for reveal animations
- **Vercel Serverless Function** in `api/contact.js` for **Resend** email delivery
- Deployment: **Vercel**

### Current concepts and features

- **Premium industrial homepage redesign**:
  - static hero based on `assets/imgs/logo/TemplateBase.png`
  - fixed header with anchor navigation offset compensation
  - visual language aligned with `docs/TEMPLATE_REFERENCIA_GUIDE.md`
- **Legacy procedural 3D hero preserved in the project**:
  - `assets/js/hero.js` remains as knowledge/base code
  - it is no longer loaded on the current homepage
- **Mechanical custom cursor**:
  - gear-shaped cursor
  - appearance controlled through CSS variables:
    - `--cursor-color`
    - `--cursor-border`
    - `--cursor-shadow`
    - `--cursor-hub-color`
- **Structured project content with inline 3D previews**:
  - project cards render compressed `.glb` previews with viewport lazy loading
  - controlled concurrency queue avoids loading every viewer at once
  - animated loading state is shown before each preview is ready
- **Project modal**:
  - cards with short summaries (`summary`)
  - modal split into:
    - `Technical data` (`technical`)
    - `What it solves` (`solves`)
  - defaults to `Modelo 3D` when a GLB exists
  - support for images and 3D models per project
- **Draco-compressed GLB assets**:
  - total reduced from `179.93 MB` to `47.64 MB`
  - `viewer3d.js` uses `DRACOLoader`
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
│       ├── hero.js          # legacy knowledge, not loaded on the homepage
│       ├── main.js
│       ├── projects.js
│       ├── scroll-reveal.js
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
