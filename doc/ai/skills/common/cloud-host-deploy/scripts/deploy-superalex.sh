#!/usr/bin/env bash
# 将 SuperAlex 静态文件同步到 cloud-host。
# 用法（在 SuperAlex 仓库根目录，或任意位置调用本脚本）：
#   bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-superalex.sh --dry-run
#   bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-superalex.sh
set -euo pipefail

HOST="${SUPERALEX_SSH_HOST:-root@cloud-host}"
REMOTE_ROOT="${SUPERALEX_REMOTE_ROOT:-/opt/microapp-store/site/superalex}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10)

DRY_RUN=0
SKIP_BACKUP=0

usage() {
  cat <<'EOF'
deploy-superalex.sh [--dry-run] [--skip-backup]

  --dry-run       只列出将要打包的路径，不备份、不上传
  --skip-backup   跳过 /root/backups/superalex-<时间戳> 备份（不推荐）
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
    if [[ -f "$dir/index.html" && -d "$dir/MornGo" && -d "$dir/math20" ]]; then
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
  echo "找不到 SuperAlex 仓库根目录（需要 index.html 与 MornGo/、math20/）。" >&2
  exit 1
fi

cd "$ROOT"

payload=()
for item in index.html favicon.svg README.md assets MornGo math20 TangPoem Kingdom3 PinyinMatch ColorMatch; do
  if [[ -e "$item" ]]; then
    payload+=("$item")
  fi
done

if [[ ${#payload[@]} -eq 0 ]]; then
  echo "没有可部署的文件。" >&2
  exit 1
fi

echo "仓库根目录: $ROOT"
echo "SSH: $HOST"
echo "远程目录: $REMOTE_ROOT"
echo "将同步:"
printf '  %s\n' "${payload[@]}"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "dry-run：未备份、未上传。"
  exit 0
fi

ssh "${SSH_OPTS[@]}" "$HOST" "test -d '$REMOTE_ROOT' && test -f /root/SERVER-SITES.md"

if [[ "$SKIP_BACKUP" -eq 0 ]]; then
  backup_id="$(ssh "${SSH_OPTS[@]}" "$HOST" 'ts=$(date +%Y%m%d-%H%M%S); mkdir -p /root/backups; cp -a '"$REMOTE_ROOT"' /root/backups/superalex-$ts; printf %s "$ts"')"
  echo "线上备份: /root/backups/superalex-${backup_id}"
else
  echo "已跳过线上备份。"
fi

# 本机 Git Bash 无 rsync，用 tar 覆盖同名文件，不删除线上多余项。
tar czf - \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='Thumbs.db' \
  "${payload[@]}" \
| ssh "${SSH_OPTS[@]}" "$HOST" "cd '$REMOTE_ROOT' && tar xzf -"

echo "上传完成。"

echo "验收:"
for url in \
  "http://superalex.enilu.cn/" \
  "http://superalex.enilu.cn/MornGo/index.html" \
  "http://superalex.enilu.cn/homework/"
do
  code="$(curl -sI -o /dev/null -w '%{http_code}' --connect-timeout 10 "$url" || true)"
  echo "  $code  $url"
done
