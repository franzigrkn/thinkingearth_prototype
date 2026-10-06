# E2CC Workstation Setup Record

## Purpose and current status

This document records the complete workstation preparation needed to build NVIDIA Earth-2 Weather Analytics for the Thinking Earth prototype. It captures the issues found on the first RTX PRO 6000 Blackwell workstation so the environment can be recreated cleanly on the RTX 6000 Ada workstation.

Pinned NVIDIA release 1.1.0:

~~~text
d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4
~~~

Setup completed after the prerequisites below were corrected. E2CC was launched successfully, completed its first-run shader compilation, and rendered the default globe. The original PNG timestamp sequences were rejected by E2CC's JPEG-only sequence decoder, so all three project exports were regenerated as baseline grayscale JPEGs. Live validation is now complete: `q850`, `q925`, and `q1000` all load and run through their timelines correctly when RealVNC uses **Picture quality: High** and **PreferredEncoding: ZRLE**.

## Verified first-workstation environment

- Ubuntu 22.04.5 LTS, x86-64
- NVIDIA RTX PRO 6000 Blackwell Server Edition
- 97,887 MiB GPU memory, with MIG disabled
- NVIDIA driver 595.91.07
- Driver-reported CUDA capability 13.2
- Initially installed CUDA toolkit/compiler 13.4
- Additional CUDA 12.8 build toolkit installed side by side
- 16 physical CPU cores and 32 logical CPUs
- 250 GiB system RAM
- 2.9 TB local NVMe
- Docker 29.8.2
- NVIDIA Container Toolkit 1.20.1
- Git LFS 3.0.2
- uv 0.12.22
- uv-managed Python 3.12.15

The machine also had a root-owned Conda base environment with Python 3.14.7 first in PATH. Python 3.14 is not suitable for this pinned build.

## 1. Use local NVMe storage

The first workstation had a 5 GB NFS home directory. It was too small for the repository, Python packages, and download caches.

~~~bash
export E2CC_WORKDIR=/var/tmp/fgerken/e2cc
mkdir -p "$E2CC_WORKDIR"
~~~

The first installation used /var/tmp because it was local and writable. It may be cleaned according to workstation policy. On the next workstation, prefer a durable, user-writable local-NVMe directory when available, and substitute it consistently for E2CC_WORKDIR.

Do not build under /home/fgerken unless its quota is increased substantially.

## 2. Configure Docker GPU access

The NVIDIA Container Toolkit was installed, but Docker initially did not register the nvidia runtime. The NVIDIA test failed with:

~~~text
unknown or invalid runtime name: nvidia
~~~

Configure it and restart Docker:

~~~bash
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
~~~

Validate GPU access:

~~~bash
docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi
~~~

Do not continue until the expected GPU and full memory allocation appear inside the container.

## 3. Install and select Python 3.12

Do not replace Ubuntu's system Python or modify the root-owned Conda base environment. Install a uv-managed Python and bootstrap environment on local NVMe:

~~~bash
export E2CC_WORKDIR=/var/tmp/fgerken/e2cc
export UV_PYTHON_INSTALL_DIR="$E2CC_WORKDIR/.uv-python"

uv python install 3.12
uv venv --python 3.12 "$E2CC_WORKDIR/bootstrap"
~~~

Force NVIDIA's scripts and uv to use it:

~~~bash
export UV_PYTHON="$E2CC_WORKDIR/bootstrap/bin/python3"
export PATH="$E2CC_WORKDIR/bootstrap/bin:$PATH"
unset VIRTUAL_ENV

python3 --version
~~~

The result must be Python 3.12.x. UV_PYTHON is important: merely activating the external bootstrap environment is insufficient because uv sync can ignore an active environment whose location differs from the project .venv.

## 4. Relocate caches from the home directory

Set these variables before installing dependencies:

~~~bash
export E2CC_WORKDIR=/var/tmp/fgerken/e2cc
export UV_CACHE_DIR="$E2CC_WORKDIR/.uv-cache"
export XDG_CACHE_HOME="$E2CC_WORKDIR/.cache"
export PIP_CACHE_DIR="$E2CC_WORKDIR/.cache/pip"

mkdir -p "$UV_CACHE_DIR" "$XDG_CACHE_HOME" "$PIP_CACHE_DIR"
uv cache dir
~~~

uv cache dir must show the local-NVMe location, not /home/fgerken/.cache/uv.

The first attempt filled the NFS home directory while extracting pyarrow. If that happens again, clear the disposable old cache:

~~~bash
uv cache clean --cache-dir /home/fgerken/.cache/uv
df -h /home/fgerken "$E2CC_WORKDIR"
~~~

The full-disk failure also left a corrupt nvidia-cuda-nvrtc-cu12 extraction with an empty METADATA file. Its targeted repair was:

~~~bash
UV_CACHE_DIR="$E2CC_WORKDIR/.uv-cache" \
uv cache clean nvidia-cuda-nvrtc-cu12
~~~

