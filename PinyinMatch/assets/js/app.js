import { CONFIG } from './config.js';
import { GameManager } from './gameManager.js';
import { StorageManager } from './storageManager.js';

const game = new GameManager();
const storage = new StorageManager();
let stats = storage.loadStats();
let timer = null;
let pinyinOrder = [];

const BADGES = [
  { id: 'first_win', name: '初露锋芒', icon: '🎖️', condition: (s) => s.totalWins >= 1 },
  { id: 'five_wins', name: '小试牛刀', icon: '🏅', condition: (s) => s.totalWins >= 5 },
  { id: 'ten_wins', name: '百战百胜', icon: '🥇', condition: (s) => s.totalWins >= 10 },
  { id: 'perfect', name: '完美配对', icon: '💎', condition: (s) => s.bestScore >= 100 },
  { id: 'streak_master', name: '连击大师', icon: '🔥', condition: (s) => s.maxStreak >= 6 },
  { id: 'g1_clear', name: '一年级通关', icon: '📚', condition: (s) => s.levelWins.g1 >= 1 },
  { id: 'g2_clear', name: '二年级通关', icon: '🎯', condition: (s) => s.levelWins.g2 >= 1 },
  { id: 'all_clear', name: '全部通关', icon: '👑', condition: (s) => s.levelWins.k1 >= 1 && s.levelWins.g1 >= 1 && s.levelWins.g2 >= 1 }
];

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
const resultRank = document.getElementById('resultRank');
const badgesContainer = document.getElementById('badgesContainer');
const feedbackPopup = document.getElementById('feedbackPopup');

const charGrid = document.getElementById('charGrid');
const pinyinGrid = document.getElementById('pinyinGrid');

const startBtn = document.getElementById('startBtn');
const exitBtn = document.getElementById('exitBtn');
const resultRestartBtn = document.getElementById('resultRestartBtn');
const resultBackBtn = document.getElementById('resultBackBtn');

const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
const STATUS_CLASSES = ['status-info', 'status-success', 'status-danger', 'status-win'];

function switchScreen(target) {
  Object.values(screens).forEach((screen) => screen.classList.remove('active'));
  screens[target].classList.add('active');
}

