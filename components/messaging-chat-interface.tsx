'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessagingService, Message, Conversation, PickupOption } from '@/lib/messaging-service';
import { MessagingLocationPicker } from './messaging-location-picker';
import { MessagingTimePicker } from './messaging-time-picker';

interface MessagingChatInterfaceProps {
  conversation: Conversation;
  currentUser: any;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if current user is the finder (user who posted the item)
  const isFinder = currentUser.id === conversation.user1_id;
  const isClaimant = currentUser.id === conversation.user2_id;

  useEffect(() => {
    loadMessages();
    
    // Real-time subscription for messages with proper filter syntax
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
    // Only load claimant's private pickup code for claimant role and when meeting is confirmed
    if (isClaimant && currentState === 'confirmed') {
      try {
        const code = await MessagingService.getClaimantPickupCode(conversation.id, currentUser.id);
        // Normalize display: keep raw string if present
        setClaimantPickupCode(code ? code.trim() : null);
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

  /**
   * Updated pickup confirmation handler
   * - Performs a robust client-side normalization & pre-check against stored claim_code to avoid
   *   string formatting mismatches (whitespace, non-digit characters, casing).
   * - If pre-check passes, calls backend confirmPickup as before.
   * - On wrong code: modal stays open, input cleared, error shown at top (non-blocking).
   * - On success: proceeds with existing flow (close modal, update state, refresh).
   */
  const handleConfirmPickup = async () => {
    try {
      // Clean the input before sending: remove non-digits and trim
      const cleanCode = pickupCode.replace(/\D/g, '').trim();

      if (cleanCode.length !== 6) {
        setErrorMessage('Please enter a valid 6-digit code');
        return;
      }

      console.log('🔐 Attempting pickup confirmation with code (clean):', cleanCode);

      // -------------------------
      // CLIENT-SIDE PRE-CHECK (robust normalization)
      // -------------------------
      // Fetch the conversation record to read stored code (trusted single source)
      let storedClaimCode: string | null = null;
      try {
        const conv = await MessagingService.getConversationById(conversation.id);
        storedClaimCode = conv?.claim_code ?? null;
      } catch (fetchConvErr) {
        console.error('Error fetching conversation for pre-check:', fetchConvErr);
        // If we couldn't fetch conversation, still attempt server-side confirm for final authority
      }

      // Normalize both values by removing non-digit characters and trimming
      const normalize = (s?: string | null) => (s ? s.replace(/\D/g, '').trim() : '');
      const storedNormalized = normalize(storedClaimCode);
      const enteredNormalized = normalize(cleanCode);

      console.log('Pre-check codes:', { enteredNormalized, storedNormalized });

      // If we could read stored code and it doesn't match, show immediate error and allow retry
      if (storedClaimCode && storedNormalized !== enteredNormalized) {
        setErrorMessage('Incorrect pickup code. Please ask the claimant for the correct code and try again.');
        setPickupCode(''); // clear input for retry
        return; // keep modal open so finder can retry
      }

      // If pre-check passed (or we couldn't fetch stored code), proceed to server verification
      await MessagingService.confirmPickup(conversation.id, cleanCode, currentUser.id);

      // On success: close modal, clear inputs and error, update states
      setShowPickupConfirm(false);
      setPickupCode('');
      setErrorMessage(null);
      setCurrentState('completed'); // mark local state completed (server also updated)
      await loadMessages();
      router.refresh();
    } catch (error: any) {
      console.error('Error confirming pickup:', error);

      // Keep modal open on failure and provide a helpful message
      const messageText = (error && error.message) ? error.message : String(error);
      
      if (messageText.toLowerCase().includes('invalid pickup code') || messageText.toLowerCase().includes('incorrect')) {
        setErrorMessage('Incorrect pickup code. Please ask the claimant for the correct code and try again.');
      } else {
        setErrorMessage('Error confirming pickup. Please try again.');
      }

      // Clear the input so user can easily retry
      setPickupCode('');
      // Do NOT close modal so user can retry immediately
    }
  };

  const getActionButtons = () => {
    switch (currentState) {
      case 'initial':
        return (
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
        );

      case 'waiting_confirmation':
        return (
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">
              ⏳ Waiting for the other person to confirm your meeting suggestion...
            </div>
            <button
              onClick={handleSuggestAlternative}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Suggest Different Time/Location
            </button>
          </div>
        );

      case 'suggesting_alternative':
        return (
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Confirm Meeting
            </button>
            <button
              onClick={handleSuggestAlternative}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Suggest Alternative
            </button>
            <button
              onClick={handleShareContact}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Share Contact
            </button>
          </div>
        );

      case 'confirmed':
        return (
          <div className="space-y-3">
            {/* Show pickup code for CLAIMANT */}
            {isClaimant && claimantPickupCode && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                <div className="text-sm font-semibold text-green-800">Your Pickup Code</div>
                <div className="text-2xl font-mono font-bold text-green-900 my-2">{claimantPickupCode}</div>
                <div className="text-xs text-green-700">
                  Give this code to the finder when you meet
                </div>
              </div>
            )}
            
            {/* Show pickup instruction for FINDER */}
            {isFinder && (
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-center">
                <div className="text-sm font-semibold text-blue-800">Pickup Instructions</div>
                <div className="text-xs text-blue-700 mb-2">
                  Ask the claimant for the pickup code and enter it below
                </div>
                <button
                  onClick={() => {
                    setShowPickupConfirm(true);
                    setErrorMessage(null); // reset error every time the modal opens
                    setPickupCode('');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Enter Pickup Code
                </button>
              </div>
            )}
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleShareContact}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Share Contact
              </button>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="text-center">
            <div className="text-sm text-green-600">
              ✅ Item successfully returned!
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStateDescription = () => {
    switch (currentState) {
      case 'initial':
        return 'Start by arranging a pickup time and location';
      case 'waiting_confirmation':
        return 'Your suggestion has been sent. Waiting for confirmation...';
      case 'suggesting_alternative':
        return 'You have a meeting suggestion. Confirm or suggest an alternative';
      case 'confirmed':
        return isFinder 
          ? 'Meeting confirmed! Coordinate the pickup below.' 
          : 'Meeting confirmed! Your pickup code is shown below.';
      case 'completed':
        return 'Item successfully returned.';
      default:
        return '';
    }
  };

  const renderMessageContent = (message: Message) => {
    switch (message.message_type) {
      case 'claim_initial':
        return '👋 Hello, I believe this is my lost item';
      case 'suggestion':
        return `📍 ${message.display_text?.replace('📍 Suggested: ', '') || message.content?.replace('Suggested: ', '') || message.content}`;
      case 'confirmation':
        return `✅ ${message.display_text?.replace('✅ Confirmed: ', '') || message.content?.replace('Confirmed: ', '') || message.content}`;
      case 'system':
        // Don't show private system messages in chat
        if (message.private) return null;
        return `📢 ${message.display_text || message.content}`;
      case 'share_contact':
        return '📞 Shared contact information';
      case 'share_email':
        return `${message.display_text || message.content}`;
      default:
        return message.display_text || message.content || '💬 Message';
    }
  };

  const getOtherUserName = () => {
    return isFinder ? 'Claimant' : 'Finder';
  };

  if (loading) return <div className="p-4 text-gray-900 bg-white">Loading messages...</div>;

  return (
    <div className="flex flex-col h-96 border border-gray-300 rounded-lg bg-white">
      {/* Error Notification */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <div className="flex justify-between items-center">
            <span className="block sm:inline">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="p-4 border-b border-gray-300 bg-gray-50">
        <h3 className="font-semibold text-gray-900">
          Chat with {getOtherUserName()}
        </h3>
        <div className="text-sm text-gray-600 mt-1">
          {getStateDescription()}
        </div>
        {conversation.arranged_location && conversation.arranged_time && (
          <div className="text-sm text-gray-700 mt-1">
            📍 {conversation.arranged_location} • 🕒 {conversation.arranged_time}
          </div>
        )}
        {conversation.item_picked_up && (
          <div className="text-xs text-green-600 mt-1">
            ✅ Item successfully returned
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        {messages.length === 0 ? (
          <div className="text-center text-gray-700">No messages yet. Start the conversation!</div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const content = renderMessageContent(message);
              if (!content) return null; // Skip private system messages
              
              return (
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
                  <div className="text-sm whitespace-pre-line">
                    {content}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Action Buttons - ONLY AT BOTTOM */}
      <div className="p-4 border-t border-gray-300 bg-gray-50">
        {getActionButtons()}
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

      {/* Pickup Confirmation Modal - Only for finder */}
      {showPickupConfirm && isFinder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 max-w-sm border border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Item Return</h3>
            <p className="mb-4 text-sm text-gray-700">Enter the 6-digit pickup code provided by the claimant:</p>
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
                disabled={pickupCode.replace(/\D/g, '').trim().length !== 6}
              >
                Confirm Return
              </button>
              <button
                onClick={() => {
                  setShowPickupConfirm(false);
                  setPickupCode('');
                  setErrorMessage(null); // Clear error when closing modal
                }}
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

