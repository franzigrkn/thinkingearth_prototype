#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: run_flask_streaming.sh [--check-only]

Environment:
  FLASK_BIND          Gunicorn bind address (default: 0.0.0.0:5000).
  FLASK_WORKERS       Gunicorn worker count (default: 2).
  FLASK_APP_MODULE    WSGI module and application (default: app:app).
  E2CC_STREAM_URL     Browser-visible NVIDIA client URL.

The project virtual environment must contain Gunicorn and Flask.
EOF
}

check_only=false
if (($# > 1)); then
    usage >&2
    exit 2
fi
if (($# == 1)); then
    case "$1" in
        --check-only)
            check_only=true
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            usage >&2
            exit 2
            ;;
    esac
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd -- "$script_dir/.." && pwd)"
gunicorn="$project_dir/.venv/bin/gunicorn"
bind_address="${FLASK_BIND:-0.0.0.0:5000}"
worker_count="${FLASK_WORKERS:-2}"
app_module="${FLASK_APP_MODULE:-app:app}"

if [[ ! -x "$gunicorn" ]]; then
    echo "Missing Gunicorn executable: $gunicorn" >&2
    echo "Create .venv and install requirements.txt before launching." >&2
    exit 1
fi

if [[ ! "$worker_count" =~ ^[1-9][0-9]*$ ]]; then
    echo "FLASK_WORKERS must be a positive integer: $worker_count" >&2
    exit 1
fi

if [[ -z "$bind_address" ]]; then
    echo "FLASK_BIND must not be empty." >&2
    exit 1
fi

if [[ -z "$app_module" ]]; then
    echo "FLASK_APP_MODULE must not be empty." >&2
    exit 1
fi

if [[ "$check_only" == true ]]; then
    echo "PASS: Flask streaming runtime is ready"
    echo "Application: $app_module"
    echo "Bind: $bind_address; workers: $worker_count"
    echo "E2CC viewer: ${E2CC_STREAM_URL:-inferred from the Flask hostname}"
    exit 0
fi

echo "Starting ThinkingEarth Flask application"
echo "Application: $app_module"
echo "Bind: $bind_address; workers: $worker_count"
echo "E2CC viewer: ${E2CC_STREAM_URL:-inferred from the Flask hostname}"

exec "$gunicorn" \
    --chdir "$project_dir" \
    --bind "$bind_address" \
    --workers "$worker_count" \
    --access-logfile - \
    --error-logfile - \
    "$app_module"
