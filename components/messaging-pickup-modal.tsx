interface MessagingPickupModalProps {
  isOpen: boolean;
  pickupCode: string;
  onPickupCodeChange: (code: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function MessagingPickupModal({ // ADDED 'export'
  isOpen, 
  pickupCode, 
  onPickupCodeChange, 
  onConfirm, 
  onClose 
}: MessagingPickupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-sm border border-gray-300">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Item Return</h3>
        <p className="mb-4 text-sm text-gray-700">Enter the 6-digit pickup code provided by the claimant:</p>
        <input
          type="text"
          value={pickupCode}
          onChange={(e) => onPickupCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="w-full p-2 border border-gray-400 rounded mb-4 text-center text-lg font-mono text-gray-900 bg-white"
        />
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            disabled={pickupCode.length !== 6}
          >
            Confirm Return
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
