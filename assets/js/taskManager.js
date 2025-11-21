// 晨光冲锋队 - 任务管理模块

// 任务状态枚举
const TASK_STATUS = {
    NOT_STARTED: 'not_started',
    IN_TIME: 'in_time',
    LATE: 'late',
    VERY_LATE: 'very_late',
    COMPLETED: 'completed'
};

// 完成状态枚举
const COMPLETION_STATUS = {
    EARLY: 'early',
    ON_TIME: 'on_time',
    LATE: 'late',
    VERY_LATE: 'very_late'
};

// 任务管理器类
class TaskManager {
    constructor(tasks = []) {
        this.tasks = tasks;
        this.currentTaskIndex = 0;
        this.completedTasks = [];
        this.isAllCompleted = false;
        this.taskStatusHistory = {}; // 存储每个任务的状态历史
    }

    // 设置任务列表
    setTasks(tasks) {
        this.tasks = tasks;
        this.reset();
    }

    // 重置任务状态
    reset() {
        this.currentTaskIndex = 0;
        this.completedTasks = [];
        this.isAllCompleted = false;
        this.taskStatusHistory = {};
    }

    // 获取当前任务
    getCurrentTask() {
        if (this.isAllCompleted || this.currentTaskIndex >= this.tasks.length) {
            return null;
        }
        return this.tasks[this.currentTaskIndex];
    }

    // 获取当前任务索引
    getCurrentTaskIndex() {
        return this.currentTaskIndex;
    }

    // 获取任务总数
    getTotalTasks() {
        return this.tasks.length;
    }

    // 获取已完成任务数
    getCompletedTaskCount() {
        return this.completedTasks.length;
    }

    // 计算当前任务的状态
    calculateTaskStatus(task, currentTime) {
        const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const startTimeMinutes = this.timeToMinutes(task.startTime);
        const deadlineMinutes = this.timeToMinutes(task.deadlineTime);

        if (currentTimeMinutes < startTimeMinutes) {
            return TASK_STATUS.NOT_STARTED;
        } else if (currentTimeMinutes <= deadlineMinutes) {
            return TASK_STATUS.IN_TIME;
        } else {
            // 检查是否超过下一个任务的开始时间
            const nextTaskIndex = this.currentTaskIndex + 1;
            if (nextTaskIndex < this.tasks.length) {
                const nextTaskStartTimeMinutes = this.timeToMinutes(this.tasks[nextTaskIndex].startTime);
                if (currentTimeMinutes > nextTaskStartTimeMinutes) {
                    return TASK_STATUS.VERY_LATE;
                }
            }
            return TASK_STATUS.LATE;
        }
    }

    // 处理任务完成
    completeCurrentTask(currentTime) {
        if (this.isAllCompleted || !this.getCurrentTask()) {
            return null;
        }

        const currentTask = this.getCurrentTask();
        const currentTaskIndex = this.currentTaskIndex;
        
        // 计算完成状态
        const completionStatus = this.determineCompletionStatus(currentTask, currentTime);
        
        // 记录任务完成信息
        const completionInfo = {
            taskId: currentTask.id,
            taskName: currentTask.name,
            index: currentTaskIndex,
            status: completionStatus,
            timestamp: currentTime.toISOString(),
            completionTime: this.formatTime(currentTime),
            // 计算与截止时间的差异
            timeDifference: this.calculateTimeDifference(currentTask, currentTime)
        };
        
        // 添加到已完成列表
        this.completedTasks.push(completionInfo);
        
        // 检查是否所有任务都已完成
        if (currentTaskIndex >= this.tasks.length - 1) {
            this.isAllCompleted = true;
        } else {
            // 移动到下一个任务
            this.currentTaskIndex++;
        }
        
        // 触发成就相关事件
        this.triggerAchievementEvents(completionInfo);
        
        return completionInfo;
    }
    
    // 触发成就相关事件
    triggerAchievementEvents(completionInfo) {
        // 这里可以通过事件系统或直接调用成就系统
        // 当前实现中，这些检查将在app.js中进行
        // 此方法作为扩展点保留
        console.log('触发成就检查:', completionInfo);
    }

    // 确定任务完成状态
    determineCompletionStatus(task, currentTime) {
        const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const deadlineMinutes = this.timeToMinutes(task.deadlineTime);
        const startTimeMinutes = this.timeToMinutes(task.startTime);
        
        if (currentTimeMinutes <= deadlineMinutes) {
            // 提前或准时完成
            return currentTimeMinutes < deadlineMinutes ? COMPLETION_STATUS.EARLY : COMPLETION_STATUS.ON_TIME;
        } else {
            // 超时完成
            const nextTaskIndex = this.currentTaskIndex + 1;
            if (nextTaskIndex < this.tasks.length) {
                const nextTaskStartTimeMinutes = this.timeToMinutes(this.tasks[nextTaskIndex].startTime);
                return currentTimeMinutes > nextTaskStartTimeMinutes ? COMPLETION_STATUS.VERY_LATE : COMPLETION_STATUS.LATE;
            }
            return COMPLETION_STATUS.LATE;
        }
    }

    // 计算时间差异（分钟数）
    calculateTimeDifference(task, currentTime) {
        const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const deadlineMinutes = this.timeToMinutes(task.deadlineTime);
        
        return currentTimeMinutes - deadlineMinutes; // 负数表示提前完成
    }

