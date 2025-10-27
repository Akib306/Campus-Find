import { NotificationBell } from "@/components/notification-bell"

export default function NotificationPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center">
            <NotificationBell />
            {/* <h1 className="text-3xl font-bold mb-4">Notifications</h1> */}
            <p className="text-lg">This is a testing page for notifcations.</p>
        </main>
    );
}