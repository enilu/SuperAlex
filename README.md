# SuperAlex - 儿童教育小游戏集

> 为小朋友开发的寓教于乐小游戏集合

![SuperAlex](https://img.shields.io/badge/SuperAlex-v1.1.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 项目简介

SuperAlex 是一个面向幼儿园和小学阶段孩子的轻量 Web 教育游戏合集。每个游戏都是独立静态应用，零依赖、开箱即玩。

### 现有游戏

| 游戏 | 简介 | 状态 |
|------|------|------|
| 🌅 晨光冲锋队 | 帮助孩子建立良好晨间习惯的激励游戏 | ✅ 已完成 |
| ➕➖ 20以内加减法 | 数学基础运算练习游戏 | ✅ 已完成 |
| 📜 唐诗小当家 | 唐诗诵读、闯关与复习一体化学习游戏 | ✅ 已完成 |
| 🏯 三国演义知识闯关 | 三国人物与故事知识问答闯关 | ✅ 已完成 |
| 🔤 拼音配对乐园 | 低龄拼音配对启蒙小游戏 | ✅ 已完成 |

---

## 新增游戏开发建议

项目已新增模板目录：`templates/light-game-template/`。

推荐流程：

1. 复制模板目录并重命名（例如 `HanziMatch/`）。
2. 修改 `index.html` 与 `assets/js/config.js` 中的游戏名称、题库和配置。
3. 在 `gameManager.js` 实现核心玩法（先 MVP，再扩展）。
4. 在根目录 `index.html` 添加入口卡片。
5. 在本 README 增加游戏说明。

---

## 项目展示

### 🌅 晨光冲锋队

培养晨间习惯的轻量激励游戏，包含任务倒计时、成就系统和音效反馈。

**目录：** `MornGo/`

### ➕➖ 20以内加减法

帮助孩子练习 20 以内加减法，支持不同运算模式和答题方式。

**目录：** `math20/`

### 📜 唐诗小当家

通过诵读、闯关、复习模式学习唐诗，支持拼音与音频。

**目录：** `TangPoem/`

### 🏯 三国演义知识闯关

通过问答闯关认识三国人物和经典故事。

**目录：** `Kingdom3/`

### 🔤 拼音配对乐园

适合幼儿园到小学低年级：先点汉字，再点对应拼音完成配对。

**主要功能：**
- 三档难度（幼儿园 / 一年级 / 二年级）
- 倒计时配对、连击奖励
- 历史最高分与对局统计（localStorage）
- 浏览器语音朗读汉字（支持时启用）

**目录：** `PinyinMatch/`

---

## 快速开始

### 方式一：本地直接运行

1. 克隆或下载项目
```bash
git clone https://github.com/yourusername/SuperAlex.git
cd SuperAlex
```

2. 启动本地服务（推荐）
```bash
# Node.js
npx serve .

# 或 Python
python -m http.server 8080
```

3. 在浏览器打开 `http://127.0.0.1:8080`

---

## 项目结构

```text
SuperAlex/
├── MornGo/                       # 晨光冲锋队
├── math20/                       # 20以内加减法
├── TangPoem/                     # 唐诗小当家
├── Kingdom3/                     # 三国演义知识闯关
├── PinyinMatch/                  # 拼音配对乐园
├── templates/
│   └── light-game-template/      # 新游戏模板
├── index.html                    # 游戏目录首页
└── README.md                     # 项目总说明
```

---

## 开发路线图

- [x] 晨光冲锋队（核心玩法）
- [x] 20以内加减法（核心玩法）
- [x] 拼音学习游戏（拼音配对乐园）
- [ ] 汉字识字游戏
- [ ] 英语单词游戏
- [ ] 更多低龄益智小游戏（分类、记忆、节奏等）

---

## 技术特点

- **零依赖**：所有游戏均使用原生 JavaScript
- **响应式设计**：适配手机、平板、桌面设备
- **本地存储**：使用 localStorage 保存进度和统计
- **模块化代码**：`config + app + manager` 模式易扩展
- **儿童友好**：正向反馈、短时长、低操作门槛

---

## AI Agent Guide（统一入口）

### 执行顺序

1. 先读本 README 的项目结构、运行方式、约束章节
2. 扫描并命中 `doc/ai/skills/` 的 `SKILL.md`
3. 如适用，复用 `doc/ai/prompts/`
4. 最后读取工具入口差异项（如 `AGENTS.md`、`CLAUDE.md`）

### 协作与交互约束（高优先级）

- 代码注释与文档默认使用中文
- 需求有歧义时，先澄清再实施
- 改动保持最小必要，不做无需求的大规模重构
- 涉及 localStorage 键名或数据结构变更时，必须说明兼容与迁移影响
- 每轮交互结束后，会话沉淀到 `doc/ai/sessions/yyyyMMdd/<git-user>.md`
- 最终回复需包含会话落盘状态、路径与时间戳

### 通用实施与输出规范

- 搜索与定位优先使用 `rg` / `rg --files`
- 优先复用现有模式（静态页面 + 原生 JS + manager 模式）
- 验证至少覆盖与改动直接相关的最小检查
- 无法验证时，明确原因、风险与影响范围
- 复杂任务计划文档统一放在 `doc/superpowers/plans/`

### AI 资产目录

- 协作规范：`doc/ai/AI编程协作规范.md`
- Skills：`doc/ai/skills/`
- Prompts：`doc/ai/prompts/`
- Sessions：`doc/ai/sessions/`
- Plans：`doc/superpowers/plans/`

---

## 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

希望这些小游戏能让更多孩子在快乐中学习成长。
