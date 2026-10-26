import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Camera-local physical structure. The world moves outside; these parts stay with the pilot.
export function makeCockpit() {
  const group = new THREE.Group();
  group.name = 'Raptor cockpit';
  const carbon = new THREE.MeshStandardMaterial({
    color: '#111a21',
    metalness: 0.65,
    roughness: 0.38,
  });
  const titanium = new THREE.MeshStandardMaterial({
    color: '#36434c',
    metalness: 0.88,
    roughness: 0.27,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: '#05090d', roughness: 0.94 });
  const cyan = new THREE.MeshBasicMaterial({ color: '#72bbb7', toneMapped: false });
  const screwMaterial = new THREE.MeshStandardMaterial({
    color: '#76818a',
    metalness: 0.95,
    roughness: 0.3,
  });
  function box(size, position, material, bevel = 0.025) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 2, bevel), material);
    mesh.position.set(...position);
    group.add(mesh);
    return mesh;
  }
  function beam(a, b, width, depth, material) {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b);
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(width, start.distanceTo(end), depth, 2, 0.018),
      material,
    );
    mesh.position.addVectors(start, end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    group.add(mesh);
    return mesh;
  }
  for (const sign of [-1, 1]) {
    beam([sign * 1.68, -1.45, -1.5], [sign * 1.18, 1.65, -2.25], 0.16, 0.21, carbon);
    beam([sign * 1.56, -1.45, -1.55], [sign * 1.08, 1.65, -2.3], 0.027, 0.07, titanium);
    beam([sign * 1.77, -1.43, -1.5], [sign * 1.27, 1.65, -2.25], 0.045, 0.18, rubber);
    for (let i = 0; i < 5; i++) {
      const screw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.023, 0.023, 0.012, 8),
        screwMaterial,
      );
      screw.rotation.x = Math.PI / 2;
      screw.position.set(sign * (1.58 - i * 0.094), -1.02 + i * 0.56, -1.57 - i * 0.14);
      group.add(screw);
    }
    const shoulder = box([1.1, 0.5, 1.9], [sign * 1.94, -1.3, -0.95], carbon, 0.08);
    shoulder.rotation.z = sign * -0.14;
    box([0.85, 0.018, 0.035], [sign * 1.66, -1.025, -1.6], cyan, 0.006);
    for (let i = 0; i < 6; i++)
      box([0.13, 0.018, 0.35], [sign * (1.48 + i * 0.11), -1.04, -1.1], rubber, 0.007);
  }
  box([4.7, 0.42, 1.5], [0, -1.57, -1.6], carbon, 0.12);
  box([4.6, 0.065, 0.12], [0, -1.33, -2.25], titanium, 0.025);
  box([1.9, 0.014, 0.03], [0, -1.288, -2.27], cyan, 0.005);
  box([3.5, 0.2, 0.45], [0, 1.68, -2.05], carbon, 0.06);
  const cabinLight = new THREE.PointLight('#96c7d2', 3.2, 4, 2);
  cabinLight.position.set(0, 0.3, 0.15);
  group.add(cabinLight);
  return group;
}
