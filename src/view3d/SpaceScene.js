import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { TYPES, PHASES, biomeOf } from '../shared/constants.js';
import { PilotCameraRig, worldPoint, tween } from './PilotCameraRig.js';
import { makeStarfield, makeBiomes } from './Biomes.js';
import { makeObstacle, makeBeacon, makeRockGeometry, disposeGroup } from './Obstacles.js';
import { createGlowTexture, createRockTextures } from './SurfaceTextures.js';
import { makeCockpit } from './Cockpit.js';
import { makeSpacecraft } from './Spacecraft.js';

export class SpaceScene {
  constructor(container, { quality } = {}) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#03070d');
    this.scene.fog = new THREE.FogExp2('#09121c', 0.0009);
    this.baseFov = 60;
    this.camera = new THREE.PerspectiveCamera(this.baseFov, 1, 0.06, 2100);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Vista de piloto: cabina tridimensional y espacio exterior',
    );
    this.renderer.domElement.setAttribute('role', 'img');
    this.rig = new PilotCameraRig(this.camera);
    this.scene.add(this.camera);
    this.camera.add(makeCockpit());
    this.scene.add(new THREE.HemisphereLight('#7f9fae', '#141a25', 0.38));
    this.sun = new THREE.DirectionalLight('#ffe8cf', 4.1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, {
      left: -40,
      right: 40,
      top: 40,
      bottom: -40,
      near: 1,
      far: 180,
    });
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.12;
    this.sun.shadow.autoUpdate = false;
    this.sun.shadow.needsUpdate = true;
    this.scene.add(this.sun, this.sun.target);
    const pmrem = new THREE.PMREMGenerator(this.renderer),
      room = new RoomEnvironment();
    this.environmentTarget = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = 0.55;
    room.dispose();
    pmrem.dispose();
    this.glowTexture = createGlowTexture();
    this.surfaces = createRockTextures();
    this.stars = makeStarfield(this.glowTexture);
    this.scene.add(this.stars);
    const ambientGeometry = makeRockGeometry(13, 3);
    const ambientMaterial = new THREE.MeshStandardMaterial({
      color: '#96958c',
      map: this.surfaces.map,
      bumpMap: this.surfaces.bump,
      bumpScale: 0.28,
      roughness: 0.92,
      metalness: 0.08,
    });
    this.biomes = makeBiomes(this.scene, this.glowTexture, ambientGeometry, ambientMaterial);
    this.dynamic = new THREE.Group();
    this.scene.add(this.dynamic);
    this.obstacles = new Map();
    this.fugitive = makeSpacecraft(this.glowTexture);
    this.scene.add(this.fugitive);
    this.scanRing = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.025, 80),
      new THREE.MeshBasicMaterial({
        color: '#81cfbf',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.scanRing.rotation.x = -Math.PI / 2;
    this.scene.add(this.scanRing);
    this.scanStart = -Infinity;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.26, 0.5, 1.08);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.quality = ['balanced', 'cinematic'].includes(quality)
      ? quality
      : innerWidth > 900
        ? 'cinematic'
        : 'balanced';
    this.renderer.shadowMap.enabled = this.quality === 'cinematic';
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderer.setAnimationLoop((now) => this.render(now));
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.onContextLost?.();
    });
  }
  setQuality(quality) {
    this.quality = quality;
    this.renderer.shadowMap.enabled = quality === 'cinematic';
    this.resize();
  }
  reset(graph, state) {
    this.graph = graph;
    this.state = state;
    disposeGroup(this.dynamic);
    this.dynamic.clear();
    this.obstacles.clear();
    this.routeLine = null;
    this.routeKey = '';
    for (const id of graph.beacons)
      this.dynamic.add(makeBeacon(id, graph.cells[id] === TYPES.WORMHOLE));
    this.fugitive.position.copy(worldPoint(graph.goal));
    this.fugitive.visible = true;
    this.fugitive.rotation.set(0, 0, 0);
    this.rig.snap(state.node, state.heading);
    this.update(state);
  }
  update(state) {
    this.state = state;
    this.sun.shadow.needsUpdate = true;
    for (let id = 0; id < state.known.length; id++) {
      const visible = [TYPES.SOLID, TYPES.ANOMALY].includes(state.known[id]);
      if (visible && !this.obstacles.has(id)) {
        const mesh = makeObstacle(
          id,
          state.known[id],
          this.graph.sectorWalls.includes(id),
          this.surfaces,
        );
        this.obstacles.set(id, mesh);
        this.dynamic.add(mesh);
      } else if (!visible && this.obstacles.has(id)) {
        const mesh = this.obstacles.get(id);
        this.dynamic.remove(mesh);
        disposeGroup(mesh);
        this.obstacles.delete(id);
      }
    }
    const key = state.route.join(',');
    if (key !== this.routeKey) {
      if (this.routeLine) {
        this.dynamic.remove(this.routeLine);
        disposeGroup(this.routeLine);
        this.routeLine = null;
      }
      if (state.route.length > 1) {
        const points = state.route.slice(0, 7).map((id) => {
          const p = worldPoint(id);
          p.y = 0.4;
          return p;
        });
        this.routeLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineDashedMaterial({
            color: '#73b8ad',
            dashSize: 0.4,
            gapSize: 1.7,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
          }),
        );
        this.routeLine.computeLineDistances();
        this.dynamic.add(this.routeLine);
      }
      this.routeKey = key;
    }
    if (state.phase === PHASES.SCAN_AND_RECALC && this.lastPhase !== state.phase) this.pulse();
    this.lastPhase = state.phase;
    const biome = biomeOf(state.node);
    this.scene.fog.color.set(['#09121c', '#142029', '#110f21'][biome]);
    if (state.phase === PHASES.CAPTURED_END && !this.tractor) {
      this.tractor = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 0.15, 13, 32, 1, true),
        new THREE.MeshBasicMaterial({
          color: '#74e9bc',
          transparent: true,
          opacity: 0.08,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      this.scene.add(this.tractor);
    }
    if (this.tractor) {
      const captured = state.phase === PHASES.CAPTURED_END,
        direction = new THREE.Vector3(state.heading.dx, 0, state.heading.dz);
      this.tractor.visible = captured;
      this.tractor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      this.tractor.position.copy(worldPoint(this.graph.goal)).addScaledVector(direction, 7.5);
      this.fugitive.position.copy(worldPoint(this.graph.goal));
      if (captured) {
        this.fugitive.position.addScaledVector(direction, 17);
        this.fugitive.rotation.y = Math.atan2(-state.heading.dz, state.heading.dx) + 0.32;
        this.fugitive.rotation.x = 0.12;
      } else {
        this.fugitive.rotation.set(0, 0, 0);
      }
    }
    document.documentElement.dataset.biome = String(biome);
  }
  pulse() {
    this.scanRing.position.copy(worldPoint(this.state.node));
    this.scanRing.position.y = 0.4;
    this.scanStart = performance.now();
  }
  resize() {
    const { clientWidth: width, clientHeight: height } = this.container;
    if (!width || !height) return;
    this.renderer.setPixelRatio(
      this.quality === 'cinematic'
        ? Math.min(devicePixelRatio, 1.5)
        : Math.min(devicePixelRatio, 1) * 0.85,
    );
    const cockpit = this.camera.getObjectByName('Raptor cockpit');
    if (cockpit) cockpit.scale.x = Math.min(1, width / height / 1.15);
    this.camera.aspect = width / height;
    // Move the optical axis into the windshield, above the physical instrument panel.
    this.camera.setViewOffset(width, height, 0, height * 0.145, width, height);
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setPixelRatio(
        this.quality === 'cinematic' ? Math.min(devicePixelRatio, 1.35) : 0.85,
      );
      this.composer.setSize(width, height);
    }
  }
  render(now) {
    if (!this.state) return;
    const t = now * 0.001,
      reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.biomes.planet.rotation.y = t * 0.002;
    this.biomes.clouds.rotation.y = t * 0.003;
    const base = this.rig.basePosition;
    this.sun.position.copy(base).add(new THREE.Vector3(-45, 85, -30));
    this.sun.target.position.copy(base);
    if (this.rig.moving) this.sun.shadow.needsUpdate = true;
    if (!this.rig.moving && this.state.phase !== PHASES.FUGITIVE_ESCAPE) {
      this.camera.position.y = base.y + (reduced ? 0 : Math.sin(t * 0.7) * 0.025);
      this.camera.rotation.z = reduced ? 0 : Math.sin(t * 0.45) * 0.0015;
    }
    for (const object of this.obstacles.values())
      if (object.userData.disk) object.userData.disk.material.uniforms.time.value = t;
    const scanT = (now - this.scanStart) / 1000;
    this.scanRing.visible = scanT < 1;
    if (scanT < 1) {
      this.scanRing.scale.setScalar(1 + scanT * 16);
      this.scanRing.material.opacity = (1 - scanT) * 0.32;
    }
    if (this.tractor?.visible) this.tractor.material.opacity = 0.08 + Math.sin(t * 5) * 0.015;
    if (this.quality === 'cinematic') this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
  async escape() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.fugitive.visible = false;
      return;
    }
    const start = this.fugitive.position.x;
    await tween(matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 1000, (t) => {
      this.fugitive.position.x = start + t * t * 600;
      this.camera.fov = this.baseFov + Math.sin(t * Math.PI) * 17;
      this.camera.updateProjectionMatrix();
      this.stars.scale.x = 1 + Math.sin(t * Math.PI) * 0.5;
    });
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    this.stars.scale.x = 1;
  }
  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    disposeGroup(this.scene);
    this.environmentTarget.dispose();
    this.glowTexture.dispose();
    for (const texture of Object.values(this.surfaces)) texture.dispose();
    for (const texture of Object.values(this.biomes.textures)) texture.dispose();
    this.composer.dispose();
    this.bloom.dispose();
    this.renderer.dispose();
  }
}
