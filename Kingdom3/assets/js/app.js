/**
 * 三国演义H5问答游戏 - 主程序入口
 * 包含屏幕切换、初始化、全局状态管理等功能
 */

// 全局应用状态
const AppState = {
    // 当前屏幕
    currentScreen: 'start',

    // 当前关卡
    currentLevel: 1,

    // 是否已初始化
    isInitialized: false,

    // 是否正在加载
    isLoading: false,

    // 应用版本
    version: GameConfig.GAME_VERSION
};

/**
 * 应用程序主类
 */
const App = {
    /**
     * 初始化应用
     */
    async init() {
        if (AppState.isInitialized) {
            return;
        }

        console.log(`${GameConfig.GAME_NAME} v${GameConfig.GAME_VERSION} 正在启动...`);

        try {
            // 显示加载状态
            this.showLoading();

            // 初始化各个模块
            await this.initModules();

            // 更新UI
            UIManager.updateLevelSelection();

            // 隐藏加载状态
            this.hideLoading();

            AppState.isInitialized = true;

            console.log('应用初始化完成');

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showError('应用初始化失败，请刷新页面重试');
        }
    },

    /**
     * 初始化各个模块
     */
    async initModules() {
        // 初始化UI管理器
        UIManager.init();

        // 初始化缓存管理器
        // CacheManager 已经是静态方法，不需要初始化

        // 初始化进度管理器
        ProgressManager.init();

        // 初始化音频管理器
        AudioManager.init();

        // 初始化题库管理器
        await QuestionManager.init();

        // 初始化游戏管理器
        GameManager.init();
    },

    /**
     * 启动应用
     */
    start() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        } else {
            this.init();
        }
    },

    /**
     * 显示加载状态
     */
    showLoading() {
        AppState.isLoading = true;
        UIManager.showLoading();
    },

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        AppState.isLoading = false;
        UIManager.hideLoading();
    },

    /**
     * 显示错误消息
     * @param {string} message - 错误消息
     */
    showError(message) {
        UIManager.hideLoading();
        UIManager.showToast(message, 'error');
    },

    /**
     * 切换屏幕
     * @param {string} screenName - 屏幕名称
     */
    switchScreen(screenName) {
        // 更新状态
        AppState.currentScreen = screenName;

        // 切换UI
        UIManager.switchScreen(screenName);

        // 根据屏幕执行特定逻辑
        switch (screenName) {
            case 'start':
                UIManager.updateLevelSelection();
                break;
            case 'game':
                // 游戏逻辑由GameManager处理
                break;
            case 'settings':
                UIManager.updateSettings();
                break;
            case 'questionManager':
                UIManager.loadQuestionsList();
                break;
        }
    },

    /**
     * 获取应用状态
     * @returns {Object} 应用状态
     */
    getState() {
        return {
            ...AppState,
            progress: ProgressManager.getSummary(),
            settings: CacheManager.loadSettings(),
            audio: AudioManager.getStatus()
        };
    },

    /**
     * 重启应用
     */
    restart() {
        // 重置状态
        AppState.currentScreen = 'start';
        AppState.currentLevel = 1;

        // 重新初始化
        this.init();
    },

    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // 页面隐藏时暂停音乐
            AudioManager.pauseBgm();
        } else {
            // 页面显示时恢复音乐
            AudioManager.resumeBgm();
        }
    },

    /**
     * 处理页面卸载
     */
    handleUnload() {
        // 停止所有音频
        AudioManager.stopAll();

        // 保存当前状态
        ProgressManager.saveProgress();
    },

    /**
     * 注册事件监听器
     */
    registerEventListeners() {
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // 页面卸载
        window.addEventListener('beforeunload', () => {
            this.handleUnload();
        });

        // 阻止默认的触摸行为（防止双击缩放等）
        document.addEventListener('touchend', (e) => {
            // 防止双击缩放
            const now = Date.now();
            if (now - (this.lastTouchEnd || 0) < 300) {
                e.preventDefault();
            }
            this.lastTouchEnd = now;
        }, { passive: false });
    }
};

/**
 * 全局屏幕切换函数（向后兼容）
 * @param {string} screenName - 屏幕名称
 */
function switchScreen(screenName) {
    App.switchScreen(screenName);
}

/**
 * 页面加载完成后启动应用
 */
// 启动应用
App.start();

// 注册事件监听器
App.registerEventListeners();

// 导出到全局作用域（如果需要在HTML中使用）
window.App = App;
window.GameManager = GameManager;
window.UIManager = UIManager;
window.ProgressManager = ProgressManager;
window.QuestionManager = QuestionManager;
window.AudioManager = AudioManager;
window.CacheManager = CacheManager;
window.GameConfig = GameConfig;

console.log('三国演义H5问答游戏已加载');
console.log('使用 window.App 访问应用实例');
console.log('使用 window.GameConfig 访问配置');
console.log('使用 window.GameManager 访问游戏管理器');
