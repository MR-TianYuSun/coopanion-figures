/**
 * 思语 · 桌宠形象包（新部件版 v4.2 · 拆臂版 · 当前默认生效）
 *
 * ★ v4.2 变更（用户提供了新的衣服拆分）：
 *   衣服从「含袖开衫」拆成三件：body.png（无袖主衣身 221×294）+
 *   arm_left.png（左臂 85×323）+ arm_right.png（右臂 80×284，即梦图预缩放 1.02）。
 *   手臂自带完整泡泡袖+袖口+手 → 之前的「手悬空」问题自然消失，
 *   并解锁真正的绕肩动画：走路/跑步双臂前后摆，wave 接管为自定义挥手。
 *   坐标由多尺度掩码模板匹配 + 局部锚点（手掌/扣子）+ 视觉仲裁定位：
 *   - 左臂 (371,380) s1.0（三种方法一致，平均差 6.79）
 *   - 右臂 (579,396) s1.02（差分搜索偏移被否，视觉仲裁为准）
 *   - 主衣 (398,325) s1.0（±3px 网格稳定）
 *   图层（顶→底）：头 > 手臂 > 主衣身 > 裙 > 双脚（袖山必须压住衣肩线）。
 *
 * ★ v4.1 变更：
 *   1) 还原坐标：撤回「身体群统一左移 11px」——它破坏了头/衣领/脖子的
 *      相对衔接（脖子错位）。恢复为左移前坐标。
 *   2) 移除 groupTilt()：随上一版一并撤回，回到 kit 默认整组倾斜行为。
 *   3) 眨眼改用 kit 官方平滑信号 frame.blink / frame.eyeClose，删除自造
 *      取模状态机（相位随周期 T 每帧变化 → 反复跳进闭眼窗口 → 眼睛抽搐）。
 *
 * ★ 部件来源：E:/Ai漫剧制作/数字IP/零部件/ 的透明 PNG（tex2/），
 *   由用户提供的成品图（成品.png 1024×1024）反推坐标：
 *   图层从顶到底：头 > 手臂 > 衣服 > 裙子 > 双脚
 *
 * ★ 1024 空间 → 256 logo space 换算：
 *   角色 bbox x[296,670] y[12,983]，高 971；s = 256/971 = 0.263646
 *   out_x = 128 - (483 - part_x)*s（身体中轴 483 对齐 128）
 *   out_y = (part_y - 12)*s（头顶 12 对齐 0，脚底 983 对齐 256）
 *
 * 已核实的契约（来自 Coopanion 源码 body.js，非推测）：
 * - 工厂签名 factory(base, { model, scheme, kit, loadImage, asset, host })
 * - petG 是 SVG <g>，logo space 256×256，脚底 y=256，朝右；kit 每帧写 transform
 * - figure.draw(petG, face, frame) 每帧调用（静止也调），只应改动变化的部分
 * - frame 可用字段：face mode modeT t blink eyeClose sit(0..1) talk drowse
 *   tilt lean groupRot swing facing gesture look status 等
 * - frame.blink   = 0→1→0 半正弦闭眼量（1=完全闭眼），随机间隔 2.2~5.2s，
 *                   20% 概率 0.28s 连眨，持续 bd=.16+.3*drowse 秒（源码 723 行）
 * - frame.eyeClose = 表情切换瞬间的短暂闭眼量（0..1，1=闭眼，源码 724~726 行）
 * - figure.gestures = ['wave'] 接管短手势：kit 不再画默认 wave 整组动画，
 *   frame.gesture = { kind:'wave', k:0..1 }（k 先升到 1、hold、再回 0，源码 128 行）
 */

const SVGNS = 'http://www.w3.org/2000/svg';

/**
 * 部件在 logo space 的框（256×256，脚底 y=256，中心 x=128）。
 * 由 1024 成品反推坐标 × 0.263646 换算；换图后需按同法重算。
 * ★ 本组为「左移前」正确坐标，头/衣领/脖子衔接已由成品图验证，勿再整体平移。
 */
