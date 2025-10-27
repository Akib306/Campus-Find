import { NotificationBell } from "@/components/notification-bell"
import { Header } from "@/components/header"

export default function NotificationPage() {
    return (
        <main className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-lg">This is a testing page for notifcations.</p>
            </div>
        </main>
    );
}