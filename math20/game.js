// ==================== 游戏配置 ====================
const CONFIG = {
    TOTAL_QUESTIONS: 20,
    POINTS_PER_QUESTION: 5,
    ANSWER_DELAY: 1200,
    BUTTON_ENABLE_DELAY: 500,
    QUESTION_TIME_LIMIT: 15,  // 每题答题时间限制（秒）
    
    // 难度配置
    difficulties: {
        easy: { maxNumber: 20, name: '20以内', timeLimit: 15 },
        hard: { maxNumber: 100, name: '100以内', timeLimit: 20 }
    }
};

// 当前难度设置
let currentDifficulty = 'easy';

// ==================== 音效控制器 ====================
const SoundController = {
    sounds: {
        correct: null,
        wrong: null
    },

    // 初始化音效
    init() {
        this.sounds.correct = new Audio('sounds/good.mp3');
        this.sounds.wrong = new Audio('sounds/comeon.mp3');
    },

    // 播放答对音效
    playCorrect() {
        if (this.sounds.correct) {
            this.sounds.correct.currentTime = 0;
            this.sounds.correct.play().catch(err => {
                console.log('音效播放失败:', err);
            });
        }
    },

    // 播放答错音效
    playWrong() {
        if (this.sounds.wrong) {
            this.sounds.wrong.currentTime = 0;
            this.sounds.wrong.play().catch(err => {
                console.log('音效播放失败:', err);
            });
        }
    }
};

// ==================== 勋章系统 ====================
const BadgeSystem = {
    // 勋章定义
    badges: {
        perfect: { id: 'perfect', icon: '👑', name: '完美通关', description: '全部答对，太厉害了！', color: '#FFD700' },
        speed: { id: 'speed', icon: '⚡', name: '闪电快手', description: '总耗时少于3分钟', color: '#4ECDC4' },
        steady: { id: 'steady', icon: '🎯', name: '精准射手', description: '答对率超过85%', color: '#45B7D1' },
        firstStep: { id: 'firstStep', icon: '🎉', name: '初出茅庐', description: '首次完成游戏', color: '#3498DB' }
    },

    // 计算获得的勋章
    calculateBadges(resultData) {
        const earnedBadges = [];

        // 完美通关：全部答对
        if (resultData.wrongCount === 0) {
            earnedBadges.push(this.badges.perfect);
        }

        // 闪电快手：总耗时少于3分钟
        if (resultData.totalTime < 180) {
            earnedBadges.push(this.badges.speed);
        }

        // 精准射手：答对率超过85%
        const accuracy = resultData.correctCount / CONFIG.TOTAL_QUESTIONS;
        if (accuracy > 0.85) {
            earnedBadges.push(this.badges.steady);
        }

        // 初出茅庐：首次完成游戏（通过检查localStorage）
        const hasCompletedBefore = localStorage.getItem('math20_completed_before');
        if (!hasCompletedBefore) {
            earnedBadges.push(this.badges.firstStep);
            localStorage.setItem('math20_completed_before', 'true');
        }

        return earnedBadges;
    },

    // 渲染勋章到DOM
    renderBadges(badges, container) {
        if (!container) return;

        if (badges.length === 0) {
            container.innerHTML = '<p class="no-badges">本次没有获得勋章，继续努力！💪</p>';
            return;
        }

        container.innerHTML = badges.map(badge => `
            <div class="badge-item" style="--badge-color: ${badge.color}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-info">
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-description">${badge.description}</div>
                </div>
            </div>
        `).join('');
    }
};

