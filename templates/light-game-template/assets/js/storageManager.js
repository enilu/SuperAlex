import { CONFIG } from './config.js';

export class StorageManager {
  getBestScore() {
    const value = Number(localStorage.getItem(CONFIG.storageKey) || 0);
    return Number.isFinite(value) ? value : 0;
  }

  saveBestScore(score) {
    const current = this.getBestScore();
    if (score > current) {
      localStorage.setItem(CONFIG.storageKey, String(score));
    }
  }
}
