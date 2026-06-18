/* ============================================================
   FUGLY TUNNEL SYSTEM
   Usage in main.js     replace the tunnel drawing block with:

     import { drawTunnel } from './tunnel.js';
     // inside draw(), before drawing the character:
     drawTunnel(this, t, state.tunnel);

   state.tunnel can be one of:
     'Rect'           original rectangle rings (current default)
     'HLines'         infinite horizontal lines rushing to vanishing pt
     'Grid'           full grid floor + ceiling
     'Vortex'         spinning radial lines
     'Matrix'         falling vertical strips
     'Neon'           solid colour-cycling neon rings
   ============================================================ */

//        SHARED                                                                                                                                                          
const DEFAULT_TUNNEL_COLS = [
  [165,164,207], [208,190,213], [235,237,169], [245,238,156],
  [199,204,216], [200,217,232], [231,195,218], [147,207,197],
];

function lerpCol(a, b, f) {
  return [
    Math.round(a[0]*(1-f)+b[0]*f),
    Math.round(a[1]*(1-f)+b[1]*f),
    Math.round(a[2]*(1-f)+b[2]*f),
  ];
}

function boostCol(col) {
  const avg = (col[0] + col[1] + col[2]) / 3;
  return [0, 1, 2].map(idx => {
    const v = avg + (col[idx] - avg) * 1.18 + 10;
    return Math.max(0, Math.min(255, Math.round(v)));
  });
}

function cycleCol(i, t, palette = DEFAULT_TUNNEL_COLS) {
  const cols = (palette && palette.length) ? palette : DEFAULT_TUNNEL_COLS;
  // Slightly brighter + a touch more saturated so the pastel tunnel pops on black.
  const cPhase = ((i*0.42 + t*0.10) % cols.length + cols.length) % cols.length;
  const ci = Math.floor(cPhase) % cols.length;
  const cn = (ci+1) % cols.length;
  return boostCol(lerpCol(cols[ci], cols[cn], cPhase - ci));
}

const Z_NEAR =  400;
const Z_FAR  = -3000;
const W_NEAR =  1100;
const H_NEAR =  1100;

const P5_CODE_LINES = [
  'function draw() {',
  '  background(0);',
  '  directionalLight(255, 240, 220, .3, -.8, -.3);',
  '  drawTunnel(this, t, state.tunnelStyle);',
  '  push(); translate(0, 20, 0);',
  '  scale(camera.zoom * 1.1);',
  '  rotateX(camera.rotX);',
  '  rotateY(camera.rotY);',
  '  drawBody(p);',
  '  drawLegs(p);',
  '  drawFace(p);',
  '  drawHat(p, state.hat);',
  '  drawKey(p);',
  '  pop();',
  '}',
  'const t = frameCount * 0.095;',
  'p.box(230, 210, 230);',
  'p.fill(...state.bodyColor);',
  'p.strokeWeight(1.2);',
  'requestAnimationFrame(render);',
];

