#!/usr/bin/env bash
# 学习工作台（homework workbench）部署与备份脚本。
# 部署方式固定为 git 拉取发布：本地提交并 push → 服务器 /root/workspace/SuperAlex
# git pull → 在该目录执行本脚本。禁止从开发机 scp/tar 直传站点或仓库目录。
#
# 用法：
#   bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh --dry-run
#   bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh
#   bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh --backup
#
# 默认流程：备份（库/上传件/files 硬链/页面/nginx 配置）→ venv 依赖 → 迁移
#           → 同步旧静态页回滚副本 → 重启 homework-workbench → 公网抽检。
# --backup 仅执行备份并清理 14 天前的 homework-<ts> 备份（供 cron 每日调用）。
set -euo pipefail

HOST="${SUPERALEX_SSH_HOST:-root@cloud-host}"
REMOTE_ROOT="${HOMEWORK_REMOTE_ROOT:-/opt/microapp-store/site/homework}"
REPO_ON_SERVER="${HOMEWORK_REPO_ROOT:-/root/workspace/SuperAlex}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10)
MODE="${HOMEWORK_DEPLOY_MODE:-auto}"   # auto | local | remote

SECRETS=/var/lib/homework-workbench/secrets.env
VENV=/var/lib/homework-workbench/venv
UNIT=homework-workbench.service
PUBLIC_BASE="${HOMEWORK_PUBLIC_BASE:-https://superalex.enilu.cn}"
BACKUP_ROOT=/root/backups
BACKUP_KEEP_DAYS=14

DRY_RUN=0
SKIP_BACKUP=0
BACKUP_ONLY=0

usage() {
  cat <<'EOF'
deploy-homework.sh [--dry-run] [--skip-backup] [--backup]

  --dry-run       只显示将执行的步骤，不备份、不发布、不重启
  --skip-backup   跳过备份（不推荐）
  --backup        只执行备份与过期清理（cron 每日调用），随后退出

部署模式（HOMEWORK_DEPLOY_MODE 可强制指定）：
  local   在 cloud-host 上执行（规范流程）
  remote  在开发机执行，经 ssh 完成（仅作后备）
  auto    站点目录与 /root/SERVER-SITES.md 都存在于本机时按 local，否则按 remote
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --skip-backup) SKIP_BACKUP=1; shift ;;
    --backup) BACKUP_ONLY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 2 ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

