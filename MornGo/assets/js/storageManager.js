// 晨光冲锋队 - 本地存储管理模块

/**
 * 存储管理类，负责处理游戏数据的本地存储和读取
 */
class StorageManager {
    constructor() {
        this.storageKey = 'morningChargeTeamData';
        this.introKey = 'hasSeenIntro';
        this.todayKeyPrefix = 'completed_';
        this.weekDataKey = 'weekCompletionData';
        this.soundPackKey = 'preferredSoundPack';
        this.userTasksKey = 'userTasksConfig';
    }

    /**
     * 获取或初始化游戏数据
     * @returns {Object} 游戏数据对象
     */
    getGameData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
            return this._getDefaultGameData();
        } catch (error) {
            console.error('读取游戏数据失败:', error);
            return this._getDefaultGameData();
        }
    }

    /**
     * 保存游戏数据
     * @param {Object} gameData 游戏数据对象
     */
    saveGameData(gameData) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(gameData));
        } catch (error) {
            console.error('保存游戏数据失败:', error);
        }
    }

    /**
     * 记录任务完成情况
     * @param {number} taskIndex 任务索引
     * @param {string} status 完成状态
     */
    recordTaskCompletion(taskIndex, status) {
        const todayKey = this._getTodayKey();
        const todayData = this._getTodayData() || {};
        
        todayData[taskIndex] = {
            status,
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem(todayKey, JSON.stringify(todayData));
            this._updateWeekData(status);
        } catch (error) {
            console.error('记录任务完成失败:', error);
        }
    }

    /**
     * 获取今天的任务完成情况
     * @returns {Object} 今天的任务完成数据
     */
    getTodayCompletions() {
        return this._getTodayData() || {};
    }

    /**
     * 检查今天是否有任何任务被完成
     * @returns {boolean} 是否有任务完成
     */
    hasCompletedAnyTaskToday() {
        const todayData = this._getTodayData();
        return todayData && Object.keys(todayData).length > 0;
    }

    /**
     * 获取本周的完成统计数据
     * @returns {Object} 本周统计数据
     */
    getWeekStats() {
        try {
            const weekData = localStorage.getItem(this.weekDataKey);
            return weekData ? JSON.parse(weekData) : this._getDefaultWeekData();
        } catch (error) {
            console.error('读取周数据失败:', error);
            return this._getDefaultWeekData();
        }
    }

    /**
     * 重置本周数据
     */
    resetWeekData() {
        try {
            localStorage.setItem(this.weekDataKey, JSON.stringify(this._getDefaultWeekData()));
            // 清除所有今天的任务记录
            const todayKey = this._getTodayKey();
            localStorage.removeItem(todayKey);
        } catch (error) {
            console.error('重置周数据失败:', error);
        }
    }

    /**
     * 检查并更新连续完成天数
     * @returns {number} 当前连续天数
     */
    updateStreakDays() {
        const gameData = this.getGameData();
        const lastCompleteDate = gameData.lastCompleteDate;
        const today = new Date().toDateString();
        
        // 如果今天已经记录过完成，不更新
        if (lastCompleteDate === today) {
            return gameData.streakDays;
        }
        
        // 检查是否是连续的一天
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (lastCompleteDate === yesterdayStr) {
            // 连续完成，增加计数
            gameData.streakDays++;
        } else if (!lastCompleteDate) {
            // 第一次完成
            gameData.streakDays = 1;
        } else {
            // 中断了连续，重置为1（今天完成）
            gameData.streakDays = 1;
        }
        
        gameData.lastCompleteDate = today;
        this.saveGameData(gameData);
        
        return gameData.streakDays;
    }

    /**
     * 标记用户已看过介绍
     */
    markIntroAsSeen() {
        try {
            localStorage.setItem(this.introKey, 'true');
        } catch (error) {
            console.error('标记介绍已读失败:', error);
        }
    }
    
    /**
     * 保存用户偏好的音效包
     * @param {string} packName 音效包名称
     */
    saveSoundPackPreference(packName) {
        try {
            localStorage.setItem(this.soundPackKey, packName);
        } catch (error) {
            console.error('保存音效包偏好失败:', error);
        }
    }
    
    /**
     * 获取用户偏好的音效包
     * @returns {string|null} 音效包名称，如果没有设置则返回null
     */
    getSoundPackPreference() {
        try {
            return localStorage.getItem(this.soundPackKey);
        } catch (error) {
            console.error('获取音效包偏好失败:', error);
            return null;
        }
    }
    
    /**
     * 保存用户任务配置
     * @param {Array} tasks 任务配置数组
     */
    saveUserTasksConfig(tasks) {
        try {
            localStorage.setItem(this.userTasksKey, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('保存用户任务配置失败:', error);
            return false;
        }
    }
    
    /**
     * 获取用户任务配置
     * @returns {Array|null} 用户任务配置数组，如果没有设置则返回null
     */
    getUserTasksConfig() {
        try {
            const tasks = localStorage.getItem(this.userTasksKey);
            return tasks ? JSON.parse(tasks) : null;
        } catch (error) {
            console.error('获取用户任务配置失败:', error);
            return null;
        }
    }
    
    /**
     * 检查是否存在用户自定义的任务配置
     * @returns {boolean} 是否存在用户任务配置
     */
    hasUserTasksConfig() {
        try {
            return localStorage.getItem(this.userTasksKey) !== null;
        } catch (error) {
            console.error('检查用户任务配置失败:', error);
            return false;
        }
    }

    /**
     * 检查用户是否已看过介绍
     * @returns {boolean} 是否已看过介绍
     */
    hasSeenIntro() {
        try {
            return localStorage.getItem(this.introKey) === 'true';
        } catch (error) {
            console.error('检查介绍状态失败:', error);
            return false;
        }
    }
    
    /**
     * 检查是否是首次访问
     * @returns {boolean} 是否是首次访问
     */
    isFirstVisit() {
        try {
            const gameData = this.getGameData();
            return gameData.firstVisit !== false; // 默认为true
        } catch (error) {
            console.error('检查首次访问状态失败:', error);
            return true;
        }
    }
    
    /**
     * 设置首次访问状态
     * @param {boolean} isFirst 是否是首次访问
     */
    setFirstVisit(isFirst = false) {
        try {
            const gameData = this.getGameData();
            gameData.firstVisit = isFirst;
            this.saveGameData(gameData);
        } catch (error) {
            console.error('设置首次访问状态失败:', error);
        }
    }

    /**
     * 获取默认游戏数据
     * @private
     */
    _getDefaultGameData() {
        return {
            streakDays: 0,
            lastCompleteDate: null,
            totalCompletions: 0,
            flashCompletions: 0,
            firstVisit: true // 默认为首次访问
        };
    }

    /**
     * 获取默认周数据
     * @private
     */
    _getDefaultWeekData() {
        return {
            totalTasks: 0,
            completedTasks: 0,
            earlyCompletions: 0,
            onTimeCompletions: 0,
            lateCompletions: 0,
            veryLateCompletions: 0,
            datesCompleted: []
        };
    }

    /**
     * 获取今天的存储键
     * @private
     */
    _getTodayKey() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');
        return `${this.todayKeyPrefix}${year}${month}${date}`;
    }

    /**
     * 获取今天的数据
     * @private
     */
    _getTodayData() {
        try {
            const todayKey = this._getTodayKey();
            const data = localStorage.getItem(todayKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('读取今日数据失败:', error);
            return null;
        }
    }

    /**
     * 重置本周数据
     */
    resetWeekData() {
        try {
            localStorage.removeItem(this.weekDataKey);
            return true;
        } catch (error) {
            console.error('重置周数据失败:', error);
            return false;
        }
    }

    /**
     * 重置今天数据
     */
    resetTodayData() {
        try {
            const todayKey = this._getTodayKey();
            localStorage.removeItem(todayKey);
            return true;
        } catch (error) {
            console.error('重置今天数据失败:', error);
            return false;
        }
    }

    /**
     * 更新周数据
     * @private
     */
    _updateWeekData(status) {
        const weekData = this.getWeekStats();
        weekData.totalTasks++;
        
        // 根据状态更新相应的计数
        switch (status) {
            case 'early':
                weekData.earlyCompletions++;
                weekData.completedTasks++;
                break;
            case 'on_time':
                weekData.onTimeCompletions++;
                weekData.completedTasks++;
                break;
            case 'late':
                weekData.lateCompletions++;
                weekData.completedTasks++;
                break;
            case 'very_late':
                weekData.veryLateCompletions++;
                weekData.completedTasks++;
                break;
        }
        
        // 添加今日日期到已完成日期列表（如果不存在）
        const today = new Date().toDateString();
        if (!weekData.datesCompleted.includes(today)) {
            weekData.datesCompleted.push(today);
        }
        
        try {
            localStorage.setItem(this.weekDataKey, JSON.stringify(weekData));
        } catch (error) {
            console.error('更新周数据失败:', error);
        }
    }
}

// 创建单例实例
const storageManager = new StorageManager();

// 导出模块
export {
    storageManager,
    StorageManager
};