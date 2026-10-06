#!/usr/bin/env python3
"""Export global HDF5 forecast fields as E2CC image-sequence features.

The source HDF5 file is never modified. Output fields are converted to 8-bit
grayscale JPEG textures supported by E2CC's timestamped-sequence decoder.
Physical units and normalization details are retained in a JSON manifest
alongside E2CC feature metadata.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import h5py
import numpy as np
from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export a channel from predictions_2018.h5 for E2CC."
    )
    parser.add_argument("input", type=Path, help="Source HDF5 file")
    parser.add_argument("output", type=Path, help="Output directory")
    parser.add_argument("--channel", default="q850", help="Channel to export")
    parser.add_argument("--model-name", default="Earth as a Graph")
    parser.add_argument(
        "--checkpoint",
        default=(
            "base_swin64_grouping3_mh4_segm_low_res_learned_ups_"
            "one_head_0.01_vis_paolo"
        ),
    )
    parser.add_argument("--ensemble-index", type=int, default=0)
    parser.add_argument("--prediction-lead-index", type=int, default=1)
    parser.add_argument("--reference-lead-index", type=int, default=0)
    parser.add_argument("--step-hours", type=float, default=6.0)
    parser.add_argument("--display-min", type=float, default=0.0)
    parser.add_argument("--display-max", type=float, default=25.0)
    parser.add_argument(
        "--display-scale",
        type=float,
        default=1000.0,
        help="Multiply source kg/kg values by this factor (1000 -> g/kg)",
    )
    parser.add_argument("--colormap", default="viridis")
    parser.add_argument("--playback-duration", type=float, default=7.0)
    parser.add_argument(
        "--jpeg-quality",
        type=int,
        default=99,
        help="JPEG quality from 1 to 100 (default: 99, matching E2CC)",
    )
    return parser.parse_args()


def write_grayscale_jpeg(path: Path, pixels: np.ndarray, quality: int) -> None:
    """Write a 2-D uint8 field like E2CC's RenderUint8ToImages operation."""
    if pixels.ndim != 2 or pixels.dtype != np.uint8:
        raise ValueError("JPEG pixels must be a two-dimensional uint8 array")
    if quality < 1 or quality > 100:
        raise ValueError("JPEG quality must be between 1 and 100")

    path.parent.mkdir(parents=True, exist_ok=True)
    # Keep this deliberately close to NVIDIA's RenderUint8ToImages encoder:
    # a Pillow ``L`` image, baseline JPEG, and only an explicit quality value.
    # Extra RGB channels, optimized Huffman tables, and 4:4:4 sampling are not
    # needed for scalar fields and can exercise a different nvJPEG path.
    Image.fromarray(pixels).save(
        path,
        format="JPEG",
        quality=quality,
    )


def iso_utc(unix_seconds: float) -> str:
    return datetime.fromtimestamp(unix_seconds, timezone.utc).replace(
        tzinfo=None
    ).isoformat(timespec="seconds")


def filename_timestamp(unix_seconds: float) -> str:
    return iso_utc(unix_seconds).replace(":", "-") + "Z"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def validate_coordinates(lat: np.ndarray, lon: np.ndarray) -> int:
    if lat.shape != (721,) or lon.shape != (1440,):
        raise ValueError(
            f"Expected a 721 x 1440 ERA5 grid, got {lat.size} x {lon.size}"
        )
    if not np.allclose(np.diff(lat), -0.25):
        raise ValueError("Latitude must descend north-to-south in 0.25 degree steps")
    if not np.allclose(np.diff(lon), 0.25):
        raise ValueError("Longitude must ascend in 0.25 degree steps")
    if not np.isclose(lat[0], 90.0) or not np.isclose(lat[-1], -90.0):
        raise ValueError("Latitude must span 90 to -90 degrees")
    if not np.isclose(lon[0], 0.0) or not np.isclose(lon[-1], 359.75):
        raise ValueError("Longitude must span 0 to 359.75 degrees")

    split = int(np.searchsorted(lon, 180.0))
    if split != 720:
        raise ValueError(f"Expected longitude split at column 720, got {split}")
    return split


