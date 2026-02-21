import { CONFIG } from './config.js';
import { PoemManager } from './poemManager.js';
import { UIManager } from './uiManager.js';
import { CacheManager, CacheType } from './cacheManager.js';

const ProgressManager = {
    progress: {},
    achievements: [],
    stats: {},
    reviewHistory: {},

    init() {
        this.loadData();
    },

    loadData() {
        // 使用CacheManager读取进度数据
        this.progress = CacheManager.get(CacheType.PROGRESS) || {};
        this.achievements = CacheManager.get(CacheType.ACHIEVEMENTS) || [];
        this.stats = CacheManager.get(CacheType.STATS) || {
            totalAnswered: 0,
            totalCorrect: 0,
            totalWrong: 0,
            playCount: 0
        };
        this.reviewHistory = CacheManager.get(CacheType.REVIEW_HISTORY) || {};
    },

    saveData() {
        // 使用CacheManager保存进度数据
        CacheManager.set(CacheType.PROGRESS, this.progress);
        CacheManager.set(CacheType.ACHIEVEMENTS, this.achievements);
        CacheManager.set(CacheType.STATS, this.stats);
        CacheManager.set(CacheType.REVIEW_HISTORY, this.reviewHistory);
    },

    /**
     * 根据艾宾浩斯遗忘曲线算法计算下次复习时间
     * @param {string} poemId 诗歌ID
     * @param {number} correctRate 答对率 (0-100)
     * @returns {Date} 下次复习时间
     */
    calculateNextReviewTime(poemId, correctRate) {
        const reviewHistory = this.getOrCreateReviewHistory(poemId);
        const intervals = CONFIG.REVIEW_CONFIG.INTERVALS; // 以分钟为单位的间隔数组

        // 根据答对率决定是否提升阶段
        let newStage = reviewHistory.reviewStage;

        if (correctRate >= CONFIG.REVIEW_CONFIG.ADJUSTMENT_RULES.PROMOTE_THRESHOLD) {
            // 答对率达到提升阈值，进入下一阶段
            newStage = Math.min(newStage + 1, intervals.length - 1);
        } else if (correctRate < CONFIG.REVIEW_CONFIG.ADJUSTMENT_RULES.DEMOTE_THRESHOLD) {
            // 答对率未达标，回到上一阶段
            newStage = Math.max(newStage - 1, 0);
        }
        // 否则保持当前阶段

        // 根据当前阶段确定复习间隔
        let intervalMinutes = intervals[newStage];

        // 根据答对率调整间隔长度
        if (correctRate < CONFIG.REVIEW_CONFIG.ADJUSTMENT_RULES.DEMOTE_THRESHOLD) {
            // 如果答对率较低，缩短下次复习间隔
            intervalMinutes *= (1 - CONFIG.REVIEW_CONFIG.ADJUSTMENT_RULES.INTERVAL_ADJUSTMENT);
        } else if (correctRate >= CONFIG.REVIEW_CONFIG.ADJUSTMENT_RULES.PROMOTE_THRESHOLD) {
            // 如果答对率较高，保持或略微调整间隔
            // 这里我们保持标准间隔
        } else {
            // 中等答对率，稍微延长间隔
            intervalMinutes *= (1 + CONFIG.REVIEW_CONFIG.ADJUSTMENT_RULES.INTERVAL_ADJUSTMENT / 2);
        }

        // 更新阶段
        reviewHistory.reviewStage = newStage;

        // 计算下次复习时间
        const nextReviewTime = new Date(Date.now() + intervalMinutes * 60000);
        reviewHistory.nextReviewTime = nextReviewTime.toISOString();

        // 更新记忆强度
        const oldStrength = reviewHistory.memoryStrength || 0;
        const strengthChange = this.calculateStrengthChange(correctRate, newStage, oldStrength);
        reviewHistory.memoryStrength = Math.max(0, Math.min(100, oldStrength + strengthChange));

        // 更新连续正确计数
        if (correctRate >= 80) {
            reviewHistory.consecutiveCorrect = (reviewHistory.consecutiveCorrect || 0) + 1;
        } else {
            reviewHistory.consecutiveCorrect = 0;
        }

        return nextReviewTime;
    },

    /**
     * 计算记忆强度变化
     * @param {number} correctRate 答对率
     * @param {number} stage 复习阶段
     * @param {number} currentStrength 当前记忆强度
     * @returns {number} 强度变化值
     */
    calculateStrengthChange(correctRate, stage, currentStrength) {
        const baseGain = CONFIG.REVIEW_CONFIG.MEMORY_STRENGTH.BASE_GAIN;

        // 答对率系数 (0.6-1.4)
        const perfFactor = 0.6 + (correctRate / 100) * 0.8;

        // 阶段系数
        const stageFactors = CONFIG.REVIEW_CONFIG.MEMORY_STRENGTH.STAGE_FACTORS;
        const stageFactor = stage < stageFactors.length ? stageFactors[stage] : stageFactors[stageFactors.length - 1];

        // 计算基础强度变化
        const strengthChange = baseGain * perfFactor * stageFactor;

        // 应用记忆衰减 (如果需要)
        // 这里简化处理，实际上应考虑距离上次复习的时间

        return strengthChange;
    },

    /**
     * 更新诗歌进度（带复习逻辑）
     * @param {string} poemId 诗歌ID
     * @param {string} action 'correct' 或 'wrong'
     * @param {number} correctRate 答对率 (可选，用于更精确的复习算法)
     */
    updateProgressWithReview(poemId, action, correctRate = null) {
        // 如果没有提供答对率，从现有进度计算
        if (correctRate === null) {
            const poemProgress = this.getPoemProgress(poemId);
            const totalAnswers = poemProgress.correctCount + poemProgress.wrongCount + 1; // 加1是因为这次答题
            const correctCount = action === 'correct' ? poemProgress.correctCount + 1 : poemProgress.correctCount;
            correctRate = (correctCount / totalAnswers) * 100;
        }

        // 调用原有更新逻辑
        this.updateProgress(poemId, action);

        // 更新复习历史记录
        const reviewHistory = this.getOrCreateReviewHistory(poemId);
        const strengthChange = action === 'correct' ? 20 : -10;

        // 记录复习历史
        this.recordReviewHistory(poemId, correctRate, strengthChange);

        // 计算并设置下次复习时间
        this.calculateNextReviewTime(poemId, correctRate);

        // 检查是否达到掌握标准
        if (reviewHistory.memoryStrength >= CONFIG.REVIEW_CONFIG.MEMORY_STRENGTH.MASTERY_THRESHOLD &&
            reviewHistory.reviewStage >= 5) {
            const poemProgress = this.progress[poemId];
            if (!poemProgress.learned) {
                poemProgress.learned = true;
                this.onPoemMastered(poemId);
            }
            // 设置长期维护模式（每3个月复习一次）
            if (reviewHistory.reviewStage < 8) { // 长期维持阶段
                reviewHistory.reviewStage = 8; // 假设第8阶段是长期维持
                const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60000); // 90天
                reviewHistory.nextReviewTime = threeMonthsLater.toISOString();
            }
        }

        this.saveData();
    },

    updateProgress(poemId, action) {
        if (!this.progress[poemId]) {
            this.progress[poemId] = {
                learned: false,
                lastReviewTime: new Date().toISOString(),
                mastery: 0,
                correctCount: 0,
                wrongCount: 0
            };
        }

        const poemProgress = this.progress[poemId];

        if (action === 'correct') {
            poemProgress.correctCount++;
            poemProgress.mastery = Math.min(100, poemProgress.mastery + 20);
            this.stats.totalAnswered++;
            this.stats.totalCorrect++;
        } else if (action === 'wrong') {
            poemProgress.wrongCount++;
            poemProgress.mastery = Math.max(0, poemProgress.mastery - 10);
            this.stats.totalAnswered++;
            this.stats.totalWrong++;
        }

        poemProgress.lastReviewTime = new Date().toISOString();

        // 更新复习历史
        const reviewHistory = this.getOrCreateReviewHistory(poemId);

        // 计算答对率
        const totalAnswers = poemProgress.correctCount + poemProgress.wrongCount;
        const correctRate = totalAnswers > 0 ? (poemProgress.correctCount / totalAnswers) * 100 : 0;

        // 计算强度变化值（这里暂时使用简单的算法，后续可扩展为完整算法）
        const strengthChange = action === 'correct' ? 20 : -10;

        // 记录复习历史
        this.recordReviewHistory(poemId, correctRate, strengthChange);

        if (poemProgress.mastery >= 100 && !poemProgress.learned) {
            poemProgress.learned = true;
            this.onPoemMastered(poemId);
        }

        this.saveData();
        this.checkAchievements();
    },

    onPoemMastered(poemId) {
        const poem = PoemManager.getPoemById(poemId);
        if (poem) {
            console.log('掌握唐诗：' + poem.title);
        }
    },

    checkAchievements() {
        const masteredCount = Object.values(this.progress).filter(p => p.learned).length;

        Object.values(CONFIG.ACHIEVEMENTS).forEach(achievement => {
            if (!this.achievements.includes(achievement.id)) {
                let unlocked = false;

                if (achievement.id === 'beginner' && masteredCount >= 1) unlocked = true;
                if (achievement.id === 'poet_learner' && masteredCount >= 5) unlocked = true;
                if (achievement.id === 'poet_master' && masteredCount >= 10) unlocked = true;
                if (achievement.id === 'poet_expert' && masteredCount >= 20) unlocked = true;

                if (unlocked) {
                    this.unlockAchievement(achievement.id);
                }
            }
        });
    },

    unlockAchievement(achievementId) {
        const achievement = CONFIG.ACHIEVEMENTS[achievementId];
        if (achievement && !this.achievements.includes(achievementId)) {
            this.achievements.push(achievementId);
            this.saveData();
            UIManager.showAchievement(achievement);
        }
    },

    checkAchievement(achievementId) {
        if (!this.achievements.includes(achievementId)) {
            this.unlockAchievement(achievementId);
        }
    },

    getReviewPoems() {
        const now = new Date();
        const reviewPoems = [];

        // 首先检查基于时间间隔和掌握度的复习诗歌
        Object.entries(this.progress).forEach(([poemId, poemProgress]) => {
            const poem = PoemManager.getPoemById(parseInt(poemId));
            if (!poem) return;

            // 获取或创建对应的复习历史记录
            const reviewHistory = this.getOrCreateReviewHistory(poemId);

            // 使用更精确的复习检查逻辑
            // 如果已有新的复习数据结构，优先使用；否则使用原有逻辑
            let needsReview = false;

            // 检查新的复习数据结构
            if (reviewHistory.nextReviewTime) {
                const nextReviewTime = new Date(reviewHistory.nextReviewTime);
                if (now >= nextReviewTime) {
                    needsReview = true;
                }
            } else {
                // 使用原有的检查方式作为后备
                const lastReviewTime = new Date(poemProgress.lastReviewTime);
                const daysDiff = (now - lastReviewTime) / (1000 * 60 * 60 * 24);

                // 使用配置的复习间隔和阈值
                const reviewInterval = 1; // 默认1天
                const masteryThreshold = CONFIG.REVIEW_CONFIG.MEMORY_STRENGTH.MASTERY_THRESHOLD || 80;

                if (daysDiff >= reviewInterval && poemProgress.mastery < masteryThreshold) {
                    needsReview = true;
                }
            }

            if (needsReview) {
                reviewPoems.push(poem);
            }
        });

        // 添加标记为待复习的诗歌
        const markedPoems = this.getMarkedPoemsForReview();
        markedPoems.forEach(poemId => {
            // 检查诗歌是否存在，且不在已加入的列表中
            const existingPoem = reviewPoems.find(p => p.id.toString() === poemId);
            if (!existingPoem) {
                const poem = PoemManager.getPoemById(parseInt(poemId));
                if (poem) {
                    reviewPoems.push(poem);
                }
            }
        });

        return reviewPoems;
    },

    updateReviewCount() {
        const reviewPoems = this.getReviewPoems();
        const countEl = document.getElementById('reviewCount');
        if (countEl) {
            countEl.textContent = reviewPoems.length;
        }

        const reviewCard = document.getElementById('reviewCard');
        const startReviewBtn = document.getElementById('startReview');

        if (reviewPoems.length === 0) {
            reviewCard.innerHTML = '<div class="empty-state"><span class="icon">🎉</span><p>太棒了！暂时没有需要复习的唐诗</p></div>';
            if (startReviewBtn) startReviewBtn.disabled = true;
        } else {
            reviewCard.innerHTML = '<h3>待复习唐诗</h3><div class="review-list">' +
                reviewPoems.map(poem =>
                    '<div class="review-item"><span class="review-title">' + poem.title + '</span>' +
                    '<span class="review-author">' + poem.author + '</span></div>'
                ).join('') + '</div>';
            if (startReviewBtn) startReviewBtn.disabled = false;
        }
    },

    getPoemProgress(poemId) {
        return this.progress[poemId] || {
            learned: false,
            lastReviewTime: new Date().toISOString(),
            mastery: 0,
            correctCount: 0,
            wrongCount: 0
        };
    },

    /**
     * 获取或创建复习历史记录
     * @param {string} poemId 诗歌ID
     * @returns {Object} 复习历史对象
     */
    getOrCreateReviewHistory(poemId) {
        if (!this.reviewHistory[poemId]) {
            this.reviewHistory[poemId] = {
                memoryStrength: 0,
                reviewStage: 0,
                nextReviewTime: new Date().toISOString(),
                totalReviews: 0,
                reviewHistory: [],
                masteryDate: null,
                easinessFactor: 2.5,
                consecutiveCorrect: 0
            };
        }
        return this.reviewHistory[poemId];
    },

    /**
     * 标记诗歌进行复习
     * @param {string|number} poemId 诗歌ID
     * @returns {boolean} 标记是否成功
     */
    markPoemForReview(poemId) {
        const markedPoems = CacheManager.get(CacheType.MARKED_FOR_REVIEW, []);
        if (!markedPoems.includes(poemId.toString())) {
            markedPoems.push(poemId.toString());
            CacheManager.set(CacheType.MARKED_FOR_REVIEW, markedPoems);

            // 如果是首次标记，添加一条通知
            console.log(`诗歌 ${poemId} 已标记为待复习`);
            return true;
        }
        return false;
    },

    /**
     * 取消标记诗歌进行复习
     * @param {string|number} poemId 诗歌ID
     * @returns {boolean} 取消标记是否成功
     */
    unmarkPoemForReview(poemId) {
        const markedPoems = CacheManager.get(CacheType.MARKED_FOR_REVIEW, []);
        const initialLength = markedPoems.length;

        const filteredPoems = markedPoems.filter(id => id !== poemId.toString());

        if (filteredPoems.length < initialLength) {
            CacheManager.set(CacheType.MARKED_FOR_REVIEW, filteredPoems);
            console.log(`诗歌 ${poemId} 已取消标记`);
            return true;
        }

        return false;
    },

    /**
     * 检查诗歌是否已标记为待复习
     * @param {string|number} poemId 诗歌ID
     * @returns {boolean} 是否已标记
     */
    isPoemMarkedForReview(poemId) {
        const markedPoems = CacheManager.get(CacheType.MARKED_FOR_REVIEW, []);
        return markedPoems.includes(poemId.toString());
    },

    /**
     * 获取所有标记为待复习的诗歌ID
     * @returns {Array} 诗歌ID数组
     */
    getMarkedPoemsForReview() {
        return CacheManager.get(CacheType.MARKED_FOR_REVIEW, []);
    },

    /**
     * 记录复习历史
     * @param {string} poemId 诗歌ID
     * @param {number} correctRate 答对率
     * @param {number} strengthChange 强度变化值
     */
    recordReviewHistory(poemId, correctRate, strengthChange) {
        const history = this.getOrCreateReviewHistory(poemId);

        // 更新复习历史记录
        history.reviewHistory.push({
            timestamp: new Date().toISOString(),
            stage: history.reviewStage,
            correctRate: correctRate,
            strengthChange: strengthChange
        });

        // 更新总计数
        history.totalReviews++;

        // 限制历史记录数量，只保留最近50条记录
        if (history.reviewHistory.length > 50) {
            history.reviewHistory = history.reviewHistory.slice(-50);
        }

        this.saveData();
    },

    getStats() {
        return {
            ...this.stats,
            learnedCount: Object.values(this.progress).filter(p => p.learned).length,
            achievementCount: this.achievements.length
        };
    }
};

export { ProgressManager };
