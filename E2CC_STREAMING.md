# E2CC Browser Streaming

## Architecture

The first browser version uses one peer-to-peer WebRTC session:

```text
Flask /earth2 page
    -> embeds NVIDIA browser client on TCP 8011
    -> browser client negotiates on TCP 49100
    -> E2CC sends interactive video and input on UDP 47998
```

The browser client is provided by NVIDIA's `omni.services.livestream.webrtc`
extension. Flask does not proxy or reimplement WebRTC.

## 1. Apply the streaming overlay

Start from the pinned NVIDIA checkout. The streaming patch can be combined
with the existing Blackwell compatibility patch:

```bash
cd /home/fgerken/CODE/thinkingearth_prototype
./scripts/setup_e2cc.sh --check-only --compatibility --streaming \
  /var/tmp/fgerken/e2cc/earth2-weather-analytics
./scripts/setup_e2cc.sh --compatibility --streaming \
  /var/tmp/fgerken/e2cc/earth2-weather-analytics
```

The current Blackwell checkout already contains the compatibility changes. To
add streaming there, apply only `patches/e2cc/0004-browser-streaming.patch`
manually and rebuild.

## 2. Rebuild E2CC

Use the same local-NVMe cache and Python/CUDA environment as the original E2CC
build, then run:

```bash
cd /var/tmp/fgerken/e2cc/earth2-weather-analytics/earth-2-command-center
./build.sh --release
```

The OVC application is included in extension precaching so the streaming
extensions are present before launch.

## 3. Configure managed startup

E2CC and Flask run as user-level systemd services. Machine-specific values are
kept in an ignored environment file:

```bash
cd /home/fgerken/CODE/thinkingearth_prototype
cp deploy/systemd/streaming.env.example deploy/systemd/streaming.env
```

Edit `deploy/systemd/streaming.env` and set at least:

- `E2CC_APP_DIR` to the rebuilt E2CC application directory.
- `E2CC_PUBLIC_IP` to the address advertised to WebRTC clients.
- `E2CC_STREAM_URL` to the browser-visible NVIDIA client URL.

Keep each E2CC port equal to its corresponding `E2CC_STREAM_*` port. Then
validate all launchers, configuration values, and rendered units without
changing the host:

```bash
./scripts/install_streaming_services.sh --check-only
```

Install, enable, and start the stack:

```bash
./scripts/install_streaming_services.sh --start --enable-linger
```

The installer renders absolute project and config paths into
`~/.config/systemd/user/`, enables `thinkingearth-streaming.target`, and keeps
logs in the user journal. `--enable-linger` makes the user manager start at
boot and survive logout; local policy may ask for authorization.

The units provide:

- Launch-time preflight validation.
- `Restart=on-failure` for E2CC and Flask.
- Coordinated start and stop through one target.
- Structured logs through journald.

Operate the stack with:

```bash
systemctl --user status thinkingearth-streaming.target
systemctl --user restart thinkingearth-streaming.target
systemctl --user stop thinkingearth-streaming.target
journalctl --user -u thinkingearth-e2cc.service -f
journalctl --user -u thinkingearth-flask.service -f
```

Re-run the installer after moving the repository, changing the config-file
path, or updating the service templates.

## 4. Manual diagnostic startup

The managed services are preferred. For terminal-based diagnosis, export the
same local configuration and launch each helper in a separate terminal:

```bash
cd /home/fgerken/CODE/thinkingearth_prototype
set -a
source deploy/systemd/streaming.env
set +a
./scripts/run_e2cc_streaming.sh
```

```bash
cd /home/fgerken/CODE/thinkingearth_prototype
set -a
source deploy/systemd/streaming.env
set +a
./scripts/run_flask_streaming.sh
```

Do not run these commands while the systemd stack owns the same ports. The
first headless E2CC launch can take several minutes while RTX shaders compile.

Open `http://<workstation-address>:5000/earth2` from a browser that can reach
the workstation. If `E2CC_STREAM_URL` is omitted, the page uses the Flask
hostname and port 8011 automatically.

The available Flask settings are:

| Variable | Default | Purpose |
| --- | --- | --- |
| `E2CC_STREAM_URL` | inferred | NVIDIA browser-client URL |
| `E2CC_STREAM_HTTP_PORT` | `8011` | Browser client HTTP service |
| `E2CC_STREAM_SIGNAL_PORT` | `49100` | WebRTC signaling |
| `E2CC_STREAM_MEDIA_PORT` | `47998` | WebRTC UDP media |

Additional Flask-service settings are:

| Variable | Default | Purpose |
| --- | --- | --- |
| `FLASK_BIND` | `0.0.0.0:5000` | Gunicorn listener |
| `FLASK_WORKERS` | `2` | Gunicorn worker processes |
| `FLASK_APP_MODULE` | `app:app` | WSGI application |

## Network requirements

The browser must reach all three workstation ports:

- TCP 8011 for the NVIDIA browser client.
- TCP 49100 for WebRTC signaling.
- UDP 47998 for media and input transport.

An SSH tunnel is useful for TCP diagnostics but does not carry the UDP media
path. Test first over the company network or VPN with direct reachability to
`10.86.6.247`. For access across NAT or restrictive networks, configure TURN.

Only one browser can control this peer-to-peer prototype at a time. Close the
first browser tab before testing a second client.

## HTTPS deployment

An HTTPS Flask page cannot embed an HTTP viewer. Before public deployment,
terminate TLS for the Flask site and E2CC browser client, proxy WebSocket
signaling correctly, expose the UDP media path, add authentication, and use a
TURN server where direct ICE connectivity is unavailable. Set
`E2CC_STREAM_URL` to the resulting HTTPS viewer URL.

Do not expose the workstation's VNC port publicly.

## Acceptance test

1. Confirm `/api/stream-config` reports the primary stream.
2. Open the Flask `/earth2` page in Chrome or Edge.
3. Connect the NVIDIA client and confirm the E2CC globe appears.
4. Rotate and zoom the globe from the browser.
5. Load `q850`, `q925`, and `q1000` and scrub each seven-step timeline.
6. Confirm only one browser controls the session and reconnect works after the
   first tab closes.