// ==================== 倒计时控制器 ====================
const TimerController = {
    intervalId: null,
    remainingTime: 0,
    totalTime: 0,         // 总耗时（秒）
    questionStartTime: null, // 当前题目开始时间

    // 开始计时
    start() {
        this.remainingTime = CONFIG.QUESTION_TIME_LIMIT;
        this.questionStartTime = Date.now();
        this.updateDisplay();

        // 清除之前的计时器
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // 启动新的计时器
        this.intervalId = setInterval(() => {
            this.remainingTime--;
            this.updateDisplay();

            if (this.remainingTime <= 0) {
                this.stop();
                GameController.handleTimeout();
            }
        }, 1000);
    },

    // 停止计时
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // 累加本题耗时到总耗时（至少1秒）
        if (this.questionStartTime) {
            const elapsed = Math.max(1, Math.ceil((Date.now() - this.questionStartTime) / 1000));
            this.totalTime += elapsed;
            this.questionStartTime = null;
            this.updateTotalTimeDisplay();
        }
    },

    // 更新显示
    updateDisplay() {
        elements.game.timer.textContent = this.remainingTime;

        // 最后5秒显示为红色
        if (this.remainingTime <= 5) {
            elements.game.timerDisplay.classList.add('urgent');
        } else {
            elements.game.timerDisplay.classList.remove('urgent');
        }
    },

    // 更新总耗时显示
    updateTotalTimeDisplay() {
        const minutes = Math.floor(this.totalTime / 60);
        const seconds = this.totalTime % 60;
        elements.game.totalTime.textContent = `${minutes}分${seconds}秒`;
    }
};

// ==================== 游戏状态 ====================
let gameState = {
    answerMode: null,     // 'choice' 或 'input'
    mathMode: null,        // 'addition', 'subtraction', 'mixed'
    difficulty: 'easy',    // 'easy' 20以内, 'hard' 100以内
    questions: [],         // 题目列表
    currentIndex: 0,       // 当前题目索引
    score: 0,              // 分数
    correctCount: 0,       // 答对数量
    wrongCount: 0,         // 答错数量
    canAnswer: false,       // 是否可以答题
    currentInput: '',       // 填写模式的当前输入
    timerInterval: null     // 倒计时器ID
};

// ==================== DOM 元素 ====================
const elements = {
    screens: {
        start: document.getElementById('startScreen'),
        mathMode: document.getElementById('mathModeScreen'),
        game: document.getElementById('gameScreen'),
        result: document.getElementById('resultScreen')
    },
    start: {
        answerModeBtns: document.querySelectorAll('.answer-mode-btn'),
        difficultyBtns: document.querySelectorAll('.difficulty-btn')
    },
    mathMode: {
        modeBtns: document.querySelectorAll('.mode-btn'),
        backBtn: document.getElementById('backToStartBtn')
    },
    game: {
        header: document.querySelector('.game-header'),
        score: document.getElementById('score'),
        timer: document.getElementById('timer'),
        timerDisplay: document.querySelector('.timer-display'),
        totalTime: document.getElementById('totalTime'),
        progress: document.getElementById('progress'),
        questionArea: document.getElementById('questionArea'),
        questionBlock: document.getElementById('questionBlock'),
        questionText: document.getElementById('questionText'),
        answerOptions: document.getElementById('answerOptions'),
        inputModeArea: document.getElementById('inputModeArea'),
        inputValue: document.getElementById('inputValue'),
        numberKeypad: document.getElementById('numberKeypad'),
        feedbackArea: document.getElementById('feedbackArea'),
        feedbackContent: document.getElementById('feedbackContent')
    },
    result: {
        finalScore: document.getElementById('finalScore'),
        resultStars: document.getElementById('resultStars'),
        resultRank: document.getElementById('resultRank'),
        resultMessage: document.getElementById('resultMessage'),
        correctCount: document.getElementById('correctCount'),
        wrongCount: document.getElementById('wrongCount'),
        resultTotalTime: document.getElementById('resultTotalTime'),
        badgesContainer: document.getElementById('badgesContainer'),
        restartBtn: document.getElementById('restartBtn')
    }
};

