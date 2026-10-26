import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { TYPES, biomeOf } from '../shared/constants.js';
import { worldPoint } from './PilotCameraRig.js';
import { seededRandom } from '../shared/Random.js';
import { fbm } from './SurfaceTextures.js';

export function makeRockGeometry(seed = 1, detail = 4) {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i),
      y = position.getY(i),
      z = position.getZ(i);
    const n = fbm(x * 2.5 + seed, y * 2.5, z * 2.5, 4);
    const crater = Math.max(0, 0.22 - new THREE.Vector3(x - 0.2, y - 0.6, z - 0.7).length()) * 0.45;
    const radius = 0.78 + n * 0.48 - crater;
    position.setXYZ(i, x * radius, y * radius, z * radius);
  }
  // IcosahedronGeometry duplicates vertices per face; weld before calculating
  // normals so deformation has a continuous, lit surface rather than flat triangles.
  geometry.deleteAttribute('normal');
  const smoothGeometry = mergeVertices(geometry, 0.0001);
  smoothGeometry.computeVertexNormals();
  geometry.dispose();
  return smoothGeometry;
}
export function makeObstacle(id, type, sectorWall = false, surfaces) {
  const group = new THREE.Group(),
    random = seededRandom(`obstacle-${id}`),
    biome = biomeOf(id);
  group.position.copy(worldPoint(id));
  group.position.y = 0;
  if (type === TYPES.SOLID) {
    if (biome === 2 && !sectorWall) {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 32, 24),
        new THREE.MeshBasicMaterial({ color: '#000004' }),
      );
      core.position.y = 4.5;
      group.add(core);
      const lens = new THREE.Mesh(
        new THREE.TorusGeometry(2.62, 0.1, 12, 64),
        new THREE.MeshBasicMaterial({
          color: '#f6ccb4',
          transparent: true,
          opacity: 0.82,
          toneMapped: false,
        }),
      );
      lens.position.y = 4.5;
      lens.rotation.y = Math.PI / 2;
      group.add(lens);
      const disk = new THREE.Mesh(
        new THREE.RingGeometry(2.75, 5.1, 64, 2),
        new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 } },
          vertexShader:
            'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
          fragmentShader:
            'varying vec2 vUv; uniform float time; void main(){vec2 p=vUv-.5; float r=length(p)*2.; float a=atan(p.y,p.x); float bands=0.5+0.5*sin(r*100.-a*4.+time); vec3 c=mix(vec3(.38,.18,.35),vec3(1.,.62,.27),pow(1.-r,0.4)); gl_FragColor=vec4(c,(.2+bands*.24)*(1.-r));}',
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }),
      );
      disk.position.y = 4.5;
      disk.rotation.set(1.2, 0.2, 0.1);
      group.add(disk);
      group.userData.disk = disk;
    } else {
      const geometry = makeRockGeometry(id * 0.37, 4);
      const material = new THREE.MeshStandardMaterial({
        color: biome === 1 ? '#817566' : sectorWall ? '#58646a' : '#8b8277',
        map: surfaces.map,
        bumpMap: surfaces.bump,
        bumpScale: 0.3,
        roughness: 0.91,
        metalness: 0.08,
        envMapIntensity: 0.22,
      });
      const rock = new THREE.Mesh(geometry, material);
      rock.scale.set(
        3.8 + random() * 0.8,
        sectorWall ? 6.8 : biome === 1 ? 8.5 : 4.6,
        3.2 + random(),
      );
      rock.position.y = sectorWall ? 3 : biome === 1 ? 1.7 : 4.5;
      rock.rotation.set(random() * 0.3, random() * 6, random() * 0.35);
      rock.castShadow = rock.receiveShadow = true;
      group.add(rock);
    }
  } else if (type === TYPES.ANOMALY) {
    const geometry = new THREE.IcosahedronGeometry(0.55, 1);
    const material = new THREE.MeshStandardMaterial({
      color: '#9b8867',
      map: surfaces.map,
      bumpMap: surfaces.bump,
      bumpScale: 0.2,
      metalness: 0.45,
      roughness: 0.65,
    });
    const shards = new THREE.InstancedMesh(geometry, material, 9),
      dummy = new THREE.Object3D();
    for (let i = 0; i < 9; i++) {
      dummy.position.set((random() - 0.5) * 7, 1 + random() * 7, (random() - 0.5) * 7);
      dummy.rotation.set(random() * 4, random() * 4, random() * 4);
      dummy.scale.setScalar(0.5 + random());
      dummy.updateMatrix();
      shards.setMatrixAt(i, dummy.matrix);
    }
    shards.castShadow = true;
    group.add(shards);
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(3.5, 0.015, 4, 40),
      new THREE.MeshBasicMaterial({ color: '#bfa47c', transparent: true, opacity: 0.28 }),
    );
    marker.rotation.x = Math.PI / 2;
    marker.position.y = -1;
    group.add(marker);
  }
  return group;
}
export function makeBeacon(id, wormhole) {
  const group = new THREE.Group();
  group.position.copy(worldPoint(id));
  const color = wormhole ? '#c2a5e9' : '#78d4d0';
  const armor = new THREE.MeshStandardMaterial({
    color: '#49565f',
    metalness: 0.8,
    roughness: 0.35,
  });
  const outer = new THREE.Mesh(new THREE.TorusGeometry(5.55, 0.42, 12, 64), armor);
  outer.rotation.y = Math.PI / 2;
  outer.castShadow = outer.receiveShadow = true;
  group.add(outer);
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(5.12, 0.07, 8, 64),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(2),
      toneMapped: false,
    }),
  );
  inner.rotation.y = Math.PI / 2;
  group.add(inner);
  const segments = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 0.64, 0.85), armor, 16);
  const lights = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.1, 0.3, 0.55),
    new THREE.MeshBasicMaterial({ color, toneMapped: false }),
    16,
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 16; i++) {
    const theta = (i / 16) * Math.PI * 2;
    dummy.position.set(0, Math.cos(theta) * 5.55, Math.sin(theta) * 5.55);
    dummy.rotation.x = theta;
    dummy.updateMatrix();
    segments.setMatrixAt(i, dummy.matrix);
    dummy.position.x = -0.46;
    dummy.updateMatrix();
    lights.setMatrixAt(i, dummy.matrix);
  }
  group.add(segments, lights);
  return group;
}
export function disposeGroup(group) {
  const geometries = new Set(),
    materials = new Set();
  group.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material])
      if (material) materials.add(material);
    object.dispose?.();
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
