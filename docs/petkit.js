/* petkit.js — 真·桌宠引擎（网页版 mini-kit）· 双人待机版
 * 驱动 assets 目录下两个 figure.js 的 createSiyuBody / createLaosunBody：
 * figure.draw(petG, face, frame) 每帧绘制（眨眼/摆臂/挥手由 figure 负责），
 * 外层待机动画与表情特效（腮红/爱心/泪/怒符）由本文件负责。
 * 装扮间为双人待机展示（无按钮）：思语 + 老孙并排站在页面里，
 * 会眨眼、发呆、偷偷做小动作；点击各自有性格化反应。 */
import { createSiyuBody } from './assets/figure/figure.js';
import { createLaosunBody } from './assets/figure-laosun/figure.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs) => {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
};

/* ---------- 表情词典：特效 ----------
 * 脸红已全站移除：原 blush/blushBig 坐标按思语脸位标定，贴到老孙脸上会错位。
 * 现在表情只保留与脸位无关的特效（爱心/泪滴/怒符/Zzz/音符/星星等）。 */
const EXPR_FX = {
  neutral:    [],
  happy:      [],
  wink:       [],
  love:       ['hearts'],
  shy:        [],
  surprised:  ['bang'],
  angry:      ['anger'],
  sad:        ['tears'],
  sleepy:     ['zzz'],
  thinking:   ['question'],
  smug:       ['note'],
  pout:       ['angerSmall'],
  worried:    ['sweat'],
  determined: ['spark'],
  flustered:  ['bang'],
  scared:     ['bang', 'sweat'],
  excited:    ['spark'],
  cry:        ['tearsBig'],
  confused:   ['question', 'sweat'],
  sleep:      ['zzz'],
};

/* ---------- 动作时长 ---------- */
const MOTION_DUR = { wave: 1.8, jump: 0.9, hop: 2, spin: 1.2, dance: 3.5, walk: 4, run: 3, sleep: 6, nod: 1.5, shake: 1.5, bow: 2, shiver: 1.8, dizzy: 2.5, turn: 0.8 };

/* ---------- 双人性格设定 ----------
 * 装扮间回归纯待机：不自动换表情、不自动播动作。
 * 待机表现只保留：眨眼、轻微上下浮动、视线跟随鼠标、真实入睡时的 Zzz。
 * 原有的 idle 表情/动作集一并移除，避免乱跳与表情特效错位。 */
const SIYU_IDLE_FACES = [];
const SIYU_IDLE_MOTIONS = [];
const LAOSUN_IDLE_FACES = [];
const LAOSUN_IDLE_MOTIONS = [];

