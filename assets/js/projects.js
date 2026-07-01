/**
 * @file projects.js
 * @summary Renderiza os cards de projetos a partir de projects.json.
 *          Cards são clicáveis: abrem um modal com galeria completa e descrição integral.
 *          Projetos com .glb e imagens permitem alternar entre modelo 3D e fotos.
 */

import { qs, el } from "./utils/dom.js";
import { initViewer3D } from "./viewer3d.js";

const SHORT_LIMIT = 120;

/**
 * Trunca o texto para exibir uma breve descrição no card.
 * @param {string} text Texto completo.
 * @param {number} limit Limite de caracteres.
 * @returns {string} Texto truncado com reticências.
 */
function truncate(text, limit) {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim() + "…";
}

/**
 * Constrói a mídia do card: viewer 3D (.glb), imagem ou placeholder.
 * @param {Object} project Projeto a renderizar.
 * @returns {HTMLElement} Nodo do media do card.
 */
function buildCardMedia(project) {
  if (project.model) {
    const wrap = el("div", {
      class: "project-media project-media-3d",
      "aria-label": `Modelo 3D de ${project.title}`,
    });
    initViewer3D(wrap, project.model);
    return wrap;
  }
  if (!project.images || project.images.length === 0) {
    return el("div", { class: "project-media no-image" }, [
      el("div", { class: "project-no-image" }, ["Sem imagem"]),
    ]);
  }
  const main = el("img", {
    src: project.images[0],
    alt: `Imagem de ${project.title} 1`,
    loading: "lazy",
    decoding: "async",
  });
  return el("div", { class: "project-media" }, [main]);
}

/**
 * Constrói o card completo de um projeto (breve descrição + botão "Ver detalhes").
 * @param {Object} project Projeto a renderizar.
 * @returns {HTMLElement} Card pronto.
 */
function buildCard(project) {
  const summary = project.summary || truncate(project.description, SHORT_LIMIT);
  const body = el("div", { class: "project-body" }, [
    el("span", { class: "project-index" }, [
      `Projeto ${String(project.id).padStart(2, "0")}`,
    ]),
    el("h3", { class: "project-title" }, [project.title]),
    el("p", { class: "project-desc" }, [summary]),
    el("button", { class: "project-card-cta", type: "button" }, [
      "Ver detalhes →",
    ]),
  ]);
  const card = el(
    "article",
    {
      class: "project-card",
      tabindex: "0",
      role: "button",
      "aria-label": `Abrir detalhes do projeto ${project.title}`,
    },
    [buildCardMedia(project), body],
  );
  card.addEventListener("click", () => openModal(project));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(project);
    }
  });
  return card;
}

// ─── Modal ────────────────────────────────────────────────

let modalEl = null;
let modalContent = null;

/**
 * Garante que o elemento do modal exista no DOM (criado uma única vez).
 * @returns {void}
 */
function ensureModal() {
  if (modalEl) return;
  modalEl = el("div", {
    class: "project-modal-overlay",
    id: "project-modal",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "modal-title",
  });
  modalContent = el("div", { class: "project-modal" });
  modalEl.append(modalContent);
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) closeModal();
  });
  document.body.append(modalEl);
}

/**
 * Abre o modal com os detalhes completos de um projeto.
 * Se o projeto tem .glb E imagens, exibe botões para alternar entre 3D e fotos.
 * @param {Object} project Projeto a exibir.
 * @returns {void}
 */