const LAYOUT = {
  // ★ 腿图顶部已延展 12px 纯肤色（tex2/leg_*.png，原图备份 *_orig.png）：
  //   藏在裙摆下作旋转储备，走路摆腿多大幅度裙沿处都有皮肤，不露大腿切口。
  //   y 在原基础上 -12px（补偿延展）再 -3px（整体上移防穿帮），脚底离地 3~6px。
  leg_left:   { x: 115, y: 170, w: 30, h: 83 },  // 画面左腿+白袜+棕鞋（角色右脚）
  leg_right:  { x: 135, y: 169, w: 28, h: 81 },  // 画面右腿+白袜+棕鞋（角色左脚）
  skirt:      { x: 107, y: 147, w: 65, h: 41 },  // 深灰百褶裙（盖住腿顶与衣摆）
  // ★ v4.2 拆臂三件：坐标由成品图反推（掩码模板匹配 + 手掌/扣子锚点 + 视觉仲裁）
  body:       { x: 105.6, y: 82.5, w: 58.3, h: 77.5 },  // 无袖主衣身（含领口扣子列）
  arm_left:   { x: 98.5,  y: 97.0, w: 22.4, h: 85.2 },  // 左臂整条（泡泡袖+袖口+手，压衣身）
  arm_right:  { x: 153.3, y: 101.2, w: 21.1, h: 74.9 }, // 右臂整条（预缩放 1.02 后 80×284）
  // ★ 头底图 = 闭眼版（tex2/head_closed.png，即梦局部重绘产物，与原睁眼版逐像素差 0.29）
  //   睁眼 = 双眼贴片常驻叠其上；眨眼 = 撤贴片露出闭眼底图；wink = 撤单只。
  head:       { x: 79,  y: 0,   w: 99, h: 153 },
  // 眼贴片：模板匹配定位（左眼@172,197 / 右眼@288,193，374 头图内偏移）
  //   256 坐标 = 头部件位置(79,0) + 头图内偏移 × 头缩放(99/374, 153/581)
  eye_left:   { x: 124.5, y: 51.9, w: 16.1, h: 11.1 },  // 睁眼左（画面左）
  eye_right:  { x: 155.2, y: 50.8, w: 12.4, h: 11.1 },  // 睁眼右（画面右）
};

/** 叠放顺序（由后到前）：左脚 > 右脚 > 裙 > 主衣身 > 双臂 > 头 > 眼
 *  v4.1 修正：角色右脚（画面左鞋 leg_left）压住角色左脚（画面右鞋 leg_right）。 */
const VISIBLE = ['leg_right', 'leg_left', 'skirt', 'body', 'arm_left', 'arm_right', 'head', 'eye_left', 'eye_right'];

/** 手臂旋转轴 = 真肩关节，256 space。
 *  ★ 轴的演进（踩坑记录）：
 *    ① 臂框顶部中心 → wave 大角度旋转袖山被甩离肩，臂根像从腰长出（穿模）；
 *    ② 袖山最宽处（逐行宽度扫描）→ 仍在胸口（y≈128），举起臂根依旧脱位：
 *       新臂图的袖山弧画得肥长（膨胀段约 110px/1024），最宽处远低于真肩；
 *    ③ 真肩关节（当前）→ 由肩部标尺特写实测：肩线 y≈380~395、肩关节 y≈425
 *       （1024 空间），换算 256：y=(425-12)*0.263646≈108.9 / 108.1。
 *       袖山大弧（跨度≈29px@256）正好包住该点，旋转任意角度袖山都盖住肩区。
 *  arm_left  = 1024(415,425) → 256(110.1, 108.9)
 *  arm_right = 1024(647,425) → 256(161.9, 108.1) */
const PIVOT = {
  arm_left:  { x: 110.1, y: 108.9 },
  arm_right: { x: 161.9, y: 108.1 },
};

/** 整头表情图（feat/*.png）接入方式（未出图，预留）：
 *  出图后加回表情切换：表情词命中时把 parts.head 的 href 换成 feat/<词>.png，
 *  并把双眼贴片 opacity 置 0（整头表情自带眼睛，避免贴片盖在表情图上重影）。 */