/* ---------- 特效绘制（logo space 256×256，按思语脸位标定） ---------- */
function makeFx(type) {
  const g = el('g', {});
  const heart = (x, y, s, cls) => {
    const h = el('path', {
      d: 'M0 3 C0 0.8 2.6 0 3.6 1.6 C4.6 0 7.2 0.8 7.2 3 C7.2 5.4 3.6 7.4 3.6 7.4 C3.6 7.4 0 5.4 0 3 Z',
      fill: '#E85D8A', transform: `translate(${x} ${y}) scale(${s})`,
    });
    if (cls) h.setAttribute('class', cls);
    return h;
  };
  if (type === 'hearts') {
    for (let i = 0; i < 3; i++) g.appendChild(heart(148 + i * 9, 30 - i * 7, 1.5 - i * 0.3, 'fx-heart'));
  } else if (type === 'tears' || type === 'tearsBig') {
    const n = type === 'tearsBig' ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const d = el('ellipse', { cx: 104 + i * 3, cy: 99 + i * 2, rx: 2.4, ry: 3.4, fill: '#7FB8E8', opacity: 0.85, class: 'fx-tear' });
      d.style.animationDelay = (i * 0.25) + 's';
      g.appendChild(d);
      if (type === 'tearsBig') {
        const d2 = el('ellipse', { cx: 152 - i * 3, cy: 99 + i * 2, rx: 2.4, ry: 3.4, fill: '#7FB8E8', opacity: 0.85, class: 'fx-tear' });
        d2.style.animationDelay = (i * 0.25 + 0.12) + 's';
        g.appendChild(d2);
      }
    }
  } else if (type === 'sweat') {
    g.appendChild(el('ellipse', { cx: 166, cy: 52, rx: 2.6, ry: 3.8, fill: '#8FC6F0', opacity: 0.9, class: 'fx-tear' }));
  } else if (type === 'anger' || type === 'angerSmall') {
    const s = type === 'anger' ? 1 : 0.7;
    const ax = 170, ay = 26;
    const mk = (dx, dy, rot) => el('path', {
      d: 'M-4 0 L4 0 M0 -4 L0 4', stroke: '#E24B4A', 'stroke-width': 2.6, 'stroke-linecap': 'round', fill: 'none',
      transform: `translate(${ax + dx * s} ${ay + dy * s}) scale(${s}) rotate(${rot})`,
    });
    g.appendChild(mk(0, 0, 45)); g.appendChild(mk(5, 5, 45)); g.appendChild(mk(-5, 5, 45)); g.appendChild(mk(5, -5, 45)); g.appendChild(mk(-5, -5, 45));
    g.setAttribute('class', 'fx-anger');
  } else if (type === 'bang') {
    const t = el('text', { x: 170, y: 36, 'font-size': 26, 'font-weight': 700, fill: '#E2A03C', class: 'fx-z' });
    t.textContent = '!'; g.appendChild(t);
  } else if (type === 'question') {
    const t = el('text', { x: 166, y: 34, 'font-size': 24, 'font-weight': 700, fill: '#7C6BA8', class: 'fx-z' });
    t.textContent = '?'; g.appendChild(t);
  } else if (type === 'zzz') {
    for (let i = 0; i < 3; i++) {
      const t = el('text', { x: 158 + i * 9, y: 38 - i * 9, 'font-size': 13 + i * 4, 'font-weight': 700, fill: '#7C6BA8', class: 'fx-z' });
      t.textContent = 'Z'; t.style.animationDelay = (i * 0.4) + 's';
      g.appendChild(t);
    }
  } else if (type === 'spark') {
    for (let i = 0; i < 3; i++) {
      const s = el('path', {
        d: `M${152 + i * 10} ${26 - i * 6} l2.2 4.6 5 .6 -3.6 3.4 .9 4.9 -4.5 -2.4 -4.5 2.4 .9 -4.9 -3.6 -3.4 5 -.6 Z`,
        fill: '#F5B942', class: 'fx-heart',
      });
      s.style.animationDelay = (i * 0.3) + 's';
      g.appendChild(s);
    }
  } else if (type === 'note') {
    const t = el('text', { x: 164, y: 32, 'font-size': 22, 'font-weight': 700, fill: '#534AB7', class: 'fx-z' });
    t.textContent = '♪'; g.appendChild(t);
  }
  return g;
}

/* ---------- 宠物实例 ---------- */
function createPet(svg, displayH, opts) {
  const root = el('g', { class: 'pet-root' });
  const motion = el('g', { class: 'pet-motion' });
  const petG = el('g', { class: 'pet-pet' });
  const fxG = el('g', { class: 'pet-fx' });
  motion.appendChild(petG); motion.appendChild(fxG); root.appendChild(motion);
  svg.appendChild(root);

  const scale = displayH / 256;
  const baseX = opts.baseX !== undefined ? opts.baseX : 0;
  const baseY = opts.baseY !== undefined ? opts.baseY : 0;
  root.setAttribute('transform', `translate(${baseX} ${baseY}) scale(${scale})`);

  return {
    figure: null, petG, fxG, motion, scale, svg,
    face: 'neutral', mode: 'stand', facing: 1,
    motionT0: -9, motionDur: 0,
    blinkT0: -9, blinkDur: 0.2, blinkNext: 1.2, queueBlink: false,
    faceSwitchT: -9, asleep: false,
    lastIdle: 0, idleNext: opts.idleNext || 6,
    persona: opts.persona || {}, hitEl: null,
    walkPhase: 0, _t: 0,
  };
}

