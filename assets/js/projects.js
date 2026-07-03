/**
 * @file projects.js
 * @summary Renderiza os cards de projetos, com preview 3D lazy na grade e modal detalhado.
 */

import { qs, el } from "./utils/dom.js";

const SHORT_LIMIT = 120;
const CARD_VIEWER_CONCURRENCY = 2;

let modalEl = null;
let modalContent = null;
let activeViewer = null;
let viewerRequestId = 0;
let cardObserver = null;
let activeCardLoads = 0;
const pendingCardLoads = [];
let isModalOpen = false;

/**
 * Trunca texto para cards.
 * @param {string} text
 * @param {number} limit
 * @returns {string}
 */
function truncate(text, limit) {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim() + "…";
}

/**
 * Cria o overlay de loading para cards ou modal.
 * @param {string} text
 * @returns {HTMLElement}
 */
function createLoading(text) {
  return el("div", { class: "project-loading", role: "status" }, [
    el("div", { class: "project-loading__spinner", "aria-hidden": "true" }),
    el("div", { class: "project-loading__text" }, [text]),
  ]);
}

/**
 * Constrói a mídia do card com preview 3D.
 * @param {Object} project
 * @returns {HTMLElement}
 */
function buildCardMedia(project) {
  if (project.model) {
    const media = el("div", {
      class: "project-media project-media-card-3d",
      "data-card-model": project.model,
      "aria-hidden": "true",
    });
    media.append(createLoading("Carregando modelo 3D..."));
    media.append(el("span", { class: "project-3d-badge" }, ["3D"]));
    return media;
  }

  if (project.images && project.images.length > 0) {
    return el("div", { class: "project-media" }, [
      el("img", {
        src: project.images[0],
        alt: `Imagem de ${project.title} 1`,
        loading: "lazy",
        decoding: "async",
      }),
    ]);
  }

  return el("div", { class: "project-media" }, [
    el("div", { class: "project-no-image" }, ["Sem imagem"]),
  ]);
}

/**
 * Constrói um card de projeto.
 * @param {Object} project
 * @returns {HTMLElement}
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

/**
 * Importa e cria um viewer 3D.
 * @param {HTMLElement} container
 * @param {string} modelUrl
 * @param {object} [options]
 * @returns {Promise<any>}
 */
async function createViewer(container, modelUrl, options) {
  const { initViewer3D } = await import("./viewer3d.js");
  return initViewer3D(container, modelUrl, options);
}

/**
 * Incrementa o request id e faz dispose do viewer ativo do modal.
 */
function disposeActiveViewer() {
  viewerRequestId += 1;
  if (!activeViewer) return;
  activeViewer.dispose();
  activeViewer = null;
}

/**
 * Coloca o carregamento do card na fila.
 * @param {HTMLElement} mediaEl
 */
function enqueueCardViewer(mediaEl) {
  if (!mediaEl || mediaEl.dataset.viewerStatus) return;
  mediaEl.dataset.viewerStatus = "queued";
  pendingCardLoads.push(mediaEl);
  flushCardQueue();
}

/**
 * Processa a fila de viewers dos cards.
 */
function flushCardQueue() {
  while (
    activeCardLoads < CARD_VIEWER_CONCURRENCY &&
    pendingCardLoads.length > 0
  ) {
    const mediaEl = pendingCardLoads.shift();
    if (!mediaEl || mediaEl.dataset.viewerStatus === "loaded") continue;
    activeCardLoads += 1;
    mediaEl.dataset.viewerStatus = "loading";

    createViewer(mediaEl, mediaEl.dataset.cardModel, {
      interactive: false,
      autoRotate: true,
      fitScale: 2.15,
    })
      .then((viewer) => {
        mediaEl._viewer = viewer;
        mediaEl.dataset.viewerStatus = "loaded";
        if (isModalOpen) viewer.pause();
      })
      .catch(() => {
        mediaEl.dataset.viewerStatus = "failed";
      })
      .finally(() => {
        activeCardLoads -= 1;
        flushCardQueue();
      });
  }
}

