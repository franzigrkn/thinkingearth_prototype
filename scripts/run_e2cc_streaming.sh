#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: run_e2cc_streaming.sh [--check-only]

Environment:
  E2CC_APP_DIR       Earth-2 Command Center source directory.
  E2CC_PUBLIC_IP     Address advertised to WebRTC clients.
  E2CC_SIGNAL_PORT   WebRTC signaling TCP port (default: 49100).
  E2CC_MEDIA_PORT    WebRTC media UDP port (default: 47998).
  E2CC_HTTP_PORT     Browser client HTTP port (default: 8011).
  E2CC_EXTRA_ARGS    Additional Kit command-line arguments.

The E2CC streaming overlay must be applied and rebuilt before launch.
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

e2cc_app_dir="${E2CC_APP_DIR:-/var/tmp/fgerken/e2cc/earth2-weather-analytics/earth-2-command-center}"
public_ip="${E2CC_PUBLIC_IP:-}"
signal_port="${E2CC_SIGNAL_PORT:-49100}"
media_port="${E2CC_MEDIA_PORT:-47998}"
http_port="${E2CC_HTTP_PORT:-8011}"
extra_args="${E2CC_EXTRA_ARGS:-}"
launcher="$e2cc_app_dir/_build/linux-x86_64/release/omni.earth_2_command_center.app_ovc.sh"
app_config="$e2cc_app_dir/_build/linux-x86_64/release/apps/omni.earth_2_command_center.app_ovc.kit"

if [[ ! -x "$launcher" ]]; then
    echo "Missing E2CC OVC launcher: $launcher" >&2
    exit 1
fi

if [[ ! -f "$app_config" ]]; then
    echo "Missing generated E2CC OVC configuration: $app_config" >&2
    exit 1
fi

if ! grep -q 'omni.services.livestream.webrtc' "$app_config"; then
    echo "The E2CC build does not contain the browser-streaming overlay." >&2
    echo "Apply --streaming and rebuild E2CC before launching." >&2
    exit 1
fi

for port in "$signal_port" "$media_port" "$http_port"; do
    if [[ ! "$port" =~ ^[0-9]+$ ]] || ((port < 1 || port > 65535)); then
        echo "Invalid port: $port" >&2
        exit 1
    fi
done

if [[ "$check_only" == true ]]; then
    echo "PASS: E2CC streaming build is ready"
    echo "Browser client: http://${public_ip:-<workstation-ip>}:$http_port/"
    echo "Signaling: TCP $signal_port"
    echo "Media: UDP $media_port"
    exit 0
fi

args=(
    --no-window
    "--/exts/omni.kit.livestream.app/primaryStream/signalPort=$signal_port"
    "--/exts/omni.kit.livestream.app/primaryStream/streamPort=$media_port"
    "--/exts/omni.kit.livestream.app/primaryStream/streamType=webrtc"
    "--/exts/omni.kit.livestream.app/primaryStream/allowDynamicResize=true"
    "--/exts/omni.services.transport.server.http/host=0.0.0.0"
    "--/exts/omni.services.transport.server.http/port=$http_port"
)

if [[ -n "$public_ip" ]]; then
    args+=("--/exts/omni.kit.livestream.app/primaryStream/publicIp=$public_ip")
fi

echo "Starting E2CC browser streaming"
echo "Browser client: http://${public_ip:-<workstation-ip>}:$http_port/"
echo "Signaling: TCP $signal_port; media: UDP $media_port"

cd -- "$e2cc_app_dir"

if [[ -n "$extra_args" ]]; then
    read -r -a extra_args_array <<< "$extra_args"
    args+=("${extra_args_array[@]}")
fi

exec "$launcher" "${args[@]}"
