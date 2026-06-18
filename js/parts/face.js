import { state } from '../state.js';
import { drawEyes } from './eyes.js';
import { drawGlasses } from './glasses.js';
import { drawMouth } from './mouths.js';

export function drawFace(p){
  p.push();
  p.translate(0, 0, 118);   // body is 230 deep     half = 115, face sits tight on the cube
  p.noStroke();
  drawEyes(p);
  drawGlasses(p);
    // Mouth
  drawMouth(p);
  p.pop();
}
