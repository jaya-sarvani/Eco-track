"""
Badge achievement system for EcoTrack.
Handles badge detection, streak calculation, and unlock logic.
"""
import datetime
import logging
from models.db import get_user, get_log, update_user_stats

logger = logging.getLogger(__name__)

# ============================================================================
# BADGE DEFINITIONS
# ============================================================================
BADGE_DEFINITIONS = {
    "First Log": {
        "description": "Log your first carbon entry to start your journey",
        "icon": "🌱",
        "condition": lambda ctx: ctx["total_logs"] >= 1,
    },
    "3-Day Streak": {
        "description": "Log your habits for 3 consecutive days",
        "icon": "🔥",
        "condition": lambda ctx: ctx["streak"] >= 3,
    },
    "7-Day Streak": {
        "description": "Log your habits for 7 consecutive days",
        "icon": "⚡",
        "condition": lambda ctx: ctx["streak"] >= 7,
    },
    "30-Day Consistency": {
        "description": "Log consistently for 30 consecutive days",
        "icon": "📅",
        "condition": lambda ctx: ctx["streak"] >= 30,
    },
    "Green Traveler": {
        "description": "Record a travel log using walking, biking, train, or EV",
        "icon": "🚲",
        "condition": lambda ctx: ctx["used_green_travel"],
    },
    "Food Saver": {
        "description": "Log 7 days with vegetarian or vegan diet",
        "icon": "🥗",
        "condition": lambda ctx: ctx["vegan_vegetarian_days"] >= 7,
    },
    "Energy Guardian": {
        "description": "Log 5 days with 50%+ renewable energy usage",
        "icon": "⚡",
        "condition": lambda ctx: ctx["high_renewable_days"] >= 5,
    },
    "Carbon Champion": {
        "description": "Maintain daily emissions below budget for 7 days straight",
        "icon": "🏆",
        "condition": lambda ctx: ctx["under_budget_streak"] >= 7,
    },
}

GREEN_TRAVEL_MODES = {"Walking", "Bike", "Train", "Electric Vehicle", "walking", "bike", "train", "car_electric"}


def _count_total_logs(user_id, current_date_str):
    """Count total logged days for a user up to the given date."""
    try:
        current_date = datetime.date.fromisoformat(current_date_str)
    except ValueError:
        current_date = datetime.date.today()

    count = 0
    for i in range(365):
        check_date = (current_date - datetime.timedelta(days=i)).isoformat()
        log = get_log(user_id, check_date)
        if log and (log.get("travel") or log.get("food") or log.get("energy")):
            count += 1
    return count


def _count_vegan_vegetarian_days(user_id, current_date_str):
    """Count days with vegetarian or vegan diet in the last 30 days."""
    try:
        current_date = datetime.date.fromisoformat(current_date_str)
    except ValueError:
        current_date = datetime.date.today()

    count = 0
    for i in range(30):
        check_date = (current_date - datetime.timedelta(days=i)).isoformat()
        log = get_log(user_id, check_date)
        if log and log.get("food"):
            diet = log["food"].get("dietType", "")
            if diet in ("Vegetarian", "Vegan", "vegetarian", "vegan"):
                count += 1
    return count


def _count_high_renewable_days(user_id, current_date_str):
    """Count days with 50%+ renewable energy in the last 30 days."""
    try:
        current_date = datetime.date.fromisoformat(current_date_str)
    except ValueError:
        current_date = datetime.date.today()

    count = 0
    for i in range(30):
        check_date = (current_date - datetime.timedelta(days=i)).isoformat()
        log = get_log(user_id, check_date)
        if log and log.get("energy"):
            renewable = float(log["energy"].get("renewablePercentage", 0))
            if renewable >= 50:
                count += 1
    return count


def _count_under_budget_streak(user_id, current_date_str, budget):
    """Count consecutive days under budget ending at current_date_str."""
    try:
        current_date = datetime.date.fromisoformat(current_date_str)
    except ValueError:
        current_date = datetime.date.today()

    streak = 0
    for i in range(365):
        check_date = (current_date - datetime.timedelta(days=i)).isoformat()
        log = get_log(user_id, check_date)
        if log:
            total = float(log.get("totalEmission", 0))
            if total > 0 and total <= budget:
                streak += 1
            else:
                break
        else:
            break
    return streak


def evaluate_achievements(user_id, date, log_type=None, details_data=None, daily_total=0.0):
    """
    Evaluate all badge conditions and update user stats.

    Args:
        user_id: The user's UID.
        date: The date string (YYYY-MM-DD).
        log_type: The type of log just saved ('travel', 'food', 'energy').
        details_data: The details of the log entry.
        daily_total: The total daily emissions.

    Returns:
        tuple: (newly_unlocked_badges, updated_streak)
    """
    user = get_user(user_id)
    if not user:
        return [], 0

    current_badges = list(user.get("badges", []))
    current_streak = int(user.get("streak", 0))
    carbon_budget = float(user.get("carbonBudget", 15.0))

    # Update streak
    try:
        current_date = datetime.date.fromisoformat(date)
    except ValueError:
        current_date = datetime.date.today()

    is_new_day = False
    existing_log = get_log(user_id, date)
    if not existing_log or (
        not existing_log.get("travel")
        and not existing_log.get("food")
        and not existing_log.get("energy")
    ):
        is_new_day = True

    new_streak = current_streak
    if is_new_day:
        yesterday = (current_date - datetime.timedelta(days=1)).isoformat()
        yesterday_log = get_log(user_id, yesterday)
        if yesterday_log and (
            yesterday_log.get("travel") or yesterday_log.get("food") or yesterday_log.get("energy")
        ):
            new_streak = current_streak + 1
        else:
            new_streak = 1

    # Build evaluation context
    used_green_travel = False
    if log_type == "travel" and details_data:
        mode = details_data.get("transportMode", "")
        dist = float(details_data.get("distance", 0))
        if mode in GREEN_TRAVEL_MODES and dist > 0:
            used_green_travel = True

    context = {
        "total_logs": _count_total_logs(user_id, date),
        "streak": new_streak,
        "used_green_travel": used_green_travel,
        "vegan_vegetarian_days": _count_vegan_vegetarian_days(user_id, date),
        "high_renewable_days": _count_high_renewable_days(user_id, date),
        "under_budget_streak": _count_under_budget_streak(user_id, date, carbon_budget),
        "daily_total": daily_total,
        "carbon_budget": carbon_budget,
    }

    newly_unlocked = []
    for badge_name, badge_def in BADGE_DEFINITIONS.items():
        if badge_name not in current_badges:
            try:
                if badge_def["condition"](context):
                    newly_unlocked.append(badge_name)
                    current_badges.append(badge_name)
            except Exception as e:
                logger.warning("Error evaluating badge '%s': %s", badge_name, e)

    # Persist updates
    update_user_stats(user_id, new_streak, current_badges)

    if newly_unlocked:
        logger.info("User %s unlocked badges: %s", user_id, newly_unlocked)

    return newly_unlocked, new_streak
