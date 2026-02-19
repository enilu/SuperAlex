/**
 * 三国演义H5问答游戏 - 音频管理模块
 * 支持播放正确/错误音效和背景音乐
 */

const AudioManager = {
    // 音频对象
    sounds: {},
    questionAudio: null,
    bgm: null,

    // 状态
    isInitialized: false,
    isPlaying: false,
    isPlayingQuestion: false,
    currentBgm: null,
    currentQuestionId: null,
    questionAudioEnabled: false,

    /**
     * 初始化音频管理器
     */
    init() {
        if (this.isInitialized) {
            return;
        }

        // 加载设置
        const settings = CacheManager.loadSettings();
        this.soundEnabled = settings.sound !== false;
        this.musicEnabled = settings.music === true;
        this.questionAudioEnabled = settings.audio === true;

        // 创建音频对象
        this.sounds.correct = new Audio(GameConfig.AUDIO.correct);
        this.sounds.wrong = new Audio(GameConfig.AUDIO.wrong);
        this.sounds.bgm = new Audio(GameConfig.AUDIO.bgm);

        // 设置BGM循环播放
        this.sounds.bgm.loop = true;
        this.sounds.bgm.volume = 0.3; // 降低BGM音量

        this.isInitialized = true;
    },

    /**
     * 播放正确音效
     */
    playCorrect() {
        if (!this.soundEnabled) {
            return;
        }

        try {
            const sound = this.sounds.correct;
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn('Correct sound play failed:', error);
            });
        } catch (error) {
            console.error('AudioManager.playCorrect error:', error);
        }
    },

    /**
     * 播放错误音效
     */
    playWrong() {
        if (!this.soundEnabled) {
            return;
        }

        try {
            const sound = this.sounds.wrong;
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn('Wrong sound play failed:', error);
            });
        } catch (error) {
            console.error('AudioManager.playWrong error:', error);
        }
    },

    /**
     * 播放背景音乐
     */
    playBgm() {
        if (!this.musicEnabled) {
            return;
        }

        if (this.isPlaying) {
            return;
        }

        try {
            const bgm = this.sounds.bgm;
            bgm.play().then(() => {
                this.isPlaying = true;
                this.currentBgm = 'bgm';
            }).catch(error => {
                console.warn('BGM play failed:', error);
            });
        } catch (error) {
            console.error('AudioManager.playBgm error:', error);
        }
    },

    /**
     * 停止背景音乐
     */
    stopBgm() {
        if (!this.isPlaying) {
            return;
        }

        try {
            const bgm = this.sounds.bgm;
            bgm.pause();
            bgm.currentTime = 0;
            this.isPlaying = false;
            this.currentBgm = null;
        } catch (error) {
            console.error('AudioManager.stopBgm error:', error);
        }
    },

    /**
     * 暂停背景音乐
     */
    pauseBgm() {
        if (!this.isPlaying) {
            return;
        }

        try {
            const bgm = this.sounds.bgm;
            bgm.pause();
            this.isPlaying = false;
        } catch (error) {
            console.error('AudioManager.pauseBgm error:', error);
        }
    },

    /**
     * 恢复背景音乐
     */
    resumeBgm() {
        if (this.isPlaying || !this.musicEnabled) {
            return;
        }

        try {
            const bgm = this.sounds.bgm;
            bgm.play().then(() => {
                this.isPlaying = true;
            }).catch(error => {
                console.warn('BGM resume failed:', error);
            });
        } catch (error) {
            console.error('AudioManager.resumeBgm error:', error);
        }
    },

    /**
     * 设置音效开关
     * @param {boolean} enabled - 是否启用音效
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;

        // 保存设置
        const settings = CacheManager.loadSettings();
        settings.sound = enabled;
        CacheManager.saveSettings(settings);
    },

    /**
     * 设置音乐开关
     * @param {boolean} enabled - 是否启用音乐
     */
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;

        if (enabled) {
            this.playBgm();
        } else {
            this.stopBgm();
        }

        // 保存设置
        const settings = CacheManager.loadSettings();
        settings.music = enabled;
        CacheManager.saveSettings(settings);
    },

    /**
     * 设置题目语音开关
     * @param {boolean} enabled - 是否启用题目语音
     */
    setQuestionAudioEnabled(enabled) {
        this.questionAudioEnabled = enabled;

        if (!enabled && this.isPlayingQuestion) {
            this.stopQuestionAudio();
        }

        // 保存设置
        const settings = CacheManager.loadSettings();
        settings.audio = enabled;
        CacheManager.saveSettings(settings);
    },

    /**
     * 播放题目语音
     * @param {number} questionId - 题目ID
     */
    playQuestionAudio(questionId) {
        if (!this.questionAudioEnabled) {
            console.warn('Question audio is disabled');
            return;
        }

        // 停止当前正在播放的题目音频
        if (this.isPlayingQuestion) {
            this.stopQuestionAudio();
        }

        try {
            // 构造音频文件路径
            const audioPath = `assets/audio/questions/q${String(questionId).padStart(4, '0')}.mp3`;

            // 创建新的音频对象
            this.questionAudio = new Audio(audioPath);

            // 播放音频
            this.questionAudio.play().then(() => {
                this.isPlayingQuestion = true;
                this.currentQuestionId = questionId;

                // 更新按钮状态
                const btn = document.getElementById('btn-audio');
                if (btn) {
                    btn.classList.add('playing');
                }
            }).catch(error => {
                console.warn('Question audio play failed:', error);
                UIManager.showToast('音频播放失败，请检查音频文件是否存在', 'warning');
            });

            // 监听播放结束
            this.questionAudio.addEventListener('ended', () => {
                this.isPlayingQuestion = false;
                this.currentQuestionId = null;

                const btn = document.getElementById('btn-audio');
                if (btn) {
                    btn.classList.remove('playing');
                }
            }, { once: true });

            // 监听播放错误
            this.questionAudio.addEventListener('error', (e) => {
                console.error('Question audio error:', e);
                this.isPlayingQuestion = false;
                this.currentQuestionId = null;

                const btn = document.getElementById('btn-audio');
                if (btn) {
                    btn.classList.remove('playing');
                }

                UIManager.showToast('音频加载失败，请确保已生成音频文件', 'warning');
            }, { once: true });

        } catch (error) {
            console.error('AudioManager.playQuestionAudio error:', error);
        }
    },

    /**
     * 停止题目语音
     */
    stopQuestionAudio() {
        if (!this.isPlayingQuestion || !this.questionAudio) {
            return;
        }

        try {
            this.questionAudio.pause();
            this.questionAudio.currentTime = 0;
            this.isPlayingQuestion = false;
            this.currentQuestionId = null;

            const btn = document.getElementById('btn-audio');
            if (btn) {
                btn.classList.remove('playing');
            }
        } catch (error) {
            console.error('AudioManager.stopQuestionAudio error:', error);
        }
    },

    /**
     * 切换音效开关
     */
    toggleSound() {
        this.setSoundEnabled(!this.soundEnabled);
        return this.soundEnabled;
    },

    /**
     * 切换音乐开关
     */
    toggleMusic() {
        this.setMusicEnabled(!this.musicEnabled);
        return this.musicEnabled;
    },

    /**
     * 播放音效（通用方法）
     * @param {string} soundName - 音效名称
     */
    play(soundName) {
        if (!this.soundEnabled) {
            return;
        }

        if (soundName === 'correct') {
            this.playCorrect();
        } else if (soundName === 'wrong') {
            this.playWrong();
        } else if (this.sounds[soundName]) {
            try {
                const sound = this.sounds[soundName];
                sound.currentTime = 0;
                sound.play().catch(error => {
                    console.warn(`Sound ${soundName} play failed:`, error);
                });
            } catch (error) {
                console.error(`AudioManager.play(${soundName}) error:`, error);
            }
        }
    },

    /**
     * 停止所有音效
     */
    stopAll() {
        try {
            for (let key in this.sounds) {
                if (key !== 'bgm') {
                    const sound = this.sounds[key];
                    sound.pause();
                    sound.currentTime = 0;
                }
            }
            this.stopBgm();
            this.stopQuestionAudio();
        } catch (error) {
            console.error('AudioManager.stopAll error:', error);
        }
    },

    /**
     * 设置音量
     * @param {string} soundName - 音效名称（'bgm'或'sound'）
     * @param {number} volume - 音量（0-1）
     */
    setVolume(soundName, volume) {
        try {
            if (soundName === 'bgm' && this.sounds.bgm) {
                this.sounds.bgm.volume = Math.max(0, Math.min(1, volume));
            } else {
                for (let key in this.sounds) {
                    if (key !== 'bgm') {
                        this.sounds[key].volume = Math.max(0, Math.min(1, volume));
                    }
                }
            }
        } catch (error) {
            console.error('AudioManager.setVolume error:', error);
        }
    },

    /**
     * 获取音频状态
     * @returns {Object} 音频状态
     */
    getStatus() {
        return {
            soundEnabled: this.soundEnabled,
            musicEnabled: this.musicEnabled,
            questionAudioEnabled: this.questionAudioEnabled,
            isPlaying: this.isPlaying,
            isPlayingQuestion: this.isPlayingQuestion,
            currentBgm: this.currentBgm,
            currentQuestionId: this.currentQuestionId,
            isInitialized: this.isInitialized
        };
    },

    /**
     * 预加载音频
     * @returns {Promise} 加载完成的Promise
     */
    preload() {
        const promises = [];

        for (let key in this.sounds) {
            promises.push(new Promise((resolve, reject) => {
                const sound = this.sounds[key];
                sound.addEventListener('canplaythrough', () => resolve(), { once: true });
                sound.addEventListener('error', () => resolve(), { once: true }); // 即使失败也继续
                sound.load();
            }));
        }

        return Promise.all(promises);
    },

    /**
     * 销毁音频管理器
     */
    destroy() {
        this.stopAll();
        this.sounds = {};
        this.questionAudio = null;
        this.bgm = null;
        this.isInitialized = false;
        this.isPlaying = false;
        this.isPlayingQuestion = false;
        this.currentBgm = null;
        this.currentQuestionId = null;
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
