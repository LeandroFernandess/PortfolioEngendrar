/**
 * @file hero.js
 * @summary Cena 3D do hero (Three.js + GSAP) — composição industrial
 *          inspirada no logotipo da Engendrar Soluções Mecânicas.
 */

// ────────────────────── Cores fixas dos materiais metálicos ────────────────
const MAT_COLORS = {
  brushed: 0x9aa0aa, // aço escovado
  graphite: 0x2b3038, // grafite (engrenagem)
  steel: 0x4a5360, // aço escuro
  agedGold: 0xc8a35e, // dourado envelhecido
  accent: 0x5aa6ff, // azul acento metálico
  warm: 0xffc566, // dourado quente (emissivo do ouro)
};

// ─────────────────────────── Configuração de tema ────────────────────────
const THEME_3D = {
  dark: {
    bg: 0x0a0d12, // grafite/escuro industrial (não espacial)
    bgEnd: 0x141921, // extremidade do gradiente de fundo
    grid: 0x2a3542, // grade técnica (sutil)
    beam: 0x1a2028, // viga metálica
    spark: 0xffd58a, // faísca quente
    line: 0x5aa6ff, // linhas técnicas
    ring: 0x5aa6ff, // anel orbital A
    ringB: 0x5aa6ff, // anel orbital B
    // Luzes (cores + intensidades)
    key: { color: 0xffffff, intensity: 2.4 },
    fill: { color: 0x8fb8ff, intensity: 0.9 },
    rim: { color: 0x5aa6ff, intensity: 1.8 },
    golden: { color: 0xffc566, intensity: 1.1 },
    coldUnder: { color: 0x5aa6ff, intensity: 0.7 },
    ambient: { color: 0x232830, intensity: 0.5 },
    exposure: 1.08,
    fogNear: 8,
    fogFar: 28,
  },
  light: {
    bg: 0xd9dee4, // cinza claro industrial (off-white)
    bgEnd: 0xeef1f4, // extremidade do gradiente de fundo (quase branco)
    grid: 0xb8c0cc, // grid cinza/azul bem sutil (acima do fundo claro)
    beam: 0xd0d6dd, // viga metálica clara
    spark: 0x8a5a1e, // faísca dourada escura (visível em fundo claro)
    line: 0x4a76b0, // linhas técnicas (azul acinzentado)
    ring: 0x4a76b0, // anel orbital A
    ringB: 0x4a76b0, // anel orbital B
    key: { color: 0xffffff, intensity: 2.0 },
    fill: { color: 0xcfe0ff, intensity: 1.1 },
    rim: { color: 0x6a8fd0, intensity: 1.2 },
    golden: { color: 0xffd28a, intensity: 0.8 },
    coldUnder: { color: 0x6a8fd0, intensity: 0.5 },
    ambient: { color: 0xffffff, intensity: 0.85 },
    exposure: 1.18,
    fogNear: 12,
    fogFar: 34,
  },
};

let colors = THEME_3D.dark;
const SPEEDS = {
  gear: 0.0018,
  sparks: 0.0012,
  ringA: 0.0016,
  ringB: -0.0012,
  helmet: 0.0018,
  parallax: 0.05,
};
const FLOAT = { eAmp: 0.06, helmetAmp: 0.08, eFreq: 0.9, helmetFreq: 0.7 };
// ───────────────────────────────────────────────────────────────────────

/**
 * Inicializa a cena 3D do hero.
 * @returns {Promise<void>}
 */