/**
 * Pausa ou retoma todos os viewers passivos da grade.
 * @param {boolean} pause
 */
function setCardViewersPaused(pause) {
  document.querySelectorAll("[data-card-model]").forEach((node) => {
    const viewer = node._viewer;
    if (!viewer) return;
    if (pause) viewer.pause();
    else viewer.resume();
  });
}

/**
 * Observa os cards com modelo 3D para carregar apenas quando entram em viewport.
 * @param {HTMLElement} root
 */
function initCardViewers(root) {
  const mediaNodes = Array.from(root.querySelectorAll("[data-card-model]"));
  if (mediaNodes.length === 0) return;

  cardObserver?.disconnect();
  cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const mediaEl = /** @type {HTMLElement} */ (entry.target);
        enqueueCardViewer(mediaEl);
        cardObserver.unobserve(mediaEl);
      });
    },
    { rootMargin: "160px 0px", threshold: 0.05 },
  );

  mediaNodes.forEach((node) => cardObserver.observe(node));
}

/**
 * Garante que o modal exista no DOM.
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
 * Abre o modal com os detalhes do projeto.
 * @param {Object} project
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
  let tab3d = null;
  let tabImgs = null;

  async function show3D() {
    disposeActiveViewer();
    const requestId = viewerRequestId;
    mediaWrap.innerHTML = "";
    galleryWrap.innerHTML = "";

    const viewerWrap = el("div", {
      class: "project-media project-media-3d project-media-3d-lg",
      "aria-label": `Modelo 3D de ${project.title}`,
    });
    viewerWrap.append(createLoading("Carregando modelo 3D..."));
    mediaWrap.append(viewerWrap);

    tabbar
      .querySelectorAll("button")
      .forEach((b) => b.classList.remove("active"));
    tab3d?.classList.add("active");

    const viewer = await createViewer(viewerWrap, project.model, {
      interactive: true,
      autoRotate: true,
      fitScale: 2.5,
    });

    if (requestId !== viewerRequestId || !modalEl?.classList.contains("open")) {
      viewer.dispose();
      return;
    }
    activeViewer = viewer;
  }

  function showImages() {
    disposeActiveViewer();
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
            .forEach((node) => node.classList.remove("active"));
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

  if (hasModel && hasImages) {
    tab3d = el("button", { class: "project-modal-tab", type: "button" }, [
      "Modelo 3D",
    ]);
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

  modalContent.append(closeBtn, title);
  if (hasModel || hasImages) modalContent.append(tabbar);
  modalContent.append(mediaWrap, galleryWrap, buildProjectDetails(project));

  isModalOpen = true;
  setCardViewersPaused(true);
  modalEl.classList.add("open");
  document.body.style.overflow = "hidden";

  if (hasModel) {
    show3D();
  } else if (hasImages) {
    showImages();
  }
  closeBtn.focus();
}

/**
 * Monta os detalhes estruturados do projeto.
 * @param {Object} project
 * @returns {HTMLElement}
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
 */
function closeModal() {
  if (!modalEl) return;
  disposeActiveViewer();
  isModalOpen = false;
  setCardViewersPaused(false);
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
 * Inicializa a seção de projetos.
 */
export async function initProjects() {
  const grid = qs("#projects-grid");
  if (!grid) return;

  try {
    const res = await fetch("assets/data/projects.json");
    if (!res.ok) throw new Error("projects.json não encontrado");
    const projects = await res.json();
    grid.append(...projects.map(buildCard));
    initCardViewers(grid);
  } catch (err) {
    console.error("[projects] falha ao carregar projetos:", err);
    grid.append(
      el("p", { class: "project-error" }, [
        "Não foi possível carregar os projetos.",
      ]),
    );
  }
}