let __codeWallTexture = null;
let __codeWallLastFrame = -1;
function drawCodeWallText(p, t, palette) {
  const cols = (palette && palette.length) ? palette : DEFAULT_TUNNEL_COLS;
  const TEX_W = 4096;
  const TEX_H = 2048;
  if (!__codeWallTexture || __codeWallTexture.width !== TEX_W) {
    __codeWallTexture = p.createGraphics(TEX_W, TEX_H);
  }
  const pg = __codeWallTexture;

  pg.clear();
  pg.textFont('monospace');
  pg.noStroke();

  const rows = 20;
  const lineH = TEX_H / rows;
  const scroll = t * 60 + 1200;

  const SECRET = 'FUGLYETH';
  const secretSet = new Set(SECRET.split(''));

  for (let lane = 0; lane < 8; lane++) {
    for (let r = 0; r < rows; r++) {
      const codeIdx = Math.abs((r * 3 + lane * 11) % P5_CODE_LINES.length);
      const line = P5_CODE_LINES[codeIdx];
      const c = cycleCol(r + lane * 3, t, cols);
      const yPos = lineH * (r + 0.5);

      const laneOffset = lane * 520 + ((r % 3) * 180);
      const rawX = scroll + laneOffset;
      const x = ((rawX % (TEX_W + 800)) + (TEX_W + 800)) % (TEX_W + 800) - 400;

      const fontSize = [32, 28, 36, 24, 32, 28, 36, 24][lane];
      pg.textAlign(pg.LEFT, pg.CENTER);
      const baseAlpha = [90, 70, 110, 60, 90, 70, 100, 65][lane];
      const charW = fontSize * 0.62;

      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci].toUpperCase();
        const cx = x + ci * charW;
        if (cx < -charW * 2 || cx > TEX_W + charW * 2) continue;

        if (secretSet.has(ch)) {
          const pulse = 0.6 + 0.4 * Math.sin(t * 4 + ci * 0.9 + r * 1.1);
          pg.fill(0, 255, 80, 70 * pulse);
          pg.textSize(fontSize + 4);
          pg.text(line[ci], cx, yPos);
          pg.fill(100, 255, 140, 180 + pulse * 60);
          pg.textSize(fontSize);
          pg.text(line[ci], cx, yPos);
        } else {
          pg.fill(c[0], c[1], c[2], baseAlpha);
          pg.textSize(fontSize);
          pg.text(line[ci], cx, yPos);
        }
      }

      // dense wrap copies
      pg.textSize(fontSize);
      pg.fill(c[0], c[1], c[2], baseAlpha * 0.7);
      pg.text(line, x - TEX_W - 400, yPos);
      pg.text(line, x + TEX_W + 400, yPos);
      pg.fill(c[0], c[1], c[2], baseAlpha * 0.5);
      pg.text(line, x - TEX_W * 0.6, yPos);
      pg.text(line, x + TEX_W * 0.6, yPos);
    }
  }

  // scan lines
  for (let y = 0; y < TEX_H; y += 80) {
    const c = cycleCol(y / 80, t, cols);
    pg.stroke(c[0], c[1], c[2], 18);
    pg.strokeWeight(1);
    pg.line(0, y, TEX_W, y);
  }

  function drawWall(side) {
    p.push();
    p.noStroke();
    p.noLights();
    p.texture(pg);
    p.textureMode(p.NORMAL);
    p.tint(255, 220);
    p.translate(side * (W_NEAR * 0.50 - 42), 0, -880);
    p.rotateY(side < 0 ? p.HALF_PI : -p.HALF_PI);
    p.plane(2500, H_NEAR * 0.92);
    p.noTint();
    p.pop();
  }

  function drawBackPanel() {
    p.push();
    p.noStroke();
    p.noLights();
    p.texture(pg);
    p.textureMode(p.NORMAL);
    p.tint(255, 80);
    p.translate(0, 0, Z_FAR + 380);
    p.plane(W_NEAR * 0.9, H_NEAR * 0.72);
    p.noTint();
    p.pop();
  }

  drawWall(-1);
  drawWall(1);
  drawBackPanel();
}
//        TUNNEL STYLES                                                                                                                                        

