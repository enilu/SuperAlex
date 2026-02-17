# TangPoem 工具集

此目录包含用于处理诗歌数据、拼音和音频的所有工具脚本。

## 目录

- [数据管理工具](#数据管理工具)
- [音频工具](#音频工具)
- [拼音工具](#拼音工具)
- [数据目录结构](#数据目录结构)
- [常见问题](#常见问题)

---

## 数据管理工具

### validatePoems.js - 诗歌数据验证工具

验证诗歌 JSON 文件的格式和内容是否正确。

#### 使用方法

```bash
cd TangPoem
node tools/validatePoems.js
```

#### 验证项目

- JSON 格式是否正确
- 必填字段是否存在
- ID 是否与文件名一致
- 数据格式是否符合规范

---

### convertPoemsToJSON.js - 诗词转换脚本

将 `小学生必背75+80首.txt` 文件转换为 JSON 格式的诗词数据。

#### 使用方法

**基本用法**
```bash
node tools/convertPoemsToJSON.js
```

**强制覆盖已存在的文件**
```bash
node tools/convertPoemsToJSON.js --force
```

#### 功能特点

1. 自动解析诗词的标题、作者、朝代和内容
2. 自动生成每句诗的拼音
3. 自动修正已知的错别字
4. 为每首诗词分配唯一的 ID（从 100 开始）

#### 错别字修正

**作者修正**
- "王之焕" → "王之涣"
- "白" → "白居易"（仅限作者字段）

**诗句修正**
- "水风吹雁雪纷纷" → "北风吹雁雪纷纷"

#### 生成的 JSON 格式

```json
{
    "id": 100,
    "title": "江南",
    "author": "汉乐府",
    "dynasty": "汉",
    "grade": "小学生必背",
    "content": [
        { "text": "江南可采莲，莲叶何田田。", "pinyin": "jiāng nán kě cǎi lián ， lián yè hé tián tián 。" }
    ],
    "annotation": "",
    "translation": "",
    "audio": ""
}
```

#### 注意事项

1. 脚本会跳过已存在的文件（除非使用 --force 参数）
2. ID 从 100 开始，避免与现有诗词冲突
3. 必备 75 首诗词的 ID 为 100-174
4. 扩展 80 首诗词的 ID 为 175-254

---

### reassignPoemIds.js - 诗歌 ID 重分配工具

重新分配诗歌的 ID 序号。

#### 使用方法

```bash
cd TangPoem
node tools/reassignPoemIds.js
```

#### 功能

- 重新编号诗歌文件
- 更新文件名
- 更新 JSON 内容中的 ID
- 保持原有诗歌内容不变

#### 注意事项

⚠️ **危险操作**：会重新分配所有诗歌的 ID，请先备份重要数据！

---

### importPoems.js - 诗歌导入工具

将诗歌数据从文本文件导入为 JSON 格式。

#### 使用方法

**基本用法**
```bash
node tools/importPoems.js
```

**强制覆盖已存在的文件**
```bash
node tools/importPoems.js --force
```

---

## 音频工具

### generate-audio.py - 诗歌音频生成工具

为诗歌生成诵读音频文件，使用微软 Edge TTS 服务。

#### 环境准备

确保你的系统已安装 Python 3.7 或更高版本。

```bash
pip install edge-tts
```

#### 使用方法

**生成样例音频（推荐先测试）**
```bash
cd TangPoem
python tools/generate-audio.py --sample
```

**生成单首诗歌的音频**
```bash
python tools/generate-audio.py --id 5
```

**生成指定范围的音频**
```bash
python tools/generate-audio.py --range 1-30
```

**生成所有缺失的音频**
```bash
python tools/generate-audio.py --all
```

#### 技术方案

**选择 edge-tts 的理由：**
1. 免费开源，无需 API 密钥
2. 使用微软 Edge 的在线 TTS 服务，语音质量高
3. 支持中文，有多个自然语音选项
4. 可以直接导出 MP3 格式
5. Python 实现，易于批量处理

#### 语音选择

| 语音 | 特点 | 适用场景 |
|------|------|----------|
| zh-CN-XiaoxiaoNeural | 女声，自然温柔 | 唐诗诵读（推荐） |
| zh-CN-YunxiNeural | 男声，沉稳清晰 | 男声诗词朗读 |
| zh-CN-XiaoyiNeural | 女声，活泼生动 | 儿歌或活泼诗词 |

#### 音频参数

- **语音**: zh-CN-XiaoxiaoNeural（温柔女声，适合儿童）
- **语速**: +0%（正常速度）
- **音量**: +10%（提高音量）
- **音调**: +0Hz（正常音调）

#### 音频内容格式

每首诗的音频包含：
1. 诗歌标题
2. 朝代（如有）
3. 作者
4. 诗歌内容（逐句朗读，句间停顿）

**示例：**
```
悯农

唐
李绅

锄禾日当午，汗滴禾下土。
谁知盘中餐，粒粒皆辛苦。
```

#### 质量检查

生成完成后，需要检查：
1. 音频文件完整性
2. 语音清晰度
3. 内容正确性
4. 文件命名规范

#### 注意事项

1. 需要联网才能使用（调用微软 Edge TTS 服务）
2. 每首诗生成时间约 2-5 秒
3. 脚本会自动更新诗歌 JSON 文件中的 audio 字段
4. 已存在的音频文件会自动跳过
5. 生成的音频仅供教育使用

---

### check-audio-consistency.js - 音频一致性检查工具

检查诗歌文件和音频文件之间的一致性。

#### 使用方法

```bash
cd TangPoem
node tools/check-audio-consistency.js
```

#### 检查项目

- 诗歌 ID 与文件名是否一致
- 音频字段是否正确
- 音频文件是否存在
- 是否有孤立的音频文件（没有对应诗歌）

---

## 拼音工具

### addPinyin.js - 拼音添加工具

为诗歌内容添加拼音标注。

#### 使用方法

```bash
cd TangPoem
node tools/addPinyin.js
```

#### 功能

- 自动为诗歌内容添加拼音
- 支持多音字识别
- 自动处理标点符号

---

### verifyPinyinFix.js - 拼音格式验证工具

验证诗歌文件中拼音数据的格式是否正确。

#### 使用方法

```bash
cd TangPoem
node tools/verifyPinyinFix.js
```

#### 检查项目

- 空拼音字段
- 包含逗号分隔的拼音（格式错误）
- 错误的标点组合（如 ` ， 。` 或 ` 。 ，`）

#### 验证结果

输出总文件数、发现问题数以及问题列表（最多显示前20个）。

---

## 数据目录结构

```
TangPoem/
├── assets/
│   ├── data/
│   │   └── poems/              # 诗歌 JSON 文件
│   │       ├── 001.json       # 诗歌 1
│   │       ├── 002.json       # 诗歌 2
│   │       └── ...
│   └── audio/
│       └── recite/            # 诵读音频文件
│           ├── 001.mp3        # 音频 1
│           ├── 002.mp3        # 音频 2
│           └── ...
└── tools/                      # 所有工具脚本
    ├── README.md               # 本文档
    ├── validatePoems.js        # 数据验证
    ├── convertPoemsToJSON.js  # 数据转换
    ├── reassignPoemIds.js      # ID 重分配
    ├── importPoems.js          # 数据导入
    ├── addPinyin.js            # 拼音添加
    ├── verifyPinyinFix.js      # 拼音格式验证
    ├── generate-audio.py       # 音频生成
    └── check-audio-consistency.js  # 音频检查
```

---

## 常见问题

### Q: 音频生成失败怎么办？

A: 请检查：
1. 网络连接是否正常（需要访问微软 Edge TTS 服务）
2. Python 版本是否为 3.7 或更高
3. 是否已安装 edge-tts：`pip install edge-tts`

### Q: 如何重新生成某首诗的音频？

A: 删除对应的音频文件后重新运行生成命令：
```bash
rm assets/audio/recite/005.mp3
python tools/generate-audio.py --id 5
```

### Q: 如何检查所有诗歌是否有对应的音频？

A: 运行一致性检查工具：
```bash
node tools/check-audio-consistency.js
```

### Q: 如何批量添加新诗歌？

A: 可以使用以下方法：
1. **手动创建**: 在 `assets/data/poems/` 目录下创建新的 JSON 文件
2. **使用转换脚本**: 将文本文件转换为 JSON
3. **验证数据**: 运行 `validatePoems.js` 检查格式

### Q: 添加新诗歌后 ID 如何分配？

A: 新诗歌的 ID 应该：
1. 与文件名保持一致（如 `005.json` 的 ID 为 5）
2. 不与现有诗歌冲突
3. 使用三位数格式（001-999）

### Q: 音频生成时间太长怎么办？

A: 可以分批生成：
```bash
# 分批生成，每次 20-30 首
python tools/generate-audio.py --range 1-30
python tools/generate-audio.py --range 31-60
# ...依此类推
```
