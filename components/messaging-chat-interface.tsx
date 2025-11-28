'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessagingService, Message, Conversation, PickupOption } from '@/lib/messaging-service';
import { MessagingLocationPicker } from './messaging-location-picker';
import { MessagingTimePicker } from './messaging-time-picker';

interface MessagingChatInterfaceProps {
  conversation: Conversation;
  currentUser: any;
}

export function MessagingChatInterface({ conversation, currentUser }: MessagingChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPickupConfirm, setShowPickupConfirm] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<PickupOption | null>(null);
  const [selectedTime, setSelectedTime] = useState<PickupOption | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    
    // Real-time subscription for messages
    const supabase = createClient();
    
    console.log('🔔 Setting up real-time subscription for conversation:', conversation.id);
    
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          console.log('📨 Real-time update received:', payload);
          const newMessage = payload.new as Message;
          console.log('🆕 New message to add:', newMessage);
          setMessages(prev => {
            const updated = [...prev, newMessage];
            console.log('📊 Messages after update:', updated);
            return updated;
          });
        }
      )
      .on('system', { event: 'ERROR' }, (error) => {
        console.error('❌ Real-time subscription error:', error);
      })
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      console.log('📥 Loading messages for conversation:', conversation.id);
      const conversationMessages = await MessagingService.getConversationMessages(conversation.id);
      console.log('📨 Messages loaded:', conversationMessages);
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
    setSelectedTime(timeSlot);
    setShowTimePicker(false);
    
    try {
      // Send the suggestion message
      const suggestionText = `${selectedLocation?.display_text}, ${timeSlot.display_text}`;
      console.log('Sending suggestion:', suggestionText);
      
      await MessagingService.sendMenuMessage(
        conversation.id,
        'suggestion',
        suggestionText
      );
      
      // Reset selections
      setSelectedLocation(null);
      setSelectedTime(null);
    } catch (error) {
      console.error('Error sending suggestion:', error);
    }
  };

  const handleConfirm = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (message && message.content) {
        console.log('Confirming meeting with details:', message.content);
        
        const { claimCode } = await MessagingService.confirmMeeting(
          conversation.id,
          message.content,
          currentUser.id
        );
        
        // Show pickup code to the user who confirmed
        if (claimCode) {
          alert(`Your pickup code: ${claimCode}\n\nGive this code to the other person when you meet to verify the return.`);
        }
      }
    } catch (error) {
      console.error('Error confirming meeting:', error);
      alert('Error confirming meeting. Please try again.');
    }
  };

  const handleShareContact = async () => {
    try {
      await MessagingService.sendMenuMessage(
        conversation.id,
        'share_contact'
      );
    } catch (error) {
      console.error('Error sharing contact:', error);
    }
  };

  const handleConfirmPickup = async () => {
    try {
      await MessagingService.confirmPickup(conversation.id, pickupCode, currentUser.id);
      setShowPickupConfirm(false);
      setPickupCode('');
    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Invalid pickup code. Please check and try again.');
    }
  };

  const getActionButtons = (lastMessage: Message) => {
    console.log('Last message type:', lastMessage.message_type);
    
    // Show confirm buttons for suggestion messages from other user
    if (lastMessage.message_type === 'suggestion' && lastMessage.sender_id !== currentUser.id) {
      return (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleConfirm(lastMessage.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Confirm Meeting
          </button>
          <button
            onClick={handleArrangePickup}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Suggest Alternative
          </button>
        </div>
      );
    }
    
    // Show pickup confirmation button if meeting is confirmed but not completed
    const hasConfirmedMeeting = messages.some(m => m.message_type === 'confirmation');
    const isPickupCompleted = conversation.item_picked_up;
    
    if (hasConfirmedMeeting && !isPickupCompleted) {
      return (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowPickupConfirm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Confirm Pickup
          </button>
          <button
            onClick={handleShareContact}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Share Contact
          </button>
        </div>
      );
    }
    
    // Default buttons for new conversations or no recent suggestions
    return (
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleArrangePickup}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Arrange Pickup
        </button>
        <button
          onClick={handleShareContact}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Share Contact
        </button>
      </div>
    );
  };

  if (loading) return <div className="p-4 text-gray-900 bg-white">Loading messages...</div>;

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className="flex flex-col h-96 border border-gray-300 rounded-lg bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-300 bg-gray-50">
        <h3 className="font-semibold text-gray-900">
          Conversation
        </h3>
        {conversation.arranged_location && conversation.arranged_time && (
          <div className="text-sm text-gray-700 mt-1">
            Location: {conversation.arranged_location} • Time: {conversation.arranged_time}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        {messages.length === 0 ? (
          <div className="text-center text-gray-700">No messages yet. Start the conversation!</div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg max-w-xs ${
                  message.sender_id === currentUser.id 
                    ? 'bg-blue-100 ml-auto border border-blue-200 text-gray-900' 
                    : message.message_type === 'system'
                    ? 'bg-yellow-100 text-gray-900 border border-yellow-300 text-center'
                    : 'bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                <div className="text-sm whitespace-pre-line">{message.display_text}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </div>
                
                {/* Show action buttons for suggestion messages from other user */}
                {message.message_type === 'suggestion' && message.sender_id !== currentUser.id && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleConfirm(message.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={handleArrangePickup}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Suggest Alternative
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-300 bg-gray-50">
        {lastMessage && getActionButtons(lastMessage)}
        {!lastMessage && (
          <div className="flex gap-2">
            <button
              onClick={handleArrangePickup}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Arrange Pickup
            </button>
            <button
              onClick={handleShareContact}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
          <div className="bg-white rounded-lg p-6 w-80 max-w-sm border border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Item Return</h3>
            <p className="mb-4 text-sm text-gray-700">Enter the 6-digit pickup code provided by the other person:</p>
            <input
              type="text"
              value={pickupCode}
              onChange={(e) => setPickupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full p-2 border border-gray-400 rounded mb-4 text-center text-lg font-mono text-gray-900 bg-white"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmPickup}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                disabled={pickupCode.length !== 6}
              >
                Confirm Return
              </button>
              <button
                onClick={() => setShowPickupConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
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
