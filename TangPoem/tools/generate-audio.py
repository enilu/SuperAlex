#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
唐诗音频生成脚本
使用 edge-tts 为诗歌生成诵读音频
"""

import json
import os
import sys
import argparse
import asyncio
import edge_tts
from pathlib import Path


class PoemAudioGenerator:
    """诗歌音频生成器"""

    def __init__(self, project_root=None):
        """初始化生成器

        Args:
            project_root: 项目根目录，默认为脚本所在目录的父目录
        """
        if project_root is None:
            script_dir = Path(__file__).parent
            project_root = script_dir.parent

        self.project_root = Path(project_root)
        self.poems_dir = self.project_root / "assets" / "data" / "poems"
        self.audio_dir = self.project_root / "assets" / "audio" / "recite"

        # 确保音频目录存在
        self.audio_dir.mkdir(parents=True, exist_ok=True)

        # TTS 配置
        self.voice = "zh-CN-XiaoxiaoNeural"  # 女声，温柔自然
        # 其他可选语音：
        # self.voice = "zh-CN-YunxiNeural"    # 男声，沉稳清晰
        # self.voice = "zh-CN-XiaoyiNeural"    # 女声，活泼生动

        self.rate = "+0%"  # 语速调整（-50% 到 +100%）
        self.volume = "+10%"  # 音量调整（-50% 到 +100%）
        self.pitch = "+0Hz"  # 音调调整（-50Hz 到 +50Hz）

    def get_poem_file(self, poem_id):
        """获取诗歌文件路径

        Args:
            poem_id: 诗歌 ID

        Returns:
            Path: 诗歌 JSON 文件路径
        """
        file_name = f"{poem_id:03d}.json"
        return self.poems_dir / file_name

    def get_audio_file(self, poem_id):
        """获取音频文件路径

        Args:
            poem_id: 诗歌 ID

        Returns:
            Path: 音频 MP3 文件路径
        """
        file_name = f"{poem_id:03d}.mp3"
        return self.audio_dir / file_name

    def load_poem(self, poem_id):
        """加载诗歌数据

        Args:
            poem_id: 诗歌 ID

        Returns:
            dict: 诗歌数据，如果加载失败返回 None
        """
        poem_file = self.get_poem_file(poem_id)
        if not poem_file.exists():
            print(f"错误：诗歌文件不存在 - {poem_file}")
            return None

        try:
            with open(poem_file, 'r', encoding='utf-8') as f:
                poem = json.load(f)
            return poem
        except Exception as e:
            print(f"错误：加载诗歌文件失败 - {e}")
            return None

    def generate_speech_text(self, poem):
        """生成朗读文本

        Args:
            poem: 诗歌数据

        Returns:
            str: 朗读文本
        """
        lines = []

        # 标题
        lines.append(poem['title'])
        lines.append("")  # 停顿

        # 朝代和作者
        if poem.get('dynasty'):
            lines.append(poem['dynasty'])
        lines.append(poem['author'])
        lines.append("")  # 停顿

        # 诗歌内容
        content_lines = []
        for line in poem['content']:
            text = line['text'].rstrip('，。、！？；：')
            content_lines.append(text)

        # 将诗句合并，每两句一组（更自然的朗读节奏）
        for i in range(0, len(content_lines), 2):
            if i + 1 < len(content_lines):
                lines.append(content_lines[i] + "，" + content_lines[i + 1] + "。")
            else:
                lines.append(content_lines[i] + "。")

        return "\n".join(lines)

    async def generate_audio(self, poem_id, poem=None):
        """生成单首诗歌的音频

        Args:
            poem_id: 诗歌 ID
            poem: 诗歌数据（如果已加载）

        Returns:
            bool: 生成是否成功
        """
        if poem is None:
            poem = self.load_poem(poem_id)
            if poem is None:
                return False

        # 检查音频是否已存在
        audio_file = self.get_audio_file(poem_id)
        if audio_file.exists():
            print(f"跳过：音频文件已存在 - {audio_file.name}")
            return True

        # 生成朗读文本
        speech_text = self.generate_speech_text(poem)
        print(f"\n生成诗歌 {poem_id}: {poem['title']}")
        print(f"朗读文本：\n{speech_text}")

        try:
            # 创建 TTS 对象
            communicate = edge_tts.Communicate(
                text=speech_text,
                voice=self.voice,
                rate=self.rate,
                volume=self.volume,
                pitch=self.pitch
            )

            # 生成音频文件
            await communicate.save(str(audio_file))

            print(f"成功：音频已生成 - {audio_file}")

            # 更新诗歌 JSON 文件的 audio 字段
            self.update_poem_audio_field(poem_id, audio_file)

            return True

        except Exception as e:
            print(f"错误：生成音频失败 - {e}")
            return False

    def update_poem_audio_field(self, poem_id, audio_file):
        """更新诗歌 JSON 文件的 audio 字段

        Args:
            poem_id: 诗歌 ID
            audio_file: 音频文件路径
        """
        poem_file = self.get_poem_file(poem_id)

        try:
            with open(poem_file, 'r', encoding='utf-8') as f:
                poem = json.load(f)

            # 计算 audio 字段的相对路径
            relative_path = f"assets/audio/recite/{audio_file.name}"
            poem['audio'] = relative_path

            with open(poem_file, 'w', encoding='utf-8') as f:
                json.dump(poem, f, ensure_ascii=False, indent=4)

            print(f"已更新诗歌 {poem_id} 的 audio 字段")

        except Exception as e:
            print(f"警告：更新 audio 字段失败 - {e}")

    async def generate_range(self, start_id, end_id):
        """生成指定范围的诗歌音频

        Args:
            start_id: 起始诗歌 ID
            end_id: 结束诗歌 ID
        """
        print(f"\n开始生成诗歌 {start_id} 到 {end_id} 的音频...")

        success_count = 0
        fail_count = 0

        for poem_id in range(start_id, end_id + 1):
            success = await self.generate_audio(poem_id)
            if success:
                success_count += 1
            else:
                fail_count += 1

            # 添加延迟，避免请求过快
            await asyncio.sleep(0.5)

        print(f"\n生成完成！成功：{success_count}，失败：{fail_count}")

    async def generate_missing(self):
        """生成所有缺失的诗歌音频"""
        print("\n检查缺失的诗歌音频...")

        missing_ids = []
        for poem_file in sorted(self.poems_dir.glob("*.json")):
            poem_id = int(poem_file.stem)
            audio_file = self.get_audio_file(poem_id)

            if not audio_file.exists():
                missing_ids.append(poem_id)

        if not missing_ids:
            print("所有诗歌音频都已存在！")
            return

        print(f"发现 {len(missing_ids)} 首诗歌缺失音频：{missing_ids}")

        success_count = 0
        fail_count = 0

        for poem_id in missing_ids:
            success = await self.generate_audio(poem_id)
            if success:
                success_count += 1
            else:
                fail_count += 1

            await asyncio.sleep(0.5)

        print(f"\n生成完成！成功：{success_count}，失败：{fail_count}")


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="唐诗音频生成工具")
    parser.add_argument("--id", type=int, help="生成指定诗歌的音频")
    parser.add_argument("--range", type=str, help="生成指定范围的音频（格式：369-372）")
    parser.add_argument("--sample", action="store_true", help="生成样例音频（369-372）")
    parser.add_argument("--all", action="store_true", help="生成所有缺失的音频")
    parser.add_argument("--project-root", type=str, help="项目根目录")

    args = parser.parse_args()

    generator = PoemAudioGenerator(project_root=args.project_root)

    if args.id:
        await generator.generate_audio(args.id)
    elif args.range:
        try:
            start, end = map(int, args.range.split('-'))
            await generator.generate_range(start, end)
        except ValueError:
            print("错误：范围格式不正确，应为 '369-372' 格式")
    elif args.sample:
        # 生成样例：诗歌 369-372
        await generator.generate_range(369, 372)
    elif args.all:
        await generator.generate_missing()
    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
