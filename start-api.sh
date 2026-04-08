#!/bin/bash
export PATH="/usr/local/bin:$HOME/.local/share/pnpm:$PATH"
export PNPM_HOME="$HOME/.local/share/pnpm"
cd "$(dirname "$0")"
exec pnpm --filter @storyvibe/api dev
