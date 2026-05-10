"use client";

import { useLanguage } from "@/context/language-context";
import type { HourlyRow, DailyRow } from "@/lib/weather-processing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { LeafIcon, TemperatureIcon, WindIcon, PrecipitationIcon, HumidityIcon } from "../icons";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type SprayingConditionsProps = {
  currentHour: HourlyRow;
  today: DailyRow;
  hourlyData: HourlyRow[];
};

export function SprayingConditions({ currentHour, today, hourlyData }: SprayingConditionsProps) {
  const { t, language } = useLanguage();

  const { 
    wind_speed_10m: wind, 
    temperature_2m: temp, 
    precipitation: currentPrecip,
    relative_humidity_2m: humidity
  } = currentHour;
  
  const { precipitation_probability_max: precipProb } = today;

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
    if (prob === null) return 'ok';
    if (prob < 20) return 'ok';
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

  const windStatus = getWindStatus(wind);
  const tempStatus = getTempStatus(temp);
  const rainStatus = getRainStatus(precipProb, currentPrecip);
  const humidityStatus = getHumidityStatus(humidity);

  const isFavorable = windStatus === 'ok' && tempStatus === 'ok' && rainStatus === 'ok' && humidityStatus === 'ok';
  const isBad = windStatus === 'bad' || tempStatus === 'bad' || rainStatus === 'bad' || humidityStatus === 'bad';
  const isAttention = !isBad && !isFavorable;

  const findNextFavorableTime = () => {
    if (isFavorable || !hourlyData) return null;

    const now = new Date();
    const startIndex = hourlyData.findIndex(h => new Date(h.time) > now);

    if(startIndex === -1) return null;

    for(let i = startIndex; i < startIndex + 24 && i < hourlyData.length; i++) {
        const hour = hourlyData[i];
        const dayString = hour.time.split('T')[0];
        const dayData = today.time === dayString ? today : undefined; 

        const fWind = getWindStatus(hour.wind_speed_10m);
        const fTemp = getTempStatus(hour.temperature_2m);
        const fRain = getRainStatus(dayData?.precipitation_probability_max ?? 0, hour.precipitation);
        const fHumidity = getHumidityStatus(hour.relative_humidity_2m);

        if(fWind === 'ok' && fTemp === 'ok' && fRain === 'ok' && fHumidity === 'ok') {
            return new Date(hour.time);
        }
    }
    return null;
  };

  const nextFavorableTime = findNextFavorableTime();

  const getGlobalStatus = () => {
    if (isBad) return { text: t('spraying.unfavorable'), Icon: XCircle, className: 'text-destructive' };
    if (isAttention) return { text: t('spraying.attention'), Icon: AlertTriangle, className: 'text-yellow-500' };
    return { text: t('spraying.favorable'), Icon: CheckCircle2, className: 'text-green-600' };
  };

  const { text, Icon, className } = getGlobalStatus();
  
  const renderConditionRow = (
    status: 'ok' | 'attention' | 'bad',
    IconComponent: React.ElementType,
    value: number | null,
    unit: string,
    labelOk: string,
    labelAttention: string,
    labelBad: string
  ) => {
    const StatusIcon = status === 'ok' ? CheckCircle2 : status === 'attention' ? AlertTriangle : XCircle;
    const colorClass = status === 'ok' ? 'text-green-600' : status === 'attention' ? 'text-yellow-500' : 'text-destructive';
    const textLabel = status === 'ok' ? labelOk : status === 'attention' ? labelAttention : labelBad;

    return (
      <div className="flex items-center justify-between p-2 rounded-md bg-background">
        <div className="flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{value !== null ? `${value.toFixed(1)}${unit}` : 'N/D'}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${colorClass}`} />
          <span className={`text-sm font-medium ${colorClass}`}>{textLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-600 cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-bold">
            <LeafIcon /> {t('spraying.title')}
          </span>
           <div className="flex items-center gap-2">
            <Icon className={`h-8 w-8 ${className.replace('text-', '')}`} />
            <p className={`font-bold text-lg ${className}`}>{text}</p>
          </div>
        </CardTitle>
        <CardDescription className="text-xs text-center pt-2">
           {t('spraying.clickFor7DayForecast')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {renderConditionRow(windStatus, WindIcon, wind, ' km/h', t('spraying.reasons.windOk'), t('spraying.reasons.windAttention'), t('spraying.reasons.windNotOk'))}
        {renderConditionRow(tempStatus, TemperatureIcon, temp, '°C', t('spraying.reasons.tempOk'), t('spraying.reasons.tempAttention'), t('spraying.reasons.tempNotOk'))}
        {renderConditionRow(humidityStatus, HumidityIcon, humidity, '%', t('spraying.reasons.humidityOk'), t('spraying.reasons.humidityAttention'), t('spraying.reasons.humidityNotOk'))}
        
        <div className="flex items-center justify-between p-2 rounded-md bg-background">
          <div className="flex items-center gap-2">
            <PrecipitationIcon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{precipProb}% {t('columns.precipChance')}</span>
          </div>
          <div className="flex items-center gap-2">
            {rainStatus === 'ok' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : rainStatus === 'attention' ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
            <span className={`text-sm font-medium ${rainStatus === 'ok' ? 'text-green-600' : rainStatus === 'attention' ? 'text-yellow-500' : 'text-destructive'}`}>
              {rainStatus === 'ok' ? t('spraying.reasons.rainOk') : rainStatus === 'attention' ? t('spraying.reasons.rainRisk') : t('spraying.reasons.rainNotOk')}
            </span>
          </div>
        </div>

        {!isFavorable && nextFavorableTime && (
            <p className="text-xs text-center pt-2 text-muted-foreground">
                {t('spraying.nextFavorableTime', { time: nextFavorableTime.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC'})})}
            </p>
        )}
      </CardContent>
    </Card>
  );
}
