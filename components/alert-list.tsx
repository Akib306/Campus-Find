"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AlertList() {
  return (
    <div className={cn("flex flex-row gap-6")}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          
        </CardContent>
      </Card>
    </div>
  );
}