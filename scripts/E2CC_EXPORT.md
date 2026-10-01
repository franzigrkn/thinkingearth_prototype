# E2CC data export

Run the exporter in the `climate` Conda environment:

```bash
conda run -n climate python scripts/export_e2cc.py \
  check_data/predictions_2018.h5 \
  check_data/e2cc_exports/q850
```

The export contains:

- `q850.e2cc.json`: E2CC image-feature and timeline metadata
- `q850.manifest.json`: provenance, normalization, clipping, and checksums
- `textures/prediction/`: six-hour predictions
- `textures/temporary_reference/`: time-aligned lead-0 model predictions

The exporter converts the source longitude range from `0..359.75` to
`-180..179.75`, converts humidity from `kg/kg` to `g/kg`, and normalizes it to
the fixed display range `0..25 g/kg`. Values outside that range are clipped in
the display textures and recorded in the manifest; the HDF5 source is unchanged.

The temporary reference is not ERA5 ground truth and is labeled accordingly in
the E2CC metadata.
