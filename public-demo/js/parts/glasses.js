import { state } from '../state.js';

function b(p, x, y, z, w, h, d) {
  p.push();
  p.translate(x|0, y|0, z|0);
  p.box(w|0, h|0, d|0);
  p.pop();
}
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
function lensColor(p) {
  const [r,g,bl]=state.lensColor;
  // Keep semi-transparent lenses important, but avoid extra glint blocks/dots.
  const alpha = clamp((state.lensAlpha ?? 0.55) * 255);
  p.fill(clamp(r + 12), clamp(g + 12), clamp(bl + 14), alpha);
}
function frameColor(p) { p.fill(...state.frameColor); }

function arms(p, hingeX, armH=16, armD=56) {
  frameColor(p);
  const armX = hingeX + 2;
  const endZ = -(18 + armD / 2 + 10);

  // front hinge blocks so the side arms always read from the front angle
  b(p, -armX, 0, 4, 10, armH + 2, 10);
  b(p,  armX, 0, 4, 10, armH + 2, 10);

  // temple arms: shorter and slightly more forward so they don't disappear inside the cube
  b(p, -(armX + 2), 0, -18, 10, armH, armD);
  b(p,  (armX + 2), 0, -18, 10, armH, armD);

  // back tip / ear hook block
  b(p, -(armX + 4), 0, endZ, 8, Math.max(8, armH - 4), 18);
  b(p,  (armX + 4), 0, endZ, 8, Math.max(8, armH - 4), 18);
}

//        STANDARD                                                                                                                                                    
function squareFrame(p) {
  const lW=80, lH=70, thick=16, cx=75;
  frameColor(p);
  b(p,-cx,-(lH/2+thick/2),0, lW+thick*2,thick,thick);
  b(p,-cx, (lH/2+thick/2),0, lW+thick*2,thick,thick);
  b(p,-cx-lW/2-thick/2,0,0,  thick,lH+thick*2,thick);
  b(p,-cx+lW/2+thick/2,0,0,  thick,lH+thick*2,thick);
  b(p, cx,-(lH/2+thick/2),0, lW+thick*2,thick,thick);
  b(p, cx, (lH/2+thick/2),0, lW+thick*2,thick,thick);
  b(p, cx-lW/2-thick/2,0,0,  thick,lH+thick*2,thick);
  b(p, cx+lW/2+thick/2,0,0,  thick,lH+thick*2,thick);
  // Slight overlap avoids visible micro-gaps between the bridge and the inner frame edges.
  b(p,0,0,0, (cx-lW/2-thick/2)*2+8,thick,thick);
  lensColor(p);
  b(p,-cx,0,0, lW,lH,thick-2);
  b(p, cx,0,0, lW,lH,thick-2);
  arms(p, cx+lW/2+thick, thick);
}

function roundFrame(p) {
  const lW=80, lH=70, thick=16, cx=75, cut=14;
  for (const sx of [-1,1]) {
    const ox=sx*cx;
    frameColor(p);
    b(p,ox,-(lH/2+thick/2),0, lW-cut,thick,thick);
    b(p,ox, (lH/2+thick/2),0, lW-cut,thick,thick);
    b(p,ox-lW/2-thick/2,0,0,  thick,lH-cut,thick);
    b(p,ox+lW/2+thick/2,0,0,  thick,lH-cut,thick);
    for(const[qx,qy]of[[-1,-1],[-1,1],[1,-1],[1,1]])
      b(p,ox+qx*(lW/2-cut/2+thick/2),qy*(lH/2-cut/2+thick/2),0,cut+thick,cut+thick,thick);
    lensColor(p);
    b(p,ox,0,0, lW,lH,thick-2);
  }
  frameColor(p);
  b(p,0,0,0, (cx-lW/2-thick/2)*2+8,thick,thick);
  arms(p, cx+lW/2+thick, thick);
}

function visorBar(p) {
  const span=210, h=56, thick=16;
  frameColor(p);
  b(p,0,-(h/2+thick/2),0, span+thick*2,thick,thick);
  b(p,0, (h/2+thick/2),0, span+thick*2,thick,thick);
  b(p,-(span/2+thick/2),0,0, thick,h+thick*2,thick);
  b(p, (span/2+thick/2),0,0, thick,h+thick*2,thick);
  lensColor(p);
  b(p,0,0,0, span,h,thick-2);
  frameColor(p);
  b(p,0,0,0, thick,h,thick-6);
  arms(p, span/2+thick, thick);
}

