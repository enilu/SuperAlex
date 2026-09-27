# 学习工作台（homework Workbench）改造方案

- 日期：2026-09-27
- 状态：实施中（P0、P1、P1.5、P2 已完成并提交）
- 视觉基线：`homework/proto/index.html`（静态原型，可直接浏览器打开预览）
- 旧版实现：`homework/index.html` + `homework/assets/js/app.js` + `homework/data/homework.json`

## 1. 背景与定位

- 现状：`homework/` 是纯静态「学习资料馆」，无登录、无交互、无写入能力，作业信息靠人工维护 JSON。
- 新定位：**学习工作台**——家长上传/新建作业 → 生成当日任务 → 孩子打开任务、写完勾选完成 → 系统统计完成率与复盘数据。
- 旧资料馆降级为工作台内**只读「资料库」**，`files/`（约 900MB）继续由 nginx 静态直出，不经 Python。

## 2. 现状盘点（服务器实测）

| 项 | 值 |
| --- | --- |
| 系统 | Ubuntu，systemd running，nginx 1.24 |
| Python | 3.12.3，`sqlite3` 3.45.1 |
| 已装依赖 | Flask 3.1.3、bcrypt 3.2.2、Jinja2 3.1.6、Werkzeug、itsdangerous |
| 缺 | gunicorn / waitress / uvicorn（需 `pip3 install`，服务器有 mihomo 代理） |
| 资源 | RAM 1.7G（可用约 864M）、磁盘剩 23G、homework 现占 913M |
| nginx | `location /homework/ { alias /opt/microapp-store/site/homework/; }` 纯静态 |
| 空闲端口 | `127.0.0.1:8085`（8080=searxng、8082=microapp、16769/16770 已占用） |
| 数据 | `homework.json` 2 个 collections / 140 条；`files/library/` 900M；`files/2026/` 学期分类 |
| HTTPS | certbot 已装，已有 5 张 `*.enilu.cn` 证书，**缺 superalex.enilu.cn** |
| 部署 | 本地 commit+push → 服务器 `git pull` → 服务器执行脚本（禁止跨机拷贝） |

## 3. 已确认决策

| 决策点 | 结论 |
| --- | --- |
| 数据存储 | **SQLite**（WAL，单文件） |
| 资料库（原资料馆） | **元数据入 SQLite、文件留文件系统**；存量 `visibility=public` 走 nginx 静态直出，新上传 `private` 落**站点外** `/var/lib/homework-workbench/uploads/`，仅经鉴权接口下载 |
| 存量 140 条管理权限 | **元数据可改（分类/标签/备注/改名），文件不可删、`rel_path` 锁定**；连文件一起删除只对本系统新上传的 private 文件开放 |
| 任务与资料关系 | 任务 ⇄ 资料 **多对多**（`task_resources`）：先上传入库，建任务时可关联 1..N 份，清单页可在线预览 |
| 账号 | **单一共享家庭账号**（表结构预留多用户） |
| HTTPS | **本期一起做**（certbot 申请 `superalex.enilu.cn`） |
| 后端框架 | Python 3.12 + Flask（已装）+ Jinja2 + 原生 JS |
| 运行方式 | `waitress` 监听 `127.0.0.1:8085`，systemd 托管 |

不引入 FastAPI / SQLAlchemy / Alembic / 前端框架：单家庭用户 + 1.7G 内存场景用不上。

## 4. 代码与目录结构

