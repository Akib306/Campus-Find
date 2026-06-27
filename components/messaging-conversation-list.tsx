'use client';

import { CheckCircle2, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Conversation } from '@/lib/messaging-service';
import { cn } from '@/lib/utils';

interface MessagingConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  currentConversationId?: string;
}

export function MessagingConversationList({ 
  conversations, 
  onSelectConversation, 
  currentConversationId 
}: MessagingConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No conversations yet. Claim an item to start messaging!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Button
          key={conversation.id}
          type="button"
          variant="outline"
          className={cn(
            'h-auto w-full flex-col items-start justify-start whitespace-normal p-4 text-left',
            conversation.id === currentConversationId
              ? 'border-primary/40 bg-primary/10 text-foreground'
              : 'bg-card text-foreground hover:bg-muted'
          )}
          onClick={() => onSelectConversation(conversation)}
        >
          <span className="text-sm font-semibold">
            Conversation {conversation.id.slice(0, 8)}...
          </span>
          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {conversation.arranged_location ? (
              <>
                <MapPin className="h-3 w-3" />
                {conversation.arranged_location}
                {conversation.arranged_time && ` • ${conversation.arranged_time}`}
              </>
            ) : (
              `Last updated: ${new Date(conversation.updated_at).toLocaleDateString()}`
            )}
          </span>
          <span
            className={cn(
              'mt-1 flex items-center gap-1 text-xs capitalize',
              conversation.status === 'active'
                ? 'text-primary'
                : conversation.status === 'completed'
                ? 'text-muted-foreground'
                : 'text-accent-foreground'
            )}
          >
            {conversation.status}
            {conversation.item_picked_up && (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Returned
              </>
            )}
          </span>
        </Button>
      ))}
    </div>
  );
}
