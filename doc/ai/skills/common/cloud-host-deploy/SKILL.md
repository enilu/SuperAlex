---
name: superalex-cloud-host-deploy
description: 将 SuperAlex 游戏站或学习资料馆 homework 部署到 cloud-host（superalex.enilu.cn）。用户提到部署 SuperAlex、部署 homework、发布学习资料馆、同步 superalex.enilu.cn、更新线上游戏或资料馆页面时使用。homework 只同步页面和 homework.json，不同步 files/ 资料文件，也不动 /game/ 微应用。
---

# SuperAlex 部署到 cloud-host

把本仓库的静态内容发布到 `root@cloud-host` 上已有的 Nginx 站点。本机已配置免密：`ssh root@cloud-host`。

同域名有三个根，先按用户口令选目标，不要混发：

| 用户说法 | 目标 | 仓库目录 | 线上目录 |
| --- | --- | --- | --- |
| 部署 SuperAlex / 上线游戏 | 游戏首页 | 仓库根（各游戏目录） | `/opt/microapp-store/site/superalex` |
| 部署 homework / 发布学习资料馆 | 资料馆页面 | `homework/` | `/opt/microapp-store/site/homework` |
| （本 skill 不处理） | `/game/` 微应用 | 无 | `/opt/microapp-store/site/game` |

## 何时使用

- 用户要求部署、发布、上线或同步 SuperAlex 游戏。
- 用户要求部署 homework、学习资料馆，或更新 `superalex.enilu.cn/homework`。
- 用户提到 `cloud-host`、`superalex.enilu.cn`。

## 目标与边界

- 游戏目标：只同步游戏静态文件到 SuperAlex 根目录。
- homework 目标：只同步页面和 `data/homework.json`。资料文件 `files/`、预览库 `assets/vendor/` 只留在服务器。
- 站点地图、Nginx 路径以服务器 `/root/SERVER-SITES.md` 为准；不要把该文件全文复制进 skill。
- 默认不做 Nginx 结构改造、不加 HTTPS、不 `--delete`、不重启无关服务。
- 所有命令在 SuperAlex 仓库根目录执行（聚合工作区入口是 `projects/SuperAlex`）。

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

## 先读哪里

1. 本仓库 `README.md` 的项目结构和 AI Agent Guide。
2. 部署 homework 时先读 `homework/README.md`。
3. 本 skill 的 `references/gotchas.md`。
4. 服务器实时事实：

```bash
ssh -o BatchMode=yes root@cloud-host 'sed -n "1,140p" /root/SERVER-SITES.md'
ssh -o BatchMode=yes root@cloud-host 'cat /etc/nginx/sites-available/superalex.enilu.cn'
```

聚合工作区根目录如果有一份 `SERVER-SITES.md`，只是离线副本，以服务器文件为准。

## 当前稳定入口（仍须先核对服务器文件）

| 项 | 值 |
| --- | --- |
| SSH | `ssh root@cloud-host` |
| 公网 | `http://superalex.enilu.cn/`（当前仅 HTTP） |
| 静态根 | `/opt/microapp-store/site/superalex` |
| Nginx | `/etc/nginx/sites-available/superalex.enilu.cn`，已在 `sites-enabled` 软链接 |
| 同域但禁止误伤 | `/homework/` → `/opt/microapp-store/site/homework/`；`/game/` → `/opt/microapp-store/site/game/` |

游戏发布内容：根目录 `index.html`、`favicon.svg`，以及 `MornGo/`、`math20/`、`TangPoem/`、`Kingdom3/`、`PinyinMatch/`、`ColorMatch/`。有根目录 `assets/` 时一并同步。

homework 维护说明以仓库 `homework/README.md` 为准。

## 执行步骤

1. 先判断目标：游戏走 `deploy-superalex.sh`，资料馆走 `deploy-homework.sh`。口令含糊时先问清楚，不要两个一起发。
2. 确认工作树：`git status --short`。未提交改动可以部署，但必须在结果里写明。
3. 连通性：

```bash
ssh -o BatchMode=yes -o ConnectTimeout=10 root@cloud-host 'test -d /opt/microapp-store/site/superalex && test -d /opt/microapp-store/site/homework/files && test -f /root/SERVER-SITES.md && nginx -t'
```

4. 用户明确要求后再执行对应脚本。先 `--dry-run` 给出发包清单：

```bash
bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-superalex.sh --dry-run
bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh --dry-run
```

5. homework 若改了 `index.html` / `app.js` / `style.css` / `homework.json`，必须先按 `homework/README.md` 统一提升 `?v=` 版本号再上传。
6. 若还要改 Nginx：备份配置，`nginx -t && systemctl reload nginx`，再更新 `/root/SERVER-SITES.md`。
7. 验收本次目标 URL，并抽检另外两个根路径仍返回 200。

## 验证与交付

游戏最少检查：

```bash
curl -sI http://superalex.enilu.cn/
curl -sI http://superalex.enilu.cn/MornGo/index.html
curl -sI http://superalex.enilu.cn/homework/
```

homework 最少检查：

```bash
curl -sI http://superalex.enilu.cn/homework/
curl -sI http://superalex.enilu.cn/
curl -sI http://superalex.enilu.cn/game/
```

交付时写清：目标、同步了哪些路径、备份路径、homework 是否动过 `files/`（必须没有）、是否改 Nginx、公网抽检结果、未覆盖风险。