async function mountPet(svg, displayH, opts, createFn, assetBase) {
  const pet = createPet(svg, displayH, opts);
  const kit = { createBody: (host, o) => o.figure };
  pet.figure = await createFn(null, { kit, asset: f => assetBase + f, host: null });
  // 命中热区（figure.hits 提供 logo space 的 [x,y,r]）
  if (pet.figure.hits && pet.figure.hits[0]) {
    const [hx, hy, hr] = pet.figure.hits[0];
    const hit = el('circle', { cx: hx, cy: hy, r: hr + 10, fill: 'transparent', cursor: 'pointer' });
    if (opts.onClick) hit.addEventListener('click', opts.onClick);
    pet.motion.appendChild(hit);
    pet.hitEl = hit;
  }
  return pet;
}

/* 帧驱动 */
function tick(pet, t, dt) {
  const st = pet;
  let blink = 0;
  const bt = t - st.blinkT0;
  if (bt < st.blinkDur) blink = Math.sin(Math.PI * bt / st.blinkDur);
  else if (t >= st.blinkNext) {
    st.blinkT0 = t; st.blinkDur = 0.16 + Math.random() * 0.3;
    st.blinkNext = t + st.blinkDur + (st.queueBlink ? 0.02 : 2.2 + Math.random() * 3);
    st.queueBlink = !st.queueBlink && Math.random() < 0.2;
  }
  const fdt = t - st.faceSwitchT;
  const eyeClose = fdt < 0.3 ? Math.sin(Math.PI * fdt / 0.3) : 0;

  const mk = (t - st.motionT0) / (st.motionDur || 1);
  const k = Math.max(0, Math.min(1, mk));
  let dx = 0, dy = 0, rot = 0, sx = st.facing, gesture = null;

  if (st.asleep) { dy = 6; }
  else if (st.mode === 'jump') dy = -46 * Math.sin(Math.PI * k);
  else if (st.mode === 'hop') dy = -14 * Math.abs(Math.sin(t * 7));
  else if (st.mode === 'spin') rot = 360 * k;
  else if (st.mode === 'dance') { dx = Math.sin(t * 5) * 16; rot = Math.sin(t * 5) * 9; dy = -10 * Math.abs(Math.sin(t * 10)); }
  else if (st.mode === 'walk') { st.walkPhase += dt * 1.6; dx = Math.sin(st.walkPhase) * 20; }
  else if (st.mode === 'run') { st.walkPhase += dt * 3; dx = Math.sin(st.walkPhase) * 24; }
  else if (st.mode === 'nod') rot = Math.sin(t * 9) * 7;
  else if (st.mode === 'shake') dx = Math.sin(t * 18) * 7;
  else if (st.mode === 'bow') rot = 16 * Math.min(k * 2, 1);
  else if (st.mode === 'shiver') dx = (Math.random() - 0.5) * 2.6;
  else if (st.mode === 'dizzy') rot = Math.sin(t * 3.4) * 22;
  else if (st.mode === 'turn') sx = st.facing * Math.cos(Math.PI * k);
  else if (st.mode === 'wave') {
    const gk = k < 0.3 ? k / 0.3 : k < 0.72 ? 1 : Math.max(0, (1 - k) / 0.28);
    gesture = { kind: 'wave', k: gk };
  }
  if (!st.asleep && st.mode !== 'jump' && st.mode !== 'hop' && st.mode !== 'dance') dy += Math.sin(t * 2.4) * 3;

  const frame = { t, blink, eyeClose, face: st.face, mode: st.mode, gesture, sit: 0, talk: 0, drowse: 0, status: '' };
  st.figure.draw(st.petG, st.face, frame);
  // 视线跟随：整组朝鼠标方向微倾（约 ±1.5°）
  const look = st.asleep ? 0 : mouseNX * 1.5;
  const tr = `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${(rot + look).toFixed(2)} 128 256) translate(128 0) scale(${sx} 1) translate(-128 0)`;
  st.motion.setAttribute('transform', tr);

  if (st.mode !== 'stand' && mk >= 1) {
    if (st.mode === 'sleep') setFace(pet, 'neutral', false);
    st.mode = 'stand';
  }
}

