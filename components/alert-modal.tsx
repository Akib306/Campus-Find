"use client";

import { useState } from "react";
import { Button } from "./ui/button";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

import { CreateAlertForm } from "./create-alert-form";
import { AlertList } from "./alert-list";

export function AlertModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAlertCreated = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button type="button" size="sm" className="text-sm">View Alerts</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[650px] flex flex-shrink-0">
                <div className="w-[220px] flex-shrink-0">
                    <CreateAlertForm onAlertCreated={handleAlertCreated} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                    <AlertList key={refreshKey} /> 
                </div>
            </DialogContent>
        </Dialog>
    )
}