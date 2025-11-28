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
}

export interface PickupOption {
  id: string;
  option_type: string;
  value: string;
  display_text: string;
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
  static async getConversationMessages(conversationId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
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

  // Confirm meeting and generate pickup code
  static async confirmMeeting(conversationId: string, meetingDetails: string, userId: string) {
    const supabase = createClient();
    
    // Parse meeting details (format: "Location, Time Slot")
    const [location, timeSlot] = meetingDetails.split(',').map(s => s.trim());
    
    // Generate pickup code
    const claimCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Confirming meeting:', { conversationId, location, timeSlot, claimCode });

    // Update conversation with code and meeting details
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        arranged_location: location,
        arranged_time: timeSlot,
        claim_code: claimCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      throw updateError;
    }

    // Send confirmation message
    const confirmationText = `✅ Confirmed! ${meetingDetails}`;
    await this.sendMenuMessage(
      conversationId,
      'confirmation',
      meetingDetails,
      confirmationText,
      userId
    );

    // Get conversation to determine users
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (conversation) {
      // Send pickup code to the claimant (user who should have the code)
      const claimantId = conversation.user2_id; // The one who claimed the item
      if (userId === claimantId) {
        const codeMessage = `Your pickup code: ${claimCode}\n\nGive this code to the other person when you meet to verify the return.`;
        await this.sendMenuMessage(
          conversationId,
          'system',
          codeMessage,
          codeMessage,
          userId
        );
      }

      // Send instruction to the item owner (user who should ask for the code)
      const ownerId = conversation.user1_id; // The one who posted the item
      if (userId === ownerId) {
        const instructionMessage = `Ask for the pickup code when you meet to verify the item return.`;
        await this.sendMenuMessage(
          conversationId,
          'system',
          instructionMessage,
          instructionMessage,
          userId
        );
      }
    }

    return { claimCode };
  }

  // Confirm item pickup with verification code
  static async confirmPickup(conversationId: string, claimCode: string, userId: string) {
    const supabase = createClient();
    
    // Verify the claim code and update conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .update({
        item_picked_up: true,
        picked_up_at: new Date().toISOString(),
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('claim_code', claimCode)
      .select()
      .single();

    if (convError) throw new Error('Invalid pickup code or conversation');

    // Send verification completed message
    const completionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const completionText = `✅ Verification completed! Item successfully returned.\nReturn confirmed at ${completionTime}`;
    
    await this.sendMenuMessage(
      conversationId,
      'system',
      completionText,
      completionText,
      userId
    );

    return conversation;
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
      'system': content || '📢 System message'
    };
    return templates[messageType] || content || '💬 Message';
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
}
