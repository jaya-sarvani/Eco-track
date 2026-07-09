import json
import requests
from config.config import Config

FALLBACK_RECOMMENDATIONS = {
    "travel": [
        {
            "title": "Use Electric Transit or Carpool",
            "recommendation": "Switching to electric buses, trains, or sharing rides cuts individual emissions drastically.",
            "estimated_savings_kg": 4.5,
            "practical_swap": "Take the commuter train or invite 2 coworkers to carpool tomorrow.",
            "icon": "car"
        },
        {
            "title": "Optimize Driving Habits",
            "recommendation": "Aggressive driving increases fuel consumption. Smooth acceleration and steady speeds reduce fuel use by up to 20%.",
            "estimated_savings_kg": 2.1,
            "practical_swap": "Use cruise control on highways and avoid idling for more than 30 seconds.",
            "icon": "trending-down"
        },
        {
            "title": "Active Commuting",
            "recommendation": "For short distances under 5km, biking or walking produces zero emissions and improves cardiovascular health.",
            "estimated_savings_kg": 3.8,
            "practical_swap": "Walk or bike to the local grocery store instead of driving.",
            "icon": "leaf"
        }
    ],
    "food": [
        {
            "title": "Incorporate Plant-Based Dinners",
            "recommendation": "Animal products (especially red meats) are carbon-intensive. Replacing them with pulses and grains reduces your footprint.",
            "estimated_savings_kg": 3.2,
            "practical_swap": "Replace beef with black bean patties or lentils for dinner.",
            "icon": "utensils"
        },
        {
            "title": "Eliminate Food Waste",
            "recommendation": "Food rotting in landfills generates methane, a potent greenhouse gas. Composting or meal planning prevents waste.",
            "estimated_savings_kg": 1.5,
            "practical_swap": "Prepare a weekly meal prep schedule and use leftovers before they spoil.",
            "icon": "trash-2"
        },
        {
            "title": "Choose Local & Seasonal Produce",
            "recommendation": "Out-of-season produce imported by air has a massive transportation footprint compared to local crops.",
            "estimated_savings_kg": 1.8,
            "practical_swap": "Buy seasonal apples and root vegetables from a local farmers' market.",
            "icon": "shopping-bag"
        }
    ],
    "energy": [
        {
            "title": "Smart Thermostat Management",
            "recommendation": "Lowering your heating by 1-2 degrees in winter or raising air conditioning in summer yields significant savings.",
            "estimated_savings_kg": 3.5,
            "practical_swap": "Lower your indoor heating by 1.5°C and wear a comfortable sweater.",
            "icon": "thermometer"
        },
        {
            "title": "Switch to LED Lighting",
            "recommendation": "LED bulbs use up to 80% less energy than traditional incandescent bulbs and last 25 times longer.",
            "estimated_savings_kg": 1.2,
            "practical_swap": "Replace the 5 most frequently used lighting bulbs in your home with LEDs.",
            "icon": "lightbulb"
        },
        {
            "title": "Power Down Phantom Loads",
            "recommendation": "Electronics draw standby power even when turned off. Smart power strips or unplugging devices saves energy.",
            "estimated_savings_kg": 0.9,
            "practical_swap": "Unplug chargers and appliances or shut off power strips before bed.",
            "icon": "zap"
        }
    ],
    "general": [
        {
            "title": "Install Smart Strips",
            "recommendation": "Phantom electricity draw represents 10% of residential energy bills. Smart power strips automatically cut unused sockets.",
            "estimated_savings_kg": 1.1,
            "practical_swap": "Plug home theater systems into a master smart power strip.",
            "icon": "zap"
        },
        {
            "title": "Cold Water Washing",
            "recommendation": "Heating water accounts for 90% of the energy needed to wash clothes. Using cold water saves electricity.",
            "estimated_savings_kg": 1.7,
            "practical_swap": "Adjust laundry settings to 30°C or tap cold for normal clothing items.",
            "icon": "droplet"
        },
        {
            "title": "Eco-Friendly Shopping Bags",
            "recommendation": "Single-use bags consume energy in manufacturing and take centuries to degrade, leaving microplastics.",
            "estimated_savings_kg": 0.5,
            "practical_swap": "Keep 2 reusable canvas bags in your vehicle or backpack for shopping trips.",
            "icon": "shopping-bag"
        }
    ]
}

