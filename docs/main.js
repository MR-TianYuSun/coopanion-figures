/* 开机层流程：BIOS → 视频 → 海报 → 桌面 */
const boot = document.getElementById('boot');
const desktop = document.getElementById('desktop');
const video = document.getElementById('introVideo');
const skipBtn = document.getElementById('skipBtn');
const posterHold = document.getElementById('posterHold');
const replayBtn = document.getElementById('replayBtn');
const bios = document.getElementById('bios');
const biosLines = document.getElementById('biosLines');
const biosFill = document.getElementById('biosFill');

let bootStage = 'bios'; // bios -> video -> poster -> done
let biosTimer = null;
let posterTimer = null;
let bootRunning = false;
let ioStarted = false;

const BIOS_TEXT = [
  'Coopanion BIOS v4.2 — Cortico World',
  'Memory check .............. OK',
  'Loading siyu.exe .......... OK',
  'Loading laosun.dll ........ OK',
  'Mounting dress-up room .... OK',
  'Desktop ready.',
];

function runBios(onDone) {
  bios.classList.remove('off');
  biosLines.textContent = '';
  biosFill.style.width = '0%';
  let i = 0;
  const step = () => {
    if (biosStageDone) return;
    if (i >= BIOS_TEXT.length) {
      bios.classList.add('off');
      onDone();
      return;
    }
    biosLines.textContent += BIOS_TEXT[i] + '\n';
    biosFill.style.width = Math.round(((i + 1) / BIOS_TEXT.length) * 100) + '%';
    i++;
    biosTimer = setTimeout(step, 235);
  };
  step();
}
let biosStageDone = false;
function skipBios() { biosStageDone = true; clearTimeout(biosTimer); bios.classList.add('off'); }

function showPoster() {
  bootStage = 'poster';
  video.style.visibility = 'hidden';
  posterHold.classList.add('show');
  clearTimeout(posterTimer);
  posterTimer = setTimeout(finishBoot, 2800);
}
function finishBoot() {
  clearTimeout(posterTimer);
  bootStage = 'done';
  biosStageDone = true; clearTimeout(biosTimer);
  bootRunning = false;
  bios.classList.add('off');
  boot.classList.add('hide');
  desktop.classList.add('show');
  try { localStorage.setItem('visited', '1'); } catch (e) {}
  startReveal();
}
function startBoot() {
  biosStageDone = false;
  bootStage = 'video';
  boot.classList.remove('hide');
  desktop.classList.remove('show');
  video.style.visibility = 'visible';
  posterHold.classList.remove('show');
  video.currentTime = 0;
  video.play().catch(() => showPoster());
}
function fullBoot() {
  if (bootRunning) return; // 防连点：BIOS 打字链并行会导致文字重复
  bootRunning = true;
  bootStage = 'bios';
  biosStageDone = false;              // 关键：上次 boot 结束时被置 true，不重置则 BIOS 打字直接 return、重放整段卡死
  boot.classList.remove('hide');      // 关键：重放时 boot 层还带着上次的 hide（透明），不移除 BIOS 会整段被吞
  desktop.classList.remove('show');
  if (window.__petReset) window.__petReset(); // 桌宠回到待机、清掉残留气泡
  runBios(startBoot);
}

video.addEventListener('ended', showPoster);
skipBtn.addEventListener('click', () => { if (bootStage === 'bios') { skipBios(); startBoot(); } else finishBoot(); });
replayBtn.addEventListener('click', () => { try { localStorage.removeItem('visited'); } catch (e) {} fullBoot(); });

// 首访走完整 BIOS + 视频，回访直接进桌面
try {
  if (localStorage.getItem('visited')) { finishBoot(); } else { fullBoot(); }
} catch (e) { fullBoot(); }

/* 滚动渐入（桌面显示后启动） */
function startReveal() {
  if (ioStarted) return;
  ioStarted = true;
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.section').forEach(s => io.observe(s));
}

