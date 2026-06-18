import { state } from '../state.js';

export function drawEyes(p){
  switch(state.eyeStyle){
    case 'CrossFlat':       return eyesCross(p, state.eyeColor);
    case 'CrossBlack':      return eyesCross(p, [10, 10, 10]);
    case 'CrossWhite':      return eyesCross(p, [245, 245, 245]);
    case 'VoxelX':          return eyesVoxelX(p, state.eyeColor);
    case 'VoxelXBlack':     return eyesVoxelX(p, [10, 10, 10]);
    case 'VoxelXWhite':     return eyesVoxelX(p, [245, 245, 245]);
    case 'Checkerboard':    return eyesCheckerboard(p, false);
    case 'CheckerboardInv': return eyesCheckerboard(p, true);
   // case 'SolidBlack':      return eyesSolid(p, [10, 10, 10]);
   // case 'SolidWhite':      return eyesSolid(p, [245, 245, 245]);
    default:                return eyesCross(p, state.eyeColor);
  }
}

//        Cross / plus                                                                                                                                                                                        
function eyesCross(p, col){
  p.fill(...col);
  // Left eye: X shape (two rotated bars)
  p.push(); p.translate(-55, -20, 0);
  p.push(); p.rotateZ(Math.PI/4);  p.box(70, 12, 4); p.pop();
  p.push(); p.rotateZ(-Math.PI/4); p.box(70, 12, 4); p.pop();
  p.pop();
  // Right eye: + shape (cross)
  p.push(); p.translate(55, -20, 0);
  p.box(60, 12, 4);
  p.box(12, 60, 4);
  p.pop();
}

//        Voxel X (5  5 diagonal pixels)                                                                                                                                     
function eyesVoxelX(p, col){
  p.fill(...col);
  const cell = 13;
  const drawX = (cx) => {
    p.push(); p.translate(cx, -20, 0);
    for (let i = 0; i < 5; i++){
      for (let j = 0; j < 5; j++){
        if (i === j || i + j === 4){
          p.push(); p.translate((i-2)*cell, (j-2)*cell, 0); p.box(cell, cell, 4); p.pop();
        }
      }
    }
    p.pop();
  };
  drawX(-55);
  drawX( 55);
}

//        Checkerboard 3  3                                                                                                                                                                               
function eyesCheckerboard(p, inverted){
  const cell = 24;
  const drawChecker = (cx) => {
    p.push(); p.translate(cx, -20, 2);
    for (let i = 0; i < 3; i++){
      for (let j = 0; j < 3; j++){
        let isLight = (i + j) % 2 === 0;
        if (inverted) isLight = !isLight;
        p.fill(isLight ? 245 : 10);
        p.push(); p.translate((i-1)*cell, (j-1)*cell, 0); p.box(cell, cell, 4); p.pop();
      }
    }
    p.pop();
  };
  drawChecker(-55);
  drawChecker( 55);
}

//        Solid square                                                                                                                                                                                           
function eyesSolid(p, col){
  p.fill(...col);
  p.push(); p.translate(-55, -20, 0); p.box(52, 52, 4); p.pop();
  p.push(); p.translate( 55, -20, 0); p.box(52, 52, 4); p.pop();
}