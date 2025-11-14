import { LogoutButton } from "../logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu";

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
        <DropdownMenuContent side="bottom" align="end" className="bg-card">
            <DropdownMenuLabel>Hey, {user.email}!</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-start">
              <LogoutButton />
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
    </div>
  );
}