import { createClient } from '@/lib/supabase/client';

export interface Conversation {
  id: string;
  item_id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  arranged_location?: string;
  arranged_time?: string;
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
  static async claimItem(itemId: string, claimantId: string, itemOwnerId: string) {
    const supabase = createClient();

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        item_id: itemId,
        user1_id: itemOwnerId, // Item owner
        user2_id: claimantId,  // Claimant
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
    displayText?: string
  ) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
      'share_contact': 'Shared contact information'
    };

    return templates[messageType] || content || 'Message';
  }
}
