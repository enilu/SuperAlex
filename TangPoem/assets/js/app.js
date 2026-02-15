// ==================== 唐诗小当家 - 主程序入口 ====================
import { CONFIG } from './config.js';
import { PoemManager } from './poemManager.js';
import { GameManager } from './gameManager.js';
import { ProgressManager } from './progressManager.js';
import { AudioManager } from './audioManager.js';
import { UIManager } from './uiManager.js';

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
function init() {
    console.log(`${CONFIG.GAME_NAME} ${CONFIG.GAME_VERSION} 启动中...`);

    PoemManager.init();
    ProgressManager.init();
    AudioManager.init();
    bindEvents();
    ProgressManager.updateReviewCount();

    console.log('游戏初始化完成！');
}

// ==================== 页面加载完成后初始化 ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ==================== 导出全局状态和元素 ====================
export { AppState, elements, switchScreen };
