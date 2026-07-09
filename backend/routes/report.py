import datetime
import calendar
import io
import logging
from flask import Blueprint, request, jsonify, send_file

from routes.auth import login_required
from models.db import get_user, get_logs_in_range, get_suggestions
from services.report_service import generate_report_pdf

logger = logging.getLogger(__name__)

report_bp = Blueprint("report", __name__)


@report_bp.route("", methods=["GET"])
@login_required
def get_report():
    try:
        user_id = request.uid
        user = get_user(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        today = datetime.date.today()
        default_month = today.strftime("%Y-%m")
        month_param = request.args.get("month", default_month)

        try:
            year, month = map(int, month_param.split("-"))
            _, last_day = calendar.monthrange(year, month)
            start_date = f"{year:04d}-{month:02d}-01"
            end_date = f"{year:04d}-{month:02d}-{last_day:02d}"
        except Exception:
            return jsonify({"error": "Invalid month format. Use YYYY-MM"}), 400

        logs = get_logs_in_range(user_id, start_date, end_date)

        sugg_date = today.isoformat()
        if logs:
            sorted_logs = sorted(logs, key=lambda x: x["date"])
            sugg_date = sorted_logs[-1]["date"]

        suggestions = get_suggestions(user_id, sugg_date)

        date_obj = datetime.date(year, month, 1)
        month_name = date_obj.strftime("%B %Y")

        pdf_bytes = generate_report_pdf(user, logs, suggestions, month_name)

        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"EcoTrack_Report_{month_param}.pdf",
        )

    except Exception as e:
        logger.error("Report download error: %s", e)
        return jsonify({"error": str(e)}), 500
