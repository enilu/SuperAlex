// ==================== 游戏配置 ====================
const CONFIG = {
    // 游戏基础配置
    GAME_NAME: '唐诗小当家',
    GAME_VERSION: 'v1.0.0',

    // 缓存版本配置（与游戏版本解耦，数据结构变化时需升级此版本）
    CACHE_VERSION: '1.0.0',

    // 闯关模式配置
    TOTAL_QUESTIONS: 10,           // 每局题目数量
    POINTS_PER_QUESTION: 10,       // 每题分数
    PASS_SCORE: 60,                // 及格分数

    // 音效配置
    AUDIO_ENABLED: true,
    AUDIO_PATH: 'assets/audio/',

    // 唐诗数据路径
    POEMS_INDEX_PATH: 'assets/data/poems.json',
    POEMS_DATA_PATH: 'assets/data/poems/',


    // 成就配置
    ACHIEVEMENTS: {
        BEGINNER: { id: 'beginner', name: '唐诗初学者', icon: '🌱', threshold: 1, description: '背诵第一首唐诗' },
        POET_LEARNER: { id: 'poet_learner', name: '小诗童', icon: '📚', threshold: 5, description: '背诵5首唐诗' },
        POET_MASTER: { id: 'poet_master', name: '诗仙', icon: '🌟', threshold: 10, description: '背诵10首唐诗' },
        POET_EXPERT: { id: 'poet_expert', name: '大诗人', icon: '👑', threshold: 20, description: '背诵20首唐诗' },
        PERFECT_SCORE: { id: 'perfect_score', name: '满分达人', icon: '💯', threshold: 0, description: '获得满分' }
    },

    // 评级配置
    RANKS: [
        { minScore: 90, title: '诗仙', stars: 3, message: '你真是唐诗小天才！' },
        { minScore: 80, title: '诗童', stars: 3, message: '非常棒！继续努力！' },
        { minScore: 60, title: '学徒', stars: 2, message: '做得不错！再接再厉！' },
        { minScore: 0, title: '新手', stars: 1, message: '多多练习，会越来越好的！' }
    ],

    // 填空题配置
    BLANK_CONFIG: {
        MIN_BLANKS: 1,              // 最少空格数
        MAX_BLANKS: 2,              // 最多空格数
        OPTIONS_COUNT: 4            // 选项数量
    },

    // 复习模式配置
    REVIEW_CONFIG: {
        // 儿童友好复习间隔（分钟）
        INTERVALS: [
            5,      // 阶段0：5分钟
            30,     // 阶段1：30分钟
            180,    // 阶段2：3小时
            1440,   // 阶段3：1天
            4320,   // 阶段4：3天
            10080,  // 阶段5：1周
            20160,  // 阶段6：2周
            43200   // 阶段7：1个月
        ],

        // 记忆强度参数
        MEMORY_STRENGTH: {
            BASE_GAIN: 30,          // 基础增益
            PERFORMANCE_FACTOR: {   // 表现系数映射
                min: 0.6,           // 60%答对率
                max: 1.4            // 100%答对率
            },
            STAGE_FACTORS: [        // 阶段系数
                1.2, 1.1, 1.0, 0.9, 0.9, 0.8, 0.8, 0.7
            ],
            DECAY_RATE: 1.5,        // 每日衰减系数
            MASTERY_THRESHOLD: 85   // 掌握阈值
        },

        // 复习设置
        REVIEW_SETTINGS: {
            MAX_POEMS_PER_SESSION: 5,     // 每次复习最多5首
            SESSION_TIME_LIMIT: 10,       // 单次复习限时10分钟
            DAILY_REVIEW_LIMIT: 15,       // 每日最多复习15首
            ENABLE_NOTIFICATIONS: true    // 启用复习提醒
        },

        // 动态调整规则
        ADJUSTMENT_RULES: {
            PROMOTE_THRESHOLD: 80,   // ≥80%答对率进入下一阶段
            DEMOTE_THRESHOLD: 60,    // <60%答对率退回上一阶段
            INTERVAL_ADJUSTMENT: 0.2 // 间隔调整比例（20%）
        }
    },

    // 鼓励语配置
    ENCOURAGEMENT: {
        CORRECT: [
            '太棒了！', '答对了！', '真聪明！', '继续加油！', '你真厉害！'
        ],
        WRONG: [
            '没关系，再试一次！', '加油！', '别灰心，继续努力！', '你可以的！'
        ],
        COMPLETION: [
            '恭喜完成！', '表现优秀！', '做得很好！', '太棒了！'
        ]
    }
};

export { CONFIG };
