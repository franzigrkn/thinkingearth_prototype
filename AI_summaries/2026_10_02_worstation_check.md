# E2CC Workstation Verification

## Workstation schedule

- **2026-10-02 through 2026-10-08:** RTX PRO 6000 Blackwell Server Edition.
- **From 2026-10-11 onward:** RTX 6000 Ada.
- Repeat this checklist on both machines. Build E2CC independently on each machine.

## Expected environment

- Ubuntu 22.04 x86-64
- Full RTX GPU allocation: 96 GB on the Blackwell Server Edition; 48 GB on the RTX 6000 Ada
- At least 64 GB system RAM
- At least 128 GB NVMe storage available; 250 GB is preferable for builds and assets
- NVIDIA driver `580.105` or newer and CUDA 13.0
- Docker, NVIDIA Container Toolkit, Git LFS, Python 3.12, and `uv`

## 0. Get the project and data

For a new checkout:

```bash
git clone https://github.com/franzigrkn/thinkingearth_prototype.git
cd thinkingearth_prototype
git switch e2cc
```

For an existing checkout:

```bash
git fetch origin
git switch e2cc
git pull --ff-only
```

Confirm that `git status` reports branch `e2cc`. The source HDF5 and generated E2CC exports are ignored by Git. Transfer `check_data/predictions_2018.h5` and `check_data/e2cc_exports/q850/` separately, or transfer the HDF5 file and regenerate the export.

## 1. Verify the machine

```bash
lsb_release -ds
uname -m
nvidia-smi
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
free -h
df -h
docker --version
git lfs version
python3.12 --version
uv --version
```

Confirm that `nvidia-smi` shows the expected GPU and the full assigned memory, not a smaller vGPU or MIG partition.

## 2. Verify GPU access from Docker

```bash
docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi
```

Do not continue until the GPU is visible inside the container.

## 3. Build the NVIDIA reference application

Keep it separate from `thinkingearth_prototype`:

```bash
git lfs install
git clone https://github.com/NVIDIA-Omniverse-blueprints/earth2-weather-analytics.git
cd earth2-weather-analytics
git rev-parse HEAD
./setup.sh
```

Record the printed commit so the same version can be checked out on the second workstation.

## 4. Launch unmodified E2CC

From the NVIDIA repository root:

```bash
./earth-2-command-center/_build/linux-x86_64/release/omni.earth_2_command_center.app.sh
```

The first launch may take several minutes while shaders compile. Confirm that the application opens and the interactive globe renders before adding project data.

## 5. Test the first project layer

In E2CC, select **Add features from metadata file** and open:

```text
check_data/e2cc_exports/q850/q850.e2cc.json
```

Verify:

- Prediction appears with correct north/south orientation and longitude alignment
- No incorrect date-line seam appears
- All seven timestamps appear on the timeline
- Prediction and temporary-reference layers can be toggled
- Colormap and animation work

Record startup, extension, texture, and visual-orientation problems before changing the exporter.

## 6. Handoff before 2026-10-08 ends

- Commit and push all portable changes on `e2cc`.
- Record the NVIDIA repository commit, `nvidia-smi` output, and any manual setup changes.
- Copy the ignored HDF5/export directories to durable storage and retain their manifests/checksums.
- Do not rely on copied `_build` output, virtual environments, containers, or shader caches.

## 7. Rebuild on the RTX 6000 Ada from 2026-10-11

- Clone or update both repositories to the recorded commits.
- Repeat Steps 1 and 2, then rerun `./setup.sh`.
- Transfer or regenerate the project data and verify its manifest.
- Repeat the E2CC launch and all `q850` visual checks.

The Ada GPU is explicitly recommended by NVIDIA for this blueprint and meets E2CC's 48 GB VRAM requirement. Expect a clean rebuild and potentially lower headroom than the 96 GB Blackwell machine, but no project-code or data-format changes.

## Official references

- [Earth-2 Weather Analytics quickstart and requirements](https://github.com/NVIDIA-Omniverse-blueprints/earth2-weather-analytics/blob/main/docs/01_quickstart.md)
- [RTX PRO 6000 Blackwell Server Edition specifications](https://www.nvidia.com/en-us/data-center/rtx-pro-6000-blackwell-server-edition/)
- [RTX 6000 Ada specifications](https://www.nvidia.com/en-eu/products/workstations/rtx-6000/)
