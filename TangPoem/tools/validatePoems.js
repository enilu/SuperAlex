const fs = require('fs');
const path = require('path');

const poemsDir = path.join(__dirname, '../assets/data/poems');

// 读取所有JSON文件
const files = fs.readdirSync(poemsDir)
    .filter(file => file.endsWith('.json'))
    .sort((a, b) => {
        const idA = parseInt(a.replace('.json', ''));
        const idB = parseInt(b.replace('.json', ''));
        return idA - idB;
    });

console.log(`找到 ${files.length} 个JSON文件`);

// 检查每个文件
let errors = 0;
let warnings = 0;

// 检查ID范围
const ids = files.map(f => parseInt(f.replace('.json', '')));
const minId = Math.min(...ids);
const maxId = Math.max(...ids);

console.log(`\nID范围: ${minId} - ${maxId}`);

// 检查ID连续性
const missingIds = [];
for (let i = minId; i <= maxId; i++) {
    if (!ids.includes(i)) {
        missingIds.push(i);
    }
}

if (missingIds.length > 0) {
    console.log(`缺失的ID: ${missingIds.join(', ')}`);
}

// 统计作者和朝代
const authors = {};
const dynasties = {};
const duplicates = [];

files.forEach(file => {
    try {
        const content = JSON.parse(fs.readFileSync(path.join(poemsDir, file), 'utf-8'));

        // 检查必要字段
        if (!content.id || !content.title || !content.author || !content.dynasty || !content.content) {
            console.error(`文件 ${file} 缺少必要字段`);
            errors++;
        }

        // 检查内容是否为空
        if (!content.content || content.content.length === 0) {
            console.error(`文件 ${file} 内容为空`);
            errors++;
        }

        // 检查拼音
        content.content.forEach((line, index) => {
            if (!line.pinyin || line.pinyin.trim() === '') {
                console.warn(`文件 ${file} 第${index + 1}行缺少拼音: ${line.text}`);
                warnings++;
            }
        });

        // 统计作者
        if (content.author) {
            if (!authors[content.author]) {
                authors[content.author] = 0;
            }
            authors[content.author]++;
        }

        // 统计朝代
        if (content.dynasty) {
            if (!dynasties[content.dynasty]) {
                dynasties[content.dynasty] = 0;
            }
            dynasties[content.dynasty]++;
        }

    } catch (error) {
        console.error(`解析文件 ${file} 失败:`, error.message);
        errors++;
    }
});

// 显示作者统计
console.log('\n作者统计（前10个）:');
const sortedAuthors = Object.entries(authors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
sortedAuthors.forEach(([author, count]) => {
    console.log(`  ${author}: ${count}首`);
});

// 显示朝代统计
console.log('\n朝代统计:');
Object.entries(dynasties)
    .sort((a, b) => b[1] - a[1])
    .forEach(([dynasty, count]) => {
        console.log(`  ${dynasty}: ${count}首`);
    });

console.log(`\n验证完成: ${errors} 个错误, ${warnings} 个警告`);

// 显示几个示例文件
console.log('\n示例文件（前5个）:');
files.slice(0, 5).forEach(file => {
    const content = JSON.parse(fs.readFileSync(path.join(poemsDir, file), 'utf-8'));
    console.log(`  ${file}: ${content.title} - ${content.author} (${content.dynasty})`);
});

console.log('\n示例文件（最后5个）:');
files.slice(-5).forEach(file => {
    const content = JSON.parse(fs.readFileSync(path.join(poemsDir, file), 'utf-8'));
    console.log(`  ${file}: ${content.title} - ${content.author} (${content.dynasty})`);
});
