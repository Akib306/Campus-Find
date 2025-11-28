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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Arrange Pickup
          </button>
          <button
            onClick={onShareContact}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Share Contact
          </button>
        </div>
      );

    case 'waiting_confirmation':
      return (
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            ⏳ Waiting for the other person to confirm your meeting suggestion...
          </div>
          <button
            onClick={onSuggestAlternative}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Confirm Meeting
          </button>
          <button
            onClick={onSuggestAlternative}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Suggest Alternative
          </button>
          <button
            onClick={onShareContact}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
            <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
              <div className="text-sm font-semibold text-green-800">Your Pickup Code</div>
              <div className="text-2xl font-mono font-bold text-green-900 my-2">{claimantPickupCode}</div>
              <div className="text-xs text-green-700">
                Give this code to the finder when you meet
              </div>
            </div>
          )}
          
          {/* Show pickup instruction for FINDER */}
          {isFinder && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-center">
              <div className="text-sm font-semibold text-blue-800">Pickup Instructions</div>
              <div className="text-xs text-blue-700 mb-2">
                Ask the claimant for the pickup code and enter it below
              </div>
              <button
                onClick={onShowPickupModal}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Enter Pickup Code
              </button>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <button
              onClick={onShareContact}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Share Contact
            </button>
          </div>
        </div>
      );

    case 'completed':
      return (
        <div className="text-center">
          <div className="text-sm text-green-600">
            ✅ Item successfully returned!
          </div>
        </div>
      );

    default:
      return null;
  }
}