The small home quota later also filled while Kit wrote its Omniverse shader
cache. Preserve the failed cache only for diagnostics and put the active
Omniverse cache on local storage. On the first workstation,
`/home/fgerken/.cache/ov` was replaced by a symlink to:

~~~text
/var/tmp/fgerken/e2cc/ov-cache-kit10905-clean
~~~

This cache relocation prevents another home-quota failure. It did not resolve
the apparent posterized display; that symptom was ultimately caused by RealVNC
automatic picture quality.

## 5. Install the matching CUDA 12.8 build toolchain

The pinned dependencies resolve to PyTorch 2.10.0+cu128. torch-harmonics 0.8.0 compiles custom CUDA extensions and rejects the workstation's CUDA 13.4 compiler because PyTorch was built with CUDA 12.8.

Keep the existing driver and CUDA 13.4 installation. Install CUDA 12.8 side by side:

~~~bash
sudo apt-get update
sudo apt-get install cuda-compiler-12-8 cuda-libraries-dev-12-8
~~~

cuda-compiler-12-8 supplies the matching compiler. cuda-libraries-dev-12-8 is also required because PyTorch includes CUDA headers such as cusparse.h, cublas_v2.h, and cusolverDn.h.

Ninja is optional but accelerates CUDA-extension compilation:

~~~bash
sudo apt-get install ninja-build
~~~

Select CUDA 12.8 for this build without changing the system-wide /usr/local/cuda alternative:

~~~bash
export CUDA_HOME=/usr/local/cuda-12.8
export PATH="$CUDA_HOME/bin:$E2CC_WORKDIR/bootstrap/bin:$PATH"

if test -n "$LD_LIBRARY_PATH"; then
  export LD_LIBRARY_PATH="$CUDA_HOME/lib64:$LD_LIBRARY_PATH"
else
  export LD_LIBRARY_PATH="$CUDA_HOME/lib64"
fi

nvcc --version
test -f "$CUDA_HOME/include/cusparse.h" && echo "CUDA 12.8 headers present"
~~~

nvcc must report CUDA 12.8. Driver 595.91.07 can run CUDA 12.8 applications, so the driver does not need to be downgraded and CUDA 13.4 does not need to be removed.

## 6. Clone and pin the NVIDIA repository

Keep the NVIDIA repository separate from thinkingearth_prototype:

~~~bash
export E2CC_WORKDIR=/var/tmp/fgerken/e2cc
cd "$E2CC_WORKDIR"

git lfs install
git clone https://github.com/NVIDIA-Omniverse-blueprints/earth2-weather-analytics.git
cd earth2-weather-analytics
git switch --detach d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4
git lfs pull
git rev-parse HEAD
git status --short --branch
~~~

The commit printed by git rev-parse must be:

~~~text
d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4
~~~

The first workstation remained on main, but main pointed to this commit. Detaching explicitly makes the next build reproducible if upstream main moves.

## 7. Environment block for every setup shell

Run this block in every new shell used for setup:

~~~bash
export E2CC_WORKDIR=/var/tmp/fgerken/e2cc

export UV_PYTHON_INSTALL_DIR="$E2CC_WORKDIR/.uv-python"
export UV_PYTHON="$E2CC_WORKDIR/bootstrap/bin/python3"
export UV_CACHE_DIR="$E2CC_WORKDIR/.uv-cache"
export XDG_CACHE_HOME="$E2CC_WORKDIR/.cache"
export PIP_CACHE_DIR="$E2CC_WORKDIR/.cache/pip"

export CUDA_HOME=/usr/local/cuda-12.8
export PATH="$CUDA_HOME/bin:$E2CC_WORKDIR/bootstrap/bin:$PATH"

if test -n "$LD_LIBRARY_PATH"; then
  export LD_LIBRARY_PATH="$CUDA_HOME/lib64:$LD_LIBRARY_PATH"
else
  export LD_LIBRARY_PATH="$CUDA_HOME/lib64"
fi

unset VIRTUAL_ENV

python3 --version
nvcc --version
uv cache dir
~~~

Expected results:

- Python 3.12.x
- CUDA compiler 12.8
- uv cache under E2CC_WORKDIR

## 8. Build the reference application

From the NVIDIA repository root:

~~~bash
cd "$E2CC_WORKDIR/earth2-weather-analytics"
./setup.sh
~~~

The setup stages are:

1. Synchronize Earth-2 Federation dependencies and generate/build the full and API-only wheels.
2. Build the Earth-2 Command Center release application.
3. Create .venv-notebook and install notebook requirements.

The first dependency build is large and compiles torch-harmonics CUDA extensions. Keep the CUDA 12.8 and cache variables set for the entire setup run.

To isolate a failure in the first stage:

~~~bash
cd "$E2CC_WORKDIR/earth2-weather-analytics/earth-2-federation"
uv sync --all-extras --dev
~~~

After that succeeds, return to the repository root and rerun setup.sh. Completed downloads and builds are reused.

## 9. Errors encountered and their fixes

### python3 reports 3.14.7

Cause: the root-owned Conda base environment is first in PATH.

