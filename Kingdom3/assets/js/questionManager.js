/**
 * 三国演义H5问答游戏 - 题库管理模块
 * 支持加载JSON题目、获取关卡题目、按ID查询题目等功能
 */

const QuestionManager = {
    // 题目数据
    questions: [],
    isLoaded: false,

    /**
     * 初始化题库管理器
     */
    async init() {
        if (this.isLoaded) {
            return;
        }

        // 尝试从LocalStorage加载用户自定义题目
        const customQuestions = CacheManager.loadQuestions();

        // 加载默认题目
        if (customQuestions.length > 0) {
            this.questions = customQuestions;
        } else {
            this.questions = GameConfig.DEFAULT_QUESTIONS;
        }

        this.isLoaded = true;
    },

    /**
     * 获取指定关卡的题目
     * @param {number} level - 关卡号（1-4）
     * @returns {Array} 题目数组
     */
    getLevelQuestions(level) {
        const levelQuestions = this.questions.filter(q => q.level === level);

        // 随机打乱题目顺序
        return this.shuffleArray([...levelQuestions]).slice(0, 5);
    },

    /**
     * 根据ID获取题目
     * @param {number} id - 题目ID
     * @returns {Object|null} 题目对象
     */
    getQuestionById(id) {
        return this.questions.find(q => q.id === id) || null;
    },

    /**
     * 获取所有题目
     * @returns {Array} 所有题目
     */
    getAllQuestions() {
        return [...this.questions];
    },

    /**
     * 根据关卡筛选题目
     * @param {number} level - 关卡号
     * @returns {Array} 题目数组
     */
    getQuestionsByLevel(level) {
        return this.questions.filter(q => q.level === level);
    },

    /**
     * 添加题目
     * @param {Object} question - 题目对象
     * @returns {boolean} 是否添加成功
     */
    addQuestion(question) {
        try {
            // 验证题目格式
            if (!this.validateQuestion(question)) {
                return false;
            }

            // 生成新ID
            const maxId = this.questions.reduce((max, q) => Math.max(max, q.id), 0);
            question.id = maxId + 1;

            // 添加到题库
            this.questions.push(question);

            // 保存到LocalStorage
            CacheManager.saveQuestions(this.questions);

            return true;
        } catch (error) {
            console.error('QuestionManager.addQuestion error:', error);
            return false;
        }
    },

    /**
     * 更新题目
     * @param {number} id - 题目ID
     * @param {Object} question - 新的题目对象
     * @returns {boolean} 是否更新成功
     */
    updateQuestion(id, question) {
        try {
            const index = this.questions.findIndex(q => q.id === id);

            if (index === -1) {
                return false;
            }

            // 验证题目格式
            if (!this.validateQuestion(question)) {
                return false;
            }

            // 保留原ID
            question.id = id;

            // 更新题目
            this.questions[index] = question;

            // 保存到LocalStorage
            CacheManager.saveQuestions(this.questions);

            return true;
        } catch (error) {
            console.error('QuestionManager.updateQuestion error:', error);
            return false;
        }
    },

    /**
     * 删除题目
     * @param {number} id - 题目ID
     * @returns {boolean} 是否删除成功
     */
    deleteQuestion(id) {
        try {
            const index = this.questions.findIndex(q => q.id === id);

            if (index === -1) {
                return false;
            }

            // 删除题目
            this.questions.splice(index, 1);

            // 保存到LocalStorage
            CacheManager.saveQuestions(this.questions);

            return true;
        } catch (error) {
            console.error('QuestionManager.deleteQuestion error:', error);
            return false;
        }
    },

    /**
     * 验证题目格式
     * @param {Object} question - 题目对象
     * @returns {boolean} 是否有效
     */
    validateQuestion(question) {
        // 检查必需字段
        if (!question.question || typeof question.question !== 'string') {
            return false;
        }

        if (!question.options || !Array.isArray(question.options) || question.options.length !== 3) {
            return false;
        }

        if (!question.answer || !['A', 'B', 'C'].includes(question.answer)) {
            return false;
        }

        if (!question.level || !['1', '2', '3', '4', 1, 2, 3, 4].includes(question.level)) {
            return false;
        }

        // 检查选项是否为空
        if (question.options.some(opt => !opt || typeof opt !== 'string')) {
            return false;
        }

        return true;
    },

    /**
     * 获取题目统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        const stats = {
            total: this.questions.length,
            byLevel: {}
        };

        for (let i = 1; i <= 4; i++) {
            stats.byLevel[i] = this.questions.filter(q => q.level === i).length;
        }

        return stats;
    },

    /**
     * 重置为默认题目
     * @returns {boolean} 是否重置成功
     */
    resetToDefault() {
        try {
            this.questions = [...GameConfig.DEFAULT_QUESTIONS];
            CacheManager.saveQuestions(this.questions);
            return true;
        } catch (error) {
            console.error('QuestionManager.resetToDefault error:', error);
            return false;
        }
    },

    /**
     * 导入题目
     * @param {Array} questions - 题目数组
     * @returns {boolean} 是否导入成功
     */
    importQuestions(questions) {
        try {
            if (!Array.isArray(questions)) {
                return false;
            }

            // 验证所有题目
            const validQuestions = questions.filter(q => this.validateQuestion(q));

            if (validQuestions.length === 0) {
                return false;
            }

            // 添加到题库
            this.questions = [...this.questions, ...validQuestions];

            // 保存到LocalStorage
            CacheManager.saveQuestions(this.questions);

            return true;
        } catch (error) {
            console.error('QuestionManager.importQuestions error:', error);
            return false;
        }
    },

    /**
     * 导出题目
     * @returns {string} JSON字符串
     */
    exportQuestions() {
        return JSON.stringify(this.questions, null, 2);
    },

    /**
     * 从JSON文件加载题目
     * @param {string} jsonPath - JSON文件路径
     * @returns {Promise<Array>} 题目数组
     */
    async loadFromJSON(jsonPath) {
        try {
            const response = await fetch(jsonPath);

            if (!response.ok) {
                throw new Error(`Failed to load JSON: ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error('Invalid JSON format: expected an array');
            }

            return data;
        } catch (error) {
            console.error('QuestionManager.loadFromJSON error:', error);
            return [];
        }
    },

    /**
     * 打乱数组顺序（Fisher-Yates算法）
     * @param {Array} array - 要打乱的数组
     * @returns {Array} 打乱后的数组
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },

    /**
     * 获取随机题目（跨关卡）
     * @param {number} count - 题目数量
     * @returns {Array} 随机题目数组
     */
    getRandomQuestions(count) {
        const shuffled = this.shuffleArray([...this.questions]);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    },

    /**
     * 搜索题目
     * @param {string} keyword - 关键词
     * @returns {Array} 匹配的题目数组
     */
    searchQuestions(keyword) {
        const lowerKeyword = keyword.toLowerCase();

        return this.questions.filter(q => {
            return q.question.toLowerCase().includes(lowerKeyword) ||
                   q.options.some(opt => opt.toLowerCase().includes(lowerKeyword)) ||
                   (q.hint && q.hint.toLowerCase().includes(lowerKeyword));
        });
    },

    /**
     * 获取题目总数
     * @returns {number} 题目总数
     */
    getCount() {
        return this.questions.length;
    },

    /**
     * 清空题库
     * @returns {boolean} 是否清空成功
     */
    clear() {
        try {
            this.questions = [];
            CacheManager.saveQuestions(this.questions);
            return true;
        } catch (error) {
            console.error('QuestionManager.clear error:', error);
            return false;
        }
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionManager;
}
