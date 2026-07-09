"""
Groq AI service for generating personalized eco suggestions.
Uses llama-3.3-70b-versatile model.
"""
import json
import logging
import requests
from config.config import Config

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"
REQUEST_TIMEOUT = 12

FALLBACK_RECOMMENDATIONS = {
    "travel": [
        {
            "title": "Use Electric Transit or Carpool",
            "recommendation": "Switching to electric buses, trains, or sharing rides cuts individual emissions drastically.",
            "estimated_savings_kg": 4.5,
            "practical_swap": "Take the commuter train or invite 2 coworkers to carpool tomorrow.",
            "icon": "car",
        },
        {
            "title": "Optimize Driving Habits",
            "recommendation": "Aggressive driving increases fuel consumption. Smooth acceleration and steady speeds reduce fuel use by up to 20%.",
            "estimated_savings_kg": 2.1,
            "practical_swap": "Use cruise control on highways and avoid idling for more than 30 seconds.",
            "icon": "trending-down",
        },
        {
            "title": "Active Commuting",
            "recommendation": "For short distances under 5km, biking or walking produces zero emissions and improves cardiovascular health.",
            "estimated_savings_kg": 3.8,
            "practical_swap": "Walk or bike to the local grocery store instead of driving.",
            "icon": "leaf",
        },
    ],
    "food": [
        {
            "title": "Incorporate Plant-Based Dinners",
            "recommendation": "Animal products (especially red meats) are carbon-intensive. Replacing them with pulses and grains reduces your footprint.",
            "estimated_savings_kg": 3.2,
            "practical_swap": "Replace beef with black bean patties or lentils for dinner.",
            "icon": "utensils",
        },
        {
            "title": "Eliminate Food Waste",
            "recommendation": "Food rotting in landfills generates methane, a potent greenhouse gas. Composting or meal planning prevents waste.",
            "estimated_savings_kg": 1.5,
            "practical_swap": "Prepare a weekly meal prep schedule and use leftovers before they spoil.",
            "icon": "trash-2",
        },
        {
            "title": "Choose Local & Seasonal Produce",
            "recommendation": "Out-of-season produce imported by air has a massive transportation footprint compared to local crops.",
            "estimated_savings_kg": 1.8,
            "practical_swap": "Buy seasonal apples and root vegetables from a local farmers' market.",
            "icon": "shopping-bag",
        },
    ],
    "energy": [
        {
            "title": "Smart Thermostat Management",
            "recommendation": "Lowering your heating by 1-2 degrees in winter or raising air conditioning in summer yields significant savings.",
            "estimated_savings_kg": 3.5,
            "practical_swap": "Lower your indoor heating by 1.5\u00b0C and wear a comfortable sweater.",
            "icon": "thermometer",
        },
        {
            "title": "Switch to LED Lighting",
            "recommendation": "LED bulbs use up to 80% less energy than traditional incandescent bulbs and last 25 times longer.",
            "estimated_savings_kg": 1.2,
            "practical_swap": "Replace the 5 most frequently used lighting bulbs in your home with LEDs.",
            "icon": "lightbulb",
        },
        {
            "title": "Power Down Phantom Loads",
            "recommendation": "Electronics draw standby power even when turned off. Smart power strips or unplugging devices saves energy.",
            "estimated_savings_kg": 0.9,
            "practical_swap": "Unplug chargers and appliances or shut off power strips before bed.",
            "icon": "zap",
        },
    ],
    "general": [
        {
            "title": "Install Smart Strips",
            "recommendation": "Phantom electricity draw represents 10% of residential energy bills. Smart power strips automatically cut unused sockets.",
            "estimated_savings_kg": 1.1,
            "practical_swap": "Plug home theater systems into a master smart power strip.",
            "icon": "zap",
        },
        {
            "title": "Cold Water Washing",
            "recommendation": "Heating water accounts for 90% of the energy needed to wash clothes. Using cold water saves electricity.",
            "estimated_savings_kg": 1.7,
            "practical_swap": "Adjust laundry settings to 30\u00b0C or tap cold for normal clothing items.",
            "icon": "droplet",
        },
        {
            "title": "Eco-Friendly Shopping Bags",
            "recommendation": "Single-use bags consume energy in manufacturing and take centuries to degrade, leaving microplastics.",
            "estimated_savings_kg": 0.5,
            "practical_swap": "Keep 2 reusable canvas bags in your vehicle or backpack for shopping trips.",
            "icon": "shopping-bag",
        },
    ],
}


