import datetime
from flask import Blueprint, jsonify, request

from routes.auth import login_required
from models.db import get_user, get_logs_in_range

history_bp = Blueprint("history", __name__)

@history_bp.route("", methods=["GET"])
@login_required
def get_history():
    try:
        user_id = request.uid
        user = get_user(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        budget = float(user.get("carbonBudget", 15.0))
        
        # 1. Parse date parameters
        today_obj = datetime.date.today()
        default_start = (today_obj - datetime.timedelta(days=29)).isoformat() # 30 days including today
        default_end = today_obj.isoformat()
        
        start_date_str = request.args.get("startDate", default_start)
        end_date_str = request.args.get("endDate", default_end)
        
        try:
            start_date_obj = datetime.date.fromisoformat(start_date_str)
            end_date_obj = datetime.date.fromisoformat(end_date_str)
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
            
        if start_date_obj > end_date_obj:
            return jsonify({"error": "Start date must be before or equal to end date"}), 400
            
        # 2. Fetch logs from database
        logs_list = get_logs_in_range(user_id, start_date_str, end_date_str)
        logs_by_date = {l["date"]: l for l in logs_list}
        
        # 3. Build a continuous date index to fill gaps (improves line charts & heatmaps)
        continuous_logs = []
        delta = end_date_obj - start_date_obj
        
        for i in range(delta.days + 1):
            current_date_str = (start_date_obj + datetime.timedelta(days=i)).isoformat()
            if current_date_str in logs_by_date:
                continuous_logs.append(logs_by_date[current_date_str])
            else:
                continuous_logs.append({
                    "userId": user_id,
                    "date": current_date_str,
                    "travel": None,
                    "food": None,
                    "energy": None,
                    "totalEmission": 0.0
                })
                
        # 4. Compute Statistics in selected range
        total_emissions = sum(float(l["totalEmission"]) for l in logs_list)
        logged_days_count = len(logs_list)
        
        # 7-Day Average (emissions of the last 7 calendar days with logs)
        last_7_days_start = (today_obj - datetime.timedelta(days=6)).isoformat()
        last_7_logs = get_logs_in_range(user_id, last_7_days_start, default_end)
        seven_day_total = sum(float(l["totalEmission"]) for l in last_7_logs)
        seven_day_avg = round(seven_day_total / 7.0, 2) # Divide by 7 days for calendar average
        
        # Best Day (lowest logged emissions > 0)
        logged_emissions = [float(l["totalEmission"]) for l in logs_list if float(l["totalEmission"]) > 0]
        if logged_emissions:
            best_emission = min(logged_emissions)
            best_days = [l for l in logs_list if float(l["totalEmission"]) == best_emission]
            best_day = {"date": best_days[0]["date"], "emissions": best_emission}
        else:
            best_day = {"date": "N/A", "emissions": 0.0}
            
        # Worst Day (highest logged emissions)
        all_emissions = [float(l["totalEmission"]) for l in logs_list]
        if all_emissions:
            worst_emission = max(all_emissions)
            worst_days = [l for l in logs_list if float(l["totalEmission"]) == worst_emission]
            worst_day = {"date": worst_days[0]["date"], "emissions": worst_emission}
        else:
            worst_day = {"date": "N/A", "emissions": 0.0}
            
        # 5. Formulate Line Chart Data (last 30 days)
        # Includes date, actual total emission, and user budget line
        line_chart_data = []
        for l in continuous_logs:
            line_chart_data.append({
                "date": l["date"],
                "emissions": float(l["totalEmission"]),
                "budget": budget
            })
            
        # 6. Formulate 14-Day Stacked Category Breakdown Data
        # Pick continuous logs for last 14 days of the range (or full range if shorter)
        stacked_range = continuous_logs[-14:]
        stacked_chart_data = []
        for l in stacked_range:
            t = l.get("travel") or {}
            f = l.get("food") or {}
            e = l.get("energy") or {}
            
            stacked_chart_data.append({
                "date": l["date"],
                "travel": float(t.get("emissions", 0.0)),
                "food": float(f.get("emissions", 0.0)),
                "energy": float(e.get("emissions", 0.0))
            })
            
        # 7. Formulate Heatmap Calendar (30-day grid)
        # Low = Green (<= 70% budget), Medium = Yellow (<= budget), High = Red (> budget)
        # Also return a numeric emission value
        heatmap_data = []
        heatmap_range = continuous_logs[-30:]
        for l in heatmap_range:
            em = float(l["totalEmission"])
            if em == 0:
                level = "none" # Default light background for unlogged days
            elif em <= budget * 0.7:
                level = "low"
            elif em <= budget:
                level = "medium"
            else:
                level = "high"
                
            heatmap_data.append({
                "date": l["date"],
                "emissions": em,
                "level": level
            })
            
        # 8. Sort daily logs table by date descending
        # We only display days that actually have logs in this table, to avoid clutter
        table_logs = sorted(logs_list, key=lambda x: x["date"], reverse=True)
        
        history_data = {
            "statistics": {
                "sevenDayAverage": seven_day_avg,
                "bestDay": best_day,
                "worstDay": worst_day,
                "rangeTotal": round(total_emissions, 2),
                "loggedDaysCount": logged_days_count,
                "currentStreak": user.get("streak", 0)
            },
            "lineChart": line_chart_data,
            "stackedChart": stacked_chart_data,
            "heatmap": heatmap_data,
            "logsTable": table_logs
        }
        
        return jsonify(history_data), 200
        
    except Exception as e:
        print(f"History load error: {e}")
        return jsonify({"error": str(e)}), 500
