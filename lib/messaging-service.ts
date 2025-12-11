import { createClient } from '@/lib/supabase/client';

export interface Conversation {
  id: string;
  post_id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  arranged_location?: string;
  arranged_time?: string;
  claim_code?: string;
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
    try {
      console.log('🔄 Starting claim process...', { postId, claimantId, itemOwnerId });
      
      // Update posts table
      const { error: postError } = await supabase
        .from('posts')
        .update({
          claimed_by_user_id: claimantId,
          claimed_at: new Date().toISOString()
        })
        .eq('id', postId);
      if (postError) {
        console.error('❌ Post update error:', JSON.stringify(postError, null, 2));
        throw postError;
      }
      console.log('✅ Post updated successfully');
      
      // Create conversation
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
        console.error('❌ Conversation creation error:', JSON.stringify(convError, null, 2));
        throw convError;
      }
      console.log('✅ Conversation created:', conversation.id);
      
      // Send initial claim message using actual table schema
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
        console.error('❌ Message creation error:', JSON.stringify(msgError, null, 2));
        throw msgError;
      }
      console.log('✅ Initial message sent:', message.id);
      return { conversation, message };
    } catch (error) {
      console.error('❌ Error in claimItem:', JSON.stringify(error, null, 2));
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
    console.log('Sending message:', { conversationId, messageType, content, displayText, userId: currentUser.id });
    
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
      console.log('Message sent successfully:', message);
      
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

  // Confirm meeting and use existing claim code from posts
  static async confirmMeeting(conversationId: string, meetingDetails: string, userId: string) {
    const supabase = createClient();
    
    console.log('🔍 Getting existing claim code from post...');
    
    // First get the conversation to find the post_id
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('post_id')
      .eq('id', conversationId)
      .single();
    
    if (convError || !conversation) {
      console.error('❌ Error fetching conversation:', convError);
      throw new Error('Could not find conversation');
    }
    
    // Then get the claim_code from the posts table
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('claim_code')
      .eq('id', conversation.post_id)
      .single();
    
    if (postError || !post) {
      console.error('❌ Error fetching post:', postError);
      throw new Error('Could not find post');
    }
    
    if (!post.claim_code) {
      console.error('❌ No claim code found in post:', post);
      throw new Error('Post does not have a claim code');
    }
    
    // Use the existing claim code from the post
    const claimCode = post.claim_code;
    console.log('✅ Using existing claim code:', claimCode);
    
    // Parse meeting details (format: "Location, Time Slot")
    const [location, timeSlot] = meetingDetails.split(',').map(s => s.trim());
    
    console.log('🔄 Updating conversation with claim code...');
    
    // Update conversation with code and meeting details - with better error handling
    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({
        arranged_location: location,
        arranged_time: timeSlot,
        claim_code: claimCode, // Use existing code from post
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();
      
    if (updateError) {
      console.error('❌ Error updating conversation:', updateError);
      throw updateError;
    }
    
    console.log('✅ Conversation updated with claim code:', updatedConversation.claim_code);
    
    // Send confirmation message
    const confirmationText = `✅ Meeting Confirmed!\n📍 ${location}\n🕒 ${timeSlot}`;
    await this.sendMenuMessage(
      conversationId,
      'confirmation',
      meetingDetails,
      confirmationText,
      userId
    );
    
    // Get conversation to determine users
    const { data: finalConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (finalConversation) {
      try {
        // Send pickup code to the claimant (user who claimed the item)
        const claimantId = finalConversation.user2_id;
        const finderId = finalConversation.user1_id;
        
        // Send pickup code message to CLAIMANT (private system message)
        const codeMessage = `🔐 Your Pickup Code: ${claimCode}\n\nGive this 6-digit code to the finder when you meet to verify the return.`;
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            message_type: 'system',
            content: codeMessage,
            display_text: codeMessage,
            sender_id: claimantId, // Show as sent by claimant (but it's system)
            is_read: false,
            private: true // Mark as private so only claimant sees it
          });
        
        // Send instruction message to FINDER (private system message)
        const instructionMessage = `🔐 Please ask the claimant for the pickup code when you meet and enter it in the app to confirm the return.`;
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            message_type: 'system',
            content: instructionMessage,
            display_text: instructionMessage,
            sender_id: finderId, // Show as sent by finder (but it's system)
            is_read: false,
            private: true // Mark as private so only finder sees it
          });
          
        console.log('✅ Private system messages sent');
      } catch (systemMessageError) {
        console.error('Error sending system messages:', systemMessageError);
        // Don't throw here - the main confirmation was successful
        // Just log the error but continue
      }
    }
    
    return { claimCode };
  }

  // Confirm item pickup with verification code (called by finder ONLY)
  static async confirmPickup(conversationId: string, enteredCode: string, userId: string) {
    const supabase = createClient();
    
    console.log('🔐 Verifying pickup code:', { 
      conversationId, 
      enteredCode
    });
    
    // Get the conversation with claim_code
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('claim_code, user1_id')
      .eq('id', conversationId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching conversation:', fetchError);
      throw new Error('Conversation not found');
    }
    
    // Verify user is the finder (user1_id)
    if (conversation.user1_id !== userId) {
      throw new Error('Only the item owner can confirm pickup');
    }
    
    console.log('📋 Stored claim_code:', conversation.claim_code);
    
    // Clean both codes for comparison (remove any non-digits)
    const cleanEnteredCode = enteredCode.replace(/\D/g, '').trim();
    const cleanStoredCode = conversation.claim_code ? 
      conversation.claim_code.toString().replace(/\D/g, '').trim() : '';
    
    console.log('🔍 Code comparison:', {
      cleanedEntered: cleanEnteredCode,
      cleanedStored: cleanStoredCode,
      match: cleanEnteredCode === cleanStoredCode
    });
    
    // Verify code matches
    if (!cleanStoredCode || cleanEnteredCode !== cleanStoredCode) {
      throw new Error('Invalid pickup code');
    }
    
    // Update conversation
    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({
        item_picked_up: true,
        picked_up_at: new Date().toISOString(),
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();
      
    if (updateError) {
      console.error('❌ Error updating conversation:', updateError);
      throw new Error('Error updating conversation');
    }
    
    console.log('✅ Pickup confirmed successfully');
    
    // Send verification completed message to both users
    const completionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const completionText = `✅ Verification completed! Item successfully returned.\nReturn confirmed at ${completionTime}`;
    
    await this.sendMenuMessage(
      conversationId,
      'system',
      completionText,
      completionText
    );
    
    return updatedConversation;
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
      'claim_initial': '👋 Hello, I believe this is my lost item',
      'suggestion': `📍 Suggested: ${content}`,
      'confirmation': `✅ Confirmed: ${content}`,
      'share_contact': '📞 Shared contact information',
      'system': content || '📢 System message',
      'share_email': content || '📧 Shared email address'
    };
    return templates[messageType] || content || '💬 Message';
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
      const contactMessage = `📧 My email address is: ${userEmail}`;
      
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
    const supabase = createClient();
    
    // Get conversation participants
    const participants = await this.getConversationParticipants(conversationId);
    
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
  static async getClaimantPickupCode(conversationId: string, userId: string): Promise<string | null> {
    const supabase = createClient();
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('claim_code, user2_id')
      .eq('id', conversationId)
      .single();
    if (error) {
      console.error('Error getting pickup code:', error);
      return null;
    }
    // Only return the code if the current user is the claimant
    if (conversation.user2_id === userId) {
      return conversation.claim_code;
    }
    return null;
  }

  // Debug method to check conversation data
  static async debugConversation(conversationId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (error) {
      console.error('Debug error:', error);
      return null;
    }
    
    console.log('🔍 Conversation debug:', data);
    return data;
  }
}
