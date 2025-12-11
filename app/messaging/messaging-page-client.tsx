"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessagingService, Conversation } from "@/lib/messaging-service";
import { MessagingConversationList } from "@/components/messaging-conversation-list";
import { MessagingChatInterface } from "@/components/messaging-chat-interface";
import type { User } from "@supabase/supabase-js";

export function MessagingPageClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const loadUserAndConversations = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const userConversations = await MessagingService.getUserConversations(
          user.id,
        );
        setConversations(userConversations);

        // Auto-select conversation from URL parameter
        const conversationId = searchParams.get("conversation");
        if (conversationId) {
          const conversationToSelect = userConversations.find(
            (conv) => conv.id === conversationId,
          );
          if (conversationToSelect) {
            setSelectedConversation(conversationToSelect);
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    void loadUserAndConversations();
  }, [loadUserAndConversations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-lg text-muted-foreground">
          Please log in to view messages
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl text-foreground">
      <h1 className="text-3xl font-bold mb-2">Messages</h1>
      <p className="text-muted-foreground mb-6">
        Coordinate item returns with other users
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Conversations */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Your Conversations ({conversations.length})
            </h2>
          </div>
          <MessagingConversationList
            conversations={conversations}
            onSelectConversation={setSelectedConversation}
            currentConversationId={selectedConversation?.id}
          />
        </div>

        {/* Right Side - Chat Interface */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">
            {selectedConversation ? "Chat" : "Select a Conversation"}
          </h2>

          {selectedConversation ? (
            <MessagingChatInterface
              conversation={selectedConversation}
              currentUser={user}
            />
          ) : (
            <div className="border border-dashed border-border rounded-lg p-8 text-center bg-card">
              <div className="text-muted-foreground">
                Select a conversation from the list to start messaging.
                <br />
                <span className="text-sm">
                  Claim an item on the listings page to start a new
                  conversation.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

