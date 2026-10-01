# E2CC Workstation Verification

## Expected environment

- Ubuntu 22.04 x86-64
- NVIDIA RTX GPU with at least 48 GB assigned VRAM
- At least 64 GB RAM
- At least 250 GB available storage
- NVIDIA driver `580.105` or newer
- Docker, NVIDIA Container Toolkit, Git LFS, Python 3.12, and `uv`

## 1. Verify the machine

Run:

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

Confirm that `nvidia-smi` shows the expected GPU and the full assigned memory, not a smaller vGPU partition.

## 2. Verify GPU access from Docker

```bash
docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi
```

Do not continue until the GPU is visible inside the container.

## 3. Build the NVIDIA reference application

```bash
git lfs install
git clone https://github.com/NVIDIA-Omniverse-blueprints/earth2-weather-analytics.git
cd earth2-weather-analytics
./setup.sh
```

Keep this repository separate from `thinkingearth_prototype`.

## 4. Launch unmodified E2CC

From the Earth-2 repository root:

```bash
./earth-2-command-center/_build/linux-x86_64/release/omni.earth_2_command_center.app.sh
```

The first launch may take several minutes while shaders compile. Confirm that the application opens and the interactive globe renders before adding project data.

## 5. Test the first project layer

Copy the complete `check_data/e2cc_exports/q850/` directory to the workstation. Generated exports are not stored in Git.

In E2CC, select **Add features from metadata file** and open:

```text
q850/q850.e2cc.json
```

Verify:

- The prediction layer appears on the globe
- North/south orientation is correct
- Longitude alignment and the date-line seam are correct
- All seven timestamps appear on the timeline
- Prediction and temporary-reference layers can be toggled
- The colormap and animation work

Record any startup errors, missing extensions, texture-loading errors, or visual orientation problems before changing the exporter.
