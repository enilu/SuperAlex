// ==================== 音频管理器 ====================
import { CONFIG } from './config.js';

const AudioManager = {
    sounds: {},
    isMuted: false,
    currentAudio: null,
    playBtn: null,

    // 初始化音频
    init() {
        // 从 localStorage 加载静音设置
        const muted = localStorage.getItem('tangpoem_muted');
        if (muted !== null) {
            this.isMuted = JSON.parse(muted);
        }

        // 获取播放按钮引用
        this.playBtn = document.getElementById('playAudio');

        // 预加载音效（如果有的话）
        this.loadSounds();
    },

    // 加载音效
    loadSounds() {
        // 点击音效
        // this.sounds.click = new Audio(`${CONFIG.AUDIO_PATH}effects/click.mp3`);
        // 答对音效
        // this.sounds.correct = new Audio(`${CONFIG.AUDIO_PATH}effects/correct.mp3`);
        // 答错音效
        // this.sounds.wrong = new Audio(`${CONFIG.AUDIO_PATH}effects/wrong.mp3`);
        // 成就音效
        // this.sounds.achievement = new Audio(`${CONFIG.AUDIO_PATH}effects/achievement.mp3`);
    },

    // 更新播放按钮状态
    updatePlayButton(isPlaying) {
        if (this.playBtn) {
            if (isPlaying) {
                this.playBtn.classList.add('playing');
            } else {
                this.playBtn.classList.remove('playing');
            }
        }
    },

    // 播放点击音效
    playClick() {
        // 实际使用时需要加载音效文件
        console.log('播放点击音效');
    },

    // 播放答对音效
    playCorrect() {
        const audio = new Audio('assets/audio/good.mp3');
        audio.play().catch(err => {
            console.log('答对音效播放失败:', err);
        });
    },

    // 播放答错音效
    playWrong() {
        const audio = new Audio('assets/audio/comeon.mp3');
        audio.play().catch(err => {
            console.log('答错音效播放失败:', err);
        });
    },

    // 播放成就音效
    playAchievement() {
        console.log('播放成就音效');
    },

    // 播放唐诗诵读
    playRecite(poem) {
        if (!poem || !poem.audio) {
            this.showAudioNotAvailable();
            return;
        }

        // 如果当前正在播放同一首诗，则暂停
        if (this.currentAudio && !this.currentAudio.paused && this.currentAudio.src.includes(poem.audio)) {
            this.currentAudio.pause();
            this.updatePlayButton(false);
            return;
        }

        // 停止之前的音频
        this.stopRecite();

        // 检查音频文件是否存在
        fetch(poem.audio)
            .then(response => {
                if (response.ok) {
                    const audio = new Audio(poem.audio);

                    // 设置音频事件监听
                    audio.addEventListener('play', () => {
                        this.updatePlayButton(true);
                    });

                    audio.addEventListener('pause', () => {
                        this.updatePlayButton(false);
                    });

                    audio.addEventListener('ended', () => {
                        this.updatePlayButton(false);
                        this.currentAudio = null;
                    });

                    audio.addEventListener('error', () => {
                        this.updatePlayButton(false);
                        this.showAudioNotAvailable();
                    });

                    this.currentAudio = audio;
                    audio.play().catch(err => {
                        console.log('音频播放失败:', err);
                        this.updatePlayButton(false);
                        this.showAudioNotAvailable();
                    });
                } else {
                    this.showAudioNotAvailable();
                }
            })
            .catch(() => {
                // 网络错误或文件不存在
                this.showAudioNotAvailable();
            });
    },

    // 停止播放
    stopRecite() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.updatePlayButton(false);
    },

    // 显示音频不可用的友好提示
    showAudioNotAvailable() {
        // 创建临时提示元素
        const existingToast = document.querySelector('.audio-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'audio-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">🎵</span>
                <div class="toast-message">
                    <p><strong>音频功能开发中</strong></p>
                    <p>该诗歌的音频文件尚未添加</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">
                        详细说明请查看：<a href="../docs/音频文件使用说明.md" target="_blank" style="color: #f5576c;">音频文件使用说明</a>
                    </p>
                </div>
                <button class="toast-close" onclick="this.closest('.audio-toast').remove()">✕</button>
            </div>
        `;

        // 添加样式
        toast.style.cssText = `
            position: fixed;
            top: 2rem;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(toast);

        // 3秒后自动消失
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.animation = 'slideUp 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    },

    // 播放单句诵读
    playLine(audioUrl) {
        if (!audioUrl) {
            console.log('暂无单句音频');
            return;
        }

        const audio = new Audio(audioUrl);
        audio.play().catch(err => {
            console.log('音频播放失败:', err);
        });
    },

    // 切换静音
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('tangpoem_muted', JSON.stringify(this.isMuted));
        return this.isMuted;
    }
};

export { AudioManager };
