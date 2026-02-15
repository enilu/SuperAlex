# 唐诗TTS音频自动生成指南

## 📝 快速开始

### 方法1：使用本地TTS引擎（推荐用于测试）

**步骤1：安装TTS引擎**
```bash
npm install speak-tts
```

**步骤2：生成音频**
```bash
# 生成所有唐诗音频
node tools/ttsGenerator.js --all

# 生成前30首
node tools/ttsGenerator.js --range 1 30

# 生成指定ID
node tools/ttsGenerator.js --single 1
```

**优点**：
- ✅ 完全免费
- ✅ 离线可用
- ✅ 无需API密钥
- ✅ 支持中文语音

### 方法2：使用在线TTS服务（更好音质）

#### 推荐的免费TTS服务

| 服务商 | 链接 | 免费额度 |
|--------|------|----------|
| **讯飞TTS** | https://www.xfyun.cn/services/voice/tts | 每日500次调用 |
| **百度TTS** | https://ai.baidu.com/tech/speech/tts | 按需付费 |
| **阿里云TTS** | https://www.aliyun.com/product/nls | 有免费额度 |
| **腾讯云TTS** | https://cloud.tencent.com/product/tts | 有免费额度 |

#### 在线TTS使用流程

1. 注册账号并获取API密钥
2. 修改 `tools/ttsGenerator.js` 中的TTS配置
3. 重新运行生成脚本

### 方法3：使用现成音频资源

**推荐平台**：
- 喜马拉雅：《小学生必背古诗75+80首》专辑
- 蜻蜓FM：小学生必背古诗词专辑

## 🎵 音频生成示例

```bash
# 测试生成单首音频
node tools/ttsGenerator.js --single 1

# 批量生成前30首常用唐诗
node tools/ttsGenerator.js --range 1 30

# 生成所有90首唐诗
node tools/ttsGenerator.js --all
```

## 📊 进度追踪

| 状态 | 数量 | 说明 |
|------|------|------|
| 当前总数 | 90首 | 游戏中已有唐诗数据 |
| 待生成音频 | 90首 | 需要生成MP3文件 |
| 建议优先 | 30首 | 小学常用古诗 |

## 💡 使用建议

### 分批生成策略

**第一批（最常用30首）**
- 001-030：小学课本最常见的唐诗
- 包括：静夜思、春晓、咏鹅等

**第二批（常用扩展）**
- 031-060：小学必背扩展内容
- 包括：相思、江雪、游子吟等

**第三批（完整补充）**
- 061-090：完整覆盖所有唐诗
- 包括：各朝代经典作品

### 质量检查

每批生成后建议：
1. 在游戏中试听音频效果
2. 检查音质是否清晰
3. 确认语速适中
4. 验证音频完整性

## 🛠️ 故障排除

### 问题1：未安装speak-tts
**错误**：`spawn speak-tts ENOENT`

**解决**：
```bash
npm install speak-tts@latest
```

### 问题2：音频文件过大
**解决**：
- 调整TTS参数降低比特率
- 使用更高质量的编码格式

### 问题3：语音不自然
**解决**：
- 切换不同的TTS引擎
- 调整语速参数
- 添加适当的停顿

## 📞 当前状态

✅ 已完成：
- TTS生成工具已创建
- 测试成功生成占位符音频
- 音频文件路径配置正确

⏳ 待完成：
- 安装真实的TTS引擎
- 批量生成所有唐诗音频
- 音频质量验证

---

**提示**：建议优先使用方法1（本地TTS引擎）进行测试，确认功能正常后再考虑使用在线TTS服务提升音质。
