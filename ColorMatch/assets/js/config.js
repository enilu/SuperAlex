export const CONFIG = {
  storageKey: 'colormatch_stats',
  // 颜色配置
  colors: [
    { name: '红色', color: '#ef4444', emoji: '🔴' },
    { name: '橙色', color: '#f97316', emoji: '🟠' },
    { name: '黄色', color: '#eab308', emoji: '🟡' },
    { name: '绿色', color: '#22c55e', emoji: '🟢' },
    { name: '蓝色', color: '#3b82f6', emoji: '🔵' },
    { name: '紫色', color: '#a855f7', emoji: '🟣' },
    { name: '粉色', color: '#ec4899', emoji: '💗' },
    { name: '青色', color: '#06b6d4', emoji: '💚' },
    { name: '棕色', color: '#92400e', emoji: '🤎' },
    { name: '灰色', color: '#6b7280', emoji: '⬜' }
  ],
  // 难度配置
  levels: {
    easy: { pairs: 3, timeLimit: 60 },
    medium: { pairs: 4, timeLimit: 50 },
    hard: { pairs: 6, timeLimit: 40 }
  },
  successBonus: 10,
  timeBonus: 2
};
