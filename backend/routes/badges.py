import logging
from flask import Blueprint, jsonify, request

from routes.auth import login_required
from models.db import get_user
from services.badge_service import BADGE_DEFINITIONS

logger = logging.getLogger(__name__)

badges_bp = Blueprint("badges", __name__)


@badges_bp.route("", methods=["GET"])
@login_required
def get_badges():
    """Get all badge definitions and user's earned badges."""
    try:
        user_id = request.uid
        user = get_user(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        earned = user.get("badges", [])
        streak = user.get("streak", 0)

        badges_list = []
        for name, definition in BADGE_DEFINITIONS.items():
            badges_list.append({
                "name": name,
                "description": definition["description"],
                "icon": definition["icon"],
                "unlocked": name in earned,
            })

        return jsonify({
            "badges": badges_list,
            "earnedCount": len(earned),
            "streak": streak,
        }), 200

    except Exception as e:
        logger.error("Get badges error: %s", e)
        return jsonify({"error": str(e)}), 500
