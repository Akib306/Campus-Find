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


export function NotificationBell() {
// test empty
// const notifications = [];

// Sample notifications
  const notifications = [
    { 
      id: "1", 
      user_id: "random-user-id",
      message: "Possible match found for your lost item", 
      type: "in_app",
      link: "url-to-item",
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 min ago
    },
    { 
      id: "2", 
      user_id: "random-user-id",
      message: "New item posted matching your search", 
      type: "both",
      link: "url-to-item",
      is_read: true,
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
    },
    { 
      id: "3", 
      user_id: "random-user-id",
      message: "Your item has been marked as found", 
      type: "email",
      link: "url-to-item",
      is_read: true,
      created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString() // 9 hours ago
    },
  ];

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
      <DropdownMenuContent align="end" className="w-80"> 
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
            <DropdownMenuItem key={notification.id}>
              {!notification.is_read && (<span className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1.5" />)}
              {notification.message}
              <span className="text-xs text-muted-foreground mr-2">
              {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center justify-center cursor-pointer">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
