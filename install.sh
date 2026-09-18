#!/usr/bin/env bash
# ARTI Skills 一键安装脚本
#
# 一行安装（macOS / Linux）：
#   curl -fsSL https://raw.githubusercontent.com/huangxm129/arti-skill/main/install.sh | bash
#
# 指定客户端 / 卸载 / 本地安装：
#   bash install.sh --client codex
#   bash install.sh --client claude,zcode
#   bash install.sh --uninstall
#   bash install.sh --dir ~/.codex/skills        # 装到指定 skills 目录
#
# 说明：刻意不使用空数组展开，兼容 macOS 自带的 bash 3.2。
set -euo pipefail

REPO="${ARTI_SKILLS_REPO:-huangxm129/arti-skill}"
BRANCH="${ARTI_SKILLS_BRANCH:-main}"
SKILL="arti-stock-research"

C_GRN=$'\033[32m'; C_YLW=$'\033[33m'; C_DIM=$'\033[2m'; C_RST=$'\033[0m'
ok()   { printf '%s%s%s\n' "$C_GRN" "$*" "$C_RST"; }
warn() { printf '%s%s%s\n' "$C_YLW" "$*" "$C_RST" >&2; }
info() { printf '%s%s%s\n' "$C_DIM" "$*" "$C_RST"; }

WANT_CLIENTS="" WANT_UNINSTALL=0 WANT_DIR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --client)     WANT_CLIENTS="${2:-}"; shift 2 ;;
    --uninstall)  WANT_UNINSTALL=1; shift ;;
    --dir)        WANT_DIR="${2:-}"; shift 2 ;;
    -h|--help)    sed -n '2,14p' "$0"; exit 0 ;;
    *) warn "未知参数: $1"; exit 1 ;;
  esac
done

# 客户端识别标记与 skills 目录约定
codex_dir="$HOME/.codex/skills"
claude_dir="$HOME/.claude/skills"
zcode_dir="$HOME/.agents/skills"

# 目标列表用换行分隔的字符串（name:dir），规避 bash 3.2 空数组问题
TARGETS=""
add_target() { TARGETS="${TARGETS}${1}:${2}"$'\n'; }

if [ -n "$WANT_DIR" ]; then
  add_target custom "$WANT_DIR"
else
  if [ -n "$WANT_CLIENTS" ]; then
    IFS=',' read -r -a asked <<< "$WANT_CLIENTS"
    for a in "${asked[@]}"; do
      case "$a" in
        codex)  add_target codex "$codex_dir" ;;
        claude) add_target claude "$claude_dir" ;;
        zcode)  add_target zcode "$zcode_dir" ;;
        all)
          [ -d "$HOME/.codex" ] || command -v codex >/dev/null 2>&1 || true
          add_target codex "$codex_dir"; add_target claude "$claude_dir"; add_target zcode "$zcode_dir" ;;
        *) warn "未知客户端: ${a}（支持 codex / claude / zcode / all）"; exit 1 ;;
      esac
    done
  else
    # 自动探测：装了哪个客户端就装到哪个
    if [ -d "$HOME/.codex" ] || command -v codex >/dev/null 2>&1; then add_target codex "$codex_dir"; fi
    if [ -d "$HOME/.claude" ] || command -v claude >/dev/null 2>&1; then add_target claude "$claude_dir"; fi
    if [ -d "$HOME/.agents" ]; then add_target zcode "$zcode_dir"; fi
  fi
fi

if [ -z "$TARGETS" ]; then
  warn "没有检测到已安装的客户端（Codex / Claude Code / ZCode）。"
  info "也可以手动指定目录：bash install.sh --dir <skills 目录>"
  exit 1
fi

# 卸载
if [ "$WANT_UNINSTALL" = 1 ]; then
  printf '%s' "$TARGETS" | while IFS= read -r t; do
    [ -n "$t" ] || continue
    dir="${t#*:}"
    rm -rf "$dir/$SKILL"
    ok "已从 $dir 移除 $SKILL"
  done
  exit 0
fi

command -v curl >/dev/null 2>&1 || { warn "需要 curl"; exit 1; }

# 下载源码包到临时目录
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
info "下载 $REPO@$BRANCH ……"
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/refs/heads/$BRANCH" -o "$TMP/skills.tar.gz"
tar -xzf "$TMP/skills.tar.gz" -C "$TMP"
# skill 单一事实源位于 Codex 插件结构内：plugins/<plugin>/skills/<skill>
SRC="$(find "$TMP" -maxdepth 1 -type d -name "${REPO#*/}-*" | head -1)/plugins/arti-stock-research/skills/arti-stock-research"
[ -f "$SRC/SKILL.md" ] || { warn "源码包异常：找不到 $SKILL/SKILL.md"; exit 1; }

printf '%s' "$TARGETS" | while IFS= read -r t; do
  [ -n "$t" ] || continue
  name="${t%%:*}"; dir="${t#*:}"
  mkdir -p "$dir"
  rm -rf "$dir/$SKILL"
  cp -R "$SRC" "$dir/$SKILL"
  cp "$SRC/../../../../scripts/check-mcp.mjs" "$dir/$SKILL/scripts/check-mcp.mjs"
  chmod +x "$dir/$SKILL/scripts/arti" 2>/dev/null || true
  chmod +x "$dir/$SKILL/scripts/check-mcp.mjs" 2>/dev/null || true
  ok "[$name] 已安装到 $dir/$SKILL"
done

echo
ok "安装完成！下一步："
info "  1. 在任意已装客户端的会话里说：\"帮我分析一下 AAPL\"（skill 会自动触发）"
info "  2. 首次使用会引导你在浏览器完成 ARTI 注册/登录（新用户赠 100 Credits）"
info "  3. 也可以直接在终端运行：~/*/skills/$SKILL/scripts/arti login"
