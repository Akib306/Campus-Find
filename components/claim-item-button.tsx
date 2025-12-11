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
  const [postData, setPostData] = useState<any>(null);

  useEffect(() => {
    fetchPostData();
  }, [postId, postOwnerId]);

  const fetchPostData = async () => {
    const supabase = createClient();
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, claimed_by_user_id, item_name')
      .eq('id', postId)
      .single();
    
    setPostData(post);
    
    if (post?.claimed_by_user_id) {
      setIsAlreadyClaimed(true);
    }
  };

  const handleClaimItem = async () => {
    try {
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

      // Determine the actual post owner
      const actualPostOwnerId = postOwnerId || postData?.user_id;
      
      if (!actualPostOwnerId) {
        alert('Error: Could not determine post owner. Please try again.');
        return;
      }

      if (user.id === actualPostOwnerId) {
        alert('You cannot claim your own item');
        return;
      }

      const result = await MessagingService.claimItem(
        postId,
        user.id,
        actualPostOwnerId
      );

      // Redirect to messaging page WITH the new conversation ID
      router.push(`/messaging?conversation=${result.conversation.id}`);
      router.refresh();
      
    } catch (error: any) {
      console.error('Error claiming item:', error);
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
