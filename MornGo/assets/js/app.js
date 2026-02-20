// 晨光冲锋队 - 主应用逻辑

// 导入配置
import { getConfigFromUrl, gameConfig, normalizeTasks, defaultTasks, voiceTemplates } from './config.js';
import { injectAllIcons } from './icons.js';
// 导入任务管理模块
import { TaskManager } from './taskManager.js';
// 导入存储管理模块
import { storageManager } from './storageManager.js';
// 导入成就系统
import { achievementSystem } from './achievementSystem.js';
// 导入音效管理模块
import { soundManager } from './soundEffects.js';

// DOM 元素引用
const elements = {
    introOverlay: document.getElementById('introOverlay'),
    startButton: document.getElementById('startButton'),
    taskSelectionContainer: document.getElementById('taskSelectionContainer'),
    gameContainer: document.getElementById('gameContainer'),
    currentDate: document.getElementById('currentDate'),
    achievementCount: document.getElementById('achievementCount'),
    currentDateSelection: document.getElementById('currentDateSelection'),
    achievementCountSelection: document.getElementById('achievementCountSelection'),
    settingsButton: document.getElementById('settingsButton'),
    settingsButtonSelection: document.getElementById('settingsButtonSelection'),
    backButton: document.getElementById('backButton'),
    backButtonSelection: document.getElementById('backButtonSelection'),
    settingsModal: document.getElementById('settingsModal'),
    resetTodayButton: document.getElementById('resetTodayButton'),
    resetWeekButton: document.getElementById('resetWeekButton'),
    closeSettingsButton: document.getElementById('closeSettingsButton'),
    taskList: document.getElementById('taskList'),
    taskIcon: document.getElementById('taskIcon'),
    taskName: document.getElementById('taskName'),
    countdown: document.getElementById('countdown'),
    timeStatus: document.getElementById('timeStatus'),
    completeButton: document.getElementById('completeButton'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    completionProgressText: document.getElementById('completionProgressText'),
    completionProgressBar: document.getElementById('completionProgressBar'),
    medalSection: document.getElementById('medalSection'),
    medalTitle: document.getElementById('medalTitle'),
    medalDescription: document.getElementById('medalDescription'),
    celebrationScreen: document.getElementById('celebrationScreen'),
    celebrationMessage: document.getElementById('celebrationMessage'),
    // 音效相关元素
    soundPackButtons: document.querySelectorAll('.sound-pack-button'),
    currentSoundPack: document.getElementById('currentSoundPack')
};

// 游戏状态
const gameState = {
    tasks: [],
    currentTaskIndex: 0,
    currentTask: null,
    timer: null,
    taskStartTime: null,  // 任务开始时间
    countdownSeconds: 0,  // 当前任务倒计时秒数
    remainingSeconds: 0,  // 剩余秒数
    totalTasks: 0,
    completedTasks: 0,
    completedTaskIds: [],  // 已完成的任务ID列表
    flashCompletions: 0,
    streakDays: 0,
    isInitialized: false,
    isInTaskSelection: true,  // 是否在任务选择界面
    taskManager: null, // 将由TaskManager替换部分状态管理
    achievementSystem: achievementSystem,
    soundManager: soundManager
};

// 初始化游戏
function initGame() {
    // 初始化任务管理器
    gameState.taskManager = new TaskManager();

    // 检查是否应该显示介绍
    if (!gameConfig.showIntro || storageManager.hasSeenIntro()) {
        elements.introOverlay.classList.add('hidden');
        startGame();
    }

    // 设置开始按钮事件
    elements.startButton.addEventListener('click', () => {
        elements.introOverlay.classList.add('hidden');
        storageManager.markIntroAsSeen();
        startGame();
    });

    // 设置完成按钮事件
    elements.completeButton.addEventListener('click', handleTaskComplete);

    // 设置返回按钮事件
    if (elements.backButton) {
        elements.backButton.addEventListener('click', () => {
            stopCurrentTask();
            showTaskSelection();
        });
    }

    // 任务选择界面的返回按钮事件（确认退出）
    if (elements.backButtonSelection) {
        elements.backButtonSelection.addEventListener('click', () => {
            if (confirm('确定要退出晨光冲锋队吗？')) {
                // 可以跳转到其他页面或刷新页面
                window.location.reload();
            }
        });
    }

    // 设置按钮事件
    if (elements.settingsButton) {
        elements.settingsButton.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }
    if (elements.settingsButtonSelection) {
        elements.settingsButtonSelection.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }

    // 初始化设置相关事件监听
    initSettingsListeners();

    // 加载用户偏好的音效包
    loadUserSoundPackPreference();
    injectAllIcons(document);
}

/**
 * 加载用户偏好的音效包
 */
async function loadUserSoundPackPreference() {
    try {
        const preferredPack = storageManager.getSoundPackPreference();
        const packToLoad = preferredPack || 'default'; // 如果没有保存的偏好，使用default
        await gameState.soundManager.switchSoundPack(packToLoad);
        console.log(`已加载用户偏好的音效包: ${packToLoad}`);
    } catch (error) {
        console.error('加载用户音效包偏好失败:', error);
    }
}

/**
 * 初始化设置相关的事件监听器
 */
function initSettingsListeners() {
    // 设置按钮事件在initGame中已经绑定
    // 这里可以添加其他设置相关的监听器
}

// 初始化任务配置相关的事件监听器
function initTaskConfigListeners() {
    // 添加任务按钮点击事件
    document.getElementById('addTaskButton').addEventListener('click', addNewTask);
    
    // 保存配置按钮点击事件
    document.getElementById('saveTasksButton').addEventListener('click', saveCurrentTaskConfig);
    
    // 重置为默认配置按钮点击事件
    document.getElementById('resetTasksButton').addEventListener('click', resetToDefaultTasks);
    
    // 设置弹窗显示时渲染任务列表
    elements.settingsModal.addEventListener('DOMSubtreeModified', function handleModalChange() {
        if (!elements.settingsModal.classList.contains('hidden')) {
            renderTaskList();
            // 移除监听器以避免重复渲染
            elements.settingsModal.removeEventListener('DOMSubtreeModified', handleModalChange);
        }
    });
}

/**
 * 切换到指定的音效包
 * @param {string} packName 音效包名称
 */
async function switchToSoundPack(packName) {
    try {
        await gameState.soundManager.switchSoundPack(packName);
        // 更新界面显示
        updateCurrentSoundPackDisplay(packName);
        // 保存用户偏好到本地存储
        storageManager.saveSoundPackPreference(packName);
        console.log(`已切换到音效包: ${packName}`);
    } catch (error) {
        console.error('切换音效包失败:', error);
    }
}

/**
 * 更新当前音效包显示
 * @param {string} packName 音效包名称
 */
function updateCurrentSoundPackDisplay(packName) {
    const packNames = {
        'default': '默认音效',
        'video1': '音效包1',
        'video2': '音效包2'
    };
    elements.currentSoundPack.textContent = packNames[packName] || packName;
    
    // 更新按钮选中状态
    elements.soundPackButtons.forEach(button => {
        if (button.getAttribute('data-pack') === packName) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });
}

 


// 开始游戏
function startGame() {
    // 加载任务配置 - 优先从本地存储加载用户配置
    let tasks = [];

    // 1. 首先尝试从本地存储获取用户自定义配置
    if (storageManager.hasUserTasksConfig()) {
        try {
            tasks = storageManager.getUserTasksConfig();
            console.log('已从本地存储加载用户任务配置');
        } catch (error) {
            console.error('加载本地任务配置失败:', error);
            // 如果本地配置加载失败，使用默认配置
        }
    }

    // 2. 如果没有本地配置，从URL参数获取
    if (tasks.length === 0) {
        tasks = getConfigFromUrl();
    }

    // 3. 确保任务数据符合规范（移除不必要的字段）
    tasks = normalizeTasks(tasks);

    gameState.tasks = tasks;
    gameState.totalTasks = gameState.tasks.length;
    gameState.completedTasks = 0;
    gameState.completedTaskIds = [];
    gameState.flashCompletions = 0;

    // 检查今天是否启用
    const today = new Date().getDay();
    if (!gameConfig.enabledDays.includes(today)) {
        elements.taskName.textContent = '今天休息！';
        elements.countdown.textContent = '🎉';
        elements.timeStatus.textContent = '周末愉快！';
        elements.completeButton.textContent = '明天再来';
        return;
    }

    // 更新日期显示
    updateDateDisplay();

    // 加载保存的成就数据
    loadAchievementData();

    // 初始化任务管理器和成就系统
    gameState.taskManager.setTasks(gameState.tasks);
    gameState.achievementSystem.loadAchievements();

    // 检查并显示已解锁的成就
    const unlockedAchievements = gameState.achievementSystem.getUnlockedAchievements();

    // 更新成就计数显示
    if (elements.achievementCount) {
        elements.achievementCount.textContent = unlockedAchievements.length;
    }
    if (elements.achievementCountSelection) {
        elements.achievementCountSelection.textContent = unlockedAchievements.length;
    }

    // 显示任务选择界面
    showTaskSelection();

    gameState.isInitialized = true;
}

// 更新日期显示
function updateDateDisplay() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateStr = now.toLocaleDateString('zh-CN', options);
    if (elements.currentDate) {
        elements.currentDate.textContent = dateStr;
    }
    if (elements.currentDateSelection) {
        elements.currentDateSelection.textContent = dateStr;
    }
}

