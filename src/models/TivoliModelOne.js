import * as THREE from 'three';
import { BaseRadio } from './BaseRadio.js';
import {
  createTivoliDialTexture,
  createTivoliFaceplateTexture,
  createTivoliWoodTexture,
  createTivoliSpeakerTexture,
  createKnurlNormalMap
} from '../textures.js';

/**
 * Procedural 3D Model of the Tivoli Audio Model One (2000)
 * Designed by audio pioneer Henry Kloss
 * Features furniture-grade wood cabinet, 5:1 planetary geared tuning dial, and dynamic amber tuning LED
 */
export class TivoliModelOne extends BaseRadio {
  constructor() {
    super();

    this.modelId = 'tivoli';
    this.modelName = 'TIVOLI AUDIO';
    this.modelSubtitle = 'MODEL ONE • 2000 HENRY KLOSS';

    // Dimensions: architectural proportions
    this.width = 2.8;
    this.height = 1.55;
    this.depth = 1.5;
    this.cornerR = 0.05;

    this.availableThemes = [
      { id: 'walnut', label: 'Walnut', color: '#5a3821', title: 'Classic Walnut / Cream' },
      { id: 'cherry', label: 'Cherry', color: '#7e351d', title: 'Cherry / Cobalt Blue' },
      { id: 'black-ash', label: 'Black Ash', color: '#222325', title: 'Black Ash / Silver' },
      { id: 'white', label: 'White', color: '#f2f4f8', title: 'Piano White / Silver' }
    ];

    this.cameraPresets = {
      hero: { pos: new THREE.Vector3(2.2, 1.1, 3.2), target: new THREE.Vector3(0, 0, 0) },
      front: { pos: new THREE.Vector3(0, 0, 3.4), target: new THREE.Vector3(0, 0, 0) },
      dial: { pos: new THREE.Vector3(0.55, 0.05, 1.8), target: new THREE.Vector3(0.55, 0.05, 0) },
      controls: { pos: new THREE.Vector3(0.55, -0.35, 1.8), target: new THREE.Vector3(0.55, -0.35, 0) },
      back: { pos: new THREE.Vector3(0, 0.1, -3.2), target: new THREE.Vector3(0, 0, 0) }
    };

    // State
    this.currentTheme = 'walnut';
    this.isPowered = false;
    this.currentFreq = 89.5;
    this.currentBand = 'FM';
    this.currentVolume = 0.75;
    this.signalStrength = 0;

    // References
    this.materials = {};
    this.tuningDialMesh = null;
    this.tuningLedMesh = null;
    this.tuningLedLight = null;
    this.speakerCone = null;
    this.speakerDustCap = null;
    this.volumeKnobMesh = null;
    this.sourceKnobMesh = null;

    this.build();
  }

