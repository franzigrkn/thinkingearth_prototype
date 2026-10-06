# E2CC Timestamped Texture and RealVNC Display Fix

## Actual texture-format problem

The E2CC metadata files loaded and their timelines advanced, but the first
project exports did not load their scientific textures. The live Kit log
repeatedly reported:

```text
Trying to load a non-jpeg through the jpeg decoder. Only jpegs are supported for image sequences
```

In E2CC release 1.1.0, `TimestampedSequence._on_update` checks the path suffix
and only calls the Dynamic Texture loader for JPEG files. The original project
exports used grayscale PNGs. Metadata, features, controls, and timelines
therefore worked, but the PNG scientific frames were rejected.

This genuine loader problem is distinct from the later posterized view caused
by RealVNC.

## Export correction

`scripts/export_e2cc.py` now produces:

- Single-channel 8-bit grayscale (`L`) JPEGs
- Quality 99, matching E2CC's `RenderUint8ToImages` operation
- Baseline Pillow encoding with no progressive mode or optimized Huffman tables
- Native `1440 x 721` resolution
- One string path per timestamp for the non-mosaic `latlong` sequence
- Manifest metadata recording the texture format and encoding

All `q850`, `q925`, and `q1000` outputs were regenerated in this format.
The 42 obsolete PNG textures were removed. An interim RGB/4:4:4 JPEG variant
was also tested while diagnosing apparent playback corruption. It decoded
successfully; later evidence showed that JPEG color mode was not the cause of
the recurring posterized display. The grayscale format remains preferable
because it matches E2CC's own weather-image encoder.

## Offline validation

For every regenerated channel:

- There are seven prediction and seven temporary-reference JPEGs.
- Each JPEG is grayscale, baseline, non-progressive, and `1440 x 721`.
- Metadata uses string paths ending in `.jpg`.
- Every referenced file exists and every SHA-256 checksum matches its manifest.
- Every manifest records JPEG quality 99 and grayscale encoding.
- Comparing every decoded frame with the normalized HDF5 field gives a maximum
  error of 2 on the 0–255 scale, mean absolute error of 0.118–0.124, and more
  than 99.996% of pixels within one level.

## Runtime compatibility and diagnostic changes

The first workstation used an RTX PRO 6000 Blackwell Server Edition with driver
595.91.07. E2CC initially used Kit 109.0.2, while NVIDIA documents Kit 109.0.5
as the minimum compatible patch on the Kit 109 line for the R595 Blackwell
path. E2CC was therefore repinned and rebuilt successfully with:

```text
Kit 109.0.5+production.296990.e3b53912
Carbonite 209.0.14+release.13016.38be733d
```

This remains a valid compatibility correction, but it was not the fix for the
apparent visual collapse.

The local E2CC checkout also:

- Avoids submitting another asynchronous texture load while the selected path
  is unchanged.
- Disables automatic timeline looping during minibar initialization and after
  metadata configures its playback interval.
- Uses NVIDIA's anonymous public HTTPS extension registry for non-interactive
  dependency precaching.
- Uses the stock Dynamic Texture setting `dt.sync = False`. A temporary
  `dt.sync = True` experiment did not change the symptom and was reverted.

The home filesystem also became full during testing, leaving many zero-byte
Kit shader-cache files. The failed cache was preserved at:

```text
/var/tmp/fgerken/e2cc/ov-cache-corrupt-kit10905-20261006-1043
```

The active `/home/fgerken/.cache/ov` now links to the clean local cache:

```text
/var/tmp/fgerken/e2cc/ov-cache-kit10905-clean
```

This recovered home space and prevents future cache writes from exhausting the
network-home quota. A fresh cache did not eliminate the apparent posterization,
so cache corruption was not its final cause. The temporary eighth
loop-closure timestamp was also removed; every export again contains exactly
seven scientific timestamps from `2018-06-13T12:00:00` through
`2018-06-15T00:00:00`.

## Final root cause of the apparent collapse

After the valid JPEGs were loading, the viewport still sometimes appeared as
large flat color bands, black sectors, or a low-color posterized globe. This
was initially misattributed to JPEG encoding, Dynamic Texture, timeline reset,
Kit, the shader cache, or the Blackwell GPU.

The decisive observations were:

- The built-in Base Satellite could show the same artifact without project
  metadata loaded.
- Ordinary UI elements, especially timeline text, degraded at the same time.
- The complete view could recover while E2CC was untouched.
- Large redraws such as timeline playback or toggling the Sun triggered the
  degradation.
- E2CC logged no matching renderer, texture, CUDA, device-loss, or memory error.
- The GPU had ample free VRAM, zero corrected and uncorrected ECC errors, and no
  NVIDIA Xid event.

The cause was RealVNC's automatic adaptive picture quality, which reduced the
quality of large changing screen regions. The working Viewer settings are:

- **Picture quality:** High
- **PreferredEncoding:** ZRLE

Changing those settings required no E2CC restart and eliminated the apparent
collapse for both the built-in globe and the project layers.

## Final live validation

With RealVNC configured for High picture quality and ZRLE:

- The Base Satellite remains smooth during timeline and lighting changes.
- `q850.e2cc.json`, `q925.e2cc.json`, and `q1000.e2cc.json` all load.
- All three seven-step timelines run correctly.
- The recurring posterization and unreadable timeline text do not return.

The current project exports and Blackwell E2CC installation are therefore
visually validated. Keep the RealVNC quality settings on subsequent machines
and repeat the three-layer smoke test after a clean rebuild.
