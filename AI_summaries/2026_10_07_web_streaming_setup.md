# E2CC Web Streaming: Workstation Setup

## Scope

This note records the E2CC WebRTC streaming setup validated on the RTX PRO
6000 Blackwell workstation on 2026-10-07. The Flask routes, template,
JavaScript, styling, and codebase integration are described separately in
`2026_10_07_web_streaming_flask_integration.md`.

## Result

NVIDIA Earth-2 Command Center now runs as a headless GPU application and
streams its full user interface to a browser through NVIDIA's Kit 109 WebRTC
extensions. The stream is embedded in the Flask application and was tested
successfully from a Mac on the company network/VPN.

The verified topology is:

```text
Mac browser
  -> http://10.86.6.247:5000/earth2       Flask integration page
  -> http://10.86.6.247:8011/             NVIDIA browser client
  -> ws://10.86.6.247:49100                WebRTC signaling
  -> UDP 10.86.6.247:47998                 video and interactive input
  -> headless E2CC OVC process
  -> RTX PRO 6000 Blackwell GPU
```

## Verified workstation

- Hostname: `1u1g-gen-0432`
- Workstation address: `10.86.6.247`
- Operating system: Ubuntu 22.04.5 LTS, x86-64
- GPU: NVIDIA RTX PRO 6000 Blackwell Server Edition
- GPU memory: 97,887 MiB
- NVIDIA driver: 595.91.07
- UFW status during validation: inactive
- Docker NVIDIA runtime: registered
- Project checkout:
  `/home/fgerken/CODE/thinkingearth_prototype`
- NVIDIA checkout:
  `/var/tmp/fgerken/e2cc/earth2-weather-analytics`
- E2CC application directory:
  `/var/tmp/fgerken/e2cc/earth2-weather-analytics/earth-2-command-center`
- NVIDIA base commit:
  `d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4`
- Kit runtime:
  `109.0.5+production.296990.e3b53912.gl`

The existing RealVNC E2CC process and the headless streaming process are
separate E2CC instances. Both fit comfortably on the 96 GB GPU during testing,
but the browser does not control the RealVNC instance.

## E2CC streaming overlay

The portable E2CC change is preserved as:

```text
patches/e2cc/0004-browser-streaming.patch
```

The patch makes two changes to NVIDIA's pinned checkout.

### Precaching

It enables `omni.earth_2_command_center.app_ovc.kit` in `repo.toml`'s
`repo_precache_exts.apps` list. This makes the E2CC build resolve and download
the WebRTC dependencies instead of discovering them only at runtime.

### Kit application configuration

It replaces the legacy `omni.kit.streamsdk.plugins` configuration with the
Kit 109 streaming extensions validated on this workstation:

| Extension | Pinned version |
| --- | --- |
| `omni.kit.livestream.app` | `9.1.0` |
| `omni.kit.livestream.webrtc` | `9.2.0` |
| `omni.services.livestream.webrtc` | `9.1.0` |

The OVC application is configured with:

```text
primaryStream.streamType = "webrtc"
primaryStream.signalPort = 49100
primaryStream.streamPort = 47998
primaryStream.allowDynamicResize = true
HTTP service host = 0.0.0.0
HTTP service port = 8011
```

The overlay checksum is recorded in `patches/e2cc/SHA256SUMS`. It was tested
with `git apply --check` against a clean local clone of the exact pinned NVIDIA
commit, both independently and after the Kit 109.0.5 compatibility patch.

## Applying the overlay on a clean workstation

From the project checkout:

```bash
./scripts/setup_e2cc.sh --check-only --compatibility --streaming \
  /path/to/earth2-weather-analytics

./scripts/setup_e2cc.sh --compatibility --streaming \
  /path/to/earth2-weather-analytics
```

The helper requires:

- The exact NVIDIA commit recorded in `patches/e2cc/UPSTREAM_COMMIT`.
- A clean NVIDIA worktree.
- Valid checksums for every selected patch.

The `--compatibility` patch reproduces the working Blackwell Kit 109.0.5 and
HTTPS registry setup. On the RTX 6000 Ada workstation, first assess whether the
clean pinned NVIDIA checkout works without the Blackwell compatibility patch.
The `--streaming` patch is required for this browser setup on either machine.

The current Blackwell checkout was already dirty with the previously validated
compatibility and optional patches, so the streaming patch was applied to that
checkout manually and then preserved in the clean overlay series.

## Rebuilding E2CC

