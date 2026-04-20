import { GameManager } from './gameManager.js';
import { StorageManager } from './storageManager.js';

const game = new GameManager();
const storage = new StorageManager();

const statusEl = document.getElementById('status');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const startBtn = document.getElementById('startBtn');
const actionBtn = document.getElementById('actionBtn');

function render() {
  scoreEl.textContent = `当前分数：${game.score}`;
  bestEl.textContent = `历史最高：${storage.getBestScore()}`;
}

startBtn.addEventListener('click', () => {
  game.start();
  actionBtn.disabled = false;
  statusEl.textContent = '游戏开始，试试点击加分。';
  render();
});

actionBtn.addEventListener('click', () => {
  const score = game.increase();
  storage.saveBestScore(score);
  render();
});

render();
