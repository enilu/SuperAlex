/**
 * 三国演义H5问答游戏 - 游戏管理模块
 * 实现游戏核心逻辑，包含开始关卡、显示题目、处理答题、检查过关、复活机制、显示结果等功能
 */

const GameManager = {
    // 游戏状态
    currentLevel: 1,
    currentQuestions: [],
    currentQuestionIndex: 0,
    gameData: {
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        hasRevived: false,
        isGameOver: false
    },
    isProcessing: false,

    /**
     * 初始化游戏管理器
     */
    init() {
        // 绑定事件
        this.bindEvents();
    },

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 关卡选择
        const elements = UIManager.elements;

        elements.levelCards?.forEach(card => {
            card.addEventListener('click', (e) => {
                if (card.classList.contains('locked')) {
                    UIManager.showToast('该关卡尚未解锁', 'warning');
                    return;
                }
                const level = parseInt(card.dataset.level);
                this.startLevel(level);
            });
        });

        // 返回按钮
        elements.btnBack?.addEventListener('click', () => {
            this.endGame(false);
        });

        // 选项按钮
        ['A', 'B', 'C'].forEach(option => {
            const btn = elements[`option${option}`];
            btn?.addEventListener('click', () => {
                this.handleAnswer(option);
            });
        });

        // 复活按钮
        elements.btnRevive?.addEventListener('click', () => {
            this.useRevive();
        });

        // 结果界面按钮
        elements.btnRetry?.addEventListener('click', () => {
            this.restartLevel();
        });

        elements.btnNext?.addEventListener('click', () => {
            const nextLevel = this.currentLevel + 1;
            if (nextLevel <= GameConfig.RULES.totalLevels) {
                this.startLevel(nextLevel);
            }
        });

        elements.btnHome?.addEventListener('click', () => {
            this.goHome();
        });

        // 证书按钮
        elements.btnCertificate?.addEventListener('click', () => {
            UIManager.showCertificate();
        });

        elements.btnBackCert?.addEventListener('click', () => {
            UIManager.switchScreen('result');
        });

        elements.btnShare?.addEventListener('click', () => {
            this.shareCertificate();
        });

        // 设置按钮
        elements.btnSettings?.addEventListener('click', () => {
            UIManager.updateSettings();
            UIManager.switchScreen('settings');
        });

        elements.btnBackSettings?.addEventListener('click', () => {
            UIManager.switchScreen('start');
        });

        elements.toggleSound?.addEventListener('change', (e) => {
            AudioManager.setSoundEnabled(e.target.checked);
        });

        elements.toggleMusic?.addEventListener('change', (e) => {
            AudioManager.setMusicEnabled(e.target.checked);
        });

        elements.btnResetProgress?.addEventListener('click', () => {
            if (UIManager.confirm('确定要重置所有进度吗？此操作不可恢复！')) {
                ProgressManager.resetProgress();
                UIManager.updateLevelSelection();
                UIManager.showToast('进度已重置', 'success');
            }
        });

        // 题库管理按钮
        elements.btnQuestionManager?.addEventListener('click', () => {
            UIManager.switchScreen('questionManager');
            UIManager.loadQuestionsList();
        });

        elements.btnBackManager?.addEventListener('click', () => {
            UIManager.switchScreen('start');
            UIManager.updateLevelSelection();
        });

        // 题库管理标签切换
        elements.tabList?.addEventListener('click', () => {
            UIManager.switchManagerTab('list');
        });

        elements.tabAdd?.addEventListener('click', () => {
            UIManager.switchManagerTab('add');
            delete elements.managerAdd.dataset.editId;
        });

        // 筛选关卡
        elements.filterLevel?.addEventListener('change', (e) => {
            UIManager.loadQuestionsList(e.target.value);
        });

        // 题目列表事件
        elements.questionsList?.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-edit')) {
                const id = parseInt(e.target.dataset.id);
                UIManager.loadQuestionToForm(id);
            } else if (e.target.classList.contains('btn-delete')) {
                const id = parseInt(e.target.dataset.id);
                if (UIManager.confirm('确定要删除这道题目吗？')) {
                    QuestionManager.deleteQuestion(id);
                    UIManager.loadQuestionsList(elements.filterLevel?.value || 'all');
                    UIManager.showToast('题目已删除', 'success');
                }
            }
        });

        // 表单按钮
        elements.btnFormCancel?.addEventListener('click', () => {
            UIManager.switchManagerTab('list');
        });

        elements.btnFormSave?.addEventListener('click', () => {
            this.saveQuestionFromForm();
        });
    },

    /**
     * 开始关卡
     * @param {number} level - 关卡号
     */
    startLevel(level) {
        this.currentLevel = level;
        const levelConfig = GameConfig.LEVELS[level];

        // 获取关卡题目
        this.currentQuestions = QuestionManager.getLevelQuestions(level);
        this.currentQuestionIndex = 0;

        // 重置游戏数据
        this.gameData = {
            score: 0,
            correctCount: 0,
            wrongCount: 0,
            hasRevived: false,
            isGameOver: false
        };
        this.isProcessing = false;

        // 更新界面
        if (UIManager.elements.currentLevelName) {
            UIManager.elements.currentLevelName.textContent = levelConfig.name;
        }
        UIManager.updateCorrectCount(0);

        // 播放背景音乐
        AudioManager.playBgm();

        // 显示第一题
        this.showQuestion();

        // 切换到游戏界面
        UIManager.switchScreen('game');
    },

    /**
     * 显示当前题目
     */
    showQuestion() {
        if (this.currentQuestionIndex >= this.currentQuestions.length) {
            this.showResult();
            return;
        }

        const question = this.currentQuestions[this.currentQuestionIndex];
        const questionNum = this.currentQuestionIndex + 1;
        const totalQuestions = this.currentQuestions.length;

        UIManager.showQuestion(question, questionNum, totalQuestions);
    },

    /**
     * 处理答题
     * @param {string} option - 选择的选项（A/B/C）
     */
    handleAnswer(option) {
        if (this.isProcessing || this.gameData.isGameOver) {
            return;
        }

        this.isProcessing = true;

        const question = this.currentQuestions[this.currentQuestionIndex];
        const isCorrect = option === question.answer;

        // 禁用所有选项
        UIManager.disableOptions();

        if (isCorrect) {
            this.handleCorrectAnswer(option);
        } else {
            this.handleWrongAnswer(option, question);
        }
    },

    /**
     * 处理正确答案
     * @param {string} option - 选项
     */
    handleCorrectAnswer(option) {
        // 标记选项
        UIManager.markOptionCorrect(option);

        // 显示反馈
        UIManager.showCorrectFeedback();
        AudioManager.playCorrect();

        // 更新数据
        this.gameData.correctCount++;
        this.gameData.score += GameConfig.RULES.scorePerQuestion;
        UIManager.updateCorrectCount(this.gameData.correctCount);

        // 延迟后下一题
        setTimeout(() => {
            this.nextQuestion();
        }, GameConfig.UI.autoNextDelay);
    },

    /**
     * 处理错误答案
     * @param {string} option - 选项
     * @param {Object} question - 题目对象
     */
    handleWrongAnswer(option, question) {
        // 标记选项
        UIManager.markOptionWrong(option);
        UIManager.markOptionCorrect(question.answer);

        // 显示反馈
        UIManager.showWrongFeedback();
        AudioManager.playWrong();

        // 更新数据
        this.gameData.wrongCount++;

        // 检查是否可以复活
        setTimeout(() => {
            if (this.gameData.correctCount < GameConfig.RULES.passScore &&
                !this.gameData.hasRevived &&
                this.currentQuestionIndex < this.currentQuestions.length - 1) {
                // 显示复活按钮
                UIManager.showReviveButton(question.hint);
            } else {
                // 继续下一题或结束
                setTimeout(() => {
                    this.nextQuestion();
                }, GameConfig.UI.autoNextDelay);
            }
        }, GameConfig.UI.autoNextDelay);
    },

    /**
     * 下一题
     */
    nextQuestion() {
        this.currentQuestionIndex++;
        this.isProcessing = false;

        if (this.currentQuestionIndex >= this.currentQuestions.length) {
            this.showResult();
        } else {
            this.showQuestion();
        }
    },

    /**
     * 使用复活
     */
    useRevive() {
        if (this.gameData.hasRevived) {
            UIManager.showToast('已经使用过复活机会了', 'warning');
            return;
        }

        const question = this.currentQuestions[this.currentQuestionIndex];

        // 高亮提示
        UIManager.highlightHint(question.hint);

        // 标记已使用复活
        this.gameData.hasRevived = true;

        // 隐藏复活按钮
        UIManager.hideReviveButton();

        // 重新启用选项按钮，允许用户重新选择
        UIManager.enableOptions();
        UIManager.resetOptionStates();

        // 重置处理状态
        this.isProcessing = false;

        UIManager.showToast('提示已显示，请重新选择答案', 'info');
    },

    /**
     * 检查过关条件
     * @returns {boolean} 是否过关
     */
    checkPassCondition() {
        return this.gameData.correctCount >= GameConfig.RULES.passScore;
    },

    /**
     * 计算星级
     * @returns {number} 星级（1-3）
     */
    calculateStars() {
        const totalQuestions = this.currentQuestions.length;
        return ProgressManager.calculateStars(
            this.gameData.correctCount,
            totalQuestions
        );
    },

    /**
     * 显示结果
     */
    showResult() {
        this.gameData.isGameOver = true;

        const passed = this.checkPassCondition();
        const stars = this.calculateStars();

        // 保存成绩
        if (passed) {
            ProgressManager.saveLevelScore(
                this.currentLevel,
                this.gameData.score,
                stars,
                this.gameData.correctCount,
                this.gameData.wrongCount
            );

            // 解锁下一关
            ProgressManager.unlockNextLevel(this.currentLevel);

            // 检查成就
            this.checkAchievements();
        }

        // 显示结果界面
        UIManager.showResult({
            level: this.currentLevel,
            passed: passed,
            score: this.gameData.score,
            stars: stars,
            correctCount: this.gameData.correctCount,
            wrongCount: this.gameData.wrongCount
        });
    },

    /**
     * 检查成就
     */
    checkAchievements() {
        // 第一次通关
        if (!ProgressManager.hasAchievement('first_complete')) {
            ProgressManager.unlockAchievement('first_complete');
            UIManager.showToast('获得成就：初出茅庐', 'success');
        }

        // 全部通关
        if (ProgressManager.isAllLevelsCompleted() &&
            !ProgressManager.hasAchievement('all_complete')) {
            ProgressManager.unlockAchievement('all_complete');
        }

        // 满分
        if (this.gameData.score === 100 &&
            !ProgressManager.hasAchievement('perfect_score')) {
            ProgressManager.unlockAchievement('perfect_score');
            UIManager.showToast('获得成就：满贯将军', 'success');
        }

        // 零错误
        if (this.gameData.wrongCount === 0 &&
            !ProgressManager.hasAchievement('no_mistakes')) {
            ProgressManager.unlockAchievement('no_mistakes');
            UIManager.showToast('获得成就：神机妙算', 'success');
        }
    },

    /**
     * 重新开始关卡
     */
    restartLevel() {
        this.startLevel(this.currentLevel);
    },

    /**
     * 结束游戏
     * @param {boolean} showHomeScreen - 是否显示主页
     */
    endGame(showHomeScreen = true) {
        this.currentLevel = 1;
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.gameData = {
            score: 0,
            correctCount: 0,
            wrongCount: 0,
            hasRevived: false,
            isGameOver: true
        };
        this.isProcessing = false;

        // 停止背景音乐
        AudioManager.stopBgm();

        if (showHomeScreen) {
            UIManager.updateLevelSelection();
            UIManager.switchScreen('start');
        }
    },

    /**
     * 返回主页
     */
    goHome() {
        this.endGame(true);
    },

    /**
     * 分享证书
     */
    shareCertificate() {
        UIManager.showToast('请使用浏览器的截图功能保存证书', 'info');
    },

    /**
     * 从表单保存题目
     */
    saveQuestionFromForm() {
        const elements = UIManager.elements;

        const question = {
            question: elements.formQuestion.value.trim(),
            options: [
                elements.formOptionA.value.trim(),
                elements.formOptionB.value.trim(),
                elements.formOptionC.value.trim()
            ],
            answer: elements.formAnswer.value,
            level: parseInt(elements.formLevel.value),
            hint: elements.formHint.value.trim()
        };

        // 验证
        if (!question.question) {
            UIManager.showToast('请输入题目内容', 'warning');
            return;
        }

        if (question.options.some(opt => !opt)) {
            UIManager.showToast('请填写所有选项', 'warning');
            return;
        }

        if (!question.answer) {
            UIManager.showToast('请选择正确答案', 'warning');
            return;
        }

        if (!question.level) {
            UIManager.showToast('请选择所属关卡', 'warning');
            return;
        }

        // 检查是否为编辑模式
        const editId = elements.managerAdd.dataset.editId;
        if (editId) {
            question.id = parseInt(editId);
            if (QuestionManager.updateQuestion(question.id, question)) {
                UIManager.showToast('题目已更新', 'success');
            } else {
                UIManager.showToast('更新失败', 'error');
                return;
            }
        } else {
            if (QuestionManager.addQuestion(question)) {
                UIManager.showToast('题目已添加', 'success');
            } else {
                UIManager.showToast('添加失败', 'error');
                return;
            }
        }

        // 刷新列表并返回
        UIManager.loadQuestionsList(elements.filterLevel?.value || 'all');
        UIManager.switchManagerTab('list');
    },

    /**
     * 获取游戏状态
     * @returns {Object} 游戏状态
     */
    getGameState() {
        return {
            currentLevel: this.currentLevel,
            currentQuestionIndex: this.currentQuestionIndex,
            gameData: { ...this.gameData },
            isProcessing: this.isProcessing
        };
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}
