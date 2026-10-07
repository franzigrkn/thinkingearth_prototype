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

## Current delivery decision

The live stream will remain internal on the trusted company network or VPN.
After reproducing this setup on the RTX 6000 Ada workstation, the operator will
open the embedded viewer at `/earth2` from the Mac and record the reviewer
demonstration there. Reviewers will receive the video and this deployment
blueprint rather than access to a public hosted stream. Public cloud hosting
and its associated security and multi-user work are deferred.

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

## Launch helpers

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

`E2CC_PUBLIC_IP` is the Kit setting name for the address advertised to WebRTC
clients. For this internal deployment it must contain the Ada workstation's
company-network/VPN address; the name does not imply public internet exposure.

The Flask process has a matching wrapper:

```text
scripts/run_flask_streaming.sh
```

It verifies the project `.venv`, Gunicorn executable, worker count, bind
address, and WSGI module before launching Gunicorn. Its service-specific
variables are `FLASK_BIND`, `FLASK_WORKERS`, and `FLASK_APP_MODULE`.

## Reproducible service startup

Portable user-level systemd definitions now live in:

```text
deploy/systemd/thinkingearth-e2cc.service.in
deploy/systemd/thinkingearth-flask.service.in
deploy/systemd/thinkingearth-streaming.target
deploy/systemd/streaming.env.example
```

The installer is:

```bash
scripts/install_streaming_services.sh
```

It performs the following steps:

- Loads and validates the machine-local environment file.
- Runs both launch helpers in `--check-only` mode.
- Renders absolute repository and config paths into the unit templates.
- Validates the rendered systemd units.
- Installs them under `~/.config/systemd/user/`.
- Enables the shared target for automatic startup.
- Optionally enables user lingering and starts or restarts the stack.

Machine-specific values are stored in the ignored file:

```text
deploy/systemd/streaming.env
```

The current file contains the Blackwell E2CC path, `10.86.6.247`, the three
stream ports, the Flask URL, `0.0.0.0:5000`, and two Gunicorn workers. It must
be recreated rather than copied unchanged on the Ada workstation.

Reproduce the installation on a prepared workstation with:

```bash
cp deploy/systemd/streaming.env.example deploy/systemd/streaming.env
# Edit deploy/systemd/streaming.env.
./scripts/install_streaming_services.sh --check-only
./scripts/install_streaming_services.sh --start --enable-linger
```

The services use `Restart=on-failure`, write stdout and stderr to journald,
and run launch-time preflight checks. `thinkingearth-streaming.target`
coordinates both services.

## Current live services

The temporary tmux sessions have been removed. The live processes are now:

| Unit | Process |
| --- | --- |
| `thinkingearth-e2cc.service` | Headless E2CC OVC stream |
| `thinkingearth-flask.service` | Gunicorn with two Flask workers |
| `thinkingearth-streaming.target` | Shared startup and stop target |

The target is enabled and the account has `Linger=yes`, so the user manager
can start the stack during boot and keep it running after logout. Both live
process trees were verified in their respective systemd cgroups.

The managed E2CC launch reached `app ready` and reported:

```text
Started primary stream server on signal port 49100 and stream port 47998
```

The managed Flask endpoint and NVIDIA configuration endpoint both returned
HTTP 200 after a clean managed restart. A Mac browser then reloaded `/earth2`
and established a new WebRTC client connection.

Inspect and operate the stack with:

```bash
systemctl --user status thinkingearth-streaming.target
systemctl --user restart thinkingearth-streaming.target
systemctl --user stop thinkingearth-streaming.target
journalctl --user -u thinkingearth-e2cc.service -f
journalctl --user -u thinkingearth-flask.service -f
```

Re-run the installer after changing the repository location, environment-file
location, or service templates. Normal environment-value changes only require
a target restart.

To disable boot startup without deleting the installed units:

```bash
systemctl --user disable --now thinkingearth-streaming.target
```

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

The operator's browser must reach:

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
- Startup is managed and reboot-safe, but application-level readiness is not
  yet monitored beyond systemd process state and launch preflight checks.
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
- `scripts/run_flask_streaming.sh`.
- `scripts/install_streaming_services.sh`.
- The service templates and environment example under `deploy/systemd/`.
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
8. Copy `streaming.env.example` to the ignored `streaming.env` and set the new
   workstation paths, browser-visible IP or hostname, ports, and Flask values.
9. Run the installer in `--check-only` mode.
10. Install with `--start --enable-linger`.
11. Repeat the endpoint checks and browser acceptance test.

### Do not transfer

- Current `tmux` sessions or process state.
- The project `.venv`.
- E2CC `_build` output.
- CUDA extension binaries.
- Shader, uv, pip, or Omniverse caches.
- The current `10.86.6.247` address.
- Machine-installed or enabled service state.

## Demo recording after migration

After reproducing and accepting the browser stream on Ada:

1. Connect the Mac to the company network or VPN.
2. Confirm the managed services are healthy and close every other viewer tab.
3. Open `http://<ADA_ADDRESS>:5000/earth2` in Chrome or Edge.
4. Load and verify the project metadata in the headless E2CC instance.
5. Record the embedded website view, including globe interaction, layer
   selection, and timeline playback; do not record through RealVNC or the
   direct `:8011` client.
6. Keep the workstation endpoints internal and provide only the finished video
   and setup blueprint to reviewers.

HTTPS, authentication, TURN, readiness monitoring, automatic session cleanup,
and multi-user orchestration remain possible future work but are not required
for the current internal prototype and recorded reviewer delivery.