function setStatus(message, type = 'info') {
  statusText.textContent = message;
  STATUS_CLASSES.forEach((name) => statusText.classList.remove(name));
  statusText.classList.add(`status-${type}`);
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
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

function getEarnedBadges() {
  return BADGES.filter(badge => badge.condition(stats));
}

function renderBadges(badges) {
  if (badges.length === 0) {
    badgesContainer.innerHTML = '<p class="no-badges">继续挑战获取勋章！</p>';
    return;
  }
  
  badgesContainer.innerHTML = badges.map(badge => `
    <div class="badge-item">
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-name">${badge.name}</div>
    </div>
  `).join('');
}

function updateStats(win) {
  stats.totalRounds += 1;
  if (win) stats.totalWins += 1;
  stats.bestScore = Math.max(stats.bestScore, game.score);
  stats.maxStreak = Math.max(stats.maxStreak, game.streak);
  
  if (win) {
    stats.levelWins[game.mode] = (stats.levelWins[game.mode] || 0) + 1;
  }
  
  storage.saveStats(stats);
}

function calculateStars(score, timeLeft, totalCards) {
  const timeBonus = timeLeft * 2;
  const efficiency = (score + timeBonus) / (totalCards * 20);
  
  if (efficiency >= 0.9) return 5;
  if (efficiency >= 0.7) return 4;
  if (efficiency >= 0.5) return 3;
  if (efficiency >= 0.3) return 2;
  return 1;
}

function getRank(stars) {
  const ranks = ['继续加油', '不错哦', '很棒', '非常棒', '完美！'];
  return ranks[stars - 1] || '继续加油';
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
  startBestText.textContent = `历史最高：${stats.bestScore} ｜ 已玩：${stats.totalRounds} 局 ｜ 胜利：${stats.totalWins} 局`;
}

function buildCardButton(label, id, type) {
  const btn = document.createElement('button');
  btn.className = 'card';
  btn.type = 'button';
  btn.textContent = label;
  btn.dataset.id = String(id);
  btn.dataset.type = type;
  return btn;
}

function shuffledIds() {
  const ids = game.cards.map((card) => card.id);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

function renderBoard() {
  charGrid.innerHTML = '';
  pinyinGrid.innerHTML = '';
  if (pinyinOrder.length !== game.cards.length) {
    pinyinOrder = shuffledIds();
  }

  game.cards.forEach((card) => {
    const charBtn = buildCardButton(card.char, card.id, 'char');
    if (card.matched) charBtn.classList.add('matched');
    if (game.selectedCharId === card.id) charBtn.classList.add('selected');
    if (game.wrongPair && game.wrongPair.charId === card.id) charBtn.classList.add('wrong');

    charBtn.addEventListener('click', () => {
      game.selectChar(card.id);
      speak(card.char);
      renderGame();
    });

    charGrid.appendChild(charBtn);
  });

  pinyinOrder.forEach((id) => {
    const card = game.cards.find((item) => item.id === id);
    const pinyinBtn = buildCardButton(card.pinyin, card.id, 'pinyin');
    if (card.matched) pinyinBtn.classList.add('matched');
    if (game.selectedPinyinId === card.id) pinyinBtn.classList.add('selected');
    if (game.wrongPair && game.wrongPair.pinyinId === card.id) pinyinBtn.classList.add('wrong');

    pinyinBtn.addEventListener('click', () => {
      const result = game.selectPinyin(card.id);
      if (result.resolved && !result.correct) {
        setStatus('再试一次，你一定可以！', 'danger');
        showFeedback('😅', '再试一次！', 'error');
        setTimeout(() => {
          game.clearWrongState();
          renderGame();
        }, 450);
      } else if (result.correct) {
        setStatus('配对成功！继续加油！', 'success');
        showFeedback('✅', '配对成功！');
        
        if (game.streak >= 3) {
          setStatus(`🔥 连击 ${game.streak} 次！太厉害了！`, 'success');
        }
      }
      renderGame();
    });

    pinyinGrid.appendChild(pinyinBtn);
  });
}

function renderGame() {
  timeText.textContent = game.running ? `${game.timeLeft}秒` : '--';
  timeText.classList.toggle('urgent', game.running && game.timeLeft <= 10);
  matchText.textContent = `${game.matched}/${game.cards.length || 0}`;
  scoreText.textContent = String(game.score);

  if (game.cards.length > 0) {
    renderBoard();
  } else {
    charGrid.innerHTML = '';
    pinyinGrid.innerHTML = '';
  }
}

function showResult(win) {
  const score = game.score;
  const stars = calculateStars(score, game.timeLeft, game.cards.length);
  const earnedBadges = getEarnedBadges();
  
  resultScoreText.textContent = String(score);
  resultBestText.textContent = `历史最高：${stats.bestScore} ｜ 已玩：${stats.totalRounds} 局 ｜ 胜利：${stats.totalWins} 局`;
  resultMessageText.textContent = getResultMessage(win, score, stars);
  resultRank.textContent = getRank(stars);
  
  resultStars.innerHTML = Array.from({ length: 5 }, (_, i) => 
    `<span class="star">${i < stars ? '⭐' : '☆'}</span>`
  ).join('');
  
  renderBadges(earnedBadges);
  
  switchScreen('result');
}

function finishRound() {
  stopTimer();
  const win = game.isWin();
  updateStats(win);
  renderStartSummary();

  if (win) {
    setStatus(`太棒了！闯关成功！得分 ${game.score}！`, 'win');
  } else {
    setStatus(`时间到，本局得分 ${game.score}。`, 'danger');
  }

  showResult(win);
}

function startRound() {
  const level = CONFIG.levels[game.mode];
  game.startRound();
  pinyinOrder = shuffledIds();
  
  const modeLabels = { k1: '幼儿园', g1: '一年级', g2: '二年级' };
  setStatus(`${modeLabels[game.mode]}模式开始！先点汉字再点拼音。`, 'info');
  switchScreen('game');

  stopTimer();
  timer = setInterval(() => {
    game.tick();
    renderGame();
    if (!game.running) {
      finishRound();
    }
  }, CONFIG.tickMs);

  renderGame();
}

function backToStart() {
  stopTimer();
  game.running = false;
  game.cards = [];
  pinyinOrder = [];
  renderStartSummary();
  switchScreen('start');
}

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    modeButtons.forEach((item) => item.classList.remove('active'));
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