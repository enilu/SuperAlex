# 唐诗小当家（TangPoem Kids）

> 一款专为儿童设计的唐诗学习游戏，让孩子在游戏中快乐背诵经典唐诗

## 项目信息

- **英文名**：TangPoem Kids
- **中文名**：唐诗小当家
- **项目定位**：儿童唐诗学习游戏化应用
- **目标用户**：3-12岁儿童及家长

## 功能特色

### 🎮 三种游戏模式

1. **诵读模式**
   - 带拼音逐句显示
   - 支持音频播放
   - 诗词译文展示
   - 目录快速跳转

2. **闯关模式**
   - 填空题形式
   - 智能出题系统
   - 实时评分反馈
   - 星级评价系统
   - 诗句拼音显示
   - 指定诗词范围挑战
   - 音效反馈（成功/失败）

3. **复习模式**
   - 基于记忆曲线推荐
   - 针对性复习
   - 掌握度追踪

### 📊 进度管理

- 记录每首唐诗的掌握度
- 学习进度可视化
- 成就系统激励

### 🎨 界面特点

- 粉色渐变背景，温馨童趣
- 卡片式设计，清晰易读
- 大按钮设计，适合小朋友操作
- 动画反馈，交互友好
- 响应式布局，适配手机端

## 快速开始

### 方式一：本地直接运行

1. 克隆或下载项目
2. 进入 TangPoem 目录
3. 双击 `index.html` 在浏览器中运行

### 方式二：使用本地服务器（推荐）

```bash
# 进入项目目录
cd TangPoem

# 使用 Node.js
npx serve .

# 或使用 Python
python -m http.server 8080
```

## 项目结构

```
TangPoem/
├── index.html                # 主页面
├── assets/
│   ├── css/
│   │   └── game.css          # 样式文件
│   ├── js/
│   │   ├── config.js         # 配置文件
│   │   ├── app.js            # 主程序入口
│   │   ├── poemManager.js    # 唐诗管理器
│   │   ├── gameManager.js    # 游戏管理器
│   │   ├── progressManager.js# 进度管理器
│   │   ├── audioManager.js   # 音频管理器
│   │   └── uiManager.js      # UI管理器
│   ├── data/               # 唐诗数据目录
│   │   ├── poems.json      # 唐诗索引文件
│   │   └── poems/         # 唐诗数据文件
│   │       ├── 001.json    # 第1首唐诗
│   │       ├── 002.json    # 第2首唐诗
│   │       └── ...         # 更多唐诗
│   ├── audio/               # 音频资源目录
│   │   ├── recite/          # 诵读音频
│   │   ├── good.mp3         # 答对音效
│   │   └── comeon.mp3       # 答错音效
│   └── images/             # 图片资源目录
│       ├── icons/           # 功能图标
│       └── badges/          # 成就勋章
├── tools/                  # 工具脚本目录
│   ├── README.md           # 工具使用文档
│   ├── validatePoems.js    # 数据验证工具
│   ├── convertPoemsToJSON.js # 文本转JSON工具
│   ├── generate-audio.py   # 音频生成工具
│   ├── check-audio-consistency.js # 音频一致性检查
│   └── ...                 # 其他工具
└── README.md               # 项目说明
```

## 添加新唐诗

每首唐诗都存储在独立的 JSON 文件中，方便后续更新唐诗资源。

### 数据文件结构

```
TangPoem/assets/data/
└── poems/             # 唐诗数据目录
    ├── 001.json       # 第1首唐诗
    ├── 002.json       # 第2首唐诗
    ├── 003.json       # 第3首唐诗
    └── ...            # 更多唐诗
```

### 方法一：手动创建

#### 步骤1：创建唐诗数据文件

在 `assets/data/poems/` 目录下创建新的 JSON 文件，使用三位数编号：
- 001.json, 002.json, 003.json, ...

#### 步骤2：填写唐诗数据

每首唐诗的数据格式如下：

