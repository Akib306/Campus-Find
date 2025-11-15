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
import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

type AlertItem = {
    id: string;
    user_id: string;
    categories: string;
    keywords: string[];
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
    
    const deleteAlert = async (alertId: string) => {
        const { error } = await supabase 
            .from('user_alerts')
            .delete()
            .eq('id', alertId);
        
        if (error) {
            console.error("Error deleting alert:", error);
        } else {
            setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));
        }
    }



  return (
    <div className={cn("flex justify-center w-full")}>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            Active Alerts
            <span className="text-sm font-normal text-muted-foreground">
              ({alerts.length}/5)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto">
            { loading ? (
                <p className="text-muted-foreground">Loading alerts...</p>
            ) : alerts.length === 0 ? (
                <p className="text-muted-foreground">No alerts yet. Create your first alert to get started!</p>
            ) : (
                <div className="space-y-4">
                    {alerts.map((alert) => (
                        <Card key={alert.id}>
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between gap-4 p-4">
                                    {/* Alert Details */}
                                    <div className="flex-1 space-y-1">
                                        <h3 className="font-semibold">{alert.categories}</h3>
                                        {alert.keywords && alert.keywords.length > 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                Keywords: {alert.keywords.join(', ')}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Created: {new Date(alert.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex gap-2">
                                        <Button variant="destructive" size="icon" onClick={() => deleteAlert(alert.id)} title="Delete Alert">
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
        }
                
          
        </CardContent>
      </Card>
    </div>
  );
}