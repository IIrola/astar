import * as THREE from 'three';
import { seededRandom } from '../shared/Random.js';

export function makeStarfield() {
  const random = seededRandom('orion-stars'),
    count = 4200;
  const positions = new Float32Array(count * 3),
    colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2,
      v = random() * 2 - 1,
      radius = 450 + random() * 600;
    positions[i * 3] = Math.sqrt(1 - v * v) * Math.cos(theta) * radius + 130;
    positions[i * 3 + 1] = v * radius;
    positions[i * 3 + 2] = Math.sqrt(1 - v * v) * Math.sin(theta) * radius + 75;
    const c = new THREE.Color().setHSL(
      0.49 + random() * 0.22,
      0.16 + random() * 0.3,
      0.55 + random() * 0.45,
    );
    c.toArray(colors, i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 1.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
    }),
  );
}
export function makeBiomes(scene) {
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(76, 48, 32),
    new THREE.MeshStandardMaterial({ color: '#214b59', roughness: 0.92, metalness: 0.15 }),
  );
  planet.position.set(174, -99, 50);
  scene.add(planet);
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(78, 40, 24),
    new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color('#2a9bb4') } },
      vertexShader:
        'varying vec3 vNormal; varying vec3 vView; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); vNormal=normalize(normalMatrix*normal); vView=normalize(-p.xyz); gl_Position=projectionMatrix*p; }',
      fragmentShader:
        'uniform vec3 glowColor; varying vec3 vNormal; varying vec3 vView; void main(){ float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),3.0); gl_FragColor=vec4(glowColor,rim*0.5); }',
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  atmosphere.position.copy(planet.position);
  scene.add(atmosphere);
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(13, 28, 20),
    new THREE.MeshStandardMaterial({ color: '#666875', roughness: 1 }),
  );
  moon.position.set(355, 60, -170);
  scene.add(moon);
  const nebula = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(65 + i * 7, 16, 12),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? '#68368e' : '#18465c',
        transparent: true,
        opacity: 0.035,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    );
    puff.position.set(330 + i * 18, 55 + Math.sin(i * 1.4) * 55, -120 + i * 30);
    puff.scale.set(1.4, 0.65, 1);
    nebula.add(puff);
  }
  scene.add(nebula);
  const random = seededRandom('ambient-asteroids'),
    debris = new THREE.Group();
  for (let i = 0; i < 70; i++) {
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.3 + random() * 1.5, 0),
      new THREE.MeshStandardMaterial({ color: '#455461', roughness: 0.95, flatShading: true }),
    );
    rock.position.set(random() * 320 - 20, 24 + random() * 40, random() * 250 - 50);
    rock.rotation.set(random() * 6, random() * 6, random() * 6);
    debris.add(rock);
  }
  scene.add(debris);
  return { planet, nebula, debris };
}