```text
SuperAlex/homework/
├── app/                      # Flask 应用包
│   ├── __init__.py           # app 工厂、蓝图注册
│   ├── config.py             # 环境变量：SECRET_KEY、DB 路径、上传限制
│   ├── db.py                 # sqlite3 连接/迁移辅助（WAL、foreign_keys）
│   ├── auth.py               # 登录、session、CSRF、登录限速
│   ├── views/                # 页面蓝图：overview / tasks / upload / library
│   ├── api/                  # JSON 蓝图：tasks、overview、stats、upload、resources、files
│   └── manage.py             # CLI：migrate / status / backup / create-user / import-json
├── templates/                # Jinja2：base / login / overview / tasks / upload / library
├── static/                   # css/js/img（承接 proto 的样式与交互）
├── migrations/               # 001_init.sql、002_legacy_ids.sql（存量导入用 legacy_id 列）
├── tests/                    # pytest：登录、任务 CRUD、打卡、上传、CSRF
├── run.py                    # 本地开发（Flask dev server, 8081）
├── wsgi.py                   # 生产（waitress）
├── requirements.txt          # 锁 Flask / bcrypt / waitress 版本
├── proto/index.html          # 静态原型（视觉基线，不部署）
├── data/homework.json        # 保留：资料库清单导入源 + 资料库数据
├── uploads/                  # 仓库内占位；服务器实际落 /var/lib/homework-workbench/uploads/
├── index.html + assets/      # 旧静态页，P4 完成后归档移除
└── README.md
```

SQLite 与上传文件、密钥一律不入 Git。

## 5. 数据模型（SQLite）

```sql
users(id, username UNIQUE, password_hash, display_name, created_at);

tasks(id, title, subject, kind CHECK(in_school|extra_school),
      due_date, est_minutes, note,
      status CHECK(open|done|cancelled), created_at, created_by,
      completed_at, completed_by, sort_order);

-- 资料库元数据：文件本体仍在文件系统
collections(id, name, year, grade, semester, summary, cover);   -- 原 homework.json 的 collections
resources(id, collection_id, kind CHECK(library|homework),
          title, subject, category, tags, note,
          rel_path,            -- public: 站点内 files/library/...；private: 站点外 uploads 绝对路径
          size, mime, sha256 UNIQUE,
          visibility CHECK(public|private),
          locked DEFAULT 0,    -- 存量 140 条 = 1：元数据可改、文件不可删、路径锁定
          created_by, created_at, updated_at);
task_resources(task_id, resource_id, PRIMARY KEY(task_id, resource_id));

checkins(id, task_id, action, actor, ts);   -- 打卡流水，供完成分析
meta(key, value);                           -- schema_version、导入标记
```

## 6. 功能范围

**本期 MVP（对应需求与原型）**

1. 登录/退出：单一共享账号，bcrypt 口令，session cookie，登录限速，统一错误提示。
2. **总览**：今日完成 `x/y` + 完成率、距 21:00 倒计时、最近 7 天完成率色块（点击看当日清单）、按学科分组的打卡清单。
3. **作业管理**：`校内作业` / `校外作业` 列表；勾选完成 / 撤销。
4. **每日清单维护（已确认：清单内维护模式 + 复制昨日，不建独立维护页）**：
   - 清单右上「维护模式」开关：关闭时只能勾选（孩子视图），开启后卡片内联可编辑；
   - 维护态支持：`+ 添加作业` 回车连续录入、行内改标题/学科/预计时长/截止日/备注、删除任务；
   - 批量操作：`复制昨日`、`复制上周同日`、`从零开始`；
   - 仅今天与未来日期可维护，历史日期只读（保护统计）。
5. **上传作业（先入库、后关联）**：白名单扩展名 + 单文件 ≤50MB + 随机存储名 + sha256 去重；上传后**先写入资料库**（`resources`，`kind=homework`、`visibility=private`，落站点外目录），再在生成任务时「关联资料」多选——本次刚传的文件默认勾选，也可搜索挑选资料库已有资料，1..N 份。
6. **资料库（原资料馆，升级为可管理）**：
   - 检索：关键词 + 学科 / 分类 / 标签 / 类型筛选（140 条量级用 `LIKE`，不上 FTS5）；
   - 管理：改名、改分类、改标签、补备注、上传新资料入库；存量 140 条 `locked=1` **元数据可改、文件不可删、`rel_path` 锁定**；
   - 访问：`public` 文件继续 nginx 静态直出（外链兼容、性能最好），`private` 文件经鉴权接口下载；
   - 入口挂侧边栏「资料库」。
