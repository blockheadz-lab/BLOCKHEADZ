import { state, DEMO_ROBOTS, applyDemoRobot } from './state.js';

let active = 0;

const CSS = `
:root{--pix:'Courier New',monospace;--line:rgba(255,255,255,.16);--txt:#f5f5f5;--muted:#8b94a7}
#bhzConsole{position:fixed;right:18px;top:18px;width:300px;max-width:calc(100vw - 36px);z-index:50;border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,rgba(18,22,31,.78),rgba(4,6,10,.70));backdrop-filter:blur(14px);color:var(--txt);font-family:var(--pix);box-shadow:0 22px 58px rgba(0,0,0,.45);overflow:hidden}
#bhzConsole *{box-sizing:border-box}
.bhzHead{padding:14px 14px 12px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.bhzTitle{font-size:14px;font-weight:800;letter-spacing:.12em}
.bhzSub{margin-top:6px;color:var(--muted);font-size:9px;letter-spacing:.06em}
.bhzBadge{font-size:9px;border:1px solid var(--line);border-radius:999px;padding:6px 8px;color:#111;background:#f5f5f5;font-weight:800}
.bhzGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px;border-bottom:1px solid var(--line)}
.bhzBtn{height:42px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.04);color:var(--txt);font:800 11px/1 var(--pix);cursor:pointer}
.bhzBtn.on{background:#f5f5f5;color:#111;border-color:transparent}
.bhzName{padding:14px 12px 4px;text-align:center;font-size:15px;font-weight:800;letter-spacing:.12em}
.bhzNote{padding:8px 14px 14px;text-align:center;font-size:9px;color:var(--muted);line-height:1.45}
@media(max-width:700px){#bhzConsole{left:12px;right:12px;top:auto;bottom:12px;width:auto}.bhzSub{display:none}.bhzNote{display:none}}
`;

function injectStyle(){
  const tag = document.createElement('style');
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

function refresh(){
  document.querySelectorAll('.bhzBtn').forEach((b, i)=>b.classList.toggle('on', i === active));
  const el = document.getElementById('bhzCharacterName');
  if (el) el.textContent = state.demoCharacter;
}

function selectRobot(i){
  active = i;
  applyDemoRobot(i);
  refresh();
  if (typeof window.loop === 'function') window.loop();
}

function build(){
  injectStyle();
  const panel = document.createElement('aside');
  panel.id = 'bhzConsole';
  panel.innerHTML = `
    <div class="bhzHead">
      <div>
        <div class="bhzTitle">BLOCKHEADZ</div>
        <div class="bhzSub">PUBLIC CONSOLE DEMO</div>
      </div>
      <div class="bhzBadge">DEMO</div>
    </div>
    <div class="bhzGrid">
      ${DEMO_ROBOTS.map((r,i)=>`<button class="bhzBtn" data-i="${i}" title="${r.name}">0${i+1}</button>`).join('')}
    </div>
    <div class="bhzName" id="bhzCharacterName">${state.demoCharacter}</div>
    <div class="bhzNote">Three public-safe characters. No final trait list exposed.</div>
  `;
  document.body.appendChild(panel);
  panel.querySelectorAll('.bhzBtn').forEach(btn=>btn.addEventListener('click',()=>selectRobot(Number(btn.dataset.i))));
  window.addEventListener('blockheadz:demo-change', refresh);
  refresh();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
else build();

window.__selectBlockHeadzDemo = selectRobot;