```json
{
    "id": 6,
    "title": "江雪",
    "author": "柳宗元",
    "dynasty": "唐",
    "grade": "小学二年级",
    "content": [
        { "text": "千山鸟飞绝", "pinyin": "qiān shān niǎo fēi jué" },
        { "text": "万径人踪灭", "pinyin": "wàn jìng rén zōng miè" },
        { "text": "孤舟蓑笠翁", "pinyin": "gū zhōu suō lì wēng" },
        { "text": "独钓寒江雪", "pinyin": "dú diào hán jiāng xuě" }
    ],
    "annotation": "蓑笠翁：披蓑衣、戴斗笠的渔翁",
    "translation": "所有的山上，都看不到飞鸟的影子，所有的小路，都没有人的行踪。只有一条小船，乘着风，披着蓑衣、戴着斗笠的老翁，独自在漫天风雪中垂钓。",
    "audio": "assets/audio/recite/006.mp3"
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 唐诗唯一编号，需与文件名一致 |
| title | string | 是 | 唐诗标题 |
| author | string | 是 | 作者名称 |
| dynasty | string | 是 | 朝代 |
| grade | string | 是 | 适合年级（如：小学一年级） |
| content | array | 是 | 诗词内容，每句包含 text 和 pinyin |
| annotation | string | 否 | 注释说明 |
| translation | string | 是 | 译文 |
| audio | string | 否 | 诵读音频路径 |

### 方法二：使用工具脚本

#### 批量导入诗歌

```bash
cd TangPoem
node tools/convertPoemsToJSON.js
```

#### 为诗歌添加拼音

```bash
cd TangPoem
node tools/addPinyin.js
```

#### 生成音频

```bash
cd TangPoem
python tools/generate-audio.py --all
```

#### 验证数据

```bash
cd TangPoem
node tools/validatePoems.js
```

#### 检查音频一致性

```bash
cd TangPoem
node tools/check-audio-consistency.js
```

### 可用工具列表

所有工具脚本都位于 `tools/` 目录：

#### 数据管理工具

| 工具 | 功能 | 命令 |
|------|------|------|
| validatePoems.js | 验证诗歌数据格式 | `node tools/validatePoems.js` |
| convertPoemsToJSON.js | 文本转 JSON | `node tools/convertPoemsToJSON.js` |
| reassignPoemIds.js | 重分配诗歌 ID | `node tools/reassignPoemIds.js` |
| importPoems.js | 导入诗歌数据 | `node tools/importPoems.js` |

#### 音频工具

| 工具 | 功能 | 命令 |
|------|------|------|
| generate-audio.py | 生成诗歌音频 | `python tools/generate-audio.py --all` |
| check-audio-consistency.js | 检查音频一致性 | `node tools/check-audio-consistency.js` |

#### 拼音工具

| 工具 | 功能 | 命令 |
|------|------|------|
| addPinyin.js | 添加拼音标注 | `node tools/addPinyin.js` |

### 拼音标注规则

- 使用标准汉语拼音
- 声调符号：ā á ǎ à ē é ě è ī í ǐ ì ō ó ǒ ò ū ú ǔ ù
- 轻声不标调
- 大写专有名词首字母（如人名、地名）
- 标点符号单独标注

### 音频资源

诵读音频文件放置在 `assets/audio/recite/` 目录下：
- 文件命名：001.mp3, 002.mp3, ...
- 格式：MP3
- 建议比特率：128kbps

#### 自动生成音频

使用音频生成工具自动生成：
```bash
# 生成单首诗歌的音频
python tools/generate-audio.py --id <诗歌ID>

