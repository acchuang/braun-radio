import * as THREE from 'three';
import { BaseRadio } from './BaseRadio.js';
import {
  createDialTexture,
  createSpeakerGrilleTexture,
  createVUMeterTexture,
  createControlPanelTexture,
  createBrushedMetalTexture,
  createKnurlNormalMap,
  createBackplateTexture,
  createWoodTexture
} from '../textures.js';

/**
 * Procedural 3D Model of the Braun Radio
 * Faithfully recreating Dieter Rams' balanced RT 20 / T 1000 aesthetic
 */
export class BraunRadio extends BaseRadio {
  constructor() {
    super();

    // Model identity
    this.modelId = 'braun';
    this.modelName = 'BRAUN';
    this.modelSubtitle = 'RT 20 • 1961 HI-FI RECEIVER';

    // Cabinet Dimensions
    this.width = 3.6;
    this.height = 1.95;
    this.depth = 1.35;
    this.cornerR = 0.12;

    this.availableThemes = [
      { id: 'white', label: 'White', color: '#f0eeea', title: 'Classic Atelier White' },
      { id: 'black', label: 'Black', color: '#1c1d1f', title: 'Atelier Anthracite' },
      { id: 'wood', label: 'Wood', color: '#cbb28b', title: 'RT 20 Wood & White' }
    ];

    this.cameraPresets = {
      hero: { pos: new THREE.Vector3(2.5, 1.2, 3.8), target: new THREE.Vector3(0, 0, 0) },
      front: { pos: new THREE.Vector3(0, 0, 4.0), target: new THREE.Vector3(0, 0, 0) },
      dial: { pos: new THREE.Vector3(0.5, 0.45, 2.2), target: new THREE.Vector3(0.5, 0.45, 0) },
      controls: { pos: new THREE.Vector3(0.65, -0.45, 2.0), target: new THREE.Vector3(0.65, -0.45, 0) },
      back: { pos: new THREE.Vector3(0, 0.2, -3.8), target: new THREE.Vector3(0, 0, 0) }
    };

    // Animated elements
    this.needleMesh = null;
    this.meterNeedlePivot = null;
    this.speakerCone = null;
    this.speakerDustCap = null;
    this.dialLamp = null;
    this.dialMat = null;
    this.meterFaceMat = null;
    this.dialLampTarget = 0;
    this.dialMatTarget = 0;
    this.meterFaceTarget = 0;
    this.antennaMast = null;
    this.isAntennaExtended = true;

    // Materials map for themes
    this.materials = {};
    this.currentTheme = 'white';

    this.build();
  }

