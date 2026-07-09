import datetime
import logging
from flask import Blueprint, request, jsonify

from routes.auth import login_required
from models.db import get_user, update_user_stats, save_log, get_log, get_logs_in_range
from services.carbon_calculator import (
    calculate_travel_emissions as local_travel,
    calculate_food_emissions as local_food,
    calculate_energy_emissions as local_energy,
)
from services.carbon_interface import calculate_travel_emissions as api_travel
from services.badge_service import evaluate_achievements

logger = logging.getLogger(__name__)

logs_bp = Blueprint("logs", __name__)


@logs_bp.route("/travel", methods=["POST"])
@login_required
def log_travel():
    data = request.get_json() or {}
    distance = data.get("distance")
    transport_mode = data.get("transportMode")
    passenger_count = data.get("passengerCount", 1)
    date = data.get("date") or datetime.date.today().isoformat()

    if distance is None or not transport_mode:
        return jsonify({"error": "Missing distance or transportMode"}), 400

    try:
        distance_val = float(distance)
        passengers = int(passenger_count)
    except ValueError:
        return jsonify({"error": "Invalid numerical values for distance or passengerCount"}), 400

    try:
        # Try Carbon Interface API first, fall back to local
        emissions, source = api_travel(distance_val, transport_mode, passengers)

        details = {
            "distance": distance_val,
            "transportMode": transport_mode,
            "passengerCount": passengers,
            "emissions": emissions,
            "source": source,
        }

        updated_log = save_log(request.uid, date, "travel", details, emissions)
        daily_total = updated_log["totalEmission"]

        newly_unlocked, new_streak = evaluate_achievements(
            request.uid, date, "travel", details, daily_total
        )

        return jsonify({
            "message": "Travel activity logged successfully",
            "log": updated_log,
            "newlyUnlockedBadges": newly_unlocked,
            "streak": new_streak,
        }), 200

    except Exception as e:
        logger.error("Log travel error: %s", e)
        return jsonify({"error": str(e)}), 500


@logs_bp.route("/food", methods=["POST"])
@login_required
def log_food():
    data = request.get_json() or {}
    diet_type = data.get("dietType")
    food_waste_toggle = bool(data.get("foodWasteToggle", False))
    date = data.get("date") or datetime.date.today().isoformat()

    if not diet_type:
        return jsonify({"error": "Missing dietType"}), 400

    try:
        emissions = local_food(diet_type, food_waste_toggle)

        details = {
            "dietType": diet_type,
            "foodWasteToggle": food_waste_toggle,
            "emissions": emissions,
        }

        updated_log = save_log(request.uid, date, "food", details, emissions)
        daily_total = updated_log["totalEmission"]

        newly_unlocked, new_streak = evaluate_achievements(
            request.uid, date, "food", details, daily_total
        )

        return jsonify({
            "message": "Food activity logged successfully",
            "log": updated_log,
            "newlyUnlockedBadges": newly_unlocked,
            "streak": new_streak,
        }), 200

    except Exception as e:
        logger.error("Log food error: %s", e)
        return jsonify({"error": str(e)}), 500


@logs_bp.route("/energy", methods=["POST"])
@login_required
def log_energy():
    data = request.get_json() or {}
    electricity = data.get("electricityUsage")
    gas = data.get("gasUsage", 0)
    renewable_percentage = data.get("renewablePercentage", 0)
    date = data.get("date") or datetime.date.today().isoformat()

    if electricity is None:
        return jsonify({"error": "Missing electricityUsage"}), 400

    try:
        elec_val = float(electricity)
        gas_val = float(gas)
        renew_val = float(renewable_percentage)
    except ValueError:
        return jsonify({"error": "Invalid numerical values for electricity, gas, or renewables"}), 400

    try:
        emissions = local_energy(elec_val, gas_val, renew_val)

        details = {
            "electricityUsage": elec_val,
            "gasUsage": gas_val,
            "renewablePercentage": renew_val,
            "emissions": emissions,
        }

        updated_log = save_log(request.uid, date, "energy", details, emissions)
        daily_total = updated_log["totalEmission"]

        newly_unlocked, new_streak = evaluate_achievements(
            request.uid, date, "energy", details, daily_total
        )

        return jsonify({
            "message": "Energy activity logged successfully",
            "log": updated_log,
            "newlyUnlockedBadges": newly_unlocked,
            "streak": new_streak,
        }), 200

    except Exception as e:
        logger.error("Log energy error: %s", e)
        return jsonify({"error": str(e)}), 500
