# 题目音频生成工具

## 功能说明

此工具用于为三国演义知识闯关游戏的200道题目生成TTS语音文件，帮助不识字的小朋友通过听语音来答题。

## 依赖安装

```bash
pip install edge-tts
```

## 使用方法

### 生成所有题目音频

```bash
python generate-audio.py --all
```

### 生成指定题目音频

```bash
python generate-audio.py --id 1
```

### 生成指定范围的题目音频

```bash
python generate-audio.py --range 1-10
```

### 生成样例音频（1-5题）

```bash
python generate-audio.py --sample
```

## 音频参数

- **语音**: zh-CN-XiaoxiaoNeural (女声，温柔自然)
- **语速**: +0% (正常速度)
- **音量**: +10%
- **音调**: +0Hz

## 其他可选语音

如需更换语音，可编辑 generate-audio.py 中的 voice 参数：

- `zh-CN-XiaoxiaoNeural` - 女声，温柔自然（默认）
- `zh-CN-YunxiNeural` - 男声，沉稳清晰
- `zh-CN-XiaoyiNeural` - 女声，活泼生动

## 输出位置

生成的音频文件将保存在：
```
Kingdom3/assets/audio/questions/q0001.mp3
Kingdom3/assets/audio/questions/q0002.mp3
...
```

## 音频内容

每个音频文件包含：
1. 题目内容
2. 选项A、选项B、选项C

例如：
```
他是桃园三结义的大哥，后来成为了蜀汉的皇帝。他是谁？。A、刘备。B、关羽。C、张飞。
```

## 注意事项

1. 首次生成需要联网，使用Microsoft Edge的TTS服务
2. 每个音频文件生成需要约1-2秒
3. 已存在的音频文件会被跳过，避免重复生成
4. 建议在网络良好时批量生成
