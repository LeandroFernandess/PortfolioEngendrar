/**
 * @file viewer3d.js
 * @summary Renderiza um modelo .glb em um container usando Three.js.
 *          Suporta modo interativo (modal) e modo passivo (cards da grade).
 */

/**
 * Cria e inicializa um visualizador 3D para um modelo .glb.
 * @param {HTMLElement} container Elemento onde o canvas será anexado.
 * @param {string} modelUrl URL do arquivo .glb.
 * @param {{ interactive?: boolean, autoRotate?: boolean, fitScale?: number }} [options]
 * @returns {Promise<{dispose: Function, pause: Function, resume: Function}>}
 */
export async function initViewer3D(container, modelUrl, options = {}) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const interactive = options.interactive !== false;
  const autoRotate =
    options.autoRotate === undefined ? !reduceMotion : options.autoRotate;
  const fitScale = options.fitScale || 2.5;

  let THREE, GLTFLoader, OrbitControls, DRACOLoader;
  try {
    THREE = await import("three");
    GLTFLoader = (await import("three/addons/loaders/GLTFLoader.js"))
      .GLTFLoader;
    OrbitControls = (await import("three/addons/controls/OrbitControls.js"))
      .OrbitControls;
    DRACOLoader = (await import("three/addons/loaders/DRACOLoader.js"))
      .DRACOLoader;
  } catch (err) {
    console.error("[viewer3d] Falha ao importar Three.js:", err);
    showFallback(container);
    return createNoopViewer();
  }

  let disposed = false;
  let rafId = 0;
  let isVisible = true;

  const width = container.clientWidth || 320;
  const height = container.clientHeight || 200;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0.15, 5.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const pixelRatioCap = isCoarsePointer ? 1.25 : 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.pointerEvents = interactive ? "auto" : "none";
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 2.2);
  scene.add(hemi);

  const dir1 = new THREE.DirectionalLight(0xffffff, 2.5);
  dir1.position.set(2, 3, 4);
  scene.add(dir1);

  const dir2 = new THREE.DirectionalLight(0x8899ff, 1);
  dir2.position.set(-3, -1, -2);
  scene.add(dir2);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = interactive ? 1.5 : 1.1;
  controls.enablePan = false;
  controls.enableRotate = interactive;
  controls.enableZoom = interactive;
  controls.minDistance = 2;
  controls.maxDistance = 10;

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  loader.setDRACOLoader(dracoLoader);

  const ro = new ResizeObserver(() => {
    const w = container.clientWidth || width;
    const h = container.clientHeight || height;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(container);

  const io = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
    },
    { threshold: 0.01 },
  );
  io.observe(container);

  function animate() {
    rafId = requestAnimationFrame(animate);
    if (disposed || !isVisible) return;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const viewer = {
    dispose,
    pause,
    resume,
  };

  try {
    const model = await loadModel(loader, THREE, modelUrl, fitScale, container);
    if (disposed) {
      disposeObject(model);
      return viewer;
    }
    scene.add(model);
    clearLoading(container);
    return viewer;
  } catch (err) {
    if (!disposed) {
      console.error("[viewer3d] Falha ao carregar modelo .glb:", err);
      showFallback(container);
    }
    dispose();
    return createNoopViewer();
  }

  function pause() {
    isVisible = false;
  }

  function resume() {
    isVisible = true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(rafId);
    ro.disconnect();
    io.disconnect();
    controls.dispose();
    dracoLoader.dispose();
    disposeObject(scene);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }
}

/**
 * Carrega o modelo GLB, centraliza e ajusta escala.
 * @param {*} loader
 * @param {*} THREE
 * @param {string} modelUrl
 * @param {number} fitScale
 * @param {HTMLElement} container
 * @returns {Promise<any>}
 */
function loadModel(loader, THREE, modelUrl, fitScale, container) {
  return new Promise((resolve, reject) => {
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = fitScale / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        resolve(model);
      },
      (progress) => {
        if (progress.total) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          updateLoadingText(container, `Carregando modelo 3D... ${pct}%`);
        }
      },
      reject,
    );
  });
}

/**
 * Atualiza o texto do loading, se existir.
 * @param {HTMLElement} container
 * @param {string} text
 */
function updateLoadingText(container, text) {
  const loading = container.querySelector(".project-loading__text");
  if (loading) loading.textContent = text;
  const fallback = container.querySelector(".project-viewer-loading");
  if (fallback) fallback.textContent = text;
}

/**
 * Remove o loading overlay do container.
 * @param {HTMLElement} container
 */
function clearLoading(container) {
  container.querySelector(".project-loading")?.remove();
  container.querySelector(".project-viewer-loading")?.remove();
}

/**
 * Exibe um fallback quando o 3D não está disponível.
 * @param {HTMLElement} container
 */
function showFallback(container) {
  clearLoading(container);
  container.innerHTML = "";
  const text = document.createElement("div");
  text.className = "project-no-image";
  text.textContent = "Modelo 3D indisponível";
  container.appendChild(text);
}

/**
 * Retorna um viewer no-op.
 * @returns {{dispose: Function, pause: Function, resume: Function}}
 */
function createNoopViewer() {
  return {
    dispose() {},
    pause() {},
    resume() {},
  };
}

/**
 * Faz dispose recursivo de geometrias, materiais e texturas.
 * @param {any} object
 */
function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (!child.material) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value && typeof value.dispose === "function") value.dispose();
      });
      material.dispose();
    });
  });
}
