#!/usr/bin/env bash
set -euo pipefail

# Claude Code refuses --dangerously-skip-permissions when running as root, so the
# gateway (and every Claude process it spawns) must run as the unprivileged
# "node" user. The Railway volume at /data is mounted root-owned (and existing
# deployments have root-owned files on it from previous runs), so fix ownership
# while still root, then drop privileges for good.

TARGET_USER="node"

if [ "$(id -u)" = "0" ]; then
  TARGET_UID="$(id -u "$TARGET_USER")"
  mkdir -p /data
  if [ "$(stat -c %u /data)" != "$TARGET_UID" ]; then
    chown -R "$TARGET_USER:$TARGET_USER" /data
  fi
  export HOME="/home/$TARGET_USER"
  exec gosu "$TARGET_USER" "$@"
fi

exec "$@"