// Original rectangle rings
function drawRect(p, t, palette) {
  const SEGS = 46, SPEED = 0.018;
  const scroll = (t * SPEED) % 1.0;

  for (let i = 0; i < SEGS; i++) {
    const depth = (i/SEGS + scroll) % 1.0;
    const zPos  = p.lerp(Z_NEAR, Z_FAR, depth);
    const scale = 1.0 - depth * 0.96;
    const rW = W_NEAR * scale, rH = H_NEAR * scale;
    const fade  = Math.pow(1.0 - depth, 0.6);
    if (fade < 0.02) continue;

    const col   = cycleCol(i, t, palette);
    const alpha = Math.round(fade * 255);

    p.push();
    p.translate(0, 0, zPos);
    p.strokeWeight(p.lerp(3.4, 0.8, depth));
    p.stroke(col[0], col[1], col[2], alpha);
    p.line(-rW/2, -rH/2, 0,  rW/2, -rH/2, 0);
    p.line(-rW/2, -rH/2, 0, -rW/2,  rH/2, 0);
    p.line( rW/2, -rH/2, 0,  rW/2,  rH/2, 0);
    p.pop();
  }

  // Connector lines
  const CONN_DIV = 7;
  for (let fx = 0; fx <= CONN_DIV; fx++) {
    const xFrac = fx/CONN_DIV;
    const xNear = p.lerp(-W_NEAR/2, W_NEAR/2, xFrac);
    const xFar  = xNear * 0.04;
    const cc1 = cycleCol(fx + 1, t, palette);
    const cc2 = cycleCol(fx + 4, t, palette);
    p.stroke(cc1[0], cc1[1], cc1[2], 92); p.strokeWeight(1.1);
    p.line(xNear,  H_NEAR/2, Z_NEAR,  xFar,  H_NEAR*0.02, Z_FAR);
    p.stroke(cc2[0], cc2[1], cc2[2], 68);
    p.line(xNear, -H_NEAR/2, Z_NEAR,  xFar, -H_NEAR*0.02, Z_FAR);
  }
  const WALL_DIV = 5;
  for (let wy = 0; wy <= WALL_DIV; wy++) {
    const yFrac = wy/WALL_DIV;
    const yNear = p.lerp(-H_NEAR/2, H_NEAR/2, yFrac);
    const yFar  = yNear * 0.04;
    const wc = cycleCol(wy + 2, t, palette);
    p.stroke(wc[0], wc[1], wc[2], 76); p.strokeWeight(1.0);
    p.line(-W_NEAR/2, yNear, Z_NEAR,  -W_NEAR*0.02, yFar, Z_FAR);
    p.line( W_NEAR/2, yNear, Z_NEAR,   W_NEAR*0.02, yFar, Z_FAR);
  }

  // Draw last so the p5.js syntax is visible on top of the tunnel walls.
 // drawCodeWallText(p, t, palette);
}

//        HLINES     infinite horizontal lines                                                                      
// Many horizontal lines at varying Y positions, all scrolling
// toward the vanishing point     like an infinite flat grid seen
// from slightly above, plus top/bottom bands for depth.
function drawHLines(p, t, palette) {
  const LINES  = 32;   // how many horizontal lines
  const SPEED  = 0.022;
  const scroll = (t * SPEED) % 1.0;

  // Horizontal spread: lines run wall-to-wall in X
  // Y positions: distribute evenly across H_NEAR, scroll inward
  for (let i = 0; i < LINES; i++) {
    const depth = (i/LINES + scroll) % 1.0;
    const zPos  = p.lerp(Z_NEAR, Z_FAR, depth);
    const fade  = Math.pow(1.0 - depth, 0.55);
    if (fade < 0.015) continue;

    const scale = 1.0 - depth * 0.96;
    const rW = W_NEAR * scale;

    const col   = cycleCol(i, t, palette);
    const alpha = Math.round(fade * 255);
    const sw    = p.lerp(2.8, 0.3, depth);

    p.push();
    p.translate(0, 0, zPos);
    p.strokeWeight(sw);

    // Floor lines (bottom half)     Y goes from 0 down to H_NEAR/2
    const FLOOR_LINES = 14;
    for (let fi = 0; fi < FLOOR_LINES; fi++) {
      const yFrac = fi / (FLOOR_LINES - 1);
      const y = yFrac * (H_NEAR * scale * 0.5);
      const lineAlpha = Math.round(alpha * (1 - yFrac * 0.4));
      const lw = rW * p.lerp(1.0, 0.3, yFrac); // lines converge
      p.stroke(col[0], col[1], col[2], lineAlpha);
      p.line(-lw/2, y, 0,  lw/2, y, 0);
    }

    // Ceiling lines (top half)     mirror of floor
    const CEIL_LINES = 10;
    for (let ci2 = 0; ci2 < CEIL_LINES; ci2++) {
      const yFrac = ci2 / (CEIL_LINES - 1);
      const y = -yFrac * (H_NEAR * scale * 0.5);
      const lineAlpha = Math.round(alpha * (1 - yFrac * 0.6) * 0.7);
      const lw = rW * p.lerp(1.0, 0.2, yFrac);
      const cc = cycleCol(i + 2, t, palette);
      p.stroke(cc[0], cc[1], cc[2], lineAlpha);
      p.line(-lw/2, y, 0,  lw/2, y, 0);
    }

    p.pop();
  }

  // Vertical convergence lines (left + right walls only, subtle)
  const V_LINES = 12;
  for (let vi = 0; vi <= V_LINES; vi++) {
    const xFrac = vi / V_LINES;
    const xNear = p.lerp(-W_NEAR/2, W_NEAR/2, xFrac);
    const xFar  = xNear * 0.03;
    // floor
    const vc = cycleCol(vi + 2, t, palette);
    p.stroke(vc[0], vc[1], vc[2], 42); p.strokeWeight(0.7);
    p.line(xNear,  H_NEAR/2, Z_NEAR,  xFar,  H_NEAR*0.02, Z_FAR);
    // ceiling
    const vc2 = cycleCol(vi + 5, t, palette);
    p.stroke(vc2[0], vc2[1], vc2[2], 24); p.strokeWeight(0.5);
    p.line(xNear, -H_NEAR/2, Z_NEAR,  xFar, -H_NEAR*0.02, Z_FAR);
  }
}

