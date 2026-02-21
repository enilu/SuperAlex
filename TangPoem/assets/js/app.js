// ==================== 唐诗小当家 - 主程序入口 ====================
import { CONFIG } from './config.js';
import { PoemManager } from './poemManager.js';
import { GameManager } from './gameManager.js';
import { ProgressManager } from './progressManager.js';
import { AudioManager } from './audioManager.js';
import { UIManager } from './uiManager.js';
import { CacheManager } from './cacheManager.js';

// ==================== 全局状态 ====================
const AppState = {
    currentScreen: 'start',
    currentMode: null,
    currentPoemIndex: 0,
    gameData: {
        score: 0,
        currentQuestion: 0,
        correctCount: 0,
        wrongCount: 0,
        questions: []
    }
};

// ==================== DOM 元素 ====================
const elements = {
    screens: {
        start: document.getElementById('startScreen'),
        recite: document.getElementById('reciteScreen'),
        game: document.getElementById('gameScreen'),
        review: document.getElementById('reviewScreen'),
        result: document.getElementById('resultScreen')
    },
    buttons: {
        modeBtns: document.querySelectorAll('.mode-btn'),
        backBtns: document.querySelectorAll('.back-btn'),
        settingsBtn: document.getElementById('settingsBtn'),
        playBtn: document.getElementById('playAudio'),
        prevBtn: document.getElementById('prevPoem'),
        nextBtn: document.getElementById('nextPoem'),
        markBtn: document.getElementById('markForReview'),
        restartBtn: document.getElementById('restartBtn'),
        startReviewBtn: document.getElementById('startReview')
    },
    displays: {
        score: document.getElementById('score'),
        progress: document.getElementById('progress'),
        reviewCount: document.getElementById('reviewCount')
    }
};

// ==================== 屏幕切换 ====================
function switchScreen(screenName) {
    Object.values(elements.screens).forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = elements.screens[screenName];
    if (targetScreen) {
        targetScreen.classList.add('active');
        AppState.currentScreen = screenName;
    }
}

// ==================== 事件绑定 ====================
function bindEvents() {
    elements.buttons.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            handleModeSelect(mode);
        });
    });

    elements.buttons.backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchScreen('start');
            AudioManager.playClick();
        });
    });

    elements.buttons.prevBtn?.addEventListener('click', () => {
        AudioManager.stopRecite();
        PoemManager.prevPoem();
    });

    elements.buttons.nextBtn?.addEventListener('click', () => {
        AudioManager.stopRecite();
        PoemManager.nextPoem();
    });

    elements.buttons.markBtn?.addEventListener('click', () => {
        const currentPoem = PoemManager.getCurrentPoem();
        if (currentPoem) {
            const wasMarked = ProgressManager.isPoemMarkedForReview(currentPoem.id);

            if (wasMarked) {
                // 如果已标记，则取消标记
                ProgressManager.unmarkPoemForReview(currentPoem.id);

                // 更新按钮状态
                const markBtn = document.getElementById('markForReview');
                if (markBtn) {
                    markBtn.classList.remove('marked');
                    markBtn.setAttribute('title', '标记这首诗用于复习');
                }

                UIManager.showNotification('已取消标记', 'info');
            } else {
                // 如果未标记，则进行标记
                ProgressManager.markPoemForReview(currentPoem.id);

                // 更新按钮状态
                const markBtn = document.getElementById('markForReview');
                if (markBtn) {
                    markBtn.classList.add('marked');
                    markBtn.setAttribute('title', '已标记，点击取消');
                }

                UIManager.showNotification('已标记此诗用于复习', 'success');
            }

            // 更新复习计数
            ProgressManager.updateReviewCount();
        }
    });

    elements.buttons.playBtn?.addEventListener('click', () => {
        AudioManager.playRecite(PoemManager.getCurrentPoem());
    });

    elements.buttons.restartBtn?.addEventListener('click', () => {
        switchScreen('start');
    });

    elements.buttons.startReviewBtn?.addEventListener('click', () => {
        GameManager.startReviewMode();
    });
}

