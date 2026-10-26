import * as THREE from 'three';
import { CELL_SIZE, coords } from '../shared/constants.js';

export const worldPoint = (id) => {
  const { x, z } = coords(id);
  return new THREE.Vector3(x * CELL_SIZE, 5, z * CELL_SIZE);
};
export function tween(duration, update) {
  return new Promise((resolve) => {
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / Math.max(1, duration));
      update(t * t * (3 - 2 * t));
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}
export class PilotCameraRig {
  constructor(camera) {
    this.camera = camera;
    this.yaw = -Math.PI / 2;
    this.basePosition = new THREE.Vector3();
    this.moving = false;
  }
  headingYaw(heading) {
    return Math.atan2(-heading.dx, -heading.dz);
  }
  snap(node, heading) {
    this.basePosition.copy(worldPoint(node));
    this.yaw = this.headingYaw(heading);
    this.camera.position.copy(this.basePosition);
    this.camera.rotation.set(0, this.yaw, 0, 'YXZ');
  }
  async fly({ from, to, heading, turning, speed, onMove }) {
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.snap(to, heading);
      onMove();
      return;
    }
    const factor = 1;
    this.moving = true;
    try {
      const targetYaw = this.headingYaw(heading);
      const yawDelta = Math.atan2(Math.sin(targetYaw - this.yaw), Math.cos(targetYaw - this.yaw));
      if (turning || Math.abs(yawDelta) > 0.01) {
        const oldYaw = this.yaw;
        await tween((340 * factor) / speed, (t) => {
          this.yaw = oldYaw + yawDelta * t;
          this.camera.rotation.y = this.yaw;
          this.camera.rotation.z = Math.sin(t * Math.PI) * Math.sign(yawDelta) * 0.055;
        });
      }
      this.camera.rotation.z = 0;
      onMove();
      const start = worldPoint(from),
        end = worldPoint(to);
      await tween((620 * factor) / speed, (t) => {
        this.basePosition.lerpVectors(start, end, t);
        this.camera.position.copy(this.basePosition);
        this.camera.position.y += Math.sin(t * Math.PI) * 0.11;
      });
      this.camera.position.copy(end);
    } finally {
      this.moving = false;
    }
  }
}
