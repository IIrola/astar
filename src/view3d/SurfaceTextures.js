import * as THREE from 'three';
import { seededRandom } from '../shared/Random.js';

const smooth = (t) => t * t * (3 - 2 * t);
const hash = (x, y, z = 0) => {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
export function noise3(x, y, z) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  const fx = smooth(x - ix),
    fy = smooth(y - iy),
    fz = smooth(z - iz);
  const mix = (a, b, t) => a + (b - a) * t;
  const layer = (dz) =>
    mix(
      mix(hash(ix, iy, iz + dz), hash(ix + 1, iy, iz + dz), fx),
      mix(hash(ix, iy + 1, iz + dz), hash(ix + 1, iy + 1, iz + dz), fx),
      fy,
    );
  return mix(layer(0), layer(1), fz);
}
export function fbm(x, y, z, octaves = 4) {
  let result = 0,
    amplitude = 0.5;
  for (let i = 0; i < octaves; i++) {
    result += noise3(x, y, z) * amplitude;
    x *= 2.07;
    y *= 2.07;
    z *= 2.07;
    amplitude *= 0.5;
  }
  return result;
}
function textureFromPixels(width, height, paint, color = true) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d'),
    pixels = context.createImageData(width, height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const rgba = paint(x, y),
        index = (y * width + x) * 4;
      pixels.data.set([...rgba.slice(0, 3), rgba[3] ?? 255], index);
    }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
export function createRockTextures() {
  const map = textureFromPixels(256, 256, (x, y) => {
    const n = fbm(x / 28, y / 28, 3),
      grain = hash(x, y) * 14;
    const vein = Math.pow(Math.abs(noise3(x / 13, y / 13, 5) - 0.5) * 2, 7) * 34;
    const value = 43 + n * 110 + grain - vein;
    return [value * 1.07, value, value * 0.9];
  });
  const bump = textureFromPixels(
    256,
    256,
    (x, y) => {
      const value = fbm(x / 17, y / 17, 8) * 220 + hash(x, y) * 32;
      return [value, value, value];
    },
    false,
  );
  for (const texture of [map, bump]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
  }
  return { map, bump };
}
export function createPlanetTextures() {
  const loader = new THREE.TextureLoader();
  const base = import.meta.env.BASE_URL + 'textures/';
  const map = loader.load(base + 'earth-atmosphere.jpg');
  const normal = loader.load(base + 'earth-normal.jpg');
  const clouds = loader.load(base + 'earth-clouds.png');
  map.colorSpace = clouds.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, normal, clouds]) texture.anisotropy = 4;
  return { map, normal, clouds };
}
export function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'),
    gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, '#ffffffff');
  gradient.addColorStop(0.08, '#ffffffdd');
  gradient.addColorStop(0.25, '#ffffff44');
  gradient.addColorStop(1, '#ffffff00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
export function createMetalTexture() {
  const random = seededRandom('raptor-titanium'),
    canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#879198';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1100; i++) {
    ctx.strokeStyle = `rgba(225,235,240,${random() * 0.1})`;
    const y = random() * 256;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#343e48';
  ctx.lineWidth = 2;
  for (const x of [28, 128, 228]) ctx.strokeRect(x, 12, 77, 108);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