def prepare_texture(
    field: np.ndarray,
    longitude_split: int,
    display_scale: float,
    display_min: float,
    display_max: float,
) -> tuple[np.ndarray, dict[str, Any]]:
    if field.shape != (721, 1440):
        raise ValueError(f"Unexpected field shape: {field.shape}")
    if not np.isfinite(field).all():
        raise ValueError("Field contains NaN or infinite values")
    if display_max <= display_min:
        raise ValueError("Display maximum must be greater than display minimum")

    # Move 180..359.75 degrees before 0..179.75 degrees, producing -180..179.75.
    equirectangular = np.concatenate(
        (field[:, longitude_split:], field[:, :longitude_split]), axis=1
    )
    display_values = equirectangular.astype(np.float64) * display_scale
    normalized = np.clip(
        (display_values - display_min) / (display_max - display_min), 0.0, 1.0
    )
    pixels = np.rint(normalized * 255.0).astype(np.uint8)

    statistics = {
        "source_min_kg_kg-1": float(field.min()),
        "source_max_kg_kg-1": float(field.max()),
        "display_min_g_kg-1": float(display_values.min()),
        "display_max_g_kg-1": float(display_values.max()),
        "clipped_below_display_range": int((display_values < display_min).sum()),
        "clipped_above_display_range": int((display_values > display_max).sum()),
    }
    return pixels, statistics


def image_feature(
    *,
    name: str,
    active: bool,
    sources: dict[str, str],
    colormap: str,
    metadata: dict[str, Any],
) -> dict[str, Any]:
    return {
        "name": name,
        "active": active,
        "type": "Image",
        "projection": "latlong",
        "colormap": colormap,
        "flip_u": False,
        "flip_v": False,
        "latlon_min": [-90.0, -180.0],
        "latlon_max": [90.0, 180.0],
        "sources": sources,
        "remapping": {
            "input_min": 0.0,
            "input_max": 1.0,
            "output_min": 0.0,
            "output_max": 1.0,
            "output_gamma": 1.0,
        },
        "meta": metadata,
    }


