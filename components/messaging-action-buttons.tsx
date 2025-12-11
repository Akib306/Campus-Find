interface MessagingActionButtonsProps {
  currentState: string;
  isFinder: boolean;
  isClaimant: boolean;
  claimantPickupCode: string | null;
  onArrangePickup: () => void;
  onShareContact: () => void;
  onSuggestAlternative: () => void;
  onConfirm: () => void;
  onShowPickupModal: () => void;
}

export function MessagingActionButtons({ // ADDED 'export'
  currentState,
  isFinder,
  isClaimant,
  claimantPickupCode,
  onArrangePickup,
  onShareContact,
  onSuggestAlternative,
  onConfirm,
  onShowPickupModal
}: MessagingActionButtonsProps) {
  switch (currentState) {
    case 'initial':
      return (
        <div className="flex gap-2">
          <button
            onClick={onArrangePickup}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Arrange Pickup
          </button>
          <button
            onClick={onShareContact}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Share Contact
          </button>
        </div>
      );

    case 'waiting_confirmation':
      return (
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">
            ⏳ Waiting for the other person to confirm your meeting suggestion...
          </div>
          <button
            onClick={onSuggestAlternative}
            className="px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
          >
            Suggest Different Time/Location
          </button>
        </div>
      );

    case 'suggesting_alternative':
      return (
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Confirm Meeting
          </button>
          <button
            onClick={onSuggestAlternative}
            className="px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
          >
            Suggest Alternative
          </button>
          <button
            onClick={onShareContact}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Share Contact
          </button>
        </div>
      );

    case 'confirmed':
      return (
        <div className="space-y-3">
          {/* Show pickup code for CLAIMANT */}
          {isClaimant && claimantPickupCode && (
            <div className="rounded-lg p-3 text-center border border-primary/40 bg-primary/10">
              <div className="text-sm font-semibold text-primary">Your Pickup Code</div>
              <div className="text-2xl font-mono font-bold text-foreground my-2">{claimantPickupCode}</div>
              <div className="text-xs text-muted-foreground">
                Give this code to the finder when you meet
              </div>
            </div>
          )}
          
          {/* Show pickup instruction for FINDER */}
          {isFinder && (
            <div className="rounded-lg p-3 text-center border border-accent/60 bg-accent/20">
              <div className="text-sm font-semibold text-foreground">Pickup Instructions</div>
              <div className="text-xs text-muted-foreground mb-2">
                Ask the claimant for the pickup code and enter it below
              </div>
              <button
                onClick={onShowPickupModal}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Enter Pickup Code
              </button>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <button
              onClick={onShareContact}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Share Contact
            </button>
          </div>
        </div>
      );

    case 'completed':
      return (
        <div className="text-center">
          <div className="text-sm text-primary">
            ✅ Item successfully returned!
          </div>
        </div>
      );

    default:
      return null;
  }
}
