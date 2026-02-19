#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
三国演义题目音频生成脚本
使用 edge-tts 为题目生成朗读音频
"""

import json
import os
import sys
import argparse
import asyncio
import edge_tts
from pathlib import Path


class QuestionAudioGenerator:
    """题目音频生成器"""

    def __init__(self, project_root=None):
        """初始化生成器

        Args:
            project_root: 项目根目录，默认为脚本所在目录的父目录
        """
        if project_root is None:
            script_dir = Path(__file__).parent
            project_root = script_dir.parent

        self.project_root = Path(project_root)
        self.audio_dir = self.project_root / "assets" / "audio" / "questions"

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

    def get_audio_file(self, question_id):
        """获取音频文件路径

        Args:
            question_id: 题目 ID

        Returns:
            Path: 音频 MP3 文件路径
        """
        file_name = f"q{question_id:04d}.mp3"
        return self.audio_dir / file_name

    def load_questions(self):
        """加载题目数据

        Returns:
            list: 题目列表
        """
        # 从 config.js 中提取题目
        config_file = self.project_root / "assets" / "js" / "config.js"

        if not config_file.exists():
            print(f"错误：配置文件不存在 - {config_file}")
            return []

        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 提取 DEFAULT_QUESTIONS 数组
            import re
            pattern = r'DEFAULT_QUESTIONS:\s*\[(.*?)\];'
            match = re.search(pattern, content, re.DOTALL)

            if not match:
                print("错误：无法从 config.js 中提取题目数据")
                return []

            questions_json = "[" + match.group(1) + "]"
            questions = json.loads(questions_json)

            print(f"成功加载 {len(questions)} 道题目")
            return questions

        except Exception as e:
            print(f"错误：加载题目失败 - {e}")
            return []

    def load_questions_from_levels(self):
        """从关卡文件加载题目

        Returns:
            list: 题目列表
        """
        questions = []
        levels_dir = self.project_root / "assets" / "data" / "levels"

        for level_file in sorted(levels_dir.glob("level*.json")):
            try:
                with open(level_file, 'r', encoding='utf-8') as f:
                    level_questions = json.load(f)
                    questions.extend(level_questions)
            except Exception as e:
                print(f"警告：加载关卡文件失败 - {level_file}: {e}")

        print(f"成功从关卡文件加载 {len(questions)} 道题目")
        return questions

    def generate_speech_text(self, question):
        """生成朗读文本

        Args:
            question: 题目数据

        Returns:
            str: 朗读文本
        """
        lines = []

        # 题目内容
        lines.append(question['question'])

        # 选项
        options = question.get('options', [])
        for i, option in enumerate(options):
            option_label = ['A', 'B', 'C'][i]
            lines.append(f"{option_label}、{option}")

        return "。".join(lines) + "。"

    async def generate_audio(self, question_id, question=None):
        """生成单个题目的音频

        Args:
            question_id: 题目 ID
            question: 题目数据（如果已加载）

        Returns:
            bool: 生成是否成功
        """
        if question is None:
            # 从所有题目中查找
            questions = self.load_questions()
            question = next((q for q in questions if q['id'] == question_id), None)

            if question is None:
                print(f"错误：题目 ID {question_id} 不存在")
                return False

        # 检查音频是否已存在
        audio_file = self.get_audio_file(question_id)
        if audio_file.exists():
            print(f"跳过：音频文件已存在 - 题目 {question_id}")
            return True

        # 生成朗读文本
        speech_text = self.generate_speech_text(question)
        print(f"\n生成题目 {question_id} 音频")
        print(f"朗读文本：{speech_text[:100]}...")

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
            return True

        except Exception as e:
            print(f"错误：生成音频失败 - {e}")
            return False

    async def generate_range(self, start_id, end_id):
        """生成指定范围的题目音频

        Args:
            start_id: 起始题目 ID
            end_id: 结束题目 ID
        """
        print(f"\n开始生成题目 {start_id} 到 {end_id} 的音频...")

        questions = self.load_questions_from_levels()
        question_map = {q['id']: q for q in questions}

        success_count = 0
        fail_count = 0

        for question_id in range(start_id, end_id + 1):
            question = question_map.get(question_id)
            if question is None:
                print(f"跳过：题目 ID {question_id} 不存在")
                fail_count += 1
                continue

            success = await self.generate_audio(question_id, question)
            if success:
                success_count += 1
            else:
                fail_count += 1

            # 添加延迟，避免请求过快
            await asyncio.sleep(0.5)

        print(f"\n生成完成！成功：{success_count}，失败：{fail_count}")

    async def generate_all(self):
        """生成所有题目的音频"""
        questions = self.load_questions_from_levels()

        print(f"\n开始生成 {len(questions)} 道题目的音频...")

        success_count = 0
        fail_count = 0

        for question in questions:
            question_id = question['id']
            audio_file = self.get_audio_file(question_id)

            # 跳过已存在的
            if audio_file.exists():
                print(f"跳过：音频文件已存在 - 题目 {question_id}")
                success_count += 1
                continue

            success = await self.generate_audio(question_id, question)
            if success:
                success_count += 1
            else:
                fail_count += 1

            await asyncio.sleep(0.5)

        print(f"\n生成完成！成功：{success_count}，失败：{fail_count}")


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="三国演义题目音频生成工具")
    parser.add_argument("--id", type=int, help="生成指定题目的音频")
    parser.add_argument("--range", type=str, help="生成指定范围的音频（格式：1-10）")
    parser.add_argument("--all", action="store_true", help="生成所有题目的音频")
    parser.add_argument("--sample", action="store_true", help="生成样例音频（1-5）")
    parser.add_argument("--project-root", type=str, help="项目根目录")

    args = parser.parse_args()

    generator = QuestionAudioGenerator(project_root=args.project_root)

    if args.id:
        await generator.generate_audio(args.id)
    elif args.range:
        try:
            start, end = map(int, args.range.split('-'))
            await generator.generate_range(start, end)
        except ValueError:
            print("错误：范围格式不正确，应为 '1-10' 格式")
    elif args.sample:
        await generator.generate_range(1, 5)
    elif args.all:
        await generator.generate_all()
    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