// ==================== 题目生成器 ====================
const QuestionGenerator = {
    // 获取当前难度的最大数字
    getMaxNumber() {
        return CONFIG.difficulties[currentDifficulty].maxNumber;
    },

    // 生成加法题目
    generateAddition() {
        const maxNum = this.getMaxNumber();
        const halfMax = Math.floor(maxNum / 2);
        const num1 = Math.floor(Math.random() * (halfMax + 1));
        const num2 = Math.floor(Math.random() * (halfMax + 1));
        return {
            num1,
            num2,
            num3: null,
            operator1: '+',
            operator2: null,
            answer: num1 + num2
        };
    },

    // 生成减法题目 (确保结果非负)
    generateSubtraction() {
        const maxNum = this.getMaxNumber();
        const num1 = Math.floor(Math.random() * (maxNum + 1));
        const num2 = Math.floor(Math.random() * (num1 + 1));
        return {
            num1,
            num2,
            num3: null,
            operator1: '-',
            operator2: null,
            answer: num1 - num2
        };
    },

    // 生成三则加法题目
    generateTripleAddition() {
        const maxNum = this.getMaxNumber();
        const thirdMax = Math.floor(maxNum / 3);
        const num1 = Math.floor(Math.random() * (thirdMax + 1));
        const num2 = Math.floor(Math.random() * (thirdMax + 1));
        const num3 = Math.floor(Math.random() * (thirdMax + 1));

        return {
            num1,
            num2,
            num3,
            operator1: '+',
            operator2: '+',
            answer: num1 + num2 + num3
        };
    },

    // 生成三则减法题目 (确保结果非负)
    generateTripleSubtraction() {
        const maxNum = this.getMaxNumber();
        const num1 = Math.floor(Math.random() * maxNum) + Math.floor(maxNum / 4);
        const num2 = Math.floor(Math.random() * (Math.floor(num1 / 2) + 1));
        const num3 = Math.floor(Math.random() * (Math.floor((num1 - num2) / 2) + 1));

        return {
            num1,
            num2,
            num3,
            operator1: '-',
            operator2: '-',
            answer: num1 - num2 - num3
        };
    },

    // 生成三则混合题目 (加法后减法，确保结果非负)
    generateTripleMixed() {
        const maxNum = this.getMaxNumber();
        const num1 = Math.floor(Math.random() * Math.floor(maxNum * 0.7)) + 1;
        const num2 = Math.floor(Math.random() * (maxNum - num1 + 1));
        const resultAfterAdd = num1 + num2;
        const num3 = Math.floor(Math.random() * (resultAfterAdd + 1));

        return {
            num1,
            num2,
            num3,
            operator1: '+',
            operator2: '-',
            answer: num1 + num2 - num3
        };
    },

    // 生成三则反向混合题目 (减法后加法)
    generateTripleReverseMixed() {
        const maxNum = this.getMaxNumber();
        const num1 = Math.floor(Math.random() * (maxNum + 1));
        const num2 = Math.floor(Math.random() * (num1 + 1));
        const intermediate = num1 - num2;
        const num3 = Math.floor(Math.random() * (maxNum - intermediate + 1));

        return {
            num1,
            num2,
            num3,
            operator1: '-',
            operator2: '+',
            answer: num1 - num2 + num3
        };
    },

    // 生成混合题目
    generateMixed() {
        return Math.random() > 0.5
            ? this.generateAddition()
            : this.generateSubtraction();
    },

    // 生成三则混合题目
    generateTripleMixedAll() {
        const random = Math.random();
        if (random < 0.25) {
            return this.generateTripleAddition();
        } else if (random < 0.5) {
            return this.generateTripleSubtraction();
        } else if (random < 0.75) {
            return this.generateTripleMixed();
        } else {
            return this.generateTripleReverseMixed();
        }
    },

    // 生成题目列表
    generateList(mode, count) {
        const questions = [];
        for (let i = 0; i < count; i++) {
            let question;
            switch (mode) {
                case 'addition':
                    question = this.generateAddition();
                    break;
                case 'subtraction':
                    question = this.generateSubtraction();
                    break;
                case 'mixed':
                    question = this.generateMixed();
                    break;
                case 'triple-addition':
                    question = this.generateTripleAddition();
                    break;
                case 'triple-subtraction':
                    question = this.generateTripleSubtraction();
                    break;
                case 'triple-mixed':
                    question = this.generateTripleMixedAll();
                    break;
                default:
                    // 默认情况下随机选择二则或三则运算
                    if (Math.random() > 0.5) {
                        question = this.generateMixed();
                    } else {
                        question = this.generateTripleMixedAll();
                    }
                    break;
            }
            questions.push(question);
        }
        return questions;
    },

    // 生成选项 (一个正确答案 + 两个干扰项)
    generateOptions(correctAnswer) {
        const options = [correctAnswer];
        const maxNum = this.getMaxNumber();
        const maxOffset = Math.min(5, Math.floor(maxNum / 10) + 2);

        // 生成两个干扰项，与正确答案相差1-maxOffset
        while (options.length < 3) {
            const offset = Math.floor(Math.random() * maxOffset) + 1;
            const wrongAnswer = Math.random() > 0.5
                ? correctAnswer - offset
                : correctAnswer + offset;

            // 确保干扰项在0-maxNum范围内且不重复
            if (wrongAnswer >= 0 && wrongAnswer <= maxNum &&
                !options.includes(wrongAnswer)) {
                options.push(wrongAnswer);
            }
        }

        // 打乱选项顺序
        return this.shuffleArray(options);
    },

    // 打乱数组
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};

