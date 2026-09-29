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
 * Main Application: Three.js Scene Setup, Lighting, Camera Tweening, UI & Keyboard Controls
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
    this.currentViewPreset = 'hero';
    this.prevVolume = 0.75;

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
      () => {
        this.updateUI();
        this.dismissHint();
      }
    );

    // Hook audio engine status changes
    this.audioEngine.onStatusChange = () => this.updateUI();

    // UI & Events
    this.bindUI();
    this.setupKeyboardShortcuts();
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
    document.body.classList.toggle('night-mode', isNight);

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

      // Make dial window lamp brighter in dark room with thermal target
      this.radio.dialLamp.distance = 2.5;
      this.radio.dialLampTarget = this.audioEngine.isPoweredOn ? 2.6 : 0;
      this.radio.dialMatTarget = this.audioEngine.isPoweredOn ? 0.65 : 0;
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
      this.radio.dialLampTarget = this.audioEngine.isPoweredOn ? 1.8 : 0;
      this.radio.dialMatTarget = this.audioEngine.isPoweredOn ? 0.42 : 0;
    }
  }

  // Parse URL Parameters (e.g. ?theme=wood&view=dial&night=true&power=on)
  parseURLParams() {
    const params = new URLSearchParams(window.location.search);

    const theme = params.get('theme');
    if (theme && ['white', 'black', 'wood'].includes(theme)) {
      this.radio.setTheme(theme);
      document.querySelectorAll('[data-theme]').forEach(b => {
        const isCurrent = b.getAttribute('data-theme') === theme;
        b.classList.toggle('active', isCurrent);
        b.setAttribute('aria-pressed', isCurrent);
      });
    }

    const view = params.get('view');
    if (view && this.cameraPresets[view]) {
      this.camera.position.copy(this.cameraPresets[view].pos);
      this.controls.target.copy(this.cameraPresets[view].target);
      this.controls.update();
      this.currentViewPreset = view;
      document.querySelectorAll('[data-view]').forEach(b => {
        const isCurrent = b.getAttribute('data-view') === view;
        b.classList.toggle('active', isCurrent);
        b.setAttribute('aria-pressed', isCurrent);
      });
    }

    const night = params.get('night');
    if (night === 'true' || night === '1') {
      const nightToggle = document.getElementById('night-mode-toggle');
      if (nightToggle) {
        nightToggle.classList.add('active');
        nightToggle.setAttribute('aria-pressed', 'true');
      }
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
      this.toggleDrawer(true);
    }
  }

  // Camera transition to preset
  goToView(presetName) {
    const preset = this.cameraPresets[presetName];
    if (!preset) return;
    this.currentViewPreset = presetName;
    this.targetCameraPos = preset.pos.clone();
    this.targetControlsTarget = preset.target.clone();
  }

  // Waveband switch helper
  setBand(band) {
    this.audioEngine.setBand(band);
    this.radio.setActiveBand(band);
    this.radio.setFrequency(this.audioEngine.frequency, band);
    this.updateUI();
    this.announceARIA(`Waveband switched to ${band}`);
  }

  // Screen reader announcements
  announceARIA(msg) {
    const el = document.getElementById('aria-status');
    if (el) {
      el.textContent = '';
      setTimeout(() => { el.textContent = msg; }, 40);
    }
  }

  // Toggle station drawer
  toggleDrawer(open) {
    const drawer = document.getElementById('station-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const toggleBtn = document.getElementById('station-drawer-toggle');
    if (!drawer) return;

    const isOpen = open !== undefined ? open : !drawer.classList.contains('open');
    drawer.classList.toggle('open', isOpen);
    if (backdrop) backdrop.classList.toggle('active', isOpen);
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', isOpen);
  }

  // Toggle shortcuts modal
  toggleShortcutsModal(open) {
    const modal = document.getElementById('shortcuts-modal');
    if (!modal) return;
    const shouldOpen = open !== undefined ? open : modal.style.display === 'none';
    modal.style.display = shouldOpen ? 'flex' : 'none';
  }

  // Close all open dialogs / drawers
  closeAllOverlays() {
    this.toggleDrawer(false);
    this.toggleShortcutsModal(false);
  }

  // Dismiss onboarding hint
  dismissHint() {
    const hint = document.getElementById('onboarding-hint');
    if (hint && hint.style.opacity !== '0') {
      hint.style.opacity = '0';
      hint.style.pointerEvents = 'none';
      setTimeout(() => { hint.style.display = 'none'; }, 300);
    }
  }

  // Bind universal keyboard shortcuts
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key;
      const code = e.code;

      // 1. Space: Toggle Power
      if (code === 'Space') {
        e.preventDefault();
        const nextState = !this.audioEngine.isPoweredOn;
        this.audioEngine.setPower(nextState);
        this.radio.setPower(nextState);
        this.updateUI();
        this.dismissHint();
        this.announceARIA(nextState ? 'Radio powered on' : 'Radio standby');
        return;
      }

      // 2. Arrow Left / Right: Frequency Tuning
      if (code === 'ArrowLeft' || code === 'ArrowRight') {
        e.preventDefault();
        const dir = code === 'ArrowRight' ? 1 : -1;
        const mult = e.shiftKey ? 4.0 : 1.0;
        const band = this.audioEngine.currentBand;
        let delta = 0;
        if (band === 'FM') delta = 0.1 * dir * mult;
        else if (band === 'AM') delta = 10 * dir * mult;
        else if (band === 'SW') delta = 0.05 * dir * mult;

        let newFreq = this.audioEngine.frequency + delta;
        if (band === 'FM') newFreq = Math.max(88.0, Math.min(108.0, newFreq));
        else if (band === 'AM') newFreq = Math.max(530, Math.min(1600, newFreq));
        else if (band === 'SW') newFreq = Math.max(6.0, Math.min(18.0, newFreq));

        this.audioEngine.setFrequency(newFreq);
        this.radio.setFrequency(newFreq, band);
        this.audioEngine.playSFX('knob-tick');
        this.updateUI();
        this.dismissHint();
        return;
      }

      // 3. Arrow Up / Down: Volume adjustment
      if (code === 'ArrowUp' || code === 'ArrowDown') {
        e.preventDefault();
        const dir = code === 'ArrowUp' ? 0.05 : -0.05;
        const newVol = Math.max(0, Math.min(1, this.audioEngine.volume + dir));
        this.audioEngine.setVolume(newVol);
        this.radio.setVolumeAngle(newVol);
        this.audioEngine.playSFX('knob-tick');
        this.updateUI();
        this.dismissHint();
        this.announceARIA(`Volume ${Math.round(newVol * 100)}%`);
        return;
      }

      // 4. Band Selection Keys: 1=FM, 2=AM, 3=SW, 4=AUX
      if (key === '1') { this.setBand('FM'); return; }
      if (key === '2') { this.setBand('AM'); return; }
      if (key === '3') { this.setBand('SW'); return; }
      if (key === '4') { this.setBand('AUX'); return; }

      // 5. M: Mute / Unmute
      if (code === 'KeyM') {
        e.preventDefault();
        if (this.audioEngine.volume > 0) {
          this.prevVolume = this.audioEngine.volume;
          this.audioEngine.setVolume(0);
          this.radio.setVolumeAngle(0);
          this.announceARIA('Audio muted');
        } else {
          const restore = this.prevVolume || 0.75;
          this.audioEngine.setVolume(restore);
          this.radio.setVolumeAngle(restore);
          this.announceARIA(`Audio unmuted, volume ${Math.round(restore * 100)}%`);
        }
        this.audioEngine.playSFX('click');
        this.updateUI();
        return;
      }

      // 6. V: Cycle camera view presets
      if (code === 'KeyV') {
        e.preventDefault();
        const presets = ['hero', 'front', 'dial', 'controls', 'back'];
        const currIdx = presets.indexOf(this.currentViewPreset || 'hero');
        const nextPreset = presets[(currIdx + 1) % presets.length];
        this.goToView(nextPreset);
        document.querySelectorAll('[data-view]').forEach(b => {
          const isCurrent = b.getAttribute('data-view') === nextPreset;
          b.classList.toggle('active', isCurrent);
          b.setAttribute('aria-pressed', isCurrent);
        });
        this.announceARIA(`Camera view: ${nextPreset}`);
        return;
      }

      // 7. N: Toggle Twilight / Night mode
      if (code === 'KeyN') {
        e.preventDefault();
        const nightToggle = document.getElementById('night-mode-toggle');
        if (nightToggle) {
          nightToggle.classList.toggle('active');
          const isNight = nightToggle.classList.contains('active');
          nightToggle.setAttribute('aria-pressed', isNight);
          this.setLightingMode(isNight);
        }
        return;
      }

      // 8. S: Toggle Station drawer
      if (code === 'KeyS') {
        e.preventDefault();
        this.toggleDrawer();
        return;
      }

      // 9. ?: Toggle Shortcuts modal
      if (key === '?' || (e.shiftKey && code === 'Slash')) {
        e.preventDefault();
        this.toggleShortcutsModal();
        return;
      }

      // 10. Escape: Close overlays
      if (code === 'Escape') {
        this.closeAllOverlays();
        return;
      }
    });
  }

  // Bind HTML UI controls
  bindUI() {
    // Camera view buttons
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-view]').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        this.goToView(btn.getAttribute('data-view'));
      });
    });

    // Theme buttons
    document.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-theme]').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        const theme = btn.getAttribute('data-theme');
        this.radio.setTheme(theme);
        this.announceARIA(`Cabinet theme: ${theme}`);
      });
    });

    // Night Mode Toggle
    const nightToggle = document.getElementById('night-mode-toggle');
    if (nightToggle) {
      nightToggle.addEventListener('click', () => {
        nightToggle.classList.toggle('active');
        const isNight = nightToggle.classList.contains('active');
        nightToggle.setAttribute('aria-pressed', isNight);
        this.setLightingMode(isNight);
      });
    }

    // Station list drawer toggle & close & backdrop
    const stationDrawerBtn = document.getElementById('station-drawer-toggle');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    const drawerBackdrop = document.getElementById('drawer-backdrop');

    if (stationDrawerBtn) {
      stationDrawerBtn.addEventListener('click', () => this.toggleDrawer());
    }
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', () => this.toggleDrawer(false));
    }
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', () => this.closeAllOverlays());
    }

    // Shortcuts modal toggle & close
    const shortcutsBtn = document.getElementById('shortcuts-modal-toggle');
    const shortcutsCloseBtn = document.getElementById('shortcuts-close-btn');
    if (shortcutsBtn) {
      shortcutsBtn.addEventListener('click', () => this.toggleShortcutsModal(true));
    }
    if (shortcutsCloseBtn) {
      shortcutsCloseBtn.addEventListener('click', () => this.toggleShortcutsModal(false));
    }

    // Hint dismiss button
    const hintDismissBtn = document.getElementById('hint-dismiss-btn');
    if (hintDismissBtn) {
      hintDismissBtn.addEventListener('click', () => this.dismissHint());
    }

    // Render station list items
    this.renderStationList();

    // Audio file uploader (AUX mode)
    const fileInput = document.getElementById('audio-file-input');
    const uploadBtn = document.getElementById('upload-audio-btn');
    const auxUploadBox = document.getElementById('aux-upload-box');

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
    }
    if (auxUploadBox && fileInput) {
      auxUploadBox.addEventListener('click', () => fileInput.click());
    }
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          this.audioEngine.loadUserAudioFile(e.target.files[0]);
          this.radio.setActiveBand('AUX');
          this.updateUI();
          this.toggleDrawer(false);
          this.announceARIA('Playing personal audio via AUX');
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
        this.announceARIA('Playing dropped audio file via AUX');
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
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        const freqText = this.audioEngine.formatFreq(st.freq, band);
        item.innerHTML = `
          <div class="station-freq">${freqText}</div>
          <div class="station-details">
            <div class="station-name">${st.name}</div>
            <div class="station-genre">${st.genre}</div>
          </div>
          <div class="station-play-btn" title="Tune & Play" aria-hidden="true">▶</div>
        `;
        const onSelect = () => {
          this.audioEngine.tuneToStation(st, band);
          this.radio.setActiveBand(band);
          this.radio.setFrequency(st.freq, band);
          this.updateUI();
          this.toggleDrawer(false);
          this.announceARIA(`Tuned to ${st.name} at ${freqText}`);
        };
        item.addEventListener('click', onSelect);
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        });
        listEl.appendChild(item);
      });
    });
  }

  // Update companion ticker and status pills
  updateUI() {
    const info = this.audioEngine.getCurrentStationInfo();

    // 1. Header Status Indicators
    const powerPill = document.getElementById('power-indicator-pill');
    if (powerPill) {
      const isPower = this.audioEngine.isPoweredOn;
      powerPill.className = `status-indicator ${isPower ? 'on' : 'standby'}`;
      powerPill.textContent = isPower ? 'POWER ON' : 'STANDBY';
    }

    const bandPill = document.getElementById('band-indicator-pill');
    if (bandPill) {
      bandPill.textContent = this.audioEngine.currentBand;
    }

    // 2. Whisper-Quiet Now-Playing Companion Ticker
    const freqEl = document.getElementById('ticker-freq');
    if (freqEl) freqEl.textContent = info.freq;

    const nameEl = document.getElementById('ticker-name');
    if (nameEl) nameEl.textContent = info.name;

    const genreEl = document.getElementById('ticker-genre');
    if (genreEl) genreEl.textContent = info.genre;

    const statusBadge = document.getElementById('ticker-status-badge');
    if (statusBadge) {
      if (!this.audioEngine.isPoweredOn) {
        statusBadge.className = 'ticker-badge standby';
        statusBadge.textContent = 'STANDBY';
      } else if (info.status === 'BUFFERING...') {
        statusBadge.className = 'ticker-badge buffering';
        statusBadge.textContent = 'BUFFERING';
      } else if (info.status && info.status.includes('FALLBACK')) {
        statusBadge.className = 'ticker-badge buffering';
        statusBadge.textContent = 'FALLBACK';
      } else if (info.status === 'LIVE STREAM' || (info.tuned && this.audioEngine.currentSignalStrength > 0.25)) {
        statusBadge.className = 'ticker-badge live';
        statusBadge.textContent = '● LIVE';
      } else {
        statusBadge.className = 'ticker-badge standby';
        statusBadge.textContent = 'TUNING';
      }
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

    // Update 3D radio elements (speaker vibration, dial lamp thermal rise, & VU meter needle)
    this.radio.update(delta, metrics);

    this.renderer.render(this.scene, this.camera);
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.braunApp = new App();
});
