# RTX 6000 Ada Workstation Setup — 2026-10-27

## Result

The E2CC prototype was successfully migrated from the RTX PRO 6000 Blackwell
workstation to the RTX 6000 Ada workstation. The Flask website with embedded
WebRTC streaming is operational at `http://10.176.193.185:5000/earth2`.

## Workstation

- Hostname: `2u1g-x570-0071`
- GPU: NVIDIA RTX 6000 Ada Generation, 46,068 MiB VRAM
- NVIDIA driver: 595.99.02
- OS: Ubuntu 22.04, x86-64
- Local NVMe: 880 GB (`/var/tmp`), 798 GB free after setup
- Network home: 5 GB NFS (required cache relocation)

## Setup completed

All steps from the Ada runbook (`2026_10_11_setup_ADA_workstation.md`) were
completed, with the RealVNC acceptance test (Steps 9–11) skipped in favor of
going directly to the browser streaming setup.

1. Workstation verified, Docker GPU access confirmed.
2. Project cloned on `e2cc` branch; data restored from CSS Storage.
3. Python 3.12.16, CUDA 12.8 (V12.8.93), and local-NVMe caches configured.
4. NVIDIA Earth-2 Weather Analytics cloned and pinned at
   `d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4`.
5. Only `--streaming` patch applied (no `--compatibility`). Kit 109.0.2 stock.
6. E2CC built successfully; both `app.sh` and `app_ovc.sh` launchers validated.
7. Flask `.venv` created with pinned requirements.
8. Managed systemd services installed with `--start --enable-linger`.
9. Browser stream verified from Mac at `/earth2`.

## Issues encountered and resolved

### Home directory full (5 GB NFS, 100%)

The Kit extension precache stage filled `/home/fgerken` while unpacking
extensions into `~/.local/share/ov/data/exts/v2/`. This caused the
`omni.kit.pip_archive` extension to be partially extracted.

**Fix:** Moved `~/.local/share/ov` to local NVMe and replaced it with a
symlink:

```text
/home/fgerken/.local/share/ov -> /var/tmp/fgerken/e2cc/ov-data
```

The `~/.cache/ov` symlink for the shader cache was also created.

### Corrupted `omni.kit.pip_archive` — missing pydantic

After fixing the disk space and re-running `setup.sh`, the partially extracted
`omni.kit.pip_archive` was reused from the Omniverse extension cache. This
caused `omni.services.transport.server.http` and
`omni.services.livestream.webrtc` to fail with
`ModuleNotFoundError: No module named 'pydantic'`. Port 8011 (browser client)
refused connections while ports 49100 (signaling) and the native WebRTC plugin
started normally.

**Fix:** Deleted the corrupted copy from both locations and rebuilt:

```bash
rm -rf /var/tmp/fgerken/e2cc/ov-data/data/exts/v2/omni.kit.pip_archive-*
rm -rf .../extscache/omni.kit.pip_archive-*
cd earth-2-command-center && ./build.sh --release
```

After rebuild, `pip_prebundle/pydantic/` was fully present and port 8011
responded correctly.

### WebRTC stream stuck on "CONNECTING..."

After leaving the browser tab open for a prolonged period, reconnecting showed
"Connecting to stream..." indefinitely. This was a stale single-peer WebRTC
session, not a UDP reachability issue.

**Fix:** Close all viewer tabs, then:

```bash
systemctl --user restart thinkingearth-e2cc.service
```

Open a fresh single tab. Only one browser controls the stream at a time.

## Service configuration

Environment file: `deploy/systemd/streaming.env` (ignored by Git)

| Setting | Value |
| --- | --- |
| `E2CC_APP_DIR` | `/var/tmp/fgerken/e2cc/earth2-weather-analytics/earth-2-command-center` |
| `E2CC_PUBLIC_IP` | `10.176.193.185` |
| `E2CC_STREAM_URL` | `http://10.176.193.185:8011` |
| Ports | 8011 (HTTP), 49100 (signaling), 47998 (media) |
| `FLASK_BIND` | `0.0.0.0:5000` |
| `FLASK_WORKERS` | `2` |

All three systemd units are active with `Linger=yes`:

- `thinkingearth-streaming.target` (enabled)
- `thinkingearth-e2cc.service`
- `thinkingearth-flask.service`

## Remaining steps

- Load `q850`, `q925`, and `q1000` metadata in the headless E2CC instance
  through the browser and verify the timelines.
- Record the reviewer demonstration through `/earth2` from the Mac.
- Write the final migration record (Step 15 of the runbook).