/* 时钟：日期 + 时间 */
const clock = document.getElementById('clock');
function tick() {
  const d = new Date();
  const p2 = n => String(n).padStart(2, '0');
  clock.textContent = (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
}
tick(); setInterval(tick, 30000);

/* 深夜调色（23:00~05:00 壁纸转深蓝紫） */
(function () {
  const KEY = 'coopanion-night';
  let pref = null;
  try { pref = localStorage.getItem(KEY); } catch (e) {}
  if (pref === 'on') document.body.classList.add('night');
  else if (pref === 'off') document.body.classList.remove('night');
  else {
    const h = new Date().getHours();
    if (h >= 23 || h < 5) document.body.classList.add('night');
  }
  const btn = document.getElementById('nightBtn');
  function sync() { if (btn) btn.classList.toggle('on', document.body.classList.contains('night')); }
  sync();
  if (btn) btn.addEventListener('click', () => {
    const on = document.body.classList.toggle('night');
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
    sync();
  });
})();

/* 翻转卡 */
document.querySelectorAll('.flip').forEach(f => f.addEventListener('click', () => f.classList.toggle('on')));

/* 插件弹窗 */
const PLUGINS = {
  siyu: {
    title: 'AI 超级分身辅助 · v0.1.3',
    desc: '把需求转交给本机运行的 WorkBuddy 干活，还能看屏幕、听会议、出看板——桌宠的四肢。',
    tools: [
      ['workbuddy_send', '把需求原样转交 WorkBuddy 执行，干完自动回传结果'],
      ['screen_read', '屏幕伴读，直接读取屏幕文字，不靠猜'],
      ['meeting_transcribe', '会议录音转文字，自动整理成纪要'],
      ['dashboard_refresh', '一键生成项目看板 dashboard.html'],
    ],
  },
  ima: {
    title: 'IMA 知识库',
    desc: '接通个人知识库，489 条项目、作品与资产资料随查随记——桌宠的记忆。',
    tools: [
      ['ima_search', '知识库语义检索，先查内部再联网'],
      ['ima_read', '按 media_id 读取条目正文'],
      ['ima_note_create / append', '笔记创建与修订追加'],
      ['ima_kb_import_urls', '网页一键入库'],
      ['ima_log_append', '每天自动写工作日志'],
      ['ima_kb_health', '知识库体检：重复、空目录、标签覆盖'],
    ],
  },
  wechat: {
    title: '微信发送助手',
    desc: '在已登录的微信里真实发消息——桌宠的嘴，替你捎话。',
    tools: [
      ['wechat_send', '搜索联系人并发送消息，说给谁发什么就行'],
      ['联系人纠错', '语音转写错字自动修正，失败给候选名单重试'],
      ['群聊拦截', '默认只发个人，明确要求发群才放行'],
      ['敏感内容确认', '金额 / 地址 / 承诺类正文先复述确认再发'],
    ],
  },
};
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
document.querySelectorAll('.win-card').forEach(card => {
  card.addEventListener('click', () => {
    const p = PLUGINS[card.dataset.plugin];
    if (!p) return;
    modalTitle.textContent = p.title;
    modalBody.innerHTML = '<p class="desc">' + p.desc + '</p><ul>' +
      p.tools.map(t => '<li><b>' + t[0] + '</b>' + t[1] + '</li>').join('') + '</ul>';
    modal.classList.remove('hidden');
  });
});
document.getElementById('modalClose').addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

/* 锚点跳转 */
document.querySelectorAll('[data-goto]').forEach(b => {
  b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.goto);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

/* 页面跳转（算法公开页等） */
document.querySelectorAll('[data-goto-page]').forEach(b => {
  b.addEventListener('click', () => { location.href = b.dataset.gotoPage; });
});

/* 开始菜单 */
const startBtn = document.getElementById('startBtn');
const startMenu = document.getElementById('startMenu');
startBtn.addEventListener('click', e => {
  e.stopPropagation();
  startMenu.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!startMenu.contains(e.target) && e.target !== startBtn) startMenu.classList.remove('open');
});
startMenu.querySelectorAll('.sm-item').forEach(item => {
  item.addEventListener('click', () => {
    startMenu.classList.remove('open');
    if (item.dataset.goto) {
      const el = document.getElementById(item.dataset.goto);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    if (item.dataset.gotoPage) location.href = item.dataset.gotoPage;
  });
});

/* OS 系统通知：提醒 Coopanion 桌宠软件（每次会话弹一次） */
const osNotify = document.getElementById('osNotify');
function showNotify() {
  let shown = false;
  try { shown = sessionStorage.getItem('softNotified') === '1'; } catch (e) {}
  if (shown) return;
  osNotify.classList.add('show');
  try { sessionStorage.setItem('softNotified', '1'); } catch (e) {}
}
function hideNotify() { osNotify.classList.remove('show'); }
document.getElementById('notifyClose').addEventListener('click', hideNotify);
document.getElementById('notifyLater').addEventListener('click', hideNotify);
osNotify.querySelector('.on-btn.main').addEventListener('click', () => {
  hideNotify();
  const el = document.getElementById('soft');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
});
setTimeout(() => { if (bootStage === 'done') showNotify(); else { const w = setInterval(() => { if (bootStage === 'done') { clearInterval(w); showNotify(); } }, 400); setTimeout(() => clearInterval(w), 12000); } }, 6000);
setTimeout(() => { if (osNotify.classList.contains('show')) osNotify.classList.add('soft'); }, 18000);

/* 分享小站：复制链接 */
const shareBtn = document.getElementById('shareBtn');
shareBtn.addEventListener('click', async () => {
  const url = location.href.split('?')[0];
  let ok = false;
  try { await navigator.clipboard.writeText(url); ok = true; } catch (e) {}
  if (!ok) {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ok = true; } catch (e) {}
    ta.remove();
  }
  const old = shareBtn.textContent;
  shareBtn.textContent = ok ? '链接已复制 ✓' : '复制失败，请手动复制';
  setTimeout(() => { shareBtn.textContent = old; }, 1800);
});

/* 背景音乐已拆到 music.js 独立模块（避免与主脚本全局作用域冲突） */

/* 桌宠交互已由 petkit.js 接管（真·桌宠引擎）：双人待机 / 点击反应 / 视线跟随 / 彩蛋 */
