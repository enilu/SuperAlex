/**
 * 三国演义H5问答游戏 - 音频管理模块
 * 支持播放正确/错误音效和背景音乐
 */

const AudioManager = {
    // 音频对象
    sounds: {},
    bgm: null,

    // 状态
    isInitialized: false,
    isPlaying: false,
    currentBgm: null,

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
            isPlaying: this.isPlaying,
            currentBgm: this.currentBgm,
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
        this.bgm = null;
        this.isInitialized = false;
        this.isPlaying = false;
        this.currentBgm = null;
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
