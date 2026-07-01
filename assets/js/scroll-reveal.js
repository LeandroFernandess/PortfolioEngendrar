/**
 * @file scroll-reveal.js
 * @summary Animações de reveal/hide das seções conforme o viewport.
 *          Implementação atual usa IntersectionObserver + GSAP, evitando
 *          warnings de scroll-linked effects no Firefox.
 */

/**
 * Inicializa as animações de reveal de todas as seções.
 * @returns {Promise<void>}
 */
export async function initScrollReveal() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduceMotion) return;

  try {
    const { default: gsap } = await import("https://esm.run/gsap@3.13.0");
    const elements = gsap.utils.toArray("[data-reveal]");
    if (elements.length === 0) return;

    gsap.set(elements, { opacity: 0, y: 60, filter: "blur(8px)" });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          gsap.to(entry.target, {
            opacity: entry.isIntersecting ? 1 : 0,
            y: entry.isIntersecting ? 0 : 60,
            filter: entry.isIntersecting ? "blur(0px)" : "blur(8px)",
            duration: 0.8,
            ease: "power2.out",
            overwrite: true,
          });
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    elements.forEach((elem) => observer.observe(elem));
  } catch (err) {
    console.warn("[scroll-reveal] GSAP indisponível, animações desativadas.", err);
  }
}
