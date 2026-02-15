const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// 读取现有唐诗
const existingPoemsDir = path.join(__dirname, '../assets/data/poems');
const existingPoems = [];

// 读取所有现有的JSON文件
for (let i = 1; i <= 90; i++) {
    const fileNum = String(i).padStart(3, '0');
    const filePath = path.join(existingPoemsDir, `${fileNum}.json`);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const poem = JSON.parse(content);
        existingPoems.push({
            title: poem.title,
            author: poem.author
        });
    }
}

console.log(`现有唐诗数量: ${existingPoems.length}`);

// 简单的标题-作者匹配函数
function isPoemExists(title, author) {
    return existingPoems.some(p =>
        p.title === title && p.author === author
    );
}

// 读取并解析XML文件
const xmlContent = fs.readFileSync(path.join(__dirname, '../tangshi300.xml'), 'utf-8');

xml2js.parseString(xmlContent, (err, result) => {
    if (err) {
        console.error('XML解析错误:', err);
        return;
    }

    const nodes = result.root.node;
    console.log(`XML中唐诗总数: ${nodes.length}`);

    const newPoems = [];
    let nextId = 91; // 从091开始

    nodes.forEach((node, index) => {
        const title = node.title[0];
        const author = node.auth[0];
        const type = node.type ? node.type[0] : '';
        const content = node.content[0];
        const desc = node.desc ? node.desc[0] : '';

        // 检查是否已存在
        if (isPoemExists(title, author)) {
            console.log(`跳过已存在: ${title} - ${author}`);
            return;
        }

        // 清理诗句内容并按行分割
        const rawLines = content
            .replace(/<br\s*\/?>/gi, '\n')
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0);

        // 将每行按标点符号（逗号、句号等）分割成单独的诗句
        const allLines = [];
        rawLines.forEach(line => {
            // 按中文标点符号分割，并去掉标点符号
            const parts = line.split(/([，。！？；：])/);
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i].trim();
                // 只保留非标点符号的内容
                if (part.length > 0 && part !== '，' && part !== '。' && part !== '！' && part !== '？' && part !== '；' && part !== '：') {
                    allLines.push(part);
                }
            }
        });

        // 提取注释和译文
        let annotation = '';
        let translation = '';

        // 简单解析desc
        if (desc) {
            const cleanDesc = desc
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&quot;/g, '"')
                .replace(/&ldquo;/g, '"')
                .replace(/&rdquo;/g, '"')
                .replace(/&middot;/g, '·');

            // 尝试提取译文
            const translationMatch = cleanDesc.match(/译文[:：](.*?)(?=赏析|$)/s);
            if (translationMatch) {
                translation = translationMatch[1].trim();
            }

            // 尝试提取注释
            const annotationMatch = cleanDesc.match(/(?:注解|注释)[:：](.*?)(?=译文|赏析|$)/s);
            if (annotationMatch) {
                annotation = annotationMatch[1].trim();
            }

            // 如果没有找到译文，使用部分desc
            if (!translation && cleanDesc.length > 0) {
                translation = cleanDesc.substring(0, 200) + '...';
            }
        }

        // 构建唐诗对象
        const poem = {
            id: nextId++,
            title: title,
            author: author,
            dynasty: "唐",
            grade: "小学课外",
            content: allLines.map(line => ({
                text: line,
                pinyin: "" // 拼音暂时留空，需要后续补充
            })),
            annotation: annotation || "暂无注释",
            translation: translation || "暂无译文",
            audio: `assets/audio/recite/${String(nextId - 1).padStart(3, '0')}.mp3`
        };

        newPoems.push(poem);
    });

    console.log(`\n找到 ${newPoems.length} 首新唐诗`);

    // 删除旧的新唐诗文件
    for (let i = 91; i <= 368; i++) {
        const fileNum = String(i).padStart(3, '0');
        const filePath = path.join(existingPoemsDir, `${fileNum}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    console.log('已删除旧的新唐诗文件');

    // 保存新唐诗到文件
    newPoems.forEach(poem => {
        const fileNum = String(poem.id).padStart(3, '0');
        const filePath = path.join(existingPoemsDir, `${fileNum}.json`);
        fs.writeFileSync(filePath, JSON.stringify(poem, null, 4), 'utf-8');
        console.log(`创建: ${fileNum}.json - ${poem.title} - ${poem.author}`);
    });

    // 更新poems_index.json
    const indexPath = path.join(__dirname, '../assets/data/poems_index.json');
    let indexData = { poems: [] };

    if (fs.existsSync(indexPath)) {
        indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    }

    // 添加新唐诗到索引
    newPoems.forEach(poem => {
        indexData.poems.push({
            id: poem.id,
            title: poem.title,
            author: poem.author,
            file: `${String(poem.id).padStart(3, '0')}.json`
        });
    });

    // 按ID排序
    indexData.poems.sort((a, b) => a.id - b.id);

    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 4), 'utf-8');
    console.log(`\n更新索引文件，总唐诗数: ${indexData.poems.length}`);
});
