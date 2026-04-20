import { CONFIG } from './config.js';

export class GameManager {
  constructor() {
    this.score = 0;
    this.running = false;
    this.timeLeft = 0;
    this.matched = 0;
    this.totalPairs = 0;
    this.cards = [];
    this.selectedCard = null;
    this.mode = 'easy';
  }

  setMode(mode) {
    this.mode = mode;
  }

  startRound() {
    const level = CONFIG.levels[this.mode];
    this.score = 0;
    this.running = true;
    this.timeLeft = level.timeLimit;
    this.matched = 0;
    this.totalPairs = level.pairs;
    this.selectedCard = null;
    this.cards = this.generateCards(level.pairs);
  }

  generateCards(pairCount) {
    const shuffledColors = [...CONFIG.colors].sort(() => Math.random() - 0.5);
    const selectedColors = shuffledColors.slice(0, pairCount);
    
    const cards = [];
    selectedColors.forEach((color, index) => {
      cards.push({
        id: `color-${index}-a`,
        color: color.color,
        name: color.name,
        emoji: color.emoji,
        type: 'color',
        matched: false
      });
      cards.push({
        id: `color-${index}-b`,
        color: color.color,
        name: color.name,
        emoji: color.emoji,
        type: 'color',
        matched: false
      });
    });

    return cards.sort(() => Math.random() - 0.5);
  }

  selectCard(cardId) {
    const card = this.cards.find(c => c.id === cardId);
    if (!card || card.matched) return { resolved: false, correct: false };

    if (!this.selectedCard) {
      this.selectedCard = card;
      return { resolved: false, correct: false };
    }

    if (this.selectedCard.id === cardId) {
      this.selectedCard = null;
      return { resolved: true, correct: false };
    }

    if (this.selectedCard.color === card.color) {
      this.selectedCard.matched = true;
      card.matched = true;
      this.matched += 1;
      this.score += CONFIG.successBonus + this.timeLeft * CONFIG.timeBonus;
      this.selectedCard = null;
      return { resolved: true, correct: true };
    }

    this.selectedCard = null;
    return { resolved: true, correct: false };
  }

  tick() {
    if (!this.running) return;
    this.timeLeft -= 1;
    if (this.timeLeft <= 0) {
      this.running = false;
    }
  }

  isWin() {
    return this.matched === this.totalPairs;
  }

  getSelectedCardId() {
    return this.selectedCard ? this.selectedCard.id : null;
  }
}
