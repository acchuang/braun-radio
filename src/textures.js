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

// 8. Authentic Scandinavian Ash / Teak Wood Grain Texture for RT 20 Sides
export function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Base warm blonde ash wood tone
  const baseGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  baseGrad.addColorStop(0, '#cbb28b');
  baseGrad.addColorStop(0.25, '#d6be97');
  baseGrad.addColorStop(0.5, '#ceb58d');
  baseGrad.addColorStop(0.75, '#debfa0');
  baseGrad.addColorStop(1, '#cbb28b');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle organic growth rings and wavy grain
  for (let i = 0; i < 90; i++) {
    const yCenter = (i / 90) * canvas.height;
    ctx.beginPath();
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(125, 95, 60, 0.16)' : 'rgba(150, 115, 75, 0.08)';
    ctx.lineWidth = 1.5 + Math.sin(i * 0.7) * 1.0;

    ctx.moveTo(0, yCenter);
    for (let x = 0; x <= canvas.width; x += 32) {
      const wave = Math.sin(x * 0.005 + i * 0.4) * 8 + Math.sin(x * 0.015) * 4;
      ctx.lineTo(x, yCenter + wave);
    }
    ctx.stroke();
  }

  // Fine microscopic wood pores / tracheid fibers
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      // High-frequency subtle fibrous noise
      const noise = (Math.random() - 0.5) * 16;
      data[idx] = Math.min(255, Math.max(0, data[idx] + noise));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + noise * 0.9));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + noise * 0.7));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 9. Lexon Tykho Rubber Texture (Micro-stippled silicone elastomer)
export function createTykhoRubberTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Subtle silicone micro-roughness
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, 128 + noise));
    data[i + 1] = Math.min(255, Math.max(0, 128 + noise));
    data[i + 2] = 255; // normal map z
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 10. Lexon Tykho Front Details (Speaker perforation dimples & branding)
export function createTykhoFrontTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Left half: Circular array of molded speaker dimples in silicone
  const centerX = 260;
  const centerY = 256;
  const rings = 8;
  for (let r = 1; r <= rings; r++) {
    const radius = r * 24;
    const count = Math.floor(r * 6.2);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Dimpled shadow and highlight
      ctx.beginPath();
      ctx.arc(x, y + 1.2, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // lower specular highlight
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)'; // deep dimple hole
      ctx.fill();
    }
  }

  // Right half branding: "LEXON" in clean geometric sans
  ctx.textAlign = 'left';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillText('LEXON', 580, 420);

  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillText('TYKHO • DESIGN MARC BERTHIER', 580, 448);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 11. Lexon Tykho Minimalist Backlit LCD Frequency Window
