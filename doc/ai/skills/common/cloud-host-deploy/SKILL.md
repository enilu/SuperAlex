---
name: superalex-cloud-host-deploy
description: 将 SuperAlex 游戏站或学习工作台 homework（原学习资料馆）部署到 cloud-host（superalex.enilu.cn）。用户提到部署 SuperAlex、部署 homework、发布学习工作台、同步 superalex.enilu.cn、更新线上游戏或 homework 页面时使用。游戏站只同步静态页面；homework 走 Flask 服务（waitress + systemd），脚本自动完成备份、依赖、迁移、重启与抽检；files/ 资料文件不同步，也不动 /game/ 微应用。
---

# SuperAlex 部署到 cloud-host

把本仓库的静态内容（游戏站）和 homework 工作台发布到 `root@cloud-host` 上已有的 Nginx 站点。本机已配置免密：`ssh root@cloud-host`。

部署方式固定为 **git 拉取发布**：本地提交并 push，登录服务器进入源码目录 `/root/workspace/SuperAlex` 执行 `git pull`，再在该目录里运行部署脚本。**禁止从开发机 scp / tar 直传站点目录**（脚本的 remote 模式只是后备，不是规范流程）。

同域名有三个根，先按用户口令选目标，不要混发：

| 用户说法 | 目标 | 仓库目录 | 线上目录 |
| --- | --- | --- | --- |
| 部署 SuperAlex / 上线游戏 | 游戏首页 | 仓库根（各游戏目录） | `/opt/microapp-store/site/superalex` |
| 部署 homework / 学习工作台 | Flask 应用 + 回滚静态页 | `homework/` | 服务 `homework-workbench`；静态副本 `/opt/microapp-store/site/homework` |
| （本 skill 不处理） | `/game/` 微应用 | 无 | `/opt/microapp-store/site/game` |

## 何时使用

- 用户要求部署、发布、上线或同步 SuperAlex 游戏。
- 用户要求部署 homework、学习工作台、学习资料馆，或更新 `superalex.enilu.cn/homework`。
- 用户提到 `cloud-host`、`superalex.enilu.cn`。

## 目标与边界

- 游戏目标：只同步游戏静态文件到 SuperAlex 根目录。
- homework 目标：部署 Flask 工作台（依赖、迁移、systemd 服务重启、公网抽检）；站点目录只同步回滚用旧静态页（`index.html`、`assets/`、`data/`）。资料文件 `files/`、预览库 `assets/vendor/` 只留在服务器。
- 站点地图、Nginx 路径以服务器 `/root/SERVER-SITES.md` 为准；不要把该文件全文复制进 skill。
- homework 的 `/homework/` 已反代 `127.0.0.1:8085`，HTTPS 由 Certbot 管理；脚本与 Nginx 改动必须 `nginx -t` 后 reload，不 `--delete`、不重启无关服务。
- 代码流转只走 Git：本地仓库（聚合工作区入口 `projects/SuperAlex`）→ `origin/main` → 服务器 `/root/workspace/SuperAlex`。本地只做提交与 push，所有发布命令在服务器仓库根目录执行。

## 硬规则

1. 部署前先 `ssh root@cloud-host` 读取 `/root/SERVER-SITES.md` 的 SuperAlex 段和 Nginx 变更规范，再核对有效配置。该文件是快照，线上问题必须以 `nginx -t` / `nginx -T` 和实际目录为准。
2. 按目标写入对应目录，禁止串站：
   - 游戏：只写 `/opt/microapp-store/site/superalex`
   - homework：只写 `/opt/microapp-store/site/homework` 下的页面和 `data/homework.json`，禁止改 `files/`、`assets/vendor/`、`/root/private-learning-library/`
   - 任何目标都禁止写入 `/opt/microapp-store/site/game/`
3. 先备份再覆盖。默认备份到 `/root/backups/superalex-<时间戳>/`。
4. 不部署 `.git`、`doc/`、`templates/`、IDE/AI 目录、日志、`node_modules`。
5. 不默认 `--delete`。线上若有仓库没有的文件，留下并在结果里说明。
6. 改 Nginx 前按服务器文档备份配置；`nginx -t` 通过后才能 `systemctl reload nginx`，不要 `restart`。
7. 站点路径、域名、location 发生变化后，必须更新服务器 `/root/SERVER-SITES.md` 的「最近核对」时间和相关表格。纯静态文件同步不必改该文档。
8. 不要把密码、密钥、证书私钥写入 skill、会话或 Git。
9. 代码与静态文件只能通过 Git 进入服务器。禁止用 scp、sftp、rsync、共享目录把文件从开发机拷贝到 `/root/workspace/SuperAlex` 或任何站点目录；本地改动未提交 = 服务器拉不到，必须先提交并 push。

## 先读哪里

1. 本仓库 `README.md` 的项目结构和 AI Agent Guide。
2. 部署 homework 时先读 `homework/README.md`。
3. 本 skill 的 `references/gotchas.md`。
4. 服务器上还没有 `homework-workbench` 服务时（首次安装）：本 skill 的 `references/first-deploy.md`；日常更新不要走该篇。
5. 服务器实时事实：

```bash
ssh -o BatchMode=yes root@cloud-host 'sed -n "1,140p" /root/SERVER-SITES.md'
ssh -o BatchMode=yes root@cloud-host 'cat /etc/nginx/sites-available/superalex.enilu.cn'
```

