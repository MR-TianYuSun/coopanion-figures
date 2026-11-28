/**
 * 老孙 · 桌宠形象包（v1.7 · 待机双手常驻 + 裤腰无缝 + 裤脚上移）
 *
 * ★ v1.6 修正（针对用户实测反馈）：
 *   1) 待机手消失：v1.5 把 arm_left 设为静立隐藏，同时 body 又恢复成干净马甲，
 *      导致待机时没有手。v1.6 让画面左侧整臂（zuoshou）与画面右侧独立手
 *      （youshou 清理版）全部常驻显示，不再依赖 opacity 切换。
 *   2) 双手重叠：body 内原本自带的右手已在资源层清除，只保留袖口；
 *      右手由 tex3r/hand_right.png 单独绘制，避免两套手像素叠加。
 *   3) 图层：右手放在 body 之后，袖口压住手腕；左整臂放在 body 之后、head 之前，
 *      用来填满马甲左侧袖窿并还原完整样貌；左腿继续压右腿。
 *   4) 裤腰接缝：恢复 tex3/leg_left.png 的正确透明边界，
 *      body 下沿保留完整样貌裤腰延伸，与两条裤腿重叠衔接。
 *   5) v1.7 裤脚：用户实机反馈裤脚压鞋偏低；在 leg_left/leg_right 部件内部
 *      把裤腿与翻边上移 8 源像素（约 2.2px@256），用袜子像素补空带，
 *      鞋子与脚底 y=256 保持不动。
 *
 * ★ 1024 空间 → 256 logo space 换算：
 *   人物 bbox x[315,687] y[44,976]，脚底 975；s = 256/931 = 0.27497
 *   out_x = 128 + (part_x - 501) * s；out_y = 256 - (975 - part_y) * s
 */

const SVGNS = 'http://www.w3.org/2000/svg';

/** 部件在 logo space 的框（256×256）。tex3r/ 部件为朝右原样。 */
const LAYOUT = {
  leg_right:  { x: 131.8, y: 167.2, w: 41.8, h: 85.5 },  // 画面右裤腿+鞋
  leg_left:   { x: 101.3, y: 172.7, w: 38.5, h: 83.6 },  // 画面左裤腿+鞋（压右腿）
  waist_fill: { x: 102.4, y: 168.1, w: 57.5, h: 6.6 },   // 完整样貌裁出的裤腰填充带，堵住下摆细缝
  hand_right: { x: 159.6, y: 156.7, w: 12.9, h: 17.6 },  // 画面右手：youshou 清理版
  arm_left:   { x: 84.6,  y: 90.0,  w: 29.4, h: 84.4 },  // 画面左整臂：zuoshou
  body:       { x: 82.9,  y: 72.0,  w: 90.7, h: 119.3 }, // 干净马甲+包+裤腰延伸
  head:       { x: 87.3,  y: 0.0,   w: 97.9, h: 104.5 }, // 渔夫帽+头脸（朝右）
  eye_left:   { x: 129.1, y: 46.7,  w: 11.5, h: 9.6 },
  eye_right:  { x: 153.0, y: 48.1,  w: 9.1,  h: 9.6 },
};

/** 由后到前：右腿 > 左腿 > 裤腰填充带 > 右手 > 衣服 > 左臂 > 头 > 眼 */
/** 右手在衣服后（袖口压住手腕）；左臂整条在衣服前，才能填满左侧袖窿。 */
const VISIBLE = ['leg_right', 'leg_left', 'waist_fill', 'hand_right', 'body', 'arm_left', 'head', 'eye_left', 'eye_right'];

/** 旋转轴：左臂肩点；右手腕点。 */
const PIVOT = {
  arm_left:  { x: 99.2,  y: 97.0 },
  hand_right:{ x: 166.0, y: 158.4 },
};

