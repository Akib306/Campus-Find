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
      <div className="bg-card text-card-foreground rounded-lg p-6 w-80 max-w-sm border border-border">
        <h3 className="text-lg font-semibold mb-4">Confirm Item Return</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Enter the 6-digit pickup code provided by the claimant:
        </p>
        <input
          type="text"
          value={pickupCode}
          onChange={(e) =>
            onPickupCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          placeholder="123456"
          className="w-full p-2 border border-input rounded mb-4 text-center text-lg font-mono text-foreground bg-background"
        />
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pickupCode.length !== 6}
          >
            Confirm Return
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
