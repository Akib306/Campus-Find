'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessagingService } from '@/lib/messaging-service';
import { useState, useEffect } from 'react';

interface ClaimItemButtonProps {
  postId: string;
  postOwnerId: string;
  className?: string;
}

export function ClaimItemButton({ postId, postOwnerId, className = '' }: ClaimItemButtonProps) {
  const router = useRouter();
  const [isAlreadyClaimed, setIsAlreadyClaimed] = useState(false);

  useEffect(() => {
    console.log('📋 ClaimItemButton props:', { postId, postOwnerId });
    checkIfClaimed();
  }, [postId, postOwnerId]);

  const checkIfClaimed = async () => {
    const supabase = createClient();
    const { data: post } = await supabase
      .from('posts')
      .select('claimed_by_user_id, user_id')
      .eq('id', postId)
      .single();
    
    console.log('📝 Post data:', post);
    
    if (post?.claimed_by_user_id) {
      setIsAlreadyClaimed(true);
    }
  };

  const handleClaimItem = async () => {
    try {
      console.log('🔧 Claim button clicked');
      console.log('📦 Props received:', { postId, postOwnerId });
      
      if (isAlreadyClaimed) {
        alert('This item has already been claimed by someone else.');
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in to claim an item');
        return;
      }

      console.log('👤 Current user:', user.id);
      console.log('👑 Post owner from props:', postOwnerId);

      if (user.id === postOwnerId) {
        alert('You cannot claim your own item');
        return;
      }

      // Double check the post owner from database
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      console.log('🔍 Post owner from database:', post?.user_id);

      const actualPostOwnerId = postOwnerId || post?.user_id;
      
      if (!actualPostOwnerId) {
        alert('Error: Could not determine post owner');
        return;
      }

      console.log('🚀 Calling MessagingService.claimItem with:', {
        postId,
        claimantId: user.id,
        itemOwnerId: actualPostOwnerId
      });

      const result = await MessagingService.claimItem(
        postId,
        user.id,
        actualPostOwnerId
      );

      console.log('✅ NEW CONVERSATION CREATED:', result.conversation);
      
      router.push('/messaging');
      router.refresh();
      
    } catch (error: any) {
      console.error('❌ Error claiming item:', error);
      alert('Error claiming item: ' + (error.message || 'Please try again.'));
    }
  };

  if (isAlreadyClaimed) {
    return (
      <button
        disabled
        className={`px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed ${className}`}
      >
        Already Claimed
      </button>
    );
  }

  return (
    <button
      onClick={handleClaimItem}
      className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${className}`}
    >
      THIS IS MINE!
    </button>
  );
}
