import { state, camera, initTraitsFromSeed, t, addTime, setTime } from './state.js';
import { drawBody } from './parts/body.js';
import { drawLegs } from './parts/legs.js';
import { drawFace } from './parts/face.js';
import { drawHat } from './parts/hats.js';
import { drawTunnel } from './parts/tunnel.js';
import './builder_panel.js';
import {
  mousePressed, mouseReleased, mouseDragged,
  mouseWheel, keyPressed, windowResized
} from './controls.js';

window.__camera = camera;

window.setup = function () {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(Math.min(2.5, window.devicePixelRatio || 1));

  camera.targetRotX = 0;
  camera.targetRotY = 0.0;
  camera.targetZoom = 1;
  camera.rotX = 0.12;
  camera.rotY = 0.0;
  camera.zoom = 1.05;

  initTraitsFromSeed();
  window.__p5instance = this;
};

window.draw = function () {
  background(0);
  noFill();

  addTime(0.098);

  if (!window.__frozen) {
    camera.rotX = lerp(camera.rotX, camera.targetRotX, 0.12);
    camera.rotY = lerp(camera.rotY, camera.targetRotY, 0.12);
    camera.zoom = lerp(camera.zoom, camera.targetZoom, 0.15);
  }

  directionalLight(255, 240, 220, 0.3, -0.8, -0.3);
  directionalLight(180, 190, 255, -0.2, -0.3, -0.8);

  const lPhase = t * 0.9;
  const lR = Math.round(100 + 60 * Math.sin(lPhase));
  const lG = Math.round(80  + 50 * Math.sin(lPhase + 2.1));
  const lB = Math.round(140 + 80 * Math.sin(lPhase + 4.2));

  pointLight(lR, lG, lB,  0,  0, 600);
  pointLight(lB, lR, lG,  0,  0, -600);

  drawTunnel(this, t, state.tunnelStyle, state.tunnelColors);

  push();
  translate(0, 20, 0);
  scale(camera.zoom * 1.1);
  rotateX(camera.rotX);
  rotateY(camera.rotY);

  noStroke();

  const CHAR_SCALE = 0.98;
  const breathe = Math.sin(t * 0.6) * 5;
  const walkBob = (1 - Math.cos(t * 1.3 * 2)) * 6;

  push();
  translate(0, 550 - 500 + breathe + walkBob, -200);
  scale(CHAR_SCALE);
  rotateX(-0.104);

  drawBody(this);
  drawLegs(this);
  drawFace(this);
  drawHat(this, state.hat);

  pop();
  pop();
};

window.mousePressed  = mousePressed;
window.mouseReleased = mouseReleased;
window.mouseDragged  = mouseDragged;
window.mouseWheel    = mouseWheel;
window.keyPressed    = keyPressed;
window.windowResized = windowResized;

window.__freeze = () => { window.__frozen = true; noLoop(); };
window.__stepTo = (tVal) => {
  setTime(tVal);
  redraw();
};
