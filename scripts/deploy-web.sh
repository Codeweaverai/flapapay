#!/usr/bin/env bash
set -euo pipefail

repo_root="/var/www/flapapay"
web_root="$repo_root/apps/web"
dist_dir="$web_root/dist"
target_dir="/home/flapapay/web/flapapay.com/public_html"

preserve_paths=(
  "assets/images/avatars"
  "assets/images/blog"
  "assets/images/kyc"
)

for required_dir in "$repo_root" "$web_root" "$target_dir"; do
  if [ ! -d "$required_dir" ]; then
    echo "Missing required directory: $required_dir" >&2
    exit 1
  fi
done

echo "Building frontend from $web_root"
npm run build --workspace=apps/web

if [ ! -d "$dist_dir" ]; then
  echo "Build output not found: $dist_dir" >&2
  exit 1
fi

echo "Syncing $dist_dir to $target_dir"

rsync_args=(
  -a
  --delete
)

for preserve_path in "${preserve_paths[@]}"; do
  rsync_args+=(--exclude "/$preserve_path")
done

rsync "${rsync_args[@]}" "$dist_dir"/ "$target_dir"/

for preserve_path in "${preserve_paths[@]}"; do
  mkdir -p "$target_dir/$preserve_path"
done

echo "Frontend deploy complete"
