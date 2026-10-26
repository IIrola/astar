import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createMetalTexture } from './SurfaceTextures.js';

export function makeSpacecraft(glowTexture) {
  const group = new THREE.Group();
  group.name = 'Fugitive corvette';
  const hull = new THREE.MeshStandardMaterial({
    color: '#7b858a',
    map: createMetalTexture(),
    metalness: 0.78,
    roughness: 0.38,
    envMapIntensity: 0.85,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: '#1b242b',
    metalness: 0.8,
    roughness: 0.32,
  });
  const edge = new THREE.MeshStandardMaterial({
    color: '#b2a187',
    metalness: 0.82,
    roughness: 0.27,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#163743',
    metalness: 0.32,
    roughness: 0.11,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const engineMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#72c7ff').multiplyScalar(2.4),
    toneMapped: false,
  });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.64, 2.6, 6, 16), hull);
  body.rotation.z = -Math.PI / 2;
  body.castShadow = body.receiveShadow = true;
  group.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.61, 2.0, 16), hull);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 2.1;
  group.add(nose);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16), glass);
  canopy.scale.set(1.45, 0.65, 0.78);
  canopy.position.set(0.55, 0.49, 0);
  group.add(canopy);
  for (const sign of [-1, 1]) {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0.7, 0.4);
    wingShape.lineTo(-1.9, 3.4);
    wingShape.lineTo(-2.6, 3.2);
    wingShape.lineTo(-1.7, 0.35);
    wingShape.closePath();
    const wing = new THREE.Mesh(
      new THREE.ExtrudeGeometry(wingShape, {
        depth: 0.12,
        bevelEnabled: true,
        bevelThickness: 0.07,
        bevelSize: 0.09,
        bevelSegments: 2,
        steps: 1,
      }),
      dark,
    );
    wing.rotation.x = Math.PI / 2;
    wing.scale.y = sign;
    wing.castShadow = wing.receiveShadow = true;
    group.add(wing);
    const nacelle = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 2.1, 4, 12), hull);
    nacelle.rotation.z = -Math.PI / 2;
    nacelle.position.set(-1.2, -0.06, sign * 2.3);
    group.add(nacelle);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.39, 0.5, 16, 1, true), edge);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(-2.65, -0.06, sign * 2.3);
    group.add(nozzle);
    const core = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), engineMaterial);
    core.rotation.y = -Math.PI / 2;
    core.position.set(-2.93, -0.06, sign * 2.3);
    group.add(core);
    const flame = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: '#59aaff',
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.8,
      }),
    );
    flame.position.copy(core.position);
    flame.position.x -= 0.25;
    flame.scale.set(1.6, 1.6, 1.6);
    group.add(flame);
    const fin = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.65, 0.08, 2, 0.04), edge);
    fin.position.set(-1.3, 0.6, sign * 0.68);
    fin.rotation.x = sign * 0.35;
    group.add(fin);
  }
  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return group;
}
