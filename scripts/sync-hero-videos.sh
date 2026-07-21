#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." >/dev/null 2>&1 && pwd)"

output_dir="${HERO_VIDEO_OUTPUT_DIR:-$REPO_ROOT/.hero-media}"
remote="${HERO_R2_REMOTE:-}"
public_base_url="${HERO_R2_PUBLIC_BASE_URL:-}"
cache_control="${HERO_R2_CACHE_CONTROL:-public, max-age=3600}"
cell_filter=""
dry_run=0
purge="${HERO_R2_PURGE:-0}"

usage() {
	cat <<'EOF'
Upload generated hero videos and posters to Cloudflare R2.

Usage:
  scripts/sync-hero-videos.sh --remote REMOTE [options]

Options:
  --remote REMOTE          rclone destination, such as r2:portfolio/hero.
  --cell CELL              Upload one cell, such as A4 or K2.
  --output-dir PATH        Generated-media directory (default: .hero-media).
  --public-base-url URL    Public URL matching the remote path.
  --purge                  Purge uploaded URLs from Cloudflare's CDN.
  --dry-run                Show what rclone would upload without changing R2.
  -h, --help               Show this help.

Environment equivalents:
  HERO_VIDEO_OUTPUT_DIR
  HERO_R2_REMOTE
  HERO_R2_PUBLIC_BASE_URL
  HERO_R2_CACHE_CONTROL     Default: public, max-age=3600
  HERO_R2_PURGE             Set to 1 to enable purging.

Purging additionally requires:
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ZONE_ID
EOF
}

die() {
	printf 'error: %s\n' "$*" >&2
	exit 1
}

require_command() {
	command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

normalize_cell() {
	printf '%s' "$1" | tr '[:lower:]' '[:upper:]'
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--remote)
			[[ $# -ge 2 ]] || die "--remote requires a value"
			remote="$2"
			shift 2
			;;
		--cell)
			[[ $# -ge 2 ]] || die "--cell requires a value"
			cell_filter="$(normalize_cell "$2")"
			shift 2
			;;
		--output-dir)
			[[ $# -ge 2 ]] || die "--output-dir requires a value"
			output_dir="$2"
			shift 2
			;;
		--public-base-url)
			[[ $# -ge 2 ]] || die "--public-base-url requires a value"
			public_base_url="$2"
			shift 2
			;;
		--purge)
			purge=1
			shift
			;;
		--dry-run)
			dry_run=1
			shift
			;;
		-h | --help)
			usage
			exit 0
			;;
		*)
			die "unknown option: $1"
			;;
	esac
done

[[ -n "$remote" ]] || die "R2 remote is required; pass --remote or set HERO_R2_REMOTE"
[[ "$remote" == *:* ]] || die "R2 remote must be an rclone path such as r2:bucket/hero"
remote="${remote%/}"
[[ -z "$cell_filter" || "$cell_filter" =~ ^[A-L][1-6]$ ]] || die "invalid cell: $cell_filter"
[[ "$purge" == 0 || "$purge" == 1 ]] || die "HERO_R2_PURGE must be 0 or 1"
[[ -d "$output_dir" ]] || die "generated-media directory not found: $output_dir"

require_command rclone

shopt -s nullglob
videos=("$output_dir"/*.mp4)
(( ${#videos[@]} > 0 )) || die "no generated MP4 files found; run scripts/fetch-hero-videos.sh first"

filter_args=()
matched=0

for video in "${videos[@]}"; do
	cell="$(normalize_cell "$(basename "$video" .mp4)")"
	[[ "$cell" =~ ^[A-L][1-6]$ ]] || continue
	if [[ -n "$cell_filter" && "$cell" != "$cell_filter" ]]; then
		continue
	fi

	poster="$output_dir/$cell.jpg"
	[[ -s "$poster" ]] || die "missing poster for $cell: $poster"
	filter_args+=(--filter "+ /$cell.mp4" --filter "+ /$cell.jpg")
	matched=$((matched + 1))
done

((matched > 0)) || die "no generated media matched cell $cell_filter"
filter_args+=(--filter '- **')

printf 'Uploading %s hero video set(s) to %s\n' "$matched" "$remote"
rclone_args=(
	copy
	"$output_dir"
	"$remote"
	"${filter_args[@]}"
	--metadata
	--metadata-set "cache-control=$cache_control"
	--metadata-set 'content-disposition=inline'
	--progress
)
if ((dry_run == 1)); then
	rclone_args+=(--dry-run)
fi
rclone "${rclone_args[@]}"

if ((dry_run == 1)); then
	printf 'Dry run complete; verification and cache purging were skipped.\n'
	exit 0
fi

printf 'Verifying uploaded media...\n'
rclone check "$output_dir" "$remote" "${filter_args[@]}" --one-way

if ((purge == 0)); then
	printf 'Upload complete. CDN purging was not requested; cached files may remain for the configured TTL.\n'
	exit 0
fi

[[ -n "$public_base_url" ]] || die "--purge requires --public-base-url or HERO_R2_PUBLIC_BASE_URL"
[[ "$public_base_url" =~ ^https?:// ]] || die "public base URL must use HTTP or HTTPS"
case "$public_base_url" in
	*\"* | *\\*) die "public base URL contains unsupported characters" ;;
esac
[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || die "--purge requires CLOUDFLARE_API_TOKEN"
[[ -n "${CLOUDFLARE_ZONE_ID:-}" ]] || die "--purge requires CLOUDFLARE_ZONE_ID"
require_command curl

public_base_url="${public_base_url%/}"
files_json=""
separator=""
for video in "${videos[@]}"; do
	cell="$(normalize_cell "$(basename "$video" .mp4)")"
	[[ "$cell" =~ ^[A-L][1-6]$ ]] || continue
	if [[ -n "$cell_filter" && "$cell" != "$cell_filter" ]]; then
		continue
	fi
	files_json="${files_json}${separator}\"$public_base_url/$cell.mp4\",\"$public_base_url/$cell.jpg\""
	separator=','
done

printf 'Purging uploaded URLs from Cloudflare cache...\n'
purge_response="$(
	curl \
		--silent \
		--show-error \
		--fail \
		--request POST \
		"https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
		--header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
		--header 'Content-Type: application/json' \
		--data "{\"files\":[$files_json]}"
)"
if ! printf '%s' "$purge_response" | grep -Eq '"success"[[:space:]]*:[[:space:]]*true'; then
	die "Cloudflare did not confirm the cache purge: $purge_response"
fi

printf 'Upload, verification, and cache purge complete.\n'
