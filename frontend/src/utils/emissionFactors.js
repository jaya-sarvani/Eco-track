/*
Centralized emission factors for EcoTrack (frontend mirror).
All factors in kg CO2 per unit unless otherwise noted.
*/

export const TRAVEL_FACTORS = {
  car_petrol: 0.18,
  car_diesel: 0.17,
  car_electric: 0.05,
  bus: 0.08,
  train: 0.04,
  flight: 0.255,
  bike: 0.0,
  walking: 0.0,
};

export const TRAVEL_DISPLAY_NAMES = {
  car_petrol: "Petrol Car",
  car_diesel: "Diesel Car",
  car_electric: "Electric Vehicle",
  bus: "Public Bus",
  train: "Electric Train",
  flight: "Flight",
  bike: "Bicycle",
  walking: "Walking",
};

export const TRAVEL_KEY_LOOKUP = Object.fromEntries(
  Object.entries(TRAVEL_DISPLAY_NAMES).map(([k, v]) => [v, k])
);

export const FOOD_DIETS = {
  meat_heavy: 7.2,
  omnivore: 5.1,
  vegetarian: 3.8,
  vegan: 2.9,
};

export const FOOD_DISPLAY_NAMES = {
  meat_heavy: "Meat Heavy",
  omnivore: "Omnivore",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
};

export const FOOD_KEY_LOOKUP = Object.fromEntries(
  Object.entries(FOOD_DISPLAY_NAMES).map(([k, v]) => [v, k])
);

export const FOOD_WASTE_PENALTY = 1.10;

export const ELECTRICITY_FACTOR = 0.40;
export const GAS_FACTOR = 0.20;

export const DEFAULT_CARBON_BUDGET = 15.0;
