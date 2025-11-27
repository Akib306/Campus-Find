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
      console.log('🔧 1. Claim button clicked');
      
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Auth error:', JSON.stringify(userError, null, 2));
        return;
      }
      
      if (!user) {
        alert('Please log in to claim an item');
        return;
      }

      console.log('👤 2. User authenticated:', user.id);
      console.log('📝 3. Post ID:', postId);
      console.log('👑 4. Post Owner:', postOwnerId);

      // User cannot claim their own item
      if (user.id === postOwnerId) {
        alert('You cannot claim your own item');
        return;
      }

      console.log('🚀 5. Calling MessagingService.claimItem...');

      // Start the conversation and generate pickup code
      const result = await MessagingService.claimItem(
        postId,
        user.id,
        postOwnerId
      );

      console.log('✅ 6. Claim successful:', result);

      // Redirect to messaging page with the new conversation
      console.log('🔄 7. Redirecting to messaging page...');
      router.push('/messaging');
      router.refresh(); // Force refresh to show new conversation
      
    } catch (error: any) {
      console.error('❌ 8. Error claiming item:', JSON.stringify(error, null, 2));
      console.error('❌ Full error object:', error);
      alert('Error claiming item: ' + (error.message || 'Please try again.'));
    }
  };

  return (
    <button
      onClick={handleClaimItem}
      className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${className}`}
    >
      THIS IS MINE!
    </button>
  );
}
