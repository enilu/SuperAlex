import { CONFIG } from './config.js';

export class GameManager {
  constructor() {
    this.score = CONFIG.startScore;
    this.running = false;
  }

  start() {
    this.running = true;
    this.score = CONFIG.startScore;
  }

  increase() {
    if (!this.running) return this.score;
    this.score += 1;
    return this.score;
  }
}
