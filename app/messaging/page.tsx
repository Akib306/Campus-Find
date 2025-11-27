'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessagingService, Conversation } from '@/lib/messaging-service';
import { MessagingConversationList } from '@/components/messaging-conversation-list';
import { MessagingChatInterface } from '@/components/messaging-chat-interface';

export default function MessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAndConversations();
  }, []);

  const loadUserAndConversations = async () => {
    try {
      console.log('🔄 Loading user and conversations...');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('👤 User found:', user.id);
        setUser(user);
        const userConversations = await MessagingService.getUserConversations(user.id);
        console.log('📨 Conversations loaded:', userConversations);
        setConversations(userConversations);
      } else {
        console.log('❌ No user found');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-900">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-900">
        <div className="text-lg">Please log in to view messages</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl text-gray-900">
      <h1 className="text-3xl font-bold mb-2">Messages</h1>
      <p className="text-gray-600 mb-6">
        Coordinate item returns with other users
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Conversations */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Conversations ({conversations.length})</h2>
          </div>
          <MessagingConversationList
            conversations={conversations}
            onSelectConversation={setSelectedConversation}
            currentConversationId={selectedConversation?.id}
          />
        </div>

        {/* Right Side - Chat Interface */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">
            {selectedConversation ? 'Chat' : 'Select a Conversation'}
          </h2>
          
          {selectedConversation ? (
            <MessagingChatInterface conversation={selectedConversation} currentUser={user} />
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-gray-500">
                Select a conversation from the list to start messaging.
                <br />
                <span className="text-sm">
                  {conversations.length > 0 
                    ? `Found ${conversations.length} conversations` 
                    : 'No conversations found'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
