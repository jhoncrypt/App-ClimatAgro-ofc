
"use client";

import type { DailyRow, HourlyRow } from "@/lib/weather-processing";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { useMemo } from "react";

type DetailedChartProps = {
  metric: 'temperature' | 'precipitation' | 'wind' | 'soil-temp' | 'soil-moisture' | 'humidity' | 'radiation' | 'water-balance';
  dailyData: DailyRow[];
  hourlyData: HourlyRow[];
};

const chartConfig = {
  temperature_2m_max: {
    label: "Max Temp (°C)",
    color: "hsl(var(--chart-2))",
  },
  temperature_2m_min: {
    label: "Min Temp (°C)",
    color: "hsl(var(--chart-3))",
  },
  precipitation_sum: {
    label: "Precipitação (mm)",
    color: "hsl(var(--chart-1))",
  },
  wind_speed_10m: {
    label: "Vento (km/h)",
    color: "hsl(var(--chart-3))",
  },
  relative_humidity_2m: {
      label: "Umidade (%)",
      color: "hsl(var(--chart-5))",
  },
  soil_temperature_avg_0_20cm: {
    label: "Temp. Solo (°C)",
    color: "hsl(var(--chart-4))",
  },
  soil_moisture_avg_0_20cm: {
      label: "Umidade Solo (m³/m³)",
      color: "hsl(var(--chart-5))",
  },
  shortwave_radiation: {
    label: "Irradiação (W/m²)",
    color: "hsl(var(--chart-2))",
  },
  shortwave_radiation_sum: {
    label: "Acumulado (MJ/m²)",
    color: "hsl(var(--chart-2))",
  },
  water_balance: {
    label: "Balanço Hídrico (mm)",
    color: "hsl(var(--chart-1))",
  }
} satisfies ChartConfig;

export function DetailedChart({ metric, dailyData, hourlyData }: DetailedChartProps) {
    const dailyChartData = useMemo(() => dailyData.map(d => ({
        ...d,
        date: new Date(d.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        water_balance: (d.precipitation_sum ?? 0) - (d.et0_fao_evapotranspiration ?? 0),
    })), [dailyData]);

    const hourlyChartData = useMemo(() => hourlyData.map(d => ({
        ...d,
        time: new Date(d.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
    })), [hourlyData]);

  if (metric === 'temperature') {
    return (
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}°C`}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <defs>
              <linearGradient id="fill_temp_max" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-temperature_2m_max)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-temperature_2m_max)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="fill_temp_min" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-temperature_2m_min)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-temperature_2m_min)" stopOpacity={0.1}/>
              </linearGradient>
          </defs>
          <Area
            dataKey="temperature_2m_max"
            type="natural"
            fill="url(#fill_temp_max)"
            stroke="var(--color-temperature_2m_max)"
            stackId="a"
            name="Max Temp"
          />
          <Area
            dataKey="temperature_2m_min"
            type="natural"
            fill="url(#fill_temp_min)"
            stroke="var(--color-temperature_2m_min)"
            stackId="b"
            name="Min Temp"
          />
          <Legend content={() => null} />
        </AreaChart>
      </ChartContainer>
    );
  }

  if (metric === 'precipitation') {
    return (
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
           <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value} mm`}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="precipitation_sum" name="Precipitação" fill="var(--color-precipitation_sum)" radius={4} />
           <Legend content={() => null} />
        </BarChart>
      </ChartContainer>
    );
  }

  if (metric === 'wind') {
    return (
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value} km/h`}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <defs>
              <linearGradient id="fill_wind" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-wind_speed_10m)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-wind_speed_10m)" stopOpacity={0.1}/>
              </linearGradient>
          </defs>
          <Area
            dataKey="wind_speed_10m"
            type="natural"
            fill="url(#fill_wind)"
            stroke="var(--color-wind_speed_10m)"
            name="Vento"
          />
          <Legend content={() => null} />
        </AreaChart>
      </ChartContainer>
    );
  }
  
    if (metric === 'humidity') {
    return (
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}%`}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <defs>
              <linearGradient id="fill_humidity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-relative_humidity_2m)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-relative_humidity_2m)" stopOpacity={0.1}/>
              </linearGradient>
          </defs>
          <Area
            dataKey="relative_humidity_2m"
            type="natural"
            fill="url(#fill_humidity)"
            stroke="var(--color-relative_humidity_2m)"
            name="Umidade"
          />
          <Legend content={() => null} />
        </AreaChart>
      </ChartContainer>
    );
  }

  if (metric === 'soil-temp') {
    return (
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}°C`} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
          <defs>
            <linearGradient id="fill_soil_temp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-soil_temperature_avg_0_20cm)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--color-soil_temperature_avg_0_20cm)" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <Area
            dataKey="soil_temperature_avg_0_20cm"
            type="natural"
            fill="url(#fill_soil_temp)"
            stroke="var(--color-soil_temperature_avg_0_20cm)"
            name="Temp. Solo"
          />
          <Legend content={() => null} />
        </AreaChart>
      </ChartContainer>
    );
  }

  if (metric === 'soil-moisture') {
    return (
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value.toFixed(2)} m³/m³`} domain={['dataMin - 0.02', 'dataMax + 0.02']} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
           <defs>
            <linearGradient id="fill_soil_moisture" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-soil_moisture_avg_0_20cm)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--color-soil_moisture_avg_0_20cm)" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <Area
            dataKey="soil_moisture_avg_0_20cm"
            type="natural"
            fill="url(#fill_soil_moisture)"
            stroke="var(--color-soil_moisture_avg_0_20cm)"
            name="Umidade Solo"
          />
          <Legend content={() => null} />
        </AreaChart>
      </ChartContainer>
    );
  }

  if (metric === 'radiation') {
    return (
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value} MJ/m²`} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          <Bar
            dataKey="shortwave_radiation_sum"
            fill="var(--color-shortwave_radiation_sum)"
            radius={4}
            name="Energia Solar (MJ/m²)"
          />
          <Legend content={() => null} />
        </BarChart>
      </ChartContainer>
    );
  }

  if (metric === 'water-balance') {
    return (
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
           <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value} mm`}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="water_balance" name="Balanço Hídrico" fill="var(--color-water_balance)" radius={4} />
           <Legend content={() => null} />
        </BarChart>
      </ChartContainer>
    );
  }

  return null;
}
