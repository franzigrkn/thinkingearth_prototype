# E2CC Roadmap

## 1. Validate the workstation

- Verify the OS, GPU allocation, driver, memory, storage, Docker GPU access, and required tools.
- Build and launch the unmodified NVIDIA Earth-2 Command Center application.

## 2. Validate the first `q850` export

- Transfer the generated `q850` directory to the workstation.
- Import `q850.e2cc.json` into E2CC.
- Check texture orientation, longitude wrapping, colormap support, layer toggling, and timeline playback.
- Adjust `flip_u`, `flip_v`, longitude handling, or image format only if the E2CC test shows a problem.

## 3. Complete the data layers

- Export and validate `q925` and `q1000` after `q850` passes.
- Add additional variables and test-year timestamps when new HDF5 data becomes available.
- Replace the temporary lead-0 reference with actual ERA5 ground truth later.
- Add signed or absolute error layers once true targets are available.

## 4. Customize the E2CC viewer

- Present the model as `Earth as a Graph` while retaining the complete checkpoint identifier in metadata.
- Provide clear variable, layer, unit, and timestamp controls.
- Use consistent physical color ranges for comparisons.
- Add a legend and clearly distinguish predictions, temporary references, and eventual ERA5 targets.

## 5. Add browser streaming

- Enable local E2CC WebRTC streaming.
- Test from a browser on the workstation and then from another machine on the company network.
- Keep the first deployment to one independent session on one GPU.

## 6. Publish the reviewer experience

- Package E2CC and its static visualization assets for an approved public GPU host.
- Configure HTTPS, authentication, WebRTC/TURN networking, and abandoned-session cleanup.
- Link or embed the streaming client from the existing Flask website.
- Add additional GPU-backed sessions only if concurrent independent reviewers are required.
- Provide a short fallback recording or static viewer in case a reviewer network blocks WebRTC.