Fix: set UV_PYTHON and prepend the bootstrap bin directory. Do not alter the system Python.

### VIRTUAL_ENV does not match the project .venv

This warning means uv is creating the project-local environment. unset VIRTUAL_ENV removes the warning, while UV_PYTHON forces Python 3.12.

### No space left under /home/fgerken/.cache/uv

Cause: the 5 GB NFS home filesystem is too small.

Fix: move UV_CACHE_DIR, XDG_CACHE_HOME, and PIP_CACHE_DIR to local NVMe and clear the old cache.

### Wheel metadata field Name not found

Cause: extraction was interrupted by the full home filesystem. The cached nvidia-cuda-nvrtc-cu12 METADATA file was empty.

Fix:

~~~bash
UV_CACHE_DIR="$E2CC_WORKDIR/.uv-cache" \
uv cache clean nvidia-cuda-nvrtc-cu12
~~~

### Detected CUDA 13.4 mismatches PyTorch CUDA 12.8

Cause: torch-harmonics used CUDA 13.4 nvcc with PyTorch +cu128.

Fix: install the CUDA 12.8 compiler and export CUDA_HOME=/usr/local/cuda-12.8.

### fatal error: cusparse.h: No such file or directory

Cause: cuda-compiler-12-8 does not include all CUDA library development headers.

Fix:

~~~bash
sudo apt-get install cuda-libraries-dev-12-8
~~~

Warnings about deprecated pynvml, license classifiers, or Ninja being unavailable were not the cause of these failures.

## 10. Validate the completed installation

From the NVIDIA repository root:

~~~bash
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
~~~

Expected results:

- Git reports the pinned Release 1.1.0 commit.
- Both Python environments report 3.12.x.
- uv pip check reports no incompatibilities.
- The federation dist directory contains the full and API-only wheels.
- The E2CC release launcher exists and is executable.
- Docker sees the expected GPU and full GPU memory.

uv-managed environments do not necessarily include pip. Use uv pip check --python rather than python -m pip check for the federation environment.

## 11. Launch and visually validate E2CC

Launch from the NVIDIA repository root because the application resolves workspace paths relative to its working directory:

~~~bash
cd "$E2CC_WORKDIR/earth2-weather-analytics"
./earth-2-command-center/_build/linux-x86_64/release/omni.earth_2_command_center.app.sh
~~~

The first launch may take several minutes while shaders compile. Confirm that the application opens and the interactive blue-marble globe renders.

Then choose Add features from metadata file and open the q850 metadata from the thinkingearth_prototype checkout:

~~~text
check_data/e2cc_exports/q850/q850.e2cc.json
~~~

The first import attempt failed with `TypeError: argument should be a str or an os.PathLike object ... not 'list'`. The exporter had emitted a one-item path list for every timestamp. E2CC release 1.1.0 expects a path string for each timestamp in a non-mosaic `latlong` sequence. `scripts/export_e2cc.py` and the current metadata were corrected, and the file loaded successfully on 2026-10-05.

The first generated frames were PNGs. Their metadata and timelines loaded, but
the Kit log reported `Trying to load a non-jpeg through the jpeg decoder`.
Release 1.1.0's timestamped sequence only loads JPEG paths. The exporter was
corrected and all three channels now use `1440 x 721`, quality-99, baseline
grayscale JPEGs with string paths.

E2CC was also repinned and rebuilt from Kit 109.0.2 to Kit 109.0.5 because
NVIDIA requires at least 109.0.5 for the R595 Blackwell path. Keep that upgrade
as a valid compatibility correction, but do not describe it as the fix for the
later posterized display. The same apparent corruption affected the built-in
Base Satellite and timeline text, could recover while E2CC was untouched, and
was triggered by large redraws such as timeline playback or toggling the Sun.
E2CC logged no matching renderer or texture error, GPU memory remained ample,
and the GPU reported no ECC or Xid fault.

The final cause was RealVNC's automatic adaptive picture quality. In the
RealVNC connection properties, set:

- **Picture quality:** High
- **PreferredEncoding:** ZRLE

With those settings the built-in globe remains stable and `q850`, `q925`, and
`q1000` all load and run correctly through their timelines. The temporary
Dynamic Texture synchronization experiment was reverted to the stock
`dt.sync = False` setting.

Verify orientation, longitude wrapping, all seven timestamps, prediction/reference toggles, colormap behavior, and animation.

## 12. Handoff to the RTX 6000 Ada workstation

Preserve:

- NVIDIA commit d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4
- This setup document
- Final nvidia-smi output
- Any additional package or error discovered after this note
- The ignored predictions_2018.h5 and check_data/e2cc_exports assets
- Export manifests and checksums
- The required RealVNC High-quality/ZRLE connection settings

Do not transfer _build, .venv, .venv-notebook, the bootstrap environment, CUDA-extension artifacts, shader caches, or the uv cache. Create a clean local-NVMe directory, clone the pinned sources, install the matching prerequisites, and rebuild.

Repeat the Docker GPU test and all final validation and visual checks independently on the Ada workstation.
