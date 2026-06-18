import { state } from '../state.js';

// Global tuning for chunky mouths
const MOUTH = {
  yBase: 55,
  lipDepth: 4,
  blockZ: 1,
  lipScale: 1.05,
  toothZ: 1,
  cavityZ: 10,
  dark: [20, 20, 25],
};

function slab(p, x, y, z, w, h, d) {
  p.push();
  p.translate(x, y, z);
  p.box(w, h, d);
  p.pop();
}

export function drawMouth(p){
  switch(state.mouthStyle){
    case 'SmileArc':   return mouthSmileArc(p);
    case 'Flat':       return mouthFlat(p);
    case 'Open':       return mouthOpen(p);
    case 'Toothy':     return mouthToothy(p);
    case 'Frown':      return mouthFrown(p);
    case 'PixelGrin':  return mouthPixelGrin(p);
    case 'GoldBar':    return mouthGoldBar(p);
    case 'TongueDrop': return mouthTongueDrop(p);
    case 'Beak':       return mouthBeak(p);
    case 'Underbite':  return mouthUnderbite(p);
    default:           return mouthSmileArc(p);
  }
}

// --- Smile arc ---
function mouthSmileArc(p){
  p.push();
  p.translate(0, MOUTH.yBase, 0);
  p.fill(...state.mouthColor);

  const Rw = 62 * MOUTH.lipScale;
  const Rh = 36 * MOUTH.lipScale;
  const bx = 14, by = 16, bz = MOUTH.blockZ;

  for (let a = -0.85; a <= 0.85; a += 0.05) {
    const x = Math.sin(a) * Rw;
    const y = -Math.cos(a) * Rh + Rh;
    slab(p, x, y, 0, bx, by, bz);
  }
  p.pop();
}

// --- Flat mouth ---
function mouthFlat(p){
  p.push();
  p.translate(0, MOUTH.yBase - 2, 0);
  p.fill(...state.mouthColor);

  const half = 44 * MOUTH.lipScale;
  const step = 14;
  const bx = 14, by = 12, bz = MOUTH.blockZ;

  for (let x = -half; x <= half; x += step){
    slab(p, x, 0, 0, bx, by, bz);
  }
  p.pop();
}

// --- Open mouth (big cavity + tongue) ---
function mouthOpen(p){
  p.push();
  p.translate(0, MOUTH.yBase + 4, 0);

  const W = 140 * (MOUTH.lipScale * 0.95);
  const H = 60 * (MOUTH.lipScale * 0.95);

  p.fill(...state.mouthColor);
  p.box(W, H, MOUTH.lipDepth);

  const inset = 22;
  p.fill(...MOUTH.dark);
  slab(p, 0, 2, 2, W - inset*2, H - inset*2, MOUTH.cavityZ);

  p.fill(...state.tongueColor);
  slab(p, 0, H*0.20, 18, W - inset*3.2, 16, 10);

  p.fill(...state.mouthColor);
  slab(p, 0, H/2 - 6, 0, W * 0.9, 8, MOUTH.lipDepth);

  p.pop();
}

// --- Toothy grin ---
function mouthToothy(p){
  p.push();
  p.translate(0, MOUTH.yBase, 0);

  p.fill(...state.mouthColor);
  const half = 44 * MOUTH.lipScale;
  const step = 14;
  for (let x = -half; x <= half; x += step){
    slab(p, x, 0, 0, 14, 12, MOUTH.blockZ);
  }

  p.fill(...state.teethColor);
  for (let x = -half + 10; x <= half - 10; x += 22){
    slab(p, x, 12, 2, 12, 16, MOUTH.toothZ);
  }
  for (let x = -half + 20; x <= half - 20; x += 22){
    slab(p, x, -10, 2, 10, 12, MOUTH.toothZ);
  }

  p.pop();
}

