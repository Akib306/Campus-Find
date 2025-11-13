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
import { useState } from "react";
import { Istok_Web } from "next/font/google";
import { is } from "date-fns/locale";

export function CreateAlertForm() {
    const [category, setCategory] = useState("");
    const [keyword, setKeyword] = useState("");
    const [location, setLocation] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreation = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) 
                throw new Error("User not authenticated");

            const { error } = await supabase.from('user_alerts').insert([{
                user_id: user.id,
                category,
                keyword,
                location,
            }]);
            if (error) 
                throw error;

            setCategory("");
            setKeyword("");
            setLocation("");
        } catch (error: unknown) {
            console.error("Error creating alert:", error);
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <div className={cn("flex flex-row gap-6")}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Alert</CardTitle>
          <CardDescription>
            Set up an alert to get notified when a new listing matches your criteria.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleCreation}>
                <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                            id="category"
                            placeholder="e.g., Electronics, Furniture"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
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
