"use client";

import { CheckCircle2, Clock3, MapPin } from "lucide-react";

import type { Conversation } from "@/lib/messaging-service";

interface MessagingChatHeaderProps {
  conversation: Conversation;
  isFinder: boolean;
  currentState:
    | "initial"
    | "waiting_confirmation"
    | "suggesting_alternative"
    | "confirmed"
    | "completed";
  getOtherUserName: () => string;
}

export function MessagingChatHeader({
  conversation,
  isFinder,
  currentState,
  getOtherUserName,
}: MessagingChatHeaderProps) {
  const getStateDescription = () => {
    switch (currentState) {
      case 'initial':
        return 'Start by arranging a pickup time and location';
      case 'waiting_confirmation':
        return 'Your suggestion has been sent. Waiting for confirmation...';
      case 'suggesting_alternative':
        return 'You have a meeting suggestion. Confirm or suggest an alternative';
      case 'confirmed':
        return isFinder 
          ? 'Meeting confirmed! Coordinate the pickup below.' 
          : 'Meeting confirmed! Your pickup code is shown below.';
      case 'completed':
        return 'Item successfully returned.';
      default:
        return '';
    }
  };

  return (
    <div className="p-4 border-b border-border bg-muted">
      <h3 className="font-semibold text-foreground">
        Chat with {getOtherUserName()}
      </h3>
      <div className="text-sm text-muted-foreground mt-1">
        {getStateDescription()}
      </div>
      {conversation.arranged_location && conversation.arranged_time && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {conversation.arranged_location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-4 w-4" />
            {conversation.arranged_time}
          </span>
        </div>
      )}
      {conversation.item_picked_up && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
          <CheckCircle2 className="h-3 w-3" />
          Item successfully returned
        </div>
      )}
    </div>
  );
}
