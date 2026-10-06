# E2CC data export

Run the exporter in a Python environment containing `h5py`, `numpy`, and
`Pillow`. For example, using the `climate` Conda environment:

```bash
conda run -n climate python scripts/export_e2cc.py \
  check_data/predictions_2018.h5 \
  check_data/e2cc_exports/q850

conda run -n climate python scripts/export_e2cc.py \
  check_data/predictions_2018.h5 \
  check_data/e2cc_exports/q925 \
  --channel q925

conda run -n climate python scripts/export_e2cc.py \
  check_data/predictions_2018.h5 \
  check_data/e2cc_exports/q1000 \
  --channel q1000
```

Each export contains:

- `<channel>.e2cc.json`: E2CC image-feature and timeline metadata
- `<channel>.manifest.json`: provenance, normalization, clipping, and checksums
- `textures/prediction/`: six-hour predictions
- `textures/temporary_reference/`: time-aligned lead-0 model predictions

The exporter converts the source longitude range from `0..359.75` to
`-180..179.75`, converts humidity from `kg/kg` to `g/kg`, and normalizes it to
the fixed display range `0..25 g/kg`. Values outside that range are clipped in
the display textures and recorded in the manifest; the HDF5 source is unchanged.

Textures are 8-bit grayscale JPEGs at quality 99, encoded with the same Pillow
defaults used by E2CC's own `RenderUint8ToImages` weather operation. JPEG is
required because E2CC release 1.1.0 routes timestamped image sequences through
its JPEG-only dynamic-texture decoder; PNG sequences produce loader errors.
Single-channel encoding matches E2CC's native weather-image operation. Note that
both RGB and grayscale JPEGs still rendered incorrectly with the incompatible
Kit 109.0.2/R595 Blackwell runtime combination; that viewport issue is not an
export-format or scientific-data problem.

The temporary reference is not ERA5 ground truth and is labeled accordingly in
the E2CC metadata.

For the non-mosaic `latlong` projection, every timestamp in `sources` maps to a
single path string. One-item path lists are reserved for tiled or mosaic
projections and are rejected by the E2CC release 1.1.0 loader.
