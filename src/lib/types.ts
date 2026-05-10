export type Location = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  crop?: string;
};

export type CalendarEvent = {
    tasks: string;
    precipitation: number;
    frostDamage: boolean;
    windDamage: boolean;
};


// From weather-processing.ts to avoid circular dependencies
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
