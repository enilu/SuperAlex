# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SuperAlex is a collection of educational web games for children (儿童教育小游戏集). Each game is a standalone HTML5 application with zero build dependencies or frameworks. The project uses vanilla JavaScript with ES6 modules, localStorage for persistence, and follows consistent architectural patterns across games.

### Current Games

| Directory | Name | Description |
|-----------|------|-------------|
| `TangPoem/` | 唐诗小当家 | Tang Dynasty poetry learning game with recitation, fill-in-blank challenges, and progress tracking |
| `Kingdom3/` | 三国演义知识闯关 | Romance of the Three Kingdoms quiz game with 4 levels, 200 questions, pinyin support, and revive mechanics |
| `MornGo/` | 晨光冲锋队 | Morning routine gamification with task management, timers, achievements, and sound effects |
| `math20/` | 20以内加减法 | Math practice game for addition/subtraction within 20 |

### Target Audience

Chinese-speaking children (ages 3-12) and their parents. All UI text and comments are in Chinese.

## Running Locally

No build step required. Start a local HTTP server:

```bash
# Node.js
npx serve .

# Python
python -m http.server 8080
```

Navigate to the specific game directory or open the root `index.html` to access the game directory hub.

## Architecture Patterns

### Module Pattern (TangPoem & Kingdom3)

These games use a sophisticated modular architecture with ES6 modules:

**Key modules:**
- `app.js` - Entry point, initialization, event binding
- `config.js` - Configuration constants (CONFIG/GameConfig object)
- `*Manager.js` - Domain-specific modules (GameManager, UIManager, AudioManager, CacheManager, ProgressManager, etc.)

**Screen management:**
```javascript
// Each screen has class="screen" and an id
function switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName + '-screen').classList.add('active');
}
```

**Event binding pattern:**
```javascript
function bindEvents() {
    elements.btnBack?.addEventListener('click', () => {
        this.endGame(true);
    });
}
```

### localStorage Conventions

Each game uses prefixed keys to avoid conflicts:
- TangPoem: `tangpoem_*`
- Kingdom3: `kingdom3_*`
- MornGo: `morngo_*`

Common patterns: `gamename_progress`, `gamename_settings`, `gamename_questions`

### Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `app.js` | Application entry, init, event binding |
| `config.js` | Configuration constants |
| `gameManager.js` | Core game logic, state machine |
| `uiManager.js` | DOM manipulation, screen transitions, modals |
| `audioManager.js` | Sound effects, background music |
| `progressManager.js` | Progress tracking, achievements |
| `cacheManager.js` | localStorage wrapper with versioning |
| `questionManager.js` / `poemManager.js` | Domain data management |

## Adding a New Game

Follow the TangPoem/Kingdom3 pattern:

### Directory Structure
```
NewGame/
├── index.html              # Use <script type="module" src="assets/js/app.js"></script>
├── README.md
└── assets/
    ├── css/
    │   └── game.css
    ├── js/
    │   ├── app.js          # Import from config.js and manager modules
    │   ├── config.js       # Export CONFIG object
    │   └── [feature]Manager.js
    ├── data/               # Game-specific data
    └── audio/              # Sound effects
```

### index.html Template

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Title</title>
    <link rel="stylesheet" href="assets/css/game.css">
</head>
<body>
    <!-- Screens: start-screen, game-screen, result-screen, etc. -->
    <div id="app">
        <div id="start-screen" class="screen active">...</div>
        <div id="game-screen" class="screen">...</div>
    </div>

    <script type="module" src="assets/js/app.js"></script>
</body>
</html>
```

### app.js Template

```javascript
import { CONFIG } from './config.js';
import { GameManager } from './gameManager.js';
import { UIManager } from './uiManager.js';
import { AudioManager } from './audioManager.js';
import { CacheManager } from './cacheManager.js';

const AppState = {
    currentScreen: 'start',
    // ... other state
};

function init() {
    UIManager.init();
    AudioManager.init();
    GameManager.init();
    bindEvents();
}

function bindEvents() {
    // Event listeners
}

function switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName + '-screen').classList.add('active');
    AppState.currentScreen = screenName;
}

document.addEventListener('DOMContentLoaded', init);
```

### Update Root index.html

Add a game card to the main directory:

```html
<div class="game-card" onclick="location.href='NewGame/index.html'">
    <div class="game-icon">🎮</div>
    <h2 class="game-title">Game Title</h2>
    <p class="game-description">Brief description</p>
    <div class="game-tags">
        <span class="tag">tag1</span>
        <span class="tag">tag2</span>
    </div>
    <button class="play-button">Start Game</button>
</div>
```

## Code Conventions

- **JavaScript:** camelCase for variables/functions, PascalCase for classes
- **CSS:** kebab-case class names (`.game-title`, `.mode-btn`)
- **HTML IDs:** camelCase (`startScreen`, `btnBack`)
- **Comments:** Chinese comments throughout
- **UI Text:** Chinese (target audience: Chinese-speaking children)

## Key Technical Details

### ES6 Module Usage
```html
<script type="module" src="assets/js/app.js"></script>
```

### Screen Transitions
Each game screen has `class="screen"`. Only one screen has `class="screen active"` at a time.

### Progress Pattern
```javascript
// CacheManager pattern
CacheManager.set('gamename_progress', progressData);
const progress = CacheManager.get('gamename_progress', defaultProgress);
```

### Audio Management
- Common sounds: `correct.mp3`, `wrong.mp3`
- AudioManager pattern with `init()`, `play()`, `stop()`
- Web Audio API for playback

## Data Management Patterns

### TangPoem (Poetry Data)
Individual poem JSON files in `assets/data/poems/` with index file `poems.json`.

### Kingdom3 (Quiz Data)
Questions embedded in `config.js` (200 questions) plus level-specific JSON in `assets/data/levels/`.

### MornGo (Task Data)
Tasks stored in localStorage, managed through `settings.html?tab=tasks`.

## Important Files

| File | Purpose |
|------|---------|
| `index.html` | Game directory/hub with cards for each game |
| `AGENTS.md` | Development guidelines (similar to this file) |
| `README.md` | Project overview |

## MornGo-Specific Notes

- Separate `settings.html` with tab-based routing via query params (`?tab=sound`, `?tab=tasks`)
- Admin mode: `settings.html?tab=tasks&admin=1` enables task deletion
- Icons managed via `icons.js` with SVG injection

## TangPoem-Specific Notes

- `tools/` directory contains Node.js utilities for data management:
  - `validatePoems.js` - Validate poem JSON format
  - `convertPoemsToJSON.js` - Convert text to JSON
  - `generate-audio.py` - Generate recitation audio using Edge TTS
  - `addPinyin.js` - Add pinyin annotations
  - `check-audio-consistency.js` - Verify audio/poem consistency

## Kingdom3-Specific Notes

- 200 questions embedded in `config.js` with pinyin support
- 4 levels × 50 questions each, randomly selected
- Revive mechanism: one hint-based revive per level
- Question bank management UI for parents to add/edit questions
- "三国小达人" certificate upon completion

## CSS Theme Patterns

- **TangPoem:** Pink gradient (儿童友好)
- **Kingdom3:** Ancient Chinese style (金红色渐变 #d4a574, #c94b4b)
- **MornGo:** Modern responsive design
- **Root index.html:** Purple gradient (#667eea → #764ba2)