export async function createSiyuBody(base, { kit, asset, host }) {
  const el = (tag, attrs) => {
    const node = document.createElementNS(SVGNS, tag);
    for (const k in attrs) node.setAttribute(k, String(attrs[k]));
    return node;
  };

  const parts = {};
  let bodyRoot = null;

  function buildParts(petG) {
    if (bodyRoot) return;
    bodyRoot = el('g', { class: 'siyu-body' });
    for (const name of VISIBLE) {
      const b = LAYOUT[name];
      // head 用闭眼底图；其余（含双眼贴片）按部件名取文件
      const file = name === 'head' ? 'tex2/head_closed.png' : `tex2/${name}.png`;
      const img = el('image', {
        href: String(asset(file)),
        x: b.x, y: b.y, width: b.w, height: b.h,
        // LAYOUT 宽高比与原图部件一致，用 none 精确贴合、避免舍入留白
        preserveAspectRatio: 'none',
      });
      parts[name] = img;
      bodyRoot.appendChild(img);
    }
    petG.appendChild(bodyRoot);
  }

  // 缓存上一帧状态，只写变化的属性（README 明确要求）
  const last = { legRot: null, armL: null, armR: null, eyeL: null, eyeR: null };

  const figure = {
    extent: [79, 0, 178, 256],
    hits: [[128, 120, 55]],
    anchors: {
      look: [128, 82],
      tears: [[108, 98], [148, 98]],
      z: [168, 30],
      heart: [160, 36],
      bubble: [128, 10],
    },
    colors: { z: '#7C6BA8' },

    // ★ 不再覆盖 groupTilt：v4.0 的整组倾斜覆盖已随「身体左移」一并撤回。
    //   若日后需要修倾听状态 -7° 站歪，可单独加回 groupTilt（纯角度、不动坐标、
    //   不影响头颈衔接），但不要与坐标平移捆绑。

    // ★ 接管 wave：kit 不再画默认整组挥手动画，由本 figure 从 frame.gesture 自画
    //   （body.js:128 —— figure.gestures 列出的短手势交给 figure，frame.gesture={kind,k}）
    gestures: ['wave'],

    draw(petG, face, frame) {
      buildParts(petG);

      // 1) 眨眼 + wink + 睡觉（差分贴片法）：双眼贴片常驻=睁眼，opacity 0=闭眼露出底图。
      //    ★ 闭眼量直接取 kit 官方平滑信号，不再自造周期：
      //      frame.blink    = 0→1→0 半正弦，1=完全闭眼，随机 2.2~5.2s（20% 连眨 0.28s），
      //                      持续 .16~.46s，犯困更慢 —— 自然节奏，不会抽搐；
      //      frame.eyeClose = 表情切换瞬间的短暂闭眼（0..1），让换脸藏在眨眼下。
      //    睡着（kit faceName: mode==='sleep' → 'sleep'）整段闭眼：撤双眼贴片露出
      //    闭眼底图，零出图修复「睡着还睁眼」。wink 词触发：画面左眼常闭。
      const b = Math.max(0, Math.min(1, frame.blink || 0));
      const e = Math.max(0, Math.min(1, frame.eyeClose || 0));
      const closed = Math.max(b, e);                       // 1 = 完全闭眼
      const sleeping = frame.face === 'sleep' || frame.mode === 'sleep';
      const openL = sleeping ? 0 : frame.face === 'wink' ? 0 : 1 - closed;
      const openR = sleeping ? 0 : 1 - closed;
      // 量化到 0.02 步进 + last 缓存：只在值真正变化时写 DOM，避免每帧重排
      const qL = Math.round(openL * 50) / 50;
      const qR = Math.round(openR * 50) / 50;
      if (qL !== last.eyeL) { parts.eye_left.style.opacity = qL; last.eyeL = qL; }
      if (qR !== last.eyeR) { parts.eye_right.style.opacity = qR; last.eyeR = qR; }

      // 2) 腿：walk/run 绕髋摆动（轴藏裙下）；3) 臂：walk/run 绕肩摆动 + wave 自定义挥手。
      //    腿顶藏在裙摆之下（裙层在腿上），绕髋旋转不露空。
      //    手臂自带完整袖子、绕肩点（袖山顶部中心）旋转：袖山是圆弧布料，
      //    小幅摆动仍覆盖肩线，不露缝。
      const moving = frame.mode === 'walk' || frame.mode === 'run';
      const amp = frame.mode === 'run' ? 10 : 6;
      const swing = moving ? Math.sin(frame.t * (frame.mode === 'run' ? 12 : 8)) * amp : 0;
      const armRot = Math.round(swing);                    // 双臂摆动基准角（左右反向）
      const legAmp = frame.mode === 'run' ? 1.8 : 1.5;
      const legRot = moving ? Math.round(swing * legAmp) : 0;
      // wave：k 先升到 1、hold、再回 0。右臂从垂下位置逆时针举向画面右上
      // （SVG rotate 负角=逆时针），举起后 ±12° 挥动，k→0 时顺原路收回。
      let waveRot = null;
      if (frame.gesture && frame.gesture.kind === 'wave') {
        const k = Math.max(0, Math.min(1, frame.gesture.k || 0));
        if (k > 0.01) waveRot = Math.round(-138 * k + Math.sin(frame.t * 10) * 12 * k);
      }
      const rotL = moving ? -armRot : 0;
      const rotR = waveRot !== null ? waveRot : (moving ? armRot : 0);
      if (rotL !== last.armL || rotR !== last.armR || legRot !== last.legRot) {
        const pl = PIVOT.arm_left, pr = PIVOT.arm_right;
        parts.arm_left.setAttribute('transform', `rotate(${rotL} ${pl.x} ${pl.y})`);
        parts.arm_right.setAttribute('transform', `rotate(${rotR} ${pr.x} ${pr.y})`);
        // 腿绕髋（腿顶部中心、藏在裙下）前后交叉摆
        const ll = LAYOUT.leg_left, lr = LAYOUT.leg_right;
        parts.leg_left.setAttribute('transform', `rotate(${legRot} ${ll.x + ll.w / 2} ${ll.y + 5})`);
        parts.leg_right.setAttribute('transform', `rotate(${-legRot} ${lr.x + lr.w / 2} ${lr.y + 5})`);
        last.armL = rotL; last.armR = rotR; last.legRot = legRot;
      }

      // 4) 说话：整体极轻微上下浮
      const talkDy = frame.talk > 0.02 ? Math.round(Math.sin(frame.t * 18) * 1.2) : 0;
      bodyRoot.setAttribute('transform', `translate(0 ${talkDy})`);
    },

    dispose() {
      // kit 换形象时会清空 petG，无需手动删节点
    },
  };

  // vocab 里全是 kit 自带词，不需要额外 words；交给 kit 自动上报词表。
  return kit.createBody(host, { figure });
}
