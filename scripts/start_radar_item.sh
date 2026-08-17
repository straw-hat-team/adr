#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: make start_radar_item name=\"Some Technology\" [slug=some-technology]" >&2
  exit 1
}

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -e 's/[^a-z0-9]\{1,\}/-/g' -e 's/^-//' -e 's/-$//'
}

current_edition() {
  awk '/const editions/,/\] as const;/' ./.vitepress/radar.ts |
    grep -o "id: '[^']*'" |
    tail -1 |
    sed -e "s/id: '//" -e "s/'$//"
}

main() {
  name="${1:-}"
  slug="${2:-$(slugify "$name")}"

  if [ -z "$name" ] || [ -z "$slug" ]; then
    usage
  fi

  output="./src/radar/items/$slug.md"

  if [ -e "$output" ]; then
    echo "$output already exists, edit it instead" >&2
    exit 1
  fi

  edition="$(current_edition)"

  if [ -z "$edition" ]; then
    echo "could not read the current edition from ./.vitepress/radar.ts" >&2
    exit 1
  fi

  cp ./templates/radar-item.md "$output"

  sed -i '' "s|<!-- display name of the technology, technique, or platform -->|$name|g" "$output"
  sed -i '' "s|# <!-- display name -->|# $name|g" "$output"
  sed -i '' "s|<!-- the current edition, see .vitepress/radar.ts -->|'$edition'|g" "$output"

  echo "radar item created at $output"
}

main "$@"
