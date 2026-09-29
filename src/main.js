import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BraunRadio } from './radioModel.js';
import { AudioEngine } from './audioEngine.js';
import { InteractionManager } from './interaction.js';

// High-precision lightweight delta timer
class SimpleTimer {
  constructor() {
    this.lastTime = performance.now();
  }
  getDelta() {
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    return Math.min(delta, 0.1);
  }
}

/**
 * Main Application: Three.js Scene Setup, Lighting, Camera Tweening & UI Binding
 */

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.timer = new SimpleTimer();

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdedad4); // warm gallery neutral

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 50);
    this.camera.position.set(1.5, 1.4, 5.2);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02; // prevent going beneath table
    this.controls.minDistance = 1.8;
    this.controls.maxDistance = 9.0;
    this.controls.target.set(0, 0, 0);

    // Camera preset definitions
    this.cameraPresets = {
      hero: { pos: new THREE.Vector3(1.4, 1.1, 5.0), target: new THREE.Vector3(0, 0, 0) },
      front: { pos: new THREE.Vector3(0, 0, 4.6), target: new THREE.Vector3(0, 0, 0) },
      dial: { pos: new THREE.Vector3(0.65, 0.40, 2.2), target: new THREE.Vector3(0.65, 0.40, 0.6) },
      controls: { pos: new THREE.Vector3(0.7, -0.3, 2.3), target: new THREE.Vector3(0.7, -0.3, 0.6) },
      back: { pos: new THREE.Vector3(0, 0.3, -4.6), target: new THREE.Vector3(0, 0, 0) }
    };
    this.targetCameraPos = null;
    this.targetControlsTarget = null;

    // Lighting Mode: 'day' or 'night'
    this.isNightMode = false;

    // Audio & Radio Models
    this.audioEngine = new AudioEngine();
    this.radio = new BraunRadio();
    this.scene.add(this.radio.group);

    // Studio Environment (Table, Lights, Shadows)
    this.setupEnvironment();

    // Raycast Interaction
    this.interaction = new InteractionManager(
      this.camera,
      this.renderer,
      this.radio,
      this.audioEngine,
      this.controls,
      () => this.updateUI()
    );

    // UI & Events
    this.bindUI();
    this.parseURLParams();
    window.addEventListener('resize', this.onResize.bind(this));

    // Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupEnvironment() {
    // 1. Sleek Mid-Century Credenza / Studio Desk Table
    const tableGeom = new THREE.PlaneGeometry(30, 30);
    this.tableMat = new THREE.MeshStandardMaterial({
      color: 0xc8c3ba,
      roughness: 0.72,
      metalness: 0.05
    });
    this.tableMesh = new THREE.Mesh(tableGeom, this.tableMat);
    this.tableMesh.rotation.x = -Math.PI / 2;
    this.tableMesh.position.y = -this.radio.height / 2 - 0.05;
    this.tableMesh.receiveShadow = true;
    this.scene.add(this.tableMesh);

    // 2. Studio Lighting Setup
    // Key Light (Warm Directional Light casting crisp soft shadows)
    this.keyLight = new THREE.DirectionalLight(0xfff8ee, 2.4);
    this.keyLight.position.set(4, 6, 5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 16;
    this.keyLight.shadow.camera.left = -3.5;
    this.keyLight.shadow.camera.right = 3.5;
    this.keyLight.shadow.camera.top = 3.5;
    this.keyLight.shadow.camera.bottom = -3.5;
    this.keyLight.shadow.bias = -0.0003;
    this.keyLight.shadow.radius = 3;
    this.scene.add(this.keyLight);

    // Soft Fill Light (Cool daylight tone)
    this.fillLight = new THREE.DirectionalLight(0xccdcff, 0.9);
    this.fillLight.position.set(-5, 4, 3);
    this.scene.add(this.fillLight);

    // Rim / Edge Light (Highlights aluminum bevels and knurled rims)
    this.rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.rimLight.position.set(2, 4, -5);
    this.scene.add(this.rimLight);

    // Ambient Hemisphere light
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x555555, 0.9);
    this.hemiLight.position.set(0, 10, 0);
    this.scene.add(this.hemiLight);
  }

  // Toggle Day / Night Lighting
  setLightingMode(isNight) {
    this.isNightMode = isNight;
    const duration = 1.0;

    if (isNight) {
      // Atmospheric warm twilight
      this.scene.background.setHex(0x16171a);
      this.tableMat.color.setHex(0x1c1d21);
      this.tableMat.roughness = 0.85;

      this.keyLight.intensity = 0.45;
      this.keyLight.color.setHex(0x3a4860);

      this.fillLight.intensity = 0.15;
      this.fillLight.color.setHex(0x202634);

      this.rimLight.intensity = 0.6;
      this.hemiLight.intensity = 0.25;

      // Make dial window lamp brighter in dark room
      this.radio.dialLamp.distance = 2.5;
      if (this.audioEngine.isPoweredOn) {
        this.radio.dialLamp.intensity = 2.6;
        this.radio.dialMat.emissiveIntensity = 0.65;
      }
    } else {
      // Daytime bright studio
      this.scene.background.setHex(0xdedad4);
      this.tableMat.color.setHex(0xc8c3ba);
      this.tableMat.roughness = 0.72;

      this.keyLight.intensity = 2.4;
      this.keyLight.color.setHex(0xfff8ee);

      this.fillLight.intensity = 0.9;
      this.fillLight.color.setHex(0xccdcff);

      this.rimLight.intensity = 1.4;
      this.hemiLight.intensity = 0.9;

      this.radio.dialLamp.distance = 1.8;
      if (this.audioEngine.isPoweredOn) {
        this.radio.dialLamp.intensity = 1.6;
        this.radio.dialMat.emissiveIntensity = 0.38;
      }
    }
  }

  // Parse URL Parameters (e.g. ?theme=wood&view=dial&night=true&power=on)
  parseURLParams() {
    const params = new URLSearchParams(window.location.search);

    const theme = params.get('theme');
    if (theme && ['white', 'black', 'wood'].includes(theme)) {
      this.radio.setTheme(theme);
      document.querySelectorAll('[data-theme]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-theme') === theme);
      });
    }

    const view = params.get('view');
    if (view && this.cameraPresets[view]) {
      this.camera.position.copy(this.cameraPresets[view].pos);
      this.controls.target.copy(this.cameraPresets[view].target);
      this.controls.update();
      document.querySelectorAll('[data-view]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-view') === view);
      });
    }

    const night = params.get('night');
    if (night === 'true' || night === '1') {
      const nightToggle = document.getElementById('night-mode-toggle');
      if (nightToggle) nightToggle.classList.add('active');
      this.setLightingMode(true);
    }

    const power = params.get('power');
    if (power === 'on' || power === '1') {
      this.audioEngine.setPower(true);
      this.radio.setPower(true);
      this.updateUI();
    }

    const drawer = params.get('drawer');
    if (drawer === 'open' || drawer === '1') {
      const drawerEl = document.getElementById('station-drawer');
      if (drawerEl) drawerEl.classList.add('open');
    }
  }

  // Camera transition to preset
  goToView(presetName) {
    const preset = this.cameraPresets[presetName];
    if (!preset) return;
    this.targetCameraPos = preset.pos.clone();
    this.targetControlsTarget = preset.target.clone();
  }

  // Bind HTML UI controls
  bindUI() {
    // Power toggle button on HUD
    const hudPowerBtn = document.getElementById('hud-power-btn');
    if (hudPowerBtn) {
      hudPowerBtn.addEventListener('click', () => {
        const nextState = !this.audioEngine.isPoweredOn;
        this.audioEngine.setPower(nextState);
        this.radio.setPower(nextState);
        this.updateUI();
      });
    }

    // Camera view buttons
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.goToView(btn.getAttribute('data-view'));
      });
    });

    // Theme buttons
    document.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.getAttribute('data-theme');
        this.radio.setTheme(theme);
      });
    });

    // Night Mode Toggle
    const nightToggle = document.getElementById('night-mode-toggle');
    if (nightToggle) {
      nightToggle.addEventListener('click', () => {
        nightToggle.classList.toggle('active');
        this.setLightingMode(nightToggle.classList.contains('active'));
      });
    }

    // Band selector buttons on HUD
    document.querySelectorAll('[data-band]').forEach(btn => {
      btn.addEventListener('click', () => {
        const band = btn.getAttribute('data-band');
        this.audioEngine.setBand(band);
        this.radio.setActiveBand(band);
        this.radio.setFrequency(this.audioEngine.frequency, band);
        this.updateUI();
      });
    });

    // Station list drawer toggle & clicks
    const stationDrawerBtn = document.getElementById('station-drawer-toggle');
    const stationDrawer = document.getElementById('station-drawer');
    if (stationDrawerBtn && stationDrawer) {
      stationDrawerBtn.addEventListener('click', () => {
        stationDrawer.classList.toggle('open');
      });
    }

    // Render station list items
    this.renderStationList();

    // Audio file uploader (AUX mode)
    const fileInput = document.getElementById('audio-file-input');
    const uploadBtn = document.getElementById('upload-audio-btn');
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          this.audioEngine.loadUserAudioFile(e.target.files[0]);
          this.radio.setActiveBand('AUX');
          this.updateUI();
        }
      });
    }

    // Drag and drop audio files onto window
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.audioEngine.loadUserAudioFile(e.dataTransfer.files[0]);
        this.radio.setActiveBand('AUX');
        this.updateUI();
      }
    });

    this.updateUI();
  }

  // Populate station quick selector with heavy Chill emphasis
  renderStationList() {
    const listEl = document.getElementById('station-list-items');
    if (!listEl) return;
    listEl.innerHTML = '';

    ['FM', 'AM', 'SW'].forEach(band => {
      const header = document.createElement('div');
      header.className = 'station-group-header';
      if (band === 'FM') {
        header.textContent = '★ CHILL & DOWNTEMPO FM';
      } else if (band === 'AM') {
        header.textContent = '★ VINTAGE LOUNGE & JAZZ AM';
      } else {
        header.textContent = '★ ATMOSPHERIC SHORTWAVE';
      }
      listEl.appendChild(header);

      const bandStations = this.audioEngine.stations[band] || [];
      bandStations.forEach(st => {
        const item = document.createElement('div');
        item.className = 'station-item';
        const freqText = this.audioEngine.formatFreq(st.freq, band);
        item.innerHTML = `
          <div class="station-freq">${freqText}</div>
          <div class="station-details">
            <div class="station-name">${st.name}</div>
            <div class="station-genre">${st.genre}</div>
          </div>
          <div class="station-play-btn" title="Tune & Play">▶</div>
        `;
        item.addEventListener('click', () => {
          this.audioEngine.tuneToStation(st, band);
          this.radio.setActiveBand(band);
          this.radio.setFrequency(st.freq, band);
          this.updateUI();
          const drawer = document.getElementById('station-drawer');
          if (drawer) drawer.classList.remove('open');
        });
        listEl.appendChild(item);
      });
    });
  }

  // Update HUD and overlay elements
  updateUI() {
    const info = this.audioEngine.getCurrentStationInfo();

    // Frequency display
    const freqEl = document.getElementById('hud-frequency');
    if (freqEl) freqEl.textContent = info.freq;

    // Station Name
    const nameEl = document.getElementById('hud-station-name');
    if (nameEl) nameEl.textContent = info.name;

    // Genre
    const genreEl = document.getElementById('hud-genre');
    if (genreEl) genreEl.textContent = info.genre;

    // Power status badge & button
    const powerBadge = document.getElementById('hud-power-indicator');
    const powerBtn = document.getElementById('hud-power-btn');
    if (powerBadge) {
      powerBadge.className = `power-badge ${this.audioEngine.isPoweredOn ? 'on' : 'off'}`;
      powerBadge.textContent = this.audioEngine.isPoweredOn ? 'POWER ON' : 'STANDBY';
    }
    if (powerBtn) {
      powerBtn.textContent = this.audioEngine.isPoweredOn ? 'TURN OFF' : 'TURN ON';
      powerBtn.classList.toggle('active', this.audioEngine.isPoweredOn);
    }

    // Stream status indicator badge
    const streamStatusEl = document.getElementById('hud-stream-status');
    if (streamStatusEl) {
      if (!this.audioEngine.isPoweredOn) {
        streamStatusEl.className = 'stream-badge standby';
        streamStatusEl.textContent = 'OFFLINE';
      } else if (info.status === 'BUFFERING...') {
        streamStatusEl.className = 'stream-badge buffering';
        streamStatusEl.textContent = 'BUFFERING';
      } else if (info.status === 'LIVE STREAM' || (info.tuned && this.audioEngine.currentSignalStrength > 0.3)) {
        streamStatusEl.className = 'stream-badge live';
        streamStatusEl.textContent = '● LIVE';
      } else {
        streamStatusEl.className = 'stream-badge standby';
        streamStatusEl.textContent = 'TUNING';
      }
    }

    // Active band highlight in HUD
    document.querySelectorAll('[data-band]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-band') === this.audioEngine.currentBand);
    });

    // Signal meter bar in HUD
    const signalBar = document.getElementById('hud-signal-fill');
    if (signalBar) {
      const pct = Math.round(this.audioEngine.currentSignalStrength * 100);
      signalBar.style.width = `${pct}%`;
      signalBar.style.backgroundColor = pct > 60 ? '#ff5500' : '#888888';
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.timer.getDelta();

    // Smooth camera transition if moving to a preset
    if (this.targetCameraPos && this.targetControlsTarget) {
      this.camera.position.lerp(this.targetCameraPos, 0.08);
      this.controls.target.lerp(this.targetControlsTarget, 0.08);

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.01) {
        this.targetCameraPos = null;
        this.targetControlsTarget = null;
      }
    }

    this.controls.update();

    // Query real-time audio metrics (energy, level, signal)
    const metrics = this.audioEngine.updateMetrics();

    // Update 3D radio elements (speaker vibration & VU meter needle)
    this.radio.update(delta, metrics);

    // Update live signal and volume meters in HUD
    const meterFill = document.getElementById('hud-level-fill');
    if (meterFill) {
      const pct = Math.min(100, Math.round(metrics.level * 180));
      meterFill.style.width = `${pct}%`;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.braunApp = new App();
});
