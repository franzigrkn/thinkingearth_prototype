# RTX 6000 Ada Workstation Setup

## Objective

Rebuild the validated Earth-2 Command Center (E2CC) prototype from clean
sources on the RTX 6000 Ada workstation available from 2026-10-11. Restore the
ignored scientific data from CSS Storage, build NVIDIA Earth-2 Weather
Analytics locally, and repeat the three-channel acceptance test.

Do not transfer virtual environments, E2CC `_build` output, containers,
compiled CUDA artifacts, package caches, or shader caches from the Blackwell
workstation.

## Recorded revisions and data

- Project repository: `https://github.com/franzigrkn/thinkingearth_prototype.git`
- Project branch: `e2cc`
- NVIDIA repository: `https://github.com/NVIDIA-Omniverse-blueprints/earth2-weather-analytics.git`
- NVIDIA release 1.1.0 commit: `d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4`
- CSS Storage prefix: `s3://projects/earth_as_a_graph/interactive_prototype/`
- Expected HDF5 SHA-256:
  `891dd6641061ad425c472cc3ec98e11e55fad15c17a1cd0b8be7e509902af436`

The restored exports must contain 42 JPEGs and six JSON files across `q850`,
`q925`, and `q1000`.

## 1. Verify the workstation

The expected machine is Ubuntu 22.04 x86-64 with an RTX 6000 Ada providing
approximately 48 GB of VRAM. Use local NVMe storage for repositories, builds,
environments, and caches; the network home directory may be too small.

```bash
lsb_release -ds
uname -m
nvidia-smi
nvidia-smi -L
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
free -h
df -h /var/tmp
docker --version
git --version
git lfs version
uv --version
s5cmd version
```

Confirm the full RTX 6000 Ada allocation is visible and that it is not an
undersized vGPU or MIG partition. The NVIDIA driver should be `580.105` or
newer. If `uv`, Git LFS, Docker, the NVIDIA Container Toolkit, or `s5cmd` is
missing, install or request it before continuing.

Verify Docker GPU access:

```bash
docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi
```

If Docker reports `unknown or invalid runtime name: nvidia`, configure the
already-installed NVIDIA Container Toolkit and retry:

```bash
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi
```

Do not continue until Docker sees the correct GPU and full memory allocation.

## 2. Create the local-NVMe workspace

Use the following location unless the new workstation provides a different
durable local-NVMe path:

```bash
export E2CC_WORKDIR=/var/tmp/fgerken/e2cc
mkdir -p "$E2CC_WORKDIR"
cd "$E2CC_WORKDIR"
```

## 3. Clone the project

```bash
cd "$E2CC_WORKDIR"
git clone https://github.com/franzigrkn/thinkingearth_prototype.git
cd thinkingearth_prototype
git switch e2cc
git pull --ff-only
git status --short --branch
git rev-parse HEAD
```

The checkout must be on `e2cc` and clean. Record the commit printed by
`git rev-parse HEAD` in the migration notes.

```bash
export PROJECT_ROOT="$E2CC_WORKDIR/thinkingearth_prototype"
```

## 4. Restore the ignored data from CSS Storage

The following commands intentionally run from `check_data`, so the files land
at the paths expected by the project metadata. Ensure the workstation's CSS
Storage credentials permit access to the saved prefix.

```bash
cd "$PROJECT_ROOT/check_data"
mkdir -p e2cc_exports

s5cmd ls "s3://projects/earth_as_a_graph/interactive_prototype/"
s5cmd cp "s3://projects/earth_as_a_graph/interactive_prototype/e2cc_exports/*" e2cc_exports/
s5cmd cp s3://projects/earth_as_a_graph/interactive_prototype/predictions_2018.h5 .
```

Confirm the restored structure and HDF5 checksum:

```bash
find e2cc_exports -type f | sort
find e2cc_exports -type f -name '*.jpg' | wc -l
find e2cc_exports -type f -name '*.json' | wc -l
du -sh predictions_2018.h5 e2cc_exports

printf '%s  %s\n' \
  891dd6641061ad425c472cc3ec98e11e55fad15c17a1cd0b8be7e509902af436 \
  predictions_2018.h5 | sha256sum --check -
```

