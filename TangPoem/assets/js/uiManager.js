// ==================== UI 管理器 ====================
import { CONFIG } from './config.js';
import { AudioManager } from './audioManager.js';

const UIManager = {
    // 显示反馈消息
    showFeedback(isCorrect, message) {
        const feedbackArea = document.getElementById('feedbackArea');
        const feedbackContent = document.getElementById('feedbackContent');
        const feedbackIcon = feedbackContent.querySelector('.feedback-icon');
        const feedbackText = feedbackContent.querySelector('.feedback-text');

        if (isCorrect) {
            feedbackIcon.textContent = '✅';
            feedbackText.textContent = message || this.getRandomEncouragement('CORRECT');
            AudioManager.playCorrect();
        } else {
            feedbackIcon.textContent = '💪';
            feedbackText.textContent = message || this.getRandomEncouragement('WRONG');
            AudioManager.playWrong();
        }

        feedbackArea.classList.remove('hidden');

        // 1.5秒后隐藏
        setTimeout(() => {
            feedbackArea.classList.add('hidden');
        }, 1500);
    },

    // 获取随机鼓励语
    getRandomEncouragement(type) {
        const messages = CONFIG.ENCOURAGEMENT[type];
        return messages[Math.floor(Math.random() * messages.length)];
    },

    // 显示成就弹窗
    showAchievement(achievement) {
        const toast = document.getElementById('achievementToast');
        const toastText = document.getElementById('toastText');
        const toastIcon = toast.querySelector('.toast-icon');

        toastText.textContent = `解锁成就：${achievement.name}！`;
        toastIcon.textContent = achievement.icon;

        toast.classList.remove('hidden');

        // 3秒后隐藏
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);

        // 播放成就音效
        AudioManager.playAchievement();
    },

    // 更新分数显示
    updateScore(score) {
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = score;
        }
    },

    // 更新进度显示
    updateProgress(current, total) {
        const progressEl = document.getElementById('progress');
        if (progressEl) {
            progressEl.textContent = `${current}/${total}`;
        }
    },

    // 高亮正确/错误答案
    highlightAnswer(button, isCorrect) {
        if (isCorrect) {
            button.classList.add('correct');
        } else {
            button.classList.add('wrong');
        }

        // 1秒后移除高亮
        setTimeout(() => {
            button.classList.remove('correct', 'wrong');
        }, 1000);
    },

    // 禁用所有选项按钮
    disableAllButtons() {
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
        });
    },

    // 启用所有选项按钮
    enableAllButtons() {
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.disabled = false;
        });
    }
};

export { UIManager };