// 显示任务选择界面
function showTaskSelection() {
    // 隐藏游戏界面，显示选择界面
    elements.gameContainer.classList.add('hidden');
    elements.taskSelectionContainer.classList.remove('hidden');
    elements.backButton.classList.add('hidden');

    gameState.isInTaskSelection = true;

    // 渲染任务列表
    renderTaskSelection();
}

// 渲染任务选择列表
function renderTaskSelection() {
    if (!elements.taskList) return;

    elements.taskList.innerHTML = '';

    gameState.tasks.forEach((task, index) => {
        const isCompleted = gameState.completedTaskIds.includes(task.id);
        const taskItem = document.createElement('div');
        taskItem.className = `task-selection-item ${isCompleted ? 'completed' : ''}`;
        taskItem.dataset.taskId = task.id;

        taskItem.innerHTML = `
            <div class="task-selection-icon">${task.icon}</div>
            <div class="task-selection-info">
                <div class="task-selection-name">${task.name}</div>
                <div class="task-selection-time">限时 ${Math.floor(task.countdownSeconds / 60)}:${(task.countdownSeconds % 60).toString().padStart(2, '0')}</div>
            </div>
            <div class="task-selection-status">
                ${isCompleted ? '✅ 已完成' : '🎯 开始'}
            </div>
        `;

        // 如果未完成，添加点击事件
        if (!isCompleted) {
            taskItem.addEventListener('click', () => {
                startTask(task.id);
            });
        }

        elements.taskList.appendChild(taskItem);
    });

    // 更新完成进度
    updateCompletionProgress();
}

