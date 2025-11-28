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
  user1_profile?: UserProfile | null;
  user2_profile?: UserProfile | null;
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
  sender_profile?: UserProfile | null;
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

    // Update the post status
    const { error: postError } = await supabase
      .from('posts')
      .update({
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
        user1_id: itemOwnerId,
        user2_id: claimantId,
        status: 'active'
      })
      .select(`
        *,
        user1_profile:user1_id(username, email),
        user2_profile:user2_id(username, email)
      `)
      .single();

    if (convError) throw convError;

    // Get claimant profile for personalized message
    const { data: claimantProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', claimantId)
      .single();

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

  // Get conversations for current user with profiles
  static async getUserConversations(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1_profile:user1_id(username, email),
        user2_profile:user2_id(username, email)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get messages for a conversation with sender profiles
  static async getConversationMessages(conversationId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender_profile:sender_id(username, email)
      `)
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
      .select(`
        *,
        sender_profile:sender_id(username, email)
      `)
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return message;
  }

  // Confirm meeting and generate pickup code with personalized messages
  static async confirmMeeting(conversationId: string, meetingDetails: string, userId: string) {
    const supabase = createClient();

    // Get conversation with user profiles
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        user1_profile:user1_id(username, email),
        user2_profile:user2_id(username, email)
      `)
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    // Generate pickup code
    const claimCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update conversation with code
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        arranged_location: this.extractLocation(meetingDetails),
        arranged_time: this.extractTime(meetingDetails),
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

    if (postError) throw postError;

    // Determine user roles
    const currentUserIsUser1 = userId === conversation.user1_id;
    const otherUserProfile = currentUserIsUser1 ? conversation.user2_profile : conversation.user1_profile;
    const currentUserProfile = currentUserIsUser1 ? conversation.user1_profile : conversation.user2_profile;

    // Send confirmation message to both users
    const confirmationText = `Confirmed! ${meetingDetails}`;
    await this.sendMenuMessage(
      conversationId,
      'confirmation',
      meetingDetails,
      confirmationText,
      userId
    );

    // Send personalized code messages
    if (currentUserIsUser1) {
      // User1 (Finder) confirmed - User2 (Owner) gets code
      await this.sendMenuMessage(
        conversationId,
        'system',
        `Your pickup code: ${claimCode}\n*Give this code to ${conversation.user1_profile?.username || 'the finder'} when you meet*`,
        `Your pickup code: ${claimCode}\n*Give this code to ${conversation.user1_profile?.username || 'the finder'} when you meet*`,
        userId
      );
      
      // User1 (Finder) gets instructions
      await this.sendMenuMessage(
        conversationId,
        'system', 
        `*Ask ${conversation.user2_profile?.username || 'the owner'} for the pickup code to verify return*`,
        `*Ask ${conversation.user2_profile?.username || 'the owner'} for the pickup code to verify return*`,
        userId
      );
    } else {
      // User2 (Owner) confirmed - User2 gets code
      await this.sendMenuMessage(
        conversationId,
        'system',
        `Your pickup code: ${claimCode}\n*Give this code to ${conversation.user1_profile?.username || 'the finder'} when you meet*`,
        `Your pickup code: ${claimCode}\n*Give this code to ${conversation.user1_profile?.username || 'the finder'} when you meet*`,
        userId
      );
      
      // User1 (Finder) gets instructions  
      await this.sendMenuMessage(
        conversationId,
        'system',
        `*Ask ${conversation.user2_profile?.username || 'the owner'} for the pickup code to verify return*`,
        `*Ask ${conversation.user2_profile?.username || 'the owner'} for the pickup code to verify return*`,
        userId
      );
    }

    return { conversation, claimCode };
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

    // Send verification completed message
    await this.sendMenuMessage(
      conversationId,
      'system',
      `Verification completed! Item successfully returned.\nReturn confirmed at ${new Date().toLocaleTimeString()}`,
      `Verification completed! Item successfully returned.\nReturn confirmed at ${new Date().toLocaleTimeString()}`,
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

  // Helper function to extract location from meeting details
  private static extractLocation(meetingDetails: string): string {
    const parts = meetingDetails.split(',');
    return parts[0]?.trim() || '';
  }

  // Helper function to extract time from meeting details  
  private static extractTime(meetingDetails: string): string {
    const parts = meetingDetails.split(',');
    return parts.slice(1).join(',').trim() || '';
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
