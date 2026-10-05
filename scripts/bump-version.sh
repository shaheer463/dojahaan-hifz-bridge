#!/usr/bin/env bash
# Usage: scripts/bump-version.sh 1.1.0
# Sets the new version everywhere it lives, so phones download the update.
set -euo pipefail
cd "$(dirname "$0")/.."
NEW="${1:-}"
if ! [[ "$NEW" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Give a version like 1.1.0 (current: $(cat VERSION))"; exit 1
fi
echo "$NEW" > VERSION
sed -i.bak -E "s/^const APP_VERSION = '[^']*';/const APP_VERSION = '$NEW';/" index.html
sed -i.bak -E "s/^const CACHE = 'hifz-bridge-[^']*';/const CACHE = 'hifz-bridge-$NEW';/" sw.js
rm -f index.html.bak sw.js.bak
echo "Version set to $NEW in VERSION, index.html and sw.js."
echo "Next: add a section for $NEW at the top of CHANGELOG.md, commit, then tag: git tag v$NEW && git push --tags"
