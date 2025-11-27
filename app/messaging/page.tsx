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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        const userConversations = await MessagingService.getUserConversations(user.id);
        setConversations(userConversations);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestConversation = async () => {
    if (!user) return;

    try {
      console.log('Starting test conversation creation...');
      
      const supabase = createClient();
      
      // Test 1: Check if we can insert into conversations
      console.log('Attempting to create conversation...');
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          post_id: '00000000-0000-0000-0000-000000000000',
          user1_id: user.id,
          user2_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (convError) {
        console.error('Conversation creation failed:', convError);
        throw convError;
      }

      console.log('Conversation created successfully:', conversation.id);

      // Test 2: Check if we can insert into messages
      console.log('Attempting to create message...');
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          message_type: 'claim_initial',
          display_text: 'Hello, I believe this is my lost item',
          sender_id: user.id
        });

      if (msgError) {
        console.error('Message creation failed:', msgError);
        throw msgError;
      }

      console.log('Test conversation created successfully!');
      setConversations(prev => [conversation, ...prev]);
      setSelectedConversation(conversation);
      
    } catch (error) {
      console.error('Full error details:', error);
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
        <div className="text-lg">Please log in to test messaging</div>
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
            <h2 className="text-xl font-semibold">Conversations</h2>
            <button
              onClick={handleCreateTestConversation}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              + Test Conversation
            </button>
          </div>
          <MessagingConversationList
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
                Select a conversation from the list or create a test conversation to start messaging.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
