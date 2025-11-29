# 晨光冲锋队（H5）

一个为儿童晨间流程打造的轻量级激励游戏。通过任务引导、音效反馈与成就体系，帮助孩子养成良好的时间管理习惯，同时降低家长的催促压力。

## 演示地址

http://superalex.enilu.cn/

## 项目概述

- 目标用户：学龄前及小学低年级儿童及家长
- 项目目的：以游戏化方式引导完成早晨关键步骤（起床、穿衣、刷牙、早餐等）
- 主要功能：任务倒计时、任务完成反馈、成就系统、数据统计、任务自定义配置、设置分页面

## 安装指南

本项目为纯前端静态站点，无构建依赖。推荐使用本地静态服务器进行开发预览：

- 使用 Node（需安装 Node.js）：

```bash
npx serve .
# 或
npx http-server -c-1 .
```

- 使用 Python（已安装 Python）：

```bash
python -m http.server 8080
```

> 也可直接双击打开 `index.html` 进行基本预览，但由于浏览器安全策略，部分 API 在非 HTTP 服务下可能受限。

## 使用说明

- 进入主页面：打开 `index.html`
- 设置页面：点击右上角设置按钮，跳转 `settings.html`
- 设置分页面：通过查询参数进入具体子页
  - 音效设置：`settings.html?tab=sound`
  - 任务配置：`settings.html?tab=tasks`
  - 重置今天：`settings.html?tab=today`
  - 重置本周：`settings.html?tab=week`
- 管理员功能（任务删除）：在任务配置页加上 `admin=1` 即可显示删除图标
  - 示例：`settings.html?tab=tasks&admin=1`

## 功能特性

- 任务管理系统
  - 任务倒计时、状态提示（充裕/超时）
  - 完成后自动进入下一任务
  - 支持自定义任务流程并本地持久化
- 成就与激励系统
  - 记录闪电完成次数、连续完成天数
  - 展示勋章与庆祝界面
- 音效反馈
  - 基于 Web Audio API 的轻量音效系统
  - 可切换音效包（默认、video1、video2）
- 数据持久化
  - 使用 `localStorage` 存储游戏与统计数据
  - 支持重置今天与本周数据
- 设置分页面
  - 参考移动端设置列表布局，四个子菜单清晰分组
  - 任务配置界面栅格化布局与响应式优化
- 统一图标体系
  - SVG 线性图标库，统一描边与尺寸（默认 24x24）
  - 图标注入工具，支持 hover/disabled 状态样式

## 技术栈

- HTML5 + CSS3（响应式设计）
- 原生 JavaScript（ES Modules）
- Web Audio API（音效）
- localStorage（数据存储）
- SVG 图标库（统一视觉风格）

> 注：语音播报模块已移除，当前版本仅保留文本与音效反馈。

## 项目结构

```
SuperAlex/
├── index.html                 # 主页面
├── settings.html              # 设置列表与分页面容器
├── assets/
│   ├── css/
│   │   └── style.css          # 样式（含设置页与任务配置优化）
│   ├── js/
│   │   ├── app.js             # 主应用逻辑
│   │   ├── config.js          # 配置与默认任务
│   │   ├── taskManager.js     # 任务管理模块
│   │   ├── storageManager.js  # 本地存储模块
│   │   ├── achievementSystem.js# 成就系统模块
│   │   ├── soundEffects.js    # 音效管理模块
│   │   ├── settings.js        # 设置页交互逻辑（分页面路由）
│   │   ├── icons.js           # SVG 图标注入工具
│   │   └── config_test.js     # 配置测试文件
│   ├── icons/
│   │   └── icons.svg          # 统一图标库
│   └── sounds/                # 音效包目录（可选）
│       ├── default/
│       ├── video1/
│       └── video2/
├── test_config.js             # 任务配置功能测试脚本
└── README.md                  # 项目说明文档
```

## 开发指南

- 代码风格
  - 使用 ES Modules 与原生 DOM API
  - 命名采用小驼峰（JS）、中划线（CSS 类名）
  - 保持函数职责单一，避免过度耦合
- 贡献流程
  - Fork 仓库 → 创建分支 → 开发与自测 → 提交 PR
  - 说明改动范围与影响面，附基本验证截图或说明
- 测试方法（当前无自动化测试）
  - 本地启动静态服务器，手动验证核心流程：
    - 任务切换与倒计时更新
    - 设置分页面跳转与交互
    - 任务配置的新增/删除/保存与持久化
    - 数据重置（今天/本周）与统计刷新
  - 如启用后端删除 API：设置 `window.APP_API_BASE` 并验证删除成功/失败回退

## 运行命令

项目无需构建，推荐使用以下本地预览命令：

```bash
# Node
npx serve .

# Python
python -m http.server 8080
```

## 版本信息

- 当前版本：`v0.4.0`
- 重要更新：
  - 新增设置独立页面与分页面路由
  - 引入统一 SVG 图标体系与注入工具
  - 优化任务配置布局与底部按钮的响应式样式
  - 管理员删除功能与确认弹窗（可选后端 API）
  - 移除语音播报模块，简化交互并提升兼容性

## 许可证

本项目采用 [MIT License](LICENSE)。

---

如果你正在为孩子设计更轻松的晨间流程，这个项目是一个开箱即用且易于扩展的基础。欢迎贡献与反馈！