function setFace(pet, id, pulse = true) {
  if (!EXPR_FX[id]) return;
  pet.face = id;
  if (pulse) pet.faceSwitchT = pet._t || 0;
  renderFx(pet, id);
}
function renderFx(pet, id) {
  pet.fxG.innerHTML = '';
  for (const f of (EXPR_FX[id] || [])) pet.fxG.appendChild(makeFx(f));
}
function playMotion(pet, id) {
  if (id === 'stand') { pet.mode = 'stand'; pet.asleep = false; return; }
  pet.mode = id; pet.motionT0 = pet._t || 0; pet.motionDur = MOTION_DUR[id] || 2;
  if (id === 'sleep') { pet.asleep = true; setFace(pet, 'sleep', false); }
  else { pet.asleep = false; if (id === 'turn') setTimeout(() => { pet.facing *= -1; }, (MOTION_DUR.turn - 0.1) * 1000); }
  if (id === 'walk' || id === 'run') pet.walkPhase = 0;
}

/* ---------- 页面接入：双人待机 ---------- */
let stagePets = [], smallPet = null, stageBubbleEl = null, bubbleEl = null;
let bubbleTimer = null, stageTimer = null;
let mouseNX = 0;
window.addEventListener('mousemove', e => { mouseNX = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2)); }, { passive: true });

/* 彩蛋：拍照闪白 + 爱心雨 */
function cameraFlash() {
  let f = document.getElementById('flash');
  if (!f) { f = document.createElement('div'); f.id = 'flash'; document.body.appendChild(f); }
  f.classList.add('on');
  setTimeout(() => f.classList.remove('on'), 160);
}
function heartRain() {
  const HEART = 'M0 3 C0 0.8 2.6 0 3.6 1.6 C4.6 0 7.2 0.8 7.2 3 C7.2 5.4 3.6 7.4 3.6 7.4 C3.6 7.4 0 5.4 0 3 Z';
  for (let i = 0; i < 22; i++) {
    const s = document.createElement('span');
    s.className = 'rain-heart';
    const size = 12 + Math.random() * 22;
    s.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 8 8"><path d="${HEART}" fill="${['#E85D8A', '#F591AE', '#D4537E'][i % 3]}"/></svg>`;
    s.style.left = (Math.random() * 96) + 'vw';
    s.style.animationDelay = (Math.random() * 0.5) + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 2400);
  }
}
function bumpClick(pet, goal, onGoal) {
  const now = performance.now();
  if (now - (pet._clickT0 || 0) > 1600) pet._clickN = 0;
  pet._clickT0 = now;
  pet._clickN = (pet._clickN || 0) + 1;
  if (pet._clickN >= goal) { pet._clickN = 0; onGoal(); return true; }
  return false;
}

function sayStage(text, ms) {
  if (!stageBubbleEl) return;
  stageBubbleEl.textContent = text;
  stageBubbleEl.classList.add('show');
  clearTimeout(stageTimer);
  stageTimer = setTimeout(() => stageBubbleEl.classList.remove('show'), ms || 2400);
}
function saySmall(text, ms) {
  if (!bubbleEl) return;
  bubbleEl.textContent = text;
  bubbleEl.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubbleEl.classList.remove('show'), ms || 2600);
}

/* 纯待机模式：不再自动换表情、不再自动播动作。
 * 待机表现完全由 tick() 负责（眨眼、浮动、视线跟随），本函数保留为空以维持调用结构。 */
function idleTick(t) {}

