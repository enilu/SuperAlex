/**
 * 三国演义H5问答游戏 - 进度管理模块
 * 支持解锁关卡、保存成绩、读取进度等功能
 */

const ProgressManager = {
    // 当前进度数据
    currentProgress: null,

    /**
     * 初始化进度管理器
     */
    init() {
        this.currentProgress = CacheManager.loadProgress();
    },

    /**
     * 获取当前进度
     * @returns {Object} 进度数据
     */
    getProgress() {
        if (!this.currentProgress) {
            this.currentProgress = CacheManager.loadProgress();
        }
        return this.currentProgress;
    },

    /**
     * 保存当前进度
     * @returns {boolean} 是否保存成功
     */
    saveProgress() {
        if (!this.currentProgress) {
            return false;
        }

        this.currentProgress.lastPlayTime = new Date().toISOString();
        return CacheManager.saveProgress(this.currentProgress);
    },

    /**
     * 检查关卡是否已解锁
     * @param {number} level - 关卡号
     * @returns {boolean} 是否已解锁
     */
    isLevelUnlocked(level) {
        const progress = this.getProgress();
        return progress.unlockedLevels.includes(level);
    },

    /**
     * 解锁关卡
     * @param {number} level - 关卡号
     * @returns {boolean} 是否解锁成功
     */
    unlockLevel(level) {
        const progress = this.getProgress();

        if (progress.unlockedLevels.includes(level)) {
            return true; // 已解锁
        }

        progress.unlockedLevels.push(level);
        progress.unlockedLevels.sort((a, b) => a - b);

        return this.saveProgress();
    },

    /**
     * 解锁下一关
     * @param {number} currentLevel - 当前关卡号
     * @returns {boolean} 是否解锁成功
     */
    unlockNextLevel(currentLevel) {
        const nextLevel = currentLevel + 1;
        if (nextLevel > GameConfig.RULES.totalLevels) {
            return true; // 已是最后一关
        }
        return this.unlockLevel(nextLevel);
    },

    /**
     * 保存关卡成绩
     * @param {number} level - 关卡号
     * @param {number} score - 得分
     * @param {number} stars - 星级（1-3）
     * @param {number} correctCount - 答对题数
     * @param {number} wrongCount - 答错题数
     * @returns {boolean} 是否保存成功
     */
    saveLevelScore(level, score, stars, correctCount, wrongCount) {
        const progress = this.getProgress();

        // 检查是否需要更新成绩（只保留最高分）
        const currentScore = progress.levelScores[level];
        const shouldUpdate = !currentScore || score > currentScore.score ||
                             (score === currentScore.score && stars > currentScore.stars);

        if (shouldUpdate) {
            progress.levelScores[level] = {
                score: score,
                stars: stars,
                correctCount: correctCount,
                wrongCount: wrongCount,
                timestamp: new Date().toISOString()
            };
        }

        // 更新总统计
        progress.totalCorrect += correctCount;
        progress.totalWrong += wrongCount;
        progress.totalPlayCount += 1;

        return this.saveProgress();
    },

    /**
     * 获取关卡成绩
     * @param {number} level - 关卡号
     * @returns {Object|null} 成绩数据
     */
    getLevelScore(level) {
        const progress = this.getProgress();
        return progress.levelScores[level] || null;
    },

    /**
     * 获取关卡星级
     * @param {number} level - 关卡号
     * @returns {number} 星级（0-3）
     */
    getLevelStars(level) {
        const score = this.getLevelScore(level);
        return score ? score.stars : 0;
    },

    /**
     * 计算星级
     * @param {number} correctCount - 答对题数
     * @param {number} totalQuestions - 总题数
     * @returns {number} 星级（1-3）
     */
    calculateStars(correctCount, totalQuestions) {
        const accuracy = correctCount / totalQuestions;

        if (accuracy >= 0.8) {
            return 3; // 80%以上 = 3星
        } else if (accuracy >= 0.6) {
            return 2; // 60%以上 = 2星
        } else {
            return 1; // 60%以下 = 1星
        }
    },

    /**
     * 检查是否已通关所有关卡
     * @returns {boolean} 是否已通关
     */
    isAllLevelsCompleted() {
        const progress = this.getProgress();

        for (let i = 1; i <= GameConfig.RULES.totalLevels; i++) {
            if (!progress.levelScores[i]) {
                return false;
            }
        }

        return true;
    },

    /**
     * 获取总答题数
     * @returns {number} 总答题数
     */
    getTotalAnswered() {
        const progress = this.getProgress();
        return progress.totalCorrect + progress.totalWrong;
    },

    /**
     * 获取正确率
     * @returns {number} 正确率（0-1）
     */
    getAccuracy() {
        const progress = this.getProgress();
        const total = this.getTotalAnswered();

        if (total === 0) {
            return 0;
        }

        return progress.totalCorrect / total;
    },

    /**
     * 获取总得分
     * @returns {number} 总得分
     */
    getTotalScore() {
        const progress = this.getProgress();
        let totalScore = 0;

        for (let level in progress.levelScores) {
            totalScore += progress.levelScores[level].score;
        }

        return totalScore;
    },

    /**
     * 获取总星级
     * @returns {number} 总星级
     */
    getTotalStars() {
        const progress = this.getProgress();
        let totalStars = 0;

        for (let level in progress.levelScores) {
            totalStars += progress.levelScores[level].stars;
        }

        return totalStars;
    },

    /**
     * 获取成就列表
     * @returns {Array} 已获得的成就
     */
    getAchievements() {
        const progress = this.getProgress();
        return progress.achievements || [];
    },

    /**
     * 解锁成就
     * @param {string} achievementId - 成就ID
     * @returns {boolean} 是否解锁成功
     */
    unlockAchievement(achievementId) {
        const progress = this.getProgress();

        if (progress.achievements.includes(achievementId)) {
            return true; // 已解锁
        }

        progress.achievements.push(achievementId);
        return this.saveProgress();
    },

    /**
     * 检查成就是否已解锁
     * @param {string} achievementId - 成就ID
     * @returns {boolean} 是否已解锁
     */
    hasAchievement(achievementId) {
        const progress = this.getProgress();
        return progress.achievements.includes(achievementId);
    },

    /**
     * 重置进度
     * @returns {boolean} 是否重置成功
     */
    resetProgress() {
        this.currentProgress = CacheManager.getDefaultProgress();
        return CacheManager.saveProgress(this.currentProgress);
    },

    /**
     * 导出进度数据
     * @returns {string} JSON字符串
     */
    exportProgress() {
        const progress = this.getProgress();
        return JSON.stringify(progress, null, 2);
    },

    /**
     * 导入进度数据
     * @param {string} jsonData - JSON字符串
     * @returns {boolean} 是否导入成功
     */
    importProgress(jsonData) {
        try {
            const progress = JSON.parse(jsonData);

            // 验证数据格式
            if (!progress.unlockedLevels || !Array.isArray(progress.unlockedLevels)) {
                throw new Error('Invalid progress data');
            }

            this.currentProgress = progress;
            return this.saveProgress();
        } catch (error) {
            console.error('ProgressManager.importProgress error:', error);
            return false;
        }
    },

    /**
     * 获取进度摘要
     * @returns {Object} 进度摘要
     */
    getSummary() {
        const progress = this.getProgress();

        return {
            unlockedLevels: progress.unlockedLevels.length,
            totalLevels: GameConfig.RULES.totalLevels,
            completedLevels: Object.keys(progress.levelScores).length,
            totalScore: this.getTotalScore(),
            totalStars: this.getTotalStars(),
            totalCorrect: progress.totalCorrect,
            totalWrong: progress.totalWrong,
            totalPlayCount: progress.totalPlayCount,
            accuracy: this.getAccuracy(),
            isAllCompleted: this.isAllLevelsCompleted()
        };
    },

    /**
     * 获取下一个未解锁的关卡
     * @returns {number|null} 关卡号或null（全部已解锁）
     */
    getNextLockedLevel() {
        for (let i = 1; i <= GameConfig.RULES.totalLevels; i++) {
            if (!this.isLevelUnlocked(i)) {
                return i;
            }
        }
        return null; // 全部已解锁
    },

    /**
     * 获取下一个未通关的关卡
     * @returns {number|null} 关卡号或null（全部已通关）
     */
    getNextIncompleteLevel() {
        for (let i = 1; i <= GameConfig.RULES.totalLevels; i++) {
            if (!this.getLevelScore(i)) {
                return i;
            }
        }
        return null; // 全部已通关
    },

    /**
     * 更新关卡进度（游戏中实时更新）
     * @param {number} level - 关卡号
     * @param {Object} gameData - 游戏数据
     * @returns {boolean} 是否更新成功
     */
    updateGameProgress(level, gameData) {
        // 这个方法用于游戏中实时保存状态
        // 例如：答对/答错统计
        const progress = this.getProgress();

        // 临时存储当前游戏状态
        progress.currentGame = {
            level: level,
            score: gameData.score,
            currentQuestion: gameData.currentQuestion,
            correctCount: gameData.correctCount,
            wrongCount: gameData.wrongCount,
            hasRevived: gameData.hasRevived
        };

        return this.saveProgress();
    },

    /**
     * 清除当前游戏状态
     * @returns {boolean} 是否清除成功
     */
    clearCurrentGame() {
        const progress = this.getProgress();
        delete progress.currentGame;
        return this.saveProgress();
    },

    /**
     * 获取当前游戏状态
     * @returns {Object|null} 游戏状态
     */
    getCurrentGame() {
        const progress = this.getProgress();
        return progress.currentGame || null;
    },

    /**
     * 检查是否有进行中的游戏
     * @returns {boolean} 是否有进行中的游戏
     */
    hasCurrentGame() {
        return this.getCurrentGame() !== null;
    },

    /**
     * 恢复游戏
     * @returns {Object|null} 游戏状态
     */
    resumeGame() {
        const gameData = this.getCurrentGame();

        if (gameData) {
            this.clearCurrentGame();
        }

        return gameData;
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressManager;
}
