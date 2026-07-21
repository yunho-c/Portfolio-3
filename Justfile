set dotenv-load

# List the available project commands.
default:
    @just --list

# Download and optimize all declared hero videos. Extra arguments are forwarded.
hero-fetch *args:
    ./scripts/fetch-hero-videos.sh {{ args }}

# Upload generated hero media to R2. Extra arguments are forwarded.
hero-sync *args:
    ./scripts/sync-hero-videos.sh {{ args }}