function shield(p) {
  const span=220, h=74, thick=16;
  frameColor(p);
  b(p,0,-(h/2+thick/2),0, span,thick,thick);
  b(p,0, (h/2+thick/2),0, span,thick,thick);
  b(p,-(span/2+thick/2),0,0, thick,h+thick*2,thick);
  b(p, (span/2+thick/2),0,0, thick,h+thick*2,thick);
  lensColor(p);
  b(p,0,0,0, span,h,thick-2);
  const[r,g,bl]=state.lensColor; p.fill(r,g,bl,80);
  b(p,0,-8,0, span-10,10,thick-4);
  arms(p, span/2+thick, thick);
}

function bandit(p) {
  const span=220, h=60, thick=16;
  frameColor(p);
  b(p,0,-(h/2+thick/2),0, span,thick,thick);
  b(p,0, (h/2+thick/2),0, span,thick,thick);
  b(p,-(span/2+thick/2),0,0, thick,h+thick*2,thick);
  b(p, (span/2+thick/2),0,0, thick,h+thick*2,thick);
  lensColor(p);
  b(p,0,0,0, span,h,thick-2);
  frameColor(p);
  b(p,0,h/2-8,0, 28,14,thick);
  arms(p, span/2+thick, thick);
}

function mono(p) {
  const lW=170, lH=60, thick=16;
  frameColor(p);
  b(p,0,-(lH/2+thick/2),0, lW+thick*2,thick,thick);
  b(p,0, (lH/2+thick/2),0, lW+thick*2,thick,thick);
  b(p,-(lW/2+thick/2),0,0, thick,lH+thick*2,thick);
  b(p, (lW/2+thick/2),0,0, thick,lH+thick*2,thick);
  lensColor(p);
  b(p,0,0,0, lW,lH,thick-2);
  arms(p, lW/2+thick, thick);
}

function wrap(p) {
  const lW=80, lH=70, thick=16, cx=75;
  for(const sx of[-1,1]){
    const ox=sx*cx;
    frameColor(p);
    b(p,ox,-(lH/2+thick/2),0, lW+thick*2,thick,thick);
    b(p,ox, (lH/2+thick/2),0, lW+thick*2,thick,thick);
    b(p,ox-lW/2-thick/2,0,0,  thick,lH+thick*2,thick);
    b(p,ox+lW/2+thick/2,0,0,  thick,lH+thick*2,thick);
    lensColor(p);
    b(p,ox,0,0, lW,lH,thick-2);
  }
  frameColor(p);
  b(p,0,0,0, (cx-lW/2-thick/2)*2+8,thick,thick);
  const hx=cx+lW/2+thick;
  // chunky side shields
  b(p,-(hx+8),0,-8, 24,thick+6,18);
  b(p, (hx+8),0,-8, 24,thick+6,18);
  arms(p, hx, thick+2, 48);
}

function spiked(p) {
  squareFrame(p);
  const lW=80, thick=16, cx=75;
  const span=cx+lW/2+thick*2+20;
  const topY=-(70/2+thick+thick/2)-2;
  frameColor(p);
  b(p,0,topY,0, span*2,thick+2,thick);
  for(const sx of[-80,-40,0,40,80]){
    b(p,sx,topY-12,0, 12,22,12);
    b(p,sx,topY-22,0,  8,10, 8);
  }
}

//        PORTED     scaled to fill the face                                                                            
function hollowSquare(p, fc, rotated=false) {
  const W=86, H=80, thick=16, cx=70;
  for(const sx of[-1,1]){
    const ox=sx*cx;
    p.push(); p.translate(ox,0,0);
    if(rotated) p.rotateZ(Math.PI/4);
    p.fill(...fc);
    b(p,0,-H/2,0, W,thick,thick);
    b(p,0, H/2,0, W,thick,thick);
    b(p,-W/2,0,0, thick,H,thick);
    b(p, W/2,0,0, thick,H,thick);
    lensColor(p);
    b(p,0,0,2, W-thick*2,H-thick*2,thick-4);
    p.pop();
  }
  p.fill(...fc);
  b(p,0,0,0, cx*2-W+8,thick,thick);
  arms(p, cx+W/2+2, thick);
}