// 更新完成进度
function updateCompletionProgress() {
    if (elements.completionProgressText) {
        elements.completionProgressText.textContent = `已完成: ${gameState.completedTasks}/${gameState.totalTasks}`;
    }
    if (elements.completionProgressBar) {
        const progress = (gameState.completedTasks / gameState.totalTasks) * 100;
        elements.completionProgressBar.style.width = `${progress}%`;
    }
}

// 开始任务
function startTask(taskId) {
    const task = gameState.tasks.find(t => t.id === taskId);
    if (!task) return;

    gameState.currentTask = task;
    gameState.currentTaskIndex = gameState.tasks.findIndex(t => t.id === taskId);
    gameState.isInTaskSelection = false;

    // 隐藏选择界面，显示游戏界面
    elements.taskSelectionContainer.classList.add('hidden');
    elements.gameContainer.classList.remove('hidden');
    elements.backButton.classList.remove('hidden');

    // 初始化倒计时
    gameState.countdownSeconds = task.countdownSeconds;
    gameState.remainingSeconds = task.countdownSeconds;
    gameState.taskStartTime = new Date();

    // 更新任务显示
    updateTaskDisplay();

    // 启动倒计时（新增）
    startTaskCountdown();
}

// 停止当前任务
function stopCurrentTask() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    gameState.currentTask = null;
}

// 查找当前任务 - 始终从第一个任务开始
function findCurrentTask() {
    // 根据需求：即使超时，每次也都需要从第一个任务开始
    gameState.currentTaskIndex = 0;
    gameState.currentTask = gameState.tasks[0];

    // 更新任务显示
    updateTaskDisplay();

    // 启动计时器
    startCountdown();
}

