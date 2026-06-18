import { mulberry32, getSeed, rgbToHex } from './rng.js';
import { BODY_PALETTES, TUNNEL_STYLE, TUNNEL_PALETTE } from './constants.js';

export let t = 0;

export const camera = {
  rotX: -0.2, rotY: 0.3,
  targetRotX: -0.2, targetRotY: 0.3,
  zoom: 1, targetZoom: 1,
  isDragging: false, prevMouseX: 0, prevMouseY: 0
};

export const SEED = getSeed();
const seedEl = document.getElementById('seedVal');
if (seedEl) seedEl.textContent = SEED;
export const rng = mulberry32(SEED);

// Only three public-safe character presets.
// Internal cosmetics are kept only so the same robot can render correctly.
export const DEMO_ROBOTS = [
  {
    id: 1, name: 'CLASSIC', bodyIndex: 0,
    hat: 'None', eyeStyle: 'CrossFlat', glassesStyle: 'None', mouthStyle: 'SmileArc',
    eyeColor: [245, 235, 220], frameColor: [27, 58, 138], lensColor: [125, 225, 211], lensAlpha: 0.5,
    shoe: { main:[240,190,40], sole:[12,12,16], mid:[240,240,240], collar:[255,255,255], toe:[255,255,255] },
    mouth: { lip:[230,180,160], teeth:[245,245,245], tongue:[220,90,90] }
  },
  {
    id: 2, name: 'SIGNAL', bodyIndex: 1,
    hat: 'Beanie', eyeStyle: 'VoxelXWhite', glassesStyle: 'Square', mouthStyle: 'Flat',
    eyeColor: [220, 240, 255], frameColor: [20, 20, 220], lensColor: [100, 180, 255], lensAlpha: 0.55,
    shoe: { main:[20,20,220], sole:[10,10,12], mid:[240,240,240], collar:[10,10,200], toe:[255,255,255] },
    mouth: { lip:[0,180,200], teeth:[245,245,245], tongue:[0,140,160] }
  },
  {
    id: 3, name: 'ARCADE', bodyIndex: 2,
    hat: 'TopHat', eyeStyle: 'Checkerboard', glassesStyle: 'Round', mouthStyle: 'Open',
    eyeColor: [255, 255, 180], frameColor: [220, 20, 60], lensColor: [255, 150, 150], lensAlpha: 0.55,
    shoe: { main:[220,20,20], sole:[10,10,12], mid:[240,240,240], collar:[200,10,10], toe:[255,255,255] },
    mouth: { lip:[200,60,60], teeth:[245,245,245], tongue:[180,40,50] }
  }
];

export const state = {
  demoCharacter: 'CLASSIC',

  bodyName: 'Classic',
  bodyColor: [22, 22, 28],
  legsColor: [14, 14, 18],

  hat: 'None',
  eyeStyle: 'CrossFlat',
  glassesStyle: 'None',
  mouthStyle: 'SmileArc',

  eyeColor: [245, 235, 220],
  eyeColorHex: '#f5ebdc',
  frameColor: [27, 58, 138],
  frameColorHex: '#1b3a8a',
  lensColor: [125, 225, 211],
  lensColorHex: '#7de1d3',
  lensAlpha: 0.5,

  mouthColor: [230, 180, 160],
  teethColor: [245, 245, 245],
  tongueColor: [220, 90, 90],

  shoeLeft: [240, 190, 40],
  shoeRight: [240, 190, 40],
  outsoleColor: [12, 12, 16],
  midsoleColor: [240, 240, 240],
  collarColor: [255, 255, 255],
  toeColor: [255, 255, 255],

  tunnelStyle: TUNNEL_STYLE,
  tunnelPaletteName: TUNNEL_PALETTE.name,
  tunnelColors: TUNNEL_PALETTE.colors,
  tunnelBgColor: TUNNEL_PALETTE.bg,
};

const copy = (v) => Array.isArray(v) ? [...v] : v;

export function applyDemoRobot(index = 0) {
  const robot = DEMO_ROBOTS[((index % DEMO_ROBOTS.length) + DEMO_ROBOTS.length) % DEMO_ROBOTS.length];
  const body = BODY_PALETTES[robot.bodyIndex];

  state.demoCharacter = robot.name;
  state.bodyName = body.name;
  state.bodyColor = copy(body.rgb);
  state.legsColor = copy(body.darkRgb);

  state.hat = robot.hat;
  state.eyeStyle = robot.eyeStyle;
  state.glassesStyle = robot.glassesStyle;
  state.mouthStyle = robot.mouthStyle;

  state.eyeColor = copy(robot.eyeColor);
  state.eyeColorHex = rgbToHex(state.eyeColor);
  state.frameColor = copy(robot.frameColor);
  state.frameColorHex = rgbToHex(state.frameColor);
  state.lensColor = copy(robot.lensColor);
  state.lensColorHex = rgbToHex(state.lensColor);
  state.lensAlpha = robot.lensAlpha;

  state.shoeLeft = copy(robot.shoe.main);
  state.shoeRight = copy(robot.shoe.main);
  state.outsoleColor = copy(robot.shoe.sole);
  state.midsoleColor = copy(robot.shoe.mid);
  state.collarColor = copy(robot.shoe.collar);
  state.toeColor = copy(robot.shoe.toe);

  state.mouthColor = copy(robot.mouth.lip);
  state.teethColor = copy(robot.mouth.teeth);
  state.tongueColor = copy(robot.mouth.tongue);

  state.tunnelStyle = TUNNEL_STYLE;
  state.tunnelPaletteName = TUNNEL_PALETTE.name;
  state.tunnelColors = TUNNEL_PALETTE.colors.map(copy);
  state.tunnelBgColor = copy(TUNNEL_PALETTE.bg);

  window.dispatchEvent(new CustomEvent('blockheadz:demo-change', { detail: { robot, state } }));
}

export function initTraitsFromSeed() {
  const params = new URLSearchParams(window.location.search);
  const selected = Number(params.get('character') || params.get('robot') || params.get('id'));

  if (Number.isFinite(selected) && selected >= 1) {
    applyDemoRobot(selected - 1);
  } else {
    applyDemoRobot(SEED % DEMO_ROBOTS.length);
  }
}

export function setTime(v){ t = v; }
export function addTime(dv){ t += dv; }
