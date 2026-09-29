import * as THREE from 'three';

/**
 * Base abstract class defining the interface and shared utilities for all 3D radio models.
 */
export class BaseRadio {
  constructor() {
    this.group = new THREE.Group();

    // Model identity
    this.modelId = 'base';
    this.modelName = 'Radio';
    this.modelSubtitle = 'Receiver';

    // Bounding dimensions for table and camera positioning
    this.width = 3.0;
    this.height = 1.8;
    this.depth = 1.4;

    // Interactive parts map
    this.interactiveObjects = [];
    this.knobs = {};
    this.buttons = {};
    this.switches = {};

    // Themes
    this.currentTheme = 'default';
    this.availableThemes = [];

    // Camera presets tailored to this model
    this.cameraPresets = {
      hero: { pos: new THREE.Vector3(2.5, 1.2, 3.8), target: new THREE.Vector3(0, 0, 0) },
      front: { pos: new THREE.Vector3(0, 0, 4.0), target: new THREE.Vector3(0, 0, 0) },
      dial: { pos: new THREE.Vector3(0.5, 0.45, 2.2), target: new THREE.Vector3(0.5, 0.45, 0) },
      controls: { pos: new THREE.Vector3(0.65, -0.45, 2.0), target: new THREE.Vector3(0.65, -0.45, 0) },
      back: { pos: new THREE.Vector3(0, 0.2, -3.8), target: new THREE.Vector3(0, 0, 0) }
    };
  }

  // Helper for 2D rounded rectangle extrusions
  createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  // Core API Contract to be implemented/overridden by subclasses
  setPower(on) {}
  setFrequency(freq, band) {}
  setVolumeAngle(vol) {}
  setToneAngle(tone) {}
  setActiveBand(band) {}
  toggleAntenna() { return false; }
  setTheme(themeName) {}
  update(delta, metrics) {}

  // Memory cleanup
  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