Expected counts are 42 JPEG files and six JSON files. Verify every JPEG against
the hashes stored in the three manifests:

```bash
python3 - <<'PY'
import hashlib
import json
from pathlib import Path

root = Path("e2cc_exports")
checked = 0
for channel in ("q850", "q925", "q1000"):
    channel_dir = root / channel
    manifest_path = channel_dir / f"{channel}.manifest.json"
    manifest = json.loads(manifest_path.read_text())
    assert manifest["frame_count"] == 7
    for frame in manifest["frames"]:
        for layer in ("prediction", "temporary_reference"):
            entry = frame[layer]
            path = channel_dir / entry["file"]
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            assert digest == entry["sha256"], path
            checked += 1
print(f"PASS: verified {checked} JPEG checksums")
PY
```

Do not commit the restored files; `predictions_2018.h5` and
`check_data/e2cc_exports/` are intentionally ignored by Git.

## 5. Prepare Python, caches, and CUDA 12.8

The pinned dependency set uses PyTorch built for CUDA 12.8, and
`torch-harmonics` compiles CUDA extensions. A newer driver can run the result,
but the build compiler and development headers must be CUDA 12.8.

Install the CUDA 12.8 build packages if they are not already present:

```bash
sudo apt-get update
sudo apt-get install -y cuda-compiler-12-8 cuda-libraries-dev-12-8 ninja-build
```

If those packages are unavailable, the workstation administrator must enable
the NVIDIA CUDA package repository for Ubuntu 22.04 first.

Install an isolated Python 3.12 bootstrap environment and place all package
caches on local NVMe:

```bash
export E2CC_WORKDIR=/var/tmp/fgerken/e2cc
export PROJECT_ROOT="$E2CC_WORKDIR/thinkingearth_prototype"
export UV_PYTHON_INSTALL_DIR="$E2CC_WORKDIR/.uv-python"
export UV_CACHE_DIR="$E2CC_WORKDIR/.uv-cache"
export XDG_CACHE_HOME="$E2CC_WORKDIR/.cache"
export PIP_CACHE_DIR="$E2CC_WORKDIR/.cache/pip"

mkdir -p "$UV_CACHE_DIR" "$XDG_CACHE_HOME" "$PIP_CACHE_DIR"

uv python install 3.12
uv venv --python 3.12 "$E2CC_WORKDIR/bootstrap"

export UV_PYTHON="$E2CC_WORKDIR/bootstrap/bin/python3"
export CUDA_HOME=/usr/local/cuda-12.8
export PATH="$CUDA_HOME/bin:$E2CC_WORKDIR/bootstrap/bin:$PATH"

if test -n "${LD_LIBRARY_PATH:-}"; then
  export LD_LIBRARY_PATH="$CUDA_HOME/lib64:$LD_LIBRARY_PATH"
else
  export LD_LIBRARY_PATH="$CUDA_HOME/lib64"
fi

unset VIRTUAL_ENV

python3 --version
nvcc --version
uv cache dir
test -f "$CUDA_HOME/include/cusparse.h" && echo "PASS: CUDA 12.8 headers present"
```

Expected results are Python 3.12.x, CUDA compiler 12.8, and a uv cache below
`$E2CC_WORKDIR`.

Kit can also fill a small network-home filesystem with shader data. If
`${HOME}/.cache/ov` does not already exist, put it on local NVMe:

```bash
mkdir -p "$E2CC_WORKDIR/ov-cache" "${HOME}/.cache"
if test ! -e "${HOME}/.cache/ov"; then
  ln -s "$E2CC_WORKDIR/ov-cache" "${HOME}/.cache/ov"
else
  ls -ld "${HOME}/.cache/ov"
fi
```

Do not replace or delete an existing cache path without inspecting it first.

Run the environment block in this section again in every new shell used for
setup or rebuilding.

## 6. Clone and pin NVIDIA Earth-2 Weather Analytics