async function boot() {
  stageBubbleEl = document.getElementById('stageBubble');
  bubbleEl = document.getElementById('bubble');
  const stageSvg = document.getElementById('stage');
  const smallSvg = document.getElementById('petSmall');

  // 双人并排：思语（左）+ 老孙（右）
  const siyu = await mountPet(stageSvg, 190, {
    baseX: 25, baseY: 70,
    persona: { idleGap: 4.5 + Math.random() * 3, idleFaces: SIYU_IDLE_FACES, idleMotions: SIYU_IDLE_MOTIONS },
    onClick: () => {
      // 纯待机模式：点击只说话，不切表情、不播动作；连点彩蛋保留爱心雨
      if (bumpClick(siyu, 10, () => { heartRain(); sayStage('满屏的喜欢，接好啦！', 3000); })) return;
      sayStage('你瞅啥！哼，萌妹拯救世界！');
    },
  }, createSiyuBody, 'assets/figure/');

  const laosun = await mountPet(stageSvg, 190, {
    baseX: 160, baseY: 70,
    persona: { idleGap: 7 + Math.random() * 4, idleFaces: LAOSUN_IDLE_FACES, idleMotions: LAOSUN_IDLE_MOTIONS },
    onClick: () => {
      // 纯待机模式：点击只说话，不切表情、不播动作；连点彩蛋保留闪白
      if (bumpClick(laosun, 5, () => { cameraFlash(); sayStage('咔嚓。', 1800); })) return;
      sayStage(['……', '嗯。', '（举了举相机）', '别闹，干活。'][Math.floor(Math.random() * 4)]);
    },
  }, createLaosunBody, 'assets/figure-laosun/');

  stagePets = [siyu, laosun];
  smallPet = await mountPet(smallSvg, 46, { baseX: 0, baseY: 3 }, createSiyuBody, 'assets/figure/');

  window.__pets = { stagePets, smallPet, setFace, playMotion, sayStage, saySmall };
  // 重看出场动画时调用：清残留气泡 + 全员回到干净待机态
  window.__petReset = () => {
    clearTimeout(bubbleTimer); clearTimeout(stageTimer);
    if (bubbleEl) bubbleEl.classList.remove('show');
    if (stageBubbleEl) stageBubbleEl.classList.remove('show');
    for (const p of stagePets.concat(smallPet ? [smallPet] : [])) {
      if (!p) continue;
      p.asleep = false; p.mode = 'stand'; p.motionDur = 0; p.motionT0 = -9;
      setFace(p, 'neutral', false);
    }
  };
  window.__petTickOnce = () => {
    const t = performance.now() / 1000;
    for (const p of stagePets) tick(p, t, 0.016);
    if (smallPet) tick(smallPet, t, 0.016);
  };

  // 任务栏思语点击反应：只说话 + 轻微弹一下，不切表情、不播动作、不脸红
  const petBtn = document.getElementById('petBtn');
  if (petBtn) {
    petBtn.addEventListener('click', () => {
      petBtn.classList.remove('bounce'); void petBtn.offsetWidth; petBtn.classList.add('bounce');
      saySmall('你瞅啥！哼，萌妹拯救世界！');
    });
  }
  const pokeBtn = document.getElementById('pokeBtn');
  if (pokeBtn) {
    pokeBtn.addEventListener('click', () => {
      sayStage('哇！被你戳了一下，好痒！');
    });
  }

  // 深夜问候
  const h = new Date().getHours();
  if (h >= 23 || h < 5) setTimeout(() => saySmall('这么晚了还不睡？本小姐陪你，萌妹拯救世界前先睡觉！'), 2500);

  // 页面隐藏时全员睡觉，回来唤醒
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      for (const p of stagePets.concat([smallPet])) if (p) { p.asleep = true; setFace(p, 'sleep', false); }
    } else {
      for (const p of stagePets.concat([smallPet])) if (p) { p.asleep = false; setFace(p, 'neutral', false); }
      saySmall('回来啦！萌妹拯救世界！');
    }
  });

  // 渲染循环
  let last = performance.now();
  function loop(now) {
    const t = now / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const p of stagePets) { p._t = t; tick(p, t, dt); }
    if (smallPet) { smallPet._t = t; tick(smallPet, t, dt); }
    idleTick(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
