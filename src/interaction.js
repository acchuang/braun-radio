import * as THREE from 'three';

/**
 * Handles 3D raycasting, knob dragging, button clicks, and tactile feedback
 */
export class InteractionManager {
  constructor(camera, renderer, radio, audioEngine, controls, onStateChange) {
    this.camera = camera;
    this.renderer = renderer;
    this.radio = radio;
    this.audioEngine = audioEngine;
    this.controls = controls;
    this.onStateChange = onStateChange;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Dragging state
    this.isDragging = false;
    this.draggedKnob = null;
    this.knobScreenCenter = { x: 0, y: 0 };
    this.lastPointerAngle = 0;
    this.lastMousePos = { x: 0, y: 0 };
    this.hoveredObject = null;

    // Knob detent tick tracking
    this.lastTuningTickAngle = 0;
    this.lastVolumeTickVal = 0.75;
    this.lastToneTickVal = 0.5;

    this.setupListeners();
  }

  setRadio(newRadio) {
    this.radio = newRadio;
    this.isDragging = false;
    this.draggedKnob = null;
    this.hoveredObject = null;
  }

  setupListeners() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    dom.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
  }

  // Find interactive object or ancestor in group
  findInteractiveParent(obj) {
    let curr = obj;
    while (curr) {
      if (curr.userData && (curr.userData.isKnob || curr.userData.isButton || curr.userData.isSwitch || curr.userData.isAntenna)) {
        return curr;
      }
      if (curr === this.radio.group) break;
      curr = curr.parent;
    }
    return null;
  }

  onPointerDown(e) {
    if (this.audioEngine && this.audioEngine.resumeContext) {
      this.audioEngine.resumeContext();
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.radio.group.children, true);

    if (intersects.length > 0) {
      const target = this.findInteractiveParent(intersects[0].object);
      if (target) {
        // 1. Knob Interaction (Rotary dials, 5:1 wheels, and twist-antennas)
        if (target.userData.isKnob) {
          this.isDragging = true;
          this.draggedKnob = target;
          this.controls.enabled = false; // pause orbit controls while twisting knob
          this.lastMousePos = { x: e.clientX, y: e.clientY };

          // Project knob 3D center to 2D screen coordinates for circular rotary drag
          const knobWorldPos = new THREE.Vector3();
          target.getWorldPosition(knobWorldPos);
          const projected = knobWorldPos.clone().project(this.camera);
          this.knobScreenCenter = {
            x: ((projected.x + 1) / 2) * rect.width + rect.left,
            y: ((-projected.y + 1) / 2) * rect.height + rect.top
          };
          this.lastPointerAngle = Math.atan2(e.clientY - this.knobScreenCenter.y, e.clientX - this.knobScreenCenter.x);

          document.body.style.cursor = 'grabbing';
          e.preventDefault();
          return;
        }

        // 2. Band Button Click (Direct band switch)
        if (target.userData.isButton && target.userData.type === 'band') {
          const band = target.userData.value;
          this.audioEngine.setBand(band);
          this.radio.setActiveBand(band);
          this.radio.setFrequency(this.audioEngine.frequency, band);
          if (this.onStateChange) this.onStateChange();
          return;
        }

        // 2b. Band Toggle Button (e.g. Tykho FM / AM toggle)
        if (target.userData.isButton && target.userData.type === 'band-toggle') {
          const nextBand = this.audioEngine.currentBand === 'FM' ? 'AM' : 'FM';
          this.audioEngine.setBand(nextBand);
          this.radio.setActiveBand(nextBand);
          this.radio.setFrequency(this.audioEngine.frequency, nextBand);
          this.audioEngine.playSFX('click');
          if (this.onStateChange) this.onStateChange();
          return;
        }

        // 2c. Step Volume Button (e.g. Tykho + / - buttons)
        if (target.userData.isButton && target.userData.type === 'volume-step') {
          const delta = (target.userData.dir || 1) * 0.08;
          const newVol = Math.max(0, Math.min(1, this.audioEngine.volume + delta));
          this.audioEngine.setVolume(newVol);
          this.radio.setVolumeAngle(newVol);
          this.audioEngine.playSFX('knob-tick');
          if (this.onStateChange) this.onStateChange();
          return;
        }

        // 3. Power Switch Toggle
        if (target.userData.isSwitch && target.userData.name === 'power') {
          const newState = !this.audioEngine.isPoweredOn;
          this.audioEngine.setPower(newState);
          this.radio.setPower(newState);
          if (this.onStateChange) this.onStateChange();
          return;
        }

        // 4. Telescopic Antenna Toggle
        if (target.userData.isAntenna) {
          const extended = this.radio.toggleAntenna();
          this.audioEngine.setAntenna(extended);
          this.audioEngine.playSFX('click');
          if (this.onStateChange) this.onStateChange();
          return;
        }
      }
    }
  }

  onPointerMove(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Handle Active Knob Dragging
    if (this.isDragging && this.draggedKnob) {
      // 1. Calculate true rotary angle delta around projected knob center
      const currentAngle = Math.atan2(e.clientY - this.knobScreenCenter.y, e.clientX - this.knobScreenCenter.x);
      let angleDelta = currentAngle - this.lastPointerAngle;
      while (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
      while (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;
      this.lastPointerAngle = currentAngle;

      const deltaX = e.clientX - this.lastMousePos.x;
      const deltaY = this.lastMousePos.y - e.clientY; // up is positive
      this.lastMousePos = { x: e.clientX, y: e.clientY };

      // Directional move delta: pure angular rotation, or clean tangential projection
      let moveDelta = 0;
      if (Math.abs(angleDelta) > 0.003) {
        moveDelta = angleDelta;
      } else {
        // Tangential motion projection: prevents directional fighting across quadrants
        const rx = this.lastMousePos.x - this.knobScreenCenter.x;
        const ry = this.lastMousePos.y - this.knobScreenCenter.y;
        const rLen = Math.hypot(rx, ry);
        if (rLen > 12) {
          // Tangent vector clockwise: (-ry, rx)
          moveDelta = (-ry * deltaX + rx * deltaY) / (rLen * rLen);
        } else {
          moveDelta = (deltaX - deltaY) * 0.006;
        }
      }

      const knobName = this.draggedKnob.userData.name;

      if (knobName === 'tuning') {
        // Tuning knob moves frequency with precise gear reduction
        const isGeared = this.draggedKnob.userData.isGeared;
        const gearRatio = isGeared ? 0.35 : 0.75;
        const step = moveDelta * gearRatio;
        this.draggedKnob.rotation.z -= step * 1.5;

        // Trigger mechanical ratchet ticks
        if (Math.abs(this.draggedKnob.rotation.z - this.lastTuningTickAngle) > (isGeared ? 0.06 : 0.12)) {
          this.audioEngine.playSFX('knob-tick');
          this.lastTuningTickAngle = this.draggedKnob.rotation.z;
        }

        let newFreq = this.audioEngine.frequency;
        const band = this.audioEngine.currentBand;

        if (band === 'FM') {
          newFreq = Math.max(88.0, Math.min(108.0, newFreq + step * 4.5));
        } else if (band === 'AM') {
          newFreq = Math.max(530, Math.min(1600, newFreq + step * 240));
        } else if (band === 'SW') {
          newFreq = Math.max(6.0, Math.min(18.0, newFreq + step * 3.0));
        }

        // Magnetic AFC Detent: soft pull towards station carrier frequencies
        const bandStations = this.audioEngine.stations[band] || [];
        const snapThreshold = band === 'FM' ? 0.18 : (band === 'AM' ? 14 : 0.12);
        let nearLock = false;
        for (const st of bandStations) {
          const dist = Math.abs(newFreq - st.freq);
          if (dist < snapThreshold) {
            newFreq = THREE.MathUtils.lerp(newFreq, st.freq, 0.42);
            nearLock = true;
            if (dist < 0.05 && !this.isNearLock) {
              this.isNearLock = true;
              this.audioEngine.playSFX('knob-tick');
            }
            break;
          }
        }
        if (!nearLock) {
          this.isNearLock = false;
        }

        this.audioEngine.setFrequency(newFreq);
        this.radio.setFrequency(newFreq, band);
        this.updateTooltip(this.draggedKnob);
      } else if (knobName === 'volume') {
        // Volume knob
        const deltaVol = moveDelta * 0.12;
        const newVol = Math.max(0, Math.min(1, this.audioEngine.volume + deltaVol));
        this.audioEngine.setVolume(newVol);
        this.radio.setVolumeAngle(newVol);
        this.updateTooltip(this.draggedKnob);

        // Tactile detent tick on volume increments
        if (Math.abs(newVol - this.lastVolumeTickVal) > 0.08) {
          this.audioEngine.playSFX('knob-tick');
          this.lastVolumeTickVal = newVol;
        }
      } else if (knobName === 'tone') {
        // Tone knob
        const deltaTone = moveDelta * 0.12;
        const newTone = Math.max(0, Math.min(1, this.audioEngine.tone + deltaTone));
        this.audioEngine.setTone(newTone);
        this.radio.setToneAngle(newTone);
        this.updateTooltip(this.draggedKnob);

        // Tactile detent tick on tone increments
        if (Math.abs(newTone - this.lastToneTickVal) > 0.08) {
          this.audioEngine.playSFX('knob-tick');
          this.lastToneTickVal = newTone;
        }
      } else if (knobName === 'source') {
        // Source knob on Tivoli Model One (OFF, FM, AM, AUX)
        const angle = this.draggedKnob.rotation.z - moveDelta * 0.6;
        this.draggedKnob.rotation.z = Math.max(-0.8, Math.min(1.4, angle));
        this.updateTooltip(this.draggedKnob);

        if (this.draggedKnob.rotation.z < -0.3) {
          if (this.audioEngine.isPoweredOn) {
            this.audioEngine.setPower(false);
            this.radio.setPower(false);
            this.audioEngine.playSFX('click');
          }
        } else {
          if (!this.audioEngine.isPoweredOn) {
            this.audioEngine.setPower(true);
            this.radio.setPower(true);
            this.audioEngine.playSFX('power-thump');
          }
          if (this.draggedKnob.rotation.z >= -0.3 && this.draggedKnob.rotation.z < 0.3) {
            if (this.audioEngine.currentBand !== 'FM') {
              this.audioEngine.setBand('FM');
              this.radio.setActiveBand('FM');
              this.audioEngine.playSFX('click');
            }
          } else if (this.draggedKnob.rotation.z >= 0.3 && this.draggedKnob.rotation.z < 0.9) {
            if (this.audioEngine.currentBand !== 'AM') {
              this.audioEngine.setBand('AM');
              this.radio.setActiveBand('AM');
              this.audioEngine.playSFX('click');
            }
          } else if (this.draggedKnob.rotation.z >= 0.9) {
            if (this.audioEngine.currentBand !== 'AUX') {
              this.audioEngine.setBand('AUX');
              this.radio.setActiveBand('AUX');
              this.audioEngine.playSFX('click');
            }
          }
        }
      }

      if (this.onStateChange) this.onStateChange();
      return;
    }

    // Hover state raycasting for cursor and tooltips
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.radio.group.children, true);

    if (intersects.length > 0) {
      const target = this.findInteractiveParent(intersects[0].object);
      if (target) {
        document.body.style.cursor = target.userData.isKnob ? 'grab' : 'pointer';
        this.hoveredObject = target;
        this.updateTooltip(target);
        return;
      }
    }

    document.body.style.cursor = 'default';
    this.hoveredObject = null;
    this.updateTooltip(null);
  }

  onPointerUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.draggedKnob = null;
      this.controls.enabled = true;
      document.body.style.cursor = 'default';
    }
  }

  // Mouse wheel fine-tuning when hovering over or actively dragging knobs
  onWheel(e) {
    const targetKnob = this.draggedKnob || (this.hoveredObject && this.hoveredObject.userData.isKnob ? this.hoveredObject : null);
    if (!targetKnob) return;

    e.preventDefault();
    e.stopPropagation();
    const knobName = targetKnob.userData.name;
    const isGeared = targetKnob.userData.isGeared;
    const delta = -Math.sign(e.deltaY) * (isGeared ? 0.01 : 0.02);

    if (knobName === 'tuning') {
      const band = this.audioEngine.currentBand;
      let newFreq = this.audioEngine.frequency;
      if (band === 'FM') {
        newFreq = Math.max(88.0, Math.min(108.0, newFreq + delta * 1.2));
      } else if (band === 'AM') {
        newFreq = Math.max(530, Math.min(1600, newFreq + delta * 25.0));
      } else if (band === 'SW') {
        newFreq = Math.max(6.0, Math.min(18.0, newFreq + delta * 0.35));
      }
      this.audioEngine.setFrequency(newFreq);
      this.radio.setFrequency(newFreq, band);
      targetKnob.rotation.z += delta * 1.5;
      this.audioEngine.playSFX('knob-tick');
      this.updateTooltip(targetKnob);
    } else if (knobName === 'volume') {
      const newVol = Math.max(0, Math.min(1, this.audioEngine.volume + delta * 2.0));
      this.audioEngine.setVolume(newVol);
      this.radio.setVolumeAngle(newVol);
      this.audioEngine.playSFX('knob-tick');
      this.updateTooltip(targetKnob);
    } else if (knobName === 'tone') {
      const newTone = Math.max(0, Math.min(1, this.audioEngine.tone + delta * 2.0));
      this.audioEngine.setTone(newTone);
      this.radio.setToneAngle(newTone);
      this.audioEngine.playSFX('knob-tick');
      this.updateTooltip(targetKnob);
    }

    if (this.onStateChange) this.onStateChange();
  }

  updateTooltip(target) {
    const tooltipEl = document.getElementById('tooltip');
    if (!tooltipEl) return;

    if (!target) {
      tooltipEl.style.opacity = '0';
      return;
    }

    let text = '';
    if (target.userData.isKnob) {
      const freqStr = this.audioEngine.formatFreq ? this.audioEngine.formatFreq(this.audioEngine.frequency, this.audioEngine.currentBand) : `${this.audioEngine.frequency.toFixed(1)} MHz`;
      if (target.userData.isAntennaTuner) {
        text = `Antenna Tuner: ${freqStr} — Twist or scroll to tune`;
      } else if (target.userData.isGeared) {
        text = `5:1 Planetary Geared Dial: ${freqStr} — Drag or scroll to tune`;
      } else if (target.userData.name === 'tuning') {
        text = `Tuning Dial: ${freqStr} — Click & drag or scroll`;
      } else if (target.userData.name === 'volume') {
        text = `Volume: ${Math.round(this.audioEngine.volume * 100)}% — Drag or scroll`;
      } else if (target.userData.name === 'tone') {
        text = `Klang / Tone: ${Math.round(this.audioEngine.tone * 100)}% — Drag or scroll`;
      } else if (target.userData.name === 'source') {
        text = `Source Selector (${this.audioEngine.isPoweredOn ? this.audioEngine.currentBand : 'OFF'}) — Drag to switch`;
      }
    } else if (target.userData.isButton) {
      if (target.userData.type === 'volume-step') {
        text = `Volume ${target.userData.dir > 0 ? 'Up (+)' : 'Down (-)'} — Click to adjust`;
      } else if (target.userData.type === 'band-toggle') {
        text = `Band Toggle (${this.audioEngine.currentBand === 'FM' ? 'Switch to AM' : 'Switch to FM'})`;
      } else if (target.userData.type === 'band') {
        text = `Band: ${target.userData.value} — Click to switch`;
      }
    } else if (target.userData.isSwitch) {
      text = `Power: ${this.audioEngine.isPoweredOn ? 'ON' : 'OFF'} — Click to toggle`;
    } else if (target.userData.isAntenna) {
      text = `Telescopic Antenna — Click to ${this.radio.isAntennaExtended ? 'retract' : 'extend'}`;
    }

    tooltipEl.textContent = text;
    tooltipEl.style.opacity = text ? '1' : '0';
  }
}
