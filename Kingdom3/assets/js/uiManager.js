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
            btnAudio: document.getElementById('btn-audio'),
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
            togglePinyin: document.getElementById('toggle-pinyin'),
            toggleAudio: document.getElementById('toggle-audio'),
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
        // 保存当前问题对象，供拼音切换使用
        window.currentQuestion = question;

        // 更新题目编号
        if (this.elements.questionNumber) {
            this.elements.questionNumber.textContent = `题目 ${questionNum}`;
        }

        // 更新题目拼音（根据设置决定是否显示）
        if (this.elements.questionPinyin) {
            const settings = CacheManager.loadSettings();
            const showPinyin = settings.pinyin !== false;
            this.elements.questionPinyin.textContent = question.pinyin || '';
            this.elements.questionPinyin.style.display = showPinyin ? 'block' : 'none';
        }

        // 更新题目内容
        if (this.elements.questionContent) {
            this.elements.questionContent.textContent = question.question;
        }

        // 更新选项，带拼音
        if (this.elements.optionTextA) {
            const optionText = question.options[0];
            const pinyin = this.getPinyinForText(optionText);
            this.elements.optionTextA.innerHTML = `${optionText}<span class="option-pinyin">(${pinyin})</span>`;
        }
        if (this.elements.optionTextB) {
            const optionText = question.options[1];
            const pinyin = this.getPinyinForText(optionText);
            this.elements.optionTextB.innerHTML = `${optionText}<span class="option-pinyin">(${pinyin})</span>`;
        }
        if (this.elements.optionTextC) {
            const optionText = question.options[2];
            const pinyin = this.getPinyinForText(optionText);
            this.elements.optionTextC.innerHTML = `${optionText}<span class="option-pinyin">(${pinyin})</span>`;
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

        if (this.elements.togglePinyin) {
            this.elements.togglePinyin.checked = settings.pinyin !== false;
        }

        if (this.elements.toggleAudio) {
            this.elements.toggleAudio.checked = settings.audio === true;
        }
    },

    /**
     * 切换拼音显示
     * @param {boolean} show - 是否显示拼音
     */
    togglePinyin(show) {
        if (this.elements.questionPinyin) {
            this.elements.questionPinyin.style.display = show ? 'block' : 'none';
        }

        // 如果当前正在显示题目，重新显示以应用拼音设置
        const currentQuestion = this.elements.questionContent?.textContent;
        if (currentQuestion && this.elements.questionNumber) {
            // 触发重新显示当前题目
            const questionNum = this.elements.questionNumber.textContent.replace('题目 ', '');
            const totalText = this.elements.progressText?.textContent || '';
            const totalQuestions = parseInt(totalText.match(/\d+/)?.pop() || 5);

            // 从当前问题管理器获取问题
            if (window.currentQuestion) {
                this.showQuestion(window.currentQuestion, parseInt(questionNum), totalQuestions);
            }
        }
    },

    /**
 * 获取简化的汉字拼音字典
 * @returns {Object} 汉字拼音映射
 */
    getSimplePinyinDict() {
        return {
            '的': 'de', '一': 'yī', '是': 'shì', '在': 'zài', '不': 'bù', '了': 'le', '有': 'yǒu', '和': 'hé',
            '人': 'rén', '这': 'zhè', '中': 'zhōng', '大': 'dà', '为': 'wéi', '上': 'shàng', '个': 'gè',
            '国': 'guó', '我': 'wǒ', '以': 'yǐ', '要': 'yào', '他': 'tā', '时': 'shí', '来': 'lái',
            '用': 'yòng', '们': 'men', '生': 'shēng', '到': 'dào', '作': 'zuò', '地': 'dì', '于': 'yú',
            '出': 'chū', '就': 'jiù', '分': 'fēn', '对': 'duì', '成': 'chéng', '会': 'huì', '可': 'kě',
            '主': 'zhǔ', '发': 'fā', '年': 'nián', '动': 'dòng', '同': 'tóng', '工': 'gōng', '能': 'néng',
            '下': 'xià', '过': 'guò', '子': 'zǐ', '说': 'shuō', '产': 'chǎn', '种': 'zhǒng', '面': 'miàn',
            '而': 'ér', '方': 'fāng', '后': 'hòu', '多': 'duō', '定': 'dìng', '行': 'xíng', '学': 'xué',
            '法': 'fǎ', '所': 'suǒ', '民': 'mín', '得': 'dé', '经': 'jīng', '十': 'shí', '三': 'sān',
            '之': 'zhī', '进': 'jìn', '着': 'zhe', '等': 'děng', '部': 'bù', '度': 'dù', '家': 'jiā',
            '电': 'diàn', '力': 'lì', '里': 'lǐ', '如': 'rú', '水': 'shuǐ', '化': 'huà', '高': 'gāo',
            '自': 'zì', '二': 'èr', '理': 'lǐ', '起': 'qǐ', '小': 'xiǎo', '物': 'wù', '现': 'xiàn',
            '量': 'liàng', '都': 'dōu', '两': 'liǎng', '体': 'tǐ', '制': 'zhì', '机': 'jī', '当': 'dāng',
            '使': 'shǐ', '点': 'diǎn', '从': 'cóng', '业': 'yè', '本': 'běn', '去': 'qù', '把': 'bǎ',
            '性': 'xìng', '好': 'hǎo', '应': 'yīng', '开': 'kāi', '它': 'tā', '合': 'hé', '还': 'hái',
            '因': 'yīn', '由': 'yóu', '其': 'qí', '些': 'xiē', '然': 'rán', '前': 'qián', '外': 'wài',
            '天': 'tiān', '政': 'zhèng', '四': 'sì', '日': 'rì', '那': 'nà', '社': 'shè', '义': 'yì',
            '事': 'shì', '平': 'píng', '形': 'xíng', '相': 'xiāng', '全': 'quán', '表': 'biǎo',
            '间': 'jiān', '样': 'yàng', '与': 'yǔ', '关': 'guān', '各': 'gè', '重': 'zhòng', '新': 'xīn',
            '线': 'xiàn', '内': 'nèi', '数': 'shù', '正': 'zhèng', '心': 'xīn', '反': 'fǎn', '你': 'nǐ',
            '明': 'míng', '看': 'kàn', '原': 'yuán', '又': 'yòu', '么': 'me', '利': 'lì', '比': 'bǐ',
            '或': 'huò', '但': 'dàn', '质': 'zhì', '气': 'qì', '第': 'dì', '向': 'xiàng', '道': 'dào',
            '命': 'mìng', '此': 'cǐ', '变': 'biàn', '条': 'tiáo', '只': 'zhǐ', '没': 'méi', '结': 'jié',
            '解': 'jiě', '问': 'wèn', '意': 'yì', '建': 'jiàn', '月': 'yuè', '公': 'gōng', '无': 'wú',
            '系': 'xì', '军': 'jūn', '很': 'hěn', '情': 'qíng', '者': 'zhě', '最': 'zuì', '立': 'lì',
            '代': 'dài', '想': 'xiǎng', '已': 'yǐ', '通': 'tōng', '并': 'bìng', '提': 'tí', '直': 'zhí',
            '题': 'tí', '党': 'dǎng', '程': 'chéng', '展': 'zhǎn', '五': 'wǔ', '果': 'guǒ', '料': 'liào',
            '象': 'xiàng', '员': 'yuán', '革': 'gé', '位': 'wèi', '入': 'rù', '常': 'cháng', '文': 'wén',
            '总': 'zǒng', '次': 'cì', '品': 'pǐn', '式': 'shì', '活': 'huó', '设': 'shè', '及': 'jí',
            '管': 'guǎn', '特': 'tè', '件': 'jiàn', '长': 'zhǎng', '求': 'qiú', '老': 'lǎo', '头': 'tóu',
            '基': 'jī', '资': 'zī', '边': 'biān', '流': 'liú', '路': 'lù', '级': 'jí', '少': 'shǎo',
            '图': 'tú', '山': 'shān', '统': 'tǒng', '接': 'jiē', '知': 'zhī', '较': 'jiào', '将': 'jiāng',
            '组': 'zǔ', '见': 'jiàn', '计': 'jì', '别': 'bié', '她': 'tā', '角': 'jiǎo', '斯': 'sī',
            '根': 'gēn', '研': 'yán', '走': 'zǒu', '使': 'shǐ', '打': 'dǎ', '叫': 'jiào', '打': 'dá',
            '更': 'gèng', '呀': 'ya', '那': 'nà', '哈': 'hā', '呀': 'ya', '吗': 'ma', '啊': 'a',
            '吧': 'ba', '哦': 'ò', '额': 'é', '嗯': 'ǹ', '哇': 'wa', '呜': 'wū', '嘿': 'hēi',
            '喂': 'wèi', '哼': 'hēng', '哦': 'ó', '哎': 'āi', '呀': 'yā', '呕': 'ǒu', '哦': 'ò',
            '刘': 'liú', '关': 'guān', '张': 'zhāng', '赵': 'zhào', '钱': 'qián', '孙': 'sūn',
            '李': 'lǐ', '周': 'zhōu', '吴': 'wú', '郑': 'zhèng', '王': 'wáng', '冯': 'féng',
            '陈': 'chén', '褚': 'chǔ', '卫': 'wèi', '蒋': 'jiǎng', '沈': 'shěn', '韩': 'hán',
            '杨': 'yáng', '秦': 'qín', '朱': 'zhū', '楚': 'chǔ', '汉': 'hàn', '蜀': 'shǔ',
            '魏': 'wèi', '晋': 'jìn', '隋': 'suí', '唐': 'táng', '宋': 'sòng', '元': 'yuán',
            '明': 'míng', '清': 'qīng', '三': 'sān', '国': 'guó', '演': 'yǎn', '义': 'yì',
            '诸': 'zhū', '葛': 'gě', '孔': 'kǒng', '孟': 'mèng', '老': 'lǎo', '庄': 'zhuāng',
            '司': 'sī', '马': 'mǎ', '诸': 'zhū', '夏': 'xià', '侯': 'hóu', '曹': 'cáo',
            '黄': 'huáng', '袁': 'yuán', '公': 'gōng', '孙': 'sūn', '孙': 'sūn', '策': 'cè',
            '周': 'zhōu', '瑜': 'yú', '鲁': 'lǔ', '肃': 'sù', '吕': 'lǚ', '布': 'bù',
            '貂': 'diāo', '蝉': 'chán', '董': 'dǒng', '卓': 'zhuó', '何': 'hé', '进': 'jìn',
            '丁': 'dīng', '原': 'yuán', '庞': 'páng', '统': 'tǒng', '马': 'mǎ', '超': 'chāo',
            '张': 'zhāng', '飞': 'fēi', '赵': 'zhào', '云': 'yún', '孙': 'sūn', '权': 'quán',
            '甘': 'gān', '露': 'lù', '糜': 'mí', '夫人': 'fū ren', '丈': 'zhàng', '八': 'bā',
            '蛇': 'shé', '矛': 'máo', '青': 'qīng', '龙': 'lóng', '偃': 'yǎn', '月': 'yuè',
            '刀': 'dāo', '赤': 'chì', '兔': 'tù', '马': 'mǎ', '方': 'fāng', '天': 'tiān',
            '画': 'huà', '戟': 'jǐ', '方': 'fāng', '天': 'tiān', '画': 'huà', '戟': 'jǐ',
            '美': 'měi', '人': 'rén', '计': 'jì', '连': 'lián', '环': 'huán', '计': 'jì',
            '桃': 'táo', '园': 'yuán', '三': 'sān', '结': 'jié', '义': 'yì', '五': 'wǔ',
            '虎': 'hǔ', '将': 'jiàng', '五': 'wǔ', '子': 'zǐ', '良': 'liáng', '将': 'jiàng',
            '赤': 'chì', '壁': 'bì', '之': 'zhī', '战': 'zhàn', '官': 'guān', '渡': 'dù',
            '之': 'zhī', '战': 'zhàn', '夷': 'yí', '陵': 'líng', '之': 'zhī', '战': 'zhàn',
            '长': 'cháng', '坂': 'bǎn', '坡': 'pō', '之': 'zhī', '战': 'zhàn', '街': 'jiē',
            '亭': 'tíng', '失': 'shī', '守': 'shǒu', '空': 'kōng', '城': 'chéng', '计': 'jì',
            '草': 'cǎo', '船': 'chuán', '借': 'jiè', '箭': 'jiàn', '七': 'qī', '擒': 'qín',
            '七': 'qī', '纵': 'zòng', '刮': 'guā', '骨': 'gǔ', '疗': 'liáo', '毒': 'dú',
            '单': 'dān', '刀': 'dāo', '赴': 'fù', '会': 'huì', '水': 'shuǐ', '淹': 'yān',
            '七': 'qī', '军': 'jūn', '败': 'bài', '走': 'zǒu', '麦': 'mài', '城': 'chéng',
            '过': 'guò', '五': 'wǔ', '关': 'guān', '斩': 'zhǎn', '六': 'liù', '将': 'jiàng',
            '温': 'wēn', '酒': 'jiǔ', '斩': 'zhǎn', '华': 'huà', '雄': 'xióng', '三': 'sān',
            '英': 'yīng', '战': 'zhàn', '吕': 'lǚ', '布': 'bù', '三': 'sān', '顾': 'gù',
            '茅': 'máo', '庐': 'lú', '隆': 'lóng', '中': 'zhōng', '对': 'duì', '联': 'lián',
            '吴': 'wú', '抗': 'kàng', '曹': 'cáo', '魏': 'wèi', '八': 'bā', '阵': 'zhèn',
            '图': 'tú', '木': 'mù', '牛': 'niú', '流': 'liú', '马': 'mǎ', '舌': 'shé',
            '战': 'zhàn', '群': 'qún', '儒': 'rú', '智': 'zhì', '取': 'qǔ', '汉': 'hàn',
            '中': 'zhōng', '汉': 'hàn', '寿': 'shòu', '亭': 'tíng', '侯': 'hóu', '五': 'wǔ',
            '虎': 'hǔ', '上': 'shàng', '将': 'jiàng', '武': 'wǔ', '圣': 'shèng', '关': 'guān',
            '公': 'gōng', '忠': 'zhōng', '义': 'yì', '千': 'qiān', '秋': 'qiū', '义': 'yì',
            '薄': 'báo', '云': 'yún', '天': 'tiān', '智': 'zhì', '绝': 'jué', '义': 'yì',
            '绝': 'jué', '武': 'wǔ', '绝': 'jué', '乱': 'luàn', '世': 'shì', '奸': 'jiān',
            '雄': 'xióng', '治': 'zhì', '世': 'shì', '能': 'néng', '臣': 'chén', '既': 'jì',
            '生': 'shēng', '瑜': 'yú', '何': 'hé', '生': 'shēng', '亮': 'liàng', '生': 'shēng',
            '子': 'zǐ', '虚': 'xū', '乌': 'wū', '有': 'yǒu', '先': 'xiān', '主': 'zhǔ',
            '章': 'zhāng', '武': 'wǔ', '烈': 'liè', '祖': 'zǔ', '昭': 'zhāo', '烈': 'liè',
            '皇': 'huáng', '帝': 'dì', '汉': 'hàn', '怀': 'huái', '帝': 'dì', '后': 'hòu',
            '主': 'zhǔ', '刘': 'liú', '禅': 'shàn', '阿': 'ā', '斗': 'dòu', '扶': 'fú',
            '风': 'fēng', '关': 'guān', '平': 'píng', '关': 'guān', '兴': 'xīng', '张': 'zhāng',
            '苞': 'bāo', '关': 'guān', '索': 'suǒ', '关': 'guān', '银': 'yín', '屏': 'píng',
            '赵': 'zhào', '统': 'tǒng', '赵': 'zhào', '广': 'guǎng', '马': 'mǎ', '岱': 'dài',
            '王': 'wáng', '平': 'píng', '句': 'gōu', '扶': 'fú', '张': 'zhāng', '翼': 'yì',
            '张': 'zhāng', '嶷': 'nì', '张': 'zhāng', '苞': 'bāo', '诸葛': 'zhū gě', '瞻': 'zhān',
            '诸葛': 'zhū gě', '尚': 'shàng', '诸葛': 'zhū gě', '京': 'jīng', '邓': 'dèng',
            '忠': 'zhōng', '邓': 'dèng', '艾': 'ài', '邓': 'dèng', '芝': 'zhī', '邓': 'dèng',
            '贤': 'xián', '姜': 'jiāng', '维': 'wéi', '蒋': 'jiǎng', '琬': 'wǎn', '费': 'fèi',
            '祎': 'yī', '董': 'dǒng', '允': 'yǔn', '董': 'dǒng', '和': 'hé', '黄': 'huáng',
            '权': 'quán', '黄': 'huáng', '盖': 'gài', '程': 'chéng', '普': 'pǔ', '韩': 'hán',
            '当': 'dāng', '周': 'zhōu', '泰': 'tài', '蒋': 'jiǎng', '钦': 'qīn', '潘': 'pān',
            '璋': 'zhāng', '朱': 'zhū', '然': 'rán', '朱': 'zhū', '桓': 'huán', '陆': 'lù',
            '逊': 'xùn', '陆': 'lù', '抗': 'kàng', '步': 'bù', '骘': 'zhì', '张': 'zhāng',
            '昭': 'zhāo', '张': 'zhāng', '纮': 'hóng', '顾': 'gù', '雍': 'yōng', '顾': 'gù',
            '邵': 'shào', '阚': 'kàn', '泽': 'zé', '严': 'yán', '畯': 'jùn', '张': 'zhāng',
            '承': 'chéng', '张': 'zhāng', '休': 'xiū', '虞': 'yú', '翻': 'fān', '凌': 'líng',
            '统': 'tǒng', '凌': 'líng', '操': 'cāo', '徐': 'xú', '盛': 'shèng', '骆': 'luò',
            '统': 'tǒng', '甘': 'gān', '宁': 'níng', '凌': 'líng', '统': 'tǒng', '凌': 'líng',
            '统': 'tǒng', '夏': 'xià', '侯': 'hóu', '惇': 'dūn', '夏': 'xià', '侯': 'hóu',
            '渊': 'yuān', '夏': 'xià', '侯': 'hóu', '霸': 'bà', '夏': 'xià', '侯': 'hóu',
            '恩': 'ēn', '曹': 'cáo', '仁': 'rén', '曹': 'cáo', '洪': 'hóng', '曹': 'cáo',
            '彰': 'zhāng', '曹': 'cáo', '真': 'zhēn', '曹': 'cáo', '休': 'xiū', '曹': 'cáo',
            '纯': 'chún', '曹': 'cáo', '丕': 'pī', '曹': 'cáo', '叡': 'ruì', '曹': 'cáo',
            '髦': 'máo', '曹': 'cáo', '奂': 'huàn', '司马': 'sī mǎ', '懿': 'yì', '司马': 'sī mǎ',
            '师': 'shī', '司马': 'sī mǎ', '昭': 'zhāo', '司马': 'sī mǎ', '炎': 'yán', '司': 'sī',
            '马': 'mǎ', '孚': 'fú', '司': 'sī', '马': 'mǎ', '朗': 'lǎng', '司': 'sī',
            '孚': 'fú', '司': 'sī', '马': 'mǎ', '进': 'jìn', '许': 'xǔ', '褚': 'chǔ', '典': 'diǎn',
            '韦': 'wéi', '庞': 'páng', '德': 'dé', '张': 'zhāng', '郃': 'gé', '徐': 'xú',
            '晃': 'huǎng', '张': 'zhāng', '辽': 'liáo', '李': 'lǐ', '典': 'diǎn', '乐': 'yuè',
            '进': 'jìn', '臧': 'zāng', '霸': 'bà', '文': 'wén', '聘': 'pìn', '郭': 'guō',
            '淮': 'huái', '王': 'wáng', '双': 'shuāng', '秦': 'qín', '朗': 'lǎng', '胡': 'hú',
            '班': 'bān', '句': 'jù', '安': 'ān', '朱': 'zhū', '褒': 'bāo', '雷': 'léi',
            '铜': 'tóng', '丁': 'dīng', '奉': 'fèng', '陈': 'chén', '武': 'wǔ', '潘': 'pān',
            '璋': 'zhāng', '董': 'dǒng', '袭': 'xí', '甘': 'gān', '宁': 'níng', '凌': 'líng',
            '统': 'tǒng', '徐': 'xú', '盛': 'shèng', '蒋': 'jiǎng', '钦': 'qīn', '丁': 'dīng',
            '奉': 'fèng', '钟': 'zhōng', '离': 'lí', '斐': 'fēi', '太': 'tài', '史': 'shǐ',
            '慈': 'cí', '吕': 'lǚ', '蒙': 'méng', '陆': 'lù', '逊': 'xùn', '陆': 'lù', '抗': 'kàng',
            '步': 'bù', '骘': 'zhì', '张': 'zhāng', '昭': 'zhāo', '张': 'zhāng', '纮': 'hóng',
            '顾': 'gù', '雍': 'yōng', '顾': 'gù', '邵': 'shào', '阚': 'kàn', '泽': 'zé',
            '严': 'yán', '畯': 'jùn', '张': 'zhāng', '承': 'chéng', '张': 'zhāng', '休': 'xiū',
            '虞': 'yú', '翻': 'fān', '凌': 'líng', '统': 'tǒng', '徐': 'xú', '盛': 'shèng',
            '骆': 'luò', '统': 'tǒng', '甘': 'gān', '宁': 'níng', '凌': 'líng', '统': 'tǒng',
            '凌': 'líng', '操': 'cāo', '朱': 'zhū', '然': 'rán', '朱': 'zhū', '桓': 'huán',
            '全': 'quán', '综': 'zōng', '卫': 'wèi', '温': 'wēn', '吾': 'wú', '彦': 'yàn',
            '薛': 'xuē', '莹': 'yíng', '华': 'huà', '核': 'hé', '楼': 'lóu', '玄': 'xuán',
            '贺': 'hè', '邵': 'shào', '滕': 'téng', '修': 'xiū', '陶': 'táo', '璜': 'huáng',
            '谷': 'gǔ', '利': 'lì', '高': 'gāo', '达': 'dá', '蔡': 'cài', '款': 'kuǎn',
            '李': 'lǐ', '勖': 'xù', '冯': 'féng', '紞': 'dǎn', '山': 'shān', '涛': 'tāo',
            '王': 'wáng', '济': 'jì', '杜': 'dù', '预': 'yù', '王': 'wáng', '浑': 'hún',
            '王': 'wáng', '濬': 'jùn', '张': 'zhāng', '华': 'huá', '陈': 'chén', '骞': 'qiān',
            '贾': 'jiǎ', '充': 'chōng', '荀': 'xún', '勖': 'xù', '冯': 'féng', '紞': 'dǎn',
            '和': 'hé', '峤': 'qiáo', '羊': 'yáng', '祜': 'hù', '杜': 'dù', '预': 'yù',
            '王': 'wáng', '濬': 'jùn', '何': 'hé', '曾': 'céng', '石': 'shí', '苞': 'bāo',
            '郑': 'zhèng', '冲': 'chōng', '王': 'wáng', '祥': 'xiáng', '荀': 'xún', '顗': 'yǐ',
            '冯': 'féng', '翊': 'yì', '太': 'tài', '守': 'shǒu', '令': 'lìng', '尹': 'yǐn',
            '校': 'xiào', '尉': 'wèi', '都': 'dū', '护': 'hù', '将': 'jiàng', '军': 'jūn',
            '太': 'tài', '守': 'shǒu', '刺': 'cì', '史': 'shǐ', '丞': 'chéng', '相': 'xiàng',
            '司': 'sī', '徒': 'tú', '司': 'sī', '空': 'kōng', '太': 'tài', '尉': 'wèi',
            '尚': 'shàng', '书': 'shū', '中': 'zhōng', '郎': 'láng', '将': 'jiàng', '御': 'yù',
            '史': 'shǐ', '大': 'dà', '夫': 'fū', '光': 'guāng', '禄': 'lù', '勋': 'xūn',
            '大': 'dà', '鸿': 'hóng', '胪': 'lú', '宗': 'zōng', '正': 'zhèng', '太': 'tài',
            '仆': 'pú', '廷': 'tíng', '尉': 'wèi', '大': 'dà', '司': 'sī', '农': 'nóng',
            '少': 'shào', '府': 'fǔ', '九': 'jiǔ', '卿': 'qīng', '三': 'sān', '公': 'gōng',
            '太': 'tài', '傅': 'fù', '太': 'tài', '师': 'shī', '太': 'tài', '保': 'bǎo',
            '少': 'shào', '傅': 'fù', '少': 'shào', '师': 'shī', '少': 'shào', '保': 'bǎo',
            '五': 'wǔ', '常': 'cháng', '仁': 'rén', '义': 'yì', '礼': 'lǐ', '智': 'zhì',
            '信': 'xìn', '四': 'sì', '维': 'wéi', '礼': 'lǐ', '义': 'yì', '廉': 'lián',
            '耻': 'chǐ', '八': 'bā', '德': 'dé', '忠': 'zhōng', '孝': 'xiào', '仁': 'rén',
            '爱': 'ài', '信': 'xìn', '义': 'yì', '和': 'hé', '平': 'píng', '十': 'shí',
            '义': 'yì', '忠': 'zhōng', '孝': 'xiào', '悌': 'tì', '信': 'xìn',
            '礼': 'lǐ', '义': 'yì', '廉': 'lián', '耻': 'chǐ', '谨': 'jǐn', '让': 'ràng',
            '五': 'wǔ', '伦': 'lún', '君': 'jūn', '臣': 'chén', '父': 'fù', '子': 'zǐ',
            '夫': 'fū', '妻': 'qī', '兄': 'xiōng', '弟': 'dì', '友': 'yǒu', '长': 'zhǎng',
            '幼': 'yòu', '序': 'xù', '群': 'qún', '伦': 'lún', '十': 'shí', '纪': 'jì',
            '父': 'fù', '亲': 'qīn', '子': 'zǐ', '贵': 'guì', '正': 'zhèng', '君': 'jūn',
            '臣': 'chén', '义': 'yì', '正': 'zhèng', '夫妇': 'fū fù', '顺': 'shùn', '长': 'zhǎng',
            '幼': 'yòu', '序': 'xù', '友': 'yǒu', '兄弟': 'xiōng dì', '正': 'zhèng', '朋友': 'péng you',
            '信': 'xìn', '正': 'zhèng', '宾': 'bīn', '客': 'kè', '敬': 'jìng', '正': 'zhèng', '国': 'guó',
            '家': 'jiā', '交': 'jiāo', '正': 'zhèng', '社': 'shè', '会': 'huì', '和': 'hé', '正': 'zhèng',
            '四': 'sì', '端': 'duān', '仁': 'rén', '义': 'yì', '礼': 'lǐ', '智': 'zhì',
            '五': 'wǔ', '常': 'cháng', '仁': 'rén', '义': 'yì', '礼': 'lǐ', '智': 'zhì',
            '信': 'xìn', '七': 'qī', '情': 'qíng', '喜': 'xǐ', '怒': 'nù', '哀': 'āi',
            '惧': 'jù', '爱': 'ài', '恶': 'wù', '欲': 'yù', '六': 'liù', '谷': 'gǔ',
            '稻': 'dào', '粱': 'liáng', '菽': 'shū', '麦': 'mài', '黍': 'shǔ', '稷': 'jì',
            '六': 'liù', '畜': 'chù', '马': 'mǎ', '牛': 'niú', '羊': 'yáng', '鸡': 'jī',
            '犬': 'quǎn', '豕': 'shǐ', '十': 'shí', '干': 'gān', '甲': 'jiǎ', '乙': 'yǐ',
            '丙': 'bǐng', '丁': 'dīng', '戊': 'wù', '己': 'jǐ', '庚': 'gēng', '辛': 'xīn',
            '壬': 'rén', '癸': 'guǐ', '十': 'shí', '二': 'èr', '支': 'zhī', '子': 'zǐ',
            '丑': 'chǒu', '寅': 'yín', '卯': 'mǎo', '辰': 'chén', '巳': 'sì', '午': 'wǔ',
            '未': 'wèi', '申': 'shēn', '酉': 'yǒu', '戌': 'xū', '亥': 'hài', '十': 'shí',
            '二': 'èr', '肖': 'xiāo', '鼠': 'shǔ', '牛': 'niú', '虎': 'hǔ', '兔': 'tù',
            '龙': 'lóng', '蛇': 'shé', '马': 'mǎ', '羊': 'yáng', '猴': 'hóu', '鸡': 'jī',
            '狗': 'gǒu', '猪': 'zhū', '二': 'èr', '十': 'shí', '四': 'sì', '节': 'jié',
            '气': 'qì', '立': 'lì', '春': 'chūn', '雨': 'yǔ', '水': 'shuǐ', '惊': 'jīng',
            '蛰': 'zhé', '春': 'chūn', '分': 'fēn', '清': 'qīng', '明': 'míng', '谷': 'gǔ',
            '雨': 'yǔ', '立': 'lì', '夏': 'xià', '小': 'xiǎo', '满': 'mǎn', '芒': 'máng',
            '种': 'zhǒng', '夏': 'xià', '至': 'zhì', '小': 'xiǎo', '暑': 'shǔ', '大': 'dà',
            '暑': 'shǔ', '立': 'lì', '秋': 'qiū', '处': 'chǔ', '暑': 'shǔ', '白': 'bái',
            '露': 'lù', '秋': 'qiū', '分': 'fēn', '寒': 'hán', '露': 'lù', '霜': 'shuāng',
            '降': 'jiàng', '立': 'lì', '冬': 'dōng', '小': 'xiǎo', '雪': 'xuě', '大': 'dà',
            '雪': 'xuě', '冬': 'dōng', '至': 'zhì', '小': 'xiǎo', '寒': 'hán', '大': 'dà',
            '寒': 'hán'
        };
    },

    /**
     * 根据文本获取拼音
     * @param {string} text - 要转换的文本
     * @returns {string} 拼音字符串
     */
    getPinyinForText(text) {
        if (!text) return '';

        const pinyinDict = this.getSimplePinyinDict();
        let result = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            // 如果是汉字，则转换为拼音，否则保留原字符
            const pinyin = pinyinDict[char];
            if (pinyin) {
                result += pinyin;
            } else {
                // 如果不是汉字或者没有找到对应拼音，则保留原字符
                result += char;
            }

            // 在字符之间添加空格，除了最后一个字符
            if (i < text.length - 1) {
                result += ' ';
            }
        }

        return result.trim();
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
