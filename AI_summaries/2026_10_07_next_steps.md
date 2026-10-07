# E2CC Next Steps

## Status as of 2026-10-07

- E2CC release 1.1.0 and the `q850`, `q925`, and `q1000` seven-step timelines
  were validated on the RTX PRO 6000 Blackwell workstation.
- The exporter produces E2CC-compatible `1440 x 721`, quality-99 baseline
  grayscale JPEGs with string paths for non-mosaic timestamp sequences.
- RealVNC must use **High** picture quality and **ZRLE** encoding; Automatic
  quality caused the apparent posterization and black sectors.
- Project source, the E2CC overlay, and setup documentation are preserved in
  the `e2cc` branch.
- `predictions_2018.h5` and the complete `e2cc_exports/` tree are preserved in
  CSS Storage at
  `s3://projects/earth_as_a_graph/interactive_prototype/`.

## Next action: migrate on 2026-10-11

Follow the [Ada workstation setup runbook](2026_10_11_setup_ADA_workstation.md)
to:

1. Verify the RTX 6000 Ada workstation and Docker GPU access.
2. Create a clean local-NVMe workspace and clone the project.
3. Restore and verify the HDF5 and E2CC exports from CSS Storage with `s5cmd`.
4. Prepare Python 3.12, CUDA 12.8, and local package/shader caches.
5. Clone the pinned NVIDIA release, build E2CC, and validate the installation.
6. Configure RealVNC, launch E2CC, and repeat the three-channel acceptance
   test.
7. Install the managed Flask and headless E2CC streaming services, then repeat
   the browser acceptance test through `/earth2` from the Mac.
8. Record the reviewer demonstration through the website after the Ada setup
   passes acceptance.

Do not transfer Blackwell build output, virtual environments, CUDA artifacts,
containers, or caches. Rebuild them on the Ada machine.

## Current delivery plan

1. Keep the live prototype available only on the trusted company network or
   VPN; it remains HTTP-only and unauthenticated.
2. Use the Flask `/earth2` interface for the final demonstration rather than
   recording RealVNC or NVIDIA's direct browser client.
3. Give reviewers the recorded video, not access to the live workstation.
4. Keep the migration and setup notes as the blueprint for users who want to
   reproduce the viewer on their own compatible GPU infrastructure.
5. Defer public hosting, cloud GPU deployment, HTTPS, authentication, TURN,
   session cleanup, and multi-user orchestration.

## Later visualization work

1. Improve model, variable, unit, timestamp, and legend presentation.
2. Replace the temporary lead-0 reference with real ERA5 ground truth and add
   signed or absolute error layers.
3. Add more variables and test-year timestamps as source data becomes
   available.

No further investigation of the old visual-collapse symptom is needed unless
it recurs with RealVNC fixed to High quality and ZRLE.