```bash
cd "$E2CC_WORKDIR"
git lfs install
git clone https://github.com/NVIDIA-Omniverse-blueprints/earth2-weather-analytics.git
cd earth2-weather-analytics
git switch --detach d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4
git lfs pull
git rev-parse HEAD
git status --short --branch
```

The printed commit must be
`d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4`, and the checkout must be clean.

Validate that the preserved compatibility overlay can be applied, without
changing the checkout:

```bash
cd "$PROJECT_ROOT"
./scripts/setup_e2cc.sh --check-only --compatibility \
  "$E2CC_WORKDIR/earth2-weather-analytics"
```

### Patch policy for the Ada machine

First build and test the clean pinned NVIDIA checkout. The RTX 6000 Ada may not
need the Blackwell/R595 compatibility changes. If the stock Kit 109.0.2 build
is unsuitable, or the extension registry fails, check `git status --short` in
the NVIDIA checkout. If it is still clean, apply the compatibility overlay
before rebuilding:

```bash
cd "$PROJECT_ROOT"
./scripts/setup_e2cc.sh --compatibility \
  "$E2CC_WORKDIR/earth2-weather-analytics"
```

If the failed setup changed tracked or untracked source files, make a fresh
checkout at the pinned commit rather than deleting or resetting files whose
purpose is unclear, then apply the compatibility overlay to that clean clone.

Do not initially apply `--deduplicate-loads` or `--no-loop`. They are optional
behavior changes and did not fix the RealVNC artifact. Use `--all` only when an
exact reproduction of the final Blackwell source diff is explicitly needed.

## 7. Build E2CC

Confirm the environment from Section 5 is active, then run:

```bash
cd "$E2CC_WORKDIR/earth2-weather-analytics"
python3 --version
nvcc --version
uv cache dir
./setup.sh
```

The setup builds Earth-2 Federation wheels and CUDA extensions, the E2CC
release application, and the notebook environment. The first build is large;
do not interrupt it while compilation is active.

If only the Federation dependency stage fails, isolate and retry it with:

```bash
cd "$E2CC_WORKDIR/earth2-weather-analytics/earth-2-federation"
uv sync --all-extras --dev
cd "$E2CC_WORKDIR/earth2-weather-analytics"
./setup.sh
```

If an interrupted download leaves corrupt wheel metadata, clear only the
affected package from the local uv cache and rerun setup. For the package that
failed on the first workstation, the targeted command was:

```bash
UV_CACHE_DIR="$E2CC_WORKDIR/.uv-cache" \
  uv cache clean nvidia-cuda-nvrtc-cu12
```

## 8. Validate the build

```bash
cd "$E2CC_WORKDIR/earth2-weather-analytics"

git rev-parse HEAD
earth-2-federation/.venv/bin/python --version
UV_CACHE_DIR="$E2CC_WORKDIR/.uv-cache" \
  uv pip check --python earth-2-federation/.venv/bin/python
find earth-2-federation/dist -maxdepth 1 -type f -name '*.whl' -print
.venv-notebook/bin/python --version

test -x \
  earth-2-command-center/_build/linux-x86_64/release/omni.earth_2_command_center.app.sh \
  && echo "PASS: E2CC build complete"

docker run --rm --runtime=nvidia --gpus all ubuntu \
  nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
```

Both Python environments should report 3.12.x, `uv pip check` should report no
incompatibilities, Federation wheels should exist, and the release launcher
must be executable.

## 9. Connect with RealVNC from the Mac

The new hostname is not known yet. Replace `NEW_WORKSTATION_HOST` below with
the assigned hostname. On the Mac, create an SSH tunnel and keep its terminal
open:

```bash
ssh -N -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:5901:127.0.0.1:5900 \
  fgerken@NEW_WORKSTATION_HOST
```

In another Mac terminal, verify it:

```bash
nc -vz 127.0.0.1 5901
```

Connect RealVNC Viewer to `127.0.0.1::5901`. In the connection properties set:

