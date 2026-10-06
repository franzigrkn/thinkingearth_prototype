# E2CC Roadmap

## Current status as of 2026-10-06

- E2CC release 1.1.0 is built and running on the Blackwell workstation, and the default globe renders.
- RealVNC access through an SSH tunnel is working.
- The initial `q850.e2cc.json` import failure was traced to timestamped `sources` values being one-item lists. The release 1.1.0 non-mosaic loader requires strings.
- The exporter and current metadata were corrected, and `q850.e2cc.json` now loads successfully.
- A later visual inspection showed that the PNG frames themselves were not loading. E2CC's timestamped-sequence implementation only invokes its decoder for JPEG suffixes, and the live log repeatedly rejected the PNG paths.
- The exporter now produces quality-99 baseline grayscale JPEGs matching E2CC's own weather-image encoder. `q850`, `q925`, and `q1000` were regenerated and all paths, dimensions, formats, and checksums passed offline validation.
- E2CC was upgraded to Kit 109.0.5 for R595/Blackwell compatibility, but the recurring posterized view was ultimately not a Kit, GPU, Dynamic Texture, cache, or JPEG failure.
- RealVNC's automatic adaptive image quality caused the apparent collapse and also degraded ordinary UI text. Setting **Picture quality** to **High** and **PreferredEncoding** to **ZRLE** fixed the display.
- All three metadata files now load and run through their timelines correctly in live E2CC testing.

## Workstation timeline

- Develop first on the RTX PRO 6000 Blackwell Server Edition from **2026-10-02 through 2026-10-08**.
- Preserve all source, data, checksums, commits, and setup notes before that lease ends.
- Resume on the RTX 6000 Ada from **2026-10-11 onward**, using clean clones and a fresh E2CC build.

## 1. Validate E2CC on Blackwell — completed

- The project data is present, the workstation and Docker GPU access were verified, and the pinned NVIDIA application was built and launched.

## 2. Validate the first `q850` export

- Import `q850.e2cc.json` into E2CC. **Completed after correcting the metadata schema.**
- Reload the JPEG-based export and check actual texture content, orientation, longitude wrapping, colormap support, layer toggling, and timeline playback. **Completed.**

## 3. Complete the Blackwell-to-Ada handoff

- Commit and push all portable changes by 2026-10-08.
- Record the exact NVIDIA repository commit and machine diagnostics.
- Transfer the ignored HDF5/export data through durable storage.
- On the Ada machine, rerun setup and validation; do not copy Blackwell build output, environments, or caches.

## 4. Complete the data layers

- Export `q925` and `q1000`. **Completed, structurally validated, and validated in live timeline playback.**
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