// ==================== 键盘控制器 ====================
const KeypadController = {
    currentInput: '',
    isLocked: false,

    // 重置输入
    reset() {
        this.currentInput = '';
        this.isLocked = false;
        this.updateDisplay();
        // 重新启用所有键盘按钮
        const buttons = elements.game.numberKeypad.querySelectorAll('.keypad-btn');
        buttons.forEach(btn => btn.removeAttribute('disabled'));
    },

    // 更新显示
    updateDisplay() {
        elements.game.inputValue.textContent = this.currentInput;
        if (this.currentInput === '') {
            elements.game.inputValue.classList.add('empty');
        } else {
            elements.game.inputValue.classList.remove('empty');
        }
    },

    // 添加数字
    addDigit(digit) {
        if (this.isLocked) return;
        if (this.currentInput.length < 2) {
            this.currentInput += digit;
            this.updateDisplay();
        }
    },

    // 清除输入
    clear() {
        if (this.isLocked) return;
        this.currentInput = '';
        this.updateDisplay();
    },

    // 确认答案
    confirm(correctAnswer) {
        if (this.isLocked || this.currentInput === '') return;
        this.isLocked = true;

        const userAnswer = parseInt(this.currentInput);
        const isCorrect = userAnswer === correctAnswer;

        // 禁用所有键盘按钮
        const buttons = elements.game.numberKeypad.querySelectorAll('.keypad-btn');
        buttons.forEach(btn => btn.disabled = true);

        // 显示反馈和结果
        GameController.handleAnswer(isCorrect, correctAnswer);

        return isCorrect;
    },

    // 锁定键盘
    lock() {
        this.isLocked = true;
        const buttons = elements.game.numberKeypad.querySelectorAll('.keypad-btn');
        buttons.forEach(btn => btn.disabled = true);
    }
};

// 异步加载缓存管理器
function loadCacheManager() {
    // 检查全局是否有CacheManager
    if (typeof CacheManager !== 'undefined') {
        return CacheManager;
    }

    // 如果没有，则返回一个简单的实现
    console.warn('缓存管理器未找到，使用localStorage替代实现');
    return {
        CACHE_KEY: 'math20_answer_history',

        getHistory() {
            const history = localStorage.getItem(this.CACHE_KEY);
            return history ? JSON.parse(history) : [];
        },

        saveHistory(history) {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(history));
        },

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

        clearHistory() {
            localStorage.removeItem(this.CACHE_KEY);
        },

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
}

