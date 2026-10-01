# E2CC Roadmap

## Workstation timeline

- Develop first on the RTX PRO 6000 Blackwell Server Edition from **2026-10-02 through 2026-10-08**.
- Preserve all source, data, checksums, commits, and setup notes before that lease ends.
- Resume on the RTX 6000 Ada from **2026-10-11 onward**, using clean clones and a fresh E2CC build.

## 1. Validate E2CC on Blackwell

- Clone the pushed `e2cc` branch and transfer or regenerate the ignored project data.
- Verify OS, full GPU allocation, driver, memory, storage, Docker GPU access, and required tools.
- Clone, build, and launch the unmodified NVIDIA Earth-2 Command Center application.

## 2. Validate the first `q850` export

- Import `q850.e2cc.json` into E2CC.
- Check texture orientation, longitude wrapping, colormap support, layer toggling, and timeline playback.
- Adjust `flip_u`, `flip_v`, longitude handling, or image format only if the E2CC test demonstrates a problem.

## 3. Complete the Blackwell-to-Ada handoff

- Commit and push all portable changes by 2026-10-08.
- Record the exact NVIDIA repository commit and machine diagnostics.
- Transfer the ignored HDF5/export data through durable storage.
- On the Ada machine, rerun setup and validation; do not copy Blackwell build output, environments, or caches.

## 4. Complete the data layers

- Export and validate `q925` and `q1000` after `q850` passes.
- Add additional variables and test-year timestamps when new HDF5 data becomes available.
- Replace the temporary lead-0 model reference with actual ERA5 ground truth later.
- Add signed or absolute error layers once true targets are available.

## 5. Customize the E2CC viewer

- Present the model as `Earth as a Graph`, retaining the full checkpoint identifier in metadata.
- Provide clear variable, layer, unit, and timestamp controls.
- Use consistent physical color ranges for comparisons.
- Add a legend that clearly distinguishes predictions, temporary references, and eventual ERA5 targets.

## 6. Add browser streaming

- Enable local E2CC WebRTC streaming.
- Test from a browser on the workstation and then from another machine on the company network.
- Keep the first deployment to one independent session on one GPU.

## 7. Publish the reviewer experience

- Package E2CC and its static visualization assets for an approved public GPU host.
- Configure HTTPS, authentication, WebRTC/TURN networking, and abandoned-session cleanup.
- Link or embed the streaming client from the existing Flask website.
- Add GPU-backed sessions only if concurrent independent reviewers are required.
- Provide a short fallback recording or static viewer if a reviewer network blocks WebRTC.