def export(args: argparse.Namespace) -> None:
    input_path = args.input.resolve()
    output_dir = args.output.resolve()
    if not input_path.is_file():
        raise FileNotFoundError(input_path)
    if args.jpeg_quality < 1 or args.jpeg_quality > 100:
        raise ValueError("JPEG quality must be between 1 and 100")

    with h5py.File(input_path, "r") as source:
        required = {"fields", "timestamp", "lead_time", "channel", "lat", "lon"}
        missing = sorted(required.difference(source.keys()))
        if missing:
            raise ValueError(f"Missing HDF5 datasets: {', '.join(missing)}")

        fields = source["fields"]
        timestamps = source["timestamp"][...]
        lead_times = source["lead_time"][...]
        channels = [value.decode("utf-8") for value in source["channel"][...]]
        lat = source["lat"][...]
        lon = source["lon"][...]
        longitude_split = validate_coordinates(lat, lon)

        if args.channel not in channels:
            raise ValueError(
                f"Unknown channel {args.channel!r}; available: {', '.join(channels)}"
            )
        channel_index = channels.index(args.channel)

        for index_name, index, size in (
            ("ensemble", args.ensemble_index, fields.shape[2]),
            ("prediction lead", args.prediction_lead_index, fields.shape[1]),
            ("reference lead", args.reference_lead_index, fields.shape[1]),
        ):
            if index < 0 or index >= size:
                raise ValueError(f"Invalid {index_name} index {index}; size is {size}")

        timestamp_lookup = {round(float(value), 6): i for i, value in enumerate(timestamps)}
        step_seconds = args.step_hours * 3600.0
        prediction_lead = float(lead_times[args.prediction_lead_index])
        reference_lead = float(lead_times[args.reference_lead_index])

        prediction_sources: dict[str, str] = {}
        reference_sources: dict[str, str] = {}
        frames: list[dict[str, Any]] = []

        for prediction_time_index, prediction_timestamp in enumerate(timestamps):
            valid_timestamp = float(prediction_timestamp) + prediction_lead * step_seconds
            reference_timestamp = valid_timestamp - reference_lead * step_seconds
            reference_time_index = timestamp_lookup.get(round(reference_timestamp, 6))
            if reference_time_index is None:
                continue

            valid_time = iso_utc(valid_timestamp)
            stamp = filename_timestamp(valid_timestamp)
            prediction_relative = Path("textures") / "prediction" / f"{stamp}.jpg"
            reference_relative = (
                Path("textures") / "temporary_reference" / f"{stamp}.jpg"
            )
            prediction_path = output_dir / prediction_relative
            reference_path = output_dir / reference_relative

            prediction_field = fields[
                prediction_time_index,
                args.prediction_lead_index,
                args.ensemble_index,
                channel_index,
                :,
                :,
            ]
            reference_field = fields[
                reference_time_index,
                args.reference_lead_index,
                args.ensemble_index,
                channel_index,
                :,
                :,
            ]

            prediction_pixels, prediction_stats = prepare_texture(
                prediction_field,
                longitude_split,
                args.display_scale,
                args.display_min,
                args.display_max,
            )
            reference_pixels, reference_stats = prepare_texture(
                reference_field,
                longitude_split,
                args.display_scale,
                args.display_min,
                args.display_max,
            )
            write_grayscale_jpeg(
                prediction_path, prediction_pixels, args.jpeg_quality
            )
            write_grayscale_jpeg(reference_path, reference_pixels, args.jpeg_quality)

            # A non-mosaic timestamped sequence expects one path string per
            # timestamp. Lists are reserved for tiled projections such as
            # latlong_<columns>_<rows>, diamond, and HPX.
            prediction_sources[valid_time] = "./" + prediction_relative.as_posix()
            reference_sources[valid_time] = "./" + reference_relative.as_posix()
            frames.append(
                {
                    "valid_time_utc": valid_time,
                    "prediction": {
                        "source_timestamp_utc": iso_utc(float(prediction_timestamp)),
                        "lead_index": args.prediction_lead_index,
                        "lead_value": prediction_lead,
                        "file": prediction_relative.as_posix(),
                        "sha256": sha256(prediction_path),
                        "statistics": prediction_stats,
                    },
                    "temporary_reference": {
                        "source_timestamp_utc": iso_utc(reference_timestamp),
                        "lead_index": args.reference_lead_index,
                        "lead_value": reference_lead,
                        "file": reference_relative.as_posix(),
                        "sha256": sha256(reference_path),
                        "statistics": reference_stats,
                    },
                }
            )

    if not frames:
        raise ValueError("No temporally aligned prediction/reference frames were found")

    pressure_level = int(args.channel[1:]) if args.channel.startswith("q") else None
    common_metadata: dict[str, Any] = {
        "model_name": args.model_name,
        "checkpoint": args.checkpoint,
        "variable": args.channel,
        "standard_name": "specific_humidity",
        "pressure_level_hpa": pressure_level,
        "source_unit": "kg kg-1",
        "display_unit": "g kg-1",
        "source_to_display_scale": args.display_scale,
        "display_range": [args.display_min, args.display_max],
        "grid_resolution_degrees": 0.25,
        "texture_longitude_range": [-180.0, 179.75],
        "texture_latitude_order": "north_to_south",
        "texture_format": "JPEG grayscale 8-bit",
        "jpeg_quality": args.jpeg_quality,
        "jpeg_mode": "grayscale (L)",
        "jpeg_encoder": "baseline Pillow defaults, matching E2CC RenderUint8ToImages",
        "ensemble_index": args.ensemble_index,
    }
    e2cc_metadata = {
        "features": [
            image_feature(
                name=f"{args.model_name} — {args.channel} prediction (+{args.step_hours:g} h)",
                active=True,
                sources=prediction_sources,
                colormap=args.colormap,
                metadata={**common_metadata, "role": "prediction"},
            ),
            image_feature(
                name=f"{args.model_name} — {args.channel} temporary reference",
                active=False,
                sources=reference_sources,
                colormap=args.colormap,
                metadata={
                    **common_metadata,
                    "role": "temporary_reference",
                    "warning": "This layer is another model prediction, not ERA5 ground truth.",
                },
            ),
        ],
        "options": {
            "utc_start_time": frames[0]["valid_time_utc"],
            "utc_end_time": frames[-1]["valid_time_utc"],
            "playback_duration": args.playback_duration,
            "play": False,
        },
    }
    manifest = {
        "schema_version": 1,
        "source_file": input_path.name,
        "source_file_sha256": sha256(input_path),
        "model": {
            "name": args.model_name,
            "checkpoint": args.checkpoint,
        },
        "export": common_metadata,
        "pairing": {
            "temporal_resolution_hours": args.step_hours,
            "prediction_lead_index": args.prediction_lead_index,
            "temporary_reference_lead_index": args.reference_lead_index,
            "temporary_reference_is_ground_truth": False,
        },
        "frame_count": len(frames),
        "frames": frames,
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    metadata_path = output_dir / f"{args.channel}.e2cc.json"
    manifest_path = output_dir / f"{args.channel}.manifest.json"
    metadata_path.write_text(json.dumps(e2cc_metadata, indent=2) + "\n", encoding="utf-8")
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"Exported {len(frames)} aligned frames for {args.channel}")
    print(f"E2CC metadata: {metadata_path}")
    print(f"Manifest: {manifest_path}")


def main() -> None:
    export(parse_args())


if __name__ == "__main__":
    main()
