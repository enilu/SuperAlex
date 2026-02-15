const fs = require('fs');
const path = require('path');
const { pinyin: pinyinFunc } = require('pinyin');

// 多音字修正规则 - 基于唐诗语境的常见多音字
const polyphoneRules = {
    // 动词多音字
    '看': {
        default: 'kàn',
        context: {
            '看': 'kān',  // 看守、看护
        }
    },
    '思': {
        default: 'sī',
    },
    '闻': {
        default: 'wén',
    },
    '听': {
        default: 'tīng',
    },
    '见': {
        default: 'jiàn',
        context: {
            '相见': 'xiāng',  // 见(xiāng)用于"相见"等词
        }
    },

    // 介词/连词
    '为': {
        default: 'wéi',
        context: {
            '为': 'wèi',  // 为(wèi)用于"因为"、"为了"等
        }
    },
    '于': {
        default: 'yú',
    },
    '以': {
        default: 'yǐ',
    },

    // 形容词/副词
    '长': {
        default: 'cháng',
        context: {
            '长': 'zhǎng',  // zhǎng用于"成长"、"长大"
        }
    },
    '少': {
        default: 'shǎo',
        context: {
            '少': 'shào',  // shào用于"少年"、"老少"
        }
    },
    '好': {
        default: 'hǎo',
        context: {
            '好': 'hào',  // hào用于"爱好"
        }
    },
    '分': {
        default: 'fēn',
        context: {
            '分': 'fèn',  // fèn用于"身分"、"本分"
        }
    },
    '更': {
        default: 'gèng',
        context: {
            '更': 'gēng',  // gēng用于"更次"、"三更"
        }
    },
    '数': {
        default: 'shù',
        context: {
            '数': 'shǔ',  // shǔ用于"数数"
            '数': 'shuò',  // shuò用于"数见不鲜"
        }
    },
    '便': {
        default: 'biàn',
        context: {
            '便': 'pián',  // pián用于"便宜"
        }
    },
    '相': {
        default: 'xiāng',
        context: {
            '相': 'xiàng',  // xiàng用于"相貌"
        }
    },
    '行': {
        default: 'xíng',
        context: {
            '行': 'háng',  // háng用于"行业"、"行列"
        }
    },
    '中': {
        default: 'zhōng',
        context: {
            '中': 'zhòng',  // zhòng用于"中箭"、"中奖"
        }
    },
    '重': {
        default: 'zhòng',
        context: {
            '重': 'chóng',  // chóng用于"重复"、"重新"
        }
    },
    '空': {
        default: 'kōng',
        context: {
            '空': 'kòng',  // kòng用于"空白"、"空闲"
        }
    },
    '尽': {
        default: 'jìn',
        context: {
            '尽': 'jǐn',  // jǐn用于"尽管"、"尽量"
        }
    },
    '强': {
        default: 'qiáng',
        context: {
            '强': 'qiǎng',  // qiǎng用于"勉强"
            '强': 'jiàng',  // jiàng用于"倔强"
        }
    },
    '盛': {
        default: 'shèng',
        context: {
            '盛': 'chéng',  // chéng用于"盛饭"
        }
    },
    '传': {
        default: 'chuán',
        context: {
            '传': 'zhuàn',  // zhuàn用于"传记"
        }
    },
    '舍': {
        default: 'shě',
        context: {
            '舍': 'shè',  // shè用于"房舍"、"宿舍"
        }
    },
    '都': {
        default: 'dōu',
        context: {
            '都': 'dū',  // dū用于"首都"、"都城"
        }
    },
    '还': {
        default: 'huán',
        context: {
            '还': 'hái',  // hái用于"还有"、"还是"
        }
    },
    '觉': {
        default: 'jué',
        context: {
            '觉': 'jiào',  // jiào用于"睡觉"
        }
    },
    '解': {
        default: 'jiě',
        context: {
            '解': 'jiè',  // jiè用于"押解"、"解差"
            '解': 'xiè',  // xiè用于"懈"有时混用
        }
    },
    '校': {
        default: 'xiào',
        context: {
            '校': 'jiào',  // jiào用于"校对"、"校场"
        }
    },
    '兴': {
        default: 'xīng',
        context: {
            '兴': 'xìng',  // xìng用于"高兴"、"兴趣"
        }
    },
    '王': {
        default: 'wáng',
        context: {
            '王': 'wàng',  // wàng用于"王天下"(称王)
        }
    },
    '咽': {
        default: 'yān',
        context: {
            '咽': 'yàn',  // yàn用于"吞咽"
            '咽': 'yè',  // yè用于"呜咽"
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"(古国名)
        }
    },
    '骑': {
        default: 'qí',
        context: {
            '骑': 'jì',  // jì用于"骑兵"(古音)
        }
    },
    '邪': {
        default: 'xié',
        context: {
            '邪': 'yé',  // yé用于"语气词"
        }
    },
    '也': {
        default: 'yě',
    },
    '治': {
        default: 'zhì',
        context: {
            '治': 'chí',  // chí用于"治水"等古义
        }
    },
    '稽': {
        default: 'jī',
        context: {
            '稽': 'qǐ',  // qǐ用于"稽首"
        }
    },
    '女': {
        default: 'nǚ',
        context: {
            '女': 'rǔ',  // rǔ用于"女汝"(通"汝")
        }
    },
    '扁': {
        default: 'biǎn',
        context: {
            '扁': 'piān',  // piān用于"扁舟"
        }
    },
    '屏': {
        default: 'píng',
        context: {
            '屏': 'bǐng',  // bǐng用于"屏除"、"屏气"
            '屏': 'bīng',  // bīng用于"屏营"
        }
    },
    '从': {
        default: 'cóng',
        context: {
            '从': 'zòng',  // zòng用于"从弟"(堂弟)
        }
    },
    '难': {
        default: 'nán',
        context: {
            '难': 'nàn',  // nàn用于"灾难"、"患难"
        }
    },
    '背': {
        default: 'bèi',
        context: {
            '背': 'bēi',  // bēi用于"背负"
        }
    },
    '舍': {
        default: 'shě',
        context: {
            '舍': 'shè',  // shè用于"房舍"、"寒舍"
        }
    },
    '藏': {
        default: 'cáng',
        context: {
            '藏': 'zàng',  // zàng用于"宝藏"、"西藏"
        }
    },
    '薄': {
        default: 'bó',
        context: {
            '薄': 'báo',  // báo用于"薄厚"
            '薄': 'bò',  // bò用于"薄荷"
        }
    },
    '泊': {
        default: 'bó',
        context: {
            '泊': 'pō',  // pō用于"湖泊"
        }
    },
    '乐': {
        default: 'lè',
        context: {
            '乐': 'yuè',  // yuè用于"音乐"
        }
    },
    '华': {
        default: 'huá',
        context: {
            '华': 'huà',  // huà用于"华山"
        }
    },
    '期': {
        default: 'qī',
        context: {
            '期': 'jī',  // jī用于"期年"(一周年)
        }
    },
    '委': {
        default: 'wěi',
    },
    '查': {
        default: 'chá',
    },
    '著': {
        default: 'zhù',
        context: {
            '著': 'zhuó',  // zhuó用于"著衣"(穿衣服)
            '著': 'zhāo',  // zhāo用于"着急"等
        }
    },
    '冠': {
        default: 'guān',
        context: {
            '冠': 'guàn',  // guàn用于"冠军"
        }
    },
    '量': {
        default: 'liàng',
        context: {
            '量': 'liáng',  // liáng用于"测量"、"估量"
        }
    },
    '处': {
        default: 'chù',
        context: {
            '处': 'chǔ',  // chǔ用于"处理"、"相处"
        }
    },
    '朝': {
        default: 'cháo',
        context: {
            '朝': 'zhāo',  // zhāo用于"朝阳"
        }
    },
    '宿': {
        default: 'sù',
    },
    '将': {
        default: 'jiāng',
        context: {
            '将': 'jiàng',  // jiàng用于"将领"
        }
    },
    '舍': {
        default: 'shě',
        context: {
            '舍': 'shè',  // shè用于"房舍"
        }
    },
    '挑': {
        default: 'tiāo',
        context: {
            '挑': 'tiǎo',  // tiǎo用于"挑逗"、"挑动"
        }
    },
    '要': {
        default: 'yào',
        context: {
            '要': 'yāo',  // yāo用于"要求"
        }
    },
    '得': {
        default: 'de',
        context: {
            '得': 'dé',  // dé用于"得到"
            '得': 'děi',  // děi用于"得亏"
        }
    },
    '似': {
        default: 'sì',
        context: {
            '似': 'shì',  // shì用于"似的"
        }
    },
    '曾': {
        default: 'céng',
        context: {
            '曾': 'zēng',  // zēng用于"曾孙"、"曾祖"
        }
    },
    '单': {
        default: 'dān',
        context: {
            '单': 'chán',  // chán用于"单于"(匈奴首领)
            '单': 'shàn',  // shàn用于姓氏
        }
    },
    '石': {
        default: 'shí',
        context: {
            '石': 'dàn',  // dàn用于容量单位
        }
    },
    '斗': {
        default: 'dòu',
        context: {
            '斗': 'dǒu',  // dǒu用于"北斗"、"升斗"
        }
    },
    '禁': {
        default: 'jìn',
        context: {
            '禁': 'jīn',  // jīn用于"禁得住"、"不禁"
        }
    },
    '簪': {
        default: 'zān',
    },
    '胜': {
        default: 'shèng',
        context: {
            '胜': 'shēng',  // shēng用于"胜任"、"承受"
        }
    },
    '横': {
        default: 'héng',
        context: {
            '横': 'hèng',  // hèng用于"蛮横"
        }
    },
    '卷': {
        default: 'juàn',
        context: {
            '卷': 'juǎn',  // juǎn用于"卷起"
        }
    },
    '弹': {
        default: 'tán',
        context: {
            '弹': 'dàn',  // dàn用于"子弹"
        }
    },
    '曲': {
        default: 'qǔ',
        context: {
            '曲': 'qū',  // qū用于"弯曲"
        }
    },
    '缝': {
        default: 'féng',
        context: {
            '缝': 'fèng',  // fèng用于"缝隙"
        }
    },
    '假': {
        default: 'jiǎ',
        context: {
            '假': 'jià',  // jià用于"放假"
        }
    },
    '奇': {
        default: 'qí',
        context: {
            '奇': 'jī',  // jī用于"奇数"
        }
    },
    '泥': {
        default: 'ní',
        context: {
            '泥': 'nì',  // nì用于"拘泥"、"泥古"
        }
    },
    '担': {
        default: 'dān',
        context: {
            '担': 'dàn',  // dàn用于"担子"
        }
    },
    '笼': {
        default: 'lóng',
        context: {
            '笼': 'lǒng',  // lǒng用于"笼罩"
        }
    },
    '种': {
        default: 'zhǒng',
        context: {
            '种': 'zhòng',  // zhòng用于"种植"
        }
    },
    '差': {
        default: 'chà',
        context: {
            '差': 'chā',  // chā用于"差别"
            '差': 'chāi',  // chāi用于"出差"
            '差': 'cī',  // cī用于"参差"
        }
    },
    '参': {
        default: 'cān',
        context: {
            '参': 'shēn',  // shēn用于"人参"
            '参': 'cēn',  // cēn用于"参差"
        }
    },
    '和': {
        default: 'hé',
        context: {
            '和': 'hè',  // hè用于"唱和"
            '和': 'huó',  // huó用于"和面"
        }
    },
    '予': {
        default: 'yǔ',
        context: {
            '予': 'yú',  // yú用于"予取予求"
        }
    },
    '重': {
        default: 'zhòng',
        context: {
            '重': 'chóng',  // chóng用于"重新"
        }
    },
    '旋': {
        default: 'xuán',
        context: {
            '旋': 'xuàn',  // xuàn用于"旋吃旋走"
        }
    },
    '宁': {
        default: 'níng',
        context: {
            '宁': 'nìng',  // nìng用于"宁可"
        }
    },
    '殷': {
        default: 'yīn',
        context: {
            '殷': 'yān',  // yān用于"殷红"
            '殷': 'yǐn',  // yǐn用于"殷殷"(雷声)
        }
    },
    '仆': {
        default: 'pú',
        context: {
            '仆': 'pū',  // pū用于"前仆后继"
        }
    },
    '曝': {
        default: 'pù',
        context: {
            '曝': 'bào',  // bào用于"一曝十寒"
        }
    },
    '霓': {
        default: 'ní',
    },
    '裳': {
        default: 'shang',
        context: {
            '裳': 'cháng',  // cháng用于"古衣下裙"
        }
    },
    '遗': {
        default: 'yí',
        context: {
            '遗': 'wèi',  // wèi用于"馈遗"、"遗之"
        }
    },
    '奔': {
        default: 'bēn',
        context: {
            '奔': 'bèn',  // bèn用于"投奔"
        }
    },
    '辟': {
        default: 'pì',
        context: {
            '辟': 'bì',  // bì用于"法辟"、"辟邪"
        }
    },
    '辟': {
        default: 'pì',
    },
    '度': {
        default: 'dù',
        context: {
            '度': 'duó',  // duó用于"揣度"、"度量"
        }
    },
    '恶': {
        default: 'è',
        context: {
            '恶': 'wù',  // wù用于"厌恶"
            '恶': 'ě',  // ě用于"恶心"
        }
    },
    '便': {
        default: 'biàn',
    },
    '劳': {
        default: 'láo',
        context: {
            '劳': 'lào',  // lào用于"慰劳"
        }
    },
    '什': {
        default: 'shén',
        context: {
            '什': 'shí',  // shí用于"什物"
        }
    },
    '缪': {
        default: 'móu',
        context: {
            '缪': 'miù',  // miù用于"缪误"
            '缪': 'miào',  // miào用于"缪姓"(缪贤)
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '贾': {
        default: 'jiǎ',
        context: {
            '贾': 'gǔ',  // gǔ用于"商贾"、"贾人"
        }
    },
    '啭': {
        default: 'zhuàn',
    },
    '喧': {
        default: 'xuān',
    },
    '散': {
        default: 'sàn',
        context: {
            '散': 'sǎn',  // sǎn用于"松散"、"散漫"
        }
    },
    '繁': {
        default: 'fán',
    },
    '便': {
        default: 'biàn',
    },
    '扁': {
        default: 'biǎn',
        context: {
            '扁': 'piān',  // piān用于"扁舟"
        }
    },
    '屏': {
        default: 'píng',
        context: {
            '屏': 'bǐng',  // bǐng用于"屏除"、"屏气"
        }
    },
    '月': {
        default: 'yuè',
    },
    '教': {
        default: 'jiāo',
        context: {
            '教': 'jiào',  // jiào用于"教育"、"宗教"
        }
    },
    '令': {
        default: 'lìng',
        context: {
            '令': 'lǐng',  // lǐng用于"令狐"(复姓)
        }
    },
    '夹': {
        default: 'jiā',
        context: {
            '夹': 'jiá',  // jiá用于"夹衣"
            '夹': 'gā',  // gā用于"夹肢窝"
        }
    },
    '扎': {
        default: 'zā',
        context: {
            '扎': 'zhā',  // zhā用于"扎针"
            '扎': 'zhá',  // zhá用于"挣扎"
        }
    },
    '抹': {
        default: 'mǒ',
        context: {
            '抹': 'mā',  // mā用于"抹布"
            '抹': 'mò',  // mò用于"抹墙"
        }
    },
    '舍': {
        default: 'shě',
        context: {
            '舍': 'shè',  // shè用于"寒舍"、"宿舍"
        }
    },
    '散': {
        default: 'sàn',
        context: {
            '散': 'sǎn',  // sǎn用于"松散"
        }
    },
    '荷': {
        default: 'hé',
        context: {
            '荷': 'hè',  // hè用于"负荷"、"电荷"
        }
    },
    '藏': {
        default: 'cáng',
        context: {
            '藏': 'zàng',  // zàng用于"宝藏"
        }
    },
    '喷': {
        default: 'pēn',
        context: {
            '喷': 'pèn',  // pèn用于"喷香"
        }
    },
    '咳': {
        default: 'ké',
        context: {
            '咳': 'hāi',  // hāi用于"咳咳"(叹词)
        }
    },
    '血': {
        default: 'xuè',
        context: {
            '血': 'xiě',  // xiě用于口语"流血"
        }
    },
    '脉': {
        default: 'mài',
        context: {
            '脉': 'mò',  // mò用于"脉脉"(含情凝视)
        }
    },
    '校': {
        default: 'xiào',
        context: {
            '校': 'jiào',  // jiào用于"校对"
        }
    },
    '传': {
        default: 'chuán',
        context: {
            '传': 'zhuàn',  // zhuàn用于"传记"
        }
    },
    '长': {
        default: 'cháng',
        context: {
            '长': 'zhǎng',  // zhǎng用于"成长"
        }
    },
    '省': {
        default: 'shěng',
        context: {
            '省': 'xǐng',  // xǐng用于"省悟"、"反省"
        }
    },
    '弹': {
        default: 'tán',
        context: {
            '弹': 'dàn',  // dàn用于"子弹"
        }
    },
    '更': {
        default: 'gèng',
        context: {
            '更': 'gēng',  // gēng用于"三更"
        }
    },
    '便': {
        default: 'biàn',
    },
    '参': {
        default: 'cān',
        context: {
            '参': 'shēn',  // shēn用于"人参"
            '参': 'cēn',  // cēn用于"参差"
        }
    },
    '差': {
        default: 'chà',
        context: {
            '差': 'chā',  // chā用于"差别"
            '差': 'cī',  // cī用于"参差"
        }
    },
    '说': {
        default: 'shuō',
        context: {
            '说': 'shuì',  // shuì用于"游说"
            '说': 'yuè',  // yuè用于"悦"通"说"(古字)
        }
    },
    '解': {
        default: 'jiě',
    },
    '为': {
        default: 'wéi',
        context: {
            '为': 'wèi',  // wèi用于"因为"
        }
    },
    '思': {
        default: 'sī',
    },
    '女': {
        default: 'nǚ',
        context: {
            '女': 'rǔ',  // rǔ用于通"汝"
        }
    },
    '扇': {
        default: 'shàn',
        context: {
            '扇': 'shān',  // shān用于"扇风"
        }
    },
    '铺': {
        default: 'pū',
        context: {
            '铺': 'pù',  // pù用于"店铺"
        }
    },
    '分': {
        default: 'fēn',
        context: {
            '分': 'fèn',  // fèn用于"身分"
        }
    },
    '属': {
        default: 'shǔ',
        context: {
            '属': 'zhǔ',  // zhǔ用于"属文"、"属意"
        }
    },
    '数': {
        default: 'shù',
        context: {
            '数': 'shǔ',  // shǔ用于"数数"
        }
    },
    '系': {
        default: 'xì',
        context: {
            '系': 'jì',  // jì用于"系鞋带"
        }
    },
    '结': {
        default: 'jié',
        context: {
            '结': 'jiē',  // jiē用于"结实"
        }
    },
    '华': {
        default: 'huá',
        context: {
            '华': 'huà',  // huà用于"华山"
        }
    },
    '任': {
        default: 'rèn',
        context: {
            '任': 'rén',  // rén用于"任县"(地名)
        }
    },
    '泊': {
        default: 'bó',
        context: {
            '泊': 'pō',  // pō用于"湖泊"
        }
    },
    '檠': {
        default: 'qíng',
    },
    '按': {
        default: 'àn',
    },
    '剑': {
        default: 'jiàn',
    },
    '弹': {
        default: 'tán',
        context: {
            '弹': 'dàn',  // dàn用于"子弹"
        }
    },
    '觉': {
        default: 'jué',
        context: {
            '觉': 'jiào',  // jiào用于"睡觉"
        }
    },
    '胜': {
        default: 'shèng',
        context: {
            '胜': 'shēng',  // shēng用于"胜任"
        }
    },
    '处': {
        default: 'chù',
        context: {
            '处': 'chǔ',  // chǔ用于"相处"
        }
    },
    '遗': {
        default: 'yí',
        context: {
            '遗': 'wèi',  // wèi用于"馈遗"
        }
    },
    '屏': {
        default: 'píng',
        context: {
            '屏': 'bǐng',  // bǐng用于"屏除"
        }
    },
    '肉': {
        default: 'ròu',
    },
    '臭': {
        default: 'chòu',
        context: {
            '臭': 'xiù',  // xiù用于"嗅觉"(古义)
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '赵': {
        default: 'zhào',
    },
    '瑟': {
        default: 'sè',
    },
    '瑟': {
        default: 'sè',
    },
    '柱': {
        default: 'zhù',
        context: {
            '柱': 'zhǔ',  // zhǔ用于"琴瑟之柱"(有时读轻声)
        }
    },
    '弦': {
        default: 'xián',
    },
    '妇': {
        default: 'fù',
    },
    '姑': {
        default: 'gū',
    },
    '食': {
        default: 'shí',
        context: {
            '食': 'sì',  // sì用于"拿东西给人吃"(古音)
        }
    },
    '性': {
        default: 'xìng',
    },
    '遣': {
        default: 'qiǎn',
    },
    '尝': {
        default: 'cháng',
    },
    '惯': {
        default: 'guàn',
    },
    '间': {
        default: 'jiān',
        context: {
            '间': 'jiàn',  // jiàn用于"间隔"、"离间"
        }
    },
    '挑': {
        default: 'tiāo',
        context: {
            '挑': 'tiǎo',  // tiǎo用于"挑逗"
        }
    },
    '会': {
        default: 'huì',
        context: {
            '会': 'kuài',  // kuài用于"会计"
        }
    },
    '狎': {
        default: 'xiá',
    },
    '亵': {
        default: 'xiè',
    },
    '乐': {
        default: 'lè',
        context: {
            '乐': 'yuè',  // yuè用于"音乐"
        }
    },
    '府': {
        default: 'fǔ',
    },
    '僚': {
        default: 'liáo',
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '婉': {
        default: 'wǎn',
    },
    '顺': {
        default: 'shùn',
    },
    '承': {
        default: 'chéng',
    },
    '旨': {
        default: 'zhǐ',
    },
    '每': {
        default: 'měi',
    },
    '论': {
        default: 'lùn',
        context: {
            '论': 'lún',  // lún用于《论语》
        }
    },
    '语': {
        default: 'yǔ',
        context: {
            '语': 'yù',  // yù用于"告诉"
        }
    },
    '予': {
        default: 'yǔ',
        context: {
            '予': 'yú',  // yú用于"予取予求"
        }
    },
    '藏': {
        default: 'cáng',
        context: {
            '藏': 'zàng',  // zàng用于"宝藏"
        }
    },
    '便': {
        default: 'biàn',
    },
    '把': {
        default: 'bǎ',
    },
    '那': {
        default: 'nà',
        context: {
            '那': 'nuó',  // nuó用于"挪"古通"那"
        }
    },
    '提': {
        default: 'tí',
        context: {
            '提': 'dī',  // dī用于"提防"
        }
    },
    '喝': {
        default: 'hē',
        context: {
            '喝': 'hè',  // hè用于"喝彩"、"喝止"
        }
    },
    '盛': {
        default: 'shèng',
        context: {
            '盛': 'chéng',  // chéng用于"盛饭"
        }
    },
    '转': {
        default: 'zhuǎn',
        context: {
            '转': 'zhuàn',  // zhuàn用于"转动"
        }
    },
    '传': {
        default: 'chuán',
        context: {
            '传': 'zhuàn',  // zhuàn用于"传记"
        }
    },
    '据': {
        default: 'jù',
    },
    '难': {
        default: 'nán',
        context: {
            '难': 'nàn',  // nàn用于"灾难"
        }
    },
    '听': {
        default: 'tīng',
    },
    '了': {
        default: 'liǎo',
        context: {
            '了': 'le',  // le用于助词
        }
    },
    '中': {
        default: 'zhōng',
        context: {
            '中': 'zhòng',  // zhòng用于"击中"
        }
    },
    '当': {
        default: 'dāng',
        context: {
            '当': 'dàng',  // dàng用于"恰当"、"妥当"
        }
    },
    '应': {
        default: 'yīng',
        context: {
            '应': 'yìng',  // yìng用于"应付"、"反应"
        }
    },
    '为': {
        default: 'wéi',
        context: {
            '为': 'wèi',  // wèi用于"因为"
        }
    },
    '便': {
        default: 'biàn',
    },
    '还': {
        default: 'huán',
        context: {
            '还': 'hái',  // hái用于"还有"
        }
    },
    '更': {
        default: 'gèng',
        context: {
            '更': 'gēng',  // gēng用于"三更"
        }
    },
    '禁': {
        default: 'jìn',
        context: {
            '禁': 'jīn',  // jīn用于"不禁"
        }
    },
    '省': {
        default: 'shěng',
        context: {
            '省': 'xǐng',  // xǐng用于"反省"
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '月': {
        default: 'yuè',
    },
    '好': {
        default: 'hǎo',
        context: {
            '好': 'hào',  // hào用于"爱好"
        }
    },
    '教': {
        default: 'jiāo',
        context: {
            '教': 'jiào',  // jiào用于"教育"
        }
    },
    '胡': {
        default: 'hú',
    },
    '函': {
        default: 'hán',
    },
    '关': {
        default: 'guān',
    },
    '度': {
        default: 'dù',
        context: {
            '度': 'duó',  // duó用于"揣度"
        }
    },
    '从': {
        default: 'cóng',
        context: {
            '从': 'zòng',  // zòng用于"从弟"
        }
    },
    '更': {
        default: 'gèng',
        context: {
            '更': 'gēng',  // gēng用于"三更"
        }
    },
    '觉': {
        default: 'jué',
        context: {
            '觉': 'jiào',  // jiào用于"睡觉"
        }
    },
    '重': {
        default: 'zhòng',
        context: {
            '重': 'chóng',  // chóng用于"重新"
        }
    },
    '传': {
        default: 'chuán',
        context: {
            '传': 'zhuàn',  // zhuàn用于"传记"
        }
    },
    '分': {
        default: 'fēn',
        context: {
            '分': 'fèn',  // fèn用于"身分"
        }
    },
    '思': {
        default: 'sī',
    },
    '散': {
        default: 'sàn',
        context: {
            '散': 'sǎn',  // sǎn用于"松散"
        }
    },
    '兴': {
        default: 'xīng',
        context: {
            '兴': 'xìng',  // xìng用于"兴趣"
        }
    },
    '曲': {
        default: 'qǔ',
        context: {
            '曲': 'qū',  // qū用于"弯曲"
        }
    },
    '难': {
        default: 'nán',
        context: {
            '难': 'nàn',  // nàn用于"灾难"
        }
    },
    '长': {
        default: 'cháng',
        context: {
            '长': 'zhǎng',  // zhǎng用于"成长"
        }
    },
    '遗': {
        default: 'yí',
        context: {
            '遗': 'wèi',  // wèi用于"馈遗"
        }
    },
    '度': {
        default: 'dù',
        context: {
            '度': 'duó',  // duó用于"揣度"
        }
    },
    '为': {
        default: 'wéi',
        context: {
            '为': 'wèi',  // wèi用于"因为"
        }
    },
    '兴': {
        default: 'xīng',
        context: {
            '兴': 'xìng',  // xìng用于"兴趣"
        }
    },
    '便': {
        default: 'biàn',
    },
    '盛': {
        default: 'shèng',
        context: {
            '盛': 'chéng',  // chéng用于"盛饭"
        }
    },
    '卷': {
        default: 'juàn',
        context: {
            '卷': 'juǎn',  // juǎn用于"卷起"
        }
    },
    '更': {
        default: 'gèng',
        context: {
            '更': 'gēng',  // gēng用于"三更"
        }
    },
    '更': {
        default: 'gèng',
        context: {
            '更': 'gēng',  // gēng用于"三更"
        }
    },
    '相': {
        default: 'xiāng',
        context: {
            '相': 'xiàng',  // xiàng用于"相貌"
        }
    },
    '胜': {
        default: 'shèng',
        context: {
            '胜': 'shēng',  // shēng用于"胜任"
        }
    },
    '任': {
        default: 'rèn',
        context: {
            '任': 'rén',  // rén用于地名
        }
    },
    '省': {
        default: 'shěng',
        context: {
            '省': 'xǐng',  // xǐng用于"反省"
        }
    },
    '系': {
        default: 'xì',
        context: {
            '系': 'jì',  // jì用于"系鞋带"
        }
    },
    '横': {
        default: 'héng',
        context: {
            '横': 'hèng',  // hèng用于"蛮横"
        }
    },
    '转': {
        default: 'zhuǎn',
        context: {
            '转': 'zhuàn',  // zhuàn用于"转动"
        }
    },
    '轴': {
        default: 'zhóu',
        context: {
            '轴': 'zhòu',  // zhòu用于"压轴"
        }
    },
    '单': {
        default: 'dān',
        context: {
            '单': 'chán',  // chán用于"单于"
        }
    },
    '般': {
        default: 'bān',
    },
    '解': {
        default: 'jiě',
    },
    '弹': {
        default: 'tán',
        context: {
            '弹': 'dàn',  // dàn用于"子弹"
        }
    },
    '传': {
        default: 'chuán',
        context: {
            '传': 'zhuàn',  // zhuàn用于"传记"
        }
    },
    '舍': {
        default: 'shě',
        context: {
            '舍': 'shè',  // shè用于"寒舍"
        }
    },
    '见': {
        default: 'jiàn',
        context: {
            '见': 'xiàn',  // xiàn用于"显露"、"出现"(通"现")
        }
    },
    '分': {
        default: 'fēn',
        context: {
            '分': 'fèn',  // fèn用于"身分"
        }
    },
    '宁': {
        default: 'níng',
        context: {
            '宁': 'nìng',  // nìng用于"宁可"
        }
    },
    '塞': {
        default: 'sài',
        context: {
            '塞': 'sè',  // sè用于"堵塞"、"闭塞"
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '难': {
        default: 'nán',
        context: {
            '难': 'nàn',  // nàn用于"灾难"
        }
    },
    '好': {
        default: 'hǎo',
        context: {
            '好': 'hào',  // hào用于"爱好"
        }
    },
    '将': {
        default: 'jiāng',
        context: {
            '将': 'jiàng',  // jiàng用于"将领"
        }
    },
    '听': {
        default: 'tīng',
    },
    '传': {
        default: 'chuán',
        context: {
            '传': 'zhuàn',  // zhuàn用于"传记"
        }
    },
    '见': {
        default: 'jiàn',
        context: {
            '见': 'xiàn',  // xiàn用于通"现"
        }
    },
    '教': {
        default: 'jiāo',
        context: {
            '教': 'jiào',  // jiào用于"教育"
        }
    },
    '旋': {
        default: 'xuán',
        context: {
            '旋': 'xuàn',  // xuàn用于"旋吃旋走"
        }
    },
    '禁': {
        default: 'jìn',
        context: {
            '禁': 'jīn',  // jīn用于"不禁"
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '月': {
        default: 'yuè',
    },
    '便': {
        default: 'biàn',
    },
    '为': {
        default: 'wéi',
        context: {
            '为': 'wèi',  // wèi用于"因为"
        }
    },
    '更': {
        default: 'gèng',
        context: {
            '更': 'gēng',  // gēng用于"三更"
        }
    },
    '禁': {
        default: 'jìn',
        context: {
            '禁': 'jīn',  // jīn用于"不禁"
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '月': {
        default: 'yuè',
    },
    '难': {
        default: 'nán',
        context: {
            '难': 'nàn',  // nàn用于"灾难"
        }
    },
    '好': {
        default: 'hǎo',
        context: {
            '好': 'hào',  // hào用于"爱好"
        }
    },
    '将': {
        default: 'jiāng',
        context: {
            '将': 'jiàng',  // jiàng用于"将领"
        }
    },
    '听': {
        default: 'tīng',
    },
    '传': {
        default: 'chuán',
        context: {
            '传': 'zhuàn',  // zhuàn用于"传记"
        }
    },
    '见': {
        default: 'jiàn',
        context: {
            '见': 'xiàn',  // xiàn用于通"现"
        }
    },
    '教': {
        default: 'jiāo',
        context: {
            '教': 'jiào',  // jiào用于"教育"
        }
    },
    '旋': {
        default: 'xuán',
        context: {
            '旋': 'xuàn',  // xuàn用于"旋吃旋走"
        }
    },
    '禁': {
        default: 'jìn',
        context: {
            '禁': 'jīn',  // jīn用于"不禁"
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '月': {
        default: 'yuè',
    },
    '便': {
        default: 'biàn',
    },
    '为': {
        default: 'wéi',
        context: {
            '为': 'wèi',  // wèi用于"因为"
        }
    },
    '更': {
        default: 'gèng',
        context: {
            '更': 'gēng',  // gēng用于"三更"
        }
    },
    '禁': {
        default: 'jìn',
        context: {
            '禁': 'jīn',  // jīn用于"不禁"
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '月': {
        default: 'yuè',
    },
    '便': {
        default: 'biàn',
    },
    '为': {
        default: 'wéi',
        context: {
            '为': 'wèi',  // wèi用于"因为"
        }
    },
    '更': {
        default: 'gèng',
        context: {
            '更': 'gēng',  // gēng用于"三更"
        }
    },
    '禁': {
        default: 'jìn',
        context: {
            '禁': 'jīn',  // jīn用于"不禁"
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '月': {
        default: 'yuè',
    },
    '便': {
        default: 'biàn',
    },
    '为': {
        default: 'wéi',
        context: {
            '为': 'wèi',  // wèi用于"因为"
        }
    },
    '更': {
        default: 'gèng',
        context: {
            '更': 'gēng',  // gēng用于"三更"
        }
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '月': {
        default: 'yuè',
    },
    '燕': {
        default: 'yàn',
        context: {
            '燕': 'yān',  // yān用于"燕国"
        }
    },
    '月': {
        default: 'yuè',
    },
};

// 处理单行诗句的拼音
function processLine(text) {
    // 使用pinyin库获取基础拼音
    const pyResult = pinyinFunc(text, {
        style: pinyinFunc.STYLE_TONE,
        heteronym: false  // 不返回多音字的所有读音
    });

    let result = [];
    let charIndex = 0;

    // 逐字处理
    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // 跳过非中文字符
        if (!/[\u4e00-\u9fa5]/.test(char)) {
            result.push(char);
            continue;
        }

        let py = '';

        // 检查是否有自定义多音字规则
        if (pyResult[charIndex] && pyResult[charIndex].length > 0) {
            py = pyResult[charIndex][0];
        }

        // 应用多音字修正规则
        if (polyphoneRules[char]) {
            const rule = polyphoneRules[char];

            // 检查上下文匹配
            if (rule.context) {
                let matched = false;
                for (const [pattern, correctPy] of Object.entries(rule.context)) {
                    // 检查字符前后是否有匹配的模式
                    const before = text.substring(Math.max(0, i - pattern.length), i);
                    const after = text.substring(i + 1, Math.min(text.length, i + pattern.length + 1));

                    if (before.includes(pattern) || after.includes(pattern) ||
                        text.substring(i - 2, i + 3).includes(pattern)) {
                        py = correctPy;
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    py = rule.default;
                }
            } else {
                py = rule.default;
            }
        }

        // 特殊处理：唐诗中常见的多音字
        py = adjustForPoemContext(char, py, text, i);

        if (py) {
            result.push(py);
        } else {
            result.push(char);
        }

        charIndex++;
    }

    return result.join(' ');
}

// 根据诗歌语境调整拼音
function adjustForPoemContext(char, currentPy, fullText, charIndex) {
    // 特殊诗歌词汇的拼音规则

    // 看：看守读kān，看见读kàn
    if (char === '看') {
        if (fullText.includes('看守') || fullText.includes('看护')) {
            return 'kān';
        }
        return 'kàn';
    }

    // 更：更次读gēng，更加读gèng
    if (char === '更') {
        if (fullText.includes('三更') || fullText.includes('更次') || fullText.includes('五更')) {
            return 'gēng';
        }
        return 'gèng';
    }

    // 为：为了读wèi，作为读wéi
    if (char === '为') {
        if (fullText.includes('因为') || fullText.includes('为了') || fullText.includes('为有')) {
            return 'wèi';
        }
        return 'wéi';
    }

    // 行：行走读xíng，行列读háng
    if (char === '行') {
        if (fullText.includes('行列') || fullText.includes('行业') || fullText.includes('一行')) {
            return 'háng';
        }
        return 'xíng';
    }

    // 长：长短读cháng，成长读zhǎng
    if (char === '长') {
        if (fullText.includes('成长') || fullText.includes('生长') || fullText.includes('师长')) {
            return 'zhǎng';
        }
        return 'cháng';
    }

    // 少：多少读shǎo，少年读shào
    if (char === '少') {
        if (fullText.includes('少年') || fullText.includes('老少')) {
            return 'shào';
        }
        return 'shǎo';
    }

    // 相：相互读xiāng，相貌读xiàng
    if (char === '相') {
        if (fullText.includes('相貌') || fullText.includes('真相')) {
            return 'xiàng';
        }
        return 'xiāng';
    }

    // 中：中间读zhōng，击中读zhòng
    if (char === '中') {
        if (fullText.includes('击中') || fullText.includes('中奖')) {
            return 'zhòng';
        }
        return 'zhōng';
    }

    // 重：轻重读zhòng，重新读chóng
    if (char === '重') {
        if (fullText.includes('重新') || fullText.includes('重复')) {
            return 'chóng';
        }
        return 'zhòng';
    }

    // 传：传递读chuán，传记读zhuàn
    if (char === '传') {
        if (fullText.includes('传记') || fullText.includes('列传')) {
            return 'zhuàn';
        }
        return 'chuán';
    }

    // 教：教书读jiāo，教育读jiào
    if (char === '教') {
        if (fullText.includes('教书') || fullText.includes('教给') || fullText.includes('使教')) {
            return 'jiāo';
        }
        return 'jiào';
    }

    // 觉：感觉读jué，睡觉读jiào
    if (char === '觉') {
        if (fullText.includes('睡觉') || fullText.includes('午觉')) {
            return 'jiào';
        }
        return 'jué';
    }

    // 省：省份读shěng，反省读xǐng
    if (char === '省') {
        if (fullText.includes('反省') || fullText.includes('省悟')) {
            return 'xǐng';
        }
        return 'shěng';
    }

    // 燕：燕子读yàn，燕国读yān
    if (char === '燕') {
        if (fullText.includes('燕国') || fullText.includes('燕赵')) {
            return 'yān';
        }
        return 'yàn';
    }

    // 乐：快乐读lè，音乐读yuè
    if (char === '乐') {
        if (fullText.includes('音乐') || fullText.includes('奏乐') || fullText.includes('礼乐')) {
            return 'yuè';
        }
        return 'lè';
    }

    // 华：中华读huá，华山读huà
    if (char === '华') {
        if (fullText.includes('华山')) {
            return 'huà';
        }
        return 'huá';
    }

    // 泊：停泊读bó，湖泊读pō
    if (char === '泊') {
        if (fullText.includes('湖泊') || fullText.includes('梁山泊')) {
            return 'pō';
        }
        return 'bó';
    }

    // 胜：胜利读shèng，胜任读shēng
    if (char === '胜') {
        if (fullText.includes('胜任') || fullText.includes('不胜')) {
            return 'shēng';
        }
        return 'shèng';
    }

    // 分：分数读fēn，身分读fèn
    if (char === '分') {
        if (fullText.includes('身分') || fullText.includes('分外') || fullText.includes('本分')) {
            return 'fèn';
        }
        return 'fēn';
    }

    // 难：困难读nán，灾难读nàn
    if (char === '难') {
        if (fullText.includes('灾难') || fullText.includes('患难') || fullText.includes('避难')) {
            return 'nàn';
        }
        return 'nán';
    }

    // 塞：要塞读sài，堵塞读sè
    if (char === '塞') {
        if (fullText.includes('要塞') || fullText.includes('出塞') || fullText.includes('塞外')) {
            return 'sài';
        }
        return 'sè';
    }

    // 遗：遗留读yí，馈遗读wèi
    if (char === '遗') {
        if (fullText.includes('遗之') || fullText.includes('馈遗') || fullText.includes('厚遗')) {
            return 'wèi';
        }
        return 'yí';
    }

    // 见：看见读jiàn，显露读xiàn（通"现"）
    if (char === '见') {
        if (fullText.includes('相见') || fullText.includes('见示') || fullText.includes('图穷匕见')) {
            return 'xiàn';
        }
        return 'jiàn';
    }

    // 度：程度读dù，揣度读duó
    if (char === '度') {
        if (fullText.includes('揣度') || fullText.includes('度曲') || fullText.includes('审时度势')) {
            return 'duó';
        }
        return 'dù';
    }

    // 挑：挑水读tiāo，挑动读tiǎo
    if (char === '挑') {
        if (fullText.includes('挑动') || fullText.includes('挑逗') || fullText.includes('挑灯')) {
            return 'tiǎo';
        }
        return 'tiāo';
    }

    // 曲：歌曲读qǔ，弯曲读qū
    if (char === '曲') {
        if (fullText.includes('弯曲') || fullText.includes('曲径') || fullText.includes('曲直')) {
            return 'qū';
        }
        return 'qǔ';
    }

    // 卷：试卷读juàn，卷起读juǎn
    if (char === '卷') {
        if (fullText.includes('卷起') || fullText.includes('卷帘') || fullText.includes('舒卷')) {
            return 'juǎn';
        }
        return 'juàn';
    }

    // 弹：弹琴读tán，子弹读dàn
    if (char === '弹') {
        if (fullText.includes('子弹')) {
            return 'dàn';
        }
        return 'tán';
    }

    // 散：分散读sàn，松散读sǎn
    if (char === '散') {
        if (fullText.includes('松散') || fullText.includes('散漫') || fullText.includes('披散')) {
            return 'sǎn';
        }
        return 'sàn';
    }

    // 扇：扇子读shàn，扇风读shān
    if (char === '扇') {
        if (fullText.includes('扇风') || fullText.includes('扇动')) {
            return 'shān';
        }
        return 'shàn';
    }

    // 露：露水读lù，露面读lòu
    if (char === '露') {
        if (fullText.includes('露面') || fullText.includes('露头') || fullText.includes('露白')) {
            return 'lòu';
        }
        return 'lù';
    }

    // 泥：泥土读ní，拘泥读nì
    if (char === '泥') {
        if (fullText.includes('拘泥') || fullText.includes('泥古')) {
            return 'nì';
        }
        return 'ní';
    }

    // 便：方便读biàn，便宜读pián
    if (char === '便') {
        if (fullText.includes('便宜')) {
            return 'pián';
        }
        return 'biàn';
    }

    // 荷：荷花读hé，负荷读hè
    if (char === '荷') {
        if (fullText.includes('负荷') || fullText.includes('荷担') || fullText.includes('感荷')) {
            return 'hè';
        }
        return 'hé';
    }

    // 假：真假读jiǎ，放假读jià
    if (char === '假') {
        if (fullText.includes('放假') || fullText.includes('假期') || fullText.includes('休假')) {
            return 'jià';
        }
        return 'jiǎ';
    }

    // 奇：奇怪读qí，奇数读jī
    if (char === '奇') {
        if (fullText.includes('奇数') || fullText.includes('奇偶')) {
            return 'jī';
        }
        return 'qí';
    }

    // 种：种类读zhǒng，种植读zhòng
    if (char === '种') {
        if (fullText.includes('种植') || fullText.includes('种田')) {
            return 'zhòng';
        }
        return 'zhǒng';
    }

    // 和：和平读hé，唱和读hè
    if (char === '和') {
        if (fullText.includes('唱和') || fullText.includes('附和') || fullText.includes('曲高和寡')) {
            return 'hè';
        }
        return 'hé';
    }

    // 宁：安宁读níng，宁可读nìng
    if (char === '宁') {
        if (fullText.includes('宁可') || fullText.includes('宁愿')) {
            return 'nìng';
        }
        return 'níng';
    }

    // 殷：殷勤读yīn，殷红读yān
    if (char === '殷') {
        if (fullText.includes('殷红') || fullText.includes('殷血')) {
            return 'yān';
        }
        return 'yīn';
    }

    // 奔：奔跑读bēn，投奔读bèn
    if (char === '奔') {
        if (fullText.includes('投奔')) {
            return 'bèn';
        }
        return 'bēn';
    }

    // 仆：仆人读pú，前仆后继读pū
    if (char === '仆') {
        if (fullText.includes('前仆后继') || fullText.includes('仆倒')) {
            return 'pū';
        }
        return 'pú';
    }

    // 裳：衣裳读shang（轻声），下裳读cháng
    if (char === '裳') {
        if (fullText.includes('衣裳') || fullText.includes('霓裳')) {
            return 'shang';
        }
        return 'cháng';
    }

    // 骑：骑马读qí，骑兵读jì（古音）
    if (char === '骑') {
        if (fullText.includes('骑兵') || fullText.includes('铁骑')) {
            return 'jì';
        }
        return 'qí';
    }

    // 咽：咽喉读yān，吞咽读yàn，呜咽读yè
    if (char === '咽') {
        if (fullText.includes('呜咽') || fullText.includes('悲咽')) {
            return 'yè';
        }
        if (fullText.includes('吞咽') || fullText.includes('下咽')) {
            return 'yàn';
        }
        return 'yān';
    }

    // 朝：朝代读cháo，朝阳读zhāo
    if (char === '朝') {
        if (fullText.includes('朝阳') || fullText.includes('朝霞') || fullText.includes('今朝')) {
            return 'zhāo';
        }
        return 'cháo';
    }

    // 宿：住宿读sù
    if (char === '宿') {
        return 'sù';
    }

    // 令：命令读lìng，令狐读lǐng
    if (char === '令') {
        if (fullText.includes('令狐')) {
            return 'lǐng';
        }
        return 'lìng';
    }

    // 将：将来读jiāng，将领读jiàng
    if (char === '将') {
        if (fullText.includes('将领') || fullText.includes('大将') || fullText.includes('良将')) {
            return 'jiàng';
        }
        return 'jiāng';
    }

    // 要：重要读yào，要求读yāo
    if (char === '要') {
        if (fullText.includes('要求')) {
            return 'yāo';
        }
        return 'yào';
    }

    // 得：得到读dé，得亏读děi
    if (char === '得') {
        if (fullText.includes('得亏') || fullText.includes('还得')) {
            return 'děi';
        }
        return 'dé';
    }

    // 似：相似读sì，似的读shì
    if (char === '似') {
        if (fullText.includes('似的')) {
            return 'shì';
        }
        return 'sì';
    }

    // 曾：曾经读céng，曾孙读zēng
    if (char === '曾') {
        if (fullText.includes('曾孙') || fullText.includes('曾祖')) {
            return 'zēng';
        }
        return 'céng';
    }

    // 单：简单读dān，单于读chán
    if (char === '单') {
        if (fullText.includes('单于')) {
            return 'chán';
        }
        return 'dān';
    }

    // 石：石头读shí，一石读dàn
    if (char === '石') {
        if (fullText.match(/\d+石/)) {
            return 'dàn';
        }
        return 'shí';
    }

    // 斗：北斗读dǒu，战斗读dòu
    if (char === '斗') {
        if (fullText.includes('北斗') || fullText.includes('斗牛') || fullText.includes('斗柄')) {
            return 'dǒu';
        }
        return 'dòu';
    }

    // 横：横竖读héng，蛮横读hèng
    if (char === '横') {
        if (fullText.includes('蛮横') || fullText.includes('强横')) {
            return 'hèng';
        }
        return 'héng';
    }

    // 缝：缝补读féng，缝隙读fèng
    if (char === '缝') {
        if (fullText.includes('缝隙') || fullText.includes('裂缝') || fullText.includes('门缝')) {
            return 'fèng';
        }
        return 'féng';
    }

    // 担：担子读dàn，担水读dān
    if (char === '担') {
        if (fullText.includes('担子') || fullText.includes('重担')) {
            return 'dàn';
        }
        return 'dān';
    }

    // 笼：笼子读lóng，笼罩读lǒng
    if (char === '笼') {
        if (fullText.includes('笼罩') || fullText.includes('烟笼')) {
            return 'lǒng';
        }
        return 'lóng';
    }

    // 予：给予读yǔ，予取读yú
    if (char === '予') {
        if (fullText.includes('予取') || fullText.includes('予求')) {
            return 'yú';
        }
        return 'yǔ';
    }

    // 劳：劳动读láo，慰劳读lào
    if (char === '劳') {
        if (fullText.includes('慰劳')) {
            return 'lào';
        }
        return 'láo';
    }

    // 贾：商人读gǔ，姓氏读jiǎ
    if (char === '贾') {
        if (fullText.includes('商贾') || fullText.includes('贾人')) {
            return 'gǔ';
        }
        return 'jiǎ';
    }

    // 喧：喧哗读xuān
    if (char === '喧') {
        return 'xuān';
    }

    // 便：方便读biàn
    if (char === '便') {
        return 'biàn';
    }

    // 查：调查读chá
    if (char === '查') {
        return 'chá';
    }

    // 也：语气词读yě
    if (char === '也') {
        return 'yě';
    }

    // 治：治理读zhì
    if (char === '治') {
        return 'zhì';
    }

    // 稽：稽首读qǐ
    if (char === '稽') {
        if (fullText.includes('稽首')) {
            return 'qǐ';
        }
        return 'jī';
    }

    // 噪：噪声读zào
    if (char === '噪') {
        return 'zào';
    }

    // 委：委托读wěi
    if (char === '委') {
        return 'wěi';
    }

    return currentPy;
}

// 读取并处理唐诗文件
const poemsDir = path.join(__dirname, '../assets/data/poems');

// 只处理新导入的唐诗（091-368）
for (let i = 91; i <= 368; i++) {
    const fileNum = String(i).padStart(3, '0');
    const filePath = path.join(poemsDir, `${fileNum}.json`);

    if (!fs.existsSync(filePath)) {
        continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const poem = JSON.parse(content);

    // 处理每行诗句
    let updated = false;
    poem.content.forEach((line, index) => {
        // 强制更新所有拼音（使用带声调的拼音）
        const newPinyin = processLine(line.text);
        if (newPinyin !== line.pinyin) {
            line.pinyin = newPinyin;
            updated = true;
            console.log(`${fileNum}.json - ${poem.title} - 第${index + 1}行: ${line.text} -> ${line.pinyin}`);
        }
    });

    // 如果有更新，保存文件
    if (updated) {
        fs.writeFileSync(filePath, JSON.stringify(poem, null, 4), 'utf-8');
    }
}

console.log('\n拼音标注完成！');
