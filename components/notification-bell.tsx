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
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Button } from "./ui/button";

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
  const supabase = useMemo(() => createClient(), []);

  // Function to mark a notification as read
  const markRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  };

  // Once component has rendered in the client, fetch notifications
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (isMounted) setNotifications(data || []);

      channel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (!isMounted) return;
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
            if (!isMounted) return;
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
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
            if (!isMounted) return;
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? (payload.new as NotificationItem) : n));
          }
        )
        .subscribe();
    }

    fetchNotifications();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  async function createNotification() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

      await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            message: "This is a test notification",
            type: "in-app",
            link: "/listings/test1",
            is_read: false,
            created_at: new Date().toISOString(),
          }
        ]);
    }
  const unreadCount = notifications.filter(n => !n.is_read).length; // Count of unread notifications

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild> 
        <Button variant="ghost" className="relative px-0 hover:bg-accent rounded-md">

          <Bell className="size-8" />
          {/* A badge, visible only when there are unread notifications. */}
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">{unreadCount}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* Dropdown content showing notifications */}
      <DropdownMenuContent side="bottom" align="end" className="w-80 max-h-96 overflow-y-auto bg-card ">
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
            <Link href={notification.link} key={notification.id}> 
            <DropdownMenuItem className="flex flex-column items-start p-2" onClick={() => markRead(notification.id)}> {/* On click of a notification object mark as read */}
                <div className="flex items-center w-full">
                    {!notification.is_read && (<span className="h-2 w-2 bg-blue-500 rounded-full mr-2" />)}
                    {notification.message}
                </div> 
                <span className="text-xs text-muted-foreground mt-1 ml-4">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
            </DropdownMenuItem>
            </Link>
          ))
        )}
        <DropdownMenuSeparator/>
        <button className="p-2 hover:bg-accent bg-emerald-600 rounded-md" onClick={createNotification}>Create Notification</button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
