import {
  TRAVEL_FACTORS,
  TRAVEL_KEY_LOOKUP,
  FOOD_DIETS,
  FOOD_KEY_LOOKUP,
  FOOD_WASTE_PENALTY,
  ELECTRICITY_FACTOR,
  GAS_FACTOR,
} from "./emissionFactors";

/**
 * Calculate travel emissions in kg CO2.
 * @param {number} distanceKm - Distance in kilometers.
 * @param {string} transportMode - Display name or key.
 * @param {number} passengerCount - Number of passengers.
 * @returns {{ emissions: number, factor: number }}
 */
export function calculateTravelEmissions(distanceKm, transportMode, passengerCount = 1) {
  const distance = parseFloat(distanceKm) || 0;
  const passengers = Math.max(parseInt(passengerCount, 10) || 1, 1);
  const modeKey = TRAVEL_KEY_LOOKUP[transportMode] || transportMode;
  const factor = TRAVEL_FACTORS[modeKey] ?? 0;

  const emissions = (distance * factor) / passengers;
  return { emissions: round2(emissions), factor };
}

/**
 * Calculate food emissions in kg CO2 per day.
 * @param {string} dietType - Display name or key.
 * @param {boolean} foodWasteEnabled - Apply 10% penalty.
 * @returns {number} Emissions in kg CO2.
 */
export function calculateFoodEmissions(dietType, foodWasteEnabled = false) {
  const dietKey = FOOD_KEY_LOOKUP[dietType] || dietType;
  let base = FOOD_DIETS[dietKey] ?? FOOD_DIETS.omnivore;

  if (foodWasteEnabled) {
    base *= FOOD_WASTE_PENALTY;
  }

  return round2(base);
}

/**
 * Calculate energy emissions in kg CO2.
 * @param {number} electricityKwh
 * @param {number} gasUsage
 * @param {number} renewablePercentage - 0 to 100.
 * @returns {number}
 */
export function calculateEnergyEmissions(electricityKwh, gasUsage, renewablePercentage = 0) {
  const elec = parseFloat(electricityKwh) || 0;
  const gas = parseFloat(gasUsage) || 0;
  const renewable = Math.max(0, Math.min(100, parseFloat(renewablePercentage) || 0));

  const cleanModifier = 1 - renewable / 100;
  const elecEmissions = elec * ELECTRICITY_FACTOR * cleanModifier;
  const gasEmissions = gas * GAS_FACTOR;

  return round2(elecEmissions + gasEmissions);
}

/**
 * Sum category emissions into a daily total.
 */
export function calculateDailyTotal(travel = 0, food = 0, energy = 0) {
  return round2(parseFloat(travel) + parseFloat(food) + parseFloat(energy));
}

/**
 * Format a date string to a short label (MM/DD).
 */
export function formatDateLabel(dateStr) {
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

/**
 * Get heatmap level from emission value and budget.
 */
export function getHeatmapLevel(emission, budget) {
  if (emission === 0) return "none";
  if (emission <= budget * 0.7) return "low";
  if (emission <= budget) return "medium";
  return "high";
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
