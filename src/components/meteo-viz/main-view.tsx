"use client";

import type { DailyRow, HourlyRow } from "@/lib/weather-processing";
import { DetailedChart } from "./detailed-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo, useRef } from "react";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { Location } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LocationManager } from './location-manager';
import { format, addHours, differenceInSeconds } from "date-fns";
import { useLanguage } from "@/context/language-context";
import { ptBR, enUS, es } from 'date-fns/locale';
import { SprayingConditions } from "./spraying-conditions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


import {
  DateIcon,
  HumidityIcon,
  PrecipitationIcon,
  TemperatureIcon,
  DailyIcon,
  HourlyIcon,
  SoilTempIcon,
  SoilMoistureIcon,
  WindIcon,
  LineChartIcon,
  SunIcon,
  Clock,
  LeafIcon,
} from "../icons";
import { Droplets, Thermometer, ArrowLeft, Snowflake, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

type NotificationInfo = {
    id: string;
    type: 'warning' | 'info';
    title: string;
    message: string;
    icon: React.ReactNode;
}

type MainViewProps = {
  locations: Location[];
  selectedLocation: Location | null;
  onLocationSelect: (locationId: string) => void;
  onLocationAdd: (newLocation: Omit<Location, 'id'>) => void;
  onLocationUpdate: (location: Location) => void;
  onLocationDelete: (locationId: string) => void;
  dailyData: DailyRow[];
  hourlyData: HourlyRow[];
  loading: boolean;
  error: string | null;
  lastUpdateTime: Date | null;
  onRefresh: () => void;
};

const crops = ['none', 'soy', 'corn', 'sugarcane', 'coffee', 'bean', 'cotton', 'orange', 'wheat'];
const UPDATE_INTERVAL_HOURS = 1;

export function MainView({ 
  locations,
  selectedLocation,
  onLocationSelect,
  onLocationAdd,
  onLocationUpdate,
  onLocationDelete,
  dailyData,
  hourlyData,
  loading,
  error,
  lastUpdateTime,
  onRefresh,
 }: MainViewProps) {
  const { t, language } = useLanguage();
  const locales: Record<string, Locale> = { pt: ptBR, en: enUS, es };
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [timeToNextUpdate, setTimeToNextUpdate] = useState('');
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(selectedLocation?.crop || 'none');
  const [todayDateString, setTodayDateString] = useState('');

  useEffect(() => {
    if (selectedLocation) {
      setSelectedCrop(selectedLocation.crop || 'none');
    }
  }, [selectedLocation]);

  const handleCropUpdate = () => {
    if (selectedLocation) {
      onLocationUpdate({ ...selectedLocation, crop: selectedCrop === 'none' ? undefined : selectedCrop });
      setIsCropDialogOpen(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    let formatted = today.toLocaleDateString(language, options);
    setTodayDateString(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, [language]);

  useEffect(() => {
    if (!lastUpdateTime) return;

    const calculateNextUpdate = () => {
      const nextUpdateDate = addHours(lastUpdateTime, UPDATE_INTERVAL_HOURS);
      const secondsRemaining = differenceInSeconds(nextUpdateDate, new Date());

      if (secondsRemaining <= 0) {
        setTimeToNextUpdate('0m');
        onRefresh();
        return;
      }

      const minutes = Math.round(secondsRemaining / 60);
      setTimeToNextUpdate(`${minutes}m`);
    };

    calculateNextUpdate();
    const intervalId = setInterval(calculateNextUpdate, 60000);

    return () => clearInterval(intervalId);
  }, [lastUpdateTime, onRefresh]);

  const dailyColumns = useMemo(() => [
    {
      accessorKey: "time",
      header: (
        <span className="flex items-center gap-2">
          <DateIcon /> {t('columns.date')}
        </span>
      ),
      cell: (value: string) => {
          const date = new Date(value);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' };
          let formattedDate = date.toLocaleDateString(language, options);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          return formattedDate.split(',')[0] + ', ' + formattedDate.split(', ')[1];
      },
    },
    {
      accessorKey: "temperature_2m_max",
      header: (
        <span className="flex items-center gap-2">
          <TemperatureIcon className="text-red-500" /> {t('columns.maxTemp')}
        </span>
      ),
      cell: (value: number) => `${value.toFixed(1)}°C`,
    },
    {
      accessorKey: "temperature_2m_min",
      header: (
        <span className="flex items-center gap-2">
          <TemperatureIcon className="text-blue-500" /> {t('columns.minTemp')}
        </span>
      ),
      cell: (value: number) => `${value.toFixed(1)}°C`,
    },
    {
      accessorKey: "precipitation_sum",
      header: (
        <span className="flex items-center gap-2">
          <PrecipitationIcon /> {t('columns.precipitation')}
        </span>
      ),
      cell: (value: number) => `${value.toFixed(1)} mm`,
    },
  ], [t, language]);
  
  const hourlyColumns = useMemo(() => [
    {
      accessorKey: "time",
      header: (
        <span className="flex items-center gap-2">
          <DateIcon /> {t('columns.dateTime')}
        </span>
      ),
      cell: (value: string) => {
          const date = new Date(value);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'UTC', day: '2-digit', month: '2-digit' };
          let formattedDate = date.toLocaleDateString(language, options);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          return `${formattedDate.split(',')[0]}, ${date.toLocaleDateString(language, {timeZone: 'UTC', day: '2-digit', month: '2-digit'})} ${new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: 'UTC' })}`;
      },
    },
    {
      accessorKey: "temperature_2m",
      header: (
        <span className="flex items-center gap-2">
          <TemperatureIcon /> {t('columns.temp')}
        </span>
      ),
      cell: (value: number) => `${value.toFixed(1)}°C`,
    },
    {
      accessorKey: "relative_humidity_2m",
      header: (
        <span className="flex items-center gap-2">
          <HumidityIcon /> {t('columns.humidity')}
        </span>
      ),
      cell: (value: number) => `${value}%`,
    },
    {
      accessorKey: "precipitation",
      header: (
        <span className="flex items-center gap-2">
          <PrecipitationIcon /> {t('columns.precipitation')}
        </span>
      ),
      cell: (value: number) => `${value.toFixed(1)} mm`,
    },
  ], [t, language]);
  
  const detailedTempColumns = useMemo(() => [
    {
      accessorKey: "time",
      header: (
        <span className="flex items-center gap-2">
          <DateIcon /> {t('columns.dateTime')}
        </span>
      ),
      cell: (value: string) => {
          const date = new Date(value);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'UTC', day: '2-digit', month: '2-digit' };
          let formattedDate = date.toLocaleDateString(language, options);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          return `${formattedDate.split(',')[0]}, ${date.toLocaleDateString(language, {timeZone: 'UTC', day: '2-digit', month: '2-digit'})} ${new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: 'UTC' })}`;
      },
    },
    {
      accessorKey: "temperature_2m",
      header: (
        <span className="flex items-center gap-2">
          <TemperatureIcon /> {t('columns.temp')}
        </span>
      ),
      cell: (value: number) => `${value.toFixed(1)}°C`,
    },
  ], [t, language]);

  const detailedHumidityColumns = useMemo(() => [
    {
      accessorKey: "time",
      header: (
        <span className="flex items-center gap-2">
          <DateIcon /> {t('columns.dateTime')}
        </span>
      ),
      cell: (value: string) => {
          const date = new Date(value);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'UTC', day: '2-digit', month: '2-digit' };
          let formattedDate = date.toLocaleDateString(language, options);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          return `${formattedDate.split(',')[0]}, ${date.toLocaleDateString(language, {timeZone: 'UTC', day: '2-digit', month: '2-digit'})} ${new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: 'UTC' })}`;
      },
    },
    {
      accessorKey: "relative_humidity_2m",
      header: (
        <span className="flex items-center gap-2">
          <HumidityIcon /> {t('columns.humidity')}
        </span>
      ),
      cell: (value: number) => `${value}%`,
    },
  ], [t, language]);
  
  const detailedPrecipColumns = useMemo(() => [
      {
      accessorKey: "time",
      header: (
        <span className="flex items-center gap-2">
          <DateIcon /> {t('columns.date')}
        </span>
      ),
      cell: (value: string) => {
          const date = new Date(value);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' };
          let formattedDate = date.toLocaleDateString(language, options);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          return formattedDate.split(',')[0] + ', ' + formattedDate.split(', ')[1];
      },
    },
    {
      accessorKey: "precipitation_sum",
      header: (
        <span className="flex items-center gap-2">
          <PrecipitationIcon /> {t('columns.precipitation')}
        </span>
      ),
      cell: (value: number) => `${value.toFixed(1)} mm`,
    },
     {
      accessorKey: "precipitation_probability_max",
      header: (
        <span className="flex items-center gap-2">
          <PrecipitationIcon /> {t('columns.precipChance')}
        </span>
      ),
      cell: (value: number) => `${value}%`,
    },
  ], [t, language]);

  const detailedRadiationColumns = useMemo(() => [
    {
      accessorKey: "time",
      header: (
        <span className="flex items-center gap-2">
          <DateIcon /> {t('columns.date')}
        </span>
      ),
      cell: (value: string) => {
          const date = new Date(value);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' };
          let formattedDate = date.toLocaleDateString(language, options);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          return formattedDate.split(',')[0] + ', ' + formattedDate.split(', ')[1];
      },
    },
    {
      accessorKey: "shortwave_radiation_sum",
      header: (
        <span className="flex items-center gap-2">
          <SunIcon /> {t('columns.solarRadiation')}
        </span>
      ),
      cell: (value: number) => value !== null ? `${value.toFixed(1)} MJ/m²` : 'N/D',
    },
  ], [t, language]);
  
  
  const soilTempColumns = useMemo(() => [
      {
      accessorKey: "time",
      header: (
        <span className="flex items-center gap-2">
          <DateIcon /> {t('columns.dateTime')}
        </span>
      ),
      cell: (value: string) => {
          const date = new Date(value);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'UTC', day: '2-digit', month: '2-digit' };
          let formattedDate = date.toLocaleDateString(language, options);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          return `${formattedDate.split(',')[0]}, ${date.toLocaleDateString(language, {timeZone: 'UTC', day: '2-digit', month: '2-digit'})} ${new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: 'UTC' })}`;
      },
    },
    {
      accessorKey: "soil_temperature_avg_0_20cm",
      header: (
        <span className="flex items-center gap-2">
          <Thermometer /> {t('columns.avg0_20cm')}
        </span>
      ),
      cell: (value: number | null) => value !== null ? `${value.toFixed(1)}°C` : 'N/D',
    },
  ], [t, language]);
  
  const soilMoistureColumns = useMemo(() => [
      {
      accessorKey: "time",
      header: (
        <span className="flex items-center gap-2">
          <DateIcon /> {t('columns.dateTime')}
        </span>
      ),
      cell: (value: string) => {
          const date = new Date(value);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'UTC', day: '2-digit', month: '2-digit' };
          let formattedDate = date.toLocaleDateString(language, options);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          return `${formattedDate.split(',')[0]}, ${date.toLocaleDateString(language, {timeZone: 'UTC', day: '2-digit', month: '2-digit'})} ${new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: 'UTC' })}`;
      },
    },
    {
      accessorKey: "soil_moisture_avg_0_20cm",
      header: (
        <span className="flex items-center gap-2">
          <Droplets /> {t('columns.avg0_20cm')}
        </span>
      ),
      cell: (value: number | null) => value !== null ? `${value.toFixed(2)} m³/m³` : 'N/D',
    },
  ], [t, language]);
  
  const windColumns = useMemo(() => [
      {
      accessorKey: "time",
      header: (
        <span className="flex items-center gap-2">
          <DateIcon /> {t('columns.dateTime')}
        </span>
      ),
      cell: (value: string) => {
          const date = new Date(value);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'UTC', day: '2-digit', month: '2-digit' };
          let formattedDate = date.toLocaleDateString(language, options);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          return `${formattedDate.split(',')[0]}, ${date.toLocaleDateString(language, {timeZone: 'UTC', day: '2-digit', month: '2-digit'})} ${new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: 'UTC' })}`;
      },
    },
    {
      accessorKey: "wind_speed_10m",
      header: (
        <span className="flex items-center gap-2">
          <WindIcon /> {t('columns.wind')}
        </span>
      ),
      cell: (value: number | null) => value !== null ? `${value.toFixed(1)} km/h` : 'N/D',
    },
  ], [t, language]);

  const waterBalanceColumns = useMemo(() => [
    {
      accessorKey: "time",
      header: (
        <span className="flex items-center gap-2">
          <DateIcon /> {t('columns.date')}
        </span>
      ),
      cell: (value: string) => {
          const date = new Date(value);
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' };
          let formattedDate = date.toLocaleDateString(language, options);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          return formattedDate.split(',')[0] + ', ' + formattedDate.split(', ')[1];
      },
    },
    {
      accessorKey: "precipitation_sum",
      header: (
        <span className="flex items-center gap-2">
          <PrecipitationIcon /> {t('columns.precipitation')}
        </span>
      ),
      cell: (value: number) => `${value.toFixed(1)} mm`,
    },
    {
        accessorKey: "et0_fao_evapotranspiration",
        header: (
          <span className="flex items-center gap-2">
            <SunIcon /> {t('columns.evapotranspiration')}
          </span>
        ),
        cell: (value: number) => `${value.toFixed(1)} mm`,
    },
    {
        accessorKey: "water_balance",
        header: (
          <span className="flex items-center gap-2">
            <Droplets /> {t('columns.waterBalance')}
          </span>
        ),
        cell: (value: number) => `${value.toFixed(1)} mm`,
    },
  ], [t, language]);

  const [activeSoilTab, setActiveSoilTab] = useState<'soil-temp' | 'soil-moisture'>("soil-temp");
  const [detailedSoilView, setDetailedSoilView] = useState<'soil-temp' | 'soil-moisture' | null>(null);
  const [currentStatus, setCurrentStatus] = useState<{temperature: number | null, precipitation: number | null, humidity: number | null, wind: number | null, precipChance: number | null, solarRadiation: number | null, waterBalance: number | null} | null>(null);
  const [currentHourly, setCurrentHourly] = useState<HourlyRow | null>(null);
  const [todayDaily, setTodayDaily] = useState<DailyRow | null>(null);
  const [detailedView, setDetailedView] = useState<'temperature' | 'precipitation' | 'wind' | 'humidity' | 'radiation' | 'water-balance' | null>(null);
  const [detailedSprayingView, setDetailedSprayingView] = useState(false);
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
  
  const CropIcon = selectedLocation?.crop ? LeafIcon : null;

  useEffect(() => {
    if(mainContainerRef.current) {
        mainContainerRef.current.scrollTo(0, 0);
    }
  }, [selectedLocation, detailedView]);
  
  useEffect(() => {
    if (loading || error || !dailyData.length || !hourlyData.length) {
      setCurrentHourly(null);
      setTodayDaily(null);
      return;
    };

    const now = new Date();
    const pastAndCurrentData = hourlyData.filter(h => new Date(h.time) <= now);
    const closestHourly = pastAndCurrentData.length > 0 ? pastAndCurrentData[pastAndCurrentData.length - 1] : null;

    setCurrentHourly(closestHourly);
    
    const today = new Date().toISOString().split('T')[0];
    const todayData = dailyData.find(d => d.time === today);
    setTodayDaily(todayData || null);
    
  }, [dailyData, hourlyData, loading, error]);

  useEffect(() => {
    if (!currentHourly || !todayDaily) {
      setCurrentStatus(null);
      return;
    }
    const waterBalance = (todayDaily.precipitation_sum ?? 0) - (todayDaily.et0_fao_evapotranspiration ?? 0);
    
    setCurrentStatus({
      temperature: currentHourly.temperature_2m,
      precipitation: todayDaily.precipitation_sum,
      humidity: currentHourly.relative_humidity_2m,
      wind: currentHourly.wind_speed_10m,
      precipChance: todayDaily.precipitation_probability_max,
      solarRadiation: todayDaily.shortwave_radiation_sum,
      waterBalance: waterBalance
    });

  }, [currentHourly, todayDaily]);


  useEffect(() => {
    if (dailyData.length === 0 || !currentHourly) return;

    const newNotifications: NotificationInfo[] = [];

    let consecutiveDryDays = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const pastDailyData = dailyData.filter(d => d.time <= todayStr).slice(-30);
    
    for (const day of pastDailyData) {
        if (day.precipitation_sum !== null && day.precipitation_sum < 1) { 
            consecutiveDryDays++;
        } else {
            consecutiveDryDays = 0; 
        }
    }
    if (consecutiveDryDays > 12) {
        const notif = {
            id: 'drought',
            type: 'warning' as const,
            title: t('mainView.alerts.droughtTitle'),
            message: t('mainView.alerts.droughtMessage', {days: consecutiveDryDays.toString()}),
            icon: <SunIcon className="h-5 w-5 text-yellow-500" />
        };
        newNotifications.push(notif);
    }

    const heavyRainDay = dailyData.find(d => d.precipitation_sum !== null && d.precipitation_sum > 80);
    if (heavyRainDay) {
        const date = new Date(heavyRainDay.time).toLocaleDateString(language, {timeZone: 'UTC'});
        const notif = {
            id: 'heavy-rain',
            type: 'warning' as const,
            title: t('mainView.alerts.heavyRainTitle'),
            message: t('mainView.alerts.heavyRainMessage', {amount: heavyRainDay.precipitation_sum?.toFixed(0) || 'N/A', date}),
            icon: <PrecipitationIcon className="h-5 w-5 text-blue-500" />
        };
        newNotifications.push(notif);
    }
    
    const strongWindHour = hourlyData.find(h => h.wind_speed_10m !== null && h.wind_speed_10m > 40);
    if (strongWindHour) {
         const date = new Date(strongWindHour.time);
         const formattedDate = date.toLocaleDateString(language, { timeZone: 'UTC', day: '2-digit', month: '2-digit' });
         const formattedTime = date.toLocaleTimeString(language, { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
        const notif = {
            id: 'strong-wind',
            type: 'warning' as const,
            title: t('strong-wind'),
            message: t('mainView.alerts.strongWindMessage', {speed: strongWindHour.wind_speed_10m?.toFixed(0) || 'N/A', date: formattedDate, time: formattedTime}),
            icon: <WindIcon className="h-5 w-5 text-gray-500" />
        };
        newNotifications.push(notif);
    }

    const frostDay = dailyData.find(d => d.temperature_2m_min !== null && d.temperature_2m_min <= 2);
    if (frostDay) {
        const date = new Date(frostDay.time).toLocaleDateString(language, {timeZone: 'UTC'});
        const notif = {
            id: 'frost',
            type: 'warning' as const,
            title: t('mainView.alerts.frostTitle'),
            message: t('mainView.alerts.frostMessage', {temp: frostDay.temperature_2m_min?.toFixed(1) || 'N/A', date}),
            icon: <Snowflake className="h-5 w-5 text-cyan-300" />
        };
        newNotifications.push(notif);
    }

    setNotifications(newNotifications);
  }, [dailyData, hourlyData, t, language, currentHourly]);

  const getNextHoursData = (hours: number) => {
    if (hourlyData.length === 0) return [];
    const now = new Date();
    
    const closestEntryIndex = hourlyData.findIndex(row => new Date(row.time) >= now);

    if (closestEntryIndex === -1) {
        return [];
    }
    
    const endIndex = Math.min(closestEntryIndex + hours, hourlyData.length);

    return hourlyData.slice(closestEntryIndex, endIndex);
  }

  const soilDataForNextHours = useMemo(() => getNextHoursData(5), [hourlyData]);
  
  const windDataForNext24Hours = useMemo(() => {
      if (hourlyData.length === 0) return [];
      const now = new Date();
      const closestEntryIndex = hourlyData.findIndex(row => new Date(row.time) >= now);

      if (closestEntryIndex === -1) {
          return [];
      }
      
      const endIndex = Math.min(closestEntryIndex + 25, hourlyData.length);
      return hourlyData.slice(closestEntryIndex, endIndex);
  }, [hourlyData]);

  const hourlyDataForNext72Hours = useMemo(() => getNextHoursData(73), [hourlyData]);

  if (loading && !dailyData.length) { 
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-start pt-8 sm:pt-0">
                 <Skeleton className="h-12 w-48" />
            </div>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
            </div>
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
        </div>
    );
  }


  if (error) {
    return (
        <div className="text-center p-4">
          <h2 className="text-xl font-bold text-destructive">{error}</h2>
          <p className="text-muted-foreground">{selectedLocation ? t('mainView.errorDescription', {locationName: selectedLocation.name}) : ""}</p>
        </div>
    )
  }

  if (!selectedLocation && locations.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center pt-32 space-y-8 animate-in fade-in zoom-in duration-500">
               <div className="text-center space-y-4 max-w-md px-4">
                 <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('mainView.noLocation.title')}</h2>
                 <p className="text-lg text-muted-foreground">{t('mainView.noLocation.description')}</p>
               </div>
               
               <LocationManager 
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onLocationSelect={onLocationSelect}
                    onLocationAdd={onLocationAdd}
                    onLocationUpdate={onLocationUpdate}
                    onLocationDelete={onLocationDelete}
                />
          </div>
      )
  }


  if (detailedSprayingView) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayIndex = dailyData.findIndex(d => d.time === todayStr);
    const next7Days = todayIndex !== -1 ? dailyData.slice(todayIndex, todayIndex + 7) : dailyData.slice(0, 7);
    
    const getDailySprayingCondition = (day: DailyRow, isToday: boolean) => {
        const temp = isToday && currentHourly?.temperature_2m != null ? currentHourly.temperature_2m : day.temperature_2m_max;
        const wind = isToday && currentHourly?.wind_speed_10m != null ? currentHourly.wind_speed_10m : day.wind_speed_10m_max;
        const humidity = isToday && currentHourly?.relative_humidity_2m != null ? currentHourly.relative_humidity_2m : day.relative_humidity_2m_min;
        const precipProb = day.precipitation_probability_max;
        const currentPrecip = isToday && currentHourly?.precipitation != null ? currentHourly.precipitation : null;

        const getWindStatus = (w: number | null) => {
          if (w === null) return 'ok';
          if (w < 10) return 'ok';
          if (w <= 15) return 'attention';
          return 'bad';
        };
        const getTempStatus = (tVal: number | null) => {
          if (tVal === null) return 'ok';
          if (tVal >= 10 && tVal <= 25) return 'ok';
          if (tVal > 25 && tVal <= 30) return 'attention';
          return 'bad';
        };
        const getRainStatus = (prob: number | null, curr: number | null) => {
          if (curr !== null && curr > 0) return 'bad';
          if (prob === null || prob < 20) return 'ok';
          if (prob <= 40) return 'attention';
          return 'bad';
        };
        const getHumidityStatus = (h: number | null) => {
          if (h === null) return 'ok';
          if (h < 55) return 'bad';
          if (h > 95) return 'bad';
          if (h >= 90) return 'attention';
          return 'ok';
        };

        const wStatus = getWindStatus(wind);
        const tStatus = getTempStatus(temp);
        const rStatus = getRainStatus(precipProb, currentPrecip);
        const hStatus = getHumidityStatus(humidity);

        if (wStatus === 'bad') return { text: t('spraying.unfavorable'), reason: t('spraying.daily.windBad'), Icon: XCircle, className: 'text-destructive' };
        if (tStatus === 'bad') return { text: t('spraying.unfavorable'), reason: t('spraying.daily.tempBad'), Icon: XCircle, className: 'text-destructive' };
        if (rStatus === 'bad') return { text: t('spraying.unfavorable'), reason: t('spraying.daily.rainBad'), Icon: XCircle, className: 'text-destructive' };
        if (hStatus === 'bad') return { text: t('spraying.unfavorable'), reason: t('spraying.daily.humidityBad'), Icon: XCircle, className: 'text-destructive' };
        
        if (wStatus === 'attention') return { text: t('spraying.attention'), reason: t('spraying.daily.windAttention'), Icon: AlertTriangle, className: 'text-yellow-500' };
        if (tStatus === 'attention') return { text: t('spraying.attention'), reason: t('spraying.daily.tempAttention'), Icon: AlertTriangle, className: 'text-yellow-500' };
        if (rStatus === 'attention') return { text: t('spraying.attention'), reason: t('spraying.daily.rainRisk'), Icon: AlertTriangle, className: 'text-yellow-500' };
        if (hStatus === 'attention') return { text: t('spraying.attention'), reason: t('spraying.daily.humidityAttention'), Icon: AlertTriangle, className: 'text-yellow-500' };

        return { text: t('spraying.favorable'), reason: t('spraying.daily.favorable'), Icon: CheckCircle2, className: 'text-green-600' };
    };


    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-bold flex items-center gap-2"><LeafIcon /> {t('spraying.sevenDayTitle')}</CardTitle>
            <Button onClick={() => setDetailedSprayingView(false)} variant="default">
              <ArrowLeft className="mr-2 h-4 w-4" />{t('mainView.back')}
            </Button>
          </div>
          <CardDescription>{t('spraying.sevenDayDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {next7Days.map((day, index) => {
              const isToday = index === 0;
              const condition = getDailySprayingCondition(day, isToday);
              const date = new Date(day.time + 'T00:00:00Z');
              const dayOfWeek = date.toLocaleDateString(language, { weekday: 'long', timeZone: 'UTC' });
              const formattedDate = date.toLocaleDateString(language, { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

              return (
                <li key={day.time} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="font-semibold capitalize">{dayOfWeek}, {formattedDate}</p>
                    <p className="text-sm text-muted-foreground">{condition.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <condition.Icon className={`h-6 w-6 ${condition.className}`} />
                    <span className={`font-bold ${condition.className}`}>{condition.text}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  }

  if(detailedView) {
    let cardTitle = '';
    let tableColumns: any[] = [];
    let tableData: any[] = [];
    let tableTabTitle = '';
    let tableIcon = null;
    let explanationText = '';

    switch(detailedView) {
        case 'temperature':
            cardTitle = t('mainView.details.tempTitle');
            tableColumns = detailedTempColumns;
            tableData = hourlyDataForNext72Hours;
            tableTabTitle = t('mainView.tabs.next72h');
            tableIcon = <Clock className="mr-2"/>;
            explanationText = t('mainView.details.tempDescription');
            break;
        case 'precipitation':
            cardTitle = t('mainView.details.precipTitle');
            tableColumns = detailedPrecipColumns;
            tableData = dailyData;
            tableTabTitle = t('mainView.tabs.dailyData');
            tableIcon = <DailyIcon className="mr-2"/>;
            explanationText = t('mainView.details.precipDescription');
            break;
        case 'wind':
            cardTitle = t('mainView.details.windTitle');
            tableColumns = windColumns;
            tableData = hourlyDataForNext72Hours;
            tableTabTitle = t('mainView.tabs.next72h');
            tableIcon = <WindIcon className="mr-2"/>;
            explanationText = t('mainView.details.windDescription');
            break;
        case 'humidity':
            cardTitle = t('mainView.details.humidityTitle');
            tableColumns = detailedHumidityColumns;
            tableData = hourlyDataForNext72Hours;
            tableTabTitle = t('mainView.tabs.next72h');
            tableIcon = <Clock className="mr-2"/>;
            explanationText = t('mainView.details.humidityDescription');
            break;
        case 'radiation':
            cardTitle = t('mainView.details.radiationTitle');
            tableColumns = detailedRadiationColumns;
            tableData = dailyData;
            tableTabTitle = t('mainView.tabs.dailyData');
            tableIcon = <DailyIcon className="mr-2"/>;
            explanationText = t('mainView.details.radiationDescription');
            break;
        case 'water-balance':
            cardTitle = t('mainView.details.waterBalanceTitle');
            const dailyDataWithBalance = dailyData.map(d => ({
                ...d,
                water_balance: (d.precipitation_sum ?? 0) - (d.et0_fao_evapotranspiration ?? 0),
            }));
            tableColumns = waterBalanceColumns;
            tableData = dailyDataWithBalance;
            tableTabTitle = t('mainView.tabs.dailyData');
            tableIcon = <DailyIcon className="mr-2"/>;
            explanationText = t('mainView.details.waterBalanceDescription');
            break;
    }


    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="font-bold">{cardTitle}</CardTitle>
                    <Button onClick={() => setDetailedView(null)} variant="default">
                        <ArrowLeft className="mr-2 h-4 w-4" />{t('mainView.back')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="chart" className="w-full">
                    <TabsList>
                        <TabsTrigger value="chart"><LineChartIcon className="mr-2"/>{t('mainView.chart')}</TabsTrigger>
                        <TabsTrigger value="table">{tableIcon}{tableTabTitle}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="chart">
                        <DetailedChart
                            metric={detailedView === 'radiation' ? 'radiation' : detailedView as any}
                            dailyData={dailyData}
                            hourlyData={windDataForNext24Hours}
                        />
                        {explanationText && (
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground border border-border">
                                <p className="font-semibold text-foreground mb-1">{t('mainView.details.fieldTip')}:</p>
                                {explanationText}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="table">
                        <DataTable columns={tableColumns} data={tableData} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
  }


  return (
    <div className="space-y-4" ref={mainContainerRef}>
        <div className="flex flex-col items-start pt-8 sm:pt-0">
            <div className="flex items-center gap-4">
                 <LocationManager 
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onLocationSelect={onLocationSelect}
                    onLocationAdd={onLocationAdd}
                    onLocationUpdate={onLocationUpdate}
                    onLocationDelete={onLocationDelete}
                />
                {selectedLocation?.crop && CropIcon && (
                  <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
                      <DialogTrigger asChild>
                          <div className="flex items-center gap-2 bg-card p-2 rounded-lg shadow-md cursor-pointer hover:bg-muted transition-colors">
                              <CropIcon className="h-6 w-6 text-green-600" />
                              <span className="text-sm font-semibold text-card-foreground">{t(`crops.${selectedLocation.crop}`)}</span>
                          </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                              <DialogTitle>{t('locationManager.editCropTitle')}</DialogTitle>
                              <DialogDescription>{t('locationManager.editCropDescription')}</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="crop-dialog" className="text-right">
                                      {t('locationManager.crop')}
                                  </Label>
                                  <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                                      <SelectTrigger id="crop-dialog" className="col-span-3">
                                          <SelectValue placeholder={t('locationManager.crop')} />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {crops.map(c => (
                                              <SelectItem key={c} value={c}>{t(`crops.${c}`)}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                          <DialogFooter>
                              <Button onClick={handleCropUpdate}>{t('locationManager.saveChanges')}</Button>
                          </DialogFooter>
                      </DialogContent>
                  </Dialog>
                )}
            </div>
            {lastUpdateTime && (
                 <div className="text-xs text-muted-foreground mt-2">
                    <span>{t('mainView.lastUpdate')}: {lastUpdateTime.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })} | </span> 
                    <span>{t('mainView.nextUpdate')}: {timeToNextUpdate}</span>
                </div>
            )}
        </div>

        {notifications.length > 0 && (
            <div className="space-y-4">
                {notifications.map(n => (
                    <Alert key={n.id} variant={n.type === 'warning' ? 'destructive' : 'default'}>
                        {n.icon}
                        <AlertTitle>{n.title}</AlertTitle>
                        <AlertDescription>{n.message}</AlertDescription>
                    </Alert>
                ))}
            </div>
        )}

        <div className="flex items-center justify-between mb-1">
             <p className="text-xs text-muted-foreground italic ml-1">{t('mainView.clickForDetails')}</p>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDetailedView('temperature')}>
                <CardHeader className="p-4">
                    <div className="flex flex-row items-center justify-between">
                         <CardTitle className="text-xs sm:text-sm font-bold">{t('mainView.airTemp')}</CardTitle>
                         <TemperatureIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
                    </div>
                    <CardDescription className="text-xs pt-1">{todayDateString}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-xl sm:text-2xl font-bold">{currentStatus?.temperature?.toFixed(1)}°C</div>
                    <p className="text-xs text-muted-foreground">{t('mainView.currentTemp')}</p>
                </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDetailedView('humidity')}>
                <CardHeader className="p-4">
                    <div className="flex flex-row items-center justify-between">
                         <CardTitle className="text-xs sm:text-sm font-bold">{t('mainView.airHumidity')}</CardTitle>
                         <HumidityIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                    </div>
                     <CardDescription className="text-xs pt-1">{todayDateString}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-xl sm:text-2xl font-bold">{currentStatus?.humidity?.toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground">{t('mainView.currentHumidity')}</p>
                </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDetailedView('precipitation')}>
                <CardHeader className="p-4">
                    <div className="flex flex-row items-center justify-between">
                         <CardTitle className="text-xs sm:text-sm font-bold">{t('mainView.precipitation')}</CardTitle>
                         <PrecipitationIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                    </div>
                     <CardDescription className="text-xs pt-1">{todayDateString}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-xl sm:text-2xl font-bold">{currentStatus?.precipitation?.toFixed(1)} mm</div>
                    <p className="text-xs text-muted-foreground">{t('mainView.accumulatedDay')}</p>
                    {currentStatus?.precipChance !== null && typeof currentStatus?.precipChance !== 'undefined' && (
                       <p className="text-xs text-muted-foreground">{t('mainView.precipChance')} {currentStatus.precipChance}%</p>
                    )}
                </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDetailedView('wind')}>
                <CardHeader className="p-4">
                    <div className="flex flex-row items-center justify-between">
                         <CardTitle className="text-xs sm:text-sm font-bold">{t('mainView.wind')}</CardTitle>
                         <WindIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                    </div>
                    <CardDescription className="text-xs pt-1">{todayDateString}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                     <div className="text-xl sm:text-2xl font-bold">{currentStatus?.wind?.toFixed(1)} km/h</div>
                    <p className="text-xs text-muted-foreground">{t('mainView.currentSpeed')}</p>
                </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDetailedView('radiation')}>
                <CardHeader className="p-4">
                    <div className="flex flex-row items-center justify-between">
                         <CardTitle className="text-xs sm:text-sm font-bold">{t('mainView.solarRadiation')}</CardTitle>
                         <SunIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                    </div>
                    <CardDescription className="text-xs pt-1">{todayDateString}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                     <div className="text-xl sm:text-2xl font-bold">{currentStatus?.solarRadiation?.toFixed(1) ?? 'N/A'} MJ/m²</div>
                    <p className="text-xs text-muted-foreground">{t('mainView.accumulatedRadiation')}</p>
                </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setDetailedView('water-balance')}>
                <CardHeader className="p-4">
                    <div className="flex flex-row items-center justify-between">
                         <CardTitle className="text-xs sm:text-sm font-bold">{t('mainView.waterBalance')}</CardTitle>
                         <Droplets className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                    </div>
                    <CardDescription className="text-xs pt-1">{todayDateString}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                     <div className="text-xl sm:text-2xl font-bold">{currentStatus?.waterBalance?.toFixed(1) ?? 'N/A'} mm</div>
                    <p className="text-xs text-muted-foreground">{t('mainView.waterBalanceDay')}</p>
                </CardContent>
            </Card>
        </div>
        
        {currentHourly && todayDaily && (
          <div onClick={() => setDetailedSprayingView(true)}>
            <SprayingConditions currentHour={currentHourly} today={todayDaily} hourlyData={hourlyData}/>
          </div>
        )}

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader>
                <CardTitle>{t('mainView.soil')}</CardTitle>
                <CardDescription>{t('mainView.soilDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                {detailedSoilView ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">
                                {detailedSoilView === 'soil-temp' ? t('mainView.details.soilTempTitle') : t('mainView.details.soilMoistureTitle')}
                            </h3>
                            <Button onClick={() => setDetailedSoilView(null)} variant="default">
                                <ArrowLeft className="mr-2 h-4 w-4" />{t('mainView.back')}
                            </Button>
                        </div>
                        <Tabs defaultValue="chart">
                            <TabsList>
                                <TabsTrigger value="chart"><LineChartIcon className="mr-2"/>{t('mainView.chart')}</TabsTrigger>
                                <TabsTrigger value="table"><Clock className="mr-2"/>{t('mainView.hourly')}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="chart" className="pt-4">
                                <DetailedChart metric={detailedSoilView} dailyData={[]} hourlyData={hourlyData} />
                                <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground border border-border">
                                    <p className="font-semibold text-foreground mb-1">{t('mainView.details.fieldTip')}:</p>
                                    {detailedSoilView === 'soil-temp' ? t('mainView.details.soilTempDescription') : t('mainView.details.soilMoistureDescription')}
                                </div>
                            </TabsContent>
                            <TabsContent value="table" className="pt-4">
                                <DataTable 
                                    columns={detailedSoilView === 'soil-temp' ? soilTempColumns : soilMoistureColumns} 
                                    data={hourlyData} 
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <Tabs
                        value={activeSoilTab}
                        onValueChange={(value) => setActiveSoilTab(value as 'soil-temp' | 'soil-moisture')}
                        className="w-full"
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <TabsList>
                            <TabsTrigger 
                                value="soil-temp"
                                style={activeSoilTab === 'soil-temp' 
                                    ? { backgroundColor: '#166534', color: 'white' } 
                                    : { backgroundColor: '#D1FAE5', color: '#064E3B' }}
                            >
                                <SoilTempIcon className="mr-2" />{t('mainView.soilTemp')}
                            </TabsTrigger>
                            <TabsTrigger 
                                value="soil-moisture"
                                style={activeSoilTab === 'soil-moisture' 
                                    ? { backgroundColor: '#166534', color: 'white' } 
                                    : { backgroundColor: '#D1FAE5', color: '#064E3B' }}
                            >
                                <SoilMoistureIcon className="mr-2" />{t('mainView.soilMoisture')}
                            </TabsTrigger>
                            </TabsList>
                            <Button onClick={() => setDetailedSoilView(activeSoilTab)} variant="default">{t('mainView.viewFullData')}</Button>
                        </div>
                        <TabsContent value="soil-temp">
                            <DataTable columns={soilTempColumns} data={soilDataForNextHours} />
                        </TabsContent>
                        <TabsContent value="soil-moisture">
                            <DataTable columns={soilMoistureColumns} data={soilDataForNextHours} />
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