7. **清单页附件**：任务行显示资料角标（`📎 n`），点开弹层在线预览 PDF / 图片 / 视频 / 音频（浏览器原生能力；资料库页保留 PDF.js 处理复杂 PDF）。
8. 完成统计：7/30 天完成率、按学科分布（纯 CSS/SVG 图表）。

**主要接口**（页面蓝图之外的 JSON API）：

```text
POST   /homework/api/login | /logout
GET    /homework/api/overview?date=YYYY-MM-DD   # 统计卡 + 当日分组清单（含附件角标）
GET    /homework/api/tasks?date=YYYY-MM-DD
POST   /homework/api/tasks                      # 单条新建（可带 resource_ids[]）
POST   /homework/api/tasks/bulk                 # 批量新建（复制昨日 / 连续录入）
PATCH  /homework/api/tasks/<id>                 # 行内编辑、打卡完成/撤销
DELETE /homework/api/tasks/<id>
POST   /homework/api/tasks/<id>/resources       # 关联 / 取消关联资料（多对多）
POST   /homework/api/upload                     # 上传入库，返回 resources id 列表
GET    /homework/api/resources?q=&subject=&category=&tag=&kind=&page=   # 资料检索
PATCH  /homework/api/resources/<id>             # 改名/分类/标签/备注（locked 不动 rel_path）
DELETE /homework/api/resources/<id>             # 仅限非 locked 的 private：删记录 + 文件
GET    /homework/api/files/<id>                 # private 鉴权下载；public 直接返回静态 URL
GET    /homework/api/stats?days=7
GET    /homework/api/health
```

**二期（暂不做）**：课程表、目标、背单词、错题与强化、英语错题本、完成分析深挖、常用作业模板与排期自动生成。

## 7. 认证与安全

- bcrypt 哈希存口令；`SECRET_KEY` 来自 `/var/lib/homework-workbench/secrets.env`（chmod 600，不入 Git）。
- Flask 签名 session：`HttpOnly` + `SameSite=Lax`，HTTPS 后 `Secure`。
- 所有写操作 POST + 会话级 CSRF token；登录接口限速（5 次/分钟/IP），错误提示不区分账号或密码错误。
- 上传落盘：扩展名白名单（jpg/png/pdf/mp4/mov/mp3/txt/zip）、单文件 ≤50MB、随机存储名 + sha256 去重；`private` 文件写入**站点目录之外** `/var/lib/homework-workbench/uploads/<yyyy>/<随机名>`，nginx 不可达，下载一律 `GET /api/files/<id>` 鉴权后 `send_file`，禁止路径穿越。
- 存量 `public` 资料属公开教育资料，继续由 nginx 静态直出（性能最好、兼容旧外链）；`visibility` 是唯一边界，**新上传默认 `private`**，只有手工标记才转 public。

## 8. 部署与运维

1. **HTTPS**：`certbot --nginx -d superalex.enilu.cn`，80→443 跳转，纳入现有 certbot 续期。
2. **nginx**：
   - `location /homework/` 由 `alias` 改为 `proxy_pass http://127.0.0.1:8085/`；
   - 保留 `location /homework/files/ { alias ...; }` 直出资料库，禁目录索引；
   - `client_max_body_size 60m`、`proxy_read_timeout 300s`。
3. **systemd**：新增 `/etc/systemd/system/homework-workbench.service`
   `ExecStart=/usr/bin/python3 -m waitress --host=127.0.0.1:8085 --call wsgi:app`，
   `Restart=always`，`EnvironmentFile=/var/lib/homework-workbench/secrets.env`。
4. **部署脚本改造**（沿用「本地 push → 服务器 git pull → 服务器执行」）：
   `deploy-homework.sh` 流程改为：备份 → 同步代码（排除 `files/`、`*.db`、`proto/`；`uploads/` 在站点外，与代码同步无关）→ `pip3 install -r requirements.txt`（变更时）→ `python3 -m app.manage migrate` → `systemctl restart homework-workbench` → curl 验收（`/homework/` 200、未登录 302、`files/` 静态 200、`/homework/api/health` 200、private 直连 URL 404/403）。
