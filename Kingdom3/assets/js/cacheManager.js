/**
 * 三国演义H5问答游戏 - 缓存管理模块
 * 复用TangPoem的缓存逻辑，支持LocalStorage的读写
 */

const CacheManager = {
    /**
     * 保存数据到LocalStorage
     * @param {string} key - 缓存键名
     * @param {*} value - 要保存的值
     * @returns {boolean} 是否保存成功
     */
    set(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(key, data);
            return true;
        } catch (error) {
            console.error('CacheManager.set error:', error);
            return false;
        }
    },

    /**
     * 从LocalStorage读取数据
     * @param {string} key - 缓存键名
     * @param {*} defaultValue - 默认值
     * @returns {*} 读取的值或默认值
     */
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (data === null) {
                return defaultValue;
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('CacheManager.get error:', error);
            return defaultValue;
        }
    },

    /**
     * 删除指定键的数据
     * @param {string} key - 缓存键名
     * @returns {boolean} 是否删除成功
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('CacheManager.remove error:', error);
            return false;
        }
    },

    /**
     * 清空所有缓存数据
     * @returns {boolean} 是否清空成功
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('CacheManager.clear error:', error);
            return false;
        }
    },

    /**
     * 检查键是否存在
     * @param {string} key - 缓存键名
     * @returns {boolean} 键是否存在
     */
    has(key) {
        return localStorage.getItem(key) !== null;
    },

    /**
     * 获取缓存大小（近似值）
     * @returns {number} 缓存大小（字节）
     */
    getSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    },

    /**
     * 获取所有缓存键
     * @returns {string[]} 所有键名数组
     */
    keys() {
        return Object.keys(localStorage);
    },

    /**
     * 批量保存数据
     * @param {Object} data - 键值对对象
     * @returns {boolean} 是否全部保存成功
     */
    setMultiple(data) {
        let success = true;
        for (let key in data) {
            if (!this.set(key, data[key])) {
                success = false;
            }
        }
        return success;
    },

    /**
     * 批量读取数据
     * @param {string[]} keys - 键名数组
     * @param {*} defaultValue - 默认值
     * @returns {Object} 键值对对象
     */
    getMultiple(keys, defaultValue = null) {
        const result = {};
        keys.forEach(key => {
            result[key] = this.get(key, defaultValue);
        });
        return result;
    },

    /**
     * 保存游戏进度
     * @param {Object} progress - 进度数据
     * @returns {boolean} 是否保存成功
     */
    saveProgress(progress) {
        return this.set(GameConfig.CACHE_KEYS.PROGRESS, progress);
    },

    /**
     * 读取游戏进度
     * @returns {Object} 进度数据
     */
    loadProgress() {
        return this.get(GameConfig.CACHE_KEYS.PROGRESS, this.getDefaultProgress());
    },

    /**
     * 获取默认进度数据
     * @returns {Object} 默认进度
     */
    getDefaultProgress() {
        return {
            unlockedLevels: [1],
            levelScores: {},
            totalCorrect: 0,
            totalWrong: 0,
            totalPlayCount: 0,
            achievements: [],
            lastPlayTime: null
        };
    },

    /**
     * 保存题库数据
     * @param {Array} questions - 题目数组
     * @returns {boolean} 是否保存成功
     */
    saveQuestions(questions) {
        return this.set(GameConfig.CACHE_KEYS.QUESTIONS, questions);
    },

    /**
     * 读取题库数据
     * @returns {Array} 题目数组
     */
    loadQuestions() {
        return this.get(GameConfig.CACHE_KEYS.QUESTIONS, []);
    },

    /**
     * 保存设置
     * @param {Object} settings - 设置对象
     * @returns {boolean} 是否保存成功
     */
    saveSettings(settings) {
        return this.set(GameConfig.CACHE_KEYS.SETTINGS, settings);
    },

    /**
     * 读取设置
     * @returns {Object} 设置对象
     */
    loadSettings() {
        return this.get(GameConfig.CACHE_KEYS.SETTINGS, this.getDefaultSettings());
    },

    /**
     * 获取默认设置
     * @returns {Object} 默认设置
     */
    getDefaultSettings() {
        return {
            sound: true,
            music: true,
            vibration: true
        };
    },

    /**
     * 重置所有游戏数据
     * @returns {boolean} 是否重置成功
     */
    resetAll() {
        this.remove(GameConfig.CACHE_KEYS.PROGRESS);
        this.remove(GameConfig.CACHE_KEYS.SETTINGS);
        // 不删除题库数据，保留用户添加的题目
        return true;
    },

    /**
     * 导出所有数据（用于备份）
     * @returns {string} JSON字符串
     */
    exportData() {
        const data = {
            progress: this.loadProgress(),
            questions: this.loadQuestions(),
            settings: this.loadSettings(),
            exportTime: new Date().toISOString(),
            version: GameConfig.GAME_VERSION
        };
        return JSON.stringify(data, null, 2);
    },

    /**
     * 导入数据（用于恢复）
     * @param {string} jsonData - JSON字符串
     * @returns {boolean} 是否导入成功
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            // 验证数据格式
            if (!data.version || !data.progress) {
                throw new Error('Invalid data format');
            }

            // 导入数据
            if (data.progress) {
                this.saveProgress(data.progress);
            }
            if (data.questions) {
                this.saveQuestions(data.questions);
            }
            if (data.settings) {
                this.saveSettings(data.settings);
            }

            return true;
        } catch (error) {
            console.error('CacheManager.importData error:', error);
            return false;
        }
    },

    /**
     * 压缩数据（移除不必要的字段以减少存储空间）
     * @param {Object} data - 原始数据
     * @returns {Object} 压缩后的数据
     */
    compressData(data) {
        // 深拷贝数据
        const compressed = JSON.parse(JSON.stringify(data));

        // 移除已完成的关卡历史（只保留最高分）
        if (compressed.levelScores) {
            for (let level in compressed.levelScores) {
                // 只保留星级和分数
                compressed.levelScores[level] = {
                    stars: compressed.levelScores[level].stars,
                    score: compressed.levelScores[level].score
                };
            }
        }

        return compressed;
    },

    /**
     * 检查存储空间是否足够
     * @param {number} requiredSize - 需要的大小（字节）
     * @returns {boolean} 是否有足够空间
     */
    hasSpace(requiredSize) {
        try {
            const testKey = '__storage_test__';
            const testValue = 'x'.repeat(requiredSize);
            localStorage.setItem(testKey, testValue);
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * 获取存储使用情况
     * @returns {Object} 存储信息
     */
    getStorageInfo() {
        const size = this.getSize();
        const sizeInMB = (size / (1024 * 1024)).toFixed(2);

        // 估算LocalStorage限制（通常是5MB）
        const estimatedLimit = 5 * 1024 * 1024; // 5MB
        const usagePercent = ((size / estimatedLimit) * 100).toFixed(2);

        return {
            size: size,
            sizeInMB: sizeInMB,
            estimatedLimit: estimatedLimit,
            usagePercent: usagePercent,
            keys: this.keys().length
        };
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}
