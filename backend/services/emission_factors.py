"""
Centralized emission factors for EcoTrack carbon calculations.
All factors in kg CO2 per unit unless otherwise noted.

Sources: IPCC, EPA, DEFRA, Carbon Interface documentation.
"""

# ============================================================================
# TRAVEL EMISSION FACTORS (kg CO2 per km)
# ============================================================================
TRAVEL_FACTORS = {
    "car_petrol": 0.18,
    "car_diesel": 0.17,
    "car_electric": 0.05,
    "bus": 0.08,
    "train": 0.04,
    "flight": 0.255,
    "bike": 0.0,
    "walking": 0.0,
}

# Display name mapping for frontend compatibility
TRAVEL_DISPLAY_NAMES = {
    "car_petrol": "Petrol Car",
    "car_diesel": "Diesel Car",
    "car_electric": "Electric Vehicle",
    "bus": "Public Bus",
    "train": "Electric Train",
    "flight": "Flight",
    "bike": "Bicycle",
    "walking": "Walking",
}

# Reverse mapping from display names to keys
TRAVEL_KEY_LOOKUP = {v: k for k, v in TRAVEL_DISPLAY_NAMES.items()}

# Carbon Interface vehicle model IDs
VEHICLE_MODEL_IDS = {
    "car_petrol": "7268a9b7-17e8-4c8d-a318-0a905ee4d326",
    "car_diesel": "6c8c946e-1dcd-4d89-bb0d-bfbf15206497",
    "car_electric": "c9597c55-bfa3-43ef-92e1-456efd559868",
}

# ============================================================================
# FOOD EMISSION FACTORS (kg CO2 per day by diet type)
# ============================================================================
FOOD_DIETS = {
    "meat_heavy": 7.2,
    "omnivore": 5.1,
    "vegetarian": 3.8,
    "vegan": 2.9,
}

FOOD_DISPLAY_NAMES = {
    "meat_heavy": "Meat Heavy",
    "omnivore": "Omnivore",
    "vegetarian": "Vegetarian",
    "vegan": "Vegan",
}

FOOD_KEY_LOOKUP = {v: k for k, v in FOOD_DISPLAY_NAMES.items()}

# Food waste penalty multiplier (10% increase)
FOOD_WASTE_PENALTY = 1.10

# ============================================================================
# ENERGY EMISSION FACTORS
# ============================================================================
ELECTRICITY_FACTOR = 0.40  # kg CO2 per kWh (US grid average)
GAS_FACTOR = 0.20          # kg CO2 per kWh equivalent

# ============================================================================
# CARBON BUDGET DEFAULTS
# ============================================================================
DEFAULT_CARBON_BUDGET = 15.0  # kg CO2 per day

# ============================================================================
# HEATMAP LEVEL THRESHOLDS (as percentage of budget)
# ============================================================================
HEATMAP_THRESHOLDS = {
    "low": 0.7,     # <= 70% of budget
    "medium": 1.0,  # <= 100% of budget
    "high": 1.01,   # > 100% of budget
}
