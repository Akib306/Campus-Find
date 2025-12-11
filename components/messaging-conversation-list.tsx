'use client';
import { Conversation } from '@/lib/messaging-service';

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
  console.log('📋 Conversations passed to list:', conversations);

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
        <div
          key={conversation.id}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            conversation.id === currentConversationId
              ? 'bg-primary/10 border-primary/40 text-foreground'
              : 'bg-card border-border text-foreground hover:bg-muted'
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="font-semibold text-sm">
            Conversation {conversation.id.slice(0, 8)}...
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {conversation.arranged_location ? (
              <>
                📍 {conversation.arranged_location}
                {conversation.arranged_time && ` • 🕒 ${conversation.arranged_time}`}
              </>
            ) : (
              `Last updated: ${new Date(conversation.updated_at).toLocaleDateString()}`
            )}
          </div>
          <div
            className={`text-xs mt-1 ${
              conversation.status === 'active'
                ? 'text-primary'
                : conversation.status === 'completed'
                ? 'text-muted-foreground'
                : 'text-accent-foreground'
            }`}
          >
            {conversation.status}
            {conversation.item_picked_up && ' • ✅ Returned'}
          </div>
        </div>
      ))}
    </div>
  );
}
