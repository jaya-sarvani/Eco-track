import requests
from config.config import Config

# Standard Fallback Emission Factors (in kg CO2 per km)
TRAVEL_FACTORS = {
    "Petrol Car": 0.18,
    "Diesel Car": 0.17,
    "Electric Vehicle": 0.05,
    "Bus": 0.08,
    "Train": 0.04,
    "Bike": 0.0,
    "Walking": 0.0
}

# Standard Carbon Interface Vehicle Model IDs for fallback integration
VEHICLE_MODEL_IDS = {
    "Petrol Car": "7268a9b7-17e8-4c8d-a318-0a905ee4d326",  # Standard Mid-size Petrol Sedan
    "Diesel Car": "6c8c946e-1dcd-4d89-bb0d-bfbf15206497",  # Standard Mid-size Diesel
    "Electric Vehicle": "c9597c55-bfa3-43ef-92e1-456efd559868"  # Tesla Model 3 / EV Sedan
}

# Diet daily base emissions in kg CO2
FOOD_DIETS = {
    "Meat Heavy": 7.2,
    "Omnivore": 5.1,
    "Vegetarian": 3.8,
    "Vegan": 2.9
}

# Energy conversion factors (kg CO2 per kWh)
ELECTRICITY_FACTOR = 0.40
GAS_FACTOR = 0.20

def calculate_travel_emissions(distance_km, transport_mode, passenger_count):
    """
    Calculates travel emissions.
    Distance in km. Divided by passenger count.
    Uses Carbon Interface API if key is available. Falls back to TRAVEL_FACTORS.
    """
    distance_km = float(distance_km)
    passenger_count = max(int(passenger_count), 1)
    
    if Config.CARBON_INTERFACE_API_KEY and transport_mode in VEHICLE_MODEL_IDS:
        try:
            url = "https://www.carboninterface.com/api/v1/estimates"
            headers = {
                "Authorization": f"Bearer {Config.CARBON_INTERFACE_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "type": "vehicle",
                "distance_unit": "km",
                "distance_value": distance_km,
                "vehicle_model_id": VEHICLE_MODEL_IDS[transport_mode]
            }
            response = requests.post(url, json=payload, headers=headers, timeout=5)
            if response.status_code == 201 or response.status_code == 200:
                res_data = response.json()
                carbon_kg = res_data["data"]["attributes"]["carbon_kg"]
                emissions = float(carbon_kg) / passenger_count
                return round(emissions, 2), "Carbon Interface API"
        except Exception as e:
            print(f"Carbon Interface API request failed: {e}. Using fallback factors.")
            
    # Fallback to hardcoded factors
    factor = TRAVEL_FACTORS.get(transport_mode, 0.0)
    emissions = (distance_km * factor) / passenger_count
    return round(emissions, 2), "Local Fallback Factor"

def calculate_food_emissions(diet_type, food_waste_enabled):
    """
    Calculates food emissions.
    Applies 10% emission penalty if food waste is enabled.
    """
    base_emissions = FOOD_DIETS.get(diet_type, 5.1) # Default to Omnivore
    
    if food_waste_enabled:
        base_emissions *= 1.10 # 10% penalty
        
    return round(base_emissions, 2)

def calculate_energy_emissions(electricity_kwh, gas_usage, renewable_percentage):
    """
    Calculates energy emissions.
    Electricity factor adjusted for renewable energy usage percentage.
    """
    electricity_kwh = float(electricity_kwh)
    gas_usage = float(gas_usage)
    renewable_percentage = float(renewable_percentage)
    
    # Calculate electricity emissions adjusting for clean renewables
    clean_modifier = 1.0 - (renewable_percentage / 100.0)
    clean_modifier = max(0.0, min(1.0, clean_modifier))
    
    electricity_emissions = electricity_kwh * ELECTRICITY_FACTOR * clean_modifier
    gas_emissions = gas_usage * GAS_FACTOR
    
    total_energy_emissions = electricity_emissions + gas_emissions
    return round(total_energy_emissions, 2)