// ==================== 模式选择处理 ====================
function handleModeSelect(mode) {
    AudioManager.playClick();
    AppState.currentMode = mode;

    switch(mode) {
        case 'recite':
            PoemManager.initReciteMode();
            switchScreen('recite');
            break;
        case 'game':
            GameManager.startGameMode();
            switchScreen('game');
            break;
        case 'review':
            ProgressManager.updateReviewCount();
            switchScreen('review');
            break;
    }
}

// ==================== 初始化 ====================
async function init() {
    console.log(`${CONFIG.GAME_NAME} ${CONFIG.GAME_VERSION} 启动中...`);

    // 初始化缓存管理器（必须在PoemManager之前）
    CacheManager.init();

    // 初始化设置模态框
    UIManager.initSettingsModal();

    // 绑定事件监听器
    bindEvents();

    await loadWithProgress(); // 加载诗词并显示进度

    console.log('游戏初始化完成！');
}

// ==================== 页面加载完成后初始化 ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ==================== 导出全局状态和元素 ====================
// ==================== 加载进度处理 ====================
async function loadWithProgress() {
    const loadingPercent = document.getElementById('loadingPercent');
    const loadingFill = document.getElementById('loadingFill');
    const loadingTip = document.getElementById('loadingTip');
    const loadingSubtitle = document.querySelector('.loading-subtitle');
    const loadingScreen = document.getElementById('loadingScreen');

    // 加载中的提示语
    const loadingTips = [
        '准备好开始唐诗之旅了吗？',
        '唐诗是中华文化的瑰宝...',
        '每一首诗都有一个故事...',
        '让诗词伴你快乐成长！',
        '正在为你准备精美的诗词...'
    ];

    let tipIndex = 0;
    let tipInterval = null;

    const updateTip = () => {
        if (loadingTip) {
            loadingTip.textContent = loadingTips[tipIndex];
            tipIndex = (tipIndex + 1) % loadingTips.length;
        }
    };

    updateTip();
    tipInterval = setInterval(updateTip, 3000);

    await PoemManager.init((current, total, isComplete) => {
        const percent = Math.round((current / total) * 100);

        // 更新进度百分比
        if (loadingPercent) loadingPercent.textContent = percent;
        if (loadingFill) loadingFill.style.width = percent + '%';

        // 更新加载状态提示
        if (loadingSubtitle) {
            loadingSubtitle.textContent = `正在加载诗词... (${current}/${total})`;
        }

        if (isComplete) {
            // 清除定时器
            if (tipInterval) {
                clearInterval(tipInterval);
            }

            // 显示加载完成提示
            if (loadingTip) {
                loadingTip.textContent = '🎉 加载完毕，可以开始啦！';
            }
            if (loadingSubtitle) {
                loadingSubtitle.textContent = `成功加载 ${total} 首诗词`;
            }

            // 更新复习数量
            ProgressManager.updateReviewCount();

            // 初始化闯关模式目录功能
            GameManager.initGameCatalog();

            // 延迟后切换到开始界面
            setTimeout(() => {
                switchScreen('start');
                console.log('游戏初始化完成！');
            }, 1500);
        }
    });
}


// ==================== 扩展功能 ====================

// 扩展PoemManager以更新标记按钮状态
const originalRenderCurrentPoem = PoemManager.renderCurrentPoem;
PoemManager.renderCurrentPoem = function() {
    // 调用原始函数
    originalRenderCurrentPoem.call(this);

    // 然后更新标记按钮状态
    setTimeout(() => {
        const currentPoem = this.getCurrentPoem();
        if (currentPoem) {
            const markBtn = document.getElementById('markForReview');
            if (markBtn) {
                const isMarked = ProgressManager.isPoemMarkedForReview(currentPoem.id);

                if (isMarked) {
                    markBtn.classList.add('marked');
                    markBtn.setAttribute('title', '已标记，点击取消');
                } else {
                    markBtn.classList.remove('marked');
                    markBtn.setAttribute('title', '标记这首诗用于复习');
                }
            }
        }
    }, 0); // 使用setTimeout来确保DOM已经更新
};


export { AppState, elements, switchScreen };
