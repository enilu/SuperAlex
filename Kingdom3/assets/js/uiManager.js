/**
 * 三国演义H5问答游戏 - UI管理模块
 * 包含显示反馈、更新进度条、显示星星评价等功能
 */

const UIManager = {
    // DOM元素缓存
    elements: {},

    /**
     * 初始化UI管理器
     */
    init() {
        this.cacheElements();
    },

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements = {
            // 屏幕
            startScreen: document.getElementById('start-screen'),
            gameScreen: document.getElementById('game-screen'),
            resultScreen: document.getElementById('result-screen'),
            certificateScreen: document.getElementById('certificate-screen'),
            settingsScreen: document.getElementById('settings-screen'),
            questionManagerScreen: document.getElementById('question-manager-screen'),

            // 开始界面
            levelCards: document.querySelectorAll('.level-card'),
            btnSettings: document.getElementById('btn-settings'),
            btnQuestionManager: document.getElementById('btn-question-manager'),

            // 游戏界面
            btnBack: document.getElementById('btn-back'),
            currentLevelName: document.getElementById('current-level-name'),
            correctCount: document.getElementById('correct-count'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            questionCard: document.getElementById('question-card'),
            questionNumber: document.getElementById('question-number'),
            questionPinyin: document.getElementById('question-pinyin'),
            questionContent: document.getElementById('question-content'),
            optionsContainer: document.getElementById('options-container'),
            optionA: document.getElementById('option-a'),
            optionB: document.getElementById('option-b'),
            optionC: document.getElementById('option-c'),
            optionTextA: document.getElementById('option-text-a'),
            optionTextB: document.getElementById('option-text-b'),
            optionTextC: document.getElementById('option-text-c'),
            feedbackArea: document.getElementById('feedback-area'),
            reviveContainer: document.getElementById('revive-container'),
            btnRevive: document.getElementById('btn-revive'),

            // 结果界面
            resultIcon: document.getElementById('result-icon'),
            resultTitle: document.getElementById('result-title'),
            resultStars: document.getElementById('result-stars'),
            resultCorrect: document.getElementById('result-correct'),
            resultWrong: document.getElementById('result-wrong'),
            resultScore: document.getElementById('result-score'),
            resultMessage: document.getElementById('result-message'),
            resultActions: document.getElementById('result-actions'),
            btnRetry: document.getElementById('btn-retry'),
            btnNext: document.getElementById('btn-next'),
            btnHome: document.getElementById('btn-home'),
            certificateSection: document.getElementById('certificate-section'),
            btnCertificate: document.getElementById('btn-certificate'),

            // 证书界面
            certificateCard: document.getElementById('certificate-card'),
            certTotalCorrect: document.getElementById('cert-total-correct'),
            certTotalScore: document.getElementById('cert-total-score'),
            certificateDate: document.getElementById('certificate-date'),
            btnBackCert: document.getElementById('btn-back-cert'),
            btnShare: document.getElementById('btn-share'),

            // 设置界面
            btnBackSettings: document.getElementById('btn-back-settings'),
            toggleSound: document.getElementById('toggle-sound'),
            toggleMusic: document.getElementById('toggle-music'),
            btnResetProgress: document.getElementById('btn-reset-progress'),

            // 题库管理界面
            btnBackManager: document.getElementById('btn-back-manager'),
            tabList: document.getElementById('tab-list'),
            tabAdd: document.getElementById('tab-add'),
            managerList: document.getElementById('manager-list'),
            managerAdd: document.getElementById('manager-add'),
            filterLevel: document.getElementById('filter-level'),
            questionsList: document.getElementById('questions-list'),
            formQuestion: document.getElementById('form-question'),
            formOptionA: document.getElementById('form-option-a'),
            formOptionB: document.getElementById('form-option-b'),
            formOptionC: document.getElementById('form-option-c'),
            formAnswer: document.getElementById('form-answer'),
            formLevel: document.getElementById('form-level'),
            formHint: document.getElementById('form-hint'),
            btnFormCancel: document.getElementById('btn-form-cancel'),
            btnFormSave: document.getElementById('btn-form-save')
        };
    },

    /**
     * 切换屏幕
     * @param {string} screenName - 屏幕名称
     */
    switchScreen(screenName) {
        // 隐藏所有屏幕
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 显示目标屏幕
        const targetScreen = this.elements[screenName + 'Screen'];
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    },

    /**
     * 更新关卡选择界面
     */
    updateLevelSelection() {
        for (let i = 1; i <= 4; i++) {
            const levelCard = document.getElementById(`level-${i}`);
            const starsDiv = document.getElementById(`stars-${i}`);
            const lockDiv = document.getElementById(`lock-${i}`);
            const levelConfig = GameConfig.LEVELS[i];

            if (!levelCard) continue;

            // 检查是否解锁
            const isUnlocked = ProgressManager.isLevelUnlocked(i);
            const stars = ProgressManager.getLevelStars(i);

            // 更新锁状态
            if (lockDiv) {
                lockDiv.style.display = isUnlocked ? 'none' : 'block';
            }

            // 更新星级显示
            if (starsDiv) {
                starsDiv.innerHTML = '';
                for (let s = 1; s <= 3; s++) {
                    const star = document.createElement('span');
                    star.className = s <= stars ? 'star' : 'star empty';
                    star.textContent = '⭐';
                    starsDiv.appendChild(star);
                }
            }

            // 更新卡片状态
            if (isUnlocked) {
                levelCard.classList.remove('locked');
            } else {
                levelCard.classList.add('locked');
            }
        }
    },

    /**
     * 显示题目
     * @param {Object} question - 题目对象
     * @param {number} questionNum - 题目编号
     * @param {number} totalQuestions - 总题数
     */
    showQuestion(question, questionNum, totalQuestions) {
        // 更新题目编号
        if (this.elements.questionNumber) {
            this.elements.questionNumber.textContent = `题目 ${questionNum}`;
        }

        // 更新题目拼音
        if (this.elements.questionPinyin) {
            this.elements.questionPinyin.textContent = question.pinyin || '';
        }

        // 更新题目内容
        if (this.elements.questionContent) {
            this.elements.questionContent.textContent = question.question;
        }

        // 更新选项
        if (this.elements.optionTextA) {
            this.elements.optionTextA.textContent = question.options[0];
        }
        if (this.elements.optionTextB) {
            this.elements.optionTextB.textContent = question.options[1];
        }
        if (this.elements.optionTextC) {
            this.elements.optionTextC.textContent = question.options[2];
        }

        // 重置选项状态
        this.resetOptionStates();

        // 更新进度条
        this.updateProgress(questionNum, totalQuestions);

        // 隐藏反馈和复活按钮
        this.clearFeedback();
        this.hideReviveButton();

        // 重新启用选项
        this.enableOptions();
    },

    /**
     * 更新进度条
     * @param {number} current - 当前题号
     * @param {number} total - 总题数
     */
    updateProgress(current, total) {
        const percent = ((current - 1) / total) * 100;

        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percent}%`;
        }

        if (this.elements.progressText) {
            this.elements.progressText.textContent = `第 ${current}/${total} 题`;
        }
    },

    /**
     * 更新答对数量显示
     * @param {number} count - 答对数量
     */
    updateCorrectCount(count) {
        if (this.elements.correctCount) {
            this.elements.correctCount.textContent = count;
        }
    },

    /**
     * 显示正确反馈
     * @param {string} message - 反馈消息
     */
    showCorrectFeedback(message = null) {
        const msg = message || this.getRandomMessage('correct');
        this.showFeedback(msg, 'correct');
    },

    /**
     * 显示错误反馈
     * @param {string} message - 反馈消息
     */
    showWrongFeedback(message = null) {
        const msg = message || this.getRandomMessage('wrong');
        this.showFeedback(msg, 'wrong');
    },

    /**
     * 显示反馈消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型（correct/wrong/info）
     */
    showFeedback(message, type = 'info') {
        if (!this.elements.feedbackArea) return;

        this.elements.feedbackArea.innerHTML = `
            <div class="feedback-message ${type}">${message}</div>
        `;

        // 自动清除
        setTimeout(() => {
            this.clearFeedback();
        }, GameConfig.UI.feedbackDuration);
    },

    /**
     * 清除反馈消息
     */
    clearFeedback() {
        if (this.elements.feedbackArea) {
            this.elements.feedbackArea.innerHTML = '';
        }
    },

    /**
     * 获取随机反馈消息
     * @param {string} type - 消息类型
     * @returns {string} 随机消息
     */
    getRandomMessage(type) {
        const messages = GameConfig.TEXTS[type];
        return messages[Math.floor(Math.random() * messages.length)];
    },

    /**
     * 标记选项为正确
     * @param {string} option - 选项（A/B/C）
     */
    markOptionCorrect(option) {
        const optionBtn = this.elements[`option${option}`];
        if (optionBtn) {
            optionBtn.classList.add('correct');
        }
    },

    /**
     * 标记选项为错误
     * @param {string} option - 选项（A/B/C）
     */
    markOptionWrong(option) {
        const optionBtn = this.elements[`option${option}`];
        if (optionBtn) {
            optionBtn.classList.add('wrong');
        }
    },

    /**
     * 高亮提示关键词
     * @param {string} hint - 提示关键词
     */
    highlightHint(hint) {
        if (!this.elements.questionContent || !hint) return;

        const questionText = this.elements.questionContent.textContent;
        const highlightedText = questionText.replace(
            new RegExp(`(${hint})`, 'gi'),
            '<span class="highlight">$1</span>'
        );

        this.elements.questionContent.innerHTML = highlightedText;
    },

    /**
     * 重置选项状态
     */
    resetOptionStates() {
        ['A', 'B', 'C'].forEach(option => {
            const optionBtn = this.elements[`option${option}`];
            if (optionBtn) {
                optionBtn.classList.remove('correct', 'wrong');
            }
        });

        // 重置题目内容的高亮
        if (this.elements.questionContent) {
            const questionCard = document.getElementById('question-card');
            const questionNumber = document.getElementById('question-number');
            if (questionCard && questionNumber) {
                // 重新设置纯文本，移除所有高亮
                this.elements.questionContent.innerHTML =
                    this.elements.questionContent.textContent;
            }
        }
    },

    /**
     * 禁用所有选项
     */
    disableOptions() {
        ['A', 'B', 'C'].forEach(option => {
            const optionBtn = this.elements[`option${option}`];
            if (optionBtn) {
                optionBtn.disabled = true;
            }
        });
    },

    /**
     * 启用所有选项
     */
    enableOptions() {
        ['A', 'B', 'C'].forEach(option => {
            const optionBtn = this.elements[`option${option}`];
            if (optionBtn) {
                optionBtn.disabled = false;
            }
        });
    },

    /**
     * 显示复活按钮
     * @param {string} hint - 提示关键词
     */
    showReviveButton(hint) {
        if (this.elements.reviveContainer) {
            this.elements.reviveContainer.style.display = 'block';
            this.elements.reviveContainer.dataset.hint = hint;
        }
    },

    /**
     * 隐藏复活按钮
     */
    hideReviveButton() {
        if (this.elements.reviveContainer) {
            this.elements.reviveContainer.style.display = 'none';
            delete this.elements.reviveContainer.dataset.hint;
        }
    },

    /**
     * 显示结果界面
     * @param {Object} result - 结果数据
     */
    showResult(result) {
        const { passed, score, stars, correctCount, wrongCount } = result;

        // 更新图标和标题
        if (this.elements.resultIcon) {
            this.elements.resultIcon.textContent = passed ? '🎉' : '😢';
        }

        if (this.elements.resultTitle) {
            this.elements.resultTitle.textContent = passed ?
                this.getRandomMessage('pass') :
                this.getRandomMessage('fail')[0];
        }

        // 更新星级
        if (this.elements.resultStars) {
            this.elements.resultStars.innerHTML = '';
            for (let i = 1; i <= 3; i++) {
                const star = document.createElement('span');
                star.className = i <= stars ? 'star' : 'star empty';
                star.textContent = '⭐';
                this.elements.resultStars.appendChild(star);
            }
        }

        // 更新统计
        if (this.elements.resultCorrect) {
            this.elements.resultCorrect.textContent = correctCount;
        }
        if (this.elements.resultWrong) {
            this.elements.resultWrong.textContent = wrongCount;
        }
        if (this.elements.resultScore) {
            this.elements.resultScore.textContent = score;
        }

        // 更新消息
        if (this.elements.resultMessage) {
            if (passed) {
                if (stars === 3) {
                    this.elements.resultMessage.textContent = '太棒了！你完美通过了这一关！';
                } else {
                    this.elements.resultMessage.textContent = '恭喜！你已经掌握了这个关卡的知识！';
                }
            } else {
                this.elements.resultMessage.textContent = '别灰心！再试一次，一定可以过关的！';
            }
        }

        // 显示/隐藏下一关按钮
        if (this.elements.btnNext) {
            const nextLevel = result.level + 1;
            const hasNextLevel = nextLevel <= GameConfig.RULES.totalLevels;
            const isNextUnlocked = hasNextLevel && ProgressManager.isLevelUnlocked(nextLevel);

            this.elements.btnNext.style.display = (passed && isNextUnlocked) ? 'flex' : 'none';
        }

        // 显示证书按钮（全部通关）
        if (this.elements.certificateSection) {
            const isAllCompleted = ProgressManager.isAllLevelsCompleted();
            this.elements.certificateSection.style.display = isAllCompleted ? 'block' : 'none';
        }

        // 切换到结果界面
        this.switchScreen('result');
    },

    /**
     * 显示证书界面
     */
    showCertificate() {
        const progress = ProgressManager.getProgress();

        // 更新证书数据
        if (this.elements.certTotalCorrect) {
            this.elements.certTotalCorrect.textContent = progress.totalCorrect;
        }

        if (this.elements.certTotalScore) {
            this.elements.certTotalScore.textContent = ProgressManager.getTotalScore();
        }

        // 更新日期
        if (this.elements.certificateDate) {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            this.elements.certificateDate.textContent =
                `${year}年${month}月${day}日`;
        }

        // 切换到证书界面
        this.switchScreen('certificate');
    },

    /**
     * 更新设置界面
     */
    updateSettings() {
        const settings = CacheManager.loadSettings();

        if (this.elements.toggleSound) {
            this.elements.toggleSound.checked = settings.sound !== false;
        }

        if (this.elements.toggleMusic) {
            this.elements.toggleMusic.checked = settings.music === true;
        }
    },

    /**
     * 加载题目列表
     * @param {number} level - 关卡筛选
     */
    loadQuestionsList(level = 'all') {
        if (!this.elements.questionsList) return;

        const questions = QuestionManager.getAllQuestions();
        const filtered = level === 'all' ?
            questions :
            questions.filter(q => q.level == level);

        if (filtered.length === 0) {
            this.elements.questionsList.innerHTML =
                '<p class="empty-hint">暂无题目</p>';
            return;
        }

        this.elements.questionsList.innerHTML = filtered.map(q => `
            <div class="question-item" data-id="${q.id}">
                <div class="question-item-header">
                    <span class="question-item-level">第${q.level}关</span>
                    <div class="question-item-actions">
                        <button class="btn-edit" data-id="${q.id}">编辑</button>
                        <button class="btn-delete" data-id="${q.id}">删除</button>
                    </div>
                </div>
                <div class="question-item-text">${this.escapeHtml(q.question)}</div>
                <div class="question-item-meta">
                    <span>答案: ${q.answer}</span>
                    <span>提示: ${q.hint || '无'}</span>
                </div>
            </div>
        `).join('');
    },

    /**
     * 切换题库管理标签
     * @param {string} tab - 标签名称
     */
    switchManagerTab(tab) {
        if (tab === 'list') {
            this.elements.managerList.style.display = 'block';
            this.elements.managerAdd.style.display = 'none';
            this.elements.tabList.classList.add('active');
            this.elements.tabAdd.classList.remove('active');
        } else {
            this.elements.managerList.style.display = 'none';
            this.elements.managerAdd.style.display = 'block';
            this.elements.tabList.classList.remove('active');
            this.elements.tabAdd.classList.add('active');
            this.clearQuestionForm();
        }
    },

    /**
     * 清空题目表单
     */
    clearQuestionForm() {
        if (this.elements.formQuestion) {
            this.elements.formQuestion.value = '';
        }
        if (this.elements.formOptionA) {
            this.elements.formOptionA.value = '';
        }
        if (this.elements.formOptionB) {
            this.elements.formOptionB.value = '';
        }
        if (this.elements.formOptionC) {
            this.elements.formOptionC.value = '';
        }
        if (this.elements.formAnswer) {
            this.elements.formAnswer.value = '';
        }
        if (this.elements.formLevel) {
            this.elements.formLevel.value = '';
        }
        if (this.elements.formHint) {
            this.elements.formHint.value = '';
        }
    },

    /**
     * 加载题目到表单（编辑模式）
     * @param {number} id - 题目ID
     */
    loadQuestionToForm(id) {
        const question = QuestionManager.getQuestionById(id);
        if (!question) return;

        this.switchManagerTab('add');

        if (this.elements.formQuestion) {
            this.elements.formQuestion.value = question.question;
        }
        if (this.elements.formOptionA) {
            this.elements.formOptionA.value = question.options[0];
        }
        if (this.elements.formOptionB) {
            this.elements.formOptionB.value = question.options[1];
        }
        if (this.elements.formOptionC) {
            this.elements.formOptionC.value = question.options[2];
        }
        if (this.elements.formAnswer) {
            this.elements.formAnswer.value = question.answer;
        }
        if (this.elements.formLevel) {
            this.elements.formLevel.value = question.level;
        }
        if (this.elements.formHint) {
            this.elements.formHint.value = question.hint || '';
        }

        // 存储编辑状态
        this.elements.managerAdd.dataset.editId = id;
    },

    /**
     * 转义HTML字符
     * @param {string} text - 原始文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 显示确认对话框
     * @param {string} message - 消息内容
     * @returns {boolean} 用户是否确认
     */
    confirm(message) {
        return window.confirm(message);
    },

    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型（info/success/error/warning）
     */
    showToast(message, type = 'info') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            z-index: 9999;
            animation: slideDown 0.3s ease;
        `;

        // 设置颜色
        const colors = {
            info: '#2196F3',
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800'
        };
        toast.style.backgroundColor = colors[type] || colors.info;
        toast.style.color = 'white';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';

        // 添加到页面
        document.body.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    },

    /**
     * 显示加载动画
     */
    showLoading() {
        let loader = document.getElementById('loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loader';
            loader.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 9999;
            `;
            loader.innerHTML = `
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'block';
    },

    /**
     * 隐藏加载动画
     */
    hideLoading() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
