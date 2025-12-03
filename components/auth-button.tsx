"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { NavAvatar } from "./ui/nav-avatar";

export type UserInfo = { email: string; avatarUrl: string | null } | null;

export function AuthButton({ initialUser }: { initialUser?: UserInfo } = {}) {
  const supabase = useMemo(() => createClient(), []);
  const [userInfo, setUserInfo] = useState<UserInfo>(initialUser ?? null);

  // Keep in sync if server-provided initial user changes across navigations
  useEffect(() => {
    if (initialUser !== undefined) {
      setUserInfo(initialUser ?? null);
    }
  }, [initialUser]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (isMounted) setUserInfo(null);
        return;
      }
      let avatarUrl: string | null = null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      avatarUrl = profile?.avatar_url ?? null;
      if (isMounted) {
        setUserInfo({ email: user.email ?? "", avatarUrl });
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  if (userInfo) {
    return (
      <div className="flex items-center gap-4">
        <NavAvatar user={userInfo} />
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