export async function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const isMobile = isCoarsePointer || window.innerWidth < 768;
  const perfProfile = isMobile ? "low" : "high";

  let THREE;
  try {
    THREE = await import("three");
  } catch (err) {
    console.warn("[hero] Three.js indisponível:", err);
    return;
  }

  const camera = new THREE.PerspectiveCamera(
    46,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100,
  );
  camera.position.set(0, 0.4, 10.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: false,
    powerPreference: isMobile ? "default" : "high-performance",
  });
  const pixelRatioCap = isCoarsePointer ? 1.25 : 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setClearColor(colors.bg, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = colors.exposure;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(colors.bg, colors.fogNear, colors.fogFar);

  // ───────────────────── Iluminação cinematográfica ─────────────────────
  const keyLight = new THREE.DirectionalLight(
    colors.key.color,
    colors.key.intensity,
  );
  keyLight.position.set(5, 7, 8);
  keyLight.target.position.set(0, 0, 0);
  scene.add(keyLight);
  scene.add(keyLight.target);

  const fillLight = new THREE.DirectionalLight(
    colors.fill.color,
    colors.fill.intensity,
  );
  fillLight.position.set(-7, 2, 4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(
    colors.rim.color,
    colors.rim.intensity,
  );
  rimLight.position.set(-6, 3, -8);
  scene.add(rimLight);

  const goldenLight = new THREE.PointLight(
    colors.golden.color,
    colors.golden.intensity,
    22,
    1.8,
  );
  goldenLight.position.set(3.5, 2.2, 3);
  scene.add(goldenLight);

  const coldUnderLight = new THREE.PointLight(
    colors.coldUnder.color,
    colors.coldUnder.intensity,
    18,
    1.6,
  );
  coldUnderLight.position.set(0, -3.2, 3);
  scene.add(coldUnderLight);

  const ambientLight = new THREE.AmbientLight(
    colors.ambient.color,
    colors.ambient.intensity,
  );
  scene.add(ambientLight);

  // ───────────────────────── Materiais metálicos ───────────────────────
  const brushedMat = new THREE.MeshPhysicalMaterial({
    color: MAT_COLORS.brushed,
    metalness: 1.0,
    roughness: 0.32,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
  });

  const graphiteMat = new THREE.MeshPhysicalMaterial({
    color: MAT_COLORS.graphite,
    metalness: 0.9,
    roughness: 0.55,
    clearcoat: 0.2,
    clearcoatRoughness: 0.6,
  });

  const steelMat = new THREE.MeshPhysicalMaterial({
    color: MAT_COLORS.steel,
    metalness: 0.85,
    roughness: 0.5,
    clearcoat: 0.3,
    clearcoatRoughness: 0.5,
  });

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: MAT_COLORS.agedGold,
    metalness: 1.0,
    roughness: 0.22,
    clearcoat: 0.6,
    clearcoatRoughness: 0.28,
    emissive: new THREE.Color(MAT_COLORS.warm),
    emissiveIntensity: 0.0, // sobe no hover
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: MAT_COLORS.accent,
    metalness: 0.6,
    roughness: 0.35,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
    emissive: new THREE.Color(MAT_COLORS.accent),
    emissiveIntensity: 0.04,
  });

  /** @type {THREE.Object3D[]} */
  const hoverTargets = [];

  // ───────────────────────────── Engrenagem ─────────────────────────────
  const segMul = perfProfile === "low" ? 0.5 : 1;
  /**
   * Cria uma engrenagem robusta via ExtrudeGeometry.
   * @param {object} opts Parâmetros de forma.
   * @param {number} opts.teeth Número de dentes (≥ 6 recomendado).
   * @param {number} opts.rootRaio Raio da raiz (base entre dentes).
   * @param {number} opts.tipRaio Raio da ponta do dente (dentes maiores).
   * @param {number} opts.depth Profundidade (eixo z) da engrenagem.
   * @param {number} opts.hubRaio Raio do cubo central.
   * @param {number} opts.boltRaio Raio dos furos de alívio.
   * @param {number} opts.bolts Quantidade de furos de alívio.
   * @param {THREE.Material} opts.bodyMat Material do corpo escuro (grafite).
   * @param {THREE.Material} opts.ringMat Material do anel metálico (aço).
   * @param {THREE.Material} opts.hubMat Material do cubo (aço polido).
   * @returns {THREE.Group} Grupo da engrenagem.
   */
  function createGear({
    teeth = 16,
    rootRaio = 1.75,
    tipRaio = 2.35,
    depth = 0.55,
    hubRaio = 0.5,
    boltRaio = 0.18,
    bolts = 6,
    bodyMat = graphiteMat,
    ringMat = brushedMat,
    hubMat = steelMat,
  } = {}) {
    const group = new THREE.Group();

    // ── Perfil 2D do dente ──
    const step = (Math.PI * 2) / teeth;
    const toothWidth = step * 0.34;
    const flankWidth = step * 0.12;
    const gapHalf = step * 0.04;

    const shape = new THREE.Shape();
    const pts = [];
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      pts.push(polar(rootRaio, a - gapHalf));
      pts.push(polar(rootRaio, a - toothWidth));
      pts.push(polar(tipRaio, a - toothWidth + flankWidth));
      pts.push(polar(tipRaio, a + toothWidth - flankWidth));
      pts.push(polar(rootRaio, a + toothWidth));
      pts.push(polar(rootRaio, a + gapHalf));
    }
    shape.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);
    shape.closePath();

    const hubHole = new THREE.Path();
    hubHole.absarc(0, 0, hubRaio, 0, Math.PI * 2, true);
    shape.holes.push(hubHole);

    if (bolts > 0) {
      for (let i = 0; i < bolts; i++) {
        const a = (i / bolts) * Math.PI * 2;
        const cx = Math.cos(a) * rootRaio * 0.62;
        const cy = Math.sin(a) * rootRaio * 0.62;
        const sub = new THREE.Path();
        sub.absarc(cx, cy, boltRaio, 0, Math.PI * 2, true);
        shape.holes.push(sub);
      }
    }

    const bodyGeom = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.05,
      bevelSegments: Math.max(2, Math.round(4 * segMul)),
      curveSegments: Math.max(12, Math.round(28 * segMul)),
    });
    bodyGeom.center();
    bodyGeom.computeVertexNormals();
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    group.add(body);
    hoverTargets.push(body);

    // ── Anel metálico escuro (bushing/colar) ──
    const ringInner = rootRaio * 0.78;
    const ringOuter = rootRaio * 0.96;
    const ringGeom = new THREE.RingGeometry(
      ringInner,
      ringOuter,
      Math.max(32, Math.round(96 * segMul)),
    );
    const ringFace = new THREE.Mesh(ringGeom, steelMat);
    ringFace.position.z = depth / 2 + 0.001;
    group.add(ringFace);
    hoverTargets.push(ringFace);
    const ringBack = ringFace.clone();
    ringBack.position.z = -(depth / 2 + 0.001);
    ringBack.rotation.y = Math.PI;
    group.add(ringBack);

    // ── Cubo central (aço polido) ──
    const hubExtrude = depth * 1.35;
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(
        hubRaio * 1.08,
        hubRaio * 1.08,
        hubExtrude,
        Math.max(16, Math.round(32 * segMul)),
      ),
      hubMat,
    );
    hub.rotation.x = Math.PI / 2;
    group.add(hub);
    hoverTargets.push(hub);

    // ── Anel frontal de reforço (aro metálico sobre a face) ──
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(
        rootRaio * 0.86,
        0.06,
        Math.max(8, Math.round(18 * segMul)),
        Math.max(32, Math.round(96 * segMul)),
      ),
      ringMat,
    );
    rim.position.set(0, 0, depth / 2 + 0.04);
    group.add(rim);
    hoverTargets.push(rim);

    // ── Pinos/parafusos no cubo (detalhe metálico) ──
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.06,
          0.06,
          depth * 1.6,
          Math.max(6, Math.round(12 * segMul)),
        ),
        hubMat,
      );
      pin.position.set(
        Math.cos(a) * hubRaio * 0.58,
        Math.sin(a) * hubRaio * 0.58,
        0,
      );
      pin.rotation.x = Math.PI / 2;
      group.add(pin);
    }

    return group;
  }

  /**
   * Calcula coordenadas cartesianas (x,y) a partir de coordenadas polares (r, a).
   * @param {*} r Raio da coordenada polar.
   * @param {*} a Ângulo da coordenada polar.
   * @returns {Object} Coordenadas cartesianas (x, y).
   */
  function polar(r, a) {
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }

  // ───────────────────────────── Letra "E" ─────────────────────────────
  /**
   * Constrói a letra "E" 3D com bevel e profundidade.
   * @param {THREE.Material} material Material metálico.
   * @returns {THREE.Group} Grupo com a letra E.
   */
  function createLetterE(material = goldMat) {
    const group = new THREE.Group();
    const thickness = 0.6;
    const height = 2.3;
    const barW = 0.42;
    const stemW = barW;
    const halfW = 1.75;
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, -height / 2);
    shape.lineTo(halfW, -height / 2);
    shape.lineTo(halfW, -height / 2 + barW);
    shape.lineTo(-halfW + stemW, -height / 2 + barW);
    shape.lineTo(-halfW + stemW, -barW / 2);
    shape.lineTo(halfW * 0.48, -barW / 2);
    shape.lineTo(halfW * 0.48, barW / 2);
    shape.lineTo(-halfW + stemW, barW / 2);
    shape.lineTo(-halfW + stemW, height / 2 - barW);
    shape.lineTo(halfW, height / 2 - barW);
    shape.lineTo(halfW, height / 2);
    shape.lineTo(-halfW, height / 2);
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.06,
      bevelSegments: Math.max(2, Math.round(5 * segMul)),
      curveSegments: Math.max(6, Math.round(12 * segMul)),
    });
    geom.center();
    geom.computeVertexNormals();
    const letter = new THREE.Mesh(geom, material);
    letter.castShadow = true;
    group.add(letter);
    hoverTargets.push(letter);
    return group;
  }

  // ───────────────────────────── Capacete ──────────────────────────────
  /**
   * Constrói o capacete de segurança dourado.
   * @param {THREE.Material} domeMat Material da cúpula (dourado).
   * @param {THREE.Material} brimMat Material da aba/borda (aço escuro).
   * @returns {THREE.Group} Grupo do capacete.
   */
  function createHelmet(domeMat = goldMat, brimMat = steelMat) {
    const group = new THREE.Group();

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.98,
        Math.max(22, Math.round(44 * segMul)),
        Math.max(16, Math.round(32 * segMul)),
        0,
        Math.PI * 2,
        0,
        Math.PI / 1.9,
      ),
      domeMat,
    );
    dome.castShadow = true;
    group.add(dome);
    hoverTargets.push(dome);

    const bottomRim = new THREE.Mesh(
      new THREE.TorusGeometry(
        1.0,
        0.04,
        Math.max(6, Math.round(12 * segMul)),
        Math.max(32, Math.round(64 * segMul)),
      ),
      brimMat,
    );
    bottomRim.rotation.x = Math.PI / 2;
    bottomRim.position.y = -0.02;
    group.add(bottomRim);

    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(
        1.05,
        1.02,
        0.06,
        Math.max(28, Math.round(56 * segMul)),
        1,
        true,
        -Math.PI / 2,
        Math.PI,
      ),
      brimMat,
    );
    brim.rotation.x = Math.PI / 2;
    brim.position.y = -0.02;
    group.add(brim);
    hoverTargets.push(brim);

    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(
        1.0,
        1.0,
        0.12,
        Math.max(28, Math.round(56 * segMul)),
      ),
      domeMat,
    );
    band.position.y = 0.2;
    group.add(band);

    for (const sign of [-1, 1]) {
      const relief = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.9, 0.12),
        domeMat,
      );
      relief.position.set(sign * 0.28, 0.5, 0.8);
      relief.rotation.x = -0.35;
      group.add(relief);
      hoverTargets.push(relief);
    }

    const vent = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.09,
        0.09,
        0.16,
        Math.max(8, Math.round(18 * segMul)),
      ),
      brimMat,
    );
    vent.position.y = 0.98;
    group.add(vent);

    return group;
  }

  // ─────────────────────────── Composição ──────────────────────────────
  const engendrarEmblem = new THREE.Group();
  scene.add(engendrarEmblem);

  const gear = createGear({
    teeth: 16,
    rootRaio: 1.75,
    tipRaio: 2.35,
    depth: 0.55,
  });
  gear.position.set(0, 0, -0.55);
  engendrarEmblem.add(gear);

  const letter = createLetterE(goldMat);
  letter.scale.setScalar(0.82);
  letter.position.set(0, 0, 0.95);
  engendrarEmblem.add(letter);

  const helmet = createHelmet(goldMat, steelMat);
  helmet.scale.setScalar(0.42);
  helmet.position.set(0, 2.5, 0.7);
  engendrarEmblem.add(helmet);

  // ───────────────────────── Anéis orbitais ───────────────────────────
  const ringAMat = new THREE.MeshStandardMaterial({
    color: colors.ring,
    metalness: 0.4,
    roughness: 0.5,
    transparent: true,
    opacity: 0.45,
  });
  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(
      4.3,
      0.016,
      Math.max(8, Math.round(16 * segMul)),
      Math.max(40, Math.round(100 * segMul)),
    ),
    ringAMat,
  );
  ringA.rotation.set(Math.PI / 2.2, 0.3, 0);
  scene.add(ringA);

  const ringBMat = new THREE.MeshStandardMaterial({
    color: colors.ringB,
    metalness: 0.4,
    roughness: 0.5,
    transparent: true,
    opacity: 0.4,
  });
  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(
      5.3,
      0.012,
      Math.max(8, Math.round(16 * segMul)),
      Math.max(40, Math.round(100 * segMul)),
    ),
    ringBMat,
  );
  ringB.rotation.set(-Math.PI / 3, 0.7, 0.3);
  scene.add(ringB);

  // ─────────────────────────── Fundo industrial ───────────────────────
  const bgGeom = new THREE.PlaneGeometry(60, 36);
  const bgMatGrad = makeGradientMaterial(THREE, colors.bg, colors.bgEnd);
  const bgPlane = new THREE.Mesh(bgGeom, bgMatGrad);
  bgPlane.position.set(0, 0, -12);
  scene.add(bgPlane);

  const grid = new THREE.GridHelper(40, 40, colors.grid, colors.grid);
  grid.position.set(0, -3.4, -3);
  grid.rotation.x = -0.12;
  setOpacity(grid, 0.18);
  scene.add(grid);

  const beamMat = steelMat.clone();
  beamMat.color = new THREE.Color(colors.beam);
  for (const x of [-8, 8]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 14, 0.18), beamMat);
    beam.position.set(x, 0, -6);
    scene.add(beam);
    for (let i = 0; i < 4; i++) {
      const trav = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.1, 0.1),
        beamMat,
      );
      trav.position.set(x + (x < 0 ? 1.1 : -1.1), -2 + i * 1.6, -6);
      scene.add(trav);
    }
  }

  // ───────────────────── Faíscas industriais (não estrelas) ──────────────
  const sparkCount = perfProfile === "low" ? 40 : 80;
  const sparkGeom = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(sparkCount * 3);
  const sparkVel = new Float32Array(sparkCount);
  for (let i = 0; i < sparkCount; i++) {
    sparkPos[i * 3] = (Math.random() - 0.5) * 18;
    sparkPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    sparkVel[i] = 0.002 + Math.random() * 0.004;
  }
  sparkGeom.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: colors.spark,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparks = new THREE.Points(sparkGeom, sparkMat);
  scene.add(sparks);

  // ─────────────────────────── Linhas técnicas ─────────────────────────
  const lineMat = new THREE.LineBasicMaterial({
    color: colors.line,
    transparent: true,
    opacity: 0.25,
  });
  for (const angle of [0, Math.PI / 2]) {
    const pts = [new THREE.Vector3(-9, 0, 0), new THREE.Vector3(9, 0, 0)];
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      lineMat,
    );
    line.rotation.z = angle;
    line.position.z = -2;
    scene.add(line);
  }

  // ─────────────────────────── Aplicador de tema ───────────────────────
  /**
   * Reaplica a paleta do tema informado à cena existente, sem recriar
   * geometrias/câmera/renderer. Atualiza fundo, fog, luzes, grid, vigas,
   * faíscas, linhas, anéis e exposição do renderer.
   * @param {'dark'|'light'} theme Tema alvo.
   */
  function applyTheme(theme) {
    colors = THEME_3D[theme] || THEME_3D.dark;

    // Fundo + fog + exposição
    renderer.setClearColor(colors.bg, 1);
    renderer.toneMappingExposure = colors.exposure;
    scene.fog.color.setHex(colors.bg);
    scene.fog.near = colors.fogNear;
    scene.fog.far = colors.fogFar;

    // Gradiente do plano de fundo (uniforms do ShaderMaterial)
    bgMatGrad.uniforms.top.value.setHex(colors.bg);
    bgMatGrad.uniforms.bottom.value.setHex(colors.bgEnd);

    // Luzes
    keyLight.color.setHex(colors.key.color);
    keyLight.intensity = colors.key.intensity;
    fillLight.color.setHex(colors.fill.color);
    fillLight.intensity = colors.fill.intensity;
    rimLight.color.setHex(colors.rim.color);
    rimLight.intensity = colors.rim.intensity;
    goldenLight.color.setHex(colors.golden.color);
    goldenLight.intensity = colors.golden.intensity;
    coldUnderLight.color.setHex(colors.coldUnder.color);
    coldUnderLight.intensity = colors.coldUnder.intensity;
    ambientLight.color.setHex(colors.ambient.color);
    ambientLight.intensity = colors.ambient.intensity;

    // Grid: GridHelper pode ter 1 ou 2 LineBasicMaterial (centro/grid).
    const gridMats = Array.isArray(grid.material)
      ? grid.material
      : [grid.material];
    gridMats.forEach((m) => {
      m.color.setHex(colors.grid);
      m.opacity = theme === "light" ? 0.12 : 0.18;
    });

    // Vigas metálicas
    beamMat.color.setHex(colors.beam);

    // Faíscas
    sparkMat.color.setHex(colors.spark);
    sparkMat.blending =
      theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending;
    sparkMat.opacity = theme === "light" ? 0.4 : 0.55;

    // Linhas técnicas
    lineMat.color.setHex(colors.line);

    // Anéis orbitais
    ringAMat.color.setHex(colors.ring);
    ringBMat.color.setHex(colors.ringB);
  }

  applyTheme(
    document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark",
  );

  const themeObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "data-theme") {
        const t = document.documentElement.getAttribute("data-theme");
        applyTheme(t === "light" ? "light" : "dark");
      }
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // ─────────────────────────── Entrada GSAP ────────────────────────────
  let gsap = null;
  if (!reduceMotion) {
    try {
      gsap = await import("https://esm.run/gsap@3.13.0").then((m) => m.default);
    } catch (err) {
      console.warn("[hero] GSAP indisponível:", err);
    }
  }

  if (gsap) {
    gsap.set(engendrarEmblem.scale, { x: 0.85, y: 0.85, z: 0.85 });
    gsap.set(engendrarEmblem.position, { y: 0.6 });
    gsap.from(engendrarEmblem.rotation, {
      y: -Math.PI * 0.25,
      duration: 1.6,
      ease: "power3.out",
    });

    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 1.4 },
    });
    tl.to(engendrarEmblem.scale, { x: 1, y: 1, z: 1, duration: 1.6 }, 0)
      .to(engendrarEmblem.position, { y: 0, duration: 1.3 }, 0)
      .fromTo(
        [ringA, ringB],
        { material: { opacity: 0 } },
        { material: { opacity: 0.45 }, duration: 1.1, stagger: 0.2 },
        0.2,
      )
      .fromTo(sparkMat, { opacity: 0 }, { opacity: 0.55, duration: 1.2 }, 0.4);
  }

  // Scroll-linked effects opcionais removidos para evitar warning do Firefox
  // sobre scroll-linked positioning effects. O hero mantém entrada GSAP,
  // parallax de câmera e animações sutis sem depender do scroll.

  // ───────────────────── Parallax de câmera com mouse ───────────────────
  let mouseX = 0;
  let mouseY = 0;
  let camX = 0;
  let camY = 0.4;
  const camBaseZ = 10.5;
  if (!reduceMotion) {
    window.addEventListener(
      "pointermove",
      (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true },
    );
  }

  // ─────────────────────────── Hover (raycaster) ────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hoverTarget = 0;
  let hoverCurrent = 0;
  let pointerInside = false;

  if (!reduceMotion && !isCoarsePointer) {
    canvas.addEventListener("pointermove", (e) => {
      ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
      ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    canvas.addEventListener("pointerenter", () => (pointerInside = true));
    canvas.addEventListener("pointerleave", () => {
      pointerInside = false;
      hoverTarget = 0;
    });
  }

  // ───────────────────────── Loop de render ────────────────────────────
  const clock = new THREE.Clock();
  let isVisible = true;

  const io = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting;
    },
    { threshold: 0.05 },
  );
  io.observe(canvas);

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    const t = clock.getElapsedTime();
    const pos = /** @type {THREE.BufferAttribute} */ (
      sparkGeom.getAttribute("position")
    );
    const arr = pos.array;

    if (!reduceMotion) {
      gear.rotation.z += SPEEDS.gear;

      letter.position.y = Math.sin(t * FLOAT.eFreq) * FLOAT.eAmp;

      helmet.position.y =
        2.5 + Math.sin(t * FLOAT.helmetFreq) * FLOAT.helmetAmp;

      ringA.rotation.z += SPEEDS.ringA;
      ringB.rotation.z += SPEEDS.ringB;

      for (let i = 0; i < sparkCount; i++) {
        arr[i * 3 + 1] += sparkVel[i];
        if (arr[i * 3 + 1] > 4) arr[i * 3 + 1] = -4;
      }
      pos.needsUpdate = true;

      camX += (mouseX * 1.4 - camX) * SPEEDS.parallax;
      camY += (0.4 - mouseY * 0.7 - camY) * SPEEDS.parallax;
      camera.position.x = camX;
      camera.position.y = camY;
      camera.position.z = camBaseZ + Math.sin(t * 0.2) * 0.2;
      camera.lookAt(0, 0, 0);

      if (pointerInside && !isCoarsePointer) {
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(hoverTargets, false);
        hoverTarget = hits.length > 0 ? 1 : 0;
      }
    }

    hoverCurrent += (hoverTarget - hoverCurrent) * 0.06;
    const h = hoverCurrent;
    engendrarEmblem.scale.setScalar(1 + h * 0.04);
    goldenLight.intensity = colors.golden.intensity + h * 2.2;
    accentMat.emissiveIntensity = 0.04 + h * 0.22;
    goldMat.emissiveIntensity = h * 0.18;

    renderer.render(scene, camera);
  }
  animate();

  // ─────────────────────────── Responsivo ──────────────────────────────
  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", onResize);
}

