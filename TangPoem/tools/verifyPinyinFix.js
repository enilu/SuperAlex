const fs = require('fs');
const path = require('path');

const poemsDir = path.join(__dirname, 'assets', 'data', 'poems');

function verifyPinyinFix() {
    const files = fs.readdirSync(poemsDir).filter(f => f.endsWith('.json'));

    let totalFiles = 0;
    let issues = [];

    files.forEach(file => {
        const filePath = path.join(poemsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        let poem;

        try {
            poem = JSON.parse(content);
        } catch (e) {
            issues.push(`${file}: JSON解析错误`);
            return;
        }

        if (!poem.content || !Array.isArray(poem.content)) {
            return;
        }

        totalFiles++;

        // 检查是否有空拼音
        const emptyPinyinLines = poem.content.filter(line => !line.pinyin || line.pinyin.trim() === '');
        if (emptyPinyinLines.length > 0) {
            issues.push(`${file} (${poem.title}): 有 ${emptyPinyinLines.length} 行空拼音`);
        }

        // 检查是否有逗号分隔的拼音
        const commaPinyinLines = poem.content.filter(line => {
            const pinyin = line.pinyin || '';
            // 排除正常的逗号结尾
            return pinyin.includes(' ， ') && !pinyin.endsWith(' ，') && !pinyin.endsWith(' ， 。');
        });

        if (commaPinyinLines.length > 0) {
            issues.push(`${file} (${poem.title}): 有 ${commaPinyinLines.length} 行包含逗号分隔的拼音`);
        }

        // 检查是否有错误的标点组合
        const badPunctLines = poem.content.filter(line => {
            const pinyin = line.pinyin || '';
            return pinyin.includes(' ， 。') || pinyin.includes(' 。 ，');
        });

        if (badPunctLines.length > 0) {
            issues.push(`${file} (${poem.title}): 有 ${badPunctLines.length} 行包含错误的标点组合`);
        }
    });

    console.log(`\n验证结果：`);
    console.log(`总文件数：${totalFiles}`);
    console.log(`发现问题数：${issues.length}`);

    if (issues.length > 0) {
        console.log(`\n问题列表：`);
        issues.slice(0, 20).forEach(issue => {
            console.log(`  - ${issue}`);
        });

        if (issues.length > 20) {
            console.log(`  ... 还有 ${issues.length - 20} 个问题`);
        }
    } else {
        console.log(`\n所有文件的拼音格式都正确！`);
    }
}

verifyPinyinFix();
