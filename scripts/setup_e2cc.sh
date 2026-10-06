#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage:
  setup_e2cc.sh [--check-only] PATCH_SELECTION... /path/to/earth2-weather-analytics

Patch selections:
  --compatibility      Apply Kit 109.0.5 and HTTPS registry changes.
  --deduplicate-loads  Apply the optional duplicate image-load guard.
  --no-loop            Apply the optional non-looping timeline behavior.
  --all                Select all preserved patches.

Other options:
  --check-only         Validate the checkout and patches without applying them.
  -h, --help           Show this help.

The target must be a clean checkout at the commit recorded in
patches/e2cc/UPSTREAM_COMMIT. The script does not clone or build E2CC.
EOF
}

compatibility=false
deduplicate_loads=false
no_loop=false
check_only=false
target_path=""

while (($# > 0)); do
    case "$1" in
        --compatibility)
            compatibility=true
            ;;
        --deduplicate-loads)
            deduplicate_loads=true
            ;;
        --no-loop)
            no_loop=true
            ;;
        --all)
            compatibility=true
            deduplicate_loads=true
            no_loop=true
            ;;
        --check-only)
            check_only=true
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        --*)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 2
            ;;
        *)
            if [[ -n "$target_path" ]]; then
                echo "Only one E2CC repository path may be provided." >&2
                usage >&2
                exit 2
            fi
            target_path="$1"
            ;;
    esac
    shift
done

if [[ -z "$target_path" ]]; then
    echo "An earth2-weather-analytics checkout path is required." >&2
    usage >&2
    exit 2
fi

if [[ "$compatibility" != true && "$deduplicate_loads" != true && "$no_loop" != true ]]; then
    echo "Select at least one patch or use --all." >&2
    usage >&2
    exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd -- "$script_dir/.." && pwd)"
overlay_dir="$project_dir/patches/e2cc"
expected_commit="$(tr -d '[:space:]' < "$overlay_dir/UPSTREAM_COMMIT")"

if ! repository_root="$(git -C "$target_path" rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Not a Git checkout: $target_path" >&2
    exit 1
fi

if [[ ! -d "$repository_root/earth-2-command-center" ]]; then
    echo "The checkout does not contain earth-2-command-center/: $repository_root" >&2
    exit 1
fi

actual_commit="$(git -C "$repository_root" rev-parse HEAD)"
if [[ "$actual_commit" != "$expected_commit" ]]; then
    echo "Unexpected upstream commit." >&2
    echo "Expected: $expected_commit" >&2
    echo "Actual:   $actual_commit" >&2
    exit 1
fi

if [[ -n "$(git -C "$repository_root" status --porcelain)" ]]; then
    echo "The target checkout is not clean; refusing to apply patches." >&2
    git -C "$repository_root" status --short >&2
    exit 1
fi

(
    cd -- "$overlay_dir"
    sha256sum --check SHA256SUMS
)

patches=()
if [[ "$compatibility" == true ]]; then
    patches+=("$overlay_dir/0001-kit-109.0.5-and-https-registries.patch")
fi
if [[ "$deduplicate_loads" == true ]]; then
    patches+=("$overlay_dir/0002-deduplicate-timestamped-image-loads.patch")
fi
if [[ "$no_loop" == true ]]; then
    patches+=("$overlay_dir/0003-disable-automatic-timeline-looping.patch")
fi

for patch_file in "${patches[@]}"; do
    git -C "$repository_root" apply --check "$patch_file"
done

if [[ "$check_only" == true ]]; then
    echo "Patch validation succeeded for $repository_root"
    exit 0
fi

for patch_file in "${patches[@]}"; do
    echo "Applying $(basename -- "$patch_file")"
    git -C "$repository_root" apply "$patch_file"
done

echo "E2CC overlay applied successfully to $repository_root"
git -C "$repository_root" status --short