5. **备份**：`sqlite3 homework.db ".backup"` + `/var/lib/homework-workbench/uploads/` + `files/` 增量，每日复制到 `/root/backups/homework-<ts>/`（部署脚本 `--backup`，保留 14 份）。
6. **回滚**：旧静态页保留在 Git 历史 + 每次部署前页面备份；nginx 配置备份在 `/etc/nginx/sites-available/*.bak-*`，可一键切回纯静态。

## 9. 分阶段实施与验收点

| 阶段 | 内容 | 工作量 | 验收 |
| --- | --- | --- | --- |
| P0 | 仓库重构、Flask 骨架、config/CLI、本地 `run.py` 起 8081 | 0.5d | 本地空白页 + `/api/health` 200 |
| P1 | SQLite 迁移、单账号登录、CSRF、限速 | 0.5d | 未登录 302、错口令不放行、pytest 通过 |
| P1.5 | `manage.py` 导入 `homework.json` → collections/resources（140 条 `locked=1`、`visibility=public`） | 0.5d | 140 条导入、资料库页可浏览、旧静态路径仍 200 |
| P2 | 任务 CRUD、打卡完成/撤销、**清单维护模式 + 复制昨日**、总览 API + 页面 | 1.5d | 建 8 条任务、复制昨日一键成单、维护态内联增删改；勾选后完成率与 7 天色块联动 |
| P3 | 上传入库、任务⇄资料多对多关联、private 鉴权下载、清单页附件预览 | 1.5d | 上传→入库→关联→勾选→预览/下载全链路，越权 404 |
| P3.5 | 资料库管理页：检索筛选、改名/分类/标签、上传入库、删除保护（`locked` 不可删文件） | 1d | 140 条可搜可改元数据不可删文件；新传 private 可删 |
| P4 | UI 对齐 `proto/`（总览/上传/资料库三页 + 移动端） | 0.5d | 原型已锁定交互，仅做还原与响应式自检 |
| P5 | systemd / nginx / HTTPS / 脚本改造 / 备份 / 回滚演练 | 0.5d | 线上 HTTPS 全链路验收 + 一次回滚演练 |
| P6 | 文档同步：`homework/README.md`、deploy skill、SERVER-SITES 章节 | 0.5d | 文档与实际一致，`check-homework-files.py` 抽检通过 |

合计约 7 人日，每阶段单独 commit（中文单行，遵循 SuperAlex 提交规范）。

## 10. 风险与应对

- **1.7G 内存**：单 worker waitress + SQLite WAL 足够，不装多进程方案。
- **900MB 资料走代理会打满带宽**：存量 `public` 资料保留 nginx 直出，Python 只代理 `private` 上传件（单文件 ≤50MB）与元数据。
- **误删存量资料**：`locked=1` 记录禁止删除文件与改路径，管理页不展示删除按钮；删除仅对本系统新上传的 private 文件开放，且二次确认。
- **HTTPS 失败**：certbot 走 HTTP-01，DNS 已指向该机；失败则保持 80 并暂关 `Secure` cookie，风险写入文档。
- **回滚窗口**：P5 上线前先备份 nginx 配置与页面；服务起不来时 5 分钟内可切回静态页。
- **单账号共享口令**：口令只存哈希；后续要区分完成人再加用户（表结构已预留 `users`/`checkins.actor`）。

## 11. 待拍板细节（已有默认值，不阻塞）

> 已确认不再待定：数据存储=SQLite、资料库=**元数据入 SQLite + 文件留文件系统**（存量 public 静态直出、新传 private 落站点外鉴权下载，存量 `locked` 只改元数据不可删文件）、账号=单一共享、HTTPS=本期做、清单维护=清单内维护模式+复制昨日、上传=先入库后关联多选（见第 3、5、6 节）。以下仍按默认值执行：

1. 打卡口径：任一登录者可勾选/撤销，流水记 `actor` 为当前显示名。
2. 当日任务：新建任务带截止日，状态 `open` 即进入当天清单；上传作业默认归当天。
3. `files/2026/` 学期分类目录：保留为资料库第二入口，UI 按学年分组。
