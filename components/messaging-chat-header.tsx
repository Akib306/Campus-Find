'use client';

interface MessagingChatHeaderProps {
  conversation: any;
  isFinder: boolean;
  currentState: string;
  getOtherUserName: () => string;
}

export function MessagingChatHeader({ conversation, isFinder, currentState, getOtherUserName }: MessagingChatHeaderProps) {
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
        <div className="text-sm text-muted-foreground mt-1">
          📍 {conversation.arranged_location} • 🕒 {conversation.arranged_time}
        </div>
      )}
      {conversation.item_picked_up && (
        <div className="text-xs text-primary mt-1">
          ✅ Item successfully returned
        </div>
      )}
    </div>
  );
}
