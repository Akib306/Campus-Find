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

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (!email.endsWith("@usask.ca")) {
      setError("Invalid email domain. Please use your @usask.ca email address.");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    // Enforce allowed characters: A-Z, a-z, 0-9, _, .
    if (!/^[A-Za-z0-9._]+$/.test(password)) {
      setError(
        "Password can only contain letters, numbers, underscores, and dots (A-Z, a-z, 0-9, _, .)"
      );
      setIsLoading(false);
      return;
    }

    try {
      // Prevent redirecting to success when the email is already registered.
      // We can safely query profiles (RLS allows public read) because it mirrors auth.users.
      const { data: existingProfiles, error: existingLookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (!existingLookupError && existingProfiles && existingProfiles.length > 0) {
        setError("An account with this email already exists. Please log in.");
        setIsLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Exchange the confirmation code for a cookie session, then send user to landing.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      if (signUpError) throw signUpError;
      router.push(`/auth/sign-up-success?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      // Provide a clearer message when the email is already registered
      if (err && typeof err === "object" && "message" in err) {
        const message = String((err as { message?: string }).message || "");
        if (/already\s+(registered|exists)/i.test(message)) {
          setError(
            "An account with this email already exists. Please log in."
          );
        } else {
          setError(message || "An error occurred");
        }
      } else {
        setError("An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-card/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Sign up with your USask email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="abc123@usask.ca"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  title="Password must be at least 8 characters long and can only contain letters, numbers, underscores, and dots (A-Z, a-z, 0-9, _ , .)"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  title="Password must be at least 8 characters long and can only contain letters, numbers, underscores, and dots (A-Z, a-z, 0-9, _ , .)"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
