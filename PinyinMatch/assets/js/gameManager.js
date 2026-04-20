import { CONFIG } from './config.js';

function pickRandomItems(items, count) {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export class GameManager {
  constructor() {
    this.mode = 'k1';
    this.timeLeft = 0;
    this.score = 0;
    this.streak = 0;
    this.matched = 0;
    this.running = false;
    this.finished = false;
    this.selectedCharId = null;
    this.selectedPinyinId = null;
    this.wrongPair = null;
    this.cards = [];
  }

  setMode(mode) {
    if (!CONFIG.levels[mode]) return;
    this.mode = mode;
  }

  startRound() {
    const level = CONFIG.levels[this.mode];
    const selected = pickRandomItems(level.dataset, CONFIG.roundSize);

    this.cards = selected.map((item, idx) => ({
      id: idx,
      char: item.char,
      pinyin: item.pinyin,
      matched: false
    }));

    this.timeLeft = level.timeLimit;
    this.score = 0;
    this.streak = 0;
    this.matched = 0;
    this.running = true;
    this.finished = false;
    this.selectedCharId = null;
    this.selectedPinyinId = null;
    this.wrongPair = null;
  }

  tick() {
    if (!this.running) return;
    this.timeLeft = Math.max(0, this.timeLeft - 1);
    if (this.timeLeft === 0) {
      this.running = false;
      this.finished = true;
    }
  }

  selectChar(id) {
    if (!this.running) return;
    const target = this.cards.find((card) => card.id === id);
    if (!target || target.matched) return;
    this.selectedCharId = id;
    this.wrongPair = null;
  }

  selectPinyin(id) {
    if (!this.running) return { resolved: false, correct: false };
    const target = this.cards.find((card) => card.id === id);
    if (!target || target.matched) return { resolved: false, correct: false };

    this.selectedPinyinId = id;

    if (this.selectedCharId === null) {
      return { resolved: false, correct: false };
    }

    const correct = this.selectedCharId === this.selectedPinyinId;

    if (correct) {
      const card = this.cards.find((it) => it.id === this.selectedCharId);
      card.matched = true;
      this.matched += 1;
      this.streak += 1;
      this.score += CONFIG.successBonus + this.streak * CONFIG.streakBonus;
      this.selectedCharId = null;
      this.selectedPinyinId = null;
      this.wrongPair = null;

      if (this.matched === this.cards.length) {
        this.running = false;
        this.finished = true;
      }

      return { resolved: true, correct: true };
    }

    this.streak = 0;
    this.score = Math.max(0, this.score - CONFIG.wrongPenalty);
    this.wrongPair = { charId: this.selectedCharId, pinyinId: this.selectedPinyinId };
    this.selectedCharId = null;
    this.selectedPinyinId = null;
    return { resolved: true, correct: false };
  }

  clearWrongState() {
    this.wrongPair = null;
  }

  isWin() {
    return this.matched === this.cards.length && this.finished;
  }
}
