
"use client";

import { useState } from 'react';
import type { Location } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronsUpDown, Edit, PlusCircle, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

type LocationManagerProps = {
  locations: Location[];
  selectedLocation: Location | null;
  onLocationSelect: (locationId: string) => void;
  onLocationAdd: (newLocation: Omit<Location, 'id'>) => void;
  onLocationUpdate: (location: Location) => void;
  onLocationDelete: (locationId: string) => void;
};

const crops = ['none', 'soy', 'corn', 'sugarcane', 'coffee', 'bean', 'cotton', 'orange', 'wheat'];

export function LocationManager({
  locations,
  selectedLocation,
  onLocationSelect,
  onLocationAdd,
  onLocationUpdate,
  onLocationDelete,
}: LocationManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [crop, setCrop] = useState('none');
  const { t } = useLanguage();

  const handleAddOrUpdateLocation = () => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (locationName && !isNaN(lat) && !isNaN(lon)) {
      const locationData = { name: locationName, latitude: lat, longitude: lon, crop: crop === 'none' ? undefined : crop };
      if (editingLocation) {
        onLocationUpdate({ ...editingLocation, ...locationData });
      } else {
        onLocationAdd(locationData);
      }
      resetForm();
      setDialogOpen(false);
    } else {
      alert(t('locationManager.formAlert'));
    }
  };

  const openEditDialog = (e: React.MouseEvent, location: Location) => {
    e.stopPropagation();
    setEditingLocation(location);
    setLocationName(location.name);
    setLatitude(location.latitude.toString());
    setLongitude(location.longitude.toString());
    setCrop(location.crop || 'none');
    setDialogOpen(true);
  };
  
  const openAddDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLocation(null);
    setLocationName('');
    setLatitude('');
    setLongitude('');
    setCrop('none');
  };

  const renderDialogContent = () => (
    <>
       <DialogHeader>
            <DialogTitle>{editingLocation ? t('locationManager.editProperty') : t('locationManager.addPropertyTitle')}</DialogTitle>
            <DialogDescription>{t('locationManager.addPropertyDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">{t('locationManager.propertyName')}</Label>
                <Input id="name" value={locationName} onChange={(e) => setLocationName(e.target.value)} className="col-span-3" placeholder={t('locationManager.propertyNamePlaceholder')} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="latitude" className="text-right">{t('locationManager.latitude')}</Label>
                <Input id="latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} className="col-span-3" placeholder="-23.5505" type="number" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="longitude" className="text-right">{t('locationManager.longitude')}</Label>
                <Input id="longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} className="col-span-3" placeholder="-46.6333" type="number" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="crop" className="text-right">{t('locationManager.crop')}</Label>
                <Select value={crop} onValueChange={setCrop}>
                    <SelectTrigger className="col-span-3">
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
            <Button onClick={handleAddOrUpdateLocation}>{editingLocation ? t('locationManager.saveChanges') : t('locationManager.addProperty')}</Button>
        </DialogFooter>
    </>
  )

  // If there are no locations, show a simple "Add Property" button
  if (locations.length === 0) {
    return (
        <Dialog open={dialogOpen} onOpenChange={(isOpen) => { setDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
                 <Button className="h-12 px-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    {t('locationManager.addPropertyLatLong')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                {renderDialogContent()}
            </DialogContent>
        </Dialog>
    );
  }


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="bg-card p-2 rounded-lg shadow-md inline-flex items-center cursor-pointer hover:bg-muted transition-colors">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-card-foreground truncate">{selectedLocation?.name || t('locationManager.myProperties')}</h2>
            <ChevronsUpDown className="ml-2 h-5 w-5 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel>{t('locationManager.myProperties')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={selectedLocation?.id} onValueChange={onLocationSelect}>
            {locations.map((location) => (
              <DropdownMenuRadioItem
                key={location.id}
                value={location.id}
                className="flex justify-between items-center pr-2"
                onSelect={(e) => e.preventDefault()} // Prevent closing on select
              >
                <span>{location.name}</span>
                <div className='flex items-center'>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEditDialog(e, location)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onLocationDelete(location.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Button variant="ghost" className="w-full justify-start" onClick={openAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('locationManager.addProperty')}
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={(isOpen) => { setDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}