//        GRID     floor/ceiling lines + convergence only                                     
function drawGrid(p, t, palette) {
  const SEGS = 28, SPEED = 0.016;
  const scroll = (t * SPEED) % 1.0;

  for (let i = 0; i < SEGS; i++) {
    const depth = (i/SEGS + scroll) % 1.0;
    const zPos  = p.lerp(Z_NEAR, Z_FAR, depth);
    const scale = 1.0 - depth * 0.96;
    const rW = W_NEAR * scale, rH = H_NEAR * scale;
    const fade  = Math.pow(1.0 - depth, 0.6);
    if (fade < 0.02) continue;
    const col   = cycleCol(i, t, palette);
    const alpha = Math.round(fade * 160);
    p.push(); p.translate(0, 0, zPos);
    p.strokeWeight(p.lerp(2.0, 0.3, depth));
    p.stroke(col[0], col[1], col[2], alpha);
    p.line(-rW/2,  rH/2, 0,  rW/2,  rH/2, 0);
    const cc = cycleCol(i+2, t, palette);
    p.stroke(cc[0], cc[1], cc[2], Math.round(alpha * 0.6));
    p.line(-rW/2, -rH/2, 0,  rW/2, -rH/2, 0);
    p.pop();
  }
  const COLS = 10;
  for (let fx = 0; fx <= COLS; fx++) {
    const xFrac = fx/COLS;
    const xNear = p.lerp(-W_NEAR/2, W_NEAR/2, xFrac);
    const xFar  = xNear * 0.04;
    const col   = cycleCol(fx, t, palette);
    p.stroke(col[0], col[1], col[2], 70); p.strokeWeight(1.0);
    p.line(xNear,  H_NEAR/2, Z_NEAR,  xFar,  H_NEAR*0.02, Z_FAR);
    p.stroke(col[0], col[1], col[2], 40); p.strokeWeight(0.6);
    p.line(xNear, -H_NEAR/2, Z_NEAR,  xFar, -H_NEAR*0.02, Z_FAR);
  }
  const ROWS = 6;
  for (let wy = 0; wy <= ROWS; wy++) {
    const yFrac = wy/ROWS;
    const yNear = p.lerp(-H_NEAR/2, H_NEAR/2, yFrac);
    const yFar  = yNear * 0.04;
    const col   = cycleCol(wy+3, t, palette);
    p.stroke(col[0], col[1], col[2], 50); p.strokeWeight(0.8);
    p.line(-W_NEAR/2, yNear, Z_NEAR,  -W_NEAR*0.02, yFar, Z_FAR);
    p.line( W_NEAR/2, yNear, Z_NEAR,   W_NEAR*0.02, yFar, Z_FAR);
  }


  // Draw last so the p5.js syntax is visible on top of the tunnel walls.
  drawCodeWallText(p, t, palette);
}
//        VORTEX     spinning radial lines from tunnel vanishing point    
function drawVortex(p, t, palette) {
  const SPOKES = 20, SPEED = 0.018;
  const scroll = (t * SPEED) % 1.0;
  const spin   = t * 0.35;

  // Draw spokes as lines FROM near edge TO vanishing point
  // Each spoke goes from a point on the near ring edge inward to Z_FAR
  for (let s = 0; s < SPOKES; s++) {
    const a = (s/SPOKES)*Math.PI*2 + spin;
    const col = cycleCol(s, t, palette);

    // Near endpoint     on the near ring perimeter
    const xNear = Math.cos(a) * (W_NEAR/2);
    const yNear = Math.sin(a) * (H_NEAR/2);

    // Far endpoint     converges toward center vanishing point
    const xFar = xNear * 0.02;
    const yFar = yNear * 0.02;

    // Fade along the line     bright near, dim far
    p.stroke(col[0], col[1], col[2], 180);
    p.strokeWeight(1.2);
    p.line(xNear, yNear, Z_NEAR,  xFar, yFar, Z_FAR);
  }

  // Secondary slower layer with different color phase
  const spin2 = -t * 0.2 + Math.PI/SPOKES;
  for (let s = 0; s < SPOKES; s++) {
    const a = (s/SPOKES)*Math.PI*2 + spin2;
    const col = cycleCol(s + 3, t, palette);
    const xNear = Math.cos(a) * (W_NEAR/2);
    const yNear = Math.sin(a) * (H_NEAR/2);
    const xFar  = xNear * 0.02;
    const yFar  = yNear * 0.02;
    p.stroke(col[0], col[1], col[2], 90);
    p.strokeWeight(0.6);
    p.line(xNear, yNear, Z_NEAR,  xFar, yFar, Z_FAR);
  }
}

