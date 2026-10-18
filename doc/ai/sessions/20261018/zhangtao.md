
## 2026-10-18 17:13:58 课程表材料备注：需求与实现方案

- 用户需求：课程表支持编辑备注，周三、周五造型·美术可分别记录需要携带的材料，并可随时更新。
- 已查看项目 README、项目通用/Codex skill、homework README、课程表模板/脚本/路由、数据库迁移机制与测试。
- 方案：按学期和课程格独立保存材料备注，课程格提供新增/编辑入口，备注直接显示在课程名下；支持保存、取消、清空，刷新后保留。
- 持久化：使用现有 SQLite 新增备注表，沿用登录及 CSRF 校验；不使用或修改 localStorage，不修改原始课程表数据。
- 子任务：1. 数据存储与接口；2. 页面编辑及备注展示；3. 定向测试和使用说明。预计超过 3 个文件，按上述子任务拆分。
- 项目 README 要求“编写任何代码前，先描述实现方法并等待用户批准”；本轮仅完成只读调研和方案，等待批准后实施。
- 验证：尚无代码改动，已确认现有课程表周三第一节、周五第四节为造型·美术。
- 保留仓库原有未提交改动，未部署。

## 2026-10-18 17:18:51 课程表材料备注：实现与验证完成

- 用户已批准方案，完成三个子任务：数据库及接口、课程格备注编辑展示、测试及使用说明。
- 新增 homework/app/schedule.py、migrations/004_schedule_notes.sql、static/css/schedule.css；修改 API/页面路由、schedule.html、schedule.js、test_schedule.py、test_smoke.py 和 homework/README.md。
- 每个分科课程格可添加、修改、取消和清空备注，周三第一节及周五第四节美术课分别保存；备注直接在课程名下显示并支持换行。
- 使用现有 SQLite，按学校/班级/学期与星期/节次/科目隔离；同一学习工作台账号共享，刷新和换设备仍可查看。沿用登录、CSRF 和文本转义，最多 1000 字。
- 新增迁移仅创建备注表，不改原课表和既有数据，不涉及 localStorage；部署需按既有流程执行数据库迁移。
- 验证：python -m pytest -q --basetemp <工作区 runtime 当日目录>/homework-pytest --tb=short，85 passed（86.10s）；node --check static/js/schedule.js 通过；git diff --check 通过。
- Chromium 浏览器实测通过：独立保存、刷新回显、取消、网络失败保留草稿、手机编辑及清空，未出现 JS 异常；桌面和手机截图已检查，测试脚本、数据库及截图保存在工作区 runtime/20261018。
- 验证过程中修正测试将输入提示文字误判为已保存备注的问题；测试临时目录首次缺少父目录，创建后完整测试通过。
- 尚未部署，线上未验证；未提交代码。保留根 README.md、index.html、RevealWorld/ 和既有会话等无关改动。

## 2026-10-18 17:23:14 课程表材料备注：线上部署完成

- 用户明确要求部署到线上，按 doc/ai/skills/common/cloud-host-deploy/SKILL.md 执行 Git 发布。
- 本次仅提交 homework 相关 10 个文件，提交 7bedbe6954086eeb014e61c98181d75bc96ceea3（feat: 课程表支持编辑材料备注），已 push origin/main。
- 服务器工作树干净，fast-forward 拉取；服务器 HEAD、本地 HEAD 与 origin/main 一致。
- 已读取服务器站点说明与有效站点配置，nginx -t 通过；服务器执行部署 dry-run 后正式执行 deploy-homework.sh。
- 备份目录：/root/backups/homework-20261018-172159，包含一致性数据库备份、上传件、资料硬链和页面/配置副本。
- 数据库成功应用 004_schedule_notes.sql，无待应用迁移；homework-workbench 服务 active。
- 更新 homework 应用源码及旧静态回滚页面 index.html、assets/css、assets/js、assets/img、data/homework.json；files/、assets/vendor/ 未覆盖，Nginx 未修改，未部署游戏首页与 /game/。
- 公网脚本检查通过：登录页 200、工作台未登录 302、health 200、首页及 /game/ 200、资料 PDF 200、私有文件接口未登录 401。
- 补充公网验证：在服务器进程内生成不落盘的临时签名会话，仅用于验证，不输出会话或密钥；课程表登录态 HTTP 200，30 个课程格编辑入口和弹窗渲染正常，新版 JS/CSS 200，health 返回迁移版本 004_schedule_notes.sql；带会话及 CSRF 的非法请求被 400 拒绝，匿名备注写入被 401 拒绝。未写入业务测试备注。
- 资料完整性检查：29 + 111 条，缺失文件 0。
- 部署脚本读取 PDF 二进制时产生 ignored null byte 警告，HTTP 抽检与最终退出状态均成功，无功能失败。
- 发布前本地验证已完成：85 项 pytest 通过，桌面及手机 Chromium 编辑流程通过。生产未添加测试材料备注；用户可登录课程表开始填写。
- 根 README.md、index.html、RevealWorld/ 与既有会话等无关未提交改动保留。

