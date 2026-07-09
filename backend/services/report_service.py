import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_report_pdf(user, logs, suggestions, month_name):
    """
    Generates a beautifully formatted PDF report for the user's monthly carbon footprint.
    Uses in-memory BytesIO buffer.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    # Base styling
    styles = getSampleStyleSheet()
    
    # Custom Brand Colors
    PRIMARY_COLOR = colors.HexColor("#2C6B4F")  # Dark Forest Green
    SECONDARY_COLOR = colors.HexColor("#4D9078") # Seafoam Accent
    LIGHT_BG = colors.HexColor("#F4F9F6")        # Light Sage Off-White
    DARK_TEXT = colors.HexColor("#1A3025")       # Deep Green-Black
    BORDER_COLOR = colors.HexColor("#D4E6DC")
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY_COLOR,
        alignment=0, # Left aligned
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SECONDARY_COLOR,
        alignment=0,
    )
    
    h1_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=PRIMARY_COLOR,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=DARK_TEXT,
    )
    
    bold_body = ParagraphStyle(
        'BodyBoldCustom',
        parent=body_style,
        fontName='Helvetica-Bold',
    )
    
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=SECONDARY_COLOR,
    )
    
    meta_value_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=DARK_TEXT,
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=1, # Centered
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=DARK_TEXT,
        alignment=1,
    )
    
    table_cell_left = ParagraphStyle(
        'TableCellLeft',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=DARK_TEXT,
        alignment=0,
    )
    
    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1,
    )
    
    elements = []
    
    # 1. Header Area with Logo / Title
    elements.append(Paragraph("EcoTrack Carbon Report", title_style))
    elements.append(Paragraph(f"Monthly Carbon Footprint & Sustainability Analysis • {month_name}", subtitle_style))
    elements.append(Spacer(1, 15))
    
    # 2. Metadata Block (User details side-by-side with budget summary)
    # Calculate log summaries
    total_travel = 0.0
    total_food = 0.0
    total_energy = 0.0
    total_overall = 0.0
    logged_days = len(logs)
    
    for l in logs:
        t = l.get("travel") or {}
        f = l.get("food") or {}
        e = l.get("energy") or {}
        
        total_travel += float(t.get("emissions", 0))
        total_food += float(f.get("emissions", 0))
        total_energy += float(e.get("emissions", 0))
        total_overall += float(l.get("totalEmission", 0))
        
    avg_daily = total_overall / logged_days if logged_days > 0 else 0.0
    budget = float(user.get("carbonBudget", 15.0))
    budget_status = "Below Budget (Good)" if avg_daily <= budget else "Above Budget (Alert)"
    budget_status_color = "#2C6B4F" if avg_daily <= budget else "#D32F2F"
    
    meta_data = [
        [
            Paragraph("USER PROFILE", meta_label_style), 
            Paragraph("CARBON PERFORMANCE", meta_label_style)
        ],
        [
            Paragraph(f"<b>Name:</b> {user.get('name', 'Eco User')}", meta_value_style),
            Paragraph(f"<b>Reporting Period:</b> {month_name}", meta_value_style)
        ],
        [
            Paragraph(f"<b>Email:</b> {user.get('email', '')}", meta_value_style),
            Paragraph(f"<b>Total Logged Days:</b> {logged_days} days", meta_value_style)
        ],
        [
            Paragraph(f"<b>Current Streak:</b> {user.get('streak', 0)} days", meta_value_style),
            Paragraph(f"<b>Daily Carbon Budget:</b> {budget:.2f} kg CO₂", meta_value_style)
        ],
        [
            Paragraph(f"<b>Unlocked Badges:</b> {', '.join(user.get('badges', [])) or 'None'}", meta_value_style),
            Paragraph(f"<b>Average Daily Emissions:</b> <font color='{budget_status_color}'><b>{avg_daily:.2f} kg CO₂</b> ({budget_status})</font>", meta_value_style)
        ]
    ]
    
    meta_table = Table(meta_data, colWidths=[260, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
        ('LINEBELOW', (0, 0), (-1, 0), 1, SECONDARY_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
    ]))
    
    elements.append(meta_table)
    elements.append(Spacer(1, 20))
    
    # 3. Emissions Scorecard Section
    elements.append(Paragraph("Category Contribution Summary", h1_style))
    
    scorecard_data = [
        [
            Paragraph("Category", table_header_style),
            Paragraph("Total Emissions (kg CO₂)", table_header_style),
            Paragraph("Daily Average (kg CO₂)", table_header_style),
            Paragraph("Percentage (%)", table_header_style)
        ]
    ]
    
    categories = [
        ("Travel / Transportation", total_travel),
        ("Food / Diet", total_food),
        ("Energy / Utilities", total_energy),
    ]
    
    for cat_name, cat_total in categories:
        pct = (cat_total / total_overall * 100) if total_overall > 0 else 0.0
        cat_avg = cat_total / logged_days if logged_days > 0 else 0.0
        scorecard_data.append([
            Paragraph(cat_name, table_cell_left),
            Paragraph(f"{cat_total:.2f}", table_cell_style),
            Paragraph(f"{cat_avg:.2f}", table_cell_style),
            Paragraph(f"{pct:.1f}%", table_cell_style)
        ])
        
    scorecard_data.append([
        Paragraph("<b>Total Footprint</b>", table_cell_left),
        Paragraph(f"<b>{total_overall:.2f}</b>", table_cell_style),
        Paragraph(f"<b>{avg_daily:.2f}</b>", table_cell_style),
        Paragraph("<b>100%</b>", table_cell_style)
    ])
    
    scorecard_table = Table(scorecard_data, colWidths=[200, 110, 110, 110])
    scorecard_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, LIGHT_BG]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#E2EFE7")),
    ]))
    
    elements.append(scorecard_table)
    elements.append(Spacer(1, 20))
    
    # 4. Detailed Logs breakdown (last 10 entries to fit layout nicely)
    elements.append(Paragraph("Recent Daily Entries Breakdown (Last 10 Logged Days)", h1_style))
    
    breakdown_data = [
        [
            Paragraph("Date", table_header_style),
            Paragraph("Travel (kg CO₂)", table_header_style),
            Paragraph("Food (kg CO₂)", table_header_style),
            Paragraph("Energy (kg CO₂)", table_header_style),
            Paragraph("Total (kg CO₂)", table_header_style)
        ]
    ]
    
    # Pick last 10 logs sorted by date descending
    recent_logs = sorted(logs, key=lambda x: x["date"], reverse=True)[:10]
    
    for l in recent_logs:
        t = l.get("travel") or {}
        f = l.get("food") or {}
        e = l.get("energy") or {}
        
        breakdown_data.append([
            Paragraph(l.get("date", ""), table_cell_style),
            Paragraph(f"{float(t.get('emissions', 0)):.2f}", table_cell_style),
            Paragraph(f"{float(f.get('emissions', 0)):.2f}", table_cell_style),
            Paragraph(f"{float(e.get('emissions', 0)):.2f}", table_cell_style),
            Paragraph(f"<b>{float(l.get('totalEmission', 0)):.2f}</b>", table_cell_style)
        ])
        
    if len(recent_logs) == 0:
        breakdown_data.append([Paragraph("No log entries recorded for this period.", table_cell_style)] + [Paragraph("", table_cell_style)]*4)
        
    breakdown_table = Table(breakdown_data, colWidths=[110, 105, 105, 105, 105])
    breakdown_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY_COLOR),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
    ]))
    
    elements.append(breakdown_table)
    elements.append(Spacer(1, 20))
    
    # 5. Recommendations Panel
    elements.append(Paragraph("AI-Generated Personalized Eco Suggestions", h1_style))
    
    rec_items = []
    if suggestions and "recommendations" in suggestions:
        rec_list = suggestions["recommendations"]
    else:
        # Fallback if suggestions empty
        rec_list = [
            {
                "title": "Shift Commute to Active Transport",
                "recommendation": "Try to cycle or walk for travel distances under 5 kilometers. Doing this even twice a week makes a significant impact.",
                "estimated_savings_kg": 3.5,
                "practical_swap": "Ride your bike to local shopping areas instead of utilizing your petrol vehicle."
            },
            {
                "title": "Transition to Meat-Free Options",
                "recommendation": "Incorporate vegan or vegetarian meals into your diet to reduce your food emissions. High beef/meat diets are carbon intensive.",
                "estimated_savings_kg": 2.8,
                "practical_swap": "Implement a 'Meatless Monday' program in your household."
            }
        ]
        
    for idx, r in enumerate(rec_list[:3]):
        rec_box = []
        rec_box.append(Paragraph(f"<b>{idx+1}. {r.get('title', 'Action Step')}</b>", ParagraphStyle('RecTitle', parent=bold_body, textColor=PRIMARY_COLOR, fontSize=11)))
        rec_box.append(Paragraph(f"{r.get('recommendation', '')}", body_style))
        rec_box.append(Paragraph(f"<b>Practical Lifestyle Swap:</b> {r.get('practical_swap', 'N/A')}", ParagraphStyle('RecSwap', parent=body_style, fontName='Helvetica-Oblique', textColor=DARK_TEXT)))
        rec_box.append(Paragraph(f"<b>Estimated Carbon Reduction:</b> {r.get('estimated_savings_kg', 0.0)} kg CO₂ per occurrence", ParagraphStyle('RecSavings', parent=bold_body, textColor=SECONDARY_COLOR, fontSize=9)))
        
        # Turn it into a flowable nested table cell for nice background card paneling
        card_table = Table([[rec_box]], colWidths=[510])
        card_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('LINELEFT', (0, 0), (-1, -1), 3, PRIMARY_COLOR),
        ]))
        
        elements.append(card_table)
        elements.append(Spacer(1, 8))
        
    # Build Document
    doc.build(elements)
    
    pdf_output = buffer.getvalue()
    buffer.close()
    return pdf_output