  build() {
    const knurlTex = createKnurlNormalMap();
    const speakerTex = createTivoliSpeakerTexture();
    const dialTex = createTivoliDialTexture();
    const faceTex = createTivoliFaceplateTexture(this.currentTheme);
    const woodTex = createTivoliWoodTexture(this.currentTheme);

    // 1. Materials
    this.materials.woodCabinet = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.38,
      metalness: 0.02
    });

    this.materials.faceplate = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.35,
      metalness: 0.06
    });

    this.materials.speakerGrille = new THREE.MeshStandardMaterial({
      map: speakerTex,
      roughness: 0.45,
      metalness: 0.5
    });

    this.materials.knobMetal = new THREE.MeshStandardMaterial({
      color: 0xdedede,
      roughness: 0.28,
      metalness: 0.88,
      normalMap: knurlTex,
      normalScale: new THREE.Vector2(0.3, 0.3)
    });

    this.materials.tuningDial = new THREE.MeshStandardMaterial({
      map: dialTex,
      roughness: 0.25,
      metalness: 0.15
    });

    this.materials.tuningLed = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff8800,
      emissiveIntensity: 0.0,
      roughness: 0.2,
      metalness: 0.1
    });

    // 2. Build Cabinet & Faceplate
    this.buildCabinet();

    // 3. Build Speaker (with vibrating cone behind grille)
    this.buildSpeaker();

    // 4. Build 5:1 Geared Tuning Wheel & Dynamic Amber LED
    this.buildTuningWheel();

    // 5. Build Control Knobs (Volume & Source)
    this.buildControlKnobs();

    // 6. Build Rear Acoustic Bass Reflex Port
    this.buildRearPanel();

    // 7. Isolation Feet
    this.buildFeet();
  }

  buildCabinet() {
    // Solid wooden enclosure
    const shape = this.createRoundedRectShape(this.width, this.height, this.cornerR);
    const extrudeSettings = {
      depth: this.depth,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.035
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    const cabinet = new THREE.Mesh(geom, this.materials.woodCabinet);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    this.group.add(cabinet);

    // Inset Front Faceplate
    const faceShape = this.createRoundedRectShape(this.width - 0.16, this.height - 0.16, 0.02);
    const faceExtrude = {
      depth: 0.015,
      bevelEnabled: false
    };
    const faceGeom = new THREE.ExtrudeGeometry(faceShape, faceExtrude);
    faceGeom.center();
    const faceplate = new THREE.Mesh(faceGeom, this.materials.faceplate);
    faceplate.position.z = this.depth / 2 + 0.042;
    this.group.add(faceplate);
  }

  buildSpeaker() {
    const speakerX = -this.width / 4 - 0.05;
    const speakerY = 0.02;
    const speakerZ = this.depth / 2 + 0.055;
    const radius = 0.52;

    // Dark acoustic backing cloth
    const backGeo = new THREE.CircleGeometry(radius + 0.01, 32);
    const backMat = new THREE.MeshBasicMaterial({ color: 0x0a0b0d });
    const backCloth = new THREE.Mesh(backGeo, backMat);
    backCloth.position.set(speakerX, speakerY, speakerZ - 0.005);
    this.group.add(backCloth);

    // Perforated Metal Grille
    const grilleGeo = new THREE.CylinderGeometry(radius, radius, 0.015, 36);
    grilleGeo.rotateX(Math.PI / 2);
    const grille = new THREE.Mesh(grilleGeo, this.materials.speakerGrille);
    grille.position.set(speakerX, speakerY, speakerZ);
    this.group.add(grille);

    // Bezel ring around grille
    const ringGeo = new THREE.TorusGeometry(radius + 0.01, 0.018, 16, 36);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.2 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(speakerX, speakerY, speakerZ + 0.01);
    this.group.add(ring);

    // Dynamic paper cone behind grille
    const coneGeo = new THREE.ConeGeometry(radius * 0.75, 0.15, 24, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
    this.speakerCone = new THREE.Mesh(coneGeo, coneMat);
    this.speakerCone.position.set(speakerX, speakerY, speakerZ - 0.04);
    this.group.add(this.speakerCone);

    // Dust cap
    const capGeo = new THREE.SphereGeometry(radius * 0.25, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    capGeo.rotateX(Math.PI / 2);
    this.speakerDustCap = new THREE.Mesh(capGeo, coneMat);
    this.speakerDustCap.position.set(speakerX, speakerY, speakerZ - 0.01);
    this.group.add(this.speakerDustCap);
  }

  buildTuningWheel() {
    const dialX = 0.55;
    const dialY = 0.05;
    const dialZ = this.depth / 2 + 0.065;
    const radius = 0.38;

    // 1. The Large 5:1 Planetary Geared Dial Disc
    const dialGeo = new THREE.CylinderGeometry(radius, radius, 0.04, 48);
    dialGeo.rotateX(Math.PI / 2);

    const dialMaterials = [
      this.materials.knobMetal, // cylindrical edge with knurl grip
      this.materials.tuningDial, // front dial scale
      this.materials.knobMetal  // back
    ];

    this.tuningDialMesh = new THREE.Mesh(dialGeo, dialMaterials);
    this.tuningDialMesh.position.set(dialX, dialY, dialZ);
    this.tuningDialMesh.userData = {
      isKnob: true,
      name: 'tuning',
      isGeared: true // 5:1 ratio
    };
    this.group.add(this.tuningDialMesh);
    this.interactiveObjects.push(this.tuningDialMesh);
    this.knobs.tuning = this.tuningDialMesh;

    // 2. Beveled Center Hub on dial
    const hubGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.035, 32);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, this.materials.knobMetal);
    hub.position.set(0, 0, 0.025);
    this.tuningDialMesh.add(hub);

    // 3. Dynamic Amber Carrier Tuning LED
    const ledX = 0.88;
    const ledY = 0.28;
    const ledZ = this.depth / 2 + 0.055;

    const ledBezelGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.015, 20);
    ledBezelGeo.rotateX(Math.PI / 2);
    const ledBezel = new THREE.Mesh(ledBezelGeo, this.materials.knobMetal);
    ledBezel.position.set(ledX, ledY, ledZ);
    this.group.add(ledBezel);

    const ledGeo = new THREE.SphereGeometry(0.028, 16, 16);
    this.tuningLedMesh = new THREE.Mesh(ledGeo, this.materials.tuningLed);
    this.tuningLedMesh.position.set(ledX, ledY, ledZ + 0.012);
    this.group.add(this.tuningLedMesh);

    // PointLight casting warm amber glow on the faceplate
    this.tuningLedLight = new THREE.PointLight(0xff9900, 0, 0.6);
    this.tuningLedLight.position.set(ledX, ledY, ledZ + 0.05);
    this.group.add(this.tuningLedLight);
  }

  buildControlKnobs() {
    const knobRadius = 0.12;
    const knobDepth = 0.07;
    const knobY = -0.38;
    const knobZ = this.depth / 2 + 0.07;

    // Volume Knob (Lower Left of the right half)
    const volX = 0.32;
    const volGeo = new THREE.CylinderGeometry(knobRadius, knobRadius, knobDepth, 32);
    volGeo.rotateX(Math.PI / 2);
    this.volumeKnobMesh = new THREE.Mesh(volGeo, this.materials.knobMetal);
    this.volumeKnobMesh.position.set(volX, knobY, knobZ);
    this.volumeKnobMesh.userData = {
      isKnob: true,
      name: 'volume'
    };

    // Indicator mark on volume knob
    const dotGeo = new THREE.BoxGeometry(0.015, 0.06, 0.02);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const volDot = new THREE.Mesh(dotGeo, dotMat);
    volDot.position.set(0, knobRadius - 0.035, knobDepth / 2 + 0.001);
    this.volumeKnobMesh.add(volDot);

    this.group.add(this.volumeKnobMesh);
    this.interactiveObjects.push(this.volumeKnobMesh);
    this.knobs.volume = this.volumeKnobMesh;

    // Source Selector Knob (Lower Right: OFF, FM, AM, AUX)
    const srcX = 0.78;
    const srcGeo = new THREE.CylinderGeometry(knobRadius, knobRadius, knobDepth, 32);
    srcGeo.rotateX(Math.PI / 2);
    this.sourceKnobMesh = new THREE.Mesh(srcGeo, this.materials.knobMetal);
    this.sourceKnobMesh.position.set(srcX, knobY, knobZ);
    this.sourceKnobMesh.userData = {
      isKnob: true,
      name: 'source',
      isSwitch: true
    };

    const srcDot = new THREE.Mesh(dotGeo, dotMat);
    srcDot.position.set(0, knobRadius - 0.035, knobDepth / 2 + 0.001);
    this.sourceKnobMesh.add(srcDot);

    this.group.add(this.sourceKnobMesh);
    this.interactiveObjects.push(this.sourceKnobMesh);
    this.knobs.source = this.sourceKnobMesh;
    this.switches.power = this.sourceKnobMesh;
  }

  buildRearPanel() {
    const rearZ = -this.depth / 2 - 0.01;

    // Bass Reflex Acoustic Port (Tuned port for acoustic resonance)
    const portGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.45, 24);
    portGeo.rotateX(Math.PI / 2);
    const portMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95 });
    const port = new THREE.Mesh(portGeo, portMat);
    port.position.set(-this.width / 4, 0.15, rearZ + 0.2);
    this.group.add(port);

    // Port flange ring
    const flangeGeo = new THREE.RingGeometry(0.16, 0.22, 24);
    const flangeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
    const flange = new THREE.Mesh(flangeGeo, flangeMat);
    flange.position.set(-this.width / 4, 0.15, rearZ - 0.005);
    flange.rotation.y = Math.PI;
    this.group.add(flange);

    // External Antenna F-Connector & Jack Plate
    const plateGeo = new THREE.PlaneGeometry(0.8, 0.5);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x303236, roughness: 0.6, metalness: 0.4 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0.4, 0.05, rearZ - 0.005);
    plate.rotation.y = Math.PI;
    this.group.add(plate);

    // 75Ω Antenna terminal bolt
    const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16);
    boltGeo.rotateX(Math.PI / 2);
    const bolt = new THREE.Mesh(boltGeo, this.materials.knobMetal);
    bolt.position.set(0.3, 0.15, rearZ - 0.04);
    this.group.add(bolt);
  }

  buildFeet() {
    const footGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.06, 16);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x161618, roughness: 0.9 });
    const positions = [
      [-this.width / 2 + 0.35, -this.height / 2 - 0.035, -this.depth / 2 + 0.25],
      [this.width / 2 - 0.35, -this.height / 2 - 0.035, -this.depth / 2 + 0.25],
      [-this.width / 2 + 0.35, -this.height / 2 - 0.035, this.depth / 2 - 0.25],
      [this.width / 2 - 0.35, -this.height / 2 - 0.035, this.depth / 2 - 0.25]
    ];

    positions.forEach(pos => {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(...pos);
      this.group.add(foot);
    });
  }

  setPower(on) {
    this.isPowered = on;
    if (this.sourceKnobMesh) {
      // Source knob angle: OFF = -0.6 rad, FM = 0 rad, AM = 0.6 rad, AUX = 1.2 rad
      this.sourceKnobMesh.rotation.z = on ? 0 : -0.6;
    }
  }

  setFrequency(freq, band) {
    this.currentFreq = freq;
    this.currentBand = band;

    // 5:1 planetary geared dial disc rotation
    if (this.tuningDialMesh) {
      let norm = 0;
      if (band === 'FM') {
        norm = (freq - 88.0) / 20.0;
      } else if (band === 'AM') {
        norm = (freq - 550) / 1050;
      } else {
        norm = (freq - 6.0) / 12.0;
      }

      // Dial sweeps across approx 240 degrees (4.18 radians)
      const sweepAngle = (norm - 0.5) * 4.18;
      this.tuningDialMesh.rotation.z = -sweepAngle;
    }
  }

  setVolumeAngle(vol) {
    this.currentVolume = vol;
    if (this.volumeKnobMesh) {
      // 270 degree rotation from 7 o'clock to 5 o'clock
      const minAngle = 2.35;
      const maxAngle = -2.35;
      this.volumeKnobMesh.rotation.z = minAngle + vol * (maxAngle - minAngle);
    }
  }

  setActiveBand(band) {
    this.currentBand = band;
    if (this.sourceKnobMesh && this.isPowered) {
      if (band === 'FM') this.sourceKnobMesh.rotation.z = 0;
      else if (band === 'AM') this.sourceKnobMesh.rotation.z = 0.6;
      else if (band === 'AUX') this.sourceKnobMesh.rotation.z = 1.2;
    }
  }

  setTheme(themeName) {
    const valid = ['walnut', 'cherry', 'black-ash', 'white'];
    if (!valid.includes(themeName)) return;

    this.currentTheme = themeName;

    // Update wood texture
    if (this.materials.woodCabinet) {
      if (this.materials.woodCabinet.map) this.materials.woodCabinet.map.dispose();
      this.materials.woodCabinet.map = createTivoliWoodTexture(themeName);
      this.materials.woodCabinet.needsUpdate = true;
    }

    // Update faceplate texture
    if (this.materials.faceplate) {
      if (this.materials.faceplate.map) this.materials.faceplate.map.dispose();
      this.materials.faceplate.map = createTivoliFaceplateTexture(themeName);
      this.materials.faceplate.needsUpdate = true;
    }
  }

  update(delta, metrics) {
    // 1. Dynamic Amber Carrier LED:
    // Glows softly in static, brightens intensely when locking onto a carrier wave!
    if (this.tuningLedMesh && this.tuningLedLight) {
      if (!this.isPowered) {
        this.materials.tuningLed.emissiveIntensity = 0.0;
        this.tuningLedLight.intensity = 0.0;
      } else {
        const strength = metrics ? (metrics.signalStrength || 0) : 0;
        // Idle glow: 0.12, Full lock: 2.2
        const targetIntensity = 0.15 + strength * 2.0;
        this.materials.tuningLed.emissiveIntensity = THREE.MathUtils.lerp(
          this.materials.tuningLed.emissiveIntensity,
          targetIntensity,
          delta * 8.0
        );
        this.tuningLedLight.intensity = THREE.MathUtils.lerp(
          this.tuningLedLight.intensity,
          0.05 + strength * 0.8,
          delta * 8.0
        );
      }
    }

    // 2. Physical Speaker Cone Vibration behind grille
    if (this.speakerCone && this.speakerDustCap && metrics && metrics.isPlaying && this.isPowered) {
      const excursion = (metrics.bassLevel || 0) * 0.025;
      const baseZ = this.depth / 2 + 0.005;
      this.speakerCone.position.z = baseZ - 0.06 + excursion;
      this.speakerDustCap.position.z = baseZ - 0.02 + excursion * 1.2;
    }
  }
}
