import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MessagingPickupModalProps {
  isOpen: boolean;
  pickupCode: string;
  onPickupCodeChange: (code: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function MessagingPickupModal({
  isOpen,
  pickupCode,
  onPickupCodeChange,
  onConfirm,
  onClose,
}: MessagingPickupModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Item Return</DialogTitle>
          <DialogDescription>
            Enter the claimant pickup code to mark this item as returned.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="pickup-code">
            Pickup code
          </Label>
          <Input
            id="pickup-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pickupCode}
            onChange={(e) =>
              onPickupCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            className="text-center text-lg font-mono tracking-widest"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pickupCode.length !== 6}
          >
            Confirm Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
