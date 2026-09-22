## 2026-09-22 18:50:00 创建 cloud-host 部署 skill

- 用户要求：把 SuperAlex 部署到 `cloud-host` 的流程沉淀为 skill，并确定存放位置与维护方式。服务器已免密 `ssh root@cloud-host`，站点地图在 `/root/SERVER-SITES.md`。
- 结论：skill 放在本仓库 `doc/ai/skills/common/cloud-host-deploy/`，不放聚合工作区 `doc/ai/skills/common/`（含真实主机/域名），也不复制 `SERVER-SITES.md` 全文。
- 线上核对：`superalex.enilu.cn` 根目录 `/opt/microapp-store/site/superalex`；`/homework/` 与 `/game/` 是独立目录，禁止误同步。当前仅 HTTP。线上尚无 `PinyinMatch/`、`ColorMatch/`。
- 新增：`SKILL.md`、`references/gotchas.md`、`scripts/deploy-superalex.sh`（`--dry-run` 已通过，未实际上传）。
- 未执行：真实部署、Nginx 修改、更新服务器 `SERVER-SITES.md`。

## 2026-09-22 19:05:00 将 homework 纳入 SuperAlex 仓库维护

- 用户要求：在 SuperAlex 新建 homework 目录，只放页面资源，资料文件留在服务器；README 说明部署方式。
- 从 cloud-host 拉取线上 `20260904-learning-library-6` 的 `index.html`、`style.css`、`app.js`、`classroom-pattern.svg`、`data/homework.json`。
- 未纳入仓库：`files/`（约 909MB）、`assets/vendor/`（PDF.js）。`.gitignore` 已排除。
- 部署：`scripts/deploy-homework.sh`（`--dry-run` 已通过，未实际上传）。
- 未执行：真实部署 homework、改 Nginx、改资料文件。

## 2026-09-22 19:12:00 提交并推送 SuperAlex

- 用户要求：聚合工作区与 SuperAlex 各自提交并推送。
- SuperAlex 提交 homework 页面、cloud-host 部署 skill 及相关说明。
- 聚合工作区 SuperAlex 接入仅改本机注册表和 Junction（gitignore），无已跟踪文件可提交。