// 更新任务显示
function updateTaskDisplay() {
    if (!gameState.currentTask) return;
    
    elements.taskIcon.textContent = gameState.currentTask.icon;
    elements.taskName.textContent = gameState.currentTask.name;
    
    // 更新进度条
    elements.progressBar.style.width = `${(gameState.currentTaskIndex / gameState.totalTasks) * 100}%`;
    elements.progressText.textContent = `${gameState.currentTaskIndex}/${gameState.totalTasks}`;
    
    // 检查任务完成状态
    const taskStatus = getTaskStatus();
    updateTimeStatus(taskStatus);
}

// 格式化时间为 HH:MM
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 转换时间字符串为分钟数
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// 启动倒计时
function startCountdown() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    gameState.timer = setInterval(() => {
        const now = new Date();
        const currentTask = gameState.currentTask;

        if (!currentTask) {
            clearInterval(gameState.timer);
            return;
        }

        // 计算剩余时间（包含秒数）
        const [deadlineHours, deadlineMinutes] = currentTask.deadlineTime.split(':').map(Number);
        const deadlineDate = new Date();
        deadlineDate.setHours(deadlineHours, deadlineMinutes, 0, 0);

        // 计算剩余毫秒数
        const remainingMs = deadlineDate - now;
        let remainingMinutes = remainingMs / (1000 * 60);
        let isOverdue = remainingMs < 0;

        // 更新倒计时显示
        updateCountdownDisplay(Math.abs(remainingMinutes), isOverdue);

        // 检查任务状态
        const taskStatus = getTaskStatus();
        updateTimeStatus(taskStatus);

    }, 1000);
}

// 启动任务倒计时（新模式）
function startTaskCountdown() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    gameState.timer = setInterval(() => {
        if (gameState.remainingSeconds <= 0) {
            // 时间到！
            handleTimeUp();
            return;
        }

        gameState.remainingSeconds--;

        // 更新倒计时显示
        updateTaskCountdownDisplay();

        // 最后10秒警告
        if (gameState.remainingSeconds <= 10 && gameState.remainingSeconds > 0) {
            updateTimeStatusWarning();
        }

    }, 1000);
}

// 更新任务倒计时显示
function updateTaskCountdownDisplay() {
    const minutes = Math.floor(gameState.remainingSeconds / 60);
    const seconds = gameState.remainingSeconds % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (elements.countdown) {
        elements.countdown.textContent = formattedTime;
    }

    // 更新倒计时颜色
    if (elements.countdown) {
        elements.countdown.className = 'countdown';
        if (gameState.remainingSeconds <= 10) {
            elements.countdown.classList.add('danger');
        } else if (gameState.remainingSeconds <= 30) {
            elements.countdown.classList.add('warning');
        } else {
            elements.countdown.classList.add('normal');
        }
    }

    // 更新状态文本
    if (elements.timeStatus) {
        if (gameState.remainingSeconds <= 10) {
            elements.timeStatus.textContent = '抓紧时间！';
        } else if (gameState.remainingSeconds <= 30) {
            elements.timeStatus.textContent = '加油！';
        } else {
            elements.timeStatus.textContent = '开始挑战！';
        }
    }
}

// 处理时间到
function handleTimeUp() {
    // 停止倒计时
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }

    // 播放提示音
    gameState.soundManager.playErrorSound();

    // 显示时间到消息
    if (elements.timeStatus) {
        elements.timeStatus.textContent = '⏰ 时间到了！下次加油！';
    }

    // 禁用完成按钮
    if (elements.completeButton) {
        elements.completeButton.disabled = true;
        elements.completeButton.textContent = '❌ 超时了';
        elements.completeButton.classList.add('disabled');
    }

    // 2秒后返回任务选择
    setTimeout(() => {
        showTaskSelection();
        // 重置完成按钮状态
        if (elements.completeButton) {
            elements.completeButton.disabled = false;
            elements.completeButton.textContent = '✅ 我完成了！';
            elements.completeButton.classList.remove('disabled');
        }
    }, 2000);
}

