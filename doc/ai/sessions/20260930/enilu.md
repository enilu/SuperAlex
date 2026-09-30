## 2026-09-30 08:26:16 homework 资料管理增加学年概念（仅方案，未动代码）

- 用户要求：资料管理引入「学年」，上传与筛选都要支持；先出方案，不要动手。
- 现状摸底：`resources` 表无学年列；`collections.year` 为 INTEGER（两个 collection 同为 2026），无法区分 2025-2026 / 2026-2027，不复用；学年信息只在存量资料 `rel_path` 第二段（`files/library/2025-2026/...`）与 `collections.id` 前缀；检索四维（学科/分类/类型/可见性）无学年；两处上传（资料库页 `kind=library`、作业上传页 `kind=homework`）只传文件，元数据靠编辑弹窗事后补。
- 方案要点：`resources` 增列 `year TEXT`（迁移 `003_year.sql`，从 rel_path 解析回填，GLOB 校验 `YYYY-YYYY`）；`import-json` 插入时从 path 解析（全新环境必需）；`library.py` 检索/facets/分面计数加 year 维；API 与页面视图透传 `year` URL 参数；资料库页筛选行通用循环自动多出「学年」行，表格与编辑弹窗加学年字段；两处上传加学年下拉（默认当前学年，9 月起算 `2026-2027`）；`patch_resource` 接受 `year`（空串=清除，格式校验相邻年份）。
- 兼容与迁移：纯增量列，老库由 `run_migrations` 按序应用（与 002 同模式）；API/页面新增参数均可选；不涉及 localStorage；存量 private 上传件 rel_path 无学年段，留空待编辑补。
- 改动预估 10+ 文件，按协作约束拆三个子任务：A 后端与数据（迁移/检索/API/CLI/后端测试）→ B 资料库页 UI（筛选行/列/弹窗/上传下拉）→ C 作业上传页与文档 + 全量测试。
- 待用户拍板：①学年格式是否 `YYYY-YYYY`（不带学期）；②作业上传是否同样默认学年；③存量 private 件学年留空还是按上传年推断；④collections.year 是否保持不动（建议不动）。
- 未执行：任何代码、迁移、测试改动。

## 2026-09-30 08:39:02 落地：资料管理增加学年（A/B/C 完成）

- 按批准方案实施（学年格式 YYYY-YYYY、作业上传同默认、存量不可解析留空、collections.year 不动）：
  - A 数据与后端：新增 `homework/migrations/003_year.sql`（增列 + 索引 + 从 `files/library/YYYY-YYYY/` 回填）；`library.py` 增 `normalize_year`/`current_school_year`/`year_from_path`，检索、facets（years + current_year）、五维分面计数、serialize 支持 year；API `list_resources?year=`、`upload_files` 读 form year（缺省=当前学年，非法 400）、`patch_resource` 校验 year（空串=清除）；`views/library` URL 参数与筛选行（学年行在最前）、`views/upload` 注入 years/current_year；`uploads.save_upload` 写 year；`manage import-json` 按路径解析学年。
  - B 资料库页：toolbar 学年下拉（上传带 year）、表格学年列、data-year、编辑弹窗学年字段（datalist）、分页/清空/hint 带 year、`library.js` 与 `library.html` 版本号升 `20260930-year`。
  - C 上传页：`upload.html` 学年下拉（默认当前学年）、`upload.js` 提交 year、脚本版本号同步；`homework/README.md` 新增学年说明条目（后续条目重排序号）。
- 校验：`python -m pytest` 全量 **64 passed**（新增：003 回填、导入解析、API/页面学年筛选与 chips 排序、patch 与上传校验、上传页下拉渲染；`test_smoke` 迁移清单更新为含 003）。
- 影响与后续：15 个文件修改 + 1 个新迁移（另有既存 `MornGo/README.md` 本地改动与本任务无关，未提交）；线上生效需按 cloud-host-deploy skill 走 git push → 服务器 pull → `deploy-homework.sh`（自动 migrate 完成回填）。本轮未提交、未部署。

## 2026-09-30 08:47:00 提交推送与部署（学年功能上线）

- 本地提交：`d134631 feat: 资料管理增加学年概念，支持上传与筛选`（16 文件）、`32bfac1 docs: 更新MornGo演示地址为microapp.store`，已推送 `1a32aa3..32bfac1`，工作树干净。
- 部署（cloud-host-deploy / deploy-homework.sh，local 模式）：服务器 `git pull --ff-only` 99c5d4d→32bfac1；venv 依赖 ok；备份 `/root/backups/homework-20260930-084440`（sqlite+uploads+files 硬链+页面+nginx，保留 14 天）；**迁移 003 已应用**（schema=003，待应用 0）；`homework-workbench.service` 重启 active，127.0.0.1:8085 监听。
- 公网抽检 7 项全 PASS：login 200、`/homework/` 302、api/health 200、主站 200、/game/ 200、files 学年目录直出 200、`api/files/1` 未登录 401。未改 Nginx，未覆盖 files/ 与 assets/vendor/。
- 线上学年回填核验：resources.year 列已存在；分布 `2026-2027: 111、2025-2026: 29、空: 5`（5 条旧式路径不可解析，按方案留空，可在资料库编辑补填）。

## 2026-09-30 09:06:00 实现：校内/校外作业已完成/未完成快速筛选

- 方案（已确认）：纯前端筛选，不改后端与接口；仅 `kind` 非空页渲染 chips；统计卡保持当日全量口径；改动 3 文件不拆子任务。
- 落地：
  - `templates/overview.html`：`panel-tools` 加 `#statusFilter`（全部/已完成/未完成，带 `fcount` 计数，`{% if kind %}` 守卫），`overview.js` 版本升 `?v=20260930-p1`；
  - `static/js/overview.js`：`state.statusFilter`，render 按 status 过滤学科卡（无匹配行的卡隐藏，全隐藏提示"当前筛选下无作业"，清单为空提示不变），chips 计数取 `data.total/done/total-done` 全量，卡片计数保持学科当日全况；chips 点击切换 is-active 并重渲染（总览页无 chips 判空跳过）；打卡/切日期/维护模式后筛选保持；
  - `tests/test_tasks.py`：新增 `test_status_filter_chips`（school/extra 含 statusFilter 与 done/open、总览页不含、版本号断言）。
- 校验：`python -m pytest -q` **65 passed**；`node --check overview.js` 语法 OK。
- 未提交、未推送、未部署（待指示）。
