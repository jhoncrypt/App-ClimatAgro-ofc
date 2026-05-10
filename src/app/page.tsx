
"use client";

import { MainView } from "@/components/meteo-viz/main-view";
import { WelcomeScreen } from "@/components/meteo-viz/welcome-screen";
import { Notes } from "@/components/meteo-viz/notes";
import { EventCalendar } from "@/components/meteo-viz/event-calendar";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Location, DailyRow, HourlyRow } from "@/lib/types";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/context/language-context";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { fetchWeatherData } from "@/lib/weather";
import { processWeatherData } from "@/lib/weather-processing";
import { setupFirebaseMessaging } from "@/lib/firebase-messaging";

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showMainApp, setShowMainApp] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { t } = useLanguage();
  const mainContainerRef = useRef<HTMLDivElement>(null);
  
  const [dailyData, setDailyData] = useState<DailyRow[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  useEffect(() => {
    setupFirebaseMessaging();
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedLocation) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const rawData = await fetchWeatherData(selectedLocation.latitude, selectedLocation.longitude);
      if (rawData) {
        const { daily, hourly } = processWeatherData(rawData);
        setDailyData(daily);
        setHourlyData(hourly);
        setLastUpdateTime(new Date());
      } else {
        setError(t('mainView.errorTitle'));
      }
    } catch (err) {
      setError(t('mainView.errorTitle'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, t]);

  useEffect(() => {
    if (selectedLocation) {
      loadData();
    }
  }, [selectedLocation, loadData]);

  useEffect(() => {
    const initApp = () => {
      try {
        const savedLocations = localStorage.getItem("agroclima_locations");
        if (savedLocations) {
          const parsedLocations: Location[] = JSON.parse(savedLocations);
          if (Array.isArray(parsedLocations) && parsedLocations.length > 0) {
            setLocations(parsedLocations);
            
            const lastSelectedId = localStorage.getItem("agroclima_last_selected");
            let locationToSelect = parsedLocations.find(l => l.id === lastSelectedId);
            
            if (!locationToSelect) {
              locationToSelect = parsedLocations[0];
            }

            setSelectedLocation(locationToSelect);
            // Removido setShowMainApp(true) para sempre mostrar a WelcomeScreen primeiro
          }
        }
      } catch (e) {
        console.error("Failed to parse locations from localStorage", e);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    if (!selectedLocation && locations.length > 0) {
      setLoading(false);
    }
  }, [selectedLocation, locations]);

  const handleLocationSelect = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    if (location) {
      setSelectedLocation(location);
      localStorage.setItem("agroclima_last_selected", location.id);
    }
  };

  const handleLocationAdd = (newLocation: Omit<Location, 'id'>) => {
    const locationWithId = { ...newLocation, id: Date.now().toString() };
    const updatedLocations = [...locations, locationWithId];
    setLocations(updatedLocations);
    setSelectedLocation(locationWithId);
    localStorage.setItem("agroclima_locations", JSON.stringify(updatedLocations));
    localStorage.setItem("agroclima_last_selected", locationWithId.id);
    if (!showMainApp) {
        setShowMainApp(true);
    }
  };
  
  const handleLocationDelete = (locationId: string) => {
    const updatedLocations = locations.filter(l => l.id !== locationId);
    setLocations(updatedLocations);
    localStorage.setItem("agroclima_locations", JSON.stringify(updatedLocations));
    if (selectedLocation?.id === locationId) {
      const newSelection = updatedLocations.length > 0 ? updatedLocations[0] : null;
      setSelectedLocation(newSelection);
      if (newSelection) {
        localStorage.setItem("agroclima_last_selected", newSelection.id);
      } else {
        localStorage.removeItem("agroclima_last_selected");
        setShowMainApp(false);
      }
    }
  };
  
  const handleLocationUpdate = (updatedLocation: Location) => {
    const updatedLocations = locations.map(l => l.id === updatedLocation.id ? updatedLocation : l);
    setLocations(updatedLocations);
    localStorage.setItem("agroclima_locations", JSON.stringify(updatedLocations));
    if (selectedLocation?.id === updatedLocation.id) {
        setSelectedLocation(updatedLocation);
    }
  };

  useEffect(() => {
    if(mainContainerRef.current) {
        mainContainerRef.current.scrollTo(0, 0);
    }
  }, [selectedLocation]);

  if (isInitialLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
  }

  if (!showMainApp) {
    return <WelcomeScreen onEnter={() => setShowMainApp(true)} />;
  }

  return (
    <div ref={mainContainerRef} className="flex-1 overflow-auto">
       <div className="relative bg-muted/30 dark:bg-muted/30 min-h-screen">
        <div className="container mx-auto p-2 sm:p-4 space-y-4">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeSwitcher />
            </div>
            {selectedLocation ? (
            <>
              <MainView 
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                onLocationAdd={handleLocationAdd}
                onLocationUpdate={handleLocationUpdate}
                onLocationDelete={handleLocationDelete}
                dailyData={dailyData}
                hourlyData={hourlyData}
                loading={loading}
                error={error}
                lastUpdateTime={lastUpdateTime}
                onRefresh={loadData}
              />
              <EventCalendar key={`calendar-${selectedLocation.id}`} locationId={selectedLocation.id} />
              <Notes key={`notes-${selectedLocation.id}`} locationId={selectedLocation.id} />
            </>
          ) : (
             <div className="text-center py-10 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center">
              <h2 className="text-2xl font-semibold text-foreground dark:text-white">{t('mainView.noLocation.title')}</h2>
              <p className="text-muted-foreground dark:text-gray-300 mt-2 mb-4">{t('mainView.noLocation.description')}</p>
               <MainView 
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                onLocationAdd={handleLocationAdd}
                onLocationUpdate={handleLocationUpdate}
                onLocationDelete={handleLocationDelete}
                dailyData={dailyData}
                hourlyData={hourlyData}
                loading={loading}
                error={error}
                lastUpdateTime={lastUpdateTime}
                onRefresh={loadData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
