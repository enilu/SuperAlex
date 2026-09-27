#!/usr/bin/env bash
# 将 SuperAlex/homework 的页面和目录清单发布到 cloud-host。
# 不上传 files/ 资料文件，也不覆盖 assets/vendor/。
# 部署方式：本地只负责提交代码；在服务器 /root/workspace/SuperAlex 拉取后执行本脚本，
# 脚本检测到自己运行在目标服务器上时直接本机覆盖发布，不做任何本机到服务器的文件拷贝。
# 用法：
#   bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh --dry-run
#   bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-homework.sh
set -euo pipefail

HOST="${SUPERALEX_SSH_HOST:-root@cloud-host}"
REMOTE_ROOT="${HOMEWORK_REMOTE_ROOT:-/opt/microapp-store/site/homework}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10)
MODE="${HOMEWORK_DEPLOY_MODE:-auto}"   # auto | local | remote

DRY_RUN=0
SKIP_BACKUP=0

usage() {
  cat <<'EOF'
deploy-homework.sh [--dry-run] [--skip-backup]

  --dry-run       只列出将要打包的路径，不备份、不发布
  --skip-backup   跳过页面文件备份（不推荐）

部署模式（HOMEWORK_DEPLOY_MODE 可强制指定）：
  local   在 cloud-host 上执行，站点目录已在本机，直接覆盖发布
  remote  在开发机执行，经 ssh 发布（仅作后备，规范流程是 local）
  auto    站点目录与 /root/SERVER-SITES.md 都存在于本机时按 local，否则按 remote
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --skip-backup) SKIP_BACKUP=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 2 ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

find_repo_root() {
  local dir="$1"
  while [[ "$dir" != "/" && -n "$dir" ]]; do
    if [[ -f "$dir/index.html" && -d "$dir/MornGo" && -d "$dir/homework" ]]; then
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
  echo "找不到 SuperAlex 仓库根目录。" >&2
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

SRC="$ROOT/homework"
if [[ ! -f "$SRC/index.html" || ! -f "$SRC/data/homework.json" ]]; then
  echo "缺少 homework 页面文件：$SRC" >&2
  exit 1
fi

cd "$SRC"

payload=()
for item in index.html assets/css assets/js assets/img data/homework.json; do
  if [[ -e "$item" ]]; then
    payload+=("$item")
  fi
done

echo "仓库 homework: $SRC"
if [[ "$MODE" == "local" ]]; then
  echo "部署模式: local（在 cloud-host 上本机发布，不跨机拷贝）"
  echo "SSH: 不使用"
else
  echo "部署模式: remote（开发机经 ssh 发布，后备流程）"
  echo "SSH: $HOST"
fi
echo "站点目录: $REMOTE_ROOT"
echo "将同步（不含 files/、assets/vendor/）:"
printf '  %s\n' "${payload[@]}"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "dry-run：未备份、未发布。"
  exit 0
fi

remote_exec "test -d '$REMOTE_ROOT' && test -d '$REMOTE_ROOT/files' && test -f /root/SERVER-SITES.md"

if [[ "$SKIP_BACKUP" -eq 0 ]]; then
  backup_id="$(remote_exec "ts=\$(date +%Y%m%d-%H%M%S); dest=/root/backups/homework-pages-\$ts; mkdir -p \"\$dest/assets\" \"\$dest/data\"; cd '$REMOTE_ROOT'; cp -a index.html \"\$dest/\"; cp -a assets/css assets/js assets/img \"\$dest/assets/\"; cp -a data/homework.json \"\$dest/data/\"; printf %s \"\$ts\"")"
  echo "页面备份: /root/backups/homework-pages-${backup_id}"
else
  echo "已跳过页面备份。"
fi

tar czf - \
  --exclude='.git' \
  --exclude='files' \
  --exclude='assets/vendor' \
  --exclude='*.bak' \
  --exclude='README.md' \
  --exclude='.gitignore' \
  "${payload[@]}" \
| if [[ "$MODE" == "local" ]]; then
    (cd "$REMOTE_ROOT" && tar xzf -)
  else
    ssh "${SSH_OPTS[@]}" "$HOST" "cd '$REMOTE_ROOT' && tar xzf -"
  fi

echo "发布完成。未改动 files/ 与 assets/vendor/。"

echo "验收:"
for url in \
  "http://superalex.enilu.cn/homework/" \
  "http://superalex.enilu.cn/" \
  "http://superalex.enilu.cn/game/"
do
  code="$(curl -sI -o /dev/null -w '%{http_code}' --connect-timeout 10 "$url" || true)"
  echo "  $code  $url"
done
