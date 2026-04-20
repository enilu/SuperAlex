# 轻量小游戏模板

这个模板用于在 SuperAlex 中快速新增小游戏。

## 目录结构

```
light-game-template/
├── index.html
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── config.js
│       ├── app.js
│       ├── gameManager.js
│       └── storageManager.js
```

## 使用步骤

1. 复制目录并改名（例如 `PinyinMatch/`）。
2. 修改 `index.html` 的标题和页面结构。
3. 在 `config.js` 中配置关卡与 localStorage key。
4. 在 `gameManager.js` 写核心玩法逻辑。
5. 在 `app.js` 绑定 DOM 和交互。
6. 将新游戏入口加入根目录 `index.html`。

## 约定

- 使用 ES Modules (`type="module"`)。
- 使用 localStorage 保存简单进度（key 使用项目前缀）。
- UI 文案面向儿童，句子短，反馈积极。
- 首版先做 MVP：一局 2~3 分钟可结束。
