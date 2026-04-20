import { CONFIG } from './config.js';
import { GameManager } from './gameManager.js';
import { StorageManager } from './storageManager.js';

const game = new GameManager();
const storage = new StorageManager();
let stats = storage.loadStats();
let timer = null;

const screens = {
  start: document.getElementById('startScreen'),
  game: document.getElementById('gameScreen'),
  result: document.getElementById('resultScreen')
};

const statusText = document.getElementById('statusText');
const timeText = document.getElementById('timeText');
const matchText = document.getElementById('matchText');
const scoreText = document.getElementById('scoreText');
const startBestText = document.getElementById('startBestText');
const resultBestText = document.getElementById('resultBestText');
const resultScoreText = document.getElementById('resultScoreText');
const resultMessageText = document.getElementById('resultMessageText');
const resultStars = document.getElementById('resultStars');
const feedbackPopup = document.getElementById('feedbackPopup');

const cardGrid = document.getElementById('cardGrid');

const startBtn = document.getElementById('startBtn');
const exitBtn = document.getElementById('exitBtn');
const resultRestartBtn = document.getElementById('resultRestartBtn');
const resultBackBtn = document.getElementById('resultBackBtn');

const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));

function switchScreen(target) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[target].classList.add('active');
}

function setStatus(message, type = 'info') {
  statusText.textContent = message;
  ['status-info', 'status-success', 'status-danger'].forEach(cls => statusText.classList.remove(cls));
  statusText.classList.add(`status-${type}`);
}

function showFeedback(emoji, text, type = 'success') {
  feedbackPopup.querySelector('.emoji').textContent = emoji;
  feedbackPopup.querySelector('.text').textContent = text;
  feedbackPopup.className = `feedback-popup ${type}`;
  
  setTimeout(() => {
    feedbackPopup.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    feedbackPopup.classList.remove('show');
  }, 1500);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function updateStats(win) {
  stats.totalRounds += 1;
  stats.bestScore = Math.max(stats.bestScore, game.score);
  if (win) stats.totalWins += 1;
  storage.saveStats(stats);
}

function calculateStars(score, timeLeft, totalPairs) {
  const efficiency = (score + timeLeft * 2) / (totalPairs * 50);
  if (efficiency >= 0.9) return 5;
  if (efficiency >= 0.7) return 4;
  if (efficiency >= 0.5) return 3;
  if (efficiency >= 0.3) return 2;
  return 1;
}

function getResultMessage(win, score, stars) {
  if (win) {
    if (stars >= 5) return `🎉 太厉害了！完美通关！得分 ${score}！`;
    if (stars >= 4) return `👏 非常棒！成功通关！得分 ${score}！`;
    if (stars >= 3) return `👍 很棒！成功配对完成！得分 ${score}！`;
    return `✨ 恭喜通关！得分 ${score}！`;
  }
  return `⏰ 时间到啦！本局得分 ${score}，继续加油！`;
}

function renderStartSummary() {
  startBestText.textContent = `历史最高：${stats.bestScore} ｜ 已玩：${stats.totalRounds} 局`;
}

function buildCardButton(card) {
  const btn = document.createElement('button');
  btn.className = 'card';
  btn.type = 'button';
  btn.style.background = `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`;
  btn.textContent = card.emoji;
  btn.dataset.id = card.id;
  return btn;
}

function renderBoard() {
  cardGrid.innerHTML = '';
  
  game.cards.forEach(card => {
    const cardBtn = buildCardButton(card);
    
    if (card.matched) cardBtn.classList.add('matched');
    if (game.getSelectedCardId() === card.id) cardBtn.classList.add('selected');
    
    cardBtn.addEventListener('click', () => {
      const result = game.selectCard(card.id);
      
      if (result.resolved && !result.correct) {
        setStatus('再试一次，你一定可以！', 'danger');
        showFeedback('😅', '再试一次！', 'error');
        cardBtn.classList.add('wrong');
        setTimeout(() => {
          cardBtn.classList.remove('wrong');
          renderBoard();
        }, 450);
      } else if (result.correct) {
        setStatus('配对成功！继续加油！', 'success');
        showFeedback('✅', '配对成功！');
      }
      
      renderBoard();
    });
    
    cardGrid.appendChild(cardBtn);
  });
}

function renderGame() {
  timeText.textContent = game.running ? `${game.timeLeft}秒` : '--';
  timeText.classList.toggle('urgent', game.running && game.timeLeft <= 10);
  matchText.textContent = `${game.matched}/${game.totalPairs}`;
  scoreText.textContent = String(game.score);
  
  if (game.cards.length > 0) {
    renderBoard();
  } else {
    cardGrid.innerHTML = '';
  }
}

function showResult(win) {
  const score = game.score;
  const stars = calculateStars(score, game.timeLeft, game.totalPairs);
  
  resultScoreText.textContent = String(score);
  resultBestText.textContent = `历史最高：${stats.bestScore} ｜ 已玩：${stats.totalRounds} 局`;
  resultMessageText.textContent = getResultMessage(win, score, stars);
  
  resultStars.innerHTML = Array.from({ length: 5 }, (_, i) => 
    `<span class="star">${i < stars ? '⭐' : '☆'}</span>`
  ).join('');
  
  switchScreen('result');
}

function finishRound() {
  stopTimer();
  const win = game.isWin();
  updateStats(win);
  renderStartSummary();
  
  if (win) {
    setStatus(`太棒了！闯关成功！得分 ${game.score}！`, 'success');
  } else {
    setStatus(`时间到，本局得分 ${game.score}。`, 'danger');
  }
  
  showResult(win);
}

function startRound() {
  game.startRound();
  
  const modeLabels = { easy: '简单', medium: '中等', hard: '困难' };
  setStatus(`${modeLabels[game.mode]}模式开始！点击卡片配对相同颜色！`, 'info');
  switchScreen('game');
  
  stopTimer();
  timer = setInterval(() => {
    game.tick();
    renderGame();
    if (!game.running) {
      finishRound();
    }
  }, 1000);
  
  renderGame();
}

function backToStart() {
  stopTimer();
  game.running = false;
  game.cards = [];
  renderStartSummary();
  switchScreen('start');
}

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modeButtons.forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    game.setMode(btn.dataset.mode);
    renderStartSummary();
  });
});

startBtn.addEventListener('click', startRound);
exitBtn.addEventListener('click', backToStart);
resultRestartBtn.addEventListener('click', startRound);
resultBackBtn.addEventListener('click', backToStart);

renderStartSummary();
switchScreen('start');