// 更新倒计时显示
function updateCountdownDisplay(remainingMinutes, isOverdue) {
    const minutes = Math.floor(remainingMinutes);
    const seconds = Math.floor((remainingMinutes - minutes) * 60);
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 确保每秒都更新显示
    elements.countdown.textContent = formattedTime;
    
    // 更新倒计时颜色
    elements.countdown.className = 'countdown';
    if (isOverdue) {
        elements.countdown.classList.add('danger');
    } else if (remainingMinutes <= 2) {
        elements.countdown.classList.add('warning');
    } else {
        elements.countdown.classList.add('normal');
    }
}

// 获取任务状态
function getTaskStatus() {
    if (!gameState.currentTask || !gameState.taskManager) {
        return 'unknown';
    }

    // 检查是否是任务选择模式（通过检查是否有countdownSeconds而不是startTime）
    if (gameState.currentTask.countdownSeconds !== undefined) {
        // 任务选择模式使用倒计时，不需要时间状态
        return 'countdown_mode';
    }

    // 使用taskManager的calculateTaskStatus方法，并传入当前任务和当前时间
    return gameState.taskManager.calculateTaskStatus(gameState.currentTask, new Date());
}

// 更新时间状态显示
function updateTimeStatus(status) {
    switch (status) {
        case 'not_started':
            elements.timeStatus.textContent = '准备开始';
            break;
        case 'in_time':
            elements.timeStatus.textContent = '加油，时间充裕！';
            break;
        case 'late':
            elements.timeStatus.textContent = '有点超时了，加油！';
            break;
        case 'very_late':
            elements.timeStatus.textContent = '严重超时，快点完成！';
            break;
        case 'countdown_mode':
            // 任务选择模式：倒计时模式，使用倒计时显示
            if (gameState.remainingSeconds > 0) {
                const minutes = Math.floor(gameState.remainingSeconds / 60);
                const seconds = gameState.remainingSeconds % 60;
                elements.timeStatus.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                elements.timeStatus.textContent = '⏰ 时间到！';
            }
            break;
        default:
            elements.timeStatus.textContent = '继续努力！';
    }
}

// 更新时间状态警告（倒计时模式）
function updateTimeStatusWarning() {
    if (elements.timeStatus) {
        if (gameState.remainingSeconds <= 5) {
            elements.timeStatus.textContent = '⚠️ 最后5秒！';
        } else if (gameState.remainingSeconds <= 10) {
            elements.timeStatus.textContent = '⚠️ 最后10秒！';
        } else {
            elements.timeStatus.textContent = '抓紧时间！';
        }
    }
}

// 处理任务完成
function handleTaskComplete() {
    const currentTask = gameState.currentTask;

    if (!currentTask) return;

    // 停止倒计时
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }

    // 检查是否在倒计时结束前完成
    const completedInTime = gameState.remainingSeconds > 0;

    // 播放点击音效
    gameState.soundManager.playClickSound();

    if (completedInTime) {
        // 闯关成功！
        handleTaskSuccess(currentTask);
    } else {
        // 超时完成（虽然技术上不应该发生，因为按钮会被禁用）
        handleTaskTimeout(currentTask);
    }
}

// 处理任务成功
function handleTaskSuccess(task) {
    // 播放成功音效
    gameState.soundManager.playSuccessSound();

    // 添加到已完成列表
    if (!gameState.completedTaskIds.includes(task.id)) {
        gameState.completedTaskIds.push(task.id);
        gameState.completedTasks++;
    }

    // 检查成就
    gameState.achievementSystem.checkAndUnlockAchievements('flash_completions', gameState.completedTasks);

    // 保存任务完成记录
    saveTaskCompletion(task.id, 'success');

    // 显示成功反馈
    if (elements.timeStatus) {
        elements.timeStatus.textContent = '🎉 闯关成功！';
    }

    // 1秒后返回任务选择界面
    setTimeout(() => {
        showTaskSelection();

        // 检查是否所有任务都完成了
        if (gameState.completedTasks >= gameState.totalTasks) {
            handleAllTasksComplete();
        }
    }, 1000);
}

// 处理任务超时
function handleTaskTimeout(task) {
    // 播放失败音效
    gameState.soundManager.playErrorSound();

    // 显示超时反馈
    if (elements.timeStatus) {
        elements.timeStatus.textContent = '⏰ 时间到了！下次加油！';
    }

    // 2秒后返回任务选择界面
    setTimeout(() => {
        showTaskSelection();
    }, 2000);
}


