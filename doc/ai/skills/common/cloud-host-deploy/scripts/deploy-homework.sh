#!/usr/bin/env bash
# 将 SuperAlex/homework 的页面和目录清单同步到 cloud-host。
# 不上传 files/ 资料文件，也不覆盖 assets/vendor/。
set -euo pipefail

HOST="${SUPERALEX_SSH_HOST:-root@cloud-host}"
REMOTE_ROOT="${HOMEWORK_REMOTE_ROOT:-/opt/microapp-store/site/homework}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10)

DRY_RUN=0
SKIP_BACKUP=0

usage() {
  cat <<'EOF'
deploy-homework.sh [--dry-run] [--skip-backup]

  --dry-run       只列出将要打包的路径，不备份、不上传
  --skip-backup   跳过页面文件备份（不推荐）
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
echo "SSH: $HOST"
echo "远程目录: $REMOTE_ROOT"
echo "将同步（不含 files/、assets/vendor/）:"
printf '  %s\n' "${payload[@]}"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "dry-run：未备份、未上传。"
  exit 0
fi

ssh "${SSH_OPTS[@]}" "$HOST" "test -d '$REMOTE_ROOT' && test -d '$REMOTE_ROOT/files' && test -f /root/SERVER-SITES.md"

if [[ "$SKIP_BACKUP" -eq 0 ]]; then
  backup_id="$(ssh "${SSH_OPTS[@]}" "$HOST" "ts=\$(date +%Y%m%d-%H%M%S); dest=/root/backups/homework-pages-\$ts; mkdir -p \"\$dest/assets\" \"\$dest/data\"; cd '$REMOTE_ROOT'; cp -a index.html \"\$dest/\"; cp -a assets/css assets/js assets/img \"\$dest/assets/\"; cp -a data/homework.json \"\$dest/data/\"; printf %s \"\$ts\"")"
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
| ssh "${SSH_OPTS[@]}" "$HOST" "cd '$REMOTE_ROOT' && tar xzf -"

echo "上传完成。未改动 files/ 与 assets/vendor/。"

echo "验收:"
for url in \
  "http://superalex.enilu.cn/homework/" \
  "http://superalex.enilu.cn/" \
  "http://superalex.enilu.cn/game/"
do
  code="$(curl -sI -o /dev/null -w '%{http_code}' --connect-timeout 10 "$url" || true)"
  echo "  $code  $url"
done
