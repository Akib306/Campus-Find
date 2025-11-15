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
import { useState, JSX } from "react";

export function CreateAlertForm(): JSX.Element {
    const [category, setCategory] = useState("");
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // categories for alerts
    const categories = [
        "Electronics",
        "Clothing & Accessories",
        "Books & Supplies",
        "Keys & Cards",
        "Personal Items",
        "Sports Equipment",
        "Other"
    ];

    const handleCreation = async (e: React.FormEvent) => {
        e.preventDefault();
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
                alert(`You can only have ${MAX_ALERTS} active alerts. Please delete an existing alert first.`);
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
            
            window.location.reload();
        } catch (error: unknown) {
            console.error("Error creating alert:", error);
            alert("Failed to create alert. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <div className={cn("flex flex-row gap-6")}>
      <Card>
        <CardHeader>
          <CardDescription>
            Set up an alert to get notified when a new listing matches your criteria.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleCreation}>
                <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                            id="category"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
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