聚合工作区根目录如果有一份 `SERVER-SITES.md`，只是离线副本，以服务器文件为准。

## 当前稳定入口（仍须先核对服务器文件）

| 项 | 值 |
| --- | --- |
| SSH | `ssh root@cloud-host` |
| 公网 | `https://superalex.enilu.cn/`（HTTP 一律 301 到 HTTPS） |
| 静态根 | `/opt/microapp-store/site/superalex` |
| Nginx | `/etc/nginx/sites-available/superalex.enilu.cn`，已在 `sites-enabled` 软链接 |
| homework 服务 | `homework-workbench.service` → `127.0.0.1:8085`（waitress，venv `/var/lib/homework-workbench/venv`） |
| 同域但禁止误伤 | `/homework/` 反代工作台（`/homework/files/` 静态直出）；`/game/` → `/opt/microapp-store/site/game/` |

游戏发布内容：根目录 `index.html`、`favicon.svg`，以及 `MornGo/`、`math20/`、`TangPoem/`、`Kingdom3/`、`PinyinMatch/`、`ColorMatch/`。有根目录 `assets/` 时一并同步。

homework 维护说明以仓库 `homework/README.md` 为准。

## 执行步骤

1. 先判断目标：游戏走 `deploy-superalex.sh`，资料馆走 `deploy-homework.sh`。口令含糊时先问清楚，不要两个一起发。
2. 本地提交：`git status --short` 检查工作树，按 `.trae/rules/git-commit-message.md` 写单行中文提交信息，提交后 `git push origin main`。有未提交改动就直接部署会漏内容，必须先提交。
3. 服务器拉取：

```bash
ssh -o BatchMode=yes -o ConnectTimeout=10 root@cloud-host 'cd /root/workspace/SuperAlex && git fetch origin && git status -sb && git pull --ff-only'
```

   拉取后 HEAD 必须等于 `origin/main`；`git status` 有本地改动或冲突就停下处理，不要在服务器上手工改文件。服务器仓库 remote 是 SSH 协议 `git@github.com:enilu/SuperAlex.git`（2026-09-27 起，服务器到 github.com 的 HTTPS 443 不通）；若突然拉不动，先在服务器上确认 remote 和网络，不要改用拷贝文件的方式绕过。
4. 连通性（在服务器上执行）：

```bash
ssh -o BatchMode=yes -o ConnectTimeout=10 root@cloud-host 'test -d /opt/microapp-store/site/superalex && test -d /opt/microapp-store/site/homework/files && test -f /root/SERVER-SITES.md && nginx -t'
```

5. 用户明确要求后再部署。先 dry-run 给出发包清单（在服务器仓库根目录执行，脚本自动进入 local 模式）：

```bash
ssh -o BatchMode=yes root@cloud-host 'cd /root/workspace/SuperAlex && bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-superalex.sh --dry-run'
ssh -o BatchMode=yes root@cloud-host 'cd /root/workspace/SuperAlex && bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh --dry-run'
```

6. 确认后执行对应脚本（同样在服务器仓库根目录）。`deploy-homework.sh` 自动完成：venv 依赖 → 备份（sqlite/uploads/files 硬链/页面/nginx 配置，保留 14 天）→ 迁移 → 同步回滚静态页 → `systemctl restart homework-workbench` → 公网抽检（含 private 直链 401/302 拦截）；`--backup` 供 cron 每日调用。
7. homework 若改动回滚用旧静态页（`index.html` / `app.js` / `style.css` / `homework.json`），按 `homework/README.md` 统一提升 `?v=` 版本号后再提交；改 `data/homework.json` 还需在服务器重跑 `python -m app.manage import-json --force` 才进数据库。
8. 若还要改 Nginx：备份配置，`nginx -t && systemctl reload nginx`，再更新 `/root/SERVER-SITES.md`。
9. 验收本次目标 URL，并抽检另外两个根路径仍返回 200。

## 验证与交付

游戏最少检查：

```bash
curl -sI https://superalex.enilu.cn/
curl -sI https://superalex.enilu.cn/MornGo/index.html
curl -sI https://superalex.enilu.cn/homework/
```

homework 最少检查：

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://superalex.enilu.cn/homework/login   # 200
curl -s https://superalex.enilu.cn/homework/api/health                                # JSON status=ok
curl -s -o /dev/null -w '%{http_code}\n' https://superalex.enilu.cn/homework/         # 302（未登录）
curl -s -o /dev/null -w '%{http_code}\n' https://superalex.enilu.cn/                  # 200
curl -s -o /dev/null -w '%{http_code}\n' https://superalex.enilu.cn/game/             # 200
```

服务状态与日志：

```bash
ssh root@cloud-host 'systemctl status homework-workbench --no-pager | head -8; journalctl -u homework-workbench -n 30 --no-pager'
```

交付时写清：目标、本地提交号与服务器 `git log -1`（两者必须一致）、同步了哪些路径、备份路径、homework 是否动过 `files/`（必须没有）、是否改 Nginx、公网抽检结果、未覆盖风险。

资料目录完整性抽检（在服务器上执行，读站点 `data/homework.json` 逐条比对 `files/`）：

```bash
cd /root/workspace/SuperAlex && python3 doc/ai/skills/common/cloud-host-deploy/scripts/check-homework-files.py
```
