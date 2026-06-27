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

interface MessagingTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (timeSlot: PickupOption) => void;
}

export function MessagingTimePicker({ isOpen, onClose, onTimeSelect }: MessagingTimePickerProps) {
  const [timeSlots, setTimeSlots] = useState<PickupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      void loadTimeSlots();
    }
  }, [isOpen]);

  const loadTimeSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const timeOptions = await MessagingService.getPickupOptions('time_slot');
      setTimeSlots(timeOptions);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setError('Could not load time slots.');
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
          <DialogTitle>Choose Time Slot</DialogTitle>
          <DialogDescription>
            Select a pickup window that works for the meeting.
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
        ) : timeSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pickup times are available.
          </p>
        ) : (
          <div className="space-y-2">
            {timeSlots.map((timeSlot) => (
              <Button
                key={timeSlot.id}
                type="button"
                variant="outline"
                className="h-auto w-full justify-start whitespace-normal px-3 py-3 text-left"
                onClick={() => onTimeSelect(timeSlot)}
              >
                {timeSlot.display_text}
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