//        MATRIX     falling vertical colour strips                                                          
function drawMatrix(p, t, palette) {
  const STRIPS = 22, SPEED = 0.025;
  const scroll = (t * SPEED) % 1.0;

  for (let i = 0; i < STRIPS; i++) {
    const depth = (i/STRIPS + scroll) % 1.0;
    const zPos  = p.lerp(Z_NEAR, Z_FAR, depth);
    const scale = 1.0 - depth * 0.96;
    const rW = W_NEAR * scale, rH = H_NEAR * scale;
    const fade  = Math.pow(1.0 - depth, 0.55);
    if (fade < 0.015) continue;

    const col   = cycleCol(i, t, palette);
    const alpha = Math.round(fade * 220);

    p.push(); p.translate(0, 0, zPos);
    p.strokeWeight(p.lerp(3, 0.4, depth));

    // Vertical strips
    const VCOLS = 14;
    for (let v = 0; v < VCOLS; v++) {
      const x = p.lerp(-rW/2, rW/2, v/(VCOLS-1));
      const vc = cycleCol(v + i, t, palette);
      p.stroke(vc[0], vc[1], vc[2], alpha);
      p.line(x, -rH/2, 0,  x, rH/2, 0);
    }
    p.pop();
  }

  // Horizontal convergence for grounding
  for (let fx = 0; fx <= 8; fx++) {
    const xFrac = fx/8;
    const xNear = p.lerp(-W_NEAR/2, W_NEAR/2, xFrac);
    const xFar  = xNear * 0.04;
    const fc = cycleCol(fx + 1, t, palette);
    p.stroke(fc[0], fc[1], fc[2], 35); p.strokeWeight(0.6);
    p.line(xNear, H_NEAR/2, Z_NEAR,  xFar, H_NEAR*0.02, Z_FAR);
  }
}

