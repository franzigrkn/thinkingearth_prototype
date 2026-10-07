# E2CC Web Streaming: Flask Integration

## Scope

This note records the codebase integration completed on 2026-10-07 between the
existing Flask application and NVIDIA Earth-2 Command Center (E2CC) browser
streaming. Workstation installation, E2CC build details, networking, and live
process management are recorded separately in
`2026_10_07_web_streaming_setup.md`.

## Result

The Flask site now has an **Interactive 3D Globe** page at `/earth2`. That page
embeds NVIDIA's browser client, which connects directly to a headless,
GPU-rendered E2CC process over WebRTC.

The complete path was tested successfully from a Mac browser:

```text
Browser
  -> Flask page on TCP 5000
  -> embedded NVIDIA browser client on TCP 8011
  -> WebRTC signaling to E2CC on TCP 49100
  -> interactive video and input transport on UDP 47998
  -> headless E2CC process on the NVIDIA GPU
```

Flask serves the surrounding website and tells the browser where to find the
NVIDIA client. Flask does **not** proxy, encode, decode, or relay the E2CC video
stream. Mouse and keyboard events and rendered frames travel between the
browser and E2CC through the WebRTC connection.

## Current delivery decision

The live integration will remain internal on the trusted company network or
VPN. It will be rebuilt on the RTX 6000 Ada workstation and used through the
Flask `/earth2` page to record the final reviewer demonstration. Reviewers will
receive the video and the reproducible setup blueprint rather than credentials
or network access to a hosted instance. Public deployment, cloud GPU hosting,
authentication, TURN, and multi-user orchestration are outside the current
scope.

## Flask routes

The same routes were added to both `app.py` and `app_production.py`.

### `/earth2`

Renders `templates/earth2.html` and passes a browser-visible configuration
object with:

- `url`: explicit NVIDIA browser-client URL, if configured.
- `http_port`: NVIDIA browser-client HTTP port.
- `signal_port`: WebRTC signaling port.
- `media_port`: WebRTC media port.

### `/api/e2cc/config`

Returns the same values as JSON. This is useful for diagnostics and confirms
which browser endpoint the running Flask process is advertising. It contains
no credentials or secret configuration.

The verified live response is:

```json
{
  "http_port": 8011,
  "media_port": 47998,
  "signal_port": 49100,
  "url": "http://10.86.6.247:8011"
}
```

## Environment configuration

The Flask integration reads these environment variables at request time:

| Variable | Default | Purpose |
| --- | --- | --- |
| `E2CC_STREAM_URL` | Empty; inferred in the browser | Complete URL of NVIDIA's browser client |
| `E2CC_STREAM_HTTP_PORT` | `8011` | Browser-client HTTP service |
| `E2CC_STREAM_SIGNAL_PORT` | `49100` | WebRTC signaling |
| `E2CC_STREAM_MEDIA_PORT` | `47998` | WebRTC media and input transport |

The current Flask process uses:

```text
E2CC_STREAM_URL=http://10.86.6.247:8011
```

If `E2CC_STREAM_URL` is empty, `static/js/earth2.js` builds the viewer URL from
the current page's protocol and hostname plus `E2CC_STREAM_HTTP_PORT`. This is
convenient when Flask and E2CC are exposed through the same hostname.

An explicit URL is preferable when the Flask page and stream use different
internal addresses. The configured URL must be usable by the operator's
browser; it is not a server-internal URL.

## Page and frontend behavior

### `templates/earth2.html`

The page provides:

- An iframe for NVIDIA's supplied WebRTC browser client.
- A connection-status indicator.
- A **Reload viewer** button that recreates the iframe connection.
- An **Open full screen** link that opens the NVIDIA client directly.
- A note that the current peer-to-peer setup supports one controlling browser.
- A note that the browser needs direct access to the WebRTC ports.

The stream configuration is serialized with Jinja's `tojson` filter into an
`application/json` script element. The URL is therefore passed as data rather
than constructed through inline JavaScript string interpolation.

### `static/js/earth2.js`

On page load, the script:

1. Reads the JSON configuration embedded by Flask.
2. Uses the explicit stream URL or infers one from the current hostname.
3. Validates the URL.
4. Rejects an HTTP viewer embedded in an HTTPS Flask page, because browsers
   block that mixed-content combination.
5. Loads NVIDIA's client into the iframe.
6. Updates the page status when the iframe document loads.
7. Supports reloading the iframe and opening the client in a separate tab.

