# E2CC Local Overlay

This directory preserves the local Earth-2 Command Center changes without
copying or vendoring NVIDIA's repository.

## Upstream revision

- Repository: `https://github.com/NVIDIA-Omniverse-blueprints/earth2-weather-analytics.git`
- Base commit: `d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4`
- E2CC application directory inside the upstream repository:
  `earth-2-command-center/`

The patches are intended to be applied from the root of the
`earth2-weather-analytics` repository. The setup helper verifies the exact base
commit, a clean worktree, and all patch checksums before changing anything.

## Patch series

| Patch | Status | Purpose |
| --- | --- | --- |
| `0001-kit-109.0.5-and-https-registries.patch` | Compatibility | Pins Kit 109.0.5 and uses the working HTTPS extension registries. This reproduces the validated Blackwell/R595 setup. Apply it on another machine only when reproducing that setup or when the stock Kit 109.0.2 setup is unsuitable. |
| `0002-deduplicate-timestamped-image-loads.patch` | Optional | Avoids queuing another asynchronous JPEG decode while the selected image path is unchanged. This is a defensive optimization and was not the solution to the RealVNC display problem. |
| `0003-disable-automatic-timeline-looping.patch` | Optional | Holds the final timeline frame instead of automatically wrapping to the first frame. This was added during the earlier timing investigation and is normally best omitted now that the actual RealVNC cause is known. |
| `0004-browser-streaming.patch` | Streaming | Replaces the legacy OVC StreamSDK configuration with the Kit 109 WebRTC extensions, enables NVIDIA's browser client on TCP 8011, and precaches the OVC application. |

RealVNC's **Picture quality: High** and **PreferredEncoding: ZRLE** settings are
client settings and are not represented by an E2CC source patch.

## Apply with the helper

Start with a clean upstream checkout at the pinned commit:

```bash
git clone https://github.com/NVIDIA-Omniverse-blueprints/earth2-weather-analytics.git
cd earth2-weather-analytics
git checkout d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4
```

From this project, check the compatibility patch without applying it:

```bash
./scripts/setup_e2cc.sh --check-only --compatibility /path/to/earth2-weather-analytics
```

Apply the compatibility patch:

```bash
./scripts/setup_e2cc.sh --compatibility /path/to/earth2-weather-analytics
```

Apply every preserved patch when reproducing the complete current local diff:

```bash
./scripts/setup_e2cc.sh --all /path/to/earth2-weather-analytics
```

The optional patches can also be selected independently:

```bash
./scripts/setup_e2cc.sh --deduplicate-loads /path/to/earth2-weather-analytics
./scripts/setup_e2cc.sh --no-loop /path/to/earth2-weather-analytics
```

The helper deliberately does not clone, download dependencies, build E2CC, or
change an already dirty checkout. Those steps remain visible and reviewable.

## Manual application

From the root of a clean upstream checkout:

```bash
git apply --check /path/to/thinkingearth_prototype/patches/e2cc/0001-kit-109.0.5-and-https-registries.patch
git apply /path/to/thinkingearth_prototype/patches/e2cc/0001-kit-109.0.5-and-https-registries.patch
```

Apply optional patches in numerical order if they are wanted. Before applying
anything manually, verify the package:

```bash
cd /path/to/thinkingearth_prototype/patches/e2cc
sha256sum --check SHA256SUMS
```

## New-workstation recommendation

1. For a GUI-only test, start with the clean upstream checkout at the pinned
   commit. For the browser-streaming deployment, apply `--streaming` before the
   first build so the OVC application is included and precached.
2. Use the compatibility patch if the stock Kit configuration is unsuitable,
   or if exact reproduction of the Blackwell environment is required.
3. Leave the duplicate-load and no-loop patches unapplied initially.
4. Configure RealVNC to `High` plus `ZRLE` before judging rendering quality.
5. Rebuild on the new machine; do not transfer `_build`, Python environments,
   package caches, or shader caches from the previous workstation.

## Browser streaming

Apply the streaming patch alongside whichever compatibility patches the target
machine needs:

```bash
./scripts/setup_e2cc.sh --compatibility --streaming /path/to/earth2-weather-analytics
```

After rebuilding, use `scripts/run_e2cc_streaming.sh` to start the headless OVC
application with fixed signaling, media, and browser-client ports. See
`E2CC_STREAMING.md` for the complete workstation and Flask integration runbook.
