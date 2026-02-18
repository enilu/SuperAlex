/**
 * 三国演义H5问答游戏 - 配置文件
 */

const GameConfig = {
    // 游戏基本信息
    GAME_NAME: '三国演义知识闯关',
    GAME_VERSION: '1.0.0',

    // 关卡配置
    LEVELS: {
        1: {
            id: 1,
            name: '人物小达人',
            icon: '🎯',
            description: '认识三国中的著名人物',
            questionCount: 5,
            passScore: 3 // 答对3道以上过关
        },
        2: {
            id: 2,
            name: '情节小能手',
            icon: '📖',
            description: '了解经典的故事情节',
            questionCount: 5,
            passScore: 3
        },
        3: {
            id: 3,
            name: '道具配对师',
            icon: '⚔️',
            description: '认识人物与他们的武器',
            questionCount: 5,
            passScore: 3
        },
        4: {
            id: 4,
            name: '趣味小问答',
            icon: '🏆',
            description: '综合趣味知识问答',
            questionCount: 5,
            passScore: 3
        }
    },

    // 音效配置
    AUDIO: {
        correct: 'assets/audio/correct.mp3',
        wrong: 'assets/audio/wrong.mp3',
        bgm: 'assets/audio/bgm.mp3'
    },

    // 缓存键名
    CACHE_KEYS: {
        PROGRESS: 'kingdom3_progress',
        QUESTIONS: 'kingdom3_questions',
        SETTINGS: 'kingdom3_settings'
    },

    // 游戏规则
    RULES: {
        totalLevels: 4,
        questionsPerLevel: 5,
        passScore: 3, // 每关5题，答对3题以上过关
        maxRevive: 1, // 每关1次复活机会
        scorePerQuestion: 20, // 每题20分，总分100分
        totalQuestions: 20 // 4关×5题
    },

    // 星级评定
    STARS: {
        3: { minScore: 80, name: '优秀' }, // 4-5题正确
        2: { minScore: 60, name: '良好' }, // 3题正确
        1: { minScore: 0, name: '及格' }   // 0-2题正确
    },

    // 成就系统
    ACHIEVEMENTS: {
        FIRST_COMPLETE: { id: 'first_complete', name: '初出茅庐', icon: '🌱', description: '完成第一关' },
        ALL_COMPLETE: { id: 'all_complete', name: '三国小达人', icon: '🏆', description: '完成所有关卡' },
        PERFECT_SCORE: { id: 'perfect_score', name: '满贯将军', icon: '⭐', description: '获得满分' },
        NO_MISTAKES: { id: 'no_mistakes', name: '神机妙算', icon: '🎯', description: '一关内零错误' }
    },

    // UI配置
    UI: {
        animationDuration: 300,
        feedbackDuration: 2000,
        autoNextDelay: 1500,
        screenTransition: 300
    },

    // 题目默认数据（200题，每关50题，随机抽取5题）
    DEFAULT_QUESTIONS: [
        // 第一关：人物小达人 (50题)
        { id: 1, level: 1, question: '他是桃园三结义的大哥，后来成为了蜀汉的皇帝。他是谁？', options: ['刘备', '关羽', '张飞'], answer: 'A', hint: '桃园三结义大哥', pinyin: 'tā shì táo yuán sān jié yì de dà gē , hòu lái chéng wéi le shǔ hàn de huáng dì 。 tā shì shuí ?' },
        { id: 2, level: 1, question: '他手持青龙偃月刀，面色红赤，是桃园三结义的老二。他是谁？', options: ['刘备', '关羽', '张飞'], answer: 'B', hint: '青龙偃月刀', pinyin: 'tā shǒu chí qīng lóng yǎn yuè dāo , miàn sè hóng chì , shì táo yuán sān jié yì de lǎo èr 。 tā shì shuí ?' },
        { id: 3, level: 1, question: '他足智多谋，草船借箭，是蜀汉的军师。他是谁？', options: ['诸葛亮', '周瑜', '司马懿'], answer: 'A', hint: '草船借箭', pinyin: 'tā zú zhì duō móu , cǎo chuán jiè jiàn , shì shǔ hàn de jūn shī 。 tā shì shuí ?' },
        { id: 4, level: 1, question: '他是魏国的君主，挟天子以令诸侯。他是谁？', options: ['刘备', '孙权', '曹操'], answer: 'C', hint: '挟天子以令诸侯', pinyin: 'tā shì wèi guó de jūn zhǔ , xié tiān zǐ yǐ lìng zhū hóu 。 tā shì shuí ?' },
        { id: 5, level: 1, question: '他擅长骑射，百步穿杨，是江东的小霸王。他是谁？', options: ['孙策', '周瑜', '吕蒙'], answer: 'A', hint: '江东小霸王', pinyin: 'tā shàn cháng qí shè , bǎi bù chuān yáng , shì jiāng dōng de xiǎo bà wáng 。 tā shì shuí ?' },
        { id: 6, level: 1, question: '他使丈八蛇矛，勇猛无比，是桃园三结义的老三。他是谁？', options: ['刘备', '关羽', '张飞'], answer: 'C', hint: '丈八蛇矛', pinyin: 'tā shǐ zhàng bā shé máo , yǒng měng wú bǐ , shì táo yuán sān jié yì de lǎo sān 。 tā shì shuí ?' },
        { id: 7, level: 1, question: '他是吴国的君主，继承了父兄的基业。他是谁？', options: ['孙坚', '孙策', '孙权'], answer: 'C', hint: '吴国君主', pinyin: 'tā shì wú guó de jūn zhǔ , jì chéng le fù xiōng de jī yè 。 tā shì shuí ?' },
        { id: 8, level: 1, question: '他单骑救主，在长坂坡七进七出。他是谁？', options: ['关羽', '张飞', '赵云'], answer: 'C', hint: '长坂坡', pinyin: 'tā dān qí jiù zhǔ , zài cháng bǎn pō qī jìn qī chū 。 tā shì shuí ?' },
        { id: 9, level: 1, question: '他羽扇纶巾，火烧赤壁，是吴国的大都督。他是谁？', options: ['鲁肃', '周瑜', '吕蒙'], answer: 'B', hint: '火烧赤壁', pinyin: 'tā yǔ shàn lún jīn , huǒ shāo chì bì , shì wú guó de dà dū dū 。 tā shì shuí ?' },
        { id: 10, level: 1, question: '他老谋深算，是魏国的司马大将军。他是谁？', options: ['司马师', '司马昭', '司马懿'], answer: 'C', hint: '司马大将军', pinyin: 'tā lǎo móu shēn suàn , shì wèi guó de sī mǎ dà jiāng jūn 。 tā shì shuí ?' },
        { id: 11, level: 1, question: '他是蜀汉的五虎上将之一，排行第一。他是谁？', options: ['关羽', '张飞', '赵云'], answer: 'A', hint: '五虎上将之首', pinyin: 'tā shì shǔ hàn de wǔ hǔ shàng jiàng zhī yī , pái háng dì yī 。 tā shì shuí ?' },
        { id: 12, level: 1, question: '他面如重枣，唇若涂脂，丹凤眼，卧蚕眉。他是谁？', options: ['关羽', '张飞', '赵云'], answer: 'A', hint: '面如重枣', pinyin: 'tā miàn rú chóng zǎo , chún ruò tú zhī , dān fèng yǎn , wò cán méi 。 tā shì shuí ?' },
        { id: 13, level: 1, question: '他豹头环眼，燕颔虎须，声若巨雷。他是谁？', options: ['关羽', '张飞', '赵云'], answer: 'B', hint: '豹头环眼', pinyin: 'tā bào tóu huán yǎn , yàn hàn hǔ xū , shēng ruò jù léi 。 tā shì shuí ?' },
        { id: 14, level: 1, question: '他白袍银枪，英俊潇洒，被称做"常山赵子龙"。他是谁？', options: ['赵云', '马超', '黄忠'], answer: 'A', hint: '常山赵子龙', pinyin: 'tā bái páo yín qiāng , yīng jùn xiāo sǎ , bèi chēng zuò " cháng shān zhào zǐ lóng " 。 tā shì shuí ?' },
        { id: 15, level: 1, question: '他老当益壮，在定军山斩杀夏侯渊。他是谁？', options: ['赵云', '马超', '黄忠'], answer: 'C', hint: '定军山', pinyin: 'tā lǎo dāng yì zhuàng , zài dìng jūn shān zhǎn shā xià hóu yuān 。 tā shì shuí ?' },
        { id: 16, level: 1, question: '他西凉锦马超，面如冠玉，眼若流星。他是谁？', options: ['马超', '赵云', '黄忠'], answer: 'A', hint: '西凉锦马超', pinyin: 'tā xī liáng jǐn mǎ chāo , miàn rú guān yù , yǎn ruò liú xīng 。 tā shì shuí ?' },
        { id: 17, level: 1, question: '他字公瑾，与小乔是夫妻，英年早逝。他是谁？', options: ['周瑜', '鲁肃', '吕蒙'], answer: 'A', hint: '字公瑾', pinyin: 'tā zì gōng jǐn , yǔ xiǎo qiáo shì fū qī , yīng nián zǎo shì 。 tā shì shuí ?' },
        { id: 18, level: 1, question: '他字子敬，为人忠厚，是吴国的重要谋士。他是谁？', options: ['周瑜', '鲁肃', '吕蒙'], answer: 'B', hint: '字子敬', pinyin: 'tā zì zǐ jìng , wéi rén zhōng hòu , shì wú guó de zhòng yào móu shì 。 tā shì shuí ?' },
        { id: 19, level: 1, question: '他白衣渡江，夺回荆州，是东吴名将。他是谁？', options: ['周瑜', '鲁肃', '吕蒙'], answer: 'C', hint: '白衣渡江', pinyin: 'tā bái yī dù jiāng , duó huí jīng zhōu , shì dōng wú míng jiàng 。 tā shì shuí ?' },
        { id: 20, level: 1, question: '他火烧连营，大破刘备蜀军。他是谁？', options: ['陆逊', '周瑜', '吕蒙'], answer: 'A', hint: '火烧连营', pinyin: 'tā huǒ shāo lián yíng , dà pò liú bèi shǔ jūn 。 tā shì shuí ?' },
        { id: 21, level: 1, question: '他字孟德，是三国时期著名的政治家、军事家、文学家。他是谁？', options: ['曹操', '曹丕', '曹植'], answer: 'A', hint: '字孟德', pinyin: 'tā zì mèng dé , shì sān guó shí qī zhù míng de zhèng zhì jiā 、 jūn shì jiā 、 wén xué jiā 。 tā shì shuí ?' },
        { id: 22, level: 1, question: '他逼迫汉献帝禅让，建立了魏国。他是谁？', options: ['曹操', '曹丕', '曹植'], answer: 'B', hint: '建立魏国', pinyin: 'tā bī pò hàn xiàn dì chán ràng , jiàn lì le wèi guó 。 tā shì shuí ?' },
        { id: 23, level: 1, question: '他才高八斗，七步成诗，是曹操的儿子。他是谁？', options: ['曹丕', '曹植', '曹冲'], answer: 'B', hint: '七步成诗', pinyin: 'tā cái gāo bā dǒu , qī bù chéng shī , shì cáo cāo de ér zi 。 tā shì shuí ?' },
        { id: 24, level: 1, question: '他字玄德，以仁德著称。他是谁？', options: ['刘备', '刘表', '刘璋'], answer: 'A', hint: '字玄德', pinyin: 'tā zì xuán dé , yǐ rén dé zhù chēng 。 tā shì shuí ?' },
        { id: 25, level: 1, question: '他字云长，忠义无双，被后人尊为"武圣"。他是谁？', options: ['关羽', '张飞', '赵云'], answer: 'A', hint: '字云长', pinyin: 'tā zì yún cháng , zhōng yì wú shuāng , bèi hòu rén zūn wéi " wǔ shèng " 。 tā shì shuí ?' },
        { id: 26, level: 1, question: '他字翼德，勇猛善战。他是谁？', options: ['关羽', '张飞', '赵云'], answer: 'B', hint: '字翼德', pinyin: 'tā zì yì dé , yǒng měng shàn zhàn 。 tā shì shuí ?' },
        { id: 27, level: 1, question: '他字孔明，号卧龙，是蜀汉丞相。他是谁？', options: ['庞统', '徐庶', '诸葛亮'], answer: 'C', hint: '号卧龙', pinyin: 'tā zì kǒng míng , hào wò lóng , shì shǔ hàn chéng xiàng 。 tā shì shuí ?' },
        { id: 28, level: 1, question: '他字士元，号凤雏，可惜英年早逝。他是谁？', options: ['庞统', '徐庶', '诸葛亮'], answer: 'A', hint: '号凤雏', pinyin: 'tā zì shì yuán , hào fèng chú , kě xī yīng nián zǎo shì 。 tā shì shuí ?' },
        { id: 29, level: 1, question: '他字仲谋，是东吴的开国皇帝。他是谁？', options: ['孙坚', '孙策', '孙权'], answer: 'C', hint: '字仲谋', pinyin: 'tā zì zhòng móu , shì dōng wú de kāi guó huáng dì 。 tā shì shuí ?' },
        { id: 30, level: 1, question: '他是江东猛虎，孙策和孙权的父亲。他是谁？', options: ['孙坚', '孙策', '孙权'], answer: 'A', hint: '江东猛虎', pinyin: 'tā shì jiāng dōng měng hǔ , sūn cè hé sūn quán de fù qīn 。 tā shì shuí ?' },
        { id: 31, level: 1, question: '他字仲谋，统治江东六郡八十一州。他是谁？', options: ['孙坚', '孙策', '孙权'], answer: 'C', hint: '江东六郡', pinyin: 'tā zì zhòng móu , tǒng zhì jiāng dōng liù jùn bā shí yī zhōu 。 tā shì shuí ?' },
        { id: 32, level: 1, question: '他字奉孝，是曹操早期最重要的谋士，可惜早逝。他是谁？', options: ['郭嘉', '荀彧', '程昱'], answer: 'A', hint: '字奉孝', pinyin: 'tā zì fèng xiào , shì cáo cāo zǎo qī zuì zhòng yào de móu shì , kě xī zǎo shì 。 tā shì shuí ?' },
        { id: 33, level: 1, question: '他字文若，是曹操的首席谋臣。他是谁？', options: ['郭嘉', '荀彧', '程昱'], answer: 'B', hint: '字文若', pinyin: 'tā zì wén ruò , shì cáo cāo de shǒu xí móu chén 。 tā shì shuí ?' },
        { id: 34, level: 1, question: '他虎痴关公，被关羽所杀。他是谁？', options: ['许褚', '典韦', '蔡阳'], answer: 'C', hint: '被关羽所杀', pinyin: 'tā hǔ chī guān gōng , bèi guān yǔ suǒ shā 。 tā shì shuí ?' },
        { id: 35, level: 1, question: '他字公明，使双铁锏，原为山贼，后归顺曹操。他是谁？', options: ['徐晃', '张辽', '李典'], answer: 'A', hint: '使双铁锏', pinyin: 'tā zì gōng míng , shǐ shuāng tiě xián , yuán wéi shān zéi , hòu guī shùn cáo cāo 。 tā shì shuí ?' },
        { id: 36, level: 1, question: '他字文远，原为吕布部下，后归顺曹操。他是谁？', options: ['徐晃', '张辽', '李典'], answer: 'B', hint: '字文远', pinyin: 'tā zì wén yuǎn , yuán wéi lǚ bù xià , hòu guī shùn cáo cāo 。 tā shì shuí ?' },
        { id: 37, level: 1, question: '他原为关羽部下，后背叛关羽投奔东吴。他是谁？', options: ['周仓', '廖化', '糜芳'], answer: 'C', hint: '背叛关羽', pinyin: 'tā yuán wéi guān yǔ bù xià , hòu bèi pàn guān yǔ tóu bēn dōng wú 。 tā shì shuí ?' },
        { id: 38, level: 1, question: '他背负青龙刀，追随关羽左右。他是谁？', options: ['周仓', '廖化', '关平'], answer: 'A', hint: '背负青龙刀', pinyin: 'tā bèi fù qīng lóng dāo , zhuī suí guān yǔ zuǒ yòu 。 tā shì shuí ?' },
        { id: 39, level: 1, question: '他是关羽的义子，与关羽一同被俘。他是谁？', options: ['关平', '关兴', '关索'], answer: 'A', hint: '关羽义子', pinyin: 'tā shì guān yǔ de yì zi , yǔ guān yǔ yī tóng bèi fú 。 tā shì shuí ?' },
        { id: 40, level: 1, question: '他字子龙，在长坂坡救出阿斗。他是谁？', options: ['赵云', '马超', '黄忠'], answer: 'A', hint: '救阿斗', pinyin: 'tā zì zǐ lóng , zài cháng bǎn pō jiù chū ā dòu 。 tā shì shuí ?' },
        { id: 41, level: 1, question: '他字孟起，曾与张飞大战数百回合。他是谁？', options: ['马超', '赵云', '黄忠'], answer: 'A', hint: '字孟起', pinyin: 'tā zì mèng qǐ , céng yǔ zhāng fēi dà zhàn shù bǎi huí hé 。 tā shì shuí ?' },
        { id: 42, level: 1, question: '他字汉升，老将黄忠，曾射中关羽盔缨。他是谁？', options: ['赵云', '马超', '黄忠'], answer: 'C', hint: '字汉升', pinyin: 'tā zì hàn shēng , lǎo jiàng huáng zhōng , céng shè zhōng guān yǔ kuī yīng 。 tā shì shuí ?' },
        { id: 43, level: 1, question: '他字伯言，年轻有为，火烧刘备连营。他是谁？', options: ['陆逊', '周瑜', '吕蒙'], answer: 'A', hint: '字伯言', pinyin: 'tā zì bó yán , nián qīng yǒu wéi , huǒ shāo liú bèi lián yíng 。 tā shì shuí ?' },
        { id: 44, level: 1, question: '他身材矮小，是吴国的重要谋士。他是谁？', options: ['张昭', '顾雍', '诸葛瑾'], answer: 'A', hint: '身材矮小', pinyin: 'tā shēn cái ǎi xiǎo , shì wú guó de zhòng yào móu shì 。 tā shì shuí ?' },
        { id: 45, level: 1, question: '他是诸葛亮的哥哥，在东吴为官。他是谁？', options: ['诸葛瑾', '诸葛恪', '诸葛诞'], answer: 'A', hint: '诸葛亮哥哥', pinyin: 'tā shì zhū gě liàng de gē ge , zài dōng wú wéi guān 。 tā shì shuí ?' },
        { id: 46, level: 1, question: '他字幼常，是诸葛亮的学生，可惜失守街亭。他是谁？', options: ['马谡', '姜维', '魏延'], answer: 'A', hint: '失街亭', pinyin: 'tā zì yòu cháng , shì zhū gě liàng de xué sheng , kě xī shī shǒu jiē tíng 。 tā shì shuí ?' },
        { id: 47, level: 1, question: '他字伯约，继承了诸葛亮的遗志。他是谁？', options: ['马谡', '姜维', '魏延'], answer: 'B', hint: '继承遗志', pinyin: 'tā zì bó yuē , jì chéng le zhū gě liàng de yí zhì 。 tā shì shuí ?' },
        { id: 48, level: 1, question: '他字文长，勇猛善战，但被认为有反骨。他是谁？', options: ['马谡', '姜维', '魏延'], answer: 'C', hint: '有反骨', pinyin: 'tā zì wén cháng , yǒng měng shàn zhàn , dàn bèi rèn wéi yǒu fǎn gǔ 。 tā shì shuí ?' },
        { id: 49, level: 1, question: '他字元让，曹操最信任的保镖。他是谁？', options: ['许褚', '典韦', '夏侯惇'], answer: 'C', hint: '字元让', pinyin: 'tā zì yuán ràng , cáo cāo zuì xìn rèn de bǎo biāo 。 tā shì shuí ?' },
        { id: 50, level: 1, question: '他虎痴侯，力大无穷，能倒拖牛尾行走。他是谁？', options: ['许褚', '典韦', '夏侯惇'], answer: 'A', hint: '力大无穷', pinyin: 'tā hǔ chī hóu , lì dà wú qióng , néng dào tuō niú wěn xíng zǒu 。 tā shì shuí ?' },

        // 第二关：情节小能手 (50题)
        { id: 51, level: 2, question: '刘备、关羽、张飞在哪结为兄弟？', options: ['桃园', '杏花村', '梨花园'], answer: 'A', hint: '桃', pinyin: 'liú bèi 、 guān yǔ 、 zhāng fēi zài nǎ jié wéi xiōng dì ?' },
        { id: 52, level: 2, question: '诸葛亮用什么方法从曹操那里借来箭？', options: ['草船借箭', '水攻', '火攻'], answer: 'A', hint: '草船', pinyin: 'zhū gě liàng yòng shén me fāng fǎ cóng cáo cāo nà lǐ jiè lái jiàn ?' },
        { id: 53, level: 2, question: '赤壁之战中，谁用火攻大败曹操？', options: ['诸葛亮', '周瑜', '黄盖'], answer: 'B', hint: '周瑜', pinyin: 'chì bì zhī zhàn zhōng , shuí yòng huǒ gōng dà bài cáo cāo ?' },
        { id: 54, level: 2, question: '刘备三次去拜访诸葛亮，这个故事叫什么？', options: ['三顾茅庐', '三英战吕布', '三气周瑜'], answer: 'A', hint: '三顾茅庐', pinyin: 'liú bèi sān cì qù bài fǎng zhū gě liàng , zhè gè gù shì jiào shén me ?' },
        { id: 55, level: 2, question: '空城计中，诸葛亮在城楼上做了什么？', options: ['弹琴', '下棋', '读书'], answer: 'A', hint: '弹琴', pinyin: 'kōng chéng jì zhōng , zhū gě liàng zài chéng lóu shàng zuò le shén me ?' },
        { id: 56, level: 2, question: '关羽过五关斩了多少员大将？', options: ['五员', '六员', '七员'], answer: 'B', hint: '六员', pinyin: 'guān yǔ guò wǔ guān zhǎn le duō shǎo yuán dà jiàng ?' },
        { id: 57, level: 2, question: '曹操在什么战役中被周瑜和诸葛亮联手击败？', options: ['官渡之战', '赤壁之战', '夷陵之战'], answer: 'B', hint: '赤壁', pinyin: 'cáo cāo zài shén me zhàn yì zhōng bèi zhōu yú hé zhū gě liàng lián shǒu jī bài ?' },
        { id: 58, level: 2, question: '刘备在白帝城托孤给谁？', options: ['赵云', '诸葛亮', '魏延'], answer: 'B', hint: '诸葛亮', pinyin: 'liú bèi zài bái dì chéng tuō gū gěi shuí ?' },
        { id: 59, level: 2, question: '关羽大意失了什么地方？', options: ['荆州', '成都', '汉中'], answer: 'A', hint: '荆州', pinyin: 'guān yǔ dà yì shī le shén me dì fang ?' },
        { id: 60, level: 2, question: '张飞在什么地方被部下刺杀？', options: ['长坂坡', '瓦口关', '阆中'], answer: 'C', hint: '阆中', pinyin: 'zhāng fēi zài shén me dì fang bèi bù xià cì shā ?' },
        { id: 61, level: 2, question: '诸葛亮在什么地方设下空城计？', options: ['西城', '汉中', '成都'], answer: 'A', hint: '西城', pinyin: 'zhū gě liàng zài shén me dì fang shè xià kōng chéng jì ?' },
        { id: 62, level: 2, question: '赵云在长坂坡救了谁的孩子？', options: ['关羽', '刘备', '孙权'], answer: 'B', hint: '刘备', pinyin: 'zhào yún zài cháng bǎn pō jiù le shuí de hái zi ?' },
        { id: 63, level: 2, question: '诸葛亮在南征时七擒了谁？', options: ['孟获', '藤甲兵', '祝融'], answer: 'A', hint: '孟获', pinyin: 'zhū gě liàng zài nán zhēng shí qī qín le shuí ?' },
        { id: 64, level: 2, question: '关羽在华容道放走了谁？', options: ['曹操', '孙权', '袁绍'], answer: 'A', hint: '曹操', pinyin: 'guān yǔ zài huá róng dào fàng zǒu le shuí ?' },
        { id: 65, level: 2, question: '刘备在什么地方被陆逊火烧连营？', options: ['夷陵', '赤壁', '官渡'], answer: 'A', hint: '夷陵', pinyin: 'liú bèi zài shén me dì fang bèi lù xùn huǒ shāo lián yíng ?' },
        { id: 66, level: 2, question: '曹操在什么地方以少胜多击败袁绍？', options: ['官渡', '赤壁', '夷陵'], answer: 'A', hint: '官渡', pinyin: 'cáo cāo zài shén me dì fang yǐ shǎo shèng duō jī bài yuán shào ?' },
        { id: 67, level: 2, question: '诸葛亮挥泪斩了谁？', options: ['马谡', '魏延', '姜维'], answer: 'A', hint: '马谡', pinyin: 'zhū gě liàng huī lèi zhǎn le shuí ?' },
        { id: 68, level: 2, question: '关羽刮骨疗毒时，谁在为他下棋？', options: ['张飞', '赵云', '马良'], answer: 'C', hint: '马良', pinyin: 'guān yǔ guā gǔ liáo dú shí , shuí zài wèi tā xià qí ?' },
        { id: 69, level: 2, question: '诸葛亮六出祁山是为了讨伐谁？', options: ['东吴', '魏国', '南蛮'], answer: 'B', hint: '魏国', pinyin: 'zhū gě liàng liù chū qí shān shì wèi le tǎo fá shuí ?' },
        { id: 70, level: 2, question: '周瑜在什么地方中了诸葛亮的箭？', options: ['赤壁', '柴桑', '南郡'], answer: 'A', hint: '赤壁', pinyin: 'zhōu yú zài shén me dì fang zhòng le zhū gě liàng de jiàn ?' },
        { id: 71, level: 2, question: '刘备借了什么地方不还？', options: ['荆州', '徐州', '益州'], answer: 'A', hint: '荆州', pinyin: 'liú bèi jiè le shén me dì fang bù huán ?' },
        { id: 72, level: 2, question: '曹操在什么地方煮酒论英雄？', options: ['许都', '洛阳', '长安'], answer: 'A', hint: '许都', pinyin: 'cáo cāo zài shén me dì fang zhǔ jiǔ lùn yīng xióng ?' },
        { id: 73, level: 2, question: '张飞在长坂桥头一声大吼，吓死了谁？', options: ['夏侯杰', '夏侯惇', '夏侯渊'], answer: 'A', hint: '夏侯杰', pinyin: 'zhāng fēi zài cháng bǎn qiáo tóu yī shēng dà hǒu , xià sǐ le shuí ?' },
        { id: 74, level: 2, question: '诸葛亮借东风是在什么地方？', options: ['七星坛', '赤壁', '南屏山'], answer: 'A', hint: '七星坛', pinyin: 'zhū gě liàng jiè dōng fēng shì zài shén me dì fang ?' },
        { id: 75, level: 2, question: '刘备在什么地方三顾茅庐？', options: ['隆中', '荆州', '成都'], answer: 'A', hint: '隆中', pinyin: 'liú bèi zài shén me dì fang sān gù máo lú ?' },
        { id: 76, level: 2, question: '关羽在什么地方单刀赴会？', options: ['陆口', '荆州', '益阳'], answer: 'A', hint: '陆口', pinyin: 'guān yǔ zài shén me dì fang dān dāo fù huì ?' },
        { id: 77, level: 2, question: '孙权在什么地方斩杀关羽？', options: ['洛阳', '麦城', '成都'], answer: 'B', hint: '麦城', pinyin: 'sūn quán zài shén me dì fang zhǎn shā guān yǔ ?' },
        { id: 78, level: 2, question: '曹操在什么地方挟天子以令诸侯？', options: ['许都', '洛阳', '长安'], answer: 'A', hint: '许都', pinyin: 'cáo cāo zài shén me dì fang xié tiān zǐ yǐ lìng zhū hóu ?' },
        { id: 79, level: 2, question: '诸葛亮在什么地方北伐时病逝？', options: ['五丈原', '祁山', '街亭'], answer: 'A', hint: '五丈原', pinyin: 'zhū gě liàng zài shén me dì fang běi fá shí bìng shì ?' },
        { id: 80, level: 2, question: '赵云在什么地方七进七出？', options: ['长坂坡', '华容道', '赤壁'], answer: 'A', hint: '长坂坡', pinyin: 'zhào yún zài shén me dì fang qī jìn qī chū ?' },
        { id: 81, level: 2, question: '周瑜被诸葛亮几气而死？', options: ['三气', '两气', '四气'], answer: 'A', hint: '三气', pinyin: 'zhōu yú bèi zhū gě liàng jǐ qì ér sǐ ?' },
        { id: 82, level: 2, question: '刘备在什么地方自称汉中王？', options: ['汉中', '成都', '荆州'], answer: 'A', hint: '汉中', pinyin: 'liú bèi zài shén me dì fang zì chēng hàn zhōng wáng ?' },
        { id: 83, level: 2, question: '曹操在什么地方得到关羽的首级？', options: ['洛阳', '洛阳白马寺', '许都'], answer: 'A', hint: '洛阳', pinyin: 'cáo cāo zài shén me dì fang dé dào guān yǔ de shǒu jí ?' },
        { id: 84, level: 2, question: '诸葛亮在什么地方设下八卦阵？', options: ['石兵八阵', '八阵图', '鱼腹浦'], answer: 'C', hint: '鱼腹浦', pinyin: 'zhū gě liàng zài shén me dì fang shè xià bā guà zhèn ?' },
        { id: 85, level: 2, question: '关羽水淹七军是在什么地方？', options: ['樊城', '襄阳', '荆州'], answer: 'A', hint: '樊城', pinyin: 'guān yǔ shuǐ yān qī jūn shì zài shén me dì fang ?' },
        { id: 86, level: 2, question: '张辽在什么地方威震逍遥津？', options: ['合肥', '濡须', '逍遥津'], answer: 'A', hint: '合肥', pinyin: 'zhāng liáo zài shén me dì fang wēi zhèn xiāo yáo jīn ?' },
        { id: 87, level: 2, question: '姜维在什么地方归降诸葛亮？', options: ['天水', '南安', '安定'], answer: 'A', hint: '天水', pinyin: 'jiāng wéi zài shén me dì fang guī xiáng zhū gě liàng ?' },
        { id: 88, level: 2, question: '马谡在什么地方失守？', options: ['街亭', '祁山', '五丈原'], answer: 'A', hint: '街亭', pinyin: 'mǎ sù zài shén me dì fang shī shǒu ?' },
        { id: 89, level: 2, question: '刘备在什么地方托孤？', options: ['白帝城', '成都', '永安'], answer: 'A', hint: '白帝城', pinyin: 'liú bèi zài shén me dì fang tuō gū ?' },
        { id: 90, level: 2, question: '孙策在什么地方平定江东？', options: ['江东', '合肥', '濡须'], answer: 'A', hint: '江东', pinyin: 'sūn cè zài shén me dì fang píng dìng jiāng dōng ?' },
        { id: 91, level: 2, question: '吕布在什么地方被曹操擒杀？', options: ['下邳', '徐州', '白门楼'], answer: 'C', hint: '白门楼', pinyin: 'lǚ bù zài shén me dì fang bèi cáo cāo qín shā ?' },
        { id: 92, level: 2, question: '貂蝉是谁的义女？', options: ['王允', '董卓', '吕布'], answer: 'A', hint: '王允', pinyin: 'diāo chān shì shuí de yì nǚ ?' },
        { id: 93, level: 2, question: '凤仪亭是谁的故事？', options: ['吕布与貂蝉', '吕布与董卓', '董卓与貂蝉'], answer: 'A', hint: '吕布貂蝉', pinyin: 'fèng yí tíng shì shuí de gù shì ?' },
        { id: 94, level: 2, question: '连环计是谁设计的？', options: ['王允', '貂蝉', '董卓'], answer: 'A', hint: '王允', pinyin: 'lián huán jì shì shuí shè jì de ?' },
        { id: 95, level: 2, question: '苦肉计是谁用的？', options: ['黄盖', '周瑜', '诸葛亮'], answer: 'A', hint: '黄盖', pinyin: 'kǔ ròu jì shì shuí yòng de ?' },
        { id: 96, level: 2, question: '蒋干盗书发生在什么地方？', options: ['江东', '赤壁', '周瑜大营'], answer: 'C', hint: '周瑜大营', pinyin: 'jiǎng gàn dào shū fā shēng zài shén me dì fang ?' },
        { id: 97, level: 2, question: '群英会是谁举办的？', options: ['周瑜', '诸葛亮', '曹操'], answer: 'A', hint: '周瑜', pinyin: 'qún yīng huì shì shuí jǔ bàn de ?' },
        { id: 98, level: 2, question: '借东风的故事发生在什么时候？', options: ['冬天', '夏天', '秋天'], answer: 'A', hint: '冬天', pinyin: 'jiè dōng fēng de gù shì fā shēng zài shén me shí hou ?' },
        { id: 99, level: 2, question: '曹操在赤壁之战前写了什么诗？', options: ['短歌行', '观沧海', '龟崇寿'], answer: 'A', hint: '短歌行', pinyin: 'cáo cāo zài chì bì zhī zhàn qián xiě le shén me shī ?' },
        { id: 100, level: 2, question: '七星坛是诸葛亮为了做什么而设？', options: ['借东风', '祭天', '借箭'], answer: 'A', hint: '借东风', pinyin: 'qī xīng tán shì zhū gě liàng wèi le zuò shén me ér shè ?' },

        // 第三关：道具配对师 (50题)
        { id: 101, level: 3, question: '青龙偃月刀是谁的武器？', options: ['刘备', '关羽', '张飞'], answer: 'B', hint: '关羽', pinyin: 'qīng lóng yǎn yuè dāo shì shuí de wǔ qì ?' },
        { id: 102, level: 3, question: '丈八蛇矛是谁的武器？', options: ['关羽', '张飞', '赵云'], answer: 'B', hint: '张飞', pinyin: 'zhàng bā shé máo shì shuí de wǔ qì ?' },
        { id: 103, level: 3, question: '雌雄双剑是谁的武器？', options: ['刘备', '孙权', '曹操'], answer: 'A', hint: '刘备', pinyin: 'cí xióng shuāng jiàn shì shuí de wǔ qì ?' },
        { id: 104, level: 3, question: '羽扇是谁常用的道具？', options: ['关羽', '诸葛亮', '周瑜'], answer: 'B', hint: '诸葛亮', pinyin: 'yǔ shàn shì shuí cháng yòng de dào jù ?' },
        { id: 105, level: 3, question: '方天画戟是谁的武器？', options: ['吕布', '赵云', '马超'], answer: 'A', hint: '吕布', pinyin: 'fāng tiān huà jǐ shì shuí de wǔ qì ?' },
        { id: 106, level: 3, question: '龙胆亮银枪是谁的武器？', options: ['赵云', '马超', '黄忠'], answer: 'A', hint: '赵云', pinyin: 'lóng dǎn liàng yín qiāng shì shuí de wǔ qì ?' },
        { id: 107, level: 3, question: '虎头湛金枪是谁的武器？', options: ['马超', '赵云', '孙策'], answer: 'A', hint: '马超', pinyin: 'hǔ tóu zhàn jīn qiāng shì shuí de wǔ qì ?' },
        { id: 108, level: 3, question: '麒麟弓是谁的武器？', options: ['黄忠', '赵云', '太史慈'], answer: 'A', hint: '黄忠', pinyin: 'qí lín gōng shì shuí de wǔ qì ?' },
        { id: 109, level: 3, question: '倚天剑是谁的佩剑？', options: ['刘备', '曹操', '孙权'], answer: 'B', hint: '曹操', pinyin: 'yǐ tiān jiàn shì shuí de pèi jiàn ?' },
        { id: 110, level: 3, question: '青釭剑是谁从曹操那里得到的？', options: ['赵云', '马超', '黄忠'], answer: 'A', hint: '赵云', pinyin: 'qīng gāng jiàn shì shuí cóng cáo cāo nà lǐ dé dào de ?' },
        { id: 111, level: 3, question: '赤兔马最早是谁的坐骑？', options: ['董卓', '吕布', '关羽'], answer: 'A', hint: '董卓', pinyin: 'chì tù mǎ zuì zǎo shì shuí de zuò qí ?' },
        { id: 112, level: 3, question: '的卢马是谁的坐骑？', options: ['刘备', '关羽', '张飞'], answer: 'A', hint: '刘备', pinyin: 'dì lú mǎ shì shuí de zuò qí ?' },
        { id: 113, level: 3, question: '绝影马是谁的坐骑？', options: ['刘备', '曹操', '孙权'], answer: 'B', hint: '曹操', pinyin: 'jué yǐng mǎ shì shuí de zuò qí ?' },
        { id: 114, level: 3, question: '爪黄飞电是谁的坐骑？', options: ['刘备', '曹操', '孙权'], answer: 'B', hint: '曹操', pinyin: 'zhuǎ huáng fēi diàn shì shuí de zuò qí ?' },
        { id: 115, level: 3, question: '紫电剑是谁的武器？', options: ['孙权', '孙策', '周瑜'], answer: 'A', hint: '孙权', pinyin: 'zǐ diàn jiàn shì shuí de wǔ qì ?' },
        { id: 116, level: 3, question: '古锭刀是谁的武器？', options: ['程普', '黄盖', '韩当'], answer: 'A', hint: '程普', pinyin: 'gǔ dìng dāo shì shuí de wǔ qì ?' },
        { id: 117, level: 3, question: '铁脊蛇矛是谁的武器？', options: ['程普', '黄盖', '韩当'], answer: 'B', hint: '黄盖', pinyin: 'tiě jǐ shé máo shì shuí de wǔ qì ?' },
        { id: 118, level: 3, question: '双铁戟是谁的武器？', options: ['典韦', '许褚', '夏侯惇'], answer: 'A', hint: '典韦', pinyin: 'shuāng tiě jǐ shì shuí de wǔ qì ?' },
        { id: 119, level: 3, question: '大刀是谁的武器？', options: ['关兴', '张苞', '赵统'], answer: 'A', hint: '关兴', pinyin: 'dà dāo shì shuí de wǔ qì ?' },
        { id: 120, level: 3, question: '流星锤是谁的武器？', options: ['张苞', '关兴', '王平'], answer: 'A', hint: '张苞', pinyin: 'liú xīng chuí shì shuí de wǔ qì ?' },
        { id: 121, level: 3, question: '三尖两刃刀是谁的武器？', options: ['纪灵', '孔融', '韩馥'], answer: 'A', hint: '纪灵', pinyin: 'sān jiān liǎng rèn dāo shì shuí de wǔ qì ?' },
        { id: 122, level: 3, question: '金蘸斧是谁的武器？', options: ['徐晃', '张辽', '许褚'], answer: 'A', hint: '徐晃', pinyin: 'jī zhàn fǔ shì shuí de wǔ qì ?' },
        { id: 123, level: 3, question: '钩镰枪是谁的武器？', options: ['马钧', '马岱', '马超'], answer: 'A', hint: '马钧', pinyin: 'gōu lián qiāng shì shuí de wǔ qì ?' },
        { id: 124, level: 3, question: '狼牙棒是谁的武器？', options: ['沙摩柯', '孟获', '祝融'], answer: 'A', hint: '沙摩柯', pinyin: 'láng yá bàng shì shuí de wǔ qì ?' },
        { id: 125, level: 3, question: '火尖枪是谁的武器？', options: ['马超', '赵云', '姜维'], answer: 'A', hint: '马超', pinyin: 'huǒ jiān qiāng shì shuí de wǔ qì ?' },
        { id: 126, level: 3, question: '青龙刀是谁的武器？', options: ['关平', '关兴', '关索'], answer: 'A', hint: '关平', pinyin: 'qīng lóng dāo shì shuí de wǔ qì ?' },
        { id: 127, level: 3, question: '冷艳锯是什么武器？', options: ['青龙偃月刀', '丈八蛇矛', '方天画戟'], answer: 'A', hint: '青龙偃月刀', pinyin: 'lěng yàn jù shì shén me wǔ qì ?' },
        { id: 128, level: 3, question: '八十二斤重的武器是谁的？', options: ['关羽', '张飞', '赵云'], answer: 'A', hint: '关羽', pinyin: 'bā shí èr jīn zhòng de wǔ qì shì shuí de ?' },
        { id: 129, level: 3, question: '羽扇纶巾是谁的标志性装束？', options: ['周瑜', '诸葛亮', '鲁肃'], answer: 'A', hint: '周瑜', pinyin: 'yǔ shàn lún jīn shì shuí de biāo zhì xìng zhuāng ?' },
        { id: 130, level: 3, question: '鹤氅是谁常穿的衣服？', options: ['诸葛亮', '司马懿', '刘备'], answer: 'A', hint: '诸葛亮', pinyin: 'hè chǎng shì shuí cháng chuān de yī fú ?' },
        { id: 131, level: 3, question: '八卦衣是谁的标志？', options: ['诸葛亮', '姜维', '庞统'], answer: 'A', hint: '诸葛亮', pinyin: 'bā guà yī shì shuí de biāo zhì ?' },
        { id: 132, level: 3, question: '黄马褂是谁赐给关羽的？', options: ['曹操', '刘备', '孙权'], answer: 'A', hint: '曹操', pinyin: 'huáng mǎ guà shì shuí cì gěi guān yǔ de ?' },
        { id: 133, level: 3, question: '赤兔马最后归属于谁？', options: ['关羽', '吕布', '董卓'], answer: 'A', hint: '关羽', pinyin: 'chì tù mǎ zuì hòu guī shǔ yú shuí ?' },
        { id: 134, level: 3, question: '照夜玉狮子是谁的坐骑？', options: ['赵云', '马超', '黄忠'], answer: 'A', hint: '赵云', pinyin: 'zhào yè yù shī zi shì shuí de zuò qí ?' },
        { id: 135, level: 3, question: '乌孙马是谁的坐骑？', options: ['黄忠', '赵云', '马超'], answer: 'A', hint: '黄忠', pinyin: 'wū sūn mǎ shì shuí de zuò qí ?' },
        { id: 136, level: 3, question: '白龙马是谁的坐骑？', options: ['刘备', '关羽', '张飞'], answer: 'A', hint: '刘备', pinyin: 'bái lóng mǎ shì shuí de zuò qí ?' },
        { id: 137, level: 3, question: '铁蒺藜骨朵是谁的武器？', options: ['沙摩柯', '孟获', '祝融'], answer: 'A', hint: '沙摩柯', pinyin: 'tiě jí leng gǔ duǒ shì shuí de wǔ qì ?' },
        { id: 138, level: 3, question: '四棱铁简是谁的武器？', options: ['黄盖', '程普', '韩当'], answer: 'B', hint: '黄盖', pinyin: 'sì léng tiě jiǎn shì shuí de wǔ qì ?' },
        { id: 139, level: 3, question: '双刀是谁的武器？', options: ['甘宁', '周泰', '凌统'], answer: 'A', hint: '甘宁', pinyin: 'shuāng dāo shì shuí de wǔ qì ?' },
        { id: 140, level: 3, question: '飞刀是谁的暗器？', options: ['甘宁', '魏延', '姜维'], answer: 'A', hint: '甘宁', pinyin: 'fēi dāo shì shuí de àn qì ?' },
        { id: 141, level: 3, question: '开山斧是谁的武器？', options: ['徐盛', '丁奉', '潘璋'], answer: 'A', hint: '徐盛', pinyin: 'kāi shān fǔ shì shuí de wǔ qì ?' },
        { id: 142, level: 3, question: '银枪是谁的武器？', options: ['赵云', '马超', '姜维'], answer: 'A', hint: '赵云', pinyin: 'yín qiāng shì shuí de wǔ qì ?' },
        { id: 143, level: 3, question: '铁鞭是谁的武器？', options: ['黄盖', '程普', '韩当'], answer: 'A', hint: '黄盖', pinyin: 'tiě biān shì shuí de wǔ qì ?' },
        { id: 144, level: 3, question: '太阿剑是谁的佩剑？', options: ['孙权', '孙策', '孙坚'], answer: 'A', hint: '孙权', pinyin: 'tài ā jiàn shì shuí de pèi jiàn ?' },
        { id: 145, level: 3, question: '七宝刀是谁的武器？', options: ['曹操', '刘备', '孙权'], answer: 'A', hint: '曹操', pinyin: 'qī bǎo dāo shì shuí de wǔ qì ?' },
        { id: 146, level: 3, question: '锯齿刀是谁的武器？', options: ['韩当', '黄盖', '程普'], answer: 'A', hint: '韩当', pinyin: 'jù chǐ dāo shì shuí de wǔ qì ?' },
        { id: 147, level: 3, question: '大斧是谁的武器？', options: ['徐晃', '许褚', '典韦'], answer: 'A', hint: '徐晃', pinyin: 'dà fǔ shì shuí de wǔ qì ?' },
        { id: 148, level: 3, question: '钩镰枪是用来做什么的？', options: ['钩马腿', '攻城', '防御'], answer: 'A', hint: '钩马腿', pinyin: 'gōu lián qiāng shì yòng lái zuò shén me de ?' },
        { id: 149, level: 3, question: '连弩是谁发明的？', options: ['诸葛亮', '马钧', '鲁班'], answer: 'A', hint: '诸葛亮', pinyin: 'lián nǔ shì shuí fā míng de ?' },
        { id: 150, level: 3, question: '木牛流马是谁发明的？', options: ['诸葛亮', '马钧', '鲁班'], answer: 'A', hint: '诸葛亮', pinyin: 'mù niú liú mǎ shì shuí fā míng de ?' },

        // 第四关：趣味小问答 (50题)
        { id: 151, level: 4, question: '三国演义的开篇诗句是"天下大势，____"之后怎样？', options: ['分久必合，合久必分', '一统天下', '三分天下'], answer: 'A', hint: '分久必合', pinyin: 'sān guó yǎn yì de kāi piān shī jù shì " tiān xià dà shì , ____ " zhī hòu zěn yàng ?' },
        { id: 152, level: 4, question: '赵云在长坂坡救了谁的孩子？', options: ['关羽', '刘备', '孙权'], answer: 'B', hint: '刘备', pinyin: 'zhào yún zài cháng bǎn pō jiù le shuí de hái zi ?' },
        { id: 153, level: 4, question: '谁的坐骑叫赤兔马？', options: ['刘备', '关羽', '曹操'], answer: 'B', hint: '关羽', pinyin: 'shuí de zuò qí jiào chì tù mǎ ?' },
        { id: 154, level: 4, question: '桃园三结义是在哪个季节？', options: ['春天', '夏天', '秋天'], answer: 'A', hint: '春天', pinyin: 'táo yuán sān jié yì shì zài nǎ gè jì jié ?' },
        { id: 155, level: 4, question: '三国演义中"七步成诗"的是谁？', options: ['曹丕', '曹植', '曹操'], answer: 'B', hint: '曹植', pinyin: 'sān guó yǎn yì zhōng " qī bù chéng shī " de shì shuí ?' },
        { id: 156, level: 4, question: '三国演义中共有多少回？', options: ['一百回', '一百二十回', '一百一十回'], answer: 'B', hint: '一百二十回', pinyin: 'sān guó yǎn yì zhōng gòng yǒu duō shǎo huí ?' },
        { id: 157, level: 4, question: '三国演义的作者是谁？', options: ['罗贯中', '施耐庵', '吴承恩'], answer: 'A', hint: '罗贯中', pinyin: 'sān guó yǎn yì de zuò zhě shì shuí ?' },
        { id: 158, level: 4, question: '三国演义属于什么类型的小说？', options: ['历史演义', '武侠', '神话'], answer: 'A', hint: '历史演义', pinyin: 'sān guó yǎn yì shǔ yǔ shén me lèi xíng de xiǎo shuō ?' },
        { id: 159, level: 4, question: '三国演义描写的是哪个历史时期的故事？', options: ['东汉末年', '春秋战国', '秦朝'], answer: 'A', hint: '东汉末年', pinyin: 'sān guó yǎn yì miáo xiě de shì nǎ gè lì shǐ shí qī de gù shì ?' },
        { id: 160, level: 4, question: '三国指的是哪三国？', options: ['魏蜀吴', '齐楚燕', '秦赵魏'], answer: 'A', hint: '魏蜀吴', pinyin: 'sān guó zhǐ de nǎ sān guó ?' },
        { id: 161, level: 4, question: '三国中哪一国最强大？', options: ['魏国', '蜀国', '吴国'], answer: 'A', hint: '魏国', pinyin: 'sān guó zhōng nǎ yī guó zuì qiáng dà ?' },
        { id: 162, level: 4, question: '蜀国位于中国的哪个方向？', options: ['西南', '东南', '西北'], answer: 'A', hint: '西南', pinyin: 'shǔ guó wèi yú zhōng guó de nǎ ge fāng xiàng ?' },
        { id: 163, level: 4, question: '吴国位于中国的哪个方向？', options: ['东南', '西南', '东北'], answer: 'A', hint: '东南', pinyin: 'wú guó wèi yú zhōng guó de nǎ ge fāng xiàng ?' },
        { id: 164, level: 4, question: '魏国位于中国的哪个方向？', options: ['北方', '南方', '西方'], answer: 'A', hint: '北方', pinyin: 'wèi guó wèi yú zhōng guó de nǎ ge fāng xiàng ?' },
        { id: 165, level: 4, question: '三国演义中第一个出场的重要人物是谁？', options: ['张角', '刘备', '曹操'], answer: 'A', hint: '张角', pinyin: 'sān guó yǎn yì zhōng dì yī gè chū chǎng de zhòng yào rén wù shì shuí ?' },
        { id: 166, level: 4, question: '黄巾起义的首领是谁？', options: ['张角', '张飞', '张辽'], answer: 'A', hint: '张角', pinyin: 'huáng jīn qǐ yì de shǒu lǐng shì shuí ?' },
        { id: 167, level: 4, question: '三国演义以什么事件开篇？', options: ['黄巾起义', '桃园结义', '赤壁之战'], answer: 'A', hint: '黄巾起义', pinyin: 'sān guó yǎn yì yǐ shén me shì jiàn kāi piān ?' },
        { id: 168, level: 4, question: '三国演义以什么事件结束？', options: ['三分归晋', '蜀汉灭亡', '东吴灭亡'], answer: 'A', hint: '三分归晋', pinyin: 'sān guó yǎn yì yǐ shén me shì jiàn jié shù ?' },
        { id: 169, level: 4, question: '三国中最先灭亡的是哪一国？', options: ['蜀国', '魏国', '吴国'], answer: 'A', hint: '蜀国', pinyin: 'sān guó zhōng zuì xiān miè wáng de shì nǎ yī guó ?' },
        { id: 170, level: 4, question: '三国中最后灭亡的是哪一国？', options: ['吴国', '蜀国', '魏国'], answer: 'A', hint: '吴国', pinyin: 'sān guó zhōng zuì hòu miè wáng de shì nǎ yī guó ?' },
        { id: 171, level: 4, question: '统一三国的是谁？', options: ['司马炎', '司马懿', '司马师'], answer: 'A', hint: '司马炎', pinyin: 'tǒng yī sān guó de shì shuí ?' },
        { id: 172, level: 4, question: '司马炎建立了什么朝代？', options: ['晋朝', '唐朝', '宋朝'], answer: 'A', hint: '晋朝', pinyin: 'sī mǎ yán jiàn lì le shén me cháo dài ?' },
        { id: 173, level: 4, question: '三国演义中著名的"望梅止渴"是谁的计谋？', options: ['曹操', '刘备', '孙权'], answer: 'A', hint: '曹操', pinyin: 'sān guó yǎn yì zhōng zhù míng de " wàng méi zhǐ kě " shì shuí de jì móu ?' },
        { id: 174, level: 4, question: '三国演义中"说曹操曹操到"这句话是怎么来的？', options: ['曹操出现得快', '曹操会法术', '曹操有千里眼'], answer: 'A', hint: '出现得快', pinyin: 'sān guó yǎn yì zhōng " shuō cáo cāo cáo dào " zhè jù huà shì zěn me lái de ?' },
        { id: 175, level: 4, question: '三国演义中"周瑜打黄盖"歇后语的下句是什么？', options: ['一个愿打一个愿挨', '两败俱伤', '自作自受'], answer: 'A', hint: '一个愿打一个愿挨', pinyin: 'sān guó yǎn yì zhōng " zhōu yú dǎ huáng gài " xiě hòu yù de shì shén me ?' },
        { id: 176, level: 4, question: '三国演义中"三个臭皮匠"歇后语的下句是什么？', options: ['顶个诸葛亮', '不如一个诸葛亮', '也是诸葛亮'], answer: 'A', hint: '顶个诸葛亮', pinyin: 'sān guó yǎn yì zhōng " sān gè chòu pí jiàng " xiě hòu yù de shì shén me ?' },
        { id: 177, level: 4, question: '三国演义中"刘备借荆州"歇后语的下句是什么？', options: ['有借无还', '借而不还', '永远不还'], answer: 'A', hint: '有借无还', pinyin: 'sān guó yǎn yì zhōng " liú bèi jiè jīng zhōu " xiě hòu yù de shì shén me ?' },
        { id: 178, level: 4, question: '三国演义中"张飞穿针"歇后语的下句是什么？', options: ['粗中有细', '大眼瞪小眼', '有劲使不上'], answer: 'A', hint: '粗中有细', pinyin: 'sān guó yǎn yì zhōng " zhāng fēi chuān zhēn " xiě hòu yù de shì shén me ?' },
        { id: 179, level: 4, question: '三国演义中"关公面前耍大刀"歇后语的下句是什么？', options: ['不自量力', '班门弄斧', '献丑'], answer: 'A', hint: '不自量力', pinyin: 'sān guó yǎn yì zhōng " guān gōng miàn qián shuǎ dà dāo " xiě hòu yù de shì shén me ?' },
        { id: 180, level: 4, question: '三国演义中"司马昭之心"歇后语的下句是什么？', options: ['路人皆知', '人人知晓', '众所周知'], answer: 'A', hint: '路人皆知', pinyin: 'sān guó yǎn yì zhōng " sī mǎ zhāo zhī xīn " xiě hòu yù de shì shén me ?' },
        { id: 181, level: 4, question: '三国演义中曹操最欣赏的蜀国将领是谁？', options: ['关羽', '赵云', '张飞'], answer: 'A', hint: '关羽', pinyin: 'sān guó yǎn yì zhōng cáo cāo zuì xīn shǎng de shǔ guó jiàng lǐng shì shuí ?' },
        { id: 182, level: 4, question: '三国演义中诸葛亮最信任的将领是谁？', options: ['姜维', '魏延', '马谡'], answer: 'A', hint: '姜维', pinyin: 'sān guó yǎn yì zhōng zhū gě liàng zuì xìn rèn de jiàng lǐng shì shuí ?' },
        { id: 183, level: 4, question: '三国演义中谁的武艺最高？', options: ['吕布', '赵云', '关羽'], answer: 'A', hint: '吕布', pinyin: 'sān guó yǎn yì zhōng shéi de wǔ yì zuì gāo ?' },
        { id: 184, level: 4, question: '三国演义中谁最聪明？', options: ['诸葛亮', '周瑜', '司马懿'], answer: 'A', hint: '诸葛亮', pinyin: 'sān guó yǎn yì zhōng shuí zuì cōng míng ?' },
        { id: 185, level: 4, question: '三国演义中谁最勇敢？', options: ['张飞', '赵云', '关羽'], answer: 'A', hint: '张飞', pinyin: 'sān guó yǎn yì zhōng shuí zuì yǒng gǎn ?' },
        { id: 186, level: 4, question: '三国演义中谁最忠诚？', options: ['关羽', '赵云', '张飞'], answer: 'A', hint: '关羽', pinyin: 'sān guó yǎn yì zhōng shuí zuì zhōng chéng ?' },
        { id: 187, level: 4, question: '三国演义中谁的力气最大？', options: ['典韦', '许褚', '张飞'], answer: 'A', hint: '典韦', pinyin: 'sān guó yǎn yì zhōng shéi de lì qì zuì dà ?' },
        { id: 188, level: 4, question: '三国演义中谁跑得最快？', options: ['曹操', '刘备', '孙权'], answer: 'A', hint: '曹操', pinyin: 'sān guó yǎn yì zhōng shuí pǎo de zuì kuài ?' },
        { id: 189, level: 4, question: '三国演义中谁的骑术最好？', options: ['马超', '赵云', '关羽'], answer: 'A', hint: '马超', pinyin: 'sān guó yǎn yì zhōng shuí de qí shù zuì hǎo ?' },
        { id: 190, level: 4, question: '三国演义中谁的箭术最好？', options: ['黄忠', '赵云', '太史慈'], answer: 'A', hint: '黄忠', pinyin: 'sān guó yǎn yì zhōng shéi de jiàn shù zuì hǎo ?' },
        { id: 191, level: 4, question: '三国演义中谁的兵器最重？', options: ['关羽', '张飞', '吕布'], answer: 'A', hint: '关羽', pinyin: 'sān guó yǎn yì zhōng shéi de bīng qì zuì zhòng ?' },
        { id: 192, level: 4, question: '三国演义中谁的坐骑最快？', options: ['赤兔马', '的卢马', '绝影'], answer: 'A', hint: '赤兔马', pinyin: 'sān guó yǎn yì zhōng shéi de zuò qí zuì kuài ?' },
        { id: 193, level: 4, question: '三国演义中谁最长寿？', options: ['司马懿', '诸葛亮', '曹操'], answer: 'A', hint: '司马懿', pinyin: 'sān guó yǎn yì zhōng shuí zuì cháng shòu ?' },
        { id: 194, level: 4, question: '三国演义中谁最短命？', options: ['周瑜', '吕蒙', '陆逊'], answer: 'A', hint: '周瑜', pinyin: 'sān guó yǎn yì zhōng shuí zuì duǎn mìng ?' },
        { id: 195, level: 4, question: '三国演义中谁的儿子最多？', options: ['曹操', '刘备', '孙权'], answer: 'A', hint: '曹操', pinyin: 'sān guó yǎn yì zhōng shuí de ér zi zuì duō ?' },
        { id: 196, level: 4, question: '三国演义中谁的兄弟最多？', options: ['孙策', '刘备', '诸葛亮'], answer: 'A', hint: '孙策', pinyin: 'sān guó yǎn yì zhōng shuí de xiōng dì zuì duō ?' },
        { id: 197, level: 4, question: '三国演义中谁的妹妹最多？', options: ['孙权', '刘备', '曹操'], answer: 'A', hint: '孙权', pinyin: 'sān guó yǎn yì zhōng shuí de mèi mei zuì duō ?' },
        { id: 198, level: 4, question: '三国演义中谁最富有？', options: ['曹操', '刘备', '孙权'], answer: 'A', hint: '曹操', pinyin: 'sān guó yǎn yì zhōng shuí zuì fù yǒu ?' },
        { id: 199, level: 4, question: '三国演义中谁最贫穷？', options: ['刘备', '曹操', '孙权'], answer: 'A', hint: '刘备', pinyin: 'sān guó yǎn yì zhōng shuí zuì pín qióng ?' },
        { id: 200, level: 4, question: '三国演义中谁是美髯公？', options: ['关羽', '张飞', '赵云'], answer: 'A', hint: '关羽', pinyin: 'sān guó yǎn yì zhōng shuí shì měi rán gōng ?' }
    ],

    // 本地化文本
    TEXTS: {
        correct: ['太棒了！', '答对了！', '真聪明！', '好样的！', '继续加油！'],
        wrong: ['再想想...', '不对哦', '差一点', '别灰心', '再试一次'],
        pass: ['闯关成功！', '恭喜过关！', '太厉害了！'],
        fail: ['闯关失败', '再接再厉', '继续努力'],
        revive: '使用提示复活',
        reviveHint: '高亮关键词，帮助你找到答案',
        retry: '重新挑战',
        nextLevel: '下一关',
        backHome: '返回主页',
        certificate: '查看荣誉证书',
        share: '截图保存'
    },

    // 错误消息
    ERRORS: {
        loadQuestions: '题目加载失败，请刷新页面重试',
        loadProgress: '进度加载失败',
        saveProgress: '进度保存失败',
        audioError: '音效播放失败'
    }
};

// 导出配置（兼容不同模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}
