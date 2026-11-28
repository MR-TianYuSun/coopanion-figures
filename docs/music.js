/* music.js — 背景音乐控制：主题曲《镜头之外的光》（本人原创短剧《老板回来了》主题曲，Suno 生成）
 * 自动播放优先：加载即尝试播（带淡入）；浏览器拦截则降级到首次用户交互立即续上。
 * 用户手动暂停后本次会话不再自动恢复；切走标签页暂停。 */
(function () {
  const audio = document.getElementById('bgm');
  const button = document.getElementById('musicBtn');
  if (!audio || !button) return;
  const label = button.querySelector('.music-label');
  const VOLUME = 0.35;
  let playing = false;
  let userPaused = false;   // 本次会话用户主动暂停过，不再自动续播
  let needsGesture = false; // 自动播放被浏览器拦截，等首次交互
  let fadeToken = 0;

  /* 基于真实时间计算进度：后台标签页定时器被节流到 1 秒/次时也不会拖慢整个淡入淡出 */
  function fade(to, ms, done) {
    const token = ++fadeToken;
    const from = audio.volume;
    const start = performance.now();
    const step = () => {
      if (token !== fadeToken) return;
      const k = Math.min(1, (performance.now() - start) / ms);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) setTimeout(step, 50);
      else if (done) done();
    };
    step();
  }
  function paint(on) {
    button.classList.toggle('playing', on);
    if (label) label.textContent = on ? '播放中' : '主题曲';
    button.title = on ? '暂停主题曲《镜头之外的光》' : '播放主题曲《镜头之外的光》';
  }
  function play(isAuto) {
    audio.volume = 0;
    const p = audio.play();
    if (p && p.catch) {
      p.catch(() => {
        playing = false; paint(false);
        if (isAuto) {
          needsGesture = true; // 被浏览器拦截：挂起等待首次交互
        }
      });
    }
    playing = true; paint(true);
    fade(VOLUME, isAuto ? 1400 : 900);
    if (!isAuto) userPaused = false;
    try { localStorage.setItem('bgmOn', '1'); } catch (e) {}
  }
  function pause(byUser) {
    fade(0, 500, () => audio.pause());
    playing = false; paint(false);
    needsGesture = false;
    if (byUser) userPaused = true;
    try { localStorage.setItem('bgmOn', '0'); } catch (e) {}
  }
  button.addEventListener('click', () => {
    if (playing) pause(true);
    else { needsGesture = false; userPaused = false; play(false); }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) audio.pause();
    else if (!document.hidden && playing && !userPaused) audio.play().catch(() => {});
  });

  /* 首次交互兜底：自动播放被浏览器拦截时，用户第一次点/按键/触摸立即续上 */
  const resume = (e) => {
    if (!needsGesture || userPaused || playing) return;
    if (e && e.target && button.contains(e.target)) return; // 音乐按钮自己的点击由它自己的 handler 处理
    needsGesture = false;
    play(false);
  };
  ['click', 'keydown', 'touchstart'].forEach(evt =>
    document.addEventListener(evt, resume, { passive: true }));

  /* 加载即尝试自动播；被拦则等首次交互（见上） */
  window.addEventListener('load', () => {
    if (userPaused) return;
    play(true);
  });

  window.__music = {
    play: play, pause: pause,
    get playing() { return playing; },
    get needsGesture() { return needsGesture; },
  };
})();
