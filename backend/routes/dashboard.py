import datetime
from flask import Blueprint, jsonify, request

from routes.auth import login_required
from models.db import get_user, get_log, get_logs_in_range

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("", methods=["GET"])
@login_required
def get_dashboard():
    try:
        user_id = request.uid
        user = get_user(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        today = datetime.date.today().isoformat()
        today_log = get_log(user_id, today)
        
        # If no log exists for today, construct empty placeholder
        if not today_log:
            today_log = {
                "userId": user_id,
                "date": today,
                "travel": None,
                "food": None,
                "energy": None,
                "totalEmission": 0.0
            }
            
        # Calculate budget details
        budget = float(user.get("carbonBudget", 15.0))
        total_emission = float(today_log.get("totalEmission", 0.0))
        remaining = budget - total_emission
        
        # Color Status Indicators:
        # Green = Below Budget (e.g. <= 70% of budget)
        # Yellow = Near Budget (e.g. 70% to 100%)
        # Red = Above Budget (> 100%)
        if total_emission <= budget * 0.7:
            status_color = "Green"
        elif total_emission <= budget:
            status_color = "Yellow"
        else:
            status_color = "Red"
            
        # Fetch last 5 logs for recent activities
        today_obj = datetime.date.today()
        start_date = (today_obj - datetime.timedelta(days=7)).isoformat()
        recent_logs = get_logs_in_range(user_id, start_date, today)
        
        # Sort logs by date descending for "recent" order
        recent_logs.sort(key=lambda x: x["date"], reverse=True)
        
        # Compile recent activities list
        activities = []
        for l in recent_logs[:5]:
            log_date = l.get("date")
            # Format activities
            if l.get("travel"):
                activities.append({
                    "id": f"travel_{log_date}",
                    "date": log_date,
                    "category": "Travel",
                    "description": f"{l['travel']['transportMode']} - {l['travel']['distance']} km",
                    "emissions": l["travel"]["emissions"]
                })
            if l.get("food"):
                activities.append({
                    "id": f"food_{log_date}",
                    "date": log_date,
                    "category": "Food",
                    "description": f"Diet: {l['food']['dietType']}" + (" (Food Waste)" if l["food"]["foodWasteToggle"] else ""),
                    "emissions": l["food"]["emissions"]
                })
            if l.get("energy"):
                activities.append({
                    "id": f"energy_{log_date}",
                    "date": log_date,
                    "category": "Energy",
                    "description": f"Electricity: {l['energy']['electricityUsage']} kWh",
                    "emissions": l["energy"]["emissions"]
                })
                
        # Sort combined sub-activities by date descending
        activities.sort(key=lambda x: x["date"], reverse=True)
            
        dashboard_data = {
            "user": {
                "name": user.get("name"),
                "email": user.get("email"),
                "carbonBudget": budget,
                "streak": user.get("streak", 0),
                "badges": user.get("badges", [])
            },
            "todaySummary": {
                "date": today,
                "travel": today_log.get("travel"),
                "food": today_log.get("food"),
                "energy": today_log.get("energy"),
                "totalEmission": total_emission,
                "budgetRemaining": round(remaining, 2),
                "statusColor": status_color
            },
            "recentActivities": activities[:5],
            "progressCards": {
                "travelLogged": bool(today_log.get("travel")),
                "foodLogged": bool(today_log.get("food")),
                "energyLogged": bool(today_log.get("energy")),
            }
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        print(f"Dashboard load error: {e}")
        return jsonify({"error": str(e)}), 500