//        NEON     solid colour-cycling filled rings                                                       
function drawNeon(p, t, palette) {
  const SEGS = 40, SPEED = 0.02;
  const scroll = (t * SPEED) % 1.0;

  for (let i = 0; i < SEGS; i++) {
    const depth = (i/SEGS + scroll) % 1.0;
    const zPos  = p.lerp(Z_NEAR, Z_FAR, depth);
    const scale = 1.0 - depth * 0.96;
    const rW = W_NEAR * scale, rH = H_NEAR * scale;
    const fade  = Math.pow(1.0 - depth, 0.6);
    if (fade < 0.02) continue;

    const col   = cycleCol(i, t, palette);
    const alpha = Math.round(fade * 255);
    const sw    = p.lerp(4, 0.5, depth);

    p.push(); p.translate(0, 0, zPos);
    p.strokeWeight(sw);
    p.stroke(col[0], col[1], col[2], alpha);
    // Full rectangle ring
    p.line(-rW/2, -rH/2, 0,  rW/2, -rH/2, 0);
    p.line( rW/2, -rH/2, 0,  rW/2,  rH/2, 0);
    p.line( rW/2,  rH/2, 0, -rW/2,  rH/2, 0);
    p.line(-rW/2,  rH/2, 0, -rW/2, -rH/2, 0);
    // Inner ring (smaller, offset colour)
    const inner = 0.7;
    const ic = cycleCol(i + 2, t, palette);
    p.stroke(ic[0], ic[1], ic[2], Math.round(alpha * 0.6));
    p.strokeWeight(sw * 0.5);
    p.line(-rW*inner/2, -rH*inner/2, 0,  rW*inner/2, -rH*inner/2, 0);
    p.line( rW*inner/2, -rH*inner/2, 0,  rW*inner/2,  rH*inner/2, 0);
    p.line( rW*inner/2,  rH*inner/2, 0, -rW*inner/2,  rH*inner/2, 0);
    p.line(-rW*inner/2,  rH*inner/2, 0, -rW*inner/2, -rH*inner/2, 0);
    p.pop();
  }

  // Diagonal connectors
  for (let fx = 0; fx <= 6; fx++) {
    const xFrac = fx/6;
    const xNear = p.lerp(-W_NEAR/2, W_NEAR/2, xFrac);
    const xFar  = xNear * 0.04;
    const dc = cycleCol(fx, t, palette);
    p.stroke(dc[0], dc[1], dc[2], 40); p.strokeWeight(0.8);
    p.line(xNear,  H_NEAR/2, Z_NEAR,  xFar,  H_NEAR*0.02, Z_FAR);
    p.line(xNear, -H_NEAR/2, Z_NEAR,  xFar, -H_NEAR*0.02, Z_FAR);
  }
}



//        WARP     black/white speed tunnel like the reference screenshot                                  
function fract(v) { return v - Math.floor(v); }
function hash01(n) { return fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123); }

function tunnelPoint(side, u, depth, inset = 0) {
  const scale = 2.0 - depth * 0.965;
  const w = W_NEAR * scale;
  const h = H_NEAR * scale;
  let x = 0, y = 0;

  if (side === 0) {          // left wall
    x = -w / 2 + inset;
    y = (u - 0.5) * h;
  } else if (side === 1) {   // right wall
    x =  w / 2 - inset;
    y = (u - 0.5) * h;
  } else if (side === 2) {   // floor
    x = (u - 0.5) * w;
    y =  h / 2 - inset;
  } else {                   // ceiling
    x = (u - 0.5) * w;
    y = -h / 2 + inset;
  }
  return { x, y };
}

