const fs = require('fs');
const path = require('path');

const poemsDir = 'D:/workspace/tare/SuperAlex/TangPoem/assets/data/poems';
const indexFile = path.join(poemsDir, 'poems.json');

// 读取索引文件
const indexData = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));

// 找出当前最大的ID
const currentMaxId = Math.max(...indexData.poems.map(p => p.id));
console.log(`当前最大ID: ${currentMaxId}`);

// 扫描100-254.json文件，找出"小学生必背"诗词
const requiredPoems = [];
let newId = currentMaxId + 1;

for (let i = 100; i <= 254; i++) {
    const oldFile = path.join(poemsDir, `${i}.json`);
    if (fs.existsSync(oldFile)) {
        try {
            const poemData = JSON.parse(fs.readFileSync(oldFile, 'utf-8'));
            if (poemData.grade === '小学生必背') {
                console.log(`找到必背诗词: ${poemData.title} (ID: ${i})`);

                // 更新诗词ID
                poemData.id = newId;

                // 写入新文件
                const newFile = path.join(poemsDir, `${newId}.json`);
                fs.writeFileSync(newFile, JSON.stringify(poemData, null, 4), 'utf-8');

                // 删除旧文件
                fs.unlinkSync(oldFile);

                // 添加到索引
                requiredPoems.push({
                    id: newId,
                    file: `${newId}.json`,
                    title: poemData.title,
                    author: poemData.author,
                    grade: '小学生必背'
                });

                console.log(`  → 重命名为: ${newId}.json`);
                newId++;
            }
        } catch (err) {
            console.error(`处理文件 ${i}.json 时出错:`, err.message);
        }
    }
}

// 更新索引文件
indexData.poems.push(...requiredPoems);
indexData.totalCount = indexData.poems.length;
indexData.lastUpdate = new Date().toISOString().split('T')[0];

// 按ID排序索引
indexData.poems.sort((a, b) => a.id - b.id);

// 写回索引文件
fs.writeFileSync(indexFile, JSON.stringify(indexData, null, 4), 'utf-8');

console.log(`\n完成！`);
console.log(`处理诗词数量: ${requiredPoems.length}`);
console.log(`新ID范围: ${currentMaxId + 1} - ${newId - 1}`);
console.log(`诗词总数: ${indexData.totalCount}`);
