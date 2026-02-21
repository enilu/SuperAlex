// ==================== UI 管理器 ====================
import { CONFIG } from './config.js';
import { AudioManager } from './audioManager.js';
import { CacheManager } from './cacheManager.js';

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
    },

    // ==================== 设置模态框 ====================

    /**
     * 初始化设置模态框
     */
    initSettingsModal() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsClose = document.getElementById('settingsClose');
        const settingsOverlay = document.getElementById('settingsOverlay');
        const clearDataCacheBtn = document.getElementById('clearDataCacheBtn');
        const clearAllCacheBtn = document.getElementById('clearAllCacheBtn');
        const clearProgressBtn = document.getElementById('clearProgressBtn');
        const clearReviewBtn = document.getElementById('clearReviewBtn');
        const exportReviewDataBtn = document.getElementById('exportReviewDataBtn');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        if (settingsClose) {
            settingsClose.addEventListener('click', () => this.closeSettings());
        }

        if (settingsOverlay) {
            settingsOverlay.addEventListener('click', () => this.closeSettings());
        }

        if (clearDataCacheBtn) {
            clearDataCacheBtn.addEventListener('click', () => {
                this.showConfirmDialog(
                    '清除数据缓存',
                    '这将清除诗歌数据等缓存文件，但保留您的学习进度。确认继续？',
                    () => {
                        CacheManager.clearDataCache();
                        this.updateCacheInfo();
                        this.showNotification('数据缓存已清除', 'success');
                    }
                );
            });
        }

        if (clearAllCacheBtn) {
            clearAllCacheBtn.addEventListener('click', () => {
                this.showConfirmDialog(
                    '清除所有缓存',
                    '警告：这将清除所有缓存包括您的学习进度、成就和统计数据！此操作不可恢复！',
                    () => {
                        CacheManager.clearAllCache();
                        this.updateCacheInfo();
                        this.showNotification('所有缓存已清除', 'success');
                    }
                );
            });
        }

        // 添加清除学习进度按钮的事件监听器
        if (clearProgressBtn) {
            clearProgressBtn.addEventListener('click', () => {
                this.showConfirmDialog(
                    '清除学习进度',
                    '这将清除您的学习进度、成就和统计数据，但保留诗歌数据缓存。确认继续？',
                    () => {
                        CacheManager.clearByCategory('progress');
                        this.updateCacheInfo();
                        this.showNotification('学习进度已清除', 'success');
                    }
                );
            });
        }

        // 添加清除复习数据按钮的事件监听器
        if (clearReviewBtn) {
            clearReviewBtn.addEventListener('click', () => {
                this.showConfirmDialog(
                    '清除复习数据',
                    '这将清除您的复习历史数据，但保留其他学习进度。确认继续？',
                    () => {
                        CacheManager.clearByCategory('review');
                        this.updateCacheInfo();
                        this.showNotification('复习数据已清除', 'success');
                    }
                );
            });
        }

        // 添加导出复习数据按钮的事件监听器
        if (exportReviewDataBtn) {
            exportReviewDataBtn.addEventListener('click', () => {
                const reviewData = CacheManager.exportReviewData();

                // 创建下载链接
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reviewData, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", `tangpoem-review-data_${new Date().toISOString().slice(0, 19)}.json`);
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();

                this.showNotification('复习数据已导出', 'success');
            });
        }
    },

    /**
     * 打开设置模态框
     */
    openSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.classList.remove('hidden');
            this.updateCacheInfo();
        }
    },

    /**
     * 关闭设置模态框
     */
    closeSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.classList.add('hidden');
        }
    },

    /**
     * 更新缓存信息显示
     */
    updateCacheInfo() {
        const cacheVersionEl = document.getElementById('cacheVersion');
        const cacheSizeEl = document.getElementById('cacheSize');
        const cacheDetailsEl = document.getElementById('cacheDetails');

        const cacheInfo = CacheManager.getCacheInfo();

        if (cacheVersionEl) {
            cacheVersionEl.textContent = cacheInfo.version;
        }

        if (cacheSizeEl) {
            cacheSizeEl.textContent = cacheInfo.totalSize > 0
                ? CacheManager.formatSize(cacheInfo.totalSize)
                : '无缓存';
        }

        if (cacheDetailsEl) {
            if (cacheInfo.items.length === 0) {
                cacheDetailsEl.innerHTML = '<p style="text-align:center;color:#999;padding:1rem;">暂无缓存数据</p>';
            } else {
                cacheDetailsEl.innerHTML = cacheInfo.items.map(item => `
                    <div class="cache-detail-item ${item.isUserData ? 'user-data' : 'data-cache'}">
                        <span class="cache-detail-item-name">${item.description}</span>
                        <span class="cache-detail-item-size">${item.sizeFormatted}</span>
                    </div>
                `).join('');
            }
        }
    },

    /**
     * 显示确认对话框
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @param {Function} onConfirm - 确认回调
     */
    showConfirmDialog(title, message, onConfirm) {
        // 移除已存在的对话框
        const existingDialog = document.querySelector('.confirm-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-dialog-content">
                <div class="confirm-dialog-title">${title}</div>
                <div class="confirm-dialog-message">${message}</div>
                <div class="confirm-dialog-buttons">
                    <button class="confirm-dialog-btn cancel">取消</button>
                    <button class="confirm-dialog-btn confirm">确认</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const cancelBtn = dialog.querySelector('.cancel');
        const confirmBtn = dialog.querySelector('.confirm');

        const closeDialog = () => {
            dialog.remove();
        };

        cancelBtn.addEventListener('click', closeDialog);
        confirmBtn.addEventListener('click', () => {
            onConfirm();
            closeDialog();
        });

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
    },

    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, info)
     */
    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification-toast');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification-toast notification-${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#00b894' : type === 'error' ? '#d63031' : '#0984e3'};
            color: #fff;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 0.8rem;
            font-weight: 500;
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }
};

export { UIManager };
