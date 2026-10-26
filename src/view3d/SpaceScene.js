import * as THREE from 'three';
import { TYPES, PHASES, biomeOf } from '../shared/constants.js';
import { PilotCameraRig, worldPoint, tween } from './PilotCameraRig.js';
import { makeStarfield, makeBiomes } from './Biomes.js';
import { makeObstacle, makeBeacon, disposeGroup } from './Obstacles.js';

export class SpaceScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#030a13');
    this.scene.fog = new THREE.FogExp2('#07131f', 0.0028);
    this.camera = new THREE.PerspectiveCamera(64, 1, 0.15, 1800);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    this.renderer.setClearColor('#030a13');
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;
    container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Parabrisas: navegación espacial en tres dimensiones',
    );
    this.renderer.domElement.setAttribute('role', 'img');
    this.rig = new PilotCameraRig(this.camera);
    this.scene.add(new THREE.AmbientLight('#6c9eb6', 2.2));
    const sun = new THREE.DirectionalLight('#c9e7ea', 3.5);
    sun.position.set(200, 100, -100);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight('#6e6ca8', 2.1);
    rim.position.set(-100, 30, 150);
    this.scene.add(rim);
    this.stars = makeStarfield();
    this.scene.add(this.stars);
    this.biomes = makeBiomes(this.scene);
    this.grid = new THREE.GridHelper(336, 28, '#245464', '#143341');
    this.grid.position.set(138, -5, 78);
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.22;
    this.scene.add(this.grid);
    this.dynamic = new THREE.Group();
    this.scene.add(this.dynamic);
    this.obstacles = new Map();
    this.makeFugitive();
    this.scanRing = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.05, 80),
      new THREE.MeshBasicMaterial({
        color: '#6ce1ce',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      }),
    );
    this.scanRing.rotation.x = -Math.PI / 2;
    this.scene.add(this.scanRing);
    this.scanStart = -Infinity;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderer.setAnimationLoop((now) => this.render(now));
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.onContextLost?.();
    });
  }
  makeFugitive() {
    this.fugitive = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 4.5, 4),
      new THREE.MeshStandardMaterial({ color: '#a1adb7', metalness: 0.75, roughness: 0.3 }),
    );
    hull.rotation.z = -Math.PI / 2;
    this.fugitive.add(hull);
    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.15, 5.5),
      new THREE.MeshStandardMaterial({ color: '#425767', metalness: 0.8, roughness: 0.4 }),
    );
    wings.position.x = -0.5;
    this.fugitive.add(wings);
    const engine = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 2.8, 12),
      new THREE.MeshBasicMaterial({ color: '#efb887', transparent: true, opacity: 0.9 }),
    );
    engine.rotation.z = Math.PI / 2;
    engine.position.x = -3;
    this.fugitive.add(engine);
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(4.2, 4.25, 4),
      new THREE.MeshBasicMaterial({
        color: '#f1b16e',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      }),
    );
    marker.rotation.y = Math.PI / 2;
    this.fugitive.add(marker);
    this.scene.add(this.fugitive);
  }
  reset(graph, state) {
    this.graph = graph;
    this.state = state;
    disposeGroup(this.dynamic);
    this.dynamic.clear();
    this.obstacles.clear();
    this.routeKey = '';
    for (const id of graph.beacons)
      this.dynamic.add(makeBeacon(id, graph.cells[id] === TYPES.WORMHOLE));
    this.fugitive.position.copy(worldPoint(graph.goal));
    this.fugitive.position.y = 5;
    this.fugitive.visible = true;
    this.rig.snap(state.node, state.heading);
    this.update(state);
  }
  update(state) {
    this.state = state;
    for (let id = 0; id < state.known.length; id++) {
      const visible = [TYPES.SOLID, TYPES.ANOMALY].includes(state.known[id]);
      if (visible && !this.obstacles.has(id)) {
        const mesh = makeObstacle(id, state.known[id], this.graph.sectorWalls.includes(id));
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
      }
      const points = state.route.map((id) => {
        const p = worldPoint(id);
        p.y = -0.5;
        return p;
      });
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.routeLine = new THREE.Line(
        geometry,
        new THREE.LineDashedMaterial({
          color: '#65d7c7',
          dashSize: 1.1,
          gapSize: 1.5,
          transparent: true,
          opacity: 0.52,
        }),
      );
      this.routeLine.computeLineDistances();
      this.dynamic.add(this.routeLine);
      this.routeKey = key;
    }
    if (state.phase === PHASES.SCAN_AND_RECALC) this.pulse();
    const biome = biomeOf(state.node);
    const fogColor = ['#07131f', '#10232c', '#171225'][biome];
    this.scene.fog.color.set(fogColor);
    this.grid.material.color.set(biome === 2 ? '#56467c' : '#245464');
    this.fugitive.children[0].material.emissive.set(
      state.phase === PHASES.CAPTURED_END ? '#4edd9e' : '#000000',
    );
    if (state.phase === PHASES.CAPTURED_END && !this.tractor) {
      this.tractor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 2.8, 18, 32, 1, true),
        new THREE.MeshBasicMaterial({
          color: '#6af0b1',
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      this.tractor.rotation.z = Math.PI / 2;
      this.scene.add(this.tractor);
    }
    if (this.tractor) {
      const captured = state.phase === PHASES.CAPTURED_END;
      this.tractor.visible = captured;
      const direction = new THREE.Vector3(state.heading.dx, 0, state.heading.dz);
      this.tractor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      this.tractor.position.copy(worldPoint(this.graph.goal)).addScaledVector(direction, 7);
      this.fugitive.position.copy(worldPoint(this.graph.goal));
      if (captured) this.fugitive.position.addScaledVector(direction, 15);
    }
  }
  pulse() {
    this.scanRing.position.copy(worldPoint(this.state.node));
    this.scanRing.position.y = -0.4;
    this.scanStart = performance.now();
  }
  resize() {
    const { clientWidth: width, clientHeight: height } = this.container;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  render(now) {
    const t = now * 0.001;
    this.stars.rotation.y = Math.sin(t * 0.015) * 0.007;
    this.biomes.planet.rotation.y = t * 0.008;
    if (!this.rig.moving && this.state?.phase !== PHASES.FUGITIVE_ESCAPE)
      this.camera.position.y = this.rig.basePosition.y + Math.sin(t * 0.8) * 0.035;
    const scanT = (now - this.scanStart) / 1000;
    this.scanRing.visible = scanT < 1;
    if (scanT < 1) {
      this.scanRing.scale.setScalar(1 + scanT * 16);
      this.scanRing.material.opacity = (1 - scanT) * 0.4;
    }
    if (this.tractor?.visible) this.tractor.material.opacity = 0.2 + Math.sin(t * 5) * 0.07;
    this.renderer.render(this.scene, this.camera);
  }
  async escape() {
    const start = this.fugitive.position.x;
    await tween(matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 850, (t) => {
      this.fugitive.position.x = start + t * t * 600;
      this.camera.fov = 64 + Math.sin(t * Math.PI) * 20;
      this.camera.updateProjectionMatrix();
      this.stars.scale.x = 1 + Math.sin(t * Math.PI) * 0.6;
    });
    this.camera.fov = 64;
    this.camera.updateProjectionMatrix();
    this.stars.scale.x = 1;
  }
  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    disposeGroup(this.scene);
    this.renderer.dispose();
  }
}