# 生成所有缺失的音频
python tools/generate-audio.py --all
```

### 常见唐诗资源

你可以从以下渠道获取唐诗数据：
- 小学语文教材
- 唐诗三百首
- 古诗文网

### 测试

添加新唐诗后，刷新游戏页面测试：
1. 打开诵读模式，查看新唐诗是否显示
2. 进入闯关模式，确保能正确生成题目
3. 测试拼音和译文显示是否正确
4. 播放音频测试语音效果

### 注意事项

1. 确保 `id` 字段与文件名一致（如 001.json 的 id 应为 1）
2. 拼音标注要准确，特别是多音字
3. 音频路径要正确指向实际文件
4. 添加新诗歌后建议运行验证工具检查
5. 使用音频生成工具时需要联网（调用微软 Edge TTS 服务）

## 音效配置

项目已内置以下音效：

- **good.mp3** - 答对时播放的成功音效
- **comeon.mp3** - 答错时播放的鼓励音效

请确保以下音频文件存在于项目中：
- `TangPoem\assets\audio\good.mp3`
- `TangPoem\assets\audio\comeon.mp3`

## 闯关模式使用说明

### 随机闯关
直接点击"闯关模式"开始游戏，系统会随机选取诗词进行出题。

### 指定诗词范围
1. 进入"闯关模式"
2. 点击左上角"选择诗词"按钮
3. 按年级筛选诗词
4. 点击诗词进行多选
5. 点击"全选"可快速选择当前筛选范围内的所有诗词
6. 点击"开始闯关"使用选定的诗词开始挑战

## 技术栈

| 技术分类 | 具体选型 | 说明 |
|----------|----------|------|
| **基础架构** | HTML5 + CSS3 + 原生 JavaScript (ES6+) | 零依赖，跨平台 |
| **样式优化** | Flexbox 布局、CSS 变量、CSS 动画 | 流畅的交互体验 |
| **音频处理** | Web Audio API | 播放唐诗诵读音频、反馈音效 |
| **数据存储** | localStorage | 存储学习进度、设置、成就 |
| **模块化** | ES Modules | 代码模块化管理 |

### 设计原则

1. **游戏化优先**：将枯燥的唐诗背诵转化为有趣的闯关游戏
2. **轻量高效**：纯前端实现，无需安装，打开即用
3. **儿童友好**：界面简洁，操作简单，鼓励为主
4. **家长放心**：可控的学习时长和难度设置

## 版本信息

- **当前版本**：v0.2.0
- **开发状态**：持续开发中
- **最后更新**：2026-02-16

### 更新日志

**v0.2.0 (2026-02-16)**
- ✅ 闯关模式添加诗句拼音显示
- ✅ 闯关模式添加指定诗词范围挑战功能
- ✅ 优化全选/取消全选功能（针对当前筛选范围）
- ✅ 完善音效反馈系统
- ✅ 修复诗词选择功能bug

**v0.1.0 (2026-02-15)**
- ✅ 三种游戏模式界面
- ✅ 诵读模式基础功能
- ✅ 闯关模式核心逻辑
- ✅ 进度管理系统
- ✅ 成就系统框架

### 待完善功能

- [ ] 添加更多诵读音频
- [ ] 家长设置页面
- [ ] 学习数据统计
- [ ] 诗词分享功能

---

## 技术设计

### 核心功能模块

| 模块 | 核心功能 | 说明 |
|------|----------|------|
| **唐诗题库** | 内置 300 首唐诗（分学段 / 难度），包含原文、拼音、注释、译文、作者信息 | 按年级和难度分级 |
| **游戏模式** | 1. 诵读模式：带拼音逐句朗读，支持音频播放<br>2. 闯关模式：填空 / 选择 / 背诵答题<br>3. 复习模式：根据记忆曲线推荐待复习唐诗 | 多种模式满足不同学习阶段 |
| **进度管理** | 记录已学习 / 背诵 / 掌握的唐诗，展示学习进度条、成就勋章 | 可视化学习成果 |
| **交互反馈** | 答对音效 / 动画、鼓励语，答错温馨提示（不打击信心） | 正向激励机制 |
| **家长设置** | 可设置学习时长、难度、每日学习目标 | 家长可控管理 |
| **数据存储** | 本地存储学习进度、成就、答题记录（无需后端，纯前端） | 隐私安全，离线可用 |

### 核心功能实现

#### 闯关模式（填空示例）

```javascript
// 生成填空题
function generateFillBlankQuestion(poem) {
  const randomLine = Math.floor(Math.random() * poem.content.length);
  const line = poem.content[randomLine];

  // 随机隐藏1-2个字词
  const words = line.text.split('');
  const blankIndex = Math.floor(Math.random() * words.length);
  const answer = words[blankIndex];
  words[blankIndex] = '____';

  // 生成题目和选项
  return {
    question: `${poem.title} 第${randomLine+1}句：${words.join('')}`,
    options: [answer, getRandomWrongWord(), getRandomWrongWord()].sort(),
    correctAnswer: answer,
    poemId: poem.id
  };
}
```

#### 复习模式（基于记忆曲线）

```javascript
// 获取需要复习的唐诗
function getReviewPoems() {
  const learnedPoems = JSON.parse(localStorage.getItem('learnedPoems')) || [];

  // 筛选出需要复习的唐诗（如2天前学习、未掌握的）
  return learnedPoems.filter(poem => {
    const lastReviewTime = new Date(poem.lastReviewTime);
    const now = new Date();
    const daysDiff = (now - lastReviewTime) / (1000 * 60 * 60 * 24);
    return daysDiff >= 2 && poem.mastery < 100;
  });
}
```

#### 进度与成就管理

```javascript
// 记录学习进度
function updateProgress(poemId, action) {
  const progress = JSON.parse(localStorage.getItem('poemProgress')) || {};

  if (!progress[poemId]) {
    progress[poemId] = {
      learned: false,
      lastReviewTime: new Date().toISOString(),
      mastery: 0,
      correctCount: 0,
      wrongCount: 0
    };
  }

  // 根据操作更新进度
  if (action === 'correct') {
    progress[poemId].correctCount++;
    progress[poemId].mastery = Math.min(100, progress[poemId].mastery + 20);
  } else if (action === 'wrong') {
    progress[poemId].wrongCount++;
    progress[poemId].mastery = Math.max(0, progress[poemId].mastery - 10);
  }

  progress[poemId].lastReviewTime = new Date().toISOString();
  localStorage.setItem('poemProgress', JSON.stringify(progress));

  // 解锁成就
  checkAchievements();
}
```

### 部署方案

- **静态托管**：可直接部署到 GitHub Pages、Vercel、Netlify 等平台
- **CDN 加速**：音频资源可使用 CDN 加速加载
- **PWA 支持**：可添加 Service Worker 实现离线使用

### 技术难点与解决方案

| 难点 | 解决方案 |
|------|----------|
| 唐诗音频资源 | 使用 edge-tts 引擎合成诵读音频 |
| 拼音标注准确性 | 建立多音字字典，根据上下文判断 |
| 记忆曲线算法 | 参考艾宾浩斯遗忘曲线，简化实现 |
| 移动端兼容 | 使用 Flexbox 布局，测试主流机型 |

---

## 工具文档

详细的数据管理和音频生成工具说明请查看：
- **工具集文档**：[tools/README.md](tools/README.md)

## 许可证

本项目采用 MIT License 开源协议。

---

**让每个孩子都能爱上唐诗！** 📜✨