export function createTykhoLcdTexture(freq = 89.5, band = 'FM', isPower = true) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // LCD panel background
  if (isPower) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#a4c9ad');
    grad.addColorStop(1, '#8eb899');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = '#424d45';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bezel inner shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  if (isPower) {
    // LCD Segments
    ctx.fillStyle = '#17261a';
    ctx.textAlign = 'right';
    ctx.font = 'bold 88px "Courier New", Courier, monospace';
    ctx.fillText(freq.toFixed(1), canvas.width - 60, 160);

    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(band, 50, 90);

    ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(band === 'FM' ? 'MHz' : 'kHz', 50, 130);

    // Battery / signal icon
    ctx.fillStyle = '#17261a';
    ctx.fillRect(50, 170, 24, 12);
    ctx.fillRect(78, 165, 8, 17);
    ctx.fillRect(90, 160, 8, 22);
    ctx.fillRect(102, 155, 8, 27);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 12. Tivoli Audio Model One Circular 5:1 Planetary Tuning Dial Scale
export function createTivoliDialTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Background: Warm ivory disc
  ctx.fillStyle = '#faf8f3';
  ctx.beginPath();
  ctx.arc(cx, cy, cx - 10, 0, Math.PI * 2);
  ctx.fill();

  // Subtle circular hairline borders
  ctx.strokeStyle = '#323438';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, cx - 18, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, cx - 90, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, cx - 170, 0, Math.PI * 2);
  ctx.stroke();

  const font = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif';

  // --- Outer Arc: FM 88 to 108 MHz ---
  // The scale sweeps from approx 200 deg around to 340 deg (or 260 deg arc)
  const startAngle = 0.85 * Math.PI; // bottom left
  const endAngle = 2.15 * Math.PI;   // bottom right
  const totalArc = endAngle - startAngle;

  const fmMin = 88;
  const fmMax = 108;
  for (let f = fmMin; f <= fmMax; f += 0.5) {
    const t = (f - fmMin) / (fmMax - fmMin);
    const angle = startAngle + t * totalArc;
    const isMajor = Math.abs(f - Math.round(f)) < 0.01 && f % 2 === 0;
    const isHalf = Math.abs(f - Math.round(f)) < 0.01;

    const rOuter = cx - 20;
    const rInner = isMajor ? cx - 65 : (isHalf ? cx - 50 : cx - 35);

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
    ctx.lineTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
    ctx.strokeStyle = isMajor ? '#111214' : '#45484e';
    ctx.lineWidth = isMajor ? 3.5 : (isHalf ? 2.2 : 1.4);
    ctx.stroke();

    if (isMajor) {
      const textR = cx - 80;
      const tx = cx + Math.cos(angle) * textR;
      const ty = cy + Math.sin(angle) * textR;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = '#111214';
      ctx.font = `bold 28px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.toString(), 0, 0);
      ctx.restore();
    }
  }

  // --- Inner Arc: AM 550 to 1600 kHz ---
  const amMin = 550;
  const amMax = 1600;
  const amSteps = [550, 600, 700, 800, 1000, 1200, 1400, 1600];
  amSteps.forEach(f => {
    const t = (f - amMin) / (amMax - amMin);
    const angle = startAngle + t * totalArc;
    const rOuter = cx - 92;
    const rInner = cx - 130;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
    ctx.lineTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
    ctx.strokeStyle = '#8a4b2a'; // classic amber/ochre AM color
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const textR = cx - 146;
    const tx = cx + Math.cos(angle) * textR;
    const ty = cy + Math.sin(angle) * textR;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = '#8a4b2a';
    ctx.font = `bold 22px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f >= 1000 ? (f / 100).toFixed(0) : f.toString(), 0, 0);
    ctx.restore();
  });

  // Center Knob Hub
  const hubGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, cx - 170);
  hubGrad.addColorStop(0, '#ffffff');
  hubGrad.addColorStop(0.7, '#ece8df');
  hubGrad.addColorStop(1, '#d8d2c4');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, cx - 172, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#c4bcb0';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Pointer indicator notch on center hub
  ctx.fillStyle = '#1c1e22';
  ctx.beginPath();
  ctx.arc(cx, cy - (cx - 200), 7, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 13. Tivoli Model One Faceplate Markings Texture
export function createTivoliFaceplateTexture(theme = 'walnut') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Background tone based on theme
  let bg = '#ebe5d8'; // Classic warm cream taupe for Walnut
  let textColor = '#2a2c30';
  let amberColor = '#c7681c';

  if (theme === 'cherry') {
    bg = '#324a6e'; // Iconic cobalt blue faceplate with cherry wood
    textColor = '#f2f4f8';
    amberColor = '#f59e0b';
  } else if (theme === 'black-ash') {
    bg = '#d6d9de'; // Silver anodized aluminum
    textColor = '#18191c';
    amberColor = '#d97706';
  } else if (theme === 'white') {
    bg = '#f5f7fa';
    textColor = '#222326';
    amberColor = '#ea580c';
  }

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const font = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

  // Top Center Brand Title
  ctx.textAlign = 'center';
  ctx.fillStyle = textColor;
  ctx.font = `bold 28px ${font}`;
  ctx.fillText('Tivoli Audio', 720, 60);

  ctx.font = `600 14px ${font}`;
  ctx.fillStyle = theme === 'cherry' ? '#ccd5e2' : '#6b7079';
  ctx.fillText('MODEL ONE • HENRY KLOSS', 720, 84);

  // Dial top index needle / marker
  ctx.fillStyle = '#c73826'; // Red/orange index line
  ctx.fillRect(718, 102, 4, 18);

  // Tuning LED label
  ctx.font = `bold 12px ${font}`;
  ctx.fillStyle = theme === 'cherry' ? '#fcd34d' : amberColor;
  ctx.fillText('TUNING', 890, 180);

  // Source Selector Knob labels
  const sourceX = 830;
  const sourceY = 380;
  ctx.font = `600 14px ${font}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.fillText('OFF', sourceX - 45, sourceY - 35);
  ctx.fillText('FM', sourceX + 45, sourceY - 35);
  ctx.fillText('AM', sourceX + 55, sourceY + 15);
  ctx.fillText('AUX', sourceX - 50, sourceY + 15);

  // Volume knob label
  const volX = 610;
  const volY = 380;
  ctx.fillText('VOLUME', volX, volY + 55);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 14. Tivoli Wood Grain Variations (Walnut, Cherry, Black Ash)
export function createTivoliWoodTexture(type = 'walnut') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  let baseStart = '#5a3821';
  let baseMid = '#6c4328';
  let baseEnd = '#4d2e1a';
  let ringColor1 = 'rgba(40, 20, 10, 0.22)';
  let ringColor2 = 'rgba(75, 42, 22, 0.12)';

  if (type === 'cherry') {
    baseStart = '#7e351d';
    baseMid = '#943e22';
    baseEnd = '#662814';
    ringColor1 = 'rgba(60, 18, 8, 0.22)';
    ringColor2 = 'rgba(110, 40, 20, 0.12)';
  } else if (type === 'black-ash') {
    baseStart = '#242528';
    baseMid = '#2e3034';
    baseEnd = '#1c1d1f';
    ringColor1 = 'rgba(12, 12, 14, 0.45)';
    ringColor2 = 'rgba(45, 46, 50, 0.25)';
  }

  const baseGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  baseGrad.addColorStop(0, baseStart);
  baseGrad.addColorStop(0.3, baseMid);
  baseGrad.addColorStop(0.7, baseStart);
  baseGrad.addColorStop(1, baseEnd);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Wood Grain growth waves
  for (let i = 0; i < 110; i++) {
    const yCenter = (i / 110) * canvas.height;
    ctx.beginPath();
    ctx.strokeStyle = i % 2 === 0 ? ringColor1 : ringColor2;
    ctx.lineWidth = 1.6 + Math.sin(i * 0.5) * 1.2;

    ctx.moveTo(0, yCenter);
    for (let x = 0; x <= canvas.width; x += 24) {
      const wave = Math.sin(x * 0.006 + i * 0.35) * 12 + Math.sin(x * 0.02) * 3;
      ctx.lineTo(x, yCenter + wave);
    }
    ctx.stroke();
  }

  // Microscopic wood pores
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const noise = (Math.random() - 0.5) * 14;
      data[idx] = Math.min(255, Math.max(0, data[idx] + noise));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + noise * 0.85));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + noise * 0.7));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 15. Tivoli Speaker Grille Texture (Fine acoustic metal mesh)
export function createTivoliSpeakerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#222428';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Micro-perforated mesh
  const holeRadius = 2.2;
  const spacing = 7.5;
  for (let y = 0; y < canvas.height; y += spacing) {
    const isOdd = Math.floor(y / spacing) % 2 === 1;
    const xOffset = isOdd ? spacing / 2 : 0;
    for (let x = xOffset; x < canvas.width; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, holeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0b0d';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + 0.6, y + 0.6, holeRadius * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

