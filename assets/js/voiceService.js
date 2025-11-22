// 晨光冲锋队 - 语音服务模块

// 语音服务配置
const voiceConfig = {
    lang: 'zh-CN',
    volume: 1,
    rate: 1,
    pitch: 1,
    // 中文普通话语音首选名称列表，增加更多可能的普通话语音名称
    preferredVoices: ['Google 普通话（中国大陆）', 'Microsoft Huihui Desktop - Chinese (Simplified)', 
                      'Microsoft Yaoyao Desktop - Chinese (Simplified)', 'Microsoft Zira Desktop', 
                      'Microsoft David Desktop', 'zh-CN', 'Chinese (Simplified)', 
                      'Mandarin', 'Mandarin Chinese', 'Chinese', 'zh']
};

// 语音服务状态
const voiceState = {
    isSupported: false,
    isInitialized: false,
    availableVoices: [],
    preferredVoice: null,
    isSpeaking: false,
    speechQueue: [],
    synth: null
};

// 初始化语音服务
function initVoiceService() {
    // 检查浏览器是否支持语音合成
    if (!('speechSynthesis' in window)) {
        console.warn('您的浏览器不支持语音合成功能');
        voiceState.isSupported = false;
        return false;
    }
    
    voiceState.isSupported = true;
    voiceState.synth = window.speechSynthesis;
    
    // 加载可用的语音列表
    loadVoices();
    
    // 监听语音列表加载完成事件
    voiceState.synth.onvoiceschanged = loadVoices;
    
    voiceState.isInitialized = true;
    return true;
}

// 加载可用语音列表
function loadVoices() {
    if (!voiceState.synth) return;
    
    // 获取所有可用语音
    voiceState.availableVoices = voiceState.synth.getVoices();
    
    // 尝试找到首选的中文语音
    findPreferredVoice();
    
    console.log('可用语音列表已加载:', voiceState.availableVoices.length, '个语音可用');
}

// 查找首选语音
function findPreferredVoice() {
    // 遍历首选语音列表，找到匹配的语音
    for (const preferredName of voiceConfig.preferredVoices) {
        const foundVoice = voiceState.availableVoices.find(voice => 
            voice.name.includes(preferredName) || 
            voice.lang.includes(preferredName) ||
            voice.name.toLowerCase().includes(preferredName.toLowerCase())
        );
        
        if (foundVoice) {
            voiceState.preferredVoice = foundVoice;
            console.log('找到首选语音:', foundVoice.name);
            return foundVoice;
        }
    }
    
    // 如果没有找到首选语音，尝试找任何中文语音
    const chineseVoice = voiceState.availableVoices.find(voice => 
        voice.lang.includes('zh') || 
        voice.name.toLowerCase().includes('chinese') ||
        voice.name.includes('中文') ||
        voice.name.includes('普通话')
    );
    
    if (chineseVoice) {
        voiceState.preferredVoice = chineseVoice;
        console.log('找到中文语音:', chineseVoice.name);
        return chineseVoice;
    }
    
    console.log('未找到合适的中文语音，将使用默认语音');
    return null;
}

// 播放语音消息
function speakMessage(message, options = {}) {
    // 检查是否支持语音合成
    if (!voiceState.isSupported || !voiceState.synth) {
        console.warn('语音合成不可用');
        return false;
    }
    
    // 合并配置选项
    const finalOptions = {
        ...voiceConfig,
        ...options
    };
    
    // 创建语音实例
    const utterance = new SpeechSynthesisUtterance(message);
    
    // 设置语音参数
    utterance.lang = finalOptions.lang;
    utterance.volume = finalOptions.volume;
    utterance.rate = finalOptions.rate;
    utterance.pitch = finalOptions.pitch;
    
    // 设置首选语音（如果有）
    if (options.voice) {
        utterance.voice = options.voice;
    } else if (voiceState.preferredVoice) {
        utterance.voice = voiceState.preferredVoice;
    }
    
    // 设置事件监听器
    utterance.onstart = () => {
        voiceState.isSpeaking = true;
        console.log('语音播放开始');
    };
    
    utterance.onend = () => {
        voiceState.isSpeaking = false;
        console.log('语音播放结束');
        // 处理队列中的下一个消息
        processSpeechQueue();
    };
    
    utterance.onerror = (event) => {
        voiceState.isSpeaking = false;
        console.error('语音播放错误:', event.error);
        // 即使出错也要继续处理队列
        processSpeechQueue();
    };
    
    utterance.onpause = () => {
        voiceState.isSpeaking = false;
        console.log('语音播放暂停');
    };
    
    utterance.onresume = () => {
        voiceState.isSpeaking = true;
        console.log('语音播放恢复');
    };
    
    // 如果当前正在播放语音，将新消息加入队列
    if (voiceState.isSpeaking) {
        voiceState.speechQueue.push({ utterance, options });
        console.log('语音消息已加入队列，队列长度:', voiceState.speechQueue.length);
        return true;
    }
    
    try {
        // 停止可能正在播放的其他语音
        voiceState.synth.cancel();
        // 播放新语音
        voiceState.synth.speak(utterance);
        return true;
    } catch (error) {
        console.error('播放语音失败:', error);
        return false;
    }
}

