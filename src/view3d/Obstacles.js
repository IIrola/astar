import * as THREE from 'three';
import { TYPES, biomeOf } from '../shared/constants.js';
import { worldPoint } from './PilotCameraRig.js';
import { seededRandom } from '../shared/Random.js';

export function makeObstacle(id, type, sectorWall = false) {
  const group = new THREE.Group(),
    random = seededRandom(`obstacle-${id}`),
    biome = biomeOf(id);
  group.position.copy(worldPoint(id));
  group.position.y = 0;
  if (type === TYPES.SOLID) {
    if (biome === 2 && !sectorWall) {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(3.1, 24, 20),
        new THREE.MeshBasicMaterial({ color: '#010105' }),
      );
      core.position.y = 4;
      group.add(core);
      for (const radius of [3.35, 4.1, 4.8]) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius, 0.09, 8, 64),
          new THREE.MeshBasicMaterial({
            color: '#b879ef',
            transparent: true,
            opacity: radius === 3.35 ? 0.8 : 0.3,
          }),
        );
        ring.position.y = 4;
        ring.rotation.x = Math.PI / 2.8;
        group.add(ring);
      }
    } else if (biome === 1 || sectorWall) {
      for (let i = 0; i < 4; i++) {
        const h = 7 + random() * 7;
        const rock = new THREE.Mesh(
          new THREE.CylinderGeometry(1.3 + random(), 2.3, h, 5),
          new THREE.MeshStandardMaterial({
            color: sectorWall ? '#273d49' : '#5d5a50',
            roughness: 1,
            flatShading: true,
          }),
        );
        rock.position.set((random() - 0.5) * 5, h / 2 - 1.5, (random() - 0.5) * 5);
        group.add(rock);
      }
    } else {
      for (let i = 0; i < 4; i++) {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.5 + random() * 2.3, 0),
          new THREE.MeshStandardMaterial({
            color: i % 2 ? '#6d625c' : '#3e5660',
            roughness: 0.94,
            flatShading: true,
          }),
        );
        rock.position.set((random() - 0.5) * 5, 2 + random() * 6, (random() - 0.5) * 5);
        rock.rotation.set(random() * 3, random() * 3, 0);
        group.add(rock);
      }
    }
    const outline = new THREE.Mesh(
      new THREE.RingGeometry(4.8, 4.9, 48),
      new THREE.MeshBasicMaterial({
        color: '#cd7967',
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      }),
    );
    outline.rotation.x = -Math.PI / 2;
    outline.position.y = 0.05;
    group.add(outline);
  } else if (type === TYPES.ANOMALY) {
    for (let i = 0; i < 8; i++) {
      const shard = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.25 + random() * 0.55),
        new THREE.MeshStandardMaterial({
          color: '#c7a76a',
          emissive: '#a56b28',
          emissiveIntensity: 0.35,
          metalness: 0.6,
          roughness: 0.3,
        }),
      );
      shard.position.set((random() - 0.5) * 7, 1 + random() * 7, (random() - 0.5) * 7);
      group.add(shard);
    }
  }
  return group;
}
export function makeBeacon(id, wormhole) {
  const group = new THREE.Group();
  group.position.copy(worldPoint(id));
  const color = wormhole ? '#bd8cef' : '#6de1d0';
  for (const [radius, width, opacity] of [
    [5.1, 0.17, 1],
    [5.6, 0.045, 0.45],
  ]) {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(radius, width, 8, 64),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity }),
    );
    mesh.rotation.y = Math.PI / 2;
    group.add(mesh);
  }
  for (let i = 0; i < 8; i++) {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.6, 0.6),
      new THREE.MeshBasicMaterial({ color }),
    );
    const theta = (i / 8) * Math.PI * 2;
    light.position.set(0, Math.cos(theta) * 5.1, Math.sin(theta) * 5.1);
    group.add(light);
  }
  return group;
}
export function disposeGroup(group) {
  group.traverse((object) => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
    else object.material?.dispose();
  });
}
