// 晨光冲锋队 - 成就系统模块

import { storageManager } from './storageManager.js';

/**
 * 成就类型枚举
 */
const AchievementType = {
    STREAK_DAYS: 'streak_days',          // 连续完成天数
    FLASH_COMPLETIONS: 'flash_completions', // 闪电完成次数
    PERFECT_DAY: 'perfect_day',          // 完美一天（所有任务提前完成）
    FIRST_COMPLETION: 'first_completion',  // 首次完成任务
    ALL_TASKS_COMPLETE: 'all_tasks_complete', // 完成所有任务
    WEEKLY_CHALLENGE: 'weekly_challenge'   // 周挑战完成
};

/**
 * 成就定义
 */
const ACHIEVEMENTS = {
    // 首次成就
    FIRST_STEP: {
        id: 'first_step',
        type: AchievementType.FIRST_COMPLETION,
        title: '初露锋芒',
        description: '完成第一个晨间任务',
        icon: '🌟',
        requirement: 1,
        unlocked: false
    },
    // 连续完成成就
    STREAK_3_DAYS: {
        id: 'streak_3_days',
        type: AchievementType.STREAK_DAYS,
        title: '坚持小能手',
        description: '连续3天完成所有任务',
        icon: '🏆',
        requirement: 3,
        unlocked: false
    },
    STREAK_7_DAYS: {
        id: 'streak_7_days',
        type: AchievementType.STREAK_DAYS,
        title: '晨间达人',
        description: '连续7天完成所有任务',
        icon: '💎',
        requirement: 7,
        unlocked: false
    },
    STREAK_14_DAYS: {
        id: 'streak_14_days',
        type: AchievementType.STREAK_DAYS,
        title: '毅力大师',
        description: '连续14天完成所有任务',
        icon: '👑',
        requirement: 14,
        unlocked: false
    },
    // 闪电完成成就
    FLASH_5_TIMES: {
        id: 'flash_5_times',
        type: AchievementType.FLASH_COMPLETIONS,
        title: '速度小先锋',
        description: '提前完成5次任务',
        icon: '⚡',
        requirement: 5,
        unlocked: false
    },
    FLASH_10_TIMES: {
        id: 'flash_10_times',
        type: AchievementType.FLASH_COMPLETIONS,
        title: '光速战士',
        description: '提前完成10次任务',
        icon: '💨',
        requirement: 10,
        unlocked: false
    },
    FLASH_21_TIMES: {
        id: 'flash_21_times',
        type: AchievementType.FLASH_COMPLETIONS,
        title: '时间管理大师',
        description: '提前完成21次任务',
        icon: '⏱️',
        requirement: 21,
        unlocked: false
    },
    // 完美一天成就
    PERFECT_DAY_1: {
        id: 'perfect_day_1',
        type: AchievementType.PERFECT_DAY,
        title: '完美的一天',
        description: '一天内所有任务都提前完成',
        icon: '🌈',
        requirement: 1,
        unlocked: false
    },
    PERFECT_DAY_3: {
        id: 'perfect_day_3',
        type: AchievementType.PERFECT_DAY,
        title: '完美生活家',
        description: '累计3天所有任务都提前完成',
        icon: '🌞',
        requirement: 3,
        unlocked: false
    },
    // 完成所有任务成就
    ALL_TASKS_5_TIMES: {
        id: 'all_tasks_5_times',
        type: AchievementType.ALL_TASKS_COMPLETE,
        title: '坚持不懈',
        description: '累计5次完成所有晨间任务',
        icon: '🎯',
        requirement: 5,
        unlocked: false
    },
    ALL_TASKS_20_TIMES: {
        id: 'all_tasks_20_times',
        type: AchievementType.ALL_TASKS_COMPLETE,
        title: '习惯养成',
        description: '累计20次完成所有晨间任务',
        icon: '🎖️',
        requirement: 20,
        unlocked: false
    },
    // 周挑战成就
    WEEKLY_CHALLENGE_5_DAYS: {
        id: 'weekly_challenge_5_days',
        type: AchievementType.WEEKLY_CHALLENGE,
        title: '一周小冠军',
        description: '一周内完成5天的所有任务',
        icon: '🏅',
        requirement: 5,
        unlocked: false
    }
};

