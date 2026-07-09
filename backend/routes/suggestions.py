import datetime
import logging
from flask import Blueprint, jsonify, request

from routes.auth import login_required
from models.db import get_log, get_suggestions, save_suggestions
from services.groq_service import generate_eco_suggestions

logger = logging.getLogger(__name__)

suggestions_bp = Blueprint("suggestions", __name__)


@suggestions_bp.route("", methods=["POST"])
@login_required
def get_or_generate_suggestions():
    try:
        user_id = request.uid
        data = request.get_json() or {}
        date = data.get("date") or datetime.date.today().isoformat()

        # Check for cached suggestions
        cached = get_suggestions(user_id, date)
        if cached:
            return jsonify({
                "message": "Loaded suggestions from cache",
                "date": date,
                "recommendations": cached["recommendations"],
            }), 200

        # Gather context logs
        log = get_log(user_id, date)
        if not log:
            log = {
                "travel": {"distance": 0.0, "transportMode": "Bike", "passengerCount": 1, "emissions": 0.0},
                "food": {"dietType": "Omnivore", "foodWasteToggle": False, "emissions": 0.0},
                "energy": {"electricityUsage": 0.0, "gasUsage": 0.0, "renewablePercentage": 0.0, "emissions": 0.0},
                "totalEmission": 0.0,
            }

        travel_data = log.get("travel") or {"emissions": 0.0}
        food_data = log.get("food") or {"emissions": 0.0}
        energy_data = log.get("energy") or {"emissions": 0.0}
        total_emission = log.get("totalEmission", 0.0)

        # Generate recommendations via Groq (or fallback)
        recommendations = generate_eco_suggestions(
            travel_data, food_data, energy_data, total_emission
        )

        # Cache in database
        saved = save_suggestions(user_id, date, recommendations)

        return jsonify({
            "message": "Generated new AI suggestions",
            "date": date,
            "recommendations": saved["recommendations"],
        }), 200

    except Exception as e:
        logger.error("Suggestions generate error: %s", e)
        return jsonify({"error": str(e)}), 500


@suggestions_bp.route("", methods=["GET"])
@login_required
def get_suggestions_list():
    """Get suggestions for the current user (latest)."""
    try:
        user_id = request.uid
        today = datetime.date.today().isoformat()

        cached = get_suggestions(user_id, today)
        if cached:
            return jsonify({
                "date": today,
                "recommendations": cached["recommendations"],
            }), 200

        return jsonify({
            "date": today,
            "recommendations": [],
            "message": "No suggestions yet. POST to generate new ones.",
        }), 200

    except Exception as e:
        logger.error("Get suggestions error: %s", e)
        return jsonify({"error": str(e)}), 500
