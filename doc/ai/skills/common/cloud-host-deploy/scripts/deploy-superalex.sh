#!/usr/bin/env bash
# 将 SuperAlex 静态文件发布到 cloud-host 站点目录。
# 部署方式：本地只负责提交代码；在服务器 /root/workspace/SuperAlex 拉取后执行本脚本，
# 脚本检测到自己运行在目标服务器上时直接本机覆盖发布，不做任何本机到服务器的文件拷贝。
# 用法：
#   bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-superalex.sh --dry-run
#   bash doc/ai/skills/common/cloud-host-deploy/scripts/deploy-superalex.sh
set -euo pipefail

HOST="${SUPERALEX_SSH_HOST:-root@cloud-host}"
REMOTE_ROOT="${SUPERALEX_REMOTE_ROOT:-/opt/microapp-store/site/superalex}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10)
MODE="${SUPERALEX_DEPLOY_MODE:-auto}"   # auto | local | remote

DRY_RUN=0
SKIP_BACKUP=0

usage() {
  cat <<'EOF'
deploy-superalex.sh [--dry-run] [--skip-backup]

  --dry-run       只列出将要打包的路径，不备份、不发布
  --skip-backup   跳过 /root/backups/superalex-<时间戳> 备份（不推荐）

部署模式（SUPERALEX_DEPLOY_MODE 可强制指定）：
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

if [[ "$MODE" == "auto" ]]; then
  if [[ -d "$REMOTE_ROOT" && -f /root/SERVER-SITES.md ]]; then
    MODE="local"
  else
    MODE="remote"
  fi
fi
if [[ "$MODE" != "local" && "$MODE" != "remote" ]]; then
  echo "无效的 SUPERALEX_DEPLOY_MODE: $MODE" >&2
  exit 2
fi

remote_exec() {
  if [[ "$MODE" == "local" ]]; then
    bash -c "$1"
  else
    ssh "${SSH_OPTS[@]}" "$HOST" "$1"
  fi
}

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
if [[ "$MODE" == "local" ]]; then
  echo "部署模式: local（在 cloud-host 上本机发布，不跨机拷贝）"
  echo "SSH: 不使用"
else
  echo "部署模式: remote（开发机经 ssh 发布，后备流程）"
  echo "SSH: $HOST"
fi
echo "站点目录: $REMOTE_ROOT"
echo "将同步:"
printf '  %s\n' "${payload[@]}"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "dry-run：未备份、未发布。"
  exit 0
fi

remote_exec "test -d '$REMOTE_ROOT' && test -f /root/SERVER-SITES.md"

if [[ "$SKIP_BACKUP" -eq 0 ]]; then
  backup_id="$(remote_exec 'ts=$(date +%Y%m%d-%H%M%S); mkdir -p /root/backups; cp -a '"$REMOTE_ROOT"' /root/backups/superalex-$ts; printf %s "$ts"')"
  echo "线上备份: /root/backups/superalex-${backup_id}"
else
  echo "已跳过线上备份。"
fi

# 无 rsync，用 tar 覆盖同名文件，不删除线上多余项。
if [[ "$MODE" == "local" ]]; then
  tar czf - \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='Thumbs.db' \
    "${payload[@]}" \
  | (cd "$REMOTE_ROOT" && tar xzf -)
else
  tar czf - \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='Thumbs.db' \
    "${payload[@]}" \
  | ssh "${SSH_OPTS[@]}" "$HOST" "cd '$REMOTE_ROOT' && tar xzf -"
fi

echo "发布完成。"

echo "验收:"
for url in \
  "http://superalex.enilu.cn/" \
  "http://superalex.enilu.cn/MornGo/index.html" \
  "http://superalex.enilu.cn/homework/"
do
  code="$(curl -sI -o /dev/null -w '%{http_code}' --connect-timeout 10 "$url" || true)"
  echo "  $code  $url"
done
