#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." >/dev/null 2>&1 && pwd)"

collage_dir="$REPO_ROOT/static/collage"
output_dir="${HERO_VIDEO_OUTPUT_DIR:-$REPO_ROOT/.hero-media}"
max_height="${HERO_VIDEO_MAX_HEIGHT:-1080}"
crf="${HERO_VIDEO_CRF:-20}"
poster_time="${HERO_VIDEO_POSTER_TIME:-1}"
ytdlp_bin="${HERO_YTDLP_BIN:-yt-dlp}"
cell_filter=""
force=0
work_dir=""

usage() {
	cat <<'EOF'
Download and optimize hero videos declared by static/collage/<CELL>.txt.

Usage:
  scripts/fetch-hero-videos.sh [options]

Options:
  --cell CELL          Process one cell, such as A4 or K2.
  --force              Rebuild even when the source and settings are unchanged.
  --output-dir PATH    Generated-media directory (default: .hero-media).
  --max-height PIXELS  Maximum output height without upscaling (default: 1080).
  --crf VALUE          H.264 quality value; lower is higher quality (default: 20).
  -h, --help           Show this help.

Environment equivalents:
  HERO_VIDEO_OUTPUT_DIR
  HERO_VIDEO_MAX_HEIGHT
  HERO_VIDEO_CRF
  HERO_VIDEO_POSTER_TIME
  HERO_YTDLP_BIN
  HERO_YTDLP_COOKIES_FROM_BROWSER

The cookies variable is optional and is passed to yt-dlp's
--cookies-from-browser option, for example "chrome" or "safari".
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

cleanup() {
	if [[ -n "$work_dir" && -d "$work_dir" ]]; then
		rm -rf "$work_dir"
	fi
}

trap cleanup EXIT INT TERM

while [[ $# -gt 0 ]]; do
	case "$1" in
		--cell)
			[[ $# -ge 2 ]] || die "--cell requires a value"
			cell_filter="$(normalize_cell "$2")"
			shift 2
			;;
		--force)
			force=1
			shift
			;;
		--output-dir)
			[[ $# -ge 2 ]] || die "--output-dir requires a value"
			output_dir="$2"
			shift 2
			;;
		--max-height)
			[[ $# -ge 2 ]] || die "--max-height requires a value"
			max_height="$2"
			shift 2
			;;
		--crf)
			[[ $# -ge 2 ]] || die "--crf requires a value"
			crf="$2"
			shift 2
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

[[ -z "$cell_filter" || "$cell_filter" =~ ^[A-L][1-6]$ ]] || die "invalid cell: $cell_filter"
[[ "$max_height" =~ ^[1-9][0-9]*$ ]] || die "--max-height must be a positive integer"
[[ "$crf" =~ ^[0-9]+$ ]] || die "--crf must be an integer"
((crf >= 0 && crf <= 51)) || die "--crf must be between 0 and 51"
[[ "$poster_time" =~ ^[0-9]+([.][0-9]+)?$ ]] || die "HERO_VIDEO_POSTER_TIME must be a non-negative number"

require_command "$ytdlp_bin"
require_command ffmpeg
require_command shasum

[[ -d "$collage_dir" ]] || die "collage directory not found: $collage_dir"
mkdir -p "$output_dir/.state"

shopt -s nullglob
source_files=("$collage_dir"/*.txt)
(( ${#source_files[@]} > 0 )) || die "no video declarations found in $collage_dir"

matched=0
rebuilt=0
skipped=0

for declaration in "${source_files[@]}"; do
	filename="$(basename "$declaration")"
	cell="$(normalize_cell "${filename%.txt}")"

	if [[ ! "$cell" =~ ^[A-L][1-6]$ ]]; then
		printf 'Skipping non-cell declaration %s\n' "$filename" >&2
		continue
	fi
	if [[ -n "$cell_filter" && "$cell" != "$cell_filter" ]]; then
		continue
	fi

	matched=$((matched + 1))
	source_url=""
	source_count=0
	while IFS= read -r line || [[ -n "$line" ]]; do
		trimmed="$(printf '%s' "$line" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
		[[ -n "$trimmed" && ! "$trimmed" =~ ^# ]] || continue
		source_count=$((source_count + 1))
		source_url="$trimmed"
	done < "$declaration"

	((source_count == 1)) || die "$filename must contain exactly one non-comment URL"
	[[ "$source_url" =~ ^https?:// ]] || die "$filename does not contain an HTTP(S) URL"

	fingerprint="$(
		printf '%s\n' \
			'hero-video-pipeline-v1' \
			"$source_url" \
			"max-height=$max_height" \
			"crf=$crf" \
			"poster-time=$poster_time" |
			shasum -a 256 | awk '{ print $1 }'
	)"
	state_file="$output_dir/.state/$cell.sha256"
	video_file="$output_dir/$cell.mp4"
	poster_file="$output_dir/$cell.jpg"
	previous_fingerprint=""
	if [[ -f "$state_file" ]]; then
		IFS= read -r previous_fingerprint < "$state_file" || true
	fi

	if ((force == 0)) && [[ "$fingerprint" == "$previous_fingerprint" && -s "$video_file" && -s "$poster_file" ]]; then
		printf '%s is up to date.\n' "$cell"
		skipped=$((skipped + 1))
		continue
	fi

	printf 'Downloading %s from %s\n' "$cell" "$source_url"
	work_dir="$(mktemp -d "${TMPDIR:-/tmp}/portfolio-hero-${cell}.XXXXXX")"
	url_path="${source_url%%\?*}"
	url_path="${url_path%%\#*}"
	direct_extension="$(printf '%s' "$url_path" | sed -n 's/.*\.\([[:alnum:]]*\)$/\1/p' | tr '[:upper:]' '[:lower:]')"
	case "$direct_extension" in
		mp4 | mov | m4v | webm | mkv)
			require_command curl
			curl \
				--fail \
				--location \
				--retry 3 \
				--retry-delay 1 \
				--output "$work_dir/source.$direct_extension" \
				"$source_url"
			;;
		*)
			ytdlp_args=(
				--ignore-config
				--no-playlist
				--format 'bv*[vcodec!=none]/b[vcodec!=none]'
				--output "$work_dir/source.%(ext)s"
			)
			if [[ -n "${HERO_YTDLP_COOKIES_FROM_BROWSER:-}" ]]; then
				ytdlp_args+=(--cookies-from-browser "$HERO_YTDLP_COOKIES_FROM_BROWSER")
			fi
			"$ytdlp_bin" "${ytdlp_args[@]}" "$source_url"
			;;
	esac

	downloaded_file=""
	for candidate in "$work_dir"/source.*; do
		case "$candidate" in
			*.part | *.ytdl) continue ;;
		esac
		downloaded_file="$candidate"
		break
	done
	[[ -n "$downloaded_file" && -s "$downloaded_file" ]] || die "download did not produce a source file for $cell"

	printf 'Encoding %s at up to %sp (H.264 CRF %s)\n' "$cell" "$max_height" "$crf"
	encoded_file="$work_dir/$cell.mp4"
	ffmpeg \
		-nostdin \
		-hide_banner \
		-loglevel warning \
		-y \
		-i "$downloaded_file" \
		-map 0:v:0 \
		-vf "scale=-2:min(ih\\,$max_height)" \
		-an \
		-sn \
		-dn \
		-c:v libx264 \
		-preset slow \
		-crf "$crf" \
		-pix_fmt yuv420p \
		-movflags +faststart \
		"$encoded_file"
	[[ -s "$encoded_file" ]] || die "ffmpeg did not produce an MP4 for $cell"

	generated_poster="$work_dir/$cell.jpg"
	ffmpeg \
		-nostdin \
		-hide_banner \
		-loglevel error \
		-y \
		-ss "$poster_time" \
		-i "$encoded_file" \
		-frames:v 1 \
		-q:v 2 \
		"$generated_poster" || true
	if [[ ! -s "$generated_poster" ]]; then
		ffmpeg \
			-nostdin \
			-hide_banner \
			-loglevel error \
			-y \
			-i "$encoded_file" \
			-frames:v 1 \
			-q:v 2 \
			"$generated_poster"
	fi
	[[ -s "$generated_poster" ]] || die "ffmpeg did not produce a poster for $cell"

	mv -f "$encoded_file" "$video_file"
	mv -f "$generated_poster" "$poster_file"
	printf '%s\n' "$fingerprint" > "$state_file.tmp"
	mv -f "$state_file.tmp" "$state_file"

	rm -rf "$work_dir"
	work_dir=""
	rebuilt=$((rebuilt + 1))
	printf 'Wrote %s and %s\n' "$video_file" "$poster_file"
done

((matched > 0)) || die "no declaration matched cell $cell_filter"
printf 'Hero video fetch complete: %s rebuilt, %s unchanged.\n' "$rebuilt" "$skipped"
