// Type definitions for the Open-Meteo API response
export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: Record<string, string>;
  hourly: HourlyData;
  daily_units: Record<string, string>;
  daily: DailyData;
}

export interface HourlyData {
  time: string[];
  temperature_2m: (number | null)[];
  relative_humidity_2m: (number | null)[];
  precipitation: (number | null)[];
  wind_speed_10m: (number | null)[];
  soil_temperature_0cm: (number | null)[];
  soil_temperature_6cm: (number | null)[];
  soil_temperature_18cm: (number | null)[];
  soil_moisture_0_1cm: (number | null)[];
  soil_moisture_1_3cm: (number | null)[];
  soil_moisture_3_9cm: (number | null)[];
  shortwave_radiation: (number | null)[];
  surface_pressure: (number | null)[];
}

export interface DailyData {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
  precipitation_probability_max: (number | null)[];
  shortwave_radiation_sum: (number | null)[];
  et0_fao_evapotranspiration: (number | null)[];
  wind_speed_10m_max: (number | null)[];
  relative_humidity_2m_min: (number | null)[];
}

// Type definitions for processed row data
export type DailyRow = {
  time: string;
  temperature_2m_max: number | null;
  temperature_2m_min: number | null;
  precipitation_sum: number | null;
  precipitation_probability_max: number | null;
  shortwave_radiation_sum: number | null;
  et0_fao_evapotranspiration: number | null;
  wind_speed_10m_max: number | null;
  relative_humidity_2m_min: number | null;
};

export type HourlyRow = {
  time: string;
  temperature_2m: number | null;
  relative_humidity_2m: number | null;
  precipitation: number | null;
  soil_temperature_0cm: number | null;
  soil_moisture_0_1cm: number | null;
  wind_speed_10m: number | null;
  soil_temperature_avg_0_20cm: number | null;
  soil_moisture_avg_0_20cm: number | null;
  shortwave_radiation: number | null;
  surface_pressure: number | null;
};

/**
 * Processes the raw API data into a row-based format for tables.
 * @param data The raw WeatherData from the API.
 * @returns An object containing arrays of daily and hourly data rows.
 */
export function processWeatherData(data: WeatherData): {
  daily: DailyRow[];
  hourly: HourlyRow[];
} {
  const daily: DailyRow[] = data.daily.time.map((time, index) => ({
    time,
    temperature_2m_max: data.daily.temperature_2m_max[index],
    temperature_2m_min: data.daily.temperature_2m_min[index],
    precipitation_sum: data.daily.precipitation_sum[index],
    precipitation_probability_max: data.daily.precipitation_probability_max[index],
    shortwave_radiation_sum: data.daily.shortwave_radiation_sum[index],
    et0_fao_evapotranspiration: data.daily.et0_fao_evapotranspiration[index],
    wind_speed_10m_max: data.daily.wind_speed_10m_max[index],
    relative_humidity_2m_min: data.daily.relative_humidity_2m_min[index],
  }));

  const hourly: HourlyRow[] = data.hourly.time.map((time, index) => {
    const temp_0 = data.hourly.soil_temperature_0cm[index];
    const temp_6 = data.hourly.soil_temperature_6cm[index];
    const temp_18 = data.hourly.soil_temperature_18cm[index];
    const soil_temps = [temp_0, temp_6, temp_18].filter(t => t !== null) as number[];
    const soil_temperature_avg_0_20cm = soil_temps.length > 0 ? soil_temps.reduce((a, b) => a + b, 0) / soil_temps.length : null;

    const moist_0_1 = data.hourly.soil_moisture_0_1cm[index];
    const moist_1_3 = data.hourly.soil_moisture_1_3cm[index];
    const moist_3_9 = data.hourly.soil_moisture_3_9cm[index];
    const soil_moists = [moist_0_1, moist_1_3, moist_3_9].filter(m => m !== null) as number[];
    const soil_moisture_avg_0_20cm = soil_moists.length > 0 ? soil_moists.reduce((a, b) => a + b, 0) / soil_moists.length : null;

    return {
        time,
        temperature_2m: data.hourly.temperature_2m[index],
        relative_humidity_2m: data.hourly.relative_humidity_2m[index],
        precipitation: data.hourly.precipitation[index],
        soil_temperature_0cm: temp_0,
        soil_moisture_0_1cm: moist_0_1,
        wind_speed_10m: data.hourly.wind_speed_10m[index],
        soil_temperature_avg_0_20cm,
        soil_moisture_avg_0_20cm,
        shortwave_radiation: data.hourly.shortwave_radiation[index],
        surface_pressure: data.hourly.surface_pressure[index] ? data.hourly.surface_pressure[index] / 1 : null, // Assuming hPa
    }
  });

  return { daily, hourly };
}
