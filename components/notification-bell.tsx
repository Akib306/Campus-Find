"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Sample notifications
export function NotificationBell() {
  const notifications = [
    { 
      id: "1", 
      user_id: "random-user-id",
      message: "Possible match found for your lost item", 
      type: "in_app",
      link: "/listings/123",
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 min ago
    },
    { 
      id: "2", 
      user_id: "random-user-id",
      message: "New item posted matching your search", 
      type: "both",
      link: "/listings/456",
      is_read: false,
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
    },
    { 
      id: "3", 
      user_id: "random-user-id",
      message: "Your item has been marked as found", 
      type: "email",
      link: "/listings/789",
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

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center justify-center cursor-pointer">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