function vrVisor(p, variant) {
  let lc,gc;
  if     (variant==='VRGreen') {lc=[0,255,0,180];  gc=[50,255,50,100];}
  else if(variant==='VROrange'){lc=[255,165,0,180]; gc=[255,100,0,100];}
  else                          {lc=[200,200,200,180];gc=[180,180,180,100];}
  p.fill(0);
  b(p,-76,0,0, 108,70,10);
  b(p,  0,0,0,  44,62,10);
  b(p, 76,0,0, 108,70,10);
  p.fill(...lc);
  b(p,0,0,4, 240,32,14);
  p.fill(...gc);
  b(p,0,0,8, 250,38,8);
  arms(p, 122, 16, 52);
}

function glasses3D(p) {
  p.fill(0);
  b(p,-72,0,0, 116,90,10);
  b(p,  0,0,0, 120,18, 5);
  b(p, 72,0,0, 116,90,10);
  p.fill(0,0,255,200);
  b(p,-72,0,4,  92,68,10);
  p.fill(255,0,0,200);
  b(p, 72,0,4,  92,68,10);
  arms(p, 122, 18, 52);
}

function fancyGradient(p, variant) {
  let cols;
  if     (variant==='Sky')   cols=[[62,119,216,200],[30,144,255,200],[135,206,235,200]];
  else if(variant==='Fire')  cols=[[255,69,0,200],[255,140,0,200],[255,215,0,200]];
  else if(variant==='Forest')cols=[[34,139,34,200],[50,205,50,200],[144,238,144,200]];
  else                        cols=[[255,0,0,200],[255,215,0,200],[0,128,0,200]];
  const cx=72;
  for(const ox of[-cx,cx]){
    p.fill(0); b(p,ox,0,2, 110,76,10);
    for(let i=0;i<3;i++){
      p.fill(...cols[i]);
      b(p,ox,-20+i*20,6, 94,20,8);
    }
  }
  p.fill(0);
  b(p,0,0,4, cx*2-110+8,18,5);
  arms(p, cx+54, 16, 52);
}

function swimmingMask(p) {
  p.fill(0);
  b(p,-72,0,0, 116,72,10);
  b(p,  0,0,0,  44,62,10);
  b(p, 72,0,0, 116,72,10);
  p.fill(173,216,230,180);
  b(p,-70,0,5,  98,30,14);
  b(p, 70,0,5,  98,30,14);
  arms(p, 124, 18, 56);
}

//        MAIN EXPORT                                                                                                                                              
export function drawGlasses(p) {
  if (state.glassesStyle === 'None') return;
  p.push();
  // Keep glasses snug to the cube while leaving room for visible side arms.
  p.translate(0, -21, 8);
  p.scale(0.83);
  p.noStroke();
  switch(state.glassesStyle){
    case 'Square':       squareFrame(p); break;
    case 'Round':        roundFrame(p);  break;
    case 'Visor':        visorBar(p);    break;
    case 'Shield':       shield(p);      break;
    case 'Bandit':       bandit(p);      break;
    case 'Mono':         mono(p);        break;
    case 'Wrap':         wrap(p);        break;
    case 'Spiked':       spiked(p);      break;
    case 'DiamondBlue':  hollowSquare(p,state.frameColor,true);  break;
    case 'DiamondRed':   hollowSquare(p,[255,20,20],  true);  break;
    case 'DiamondGreen': hollowSquare(p,[20,220,20],  true);  break;
    case 'DiamondNeon':  hollowSquare(p,[0,255,255],  true);  break;
    case 'DiamondFire':  hollowSquare(p,[255,69,0],   true);  break;
    case 'FrameBlue':    hollowSquare(p,[20,20,255],  false); break;
    case 'FrameRed':     hollowSquare(p,[220,20,20],  false); break;
    case 'FrameGreen':   hollowSquare(p,[20,200,20],  false); break;
    case 'VRGrey':       vrVisor(p,'VRGrey');   break;
    case 'VRGreen':      vrVisor(p,'VRGreen');  break;
    case 'VROrange':     vrVisor(p,'VROrange'); break;
    case '3D':           glasses3D(p);          break;
    case 'GradSky':      fancyGradient(p,'Sky');    break;
    case 'GradFire':     fancyGradient(p,'Fire');   break;
    case 'GradForest':   fancyGradient(p,'Forest'); break;
    case 'GradRasta':    fancyGradient(p,'Rasta');  break;
    case 'SwimMask':     swimmingMask(p); break;
    default:             squareFrame(p); break;
  }
  p.pop();
}
