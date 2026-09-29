import * as THREE from 'three';
import { BaseRadio } from './BaseRadio.js';
import {
  createTykhoRubberTexture,
  createTykhoFrontTexture,
  createTykhoLcdTexture
} from '../textures.js';

/**
 * Procedural 3D Model of the Lexon Tykho (1997)
 * Designed by Marc Berthier
 * Features iconic molded splashproof silicone rubber and twist-antenna tuning
 */
export class LexonTykho extends BaseRadio {
  constructor() {
    super();

    this.modelId = 'lexon';
    this.modelName = 'LEXON';
    this.modelSubtitle = 'TYKHO • 1997 MARC BERTHIER';

    // Proportions: compact tactile block
    this.width = 2.4;
    this.height = 1.45;
    this.depth = 0.95;
    this.cornerR = 0.22;

    this.availableThemes = [
      { id: 'duck-blue', label: 'Duck Blue', color: '#267b87', title: 'Signature Duck Blue' },
      { id: 'terracotta', label: 'Terracotta', color: '#c45535', title: 'Warm Terracotta / Poppy' },
      { id: 'olive', label: 'Olive', color: '#637849', title: 'Sage / Olive Green' },
      { id: 'lemon', label: 'Lemon', color: '#cfb53b', title: '1990s Lemon Mustard' },
      { id: 'grey', label: 'Grey', color: '#3b3e43', title: 'Matte Slate Rubber' }
    ];

    this.cameraPresets = {
      hero: { pos: new THREE.Vector3(2.4, 1.3, 3.8), target: new THREE.Vector3(0, 0.35, 0) },
      front: { pos: new THREE.Vector3(0, 0.35, 3.8), target: new THREE.Vector3(0, 0.35, 0) },
      dial: { pos: new THREE.Vector3(0.65, 1.25, 2.0), target: new THREE.Vector3(0.55, 0.85, 0) },
      controls: { pos: new THREE.Vector3(0.1, 1.1, 2.0), target: new THREE.Vector3(0.1, 0.7, 0) },
      back: { pos: new THREE.Vector3(0, 0.35, -3.8), target: new THREE.Vector3(0, 0.35, 0) }
    };

    // State
    this.currentTheme = 'duck-blue';
    this.isPowered = false;
    this.currentFreq = 89.5;
    this.currentBand = 'FM';
    this.currentVolume = 0.75;

    // References
    this.materials = {};
    this.antennaGroup = null;
    this.antennaMesh = null;
    this.lcdMesh = null;
    this.speakerMesh = null;
    this.powerBtnMesh = null;

    this.build();
  }