The status **Browser client loaded** means the NVIDIA client document loaded.
The authoritative WebRTC connection state remains the connection state shown
inside NVIDIA's client.

### Navigation and styling

`templates/layout.html` adds a **3D Globe** navigation link using Flask's
`url_for('earth2')`.

`static/css/style.css` adds responsive styling for the page header, stream
status, error notice, iframe, action buttons, and network notes. The iframe is
large enough for the full E2CC interface and becomes shorter on narrow screens.

## Files added

- `templates/earth2.html`
- `static/js/earth2.js`
- `scripts/run_e2cc_streaming.sh`
- `patches/e2cc/0004-browser-streaming.patch`
- `E2CC_STREAMING.md`

The last three files support the E2CC side of the integration and are described
in `2026_10_07_web_streaming_setup.md`.

## Files changed

- `app.py`
- `app_production.py`
- `templates/layout.html`
- `static/css/style.css`
- `scripts/setup_e2cc.sh`
- `patches/e2cc/README.md`
- `patches/e2cc/SHA256SUMS`

## Current Flask runtime

The current workstation uses a project-local, ignored `.venv` with the pinned
requirements from `requirements.txt`. Flask is running through Gunicorn under
the user-level `thinkingearth-flask.service`. The service calls:

```bash
scripts/run_flask_streaming.sh
```

The wrapper validates the `.venv`, worker count, bind address, and WSGI module
before executing Gunicorn. Current values come from the ignored
`deploy/systemd/streaming.env` file: `0.0.0.0:5000`, two workers, `app:app`,
and `E2CC_STREAM_URL=http://10.86.6.247:8011`.

The integration page is currently available at:

```text
http://10.86.6.247:5000/earth2
```

The service uses `Restart=on-failure`, journald output, and is coordinated with
E2CC by `thinkingearth-streaming.target`. The target is enabled and the user
has lingering enabled, so it can start at boot and continue after logout.

## Validation completed

- Development and production Flask applications return HTTP 200 for `/earth2`.
- Both return the expected JSON from `/api/e2cc/config`.
- The template contains the configured E2CC URL and loads `earth2.js`.
- The live NVIDIA client returns a primary WebRTC stream configuration.
- NVIDIA's browser-client response does not set an iframe-blocking header.
- Both Flask and the NVIDIA client are reachable through `10.86.6.247`.
- The page and interactive E2CC stream were successfully tested from the Mac.
- Globe rotation and browser interaction work through the integrated page.
- The managed Flask service returned HTTP 200 after a clean restart.
- The Gunicorn process tree was verified in the `thinkingearth-flask.service`
  cgroup.

## Important boundaries

- The browser stream controls the **headless E2CC OVC process**, not the E2CC
  process visible through RealVNC. They are separate application instances.
- Loading metadata in one instance does not automatically load it in the other.
- The current WebRTC mode provides one controlling browser session at a time.
- Opening multiple viewer tabs can prevent a new tab from connecting until the
  first connection is closed.
- The current site and viewer use HTTP and must remain inside the trusted
  company network or VPN.
- There is no authentication, authorization, session scheduler, automatic
  cleanup, or TURN service yet.
- Those public-deployment features are intentionally deferred because the
  current reviewer deliverable is a recorded video.

## Repository state

The project is on branch `e2cc`. The Flask integration was introduced at
`8349b3c`, the reproducible service startup at `898085d`, and the branch state
before this delivery-decision update was pushed at:

```text
dfa126e
```

The documentation changes recording the internal-demo decision are the only
current working-tree changes and must be committed and pushed before migration.

## Migration implications

The portable integration consists of the Flask source files, streaming patch,
launch helpers, systemd templates, installer, and documentation. On the new
workstation:

1. Clone the updated `e2cc` branch after these changes are committed.
2. Create a fresh Flask virtual environment and install the requirements.
3. Rebuild E2CC instead of transferring the Blackwell `_build` directory.
4. Apply the streaming overlay before the E2CC build.
5. Create a machine-local `deploy/systemd/streaming.env` from the example.
6. Install with `--start --enable-linger`.
7. Repeat the `/earth2` browser acceptance test.
8. Load the project metadata in the headless streamed instance and record the
   demonstration from `/earth2` on the Mac.

Do not transfer the current `.venv`, `tmux` sessions, running processes,
machine IP address, E2CC build output, or caches.
