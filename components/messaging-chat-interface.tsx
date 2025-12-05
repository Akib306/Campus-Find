'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessagingService, Message, Conversation, PickupOption } from '@/lib/messaging-service';
import { MessagingChatHeader } from './messaging-chat-header';
import { MessagingMessagesArea } from './messaging-messages-area';
import { MessagingActionButtons } from './messaging-action-buttons';
import { MessagingPickupModal } from './messaging-pickup-modal';
import { MessagingLocationPicker } from './messaging-location-picker';
import { MessagingTimePicker } from './messaging-time-picker';
import type { User } from '@supabase/supabase-js';

interface MessagingChatInterfaceProps {
  conversation: Conversation;
  currentUser: User;
}

export function MessagingChatInterface({ conversation, currentUser }: MessagingChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPickupConfirm, setShowPickupConfirm] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<PickupOption | null>(null);
  const [selectedTime, setSelectedTime] = useState<PickupOption | null>(null);
  const [currentState, setCurrentState] = useState<'initial' | 'waiting_confirmation' | 'suggesting_alternative' | 'confirmed' | 'completed'>('initial');
  const [claimantPickupCode, setClaimantPickupCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isFinder = currentUser.id === conversation.user1_id;
  const isClaimant = currentUser.id === conversation.user2_id;

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const conversationMessages = await MessagingService.getConversationMessages(conversation.id, currentUser.id);
        setMessages(conversationMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    // Real-time subscription for messages
    const supabase = createClient();
    
    console.log('🔔 Setting up real-time subscription for conversation:', conversation.id);
    
    const subscription = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload) => {
          console.log('📨 Real-time update received:', payload);
          const newMessage = payload.new as Message;
          console.log('🆕 New message to add:', newMessage);
          
          // Only add non-private messages or private messages for current user
          if (!newMessage.private || (newMessage.private && newMessage.sender_id === currentUser.id)) {
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) {
                console.log('⚠️ Message already exists, skipping...');
                return prev;
              }
              const updated = [...prev, newMessage];
              console.log('📊 Messages after update:', updated);
              return updated;
            });
          }

          // Refresh the page to update conversation list and other states
          setTimeout(() => {
            router.refresh();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time updates');
        }
      });

    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(subscription);
    };
  }, [conversation.id, router, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
    updateCurrentState();
    loadClaimantPickupCode();
  }, [messages]);

  const updateCurrentState = () => {
    // Check if meeting is confirmed
    const hasConfirmedMeeting = messages.some(m => m.message_type === 'confirmation');
    const isPickupCompleted = conversation.item_picked_up;

    if (isPickupCompleted) {
      setCurrentState('completed');
      return;
    }

    if (hasConfirmedMeeting) {
      setCurrentState('confirmed');
      return;
    }

    // Find the last suggestion
    const lastSuggestion = [...messages].reverse().find(msg => msg.message_type === 'suggestion');
    
    if (!lastSuggestion) {
      setCurrentState('initial');
      return;
    }

    // If current user sent the last suggestion, they're waiting for confirmation
    if (lastSuggestion.sender_id === currentUser.id) {
      setCurrentState('waiting_confirmation');
    } else {
      // If other user sent the last suggestion, current user can respond
      setCurrentState('suggesting_alternative');
    }
  };

  const loadClaimantPickupCode = async () => {
    if (isClaimant && currentState === 'confirmed') {
      try {
        const code = await MessagingService.getClaimantPickupCode(conversation.id, currentUser.id);
        setClaimantPickupCode(code);
      } catch (error) {
        console.error('Error loading pickup code:', error);
      }
    }
  };

  const loadMessages = async () => {
    try {
      console.log('📥 Loading messages for conversation:', conversation.id);
      const conversationMessages = await MessagingService.getConversationMessages(conversation.id, currentUser.id);
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
      console.log('Sending pickup suggestion:', suggestionText);
      
      await MessagingService.sendMenuMessage(
        conversation.id,
        'suggestion',
        suggestionText
      );
      
      // Update state to waiting for confirmation
      setCurrentState('waiting_confirmation');
      
      // Refresh messages to show the new suggestion
      await loadMessages();
      router.refresh();
      
      // Reset selections
      setSelectedLocation(null);
      setSelectedTime(null);
    } catch (error) {
      console.error('Error sending suggestion:', error);
    }
  };

  const handleConfirm = async () => {
    try {
      // Find the last suggestion from the other user
      const lastSuggestionFromOther = [...messages]
        .reverse()
        .find(msg => 
          msg.message_type === 'suggestion' && 
          msg.sender_id !== currentUser.id
        );

      if (lastSuggestionFromOther && lastSuggestionFromOther.content) {
        console.log('Confirming meeting with details:', lastSuggestionFromOther.content);
        
        // Use the full confirm method to send proper system messages
        await MessagingService.confirmMeeting(
          conversation.id,
          lastSuggestionFromOther.content,
          currentUser.id
        );
        
        // Update state to confirmed
        setCurrentState('confirmed');
        
        // Refresh messages to show confirmation and load pickup code
        await loadMessages();
        await loadClaimantPickupCode();
        router.refresh();
      }
    } catch (error) {
      console.error('Error confirming meeting:', error);
      alert('Error confirming meeting. Please try again.');
    }
  };

  const handleSuggestAlternative = () => {
    setCurrentState('suggesting_alternative');
    handleArrangePickup();
  };

  const handleShareContact = async () => {
    try {
      await MessagingService.shareContact(conversation.id, currentUser.id);
      await loadMessages();
      router.refresh();
    } catch (error) {
      console.error('Error sharing contact:', error);
      alert('Error sharing contact information. Please try again.');
    }
  };

  const handleConfirmPickup = async () => {
    try {
      await MessagingService.confirmPickup(conversation.id, pickupCode, currentUser.id);
      setShowPickupConfirm(false);
      setPickupCode('');
      setCurrentState('completed');
      await loadMessages();
      router.refresh();
    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Invalid pickup code. Please check and try again.');
    }
  };

  const getOtherUserName = () => {
    return isFinder ? 'Claimant' : 'Finder';
  };

  if (loading) return <div className="p-4 text-gray-900 bg-white">Loading messages...</div>;

  return (
    <div className="flex flex-col h-96 border border-gray-300 rounded-lg bg-white">
      <MessagingChatHeader 
        conversation={conversation}
        isFinder={isFinder}
        currentState={currentState}
        getOtherUserName={getOtherUserName}
      />

      <MessagingMessagesArea 
        messages={messages}
        currentUser={currentUser}
        messagesEndRef={messagesEndRef}
      />

      <div className="p-4 border-t border-gray-300 bg-gray-50">
        <MessagingActionButtons
          currentState={currentState}
          isFinder={isFinder}
          isClaimant={isClaimant}
          claimantPickupCode={claimantPickupCode}
          onArrangePickup={handleArrangePickup}
          onShareContact={handleShareContact}
          onSuggestAlternative={handleSuggestAlternative}
          onConfirm={handleConfirm}
          onShowPickupModal={() => setShowPickupConfirm(true)}
        />
      </div>

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

      <MessagingPickupModal
        isOpen={showPickupConfirm && isFinder}
        pickupCode={pickupCode}
        onPickupCodeChange={setPickupCode}
        onConfirm={handleConfirmPickup}
        onClose={() => setShowPickupConfirm(false)}
      />
    </div>
  );
}
