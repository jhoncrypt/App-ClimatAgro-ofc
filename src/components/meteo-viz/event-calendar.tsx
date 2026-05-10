
"use client";

import { useState, useEffect } from "react";
import { format, startOfDay, isEqual } from "date-fns";
import { ptBR, enUS, es } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Droplets, Snowflake, Wind, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CalendarEvent } from "@/lib/types";
import { useLanguage } from "@/context/language-context";

type EventCalendarProps = {
  locationId: string;
};

const locales: Record<string, Locale> = { pt: ptBR, en: enUS, es };

export function EventCalendar({ locationId }: EventCalendarProps) {
  const [events, setEvents] = useState<Record<string, CalendarEvent>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();
  const { language, t } = useLanguage();

  const storageKey = `agroclima_events_${locationId}`;

  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem(storageKey);
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
    } catch (e) {
      console.error("Failed to read events from localStorage", e);
    }
  }, [storageKey]);

  useEffect(() => {
    // When the popover is closed (e.g., by clicking outside), clear the selected date.
    if (!popoverOpen) {
      setSelectedDate(undefined);
    }
  }, [popoverOpen]);


  const handleSaveEvents = (newEvents: Record<string, CalendarEvent>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (e) {
      console.error("Failed to save events to localStorage", e);
      toast({
        variant: "destructive",
        title: t('eventCalendar.saveErrorTitle'),
        description: t('eventCalendar.saveErrorDescription'),
      });
    }
  };
  
  const handleSaveWithToast = (newEvents: Record<string, CalendarEvent>) => {
      handleSaveEvents(newEvents);
      toast({
        title: t('eventCalendar.saveSuccessTitle'),
        description: t('eventCalendar.saveSuccessDescription'),
      });
  };

  const handleDeleteEvent = (dateKey: string) => {
    const updatedEvents = { ...events };
    delete updatedEvents[dateKey];
    handleSaveEvents(updatedEvents); // No toast on delete to avoid clutter
  };

  const handleDayClick = (day: Date) => {
    // If the clicked day is already selected, close the popover.
    if (selectedDate && isEqual(startOfDay(day), startOfDay(selectedDate))) {
      setPopoverOpen(false);
      // The useEffect above will handle clearing the selectedDate.
    } else {
      setSelectedDate(day);
      setPopoverOpen(true);
    }
  };
  
  const handleEventChange = (date: Date, field: keyof CalendarEvent, value: string | number | boolean) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const updatedEvents = { ...events };
      if (!updatedEvents[dateKey]) {
          updatedEvents[dateKey] = { tasks: "", precipitation: 0, frostDamage: false, windDamage: false };
      }
      (updatedEvents[dateKey] as any)[field] = value;
      // We save directly without toast, the main save button will show the toast.
      handleSaveEvents(updatedEvents); 
  };

  const currentEvent = selectedDate ? events[format(selectedDate, "yyyy-MM-dd")] : undefined;

  const eventDays = Object.keys(events)
    .filter(dateStr => {
        const event = events[dateStr];
        return event.tasks || event.precipitation > 0 || event.frostDamage || event.windDamage;
    })
    .map(dateStr => startOfDay(new Date(`${dateStr}T00:00:00`)));


  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <CalendarDays /> {t('eventCalendar.title')}
        </CardTitle>
        <CardDescription>
            {t('eventCalendar.description')}
        </CardDescription>
        <p className="text-xs text-muted-foreground italic mt-1">{t('eventCalendar.clickOnDay')}</p>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-8 items-center justify-center">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverAnchor asChild>
                <div className="flex justify-center w-full">
                  <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      onDayClick={handleDayClick}
                      className="rounded-md border"
                      locale={locales[language]}
                      modifiers={{
                          hasEvent: eventDays,
                      }}
                      modifiersStyles={{
                          hasEvent: { 
                              color: 'hsl(var(--primary-foreground))',
                              backgroundColor: 'hsl(var(--calendar-event))'
                          },
                      }}
                      />
                </div>
            </PopoverAnchor>
          <PopoverContent className="w-80" align="start">
             {selectedDate && (
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">{format(selectedDate, "PPP", { locale: locales[language] })}</h4>
                        <p className="text-sm text-muted-foreground">
                        {t('eventCalendar.popoverTitle')}
                        </p>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="tasks">{t('eventCalendar.notesTasks')}</Label>
                        <Textarea 
                            id="tasks" 
                            placeholder={t('eventCalendar.notesTasksPlaceholder')}
                            value={currentEvent?.tasks || ""}
                            onChange={(e) => handleEventChange(selectedDate, 'tasks', e.target.value)}
                        />
                     </div>
                     <div className="grid gap-2">
                        <Label htmlFor="precipitation" className="flex items-center gap-2"><Droplets size={16}/>{t('eventCalendar.localPrecipitation')}</Label>
                        <Input 
                            id="precipitation" 
                            type="number"
                            placeholder={t('eventCalendar.precipitationPlaceholder')}
                            value={currentEvent?.precipitation || ""}
                            onChange={(e) => handleEventChange(selectedDate, 'precipitation', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="frost" 
                                checked={currentEvent?.frostDamage || false}
                                onCheckedChange={(checked) => handleEventChange(selectedDate, 'frostDamage', !!checked)}
                            />
                            <Label htmlFor="frost" className="flex items-center gap-2"><Snowflake size={16}/>{t('eventCalendar.frostDamage')}</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="wind"
                                checked={currentEvent?.windDamage || false}
                                onCheckedChange={(checked) => handleEventChange(selectedDate, 'windDamage', !!checked)}
                            />
                            <Label htmlFor="wind" className="flex items-center gap-2"><Wind size={16}/>{t('eventCalendar.windDamage')}</Label>
                        </div>
                     </div>
                     <Button onClick={() => {
                       handleSaveWithToast(events);
                       setPopoverOpen(false);
                     }} className="w-full mt-4">{t('notes.saveButton')}</Button>
                </div>
            )}
          </PopoverContent>
        </Popover>
         <div className="w-full lg:max-w-md space-y-4">
            <h3 className="font-semibold">{t('eventCalendar.recentEvents')}</h3>
            {Object.keys(events).length === 0 || eventDays.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('eventCalendar.noEvents')}</p>
            ) : (
                 <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {Object.entries(events)
                        .map(([date, event]) => ({ date: new Date(`${date}T00:00:00`), dateKey: date, ...event }))
                        .filter(event => event.tasks || event.precipitation > 0 || event.frostDamage || event.windDamage)
                        .sort((a,b) => b.date.getTime() - a.date.getTime())
                        .slice(0, 10)
                        .map(({ date, dateKey, tasks, precipitation, frostDamage, windDamage}) => (
                        <li key={dateKey} className="text-sm p-3 rounded-md border bg-muted/50 flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{format(date, "PPP", { locale: locales[language] })}</p>
                                {tasks && <p className="text-muted-foreground mt-1">&quot;{tasks}&quot;</p>}
                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                                    {precipitation > 0 && <span className="flex items-center gap-1"><Droplets size={14}/> {precipitation}mm</span>}
                                    {frostDamage && <span className="flex items-center gap-1 text-blue-500"><Snowflake size={14}/> {t('eventCalendar.frost')}</span>}
                                    {windDamage && <span className="flex items-center gap-1 text-gray-500"><Wind size={14}/> {t('eventCalendar.strongWind')}</span>}
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDayClick(date)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>{t('eventCalendar.edit')}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteEvent(dateKey)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>{t('eventCalendar.remove')}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </li>
                    ))}
                 </ul>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
