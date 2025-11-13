import { CreateAlertForm } from "@/components/create-alert-form";
import { AlertList } from "@/components/alert-list";


export default function AlertsPage() {
  return (
    <div className="flex-1 w-full flex gap-6">
      {/* Left side - Compact Create Alert Form */}
      <div className="w-80 flex-shrink-0">
        <CreateAlertForm />
      </div>
      
      {/* Right side - Alert List takes remaining space */}
      <div className="flex-1">
        <AlertList />
      </div>
    </div>
  );
}