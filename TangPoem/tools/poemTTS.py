"""
唐诗TTS音频生成工具（Python版）

使用微软Edge TTS免费API生成高质量中文语音
"""

import os
import json
import asyncio
import edge_tts
from pathlib import Path

# 配置
POEMS_DIR = Path(__file__).parent.parent / 'assets' / 'data' / 'poems'
AUDIO_OUTPUT_DIR = Path(__file__).parent.parent / 'assets' / 'audio' / 'recite'

VOICE = 'zh-CN-XiaoxiaoNeural'  # 温柔女声，适合儿童


def load_poems_data():
    """从JSON文件加载唐诗数据"""
    poems = []
    files = sorted(POEMS_DIR.glob('*.json'))

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                poem = json.load(f)
                poems.append(poem)
        except Exception as error:
            print(f'❌ 读取失败 {file_path.name}: {error}')

    return poems


def generate_tts_content(poem):
    """生成TTS文本内容"""
    parts = []

    # 标题和作者
    parts.append(f'{poem["title"]}，{poem["author"]}作。')

    # 诗词内容
    if 'content' in poem and isinstance(poem['content'], list):
        for line in poem['content']:
            if 'text' in line:
                parts.append(line['text'] + '。')

    return ''.join(parts)


async def generate_tts(text, output_file):
    """生成TTS音频"""
    print(f'📝 生成: {output_file.name}')
    print(f'   内容: {text[:40]}...')

    try:
        communicate = edge_tts.Communicate(text, VOICE)

        await communicate.save(str(output_file))

        print(f'✓ 成功: {output_file.name}\n')
        return {'success': True}

    except Exception as error:
        print(f'✗ TTS错误: {error}')
        return {'success': False, 'error': error}


async def generate_batch(start_id=1, count=30):
    """批量生成TTS音频"""
    print('🎵 开始生成唐诗TTS音频...\n')
    print(f'使用音色: {VOICE} (温柔女声)\n')

    # 确保输出目录存在
    AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 加载唐诗数据
    poems = load_poems_data()
    target_poems = [p for p in poems if start_id <= p['id'] < start_id + count]

    print(f'✓ 已加载 {len(poems)} 首唐诗')
    print(f'✓ 生成范围: {start_id}-{start_id + count - 1}')
    print(f'✓ 需要生成: {len(target_poems)} 首\n')

    success_count = 0
    skip_count = 0
    error_count = 0

    for poem in target_poems:
        file_name = f'{poem["id"]:03d}.mp3'
        output_file = AUDIO_OUTPUT_DIR / file_name

        # 检查是否已存在
        if output_file.exists():
            print(f'⊘ 跳过（已存在）: {file_name} - {poem["title"]}')
            skip_count += 1
            continue

        try:
            tts_text = generate_tts_content(poem)

            # 添加延迟，避免过快请求
            await asyncio.sleep(0.5)

            result = await generate_tts(tts_text, output_file)
            if result['success']:
                success_count += 1
            else:
                error_count += 1

        except Exception as error:
            error_count += 1
            print(f'✗ 错误: {file_name} - {error}')

            # 出错后等待更长时间
            await asyncio.sleep(2)

    print(f'\n📊 生成完成！')
    print(f'   成功: {success_count} 首')
    print(f'   跳过: {skip_count} 首')
    print(f'   失败: {error_count} 首')
    print(f'\n📁 音频位置: {AUDIO_OUTPUT_DIR}')


def main():
    """主函数"""
    import sys

    print("""
╔════════════════════════════════════════════════════════════════╗
║           唐诗TTS音频生成工具 v4.0 (Edge TTS Python)            ║
║                                                                        ║
║  使用方法：                                                          ║
║    python tools/poemTTS.py [开始ID] [数量]                         ║
║                                                                        ║
║  示例：                                                              ║
║    python tools/poemTTS.py 11 30   # 生成11-40首               ║
║    python tools/poemTTS.py 41 30   # 生成41-70首                    ║
║    python tools/poemTTS.py 1 368   # 生成全部（需较长时间）          ║
║                                                                        ║
║  说明：                                                              ║
║    • 使用微软Edge TTS免费API                                       ║
║    • 音色：晓晓（温柔女声，适合儿童）                                  ║
║    • 生成的音频保存到 assets/audio/recite/ 目录                      ║
║    • 文件命名格式: 001.mp3, 002.mp3...                          ║
║    • 自动跳过已存在的音频文件                                       ║
║    • 每批默认生成30首，可自定义数量                                  ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════╝
    """)

    # 默认生成第11-40首（前10首已存在）
    start_id = int(sys.argv[1]) if len(sys.argv) > 1 else 11
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 30

    try:
        asyncio.run(generate_batch(start_id, count))
    except Exception as error:
        print(f'❌ 执行失败: {error}')
        sys.exit(1)


if __name__ == '__main__':
    main()