The existing workstation build used the same Python 3.12, CUDA 12.8, and
local-NVMe cache environment documented in
`2026_10_02_workstation_setup.md`.

After applying the overlay:

```bash
cd /var/tmp/fgerken/e2cc/earth2-weather-analytics/earth-2-command-center
./build.sh --release
```

The build completed successfully and precached:

- `omni.kit.livestream.app-9.1.0`
- `omni.kit.livestream.webrtc-9.2.0`
- `omni.services.livestream.webrtc-9.1.0`
- Their Omniverse Services dependencies and browser assets

The generated launcher is:

```text
_build/linux-x86_64/release/omni.earth_2_command_center.app_ovc.sh
```

Do not transfer this `_build` tree to another GPU workstation. Rebuild from
source on the target machine.

## Launch helper

The project provides:

```text
scripts/run_e2cc_streaming.sh
```

It verifies that:

- The OVC launcher exists and is executable.
- The generated OVC Kit configuration exists.
- The browser-streaming extension is present in that configuration.
- All configured ports are valid.

It then runs E2CC headlessly and supplies the current WebRTC settings on the
Kit command line.

Supported environment variables are:

| Variable | Default | Purpose |
| --- | --- | --- |
| `E2CC_APP_DIR` | Current `/var/tmp/fgerken/.../earth-2-command-center` path | E2CC application directory |
| `E2CC_PUBLIC_IP` | Empty | Address advertised to WebRTC clients |
| `E2CC_SIGNAL_PORT` | `49100` | Signaling TCP port |
| `E2CC_MEDIA_PORT` | `47998` | Media UDP port |
| `E2CC_HTTP_PORT` | `8011` | NVIDIA browser-client HTTP port |
| `E2CC_EXTRA_ARGS` | Empty | Additional Kit arguments |

Validate a completed build without launching it:

```bash
./scripts/run_e2cc_streaming.sh --check-only
```

Launch it on the current workstation:

```bash
E2CC_PUBLIC_IP=10.86.6.247 ./scripts/run_e2cc_streaming.sh
```

`E2CC_PUBLIC_IP` is sent to the WebRTC server as its advertised public
endpoint. It must be changed on the next workstation.

## Current live processes

Two temporary `tmux` sessions are currently running.

### `thinkingearth-e2cc`

```bash
cd /home/fgerken/CODE/thinkingearth_prototype
E2CC_PUBLIC_IP=10.86.6.247 ./scripts/run_e2cc_streaming.sh
```

The process reached E2CC `app ready`, started the HTTP browser service, and
reported:

```text
Started primary stream server on signal port 49100 and stream port 47998
```

### `thinkingearth-flask`

```bash
cd /home/fgerken/CODE/thinkingearth_prototype
E2CC_STREAM_URL=http://10.86.6.247:8011 \
  .venv/bin/gunicorn \
  --bind 0.0.0.0:5000 \
  --workers 2 \
  --access-logfile - \
  app:app
```

Inspect either process with:

```bash
tmux attach -t thinkingearth-e2cc
tmux attach -t thinkingearth-flask
```

Detach with `Ctrl+B`, then `D`.

Stop the temporary processes with:

```bash
tmux kill-session -t thinkingearth-e2cc
tmux kill-session -t thinkingearth-flask
```

These sessions survive SSH and RealVNC disconnections. They do not survive a
reboot and do not restart after a crash. Portable service definitions are the
next planned step; permanent services should be installed on the new machine.

## Verified service endpoints

### NVIDIA stream configuration

```bash
curl --fail http://10.86.6.247:8011/api/stream-config
```

Verified response:

```json
{
  "streams": [
    {
      "name": "Primary App Stream",
      "type": "primary",
      "port": 49100,
      "streamType": "webrtc",
      "allowDynamicResize": true,
      "description": "Main application stream (webrtc)"
    }
  ]
}
```

### Flask configuration

```bash
curl --fail http://10.86.6.247:5000/api/e2cc/config
```

Verified response:

```json
{
  "http_port": 8011,
  "media_port": 47998,
  "signal_port": 49100,
  "url": "http://10.86.6.247:8011"
}
```

### Integrated page

```text
http://10.86.6.247:5000/earth2
```

### Direct NVIDIA client

```text
http://10.86.6.247:8011/
```

The direct client is useful for distinguishing an E2CC/WebRTC problem from an
iframe or Flask integration problem.

## Network requirements

The reviewer's browser must reach:

