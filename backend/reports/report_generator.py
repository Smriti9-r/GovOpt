
from io import BytesIO
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


def format_crore(value):
    return f"Rs. {float(value):,.2f} Cr"


def create_document(buffer, title):
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title=title,
        author="GovOpt",
    )

    return doc


def get_report_styles():
    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="GovOptTitle",
            parent=styles["Title"],
            fontSize=22,
            leading=26,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#17365D"),
            spaceAfter=8,
        )
    )

    styles.add(
        ParagraphStyle(
            name="GovOptHeading",
            parent=styles["Heading2"],
            fontSize=13,
            textColor=colors.HexColor("#17365D"),
            spaceBefore=12,
            spaceAfter=8,
        )
    )

    styles.add(
        ParagraphStyle(
            name="GovOptBody",
            parent=styles["BodyText"],
            fontSize=9,
            leading=13,
        )
    )

    return styles


def generate_scenario_pdf(scenario, result_snapshot):
    """
    Generate a PDF report for one saved scenario.

    Returns PDF content as bytes.
    """

    buffer = BytesIO()

    doc = create_document(
        buffer,
        f"GovOpt Scenario Report - {scenario['name']}",
    )

    styles = get_report_styles()
    story = []

    story.append(
        Paragraph("GovOpt", styles["GovOptTitle"])
    )

    story.append(
        Paragraph(
            "Government Resource Allocation Report",
            styles["Heading2"],
        )
    )

    story.append(Spacer(1, 12))

    story.append(
        Paragraph("Scenario Information", styles["GovOptHeading"])
    )

    information = [
        ["Scenario Name", str(scenario["name"])],
        ["Scenario ID", str(scenario["id"])],
        [
            "Report Generated (UTC)",
            datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M"),
        ],
    ]

    info_table = Table(
        information,
        colWidths=[2 * inch, 5 * inch],
    )

    info_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#DCE6F1")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("PADDING", (0, 0), (-1, -1), 7),
        ])
    )

    story.append(info_table)

    sector_weights = result_snapshot.get("sector_weights", {})
    allocation = result_snapshot.get("allocation", {})

    story.append(
        Paragraph("Sector Priority Weights", styles["GovOptHeading"])
    )

    sector_data = [
        ["Sector", "Weight"],
        ["Education", f"{sector_weights.get('education', 0):.2f}%"],
        ["Water", f"{sector_weights.get('water', 0):.2f}%"],
        ["Healthcare", f"{sector_weights.get('healthcare', 0):.2f}%"],
    ]

    sector_table = Table(sector_data, colWidths=[3 * inch, 2 * inch])

    sector_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ])
    )

    story.append(sector_table)

    story.append(
        Paragraph("Allocation Assumptions", styles["GovOptHeading"])
    )

    assumptions = [
        ["Parameter", "Value"],
        ["Total Budget", format_crore(allocation.get("budget_crore", 0))],
        ["Need Weight", f"{allocation.get('need_weight', 0):.2f}%"],
        [
            "Population Weight",
            f"{allocation.get('population_weight', 0):.2f}%",
        ],
        [
            "Minimum Allocation",
            format_crore(allocation.get("min_allocation_crore", 0)),
        ],
        [
            "Maximum Allocation",
            format_crore(allocation.get("max_allocation_crore", 0)),
        ],
        [
            "Total Allocated",
            format_crore(allocation.get("total_allocated_crore", 0)),
        ],
    ]

    assumptions_table = Table(
        assumptions,
        colWidths=[3 * inch, 2.5 * inch],
    )

    assumptions_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ])
    )

    story.append(assumptions_table)

    story.append(
        Paragraph("District-wise Allocation", styles["GovOptHeading"])
    )

    allocation_rows = [
        [
            "District",
            "Combined Priority",
            "Target Allocation",
            "Optimised Allocation",
        ]
    ]

    for item in allocation.get("allocations", []):
        allocation_rows.append([
            item["district"],
            f"{float(item['combined_priority']):.4f}",
            format_crore(item["target_allocation_crore"]),
            format_crore(item["optimised_allocation_crore"]),
        ])

    allocation_table = Table(
        allocation_rows,
        colWidths=[2.2 * inch, 2 * inch, 2.2 * inch, 2.4 * inch],
        repeatRows=1,
    )

    allocation_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
        ])
    )

    story.append(allocation_table)

    story.append(
        Paragraph("Important Notes", styles["GovOptHeading"])
    )

    notes = [
        "This report contains model-generated allocation estimates.",
        "The allocations are not records of actual government expenditure.",
        "Results depend on the supplied data, selected weights and model constraints.",
        "The report represents a saved scenario snapshot and does not imply live data.",
    ]

    for note in notes:
        story.append(
            Paragraph(f"- {note}", styles["GovOptBody"])
        )

    doc.build(story)

    return buffer.getvalue()


def generate_comparison_pdf(comparison_data):
    """
    Generate a PDF comparing multiple saved scenarios.

    Returns PDF content as bytes.
    """

    buffer = BytesIO()

    doc = create_document(
        buffer,
        "GovOpt Scenario Comparison Report",
    )

    styles = get_report_styles()
    story = []

    story.append(
        Paragraph("GovOpt", styles["GovOptTitle"])
    )

    story.append(
        Paragraph(
            "Scenario Comparison Report",
            styles["Heading2"],
        )
    )

    story.append(Spacer(1, 12))

    comparison = comparison_data.get("comparison", [])
    scenario_ids = comparison_data.get("scenario_ids", [])

    scenario_names = {}

    if comparison:
        for scenario_id in scenario_ids:
            key = str(scenario_id)

            scenario_names[key] = (
                comparison[0]["scenarios"]
                .get(key, {})
                .get("scenario_name", f"Scenario {key}")
            )

    headers = ["District"]

    for scenario_id in scenario_ids:
        headers.append(
            scenario_names.get(str(scenario_id), f"Scenario {scenario_id}")
        )

    table_data = [headers]

    for district_data in comparison:
        row = [district_data["district"]]

        for scenario_id in scenario_ids:
            value = district_data["scenarios"].get(str(scenario_id), {})
            amount = value.get("allocation_crore")

            row.append(
                format_crore(amount) if amount is not None else "N/A"
            )

        table_data.append(row)

    column_width = 9.5 * inch / max(len(headers), 1)

    comparison_table = Table(
        table_data,
        colWidths=[column_width] * len(headers),
        repeatRows=1,
    )

    comparison_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
        ])
    )

    story.append(comparison_table)

    story.append(Spacer(1, 14))

    story.append(
        Paragraph("Important Notes", styles["GovOptHeading"])
    )

    story.append(
        Paragraph(
            "This comparison presents model-generated allocation estimates "
            "from saved scenario snapshots. It does not represent actual "
            "government expenditure or live government statistics.",
            styles["GovOptBody"],
        )
    )

    doc.build(story)

    return buffer.getvalue()
