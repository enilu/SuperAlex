const fs = require('fs');
const path = require('path');

const poemsDir = path.join(__dirname, '../assets/data/poems');
const audioDir = path.join(__dirname, '../assets/audio/recite');

// 获取所有诗歌文件
const poemFiles = fs.readdirSync(poemsDir)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => {
        const aNum = parseInt(a.replace('.json', ''));
        const bNum = parseInt(b.replace('.json', ''));
        return aNum - bNum;
    });

// 获取所有音频文件
const audioFiles = fs.readdirSync(audioDir)
    .filter(f => f.endsWith('.mp3'))
    .map(f => f.replace('.mp3', ''))
    .sort((a, b) => parseInt(a) - parseInt(b));

const issues = [];
const audioSet = new Set(audioFiles);

// 检查每个诗歌文件
poemFiles.forEach(file => {
    const filePath = path.join(poemsDir, file);
    const poem = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const fileNum = file.replace('.json', '');
    const fileNumInt = parseInt(fileNum);

    // 检查 ID 是否与文件名一致
    if (poem.id !== fileNumInt) {
        issues.push({
            type: 'id_mismatch',
            file: file,
            poemId: poem.id,
            fileId: fileNumInt,
            title: poem.title
        });
    }

    // 检查 audio 字段
    const audioNum = poem.audio ? poem.audio.replace('assets/audio/recite/', '').replace('.mp3', '') : null;
    if (!poem.audio || poem.audio === '') {
        issues.push({
            type: 'no_audio',
            file: file,
            poemId: poem.id,
            title: poem.title
        });
    } else if (audioNum !== fileNum) {
        issues.push({
            type: 'audio_mismatch',
            file: file,
            poemId: poem.id,
            audioField: audioNum,
            title: poem.title
        });
    }

    // 检查音频文件是否存在
    if (audioNum && !audioSet.has(audioNum)) {
        issues.push({
            type: 'audio_file_missing',
            file: file,
            poemId: poem.id,
            expectedAudio: audioNum,
            title: poem.title
        });
    }
});

// 检查有没有多余的音频文件（没有对应诗歌）
audioFiles.forEach(audioNum => {
    const poemFile = `${audioNum.padStart(3, '0')}.json`;
    if (!fs.existsSync(path.join(poemsDir, poemFile))) {
        issues.push({
            type: 'orphan_audio',
            audioNum: audioNum,
            audioFile: `${audioNum}.mp3`
        });
    }
});

// 输出结果
console.log('=== 检查结果 ===');
console.log(`诗歌文件总数: ${poemFiles.length}`);
console.log(`音频文件总数: ${audioFiles.length}`);
console.log(`发现问题: ${issues.length}`);

if (issues.length > 0) {
    console.log('\n=== 问题详情 ===');
    issues.forEach(issue => {
        switch (issue.type) {
            case 'id_mismatch':
                console.log(`[ID不匹配] ${issue.file} - ID=${issue.poemId}, 文件名=${issue.fileId} - ${issue.title}`);
                break;
            case 'no_audio':
                console.log(`[无音频] ${issue.file} - ${issue.title}`);
                break;
            case 'audio_mismatch':
                console.log(`[音频不匹配] ${issue.file} - poem.id=${issue.poemId}, audio=${issue.audioField} - ${issue.title}`);
                break;
            case 'audio_file_missing':
                console.log(`[音频文件缺失] ${issue.file} - 缺少音频 ${issue.expectedAudio}.mp3 - ${issue.title}`);
                break;
            case 'orphan_audio':
                console.log(`[孤立音频] ${issue.audioFile} - 没有对应的诗歌文件`);
                break;
        }
    });
} else {
    console.log('✓ 所有诗歌的 ID 与文件名一致');
    console.log('✓ 所有诗歌的 audio 字段正确');
    console.log('✓ 所有音频文件都有对应的诗歌');
}
