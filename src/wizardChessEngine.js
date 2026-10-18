import * as THREE_NS from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

/** @type {any} */
const THREE = THREE_NS;
const SkeletonUtils = { clone: cloneSkeleton };

export function initWizardChess() {
    // =========================================================================
    // Constants & Board Coordinates
    // =========================================================================
    const BASE_GLB_PIECE_TYPES = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
    const PIECE_TYPES = [
      'pawn',
      'rook',
      'knight',
      'bishop',
      'queen',
      'king',
      'demon_rider',
      'archbishop',
      'chancellor',
      'wizard',
      'dragon'
    ];
    const PIECE_VALUES = {
      pawn: 100,
      knight: 320,
      bishop: 330,
      rook: 500,
      wizard: 680,
      archbishop: 740,
      dragon: 820,
      chancellor: 860,
      demon_rider: 890,
      queen: 900,
      king: 20000
    };
    const NEW_PIECE_INFO = {
      demon_rider: {
        id: 'demon_rider',
        name: 'Demon Rider',
        ruName: 'Всадник Демона',
        badge: '🔥🐎',
        baseType: 'knight',
        desc: 'Всадник Демона (Кавалерия Бездны): прыгает буквой «Г» как Конь И совершает огненный прорыв на 1–3 клетки в любом из 8 направлений.'
      },
      archbishop: {
        id: 'archbishop',
        name: 'Archbishop',
        ruName: 'Архиепископ',
        badge: '♗+♘',
        baseType: 'bishop',
        desc: 'Архиепископ (Слон + Конь): ходит по диагонали на любое число клеток или прыгает буквой «Г» через фигуры.'
      },
      chancellor: {
        id: 'chancellor',
        name: 'Chancellor',
        ruName: 'Канцлер',
        badge: '♖+♘',
        baseType: 'rook',
        desc: 'Канцлер (Ладья + Конь): ходит по вертикали и горизонтали или прыгает буквой «Г» через фигуры.'
      },
      wizard: {
        id: 'wizard',
        name: 'Wizard',
        ruName: 'Маг',
        badge: '✦',
        baseType: 'queen',
        desc: 'Маг (Телепорт): прыгает через фигуры на (3,1)/(1,3) или ровно на 2 клетки в любом направлении + шаг на 1 по диагонали.'
      },
      dragon: {
        id: 'dragon',
        name: 'Dragon',
        ruName: 'Дракон',
        badge: '🐉',
        baseType: 'knight',
        desc: 'Дракон (Высший змей): ходит как Ладья + Король, а также совершает крылатый прыжок на 2 клетки по диагонали.'
      },
      queen: {
        id: 'queen',
        name: 'Queen',
        ruName: 'Ферзь',
        badge: '♕',
        baseType: 'queen',
        desc: 'Ферзь (Обычная фигура): ходит на любое число клеток по вертикали, горизонтали и диагонали.'
      },
      knight: {
        id: 'knight',
        name: 'Knight',
        ruName: 'Конь',
        badge: '♘',
        baseType: 'knight',
        desc: 'Конь (Обычная фигура): прыгает буквой «Г» (2×1) через любые фигуры.'
      },
      rook: {
        id: 'rook',
        name: 'Rook',
        ruName: 'Ладья',
        badge: '♖',
        baseType: 'rook',
        desc: 'Ладья (Обычная фигура): ходит на любое число клеток по вертикали и горизонтали.'
      },
      bishop: {
        id: 'bishop',
        name: 'Bishop',
        ruName: 'Слон',
        badge: '♗',
        baseType: 'bishop',
        desc: 'Слон (Обычная фигура): ходит на любое число клеток по диагонали.'
      },
      pawn: {
        id: 'pawn',
        name: 'Pawn',
        ruName: 'Пешка',
        badge: '♙',
        baseType: 'pawn',
        desc: 'Пешка (Обычная фигура): ходит вперёд на 1 клетку (или 2 с начальной позиции) и бьёт по диагонали.'
      }
    };
    const ARMY_FORMATIONS = [
      {
        id: 'demons_legends',
        name: 'Demon Riders & Legends',
        ruLabel: 'Армия: Всадники Демонов + Легенды',
        backRow: ['chancellor', 'demon_rider', 'archbishop', 'queen', 'king', 'wizard', 'dragon', 'demon_rider']
      },
      {
        id: 'demons',
        name: 'Demon Riders Legion',
        ruLabel: 'Армия: Легион Всадников Демонов',
        backRow: ['demon_rider', 'dragon', 'demon_rider', 'queen', 'king', 'demon_rider', 'dragon', 'demon_rider']
      },
      {
        id: 'classic',
        name: 'Classic Chess',
        ruLabel: 'Армия: Обычные шахматы',
        backRow: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
      },
      {
        id: 'mythic',
        name: 'Mythic Order',
        ruLabel: 'Армия: Орден Магов',
        backRow: ['chancellor', 'dragon', 'archbishop', 'wizard', 'king', 'archbishop', 'dragon', 'chancellor']
      }
    ];
    const PIECE_VISUAL_STYLES = [
      { id: 'sanctum', ruLabel: 'Вид: Скульптуры и Демоны' },
      { id: 'classic_staunton', ruLabel: 'Вид: Обычные шахматы 3D' },
      { id: 'demon_legion', ruLabel: 'Вид: Все Всадники Демонов' }
    ];
    let currentArmyFormationIdx = 0;
    let currentVisualStyleIdx = 0;
    let selectedPromotionType = 'demon_rider';
    const BOARD_SQ_SIZE = 0.34;
    const BOARD_SURFACE_Y = 0.775;

    function boardToWorld(r, c) {
      return new THREE.Vector3(
        (c - 3.5) * BOARD_SQ_SIZE,
        BOARD_SURFACE_Y,
        (r - 3.5) * BOARD_SQ_SIZE
      );
    }

    function easeInOutCubic(x) {
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    function easeOutCubic(x) {
      return 1 - Math.pow(1 - x, 3);
    }

    // =========================================================================
    // Scene, Camera, Renderer, and Cathedral Lighting
    // =========================================================================
    const container = document.getElementById('canvas-container') || document.getElementById('viewport-container');
    if (container) container.innerHTML = '';
    const isAutomatedTest = Boolean(
      navigator.webdriver || new URLSearchParams(window.location.search).get('autotest') === '1'
    );
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: isAutomatedTest
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    scene.fog = new THREE.FogExp2(0x080b14, 0.015);

    // Self-contained Cathedral PMREM Environment (inspired by three-gpu-pathtracer & realism-effects)
    function createCathedralPMREMEnvironment(glRenderer) {
      const pmremGen = new THREE.PMREMGenerator(glRenderer);
      pmremGen.compileEquirectangularShader();
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x161412);
      const boxGeo = new THREE.BoxGeometry(1, 1, 1);
      const addPanel = (colorHex, intensity, pos, scl) => {
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorHex).multiplyScalar(intensity)
        });
        const m = new THREE.Mesh(boxGeo, mat);
        m.position.fromArray(pos);
        m.scale.fromArray(scl);
        envScene.add(m);
      };
      // Upper Gothic clerestory & Rose Window light panels
      addPanel(0xdce6f7, 2.4, [0, 9.5, -12.0], [10.0, 2.0, 1.5]);
      addPanel(0xffe0b5, 2.2, [0, 9.5, 12.0], [10.0, 2.0, 1.5]);
      addPanel(0xd4deee, 1.8, [-9.0, 6.5, 0.0], [1.2, 4.5, 16.0]);
      addPanel(0xd4deee, 1.8, [9.0, 6.5, 0.0], [1.2, 4.5, 16.0]);
      // Warm twin fire cauldron & limestone floor bounce panels
      addPanel(0xff9438, 3.2, [-4.5, 1.6, 0.0], [2.2, 2.2, 4.0]);
      addPanel(0xff9438, 3.2, [4.5, 1.6, 0.0], [2.2, 2.2, 4.0]);
      addPanel(0x6e5c49, 0.9, [0, -4.0, 0.0], [16.0, 1.0, 24.0]);
      const envTex = pmremGen.fromScene(envScene, 0.04).texture;
      boxGeo.dispose();
      pmremGen.dispose();
      return envTex;
    }

    scene.environment = createCathedralPMREMEnvironment(renderer);
    if ('environmentIntensity' in scene) {
      scene.environmentIntensity = 0.24;
    }

    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.22, 65);
    camera.position.set(0, 2.22, 2.72);

    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.16;
    orbitControls.maxPolarAngle = Math.PI * 0.88;
    orbitControls.minPolarAngle = 0.05;
    orbitControls.minDistance = 0.95;
    orbitControls.maxDistance = 36.0;
    orbitControls.target.set(0, 0.85, -0.15);
    orbitControls.update();

    // =========================================================================
    // Feature 5: Hold Shift + Mouse Drag (Left=Rotate, Right=Pan) Axis Lock (X or Y)
    // =========================================================================
    let isShiftKeyDown = false;
    const shiftDragState = {
      active: false,
      startX: 0,
      startY: 0,
      lockedAxis: null // 'x' | 'y' | null
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') isShiftKeyDown = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        isShiftKeyDown = false;
        shiftDragState.lockedAxis = null;
      }
    });

    // Capture pointerdown BEFORE OrbitControls so Shift+LeftClick stays ROTATE (instead of OrbitControls' default Shift->PAN swap)
    renderer.domElement.addEventListener(
      'pointerdown',
      (e) => {
        shiftDragState.active = true;
        shiftDragState.startX = e.clientX;
        shiftDragState.startY = e.clientY;
        shiftDragState.lockedAxis = null;
        if (e.shiftKey) {
          isShiftKeyDown = true;
          if (e.button === 0) {
            try {
              Object.defineProperty(e, 'shiftKey', {
                get: () => false,
                configurable: true
              });
            } catch (err) {}
          }
        }
      },
      { capture: true }
    );

    window.addEventListener('pointerup', () => {
      shiftDragState.active = false;
      shiftDragState.lockedAxis = null;
    });

    const origHandleMouseMoveRotate = orbitControls._handleMouseMoveRotate.bind(orbitControls);
    orbitControls._handleMouseMoveRotate = function (event) {
      if (event.shiftKey || isShiftKeyDown) {
        const dx = Math.abs(event.clientX - shiftDragState.startX);
        const dy = Math.abs(event.clientY - shiftDragState.startY);
        if (!shiftDragState.lockedAxis && (dx > 2 || dy > 2)) {
          shiftDragState.lockedAxis = dx >= dy ? 'x' : 'y';
        }
        if (shiftDragState.lockedAxis === 'x') {
          return origHandleMouseMoveRotate({
            clientX: event.clientX,
            clientY: this._rotateStart.y
          });
        } else if (shiftDragState.lockedAxis === 'y') {
          return origHandleMouseMoveRotate({
            clientX: this._rotateStart.x,
            clientY: event.clientY
          });
        }
      } else {
        shiftDragState.lockedAxis = null;
      }
      return origHandleMouseMoveRotate(event);
    };

    const origHandleMouseMovePan = orbitControls._handleMouseMovePan.bind(orbitControls);
    orbitControls._handleMouseMovePan = function (event) {
      if (event.shiftKey || isShiftKeyDown) {
        const dx = Math.abs(event.clientX - shiftDragState.startX);
        const dy = Math.abs(event.clientY - shiftDragState.startY);
        if (!shiftDragState.lockedAxis && (dx > 2 || dy > 2)) {
          shiftDragState.lockedAxis = dx >= dy ? 'x' : 'y';
        }
        if (shiftDragState.lockedAxis === 'x') {
          return origHandleMouseMovePan({
            clientX: event.clientX,
            clientY: this._panStart.y
          });
        } else if (shiftDragState.lockedAxis === 'y') {
          return origHandleMouseMovePan({
            clientX: this._panStart.x,
            clientY: event.clientY
          });
        }
      } else {
        shiftDragState.lockedAxis = null;
      }
      return origHandleMouseMovePan(event);
    };

    // Dramatic Chiaroscuro Cathedral & Board Lighting (restoring original-example 3D stone relief & warm firelight contrast)
    const hemiLight = new THREE.HemisphereLight(0xd8ccb8, 0x261d14, 0.62);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff0d6, 2.55);
    keyLight.position.set(3.8, 8.5, 4.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 22.0;
    const d = 3.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Subtle directional rim/fill (kept low so opposing directional lights never cancel normal-map mortar shadows)
    const rimLight = new THREE.DirectionalLight(0xd8cbb8, 0.72);
    rimLight.position.set(-4.5, 6.0, -6.5);
    scene.add(rimLight);

    const southFillLight = new THREE.DirectionalLight(0xffe4c0, 0.52);
    southFillLight.position.set(4.2, 5.8, 7.5);
    scene.add(southFillLight);

    // Twin Flickering Brazier Point Lights (centered at x = +/-3.65, z = 0.00; flanking column bounce is evaluated in shader)
    const brazierCoords = [
      { pos: [-3.65, 1.08, 0.00], baseIntensity: 4.35, dist: 18.0 },
      { pos: [3.65, 1.08, 0.00], baseIntensity: 4.35, dist: 18.0 }
    ];
    const brazierLights = [];
    for (const cfg of brazierCoords) {
      const pLight = new THREE.PointLight(0xff8e32, cfg.baseIntensity, cfg.dist, 1.40);
      pLight.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      pLight.userData.baseIntensity = cfg.baseIntensity;
      scene.add(pLight);
      brazierLights.push(pLight);
    }

    // Realistic Gaseous GLSL Brazier Flames & Soft Warm Firelight Glow (zero bouncing shapes)
    const brazierFireUniforms = [];
    const brazierGlowSprites = [];

    function createSoftGlowTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(128, 128, 2, 128, 128, 128);
      grad.addColorStop(0.0, 'rgba(255, 226, 155, 0.88)');
      grad.addColorStop(0.18, 'rgba(255, 154, 52, 0.50)');
      grad.addColorStop(0.45, 'rgba(255, 92, 16, 0.18)');
      grad.addColorStop(0.75, 'rgba(210, 48, 4, 0.04)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    // Strip the 14 tiny static icosphere spark balls baked above Opt8_Brazier_Flame_Mid (y > 1.26, height < 0.10)
    // while preserving 100% of the sculpted flame tongues (which start at y = 0.59..0.61)
    function stripIcosphereSparksFromFlameGeometry(geometry) {
      if (!geometry || !geometry.attributes || !geometry.attributes.position) return;
      const pos = geometry.attributes.position;
      if (geometry.index) {
        const idx = geometry.index.array;
        for (let i = 0; i < idx.length; i += 3) {
          const i0 = idx[i];
          const i1 = idx[i + 1];
          const i2 = idx[i + 2];
          const y0 = pos.getY(i0);
          const y1 = pos.getY(i1);
          const y2 = pos.getY(i2);
          const minY = Math.min(y0, y1, y2);
          if (minY > 1.25) {
            idx[i] = 0;
            idx[i + 1] = 0;
            idx[i + 2] = 0;
          }
        }
        geometry.index.needsUpdate = true;
      } else {
        for (let i = 0; i < pos.count; i += 3) {
          const y0 = pos.getY(i);
          const y1 = pos.getY(i + 1);
          const y2 = pos.getY(i + 2);
          if (Math.min(y0, y1, y2) > 1.25) {
            pos.setXYZ(i, 0, 0, 0);
            pos.setXYZ(i + 1, 0, 0, 0);
            pos.setXYZ(i + 2, 0, 0, 0);
          }
        }
        pos.needsUpdate = true;
      }
    }

    // =========================================================================
    // Cathedral Room Boundary Clamping (Floor, Ceiling, Side & End Walls)
    // & Solid Cylindrical Column Collision / Circumferential Sliding Solver
    // =========================================================================
    const CATHEDRAL_BOUNDS = {
      minX: -6.65,
      maxX: 6.65,
      minY: 0.34,
      maxY: 8.85,
      minZ: -18.10,
      maxZ: 18.10
    };

    // 12 freestanding columns spread wider across the nave; the 4 columns closest to the chessboard (z = +/-2.20)
    // have been removed to create a grand 13.70m open Atrium around the altar and centered fire braziers
    const CATHEDRAL_COLUMN_ROWS = [
      { z: -16.65, xAbs: 4.25 },
      { z: -11.85, xAbs: 4.25 },
      { z: -6.85,  xAbs: 4.65 },
      { z: 6.85,   xAbs: 4.65 },
      { z: 11.85,  xAbs: 4.25 },
      { z: 16.65,  xAbs: 4.25 }
    ];
    const CATHEDRAL_SOLID_PILLARS = [
      ...CATHEDRAL_COLUMN_ROWS.flatMap(({ z, xAbs }) => [
        { x: -xAbs, z, r: 0.86, maxY: 9.65, isColumn: true },
        { x: xAbs,  z, r: 0.86, maxY: 9.65, isColumn: true }
      ]),
      { x: -3.65, z: 0.00, r: 0.68, maxY: 1.95, isColumn: false },
      { x: 3.65,  z: 0.00, r: 0.68, maxY: 1.95, isColumn: false }
    ];

    function clampPointToCathedralRoom(pt, isTarget = false) {
      const margin = isTarget ? 0.15 : 0.0;
      pt.x = Math.max(CATHEDRAL_BOUNDS.minX - margin, Math.min(CATHEDRAL_BOUNDS.maxX + margin, pt.x));
      pt.z = Math.max(CATHEDRAL_BOUNDS.minZ - margin, Math.min(CATHEDRAL_BOUNDS.maxZ + margin, pt.z));
      // Account for the sloped side-aisle ceiling vault outside x = +/-4.15
      const aisleDrop = Math.max(0, Math.abs(pt.x) - 4.15) * 0.55;
      const localMaxY = Math.min(CATHEDRAL_BOUNDS.maxY, 9.05 - aisleDrop);
      const localMinY = isTarget ? 0.20 : CATHEDRAL_BOUNDS.minY;
      pt.y = Math.max(localMinY, Math.min(localMaxY, pt.y));
    }

    function enforceCathedralBoundsAndSolidColumns(prevPos, curPos, targetPos) {
      clampPointToCathedralRoom(targetPos, true);
      clampPointToCathedralRoom(curPos, false);

      if (isAnimatingMove) {
        if (Math.abs(curPos.x) < 2.48 && Math.abs(curPos.z) < 2.38) {
          curPos.y = Math.max(curPos.y, BOARD_SURFACE_Y + 0.30);
        }
        return;
      }

      const x0 = prevPos ? prevPos.x : curPos.x;
      const z0 = prevPos ? prevPos.z : curPos.z;
      let x1 = curPos.x;
      let z1 = curPos.z;
      const moveDx = x1 - x0;
      const moveDz = z1 - z0;
      const moveLenSq = moveDx * moveDx + moveDz * moveDz;
      const moveLen = Math.sqrt(moveLenSq);
      const isContinuousStep = Boolean(prevPos) && moveLen > 1e-5 && moveLen < 8.0;

      for (const p of CATHEDRAL_SOLID_PILLARS) {
        if (p.isColumn && typeof currentLocationIdx === 'number' && currentLocationIdx !== 0) {
          continue;
        }
        if (curPos.y > p.maxY) continue;

        let tClosest = 1.0;
        if (isContinuousStep) {
          tClosest = ((p.x - x0) * moveDx + (p.z - z0) * moveDz) / moveLenSq;
          tClosest = Math.max(0.0, Math.min(1.0, tClosest));
        }
        const cxSeg = x0 + moveDx * tClosest;
        const czSeg = z0 + moveDz * tClosest;
        const dSeg = isContinuousStep ? Math.hypot(cxSeg - p.x, czSeg - p.z) : Infinity;
        const dEnd = Math.hypot(x1 - p.x, z1 - p.z);

        if (dSeg < p.r || dEnd < p.r) {
          if (typeof window.__wizardChessTelemetry === 'object' && window.__wizardChessTelemetry && p.isColumn) {
            window.__wizardChessTelemetry.columnDeflections = (window.__wizardChessTelemetry.columnDeflections || 0) + 1;
          }

          if (isContinuousStep) {
            // Smooth tangential circumferential slide around the column
            const startAng = Math.atan2(z0 - p.z, x0 - p.x);
            const endAng = Math.atan2(z1 - p.z, x1 - p.x);
            let deltaAng = endAng - startAng;
            while (deltaAng > Math.PI) deltaAng -= Math.PI * 2;
            while (deltaAng < -Math.PI) deltaAng += Math.PI * 2;

            // Project step onto unit tangent at startAng; if pushing dead-on into column center, bias toward center aisle
            const tanX = -Math.sin(startAng);
            const tanZ = Math.cos(startAng);
            let tangMove = moveDx * tanX + moveDz * tanZ;
            if (Math.abs(tangMove) < moveLen * 0.18) {
              const aisleSign = (p.x >= 0 ? -1 : 1) * Math.sign(moveDz || 1);
              tangMove = (tangMove >= 0 ? 1 : aisleSign || 1) * moveLen * 0.65;
            }
            const arcStep = Math.sign(deltaAng || tangMove || 1) * Math.max(Math.abs(deltaAng), Math.min(Math.PI * 0.35, Math.abs(tangMove) / p.r));
            const newAng = startAng + arcStep;
            x1 = p.x + Math.cos(newAng) * p.r;
            z1 = p.z + Math.sin(newAng) * p.r;
          } else {
            const radX = x1 - p.x;
            const radZ = z1 - p.z;
            const radLen = Math.hypot(radX, radZ);
            if (radLen > 1e-4) {
              x1 = p.x + (radX / radLen) * p.r;
              z1 = p.z + (radZ / radLen) * p.r;
            } else {
              x1 = p.x + (p.x >= 0 ? -p.r : p.r);
              z1 = p.z;
            }
          }
        }
      }

      // Solid Black Marble Altar (4.40m x 4.20m slab + pedestal) & Chessboard collision
      // Prevents the camera from passing down through either the chessboard OR the surrounding black marble altar rim
      const ALTAR_TOP_Y = 0.722;
      const ALTAR_HALF_X = 2.48; // 2.22m black marble slab half-width + 0.26m camera frustum near-clip margin
      const ALTAR_HALF_Z = 2.38; // 2.12m black marble slab half-depth + 0.26m camera frustum near-clip margin
      const BOARD_HALF_XZ = 1.66;
      if (Math.abs(targetPos.x) < 2.36 && Math.abs(targetPos.z) < 2.26) {
        const minTargetY =
          Math.abs(targetPos.x) < 1.56 && Math.abs(targetPos.z) < 1.56
            ? BOARD_SURFACE_Y + 0.05
            : ALTAR_TOP_Y + 0.05;
        if (targetPos.y < minTargetY) {
          targetPos.y = minTargetY;
        }
      }
      if (Math.abs(x1) < ALTAR_HALF_X && Math.abs(z1) < ALTAR_HALF_Z) {
        const isOverChessboard = Math.abs(x1) < BOARD_HALF_XZ && Math.abs(z1) < BOARD_HALF_XZ;
        const solidAltarTopY = isOverChessboard ? (BOARD_SURFACE_Y + 0.25) : (ALTAR_TOP_Y + 0.28); // 1.035m on board, 1.002m on black marble altar
        if (curPos.y < solidAltarTopY) {
          const wasInsideAltarFootprint =
            Boolean(prevPos) &&
            Math.abs(x0) < ALTAR_HALF_X - 0.005 &&
            Math.abs(z0) < ALTAR_HALF_Z - 0.005;
          const wasAboveAltarSlab =
            wasInsideAltarFootprint ||
            (Boolean(prevPos) && prevPos.y >= ALTAR_TOP_Y - 0.04) ||
            curPos.y >= ALTAR_TOP_Y - 0.10;
          if (wasAboveAltarSlab) {
            curPos.y = Math.max(curPos.y, solidAltarTopY);
          } else {
            const penX = ALTAR_HALF_X - Math.abs(x1);
            const penZ = ALTAR_HALF_Z - Math.abs(z1);
            if (penX < penZ) {
              x1 = (x1 >= 0 ? 1 : -1) * ALTAR_HALF_X;
            } else {
              z1 = (z1 >= 0 ? 1 : -1) * ALTAR_HALF_Z;
            }
          }
        }
      }

      // Solid Marble & Obsidian Chess Pieces collision during manual camera movement
      // (Bypassed when isAnimatingMove is true so automated duel/attack camera choreography never gets pinned between statues)
      if (
        !isAnimatingMove &&
        curPos.y < BOARD_SURFACE_Y + 0.85 &&
        typeof boardState === 'object' &&
        Array.isArray(boardState)
      ) {
        const pieceRad = 0.185;
        for (let r = 0; r < 8; r++) {
          const row = boardState[r];
          if (!row) continue;
          for (let c = 0; c < 8; c++) {
            const pc = row[c];
            if (!pc || !pc.mesh || !pc.mesh.parent) continue;
            const px = pc.mesh.position.x;
            const pz = pc.mesh.position.z;
            const pieceH = (typeof PIECE_HEIGHTS === 'object' && PIECE_HEIGHTS[pc.type]) ? PIECE_HEIGHTS[pc.type] : 0.42;
            const pieceTopY = pc.mesh.position.y + pieceH + 0.10;
            if (curPos.y >= pieceTopY) continue;

            let tPiece = 1.0;
            if (isContinuousStep) {
              tPiece = ((px - x0) * moveDx + (pz - z0) * moveDz) / moveLenSq;
              tPiece = Math.max(0.0, Math.min(1.0, tPiece));
            }
            const cxP = x0 + moveDx * tPiece;
            const czP = z0 + moveDz * tPiece;
            const dSegP = isContinuousStep ? Math.hypot(cxP - px, czP - pz) : Infinity;
            const dEndP = Math.hypot(x1 - px, z1 - pz);

            if (dSegP < pieceRad || dEndP < pieceRad) {
              if (
                prevPos &&
                prevPos.y >= pieceTopY - 0.08 &&
                Math.hypot(x0 - px, z0 - pz) < pieceRad * 0.85
              ) {
                curPos.y = Math.max(curPos.y, pieceTopY);
              } else {
                const radX = x1 - px;
                const radZ = z1 - pz;
                const radLen = Math.hypot(radX, radZ);
                if (radLen > 1e-4) {
                  x1 = px + (radX / radLen) * pieceRad;
                  z1 = pz + (radZ / radLen) * pieceRad;
                } else {
                  x1 = px + pieceRad;
                }
              }
            }
          }
        }
      }

      curPos.x = x1;
      curPos.z = z1;
      clampPointToCathedralRoom(curPos, false);

      // Update minimum column clearance telemetry across all 12 freestanding columns
      if (typeof window.__wizardChessTelemetry === 'object' && window.__wizardChessTelemetry) {
        let minClear = Infinity;
        for (const p of CATHEDRAL_SOLID_PILLARS) {
          if (!p.isColumn) continue;
          const d = Math.hypot(curPos.x - p.x, curPos.z - p.z);
          if (d < minClear) minClear = d;
        }
        window.__wizardChessTelemetry.lastColumnClearance = Number(minClear.toFixed(3));
        if (
          window.__wizardChessTelemetry.minColumnClearance === undefined ||
          minClear < window.__wizardChessTelemetry.minColumnClearance
        ) {
          window.__wizardChessTelemetry.minColumnClearance = Number(minClear.toFixed(3));
        }
      }
    }

    function createSculptedFlameTongueShader(cfg) {
      const uniforms = {
        uTime: { value: 0 },
        uZMin: { value: cfg.zMin },
        uZMax: { value: cfg.zMax },
        uLayerSeed: { value: cfg.layerSeed },
        uStrength: { value: cfg.strength },
        uOpacity: { value: cfg.opacity },
        uBaseColor: { value: new THREE.Color(...cfg.baseColor) },
        uMidColor: { value: new THREE.Color(...cfg.midColor) },
        uTipColor: { value: new THREE.Color(...cfg.tipColor) }
      };
      brazierFireUniforms.push(uniforms);

      return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          uniform float uTime;
          uniform float uZMin;
          uniform float uZMax;
          uniform float uLayerSeed;
          varying vec3 vLocalPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          varying float vHeightNorm;

          void main() {
            vec3 pos = position;
            float h = clamp((pos.y - uZMin) / max(0.01, uZMax - uZMin), 0.0, 1.0);
            vHeightNorm = h;

            // Each brazier is centered at X = +/- 3.65, Z = 0.65 in local mesh space (world Z = 0.00)
            vec2 bCenter = vec2(sign(pos.x) * 3.65, 0.65);
            vec2 relXZ = vec2(pos.x, pos.z) - bCenter;

            // Distinct phase per sculpted tongue & fire layer so all 27 tongues dance independently
            float tonguePhase = relXZ.x * 14.0 + relXZ.y * 12.0 + uLayerSeed * 1.9;
            float sway = pow(h, 1.05);

            // Multi-frequency upward-propagating lateral flame wave (pinned at h = 0 in the logs)
            float waveX = sin(pos.y * 4.6 - uTime * 6.4 + tonguePhase) * 0.088
                        + cos(pos.y * 8.2 - uTime * 9.8 + tonguePhase * 1.35) * 0.048;
            float waveZ = cos(pos.y * 4.3 - uTime * 5.9 + tonguePhase * 1.15) * 0.088
                        + sin(pos.y * 7.8 - uTime * 9.1 + tonguePhase * 0.85) * 0.048;

            // Swirling thermal vortex twist + radial breathing around each brazier bowl
            float twistAngle = sin(uTime * 4.2 + pos.y * 4.5 + uLayerSeed) * 0.30 * sway;
            float cA = cos(twistAngle);
            float sA = sin(twistAngle);
            vec2 twistedXZ = vec2(relXZ.x * cA - relXZ.y * sA, relXZ.x * sA + relXZ.y * cA);
            float radialPulse = 1.0 + sin(uTime * 5.2 - h * 4.0 + tonguePhase) * 0.14 * sway;

            pos.x = bCenter.x + twistedXZ.x * radialPulse + waveX * sway;
            pos.z = bCenter.y + twistedXZ.y * radialPulse + waveZ * sway;

            // Active vertical flame-tongue licking (base h = 0 stays strictly anchored at uZMin)
            float lickStretch = 1.0 + (
              sin(uTime * 5.8 + tonguePhase * 1.3) * 0.22 +
              cos(uTime * 9.2 - tonguePhase * 0.9) * 0.12
            ) * smoothstep(0.05, 0.85, h);
            pos.y = uZMin + (pos.y - uZMin) * lickStretch;

            vLocalPos = pos;
            vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
            vWorldPos = worldPosition.xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uZMin;
          uniform float uZMax;
          uniform float uLayerSeed;
          uniform float uStrength;
          uniform float uOpacity;
          uniform vec3 uBaseColor;
          uniform vec3 uMidColor;
          uniform vec3 uTipColor;
          varying vec3 vLocalPos;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          varying float vHeightNorm;

          float hash3(vec3 p) {
            p = fract(p * vec3(443.897, 441.423, 437.195));
            p += dot(p, p.yzx + 19.19);
            return fract((p.x + p.y) * p.z);
          }

          float noise3(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(
                mix(hash3(i + vec3(0.0, 0.0, 0.0)), hash3(i + vec3(1.0, 0.0, 0.0)), f.x),
                mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x),
                f.y
              ),
              mix(
                mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x),
                mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x),
                f.y
              ),
              f.z
            );
          }

          void main() {
            float h = clamp(vHeightNorm, 0.0, 1.0);
            vec3 V = normalize(cameraPosition - vWorldPos);
            vec3 N = normalize(vWorldNormal);

            // Real-time port of Cycles LayerWeight.Facing^2.4 gaseous feathering
            float facing = clamp(abs(dot(N, V)), 0.0, 1.0);
            float powFacing = pow(facing, 2.25);

            // Fast upward-convecting 3D flame turbulence that actively carves the flame tips
            float n1 = noise3(vec3(vLocalPos.x * 5.4, vLocalPos.y * 4.8 - uTime * 6.8, vLocalPos.z * 5.4 + uLayerSeed));
            float n2 = noise3(vec3(vLocalPos.x * 10.2 + 1.9, vLocalPos.y * 8.5 - uTime * 10.5, vLocalPos.z * 10.2 - uLayerSeed));
            float shimmer = mix(n1, n2, 0.45);

            // Dynamic tip erosion so flame tongues visibly lick up and recede
            float erodedH = clamp(h + (shimmer - 0.48) * 0.42 * smoothstep(0.08, 0.85, h), 0.0, 1.0);

            // Combine eroded height and (1.0 - facing) so grazing edges shift toward fiery orange-crimson
            float heatCoord = clamp(erodedH + (1.0 - facing) * 0.36 + (shimmer - 0.5) * 0.22, 0.0, 1.0);
            vec3 col = mix(uBaseColor, uMidColor, smoothstep(0.0, 0.45, heatCoord));
            col = mix(col, uTipColor, smoothstep(0.45, 0.90, heatCoord));

            float zAlpha = mix(0.96, 0.72, smoothstep(0.0, 0.68, erodedH)) * (1.0 - smoothstep(0.64, 0.98, erodedH));
            float baseSoft = smoothstep(0.0, 0.06, h);
            float flickerPulse = 0.76 + 0.48 * shimmer;
            float alpha = clamp(zAlpha * baseSoft * powFacing * uOpacity * flickerPulse, 0.0, 1.0);
            if (alpha < 0.004) discard;

            gl_FragColor = vec4(col * uStrength, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
    }

    function createCharredEmberLogsShader() {
      const uniforms = {
        uTime: { value: 0 }
      };
      brazierFireUniforms.push(uniforms);

      return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          varying vec3 vLocalPos;
          varying vec3 vWorldNormal;
          void main() {
            vLocalPos = position;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vLocalPos;
          varying vec3 vWorldNormal;

          float hash3(vec3 p) {
            p = fract(p * vec3(443.897, 441.423, 437.195));
            p += dot(p, p.yzx + 19.19);
            return fract((p.x + p.y) * p.z);
          }

          float noise3(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(
                mix(hash3(i + vec3(0.0, 0.0, 0.0)), hash3(i + vec3(1.0, 0.0, 0.0)), f.x),
                mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x),
                f.y
              ),
              mix(
                mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x),
                mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x),
                f.y
              ),
              f.z
            );
          }

          void main() {
            // Dark charred timber bark (#0B0807) fissured with glowing incandescent 2200K orange cracks & glowing coal bed base
            float nCrack = noise3(vLocalPos * 18.0);
            float nFine = noise3(vLocalPos * 38.0 + vec3(0.0, uTime * 0.25, 0.0));
            float pulse = 0.88 + 0.12 * sin(uTime * 2.3 + vLocalPos.x * 4.0 + vLocalPos.z * 4.0);

            // Lower coal cone (y < 0.59) vs upper charred logs (y >= 0.59)
            float isCoalBed = 1.0 - smoothstep(0.56, 0.61, vLocalPos.y);
            float crackMask = smoothstep(0.68, 0.88, nCrack * 0.7 + nFine * 0.3);
            float underGlow = clamp(-vWorldNormal.y * 0.45 + 0.35, 0.0, 1.0) * smoothstep(0.72, 0.56, vLocalPos.y);

            vec3 charBark = vec3(0.035, 0.025, 0.020);
            vec3 emberOrange = vec3(1.0, 0.36, 0.04) * 1.45 * pulse;
            vec3 hotCoal = vec3(1.0, 0.58, 0.12) * 1.65 * pulse;

            float emberWeight = clamp(isCoalBed * (0.45 + 0.55 * nFine) + crackMask * 0.85 + underGlow * 0.45, 0.0, 1.0);
            vec3 col = mix(charBark, emberOrange, emberWeight);
            col = mix(col, hotCoal, smoothstep(0.72, 0.96, emberWeight));

            gl_FragColor = vec4(col, 1.0);
          }
        `
      });
    }

    function createBrazierWarmGlowHalos() {
      const glowTex = createSoftGlowTexture();
      const brazierCenters = [
        { x: -3.65, y: 0.56, z: 0.00, seed: 1.3 },
        { x: 3.65, y: 0.56, z: 0.00, seed: 5.8 }
      ];

      for (const b of brazierCenters) {
        // Layer 1: Inner warm hearth core glow halo centered in the flame body
        const coreGlowMat = new THREE.SpriteMaterial({
          map: glowTex,
          color: 0xffb866,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        const coreSprite = new THREE.Sprite(coreGlowMat);
        coreSprite.position.set(b.x, b.y + 0.28, b.z);
        coreSprite.scale.set(1.15, 1.25, 1.0);
        coreSprite.userData = { baseOpacity: 0.42, seed: b.seed };
        scene.add(coreSprite);
        brazierGlowSprites.push(coreSprite);

        // Layer 2: Wide, soft atmospheric warm glow halo bathing the surrounding air & ironwork
        const haloGlowMat = new THREE.SpriteMaterial({
          map: glowTex,
          color: 0xff8524,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        const haloSprite = new THREE.Sprite(haloGlowMat);
        haloSprite.position.set(b.x, b.y + 0.38, b.z);
        haloSprite.scale.set(2.45, 2.30, 1.0);
        haloSprite.userData = { baseOpacity: 0.28, seed: b.seed + 2.1 };
        scene.add(haloSprite);
        brazierGlowSprites.push(haloSprite);
      }
    }

    createBrazierWarmGlowHalos();

    // Consolidated Window Point Lights (4 side-aisle + 2 end-wall lights instead of 22 separate PointLights;
    // fine local window & column raking relief is evaluated analytically in applyCathedralStoneRealismShader)
    const sideWinLights = [];
    for (const wz of [-8.8, 8.2]) {
      for (const sideSign of [-1, 1]) {
        const winLight = new THREE.PointLight(0x90beff, 4.2, 16.5, 1.35);
        winLight.position.set(sideSign * 5.3, 4.1, wz);
        scene.add(winLight);
        sideWinLights.push(winLight);
      }
    }
    const northWinLight = new THREE.PointLight(0x9bc4ff, 6.4, 20.0, 1.30);
    northWinLight.position.set(0, 5.2, -18.2);
    scene.add(northWinLight);

    const southWinLight = new THREE.PointLight(0xffb85c, 6.4, 20.0, 1.30);
    southWinLight.position.set(0, 5.2, 18.2);
    scene.add(southWinLight);

    // Impact Flash Light (kept visible=true with intensity=0 when idle so Three.js never recompiles shaders mid-attack!)
    const impactFlashLight = new THREE.PointLight(0xffb74d, 0, 6.0, 1.5);
    impactFlashLight.visible = true;
    scene.add(impactFlashLight);

    // =========================================================================
    // Materials for White & Black Sculpted Stone Chess Pieces
    // =========================================================================
    const whitePieceMat = new THREE.MeshStandardMaterial({
      color: 0xe6dfd0,
      roughness: 0.34,
      metalness: 0.06
    });

    const blackPieceMat = new THREE.MeshStandardMaterial({
      color: 0x222630,
      roughness: 0.28,
      metalness: 0.24
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.26,
      metalness: 0.86
    });

    const forgedSteelMat = new THREE.MeshStandardMaterial({
      color: 0xdce4ee,
      roughness: 0.20,
      metalness: 0.88,
      emissive: 0x222832,
      emissiveIntensity: 0.25
    });

    // Special PBR Materials for the 4 New Sanctum Chess Piece Types
    const specialPieceMats = {
      archbishop_w: new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.26, metalness: 0.14 }),
      archbishop_b: new THREE.MeshStandardMaterial({ color: 0x1d182b, roughness: 0.24, metalness: 0.32 }),
      archbishop_gem_w: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.12,
        metalness: 0.25,
        emissive: 0x0284c7,
        emissiveIntensity: 0.85
      }),
      archbishop_gem_b: new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        roughness: 0.12,
        metalness: 0.25,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.90
      }),
      chancellor_w: new THREE.MeshStandardMaterial({ color: 0xede2d0, roughness: 0.30, metalness: 0.18 }),
      chancellor_b: new THREE.MeshStandardMaterial({ color: 0x241a1d, roughness: 0.25, metalness: 0.36 }),
      chancellor_gem_w: new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        roughness: 0.16,
        metalness: 0.30,
        emissive: 0xbe123c,
        emissiveIntensity: 0.80
      }),
      chancellor_gem_b: new THREE.MeshStandardMaterial({
        color: 0xfb7185,
        roughness: 0.16,
        metalness: 0.30,
        emissive: 0xe11d48,
        emissiveIntensity: 0.90
      }),
      wizard_w: new THREE.MeshStandardMaterial({ color: 0xe4f1f6, roughness: 0.24, metalness: 0.16 }),
      wizard_b: new THREE.MeshStandardMaterial({ color: 0x141b2d, roughness: 0.22, metalness: 0.34 }),
      wizard_gem_w: new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        roughness: 0.10,
        metalness: 0.20,
        emissive: 0x0891b2,
        emissiveIntensity: 1.10
      }),
      wizard_gem_b: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.10,
        metalness: 0.20,
        emissive: 0x0284c7,
        emissiveIntensity: 1.15
      }),
      dragon_w: new THREE.MeshStandardMaterial({ color: 0xf4e9dc, roughness: 0.28, metalness: 0.16 }),
      dragon_b: new THREE.MeshStandardMaterial({ color: 0x1f1613, roughness: 0.24, metalness: 0.32 }),
      dragon_gem_w: new THREE.MeshStandardMaterial({
        color: 0xff7b00,
        roughness: 0.14,
        metalness: 0.22,
        emissive: 0xea580c,
        emissiveIntensity: 1.05
      }),
      dragon_gem_b: new THREE.MeshStandardMaterial({
        color: 0xff4500,
        roughness: 0.14,
        metalness: 0.22,
        emissive: 0xdc2626,
        emissiveIntensity: 1.15
      }),
      demon_rider_w: new THREE.MeshStandardMaterial({
        color: 0xead4ce,
        roughness: 0.25,
        metalness: 0.22,
        emissive: 0x3b0a0a,
        emissiveIntensity: 0.22
      }),
      demon_rider_b: new THREE.MeshStandardMaterial({
        color: 0x160c0e,
        roughness: 0.22,
        metalness: 0.42,
        emissive: 0x450a0a,
        emissiveIntensity: 0.35
      }),
      demon_rider_gem_w: new THREE.MeshStandardMaterial({
        color: 0xff2a00,
        roughness: 0.12,
        metalness: 0.28,
        emissive: 0xff1e00,
        emissiveIntensity: 1.45
      }),
      demon_rider_gem_b: new THREE.MeshStandardMaterial({
        color: 0xff1100,
        roughness: 0.10,
        metalness: 0.30,
        emissive: 0xff0022,
        emissiveIntensity: 1.65
      }),
      hellsteel: new THREE.MeshStandardMaterial({
        color: 0x2a181c,
        roughness: 0.22,
        metalness: 0.88,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.55
      }),
      staunton_w: new THREE.MeshStandardMaterial({
        color: 0xf4ead5,
        roughness: 0.22,
        metalness: 0.05
      }),
      staunton_b: new THREE.MeshStandardMaterial({
        color: 0x1a1817,
        roughness: 0.18,
        metalness: 0.15
      })
    };

    // Sculpted 3D Classic Staunton Chess Set Generator (for "Обычные фигуры шахмат" 3D visual mode)
    function buildClassicStauntonPieceMesh(type, color) {
      const group = new THREE.Group();
      const mainMat = color === 'w' ? specialPieceMats.staunton_w : specialPieceMats.staunton_b;
      const accentMat =
        type === 'demon_rider'
          ? specialPieceMats[`demon_rider_gem_${color}`]
          : goldTrimMat;

      const heightScaleMap = {
        pawn: 0.78,
        rook: 0.92,
        knight: 0.98,
        bishop: 1.02,
        queen: 1.14,
        king: 1.24,
        archbishop: 1.08,
        chancellor: 1.06,
        wizard: 1.12,
        dragon: 1.10,
        demon_rider: 1.15
      };
      const hMul = heightScaleMap[type] || 1.0;

      // Turned Staunton Pedestal & Baluster Column (LatheGeometry)
      const lathePts = [
        new THREE.Vector2(0.001, 0.00),
        new THREE.Vector2(0.39, 0.00),
        new THREE.Vector2(0.39, 0.06),
        new THREE.Vector2(0.34, 0.11),
        new THREE.Vector2(0.36, 0.15),
        new THREE.Vector2(0.27, 0.24),
        new THREE.Vector2(0.19, 0.52 * hMul),
        new THREE.Vector2(0.16, 0.78 * hMul),
        new THREE.Vector2(0.24, 0.84 * hMul),
        new THREE.Vector2(0.18, 0.90 * hMul),
        new THREE.Vector2(0.001, 0.92 * hMul)
      ];
      const bodyGeo = new THREE.LatheGeometry(lathePts, 32);
      const bodyMesh = new THREE.Mesh(bodyGeo, mainMat);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      group.add(bodyMesh);

      // Golden / Brass Collar Ring
      const collarRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.21, 0.022, 12, 32),
        accentMat
      );
      collarRing.rotation.x = Math.PI / 2;
      collarRing.position.y = 0.84 * hMul;
      group.add(collarRing);

      const topY = 0.92 * hMul;

      if (type === 'pawn') {
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), mainMat);
        head.position.y = topY + 0.14;
        head.castShadow = true;
        group.add(head);
      } else if (type === 'rook' || type === 'chancellor') {
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.20, 0.24, 16), mainMat);
        turret.position.y = topY + 0.10;
        turret.castShadow = true;
        group.add(turret);
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.07), mainMat);
          merlon.position.set(Math.cos(ang) * 0.16, topY + 0.25, Math.sin(ang) * 0.16);
          group.add(merlon);
        }
        if (type === 'chancellor') {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 8), accentMat);
          spike.position.y = topY + 0.32;
          group.add(spike);
        }
      } else if (type === 'knight' || type === 'dragon' || type === 'demon_rider') {
        // Carved Staunton Horse / Steed Head Profile
        const steedShape = new THREE.Shape();
        steedShape.moveTo(-0.14, 0);
        steedShape.quadraticCurveTo(-0.20, 0.22, -0.08, 0.42);
        steedShape.lineTo(-0.02, 0.50);
        steedShape.lineTo(0.06, 0.42);
        steedShape.quadraticCurveTo(0.24, 0.36, 0.22, 0.22);
        steedShape.lineTo(0.08, 0.16);
        steedShape.quadraticCurveTo(0.14, 0.06, 0.12, 0);
        steedShape.closePath();

        const steedGeo = new THREE.ExtrudeGeometry(steedShape, {
          steps: 1,
          depth: 0.14,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.03,
          bevelSegments: 3
        });
        steedGeo.center();
        const steedMesh = new THREE.Mesh(steedGeo, mainMat);
        steedMesh.rotation.y = Math.PI / 2;
        steedMesh.position.set(0, topY + 0.22, 0.02);
        steedMesh.castShadow = true;
        group.add(steedMesh);

        if (type === 'demon_rider' || type === 'dragon') {
          for (const side of [-1, 1]) {
            const hornCurve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(side * 0.07, topY + 0.36, 0.02),
              new THREE.Vector3(side * 0.18, topY + 0.50, -0.08),
              new THREE.Vector3(side * 0.14, topY + 0.62, 0.10)
            ]);
            const horn = new THREE.Mesh(new THREE.TubeGeometry(hornCurve, 12, 0.025, 8, false), accentMat);
            group.add(horn);
          }
        }
      } else if (type === 'bishop' || type === 'archbishop') {
        const mitre = new THREE.Mesh(new THREE.SphereGeometry(0.20, 24, 24), mainMat);
        mitre.scale.set(0.88, 1.35, 0.88);
        mitre.position.y = topY + 0.18;
        mitre.castShadow = true;
        group.add(mitre);
        const pip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), accentMat);
        pip.position.y = topY + 0.46;
        group.add(pip);
        if (type === 'archbishop') {
          const halo = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 10, 28), accentMat);
          halo.position.set(0, topY + 0.26, -0.06);
          group.add(halo);
        }
      } else if (type === 'queen' || type === 'wizard') {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 24), mainMat);
        dome.position.y = topY + 0.14;
        group.add(dome);
        const coronet = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.14, 12), accentMat);
        coronet.position.y = topY + 0.24;
        group.add(coronet);
        if (type === 'wizard') {
          const spire = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.36, 16), mainMat);
          spire.position.y = topY + 0.42;
          group.add(spire);
        }
      } else if (type === 'king') {
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.17, 0.22, 16), mainMat);
        crown.position.y = topY + 0.12;
        group.add(crown);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.05), accentMat);
        crossV.position.y = topY + 0.34;
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), accentMat);
        crossH.position.y = topY + 0.36;
        group.add(crossV, crossH);
      }

      return group;
    }

    const dynamicPieceRegalia = [];

    function buildSculptedNewPieceRegalia(type, color) {
      const upperGroup = new THREE.Group();
      const baseGroup = new THREE.Group();
      const animRefs = { type, astrolabes: [], floatingOrb: null, wings: [], halo: null };
      const stoneMat = specialPieceMats[`${type}_${color}`] || (color === 'w' ? whitePieceMat : blackPieceMat);
      const gemMat = specialPieceMats[`${type}_gem_${color}`] || goldTrimMat;

      // Shared pedestal runic collar ring so every new piece has an unmistakable gilded base rim
      const baseRingGeo = new THREE.TorusGeometry(0.41, 0.026, 12, 32);
      baseRingGeo.rotateX(Math.PI / 2);
      const baseRing = new THREE.Mesh(baseRingGeo, goldTrimMat);
      baseRing.position.set(0, 0.045, 0);
      baseRing.castShadow = true;
      baseGroup.add(baseRing);

      if (type === 'archbishop') {
        // 1. Sculpted Seraphim Wings (Left & Right Extruded Gothic Feather Blades)
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.quadraticCurveTo(0.18, 0.26, 0.42, 0.48);
        wingShape.quadraticCurveTo(0.32, 0.22, 0.36, 0.14);
        wingShape.quadraticCurveTo(0.24, 0.08, 0.28, -0.04);
        wingShape.quadraticCurveTo(0.15, -0.06, 0.18, -0.18);
        wingShape.quadraticCurveTo(0.06, -0.12, 0, -0.08);
        wingShape.closePath();

        const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
          steps: 1,
          depth: 0.028,
          bevelEnabled: true,
          bevelThickness: 0.012,
          bevelSize: 0.012,
          bevelSegments: 2
        });

        for (const side of [-1, 1]) {
          const wingPivot = new THREE.Group();
          wingPivot.position.set(side * 0.14, 0.94, -0.12);
          const wingMesh = new THREE.Mesh(wingGeo, goldTrimMat);
          if (side < 0) {
            wingMesh.scale.set(-1, 1, 1);
          }
          wingMesh.rotation.set(0.15, side * -0.38, side * 0.12);
          wingMesh.castShadow = true;
          wingPivot.add(wingMesh);

          // Secondary stone inner pinion feather
          const innerWing = new THREE.Mesh(wingGeo, stoneMat);
          innerWing.scale.set(side * 0.68, 0.72, 0.85);
          innerWing.position.set(side * 0.03, -0.04, 0.02);
          innerWing.rotation.set(0.12, side * -0.28, side * 0.08);
          innerWing.castShadow = true;
          wingPivot.add(innerWing);

          upperGroup.add(wingPivot);
          animRefs.wings.push({ pivot: wingPivot, side, baseRotY: 0 });
        }

        // 2. Floating Radiant Papal Halo + Cross Finial behind the Mitre
        const haloGroup = new THREE.Group();
        haloGroup.position.set(0, 1.36, -0.09);
        const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.020, 14, 40), goldTrimMat);
        haloRing.castShadow = true;
        haloGroup.add(haloRing);

        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.52, 0.026), goldTrimMat);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.036, 0.026), goldTrimMat);
        crossH.position.y = 0.06;
        haloGroup.add(crossV, crossH);

        const crownGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), gemMat);
        crownGem.position.set(0, 0.24, 0.08);
        haloGroup.add(crownGem);

        upperGroup.add(haloGroup);
        animRefs.halo = haloGroup;
      } else if (type === 'chancellor') {
        // 1. Twin Imperial Forged Steel Halberds flanking the armored Rook shoulders
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, -0.14);
        bladeShape.quadraticCurveTo(0.20, -0.08, 0.24, 0.16);
        bladeShape.quadraticCurveTo(0.12, 0.06, 0.08, 0.22);
        bladeShape.lineTo(0, 0.12);
        bladeShape.closePath();

        const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
          steps: 1,
          depth: 0.022,
          bevelEnabled: true,
          bevelThickness: 0.008,
          bevelSize: 0.008,
          bevelSegments: 2
        });

        const shaftGeo = new THREE.CylinderGeometry(0.022, 0.025, 1.38, 12);
        const spikeGeo = new THREE.ConeGeometry(0.038, 0.24, 8);
        const pauldronGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.16, 8);

        for (const side of [-1, 1]) {
          // Heavy Spiked Fortress Pauldron
          const pauldron = new THREE.Mesh(pauldronGeo, goldTrimMat);
          pauldron.position.set(side * 0.23, 0.98, 0.02);
          pauldron.rotation.z = side * -0.42;
          pauldron.castShadow = true;
          upperGroup.add(pauldron);

          // Twin Halberd Polearm
          const halberd = new THREE.Group();
          halberd.position.set(side * 0.28, 0.82, 0.12);
          halberd.rotation.set(0.14, 0, side * -0.08);

          const shaft = new THREE.Mesh(shaftGeo, goldTrimMat);
          shaft.castShadow = true;
          halberd.add(shaft);

          const spike = new THREE.Mesh(spikeGeo, forgedSteelMat);
          spike.position.y = 0.78;
          halberd.add(spike);

          const axeBlade = new THREE.Mesh(bladeGeo, forgedSteelMat);
          axeBlade.position.set(0, 0.50, -0.01);
          axeBlade.rotation.y = side > 0 ? -Math.PI * 0.35 : Math.PI * 1.35;
          axeBlade.castShadow = true;
          halberd.add(axeBlade);

          upperGroup.add(halberd);
        }

        // 2. Imperial War-Crest & Crimson Ruby Standard on the Crown
        const crestGroup = new THREE.Group();
        crestGroup.position.set(0, 1.40, 0.02);
        const crestPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.11, 8), goldTrimMat);
        const crestGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), gemMat);
        crestGem.position.y = 0.14;
        const crestArc = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 10, 24, Math.PI), goldTrimMat);
        crestArc.position.y = 0.06;
        crestGroup.add(crestPlinth, crestGem, crestArc);
        upperGroup.add(crestGroup);
        animRefs.halo = crestGem;
      } else if (type === 'wizard') {
        // 1. Sculpted Archmage Pointed Spire Hat (LatheGeometry curved brim + conical spire)
        const hatPoints = [
          new THREE.Vector2(0.001, 0.38),
          new THREE.Vector2(0.035, 0.26),
          new THREE.Vector2(0.085, 0.12),
          new THREE.Vector2(0.145, 0.03),
          new THREE.Vector2(0.285, 0.00),
          new THREE.Vector2(0.295, -0.02),
          new THREE.Vector2(0.120, -0.03)
        ];
        const hatGeo = new THREE.LatheGeometry(hatPoints, 28);
        const hatGroup = new THREE.Group();
        hatGroup.position.set(0, 1.48, -0.01);
        const hatMesh = new THREE.Mesh(hatGeo, stoneMat);
        hatMesh.rotation.x = -0.14;
        hatMesh.castShadow = true;
        hatGroup.add(hatMesh);

        const hatBand = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.022, 12, 32), goldTrimMat);
        hatBand.rotation.x = Math.PI / 2 - 0.14;
        hatBand.position.y = 0.025;
        hatGroup.add(hatBand);
        upperGroup.add(hatGroup);

        // 2. Dual Intersecting Orbiting Astrolabe Rings around the Archmage
        const astro1 = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.016, 12, 48), goldTrimMat);
        astro1.position.set(0, 1.08, 0);
        astro1.rotation.set(0.55, 0.25, 0.35);
        upperGroup.add(astro1);

        const astro2 = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.014, 12, 48), gemMat);
        astro2.position.set(0, 1.08, 0);
        astro2.rotation.set(-0.48, 0.40, -0.52);
        upperGroup.add(astro2);
        animRefs.astrolabes.push(astro1, astro2);

        // 3. Levitating Arcane Crystal Focus Orb + Mini Runic Ring
        const orbGroup = new THREE.Group();
        orbGroup.position.set(0.23, 1.24, 0.19);
        const orbCrystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.078, 0), gemMat);
        const orbRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 10, 28), goldTrimMat);
        orbRing.rotation.x = Math.PI / 3;
        orbGroup.add(orbCrystal, orbRing);
        upperGroup.add(orbGroup);
        animRefs.floatingOrb = { group: orbGroup, baseY: 1.24 };
      } else if (type === 'dragon') {
        // 1. Great Swept Wyvern / Dragon Wings (Left & Right Articulated Wing Membranes)
        const dWingShape = new THREE.Shape();
        dWingShape.moveTo(0, 0);
        dWingShape.quadraticCurveTo(0.16, 0.30, 0.48, 0.44);
        dWingShape.quadraticCurveTo(0.36, 0.18, 0.44, 0.05);
        dWingShape.quadraticCurveTo(0.28, 0.02, 0.32, -0.14);
        dWingShape.quadraticCurveTo(0.16, -0.06, 0.16, -0.22);
        dWingShape.quadraticCurveTo(0.06, -0.10, 0, -0.06);
        dWingShape.closePath();

        const dWingGeo = new THREE.ExtrudeGeometry(dWingShape, {
          steps: 1,
          depth: 0.024,
          bevelEnabled: true,
          bevelThickness: 0.010,
          bevelSize: 0.010,
          bevelSegments: 2
        });

        for (const side of [-1, 1]) {
          const wingPivot = new THREE.Group();
          wingPivot.position.set(side * 0.15, 0.88, -0.06);

          const wingBlade = new THREE.Mesh(dWingGeo, stoneMat);
          if (side < 0) wingBlade.scale.set(-1, 1, 1);
          wingBlade.rotation.set(0.22, side * -0.45, side * 0.18);
          wingBlade.castShadow = true;
          wingPivot.add(wingBlade);

          const wingSpar = new THREE.Mesh(dWingGeo, goldTrimMat);
          wingSpar.scale.set(side * 0.82, 0.38, 1.15);
          wingSpar.position.set(0, 0.16, 0.01);
          wingSpar.rotation.set(0.22, side * -0.45, side * 0.18);
          wingPivot.add(wingSpar);

          upperGroup.add(wingPivot);
          animRefs.wings.push({ pivot: wingPivot, side, baseRotY: 0 });
        }

        // 2. Swept-Back Curved Dragon Horns & Dorsal Ridge Spines
        for (const side of [-1, 1]) {
          const hornCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(side * 0.08, 1.32, 0.04),
            new THREE.Vector3(side * 0.17, 1.46, -0.08),
            new THREE.Vector3(side * 0.22, 1.60, -0.24)
          ]);
          const hornGeo = new THREE.TubeGeometry(hornCurve, 16, 0.028, 8, false);
          const hornMesh = new THREE.Mesh(hornGeo, goldTrimMat);
          hornMesh.castShadow = true;
          upperGroup.add(hornMesh);
        }

        // Dorsal fire-spines along the neck & back
        const spineCoords = [
          { y: 1.24, z: -0.14, s: 1.0 },
          { y: 1.04, z: -0.18, s: 0.9 },
          { y: 0.84, z: -0.18, s: 0.8 }
        ];
        for (const sc of spineCoords) {
          const spine = new THREE.Mesh(new THREE.ConeGeometry(0.036 * sc.s, 0.14 * sc.s, 6), goldTrimMat);
          spine.position.set(0, sc.y, sc.z);
          spine.rotation.x = -0.65;
          upperGroup.add(spine);
        }

        // 3. Molten Dragonheart Chest Core
        const heartCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.072, 0), gemMat);
        heartCore.position.set(0, 0.88, 0.21);
        upperGroup.add(heartCore);
        animRefs.halo = heartCore;
      } else if (type === 'demon_rider') {
        // 1. Abyssal Demon Rider Bat-Hook Wings (Left & Right Jagged Hellfire Wings)
        const demWingShape = new THREE.Shape();
        demWingShape.moveTo(0, 0);
        demWingShape.quadraticCurveTo(0.14, 0.36, 0.54, 0.52);
        demWingShape.lineTo(0.42, 0.20);
        demWingShape.lineTo(0.50, 0.04);
        demWingShape.lineTo(0.32, -0.06);
        demWingShape.lineTo(0.36, -0.24);
        demWingShape.quadraticCurveTo(0.15, -0.10, 0, -0.08);
        demWingShape.closePath();

        const demWingGeo = new THREE.ExtrudeGeometry(demWingShape, {
          steps: 1,
          depth: 0.026,
          bevelEnabled: true,
          bevelThickness: 0.012,
          bevelSize: 0.012,
          bevelSegments: 2
        });

        for (const side of [-1, 1]) {
          const wingPivot = new THREE.Group();
          wingPivot.position.set(side * 0.16, 0.92, -0.08);

          const wingMembrane = new THREE.Mesh(demWingGeo, specialPieceMats.hellsteel);
          if (side < 0) wingMembrane.scale.set(-1, 1, 1);
          wingMembrane.rotation.set(0.24, side * -0.48, side * 0.22);
          wingMembrane.castShadow = true;
          wingPivot.add(wingMembrane);

          const magmaVein = new THREE.Mesh(demWingGeo, gemMat);
          magmaVein.scale.set(side * 0.72, 0.32, 1.18);
          magmaVein.position.set(0, 0.18, 0.01);
          magmaVein.rotation.set(0.24, side * -0.48, side * 0.22);
          wingPivot.add(magmaVein);

          upperGroup.add(wingPivot);
          animRefs.wings.push({ pivot: wingPivot, side, baseRotY: 0 });
        }

        // 2. Massive Forward-Swept Abyssal Demon Horns (Rider & Hell-Steed)
        for (const side of [-1, 1]) {
          const demonHornCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(side * 0.09, 1.34, 0.02),
            new THREE.Vector3(side * 0.24, 1.48, -0.06),
            new THREE.Vector3(side * 0.28, 1.64, 0.08),
            new THREE.Vector3(side * 0.18, 1.74, 0.22)
          ]);
          const hornGeo = new THREE.TubeGeometry(demonHornCurve, 18, 0.032, 8, false);
          const hornMesh = new THREE.Mesh(hornGeo, specialPieceMats.hellsteel);
          hornMesh.castShadow = true;
          upperGroup.add(hornMesh);

          // Glowing horn tip
          const hornTip = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.11, 6), gemMat);
          hornTip.position.set(side * 0.18, 1.75, 0.23);
          hornTip.rotation.x = 0.65;
          upperGroup.add(hornTip);
        }

        // 3. Flaming Jagged Hell-Lance / Greatsword held by the Demon Rider
        const lanceGroup = new THREE.Group();
        lanceGroup.position.set(0.26, 0.96, 0.18);
        lanceGroup.rotation.set(0.52, 0, -0.10);
        const lanceShaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.028, 1.45, 10),
          specialPieceMats.hellsteel
        );
        const lanceFlameBlade = new THREE.Mesh(
          new THREE.ConeGeometry(0.068, 0.58, 6),
          gemMat
        );
        lanceFlameBlade.position.y = 0.82;
        lanceGroup.add(lanceShaft, lanceFlameBlade);
        upperGroup.add(lanceGroup);

        // 4. Orbiting Hellfire Halo Ring & Molten Skull Core
        const hellRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.016, 10, 36), gemMat);
        hellRing.position.set(0, 1.05, 0);
        hellRing.rotation.set(1.15, 0.2, 0.2);
        upperGroup.add(hellRing);
        animRefs.astrolabes.push(hellRing);

        const abyssCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.088, 0), gemMat);
        abyssCore.position.set(0, 0.92, 0.22);
        upperGroup.add(abyssCore);
        animRefs.halo = abyssCore;
      }

      return { upperGroup, baseGroup, animRefs, stoneMat, gemMat };
    }

    // =========================================================================
    // Asset Loading (Cathedral GLB + 12 Rigged Piece GLBs)
    // =========================================================================
    const gltfLoader = new GLTFLoader();
    const pieceTemplates = {};
    const activeMixers = [];
    const shatterDebris = [];
    const clock = new THREE.Clock();

    const boardGroup = new THREE.Group();
    scene.add(boardGroup);
    const squareHighlightsGroup = new THREE.Group();
    scene.add(squareHighlightsGroup);
    const boardSquareMeshes = [];

    const boardLightSqMat = new THREE.MeshStandardMaterial({
      color: 0xdcd3c2,
      roughness: 0.16,
      metalness: 0.22,
      transparent: true,
      opacity: 0.85
    });
    const boardDarkSqMat = new THREE.MeshStandardMaterial({
      color: 0x14171f,
      roughness: 0.12,
      metalness: 0.34,
      transparent: true,
      opacity: 0.82
    });

    let boardReflectorMesh = null;
    let boardVeinsCanvas = null;
    let boardVeinsCtx = null;
    let boardVeinsTexture = null;
    let boardVeinsOverlayMesh = null;
    const boardGodRaysGroup = new THREE.Group();
    scene.add(boardGodRaysGroup);
    const battleScarsGroup = new THREE.Group();
    scene.add(battleScarsGroup);
    const combatVfxList = [];

    function updateBoardSurfaceVeinsForLocation(loc) {
      if (!boardVeinsCtx || !boardVeinsTexture) return;
      const ctx = boardVeinsCtx;
      const w = 512;
      const h = 512;
      ctx.clearRect(0, 0, w, h);

      const isLava = Boolean(loc?.isLava);
      const locId = loc?.id || 'cathedral';
      let strokeCol = 'rgba(212, 175, 55, 0.36)';
      let glowCol = '#f59e0b';
      if (isLava) {
        strokeCol = 'rgba(255, 94, 0, 0.78)';
        glowCol = '#ff3300';
      } else if (locId === 'ice_citadel') {
        strokeCol = 'rgba(125, 211, 252, 0.65)';
        glowCol = '#38bdf8';
      } else if (locId === 'emerald_crypt') {
        strokeCol = 'rgba(52, 211, 153, 0.65)';
        glowCol = '#10b981';
      } else if (locId === 'shadow_abyss' || locId === 'crystal_cavern') {
        strokeCol = 'rgba(232, 121, 249, 0.62)';
        glowCol = '#d946ef';
      } else if (locId === 'blood_arena') {
        strokeCol = 'rgba(251, 113, 133, 0.65)';
        glowCol = '#e11d48';
      }

      ctx.save();
      ctx.strokeStyle = strokeCol;
      ctx.shadowColor = glowCol;
      ctx.shadowBlur = isLava ? 14 : 8;
      ctx.lineWidth = isLava ? 2.4 : 1.6;

      // Subtle glowing sacred geometry / elemental veins along the chessboard grid
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 186, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 92, 0, Math.PI * 2);
      ctx.stroke();

      // Elemental crack / rune filaments across tiles
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        let x = w / 2 + Math.cos(ang) * 44;
        let y = h / 2 + Math.sin(ang) * 44;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let step = 0; step < 5; step++) {
          const jitter = ((i * 7 + step * 13) % 11 - 5) * 0.14;
          x += Math.cos(ang + jitter) * 36;
          y += Math.sin(ang + jitter) * 36;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      boardVeinsTexture.needsUpdate = true;
    }

    function buildBoardVolumetricGodRays(colorHex = 0xffe6a3) {
      while (boardGodRaysGroup.children.length > 0) {
        boardGodRaysGroup.remove(boardGodRaysGroup.children[0]);
      }
      const rayMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.065,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const rayPositions = [
        { x: -1.1, z: -1.1, rx: 0.14, rz: -0.12, rTop: 0.25, rBot: 0.95 },
        { x: 1.1, z: -1.1, rx: 0.14, rz: 0.12, rTop: 0.25, rBot: 0.95 },
        { x: 0.0, z: 0.0, rx: 0.08, rz: 0.0, rTop: 0.45, rBot: 1.45 }
      ];
      for (const rp of rayPositions) {
        const cone = new THREE.Mesh(
          new THREE.CylinderGeometry(rp.rTop, rp.rBot, 6.8, 24, 1, true),
          rayMat
        );
        cone.position.set(rp.x, BOARD_SURFACE_Y + 3.35, rp.z);
        cone.rotation.set(rp.rx, 0, rp.rz);
        boardGodRaysGroup.add(cone);
      }
    }

    function buildChessBoardGrid() {
      const tileH = 0.036;
      const sqGeo = new THREE.BoxGeometry(BOARD_SQ_SIZE * 0.985, tileH, BOARD_SQ_SIZE * 0.985);
      const lightSqMat = boardLightSqMat;
      const darkSqMat = boardDarkSqMat;

      // Real-time planar Mirror Reflector under the semi-translucent marble & obsidian squares
      try {
        const mirrorSize = BOARD_SQ_SIZE * 8.02;
        const reflectorGeo = new THREE.PlaneGeometry(mirrorSize, mirrorSize);
        boardReflectorMesh = new Reflector(reflectorGeo, {
          clipBias: 0.003,
          textureWidth: Math.min(1024, window.innerWidth),
          textureHeight: Math.min(1024, window.innerHeight),
          color: 0x555b66
        });
        boardReflectorMesh.rotation.x = -Math.PI / 2;
        boardReflectorMesh.position.set(0, BOARD_SURFACE_Y - 0.0012, 0);
        boardGroup.add(boardReflectorMesh);
      } catch {
        // Fallback if WebGL context restricts secondary render target
      }

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const isLight = (r + c) % 2 === 0;
          const sqMesh = new THREE.Mesh(sqGeo, isLight ? lightSqMat : darkSqMat);
          const pos = boardToWorld(r, c);
          sqMesh.position.set(pos.x, BOARD_SURFACE_Y - tileH * 0.5, pos.z);
          sqMesh.receiveShadow = true;
          sqMesh.userData = { r, c, isSquare: true };
          boardGroup.add(sqMesh);
          boardSquareMeshes.push(sqMesh);
        }
      }

      // Dynamic Location-Reactive Glowing Veins Overlay on the Chessboard
      boardVeinsCanvas = document.createElement('canvas');
      boardVeinsCanvas.width = 512;
      boardVeinsCanvas.height = 512;
      boardVeinsCtx = boardVeinsCanvas.getContext('2d');
      boardVeinsTexture = new THREE.CanvasTexture(boardVeinsCanvas);
      const veinsMat = new THREE.MeshBasicMaterial({
        map: boardVeinsTexture,
        transparent: true,
        opacity: 0.52,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      boardVeinsOverlayMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(BOARD_SQ_SIZE * 7.96, BOARD_SQ_SIZE * 7.96),
        veinsMat
      );
      boardVeinsOverlayMesh.rotation.x = -Math.PI / 2;
      boardVeinsOverlayMesh.position.set(0, BOARD_SURFACE_Y + 0.0014, 0);
      boardGroup.add(boardVeinsOverlayMesh);
      updateBoardSurfaceVeinsForLocation(null);
      buildBoardVolumetricGodRays(0xffe6a3);

      // Sculpted Golden Border Frame around the 8x8 tiles on top of the Obsidian Altar
      const halfB = 4.0 * BOARD_SQ_SIZE;
      const rimW = 0.06;
      const rimH = 0.042;
      const horizGeo = new THREE.BoxGeometry(halfB * 2 + rimW * 2, rimH, rimW);
      const vertGeo = new THREE.BoxGeometry(rimW, rimH, halfB * 2);
      for (const s of [-1, 1]) {
        const hBar = new THREE.Mesh(horizGeo, goldTrimMat);
        hBar.position.set(0, BOARD_SURFACE_Y - rimH * 0.45, s * (halfB + rimW * 0.5));
        hBar.receiveShadow = true;
        boardGroup.add(hBar);

        const vBar = new THREE.Mesh(vertGeo, goldTrimMat);
        vBar.position.set(s * (halfB + rimW * 0.5), BOARD_SURFACE_Y - rimH * 0.45, 0);
        vBar.receiveShadow = true;
        boardGroup.add(vBar);
      }
    }

    buildChessBoardGrid();

    // =========================================================================
    // Native Baked Wall/Column Stone (Original Ashlar) & Floor Stone (Abbey Flagstone)
    // =========================================================================
    const WALL_STONE_LOOKS = [
      {
        name: 'Original Ashlar',
        fullName: 'Original Ashlar',
        useOriginalBaked: true,
        roughness: 0.78,
        normalScale: 1.18,
        colNormalScale: 1.06
      }
    ];

    const FLOOR_STONE_LOOKS = [
      {
        name: 'Abbey Flagstone',
        fullName: 'Abbey Flagstone',
        useOriginalBaked: true,
        roughness: 0.80,
        metalness: 0.02,
        normalScale: 1.18
      }
    ];

    let currentWallStoneLookIdx = 0;
    let currentFloorStoneLookIdx = 0;
    const cathedralWallMats = [];
    const cathedralColumnMats = [];
    const cathedralFloorMats = [];
    const cathedralAmberGlassMats = [];
    const cathedralBlueGlassMats = [];
    let brazierFlameCoreMat = null;
    let brazierFlameMidMat = null;
    let brazierFlameOuterMat = null;

    // Precomputed 128x128 tileable micro-chisel grain DataTexture (replaces 32 per-pixel 3D hashes every frame)
    const stoneMicroGrainTex = (() => {
      const size = 128;
      const data = new Uint8Array(size * size * 4);
      const fract = (v) => v - Math.floor(v);
      const hash2 = (x, y, s) => fract(Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453);
      const smoothNoise = (u, v, period, seed) => {
        const gx = u * period;
        const gy = v * period;
        const x0 = Math.floor(gx) % period;
        const y0 = Math.floor(gy) % period;
        const x1 = (x0 + 1) % period;
        const y1 = (y0 + 1) % period;
        const fx = gx - Math.floor(gx);
        const fy = gy - Math.floor(gy);
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const n00 = hash2(x0, y0, seed);
        const n10 = hash2(x1, y0, seed);
        const n01 = hash2(x0, y1, seed);
        const n11 = hash2(x1, y1, seed);
        return (n00 + (n10 - n00) * sx) * (1 - sy) + (n01 + (n11 - n01) * sx) * sy;
      };
      for (let y = 0; y < size; y++) {
        const v = y / size;
        for (let x = 0; x < size; x++) {
          const u = x / size;
          const mG1 = smoothNoise(u, v, 24, 1.7);
          const mG2 = smoothNoise(u, v, 64, 7.3);
          const idx = (y * size + x) * 4;
          data[idx] = Math.max(0, Math.min(255, Math.round(mG1 * 255)));
          data[idx + 1] = Math.max(0, Math.min(255, Math.round(mG2 * 255)));
          data[idx + 2] = Math.max(0, Math.min(255, Math.round((0.5 + (mG1 - mG2) * 0.7) * 255)));
          data[idx + 3] = 255;
        }
      }
      const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
      return tex;
    })();

    // =========================================================================
    // Realism Stone Shader Enhancement (inspired by 0beqz/realism-effects HBAO/HBIL
    // & gkjohnson/three-gpu-pathtracer Cavity Micro-Occlusion + Specular Occlusion)
    // =========================================================================
    function applyCathedralStoneRealismShader(mat, isFloor = false) {
      if (!mat || mat.userData.hasRealismStoneShader) return;
      mat.userData.hasRealismStoneShader = true;
      mat.customProgramCacheKey = () => (isFloor ? 'cathedral-floor-realism-v3' : 'cathedral-stone-realism-v3');

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uCavityStrength = { value: isFloor ? 0.58 : 0.72 };
        shader.uniforms.uMicroDetailStrength = { value: isFloor ? 0.14 : 0.18 };
        shader.uniforms.uFireBounceStrength = { value: isFloor ? 0.16 : 0.24 };
        shader.uniforms.uMicroGrainMap = { value: stoneMicroGrainTex };

        shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          `#include <common>
          varying vec3 vStoneWorldPos;`
        );
        shader.vertexShader = shader.vertexShader.replace(
          '#include <worldpos_vertex>',
          `#include <worldpos_vertex>
          vStoneWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `#include <common>
          varying vec3 vStoneWorldPos;
          uniform float uCavityStrength;
          uniform float uMicroDetailStrength;
          uniform float uFireBounceStrength;
          uniform sampler2D uMicroGrainMap;`
        );

        // Extract normal-map slope magnitude for Mortar/Crevice Cavity AO & Specular Micro-Occlusion,
        // plus precomputed tileable micro-chisel grain lookup (zero per-pixel 3D hash loops!).
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <normal_fragment_maps>',
          `float stoneCavityAO = 1.0;
          #include <normal_fragment_maps>
          #ifdef USE_NORMALMAP_TANGENTSPACE
            vec2 rawNrmXY = texture2D(normalMap, vNormalMapUv).xy * 2.0 - 1.0;
            float slopeSq = dot(rawNrmXY, rawNrmXY);
            stoneCavityAO = clamp(1.0 - slopeSq * uCavityStrength, 0.36, 1.0);
          #endif
          vec2 microUv = (vStoneWorldPos.xz + vStoneWorldPos.xy * 0.618) * 0.85;
          vec3 mgSample = texture2D(uMicroGrainMap, microUv).rgb - 0.5;
          float mG1 = mgSample.r;
          float mG2 = mgSample.g;
          vec3 microPerturb = vec3(mG1, mG2, mgSample.b) * uMicroDetailStrength;
          normal = normalize(normal + microPerturb * 0.22);
          diffuseColor.rgb *= mix(0.92, 1.07, clamp(0.5 + (mG1 * 0.65 + mG2 * 0.35), 0.0, 1.0));
          diffuseColor.rgb *= mix(1.0, stoneCavityAO, 0.68);
          roughnessFactor = clamp(roughnessFactor + (1.0 - stoneCavityAO) * 0.34 - mG1 * 0.06, 0.14, 0.99);`
        );

        // Add Horizon-Based Indirect Bounce (HBIL) from the twin fire cauldrons & upper lancet windows,
        // and apply Specular Micro-Occlusion in mortar crevices so grooves never have plastic shine.
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <lights_fragment_end>',
          `#include <lights_fragment_end>
          reflectedLight.directDiffuse *= mix(1.0, stoneCavityAO, 0.45);
          reflectedLight.indirectDiffuse *= stoneCavityAO;
          reflectedLight.directSpecular *= stoneCavityAO * stoneCavityAO;
          reflectedLight.indirectSpecular *= stoneCavityAO * stoneCavityAO;

          // Physical multi-bounce warm firelight GI from the twin atrium braziers & flanking columns
          vec3 toBrazierL = vec3(-3.65, 1.35, 0.0) - vStoneWorldPos;
          vec3 toBrazierR = vec3(3.65, 1.35, 0.0) - vStoneWorldPos;
          float distSqL = dot(toBrazierL, toBrazierL) + 2.6;
          float distSqR = dot(toBrazierR, toBrazierR) + 2.6;
          vec3 wNormal = inverseTransformDirection(normal, viewMatrix);
          float bounceL = max(0.0, dot(wNormal, normalize(toBrazierL)) * 0.65 + 0.35) / distSqL;
          float bounceR = max(0.0, dot(wNormal, normalize(toBrazierR)) * 0.65 + 0.35) / distSqR;
          vec3 fireBounceGI = vec3(1.0, 0.54, 0.20) * (bounceL + bounceR) * 5.2 * uFireBounceStrength * stoneCavityAO;

          // Analytic raking window-sill & end-wall grazing light (replaces 14 static PointLights at zero BRDF cost)
          vec3 toSideWin = vec3(sign(vStoneWorldPos.x) * 6.8, 3.8, vStoneWorldPos.z) - vStoneWorldPos;
          float sideWinDistSq = dot(toSideWin, toSideWin) + 3.2;
          float sideWinGraze = max(0.0, dot(wNormal, normalize(toSideWin)) * 0.75 + 0.25) / sideWinDistSq;
          vec3 windowGrazeGI = vec3(0.84, 0.89, 0.96) * sideWinGraze * 0.95 * stoneCavityAO;
          reflectedLight.indirectDiffuse += (fireBounceGI + windowGrazeGI) * diffuseColor.rgb;`
        );
      };
      mat.needsUpdate = true;
    }

    function setWallStoneLook() {
      currentWallStoneLookIdx = 0;
      const cfg = WALL_STONE_LOOKS[0];

      for (const mat of cathedralWallMats) {
        mat.map = mat.userData.origMap || mat.map;
        mat.normalMap = mat.userData.origNormalMap || mat.normalMap;
        mat.roughnessMap = mat.userData.origRoughnessMap || mat.roughnessMap;
        mat.emissiveMap = mat.userData.origEmissiveMap || null;
        mat.emissiveIntensity = 0.08;
        mat.roughness = cfg.roughness;
        mat.metalness = 0.02;
        if ('envMapIntensity' in mat) mat.envMapIntensity = 0.45;
        if (mat.color) mat.color.setRGB(1, 1, 1);
        if (mat.normalScale) mat.normalScale.set(cfg.normalScale, cfg.normalScale);
        mat.needsUpdate = true;
      }

      for (const mat of cathedralColumnMats) {
        mat.map = mat.userData.origMap || mat.map;
        mat.normalMap = mat.userData.origNormalMap || mat.normalMap;
        mat.roughnessMap = mat.userData.origRoughnessMap || mat.roughnessMap;
        mat.emissiveMap = mat.userData.origEmissiveMap || null;
        mat.emissiveIntensity = 0.08;
        mat.roughness = cfg.roughness;
        mat.metalness = 0.02;
        if ('envMapIntensity' in mat) mat.envMapIntensity = 0.48;
        if (mat.color) mat.color.setRGB(1, 1, 1);
        if (mat.normalScale) mat.normalScale.set(cfg.colNormalScale, cfg.colNormalScale);
        mat.needsUpdate = true;
      }

      return { index: 0, name: cfg.name, fullName: cfg.fullName };
    }

    function setFloorStoneLook() {
      currentFloorStoneLookIdx = 0;
      const cfg = FLOOR_STONE_LOOKS[0];

      for (const mat of cathedralFloorMats) {
        mat.map = mat.userData.origMap || mat.map;
        mat.normalMap = mat.userData.origNormalMap || mat.normalMap;
        mat.roughnessMap = mat.userData.origRoughnessMap || mat.roughnessMap;
        mat.emissiveMap = mat.userData.origEmissiveMap || null;
        mat.emissiveIntensity = 0.06;
        mat.roughness = cfg.roughness;
        mat.metalness = cfg.metalness;
        if (mat.color) mat.color.setRGB(1, 1, 1);
        if ('envMapIntensity' in mat) mat.envMapIntensity = 0.36;
        if (mat.normalScale) mat.normalScale.set(cfg.normalScale, cfg.normalScale);
        mat.needsUpdate = true;
      }

      return { index: 0, name: cfg.name, fullName: cfg.fullName };
    }

    function nextWallStoneLook() {
      return setWallStoneLook(0);
    }
    function prevWallStoneLook() {
      return setWallStoneLook(0);
    }
    function nextFloorStoneLook() {
      return setFloorStoneLook(0);
    }
    function prevFloorStoneLook() {
      return setFloorStoneLook(0);
    }

    let cathedralRootMesh = null;

    async function loadAllAssets() {
      const loaderBar = document.getElementById('loader-bar');
      const loaderText = document.getElementById('loader-text');
      const totalItems = BASE_GLB_PIECE_TYPES.length + 1;

      async function loadGltfModel(baseName) {
        let arrayBuffer = null;
        try {
          const resB64 = await fetch(`./assets/glb/${baseName}.glb.gz.b64`);
          if (resB64.ok) {
            const b64Text = (await resB64.text()).trim();
            if (b64Text.length > 64) {
              const binStr = atob(b64Text);
              const gzBytes = new Uint8Array(binStr.length);
              for (let i = 0; i < binStr.length; i++) {
                gzBytes[i] = binStr.charCodeAt(i);
              }
              const ds = new DecompressionStream('gzip');
              const stream = new Blob([gzBytes]).stream().pipeThrough(ds);
              arrayBuffer = await new Response(stream).arrayBuffer();
            }
          }
        } catch (e) {}

        if (!arrayBuffer) {
          const resGlb = await fetch(`./assets/glb/${baseName}.glb`);
          if (!resGlb.ok) throw new Error(`Failed to fetch ${baseName}`);
          arrayBuffer = await resGlb.arrayBuffer();
        }

        return new Promise((resolve, reject) => {
          gltfLoader.parse(arrayBuffer, './assets/glb/', (gltf) => resolve(gltf), (err) => reject(err));
        });
      }
      let loadedCount = 0;

      function bumpProgress(label) {
        loadedCount++;
        const pct = Math.min(100, Math.round((loadedCount / totalItems) * 100));
        if (loaderBar) loaderBar.style.width = `${pct}%`;
        if (loaderText) loaderText.textContent = label;
      }

      // Instantiate custom GLSL shaders for the 3 sculpted brazier flame layers & charred ember logs
      const flameCoreShader = createSculptedFlameTongueShader({
        baseColor: [1.0, 0.96, 0.72],
        midColor: [1.0, 0.64, 0.12],
        tipColor: [1.0, 0.36, 0.03],
        strength: 1.85,
        opacity: 0.92,
        zMin: 0.60,
        zMax: 1.64,
        layerSeed: 0.0
      });
      const flameMidShader = createSculptedFlameTongueShader({
        baseColor: [1.0, 0.78, 0.25],
        midColor: [1.0, 0.40, 0.04],
        tipColor: [0.92, 0.16, 0.01],
        strength: 1.35,
        opacity: 0.82,
        zMin: 0.60,
        zMax: 1.52,
        layerSeed: 2.1
      });
      const flameOuterShader = createSculptedFlameTongueShader({
        baseColor: [1.0, 0.45, 0.06],
        midColor: [0.88, 0.18, 0.015],
        tipColor: [0.45, 0.03, 0.002],
        strength: 0.95,
        opacity: 0.68,
        zMin: 0.60,
        zMax: 1.36,
        layerSeed: 4.4
      });
      const charredEmberLogsShader = createCharredEmberLogsShader();
      brazierFlameCoreMat = flameCoreShader;
      brazierFlameMidMat = flameMidShader;
      brazierFlameOuterMat = flameOuterShader;

      // 1. Load Native Full-Height Cathedral Environment (shifted by z = -0.65 so the Obsidian Altar is centered at 0, 0.7215, 0)
      const maxAniso = renderer.capabilities.getMaxAnisotropy() || 8;
      await new Promise((resolve) => {
        loadGltfModel('option8_cathedral').then(
          (gltf) => {
            const cathedralRoot = gltf.scene;
            cathedralRootMesh = cathedralRoot;
            cathedralRoot.position.set(0, 0, -0.65);

            cathedralRoot.traverse((child) => {
              if (!child.isMesh) return;
              child.receiveShadow = true;
              const meshName = child.name || '';
              const mNameFirst = (Array.isArray(child.material) ? child.material[0]?.name : child.material?.name) || '';

              if (meshName.includes('Brazier_Flame_Core') || mNameFirst.includes('Flame_Core')) {
                child.material = flameCoreShader;
                child.castShadow = false;
                child.receiveShadow = false;
                child.renderOrder = 12;
                return;
              }
              if (meshName.includes('Brazier_Flame_Mid') || mNameFirst.includes('Flame_Mid')) {
                stripIcosphereSparksFromFlameGeometry(child.geometry);
                child.material = flameMidShader;
                child.castShadow = false;
                child.receiveShadow = false;
                child.renderOrder = 11;
                return;
              }
              if (meshName.includes('Brazier_Flame_Outer') || mNameFirst.includes('Flame_Outer')) {
                child.material = flameOuterShader;
                child.castShadow = false;
                child.receiveShadow = false;
                child.renderOrder = 10;
                return;
              }
              if (meshName.includes('Embers_Logs') || mNameFirst.includes('Ember')) {
                child.material = charredEmberLogsShader;
                child.castShadow = false;
                child.receiveShadow = false;
                return;
              }

              // Only the central Obsidian Altar casts real-time directional shadows;
              // cathedral columns/walls/ceiling and twin braziers use baked 3D Chiaroscuro & BVH ray-traced AO
              // so they never project clipped or directional shadows across the floor.
              const isShadowCasterProp =
                meshName.includes('Obsidian_Altar') ||
                meshName.includes('Altar_Golden_Runes');

              const mats = Array.isArray(child.material) ? child.material : [child.material];
              for (const mat of mats) {
                if (!mat) continue;
                const mName = mat.name || '';
                const isAmberGlass =
                  mName.includes('Amber') ||
                  mName.includes('Narthex_Amber') ||
                  meshName.includes('Narthex_Amber');
                const isGlass =
                  isAmberGlass ||
                  mName.includes('Glass') ||
                  mName.includes('Lancet') ||
                  mName.includes('Rose') ||
                  meshName.includes('Glass') ||
                  meshName.includes('Window');
                const isRay = mName.includes('GodRay') || meshName.includes('GodRay');

                for (const texKey of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) {
                  if (mat[texKey]) {
                    mat[texKey].anisotropy = maxAniso;
                    mat[texKey].needsUpdate = true;
                  }
                }

                // Preserve native 1024x1024 GLB-baked textures before any look switching
                if (!mat.userData.origCaptured) {
                  mat.userData.origCaptured = true;
                  mat.userData.origMap = mat.map || null;
                  mat.userData.origNormalMap = mat.normalMap || null;
                  mat.userData.origRoughnessMap = mat.roughnessMap || null;
                  mat.userData.origEmissiveMap = mat.emissiveMap || null;
                }

                if (mat.normalMap && mat.normalScale) {
                  const isDoorMat = mName.includes('Oak') || mName.includes('Door') || meshName.includes('Door');
                  const nScale = isDoorMat ? 1.05 : 1.15;
                  mat.normalScale.set(nScale, nScale);
                }

                if (isAmberGlass) {
                  mat.vertexColors = false;
                  mat.color = new THREE.Color(0xffe6b8);
                  mat.emissive = new THREE.Color(0xffa033);
                  mat.emissiveIntensity = 2.45;
                  mat.roughness = 0.15;
                  mat.metalness = 0.0;
                  mat.side = THREE.DoubleSide;
                  child.castShadow = false;
                  if (!cathedralAmberGlassMats.includes(mat)) cathedralAmberGlassMats.push(mat);
                } else if (isGlass) {
                  mat.vertexColors = false;
                  mat.color = new THREE.Color(0xdbeeff);
                  mat.emissive = new THREE.Color(0x68a8ff);
                  mat.emissiveIntensity = 2.65;
                  mat.roughness = 0.15;
                  mat.metalness = 0.0;
                  mat.side = THREE.DoubleSide;
                  child.castShadow = false;
                  if (!cathedralBlueGlassMats.includes(mat)) cathedralBlueGlassMats.push(mat);
                } else if (isRay) {
                  child.visible = false;
                  child.castShadow = false;
                  child.receiveShadow = false;
                } else {
                  if (mat.map) {
                    mat.vertexColors = true;
                  }
                  child.castShadow = isShadowCasterProp;

                  // Register Wall, Column/Arch/Plinth, and Floor stone materials for live 6-look switching & Realism Shader
                  if (mName.includes('Floor') || mName.includes('Flagstone') || meshName.includes('Floor')) {
                    applyCathedralStoneRealismShader(mat, true);
                    if (!cathedralFloorMats.includes(mat)) cathedralFloorMats.push(mat);
                  } else if (
                    mName.includes('Column_Stone') ||
                    mName.includes('Tracery') ||
                    meshName.includes('Plinth') ||
                    meshName.includes('Tracery')
                  ) {
                    applyCathedralStoneRealismShader(mat, false);
                    if (!cathedralColumnMats.includes(mat)) cathedralColumnMats.push(mat);
                  } else if (
                    mName.includes('Gothic_Ashlar') ||
                    mName.includes('Ashlar') ||
                    mName.includes('Vault') ||
                    meshName.includes('Cathedral_Stone')
                  ) {
                    applyCathedralStoneRealismShader(mat, false);
                    if (!cathedralWallMats.includes(mat)) cathedralWallMats.push(mat);
                  }
                }
                mat.needsUpdate = true;
              }
            });

            // Initialize default Look 1/6 (Original Ashlar & Abbey Flagstone) on Wall/Column Stone and Floor Stone
            setWallStoneLook(0);
            setFloorStoneLook(0);
            scene.add(cathedralRoot);

            bumpProgress('Cathedral Architecture Loaded...');
            resolve();
          },
          (err) => {
            console.warn('Cathedral GLB load warning:', err);
            bumpProgress('Cathedral Loaded');
            resolve();
          }
        );
      });

      // 2. Load 6 Sculpted & Rigged Chess Piece Models (shared between White & Black with PBR materials)
      for (const type of BASE_GLB_PIECE_TYPES) {
        await new Promise((resolve) => {
          loadGltfModel(`${type}_white`).then(
            (gltf) => {
              const toRemove = [];
              gltf.scene.traverse((child) => {
                const nm = child.name || '';
                if (nm.includes('Icosphere') || nm.includes('glTF_not_exported')) {
                  child.visible = false;
                  toRemove.push(child);
                }
              });
              for (const rem of toRemove) {
                if (rem.parent) rem.parent.remove(rem);
              }

              const tpl = {
                scene: gltf.scene,
                animations: gltf.animations || []
              };
              pieceTemplates[`${type}_w`] = tpl;
              pieceTemplates[`${type}_b`] = tpl;
              bumpProgress(`Summoned ${type.toUpperCase()} Statue...`);
              resolve();
            },
            (err) => {
              console.warn(`Piece load warning (${type}):`, err);
              bumpProgress(`Loaded ${type}`);
              resolve();
            }
          );
        });
      }

      // Map the 5 New Sanctum & Demon Piece Types to their rigged statue base templates
      const newTypeBaseMap = {
        demon_rider: 'knight',
        archbishop: 'bishop',
        chancellor: 'rook',
        wizard: 'queen',
        dragon: 'knight'
      };
      for (const [newType, baseType] of Object.entries(newTypeBaseMap)) {
        pieceTemplates[`${newType}_w`] = pieceTemplates[`${baseType}_w`];
        pieceTemplates[`${newType}_b`] = pieceTemplates[`${baseType}_b`];
      }

      document.getElementById('loading-overlay')?.classList.add('hidden');
    }

    // =========================================================================
    // Chess Game State, Complete Move Rules, and AI Engine
    // =========================================================================
    let boardState = Array.from({ length: 8 }, () => Array(8).fill(null));
    let currentTurn = 'w';
    let selectedSquare = null;
    let validMoves = [];
    let isAnimatingMove = false;
    let gameOver = false;
    let capturedByWhite = 0;
    let capturedByBlack = 0;

    // Mode & Player Configuration
    let gameMode = 'single'; // 'single' | 'multi'
    let playerColor = 'w';   // 'w' | 'b' | 'spectator'
    let aiAutoPlay = true;
    let aiTimer = null;

    // Multiplayer State
    let roomCode = null;
    let playerToken = localStorage.getItem('wizard_chess_token') || '';
    let roomEventSource = null;
    let roomPollTimer = null;
    let appliedMoveSeq = 0;
    let appliedResetCount = 0;

    // Camera Animation & Telemetry State
    const cameraTelemetry = {
      lastAttackSamples: [],
      attackCount: 0,
      maxStepDelta: 0,
      columnDeflections: 0,
      minColumnClearance: Infinity,
      lastColumnClearance: Infinity
    };
    window.__wizardChessTelemetry = cameraTelemetry;

    let activeCamTransition = null; // { startPos, endPos, startTarget, endTarget, elapsed, duration }

    function flushOrbitControlsDamping() {
      const wasDamping = orbitControls.enableDamping;
      orbitControls.enableDamping = false;
      orbitControls.update();
      enforceCathedralBoundsAndSolidColumns(null, camera.position, orbitControls.target);
      camera.lookAt(orbitControls.target);
      orbitControls.enableDamping = wasDamping;
    }

    function smoothCameraTo(targetPos, targetLookAt, duration = 0.75) {
      flushOrbitControlsDamping();
      const clampedPos = targetPos.clone();
      const clampedLook = targetLookAt.clone();
      enforceCathedralBoundsAndSolidColumns(clampedPos, clampedPos, clampedLook);
      activeCamTransition = {
        startPos: camera.position.clone(),
        endPos: clampedPos,
        startTarget: orbitControls.target.clone(),
        endTarget: clampedLook,
        elapsed: 0,
        duration: Math.max(0.05, duration)
      };
    }

    function setCameraForSide(color, immediate = false) {
      // White sits at +Z looking toward -Z (across the Obsidian Altar down the Cathedral Nave & Rose Window)
      // Black sits at -Z looking toward +Z (across the Obsidian Altar toward the South Narthex Royal Amber Triptych)
      const zSign = color === 'b' ? -1 : 1;
      const desiredPos = new THREE.Vector3(0, 2.22, zSign * 2.72);
      const desiredTarget = new THREE.Vector3(0, 0.85, zSign * -0.15);
      if (immediate) {
        activeCamTransition = null;
        camera.position.copy(desiredPos);
        orbitControls.target.copy(desiredTarget);
        flushOrbitControlsDamping();
      } else {
        smoothCameraTo(desiredPos, desiredTarget, 0.8);
      }
    }

    function instantiatePiece(type, color, r, c) {
      const activeVisualStyle = PIECE_VISUAL_STYLES[currentVisualStyleIdx]?.id || 'sanctum';
      const forceDemonStyle = activeVisualStyle === 'demon_legion';
      const useClassicStaunton = activeVisualStyle === 'classic_staunton';

      const tpl = pieceTemplates[`${type}_${color}`];
      let root;
      let mixer = null;
      const actions = {};
      const isSpecialType = Boolean(
        type === 'demon_rider' ||
        type === 'archbishop' ||
        type === 'chancellor' ||
        type === 'wizard' ||
        type === 'dragon'
      );
      const regaliaType = forceDemonStyle && !isSpecialType ? 'demon_rider' : type;
      const customMats =
        !useClassicStaunton && (isSpecialType || forceDemonStyle)
          ? buildSculptedNewPieceRegalia(regaliaType, color)
          : null;

      if (useClassicStaunton) {
        root = buildClassicStauntonPieceMesh(type, color);
      } else if (tpl && tpl.scene) {
        root = SkeletonUtils.clone(tpl.scene);
        const primaryMat = customMats
          ? customMats.stoneMat
          : (color === 'w' ? whitePieceMat : blackPieceMat);
        root.traverse((child) => {
          const nm = child.name || '';
          if (nm.includes('Icosphere') || nm.includes('glTF_not_exported')) {
            child.visible = false;
            return;
          }
          if (child.isMesh) {
            const mName = child.material?.name || '';
            if (mName.includes('Gold') || mName.includes('Trim') || mName.includes('Bronze') || mName.includes('Glow')) {
              child.material =
                regaliaType === 'demon_rider' ? customMats.gemMat : goldTrimMat;
            } else if (mName.includes('Steel')) {
              child.material =
                regaliaType === 'wizard' || regaliaType === 'demon_rider'
                  ? customMats.gemMat
                  : forgedSteelMat;
            } else {
              child.material = primaryMat;
            }
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        mixer = new THREE.AnimationMixer(root);
        for (const clip of tpl.animations) {
          actions[clip.name] = mixer.clipAction(clip);
        }
        activeMixers.push(mixer);
      } else {
        root = buildClassicStauntonPieceMesh(type, color);
      }

      const worldPos = boardToWorld(r, c);
      root.position.copy(worldPos);
      const scale = BOARD_SQ_SIZE;
      root.scale.set(scale, scale, scale);
      // White (at +Z, r=6,7) faces -Z (Math.PI); Black (at -Z, r=0,1) faces +Z (0)
      root.rotation.y = color === 'w' ? Math.PI : 0;
      scene.add(root);

      // Attach sculpted 3D regalia for new piece types (Demon Rider, Archbishop, Chancellor, Wizard, Dragon)
      if (customMats) {
        root.add(customMats.baseGroup);
        const upperWrap = new THREE.Group();
        upperWrap.add(customMats.upperGroup);
        root.add(upperWrap);

        // Locate torso/chest bone so the sculpted wings, halberds, horns, and hats lunge & breathe with the statue
        root.updateMatrixWorld(true);
        const invRootMat = new THREE.Matrix4().copy(root.matrixWorld).invert();
        let bestBone = null;
        let bestDist = Infinity;
        root.traverse((ch) => {
          if (ch.isBone) {
            const bMat = new THREE.Matrix4().multiplyMatrices(invRootMat, ch.matrixWorld);
            const bPos = new THREE.Vector3().setFromMatrixPosition(bMat);
            if (bPos.y >= 0.42 && bPos.y <= 1.28 && Math.hypot(bPos.x, bPos.z) < 0.28) {
              const d = Math.abs(bPos.y - 0.82);
              if (d < bestDist) {
                bestDist = d;
                bestBone = ch;
              }
            }
          }
        });

        let invRestBoneMat = null;
        if (bestBone) {
          const restMat = new THREE.Matrix4().multiplyMatrices(invRootMat, bestBone.matrixWorld);
          invRestBoneMat = restMat.invert();
          upperWrap.matrixAutoUpdate = false;
        }

        dynamicPieceRegalia.push({
          root,
          upperWrap,
          bone: bestBone,
          invRestBoneMat,
          animRefs: customMats.animRefs,
          phaseSeed: (r * 7 + c * 13) * 0.37
        });
      }

      const pieceObj = {
        type,
        color,
        r,
        c,
        mesh: root,
        mixer,
        actions,
        currentAction: null,
        hasMoved: false
      };

      root.traverse((child) => {
        child.userData.piece = pieceObj;
      });

      playPieceClip(pieceObj, 'Idle', true, 0);
      return pieceObj;
    }

    // Exact per-piece Attack keyframe synchronization (24 fps Blender clips, zero overhead suspension freeze):
    const ATTACK_SYNC_PROFILES = {
      pawn:        { timeScale: 1.15, swingStartClip: 0.36, contactClip: 0.60, blowClip: 0.78, maxLunge: 0.095 },
      king:        { timeScale: 1.10, swingStartClip: 0.34, contactClip: 0.56, blowClip: 0.75, maxLunge: 0.080 },
      queen:       { timeScale: 1.08, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.065 },
      rook:        { timeScale: 1.06, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.055 },
      knight:      { timeScale: 1.08, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.060 },
      bishop:      { timeScale: 1.08, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.065 },
      demon_rider: { timeScale: 1.14, swingStartClip: 0.34, contactClip: 0.57, blowClip: 0.76, maxLunge: 0.085 },
      archbishop:  { timeScale: 1.10, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.070 },
      chancellor:  { timeScale: 1.08, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.065 },
      wizard:      { timeScale: 1.12, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.075 },
      dragon:      { timeScale: 1.10, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.075 }
    };

    function playPieceClip(piece, clipKeyword, loop = true, fadeSeconds = 0.18) {
      if (!piece || !piece.actions) return;
      const lowerKw = clipKeyword.toLowerCase();
      const key = Object.keys(piece.actions).find((k) =>
        k.toLowerCase().includes(lowerKw)
      );
      if (!key) return;
      const nextAction = piece.actions[key];
      const isIdle = lowerKw.includes('idle');
      const isAttack = lowerKw.includes('attack');
      if (piece.currentAction && piece.currentAction !== nextAction) {
        piece.currentAction.fadeOut(fadeSeconds);
      }
      nextAction.reset();
      nextAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
      nextAction.clampWhenFinished = !loop;
      if (isAttack) {
        const prof = ATTACK_SYNC_PROFILES[piece.type] || ATTACK_SYNC_PROFILES.queen;
        nextAction.timeScale = prof.timeScale;
      } else {
        // Deliberate, weighty stone stride and idle breathing (another 10% slower than 0.90)
        nextAction.timeScale = 0.81;
      }
      if (isIdle && (!fadeSeconds || fadeSeconds <= 0.01)) {
        // Stagger initial idle phase per board square so the 32 pieces breathe organically out of lockstep
        nextAction.time = ((piece.r * 5 + piece.c * 3) % 16) * 0.11;
      }
      nextAction.fadeIn(fadeSeconds).play();
      piece.currentAction = nextAction;
      if (piece.mixer) {
        piece.mixer.update(0.016);
      }
      renderer.shadowMap.needsUpdate = true;
    }

    function clearAllPieces() {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (boardState[r][c] && boardState[r][c].mesh) {
            scene.remove(boardState[r][c].mesh);
          }
          boardState[r][c] = null;
        }
      }
      activeMixers.length = 0;
      dynamicPieceRegalia.length = 0;
    }

    // Scripted Chess Notation & Step-Through Choreography State (Features 3a, 3b, 3c)
    let scriptedGameActive = false;
    let scriptDeviated = false;
    let scriptMoves = [];
    let scriptCursor = 0;
    let moveHistory = [];
    let preMoveHighlightTask = null;
    let activeDuelSavedCam = null;
    let checkmateState = {
      active: false,
      bannerVisible: false,
      defeatedColor: null,
      winnerColor: null,
      kingFallAngleDeg: 0,
      phase: 'none'
    };

    function clearCheckmateSequence() {
      checkmateState.active = false;
      checkmateState.bannerVisible = false;
      checkmateState.defeatedColor = null;
      checkmateState.winnerColor = null;
      checkmateState.kingFallAngleDeg = 0;
      checkmateState.phase = 'none';
      const overlay = document.getElementById('checkmate-overlay');
      if (overlay) {
        overlay.classList.remove('visible');
      }
    }

    function captureBoardSnapshot() {
      return {
        currentTurn,
        gameOver,
        capturedByWhite,
        capturedByBlack,
        scriptCursor,
        scriptedGameActive,
        scriptDeviated,
        cells: boardState.map((row) =>
          row.map((p) => (p ? { type: p.type, color: p.color, hasMoved: Boolean(p.hasMoved) } : null))
        )
      };
    }

    function restoreBoardSnapshot(snap) {
      if (!snap) return false;
      if (aiTimer) {
        clearTimeout(aiTimer);
        aiTimer = null;
      }
      preMoveHighlightTask = null;
      activeMoveTweens.length = 0;
      clearCheckmateSequence();
      for (const d of shatterDebris) {
        if (d.mesh) scene.remove(d.mesh);
      }
      shatterDebris.length = 0;
      impactFlashLight.intensity = 0;
      impactFlashLight.visible = false;
      if (activeDuelSavedCam) {
        camera.position.copy(activeDuelSavedCam.pos);
        orbitControls.target.copy(activeDuelSavedCam.target);
        activeDuelSavedCam = null;
      }
      orbitControls.enabled = true;
      orbitControls.update();

      clearAllPieces();
      clearSquareHighlights();
      selectedSquare = null;
      validMoves = [];
      isAnimatingMove = false;
      currentTurn = snap.currentTurn;
      gameOver = snap.gameOver;
      capturedByWhite = snap.capturedByWhite;
      capturedByBlack = snap.capturedByBlack;
      if (typeof snap.scriptCursor === 'number') {
        scriptCursor = snap.scriptCursor;
      }
      if (typeof snap.scriptedGameActive === 'boolean') {
        scriptedGameActive = snap.scriptedGameActive;
      }
      if (typeof snap.scriptDeviated === 'boolean') {
        scriptDeviated = snap.scriptDeviated;
      }

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const cell = snap.cells[r][c];
          if (cell) {
            const inst = instantiatePiece(cell.type, cell.color, r, c);
            inst.hasMoved = Boolean(cell.hasMoved);
            boardState[r][c] = inst;
          }
        }
      }

      renderer.shadowMap.needsUpdate = true;
      updateTurnUI();
      if (typeof updateScriptBarUI === 'function') updateScriptBarUI();
      return true;
    }

    function resetChessBoard(orientCamera = true, preserveScript = false) {
      if (aiTimer) {
        clearTimeout(aiTimer);
        aiTimer = null;
      }
      preMoveHighlightTask = null;
      activeMoveTweens.length = 0;
      clearCheckmateSequence();
      if (activeDuelSavedCam) {
        camera.position.copy(activeDuelSavedCam.pos);
        orbitControls.target.copy(activeDuelSavedCam.target);
        activeDuelSavedCam = null;
      }
      orbitControls.enabled = true;
      clearAllPieces();
      clearSquareHighlights();
      selectedSquare = null;
      validMoves = [];
      currentTurn = 'w';
      isAnimatingMove = false;
      gameOver = false;
      capturedByWhite = 0;
      capturedByBlack = 0;
      moveHistory = [];
      scriptDeviated = false;
      if (!preserveScript) {
        scriptCursor = 0;
      }

      const activeFormation = preserveScript
        ? ARMY_FORMATIONS[2]
        : (ARMY_FORMATIONS[currentArmyFormationIdx] || ARMY_FORMATIONS[0]);
      const backRow = activeFormation.backRow;
      for (let c = 0; c < 8; c++) {
        boardState[7][c] = instantiatePiece(backRow[c], 'w', 7, c);
        boardState[6][c] = instantiatePiece('pawn', 'w', 6, c);
        boardState[1][c] = instantiatePiece('pawn', 'b', 1, c);
        boardState[0][c] = instantiatePiece(backRow[c], 'b', 0, c);
      }

      if (orientCamera) {
        const viewSide = playerColor === 'b' ? 'b' : 'w';
        playerCamSide = viewSide;
        setActiveCamButton('btn-cam-player');
        setCameraForSide(viewSide, false);
      }

      if (typeof clearBoardTrapAndShieldMeshes === 'function') {
        clearBoardTrapAndShieldMeshes();
      }
      while (battleScarsGroup.children.length > 0) {
        battleScarsGroup.remove(battleScarsGroup.children[0]);
      }
      renderer.shadowMap.needsUpdate = true;
      updateTurnUI();
      if (typeof updateScriptBarUI === 'function') updateScriptBarUI();
      maybeScheduleAIMove();
    }

    // =========================================================================
    // Legal Chess Move Generation (Including Check Filtering)
    // =========================================================================
    function getPseudoMovesForPiece(r, c, board = boardState) {
      const piece = board[r][c];
      if (!piece) return [];
      const moves = [];
      const { type, color } = piece;
      const dir = color === 'w' ? -1 : 1;

      const inBounds = (nr, nc) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8;
      const addMove = (nr, nc) => {
        if (!inBounds(nr, nc)) return false;
        const target = board[nr][nc];
        if (!target) {
          moves.push({ r: nr, c: nc, capture: false });
          return true;
        } else if (target.color !== color) {
          moves.push({ r: nr, c: nc, capture: true });
          return false;
        }
        return false;
      };

      if (type === 'pawn') {
        if (inBounds(r + dir, c) && !board[r + dir][c]) {
          moves.push({ r: r + dir, c, capture: false });
          const startRow = color === 'w' ? 6 : 1;
          if (r === startRow && !board[r + dir * 2][c]) {
            moves.push({ r: r + dir * 2, c, capture: false });
          }
        }
        for (const dc of [-1, 1]) {
          if (inBounds(r + dir, c + dc)) {
            const target = board[r + dir][c + dc];
            if (target && target.color !== color) {
              moves.push({ r: r + dir, c: c + dc, capture: true });
            }
          }
        }
      } else if (type === 'knight') {
        const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of jumps) addMove(r + dr, c + dc);
      } else if (type === 'archbishop') {
        // Archbishop = Bishop (diagonal slide) + Knight (L-jump over pieces)
        const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of jumps) addMove(r + dr, c + dc);
        for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
          for (let step = 1; step < 8; step++) {
            if (!addMove(r + dr * step, c + dc * step)) break;
          }
        }
      } else if (type === 'chancellor') {
        // Chancellor = Rook (orthogonal slide) + Knight (L-jump over pieces)
        const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of jumps) addMove(r + dr, c + dc);
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          for (let step = 1; step < 8; step++) {
            if (!addMove(r + dr * step, c + dc * step)) break;
          }
        }
      } else if (type === 'wizard') {
        // Wizard = 1-step diagonal (Ferz) + Arcane Teleport Leaps ((3,1)/(1,3) Camel & 2-square Alfil/Dabbaba jumps)
        for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
          addMove(r + dr, c + dc);
        }
        const teleports = [
          [-2, 0], [2, 0], [0, -2], [0, 2],
          [-2, -2], [-2, 2], [2, -2], [2, 2],
          [-3, -1], [-3, 1], [-1, -3], [-1, 3],
          [1, -3], [1, 3], [3, -1], [3, 1]
        ];
        for (const [dr, dc] of teleports) addMove(r + dr, c + dc);
      } else if (type === 'dragon') {
        // Dragon = Rook (orthogonal slide) + King (1-step diagonal) + Winged Swoop (2-square diagonal jump)
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          for (let step = 1; step < 8; step++) {
            if (!addMove(r + dr * step, c + dc * step)) break;
          }
        }
        for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-2,-2],[-2,2],[2,-2],[2,2]]) {
          addMove(r + dr, c + dc);
        }
      } else if (type === 'demon_rider') {
        // Demon Rider (Всадник Демона) = Knight L-Jump (2x1) + Hellfire Cavalry Charge up to 3 squares in all 8 directions
        const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of jumps) addMove(r + dr, c + dc);
        const chargeDirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, dc] of chargeDirs) {
          for (let step = 1; step <= 3; step++) {
            if (!addMove(r + dr * step, c + dc * step)) break;
          }
        }
      } else if (type === 'king') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) addMove(r + dr, c + dc);
          }
        }
      } else {
        const dirs = [];
        if (type === 'rook' || type === 'queen') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
        if (type === 'bishop' || type === 'queen') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
        for (const [dr, dc] of dirs) {
          for (let step = 1; step < 8; step++) {
            if (!addMove(r + dr * step, c + dc * step)) break;
          }
        }
      }
      return moves;
    }

    function isKingInCheck(color, board = boardState) {
      let kingR = -1;
      let kingC = -1;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.color === color && p.type === 'king') {
            kingR = r;
            kingC = c;
            break;
          }
        }
      }
      if (kingR === -1) return true;
      const oppColor = color === 'w' ? 'b' : 'w';
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.color === oppColor) {
            const oppMoves = getPseudoMovesForPiece(r, c, board);
            if (oppMoves.some((m) => m.r === kingR && m.c === kingC)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function getLegalMovesForPiece(r, c) {
      const piece = boardState[r][c];
      if (!piece) return [];
      const pseudo = getPseudoMovesForPiece(r, c, boardState);
      const legal = [];
      for (const m of pseudo) {
        // Respect Hellfire Traps & Arcane Shields from Active Abilities
        if (typeof isMoveBlockedByTrapOrShield === 'function' && isMoveBlockedByTrapOrShield(piece, m.r, m.c)) {
          continue;
        }
        const savedTarget = boardState[m.r][m.c];
        boardState[m.r][m.c] = piece;
        boardState[r][c] = null;
        const inCheck = isKingInCheck(piece.color, boardState);
        boardState[r][c] = piece;
        boardState[m.r][m.c] = savedTarget;
        if (!inCheck) legal.push(m);
      }

      // Castling (Kingside O-O to c=6, Queenside O-O-O to c=2)
      const homeRow = piece.color === 'w' ? 7 : 0;
      if (
        piece.type === 'king' &&
        !piece.hasMoved &&
        r === homeRow &&
        c === 4 &&
        !isKingInCheck(piece.color, boardState)
      ) {
        // Kingside (O-O: King e->g [4->6], Rook/Chancellor h->f [7->5])
        const kRook = boardState[homeRow][7];
        if (
          kRook &&
          (kRook.type === 'rook' || kRook.type === 'chancellor') &&
          kRook.color === piece.color &&
          !kRook.hasMoved &&
          !boardState[homeRow][5] &&
          !boardState[homeRow][6]
        ) {
          boardState[homeRow][5] = piece;
          boardState[homeRow][4] = null;
          const checkF = isKingInCheck(piece.color, boardState);
          boardState[homeRow][6] = piece;
          boardState[homeRow][5] = null;
          const checkG = isKingInCheck(piece.color, boardState);
          boardState[homeRow][4] = piece;
          boardState[homeRow][6] = null;
          if (!checkF && !checkG) {
            legal.push({ r: homeRow, c: 6, capture: false, castle: 'k', rookFromC: 7, rookToC: 5 });
          }
        }
        // Queenside (O-O-O: King e->c [4->2], Rook/Chancellor a->d [0->3])
        const qRook = boardState[homeRow][0];
        if (
          qRook &&
          (qRook.type === 'rook' || qRook.type === 'chancellor') &&
          qRook.color === piece.color &&
          !qRook.hasMoved &&
          !boardState[homeRow][1] &&
          !boardState[homeRow][2] &&
          !boardState[homeRow][3]
        ) {
          boardState[homeRow][3] = piece;
          boardState[homeRow][4] = null;
          const checkD = isKingInCheck(piece.color, boardState);
          boardState[homeRow][2] = piece;
          boardState[homeRow][3] = null;
          const checkC = isKingInCheck(piece.color, boardState);
          boardState[homeRow][4] = piece;
          boardState[homeRow][2] = null;
          if (!checkD && !checkC) {
            legal.push({ r: homeRow, c: 2, capture: false, castle: 'q', rookFromC: 0, rookToC: 3 });
          }
        }
      }

      return legal;
    }

    function getAllLegalMoves(color) {
      const all = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = boardState[r][c];
          if (p && p.color === color) {
            const moves = getLegalMovesForPiece(r, c);
            for (const m of moves) {
              all.push({ fromR: r, fromC: c, toR: m.r, toC: m.c, capture: m.capture });
            }
          }
        }
      }
      return all;
    }

    // =========================================================================
    // Square Highlights
    // =========================================================================
    function clearSquareHighlights() {
      while (squareHighlightsGroup.children.length > 0) {
        squareHighlightsGroup.remove(squareHighlightsGroup.children[0]);
      }
    }

    function showSquareHighlights(r, c, moves) {
      clearSquareHighlights();
      const selGeo = new THREE.RingGeometry(0.115, 0.155, 32);
      selGeo.rotateX(-Math.PI / 2);
      const selMat = new THREE.MeshBasicMaterial({ color: 0xf5d76e, side: THREE.DoubleSide });
      const selMesh = new THREE.Mesh(selGeo, selMat);
      const selPos = boardToWorld(r, c);
      selMesh.position.set(selPos.x, BOARD_SURFACE_Y + 0.01, selPos.z);
      squareHighlightsGroup.add(selMesh);

      // Volumetric Selection God-Ray Beam illuminating the chosen piece from above
      const selBeamGeo = new THREE.CylinderGeometry(0.05, 0.165, 2.6, 20, 1, true);
      const selBeamMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const selBeamMesh = new THREE.Mesh(selBeamGeo, selBeamMat);
      selBeamMesh.position.set(selPos.x, BOARD_SURFACE_Y + 1.3, selPos.z);
      squareHighlightsGroup.add(selBeamMesh);

      for (const m of moves) {
        const pos = boardToWorld(m.r, m.c);
        if (m.capture) {
          const capGeo = new THREE.RingGeometry(0.12, 0.16, 32);
          capGeo.rotateX(-Math.PI / 2);
          const capMat = new THREE.MeshBasicMaterial({ color: 0xe63946, side: THREE.DoubleSide });
          const capMesh = new THREE.Mesh(capGeo, capMat);
          capMesh.position.set(pos.x, BOARD_SURFACE_Y + 0.012, pos.z);
          squareHighlightsGroup.add(capMesh);
        } else {
          const dotGeo = new THREE.CircleGeometry(0.06, 24);
          dotGeo.rotateX(-Math.PI / 2);
          const dotMat = new THREE.MeshBasicMaterial({
            color: 0x4ea8de,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
          });
          const dotMesh = new THREE.Mesh(dotGeo, dotMat);
          dotMesh.position.set(pos.x, BOARD_SURFACE_Y + 0.01, pos.z);
          squareHighlightsGroup.add(dotMesh);
        }
      }
    }

    // =========================================================================
    // Stone Shatter Debris Physics + Elemental Combat VFX + Persistent Battle Scars
    // =========================================================================
    const sharedShardGeo = new THREE.DodecahedronGeometry(1, 0);

    function spawnBattleScarOnSquare(worldPos, attackerType = 'queen') {
      const scarGroup = new THREE.Group();
      scarGroup.position.set(worldPos.x, BOARD_SURFACE_Y + 0.0022, worldPos.z);

      let scarHex = 0xff6a00;
      if (attackerType === 'wizard') scarHex = 0xc084fc;
      else if (attackerType === 'archbishop' || attackerType === 'queen' || attackerType === 'king') scarHex = 0xfacc15;
      else if (attackerType === 'demon_rider' || attackerType === 'dragon') scarHex = 0xff2a00;

      // Scorched impact ring
      const scorchDisk = new THREE.Mesh(
        new THREE.CircleGeometry(0.145, 20),
        new THREE.MeshBasicMaterial({
          color: 0x050507,
          transparent: true,
          opacity: 0.62,
          depthWrite: false
        })
      );
      scorchDisk.rotation.x = -Math.PI / 2;
      scarGroup.add(scorchDisk);

      // Glowing elemental fracture ring inside crater
      const emberRing = new THREE.Mesh(
        new THREE.RingGeometry(0.04, 0.115, 16),
        new THREE.MeshBasicMaterial({
          color: scarHex,
          transparent: true,
          opacity: 0.48,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      emberRing.rotation.x = -Math.PI / 2;
      emberRing.position.y = 0.0008;
      scarGroup.add(emberRing);

      // Small resting stone rubble shards around the square perimeter
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.random() * 0.6;
        const rad = 0.12 + Math.random() * 0.035;
        const rub = new THREE.Mesh(sharedShardGeo, blackPieceMat);
        rub.scale.set(0.016, 0.009, 0.014);
        rub.position.set(Math.cos(ang) * rad, 0.006, Math.sin(ang) * rad);
        rub.rotation.set(Math.random(), Math.random(), Math.random());
        scarGroup.add(rub);
      }

      battleScarsGroup.add(scarGroup);
    }

    function spawnElementalCombatVFX(worldPos, attackerType = 'queen') {
      let vfxColor = 0xff6a00;
      if (attackerType === 'demon_rider') vfxColor = 0xff1e00;
      else if (attackerType === 'wizard') vfxColor = 0xd946ef;
      else if (attackerType === 'dragon') vfxColor = 0xff5500;
      else if (attackerType === 'archbishop' || attackerType === 'queen' || attackerType === 'king') vfxColor = 0xfde047;
      else vfxColor = 0x38bdf8;

      const vfxGroup = new THREE.Group();
      vfxGroup.position.copy(worldPos);
      scene.add(vfxGroup);

      // 1. Expanding Elemental Shockwave Torus
      const ringMat = new THREE.MeshBasicMaterial({
        color: vfxColor,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const shockRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 12, 36), ringMat);
      shockRing.rotation.x = Math.PI / 2;
      shockRing.position.y = 0.04;
      vfxGroup.add(shockRing);

      // 2. Vertical Energy / Flame / Lightning Pillar
      const pillarH =
        attackerType === 'archbishop' || attackerType === 'queen' || attackerType === 'king'
          ? 3.6
          : 1.45;
      const pillarMat = new THREE.MeshBasicMaterial({
        color: vfxColor,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const pillarGeo =
        attackerType === 'wizard'
          ? new THREE.IcosahedronGeometry(0.24, 1)
          : new THREE.CylinderGeometry(0.03, 0.22, pillarH, 16, 1, true);
      const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pillarMesh.position.y = attackerType === 'wizard' ? 0.32 : pillarH * 0.5;
      vfxGroup.add(pillarMesh);

      combatVfxList.push({
        group: vfxGroup,
        shockRing,
        pillarMesh,
        ringMat,
        pillarMat,
        elapsed: 0,
        duration: 0.85
      });
    }

    function spawnStoneShatter(worldPos, color, attackerType = 'queen') {
      const mat = color === 'w' ? whitePieceMat : blackPieceMat;
      for (let i = 0; i < 36; i++) {
        const sz = 0.024 + Math.random() * 0.048;
        const frag = new THREE.Mesh(sharedShardGeo, mat);
        frag.scale.setScalar(sz);
        frag.position.set(
          worldPos.x + (Math.random() - 0.5) * 0.16,
          worldPos.y + 0.10 + Math.random() * 0.28,
          worldPos.z + (Math.random() - 0.5) * 0.16
        );
        frag.castShadow = true;
        scene.add(frag);
        shatterDebris.push({
          mesh: frag,
          baseScale: sz,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 2.4,
            1.3 + Math.random() * 2.1,
            (Math.random() - 0.5) * 2.4
          ),
          rotVel: new THREE.Vector3(
            Math.random() * 9,
            Math.random() * 9,
            Math.random() * 9
          ),
          life: 2.3
        });
      }
      spawnElementalCombatVFX(worldPos, attackerType);
      spawnBattleScarOnSquare(worldPos, attackerType);
      impactFlashLight.position.set(worldPos.x, worldPos.y + 0.45, worldPos.z);
      impactFlashLight.intensity = 9.5;
    }

    // =========================================================================
    // Concrete 3D Piece Dimensions & Anti-Clipping Collision Constants
    // =========================================================================
    const PIECE_HEIGHTS = {
      pawn: 0.36,
      rook: 0.46,
      knight: 0.50,
      bishop: 0.51,
      queen: 0.55,
      king: 0.59,
      demon_rider: 0.58,
      archbishop: 0.56,
      chancellor: 0.54,
      wizard: 0.60,
      dragon: 0.57
    };
    const MIN_PIECE_SEP = 0.318; // Stone pedestal diameter is ~0.29m; 0.318m enforces a solid concrete gap
    const MELEE_STANDOFF = 0.36; // Optimal melee standoff (1.06 squares) so sword blades visibly bridge the gap and cleave into defender before burst

    // =========================================================================
    // Smooth Attack Camera & Move Execution Choreography
    // =========================================================================
    function executeChessMove(fromR, fromC, toR, toC, options = {}) {
      const piece = boardState[fromR]?.[fromC];
      if (!piece || isAnimatingMove || gameOver) return false;
      if (piece.color !== currentTurn) return false;

      const targetOnDest = boardState[toR]?.[toC];
      // Strictly forbid friendly fire (a piece can never move onto or attack a piece of the same color)
      if (targetOnDest && targetOnDest.color === piece.color) {
        return false;
      }

      if (!options.fromRemote) {
        const legalForPiece = getLegalMovesForPiece(fromR, fromC);
        if (!legalForPiece.some((m) => m.r === toR && m.c === toC)) {
          return false;
        }
      }

      if (preMoveHighlightTask) {
        preMoveHighlightTask = null;
      }

      // Save board state snapshot (including pre-move scriptCursor & scriptDeviated) so Left Arrow / [ can step backward & re-record
      moveHistory.push({
        snapshot: captureBoardSnapshot(),
        move: {
          color: piece.color,
          pieceType: piece.type,
          fromR,
          fromC,
          toR,
          toC,
          capture: Boolean(targetOnDest),
          promotion: options.promotion || 'queen'
        }
      });

      // Advance scriptCursor if executing a scripted move or a manual move matching the script;
      // otherwise mark scriptDeviated = true and exit scriptedGameActive so the user takes over cleanly
      if (options.fromScript) {
        scriptCursor = Math.min(scriptMoves.length, scriptCursor + 1);
      } else if (!scriptDeviated && scriptCursor < scriptMoves.length) {
        const expected = scriptMoves[scriptCursor];
        if (
          expected &&
          expected.fromR === fromR &&
          expected.fromC === fromC &&
          expected.toR === toR &&
          expected.toC === toC
        ) {
          scriptCursor = Math.min(scriptMoves.length, scriptCursor + 1);
        } else {
          scriptDeviated = true;
          scriptedGameActive = false;
        }
      } else if (scriptMoves.length > 0) {
        scriptDeviated = true;
        scriptedGameActive = false;
      }
      if (typeof updateScriptBarUI === 'function') updateScriptBarUI();

      const captured = targetOnDest;
      const isCapture = Boolean(captured);
      isAnimatingMove = true;
      activeCamTransition = null;
      clearSquareHighlights();
      selectedSquare = null;
      validMoves = [];

      // Broadcast to multiplayer room (WebSocket + cloud API + BroadcastChannel fallback)
      if (gameMode === 'multi' && roomCode && !options.fromRemote) {
        sendMultiplayerMove({
          playerToken,
          color: piece.color,
          from: { r: fromR, c: fromC },
          to: { r: toR, c: toC },
          promotion: options.promotion || selectedPromotionType || 'archbishop'
        });
      }

      const startPos = boardToWorld(fromR, fromC);
      const endPos = boardToWorld(toR, toC);
      const dx = endPos.x - startPos.x;
      const dz = endPos.z - startPos.z;
      const dist = Math.hypot(dx, dz) || 1;
      const dirX = dx / dist;
      const dirZ = dz / dist;
      const moveHeading = Math.atan2(dx, dz);
      piece.mesh.rotation.y = moveHeading;
      playPieceClip(piece, 'Move', true, 0.10);
      if (typeof playSanctumSound === 'function') {
        playSanctumSound(piece.type === 'demon_rider' || piece.type === 'dragon' ? 'demon_move' : 'move');
      }

      // Detect Castling (King moves 2 files horizontally: e1->g1/c1 or e8->g8/c8) and animate the Rook simultaneously
      const isCastling = piece.type === 'king' && fromR === toR && Math.abs(toC - fromC) === 2;
      const castleRookFromC = isCastling ? (toC > fromC ? 7 : 0) : -1;
      const castleRookToC = isCastling ? (toC > fromC ? 5 : 3) : -1;
      const castleRook = isCastling ? boardState[fromR][castleRookFromC] : null;
      const castleRookStartPos = castleRook ? boardToWorld(fromR, castleRookFromC) : null;
      const castleRookEndPos = castleRook ? boardToWorld(fromR, castleRookToC) : null;
      if (castleRook && castleRook.mesh) {
        const rDx = castleRookEndPos.x - castleRookStartPos.x;
        const rDz = castleRookEndPos.z - castleRookStartPos.z;
        castleRook.mesh.rotation.y = Math.atan2(rDx, rDz);
        playPieceClip(castleRook, 'Move', true, 0.10);
      }

      // Defending enemy statue turns to face the incoming attacker shield-to-shield
      if (isCapture && captured && captured.mesh) {
        captured.mesh.rotation.y = Math.atan2(-dx, -dz);
      }

      // Full Concrete Standoff Distance for Melee Strike (0.36m for multi-square captures, scaled to 0.76*dist for 1-square captures so attacker always steps forward)
      const stopOffset = isCapture ? Math.min(MELEE_STANDOFF, dist * 0.76) : 0;
      const strikePos = new THREE.Vector3(
        endPos.x - dirX * stopOffset,
        BOARD_SURFACE_Y,
        endPos.z - dirZ * stopOffset
      );

      // Collect all bystander pieces (both friendly and enemy) on the board for concrete collision avoidance
      const bystanders = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const other = boardState[r][c];
          if (other && other !== piece && other !== captured && other.mesh) {
            bystanders.push({
              piece: other,
              homePos: boardToWorld(r, c),
              height: PIECE_HEIGHTS[other.type] || 0.45
            });
          }
        }
      }

      // Pre-analyze Knight path vs bystanders so Knights cleanly skirt single blockers or vault high over walls
      const segDx = (isCapture ? strikePos.x : endPos.x) - startPos.x;
      const segDz = (isCapture ? strikePos.z : endPos.z) - startPos.z;
      const segLen = Math.hypot(segDx, segDz) || 0.001;
      const segUx = segDx / segLen;
      const segUz = segDz / segLen;
      const segPerpX = -segUz;
      const segPerpZ = segUx;

      const absDr = Math.abs(toR - fromR);
      const absDc = Math.abs(toC - fromC);
      const isLJumpMove = (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
      const isArcaneOrWingJump =
        isLJumpMove ||
        (piece.type === 'wizard' && Math.max(absDr, absDc) > 1) ||
        (piece.type === 'dragon' && absDr === 2 && absDc === 2);

      let knightLateralSign = 0;
      let knightVaultPeak = 0;
      if (isArcaneOrWingJump) {
        let blockedPosSide = false;
        let blockedNegSide = false;
        let maxBlockerHeight = 0;
        for (const b of bystanders) {
          const relX = b.homePos.x - startPos.x;
          const relZ = b.homePos.z - startPos.z;
          const proj = relX * segUx + relZ * segUz;
          if (proj > 0.04 && proj < segLen - 0.04) {
            const signedPerp = relX * segPerpX + relZ * segPerpZ;
            if (Math.abs(signedPerp) < MIN_PIECE_SEP) {
              if (signedPerp >= 0) blockedPosSide = true;
              if (signedPerp <= 0) blockedNegSide = true;
              if (b.height > maxBlockerHeight) maxBlockerHeight = b.height;
            }
          }
        }
        if (piece.type === 'wizard' || (piece.type === 'dragon' && absDr === 2 && absDc === 2)) {
          knightVaultPeak = Math.max(0.42, maxBlockerHeight + 0.11);
        } else if (blockedPosSide && !blockedNegSide) {
          knightLateralSign = -1; // Skirt cleanly around the open -perp channel
        } else if (blockedNegSide && !blockedPosSide) {
          knightLateralSign = 1;  // Skirt cleanly around the open +perp channel
        } else if (blockedPosSide && blockedNegSide) {
          // Solid wall of pieces across both L-channels: vault high above the tallest blocker's crown/helmet
          knightVaultPeak = maxBlockerHeight + 0.09;
        }
      }

      function resetBystandersToHome() {
        for (const b of bystanders) {
          b.piece.mesh.position.copy(b.homePos);
        }
      }

      // Concrete 3D Trajectory Solver: enforces zero mesh intersection against all friendly & enemy bystanders
      const isDiagonalSlide =
        absDr === absDc &&
        absDr >= 1 &&
        !isArcaneOrWingJump;

      function applyConcreteTrajectory(u, fromVec, toVec) {
        const ease = isCapture ? (0.28 * u + 0.72 * easeInOutCubic(u)) : easeInOutCubic(u);
        let bx = fromVec.x + (toVec.x - fromVec.x) * ease;
        let bz = fromVec.z + (toVec.z - fromVec.z) * ease;
        let by = BOARD_SURFACE_Y;

        const archSin = Math.sin(u * Math.PI);

        if (isArcaneOrWingJump) {
          if (knightLateralSign !== 0) {
            // Curve horizontally through the open L-corridor
            bx += segPerpX * knightLateralSign * 0.165 * archSin;
            bz += segPerpZ * knightLateralSign * 0.165 * archSin;
            by = BOARD_SURFACE_Y + archSin * 0.08;
          } else if (knightVaultPeak > 0) {
            // Broad, high stone-steed / winged / arcane vault that clears the full height of blocking pieces
            by = BOARD_SURFACE_Y + Math.pow(archSin, 0.65) * knightVaultPeak;
          } else {
            by = BOARD_SURFACE_Y + archSin * 0.10;
          }
        }

        // Check every bystander (friendly or enemy) for concrete 3D non-penetration
        const effectiveMinSep = isDiagonalSlide ? 0.262 : MIN_PIECE_SEP;
        for (const b of bystanders) {
          const hx = b.homePos.x;
          const hz = b.homePos.z;
          const dHomeX = bx - hx;
          const dHomeZ = bz - hz;
          const dHome = Math.hypot(dHomeX, dHomeZ);

          // If the moving piece is already vertically above this bystander's top + 2.5cm margin, no horizontal push needed
          if (by >= BOARD_SURFACE_Y + b.height + 0.025) {
            b.piece.mesh.position.copy(b.homePos);
            continue;
          }

          // When squeezing diagonally between adjacent pieces, bystanders subtly yield outward within their square
          if (dHome < 0.36 && dHome > 0.001 && knightVaultPeak === 0) {
            const yieldProx = Math.max(0, (0.36 - dHome) / 0.36) * archSin;
            const yieldDist = Math.min(0.068, yieldProx * 0.082);
            b.piece.mesh.position.set(
              hx - (dHomeX / dHome) * yieldDist,
              BOARD_SURFACE_Y,
              hz - (dHomeZ / dHome) * yieldDist
            );
          } else {
            b.piece.mesh.position.copy(b.homePos);
          }

          // Hard concrete cylinder separation against bystander's instantaneous position
          const curBx = b.piece.mesh.position.x;
          const curBz = b.piece.mesh.position.z;
          const sepX = bx - curBx;
          const sepZ = bz - curBz;
          const sepDist = Math.hypot(sepX, sepZ);

          if (sepDist < effectiveMinSep) {
            if (piece.type === 'knight' && knightVaultPeak > 0) {
              // Ensure Knight pedestal bottom clears the blocker's crown/helmet
              by = Math.max(by, BOARD_SURFACE_Y + b.height + 0.03);
            } else if (sepDist > 0.0001) {
              const push = effectiveMinSep - sepDist;
              bx += (sepX / sepDist) * push;
              bz += (sepZ / sepDist) * push;
            } else {
              bx += segPerpX * effectiveMinSep;
              bz += segPerpZ * effectiveMinSep;
            }
          }
        }

        piece.mesh.position.set(bx, by, bz);
      }

      // Save Player Camera State for Smooth Eased Entry & Return
      const savedCamPos = camera.position.clone();
      const savedTarget = orbitControls.target.clone();

      // Calculate Optimal Unobstructed 3/4 Duel Camera Angle
      const midPoint = new THREE.Vector3(
        (strikePos.x + endPos.x) * 0.5,
        BOARD_SURFACE_Y + 0.32,
        (strikePos.z + endPos.z) * 0.5
      );

      // Score both perpendicular sides for foreground bystander occlusion across both mid and close camera poses
      const perpA = new THREE.Vector3(-dirZ, 0, dirX);
      const perpB = new THREE.Vector3(dirZ, 0, -dirX);
      const camFromMid = new THREE.Vector3().subVectors(savedCamPos, midPoint);
      const prefPerp = camFromMid.dot(perpA) >= 0 ? perpA : perpB;
      const altPerp = prefPerp === perpA ? perpB : perpA;

      function scoreDuelPerpOcclusion(perpVec) {
        let penalty = 0;
        const probes = [
          { perpMul: 1.24, dirMul: -0.34 },
          { perpMul: 0.92, dirMul: 0.14 }
        ];
        for (const pr of probes) {
          const camX = midPoint.x + perpVec.x * pr.perpMul + dirX * pr.dirMul;
          const camZ = midPoint.z + perpVec.z * pr.perpMul + dirZ * pr.dirMul;
          const rayX = midPoint.x - camX;
          const rayZ = midPoint.z - camZ;
          const rayLenSq = Math.max(0.0001, rayX * rayX + rayZ * rayZ);
          for (const b of bystanders) {
            const bPos = b.piece && b.piece.mesh ? b.piece.mesh.position : b.homePos;
            if (!bPos) continue;
            const px = bPos.x - camX;
            const pz = bPos.z - camZ;
            const t = (px * rayX + pz * rayZ) / rayLenSq;
            if (t > 0.10 && t < 0.98) {
              const cx = camX + rayX * t;
              const cz = camZ + rayZ * t;
              const distB = Math.hypot(bPos.x - cx, bPos.z - cz);
              if (distB < 0.44) {
                penalty += (0.44 - distB) * 12.0;
              }
            }
          }
        }
        return penalty;
      }

      const chosenPerp =
        scoreDuelPerpOcclusion(prefPerp) > scoreDuelPerpOcclusion(altPerp) + 0.25 ? altPerp : prefPerp;

      // Continuous Quadratic Bezier 3/4 orbit-and-dolly arc (savedCamPos -> duelCamMid -> duelCamClose)
      // so the attack camera glides in a single unbroken C-infinity sweep across approach + strike without ever stalling at tApproach
      const duelCamMid = new THREE.Vector3(
        midPoint.x + chosenPerp.x * 1.34 - dirX * 0.44,
        BOARD_SURFACE_Y + 0.96,
        midPoint.z + chosenPerp.z * 1.34 - dirZ * 0.44
      );
      const duelCamClose = new THREE.Vector3(
        midPoint.x + chosenPerp.x * 0.92 + dirX * 0.18,
        BOARD_SURFACE_Y + 0.74,
        midPoint.z + chosenPerp.z * 0.92 + dirZ * 0.18
      );
      const duelTargetStart = new THREE.Vector3(
        strikePos.x + dirX * 0.10,
        BOARD_SURFACE_Y + 0.34,
        strikePos.z + dirZ * 0.10
      );
      const duelTargetEnd = new THREE.Vector3(
        endPos.x - dirX * 0.05,
        BOARD_SURFACE_Y + 0.30,
        endPos.z - dirZ * 0.05
      );

      function evalQuadraticBezier(outVec, p0, p1, p2, t) {
        const inv = 1 - t;
        const c0 = inv * inv;
        const c1 = 2 * inv * t;
        const c2 = t * t;
        outVec.set(
          c0 * p0.x + c1 * p1.x + c2 * p2.x,
          c0 * p0.y + c1 * p1.y + c2 * p2.y,
          c0 * p0.z + c1 * p1.z + c2 * p2.z
        );
      }

      if (isCapture) {
        activeDuelSavedCam = {
          pos: savedCamPos.clone(),
          target: savedTarget.clone()
        };
        orbitControls.enabled = false;
        cameraTelemetry.lastAttackSamples = [];
        cameraTelemetry.attackCount += 1;
        cameraTelemetry.maxStepDelta = 0;
        cameraTelemetry.minCombatSeparation = Infinity;
      } else {
        cameraTelemetry.lastSpaceMoveSamples = [];
      }

      // Distance-scaled piece movement duration (slowed by ~12-18% + scaled per square so 4-5 space Bishop/Rook/Queen glides feel weighty and unhurried):
      // - 1 square move: 0.64s
      // - 4-5 square move: 1.10s - 1.29s
      const squaresMoved = Math.max(1, Math.hypot(toR - fromR, toC - fromC));
      const stdMoveDuration = Number((0.64 + Math.max(0, squaresMoved - 1) * 0.14).toFixed(3));
      const atkProfile = ATTACK_SYNC_PROFILES[piece.type] || ATTACK_SYNC_PROFILES.queen;
      const SWING_START_CLIP_TIME = atkProfile.swingStartClip;
      const CONTACT_CLIP_TIME = atkProfile.contactClip; // Weapon physically strikes defender, triggering flash & flinch
      const BLOW_CLIP_TIME = atkProfile.blowClip;       // After visible weapon impact, defender explodes into stone shards
      const tApproach = isCapture
        ? Number((0.66 + Math.max(0, squaresMoved - 1) * 0.125).toFixed(3))
        : stdMoveDuration;
      const tContact = isCapture ? (tApproach + CONTACT_CLIP_TIME / atkProfile.timeScale) : stdMoveDuration;
      const tImpact = isCapture ? (tApproach + BLOW_CLIP_TIME / atkProfile.timeScale) : stdMoveDuration;
      const tStrikeDone = isCapture ? (tImpact + 0.48) : stdMoveDuration;
      // Slower, distance-aware post-attack camera return (~1.30s - 1.60s instead of 0.64s)
      const camReturnDist = savedCamPos.distanceTo(duelCamClose);
      const returnDuration = isCapture ? Number((1.18 + Math.min(0.42, camReturnDist * 0.10)).toFixed(3)) : 0;
      const totalDuration = isCapture ? (tStrikeDone + returnDuration) : stdMoveDuration;

      if (!isCapture) {
        cameraTelemetry.lastSpaceMoveDuration = stdMoveDuration;
        cameraTelemetry.lastSquaresMoved = Number(squaresMoved.toFixed(3));
      } else {
        cameraTelemetry.lastCaptureTiming = {
          pieceType: piece.type,
          squaresMoved: Number(squaresMoved.toFixed(3)),
          tApproach: Number(tApproach.toFixed(3)),
          tContact: Number(tContact.toFixed(3)),
          tImpact: Number(tImpact.toFixed(3)),
          tStrikeDone: Number(tStrikeDone.toFixed(3)),
          returnDuration: Number(returnDuration.toFixed(3)),
          totalDuration: Number(totalDuration.toFixed(3))
        };
      }

      let elapsed = 0;
      let attackAnimStarted = false;
      let defenderFlinchTriggered = false;
      let shatterTriggered = false;
      let impactActualTime = tImpact;
      const postShatterPiecePos = strikePos.clone();
      const postStrikePiecePos = strikePos.clone();
      let prevCamPos = camera.position.clone();
      let prevPiecePos = piece.mesh.position.clone();

      function finishMove() {
        resetBystandersToHome();
        boardState[fromR][fromC] = null;
        boardState[toR][toC] = piece;
        piece.r = toR;
        piece.c = toC;
        piece.hasMoved = true;

        if (isCastling && castleRook) {
          boardState[fromR][castleRookFromC] = null;
          boardState[fromR][castleRookToC] = castleRook;
          castleRook.r = fromR;
          castleRook.c = castleRookToC;
          castleRook.hasMoved = true;
          if (castleRook.mesh) {
            castleRook.mesh.position.copy(castleRookEndPos);
            castleRook.mesh.rotation.y = castleRook.color === 'w' ? Math.PI : 0;
          }
          playPieceClip(castleRook, 'Idle', true, 0.18);
        }

        // Pawn Promotion to Selected New Piece (or Queen)
        if (piece.type === 'pawn' && (toR === 0 || toR === 7)) {
          scene.remove(piece.mesh);
          const promoType = options.promotion || selectedPromotionType || 'archbishop';
          const promoted = instantiatePiece(promoType, piece.color, toR, toC);
          promoted.hasMoved = true;
          boardState[toR][toC] = promoted;
        } else {
          piece.mesh.position.copy(endPos);
          piece.mesh.rotation.y = piece.color === 'w' ? Math.PI : 0;
          playPieceClip(piece, 'Idle', true, 0.18);
        }

        if (isCapture) {
          if (piece.color === 'w') capturedByWhite += 1;
          else capturedByBlack += 1;
          activeDuelSavedCam = null;
          camera.position.copy(savedCamPos);
          orbitControls.target.copy(savedTarget);
          orbitControls.enabled = true;
          orbitControls.update();
        }

        if (isCapture && captured) {
          if (typeof recordCapturedPieceSymbol === 'function') {
            recordCapturedPieceSymbol(piece.color, captured.type);
          }
        }
        if (typeof tickAbilitiesOnTurnEnd === 'function') {
          tickAbilitiesOnTurnEnd();
        }
        currentTurn = currentTurn === 'w' ? 'b' : 'w';
        isAnimatingMove = false;
        updateTurnUI();
        maybeScheduleAIMove();
      }

      const isHeavyCapture =
        isCapture &&
        captured &&
        ['queen', 'dragon', 'demon_rider', 'archbishop', 'chancellor', 'wizard'].includes(captured.type);

      function stepMove(rawDt) {
        // Feature 6: Cinematic Slow-Motion on Heavy Piece Capture right around weapon contact & stone shatter
        let dt = rawDt;
        if (isHeavyCapture && elapsed >= tContact - 0.06 && elapsed <= tImpact + 0.18) {
          dt = rawDt * 0.42;
        }
        elapsed += dt;

        if (!isCapture) {
          const u = Math.min(1, elapsed / totalDuration);
          applyConcreteTrajectory(u, startPos, endPos);
          if (isCastling && castleRook && castleRook.mesh) {
            const rEase = easeInOutCubic(u);
            castleRook.mesh.position.set(
              castleRookStartPos.x + (castleRookEndPos.x - castleRookStartPos.x) * rEase,
              BOARD_SURFACE_Y + Math.sin(u * Math.PI) * 0.05,
              castleRookStartPos.z + (castleRookEndPos.z - castleRookStartPos.z) * rEase
            );
          }
          const pDelta = piece.mesh.position.distanceTo(prevPiecePos);
          prevPiecePos.copy(piece.mesh.position);
          cameraTelemetry.lastSpaceMoveSamples.push({
            t: Number(elapsed.toFixed(3)),
            u: Number(u.toFixed(3)),
            piecePos: [
              Number(piece.mesh.position.x.toFixed(3)),
              Number(piece.mesh.position.y.toFixed(3)),
              Number(piece.mesh.position.z.toFixed(3))
            ],
            pieceStep: Number(pDelta.toFixed(4))
          });
          if (u >= 1) {
            finishMove();
            return true;
          }
          return false;
        }

        // Capture Sequence with Continuous C-infinity Quadratic Bezier Camera & Zero-Freeze Piece Choreography
        let phaseName = 'approach';
        if (elapsed <= tStrikeDone) {
          // Single unbroken C-infinity camera arc across both approach and strike (never stops at tApproach!)
          const uActive = Math.min(1, elapsed / tStrikeDone);
          const sActive = 0.38 * uActive + 0.62 * easeInOutCubic(uActive);
          evalQuadraticBezier(camera.position, savedCamPos, duelCamMid, duelCamClose, sActive);
          evalQuadraticBezier(orbitControls.target, savedTarget, duelTargetStart, duelTargetEnd, sActive);

          if (elapsed <= tApproach) {
            // Phase 1: Smooth Glide-In to Concrete Standoff Position
            phaseName = 'approach';
            const u = Math.min(1, elapsed / tApproach);
            applyConcreteTrajectory(u, startPos, strikePos);
          } else {
            // Phase 2: Rigged Attack (Continuous Stalk -> Physical Weapon Impact -> Shatter Burst -> Follow-Through Advance)
            phaseName = 'strike';
            if (!attackAnimStarted) {
              attackAnimStarted = true;
              playPieceClip(piece, 'Attack', false, 0.08);
            }

            // Keep any bystanders immediately adjacent to strikePos yielded slightly outward during the weapon swing
            for (const b of bystanders) {
              const dxB = strikePos.x - b.homePos.x;
              const dzB = strikePos.z - b.homePos.z;
              const dB = Math.hypot(dxB, dzB);
              if (dB < 0.42 && dB > 0.001) {
                const yieldDist = ((0.42 - dB) / 0.42) * 0.068;
                b.piece.mesh.position.set(
                  b.homePos.x - (dxB / dB) * yieldDist,
                  BOARD_SURFACE_Y,
                  b.homePos.z - (dzB / dB) * yieldDist
                );
              } else {
                b.piece.mesh.position.copy(b.homePos);
              }
            }

            const atkClipTime = (elapsed - tApproach) * atkProfile.timeScale;

            // Keep attacker continuously moving forward during wind-up stalk, downward strike, and post-shatter follow-through
            if (!shatterTriggered && captured && captured.mesh) {
              const stalkLead = 0.028;
              let lungeOffset = 0;
              if (atkClipTime < SWING_START_CLIP_TIME) {
                const windupProgress = Math.min(1, atkClipTime / Math.max(0.05, SWING_START_CLIP_TIME));
                lungeOffset = windupProgress * stalkLead;
              } else {
                const slashPhase = Math.min(
                  1,
                  (atkClipTime - SWING_START_CLIP_TIME) / Math.max(0.05, BLOW_CLIP_TIME - SWING_START_CLIP_TIME)
                );
                lungeOffset =
                  stalkLead + Math.sin(slashPhase * Math.PI * 0.85) * Math.max(0.018, atkProfile.maxLunge - stalkLead);
              }
              piece.mesh.position.set(
                strikePos.x + dirX * lungeOffset,
                BOARD_SURFACE_Y,
                strikePos.z + dirZ * lungeOffset
              );
              if (atkClipTime < CONTACT_CLIP_TIME) {
                captured.mesh.position.copy(endPos);
              } else {
                // Weapon makes physical impact on defender before defender bursts
                const shoveProgress = Math.min(
                  1,
                  (atkClipTime - CONTACT_CLIP_TIME) / Math.max(0.04, BLOW_CLIP_TIME - CONTACT_CLIP_TIME)
                );
                const shoveDist = shoveProgress * 0.045;
                captured.mesh.position.set(
                  endPos.x + dirX * shoveDist,
                  BOARD_SURFACE_Y,
                  endPos.z + dirZ * shoveDist
                );
              }

              const curSep = piece.mesh.position.distanceTo(captured.mesh.position);
              if (curSep < (cameraTelemetry.minCombatSeparation ?? Infinity)) {
                cameraTelemetry.minCombatSeparation = Number(curSep.toFixed(3));
              }
            }

            // Contact: weapon physically strikes defender
            if (
              !defenderFlinchTriggered &&
              (atkClipTime >= CONTACT_CLIP_TIME || elapsed >= tContact + 0.06)
            ) {
              defenderFlinchTriggered = true;
              if (captured) {
                playPieceClip(captured, 'Shatter', false, 0.04);
                impactFlashLight.position.set(
                  endPos.x - dirX * 0.08,
                  BOARD_SURFACE_Y + 0.28,
                  endPos.z - dirZ * 0.08
                );
                impactFlashLight.intensity = 4.5;
              }
            }

            // Blow Burst: after visible weapon impact & follow-through, defender explodes into stone shards!
            if (!shatterTriggered && (atkClipTime >= BLOW_CLIP_TIME || elapsed >= tImpact + 0.06)) {
              shatterTriggered = true;
              impactActualTime = elapsed;
              postShatterPiecePos.copy(piece.mesh.position);
              if (captured && captured.mesh) {
                const shatterOrigin = captured.mesh.position.clone();
                scene.remove(captured.mesh);
                spawnStoneShatter(shatterOrigin, captured.color, piece.type);
                if (typeof playSanctumSound === 'function') {
                  playSanctumSound('capture');
                }
              }
            }

            // Immediately after shattering defender, attacker smoothly begins advancing toward endPos (no post-impact freeze!)
            if (shatterTriggered) {
              const postStrikeSpan = Math.max(0.08, tStrikeDone - impactActualTime);
              const uFollow = Math.min(1, Math.max(0, (elapsed - impactActualTime) / postStrikeSpan));
              piece.mesh.position.lerpVectors(postShatterPiecePos, endPos, uFollow * 0.38);
              postStrikePiecePos.copy(piece.mesh.position);
            }

            // Subtle damped perpendicular impact vibration right when the blow shatters the defender
            if (shatterTriggered && elapsed >= impactActualTime && elapsed <= impactActualTime + 0.26) {
              const shakeProgress = (elapsed - impactActualTime) / 0.26;
              const decay = (1 - shakeProgress) * (1 - shakeProgress);
              const amp = 0.024 * decay;
              camera.position.y += Math.sin(shakeProgress * Math.PI * 8) * amp;
            }
          }
        } else {
          // Phase 3: Complete Advance onto Captured Square & Smooth Unhurried Camera Ease-Back
          phaseName = 'return';
          const uReturn = Math.min(1, (elapsed - tStrikeDone) / Math.max(0.1, totalDuration - tStrikeDone));
          const easeRet = easeInOutCubic(uReturn);
          const pieceAdvanceBlend = 0.35 * uReturn + 0.65 * easeRet;

          piece.mesh.position.lerpVectors(postStrikePiecePos, endPos, pieceAdvanceBlend);
          camera.position.lerpVectors(duelCamClose, savedCamPos, easeRet);
          orbitControls.target.lerpVectors(duelTargetEnd, savedTarget, easeRet);
        }

        camera.lookAt(orbitControls.target);

        const stepDelta = camera.position.distanceTo(prevCamPos);
        const pieceStepDelta = piece.mesh.position.distanceTo(prevPiecePos);
        if (stepDelta > cameraTelemetry.maxStepDelta) {
          cameraTelemetry.maxStepDelta = stepDelta;
        }
        prevCamPos.copy(camera.position);
        prevPiecePos.copy(piece.mesh.position);

        cameraTelemetry.lastAttackSamples.push({
          t: Number(elapsed.toFixed(3)),
          phase: phaseName,
          camStep: Number(stepDelta.toFixed(4)),
          pieceStep: Number(pieceStepDelta.toFixed(4)),
          pos: [
            Number(camera.position.x.toFixed(3)),
            Number(camera.position.y.toFixed(3)),
            Number(camera.position.z.toFixed(3))
          ],
          target: [
            Number(orbitControls.target.x.toFixed(3)),
            Number(orbitControls.target.y.toFixed(3)),
            Number(orbitControls.target.z.toFixed(3))
          ],
          piecePos: [
            Number(piece.mesh.position.x.toFixed(3)),
            Number(piece.mesh.position.y.toFixed(3)),
            Number(piece.mesh.position.z.toFixed(3))
          ]
        });

        if (elapsed >= totalDuration) {
          finishMove();
          return true;
        }
        return false;
      }

      activeMoveTweens.push(stepMove);
      return true;
    }

    const activeMoveTweens = [];

    // =========================================================================
    // Single-Player Tactical AI with 3 Personalities (Guardian, Demon, Grandmaster)
    // =========================================================================
    const AI_PERSONAS = [
      { id: 'grandmaster', ruLabel: 'ИИ: Гроссмейстер (Тактика)' },
      { id: 'demon', ruLabel: 'ИИ: Агрессивный Демон' },
      { id: 'guardian', ruLabel: 'ИИ: Хранитель Собора' }
    ];
    let currentAiPersonaIdx = 0;

    function chooseSmartAIMove(color, forcePersonaId = null) {
      const legalMoves = getAllLegalMoves(color);
      if (legalMoves.length === 0) return null;

      const persona = forcePersonaId || (AI_PERSONAS[currentAiPersonaIdx]?.id || 'grandmaster');
      let bestScore = -Infinity;
      let bestCandidates = [];

      for (const m of legalMoves) {
        const piece = boardState[m.fromR][m.fromC];
        const target = boardState[m.toR][m.toC];
        let score = 0;

        // Material gain on capture (weighted by AI personality)
        if (target) {
          const capMult = persona === 'demon' ? 1.55 : (persona === 'guardian' ? 1.05 : 1.22);
          score += PIECE_VALUES[target.type] * capMult - PIECE_VALUES[piece.type] * 0.08;
        }

        // Center control bonus
        const centerDist = Math.abs(3.5 - m.toR) + Math.abs(3.5 - m.toC);
        score += (7 - centerDist) * (persona === 'grandmaster' ? 10 : 7);

        // Forward aggression for Demon AI
        if (persona === 'demon') {
          const forwardSteps = color === 'w' ? (m.fromR - m.toR) : (m.toR - m.fromR);
          score += forwardSteps * 18;
        }

        // Pawn advancement bonus
        if (piece.type === 'pawn') {
          const advance = color === 'w' ? (6 - m.toR) : (m.toR - 1);
          score += advance * 12;
        }

        // Simulate move to check if destination is hanging or gives check
        boardState[m.toR][m.toC] = piece;
        boardState[m.fromR][m.fromC] = null;
        const oppColor = color === 'w' ? 'b' : 'w';
        if (isKingInCheck(oppColor, boardState)) {
          score += persona === 'demon' ? 85 : 50;
        }
        // Check if opponent can recapture on destination square
        const safetyWeight = persona === 'guardian' ? 1.15 : (persona === 'demon' ? 0.42 : 0.82);
        for (let rr = 0; rr < 8; rr++) {
          for (let cc = 0; cc < 8; cc++) {
            const opp = boardState[rr][cc];
            if (opp && opp.color === oppColor) {
              const oppMoves = getPseudoMovesForPiece(rr, cc, boardState);
              if (oppMoves.some((om) => om.r === m.toR && om.c === m.toC)) {
                score -= PIECE_VALUES[piece.type] * safetyWeight;
                break;
              }
            }
          }
        }
        boardState[m.fromR][m.fromC] = piece;
        boardState[m.toR][m.toC] = target;

        // Small jitter so AI varies openings
        score += (Math.random() - 0.5) * (persona === 'grandmaster' ? 6 : 14);

        if (score > bestScore + 1) {
          bestScore = score;
          bestCandidates = [m];
        } else if (Math.abs(score - bestScore) <= 1) {
          bestCandidates.push(m);
        }
      }

      return bestCandidates[Math.floor(Math.random() * bestCandidates.length)] || legalMoves[0];
    }

    function triggerAIMoveNow() {
      if (isAnimatingMove || gameOver) return false;
      const chosen = chooseSmartAIMove(currentTurn);
      if (!chosen) return false;
      return executeChessMove(chosen.fromR, chosen.fromC, chosen.toR, chosen.toC);
    }

    function maybeScheduleAIMove() {
      if (aiTimer) {
        clearTimeout(aiTimer);
        aiTimer = null;
      }
      if (gameOver || isAnimatingMove || preMoveHighlightTask) return;
      if (scriptedGameActive) return;
      if (gameMode !== 'single' || !aiAutoPlay) return;

      const aiColor = playerColor === 'w' ? 'b' : 'w';
      if (currentTurn === aiColor) {
        aiTimer = setTimeout(() => {
          aiTimer = null;
          if (
            !scriptedGameActive &&
            gameMode === 'single' &&
            currentTurn === aiColor &&
            !isAnimatingMove &&
            !gameOver
          ) {
            triggerAIMoveNow();
          }
        }, 540);
      }
    }

    // =========================================================================
    // Feature 3 (3a, 3b, 3c): Chess Notation Parser & Step-Through Choreography
    // =========================================================================
    function createInitialVirtualBoard() {
      const b = Array.from({ length: 8 }, () => Array(8).fill(null));
      const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
      for (let c = 0; c < 8; c++) {
        b[7][c] = { type: backRow[c], color: 'w', hasMoved: false };
        b[6][c] = { type: 'pawn', color: 'w', hasMoved: false };
        b[1][c] = { type: 'pawn', color: 'b', hasMoved: false };
        b[0][c] = { type: backRow[c], color: 'b', hasMoved: false };
      }
      return b;
    }

    function getVirtualLegalMovesForSquare(r, c, vBoard) {
      const piece = vBoard[r][c];
      if (!piece) return [];
      const pseudo = getPseudoMovesForPiece(r, c, vBoard);
      const legal = [];
      for (const m of pseudo) {
        const savedTarget = vBoard[m.r][m.c];
        vBoard[m.r][m.c] = piece;
        vBoard[r][c] = null;
        const inCheck = isKingInCheck(piece.color, vBoard);
        vBoard[r][c] = piece;
        vBoard[m.r][m.c] = savedTarget;
        if (!inCheck) legal.push(m);
      }
      return legal;
    }

    function parseNotationToMoves(notationText) {
      const cleaned = String(notationText || '')
        .replace(/\[[^\]]*\]/g, ' ')
        .replace(/\{[^}]*\}/g, ' ')
        .replace(/;[^\n]*/g, ' ')
        .replace(/\([^)]*\)/g, ' ');

      const rawTokens = cleaned
        .split(/\s+/)
        .map((t) => t.replace(/^\d+\.+/g, '').trim())
        .filter((t) => t && !/^(1-0|0-1|1\/2-1\/2|\*|\d+\.?)$/.test(t));

      const vBoard = createInitialVirtualBoard();
      let turn = 'w';
      const parsedMoves = [];
      const promoMap = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' };
      const sanPieceMap = { N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king', P: 'pawn' };

      for (const rawTok of rawTokens) {
        let tok = rawTok.replace(/[+#!?]+$/g, '');
        if (!tok) continue;

        let matched = null;

        // 1. Castling (O-O / 0-0 / O-O-O / 0-0-0)
        if (/^(O-O-O|0-0-0|O-O|0-0)$/i.test(tok)) {
          const isQueenside = tok.length >= 5;
          const kr = turn === 'w' ? 7 : 0;
          const fromC = 4;
          const toC = isQueenside ? 2 : 6;
          if (vBoard[kr][fromC] && vBoard[kr][fromC].type === 'king') {
            matched = {
              fromR: kr,
              fromC,
              toR: kr,
              toC,
              pieceType: 'king',
              capture: false,
              promotion: null,
              castling: isQueenside ? 'q' : 'k'
            };
          }
        }

        // 2. Coordinate / UCI notation (e.g. e2e4, e2-e4, e4xd5, g1f3, e7e8q)
        if (!matched) {
          const uciMatch = tok.match(/^([a-h])([1-8])[-x]?([a-h])([1-8])(?:=?([qrbnQRBN]))?$/);
          if (uciMatch) {
            const fromC = uciMatch[1].charCodeAt(0) - 97;
            const fromR = 8 - parseInt(uciMatch[2], 10);
            const toC = uciMatch[3].charCodeAt(0) - 97;
            const toR = 8 - parseInt(uciMatch[4], 10);
            const promoChar = uciMatch[5] ? uciMatch[5].toLowerCase() : null;
            const p = vBoard[fromR]?.[fromC];
            if (p && p.color === turn) {
              matched = {
                fromR,
                fromC,
                toR,
                toC,
                pieceType: p.type,
                capture: Boolean(vBoard[toR]?.[toC]),
                promotion: promoChar ? promoMap[promoChar] : null
              };
            }
          }
        }

        // 3. Standard Algebraic Notation (SAN: e4, exd5, Nf3, Nc6, Bc4, Qxd5, Nbd7, R1e2, e8=Q)
        if (!matched) {
          let promotion = null;
          const promoEq = tok.match(/=([QRBNqrbn])$/);
          if (promoEq) {
            promotion = promoMap[promoEq[1].toLowerCase()] || 'queen';
            tok = tok.slice(0, -2);
          }

          let pieceType = 'pawn';
          let rest = tok;
          if (/^[NBRQK]/.test(rest)) {
            pieceType = sanPieceMap[rest[0]];
            rest = rest.slice(1);
          } else if (/^P/.test(rest)) {
            pieceType = 'pawn';
            rest = rest.slice(1);
          }

          const destMatch = rest.match(/([a-h])([1-8])$/);
          if (destMatch) {
            const toC = destMatch[1].charCodeAt(0) - 97;
            const toR = 8 - parseInt(destMatch[2], 10);
            const prefix = rest.slice(0, rest.length - 2).replace(/x/g, '');

            let disambigC = null;
            let disambigR = null;
            for (const ch of prefix) {
              if (ch >= 'a' && ch <= 'h') disambigC = ch.charCodeAt(0) - 97;
              else if (ch >= '1' && ch <= '8') disambigR = 8 - parseInt(ch, 10);
            }

            const candidates = [];
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                const p = vBoard[r][c];
                if (!p || p.color !== turn || p.type !== pieceType) continue;
                if (disambigC !== null && c !== disambigC) continue;
                if (disambigR !== null && r !== disambigR) continue;
                const legals = getVirtualLegalMovesForSquare(r, c, vBoard);
                const hit = legals.find((m) => m.r === toR && m.c === toC);
                if (hit) {
                  candidates.push({
                    fromR: r,
                    fromC: c,
                    toR,
                    toC,
                    pieceType,
                    capture: Boolean(hit.capture || vBoard[toR][toC]),
                    promotion
                  });
                }
              }
            }
            if (candidates.length > 0) {
              matched = candidates[0];
            }
          }
        }

        if (!matched) {
          console.warn('Could not parse notation token:', rawTok);
          break;
        }

        const movingPiece = vBoard[matched.fromR][matched.fromC];
        vBoard[matched.fromR][matched.fromC] = null;
        if (matched.castling) {
          const kr = matched.fromR;
          if (matched.castling === 'k') {
            vBoard[kr][5] = vBoard[kr][7];
            vBoard[kr][7] = null;
          } else {
            vBoard[kr][3] = vBoard[kr][0];
            vBoard[kr][0] = null;
          }
        }
        const finalType =
          matched.promotion ||
          (movingPiece.type === 'pawn' && (matched.toR === 0 || matched.toR === 7)
            ? 'queen'
            : movingPiece.type);
        vBoard[matched.toR][matched.toC] = {
          type: finalType,
          color: turn,
          hasMoved: true
        };

        parsedMoves.push({
          index: parsedMoves.length,
          ply: parsedMoves.length + 1,
          moveNumber: Math.floor(parsedMoves.length / 2) + 1,
          color: turn,
          san: rawTok,
          fromR: matched.fromR,
          fromC: matched.fromC,
          toR: matched.toR,
          toC: matched.toC,
          pieceType: matched.pieceType,
          capture: matched.capture,
          promotion: matched.promotion || 'queen'
        });

        turn = turn === 'w' ? 'b' : 'w';
      }

      return parsedMoves;
    }

    function updateScriptBarUI() {
      const label = document.getElementById('script-step-label');
      const statusMsg = document.getElementById('script-status-msg');
      const prevBtn = document.getElementById('btn-script-prev');
      const nextBtn = document.getElementById('btn-script-next');

      const total = scriptMoves.length;
      if (label) {
        if (total === 0) {
          label.textContent = `Move ${moveHistory.length}`;
        } else if (scriptDeviated) {
          label.textContent = `Move ${moveHistory.length} • Custom Takeover`;
        } else if (scriptCursor < total) {
          const nextSan = scriptMoves[scriptCursor].san;
          label.textContent = `Step ${scriptCursor}/${total} • Next: ${nextSan}`;
        } else {
          label.textContent = `Step ${total}/${total} (Done)`;
        }
      }
      if (prevBtn) {
        prevBtn.disabled = moveHistory.length === 0 && !preMoveHighlightTask && !isAnimatingMove;
      }
      if (nextBtn) {
        nextBtn.disabled = gameOver || (!scriptDeviated && total > 0 && scriptCursor >= total && !preMoveHighlightTask);
      }
      if (statusMsg && total > 0) {
        if (scriptDeviated) {
          statusMsg.textContent = `Custom takeover active at Move ${moveHistory.length} (Use [ to step back or ] for AI move).`;
        } else {
          statusMsg.textContent = `Loaded ${total} half-moves. Step ${scriptCursor}/${total} ready (Use [ and ] to step, Arrow keys to rotate cam).`;
        }
      }
    }

    const DEFAULT_DIRECTOR_NOTATION =
      '1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd8 4. d4 c6 5. Bc4 h6 6. Nf3 Bg4 7. Bxf7+ Kxf7 8. Ne5+ Ke8 9. Qxg4 Nf6 10. Qg6#';

    function loadNotationScript(notationStr, options = {}) {
      const parsed = parseNotationToMoves(notationStr);
      scriptMoves = parsed;
      scriptCursor = 0;
      scriptDeviated = false;
      scriptedGameActive = parsed.length > 0;
      const inputEl = document.getElementById('input-notation');
      if (inputEl && notationStr) {
        inputEl.value = notationStr;
      }
      resetChessBoard(Boolean(options.orientCamera), true);
      updateScriptBarUI();
      return {
        ok: parsed.length > 0,
        count: parsed.length,
        moves: parsed
      };
    }

    function completeCurrentMoveImmediately() {
      if (preMoveHighlightTask) {
        const mv = preMoveHighlightTask.move;
        const fromScriptFlag = Boolean(preMoveHighlightTask.fromScript);
        preMoveHighlightTask = null;
        executeChessMove(mv.fromR, mv.fromC, mv.toR, mv.toC, { fromScript: fromScriptFlag });
      }
      let safety = 0;
      while (activeMoveTweens.length > 0 && safety < 200) {
        safety++;
        for (let i = activeMoveTweens.length - 1; i >= 0; i--) {
          const done = activeMoveTweens[i](0.05);
          if (done) activeMoveTweens.splice(i, 1);
        }
      }
    }

    function isScriptMoveLegalOnCurrentBoard(mv) {
      if (!mv) return false;
      const piece = boardState[mv.fromR]?.[mv.fromC];
      if (!piece || piece.color !== currentTurn) return false;
      const destPiece = boardState[mv.toR]?.[mv.toC];
      if (destPiece && destPiece.color === piece.color) return false;
      const legals = getLegalMovesForPiece(mv.fromR, mv.fromC);
      return legals.some((m) => m.r === mv.toR && m.c === mv.toC);
    }

    function stepScriptForward() {
      if (gameOver) return false;

      // If a move animation or pre-move highlight is currently running, finish it cleanly before advancing
      if (isAnimatingMove || preMoveHighlightTask) {
        completeCurrentMoveImmediately();
        if (gameOver) return false;
        if (!scriptDeviated && scriptMoves.length > 0 && scriptCursor >= scriptMoves.length) return false;
      }

      // If no notation script has been loaded yet and no moves have been played, parse the default script in #input-notation
      if (scriptMoves.length === 0 && moveHistory.length === 0) {
        const defaultPgn =
          document.getElementById('input-notation')?.value || DEFAULT_DIRECTOR_NOTATION;
        loadNotationScript(defaultPgn, { orientCamera: false });
      }

      if (aiTimer) {
        clearTimeout(aiTimer);
        aiTimer = null;
      }

      // Determine whether the next scripted move is still valid on the current board
      let nextMove = null;
      let isFromScript = false;
      if (!scriptDeviated && scriptCursor < scriptMoves.length) {
        const candidate = scriptMoves[scriptCursor];
        if (isScriptMoveLegalOnCurrentBoard(candidate)) {
          nextMove = candidate;
          isFromScript = true;
          scriptedGameActive = true;
        } else {
          scriptDeviated = true;
          scriptedGameActive = false;
        }
      }

      // If the user took over and deviated from the script, Next ] cleanly executes a smart legal move for currentTurn
      if (!nextMove) {
        if (!scriptDeviated && scriptMoves.length > 0 && scriptCursor >= scriptMoves.length) {
          return false;
        }
        const aiFallback = chooseSmartAIMove(currentTurn);
        if (!aiFallback) return false;
        nextMove = {
          fromR: aiFallback.fromR,
          fromC: aiFallback.fromC,
          toR: aiFallback.toR,
          toC: aiFallback.toC,
          color: currentTurn
        };
        isFromScript = false;
      }

      const chkHighlight = document.getElementById('chk-premove-highlight');
      const chkBoth = document.getElementById('chk-premove-both');
      const showPreHighlight = chkHighlight ? chkHighlight.checked : true;
      const highlightBothSides = chkBoth ? chkBoth.checked : false;

      // Feature 3c: When triggering moves for the player's side (or both sides if toggled),
      // first show selecting the piece and its legal destination squares before executing the move!
      if (showPreHighlight && (nextMove.color === playerColor || highlightBothSides)) {
        selectedSquare = { r: nextMove.fromR, c: nextMove.fromC };
        validMoves = getLegalMovesForPiece(nextMove.fromR, nextMove.fromC);
        showSquareHighlights(nextMove.fromR, nextMove.fromC, validMoves);
        preMoveHighlightTask = {
          move: nextMove,
          fromScript: isFromScript,
          elapsedSim: 0,
          startWallMs: performance.now(),
          duration: 0.62
        };
        updateScriptBarUI();
        return true;
      }

      return executeChessMove(nextMove.fromR, nextMove.fromC, nextMove.toR, nextMove.toC, {
        fromScript: isFromScript
      });
    }

    function stepScriptBackward() {
      if (preMoveHighlightTask) {
        preMoveHighlightTask = null;
        clearSquareHighlights();
        selectedSquare = null;
        validMoves = [];
        updateScriptBarUI();
        return true;
      }

      if (moveHistory.length === 0) {
        return false;
      }

      const lastEntry = moveHistory.pop();
      restoreBoardSnapshot(lastEntry.snapshot);
      return true;
    }

    // =========================================================================
    // Feature 1: Toggle All On-Screen UI Off/On for Clean Cinematic Recording
    // =========================================================================
    function toggleUI(forceHidden) {
      const shouldHide =
        typeof forceHidden === 'boolean'
          ? forceHidden
          : !document.body.classList.contains('cinematic-ui-hidden');
      document.body.classList.toggle('cinematic-ui-hidden', shouldHide);
      const btnHide = document.getElementById('btn-hide-ui');
      if (btnHide) {
        btnHide.textContent = shouldHide ? 'Показать интерфейс [H]' : 'Скрыть интерфейс [H]';
      }
      return shouldHide;
    }

    // =========================================================================
    // Feature 4: Video-Game Style WASD + R/F Translation & Arrow-Key Rotation
    // with Configurable Speed (Default 10%) & Smooth Ease-In / Ease-Out
    // =========================================================================
    const heldCameraKeys = new Set();
    const CAM_MOVE_KEY_CODES = new Set([
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'KeyR',
      'KeyF',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight'
    ]);
    let cameraKeySpeedPct = 35;
    let cameraRotSpeedPct = 35;
    const keyMoveVelocity = new THREE.Vector3(0, 0, 0);
    const keyRotVelocity = { yaw: 0, pitch: 0 };

    function setCameraKeySpeedPercent(pct) {
      const clamped = Math.max(1, Math.min(200, Math.round(Number(pct) || 10)));
      cameraKeySpeedPct = clamped;
      const sliderEl = document.getElementById('input-cam-speed');
      const valEl = document.getElementById('cam-speed-val');
      if (sliderEl && Number(sliderEl.value) !== clamped) {
        sliderEl.value = String(clamped);
      }
      if (valEl) {
        valEl.textContent = `${clamped}%`;
      }
      return cameraKeySpeedPct;
    }

    function setCameraRotSpeedPercent(pct) {
      const clamped = Math.max(1, Math.min(200, Math.round(Number(pct) || 10)));
      cameraRotSpeedPct = clamped;
      const sliderEl = document.getElementById('input-rot-speed');
      const valEl = document.getElementById('rot-speed-val');
      if (sliderEl && Number(sliderEl.value) !== clamped) {
        sliderEl.value = String(clamped);
      }
      if (valEl) {
        valEl.textContent = `${clamped}%`;
      }
      return cameraRotSpeedPct;
    }

    const camSpeedSliderEl = document.getElementById('input-cam-speed');
    if (camSpeedSliderEl) {
      camSpeedSliderEl.addEventListener('input', (e) => {
        setCameraKeySpeedPercent(e.target.value);
      });
      camSpeedSliderEl.addEventListener('change', (e) => {
        setCameraKeySpeedPercent(e.target.value);
      });
    }

    const rotSpeedSliderEl = document.getElementById('input-rot-speed');
    if (rotSpeedSliderEl) {
      rotSpeedSliderEl.addEventListener('input', (e) => {
        setCameraRotSpeedPercent(e.target.value);
      });
      rotSpeedSliderEl.addEventListener('change', (e) => {
        setCameraRotSpeedPercent(e.target.value);
      });
    }

    function isTypingInInput(el) {
      if (!el) return false;
      const tag = (el.tagName || '').toUpperCase();
      if (tag === 'TEXTAREA' || el.isContentEditable) return true;
      if (tag === 'INPUT') {
        const type = (el.type || '').toLowerCase();
        return type !== 'range' && type !== 'checkbox' && type !== 'button';
      }
      return false;
    }

    window.addEventListener('keydown', (e) => {
      if (isTypingInInput(document.activeElement)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (CAM_MOVE_KEY_CODES.has(e.code)) {
        e.preventDefault();
        heldCameraKeys.add(e.code);
        return;
      }

      if (e.code === 'KeyH' || e.code === 'KeyU') {
        e.preventDefault();
        toggleUI();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (CAM_MOVE_KEY_CODES.has(e.code)) {
        heldCameraKeys.delete(e.code);
      }
    });

    window.addEventListener('blur', () => {
      heldCameraKeys.clear();
    });

    // =========================================================================
    // Feature 7: Checkmate Rigged King Fall-Over Animation & Cathedral Overlay
    // =========================================================================
    function spawnKingFallImpact(worldPos, color) {
      const mat = color === 'w' ? whitePieceMat : blackPieceMat;
      for (let i = 0; i < 18; i++) {
        const sz = 0.015 + Math.random() * 0.028;
        const geo = new THREE.DodecahedronGeometry(sz, 0);
        const frag = new THREE.Mesh(geo, mat);
        frag.position.set(
          worldPos.x + (Math.random() - 0.5) * 0.14,
          BOARD_SURFACE_Y + 0.04 + Math.random() * 0.10,
          worldPos.z + (Math.random() - 0.5) * 0.14
        );
        frag.castShadow = true;
        scene.add(frag);
        shatterDebris.push({
          mesh: frag,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 1.45,
            0.65 + Math.random() * 1.25,
            (Math.random() - 0.5) * 1.45
          ),
          rotVel: new THREE.Vector3(
            Math.random() * 8,
            Math.random() * 8,
            Math.random() * 8
          ),
          life: 1.65
        });
      }
      impactFlashLight.position.set(worldPos.x, BOARD_SURFACE_Y + 0.35, worldPos.z);
      impactFlashLight.intensity = 6.2;
    }

    function showCheckmateBanner(winnerColor, defeatedColor) {
      const overlay = document.getElementById('checkmate-overlay');
      const crownEl = document.getElementById('checkmate-crown');
      const titleEl = document.getElementById('checkmate-title');
      const subEl = document.getElementById('checkmate-subtitle');

      const winnerName = winnerColor === 'w' ? 'Белые победили' : 'Чёрные победили';
      const defeatedName = defeatedColor === 'w' ? 'Белый Король пал' : 'Чёрный Король пал';

      if (crownEl) crownEl.textContent = winnerColor === 'w' ? '♔' : '♚';
      if (titleEl) titleEl.textContent = 'Шах и Мат';
      if (subEl) {
        subEl.textContent = `${winnerName} • ${defeatedName}`;
      }
      if (overlay) {
        overlay.classList.add('visible');
      }
      checkmateState.bannerVisible = true;
    }

    function triggerCheckmateSequence(defeatedColor = currentTurn, winnerColor = null) {
      const actualWinner = winnerColor || (defeatedColor === 'w' ? 'b' : 'w');

      // Find the defeated King on the board
      let kingPiece = null;
      let kingR = -1;
      let kingC = -1;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = boardState[r][c];
          if (p && p.type === 'king' && p.color === defeatedColor) {
            kingPiece = p;
            kingR = r;
            kingC = c;
            break;
          }
        }
      }

      checkmateState.active = true;
      checkmateState.defeatedColor = defeatedColor;
      checkmateState.winnerColor = actualWinner;
      checkmateState.kingFallAngleDeg = 0;
      checkmateState.phase = 'stagger';

      if (!kingPiece || !kingPiece.mesh) {
        showCheckmateBanner(actualWinner, defeatedColor);
        return false;
      }

      // Find the checkmating attacker piece so the King falls away from the blow or into the clearest open square
      let attackerPos = null;
      if (moveHistory.length > 0) {
        const lastMv = moveHistory[moveHistory.length - 1].move;
        if (lastMv) {
          attackerPos = boardToWorld(lastMv.toR, lastMv.toC);
        }
      }
      if (!attackerPos) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = boardState[r][c];
            if (p && p.color === actualWinner) {
              const moves = getPseudoMovesForPiece(r, c, boardState);
              if (moves.some((m) => m.r === kingR && m.c === kingC)) {
                attackerPos = boardToWorld(r, c);
                break;
              }
            }
          }
        }
      }

      const homePos = boardToWorld(kingR, kingC);
      const forwardDirZ = defeatedColor === 'b' ? 1 : -1;

      // Evaluate 16 candidate fall directions around the King to pick the clearest open path on the board
      let bestDirX = 0.24;
      let bestDirZ = forwardDirZ * 0.97;
      let bestScore = -Infinity;

      const awayFromAttacker = attackerPos
        ? new THREE.Vector2(homePos.x - attackerPos.x, homePos.z - attackerPos.z).normalize()
        : new THREE.Vector2(0.25, forwardDirZ).normalize();

      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const dx = Math.cos(ang);
        const dz = Math.sin(ang);

        // Check where the King's crown (0.50m from base) lands in board coordinates
        const tipWorldX = homePos.x + dx * 0.44;
        const tipWorldZ = homePos.z + dz * 0.44;
        const tipC = Math.round(tipWorldX / BOARD_SQ_SIZE + 3.5);
        const tipR = Math.round(tipWorldZ / BOARD_SQ_SIZE + 3.5);

        let score = 0;
        // Prefer staying inside the 8x8 board surface
        if (tipR >= 0 && tipR < 8 && tipC >= 0 && tipC < 8) {
          score += 40;
          const occ = boardState[tipR]?.[tipC];
          if (!occ) {
            score += 65; // Open square for the fallen King's body & crown!
          } else if (occ !== kingPiece) {
            score -= 50;
          }
        } else {
          score -= 35;
        }

        // Prefer falling away from the attacker's blow or forward-diagonally toward the center
        score += (dx * awayFromAttacker.x + dz * awayFromAttacker.y) * 18;
        score += dz * forwardDirZ * 14;

        if (score > bestScore) {
          bestScore = score;
          bestDirX = dx;
          bestDirZ = dz;
        }
      }

      const fallLen = Math.hypot(bestDirX, bestDirZ) || 1;
      const fallDirX = bestDirX / fallLen;
      const fallDirZ = bestDirZ / fallLen;

      // Highlight the defeated King's square with a crimson-and-gold Checkmate ring
      clearSquareHighlights();
      const outerRingGeo = new THREE.RingGeometry(0.135, 0.175, 36);
      outerRingGeo.rotateX(-Math.PI / 2);
      const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xe63946, side: THREE.DoubleSide });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRing.position.set(homePos.x, BOARD_SURFACE_Y + 0.012, homePos.z);
      squareHighlightsGroup.add(outerRing);

      const innerRingGeo = new THREE.RingGeometry(0.10, 0.125, 36);
      innerRingGeo.rotateX(-Math.PI / 2);
      const innerRingMat = new THREE.MeshBasicMaterial({ color: 0xf5d76e, side: THREE.DoubleSide });
      const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
      innerRing.position.set(homePos.x, BOARD_SURFACE_Y + 0.014, homePos.z);
      squareHighlightsGroup.add(innerRing);

      // Pause the King's idle mixer so its stone statue mesh pivots cleanly as a rigid monument
      if (kingPiece.currentAction) {
        kingPiece.currentAction.paused = true;
      }

      // Face the King toward the checkmating attacker (or forward) before toppling
      const baseYaw = attackerPos
        ? Math.atan2(attackerPos.x - homePos.x, attackerPos.z - homePos.z)
        : (defeatedColor === 'w' ? Math.PI : 0);
      const qBaseFacing = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), baseYaw);
      // Right-handed horizontal axis perpendicular to fallDir so +angle pitches the King's crown toward (fallDirX, 0, fallDirZ)
      const tiltAxis = new THREE.Vector3(fallDirZ, 0, -fallDirX).normalize();
      const qTilt = new THREE.Quaternion();

      // Smoothly frame the checkmate on the board if the user isn't manually flying the camera with WASD
      if (heldCameraKeys.size === 0) {
        const camSideX = homePos.x >= 0 ? -1.35 : 1.35;
        const camSideZ = homePos.z + forwardDirZ * 1.45;
        smoothCameraTo(
          new THREE.Vector3(homePos.x + camSideX, BOARD_SURFACE_Y + 1.15, camSideZ),
          new THREE.Vector3(
            homePos.x + fallDirX * 0.22,
            BOARD_SURFACE_Y + 0.18,
            homePos.z + fallDirZ * 0.22
          ),
          0.95
        );
      }

      const RIM_RADIUS = 0.135;    // Pedestal bottom rim radius so the lower edge stays grounded on the board
      const MAX_FALL_RAD = 1.50;   // 86 degrees: King lies fallen on its side across the board tiles
      const tStagger = 0.36;
      const tImpact = 1.12;
      const tTotal = 1.82;

      let elapsed = 0;
      let impactTriggered = false;
      let bannerShown = false;

      function applyKingTopplePose(thetaRad, shudderRoll = 0) {
        const clampedTheta = Math.max(-0.15, Math.min(1.55, thetaRad));
        checkmateState.kingFallAngleDeg = Number(((clampedTheta * 180) / Math.PI).toFixed(1));

        const px = homePos.x + fallDirX * RIM_RADIUS * (1 - Math.cos(clampedTheta));
        const py = BOARD_SURFACE_Y + RIM_RADIUS * Math.sin(Math.max(0, clampedTheta));
        const pz = homePos.z + fallDirZ * RIM_RADIUS * (1 - Math.cos(clampedTheta));
        kingPiece.mesh.position.set(px, py, pz);

        qTilt.setFromAxisAngle(tiltAxis, clampedTheta);
        if (Math.abs(shudderRoll) > 1e-4) {
          const qShudder = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(fallDirX, 0, fallDirZ),
            shudderRoll
          );
          qTilt.multiply(qShudder);
        }
        kingPiece.mesh.quaternion.copy(qTilt).multiply(qBaseFacing);
      }

      function stepKingFall(dt) {
        if (!checkmateState.active || !kingPiece.mesh) return true;
        elapsed += dt;

        if (!bannerShown && elapsed >= 0.48) {
          bannerShown = true;
          showCheckmateBanner(actualWinner, defeatedColor);
        }

        if (elapsed <= tStagger) {
          // Phase 1: Royal Stagger & Tremor as the checkmate blow echoes through the King statue
          checkmateState.phase = 'stagger';
          const u = elapsed / tStagger;
          const shudder = Math.sin(u * Math.PI * 6) * 0.065 * (1 - u * 0.3);
          const initialLean = u * u * 0.12;
          applyKingTopplePose(initialLean, shudder);
        } else if (elapsed <= tImpact) {
          // Phase 2: Accelerating Gravity Topple around the stone pedestal rim (0.12 rad -> 1.50 rad = 86 deg)
          checkmateState.phase = 'topple';
          const u = Math.min(1, (elapsed - tStagger) / (tImpact - tStagger));
          const gravCurve = Math.pow(u, 2.25);
          const theta = 0.12 + (MAX_FALL_RAD - 0.12) * gravCurve;
          applyKingTopplePose(theta, 0);
        } else {
          // Phase 3: Heavy Stone Impact, Crown Shard Burst & Damped Restitution Bounce
          checkmateState.phase = 'impact';
          if (!impactTriggered) {
            impactTriggered = true;
            const crownImpactPos = new THREE.Vector3(
              homePos.x + fallDirX * 0.45,
              BOARD_SURFACE_Y,
              homePos.z + fallDirZ * 0.45
            );
            spawnKingFallImpact(crownImpactPos, defeatedColor);
          }

          const uBounce = Math.min(1, (elapsed - tImpact) / (tTotal - tImpact));
          const bounceAmp = 0.13 * Math.pow(1 - uBounce, 1.85);
          const theta = MAX_FALL_RAD - Math.abs(Math.sin(uBounce * Math.PI * 2.0)) * bounceAmp;
          applyKingTopplePose(theta, 0);

          // Subtle damped camera tremor when the heavy stone King crashes onto the altar board
          if (elapsed <= tImpact + 0.28) {
            const sProg = (elapsed - tImpact) / 0.28;
            const decay = (1 - sProg) * (1 - sProg);
            camera.position.y += Math.cos(sProg * Math.PI * 8) * 0.022 * decay;
          }
        }

        if (elapsed >= tTotal) {
          applyKingTopplePose(MAX_FALL_RAD, 0);
          checkmateState.phase = 'fallen';
          if (!bannerShown) {
            showCheckmateBanner(actualWinner, defeatedColor);
          }
          return true;
        }
        return false;
      }

      activeMoveTweens.push(stepKingFall);
      return true;
    }

    // =========================================================================
    // UI & Turn Status Updates
    // =========================================================================
    function updateTurnUI() {
      const turnDot = document.getElementById('turn-dot');
      const turnText = document.getElementById('turn-text');
      const modeBadge = document.getElementById('mode-badge');
      const btnAiMove = document.getElementById('btn-ai-move');
      const btnSideToggle = document.getElementById('btn-side-toggle');
      const roomPill = document.getElementById('room-pill');
      const capturedTray = document.getElementById('captured-tray');

      turnDot.className = 'turn-dot' + (currentTurn === 'b' ? ' black' : '');

      const legalMoves = getAllLegalMoves(currentTurn);
      const inCheck = isKingInCheck(currentTurn, boardState);

      if (legalMoves.length === 0) {
        gameOver = true;
        if (inCheck) {
          const winner = currentTurn === 'w' ? 'Чёрные' : 'Белые';
          turnText.textContent = `Шах и мат — Победили ${winner}`;
          if (typeof playSanctumSound === 'function') playSanctumSound('checkmate');
          if (typeof notifyCampaignBossResult === 'function') {
            notifyCampaignBossResult(currentTurn === 'w' ? 'b' : 'w');
          }
          if (!checkmateState.active) {
            triggerCheckmateSequence(currentTurn, currentTurn === 'w' ? 'b' : 'w');
          }
        } else {
          turnText.textContent = 'Пат — Ничья';
        }
      } else {
        const turnLabel = currentTurn === 'w' ? 'Ход Белых' : 'Ход Чёрных';
        const aiColor = playerColor === 'w' ? 'b' : 'w';
        const isAiTurn = !scriptedGameActive && gameMode === 'single' && currentTurn === aiColor;
        if (inCheck) {
          turnText.textContent = `${turnLabel} (Шах!)`;
          if (typeof triggerCathedralCheckReaction === 'function') {
            triggerCathedralCheckReaction();
          }
        } else if (isAiTurn) {
          turnText.textContent = `${turnLabel} (ИИ)...`;
        } else {
          turnText.textContent = turnLabel;
        }
      }

      if (modeBadge) {
        modeBadge.textContent = `За ${playerColor === 'w' ? 'Белых' : 'Чёрных'}`;
      }
      if (btnAiMove) {
        btnAiMove.style.display = 'inline-flex';
      }
      if (btnSideToggle) {
        btnSideToggle.style.display = 'inline-flex';
        btnSideToggle.textContent = playerColor === 'w' ? 'Играть за Чёрных' : 'Играть за Белых';
      }
      if (roomPill) {
        roomPill.style.display = 'none';
      }

      if (typeof updatePowerBalanceAndGraveyardUI === 'function') {
        updatePowerBalanceAndGraveyardUI(capturedTray);
      } else if (capturedByWhite > 0 || capturedByBlack > 0) {
        capturedTray.textContent = `Взято — Белые: ${capturedByWhite} | Чёрные: ${capturedByBlack}`;
      } else {
        capturedTray.textContent = '';
      }
      if (typeof updateScriptBarUI === 'function') updateScriptBarUI();
    }

    // =========================================================================
    // Raycasting & Board Interaction
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    renderer.domElement.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('pointerup', (e) => {
      const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (moveDist > 6) return;
      if (isAnimatingMove || gameOver) return;

      // Enforce turn ownership in Multiplayer, and in Single Player only block while AI auto-move timer is actively pending
      if (gameMode === 'multi' && currentTurn !== playerColor) return;
      if (!scriptedGameActive && gameMode === 'single' && currentTurn !== playerColor && aiTimer !== null) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const pieceMeshes = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (boardState[r][c] && boardState[r][c].mesh) {
            pieceMeshes.push(boardState[r][c].mesh);
          }
        }
      }

      const hits = raycaster.intersectObjects([...pieceMeshes, ...boardSquareMeshes], true);
      if (hits.length === 0) {
        if (preMoveHighlightTask) preMoveHighlightTask = null;
        clearSquareHighlights();
        selectedSquare = null;
        validMoves = [];
        return;
      }

      let clickedR = -1;
      let clickedC = -1;
      let obj = hits[0].object;
      while (obj) {
        if (obj.userData && obj.userData.piece) {
          clickedR = obj.userData.piece.r;
          clickedC = obj.userData.piece.c;
          break;
        }
        if (obj.userData && obj.userData.isSquare) {
          clickedR = obj.userData.r;
          clickedC = obj.userData.c;
          break;
        }
        obj = obj.parent;
      }

      if (clickedR === -1) return;

      // Cancel any pending scripted pre-move highlight timer when the user manually interacts with the board
      if (preMoveHighlightTask) {
        preMoveHighlightTask = null;
      }

      if (selectedSquare) {
        const move = validMoves.find(
          (m) =>
            (m.r === clickedR && m.c === clickedC) ||
            (m.castle && m.r === clickedR && m.rookFromC === clickedC)
        );
        if (move) {
          executeChessMove(selectedSquare.r, selectedSquare.c, move.r, move.c);
          return;
        }
      }

      const clickedPiece = boardState[clickedR][clickedC];
      if (clickedPiece && clickedPiece.color === currentTurn) {
        selectedSquare = { r: clickedR, c: clickedC };
        validMoves = getLegalMovesForPiece(clickedR, clickedC);
        showSquareHighlights(clickedR, clickedC, validMoves);
      } else {
        clearSquareHighlights();
        selectedSquare = null;
        validMoves = [];
      }
    });

    // =========================================================================
    // Multiplayer Room Synchronization (Same-Origin API + Static Site Fallback)
    // =========================================================================
    const CLOUD_MP_API_BASE = '';
    const isStaticHost =
      window.location.hostname.includes('zipline') ||
      window.location.hostname.includes('github.io') ||
      window.location.protocol === 'file:';

    let staticBroadcastChannel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        staticBroadcastChannel = new BroadcastChannel('wizard_chess_mp_channel');
        staticBroadcastChannel.onmessage = (ev) => {
          const msg = ev.data;
          if (msg && msg.type === 'room_state' && msg.room && msg.room.code === roomCode) {
            applyRemoteRoomState(msg.room);
          }
        };
      }
    } catch (e) {}

    window.addEventListener('storage', (ev) => {
      if (ev.key === `wizard_chess_room_${roomCode}` && ev.newValue) {
        try {
          applyRemoteRoomState(JSON.parse(ev.newValue));
        } catch (e) {}
      }
    });

    function getStaticRoom(code) {
      try {
        const raw = localStorage.getItem(`wizard_chess_room_${code}`);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    function saveAndBroadcastStaticRoom(room) {
      try {
        localStorage.setItem(`wizard_chess_room_${room.code}`, JSON.stringify(room));
      } catch (e) {}
      try {
        if (staticBroadcastChannel) {
          staticBroadcastChannel.postMessage({ type: 'room_state', room });
        }
      } catch (e) {}
    }

    function ensurePlayerToken() {
      if (!playerToken) {
        playerToken = 'tok_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
        try {
          localStorage.setItem('wizard_chess_token', playerToken);
        } catch (e) {}
      }
      return playerToken;
    }

    async function mpApiRequest(apiPath, options = {}) {
      const bases = isStaticHost
        ? (CLOUD_MP_API_BASE ? [CLOUD_MP_API_BASE] : [])
        : (CLOUD_MP_API_BASE ? ['', CLOUD_MP_API_BASE] : ['']);
      for (const base of bases) {
        try {
          const res = await fetch(`${base}${apiPath}`, options);
          if (res.ok) {
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
              return await res.json();
            }
          }
        } catch (e) {}
      }
      return null;
    }

    // =========================================================================
    // Real-Time Online Multiplayer (WebSocket /ws-online + HTTP/SSE + Local Sync)
    // =========================================================================
    let onlineWs = null;
    let onlineReconnectTimer = null;
    let onlineOpponentConnected = false;
    let mpBroadcastChannel = null;
    let mpEventSource = null;

    function extractRoomCodeFromText(raw) {
      const str = String(raw || '').trim();
      if (!str) return '';
      // Check if it contains ?room=XXXX or &room=XXXX
      const urlMatch = str.match(/[?&]room=([A-Za-z0-9]{4,8})/i);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1].toUpperCase().slice(0, 4);
      }
      // If it's a clean 4-char code
      const cleanAlpha = str.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (cleanAlpha.length === 4) {
        return cleanAlpha;
      }
      // Check for standalone 4-character alphanumeric token in pasted text
      const tokenMatch = str.match(/\b([A-Za-z0-9]{4})\b/);
      if (tokenMatch && tokenMatch[1]) {
        return tokenMatch[1].toUpperCase();
      }
      return cleanAlpha.slice(0, 4);
    }

    async function copyTextToClipboard(text) {
      const str = String(text || '');
      if (!str) return false;
      try {
        localStorage.setItem('wizard_chess_last_copied', str);
        if (roomCode) {
          localStorage.setItem('wizard_chess_last_room_code', roomCode);
        }
      } catch {
        // ignore storage errors
      }
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(str);
          return true;
        } catch {
          // fallback below
        }
      }
      try {
        const ta = document.createElement('textarea');
        ta.value = str;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.left = '-9999px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, str.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return Boolean(ok);
      } catch {
        return false;
      }
    }

    function syncDisplayedRoomCode(code) {
      const validCode = code || '----';
      const createdBox = document.getElementById('created-room-box');
      if (createdBox && code) {
        createdBox.style.display = 'block';
      }
      const createdCodeEl = document.getElementById('created-room-code');
      if (createdCodeEl) createdCodeEl.textContent = validCode;
      const createdInputEl = document.getElementById('created-room-code-input');
      if (createdInputEl) createdInputEl.value = validCode;
      const hudCopyBtn = document.getElementById('hud-room-copy-btn');
      const hudCodeVal = document.getElementById('hud-room-code-val');
      if (hudCodeVal) hudCodeVal.textContent = validCode;
      if (hudCopyBtn) {
        hudCopyBtn.style.display = code ? 'inline-flex' : 'none';
      }
      if (code) {
        try {
          localStorage.setItem('wizard_chess_last_room_code', code);
        } catch {
          // ignore
        }
      }
    }

    function updateOnlineStatusUI(statusText, isConnected = false, isWaiting = false) {
      const onlinePill = document.getElementById('online-status-pill');
      const onlineLabel = document.getElementById('online-status-label');
      const onlineDot = document.getElementById('online-status-dot');
      if (onlineLabel && statusText) {
        onlineLabel.textContent = statusText;
      }
      if (onlineDot) {
        onlineDot.className = `online-dot ${isConnected ? 'connected' : isWaiting ? 'waiting' : 'offline'}`;
      }
      if (onlinePill) {
        onlinePill.classList.toggle('connected', Boolean(isConnected));
        onlinePill.classList.toggle('waiting', Boolean(isWaiting));
      }
      syncDisplayedRoomCode(roomCode);
    }

    function stopMultiplayerSync() {
      if (roomEventSource) {
        roomEventSource.close();
        roomEventSource = null;
      }
      if (roomPollTimer) {
        clearInterval(roomPollTimer);
        roomPollTimer = null;
      }
      if (mpEventSource) {
        mpEventSource.close();
        mpEventSource = null;
      }
      if (mpBroadcastChannel) {
        mpBroadcastChannel.close();
        mpBroadcastChannel = null;
      }
      if (onlineReconnectTimer) {
        clearTimeout(onlineReconnectTimer);
        onlineReconnectTimer = null;
      }
      if (onlineWs) {
        try {
          onlineWs.onclose = null;
          onlineWs.close();
        } catch {
          // ignore
        }
        onlineWs = null;
      }
      onlineOpponentConnected = false;
      updateOnlineStatusUI('🌐 Играть онлайн', false, false);
    }

    function handleIncomingOnlinePayload(payload) {
      if (!payload) return;

      if (payload.type === 'room_state') {
        const wConn = Boolean(payload.players?.w);
        const bConn = Boolean(payload.players?.b);
        const bothReady = wConn && bConn;
        onlineOpponentConnected = bothReady;

        if (typeof payload.locationId === 'string') {
          const curLoc = SANCTUM_LOCATIONS[currentLocationIdx];
          if (!curLoc || curLoc.id !== payload.locationId) {
            setSanctumLocation(payload.locationId, { silent: true, fromRemote: true });
          }
        }
        if (
          typeof payload.formationIdx === 'number' &&
          payload.formationIdx !== currentArmyFormationIdx &&
          moveHistory.length === 0
        ) {
          setArmyFormation(payload.formationIdx, { fromRemote: true, silent: true });
        }

        const mpStatusEl = document.getElementById('mp-status-msg');
        if (bothReady) {
          const mySideName = playerColor === 'w' ? 'Белые (♔)' : 'Чёрные (♚)';
          updateOnlineStatusUI(`В сети • Комната ${roomCode} • Вы: ${mySideName}`, true, false);
          if (mpStatusEl) {
            mpStatusEl.textContent = `✅ Противник подключился! Комната ${roomCode}. Вы играете за ${mySideName}.`;
          }
          if (payload.justMatched) {
            playSanctumSound('ability');
            showNotificationToast(`🌐 Противник найден! Комната ${roomCode} — Вы играете за ${mySideName}`);
            closeLobbyModal();
          }
        } else {
          updateOnlineStatusUI(`Ожидание соперника • Код: ${roomCode}`, false, true);
          if (mpStatusEl) {
            mpStatusEl.textContent = `⏳ Ожидание подключения второго игрока... Код комнаты: ${roomCode}`;
          }
        }

        if (Array.isArray(payload.moves) && payload.moves.length > moveHistory.length) {
          for (let i = moveHistory.length; i < payload.moves.length; i++) {
            const mv = payload.moves[i];
            if (mv && mv.from && mv.to) {
              executeChessMove(mv.from.r, mv.from.c, mv.to.r, mv.to.c, {
                fromRemote: true,
                promotion: mv.promotion || 'archbishop'
              });
            }
          }
        }
        updateTurnUI();
        return;
      }

      if (payload.type === 'move' && payload.move) {
        const mv = payload.move;
        if (mv.playerToken && mv.playerToken === playerToken) return;
        if (mv.color === currentTurn && !isAnimatingMove) {
          executeChessMove(mv.from.r, mv.from.c, mv.to.r, mv.to.c, {
            fromRemote: true,
            promotion: mv.promotion || 'archbishop'
          });
        }
        return;
      }

      if (payload.type === 'reset') {
        if (payload.playerToken && payload.playerToken === playerToken) return;
        if (typeof payload.formationIdx === 'number') {
          currentArmyFormationIdx = payload.formationIdx;
          updateFormationButtonsUI();
        }
        resetChessBoard(false, false);
        showNotificationToast('🔄 Соперник перезапустил партию');
        return;
      }

      if (payload.type === 'location_change' && payload.locationId) {
        if (payload.playerToken && payload.playerToken === playerToken) return;
        setSanctumLocation(payload.locationId, { fromRemote: true });
        return;
      }

      if (payload.type === 'formation_change' && typeof payload.formationIdx === 'number') {
        if (payload.playerToken && payload.playerToken === playerToken) return;
        setArmyFormation(payload.formationIdx, { fromRemote: true });
        return;
      }

      if (payload.type === 'transmute' && typeof payload.r === 'number' && typeof payload.c === 'number') {
        if (payload.playerToken && payload.playerToken === playerToken) return;
        transmutePieceAt(payload.r, payload.c, payload.pieceType, { fromRemote: true });
      }
    }

    function connectOnlineWebSocket(code) {
      if (onlineWs) {
        try {
          onlineWs.onclose = null;
          onlineWs.close();
        } catch {
          // ignore
        }
        onlineWs = null;
      }

      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${proto}//${window.location.host}/ws-online`;
        const ws = new WebSocket(wsUrl);
        onlineWs = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              code,
              playerToken,
              color: playerColor
            })
          );
        };

        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            handleIncomingOnlinePayload(data);
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          if (gameMode === 'multi' && roomCode === code) {
            onlineReconnectTimer = setTimeout(() => {
              if (gameMode === 'multi' && roomCode === code) {
                connectOnlineWebSocket(code);
              }
            }, 2200);
          }
        };
      } catch {
        // Fallback to SSE / BroadcastChannel
      }
    }

    function sendOnlineEvent(eventObj) {
      if (!roomCode) return;
      const payload = { ...eventObj, code: roomCode, playerToken };
      if (onlineWs && onlineWs.readyState === WebSocket.OPEN) {
        try {
          onlineWs.send(JSON.stringify(payload));
        } catch {
          // ignore
        }
      }
      if (mpBroadcastChannel) {
        try {
          mpBroadcastChannel.postMessage(payload);
        } catch {
          // ignore
        }
      }
    }

    async function sendMultiplayerMove(movePayload) {
      if (!roomCode) return;

      // 1. Send immediately over WebSocket if open
      if (onlineWs && onlineWs.readyState === WebSocket.OPEN) {
        try {
          onlineWs.send(
            JSON.stringify({
              type: 'move',
              code: roomCode,
              playerToken,
              move: movePayload
            })
          );
        } catch {
          // ignore
        }
      }

      // 2. Also POST to /api/rooms/move for HTTP/SSE persistence
      try {
        const res = await fetch('/api/rooms/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: roomCode,
            ...movePayload
          })
        });
        if (res.ok) return;
      } catch {
        // Fall through to local BroadcastChannel / localStorage sync
      }

      const stRoom = getStaticRoom(roomCode) || {
        code: roomCode,
        status: 'playing',
        whiteJoined: true,
        blackJoined: true,
        turn: movePayload.color === 'w' ? 'b' : 'w',
        moves: [],
        resetCount: 0,
        updatedAt: Date.now()
      };
      stRoom.moves = stRoom.moves || [];
      stRoom.moves.push({
        seq: stRoom.moves.length + 1,
        color: movePayload.color,
        from: movePayload.from,
        to: movePayload.to,
        promotion: movePayload.promotion || 'archbishop',
        ts: Date.now()
      });
      stRoom.turn = movePayload.color === 'w' ? 'b' : 'w';
      stRoom.updatedAt = Date.now();
      saveAndBroadcastStaticRoom(stRoom);
      if (mpBroadcastChannel) {
        mpBroadcastChannel.postMessage({ type: 'move', move: movePayload });
      }
    }

    function subscribeMultiplayerRoom(code) {
      stopMultiplayerSync();
      roomCode = code;

      // 1. Real-time WebSocket connection (/ws-online)
      connectOnlineWebSocket(code);

      // 2. Same-origin cross-tab BroadcastChannel + storage event listener
      if (typeof BroadcastChannel !== 'undefined') {
        mpBroadcastChannel = new BroadcastChannel(`wizard_chess_bc_${code}`);
        mpBroadcastChannel.onmessage = (ev) => {
          handleIncomingOnlinePayload(ev.data);
        };
      }

      // 3. Server-Sent Events (/api/rooms/stream) backup
      try {
        mpEventSource = new EventSource(`/api/rooms/stream?code=${code}`);
        mpEventSource.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            handleIncomingOnlinePayload(payload);
          } catch {
            // ignore
          }
        };
        mpEventSource.onerror = () => {
          if (mpEventSource) {
            mpEventSource.close();
            mpEventSource = null;
          }
        };
      } catch {
        // SSE not available
      }
    }

    async function startQuickOnlineMatch() {
      const mpStatusEl = document.getElementById('mp-status-msg');
      if (mpStatusEl) {
        mpStatusEl.textContent = '🔍 Поиск свободного соперника в сети...';
      }
      ensurePlayerToken();
      updateOnlineStatusUI('Поиск соперника...', false, true);

      try {
        const res = await fetch('/api/matchmaking/quick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerToken,
            locationId: SANCTUM_LOCATIONS[currentLocationIdx]?.id || 'cathedral',
            formationIdx: currentArmyFormationIdx
          })
        });
        if (!res.ok) throw new Error('Matchmaking failed');
        const data = await res.json();
        roomCode = data.code;
        playerToken = data.playerToken;
        playerColor = data.color;
        gameMode = 'multi';
        scriptedGameActive = false;

        if (data.locationId) {
          setSanctumLocation(data.locationId, { silent: true, fromRemote: true });
        }

        const newUrl = `${window.location.pathname}?room=${roomCode}`;
        window.history.replaceState({}, '', newUrl);

        syncDisplayedRoomCode(roomCode);

        resetChessBoard(true, false);
        subscribeMultiplayerRoom(roomCode);

        if (data.matched) {
          onlineOpponentConnected = true;
          const mySideName = playerColor === 'w' ? 'Белые (♔)' : 'Чёрные (♚)';
          updateOnlineStatusUI(`В сети • Комната ${roomCode} • Вы: ${mySideName}`, true, false);
          if (mpStatusEl) {
            mpStatusEl.textContent = `⚔ Соперник найден! Комната ${roomCode}. Вы играете за ${mySideName}!`;
          }
          showNotificationToast(`⚔ Онлайн-матч начался! Комната ${roomCode} (${mySideName})`);
          closeLobbyModal();
        } else {
          updateOnlineStatusUI(`Ожидание соперника • Код: ${roomCode}`, false, true);
          if (mpStatusEl) {
            mpStatusEl.textContent = `⏳ Создана открытая комната поиска ${roomCode} (Вы — Белые). Как только второй игрок нажмёт «Быстрый поиск» или введёт код, матч начнётся!`;
          }
          showNotificationToast(`🔍 Ожидание соперника в очереди (Код комнаты: ${roomCode})`);
        }
      } catch {
        await createMultiplayerRoom('w');
      }
    }

    async function createMultiplayerRoom(preferredColor = 'w') {
      ensurePlayerToken();
      let code = '';
      let token = playerToken;
      let color = preferredColor === 'b' ? 'b' : 'w';

      try {
        const res = await fetch('/api/rooms/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferredColor: color,
            playerToken: token,
            locationId: SANCTUM_LOCATIONS[currentLocationIdx]?.id || 'cathedral',
            formationIdx: currentArmyFormationIdx
          })
        });
        if (!res.ok) throw new Error('Static host fallback');
        const data = await res.json();
        code = data.code;
        token = data.playerToken;
        color = data.color;
      } catch {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        for (let i = 0; i < 4; i++) {
          code += chars[Math.floor(Math.random() * chars.length)];
        }
        saveAndBroadcastStaticRoom({
          code,
          status: 'waiting',
          whiteJoined: color === 'w',
          blackJoined: color === 'b',
          turn: 'w',
          moves: [],
          resetCount: 0,
          updatedAt: Date.now()
        });
      }

      roomCode = code;
      playerToken = token;
      playerColor = color;
      gameMode = 'multi';
      scriptedGameActive = false;

      const newUrl = `${window.location.pathname}?room=${roomCode}`;
      window.history.replaceState({}, '', newUrl);

      syncDisplayedRoomCode(roomCode);
      await copyTextToClipboard(roomCode);
      const mpStatusEl = document.getElementById('mp-status-msg');
      if (mpStatusEl) {
        mpStatusEl.textContent = `Комната ${roomCode} создана и код скопирован в буфер! Вы играете за ${playerColor === 'w' ? 'Белых (♔)' : 'Чёрных (♚)'}. Вставьте код (Ctrl+V) другу.`;
      }
      showNotificationToast(`📋 Комната ${roomCode} создана (код скопирован)!`);

      updateOnlineStatusUI(`Ожидание соперника • Код: ${roomCode}`, false, true);
      resetChessBoard(true, false);
      subscribeMultiplayerRoom(roomCode);
    }

    async function joinMultiplayerRoom(codeInput) {
      const clean = extractRoomCodeFromText(codeInput);
      const inputEl = document.getElementById('input-room-code');
      if (inputEl && clean) {
        inputEl.value = clean;
      }
      const mpStatusEl = document.getElementById('mp-status-msg');
      if (!clean || clean.length < 4) {
        if (mpStatusEl) mpStatusEl.textContent = 'Введите или вставьте 4-значный код комнаты (например, A7K9).';
        return false;
      }
      ensurePlayerToken();

      let code = clean;
      let token = playerToken;
      let color = 'b';
      let existingMoves = [];
      let roomLocId = null;

      try {
        const res = await fetch('/api/rooms/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: clean, playerToken: token })
        });
        if (!res.ok) throw new Error('Static host fallback');
        const data = await res.json();
        code = data.code;
        token = data.playerToken;
        color = data.color;
        existingMoves = data.moves || [];
        roomLocId = data.locationId || null;
      } catch {
        const stRoom = getStaticRoom(clean);
        if (stRoom) {
          color = !stRoom.whiteJoined ? 'w' : 'b';
          existingMoves = stRoom.moves || [];
        } else {
          color = 'b';
        }
      }

      roomCode = code;
      playerToken = token;
      playerColor = color;
      gameMode = 'multi';
      scriptedGameActive = false;

      const newUrl = `${window.location.pathname}?room=${roomCode}`;
      window.history.replaceState({}, '', newUrl);

      if (roomLocId) {
        setSanctumLocation(roomLocId, { silent: true, fromRemote: true });
      }

      syncDisplayedRoomCode(roomCode);
      if (mpStatusEl) {
        mpStatusEl.textContent = `Вы подключились к комнате ${roomCode} за ${playerColor === 'w' ? 'Белых (♔)' : 'Чёрных (♚)'}!`;
      }

      updateOnlineStatusUI(
        `В сети • Комната ${roomCode} • Вы: ${playerColor === 'w' ? 'Белые (♔)' : 'Чёрные (♚)'}`,
        true,
        false
      );
      resetChessBoard(true, false);
      for (const mv of existingMoves) {
        if (mv && mv.from && mv.to) {
          executeChessMove(mv.from.r, mv.from.c, mv.to.r, mv.to.c, {
            fromRemote: true,
            promotion: mv.promotion || 'archbishop'
          });
        }
      }
      subscribeMultiplayerRoom(roomCode);
      closeLobbyModal();
      showNotificationToast(`🌐 Подключено к онлайн-комнате ${roomCode}!`);
      return true;
    }

    // =========================================================================
    // Camera Presets & HUD Controls
    // =========================================================================
    const camButtons = [
      'btn-cam-player',
      'btn-cam-top',
      'btn-cam-side',
      'btn-cam-wide'
    ];

    function setActiveCamButton(activeId) {
      for (const id of camButtons) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', id === activeId);
      }
    }

    let playerCamSide = 'w';     // toggles 'w' (White) <-> 'b' (Black) on repeat click of Player Cam
    let overheadCamSide = 'w';   // toggles 'w' (White) <-> 'b' (Black) on repeat click of Overhead
    let sideCamSide = 'east';    // toggles 'east' (+X) <-> 'west' (-X) on repeat click of Side
    let cathedralWideSide = 'north'; // toggles 'north' (Rose Window) <-> 'south' (Narthex Triptych) on repeat click of Cathedral

    function setCameraPose(posArr, targetArr) {
      activeCamTransition = null;
      if (Array.isArray(posArr) && posArr.length === 3) {
        camera.position.set(posArr[0], posArr[1], posArr[2]);
      }
      if (Array.isArray(targetArr) && targetArr.length === 3) {
        orbitControls.target.set(targetArr[0], targetArr[1], targetArr[2]);
      }
      enforceCathedralBoundsAndSolidColumns(null, camera.position, orbitControls.target);
      flushOrbitControlsDamping();
    }

    function setCameraPreset(preset) {
      if (preset === 'player') {
        const wasPlayerActive = document.getElementById('btn-cam-player')?.classList.contains('active');
        if (wasPlayerActive) {
          playerCamSide = playerCamSide === 'w' ? 'b' : 'w';
        } else {
          playerCamSide = playerColor === 'b' ? 'b' : 'w';
        }
        setActiveCamButton('btn-cam-player');
        setCameraForSide(playerCamSide, false);
      } else if (preset === 'top') {
        const wasTopActive = document.getElementById('btn-cam-top')?.classList.contains('active');
        if (wasTopActive) {
          overheadCamSide = overheadCamSide === 'w' ? 'b' : 'w';
        } else {
          overheadCamSide = playerColor === 'b' ? 'b' : 'w';
        }
        setActiveCamButton('btn-cam-top');
        const zSign = overheadCamSide === 'b' ? -1 : 1;
        smoothCameraTo(new THREE.Vector3(0, 6.85, zSign * 3.65), new THREE.Vector3(0, 0.78, 0), 0.75);
      } else if (preset === 'side') {
        const wasSideActive = document.getElementById('btn-cam-side')?.classList.contains('active');
        if (wasSideActive) {
          sideCamSide = sideCamSide === 'east' ? 'west' : 'east';
        } else {
          sideCamSide = 'east';
        }
        setActiveCamButton('btn-cam-side');
        const xSign = sideCamSide === 'west' ? -1 : 1;
        smoothCameraTo(new THREE.Vector3(xSign * 2.85, 1.85, 0), new THREE.Vector3(0, 0.84, 0), 0.75);
      } else if (preset === 'wide') {
        const wasWideActive = document.getElementById('btn-cam-wide')?.classList.contains('active');
        if (wasWideActive) {
          cathedralWideSide = cathedralWideSide === 'north' ? 'south' : 'north';
        } else {
          cathedralWideSide = playerColor === 'b' ? 'south' : 'north';
        }
        setActiveCamButton('btn-cam-wide');
        if (cathedralWideSide === 'south') {
          // Black's wide Cathedral perspective looking South toward the Narthex Triptych (chessboard centered in frame)
          smoothCameraTo(new THREE.Vector3(0, 2.55, -6.65), new THREE.Vector3(0, 1.95, 2.50), 0.85);
        } else {
          // White's wide Cathedral perspective looking North toward the Rose Window (chessboard centered in frame)
          smoothCameraTo(new THREE.Vector3(0, 2.55, 6.65), new THREE.Vector3(0, 1.95, -2.50), 0.85);
        }
      } else if (preset === 'white_backdrop') {
        smoothCameraTo(new THREE.Vector3(0, 2.35, -3.10), new THREE.Vector3(0, 2.20, 8.50), 0.85);
      } else if (preset === 'vaults') {
        smoothCameraTo(new THREE.Vector3(-1.60, 2.65, 3.20), new THREE.Vector3(2.20, 7.60, -9.50), 0.85);
      } else if (preset === 'side_windows') {
        smoothCameraTo(new THREE.Vector3(-1.40, 2.30, 0.60), new THREE.Vector3(5.20, 4.10, -5.80), 0.85);
      } else if (preset === 'back_windows') {
        smoothCameraTo(new THREE.Vector3(0, 3.40, -7.80), new THREE.Vector3(0, 4.60, -18.10), 0.85);
      } else if (preset === 'rear_windows') {
        smoothCameraTo(new THREE.Vector3(0, 3.40, 7.80), new THREE.Vector3(0, 4.60, 18.10), 0.85);
      }
    }

    document.getElementById('btn-cam-player')?.addEventListener('click', () => setCameraPreset('player'));
    document.getElementById('btn-cam-top')?.addEventListener('click', () => setCameraPreset('top'));
    document.getElementById('btn-cam-side')?.addEventListener('click', () => setCameraPreset('side'));
    document.getElementById('btn-cam-wide')?.addEventListener('click', () => setCameraPreset('wide'));
    document.getElementById('btn-hide-ui')?.addEventListener('click', () => toggleUI());

    document.getElementById('btn-script-modal')?.addEventListener('click', () => openLobbyModal('script'));
    document.getElementById('btn-script-prev')?.addEventListener('click', () => stepScriptBackward());
    document.getElementById('btn-script-next')?.addEventListener('click', () => stepScriptForward());

    document.getElementById('btn-ai-move')?.addEventListener('click', () => {
      triggerAIMoveNow();
    });

    document.getElementById('btn-side-toggle')?.addEventListener('click', () => {
      if (gameMode !== 'single') return;
      playerColor = playerColor === 'w' ? 'b' : 'w';
      resetChessBoard(true, scriptedGameActive);
    });

    document.getElementById('btn-reset')?.addEventListener('click', async () => {
      if (gameMode === 'multi' && roomCode) {
        const stRoom = getStaticRoom(roomCode);
        if (stRoom) {
          stRoom.moves = [];
          stRoom.turn = 'w';
          stRoom.resetCount = (stRoom.resetCount || 0) + 1;
          stRoom.updatedAt = Date.now();
          saveAndBroadcastStaticRoom(stRoom);
          applyRemoteRoomState(stRoom);
        }
        await mpApiRequest(`/api/rooms/${roomCode}/reset`, { method: 'POST' });
      } else {
        resetChessBoard(true, false);
      }
    });

    // =========================================================================
    // New Pieces Arsenal Dock, Transmutation, Visual Style & Update Controls
    // =========================================================================
    const ALL_DOCK_PIECES = [
      'demon_rider',
      'archbishop',
      'chancellor',
      'wizard',
      'dragon',
      'queen',
      'knight',
      'rook',
      'bishop',
      'pawn'
    ];

    function updateNewPiecesDockUI(lastActionNote = '') {
      const armyBtn = document.getElementById('btn-army-mode');
      const curArmy = ARMY_FORMATIONS[currentArmyFormationIdx] || ARMY_FORMATIONS[0];
      if (armyBtn) {
        armyBtn.textContent = curArmy.ruLabel;
      }

      const styleBtn = document.getElementById('btn-style-mode');
      const curStyle = PIECE_VISUAL_STYLES[currentVisualStyleIdx] || PIECE_VISUAL_STYLES[0];
      if (styleBtn) {
        styleBtn.textContent = curStyle.ruLabel;
      }

      for (const pType of ALL_DOCK_PIECES) {
        const btn = document.getElementById(`btn-piece-${pType}`);
        if (btn) {
          btn.classList.toggle('active', selectedPromotionType === pType);
        }
      }

      const info = NEW_PIECE_INFO[selectedPromotionType] || NEW_PIECE_INFO.demon_rider;
      const infoEl = document.getElementById('new-piece-rule-hint');
      if (infoEl) {
        infoEl.textContent = lastActionNote || info.desc;
      }
      const badgeEl = document.getElementById('drawer-active-piece-badge');
      if (badgeEl) {
        badgeEl.textContent = `${info.icon} ${info.ruName}`;
      }
    }

    function rebuildCurrentBoardMeshes() {
      const savedCells = boardState.map((row) =>
        row.map((p) => (p ? { type: p.type, color: p.color, hasMoved: Boolean(p.hasMoved) } : null))
      );
      clearAllPieces();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const cell = savedCells[r][c];
          if (cell) {
            const inst = instantiatePiece(cell.type, cell.color, r, c);
            inst.hasMoved = cell.hasMoved;
            boardState[r][c] = inst;
          }
        }
      }
      if (selectedSquare) {
        validMoves = getLegalMovesForPiece(selectedSquare.r, selectedSquare.c);
        showSquareHighlights(selectedSquare.r, selectedSquare.c, validMoves);
      }
      renderer.shadowMap.needsUpdate = true;
    }

    function setPieceVisualStyle(idxOrId) {
      if (typeof idxOrId === 'string') {
        const found = PIECE_VISUAL_STYLES.findIndex((s) => s.id === idxOrId);
        if (found >= 0) currentVisualStyleIdx = found;
      } else if (typeof idxOrId === 'number') {
        currentVisualStyleIdx =
          ((idxOrId % PIECE_VISUAL_STYLES.length) + PIECE_VISUAL_STYLES.length) %
          PIECE_VISUAL_STYLES.length;
      }
      rebuildCurrentBoardMeshes();
      const curStyle = PIECE_VISUAL_STYLES[currentVisualStyleIdx];
      updateNewPiecesDockUI(`Включён режим отображения: «${curStyle.ruLabel}»`);
      return curStyle;
    }

    function cyclePieceVisualStyle() {
      return setPieceVisualStyle(currentVisualStyleIdx + 1);
    }

    function refreshAndUpdateApp() {
      if (isAnimatingMove) {
        completeCurrentMoveImmediately();
      }
      rebuildCurrentBoardMeshes();
      impactFlashLight.color.setHex(0x2bc4ff);
      impactFlashLight.position.set(0, BOARD_SURFACE_Y + 0.65, 0);
      impactFlashLight.intensity = 7.5;
      setTimeout(() => {
        impactFlashLight.color.setHex(0xffc978);
      }, 650);
      renderer.shadowMap.needsUpdate = true;
      updateTurnUI();
      updateNewPiecesDockUI(
        '✔ Обновление установлено (v1.3.0): обычные фигуры, Всадники Демонов и 3D-модели синхронизированы!'
      );
      const toast = document.getElementById('update-status-toast');
      if (toast) {
        toast.classList.add('visible');
        setTimeout(() => {
          toast.classList.remove('visible');
        }, 3200);
      }
      return true;
    }

    function setArmyFormation(idxOrId) {
      if (typeof idxOrId === 'string') {
        const foundIdx = ARMY_FORMATIONS.findIndex((f) => f.id === idxOrId);
        if (foundIdx >= 0) currentArmyFormationIdx = foundIdx;
      } else if (typeof idxOrId === 'number') {
        currentArmyFormationIdx = ((idxOrId % ARMY_FORMATIONS.length) + ARMY_FORMATIONS.length) % ARMY_FORMATIONS.length;
      }
      scriptedGameActive = false;
      resetChessBoard(false, false);
      updateNewPiecesDockUI();
      return ARMY_FORMATIONS[currentArmyFormationIdx];
    }

    function cycleArmyFormation() {
      return setArmyFormation(currentArmyFormationIdx + 1);
    }

    function transmutePieceAt(r, c, newType) {
      if (!NEW_PIECE_INFO[newType]) return false;
      const existing = boardState[r]?.[c];
      if (!existing || existing.type === 'king') return false;
      const wasMoved = existing.hasMoved;
      const color = existing.color;
      if (existing.mesh) {
        scene.remove(existing.mesh);
      }
      const replacement = instantiatePiece(newType, color, r, c);
      replacement.hasMoved = wasMoved;
      boardState[r][c] = replacement;

      const worldPos = boardToWorld(r, c);
      impactFlashLight.position.set(worldPos.x, BOARD_SURFACE_Y + 0.38, worldPos.z);
      impactFlashLight.intensity = 5.5;
      renderer.shadowMap.needsUpdate = true;
      return true;
    }

    function handleSelectOrTransmuteNewPiece(newType) {
      if (!NEW_PIECE_INFO[newType]) return false;
      selectedPromotionType = newType;
      const info = NEW_PIECE_INFO[newType];

      // If the player currently has a friendly non-King piece selected on the board, transmute it immediately!
      if (selectedSquare && !isAnimatingMove && !gameOver) {
        const selPiece = boardState[selectedSquare.r]?.[selectedSquare.c];
        if (selPiece && selPiece.color === currentTurn && selPiece.type !== 'king' && selPiece.type !== newType) {
          const { r, c } = selectedSquare;
          transmutePieceAt(r, c, newType);
          validMoves = getLegalMovesForPiece(r, c);
          showSquareHighlights(r, c, validMoves);
          updateNewPiecesDockUI(`Фигура превращена в «${info.ruName}»! ${info.desc}`);
          return true;
        }
      }

      updateNewPiecesDockUI(`${info.desc} (Выберите свою фигуру на доске и нажмите ещё раз для превращения)`);
      return false;
    }

    document.getElementById('btn-army-mode')?.addEventListener('click', () => {
      cycleArmyFormation();
    });
    document.getElementById('btn-style-mode')?.addEventListener('click', () => {
      cyclePieceVisualStyle();
    });
    document.getElementById('btn-update-app')?.addEventListener('click', () => {
      refreshAndUpdateApp();
    });
    document.getElementById('btn-update-top')?.addEventListener('click', () => {
      refreshAndUpdateApp();
    });

    for (const pType of ALL_DOCK_PIECES) {
      document.getElementById(`btn-piece-${pType}`)?.addEventListener('click', () => {
        handleSelectOrTransmuteNewPiece(pType);
      });
    }

    // =========================================================================
    // 9 Comprehensive Gameplay, Audio, Boss Campaign & Tactical Upgrades
    // =========================================================================
    // 1) Web Audio Procedural Sound Synthesizer (Stone Slide, Shatter, Demon Roar, Cathedral Bell)
    let soundEnabled = true;
    let audioCtx = null;

    function getAudioCtx() {
      if (!soundEnabled) return null;
      try {
        if (!audioCtx) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (Ctx) audioCtx = new Ctx();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        return audioCtx;
      } catch (e) {
        return null;
      }
    }

    function playSanctumSound(effect) {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      try {
        if (effect === 'move' || effect === 'demon_move') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = effect === 'demon_move' ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(effect === 'demon_move' ? 115 : 88, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.24);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.27);
        } else if (effect === 'capture') {
          for (const freq of [135, 72, 290]) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = freq > 200 ? 'square' : 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(28, now + 0.42);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
          }
        } else if (effect === 'ability') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(680, now + 0.22);
          osc.frequency.exponentialRampToValueAtTime(420, now + 0.48);
          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.50);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.52);
        } else if (effect === 'check' || effect === 'checkmate') {
          const bellFreqs = effect === 'checkmate' ? [196, 293.66, 392, 587.33] : [220, 440];
          for (const f of bellFreqs) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 1.18);
          }
        }
      } catch (e) {}
    }

    // 2) Active Piece Abilities (Hellfire Traps, Arcane Shields, Dragon Breath, Archbishop Blessing)
    const activeBoardEffectsGroup = new THREE.Group();
    scene.add(activeBoardEffectsGroup);
    let activeTraps = [];   // { r, c, ownerColor, turnsLeft, mesh }
    let activeShields = []; // { piece, turnsLeft, mesh }
    let abilityCooldown = { w: 0, b: 0 };

    function clearBoardTrapAndShieldMeshes() {
      while (activeBoardEffectsGroup.children.length > 0) {
        activeBoardEffectsGroup.remove(activeBoardEffectsGroup.children[0]);
      }
      activeTraps = [];
      activeShields = [];
      abilityCooldown = { w: 0, b: 0 };
      capturedHistoryWhite = [];
      capturedHistoryBlack = [];
    }

    function isMoveBlockedByTrapOrShield(moverPiece, destR, destC) {
      // Enemy cannot step onto a Hellfire Trap
      if (activeTraps.some((t) => t.r === destR && t.c === destC && t.ownerColor !== moverPiece.color && t.turnsLeft > 0)) {
        return true;
      }
      // Enemy cannot capture a piece protected by an Arcane Shield
      const target = boardState[destR]?.[destC];
      if (target && target.color !== moverPiece.color) {
        if (activeShields.some((s) => s.piece === target && s.turnsLeft > 0)) {
          return true;
        }
      }
      return false;
    }

    function tickAbilitiesOnTurnEnd() {
      if (abilityCooldown[currentTurn] > 0) {
        abilityCooldown[currentTurn] -= 1;
      }
      for (let i = activeTraps.length - 1; i >= 0; i--) {
        activeTraps[i].turnsLeft -= 1;
        if (activeTraps[i].turnsLeft <= 0) {
          activeBoardEffectsGroup.remove(activeTraps[i].mesh);
          activeTraps.splice(i, 1);
        }
      }
      for (let i = activeShields.length - 1; i >= 0; i--) {
        const sh = activeShields[i];
        sh.turnsLeft -= 1;
        if (sh.piece && sh.piece.mesh) {
          sh.mesh.position.set(sh.piece.mesh.position.x, BOARD_SURFACE_Y + 0.24, sh.piece.mesh.position.z);
        }
        if (sh.turnsLeft <= 0 || !sh.piece || !boardState[sh.piece.r]?.[sh.piece.c]) {
          activeBoardEffectsGroup.remove(sh.mesh);
          activeShields.splice(i, 1);
        }
      }
      updateAbilityButtonUI();
    }

    function updateAbilityButtonUI() {
      const btn = document.getElementById('btn-ability-cast');
      if (!btn) return;
      const cd = abilityCooldown[playerColor] || 0;
      if (cd > 0) {
        btn.textContent = `⚡ Способность (${cd} х.)`;
      } else {
        btn.textContent = '⚡ Способность фигуры';
      }
    }

    function castSelectedPieceAbility() {
      if (isAnimatingMove || gameOver) return false;
      const cd = abilityCooldown[currentTurn] || 0;
      if (cd > 0) {
        showNotificationToast(`Способность перезаряжается (осталось ходов: ${cd})`);
        return false;
      }
      // Find selected friendly piece or pick the strongest special friendly piece on board
      let targetPiece = null;
      if (selectedSquare && boardState[selectedSquare.r]?.[selectedSquare.c]?.color === currentTurn) {
        targetPiece = boardState[selectedSquare.r][selectedSquare.c];
      } else {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = boardState[r][c];
            if (p && p.color === currentTurn && ['demon_rider', 'dragon', 'wizard', 'archbishop', 'chancellor', 'queen'].includes(p.type)) {
              targetPiece = p;
              break;
            }
          }
          if (targetPiece) break;
        }
      }
      if (!targetPiece) {
        showNotificationToast('Сначала выберите свою фигуру на доске для применения способности!');
        return false;
      }

      playSanctumSound('ability');
      const pos = boardToWorld(targetPiece.r, targetPiece.c);
      abilityCooldown[currentTurn] = 2;

      if (targetPiece.type === 'demon_rider') {
        // Огненный след Бездны: ставит огненные ловушки вокруг всадника на 3 полухода
        const trapDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let placed = 0;
        for (const [dr, dc] of trapDirs) {
          const nr = targetPiece.r + dr;
          const nc = targetPiece.c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !boardState[nr][nc]) {
            const tPos = boardToWorld(nr, nc);
            const ringGeo = new THREE.TorusGeometry(0.14, 0.022, 12, 28);
            ringGeo.rotateX(Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.set(tPos.x, BOARD_SURFACE_Y + 0.02, tPos.z);
            activeBoardEffectsGroup.add(ringMesh);
            activeTraps.push({ r: nr, c: nc, ownerColor: currentTurn, turnsLeft: 3, mesh: ringMesh });
            placed++;
          }
        }
        impactFlashLight.color.setHex(0xff3b00);
        impactFlashLight.position.set(pos.x, BOARD_SURFACE_Y + 0.55, pos.z);
        impactFlashLight.intensity = 8.0;
        showNotificationToast(`🔥 Всадник Демона создал ${placed || 1} огненных печатей Бездны вокруг себя!`);
      } else if (targetPiece.type === 'dragon') {
        // Дыхание Дракона: испепеляет ближайшую вражескую пешку/лёгкую фигуру в радиусе 2 клеток
        let victim = null;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = targetPiece.r + dr;
            const nc = targetPiece.c + dc;
            const occ = boardState[nr]?.[nc];
            if (occ && occ.color !== currentTurn && occ.type !== 'king') {
              if (!victim || PIECE_VALUES[occ.type] < PIECE_VALUES[victim.type]) {
                victim = occ;
              }
            }
          }
        }
        if (victim) {
          const vPos = boardToWorld(victim.r, victim.c);
          scene.remove(victim.mesh);
          boardState[victim.r][victim.c] = null;
          spawnStoneShatter(vPos, victim.color);
          if (currentTurn === 'w') capturedByWhite += 1;
          else capturedByBlack += 1;
          recordCapturedPieceSymbol(currentTurn, victim.type);
          showNotificationToast('🐉 Дыхание Дракона испепелило вражескую фигуру на расстоянии!');
        } else {
          // If no enemy in range, grant Dragon fire shield
          grantArcaneShield(targetPiece, 0xff5500);
          showNotificationToast('🐉 Дракон окутал себя Огненной Чешуёй (неуязвимость на 1 ход)!');
        }
      } else {
        // Магический / Небесный Щит для выбранной фигуры
        const shieldColor = targetPiece.type === 'wizard' ? 0x2bc4ff : 0xf5d76e;
        grantArcaneShield(targetPiece, shieldColor);
        const info = NEW_PIECE_INFO[targetPiece.type] || { ruName: 'Фигура' };
        showNotificationToast(`🛡️ «${info.ruName}» защищена Магическим Щитом от взятия на следующий ход!`);
      }

      updateTurnUI();
      updateAbilityButtonUI();
      renderer.shadowMap.needsUpdate = true;
      return true;
    }

    function grantArcaneShield(piece, hexColor = 0x2bc4ff) {
      const pPos = boardToWorld(piece.r, piece.c);
      const shGeo = new THREE.SphereGeometry(0.19, 18, 14);
      const shMat = new THREE.MeshBasicMaterial({
        color: hexColor,
        transparent: true,
        opacity: 0.28,
        wireframe: true
      });
      const shMesh = new THREE.Mesh(shGeo, shMat);
      shMesh.position.set(pPos.x, BOARD_SURFACE_Y + 0.24, pPos.z);
      activeBoardEffectsGroup.add(shMesh);
      activeShields.push({ piece, turnsLeft: 3, mesh: shMesh });
      impactFlashLight.color.setHex(hexColor);
      impactFlashLight.position.set(pPos.x, BOARD_SURFACE_Y + 0.5, pPos.z);
      impactFlashLight.intensity = 7.0;
    }

    function showNotificationToast(msg) {
      const toast = document.getElementById('update-status-toast');
      if (toast) {
        toast.textContent = msg;
        toast.classList.add('visible');
        setTimeout(() => {
          toast.classList.remove('visible');
        }, 3200);
      }
      updateNewPiecesDockUI(msg);
    }

    // 3) Dynamic Cathedral Reaction on Check
    function triggerCathedralCheckReaction() {
      playSanctumSound('check');
      impactFlashLight.color.setHex(0xff1e00);
      impactFlashLight.position.set(0, BOARD_SURFACE_Y + 0.85, 0);
      impactFlashLight.intensity = 8.5;
      setTimeout(() => {
        impactFlashLight.color.setHex(0xffc978);
      }, 900);
    }

    // 4) Undo Move & Best Move Hint
    function handleUndoLastTurn() {
      if (isAnimatingMove || moveHistory.length === 0) {
        showNotificationToast('Нет ходов для отмены');
        return false;
      }
      // Step back 2 plies in single-player so it returns to the player's turn, or 1 ply if only 1 move made
      stepScriptBackward();
      if (gameMode === 'single' && currentTurn !== playerColor && moveHistory.length > 0) {
        stepScriptBackward();
      }
      playSanctumSound('move');
      showNotificationToast('↶ Ход отменён');
      return true;
    }

    function handleShowMoveHint() {
      if (isAnimatingMove || gameOver) return false;
      const best = chooseSmartAIMove(currentTurn, 'grandmaster');
      if (!best) return false;
      selectedSquare = { r: best.fromR, c: best.fromC };
      validMoves = getLegalMovesForPiece(best.fromR, best.fromC);
      showSquareHighlights(best.fromR, best.fromC, validMoves);

      // Add a bright golden-cyan hint beacon on the recommended target square
      const destPos = boardToWorld(best.toR, best.toC);
      const hintGeo = new THREE.RingGeometry(0.08, 0.175, 32);
      hintGeo.rotateX(-Math.PI / 2);
      const hintMat = new THREE.MeshBasicMaterial({ color: 0x38d9ff, side: THREE.DoubleSide });
      const hintMesh = new THREE.Mesh(hintGeo, hintMat);
      hintMesh.position.set(destPos.x, BOARD_SURFACE_Y + 0.018, destPos.z);
      squareHighlightsGroup.add(hintMesh);

      const files = 'abcdefgh';
      const piece = boardState[best.fromR][best.fromC];
      const pInfo = NEW_PIECE_INFO[piece?.type] || { ruName: 'Фигура' };
      const fromSq = `${files[best.fromC]}${8 - best.fromR}`;
      const toSq = `${files[best.toC]}${8 - best.toR}`;
      playSanctumSound('ability');
      showNotificationToast(`💡 Совет Гроссмейстера: ${pInfo.ruName} ${fromSq} → ${toSq}`);
      renderer.shadowMap.needsUpdate = true;
      return best;
    }

    // 5) Power Balance Bar & Captured Graveyard Icons
    let capturedHistoryWhite = [];
    let capturedHistoryBlack = [];

    function recordCapturedPieceSymbol(capturerColor, victimType) {
      const icon = NEW_PIECE_INFO[victimType]?.icon || '♟';
      if (capturerColor === 'w') capturedHistoryWhite.push(icon);
      else capturedHistoryBlack.push(icon);
    }

    function updatePowerBalanceAndGraveyardUI(capturedTray) {
      let wScore = 0;
      let bScore = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = boardState[r][c];
          if (p && p.type !== 'king') {
            const val = Math.round((PIECE_VALUES[p.type] || 100) / 100);
            if (p.color === 'w') wScore += val;
            else bScore += val;
          }
        }
      }
      const total = Math.max(1, wScore + bScore);
      const wPct = Math.max(12, Math.min(88, Math.round((wScore / total) * 100)));
      const fillEl = document.getElementById('power-bar-white-fill');
      if (fillEl) {
        fillEl.style.width = `${wPct}%`;
      }
      const scoreEl = document.getElementById('power-score-text');
      if (scoreEl) {
        scoreEl.textContent = `Сила армий — Белые: ${wScore} | Чёрные: ${bScore}`;
      }
      if (capturedTray) {
        if (capturedHistoryWhite.length > 0 || capturedHistoryBlack.length > 0) {
          const wIcons = capturedHistoryWhite.join(' ');
          const bIcons = capturedHistoryBlack.join(' ');
          capturedTray.textContent = `Трофеи Белых (${capturedByWhite}): ${wIcons || '—'}  |  Трофеи Чёрных (${capturedByBlack}): ${bIcons || '—'}`;
        } else {
          capturedTray.textContent = '';
        }
      }
    }

    // 6) Bosses & Campaign Mode («Испытания Собора»)
    const CAMPAIGN_BOSSES = [
      {
        id: 'boss_1',
        title: '1. Страж Паперти',
        subtitle: 'Классический гарнизон собора против вашей армии',
        aiPersona: 'guardian',
        blackBackRow: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
        blackFrontRow: ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn']
      },
      {
        id: 'boss_2',
        title: '2. Ковен Архимага',
        subtitle: 'Маги телепортации и Архиепископы Света',
        aiPersona: 'grandmaster',
        blackBackRow: ['chancellor', 'wizard', 'archbishop', 'queen', 'king', 'archbishop', 'wizard', 'chancellor'],
        blackFrontRow: ['pawn', 'pawn', 'wizard', 'pawn', 'pawn', 'wizard', 'pawn', 'pawn']
      },
      {
        id: 'boss_3',
        title: '3. Всадники Апокалипсиса',
        subtitle: 'Штурмовая кавалерия Всадников Демонов на обеих линиях',
        aiPersona: 'demon',
        blackBackRow: ['demon_rider', 'demon_rider', 'archbishop', 'queen', 'king', 'archbishop', 'demon_rider', 'demon_rider'],
        blackFrontRow: ['pawn', 'demon_rider', 'pawn', 'pawn', 'pawn', 'pawn', 'demon_rider', 'pawn']
      },
      {
        id: 'boss_4',
        title: '4. Гнездо Древних Драконов',
        subtitle: 'Крылатые Драконы и тяжёлые Канцлеры',
        aiPersona: 'demon',
        blackBackRow: ['dragon', 'chancellor', 'dragon', 'queen', 'king', 'dragon', 'chancellor', 'dragon'],
        blackFrontRow: ['pawn', 'pawn', 'pawn', 'dragon', 'dragon', 'pawn', 'pawn', 'pawn']
      },
      {
        id: 'boss_5',
        title: '5. Владыка Бездны (Финал)',
        subtitle: 'Легион Всадников Демонов, Драконов и Магов Бездны',
        aiPersona: 'grandmaster',
        blackBackRow: ['dragon', 'demon_rider', 'wizard', 'dragon', 'king', 'dragon', 'wizard', 'demon_rider'],
        blackFrontRow: ['demon_rider', 'pawn', 'demon_rider', 'pawn', 'pawn', 'demon_rider', 'pawn', 'demon_rider']
      }
    ];
    let activeCampaignBossIdx = -1;

    function startCampaignBoss(bossIdx) {
      const boss = CAMPAIGN_BOSSES[bossIdx];
      if (!boss) return false;
      activeCampaignBossIdx = bossIdx;
      const personaIdx = AI_PERSONAS.findIndex((p) => p.id === boss.aiPersona);
      if (personaIdx >= 0) currentAiPersonaIdx = personaIdx;
      updateAiPersonaButtonUI();

      playerColor = 'w';
      resetChessBoard(true, false);

      // Replace Black's lineup with the Boss formation
      for (let r = 0; r <= 1; r++) {
        for (let c = 0; c < 8; c++) {
          if (boardState[r][c]?.mesh) {
            scene.remove(boardState[r][c].mesh);
          }
          const type = r === 0 ? boss.blackBackRow[c] : boss.blackFrontRow[c];
          boardState[r][c] = instantiatePiece(type, 'b', r, c);
        }
      }
      updateTurnUI();
      playSanctumSound('check');
      showNotificationToast(`⚔ Начато испытание: «${boss.title}» — ${boss.subtitle}!`);
      return true;
    }

    function notifyCampaignBossResult(winnerColor) {
      if (activeCampaignBossIdx >= 0 && winnerColor === playerColor) {
        const boss = CAMPAIGN_BOSSES[activeCampaignBossIdx];
        showNotificationToast(`🏆 Босс «${boss.title}» повержен! Доступен следующий уровень испытаний!`);
      }
    }

    function updateAiPersonaButtonUI() {
      const btn = document.getElementById('btn-ai-persona');
      if (btn) {
        btn.textContent = AI_PERSONAS[currentAiPersonaIdx]?.ruLabel || 'ИИ: Гроссмейстер';
      }
    }

    // 7) Custom Army Slot Builder (Click slot 0..7 in drawer to assign selected piece to player's back row)
    function assignPieceToBackRowSlot(colIdx) {
      if (colIdx < 0 || colIdx > 7) return false;
      const homeRow = playerColor === 'b' ? 0 : 7;
      if (boardState[homeRow][colIdx]?.type === 'king') {
        showNotificationToast('Короля нельзя заменить в строю!');
        return false;
      }
      const pType = selectedPromotionType || 'demon_rider';
      ARMY_FORMATIONS[currentArmyFormationIdx].backRow[colIdx] = pType;
      transmutePieceAt(homeRow, colIdx, pType);
      updateTurnUI();
      updateBackRowConstructorUI();
      playSanctumSound('ability');
      const info = NEW_PIECE_INFO[pType] || { ruName: 'Фигура' };
      const files = 'abcdefgh';
      showNotificationToast(`На линию ${files[colIdx]}${playerColor === 'w' ? 1 : 8} назначена фигура «${info.ruName}»!`);
      return true;
    }

    function updateBackRowConstructorUI() {
      const homeRow = playerColor === 'b' ? 0 : 7;
      const files = 'abcdefgh';
      for (let c = 0; c < 8; c++) {
        const slotBtn = document.getElementById(`btn-army-slot-${c}`);
        if (slotBtn) {
          const piece = boardState[homeRow]?.[c];
          const type = piece?.type || ARMY_FORMATIONS[currentArmyFormationIdx].backRow[c];
          const icon = type === 'king' ? '♔' : (NEW_PIECE_INFO[type]?.icon || '♟');
          slotBtn.textContent = `${files[c]}: ${icon}`;
        }
      }
    }

    // =========================================================================
    // 10 Breathtaking 3D Sanctum Locations (including 2 Fiery Lava Realms)
    // =========================================================================
    const SANCTUM_LOCATIONS = [
      {
        id: 'cathedral',
        idx: 0,
        icon: '🏰',
        ruName: 'Готический Собор Святилища',
        shortName: 'Готический Собор',
        badge: 'Классика',
        isLava: false,
        desc: 'Древний готический собор с высокими каменными сводами, витражами, парными огненными жаровнями и обсидиановым алтарём.',
        bgHex: 0x070a12,
        fogHex: 0x080b14,
        fogDensity: 0.015,
        hemiSky: 0xd8ccb8,
        hemiGround: 0x261d14,
        hemiInt: 0.62,
        keyHex: 0xfff0d6,
        keyInt: 2.55,
        rimHex: 0xd8cbb8,
        rimInt: 0.72,
        brazierHex: 0xff8e32,
        brazierInt: 4.35,
        winSideHex: 0x90beff,
        winNorthHex: 0x9bc4ff,
        winSouthHex: 0xffb85c,
        wallTint: [1.0, 1.0, 1.0],
        floorTint: [1.0, 1.0, 1.0],
        floorRough: 0.80,
        floorMetal: 0.02,
        lightSqHex: 0xdcd3c2,
        darkSqHex: 0x14171f,
        trimHex: 0xd4af37,
        flameCore: [1.0, 0.96, 0.72],
        flameMid: [1.0, 0.56, 0.10],
        flameTip: [0.95, 0.20, 0.02],
        particleHex: 0xffd27d,
        particleCount: 90,
        particleSpeedY: 0.18
      },
      {
        id: 'lava_citadel',
        idx: 1,
        icon: '🌋',
        ruName: 'Огненная Цитадель Лавы',
        shortName: 'Цитадель Лавы',
        badge: '🔥 ЛАВА',
        isLava: true,
        desc: 'Огненная локация с лавой #1: Пол превращён в бурлящее озеро раскалённой магмы! Вокруг алтаря бьют лавовые гейзеры, возвышаются базальтовые скалы с огненными трещинами и летят искры.',
        bgHex: 0x1a0400,
        fogHex: 0x260600,
        fogDensity: 0.022,
        hemiSky: 0xff7b29,
        hemiGround: 0xff2200,
        hemiInt: 0.95,
        keyHex: 0xffaa44,
        keyInt: 2.85,
        rimHex: 0xff3300,
        rimInt: 1.35,
        brazierHex: 0xff4500,
        brazierInt: 6.80,
        winSideHex: 0xff3b00,
        winNorthHex: 0xff5500,
        winSouthHex: 0xff2200,
        wallTint: [0.52, 0.24, 0.18],
        floorTint: [0.45, 0.14, 0.08],
        floorRough: 0.62,
        floorMetal: 0.18,
        lightSqHex: 0xf4c490,
        darkSqHex: 0x1c0806,
        trimHex: 0xff6a00,
        flameCore: [1.0, 1.0, 0.85],
        flameMid: [1.0, 0.42, 0.02],
        flameTip: [0.95, 0.05, 0.0],
        particleHex: 0xff5e00,
        particleCount: 220,
        particleSpeedY: 0.85
      },
      {
        id: 'lava_forge',
        idx: 2,
        icon: '🔥',
        ruName: 'Вулкан Кузницы Демонов',
        shortName: 'Вулкан Кузницы',
        badge: '🔥 ЛАВА',
        isLava: true,
        desc: 'Огненная локация с лавой #2: Жерло действующего вулкана Бездны! Реки жидкого пламени и расплавленного золота, гигантские раскалённые цепи, демонические наковальни и обсидиановые шипы.',
        bgHex: 0x1f0700,
        fogHex: 0x2c0901,
        fogDensity: 0.024,
        hemiSky: 0xffae34,
        hemiGround: 0xff3300,
        hemiInt: 1.05,
        keyHex: 0xffc866,
        keyInt: 3.10,
        rimHex: 0xff5500,
        rimInt: 1.50,
        brazierHex: 0xff6a00,
        brazierInt: 7.20,
        winSideHex: 0xff6a00,
        winNorthHex: 0xff8800,
        winSouthHex: 0xff3300,
        wallTint: [0.42, 0.22, 0.14],
        floorTint: [0.38, 0.16, 0.06],
        floorRough: 0.50,
        floorMetal: 0.35,
        lightSqHex: 0xffdf9e,
        darkSqHex: 0x190b08,
        trimHex: 0xff9d00,
        flameCore: [1.0, 0.98, 0.80],
        flameMid: [1.0, 0.65, 0.05],
        flameTip: [1.0, 0.18, 0.0],
        particleHex: 0xffae00,
        particleCount: 240,
        particleSpeedY: 1.05
      },
      {
        id: 'ice_throne',
        idx: 3,
        icon: '❄️',
        ruName: 'Ледяной Трон Севера',
        shortName: 'Ледяной Трон',
        badge: 'Мерзлота',
        isLava: false,
        desc: 'Чертог вечной мерзлоты под сиянием северной Авроры. Зеркальный ледяной пол, исполинские сапфировые кристаллы льда, морозное пламя и кружащаяся метель.',
        bgHex: 0x031022,
        fogHex: 0x061933,
        fogDensity: 0.018,
        hemiSky: 0xb8ecff,
        hemiGround: 0x0c2c4d,
        hemiInt: 0.88,
        keyHex: 0xdff6ff,
        keyInt: 2.75,
        rimHex: 0x38bdf8,
        rimInt: 1.25,
        brazierHex: 0x00d4ff,
        brazierInt: 5.40,
        winSideHex: 0x38e8ff,
        winNorthHex: 0x00ffcc,
        winSouthHex: 0x38bdf8,
        wallTint: [0.68, 0.88, 1.05],
        floorTint: [0.62, 0.86, 1.05],
        floorRough: 0.12,
        floorMetal: 0.28,
        lightSqHex: 0xe6f7ff,
        darkSqHex: 0x0c223b,
        trimHex: 0x6ce5ff,
        flameCore: [0.90, 0.99, 1.0],
        flameMid: [0.20, 0.82, 1.0],
        flameTip: [0.02, 0.38, 0.95],
        particleHex: 0xb8f2ff,
        particleCount: 180,
        particleSpeedY: -0.42
      },
      {
        id: 'necropolis',
        idx: 4,
        icon: '💀',
        ruName: 'Некрополь Короля Лича',
        shortName: 'Некрополь Лича',
        badge: 'Некромантия',
        isLava: false,
        desc: 'Подземный склеп проклятых королей. Жаровни горят ядовито-изумрудным некро-пламенем, вокруг доски парят чёрные обелиски душ и светится ритуальный круг.',
        bgHex: 0x03120b,
        fogHex: 0x051c11,
        fogDensity: 0.021,
        hemiSky: 0x6ee7b7,
        hemiGround: 0x062417,
        hemiInt: 0.72,
        keyHex: 0xa7f3d0,
        keyInt: 2.35,
        rimHex: 0x10b981,
        rimInt: 1.30,
        brazierHex: 0x10ff68,
        brazierInt: 5.80,
        winSideHex: 0x10b981,
        winNorthHex: 0x34d399,
        winSouthHex: 0x059669,
        wallTint: [0.42, 0.62, 0.50],
        floorTint: [0.34, 0.52, 0.42],
        floorRough: 0.68,
        floorMetal: 0.12,
        lightSqHex: 0xcce8db,
        darkSqHex: 0x091912,
        trimHex: 0x34d399,
        flameCore: [0.85, 1.0, 0.88],
        flameMid: [0.12, 0.95, 0.42],
        flameTip: [0.02, 0.48, 0.22],
        particleHex: 0x34ff88,
        particleCount: 160,
        particleSpeedY: 0.48
      },
      {
        id: 'astral_observatory',
        idx: 5,
        icon: '🌌',
        ruName: 'Астральная Обсерватория Магов',
        shortName: 'Обсерватория Магов',
        badge: 'Космос',
        isLava: false,
        desc: 'Святилище архимагов посреди звёздной туманности. Вокруг шахматной доски вращаются гигантские золотые кольца армиллярной сферы и парят кристаллы эфира.',
        bgHex: 0x060417,
        fogHex: 0x0a0624,
        fogDensity: 0.016,
        hemiSky: 0xc4b5fd,
        hemiGround: 0x1e1040,
        hemiInt: 0.82,
        keyHex: 0xede9fe,
        keyInt: 2.65,
        rimHex: 0x8b5cf6,
        rimInt: 1.35,
        brazierHex: 0xa855f7,
        brazierInt: 5.60,
        winSideHex: 0x818cf8,
        winNorthHex: 0xc084fc,
        winSouthHex: 0x38bdf8,
        wallTint: [0.64, 0.58, 0.92],
        floorTint: [0.48, 0.42, 0.78],
        floorRough: 0.26,
        floorMetal: 0.32,
        lightSqHex: 0xe9d5ff,
        darkSqHex: 0x130d26,
        trimHex: 0xc084fc,
        flameCore: [0.95, 0.90, 1.0],
        flameMid: [0.68, 0.32, 1.0],
        flameTip: [0.22, 0.58, 1.0],
        particleHex: 0xd8b4fe,
        particleCount: 200,
        particleSpeedY: 0.22
      },
      {
        id: 'emerald_temple',
        idx: 6,
        icon: '🌿',
        ruName: 'Изумрудный Храм Древних',
        shortName: 'Изумрудный Храм',
        badge: 'Древние',
        isLava: false,
        desc: 'Затерянный подземный храм, озарённый гигантскими биолюминесцентными изумрудами, древними золотыми тотемами и парящими светлячками.',
        bgHex: 0x041712,
        fogHex: 0x07221b,
        fogDensity: 0.017,
        hemiSky: 0xa7f3d0,
        hemiGround: 0x1c2e24,
        hemiInt: 0.80,
        keyHex: 0xfef08a,
        keyInt: 2.70,
        rimHex: 0x10b981,
        rimInt: 1.15,
        brazierHex: 0xfbbf24,
        brazierInt: 5.10,
        winSideHex: 0x34d399,
        winNorthHex: 0xfde047,
        winSouthHex: 0x10b981,
        wallTint: [0.68, 0.86, 0.74],
        floorTint: [0.56, 0.76, 0.62],
        floorRough: 0.58,
        floorMetal: 0.14,
        lightSqHex: 0xe2f2e8,
        darkSqHex: 0x0b211a,
        trimHex: 0xfbbf24,
        flameCore: [1.0, 0.98, 0.78],
        flameMid: [0.25, 0.92, 0.58],
        flameTip: [0.05, 0.55, 0.35],
        particleHex: 0xfde047,
        particleCount: 150,
        particleSpeedY: 0.28
      },
      {
        id: 'blood_arena',
        idx: 7,
        icon: '🩸',
        ruName: 'Кровавая Арена Вальхаллы',
        shortName: 'Арена Вальхаллы',
        badge: 'Битва',
        isLava: false,
        desc: 'Багровый чертог павших героев под сиянием Кровавой Луны. Вокруг поля боя вонзены исполинские двуручные мечи титанов, а жаровни пылают алым огнём.',
        bgHex: 0x1a0307,
        fogHex: 0x26050b,
        fogDensity: 0.020,
        hemiSky: 0xfda4af,
        hemiGround: 0x33060d,
        hemiInt: 0.84,
        keyHex: 0xfecdd3,
        keyInt: 2.65,
        rimHex: 0xf43f5e,
        rimInt: 1.40,
        brazierHex: 0xe11d48,
        brazierInt: 6.20,
        winSideHex: 0xf43f5e,
        winNorthHex: 0xe11d48,
        winSouthHex: 0xfb7185,
        wallTint: [0.66, 0.34, 0.38],
        floorTint: [0.54, 0.24, 0.28],
        floorRough: 0.56,
        floorMetal: 0.22,
        lightSqHex: 0xf5d0d6,
        darkSqHex: 0x1f070c,
        trimHex: 0xf43f5e,
        flameCore: [1.0, 0.88, 0.90],
        flameMid: [0.98, 0.12, 0.26],
        flameTip: [0.55, 0.02, 0.08],
        particleHex: 0xfb7185,
        particleCount: 170,
        particleSpeedY: 0.55
      },
      {
        id: 'golden_palace',
        idx: 8,
        icon: '👑',
        ruName: 'Золотой Чертог Императора',
        shortName: 'Золотой Чертог',
        badge: 'Империя',
        isLava: false,
        desc: 'Ослепительный тронный зал из белого мрамора и чистого золота, залитый солнечным светом. Над алтарём парят короны света и золотые арки триумфа.',
        bgHex: 0x171206,
        fogHex: 0x211a08,
        fogDensity: 0.014,
        hemiSky: 0xfef3c7,
        hemiGround: 0x45320f,
        hemiInt: 0.96,
        keyHex: 0xfffbeb,
        keyInt: 3.05,
        rimHex: 0xf59e0b,
        rimInt: 1.25,
        brazierHex: 0xfbbf24,
        brazierInt: 5.50,
        winSideHex: 0xfde68a,
        winNorthHex: 0xfbbf24,
        winSouthHex: 0xf59e0b,
        wallTint: [1.08, 0.98, 0.78],
        floorTint: [1.06, 0.95, 0.75],
        floorRough: 0.22,
        floorMetal: 0.38,
        lightSqHex: 0xfffbeb,
        darkSqHex: 0x291f0c,
        trimHex: 0xfacc15,
        flameCore: [1.0, 1.0, 0.92],
        flameMid: [1.0, 0.82, 0.22],
        flameTip: [0.95, 0.52, 0.05],
        particleHex: 0xfde047,
        particleCount: 150,
        particleSpeedY: 0.25
      },
      {
        id: 'shadow_abyss',
        idx: 9,
        icon: '🔮',
        ruName: 'Трон Бездны и Теней',
        shortName: 'Трон Бездны',
        badge: 'Пустота',
        isLava: false,
        desc: 'Запредельное измерение фиолетового разлома Пустоты. Вокруг алтаря левитируют расколотые обсидиановые монолиты, вращаются порталы и пылает неоново-пурпурный огонь.',
        bgHex: 0x090214,
        fogHex: 0x110424,
        fogDensity: 0.020,
        hemiSky: 0xe879f9,
        hemiGround: 0x1f0538,
        hemiInt: 0.78,
        keyHex: 0xf5d0fe,
        keyInt: 2.55,
        rimHex: 0xd946ef,
        rimInt: 1.45,
        brazierHex: 0xd946ef,
        brazierInt: 6.10,
        winSideHex: 0xc026d3,
        winNorthHex: 0xe879f9,
        winSouthHex: 0x9333ea,
        wallTint: [0.52, 0.32, 0.68],
        floorTint: [0.42, 0.24, 0.56],
        floorRough: 0.32,
        floorMetal: 0.30,
        lightSqHex: 0xf3e8ff,
        darkSqHex: 0x11051f,
        trimHex: 0xe879f9,
        flameCore: [1.0, 0.88, 1.0],
        flameMid: [0.88, 0.18, 0.96],
        flameTip: [0.45, 0.04, 0.72],
        particleHex: 0xf0abfc,
        particleCount: 185,
        particleSpeedY: 0.52
      }
    ];

    let currentLocationIdx = 0;
    const locationPropsGroup = new THREE.Group();
    scene.add(locationPropsGroup);
    const lavaShaderUniforms = [];
    const locationAnimatedObjects = [];
    let locationParticleSystem = null;

    function createMoltenLavaShader(opts = {}) {
      const uniforms = {
        uTime: { value: 0 },
        uScale: { value: opts.scale || 0.38 },
        uSpeed: { value: opts.speed || 0.55 },
        uIsGoldForge: { value: opts.isGoldForge ? 1.0 : 0.0 }
      };
      lavaShaderUniforms.push(uniforms);

      return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          uniform float uTime;
          varying vec3 vWorldPos;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 pos = position;
            vec4 worldPos = modelMatrix * vec4(pos, 1.0);
            float distCenter = length(worldPos.xz);
            float canWave = smoothstep(2.1, 3.2, distCenter);
            float wave = (
              sin(worldPos.x * 1.4 + uTime * 2.1) * 0.055 +
              cos(worldPos.z * 1.2 - uTime * 1.8) * 0.055
            ) * canWave;
            worldPos.y += wave;
            vWorldPos = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uScale;
          uniform float uSpeed;
          uniform float uIsGoldForge;
          varying vec3 vWorldPos;
          varying vec2 vUv;

          float hash2(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          float noise2(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash2(i);
            float b = hash2(i + vec2(1.0, 0.0));
            float c = hash2(i + vec2(0.0, 1.0));
            float d = hash2(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }

          float fbm(vec2 p) {
            float v = 0.0;
            float amp = 0.5;
            for (int i = 0; i < 4; i++) {
              v += amp * noise2(p);
              p = p * 2.03 + vec2(1.7, -1.3);
              amp *= 0.5;
            }
            return v;
          }

          void main() {
            vec2 p = vWorldPos.xz * uScale;
            float t = uTime * uSpeed;
            vec2 q = vec2(
              fbm(p + vec2(t * 0.35, -t * 0.25)),
              fbm(p + vec2(-t * 0.30, t * 0.40))
            );
            float n = fbm(p + q * 2.2 + vec2(0.0, -t * 0.45));
            float veins = abs(sin((n + q.x * 0.5) * 9.5 + t * 1.4));
            float magmaGlow = smoothstep(0.18, 0.92, 1.0 - veins);

            vec3 crustCol = vec3(0.07, 0.02, 0.015);
            vec3 darkMagma = mix(vec3(0.75, 0.08, 0.01), vec3(0.85, 0.22, 0.01), uIsGoldForge);
            vec3 midLava = mix(vec3(1.0, 0.38, 0.02), vec3(1.0, 0.62, 0.04), uIsGoldForge);
            vec3 hotCore = vec3(1.0, 0.95, 0.58) * 1.65;

            vec3 col = mix(crustCol, darkMagma, smoothstep(0.15, 0.50, n + magmaGlow * 0.4));
            col = mix(col, midLava, smoothstep(0.42, 0.78, magmaGlow));
            col = mix(col, hotCore, smoothstep(0.76, 0.98, magmaGlow));

            // Fade softly near far room boundaries
            float edgeFade = 1.0 - smoothstep(14.5, 18.2, max(abs(vWorldPos.x * 2.2), abs(vWorldPos.z)));
            gl_FragColor = vec4(col, clamp(edgeFade, 0.85, 1.0));
          }
        `
      });
    }

    function clearLocationProps() {
      while (locationPropsGroup.children.length > 0) {
        const ch = locationPropsGroup.children[0];
        locationPropsGroup.remove(ch);
      }
      lavaShaderUniforms.length = 0;
      locationAnimatedObjects.length = 0;
      locationParticleSystem = null;
    }

    let glowingParticleTex = null;
    function getGlowingParticleTexture() {
      if (glowingParticleTex) return glowingParticleTex;
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      g.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      g.addColorStop(0.35, 'rgba(255, 240, 200, 0.82)');
      g.addColorStop(0.7, 'rgba(255, 180, 100, 0.28)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      glowingParticleTex = new THREE.CanvasTexture(c);
      return glowingParticleTex;
    }

    function spawnLocationParticles(loc) {
      const count = Math.round((loc.particleCount || 160) * 1.45);
      const positions = new Float32Array(count * 3);
      const phases = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 12.5;
        positions[i * 3 + 1] = 0.22 + Math.random() * 8.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 26.0;
        phases[i] = Math.random() * Math.PI * 2;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({
        color: loc.particleHex,
        map: getGlowingParticleTexture(),
        size: loc.isLava ? 0.22 : 0.16,
        transparent: true,
        opacity: loc.isLava ? 0.96 : 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const pts = new THREE.Points(pGeo, pMat);
      locationPropsGroup.add(pts);
      locationParticleSystem = {
        points: pts,
        phases,
        speedY: loc.particleSpeedY || 0.35,
        count
      };
    }

    function buildLocationEnvironment3D(loc) {
      clearLocationProps();
      spawnLocationParticles(loc);

      // Hide the Gothic Cathedral GLB mesh in all non-cathedral locations so each of the 10 rooms has its own distinct 3D architecture!
      if (cathedralRootMesh) {
        cathedralRootMesh.visible = loc.id === 'cathedral';
      }

      if (loc.id === 'cathedral') {
        return;
      }

      // Common central pedestal under the chessboard (since cathedralRoot is hidden in locations 1..9)
      const daisMat = new THREE.MeshStandardMaterial({
        color: loc.darkSqHex,
        roughness: 0.45,
        metalness: 0.35
      });
      const daisTrimMat = new THREE.MeshStandardMaterial({
        color: loc.trimHex,
        roughness: 0.25,
        metalness: 0.85,
        emissive: loc.brazierHex,
        emissiveIntensity: 0.35
      });
      const centralDais = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.72, 3.85), daisMat);
      centralDais.position.set(0, 0.36, 0);
      centralDais.receiveShadow = true;
      locationPropsGroup.add(centralDais);

      const daisStep = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.24, 4.45), daisTrimMat);
      daisStep.position.set(0, 0.12, 0);
      daisStep.receiveShadow = true;
      locationPropsGroup.add(daisStep);

      if (loc.id === 'lava_citadel') {
        // 🌋 LAVA LOCATION #1: Open Volcanic Caldera Caverns with Molten Magma Sea, Basalt Bridges, Erupting Geysers & Cavern Roof Stalactites
        const lavaMat = createMoltenLavaShader({ scale: 0.42, speed: 0.68, isGoldForge: false });
        const lavaSeaGeo = new THREE.PlaneGeometry(38.0, 46.0, 64, 80);
        lavaSeaGeo.rotateX(-Math.PI / 2);
        const lavaSea = new THREE.Mesh(lavaSeaGeo, lavaMat);
        lavaSea.position.set(0, 0.04, 0);
        locationPropsGroup.add(lavaSea);

        // Obsidian Volcanic Cavern Dome & Jagged Crater Rim Walls
        const cavernRockMat = new THREE.MeshStandardMaterial({
          color: 0x140705,
          roughness: 0.88,
          metalness: 0.15,
          emissive: 0x380800,
          emissiveIntensity: 0.42,
          side: THREE.DoubleSide
        });
        const calderaWall = new THREE.Mesh(
          new THREE.CylinderGeometry(14.5, 16.5, 15.0, 24, 6, true),
          cavernRockMat
        );
        calderaWall.position.set(0, 6.8, 0);
        locationPropsGroup.add(calderaWall);

        // Glowing Magma Moat Rim around the central Obsidian Altar
        const moatMat = new THREE.MeshBasicMaterial({
          color: 0xff5500,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending
        });
        const moatRing = new THREE.Mesh(new THREE.RingGeometry(2.55, 3.35, 48), moatMat);
        moatRing.rotation.x = -Math.PI / 2;
        moatRing.position.set(0, 0.09, 0);
        locationPropsGroup.add(moatRing);
        locationAnimatedObjects.push((t) => {
          moatRing.scale.setScalar(1.0 + Math.sin(t * 3.2) * 0.05);
        });

        // 4 Erupting Lava Geyser Columns pouring molten magma from the upper volcanic ceiling
        const geyserCoords = [
          [-5.2, -5.2],
          [5.2, -5.2],
          [-5.2, 5.2],
          [5.2, 5.2]
        ];
        const geyserMat = createMoltenLavaShader({ scale: 0.85, speed: 1.95, isGoldForge: false });
        for (let i = 0; i < geyserCoords.length; i++) {
          const [gx, gz] = geyserCoords[i];
          const gCol = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.62, 12.5, 24, 16, true), geyserMat);
          gCol.position.set(gx, 6.2, gz);
          locationPropsGroup.add(gCol);

          const splashRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.85, 0.12, 12, 32),
            new THREE.MeshBasicMaterial({ color: 0xff7700 })
          );
          splashRing.rotation.x = Math.PI / 2;
          splashRing.position.set(gx, 0.14, gz);
          locationPropsGroup.add(splashRing);
          locationAnimatedObjects.push((t) => {
            gCol.rotation.y = t * 1.2 * (i % 2 === 0 ? 1 : -1);
            splashRing.scale.setScalar(1.0 + Math.sin(t * 5.0 + i) * 0.16);
          });
        }

        // 16 Jagged Volcanic Basalt Spires & Hanging Ceiling Stalactites
        const veinMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
        for (let i = 0; i < 16; i++) {
          const ang = (i / 16) * Math.PI * 2;
          const rad = i % 2 === 0 ? 6.8 : 9.6;
          const sx = Math.cos(ang) * rad;
          const sz = Math.sin(ang) * (rad * 1.15);
          const sh = 2.4 + (i % 4) * 0.95;

          const spireGroup = new THREE.Group();
          spireGroup.position.set(sx, 0.02, sz);
          const mainCone = new THREE.Mesh(new THREE.ConeGeometry(0.75, sh, 6), cavernRockMat);
          mainCone.position.y = sh * 0.5;
          const magmaRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 8, 18), veinMat);
          magmaRing.rotation.x = Math.PI / 2;
          magmaRing.position.y = sh * 0.35;
          spireGroup.add(mainCone, magmaRing);
          locationPropsGroup.add(spireGroup);

          // Hanging volcanic stalactite from cavern roof
          const stal = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.8, 6), cavernRockMat);
          stal.position.set(sx * 0.85, 11.2, sz * 0.85);
          stal.rotation.x = Math.PI;
          locationPropsGroup.add(stal);
        }
      } else if (loc.id === 'lava_forge') {
        // 🔥 LAVA LOCATION #2: Demon Forge Volcano — Colossal Iron Blast-Furnace Rotunda, Liquid Gold-Lava River, 8 Giant Hell-Chains & 4 Runic Anvils
        const forgeLavaMat = createMoltenLavaShader({ scale: 0.52, speed: 0.95, isGoldForge: true });
        const craterLake = new THREE.Mesh(new THREE.PlaneGeometry(38.0, 46.0, 64, 80), forgeLavaMat);
        craterLake.rotation.x = -Math.PI / 2;
        craterLake.position.set(0, 0.04, 0);
        locationPropsGroup.add(craterLake);

        const chainIronMat = new THREE.MeshStandardMaterial({
          color: 0x1c1210,
          roughness: 0.32,
          metalness: 0.90,
          emissive: 0xff3b00,
          emissiveIntensity: 0.55
        });

        // Octagonal Obsidian-Iron Forge Bastion Walls & Giant Furnace Pillars
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + Math.PI / 8;
          const px = Math.cos(ang) * 10.5;
          const pz = Math.sin(ang) * 10.5;
          const furnacePillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 12.0, 1.6), chainIronMat);
          furnacePillar.position.set(px, 6.0, pz);
          furnacePillar.lookAt(0, 6.0, 0);
          locationPropsGroup.add(furnacePillar);

          // Glowing Molten Slag Chute on each Furnace Pillar
          const chute = new THREE.Mesh(
            new THREE.PlaneGeometry(0.55, 10.5),
            new THREE.MeshBasicMaterial({ color: 0xff9d00, side: THREE.DoubleSide })
          );
          chute.position.set(px * 0.91, 5.5, pz * 0.91);
          chute.lookAt(0, 5.5, 0);
          locationPropsGroup.add(chute);
        }

        // Giant Overhead Crucible Ring suspended above the board
        const crucibleRing = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.55, 16, 48), chainIronMat);
        crucibleRing.rotation.x = Math.PI / 2;
        crucibleRing.position.set(0, 8.8, 0);
        locationPropsGroup.add(crucibleRing);

        // Concentric Molten Gold Forge Rings around the Altar
        for (const rad of [2.75, 3.65, 4.65]) {
          const forgeRing = new THREE.Mesh(
            new THREE.TorusGeometry(rad, 0.075, 12, 64),
            new THREE.MeshBasicMaterial({ color: 0xffae00 })
          );
          forgeRing.rotation.x = Math.PI / 2;
          forgeRing.position.set(0, 0.12, 0);
          locationPropsGroup.add(forgeRing);
          locationAnimatedObjects.push((t) => {
            forgeRing.rotation.z = t * (rad > 3.5 ? -0.35 : 0.45);
          });
        }

        // 4 Giant Forged Hell-Chains stretching from the upper Crucible to the Altar corners
        const chainCorners = [
          [-2.2, -2.1, -6.2, -6.2],
          [2.2, -2.1, 6.2, -6.2],
          [-2.2, 2.1, -6.2, 6.2],
          [2.2, 2.1, 6.2, 6.2]
        ];
        for (const [x0, z0, x1, z1] of chainCorners) {
          const startV = new THREE.Vector3(x0, 0.65, z0);
          const endV = new THREE.Vector3(x1, 8.6, z1);
          const links = 16;
          for (let k = 0; k <= links; k++) {
            const u = k / links;
            const pos = new THREE.Vector3().lerpVectors(startV, endV, u);
            const linkMesh = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.055, 10, 20), chainIronMat);
            linkMesh.position.copy(pos);
            linkMesh.rotation.set(0.6, k % 2 === 0 ? 0 : Math.PI / 2, 0.4);
            locationPropsGroup.add(linkMesh);
          }
        }

        // 4 Demonic Runic Anvils with Floating Molten Cores
        const anvilCoords = [
          [-4.2, -3.9],
          [4.2, -3.9],
          [-4.2, 3.9],
          [4.2, 3.9]
        ];
        for (let i = 0; i < anvilCoords.length; i++) {
          const [ax, az] = anvilCoords[i];
          const anvilGrp = new THREE.Group();
          anvilGrp.position.set(ax, 0.08, az);
          const basePed = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.85), chainIronMat);
          basePed.position.y = 0.32;
          const topHorn = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.25, 4), chainIronMat);
          topHorn.rotation.z = Math.PI / 2;
          topHorn.position.y = 0.78;
          const moltenOrb = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.32, 1),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
          );
          moltenOrb.position.y = 1.45;
          anvilGrp.add(basePed, topHorn, moltenOrb);
          locationPropsGroup.add(anvilGrp);
          locationAnimatedObjects.push((t) => {
            moltenOrb.rotation.y = t * 2.4 + i;
            moltenOrb.position.y = 1.45 + Math.sin(t * 3.8 + i) * 0.14;
          });
        }
      } else if (loc.id === 'ice_throne') {
        // ❄️ LOCATION #4: Frozen Ice Throne — Mirror Glacier Lake, 16 Colossal Sapphire Ice Spires, Ice Archways & Northern Lights Aurora
        const glacierFloorMat = new THREE.MeshStandardMaterial({
          color: 0x082038,
          roughness: 0.08,
          metalness: 0.55,
          emissive: 0x062848,
          emissiveIntensity: 0.45
        });
        const glacierFloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 48), glacierFloorMat);
        glacierFloor.rotation.x = -Math.PI / 2;
        glacierFloor.position.set(0, 0.02, 0);
        glacierFloor.receiveShadow = true;
        locationPropsGroup.add(glacierFloor);

        const iceCrystalMat = new THREE.MeshStandardMaterial({
          color: 0xa5f3fc,
          roughness: 0.06,
          metalness: 0.30,
          emissive: 0x0284c7,
          emissiveIntensity: 0.95,
          transparent: true,
          opacity: 0.88
        });

        // Giant Frozen Snowflake Mandala on the glacier floor
        for (const rad of [3.2, 5.2, 7.6]) {
          const frostRing = new THREE.Mesh(
            new THREE.RingGeometry(rad - 0.15, rad, 6),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
          );
          frostRing.rotation.x = -Math.PI / 2;
          frostRing.position.set(0, 0.05, 0);
          locationPropsGroup.add(frostRing);
          locationAnimatedObjects.push((t) => {
            frostRing.rotation.z = t * (rad > 5 ? -0.18 : 0.25);
          });
        }

        // 16 Towering Ice Fortress Crystal Pillars & Frozen Crystalline Arches
        for (let i = 0; i < 16; i++) {
          const ang = (i / 16) * Math.PI * 2;
          const rad = i % 2 === 0 ? 5.6 : 9.2;
          const cx = Math.cos(ang) * rad;
          const cz = Math.sin(ang) * rad;
          const h = i % 2 === 0 ? 4.8 : 8.5;
          const spire = new THREE.Mesh(new THREE.ConeGeometry(0.68, h, 6), iceCrystalMat);
          spire.position.set(cx, h * 0.5, cz);
          spire.rotation.z = (cx > 0 ? -1 : 1) * 0.12;
          locationPropsGroup.add(spire);
        }

        // Northern Lights (Aurora Borealis) Ribbon Curtains in the sky
        for (let a = 0; a < 3; a++) {
          const auroraRibbon = new THREE.Mesh(
            new THREE.CylinderGeometry(12.5 + a * 1.8, 12.5 + a * 1.8, 3.2, 48, 1, true),
            new THREE.MeshBasicMaterial({
              color: a === 1 ? 0x00ffcc : 0x38bdf8,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.24,
              blending: THREE.AdditiveBlending
            })
          );
          auroraRibbon.position.set(0, 8.2 + a * 1.4, 0);
          locationPropsGroup.add(auroraRibbon);
          locationAnimatedObjects.push((t) => {
            auroraRibbon.rotation.y = t * 0.15 * (a % 2 === 0 ? 1 : -1);
            auroraRibbon.position.y = 8.2 + a * 1.4 + Math.sin(t * 1.5 + a) * 0.35;
          });
        }
      } else if (loc.id === 'necropolis') {
        // 💀 LOCATION #5: Necropolis of the Lich King — Underground Soul Crypt, 12 Necromantic Obelisks, Ribcage Vault Arches & Emerald Soul Pool
        const cryptFloorMat = new THREE.MeshStandardMaterial({
          color: 0x05140d,
          roughness: 0.55,
          metalness: 0.25,
          emissive: 0x062e1e,
          emissiveIntensity: 0.45
        });
        const cryptFloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 48), cryptFloorMat);
        cryptFloor.rotation.x = -Math.PI / 2;
        cryptFloor.position.set(0, 0.02, 0);
        locationPropsGroup.add(cryptFloor);

        const necroMat = new THREE.MeshStandardMaterial({
          color: 0x0a1912,
          roughness: 0.30,
          metalness: 0.50,
          emissive: 0x10b981,
          emissiveIntensity: 0.72
        });

        // Concentric Necromantic Runic Ritual Circles
        for (const rad of [2.95, 4.45, 6.85]) {
          const sigilRing = new THREE.Mesh(
            new THREE.TorusGeometry(rad, 0.06, 10, 64),
            new THREE.MeshBasicMaterial({ color: 0x10ff68 })
          );
          sigilRing.rotation.x = Math.PI / 2;
          sigilRing.position.set(0, 0.06, 0);
          locationPropsGroup.add(sigilRing);
        }

        // 6 Giant Rib-Like Necropolis Vault Arches spanning overhead
        for (let z = -10; z <= 10; z += 4) {
          const ribArch = new THREE.Mesh(new THREE.TorusGeometry(8.8, 0.32, 8, 32, Math.PI), necroMat);
          ribArch.position.set(0, 0.1, z);
          locationPropsGroup.add(ribArch);
        }

        // 10 Floating Soul Obelisks around the Crypt
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2 + 0.3;
          const ox = Math.cos(ang) * 5.2;
          const oz = Math.sin(ang) * 5.8;
          const obGrp = new THREE.Group();
          obGrp.position.set(ox, 1.85, oz);
          const obShaft = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.85, 0.55), necroMat);
          const obTip = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.42, 0),
            new THREE.MeshBasicMaterial({ color: 0x34ff88 })
          );
          obTip.position.y = 1.75;
          obGrp.add(obShaft, obTip);
          locationPropsGroup.add(obGrp);
          locationAnimatedObjects.push((t) => {
            obGrp.position.y = 1.85 + Math.sin(t * 2.2 + i) * 0.28;
            obTip.rotation.y = t * 2.5;
          });
        }
      } else if (loc.id === 'astral_observatory') {
        // 🌌 LOCATION #6: Astral Observatory — Open Cosmic Platform Floating in Deep Space Nebula, 4 Giant Rotating Armillary Sphere Rings & Orbiting Planets
        const cosmicFloorMat = new THREE.MeshStandardMaterial({
          color: 0x0b0620,
          roughness: 0.15,
          metalness: 0.65,
          emissive: 0x2e1065,
          emissiveIntensity: 0.55
        });
        const cosmicPlatform = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 6.2, 0.5, 48), cosmicFloorMat);
        cosmicPlatform.position.set(0, -0.22, 0);
        locationPropsGroup.add(cosmicPlatform);

        const astralGoldMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          roughness: 0.16,
          metalness: 0.94,
          emissive: 0x7e22ce,
          emissiveIntensity: 0.58
        });

        // 4 Colossal Rotating Golden Armillary Sphere Rings enclosing the entire platform
        const ringRadii = [4.2, 5.8, 7.6, 9.8];
        for (let i = 0; i < ringRadii.length; i++) {
          const armRing = new THREE.Mesh(
            new THREE.TorusGeometry(ringRadii[i], 0.085, 16, 96),
            astralGoldMat
          );
          armRing.position.set(0, 1.65, 0);
          locationPropsGroup.add(armRing);
          locationAnimatedObjects.push((t) => {
            armRing.rotation.x = t * (0.22 + i * 0.08) * (i % 2 === 0 ? 1 : -1);
            armRing.rotation.y = t * (0.30 - i * 0.05);
          });
        }

        // Orbiting Celestial Planets & Moons in the surrounding space
        const planetColors = [0xc084fc, 0x38bdf8, 0xf472b6, 0xfacc15];
        for (let i = 0; i < 4; i++) {
          const planet = new THREE.Mesh(
            new THREE.SphereGeometry(0.65 + i * 0.18, 24, 24),
            new THREE.MeshStandardMaterial({
              color: planetColors[i],
              roughness: 0.3,
              emissive: planetColors[i],
              emissiveIntensity: 0.45
            })
          );
          locationPropsGroup.add(planet);
          const orbitR = 7.5 + i * 2.2;
          locationAnimatedObjects.push((t) => {
            const ang = t * (0.25 - i * 0.04) + i * 1.5;
            planet.position.set(Math.cos(ang) * orbitR, 3.2 + Math.sin(t + i) * 0.8, Math.sin(ang) * orbitR);
          });
        }
      } else if (loc.id === 'emerald_temple') {
        // 🌿 LOCATION #7: Emerald Temple of the Ancients — Stepped Mayan/Ancient Golden Pyramid Sanctuary & Giant Bioluminescent Emerald Monoliths
        const templeFloor = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 48),
          new THREE.MeshStandardMaterial({ color: 0x061f18, roughness: 0.5, metalness: 0.2 })
        );
        templeFloor.rotation.x = -Math.PI / 2;
        templeFloor.position.set(0, 0.02, 0);
        locationPropsGroup.add(templeFloor);

        const emMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          roughness: 0.12,
          metalness: 0.25,
          emissive: 0x059669,
          emissiveIntensity: 1.15
        });
        const ancientGoldMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          roughness: 0.28,
          metalness: 0.85
        });

        // 12 Giant Bioluminescent Emerald Crystal Clusters & Golden Obelisk Totems
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          const ex = Math.cos(ang) * 5.8;
          const ez = Math.sin(ang) * 5.8;
          const cryst = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), emMat);
          cryst.scale.set(0.75, 2.8, 0.75);
          cryst.position.set(ex, 1.45, ez);
          locationPropsGroup.add(cryst);

          const totem = new THREE.Mesh(new THREE.BoxGeometry(0.95, 5.5, 0.95), ancientGoldMat);
          totem.position.set(Math.cos(ang) * 9.5, 2.75, Math.sin(ang) * 9.5);
          totem.lookAt(0, 2.75, 0);
          locationPropsGroup.add(totem);

          locationAnimatedObjects.push((t) => {
            cryst.rotation.y = t * 0.8 + i;
            cryst.position.y = 1.45 + Math.sin(t * 2.0 + i) * 0.18;
          });
        }
      } else if (loc.id === 'blood_arena') {
        // 🩸 LOCATION #8: Blood Arena of Valhalla — Open-Air Colosseum Amphitheater under a Colossal Blood Moon & 12 Titan Greatswords
        const arenaSand = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 48),
          new THREE.MeshStandardMaterial({ color: 0x1f060a, roughness: 0.72, metalness: 0.15 })
        );
        arenaSand.rotation.x = -Math.PI / 2;
        arenaSand.position.set(0, 0.02, 0);
        locationPropsGroup.add(arenaSand);

        // Colosseum Circular Tiered Amphitheater Wall
        const colosseumWall = new THREE.Mesh(
          new THREE.CylinderGeometry(13.5, 11.2, 6.5, 32, 3, true),
          new THREE.MeshStandardMaterial({
            color: 0x2a0810,
            roughness: 0.65,
            metalness: 0.25,
            side: THREE.DoubleSide
          })
        );
        colosseumWall.position.set(0, 3.25, 0);
        locationPropsGroup.add(colosseumWall);

        // Giant Crimson Blood Moon hanging in the night sky
        const bloodMoon = new THREE.Mesh(
          new THREE.SphereGeometry(3.4, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0xe11d48 })
        );
        bloodMoon.position.set(0, 7.2, -13.5);
        locationPropsGroup.add(bloodMoon);

        const bladeMat = new THREE.MeshStandardMaterial({
          color: 0x27272a,
          roughness: 0.22,
          metalness: 0.90,
          emissive: 0xbe123c,
          emissiveIntensity: 0.72
        });
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + 0.25;
          const bx = Math.cos(ang) * 5.2;
          const bz = Math.sin(ang) * 5.2;
          const swordGrp = new THREE.Group();
          swordGrp.position.set(bx, 0, bz);
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.2, 0.08), bladeMat);
          blade.position.y = 2.0;
          const guard = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, 0.24), goldTrimMat);
          guard.position.y = 3.45;
          swordGrp.add(blade, guard);
          swordGrp.rotation.z = (bx > 0 ? 1 : -1) * 0.16;
          locationPropsGroup.add(swordGrp);
        }
      } else if (loc.id === 'golden_palace') {
        // 👑 LOCATION #9: Imperial Golden Palace — White Marble & Pure Gold Colonnade Hall with Floating Solar Halos
        const marbleFloor = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 48),
          new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.14, metalness: 0.35 })
        );
        marbleFloor.rotation.x = -Math.PI / 2;
        marbleFloor.position.set(0, 0.02, 0);
        locationPropsGroup.add(marbleFloor);

        const whiteMarbleMat = new THREE.MeshStandardMaterial({
          color: 0xfffbeb,
          roughness: 0.18,
          metalness: 0.22
        });
        const pureGoldMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          roughness: 0.15,
          metalness: 0.92,
          emissive: 0xd97706,
          emissiveIntensity: 0.35
        });

        // 12 Imperial White-Marble & Gold Triumphal Columns around the Circular Colonnade
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          const px = Math.cos(ang) * 7.8;
          const pz = Math.sin(ang) * 7.8;
          const colShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 7.5, 24), whiteMarbleMat);
          colShaft.position.set(px, 3.75, pz);
          const colBase = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.45, 24), pureGoldMat);
          colBase.position.set(px, 0.22, pz);
          const colCap = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.52, 0.55, 24), pureGoldMat);
          colCap.position.set(px, 7.5, pz);
          locationPropsGroup.add(colShaft, colBase, colCap);
        }

        // Golden Rotunda Ring Beam & Floating Solar Halos
        const rotundaBeam = new THREE.Mesh(new THREE.TorusGeometry(7.8, 0.38, 16, 64), pureGoldMat);
        rotundaBeam.rotation.x = Math.PI / 2;
        rotundaBeam.position.set(0, 7.8, 0);
        locationPropsGroup.add(rotundaBeam);

        const haloMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        for (let i = 0; i < 4; i++) {
          const sunHalo = new THREE.Mesh(new THREE.TorusGeometry(2.8 + i * 0.85, 0.055, 12, 64), haloMat);
          sunHalo.rotation.x = Math.PI / 2;
          sunHalo.position.set(0, 4.2 + i * 0.65, 0);
          locationPropsGroup.add(sunHalo);
          locationAnimatedObjects.push((t) => {
            sunHalo.position.y = 4.2 + i * 0.65 + Math.sin(t * 2.0 + i) * 0.16;
          });
        }
      } else if (loc.id === 'shadow_abyss') {
        // 🔮 LOCATION #10: Throne of the Shadow Abyss — Floating Obsidian Island in the Purple Void with Giant Dimensional Portals & Levitating Monoliths
        const voidIsland = new THREE.Mesh(
          new THREE.ConeGeometry(7.8, 3.2, 8),
          new THREE.MeshStandardMaterial({
            color: 0x090314,
            roughness: 0.25,
            metalness: 0.65,
            emissive: 0x4a044e,
            emissiveIntensity: 0.55
          })
        );
        voidIsland.rotation.x = Math.PI;
        voidIsland.position.set(0, -1.58, 0);
        locationPropsGroup.add(voidIsland);

        const voidMat = new THREE.MeshStandardMaterial({
          color: 0x0f051d,
          roughness: 0.18,
          metalness: 0.70,
          emissive: 0xa21caf,
          emissiveIntensity: 0.92
        });

        for (const pz of [-9.5, 9.5]) {
          const portalRing = new THREE.Mesh(
            new THREE.TorusGeometry(3.4, 0.18, 16, 64),
            new THREE.MeshBasicMaterial({ color: 0xe879f9 })
          );
          portalRing.position.set(0, 3.6, pz);
          const portalCore = new THREE.Mesh(
            new THREE.CircleGeometry(3.25, 48),
            new THREE.MeshBasicMaterial({
              color: 0x701a75,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.45
            })
          );
          portalCore.position.set(0, 3.6, pz);
          locationPropsGroup.add(portalRing, portalCore);
          locationAnimatedObjects.push((t) => {
            portalRing.rotation.z = t * 1.4;
          });
        }

        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + 0.3;
          const vx = Math.cos(ang) * 5.8;
          const vz = Math.sin(ang) * 5.8;
          const mono = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), voidMat);
          mono.scale.set(0.75, 2.8, 0.75);
          mono.position.set(vx, 2.1, vz);
          locationPropsGroup.add(mono);
          locationAnimatedObjects.push((t) => {
            mono.position.y = 2.1 + Math.sin(t * 2.4 + i) * 0.32;
            mono.rotation.y = -t * 1.1;
          });
        }
      }
    }

    function updateLocationsDrawerUI() {
      const loc = SANCTUM_LOCATIONS[currentLocationIdx] || SANCTUM_LOCATIONS[0];
      const topBtn = document.getElementById('top-location-btn-label');
      if (topBtn) {
        topBtn.textContent = `${loc.icon} Локация: ${loc.shortName}`;
      }
      const badgeEl = document.getElementById('drawer-active-location-badge');
      if (badgeEl) {
        badgeEl.textContent = `${loc.icon} ${loc.ruName}`;
      }
      const hintEl = document.getElementById('location-desc-hint');
      if (hintEl) {
        hintEl.textContent = `${loc.icon} ${loc.ruName} — ${loc.desc}`;
      }
      for (let i = 0; i < SANCTUM_LOCATIONS.length; i++) {
        const cardBtn = document.getElementById(`btn-location-${SANCTUM_LOCATIONS[i].id}`);
        if (cardBtn) {
          cardBtn.classList.toggle('active', i === currentLocationIdx);
        }
      }
    }

    function setSanctumLocation(idOrIdx, options = {}) {
      let targetIdx = 0;
      if (typeof idOrIdx === 'string') {
        const found = SANCTUM_LOCATIONS.findIndex((l) => l.id === idOrIdx);
        if (found >= 0) targetIdx = found;
      } else if (typeof idOrIdx === 'number') {
        targetIdx = ((idOrIdx % SANCTUM_LOCATIONS.length) + SANCTUM_LOCATIONS.length) % SANCTUM_LOCATIONS.length;
      }
      currentLocationIdx = targetIdx;
      const loc = SANCTUM_LOCATIONS[currentLocationIdx];

      // 1. Scene background & atmospheric fog
      scene.background = new THREE.Color(loc.bgHex);
      scene.fog = new THREE.FogExp2(loc.fogHex, loc.fogDensity);

      // 2. Hemisphere, Key, Rim, Window & Brazier Lights
      hemiLight.color.setHex(loc.hemiSky);
      hemiLight.groundColor.setHex(loc.hemiGround);
      hemiLight.intensity = loc.hemiInt;

      keyLight.color.setHex(loc.keyHex);
      keyLight.intensity = loc.keyInt;

      rimLight.color.setHex(loc.rimHex);
      rimLight.intensity = loc.rimInt;

      for (const bLight of brazierLights) {
        bLight.color.setHex(loc.brazierHex);
        bLight.userData.baseIntensity = loc.brazierInt;
        bLight.intensity = loc.brazierInt;
      }
      for (const sp of brazierGlowSprites) {
        sp.material.color.setHex(loc.brazierHex);
      }
      for (const wLight of sideWinLights) {
        wLight.color.setHex(loc.winSideHex);
      }
      northWinLight.color.setHex(loc.winNorthHex);
      southWinLight.color.setHex(loc.winSouthHex);

      // 3. Brazier Volumetric GLSL Flame Colors
      if (brazierFlameCoreMat && brazierFlameCoreMat.uniforms) {
        brazierFlameCoreMat.uniforms.uBaseColor.value.setRGB(...loc.flameCore);
        brazierFlameCoreMat.uniforms.uMidColor.value.setRGB(...loc.flameMid);
        brazierFlameCoreMat.uniforms.uTipColor.value.setRGB(...loc.flameTip);
      }
      if (brazierFlameMidMat && brazierFlameMidMat.uniforms) {
        brazierFlameMidMat.uniforms.uBaseColor.value.setRGB(...loc.flameMid);
        brazierFlameMidMat.uniforms.uMidColor.value.setRGB(...loc.flameTip);
        brazierFlameMidMat.uniforms.uTipColor.value.setRGB(...loc.flameTip);
      }
      if (brazierFlameOuterMat && brazierFlameOuterMat.uniforms) {
        brazierFlameOuterMat.uniforms.uBaseColor.value.setRGB(...loc.flameMid);
        brazierFlameOuterMat.uniforms.uMidColor.value.setRGB(...loc.flameTip);
        brazierFlameOuterMat.uniforms.uTipColor.value.setRGB(...loc.flameTip);
      }

      // 4. Re-tint Cathedral Walls, Columns, Floor & Stained Glass Windows
      for (const mat of cathedralWallMats) {
        if (mat.color) mat.color.setRGB(...loc.wallTint);
        mat.needsUpdate = true;
      }
      for (const mat of cathedralColumnMats) {
        if (mat.color) mat.color.setRGB(...loc.wallTint);
        mat.needsUpdate = true;
      }
      for (const mat of cathedralFloorMats) {
        if (mat.color) mat.color.setRGB(...loc.floorTint);
        mat.roughness = loc.floorRough;
        mat.metalness = loc.floorMetal;
        mat.needsUpdate = true;
      }
      for (const mat of cathedralAmberGlassMats) {
        mat.emissive.setHex(loc.winSouthHex);
        mat.needsUpdate = true;
      }
      for (const mat of cathedralBlueGlassMats) {
        mat.emissive.setHex(loc.winNorthHex);
        mat.needsUpdate = true;
      }

      // 5. Chessboard Tiles, Mirror Veins & Volumetric God Rays
      boardLightSqMat.color.setHex(loc.lightSqHex);
      boardDarkSqMat.color.setHex(loc.darkSqHex);
      goldTrimMat.color.setHex(loc.trimHex);
      updateBoardSurfaceVeinsForLocation(loc);
      buildBoardVolumetricGodRays(loc.brazierHex);
      if (bloomPass && currentGraphicsPresetIdx === 0) {
        bloomPass.strength = loc.isLava ? 0.54 : 0.42;
      }

      // 6. Build 3D Location Architecture, Lava Lakes, Geysers & Particles
      buildLocationEnvironment3D(loc);
      updateLocationsDrawerUI();

      // Sync location with online opponent if in a multiplayer room
      if (gameMode === 'multi' && roomCode && !options.fromRemote) {
        sendOnlineEvent({ type: 'location_change', locationId: loc.id });
      }

      if (!options.silent) {
        playSanctumSound(loc.isLava ? 'demon_move' : 'ability');
        impactFlashLight.color.setHex(loc.brazierHex);
        impactFlashLight.position.set(0, BOARD_SURFACE_Y + 0.85, 0);
        impactFlashLight.intensity = 7.5;
        showNotificationToast(
          `${loc.icon} Выбрана локация: «${loc.ruName}»${loc.isLava ? ' (🔥 Огненная арена с бурлящей лавой!)' : ''}`
        );
      }
      renderer.shadowMap.needsUpdate = true;
      return loc;
    }

    function cycleSanctumLocation() {
      return setSanctumLocation(currentLocationIdx + 1);
    }

    // =========================================================================
    // 4 Luxury Army Material Themes & Post-Processing HDR Graphics Pipeline
    // =========================================================================
    const ARMY_MATERIAL_THEMES = [
      {
        id: 'marble_obsidian',
        icon: '🏛',
        ruLabel: '🏛 Материал: Мрамор и Обсидиан',
        shortName: 'Мрамор и Обсидиан',
        wColor: 0xe6dfd0,
        wRough: 0.28,
        wMetal: 0.08,
        wEmissive: 0x000000,
        wEmissiveInt: 0,
        bColor: 0x222630,
        bRough: 0.22,
        bMetal: 0.28,
        bEmissive: 0x000000,
        bEmissiveInt: 0
      },
      {
        id: 'gold_bronze',
        icon: '👑',
        ruLabel: '👑 Материал: Золото и Бронза',
        shortName: 'Золото и Бронза',
        wColor: 0xfde047,
        wRough: 0.16,
        wMetal: 0.88,
        wEmissive: 0x78350f,
        wEmissiveInt: 0.18,
        bColor: 0x451a03,
        bRough: 0.20,
        bMetal: 0.84,
        bEmissive: 0x290f02,
        bEmissiveInt: 0.15
      },
      {
        id: 'jade_ruby',
        icon: '💎',
        ruLabel: '💎 Материал: Нефрит и Рубин',
        shortName: 'Нефрит и Рубин',
        wColor: 0x34d399,
        wRough: 0.14,
        wMetal: 0.26,
        wEmissive: 0x065f46,
        wEmissiveInt: 0.35,
        bColor: 0xbe123c,
        bRough: 0.14,
        bMetal: 0.32,
        bEmissive: 0x881337,
        bEmissiveInt: 0.42
      },
      {
        id: 'crystal_hellstone',
        icon: '🔥',
        ruLabel: '🔥 Материал: Кристалл и Адский камень',
        shortName: 'Кристалл и Адский камень',
        wColor: 0x7dd3fc,
        wRough: 0.10,
        wMetal: 0.35,
        wEmissive: 0x0284c7,
        wEmissiveInt: 0.48,
        bColor: 0x2a0808,
        bRough: 0.18,
        bMetal: 0.48,
        bEmissive: 0xdc2626,
        bEmissiveInt: 0.55
      }
    ];
    let currentArmyMaterialIdx = 0;

    function applyArmyMaterialThemeToMaterials(theme) {
      whitePieceMat.color.setHex(theme.wColor);
      whitePieceMat.roughness = theme.wRough;
      whitePieceMat.metalness = theme.wMetal;
      whitePieceMat.emissive.setHex(theme.wEmissive);
      whitePieceMat.emissiveIntensity = theme.wEmissiveInt;
      whitePieceMat.needsUpdate = true;

      blackPieceMat.color.setHex(theme.bColor);
      blackPieceMat.roughness = theme.bRough;
      blackPieceMat.metalness = theme.bMetal;
      blackPieceMat.emissive.setHex(theme.bEmissive);
      blackPieceMat.emissiveIntensity = theme.bEmissiveInt;
      blackPieceMat.needsUpdate = true;

      for (const pType of ['archbishop', 'chancellor', 'wizard', 'dragon', 'demon_rider', 'staunton']) {
        const wMat = specialPieceMats[`${pType}_w`];
        const bMat = specialPieceMats[`${pType}_b`];
        if (wMat) {
          wMat.color.setHex(theme.wColor);
          wMat.roughness = theme.wRough;
          wMat.metalness = theme.wMetal;
          wMat.emissive.setHex(theme.wEmissive);
          wMat.emissiveIntensity = theme.wEmissiveInt;
          wMat.needsUpdate = true;
        }
        if (bMat) {
          bMat.color.setHex(theme.bColor);
          bMat.roughness = theme.bRough;
          bMat.metalness = theme.bMetal;
          bMat.emissive.setHex(theme.bEmissive);
          bMat.emissiveIntensity = theme.bEmissiveInt;
          bMat.needsUpdate = true;
        }
      }
      renderer.shadowMap.needsUpdate = true;
    }

    function setArmyMaterialTheme(idOrIdx, silent = false) {
      let idx = 0;
      if (typeof idOrIdx === 'string') {
        const found = ARMY_MATERIAL_THEMES.findIndex((t) => t.id === idOrIdx);
        if (found >= 0) idx = found;
      } else if (typeof idOrIdx === 'number') {
        idx = ((idOrIdx % ARMY_MATERIAL_THEMES.length) + ARMY_MATERIAL_THEMES.length) % ARMY_MATERIAL_THEMES.length;
      }
      currentArmyMaterialIdx = idx;
      const theme = ARMY_MATERIAL_THEMES[currentArmyMaterialIdx];
      applyArmyMaterialThemeToMaterials(theme);

      const hudMatBtn = document.getElementById('btn-material-theme');
      if (hudMatBtn) {
        hudMatBtn.textContent = theme.ruLabel;
      }
      for (let i = 0; i < ARMY_MATERIAL_THEMES.length; i++) {
        const chip = document.getElementById(`btn-mat-${ARMY_MATERIAL_THEMES[i].id}`);
        if (chip) chip.classList.toggle('active', i === currentArmyMaterialIdx);
      }
      if (!silent) {
        playSanctumSound('ability');
        showNotificationToast(`${theme.icon} Выбран материал фигур: «${theme.shortName}»`);
      }
      return theme;
    }

    function cycleArmyMaterialTheme() {
      return setArmyMaterialTheme(currentArmyMaterialIdx + 1);
    }

    let composer = null;
    let bloomPass = null;
    const GRAPHICS_PRESETS = [
      {
        id: 'ultra_hdr',
        ruLabel: '✨ Графика: Ультра HDR',
        useBloom: true,
        bloomStrength: 0.44,
        useReflector: true,
        useGodRays: true
      },
      {
        id: 'cinematic',
        ruLabel: '🎬 Графика: Кино (Свечение)',
        useBloom: true,
        bloomStrength: 0.28,
        useReflector: false,
        useGodRays: true
      },
      {
        id: 'classic',
        ruLabel: '⚡ Графика: Быстрая (60+ FPS)',
        useBloom: false,
        bloomStrength: 0,
        useReflector: false,
        useGodRays: false
      }
    ];
    let currentGraphicsPresetIdx = 0;

    try {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.44,
        0.38,
        0.76
      );
      composer.addPass(bloomPass);
      const outputPass = new OutputPass();
      composer.addPass(outputPass);
    } catch {
      composer = null;
    }

    function setGraphicsPreset(idxOrId, silent = false) {
      let idx = 0;
      if (typeof idxOrId === 'string') {
        const found = GRAPHICS_PRESETS.findIndex((p) => p.id === idxOrId);
        if (found >= 0) idx = found;
      } else if (typeof idxOrId === 'number') {
        idx = ((idxOrId % GRAPHICS_PRESETS.length) + GRAPHICS_PRESETS.length) % GRAPHICS_PRESETS.length;
      }
      currentGraphicsPresetIdx = idx;
      const preset = GRAPHICS_PRESETS[currentGraphicsPresetIdx];
      if (bloomPass) {
        const loc = SANCTUM_LOCATIONS[currentLocationIdx];
        bloomPass.strength =
          preset.id === 'ultra_hdr' && loc?.isLava ? 0.54 : preset.bloomStrength;
      }
      if (boardReflectorMesh) {
        boardReflectorMesh.visible = preset.useReflector;
      }
      boardGodRaysGroup.visible = preset.useGodRays;

      const btn = document.getElementById('btn-graphics-preset');
      if (btn) {
        btn.textContent = preset.ruLabel;
        btn.classList.toggle('active', preset.useBloom);
      }
      if (!silent) {
        playSanctumSound('ability');
        showNotificationToast(`${preset.ruLabel} активирована!`);
      }
      return preset;
    }

    function cycleGraphicsPreset() {
      return setGraphicsPreset(currentGraphicsPresetIdx + 1);
    }

    document.getElementById('btn-material-theme')?.addEventListener('click', () => {
      cycleArmyMaterialTheme();
    });
    for (const matTheme of ARMY_MATERIAL_THEMES) {
      document.getElementById(`btn-mat-${matTheme.id}`)?.addEventListener('click', () => {
        setArmyMaterialTheme(matTheme.id);
      });
    }
    document.getElementById('btn-graphics-preset')?.addEventListener('click', () => {
      cycleGraphicsPreset();
    });

    document.getElementById('btn-ability-cast')?.addEventListener('click', () => {
      castSelectedPieceAbility();
    });
    document.getElementById('btn-undo-move')?.addEventListener('click', () => {
      handleUndoLastTurn();
    });
    document.getElementById('btn-hint-move')?.addEventListener('click', () => {
      handleShowMoveHint();
    });
    document.getElementById('btn-ai-persona')?.addEventListener('click', () => {
      currentAiPersonaIdx = (currentAiPersonaIdx + 1) % AI_PERSONAS.length;
      updateAiPersonaButtonUI();
      showNotificationToast(`Выбран характер соперника: ${AI_PERSONAS[currentAiPersonaIdx].ruLabel}`);
    });
    document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      const btn = document.getElementById('btn-sound-toggle');
      if (btn) {
        btn.textContent = soundEnabled ? '🔊 Звук: Вкл' : '🔇 Звук: Выкл';
      }
      if (soundEnabled) playSanctumSound('ability');
    });

    for (let i = 0; i < CAMPAIGN_BOSSES.length; i++) {
      document.getElementById(`btn-boss-${i}`)?.addEventListener('click', () => {
        startCampaignBoss(i);
      });
    }

    for (let c = 0; c < 8; c++) {
      document.getElementById(`btn-army-slot-${c}`)?.addEventListener('click', () => {
        assignPieceToBackRowSlot(c);
      });
    }

    for (const loc of SANCTUM_LOCATIONS) {
      document.getElementById(`btn-location-${loc.id}`)?.addEventListener('click', () => {
        setSanctumLocation(loc.id);
      });
    }
    document.getElementById('btn-location-panorama')?.addEventListener('click', () => {
      setCameraPreset('wide');
    });

    // =========================================================================
    // Lobby & Director Script Modal Interactions
    // =========================================================================
    const lobbyModal = document.getElementById('online-match-modal') || document.getElementById('lobby-modal');
    let selectedSpColor = 'w';
    let selectedMpColor = 'w';

    function openLobbyModal(tab = null) {
      lobbyModal?.classList.add('open');
      if (tab === 'multi') switchLobbyTab('multi');
      else if (tab === 'script') switchLobbyTab('script');
      else if (tab === 'single') switchLobbyTab('single');
    }

    function closeLobbyModal() {
      lobbyModal?.classList.remove('open');
    }

    function switchLobbyTab(tab) {
      const isSingle = tab === 'single';
      const isMulti = tab === 'multi';
      const isScript = tab === 'script';
      document.getElementById('tab-single')?.classList.toggle('active', isSingle);
      document.getElementById('tab-multi')?.classList.toggle('active', isMulti);
      document.getElementById('tab-script')?.classList.toggle('active', isScript);
      const pSingle = document.getElementById('panel-single');
      const pMulti = document.getElementById('panel-multi');
      const pScript = document.getElementById('panel-script');
      if (pSingle) pSingle.style.display = isSingle ? 'block' : 'none';
      if (pMulti) pMulti.style.display = isMulti ? 'block' : 'none';
      if (pScript) pScript.style.display = isScript ? 'block' : 'none';
    }

    document.getElementById('btn-lobby')?.addEventListener('click', () => openLobbyModal());
    document.getElementById('btn-close-lobby')?.addEventListener('click', closeLobbyModal);
    document.getElementById('btn-close-online-modal')?.addEventListener('click', closeLobbyModal);
    document.getElementById('tab-single')?.addEventListener('click', () => switchLobbyTab('single'));
    document.getElementById('tab-multi')?.addEventListener('click', () => switchLobbyTab('multi'));
    document.getElementById('tab-script')?.addEventListener('click', () => switchLobbyTab('script'));

    document.getElementById('btn-preset-scandi')?.addEventListener('click', () => {
      document.getElementById('input-notation').value = DEFAULT_DIRECTOR_NOTATION;
    });
    document.getElementById('btn-preset-italian')?.addEventListener('click', () => {
      document.getElementById('input-notation').value =
        '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+';
    });
    document.getElementById('btn-preset-scholar')?.addEventListener('click', () => {
      document.getElementById('input-notation').value =
        '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#';
    });

    document.getElementById('btn-load-notation')?.addEventListener('click', () => {
      const val = document.getElementById('input-notation').value;
      const res = loadNotationScript(val, { orientCamera: false });
      if (res.ok) {
        closeLobbyModal();
      } else {
        document.getElementById('script-status-msg').textContent =
          'Could not parse notation. Please enter valid PGN/SAN (e.g. 1. e4 e5 2. Nf3 Nc6) or UCI.';
      }
    });

    document.getElementById('pick-sp-white')?.addEventListener('click', () => {
      selectedSpColor = 'w';
      document.getElementById('pick-sp-white').classList.add('selected');
      document.getElementById('pick-sp-black').classList.remove('selected');
    });
    document.getElementById('pick-sp-black')?.addEventListener('click', () => {
      selectedSpColor = 'b';
      document.getElementById('pick-sp-black').classList.add('selected');
      document.getElementById('pick-sp-white').classList.remove('selected');
    });

    document.getElementById('btn-start-single')?.addEventListener('click', () => {
      stopMultiplayerSync();
      scriptedGameActive = false;
      gameMode = 'single';
      roomCode = null;
      playerColor = selectedSpColor;
      window.history.replaceState({}, '', window.location.pathname);
      closeLobbyModal();
      resetChessBoard(true);
    });

    document.getElementById('pick-mp-white')?.addEventListener('click', () => {
      selectedMpColor = 'w';
      document.getElementById('pick-mp-white').classList.add('selected');
      document.getElementById('pick-mp-black').classList.remove('selected');
    });
    document.getElementById('pick-mp-black')?.addEventListener('click', () => {
      selectedMpColor = 'b';
      document.getElementById('pick-mp-black').classList.add('selected');
      document.getElementById('pick-mp-white').classList.remove('selected');
    });

    document.getElementById('btn-create-room')?.addEventListener('click', () => {
      createMultiplayerRoom(selectedMpColor);
    });

    document.getElementById('btn-quick-match')?.addEventListener('click', () => {
      startQuickOnlineMatch();
    });

    document.getElementById('btn-online-quick')?.addEventListener('click', () => {
      openLobbyModal('multi');
    });

    document.getElementById('online-status-pill')?.addEventListener('click', () => {
      openLobbyModal('multi');
    });

    document.getElementById('btn-enter-created-room')?.addEventListener('click', () => {
      closeLobbyModal();
    });

    async function handleCopyRoomCodeAction() {
      if (!roomCode) return;
      await copyTextToClipboard(roomCode);
      const readonlyInput = document.getElementById('created-room-code-input');
      if (readonlyInput) {
        readonlyInput.focus();
        readonlyInput.select();
      }
      const mpStatusEl = document.getElementById('mp-status-msg');
      if (mpStatusEl) {
        mpStatusEl.textContent = `✅ Код комнаты ${roomCode} скопирован в буфер обмена! Теперь его можно вставить (Ctrl+V) куда угодно.`;
      }
      showNotificationToast(`📋 Код комнаты ${roomCode} скопирован!`);
    }

    document.getElementById('btn-copy-code')?.addEventListener('click', handleCopyRoomCodeAction);
    document.getElementById('created-room-code')?.addEventListener('click', handleCopyRoomCodeAction);
    document.getElementById('hud-room-copy-btn')?.addEventListener('click', handleCopyRoomCodeAction);

    document.getElementById('created-room-code-input')?.addEventListener('click', (e) => {
      e.target.select();
      handleCopyRoomCodeAction();
    });

    document.getElementById('btn-copy-link')?.addEventListener('click', async () => {
      if (!roomCode) return;
      const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
      await copyTextToClipboard(inviteUrl);
      const mpStatusEl = document.getElementById('mp-status-msg');
      if (mpStatusEl) {
        mpStatusEl.textContent = `🔗 Ссылка-приглашение (${inviteUrl}) скопирована в буфер обмена!`;
      }
      showNotificationToast('🔗 Ссылка на онлайн-партию скопирована!');
    });

    document.getElementById('room-pill')?.addEventListener('click', () => {
      openLobbyModal('multi');
    });

    document.getElementById('btn-paste-code')?.addEventListener('click', async () => {
      const inputEl = document.getElementById('input-room-code');
      const mpStatusEl = document.getElementById('mp-status-msg');
      let pastedText = '';
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        try {
          pastedText = await navigator.clipboard.readText();
        } catch {
          // fallback to stored code
        }
      }
      if (!pastedText) {
        try {
          pastedText =
            localStorage.getItem('wizard_chess_last_room_code') ||
            localStorage.getItem('wizard_chess_last_copied') ||
            '';
        } catch {
          pastedText = '';
        }
      }
      const extracted = extractRoomCodeFromText(pastedText);
      if (extracted && inputEl) {
        inputEl.value = extracted;
        inputEl.focus();
        inputEl.select();
        if (mpStatusEl) {
          mpStatusEl.textContent = `📋 Код комнаты ${extracted} вставлен! Нажмите «Войти» для подключения.`;
        }
        showNotificationToast(`📋 Вставлен код комнаты: ${extracted}`);
      } else {
        inputEl?.focus();
        if (mpStatusEl) {
          mpStatusEl.textContent = 'Кликните в поле ввода и нажмите Ctrl+V (или правый клик → Вставить).';
        }
      }
    });

    const inputRoomCodeEl = document.getElementById('input-room-code');
    inputRoomCodeEl?.addEventListener('paste', (e) => {
      const clipText = e.clipboardData?.getData('text') || '';
      if (clipText) {
        e.preventDefault();
        const extracted = extractRoomCodeFromText(clipText);
        inputRoomCodeEl.value = extracted || clipText.trim().toUpperCase().slice(0, 4);
        const mpStatusEl = document.getElementById('mp-status-msg');
        if (mpStatusEl && inputRoomCodeEl.value) {
          mpStatusEl.textContent = `📋 Вставлен код комнаты: ${inputRoomCodeEl.value}. Нажмите «Войти» или Enter.`;
        }
      }
    });

    inputRoomCodeEl?.addEventListener('input', (e) => {
      const rawVal = e.target.value || '';
      if (rawVal.length > 4) {
        e.target.value = extractRoomCodeFromText(rawVal);
      } else {
        e.target.value = rawVal.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      }
    });

    document.getElementById('btn-join-room')?.addEventListener('click', () => {
      const val = document.getElementById('input-room-code')?.value || '';
      joinMultiplayerRoom(val);
    });

    inputRoomCodeEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        joinMultiplayerRoom(e.target.value);
      }
    });

    document.getElementById('btn-checkmate-stepback')?.addEventListener('click', () => {
      stepScriptBackward();
    });
    document.getElementById('btn-checkmate-replay')?.addEventListener('click', () => {
      const defCol = checkmateState.defeatedColor || currentTurn;
      const winCol = checkmateState.winnerColor || (defCol === 'w' ? 'b' : 'w');
      triggerCheckmateSequence(defCol, winCol);
    });
    document.getElementById('btn-checkmate-newgame')?.addEventListener('click', () => {
      resetChessBoard(true, false);
    });
    document.getElementById('btn-checkmate-dismiss')?.addEventListener('click', () => {
      const overlay = document.getElementById('checkmate-overlay');
      if (overlay) overlay.classList.remove('visible');
      checkmateState.bannerVisible = false;
    });

    // =========================================================================
    // Programmatic API for Automated Verification & Camera Inspection
    // =========================================================================
    window.wizardChess = {
      setCameraPreset,
      setCameraPose,
      setCameraLook: setCameraPose,
      setCameraKeySpeedPercent,
      setCameraRotSpeedPercent,
      setWallStoneLook,
      nextWallStoneLook,
      prevWallStoneLook,
      setFloorStoneLook,
      nextFloorStoneLook,
      prevFloorStoneLook,
      WALL_STONE_LOOKS,
      FLOOR_STONE_LOOKS,
      holdCameraKey: (code, down = true) => {
        if (down) heldCameraKeys.add(code);
        else heldCameraKeys.delete(code);
      },
      executeChessMove,
      triggerAIMoveNow,
      resetChessBoard,
      setArmyFormation,
      cycleArmyFormation,
      setSanctumLocation,
      cycleSanctumLocation,
      SANCTUM_LOCATIONS,
      createMultiplayerRoom,
      joinMultiplayerRoom,
      startQuickOnlineMatch,
      transmutePieceAt,
      handleSelectOrTransmuteNewPiece,
      ARMY_FORMATIONS,
      NEW_PIECE_INFO,
      openLobbyModal,
      closeLobbyModal,
      toggleUI,
      loadNotation: (pgn, opts) => loadNotationScript(pgn, opts),
      stepScriptForward,
      stepScriptBackward,
      triggerCheckmateSequence,
      testColumnCollisionSlide: (startArr, endArr, steps = 20) => {
        activeCamTransition = null;
        camera.position.set(startArr[0], startArr[1], startArr[2]);
        const path = [];
        for (let i = 1; i <= steps; i++) {
          const u = i / steps;
          const prev = camera.position.clone();
          camera.position.set(
            startArr[0] + (endArr[0] - startArr[0]) * u,
            startArr[1] + (endArr[1] - startArr[1]) * u,
            startArr[2] + (endArr[2] - startArr[2]) * u
          );
          enforceCathedralBoundsAndSolidColumns(prev, camera.position, orbitControls.target);
          path.push(camera.position.toArray().map((v) => Number(v.toFixed(3))));
        }
        renderer.render(scene, camera);
        return path;
      },
      setSinglePlayerSide: (color) => {
        stopMultiplayerSync();
        scriptedGameActive = false;
        gameMode = 'single';
        playerColor = color === 'b' ? 'b' : 'w';
        resetChessBoard(true);
      },
      setupCustomScenario: (pieces, turn = 'w') => {
        stopMultiplayerSync();
        if (aiTimer) {
          clearTimeout(aiTimer);
          aiTimer = null;
        }
        activeMoveTweens.length = 0;
        isAnimatingMove = false;
        gameOver = false;
        scriptedGameActive = false;
        scriptDeviated = false;
        preMoveHighlightTask = null;
        clearCheckmateSequence();
        clearSquareHighlights();
        clearAllPieces();
        for (const p of pieces) {
          const inst = instantiatePiece(p.type, p.color, p.r, p.c);
          inst.hasMoved = Boolean(p.hasMoved);
          boardState[p.r][p.c] = inst;
        }
        currentTurn = turn;
        updateTurnUI();
        renderer.render(scene, camera);
      },
      triggerDemoCapture: () => {
        // Set up an immediate pawn capture (e4 x d5) and execute it
        resetChessBoard(true);
        // Move White e2->e4 and Black d7->d5 immediately on boardState, then animate White e4xd5
        const wp = boardState[6][4];
        boardState[6][4] = null;
        boardState[4][4] = wp;
        wp.r = 4; wp.c = 4;
        wp.mesh.position.copy(boardToWorld(4, 4));

        const bp = boardState[1][3];
        boardState[1][3] = null;
        boardState[3][3] = bp;
        bp.r = 3; bp.c = 3;
        bp.mesh.position.copy(boardToWorld(3, 3));

        currentTurn = 'w';
        return executeChessMove(4, 4, 3, 3);
      },
      getState: () => ({
        gameMode,
        scriptedGameActive,
        scriptDeviated,
        scriptMovesCount: scriptMoves.length,
        scriptCursor,
        moveHistoryCount: moveHistory.length,
        preMoveHighlightActive: Boolean(preMoveHighlightTask),
        selectedSquare,
        validMovesCount: validMoves.length,
        highlightMeshCount: squareHighlightsGroup.children.length,
        uiHidden: document.body.classList.contains('cinematic-ui-hidden'),
        playerColor,
        currentTurn,
        roomCode,
        isAnimatingMove,
        gameOver,
        checkmateState: { ...checkmateState },
        capturedByWhite,
        capturedByBlack,
        cameraPos: camera.position.toArray(),
        cameraTarget: orbitControls.target.toArray(),
        playerCamSide,
        overheadCamSide,
        sideCamSide,
        cathedralWideSide,
        cameraKeySpeedPct,
        cameraRotSpeedPct,
        wallStoneLookIndex: currentWallStoneLookIdx,
        wallStoneLookName: WALL_STONE_LOOKS[currentWallStoneLookIdx]?.name || '',
        floorStoneLookIndex: currentFloorStoneLookIdx,
        floorStoneLookName: FLOOR_STONE_LOOKS[currentFloorStoneLookIdx]?.name || '',
        floorMaterialRoughness: cathedralFloorMats[0]?.roughness ?? null,
        floorMaterialMetalness: cathedralFloorMats[0]?.metalness ?? null,
        keyMoveVelocity: keyMoveVelocity.toArray().map((v) => Number(v.toFixed(4))),
        keyRotVelocity: {
          yaw: Number(keyRotVelocity.yaw.toFixed(4)),
          pitch: Number(keyRotVelocity.pitch.toFixed(4))
        },
        cathedralBounds: CATHEDRAL_BOUNDS,
        solidColumnsCount: CATHEDRAL_SOLID_PILLARS.filter((p) => p.isColumn).length,
        brazierPillars: CATHEDRAL_SOLID_PILLARS.filter((p) => !p.isColumn),
        telemetry: cameraTelemetry
      }),
      captureScreenshot: async (filename) => {
        renderer.render(scene, camera);
        const outCanvas = document.createElement('canvas');
        outCanvas.width = renderer.domElement.width;
        outCanvas.height = renderer.domElement.height;
        const ctx = outCanvas.getContext('2d');
        ctx.drawImage(renderer.domElement, 0, 0);

        const scale = outCanvas.width / window.innerWidth;

        // Draw Gothic Cathedral Checkmate Banner if active
        if (checkmateState.bannerVisible) {
          ctx.save();
          ctx.scale(scale, scale);
          const bw = 560;
          const bh = 168;
          const bx = (window.innerWidth - bw) / 2;
          const by = 84;

          ctx.fillStyle = 'rgba(10, 12, 20, 0.94)';
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.88)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 6);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = 'rgba(212, 175, 55, 0.38)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(bx + 6, by + 6, bw - 12, bh - 12, 4);
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(212, 175, 55, 0.88)';
          ctx.font = '600 12px Georgia, serif';
          ctx.fillText('✦   SANCTUM JUDGMENT   ✦', window.innerWidth / 2, by + 28);

          ctx.fillStyle = '#f5d76e';
          ctx.font = '26px serif';
          const crownChar = checkmateState.winnerColor === 'b' ? '♚' : '♔';
          ctx.fillText(crownChar, window.innerWidth / 2, by + 56);

          ctx.fillStyle = '#f7e299';
          ctx.font = 'bold 40px Georgia, serif';
          ctx.fillText('C H E C K M A T E', window.innerWidth / 2, by + 102);

          ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
          ctx.beginPath();
          ctx.moveTo(bx + 90, by + 116);
          ctx.lineTo(bx + bw - 90, by + 116);
          ctx.stroke();

          const subTxt =
            document.getElementById('checkmate-subtitle')?.textContent ||
            'WHITE TRIUMPHS • THE BLACK KING HAS FALLEN';
          ctx.fillStyle = '#f0ece1';
          ctx.font = 'bold 14px Georgia, serif';
          ctx.fillText(subTxt.toUpperCase(), window.innerWidth / 2, by + 142);
          ctx.restore();
        }

        // Only draw HUD summary bar if UI is NOT hidden by cinematic mode
        if (!document.body.classList.contains('cinematic-ui-hidden')) {
          ctx.save();
          ctx.scale(scale, scale);
          ctx.fillStyle = 'rgba(12, 15, 22, 0.82)';
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(16, 16, 520, 42, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#d4af37';
          ctx.font = 'bold 13px Inter, sans-serif';
          ctx.fillText('WIZARD CHESS', 30, 42);

          const turnStr = document.getElementById('turn-text')?.textContent || '';
          const modeStr = document.getElementById('mode-badge')?.textContent || '';
          ctx.fillStyle = '#f0ece1';
          ctx.font = '600 13px Inter, sans-serif';
          ctx.fillText(`${turnStr}   |   ${modeStr}`, 155, 42);

          if (lobbyModal?.classList.contains('open')) {
            ctx.fillStyle = 'rgba(6, 8, 14, 0.72)';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
            const cw = 440;
            const ch = 290;
            const cx = (window.innerWidth - cw) / 2;
            const cy = (window.innerHeight - ch) / 2;
            ctx.fillStyle = 'rgba(14, 17, 26, 0.96)';
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cw, ch, 16);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.fillText('MULTIPLAYER LOBBY • ROOM CODE', cx + 28, cy + 42);

            ctx.fillStyle = '#9aa0a6';
            ctx.font = '13px Inter, sans-serif';
            ctx.fillText('Share this 4-character Room Code with Player 2:', cx + 28, cy + 82);

            ctx.fillStyle = '#f5d76e';
            ctx.font = 'bold 38px monospace';
            ctx.fillText(roomCode || '----', cx + 150, cy + 138);

            ctx.fillStyle = '#4ea8de';
            ctx.font = '600 14px Inter, sans-serif';
            ctx.fillText('Create Room  •  Join Room by Code  •  Live Move Sync', cx + 42, cy + 195);

            ctx.fillStyle = '#f0ece1';
            ctx.font = '13px Inter, sans-serif';
            ctx.fillText(`Host Assigned: ${playerColor === 'w' ? 'White' : 'Black'}  |  Status: Waiting for Opponent`, cx + 48, cy + 240);
          }
          ctx.restore();
        }

        const dataUrl = outCanvas.toDataURL('image/png');
        const res = await fetch('/api/upload-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, filename })
        });
        return res.json();
      }
    };

    window.wizardChess.stepBy = (seconds, steps = 24) => {
      const subDt = seconds / steps;
      for (let i = 0; i < steps; i++) {
        stepScene(subDt, false);
      }
      renderer.render(scene, camera);
    };

    // =========================================================================
    // Main Animation Loop
    // =========================================================================
    let elapsedTotal = 0;
    function stepScene(dt, doRender = true) {
      elapsedTotal += dt;
      const prevCamPos = camera.position.clone();

      for (const mixer of activeMixers) {
        mixer.update(dt);
      }

      // Sync sculpted 3D regalia with animated statue torso bones & animate astrolabes / wings / floating orbs
      const tmpInvRoot = new THREE.Matrix4();
      const tmpCurBone = new THREE.Matrix4();
      for (let i = dynamicPieceRegalia.length - 1; i >= 0; i--) {
        const item = dynamicPieceRegalia[i];
        if (!item.root || !item.root.parent) {
          dynamicPieceRegalia.splice(i, 1);
          continue;
        }
        if (item.bone && item.invRestBoneMat) {
          item.root.updateMatrixWorld(true);
          tmpInvRoot.copy(item.root.matrixWorld).invert();
          tmpCurBone.multiplyMatrices(tmpInvRoot, item.bone.matrixWorld);
          item.upperWrap.matrix.multiplyMatrices(tmpCurBone, item.invRestBoneMat);
          item.upperWrap.matrixWorldNeedsUpdate = true;
        }
        const refs = item.animRefs;
        const tPhase = elapsedTotal + item.phaseSeed;
        if (refs.astrolabes.length > 0) {
          refs.astrolabes[0].rotation.y += dt * 1.65;
          refs.astrolabes[0].rotation.z += dt * 0.85;
          if (refs.astrolabes[1]) {
            refs.astrolabes[1].rotation.x -= dt * 1.95;
            refs.astrolabes[1].rotation.y -= dt * 1.10;
          }
        }
        if (refs.floatingOrb) {
          refs.floatingOrb.group.position.y = refs.floatingOrb.baseY + Math.sin(tPhase * 3.2) * 0.038;
          refs.floatingOrb.group.rotation.y += dt * 2.2;
        }
        if (refs.halo) {
          refs.halo.rotation.y = Math.sin(tPhase * 2.1) * 0.16;
        }
        if (refs.wings.length > 0) {
          const flap = Math.sin(tPhase * 2.6) * 0.085;
          for (const w of refs.wings) {
            w.pivot.rotation.y = w.side * flap;
          }
        }
      }

      // Feature 3c: Advance pre-move piece selection & valid-squares highlight beat before executing scripted move
      if (preMoveHighlightTask && !isAnimatingMove) {
        preMoveHighlightTask.elapsedSim += dt;
        const wallElapsed = (performance.now() - preMoveHighlightTask.startWallMs) / 1000;
        if (
          preMoveHighlightTask.elapsedSim >= preMoveHighlightTask.duration ||
          wallElapsed >= preMoveHighlightTask.duration
        ) {
          const mv = preMoveHighlightTask.move;
          const fromScriptFlag = Boolean(preMoveHighlightTask.fromScript);
          preMoveHighlightTask = null;
          executeChessMove(mv.fromR, mv.fromC, mv.toR, mv.toC, { fromScript: fromScriptFlag });
        }
      }

      for (let i = activeMoveTweens.length - 1; i >= 0; i--) {
        const done = activeMoveTweens[i](dt);
        if (done) activeMoveTweens.splice(i, 1);
      }

      // Feature 4: Video-game style WASD + R/F camera translation AND Arrow-key camera rotation
      // with separate UI-configurable Move Speed & Rot Speed (both default 10%) and smooth ease-in / ease-out velocity damping
      if (!isAnimatingMove) {
        const moveSpeedScale = cameraKeySpeedPct / 100;
        const rotSpeedScale = cameraRotSpeedPct / 100;
        const maxMoveSpeed = 3.2 * moveSpeedScale; // 0.32 m/s at default 10%
        const maxVertSpeed = 2.6 * moveSpeedScale; // 0.26 m/s at default 10%
        const maxRotSpeed = 1.2 * rotSpeedScale;   // 0.12 rad/s at default 10%

        const forward = new THREE.Vector3().subVectors(orbitControls.target, camera.position);
        forward.y = 0;
        if (forward.lengthSq() < 1e-6) {
          camera.getWorldDirection(forward);
          forward.y = 0;
        }
        forward.normalize();
        const right = new THREE.Vector3(-forward.z, 0, forward.x).normalize();

        const horizDir = new THREE.Vector3(0, 0, 0);
        if (heldCameraKeys.has('KeyW')) horizDir.add(forward);
        if (heldCameraKeys.has('KeyS')) horizDir.sub(forward);
        if (heldCameraKeys.has('KeyD')) horizDir.add(right);
        if (heldCameraKeys.has('KeyA')) horizDir.sub(right);
        if (horizDir.lengthSq() > 1e-6) horizDir.normalize();

        const desiredMoveVel = horizDir.multiplyScalar(maxMoveSpeed);
        if (heldCameraKeys.has('KeyR')) desiredMoveVel.y += maxVertSpeed;
        if (heldCameraKeys.has('KeyF')) desiredMoveVel.y -= maxVertSpeed;

        let desiredYawVel = 0;
        let desiredPitchVel = 0;
        if (heldCameraKeys.has('ArrowLeft')) desiredYawVel += maxRotSpeed;
        if (heldCameraKeys.has('ArrowRight')) desiredYawVel -= maxRotSpeed;
        if (heldCameraKeys.has('ArrowUp')) desiredPitchVel += maxRotSpeed;
        if (heldCameraKeys.has('ArrowDown')) desiredPitchVel -= maxRotSpeed;

        // Smooth ease-in when keys are pressed and smooth ease-out when keys are released
        const easeAlpha = 1 - Math.exp(-Math.max(0.001, dt) * 7.5);
        keyMoveVelocity.lerp(desiredMoveVel, easeAlpha);
        keyRotVelocity.yaw += (desiredYawVel - keyRotVelocity.yaw) * easeAlpha;
        keyRotVelocity.pitch += (desiredPitchVel - keyRotVelocity.pitch) * easeAlpha;

        if (keyMoveVelocity.lengthSq() < 1e-8 && desiredMoveVel.lengthSq() === 0) {
          keyMoveVelocity.set(0, 0, 0);
        }
        if (Math.abs(keyRotVelocity.yaw) < 1e-5 && desiredYawVel === 0) keyRotVelocity.yaw = 0;
        if (Math.abs(keyRotVelocity.pitch) < 1e-5 && desiredPitchVel === 0) keyRotVelocity.pitch = 0;

        const hasActiveMove = keyMoveVelocity.lengthSq() > 0;
        const hasActiveRot = keyRotVelocity.yaw !== 0 || keyRotVelocity.pitch !== 0;

        if (hasActiveMove || hasActiveRot) {
          activeCamTransition = null;

          if (hasActiveMove) {
            const moveDelta = keyMoveVelocity.clone().multiplyScalar(dt);
            const beforeMovePos = camera.position.clone();
            camera.position.add(moveDelta);
            enforceCathedralBoundsAndSolidColumns(beforeMovePos, camera.position, orbitControls.target);
            const actualMoveDelta = camera.position.clone().sub(beforeMovePos);
            orbitControls.target.add(actualMoveDelta);
          }

          if (hasActiveRot) {
            const lookOffset = new THREE.Vector3().subVectors(orbitControls.target, camera.position);
            const dist = Math.max(0.5, lookOffset.length());
            const dir = lookOffset.normalize();
            let yaw = Math.atan2(dir.x, dir.z);
            let pitch = Math.asin(Math.max(-0.98, Math.min(0.98, dir.y)));

            yaw += keyRotVelocity.yaw * dt;
            pitch = Math.max(-1.35, Math.min(1.35, pitch + keyRotVelocity.pitch * dt));

            const cosP = Math.cos(pitch);
            const newOffset = new THREE.Vector3(
              Math.sin(yaw) * cosP * dist,
              Math.sin(pitch) * dist,
              Math.cos(yaw) * cosP * dist
            );
            orbitControls.target.copy(camera.position).add(newOffset);
          }

          if (heldCameraKeys.size > 0) {
            document
              .querySelectorAll('#btn-cam-player, #btn-cam-wide, #btn-cam-top, #btn-cam-side')
              .forEach((b) => b.classList.remove('active'));
          }
        }
      }

      if (activeCamTransition && !isAnimatingMove) {
        activeCamTransition.elapsed += dt;
        const u = Math.min(1, activeCamTransition.elapsed / activeCamTransition.duration);
        const ease = easeInOutCubic(u);
        camera.position.lerpVectors(activeCamTransition.startPos, activeCamTransition.endPos, ease);
        orbitControls.target.lerpVectors(activeCamTransition.startTarget, activeCamTransition.endTarget, ease);
        enforceCathedralBoundsAndSolidColumns(prevCamPos, camera.position, orbitControls.target);
        camera.lookAt(orbitControls.target);
        if (u >= 1) {
          activeCamTransition = null;
          flushOrbitControlsDamping();
        }
      } else if (orbitControls.enabled && !isAnimatingMove) {
        orbitControls.update();
        enforceCathedralBoundsAndSolidColumns(prevCamPos, camera.position, orbitControls.target);
        camera.lookAt(orbitControls.target);
      } else if (isAnimatingMove) {
        enforceCathedralBoundsAndSolidColumns(prevCamPos, camera.position, orbitControls.target);
        camera.lookAt(orbitControls.target);
      }

      if (impactFlashLight.intensity > 0) {
        impactFlashLight.intensity = Math.max(0, impactFlashLight.intensity - dt * 28);
      }

      for (let i = shatterDebris.length - 1; i >= 0; i--) {
        const d = shatterDebris[i];
        d.life -= dt;
        if (d.life <= 0) {
          scene.remove(d.mesh);
          shatterDebris.splice(i, 1);
          continue;
        }
        d.vel.y -= 9.8 * dt;
        d.mesh.position.addScaledVector(d.vel, dt);
        if (d.mesh.position.y < BOARD_SURFACE_Y + 0.03) {
          d.mesh.position.y = BOARD_SURFACE_Y + 0.03;
          d.vel.y *= -0.35;
          d.vel.x *= 0.72;
          d.vel.z *= 0.72;
        }
        // Bounce flying stone shards off intact pieces on the board so all statues feel solid
        if (d.mesh.position.y < BOARD_SURFACE_Y + 0.48) {
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const p = boardState[r][c];
              if (p && p.mesh) {
                const rx = d.mesh.position.x - p.mesh.position.x;
                const rz = d.mesh.position.z - p.mesh.position.z;
                const rDist = Math.hypot(rx, rz);
                if (rDist < 0.165 && rDist > 0.0001) {
                  const nx = rx / rDist;
                  const nz = rz / rDist;
                  d.mesh.position.x = p.mesh.position.x + nx * 0.165;
                  d.mesh.position.z = p.mesh.position.z + nz * 0.165;
                  const vn = d.vel.x * nx + d.vel.z * nz;
                  if (vn < 0) {
                    d.vel.x -= 1.55 * vn * nx;
                    d.vel.z -= 1.55 * vn * nz;
                  }
                }
              }
            }
          }
        }
        d.mesh.rotation.x += d.rotVel.x * dt;
        d.mesh.rotation.y += d.rotVel.y * dt;
        d.mesh.rotation.z += d.rotVel.z * dt;
        if (d.life < 0.5) {
          const s = Math.max(0.01, d.life * 2);
          d.mesh.scale.setScalar((d.baseScale || 0.036) * s);
        }
      }

      // Advance volumetric GLSL brazier flames, molten lava shaders & active warm firelight flicker
      for (let i = 0; i < brazierFireUniforms.length; i++) {
        brazierFireUniforms[i].uTime.value = elapsedTotal;
      }
      for (let i = 0; i < lavaShaderUniforms.length; i++) {
        lavaShaderUniforms[i].uTime.value = elapsedTotal;
      }
      for (let i = 0; i < locationAnimatedObjects.length; i++) {
        locationAnimatedObjects[i](elapsedTotal, dt);
      }
      if (locationParticleSystem && locationParticleSystem.points) {
        const posAttr = locationParticleSystem.points.geometry.attributes.position;
        const vy = locationParticleSystem.speedY;
        for (let i = 0; i < locationParticleSystem.count; i++) {
          let py = posAttr.getY(i) + vy * dt;
          if (vy > 0 && py > 8.2) py = 0.15;
          else if (vy < 0 && py < 0.15) py = 8.2;
          const px = posAttr.getX(i) + Math.sin(elapsedTotal * 1.8 + locationParticleSystem.phases[i]) * 0.008;
          posAttr.setXY(i, px, py);
        }
        posAttr.needsUpdate = true;
      }
      for (let i = 0; i < brazierGlowSprites.length; i++) {
        const sp = brazierGlowSprites[i];
        const baseOp = sp.userData.baseOpacity || 0.4;
        const seed = sp.userData.seed || 0;
        sp.material.opacity =
          baseOp +
          Math.sin(elapsedTotal * 5.2 + seed) * 0.045 +
          Math.cos(elapsedTotal * 8.4 + seed * 1.3) * 0.025;
      }
      for (let i = 0; i < brazierLights.length; i++) {
        const baseInt = brazierLights[i].userData.baseIntensity || 3.2;
        brazierLights[i].intensity =
          baseInt +
          Math.sin(elapsedTotal * 5.6 + i * 1.7) * 0.28 +
          Math.cos(elapsedTotal * 9.1 + i) * 0.16;
      }

      // Advance Elemental Combat VFX (Hellfire Shockwaves, Arcane Singularities, Celestial Lightning)
      for (let i = combatVfxList.length - 1; i >= 0; i--) {
        const vfx = combatVfxList[i];
        vfx.elapsed += dt;
        const u = Math.min(1, vfx.elapsed / vfx.duration);
        const ringScale = 1 + u * 4.2;
        vfx.shockRing.scale.set(ringScale, ringScale, 1);
        vfx.ringMat.opacity = Math.max(0, (1 - u) * 0.92);
        vfx.pillarMesh.rotation.y += dt * 4.5;
        vfx.pillarMesh.scale.set(1 + u * 0.65, 1 + u * 0.25, 1 + u * 0.65);
        vfx.pillarMat.opacity = Math.max(0, (1 - u * u) * 0.78);
        if (u >= 1) {
          scene.remove(vfx.group);
          combatVfxList.splice(i, 1);
        }
      }

      if (
        isAnimatingMove ||
        activeMoveTweens.length > 0 ||
        shatterDebris.length > 0 ||
        combatVfxList.length > 0 ||
        checkmateState.active
      ) {
        renderer.shadowMap.needsUpdate = true;
      }

      if (doRender) {
        const preset = GRAPHICS_PRESETS[currentGraphicsPresetIdx];
        if (composer && preset?.useBloom && !isAutomatedTest) {
          composer.render();
        } else {
          renderer.render(scene, camera);
        }
      }
    }

    let manualStepMode = false;
    window.wizardChess.setManualStepMode = (v) => {
      manualStepMode = Boolean(v);
    };
    window.wizardChess.setArmyMaterialTheme = setArmyMaterialTheme;
    window.wizardChess.cycleArmyMaterialTheme = cycleArmyMaterialTheme;
    window.wizardChess.setGraphicsPreset = setGraphicsPreset;
    window.wizardChess.cycleGraphicsPreset = cycleGraphicsPreset;

    function animate() {
      if (!navigator.webdriver && !manualStepMode) {
        requestAnimationFrame(animate);
      }
      if (manualStepMode) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      stepScene(dt || 0.016, true);
    }

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (composer) {
        composer.setSize(window.innerWidth, window.innerHeight);
      }
    });


    // Startup sequence (Single-Player & Online Multiplayer Room Auto-Join)
    (async () => {
      await loadAllAssets();
      const params = new URLSearchParams(window.location.search);
      const urlSide = params.get('side');
      if (urlSide === 'b' || urlSide === 'black') {
        playerColor = 'b';
      }
      const urlLoc = params.get('location');
      if (urlLoc) {
        setSanctumLocation(urlLoc, { silent: true });
      } else {
        setSanctumLocation(0, { silent: true });
      }
      const urlRoom = params.get('room');
      if (urlRoom && urlRoom.trim().length > 0) {
        await joinMultiplayerRoom(urlRoom.trim());
      } else {
        resetChessBoard(true, false);
      }
      updateNewPiecesDockUI();
      if (navigator.webdriver) {
        window.wizardChess.stepBy(0.9, 15);
      } else {
        animate();
      }
    })();
}
