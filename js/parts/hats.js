import { rng } from '../state.js';
import { t as globalT } from '../state.js';

/* ==================================================
   FUGLY HATVERSE v4     MetaPXL Degen Style
   Flat    Bold    Expressive    No towers
   Each hat: 1   4 pieces max, strong silhouette
   HEAD cube = 240  240  240, centered at origin
   drawHat translates to HEAD_TOP = -125 before calling fn
   So inside fn:  y=0      top of head
                  y<0      above head (hat crown / brim up)
                  y>0      into head (band wrapping)
   Head half-width = 120 in X and Z
   Hat brim should be ~260   320 wide to overhang clearly
   ================================================== */

const HEAD_TOP = -125;

const S = Math.sin;
const C = Math.cos;

// push-isolated box at absolute position
function b(p, x, y, z, w, h, d) {
  p.push();
  p.translate(x|0, y|0, z|0);
  p.box(w|0, h|0, d|0);
  p.pop();
}

//        HAT FUNCTIONS                                                                                                                                                                                     
// Naming: all positions relative to hat origin (top of head = y=0)
// Positive Y = downward into head. Negative Y = upward above head.

const hatMap = {

  //        SNAPBACK                                                                                                                                                                
  // Black cap body + flat peak forward + logo patch
  Snapback: (p, t) => {
    // Cap body wrapping head
    p.fill(15, 15, 15);
    b(p, 0, 10, 0,   248, 60, 248);
    // Top button
    p.fill(255, 50, 50);
    b(p, 0, -20, 0,   30, 20, 30);
    // Peak     flat, extends forward
    p.fill(10, 10, 10);
    b(p, 0, 22, 124,  230, 14, 80);
    // Brim lip (underside lighter)
    p.fill(30, 30, 30);
    b(p, 0, 28, 154,  200, 6, 20);
    // Logo patch on front
    p.fill(255, 50 + 50*S(t*3), 50);
    b(p, 0, 0, 126,   80, 30, 8);
  },

  //        SNAPBACK PURPLE                                                                                                                                           
  SnapbackPurple: (p, t) => {
    p.fill(100, 20, 180);
    b(p, 0, 10, 0,   248, 60, 248);
    p.fill(220, 180 + 40*S(t*2), 255);
    b(p, 0, -20, 0,  30, 20, 30);
    p.fill(70, 10, 140);
    b(p, 0, 22, 124, 230, 14, 80);
    p.fill(200, 160, 255);
    b(p, 0, 0, 126,  80, 30, 8);
  },

  //        FITTED CAP (no peak seam, clean)                                                                                        
  FittedCap: (p, t) => {
    const r = 40 + 40*S(t*1.5), g = 180 + 40*S(t*1.5+1), bl = 255;
    p.fill(r, g, bl);
    b(p, 0, 10, 0,   248, 60, 248);
    // Brim band
    p.fill(r*0.6|0, g*0.6|0, bl*0.6|0);
    b(p, 0, 30, 0,   252, 12, 252);
    // Top button white
    p.fill(255, 255, 255);
    b(p, 0, -20, 0,  24, 18, 24);
    // Peak
    p.fill(r*0.7|0, g*0.7|0, bl*0.7|0);
    b(p, 0, 22, 124, 220, 12, 76);
  },

  //        GOLD CROWN                                                                                                                                                          
  // Flat crown band + 5 spikes, sits on head
  Crown: (p, t) => {
    const pulse = 195 + 40*S(t*2.5);
    // Base band
    p.fill(255, pulse, 30);
    b(p, 0, 8, 0,    252, 44, 252);
    // 5 crown points     alternating heights
    const pts = [-100, -50, 0, 50, 100];
    const heights = [70, 50, 80, 50, 70];
    for (let i = 0; i < 5; i++) {
      p.fill(255, pulse - 20 + i*10, 20);
      b(p, pts[i], -heights[i]*0.5 + 8, 0,  32, heights[i], 32);
    }
    // Gem inlays on band
    const gemColors = [[255,80,80],[80,80,255],[255,80,80],[80,80,255],[255,80,80]];
    for (let i = 0; i < 5; i++) {
      p.fill(...gemColors[i]);
      b(p, pts[i], 4, 120,  16, 20, 8);
    }
  },

  //        HALO                                                                                                                                                                            
  // Thin gold ring floating above head
  Halo: (p, t) => {
    const bob = S(t*2)*12;
    const twist = t * 1.2;
    const R = 140;
    const segs = 12;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2 + twist;
      const bright = 200 + 55*S(t*3 + i*0.5);
      p.fill(255, bright, 30);
      b(p, C(a)*R, -80 + bob, S(a)*R,  28, 14, 28);
    }
  },

  //        DEVIL HORNS                                                                                                                                                       
  DevilHorns: (p, t) => {
    // Small dark headband
    p.fill(40, 0, 0);
    b(p, 0, 16, 0,   252, 28, 252);
    // Left horn
    const leanL = 0.18;
    p.fill(220 + 35*S(t*3), 20, 20);
    b(p, -80, -30, 0,  34, 50, 30);
    p.fill(255, 60 + 40*S(t*3), 40);
    b(p, -88, -68, 0,  20, 36, 20);
    p.fill(255, 200, 180);
    b(p, -96, -92, 0,  10, 20, 10);
    // Right horn
    p.fill(220 + 35*S(t*3), 20, 20);
    b(p,  80, -30, 0,  34, 50, 30);
    p.fill(255, 60 + 40*S(t*3), 40);
    b(p,  88, -68, 0,  20, 36, 20);
    p.fill(255, 200, 180);
    b(p,  96, -92, 0,  10, 20, 10);
  },

  //        ANGEL HALO                                                                                                                                                          
  AngelHalo: (p, t) => {
    const bob = S(t*1.8)*10;
    const R = 130, segs = 10;
    for (let i = 0; i < segs; i++) {
      const a = (i/segs)*Math.PI*2 + t*0.6;
      const glow = 220 + 35*S(t*2.5 + i);
      p.fill(255, 255, glow);
      b(p, C(a)*R, -90 + bob, S(a)*R,  24, 10, 24);
    }
  },

  //        BANDANA                                                                                                                                                                   
  // Flat wrap around head, knot at back
  Bandana: (p, t) => {
    p.fill(220, 30, 30);
    b(p, 0, 14, 0,   252, 40, 252);
    // Top fold crease
    p.fill(190, 20, 20);
    b(p, 0, -4, 0,   252, 8, 252);
    // Knot at back     two lumps
    p.fill(200, 25, 25);
    b(p, -22, 20, -126,  28, 36, 22);
    b(p,  22, 20, -126,  28, 36, 22);
    // White pattern dots on front
    p.fill(255, 255, 255, 160);
    for (const [dx, dz] of [[-70, 0],[0, 0],[70, 0],[-35, 0],[35, 0]]) {
      b(p, dx, 10, 120,  12, 12, 8);
    }
  },

  //        DURAG                                                                                                                                                                         
  Durag: (p, t) => {
    const c1 = [10 + 10*S(t*2), 80 + 60*S(t*1.5), 220 + 35*S(t*1.8)];
    p.fill(...c1);
    b(p, 0, 10, 0,   252, 52, 252);
    // Visor fold at top
    p.fill(c1[0]*0.7|0, c1[1]*0.7|0, c1[2]*0.7|0);
    b(p, 0, -14, 0,  254, 12, 254);
    // Tail drape at back
    p.fill(...c1);
    b(p,  20, 36, -124,  44, 60, 18);
    b(p, -20, 36, -124,  44, 60, 18);
    b(p,   0, 60, -120,  60, 30, 16);
    // Knot
    p.fill(c1[0]*0.6|0, c1[1]*0.6|0, c1[2]*0.6|0);
    b(p, 0, 28, -118,   36, 26, 20);
  },

  //        BUCKET HAT                                                                                                                                                          
  BucketHat: (p, t) => {
    // Wide brim
    p.fill(20, 20, 20);
    b(p, 0, 28, 0,   300, 18, 300);
    // Crown
    p.fill(30, 30, 30);
    b(p, 0, 4, 0,    240, 46, 240);
    // Top flat
    p.fill(22, 22, 22);
    b(p, 0, -18, 0,  230, 10, 230);
    // Hat band stripe     neon
    p.fill(0, 255 * Math.abs(S(t*2)), 200 + 55*S(t*2.5));
    b(p, 0, 18, 0,   244, 8, 244);
  },

  //        BUCKET HAT CAMO                                                                                                                                           
  BucketCamo: (p, t) => {
    p.fill(60, 80, 40);
    b(p, 0, 28, 0,   300, 18, 300);
    p.fill(50, 68, 34);
    b(p, 0, 4, 0,    240, 46, 240);
    p.fill(40, 55, 28);
    b(p, 0, -18, 0,  230, 10, 230);
    // Camo patches
    p.fill(80, 100, 50);
    b(p, -60, 0, 122, 40, 40, 8);
    b(p,  50, 0, 122, 30, 36, 8);
    p.fill(30, 40, 18);
    b(p,  -10, 0, 122, 20, 44, 8);
  },

  //        VISOR (sports)                                                                                                                                              
  Visor: (p, t) => {
    // Band only, no crown
    p.fill(255, 255, 255);
    b(p, 0, 14, 0,   252, 32, 252);
    // Peak
    p.fill(240, 240, 240);
    b(p, 0, 22, 130, 240, 14, 88);
    // Colored logo on band
    p.fill(255, 40 + 80*S(t*2), 40);
    b(p, 0, 10, 126,  60, 22, 8);
  },

  //        CYBER VISOR                                                                                                                                                       
  CyberVisor: (p, t) => {
    p.fill(10, 10, 10);
    b(p, 0, 10, 0,   252, 50, 252);
    // Neon visor strip     full face
    p.fill(0, 220 + 35*S(t*3), 255, 220);
    b(p, 0, 10, 124, 252, 24, 12);
    // Pulse glow underline
    p.fill(0, 180 + 75*S(t*4), 255, 120);
    b(p, 0, 22, 126, 230, 6, 8);
    // Side tech blocks
    p.fill(20, 20, 20);
    b(p, -126, 10, 0,  12, 50, 80);
    b(p,  126, 10, 0,  12, 50, 80);
    // LED dots on side
    p.fill(0, 255, 180);
    b(p, -128, 4, 20,   8, 8, 8);
    b(p,  128, 4, 20,   8, 8, 8);
  },

  //        FLAT TOP                                                                                                                                                                
  // Clean geometric flat top
  FlatTop: (p, t) => {
    p.fill(15, 15, 15);
    b(p, 0, 6, 0,    252, 60, 252);
    // Flat top slab
    p.fill(20, 20, 20);
    b(p, 0, -22, 0,  260, 14, 260);
    // Neon band
    p.fill(255, 220 + 35*S(t*3), 0);
    b(p, 0, 14, 0,   256, 8, 256);
  },

  //        COWBOY HAT                                                                                                                                                          
  CowboyHat: (p, t) => {
    // Wide brim
    p.fill(120, 70, 30);
    b(p, 0, 24, 0,   330, 16, 330);
    // Crown
    p.fill(100, 58, 24);
    b(p, 0, 0, 0,    220, 50, 220);
    // Crown indent (top flat, pinched)
    p.fill(90, 50, 20);
    b(p, 0, -20, 0,  200, 14, 140);
    // Hat band
    p.fill(60, 30, 10);
    b(p, 0, 16, 0,   224, 10, 224);
    // Band buckle
    p.fill(220 + 35*S(t*2), 180, 20);
    b(p, 0, 16, 114, 22, 14, 8);
  },

  //        COWBOY (white)                                                                                                                                              
  CowboyWhite: (p, t) => {
    p.fill(230, 225, 215);
    b(p, 0, 24, 0,   330, 16, 330);
    p.fill(215, 210, 200);
    b(p, 0, 0, 0,    220, 50, 220);
    p.fill(200, 196, 185);
    b(p, 0, -20, 0,  200, 14, 140);
    // Band black
    p.fill(20, 20, 20);
    b(p, 0, 16, 0,   224, 10, 224);
    p.fill(200 + 55*S(t*2), 160, 20);
    b(p, 0, 16, 114, 22, 14, 8);
  },

  //        PIRATE HAT                                                                                                                                                          
  PirateHat: (p, t) => {
    // Bicorne base
    p.fill(15, 15, 15);
    b(p, 0, 10, 0,   252, 44, 252);
    // Front peak up-curve
    p.fill(18, 18, 18);
    b(p, 0, -6, 120, 240, 32, 24);
    // Back peak
    b(p, 0, -6, -120, 240, 32, 24);
    // Skull badge on front
    p.fill(255, 255, 255);
    b(p, 0, 0, 128,  38, 32, 8);
    // Eye holes on skull
    p.fill(10, 10, 10);
    b(p, -10, -2, 130, 10, 10, 8);
    b(p,  10, -2, 130, 10, 10, 8);
    // Gold trim
    p.fill(220 + 35*S(t*2), 180, 20);
    b(p, 0, 22, 0,   256, 6, 256);
  },

  //        TOP HAT                                                                                                                                                                   
  TopHat: (p, t) => {
    // Brim
    p.fill(15, 15, 15);
    b(p, 0, 26, 0,   310, 14, 310);
    // Body
    p.fill(20, 20, 20);
    b(p, 0, -14, 0,  220, 82, 220);
    // Top flat
    p.fill(15, 15, 15);
    b(p, 0, -54, 0,  224, 10, 224);
    // Band stripe
    p.fill(255, 255, 255);
    b(p, 0, 14, 0,   224, 10, 224);
  },

  //        TOP HAT RED                                                                                                                                                       
  TopHatRed: (p, t) => {
    p.fill(150, 10, 10);
    b(p, 0, 26, 0,   310, 14, 310);
    p.fill(180, 15, 15);
    b(p, 0, -14, 0,  220, 82, 220);
    p.fill(150, 10, 10);
    b(p, 0, -54, 0,  224, 10, 224);
    // Gold band
    p.fill(255, 210 + 45*S(t*2), 20);
    b(p, 0, 14, 0,   224, 12, 224);
  },

  //        FLAT CAP (newsboy style)                                                                                                                   
  FlatCap: (p, t) => {
    // Flat round crown
    p.fill(45, 35, 25);
    b(p, 0, 4, 0,    248, 40, 248);
    // Top panel     slightly darker
    p.fill(35, 27, 18);
    b(p, 0, -14, 0,  240, 12, 200);
    // Peak sticking out front
    p.fill(38, 30, 20);
    b(p, 0, 18, 136, 220, 10, 68);
    // Button
    p.fill(80, 60, 40);
    b(p, 0, -18, 0,  18, 14, 18);
  },

  //        MOHAWK                                                                                                                                                                      
  // Leather band + central fin
  Mohawk: (p, t) => {
    // Band
    p.fill(20, 20, 20);
    b(p, 0, 16, 0,   252, 34, 252);
    // Fin     single tall blade down the center (front-back)
    const h = 70 + 20*S(t*3);
    p.fill(255, 30 + 80*S(t*2.5), 30);
    b(p, 0, -h*0.5 + 16, 0,  28, h, 252);
    // Fin highlight
    p.fill(255, 180 + 60*S(t*2), 100);
    b(p, 0, -h*0.5 + 16, 0,  14, h*0.6, 200);
  },

  //        MOHAWK BLUE                                                                                                                                                       
  MohawkBlue: (p, t) => {
    p.fill(20, 20, 20);
    b(p, 0, 16, 0,   252, 34, 252);
    const h = 70 + 20*S(t*3);
    p.fill(30, 120 + 80*S(t*2), 255);
    b(p, 0, -h*0.5 + 16, 0,  28, h, 252);
    p.fill(100, 220 + 35*S(t*2.5), 255);
    b(p, 0, -h*0.5 + 16, 0,  14, h*0.6, 200);
  },

  //        BEANIE                                                                                                                                                                      
  Beanie: (p, t) => {
    // Body
    p.fill(30, 80, 200);
    b(p, 0, 6, 0,    248, 56, 248);
    // Ribbed cuff
    p.fill(20, 60, 170);
    b(p, 0, 24, 0,   252, 16, 252);
    // Pom pom
    const bob = S(t*3)*8;
    p.fill(255, 255, 255);
    b(p, 0, -26 + bob, 0,  44, 44, 44);
    p.fill(30, 80, 200);
    b(p, 0, -40 + bob, 0,  28, 28, 28);
  },

  //        BEANIE RED                                                                                                                                                          
  BeanieRed: (p, t) => {
    p.fill(200, 30, 30);
    b(p, 0, 6, 0,    248, 56, 248);
    p.fill(160, 18, 18);
    b(p, 0, 24, 0,   252, 16, 252);
    const bob = S(t*3)*8;
    p.fill(255, 255, 255);
    b(p, 0, -26 + bob, 0,  44, 44, 44);
    p.fill(200, 30, 30);
    b(p, 0, -40 + bob, 0,  28, 28, 28);
  },

  //        NINJA MASK                                                                                                                                                          
  // Full head wrap with eye slit
  NinjaMask: (p, t) => {
    p.fill(10, 10, 10);
    b(p, 0, 10, 0,   252, 60, 252);
    // Eye slit     glowing
    p.fill(255, 60 + 60*S(t*3), 0, 200);
    b(p, 0, 6, 126,  180, 16, 10);
    // Forehead band
    p.fill(20, 20, 20);
    b(p, 0, -12, 0,  256, 10, 256);
  },

  //        NINJA MASK BLUE                                                                                                                                           
  NinjaMaskBlue: (p, t) => {
    p.fill(10, 10, 30);
    b(p, 0, 10, 0,   252, 60, 252);
    p.fill(0, 200 + 55*S(t*3), 255, 200);
    b(p, 0, 6, 126,  180, 16, 10);
    p.fill(10, 14, 40);
    b(p, 0, -12, 0,  256, 10, 256);
  },

  //        BRAIN WORMS                                                                                                                                                       
  // Alien worm thing on head     very degen
  BrainWorms: (p, t) => {
    p.fill(180, 20, 180);
    b(p, 0, 10, 0,   252, 40, 252);
    // Worm segments crawling across top
    const wormCols = [[255,20,200],[200,20,255],[255,80,255]];
    for (let i = 0; i < 6; i++) {
      const ox = -90 + i*36;
      const oy = -20 + S(t*4 + i*1.2) * 16;
      const [r,g,bl] = wormCols[i%3];
      p.fill(r, g, bl);
      b(p, ox, oy, 60,  28, 24, 28);
    }
    // Eyes on worm head
    p.fill(255, 255, 0);
    b(p, -102, -10 + S(t*4)*16, 60,  12, 12, 12);
    b(p, -90,  -10 + S(t*4)*16, 60,  12, 12, 12);
  },

  //        ASTRONAUT                                                                                                                                                             
  // Space helmet visor
  Astronaut: (p, t) => {
    // White helmet shell
    p.fill(240, 240, 235);
    b(p, 0, 10, 0,   258, 64, 258);
    // Gold visor
    p.fill(255, 200 + 30*S(t*2), 0, 200);
    b(p, 0, 10, 130, 220, 40, 10);
    // Visor frame
    p.fill(200, 195, 188);
    b(p, -112, 10, 120, 10, 44, 18);
    b(p,  112, 10, 120, 10, 44, 18);
    b(p, 0, -8, 124,  220, 10, 14);
    b(p, 0, 28, 124,  220, 10, 14);
    // NASA-style patch
    p.fill(40, 100, 220);
    b(p, 80, 10, 134,  40, 26, 6);
  },

  //        HARD HAT                                                                                                                                                                
  HardHat: (p, t) => {
    p.fill(255, 200 + 30*S(t*1.5), 0);
    b(p, 0, 4, 0,    252, 54, 252);
    // Brim
    p.fill(230, 180, 0);
    b(p, 0, 24, 0,   290, 12, 290);
    // Vent ridge on top
    p.fill(200, 160, 0);
    b(p, 0, -14, 0,  240, 8, 100);
    // Side stripe
    p.fill(255, 255, 255);
    b(p, 0, 10, 0,   256, 6, 256);
  },

  //        BRAIN                                                                                                                                                                         
  // Exposed brain sticking out     very fugly
  Brain: (p, t) => {
    p.fill(20, 20, 20);
    b(p, 0, 20, 0,   252, 26, 252);
    // Brain lobes     pink wrinkled chunks
    const bob = S(t*2)*5;
    p.fill(255, 140, 160);
    b(p,  40, -20 + bob, 40,  80, 50, 80);
    b(p, -40, -22 + bob, 40,  80, 46, 80);
    b(p,   0, -18 + bob,-40,  90, 44, 80);
    // Wrinkle lines
    p.fill(220, 100, 120);
    b(p,  40, -24 + bob, 40,  10, 54, 10);
    b(p, -40, -26 + bob, 40,  10, 50, 10);
    b(p,   0, -22 + bob,-40,  10, 48, 10);
  },

  //        SAMURAI KABUTO                                                                                                                                              
  Kabuto: (p, t) => {
    // Main helmet
    p.fill(30, 30, 38);
    b(p, 0, 8, 0,    252, 58, 252);
    // Neck guard (shikoro)     stepped plates
    p.fill(25, 25, 32);
    b(p, 0, 38, 0,   268, 14, 268);
    b(p, 0, 50, 0,   280, 10, 280);
    // Crest (kuwagata horns)
    p.fill(200 + 55*S(t*2), 170, 20);
    b(p, -30, -28, 0,  18, 56, 12);
    b(p,  30, -28, 0,  18, 56, 12);
    // Crest base
    p.fill(180, 150, 18);
    b(p, 0, -8, 0,   70, 18, 18);
    // Forehead rivets
    p.fill(160, 130, 10);
    for (const x of [-80, -40, 0, 40, 80]) {
      b(p, x, 2, 128,  10, 10, 8);
    }
  },

  //        PARTY HAT                                                                                                                                                             
  PartyHat: (p, t) => {
    const cols = [[255,80,180],[255,180,20],[80,200,255],[200,80,255]];
    // Cone layers (4 shrinking rings)
    for (let i = 0; i < 4; i++) {
      const [r,g,bl] = cols[i];
      p.fill(r, g, bl);
      b(p, 0, -i*28, 0,  260 - i*60, 30, 260 - i*60);
    }
    // Pom top
    const bob = S(t*4)*10;
    p.fill(255, 255, 255);
    b(p, 0, -112 + bob, 0,  26, 26, 26);
  },

  //        CHEF HAT                                                                                                                                                                
  ChefHat: (p, t) => {
    // Band
    p.fill(240, 240, 240);
    b(p, 0, 22, 0,   258, 24, 258);
    // Puffy crown
    p.fill(255, 255, 255);
    b(p, 0, -4, 0,   230, 60, 230);
    b(p, 0, -30, 0,  210, 30, 210);
    b(p, 0, -46, 0,  190, 22, 190);
    // Pleats (vertical lines)
    p.fill(225, 225, 225);
    for (const x of [-80, -40, 0, 40, 80]) {
      b(p, x, 0, 116,  8, 64, 8);
    }
  },

  //        GRADUATION CAP                                                                                                                                              
  GradCap: (p, t) => {
    // Flat square top     the mortarboard
    p.fill(10, 10, 10);
    b(p, 0, -16, 0,  310, 16, 310);
    // Cap body
    p.fill(15, 15, 15);
    b(p, 0, 10, 0,   248, 52, 248);
    // Tassel     hangs off one corner
    p.fill(255, 200 + 30*S(t*2), 20);
    b(p, 120, -16, 120,  10, 10, 10);
    // Tassel string
    p.fill(220, 180, 18);
    b(p, 120, 0 + S(t*3)*8, 120,  6, 40, 6);
    b(p, 120, 36 + S(t*3)*8, 120, 14, 14, 14);
  },

  //        NEON HALO                                                                                                                                                             
  NeonHalo: (p, t) => {
    const bob = S(t*2)*10;
    const R = 140, segs = 10;
    for (let i = 0; i < segs; i++) {
      const a = (i/segs)*Math.PI*2 + t*1.4;
      const r = 128 + 127*S(t*2.5 + i*0.6);
      const g = 128 + 127*S(t*2.5 + i*0.6 + 2.09);
      const bl= 128 + 127*S(t*2.5 + i*0.6 + 4.19);
      p.fill(r, g, bl);
      b(p, C(a)*R, -85 + bob, S(a)*R,  24, 12, 24);
    }
  },

  //        LASER VISOR                                                                                                                                                       
  LaserVisor: (p, t) => {
    p.fill(8, 8, 8);
    b(p, 0, 10, 0,   252, 48, 252);
    // Laser band     red glow
    p.fill(255, 20 + 30*S(t*5), 20, 220);
    b(p, 0, 10, 126, 252, 18, 12);
    // Side emitters
    p.fill(60, 60, 60);
    b(p, -128, 10, 100, 12, 30, 30);
    b(p,  128, 10, 100, 12, 30, 30);
    p.fill(255, 40, 40);
    b(p, -130, 10, 110, 8, 10, 10);
    b(p,  130, 10, 110, 8, 10, 10);
  },

  //        WITCH HAT                                                                                                                                                             
  WitchHat: (p, t) => {
    // Wide brim
    p.fill(18, 10, 30);
    b(p, 0, 24, 0,   320, 14, 320);
    // Cone body (3 steps)
    p.fill(22, 12, 38);
    b(p, 0, 2, 0,    200, 48, 200);
    b(p, 0, -34, 0,  130, 44, 130);
    b(p, 0, -68, 0,  68, 38, 68);
    // Tip
    b(p, 0, -96, 0,  28, 28, 28);
    // Hat band     neon purple
    p.fill(160 + 60*S(t*2), 0, 255);
    b(p, 0, 18, 0,   204, 8, 204);
    // Star buckle
    p.fill(255, 220 + 35*S(t*3), 0);
    b(p, 0, 18, 104, 22, 14, 8);
  },

  //        FUTURISTIC CROWN                                                                                                                                        
  // Thin sleek crown, cyber aesthetic
  CyberCrown: (p, t) => {
    p.fill(10, 10, 10);
    b(p, 0, 12, 0,   252, 36, 252);
    // Crown points     3 sleek prongs
    const ppts = [-90, 0, 90];
    for (const x of ppts) {
      p.fill(0, 220 + 35*S(t*3 + x*0.02), 255);
      b(p, x, -36, 0,  20, 60, 20);
      // Gem tip
      p.fill(255, 255, 255);
      b(p, x, -66, 0,  14, 14, 14);
    }
    // Neon base band
    p.fill(0, 200 + 55*S(t*2.5), 255);
    b(p, 0, 2, 0,    254, 6, 254);
  },

  //        BACKWARDS CAP                                                                                                                                                 
  BackwardsCap: (p, t) => {
    p.fill(240, 40, 40);
    b(p, 0, 10, 0,   248, 58, 248);
    // Peak goes backward
    p.fill(210, 30, 30);
    b(p, 0, 22, -126, 230, 14, 78);
    // Snap strap on front
    p.fill(20, 20, 20);
    b(p, 0, 18, 118, 80, 14, 8);
    b(p, 0, 18, 126, 30, 8, 8);
    // Top button
    p.fill(255, 255, 255);
    b(p, 0, -18, 0,  24, 18, 24);
  },

  //        TOP HAT (blue)                                                                                                                                              
  TopHatBlue: (p, t) => {
    // Crown
    p.fill(20, 20, 150);
    b(p, 0, -20, 0,  240, 80, 240);
    // Brim
    p.fill(15, 15, 80);
    b(p, 0,  18, 0,  300, 18, 300);
    // Gold band
    p.fill(200, 150, 50);
    b(p, 0, -2, 0,  248, 16, 248);
  },

  //        LAYERED HAT                                                                                                                                                       
  LayeredHat: (p, t) => {
    // White top
    p.fill(255, 255, 255);
    b(p, 0, -22, 0,  200, 30, 200);
    // Black band
    p.fill(10, 10, 10);
    b(p, 0,  -2, 0,  240, 14, 240);
    // White base
    p.fill(240, 240, 240);
    b(p, 0,  14, 0,  270, 14, 270);
  },

  //        STACKED BLUE                                                                                                                                                    
  StackedBlue: (p, t) => {
    p.fill(30, 30, 255);
    b(p, 0, -32, 0,  180, 22, 180);
    b(p, 0, -10, 0,  230, 22, 230);
    b(p, 0,  12, 0,  268, 18, 268);
  },

  //        WIZARD HAT                                                                                                                                                          
  WizardHat: (p, t) => {
    const bob = S(t*2)*4;
    p.fill(75, 0, 130);
    b(p, 0, -90+bob, 0,  80, 18, 80);
    b(p, 0, -72+bob, 0, 100, 18,100);
    b(p, 0, -54+bob, 0, 120, 18,120);
    b(p, 0, -34+bob, 0, 160, 22,160);
    // Gold band
    p.fill(255, 215, 0);
    b(p, 0, -10, 0,  248, 14, 248);
    // Purple brim
    p.fill(75, 0, 130);
    b(p, 0,  12, 0,  300, 16, 300);
  },

  //        FEDORA                                                                                                                                                                      
  Fedora: (p, t) => {
    // Wide brim
    p.fill(89, 60, 31);
    b(p, 0, 18, 0,  310, 12, 270);
    // Black band
    p.fill(10, 10, 10);
    b(p, 0,  4, 0,  248, 16, 248);
    // Stepped crown (4 layers)
    const browns = [
      [100,68,35],[95,64,32],[90,60,29],[85,57,26]
    ];
    for (let i = 0; i < 4; i++) {
      p.fill(...browns[i]);
      b(p, 0, -14 - i*18, 0,  240 - i*44, 20, 240 - i*44);
    }
  },

  //        BTC CAP                                                                                                                                                                   
  BTCCap: (p, t) => {
    // Red cap body
    p.fill(180, 20, 20);
    b(p, 0, 10, 0,  248, 58, 248);
    // Peak
    p.fill(130, 10, 10);
    b(p, 0, 22, 130, 220, 12, 80);
    // Bitcoin B logo on front (pixel style)
    p.fill(255, 200, 0);
    // Vertical bar
    b(p, -6, 8, 122,  8, 36, 8);
    // Upper bump
    b(p,  2, 0, 122, 14,  8, 8);
    b(p, 10,-4, 122, 10,  8, 8);
    b(p,  2, -12,122, 14, 8, 8);
    // Lower bump
    b(p,  2, 16, 122, 14,  8, 8);
    b(p, 10, 20, 122, 10,  8, 8);
    b(p,  2, 26, 122, 14,  8, 8);
    // Middle bar
    b(p,  2,  4, 122, 12,  6, 8);
  },

  //        VOXEL STACK HAT                                                                                                                                           
  VoxelStack: (p, t) => {
    // Light blue top
    p.fill(100, 180, 230);
    b(p, 0, -18, 0,  218, 32, 218);
    // Gold band
    p.fill(255, 215, 0);
    b(p, 0,   2, 0,  240, 12, 240);
    // Dark base
    p.fill(25, 25, 25);
    b(p, 0,  16, 0,  258, 18, 258);
  },

  //        GREEN CAP                                                                                                                                                             
  GreenCap: (p, t) => {
    p.fill(120, 190, 60);
    b(p, 0, 10, 0,  248, 58, 248);
    p.fill(0, 0, 0);
    b(p, 0, 22, 130, 220, 12, 78);
    // Pixel logo
    p.fill(40, 100, 40);
    b(p,  0,  4, 122,  8, 8, 8);
    b(p, -8, 12, 122,  8, 8, 8);
    b(p,  8, 12, 122,  8, 8, 8);
    b(p,  0, 20, 122,  8, 8, 8);
  },

  //        ORANGE CAP                                                                                                                                                          
  OrangeCap: (p, t) => {
    p.fill(255, 140, 0);
    b(p, 0, 10, 0,  248, 58, 248);
    p.fill(0, 0, 0);
    b(p, 0, 22, 130, 220, 12, 78);
    p.fill(180, 80, 0);
    b(p,  0,  4, 122,  8, 8, 8);
    b(p, -8, 12, 122,  8, 8, 8);
    b(p,  8, 12, 122,  8, 8, 8);
    b(p,  0, 20, 122,  8, 8, 8);
  },

  //        NONE (bald)                                                                                                                                                          
  None: (p, t) => {
    // intentionally empty     no hat
  },
};

/*        DRAW ENTRY                                                                                                                                                           */
export function drawHat(p, kind) {
  const fn = hatMap[kind] || hatMap.Snapback;
  p.push();
  p.noStroke();
  // Slight lift prevents z-fighting with the cube top.
  p.translate(0, HEAD_TOP - 4, 0);
  // Keep hat rendering stable so color accents do not flicker frame to frame.
  const hatTime = 0;
  fn(p, hatTime);
  p.pop();
}

export const randomHat = () => {
  const keys = Object.keys(hatMap).filter(k => k !== 'None');
  return keys[Math.floor(rng() * keys.length)];
};