// ==================== 游戏控制器 ====================
const GameController = {
    // 选择答题模式
    selectAnswerMode(mode) {
        gameState.answerMode = mode;
        this.switchScreen('mathMode');
    },

    // 选择难度
    selectDifficulty(difficulty) {
        currentDifficulty = difficulty;
        gameState.difficulty = difficulty;
        
        // 更新按钮状态
        elements.start.difficultyBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            }
        });
    },

    // 开始游戏
    start(mathMode) {
        // 重置状态
        gameState = {
            answerMode: gameState.answerMode,
            mathMode: mathMode,
            difficulty: currentDifficulty,
            questions: QuestionGenerator.generateList(mathMode, CONFIG.TOTAL_QUESTIONS),
            currentIndex: 0,
            score: 0,
            correctCount: 0,
            wrongCount: 0,
            canAnswer: false,
            currentInput: ''
        };

        // 重置总耗时
        TimerController.totalTime = 0;
        TimerController.updateTotalTimeDisplay();

        // 更新倒计时限制
        TimerController.remainingTime = CONFIG.difficulties[currentDifficulty].timeLimit;

        // 切换到游戏界面
        this.switchScreen('game');
        this.applyModeTheme(mathMode);
        this.showQuestion();
    },

    // 切换界面
    switchScreen(screenName) {
        Object.values(elements.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        elements.screens[screenName].classList.add('active');
    },

    // 应用模式主题
    applyModeTheme(mode) {
        elements.screens.game.className = 'screen active';
        if (mode === 'addition') {
            elements.screens.game.classList.add('mode-addition');
        } else if (mode === 'subtraction') {
            elements.screens.game.classList.add('mode-subtraction');
        } else if (mode === 'mixed') {
            elements.screens.game.classList.add('mode-mixed');
        } else if (mode === 'triple-addition') {
            elements.screens.game.classList.add('mode-triple-addition');
        } else if (mode === 'triple-subtraction') {
            elements.screens.game.classList.add('mode-triple-subtraction');
        } else if (mode === 'triple-mixed') {
            elements.screens.game.classList.add('mode-triple-mixed');
        }
    },

    // 显示题目
    showQuestion() {
        const question = gameState.questions[gameState.currentIndex];

        // 停止之前的倒计时
        TimerController.stop();

        // 更新进度
        elements.game.score.textContent = gameState.score;
        elements.game.progress.textContent = `${gameState.currentIndex + 1}/${CONFIG.TOTAL_QUESTIONS}`;

        // 更新题目文本 - 现在处理二则和三则运算
        if (question.num3 !== null) {
            // 三则运算显示
            elements.game.questionText.innerHTML = `
                <span class="num1">${question.num1}</span>
                <span class="operator">${question.operator1}</span>
                <span class="num2">${question.num2}</span>
                <span class="operator">${question.operator2}</span>
                <span class="num3">${question.num3}</span>
                <span class="equals">=</span>
                <span class="question-mark">?</span>
            `;
        } else {
            // 二则运算显示
            elements.game.questionText.innerHTML = `
                <span class="num1">${question.num1}</span>
                <span class="operator">${question.operator1}</span>
                <span class="num2">${question.num2}</span>
                <span class="equals">=</span>
                <span class="question-mark">?</span>
            `;
        }

        // 根据答题模式显示不同的交互界面
        if (gameState.answerMode === 'choice') {
            this.showChoiceMode(question);
        } else {
            this.showInputMode(question);
        }

        // 重置反馈区域
        elements.game.feedbackArea.innerHTML = '';

        // 禁用按钮一段时间，防止误触
        gameState.canAnswer = false;
        setTimeout(() => {
            gameState.canAnswer = true;
            // 启动倒计时
            TimerController.start();
        }, CONFIG.BUTTON_ENABLE_DELAY);
    },

    // 显示选择模式
    showChoiceMode(question) {
        elements.game.answerOptions.style.display = 'flex';
        elements.game.inputModeArea.style.display = 'none';

        // 生成选项
        const options = QuestionGenerator.generateOptions(question.answer);
        elements.game.answerOptions.innerHTML = options.map(opt =>
            `<button class="option-btn" data-answer="${opt}">${opt}</button>`
        ).join('');

        // 绑定选项点击事件
        this.bindOptionEvents(question.answer);
    },

    // 显示填写模式
    showInputMode(question) {
        elements.game.answerOptions.style.display = 'none';
        elements.game.inputModeArea.style.display = 'flex';

        // 重置键盘
        KeypadController.reset();
    },

    // 绑定选择模式事件
    bindOptionEvents(correctAnswer) {
        const buttons = elements.game.answerOptions.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!gameState.canAnswer) return;
                gameState.canAnswer = false;

                const selectedAnswer = parseInt(btn.dataset.answer);
                const isCorrect = selectedAnswer === correctAnswer;

                // 禁用所有按钮
                buttons.forEach(b => b.disabled = true);

                // 显示结果样式
                if (isCorrect) {
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('wrong');
                    // 标记正确答案
                    buttons.forEach(b => {
                        if (parseInt(b.dataset.answer) === correctAnswer) {
                            b.classList.add('correct');
                        }
                    });
                }

                this.handleAnswer(isCorrect, correctAnswer);
            });
        });
    },

    // 处理答案
    handleAnswer(isCorrect, correctAnswer) {
        // 停止倒计时
        TimerController.stop();

        if (isCorrect) {
            gameState.score += CONFIG.POINTS_PER_QUESTION;
            gameState.correctCount++;
            this.showFeedback(true);
        } else {
            gameState.wrongCount++;
            this.showFeedback(false);
        }

        // 更新分数显示
        elements.game.score.textContent = gameState.score;

        // 延迟后进入下一题
        setTimeout(() => {
            this.nextQuestion();
        }, CONFIG.ANSWER_DELAY);
    },

    // 处理超时
    handleTimeout() {
        gameState.canAnswer = false;
        gameState.wrongCount++;
        this.showFeedback(false);

        // 禁用所有交互元素
        if (gameState.answerMode === 'choice') {
            const buttons = elements.game.answerOptions.querySelectorAll('.option-btn');
            buttons.forEach(b => b.disabled = true);
        } else {
            KeypadController.lock();
        }

        // 延迟后进入下一题
        setTimeout(() => {
            this.nextQuestion();
        }, CONFIG.ANSWER_DELAY);
    },

    // 显示反馈
    showFeedback(isCorrect) {
        const feedback = isCorrect
            ? { icon: '🎉', text: '恭喜成功！', class: 'success' }
            : { icon: '💪', text: '下次努力！', class: 'error' };

        // 播放音效
        if (isCorrect) {
            SoundController.playCorrect();
        } else {
            SoundController.playWrong();
        }

        elements.game.feedbackArea.innerHTML = `
            <div class="feedback-content ${feedback.class}">
                <span class="feedback-icon">${feedback.icon}</span>
                <span class="feedback-text">${feedback.text}</span>
            </div>
        `;
    },

    // 下一题或结束游戏
    nextQuestion() {
        gameState.currentIndex++;

        if (gameState.currentIndex >= CONFIG.TOTAL_QUESTIONS) {
            this.endGame();
        } else {
            this.showQuestion();
        }
    },

    // 结束游戏
    endGame() {
        // 停止倒计时
        TimerController.stop();

        const result = this.calculateResult();

        // 更新结算界面
        elements.result.finalScore.textContent = gameState.score;
        elements.result.correctCount.textContent = gameState.correctCount;
        elements.result.wrongCount.textContent = gameState.wrongCount;
        elements.result.resultRank.textContent = result.rank;
        elements.result.resultMessage.textContent = result.message;

        // 显示总耗时
        const minutes = Math.floor(TimerController.totalTime / 60);
        const seconds = TimerController.totalTime % 60;
        elements.result.resultTotalTime.textContent = `${minutes}分${seconds}秒`;

        // 显示星星
        const stars = result.stars;
        elements.result.resultStars.innerHTML = Array.from({ length: stars }, () =>
            '<span class="star">⭐</span>'
        ).join('');

        // 计算并显示勋章
        const badgeData = {
            score: gameState.score,
            correctCount: gameState.correctCount,
            wrongCount: gameState.wrongCount,
            totalTime: TimerController.totalTime
        };
        const earnedBadges = BadgeSystem.calculateBadges(badgeData);
        BadgeSystem.renderBadges(earnedBadges, elements.result.badgesContainer);

        // 切换到结算界面
        this.switchScreen('result');

        // 保存答题记录到缓存
        const cacheManager = loadCacheManager();
        const record = {
            answerMode: gameState.answerMode,
            mathMode: gameState.mathMode,
            startTime: new Date(Date.now() - TimerController.totalTime * 1000).toISOString(),
            endTime: new Date().toISOString(),
            totalTimeSeconds: TimerController.totalTime,
            totalQuestions: CONFIG.TOTAL_QUESTIONS,
            correctCount: gameState.correctCount,
            wrongCount: gameState.wrongCount,
            score: gameState.score,
            accuracyRate: (gameState.correctCount / CONFIG.TOTAL_QUESTIONS * 100).toFixed(2)
        };

        try {
            cacheManager.addRecord(record);
        } catch (error) {
            console.error('保存答题记录失败:', error);
        }
    },

    // 计算结果
    calculateResult() {
        const score = gameState.score;

        if (score > 90) {
            return {
                rank: '🌟 优秀',
                stars: 3,
                message: '太棒了！你真是数学小天才！继续保持！'
            };
        } else if (score > 80) {
            return {
                rank: '🌈 良好',
                stars: 2,
                message: '做得很好！再接再厉，你能更优秀！'
            };
        } else {
            return {
                rank: '💪 需努力',
                stars: 1,
                message: '没关系，多练习就会进步！加油！'
            };
        }
    }
};