- **Picture quality:** High
- **PreferredEncoding:** ZRLE

Do not use Automatic quality when judging E2CC. It caused posterization, black
sectors, and blurred text even though E2CC was rendering correctly. Do not
expose VNC port 5900 publicly.

If Mac clipboard paste is unavailable, set RealVNC Expert option
`ClipboardKeystrokesEnable=1`, then use **Fn+F8 → Send clipboard as
keystrokes**.

## 10. Launch E2CC from the graphical desktop

Open a terminal inside the RealVNC desktop. Do not launch the GUI from a plain
SSH shell. Confirm the graphical display and start E2CC from the NVIDIA
repository root:

```bash
echo "$DISPLAY"
cd /var/tmp/fgerken/e2cc/earth2-weather-analytics
./earth-2-command-center/_build/linux-x86_64/release/omni.earth_2_command_center.app.sh
```

`DISPLAY` must be nonempty. Allow several minutes for first-run shader
compilation; an initially grey viewport is not necessarily a crash.

To watch the newest Kit log from a separate SSH shell:

```bash
tail -f "$(ls -1t ~/.nvidia-omniverse/logs/Kit/omni.earth_2_command_center.app/0.0/kit_*.log | head -1)"
```

## 11. Run the acceptance test

First verify that the built-in Base Satellite is smooth and that ordinary UI
text remains sharp while toggling Sun, Atmosphere, Headlight, and other
lighting controls.

Then use **Add features from metadata file** and load these files one at a
time:

```text
/var/tmp/fgerken/e2cc/thinkingearth_prototype/check_data/e2cc_exports/q850/q850.e2cc.json
/var/tmp/fgerken/e2cc/thinkingearth_prototype/check_data/e2cc_exports/q925/q925.e2cc.json
/var/tmp/fgerken/e2cc/thinkingearth_prototype/check_data/e2cc_exports/q1000/q1000.e2cc.json
```

For every channel:

1. Confirm prediction and temporary-reference layers appear.
2. Check north/south orientation and longitude alignment.
3. Check the date-line seam.
4. Inspect the first, middle, and final frames.
5. Play and scrub all seven six-hourly timestamps several times.
6. Toggle the two layers and inspect the colormap behavior.
7. Check the Kit log for missing files, non-JPEG paths, decoder failures, GPU
   errors, device loss, or Xid events.

The migration is accepted when the Base Satellite and all three project
datasets remain stable through repeated playback and the log contains no real
loader, decoder, or GPU failure.

Remember that the temporary-reference layer is lead-0 model output, not ERA5
ground truth.

## 12. Record the completed migration

After acceptance, record:

```bash
cd "$PROJECT_ROOT"
git rev-parse HEAD

cd "$E2CC_WORKDIR/earth2-weather-analytics"
git rev-parse HEAD
git status --short

nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
python3 --version
nvcc --version
```

Also record whether the stock NVIDIA checkout or the compatibility overlay was
used. Do not commit the restored HDF5, generated exports, build products,
environments, or caches.

## Troubleshooting reference

- **Python is not 3.12:** re-export `UV_PYTHON`, prepend the bootstrap `bin`
  directory to `PATH`, and `unset VIRTUAL_ENV`.
- **CUDA mismatch:** confirm `nvcc --version` reports 12.8 and
  `CUDA_HOME=/usr/local/cuda-12.8`.
- **`cusparse.h` missing:** install `cuda-libraries-dev-12-8`.
- **Home filesystem fills:** confirm uv, XDG, pip, and Omniverse caches point to
  local NVMe.
- **No E2CC window:** launch from a terminal inside the RealVNC desktop and
  confirm `DISPLAY` is nonempty.
- **Grey first launch:** wait for shader compilation and inspect the Kit log.
- **Metadata loads but textures do not:** confirm metadata paths end in `.jpg`;
  release 1.1.0 rejects PNG timestamp sequences.
- **Wedges, bands, black sectors, or blurry UI:** if the Base Satellite and UI
  are also affected, set RealVNC to High quality and ZRLE before debugging
  E2CC.
