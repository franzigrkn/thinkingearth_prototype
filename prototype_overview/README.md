# Prototype Overview Figure

`generate_prototype_overview.py` creates the final-state website overview
figure as PNG, SVG, and PDF files.

Generate the outputs with a Python environment containing Matplotlib:

```bash
MPLCONFIGDIR=/tmp/matplotlib \
  python prototype_overview/generate_prototype_overview.py
```

The figure requests Helvetica first and uses the installed Helvetica-compatible
Nimbus Sans font as the local rendering fallback.
