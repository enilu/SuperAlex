import { CONFIG } from './config.js';

const DEFAULT_STATS = {
  bestScore: 0,
  totalRounds: 0,
  totalWins: 0,
  maxStreak: 0,
  levelWins: {
    k1: 0,
    g1: 0,
    g2: 0
  }
};

export class StorageManager {
  loadStats() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return { ...DEFAULT_STATS };
      const parsed = JSON.parse(raw);
      return {
        bestScore: Number(parsed.bestScore) || 0,
        totalRounds: Number(parsed.totalRounds) || 0,
        totalWins: Number(parsed.totalWins) || 0,
        maxStreak: Number(parsed.maxStreak) || 0,
        levelWins: {
          k1: Number(parsed.levelWins?.k1) || 0,
          g1: Number(parsed.levelWins?.g1) || 0,
          g2: Number(parsed.levelWins?.g2) || 0
        }
      };
    } catch (_) {
      return { ...DEFAULT_STATS };
    }
  }

  saveStats(stats) {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(stats));
  }
}