function openModal(project) {
  ensureModal();
  modalContent.innerHTML = "";

  const closeBtn = el(
    "button",
    {
      class: "project-modal-close",
      type: "button",
      "aria-label": "Fechar",
    },
    ["✕"],
  );
  closeBtn.addEventListener("click", closeModal);

  const title = el("h2", { class: "project-modal-title", id: "modal-title" }, [
    `Projeto ${String(project.id).padStart(2, "0")} — ${project.title}`,
  ]);

  const mediaWrap = el("div", { class: "project-modal-media" });
  const galleryWrap = el("div", { class: "project-modal-gallery" });
  const hasModel = !!project.model;
  const hasImages = project.images && project.images.length > 0;
  const tabbar = el("div", { class: "project-modal-tabbar" });
  let currentMainImg = null;

  /**
   * Ativa o modo 3D no modal.
   */
  function show3D() {
    mediaWrap.innerHTML = "";
    galleryWrap.innerHTML = "";
    const viewerWrap = el("div", {
      class: "project-media project-media-3d project-media-3d-lg",
      "aria-label": `Modelo 3D de ${project.title}`,
    });
    mediaWrap.append(viewerWrap);
    initViewer3D(viewerWrap, project.model);
    tabbar
      .querySelectorAll("button")
      .forEach((b) => b.classList.remove("active"));
    tab3d?.classList.add("active");
  }

  /**
   * Ativa o modo de imagens (fotos) no modal.
   */
  function showImages() {
    mediaWrap.innerHTML = "";
    galleryWrap.innerHTML = "";
    if (!hasImages) return;

    currentMainImg = el("img", {
      src: project.images[0],
      alt: `Imagem de ${project.title} 1`,
      loading: "lazy",
      decoding: "async",
    });
    mediaWrap.append(currentMainImg);

    if (project.images.length > 1) {
      project.images.forEach((src, i) => {
        const thumb = el("img", {
          src,
          alt: `Imagem ${i + 1} de ${project.title}`,
          loading: "lazy",
          decoding: "async",
        });
        if (i === 0) thumb.classList.add("active");
        thumb.addEventListener("click", () => {
          if (currentMainImg) {
            currentMainImg.src = src;
            currentMainImg.alt = `Imagem ${i + 1} de ${project.title}`;
          }
          galleryWrap
            .querySelectorAll("img")
            .forEach((n) => n.classList.remove("active"));
          thumb.classList.add("active");
        });
        galleryWrap.append(thumb);
      });
    }
    tabbar
      .querySelectorAll("button")
      .forEach((b) => b.classList.remove("active"));
    tabImgs?.classList.add("active");
  }

  let tab3d = null;
  let tabImgs = null;

  if (hasModel && hasImages) {
    tab3d = el(
      "button",
      { class: "project-modal-tab active", type: "button" },
      ["Modelo 3D"],
    );
    tab3d.addEventListener("click", show3D);
    tabImgs = el("button", { class: "project-modal-tab", type: "button" }, [
      "Imagens",
    ]);
    tabImgs.addEventListener("click", showImages);
    tabbar.append(tab3d, tabImgs);
  } else if (hasModel) {
    tab3d = el(
      "button",
      { class: "project-modal-tab active", type: "button" },
      ["Modelo 3D"],
    );
    tabbar.append(tab3d);
  } else if (hasImages) {
    tabImgs = el(
      "button",
      { class: "project-modal-tab active", type: "button" },
      ["Imagens"],
    );
    tabbar.append(tabImgs);
  }

  const detailSections = buildProjectDetails(project);

  modalContent.append(closeBtn, title);
  if (hasModel || hasImages) modalContent.append(tabbar);
  modalContent.append(mediaWrap, galleryWrap, detailSections);

  if (hasModel) {
    show3D();
  } else if (hasImages) {
    showImages();
  }

  modalEl.classList.add("open");
  document.body.style.overflow = "hidden";
  closeBtn.focus();
}

/**
 * Constrói as seções de descrição do modal, separando dado técnico e solução.
 * Mantém fallback para `description` quando o JSON ainda não trouxer campos
 * estruturados.
 * @param {Object} project Projeto a exibir.
 * @returns {HTMLElement} Bloco de detalhes estruturados.
 */
function buildProjectDetails(project) {
  const wrap = el("div", { class: "project-modal-details" });

  if (project.technical || project.solves) {
    if (project.technical) {
      wrap.append(
        el("section", { class: "project-detail-section" }, [
          el("h3", { class: "project-detail-title" }, ["Dado técnico"]),
          el("p", { class: "project-modal-desc" }, [project.technical]),
        ]),
      );
    }
    if (project.solves) {
      wrap.append(
        el("section", { class: "project-detail-section" }, [
          el("h3", { class: "project-detail-title" }, ["O que resolve"]),
          el("p", { class: "project-modal-desc" }, [project.solves]),
        ]),
      );
    }
    return wrap;
  }

  wrap.append(el("p", { class: "project-modal-desc" }, [project.description]));
  return wrap;
}

/**
 * Fecha o modal.
 * @returns {void}
 */
function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove("open");
  document.body.style.overflow = "";
  modalContent.innerHTML = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalEl && modalEl.classList.contains("open")) {
    closeModal();
  }
});

/**
 * Inicializa a seção de projetos: busca o JSON e renderiza os cards.
 */
export async function initProjects() {
  const grid = qs("#projects-grid");
  if (!grid) return;
  try {
    const res = await fetch("assets/data/projects.json");
    if (!res.ok) throw new Error("projects.json não encontrado");
    const projects = await res.json();
    grid.append(...projects.map(buildCard));
  } catch (err) {
    console.error("[projects] falha ao carregar projetos:", err);
    grid.append(
      el("p", { class: "project-error" }, [
        "Não foi possível carregar os projetos.",
      ]),
    );
  }
}