| Port | Protocol | Purpose |
| --- | --- | --- |
| `5000` | TCP | Current Flask/Gunicorn test server |
| `8011` | TCP | NVIDIA browser client and stream configuration API |
| `49100` | TCP | WebRTC signaling |
| `47998` | UDP | WebRTC video and interactive input |

The current Mac test succeeded over the company network/VPN using the
workstation's `10.86.6.247` address.

An SSH tunnel can carry the TCP ports but does not carry the UDP media path.
For networks without direct UDP reachability, configure TURN rather than
trying to solve the media connection with SSH port forwarding.

From the Mac, the TCP services can be checked with:

```bash
nc -vz 10.86.6.247 5000
nc -vz 10.86.6.247 8011
nc -vz 10.86.6.247 49100
```

A UDP `nc` result is not conclusive because UDP has no connection handshake.
To observe real WebRTC traffic, run this on the workstation while connecting
from the browser:

```bash
sudo tcpdump -ni enp65s0f0np0 udp port 47998
```

Chrome or Edge `chrome://webrtc-internals` provides the selected ICE candidate
pair, connection state, and received-byte counters when deeper client-side
diagnosis is needed.

## Browser acceptance test completed

1. Opened `http://10.86.6.247:5000/earth2` from the Mac.
2. Loaded NVIDIA's browser client inside the Flask page.
3. Established the WebRTC connection to the headless E2CC process.
4. Displayed the GPU-rendered E2CC globe.
5. Confirmed browser interaction works.

The server-side checks also confirmed that the headless Kit process used the
NVIDIA GPU and that the NVIDIA browser page does not send an iframe-blocking
response header.

The remaining scientific acceptance check is to load the project metadata in
the headless instance and repeat the `q850`, `q925`, and `q1000` timeline test
through the browser. Metadata loaded in the RealVNC E2CC process is not shared
with the headless process.

## Current limitations

- One peer-to-peer browser connection controls the stream at a time.
- There is no session scheduler or per-reviewer E2CC process.
- E2CC does not start automatically after reboot.
- Flask and E2CC currently use unencrypted HTTP/WebRTC signaling endpoints.
- There is no authentication or authorization around the viewer.
- TURN is not configured for NAT or restrictive networks.
- Abandoned-session cleanup is not implemented.
- Project metadata is not loaded automatically at headless startup.
- The current IP address and `/var/tmp/fgerken` paths are machine-specific.

## Moving to the RTX 6000 Ada workstation

Transfer the implementation through Git, not by copying runtime state.

### Preserve and transfer

- Flask routes, page, JavaScript, and CSS.
- `patches/e2cc/0004-browser-streaming.patch` and its checksum.
- `scripts/setup_e2cc.sh` with the `--streaming` selection.
- `scripts/run_e2cc_streaming.sh`.
- `E2CC_STREAMING.md` and these two summary files.
- Raw HDF5 and generated exports through the existing CSS Storage workflow.

### Recreate on the Ada machine

1. Clone the updated project branch.
2. Clone the pinned NVIDIA repository commit.
3. Restore the ignored prediction data and E2CC exports.
4. Prepare Python 3.12, CUDA 12.8, and local-NVMe caches.
5. Apply `--streaming`; add `--compatibility` only if needed or when reproducing
   the final Blackwell configuration exactly.
6. Rebuild E2CC from source.
7. Create a fresh Flask `.venv` and install the pinned requirements.
8. Set the new workstation's browser-visible IP or hostname in
   `E2CC_PUBLIC_IP` and `E2CC_STREAM_URL`.
9. Repeat the endpoint checks and browser acceptance test.
10. Install the portable service definitions and replace the temporary `tmux`
    processes.

### Do not transfer

- Current `tmux` sessions or process state.
- The project `.venv`.
- E2CC `_build` output.
- CUDA extension binaries.
- Shader, uv, pip, or Omniverse caches.
- The current `10.86.6.247` address.
- Machine-installed or enabled service state.

## Production work after migration

After reproducing the working direct stream on Ada:

1. Add managed services with restart policies and structured logs.
2. Put Flask and the NVIDIA browser client behind HTTPS.
3. Add authentication before exposing the viewer beyond the trusted network.
4. Configure TURN and test from a network without direct workstation access.
5. Add automatic metadata loading or a browser-friendly data-selection flow.
6. Add session cleanup and monitoring.
7. Decide whether one shared session is sufficient before adding multi-user
   orchestration.
