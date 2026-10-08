from pathlib import Path
import textwrap

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch


OUTPUT_DIR = Path(__file__).resolve().parent

COLORS = {
    "ink": "#17233C",
    "muted": "#5D687A",
    "line": "#B7C0CE",
    "offline_fill": "#FFF5E8",
    "offline_edge": "#E69B42",
    "browser_fill": "#F5F8FC",
    "browser_edge": "#8EA2BC",
    "dashboard": "#2F6BFF",
    "earth2": "#7656D6",
    "download": "#15866B",
    "about": "#52647C",
    "outcome_fill": "#EFF7F3",
    "outcome_text": "#176B50",
}


def rounded_box(
    axis,
    x,
    y,
    width,
    height,
    *,
    facecolor,
    edgecolor,
    linewidth=1.4,
    linestyle="-",
    radius=0.14,
    zorder=1,
):
    box = FancyBboxPatch(
        (x, y),
        width,
        height,
        boxstyle=f"round,pad=0.02,rounding_size={radius}",
        facecolor=facecolor,
        edgecolor=edgecolor,
        linewidth=linewidth,
        linestyle=linestyle,
        zorder=zorder,
    )
    axis.add_patch(box)
    return box


def arrow(axis, start, end, *, color, linestyle="-", linewidth=1.5, zorder=2):
    patch = FancyArrowPatch(
        start,
        end,
        arrowstyle="-|>",
        mutation_scale=12,
        linewidth=linewidth,
        linestyle=linestyle,
        color=color,
        shrinkA=2,
        shrinkB=2,
        zorder=zorder,
    )
    axis.add_patch(patch)
    return patch


def page_card(axis, x, title, lines, color):
    y = 3.16
    width = 3.25
    height = 2.27
    rounded_box(
        axis,
        x,
        y,
        width,
        height,
        facecolor="white",
        edgecolor=color,
        linewidth=1.8,
        linestyle="-",
        radius=0.16,
        zorder=3,
    )
    rounded_box(
        axis,
        x,
        y + height - 0.52,
        width,
        0.52,
        facecolor=color,
        edgecolor=color,
        linewidth=0,
        radius=0.14,
        zorder=4,
    )
    axis.text(
        x + width / 2,
        y + height - 0.26,
        title,
        ha="center",
        va="center",
        fontsize=12.8,
        color="white",
        zorder=5,
    )
    body_lines = []
    for line in lines:
        wrapped_line = textwrap.wrap(line, width=28)
        body_lines.append(f"• {wrapped_line[0]}")
        body_lines.extend(f"   {continuation}" for continuation in wrapped_line[1:])
    body = "\n".join(body_lines)
    axis.text(
        x + 0.25,
        y + height - 0.78,
        body,
        ha="left",
        va="top",
        fontsize=10.5,
        color=COLORS["ink"],
        linespacing=1.45,
        zorder=5,
    )


