const fs = require('fs');
const path = require('path');

const poemsDir = path.join(__dirname, '../assets/data/poems');
const poems = [];

// 读取所有JSON文件
const files = fs.readdirSync(poemsDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
    const filePath = path.join(poemsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const poem = JSON.parse(content);
    poems.push({
        id: poem.id,
        title: poem.title,
        author: poem.author,
        file: file
    });
});

// 按ID排序
poems.sort((a, b) => a.id - b.id);

// 写入索引文件
const indexPath = path.join(__dirname, '../assets/data/poems_index.json');
fs.writeFileSync(indexPath, JSON.stringify({ poems }, null, 4), 'utf-8');

console.log(`更新完成，共 ${poems.length} 首唐诗`);
console.log(`ID范围: ${poems[0].id} - ${poems[poems.length - 1].id}`);