// ─────────────────────── Helpers locais (módulo) ────────────────────────
/**
 * Cria um material com gradiente vertical usando Shader basico.
 * @param {typeof import('three')} THREE Instância do Three.js.
 * @param {number} colorTop Cor do topo.
 * @param {number} colorBottom Cor da base.
 * @returns {THREE.ShaderMaterial} Material gradiente.
 */
function makeGradientMaterial(THREE, colorTop, colorBottom) {
  return new THREE.ShaderMaterial({
    uniforms: {
      top: { value: new THREE.Color(colorTop) },
      bottom: { value: new THREE.Color(colorBottom) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 top;
      uniform vec3 bottom;
      varying vec2 vUv;
      void main() {
        vec3 c = mix(bottom, top, clamp(vUv.y, 0.0, 1.0));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
    depthWrite: false,
  });
}

/**
 * Define opacidade num objeto Three.js (ex.: GridHelper). O GridHelper expõe
 * dois LineBasicMaterial (centro/grid) próprios; basta torná-los transparentes.
 * @param {THREE.Object3D} obj Objeto.
 * @param {number} op Opacidade 0..1.
 */
function setOpacity(obj, op) {
  obj.traverse((child) => {
    if (!child.material) return;
    child.material.transparent = true;
    child.material.opacity = op;
  });
}