def build_figure():
    plt.rcParams.update(
        {
            "font.family": "sans-serif",
            "font.sans-serif": [
                "Helvetica Neue",
                "Helvetica",
                "Nimbus Sans",
                "Arial",
                "Liberation Sans",
            ],
            "font.weight": "light",
            "font.size": 11.2,
            "axes.linewidth": 0,
            "pdf.fonttype": 42,
            "ps.fonttype": 42,
            "svg.fonttype": "none",
        }
    )

    figure, axis = plt.subplots(figsize=(16, 9.28), facecolor="white")
    axis.set_xlim(0, 16)
    axis.set_ylim(0.72, 10)
    axis.axis("off")

    axis.text(
        8,
        9.72,
        "Earth as a Graph Interactive Prototype",
        ha="center",
        va="center",
        fontsize=25,
        color=COLORS["ink"],
    )
    rounded_box(
        axis,
        0.42,
        6.62,
        15.16,
        2.40,
        facecolor=COLORS["offline_fill"],
        edgecolor=COLORS["offline_edge"],
        linewidth=1.4,
        radius=0.18,
    )
    axis.text(
        0.72,
        8.78,
        "OFFLINE CONTENT PREPARATION",
        ha="left",
        va="center",
        fontsize=10.5,
        color="#A45E18",
    )

    rounded_box(
        axis,
        6.15,
        8.04,
        3.70,
        0.60,
        facecolor="white",
        edgecolor=COLORS["offline_edge"],
        linewidth=1.5,
        radius=0.14,
        zorder=3,
    )
    axis.text(
        8,
        8.34,
        "Earth as a Graph model outputs",
        ha="center",
        va="center",
        fontsize=12.5,
        color=COLORS["ink"],
        zorder=4,
    )

    source_centers = [2.34, 6.12, 9.90, 13.68]
    source_titles = [
        "Static 2D assets",
        "Recorded E2CC video",
        "E2CC-compatible data format",
        "Project information",
    ]
    source_details = [
        "Predictions · comparisons · learning behavior",
        "3D visualization · high-resolution",
        "E2CC compatibility · local use",
        "Context · contact",
    ]
    for center_x, title, detail in zip(source_centers, source_titles, source_details):
        rounded_box(
            axis,
            center_x - 1.72,
            6.94,
            3.44,
            0.72,
            facecolor="white",
            edgecolor=COLORS["line"],
            linewidth=1.1,
            radius=0.12,
            zorder=3,
        )
        axis.text(
            center_x,
            7.42,
            title,
            ha="center",
            va="center",
            fontsize=11.2,
            color=COLORS["ink"],
            zorder=4,
        )
        axis.text(
            center_x,
            7.15,
            detail,
            ha="center",
            va="center",
            fontsize=9.2,
            color=COLORS["muted"],
            zorder=4,
        )
        arrow(
            axis,
            (8, 8.02),
            (center_x, 7.70),
            color=COLORS["offline_edge"],
            linewidth=1.05,
            zorder=2,
        )

    rounded_box(
        axis,
        0.42,
        2.92,
        15.16,
        3.34,
        facecolor=COLORS["browser_fill"],
        edgecolor=COLORS["browser_edge"],
        linewidth=1.5,
        radius=0.18,
        zorder=1,
    )
    rounded_box(
        axis,
        0.42,
        5.76,
        15.16,
        0.50,
        facecolor="#E7EDF5",
        edgecolor=COLORS["browser_edge"],
        linewidth=0,
        radius=0.16,
        zorder=2,
    )
    for circle_x, circle_color in zip(
        [0.72, 0.94, 1.16], ["#ED6A5E", "#F4BF4F", "#61C554"]
    ):
        axis.scatter(circle_x, 6.01, s=54, color=circle_color, edgecolors="none", zorder=4)
    axis.text(
        8,
        6.01,
        "Earth as a Graph website",
        ha="center",
        va="center",
        fontsize=11.8,
        color=COLORS["ink"],
        zorder=4,
    )

    card_x_positions = [0.72, 4.50, 8.28, 12.06]
    page_card(
        axis,
        card_x_positions[0],
        "Dashboard",
        [
            "Explore and compare model predictions",
            "Inspect learned spatial patterns",
        ],
        COLORS["dashboard"],
    )
    page_card(
        axis,
        card_x_positions[1],
        "Earth-2 Visualization",
        [
            "Watch the demonstration video",
            "View model outputs in a 3D context",
        ],
        COLORS["earth2"],
    )
    page_card(
        axis,
        card_x_positions[2],
        "Data Download",
        [
            "Access prepared model predictions",
            "Use the data in E2CC",
            "Consult supporting information",
        ],
        COLORS["download"],
    )
    page_card(
        axis,
        card_x_positions[3],
        "About",
        [
            "Learn about project objectives",
            "Understand prototype",
            "Find contact information",
        ],
        COLORS["about"],
    )

    for center_x in source_centers:
        arrow(
            axis,
            (center_x, 6.90),
            (center_x, 6.30),
            color=COLORS["line"],
            linestyle=(0, (4, 3)),
            linewidth=1.25,
            zorder=2,
        )

    axis.text(
        0.58,
        2.65,
        "USER OUTCOMES",
        ha="left",
        va="center",
        fontsize=10.5,
        color=COLORS["outcome_text"],
    )
    outcome_labels = [
        "Explore model behavior",
        "Observe the 3D experience",
        "Reuse data in local E2CC",
        "Understand the project",
    ]
    for center_x, label, color in zip(
        source_centers,
        outcome_labels,
        [COLORS["dashboard"], COLORS["earth2"], COLORS["download"], COLORS["about"]],
    ):
        arrow(
            axis,
            (center_x, 3.13),
            (center_x, 2.43),
            color=color,
            linewidth=1.35,
            zorder=2,
        )
        rounded_box(
            axis,
            center_x - 1.55,
            1.73,
            3.10,
            0.64,
            facecolor=COLORS["outcome_fill"],
            edgecolor=color,
            linewidth=1.25,
            radius=0.13,
            zorder=3,
        )
        axis.text(
            center_x,
            2.05,
            label,
            ha="center",
            va="center",
            fontsize=10.7,
            color=COLORS["ink"],
            zorder=4,
        )

    axis.text(
        8,
        1.20,
        "The public website presents a recorded Earth2 demonstration; it does not expose a live E2CC session.",
        ha="center",
        va="center",
        fontsize=10.8,
        color=COLORS["muted"],
        style="italic",
    )
    axis.text(
        8,
        0.91,
        "E2CC = Earth-2 Command Center.",
        ha="center",
        va="center",
        fontsize=10.4,
        color=COLORS["muted"],
        style="italic",
    )

    return figure


def main():
    figure = build_figure()
    for extension in ("png", "svg", "pdf"):
        output_path = OUTPUT_DIR / f"prototype_overview.{extension}"
        figure.savefig(
            output_path,
            dpi=300,
            bbox_inches="tight",
            pad_inches=0.12,
            facecolor="white",
        )
        print(f"Wrote {output_path}")
    plt.close(figure)


if __name__ == "__main__":
    main()