    // 获取任务状态消息
    getTaskStatusMessage(status) {
        const messages = {
            [TASK_STATUS.NOT_STARTED]: '准备开始',
            [TASK_STATUS.IN_TIME]: '加油，时间充裕！',
            [TASK_STATUS.LATE]: '有点超时了，加油！',
            [TASK_STATUS.VERY_LATE]: '严重超时，快点完成！',
            [TASK_STATUS.COMPLETED]: '任务已完成！'
        };
        
        return messages[status] || '继续努力！';
    }

    // 获取任务完成反馈
    getCompletionFeedback(completionInfo, nextTask = null) {
        const { taskName, status, timeDifference } = completionInfo;
        
        let feedback = {};
        
        switch (status) {
            case COMPLETION_STATUS.EARLY:
                const minutesEarly = Math.abs(Math.floor(timeDifference));
                feedback = {
                    title: '太棒了！⚡',
                    message: `你比规定时间提前了${minutesEarly}分钟完成了${taskName}，真是晨光小超人！`,
                    color: '#06D6A0',
                    icon: '🎉'
                };
                break;
                
            case COMPLETION_STATUS.ON_TIME:
                feedback = {
                    title: '准时完成！✅',
                    message: `干得漂亮！你准时完成了${taskName}。`,
                    color: '#4ECDC4',
                    icon: '👍'
                };
                break;
                
            case COMPLETION_STATUS.LATE:
                feedback = {
                    title: '继续加油！💪',
                    message: `今天${taskName}稍微慢了一点点，没关系，下次一定可以做得更好！`,
                    color: '#FFD166',
                    icon: '⏰'
                };
                break;
                
            case COMPLETION_STATUS.VERY_LATE:
                feedback = {
                    title: '别灰心！💖',
                    message: `今天${taskName}有些超时了，不过没关系，现在开始下一个任务吧！`,
                    color: '#FF6B6B',
                    icon: '🌟'
                };
                break;
        }
        
        // 如果有下一个任务，添加相关信息
        if (nextTask) {
            feedback.nextTaskMessage = `现在开始${nextTask.name}吧，记得${nextTask.startTime}前完成！`;
        }
        
        return feedback;
    }

    // 记录任务状态变化
    recordTaskStatus(taskIndex, status, timestamp = new Date()) {
        if (!this.taskStatusHistory[taskIndex]) {
            this.taskStatusHistory[taskIndex] = [];
        }
        
        this.taskStatusHistory[taskIndex].push({
            status,
            timestamp: timestamp.toISOString()
        });
    }

    // 获取提前完成的任务数量
    getEarlyCompletionCount() {
        return this.completedTasks.filter(task => task.status === COMPLETION_STATUS.EARLY).length;
    }

    // 检查是否所有任务都已完成
    checkAllTasksCompleted() {
        return this.isAllCompleted;
    }

    // 获取完成率
    getCompletionRate() {
        if (this.tasks.length === 0) return 0;
        return (this.completedTasks.length / this.tasks.length) * 100;
    }

    // 辅助方法：时间字符串转换为分钟数
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // 辅助方法：格式化时间为 HH:MM
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // 获取今日任务统计
    getTodayStats() {
        return {
            totalTasks: this.tasks.length,
            completedTasks: this.completedTasks.length,
            earlyCompletions: this.getEarlyCompletionCount(),
            completionRate: this.getCompletionRate(),
            isAllCompleted: this.isAllCompleted
        };
    }
}

// 创建任务反馈组件
function createTaskFeedbackComponent(feedback) {
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'task-feedback';
    
    // 设置样式
    feedbackElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        text-align: center;
        z-index: 9999;
        min-width: 280px;
        max-width: 90%;
        border-left: 10px solid ${feedback.color};
        animation: slideIn 0.3s ease-out;
    `;
    
    // 创建内容
    feedbackElement.innerHTML = `
        <div class="feedback-icon" style="font-size: 4rem; margin-bottom: 15px;">${feedback.icon}</div>
        <h2 class="feedback-title" style="font-size: 2rem; color: ${feedback.color}; margin-bottom: 10px;">${feedback.title}</h2>
        <p class="feedback-message" style="font-size: 1.3rem; margin-bottom: 20px;">${feedback.message}</p>
        ${feedback.nextTaskMessage ? `<p class="feedback-next" style="font-size: 1.1rem; color: #4ECDC4;">${feedback.nextTaskMessage}</p>` : ''}
        <button class="feedback-close" style="background-color: ${feedback.color}; color: white; border: none; padding: 10px 20px; font-size: 1.2rem; border-radius: 30px; cursor: pointer; margin-top: 15px;">明白了</button>
    `;
    
    // 添加动画样式
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translate(-50%, -60%);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%);
            }
        }
    `;
    document.head.appendChild(styleSheet);
    
    // 添加关闭事件
    const closeButton = feedbackElement.querySelector('.feedback-close');
    closeButton.addEventListener('click', () => {
        feedbackElement.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (feedbackElement.parentNode) {
                feedbackElement.parentNode.removeChild(feedbackElement);
            }
            document.head.removeChild(styleSheet);
        }, 300);
    });
    
    return feedbackElement;
}

// 显示任务完成反馈
function showTaskFeedback(feedback, duration = 5000) {
    const feedbackElement = createTaskFeedbackComponent(feedback);
    document.body.appendChild(feedbackElement);
    
    // 自动关闭
    setTimeout(() => {
        if (feedbackElement.parentNode) {
            feedbackElement.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (feedbackElement.parentNode) {
                    feedbackElement.parentNode.removeChild(feedbackElement);
                }
            }, 300);
        }
    }, duration);
    
    return feedbackElement;
}

// 导出模块
export {
    TaskManager,
    TASK_STATUS,
    COMPLETION_STATUS,
    showTaskFeedback
};