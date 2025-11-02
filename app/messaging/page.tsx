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
      // Create a test conversation (you'll need to replace with a real item_id later)
      const testItemId = 'test-item-id'; // This will be replaced when you integrate with items
      const otherUserId = user.id; // For demo, using same user as both parties
      
      const { conversation } = await MessagingService.claimItem(
        testItemId,
        user.id,
        otherUserId
      );
      
      setConversations(prev => [conversation, ...prev]);
      setSelectedConversation(conversation);
    } catch (error) {
      console.error('Error creating test conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Please log in to test messaging</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Messaging Feature</h1>
      <p className="text-gray-600 mb-6">
        Menu-based messaging system for CampusFind
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
            <MessagingChatInterface conversation={selectedConversation} />
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-gray-500">
                Select a conversation from the list or create a test conversation to start messaging.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Test Conversation" to create a new conversation</li>
          <li>Click "Arrange Pickup" to open the menu-based messaging</li>
          <li>Select a location and time slot</li>
          <li>Use the "Confirm" or "Suggest Alternative" buttons</li>
          <li>Try the "Share Contact" feature</li>
        </ol>
      </div>
    </div>
  );
}