// --- Frown ---
function mouthFrown(p){
  p.push();
  p.translate(0, MOUTH.yBase - 5, 0);
  p.fill(...state.mouthColor);

  const Rw = 52 * MOUTH.lipScale;
  const Rh = 18 * MOUTH.lipScale;
  const bx = 34, by = 16, bz = MOUTH.blockZ;

  for (let a = -0.85; a <= 0.85; a += 0.05) {
    const x = Math.sin(a) * Rw;
    const y = Math.cos(a) * Rh - 12;
    slab(p, x, y, 0, bx, by, bz);
  }
  p.pop();
}

// --- Pixel grin ---
function mouthPixelGrin(p){
  p.push();
  p.translate(0, MOUTH.yBase, 0);
  p.fill(...state.mouthColor);

  const half = 44 * MOUTH.lipScale;
  const step = 14;
  const bx = 14, by = 12, bz = MOUTH.blockZ;
  const pattern = [-2,0,2,0,-2,0,2,0,-2,0,2];
  let i = 0;

  for (let x = -half; x <= half; x += step){
    const yOff = pattern[i % pattern.length] * 3;
    slab(p, x, yOff, 0, bx, by, bz);
    i++;
  }
  p.pop();
}

// --- Gold bar / plate mouth (inspired by reference collection) ---
function mouthGoldBar(p){
  p.push();
  p.translate(0, MOUTH.yBase + 8, 0);

  p.fill(...state.mouthColor);
  slab(p, 0, 0, 0, 100, 34, MOUTH.lipDepth);

  p.fill(...MOUTH.dark);
  slab(p, 0, -2, 2, 74, 12, MOUTH.cavityZ);

  p.fill(...state.teethColor);
  slab(p, 0, 7, 3, 62, 8, MOUTH.toothZ);

  p.fill(...state.mouthColor);
  slab(p, 0, 15, 0, 84, 8, MOUTH.lipDepth);

  p.pop();
}

// --- Hanging tongue / drool mouth ---
function mouthTongueDrop(p){
  p.push();
  p.translate(0, MOUTH.yBase + 2, 0);

  p.fill(...state.mouthColor);
  slab(p, 0, 0, 0, 90, 26, MOUTH.lipDepth);

  p.fill(...MOUTH.dark);
  slab(p, 0, -1, 2, 66, 10, MOUTH.cavityZ);

  p.fill(...state.tongueColor);
  slab(p, 0, 15, 6, 26, 18, 8);
  slab(p, 0, 30, 6, 14, 12, 8);

  p.fill(...state.teethColor);
  slab(p, -18, 2, 3, 10, 8, MOUTH.toothZ);
  slab(p, 18, 2, 3, 10, 8, MOUTH.toothZ);

  p.pop();
}

// --- Pixel beak / waffle mouth ---
function mouthBeak(p){
  p.push();
  p.translate(0, MOUTH.yBase + 3, 0);
  p.fill(...state.mouthColor);

  const rows = [5, 4, 3, 2, 1];
  const stepX = 16;
  const stepY = 14;

  rows.forEach((count, row) => {
    const y = row * stepY;
    const offset = ((count - 1) * stepX) / 2;
    for (let i = 0; i < count; i++) {
      const x = i * stepX - offset;
      slab(p, x, y, 0, 14, 12, MOUTH.blockZ);
    }
  });

  p.fill(...state.teethColor);
  slab(p, 0, -2, 2, 52, 10, MOUTH.toothZ);
  p.pop();
}

// --- Thick underbite with visible teeth ---
function mouthUnderbite(p){
  p.push();
  p.translate(0, MOUTH.yBase + 8, 0);

  p.fill(...state.teethColor);
  for (let x = -30; x <= 30; x += 15) {
    slab(p, x, -10, 2, 12, 14, MOUTH.toothZ);
  }

  p.fill(...state.mouthColor);
  slab(p, 0, 4, 0, 84, 18, MOUTH.lipDepth);
  slab(p, 0, 18, 0, 106, 16, MOUTH.lipDepth);

  p.fill(...MOUTH.dark);
  slab(p, 0, 4, 2, 60, 8, MOUTH.cavityZ);

  p.fill(...state.tongueColor);
  slab(p, 0, 24, 4, 40, 8, 6);

  p.pop();
}
