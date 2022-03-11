#!/usr/bin/env bash
set -euo pipefail

# Check that there are no code changes
if [[ -n "$(git status --short ./docs)" ]]; then
    git status docs/
    echo "FAIL: Generated docs not up to date. Run 'yarn docs' to fix"
    git diff docs/
    exit 1
fi
