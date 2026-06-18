
export function mulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function getSeed() {
  const m = /[?&]seed=(\d+)/.exec(location.search);
  return m ? parseInt(m[1], 10) : 2323;
}

export const clamp255 = v => Math.max(0, Math.min(255, Math.round(v)));
export const randRange = (rng, min, max) => min + rng() * (max - min);
export const randInt   = (rng, n) => Math.floor(rng() * n);
export const pick      = (rng, arr) => arr[randInt(rng, arr.length)];

export function randColor(rng, min=0, max=255) {
  return [
    clamp255(randRange(rng, min, max)),
    clamp255(randRange(rng, min, max)),
    clamp255(randRange(rng, min, max))
  ];
}

export function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [245, 235, 220];
  return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
}

export function rgbToHex([r,g,b]) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}
