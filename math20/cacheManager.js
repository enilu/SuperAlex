// ==================== 缓存管理器 ====================
const CacheManager = {
    CACHE_KEY: 'math20_answer_history',

    // 获取缓存数据
    getHistory() {
        const history = localStorage.getItem(this.CACHE_KEY);
        return history ? JSON.parse(history) : [];
    },

    // 保存缓存数据
    saveHistory(history) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(history));
    },

    // 添加新的答题记录
    addRecord(record) {
        const history = this.getHistory();

        // 添加时间戳
        record.timestamp = new Date().toISOString();

        // 将新记录添加到数组开头
        history.unshift(record);

        // 限制最大记录数（例如保留最近100条记录）
        if (history.length > 100) {
            history.splice(100);
        }

        this.saveHistory(history);
    },

    // 清空所有历史记录
    clearHistory() {
        localStorage.removeItem(this.CACHE_KEY);
    },

    // 导出历史记录
    exportHistory() {
        const history = this.getHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `math20_history_${new Date().toISOString().slice(0, 19)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },

    // 导入历史记录
    importHistory(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);
            if (Array.isArray(importedData)) {
                this.saveHistory(importedData);
                return { success: true, message: `成功导入 ${importedData.length} 条记录` };
            } else {
                return { success: false, message: '导入的数据格式不正确' };
            }
        } catch (error) {
            return { success: false, message: `解析JSON数据时出错: ${error.message}` };
        }
    },

    // 获取统计信息
    getStats() {
        const history = this.getHistory();
        if (history.length === 0) {
            return {
                totalSessions: 0,
                totalQuestions: 0,
                totalCorrect: 0,
                totalWrong: 0,
                avgScore: 0,
                bestScore: 0,
                worstScore: 0
            };
        }

        const totalSessions = history.length;
        const totalQuestions = history.reduce((sum, record) => sum + record.totalQuestions, 0);
        const totalCorrect = history.reduce((sum, record) => sum + record.correctCount, 0);
        const totalWrong = history.reduce((sum, record) => sum + record.wrongCount, 0);
        const scores = history.map(record => record.score);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const bestScore = Math.max(...scores);
        const worstScore = Math.min(...scores);

        return {
            totalSessions,
            totalQuestions,
            totalCorrect,
            totalWrong,
            avgScore: Math.round(avgScore * 100) / 100,
            bestScore,
            worstScore
        };
    }
};