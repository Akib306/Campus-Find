'use client';

import { useState, useEffect } from 'react';
import { MessagingService, PickupOption } from '@/lib/messaging-service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface MessagingLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: PickupOption) => void;
}

export function MessagingLocationPicker({ isOpen, onClose, onLocationSelect }: MessagingLocationPickerProps) {
  const [locations, setLocations] = useState<PickupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      void loadLocations();
    }
  }, [isOpen]);

  const loadLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const locationOptions = await MessagingService.getPickupOptions('location');
      setLocations(locationOptions);
    } catch (error) {
      console.error('Error loading locations:', error);
      setError('Could not load pickup locations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose Pickup Location</DialogTitle>
          <DialogDescription>
            Select where you want to meet for the item return.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pickup locations are available.
          </p>
        ) : (
          <div className="space-y-2">
            {locations.map((location) => (
              <Button
                key={location.id}
                type="button"
                variant="outline"
                className="h-auto w-full justify-start whitespace-normal px-3 py-3 text-left"
                onClick={() => onLocationSelect(location)}
              >
                {location.display_text}
              </Button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
