# E2CC Setup Plan

## Objective

Build a browser-accessible NVIDIA Earth-2 Command Center (E2CC) viewer for precomputed global predictions. E2CC handles GPU rendering and streams to reviewers through WebRTC; no model inference is included.

## Workstation schedule

- **2026-10-02 to 2026-10-08:** RTX PRO 6000 Blackwell Server Edition.
- **From 2026-10-11:** RTX 6000 Ada.
- Both are supported choices for this work. The move should be low risk if the Ada installation is rebuilt from source and only source code, configuration, and data are transferred.

## Completed

- Inspected `predictions_2018.h5`: three specific-humidity channels (`q850`, `q925`, `q1000`) on a global 0.25-degree ERA5 grid.
- Added `scripts/export_e2cc.py` and exporter documentation on the pushed `e2cc` branch.
- Generated and validated seven `q850` prediction/reference pairs plus E2CC metadata and a provenance manifest.
- Lead time 0 is currently a temporary model reference, not ERA5 ground truth.
- Built and launched E2CC release 1.1.0 on the Blackwell workstation; the default globe renders.
- Corrected the non-mosaic metadata schema so each timestamp maps to a path string rather than a one-item list. The corrected `q850.e2cc.json` loaded successfully on 2026-10-05.
- Corrected the texture format on 2026-10-06 after the live log showed that release 1.1.0 rejects PNG timestamp sequences. The current exports are E2CC-compatible quality-99 baseline grayscale JPEGs.
- Rebuilt E2CC with Kit 109.0.5 to satisfy the documented R595/Blackwell compatibility floor. This was a valid compatibility correction, but it was not the cause of the apparent visual collapse.
- Identified RealVNC adaptive picture quality as the cause of the posterized viewport and unreadable timeline text. RealVNC **Picture quality: High** with **PreferredEncoding: ZRLE** keeps the view stable.
- Completed live validation of `q850`, `q925`, and `q1000`: all metadata files load and all timelines play correctly without the previous apparent corruption.

## Blackwell workstation: 2026-10-02 to 2026-10-08

1. Clone the `e2cc` branch and transfer or regenerate the ignored HDF5/export assets.
2. Verify Ubuntu 22.04, driver `>=580.105`, CUDA 13.0, GPU allocation, Docker GPU access, Git LFS, Python 3.12, and `uv`.
3. Clone NVIDIA's `earth2-weather-analytics` repository separately and run its setup. **Completed.**
4. Launch the unmodified E2CC application. **Completed.**
5. Import and visually validate the regenerated JPEG-based metadata files. **Completed for `q850`, `q925`, and `q1000`.**
6. Record fixes, exact commits, and environment details; commit and push all portable changes before the lease ends.

## Ada workstation: from 2026-10-11

1. Start from clean clones at the recorded commits.
2. Transfer the raw HDF5/generated exports or regenerate them and compare the manifest checksums.
3. Rerun NVIDIA setup; do not reuse Blackwell `_build` output, virtual environments, shader caches, or architecture-specific CUDA binaries.
4. Repeat Docker GPU, E2CC launch, and all three visual checks, using RealVNC High quality and ZRLE if RealVNC is used.
5. Continue with additional variables/timestamps, WebRTC, and public deployment.

## Reviewer deployment

- Begin with one GPU-backed interactive session.
- Configure HTTPS, authentication, session cleanup, and WebRTC/TURN networking.
- Link or embed the streaming client from the existing Flask website.
- Add multiple independent sessions only if concurrent reviewer access is required.

## First-version exclusions

- Live inference
- Data Federation Mesh and Earth2Studio workflows beyond reference-app startup requirements
- Multi-GPU scaling
