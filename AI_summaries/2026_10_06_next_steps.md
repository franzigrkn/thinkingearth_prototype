# Next Steps After E2CC Export Validation

## Current status as of 2026-10-06

- E2CC release 1.1.0 is running successfully on the current Blackwell workstation.
- The metadata schema and image format issues have been corrected:
  - Non-mosaic timestamped `sources` use one string per timestamp.
  - Exported frames are quality-99 baseline grayscale JPEGs at `1440x721`.
- The `q850`, `q925`, and `q1000` metadata files all load successfully and their timelines play correctly in E2CC.
- The apparent posterization, black sectors, unreadable timeline text, and delayed visual collapse were RealVNC display artifacts, not corrupted exported data or an E2CC texture failure.
- The stable RealVNC settings are:
  - **Picture quality:** `High`
  - **PreferredEncoding:** `ZRLE`
- Kit 109.0.5 remains useful compatibility hardening for the current Blackwell/R595 environment, but it was not the fix for the visual collapse.
- The Dynamic Texture synchronization experiment was reverted; E2CC is using its normal `dt.sync=False` behavior.

## Immediate priority: preserve the validated state

The current working configuration must be made portable before moving to the new workstation.

### 1. Package the local E2CC changes

- Record the upstream E2CC base commit:
  - `d4cea36cffed7c9143cf8b8c5ae5e6ae237cfed4`
- Review the eight modified files in the local E2CC checkout.
- Export the modifications as a patch stored in this project, or commit them to a dedicated E2CC fork/branch.
- Include short application instructions and the expected E2CC base commit.
- Preserve the changes before removing the checkout under `/var/tmp/fgerken/e2cc`.

The portable changes currently include:

- Kit 109.0.5 version pins.
- HTTPS registry URLs.
- Protection against duplicate asynchronous decoding of the same timestamped image.
- Timeline looping disabled by default after startup and metadata import.

### 2. Commit the project changes

- Review the changes to the E2CC exporter, export documentation, and project summaries.
- Run the exporter validation checks once more.
- Commit the portable changes on the project `e2cc` branch.
- Push the branch to durable remote storage before the current workstation is retired.
- Do not commit generated HDF5 data, JPEG exports, build products, environments, or caches.

### 3. Preserve the ignored data separately

Copy the following to durable storage:

- `check_data/predictions_2018.h5`
- `check_data/e2cc_exports/q850/`
- `check_data/e2cc_exports/q925/`
- `check_data/e2cc_exports/q1000/`

Preserve the complete export directories, including metadata and manifests. Verify the copies after transfer using the existing manifests and this HDF5 checksum:

```text
predictions_2018.h5
SHA-256: 891dd6641061ad425c472cc3ec98e11e55fad15c17a1cd0b8be7e509902af436
```

### 4. Preserve the operating notes

The workstation handoff must explicitly record:

- The E2CC/NVIDIA base commit and local patch.
- The required RealVNC `High` plus `ZRLE` settings.
- The metadata-file locations and expected directory structure.
- Driver, CUDA toolkit, Kit, and Python versions used by the working installation.
- Any cache redirections used to keep large E2CC files off constrained home storage.

## New-workstation setup

### 5. Perform a clean installation

- Clone the project and NVIDIA repositories from their durable remotes.
- Check out the recorded revisions.
- Apply the saved E2CC patch.
- Run E2CC setup and build steps again on the new machine.
- Keep the source, data, build, and cache directories on suitable local storage.
- Configure RealVNC with `High` picture quality and `ZRLE` before evaluating rendering quality.

Do **not** copy these machine-specific artifacts from the Blackwell workstation:

- Python virtual environments.
- E2CC `_build` output.
- Kit or shader caches.
- Package-manager caches.
- Compiled Python files.

### 6. Run the acceptance test

Test the new installation in this order:

1. Launch E2CC and verify the base satellite while the application is idle.
2. Toggle Sun, Atmosphere, Headlight, and other lighting controls.
3. Check that the timeline and ordinary UI text remain sharp in RealVNC.
4. Load `q850.e2cc.json` and play and scrub its timeline several times.
5. Repeat for `q925.e2cc.json` and `q1000.e2cc.json`.
6. Inspect the first, middle, and final timestamps for every layer.
7. Check the terminal for missing files, rejected suffixes, decoder failures, or GPU errors.
8. Compare representative frames with the source HDF5 values and export manifests.

The migration is complete when the base satellite and all three metadata exports remain stable through repeated playback without genuine loader or decoder errors.

## Development after migration

### 7. Improve the E2CC viewer

- Present the model as **Earth as a Graph**, while retaining the complete checkpoint identifier in metadata.
- Improve variable, layer, unit, and timestamp labels.
- Use consistent physical value ranges when comparing pressure levels and future targets.
- Add clear legends for predictions, temporary references, ERA5 targets, and future error layers.
- Decide whether the three pressure levels should be separate metadata imports or part of one combined reviewer experience.

### 8. Improve the scientific comparison

- Add more variables and test-year timestamps when new HDF5 outputs are available.
- Replace the temporary lead-0 reference images with actual ERA5 ground truth.
- Add signed and/or absolute prediction-error layers.
- Add automated numerical checks for orientation, longitude wrapping, ranges, missing values, and timestamp alignment.

### 9. Add browser streaming

- Enable local E2CC WebRTC streaming.
- Test first in a browser on the workstation.
- Test from a second machine on the company network.
- Initially support one independent E2CC session on one GPU.

### 10. Prepare the reviewer deployment

- Select an approved public GPU host.
- Configure HTTPS, authentication, WebRTC/TURN networking, and abandoned-session cleanup.
- Link or embed the streaming client from the existing Flask website.
- Add additional GPU-backed sessions only if concurrent independent reviewers are required.
- Provide a short recording or static fallback for networks that block WebRTC.

## Recommended execution order

1. Package the external E2CC changes.
2. Review, validate, commit, and push the project changes.
3. Copy and verify the ignored HDF5 and E2CC export data.
4. Rebuild and validate E2CC on the new workstation.
5. Customize the viewer and scientific comparison layers.
6. Add browser streaming and prepare the reviewer deployment.

No further debugging of the former visual-collapse symptom is currently required unless it also appears with RealVNC fixed to `High` and `ZRLE`.
