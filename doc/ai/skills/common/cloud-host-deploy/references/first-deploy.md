# homework 首次部署（bootstrap）

仅当 cloud-host 上还没有 `homework-workbench` 服务时使用本篇，完成一次性安装。日常更新走 `SKILL.md` 的常规流程（`deploy-homework.sh`），不要重复本篇步骤。

所有命令在服务器上执行（`ssh root@cloud-host`）。遵守 `SKILL.md` 硬规则：先备份、不写 `/` 与 `/game/` 目录、密钥不入 Git、改 Nginx 必须 `nginx -t` 后 reload。

## 前提核对

```bash
ss -lntp | grep 8085 || echo "8085 空闲"
test -d /root/workspace/SuperAlex && test -d /opt/microapp-store/site/homework/files && test -f /root/SERVER-SITES.md && echo OK
nginx -t
```

- 服务器仓库 remote 必须是 SSH `git@github.com:enilu/SuperAlex.git`（服务器到 github.com:443 不通，不要改回 HTTPS）。
- systemd 单元以 `homework/deploy/homework-workbench.service` 为准（venv 内 `waitress-serve`）；`doc/superpowers/plans/20260927-homework-workbench.md` §8 里的 `python3 -m waitress --call` 是设计初稿写法，不要照抄。

## 1. secrets.env

```bash
mkdir -p /var/lib/homework-workbench
cp /root/workspace/SuperAlex/homework/deploy/secrets.env.example /var/lib/homework-workbench/secrets.env
vi /var/lib/homework-workbench/secrets.env    # HOMEWORK_SECRET_KEY 用 openssl rand -hex 32 生成
chmod 600 /var/lib/homework-workbench/secrets.env
```

- 全站 HTTPS 已生效（2026-09-27 起），置 `HOMEWORK_COOKIE_SECURE=1`。
- 该文件不入 Git，内容不得贴进会话、日志或文档。

## 2. 拉取代码

```bash
cd /root/workspace/SuperAlex && git fetch origin && git status -sb && git pull --ff-only
```

拉取后 HEAD 必须等于 `origin/main`；`git status` 有本地改动或冲突就停下处理，不要在服务器上手工改文件。

## 3. venv 与依赖

```bash
python3 -m venv /var/lib/homework-workbench/venv
/var/lib/homework-workbench/venv/bin/pip install --quiet --upgrade pip
/var/lib/homework-workbench/venv/bin/pip install --quiet -r /root/workspace/SuperAlex/homework/requirements.txt
/var/lib/homework-workbench/venv/bin/python -c 'import flask, waitress, bcrypt; print("deps ok")'
```

`deploy-homework.sh` 每次部署也会自动确保 venv 与依赖，此步可视为首次预装。

## 4. systemd 单元

```bash
cp /root/workspace/SuperAlex/homework/deploy/homework-workbench.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now homework-workbench
systemctl status homework-workbench --no-pager | head -8
ss -lntp | grep 8085
```

单元工作目录为 `/root/workspace/SuperAlex/homework`，环境变量来自第 1 步的 `secrets.env`。

## 5. 数据库初始化与存量导入

```bash
cd /root/workspace/SuperAlex/homework
set -a && . /var/lib/homework-workbench/secrets.env && set +a
PY=/var/lib/homework-workbench/venv/bin/python
$PY -m app.manage migrate
$PY -m app.manage status
$PY -m app.manage import-json          # data/homework.json → collections/resources，幂等（--force 才重跑）
```

## 6. 家庭账号

```bash
$PY -m app.manage create-user --username <用户名> --display <显示名>   # 口令交互输入
$PY -m app.manage list-users
```

## 7. nginx 反代（未配置过才做）

按服务器 `/root/SERVER-SITES.md` 的 SuperAlex 段执行，要点：

- `location /homework/` 用 `proxy_pass http://127.0.0.1:8085/`，不能再指向静态 alias；
- 保留更长前缀的 `location /homework/files/ { alias .../files/; }` 直出资料，两个 location 的顺序与前缀长度不要动错；
- `client_max_body_size 60m`（上传上限 50MB）、`proxy_read_timeout 300s`；
- 域名未上 HTTPS 时先 `certbot --nginx -d superalex.enilu.cn`，确认 HTTP 一律 301 到 HTTPS；
- 改配置前先备份，`nginx -t` 通过后才 `systemctl reload nginx`（不要 restart）。

## 8. 验收

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://superalex.enilu.cn/homework/login   # 200
curl -s https://superalex.enilu.cn/homework/api/health                                # JSON status=ok
curl -s -o /dev/null -w '%{http_code}\n' https://superalex.enilu.cn/homework/         # 302（未登录）
curl -s -o /dev/null -w '%{http_code}\n' https://superalex.enilu.cn/                  # 200
curl -s -o /dev/null -w '%{http_code}\n' https://superalex.enilu.cn/game/             # 200
```

再执行一次常规部署脚本，验证标准链路（含 `files/` 直出与 private 直链拦截抽检）：

```bash
cd /root/workspace/SuperAlex && bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh
```

## 9. 收尾

- 若第 7 步改过 Nginx 或路径，更新 `/root/SERVER-SITES.md` 的「最近核对」时间与相关表格。
- 每日备份（可选，cron 示例）：

```cron
0 3 * * * cd /root/workspace/SuperAlex && bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh --backup >> /root/backups/homework-cron.log 2>&1
```

- 回滚预案：回滚静态页在 `/opt/microapp-store/site/homework/`，最近备份在 `/root/backups/homework-<时间戳>/`；服务起不来时按 `SERVER-SITES.md` 备份并把 `location /homework/` 临时切回静态 alias。
