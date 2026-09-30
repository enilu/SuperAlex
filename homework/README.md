# 学习工作台（homework）

公网入口：<https://superalex.enilu.cn/homework/>

这是 `superalex.enilu.cn` 下的独立应用，和 SuperAlex 游戏首页不是同一套目录。当前形态是 **Flask 学习工作台**（登录、作业清单与打卡、上传入库、资料库检索），由 waitress 托管在服务器 `127.0.0.1:8085`，nginx 将 `/homework/` 反代到该服务。原静态「学习资料馆」降级为工作台内的只读资料库，并保留一套旧静态页作为回滚副本。

PDF / 音视频 / 图片等资料文件只保留在服务器上，不要拷进 Git。

## 仓库里有什么

```text
homework/
├── app/                      # Flask 应用包（工厂、蓝图、鉴权、上传）
│   └── manage.py             # 数据库运维 CLI
├── templates/                # Jinja2 页面模板
├── static/                   # 工作台 css / js / img
├── migrations/               # SQL 迁移（001_init、002_legacy_ids）
├── deploy/                   # systemd 单元与生产环境变量模板
│   ├── homework-workbench.service
│   └── secrets.env.example
├── tests/                    # pytest 用例
├── data/homework.json        # 资料目录清单（导入源，不是文件本身）
├── data/schedule.json        # 课程表数据
├── proto/                    # 静态原型（视觉基线，不部署）
├── index.html + assets/      # 旧静态资料馆页（回滚副本，部署时同步到站点目录）
├── run.py                    # 本地开发入口（8081）
├── wsgi.py                   # 生产入口（waitress）
├── requirements.txt          # 运行依赖（Flask / bcrypt / waitress）
├── requirements-dev.txt      # 开发依赖（pytest）
└── README.md
```

不要提交、也不要部署：

| 路径 | 位置 | 说明 |
| --- | --- | --- |
| `files/` | 仅服务器 `/opt/microapp-store/site/homework/files/` | 约 900MB 学习资料，本仓库 `.gitignore` 已排除 |
| `assets/vendor/` | 仅服务器 | PDF.js 等预览库，部署页面时不得覆盖或删除 |
| `var/`、`uploads/` | 本地开发数据 / 站点外上传件 | SQLite、上传件与备份不入 Git |
| `deploy/secrets.env` 对应的真实文件 | 仅服务器 `/var/lib/homework-workbench/secrets.env` | 会话密钥等生产环境变量，`chmod 600`，不入 Git |

站点地图、Nginx、隐私规则的实时说明在服务器 `/root/SERVER-SITES.md`。本 README 不复制那份全文。

## 线上对应关系

| 项 | 值 |
| --- | --- |
| SSH | `ssh root@cloud-host` |
| URL | `https://superalex.enilu.cn/homework/` |
| Flask 服务 | `homework-workbench.service`（waitress，`127.0.0.1:8085`） |
| 运行环境 | venv `/var/lib/homework-workbench/venv`；环境变量 `/var/lib/homework-workbench/secrets.env` |
| 站点目录 | `/opt/microapp-store/site/homework/`（回滚静态页 + `files/`） |
| Nginx | `location /homework/` 反代 `127.0.0.1:8085`；`/homework/files/` 静态直出 |
| 资料根 | `/opt/microapp-store/site/homework/files/library/` |
| 私有数据 | `/root/private-learning-library/` 与站点外上传件 `/var/lib/homework-workbench/uploads/`，禁止经 Nginx 暴露 |

`/` 是 SuperAlex 游戏，`/game/` 是另一套 H5 微应用。部署 homework 时不要写入这两个目录。

## 本地开发

```bash
cd homework
pip install -r requirements.txt -r requirements-dev.txt
python run.py        # http://127.0.0.1:8081/homework/
```

- 本地数据默认落 `homework/var/`（已 gitignore）：SQLite `var/homework.db`、上传件 `var/uploads/`。
- 首次本地使用先建账号：`python -m app.manage create-user --username <用户名>`，口令交互输入。
- 未注入 `HOMEWORK_SECRET_KEY` 时开发模式使用占位密钥并告警；生产必须由 `secrets.env` 注入。
- 仓库不含 `files/`，资料库页的 public 文件本地预览会 404，属预期。
- 测试：`pytest`（依赖见 `requirements-dev.txt`）。

### 数据库运维 CLI

