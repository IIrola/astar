import * as THREE from 'three';
import { seededRandom } from '../shared/Random.js';
import { createPlanetTextures, fbm } from './SurfaceTextures.js';

export function makeStarfield(glowTexture) {
  const random = seededRandom('orion-stars-v2'),
    count = 2800;
  const positions = new Float32Array(count * 3),
    colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2,
      v = random() * 2 - 1,
      radius = 700 + random() * 600;
    positions[i * 3] = Math.sqrt(1 - v * v) * Math.cos(theta) * radius + 130;
    positions[i * 3 + 1] = v * radius;
    positions[i * 3 + 2] = Math.sqrt(1 - v * v) * Math.sin(theta) * radius + 75;
    const c = new THREE.Color().setHSL(
      0.52 + random() * 0.18,
      random() * 0.25,
      0.48 + random() * 0.45,
    );
    c.toArray(colors, i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 2.4,
      map: glowTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}
function makeNebula() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d'),
    data = ctx.createImageData(1024, 512);
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 1024; x++) {
      const u = x / 1024,
        v = y / 512;
      const band = Math.exp(-Math.pow((v - 0.43 - Math.sin(u * Math.PI * 4) * 0.12) / 0.11, 2));
      const n = fbm(u * 14, v * 10, 8, 3);
      const dust = Math.pow(n, 1.4) * band;
      const purple = (Math.sin(u * 12) + 1) / 2;
      const i = (y * 1024 + x) * 4;
      data.data.set(
        [
          3 + dust * (65 + purple * 40),
          7 + dust * (60 - purple * 25),
          13 + dust * (110 + purple * 50),
          255,
        ],
        i,
      );
    }
  ctx.putImageData(data, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1500, 32, 16),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  );
  sky.position.set(130, 0, 78);
  return sky;
}
export function makeBiomes(scene, glowTexture, rockGeometry, rockMaterial) {
  const textures = createPlanetTextures();
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(102, 64, 40),
    new THREE.MeshStandardMaterial({
      map: textures.map,
      normalMap: textures.normal,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.78,
      metalness: 0.08,
      envMapIntensity: 0.22,
    }),
  );
  planet.position.set(210, -114, 112);
  planet.rotation.z = -0.23;
  scene.add(planet);
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(102.6, 48, 32),
    new THREE.MeshStandardMaterial({
      map: textures.clouds,
      transparent: true,
      depthWrite: false,
      roughness: 1,
      opacity: 0.65,
      envMapIntensity: 0.2,
    }),
  );
  planet.add(clouds);
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(105, 48, 32),
    new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color('#4a9abd') },
        sunDirection: { value: new THREE.Vector3(-0.5, 0.8, 0.5).normalize() },
      },
      vertexShader:
        'varying vec3 vNormal; varying vec3 vView; varying vec3 vWorldNormal; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); vNormal=normalize(normalMatrix*normal); vView=normalize(-p.xyz); vWorldNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*p; }',
      fragmentShader:
        'uniform vec3 glowColor; uniform vec3 sunDirection; varying vec3 vNormal; varying vec3 vView; varying vec3 vWorldNormal; void main(){ float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),3.8); float light=0.14+0.86*max(0.0,dot(normalize(vWorldNormal),sunDirection)); gl_FragColor=vec4(glowColor,rim*light*0.72); }',
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  atmosphere.position.copy(planet.position);
  scene.add(atmosphere);
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(19, 40, 28),
    new THREE.MeshStandardMaterial({
      color: '#858079',
      map: rockMaterial.map,
      bumpMap: rockMaterial.bumpMap,
      bumpScale: 0.7,
      roughness: 1,
      envMapIntensity: 0.2,
    }),
  );
  moon.position.set(360, 91, -120);
  scene.add(moon);
  const nebula = makeNebula();
  scene.add(nebula);
  const random = seededRandom('asteroid-field-v2'),
    debris = new THREE.InstancedMesh(rockGeometry, rockMaterial, 60);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 60; i++) {
    dummy.position.set(
      random() * 400 - 35,
      i < 42 ? 17 + random() * 65 : -24 - random() * 24,
      random() * 230 - 35,
    );
    const size = 0.65 + Math.pow(random(), 2) * 5;
    dummy.scale.set(size * (0.9 + random() * 0.5), size * (0.7 + random() * 0.6), size);
    dummy.rotation.set(random() * 6, random() * 6, random() * 6);
    dummy.updateMatrix();
    debris.setMatrixAt(i, dummy.matrix);
  }
  debris.instanceMatrix.needsUpdate = true;
  scene.add(debris);
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: '#a6bfd1',
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.65,
      fog: false,
    }),
  );
  sunGlow.position.set(650, 210, -95);
  sunGlow.scale.set(170, 170, 1);
  scene.add(sunGlow);
  return { planet, clouds, nebula, debris, textures };
}
