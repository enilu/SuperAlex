// 晨光冲锋队游戏配置文件

// 任务配置（可通过URL参数覆盖）
const defaultTasks = [
    {
        id: 1,
        name: "起床",
        icon: "🛏️",
        startTime: "06:50",
        deadlineTime: "06:55",
        nextTaskStartTime: "06:55"
    },
    {
        id: 2,
        name: "穿衣服",
        icon: "👔",
        startTime: "06:55",
        deadlineTime: "07:00",
        nextTaskStartTime: "07:00"
    },
    {
        id: 3,
        name: "刷牙洗脸",
        icon: "🦷",
        startTime: "07:00",
        deadlineTime: "07:05",
        nextTaskStartTime: "07:05"
    },
    {
        id: 4,
        name: "吃早餐",
        icon: "🍞",
        startTime: "07:05",
        deadlineTime: "07:15",
        nextTaskStartTime: "07:15"
    }
];

// 语音播报模板
const voiceTemplates = {
    earlyComplete: "太棒啦！你比规定时间提前了{minutes}分钟完成了{taskName}，真是晨光小超人！现在开始{nextTaskName}吧，{nextTaskTime}前要开始哦！",
    onTimeComplete: "准时完成！干得漂亮！接下来请开始{nextTaskName}，记得{nextTaskTime}前开始哦！",
    lateComplete: "今天{taskName}稍微慢了一点点，没关系，下次加油！现在快去{nextTaskName}吧，我们继续冲刺！",
    veryLateComplete: "哎呀，{taskName}时间已经过了，不过没关系，现在马上开始也不晚！抓紧哦！",
    celebration: "今日晨光冲锋圆满完成！你真棒！准备出发上学吧！"
};

// 游戏配置
const gameConfig = {
    // 星期几启用（0-6，0表示周日）
    enabledDays: [0,1, 2, 3, 4, 5,6], // 默认周一至周五启用
    
    // 语音设置
    voiceEnabled: true,
    voiceVolume: 1,
    voiceRate: 1,
    voicePitch: 1,
    voiceLang: 'zh-CN',
    
    // 音效设置
    soundEnabled: true,
    
    // 首次访问引导
    showIntro: true
};

// 从URL参数获取配置
function getConfigFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    let tasks = defaultTasks;
    
    // 检查是否有任务参数
    if (urlParams.has('tasks')) {
        try {
            const customTasks = JSON.parse(decodeURIComponent(urlParams.get('tasks')));
            if (Array.isArray(customTasks) && customTasks.length > 0) {
                tasks = customTasks;
            }
        } catch (e) {
            console.error('URL任务参数解析失败，使用默认配置', e);
        }
    }
    
    return tasks;
}

// 导出配置
export { defaultTasks, getConfigFromUrl, voiceTemplates, gameConfig };