// 播放完成音效
// 音效已由soundManager统一管理

function getCelebrationMessage() {
    return voiceTemplates.celebration;
}

// 处理所有任务完成
function handleAllTasksComplete() {
    // 停止计时器
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    // 更新连续完成天数
    updateStreakDays();
    
    // 检查多项成就
    // 完成所有任务成就
    const allTasksCount = (storageManager.getGameData().allTasksCount || 0) + 1;
    storageManager.getGameData().allTasksCount = allTasksCount;
    storageManager.saveGameData(storageManager.getGameData());
    gameState.achievementSystem.checkAndUnlockAchievements('all_tasks_complete', allTasksCount);
    
    // 连续完成天数成就（已在handleTaskComplete中检查）
    
    // 检查是否所有任务都提前完成
    if (gameState.flashCompletions >= gameState.totalTasks) {
        const perfectDays = (storageManager.getGameData().perfectDays || 0) + 1;
        storageManager.getGameData().perfectDays = perfectDays;
        storageManager.saveGameData(storageManager.getGameData());
        gameState.achievementSystem.checkAndUnlockAchievements('perfect_day', perfectDays);
    }
    
    // 显示庆祝界面
    setTimeout(() => {
        // 播放庆祝音效
        gameState.soundManager.playCelebrationSound();
        elements.celebrationScreen.classList.remove('hidden');
        
        // 生成庆祝消息
        let celebrationMsg = getCelebrationMessage();
        
        elements.celebrationMessage.textContent = celebrationMsg;
        
        
        
        // 显示勋章（如果达到条件）
        checkAndShowMedal();
        
    }, 1000);
}

// 检查并显示勋章
function checkAndShowMedal() {
    // 检查连续完成天数勋章
    if (gameState.streakDays >= 3 && gameState.streakDays < 7) {
        showMedal('晨光小勇士', '连续3天完成所有任务，你真厉害！');
    } else if (gameState.streakDays >= 7) {
        showMedal('晨光超级英雄', '连续7天完成所有任务，你是真正的超级英雄！');
    }
    
    // 检查闪电完成勋章
    if (gameState.flashCompletions >= gameState.totalTasks) {
        showMedal('闪电侠', '今天所有任务都提前完成，你是速度之王！');
    }
}

// 显示勋章
function showMedal(title, description) {
    elements.medalTitle.textContent = title;
    elements.medalDescription.textContent = description;
    elements.medalSection.classList.remove('hidden');
}

// 保存任务完成
function saveTaskCompletion(taskIndex, status) {
    // 使用存储管理器保存任务完成状态
    storageManager.recordTaskCompletion(taskIndex, status);
}

// 显示设置弹窗
function showSettingsModal() {
    elements.settingsModal.classList.remove('hidden');
    // 更新当前音效包显示
    updateCurrentSoundPackDisplay(gameState.soundManager.getCurrentSoundPack());
    // 渲染任务列表
    renderTaskList();
}

function hideSettingsModal() {
    elements.settingsModal.classList.add('hidden');
}

// 重置本周数据
function resetWeekData() {
    if (confirm('确定要重置本周数据吗？此操作不可撤销！')) {
        const success = storageManager.resetWeekData();
        if (success) {
            alert('本周数据已成功重置！');
            // 更新UI显示
            updateAchievementCount();
        } else {
            alert('重置数据失败，请稍后再试。');
        }
        hideSettingsModal();
    }
}

// 重置今天数据
function resetTodayData() {
    if (confirm('确定要重置今天数据吗？此操作不可撤销！')) {
        const success = storageManager.resetTodayData();
        if (success) {
            alert('今天数据已成功重置！');
            // 重置游戏状态中的任务完成计数
            gameState.completedTasks = 0;
            // 重新加载游戏以刷新任务状态
            if (typeof startGame === 'function') {
                startGame();
            }
        } else {
            alert('重置数据失败，请稍后再试。');
        }
        hideSettingsModal();
    }
}

// 保存用户任务配置函数已在前面定义

