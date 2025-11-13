import Link from "next/link";
import { Button } from "./ui/button";

export function AlertButton() {
  return (
    <div>
      <Link href="/alert"> 
      <Button className="p-2 bg-emerald-600 rounded-md">Alerts</Button>
      </Link>
    </div>
  );
}