function drawWarp(p, t) {
  const FAR = -3900;
  const NEAR = 620;
  const SPEED = 0.043;

  // MORE / DENSER: 3 layers = long hyperspace rays + wall scratches + back-wall noise.
  const LONG_RAYS = 420;
  const WALL_SCRATCHES = 520;
  const BACK_SCRATCHES = 190;
  const SPARKS = 95;

  p.push();
  p.noFill();

  // Slight offset makes the tunnel feel like a corner/cube instead of a flat centered grid.
  p.translate(120, 4, 0);

  //        1) BIG hyperspace rays coming from near camera into the vanishing point       
  for (let i = 0; i < LONG_RAYS; i++) {
    const side = Math.floor(hash01(i + 3.0) * 4);
    const u = hash01(i + 11.0);
    const drift = (hash01(i + 61.0) - 0.5) * 0.035;
    const len = 0.105 + hash01(i + 21.0) * 0.285;
    const speed = SPEED * (0.65 + hash01(i + 41.0) * 2.35);
    const depthA = fract(hash01(i + 31.0) + t * speed);
    const depthB = Math.min(0.999, depthA + len);

    const inset = hash01(i + 51.0) * 24;
    const a = tunnelPoint(side, u, depthA, inset);
    const b = tunnelPoint(side, u + drift, depthB, inset * 0.35);
    const zA = p.lerp(NEAR, FAR, depthA);
    const zB = p.lerp(NEAR, FAR, depthB);

    const nearBoost = Math.pow(1.0 - depthA, 0.22);
    const alpha = 48 + nearBoost * 215;
    const sw = 0.45 + nearBoost * 1.7 + hash01(i + 81.0) * 0.7;
    const blue = hash01(i + 91.0) > 0.88;

    // glow pass
    p.strokeWeight(sw * 4.8);
    if (blue) p.stroke(0, 165, 255, alpha * 0.22);
    else      p.stroke(255, 255, 255, alpha * 0.10);
    p.line(a.x, a.y, zA, b.x, b.y, zB);

    // sharp core pass
    p.strokeWeight(sw);
    if (blue) p.stroke(75, 215, 255, alpha);
    else      p.stroke(238, 246, 255, alpha);
    p.line(a.x, a.y, zA, b.x, b.y, zB);
  }

  //        2) Dense short wall lines: makes it look PACKED like the screenshot       
  for (let i = 0; i < WALL_SCRATCHES; i++) {
    const side = Math.floor(hash01(i + 1003.0) * 4);
    const u = hash01(i + 1011.0);
    const len = 0.018 + hash01(i + 1021.0) * 0.075;
    const depthA = fract(hash01(i + 1031.0) + t * SPEED * (1.15 + hash01(i + 1041.0) * 3.4));
    const depthB = Math.min(0.999, depthA + len);
    const a = tunnelPoint(side, u, depthA, hash01(i + 1051.0) * 14);
    const b = tunnelPoint(side, u + (hash01(i + 1061.0) - 0.5) * 0.018, depthB, hash01(i + 1071.0) * 14);
    const zA = p.lerp(NEAR, FAR, depthA);
    const zB = p.lerp(NEAR, FAR, depthB);
    const fade = Math.pow(1.0 - depthA, 0.58);
    const blue = hash01(i + 1091.0) > 0.955;

    p.strokeWeight(0.35 + hash01(i + 1081.0) * 0.75);
    if (blue) p.stroke(45, 205, 255, 70 + fade * 145);
    else      p.stroke(225, 235, 245, 42 + fade * 135);
    p.line(a.x, a.y, zA, b.x, b.y, zB);
  }

  //        3) Repeating rectangular frames, subtle, to reveal the 3D tunnel body       
  const FRAME_COUNT = 18;
  const frameScroll = fract(t * SPEED * 1.05);
  for (let k = 0; k < FRAME_COUNT; k++) {
    const depth = fract(k / FRAME_COUNT + frameScroll);
    const z = p.lerp(NEAR, FAR, depth);
    const scale = 1.0 - depth * 0.965;
    const w = W_NEAR * scale;
    const h = H_NEAR * scale;
    const fade = Math.pow(1.0 - depth, 0.85);

    p.strokeWeight(0.55 + fade * 0.9);
    p.stroke(210, 230, 255, 16 + fade * 64);
    p.line(-w/2, -h/2, z,  w/2, -h/2, z);
    p.line( w/2, -h/2, z,  w/2,  h/2, z);
    p.line( w/2,  h/2, z, -w/2,  h/2, z);
    p.line(-w/2,  h/2, z, -w/2, -h/2, z);
  }

  //        4) Main glowing exit/corner frame       
  const frameDepth = 0.74 + Math.sin(t * 0.24) * 0.018;
  const z = p.lerp(NEAR, FAR, frameDepth);
  const scale = 1.0 - frameDepth * 0.965;
  const w = W_NEAR * scale;
  const h = H_NEAR * scale;

  for (const pass of [12, 7, 3.2, 1.15]) {
    const a = pass === 1.15 ? 245 : 38;
    p.strokeWeight(pass);
    p.stroke(105, 205, 255, a);
    p.line(-w/2, -h/2, z,  w/2, -h/2, z);
    p.line( w/2, -h/2, z,  w/2,  h/2, z);
    p.line( w/2,  h/2, z, -w/2,  h/2, z);
  }

  // Strong beams from camera corners to the bright frame.
  const edges = [
    [-W_NEAR/2,  H_NEAR/2, NEAR, -w/2,  h/2, z],
    [ W_NEAR/2,  H_NEAR/2, NEAR,  w/2,  h/2, z],
    [ W_NEAR/2, -H_NEAR/2, NEAR,  w/2, -h/2, z],
    [-W_NEAR/2, -H_NEAR/2, NEAR, -w/2, -h/2, z],
  ];
  for (const e of edges) {
    p.strokeWeight(10.0); p.stroke(50, 180, 255, 30);  p.line(...e);
    p.strokeWeight(3.0);  p.stroke(120, 220, 255, 70); p.line(...e);
    p.strokeWeight(0.95); p.stroke(245, 252, 255, 205); p.line(...e);
  }

  //        5) Back wall loaded with horizontal scratches / digital scan lines       
  for (let j = 0; j < BACK_SCRATCHES; j++) {
    const yy = p.lerp(-h/2, h/2, hash01(j + 300));
    const x1 = p.lerp(-w/2, w/2, hash01(j + 400));
    const x2 = x1 + (55 + hash01(j + 500) * 260) * (hash01(j + 600) > 0.5 ? 1 : -1);
    const a = 32 + hash01(j + 700) * 130;
    const blue = hash01(j + 705) > 0.91;
    p.strokeWeight(0.35 + hash01(j + 800) * 0.95);
    if (blue) p.stroke(70, 220, 255, a);
    else      p.stroke(230, 240, 255, a);
    p.line(x1, yy, z + 6, x2, yy + (hash01(j + 900) - 0.5) * 10, z + 6);
  }

  //        6) Tiny blue/white sparks close to vanishing point       
  for (let s = 0; s < SPARKS; s++) {
    const d = 0.63 + hash01(s + 1200) * 0.34;
    const pt = tunnelPoint(Math.floor(hash01(s + 1210) * 4), hash01(s + 1220), d, 2);
    const zz = p.lerp(NEAR, FAR, d);
    const pulse = 0.5 + 0.5 * Math.sin(t * (2.0 + hash01(s + 1230) * 5.0) + hash01(s + 1240) * 10);
    p.strokeWeight(1.0 + pulse * 2.5);
    if (hash01(s + 1250) > 0.55) p.stroke(70, 220, 255, 70 + pulse * 160);
    else                         p.stroke(255, 255, 255, 50 + pulse * 130);
    p.point(pt.x, pt.y, zz);
  }

  p.pop();
}
//        MAIN EXPORT                                                                                                                                              
export function drawTunnel(p, t, style = 'Rect', palette = DEFAULT_TUNNEL_COLS) {
  p.noFill();
  switch (style) {
    case 'HLines': drawHLines(p, t, palette); break;
    case 'Grid':   drawGrid(p, t, palette);   break;
    case 'Vortex': drawVortex(p, t, palette); break;
    case 'Matrix': drawMatrix(p, t, palette); break;
    case 'Neon':   drawNeon(p, t, palette);   break;
    case 'Warp':   drawWarp(p, t);             break;
    default:       drawRect(p, t, palette);   break;
  }
}

export const TUNNEL_STYLES = ['Rect', 'HLines', 'Grid', 'Vortex', 'Matrix', 'Neon', 'Warp'];