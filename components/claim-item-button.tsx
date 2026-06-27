'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { MessagingService } from '@/lib/messaging-service';

interface PostData {
  user_id: string;
  claimed_by_user_id: string | null;
  item_name: string;
}

interface ClaimItemButtonProps {
  postId: string;
  postOwnerId: string;
  className?: string;
}

export function ClaimItemButton({ postId, postOwnerId, className = '' }: ClaimItemButtonProps) {
  const router = useRouter();
  const [isAlreadyClaimed, setIsAlreadyClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [postData, setPostData] = useState<PostData | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPostData = async () => {
      const supabase = createClient();
      const { data: post } = await supabase
        .from('posts')
        .select('user_id, claimed_by_user_id, item_name')
        .eq('id', postId)
        .single();

      if (!isMounted) return;
      setPostData(post);

      if (post?.claimed_by_user_id) {
        setIsAlreadyClaimed(true);
      }
    };

    void fetchPostData();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleClaimItem = async () => {
    try {
      setIsClaiming(true);
      if (isAlreadyClaimed) {
        toast.error('This item has already been claimed by someone else.');
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in to claim an item.');
        return;
      }

      // Determine the actual post owner
      const actualPostOwnerId = postOwnerId || postData?.user_id;
      
      if (!actualPostOwnerId) {
        toast.error('Could not determine the post owner. Please try again.');
        return;
      }

      if (user.id === actualPostOwnerId) {
        toast.error('You cannot claim your own item.');
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
      
    } catch (error: unknown) {
      console.error('Error claiming item:', error);
      const message =
        error instanceof Error ? error.message : 'Please try again.';
      toast.error(`Error claiming item: ${message}`);
    } finally {
      setIsClaiming(false);
    }
  };

  if (isAlreadyClaimed) {
    return (
      <Button
        type="button"
        variant="secondary"
        disabled
        className={className}
      >
        Already Claimed
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleClaimItem}
      disabled={isClaiming}
      className={className}
    >
      {isClaiming ? 'Claiming...' : 'This is mine'}
    </Button>
  );
}
