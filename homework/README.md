# 学习资料馆（homework）

公网入口：<http://superalex.enilu.cn/homework/>

这是 `superalex.enilu.cn` 下的独立静态站，和 SuperAlex 游戏首页不是同一套目录。本仓库只维护**页面和目录清单**；PDF / 音视频 / 图片等资料文件只保留在服务器上，不要拷进 Git。

## 仓库里有什么

```text
homework/
├── index.html                 # 页面
├── assets/css/style.css
├── assets/js/app.js
├── assets/img/                # 页面装饰图，不是学习资料
├── data/homework.json         # 资料目录清单（不是文件本身）
└── README.md
```

不要提交、也不要部署：

| 路径 | 位置 | 说明 |
| --- | --- | --- |
| `files/` | 仅服务器 `/opt/microapp-store/site/homework/files/` | 约 900MB 学习资料，本仓库 `.gitignore` 已排除 |
| `assets/vendor/` | 仅服务器 | PDF.js 等预览库，部署页面时不得覆盖或删除 |

站点地图、Nginx、隐私规则的实时说明在服务器 `/root/SERVER-SITES.md` 第 9 节。本 README 不复制那份全文。

## 线上对应关系

| 项 | 值 |
| --- | --- |
| SSH | `ssh root@cloud-host` |
| URL | `http://superalex.enilu.cn/homework/` |
| 站点目录 | `/opt/microapp-store/site/homework/` |
| Nginx | `/etc/nginx/sites-available/superalex.enilu.cn` 的 `location /homework/` |
| 资料根 | `/opt/microapp-store/site/homework/files/library/` |
| 私有资料 | `/root/private-learning-library/`，禁止通过 Nginx 暴露 |

`/` 是 SuperAlex 游戏，`/game/` 是另一套 H5 微应用。部署 homework 时不要写入这两个目录。

## 本地预览

在本目录启动静态服务：

```bash
cd homework
python -m http.server 8081
```

打开 `http://127.0.0.1:8081/`。目录和筛选可以看，资料预览会 404，因为 `files/` 不在仓库里。

## 改页面或目录时

1. 改 `index.html`、`assets/js/app.js` 或 `assets/css/style.css` 后，把下面三处版本号一起改成同一个新值（当前线上是 `20260904-learning-library-6`），否则浏览器会继续用旧缓存：
   - `index.html` 里 CSS / pdf.min.js / app.js 的 `?v=`
   - `app.js` 里 `data/homework.json?v=`
2. 新增资料：先把文件放到服务器 `files/library/...`，再在 `data/homework.json` 增加条目。只拷文件或只改 JSON 都不完整。页面不会自动扫描目录。
3. 路径规范：

```text
files/library/<学年>/<学段>/<年级>/<学期或假期>/<学科>/<内容类别>/<文件类型>/
```

学段：`primary` / `middle` / `high`；年级：`grade-01` … `grade-12`；时间：`semester-1` / `winter-break` / `semester-2` / `summer-break`；文件类型：`documents` / `images` / `audio` / `video`。

4. 含学生姓名、学号、联系方式或个人安排的文件只能进 `/root/private-learning-library/`，不要写入公开的 `homework.json`。

## 部署 homework

用户说「部署 homework / 发布学习资料馆」时走 `doc/ai/skills/common/cloud-host-deploy`。先 dry-run，确认后再上传：

```bash
bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh --dry-run
bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh
```

脚本只会覆盖：

- `index.html`
- `assets/css/`
- `assets/js/`
- `assets/img/`
- `data/homework.json`

不会上传、不会删除 `files/` 和 `assets/vendor/`。上传前在服务器备份上述页面文件到 `/root/backups/homework-pages-<时间戳>/`。

纯页面同步不必改 `/root/SERVER-SITES.md`。只有 Nginx 路径或站点地图变了才更新那份文档。