def _build_prompt(travel_data, food_data, energy_data, daily_total):
    """Build the prompt for Groq API."""
    travel_emissions = float(travel_data.get("emissions", 0)) if travel_data else 0.0
    food_emissions = float(food_data.get("emissions", 0)) if food_data else 0.0
    energy_emissions = float(energy_data.get("emissions", 0)) if energy_data else 0.0

    return (
        "You are a sustainability and eco-advisor. Provide personalized tips for a user based on their carbon footprint.\n"
        f"Daily emissions metrics:\n"
        f"- Travel Emissions: {travel_emissions} kg CO2\n"
        f"- Food Emissions: {food_emissions} kg CO2\n"
        f"- Energy Emissions: {energy_emissions} kg CO2\n"
        f"- Daily Total: {daily_total} kg CO2\n\n"
        "Return EXACTLY 3 highly relevant recommendations in a JSON object format. "
        "Each recommendation must have: 'title', 'recommendation' (1-2 sentences detailing why), "
        "'estimated_savings_kg' (float value of estimated carbon savings), "
        "'practical_swap' (a concrete action they can take), and "
        "'icon' (a lucide-react icon name string: 'car', 'utensils', 'zap', 'leaf', 'thermometer', 'lightbulb', 'trash-2', 'droplet', 'shopping-bag', 'trending-down', etc).\n"
        "Return ONLY valid JSON in the format:\n"
        '{\n'
        '  "recommendations": [\n'
        '    { "title": "...", "recommendation": "...", "estimated_savings_kg": 1.5, "practical_swap": "...", "icon": "..." },\n'
        "    ...\n"
        "  ]\n"
        "}"
    )


def _get_fallback_suggestions(travel_data, food_data, energy_data):
    """Generate fallback suggestions based on highest emission category."""
    travel_emissions = float(travel_data.get("emissions", 0)) if travel_data else 0.0
    food_emissions = float(food_data.get("emissions", 0)) if food_data else 0.0
    energy_emissions = float(energy_data.get("emissions", 0)) if energy_data else 0.0

    emissions_by_category = {
        "travel": travel_emissions,
        "food": food_emissions,
        "energy": energy_emissions,
    }

    sorted_cats = sorted(emissions_by_category.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_cats[0][0]

    if emissions_by_category[primary] == 0:
        return FALLBACK_RECOMMENDATIONS["general"]

    primary_tips = FALLBACK_RECOMMENDATIONS.get(primary, FALLBACK_RECOMMENDATIONS["general"])
    secondary = sorted_cats[1][0]
    secondary_tips = FALLBACK_RECOMMENDATIONS.get(secondary, FALLBACK_RECOMMENDATIONS["general"])

    return [primary_tips[0], primary_tips[1], secondary_tips[0]]


def generate_eco_suggestions(travel_data, food_data, energy_data, daily_total):
    """
    Generate personalized eco suggestions via Groq API or fallback.

    Args:
        travel_data: dict with at least 'emissions' key.
        food_data: dict with at least 'emissions' key.
        energy_data: dict with at least 'emissions' key.
        daily_total: float total daily emissions.

    Returns:
        list: 3 recommendation dicts.
    """
    if Config.GROQ_API_KEY:
        try:
            headers = {
                "Authorization": f"Bearer {Config.GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": MODEL,
                "messages": [{"role": "user", "content": _build_prompt(travel_data, food_data, energy_data, daily_total)}],
                "response_format": {"type": "json_object"},
                "temperature": 0.7,
            }

            response = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=REQUEST_TIMEOUT)
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                result = json.loads(content)
                if "recommendations" in result and len(result["recommendations"]) >= 3:
                    logger.info("Groq API generated suggestions successfully")
                    return result["recommendations"][:3]
            else:
                logger.warning("Groq API returned status %d: %s", response.status_code, response.text[:200])
        except requests.Timeout:
            logger.warning("Groq API timed out")
        except Exception as e:
            logger.error("Groq API error: %s", e)

    logger.info("Using fallback suggestions")
    return _get_fallback_suggestions(travel_data, food_data, energy_data)
