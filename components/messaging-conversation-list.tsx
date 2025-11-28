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
      <div className="p-4 text-center text-gray-900">
        No conversations yet. Claim an item to start messaging!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 text-gray-900 ${
            conversation.id === currentConversationId ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="font-semibold text-sm">
            Conversation {conversation.id.slice(0, 8)}...
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {conversation.arranged_location ? (
              <>
                📍 {conversation.arranged_location}
                {conversation.arranged_time && ` • 🕒 ${conversation.arranged_time}`}
              </>
            ) : (
              `Last updated: ${new Date(conversation.updated_at).toLocaleDateString()}`
            )}
          </div>
          <div className={`text-xs mt-1 ${
            conversation.status === 'active' ? 'text-green-600' : 
            conversation.status === 'completed' ? 'text-gray-500' : 'text-orange-500'
          }`}>
            {conversation.status}
            {conversation.item_picked_up && ' • ✅ Returned'}
          </div>
        </div>
      ))}
    </div>
  );
}
