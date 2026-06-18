import { state } from '../state.js';

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
const tint = (col, amt) => col.map(v => clamp(v + amt));

function b(p, x, y, z, w, h, d, col) {
  p.push();
  p.translate(x, y, z);
  if (col) p.fill(...col);
  p.box(w, h, d);
  p.pop();
}

export function drawBody(p){
  const base = state.bodyColor;
  const dark = tint(base, -24);
  const darker = tint(base, -42);
  const light = tint(base, 16);
  const light2 = tint(base, 28);

  p.push();
  p.noStroke();

  // main cube
  p.fill(...base);
  p.box(230,210,230);

  // front panel / bezel for more metaPXL-style structure
  b(p, 0, 4, 108, 208, 184, 8, dark);
  b(p, 0, 4, 113, 186, 162, 3, base);

  // top cap / forehead band support
  b(p, 0, -88, 96, 226, 12, 24, light);
  b(p, 0, -100, 0, 210, 10, 210, light2);

  // lower chin panel
  b(p, 0, 82, 97, 188, 22, 12, darker);
  b(p, 0, 70, 111, 124, 14, 4, light);

  // side accents for more depth
  b(p, -108, 0, 0, 8, 178, 190, darker);
  b(p,  108, 0, 0, 8, 178, 190, darker);
  b(p, -100, -72, 94, 18, 28, 10, light2);
  b(p,  100, -72, 94, 18, 28, 10, light2);

  // subtle bottom feet mount / shadow mass
  b(p, 0, 98, -10, 190, 12, 170, darker);

  p.pop();
}
