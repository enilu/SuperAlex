// 任务配置功能测试脚本
console.log('开始测试任务配置功能...');

// 模拟localStorage
const mockLocalStorage = {
    data: {},
    setItem: function(key, value) {
        this.data[key] = value;
        console.log(`保存数据到键 ${key}:`, JSON.parse(value));
    },
    getItem: function(key) {
        console.log(`从键 ${key} 读取数据`);
        return this.data[key] || null;
    },
    removeItem: function(key) {
        console.log(`移除键 ${key} 的数据`);
        delete this.data[key];
    },
    clear: function() {
        console.log('清空所有数据');
        this.data = {};
    }
};

// 模拟StorageManager类
class MockStorageManager {
    constructor() {
        this.userTasksKey = 'user_tasks_config';
    }
    
    saveUserTasksConfig(tasks) {
        console.log('保存用户任务配置:', tasks);
        mockLocalStorage.setItem(this.userTasksKey, JSON.stringify(tasks));
        return true;
    }
    
    getUserTasksConfig() {
        const tasks = mockLocalStorage.getItem(this.userTasksKey);
        return tasks ? JSON.parse(tasks) : null;
    }
    
    hasUserTasksConfig() {
        return !!mockLocalStorage.getItem(this.userTasksKey);
    }
}

// 模拟normalizeTasks函数
function normalizeTasks(tasks) {
    console.log('规范化任务数据');
    return tasks.map(task => {
        const normalizedTask = { ...task };
        // 移除nextTaskStartTime字段
        delete normalizedTask.nextTaskStartTime;
        return normalizedTask;
    });
}

// 测试函数
async function runTests() {
    console.log('====================================');
    console.log('任务配置功能测试');
    console.log('====================================');
    
    const storageManager = new MockStorageManager();
    
    // 测试1: 保存任务配置
    console.log('\n测试1: 保存任务配置');
    const testTasks = [
        { id: 1, name: '测试任务1', icon: '🎯', startTime: '08:00', deadlineTime: '08:15', nextTaskStartTime: '08:15' },
        { id: 2, name: '测试任务2', icon: '🚿', startTime: '08:15', deadlineTime: '08:30', nextTaskStartTime: '08:30' }
    ];
    
    const result = storageManager.saveUserTasksConfig(normalizeTasks(testTasks));
    console.log('保存结果:', result ? '成功' : '失败');
    
    // 测试2: 检查配置是否存在
    console.log('\n测试2: 检查配置是否存在');
    const hasConfig = storageManager.hasUserTasksConfig();
    console.log('配置存在:', hasConfig ? '是' : '否');
    
    // 测试3: 加载任务配置
    console.log('\n测试3: 加载任务配置');
    const loadedTasks = storageManager.getUserTasksConfig();
    console.log('加载的任务配置:', loadedTasks);
    
    // 测试4: 验证规范化是否成功
    console.log('\n测试4: 验证规范化是否成功');
    const hasNextTaskTime = loadedTasks.some(task => 'nextTaskStartTime' in task);
    console.log('任务中是否包含nextTaskStartTime字段:', hasNextTaskTime ? '是 (失败)' : '否 (成功)');
    
    // 测试5: 更新任务配置
    console.log('\n测试5: 更新任务配置');
    const updatedTasks = [
        { id: 1, name: '更新的任务1', icon: '📚', startTime: '09:00', deadlineTime: '09:15' },
        { id: 2, name: '更新的任务2', icon: '🥣', startTime: '09:15', deadlineTime: '09:30' },
        { id: 3, name: '新增任务', icon: '🎒', startTime: '09:30', deadlineTime: '09:45' }
    ];
    
    const updateResult = storageManager.saveUserTasksConfig(updatedTasks);
    console.log('更新结果:', updateResult ? '成功' : '失败');
    
    // 再次加载并验证
    const reloadedTasks = storageManager.getUserTasksConfig();
    console.log('更新后加载的任务配置:', reloadedTasks);
    console.log('任务数量:', reloadedTasks.length);
    
    // 测试6: 清除配置
    console.log('\n测试6: 清除配置');
    mockLocalStorage.removeItem(storageManager.userTasksKey);
    const hasConfigAfterClear = storageManager.hasUserTasksConfig();
    console.log('清除后配置存在:', hasConfigAfterClear ? '是 (失败)' : '否 (成功)');
    
    console.log('\n====================================');
    console.log('测试完成!');
    console.log('====================================');
}

// 运行测试
runTests().catch(error => {
    console.error('测试过程中出现错误:', error);
});
