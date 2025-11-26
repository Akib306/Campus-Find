'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessagingService } from '@/lib/messaging-service';

interface ClaimItemButtonProps {
  postId: string;
  postOwnerId: string;
  className?: string;
}

export function ClaimItemButton({ postId, postOwnerId, className = '' }: ClaimItemButtonProps) {
  const router = useRouter();

  const handleClaimItem = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in to claim an item');
        return;
      }

      // User cannot claim their own item
      if (user.id === postOwnerId) {
        alert('You cannot claim your own item');
        return;
      }

      // Start the conversation and generate pickup code
      const { conversation, claimCode } = await MessagingService.claimItem(
        postId,
        user.id,
        postOwnerId
      );

      // Redirect to messaging page with the new conversation
      router.push('/messaging');
      
    } catch (error) {
      console.error('Error claiming item:', error);
      alert('Error claiming item. Please try again.');
    }
  };

  return (
    <button
      onClick={handleClaimItem}
      className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ${className}`}
    >
      THIS IS MINE!
    </button>
  );
}
