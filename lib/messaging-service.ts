import { createClient } from '@/lib/supabase/client';

export interface Conversation {
  id: string;
  post_id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  arranged_location?: string;
  arranged_time?: string;
  item_picked_up?: boolean;
  picked_up_at?: string;
  created_at: string;
  updated_at: string;
  user1_profile?: UserProfile | null;  // From dev
  user2_profile?: UserProfile | null;  // From dev
}

export interface Message {
  id: string;
  conversation_id: string;
  message_type: string;
  content?: string;
  display_text: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
  private?: boolean;  // From our version
  sender_profile?: UserProfile | null;  // From dev
}

export interface PickupOption {
  id: string;
  option_type: string;
  value: string;
  display_text: string;
}

export interface UserProfile {
  username: string | null;
  email: string | null;
}

export class MessagingService {
  // Claim an item and start conversation
  static async claimItem(postId: string, claimantId: string, itemOwnerId: string) {
    const supabase = createClient();
    let claimedPost = false;
    let conversationId: string | null = null;

    const releaseClaim = async () => {
      if (!claimedPost) return;
      await supabase.rpc('release_pending_claim', {
        p_post_id: postId
      });
    };

    try {
      const { error: postError } = await supabase.rpc('claim_post', {
        p_post_id: postId,
        p_item_owner_id: itemOwnerId
      });

      if (postError) {
        throw postError;
      }

      claimedPost = true;

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          post_id: postId,
          user1_id: itemOwnerId,
          user2_id: claimantId,
          status: 'active'
        })
        .select()
        .single();

