import { getConfigFromUrl, normalizeTasks, defaultTasks } from './config.js';
import { storageManager } from './storageManager.js';
import { soundManager } from './soundEffects.js';

const elements = {
  backButton: document.getElementById('backButton'),
  soundPackButtons: document.querySelectorAll('.sound-pack-button'),
  currentSoundPack: document.getElementById('currentSoundPack'),
  taskList: document.getElementById('taskList'),
  addTaskButton: document.getElementById('addTaskButton'),
  saveTasksButton: document.getElementById('saveTasksButton'),
  resetTasksButton: document.getElementById('resetTasksButton'),
  resetTodayButton: document.getElementById('resetTodayButton'),
  resetWeekButton: document.getElementById('resetWeekButton'),
  settingsMenu: document.getElementById('settingsMenu'),
  sectionSound: document.getElementById('soundSettings'),
  sectionTasks: document.getElementById('taskConfig'),
  sectionToday: document.getElementById('resetToday'),
  sectionWeek: document.getElementById('resetWeek')
};

const state = {
  tasks: []
};

function updateCurrentSoundPackDisplay(packName) {
  const packNames = { default: '默认音效', video1: '音效包1', video2: '音效包2' };
  elements.currentSoundPack.textContent = packNames[packName] || packName;
  elements.soundPackButtons.forEach(btn => {
    if (btn.getAttribute('data-pack') === packName) btn.classList.add('selected');
    else btn.classList.remove('selected');
  });
}

async function loadSoundPreference() {
  const preferred = storageManager.getSoundPackPreference();
  if (preferred) {
    try {
      await soundManager.switchSoundPack(preferred);
      updateCurrentSoundPackDisplay(preferred);
    } catch (e) {}
  }
}

function loadTasks() {
  let tasks = [];
  if (storageManager.hasUserTasksConfig()) {
    const t = storageManager.getUserTasksConfig();
    if (Array.isArray(t)) tasks = t;
  }
  if (tasks.length === 0) tasks = getConfigFromUrl();
  state.tasks = normalizeTasks(tasks);
}

function renderTaskList() {
  const el = elements.taskList;
  if (!el) return;
  el.innerHTML = '';
  if (!state.tasks || state.tasks.length === 0) {
    el.innerHTML = '<p class="no-tasks">暂无任务，请添加任务</p>';
    return;
  }
  state.tasks.forEach((task, index) => {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.dataset.index = String(index);
    item.innerHTML = `
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
    el.appendChild(item);
  });
  document.querySelectorAll('.task-remove-button').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = parseInt(this.getAttribute('data-index'));
      removeTask(idx);
    });
  });
}

function addNewTask() {
  const newTask = { id: Date.now(), name: '新任务', icon: '📝', startTime: '00:00', deadlineTime: '00:00' };
  state.tasks.push(newTask);
  renderTaskList();
  soundManager.playClickSound();
}

function removeTask(index) {
  if (state.tasks.length <= 1) {
    alert('至少保留一个任务');
    return;
  }
  state.tasks.splice(index, 1);
  renderTaskList();
  soundManager.playClickSound();
}

function saveCurrentTaskConfig() {
  const items = document.querySelectorAll('.task-item');
  const updated = [];
  items.forEach((item, i) => {
    const t = {
      id: i + 1,
      name: item.querySelector('.task-name-input').value.trim(),
      icon: item.querySelector('.task-icon-input').value.trim() || '📝',
      startTime: item.querySelector('.task-start-time').value,
      deadlineTime: item.querySelector('.task-deadline-time').value
    };
    if (!t.name) {
      alert('任务名称不能为空');
      return;
    }
    updated.push(t);
  });
  if (updated.length === items.length && storageManager.saveUserTasksConfig(updated)) {
    alert('任务配置已保存');
    soundManager.playSuccessSound();
  } else {
    alert('保存失败，请重试');
  }
}

function resetToDefaultTasks() {
  if (confirm('确定要恢复默认任务配置吗？当前配置将被覆盖。')) {
    try {
      localStorage.removeItem(storageManager.userTasksKey);
    } catch (e) {}
    state.tasks = JSON.parse(JSON.stringify(defaultTasks));
    renderTaskList();
    soundManager.playClickSound();
  }
}

function resetTodayData() {
  if (confirm('确定要重置今天数据吗？此操作不可撤销！')) {
    const ok = storageManager.resetTodayData();
    alert(ok ? '今天数据已成功重置' : '重置数据失败，请稍后再试');
  }
}

function resetWeekData() {
  if (confirm('确定要重置本周数据吗？此操作不可撤销！')) {
    const ok = storageManager.resetWeekData();
    alert(ok ? '本周数据已成功重置' : '重置数据失败，请稍后再试');
  }
}

function applyRouting() {
  const tab = new URLSearchParams(window.location.search).get('tab');
  const showMenu = !tab;
  elements.settingsMenu.style.display = showMenu ? 'block' : 'none';
  const sections = [elements.sectionSound, elements.sectionTasks, elements.sectionToday, elements.sectionWeek];
  sections.forEach(sec => { if (sec) sec.style.display = 'none'; });
  if (tab === 'sound') elements.sectionSound.style.display = 'block';
  else if (tab === 'tasks') elements.sectionTasks.style.display = 'block';
  else if (tab === 'today') elements.sectionToday.style.display = 'block';
  else if (tab === 'week') elements.sectionWeek.style.display = 'block';
  elements.backButton.addEventListener('click', () => {
    if (tab) window.location.href = 'settings.html';
    else window.location.href = 'index.html';
  });
  return tab;
}

function init() {
  const tab = applyRouting();
  elements.soundPackButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const pack = btn.getAttribute('data-pack');
      await soundManager.switchSoundPack(pack);
      updateCurrentSoundPackDisplay(pack);
      storageManager.saveSoundPackPreference(pack);
      soundManager.playClickSound();
    });
  });
  elements.addTaskButton.addEventListener('click', addNewTask);
  elements.saveTasksButton.addEventListener('click', saveCurrentTaskConfig);
  elements.resetTasksButton.addEventListener('click', resetToDefaultTasks);
  elements.resetTodayButton.addEventListener('click', resetTodayData);
  elements.resetWeekButton.addEventListener('click', resetWeekData);
  if (!tab || tab === 'sound') loadSoundPreference();
  if (tab === 'tasks') {
    loadTasks();
    renderTaskList();
  }
}

document.addEventListener('DOMContentLoaded', init);
