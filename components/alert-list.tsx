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
import { useEffect, useMemo, useState } from "react";

type AlertItem = {
    id: string;
    user_id: string;
    category: string;
    keyword: string;
    created_at: string;
};
export function AlertList() {
    const supabase = useMemo(() => createClient(), []);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || !isMounted) return;
                    
                const { data } = await supabase
                    .from('user_alerts')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (isMounted) setAlerts(data || []);
            } catch (error) {
                console.error("Error loading alerts:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [supabase]);
    




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