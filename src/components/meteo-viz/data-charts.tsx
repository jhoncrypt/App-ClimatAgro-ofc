
"use client";

import type { DailyRow, HourlyRow } from "@/lib/weather";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Line, LineChart } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WindIcon, TemperatureIcon, PrecipitationIcon } from "../icons";
import { useMemo } from "react";
import { useLanguage } from "@/context/language-context";

type DataChartsProps = {
  dailyData: DailyRow[];
  hourlyData: HourlyRow[];
  initialTab?: 'temperature' | 'precipitation' | 'wind';
};

const chartConfig = {
  temp_max: {
    label: "Max Temp (°C)",
    color: "hsl(var(--chart-2))",
  },
  temp_min: {
    label: "Min Temp (°C)",
    color: "hsl(var(--chart-3))",
  },
  precipitation: {
    label: "Precipitação (mm)",
    color: "hsl(var(--chart-1))",
  },
  wind_speed_10m: {
    label: "Vento (km/h)",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function DataCharts({ dailyData, hourlyData, initialTab = "temperature" }: DataChartsProps) {
    const { t, language } = useLanguage();
    const dailyChartData = useMemo(() => dailyData.map(d => ({
        ...d,
        date: new Date(d.time).toLocaleDateString(language, { month: 'short', day: 'numeric', timeZone: 'UTC' })
    })), [dailyData, language]);

    const hourlyChartData = useMemo(() => hourlyData.map(d => ({
        ...d,
        time: new Date(d.time).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
    })), [hourlyData, language]);

    const windChartDataForNext24Hours = useMemo(() => {
        if (hourlyData.length === 0) return [];
        const now = new Date();
        const closestEntryIndex = hourlyData.findIndex(row => new Date(row.time) >= now);

        if (closestEntryIndex === -1) {
            return [];
        }
        
        const endIndex = Math.min(closestEntryIndex + 25, hourlyData.length);
        const next24hData = hourlyData.slice(closestEntryIndex, endIndex);

        return next24hData.map(d => ({
            ...d,
            time: new Date(d.time).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
        }));
    }, [hourlyData, language]);

  return (
    <>
        <Tabs defaultValue={initialTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="temperature">
              <TemperatureIcon className="mr-2" /> {t('dataCharts.temperature')}
            </TabsTrigger>
            <TabsTrigger value="precipitation">
              <PrecipitationIcon className="mr-2" /> {t('dataCharts.precipitation')}
            </TabsTrigger>
            <TabsTrigger value="wind">
                <WindIcon className="mr-2"/> {t('dataCharts.wind')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="temperature" className="pt-4">
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
                        <stop offset="5%" stopColor="var(--color-temp_max)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-temp_max)" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="fill_temp_min" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-temp_min)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-temp_min)" stopOpacity={0.1}/>
                    </linearGradient>
                </defs>
                <Area
                  dataKey="temperature_2m_max"
                  type="natural"
                  fill="url(#fill_temp_max)"
                  stroke="var(--color-temp_max)"
                  stackId="a"
                  name="Max Temp"
                />
                <Area
                  dataKey="temperature_2m_min"
                  type="natural"
                  fill="url(#fill_temp_min)"
                  stroke="var(--color-temp_min)"
                  stackId="b"
                  name="Min Temp"
                />
                <Legend content={() => null} />
              </AreaChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="precipitation" className="pt-4">
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
                <Bar dataKey="precipitation_sum" name="Precipitação" fill="var(--color-precipitation)" radius={4} />
                 <Legend content={() => null} />
              </BarChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="wind" className="pt-4">
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart data={windChartDataForNext24Hours} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
          </TabsContent>
        </Tabs>
    </>
  );
}

    