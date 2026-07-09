from services.emission_factors import (
    TRAVEL_FACTORS, FOOD_DIETS, FOOD_WASTE_PENALTY,
    ELECTRICITY_FACTOR, GAS_FACTOR, DEFAULT_CARBON_BUDGET,
    TRAVEL_KEY_LOOKUP, FOOD_KEY_LOOKUP
)


def calculate_travel_emissions(distance_km, transport_mode, passenger_count=1):
    """
    Calculate travel emissions in kg CO2.

    Args:
        distance_km: Distance traveled in kilometers.
        transport_mode: Display name like 'Petrol Car' or key like 'car_petrol'.
        passenger_count: Number of passengers (emissions divided equally).

    Returns:
        tuple: (emissions_kg, factor_used)
    """
    distance_km = float(distance_km)
    passenger_count = max(int(passenger_count), 1)

    mode_key = TRAVEL_KEY_LOOKUP.get(transport_mode, transport_mode)
    factor = TRAVEL_FACTORS.get(mode_key, 0.0)

    emissions = (distance_km * factor) / passenger_count
    return round(emissions, 2), factor


def calculate_food_emissions(diet_type, food_waste_enabled=False):
    """
    Calculate food emissions in kg CO2 per day.

    Args:
        diet_type: Display name like 'Omnivore' or key like 'omnivore'.
        food_waste_enabled: If True, applies 10% penalty.

    Returns:
        float: Emissions in kg CO2.
    """
    diet_key = FOOD_KEY_LOOKUP.get(diet_type, diet_type)
    base_emissions = FOOD_DIETS.get(diet_key, FOOD_DIETS["omnivore"])

    if food_waste_enabled:
        base_emissions *= FOOD_WASTE_PENALTY

    return round(base_emissions, 2)


def calculate_energy_emissions(electricity_kwh, gas_usage, renewable_percentage=0):
    """
    Calculate energy emissions in kg CO2.

    Args:
        electricity_kwh: Electricity consumed in kWh.
        gas_usage: Gas usage in kWh equivalent.
        renewable_percentage: Percentage of energy from renewables (0-100).

    Returns:
        float: Total energy emissions in kg CO2.
    """
    electricity_kwh = float(electricity_kwh)
    gas_usage = float(gas_usage)
    renewable_pct = max(0.0, min(100.0, float(renewable_percentage)))

    clean_modifier = 1.0 - (renewable_pct / 100.0)
    electricity_emissions = electricity_kwh * ELECTRICITY_FACTOR * clean_modifier
    gas_emissions = gas_usage * GAS_FACTOR

    return round(electricity_emissions + gas_emissions, 2)


def calculate_daily_total(travel_emissions, food_emissions, energy_emissions):
    """Sum category emissions into a daily total."""
    return round(
        float(travel_emissions) + float(food_emissions) + float(energy_emissions),
        2,
    )