      if (convError) {
        throw convError;
      }
      conversationId = conversation.id;

      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          message_type: 'claim_initial',
          content: 'Hello, I believe this is my lost item',
          display_text: 'Hello, I believe this is my lost item',
          sender_id: claimantId,
          is_read: false
        })
        .select()
        .single();

      if (msgError) {
        throw msgError;
      }

      return { conversation, message };
    } catch (error) {
      try {
        if (conversationId) {
          await supabase.rpc('delete_empty_conversation', {
            p_conversation_id: conversationId
          });
        }
      } catch {
        // Best-effort cleanup only.
      }

      try {
        await releaseClaim();
      } catch {
        // Best-effort cleanup only.
      }

      throw error;
    }
  }

  // Get conversations for current user
  static async getUserConversations(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Get messages for a conversation
  static async getConversationMessages(conversationId: string, userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    
    // Filter out private messages that don't belong to current user
    return data.filter(message => 
      !message.private || (message.private && message.sender_id === userId)
    );
  }

  // Send a menu-based message
  static async sendMenuMessage(
    conversationId: string, 
    messageType: string, 
    content?: string,
    displayText?: string,
    userId?: string
  ) {
    const supabase = createClient();
    
    // Get current user
    let currentUser = null;
    if (userId) {
      currentUser = { id: userId };
    } else {
      const { data: userData } = await supabase.auth.getUser();
      currentUser = userData.user;
    }
    
    if (!currentUser) {
      console.error('No authenticated user found');
      throw new Error('Not authenticated');
    }
    // Generate display text if not provided
    const finalDisplayText = displayText || this.generateDisplayText(messageType, content);
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          message_type: messageType,
          content: content,
          display_text: finalDisplayText,
          sender_id: currentUser.id,
          is_read: false
        })
        .select()
        .single();
      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      return message;
    } catch (error) {
      console.error('Error in sendMenuMessage:', error);
      throw error;
    }
  }

  // Confirm meeting and create a private pickup code for the claimant
  static async confirmMeeting(conversationId: string, meetingDetails: string) {
    const supabase = createClient();

    // Parse meeting details (format: "Location, Time Slot")
    const [locationPart, ...timeParts] = meetingDetails.split(',');
    const location = locationPart?.trim();
    const timeSlot = timeParts.join(',').trim();

    if (!location || !timeSlot) {
      throw new Error('Meeting details must include a location and time slot');
    }

    const { error } = await supabase.rpc('confirm_meeting', {
      p_conversation_id: conversationId,
      p_meeting_details: meetingDetails,
      p_location: location,
      p_time_slot: timeSlot
    });

    if (error) {
      throw error;
    }

    return { confirmed: true };
  }

  // Confirm item pickup with verification code (called by finder ONLY)
  static async confirmPickup(conversationId: string, enteredCode: string) {
    const supabase = createClient();

    const { error } = await supabase.rpc('confirm_pickup', {
      p_conversation_id: conversationId,
      p_entered_code: enteredCode
    });

    if (error) {
      throw error;
    }
  }

  // Get pickup options
  static async getPickupOptions(optionType: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pickup_options')
      .select('*')
      .eq('option_type', optionType)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  }

  // Generate display text based on message type
  private static generateDisplayText(messageType: string, content?: string): string {
    const templates: Record<string, string> = {
      'claim_initial': 'Hello, I believe this is my lost item',
      'suggestion': `Suggested: ${content}`,
      'confirmation': `Confirmed: ${content}`,
      'share_contact': 'Shared contact information',
      'system': content || 'System message',
      'share_email': content || 'Shared email address'
    };
    return templates[messageType] || content || 'Message';
  }

  // Get user email from database
  static async getUserEmail(userId: string): Promise<string> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error getting user email:', error);
      throw new Error('Could not retrieve user email');
    }
    return data.email;
  }

  // Share contact information with email
  static async shareContact(conversationId: string, userId: string) {
    try {
      const userEmail = await this.getUserEmail(userId);
      const contactMessage = `My email address is: ${userEmail}`;
      
      await this.sendMenuMessage(
        conversationId,
        'share_email',
        contactMessage,
        contactMessage,
        userId
      );
    } catch (error) {
      console.error('Error sharing contact:', error);
      throw error;
    }
  }

  // Get other user ID in conversation
  static async getOtherUserId(conversationId: string, currentUserId: string): Promise<string | null> {
    const supabase = createClient();
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();
    if (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
    return conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id;
  }

  // Mark messages as read
  static async markMessagesAsRead(conversationId: string, userId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);
    if (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get unread message count for user
  static async getUnreadMessageCount(userId: string): Promise<number> {
    const supabase = createClient();
    
    // Get user's conversations
    const conversations = await this.getUserConversations(userId);
    if (conversations.length === 0) return 0;
    const conversationIds = conversations.map(conv => conv.id);
    
    // Count unread messages
    const { data, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false);
    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
    return data?.length || 0;
  }

  // Refresh conversation data
  static async refreshConversation(conversationId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (error) {
      console.error('Error refreshing conversation:', error);
      throw error;
    }
    
    return data;
  }

  // Get conversation by ID
  static async getConversationById(conversationId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    if (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
    return data;
  }

  // Check if user is part of conversation
  static async isUserInConversation(conversationId: string, userId: string): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();
    if (error) {
      console.error('Error checking conversation membership:', error);
      return false;
    }
    return data.user1_id === userId || data.user2_id === userId;
  }

  // Get conversation participants
  static async getConversationParticipants(conversationId: string) {
    const supabase = createClient();
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        user1_id,
        user2_id,
        profiles1:user1_id (id, username, email),
        profiles2:user2_id (id, username, email)
      `)
      .eq('id', conversationId)
      .single();
    if (error) {
      console.error('Error getting conversation participants:', error);
      throw error;
    }
    return {
      user1: conversation.profiles1,
      user2: conversation.profiles2
    };
  }

  // Send system message to both users
  static async sendSystemMessageToBoth(conversationId: string, message: string) {
    // Send system message (will be visible to both users)
    await this.sendMenuMessage(
      conversationId,
      'system',
      message,
      message
    );
  }

  // Update conversation status
  static async updateConversationStatus(conversationId: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('conversations')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
    if (error) {
      console.error('Error updating conversation status:', error);
      throw error;
    }
  }

  // Check if conversation exists and is active
  static async isConversationActive(conversationId: string): Promise<boolean> {
    try {
      const conversation = await this.getConversationById(conversationId);
      return conversation.status === 'active';
    } catch (error) {
      console.error('Error checking conversation status:', error);
      return false;
    }
  }

  // Get claimant pickup code
  static async getClaimantPickupCode(conversationId: string): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_claimant_pickup_code', {
      p_conversation_id: conversationId
    });

    if (error) {
      console.error('Error getting pickup code:', error);
      return null;
    }

    return data ? String(data) : null;
  }

}