// 渲染任务列表
function renderTaskList() {
    const taskListElement = document.getElementById('taskList');
    if (!taskListElement) return;
    
    // 清空现有任务列表
    taskListElement.innerHTML = '';
    
    // 确保有任务数据
    if (!gameState.tasks || gameState.tasks.length === 0) {
        taskListElement.innerHTML = '<p class="no-tasks">暂无任务，请添加任务</p>';
        return;
    }
    
    // 渲染每个任务
    gameState.tasks.forEach((task, index) => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.dataset.index = index;
        
        taskItem.innerHTML = `
            <div class="task-item-header">
                <span class="task-index">${index + 1}</span>
                <button class="task-remove-button" data-index="${index}">🗑️</button>
            </div>
            <div class="task-fields">
                <div class="task-field">
                    <label>任务名称:</label>
                    <input type="text" class="task-name-input" value="${task.name || ''}" placeholder="输入任务名称">
                </div>
                <div class="task-field">
                    <label>任务图标:</label>
                    <input type="text" class="task-icon-input" value="${task.icon || '📝'}" placeholder="输入表情图标">
                </div>
                <div class="task-field-row">
                    <div class="task-field">
                        <label>开始时间:</label>
                        <input type="time" class="task-start-time" value="${task.startTime || '00:00'}">
                    </div>
                    <div class="task-field">
                        <label>截止时间:</label>
                        <input type="time" class="task-deadline-time" value="${task.deadlineTime || '00:00'}">
                    </div>
                </div>
            </div>
        `;
        
        taskListElement.appendChild(taskItem);
    });
    
    // 添加删除任务的事件监听
    document.querySelectorAll('.task-remove-button').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeTask(index);
        });
    });
}

// 添加新任务
function addNewTask() {
    const newTask = {
        id: Date.now(), // 使用时间戳作为临时ID
        name: '新任务',
        icon: '📝',
        startTime: '00:00',
        deadlineTime: '00:00'
    };
    
    // 添加到游戏状态
    gameState.tasks.push(newTask);
    gameState.totalTasks = gameState.tasks.length;
    
    // 重新渲染任务列表
    renderTaskList();
    
    // 播放点击音效
    gameState.soundManager.playClickSound();
}

// 删除任务
function removeTask(index) {
    if (gameState.tasks.length <= 1) {
        alert('至少保留一个任务');
        return;
    }
    
    // 从游戏状态中移除
    gameState.tasks.splice(index, 1);
    gameState.totalTasks = gameState.tasks.length;
    
    // 重新渲染任务列表
    renderTaskList();
    
    // 播放点击音效
    gameState.soundManager.playClickSound();
}

// 保存当前任务配置
function saveCurrentTaskConfig() {
    const taskItems = document.querySelectorAll('.task-item');
    const updatedTasks = [];
    
    taskItems.forEach((item, index) => {
        const task = {
            id: index + 1, // 重新分配ID，从1开始连续编号
            name: item.querySelector('.task-name-input').value.trim(),
            icon: item.querySelector('.task-icon-input').value.trim(),
            startTime: item.querySelector('.task-start-time').value,
            deadlineTime: item.querySelector('.task-deadline-time').value
        };
        
        // 验证任务数据
        if (!task.name) {
            alert('任务名称不能为空');
            return;
        }
        
        if (!task.icon) {
            task.icon = '📝'; // 默认图标
        }
        
        updatedTasks.push(task);
    });
    
    // 保存到本地存储
    if (storageManager.saveUserTasksConfig(updatedTasks)) {
        alert('任务配置已保存！');
        // 重新开始游戏以应用新配置
        startGame();
        
        // 播放成功音效
        gameState.soundManager.playSuccessSound();
        
        // 关闭设置弹窗
        hideSettingsModal();
    } else {
        alert('保存失败，请重试');
    }
}

// 重置为默认配置
function resetToDefaultTasks() {
    if (confirm('确定要恢复默认任务配置吗？当前配置将被覆盖。')) {
        // 清除本地存储的用户配置
        localStorage.removeItem(storageManager.userTasksKey);
        
        // 更新游戏状态为默认任务
        gameState.tasks = JSON.parse(JSON.stringify(defaultTasks)); // 深拷贝
        gameState.totalTasks = gameState.tasks.length;
        
        // 重新渲染任务列表
        renderTaskList();
        
        // 重新开始游戏
        startGame();
        
        alert('已恢复默认任务配置');
        
        // 播放点击音效
        gameState.soundManager.playClickSound();
    }
}

