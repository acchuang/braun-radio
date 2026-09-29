import * as THREE from 'three';

/**
 * Procedural texture generators for the Braun Radio
 * Recreating Dieter Rams / Ulm School precision graphics & PBR textures
 */

// 1. Frequency Dial Scale Texture (FM, AM, SW)
export function createDialTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');

  // Background: Clean warm white / light cream vintage parchment
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#f4efe6');
  bgGrad.addColorStop(0.3, '#fdfaf4');
  bgGrad.addColorStop(0.7, '#faf6ee');
  bgGrad.addColorStop(1, '#eee7da');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border hairline
  ctx.strokeStyle = '#c0b7a6';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  const baseFont = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif';

  // Branding top row
  ctx.fillStyle = '#111214';
  ctx.font = `bold 42px ${baseFont}`;
  ctx.textAlign = 'left';
  ctx.fillText('BRAUN', 48, 80);

  ctx.font = `600 22px ${baseFont}`;
  ctx.fillStyle = '#55585f';
  ctx.fillText('TRANSISTOR ALL-WAVE RECEIVER', 220, 80);

  ctx.font = `600 20px ${baseFont}`;
  ctx.fillStyle = '#7a7e86';
  ctx.textAlign = 'right';
  ctx.fillText('HI-FI STEREO / RT 20', canvas.width - 48, 80);

  // Scale boundaries
  const leftX = 220;
  const rightX = canvas.width - 80;
  const scaleW = rightX - leftX;

  // --- Band 1: FM (UKW) 88 - 108 MHz ---
  const fmY = 240;
  ctx.fillStyle = '#111214';
  ctx.font = `bold 36px ${baseFont}`;
  ctx.textAlign = 'left';
  ctx.fillText('FM', 52, fmY + 10);
  ctx.font = `20px ${baseFont}`;
  ctx.fillStyle = '#6a6e75';
  ctx.fillText('MHz', 120, fmY + 10);

  ctx.strokeStyle = '#1a1b1d';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(leftX, fmY);
  ctx.lineTo(rightX, fmY);
  ctx.stroke();

  // FM Ticks
  const fmMin = 88;
  const fmMax = 108;
  for (let f = fmMin; f <= fmMax; f += 0.5) {
    const t = (f - fmMin) / (fmMax - fmMin);
    const x = leftX + t * scaleW;
    const isMajor = Math.abs(f - Math.round(f)) < 0.01 && f % 2 === 0;
    const isMedium = Math.abs(f - Math.round(f)) < 0.01;

    ctx.beginPath();
    ctx.moveTo(x, fmY);
    if (isMajor) {
      ctx.lineTo(x, fmY - 40);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#111214';
      ctx.stroke();

      ctx.fillStyle = '#111214';
      ctx.font = `bold 32px ${baseFont}`;
      ctx.textAlign = 'center';
      ctx.fillText(f.toString(), x, fmY - 50);
    } else if (isMedium) {
      ctx.lineTo(x, fmY - 25);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#282a2e';
      ctx.stroke();
    } else {
      ctx.lineTo(x, fmY - 14);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#6a6e75';
      ctx.stroke();
    }
  }

  // Chill Station markers along FM scale
  const fmStations = [
    { f: 89.5, name: 'GROOVE SALAD' },
    { f: 91.5, name: 'LUSH' },
    { f: 93.5, name: 'FLUID' },
    { f: 95.7, name: 'LOUNGE' },
    { f: 98.3, name: 'DRONE' },
    { f: 100.8, name: 'GOA CHILL' },
    { f: 103.2, name: 'VAPORWAVE' },
    { f: 105.5, name: 'DEEP SPACE' },
    { f: 107.5, name: 'BEAT BLEND' }
  ];

  fmStations.forEach(st => {
    const t = (st.f - fmMin) / (fmMax - fmMin);
    const x = leftX + t * scaleW;

    ctx.fillStyle = '#ff5500';
    ctx.beginPath();
    ctx.arc(x, fmY + 24, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d04400';
    ctx.font = `bold 18px ${baseFont}`;
    ctx.textAlign = 'center';
    ctx.fillText(st.name, x, fmY + 54);
  });

  // --- Band 2: AM (MW) 530 - 1600 kHz ---
  const amY = 500;
  ctx.fillStyle = '#111214';
  ctx.font = `bold 36px ${baseFont}`;
  ctx.textAlign = 'left';
  ctx.fillText('AM', 52, amY + 10);
  ctx.font = `20px ${baseFont}`;
  ctx.fillStyle = '#6a6e75';
  ctx.fillText('kHz ×10', 120, amY + 10);

  ctx.strokeStyle = '#1a1b1d';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(leftX, amY);
  ctx.lineTo(rightX, amY);
  ctx.stroke();

  const amLabels = [54, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
  amLabels.forEach((val, idx) => {
    const t = idx / (amLabels.length - 1);
    const x = leftX + t * scaleW;

    ctx.beginPath();
    ctx.moveTo(x, amY);
    ctx.lineTo(x, amY - 35);
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = '#1a1b1d';
    ctx.stroke();

    ctx.fillStyle = '#1a1b1d';
    ctx.font = `bold 30px ${baseFont}`;
    ctx.textAlign = 'center';
    ctx.fillText(val.toString(), x, amY - 46);
  });

  for (let i = 0; i < amLabels.length - 1; i++) {
    const t0 = i / (amLabels.length - 1);
    const t1 = (i + 1) / (amLabels.length - 1);
    for (let s = 1; s <= 4; s++) {
      const ts = t0 + (t1 - t0) * (s / 5);
      const x = leftX + ts * scaleW;
      ctx.beginPath();
      ctx.moveTo(x, amY);
      ctx.lineTo(x, amY - 16);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#5a5d63';
      ctx.stroke();
    }
  }

  // --- Band 3: SW (KW) 6.0 - 18.0 MHz ---
  const swY = 740;
  ctx.fillStyle = '#111214';
  ctx.font = `bold 36px ${baseFont}`;
  ctx.textAlign = 'left';
  ctx.fillText('SW', 52, swY + 10);
  ctx.font = `20px ${baseFont}`;
  ctx.fillStyle = '#6a6e75';
  ctx.fillText('MHz', 120, swY + 10);

  ctx.strokeStyle = '#1a1b1d';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(leftX, swY);
  ctx.lineTo(rightX, swY);
  ctx.stroke();

  const swMin = 6.0;
  const swMax = 18.0;
  for (let f = swMin; f <= swMax; f += 0.5) {
    const t = (f - swMin) / (swMax - swMin);
    const x = leftX + t * scaleW;
    const isMajor = Math.abs(f % 2) < 0.01;

    ctx.beginPath();
    ctx.moveTo(x, swY);
    if (isMajor) {
      ctx.lineTo(x, swY - 35);
      ctx.lineWidth = 3.0;
      ctx.strokeStyle = '#1a1b1d';
      ctx.stroke();

      ctx.fillStyle = '#1a1b1d';
      ctx.font = `bold 30px ${baseFont}`;
      ctx.textAlign = 'center';
      ctx.fillText(f.toFixed(0), x, swY - 46);
    } else {
      ctx.lineTo(x, swY - 16);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#5a5d63';
      ctx.stroke();
    }
  }

  // Bottom Dieter Rams calibration stamp
  ctx.fillStyle = '#6a6e75';
  ctx.font = `bold 18px ${baseFont}`;
  ctx.textAlign = 'left';
  ctx.fillText('SUPERHETERODYNE • 9 TRANSISTORS • AUTOMATIC FREQUENCY CONTROL', 52, canvas.height - 36);

  ctx.textAlign = 'right';
  ctx.fillText('MADE IN GERMANY • BRAUN AG FRANKFURT/M', canvas.width - 52, canvas.height - 36);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

// 2. Speaker Grille Texture with high-precision drilled micro-perforations
export function createSpeakerGrilleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Satin anodized aluminum background
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#d2d6da');
  bgGrad.addColorStop(0.5, '#dfe3e7');
  bgGrad.addColorStop(1, '#c8ccd0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Brushed metal micro-lines
  for (let i = 0; i < 800; i++) {
    const y = Math.random() * canvas.height;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.035)';
    ctx.fillRect(0, y, canvas.width, 1 + Math.random() * 2);
  }

  // Braun Logo in top-left
  const baseFont = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#151618';
  ctx.font = `bold 64px ${baseFont}`;
  ctx.textAlign = 'left';
  ctx.fillText('BRAUN', 48, 82);

  ctx.font = `600 18px ${baseFont}`;
  ctx.fillStyle = '#484b52';
  ctx.fillText('HI-FI ACOUSTIC 15W', 50, 114);

  // Full-coverage circular perforated hole grid
  const cols = 28;
  const rows = 24;
  const startX = 48;
  const startY = 145;
  const gridW = canvas.width - 96;
  const gridH = canvas.height - 185;
  const stepX = gridW / (cols - 1);
  const stepY = gridH / (rows - 1);
  const holeR = stepX * 0.33;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = startX + c * stepX;
      const cy = startY + r * stepY;

      // Bottom-right chamfer highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(cx + 0.9, cy + 0.9, holeR + 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Top-left shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(cx - 0.6, cy - 0.6, holeR, 0, Math.PI * 2);
      ctx.fill();

      // Deep dark cavity hole
      ctx.fillStyle = '#111214';
      ctx.beginPath();
      ctx.arc(cx, cy, holeR, 0, Math.PI * 2);
      ctx.fill();

      // Acoustic cloth texture dot inside hole
      ctx.fillStyle = '#1e2024';
      ctx.beginPath();
      ctx.arc(cx, cy, holeR * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

// 3. Analog Signal / Tuning VU Meter Face
export function createVUMeterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Warm circular parchment dial background
  const bgGrad = ctx.createRadialGradient(256, 360, 40, 256, 360, 250);
  bgGrad.addColorStop(0, '#ffffff');
  bgGrad.addColorStop(0.7, '#faf4e6');
  bgGrad.addColorStop(1, '#ebe2ce');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#b0a896';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 244, 0, Math.PI * 2);
  ctx.stroke();

  const baseFont = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

  // Title
  ctx.fillStyle = '#111214';
  ctx.font = `bold 26px ${baseFont}`;
  ctx.textAlign = 'center';
  ctx.fillText('SIGNAL / TUNING', 256, 75);

  ctx.font = `15px ${baseFont}`;
  ctx.fillStyle = '#555860';
  ctx.fillText('RF RELATIVE LEVEL', 256, 102);

  // Meter arc
  const cx = 256;
  const cy = 360;
  const r = 215;
  const startAng = Math.PI * 1.22;
  const endAng = Math.PI * 1.78;

  // Base black arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAng, endAng);
  ctx.strokeStyle = '#151618';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Peak orange sweet spot
  const sweetStart = startAng + (endAng - startAng) * 0.55;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 9, sweetStart, endAng);
  ctx.strokeStyle = '#ff5500';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Ticks
  const totalTicks = 11;
  for (let i = 0; i < totalTicks; i++) {
    const ang = startAng + (i / (totalTicks - 1)) * (endAng - startAng);
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const isMajor = i % 2 === 0;
    const tickLen = isMajor ? 20 : 12;

    ctx.beginPath();
    ctx.moveTo(cx + cos * r, cy + sin * r);
    ctx.lineTo(cx + cos * (r - tickLen), cy + sin * (r - tickLen));
    ctx.strokeStyle = '#151618';
    ctx.lineWidth = isMajor ? 3 : 1.8;
    ctx.stroke();

    if (isMajor) {
      const val = i;
      ctx.fillStyle = '#111214';
      ctx.font = `bold 22px ${baseFont}`;
      ctx.fillText(val.toString(), cx + cos * (r - 36), cy + sin * (r - 36) + 8);
    }
  }

  ctx.fillStyle = '#555860';
  ctx.font = `bold 18px ${baseFont}`;
  ctx.fillText('dB × 10', 256, 315);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

// 4. Control Panel Decals & Calibrated Scales
export function createControlPanelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');

  // Brushed aluminum panel background
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  bgGrad.addColorStop(0, '#d2d6da');
  bgGrad.addColorStop(0.5, '#dfe3e7');
  bgGrad.addColorStop(1, '#cbcfd3');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 1200; i++) {
    const y = Math.random() * canvas.height;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(0, y, canvas.width, 1 + Math.random() * 2);
  }

  const baseFont = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

  // Band push-button labels along top row
  const bands = ['FM (UKW)', 'AM (MW)', 'SW (KW)', 'AUX'];
  const bStartX = 510;
  const bSpacing = 345;
  const bY = 220;

  bands.forEach((b, idx) => {
    const bx = bStartX + idx * bSpacing;
    ctx.font = `bold 28px ${baseFont}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#151618';
    ctx.fillText(b, bx, bY);
  });

  // Power switch label
  ctx.font = `bold 28px ${baseFont}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#151618';
  ctx.fillText('POWER', 160, 480);
  ctx.font = `600 20px ${baseFont}`;
  ctx.fillStyle = '#555860';
  ctx.fillText('NETZ', 160, 512);

  // Volume & Tone scale dots
  const drawDialDots = (cx, cy, radius, steps, label, sublabel) => {
    const startAng = Math.PI * 0.75;
    const endAng = Math.PI * 2.25;

    ctx.fillStyle = '#151618';
    for (let i = 0; i <= steps; i++) {
      const ang = startAng + (i / steps) * (endAng - startAng);
      const x = cx + Math.cos(ang) * radius;
      const y = cy + Math.sin(ang) * radius;
      const isLarge = (i === 0 || i === steps || i === Math.floor(steps / 2));

      ctx.beginPath();
      ctx.arc(x, y, isLarge ? 6.5 : 4.0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = `bold 26px ${baseFont}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#151618';
    ctx.fillText(label, cx, cy + radius + 55);

    if (sublabel) {
      ctx.font = `600 20px ${baseFont}`;
      ctx.fillStyle = '#555860';
      ctx.fillText(sublabel, cx, cy + radius + 85);
    }
  };

  // Volume scale
  drawDialDots(680, 600, 160, 10, 'VOLUME', 'LAUTSTÄRKE');

  // Tone scale
  drawDialDots(1200, 600, 140, 8, 'TONE', 'KLANG');

  // Tuning Knob label
  ctx.font = `bold 30px ${baseFont}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#151618';
  ctx.fillText('TUNING', 1720, 840);
  ctx.font = `600 22px ${baseFont}`;
  ctx.fillStyle = '#555860';
  ctx.fillText('ABSTIMMUNG', 1720, 874);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

// 5. Brushed Metal Anisotropic Normal Map
export function createBrushedMetalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 3000; i++) {
    const y = Math.random() * canvas.height;
    const h = 1 + Math.random() * 2;
    const alpha = 0.03 + Math.random() * 0.05;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, y, canvas.width, h);

    const darkAlpha = 0.03 + Math.random() * 0.05;
    ctx.fillStyle = `rgba(0, 0, 0, ${darkAlpha})`;
    ctx.fillRect(0, y + h, canvas.width, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 6. Knob Knurl Normal Map
export function createKnurlNormalMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ridges = 48;
  const w = canvas.width / ridges;
  for (let i = 0; i < ridges; i++) {
    const x = i * w;
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#5080ff');
    grad.addColorStop(0.5, '#8080ff');
    grad.addColorStop(1, '#b080ff');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 7. Backplate Specification Label
export function createBackplateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1c1d20';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const baseFont = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

  // Perforated heat ventilation slots
  ctx.fillStyle = '#0f1012';
  const ventCols = 18;
  const ventRows = 6;
  const startX = 260;
  const startY = 140;
  const slotW = 75;
  const slotH = 10;
  const gapX = 85;
  const gapY = 28;

  for (let r = 0; r < ventRows; r++) {
    for (let c = 0; c < ventCols; c++) {
      const x = startX + c * gapX;
      const y = startY + r * gapY;
      ctx.beginPath();
      ctx.roundRect(x, y, slotW, slotH, 5);
      ctx.fill();
    }
  }

  // Vintage Aluminum Spec Plate
  ctx.fillStyle = '#dcdedc';
  ctx.fillRect(480, 460, 1088, 440);
  ctx.strokeStyle = '#7c8084';
  ctx.lineWidth = 4;
  ctx.strokeRect(490, 470, 1068, 420);

  ctx.fillStyle = '#111111';
  ctx.font = `bold 40px ${baseFont}`;
  ctx.textAlign = 'center';
  ctx.fillText('BRAUN AG  •  FRANKFURT AM MAIN', 1024, 540);

  ctx.font = `bold 24px ${baseFont}`;
  ctx.fillText('TYPE: RT 20 / HI-FI ALL-WAVE TRANSISTOR RECEIVER', 1024, 595);

  ctx.font = `500 20px ${baseFont}`;
  ctx.fillStyle = '#333333';
  ctx.fillText('220 V ~ 50/60 Hz  •  18 WATT  •  FUSE 0.2A T', 1024, 650);
  ctx.fillText('ANTENNA 75/300 OHM  •  DIN 41524 TAPE/PHONO INPUT', 1024, 695);

  ctx.font = `bold 24px ${baseFont}`;
  ctx.fillStyle = '#111111';
  ctx.fillText('MADE IN GERMANY', 1024, 765);

  ctx.font = `20px monospace`;
  ctx.fillStyle = '#555555';
  ctx.fillText('SERIAL NO. BR-1961-094182', 1024, 825);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