/**
 * 成就系统类
 */
class AchievementSystem {
    constructor() {
        this.achievements = { ...ACHIEVEMENTS };
        this.unlockCallbacks = [];
        this.loadAchievements();
    }

    /**
     * 加载成就数据
     */
    loadAchievements() {
        try {
            const gameData = storageManager.getGameData();
            const unlockedAchievements = gameData.unlockedAchievements || {};
            
            // 更新成就解锁状态
            Object.keys(this.achievements).forEach(key => {
                if (unlockedAchievements[key]) {
                    this.achievements[key].unlocked = true;
                }
            });
        } catch (error) {
            console.error('加载成就数据失败:', error);
        }
    }

    /**
     * 保存成就数据
     */
    saveAchievements() {
        try {
            const gameData = storageManager.getGameData();
            const unlockedAchievements = {};
            
            Object.keys(this.achievements).forEach(key => {
                if (this.achievements[key].unlocked) {
                    unlockedAchievements[key] = true;
                }
            });
            
            gameData.unlockedAchievements = unlockedAchievements;
            storageManager.saveGameData(gameData);
        } catch (error) {
            console.error('保存成就数据失败:', error);
        }
    }

    /**
     * 检查并解锁成就
     * @param {AchievementType} type 成就类型
     * @param {number} value 当前值
     * @returns {Array} 新解锁的成就列表
     */
    checkAndUnlockAchievements(type, value) {
        const newlyUnlocked = [];
        
        Object.keys(this.achievements).forEach(key => {
            const achievement = this.achievements[key];
            
            if (!achievement.unlocked && achievement.type === type && value >= achievement.requirement) {
                achievement.unlocked = true;
                newlyUnlocked.push(achievement);
                
                // 触发解锁回调
                this.notifyAchievementUnlocked(achievement);
            }
        });
        
        if (newlyUnlocked.length > 0) {
            this.saveAchievements();
        }
        
        return newlyUnlocked;
    }

    /**
     * 检查完美一天成就
     * @param {Array} taskStatuses 今天的任务状态数组
     */
    checkPerfectDay(taskStatuses) {
        // 检查是否所有任务都是提前完成
        const allEarly = taskStatuses.every(status => status === 'early');
        
        if (allEarly && taskStatuses.length > 0) {
            // 获取完美天数统计
            const gameData = storageManager.getGameData();
            const perfectDays = (gameData.perfectDays || 0) + 1;
            gameData.perfectDays = perfectDays;
            storageManager.saveGameData(gameData);
            
            // 检查完美天成就
            this.checkAndUnlockAchievements(AchievementType.PERFECT_DAY, perfectDays);
        }
    }

    /**
     * 注册成就解锁回调
     * @param {Function} callback 回调函数
     */
    onAchievementUnlocked(callback) {
        this.unlockCallbacks.push(callback);
    }

    /**
     * 通知成就解锁
     * @private
     */
    notifyAchievementUnlocked(achievement) {
        this.unlockCallbacks.forEach(callback => {
            try {
                callback(achievement);
            } catch (error) {
                console.error('成就解锁回调失败:', error);
            }
        });
    }

    /**
     * 获取所有已解锁的成就
     * @returns {Array} 已解锁成就列表
     */
    getUnlockedAchievements() {
        return Object.values(this.achievements)
            .filter(achievement => achievement.unlocked);
    }

    /**
     * 获取所有成就
     * @returns {Object} 所有成就
     */
    getAllAchievements() {
        return { ...this.achievements };
    }

    /**
     * 显示成就解锁动画
     * @param {Object} achievement 成就对象
     */
    showAchievementNotification(achievement) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">🏆 ${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 添加动画类
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 自动移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }

    /**
     * 重置所有成就（用于调试）
     */
    resetAllAchievements() {
        Object.keys(this.achievements).forEach(key => {
            this.achievements[key].unlocked = false;
        });
        this.saveAchievements();
    }
}

// 创建单例实例
const achievementSystem = new AchievementSystem();

// 导出模块
export {
    achievementSystem,
    AchievementSystem,
    AchievementType
};