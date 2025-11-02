'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessagingService, Conversation } from '@/lib/messaging-service';

interface MessagingConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  currentConversationId?: string;
}

export function MessagingConversationList({ onSelectConversation, currentConversationId }: MessagingConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const userConversations = await MessagingService.getUserConversations(user.id);
      setConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading conversations...</div>;

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No conversations yet. Claim an item to start messaging!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
            conversation.id === currentConversationId ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="font-semibold text-sm">
            Conversation about Item
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Last updated: {new Date(conversation.updated_at).toLocaleDateString()}
          </div>
          <div className={`text-xs mt-1 ${
            conversation.status === 'active' ? 'text-green-600' : 'text-gray-500'
          }`}>
            {conversation.status}
          </div>
        </div>
      ))}
    </div>
  );
}
