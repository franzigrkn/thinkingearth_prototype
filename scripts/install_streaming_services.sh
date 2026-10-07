#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: install_streaming_services.sh [OPTIONS]

Install and optionally start the user-level systemd services for E2CC and
Flask browser streaming.

Options:
  --config PATH   Machine-local environment file. Defaults to
                  deploy/systemd/streaming.env.
  --check-only    Validate config, launchers, and rendered units only.
  --start         Start or restart the stack after installation.
  --no-enable     Install without enabling startup with the user manager.
  --enable-linger Keep the user manager running across logout and start it at
                  boot. This may require local policy approval.
  -h, --help      Show this help.
EOF
}

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd -- "$script_dir/.." && pwd)"
template_dir="$project_dir/deploy/systemd"
config_file="$template_dir/streaming.env"
check_only=false
start_services=false
enable_services=true
enable_linger=false

while (($# > 0)); do
    case "$1" in
        --config)
            if (($# < 2)); then
                echo "--config requires a path." >&2
                usage >&2
                exit 2
            fi
            config_file="$2"
            shift
            ;;
        --check-only)
            check_only=true
            ;;
        --start)
            start_services=true
            ;;
        --no-enable)
            enable_services=false
            ;;
        --enable-linger)
            enable_linger=true
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
    shift
done

if [[ ! -f "$config_file" ]]; then
    echo "Missing streaming configuration: $config_file" >&2
    echo "Copy $template_dir/streaming.env.example and edit its machine-specific values." >&2
    exit 1
fi

config_file="$(cd -- "$(dirname -- "$config_file")" && pwd)/$(basename -- "$config_file")"

if ! bash -n "$config_file"; then
    echo "The streaming configuration is not valid shell-compatible syntax." >&2
    exit 1
fi

set -a
# shellcheck source=/dev/null
source "$config_file"
set +a

required_variables=(
    E2CC_APP_DIR
    E2CC_PUBLIC_IP
    E2CC_SIGNAL_PORT
    E2CC_MEDIA_PORT
    E2CC_HTTP_PORT
    E2CC_STREAM_URL
    E2CC_STREAM_HTTP_PORT
    E2CC_STREAM_SIGNAL_PORT
    E2CC_STREAM_MEDIA_PORT
    FLASK_BIND
    FLASK_WORKERS
)

for variable_name in "${required_variables[@]}"; do
    if [[ -z "${!variable_name:-}" ]]; then
        echo "Missing required setting in $config_file: $variable_name" >&2
        exit 1
    fi
done

if [[ "$E2CC_HTTP_PORT" != "$E2CC_STREAM_HTTP_PORT" ]]; then
    echo "E2CC_HTTP_PORT and E2CC_STREAM_HTTP_PORT must match." >&2
    exit 1
fi
if [[ "$E2CC_SIGNAL_PORT" != "$E2CC_STREAM_SIGNAL_PORT" ]]; then
    echo "E2CC_SIGNAL_PORT and E2CC_STREAM_SIGNAL_PORT must match." >&2
    exit 1
fi
if [[ "$E2CC_MEDIA_PORT" != "$E2CC_STREAM_MEDIA_PORT" ]]; then
    echo "E2CC_MEDIA_PORT and E2CC_STREAM_MEDIA_PORT must match." >&2
    exit 1
fi

"$project_dir/scripts/run_e2cc_streaming.sh" --check-only
"$project_dir/scripts/run_flask_streaming.sh" --check-only

render_dir="$(mktemp -d)"
cleanup() {
    rm -rf -- "$render_dir"
}
trap cleanup EXIT

escape_unit_path() {
    local value="$1"
    if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
        echo "Systemd paths must not contain newlines: $value" >&2
        exit 1
    fi
    value="${value//\\/\\x5c}"
    value="${value// /\\x20}"
    value="${value//$'\t'/\\x09}"
    value="${value//\"/\\x22}"
    value="${value//\'/\\x27}"
    value="${value//%/%%}"
    printf '%s' "$value"
}

project_unit_value="$(escape_unit_path "$project_dir")"
config_unit_value="$(escape_unit_path "$config_file")"

for service_name in thinkingearth-e2cc thinkingearth-flask; do
    template_file="$template_dir/$service_name.service.in"
    output_file="$render_dir/$service_name.service"

    if [[ ! -f "$template_file" ]]; then
        echo "Missing systemd template: $template_file" >&2
        exit 1
    fi

    template_content="$(<"$template_file")"
    template_content="${template_content//@PROJECT_DIR@/$project_unit_value}"
    template_content="${template_content//@CONFIG_FILE@/$config_unit_value}"
    printf '%s\n' "$template_content" > "$output_file"
done

cp -- "$template_dir/thinkingearth-streaming.target" "$render_dir/"

if command -v systemd-analyze >/dev/null 2>&1; then
    systemd-analyze --user verify \
        "$render_dir/thinkingearth-e2cc.service" \
        "$render_dir/thinkingearth-flask.service" \
        "$render_dir/thinkingearth-streaming.target"
fi

if [[ "$check_only" == true ]]; then
    echo "PASS: streaming service configuration is ready"
    exit 0
fi

if ! systemctl --user show-environment >/dev/null 2>&1; then
    echo "The systemd user manager is unavailable for the current login." >&2
    exit 1
fi

systemd_user_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
mkdir -p -- "$systemd_user_dir"
install -m 0644 "$render_dir/thinkingearth-e2cc.service" "$systemd_user_dir/"
install -m 0644 "$render_dir/thinkingearth-flask.service" "$systemd_user_dir/"
install -m 0644 "$render_dir/thinkingearth-streaming.target" "$systemd_user_dir/"
chmod go-rwx -- "$config_file"

systemctl --user daemon-reload
if [[ "$enable_services" == true ]]; then
    systemctl --user enable thinkingearth-streaming.target
fi
if [[ "$enable_linger" == true ]]; then
    if ! command -v loginctl >/dev/null 2>&1; then
        echo "loginctl is required for --enable-linger." >&2
        exit 1
    fi
    loginctl enable-linger "$USER"
fi
if [[ "$start_services" == true ]]; then
    systemctl --user reset-failed \
        thinkingearth-e2cc.service \
        thinkingearth-flask.service
    systemctl --user restart thinkingearth-streaming.target
fi

echo "Installed ThinkingEarth user services from $project_dir"
echo "Configuration: $config_file"
echo "Status: systemctl --user status thinkingearth-streaming.target"
echo "Logs:   journalctl --user -u 'thinkingearth-*' -f"

if command -v loginctl >/dev/null 2>&1; then
    linger_state="$(loginctl show-user "$USER" --property=Linger --value 2>/dev/null || true)"
    if [[ "$linger_state" != "yes" ]]; then
        echo "Boot before login is not enabled. Re-run with --enable-linger or use:" >&2
        echo "  loginctl enable-linger $USER" >&2
    fi
fi
