/**
 * Web Audio API Engine for the Braun Radio
 * Features:
 * - Real live 24/7 internet radio streams with full CORS support
 * - Heavy curation of legendary Chill, Ambient, Downtempo, and Lo-Fi stations
 * - High-stability persistent HTML5 Audio Element integration
 * - Realistic radio static & heterodyne superheterodyne whistle when tuning
 * - Working automatic gain control (AGC) when locking onto stations
 * - AM / FM / SW band filtering (vintage AM warmth, shortwave flutter)
 * - Working Volume and Tone (Klang) filters
 * - Real-time FFT AnalyserNode driving 3D speaker vibration & VU meter needle
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.isPoweredOn = false;

    // Control parameters
    this.currentBand = 'FM'; // 'FM', 'AM', 'SW', 'AUX'
    this.frequency = 89.5; // Tuned to Groove Salad chill by default
    this.volume = 0.75;
    this.tone = 0.5;

    // Streaming state
    this.audioEl = null;
    this.streamSource = null;
    this.activeStation = null;
    this.isBuffering = false;
    this.isPlaying = false;
    this.streamError = false;
    this.isFallbackActive = false;
    this.streamWatchdog = null;
    this.onStatusChange = null;
    this.antennaReception = 1.0;

    // Real-time audio metrics
    this.currentSignalStrength = 0;
    this.currentAudioLevel = 0;
    this.analyserData = null;

    // Audio Graph Nodes
    this.stationGain = null;
    this.noiseGain = null;
    this.noiseFilter = null;
    this.heterodyneOsc = null;
    this.heterodyneGain = null;
    this.bandLowpass = null;
    this.bandHighpass = null;
    this.bassFilter = null;
    this.trebleFilter = null;
    this.masterGain = null;
    this.analyser = null;

    // Verified Real Stations (Heavy Chill / Ambient / Downtempo / Lo-Fi lineup)
    this.stations = {
      FM: [
        {
          freq: 89.5,
          name: 'Groove Salad (Chill & Downtempo)',
          genre: 'Ambient / Downtempo Beats & Grooves',
          url: 'https://ice1.somafm.com/groovesalad-128-mp3',
          bandwidth: 0.45
        },
        {
          freq: 91.5,
          name: 'Lush (Mellow Vocal Chillout)',
          genre: 'Sensuous & Mellow Vocal Chillout',
          url: 'https://ice1.somafm.com/lush-128-mp3',
          bandwidth: 0.45
        },
        {
          freq: 93.5,
          name: 'Fluid (Chill Hop & Future Soul)',
          genre: 'Soulful Chill Hip-Hop & Future Soul',
          url: 'https://ice1.somafm.com/fluid-128-mp3',
          bandwidth: 0.45
        },
        {
          freq: 95.7,
          name: 'Ill Street Lounge (Bachelor Pad Exotica)',
          genre: 'Classic Mid-Century Lounge & Exotica',
          url: 'https://ice1.somafm.com/illstreet-128-mp3',
          bandwidth: 0.45
        },
        {
          freq: 98.3,
          name: 'Drone Zone (Atmospheric Ambient)',
          genre: 'Atmospheric Ambient Space Chill',
          url: 'https://ice1.somafm.com/dronezone-128-mp3',
          bandwidth: 0.45
        },
        {
          freq: 100.8,
          name: 'Suburbs of Goa (Asian World Chill)',
          genre: 'Desi-Influenced World Chill & Ambient Beats',
          url: 'https://ice1.somafm.com/suburbsofgoa-128-mp3',
          bandwidth: 0.45
        },
        {
          freq: 103.2,
          name: 'Vaporwaves (Nostalgic Chillwave)',
          genre: 'Dreamy Vaporwave, Chillwave & Synth',
          url: 'https://ice1.somafm.com/vaporwaves-128-mp3',
          bandwidth: 0.45
        },
        {
          freq: 105.5,
          name: 'Deep Space One (Deep Ambient Chill)',
          genre: 'Deep Space Ambient Electronic',
          url: 'https://ice1.somafm.com/deepspaceone-128-mp3',
          bandwidth: 0.45
        },
        {
          freq: 107.5,
          name: 'Beat Blender (Late-Night Chill House)',
          genre: 'Deep House & Late Night Chill Grooves',
          url: 'https://ice1.somafm.com/beatblender-128-mp3',
          bandwidth: 0.45
        }
      ],
      AM: [
        {
          freq: 600,
          name: 'Secret Agent (Spy Jazz & Lounge)',
          genre: '1960s Spy Film Noir & Surf Jazz',
          url: 'https://ice1.somafm.com/secretagent-128-mp3',
          bandwidth: 30
        },
        {
          freq: 820,
          name: 'Boot Liquor (Americana & Roots)',
          genre: 'Vintage Roots, Acoustic & Americana Chill',
          url: 'https://ice1.somafm.com/bootliquor-128-mp3',
          bandwidth: 30
        },
        {
          freq: 1050,
          name: 'Folk Forward (Acoustic Folk)',
          genre: 'Contemporary & Indie Folk Acoustic',
          url: 'https://ice1.somafm.com/folkfwd-128-mp3',
          bandwidth: 30
        },
        {
          freq: 1340,
          name: 'Groove Salad Classic (Heritage Chill)',
          genre: 'Early 2000s Classic Ambient Downtempo',
          url: 'https://ice1.somafm.com/gsclassic-128-mp3',
          bandwidth: 30
        }
      ],
      SW: [
        {
          freq: 7.25,
          name: 'Mission Control (NASA Comms & Ambient)',
          genre: 'Space Ambient Mixed with Live NASA Comms',
          url: 'https://ice1.somafm.com/missioncontrol-128-mp3',
          bandwidth: 0.25
        },
        {
          freq: 9.49,
          name: 'SF 10-33 (Scanner Ambient)',
          genre: 'Ambient Space with Live Scanner Radio',
          url: 'https://ice1.somafm.com/sf1033-128-mp3',
          bandwidth: 0.25
        },
        {
          freq: 11.85,
          name: 'DEF CON Radio (Cyber Electronic)',
          genre: 'Dark Ambient & Hacker Electronic',
          url: 'https://ice1.somafm.com/defcon-128-mp3',
          bandwidth: 0.25
        },
        {
          freq: 14.20,
          name: 'Synphaera (Modern Synthesizer Space)',
          genre: 'Modern Space Ambient Synthesizer',
          url: 'https://ice1.somafm.com/synphaera-128-mp3',
          bandwidth: 0.25
        }
      ]
    };
  }

  // Initialize Web Audio graph
  init() {
    if (this.isInitialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Persistent HTML5 Audio element for live streams
    let audio = document.getElementById('radio-audio-stream');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'radio-audio-stream';
      audio.preload = 'none';
      audio.crossOrigin = 'anonymous';
      document.body.appendChild(audio);
    }
    this.audioEl = audio;

    // Attach stream event listeners for buffering state and error recovery
    this.audioEl.addEventListener('waiting', () => {
      this.isBuffering = true;
      clearTimeout(this.streamWatchdog);
      this.streamWatchdog = setTimeout(() => {
        if (this.isBuffering && this.isPoweredOn && this.currentSignalStrength > 0.2) {
          console.warn('Icecast stream buffering timed out (>4.5s); activating warm procedural fallback.');
          this.streamError = true;
          this.enableFallbackSynth(true);
          if (this.onStatusChange) this.onStatusChange();
        }
      }, 4500);
    });

    this.audioEl.addEventListener('playing', () => {
      clearTimeout(this.streamWatchdog);
      this.isBuffering = false;
      this.isPlaying = true;
      this.streamError = false;
      this.enableFallbackSynth(false);
      if (this.onStatusChange) this.onStatusChange();
    });

    this.audioEl.addEventListener('error', (e) => {
      console.warn('Icecast stream network error; engaging procedural fallback:', e);
      clearTimeout(this.streamWatchdog);
      this.streamError = true;
      this.isBuffering = false;
      this.enableFallbackSynth(true);
      if (this.onStatusChange) this.onStatusChange();
    });

    this.audioEl.addEventListener('stalled', () => {
      if (this.isPoweredOn && this.currentSignalStrength > 0.2) {
        clearTimeout(this.streamWatchdog);
        this.streamWatchdog = setTimeout(() => {
          if (!this.isPlaying && this.isPoweredOn) {
            this.streamError = true;
            this.enableFallbackSynth(true);
            if (this.onStatusChange) this.onStatusChange();
          }
        }, 3500);
      }
    });

    this.audioEl.addEventListener('pause', () => {
      this.isPlaying = false;
    });

    // 1. Analyser Node for visualizer and VU needle
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);

    // 2. Master Volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // 3. Tone & EQ stage (Bass / Treble shelves)
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(200, this.ctx.currentTime);
    this.bassFilter.gain.setValueAtTime(0, this.ctx.currentTime);

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(4000, this.ctx.currentTime);
    this.trebleFilter.gain.setValueAtTime(0, this.ctx.currentTime);

    // 4. Band Shaping Filters (AM narrow bandwidth, SW flutter)
    this.bandLowpass = this.ctx.createBiquadFilter();
    this.bandLowpass.type = 'lowpass';
    this.bandLowpass.frequency.setValueAtTime(18000, this.ctx.currentTime);

    this.bandHighpass = this.ctx.createBiquadFilter();
    this.bandHighpass.type = 'highpass';
    this.bandHighpass.frequency.setValueAtTime(20, this.ctx.currentTime);

    // Station carrier gain (fades down when off-tune)
    this.stationGain = this.ctx.createGain();
    this.stationGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // 5. Connect stream source through Web Audio
    try {
      this.streamSource = this.ctx.createMediaElementSource(this.audioEl);
      this.streamSource.connect(this.bandHighpass);
    } catch (err) {
      console.warn('MediaElementSource error, using direct playback fallback:', err);
    }

    // 6. Build Static, Heterodyne, and Procedural Synth generators
    this.buildNoiseGenerator();
    this.buildHeterodyneGenerator();
    this.buildProceduralSynth();

    // Wiring:
    // streamSource -> bandHighpass -> bandLowpass -> stationGain ---\
    // noiseSource  -> noiseFilter  -> noiseGain -------------------+--> bassFilter -> trebleFilter -> masterGain -> analyser -> destination
    // heterodyneOsc -> heterodyneGain -----------------------------/

    this.bandHighpass.connect(this.bandLowpass);
    this.bandLowpass.connect(this.stationGain);

    this.stationGain.connect(this.bassFilter);
    this.noiseGain.connect(this.bassFilter);
    this.heterodyneGain.connect(this.bassFilter);

    this.bassFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isInitialized = true;
    this.applyBandFilters();
    this.setTone(this.tone);
  }

  // Radio Static Noise Generator (Pink Noise + Resonant Bandpass tracking tuning)
  buildNoiseGenerator() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoiseSource = this.ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.noiseFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    whiteNoiseSource.start();
  }

  // Heterodyne Whistle Oscillator
  buildHeterodyneGenerator() {
    this.heterodyneOsc = this.ctx.createOscillator();
    this.heterodyneOsc.type = 'sine';
    this.heterodyneOsc.frequency.setValueAtTime(1000, this.ctx.currentTime);

    this.heterodyneGain = this.ctx.createGain();
    this.heterodyneGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.heterodyneOsc.connect(this.heterodyneGain);
    this.heterodyneOsc.start();
  }

  // Generative Warm Ambient Synth Fallback (activated on stream dropout or offline)
  buildProceduralSynth() {
    this.synthGain = this.ctx.createGain();
    this.synthGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.synthGain.connect(this.bandHighpass);

    // Warm pentatonic chord frequencies (F minor / Ab major: F3, Ab3, C4, Eb4, G4)
    const chordFreqs = [174.61, 207.65, 261.63, 311.13, 392.00];
    this.synthOscs = chordFreqs.map((f, i) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      oscGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(this.synthGain);
      osc.start();
      return { osc, gain: oscGain };
    });

    // Slow LFO for organic breathing modulation
    this.synthLFO = this.ctx.createOscillator();
    this.synthLFOGain = this.ctx.createGain();
    this.synthLFO.frequency.setValueAtTime(0.14, this.ctx.currentTime);
    this.synthLFOGain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    this.synthLFO.connect(this.synthLFOGain);
    this.synthLFOGain.connect(this.synthGain.gain);
    this.synthLFO.start();
  }

  enableFallbackSynth(enabled) {
    if (!this.synthGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.isFallbackActive = enabled;
    this.synthGain.gain.cancelScheduledValues(now);
    this.synthGain.gain.setTargetAtTime(enabled ? 0.35 : 0, now, 0.4);
  }

  // Play mechanical sound effects
  playSFX(type) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    if (type === 'click') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.025);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'power-on') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
      this.playSFX('click');
    } else if (type === 'knob-tick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3200, now);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.02);
    }
  }

  // Toggle Power
  setPower(on) {
    if (!this.isInitialized && on) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPoweredOn = on;
    this.playSFX(on ? 'power-on' : 'click');

    if (!this.isInitialized) return;

    const now = this.ctx.currentTime;
    if (on) {
      // Fade in master volume
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.35);

      // Force tune to current frequency immediately
      this.updateTuning(true);
    } else {
      // Fade out
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.15);
      if (this.audioEl) {
        this.audioEl.pause();
      }
      this.isPlaying = false;
    }
  }

  // Switch Band
  setBand(band) {
    if (this.currentBand === band) return;
    this.currentBand = band;
    this.playSFX('click');

    if (band === 'FM') {
      this.frequency = 89.5;
    } else if (band === 'AM') {
      this.frequency = 600;
    } else if (band === 'SW') {
      this.frequency = 7.25;
    }

    this.applyBandFilters();
    this.updateTuning(true);
  }

  applyBandFilters() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (this.currentBand === 'FM') {
      this.bandLowpass.frequency.setTargetAtTime(18000, now, 0.05);
      this.bandHighpass.frequency.setTargetAtTime(25, now, 0.05);
      this.noiseFilter.Q.setTargetAtTime(2.2, now, 0.05);
    } else if (this.currentBand === 'AM') {
      this.bandLowpass.frequency.setTargetAtTime(4500, now, 0.05);
      this.bandHighpass.frequency.setTargetAtTime(160, now, 0.05);
      this.noiseFilter.Q.setTargetAtTime(5.5, now, 0.05);
    } else if (this.currentBand === 'SW') {
      this.bandLowpass.frequency.setTargetAtTime(3600, now, 0.05);
      this.bandHighpass.frequency.setTargetAtTime(260, now, 0.05);
      this.noiseFilter.Q.setTargetAtTime(7.5, now, 0.05);
    } else if (this.currentBand === 'AUX') {
      this.bandLowpass.frequency.setTargetAtTime(20000, now, 0.05);
      this.bandHighpass.frequency.setTargetAtTime(20, now, 0.05);
    }
  }

  // Set Tuning Frequency
  setFrequency(freq) {
    this.frequency = freq;
    this.updateTuning(false);
  }

  // Tune to specific station directly (used when clicking station list item)
  tuneToStation(station, band) {
    if (band) this.currentBand = band;
    this.frequency = station.freq;
    this.applyBandFilters();
    if (!this.isPoweredOn) {
      this.setPower(true);
    } else {
      this.updateTuning(true);
    }
  }

  // Core tuning mechanics
  updateTuning(forceSwitch = false) {
    if (!this.isInitialized || !this.isPoweredOn) return;

    if (this.currentBand === 'AUX') {
      this.noiseGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      this.heterodyneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      this.stationGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.05);
      this.currentSignalStrength = 1.0;
      return;
    }

    const bandStations = this.stations[this.currentBand] || [];
    let bestStation = null;
    let minDistance = Infinity;

    bandStations.forEach(st => {
      const dist = Math.abs(this.frequency - st.freq);
      if (dist < minDistance) {
        minDistance = dist;
        bestStation = st;
      }
    });

    const now = this.ctx.currentTime;
    let signalStrength = 0;
    let detuneRatio = 1.0;

    if (bestStation && minDistance < bestStation.bandwidth) {
      detuneRatio = minDistance / bestStation.bandwidth;
      signalStrength = Math.max(0, 1 - Math.pow(detuneRatio, 1.8)) * this.antennaReception;

      // Lock onto station when signal is good
      if (signalStrength > 0.12) {
        if (this.activeStation !== bestStation || forceSwitch) {
          this.switchStation(bestStation);
        }
      }
    } else {
      detuneRatio = 1.0;
      signalStrength = 0;
    }

    this.currentSignalStrength = signalStrength;

    // Static volume: inverse of signal strength (AGC action)
    const staticLevel = (1 - signalStrength * 0.94) * 0.32;
    this.noiseGain.gain.setTargetAtTime(staticLevel, now, 0.04);

    // Resonant bandpass filter shifts pitch with the dial
    const normalizedDial = this.getNormalizedDialPos();
    const staticFilterFreq = 650 + normalizedDial * 2800;
    this.noiseFilter.frequency.setTargetAtTime(staticFilterFreq, now, 0.04);

    // Heterodyne whistle (whistles as you approach the carrier, sweeps into zero-beat)
    if (signalStrength > 0.05 && signalStrength < 0.90) {
      const whistlePitch = Math.max(50, detuneRatio * 2000);
      const whistleVol = (1 - detuneRatio) * detuneRatio * 0.20 * this.antennaReception;
      this.heterodyneOsc.frequency.setTargetAtTime(whistlePitch, now, 0.03);
      this.heterodyneGain.gain.setTargetAtTime(whistleVol, now, 0.03);
    } else {
      this.heterodyneGain.gain.setTargetAtTime(0, now, 0.04);
    }

    // Station audio volume based on tuning accuracy
    const stationVol = Math.pow(signalStrength, 1.5);
    this.stationGain.gain.setTargetAtTime(stationVol, now, 0.04);
  }

  getNormalizedDialPos() {
    if (this.currentBand === 'FM') {
      return (this.frequency - 88) / (108 - 88);
    } else if (this.currentBand === 'AM') {
      return (this.frequency - 530) / (1600 - 530);
    } else if (this.currentBand === 'SW') {
      return (this.frequency - 6.0) / (18.0 - 6.0);
    }
    return 0.5;
  }

  // Switch internet radio stream
  switchStation(station) {
    this.activeStation = station;
    if (!this.audioEl) return;

    this.isBuffering = true;
    this.streamError = false;
    this.enableFallbackSynth(false);

    clearTimeout(this.streamWatchdog);
    this.streamWatchdog = setTimeout(() => {
      if (this.isBuffering && this.isPoweredOn && this.currentSignalStrength > 0.2) {
        console.warn('Icecast stream buffering timed out (>4.5s); activating warm procedural fallback.');
        this.streamError = true;
        this.enableFallbackSynth(true);
        if (this.onStatusChange) this.onStatusChange();
      }
    }, 4500);

    // Check if same URL is already playing
    if (this.audioEl.src === station.url && !this.audioEl.paused) {
      this.isBuffering = false;
      this.isPlaying = true;
      clearTimeout(this.streamWatchdog);
      return;
    }

    // Smooth switch
    this.audioEl.pause();
    this.audioEl.src = station.url;
    this.audioEl.load();

    const playPromise = this.audioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          clearTimeout(this.streamWatchdog);
          this.isBuffering = false;
          this.isPlaying = true;
          this.streamError = false;
          this.enableFallbackSynth(false);
          if (this.onStatusChange) this.onStatusChange();
        })
        .catch(err => {
          console.warn('Stream play notice (waiting for user gesture or buffering):', err.message);
          this.isBuffering = false;
        });
    }
  }

  // Set Volume
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.isInitialized && this.isPoweredOn) {
      const gainVal = Math.pow(this.volume, 2);
      this.masterGain.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 0.03);
    }
  }

  // Set Tone / Klang
  setTone(val) {
    this.tone = Math.max(0, Math.min(1, val));
    if (this.isInitialized) {
      const now = this.ctx.currentTime;
      const bassGain = (1 - this.tone) * 8 - 4;
      const trebleGain = this.tone * 14 - 6;
      this.bassFilter.gain.setTargetAtTime(bassGain, now, 0.05);
      this.trebleFilter.gain.setTargetAtTime(trebleGain, now, 0.05);
    }
  }

  // Set Antenna
  setAntenna(extended) {
    this.antennaReception = extended ? 1.0 : 0.45;
    this.updateTuning();
  }

  // Load User Audio File (AUX Mode)
  loadUserAudioFile(file) {
    if (!this.isInitialized) this.init();
    if (!this.isPoweredOn) this.setPower(true);

    const fileUrl = URL.createObjectURL(file);
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = fileUrl;
      this.audioEl.load();
      this.audioEl.play().catch(e => console.log(e));
    }

    this.setBand('AUX');
  }

  // Update metrics loop (called every frame from animation loop)
  updateMetrics() {
    if (!this.isInitialized || !this.isPoweredOn || !this.analyser) {
      this.currentAudioLevel = 0;
      return { level: 0, signal: 0, bassEnergy: 0 };
    }

    this.analyser.getByteFrequencyData(this.analyserData);

    let sum = 0;
    let bassSum = 0;
    const bassBins = Math.floor(this.analyserData.length * 0.18);

    for (let i = 0; i < this.analyserData.length; i++) {
      const val = this.analyserData[i];
      sum += val;
      if (i < bassBins) {
        bassSum += val;
      }
    }

    const avg = sum / this.analyserData.length / 255;
    const bassEnergy = bassSum / bassBins / 255;
    this.currentAudioLevel = avg;

    return {
      level: avg,
      signal: this.currentSignalStrength,
      bassEnergy: bassEnergy
    };
  }

  // Get current station info for HUD display
  getCurrentStationInfo() {
    if (this.currentBand === 'AUX') {
      return {
        band: 'AUX',
        freq: 'LINE IN',
        name: 'AUX / Personal Player',
        genre: 'Direct High-Fidelity Audio',
        tuned: true,
        status: 'CONNECTED'
      };
    }

    if (this.activeStation && this.currentSignalStrength > 0.25) {
      let statusText = 'LOCKED';
      if (this.isFallbackActive) statusText = 'AMBIENT FALLBACK';
      else if (this.isBuffering) statusText = 'BUFFERING...';
      else if (this.isPlaying) statusText = 'LIVE STREAM';

      return {
        band: this.currentBand,
        freq: this.formatFreq(this.activeStation.freq, this.currentBand),
        name: this.isFallbackActive ? `${this.activeStation.name} (Offline)` : this.activeStation.name,
        genre: this.isFallbackActive ? 'Procedural Ambient Synth Backup' : this.activeStation.genre,
        tuned: true,
        signal: this.currentSignalStrength,
        status: statusText
      };
    }

    if (this.isFallbackActive) {
      return {
        band: this.currentBand,
        freq: this.formatFreq(this.frequency, this.currentBand),
        name: 'Procedural Ambient Synth',
        genre: 'Generative Analog Atmosphere (Offline)',
        tuned: true,
        signal: this.currentSignalStrength,
        status: 'FALLBACK ACTIVE'
      };
    }

    return {
      band: this.currentBand,
      freq: this.formatFreq(this.frequency, this.currentBand),
      name: 'Scanning Frequencies...',
      genre: 'Atmospheric Radio Static',
      tuned: false,
      signal: this.currentSignalStrength,
      status: 'SEARCHING'
    };
  }

  formatFreq(f, band) {
    if (band === 'FM') return `${f.toFixed(1)} MHz`;
    if (band === 'AM') return `${Math.round(f)} kHz`;
    if (band === 'SW') return `${f.toFixed(2)} MHz`;
    return `${f}`;
  }
}
