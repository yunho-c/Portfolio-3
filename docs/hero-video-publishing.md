# Hero video publishing

Coordinate-named text files in `static/collage/` are the source of truth for
hero videos. Each file must contain exactly one YouTube or direct-video URL:

```text
static/collage/A4.txt
https://www.youtube.com/watch?v=u4tKX-sRrv0
```

The publishing workflow keeps stable R2 object names (`A4.mp4` and `A4.jpg`),
so changing the URL in `A4.txt` replaces that cell without changing the public
URL.

At build time, the hero loader maps each `.txt` declaration to those public R2
objects. Hovering the corresponding grid cell loads its MP4 over the poster;
inactive videos are not mounted or downloaded.

## 1. Fetch and optimize

The fetcher requires `yt-dlp` and `ffmpeg`:

```sh
scripts/fetch-hero-videos.sh
```

It downloads the best available video stream, removes audio, and writes a
browser-compatible H.264 MP4 capped at 1080p plus a poster JPEG. Generated
files and source fingerprints live in the gitignored `.hero-media/` directory.
Unchanged declarations are skipped.

Useful options:

```sh
scripts/fetch-hero-videos.sh --cell A4
scripts/fetch-hero-videos.sh --cell A4 --force
scripts/fetch-hero-videos.sh --max-height 1440 --crf 18
```

If YouTube requires an authenticated browser session, pass a browser supported
by `yt-dlp`:

```sh
HERO_YTDLP_COOKIES_FROM_BROWSER=chrome scripts/fetch-hero-videos.sh --cell A4
```

YouTube changes its delivery behavior regularly, so keep `yt-dlp` current. If
the desired executable is not the first one in `PATH`, select it explicitly:

```sh
HERO_YTDLP_BIN=/path/to/yt-dlp scripts/fetch-hero-videos.sh --cell A4
```

## 2. Configure R2 in rclone

Create a user-level rclone remote once. Credentials remain outside this repo:

```sh
rclone config
```

Choose the S3 backend and the Cloudflare provider. For an object-scoped R2 API
token, the remote may also need `no_check_bucket = true`.

## 3. Upload

Pass the bucket and optional prefix as an rclone destination:

```sh
scripts/sync-hero-videos.sh --remote r2:portfolio-media/hero
```

With that destination, cell `A4` is stored as the simple object keys
`hero/A4.mp4` and `hero/A4.jpg` inside the `portfolio-media` bucket.

The uploader copies only MP4 and JPEG outputs, preserves stable filenames,
sets `Cache-Control: public, max-age=3600`, and verifies the uploaded bytes.
It never deletes remote objects. Preview an upload with `--dry-run` or select a
single cell with `--cell A4`.

Recurring configuration can be exported in the shell:

```sh
export HERO_R2_REMOTE='r2:portfolio-media/hero'
export HERO_R2_PUBLIC_BASE_URL='https://media.example.com/hero'
```

After that, `scripts/sync-hero-videos.sh` is sufficient.

`HERO_R2_PUBLIC_BASE_URL` is also required when building or running the site.
It must point to the public directory containing the stable objects, without a
filename. For example, `A4.txt` with this configuration:

```sh
HERO_R2_PUBLIC_BASE_URL='https://media.example.com/hero'
```

resolves to `https://media.example.com/hero/A4.mp4` and `A4.jpg`. Restart the
development server after changing `.env` or adding a new `.txt` cell.

## Optional CDN purge

With stable filenames, the old object can remain cached for up to the configured
one-hour TTL. To replace it immediately, create a Cloudflare API token with
zone cache-purge permission and run:

```sh
export CLOUDFLARE_API_TOKEN='...'
export CLOUDFLARE_ZONE_ID='...'
scripts/sync-hero-videos.sh --purge
```

`--purge` requires `HERO_R2_PUBLIC_BASE_URL` (or `--public-base-url`) to match
the public custom-domain path corresponding to `HERO_R2_REMOTE`.

## Just recipes

The `Justfile` loads `.env` automatically and provides short commands for the
same workflow:

```sh
just hero-fetch
just hero-fetch --cell A4
just hero-sync --remote r2:portfolio-media/hero
```
