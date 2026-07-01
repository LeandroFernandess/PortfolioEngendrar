/**
 * @file utils/dom.js
 * @summary Helpers utilitários de DOM reutilizáveis.
 */

/**
 * Atalho para querySelector.
 * @param {string} selector Seletor CSS.
 * @param {ParentNode} [parent=document] Contexto de busca.
 * @returns {HTMLElement|null} Primeiro elemento encontrado.
 */
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Atalho para querySelectorAll, retornando Array (mais fácil de iterar).
 * @param {string} selector Seletor CSS.
 * @param {ParentNode} [parent=document] Contexto de busca.
 * @returns {Array<HTMLElement>} Lista de elementos.
 */
export function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Cria um elemento com atributos e filhos opcionais.
 * @param {string} tag Tag do elemento (ex.: "div").
 * @param {Record<string, string>} [attrs] Atributos a definir.
 * @param {Array<Node|string>} [children] Filhos a anexar.
 * @returns {HTMLElement} Elemento criado.
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value;
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.append(
      child.nodeType ? child : document.createTextNode(String(child)),
    );
  }
  return node;
}
