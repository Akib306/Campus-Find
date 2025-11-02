import Link from "next/link";
import { NotificationBell } from "./notification-bell";

export function Header() {
    return (
        <header className="h-[rem]">
            <nav className="flex justify-between align-middle p-4 border-b">
                <div>
                    <Link href="/">
                    </Link>
                </div>
                <div>
                    <NotificationBell />
                </div>
            </nav>
        </header>
    )
}