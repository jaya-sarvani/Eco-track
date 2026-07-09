"""
Carbon Interface API integration with graceful fallback.
Uses local emission factors when API is unavailable.
"""
import logging
import requests
from config.config import Config
from services.emission_factors import TRAVEL_FACTORS, TRAVEL_KEY_LOOKUP

logger = logging.getLogger(__name__)

CARBON_INTERFACE_BASE = "https://www.carboninterface.com/api/v1"
REQUEST_TIMEOUT = 8  # seconds
MAX_RETRIES = 2


def _get_headers():
    return {
        "Authorization": f"Bearer {Config.CARBON_INTERFACE_API_KEY}",
        "Content-Type": "application/json",
    }


def _post_with_retry(url, payload, headers, timeout=REQUEST_TIMEOUT, retries=MAX_RETRIES):
    """POST with retry and timeout handling."""
    last_error = None
    for attempt in range(retries + 1):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=timeout)
            if response.status_code in (200, 201):
                return response.json()
            last_error = f"HTTP {response.status_code}: {response.text[:200]}"
            logger.warning("Carbon Interface attempt %d failed: %s", attempt + 1, last_error)
        except requests.Timeout:
            last_error = "Request timed out"
            logger.warning("Carbon Interface attempt %d timed out", attempt + 1)
        except requests.ConnectionError:
            last_error = "Connection failed"
            logger.warning("Carbon Interface attempt %d connection error", attempt + 1)
        except Exception as e:
            last_error = str(e)
            logger.warning("Carbon Interface attempt %d error: %s", attempt + 1, last_error)

    logger.error("Carbon Interface API exhausted after %d attempts. Last error: %s", retries + 1, last_error)
    return None


def calculate_travel_emissions(distance_km, transport_mode, passenger_count=1):
    """
    Calculate travel emissions using Carbon Interface API with local fallback.

    Returns:
        tuple: (emissions_kg, source) where source is 'carbon_interface' or 'local_fallback'.
    """
    distance_km = float(distance_km)
    passenger_count = max(int(passenger_count), 1)

    # Try Carbon Interface API if configured and vehicle type is supported
    mode_key = TRAVEL_KEY_LOOKUP.get(transport_mode, transport_mode)
    if Config.CARBON_INTERFACE_API_KEY:
        from services.emission_factors import VEHICLE_MODEL_IDS

        vehicle_model_id = VEHICLE_MODEL_IDS.get(mode_key)
        if vehicle_model_id:
            payload = {
                "type": "vehicle",
                "distance_unit": "km",
                "distance_value": distance_km,
                "vehicle_model_id": vehicle_model_id,
            }
            result = _post_with_retry(
                f"{CARBON_INTERFACE_BASE}/estimates",
                payload,
                _get_headers(),
            )
            if result:
                try:
                    carbon_kg = result["data"]["attributes"]["carbon_kg"]
                    emissions = float(carbon_kg) / passenger_count
                    logger.info("Carbon Interface used for %s: %.2f kg CO2", transport_mode, emissions)
                    return round(emissions, 2), "carbon_interface"
                except (KeyError, TypeError) as e:
                    logger.warning("Failed to parse Carbon Interface response: %s", e)

    # Fallback to local emission factors
    factor = TRAVEL_FACTORS.get(mode_key, 0.0)
    emissions = (distance_km * factor) / passenger_count
    logger.info("Local fallback used for %s: %.2f kg CO2", transport_mode, emissions)
    return round(emissions, 2), "local_fallback"


def calculate_flight_emissions(distance_km):
    """Calculate flight-specific emissions."""
    if Config.CARBON_INTERFACE_API_KEY:
        payload = {
            "type": "flight",
            "distance_unit": "km",
            "distance_value": float(distance_km),
            "passengers": 1,
            "cabin_class": "economy",
        }
        result = _post_with_retry(
            f"{CARBON_INTERFACE_BASE}/estimates",
            payload,
            _get_headers(),
        )
        if result:
            try:
                carbon_kg = result["data"]["attributes"]["carbon_kg"]
                return round(float(carbon_kg), 2), "carbon_interface"
            except (KeyError, TypeError):
                pass

    # Fallback: flight factor 0.255 kg CO2/km
    emissions = float(distance_km) * 0.255
    return round(emissions, 2), "local_fallback"
