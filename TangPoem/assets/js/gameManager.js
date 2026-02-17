import { CONFIG } from './config.js';
import { PoemManager } from './poemManager.js';
import { ProgressManager } from './progressManager.js';
import { UIManager } from './uiManager.js';
import { switchScreen } from './app.js';

const GameManager = {
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    isAnswering: false,
    selectedPoems: new Set(),
    currentFilter: 'all',
    currentFilteredPoems: [],

    startGameMode(customPoems = null) {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.isAnswering = false;
        this.generateQuestions(customPoems);
        this.showQuestion();
    },

    generateQuestions(customPoems = null) {
        // 如果传入了自定义诗词列表，使用自定义的；否则使用随机诗词
        let poems = customPoems;
        if (!poems || poems.length === 0) {
            poems = PoemManager.getRandomPoems(CONFIG.TOTAL_QUESTIONS);
        }

        this.questions = [];

        poems.forEach(poem => {
            const questionCount = 1;
            for (let i = 0; i < questionCount && this.questions.length < CONFIG.TOTAL_QUESTIONS; i++) {
                this.questions.push(this.generateFillBlankQuestion(poem));
            }
        });

        while (this.questions.length < CONFIG.TOTAL_QUESTIONS) {
            const randomPoem = poems[Math.floor(Math.random() * poems.length)];
            this.questions.push(this.generateFillBlankQuestion(randomPoem));
        }

        this.questions.sort(() => Math.random() - 0.5);
    },

    generateFillBlankQuestion(poem) {
        const lineIndex = Math.floor(Math.random() * poem.content.length);
        const line = poem.content[lineIndex];
        const text = line.text;
        const pinyin = line.pinyin;
        const blankIndex = Math.floor(Math.random() * text.length);
        const correctAnswer = text[blankIndex];
        const questionText = text.substring(0, blankIndex) + '___' + text.substring(blankIndex + 1);

        // 生成对应的填空拼音
        const pinyinArray = pinyin.split(' ');
        const questionPinyin = pinyinArray.map((py, index) => index === blankIndex ? '___' : py).join(' ');

        const options = this.generateOptions(correctAnswer, poem);

        return {
            poemId: poem.id,
            poemTitle: poem.title,
            questionText: questionText,
            questionPinyin: questionPinyin,
            correctAnswer: correctAnswer,
            options: options,
            lineIndex: lineIndex
        };
    },

    generateOptions(correctAnswer, poem) {
        const options = [correctAnswer];
        const allChars = new Set();

        poem.content.forEach(line => {
            for (const char of line.text) {
                if (char !== correctAnswer) {
                    allChars.add(char);
                }
            }
        });

        const charsArray = Array.from(allChars);
        while (options.length < CONFIG.BLANK_CONFIG.OPTIONS_COUNT && charsArray.length > 0) {
            const randomIndex = Math.floor(Math.random() * charsArray.length);
            const randomChar = charsArray.splice(randomIndex, 1)[0];

            if (!options.includes(randomChar)) {
                options.push(randomChar);
            }
        }

        const commonChars = '的了一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她角斯根研走使打';
        let index = 0;
        while (options.length < CONFIG.BLANK_CONFIG.OPTIONS_COUNT && index < commonChars.length) {
            const char = commonChars[index];
            if (!options.includes(char)) {
                options.push(char);
            }
            index++;
        }

        return options.sort(() => Math.random() - 0.5);
    },

    showQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        UIManager.updateProgress(this.currentQuestionIndex + 1, CONFIG.TOTAL_QUESTIONS);
        UIManager.updateScore(this.score);

        document.getElementById('poemHint').textContent = '《' + question.poemTitle + '》';
        document.getElementById('questionPinyin').textContent = question.questionPinyin;
        document.getElementById('questionText').textContent = question.questionText;

        const optionsContainer = document.getElementById('answerOptions');
        optionsContainer.innerHTML = question.options.map(option =>
            '<button class="option-btn" data-answer="' + option + '">' + option + '</button>'
        ).join('');

        this.bindOptionEvents(question);
    },

    bindOptionEvents(question) {
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isAnswering) return;
                this.handleAnswer(btn, question);
            });
        });
    },

    handleAnswer(button, question) {
        this.isAnswering = true;
        const selectedAnswer = button.dataset.answer;
        const isCorrect = selectedAnswer === question.correctAnswer;

        if (isCorrect) {
            this.score += CONFIG.POINTS_PER_QUESTION;
            this.correctCount++;
            UIManager.highlightAnswer(button, true);
            ProgressManager.updateProgress(question.poemId, 'correct');
        } else {
            this.wrongCount++;
            UIManager.highlightAnswer(button, false);
            UIManager.showFeedback(false, '正确答案是：' + question.correctAnswer);
            ProgressManager.updateProgress(question.poemId, 'wrong');
        }

        if (isCorrect) {
            UIManager.showFeedback(true);
        }

        UIManager.disableAllButtons();

        setTimeout(() => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex >= this.questions.length) {
                this.showResult();
            } else {
                this.isAnswering = false;
                this.showQuestion();
            }
        }, 1500);
    },

    showResult() {
        const totalScore = this.questions.length * CONFIG.POINTS_PER_QUESTION;
        const percentage = (this.score / totalScore) * 100;
        let rank = CONFIG.RANKS[CONFIG.RANKS.length - 1];

        for (const r of CONFIG.RANKS) {
            if (percentage >= r.minScore) {
                rank = r;
                break;
            }
        }

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('correctCount').textContent = this.correctCount;
        document.getElementById('wrongCount').textContent = this.wrongCount;
        document.getElementById('resultRank').textContent = rank.title;
        document.getElementById('resultMessage').textContent = rank.message;

        const starsContainer = document.getElementById('resultStars');
        starsContainer.innerHTML = '';
        for (let i = 0; i < rank.stars; i++) {
            starsContainer.innerHTML += '<span class="star">⭐</span>';
        }

        if (this.score === totalScore) {
            ProgressManager.checkAchievement('PERFECT_SCORE');
        }

        switchScreen('result');
    },

    startReviewMode() {
        const reviewPoems = ProgressManager.getReviewPoems();
        if (reviewPoems.length === 0) return;

        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.isAnswering = false;
        this.generateReviewQuestions(reviewPoems);
        switchScreen('game');
        this.showQuestion();
    },

    generateReviewQuestions(reviewPoems) {
        this.questions = [];
        reviewPoems.forEach(poem => {
            this.questions.push(this.generateFillBlankQuestion(poem));
        });
        this.questions.sort(() => Math.random() - 0.5);
    },

    // ==================== 闯关诗词选择功能 ====================

    initGameCatalog() {
        const catalogBtn = document.getElementById('gameCatalogBtn');
        const catalogClose = document.getElementById('gameCatalogClose');
        const catalogOverlay = document.getElementById('gameCatalogOverlay');
        const selectAllBtn = document.getElementById('selectAllBtn');
        const deselectAllBtn = document.getElementById('deselectAllBtn');
        const startSelectedGame = document.getElementById('startSelectedGame');

        if (catalogBtn) {
            catalogBtn.addEventListener('click', () => this.openGameCatalog());
        }

        if (catalogClose) {
            catalogClose.addEventListener('click', () => this.closeGameCatalog());
        }

        if (catalogOverlay) {
            catalogOverlay.addEventListener('click', () => this.closeGameCatalog());
        }

        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllPoems());
        }

        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => this.deselectAllPoems());
        }

        if (startSelectedGame) {
            startSelectedGame.addEventListener('click', () => this.startSelectedGameMode());
        }

        // 筛选按钮事件
        const filterButtons = document.querySelectorAll('#gameCatalogModal .filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const grade = e.target.dataset.grade;
                this.filterGameCatalog(grade);

                // 更新激活状态
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 初始渲染目录
        this.renderGameCatalog();
    },

    openGameCatalog() {
        const catalogModal = document.getElementById('gameCatalogModal');
        if (catalogModal) {
            catalogModal.classList.remove('hidden');
            this.renderGameCatalog();
        }
    },

    closeGameCatalog() {
        const catalogModal = document.getElementById('gameCatalogModal');
        if (catalogModal) {
            catalogModal.classList.add('hidden');
        }
    },

    renderGameCatalog(filter = 'all') {
        const catalogList = document.getElementById('gameCatalogList');
        if (!catalogList) return;

        let filteredPoems = PoemManager.getAllPoems();

        if (filter !== 'all') {
            filteredPoems = filteredPoems.filter(poem => {
                const grade = poem.grade || '';
                if (filter === '初中') {
                    return grade.includes('初中') || grade.includes('初一') || grade.includes('初二') || grade.includes('初三');
                } else if (filter === '高中') {
                    return grade.includes('高中') || grade.includes('高一') || grade.includes('高二') || grade.includes('高三');
                } else {
                    return grade.includes(filter);
                }
            });
        }

        // 保存当前筛选的诗词列表
        this.currentFilteredPoems = filteredPoems;

        if (filteredPoems.length === 0) {
            catalogList.innerHTML = `
                <div class="catalog-empty">
                    <div class="catalog-empty-icon">📭</div>
                    <p>暂无该年级的唐诗</p>
                </div>
            `;
            return;
        }

        catalogList.innerHTML = filteredPoems.map(poem => {
            const isSelected = this.selectedPoems.has(poem.id);
            return `
            <div class="catalog-item ${isSelected ? 'selected' : ''}" data-id="${poem.id}">
                <div class="catalog-item-number">${poem.id}</div>
                <div class="catalog-item-info">
                    <div class="catalog-item-title">${poem.title}</div>
                    <div class="catalog-item-meta">
                        <span class="catalog-item-author">${poem.author}</span>
                        <span class="catalog-item-grade">${poem.grade || '未分类'}</span>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        // 添加点击事件
        catalogList.querySelectorAll('.catalog-item').forEach(item => {
            item.addEventListener('click', () => {
                const poemId = parseInt(item.dataset.id);
                this.togglePoemSelection(poemId);
            });
        });

        this.updateSelectedCount();
    },

    filterGameCatalog(grade) {
        this.currentFilter = grade;
        this.renderGameCatalog(grade);
    },

    togglePoemSelection(poemId) {
        if (this.selectedPoems.has(poemId)) {
            this.selectedPoems.delete(poemId);
        } else {
            this.selectedPoems.add(poemId);
        }
        this.renderGameCatalog(this.currentFilter);
    },

    selectAllPoems() {
        // 只选择当前筛选范围内的诗词
        this.currentFilteredPoems.forEach(poem => this.selectedPoems.add(poem.id));
        this.renderGameCatalog(this.currentFilter);
    },

    deselectAllPoems() {
        // 只取消选择当前筛选范围内的诗词
        this.currentFilteredPoems.forEach(poem => this.selectedPoems.delete(poem.id));
        this.renderGameCatalog(this.currentFilter);
    },

    updateSelectedCount() {
        const countEl = document.getElementById('selectedCount');
        const startBtn = document.getElementById('startSelectedGame');
        if (countEl) {
            countEl.textContent = this.selectedPoems.size;
        }
        if (startBtn) {
            startBtn.disabled = this.selectedPoems.size === 0;
        }
    },

    startSelectedGameMode() {
        if (this.selectedPoems.size === 0) return;

        const selectedPoemObjects = Array.from(this.selectedPoems).map(id =>
            PoemManager.getPoemById(id)
        ).filter(poem => poem !== undefined);

        if (selectedPoemObjects.length > 0) {
            this.closeGameCatalog();
            this.startGameMode(selectedPoemObjects);
        }
    }
};

export { GameManager };