```bash
python -m app.manage migrate                # 执行未应用的迁移
python -m app.manage status                 # 数据库与迁移状态
python -m app.manage backup --dir <目录>    # 一致性备份（VACUUM INTO）
python -m app.manage import-json            # 导入 data/homework.json 存量资料（幂等；--force 重跑，--verify 校验文件存在）
python -m app.manage create-user --username <名> [--display <显示名>]
python -m app.manage set-password --username <名>
python -m app.manage list-users
```

服务器上执行时先加载环境变量并用 venv 的 Python：

```bash
cd /root/workspace/SuperAlex/homework
set -a && . /var/lib/homework-workbench/secrets.env && set +a
/var/lib/homework-workbench/venv/bin/python -m app.manage <命令>
```

## 改页面或目录时

1. 改旧静态回滚页（`index.html`、`assets/js/app.js`、`assets/css/style.css`）后，把下面三处版本号一起改成同一个新值（最近一次为 `20260904-learning-library-6`，以线上实际为准），否则浏览器会继续用旧缓存：
   - `index.html` 里 CSS / pdf.min.js / app.js 的 `?v=`
   - `app.js` 里 `data/homework.json?v=`

   工作台的 Jinja 模板与 `static/` 不走这套版本号。
2. 新增资料：先把文件放到服务器 `files/library/...`，再在 `data/homework.json` 增加条目。只拷文件或只改 JSON 都不完整；页面不会自动扫描目录，`data/homework.json` 变更后还需在服务器重跑 `python -m app.manage import-json --force` 才进数据库。
3. 学年：资料元数据带学年字段（`YYYY-YYYY`，相邻学年，如 `2026-2027`）。存量导入从 `files/library/<学年>/` 路径解析；页面上传默认当前学年（9 月起算），资料管理页可按学年筛选，也可在编辑弹窗中修改，空值视为未设置。
4. 路径规范：

```text
files/library/<学年>/<学段>/<年级>/<学期或假期>/<学科>/<内容类别>/<文件类型>/
```

学段：`primary` / `middle` / `high`；年级：`grade-01` … `grade-12`；时间：`semester-1` / `winter-break` / `semester-2` / `summer-break`；文件类型：`documents` / `images` / `audio` / `video`。

5. 含学生姓名、学号、联系方式或个人安排的文件只能进 `/root/private-learning-library/`，或经工作台上传为 private（落站点外 `/var/lib/homework-workbench/uploads/`，走鉴权接口下载），不要写入公开的 `homework.json`。

## 部署 homework

用户说「部署 homework / 发布学习工作台 / 发布学习资料馆」时走 `doc/ai/skills/common/cloud-host-deploy` 的 `SKILL.md`。部署只走 Git，禁止从开发机 scp / tar 直传：

1. 本地提交并 `git push origin main`。
2. 服务器拉取：`cd /root/workspace/SuperAlex && git fetch origin && git status -sb && git pull --ff-only`，HEAD 必须等于 `origin/main`。
3. 在服务器仓库目录 dry-run 确认清单后执行：

```bash
bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh --dry-run
bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh
```

脚本运行在服务器上（自动 local 模式），自动完成：

1. venv 依赖安装（`/var/lib/homework-workbench/venv`）；
2. 备份到 `/root/backups/homework-<时间戳>/`（sqlite、上传件、`files/` 硬链、回滚页面、nginx 配置，保留 14 天）；
3. 数据库迁移 `python -m app.manage migrate`；
4. 同步回滚静态页：`index.html`、`assets/css`、`assets/js`、`assets/img`、`data/homework.json`；
5. `systemctl restart homework-workbench`；
6. 公网抽检（登录页 200、`/homework/` 302、health 200、游戏首页与 `/game/` 200、`files/` 直出 200、private 直链未登录拦截）。

不会同步、不会删除 `files/` 和 `assets/vendor/`；不写 `/` 与 `/game/` 目录；不改 Nginx。每日备份可由 cron 调用 `--backup` 参数。纯部署不必改 `/root/SERVER-SITES.md`，只有 Nginx 路径或站点地图变了才更新那份文档。

## 首次部署

服务器上还没有 `homework-workbench` 服务时（一次性 bootstrap：secrets、venv、systemd 单元、迁移、账号、nginx 反代），按 `doc/ai/skills/common/cloud-host-deploy/references/first-deploy.md` 执行；日常更新不要走该篇。