## 2026-10-18 17:25:51 课程表材料备注：Git 归档

- 用户要求将相关变更提交并推送到 Git。
- 核对：功能代码、迁移、测试与使用说明已在 7bedbe6 提交并推送 origin/main，已完成线上部署。
- 本轮补充提交当日课程备注需求、实施、验证及部署会话记录，提交信息为 docs: 记录课程备注功能开发与部署。
- 只纳入本次任务的会话文件；保留揭秘世界相关 README.md、index.html、RevealWorld/ 以及 20261016 会话的原有未提交内容。
- 校验：会话内容已检查；提交前运行 git diff --cached --check，推送后核对 HEAD 与 origin/main。

## 2026-10-18 17:35:49 课程表备注：悬停添加与点击编辑

- 用户要求默认不显示添加备注，鼠标移入课程格后显示；已有备注不显示编辑按钮，鼠标移到备注上提示点击编辑。
- 按前序已授权课程备注开发、Git 提交和线上发布流程继续；拆分为交互与样式、使用说明、定向验证及发布三个子任务。
- 修改 schedule.html、schedule.css、schedule.js 与 homework/README.md。无备注的格子仅悬停或键盘聚焦时显示添加入口，触屏保留可用入口；有备注时直接点击备注按钮编辑，title 提示“点击可以编辑”，不显示独立编辑按钮。
- 保存和清空后立即切换对应入口；恢复键盘焦点到可用按钮，沿用原有数据库与接口，不涉及数据迁移或 localStorage。
- 页面 JS/CSS 版本更新为 20261018-notes-hover，避免旧缓存。
- 验证：课程表 pytest 21 passed（23.73s），node --check static/js/schedule.js 与 git diff --check 通过。
- Chromium 实测悬停显示/移出隐藏、备注直接点击和提示、刷新保留、取消、网络失败保留草稿、清空恢复添加入口、键盘聚焦、手机触摸添加均通过；无 JS 错误，桌面截图已检查。
- 本轮仅提交本次变更及当日会话，保留无关未提交内容。下一步按既有 Git 发布流程更新线上。

## 2026-10-18 17:37:23 课程表备注交互调整：线上验证完成

- 功能提交 a04d007 已推送并在服务器发布，服务 active。备份目录 /root/backups/homework-20261018-173620；数据库无待应用迁移。
- 使用 cloud-host-deploy skill，在服务器工作树干净且 Git 与 origin/main 一致后执行 dry-run，再正式部署。
- 公网登录态课程表与新版 JS/CSS 检查通过：30 个备注内容按钮具有点击编辑提示，无独立编辑备注文案，新资源版本为 20261018-notes-hover。
- 发布脚本全部抽检通过：登录页、health、首页、/game/、资料 PDF 均 200；工作台未登录 302，私有接口未登录 401。
- 资料清单完整性检查 140 条，缺失 0。files/ 与 assets/vendor/ 未覆盖，Nginx 未修改。
- 线上未写入测试备注；交互保存、清空、悬停、键盘及触屏流程已在本地 Chromium 验证。
- 本条部署记录补充提交并推送；只更新文档，无须再次重启服务。
