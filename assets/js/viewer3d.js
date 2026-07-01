/**
 * @file viewer3d.js
 * @summary Renderiza um modelo .glb em um <canvas> usando Three.js.
 *          Usa import map definido no index.html (bare specifiers 'three' e 'three/addons/').
 *          Honra prefers-reduced-motion (sem auto-rotação).
 */

/**
 * Cria e inicializa um visualizador 3D para um modelo .glb.
 * @param {HTMLElement} container Elemento contêiner onde o canvas será anexado.
 * @param {string} modelUrl URL do arquivo .glb a carregar.
 * @returns {Promise<void>}
 */
export async function initViewer3D(container, modelUrl) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let THREE, GLTFLoader, OrbitControls;
  try {
    THREE = await import("three");
    GLTFLoader = (await import("three/addons/loaders/GLTFLoader.js"))
      .GLTFLoader;
    OrbitControls = (await import("three/addons/controls/OrbitControls.js"))
      .OrbitControls;
  } catch (err) {
    console.error("[viewer3d] Falha ao importar Three.js:", err);
    showFallback(container);
    return;
  }

  const width = container.clientWidth || 320;
  const height = container.clientHeight || 200;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 2.2);
  scene.add(hemi);

  const dir1 = new THREE.DirectionalLight(0xffffff, 2.5);
  dir1.position.set(2, 3, 4);
  scene.add(dir1);

  const dir2 = new THREE.DirectionalLight(0x8899ff, 1.0);
  dir2.position.set(-3, -1, -2);
  scene.add(dir2);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 1.5;
  controls.enablePan = false;
  controls.minDistance = 2;
  controls.maxDistance = 10;

  const loader = new GLTFLoader();
  loader.load(
    modelUrl,
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.5 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      scene.add(model);
    },
    (progress) => {
      if (progress.total) {
        const pct = Math.round((progress.loaded / progress.total) * 100);
      }
    },
    (err) => {
      console.error("[viewer3d] Falha ao carregar modelo .glb:", err);
      showFallback(container);
    },
  );

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(() => {
    const w = container.clientWidth || width;
    const h = container.clientHeight || height;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(container);
}

/**
 * Exibe um fallback quando o 3D não está disponível.
 * @param {HTMLElement} container Contêiner a preencher.
 */
function showFallback(container) {
  container.innerHTML = "";
  const text = document.createElement("div");
  text.className = "project-no-image";
  text.textContent = "Modelo 3D indisponível";
  container.appendChild(text);
}
