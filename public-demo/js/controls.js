import { camera, setTime } from './state.js';

export function mousePressed() {
  camera.isDragging = true;
  camera.prevMouseX = mouseX;
  camera.prevMouseY = mouseY;
}

export function mouseReleased() {
  camera.isDragging = false;
}

export function mouseDragged() {
  if (!camera.isDragging) return;

  const dx = mouseX - camera.prevMouseX;
  const dy = mouseY - camera.prevMouseY;

  camera.targetRotY += dx * 0.008;
  camera.targetRotX += dy * 0.008;

  camera.targetRotX = constrain(camera.targetRotX, -1.2, 1.2);

  camera.prevMouseX = mouseX;
  camera.prevMouseY = mouseY;
}

export function mouseWheel(event) {
  camera.targetZoom *= 1 - event.delta * 0.001;
  camera.targetZoom = constrain(camera.targetZoom, 0.55, 2.2);
  return false;
}

export function keyPressed() {
  const k = (key || '').toLowerCase();

  if (k === 'r') {
    camera.targetRotX = 0;
    camera.targetRotY = 0;
    camera.targetZoom = 1;
    setTime(0);
  }
}

export function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