  build() {
    // 1. Textures
    const dialTex = createDialTexture();
    const grilleTex = createSpeakerGrilleTexture();
    const vuTex = createVUMeterTexture();
    const controlPanelTex = createControlPanelTexture();
    const knurlTex = createKnurlNormalMap();
    const backplateTex = createBackplateTexture();
    const woodTex = createWoodTexture();

    // 2. Base Materials
    this.materials.body = new THREE.MeshStandardMaterial({
      color: 0xedebe6,
      roughness: 0.38,
      metalness: 0.04
    });

    this.materials.woodSides = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.42,
      metalness: 0.04
    });

    this.materials.knobMetal = new THREE.MeshStandardMaterial({
      color: 0xe8ecf0,
      metalness: 0.92,
      roughness: 0.22,
      normalMap: knurlTex,
      normalScale: new THREE.Vector2(0.25, 0.25)
    });

    this.materials.chrome = new THREE.MeshStandardMaterial({
      color: 0xf5f7fa,
      metalness: 0.98,
      roughness: 0.06
    });

    this.materials.rubber = new THREE.MeshStandardMaterial({
      color: 0x18191b,
      roughness: 0.9,
      metalness: 0.05
    });

    this.materials.speakerCloth = new THREE.MeshStandardMaterial({
      color: 0x121315,
      roughness: 0.95,
      metalness: 0.0
    });

    this.materials.orangeAccent = new THREE.MeshStandardMaterial({
      color: 0xff4d00, // Iconic Braun cadmium orange
      roughness: 0.25,
      metalness: 0.1
    });

    // 3. Cabinet Enclosure
    this.buildCabinet();

    // 4. Front Subassemblies (Mounted at z = 0.655)
    this.buildSpeaker(grilleTex);
    this.buildDialWindow(dialTex);
    this.buildVUMeter(vuTex);
    this.buildControlPanel(controlPanelTex);

    // 5. Antenna, Backplate, Feet
    this.buildAntenna();
    this.buildBackPanel(backplateTex);
    this.buildFeet();
  }

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

  buildCabinet() {
    const outerShape = this.createRoundedRectShape(this.width, this.height, this.cornerR);
    const innerShape = this.createRoundedRectShape(this.width - 0.18, this.height - 0.18, 0.06);

    // Front bezel rim with hollow window
    const bezelShape = this.createRoundedRectShape(this.width, this.height, this.cornerR);
    bezelShape.holes.push(innerShape);

    const bezelGeom = new THREE.ExtrudeGeometry(bezelShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.025,
      bevelThickness: 0.025
    });
    this.bezelMesh = new THREE.Mesh(bezelGeom, this.materials.body);
    this.bezelMesh.position.z = 0.61;
    this.bezelMesh.castShadow = true;
    this.group.add(this.bezelMesh);

    // Main cabinet body sleeve
    const sleeveGeom = new THREE.ExtrudeGeometry(outerShape, {
      depth: this.depth - 0.1,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.025,
      bevelThickness: 0.025
    });
    this.cabinetMesh = new THREE.Mesh(sleeveGeom, this.materials.body);
    this.cabinetMesh.position.z = -this.depth / 2 + 0.02;
    this.cabinetMesh.castShadow = true;
    this.cabinetMesh.receiveShadow = true;
    this.group.add(this.cabinetMesh);

    // Recessed mounting back-wall
    const backWallGeom = new THREE.PlaneGeometry(this.width - 0.18, this.height - 0.18);
    const backWallMat = new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.8 });
    const backWall = new THREE.Mesh(backWallGeom, backWallMat);
    backWall.position.set(0, 0, 0.638);
    this.group.add(backWall);

    // Wood Side Panels for RT20 Theme
    const sideShape = this.createRoundedRectShape(this.depth + 0.04, this.height + 0.01, 0.08);
    const sideGeom = new THREE.ExtrudeGeometry(sideShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.015,
      bevelThickness: 0.015
    });
    sideGeom.center();

    this.leftSideWood = new THREE.Mesh(sideGeom, this.materials.woodSides);
    this.leftSideWood.rotation.y = Math.PI / 2;
    this.leftSideWood.position.set(-this.width / 2 - 0.025, 0, 0);
    this.leftSideWood.visible = false;
    this.leftSideWood.castShadow = true;
    this.group.add(this.leftSideWood);

    this.rightSideWood = new THREE.Mesh(sideGeom, this.materials.woodSides);
    this.rightSideWood.rotation.y = Math.PI / 2;
    this.rightSideWood.position.set(this.width / 2 + 0.025, 0, 0);
    this.rightSideWood.visible = false;
    this.rightSideWood.castShadow = true;
    this.group.add(this.rightSideWood);
  }

  buildSpeaker(grilleTex) {
    const spkW = 1.58;
    const spkH = 1.64;
    const spkX = -0.86;
    const spkY = 0;
    const spkZ = 0.655;

    // Perforated Grille Front Plate
    const grilleGeom = new THREE.PlaneGeometry(spkW, spkH);

    this.grilleMat = new THREE.MeshStandardMaterial({
      map: grilleTex,
      metalness: 0.82,
      roughness: 0.32,
      bumpMap: grilleTex,
      bumpScale: 0.005
    });

    const grilleMesh = new THREE.Mesh(grilleGeom, this.grilleMat);
    grilleMesh.position.set(spkX, spkY, spkZ);
    grilleMesh.receiveShadow = true;
    this.group.add(grilleMesh);

    // Dark acoustic cloth backing behind the grille
    const clothGeom = new THREE.PlaneGeometry(spkW, spkH);
    const clothMesh = new THREE.Mesh(clothGeom, this.materials.speakerCloth);
    clothMesh.position.set(spkX, spkY, spkZ - 0.015);
    this.group.add(clothMesh);

    // 3D Moving Speaker Cone
    const speakerGroup = new THREE.Group();
    speakerGroup.position.set(spkX, spkY, spkZ - 0.04);

    const rimGeom = new THREE.TorusGeometry(0.55, 0.04, 16, 32);
    const rimMesh = new THREE.Mesh(rimGeom, this.materials.rubber);
    speakerGroup.add(rimMesh);

    const coneGeom = new THREE.CylinderGeometry(0.52, 0.16, 0.14, 32, 1, true);
    coneGeom.rotateX(Math.PI / 2);
    this.speakerCone = new THREE.Mesh(coneGeom, new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.85
    }));
    speakerGroup.add(this.speakerCone);

    const capGeom = new THREE.SphereGeometry(0.14, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    capGeom.rotateX(-Math.PI / 2);
    this.speakerDustCap = new THREE.Mesh(capGeom, new THREE.MeshStandardMaterial({
      color: 0x161719,
      roughness: 0.6
    }));
    this.speakerDustCap.position.z = 0.035;
    speakerGroup.add(this.speakerDustCap);

    this.group.add(speakerGroup);
  }

  buildDialWindow(dialTex) {
    const dwW = 1.32;
    const dwH = 0.70;
    const dwX = 0.96;
    const dwY = 0.44;
    const dwZ = 0.655;

    // Backlit Frequency Scale Plate
    const dialGeom = new THREE.PlaneGeometry(dwW, dwH);
    this.dialMat = new THREE.MeshStandardMaterial({
      map: dialTex,
      roughness: 0.35,
      metalness: 0.02,
      emissive: 0xffaa44,
      emissiveIntensity: 0.0,
      emissiveMap: dialTex
    });
    const dialMesh = new THREE.Mesh(dialGeom, this.dialMat);
    dialMesh.position.set(dwX, dwY, dwZ);
    this.group.add(dialMesh);

    // Warm incandescent dial lamp
    this.dialLamp = new THREE.PointLight(0xffb54c, 0, 2.2, 1.8);
    this.dialLamp.position.set(dwX, dwY, dwZ + 0.015);
    this.group.add(this.dialLamp);

    // Hairline orange frequency needle
    const needleGeom = new THREE.BoxGeometry(0.012, dwH - 0.06, 0.008);
    this.needleMesh = new THREE.Mesh(needleGeom, this.materials.orangeAccent);
    this.needleMinX = dwX - dwW / 2 + 0.15;
    this.needleMaxX = dwX + dwW / 2 - 0.08;
    this.needleMesh.position.set(this.needleMinX + (this.needleMaxX - this.needleMinX) * 0.075, dwY, dwZ + 0.010);
    this.group.add(this.needleMesh);

    // High-clarity protective acrylic cover glass
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.05,
      metalness: 0.1
    });
    const glassMesh = new THREE.Mesh(dialGeom, glassMat);
    glassMesh.position.set(dwX, dwY, dwZ + 0.016);
    this.group.add(glassMesh);

    // Hollow Bezel Frame around the perimeter of the window (center cut out!)
    const frameShape = this.createRoundedRectShape(dwW + 0.03, dwH + 0.03, 0.03);
    const frameHole = this.createRoundedRectShape(dwW, dwH, 0.01);
    frameShape.holes.push(frameHole);

    const frameGeom = new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.006,
      bevelThickness: 0.006
    });
    const frameMesh = new THREE.Mesh(frameGeom, new THREE.MeshStandardMaterial({
      color: 0x202225,
      roughness: 0.45,
      metalness: 0.4
    }));
    frameMesh.position.set(dwX, dwY, dwZ + 0.006);
    this.group.add(frameMesh);
  }

  buildVUMeter(vuTex) {
    const mx = 0.12;
    const my = 0.44;
    const mz = 0.655;
    const meterSize = 0.38;

    // Dial face
    const faceGeom = new THREE.CircleGeometry(meterSize / 2, 32);
    this.meterFaceMat = new THREE.MeshStandardMaterial({
      map: vuTex,
      roughness: 0.35,
      metalness: 0.02,
      emissive: 0xffaa44,
      emissiveIntensity: 0.0
    });
    const faceMesh = new THREE.Mesh(faceGeom, this.meterFaceMat);
    faceMesh.position.set(mx, my, mz);
    this.group.add(faceMesh);

    // Rotating meter needle pivot
    const needlePivot = new THREE.Group();
    needlePivot.position.set(mx, my - 0.08, mz + 0.008);

    const needleGeom = new THREE.BoxGeometry(0.006, 0.22, 0.004);
    needleGeom.translate(0, 0.10, 0);
    const needleMesh = new THREE.Mesh(needleGeom, this.materials.orangeAccent);
    needlePivot.add(needleMesh);

    const pinGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.008, 16);
    pinGeom.rotateX(Math.PI / 2);
    const pinMesh = new THREE.Mesh(pinGeom, this.materials.chrome);
    needlePivot.add(pinMesh);

    this.meterNeedlePivot = needlePivot;
    this.meterNeedleMinAngle = 0.42;
    this.meterNeedleMaxAngle = -0.42;
    needlePivot.rotation.z = this.meterNeedleMinAngle;
    this.group.add(needlePivot);

    // Bezel ring collar (hollow Torus ring)
    const bezelGeom = new THREE.TorusGeometry(meterSize / 2 + 0.008, 0.014, 16, 36);
    const bezelMesh = new THREE.Mesh(bezelGeom, new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.35,
      metalness: 0.7
    }));
    bezelMesh.position.set(mx, my, mz + 0.012);
    this.group.add(bezelMesh);

    // Protective glass lens
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.05,
      metalness: 0.1
    });
    const lensMesh = new THREE.Mesh(faceGeom, lensMat);
    lensMesh.position.set(mx, my, mz + 0.016);
    this.group.add(lensMesh);
  }

  buildControlPanel(controlPanelTex) {
    const cpW = 1.65;
    const cpH = 0.82;
    const cpX = 0.82;
    const cpY = -0.40;
    const cpZ = 0.655;

    // Brushed Aluminum Control Plate
    const cpGeom = new THREE.PlaneGeometry(cpW, cpH);

    this.controlPanelMat = new THREE.MeshStandardMaterial({
      map: controlPanelTex,
      metalness: 0.85,
      roughness: 0.30
    });

    const cpMesh = new THREE.Mesh(cpGeom, this.controlPanelMat);
    cpMesh.position.set(cpX, cpY, cpZ);
    cpMesh.receiveShadow = true;
    this.group.add(cpMesh);

    // Knobs creation helper
    const createKnob = (radius, height, name, posX, posY) => {
      const knobGroup = new THREE.Group();

      // Main knurled cylinder body
      const cylGeom = new THREE.CylinderGeometry(radius, radius, height, 48);
      cylGeom.rotateX(Math.PI / 2);
      const cylMesh = new THREE.Mesh(cylGeom, this.materials.knobMetal);
      cylMesh.castShadow = true;
      knobGroup.add(cylMesh);

      // Polished chamfer rim
      const rimGeom = new THREE.TorusGeometry(radius * 0.92, radius * 0.08, 16, 48);
      const rimMesh = new THREE.Mesh(rimGeom, this.materials.chrome);
      rimMesh.position.z = height / 2;
      knobGroup.add(rimMesh);

      // Recessed face
      const faceGeom = new THREE.CircleGeometry(radius * 0.88, 32);
      const faceMesh = new THREE.Mesh(faceGeom, new THREE.MeshStandardMaterial({
        color: 0xdde1e6,
        roughness: 0.38,
        metalness: 0.86
      }));
      faceMesh.position.z = height / 2 + 0.001;
      knobGroup.add(faceMesh);

      // Dark hairline pointer slot
      const markGeom = new THREE.BoxGeometry(0.008, radius * 0.48, 0.004);
      markGeom.translate(0, radius * 0.55, height / 2 + 0.003);
      const markMesh = new THREE.Mesh(markGeom, new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.2
      }));
      knobGroup.add(markMesh);

      knobGroup.position.set(posX, posY, cpZ + height / 2 + 0.005);
      knobGroup.userData = { isKnob: true, name: name, angle: 0 };

      this.interactiveObjects.push(knobGroup);
      this.knobs[name] = knobGroup;
      this.group.add(knobGroup);
      return knobGroup;
    };

    // Knobs
    const volKnob = createKnob(0.16, 0.10, 'volume', 0.55, -0.42);
    volKnob.rotation.z = -Math.PI * 0.75 + (Math.PI * 1.5) * 0.7;

    const toneKnob = createKnob(0.14, 0.09, 'tone', 0.98, -0.42);
    toneKnob.rotation.z = 0;

    const tuningKnob = createKnob(0.24, 0.13, 'tuning', 1.40, -0.40);

    // Band Push-Buttons
    const bands = ['FM', 'AM', 'SW', 'AUX'];
    const bStartX = 0.42;
    const bSpacing = 0.28;
    const by = -0.15;

    bands.forEach((band, idx) => {
      const btnGroup = new THREE.Group();
      const bx = bStartX + idx * bSpacing;

      // Bezel ring
      const bezelGeom = new THREE.CylinderGeometry(0.075, 0.078, 0.018, 24);
      bezelGeom.rotateX(Math.PI / 2);
      const bezelMesh = new THREE.Mesh(bezelGeom, this.materials.chrome);
      bezelMesh.position.set(bx, by, cpZ);
      this.group.add(bezelMesh);

      // Button plunger
      const btnGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.035, 24);
      btnGeom.rotateX(Math.PI / 2);
      const btnMat = new THREE.MeshStandardMaterial({
        color: 0x2d3035,
        roughness: 0.35,
        metalness: 0.2
      });
      const btnMesh = new THREE.Mesh(btnGeom, btnMat);
      btnGroup.add(btnMesh);

      // Dot accent
      const dotGeom = new THREE.CircleGeometry(0.02, 16);
      const dotMat = (band === 'FM') ? this.materials.orangeAccent : new THREE.MeshStandardMaterial({ color: 0x888888 });
      const dotMesh = new THREE.Mesh(dotGeom, dotMat);
      dotMesh.position.z = 0.018;
      btnGroup.add(dotMesh);

      btnGroup.position.set(bx, by, cpZ + (band === 'FM' ? 0.006 : 0.018));
      btnGroup.userData = { isButton: true, type: 'band', value: band, dotMesh: dotMesh };

      this.interactiveObjects.push(btnGroup);
      this.buttons[band] = btnGroup;
      this.group.add(btnGroup);
    });

    // Power Rocker Switch
    const pGroup = new THREE.Group();
    const px = 0.12;
    const py = -0.42;

    const pBezelGeom = new THREE.BoxGeometry(0.14, 0.26, 0.025);
    const pBezel = new THREE.Mesh(pBezelGeom, new THREE.MeshStandardMaterial({
      color: 0x1f2124,
      roughness: 0.45
    }));
    pBezel.position.set(px, py, cpZ);
    this.group.add(pBezel);

    const rockerGeom = new THREE.BoxGeometry(0.11, 0.20, 0.035);
    rockerGeom.translate(0, 0, 0.018);
    const rockerMesh = new THREE.Mesh(rockerGeom, new THREE.MeshStandardMaterial({
      color: 0x161719,
      roughness: 0.3
    }));

    const pDotGeom = new THREE.CircleGeometry(0.022, 16);
    const powerDot = new THREE.Mesh(pDotGeom, this.materials.orangeAccent);
    powerDot.position.set(0, 0.045, 0.036);
    rockerMesh.add(powerDot);

    pGroup.add(rockerMesh);
    pGroup.position.set(px, py, cpZ);
    pGroup.rotation.x = 0.2;
    pGroup.userData = { isSwitch: true, name: 'power', state: false };

    this.interactiveObjects.push(pGroup);
    this.switches.power = pGroup;
    this.group.add(pGroup);
  }

  buildAntenna() {
    const antGroup = new THREE.Group();
    const ax = 1.35;
    const ay = this.height / 2 + 0.02;
    const az = -this.depth / 2 + 0.25;

    const baseGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.04, 16);
    const baseMesh = new THREE.Mesh(baseGeom, this.materials.chrome);
    antGroup.add(baseMesh);

    const ballGeom = new THREE.SphereGeometry(0.035, 16, 16);
    const ballMesh = new THREE.Mesh(ballGeom, this.materials.chrome);
    ballMesh.position.y = 0.03;
    antGroup.add(ballMesh);

    const mastGroup = new THREE.Group();
    mastGroup.position.y = 0.04;
    mastGroup.rotation.z = -0.15;

    const segLengths = [0.45, 0.40, 0.38, 0.35];
    const segRadii = [0.016, 0.012, 0.009, 0.006];
    let currentY = 0;

    for (let i = 0; i < 4; i++) {
      const segGeom = new THREE.CylinderGeometry(segRadii[i], segRadii[i], segLengths[i], 16);
      segGeom.translate(0, segLengths[i] / 2, 0);
      const segMesh = new THREE.Mesh(segGeom, this.materials.chrome);
      segMesh.position.y = currentY;
      mastGroup.add(segMesh);
      currentY += segLengths[i];
    }

    const tipGeom = new THREE.SphereGeometry(0.018, 16, 16);
    const tipMesh = new THREE.Mesh(tipGeom, this.materials.orangeAccent);
    tipMesh.position.y = currentY;
    mastGroup.add(tipMesh);

    antGroup.add(mastGroup);
    antGroup.position.set(ax, ay, az);
    antGroup.userData = { isAntenna: true };

    this.interactiveObjects.push(antGroup);
    this.antennaMast = mastGroup;
    this.group.add(antGroup);
  }

  buildBackPanel(backplateTex) {
    const bw = this.width - 0.16;
    const bh = this.height - 0.16;
    const geom = new THREE.PlaneGeometry(bw, bh);

    const mat = new THREE.MeshStandardMaterial({
      map: backplateTex,
      roughness: 0.85,
      metalness: 0.15
    });

    const backMesh = new THREE.Mesh(geom, mat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.set(0, 0, -this.depth / 2 - 0.01);
    this.group.add(backMesh);
  }

  buildFeet() {
    const footR = 0.09;
    const footH = 0.05;
    const geom = new THREE.CylinderGeometry(footR * 0.85, footR, footH, 24);

    const positions = [
      [-this.width / 2 + 0.35, -this.height / 2 - footH / 2, this.depth / 2 - 0.3],
      [this.width / 2 - 0.35, -this.height / 2 - footH / 2, this.depth / 2 - 0.3],
      [-this.width / 2 + 0.35, -this.height / 2 - footH / 2, -this.depth / 2 + 0.3],
      [this.width / 2 - 0.35, -this.height / 2 - footH / 2, -this.depth / 2 + 0.3]
    ];

    positions.forEach(pos => {
      const foot = new THREE.Mesh(geom, this.materials.rubber);
      foot.position.set(...pos);
      foot.castShadow = true;
      this.group.add(foot);
    });
  }

  // --- Dynamic State Updates ---

  setPower(on) {
    this.switches.power.rotation.x = on ? -0.2 : 0.2;
    this.switches.power.userData.state = on;

    // Thermal target intensity (simulating 1960s incandescent tungsten bulb)
    this.dialLampTarget = on ? 1.8 : 0;
    this.dialMatTarget = on ? 0.42 : 0;
    this.meterFaceTarget = on ? 0.28 : 0;
  }

  setFrequency(freq, band) {
    let t = 0.5;
    if (band === 'FM') {
      t = Math.max(0, Math.min(1, (freq - 88) / (108 - 88)));
    } else if (band === 'AM') {
      t = Math.max(0, Math.min(1, (freq - 530) / (1600 - 530)));
    } else if (band === 'SW') {
      t = Math.max(0, Math.min(1, (freq - 6.0) / (18.0 - 6.0)));
    }

    if (this.needleMesh) {
      this.needleMesh.position.x = this.needleMinX + t * (this.needleMaxX - this.needleMinX);
    }
  }

  setVolumeAngle(vol) {
    if (this.knobs.volume) {
      const minAngle = -Math.PI * 0.75;
      const maxAngle = Math.PI * 0.75;
      this.knobs.volume.rotation.z = minAngle + vol * (maxAngle - minAngle);
    }
  }

  setToneAngle(tone) {
    if (this.knobs.tone) {
      const minAngle = -Math.PI * 0.7;
      const maxAngle = Math.PI * 0.7;
      this.knobs.tone.rotation.z = minAngle + tone * (maxAngle - minAngle);
    }
  }

  setActiveBand(activeBand) {
    const cpZ = 0.655;
    Object.keys(this.buttons).forEach(band => {
      const btn = this.buttons[band];
      const isSelected = (band === activeBand);
      btn.position.z = cpZ + (isSelected ? 0.006 : 0.018);
      if (btn.userData.dotMesh) {
        btn.userData.dotMesh.material = isSelected ? this.materials.orangeAccent : new THREE.MeshStandardMaterial({ color: 0x888888 });
      }
    });
  }

  toggleAntenna() {
    this.isAntennaExtended = !this.isAntennaExtended;
    const targetScaleY = this.isAntennaExtended ? 1.0 : 0.28;
    this.antennaMast.scale.set(1, targetScaleY, 1);
    return this.isAntennaExtended;
  }

  setTheme(themeName) {
    this.currentTheme = themeName;

    if (themeName === 'white') {
      this.materials.body.color.setHex(0xedebe6);
      this.materials.body.roughness = 0.38;
      this.grilleMat.color.setHex(0xffffff);
      this.controlPanelMat.color.setHex(0xffffff);
      this.leftSideWood.visible = false;
      this.rightSideWood.visible = false;
    } else if (themeName === 'black') {
      this.materials.body.color.setHex(0x191a1d);
      this.materials.body.roughness = 0.45;
      this.grilleMat.color.setHex(0x42464c);
      this.controlPanelMat.color.setHex(0x42464c);
      this.leftSideWood.visible = false;
      this.rightSideWood.visible = false;
    } else if (themeName === 'wood') {
      this.materials.body.color.setHex(0xf4f1eb);
      this.materials.body.roughness = 0.35;
      this.grilleMat.color.setHex(0xffffff);
      this.controlPanelMat.color.setHex(0xffffff);
      this.leftSideWood.visible = true;
      this.rightSideWood.visible = true;
    }
  }

  update(delta, metrics) {
    // Incandescent thermal filament rise (approx 150ms time constant)
    const thermalSpeed = 1.0 - Math.exp(-delta * 9.0);
    if (this.dialLamp) {
      this.dialLamp.intensity = THREE.MathUtils.lerp(this.dialLamp.intensity, this.dialLampTarget, thermalSpeed);
    }
    if (this.dialMat) {
      this.dialMat.emissiveIntensity = THREE.MathUtils.lerp(this.dialMat.emissiveIntensity, this.dialMatTarget, thermalSpeed);
    }
    if (this.meterFaceMat) {
      this.meterFaceMat.emissiveIntensity = THREE.MathUtils.lerp(this.meterFaceMat.emissiveIntensity, this.meterFaceTarget, thermalSpeed);
    }

    if (this.speakerCone && this.speakerDustCap) {
      const targetDisplacement = metrics.bassEnergy * 0.035;
      this.speakerCone.position.z = THREE.MathUtils.lerp(this.speakerCone.position.z, targetDisplacement, 0.4);
      this.speakerDustCap.position.z = 0.035 + this.speakerCone.position.z * 1.2;
    }

    if (this.meterNeedlePivot) {
      const targetValue = Math.min(1.0, metrics.signal * 0.82 + metrics.level * 0.45);
      const targetAngle = this.meterNeedleMinAngle + targetValue * (this.meterNeedleMaxAngle - this.meterNeedleMinAngle);
      this.meterNeedlePivot.rotation.z = THREE.MathUtils.lerp(this.meterNeedlePivot.rotation.z, targetAngle, 0.2);
    }
  }
}
