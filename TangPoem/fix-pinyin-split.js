const fs = require('fs');
const path = require('path');

const poemsDir = path.join(__dirname, 'assets', 'data', 'poems');

function fixPinyinSplit() {
    const files = fs.readdirSync(poemsDir).filter(f => f.endsWith('.json'));

    let fixedCount = 0;
    const fixedPoems = [];

    files.forEach(file => {
        const filePath = path.join(poemsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        let poem;

        try {
            poem = JSON.parse(content);
        } catch (e) {
            console.error(`Failed to parse ${file}:`, e.message);
            return;
        }

        if (!poem.content || !Array.isArray(poem.content)) {
            return;
        }

        let modified = false;

        for (let i = 0; i < poem.content.length; i++) {
            const line = poem.content[i];
            const pinyin = line.pinyin || '';

            // 检查是否包含逗号或句号分隔的拼音（中文标点）
            if (pinyin.includes(' ， ') || pinyin.includes(' 。 ')) {
                // 按照中文标点分割
                const parts = pinyin.split(/ [，。] /).map(p => p.trim()).filter(p => p);

                if (parts.length >= 2) {
                    // 检查当前行的文本是否包含多个句子
                    const textSentences = line.text.split(/[，。]/).filter(t => t.trim());

                    if (textSentences.length === 1 && parts.length >= 2) {
                        // 当前行只有一个句子，但拼音有多个部分
                        // 第一部分给当前行
                        line.pinyin = parts[0] + (pinyin.includes(' ， ') ? ' ，' : ' 。');

                        // 后续部分分配给接下来的空拼音行
                        let partIndex = 1;
                        for (let j = i + 1; j < poem.content.length && partIndex < parts.length; j++) {
                            const nextLine = poem.content[j];
                            if (!nextLine.pinyin || nextLine.pinyin === '') {
                                nextLine.pinyin = parts[partIndex];
                                partIndex++;
                                i++; // 跳过已处理的行
                                modified = true;
                            } else {
                                break;
                            }
                        }
                    } else if (textSentences.length > 1 && parts.length >= textSentences.length) {
                        // 当前行包含多个句子，需要拆分
                        const newLines = [];
                        for (let k = 0; k < textSentences.length; k++) {
                            // 根据文本中的标点符号确定拼音标点
                            const textEnd = line.text.indexOf(textSentences[k]) + textSentences[k].length;
                            const nextChar = line.text.charAt(textEnd);
                            const punctuation = nextChar.match(/[，。]/) ? nextChar : (k < textSentences.length - 1 ? '，' : '。');

                            // 根据标点符号类型确定拼音标点
                            const pinyinPunct = punctuation === '，' ? ' ，' : ' 。';

                            newLines.push({
                                text: textSentences[k] + punctuation,
                                pinyin: parts[k] + pinyinPunct
                            });
                        }
                        // 替换当前行
                        poem.content.splice(i, 1, ...newLines);
                        i += newLines.length - 1; // 调整索引
                        modified = true;
                    }
                }
            }
        }

        if (modified) {
            fixedCount++;
            fixedPoems.push(poem.title);
            fs.writeFileSync(filePath, JSON.stringify(poem, null, 4), 'utf-8');
        }
    });

    console.log(`\n处理完成！`);
    console.log(`共修复了 ${fixedCount} 首诗词的拼音分割问题\n`);
    console.log(`前10首修复的诗词：`);
    fixedPoems.slice(0, 10).forEach((title, index) => {
        console.log(`${index + 1}. ${title}`);
    });
}

fixPinyinSplit();
