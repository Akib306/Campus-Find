import { LogoutButton } from "../logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { NotificationBell } from "../notification-bell";

type NavAvatarUser = {
  email: string;
  avatarUrl?: string | null;
};

export function NavAvatar({ user }: { user: NavAvatarUser }) {
  const fallback = user.email ? user.email.charAt(0).toUpperCase() : "?";

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar>
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.email} />
            )}
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <NotificationBell />
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
    </div>
  );
}