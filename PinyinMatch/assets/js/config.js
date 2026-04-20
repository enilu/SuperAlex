export const CONFIG = {
  storageKey: 'pinyin_match_stats',
  roundSize: 6,
  tickMs: 1000,
  successBonus: 10,
  streakBonus: 2,
  wrongPenalty: 2,
  levels: {
    k1: {
      label: '幼儿园',
      timeLimit: 75,
      dataset: [
        { char: '妈', pinyin: 'ma' },
        { char: '爸', pinyin: 'ba' },
        { char: '花', pinyin: 'hua' },
        { char: '鱼', pinyin: 'yu' },
        { char: '鸟', pinyin: 'niao' },
        { char: '日', pinyin: 'ri' },
        { char: '月', pinyin: 'yue' },
        { char: '风', pinyin: 'feng' },
        { char: '云', pinyin: 'yun' },
        { char: '山', pinyin: 'shan' },
        { char: '水', pinyin: 'shui' },
        { char: '田', pinyin: 'tian' }
      ]
    },
    g1: {
      label: '一年级',
      timeLimit: 65,
      dataset: [
        { char: '春', pinyin: 'chun' },
        { char: '夏', pinyin: 'xia' },
        { char: '秋', pinyin: 'qiu' },
        { char: '雨', pinyin: 'yu' },
        { char: '东', pinyin: 'dong' },
        { char: '南', pinyin: 'nan' },
        { char: '西', pinyin: 'xi' },
        { char: '北', pinyin: 'bei' },
        { char: '红', pinyin: 'hong' },
        { char: '黄', pinyin: 'huang' },
        { char: '蓝', pinyin: 'lan' },
        { char: '绿', pinyin: 'lv' },
        { char: '桥', pinyin: 'qiao' },
        { char: '船', pinyin: 'chuan' }
      ]
    },
    g2: {
      label: '二年级',
      timeLimit: 55,
      dataset: [
        { char: '船', pinyin: 'chuan' },
        { char: '晨', pinyin: 'chen' },
        { char: '窗', pinyin: 'chuang' },
        { char: '星', pinyin: 'xing' },
        { char: '勇', pinyin: 'yong' },
        { char: '虹', pinyin: 'hong' },
        { char: '草', pinyin: 'cao' },
        { char: '竹', pinyin: 'zhu' },
        { char: '池', pinyin: 'chi' },
        { char: '桥', pinyin: 'qiao' },
        { char: '暖', pinyin: 'nuan' },
        { char: '霞', pinyin: 'xia' },
        { char: '柳', pinyin: 'liu' },
        { char: '芽', pinyin: 'ya' }
      ]
    }
  }
};
