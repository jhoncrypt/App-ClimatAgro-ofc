"use server";

import type { WeatherData } from "./weather-processing";

/**
 * Fetches weather data from the Open-Meteo API for a specific location.
 * This is a Next.js Server Action.
 * @param latitude The latitude of the location.
 * @param longitude The longitude of the location.
 */
export async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData | null> {
  const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_temperature_0cm,soil_temperature_6cm,soil_temperature_18cm,soil_moisture_0_1cm,soil_moisture_1_3cm,soil_moisture_3_9cm,shortwave_radiation,surface_pressure&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,shortwave_radiation_sum,et0_fao_evapotranspiration,wind_speed_10m_max,relative_humidity_2m_min&forecast_days=15&past_days=7&timezone=America/Sao_Paulo`;
  try {
    const response = await fetch(API_URL, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!response.ok) {
      console.error("Failed to fetch weather data:", response.statusText);
      return null;
    }
    const data: WeatherData = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}
