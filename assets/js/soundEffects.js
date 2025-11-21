// 晨光冲锋队 - 音效管理模块

/**
 * 音效管理类，负责处理游戏中的各种音效，支持从文件加载和Web Audio API生成
 */
class SoundEffectsManager {
    constructor() {
        this.sounds = {}; // 存储加载的音效文件
        this.audioBuffers = {}; // 存储AudioBuffer对象
        this.isMuted = false;
        this.currentSoundPack = 'default'; // 当前使用的音效包
        this.soundBasePath = '../assets/sounds/'; // 音效文件基础路径
        this.initializeSounds();
    }

    /**
     * 初始化音效系统
     */
    initializeSounds() {
        // 使用Web Audio API创建音效
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 预定义的音效频率和持续时间（作为后备方案）
            this.soundPresets = {
                click: { frequency: 880, duration: 0.05, type: 'sine' },
                success: { frequency: 880, duration: 0.2, type: 'sine', slide: -300 },
                error: { frequency: 330, duration: 0.2, type: 'sawtooth' },
                countdown: { frequency: 660, duration: 0.1, type: 'square' },
                celebration: { frequency: 880, duration: 0.3, type: 'sine', slide: -100 }
            };
            
            // 尝试加载默认音效包
            this.loadSoundPack(this.currentSoundPack);
        } catch (error) {
            console.warn('无法初始化音频上下文，音效将不可用:', error);
        }
    }
    
    /**
     * 加载指定的音效包
     * @param {string} packName 音效包名称（对应sounds目录下的文件夹名）
     */
    async loadSoundPack(packName) {
        if (!this.audioContext) return;
        
        this.currentSoundPack = packName;
        const soundTypes = ['click', 'success', 'error', 'countdown', 'celebration'];
        
        // 清除之前加载的音效
        this.audioBuffers = {};
        
        // 尝试加载每种类型的音效文件
        for (const soundType of soundTypes) {
            try {
                const soundPath = `${this.soundBasePath}${packName}/${soundType}.mp3`;
                await this._loadSoundFile(soundType, soundPath);
            } catch (error) {
                console.log(`无法加载音效包 ${packName} 中的 ${soundType} 音效，将使用默认生成的音效。`);
                // 音效文件加载失败，不存储该音效，后续将使用Web Audio API生成
            }
        }
        
        console.log(`音效包 ${packName} 加载完成`);
    }
    
    /**
     * 加载单个音效文件
     * @param {string} soundType 音效类型
     * @param {string} filePath 文件路径
     * @private
     */
    async _loadSoundFile(soundType, filePath) {
        try {
            const response = await fetch(filePath);
            
            // 检查文件是否存在
            if (!response.ok) {
                throw new Error(`File not found: ${filePath}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers[soundType] = audioBuffer;
            
            console.log(`音效 ${soundType} 已加载: ${filePath}`);
        } catch (error) {
            console.warn(`加载音效文件失败: ${filePath}`, error);
            throw error;
        }
    }
    
    /**
     * 切换到指定的音效包
     * @param {string} packName 音效包名称
     */
    switchSoundPack(packName) {
        console.log(`正在切换到音效包: ${packName}`);
        return this.loadSoundPack(packName);
    }
    
    /**
     * 播放指定类型的音效（优先使用加载的文件，失败则使用Web Audio API生成）
     * @param {string} soundType 音效类型
     */
    _playSound(soundType) {
        if (!this.isMuted && this.audioContext) {
            // 如果有加载的音效文件，优先使用文件播放
            if (this.audioBuffers[soundType]) {
                this._playAudioBuffer(this.audioBuffers[soundType]);
                return true;
            }
            
            // 否则使用Web Audio API生成音效
            if (this.soundPresets[soundType]) {
                this._playTone(this.soundPresets[soundType]);
                return true;
            }
        }
        return false;
    }
    
    /**
     * 播放AudioBuffer
     * @param {AudioBuffer} audioBuffer 音频缓冲区
     * @private
     */
    _playAudioBuffer(audioBuffer) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        gainNode.gain.value = 0.3; // 设置音量
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
    }

    /**
     * 播放按钮点击音效
     */
    playClickSound() {
        this._playSound('click');
    }

    /**
     * 播放成功音效（任务完成）
     */
    playSuccessSound() {
        if (!this.isMuted) {
            // 尝试使用加载的音效文件
            const filePlayed = this._playSound('success');
            
            // 如果使用的是生成的音效，则添加第二个音调增强效果
            if (!filePlayed && this.soundPresets.success) {
                setTimeout(() => {
                    this._playTone({ ...this.soundPresets.success, frequency: 1320 });
                }, 150);
            }
        }
    }

    /**
     * 播放错误音效
     */
    playErrorSound() {
        this._playSound('error');
    }

    /**
     * 播放倒计时音效
     */
    playCountdownSound() {
        this._playSound('countdown');
    }

    /**
     * 播放庆祝音效
     */
    playCelebrationSound() {
        if (!this.isMuted) {
            // 尝试使用加载的音效文件
            const filePlayed = this._playSound('celebration');
            
            // 如果使用的是生成的音效，则播放一组音调
            if (!filePlayed && this.soundPresets.celebration) {
                const notes = [880, 1100, 1320, 1760];
                notes.forEach((note, index) => {
                    setTimeout(() => {
                        this._playTone({ ...this.soundPresets.celebration, frequency: note });
                    }, index * 150);
                });
            }
        }
    }

    /**
     * 播放音调
     * @param {Object} config 音调配置
     * @private
     */
    _playTone(config) {
        if (!this.audioContext) return;

        try {
            // 恢复音频上下文（某些浏览器要求用户交互后才能播放音频）
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = config.type || 'sine';
            oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);

            // 如果有频率滑动效果
            if (config.slide) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    Math.max(config.frequency + config.slide, 10),
                    this.audioContext.currentTime + config.duration
                );
            }

            // 设置音量包络
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + config.duration);

            // 连接节点
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // 开始和结束播放
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + config.duration);
        } catch (error) {
            console.warn('播放音效失败:', error);
        }
    }

    /**
     * 切换静音状态
     * @returns {boolean} 新的静音状态
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    /**
     * 设置静音状态
     * @param {boolean} muted 是否静音
     */
    setMuted(muted) {
        this.isMuted = muted;
    }

    /**
     * 获取静音状态
     * @returns {boolean} 当前静音状态
     */
    getMuted() {
        return this.isMuted;
    }
    
    /**
     * 获取当前使用的音效包名称
     * @returns {string} 当前音效包名称
     */
    getCurrentSoundPack() {
        return this.currentSoundPack;
    }
    
    /**
     * 获取可用的音效包列表（需要通过API或其他方式获取）
     * 注意：在实际环境中，这可能需要服务器端支持或预定义
     * @returns {Promise<string[]>} 音效包名称数组
     */
    async getAvailableSoundPacks() {
        // 这里简化实现，实际使用时可能需要从服务器获取或预定义
        // 也可以尝试扫描sounds目录下的文件夹（需要服务器支持）
        return ['default', 'video1', 'video2'];
    }
}

// 创建单例实例
const soundManager = new SoundEffectsManager();

// 导出模块
export {
    soundManager,
    SoundEffectsManager
};