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
  // Claim an item and start conversation with pickup code
  static async claimItem(postId: string, claimantId: string, itemOwnerId: string) {
    const supabase = createClient();

    // Generate a random 6-digit claim code
    const claimCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update the post with claim information
    const { error: postError } = await supabase
      .from('posts')
      .update({
        claim_code: claimCode,
        claimed_by_user_id: claimantId,
        claimed_at: new Date().toISOString(),
        post_status: 'pending_claim'
      })
      .eq('id', postId);

    if (postError) throw postError;

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        post_id: postId,
        user1_id: itemOwnerId, // Item owner (who posted)
        user2_id: claimantId,  // Claimant (who clicked "THIS IS MINE!")
        status: 'active',
        claim_code: claimCode
      })
      .select()
      .single();

    if (convError) throw convError;

    // Send initial claim message with pickup code
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        message_type: 'claim_initial',
        display_text: `Hello, I believe this is my lost item. Pickup code: ${claimCode}`,
        sender_id: claimantId
      })
      .select()
      .single();

    if (msgError) throw msgError;

    return { conversation, message, claimCode };
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

    // Update the post status
    const { error: postError } = await supabase
      .from('posts')
      .update({
        post_status: 'claimed'
      })
      .eq('id', conversation.post_id);

    if (postError) throw postError;

    // Send confirmation message
    await this.sendMenuMessage(
      conversationId,
      'status_update',
      `Item successfully picked up and returned! ✅`,
      `✅ Item pickup confirmed! Return completed at ${new Date().toLocaleTimeString()}`,
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
      'confirmation': `✅ Confirmed! ${content}`,
      'status_update': `Status: ${content}`,
      'share_contact': 'Shared contact information'
    };

    return templates[messageType] || content || 'Message';
  }
}
