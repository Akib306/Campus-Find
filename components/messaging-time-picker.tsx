'use client';

import { useState, useEffect } from 'react';
import { MessagingService, PickupOption } from '@/lib/messaging-service';

interface MessagingTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (timeSlot: PickupOption) => void;
}

export function MessagingTimePicker({ isOpen, onClose, onTimeSelect }: MessagingTimePickerProps) {
  const [timeSlots, setTimeSlots] = useState<PickupOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTimeSlots();
    }
  }, [isOpen]);

  const loadTimeSlots = async () => {
    try {
      const timeOptions = await MessagingService.getPickupOptions('time_slot');
      setTimeSlots(timeOptions);
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-sm max-h-96 overflow-y-auto text-gray-900">
        <h3 className="text-lg font-semibold mb-4">Choose Time Slot</h3>
        
        {loading ? (
          <div className="text-center">Loading time slots...</div>
        ) : (
          <div className="space-y-2">
            {timeSlots.map((timeSlot) => (
              <button
                key={timeSlot.id}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-gray-900"
                onClick={() => onTimeSelect(timeSlot)}
              >
                <div className="font-medium">{timeSlot.display_text}</div>
              </button>
            ))}
          </div>
        )}
        
        <button
          className="w-full mt-4 p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