find_repo_root() {
  local dir="$1"
  while [[ "$dir" != "/" && -n "$dir" ]]; do
    if [[ -f "$dir/homework/wsgi.py" && -d "$dir/homework/app" ]]; then
      printf '%s' "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

ROOT="$(find_repo_root "$script_dir" || true)"
if [[ -z "${ROOT}" ]]; then
  ROOT="$(find_repo_root "$PWD" || true)"
fi
if [[ -z "${ROOT}" ]]; then
  echo "找不到 SuperAlex 仓库根目录（含 homework/wsgi.py）。" >&2
  exit 1
fi

if [[ "$MODE" == "auto" ]]; then
  if [[ -d "$REMOTE_ROOT" && -f /root/SERVER-SITES.md ]]; then
    MODE="local"
  else
    MODE="remote"
  fi
fi
if [[ "$MODE" != "local" && "$MODE" != "remote" ]]; then
  echo "无效的 HOMEWORK_DEPLOY_MODE: $MODE" >&2
  exit 2
fi

remote_exec() {
  if [[ "$MODE" == "local" ]]; then
    bash -c "$1"
  else
    ssh "${SSH_OPTS[@]}" "$HOST" "$1"
  fi
}

# 服务器上的仓库路径（remote 模式下与本机 ROOT 不同）
if [[ "$MODE" == "local" ]]; then
  SRV_REPO="$ROOT"
else
  SRV_REPO="$REPO_ON_SERVER"
fi
SRC="$ROOT/homework"

for need in "$SRC/wsgi.py" "$SRC/data/homework.json" "$SRC/requirements.txt"; do
  if [[ ! -f "$need" ]]; then
    echo "缺少工作台文件：$need" >&2
    exit 1
  fi
done

echo "仓库 homework: $SRC"
if [[ "$MODE" == "local" ]]; then
  echo "部署模式: local（在 cloud-host 上执行，不跨机拷贝）"
  echo "SSH: 不使用"
else
  echo "部署模式: remote（开发机经 ssh 执行，后备流程）"
  echo "SSH: $HOST"
fi
echo "站点目录: $REMOTE_ROOT"
echo "服务: $UNIT（127.0.0.1:8085）  公网: $PUBLIC_BASE"

# ---------- 备份 ----------

load_secrets() {
  remote_exec "test -f '$SECRETS'" || {
    echo "缺少 $SECRETS（首次部署见 deploy/homework-workbench.service 与 secrets.env.example）" >&2
    exit 1
  }
}

ensure_venv() {
  echo "依赖安装（venv: $VENV）..."
  remote_exec "set -e
  if [ ! -x '$VENV/bin/python' ]; then
    python3 -m venv '$VENV'
  fi
  '$VENV/bin/pip' install --quiet --upgrade pip
  '$VENV/bin/pip' install --quiet -r '$SRV_REPO/homework/requirements.txt'
  '$VENV/bin/python' -c 'import flask, waitress, bcrypt; print(\"deps ok:\", flask.__version__)'
"
}

manage() {  # manage <args...>：在承载仓库的机器上带 secrets 执行
  remote_exec "cd '$SRV_REPO/homework' && set -a && . '$SECRETS' && set +a && '$VENV/bin/python' -m app.manage $*"
}

do_backup() {
  local ts dest
  ts="$(date +%Y%m%d-%H%M%S)"
  dest="$BACKUP_ROOT/homework-$ts"
  echo "备份目标: $dest"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "  [dry-run] sqlite 备份 + uploads/ + files/（硬链）+ 页面 + nginx 配置"
    return 0
  fi
  remote_exec "mkdir -p '$dest'"
  # 1) 数据库（VACUUM INTO 在线一致性备份）
  manage backup --dir "$dest"
  # 2) private 上传件
  remote_exec "if [ -d /var/lib/homework-workbench/uploads ]; then cp -a /var/lib/homework-workbench/uploads '$dest/uploads'; fi"
  # 3) 资料 files/（同盘硬链，900MB 不占额外空间；失败则整目录复制）
  remote_exec "if [ -d '$REMOTE_ROOT/files' ]; then cp -al '$REMOTE_ROOT/files' '$dest/files' 2>/dev/null || cp -a '$REMOTE_ROOT/files' '$dest/files'; fi"
  # 4) 旧静态页面（回滚副本）+ nginx 配置
  remote_exec "cd '$REMOTE_ROOT' && mkdir -p '$dest/pages' && cp -a index.html assets data '$dest/pages/' 2>/dev/null || true; \
    cp -a /etc/nginx/sites-available/superalex.enilu.cn '$dest/' 2>/dev/null || true"
  # 5) 清理过期（只清理 homework-<数字> 形式，保留 homework-learning-* 等历史备份）
  remote_exec "find '$BACKUP_ROOT' -maxdepth 1 -type d -name 'homework-[0-9]*' -mtime +$BACKUP_KEEP_DAYS -exec rm -rf {} + 2>/dev/null || true"
  echo "备份完成: $dest（保留 $BACKUP_KEEP_DAYS 天）"
}

# ---------- 主流程 ----------

if [[ "$BACKUP_ONLY" -eq 1 ]]; then
  load_secrets
  ensure_venv
  do_backup
  exit 0
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "将执行："
  echo "  1. venv 依赖安装（$VENV，pip install -r requirements.txt）"
  echo "  2. 备份（sqlite + uploads + files 硬链 + 页面 + nginx 配置）"
  echo "  3. python -m app.manage migrate（HOMEWORK_DB=$SECRETS 内配置）"
  echo "  4. 同步旧静态页回滚副本到 $REMOTE_ROOT（不含 files/）"
  echo "  5. systemctl restart $UNIT"
  echo "  6. 公网抽检（/homework/、/homework/api/health、files/ 静态、private 直链）"
  do_backup
  exit 0
fi

remote_exec "test -d '$REMOTE_ROOT' && test -d '$REMOTE_ROOT/files' && test -f /root/SERVER-SITES.md"
load_secrets
ensure_venv

if [[ "$SKIP_BACKUP" -eq 0 ]]; then
  do_backup
else
  echo "已跳过备份。"
fi

echo "执行迁移..."
manage migrate
manage status

echo "同步旧静态页回滚副本（不含 files/、assets/vendor/）..."
cd "$SRC"
payload=()
for item in index.html assets/css assets/js assets/img data/homework.json; do
  if [[ -e "$item" ]]; then
    payload+=("$item")
  fi
done
tar czf - \
  --exclude='.git' --exclude='files' --exclude='assets/vendor' --exclude='*.bak' \
  "${payload[@]}" \
| if [[ "$MODE" == "local" ]]; then
    (cd "$REMOTE_ROOT" && tar xzf -)
  else
    ssh "${SSH_OPTS[@]}" "$HOST" "cd '$REMOTE_ROOT' && tar xzf -"
  fi

echo "重启服务..."
remote_exec "systemctl enable '$UNIT' >/dev/null 2>&1 || true; systemctl restart '$UNIT'; sleep 2; systemctl is-active '$UNIT'"
remote_exec "ss -lntp | grep 8085 || true"

echo "公网抽检:"
fail=0
check() {  # check <期望码> <URL> <可选 grep>
  local want="$1" url="$2" grep_pat="${3:-}"
  local code body
  code="$(curl -s -o /tmp/.hw_smoke_body -w '%{http_code}' --connect-timeout 10 "$url" || true)"
  body="$(cat /tmp/.hw_smoke_body 2>/dev/null || true)"
  if [[ "$code" == "$want" ]] && { [[ -z "$grep_pat" ]] || grep -q "$grep_pat" <<<"$body"; }; then
    echo "  PASS $code $url"
  else
    echo "  FAIL $code $url（期望 $want${grep_pat:+, 含 \"$grep_pat\"}）"
    fail=1
  fi
}
check 200 "$PUBLIC_BASE/homework/login"
check 302 "$PUBLIC_BASE/homework/"
check 200 "$PUBLIC_BASE/homework/api/health" "homework-workbench"
check 200 "$PUBLIC_BASE/"
check 200 "$PUBLIC_BASE/game/"
# files/ 静态直出：取 data/homework.json 第一条 path
first_path="$(remote_exec "cd '$SRV_REPO/homework' && python3 -c 'import json,sys; d=json.load(open(\"data/homework.json\",encoding=\"utf-8\")); print(d[\"collections\"][0][\"items\"][0][\"path\"])'")"
check 200 "$PUBLIC_BASE/homework/$first_path"
# private 直链未登录不得放行（Flask login_required → 302 跳登录页）
code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 10 "$PUBLIC_BASE/homework/api/files/1" || true)"
if [[ "$code" == "200" ]]; then
  echo "  FAIL $code $PUBLIC_BASE/homework/api/files/1（private 直链未登录不得 200）"
  fail=1
else
  echo "  PASS $code $PUBLIC_BASE/homework/api/files/1（未登录拦截）"
fi
rm -f /tmp/.hw_smoke_body

if [[ "$fail" -ne 0 ]]; then
  echo "抽检存在失败项，请检查服务与 nginx 配置。" >&2
  exit 4
fi
echo "部署完成。files/ 与 assets/vendor/ 未被覆盖（仅硬链备份读取）。"
