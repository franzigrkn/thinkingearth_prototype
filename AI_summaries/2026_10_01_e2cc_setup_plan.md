# E2CC Setup Plan

## Objective

Build a browser-accessible NVIDIA Earth-2 Command Center (E2CC) viewer for precomputed global model predictions. E2CC performs GPU rendering and is streamed to reviewers through WebRTC; no model inference is included.

## 1. Prepare the development workstation

- Use a company workstation with Ubuntu 22.04, preferably an RTX GPU with 48 GB VRAM, 32 CPU cores, 64 GB RAM, and at least 128 GB NVMe storage.
- Install a compatible NVIDIA driver, Git LFS, Docker, NVIDIA Container Toolkit, Python 3.12, and `uv`.
- Clone NVIDIA's Earth-2 Weather Analytics repository separately from this Flask repository.

## 2. Validate E2CC

- Build and launch the unmodified E2CC reference application.
- Confirm that the globe renders correctly and the workstation has sufficient GPU memory.

## 3. Add the first prediction

- Export one raw 0.25° global temperature prediction as a clean equirectangular texture without titles, coastlines, grids, or legends.
- Create E2CC JSON metadata describing its projection, timestamp, units, color range, and colormap.
- Load it into E2CC and verify orientation, longitude wrapping, and latitude placement.

## 4. Build the initial viewer

- Add selected timestamps from 2018 and expose them through the E2CC timeline.
- Add all required climate variables.
- Provide prediction, ground-truth, and error layers with consistent variable-specific color ranges.
- Keep textures and metadata separate from the original scientific arrays.

## 5. Add browser access

- Enable E2CC WebRTC streaming.
- Test access from a browser on the workstation and then from another machine on the company network.
- Keep the initial deployment to one independent session on one GPU.

## 6. Deploy for reviewers

- Package the validated E2CC application for a public GPU host or an approved company-hosted server.
- Configure HTTPS, authentication, session cleanup, and WebRTC/TURN networking.
- Link or embed the streaming client in the existing Flask website.
- Add scalable multi-session infrastructure only if concurrent reviewer access is required.

## Out of scope for the first version

- Live inference
- Data Federation Mesh
- Earth2Studio runtime
- Multi-GPU scaling