def generate_eco_suggestions(travel_data, food_data, energy_data, daily_total):
    """
    Sends carbon usage profile to Groq API.
    If GROQ_API_KEY is not present, generates dynamic suggestions locally
    based on the category with the highest carbon footprint.
    """
    travel_emissions = float(travel_data.get("emissions", 0)) if travel_data else 0.0
    food_emissions = float(food_data.get("emissions", 0)) if food_data else 0.0
    energy_emissions = float(energy_data.get("emissions", 0)) if energy_data else 0.0
    daily_total = float(daily_total)

    if Config.GROQ_API_KEY:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {Config.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            
            prompt = (
                f"You are a sustainability and eco-advisor. Provide personalized tips for a user based on their carbon footprint.\n"
                f"Daily emissions metrics:\n"
                f"- Travel Emissions: {travel_emissions} kg CO2\n"
                f"- Food Emissions: {food_emissions} kg CO2\n"
                f"- Energy Emissions: {energy_emissions} kg CO2\n"
                f"- Daily Total: {daily_total} kg CO2\n\n"
                f"Return EXACTLY 3 highly relevant recommendations in a JSON object format. "
                f"Each recommendation must have: 'title', 'recommendation' (1-2 sentences detailing why), "
                f"'estimated_savings_kg' (float value of estimated carbon savings), "
                f"'practical_swap' (a concrete action they can take), and "
                f"'icon' (a lucide-react icon name string: 'car', 'utensils', 'zap', 'leaf', 'thermometer', 'lightbulb', 'trash-2', etc).\n"
                f"Return ONLY valid JSON in the format:\n"
                f"{{\n"
                f"  \"recommendations\": [\n"
                f"    {{ \"title\": \"...\", \"recommendation\": \"...\", \"estimated_savings_kg\": 1.5, \"practical_swap\": \"...\", \"icon\": \"...\" }},\n"
                f"    ...\n"
                f"  ]\n"
                f"}}"
            )
            
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.7
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=8)
            if response.status_code == 200:
                res_json = response.json()
                content_str = res_json["choices"][0]["message"]["content"]
                result = json.loads(content_str)
                if "recommendations" in result and len(result["recommendations"]) == 3:
                    return result["recommendations"]
        except Exception as e:
            print(f"Groq API call failed: {e}. Using fallback generator.")

    # Fallback suggestion builder: choose recommendations based on the largest emission category
    emissions_by_category = {
        "travel": travel_emissions,
        "food": food_emissions,
        "energy": energy_emissions
    }
    
    # Sort category names by their emissions
    sorted_categories = sorted(emissions_by_category.items(), key=lambda item: item[1], reverse=True)
    primary_category = sorted_categories[0][0]
    
    # If primary category has zero emissions, use general tips
    if emissions_by_category[primary_category] == 0:
        return FALLBACK_RECOMMENDATIONS["general"]
        
    recommendations = []
    
    # Add 2 suggestions from the primary category
    category_tips = FALLBACK_RECOMMENDATIONS.get(primary_category, FALLBACK_RECOMMENDATIONS["general"])
    recommendations.append(category_tips[0])
    recommendations.append(category_tips[1])
    
    # Add 1 suggestion from the secondary category
    secondary_category = sorted_categories[1][0]
    sec_tips = FALLBACK_RECOMMENDATIONS.get(secondary_category, FALLBACK_RECOMMENDATIONS["general"])
    recommendations.append(sec_tips[0])
    
    return recommendations
