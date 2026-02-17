const fs = require('fs');
const path = require('path');
const pinyinPro = require('pinyin');

// 读取txt文件内容
const txtFilePath = path.join(__dirname, '../小学生必背75+80首.txt');
const outputDir = path.join(__dirname, '../assets/data/poems');

const content = fs.readFileSync(txtFilePath, 'utf-8');

// 错别字修正映射（仅在作者字段中使用）
const authorCorrections = {
    '王之焕': '王之涣',
    '白': '白居易', // 修正不完整的作者名
};

// 诗句中的错别字修正
const contentCorrections = {
    '水风吹雁雪纷纷': '北风吹雁雪纷纷',
};

// 解析诗词
function parsePoems(text) {
    const poems = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    let currentPoem = null;
    let i = 0;
    let startId = 100;
    let inExtendedSection = false;

    while (i < lines.length) {
        const line = lines[i];

        // 检查是否是分隔标题（"必备75首" 或 "扩展80首"）
        if (line === '必备75首') {
            i++;
            continue;
        }

        if (line === '扩展80首') {
            inExtendedSection = true;
            startId = 175; // 75 + 100
            i++;
            continue;
        }

        // 检查是否是标题行（如 "1.江南" 或 "18古朗月行(节选)"）
        const titleMatch = line.match(/^(\d+)\.?(.+)$/);

        // 跳过包含拼音标注的行（如 敕(chì)勒(lè)歌）
        // 但保留包含中文数字的行
        if (line.includes('(chì') || line.includes('lè') || line.includes('sài') || line.includes('fú') ||
            line.includes('zhài') || line.includes('hàn') || line.includes('Ā')) {
            // 如果这些行看起来像标题，尝试提取标题
            const titleFromPinyinLine = line.replace(/\([^)]*\)/g, '').replace(/[（(][^）)]*[）)]/g, '').trim();
            const titleNumberMatch = line.match(/^(\d+)\./);
            if (titleNumberMatch && titleFromPinyinLine) {
                // 保存上一首诗
                if (currentPoem && currentPoem.content.length > 0) {
                    poems.push(currentPoem);
                }

                const titleNumber = titleNumberMatch[1];
                const title = titleFromPinyinLine.replace(/^\d+\./, '').trim();

                currentPoem = {
                    id: startId + parseInt(titleNumber) - 1,
                    title: title,
                    author: '',
                    dynasty: '',
                    grade: '小学生必背',
                    content: [],
                    annotation: '',
                    translation: '',
                    audio: ''
                };

                i++;
                continue;
            }
            i++;
            continue;
        }

        if (titleMatch) {
            // 保存上一首诗
            if (currentPoem && currentPoem.content.length > 0) {
                poems.push(currentPoem);
            }

            const titleNumber = titleMatch[1];
            const rawTitle = titleMatch[2].trim();

            // 处理标题中的拼音标注
            let title = rawTitle;
            const titlePinyinMatches = rawTitle.match(/\([^)]*\)/g);
            if (titlePinyinMatches) {
                titlePinyinMatches.forEach(match => {
                    title = title.replace(match, '').trim();
                });
            }

            currentPoem = {
                id: startId + parseInt(titleNumber) - 1,
                title: title,
                author: '',
                dynasty: '',
                grade: '小学生必背',
                content: [],
                annotation: '',
                translation: '',
                audio: ''
            };

            i++;
            continue;
        }

        // 解析作者和朝代
        if (currentPoem && !currentPoem.author) {
            // 移除行内的拼音标注
            let cleanLine = line.replace(/\([^)]*\)/g, '').replace(/[（(][^）)]*[）)]/g, '').trim();

            // 检查是否是作者行
            // 如果这行包含朝代标记[...]或者是短的中文字符串，很可能是作者行
            if (cleanLine.startsWith('[') || cleanLine.includes('·') ||
                cleanLine === '汉乐府' || cleanLine === '北朝民歌' ||
                cleanLine === '[先秦]' ||
                (cleanLine.length <= 10 && /^[一-龥]+$/.test(cleanLine) && !cleanLine.includes('诗') && !currentPoem.content.some(c => c.text === cleanLine))) {

                if (cleanLine.startsWith('[')) {
                    // 格式: [唐]李白
                    const match = cleanLine.match(/\[([^\]]+)\](.+)/);
                    if (match) {
                        currentPoem.dynasty = match[1];
                        currentPoem.author = match[2].trim();
                    }
                } else if (cleanLine.includes('·')) {
                    // 格式: [三国·魏]曹植 或 三国·魏]曹植
                    const parts = cleanLine.split('·');
                    if (parts.length >= 2) {
                        const lastPart = parts[parts.length - 1];
                        if (lastPart.includes(']')) {
                            const dynastyParts = lastPart.split(']');
                            currentPoem.dynasty = dynastyParts[0];
                            currentPoem.author = dynastyParts[1] ? dynastyParts[1].trim() : parts[parts.length - 2].replace('[', '').trim();
                        } else {
                            currentPoem.author = lastPart.trim();
                            currentPoem.dynasty = parts[0].replace('[', '').trim();
                        }
                    }
                } else if (cleanLine === '汉乐府') {
                    currentPoem.dynasty = '汉';
                    currentPoem.author = '汉乐府';
                } else if (cleanLine === '北朝民歌') {
                    currentPoem.dynasty = '北朝';
                    currentPoem.author = '北朝民歌';
                } else if (cleanLine === '[先秦]') {
                    currentPoem.dynasty = '先秦';
                    currentPoem.author = '佚名';
                } else if (/^[一-龥]+$/.test(cleanLine)) {
                    // 可能是纯作者名
                    currentPoem.author = cleanLine;
                    if (!currentPoem.dynasty) {
                        currentPoem.dynasty = '唐'; // 默认为唐代
                    }
                }

                // 应用错别字修正
                if (currentPoem.author && authorCorrections[currentPoem.author]) {
                    currentPoem.author = authorCorrections[currentPoem.author];
                }

                i++;
                continue;
            }
        }

        // 解析诗句
        if (currentPoem && currentPoem.author) {
            // 移除行内的拼音标注
            const cleanLine = line.replace(/\([^)]*\)/g, '').replace(/[（(][^）)]*[）)]/g, '').trim();

            // 如果不是空行且不是标题行，则作为诗句
            if (cleanLine && !cleanLine.match(/^\d+\./) &&
                !cleanLine.startsWith('[') &&
                !cleanLine.includes('·') &&
                cleanLine !== '汉乐府' &&
                cleanLine !== '北朝民歌' &&
                cleanLine !== '[先秦]') {

                // 应用错别字修正
                let correctedLine = cleanLine;
                Object.keys(contentCorrections).forEach(key => {
                    if (correctedLine.includes(key)) {
                        correctedLine = correctedLine.replace(key, contentCorrections[key]);
                    }
                });

                // 生成拼音
                try {
                    const py = pinyinPro.pinyin(correctedLine, {
                        style: pinyinPro.STYLE_NORMAL,
                        heteronym: false
                    }).map(arr => arr[0]).join(' ');

                    currentPoem.content.push({
                        text: correctedLine,
                        pinyin: py
                    });
                } catch (e) {
                    console.warn(`生成拼音失败: ${correctedLine}`, e.message);
                    currentPoem.content.push({
                        text: correctedLine,
                        pinyin: ''
                    });
                }
            }
        }

        i++;
    }

    // 保存最后一首诗
    if (currentPoem && currentPoem.content.length > 0) {
        poems.push(currentPoem);
    }

    return poems;
}

