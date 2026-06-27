import {
  CheckCircle2,
  Clock3,
  Contact,
  MapPinned,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

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

export function MessagingActionButtons({
  currentState,
  isFinder,
  isClaimant,
  claimantPickupCode,
  onArrangePickup,
  onShareContact,
  onSuggestAlternative,
  onConfirm,
  onShowPickupModal,
}: MessagingActionButtonsProps) {
  switch (currentState) {
    case 'initial':
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onArrangePickup}
          >
            <MapPinned className="h-4 w-4" />
            Arrange Pickup
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onShareContact}
          >
            <Contact className="h-4 w-4" />
            Share Contact
          </Button>
        </div>
      );

    case 'waiting_confirmation':
      return (
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            <span>Waiting for the other person to confirm your meeting suggestion.</span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onSuggestAlternative}
          >
            <RefreshCcw className="h-4 w-4" />
            Suggest Different Time/Location
          </Button>
        </div>
      );

    case 'suggesting_alternative':
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onConfirm}
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm Meeting
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSuggestAlternative}
          >
            <RefreshCcw className="h-4 w-4" />
            Suggest Alternative
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onShareContact}
          >
            <Contact className="h-4 w-4" />
            Share Contact
          </Button>
        </div>
      );

    case 'confirmed':
      return (
        <div className="space-y-3">
          {/* Show pickup code for CLAIMANT */}
          {isClaimant && claimantPickupCode && (
            <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-center">
              <div className="text-sm font-semibold text-primary">Your Pickup Code</div>
              <div className="text-2xl font-mono font-bold text-foreground my-2">{claimantPickupCode}</div>
              <div className="text-xs text-muted-foreground">
                Give this code to the finder when you meet
              </div>
            </div>
          )}
          
          {/* Show pickup instruction for FINDER */}
          {isFinder && (
            <div className="rounded-lg border border-accent/60 bg-accent/20 p-3 text-center">
              <div className="text-sm font-semibold text-foreground">
                Pickup Instructions
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Ask the claimant for the pickup code and enter it below
              </div>
              <Button
                type="button"
                onClick={onShowPickupModal}
              >
                <ShieldCheck className="h-4 w-4" />
                Enter Pickup Code
              </Button>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button
              type="button"
              variant="secondary"
              onClick={onShareContact}
            >
              <Contact className="h-4 w-4" />
              Share Contact
            </Button>
          </div>
        </div>
      );

    case 'completed':
      return (
        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" />
          <span>Item successfully returned.</span>
        </div>
      );

    default:
      return null;
  }
}
