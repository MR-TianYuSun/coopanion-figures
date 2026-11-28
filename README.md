# coopanion-figures · 老孙 × 思语 桌宠形象包与提示词算法体系

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![Figure pack](https://img.shields.io/badge/laosun_v1.7%20%2B%20siyu_v4.1-figure%20packs-pink)
![Algorithm](https://img.shields.io/badge/prompt%20algorithm-v3%20四路互斥-teal)
![License](https://img.shields.io/badge/assets-non--commercial-orange)

这里是 Coopanion 桌宠「思语」与「老孙」的官方形象包仓库，同时完整公开支撑这两个角色运行的一套 **AI 智能体提示词算法体系**（v3 · 任务连贯性 + 四路互斥路由）。

角色形象由 老孙不会拍 原创设计、即梦 AI 辅助生成；桌宠运行时基于开源项目 [Coopanion](https://github.com/Pal-AI-Lab/Coopanion)（Pal-AI-Lab）的 figure kit 格式。

## 📦 仓库结构

```
coopanion-figures/
├── laosun_figure_pack_v1.7.zip   老孙形象包（v1.7）
├── siyu_figure_pack_v4.1.zip     思语形象包（v4.1）
└── docs/                         提示词算法体系（全部脱敏公开）
    ├── algorithm.md              算法总文档：问题诊断 → v3 设计 → 验证清单
    ├── mindmap.md                思维导图 86 节点全展开（Xmind 同源）
    ├── CONSTITUTION.md           运行时提示词①：总则 + 四路互斥表 + 边界豁免
    ├── ORIENTATION.md            运行时提示词②：存在与记忆机制
    ├── PARTNER.md                运行时提示词③：主人速写与应答口径
    └── workbuddy-env.md          运行时提示词④：助理转交通道
```

---

## 一、桌宠形象包

### 下载

| 文件 | 角色 | 大小 | 版本 |
|---|---|---|---|
| [laosun_figure_pack_v1.7.zip](laosun_figure_pack_v1.7.zip) | 老孙（渔夫帽 · 圆框眼镜 · 复古相机） | 0.8 MB | v1.7 |
| [siyu_figure_pack_v4.1.zip](siyu_figure_pack_v4.1.zip) | 思语（米白发箍 · 圆框眼镜 · 头顶气泡） | 6.4 MB | v4.1 |

点击文件名即可直接下载（或用 `curl -O` 拉取）。

### 导入方法

1. 安装 Coopanion 桌宠软件：https://coo.palailab.org/
2. 打开设置 →「装扮」→ 导入形象包
3. 选择下载的 zip，形象立刻生效

### 包内容

- `figure.js` — 桌宠引擎驱动（SVG 分层渲染，表情/动作由 kit 驱动）
- `figure.json` — 元数据（manifest / vocab / api）
- `tex*/` — 分层贴图（PNG，透明底）
- `thumb.png` — 缩略图

---

## 二、提示词算法体系（v3 全公开）

这套算法解决的是 AI 桌宠智能体在真实使用中暴露的两个顽疾：

**问题 1 · 回合被切碎** — 让它干活时一句话要说三次「继续」才推进一步。根因是「聊天一句一收」的回合经济学被泛化到了「干活」场景上，四条规则互相提供"可以收了"的合法性，却没有一条反着说「目标没完成不许走」。

**问题 2 · 双通道互压** — 让它「把消息发给微信」，实测被连转 7 次助理转交工具、微信直发一次没调；改成「微信绝对优先」后，提到助理的请求又被微信抢走。单通道优先注定按下葫芦浮起瓢。

### v3 的核心设计

| 机制 | 一句话解释 |
|---|---|
| **两套经济学分开** | 聊天一句一收，干活做完了才收——是否结束回合由目标状态决定，不由说没说话决定 |
| **end_turn 三态判定** | ① 目标完成 → 汇报后结束 ② 缺独有信息 → 提问后结束 ③ 需确认的对外动作 → 请求确认后结束 |
| **四路互斥** | 只判一次：只有微信信号 → 直发；只有助理信号 → 转交；两个信号都有 → 只反问；都没有 → 正常对话 |
| **记账统一后置** | todo / 记忆写入都在目标完成后、end_turn 前一次做完，不切碎回合 |

### 文档导航

| 文档 | 内容 |
|---|---|
| [docs/algorithm.md](docs/algorithm.md) | **算法总文档**：问题诊断、两套经济学、判定伪代码、三态判定、四路互斥表、加固九项、15 步验证清单 |
| [docs/mindmap.md](docs/mindmap.md) | 思维导图 86 节点全展开，七大脑图分支与 algorithm.md 同源 |
| [docs/CONSTITUTION.md](docs/CONSTITUTION.md) | 运行时提示词①：每轮进系统前缀，总则 + 四路互斥表 + 边界豁免 |
| [docs/ORIENTATION.md](docs/ORIENTATION.md) | 运行时提示词②：跨回合存在机制、工作区即记忆、external_event_frame |
| [docs/PARTNER.md](docs/PARTNER.md) | 运行时提示词③：主人速写、答「A 是谁」口径、边界题红线 |
| [docs/workbuddy-env.md](docs/workbuddy-env.md) | 运行时提示词④：助理转交通道一眼分流规则 |

> **隐私说明**：docs/ 全部为脱敏公开版——不含真名、账号、本机路径与内部知识库标识，"主人"泛指智能体的使用者。

---

## SHA256

```
2e27005e1adc3c9baa897c1ce06063efc75d8359fe7dcb8c4ba61bdb148421e4  laosun_figure_pack_v1.7.zip
0de2db471f05038800937b063809cf6053223e9a42e8d84e4a82e84a3242c9d1  siyu_figure_pack_v4.1.zip
```

## 授权

角色形象由 老孙不会拍 原创，即梦 AI 辅助生成；桌宠运行时使用 Coopanion 开源项目（Pal-AI-Lab，AGPL-3.0）的 kit。仅限非商业使用，转载请保留角色名。
