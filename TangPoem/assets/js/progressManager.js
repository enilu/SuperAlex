import { CONFIG } from './config.js';
import { PoemManager } from './poemManager.js';
import { UIManager } from './uiManager.js';

const ProgressManager = {
    progress: {},
    achievements: [],
    stats: {},

    init() {
        this.loadData();
    },

    loadData() {
        const savedProgress = localStorage.getItem(CONFIG.STORAGE_KEYS.PROGRESS);
        if (savedProgress) {
            this.progress = JSON.parse(savedProgress);
        }

        const savedAchievements = localStorage.getItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS);
        if (savedAchievements) {
            this.achievements = JSON.parse(savedAchievements);
        }

        const savedStats = localStorage.getItem(CONFIG.STORAGE_KEYS.STATS);
        if (savedStats) {
            this.stats = JSON.parse(savedStats);
        } else {
            this.stats = {
                totalAnswered: 0,
                totalCorrect: 0,
                totalWrong: 0,
                playCount: 0
            };
        }
    },

    saveData() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.PROGRESS, JSON.stringify(this.progress));
        localStorage.setItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.achievements));
        localStorage.setItem(CONFIG.STORAGE_KEYS.STATS, JSON.stringify(this.stats));
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

        Object.entries(this.progress).forEach(([poemId, poemProgress]) => {
            const poem = PoemManager.getPoemById(parseInt(poemId));
            if (!poem) return;

            const lastReviewTime = new Date(poemProgress.lastReviewTime);
            const daysDiff = (now - lastReviewTime) / (1000 * 60 * 60 * 24);

            if (daysDiff >= CONFIG.REVIEW_CONFIG.REVIEW_INTERVAL &&
                poemProgress.mastery < CONFIG.REVIEW_CONFIG.MASTERY_THRESHOLD) {
                reviewPoems.push(poem);
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

    getStats() {
        return {
            ...this.stats,
            learnedCount: Object.values(this.progress).filter(p => p.learned).length,
            achievementCount: this.achievements.length
        };
    }
};

export { ProgressManager };