// 处理语音队列
function processSpeechQueue() {
    if (voiceState.speechQueue.length === 0) return;
    
    const nextSpeech = voiceState.speechQueue.shift();
    console.log('开始播放队列中的下一条语音');
    
    try {
        voiceState.synth.speak(nextSpeech.utterance);
    } catch (error) {
        console.error('播放队列语音失败:', error);
        // 继续处理下一个
        processSpeechQueue();
    }
}

// 停止所有语音播放
function stopSpeech() {
    if (!voiceState.synth) return;
    
    voiceState.synth.cancel();
    voiceState.isSpeaking = false;
    voiceState.speechQueue = [];
    console.log('所有语音播放已停止');
}

// 暂停当前语音播放
function pauseSpeech() {
    if (!voiceState.synth || !voiceState.isSpeaking) return;
    
    voiceState.synth.pause();
    voiceState.isSpeaking = false;
    console.log('语音播放已暂停');
}

// 恢复暂停的语音播放
function resumeSpeech() {
    if (!voiceState.synth || voiceState.isSpeaking) return;
    
    voiceState.synth.resume();
    voiceState.isSpeaking = true;
    console.log('语音播放已恢复');
}

// 获取当前语音状态
function getSpeechStatus() {
    return {
        isSupported: voiceState.isSupported,
        isInitialized: voiceState.isInitialized,
        isSpeaking: voiceState.isSpeaking,
        queueLength: voiceState.speechQueue.length,
        availableVoicesCount: voiceState.availableVoices.length,
        hasPreferredVoice: !!voiceState.preferredVoice
    };
}

// 设置语音配置
function setVoiceConfig(newConfig) {
    Object.assign(voiceConfig, newConfig);
    // 如果更改了语言，重新查找首选语音
    if (newConfig.lang && newConfig.lang !== voiceConfig.lang) {
        findPreferredVoice();
    }
    console.log('语音配置已更新:', voiceConfig);
}

// 获取可用语音列表
function getAvailableVoices() {
    return voiceState.availableVoices.map(voice => ({
        name: voice.name,
        lang: voice.lang,
        default: voice.default
    }));
}

// 预热语音引擎（解决某些浏览器首次播放延迟问题）
function warmupVoiceEngine() {
    if (!voiceState.isSupported || !voiceState.synth) return;
    
    // 创建一个静音的短消息来预热
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0; // 静音
    utterance.lang = voiceConfig.lang;
    
    try {
        voiceState.synth.speak(utterance);
        console.log('语音引擎已预热');
    } catch (error) {
        console.warn('语音引擎预热失败:', error);
    }
}

// 生成任务完成的语音反馈
function generateTaskFeedback(task, nextTask, completionStatus, minutesEarly = 0) {
    let message = '';
    
    switch (completionStatus) {
        case 'early':
            message = `太棒啦！你比规定时间提前了${minutesEarly}分钟完成了${task.name}，真是晨光小超人！现在开始${nextTask.name}吧，${nextTask.startTime}前要开始哦！`;
            break;
        case 'on_time':
            message = `准时完成！干得漂亮！接下来请开始${nextTask.name}，记得${nextTask.startTime}前开始哦！`;
            break;
        case 'late':
            message = `今天${task.name}稍微慢了一点点，没关系，下次加油！现在快去${nextTask.name}吧，我们继续冲刺！`;
            break;
        case 'very_late':
            message = `哎呀，${task.name}时间已经过了，不过没关系，现在马上开始也不晚！抓紧哦！`;
            break;
        default:
            message = `任务${task.name}已完成，继续加油！`;
    }
    
    return message;
}

// 生成庆祝语音消息
function generateCelebrationMessage(flashCompletions = 0, streakDays = 0) {
    let message = '今日晨光冲锋圆满完成！你真棒！准备出发上学吧！';
    
    if (flashCompletions > 0) {
        message += ` 今天你提前完成了${flashCompletions}个任务，真是太棒了！`;
    }
    
    if (streakDays >= 3) {
        message += ` 你已经连续完成${streakDays}天了，继续保持！`;
    }
    
    return message;
}

// 导出语音服务函数
export {
    initVoiceService,
    speakMessage,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    getSpeechStatus,
    setVoiceConfig,
    getAvailableVoices,
    warmupVoiceEngine,
    generateTaskFeedback,
    generateCelebrationMessage
};

// 自动初始化语音服务
if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVoiceService);
} else if (typeof document !== 'undefined') {
    // 如果文档已经加载完成，直接初始化
    initVoiceService();
}