// 更新成就计数显示
function updateAchievementCount() {
    // 从存储中获取闪电完成次数
    const gameData = storageManager.getGameData();
    elements.achievementCount.textContent = `闪电完成: ${gameData.flashCompletions || 0}`;
}

// 加载成就数据
function loadAchievementData() {
    try {
        const gameData = storageManager.getGameData();
        gameState.streakDays = gameData.streakDays || 0;
        gameState.flashCompletions = gameData.flashCompletions || 0;
        
        // 加载本周统计数据
        const weekStats = storageManager.getWeekStats();
        gameState.weekStats = weekStats;
        
        // 更新成就计数显示
        elements.achievementCount.textContent = `闪电完成: ${gameState.flashCompletions}`;
    } catch (e) {
        console.error('加载成就数据失败:', e);
    }
}

// 保存成就数据
function saveAchievementData() {
    try {
        const gameData = storageManager.getGameData();
        gameData.streakDays = gameState.streakDays;
        gameData.flashCompletions = gameState.flashCompletions;
        gameData.totalCompletions = gameState.completedTasks;
        storageManager.saveGameData(gameData);
    } catch (e) {
        console.error('保存成就数据失败:', e);
    }
}

// 更新连续完成天数
function updateStreakDays() {
    // 使用存储管理器更新连续天数
    gameState.streakDays = storageManager.updateStreakDays();
    saveAchievementData();
}

// 获取当前连续完成天数
function getCurrentStreak() {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) { // 最多检查一年
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (localStorage.getItem(`completed_${dateStr}`)) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// 注意: resetWeekData 函数已在文件上方定义，这里不再重复定义

// 检测页面可见性变化，确保在页面激活时更新
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && gameState.isInitialized) {
        updateTaskDisplay();
        startCountdown();
    }
});

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 创建成就通知元素
    createAchievementNotificationElement();
    
    // 为了确保音频正常工作，在用户首次交互时初始化音效
    document.addEventListener('click', initializeAudioOnUserInteraction, { once: true });
    
    initGame();
    
    // 检查是否是首次访问，如果是，显示引导
    if (storageManager.isFirstVisit()) {
        showFirstVisitGuide();
    }
});

// 在用户首次交互时初始化音频
function initializeAudioOnUserInteraction() {
    // 播放一个几乎听不到的点击声来初始化音频上下文
    gameState.soundManager._playTone({ frequency: 20, duration: 0.01, type: 'sine' });
}

// 创建成就通知元素
function createAchievementNotificationElement() {
    const notification = document.createElement('div');
    notification.id = 'achievement-notification';
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-content">
            <div class="achievement-title" id="achievement-title">新成就！</div>
            <div class="achievement-description" id="achievement-description">你解锁了一项新成就！</div>
        </div>
    `;
    document.body.appendChild(notification);
}

// 显示首次访问引导
function showFirstVisitGuide() {
    // 创建引导覆盖层
    const guideOverlay = document.createElement('div');
    guideOverlay.className = 'overlay';
    guideOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    guideOverlay.style.zIndex = '2000';
    guideOverlay.innerHTML = `
        <div class="task-card" style="max-width: 90%; margin: auto; background: white; padding: 30px; border-radius: 20px;">
            <h2 style="color: #FF6B6B; margin-bottom: 20px; text-align: center;">欢迎来到晨光冲锋队！</h2>
            <p style="font-size: 1.2rem; line-height: 1.6; margin-bottom: 20px;">这是你的早晨闯关游戏！每完成一步，点击"✅ 我完成了！"按钮，就能解锁新成就哦！</p>
            <button id="start-guide-btn" class="complete-button" style="width: 100%; margin-top: 20px;">开始冒险吧！</button>
        </div>
    `;
    document.body.appendChild(guideOverlay);
    
    // 点击按钮关闭引导
        document.getElementById('start-guide-btn').addEventListener('click', () => {
            // 播放点击音效
            gameState.soundManager.playClickSound();
            guideOverlay.remove();
            storageManager.setFirstVisit(false);
        });
}

// 暴露一些函数供调试使用（可选）
window.gameState = gameState;
window.resetWeekData = resetWeekData;
