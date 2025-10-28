"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,             // container
  DropdownMenuTrigger,      // button that triggers the menu
  DropdownMenuContent,      // the content of the dropdown
  DropdownMenuItem,         // individual item
  DropdownMenuLabel,        // label for the dropdown
  DropdownMenuSeparator,    // separator between items
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type NotificationItem = {
  id: string;
  user_id: string;
  message: string;
  type: string;
  link: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const supabase = createClient();

  // Function to mark a notification as read
  const markRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  };

  // Once component has rendered in the client, fetch notifications
  useEffect(() => {
    async function fetchNotifications() {

      const {data: { user } } = await supabase.auth.getUser();
      
      // Check if user is authenticated
      if (!user) return;
      
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
      setIsLoading(false);

      // Subscribe to real-time notifications
      const channel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`  // Only YOUR notifications
          },
          (payload) => {
              setNotifications(prev => [payload.new as NotificationItem, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Remove deleted notification
            setNotifications(prev => 
              prev.filter(n => n.id !== payload.old.id)
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Update notification in state
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? (payload.new as NotificationItem) : n)
            );
          }
        )
        .subscribe();
      }
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length; // Count of unread notifications

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild> 
        <button className="relative p-2 hover:bg-accent rounded-md">

          <Bell size={20} />

          {/* A badge, visible only when there are unread notifications. */}
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">{unreadCount}</Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      {/* Dropdown content showing notifications */}
      <DropdownMenuContent align="end" className="w-80">
        {/* Label and separator */}
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* 
            If there are no notifications display a message indicating so,
            otherwise display the notifications dropdown items 
        */}
        {notifications.length === 0 ? (
          <DropdownMenuItem>No new notifications</DropdownMenuItem>
        ) : (
          notifications.map(notification => (
            <DropdownMenuItem key={notification.id} className="flex flex-column items-start p-2" onClick={() => markRead(notification.id)}> {/* On click of a notification object mark as read */}
                <div className="flex items-center w-full">
                    {!notification.is_read && (<span className="h-2 w-2 bg-blue-500 rounded-full mr-2" />)}
                    {notification.message}
                </div> 
                <span className="text-xs text-muted-foreground mt-1 ml-4">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator/>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