// ==================== 事件绑定 ====================
function initEventListeners() {
    // 难度选择按钮
    elements.start.difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const difficulty = btn.dataset.difficulty;
            GameController.selectDifficulty(difficulty);
        });
    });

    // 答题模式选择按钮
    elements.start.answerModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.answerMode;
            GameController.selectAnswerMode(mode);
        });
    });

    // 运算模式选择按钮
    elements.mathMode.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            GameController.start(mode);
        });
    });

    // 返回开始界面
    elements.mathMode.backBtn.addEventListener('click', () => {
        GameController.switchScreen('start');
    });

    // 数字键盘事件
    elements.game.numberKeypad.addEventListener('click', (e) => {
        if (!gameState.canAnswer) return;

        const key = e.target.dataset.key;
        if (!key) return;

        const question = gameState.questions[gameState.currentIndex];

        switch (key) {
            case 'clear':
                KeypadController.clear();
                break;
            case 'confirm':
                KeypadController.confirm(question.answer);
                break;
            default:
                KeypadController.addDigit(key);
        }
    });

    // 重新开始按钮
    elements.result.restartBtn.addEventListener('click', () => {
        GameController.switchScreen('start');
    });

    // 设置按钮
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // 重定向到设置页面
            window.location.href = 'settings.html';
        });
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    SoundController.init();
    initEventListeners();

    // 预加载缓存管理器
    try {
        loadCacheManager();
    } catch (e) {
        console.warn('无法加载缓存管理器:', e);
    }
});