  build() {
    const rubberNormal = createTykhoRubberTexture();
    const frontTex = createTykhoFrontTexture();

    // 1. Rubber Materials with silicone PBR properties
    const themeColors = {
      'duck-blue': 0x267b87,
      'terracotta': 0xc45535,
      'olive': 0x637849,
      'lemon': 0xcfb53b,
      'grey': 0x3b3e43
    };

    const mainColor = themeColors[this.currentTheme] || 0x267b87;

    this.materials.rubber = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: 0.84,
      metalness: 0.02,
      normalMap: rubberNormal,
      normalScale: new THREE.Vector2(0.18, 0.18)
    });

    this.materials.rubberAccent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(mainColor).multiplyScalar(0.85),
      roughness: 0.88,
      metalness: 0.02
    });

    this.materials.frontOverlay = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: 0.84,
      metalness: 0.02,
      map: frontTex,
      transparent: true,
      normalMap: rubberNormal,
      normalScale: new THREE.Vector2(0.18, 0.18)
    });

    // 2. Main Silicone Body
    this.buildBody();

    // 3. Iconic Twist-Antenna Tuner
    this.buildAntenna();

    // 4. Embossed Rubber Controls
    this.buildControls();

    // 5. Recessed LCD Display
    this.buildLCD();

    // 6. Molded Feet
    this.buildFeet();
  }

  buildBody() {
    const shape = this.createRoundedRectShape(this.width, this.height, this.cornerR);
    const extrudeSettings = {
      depth: this.depth,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.14,
      bevelThickness: 0.14
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();

    const bodyMesh = new THREE.Mesh(geom, this.materials.rubber);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.group.add(bodyMesh);

    // Front overlay plate with molded speaker dimples & branding
    const frontPlaneGeo = new THREE.PlaneGeometry(this.width - 0.12, this.height - 0.12);
    const frontPlane = new THREE.Mesh(frontPlaneGeo, this.materials.frontOverlay);
    frontPlane.position.z = this.depth / 2 + 0.141;
    this.group.add(frontPlane);
    this.speakerMesh = frontPlane;
  }

  buildAntenna() {
    // Top right position for the antenna
    this.antennaGroup = new THREE.Group();
    this.antennaGroup.position.set(this.width / 2 - 0.45, this.height / 2 + 0.12, 0);

    // 1. Base rubber grommet collar
    const collarGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.12, 24);
    const collar = new THREE.Mesh(collarGeo, this.materials.rubberAccent);
    collar.position.y = 0.06;
    this.antennaGroup.add(collar);

    // 2. Ribbed gripping section (tactile affordance for twisting to tune)
    const gripGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 24);
    const grip = new THREE.Mesh(gripGeo, this.materials.rubber);
    grip.position.y = 0.22;
    this.antennaGroup.add(grip);

    // Grip rings
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.TorusGeometry(0.085, 0.012, 12, 24);
      const ring = new THREE.Mesh(ringGeo, this.materials.rubberAccent);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.15 + i * 0.05;
      this.antennaGroup.add(ring);
    }

    // 3. Tapered flexible rubber antenna shaft
    const shaftGeo = new THREE.CylinderGeometry(0.038, 0.07, 1.45, 16);
    this.antennaMesh = new THREE.Mesh(shaftGeo, this.materials.rubber);
    this.antennaMesh.position.y = 1.0;
    this.antennaMesh.castShadow = true;
    this.antennaGroup.add(this.antennaMesh);

    // 4. Rounded rubber ball tip
    const tipGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const tip = new THREE.Mesh(tipGeo, this.materials.rubber);
    tip.position.y = 1.72;
    this.antennaGroup.add(tip);

    // Mark the entire antenna assembly as the tuning control!
    // Twisting the antenna adjusts the frequency
    this.antennaGroup.userData = {
      isKnob: true,
      name: 'tuning',
      isAntennaTuner: true
    };

    // Sub-parts inherit identification
    this.antennaMesh.userData = this.antennaGroup.userData;
    grip.userData = this.antennaGroup.userData;
    collar.userData = this.antennaGroup.userData;
    tip.userData = this.antennaGroup.userData;

    this.group.add(this.antennaGroup);
    this.interactiveObjects.push(this.antennaGroup, this.antennaMesh, grip, tip);
    this.knobs.tuning = this.antennaGroup;
  }

  buildControls() {
    const topY = this.height / 2 + 0.13;

    // Power Button (Circular embossed rubber button)
    const pwrGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.06, 24);
    this.powerBtnMesh = new THREE.Mesh(pwrGeo, this.materials.rubberAccent);
    this.powerBtnMesh.position.set(-0.65, topY, 0);
    this.powerBtnMesh.userData = {
      isSwitch: true,
      name: 'power'
    };
    this.group.add(this.powerBtnMesh);
    this.interactiveObjects.push(this.powerBtnMesh);
    this.switches.power = this.powerBtnMesh;

    // Power button dot / symbol
    const dotGeo = new THREE.SphereGeometry(0.03, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(-0.65, topY + 0.03, 0);
    this.group.add(dot);

    // Volume Down Button (-)
    const volDownGeo = new THREE.BoxGeometry(0.18, 0.05, 0.18);
    const volDown = new THREE.Mesh(volDownGeo, this.materials.rubberAccent);
    volDown.position.set(-0.25, topY, 0);
    volDown.userData = {
      isButton: true,
      type: 'volume-step',
      dir: -1
    };
    this.group.add(volDown);
    this.interactiveObjects.push(volDown);

    // Volume Up Button (+)
    const volUpGeo = new THREE.BoxGeometry(0.18, 0.05, 0.18);
    const volUp = new THREE.Mesh(volUpGeo, this.materials.rubberAccent);
    volUp.position.set(0.05, topY, 0);
    volUp.userData = {
      isButton: true,
      type: 'volume-step',
      dir: 1
    };
    this.group.add(volUp);
    this.interactiveObjects.push(volUp);

    // Band Toggle Button (FM / AM)
    const bandGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.05, 20);
    const bandBtn = new THREE.Mesh(bandGeo, this.materials.rubberAccent);
    bandBtn.position.set(0.35, topY, 0);
    bandBtn.userData = {
      isButton: true,
      type: 'band-toggle',
      value: 'FM'
    };
    this.group.add(bandBtn);
    this.interactiveObjects.push(bandBtn);
    this.buttons.bandToggle = bandBtn;
  }

  buildLCD() {
    // Recessed bezel
    const bezelGeo = new THREE.BoxGeometry(0.68, 0.38, 0.04);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x181a1c,
      roughness: 0.7,
      metalness: 0.1
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.set(0.55, 0.15, this.depth / 2 + 0.13);
    this.group.add(bezel);

    // Screen plane
    const lcdTex = createTykhoLcdTexture(this.currentFreq, this.currentBand, this.isPowered);
    const lcdMat = new THREE.MeshBasicMaterial({
      map: lcdTex,
      transparent: true
    });
    const screenGeo = new THREE.PlaneGeometry(0.62, 0.32);
    this.lcdMesh = new THREE.Mesh(screenGeo, lcdMat);
    this.lcdMesh.position.set(0.55, 0.15, this.depth / 2 + 0.152);
    this.group.add(this.lcdMesh);

    // Clear acrylic protective cover
    const glassGeo = new THREE.PlaneGeometry(0.62, 0.32);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.12,
      metalness: 0.1,
      transparent: true,
      opacity: 0.18
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0.55, 0.15, this.depth / 2 + 0.155);
    this.group.add(glass);
  }

  buildFeet() {
    const footGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.06, 16);
    const positions = [
      [-this.width / 2 + 0.35, -this.height / 2 - 0.14, -this.depth / 2 + 0.25],
      [this.width / 2 - 0.35, -this.height / 2 - 0.14, -this.depth / 2 + 0.25],
      [-this.width / 2 + 0.35, -this.height / 2 - 0.14, this.depth / 2 - 0.25],
      [this.width / 2 - 0.35, -this.height / 2 - 0.14, this.depth / 2 - 0.25]
    ];

    positions.forEach(pos => {
      const foot = new THREE.Mesh(footGeo, this.materials.rubberAccent);
      foot.position.set(...pos);
      this.group.add(foot);
    });
  }

  setPower(on) {
    this.isPowered = on;
    if (this.powerBtnMesh) {
      this.powerBtnMesh.position.y = (this.height / 2 + 0.13) - (on ? 0.025 : 0);
    }
    this.refreshLCD();
  }

  setFrequency(freq, band) {
    this.currentFreq = freq;
    this.currentBand = band;

    // Rotate the rubber antenna as the frequency is tuned
    if (this.antennaGroup) {
      // Map frequency range to antenna rotation
      let norm = 0;
      if (band === 'FM') norm = (freq - 88.0) / 20.0;
      else if (band === 'AM') norm = (freq - 530) / 1070;
      else norm = (freq - 6.0) / 12.0;

      this.antennaGroup.rotation.y = norm * Math.PI * 3.0; // multi-turn rotation
      // Subtle flexible bend
      this.antennaGroup.rotation.z = Math.sin(norm * Math.PI * 2) * 0.06;
    }

    this.refreshLCD();
  }

  setVolumeAngle(vol) {
    this.currentVolume = vol;
  }

  setActiveBand(band) {
    this.currentBand = band;
    this.refreshLCD();
  }

  refreshLCD() {
    if (this.lcdMesh) {
      if (this.lcdMesh.material.map) this.lcdMesh.material.map.dispose();
      this.lcdMesh.material.map = createTykhoLcdTexture(this.currentFreq, this.currentBand, this.isPowered);
      this.lcdMesh.material.needsUpdate = true;
    }
  }

  setTheme(themeName) {
    const themeColors = {
      'duck-blue': 0x267b87,
      'terracotta': 0xc45535,
      'olive': 0x637849,
      'lemon': 0xcfb53b,
      'grey': 0x3b3e43
    };

    const colorVal = themeColors[themeName];
    if (!colorVal) return;

    this.currentTheme = themeName;
    const c = new THREE.Color(colorVal);

    if (this.materials.rubber) this.materials.rubber.color.copy(c);
    if (this.materials.frontOverlay) this.materials.frontOverlay.color.copy(c);
    if (this.materials.rubberAccent) this.materials.rubberAccent.color.copy(new THREE.Color(c).multiplyScalar(0.85));
  }

  update(delta, metrics) {
    // Subtle acoustic pulsing of the front rubber speaker holes
    if (this.speakerMesh && metrics && metrics.isPlaying && this.isPowered) {
      const pulse = 1.0 + (metrics.bassLevel || 0) * 0.015;
      this.speakerMesh.scale.set(pulse, pulse, 1.0);
    }
  }
}