export async function createLaosunBody(base, { kit, asset, host }) {
  const el = (tag, attrs) => {
    const node = document.createElementNS(SVGNS, tag);
    for (const k in attrs) node.setAttribute(k, String(attrs[k]));
    return node;
  };

  const parts = {};
  let bodyRoot = null;

  function buildParts(petG) {
    if (bodyRoot) return;
    bodyRoot = el('g', { class: 'laosun-body' });
    for (const name of VISIBLE) {
      const b = LAYOUT[name];
      const img = el('image', {
        href: String(asset(`tex3r/${name}.png`)),
        x: b.x, y: b.y, width: b.w, height: b.h,
        preserveAspectRatio: 'none',
      });
      parts[name] = img;
      bodyRoot.appendChild(img);
    }
    petG.appendChild(bodyRoot);
  }

  const last = {
    legRot: null, armRot: null, handRot: null,
    eyeL: null, eyeR: null,
  };

  const figure = {
    extent: [82.9, 0, 185.2, 256],
    hits: [[134, 130, 55]],
    anchors: {
      look: [146, 52],
      tears: [[134, 58], [157.5, 58]],
      z: [180, 26],
      heart: [170, 34],
      bubble: [128, 10],
    },
    colors: { z: '#8A6B4F' },

    // 挥手由本 figure 自画，避免 kit 默认手势与本包图层冲突。
    gestures: ['wave'],

    draw(petG, face, frame) {
      buildParts(petG);

      // 1) 眨眼 / 眯眼 / 睡觉：差分贴片法。
      const b = Math.max(0, Math.min(1, frame.blink || 0));
      const e = Math.max(0, Math.min(1, frame.eyeClose || 0));
      const closed = Math.max(b, e);
      const sleeping = frame.face === 'sleep' || frame.mode === 'sleep';
      const openL = sleeping ? 0 : frame.face === 'wink' ? 0 : 1 - closed;
      const openR = sleeping ? 0 : 1 - closed;
      const qL = Math.round(openL * 50) / 50;
      const qR = Math.round(openR * 50) / 50;
      if (qL !== last.eyeL) { parts.eye_left.style.opacity = qL; last.eyeL = qL; }
      if (qR !== last.eyeR) { parts.eye_right.style.opacity = qR; last.eyeR = qR; }

      // 2) 腿：walk/run 绕髋摆动，左腿压右腿。
      const moving = frame.mode === 'walk' || frame.mode === 'run';
      const phase = frame.t * (frame.mode === 'run' ? 12 : 8);
      const swing = moving ? Math.sin(phase) * (frame.mode === 'run' ? 10 : 6) : 0;
      const legRot = moving ? Math.round(swing * (frame.mode === 'run' ? 1.8 : 1.5)) : 0;
      if (legRot !== last.legRot) {
        const ll = LAYOUT.leg_left, lr = LAYOUT.leg_right;
        parts.leg_left.setAttribute('transform', `rotate(${legRot} ${ll.x + ll.w / 2} ${ll.y + 5})`);
        parts.leg_right.setAttribute('transform', `rotate(${-legRot} ${lr.x + lr.w / 2} ${lr.y + 5})`);
        last.legRot = legRot;
      }

      // 3) 手臂：待机常驻可见；走路小幅摆动；挥手抬左臂。
      let armRot = 0;
      let handRot = 0;
      if (frame.gesture && frame.gesture.kind === 'wave') {
        const k = Math.max(0, Math.min(1, frame.gesture.k || 0));
        if (k > 0.01) {
          armRot = Math.round(-138 * k + Math.sin(phase || frame.t * 10) * 12 * k);
          handRot = Math.round(10 * k);
        }
      } else if (moving) {
        armRot = -Math.round(swing * 0.8);
        handRot = Math.round(swing * 0.35);
      }

      if (armRot !== last.armRot) {
        const p = PIVOT.arm_left;
        parts.arm_left.setAttribute('transform', `rotate(${armRot} ${p.x} ${p.y})`);
        last.armRot = armRot;
      }
      if (handRot !== last.handRot) {
        const p = PIVOT.hand_right;
        parts.hand_right.setAttribute('transform', `rotate(${handRot} ${p.x} ${p.y})`);
        last.handRot = handRot;
      }

      // 4) 说话：整体极轻微上下浮。
      const talkDy = frame.talk > 0.02 ? Math.round(Math.sin(frame.t * 18) * 1.2) : 0;
      bodyRoot.setAttribute('transform', `translate(0 ${talkDy})`);
    },

    dispose() {
      // kit 换形象时会清空 petG，无需手动删节点。
    },
  };

  return kit.createBody(host, { figure });
}
