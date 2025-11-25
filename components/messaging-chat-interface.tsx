'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessagingService, Message, Conversation, PickupOption } from '@/lib/messaging-service';
import { MessagingLocationPicker } from './messaging-location-picker';
import { MessagingTimePicker } from './messaging-time-picker';

interface MessagingChatInterfaceProps {
  conversation: Conversation;
}

export function MessagingChatInterface({ conversation }: MessagingChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPickupConfirm, setShowPickupConfirm] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<PickupOption | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const conversationMessages = await MessagingService.getConversationMessages(conversation.id);
      setMessages(conversationMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleArrangePickup = () => {
    setShowLocationPicker(true);
  };

  const handleLocationSelect = (location: PickupOption) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
    setShowTimePicker(true);
  };

  const handleTimeSelect = async (timeSlot: PickupOption) => {
    setShowTimePicker(false);
    
    try {
      const suggestionText = `${selectedLocation?.display_text}, ${timeSlot.display_text}`;
      await MessagingService.sendMenuMessage(
        conversation.id,
        'suggestion',
        suggestionText
      );
      await loadMessages();
      setSelectedLocation(null);
    } catch (error) {
      console.error('Error sending suggestion:', error);
    }
  };

  const handleConfirm = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (message && message.content) {
        await MessagingService.sendMenuMessage(
          conversation.id,
          'confirmation',
          message.content
        );
        await loadMessages();
      }
    } catch (error) {
      console.error('Error confirming:', error);
    }
  };

  const handleShareContact = async () => {
    try {
      await MessagingService.sendMenuMessage(
        conversation.id,
        'share_contact'
      );
      await loadMessages();
    } catch (error) {
      console.error('Error sharing contact:', error);
    }
  };

  const handleConfirmPickup = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      await MessagingService.confirmPickup(conversation.id, pickupCode, user.id);
      setShowPickupConfirm(false);
      setPickupCode('');
      await loadMessages();
    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Invalid pickup code. Please check and try again.');
    }
  };

  const getActionButtons = (lastMessage: Message) => {
    if (lastMessage.message_type === 'suggestion') {
      return (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleConfirm(lastMessage.id)}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            Confirm
          </button>
          <button
            onClick={handleArrangePickup}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Suggest Alternative
          </button>
        </div>
      );
    }

    // Show pickup confirmation button if meeting is arranged but not completed
    const hasConfirmedMeeting = messages.some(m => m.message_type === 'confirmation');
    const isPickupCompleted = conversation.item_picked_up;

    if (hasConfirmedMeeting && !isPickupCompleted) {
      return (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowPickupConfirm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Confirm Pickup
          </button>
          <button
            onClick={handleShareContact}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Share Contact
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleArrangePickup}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Arrange Pickup
        </button>
        <button
          onClick={handleShareContact}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Share Contact
        </button>
      </div>
    );
  };

  if (loading) return <div className="p-4 text-gray-900">Loading messages...</div>;

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className="flex flex-col h-96 border border-gray-200 rounded-lg">
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-900">No messages yet. Start the conversation!</div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg max-w-xs text-gray-900 ${
                  message.sender_id === conversation.user1_id 
                    ? 'bg-blue-100 ml-auto' 
                    : 'bg-gray-100'
                }`}
              >
                <div className="text-sm">{message.display_text}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200">
        {lastMessage && getActionButtons(lastMessage)}
        {!lastMessage && (
          <div className="flex gap-2">
            <button
              onClick={handleArrangePickup}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Arrange Pickup
            </button>
            <button
              onClick={handleShareContact}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Share Contact
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <MessagingLocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
      />

      <MessagingTimePicker
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={handleTimeSelect}
      />

      {/* Pickup Confirmation Modal */}
      {showPickupConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 max-w-sm text-gray-900">
            <h3 className="text-lg font-semibold mb-4">Confirm Item Pickup</h3>
            <p className="mb-4 text-sm">Enter the 6-digit pickup code to confirm return:</p>
            <input
              type="text"
              value={pickupCode}
              onChange={(e) => setPickupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full p-2 border border-gray-300 rounded mb-4 text-center text-lg"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmPickup}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                disabled={pickupCode.length !== 6}
              >
                Confirm
              </button>
              <button
                onClick={() => setShowPickupConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
