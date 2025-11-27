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
      // Update posts table
      const { error: postError } = await supabase
        .from('posts')
        .update({
          claimed_by_user_id: claimantId,
          claimed_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (postError) console.log('Posts update warning:', postError.message);

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

      if (convError) throw convError;

      // Send initial claim message
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          message_type: 'claim_initial',
          display_text: 'Hello, I believe this is my lost item',
          sender_id: claimantId
        })
        .select()
        .single();

      if (msgError) throw msgError;

      return { conversation, message };
    } catch (error) {
      console.error('Error in claimItem:', error);
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
    let user = null;
    
    if (userId) {
      user = { id: userId };
    } else {
      const { data: userData } = await supabase.auth.getUser();
      user = userData.user;
    }
    
    if (!user) throw new Error('Not authenticated');

    const finalDisplayText = displayText || this.generateDisplayText(messageType, content);

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        message_type: messageType,
        content,
        display_text: finalDisplayText,
        sender_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return message;
  }

  // Confirm meeting and generate pickup code
  static async confirmMeeting(conversationId: string, meetingDetails: string, userId: string) {
    const supabase = createClient();

    // Get conversation to find post_id
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('post_id')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    // Generate pickup code
    const claimCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update conversation with code
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        arranged_location: meetingDetails.split(',')[0]?.trim() || '',
        arranged_time: meetingDetails.split(',').slice(1).join(',').trim() || '',
        claim_code: claimCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    // Update the post with pickup code
    const { error: postError } = await supabase
      .from('posts')
      .update({
        claim_code: claimCode
      })
      .eq('id', conversation.post_id);

    if (postError) console.log('Post code update warning:', postError.message);

    // Send confirmation message
    const confirmationText = `Confirmed! ${meetingDetails}`;
    await this.sendMenuMessage(
      conversationId,
      'confirmation',
      meetingDetails,
      confirmationText,
      userId
    );

    // Send code message
    await this.sendMenuMessage(
      conversationId,
      'system',
      `Pickup code: ${claimCode}\n*Share this code when you meet*`,
      `Pickup code: ${claimCode}\n*Share this code when you meet*`,
      userId
    );

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
        status: 'completed'
      })
      .eq('id', conversationId)
      .eq('claim_code', claimCode)
      .select()
      .single();

    if (convError) throw new Error('Invalid pickup code or conversation');

    // Send verification completed message
    await this.sendMenuMessage(
      conversationId,
      'system',
      `Verification completed! Item successfully returned.`,
      `Verification completed! Item successfully returned.`,
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
      'claim_initial': 'Hello, I believe this is my lost item',
      'suggestion': `Suggested: ${content}`,
      'confirmation': `Confirmed! ${content}`,
      'status_update': `Status: ${content}`,
      'share_contact': 'Shared contact information',
      'system': content || 'System message'
    };

    return templates[messageType] || content || 'Message';
  }
}
