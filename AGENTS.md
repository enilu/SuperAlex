# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SuperAlex is a collection of educational web games for children (儿童教育小游戏集). Each game is a standalone static HTML5 application with no build dependencies or frameworks.

### Sub-projects

| Directory | Name | Description |
|-----------|------|-------------|
| `MornGo/` | 晨光冲锋队 | Morning routine gamification for children - task management with timers, achievements, and sound effects |
| `math20/` | 20以内加减法 | Math practice game for addition/subtraction within 20 |
| `TangPoem/` | 唐诗小当家 | Tang Dynasty poetry learning game with recitation, fill-in-blank challenges, and progress tracking |

## Running Locally

No build step required. Start a local HTTP server in the project root or specific game directory:

```bash
# Node.js
npx serve .

# Python
python -m http.server 8080
```

Then open the game's `index.html` in browser. Direct file:// access works for basic preview but may limit some APIs.

## Architecture

### Common Patterns

All projects follow the same structure:
- **ES Modules** - JavaScript uses `import`/`export` with `type="module"` in HTML
- **No framework** - Pure vanilla JavaScript with native DOM APIs
- **localStorage** - All data persistence uses localStorage with prefixed keys
- **Controller/Manager pattern** - Logic organized into single-purpose modules (e.g., `TaskManager`, `SoundController`, `GameManager`)

### Module Structure (typical)

```
{project}/
├── index.html           # Entry point
├── assets/
│   ├── css/             # Styles
│   ├── js/
│   │   ├── config.js    # Configuration constants and defaults
│   │   ├── app.js       # Main entry, initialization, event binding
│   │   └── *Manager.js  # Domain-specific modules
│   └── sounds/          # Audio assets (mp3)
```

### MornGo-specific

- `settings.html` - Separate settings page with tab-based navigation via query params (`?tab=sound`, `?tab=tasks`)
- `icons.js` - SVG icon injection utility
- Admin mode: `settings.html?tab=tasks&admin=1` enables task deletion

### TangPoem-specific

- Poem data stored as individual JSON files in `assets/data/poems/`
- Index file `assets/data/poems.json` references all poems
- `tools/` directory contains Node.js scripts for data management and audio generation

### math20-specific

- Single-file architecture: all game logic in `game.js`
- CONFIG object at top of file controls game parameters (questions, timing, scoring)

## Code Conventions

- JavaScript: camelCase for variables/functions, PascalCase for classes/constructors
- CSS: kebab-case class names
- Chinese comments are common throughout the codebase
- UI text is in Chinese (target audience: Chinese-speaking children)

## Key localStorage Keys

| Project | Key Pattern | Purpose |
|---------|-------------|---------|
| MornGo | `morngo_*` | Tasks, achievements, sound preferences |
| TangPoem | `tangpoem_*` | Progress, achievements, settings, cached poem data |
| math20 | N/A | Currently no persistence |
