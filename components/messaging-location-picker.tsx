'use client';

import { useState, useEffect } from 'react';
import { MessagingService, PickupOption } from '@/lib/messaging-service';

interface MessagingLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: PickupOption) => void;
}

export function MessagingLocationPicker({ isOpen, onClose, onLocationSelect }: MessagingLocationPickerProps) {
  const [locations, setLocations] = useState<PickupOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadLocations();
    }
  }, [isOpen]);

  const loadLocations = async () => {
    try {
      const locationOptions = await MessagingService.getPickupOptions('location');
      setLocations(locationOptions);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-sm">
        <h3 className="text-lg font-semibold mb-4">Choose Pickup Location</h3>
        
        {loading ? (
          <div className="text-center">Loading locations...</div>
        ) : (
          <div className="space-y-2">
            {locations.map((location) => (
              <button
                key={location.id}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                onClick={() => onLocationSelect(location)}
              >
                <div className="font-medium">{location.display_text}</div>
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