// 主函数
function main(force = false) {
    console.log('开始解析诗词...');
    if (force) {
        console.log('强制模式：将覆盖已存在的文件');
    }

    const poems = parsePoems(content);

    console.log(`共解析到 ${poems.length} 首诗词`);

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入JSON文件
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    poems.forEach((poem, index) => {
        try {
            const fileName = `${poem.id}.json`;
            const filePath = path.join(outputDir, fileName);

            // 检查文件是否已存在
            if (!force && fs.existsSync(filePath)) {
                skipCount++;
                return;
            }

            const jsonContent = JSON.stringify(poem, null, 4);
            fs.writeFileSync(filePath, jsonContent, 'utf-8');

            successCount++;

            if ((index + 1) % 10 === 0) {
                console.log(`已处理 ${index + 1}/${poems.length} 首诗词`);
            }
        } catch (error) {
            errorCount++;
            console.error(`写入文件失败: ${poem.title}`, error.message);
        }
    });

    console.log('\n转换完成！');
    console.log(`成功: ${successCount} 个文件`);
    console.log(`失败: ${errorCount} 个文件`);
    console.log(`跳过: ${skipCount} 个文件（已存在）`);

    // 显示前5首诗的信息用于调试
    console.log('\n前5首诗的信息:');
    poems.slice(0, 5).forEach(poem => {
        console.log(`ID: ${poem.id}, 标题: ${poem.title}, 作者: ${poem.author}, 朝代: ${poem.dynasty}`);
    });

    // 显示最后5首诗的信息
    console.log('\n最后5首诗的信息:');
    poems.slice(-5).forEach(poem => {
        console.log(`ID: ${poem.id}, 标题: ${poem.title}, 作者: ${poem.author}, 朝代: ${poem.dynasty}`);
    });
}

// 检查命令行参数
const force = process.argv.includes('--force') || process.argv.includes('-f');
main(force);
