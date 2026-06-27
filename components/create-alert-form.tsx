"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export function CreateAlertForm({ onAlertCreated }: { onAlertCreated?: () => void }) {
    const [category, setCategory] = useState("");
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreation = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!category) {
            toast.error("Please select a category.");
            return;
        }
        
        const supabase = createClient();
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) 
                throw new Error("User not authenticated");

            // Check current alert count
            const { count } = await supabase
                .from('user_alerts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const MAX_ALERTS = 5; // Limit to 5 alerts per user
            
            if (count !== null && count >= MAX_ALERTS) {
                toast.error(`You can only have ${MAX_ALERTS} active alerts. Please delete an existing alert first.`);
                setIsLoading(false);
                return;
            }

            // Split keywords by comma and trim whitespace
            const keywordsArray = keyword.split(',').map(k => k.trim()).filter(k => k);

            const { error } = await supabase.from('user_alerts').insert([{
                user_id: user.id,
                categories: category,      
                keywords: keywordsArray,   
            }]);
            
            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }
            
            // Reset form
            setCategory("");
            setKeyword("");
            
            // Trigger refresh of alert list if callback exists
            onAlertCreated?.();
            toast.success("Alert created.");
        } catch (error: unknown) {
            console.error("Error creating alert:", error);
            toast.error("Failed to create alert. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <div className={cn("flex flex-row gap-6")}>
      <Card>
        <CardHeader>
          <CardDescription>
            Set up an alert to get notified when a new post matches your criteria.
          </CardDescription>
          <p className="text-xs text-muted-foreground mt-2">
            Note: (*) Required field.
            Leave keywords empty to receive all posts in the selected category.
          </p>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleCreation}>
                <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={category} onValueChange={setCategory} required>
                            <SelectTrigger id="category" className="w-full bg-background">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="electronic">Electronic</SelectItem>
                                <SelectItem value="stationery">Stationery</SelectItem>
                                <SelectItem value="book">Book</SelectItem>
                                <SelectItem value="clothing">Clothing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="keywords">Keywords</Label>
                        <Input
                            id="keywords"
                            placeholder="e.g., laptop, sofa"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Alert"}
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
