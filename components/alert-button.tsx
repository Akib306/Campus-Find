import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

export function AlertButton() {
  return (
    <Link href="/protected/alerts"> 
    <button className="p-2 hover:bg-muted bg-emerald-600 rounded-md">
        <PlusIcon className="inline-block mr-2"/>Create Alert
    </button>
    </Link>
  );
}