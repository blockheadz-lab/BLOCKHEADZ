import { state } from '../state.js';
import { WALK } from '../constants.js';
import { t } from '../state.js';

export function drawLegs(p) {
  const spread      = 92;
  const hipY        = 196;
  const heelZ       = 0;
  const FORWARD_SIGN = -1;

  const SW  = 90;
  const SL  = 210;
  const TOE_FLARE = 12;

  const OUTSOLE_H  = 16;
  const MIDSOLE_H  = 13;
  const MIDSOLE2_H = 9;
  const UPPER_H    = 16;
  const CUFF_H     = 14;
  const TOE_H      = 18;
  const TOE_Z_OFFSET = SL * 0.28;

  const SHOE_TOTAL_H = OUTSOLE_H + MIDSOLE_H + MIDSOLE2_H + UPPER_H; // ~54

  function boot(cx, dir, mainCol) {
    const ph = t * WALK.speed + (dir > 0 ? 0 : Math.PI);
    const s  = Math.sin(ph);   // -1 to 1, smooth
    const c  = Math.cos(ph);

    //        Lift: only positive half of sin     smooth parabolic step up then down
    // Use smoothstep-like curve: lift = max(0, sin)^1.4 for rounded apex
    const liftRaw   = Math.max(0, s);
    const stepLift  = Math.pow(liftRaw, 1.3) * WALK.lift;

    //        Stride: full sin wave, smooth forward/back
    const stepZ     = FORWARD_SIGN * s * WALK.stride;

    //        Toe roll: foot pitches forward on lift, flat on plant
    // Positive = toe up (heel strike feel), negative = toe point (push-off)
    const footPitch = liftRaw * 0.18 * FORWARD_SIGN - Math.max(0, -s) * 0.08 * FORWARD_SIGN;

    //        Subtle outward yaw on swing
    const yaw = dir * 0.015 * liftRaw;

    //        Foot Y: always sits on tile surface (local Y=0 of platform)
    // hipY is constant; lift raises foot above ground
    const footY = hipY - OUTSOLE_H * 0.5 - stepLift;

    p.push();
    p.translate(cx, footY, heelZ + stepZ);
    p.rotateY(yaw);
    p.rotateX(footPitch);
    p.noStroke();

    // 1. Outsole
    p.fill(...state.outsoleColor);
    p.box(SW + 10, OUTSOLE_H, SL + 10);

    // 2. Midsole
    p.fill(...state.midsoleColor);
    p.push(); p.translate(0, -(OUTSOLE_H/2 + MIDSOLE_H/2), 0);
    p.box(SW + 6, MIDSOLE_H, SL + 6); p.pop();

    // 3. Second midsole stripe
    const accentCol = state.outsoleColor.map((c,i) =>
      Math.min(255, c + (state.midsoleColor[i] - c) * 0.5));
    p.fill(...accentCol);
    p.push(); p.translate(0, -(OUTSOLE_H/2 + MIDSOLE_H + MIDSOLE2_H/2), 0);
    p.box(SW + 2, MIDSOLE2_H, SL + 2); p.pop();

    const upperBase = -(OUTSOLE_H/2 + MIDSOLE_H + MIDSOLE2_H);

    // 4. Upper
    p.fill(...mainCol);
    p.push(); p.translate(0, upperBase - UPPER_H/2, 0);
    p.box(SW - 4, UPPER_H, SL - 18); p.pop();

    // 5. Toe box
    p.fill(...state.toeColor);
    p.push(); p.translate(0, upperBase - TOE_H/2, TOE_Z_OFFSET);
    p.box(SW + TOE_FLARE, TOE_H + 8, SL * 0.38); p.pop();

    // 6. Toe cap top
    const darkToe = state.toeColor.map(c => Math.max(0, c - 40));
    p.fill(...darkToe);
    p.push(); p.translate(0, upperBase - TOE_H - 4, TOE_Z_OFFSET + 4);
    p.box(SW + TOE_FLARE - 4, 6, SL * 0.30); p.pop();

    // 7. Ankle collar
    p.fill(...state.collarColor);
    p.push(); p.translate(0, upperBase - UPPER_H - CUFF_H/2 + 4, -SL * 0.08);
    p.box(SW - 12, CUFF_H, SL * 0.55); p.pop();

    p.pop();
  }

  boot(-spread, -1, state.shoeLeft);
  boot( spread,  1, state.shoeRight);
}