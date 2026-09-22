# SuperAlex cloud-host 部署 Gotchas

## 同域名三个根，不要当成一个站

`superalex.enilu.cn` 的 Nginx 把三条路径指到三个目录：

| URL | 磁盘目录 | 本仓库？ |
| --- | --- | --- |
| `/` | `/opt/microapp-store/site/superalex` | 是 |
| `/homework/` | `/opt/microapp-store/site/homework` | 否 |
| `/game/` | `/opt/microapp-store/site/game` | 否 |

把 SuperAlex 同步到 `/opt/microapp-store/site/` 或带 `--delete` 清站点父目录，会毁掉学习资料馆或其它 H5 游戏。

部署 homework 时只覆盖页面和 `data/homework.json`。`files/` 约 900MB，只在服务器；`assets/vendor/`（PDF.js）也只在服务器。备份 homework 时只备份页面文件，不要把整个 `files/` 拷一遍。

## SERVER-SITES.md 会过期

`/root/SERVER-SITES.md` 写明自己是人工快照。部署前要再读它，但排障仍以 `nginx -T`、`ls`、`ss -lntp` 为准。不要把整份文件粘进 skill 或 Git。

站点地图没变时，不要为了「做完部署」去改这篇文档。路径、location、域名或启用关系变了，才更新「最近核对」时间和表格。

## 不要用 --delete

线上根目录可能有仓库没有的历史文件（例如旧 `assets/`）。默认同步是覆盖同名文件，不删除线上多余项。

## 本机没有 rsync

当前开发机 Git Bash 有 `ssh`/`scp`/`tar`，没有 `rsync`。部署脚本用 `tar | ssh`。不要临时改成依赖 rsync 的流程。

## homework 缓存版本必须三处一起改

改 `homework/index.html`、`assets/js/app.js`、`assets/css/style.css` 或 `data/homework.json` 后，同步提升：

- `index.html` 里 CSS / pdf.min.js / app.js 的 `?v=`
- `app.js` 里 `homework.json?v=`

漏改任意一处，访问者会继续用旧页面或旧目录。细则见 `homework/README.md`。

## 线上落后于仓库

2026-09-22 核对：线上还没有 `PinyinMatch/`、`ColorMatch/`，首页也可能偏旧。全量部署会把这两个游戏带上去，这是预期差异，不是事故。先 `--dry-run` 让用户看见新增目录。

## 不要部署开发资产

`doc/`、`templates/`、`.git`、`.claude`、`.trae`、会话记录、`node_modules`、`*.log` 都不应出现在公网站点。`TangPoem/tools` 等游戏目录内的辅助文件可以跟着游戏走，但不要把仓库级 AI 目录传上去。

## Nginx 变更

`sites-enabled` 里既有软链接也有普通文件。SuperAlex 当前是软链接，改 `sites-available` 即可。改完只能 `reload`，不要无故 `restart`。当前站点只有 HTTP，不要顺手上 HTTPS，除非用户明确要求。

## 权限

线上目录目前是宽权限。部署时不要「顺手 chmod 777」，也不要在未要求时收紧权限导致 Nginx 读失败。
